const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { signToken } = require('../utils/jwt');
const Reseller = require('../models/Reseller');
const ResellerContract = require('../models/ResellerContract');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const notificationService = require('../services/notificationService');

const generateContractNumber = () => {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CTR-${year}-${suffix}`;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const formatFcfa = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

const normalizePhone = (value = '') => {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return raw.startsWith('+') ? `+${digits}` : digits;
};

const validateIdentityPayload = (identity = {}, { strictRequired = false } = {}) => {
  const idNumber = String(identity.idNumber || '').trim();
  const idFrontUrl = String(identity.idFrontUrl || '').trim();
  const idBackUrl = String(identity.idBackUrl || '').trim();
  const idExpiryDate = identity.idExpiryDate ? new Date(identity.idExpiryDate) : null;

  if (strictRequired) {
    if (!idNumber || !idFrontUrl || !idBackUrl || !idExpiryDate) {
      return { valid: false, message: 'Pièce d\'identité incomplète: numéro, date d\'expiration, recto et verso sont requis.' };
    }
  }

  if (idExpiryDate && Number.isNaN(idExpiryDate.getTime())) {
    return { valid: false, message: 'Date d\'expiration de la pièce invalide.' };
  }

  if (idExpiryDate && idExpiryDate < new Date()) {
    return { valid: false, message: 'La pièce d\'identité est expirée.' };
  }

  return {
    valid: true,
    identity: {
      idNumber,
      idFrontUrl,
      idBackUrl,
      idExpiryDate,
      isValid: Boolean(idNumber && idFrontUrl && idBackUrl && idExpiryDate),
      validatedAt: idNumber && idFrontUrl && idBackUrl && idExpiryDate ? new Date() : null
    }
  };
};

const comparablePhone = (value = '') => String(value || '').replace(/\D/g, '');

const findResellerByPhoneComparable = async (phone, extraFilter = {}) => {
  const target = comparablePhone(phone);
  if (!target) return null;

  const candidates = await Reseller.find(extraFilter);
  return candidates.find((item) => comparablePhone(item.phone) === target) || null;
};

const getStockValue = (item) => {
  if (!item) return 0;
  if (typeof item.stock === 'number') return item.stock;
  return Number(item.quantity || 0);
};

const getUnitPriceValue = (item) => {
  if (!item) return 0;
  if (typeof item.price === 'number') return item.price;
  return Number(item.unitPrice || 0);
};

const normalizeCatalogPhone = (item, sourceModel) => ({
  _id: item._id,
  name: item.name,
  brand: item.brand || '',
  sku: item.sku || '',
  category: sourceModel === 'Product' ? 'phone' : (item.category || ''),
  quantity: getStockValue(item),
  unitPrice: getUnitPriceValue(item),
  photos: item.photos || [],
  sourceModel
});

const createContractPdf = async (contract) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'contracts');
  ensureDir(uploadsDir);

  const contractNumberSafe = String(contract.number || 'contrat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `contrat_${contractNumberSafe}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);
  const pdfUrl = `/uploads/contracts/${fileName}`;

  const resolvedProduct = await findPhoneByAnySource(contract.product?._id || contract.product);
  const product = resolvedProduct?.doc;

  const resellerName = contract.reseller?.name || 'Revendeur';
  const resellerPhone = contract.reseller?.phone || '';
  const resellerWhatsapp = contract.reseller?.whatsapp || '';
  const productName = product?.name || contract.product?.name || 'Téléphone';
  const imei = contract.imei || 'Non renseigné';
  const catalogPrice = Number(contract.catalogPrice || 0);
  const negotiatedPrice = Number(contract.negotiatedPrice || 0);
  const expectedSalePrice = Number(contract.expectedSalePrice || 0);
  const createdAt = contract.createdAt ? new Date(contract.createdAt) : new Date();
  const dueAt = contract.dueAt ? new Date(contract.dueAt) : null;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.rect(0, 0, doc.page.width, 110).fill('#0F172A');
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFFFFF').text('CONTRAT REVENDEUR', 40, 36);
  doc.font('Helvetica').fontSize(10).fillColor('#CBD5E1').text(`Référence: ${contract.number}`, 40, 68);
  doc.font('Helvetica').fontSize(10).fillColor('#CBD5E1').text(`Date: ${createdAt.toLocaleDateString('fr-FR')}`, 260, 68);

  let y = 130;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('1. Parties', 40, y);
  y += 20;
  doc.font('Helvetica').fontSize(10).fillColor('#111827')
    .text('Entreprise: Eli Business Center, Lomé, Togo', 40, y)
    .text(`Revendeur: ${resellerName}`, 40, y + 16)
    .text(`Téléphone: ${resellerPhone || 'Non renseigné'}`, 40, y + 32)
    .text(`WhatsApp: ${resellerWhatsapp || 'Non renseigné'}`, 40, y + 48);

  y += 80;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('2. Objet du contrat', 40, y);
  y += 20;
  doc.font('Helvetica').fontSize(10).fillColor('#111827')
    .text(`Produit confié: ${productName}`, 40, y)
    .text(`IMEI / Série: ${imei}`, 40, y + 16)
    .text(`Prix catalogue: ${formatFcfa(catalogPrice)}`, 40, y + 32)
    .text(`Prix négocié: ${formatFcfa(negotiatedPrice)}`, 40, y + 48)
    .text(`Prix final attendu: ${formatFcfa(expectedSalePrice)}`, 40, y + 64);

  y += 100;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('3. Conditions principales', 40, y);
  y += 22;
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text(
    '- Le revendeur confirme la réception du produit et s’engage à respecter le délai convenu.\n' +
    '- En cas de vente validée par les deux parties, l’encaissement est réalisé par le caissier.\n' +
    '- En cas de retour validé, le produit est restitué au stock de l’entreprise.\n' +
    '- Toute modification substantielle doit être validée dans le système.',
    40,
    y,
    { width: doc.page.width - 80, lineGap: 4 }
  );

  y += 88;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A').text('4. Délai et échéance', 40, y);
  y += 20;
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text(
    dueAt
      ? `Échéance actuelle: ${dueAt.toLocaleString('fr-FR')}`
      : 'L’échéance de 48h démarre après confirmation du retrait.',
    40,
    y
  );

  const signatureY = 670;
  doc.moveTo(60, signatureY).lineTo(260, signatureY).strokeColor('#9CA3AF').stroke();
  doc.moveTo(340, signatureY).lineTo(540, signatureY).strokeColor('#9CA3AF').stroke();
  doc.font('Helvetica').fontSize(9).fillColor('#374151').text('Signature entreprise', 110, signatureY + 8);
  doc.font('Helvetica').fontSize(9).fillColor('#374151').text('Signature revendeur', 395, signatureY + 8);

  doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
    .text('Document généré électroniquement par Eli Business Center.', 40, 740, {
      width: doc.page.width - 80,
      align: 'center'
    });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { pdfUrl, filePath };
};

const findPhoneByAnySource = async (productId) => {
  if (!productId) return null;

  const product = await Product.findById(productId);
  if (product) {
    return { sourceModel: 'Product', doc: product };
  }

  const inventoryItem = await InventoryItem.findById(productId);
  if (inventoryItem) {
    return { sourceModel: 'InventoryItem', doc: inventoryItem };
  }

  return null;
};

exports.createReseller = async (req, res) => {
  try {
    const { name, phone, whatsapp, email, address, notes, password, identity } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'name and phone required' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Invalid phone format' });
    }

    const duplicatePhone = await findResellerByPhoneComparable(normalizedPhone);
    const duplicateEmail = email ? await Reseller.findOne({ email }) : null;
    if (duplicatePhone || duplicateEmail) {
      return res.status(400).json({ success: false, message: 'Reseller with same phone/email already exists' });
    }

    const identityCheck = validateIdentityPayload(identity, { strictRequired: true });
    if (!identityCheck.valid) {
      return res.status(400).json({ success: false, message: identityCheck.message });
    }

    const data = {
      name,
      phone: normalizedPhone,
      whatsapp,
      email,
      address,
      notes,
      identity: identityCheck.identity
    };

    if (password) {
      data.password = await bcrypt.hash(password, 12);
      data.forcePasswordChange = false;
    } else {
      const temp = crypto.randomBytes(4).toString('hex');
      data.password = await bcrypt.hash(temp, 12);
      data.forcePasswordChange = true;
      data._sendTempPassword = temp;
    }

    const seller = await Reseller.create(data);

    if (data._sendTempPassword) {
      await notificationService.createNotification({
        recipientId: seller._id,
        recipientRole: 'reseller',
        type: 'account_created',
        title: 'Compte Revendeur',
        message: `Votre compte a ete cree. Mot de passe temporaire: ${data._sendTempPassword}`
      });
    }

    res.status(201).json({
      success: true,
      data: seller,
      generatedPassword: data._sendTempPassword || undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReseller = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.identity) {
      const identityCheck = validateIdentityPayload(data.identity, { strictRequired: true });
      if (!identityCheck.valid) {
        return res.status(400).json({ success: false, message: identityCheck.message });
      }
      data.identity = identityCheck.identity;
    }

    if (data.phone) {
      const normalizedPhone = normalizePhone(data.phone);
      if (!normalizedPhone) {
        return res.status(400).json({ success: false, message: 'Invalid phone format' });
      }

      const duplicatePhone = await findResellerByPhoneComparable(normalizedPhone, { _id: { $ne: req.params.id } });
      if (duplicatePhone) {
        return res.status(400).json({ success: false, message: 'Reseller with same phone already exists' });
      }

      data.phone = normalizedPhone;
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
      data.forcePasswordChange = false;
    }

    const seller = await Reseller.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!seller) return res.status(404).json({ success: false, message: 'Reseller not found' });
    res.json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReseller = async (req, res) => {
  try {
    const seller = await Reseller.findByIdAndDelete(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Reseller not found' });
    res.json({ success: true, message: 'Reseller deleted permanently', data: seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResellers = async (req, res) => {
  try {
    const resellers = await Reseller.find().sort({ createdAt: -1 });
    res.json({ success: true, data: resellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReseller = async (req, res) => {
  try {
    const seller = await Reseller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Reseller not found' });
    const contracts = await ResellerContract.find({ reseller: seller._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { seller, contracts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createContract = async (req, res) => {
  try {
    const {
      resellerId,
      resellerName,
      resellerPhone,
      resellerWhatsapp,
      resellerEmail,
      resellerAddress,
      resellerNotes,
      productId,
      imei,
      catalogPrice,
      negotiatedPrice,
      expectedSalePrice
    } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

    let effectiveResellerId = resellerId;

    if (!effectiveResellerId) {
      if (!resellerName || !resellerPhone) {
        return res.status(400).json({ success: false, message: 'resellerId or resellerName/resellerPhone required' });
      }

      const normalizedPhone = normalizePhone(resellerPhone);
      if (!normalizedPhone) {
        return res.status(400).json({ success: false, message: 'Invalid reseller phone format' });
      }

      const existingReseller = await findResellerByPhoneComparable(normalizedPhone);
      if (existingReseller) {
        effectiveResellerId = existingReseller._id;
      } else {
        const createdReseller = await Reseller.create({
          name: resellerName,
          phone: normalizedPhone,
          whatsapp: resellerWhatsapp || '',
          email: resellerEmail || '',
          address: resellerAddress || '',
          notes: resellerNotes || 'Créé automatiquement lors de la création d\'un contrat admin.',
          isActive: true,
          metadata: {
            portalAccount: false,
            createdBy: req.user?.id || null,
            createdVia: 'admin_contract_creation'
          }
        });
        effectiveResellerId = createdReseller._id;
      }
    }

    const resolvedProduct = await findPhoneByAnySource(productId);
    if (!resolvedProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = resolvedProduct.doc;
    const isActive = resolvedProduct.sourceModel === 'Product' ? product.active !== false : product.isActive !== false;
    const stock = getStockValue(product);
    if (!isActive || stock <= 0) return res.status(400).json({ success: false, message: 'Product not available' });

    const number = generateContractNumber();

    const contract = await ResellerContract.create({
      number,
      reseller: effectiveResellerId,
      product: productId,
      imei,
      catalogPrice: Number(catalogPrice || getUnitPriceValue(product) || 0),
      negotiatedPrice,
      expectedSalePrice,
      handedAt: null,
      dueAt: null,
      status: 'approved',
      history: [{
        byRole: req.user?.role || 'admin',
        byId: req.user?.id || null,
        action: 'created_approved_waiting_pickup',
        data: { comment: 'Contrat créé par admin - en attente de retrait du téléphone.' },
        createdAt: new Date()
      }]
    });

    await notificationService.createNotification({
      recipientId: effectiveResellerId,
      recipientRole: 'reseller',
      type: 'contract_created',
      title: 'Contrat cree',
      message: `Un contrat ${number} a ete cree et attend le retrait du telephone.`,
      requestId: contract._id,
      clientName: '',
      reference: number
    });
    await notificationService.notifyAdmins({
      type: 'contract_created',
      title: 'Nouveau contrat revendeur',
      message: `Contrat ${number} cree`,
      requestId: contract._id,
      clientName: '',
      reference: number
    });

    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getContracts = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.user?.role === 'reseller') {
      filters.reseller = req.user.id;
    } else if (req.query.resellerId) {
      filters.reseller = req.query.resellerId;
    }
    const contracts = await ResellerContract.find(filters).populate('reseller').sort({ createdAt: -1 });

    const hydratedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const raw = contract.toObject();
        const resolved = await findPhoneByAnySource(raw.product);
        if (resolved) {
          raw.product = normalizeCatalogPhone(resolved.doc.toObject(), resolved.sourceModel);
        }
        return raw;
      })
    );
    res.json({ success: true, data: hydratedContracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateContractStatus = async (req, res) => {
  try {
    const contract = await ResellerContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });

    const { status, saleInfo } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status required' });
    }

    const role = req.user?.role || 'admin';
    const isReseller = role === 'reseller';
    const isAdminLike = ['admin', 'super_admin', 'commercial_manager'].includes(role);

    if (isReseller && String(contract.reseller) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden for this contract' });
    }

    const allowedStatuses = ['pending', 'approved', 'active', 'sold', 'returned', 'expired', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    if (isReseller && !['sold', 'returned'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Reseller can only declare sold or returned' });
    }

    if (status === 'approved') {
      if (!isAdminLike) {
        return res.status(403).json({ success: false, message: 'Only admin can accept contracts' });
      }
      if (contract.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending contracts can be accepted' });
      }
      contract.handedAt = null;
      contract.dueAt = null;
      contract.status = 'approved';
      contract.history.push({ byRole: role, byId: req.user?.id || null, action: 'status:approved', data: {} });
      await contract.save();
      return res.json({ success: true, data: contract });
    }

    if (status === 'active') {
      if (!isAdminLike) {
        return res.status(403).json({ success: false, message: 'Only admin can validate pickup step' });
      }
      if (contract.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Only approved contracts can start 48h countdown' });
      }

      const resolvedProduct = await findPhoneByAnySource(contract.product);
      const product = resolvedProduct?.doc;
      const isActive = resolvedProduct?.sourceModel === 'Product' ? product?.active !== false : product?.isActive !== false;
      const stock = getStockValue(product);

      if (!product || !isActive || stock <= 0) {
        return res.status(400).json({ success: false, message: 'Product unavailable for pickup assignment' });
      }

      if (resolvedProduct.sourceModel === 'Product') {
        product.stock = stock - 1;
      } else {
        product.quantity = stock - 1;
      }
      await product.save();

      const handedAt = new Date();
      contract.handedAt = handedAt;
      contract.dueAt = new Date(handedAt.getTime() + 48 * 60 * 60 * 1000);
      contract.status = 'active';
      contract.history.push({ byRole: role, byId: req.user?.id || null, action: 'status:active', data: { dueAt: contract.dueAt } });
      await contract.save();

      await Reseller.findByIdAndUpdate(contract.reseller, { $inc: { 'stats.withdrawnCount': 1 } });

      await notificationService.createNotification({
        recipientId: contract.reseller,
        recipientRole: 'reseller',
        type: 'contract_updated',
        title: 'Contrat mis a jour',
        message: `Contrat ${contract.number} : retrait confirmé, compte à rebours 48h démarré.`,
        requestId: contract._id,
        reference: contract.number
      });

      return res.json({ success: true, data: contract });
    }

    if (['sold', 'returned'].includes(status)) {
      if (!isReseller && !isAdminLike) {
        return res.status(403).json({ success: false, message: 'Only reseller and admin can declare outcome' });
      }

      if (contract.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Only active contracts can be declared sold/returned' });
      }

      const now = new Date();
      contract.confirmation = contract.confirmation || {};
      contract.saleInfo = contract.saleInfo || {};
      contract.payment = contract.payment || { required: false, status: 'none' };

      const amountCandidate = Number(saleInfo?.amount);
      if (Number.isFinite(amountCandidate) && amountCandidate > 0) {
        contract.saleInfo.amount = amountCandidate;
      }

      const decisionField = isReseller ? 'resellerDecision' : 'adminDecision';
      const decisionAtField = isReseller ? 'resellerConfirmedAt' : 'adminConfirmedAt';
      const otherDecision = isReseller ? contract.confirmation.adminDecision : contract.confirmation.resellerDecision;

      if (otherDecision && otherDecision !== status) {
        return res.status(400).json({ success: false, message: `Conflit: l'autre partie a déjà indiqué \"${otherDecision}\".` });
      }

      contract.confirmation[decisionField] = status;
      contract.confirmation[decisionAtField] = now;
      contract.history.push({
        byRole: role,
        byId: req.user?.id || null,
        action: `decision:${status}`,
        data: { ...(saleInfo || {}), waitingForCounterparty: true },
        createdAt: now
      });

      const resellerDecision = contract.confirmation.resellerDecision;
      const adminDecision = contract.confirmation.adminDecision;

      if (!resellerDecision || !adminDecision) {
        await contract.save();

        await notificationService.createNotification({
          recipientId: contract.reseller,
          recipientRole: 'reseller',
          type: 'contract_outcome_waiting_confirmation',
          title: 'Validation en attente',
          message: `Contrat ${contract.number}: ${role} a déclaré \"${status}\". En attente de la seconde validation.`,
          requestId: contract._id,
          reference: contract.number
        });

        await notificationService.notifyAdmins({
          type: 'contract_outcome_waiting_confirmation',
          title: 'Validation contrat en attente',
          message: `Contrat ${contract.number}: une partie a déclaré \"${status}\".`,
          requestId: contract._id,
          reference: contract.number
        });

        return res.json({ success: true, data: contract, message: 'Validation enregistrée. En attente de la confirmation de l\'autre partie.' });
      }

      if (resellerDecision !== adminDecision) {
        return res.status(400).json({ success: false, message: 'Les deux parties doivent confirmer le même résultat.' });
      }

      contract.confirmation.finalizedAt = now;
      contract.confirmation.finalizedBy = 'mutual';

      if (resellerDecision === 'returned') {
        const resolvedProduct = await findPhoneByAnySource(contract.product);
        if (resolvedProduct) {
          const product = resolvedProduct.doc;
          if (resolvedProduct.sourceModel === 'Product') {
            product.stock = getStockValue(product) + 1;
            product.active = true;
          } else {
            product.quantity = getStockValue(product) + 1;
            product.isActive = true;
          }
          await product.save();
        }

        contract.status = 'returned';
        contract.payment.required = false;
        contract.payment.status = 'none';

        await Reseller.findByIdAndUpdate(contract.reseller, { $inc: { 'stats.returnedCount': 1 } });
      } else {
        const amount = Number(
          contract.saleInfo?.amount ||
          contract.expectedSalePrice ||
          contract.negotiatedPrice ||
          contract.catalogPrice ||
          0
        );

        if (!Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({ success: false, message: 'Montant de vente requis pour finaliser la vente.' });
        }

        contract.saleInfo.amount = amount;
        contract.status = 'sold';
        contract.payment.required = true;
        contract.payment.status = 'pending_cashier';
        contract.payment.amountExpected = amount;
        contract.payment.amountPaid = 0;
        contract.payment.collectionDueAt = new Date(now.getTime() + 5 * 60 * 60 * 1000);
        contract.payment.paidAt = null;
        contract.payment.paidById = null;
        contract.payment.paidByRole = null;

        await Reseller.findByIdAndUpdate(contract.reseller, { $inc: { 'stats.soldCount': 1 } });

        await notificationService.notifyCashiers({
          type: 'reseller_contract_cash_collection_required',
          title: 'Encaissement revendeur requis',
          message: `Contrat ${contract.number} vendu. Encaissement de ${amount.toLocaleString('fr-FR')} FCFA à effectuer.`,
          requestId: contract._id,
          reference: contract.number
        });
      }

      contract.history.push({
        byRole: 'system',
        byId: null,
        action: `finalized:${contract.status}`,
        data: {
          resellerDecision: contract.confirmation.resellerDecision,
          adminDecision: contract.confirmation.adminDecision,
          paymentStatus: contract.payment?.status || 'none'
        },
        createdAt: now
      });

      await contract.save();

      await notificationService.createNotification({
        recipientId: contract.reseller,
        recipientRole: 'reseller',
        type: 'contract_updated',
        title: 'Contrat finalisé',
        message: contract.status === 'sold'
          ? `Contrat ${contract.number} vendu et validé par les deux parties. En attente d'encaissement caissier.`
          : `Contrat ${contract.number} retourné et validé par les deux parties.`,
        requestId: contract._id,
        reference: contract.number
      });

      await notificationService.notifyAdmins({
        type: 'contract_updated',
        title: 'Contrat finalisé',
        message: `Contrat ${contract.number} finalisé (${contract.status}).`,
        requestId: contract._id,
        reference: contract.number
      });

      return res.json({ success: true, data: contract });
    }

    return res.status(400).json({ success: false, message: 'Unsupported status transition for this workflow' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingCashierCollections = async (req, res) => {
  try {
    const contracts = await ResellerContract.find({
      status: 'sold',
      'payment.status': { $in: ['pending_cashier', 'paid'] }
    }).populate('reseller').sort({ updatedAt: -1 });

    const hydratedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const raw = contract.toObject();
        const resolved = await findPhoneByAnySource(raw.product);
        if (resolved) {
          raw.product = normalizeCatalogPhone(resolved.doc.toObject(), resolved.sourceModel);
        }
        return raw;
      })
    );

    const pendingContracts = hydratedContracts.filter((contract) => contract.payment?.status === 'pending_cashier');
    const paidContracts = hydratedContracts.filter((contract) => contract.payment?.status === 'paid');
    const statusFilter = req.query?.status || 'pending';

    const pendingAmount = pendingContracts.reduce((sum, contract) => sum + Number(contract.payment?.amountExpected || contract.saleInfo?.amount || 0), 0);
    const paidAmount = paidContracts.reduce((sum, contract) => sum + Number(contract.payment?.amountPaid || 0), 0);
    const now = new Date();
    const overdueCount = pendingContracts.filter((contract) => {
      const due = contract.payment?.collectionDueAt ? new Date(contract.payment.collectionDueAt) : null;
      return due && due < now;
    }).length;

    const selectedData = statusFilter === 'paid'
      ? paidContracts
      : statusFilter === 'all'
        ? hydratedContracts
        : pendingContracts;

    const selectedDataWithTiming = selectedData.map((contract) => {
      const due = contract.payment?.collectionDueAt ? new Date(contract.payment.collectionDueAt) : null;
      const remainingMs = due ? due.getTime() - now.getTime() : null;
      return {
        ...contract,
        payment: {
          ...(contract.payment || {}),
          remainingMs,
          isOverdue: remainingMs !== null ? remainingMs < 0 : false
        }
      };
    });

    res.json({
      success: true,
      data: selectedDataWithTiming,
      meta: {
        pendingCount: pendingContracts.length,
        pendingAmount,
        paidCount: paidContracts.length,
        paidAmount,
        overdueCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadContractPdf = async (req, res) => {
  try {
    const contract = await ResellerContract.findById(req.params.id).populate('reseller');
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrat introuvable' });
    }

    const role = req.user?.role;
    const isAdminLike = ['admin', 'super_admin', 'commercial_manager'].includes(role);
    const isResellerOwner = role === 'reseller' && String(contract.reseller?._id || contract.reseller) === String(req.user?.id);

    if (!isAdminLike && !isResellerOwner) {
      return res.status(403).json({ success: false, message: 'Accès refusé à ce contrat' });
    }

    let pdfUrl = contract.contractPdfUrl;
    let filePath = pdfUrl
      ? path.join(__dirname, '..', pdfUrl.replace(/^\/+/, '').replace(/\//g, path.sep))
      : '';

    if (!pdfUrl || !fs.existsSync(filePath)) {
      const generated = await createContractPdf(contract);
      pdfUrl = generated.pdfUrl;
      filePath = generated.filePath;
      contract.contractPdfUrl = pdfUrl;
      await contract.save();
    }

    return res.download(filePath, `contrat_revendeur_${contract.number}.pdf`);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.collectSoldContractPayment = async (req, res) => {
  try {
    const contract = await ResellerContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    if (contract.status !== 'sold' || contract.payment?.status !== 'pending_cashier') {
      return res.status(400).json({ success: false, message: 'This contract is not pending cashier collection' });
    }

    const now = new Date();
    const dueAt = contract.payment?.collectionDueAt ? new Date(contract.payment.collectionDueAt) : null;
    const isOverdue = Boolean(dueAt && dueAt < now);
    const role = String(req.user?.role || '').toLowerCase();
    const managerRoles = ['admin', 'super_admin', 'commercial_manager'];
    const canOverrideOverdue = managerRoles.includes(role);
    const overrideReason = String(req.body?.overrideReason || '').trim();

    if (dueAt && dueAt < now) {
      if (!canOverrideOverdue) {
        return res.status(403).json({ success: false, message: 'Le délai de 5h est dépassé. Seul un manager peut autoriser cet encaissement.' });
      }
      if (!overrideReason) {
        return res.status(400).json({ success: false, message: 'Motif d\'override obligatoire pour encaisser après 5h.' });
      }
    }

    const amount = Number(req.body?.amount || contract.payment?.amountExpected || contract.saleInfo?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required for collection' });
    }

    const paymentMethod = req.body?.paymentMethod || 'cash';
    const note = req.body?.note || '';
    contract.payment.required = true;
    contract.payment.status = 'paid';
    contract.payment.amountExpected = Number(contract.payment?.amountExpected || amount);
    contract.payment.amountPaid = amount;
    contract.payment.collectionDueAt = null;
    contract.payment.paidAt = now;
    contract.payment.paidById = req.user?.id || null;
    contract.payment.paidByRole = req.user?.role || 'cashier';
    contract.payment.paymentMethod = paymentMethod;
    contract.payment.note = note;

    contract.saleInfo = {
      ...(contract.saleInfo || {}),
      amount,
      paymentMethod,
      collectedAt: now,
      collectedBy: req.user?.name || req.user?.email || 'cashier',
      override: isOverdue
        ? {
            applied: true,
            reason: overrideReason,
            byId: req.user?.id || null,
            byRole: req.user?.role || null,
            at: now
          }
        : undefined
    };

    contract.history.push({
      byRole: req.user?.role || 'cashier',
      byId: req.user?.id || null,
      action: isOverdue ? 'cash_collected_manager_override' : 'cash_collected',
      data: {
        amount,
        paymentMethod,
        note,
        isOverdue,
        overrideReason: isOverdue ? overrideReason : null,
        collectionDueAt: dueAt || null,
        collectedAt: now
      },
      createdAt: now
    });

    await contract.save();

    await Reseller.findByIdAndUpdate(contract.reseller, {
      $inc: {
        'stats.totalGenerated': amount,
        'stats.totalToReturn': amount
      }
    });

    await notificationService.createNotification({
      recipientId: contract.reseller,
      recipientRole: 'reseller',
      type: 'contract_cash_collected',
      title: 'Encaissement confirmé',
      message: `Contrat ${contract.number}: encaissement confirmé (${amount.toLocaleString('fr-FR')} FCFA).`,
      requestId: contract._id,
      reference: contract.number
    });

    await notificationService.notifyAdmins({
      type: isOverdue ? 'contract_cash_collected_override' : 'contract_cash_collected',
      title: isOverdue ? 'Encaissement contrat revendeur (override manager)' : 'Encaissement contrat revendeur',
      message: isOverdue
        ? `Contrat ${contract.number}: encaissement hors délai autorisé par ${req.user?.name || req.user?.email || req.user?.role} (${amount.toLocaleString('fr-FR')} FCFA). Motif: ${overrideReason}`
        : `Contrat ${contract.number}: encaissement effectué (${amount.toLocaleString('fr-FR')} FCFA).`,
      requestId: contract._id,
      reference: contract.number
    });

    res.json({
      success: true,
      data: contract,
      message: isOverdue ? 'Encaissement hors délai autorisé et enregistré' : 'Cash collection recorded',
      meta: {
        overrideApplied: isOverdue,
        overrideReason: isOverdue ? overrideReason : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ⭐ NOUVELLE MÉTHODE : Relancer le délai d'encaissement
 * Seul un manager (admin/super_admin/commercial_manager) peut effectuer cette action
 */
exports.renewDelay = async (req, res) => {
  try {
    const contract = await ResellerContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    }

    // Vérifier que le contrat est en attente d'encaissement (sold + pending_cashier)
    if (contract.status !== 'sold' || contract.payment?.status !== 'pending_cashier') {
      return res.status(400).json({ success: false, message: 'Ce contrat n\'est pas en attente d\'encaissement.' });
    }

    const { delayHours } = req.body;
    if (!delayHours || delayHours < 1) {
      return res.status(400).json({ success: false, message: 'Le délai doit être d\'au moins 1 heure.' });
    }

    // Calcul de la nouvelle date d'échéance
    const now = new Date();
    const newDueAt = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

    // Mise à jour du contrat
    contract.payment.collectionDueAt = newDueAt;

    // Ajout dans l'historique
    contract.history.push({
      byRole: req.user?.role || 'admin',
      byId: req.user?.id || null,
      action: 'renewed_delay',
      data: {
        delayHours,
        newDueAt,
        reason: 'Override manager'
      },
      createdAt: now
    });

    await contract.save();

    // Notification au revendeur
    await notificationService.createNotification({
      recipientId: contract.reseller,
      recipientRole: 'reseller',
      type: 'contract_renewed_delay',
      title: 'Délai d\'encaissement relancé',
      message: `Le délai d'encaissement pour le contrat ${contract.number} a été relancé de ${delayHours}h.`,
      requestId: contract._id,
      reference: contract.number
    });

    // Notification aux admins
    await notificationService.notifyAdmins({
      type: 'contract_renewed_delay',
      title: 'Délai d\'encaissement relancé',
      message: `Le délai d'encaissement du contrat ${contract.number} a été relancé de ${delayHours}h par ${req.user?.name || req.user?.email || req.user?.role}.`,
      requestId: contract._id,
      reference: contract.number
    });

    res.json({
      success: true,
      data: contract,
      message: `Délai d'encaissement relancé avec succès (${delayHours}h).`
    });
  } catch (error) {
    console.error('Erreur renewDelay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestPhone = async (req, res) => {
  try {
    const authResellerId = req.user?.role === 'reseller' ? req.user.id : null;
    const { resellerId, productId, proposedPrice, expectedSalePrice, comment } = req.body;
    const effectiveResellerId = authResellerId || resellerId;

    if (!effectiveResellerId || !productId) return res.status(400).json({ success: false, message: 'resellerId and productId required' });

    const resolvedProduct = await findPhoneByAnySource(productId);
    if (!resolvedProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    const product = resolvedProduct.doc;
    const isActive = resolvedProduct.sourceModel === 'Product' ? product.active !== false : product.isActive !== false;
    const stock = getStockValue(product);
    if (!isActive || stock <= 0) return res.status(400).json({ success: false, message: 'Product not available' });

    const seller = await Reseller.findById(effectiveResellerId);
    if (!seller || !seller.isActive) return res.status(404).json({ success: false, message: 'Reseller not found or inactive' });

    const number = generateContractNumber();
    const contract = await ResellerContract.create({
      number,
      reseller: effectiveResellerId,
      product: productId,
      catalogPrice: getUnitPriceValue(product),
      negotiatedPrice: proposedPrice || 0,
      expectedSalePrice: expectedSalePrice || proposedPrice || 0,
      status: 'pending',
      history: [{
        byRole: req.user?.role || 'reseller',
        byId: req.user?.id || effectiveResellerId,
        action: 'requested',
        data: {
          comment: comment || '',
          proposedPrice: proposedPrice || 0,
          expectedSalePrice: expectedSalePrice || proposedPrice || 0
        },
        createdAt: new Date()
      }]
    });

    await notificationService.notifyAdmins({
      type: 'reseller_request',
      title: 'Demande revendeur',
      message: `Demande ${number} par revendeur`,
      requestId: contract._id,
      reference: number
    });

    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ success: false, message: 'phone and password required' });

    const rawPhone = String(phone || '').trim();
    if (!rawPhone) return res.status(400).json({ success: false, message: 'phone and password required' });

    const normalizedPhone = normalizePhone(phone);
    let reseller = null;

    if (normalizedPhone) {
      reseller = await findResellerByPhoneComparable(normalizedPhone, { isActive: true });
    }
    if (!reseller) {
      reseller = await Reseller.findOne({ phone: rawPhone, isActive: true });
    }

    if (!reseller) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!reseller.password) return res.status(401).json({ success: false, message: 'No password set for this reseller' });

    const valid = await bcrypt.compare(password, reseller.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken({ id: reseller._id, role: 'reseller', name: reseller.name, phone: reseller.phone });
    const { password: _p, ...user } = reseller.toObject();
    res.json({ success: true, data: { user, token }, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ success: false, message: 'phone or email required' });

    let reseller = null;
    if (phone) {
      const normalizedPhone = normalizePhone(phone);
      reseller = await findResellerByPhoneComparable(normalizedPhone);
    } else {
      reseller = await Reseller.findOne({ email });
    }

    if (!reseller) return res.status(404).json({ success: false, message: 'Reseller not found' });

    const token = crypto.randomBytes(20).toString('hex');
    reseller.resetPasswordToken = token;
    reseller.resetPasswordExpires = new Date(Date.now() + 3600 * 1000);
    await reseller.save();

    await notificationService.createNotification({
      recipientId: reseller._id,
      recipientRole: 'reseller',
      type: 'password_reset',
      title: 'Reinitialisation mot de passe',
      message: `Utilisez ce code pour reinitialiser votre mot de passe: ${token}`,
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

    const reseller = await Reseller.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!reseller) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    reseller.password = await bcrypt.hash(newPassword, 12);
    reseller.resetPasswordToken = undefined;
    reseller.resetPasswordExpires = undefined;
    reseller.forcePasswordChange = false;
    await reseller.save();

    await notificationService.createNotification({
      recipientId: reseller._id,
      recipientRole: 'reseller',
      type: 'password_changed',
      title: 'Mot de passe modifie',
      message: 'Votre mot de passe a bien ete reinitialise.'
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
    if (!user || user.role !== 'reseller') return res.status(401).json({ success: false, message: 'Not authorized' });

    const reseller = await Reseller.findById(user.id);
    if (!reseller) return res.status(404).json({ success: false, message: 'Reseller not found' });

    if (!reseller.forcePasswordChange) {
      if (!oldPassword) return res.status(400).json({ success: false, message: 'oldPassword required' });
      const valid = await bcrypt.compare(oldPassword, reseller.password);
      if (!valid) return res.status(401).json({ success: false, message: 'Old password incorrect' });
    }

    reseller.password = await bcrypt.hash(newPassword, 12);
    reseller.forcePasswordChange = false;
    await reseller.save();

    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAvailableCatalog = async (req, res) => {
  try {
    const [productsPhones, inventoryPhones] = await Promise.all([
      Product.find({ active: true, stock: { $gt: 0 } })
        .select('name brand stock price photos')
        .sort({ createdAt: -1 }),
      InventoryItem.find({ isActive: true, quantity: { $gt: 0 } })
        .select('name sku category quantity unitPrice photos')
        .sort({ updatedAt: -1 })
    ]);

    const normalizedProducts = productsPhones.map((item) => normalizeCatalogPhone(item.toObject(), 'Product'));
    const normalizedInventory = inventoryPhones.map((item) => normalizeCatalogPhone(item.toObject(), 'InventoryItem'));

    const data = [...normalizedProducts, ...normalizedInventory];
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewRequest = async (req, res) => {
  try {
    const { decision, negotiatedPrice, expectedSalePrice, comment } = req.body;
    if (!['accept', 'reject', 'counter'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be accept, reject or counter' });
    }

    const contract = await ResellerContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Request/contract not found' });
    if (contract.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be reviewed' });
    }

    if (decision === 'counter') {
      if (Number.isFinite(Number(negotiatedPrice))) {
        contract.negotiatedPrice = Number(negotiatedPrice);
      }
      if (Number.isFinite(Number(expectedSalePrice))) {
        contract.expectedSalePrice = Number(expectedSalePrice);
      }
      contract.history.push({
        byRole: req.user?.role || 'admin',
        byId: req.user?.id || null,
        action: 'counter_offer',
        data: { comment: comment || '', negotiatedPrice, expectedSalePrice },
        createdAt: new Date()
      });
      await contract.save();

      await notificationService.createNotification({
        recipientId: contract.reseller,
        recipientRole: 'reseller',
        type: 'request_counter_offer',
        title: 'Contre-proposition',
        message: `Demande ${contract.number}: une contre-proposition a ete faite.`,
        requestId: contract._id,
        reference: contract.number
      });

      return res.json({ success: true, data: contract, message: 'Counter-offer sent' });
    }

    if (decision === 'reject') {
      contract.status = 'closed';
      contract.history.push({
        byRole: req.user?.role || 'admin',
        byId: req.user?.id || null,
        action: 'rejected',
        data: { comment: comment || '' },
        createdAt: new Date()
      });
      await contract.save();

      await notificationService.createNotification({
        recipientId: contract.reseller,
        recipientRole: 'reseller',
        type: 'request_rejected',
        title: 'Demande refusée',
        message: `Demande ${contract.number} refusée.`,
        requestId: contract._id,
        reference: contract.number
      });

      return res.json({ success: true, data: contract, message: 'Request rejected' });
    }

    // accept
    const resolvedProduct = await findPhoneByAnySource(contract.product?._id || contract.product);
    const product = resolvedProduct?.doc;
    const isActive = resolvedProduct?.sourceModel === 'Product' ? product?.active !== false : product?.isActive !== false;
    const stock = getStockValue(product);

    if (!product || !isActive || stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product unavailable for assignment' });
    }

    const now = new Date();
    contract.handedAt = null;
    contract.dueAt = null;
    if (Number.isFinite(Number(negotiatedPrice))) contract.negotiatedPrice = Number(negotiatedPrice);
    if (Number.isFinite(Number(expectedSalePrice))) contract.expectedSalePrice = Number(expectedSalePrice);
    contract.status = 'approved';
    contract.history.push({
      byRole: req.user?.role || 'admin',
      byId: req.user?.id || null,
      action: 'accepted',
      data: { comment: comment || '', pickupRequired: true },
      createdAt: now
    });
    await contract.save();

    await notificationService.createNotification({
      recipientId: contract.reseller,
      recipientRole: 'reseller',
      type: 'request_accepted',
      title: 'Demande validée',
      message: `Demande ${contract.number} validée. Merci de récupérer le téléphone pour démarrer les 48h.`,
      requestId: contract._id,
      reference: contract.number
    });

    return res.json({ success: true, data: contract, message: 'Request accepted, waiting pickup confirmation' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const reseller = await Reseller.findById(req.user.id);
    if (!reseller) return res.status(404).json({ success: false, message: 'Reseller not found' });

    const [activeContracts, pendingContracts, approvedContracts, completedContracts] = await Promise.all([
      ResellerContract.countDocuments({ reseller: reseller._id, status: 'active' }),
      ResellerContract.countDocuments({ reseller: reseller._id, status: 'pending' }),
      ResellerContract.countDocuments({ reseller: reseller._id, status: 'approved' }),
      ResellerContract.countDocuments({ reseller: reseller._id, status: { $in: ['sold', 'returned', 'expired', 'closed'] } })
    ]);

    const sold = reseller.stats?.soldCount || 0;
    const withdrawn = reseller.stats?.withdrawnCount || 0;
    const successRate = withdrawn > 0 ? (sold / withdrawn) * 100 : 0;

    res.json({
      success: true,
      data: {
        ...reseller.stats,
        activeContracts,
        pendingContracts,
        approvedContracts,
        completedContracts,
        successRate: Number(successRate.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};