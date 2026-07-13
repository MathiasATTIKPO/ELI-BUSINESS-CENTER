const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const resellerController = require('../controllers/resellerController');
const adminController = require('../controllers/adminController');

// Public login for reseller
router.post('/login', resellerController.login);

// Password reset endpoints
router.post('/forgot', resellerController.forgotPassword);
router.post('/reset', resellerController.resetPassword);
router.post('/change-password', auth, authorizeRoles('reseller', 'admin'), resellerController.changePassword);

// Reseller portal endpoints
router.get('/catalog', auth, authorizeRoles('reseller', 'admin'), resellerController.getAvailableCatalog);
router.get('/stats/me', auth, authorizeRoles('reseller'), resellerController.getMyStats);
router.get('/contracts/me', auth, authorizeRoles('reseller'), resellerController.getContracts);

// Admin routes - protect with auth and check role in controller or middleware
router.post('/', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.createReseller);
router.put('/:id', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.updateReseller);
router.delete('/:id', auth, authorizeRoles('admin', 'super_admin'), resellerController.deleteReseller);
router.get('/', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.getResellers);

// Contracts
router.post('/contracts', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.createContract);
router.get('/contracts/all', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager', 'reseller'), resellerController.getContracts);
router.put('/contracts/:id/status', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager', 'reseller'), resellerController.updateContractStatus);
router.get('/contracts/:id/pdf', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager', 'reseller'), resellerController.downloadContractPdf);

// ⭐ NOUVEAU : Relancer le délai d'encaissement (manager only)
router.put('/contracts/:id/renew-delay', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.renewDelay);

// Request negotiation wo
// rkflow
router.post('/request', auth, authorizeRoles('reseller', 'admin', 'super_admin', 'commercial_manager'), resellerController.requestPhone);
router.put('/requests/:id/review', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.reviewRequest);

// Notifications
router.get('/notifications', auth, authorizeRoles('reseller', 'admin', 'super_admin', 'commercial_manager'), adminController.getNotifications);
router.put('/notifications/:id/read', auth, authorizeRoles('reseller', 'admin', 'super_admin', 'commercial_manager'), adminController.markNotificationRead);
router.put('/notifications/read-all', auth, authorizeRoles('reseller', 'admin', 'super_admin', 'commercial_manager'), adminController.markAllNotificationsRead);

router.get('/:id', auth, authorizeRoles('admin', 'super_admin', 'commercial_manager'), resellerController.getReseller);

module.exports = router;