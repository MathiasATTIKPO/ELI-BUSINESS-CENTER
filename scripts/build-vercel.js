const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const adminDist = path.join(rootDir, 'admin', 'dist');
const clientDist = path.join(rootDir, 'client', 'dist');
const mergedAdminOut = path.join(clientDist, 'admin');

const run = (command, extraEnv = {}) => {
  execSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
};

run('npm --prefix admin install');
run('npm --prefix admin run build', { VITE_BASE_PATH: '/admin/' });

run('npm --prefix client install');
run('npm --prefix client run build');

if (!fs.existsSync(adminDist)) {
  throw new Error(`Admin build output not found at ${adminDist}`);
}

if (fs.existsSync(mergedAdminOut)) {
  fs.rmSync(mergedAdminOut, { recursive: true, force: true });
}

fs.cpSync(adminDist, mergedAdminOut, { recursive: true });
console.log(`Merged admin build into ${mergedAdminOut}`);
