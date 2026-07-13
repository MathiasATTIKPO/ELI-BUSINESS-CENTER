const mongoose = require('mongoose');

const resellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String },
  whatsapp: { type: String },
  email: { type: String },
  forcePasswordChange: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  identity: {
    idNumber: { type: String, default: '' },
    idExpiryDate: { type: Date, default: null },
    idFrontUrl: { type: String, default: '' },
    idBackUrl: { type: String, default: '' },
    isValid: { type: Boolean, default: false },
    validatedAt: { type: Date, default: null }
  },
  stats: {
    withdrawnCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
    totalGenerated: { type: Number, default: 0 },
    totalToReturn: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('Reseller', resellerSchema);
