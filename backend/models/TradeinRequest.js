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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  saleInfo: {
    amount: { type: Number, default: 0 }, // Montant rajouté par le client si échange + soulte
    paymentMethod: { type: String, default: 'cash' },
    paymentDate: { type: Date },
    notes: { type: String, default: '' }
  }
});

module.exports = mongoose.model('TradeinRequest', tradeinRequestSchema);
