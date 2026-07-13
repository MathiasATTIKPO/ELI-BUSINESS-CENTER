const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const vipController = require('../controllers/vipController');
const vipStats = require('../controllers/vipStatsController')
const adminController = require('../controllers/adminController');

// Admin-protected VIP client management
// Public login for VIP clients
router.post('/login', vipController.login);

// Admin-protected VIP client management
router.post('/clients', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.createVIPClient);
router.put('/clients/:id', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.updateVIPClient);
router.get('/clients', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.getVIPClients);
router.get('/clients/:id', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.getVIPClientById);
router.delete('/clients/:id', auth, authorizeRoles('admin', 'super_admin'), vipController.deleteVIPClient);

// Compatibility aliases for admin frontend using /api/admin/vips
router.post('/', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.createVIPClient);
router.put('/:id([0-9a-fA-F]{24})', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.updateVIPClient);
router.get('/', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.getVIPClients);
router.get('/:id([0-9a-fA-F]{24})', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.getVIPClientById);
router.delete('/:id([0-9a-fA-F]{24})', auth, authorizeRoles('admin', 'super_admin'), vipController.deleteVIPClient);

// Repairs and invoices
router.post('/repairs', auth, authorizeRoles('admin', 'technician', 'super_admin', 'commercial_manager'), vipController.createVIPRepair);
router.get('/repairs', auth, authorizeRoles('admin', 'technician', 'super_admin', 'commercial_manager'), vipController.getVIPRepairs);
router.post('/invoices/generate', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), vipController.generateMonthlyInvoice);
router.post('/invoices/generate-manual', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipController.generateManualInvoice);
router.get('/repairs/billable', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipController.getBillableVIPRepairs);
router.get('/invoices', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager', 'vip'), vipController.getVIPInvoices);
router.put('/invoices/:id/pay', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipController.recordVIPInvoicePayment);
router.post('/invoices/:id/send-receipt', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipController.sendVIPReceiptToClient);
router.get('/invoices/:id/pdf', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager', 'vip'), vipController.downloadVIPInvoicePdf);
router.get('/clients/:clientId/history', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipController.getVIPClientHistory);

// VIP portal endpoints
router.get('/portal/my-repairs', auth, authorizeRoles('vip'), vipController.getMyVIPRepairs);
router.get('/portal/my-invoices', auth, authorizeRoles('vip'), vipController.getMyVIPInvoices);
router.post('/portal/repairs/request', auth, authorizeRoles('vip'), vipController.requestVIPRepair);

// Notifications
router.get('/notifications', auth, authorizeRoles('vip', 'admin', 'super_admin', 'commercial_manager'), adminController.getNotifications);
router.put('/notifications/:id/read', auth, authorizeRoles('vip', 'admin', 'super_admin', 'commercial_manager'), adminController.markNotificationRead);
router.put('/notifications/read-all', auth, authorizeRoles('vip', 'admin', 'super_admin', 'commercial_manager'), adminController.markAllNotificationsRead);

// Password reset endpoints
router.post('/forgot', vipController.forgotPassword);
router.post('/reset', vipController.resetPassword);
router.post('/change-password', auth, authorizeRoles('vip', 'admin', 'super_admin'), vipController.changePassword);

router.get('/stats', auth, authorizeRoles('admin', 'cashier', 'super_admin', 'commercial_manager'), vipStats.getStats);

module.exports = router;
