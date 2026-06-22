const mongoose = require('mongoose');

const tradeinRequestSchema = new mongoose.Schema({
  clientName: { type: String, trim: true },
  clientWhatsapp: { type: String, required: true, trim: true },
  deviceModel: { type: String, trim: true },
  condition: { type: String, trim: true },
  photos: { type: [String], default: [] },
  targetProduct: { type: String, trim: true },
  proposedValue: { type: Number, default: 0 },
  exchangeProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused', 'completed','paid'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  saleInfo: {
    amount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'card', 'check', 'transfer'], default: 'cash' },
    paymentDate: { type: Date },
    invoiceUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    validatedBy: { type: String, default: '' }      // Nom du caissier / vendeur
  },
  updatedAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model('TradeinRequest', tradeinRequestSchema);
