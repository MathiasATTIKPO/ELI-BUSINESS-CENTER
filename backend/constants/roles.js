const ROLE = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COMMERCIAL_MANAGER: 'commercial_manager',
  TECHNICIAN: 'technician',
  CASHIER: 'cashier',
  RESELLER: 'reseller',
  VIP: 'vip',
};

const EMPLOYEE_ROLES = new Set([
  ROLE.SUPER_ADMIN,
  ROLE.ADMIN,
  ROLE.COMMERCIAL_MANAGER,
  ROLE.TECHNICIAN,
  ROLE.CASHIER,
]);

const MANAGER_ROLES = new Set([
  ROLE.SUPER_ADMIN,
  ROLE.ADMIN,
  ROLE.COMMERCIAL_MANAGER,
]);

module.exports = {
  ROLE,
  EMPLOYEE_ROLES,
  MANAGER_ROLES,
};