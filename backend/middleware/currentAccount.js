const mongoose = require('../config/mongoose');
const Employee = require('../models/Employee');
const Reseller = require('../models/Reseller');
const VIPClient = require('../models/VIPClient');
const { matchesAuthVersion } = require('../utils/authVersion');
const { getEnvAdminCredentials } = require('../utils/envAdmin');
const { requiresPasswordChange } = require('../utils/passwordPolicy');

const EMPLOYEE_ROLES = new Set([
  'super_admin',
  'admin',
  'commercial_manager',
  'technician',
  'cashier',
]);

const createSessionError = () => {
  const error = new Error('Session expiree. Veuillez vous reconnecter.');
  error.code = 'SESSION_STALE';
  error.statusCode = 401;
  return error;
};

const findAccount = async (decoded) => {
  if (EMPLOYEE_ROLES.has(decoded.role)) {
    return {
      account: await Employee.findById(decoded.id),
      role: null,
    };
  }
  if (decoded.role === 'reseller') {
    return {
      account: await Reseller.findById(decoded.id),
      role: 'reseller',
    };
  }
  if (decoded.role === 'vip') {
    return {
      account: await VIPClient.findById(decoded.id),
      role: 'vip',
    };
  }

  throw createSessionError();
};

const resolveEnvAdmin = (decoded) => {
  const credentials = getEnvAdminCredentials();
  if (
    !credentials.enabled
    || decoded.role !== 'admin'
    || String(decoded.email || '').trim().toLowerCase() !== credentials.email
    || !matchesAuthVersion(decoded.authVersion, credentials.password)
  ) {
    throw createSessionError();
  }

  return {
    ...decoded,
    id: 'admin_id',
    email: credentials.email,
    role: 'admin',
    name: decoded.name || 'Administrateur',
    forcePasswordChange: false,
  };
};

const resolveCurrentAccount = async (decoded) => {
  if (!decoded?.id) {
    throw createSessionError();
  }

  if (decoded.id === 'admin_id') {
    return resolveEnvAdmin(decoded);
  }

  if (!mongoose.isValidObjectId(decoded.id)) {
    throw createSessionError();
  }

  const { account, role: fixedRole } = await findAccount(decoded);
  if (!account || account.isActive === false || !account.password) {
    throw createSessionError();
  }

  const currentRole = fixedRole || account.role;
  if (currentRole !== decoded.role || !matchesAuthVersion(decoded.authVersion, account.password)) {
    throw createSessionError();
  }

  return {
    ...decoded,
    id: String(account._id),
    email: account.email || decoded.email,
    phone: account.phone || decoded.phone,
    name: account.name || decoded.name,
    role: currentRole,
    forcePasswordChange: requiresPasswordChange(account),
  };
};

const respondWithAuthError = (res, error, fallbackMessage = 'Erreur lors de la verification de la session.') => {
  const isSessionError = error?.code === 'SESSION_STALE';
  const status = isSessionError ? 401 : 500;

  return res.status(status).json({
    success: false,
    data: isSessionError ? { code: 'SESSION_STALE' } : null,
    message: isSessionError ? error.message : fallbackMessage,
  });
};

module.exports = {
  resolveCurrentAccount,
  respondWithAuthError,
};
