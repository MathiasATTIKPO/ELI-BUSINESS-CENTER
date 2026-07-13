const VIPClient = require('../models/VIPClient')
const VIPRepair = require('../models/VIPRepair')
const VIPInvoice = require('../models/VIPInvoice')

exports.getStats = async (req, res) => {
  try {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const repairsThisMonth = await VIPRepair.countDocuments({ date: { $gte: start, $lte: end } })
    const invoicesThisMonth = await VIPInvoice.countDocuments({ createdAt: { $gte: start, $lte: end } })
    const activeClients = await VIPClient.countDocuments({ isActive: true })

    const [unbilledRepairs, billedRepairs] = await Promise.all([
      // RepairRequest is the main operational source for VIP repair billing.
      require('../models/RepairRequest').countDocuments({
        isVip: true,
        status: { $in: ['ready', 'completed', 'paid'] },
        'vipBilling.invoiceId': null
      }),
      require('../models/RepairRequest').countDocuments({
        isVip: true,
        'vipBilling.invoiceId': { $ne: null }
      })
    ])

    const totalAmountAgg = await VIPInvoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ])
    const paidAmountAgg = await VIPInvoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ])
    const balanceAgg = await VIPInvoice.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ])

    const yearlyAgg = await VIPInvoice.aggregate([
      { $match: { createdAt: { $gte: yearStart, $lte: now } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          billed: { $sum: '$total' },
          collected: { $sum: '$paidAmount' },
          invoices: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ])

    const paidInvoices = await VIPInvoice.countDocuments({ status: 'paid', createdAt: { $gte: start, $lte: end } })
    const unpaidInvoices = await VIPInvoice.countDocuments({ status: { $in: ['issued', 'partially_paid', 'overdue'] }, createdAt: { $gte: start, $lte: end } })
    const overdueInvoices = await VIPInvoice.countDocuments({ status: 'overdue' })

    const totalAmount = totalAmountAgg[0] ? totalAmountAgg[0].total : 0
    const paidAmount = paidAmountAgg[0] ? paidAmountAgg[0].total : 0
    const receivables = balanceAgg[0] ? balanceAgg[0].total : 0

    const monthlySeries = Array.from({ length: 12 }).map((_, index) => {
      const month = index + 1
      const found = yearlyAgg.find((entry) => entry._id.month === month)
      return {
        month,
        billed: found ? found.billed : 0,
        collected: found ? found.collected : 0,
        invoices: found ? found.invoices : 0
      }
    })

    res.json({
      success: true,
      data: {
        totalVipClients: activeClients,
        repairsThisMonth,
        unbilledRepairs,
        billedRepairs,
        invoicesThisMonth,
        activeClients,
        totalAmount,
        billedRevenue: totalAmount,
        paidAmount,
        collectedRevenue: paidAmount,
        receivables,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
        monthlySeries
      }
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

module.exports = exports
