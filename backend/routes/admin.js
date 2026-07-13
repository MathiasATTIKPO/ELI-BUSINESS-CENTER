const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const adminController = require('../controllers/adminController');
const resellerController = require('../controllers/resellerController');

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin - Authentication
 *     summary: Admin login
 *     description: Authenticate admin user
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
router.post('/login', adminController.login);
router.use(auth);

// ===== PRODUCTS ROUTES =====
router.get('/products', adminController.getProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', upload.single('photo'), adminController.createProduct);
router.put('/products/:id', upload.single('photo'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// ===== REPAIRS ROUTES =====
router.get('/repairs', adminController.getRepairs);
router.get('/repair/:id', adminController.getRepairById);
router.put('/repair/:id/price', adminController.updateRepairPrice);
router.put('/repair/:id/status', adminController.updateRepairStatus);
router.put('/repair/:id/assign', adminController.assignRepair);

// ===== TRADEINS ROUTES =====
router.get('/tradeins', adminController.getTradeins);
router.get('/tradein/:id', adminController.getTradeinById);
router.put('/tradein/:id/value', adminController.updateTradeinValue);
router.put('/tradein/:id/target', adminController.updateTradeinTarget);
router.put('/tradein/:id/status', adminController.updateTradeinStatus);
router.put('/tradein/:id/accept', adminController.acceptTradein);
router.put('/tradein/:id/assign', adminController.assignTradein);
router.put('/tradeins/:id/pay', adminController.payTradein);

// ===== INVENTORY ROUTES =====
router.get('/inventory', adminController.getInventory);
router.post('/inventory', upload.single('photo'), adminController.createInventoryItem);
router.post('/inventory/:id/sell', adminController.sellInventoryItem);
router.put('/inventory/:id', adminController.updateInventoryItem);
router.delete('/inventory/:id', adminController.deleteInventoryItem);

// ===== EMPLOYEES ROUTES =====
router.get('/employees', adminController.getEmployees);
router.post('/employees', adminController.createEmployee);
router.put('/employees/:id', adminController.updateEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);

// ===== WORK TRACKING ROUTES =====
router.post('/work/clockin', adminController.clockIn);
router.post('/work/clockout', adminController.clockOut);

// ===== NOTIFICATIONS ROUTES =====
router.get('/notifications', adminController.getNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// ===== SALES ROUTES =====
router.get('/sales', adminController.getSales);
router.get('/all-sales', adminController.getAllSales);
router.get('/sales/by-period', adminController.getSalesByPeriod);
router.get('/reseller-contracts/pending-payment', resellerController.getPendingCashierCollections);
router.put('/reseller-contracts/:id/pay', resellerController.collectSoldContractPayment);

// ===== STATS ROUTES =====
router.get('/stats', adminController.getStats);

// ===== INVOICE ROUTES =====
router.get('/sales/:id/invoice', adminController.downloadSaleInvoice);
router.get('/repairs/:id/invoice', adminController.downloadRepairInvoice);
router.get('/tradeins/:id/invoice', adminController.downloadTradeinInvoice);

// ===== RESELLERS & VIP ROUTES =====
const resellerRoutes = require('./reseller');
const vipRoutes = require('./vip');
router.use('/resellers', resellerRoutes);
router.use('/vip', vipRoutes);
router.use('/vips', vipRoutes);

module.exports = router;