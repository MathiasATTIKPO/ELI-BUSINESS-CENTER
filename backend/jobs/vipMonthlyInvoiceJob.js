const cron = require('node-cron');
const VIPClient = require('../models/VIPClient');
const { generateMonthlyInvoiceForClient } = require('../services/vipBillingService');

const getPreviousMonthRange = () => {
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(firstDayCurrentMonth.getTime() - 24 * 60 * 60 * 1000);
  const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
  return { periodStart, periodEnd };
};

const runMonthlyBilling = async () => {
  try {
    const { periodStart, periodEnd } = getPreviousMonthRange();
    const clients = await VIPClient.find({ isActive: true });

    for (const vip of clients) {
      try {
        await generateMonthlyInvoiceForClient({
          vipClientId: vip._id,
          periodStart,
          periodEnd,
          tvaRate: 0
        });
      } catch (err) {
        console.error(`[vipMonthlyInvoiceJob] Failed for ${vip._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[vipMonthlyInvoiceJob] error:', error.message);
  }
};

module.exports = {
  start: () => {
    // Every day at 02:10. Duplicate protection is handled by unique period lookup.
    cron.schedule('10 2 * * *', () => {
      console.log('[vipMonthlyInvoiceJob] running monthly billing sweep');
      runMonthlyBilling().catch((err) => console.error(err));
    });
  },
  runMonthlyBilling
};
