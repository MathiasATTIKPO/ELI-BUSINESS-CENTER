const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { uploadMultiple } = require('../middleware/upload'); // Import du middleware pour les photos

const Product = require('../models/Product');

// Route pour les téléphones disponibles (existante)
router.get('/phones/available', async (req, res) => {
  try {
    const phoneBrands = ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Nokia', 'Huawei', 'OPPO', 'vivo', 'Google', 'Sony'];
    const phones = await Product.find({
      $or: [
        { name: { $regex: new RegExp(phoneBrands.join('|'), 'i') } },
        { brand: { $regex: new RegExp(phoneBrands.join('|'), 'i') } }
      ],
      stock: { $gt: 0 },
      active: true
    }).select('name brand price stock photos');
    res.json({
      success: true,
      data: phones,
      message: `${phones.length} téléphones disponibles`
    });
  } catch (error) {
    console.error('Erreur phones/available:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieve a list of all available products
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       photo:
 *                         type: string
 */
router.get('/', productsController.getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', productsController.getProductById);

// ---------- Routes pour l'administration (avec gestion des photos) ----------
// Créer un produit (avec upload de photos multiples)


router.post('/', uploadMultiple.array('photos', 10), productsController.createProduct);

router.put('/:id', uploadMultiple.array('photos', 10), productsController.updateProduct);

// Supprimer un produit (supprime également les photos physiques)
router.delete('/:id', productsController.deleteProduct);





module.exports = router;