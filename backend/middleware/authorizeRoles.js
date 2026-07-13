module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  };
};
