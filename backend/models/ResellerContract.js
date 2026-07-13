const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  byRole: { type: String },
  byId: { type: mongoose.Schema.Types.Mixed },
  action: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const resellerContractSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  reseller: { type: mongoose.Schema.Types.ObjectId, ref: 'Reseller', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  imei: { type: String },
  catalogPrice: { type: Number, default: 0 },
  negotiatedPrice: { type: Number, default: 0 },
  expectedSalePrice: { type: Number, default: 0 },
  handedAt: { type: Date, default: null },
  dueAt: { type: Date }, // 48h after handedAt
  status: { type: String, enum: ['pending', 'approved', 'active', 'sold', 'returned', 'expired', 'closed'], default: 'pending' },
  confirmation: {
    resellerDecision: { type: String, enum: ['sold', 'returned', null], default: null },
    resellerConfirmedAt: { type: Date, default: null },
    adminDecision: { type: String, enum: ['sold', 'returned', null], default: null },
    adminConfirmedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    finalizedBy: { type: String, default: null }
  },
  payment: {
    required: { type: Boolean, default: false },
    status: { type: String, enum: ['none', 'pending_cashier', 'paid'], default: 'none' },
    amountExpected: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    collectionDueAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paidById: { type: mongoose.Schema.Types.Mixed, default: null },
    paidByRole: { type: String, default: null },
    paymentMethod: { type: String, default: '' },
    note: { type: String, default: '' },
    invoiceUrl: { type: String, default: '' }
  },
  contractPdfUrl: { type: String, default: '' },
  saleInfo: { type: mongoose.Schema.Types.Mixed },
  history: { type: [historySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resellerContractSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ResellerContract', resellerContractSchema);
