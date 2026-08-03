const { verifyToken } = require('../utils/jwt');
const { allowRequestOrRespond } = require('./passwordChangeGuard');
const { resolveCurrentAccount, respondWithAuthError } = require('./currentAccount');
const { ROLE } = require('../constants/roles');

const authTechnician = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, data: null, message: 'Token manquant.' });
    }

    const decoded = verifyToken(token);

    // Vérifier que c'est un technicien
    if (String(decoded.role || '').toLowerCase() !== ROLE.TECHNICIAN) {
      return res.status(403).json({ success: false, data: null, message: 'Accès non autorisé.' });
    }

    req.user = await resolveCurrentAccount(decoded);
    if (!allowRequestOrRespond(req, res, req.user)) {
      return;
    }
    next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, data: null, message: 'Token invalide.' });
    }
    return respondWithAuthError(res, error);
  }
};

module.exports = authTechnician;
