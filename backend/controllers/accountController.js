const bcrypt = require('bcryptjs');
const mongoose = require('../config/mongoose');
const Employee = require('../models/Employee');
const Reseller = require('../models/Reseller');
const VIPClient = require('../models/VIPClient');
const { signToken } = require('../utils/jwt');
const { createAuthVersion } = require('../utils/authVersion');
const {
  CURRENT_PASSWORD_POLICY_VERSION,
  getNewPasswordValidationError,
} = require('../utils/passwordPolicy');

const EMPLOYEE_ROLES = new Set([
  'super_admin',
  'admin',
  'commercial_manager',
  'technician',
  'cashier',
]);

const sanitizeUser = (account) => {
  const user = account.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

const findAccount = async (decoded) => {
  if (!decoded?.id || !mongoose.isValidObjectId(decoded.id)) {
    return null;
  }

  if (EMPLOYEE_ROLES.has(decoded.role)) {
    return Employee.findById(decoded.id);
  }
  if (decoded.role === 'reseller') {
    return Reseller.findById(decoded.id);
  }
  if (decoded.role === 'vip') {
    return VIPClient.findById(decoded.id);
  }

  return null;
};

const buildTokenPayload = (account, fallbackRole) => {
  const role = EMPLOYEE_ROLES.has(fallbackRole)
    ? account.role
    : fallbackRole;

  return {
    id: account._id,
    email: account.email || undefined,
    phone: account.phone || undefined,
    role,
    name: account.name,
    forcePasswordChange: false,
    authVersion: createAuthVersion(account.password),
  };
};

exports.changePassword = async (req, res) => {
  try {
    const oldPassword = String(req.body?.oldPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe actuel et le nouveau mot de passe sont requis.',
      });
    }

    const passwordValidationError = getNewPasswordValidationError(newPassword);
    if (passwordValidationError) {
      return res.status(400).json({
        success: false,
        message: passwordValidationError,
      });
    }

    const account = await findAccount(req.user);
    if (!account || account.isActive === false || !account.password) {
      return res.status(401).json({
        success: false,
        message: 'Compte indisponible ou session invalide.',
      });
    }

    const currentPasswordIsValid = await bcrypt.compare(oldPassword, account.password);
    if (!currentPasswordIsValid) {
      return res.status(401).json({
        success: false,
        message: 'Le mot de passe actuel est incorrect.',
      });
    }

    const passwordIsUnchanged = await bcrypt.compare(newPassword, account.password);
    if (passwordIsUnchanged) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit etre different du mot de passe actuel.',
      });
    }

    account.password = await bcrypt.hash(newPassword, 12);
    account.forcePasswordChange = false;
    account.passwordPolicyVersion = CURRENT_PASSWORD_POLICY_VERSION;
    account.resetPasswordToken = undefined;
    account.resetPasswordExpires = undefined;
    await account.save();

    const user = sanitizeUser(account);
    const token = signToken(buildTokenPayload(account, req.user.role));

    return res.json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Mot de passe modifie avec succes.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Impossible de modifier le mot de passe.',
    });
  }
};
