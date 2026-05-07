const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const repairController = require('../controllers/repairController');

/**
 * @openapi
 * /api/repair:
 *   post:
 *     tags:
 *       - Repairs
 *     summary: Create repair request
 *     description: Create a new repair request with photos
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - deviceType
 *               - description
 *             properties:
 *               customerName:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               description:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Repair request created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', upload.array('photos', 5), repairController.createRepair);

/**
 * @openapi
 * /api/repair/{id}:
 *   get:
 *     tags:
 *       - Repairs
 *     summary: Get repair request by ID
 *     description: Retrieve details of a specific repair request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Repair request ID
 *     responses:
 *       200:
 *         description: Repair request retrieved successfully
 *       404:
 *         description: Repair request not found
 */
router.get('/:id', repairController.getRepairById);

module.exports = router;
