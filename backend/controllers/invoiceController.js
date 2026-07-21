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
const { downloadSourceExists, sendAttachment } = require('../utils/download');

const getInvoiceApiPath = (invoiceId) => `/api/invoices/${invoiceId}/pdf`;

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
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} FCFA`;
};

// ====================== Couleurs ======================

const C = {
  text: '#1a1a1a',
  muted: '#666666',
  border: '#cccccc',
  softBorder: '#eeeeee',
  white: '#ffffff'
};

// ====================== Fonctions de dessin du PDF ======================

/**
 * drawHeaderDevis – modifié pour inclure le nom du caissier
 */

// ====================== En-tête ======================
const MARGIN = 50;   // marge constante

// ====================== En-tête ======================
const drawHeaderDevis = (doc, invoiceNumber, date = new Date(), cashierName = '') => {
  const rightEdge = doc.page.width - MARGIN;
  const rightColX = rightEdge - 160;   // colonne de droite (libellés)
  const rightValX = rightColX + 60;    // valeurs

  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.text).text('Eli Business Center', MARGIN, 30);
  doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('Lome, Togo', MARGIN, 52);
  doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('+228 90 17 84 75', MARGIN, 64);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Facture no', rightColX, 30);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(invoiceNumber, rightValX, 30);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Date', rightColX, 45);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    rightValX,
    45
  );

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Reference', rightColX, 60);
  doc.font('Helvetica').fontSize(9).fillColor(C.text).text(`CMD-${invoiceNumber}`, rightValX, 60);

  if (cashierName) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Caissier', rightColX, 75);
    doc.font('Helvetica').fontSize(9).fillColor(C.text).text(cashierName, rightValX, 75);
  }

  doc.moveTo(MARGIN, 85).lineTo(rightEdge, 85).stroke(C.border);
};

// ====================== Adresses ======================
const drawAddresses = (doc, clientName, clientAddress, additionalAddress = '') => {
  const rightEdge = doc.page.width - MARGIN;
  const yStart = 100;
  const leftCol = MARGIN;
  const rightCol = MARGIN + 200;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text('Facture a', leftCol, yStart);
  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text(clientName || 'Client', leftCol, yStart + 14);
  doc.text(clientAddress || 'Adresse non renseignee', leftCol, yStart + 28);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text('Service rendu a', rightCol, yStart);
  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text(clientName || 'Client', rightCol, yStart + 14);
  doc.text(additionalAddress || 'Adresse non renseignee', rightCol, yStart + 28);

  const yEnd = yStart + 70;
  doc.moveTo(MARGIN, yEnd).lineTo(rightEdge, yEnd).stroke(C.border);
};

// ====================== Tableau des articles ======================
const drawItemsTableDevis = (doc, items, totalHT, tvaRate = 0, tvaAmount = 0, totalTTC = 0) => {
  const rightEdge = doc.page.width - MARGIN;
  const yStart = 195;
  const colQtyX = MARGIN;
  const colDescX = MARGIN + 50;
  const colPriceX = rightEdge - 150;   // largeur réservée pour le prix unitaire
  const colTotalX = rightEdge - 80;    // largeur réservée pour le montant

  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text);
  doc.text('Qte', colQtyX, yStart);
  doc.text('Designation', colDescX, yStart);
  doc.text('Prix unit.', colPriceX, yStart, { width: 70, align: 'right' });
  doc.text('Montant', colTotalX, yStart, { width: 70, align: 'right' });

  doc.moveTo(MARGIN, yStart + 10).lineTo(rightEdge, yStart + 10).stroke(C.border);

  let currentY = yStart + 20;
  items.forEach((item, index) => {
    if (index > 0) {
      doc.moveTo(MARGIN, currentY - 2).lineTo(rightEdge, currentY - 2).stroke(C.softBorder);
    }
    doc.font('Helvetica').fontSize(9).fillColor(C.text);
    doc.text(String(item.quantity), colQtyX, currentY);
    doc.text(item.description, colDescX, currentY);
    doc.text(formatFcfa(item.unitPrice), colPriceX, currentY, { width: 70, align: 'right' });
    doc.text(formatFcfa(item.total), colTotalX, currentY, { width: 70, align: 'right' });
    currentY += 18;
  });

  doc.moveTo(MARGIN, currentY + 5).lineTo(rightEdge, currentY + 5).stroke(C.border);

  const totalY = currentY + 15;
  const labelX = rightEdge - 160;   // position des libellés (Total HT, TVA, Total)
  const valueX = rightEdge - 80;    // position des montants

  doc.font('Helvetica').fontSize(9).fillColor(C.text);
  doc.text('Total HT', labelX, totalY);
  doc.text(formatFcfa(totalHT), valueX, totalY, { width: 70, align: 'right' });

  const tvaY = totalY + 16;
  doc.text(`TVA ${tvaRate.toFixed(1)}%`, labelX, tvaY);
  doc.text(formatFcfa(tvaAmount), valueX, tvaY, { width: 70, align: 'right' });

  const ttcY = tvaY + 18;
  doc.moveTo(MARGIN, ttcY - 5).lineTo(rightEdge, ttcY - 5).stroke(C.border);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text);
  doc.text('Total de la facture', labelX, ttcY);
  doc.text(formatFcfa(totalTTC), valueX, ttcY, { width: 70, align: 'right' });
};

// ====================== Conditions de paiement ======================
const drawPaymentTerms = (doc, paymentMethod) => {
  const yStart = 600;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text('Conditions de paiement', MARGIN, yStart);
  doc.font('Helvetica').fontSize(8).fillColor(C.muted).text('Paiement a reception de facture', MARGIN, yStart + 16);
  if (paymentMethod) {
    doc.text(`Mode de reglement: ${getPaymentMethodLabel(paymentMethod)}`, MARGIN, yStart + 30);
  }

  const footerY = doc.page.height - 40;
  doc.font('Helvetica').fontSize(7).fillColor('#999999');
  doc.text('Facture valable sans signature - Merci de votre confiance', MARGIN, footerY, {
    width: doc.page.width - 2 * MARGIN,
    align: 'center'
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

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.white);
  drawHeaderDevis(doc, invoiceNumber, date, cashierName); // ✨ on passe le nom
  drawAddresses(doc, clientName, clientAddress, shippingAddress);
  drawItemsTableDevis(doc, items, totalHT, tvaRate, tvaAmount, totalTTC);
  drawPaymentTerms(doc, paymentMethod);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
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

    const source = invoice.pdfPath || invoice.pdfUrl;
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