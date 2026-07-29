module.exports = async (req, res) => {
  try {
    const { app } = require('../app');

    // Express returns before asynchronous route handlers have sent their
    // response. Keep the Vercel invocation alive until the response is
    // complete so the runtime is not frozen in the meantime. Database-backed
    // routes are gated inside Express, immediately before their handlers.
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
