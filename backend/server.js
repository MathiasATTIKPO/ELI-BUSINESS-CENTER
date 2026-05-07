const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 4001;
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL || 'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://localhost:5175',
  'http://127.0.0.1:5175'
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

// Déterminer le serveur Swagger basé sur les variables d'environnement
const getSwaggerServers = () => {
  const servers = [];
  
  // Serveur de développement local
  servers.push({
    url: `http://localhost:${PORT}`,
    description: 'Development server',
  });
  
  // Ajouter ngrok si disponible
  if (process.env.NGROK_URL) {
    servers.push({
      url: process.env.NGROK_URL,
      description: 'ngrok tunnel',
    });
  }
  
  // Ajouter URL personnalisée si disponible
  if (process.env.API_URL) {
    servers.push({
      url: process.env.API_URL,
      description: 'Production server',
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
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);

const productsRoutes = require('./routes/products');
const repairRoutes = require('./routes/repair');
const tradeinRoutes = require('./routes/tradein');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const invoiceRoutes = require('./routes/invoice');
const technicianRoutes = require('./routes/technician');
const Employee = require('./models/Employee');
const bcrypt = require('bcryptjs');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser tools such as server-side requests
      return callback(null, true);
    }
    // Allow localtunnel domains (*.loca.lt)
    if (origin.endsWith('.loca.lt')) {
      return callback(null, true);
    }
    // Allow ngrok domains (*.ngrok-free.app)
    if (origin.endsWith('.ngrok-free.app')) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} non autorisée par CORS`));
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
app.use('/api/invoice', invoiceRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: null, message: 'API is running' });
});

const adminDistPath = path.join(__dirname, '..', 'admin', 'dist');
if (fs.existsSync(adminDistPath)) {
  app.use(express.static(adminDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err.stack || err.message);
  res.status(500).json({ success: false, data: null, message: err.message || 'Server error' });
});

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eli_business_center';

// Fonction pour créer un technicien par défaut
const createDefaultTechnician = async () => {
  try {
    const existingTechnician = await Employee.findOne({ role: 'technician' });
    if (!existingTechnician) {
      const defaultTechnician = {
        name: "Technicien Par Défaut",
        phone: "+2280102030405",
        email: "tech@elis.com",
        password: bcrypt.hashSync("tech123", 10),
        role: "technician",
        skills: ["écran", "batterie", "carte mère"],
        isActive: true
      };

      await Employee.create(defaultTechnician);
      console.log('✅ Technicien par défaut créé avec succès');
      console.log('   Email: tech@elis.com');
      console.log('   Mot de passe: tech123');
    } else {
      //console.log('ℹ️  Un technicien existe déjà dans la base de données');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du technicien par défaut:', error.message);
  }
};

mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
   // console.log(`Connected to MongoDB at ${mongoUri}`);

    // Créer le technicien par défaut si nécessaire
    await createDefaultTechnician();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at: http://localhost:${PORT}/api-docs`);
      console.log('To access the platform online, run in another terminal: npm run tunnel');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
