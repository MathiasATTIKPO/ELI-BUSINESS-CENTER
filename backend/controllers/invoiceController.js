const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getRequestModel = (requestType) => {
  if (requestType === 'repair') return RepairRequest;
  if (requestType === 'tradein') return TradeinRequest;
  if (requestType === 'inventory') return InventoryItem;
  if (requestType === 'product') return Product;
  return null;
};

const getDescription = (requestType, requestData) => {
  if (requestType === 'repair') return requestData.issueDescription || 'Réparation';
  if (requestType === 'tradein') return `Échange ${requestData.deviceModel || ''}`;
  if (requestType === 'inventory') return requestData.name || 'pièces détachées';
  if (requestType === 'product') return requestData.name || `${requestData.brand || ''} Téléphone`.trim();
  return 'Service';
};

const getServiceLabel = (requestType) => {
  const labels = {
    repair: 'Réparation',
    tradein: 'Échange',
    inventory: 'Vente de pièces',
    product: 'Vente de téléphone'
  };
  return labels[requestType] || 'Service';
};

// Palette moderne
const C = {
  primary: '#2B3A67',      // Bleu nuit profond
  primaryLight: '#496A81', // Bleu intermédiaire
  accent: '#E09F3E',       // Or / moutarde
  accentLight: '#F3D9A4',  // Or pâle
  bgLight: '#F8F9FA',      // Gris très clair
  textDark: '#1F2937',     // Texte principal
  textMedium: '#4B5563',   // Texte secondaire
  textLight: '#9CA3AF',    // Texte léger
  white: '#FFFFFF',
  border: '#E5E7EB',
  success: '#059669',      // Vert
  danger: '#DC2626'        // Rouge (si besoin)
};

// Fonction utilitaire pour centrer du texte
const centerText = (doc, text, y, fontSize = 10, color = C.textDark) => {
  doc.fontSize(fontSize).fillColor(color);
  const textWidth = doc.widthOfString(text);
  doc.text(text, (doc.page.width - textWidth) / 2, y);
};

// Dessine le header de la facture
const drawHeader = (doc, invoiceNumber) => {
  // Bandeau supérieur
  doc.rect(0, 0, doc.page.width, 140).fill(C.primary);
  // Rectangle décoratif en bas du bandeau
  doc.rect(0, 140, doc.page.width, 4).fill(C.accent);

  // Logo ou nom de l'entreprise stylisé
  doc.font('Helvetica-Bold').fontSize(32).fillColor(C.white).text('Eli', 50, 30);
  doc.font('Helvetica-Bold').fontSize(32).fillColor(C.accent).text('Business', 110, 30);
  doc.font('Helvetica').fontSize(14).fillColor(C.white).text('CENTER', 50, 65);

  // Informations de l'entreprise à droite
  doc.font('Helvetica').fontSize(9).fillColor(C.white).text(
    'contact@elibusiness.com',
    doc.page.width - 200,
    35,
    { align: 'right', width: 150 }
  );
  doc.font('Helvetica').fontSize(9).fillColor(C.white).text(
    '+228 01 23 45 67 89',
    doc.page.width - 200,
    50,
    { align: 'right', width: 150 }
  );
  doc.font('Helvetica').fontSize(9).fillColor(C.white).text(
    'Lomé, Togo',
    doc.page.width - 200,
    65,
    { align: 'right', width: 150 }
  );

  // Bloc Facture (rectangle arrondi) – CORRIGÉ avec roundedRect()
  doc.roundedRect(doc.page.width - 220, 25, 170, 90, 5).fill(C.white);

  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.primary).text('FACTURE', doc.page.width - 210, 40);
  doc.font('Helvetica').fontSize(9).fillColor(C.textMedium).text(`N° ${invoiceNumber}`, doc.page.width - 210, 60);
  doc.font('Helvetica').fontSize(9).fillColor(C.textMedium).text(
    `Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    doc.page.width - 210,
    75
  );
  doc.font('Helvetica').fontSize(9).fillColor(C.textMedium).text(
    `Échéance : ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    doc.page.width - 210,
    90
  );
};

// Section client
const drawClientSection = (doc, clientName, clientWhatsapp, requestData, requestType) => {
  const yStart = 170;
  // Titre
  doc.rect(50, yStart, doc.page.width - 100, 24).fill(C.primaryLight);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white).text('INFORMATIONS CLIENT', 65, yStart + 5);

  const boxY = yStart + 30;
  doc.rect(50, boxY, doc.page.width - 100, 70).fill(C.bgLight).stroke(C.border);

  const col1X = 70;
  const col2X = 150;
  const lineH = 18;
  let curY = boxY + 10;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Client :', col1X, curY);
  doc.font('Helvetica').fontSize(11).fillColor(C.textDark).text(
    clientName || requestData.clientName || 'Non renseigné',
    col2X,
    curY
  );

  curY += lineH;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('WhatsApp :', col1X, curY);
  doc.font('Helvetica').fontSize(11).fillColor(C.success).text(
    clientWhatsapp || 'Non renseigné',
    col2X,
    curY
  );

  if (requestType === 'repair') {
    curY += lineH;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Appareil :', col1X, curY);
    doc.font('Helvetica').fontSize(11).fillColor(C.textDark).text(
      requestData.deviceModel || 'Non renseigné',
      col2X,
      curY
    );
  } else if (requestType === 'tradein' && requestData.deviceModel) {
    curY += lineH;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Ancien appareil :', col1X, curY);
    doc.font('Helvetica').fontSize(11).fillColor(C.textDark).text(requestData.deviceModel, col2X, curY);
    if (requestData.targetProduct) {
      curY += lineH;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Nouveau produit :', col1X, curY);
      doc.font('Helvetica').fontSize(11).fillColor(C.primary).text(requestData.targetProduct, col2X, curY);
    }
  } else if (requestType === 'inventory') {
    curY += lineH;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Produit :', col1X, curY);
    doc.font('Helvetica').fontSize(11).fillColor(C.primary).text(requestData.name || 'Téléphone', col2X, curY);
  } else if (requestType === 'product') {
    curY += lineH;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Produit :', col1X, curY);
    doc.font('Helvetica').fontSize(11).fillColor(C.primary).text(
      requestData.name || `${requestData.brand || ''} Téléphone`.trim(),
      col2X,
      curY
    );
  }
};

// Tableau des articles/services
const drawItemsTable = (doc, requestType, requestData, amount) => {
  const yStart = 290;
  // Titre
  doc.rect(50, yStart, doc.page.width - 100, 24).fill(C.primaryLight);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white).text('DÉTAIL DE LA COMMANDE', 65, yStart + 5);

  const tableTop = yStart + 35;
  const colDescX = 70;
  const colQtyX = 350;
  const colPriceX = 420;
  const colTotalX = 500;
  const tableWidth = doc.page.width - 100;

  // En-tête du tableau
  doc.rect(50, tableTop, tableWidth, 22).fill(C.primary);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white).text('Description', colDescX, tableTop + 5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white).text('Qté', colQtyX, tableTop + 5, { width: 40, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white).text('Prix unit.', colPriceX, tableTop + 5, { width: 60, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white).text('Total', colTotalX, tableTop + 5, { width: 60, align: 'right' });

  // Ligne du service
  const rowY = tableTop + 23;
  doc.rect(50, rowY, tableWidth, 30).fill(C.white).stroke(C.border);

  const serviceName = getServiceLabel(requestType);
  const description = getDescription(requestType, requestData);
  const quantity = 1;
  const unitPrice = Number(amount);
  const lineTotal = unitPrice * quantity;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text(serviceName, colDescX, rowY + 8);
  doc.font('Helvetica').fontSize(8).fillColor(C.textMedium).text(description, colDescX, rowY + 20, { width: 250 });
  doc.font('Helvetica').fontSize(10).fillColor(C.textDark).text(quantity.toString(), colQtyX, rowY + 8, { width: 40, align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(C.textDark).text(`${unitPrice.toLocaleString('fr-FR')} FCFA`, colPriceX, rowY + 8, { width: 70, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text(`${lineTotal.toLocaleString('fr-FR')} FCFA`, colTotalX, rowY + 8, { width: 70, align: 'right' });

  // Sous-total
  const subTotalY = rowY + 35;
  doc.rect(350, subTotalY, 220, 22).fill(C.bgLight);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text('Sous-total', 360, subTotalY + 4);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark).text(`${lineTotal.toLocaleString('fr-FR')} FCFA`, colTotalX, subTotalY + 4, { width: 70, align: 'right' });

  // Total
  const totalY = subTotalY + 28;
  doc.rect(350, totalY, 220, 30).fill(C.primary);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(C.white).text('TOTAL', 360, totalY + 7);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C.accent).text(`${lineTotal.toLocaleString('fr-FR')} FCFA`, colTotalX, totalY + 5, { width: 70, align: 'right' });
};

// Pied de page
const drawFooter = (doc) => {
  const y = 700;
  // Ligne décorative
  doc.rect(50, y, doc.page.width - 100, 1).fill(C.accent);

  doc.font('Helvetica').fontSize(9).fillColor(C.textMedium).text('Eli Business Center - Votre partenaire téléphonie', 50, y + 15);
  doc.font('Helvetica').fontSize(9).fillColor(C.textMedium).text('Lomé, Togo | +228 01 23 45 67 89 | contact@elibusiness.com', 50, y + 28);

  // Conditions
  doc.font('Helvetica').fontSize(8).fillColor(C.textLight).text('Conditions : Paiement dû à réception. Aucun remboursement sans accord préalable.', 50, y + 45, { width: doc.page.width - 100, align: 'center' });
  doc.font('Helvetica').fontSize(8).fillColor(C.textLight).text('Facture générée électroniquement - valide sans signature.', 50, y + 55, { width: doc.page.width - 100, align: 'center' });

  // Remerciements
  centerText(doc, 'Merci pour votre confiance !', y + 75, 11, C.primary);
};

// Fonction principale de création de facture
exports.createInvoicePdf = async ({ requestType, requestId, clientName, clientWhatsapp, amount }) => {
  const requestModel = getRequestModel(requestType);
  if (!requestModel) throw new Error('Type de demande invalide.');

  // ✅ Vérification : une seule facture par demande
  const existingInvoice = await Invoice.findOne({ requestType, requestId });
  if (existingInvoice) {
    console.log(`⚠️ Facture déjà existante pour ${requestType} ${requestId} → ${existingInvoice.pdfUrl}`);
    return existingInvoice; // on retourne l'existante sans rien régénérer
  }

  const requestData = await requestModel.findById(requestId);
  if (!requestData) throw new Error('Demande introuvable.');

  const uploadsDir = path.join(__dirname, '..', 'uploads', 'invoices');
  ensureDir(uploadsDir);
  const fileName = `invoice_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const pdfUrl = `/uploads/invoices/${fileName}`;

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Fond blanc
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.white);

  // Construction du document
  drawHeader(doc, invoiceNumber);
  drawClientSection(doc, clientName, clientWhatsapp, requestData, requestType);
  drawItemsTable(doc, requestType, requestData, amount);
  drawFooter(doc);

  // Bordure fine autour de la page
  doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).stroke(C.border).opacity(0.5);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', async () => {
      try {
        const invoice = await Invoice.create({
          requestType,
          requestId,
          clientName: clientName || requestData.clientName,
          clientWhatsapp,
          amount: Number(amount),
          pdfUrl,
          sentAt: new Date()
        });

        // Mise à jour du document lié
        if (requestType === 'repair') {
          await RepairRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': pdfUrl });
        } else if (requestType === 'tradein') {
          await TradeinRequest.findByIdAndUpdate(requestId, { 'saleInfo.invoiceUrl': pdfUrl });
        }

        resolve(invoice);
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
};

// Contrôleur pour générer la facture (API)
exports.generateInvoice = async (req, res) => {
  try {
    const { requestType, requestId, clientName, clientWhatsapp, amount } = req.body;
    if (!requestType || !requestId || !clientWhatsapp || !amount) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }
    if (!['repair', 'tradein', 'inventory', 'product'].includes(requestType)) {
      return res.status(400).json({ success: false, message: 'Type de demande invalide.' });
    }

    // Créée ou retourne l'existante
    const invoice = await exports.createInvoicePdf({ requestType, requestId, clientName, clientWhatsapp, amount });
    
    // On peut ici préciser si c'était une nouvelle génération ou un retour d'existant
    const message = invoice.pdfUrl && !invoice.isNew ? 'Facture déjà existante, téléchargement disponible.' : 'Facture générée avec succès.';
    res.status(201).json({ success: true, data: invoice, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Envoi WhatsApp
exports.sendWhatsapp = async (req, res) => {
  try {
    const { invoiceId, message } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, message: 'invoiceId requis.' });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Facture introuvable.' });

    const baseUrl = process.env.BASE_URL || 'http://localhost:4001';
    const pdfLink = `${baseUrl}${invoice.pdfUrl}`;
    const defaultMsg = `Bonjour ${invoice.clientName || ''},\n\nVotre facture Eli Business Center est disponible.\n\n` +
      `📄 ${getServiceLabel(invoice.requestType)}\n` +
      `💰 Montant : ${Number(invoice.amount).toLocaleString('fr-FR')} FCFA\n` +
      `📅 Date : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
      `🔗 Télécharger : ${pdfLink}\n\nMerci ! 🙏`;

    const whatsappUrl = `https://wa.me/${invoice.clientWhatsapp}?text=${encodeURIComponent(message || defaultMsg)}`;
    res.json({ success: true, data: { whatsappUrl, pdfUrl: pdfLink }, message: 'Lien WhatsApp généré.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};