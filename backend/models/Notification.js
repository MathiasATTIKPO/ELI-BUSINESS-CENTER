const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Employee' },
  recipientRole: { type: String, enum: ['admin', 'cashier', 'technician'], required: true },
  type: { 
    type: String, 
    enum: [
      'repair_pending',    // Nouvelle réparation (admin)
      'tradein_pending',   // Nouvel échange (admin)
      'repair_assigned',   // Réparation assignée (technicien)
      'tradein_assigned',  // Échange assigné (technicien)
      'repair_ready',      // Réparation prête à vendre (caissier)
      'repair_completed',  // Réparation terminée (caissier)
      'tradein_completed', // Échange terminé (caissier)
      'payment_approved'   // Paiement validé (admin, technicien)
    ],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  reference: { type: String },
  requestId: { type: mongoose.Schema.Types.ObjectId },
  clientName: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);