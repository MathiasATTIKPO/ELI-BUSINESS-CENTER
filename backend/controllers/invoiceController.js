const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { requestType, requestId, clientName, clientWhatsapp, amount } = req.body;
    if (!requestType || !requestId || !clientWhatsapp || !amount) {
      return res.status(400).json({ success: false, data: null, message: 'requestType, requestId, clientWhatsapp et amount requis.' });
    }
    if (!['repair', 'tradein'].includes(requestType)) {
      return res.status(400).json({ success: false, data: null, message: 'requestType invalide.' });
    }

    const requestModel = requestType === 'repair' ? RepairRequest : TradeinRequest;
    const requestData = await requestModel.findById(requestId);
    if (!requestData) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'invoices');
    ensureDir(uploadsDir);
    const fileName = `invoice_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const pdfUrl = `/uploads/invoices/${fileName}`;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Facture ELI BUSINESS CENTER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Type de demande: ${requestType}`, { align: 'left' });
    doc.text(`Référence de la demande: ${requestId}`, { align: 'left' });
    doc.text(`Client: ${clientName || requestData.clientName || 'Non renseigné'}`, { align: 'left' });
    doc.text(`WhatsApp: ${clientWhatsapp}`, { align: 'left' });
    doc.moveDown();
    doc.text('Montant', { underline: true });
    doc.text(`${Number(amount).toLocaleString('fr-FR')} FCFA`, { align: 'left' });
    doc.moveDown();
    doc.text('Merci pour votre confiance.', { align: 'left' });
    doc.end();

    stream.on('finish', async () => {
      const invoice = await Invoice.create({
        requestType,
        requestId,
        clientName: clientName || requestData.clientName,
        clientWhatsapp,
        amount: Number(amount),
        pdfUrl,
        sentAt: new Date()
      });
      res.status(201).json({ success: true, data: invoice, message: 'Facture générée.' });
    });

    stream.on('error', (error) => {
      throw error;
    });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.sendWhatsapp = async (req, res) => {
  try {
    const { invoiceId, message } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, data: null, message: 'invoiceId requis.' });
    }
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, data: null, message: 'Facture introuvable.' });
    }
    const text = encodeURIComponent(message || `Bonjour, votre facture est prête: ${invoice.pdfUrl}`);
    const whatsappUrl = `https://wa.me/${invoice.clientWhatsapp}?text=${text}`;
    res.json({ success: true, data: { whatsappUrl }, message: 'Lien WhatsApp généré.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
