const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Employee = require('./models/Employee');

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  if (process.env.VERCEL) {
    throw new Error('MONGO_URI is missing in Vercel environment variables');
  }

  return 'mongodb://127.0.0.1:27017/eli_business_center';
};

const state = {
  dbConnected: false,
  seedDone: false,
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
  };
};

let connectPromise = null;

const connectDatabase = async () => {
  if (state.dbConnected || mongoose.connection.readyState === 1) {
    state.dbConnected = true;
    return mongoose.connection;
  }

  const mongoUri = getMongoUri();

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      })
      .then(() => {
        state.dbConnected = true;
        const host = mongoose.connection?.host || 'unknown-host';
        const dbName = mongoose.connection?.name || 'unknown-db';
        console.log(`MongoDB connected: ${host}/${dbName}`);
        return mongoose.connection;
      })
      .catch((error) => {
        connectPromise = null;
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
    console.log('Technicien par defaut cree avec succes');
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
    console.log('Caissier par defaut cree avec succes');
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
      console.log(`Produit ajoute: ${productData.brand} ${productData.name}`);
    }
  }
};

const ensureSeedData = async () => {
  if (state.seedDone) {
    return;
  }

  await createDefaultEmployees();
  await createDefaultProducts();
  state.seedDone = true;
};

const startBackgroundJobs = () => {
  if (process.env.VERCEL) {
    return;
  }

  try {
    const contractExpiryJob = require('./jobs/contractExpiryJob');
    contractExpiryJob.start();
    console.log('Contract expiry job started');

    const vipMonthlyInvoiceJob = require('./jobs/vipMonthlyInvoiceJob');
    vipMonthlyInvoiceJob.start();
    console.log('VIP monthly invoice job started');
  } catch (error) {
    console.error('Failed to start background jobs:', error.message);
  }
};

module.exports = {
  connectDatabase,
  ensureSeedData,
  startBackgroundJobs,
  getDatabaseStatus,
};
