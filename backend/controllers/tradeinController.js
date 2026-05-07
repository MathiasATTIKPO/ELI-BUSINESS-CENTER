const TradeinRequest = require('../models/TradeinRequest');

exports.createTradein = async (req, res) => {
  try {
    const { clientName, clientWhatsapp, deviceModel, condition } = req.body;
    if (!clientWhatsapp) {
      return res.status(400).json({ success: false, data: null, message: 'Le numéro WhatsApp est obligatoire.' });
    }

    const photos = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const tradein = await TradeinRequest.create({
      clientName,
      clientWhatsapp,
      deviceModel,
      condition,
      photos,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: { requestId: tradein._id },
      message: 'Demande d’échange créée avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getTradeinById = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findById(req.params.id);
    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Demande d’échange introuvable.' });
    }
    res.json({ success: true, data: tradein, message: 'Suivi de la demande d’échange.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
