const RepairRequest = require('../models/RepairRequest');
const TradeinRequest = require('../models/TradeinRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

const createNotification = async (recipientId, recipientRole, type, title, message, requestId, clientName, reference) => {
  return notificationService.createNotification({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    requestId,
    clientName,
    reference
  });
};

const notifyAdmins = async (type, title, message, requestId, clientName, reference) => {
  return notificationService.notifyAdmins({
    type,
    title,
    message,
    requestId,
    clientName,
    reference
  });
};

// ===== FONCTIONS POUR LES TECHNICIENS =====
// Obtenir les réparations assignées au technicien
exports.getMyRepairs = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repairs = await RepairRequest.find({ assignedTo: technicianId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: repairs, message: 'Vos réparations assignées.' });
  } catch (error) {
    console.error('Erreur getMyRepairs:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir le détail d'une réparation spécifique
exports.getMyRepairById = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repair = await RepairRequest.findOne({
      _id: req.params.id,
      assignedTo: technicianId
    }).populate('assignedTo', 'name email');

    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Réparation introuvable ou non assignée à vous.' });
    }

    res.json({ success: true, data: repair, message: 'Détail de la réparation.' });
  } catch (error) {
    console.error('Erreur getMyRepairById:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Mettre à jour le statut d'une réparation
exports.updateRepairStatus = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { status, technicianReport } = req.body;

    const repair = await RepairRequest.findOne({
      _id: req.params.id,
      assignedTo: technicianId
    });

    if (!repair) {
      return res.status(404).json({ success: false, data: null, message: 'Réparation introuvable ou non assignée à vous.' });
    }

    // Vérifier que le statut est valide pour un technicien
    const allowedStatuses = ['diagnosing', 'repairing', 'ready', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, data: null, message: 'Statut non autorisé pour un technicien.' });
    }

    const updateData = { status };
    if (technicianReport !== undefined) {
      updateData.technicianReport = technicianReport;
    }

    if (repair.isVip && ['ready', 'completed'].includes(status) && !repair.vipBilling?.invoiceId) {
      updateData.vipBilling = {
        ...(repair.vipBilling || {}),
        status: 'billable',
        auditTrail: [
          ...((repair.vipBilling && Array.isArray(repair.vipBilling.auditTrail)) ? repair.vipBilling.auditTrail : []),
          {
            action: 'marked_billable',
            at: new Date(),
            byRole: req.user?.role || 'technician',
            byId: req.user?.id || null
          }
        ]
      };
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedRepair = await RepairRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email');

    // Notifier les admins et caissiers des changements de statut importants
    if (status === 'completed' || status === 'ready') {
      const Notification = require('../models/Notification');
      const Employee = require('../models/Employee');
      const admins = await Employee.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin._id,
          recipientRole: 'admin',
          type: 'repair_completed',
          title: 'Réparation terminée',
          message: `Réparation pour ${updatedRepair.deviceModel || 'appareil'} marquée comme ${status === 'completed' ? 'complétée' : 'prête'}`,
          requestId: updatedRepair._id,
          clientName: updatedRepair.clientName,
          reference: updatedRepair._id.toString().slice(-6)
        });
      }
    }

    res.json({ success: true, data: updatedRepair, message: 'Statut de réparation mis à jour.' });
  } catch (error) {
    console.error('Erreur updateRepairStatus:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir l'historique des réparations terminées
exports.getRepairHistory = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const repairs = await RepairRequest.find({
      assignedTo: technicianId,
      status: { $in: ['completed', 'paid'] }
    })
      .populate('assignedTo', 'name email')
      .sort({ completedAt: -1 });

    res.json({ success: true, data: repairs, message: 'Historique de vos réparations terminées.' });
  } catch (error) {
    console.error('Erreur getRepairHistory:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ===== FONCTIONS POUR LES ÉCHANGES =====

// Obtenir les échanges assignés au technicien
exports.getMyTradeins = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const tradeins = await TradeinRequest.find({ assignedTo: technicianId })
      .populate('assignedTo', 'name email')
      .populate('exchangeProduct', 'name price stock')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tradeins, message: 'Échanges assignés à vous.' });
  } catch (error) {
    console.error('Erreur getMyTradeins:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Créer un échange depuis l'interface technicien
exports.createTradein = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { clientName, clientWhatsapp, deviceModel, condition, targetProduct, description } = req.body;

    if (!clientWhatsapp || !deviceModel) {
      return res.status(400).json({ success: false, data: null, message: 'Le numéro WhatsApp et le modèle sont obligatoires.' });
    }

    const tradein = await TradeinRequest.create({
      clientName: clientName || 'Client',
      clientWhatsapp,
      deviceModel,
      condition: condition || 'good',
      targetProduct: targetProduct || '',
      description: description || '',
      assignedTo: technicianId,
      status: 'assigned'
    });

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
      data: { requestId: tradein._id, reference: tradein._id.toString().slice(-6) },
      message: 'Échange créé avec succès.'
    });
  } catch (error) {
    console.error('Erreur createTradein technicien:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir le détail d'un échange spécifique
exports.getMyTradeinById = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const tradein = await TradeinRequest.findOne({
      _id: req.params.id,
      assignedTo: technicianId
    }).populate('assignedTo', 'name email').populate('exchangeProduct', 'name price stock');

    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Échange introuvable ou non assigné à vous.' });
    }

    res.json({ success: true, data: tradein, message: 'Détail de l\'échange.' });
  } catch (error) {
    console.error('Erreur getMyTradeinById:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Mettre à jour le statut d'un échange
exports.updateTradeinStatus = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { status, technicianReport } = req.body;

    const tradein = await TradeinRequest.findOne({ 
      _id: req.params.id, 
      assignedTo: technicianId 
    });
    
    if (!tradein) {
      return res.status(404).json({ success: false, data: null, message: 'Échange introuvable ou non assigné à vous.' });
    }

    // Vérifier que le statut est valide pour un technicien
    const allowedStatuses = ['accepted', 'refused']; // Le technicien ne peut plus "finaliser" (completed)
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, data: null, message: 'Statut non autorisé pour un technicien.' });
    }

    const updateData = { status };
    if (technicianReport !== undefined) {
      updateData.technicianReport = technicianReport;
    }

    const updatedTradein = await TradeinRequest.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email');

    // Notifier les admins des changements de statut importants par le technicien
    if (status === 'accepted') {
      const Notification = require('../models/Notification');
      const Employee = require('../models/Employee');
      const admins = await Employee.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin._id,
          recipientRole: 'admin',
          type: 'tradein_accepted_by_technician', // Nouveau type de notification
          title: 'Échange accepté par technicien',
          message: `Le technicien ${req.user.name} a accepté l'échange pour ${updatedTradein.deviceModel || 'appareil'} (${updatedTradein.clientName}).`,
          requestId: updatedTradein._id,
          clientName: updatedTradein.clientName,
          reference: updatedTradein._id.toString().slice(-6)
        });
      }
    } else if (status === 'refused') {
      const Notification = require('../models/Notification');
      const Employee = require('../models/Employee');
      const admins = await Employee.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin._id,
          recipientRole: 'admin',
          type: 'tradein_refused_by_technician', // Nouveau type de notification
          title: 'Échange refusé par technicien',
          message: `Le technicien ${req.user.name} a refusé l'échange pour ${updatedTradein.deviceModel || 'appareil'} (${updatedTradein.clientName}).`,
          requestId: updatedTradein._id,
          clientName: updatedTradein.clientName,
          reference: updatedTradein._id.toString().slice(-6)
        });
      }
    }

    res.json({ success: true, data: updatedTradein, message: 'Statut de l\'échange mis à jour.' });
  } catch (error) {
    console.error('Erreur updateTradeinStatus:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// Obtenir l'historique des échanges terminés
exports.getTradeinHistory = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const tradeins = await TradeinRequest.find({
      assignedTo: technicianId,
      status: { $in: ['completed', 'paid'] }
    })
      .populate('assignedTo', 'name email')
      .sort({ completedAt: -1 });

    res.json({ success: true, data: tradeins, message: 'Historique de vos échanges terminés.' });
  } catch (error) {
    console.error('Erreur getTradeinHistory:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ==================== NOTIFICATIONS POUR TECHNICIEN ====================
exports.getTechnicianNotifications = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const notifications = await Notification.find({
      recipientId: technicianId,
      recipientRole: 'technician'
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: notifications, message: 'Notifications récupérées.' });
  } catch (error) {
    console.error('Erreur getTechnicianNotifications:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.markTechnicianNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, data: null, message: 'Notification introuvable.' });
    }
    
    res.json({ success: true, data: notification, message: 'Notification marquée comme lue.' });
  } catch (error) {
    console.error('Erreur markTechnicianNotificationRead:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

exports.markAllTechnicianNotificationsRead = async (req, res) => {
  try {
    const technicianId = req.user.id;
    
    await Notification.updateMany(
      { recipientId: technicianId, recipientRole: 'technician', read: false },
      { read: true }
    );
    
    res.json({ success: true, data: null, message: 'Toutes les notifications marquées comme lues.' });
  } catch (error) {
    console.error('Erreur markAllTechnicianNotificationsRead:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};

// ===== CRÉER UNE RÉPARATION DEPUIS L'INTERFACE TECHNICIEN =====
exports.createRepair = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { clientName, clientWhatsapp, deviceModel, issueDescription, estimatedCost, notes } = req.body;

    // Validation
    if (!clientName || !clientWhatsapp || !deviceModel) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Le nom du client, WhatsApp et le modèle sont obligatoires.' 
      });
    }

    const repair = await RepairRequest.create({
      clientName,
      clientWhatsapp,
      deviceModel,
      issueDescription: issueDescription || '',
      estimatedPrice: estimatedCost || 0,
      technicianReport: notes || '',
      isVip: false,
      billingMode: 'immediate',
      assignedTo: technicianId,
      status: 'assigned'
    });

    // Notification aux admins
    const Notification = require('../models/Notification');
    const Employee = require('../models/Employee');
    const admins = await Employee.find({ role: 'admin', isActive: true });
    
    for (const admin of admins) {
      await Notification.create({
        recipientId: admin._id,
        recipientRole: 'admin',
        type: 'repair_created',
        title: 'Nouvelle réparation créée',
        message: `${repair.clientName} - ${repair.deviceModel}: ${repair.issueDescription?.substring(0, 100) || 'Aucune description'}`,
        requestId: repair._id,
        clientName: repair.clientName,
        reference: repair._id.toString().slice(-6)
      });
    }

    res.status(201).json({
      success: true,
      data: { 
        requestId: repair._id, 
        reference: repair._id.toString().slice(-6),
        repair: repair 
      },
      message: 'Réparation créée avec succès.'
    });
  } catch (error) {
    console.error('Erreur createRepair technicien:', error);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: error.message 
    });
  }
};

// Créer un échange depuis l'interface technicien
exports.createTradein = async (req, res) => {
  try {
    const technicianId = req.user.id;
    const { 
      clientName, 
      clientWhatsapp, 
      deviceModel, 
      condition, 
      targetProduct,
      targetProductName,
      targetProductPrice,
      proposedValue, 
      notes 
    } = req.body;

    // Log pour debug
    console.log('Données reçues:', req.body);
    console.log('Technicien ID:', technicianId);

    // Validation
    if (!clientWhatsapp) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Le numéro WhatsApp est obligatoire.' 
      });
    }
    
    if (!deviceModel) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Le modèle de l\'appareil est obligatoire.' 
      });
    }

    // Création de l'échange
    const tradein = await TradeinRequest.create({
      clientName: clientName || 'Client',
      clientWhatsapp,
      deviceModel,
      condition: condition || 'good',
      targetProduct: targetProduct || '',
      proposedValue: parseFloat(proposedValue) || 0,
      notes: notes || '',
      assignedTo: technicianId,
      status: 'pending' // Changé de 'assigned' à 'pending' pour correspondre au frontend
    });

    // Notification aux admins
    try {
      const admins = await Employee.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await Notification.create({
          recipientId: admin._id,
          recipientRole: 'admin',
          type: 'tradein_pending',
          title: 'Nouvelle demande d\'échange',
          message: `Nouvelle demande d'échange pour ${deviceModel} par ${clientName || 'Client'}`,
          requestId: tradein._id,
          clientName: clientName || 'Client',
          reference: tradein._id.toString().slice(-6)
        });
      }
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
      // Ne pas bloquer la création si la notification échoue
    }

    res.status(201).json({
      success: true,
      data: { 
        requestId: tradein._id, 
        reference: tradein._id.toString().slice(-6),
        tradein: tradein 
      },
      message: 'Échange créé avec succès.'
    });
  } catch (error) {
    console.error('Erreur createTradein:', error);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: error.message || 'Erreur lors de la création de l\'échange' 
    });
  }
};