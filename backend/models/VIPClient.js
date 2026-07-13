const mongoose = require('mongoose');

const vipClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String },
  whatsapp: { type: String },
  email: { type: String },
  isActive: { type: Boolean, default: true },
  monthlyLimit: { type: Number, default: 0 },
  billingCycleDay: { type: Number, default: 1 },
  notes: { type: String, default: '' },
  // Password reset / first-login flags
  forcePasswordChange: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('VIPClient', vipClientSchema);
