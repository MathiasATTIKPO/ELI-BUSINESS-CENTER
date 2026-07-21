import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ListChecks, LogOut, Wrench, RefreshCw, ChevronLeft, ChevronRight, 
  AlertCircle, FileText, Clock, CheckCircle, DollarSign, User, Phone,
  Smartphone, Search, Filter, X, Calendar, Star, TrendingUp, History,
  Package, ArrowUpRight, Activity, BarChart3
} from 'lucide-react'
import { useTechnicianAuth } from '../../hooks/useTechnicianAuth'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianHistory() {
  const navigate = useNavigate()
  const { user, logout } = useTechnicianAuth()
  const [repairs, setRepairs] = useState([])
  const [tradeins, setTradeins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const [activeTab, setActiveTab] = useState('repairs')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  
  const [currentPage, setCurrentPage] = useState({ repairs: 1, tradeins: 1 })
  const itemsPerPage = 6

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const [repairsResponse, tradeinsResponse] = await Promise.all([
        api.get('/api/technician/history'),
        api.get('/api/technician/tradeins/history').catch(() => ({ data: { data: [] } }))
      ])
      
      const completedRepairs = (repairsResponse.data.data || []).filter(r => 
        r.status === 'completed' || r.status === 'paid'
      )
      const completedTradeins = (tradeinsResponse.data.data || []).filter(t => 
        t.status === 'completed' || t.status === 'paid'
      )
      setRepairs(completedRepairs)
      setTradeins(completedTradeins)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement de l\'historique' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      completed: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Terminée',
        gradient: 'from-emerald-500 to-green-500'
      },
      paid: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Payée',
        gradient: 'from-emerald-500 to-green-500'
      }
    }
    return configs[status] || { 
      color: 'bg-gray-50 text-gray-700 border-gray-200', 
      icon: CheckCircle, 
      label: status,
      gradient: 'from-gray-400 to-gray-500'
    }
  }

  // Statistiques
  const stats = useMemo(() => {
    const totalRepairs = repairs.length
    const totalTradeins = tradeins.length
    const totalRevenue = repairs.reduce((sum, r) => sum + (r.estimatedCost || r.price || 0), 0) +
                        tradeins.reduce((sum, t) => sum + (t.proposedValue || 0), 0)
    
    return { totalRepairs, totalTradeins, totalRevenue }
  }, [repairs, tradeins])

  // Filtrage et tri
  const filteredRepairs = useMemo(() => {
    let filtered = [...repairs]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.clientName?.toLowerCase().includes(term) ||
        r.deviceModel?.toLowerCase().includes(term) ||
        r.clientWhatsapp?.toLowerCase().includes(term)
      )
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt)
      const dateB = new Date(b.completedAt || b.updatedAt)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [repairs, searchTerm, sortOrder])

  const filteredTradeins = useMemo(() => {
    let filtered = [...tradeins]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.clientName?.toLowerCase().includes(term) ||
        t.deviceModel?.toLowerCase().includes(term) ||
        t.targetProduct?.toLowerCase().includes(term)
      )
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.completedAt || a.updatedAt)
      const dateB = new Date(b.completedAt || b.updatedAt)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })
    
    return filtered
  }, [tradeins, searchTerm, sortOrder])

  // Pagination
  const currentData = activeTab === 'repairs' ? filteredRepairs : filteredTradeins
  const totalPages = Math.ceil(currentData.length / itemsPerPage)
  const paginatedData = currentData.slice(
    ((activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) - 1) * itemsPerPage,
    (activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) * itemsPerPage
  )

  const formatDate = (date) => {
    if (!date) return 'Date inconnue'
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-emerald-600"></div>
            <History className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Barre supérieure */}
      {/*<div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                <History size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Historique
                </h1>
                <p className="text-xs text-gray-500">{user?.name || 'Technicien'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/technician/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <ListChecks size={18} />
                <span className="hidden sm:inline font-medium">Dashboard</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>*/}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Réparations terminées', value: stats.totalRepairs, icon: Wrench, gradient: 'from-emerald-500 to-green-500' },
            { label: 'Échanges finalisés', value: stats.totalTradeins, icon: RefreshCw, gradient: 'from-purple-500 to-violet-500' },
            { label: 'Revenus générés', value: `${(stats.totalRevenue / 1000).toFixed(0)}k FCFA`, icon: DollarSign, gradient: 'from-blue-500 to-cyan-500' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.gradient} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Onglets et recherche */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-gray-100">
            <nav className="flex gap-2">
              <button
                onClick={() => { setActiveTab('repairs'); setCurrentPage(prev => ({ ...prev, repairs: 1 })); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'repairs'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Wrench size={18} />
                Réparations
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'repairs' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filteredRepairs.length}
                </span>
              </button>
              
              <button
                onClick={() => { setActiveTab('tradeins'); setCurrentPage(prev => ({ ...prev, tradeins: 1 })); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'tradeins'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw size={18} />
                Échanges
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'tradeins' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filteredTradeins.length}
                </span>
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Calendar size={16} />
                {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
              </button>
            </div>
          </div>

          {/* Liste */}
          {currentData.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                {repairs.length === 0 && tradeins.length === 0 ? (
                  <History className="text-gray-400" size={32} />
                ) : (
                  <Search className="text-gray-400" size={32} />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {repairs.length === 0 && tradeins.length === 0 
                  ? 'Aucun historique' 
                  : 'Aucun résultat trouvé'}
              </h3>
              <p className="text-gray-500">
                {repairs.length === 0 && tradeins.length === 0 
                  ? 'Les tâches terminées apparaîtront ici' 
                  : 'Modifiez vos critères de recherche'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedData.map((item) => {
                  const statusConfig = getStatusConfig(item.status)
                  const StatusIcon = statusConfig.icon
                  const isRepair = activeTab === 'repairs'
                  
                  return (
                    <div key={item._id} className="p-6 hover:bg-gray-50/50 transition-colors duration-150">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                              <Smartphone size={18} className="text-gray-400" />
                              <h3 className="font-semibold text-gray-900">
                                {item.deviceModel || 'Modèle non spécifié'}
                              </h3>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <User size={14} className="text-gray-400" />
                              {item.clientName || 'Non spécifié'}
                            </span>
                            {item.clientWhatsapp && (
                              <span className="flex items-center gap-1.5">
                                <Phone size={14} className="text-gray-400" />
                                {item.clientWhatsapp}
                              </span>
                            )}
                          </div>

                          {!isRepair && item.targetProduct && (
                            <p className="text-sm text-purple-600 flex items-center gap-1.5">
                              <RefreshCw size={14} />
                              Échange contre : {item.targetProduct}
                            </p>
                          )}

                          {(item.estimatedCost || item.proposedValue) && (
                            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                              <DollarSign size={14} />
                              {isRepair 
                                ? `Montant: ${(item.estimatedCost || item.price || 0).toLocaleString('fr-FR')} FCFA`
                                : `Valeur: ${item.proposedValue?.toLocaleString('fr-FR')} FCFA`
                              }
                            </p>
                          )}

                          {item.technicianReport && (
                            <div className={`p-3 rounded-xl ${isRepair ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'}`}>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Rapport d'intervention :</p>
                              <p className="text-sm text-gray-600">{item.technicianReport}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatDate(item.completedAt || item.updatedAt)}
                          </span>
                          <button
                            onClick={() => navigate(`/technician/${isRepair ? 'repair' : 'tradein'}/${item._id}`)}
                            className={`px-4 py-2.5 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium ${
                              isRepair 
                                ? 'bg-emerald-600 hover:bg-emerald-700' 
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            <FileText size={16} />
                            Voir détails
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {((activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) - 1) * itemsPerPage + 1}
                    </span>
                    {' - '}
                    <span className="font-medium">
                      {Math.min((activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) * itemsPerPage, currentData.length)}
                    </span>
                    {' sur '}
                    <span className="font-medium">{currentData.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => ({ ...prev, [activeTab]: Math.max(1, prev[activeTab] - 1) }))}
                      disabled={(activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) === 1}
                      className="p-2 rounded-lg transition-all disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-white hover:shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const current = activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins
                      let pageNum
                      if (totalPages <= 5) pageNum = i + 1
                      else if (current <= 3) pageNum = i + 1
                      else if (current >= totalPages - 2) pageNum = totalPages - 4 + i
                      else pageNum = current - 2 + i
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(prev => ({ ...prev, [activeTab]: pageNum }))}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            current === pageNum
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => ({ ...prev, [activeTab]: Math.min(totalPages, prev[activeTab] + 1) }))}
                      disabled={(activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) === totalPages}
                      className="p-2 rounded-lg transition-all disabled:text-gray-300 disabled:cursor-not-allowed text-gray-600 hover:bg-white hover:shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}