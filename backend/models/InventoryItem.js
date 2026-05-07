const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['screen', 'battery', 'motherboard', 'camera', 'speaker', 'charger', 'case', 'other'],
    required: true
  },
  description: { type: String, default: '' },
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  minQuantity: { type: Number, required: true, default: 5 },
  unitPrice: { type: Number, required: true },
  supplier: { type: String, default: '' },
  location: { type: String, default: '' },
  photos: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
inventoryItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);