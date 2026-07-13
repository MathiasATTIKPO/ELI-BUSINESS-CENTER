const { app } = require('../app');
const { connectDatabase, ensureSeedData } = require('../bootstrap');
const logger = require('../utils/logger');

module.exports = async (req, res) => {
  try {
    await connectDatabase();

    if (!process.env.VERCEL || process.env.VERCEL_ENABLE_SEED === 'true') {
      await ensureSeedData();
    }

    return app(req, res);
  } catch (error) {
    logger.error('startup', 'Serverless bootstrap failed', { message: error.message });
    return res.status(500).json({ success: false, data: null, message: 'Server initialization failed' });
  }
};
