const CURRENT_PASSWORD_POLICY_VERSION = 1;

const requiresPasswordChange = (account) => (
  account?.forcePasswordChange !== false
  || Number(account?.passwordPolicyVersion || 0) < CURRENT_PASSWORD_POLICY_VERSION
);

const getNewPasswordValidationError = (value) => {
  const password = String(value || '');
  if (password.length < 8) {
    return 'Le nouveau mot de passe doit contenir au moins 8 caracteres.';
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return 'Le nouveau mot de passe est trop long.';
  }
  return null;
};

module.exports = {
  CURRENT_PASSWORD_POLICY_VERSION,
  getNewPasswordValidationError,
  requiresPasswordChange,
};
