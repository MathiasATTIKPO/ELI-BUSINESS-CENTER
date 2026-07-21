/**
 * Middleware d'autorisation basé sur les rôles.
 * @param  {...string} allowedRoles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié (req.user doit être présent)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }

    // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès interdit. Rôle(s) autorisé(s) : ${allowedRoles.join(', ')}`
      });
    }

    // Tout est bon, on passe au prochain middleware
    next();
  };
};