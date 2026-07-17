const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  requestType: { type: String, enum: ['repair', 'tradein', 'inventory', 'product', 'reseller_contract'], required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'requestType' },
  clientName: { type: String, trim: true },
  clientWhatsapp: { type: String, trim: true },
  amount: { type: Number, required: true },
  pdfUrl: { type: String, required: true },
  pdfPath: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
