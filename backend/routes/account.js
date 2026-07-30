const express = require('express');
const auth = require('../middleware/auth');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.post('/change-password', auth, accountController.changePassword);

module.exports = router;
