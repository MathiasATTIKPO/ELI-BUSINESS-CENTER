const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

/**
 * @openapi
 * /api/invoice/generate:
 *   post:
 *     tags:
 *       - Invoice
 *     summary: Generate invoice
 *     description: Generate an invoice for a repair or sale
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               orderType:
 *                 type: string
 *                 enum: [repair, sale, tradein]
 *     responses:
 *       200:
 *         description: Invoice generated successfully
 *       400:
 *         description: Bad request
 */
router.post('/generate', invoiceController.generateInvoice);
router.get('/:id/pdf', invoiceController.downloadInvoicePdf);

/**
 * @openapi
 * /api/invoice/send-whatsapp:
 *   post:
 *     tags:
 *       - Invoice
 *     summary: Send invoice via WhatsApp
 *     description: Send generated invoice to customer via WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - invoiceId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               invoiceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice sent via WhatsApp
 *       400:
 *         description: Bad request
 */
router.post('/send-whatsapp', invoiceController.sendWhatsapp);

module.exports = router;
