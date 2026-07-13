const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Employee = require('./models/Employee');
const logger = require('./utils/logger');

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

const createDefaultEmployees = async () => {
  const existingTechnician = await Employee.findOne({ role: 'technician' });
  if (!existingTechnician) {
    const defaultTechnician = {
      name: 'Technicien Par Defaut',
      phone: '+2280102030405',
      email: 'tech@elis.com',
      password: bcrypt.hashSync('tech123', 10),
      role: 'technician',
      skills: ['ecran', 'batterie', 'carte mere'],
      isActive: true,
    };

    await Employee.create(defaultTechnician);
    logger.info('seed', 'Default technician created', { email: defaultTechnician.email, role: defaultTechnician.role });
  }

  const existingCashier = await Employee.findOne({ role: 'cashier' });
  if (!existingCashier) {
    const defaultCashier = {
      name: 'Caissier Par Defaut',
      phone: '+2280506070809',
      email: 'cashier@elis.com',
      password: bcrypt.hashSync('cashier123', 10),
      role: 'cashier',
      skills: [],
      isActive: true,
    };

    await Employee.create(defaultCashier);
    logger.info('seed', 'Default cashier created', { email: defaultCashier.email, role: defaultCashier.role });
  }
};

const createDefaultProducts = async () => {
  const defaultProducts = [
    { name: 'iPhone 14', brand: 'Apple', price: 740000, stock: 12, active: true },
    { name: 'iPhone 14 Pro', brand: 'Apple', price: 980000, stock: 10, active: true },
    { name: 'iPhone 15', brand: 'Apple', price: 1120000, stock: 8, active: true },
    { name: 'Galaxy S23', brand: 'Samsung', price: 650000, stock: 14, active: true },
    { name: 'Galaxy S23 Ultra', brand: 'Samsung', price: 980000, stock: 9, active: true },
    { name: 'Galaxy A54', brand: 'Samsung', price: 330000, stock: 16, active: true },
  ];

  for (const productData of defaultProducts) {
    const existing = await Product.findOne({ name: productData.name, brand: productData.brand });
    if (!existing) {
      await Product.create(productData);
      logger.info('seed', 'Default product created', { brand: productData.brand, name: productData.name, price: productData.price });
    }
  }
};

const ensureSeedData = async () => {
  if (state.seedDone) {
    logger.debug('seed', 'Seed already completed, skipping');
    return;
  }

  logger.info('seed', 'Starting default data seed');
  await createDefaultEmployees();
  await createDefaultProducts();
  state.seedDone = true;
  logger.info('seed', 'Default data seed completed');
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
