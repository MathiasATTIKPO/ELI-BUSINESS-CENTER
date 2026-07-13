const mongoose = require('mongoose');

const vipRepairSchema = new mongoose.Schema({
  vipClient: { type: mongoose.Schema.Types.ObjectId, ref: 'VIPClient', required: true },
  deviceModel: { type: String, required: true },
  imei: { type: String },
  issue: { type: String },
  diagnostic: { type: String },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  parts: { type: [String], default: [] },
  cost: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  warrantyDays: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'assigned', 'diagnosing', 'repairing', 'ready', 'completed', 'cancelled'], default: 'pending' },
  history: { type: [Object], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VIPRepair', vipRepairSchema);
