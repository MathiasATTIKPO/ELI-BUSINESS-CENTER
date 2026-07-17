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
const adminController = require('./controllers/adminController');
const clientRoutes = require('./routes/clientRoutes');
const { getDatabaseStatus, connectDatabase } = require('./bootstrap');

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

app.use('/api/products', productsRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/tradein', tradeinRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reseller', resellerRoutes);
app.use('/api/vip', vipRoutes);
app.post('/api/client/repairs', adminController.createRepairFromClient);
app.post('/api/client/tradeins', adminController.createTradeinFromClient);
app.use('/api/client', clientRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
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

const adminDistPath = path.join(__dirname, '..', 'admin', 'dist');
if (fs.existsSync(adminDistPath)) {
  app.use(express.static(adminDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(adminDistPath, 'index.html'));
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
