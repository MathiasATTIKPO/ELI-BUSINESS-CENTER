const isProductionRuntime = () => (
  process.env.NODE_ENV === 'production'
  || Boolean(process.env.VERCEL)
);

const getEnvAdminCredentials = () => {
  const developmentDefaultsEnabled = !isProductionRuntime();
  const email = String(
    process.env.ADMIN_USER
    || (developmentDefaultsEnabled ? 'admin@elibusiness.com' : '')
  ).trim().toLowerCase();
  const password = String(
    process.env.ADMIN_PASS
    || (developmentDefaultsEnabled ? 'password123' : '')
  );

  return {
    email,
    password,
    enabled: Boolean(email && password),
  };
};

module.exports = {
  getEnvAdminCredentials,
  isProductionRuntime,
};
