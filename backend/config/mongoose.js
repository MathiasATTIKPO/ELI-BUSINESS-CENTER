const mongoose = require('mongoose');

// Every request is gated by connectDatabase(). Do not let model operations
// silently wait in Mongoose's 10-second buffer when a serverless topology is
// unavailable.
mongoose.set('bufferCommands', false);

module.exports = mongoose;
