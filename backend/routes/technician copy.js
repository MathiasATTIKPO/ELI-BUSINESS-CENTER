const express = require('express');
const router = express.Router();
const authTechnician = require('../middleware/authTechnician');
const technicianController = require('../controllers/technicianController');

router.post('/login', require('../controllers/adminController').technicianLogin);
router.use(authTechnician);

router.get('/repairs', technicianController.getMyRepairs);
router.get('/repair/:id', technicianController.getMyRepairById);
router.put('/repair/:id/status', technicianController.updateRepairStatus);
router.get('/history', technicianController.getRepairHistory);

module.exports = router;