const ALLOWED_PASSWORD_CHANGE_PATHS = new Set([
  '/api/account/change-password',
  '/api/reseller/change-password',
  '/api/vip/change-password',
]);

const getPathname = (req) => {
  const pathname = String(req.originalUrl || req.url || '').split('?')[0];
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
};

const allowRequestOrRespond = (req, res, decoded) => {
  if (!decoded?.forcePasswordChange) {
    return true;
  }

  const pathname = getPathname(req);
  if (req.method === 'POST' && ALLOWED_PASSWORD_CHANGE_PATHS.has(pathname)) {
    return true;
  }

  res.status(403).json({
    success: false,
    data: {
      code: 'PASSWORD_CHANGE_REQUIRED',
      role: decoded.role,
    },
    message: 'Vous devez changer votre mot de passe avant de continuer.',
  });
  return false;
};

module.exports = {
  allowRequestOrRespond,
};
