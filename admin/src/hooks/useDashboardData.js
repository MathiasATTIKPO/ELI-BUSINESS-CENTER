import { useCallback, useMemo, useState } from 'react'
import {
  getRepairs,
  getEmployees,
  getTradeins,
  getProducts,
  getInventory,
  getSales,
  getResellers,
  getResellerContracts,
  getVipClients,
  getVipRepairs,
  getVipInvoices,
  downloadInvoicePdf,
} from '../api/dashboard'
import { monthKey } from '../utils/formatters'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const avg = (values = []) => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
}
const pctChange = (current, previous) => {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

const inferBrand = (sale) => {
  const explicitBrand = String(sale?.productBrand || '').trim()
  if (explicitBrand) return explicitBrand
  const name = String(sale?.productName || '').trim()
  if (!name) return 'Autres'
  const first = name.split(/\s+/)[0]
  return first || 'Autres'
}

const extractIssueType = (issue) => {
  const text = String(issue || '').toLowerCase()
  if (!text) return 'Autres'
  if (text.includes('ecran') || text.includes('écran') || text.includes('display') || text.includes('vitre')) return 'Ecran'
  if (text.includes('batterie') || text.includes('charge')) return 'Batterie'
  if (text.includes('logiciel') || text.includes('software') || text.includes('ios') || text.includes('android')) return 'Logiciel'
  if (text.includes('carte') || text.includes('motherboard') || text.includes('ic')) return 'Carte mère'
  if (text.includes('camera') || text.includes('caméra')) return 'Caméra'
  if (text.includes('reseau') || text.includes('réseau') || text.includes('wifi') || text.includes('signal')) return 'Réseau'
  return 'Autres'
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [employees, setEmployees] = useState([])
  const [sales, setSales] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [invoicesData, setInvoicesData] = useState([])

  const [pendingRepairsCount, setPendingRepairsCount] = useState(0)
  const [pendingTradeinsCount, setPendingTradeinsCount] = useState(0)

  const [salesEvolution, setSalesEvolution] = useState([])
  const [repairsEvolution, setRepairsEvolution] = useState([])
  const [tradeinsEvolution, setTradeinsEvolution] = useState([])
  const [weeklyActivity, setWeeklyActivity] = useState([])

  const [stats, setStats] = useState({
    totalRepairs: 0,
    completedRepairsCount: 0,
    inProgressRepairs: 0,
    repairRevenue: 0,
    tradeinRevenue: 0,
    phoneSalesRevenue: 0,
    totalRevenue: 0,
    technicians: 0,
    cashiers: 0,
    employees: 0,
    totalTradeins: 0,
    pendingTradeins: 0,
    totalPhoneSales: 0,
    activeResellers: 0,
    soldContractsCount: 0,
    activeContractsCount: 0,
    resellerSalesAmount: 0,
    totalVIPClients: 0,
    activeVIPClients: 0,
    vipRepairsCount: 0,
    vipInvoicesCount: 0,
    vipRevenue: 0,
    vipRepairsByClient: [],
    resellerPerformance: [],
    avgBasketGlobal: 0,
    avgBasketRepair: 0,
    avgBasketTradein: 0,
    avgBasketPhone: 0,
    topModelsSold: [],
    topBrands: [],
    repairIssues: [],
    avgRepairTimeHours: 0,
    repairTimeTrendPct: 0,
    repairSuccessRate: 0,
    technicianUtilizationRate: 0,
    revenuePerTechnician: 0,
    revenuePerEmployee: 0,
    clientRecurrenceRate: 0,
    vipConversionRate: 0,
    vipAvgBasket: 0,
    nonVipAvgBasket: 0,
    newVipByMonth: [],
    exchangeAcceptanceRate: 0,
    avgTradeinValue: 0,
    avgTradeinProcessingHours: 0,
    revenueGrowthVsPrevMonth: 0,
    annualComparisonPct: 0,
    salesForecastNextMonth: 0,
    repairsByStatus: [],
    tradeinsByStatus: [],
    monthlyRevenue: [],
    recentRepairs: [],
    recentSales: [],
    recentTradeins: [],
  })

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      const [
        repairsRes,
        employeesRes,
        tradeinsRes,
        productsRes,
        inventoryRes,
        phoneSalesRes,
        resellersRes,
        resellerContractsRes,
        vipClientsRes,
        vipRepairsRes,
        vipInvoicesRes,
      ] = await Promise.all([
        getRepairs(),
        getEmployees(),
        getTradeins(),
        getProducts(),
        getInventory(),
        getSales(),
        getResellers(),
        getResellerContracts(),
        getVipClients(),
        getVipRepairs(),
        getVipInvoices(),
      ])

      const repairs = repairsRes.data.data || []
      const employeesList = employeesRes.data.data || []
      const tradeins = tradeinsRes.data.data || []
      const productsList = productsRes.data.data || []
      const inventoryList = inventoryRes.data.data || []
      const phoneSalesRaw = phoneSalesRes.data.data || []
      const resellersList = resellersRes.data.data || []
      const resellerContractsList = resellerContractsRes.data.data || []
      const vipClientsList = vipClientsRes.data.data || []
      const vipRepairsList = vipRepairsRes.data.data || []
      const vipInvoicesList = vipInvoicesRes.data.data || []

      setPendingRepairsCount(repairs.filter((r) => r.status === 'pending').length)
      setPendingTradeinsCount(tradeins.filter((t) => t.status === 'pending').length)

      const paidRepairsList = repairs
        .filter((r) => r.status === 'paid')
        .map((r) => ({
          _id: r._id,
          type: 'repair',
          clientName: r.clientName || 'Client',
          productName: r.deviceModel || 'Appareil',
          amount: r.saleInfo?.amountPaid || r.price || 0,
          date: r.saleInfo?.paymentDate || r.completedAt || r.updatedAt,
          status: r.status,
          isVip: Boolean(r.isVip),
          clientWhatsapp: r.clientWhatsapp || '',
        }))

      const completedTradeinsList = tradeins
        .filter((t) => t.status === 'completed' || t.status === 'paid')
        .map((t) => ({
          _id: t._id,
          type: 'tradein',
          clientName: t.clientName || 'Client',
          productName: t.deviceModel || 'Appareil',
          amount: t.saleInfo?.amount || t.proposedValue || 0,
          date: t.saleInfo?.paymentDate || t.completedAt || t.updatedAt,
          status: t.status,
          clientWhatsapp: t.clientWhatsapp || '',
        }))

      const phoneSalesList = phoneSalesRaw
        .filter((s) => s.type === 'product' || s.type === 'phone')
        .map((s) => ({
          _id: s._id,
          type: 'phone',
          clientName: s.clientName || 'Client',
          productName: s.productName || 'Téléphone',
          amount: s.totalAmount || s.amount || s.saleInfo?.amount || 0,
          date: s.paymentDate || s.createdAt || s.saleInfo?.paymentDate || new Date(),
          status: s.status || 'completed',
          clientWhatsapp: s.clientWhatsapp || '',
        }))

      const allTransactions = [...paidRepairsList, ...completedTradeinsList, ...phoneSalesList].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

      const repairRevenue = paidRepairsList.reduce((sum, r) => sum + (r.amount || 0), 0)
      const tradeinRevenue = completedTradeinsList.reduce((sum, t) => sum + (t.amount || 0), 0)
      const phoneSalesRevenue = phoneSalesList.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalRevenue = repairRevenue + tradeinRevenue + phoneSalesRevenue

      const totalTransactions = allTransactions.length
      const avgBasketGlobal = totalTransactions ? totalRevenue / totalTransactions : 0
      const avgBasketRepair = paidRepairsList.length ? repairRevenue / paidRepairsList.length : 0
      const avgBasketTradein = completedTradeinsList.length ? tradeinRevenue / completedTradeinsList.length : 0
      const avgBasketPhone = phoneSalesList.length ? phoneSalesRevenue / phoneSalesList.length : 0

      const vipRevenue = vipInvoicesList.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const vipAvgBasket = vipInvoicesList.length ? vipRevenue / vipInvoicesList.length : 0
      const nonVipRepairTransactions = paidRepairsList.filter((r) => !r.isVip)
      const nonVipRevenue = nonVipRepairTransactions.reduce((sum, r) => sum + (r.amount || 0), 0) + tradeinRevenue + phoneSalesRevenue
      const nonVipCount = nonVipRepairTransactions.length + completedTradeinsList.length + phoneSalesList.length
      const nonVipAvgBasket = nonVipCount ? nonVipRevenue / nonVipCount : 0

      const clientsMap = allTransactions.reduce((acc, tx) => {
        const key = String(tx.clientWhatsapp || tx.clientName || '').trim().toLowerCase()
        if (!key) return acc
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
      const uniqueClients = Object.keys(clientsMap).length
      const recurringClients = Object.values(clientsMap).filter((count) => count > 1).length
      const clientRecurrenceRate = uniqueClients ? (recurringClients / uniqueClients) * 100 : 0

      const modelMap = phoneSalesRaw
        .filter((s) => s.type === 'product' || s.type === 'phone')
        .reduce((acc, sale) => {
          const model = sale.productName || 'Modèle inconnu'
          const quantity = Number(sale.quantity || 1)
          const amount = Number(sale.totalAmount || sale.amount || sale.saleInfo?.amount || 0)
          if (!acc[model]) acc[model] = { model, quantity: 0, revenue: 0 }
          acc[model].quantity += quantity
          acc[model].revenue += amount
          return acc
        }, {})
      const topModelsSold = Object.values(modelMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      const brandMap = phoneSalesRaw
        .filter((s) => s.type === 'product' || s.type === 'phone')
        .reduce((acc, sale) => {
          const brand = inferBrand(sale)
          const amount = Number(sale.totalAmount || sale.amount || sale.saleInfo?.amount || 0)
          if (!acc[brand]) acc[brand] = { brand, revenue: 0, quantity: 0 }
          acc[brand].revenue += amount
          acc[brand].quantity += Number(sale.quantity || 1)
          return acc
        }, {})
      const topBrands = Object.values(brandMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

      const issueMap = repairs.reduce((acc, repair) => {
        const issueType = extractIssueType(repair.issueDescription)
        acc[issueType] = (acc[issueType] || 0) + 1
        return acc
      }, {})
      const repairIssues = Object.entries(issueMap)
        .map(([issue, value]) => ({ issue, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      const repairDurationsHours = repairs
        .filter((r) => ['completed', 'paid', 'soldee'].includes(r.status) && r.createdAt && (r.completedAt || r.updatedAt || r.saleInfo?.paymentDate))
        .map((r) => {
          const start = new Date(r.createdAt).getTime()
          const end = new Date(r.completedAt || r.updatedAt || r.saleInfo?.paymentDate).getTime()
          return Math.max(0, (end - start) / 3600000)
        })
      const avgRepairTimeHours = avg(repairDurationsHours)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const previousMonthDate = new Date(currentYear, currentMonth - 1, 1)
      const previousMonth = previousMonthDate.getMonth()
      const previousYear = previousMonthDate.getFullYear()

      const currentMonthDurations = repairs
        .filter((r) => {
          const endAt = r.completedAt || r.updatedAt || r.saleInfo?.paymentDate
          if (!endAt || !r.createdAt) return false
          const d = new Date(endAt)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .map((r) => (new Date(r.completedAt || r.updatedAt || r.saleInfo?.paymentDate).getTime() - new Date(r.createdAt).getTime()) / 3600000)

      const previousMonthDurations = repairs
        .filter((r) => {
          const endAt = r.completedAt || r.updatedAt || r.saleInfo?.paymentDate
          if (!endAt || !r.createdAt) return false
          const d = new Date(endAt)
          return d.getMonth() === previousMonth && d.getFullYear() === previousYear
        })
        .map((r) => (new Date(r.completedAt || r.updatedAt || r.saleInfo?.paymentDate).getTime() - new Date(r.createdAt).getTime()) / 3600000)
      const repairTimeTrendPct = pctChange(avg(currentMonthDurations), avg(previousMonthDurations))

      const finalRepairs = repairs.filter((r) => ['completed', 'paid', 'soldee', 'cancelled'].includes(r.status))
      const successfulRepairs = repairs.filter((r) => ['completed', 'paid', 'soldee'].includes(r.status)).length
      const repairSuccessRate = finalRepairs.length ? (successfulRepairs / finalRepairs.length) * 100 : 0

      const activeTechnicians = employeesList.filter((e) => e.role === 'technician' && e.isActive !== false).length
      const activeRepairLoad = repairs.filter((r) => ['assigned', 'diagnosing', 'repairing'].includes(r.status)).length
      const technicianUtilizationRate = activeTechnicians ? clamp((activeRepairLoad / (activeTechnicians * 5)) * 100, 0, 100) : 0

      const acceptedTradeinsCount = tradeins.filter((t) => ['accepted', 'completed', 'paid'].includes(t.status)).length
      const exchangeAcceptanceRate = tradeins.length ? (acceptedTradeinsCount / tradeins.length) * 100 : 0
      const avgTradeinValue = completedTradeinsList.length ? avg(completedTradeinsList.map((t) => t.amount || 0)) : 0
      const avgTradeinProcessingHours = avg(
        tradeins
          .filter((t) => t.createdAt && (t.completedAt || t.updatedAt || t.saleInfo?.paymentDate))
          .map((t) => {
            const endAt = t.completedAt || t.updatedAt || t.saleInfo?.paymentDate
            return Math.max(0, (new Date(endAt).getTime() - new Date(t.createdAt).getTime()) / 3600000)
          })
      )

      const repairsByStatus = [
        { name: 'En attente', value: repairs.filter((r) => r.status === 'pending').length, color: '#f59e0b' },
        { name: 'Assignée', value: repairs.filter((r) => r.status === 'assigned').length, color: '#3b82f6' },
        { name: 'En réparation', value: repairs.filter((r) => r.status === 'repairing').length, color: '#f97316' },
        { name: 'Terminée', value: repairs.filter((r) => r.status === 'completed' || r.status === 'paid').length, color: '#22c55e' },
      ]

      const tradeinsByStatus = [
        { name: 'En attente', value: tradeins.filter((t) => t.status === 'pending').length, color: '#f59e0b' },
        { name: 'Acceptée', value: tradeins.filter((t) => t.status === 'accepted').length, color: '#3b82f6' },
        { name: 'Terminée', value: tradeins.filter((t) => t.status === 'completed' || t.status === 'paid').length, color: '#22c55e' },
        { name: 'Refusée', value: tradeins.filter((t) => t.status === 'refused').length, color: '#ef4444' },
      ]

      const revenueByMonth = {}
      const repairByMonth = {}
      const tradeinByMonth = {}
      const phoneByMonth = {}

      paidRepairsList.forEach((r) => {
        if (!r.date) return
        const key = monthKey(r.date)
        revenueByMonth[key] = (revenueByMonth[key] || 0) + (r.amount || 0)
        repairByMonth[key] = (repairByMonth[key] || 0) + (r.amount || 0)
      })
      completedTradeinsList.forEach((t) => {
        if (!t.date) return
        const key = monthKey(t.date)
        revenueByMonth[key] = (revenueByMonth[key] || 0) + (t.amount || 0)
        tradeinByMonth[key] = (tradeinByMonth[key] || 0) + (t.amount || 0)
      })
      phoneSalesList.forEach((s) => {
        if (!s.date) return
        const key = monthKey(s.date)
        revenueByMonth[key] = (revenueByMonth[key] || 0) + (s.amount || 0)
        phoneByMonth[key] = (phoneByMonth[key] || 0) + (s.amount || 0)
      })

      const monthlyRevenue = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })).slice(-6)

      const monthRevenueBuckets = allTransactions.reduce((acc, tx) => {
        if (!tx.date) return acc
        const d = new Date(tx.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        acc[key] = (acc[key] || 0) + Number(tx.amount || 0)
        return acc
      }, {})
      const monthKeysSorted = Object.keys(monthRevenueBuckets).sort()
      const lastKey = monthKeysSorted[monthKeysSorted.length - 1]
      const prevKey = monthKeysSorted[monthKeysSorted.length - 2]
      const lastRevenue = lastKey ? monthRevenueBuckets[lastKey] : 0
      const prevRevenue = prevKey ? monthRevenueBuckets[prevKey] : 0
      const revenueGrowthVsPrevMonth = pctChange(lastRevenue, prevRevenue)

      const lastYearSameMonthDate = new Date(currentYear - 1, currentMonth, 1)
      const lastYearKey = `${lastYearSameMonthDate.getFullYear()}-${String(lastYearSameMonthDate.getMonth() + 1).padStart(2, '0')}`
      const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      const annualComparisonPct = pctChange(monthRevenueBuckets[currentMonthKey] || 0, monthRevenueBuckets[lastYearKey] || 0)

      const recentGrowth = monthKeysSorted.slice(-4).map((key, idx, arr) => {
        if (idx === 0) return 0
        return pctChange(monthRevenueBuckets[key] || 0, monthRevenueBuckets[arr[idx - 1]] || 0)
      }).slice(1)
      const avgRecentGrowth = avg(recentGrowth)
      const salesForecastNextMonth = lastRevenue * (1 + avgRecentGrowth / 100)

      const allMonths = [...new Set([...Object.keys(repairByMonth), ...Object.keys(tradeinByMonth), ...Object.keys(phoneByMonth)])].slice(-6)
      setSalesEvolution(allMonths.map((month) => ({ month, réparations: repairByMonth[month] || 0, échanges: tradeinByMonth[month] || 0, téléphones: phoneByMonth[month] || 0 })))

      const countByMonth = (rows) => Object.entries(rows.reduce((acc, item) => {
        if (!item.createdAt) return acc
        const key = monthKey(item.createdAt)
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})).map(([month, count]) => ({ month, count })).slice(-6)

      setRepairsEvolution(countByMonth(repairs))
      setTradeinsEvolution(countByMonth(tradeins))

      const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      const weeklyData = weekDays.map((day) => ({ day, réparations: 0, échanges: 0, ventes: 0 }))
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1)

      repairs.forEach((r) => {
        if (!r.createdAt) return
        const date = new Date(r.createdAt)
        if (date >= weekStart) weeklyData[(date.getDay() + 6) % 7].réparations += 1
      })
      tradeins.forEach((t) => {
        if (!t.createdAt) return
        const date = new Date(t.createdAt)
        if (date >= weekStart) weeklyData[(date.getDay() + 6) % 7].échanges += 1
      })
      phoneSalesList.forEach((s) => {
        if (!s.date) return
        const date = new Date(s.date)
        if (date >= weekStart) weeklyData[(date.getDay() + 6) % 7].ventes += 1
      })
      setWeeklyActivity(weeklyData)

      const vipRepairsByClientMap = vipRepairsList.reduce((acc, repair) => {
        const client = repair.vipClient
        const key = (typeof client === 'object' ? client?._id : client) || 'unknown'
        const name = typeof client === 'object' ? client?.name : 'Client VIP'
        if (!acc[key]) acc[key] = { clientName: name || 'Client VIP', repairsCount: 0, totalCost: 0 }
        acc[key].repairsCount += 1
        acc[key].totalCost += repair.cost || 0
        return acc
      }, {})

      const vipRepairsByClient = Object.values(vipRepairsByClientMap).sort((a, b) => b.repairsCount - a.repairsCount).slice(0, 5)

      const vipConversionRate = vipClientsList.length ? (vipClientsList.filter((v) => v.isActive !== false).length / vipClientsList.length) * 100 : 0
      const newVipByMonth = Object.entries(
        vipClientsList.reduce((acc, vip) => {
          if (!vip.createdAt) return acc
          const key = monthKey(vip.createdAt)
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})
      ).map(([month, count]) => ({ month, count })).slice(-6)

      const resellerPerformance = resellersList
        .map((seller) => {
          const sellerContracts = resellerContractsList.filter((c) => (typeof c.reseller === 'object' ? c.reseller?._id : c.reseller) === seller._id)
          const soldContracts = sellerContracts.filter((c) => c.status === 'sold')
          return {
            resellerName: seller.name || 'Revendeur',
            soldCount: soldContracts.length,
            activeCount: sellerContracts.filter((c) => c.status === 'active').length,
            generatedAmount: soldContracts.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0),
          }
        })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)

      setStats({
        totalRepairs: repairs.length,
        completedRepairsCount: repairs.filter((r) => r.status === 'completed' || r.status === 'paid').length,
        inProgressRepairs: repairs.filter((r) => ['repairing', 'assigned', 'diagnosing'].includes(r.status)).length,
        repairRevenue,
        tradeinRevenue,
        phoneSalesRevenue,
        totalRevenue,
        technicians: employeesList.filter((e) => e.role === 'technician').length,
        cashiers: employeesList.filter((e) => e.role === 'cashier').length,
        employees: employeesList.length,
        totalTradeins: tradeins.length,
        pendingTradeins: tradeins.filter((t) => t.status === 'pending').length,
        totalPhoneSales: phoneSalesList.length,
        activeResellers: resellersList.filter((r) => r.isActive !== false).length,
        soldContractsCount: resellerContractsList.filter((c) => c.status === 'sold').length,
        activeContractsCount: resellerContractsList.filter((c) => c.status === 'active').length,
        resellerSalesAmount: resellerContractsList.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0),
        totalVIPClients: vipClientsList.length,
        activeVIPClients: vipClientsList.filter((v) => v.isActive !== false).length,
        vipRepairsCount: vipRepairsList.length,
        vipInvoicesCount: vipInvoicesList.length,
        vipRevenue,
        vipRepairsByClient,
        resellerPerformance,
        avgBasketGlobal,
        avgBasketRepair,
        avgBasketTradein,
        avgBasketPhone,
        topModelsSold,
        topBrands,
        repairIssues,
        avgRepairTimeHours,
        repairTimeTrendPct,
        repairSuccessRate,
        technicianUtilizationRate,
        revenuePerTechnician: activeTechnicians ? totalRevenue / activeTechnicians : 0,
        revenuePerEmployee: employeesList.length ? totalRevenue / employeesList.length : 0,
        clientRecurrenceRate,
        vipConversionRate,
        vipAvgBasket,
        nonVipAvgBasket,
        newVipByMonth,
        exchangeAcceptanceRate,
        avgTradeinValue,
        avgTradeinProcessingHours,
        revenueGrowthVsPrevMonth,
        annualComparisonPct,
        salesForecastNextMonth,
        repairsByStatus,
        tradeinsByStatus,
        monthlyRevenue,
        recentRepairs: repairs.slice(0, 5),
        recentSales: allTransactions.slice(0, 5),
        recentTradeins: tradeins.slice(0, 5),
      })

      setProducts(productsList)
      setInventory(inventoryList)
      setEmployees(employeesList)
      setSales(allTransactions)
      setHistoryList(allTransactions)
      setInvoicesData(allTransactions)
    } catch (error) {
      setToast({ type: 'error', message: `Erreur lors du chargement: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }, [])

  const downloadInvoice = useCallback(async (item) => {
    try {
      const response = await downloadInvoicePdf(item.type, item._id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `facture_${item.type}_${item._id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Facture téléchargée' })
    } catch (error) {
      setToast({ type: 'error', message: 'Impossible de générer la facture' })
    }
  }, [])

  const kpis = useMemo(() => ({ pendingRepairsCount, pendingTradeinsCount }), [pendingRepairsCount, pendingTradeinsCount])

  return {
    loading,
    toast,
    setToast,
    fetchAllData,
    stats,
    products,
    inventory,
    employees,
    sales,
    historyList,
    invoicesData,
    salesEvolution,
    repairsEvolution,
    tradeinsEvolution,
    weeklyActivity,
    kpis,
    downloadInvoice,
  }
}
