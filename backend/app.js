const mongoose = require('./config/mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 4001;

const parseFrontendOrigins = () => {
  const raw = process.env.FRONTEND_URLS || '';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  ...parseFrontendOrigins(),
];

if (process.env.NGROK_URL && !ALLOWED_ORIGINS.includes(process.env.NGROK_URL)) {
  ALLOWED_ORIGINS.push(process.env.NGROK_URL);
}
if (process.env.API_URL && !ALLOWED_ORIGINS.includes(process.env.API_URL)) {
  ALLOWED_ORIGINS.push(process.env.API_URL);
}
if (process.env.TUNNEL_URL && !ALLOWED_ORIGINS.includes(process.env.TUNNEL_URL)) {
  ALLOWED_ORIGINS.push(process.env.TUNNEL_URL);
}

const getSwaggerServers = () => {
  const servers = [];

  servers.push({
    url: `http://localhost:${PORT}`,
    description: 'Development server',
  });

  if (process.env.NGROK_URL) {
    servers.push({
      url: process.env.NGROK_URL,
      description: 'ngrok tunnel',
    });
  }

  if (process.env.API_URL) {
    servers.push({
      url: process.env.API_URL,
      description: 'Production server',
    });
  }

  if (process.env.VERCEL_URL) {
    servers.push({
      url: `https://${process.env.VERCEL_URL}`,
      description: 'Vercel deployment',
    });
  }

  return servers;
};

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ELI Business Center API',
    version: '1.0.0',
    description: 'API for ELI Business Center',
    contact: {
      name: 'ELI Business Center Support',
    },
  },
  servers: getSwaggerServers(),
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, 'routes', '*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

const productsRoutes = require('./routes/products');
const repairRoutes = require('./routes/repair');
const tradeinRoutes = require('./routes/tradein');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const resellerRoutes = require('./routes/reseller');
const vipRoutes = require('./routes/vip');
const cashierRoutes = require('./routes/cashier');
const invoiceRoutes = require('./routes/invoice');
const technicianRoutes = require('./routes/technician');
const notificationRoutes = require('./routes/notifications');
const accountRoutes = require('./routes/account');
const adminController = require('./controllers/adminController');
const clientRoutes = require('./routes/clientRoutes');
const skillRoutes = require('./routes/skill');
const settingsRoutes = require('./routes/setting');
const { getDatabaseStatus, connectDatabase, ensureSeedData } = require('./bootstrap');

const app = express();

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('http', 'Request completed', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (origin.endsWith('.loca.lt')) {
      return callback(null, true);
    }

    if (origin.endsWith('.ngrok-free.app')) {
      return callback(null, true);
    }

    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} non autorisee par CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const DATABASE_BYPASS_PATHS = new Set([
  '/api',
  '/api/health',
  '/api/db-status',
  '/api/notifications/vapid-public-key',
]);

const getOriginalPathname = (req) => {
  const pathname = String(req.originalUrl || req.url || '').split('?')[0];
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
};

// Run the database readiness check in the same Express chain as the model
// operation. This removes the serverless bootstrap/route gap during which a
// frozen MongoDB topology could become disconnected again.
app.use('/api', async (req, res, next) => {
  const pathname = getOriginalPathname(req);

  if (req.method === 'OPTIONS' || DATABASE_BYPASS_PATHS.has(pathname)) {
    return next();
  }

  try {
    await connectDatabase();

    if (mongoose.connection.readyState !== 1) {
      const error = new Error('MongoDB connection is not ready for queries');
      error.code = 'MONGOOSE_NOT_READY';
      throw error;
    }

    const unavailableModel = Object.values(mongoose.models).find(
      (model) => model.db !== mongoose.connection || model.db.readyState !== 1
    );
    if (unavailableModel) {
      const error = new Error(`MongoDB model ${unavailableModel.modelName} is not attached to the ready connection`);
      error.code = 'MONGOOSE_MODEL_NOT_READY';
      throw error;
    }

    if (!process.env.VERCEL || process.env.VERCEL_ENABLE_SEED === 'true') {
      await ensureSeedData();
    }

    return next();
  } catch (error) {
    const database = getDatabaseStatus();

    logger.error('db', 'Database unavailable before API route', {
      method: req.method,
      path: pathname,
      readyState: database.readyState,
      code: error.code || null,
      message: error.message,
    });

    res.set('Retry-After', '3');
    return res.status(503).json({
      success: false,
      data: {
        code: 'DATABASE_UNAVAILABLE',
        retryable: true,
      },
      message: 'Base de donnees temporairement indisponible. Veuillez reessayer.',
    });
  }
});

app.use('/api/products', productsRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/tradein', tradeinRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/setting', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reseller', resellerRoutes);
app.use('/api/vip', vipRoutes);
app.post('/api/client/repairs', adminController.createRepairFromClient);
app.post('/api/client/tradeins', adminController.createTradeinFromClient);
app.use('/api/client', clientRoutes);
app.use('/api/skills', skillRoutes);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const bundledClientDistPath = path.join(__dirname, 'public-web');
const workspaceClientDistPath = path.join(__dirname, '..', 'client', 'dist');
const clientDistPath = fs.existsSync(path.join(bundledClientDistPath, 'index.html'))
  ? bundledClientDistPath
  : workspaceClientDistPath;
const bundledAdminDistPath = path.join(bundledClientDistPath, 'admin');
const workspaceAdminDistPath = path.join(__dirname, '..', 'admin', 'dist');
const adminDistPath = fs.existsSync(path.join(bundledAdminDistPath, 'index.html'))
  ? bundledAdminDistPath
  : workspaceAdminDistPath;

app.get('/', (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }

  res.json({
    success: true,
    data: {
      service: 'eli-business-center-backend',
      docs: '/api-docs',
      health: '/api/health',
      dbStatus: '/api/db-status',
    },
    message: 'Backend API is online',
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'eli-business-center-backend',
      docs: '/api-docs',
      health: '/api/health',
      dbStatus: '/api/db-status',
    },
    message: 'Backend API is online',
  });
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end();
});

app.get('/api/health', (req, res) => {
  connectDatabase()
    .then(() => {
      const db = getDatabaseStatus();
      logger.info('health', 'Health check requested', { databaseConnected: db.connected, readyState: db.readyState });

      res.json({
        success: true,
        data: {
          api: 'running',
          database: db,
        },
        message: db.connected ? 'API and MongoDB are running' : 'API is running but MongoDB is not connected',
      });
    })
    .catch((error) => {
      const db = getDatabaseStatus();
      logger.error('health', 'Health check failed while connecting to MongoDB', { message: error.message });

      res.status(503).json({
        success: false,
        data: {
          api: 'running',
          database: db,
          error: error.message,
        },
        message: error.message,
      });
    });
});

app.get('/api/db-status', (req, res) => {
  connectDatabase()
    .then(() => {
      const db = getDatabaseStatus();
      logger.info('db', 'Database status requested', { connected: db.connected, readyState: db.readyState, host: db.host, name: db.name });

      res.status(db.connected ? 200 : 503).json({
        success: db.connected,
        data: db,
        message: db.connected ? 'MongoDB connected' : 'MongoDB disconnected',
      });
    })
    .catch((error) => {
      const db = getDatabaseStatus();
      logger.error('db', 'Database status request failed while connecting to MongoDB', { message: error.message });

      res.status(503).json({
        success: false,
        data: {
          ...db,
          error: error.message,
        },
        message: error.message,
      });
    });
});

const immutableAssetOptions = {
  immutable: true,
  maxAge: '1y',
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
};

if (fs.existsSync(adminDistPath)) {
  const adminAssetsPath = path.join(adminDistPath, 'assets');
  if (fs.existsSync(adminAssetsPath)) {
    app.use('/admin/assets', express.static(adminAssetsPath, immutableAssetOptions));
  }
  app.use('/admin', express.static(adminDistPath));
  app.get(
    [
      '/admin',
      '/admin/*',
      '/cashier',
      '/cashier/*',
      '/technician',
      '/technician/*',
      '/vip',
      '/vip/*',
      '/reseller',
      '/reseller/*',
    ],
    (req, res) => res.sendFile(path.join(adminDistPath, 'index.html'))
  );
}

if (fs.existsSync(clientDistPath)) {
  const clientAssetsPath = path.join(clientDistPath, 'assets');
  if (fs.existsSync(clientAssetsPath)) {
    app.use('/assets', express.static(clientAssetsPath, immutableAssetOptions));
  }
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('http', 'Unhandled server error', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });
  res.status(500).json({ success: false, data: null, message: err.message || 'Server error' });
});

module.exports = { app };
