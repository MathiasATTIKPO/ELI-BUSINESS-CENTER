const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la compétence est obligatoire'],
      unique: true,
      trim: true,
    },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      default: 'Général',
      enum: ['Réparation', 'Diagnostic', 'Maintenances', 'Logiciel', 'Réseau', 'Général'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);