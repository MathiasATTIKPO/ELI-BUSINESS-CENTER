const mongoose = require('mongoose');

const repairRequestSchema = new mongoose.Schema({
  clientName: { type: String, trim: true },
  clientWhatsapp: { type: String, required: true, trim: true },
  deviceModel: { type: String, trim: true },
  issueDescription: { type: String, trim: true },
  photos: { type: [String], default: [] },
  price: { type: Number, default: 0 },
  estimatedPrice: { type: Number, default: 0 },
  status: {
  type: String,
  enum: ['pending', 'assigned', 'diagnosing', 'quoted', 'accepted', 'repairing', 'ready', 'completed', 'paid', 'cancelled'],
  default: 'pending'
},
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  technicianReport: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  saleInfo: {
    amount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'card', 'check', 'transfer'], default: 'cash' },
    paymentDate: { type: Date },
    invoiceUrl: { type: String, default: '' },
    notes: { type: String, default: '' }
  }
});

module.exports = mongoose.model('RepairRequest', repairRequestSchema);
