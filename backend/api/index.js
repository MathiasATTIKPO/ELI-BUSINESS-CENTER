module.exports = async (req, res) => {
  try {
    const logger = require('../utils/logger');
    const { app } = require('../app');
    const { connectDatabase, ensureSeedData } = require('../bootstrap');

    const pathname = String(req.url || '').split('?')[0];
    const selfManagedDatabasePaths = new Set(['/api/health', '/api/db-status']);
    const requiresDatabase = pathname.startsWith('/api/')
      && req.method !== 'OPTIONS'
      && !selfManagedDatabasePaths.has(pathname)
      && pathname !== '/api/notifications/vapid-public-key';

    // Static frontend assets and SPA navigation must remain available even
    // during a temporary database outage.
    if (requiresDatabase) {
      await connectDatabase();

      if (!process.env.VERCEL || process.env.VERCEL_ENABLE_SEED === 'true') {
        await ensureSeedData();
      }
    }

    // Express returns before asynchronous route handlers have sent their
    // response. Keep the Vercel invocation alive until the response is
    // complete so the MongoDB connection is not frozen in the meantime.
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        res.removeListener('finish', finish);
        res.removeListener('close', finish);
      };
      const finish = () => {
        cleanup();
        resolve();
      };

      res.once('finish', finish);
      res.once('close', finish);

      try {
        app(req, res);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    return undefined;
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

    return res.status(503).json({
      success: false,
      data: null,
      message: error.message || 'Server initialization failed',
    });
  }
};
