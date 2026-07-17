import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCashierAuth } from '../../context/CashierAuthContext'
import { 
  Download, LogOut, ListChecks, Search,
  Calendar, DollarSign, CreditCard, TrendingUp,
  BarChart3, PieChart, Activity, X, ChevronDown,
  SlidersHorizontal, Clock, User,
  ArrowUpRight, FileText, Eye 
} from 'lucide-react'
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from 'recharts'
import api, { API_BASE_URL } from '../../services/api'
import Toast from '../../components/Toast'

export default function CashierReport() {
  const [repairs, setRepairs] = useState([])
  const [tradeins, setTradeins] = useState([])
  const [resellerContracts, setResellerContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [phoneSales, setPhoneSales] = useState([])
  const itemsPerPage = 8
  
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminView = location.pathname.startsWith('/admin/cashier')
  const basePath = isAdminView ? '/admin/cashier' : '/cashier'
  const { logout } = useCashierAuth()

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const repairsUrl = isAdminView ? '/api/admin/repairs' : '/api/cashier/repairs'
      const tradeinsUrl = isAdminView ? '/api/admin/tradeins' : '/api/cashier/tradeins'
      const salesUrl = isAdminView ? '/api/admin/sales' : '/api/cashier/sales'

      const [repairsResponse, tradeinsResponse, salesResponse, resellerContractsResponse] = await Promise.all([
        api.get(repairsUrl),
        api.get(tradeinsUrl).catch(() => ({ data: { data: [] } })),
        api.get(salesUrl).catch(() => ({ data: { data: [] } })),
        api.get(`${isAdminView ? '/api/admin' : '/api/cashier'}/reseller-contracts/pending-payment?status=paid`).catch(() => ({ data: { data: [] } }))
      ])

      const paidRepairs = repairsResponse.data.data?.filter(r => r.status === 'paid') || []
      const completedTradeins = tradeinsResponse.data.data?.filter(t => t.status === 'paid') || []
      const phoneSalesData = salesResponse.data?.data || salesResponse.data || []

      setRepairs(paidRepairs)
      setTradeins(completedTradeins)
      setPhoneSales(Array.isArray(phoneSalesData) ? phoneSalesData : [])
      setResellerContracts(Array.isArray(resellerContractsResponse.data?.data) ? resellerContractsResponse.data.data : [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const allTransactions = useMemo(() => [
    ...repairs.map(r => {
      const invoiceUrl = r.saleInfo?.invoiceUrl || r.invoiceUrl || null
      return {
        ...r,
        transactionType: 'repair',
        saleInfo: {
          ...(r.saleInfo || {}),
          amount: r.saleInfo?.amountPaid || r.price || 0,
          amountPaid: r.saleInfo?.amountPaid || r.price || 0,
          paymentMethod: r.saleInfo?.paymentMethod || 'cash',
          paymentDate: r.saleInfo?.paymentDate || r.updatedAt,
          notes: r.saleInfo?.notes || '',
          validatedBy: r.saleInfo?.validatedBy || 'Caissier',
          invoiceUrl: invoiceUrl
        }
      }
    }),
    
    ...tradeins.map(t => {
      const amount = t.saleInfo?.amountPaid || t.proposedValue || 0
      const invoiceUrl = t.saleInfo?.invoiceUrl || t.invoiceUrl || null
      return {
        ...t,
        transactionType: 'tradein',
        clientName: t.clientName || t.clientWhatsapp,
        saleInfo: {
          ...(t.saleInfo || {}),
          amount: amount,
          amountPaid: amount,
          paymentMethod: t.saleInfo?.paymentMethod || 'cash',
          paymentDate: t.saleInfo?.paymentDate || t.updatedAt,
          notes: t.saleInfo?.notes || '',
          validatedBy: t.saleInfo?.validatedBy || 'Caissier',
          invoiceUrl: invoiceUrl
        }
      }
    }),
    
    ...phoneSales.map(s => {
      const invoiceUrl = s.saleInfo?.invoiceUrl || s.invoiceUrl || null
      return {
        ...s,
        transactionType: 'phone',
        clientName: s.clientName || 'Client',
        clientWhatsapp: s.clientWhatsapp || '',
        saleInfo: {
          ...(s.saleInfo || {}),
          amount: s.saleInfo?.amountPaid || s.totalAmount || s.amount || 0,
          amountPaid: s.saleInfo?.amountPaid || s.totalAmount || s.amount || 0,
          paymentMethod: s.saleInfo?.paymentMethod || s.paymentMethod || 'cash',
          paymentDate: s.saleInfo?.paymentDate || s.createdAt || s.paymentDate || s.date,
          notes: s.saleInfo?.notes || s.notes || '',
          validatedBy: s.seller || s.validatedBy || 'Caissier',
          invoiceUrl: invoiceUrl
        }
      }
    }),

    ...resellerContracts.map(c => {
      const historyOverride = Array.isArray(c.history)
        ? [...c.history].reverse().find(h => h?.action === 'cash_collected_manager_override')
        : null

      return {
        ...c,
        transactionType: 'reseller_contract',
        clientName: c.reseller?.name || 'Revendeur',
        clientWhatsapp: c.reseller?.whatsapp || c.reseller?.phone || '',
        saleInfo: {
          ...(c.saleInfo || {}),
          amount: c.payment?.amountPaid || c.saleInfo?.amount || 0,
          amountPaid: c.payment?.amountPaid || c.saleInfo?.amount || 0,
          paymentMethod: c.payment?.paymentMethod || c.saleInfo?.paymentMethod || 'cash',
          paymentDate: c.payment?.paidAt || c.saleInfo?.collectedAt || c.updatedAt,
          notes: c.payment?.note || c.saleInfo?.notes || '',
          validatedBy: c.saleInfo?.collectedBy || c.payment?.paidByRole || 'Caissier',
          invoiceUrl: c.payment?.invoiceUrl || null,
          override: c.saleInfo?.override || (historyOverride
            ? {
                applied: true,
                reason: historyOverride?.data?.overrideReason || '',
                byRole: historyOverride?.data?.byRole || historyOverride?.byRole || c.payment?.paidByRole || '',
                at: historyOverride?.createdAt || c.payment?.paidAt || c.updatedAt
              }
            : { applied: false })
        }
      }
    })
  ], [repairs, tradeins, phoneSales, resellerContracts])

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(item => {
      const paymentDate = item.saleInfo?.paymentDate ? new Date(item.saleInfo.paymentDate) : null
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      const dateMatch = !paymentDate || (paymentDate >= start && paymentDate <= end)
      const methodMatch = paymentMethod === 'all' || item.saleInfo?.paymentMethod === paymentMethod
      const searchMatch = !searchTerm || 
        item.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientWhatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.saleInfo?.validatedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item._id?.toLowerCase().includes(searchTerm.toLowerCase())

      return dateMatch && methodMatch && searchMatch
    })
  }, [allTransactions, startDate, endDate, paymentMethod, searchTerm])

  const managerOverrides = useMemo(() => {
    return filteredTransactions
      .filter(item => item.transactionType === 'reseller_contract' && item.saleInfo?.override?.applied)
      .map(item => ({
        id: item._id,
        contractNumber: item.number || item.reference || '-',
        clientName: item.clientName || 'Revendeur',
        amount: item.saleInfo?.amountPaid || item.saleInfo?.amount || 0,
        paymentDate: item.saleInfo?.paymentDate,
        reason: item.saleInfo?.override?.reason || 'Non renseigné',
        authorizedBy: item.saleInfo?.validatedBy || item.saleInfo?.override?.byRole || 'Manager',
        authorizedRole: item.saleInfo?.override?.byRole || '-',
        invoiceUrl: item.saleInfo?.invoiceUrl || null
      }))
      .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0))
  }, [filteredTransactions])

  const stats = useMemo(() => {
    const totalAmount = filteredTransactions.reduce((sum, item) => 
      sum + (item.saleInfo?.amountPaid || item.saleInfo?.amount || item.price || 0), 0)
    const totalTransactions = filteredTransactions.length
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0
    const repairCount = filteredTransactions.filter(t => t.transactionType === 'repair').length
    const tradeinCount = filteredTransactions.filter(t => t.transactionType === 'tradein').length
    const phoneSalesCount = filteredTransactions.filter(t => t.transactionType === 'phone').length
    const resellerContractCount = filteredTransactions.filter(t => t.transactionType === 'reseller_contract').length

    return { totalAmount, totalTransactions, averageAmount, repairCount, tradeinCount, phoneSalesCount, resellerContractCount }
  }, [filteredTransactions])

  const paymentMethods = useMemo(() => {
    const methods = {}
    filteredTransactions.forEach(item => {
      const method = item.saleInfo?.paymentMethod || 'unknown'
      methods[method] = (methods[method] || 0) + (item.saleInfo?.amountPaid || item.saleInfo?.amount || item.price || 0)
    })
    return methods
  }, [filteredTransactions])

  const paymentMethodChartData = useMemo(() => {
    const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']
    return Object.entries(paymentMethods).map(([method, amount], index) => ({
      name: method === 'cash' ? 'Espèces' : method === 'card' ? 'Carte' : method === 'mobile_money' ? 'Paiement mobile' : method === 'check' ? 'Chèque' : method === 'transfer' ? 'Virement' : 'Autre',
      amount,
      color: COLORS[index % COLORS.length]
    }))
  }, [paymentMethods])

  const dailyRevenue = useMemo(() => {
    const daily = {}
    filteredTransactions.forEach(item => {
      const date = item.saleInfo?.paymentDate 
        ? new Date(item.saleInfo.paymentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : null
      if (date) {
        daily[date] = (daily[date] || 0) + (item.saleInfo?.amountPaid || item.saleInfo?.amount || item.price || 0)
      }
    })
    return Object.entries(daily).map(([date, amount]) => ({ date, amount })).slice(-7)
  }, [filteredTransactions])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getPaymentMethodConfig = (method) => {
    const configs = {
      cash: { label: 'Espèces', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      card: { label: 'Carte', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      check: { label: 'Chèque', icon: FileText, color: 'text-amber-600', bgColor: 'bg-amber-50' },
      transfer: { label: 'Virement', icon: ArrowUpRight, color: 'text-purple-600', bgColor: 'bg-purple-50' },
      mobile_money: { label: 'Paiement mobile', icon: CreditCard, color: 'text-orange-600', bgColor: 'bg-orange-50' }
    }
    return configs[method] || { label: 'Autre', icon: DollarSign, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  }

  const getPaymentMethodLabel = (method) => {
    if (method === 'cash') return 'Espèces'
    if (method === 'card') return 'Carte'
    if (method === 'mobile_money') return 'Monnaie mobile'
    if (method === 'check') return 'Chèque'
    if (method === 'transfer') return 'Virement'
    return method || '-'
  }

  const openInvoice = async (item) => {
    if (!item?._id || !item?.transactionType) {
      setToast({ type: 'error', message: 'Aucune facture disponible pour cette transaction' })
      return
    }

    const endpoint =
      item.transactionType === 'repair' ? `/api/invoices/repairs/${item._id}` :
      item.transactionType === 'tradein' ? `/api/invoices/tradeins/${item._id}` :
      item.transactionType === 'phone' ? `/api/invoices/sales/${item._id}` :
      item.transactionType === 'reseller_contract' ? `/api/invoices/contracts/${item._id}` :
      ''

    if (!endpoint) {
      setToast({ type: 'error', message: 'Aucune facture disponible pour cette transaction' })
      return
    }

    try {
      const response = await api.get(endpoint, { responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Impossible d’ouvrir la facture' })
    }
  }

  const exportReport = () => {
    let csv = 'Date,Type,Client,WhatsApp,Transaction ID,Montant,Méthode,Validé par,Override manager,Motif override,Facture,Notes\n'
    filteredTransactions.forEach(item => {
      const date = item.saleInfo?.paymentDate ? new Date(item.saleInfo.paymentDate).toLocaleDateString('fr-FR') : '-'
      const amount = item.saleInfo?.amountPaid || item.saleInfo?.amount || item.price || 0
      const method = getPaymentMethodLabel(item.saleInfo?.paymentMethod)
      const validatedBy = item.saleInfo?.validatedBy || '-' 
      const notes = item.saleInfo?.notes?.replace(/"/g, '""') || ''
      const isOverride = item.transactionType === 'reseller_contract' && item.saleInfo?.override?.applied
      const overrideLabel = isOverride ? 'Oui' : 'Non'
      const overrideReason = isOverride ? (item.saleInfo?.override?.reason || '').replace(/"/g, '""') : ''
      const type = item.transactionType === 'tradein' ? 'Échange' : 
           item.transactionType === 'phone' ? 'Téléphone' :
           item.transactionType === 'reseller_contract' ? 'Contrat revendeur' : 'Réparation'
      const hasInvoice = item.saleInfo?.invoiceUrl ? 'Oui' : 'Non'
      const transactionId = item._id || item.reference || '-'
      
      csv += `"${date}","${type}","${item.clientName || '-'}","${item.clientWhatsapp || '-'}","${transactionId}","${amount}","${method}","${validatedBy}","${overrideLabel}","${overrideReason}","${hasInvoice}","${notes}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport-caisse-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    setToast({ type: 'success', message: 'Rapport exporté avec succès' })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPaymentMethod('all')
  }

  const hasActiveFilters = searchTerm || paymentMethod !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-emerald-600"></div>
            <BarChart3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total des ventes', value: `${stats.totalAmount.toLocaleString('fr-FR')} FCFA`, icon: DollarSign, gradient: 'from-emerald-500 to-green-500', trend: '+12%' },
            { label: 'Transactions', value: stats.totalTransactions, icon: Activity, gradient: 'from-blue-500 to-cyan-500', subtitle: `${stats.repairCount} réparations • ${stats.tradeinCount} échanges • ${stats.phoneSalesCount} ventes • ${stats.resellerContractCount} contrats` },
            { label: 'Panier moyen', value: `${Math.round(stats.averageAmount).toLocaleString('fr-FR')} FCFA`, icon: TrendingUp, gradient: 'from-purple-500 to-violet-500' },
            { label: 'Méthodes', value: Object.keys(paymentMethods).length, icon: CreditCard, gradient: 'from-amber-500 to-orange-500', subtitle: 'types de paiement' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && <p className="text-xs text-gray-400">{stat.subtitle}</p>}
                    {stat.trend && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <ArrowUpRight size={14} />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.gradient} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart size={20} className="text-emerald-600" />
              Répartition par méthode
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={paymentMethodChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {paymentMethodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} FCFA`} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Évolution journalière (7 jours)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} FCFA`} />
                  <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par client, téléphone, caissier, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl transition-all duration-200 ${
                  isFilterExpanded 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={18} />
                Filtres
                {hasActiveFilters && <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>}
                <ChevronDown size={16} className={`transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isFilterExpanded && (
              <div className="pt-4 border-t border-gray-100 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date fin</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Méthode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">Toutes les méthodes</option>
                      <option value="cash">Espèces</option>
                      <option value="card">Carte bancaire</option>
                      <option value="check">Chèque</option>
                      <option value="transfer">Virement</option>
                      <option value="mobile_money">Paiement mobile</option>
                    </select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tableau des transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Détail des transactions</h2>
              <p className="text-sm text-gray-500">{filteredTransactions.length} transaction(s)</p>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Validé par</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedTransactions.map((item) => {
                  const methodConfig = getPaymentMethodConfig(item.saleInfo?.paymentMethod)
                  const MethodIcon = methodConfig.icon
                  const hasInvoice = !!item.saleInfo?.invoiceUrl
                  
                  return (
                    <tr key={item._id || Math.random()} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {item.saleInfo?.paymentDate
                              ? new Date(item.saleInfo.paymentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                          item.transactionType === 'repair' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : item.transactionType === 'tradein'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : item.transactionType === 'reseller_contract'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.transactionType === 'repair' ? '🔧 Réparation' : 
                           item.transactionType === 'tradein' ? '🔄 Échange' :
                           item.transactionType === 'reseller_contract' ? '🤝 Contrat' : '📱 Vente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {item.clientName || '-'}
                          </span>
                          {item.clientWhatsapp && (
                            <span className="text-xs text-gray-400">{item.clientWhatsapp}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600">
                          {(item.saleInfo?.amountPaid || item.saleInfo?.amount || item.price || 0).toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${methodConfig.bgColor} ${methodConfig.color} border-current/20`}>
                          <MethodIcon size={12} />
                          {methodConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.saleInfo?.validatedBy || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasInvoice ? (
                          <button
                            onClick={() => openInvoice(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium border border-emerald-200"
                          >
                            <Eye size={14} />
                            Voir
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredTransactions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-white hover:shadow-sm"
                >
                  ←
                </button>
                <span className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-white hover:shadow-sm"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section dédiée: override manager */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/60">
            <div>
              <h2 className="text-lg font-bold text-amber-900">Encaissements en override manager</h2>
              <p className="text-sm text-amber-700">{managerOverrides.length} opération(s) avec dérogation après délai</p>
            </div>
          </div>

          {managerOverrides.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500">Aucun encaissement en override manager sur la période et les filtres sélectionnés.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50/40">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Contrat</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Revendeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Motif</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">Autorisé par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {managerOverrides.map((entry) => (
                    <tr key={`override-${entry.id}`} className="hover:bg-amber-50/20">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.paymentDate
                          ? new Date(entry.paymentDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.contractNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.clientName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-amber-700">{entry.amount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xl">{entry.reason}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span>{entry.authorizedBy}</span>
                          <span className="text-xs text-gray-500">Rôle: {entry.authorizedRole}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}