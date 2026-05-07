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
  role: { type: String, enum: ['admin', 'technician', 'cashier'], default: 'technician' },
  skills: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  workingHours: { type: [workingHourSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', employeeSchema);
