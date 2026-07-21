const AppSettings = require('../models/AppSettings');
const Skill = require('../models/Skills');

// ========== PARAMÈTRES GÉNÉRAUX ==========

exports.getSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await AppSettings.getSettings();
    const { reseller, general } = req.body;

    if (reseller) {
      // Validation des valeurs
      if (reseller.pickupDelayHours !== undefined && (reseller.pickupDelayHours < 1 || reseller.pickupDelayHours > 720)) {
        return res.status(400).json({ success: false, message: 'Le délai de retrait doit être entre 1 et 720 heures.' });
      }
      if (reseller.paymentCollectionHours !== undefined && (reseller.paymentCollectionHours < 1 || reseller.paymentCollectionHours > 72)) {
        return res.status(400).json({ success: false, message: 'Le délai d\'encaissement doit être entre 1 et 72 heures.' });
      }
      if (reseller.maxOverdueOverride !== undefined && (reseller.maxOverdueOverride < 1 || reseller.maxOverdueOverride > 720)) {
        return res.status(400).json({ success: false, message: 'Le délai max de dépassement doit être entre 1 et 720 heures.' });
      }
      if (reseller.lateFeePercent !== undefined && (reseller.lateFeePercent < 0 || reseller.lateFeePercent > 100)) {
        return res.status(400).json({ success: false, message: 'Le pourcentage de pénalité doit être entre 0 et 100.' });
      }
      settings.reseller = { ...settings.reseller, ...reseller };
    }

    if (general) {
      settings.general = { ...settings.general, ...general };
    }

    settings.updatedBy = req.user?.id || null;
    settings.updatedAt = new Date();
    settings.version += 1;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== GESTION DES COMPÉTENCES (déjà existante, mais on peut la centraliser ici) ==========
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cette compétence existe déjà.' });
    }
    const skill = await Skill.create({ name, description, category });
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { name, description, category },
      { new: true, runValidators: true }
    );
    if (!skill) return res.status(404).json({ success: false, message: 'Compétence non trouvée.' });
    res.status(200).json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skillId = req.params.id;
    const Employee = require('../models/Employee');
    const employeesUsing = await Employee.findOne({ skills: skillId });
    if (employeesUsing) {
      return res.status(400).json({
        success: false,
        message: 'Cette compétence est utilisée par au moins un employé. Retirez-la des employés d\'abord.'
      });
    }
    const skill = await Skill.findByIdAndDelete(skillId);
    if (!skill) return res.status(404).json({ success: false, message: 'Compétence non trouvée.' });
    res.status(200).json({ success: true, message: 'Compétence supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};  