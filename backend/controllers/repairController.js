const RepairRequest = require('../models/RepairRequest');

exports.createRepair = async (req, res) => {
  try {
    const { clientName, clientWhatsapp, deviceModel, issueDescription } = req.body;
    if (!clientWhatsapp) {
      return res.status(400).json({ success: false, data: null, message: 'Le numéro WhatsApp est obligatoire.' });
    }

    const photos = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const repair = await RepairRequest.create({
      clientName,
      clientWhatsapp,
      deviceModel,
      issueDescription,
      photos,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: { requestId: repair._id },
      message: 'Demande de réparation créée avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const repair = await RepairRequest.findById(req.params.id).populate('assignedTo');
    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande de réparation introuvable.' });
    }
    res.json({ success: true, data: repair, message: 'Suivi de la demande de réparation.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
