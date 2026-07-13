import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, RadialBarChart, RadialBar 
} from 'recharts'
import { 
  Wrench, RefreshCw, DollarSign, Users, Smartphone, Package, 
  ShoppingCart, History, FileText, Activity, Grid, AlertCircle,
  ChevronLeft, ChevronRight, Eye, LogOut, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, Zap, Star, Target, Award,
  ArrowUpRight, ArrowDownRight, BarChart3, PieChartIcon,
  Filter, Download, Calendar, Search, MoreVertical, Home,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Toast from '../components/Toast'
import { exportCsv } from '../utils/exportCsv'

export default function Dashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeMainTab, setActiveMainTab] = useState('dashboard')
  const [activeSubTab, setActiveSubTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const [stats, setStats] = useState({
    totalRepairs: 0, completedRepairsCount: 0, inProgressRepairs: 0,
    repairRevenue: 0, tradeinRevenue: 0, phoneSalesRevenue: 0, totalRevenue: 0,
    technicians: 0, cashiers: 0, employees: 0,
    totalTradeins: 0, pendingTradeins: 0, totalPhoneSales: 0,
    activeResellers: 0, soldContractsCount: 0, activeContractsCount: 0, resellerSalesAmount: 0,
    totalVIPClients: 0, activeVIPClients: 0, vipRepairsCount: 0, vipInvoicesCount: 0, vipRevenue: 0,
    vipRepairsByClient: [], resellerPerformance: [],
    repairsByStatus: [], tradeinsByStatus: [], monthlyRevenue: [],
    recentRepairs: [], recentSales: [], recentTradeins: [], recentPhoneSales: []
  })

  // Données pour les graphiques d'évolution
  const [salesEvolution, setSalesEvolution] = useState([])
  const [repairsEvolution, setRepairsEvolution] = useState([])
  const [tradeinsEvolution, setTradeinsEvolution] = useState([])
  const [weeklyActivity, setWeeklyActivity] = useState([])

  // Compteurs pour les badges
  const [pendingRepairsCount, setPendingRepairsCount] = useState(0)
  const [pendingTradeinsCount, setPendingTradeinsCount] = useState(0)

  const [invoicesData, setInvoicesData] = useState([])
  const [invoiceFilters, setInvoiceFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  })
  
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [employees, setEmployees] = useState([])
  const [sales, setSales] = useState([])
  const [historyList, setHistoryList] = useState([])
  
  const [currentPage, setCurrentPage] = useState({
    products: 1,
    inventory: 1,
    employees: 1,
    sales: 1,
    invoices: 1,
    history: 1
  })
  const itemsPerPage = 10

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
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
        vipInvoicesRes
      ] = await Promise.all([
        api.get('/api/admin/repairs'),
        api.get('/api/admin/employees'),
        api.get('/api/admin/tradeins'),
        api.get('/api/admin/products'),
        api.get('/api/admin/inventory'),
        api.get('/api/admin/sales'),
        api.get('/api/admin/resellers').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/resellers/contracts/all').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/vips').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/vips/repairs').catch(() => ({ data: { data: [] } })),
        api.get('/api/admin/vips/invoices').catch(() => ({ data: { data: [] } }))
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

      // Compter les réparations et échanges en attente
      setPendingRepairsCount(repairs.filter(r => r.status === 'pending').length)
      setPendingTradeinsCount(tradeins.filter(t => t.status === 'pending').length)

      // 1. Réparations payées
      const paidRepairsList = repairs
        .filter(r => r.status === 'paid')
        .map(r => ({
          _id: r._id,
          type: 'repair',
          clientName: r.clientName || 'Client',
          productName: r.deviceModel || 'Appareil',
          amount: r.saleInfo?.amountPaid || r.price || 0,
          date: r.saleInfo?.paymentDate || r.completedAt || r.updatedAt,
          status: r.status
        }))

      // 2. Échanges complétés
      const completedTradeinsList = tradeins
        .filter(t => t.status === 'completed' || t.status === 'paid')
        .map(t => ({
          _id: t._id,
          type: 'tradein',
          clientName: t.clientName || 'Client',
          productName: t.deviceModel || 'Appareil',
          amount: t.saleInfo?.amount || t.proposedValue || 0,
          date: t.saleInfo?.paymentDate || t.completedAt || t.updatedAt,
          status: t.status
        }))

      // 3. Ventes de téléphones
      const phoneSalesList = phoneSalesRaw
        .filter(s => s.type === 'product' || s.type === 'phone')
        .map(s => ({
          _id: s._id,
          type: 'phone',
          clientName: s.clientName || 'Client',
          productName: s.productName || 'Téléphone',
          amount: s.totalAmount || s.amount || s.saleInfo?.amount || 0,
          date: s.paymentDate || s.createdAt || s.saleInfo?.paymentDate || new Date(),
          status: s.status || 'completed'
        }))

      // 4. Toutes les transactions
      const allTransactions = [...paidRepairsList, ...completedTradeinsList, ...phoneSalesList]
      
      allTransactions.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0)
        const dateB = b.date ? new Date(b.date) : new Date(0)
        return dateB - dateA
      })

      // Calculs des revenus
      const repairRevenue = paidRepairsList.reduce((sum, r) => sum + (r.amount || 0), 0)
      const tradeinRevenue = completedTradeinsList.reduce((sum, t) => sum + (t.amount || 0), 0)
      const phoneSalesRevenue = phoneSalesList.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalRevenue = repairRevenue + tradeinRevenue + phoneSalesRevenue

      // Statistiques par statut
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

      const tradeinCounts = {
        pending: tradeins.filter(t => t.status === 'pending').length,
        accepted: tradeins.filter(t => t.status === 'accepted').length,
        completed: tradeins.filter(t => t.status === 'completed' || t.status === 'paid').length,
        refused: tradeins.filter(t => t.status === 'refused').length,
      }
      
      const tradeinsByStatus = Object.entries(tradeinCounts).map(([name, value]) => ({
        name: name === 'pending' ? 'En attente': name === 'paid' ? 'payé'  : name === 'accepted' ? 'Acceptée' : name === 'completed' ? 'Terminée' : 'Refusée',
        value,
        color: name === 'pending' ? '#f59e0b' : name === 'accepted' ? '#3b82f6' : name === 'completed' ? '#22c55e' : name === 'paid' ? '#22c55e': '#ef4444'
      }))

      // Revenus mensuels et évolutions
      const monthlyData = {}
      const repairMonthlyData = {}
      const tradeinMonthlyData = {}
      const phoneMonthlyData = {}
      
      paidRepairsList.forEach(r => {
        if (r.date) {
          const month = new Date(r.date).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          monthlyData[month] = (monthlyData[month] || 0) + (r.amount || 0)
          repairMonthlyData[month] = (repairMonthlyData[month] || 0) + (r.amount || 0)
        }
      })
      
      completedTradeinsList.forEach(t => {
        if (t.date) {
          const month = new Date(t.date).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          monthlyData[month] = (monthlyData[month] || 0) + (t.amount || 0)
          tradeinMonthlyData[month] = (tradeinMonthlyData[month] || 0) + (t.amount || 0)
        }
      })
      
      phoneSalesList.forEach(s => {
        if (s.date) {
          const month = new Date(s.date).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          monthlyData[month] = (monthlyData[month] || 0) + (s.amount || 0)
          phoneMonthlyData[month] = (phoneMonthlyData[month] || 0) + (s.amount || 0)
        }
      })
      
      const monthlyRevenue = Object.entries(monthlyData)
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-6)

      // Données pour le graphique d'évolution des ventes
      const allMonths = [...new Set([
        ...Object.keys(repairMonthlyData),
        ...Object.keys(tradeinMonthlyData),
        ...Object.keys(phoneMonthlyData)
      ])].slice(-6)

      const evolutionData = allMonths.map(month => ({
        month,
        réparations: repairMonthlyData[month] || 0,
        échanges: tradeinMonthlyData[month] || 0,
        téléphones: phoneMonthlyData[month] || 0
      }))

      setSalesEvolution(evolutionData)

      // Données pour l'évolution des réparations (nombre)
      const repairsCountByMonth = {}
      repairs.forEach(r => {
        if (r.createdAt) {
          const month = new Date(r.createdAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          repairsCountByMonth[month] = (repairsCountByMonth[month] || 0) + 1
        }
      })
      
      const repairsEvolutionData = Object.entries(repairsCountByMonth)
        .map(([month, count]) => ({ month, count }))
        .slice(-6)
      setRepairsEvolution(repairsEvolutionData)

      // Données pour l'évolution des échanges (nombre)
      const tradeinsCountByMonth = {}
      tradeins.forEach(t => {
        if (t.createdAt) {
          const month = new Date(t.createdAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          tradeinsCountByMonth[month] = (tradeinsCountByMonth[month] || 0) + 1
        }
      })
      
      const tradeinsEvolutionData = Object.entries(tradeinsCountByMonth)
        .map(([month, count]) => ({ month, count }))
        .slice(-6)
      setTradeinsEvolution(tradeinsEvolutionData)

      // Données pour l'activité hebdomadaire
      const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      const weeklyData = weekDays.map(day => ({ day, réparations: 0, échanges: 0, ventes: 0 }))
      
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1)
      
      repairs.forEach(r => {
        if (r.createdAt) {
          const date = new Date(r.createdAt)
          if (date >= weekStart) {
            const dayIndex = (date.getDay() + 6) % 7
            if (weeklyData[dayIndex]) {
              weeklyData[dayIndex].réparations++
            }
          }
        }
      })
      
      tradeins.forEach(t => {
        if (t.createdAt) {
          const date = new Date(t.createdAt)
          if (date >= weekStart) {
            const dayIndex = (date.getDay() + 6) % 7
            if (weeklyData[dayIndex]) {
              weeklyData[dayIndex].échanges++
            }
          }
        }
      })
      
      phoneSalesList.forEach(s => {
        if (s.date) {
          const date = new Date(s.date)
          if (date >= weekStart) {
            const dayIndex = (date.getDay() + 6) % 7
            if (weeklyData[dayIndex]) {
              weeklyData[dayIndex].ventes++
            }
          }
        }
      })
      
      setWeeklyActivity(weeklyData)

      const vipRepairsByClientMap = vipRepairsList.reduce((acc, repair) => {
        const client = repair.vipClient
        const clientId = typeof client === 'object' ? client?._id : client
        const clientName = typeof client === 'object' ? client?.name : 'Client VIP'
        const key = clientId || 'unknown'

        if (!acc[key]) {
          acc[key] = { clientName: clientName || 'Client VIP', repairsCount: 0, totalCost: 0 }
        }

        acc[key].repairsCount += 1
        acc[key].totalCost += repair.cost || 0
        return acc
      }, {})

      const vipRepairsByClient = Object.values(vipRepairsByClientMap)
        .sort((a, b) => b.repairsCount - a.repairsCount)
        .slice(0, 5)

      const resellerPerformance = resellersList
        .map((seller) => {
          const sellerContracts = resellerContractsList.filter(c => {
            const resellerId = typeof c.reseller === 'object' ? c.reseller?._id : c.reseller
            return resellerId === seller._id
          })
          const soldContracts = sellerContracts.filter(c => c.status === 'sold')

          return {
            resellerName: seller.name || 'Revendeur',
            soldCount: soldContracts.length,
            activeCount: sellerContracts.filter(c => c.status === 'active').length,
            generatedAmount: soldContracts.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0)
          }
        })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5)

      setStats({
        totalRepairs: repairs.length,
        completedRepairsCount: repairs.filter(r => r.status === 'completed' || r.status === 'paid').length,
        inProgressRepairs: repairs.filter(r => ['repairing', 'assigned', 'diagnosing'].includes(r.status)).length,
        repairRevenue,
        tradeinRevenue,
        phoneSalesRevenue,
        totalRevenue,
        technicians: employeesList.filter(e => e.role === 'technician').length,
        cashiers: employeesList.filter(e => e.role === 'cashier').length,
        employees: employeesList.length,
        totalTradeins: tradeins.length,
        pendingTradeins: tradeins.filter(t => t.status === 'pending').length,
        totalPhoneSales: phoneSalesList.length,
        activeResellers: resellersList.filter(r => r.isActive !== false).length,
        soldContractsCount: resellerContractsList.filter(c => c.status === 'sold').length,
        activeContractsCount: resellerContractsList.filter(c => c.status === 'active').length,
        resellerSalesAmount: resellerContractsList.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0),
        totalVIPClients: vipClientsList.length,
        activeVIPClients: vipClientsList.filter(v => v.isActive !== false).length,
        vipRepairsCount: vipRepairsList.length,
        vipInvoicesCount: vipInvoicesList.length,
        vipRevenue: vipInvoicesList.reduce((sum, inv) => sum + (inv.total || 0), 0),
        vipRepairsByClient,
        resellerPerformance,
        repairsByStatus,
        tradeinsByStatus,
        monthlyRevenue,
        recentRepairs: repairs.slice(0, 5),
        recentSales: allTransactions.slice(0, 5),
        recentTradeins: tradeins.slice(0, 5),
        recentPhoneSales: phoneSalesList.slice(0, 5)
      })

      setProducts(productsList)
      setInventory(inventoryList)
      setEmployees(employeesList)
      setSales(allTransactions)
      setHistoryList(allTransactions)
      setInvoicesData(allTransactions)

    } catch (error) {
      console.error('Erreur détaillée:', error)
      setToast({ type: 'error', message: 'Erreur lors du chargement: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredInvoices = () => {
    let filtered = [...invoicesData]
    if (invoiceFilters.type !== 'all') {
      filtered = filtered.filter(item => item.type === invoiceFilters.type)
    }
    if (invoiceFilters.startDate) {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(invoiceFilters.startDate))
    }
    if (invoiceFilters.endDate) {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(invoiceFilters.endDate))
    }
    return filtered
  }

  const getStatusBadge = (status, type = 'repair') => {
    if (type === 'phone') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    const badges = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      accepted: 'bg-blue-50 text-blue-700 border-blue-200',
      refused: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      paid: 'bg-green-50 text-green-700 border-green-200',
      assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      repairing: 'bg-orange-50 text-orange-700 border-orange-200',
      ready: 'bg-teal-50 text-teal-700 border-teal-200'
    }
    return badges[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'En attente', accepted: 'Accepté', refused: 'Refusé',
      completed: 'Terminé', paid: 'Payé', assigned: 'Assignée',
      repairing: 'En réparation', ready: 'Prête'
    }
    return texts[status] || status
  }

const handleLogout = () => {
  // Supprimer directement les tokens admin
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('active_role')
  
  // Appeler la fonction logout du contexte
  logout()
  
  // Rediriger vers la page de connexion
  navigate('/admin/login')
  
  // Afficher un toast de confirmation
  setToast({ type: 'success', message: 'Déconnexion réussie' })
}
  const downloadInvoice = async (item) => {
    try {
      let endpoint = ''
      if (item.type === 'phone') {
        endpoint = `/api/admin/sales/${item._id}/invoice`
      } else if (item.type === 'repair') {
        endpoint = `/api/admin/repairs/${item._id}/invoice`
      } else if (item.type === 'tradein') {
        endpoint = `/api/admin/tradeins/${item._id}/invoice`
      }
      
      const response = await api.get(endpoint, { responseType: 'blob' })
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
      console.error('Erreur téléchargement facture:', error)
      setToast({ type: 'error', message: 'Impossible de générer la facture' })
    }
  }

  const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
          {' - '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
          {' sur '}
          <span className="font-medium">{totalItems}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'}`}
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && <span className="text-gray-400">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
          <button 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value} FCFA
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform duration-200`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )

  const renderTable = (data, columns, pageKey) => {
    const startIndex = (currentPage[pageKey] - 1) * itemsPerPage
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage)
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((item, idx) => (
              <tr key={item._id || idx} className="hover:bg-gray-50/50 transition-colors duration-150">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <BarChart3 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  const subTabs = {
    dashboard: [
      { id: 'overview', label: 'Vue d\'ensemble', icon: Grid, badge: null },
      { id: 'repairs', label: 'Réparations', icon: Wrench, badge: pendingRepairsCount > 0 ? pendingRepairsCount : null },
      { id: 'tradeins', label: 'Échanges', icon: RefreshCw, badge: pendingTradeinsCount > 0 ? pendingTradeinsCount : null },
      { id: 'analytics', label: 'Analyses', icon: TrendingUp, badge: null }
    ]
  }

  const exportVipResellerStatsCsv = () => {
    const rows = [
      { Bloc: 'KPI VIP', Indicateur: 'Clients VIP total', Valeur: stats.totalVIPClients },
      { Bloc: 'KPI VIP', Indicateur: 'Clients VIP actifs', Valeur: stats.activeVIPClients },
      { Bloc: 'KPI VIP', Indicateur: 'Reparations VIP', Valeur: stats.vipRepairsCount },
      { Bloc: 'KPI VIP', Indicateur: 'Factures VIP', Valeur: stats.vipInvoicesCount },
      { Bloc: 'KPI VIP', Indicateur: 'CA VIP (FCFA)', Valeur: stats.vipRevenue },
      { Bloc: 'KPI Revendeur', Indicateur: 'Revendeurs actifs', Valeur: stats.activeResellers },
      { Bloc: 'KPI Revendeur', Indicateur: 'Contrats vendus', Valeur: stats.soldContractsCount },
      { Bloc: 'KPI Revendeur', Indicateur: 'Contrats actifs', Valeur: stats.activeContractsCount },
      { Bloc: 'KPI Revendeur', Indicateur: 'CA Revendeur (FCFA)', Valeur: stats.resellerSalesAmount },
      ...stats.vipRepairsByClient.map((item, idx) => ({
        Bloc: 'Top VIP',
        Indicateur: `Top VIP #${idx + 1} - ${item.clientName}`,
        Valeur: `${item.repairsCount} reparations | ${(item.totalCost || 0).toLocaleString('fr-FR')} FCFA`
      })),
      ...stats.resellerPerformance.map((item, idx) => ({
        Bloc: 'Top Revendeur',
        Indicateur: `Top Revendeur #${idx + 1} - ${item.resellerName}`,
        Valeur: `${item.soldCount} vendus | ${item.activeCount} actifs | ${(item.generatedAmount || 0).toLocaleString('fr-FR')} FCFA`
      }))
    ]

    if (!rows.length) {
      setToast({ type: 'error', message: 'Aucune statistique VIP/revendeur a exporter.' })
      return
    }

    exportCsv(rows, 'stats_vip_revendeurs_dashboard')
    setToast({ type: 'success', message: 'Export CSV des statistiques VIP/revendeurs genere.' })
  }

  const productColumns = [
    { header: 'Produit', render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
    { header: 'Marque', render: (p) => p.brand || '-' },
    { header: 'Prix', render: (p) => <span className="font-semibold text-emerald-600">{p.price?.toLocaleString('fr-FR')} FCFA</span> },
    { header: 'Stock', render: (p) => p.stock },
    { header: 'Statut', render: (p) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {p.stock > 0 ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {p.stock > 0 ? 'En stock' : 'Rupture'}
      </span>
    )}
  ]

  const inventoryColumns = [
    { header: 'Article', render: (i) => <span className="font-medium text-gray-900">{i.name}</span> },
    { header: 'Catégorie', render: (i) => i.category || '-' },
    { header: 'Quantité', render: (i) => i.quantity },
    { header: 'Prix', render: (i) => <span className="font-semibold text-emerald-600">{i.unitPrice?.toLocaleString('fr-FR')} FCFA</span> },
    { header: 'Statut', render: (i) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        i.quantity > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : i.quantity > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
      }`}>
        {i.quantity > 10 ? <CheckCircle size={12} /> : i.quantity > 0 ? <AlertCircle size={12} /> : <XCircle size={12} />}
        {i.quantity > 10 ? 'Stock ok' : i.quantity > 0 ? 'Stock faible' : 'Rupture'}
      </span>
    )}
  ]

  const employeeColumns = [
    { header: 'Nom', render: (e) => <span className="font-medium text-gray-900">{e.name}</span> },
    { header: 'Email', render: (e) => e.email },
    { header: 'Rôle', render: (e) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        e.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : e.role === 'technician' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}>
        {e.role === 'admin' ? 'Admin' : e.role === 'technician' ? 'Technicien' : 'Caissier'}
      </span>
    )},
    { header: 'Téléphone', render: (e) => e.phone || '-' },
    { header: 'Statut', render: (e) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${e.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {e.isActive !== false ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {e.isActive !== false ? 'Actif' : 'Inactif'}
      </span>
    )}
  ]

  const transactionColumns = [
    { header: 'Type', render: (s) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        s.type === 'phone' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 
        s.type === 'repair' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
        'bg-purple-50 text-purple-700 border-purple-200'
      }`}>
        {s.type === 'phone' ? <Smartphone size={12} /> : s.type === 'repair' ? <Wrench size={12} /> : <RefreshCw size={12} />}
        {s.type === 'phone' ? 'Téléphone' : s.type === 'repair' ? 'Réparation' : 'Échange'}
      </span>
    )},
    { header: 'Client', render: (s) => s.clientName || '-' },
    { header: 'Produit/Appareil', render: (s) => s.productName || s.deviceModel || '-' },
    { header: 'Montant', render: (s) => <span className="font-semibold text-emerald-600">{(s.amount || 0).toLocaleString('fr-FR')} FCFA</span> },
    { header: 'Date', render: (s) => new Date(s.date).toLocaleDateString('fr-FR') }
  ]

  const invoiceColumns = [
    { header: 'Type', render: (s) => (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        s.type === 'phone' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 
        s.type === 'repair' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
        'bg-purple-50 text-purple-700 border-purple-200'
      }`}>
        {s.type === 'phone' ? <Smartphone size={12} /> : s.type === 'repair' ? <Wrench size={12} /> : <RefreshCw size={12} />}
        {s.type === 'phone' ? 'Téléphone' : s.type === 'repair' ? 'Réparation' : 'Échange'}
      </span>
    )},
    { header: 'Client', render: (s) => s.clientName || '-' },
    { header: 'Produit/Appareil', render: (s) => s.productName || s.deviceModel || '-' },
    { header: 'Montant', render: (s) => <span className="font-semibold text-emerald-600">{(s.amount || 0).toLocaleString('fr-FR')} FCFA</span> },
    { header: 'Date', render: (s) => new Date(s.date).toLocaleDateString('fr-FR') },
    { header: 'Facture', render: (s) => (
      <button
        onClick={() => downloadInvoice(s)}
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
      >
        <FileText size={14} />
        PDF
      </button>
    )}
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6">
        {/* Onglets principaux avec badges */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <nav className="flex gap-1 px-2 overflow-x-auto scrollbar-hide">
            {/* Onglet Tableau de bord */}
            <button
              onClick={() => {
                setActiveMainTab('dashboard')
                setActiveSubTab('overview')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'dashboard'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Home size={18} />
              Tableau de bord
            </button>

            {/* Onglet Réparations avec badge */}
            <button
              onClick={() => {
                setActiveMainTab('repairs')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'repairs'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Wrench size={18} />
              Réparations
              {pendingRepairsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white animate-pulse">
                  {pendingRepairsCount}
                </span>
              )}
            </button>

            {/* Onglet Échanges avec badge */}
            <button
              onClick={() => {
                setActiveMainTab('tradeins')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'tradeins'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw size={18} />
              Échanges
              {pendingTradeinsCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white animate-pulse">
                  {pendingTradeinsCount}
                </span>
              )}
            </button>

            {/* Onglet Produits */}
            <button
              onClick={() => {
                setActiveMainTab('products')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'products'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Smartphone size={18} />
              Produits
            </button>

            {/* Onglet Inventaire */}
            <button
              onClick={() => {
                setActiveMainTab('inventory')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'inventory'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Package size={18} />
              Inventaire
            </button>

            {/* Onglet Employés */}
            <button
              onClick={() => {
                setActiveMainTab('employees')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'employees'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              Employés
            </button>

            {/* Onglet Ventes */}
            <button
              onClick={() => {
                setActiveMainTab('sales')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'sales'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ShoppingCart size={18} />
              Ventes
            </button>

            {/* Onglet Factures */}
            <button
              onClick={() => {
                setActiveMainTab('invoices')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'invoices'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              Factures
            </button>

            {/* Onglet Historique */}
            <button
              onClick={() => {
                setActiveMainTab('history')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'history'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <History size={18} />
              Historique
            </button>

            {/* Onglet Rapports */}
            <button
              onClick={() => {
                setActiveMainTab('reports')
                setActiveSubTab('list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeMainTab === 'reports'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={18} />
              Rapports
            </button>
          </nav>
        </div>

        {/* Réparations - Onglet principal */}
        {activeMainTab === 'repairs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestion des réparations</h2>
                  <p className="text-sm text-gray-500 mt-1">Liste complète des demandes de réparation</p>
                </div>
                {pendingRepairsCount > 0 && (
                  <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Clock size={14} />
                    {pendingRepairsCount} en attente
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 text-center">
              <button
                onClick={() => navigate('/admin/repairs')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Voir toutes les réparations
              </button>
            </div>
          </div>
        )}

        {/* Échanges - Onglet principal */}
        {activeMainTab === 'tradeins' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestion des échanges</h2>
                  <p className="text-sm text-gray-500 mt-1">Liste complète des demandes d'échange</p>
                </div>
                {pendingTradeinsCount > 0 && (
                  <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Clock size={14} />
                    {pendingTradeinsCount} en attente
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 text-center">
              <button
                onClick={() => navigate('/admin/tradeins')}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Voir tous les échanges
              </button>
            </div>
          </div>
        )}

        {/* Sous-onglets Dashboard */}
        {activeMainTab === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <nav className="flex gap-1 px-2 overflow-x-auto">
              {subTabs.dashboard.map((sub) => {
                const Icon = sub.icon
                const isActive = activeSubTab === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubTab(sub.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {sub.label}
                    {sub.badge && sub.badge > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white min-w-[20px] text-center">
                        {sub.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Contenu Dashboard */}
        {activeMainTab === 'dashboard' && (
          <div className="animate-fadeIn">
            {activeSubTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={exportVipResellerStatsCsv}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
                  >
                    <Download size={16} />
                    Export CSV VIP/Revendeurs
                  </button>
                </div>

                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <StatCard icon={Wrench} title="Réparations" value={stats.totalRepairs} subtitle={`${stats.completedRepairsCount} terminées`} gradient="from-blue-500 to-cyan-500" />
                  <StatCard icon={RefreshCw} title="Échanges" value={stats.totalTradeins} subtitle={`${stats.totalTradeins - stats.pendingTradeins} traités`} gradient="from-purple-500 to-violet-500" />
                  <StatCard icon={Smartphone} title="Ventes téléphones" value={stats.totalPhoneSales} subtitle={`${stats.phoneSalesRevenue.toLocaleString('fr-FR')} FCFA`} gradient="from-cyan-500 to-blue-500" />
                  <StatCard icon={DollarSign} title="CA total" value={`${(stats.totalRevenue / 1000000).toFixed(1)}M FCFA`} subtitle={`Réparations: ${(stats.repairRevenue/1000).toFixed(0)}k | Échanges: ${(stats.tradeinRevenue/1000).toFixed(0)}k | Tél: ${(stats.phoneSalesRevenue/1000).toFixed(0)}k`} gradient="from-emerald-500 to-green-500" />
                  <StatCard icon={Users} title="Clients VIP" value={stats.totalVIPClients} subtitle={`${stats.vipRepairsCount} réparations | ${stats.vipRevenue.toLocaleString('fr-FR')} FCFA`} gradient="from-amber-500 to-orange-500" />
                  <StatCard icon={ShoppingCart} title="Revendeurs" value={stats.activeResellers} subtitle={`${stats.soldContractsCount} ventes | ${stats.resellerSalesAmount.toLocaleString('fr-FR')} FCFA`} gradient="from-teal-500 to-emerald-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top clients VIP (réparations)</h3>
                    <div className="space-y-3">
                      {stats.vipRepairsByClient.length > 0 ? stats.vipRepairsByClient.map((item, idx) => (
                        <div key={`${item.clientName}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <div>
                            <p className="font-semibold text-gray-900">{item.clientName}</p>
                            <p className="text-sm text-gray-600">{item.repairsCount} réparations</p>
                          </div>
                          <span className="font-bold text-amber-700">{(item.totalCost || 0).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )) : (
                        <p className="text-gray-500 text-sm">Aucune réparation VIP pour le moment</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Performance revendeurs</h3>
                    <div className="space-y-3">
                      {stats.resellerPerformance.length > 0 ? stats.resellerPerformance.map((item, idx) => (
                        <div key={`${item.resellerName}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div>
                            <p className="font-semibold text-gray-900">{item.resellerName}</p>
                            <p className="text-sm text-gray-600">{item.soldCount} vendus | {item.activeCount} actifs</p>
                          </div>
                          <span className="font-bold text-emerald-700">{(item.generatedAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )) : (
                        <p className="text-gray-500 text-sm">Aucune performance revendeur disponible</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Graphiques d'évolution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUpIcon size={20} className="text-blue-600" />
                        Évolution des ventes (FCFA)
                      </h3>
                      <div className="flex gap-3 text-xs">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Réparations</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Échanges</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Téléphones</span>
                      </div>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesEvolution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="réparations" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="échanges" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="téléphones" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <BarChart3 size={20} className="text-emerald-600" />
                      Évolution du nombre de réparations
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={repairsEvolution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <RefreshCw size={20} className="text-purple-600" />
                      Évolution du nombre d'échanges
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tradeinsEvolution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Calendar size={20} className="text-orange-600" />
                      Activité hebdomadaire
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyActivity}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="réparations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="échanges" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="ventes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Graphiques circulaires existants */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <PieChartIcon size={20} className="text-blue-600" />
                      Réparations par statut
                    </h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={stats.repairsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {stats.repairsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-emerald-600" />
                      Revenus mensuels
                    </h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyRevenue}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'repairs' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Dernières réparations</h3>
                  {pendingRepairsCount > 0 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Clock size={14} />
                      {pendingRepairsCount} en attente
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {stats.recentRepairs.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Wrench size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{r.clientName || 'Client'}</p>
                          <p className="text-sm text-gray-500">{r.deviceModel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(r.status)}`}>
                          {getStatusText(r.status)}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'tradeins' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Échanges par statut</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.tradeinsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {stats.tradeinsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Derniers échanges</h3>
                    {pendingTradeinsCount > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Clock size={14} />
                        {pendingTradeinsCount} en attente
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {stats.recentTradeins.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <RefreshCw size={18} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{t.clientName}</p>
                            <p className="text-sm text-gray-500">{t.deviceModel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(t.status)}`}>
                            {getStatusText(t.status)}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Performance mensuelle</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <CheckCircle size={32} className="mb-4" />
                    <p className="text-blue-100">Taux de complétion</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalRepairs > 0 ? Math.round((stats.completedRepairsCount / stats.totalRepairs) * 100) : 0}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
                    <DollarSign size={32} className="mb-4" />
                    <p className="text-emerald-100">Panier moyen</p>
                    <p className="text-2xl font-bold mt-2">{(stats.totalRevenue / (stats.totalRepairs + stats.totalTradeins + stats.totalPhoneSales) || 0).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Produits */}
        {activeMainTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Catalogue produits</h2>
              <p className="text-sm text-gray-500 mt-1">Liste des téléphones disponibles</p>
            </div>
            {renderTable(products, productColumns, 'products')}
            <Pagination 
              currentPage={currentPage.products} 
              totalPages={Math.ceil(products.length / itemsPerPage)} 
              onPageChange={(p) => setCurrentPage(prev => ({ ...prev, products: p }))} 
              totalItems={products.length} 
            />
          </div>
        )}

        {/* Inventaire */}
        {activeMainTab === 'inventory' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Inventaire pièces</h2>
              <p className="text-sm text-gray-500 mt-1">Pièces détachées et composants</p>
            </div>
            {renderTable(inventory, inventoryColumns, 'inventory')}
            <Pagination 
              currentPage={currentPage.inventory} 
              totalPages={Math.ceil(inventory.length / itemsPerPage)} 
              onPageChange={(p) => setCurrentPage(prev => ({ ...prev, inventory: p }))} 
              totalItems={inventory.length} 
            />
          </div>
        )}

        {/* Employés */}
        {activeMainTab === 'employees' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Équipe</h2>
              <p className="text-sm text-gray-500 mt-1">Liste des employés</p>
            </div>
            {renderTable(employees, employeeColumns, 'employees')}
            <Pagination 
              currentPage={currentPage.employees} 
              totalPages={Math.ceil(employees.length / itemsPerPage)} 
              onPageChange={(p) => setCurrentPage(prev => ({ ...prev, employees: p }))} 
              totalItems={employees.length} 
            />
          </div>
        )}

        {/* Ventes */}
        {activeMainTab === 'sales' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Historique des ventes</h2>
              <p className="text-sm text-gray-500 mt-1">Téléphones vendus, réparations payées et échanges complétés</p>
            </div>
            {renderTable(sales, transactionColumns, 'sales')}
            <Pagination 
              currentPage={currentPage.sales} 
              totalPages={Math.ceil(sales.length / itemsPerPage)} 
              onPageChange={(p) => setCurrentPage(prev => ({ ...prev, sales: p }))} 
              totalItems={sales.length} 
            />
          </div>
        )}

        {/* Factures avec filtres */}
        {activeMainTab === 'invoices' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={invoiceFilters.type}
                  onChange={(e) => setInvoiceFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="phone">Téléphones</option>
                  <option value="repair">Réparations</option>
                  <option value="tradein">Échanges</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
                <input
                  type="date"
                  value={invoiceFilters.startDate}
                  onChange={(e) => setInvoiceFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
                <input
                  type="date"
                  value={invoiceFilters.endDate}
                  onChange={(e) => setInvoiceFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setInvoiceFilters({ type: 'all', startDate: '', endDate: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Gestion des factures</h2>
                <p className="text-sm text-gray-500 mt-1">Téléchargez les factures des ventes, réparations et échanges</p>
              </div>
              {renderTable(getFilteredInvoices(), invoiceColumns, 'invoices')}
              <Pagination
                currentPage={currentPage.invoices}
                totalPages={Math.ceil(getFilteredInvoices().length / itemsPerPage)}
                onPageChange={(p) => setCurrentPage(prev => ({ ...prev, invoices: p }))}
                totalItems={getFilteredInvoices().length}
              />
            </div>
          </div>
        )}

        {/* Historique */}
        {activeMainTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Historique complet</h2>
              <p className="text-sm text-gray-500 mt-1">Toutes les transactions (téléphones, réparations, échanges)</p>
            </div>
            {renderTable(historyList, transactionColumns, 'history')}
            <Pagination 
              currentPage={currentPage.history} 
              totalPages={Math.ceil(historyList.length / itemsPerPage)} 
              onPageChange={(p) => setCurrentPage(prev => ({ ...prev, history: p }))} 
              totalItems={historyList.length} 
            />
          </div>
        )}

        {/* Rapports */}
        {activeMainTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-600" />
                Rapport financier
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Chiffre d'affaires total</span>
                  <span className="font-bold text-xl text-emerald-600">{stats.totalRevenue.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                  <span className="font-medium text-gray-700">Ventes téléphones</span>
                  <span className="font-bold text-blue-600">{stats.phoneSalesRevenue.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl">
                  <span className="font-medium text-gray-700">Réparations</span>
                  <span className="font-bold text-indigo-600">{stats.repairRevenue.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <span className="font-medium text-gray-700">Échanges</span>
                  <span className="font-bold text-purple-600">{stats.tradeinRevenue.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Transactions totales</span>
                  <span className="font-bold text-gray-900">{sales.length}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Rapport d'activité
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Téléphones vendus</span>
                  <span className="font-bold text-xl text-cyan-600">{stats.totalPhoneSales}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Réparations traitées</span>
                  <span className="font-bold text-xl text-blue-600">{stats.completedRepairsCount}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Échanges finalisés</span>
                  <span className="font-bold text-xl text-purple-600">{stats.tradeinsByStatus.find(s => s.name === 'Terminée')?.value || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Taux d'activité réparations</span>
                  <span className="font-bold text-gray-900">{stats.totalRepairs > 0 ? Math.round((stats.completedRepairsCount / stats.totalRepairs) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700">Employés actifs</span>
                  <span className="font-bold text-gray-900">{employees.filter(e => e.isActive !== false).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}