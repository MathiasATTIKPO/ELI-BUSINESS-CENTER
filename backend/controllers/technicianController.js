const RepairRequest = require('../models/RepairRequest');

// ===== FONCTIONS POUR LES TECHNICIENS =====

// Obtenir les réparations assignées au technicien
exports.getMyRepairs = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repairs = await RepairRequest.find({ assignedTo: technicianId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: repairs, message: 'Vos réparations assignées.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir le détail d'une réparation spécifique
exports.getMyRepairById = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repair = await RepairRequest.findOne({
      _id: req.params.id,
      assignedTo: technicianId
    }).populate('assignedTo', 'name email');

    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Réparation introuvable ou non assignée à vous.' });
    }

    res.json({ success: true, data: repair, message: 'Détail de la réparation.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Mettre à jour le statut d'une réparation
exports.updateRepairStatus = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { status, technicianReport } = req.body;

    const repair = await RepairRequest.findOne({
      _id: req.params.id,
      assignedTo: technicianId
    });

    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Réparation introuvable ou non assignée à vous.' });
    }

    // Vérifier que le statut est valide pour un technicien
    const allowedStatuses = ['diagnosing', 'repairing', 'ready', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, data: null, message: 'Statut non autorisé pour un technicien.' });
    }

    const updateData = { status };
    if (technicianReport !== undefined) {
      updateData.technicianReport = technicianReport;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedRepair = await RepairRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email');

    res.json({ success: true, data: updatedRepair, message: 'Statut de réparation mis à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir l'historique des réparations terminées
exports.getRepairHistory = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repairs = await RepairRequest.find({
      assignedTo: technicianId,
      status: 'completed'
    })
      .populate('assignedTo', 'name email')
      .sort({ completedAt: -1 });

    res.json({ success: true, data: repairs, message: 'Historique de vos réparations terminées.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};