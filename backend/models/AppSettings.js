const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  // Paramètres des contrats revendeurs
  reseller: {
    pickupDelayHours: { type: Number, default: 48, min: 1, max: 720 }, // Délai pour retrait du téléphone (heures)
    paymentCollectionHours: { type: Number, default: 5, min: 1, max: 72 }, // Délai pour encaissement après vente (heures)
    maxOverdueOverride: { type: Number, default: 72, min: 1, max: 720 }, // Délai max après lequel seul manager peut encaisser
    lateFeePercent: { type: Number, default: 10, min: 0, max: 100 }, // Pénalité pour retard (pourcentage)
  },
  // Autres paramètres
  general: {
    currency: { type: String, default: 'FCFA' },
    companyName: { type: String, default: 'Eli Business Center' },
    companyPhone: { type: String, default: '+228 90 17 84 75' },
    companyAddress: { type: String, default: 'Lome, Togo' },
  },
  // Version des paramètres (pour suivi)
  version: { type: Number, default: 1 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Singleton : un seul document
appSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);