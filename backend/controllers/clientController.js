const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const Product = require('../models/Product');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

const formatReference = (id) => {
  if (!id) return 'N/A';
  return `REF-${id.toString().slice(-6).toUpperCase()}`;
};

// Fonction de création de notification
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
    console.log(`✅ Notification créée pour ${recipientRole}`);
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
};

const notifyAdmins = async (type, title, message, requestId, clientName, reference) => {
  try {
    const admins = await Employee.find({ role: 'admin', isActive: true });
    console.log(`📢 Envoi de notification à ${admins.length} administrateur(s)`);
    for (const admin of admins) {
      await createNotification(
        admin._id,
        'admin',
        type,
        title,
        message,
        requestId,
        clientName,
        reference
      );
    }
  } catch (error) {
    console.error('Erreur notification admins:', error);
  }
};

// Récupérer les produits pour le client
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true, stock: { $gt: 0 } }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer une demande de réparation
exports.createRepair = async (req, res) => {
  try {
    console.log('📝 Nouvelle demande de réparation reçue');
    console.log('Body:', req.body);
    console.log('Fichiers:', req.files?.length || 0);

    const { clientName, clientWhatsapp, deviceModel, issueDescription } = req.body;
    
    // Validation
    if (!clientWhatsapp || !deviceModel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le numéro WhatsApp et le modèle sont obligatoires' 
      });
    }
    
    // Traitement des photos
    const photoPaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Création de la réparation
    const repair = await RepairRequest.create({
      clientName: clientName || 'Client',
      clientWhatsapp,
      deviceModel,
      issueDescription: issueDescription || '',
      photos: photoPaths,
      status: 'pending'
    });
    
    console.log(`✅ Réparation créée avec l'ID: ${repair._id}`);
    
    // Notifier les administrateurs
    await notifyAdmins(
      'repair_pending',
      'Nouvelle demande de réparation',
      `Nouvelle demande de réparation pour ${deviceModel} par ${clientName || 'Client'}`,
      repair._id,
      clientName || 'Client',
      repair._id.toString().slice(-6)
    );
    
    res.status(201).json({ 
      success: true, 
      data: { requestId: repair._id, reference: formatReference(repair._id) },
      message: 'Votre demande de réparation a été enregistrée avec succès.' 
    });
    
  } catch (error) {
    console.error('❌ Erreur createRepair:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'enregistrement de votre demande' 
    });
  }
};

// Créer une demande d'échange
exports.createTradein = async (req, res) => {
  try {
    console.log('📝 Nouvelle demande d\'échange reçue');
    console.log('Body:', req.body);
    console.log('Fichiers:', req.files?.length || 0);

    const { clientName, clientWhatsapp, deviceModel, condition, targetProduct, description } = req.body;
    
    // Validation
    if (!clientWhatsapp || !deviceModel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le numéro WhatsApp et le modèle sont obligatoires' 
      });
    }
    
    // Traitement des photos
    const photoPaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Création de l'échange
    const tradein = await TradeinRequest.create({
      clientName: clientName || 'Client',
      clientWhatsapp,
      deviceModel,
      condition: condition || 'good',
      targetProduct: targetProduct || '',
      description: description || '',
      photos: photoPaths,
      status: 'pending'
    });
    
    console.log(`✅ Échange créé avec l'ID: ${tradein._id}`);
    
    // Notifier les administrateurs
    await notifyAdmins(
      'tradein_pending',
      'Nouvelle demande d\'échange',
      `Nouvelle demande d'échange pour ${deviceModel} par ${clientName || 'Client'}`,
      tradein._id,
      clientName || 'Client',
      tradein._id.toString().slice(-6)
    );
    
    res.status(201).json({ 
      success: true, 
      data: { requestId: tradein._id, reference: formatReference(tradein._id) },
      message: 'Votre demande d\'échange a été enregistrée avec succès.' 
    });
    
  } catch (error) {
    console.error('❌ Erreur createTradein:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'enregistrement de votre demande' 
    });
  }
};