const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // Type de vente (product, repair, tradein)
  type: {
    type: String,
    enum: ['product', 'repair', 'tradein'],
    required: true
  },

  // Référence au produit (si vente de produit)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  // Informations du produit vendu
  productName: { type: String, trim: true },
  productBrand: { type: String, trim: true },

  // Quantité et prix unitaire
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },

  // Montant total de la vente (peut être doublon avec saleInfo.amount, mais cohérent avec RepairRequest.price)
  totalAmount: { type: Number, required: true },

  // Informations client
  clientName: { type: String, trim: true },
  clientWhatsapp: { type: String, trim: true },

  // Références externes (si vente issue d'une réparation ou d'un échange)
  repairId: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest' },
  tradeinId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradeinRequest' },

  // Statut de la vente
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },

  // Objet saleInfo (comme dans RepairRequest et TradeinRequest)
  saleInfo: {
    amount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cash', 'mobile_money', 'card', 'check', 'transfer'], default: 'cash' },
    paymentDate: { type: Date },
    invoiceUrl: { type: String, default: '' },
    notes: { type: String, default: '' }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
saleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Sale', saleSchema);