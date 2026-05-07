const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const tradeinController = require('../controllers/tradeinController');

/**
 * @openapi
 * /api/tradein:
 *   post:
 *     tags:
 *       - Trade-In
 *     summary: Create trade-in request
 *     description: Create a new trade-in request with photos
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
 *         description: Trade-in request created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', upload.array('photos', 5), tradeinController.createTradein);

/**
 * @openapi
 * /api/tradein/{id}:
 *   get:
 *     tags:
 *       - Trade-In
 *     summary: Get trade-in request by ID
 *     description: Retrieve details of a specific trade-in request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trade-in request ID
 *     responses:
 *       200:
 *         description: Trade-in request retrieved successfully
 *       404:
 *         description: Trade-in request not found
 */
router.get('/:id', tradeinController.getTradeinById);

module.exports = router;
