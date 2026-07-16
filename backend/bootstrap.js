const mongoose = require('mongoose');
const RepairRequest = require('./models/RepairRequest');
const TradeinRequest = require('./models/TradeinRequest');
const ResellerContract = require('./models/ResellerContract');
const notificationService = require('./services/notificationService');
const logger = require('./utils/logger');

const shouldRunMaintenanceSeed = () => process.env.ENABLE_MAINTENANCE_SEED === 'true';

const normalizeMongoUri = (value) => {
  if (!value) return value;
  return String(value).trim().replace(/^"|"$/g, '');
};

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return normalizeMongoUri(process.env.MONGO_URI);
  }

  if (process.env.MONGODB_URI) {
    return normalizeMongoUri(process.env.MONGODB_URI);
  }

  throw new Error('MONGO_URI (or MONGODB_URI) is missing. Configure an Atlas connection string in environment variables');
};

const state = {
  dbConnected: false,
  seedDone: false,
  lastAttemptAt: null,
  lastConnectedAt: null,
  lastError: null,
};

const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;

  return {
    readyState,
    connected: readyState === 1,
    connecting: readyState === 2,
    disconnecting: readyState === 3,
    disconnected: readyState === 0,
    host: mongoose.connection?.host || null,
    name: mongoose.connection?.name || null,
    stateFromBootstrap: state.dbConnected,
    lastAttemptAt: state.lastAttemptAt,
    lastConnectedAt: state.lastConnectedAt,
    lastError: state.lastError,
  };
};

let connectPromise = null;
let connectionEventsAttached = false;

const attachConnectionDiagnostics = () => {
  if (connectionEventsAttached) {
    return;
  }

  connectionEventsAttached = true;

  mongoose.connection.on('connected', () => {
    state.dbConnected = true;
    state.lastConnectedAt = new Date().toISOString();
    state.lastError = null;
    logger.info('db', 'Mongoose connection event: connected', {
      host: mongoose.connection?.host || null,
      name: mongoose.connection?.name || null,
    });
  });

  mongoose.connection.on('disconnected', () => {
    state.dbConnected = false;
    logger.warn('db', 'Mongoose connection event: disconnected');
  });

  mongoose.connection.on('error', (error) => {
    state.lastError = error.message;
    logger.error('db', 'Mongoose connection event: error', { message: error.message });
  });
};

const connectDatabase = async () => {
  attachConnectionDiagnostics();

  if (state.dbConnected || mongoose.connection.readyState === 1) {
    state.dbConnected = true;
    return mongoose.connection;
  }

  const mongoUri = getMongoUri();

  if (!connectPromise) {
    state.lastAttemptAt = new Date().toISOString();
    state.lastError = null;

    connectPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 8000,
        family: 4,
        tls: true,
      })
      .then(() => {
        state.dbConnected = true;
        state.lastConnectedAt = new Date().toISOString();
        state.lastError = null;
        const host = mongoose.connection?.host || 'unknown-host';
        const dbName = mongoose.connection?.name || 'unknown-db';
        logger.info('db', 'MongoDB connected', { host, dbName, readyState: mongoose.connection.readyState });
        return mongoose.connection;
      })
      .catch((error) => {
        connectPromise = null;
        state.lastError = error.message;
        logger.error('db', 'MongoDB connection failed', { message: error.message });
        throw error;
      });
  }

  return connectPromise;
};

const migrateVipSettledStatuses = async () => {
  const [repairStatusResult, billingStatusResult] = await Promise.all([
    RepairRequest.updateMany(
      { isVip: true, status: 'paid' },
      { $set: { status: 'soldee' } }
    ),
    RepairRequest.updateMany(
      { isVip: true, 'vipBilling.status': 'paid' },
      { $set: { 'vipBilling.status': 'soldee' } }
    ),
  ]);

  const updatedRepairs = Number(repairStatusResult.modifiedCount || repairStatusResult.nModified || 0);
  const updatedBilling = Number(billingStatusResult.modifiedCount || billingStatusResult.nModified || 0);

  if (updatedRepairs || updatedBilling) {
    logger.info('seed', 'VIP paid statuses migrated to soldee', {
      updatedRepairs,
      updatedBilling,
    });
  }
};

const backfillAdminPendingNotifications = async () => {
  const [pendingRepairs, pendingTradeins, pendingContracts] = await Promise.all([
    RepairRequest.find({ status: 'pending' }).select('_id clientName deviceModel').limit(100),
    TradeinRequest.find({ status: 'pending' }).select('_id clientName deviceModel').limit(100),
    ResellerContract.find({ status: { $in: ['pending', 'approved'] } }).select('_id number').limit(100),
  ]);

  let created = 0;

  for (const repair of pendingRepairs) {
    const result = await notificationService.createNotification({
      recipientId: 'role:admin',
      recipientRole: 'admin',
      type: 'repair_pending',
      title: 'Nouvelle demande de réparation',
      message: `Nouvelle demande de réparation pour ${repair.deviceModel || 'appareil'} par ${repair.clientName || 'Client'}`,
      requestId: repair._id,
      clientName: repair.clientName || 'Client',
      reference: repair._id.toString().slice(-6),
    });
    if (result) created += 1;
  }

  for (const tradein of pendingTradeins) {
    const result = await notificationService.createNotification({
      recipientId: 'role:admin',
      recipientRole: 'admin',
      type: 'tradein_pending',
      title: 'Nouvelle demande d\'échange',
      message: `Nouvelle demande d'échange pour ${tradein.deviceModel || 'appareil'} par ${tradein.clientName || 'Client'}`,
      requestId: tradein._id,
      clientName: tradein.clientName || 'Client',
      reference: tradein._id.toString().slice(-6),
    });
    if (result) created += 1;
  }

  for (const contract of pendingContracts) {
    const result = await notificationService.createNotification({
      recipientId: 'role:admin',
      recipientRole: 'admin',
      type: 'contract_created',
      title: 'Nouveau contrat revendeur',
      message: `Contrat ${contract.number || contract._id.toString().slice(-6)} créé`,
      requestId: contract._id,
      clientName: '',
      reference: contract.number || contract._id.toString().slice(-6),
    });
    if (result) created += 1;
  }

  if (created > 0) {
    logger.info('seed', 'Admin pending notifications backfilled', { created });
  }
};

const ensureSeedData = async () => {
  if (state.seedDone) {
    logger.debug('seed', 'Seed already completed, skipping');
    return;
  }

  if (!shouldRunMaintenanceSeed()) {
    logger.info('seed', 'Maintenance seed disabled (set ENABLE_MAINTENANCE_SEED=true to enable)');
    state.seedDone = true;
    return;
  }

  logger.info('seed', 'Starting maintenance seed');
  await migrateVipSettledStatuses();
  await backfillAdminPendingNotifications();
  state.seedDone = true;
  logger.info('seed', 'Maintenance seed completed');
};

const startBackgroundJobs = () => {
  if (process.env.VERCEL) {
    logger.info('jobs', 'Background jobs disabled in Vercel runtime');
    return;
  }

  try {
    const contractExpiryJob = require('./jobs/contractExpiryJob');
    contractExpiryJob.start();
    logger.info('jobs', 'Contract expiry job started');

    const vipMonthlyInvoiceJob = require('./jobs/vipMonthlyInvoiceJob');
    vipMonthlyInvoiceJob.start();
    logger.info('jobs', 'VIP monthly invoice job started');
  } catch (error) {
    logger.error('jobs', 'Failed to start background jobs', { message: error.message });
  }
};

module.exports = {
  connectDatabase,
  ensureSeedData,
  startBackgroundJobs,
  getDatabaseStatus,
};
