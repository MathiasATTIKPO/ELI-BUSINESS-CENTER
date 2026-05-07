const express = require('express');
const router = express.Router();
const authTechnician = require('../middleware/authTechnician');
const technicianController = require('../controllers/technicianController');

/**
 * @openapi
 * /api/technician/login:
 *   post:
 *     tags:
 *       - Technician - Authentication
 *     summary: Technician login
 *     description: Authenticate technician user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', require('../controllers/adminController').technicianLogin);
router.use(authTechnician);

/**
 * @openapi
 * /api/technician/repairs:
 *   get:
 *     tags:
 *       - Technician - Repairs
 *     summary: Get my repairs
 *     description: Get all repair requests assigned to this technician
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repairs list retrieved
 */
router.get('/repairs', technicianController.getMyRepairs);

/**
 * @openapi
 * /api/technician/repair/{id}:
 *   get:
 *     tags:
 *       - Technician - Repairs
 *     summary: Get repair by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair retrieved
 */
router.get('/repair/:id', technicianController.getMyRepairById);

/**
 * @openapi
 * /api/technician/repair/{id}/status:
 *   put:
 *     tags:
 *       - Technician - Repairs
 *     summary: Update repair status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *     responses:
 *       200:
 *         description: Repair status updated
 */
router.put('/repair/:id/status', technicianController.updateRepairStatus);

/**
 * @openapi
 * /api/technician/history:
 *   get:
 *     tags:
 *       - Technician - Repairs
 *     summary: Get repair history
 *     description: Get history of all completed repairs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repair history retrieved
 */
router.get('/history', technicianController.getRepairHistory);

module.exports = router;