const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const adminDist = path.join(rootDir, 'admin', 'dist');
const clientDist = path.join(rootDir, 'client', 'dist');
const mergedAdminOut = path.join(clientDist, 'admin');
const adminServiceWorker = path.join(adminDist, 'service-worker.js');
const rootServiceWorker = path.join(clientDist, 'service-worker.js');

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

// The repository-level Vercel function delegates to backend/api/index.js.
// Install its runtime dependencies when this monorepo is deployed from root.
run('npm --prefix backend install');

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

if (fs.existsSync(adminServiceWorker)) {
  fs.copyFileSync(adminServiceWorker, rootServiceWorker);
  console.log(`Copied admin service worker to ${rootServiceWorker}`);
}
