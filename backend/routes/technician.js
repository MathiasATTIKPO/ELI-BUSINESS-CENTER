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
 *                 enum: [assigned, diagnosing, repairing, ready, completed]
 *     responses:
 *       200:
 *         description: Repair status updated
 */
router.put('/repair/:id/status', technicianController.updateRepairStatus);

/**
 * @openapi
 * /api/technician/tradeins:
 *   get:
 *     tags:
 *       - Technician - Trade-Ins
 *     summary: Get my trade-ins
 *     description: Get all trade-in requests assigned to this technician
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trade-ins list retrieved
 */
router.post('/tradeins', technicianController.createTradein);
router.get('/tradeins', technicianController.getMyTradeins);

/**
 * @openapi
 * /api/technician/notifications:
 *   get:
 *     tags:
 *       - Technician - Notifications
 *     summary: Get all notifications for technician
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list retrieved
 */
router.get('/notifications', technicianController.getTechnicianNotifications);

/**
 * @openapi
 * /api/technician/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Technician - Notifications
 *     summary: Mark notification as read
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
 *         description: Notification marked as read
 */
router.put('/notifications/:id/read', technicianController.markTechnicianNotificationRead);

/**
 * @openapi
 * /api/technician/notifications/read-all:
 *   put:
 *     tags:
 *       - Technician - Notifications
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/notifications/read-all', technicianController.markAllTechnicianNotificationsRead);

/**
 * @openapi
 * /api/technician/tradein/{id}/status:
 *   put:
 *     tags:
 *       - Technician - Trade-Ins
 *     summary: Update trade-in status
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
 *                 enum: [pending, accepted, refused, completed]
 *     responses:
 *       200:
 *         description: Trade-in status updated
 */
router.put('/tradein/:id/status', technicianController.updateTradeinStatus);

/**
 * @openapi
 * /api/technician/history:
 *   get:
 *     tags:
 *       - Technician - History
 *     summary: Get repair history
 *     description: Get history of all completed repairs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repair history retrieved
 */
router.get('/history', technicianController.getRepairHistory);

// ===== ROUTES POUR L'HISTORIQUE DES ÉCHANGES - AJOUTÉES =====
/**
 * @openapi
 * /api/technician/tradeins/history:
 *   get:
 *     tags:
 *       - Technician - History
 *     summary: Get trade-in history
 *     description: Get history of all completed trade-ins for this technician
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trade-in history retrieved
 */
router.get('/tradeins/history', technicianController.getTradeinHistory);

/**
 * @openapi
 * /api/technician/tradein/{id}:
 *   get:
 *     tags:
 *       - Technician - Trade-Ins
 *     summary: Get trade-in by ID
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
 *         description: Trade-in retrieved
 */
router.get('/tradein/:id', technicianController.getMyTradeinById);

// Dans routes/technician.js - AJOUTEZ cette route
/**
 * @openapi
 * /api/technician/repairs:
 *   post:
 *     tags:
 *       - Technician - Repairs
 *     summary: Create a new repair
 *     description: Create a new repair request manually
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *               - clientWhatsapp
 *               - deviceModel
 *             properties:
 *               clientName:
 *                 type: string
 *               clientWhatsapp:
 *                 type: string
 *               deviceModel:
 *                 type: string
 *               issueDescription:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Repair created
 */
router.post('/repairs', technicianController.createRepair);

module.exports = router;