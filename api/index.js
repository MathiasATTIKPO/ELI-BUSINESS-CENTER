// Vercel discovers serverless functions from the repository-level `api`
// directory. Keep the application implementation in `backend`, and expose it
// here for deployments whose Root Directory is the repository root.
module.exports = require('../backend/api/index');
