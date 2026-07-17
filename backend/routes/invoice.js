const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');
const adminController = require('../controllers/adminController');
const resellerController = require('../controllers/resellerController');
const vipController = require('../controllers/vipController');

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
router.get('/:id/pdf', auth, invoiceController.downloadInvoicePdf);
router.get('/sales/:id', auth, adminController.downloadSaleInvoice);
router.get('/repairs/:id', auth, adminController.downloadRepairInvoice);
router.get('/tradeins/:id', auth, adminController.downloadTradeinInvoice);
router.get('/contracts/:id', auth, resellerController.downloadContractPdf);
router.get('/receipts/vip/:id', auth, vipController.downloadVIPReceiptPdf);

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
