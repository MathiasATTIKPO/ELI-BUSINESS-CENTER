const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  repairId: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest', default: null },
  description: { type: String },
  deviceModel: { type: String, default: '' },
  imei: { type: String, default: '' },
  issue: { type: String, default: '' },
  technicianName: { type: String, default: '' },
  replacedParts: { type: [String], default: [] },
  warrantyDays: { type: Number, default: 0 },
  repairDate: { type: Date, default: null },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  method: {
    type: String,
    enum: ['cash', 'mobile_money', 'card', 'check', 'transfer', 'other'],
    default: 'cash'
  },
  reference: { type: String, default: '' },
  note: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now },
  receiptUrl: { type: String, default: '' },
  receivedById: { type: mongoose.Schema.Types.Mixed, default: null },
  receivedByRole: { type: String, default: '' },
  receivedByName: { type: String, default: '' }
});

const auditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  at: { type: Date, default: Date.now },
  byId: { type: mongoose.Schema.Types.Mixed, default: null },
  byRole: { type: String, default: '' },
  byName: { type: String, default: '' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const vipInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, trim: true, index: true },
  vipClient: { type: mongoose.Schema.Types.ObjectId, ref: 'VIPClient', required: true },
  generationMode: { type: String, enum: ['automatic', 'manual'], default: 'automatic' },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  repairs: { type: [lineItemSchema], default: [] },
  repairRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RepairRequest' }],
  subtotal: { type: Number, default: 0 },
  tva: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'overdue'],
    default: 'draft'
  },
  issuedAt: { type: Date, default: null },
  dueAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancelledReason: { type: String, default: '' },
  issuedById: { type: mongoose.Schema.Types.Mixed, default: null },
  issuedByRole: { type: String, default: '' },
  payments: { type: [paymentSchema], default: [] },
  pdfPath: { type: String },
  receiptPath: { type: String, default: '' },
  auditTrail: { type: [auditEntrySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

vipInvoiceSchema.index({ vipClient: 1, periodStart: 1, periodEnd: 1, generationMode: 1 });
vipInvoiceSchema.index({ status: 1, dueAt: 1 });

module.exports = mongoose.model('VIPInvoice', vipInvoiceSchema);
