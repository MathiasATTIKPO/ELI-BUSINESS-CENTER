const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Invoice = require('../models/Invoice');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const VIPInvoice = require('../models/VIPInvoice');
const ResellerContract = require('../models/ResellerContract');
const { storeFileBuffer, isAbsoluteUrl, hasCloudinaryConfig } = require('../services/cloudinary');

const getRequestModel = (requestType) => {
  if (requestType === 'repair') return RepairRequest;
  if (requestType === 'tradein') return TradeinRequest;
  if (requestType === 'inventory') return InventoryItem;
  if (requestType === 'product') return Product;
  if (requestType === 'vip') return VIPInvoice;
  if (requestType === 'reseller_contract') return ResellerContract;
  return null;
};

const getServiceLabel = (requestType) => {
  const labels = {
    repair: 'Reparation',
    tradein: 'Echange',
    inventory: 'Vente de pieces',
    product: 'Vente de telephone',
    vip: 'Facture VIP',
    reseller_contract: 'Encaissement contrat revendeur'
  };
  return labels[requestType] || 'Service';
};

const getPaymentMethodLabel = (value) => {
  const labels = {
    cash: 'Especes',
    card: 'Carte bancaire',
    mobile_money: 'Monnaie mobile',
    check: 'Cheque',
    transfer: 'Virement'
  };
  return labels[value] || (value || 'Non precise');
};

const getDescription = (requestType, requestData) => {
  if (requestType === 'repair') return requestData.issueDescription || 'Reparation';
  if (requestType === 'tradein') return `Echange ${requestData.deviceModel || ''}`.trim();
  if (requestType === 'inventory') return requestData.name || 'Piece detachee';
  if (requestType === 'product') return requestData.name || `${requestData.brand || ''} Telephone`.trim();
  if (requestType === 'vip') return requestData.invoiceNumber || 'Facturation mensuelle VIP';
  if (requestType === 'reseller_contract') return `Encaissement contrat ${requestData.number || ''}`.trim();
  return 'Service';
};


const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/\//g, '')
    .replace(/[^\d,.-]/g, '');

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  let normalized;
  if (decimalIndex === -1) {
    normalized = cleaned.replace(/[.,]/g, '');
  } else {
    const intPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, '');
    const decPart = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, '');
    normalized = `${intPart}.${decPart}`;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatFcfa = (value) => {
  const amount = Math.round(parseAmount(value));
  
  // Méthode 1: Regex avec espace
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Méthode 2: Alternative avec toLocaleString (décommentez pour utiliser)
  // const grouped = amount.toLocaleString('fr-FR');
  
  return `${grouped} FCFA`;
};

/* // Tests
console.log(formatFcfa(550000));     // "550 000 FCFA" ✅
console.log(formatFcfa(1000));       // "1 000 FCFA" ✅
console.log(formatFcfa(1500));       // "1 500 FCFA" ✅
console.log(formatFcfa(174.5));      // "175 FCFA" ✅ */

const C = {
  text: '#1a1a1a',
  muted: '#666666',
  border: '#cccccc',
  softBorder: '#eeeeee',
  white: '#ffffff'
};

const drawHeaderDevis = (doc, invoiceNumber, date = new Date()) => {
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.text).text('Eli Business Center', 50, 30);
  doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('Lome, Togo', 50, 52);
  doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('+228 01 23 45 67 89', 50, 64);

  const rightX = doc.page.width - 200;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Facture no', rightX, 30);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(invoiceNumber, rightX + 60, 30);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Date', rightX, 45);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    rightX + 60,
    45
  );

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Reference', rightX, 60);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(`CMD-${invoiceNumber}`, rightX + 60, 60);

  doc.moveTo(50, 85).lineTo(doc.page.width - 50, 85).stroke(C.border);
};

const drawAddresses = (doc, clientName, clientAddress, additionalAddress = '') => {
  const yStart = 100;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text('Facture a', 50, yStart);
  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text(clientName || 'Client', 50, yStart + 14);
  doc.text(clientAddress || 'Adresse non renseignee', 50, yStart + 28);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text('Service rendu a', 250, yStart);
  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text(clientName || 'Client', 250, yStart + 14);
  doc.text(additionalAddress || 'Adresse non renseignee', 250, yStart + 28);

  const yEnd = yStart + 70;
  doc.moveTo(50, yEnd).lineTo(doc.page.width - 50, yEnd).stroke(C.border);
};

const drawItemsTableDevis = (doc, items, totalHT, tvaRate = 0, tvaAmount = 0, totalTTC = 0) => {
  const yStart = 195;
  const colQtyX = 50;
  const colDescX = 100;
  const colPriceX = 380;
  const colTotalX = 460;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text);
  doc.text('Qte', colQtyX, yStart);
  doc.text('Designation', colDescX, yStart);
  doc.text('Prix unit.', colPriceX, yStart, { width: 70, align: 'right' });
  doc.text('Montant', colTotalX, yStart, { width: 70, align: 'right' });

  doc.moveTo(50, yStart + 10).lineTo(doc.page.width - 50, yStart + 10).stroke(C.border);

  let currentY = yStart + 20;
  items.forEach((item, index) => {
    if (index > 0) {
      doc.moveTo(50, currentY - 2).lineTo(doc.page.width - 50, currentY - 2).stroke(C.softBorder);
    }

    doc.font('Helvetica').fontSize(9).fillColor(C.text);
    doc.text(String(item.quantity), colQtyX, currentY);
    doc.text(item.description, colDescX, currentY);
    doc.text(formatFcfa(item.unitPrice), colPriceX, currentY, { width: 70, align: 'right' });
    doc.text(formatFcfa(item.total), colTotalX, currentY, { width: 70, align: 'right' });

    currentY += 18;
  });

  doc.moveTo(50, currentY + 5).lineTo(doc.page.width - 50, currentY + 5).stroke(C.border);

  const totalY = currentY + 15;
  const totalColX = 380;

  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text('Total HT', totalColX, totalY);
  doc.text(formatFcfa(totalHT), doc.page.width - 90, totalY, { width: 90, align: 'right' });

  const tvaY = totalY + 16;
  doc.text(`TVA ${tvaRate.toFixed(1)}%`, totalColX, tvaY);
  doc.text(formatFcfa(tvaAmount), doc.page.width - 90, tvaY, { width: 90, align: 'right' });

  const ttcY = tvaY + 18;
  doc.moveTo(50, ttcY - 5).lineTo(doc.page.width - 50, ttcY - 5).stroke(C.border);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text);
  doc.text('Total de la facture', totalColX, ttcY);
  doc.text(formatFcfa(totalTTC), doc.page.width - 90, ttcY, { width: 90, align: 'right' });
};

const drawPaymentTerms = (doc, paymentMethod) => {
  const yStart = 600;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Conditions de paiement', 50, yStart);
  doc.font('Helvetica').fontSize(8).fillColor(C.muted).text('Paiement a reception de facture', 50, yStart + 16);
  if (paymentMethod) {
    doc.text(`Mode de reglement: ${getPaymentMethodLabel(paymentMethod)}`, 50, yStart + 30);
  }

  const footerY = doc.page.height - 40;
  doc.font('Helvetica').fontSize(7).fillColor('#999999');
  doc.text('Facture valable sans signature - Merci de votre confiance', 50, footerY, {
    width: doc.page.width - 100,
    align: 'center'
  });
};

const generateDevisPDF = async ({
  invoiceNumber,
  clientName,
  clientAddress,
  shippingAddress,
  items,
  totalHT,
  tvaRate,
  totalTTC,
  paymentMethod,
  date,
  outputPath
}) => {
  const tvaAmount = totalTTC - totalHT;
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.white);
  drawHeaderDevis(doc, invoiceNumber, date);
  drawAddresses(doc, clientName, clientAddress, shippingAddress);
  drawItemsTableDevis(doc, items, totalHT, tvaRate, tvaAmount, totalTTC);
  drawPaymentTerms(doc, paymentMethod);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

exports.createInvoicePdf = async ({
  requestType,
  requestId,
  clientName,
  clientWhatsapp,
  amount,
  quantity = 1,
  itemName = '',
  paymentMethod = '',
  forceNew = false
}) => {
  const requestModel = getRequestModel(requestType);
  if (!requestModel) throw new Error('Type de demande invalide.');

  let existingInvoice = null;
  if (!forceNew) {
    existingInvoice = await Invoice.findOne({ requestType, requestId });
    if (existingInvoice) {
      const hasRemotePdf = isAbsoluteUrl(existingInvoice.pdfUrl);
      // Keep existing invoices only when already remote, or when Cloudinary is unavailable.
      if (hasRemotePdf || !hasCloudinaryConfig()) {
        return existingInvoice;
      }
    }
  }

  const requestData = requestType === 'reseller_contract'
    ? await requestModel.findById(requestId).populate('reseller')
    : await requestModel.findById(requestId);

  if (!requestData) throw new Error('Demande introuvable.');

  const fileName = `invoice_${Date.now()}.pdf`;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const totalHT = parseAmount(amount);
  const tvaRate = 0;
  const totalTTC = totalHT;
  const unitPrice = safeQuantity > 0 ? totalHT / safeQuantity : totalHT;

  const pdfBuffer = await generateDevisPDF({
    invoiceNumber,
    clientName: clientName || requestData.clientName || 'Client',
    clientAddress: requestData.address || requestData.clientWhatsapp || 'Adresse non renseignee',
    shippingAddress: requestData.shippingAddress || requestData.address || 'Adresse non renseignee',
    items: [
      {
        quantity: safeQuantity,
        description: itemName || `${getServiceLabel(requestType)} - ${getDescription(requestType, requestData)}`,
        unitPrice,
        total: totalHT
      }
    ],
    totalHT,
    tvaRate,
    totalTTC,
    paymentMethod,
    date: new Date()
  });

  const storedPdf = await storeFileBuffer(pdfBuffer, {
    folder: 'invoices',
    fileName,
    resourceType: 'raw',
    mimeType: 'application/pdf'
  });
  const pdfUrl = storedPdf.url;

  let invoice;
  if (existingInvoice && !forceNew) {
    existingInvoice.clientName = clientName || requestData.clientName || '';
    existingInvoice.clientWhatsapp = clientWhatsapp || requestData.clientWhatsapp || '';
    existingInvoice.amount = parseAmount(amount);
    existingInvoice.pdfUrl = pdfUrl;
    existingInvoice.sentAt = new Date();
    invoice = await existingInvoice.save();
  } else {
    invoice = await Invoice.create({
      requestType,
      requestId,
      clientName: clientName || requestData.clientName || '',
      clientWhatsapp: clientWhatsapp || requestData.clientWhatsapp || '',
      amount: parseAmount(amount),
      pdfUrl,
      sentAt: new Date()
    });
  }

  if (requestType === 'repair') {
    await RepairRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': pdfUrl });
  } else if (requestType === 'tradein') {
    await TradeinRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': pdfUrl });
  } else if (requestType === 'reseller_contract') {
    await ResellerContract.findByIdAndUpdate(requestId, { 'payment.invoiceUrl': pdfUrl });
  }

  return invoice;
};

exports.generateInvoice = async (req, res) => {
  try {
    const {
      requestType,
      requestId,
      clientName,
      clientWhatsapp,
      amount,
      quantity,
      itemName,
      paymentMethod
    } = req.body;

    if (!requestType || !requestId || !amount) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }

    if (!['repair', 'tradein', 'inventory', 'product', 'reseller_contract', 'vip'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'Type de demande invalide.' });
    }

    const invoice = await exports.createInvoicePdf({
      requestType,
      requestId,
      clientName,
      clientWhatsapp,
      amount,
      quantity,
      itemName,
      paymentMethod,
      forceNew: Boolean(req.body?.forceNew)
    });

    return res.status(201).json({
      success: true,
      data: invoice,
      message: 'Facture generee avec succes.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendWhatsapp = async (req, res) => {
  try {
    const { invoiceId, message } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'invoiceId requis.' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture introuvable.' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:4001';
    const pdfLink = isAbsoluteUrl(invoice.pdfUrl) ? invoice.pdfUrl : `${baseUrl}${invoice.pdfUrl}`;

    const defaultMsg =
      `Bonjour ${invoice.clientName || ''},\n\n` +
      `Votre facture Eli Business Center est disponible.\n\n` +
      `Service: ${getServiceLabel(invoice.requestType)}\n` +
      `Montant: ${formatFcfa(invoice.amount || 0)}\n` +
      `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n` +
      `Telechargement: ${pdfLink}\n\n` +
      `Cordialement,\nEli Business Center`;

    const whatsappUrl = `https://wa.me/${invoice.clientWhatsapp || ''}?text=${encodeURIComponent(message || defaultMsg)}`;

    return res.json({
      success: true,
      data: { whatsappUrl, pdfUrl: pdfLink },
      message: 'Lien WhatsApp genere.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateDevisPDF = generateDevisPDF;


// Alias conserve pour compatibilite eventuelle.
exports.createInvoicePdfDevis = exports.createInvoicePdf;


