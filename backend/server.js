const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { app } = require('./app');
const { connectDatabase, ensureSeedData, startBackgroundJobs } = require('./bootstrap');

const PORT = process.env.PORT || 4001;

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureSeedData();

    app.listen(PORT, () => {
      console.log(`Swagger docs available at: http://localhost:${PORT}/api-docs`);
    });

    startBackgroundJobs();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
