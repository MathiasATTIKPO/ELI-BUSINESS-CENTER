module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();
    if (!role) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const normalizedAllowedRoles = allowedRoles.map((item) => String(item || '').toLowerCase());
    if (!normalizedAllowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  };
};
