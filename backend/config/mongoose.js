const mongoose = require('mongoose');

// Vercel can briefly freeze a warm MongoDB topology between two requests.
// Keep a short buffer so an operation started during that transition can
// resume after reconnection, but never fall back to Mongoose's 10-second
// default wait.
mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 3000);

module.exports = mongoose;
