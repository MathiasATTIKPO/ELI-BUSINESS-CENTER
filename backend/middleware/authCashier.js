const jwt = require('jsonwebtoken');

const authCashier = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'cashier' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux caissiers.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide.' });
  }
};

module.exports = authCashier;