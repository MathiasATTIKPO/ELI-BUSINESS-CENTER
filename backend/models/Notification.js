const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed },
  role: { type: String, enum: ['admin', 'cashier', 'technician', 'reseller', 'vip'] },
  recipientId: { type: mongoose.Schema.Types.Mixed, required: true },
  // Étendu pour supporter les rôles externes (reseller, vip)
  recipientRole: { type: String, enum: ['admin', 'cashier', 'technician', 'reseller', 'vip'], required: true },
  type: {
    type: String,
    required: true,
    trim: true
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  reference: { type: String, trim: true },
  requestId: { type: mongoose.Schema.Types.ObjectId },
  clientName: { type: String, trim: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  channel: { type: String, enum: ['in_app', 'email', 'sms', 'push'], default: 'in_app' },
  status: { type: String, enum: ['unread', 'read', 'archived'], default: 'unread' },
  read: { type: Boolean, default: false },
  eventKey: { type: String, unique: true, sparse: true },
  data: {
    entityId: { type: mongoose.Schema.Types.Mixed, default: null },
    entityType: { type: String, default: '' },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  pushSent: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.pre('save', function (next) {
  if (!this.userId && this.recipientId) {
    this.userId = this.recipientId;
  }
  if (!this.role && this.recipientRole) {
    this.role = this.recipientRole;
  }

  if ((!this.data || !this.data.entityId) && this.requestId) {
    this.data = {
      ...(this.data || {}),
      entityId: this.requestId,
      entityType: (this.type || '').includes('tradein') ? 'tradein' : ((this.type || '').includes('sale') ? 'sale' : 'repair')
    };
  }

  if (this.isModified('read') && this.read === true && this.status !== 'read') {
    this.status = 'read';
  }
  if (this.isModified('read') && this.read === false && this.status !== 'unread') {
    this.status = 'unread';
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);