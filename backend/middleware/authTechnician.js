const { verifyToken } = require('../utils/jwt');

const authTechnician = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, data: null, message: 'Token manquant.' });
    }

    const decoded = verifyToken(token);

    // Vérifier que c'est un technicien
    if (decoded.role !== 'technician') {
      return res.status(403).json({ success: false, data: null, message: 'Accès non autorisé.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, data: null, message: 'Token invalide.' });
  }
};

module.exports = authTechnician;