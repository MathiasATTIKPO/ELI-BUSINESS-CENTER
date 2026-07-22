const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload'); // ← Correction : destructuration
const clientController = require('../controllers/clientController');

// Route pour récupérer les produits disponibles
router.get('/products', clientController.getProducts);

// Route pour créer une demande de réparation
router.post('/repairs', upload.array('photos', 5), clientController.createRepair);

// Route pour créer une demande d'échange
router.post('/tradeins', upload.array('photos', 5), clientController.createTradein);

module.exports = router;