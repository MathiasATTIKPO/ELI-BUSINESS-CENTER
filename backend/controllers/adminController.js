const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const Employee = require('../models/Employee');

const signToken = (payload) => {
  const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
  return jwt.sign(payload, jwtSecret, { expiresIn: '8h' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'password123';
  if (!email || !password) {
    return res.status(400).json({ success: false, data: null, message: 'Identifiants requis.' });
  }

  if (email !== ADMIN_USER || password !== ADMIN_PASS) {
    console.warn(`[LOGIN] Tentative échouée pour : ${email}. Attendu: ${ADMIN_USER}`);
    return res.status(401).json({ success: false, data: null, message: 'Authentification échouée.' });
  }

  const token = signToken({ email });
  res.json({ success: true, data: { user: { email }, token }, message: 'Authentification réussie.' });
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, data: products, message: 'Liste des produits pour admin.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {

    console.log('📦 Body reçu:', req.body);
    console.log('📁 Fichier reçu:', req.file);
    
    const { name, brand, price, stock, active } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('Données traitées:', { name, brand, price, stock, active, photo });
    
    const product = await Product.create({
      name,
      brand,
      price: Number(price),
      stock: Number(stock),
      active: active === 'true',
      photos: photo ? [photo] : []
    });
    res.status(201).json({ success: true, data: product, message: 'Produit créé.' });
  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Produit introuvable.' });
    }
    res.json({ success: true, data: product, message: 'Produit mis à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: 'Produit introuvable.' });
    }
    res.json({ success: true, data: null, message: 'Produit supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getRepairs = async (req, res) => {
  try {
    const repairs = await RepairRequest.find().populate('assignedTo');
    res.json({ success: true, data: repairs, message: 'Liste des demandes de réparation.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getRepairById = async (req, res) => {
  try {
    const repair = await RepairRequest.findById(req.params.id).populate('assignedTo');
    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande de réparation introuvable.' });
    }
    res.json({ success: true, data: repair, message: 'Détail de la demande de réparation.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateRepairPrice = async (req, res) => {
  try {
    const { price, estimatedPrice, saleInfo } = req.body;
    const finalPrice = Number(price || estimatedPrice);
    const updateData = {
      estimatedPrice: finalPrice,
      price: finalPrice
    };

    if (saleInfo) {
      updateData.saleInfo = {
        ...saleInfo,
        amount: saleInfo.amount ?? saleInfo.amountPaid ?? finalPrice,
        amountPaid: saleInfo.amountPaid ?? saleInfo.amount ?? finalPrice
      };
    }

    const repair = await RepairRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }
    res.json({ success: true, data: repair, message: 'Prix du devis enregistré.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateRepairStatus = async (req, res) => {
  try {
    const { status, saleInfo } = req.body;
    const updateData = { status };

    if (saleInfo) {
      const normalizedSaleInfo = {
        ...saleInfo,
        amount: saleInfo.amount ?? saleInfo.amountPaid ?? 0,
        amountPaid: saleInfo.amountPaid ?? saleInfo.amount ?? 0
      };
      updateData.saleInfo = normalizedSaleInfo;
    }

    if (status === 'completed' || status === 'paid') {
      updateData.completedAt = new Date();
    }

    const repair = await RepairRequest.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }
    res.json({ success: true, data: repair, message: 'Statut de réparation mis à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.assignRepair = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const repair = await RepairRequest.findByIdAndUpdate(req.params.id, { assignedTo: employeeId, status: 'assigned' }, { new: true });
    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }
    res.json({ success: true, data: repair, message: 'Demande attribuée à un employé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getTradeins = async (req, res) => {
  try {
    const tradeins = await TradeinRequest.find();
    res.json({ success: true, data: tradeins, message: 'Liste des demandes d’échange.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateTradeinValue = async (req, res) => {
  try {
    const { proposedValue } = req.body;
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, { proposedValue: Number(proposedValue) }, { new: true });
    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }
    res.json({ success: true, data: tradein, message: 'Valeur proposée mise à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.acceptTradein = async (req, res) => {
  try {
    const { status, exchangeProduct } = req.body;
    const tradein = await TradeinRequest.findByIdAndUpdate(req.params.id, { 
      status: status || 'accepted',
      exchangeProduct: exchangeProduct 
    }, { new: true });
    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Demande introuvable.' });
    }
    res.json({ success: true, data: tradein, message: 'Échange accepté.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json({ success: true, data: employees, message: 'Liste des employés.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.clockIn = async (req, res) => {
  try {
    const { employeeId, date, startTime } = req.body;
    if (!employeeId || !date || !startTime) {
      return res.status(400).json({ success: false, data: null, message: 'employeeId, date et startTime requis.' });
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, data: null, message: 'Employé introuvable.' });
    }
    employee.workingHours.push({ date, startTime, endTime: '', totalHours: 0 });
    await employee.save();
    res.json({ success: true, data: employee, message: 'Arrivée enregistrée.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const { employeeId, date, endTime, totalHours } = req.body;
    if (!employeeId || !date || !endTime || totalHours == null) {
      return res.status(400).json({ success: false, data: null, message: 'employeeId, date, endTime et totalHours requis.' });
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, data: null, message: 'Employé introuvable.' });
    }
    const record = employee.workingHours.find((item) => item.date.toISOString().startsWith(new Date(date).toISOString().split('T')[0]));
    if (!record) {
      return res.status(404).json({ success: false, data: null, message: 'Enregistrement d’arrivée introuvable pour cette date.' });
    }
    record.endTime = endTime;
    record.totalHours = Number(totalHours);
    await employee.save();
    res.json({ success: true, data: employee, message: 'Départ enregistré.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ===== NOUVELLES FONCTIONS POUR L'INVENTAIRE =====
const InventoryItem = require('../models/InventoryItem');

exports.getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: items, message: 'Liste des articles d\'inventaire.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { name, category, description, sku, quantity, minQuantity, unitPrice, supplier, location } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await InventoryItem.create({
      name,
      category,
      description,
      sku,
      quantity: Number(quantity),
      minQuantity: Number(minQuantity),
      unitPrice: Number(unitPrice),
      supplier,
      location,
      photos: photo ? [photo] : []
    });
    res.status(201).json({ success: true, data: item, message: 'Article d\'inventaire créé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, data: null, message: 'Article introuvable.' });
    }
    res.json({ success: true, data: item, message: 'Article d\'inventaire mis à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, data: null, message: 'Article introuvable.' });
    }
    res.json({ success: true, data: item, message: 'Article d\'inventaire supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ===== NOUVELLES FONCTIONS POUR LES TECHNICIENS =====
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  try {
    const { name, phone, email, password, role, skills } = req.body;

    // Vérifier si l'email existe déjà
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ success: false, data: null, message: 'Email déjà utilisé.' });
    }

    // Valider le rôle
    const validRoles = ['admin', 'technician', 'cashier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, data: null, message: 'Rôle invalide.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const employee = await Employee.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: role || 'technician',
      skills: skills ? (Array.isArray(skills) ? skills : [skills]) : []
    });

    // Ne pas retourner le mot de passe
    const employeeResponse = { ...employee.toObject() };
    delete employeeResponse.password;

    res.status(201).json({ success: true, data: employeeResponse, message: 'Employé créé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Hasher le mot de passe si fourni
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!employee) {
      return res.status(404).json({ success: false, data: null, message: 'Employé introuvable.' });
    }

    // Ne pas retourner le mot de passe
    const employeeResponse = { ...employee.toObject() };
    delete employeeResponse.password;

    res.json({ success: true, data: employeeResponse, message: 'Employé mis à jour.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!employee) {
      return res.status(404).json({ success: false, data: null, message: 'Employé introuvable.' });
    }
    res.json({ success: true, data: null, message: 'Employé supprimé.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Authentification technicien
exports.technicianLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, message: 'Identifiants requis.' });
    }

    const employee = await Employee.findOne({ email, isActive: true });
    if (!employee) {
      return res.status(401).json({ success: false, data: null, message: 'Authentification échouée.' });
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, data: null, message: 'Authentification échouée.' });
    }

    const token = signToken({ id: employee._id, email: employee.email, role: employee.role });
    const employeeResponse = {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      skills: employee.skills
    };

    res.json({ success: true, data: { user: employeeResponse, token }, message: 'Authentification réussie.' });
  } catch (error) {
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};
