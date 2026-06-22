const express = require('express')
const router = express.Router()
const authCashier = require('../middleware/authCashier')
const adminController = require('../controllers/adminController')

/**
 * @openapi
 * /api/cashier/login:
 *   post:
 *     tags:
 *       - Cashier - Authentication
 *     summary: Cashier login
 *     description: Authenticate cashier user
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
router.post('/login', adminController.cashierLogin)
router.use(authCashier)

/**
 * @openapi
 * /api/cashier/repairs:
 *   get:
 *     tags:
 *       - Cashier - Repairs
 *     summary: Get completed repairs for cashier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repairs list retrieved
 */
router.get('/repairs', adminController.getRepairs)
router.put('/repairs/:id/status', adminController.updateRepairStatus)

/**
 * @openapi
 * /api/cashier/tradeins:
 *   get:
 *     tags:
 *       - Cashier - Trade-Ins
 *     summary: Get trade-ins ready for payment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trade-ins list retrieved
 */
router.get('/tradeins', adminController.getTradeins)

/**
 * @openapi
 * /api/cashier/tradeins/{id}/pay:
 *   put:
 *     tags:
 *       - Cashier - Trade-Ins
 *     summary: Mark trade-in as paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Trade-in payment recorded
 */
router.put('/tradeins/:id/pay', adminController.payTradein)
router.put('/repairs/:id/pay', adminController.payRepair)

// ===== ROUTES POUR L'INVENTAIRE (PIÈCES DÉTACHÉES) =====
router.get('/inventory', adminController.getInventory)
router.post('/inventory/:id/sell', adminController.sellInventoryItem)

// ===== NOTIFICATIONS ROUTES =====
/**
 * @openapi
 * /api/cashier/notifications:
 *   get:
 *     tags:
 *       - Cashier - Notifications
 *     summary: Get all notifications for cashier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list retrieved
 */
router.get('/notifications', adminController.getNotifications)

/**
 * @openapi
 * /api/cashier/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Cashier - Notifications
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
router.put('/notifications/:id/read', adminController.markNotificationRead)

/**
 * @openapi
 * /api/cashier/notifications/read-all:
 *   put:
 *     tags:
 *       - Cashier - Notifications
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/notifications/read-all', adminController.markAllNotificationsRead)

// ===== ROUTES POUR LES PRODUITS (TÉLÉPHONES) - AJOUTÉES =====
/**
 * @openapi
 * /api/cashier/products:
 *   get:
 *     tags:
 *       - Cashier - Products
 *     summary: Get all products (phones) for cashier
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products list retrieved
 */
router.get('/products', adminController.getProducts)

/**
 * @openapi
 * /api/cashier/products/{id}/sell:
 *   post:
 *     tags:
 *       - Cashier - Products
 *     summary: Sell a product (phone) via cashier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - clientWhatsapp
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *               amount:
 *                 type: number
 *               clientName:
 *                 type: string
 *               clientWhatsapp:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vente de téléphone enregistrée et facture générée
 *       400:
 *         description: Requête invalide ou stock insuffisant
 *       404:
 *         description: Produit introuvable
 */
router.post('/products/:id/sell', adminController.sellProduct)

/**
 * @openapi
 * /api/cashier/sales:
 *   get:
 *     tags:
 *       - Cashier - Sales
 *     summary: Get all phone sales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales list retrieved
 */
router.get('/sales', adminController.getPhoneSales)

router.get('/repairs/:id', adminController.getRepairById)

router.get('/tradeins/:id', adminController.getTradeinById)



module.exports = router