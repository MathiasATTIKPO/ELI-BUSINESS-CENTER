const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const SaleRequest = require('../models/Sale');
const Employee = require('../models/Employee');
const InventoryItem = require('../models/InventoryItem');
const invoiceController = require('./invoiceController');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

const signToken = (payload) => {
  const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
  return jwt.sign(payload, jwtSecret, { expiresIn: '8h' });
};

// ==================== NOTIFICATIONS ====================

// Créer une notification pour un utilisateur spécifique
const createNotification = async (recipientId, recipientRole, type, title, message, requestId, clientName, reference) => {
  try {
    await Notification.create({ 
      recipientId, 
      recipientRole, 
      type, 
      title, 
      message, 
      requestId, 
      clientName, 
      reference 
    });
  } catch (error) {
    console.error('Erreur création notification:', error.message);
  }
};

// Notifier tous les utilisateurs d'un rôle spécifique
const notifyRole = async (role, type, title, message, requestId, clientName, reference) => {
  try {
    const users = await Employee.find({ role, isActive: true });
    if (users.length === 0) {
      console.log(`Aucun utilisateur trouvé pour le rôle ${role}`);
      return;
    }
    for (const user of users) {
      await createNotification(user._id, role, type, title, message, requestId, clientName, reference);
    }
    console.log(`✅ Notification envoyée à ${users.length} ${role}(s)`);
  } catch (error) {
    console.error(`Erreur notification ${role}:`, error.message);
  }
};

// Notifier un technicien spécifique (celui assigné)
const notifyTechnician = async (repairOrTradein, type, title, message) => {
  const assignedToId = repairOrTradein.assignedTo?._id || repairOrTradein.assignedTo;
  if (assignedToId) {
    await createNotification(
      assignedToId, 
      'technician', 
      type, 
      title, 
      message,
      repairOrTradein._id, 
      repairOrTradein.clientName, 
      repairOrTradein._id.toString().slice(-6)
    );
    console.log(`✅ Notification envoyée au technicien ${assignedToId}`);
  } else {
    console.log(`⚠️ Aucun technicien assigné pour ${repairOrTradein._id}`);
  }
};

// Notifier tous les admins
const notifyAdmins = async (type, title, message, requestId, clientName, reference) => {
  try {
    const admins = await Employee.find({ role: 'admin', isActive: true });
    if (admins.length === 0) {
      console.log('Aucun admin trouvé');
      // Si aucun admin n'est trouvé dans la DB, notifier l'admin système via son ID générique
      await createNotification('admin_id', 'admin', type, title, message, requestId, clientName, reference);
      return; 
    }
    for (const admin of admins) {
      await createNotification(admin._id, 'admin', type, title, message, requestId, clientName, reference);
    }
    console.log(`✅ Notification envoyée à ${admins.length} admin(s)`);
  } catch (error) {
    console.error('Erreur notification admins:', error.message);
  }
};

// Notifier tous les cashiers
const notifyCashiers = async (type, title, message, requestId, clientName, reference) => {
  try {
    const cashiers = await Employee.find({ role: 'cashier', isActive: true });
    if (cashiers.length === 0) {
      console.log('Aucun caissier trouvé');
      return;
    }
    for (const cashier of cashiers) {
      await createNotification(cashier._id, 'cashier', type, title, message, requestId, clientName, reference);
    }
    console.log(`✅ Notification envoyée à ${cashiers.length} caissier(s)`);
  } catch (error) {
    console.error('Erreur notification cashiers:', error.message);
  }
};

// ==================== NOTIFICATIONS EXPORTS ====================

exports.getNotifications = async (req, res) => {
  try {
    if (!req.user?.id || !req.user?.role) {
      return res.status(401).json({ success: false, message: 'Authentification requise.' });
    }
    const notifications = await Notification.find({ 
      recipientId: req.user.id, 
      recipientRole: req.user.role 
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications, message: 'Notifications récupérées.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification introuvable.' });
    }
    res.json({ success: true, data: notification, message: 'Notification marquée comme lue.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentification requise.' });
    }
    const result = await Notification.updateMany(
      { recipientId: req.user.id, read: false }, 
      { read: true }
    );
    res.json({ success: true, data: result, message: 'Toutes les notifications marquées comme lues.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== AUTHENTIFICATION ====================
const loginEmployee = async (req, res, allowedRoles) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Identifiants requis.' });

    const employee = await Employee.findOne({ email, isActive: true });
    if (!employee || !allowedRoles.includes(employee.role)) {
      return res.status(401).json({ success: false, message: 'Authentification échouée.' });
    }

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid) return res.status(401).json({ success: false, message: 'Authentification échouée.' });

    const token = signToken({ id: employee._id, email: employee.email, role: employee.role, name: employee.name });
    const { password: _, ...user } = employee.toObject();
    res.json({ success: true, data: { user, token }, message: 'Connexion réussie.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Identifiants requis.' });
  
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';
  
  if (email !== ADMIN_USER || password !== ADMIN_PASS) {
    return res.status(401).json({ success: false, message: 'Authentification échouée.' });
  }

  // Fix: Ajout du rôle admin dans le token pour la gestion des permissions backend/frontend
  const token = signToken({ id: 'admin_id', email, role: 'admin', name: 'Administrateur' });
  res.json({ success: true, data: { user: { id: 'admin_id', email, role: 'admin', name: 'Administrateur' }, token }, message: 'Connexion réussie.' });
};

exports.technicianLogin = (req, res) => loginEmployee(req, res, ['technician']);
exports.cashierLogin = (req, res) => loginEmployee(req, res, ['cashier', 'admin']);

// ==================== PRODUITS ====================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, brand, price, stock, active } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const product = await Product.create({ name, brand, price: +price, stock: +stock, active: active === 'true', photos: photo ? [photo] : [] });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    const { name, brand, price, stock, active } = req.body;
    if (name !== undefined) product.name = name;
    if (brand !== undefined) product.brand = brand;
    if (price !== undefined) product.price = +price;
    if (stock !== undefined) product.stock = +stock;
    if (active !== undefined) product.active = (active === 'true' || active === true);
    if (req.file) product.photos = [...(product.photos || []), `/uploads/${req.file.filename}`];
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Produit supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sellProduct = async (req, res) => {
  try {
    const { quantity = 1, clientName, clientWhatsapp, amount, paymentMethod } = req.body;
    const qty = +quantity;
    if (!clientWhatsapp || !amount || qty <= 0) return res.status(400).json({ success: false, message: 'Champs requis manquants.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable.' });
    if (product.stock < qty) return res.status(400).json({ success: false, message: `Stock insuffisant (${product.stock}).` });

    product.stock -= qty;
    await product.save();

    let invoice = null;
    try { invoice = await invoiceController.createInvoicePdf({ requestType: 'inventory', requestId: product._id, clientName, clientWhatsapp, amount: +amount }); } catch(e) {}

    try {
      await SaleRequest.create({ type: 'product', productId: product._id, productName: product.name, quantity: qty, unitPrice: product.price, totalAmount: +amount, clientName, clientWhatsapp, paymentMethod, seller: req.user?.name || 'Caissier' });
    } catch(e) {}

    res.status(201).json({ success: true, data: { product, invoice } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPhoneSales = async (req, res) => {
  try {
    const sales = await SaleRequest.find({ type: 'product' }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: sales });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

// ==================== INVENTAIRE ====================
exports.getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const data = { ...req.body, quantity: +req.body.quantity, minQuantity: +req.body.minQuantity, unitPrice: +req.body.unitPrice };
    if (req.file) data.photos = [`/uploads/${req.file.filename}`];
    const item = await InventoryItem.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Article introuvable.' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    await InventoryItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Article supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sellInventoryItem = async (req, res) => {
  try {
    const { quantity = 1, clientName, clientWhatsapp, amount } = req.body;
    const qty = +quantity;
    if (!clientWhatsapp || !amount || qty <= 0) return res.status(400).json({ success: false, message: 'Champs requis manquants.' });

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Pièce introuvable.' });
    if (item.quantity < qty) return res.status(400).json({ success: false, message: `Stock insuffisant (${item.quantity}).` });

    item.quantity -= qty;
    await item.save();

    const invoice = await invoiceController.createInvoicePdf({ requestType: 'inventory', requestId: item._id, clientName, clientWhatsapp, amount: +amount });
    res.status(201).json({ success: true, data: { inventory: item, invoice } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== RÉPARATIONS ====================
exports.getRepairs = async (req, res) => {
  try {
    const repairs = await RepairRequest.find().populate('assignedTo', 'name email');
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const repair = await RepairRequest.findById(req.params.id).populate('assignedTo', 'name email')
    if (!repair) return res.status(404).json({ success: false, message: 'Réparation introuvable.' });
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRepairPrice = async (req, res) => {
  try {
    const { price } = req.body;
    const repair = await RepairRequest.findByIdAndUpdate(req.params.id, { price: +price }, { new: true });
    if (!repair) return res.status(404).json({ success: false, message: 'Réparation introuvable.' });
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRepairStatus = async (req, res) => {
  console.log('🚀 [updateRepairStatus] Début de la fonction');
  console.log('   - req.params.id:', req.params.id);
  console.log('   - req.body:', JSON.stringify(req.body, null, 2));
  console.log('   - req.user:', req.user ? `${req.user.role} - ${req.user.id}` : 'Aucun utilisateur');

  try {
    const { status, saleInfo, technicianReport } = req.body;
    console.log(`📌 [updateRepairStatus] Statut demandé: ${status}`);

    console.log('🔍 [updateRepairStatus] Recherche de la réparation...');
    const repair = await RepairRequest.findById(req.params.id);
    if (!repair) {
      console.log('❌ [updateRepairStatus] Réparation introuvable');
      return res.status(404).json({ success: false, message: 'Réparation introuvable.' });
    }
    console.log(`✅ [updateRepairStatus] Réparation trouvée : ${repair._id}, statut actuel: ${repair.status}, clientWhatsapp: ${repair.clientWhatsapp}`);

    repair.status = status;
    if (technicianReport) {
      repair.technicianReport = technicianReport;
      console.log('   - Rapport technique ajouté');
    }
    if (saleInfo) {
      repair.saleInfo = { ...saleInfo, validatedBy: req.user?.name || 'Caissier' };
      console.log('   - saleInfo mis à jour:', JSON.stringify(repair.saleInfo));
    }
    if (['completed', 'paid'].includes(status)) {
      repair.completedAt = new Date();
      console.log(`   - completedAt défini à ${repair.completedAt}`);
    }

    console.log('💾 [updateRepairStatus] Sauvegarde de la réparation...');
    await repair.save();
    console.log('✅ [updateRepairStatus] Réparation sauvegardée avec succès');

    if (['ready', 'completed'].includes(status)) {
      console.log('📢 [updateRepairStatus] Envoi notification aux cashiers');
      await notifyCashiers(
        'repair_completed', 
        'Réparation terminée', 
        `Réparation #${repair._id.toString().slice(-6)} prête pour ${repair.clientName}`,
        repair._id, 
        repair.clientName, 
        repair._id.toString().slice(-6)
      );
    }

    if (status === 'paid' && saleInfo && repair.clientWhatsapp) {
      console.log('💰 [updateRepairStatus] Génération facture...');
      try {
        const amountToBill = saleInfo.amountPaid || saleInfo.amount || repair.price;
        const invoice = await invoiceController.createInvoicePdf({
          requestType: 'repair',
          requestId: repair._id,
          clientName: repair.clientName || 'Client',
          clientWhatsapp: repair.clientWhatsapp,
          amount: amountToBill
        });
        console.log('✅ Facture générée');

        const reference = repair._id.toString().slice(-6).toUpperCase();
        await notifyAdmins(
          'payment_approved', 
          'Paiement réparation validé', 
          `Réparation ${reference} - ${amountToBill.toLocaleString()} FCFA - Client: ${repair.clientName}`,
          repair._id, 
          repair.clientName, 
          reference
        );
        
        if (repair.assignedTo) {
          await createNotification(
            repair.assignedTo, 
            'technician', 
            'payment_approved', 
            'Paiement réparation validé', 
            `La réparation de ${repair.clientName} a été payée (${amountToBill.toLocaleString()} FCFA)`,
            repair._id, 
            repair.clientName, 
            reference
          );
        }
      } catch (invoiceError) {
        console.error('❌ Erreur génération facture:', invoiceError.message);
      }
    }

    console.log('📤 [updateRepairStatus] Envoi de la réponse');
    res.json({ success: true, data: repair });
  } catch (error) {
    console.error('💥 [updateRepairStatus] ERREUR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignRepair = async (req, res) => {
  try {
    const repair = await RepairRequest.findByIdAndUpdate(
      req.params.id, 
      { assignedTo: req.body.employeeId, status: 'assigned' }, 
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!repair) return res.status(404).json({ success: false, message: 'Réparation introuvable.' });
    
    await notifyTechnician(
      repair, 
      'repair_assigned', 
      'Nouvelle réparation assignée', 
      `Réparation pour ${repair.deviceModel || 'appareil'} (${repair.clientName}) vous a été assignée`
    );
    
    await notifyAdmins(
      'repair_assigned',
      'Réparation assignée',
      `La réparation ${repair._id.toString().slice(-6)} a été assignée à ${repair.assignedTo?.name || 'un technicien'}`,
      repair._id,
      repair.clientName,
      repair._id.toString().slice(-6)
    );
    
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payRepair = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    
    // Validation des paramètres
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le montant est requis et doit être supérieur à 0' 
      });
    }

    const repair = await RepairRequest.findById(id);
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Réparation introuvable.' });
    }
    
    // Vérifier que la réparation n'est pas déjà payée
    if (repair.status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cette réparation a déjà été payée.' 
      });
    }
    
    // Vérifier que la réparation est prête
    const payableStatuses = ['ready', 'completed'];
    if (!payableStatuses.includes(repair.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `La réparation ne peut pas être payée. Statut actuel: ${repair.status}. Statuts acceptés: ${payableStatuses.join(', ')}` 
      });
    }

    const price = repair.price || repair.estimatedPrice || 0;
    const paymentAmount = parseFloat(amount);
    
    // Vérifier que le montant payé est suffisant
    if (paymentAmount < price) {
      return res.status(400).json({ 
        success: false, 
        message: `Le montant payé (${paymentAmount.toLocaleString()} FCFA) est inférieur au montant dû (${price.toLocaleString()} FCFA)` 
      });
    }

    // Mise à jour de la réparation
    repair.status = 'paid';
    repair.saleInfo = { 
      amount: price,
      amountPaid: paymentAmount,
      paymentMethod: paymentMethod || 'cash', 
      paymentDate: new Date(), 
      validatedBy: req.user?.name || req.user?.email || 'Caissier',
      notes: notes || ''
    };
    
    // Si trop-perçu, ajouter une note
    if (paymentAmount > price) {
      repair.saleInfo.notes = `${notes ? notes + ' - ' : ''}Trop-perçu: ${(paymentAmount - price).toLocaleString()} FCFA`;
    }
    
    await repair.save();

    // Génération de la facture
    try {
      await invoiceController.createInvoicePdf({
        requestType: 'repair',
        requestId: repair._id,
        clientName: repair.clientName || 'Client',
        clientWhatsapp: repair.clientWhatsapp,
        amount: paymentAmount,
        paymentMethod: paymentMethod || 'cash',
        paymentDate: new Date()
      });
    } catch (invoiceError) {
      console.error('Erreur génération facture réparation:', invoiceError.message);
      // Ne pas bloquer le paiement si la facture échoue
    }

    const reference = repair._id.toString().slice(-6).toUpperCase();
    
    // Notifications
    await notifyCashiers(
      'repair_paid', 
      'Réparation payée', 
      `Réparation #${reference} payée ${paymentAmount.toLocaleString()} FCFA pour ${repair.clientName}`,
      repair._id, 
      repair.clientName, 
      reference
    );
    
    await notifyAdmins(
      'payment_approved', 
      'Paiement réparation validé', 
      `Réparation ${reference} - ${paymentAmount.toLocaleString()} FCFA - Client: ${repair.clientName}`,
      repair._id, 
      repair.clientName, 
      reference
    );
    
    if (repair.assignedTo) {
      await createNotification(
        repair.assignedTo, 
        'technician', 
        'payment_approved', 
        'Réparation payée', 
        `La réparation de ${repair.clientName} a été payée (${paymentAmount.toLocaleString()} FCFA)`,
        repair._id, 
        repair.clientName, 
        reference
      );
    }

    res.json({ 
      success: true, 
      data: repair,
      message: 'Paiement effectué avec succès'
    });
    
  } catch (error) {
    console.error('Erreur payRepair:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erreur lors du traitement du paiement' 
    });
  }
};

// ==================== ÉCHANGES ====================
exports.getTradeins = async (req, res) => {
  try {
    const tradeins = await TradeinRequest.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: tradeins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTradeinById = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findById(req.params.id).populate('assignedTo', 'name email');
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTradeinValue = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, { proposedValue: +req.body.proposedValue }, { new: true });
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTradeinTarget = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, { targetProduct: req.body.targetProduct || '' }, { new: true });
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTradeinStatus = async (req, res) => {
  try {
    const { status, technicianReport } = req.body;
    const update = { status };
    if (technicianReport) update.technicianReport = technicianReport;
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptTradein = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, { status: 'accepted', exchangeProduct: req.body.exchangeProduct }, { new: true });
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    
    await notifyCashiers(
      'tradein_ready_for_payment', // Changé le type de notification pour plus de précision
      'Échange accepté', 
      `Échange #${tradein._id.toString().slice(-6)} prêt pour paiement - ${tradein.clientName}`,
      tradein._id, 
      tradein.clientName, 
      tradein._id.toString().slice(-6)
    );
    
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payTradein = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findById(req.params.id);
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    if (tradein.status !== 'accepted') return res.status(400).json({ success: false, message: 'Échange non accepté.' });

    tradein.status = 'paid';
    tradein.saleInfo = { 
      amount: +req.body.amount || tradein.proposedValue, 
      paymentMethod: req.body.paymentMethod || 'cash', 
      paymentDate: new Date(), 
      validatedBy: req.user?.name || 'Caissier',
      notes: req.body.notes || ''
    };
    await tradein.save();

    try {
      const paymentAmount = +req.body.amount || tradein.proposedValue;
      await invoiceController.createInvoicePdf({
        requestType: 'tradein',
        requestId: tradein._id,
        clientName: tradein.clientName || 'Client',
        clientWhatsapp: tradein.clientWhatsapp,
        amount: paymentAmount
      });
    } catch (invoiceError) {
      console.error('Erreur génération facture échange:', invoiceError.message);
    }

    await notifyCashiers(
      'tradein_completed', 
      'Échange payé', 
      `Échange #${tradein._id.toString().slice(-6)} payé pour ${tradein.clientName}`,
      tradein._id, 
      tradein.clientName, 
      tradein._id.toString().slice(-6)
    );
    
    const reference = tradein._id.toString().slice(-6).toUpperCase();
    const paymentAmount = +req.body.amount || tradein.proposedValue;
    
    await notifyAdmins(
      'payment_approved', 
      'Paiement échange validé', 
      `Échange ${reference} - ${paymentAmount?.toLocaleString()} FCFA - Client: ${tradein.clientName}`,
      tradein._id, 
      tradein.clientName, 
      reference
    );
    
    if (tradein.assignedTo) {
      await createNotification(
        tradein.assignedTo, 
        'technician', 
        'payment_approved', 
        'Paiement échange validé', 
        `L'échange de ${tradein.clientName} a été payé (${paymentAmount.toLocaleString()} FCFA)`,
        tradein._id, 
        tradein.clientName, 
        reference
      );
    }

    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignTradein = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findByIdAndUpdate(
      req.params.id, 
      { assignedTo: req.body.employeeId, status: 'assigned' }, 
      { new: true }
    ).populate('assignedTo', 'name email');
    
    if (!tradein) return res.status(404).json({ success: false, message: 'Échange introuvable.' });
    
    await notifyTechnician(
      tradein, 
      'tradein_assigned', 
      'Nouvel échange assigné', 
      `Échange pour ${tradein.deviceModel || 'appareil'} (${tradein.clientName}) vous a été assigné`
    );
    
    await notifyAdmins(
      'tradein_assigned',
      'Échange assigné',
      `L'échange ${tradein._id.toString().slice(-6)} a été assigné à ${tradein.assignedTo?.name || 'un technicien'}`,
      tradein._id,
      tradein.clientName,
      tradein._id.toString().slice(-6)
    );
    
    res.json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EMPLOYÉS ====================
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: employees.map(e => { const { password, ...rest } = e.toObject(); return rest; }) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, phone, email, password, role, skills } = req.body;
    if (await Employee.findOne({ email })) return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });
    if (!['admin', 'technician', 'cashier'].includes(role)) return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    const employee = await Employee.create({ name, phone, email, password: await bcrypt.hash(password, 12), role, skills: skills || [] });
    const { password: _, ...result } = employee.toObject();
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 12);
    const employee = await Employee.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!employee) return res.status(404).json({ success: false, message: 'Employé introuvable.' });
    const { password: _, ...result } = employee.toObject();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Employé supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CLIENTS (SITE WEB) ====================
exports.createRepairFromClient = async (req, res) => {
  try {
    const repair = await RepairRequest.create({ ...req.body, status: 'pending' });
    await notifyAdmins(
      'repair_pending', 
      'Nouvelle réparation', 
      `Réparation pour ${repair.deviceModel || 'appareil'} par ${repair.clientName}`,
      repair._id, 
      repair.clientName, 
      repair._id.toString().slice(-6)
    );
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTradeinFromClient = async (req, res) => {
  try {
    const tradein = await TradeinRequest.create({ ...req.body, status: 'pending' });
    await notifyAdmins(
      'tradein_pending', 
      'Nouvel échange', 
      `Échange pour ${tradein.deviceModel || 'appareil'} par ${tradein.clientName}`,
      tradein._id, 
      tradein.clientName, 
      tradein._id.toString().slice(-6)
    );
    res.status(201).json({ success: true, data: tradein });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== POINTAGE ====================
exports.clockIn = async (req, res) => {
  try {
    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employé introuvable.' });
    employee.workingHours.push({ date: req.body.date, startTime: req.body.startTime, endTime: '', totalHours: 0 });
    await employee.save();
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employé introuvable.' });
    const record = employee.workingHours.find(item => item.date.toISOString().startsWith(new Date(req.body.date).toISOString().split('T')[0]));
    if (!record) return res.status(404).json({ success: false, message: 'Pointage introuvable.' });
    record.endTime = req.body.endTime;
    record.totalHours = +req.body.totalHours;
    await employee.save();
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== VENTES ====================

exports.getAllSales = async (req, res) => {
  try {
    const phoneSales = await SaleRequest.find({ type: 'product' })
      .sort({ createdAt: -1 })
      .lean()
    
    const paidRepairs = await RepairRequest.find({ status: 'paid' })
      .sort({ updatedAt: -1 })
      .lean()
    
    const completedTradeins = await TradeinRequest.find({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .lean()
    
    const formattedPhoneSales = phoneSales.map(sale => ({
      _id: sale._id,
      type: 'phone',
      productName: sale.productName,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      amount: sale.totalAmount,
      clientName: sale.clientName,
      clientWhatsapp: sale.clientWhatsapp,
      paymentMethod: sale.paymentMethod,
      seller: sale.seller,
      date: sale.createdAt || sale.updatedAt,
      originalData: sale
    }))
    
    const formattedRepairs = paidRepairs.map(repair => ({
      _id: repair._id,
      type: 'repair',
      deviceModel: repair.deviceModel,
      problem: repair.problem,
      amount: repair.price || repair.saleInfo?.amountPaid || 0,
      clientName: repair.clientName,
      clientWhatsapp: repair.clientWhatsapp,
      paymentMethod: repair.saleInfo?.paymentMethod || 'cash',
      status: repair.status,
      date: repair.saleInfo?.paymentDate || repair.completedAt || repair.updatedAt,
      originalData: repair
    }))
    
    const formattedTradeins = completedTradeins.map(tradein => ({
      _id: tradein._id,
      type: 'tradein',
      deviceModel: tradein.deviceModel,
      condition: tradein.condition,
      amount: tradein.saleInfo?.amount || tradein.proposedValue || 0,
      clientName: tradein.clientName,
      clientWhatsapp: tradein.clientWhatsapp,
      paymentMethod: tradein.saleInfo?.paymentMethod || 'cash',
      exchangeProduct: tradein.exchangeProduct,
      status: tradein.status,
      date: tradein.saleInfo?.paymentDate || tradein.completedAt || tradein.updatedAt,
      originalData: tradein
    }))
    
    const allSales = [...formattedPhoneSales, ...formattedRepairs, ...formattedTradeins]
    allSales.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    const summary = {
      totalSales: allSales.length,
      totalRevenue: allSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
      phoneSalesCount: formattedPhoneSales.length,
      phoneSalesRevenue: formattedPhoneSales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
      repairsCount: formattedRepairs.length,
      repairsRevenue: formattedRepairs.reduce((sum, sale) => sum + (sale.amount || 0), 0),
      tradeinsCount: formattedTradeins.length,
      tradeinsRevenue: formattedTradeins.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    }
    
    res.json({ success: true, data: allSales, summary: summary })
  } catch (error) {
    console.error('Erreur getAllSales:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getSales = async (req, res) => {
  try {
    const sales = await SaleRequest.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Dates requises' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const [phoneSales, repairs, tradeins] = await Promise.all([
      SaleRequest.find({ 
        createdAt: { $gte: start, $lte: end },
        type: 'product'
      }).lean(),
      RepairRequest.find({ 
        status: 'paid',
        'saleInfo.paymentDate': { $gte: start, $lte: end }
      }).lean(),
      TradeinRequest.find({ 
        status: 'completed',
        'saleInfo.paymentDate': { $gte: start, $lte: end }
      }).lean()
    ]);
    
    const total = {
      phoneSales: phoneSales.length,
      phoneRevenue: phoneSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
      repairs: repairs.length,
      repairRevenue: repairs.reduce((sum, r) => sum + (r.price || r.saleInfo?.amountPaid || 0), 0),
      tradeins: tradeins.length,
      tradeinRevenue: tradeins.reduce((sum, t) => sum + (t.saleInfo?.amount || 0), 0),
      totalRevenue: 0,
      totalSales: 0
    };
    
    total.totalRevenue = total.phoneRevenue + total.repairRevenue + total.tradeinRevenue;
    total.totalSales = total.phoneSales + total.repairs + total.tradeins;
    
    res.json({ success: true, data: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== STATISTIQUES TABLEAU DE BORD ====================
exports.getStats = async (req, res) => {
  try {
    const [
      repairs,
      tradeins,
      employees,
      products,
      inventory,
      phoneSales
    ] = await Promise.all([
      RepairRequest.find().lean(),
      TradeinRequest.find().lean(),
      Employee.find().lean(),
      Product.find().lean(),
      InventoryItem.find().lean(),
      SaleRequest.find({ type: 'product' }).lean()
    ])
    
    const totalRepairs = repairs.length
    const completedRepairsCount = repairs.filter(r => r.status === 'completed' || r.status === 'paid').length
    const inProgressRepairs = repairs.filter(r => ['repairing', 'assigned', 'diagnosing'].includes(r.status)).length
    const repairRevenue = repairs.reduce((sum, r) => sum + (r.saleInfo?.amountPaid || r.price || 0), 0)
    const tradeinRevenue = tradeins.reduce((sum, t) => sum + (t.saleInfo?.amount || 0), 0)
    const phoneSalesRevenue = phoneSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const totalRevenue = repairRevenue + tradeinRevenue + phoneSalesRevenue
    
    const statusCounts = {
      pending: repairs.filter(r => r.status === 'pending').length,
      assigned: repairs.filter(r => r.status === 'assigned').length,
      repairing: repairs.filter(r => r.status === 'repairing').length,
      completed: repairs.filter(r => r.status === 'completed' || r.status === 'paid').length,
    }
    
    const repairsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name: name === 'pending' ? 'En attente' : name === 'assigned' ? 'Assignée' : name === 'repairing' ? 'En réparation' : 'Terminée',
      value,
      color: name === 'pending' ? '#f59e0b' : name === 'assigned' ? '#3b82f6' : name === 'repairing' ? '#f97316' : '#22c55e'
    }))
    
    const monthlyData = {}
    
    repairs.forEach(r => {
      if (r.completedAt) {
        const month = new Date(r.completedAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        monthlyData[month] = (monthlyData[month] || 0) + (r.price || 0)
      }
    })
    
    tradeins.forEach(t => {
      if (t.saleInfo?.paymentDate) {
        const month = new Date(t.saleInfo.paymentDate).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        monthlyData[month] = (monthlyData[month] || 0) + (t.saleInfo?.amount || 0)
      }
    })
    
    phoneSales.forEach(s => {
      if (s.createdAt) {
        const month = new Date(s.createdAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
        monthlyData[month] = (monthlyData[month] || 0) + (s.totalAmount || 0)
      }
    })
    
    const monthlyRevenue = Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .slice(-6)
    
    res.json({
      success: true,
      data: {
        totalRepairs,
        completedRepairsCount,
        inProgressRepairs,
        repairRevenue,
        tradeinRevenue,
        phoneSalesRevenue,
        totalRevenue,
        technicians: employees.filter(e => e.role === 'technician').length,
        cashiers: employees.filter(e => e.role === 'cashier').length,
        employees: employees.length,
        totalTradeins: tradeins.length,
        pendingTradeins: tradeins.filter(t => t.status === 'pending').length,
        totalPhoneSales: phoneSales.length,
        repairsByStatus,
        monthlyRevenue,
        recentRepairs: repairs.slice(0, 5),
        recentTradeins: tradeins.slice(0, 5),
        recentPhoneSales: phoneSales.slice(0, 5)
      }
    })
  } catch (error) {
    console.error('Erreur getStats:', error)
    res.status(500).json({ success: false, message: error.message })
  }
};

// ==================== FACTURES ====================

// Facture pour une vente de téléphone
exports.downloadSaleInvoice = async (req, res) => {
  try {
    const sale = await SaleRequest.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Vente introuvable.' });
    }
    
    const invoice = await invoiceController.createInvoicePdf({
      requestType: 'product',
      requestId: sale._id,
      clientName: sale.clientName || 'Client',
      clientWhatsapp: sale.clientWhatsapp || '',
      amount: sale.totalAmount || sale.amount || 0
    });
    
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', path.basename(invoice.pdfUrl));
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, `facture_vente_${sale._id}.pdf`);
    } else {
      res.status(404).json({ success: false, message: 'Fichier facture introuvable.' });
    }
  } catch (error) {
    console.error('Erreur downloadSaleInvoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Facture pour une réparation
exports.downloadRepairInvoice = async (req, res) => {
  try {
    const repair = await RepairRequest.findById(req.params.id);
    
    if (!repair || repair.status !== 'paid') {
      return res.status(404).json({ success: false, message: 'Réparation payée introuvable.' });
    }
    
    const amount = repair.saleInfo?.amountPaid || repair.price || 0;
    const invoice = await invoiceController.createInvoicePdf({
      requestType: 'repair',
      requestId: repair._id,
      clientName: repair.clientName || 'Client',
      clientWhatsapp: repair.clientWhatsapp || '',
      amount: amount
    });
    
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', path.basename(invoice.pdfUrl));
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, `facture_reparation_${repair._id}.pdf`);
    } else {
      res.status(404).json({ success: false, message: 'Fichier facture introuvable.' });
    }
  } catch (error) {
    console.error('Erreur downloadRepairInvoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Facture pour un échange
exports.downloadTradeinInvoice = async (req, res) => {
  try {
    const tradein = await TradeinRequest.findById(req.params.id);
    
    if (!tradein || (tradein.status !== 'completed' && tradein.status !== 'paid')) {
      return res.status(404).json({ success: false, message: 'Échange complété introuvable.' });
    }
    
    const amount = tradein.saleInfo?.amount || tradein.proposedValue || 0;
    const invoice = await invoiceController.createInvoicePdf({
      requestType: 'tradein',
      requestId: tradein._id,
      clientName: tradein.clientName || 'Client',
      clientWhatsapp: tradein.clientWhatsapp || '',
      amount: amount
    });
    
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', path.basename(invoice.pdfUrl));
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, `facture_echange_${tradein._id}.pdf`);
    } else {
      res.status(404).json({ success: false, message: 'Fichier facture introuvable.' });
    }
  } catch (error) {
    console.error('Erreur downloadTradeinInvoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};