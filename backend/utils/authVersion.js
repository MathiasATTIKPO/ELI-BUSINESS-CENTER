const crypto = require('crypto');
const { getJwtSecret } = require('./jwt');

const createAuthVersion = (credentialSecret) => (
  crypto
    .createHmac('sha256', getJwtSecret())
    .update(String(credentialSecret || ''))
    .digest('base64url')
);

const matchesAuthVersion = (candidate, credentialSecret) => {
  if (!candidate || !credentialSecret) return false;

  const actual = Buffer.from(String(candidate));
  const expected = Buffer.from(createAuthVersion(credentialSecret));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

module.exports = {
  createAuthVersion,
  matchesAuthVersion,
};
