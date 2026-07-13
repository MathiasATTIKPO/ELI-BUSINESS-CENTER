const cron = require('node-cron');
const ResellerContract = require('../models/ResellerContract');
const Reseller = require('../models/Reseller');
const notificationService = require('../services/notificationService');

const checkExpirations = async () => {
  try {
    const now = new Date();
    const inSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const dueSoonContracts = await ResellerContract.find({
      dueAt: { $gt: now, $lte: inSixHours },
      status: 'active'
    });

    for (const c of dueSoonContracts) {
      await notificationService.createNotification({
        recipientId: c.reseller,
        recipientRole: 'reseller',
        type: 'contract_due_soon',
        title: 'Echeance proche',
        message: `Contrat ${c.number} arrive a echeance bientot.`,
        requestId: c._id,
        reference: c.number
      });
    }

    // Expire only contracts where pickup happened and countdown started.
    const contracts = await ResellerContract.find({ dueAt: { $lte: now }, status: 'active' });
    if (!contracts.length) return;
    for (const c of contracts) {
      c.status = 'expired';
      c.history.push({ byRole: 'system', action: 'expired', data: {}, createdAt: new Date() });
      await c.save();

      // update reseller stats if needed
      try {
        await Reseller.findByIdAndUpdate(c.reseller, { $inc: { 'stats.returnedCount': 1 } });
      } catch (e) {}

      // notify reseller and admins
      await notificationService.createNotification({ recipientId: c.reseller, recipientRole: 'reseller', type: 'contract_expired', title: 'Contrat expiré', message: `Contrat ${c.number} a expiré`, requestId: c._id, reference: c.number });
      await notificationService.notifyAdmins({ type: 'contract_expired', title: 'Contrat expiré', message: `Contrat ${c.number} a expiré`, requestId: c._id, reference: c.number });
    }
  } catch (error) {
    console.error('[contractExpiryJob] error:', error.message);
  }
};

module.exports = {
  start: () => {
    // Run immediately at startup then every 15 minutes
    checkExpirations().catch(err => console.error(err));
    cron.schedule('*/15 * * * *', () => {
      console.log('[contractExpiryJob] running expiration check');
      checkExpirations().catch(err => console.error(err));
    });
  }
};
