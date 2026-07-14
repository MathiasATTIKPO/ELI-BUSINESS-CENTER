const mongoose = require('mongoose');
const RepairRequest = require('../models/RepairRequest');
const { uploadImages } = require('../services/cloudinary');
const notificationService = require('../services/notificationService');

const formatReference = (id) => {
  if (!id) return 'N/A';
  return `REF-${id.toString().slice(-6).toUpperCase()}`;
};

exports.createRepair = async (req, res) => {
  try {
    const { clientName, clientWhatsapp, deviceModel, issueDescription } = req.body;
    if (!clientWhatsapp) {
      return res.status(400).json({ success: false, data: null, message: 'Le numéro WhatsApp est obligatoire.' });
    }

    const uploadedPhotos = req.files ? await uploadImages(req.files, 'repairs') : [];
    const photos = uploadedPhotos.map((file) => file.url);

    const repair = await RepairRequest.create({
      clientName,
      clientWhatsapp,
      deviceModel,
      issueDescription,
      photos,
      status: 'pending'
    });

    await notificationService.notifyAdmins({
      type: 'repair_pending',
      title: 'Nouvelle demande de réparation',
      message: `Nouvelle demande de réparation pour ${deviceModel || 'appareil'} par ${clientName || 'Client'}`,
      requestId: repair._id,
      clientName: clientName || 'Client',
      reference: repair._id.toString().slice(-6)
    });

    res.status(201).json({
      success: true,
      data: { requestId: repair._id, reference: formatReference(repair._id) },
      message: 'Demande de réparation créée avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const ticket = req.params.id.trim();
    let repair = null;

    if (/^REF-[0-9A-F]{6}$/i.test(ticket)) {
      const suffix = ticket.slice(-6).toLowerCase();
      const repairs = await RepairRequest.find().populate('assignedTo');
      repair = repairs.find((r) => r._id.toString().toLowerCase().endsWith(suffix));
    } else if (/^[0-9a-fA-F]{24}$/.test(ticket)) {
      repair = await RepairRequest.findById(ticket).populate('assignedTo');
    } else {
      return res.status(400).json({ success: false, data: null, message: 'Format de référence invalide.' });
    }

    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande de réparation introuvable.' });
    }

    const repairObject = repair.toObject();
    repairObject.reference = formatReference(repair._id);
    res.json({ success: true, data: repairObject, message: 'Suivi de la demande de réparation.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
