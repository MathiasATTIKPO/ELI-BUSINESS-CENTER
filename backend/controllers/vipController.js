const VIPClient = require('../models/VIPClient');
const VIPRepair = require('../models/VIPRepair');
const VIPInvoice = require('../models/VIPInvoice');
const RepairRequest = require('../models/RepairRequest');
const Invoice = require('../models/Invoice');
const { generateDevisPDF } = require('./invoiceController');
const notificationService = require('../services/notificationService');
const {
  generateMonthlyInvoiceForClient,
  generateManualInvoiceForClient,
  getBillableRepairs
} = require('../services/vipBillingService');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// ============================================================
//  UTILITAIRES
// ============================================================

const formatFcfa = (value) => {
  const amount = Math.round(Number(value) || 0);
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

const normalizePhone = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
};

const comparablePhone = (value = '') => String(value || '').replace(/\D/g, '');

const findVIPByPhoneComparable = async (phone, extraFilter = {}) => {
  const target = comparablePhone(phone);
  if (!target) return null;
  const candidates = await VIPClient.find(extraFilter);
  return candidates.find((item) => comparablePhone(item.phone) === target) || null;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ============================================================
//  GÉNÉRATION PDF VIP (même format que les autres factures)
// ============================================================

const generateVIPInvoicePDF = async ({ invoice, vipClient, repairs, tvaRate = 0, outputPath }) => {
  const invoiceNumber = invoice.invoiceNumber || `VIP-INV-${Date.now().toString().slice(-6)}`;

  const items = repairs.map((repair) => ({
    quantity: 1,
    description: `${repair.deviceModel || 'Téléphone'} - ${repair.issueDescription || 'Réparation VIP'}`,
    unitPrice: Number(repair.cost || repair.saleInfo?.amount || 0),
    total: Number(repair.cost || repair.saleInfo?.amount || 0)
  }));

  const totalHT = items.reduce((sum, item) => sum + item.total, 0);
  const tvaAmount = totalHT * (tvaRate / 100);
  const totalTTC = totalHT + tvaAmount;

  await generateDevisPDF({
    invoiceNumber,
    clientName: vipClient?.name || 'Client VIP',
    clientAddress: vipClient?.address || vipClient?.phone || 'Adresse non renseignée',
    shippingAddress: vipClient?.address || 'Adresse non renseignée',
    items,
    totalHT,
    tvaRate,
    totalTTC,
    paymentMethod: 'transfer',
    date: new Date(),
    outputPath
  });
};

// ============================================================
//  CRÉATION / MISE À JOUR / SUPPRESSION
// ============================================================

exports.createVIPClient = async (req, res) => {
  try {
    const { name, phone, whatsapp, email, monthlyLimit, billingCycleDay, notes, password } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'name and phone required' });
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return res.status(400).json({ success: false, message: 'Invalid phone format' });
    const data = { name, phone: normalizedPhone, whatsapp, email, monthlyLimit, billingCycleDay, notes };

    const crypto = require('crypto');
    if (password) {
      data.password = await bcrypt.hash(password, 12);
      data.forcePasswordChange = false;
    } else {
      const temp = crypto.randomBytes(4).toString('hex');
      data.password = await bcrypt.hash(temp, 12);
      data.forcePasswordChange = true;
      data._sendTempPassword = temp;
    }

    const vip = await VIPClient.create(data);

    if (data._sendTempPassword) {
      await notificationService.createNotification({
        recipientId: vip._id,
        recipientRole: 'vip',
        type: 'account_created',
        title: 'Compte VIP',
        message: `Votre compte a été créé. Mot de passe temporaire: ${data._sendTempPassword}`
      });
    }

    res.status(201).json({
      success: true,
      data: vip,
      generatedPassword: data._sendTempPassword || undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVIPClient = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.phone) {
      const normalizedPhone = normalizePhone(data.phone);
      if (!normalizedPhone) return res.status(400).json({ success: false, message: 'Invalid phone format' });
      data.phone = normalizedPhone;
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
      data.forcePasswordChange = false;
    }
    const vip = await VIPClient.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!vip) return res.status(404).json({ success: false, message: 'VIP client not found' });
    res.json({ success: true, data: vip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVIPClientById = async (req, res) => {
  try {
    const vip = await VIPClient.findById(req.params.id);
    if (!vip) return res.status(404).json({ success: false, message: 'VIP client not found' });
    res.json({ success: true, data: vip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVIPClient = async (req, res) => {
  try {
    const vip = await VIPClient.findByIdAndDelete(req.params.id);
    if (!vip) return res.status(404).json({ success: false, message: 'VIP client not found' });
    res.json({ success: true, message: 'VIP client deleted permanently', data: vip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVIPClients = async (req, res) => {
  try {
    const list = await VIPClient.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVIPRepair = async (req, res) => {
  try {
    const { vipClientId, deviceModel, imei, issue, diagnostic, technicianId, parts, cost, warrantyDays } = req.body;
    if (!vipClientId || !deviceModel) return res.status(400).json({ success: false, message: 'vipClientId and deviceModel required' });
    const repair = await VIPRepair.create({
      vipClient: vipClientId,
      deviceModel,
      imei,
      issue,
      diagnostic,
      technician: technicianId,
      parts: parts || [],
      cost: cost || 0,
      warrantyDays: warrantyDays || 0,
      status: 'pending'
    });
    await notificationService.notifyAdmins({
      type: 'vip_repair_created',
      title: 'Réparation VIP',
      message: `Réparation pour VIP ${vipClientId}`,
      requestId: repair._id,
      reference: repair._id.toString().slice(-6)
    });
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVIPRepairs = async (req, res) => {
  try {
    const repairs = await VIPRepair.find().populate('vipClient technician').sort({ createdAt: -1 });
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBillableVIPRepairs = async (req, res) => {
  try {
    const { vipClientId, from, to, status, client, repairNumber } = req.query;

    const repairs = await getBillableRepairs({
      vipClientId,
      periodStart: from ? new Date(from) : null,
      periodEnd: to ? new Date(to) : null
    });

    const normalizedClient = String(client || '').trim().toLowerCase();
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const normalizedRepairNumber = String(repairNumber || '').trim().toLowerCase();

    const enriched = repairs.map((repair) => {
      const repairNum = String(repair._id || '').slice(-6).toUpperCase();
      const clientName = String(repair.clientName || '').trim();
      const billingStatus = repair.vipBilling?.status || 'billable';
      return {
        _id: repair._id,
        repairNumber: repairNum,
        createdAt: repair.createdAt,
        completedAt: repair.completedAt,
        repairDate: repair.completedAt || repair.createdAt,
        deviceModel: repair.deviceModel,
        imei: repair.imei || '',
        issueDescription: repair.issueDescription || '',
        technician: repair.assignedTo,
        cost: Number(repair.saleInfo?.amount || repair.price || repair.estimatedPrice || 0),
        status: repair.status,
        clientName,
        clientWhatsapp: repair.clientWhatsapp || '',
        vipClient: repair.vipClient || null,
        vipBilling: repair.vipBilling || {},
        billingStatus
      };
    });

    const data = enriched.filter((row) => {
      const clientOk = !normalizedClient
        || row.clientName.toLowerCase().includes(normalizedClient)
        || String(row.clientWhatsapp || '').toLowerCase().includes(normalizedClient);

      const statusOk = !normalizedStatus
        || String(row.status || '').toLowerCase() === normalizedStatus
        || String(row.billingStatus || '').toLowerCase() === normalizedStatus;

      const numberOk = !normalizedRepairNumber
        || String(row.repairNumber || '').toLowerCase().includes(normalizedRepairNumber)
        || String(row._id || '').toLowerCase().includes(normalizedRepairNumber);

      return clientOk && statusOk && numberOk;
    });

    return res.json({ success: true, data, count: data.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GÉNÉRATION DE FACTURE MENSUELLE VIP (avec PDF)
 */
exports.generateMonthlyInvoice = async (req, res) => {
  try {
    const { vipClientId, periodStart, periodEnd, tvaRate = 0 } = req.body;
    if (!vipClientId || !periodStart || !periodEnd) {
      return res.status(400).json({ success: false, message: 'vipClientId, periodStart and periodEnd required' });
    }

    const result = await generateMonthlyInvoiceForClient({
      vipClientId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      tvaRate,
      user: req.user
    });

    if (!result.invoice && result.reason === 'NO_BILLABLE_REPAIRS') {
      return res.status(200).json({ success: true, created: false, reason: result.reason, message: 'Aucune réparation facturable pour cette période.' });
    }

    if (result.invoice && result.invoice._id) {
      const invoice = result.invoice;
      const vipClient = await VIPClient.findById(vipClientId);
      const repairs = await RepairRequest.find({ _id: { $in: invoice.repairRefs || [] }, isVip: true });

      const uploadsDir = path.join(__dirname, '..', 'uploads', 'vip_invoices');
      ensureDir(uploadsDir);
      const fileName = `VIP_${invoice.invoiceNumber || invoice._id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfUrl = `/uploads/vip_invoices/${fileName}`;

      await generateVIPInvoicePDF({
        invoice,
        vipClient,
        repairs,
        tvaRate: tvaRate || 0,
        outputPath: filePath
      });

      invoice.pdfPath = pdfUrl;
      await invoice.save();
    }

    res.status(result.created ? 201 : 200).json({ success: true, data: result.invoice, created: result.created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GÉNÉRATION DE FACTURE MANUELLE VIP (avec PDF)
 */
exports.generateManualInvoice = async (req, res) => {
  try {
    const rawVipClientId = req.body?.vipClientId;
    const vipClientId = typeof rawVipClientId === 'object' && rawVipClientId !== null
      ? rawVipClientId._id || rawVipClientId.id
      : rawVipClientId;
    const { repairIds = [], tvaRate = 0 } = req.body;

    if (!vipClientId) {
      return res.status(400).json({ success: false, message: 'vipClientId requis' });
    }

    if (!Array.isArray(repairIds) || !repairIds.length) {
      return res.status(400).json({ success: false, message: 'Aucune réparation sélectionnée pour la facturation manuelle.' });
    }

    const result = await generateManualInvoiceForClient({
      vipClientId,
      repairIds: Array.isArray(repairIds) ? repairIds : [],
      tvaRate,
      user: req.user
    });

    if (!result.invoice && result.reason === 'NO_BILLABLE_REPAIRS') {
      return res.status(200).json({ success: true, created: false, reason: result.reason, message: 'Aucune réparation facturable à facturer.' });
    }

    if (result.invoice && result.invoice._id) {
      const invoice = result.invoice;
      const vipClient = await VIPClient.findById(vipClientId);
      const repairs = await RepairRequest.find({ _id: { $in: repairIds }, isVip: true });

      const uploadsDir = path.join(__dirname, '..', 'uploads', 'vip_invoices');
      ensureDir(uploadsDir);
      const fileName = `VIP_${invoice.invoiceNumber || invoice._id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      const pdfUrl = `/uploads/vip_invoices/${fileName}`;

      await generateVIPInvoicePDF({
        invoice,
        vipClient,
        repairs,
        tvaRate: tvaRate || 0,
        outputPath: filePath
      });

      invoice.pdfPath = pdfUrl;
      await invoice.save();
    }

    return res.status(201).json({ success: true, created: true, data: result.invoice });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflit de facture détecté. Merci de relancer la génération.' });
    }
    if (String(error?.message || '').toLowerCase().includes('aucune réparation valide')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (String(error?.name || '').includes('CastError')) {
      return res.status(400).json({ success: false, message: 'Identifiants VIP/réparations invalides.' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
//  AUTHENTIFICATION VIP (LOGIN, FORGOT, RESET, CHANGE)
// ============================================================

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log('🔐 Tentative de login VIP avec phone:', phone);

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Téléphone et mot de passe requis' });
    }

    // Étape 1 : Recherche par téléphone exact (tel que saisi)
    let vip = await VIPClient.findOne({ phone: phone.trim(), isActive: true });

    // Étape 2 : Si non trouvé, normaliser (enlever espaces, tirets, ajuster +)
    if (!vip) {
      const raw = String(phone).replace(/\s/g, '').replace(/-/g, '');
      const normalized = raw.startsWith('+') ? raw : `+${raw}`;
      console.log('🔍 Recherche avec normalisé:', normalized);
      vip = await VIPClient.findOne({ phone: normalized, isActive: true });
    }

    // Étape 3 : Si toujours non trouvé, chercher par chiffres uniquement (parmi tous les clients)
    if (!vip) {
      const digitsOnly = String(phone).replace(/\D/g, '');
      console.log('🔍 Recherche par chiffres uniquement:', digitsOnly);
      const allVips = await VIPClient.find({ isActive: true });
      vip = allVips.find(c => String(c.phone).replace(/\D/g, '') === digitsOnly);
    }

    if (!vip) {
      console.log('❌ Client VIP introuvable');
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    console.log('✅ Client trouvé:', vip.name, vip.phone);

    // Vérifier que le mot de passe existe
    if (!vip.password) {
      console.log('❌ Mot de passe manquant pour ce client');
      return res.status(401).json({ success: false, message: 'Mot de passe non défini' });
    }

    // Comparer le mot de passe
    const isValid = await bcrypt.compare(password, vip.password);
    if (!isValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // Générer le token
    const token = signToken({ id: vip._id, role: 'vip', name: vip.name, phone: vip.phone });
    const { password: _, ...user } = vip.toObject();

    console.log('✅ Login VIP réussi pour:', vip.name);
    res.json({ success: true, data: { user, token }, message: 'Login successful' });
  } catch (error) {
    console.error('❌ Erreur login VIP:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ success: false, message: 'phone or email required' });

    let vip = null;
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      vip = await findVIPByPhoneComparable(normalizedPhone);
    } else {
      vip = await VIPClient.findOne({ email });
    }

    if (!vip) return res.status(404).json({ success: false, message: 'VIP client not found' });

    const crypto = require('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    vip.resetPasswordToken = token;
    vip.resetPasswordExpires = new Date(Date.now() + 3600 * 1000);
    await vip.save();

    await notificationService.createNotification({
      recipientId: vip._id,
      recipientRole: 'vip',
      type: 'password_reset',
      title: 'Réinitialisation mot de passe',
      message: `Utilisez ce code pour réinitialiser votre mot de passe: ${token}`,
      reference: 'password_reset'
    });

    res.json({ success: true, message: 'Reset token generated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'token and newPassword required' });
    const vip = await VIPClient.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!vip) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    vip.password = await bcrypt.hash(newPassword, 12);
    vip.resetPasswordToken = undefined;
    vip.resetPasswordExpires = undefined;
    vip.forcePasswordChange = false;
    await vip.save();

    await notificationService.createNotification({
      recipientId: vip._id,
      recipientRole: 'vip',
      type: 'password_changed',
      title: 'Mot de passe modifié',
      message: 'Votre mot de passe a bien été réinitialisé.'
    });

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;
    if (!user || user.role !== 'vip') return res.status(401).json({ success: false, message: 'Not authorized' });
    const vip = await VIPClient.findById(user.id);
    if (!vip) return res.status(404).json({ success: false, message: 'VIP not found' });

    if (!vip.forcePasswordChange) {
      if (!oldPassword) return res.status(400).json({ success: false, message: 'oldPassword required' });
      const valid = await bcrypt.compare(oldPassword, vip.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Old password incorrect' });
    }

    vip.password = await bcrypt.hash(newPassword, 12);
    vip.forcePasswordChange = false;
    await vip.save();

    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
//  FACTURES ET PAIEMENTS VIP
// ============================================================

exports.getVIPInvoices = async (req, res) => {
  try {
    const { vipClientId, status } = req.query;
    const filters = {};
    if (vipClientId) filters.vipClient = vipClientId;
    if (status) filters.status = status;
    const invoices = await VIPInvoice.find(filters).populate('vipClient').sort({ createdAt: -1 });

    const now = new Date();
    for (const invoice of invoices) {
      if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && Number(invoice.balance || 0) > 0 && invoice.dueAt && new Date(invoice.dueAt) < now) {
        invoice.status = 'overdue';
        invoice.auditTrail = Array.isArray(invoice.auditTrail) ? invoice.auditTrail : [];
        invoice.auditTrail.push({
          action: 'marked_overdue',
          at: now,
          byId: null,
          byRole: 'system',
          byName: 'system',
          data: { dueAt: invoice.dueAt }
        });
        await invoice.save();
      }
    }

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateReceiptPdf = async ({ invoice, payment, vipClient }) => {
  const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
  ensureDir(receiptsDir);
  const fileName = `receipt_vip_${invoice.invoiceNumber || invoice._id}_${Date.now()}.pdf`;
  const filePath = path.join(receiptsDir, fileName);
  const publicUrl = `/uploads/receipts/${fileName}`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    doc.fontSize(20).text('Reçu de paiement VIP', { align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(11).text(`Facture: ${invoice.invoiceNumber || invoice._id}`);
    doc.text(`Client VIP: ${vipClient?.name || '-'}`);
    doc.text(`Date paiement: ${new Date(payment.paidAt).toLocaleString('fr-FR')}`);
    doc.text(`Montant reçu: ${Number(payment.amount || 0).toLocaleString('fr-FR')} FCFA`);
    doc.text(`Méthode: ${payment.method}`);
    if (payment.reference) doc.text(`Référence: ${payment.reference}`);
    if (payment.note) doc.text(`Note: ${payment.note}`);
    doc.moveDown();
    doc.text(`Encaisse par: ${payment.receivedByName || payment.receivedByRole || '-'}`);
    doc.text(`Solde facture après paiement: ${Number(invoice.balance || 0).toLocaleString('fr-FR')} FCFA`);
    doc.end();
  });

  return { filePath, publicUrl };
};

/**
 * ⭐ RECORD VIP INVOICE PAYMENT (AVEC MISE À JOUR DU STATUT DES RÉPARATIONS)
 */
exports.recordVIPInvoicePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'cash', paymentReference = '', note = '', paymentDate = null } = req.body;
    const paymentAmount = Number(amount || 0);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Montant de paiement invalide.' });
    }

    const invoice = await VIPInvoice.findById(id).populate('vipClient');
    if (!invoice) return res.status(404).json({ success: false, message: 'Facture VIP introuvable.' });
    if (invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Impossible d\'encaisser une facture annulée.' });
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cette facture est déjà payée.' });
    }

    const expectedBalance = Number(invoice.balance || 0);
    if (Math.abs(paymentAmount - expectedBalance) > 0.0001) {
      return res.status(400).json({
        success: false,
        message: `Le montant doit correspondre au solde restant (${expectedBalance.toLocaleString('fr-FR')} FCFA).`
      });
    }

    const nextPaidAmount = Number(invoice.paidAmount || 0) + paymentAmount;
    const nextBalance = Math.max(0, Number(invoice.total || 0) - nextPaidAmount);
    const now = new Date();
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : now;
    if (Number.isNaN(parsedPaymentDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Date de paiement invalide.' });
    }

    const payment = {
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference,
      note,
      paidAt: parsedPaymentDate,
      receivedById: req.user?.id || null,
      receivedByRole: req.user?.role || '',
      receivedByName: req.user?.name || req.user?.email || ''
    };

    invoice.payments = Array.isArray(invoice.payments) ? [...invoice.payments, payment] : [payment];
    invoice.paidAmount = nextPaidAmount;
    invoice.balance = nextBalance;
    invoice.status = 'paid';

    const receipt = await generateReceiptPdf({ invoice, payment, vipClient: invoice.vipClient });
    const paymentIndex = invoice.payments.length - 1;
    invoice.payments[paymentIndex].receiptUrl = receipt.publicUrl;
    invoice.receiptPath = receipt.publicUrl;

    invoice.auditTrail = Array.isArray(invoice.auditTrail) ? invoice.auditTrail : [];
    invoice.auditTrail.push({
      action: 'payment_recorded',
      at: now,
      byId: req.user?.id || null,
      byRole: req.user?.role || '',
      byName: req.user?.name || req.user?.email || '',
      data: {
        amount: paymentAmount,
        paymentMethod,
        paymentReference,
        paymentDate: parsedPaymentDate,
        balanceAfter: nextBalance,
        receiptUrl: receipt.publicUrl
      }
    });

    await invoice.save();

    // ⭐ Mise à jour du statut des réparations associées
    if (Array.isArray(invoice.repairRefs) && invoice.repairRefs.length) {
      await RepairRequest.updateMany(
        { _id: { $in: invoice.repairRefs } },
        {
          $set: {
            status: 'paid', // ⬅️ Le statut global passe à "payé"
            'vipBilling.status': invoice.status === 'paid' ? 'paid' : 'invoiced',
            'vipBilling.paidAt': invoice.status === 'paid' ? now : null,
            'vipBilling.paymentId': invoice.payments[paymentIndex]?._id || null
          },
          $push: {
            'vipBilling.auditTrail': {
              action: 'invoice_payment_recorded',
              at: now,
              invoiceId: invoice._id,
              paymentAmount,
              byRole: req.user?.role || '',
              byId: req.user?.id || null
            }
          }
        }
      );
    }

    return res.json({ success: true, data: invoice, message: 'Paiement enregistré avec succès.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVIPClientHistory = async (req, res) => {
  try {
    const { clientId } = req.params;
    const vipClient = await VIPClient.findById(clientId);
    if (!vipClient) return res.status(404).json({ success: false, message: 'Client VIP introuvable.' });

    const [repairs, invoices] = await Promise.all([
      RepairRequest.find({ vipClient: clientId, isVip: true })
        .populate('assignedTo', 'name email')
        .populate('vipBilling.invoiceId', 'invoiceNumber status issuedAt dueAt paidAmount balance')
        .sort({ createdAt: -1 }),
      VIPInvoice.find({ vipClient: clientId }).sort({ createdAt: -1 })
    ]);

    const payments = invoices.flatMap((invoice) =>
      (invoice.payments || []).map((payment) => ({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt,
        receivedByName: payment.receivedByName,
        receiptUrl: payment.receiptUrl
      }))
    ).sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0));

    return res.json({
      success: true,
      data: {
        client: vipClient,
        repairs,
        invoices,
        payments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyVIPRepairs = async (req, res) => {
  try {
    const vipClientId = req.user?.id;
    if (!vipClientId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const repairs = await RepairRequest.find({ vipClient: vipClientId, isVip: true })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email')
      .populate('vipBilling.invoiceId', 'invoiceNumber status issuedAt dueAt paidAmount balance');
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyVIPInvoices = async (req, res) => {
  try {
    const vipClientId = req.user?.id;
    if (!vipClientId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const invoices = await VIPInvoice.find({ vipClient: vipClientId }).sort({ createdAt: -1 });
    const totalBilled = invoices.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalPaid = invoices.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalBalance = invoices.reduce((sum, item) => sum + (item.balance || 0), 0);
    res.json({ success: true, data: { invoices, summary: { totalBilled, totalPaid, totalBalance } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestVIPRepair = async (req, res) => {
  try {
    const vipClientId = req.user?.id;
    if (!vipClientId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const vipClient = await VIPClient.findById(vipClientId);
    if (!vipClient || !vipClient.isActive) {
      return res.status(404).json({ success: false, message: 'VIP client not found or inactive' });
    }

    const { deviceModel, issueDescription, notes } = req.body;
    if (!deviceModel) return res.status(400).json({ success: false, message: 'deviceModel required' });

    const repair = await RepairRequest.create({
      clientName: vipClient.name,
      clientWhatsapp: vipClient.whatsapp || vipClient.phone,
      vipClient: vipClientId,
      isVip: true,
      billingMode: 'monthly_invoice',
      deviceModel,
      issueDescription: issueDescription || '',
      estimatedPrice: 0,
      technicianReport: notes || '',
      status: 'pending',
      saleInfo: {
        amount: 0,
        amountPaid: 0,
        paymentMethod: 'transfer',
        notes: 'VIP monthly billing'
      },
      vipBilling: {
        status: 'pending',
        invoiceId: null,
        invoicedAt: null,
        paidAt: null,
        paymentId: null,
        auditTrail: [
          {
            action: 'vip_repair_created',
            at: new Date(),
            byRole: 'vip',
            byId: vipClientId
          }
        ]
      }
    });

    await notificationService.notifyAdmins({
      type: 'vip_repair_created',
      title: 'Nouvelle demande de réparation VIP',
      message: `Demande VIP créée (${repair.deviceModel}) - client: ${vipClient.name}`,
      requestId: repair._id,
      reference: String(repair._id).slice(-6)
    });

    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadVIPInvoicePdf = async (req, res) => {
  try {
    const invoice = await VIPInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (req.user?.role === 'vip' && String(invoice.vipClient) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!invoice.pdfPath) {
      return res.status(404).json({ success: false, message: 'PDF not available for this invoice' });
    }

    const normalized = String(invoice.pdfPath).replace(/^\/+/, '');
    const absolutePath = path.join(__dirname, '..', normalized);
    return res.download(absolutePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};