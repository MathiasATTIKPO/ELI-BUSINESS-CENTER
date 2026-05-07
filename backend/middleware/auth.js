const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH] Accès refusé pour ${req.method} ${req.originalUrl} : Header Authorization manquant ou mal formaté.`);
    return res.status(401).json({ success: false, data: null, message: 'Token manquant.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`[AUTH] Token valide pour : ${decoded.email}`);
    next();
  } catch (error) {
    console.error(`[AUTH] Erreur de vérification du token :`, error.message);
    res.status(401).json({ success: false, data: null, message: 'Token invalide.' });
  }
};
