const Skill = require('../models/Skill');
const Employee = require('../models/Employee');

// === CRUD ===

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    res.status(200).json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return res.status(400).json({ success: false, message: 'Cette compétence existe déjà' });

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
    if (!skill) return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    res.status(200).json({ success: true, data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.deleteSkill = async (req, res) => {
  try {
    const skillId = req.params.id;
    // Vérifier si des employés possèdent cette compétence
    const employeesUsing = await Employee.findOne({ skills: skillId });
    if (employeesUsing) {
      return res.status(400).json({
        success: false,
        message: 'Cette compétence est utilisée par au moins un employé. Retirez-la des employés d\'abord.',
      });
    }
    const skill = await Skill.findByIdAndDelete(skillId);
    if (!skill) return res.status(404).json({ success: false, message: 'Compétence non trouvée' });
    res.status(200).json({ success: true, message: 'Compétence supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};