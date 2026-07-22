const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { app } = require('./app');
const { connectDatabase, ensureSeedData, startBackgroundJobs } = require('./bootstrap');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4001;

const startServer = async () => {
  try {
    logger.info('startup', 'Backend bootstrap started', {
      env: process.env.VERCEL ? 'vercel' : 'local',
      port: PORT,
    });

    await connectDatabase();
    await ensureSeedData();

    app.listen(PORT, () => {
      logger.info('startup', 'HTTP server started', {
        port: PORT,
        docs: `http://localhost:${PORT}/api-docs`,
      });
    });

    startBackgroundJobs();
  } catch (error) {
    logger.error('startup', 'MongoDB connection error', { message: error.message });
    process.exit(1);
  }
};

// ⚠️ Important : ne lancer le serveur que si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

// ✅ Exporter l'app pour Vercel (serverless)
module.exports = app;