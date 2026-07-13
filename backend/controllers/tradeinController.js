const TradeinRequest = require('../models/TradeinRequest');
const { uploadImages } = require('../services/cloudinary');

const formatReference = (id) => {
  if (!id) return 'N/A';
  return `REF-${id.toString().slice(-6).toUpperCase()}`;
};

exports.createTradein = async (req, res) => {
  try {
    const { clientName, clientWhatsapp, deviceModel, condition, targetProduct } = req.body;
    if (!clientWhatsapp) {
      return res.status(400).json({ success: false, data: null, message: 'Le numéro WhatsApp est obligatoire.' });
    }

    const uploadedPhotos = req.files ? await uploadImages(req.files, 'tradeins') : [];
    const photos = uploadedPhotos.map((file) => file.url);

    const tradein = await TradeinRequest.create({
      clientName,
      clientWhatsapp,
      deviceModel,
      condition,
      targetProduct: targetProduct || '',
      photos,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: { requestId: tradein._id, reference: formatReference(tradein._id) },
      message: 'Demande d’échange créée avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getTradeinById = async (req, res) => {
  try {
    const ticket = req.params.id.trim();
    let tradein = null;

    if (/^REF-[0-9A-F]{6}$/i.test(ticket)) {
      const suffix = ticket.slice(-6).toLowerCase();
      const tradeins = await TradeinRequest.find().populate('assignedTo');
      tradein = tradeins.find((t) => t._id.toString().toLowerCase().endsWith(suffix));
    } else if (/^[0-9a-fA-F]{24}$/.test(ticket)) {
      tradein = await TradeinRequest.findById(ticket).populate('assignedTo');
    } else {
      return res.status(400).json({ success: false, data: null, message: 'Format de référence invalide.' });
    }

    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Demande d’échange introuvable.' });
    }

    const tradeinObject = tradein.toObject();
    tradeinObject.reference = formatReference(tradein._id);
    res.json({ success: true, data: tradeinObject, message: 'Suivi de la demande d’échange.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
