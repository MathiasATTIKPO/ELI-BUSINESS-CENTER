const jwt = require('jsonwebtoken');
const { isProductionRuntime } = require('./envAdmin');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (isProductionRuntime()) {
    throw new Error('JWT_SECRET is required in production.');
  }
  return 'eli-business-center-development-only-secret';
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
