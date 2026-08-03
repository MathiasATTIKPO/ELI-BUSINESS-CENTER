const jwt = require('jsonwebtoken');
const { isProductionRuntime } = require('./envAdmin');

let hasWarnedAboutInsecureJwt = false;

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'eli-business-center-test-only-secret';
  }

  const allowInsecureFallback = process.env.ALLOW_INSECURE_JWT_SECRET === 'true';
  if (allowInsecureFallback && !isProductionRuntime()) {
    if (!hasWarnedAboutInsecureJwt) {
      // Keep one warning per process to avoid noisy logs while still exposing risk.
      console.warn('[SECURITY] Using insecure JWT secret fallback. Set JWT_SECRET and remove ALLOW_INSECURE_JWT_SECRET.');
      hasWarnedAboutInsecureJwt = true;
    }
    return 'eli-business-center-development-only-secret';
  }

  if (isProductionRuntime()) {
    throw new Error('JWT_SECRET is required in production.');
  }

  throw new Error('JWT_SECRET is required. For local temporary fallback only, set ALLOW_INSECURE_JWT_SECRET=true.');
};

const signToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken
};
