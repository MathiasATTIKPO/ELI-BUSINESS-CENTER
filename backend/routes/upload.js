const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload'); // ← Correction : destructuration
const uploadController = require('../controllers/uploadController');

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload files
 *     description: Upload multiple files (images, documents, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *     responses:
 *       200:
 *         description: Files uploaded successfully
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
 *                       filename:
 *                         type: string
 *                       size:
 *                         type: number
 *                       url:
 *                         type: string
 *       400:
 *         description: Bad request - no files or invalid files
 */
router.post('/', upload.array('files', 5), uploadController.uploadFiles);

module.exports = router;