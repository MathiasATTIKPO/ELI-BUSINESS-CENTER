const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const adminController = require('../controllers/adminController');

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
/**
 * @openapi
 * /api/admin/products:
 *   get:
 *     tags:
 *       - Admin - Products
 *     summary: Get all products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products list retrieved
 *   post:
 *     tags:
 *       - Admin - Products
 *     summary: Create new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created
 */
router.get('/products', adminController.getProducts);
router.post('/products', upload.single('photo'), adminController.createProduct);

/**
 * @openapi
 * /api/admin/products/{id}:
 *   put:
 *     tags:
 *       - Admin - Products
 *     summary: Update product
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
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     tags:
 *       - Admin - Products
 *     summary: Delete product
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
 *         description: Product deleted
 */
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// ===== REPAIRS ROUTES =====
/**
 * @openapi
 * /api/admin/repairs:
 *   get:
 *     tags:
 *       - Admin - Repairs
 *     summary: Get all repair requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Repairs list retrieved
 */
router.get('/repairs', adminController.getRepairs);

/**
 * @openapi
 * /api/admin/repair/{id}:
 *   get:
 *     tags:
 *       - Admin - Repairs
 *     summary: Get repair by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   put:
 *     tags:
 *       - Admin - Repairs
 *     summary: Update repair price
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: operation
 *         schema:
 *           type: string
 *           enum: [price, status, assign]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Repair updated
 */
router.get('/repair/:id', adminController.getRepairById);
router.put('/repair/:id/price', adminController.updateRepairPrice);
router.put('/repair/:id/status', adminController.updateRepairStatus);
router.put('/repair/:id/assign', adminController.assignRepair);

// ===== TRADEINS ROUTES =====
/**
 * @openapi
 * /api/admin/tradeins:
 *   get:
 *     tags:
 *       - Admin - Trade-Ins
 *     summary: Get all trade-in requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trade-ins list retrieved
 */
router.get('/tradeins', adminController.getTradeins);

/**
 * @openapi
 * /api/admin/tradein/{id}:
 *   put:
 *     tags:
 *       - Admin - Trade-Ins
 *     summary: Update trade-in value or accept
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: operation
 *         schema:
 *           type: string
 *           enum: [value, accept]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Trade-in updated
 */
router.put('/tradein/:id/value', adminController.updateTradeinValue);
router.put('/tradein/:id/accept', adminController.acceptTradein);

// ===== INVENTORY ROUTES =====
/**
 * @openapi
 * /api/admin/inventory:
 *   get:
 *     tags:
 *       - Admin - Inventory
 *     summary: Get all inventory items
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory list retrieved
 *   post:
 *     tags:
 *       - Admin - Inventory
 *     summary: Create inventory item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               description:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Inventory item created
 */
router.get('/inventory', adminController.getInventory);
router.post('/inventory', upload.single('photo'), adminController.createInventoryItem);

/**
 * @openapi
 * /api/admin/inventory/{id}:
 *   put:
 *     tags:
 *       - Admin - Inventory
 *     summary: Update inventory item
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
 *         description: Inventory item updated
 *   delete:
 *     tags:
 *       - Admin - Inventory
 *     summary: Delete inventory item
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
 *         description: Inventory item deleted
 */
router.put('/inventory/:id', adminController.updateInventoryItem);
router.delete('/inventory/:id', adminController.deleteInventoryItem);

// ===== EMPLOYEES ROUTES =====
/**
 * @openapi
 * /api/admin/employees:
 *   get:
 *     tags:
 *       - Admin - Employees
 *     summary: Get all employees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list retrieved
 *   post:
 *     tags:
 *       - Admin - Employees
 *     summary: Create employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 */
router.get('/employees', adminController.getEmployees);
router.post('/employees', adminController.createEmployee);

/**
 * @openapi
 * /api/admin/employees/{id}:
 *   put:
 *     tags:
 *       - Admin - Employees
 *     summary: Update employee
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
 *         description: Employee updated
 *   delete:
 *     tags:
 *       - Admin - Employees
 *     summary: Delete employee
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
 *         description: Employee deleted
 */
router.put('/employees/:id', adminController.updateEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);

// ===== WORK TRACKING ROUTES =====
/**
 * @openapi
 * /api/admin/work/clockin:
 *   post:
 *     tags:
 *       - Admin - Work Tracking
 *     summary: Clock in employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee clocked in
 */
router.post('/work/clockin', adminController.clockIn);

/**
 * @openapi
 * /api/admin/work/clockout:
 *   post:
 *     tags:
 *       - Admin - Work Tracking
 *     summary: Clock out employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee clocked out
 */
router.post('/work/clockout', adminController.clockOut);

module.exports = router;
