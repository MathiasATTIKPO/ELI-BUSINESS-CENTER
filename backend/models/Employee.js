const mongoose = require('mongoose');

const workingHourSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  totalHours: { type: Number, required: true }
});

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  forcePasswordChange: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  role: { type: String, enum: ['super_admin', 'admin', 'commercial_manager', 'technician', 'cashier'], default: 'technician' },
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
  isActive: { type: Boolean, default: true },
  workingHours: { type: [workingHourSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', employeeSchema);
