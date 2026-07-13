const { app } = require('../app');
const { connectDatabase, ensureSeedData } = require('../bootstrap');

module.exports = async (req, res) => {
  try {
    await connectDatabase();
    await ensureSeedData();
    return app(req, res);
  } catch (error) {
    console.error('Serverless bootstrap failed:', error.message);
    return res.status(500).json({ success: false, data: null, message: 'Server initialization failed' });
  }
};
