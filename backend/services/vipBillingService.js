const mongoose = require('mongoose');
const VIPInvoice = require('../models/VIPInvoice');
const VIPClient = require('../models/VIPClient');
const notificationService = require('./notificationService');
const RepairRequest = require('../models/RepairRequest');
const invoiceController = require('../controllers/invoiceController');

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const generateInvoiceNumber = (periodStart, vipId, mode = 'automatic') => {
  const y = periodStart.getFullYear();
  const m = String(periodStart.getMonth() + 1).padStart(2, '0');
  const shortId = String(vipId).slice(-6).toUpperCase();
  const suffix = mode === 'manual' ? 'M' : 'A';
  const serial = String(Date.now()).slice(-5);
  return `VIP-${y}${m}-${shortId}-${suffix}${serial}`;
};

const getBillableRepairs = async ({ vipClientId, periodStart, periodEnd, repairIds = null, session = null }) => {
  const query = {
    isVip: true,
    status: { $in: ['ready', 'completed', 'paid'] },
    'vipBilling.invoiceId': null
  };

  if (vipClientId) {
    query.vipClient = vipClientId;
  }

  if (periodStart || periodEnd) {
    query.createdAt = {};
    if (periodStart) query.createdAt.$gte = new Date(periodStart);
    if (periodEnd) query.createdAt.$lte = new Date(periodEnd);
  }

  if (Array.isArray(repairIds) && repairIds.length > 0) {
    const validIds = repairIds
      .map((id) => String(id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (!validIds.length) {
      throw new Error('Aucune réparation valide sélectionnée pour la facturation manuelle.');
    }

    query._id = { $in: validIds };
  }

  const cursor = RepairRequest.find(query)
    .populate('assignedTo', 'name')
    .populate('vipClient', 'name phone whatsapp isActive metadata')
    .sort({ createdAt: 1 });

  if (session) cursor.session(session);
  return cursor;
};

const mapRepairToLine = (repair) => {
  const amount = Number(repair.saleInfo?.amount || repair.price || repair.estimatedPrice || 0);
  return {
    repairId: repair._id,
    description: `${repair.deviceModel || 'Appareil'} - ${repair.issueDescription || 'Réparation VIP'}`,
    deviceModel: repair.deviceModel || '',
    imei: repair.imei || '',
    issue: repair.issueDescription || '',
    technicianName: repair.assignedTo?.name || '',
    replacedParts: Array.isArray(repair.parts) ? repair.parts : [],
    warrantyDays: repair.warrantyDays || 0,
    repairDate: repair.completedAt || repair.createdAt || new Date(),
    quantity: 1,
    unitPrice: amount,
    total: amount
  };
};

const appendRepairAudit = (repair, action, payload, at = new Date()) => {
  const current = Array.isArray(repair?.vipBilling?.auditTrail) ? repair.vipBilling.auditTrail : [];
  return [...current, { action, at, ...payload }].slice(-50);
};

const createInvoiceForRepairs = async ({
  vipClient,
  repairs,
  periodStart,
  periodEnd,
  tvaRate = 0,
  generationMode = 'automatic',
  user = null,
  session = null
}) => {
  const start = toDateOnly(new Date(periodStart));
  const end = new Date(periodEnd);

  const lines = repairs.map(mapRepairToLine);
  const subtotal = lines.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const tva = subtotal * (Number(tvaRate) || 0);
  const total = subtotal + tva;
  const now = new Date();

  let invoice = null;
  let createdInvoice = null;
  let finalEnd = new Date(end);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      invoice = await VIPInvoice.create([
        {
          invoiceNumber: generateInvoiceNumber(start, vipClient._id, generationMode),
          vipClient: vipClient._id,
          generationMode,
          periodStart: start,
          periodEnd: finalEnd,
          repairs: lines,
          repairRefs: repairs.map((r) => r._id),
          subtotal,
          tva,
          total,
          paidAmount: 0,
          balance: total,
          status: total === 0 ? 'paid' : 'issued',
          issuedAt: now,
          dueAt: new Date(new Date(finalEnd).getTime() + 7 * 24 * 60 * 60 * 1000),
          issuedById: user?.id || null,
          issuedByRole: user?.role || generationMode,
          auditTrail: [
            {
              action: generationMode === 'manual' ? 'invoice_generated_manual' : 'invoice_generated_automatic',
              at: now,
              byId: user?.id || null,
              byRole: user?.role || generationMode,
              byName: user?.name || '',
              data: {
                repairsCount: repairs.length,
                subtotal,
                tva,
                total
              }
            }
          ]
        }
      ], { session });
      createdInvoice = invoice[0];
      break;
    } catch (error) {
      // Legacy unique index can still exist on vipClient+periodStart+periodEnd.
      if (error?.code === 11000 && attempt < 2) {
        finalEnd = new Date(finalEnd.getTime() + 1000);
        continue;
      }
      throw error;
    }
  }

  if (!createdInvoice) {
    throw new Error('Impossible de créer la facture VIP.');
  }

  for (const repair of repairs) {
    repair.vipBilling = {
      ...(repair.vipBilling || {}),
      status: createdInvoice.status === 'paid' ? 'paid' : 'invoiced',
      invoiceId: createdInvoice._id,
      invoicedAt: now,
      paidAt: createdInvoice.status === 'paid' ? now : null,
      auditTrail: appendRepairAudit(
        repair,
        generationMode === 'manual' ? 'invoice_linked_manual' : 'invoice_linked_automatic',
        {
          invoiceId: createdInvoice._id,
          invoiceNumber: createdInvoice.invoiceNumber,
          byId: user?.id || null,
          byRole: user?.role || generationMode,
          byName: user?.name || ''
        },
        now
      )
    };
    await repair.save({ session });
  }

  if (total > 0) {
    try {
      const pdf = await invoiceController.createInvoicePdf({
        requestType: 'vip',
        requestId: createdInvoice._id,
        clientName: vipClient.name,
        clientWhatsapp: vipClient.whatsapp || vipClient.phone,
        amount: total,
        itemName: `Facture VIP ${createdInvoice.invoiceNumber}`
      });
      createdInvoice.pdfPath = pdf?.pdfUrl || pdf?.path || '';
      await createdInvoice.save({ session });
    } catch (err) {
      // Keep invoice even if PDF generation fails.
    }
  }

  return createdInvoice;
};

const shouldFallbackWithoutTransaction = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
    message.includes('replica set') ||
    message.includes('transactions are not supported') ||
    message.includes('operation was interrupted')
  );
};

const generateMonthlyInvoiceForClient = async ({ vipClientId, periodStart, periodEnd, tvaRate = 0, user = null }) => {
  const vipClient = await VIPClient.findById(vipClientId);
  if (!vipClient) {
    throw new Error('VIP client not found');
  }

  const start = toDateOnly(new Date(periodStart));
  const end = new Date(periodEnd);

  const existing = await VIPInvoice.findOne({
    vipClient: vipClientId,
    generationMode: 'automatic',
    periodStart: start,
    periodEnd: end
  });

  if (existing) {
    return { invoice: existing, created: false };
  }

  const repairs = await getBillableRepairs({ vipClientId, periodStart: start, periodEnd: end });
  if (!repairs.length) {
    return { invoice: null, created: false, reason: 'NO_BILLABLE_REPAIRS' };
  }

  let invoice = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      invoice = await createInvoiceForRepairs({
        vipClient,
        repairs,
        periodStart: start,
        periodEnd: end,
        tvaRate,
        generationMode: 'automatic',
        user,
        session
      });
    });
  } catch (error) {
    if (!shouldFallbackWithoutTransaction(error)) {
      throw error;
    }
    // Local Mongo without replica set: run same logic without transaction.
    invoice = await createInvoiceForRepairs({
      vipClient,
      repairs,
      periodStart: start,
      periodEnd: end,
      tvaRate,
      generationMode: 'automatic',
      user,
      session: null
    });
  } finally {
    await session.endSession();
  }

  await notificationService.createNotification({
    recipientId: vipClientId,
    recipientRole: 'vip',
    type: 'invoice_generated',
    title: 'Facture VIP générée',
    message: `Votre facture mensuelle (${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}) est disponible.`,
    requestId: invoice?._id,
    reference: invoice?.invoiceNumber
  });

  await notificationService.notifyAdmins({
    type: 'invoice_generated',
    title: 'Facture VIP générée',
    message: `Facture ${invoice?.invoiceNumber} générée pour ${vipClient.name}`,
    requestId: invoice?._id,
    reference: invoice?.invoiceNumber
  });

  return { invoice, created: true };
};

const generateManualInvoiceForClient = async ({ vipClientId, repairIds = null, tvaRate = 0, user = null }) => {
  const vipClient = await VIPClient.findById(vipClientId);
  if (!vipClient) throw new Error('VIP client not found');

  const repairs = await getBillableRepairs({ vipClientId, repairIds });
  if (!repairs.length) {
    return { invoice: null, created: false, reason: 'NO_BILLABLE_REPAIRS' };
  }

  const createdDates = repairs.map((r) => new Date(r.createdAt || r.completedAt || new Date()).getTime());
  const minDate = new Date(Math.min(...createdDates));
  const maxDate = new Date(Math.max(...createdDates));

  let invoice = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      invoice = await createInvoiceForRepairs({
        vipClient,
        repairs,
        periodStart: minDate,
        periodEnd: maxDate,
        tvaRate,
        generationMode: 'manual',
        user,
        session
      });
    });
  } catch (error) {
    if (!shouldFallbackWithoutTransaction(error)) {
      throw error;
    }
    // Local Mongo without replica set: run same logic without transaction.
    invoice = await createInvoiceForRepairs({
      vipClient,
      repairs,
      periodStart: minDate,
      periodEnd: maxDate,
      tvaRate,
      generationMode: 'manual',
      user,
      session: null
    });
  } finally {
    await session.endSession();
  }

  return { invoice, created: true };
};

module.exports = {
  getBillableRepairs,
  generateMonthlyInvoiceForClient,
  generateManualInvoiceForClient
};
