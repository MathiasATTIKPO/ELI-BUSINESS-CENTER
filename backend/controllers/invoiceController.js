const PDFDocument = require('pdfkit');

const Invoice = require('../models/Invoice');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const VIPInvoice = require('../models/VIPInvoice');
const ResellerContract = require('../models/ResellerContract');
const { storeFileBuffer, isAbsoluteUrl, hasCloudinaryConfig } = require('../services/cloudinary');
const { downloadSourceExists, sendAttachment } = require('../utils/download');
const {
  PDF_MARGIN,
  PDF_THEME,
  collectPdfBuffer,
  drawDocumentFooter,
  drawDocumentHeader,
  drawSectionTitle,
  formatFcfa,
  formatPaymentMethod,
} = require('../utils/pdfDocument');

const getInvoiceApiPath = (invoiceId) => `/api/invoices/${invoiceId}/pdf`;

const toInvoiceResponse = (invoice) => {
  if (!invoice) return null;
  const data = typeof invoice.toObject === 'function' ? invoice.toObject() : { ...invoice };
  return {
    ...data,
    downloadUrl: data._id ? getInvoiceApiPath(data._id) : '',
  };
};

// ====================== Fonctions utilitaires ======================


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

// ====================== Fonctions de dessin du PDF ======================

/**
 * drawHeaderDevis – modifié pour inclure le nom du caissier
 */

const drawHeaderDevis = (doc, invoiceNumber, date = new Date(), cashierName = '') => {
  drawDocumentHeader(doc, {
    title: 'FACTURE',
    subtitle: 'Document de vente et de prestation',
    number: invoiceNumber,
    date,
    reference: `CMD-${invoiceNumber}`,
    operator: cashierName ? `Caissier : ${cashierName}` : '',
  });
};

// ====================== Adresses ======================
const drawAddresses = (doc, clientName, clientAddress, additionalAddress = '') => {
  const gap = 14;
  const yStart = 150;
  const availableWidth = doc.page.width - (2 * PDF_MARGIN);
  const cardWidth = (availableWidth - gap) / 2;
  const rightCol = PDF_MARGIN + cardWidth + gap;

  doc.roundedRect(PDF_MARGIN, yStart, cardWidth, 72, 8).fill(PDF_THEME.soft);
  doc.roundedRect(rightCol, yStart, cardWidth, 72, 8).fill(PDF_THEME.soft);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_THEME.emeraldDark)
    .text('FACTURÉ À', PDF_MARGIN + 14, yStart + 12)
    .text('SERVICE RENDU À', rightCol + 14, yStart + 12);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PDF_THEME.text)
    .text(clientName || 'Client', PDF_MARGIN + 14, yStart + 29, { width: cardWidth - 28 })
    .text(clientName || 'Client', rightCol + 14, yStart + 29, { width: cardWidth - 28 });
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_THEME.muted)
    .text(clientAddress || 'Adresse non renseignée', PDF_MARGIN + 14, yStart + 46, { width: cardWidth - 28 })
    .text(additionalAddress || 'Adresse non renseignée', rightCol + 14, yStart + 46, { width: cardWidth - 28 });
};

// ====================== Tableau des articles ======================
const drawItemsTableDevis = (doc, items, totalHT, tvaRate = 0, tvaAmount = 0, totalTTC = 0) => {
  const rightEdge = doc.page.width - PDF_MARGIN;
  const yStart = drawSectionTitle(doc, 'Détails de la facture', 244);
  const colQtyX = PDF_MARGIN;
  const colDescX = PDF_MARGIN + 50;
  const colPriceX = rightEdge - 150;   // largeur réservée pour le prix unitaire
  const colTotalX = rightEdge - 80;    // largeur réservée pour le montant
  const descWidth = colPriceX - colDescX - 14;

  doc.roundedRect(PDF_MARGIN, yStart, rightEdge - PDF_MARGIN, 27, 5).fill(PDF_THEME.navySoft);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PDF_THEME.white);
  doc.text('Qté', colQtyX + 8, yStart + 9);
  doc.text('Désignation', colDescX, yStart + 9);
  doc.text('Prix unit.', colPriceX, yStart + 9, { width: 70, align: 'right' });
  doc.text('Montant', colTotalX, yStart + 9, { width: 70, align: 'right' });

  let currentY = yStart + 36;
  items.forEach((item, index) => {
    const description = String(item.description || 'Service');
    const rowHeight = Math.max(24, doc.heightOfString(description, { width: descWidth }) + 10);
    if (index > 0) {
      doc.moveTo(PDF_MARGIN, currentY - 4).lineTo(rightEdge, currentY - 4)
        .strokeColor(PDF_THEME.border)
        .stroke();
    }
    doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.text);
    doc.text(String(item.quantity), colQtyX + 8, currentY);
    doc.text(description, colDescX, currentY, { width: descWidth });
    doc.text(formatFcfa(item.unitPrice), colPriceX, currentY, { width: 70, align: 'right' });
    doc.text(formatFcfa(item.total), colTotalX, currentY, { width: 70, align: 'right' });
    currentY += rowHeight;
  });

  doc.moveTo(PDF_MARGIN, currentY + 3).lineTo(rightEdge, currentY + 3)
    .strokeColor(PDF_THEME.border)
    .stroke();

  const totalY = currentY + 17;
  const labelX = rightEdge - 160;   // position des libellés (Total HT, TVA, Total)
  const valueX = rightEdge - 80;    // position des montants

  doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.text);
  doc.text('Total HT', labelX, totalY);
  doc.text(formatFcfa(totalHT), valueX, totalY, { width: 70, align: 'right' });

  const tvaY = totalY + 16;
  doc.text(`TVA ${tvaRate.toFixed(1)}%`, labelX, tvaY);
  doc.text(formatFcfa(tvaAmount), valueX, tvaY, { width: 70, align: 'right' });

  const ttcY = tvaY + 18;
  doc.roundedRect(labelX - 12, ttcY - 7, 172, 28, 5).fill(PDF_THEME.emeraldSoft);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_THEME.emeraldDark);
  doc.text('Total de la facture', labelX, ttcY);
  doc.text(formatFcfa(totalTTC), valueX, ttcY, { width: 70, align: 'right' });
  return ttcY + 28;
};

// ====================== Conditions de paiement ======================
const drawPaymentTerms = (doc, paymentMethod, requestedY = 600) => {
  const yStart = Math.min(Math.max(requestedY, 565), doc.page.height - 120);
  drawSectionTitle(doc, 'Conditions de paiement', yStart);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_THEME.muted)
    .text('Paiement à réception de la facture.', PDF_MARGIN + 12, yStart + 25);
  if (paymentMethod) {
    doc.text(`Mode de règlement : ${formatPaymentMethod(paymentMethod)}`, PDF_MARGIN + 12, yStart + 40);
  }
  drawDocumentFooter(doc, {
    message: 'Facture valable sans signature. Merci pour votre confiance.',
  });
};

/**
 * generateDevisPDF – modifiée pour accepter cashierName
 */
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
  cashierName = '', // ✨ nouveau paramètre
  outputPath
}) => {
  const tvaAmount = totalTTC - totalHT;
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PDF_THEME.white);
  drawHeaderDevis(doc, invoiceNumber, date, cashierName); // ✨ on passe le nom
  drawAddresses(doc, clientName, clientAddress, shippingAddress);
  const tableEndY = drawItemsTableDevis(doc, items, totalHT, tvaRate, tvaAmount, totalTTC);
  drawPaymentTerms(doc, paymentMethod, tableEndY + 18);

  doc.end();
  return collectPdfBuffer(doc, chunks);
};

// ====================== Fonction principale de création de facture ======================

/**
 * createInvoicePdf – modifiée pour accepter cashier (objet ou id)
 */
exports.createInvoicePdf = async ({
  requestType,
  requestId,
  clientName,
  clientWhatsapp,
  amount,
  quantity = 1,
  itemName = '',
  paymentMethod = '',
  cashier = null,          // ✨ peut être un objet User ou un ID
  forceNew = false
}) => {
  const requestModel = getRequestModel(requestType);
  if (!requestModel) throw new Error('Type de demande invalide.');

  let existingInvoice = null;
  if (!forceNew) {
    existingInvoice = await Invoice.findOne({ requestType, requestId });
    if (existingInvoice) {
      const hasRemotePdf = isAbsoluteUrl(existingInvoice.pdfUrl);
      const remoteIsReachable = hasRemotePdf ? await downloadSourceExists(existingInvoice.pdfUrl) : true;
      if ((hasRemotePdf && remoteIsReachable) || !hasCloudinaryConfig()) {
        existingInvoice.downloadUrl = getInvoiceApiPath(existingInvoice._id);
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

  // ✨ Récupération du nom du caissier
  let cashierId = null;
  let cashierName = '';
  if (cashier) {
    // Si cashier est un objet mongoose avec un champ 'name' ou 'username'
    if (typeof cashier === 'object' && cashier._id) {
      cashierId = cashier._id;
      cashierName = cashier.name || cashier.username || 'Caissier';
    } else if (typeof cashier === 'string') {
      // On suppose que c'est un ID, on le stocke, mais on ne peut pas avoir le nom directement
      cashierId = cashier;
      // Option : on peut faire un populate ultérieur, mais ici on laisse vide ou on cherche
      cashierName = 'Caissier'; // valeur par défaut
    }
  }

  // Génération du PDF avec le nom du caissier
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
    date: new Date(),
    cashierName // ✨ on passe le nom
  });

  const storedPdf = await storeFileBuffer(pdfBuffer, {
    folder: 'invoices',
    fileName,
    resourceType: 'raw',
    mimeType: 'application/pdf'
  });
  const pdfUrl = storedPdf.url;
  const pdfPath = storedPdf.filePath || '';

  let invoice;
  if (existingInvoice && !forceNew) {
    existingInvoice.clientName = clientName || requestData.clientName || '';
    existingInvoice.clientWhatsapp = clientWhatsapp || requestData.clientWhatsapp || '';
    existingInvoice.amount = parseAmount(amount);
    existingInvoice.pdfUrl = pdfUrl;
    existingInvoice.pdfPath = pdfPath;
    existingInvoice.sentAt = new Date();
    // ✨ Mise à jour du caissier
    if (cashierId) existingInvoice.cashier = cashierId;
    if (cashierName) existingInvoice.cashierName = cashierName;
    invoice = await existingInvoice.save();
  } else {
    invoice = await Invoice.create({
      requestType,
      requestId,
      clientName: clientName || requestData.clientName || '',
      clientWhatsapp: clientWhatsapp || requestData.clientWhatsapp || '',
      amount: parseAmount(amount),
      pdfUrl,
      pdfPath,
      sentAt: new Date(),
      cashier: cashierId,      // ✨
      cashierName             // ✨
    });
  }

  // Mise à jour des références dans les modèles liés
  const canonicalInvoiceUrl = getInvoiceApiPath(invoice._id);

  if (requestType === 'repair') {
    await RepairRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': canonicalInvoiceUrl });
  } else if (requestType === 'tradein') {
    await TradeinRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': canonicalInvoiceUrl });
  } else if (requestType === 'reseller_contract') {
    await ResellerContract.findByIdAndUpdate(requestId, { 'payment.invoiceUrl': canonicalInvoiceUrl });
  }

  invoice.downloadUrl = canonicalInvoiceUrl;
  return invoice;
};

// ====================== Endpoints ======================

exports.downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture introuvable.' });
    }

    // Prefer the durable Cloudinary URL. Legacy documents can still contain a
    // stale local pdfPath left over from before the uploads migration.
    const source = [invoice.pdfUrl, invoice.pdfPath];
    if (!source) {
      return res.status(404).json({ success: false, message: 'PDF introuvable.' });
    }

    const fileName = `facture_${invoice.requestType}_${invoice._id}.pdf`;
    return sendAttachment(res, source, fileName);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
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

    // ✨ Récupération du caissier depuis l'utilisateur authentifié (si disponible)
    const cashier = req.user || null;  // suppose que req.user est peuplé par un middleware d'auth

    const invoice = await exports.createInvoicePdf({
      requestType,
      requestId,
      clientName,
      clientWhatsapp,
      amount,
      quantity,
      itemName,
      paymentMethod,
      cashier,               // ✨ on transmet le caissier
      forceNew: Boolean(req.body?.forceNew)
    });

    return res.status(201).json({
      success: true,
      data: toInvoiceResponse(invoice),
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
    const pdfLink = `${baseUrl}${getInvoiceApiPath(invoice._id)}`;

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

// Alias conservé
exports.createInvoicePdfDevis = exports.createInvoicePdf;
