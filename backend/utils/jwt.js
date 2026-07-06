const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'eli-business-center-secret-key';
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
