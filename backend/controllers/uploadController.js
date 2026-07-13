const { uploadImages } = require('../services/cloudinary');

exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'Aucun fichier reçu.' });
    }

    const files = await uploadImages(req.files, 'uploads');
    res.status(201).json({ success: true, data: files, message: 'Fichiers téléchargés avec succès.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
