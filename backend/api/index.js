module.exports = async (req, res) => {
  try {
    const logger = require('../utils/logger');
    const { app } = require('../app');
    const { connectDatabase, ensureSeedData } = require('../bootstrap');

    await connectDatabase();

    if (!process.env.VERCEL || process.env.VERCEL_ENABLE_SEED === 'true') {
      await ensureSeedData();
    }

    return app(req, res);
  } catch (error) {
    // Logger may fail to import if dependencies are broken, fallback to console.
    try {
      const logger = require('../utils/logger');
      logger.error('startup', 'Serverless bootstrap failed', {
        message: error.message,
        stack: error.stack,
      });
    } catch (logError) {
      console.error('Serverless bootstrap failed:', error && error.stack ? error.stack : error);
      console.error('Logger bootstrap failed:', logError && logError.stack ? logError.stack : logError);
    }

    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Server initialization failed',
    });
  }
};
