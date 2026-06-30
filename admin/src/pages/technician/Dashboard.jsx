import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import {
  ListChecks, LogOut, FileText, Wrench, RefreshCw, Plus, AlertCircle,
  Smartphone, Phone, ChevronLeft, ChevronRight, Eye, Clock, CheckCircle,
  XCircle, User, Calendar, DollarSign, MessageSquare, Search, Filter,
  SlidersHorizontal, ChevronDown, X, Zap, Star, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, BarChart3, Activity
} from 'lucide-react'
import api, { API_BASE_URL } from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianDashboard() {
  const { user, logout } = useTechnicianAuth()
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState([])
  const [tradeins, setTradeins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const [activeTab, setActiveTab] = useState('repairs')
  const [showNewRepair, setShowNewRepair] = useState(false)
  const [showNewTradein, setShowNewTradein] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const [availablePhones, setAvailablePhones] = useState([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState(null);

  const fetchAvailablePhones = async () => {
    setLoadingPhones(true);
    try {
      const response = await api.get('/api/products/phones/available');
      setAvailablePhones(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement téléphones:', error);
      // Fallback: essayer avec la route des produits génériques
      try {
        const productsRes = await api.get('/api/products');
        const phones = (productsRes.data.data || []).filter(
          product => product.category === 'phone' && product.stock > 0
        );
        setAvailablePhones(phones);
      } catch (fallbackError) {
        console.error('Erreur fallback téléphones:', fallbackError);
        setToast({
          type: 'error',
          message: 'Impossible de charger les téléphones disponibles'
        });
      }
    } finally {
      setLoadingPhones(false);
    }
  };

  const [newRepair, setNewRepair] = useState({
    clientName: '', clientWhatsapp: '', deviceModel: '',
    issueDescription: '', estimatedCost: '', notes: ''
  })

  const [currentPage, setCurrentPage] = useState({ repairs: 1, tradeins: 1 })
  const itemsPerPage = 6


  useEffect(() => {
    fetchData();
    fetchAvailablePhones();
  }, [])

  const fetchData = async () => {
    try {
      const [repairsResponse, tradeinsResponse] = await Promise.all([
        api.get('/api/technician/repairs'),
        api.get('/api/technician/tradeins')
      ])
      setRepairs(repairsResponse.data.data || [])
      setTradeins(tradeinsResponse.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRepair = async (e) => {
    e.preventDefault()
    if (!newRepair.clientName || !newRepair.clientWhatsapp || !newRepair.deviceModel) {
      setToast({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    try {
      await api.post('/api/technician/repairs', {
        ...newRepair,
        estimatedCost: parseFloat(newRepair.estimatedCost) || 0,
        assignedTo: user?._id,
        status: 'assigned'
      })
      setToast({ type: 'success', message: 'Réparation créée avec succès' })
      setShowNewRepair(false)
      setNewRepair({ clientName: '', clientWhatsapp: '', deviceModel: '', issueDescription: '', estimatedCost: '', notes: '' })
      fetchData()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la création' })
    }
  }

  const handleCreateTradein = async (e) => {
    e.preventDefault()
    if (!newTradein.clientName || !newTradein.clientWhatsapp || !newTradein.deviceModel) {
      setToast({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    try {
      await api.post('/api/technician/tradeins', {
        ...newTradein,
        proposedValue: parseFloat(newTradein.proposedValue) || 0,
        assignedTo: user?._id,
        status: 'pending'
      })
      setToast({ type: 'success', message: 'Échange créé avec succès' })
      setShowNewTradein(false)
      setNewTradein({ clientName: '', clientWhatsapp: '', deviceModel: '', targetProduct: '', targetProductName: '', targetProductPrice: 0, proposedValue: '', condition: 'good', notes: '' })
      fetchData()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la création' })
    }
  }

  const handleUpdateTradeinStatus = async (tradeinId, status) => {
    try {
      await api.put(`/api/technician/tradein/${tradeinId}/status`, { status })
      setToast({ type: 'success', message: `Statut mis à jour : ${status === 'accepted' ? 'Accepté' : status === 'refused' ? 'Refusé' : 'Finalisé'}` })
      fetchData()
    } catch (error) {
      setToast({ type: 'error', message: 'Impossible de mettre à jour le statut.' })
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'En attente' },
      accepted: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Accepté' },
      refused: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Refusé' },
      completed: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Terminé' },
      paid: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Payée' },
      assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: User, label: 'Assignée' },
      diagnosing: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Search, label: 'Diagnostic' },
      repairing: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Wrench, label: 'En réparation' },
      ready: { color: 'bg-teal-50 text-teal-700 border-teal-200', icon: Package, label: 'Prête' },
      cancelled: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Annulée' }
    }
    return configs[status] || { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle, label: status }
  }

  // Statistiques
  const stats = useMemo(() => ({
    totalRepairs: repairs.length,
    pendingRepairs: repairs.filter(r => ['assigned', 'diagnosing', 'repairing'].includes(r.status)).length,
    completedRepairs: repairs.filter(r => r.status === 'paid').length,
    readyRepairs: repairs.filter(r => r.status === 'ready' || r.status === 'completed').length,
    pendingTradeins: tradeins.filter(t => t.status === 'pending').length,
    readyTradeins: tradeins.filter(t => t.status === 'paid' || t.status === 'accepted').length,
    totalTradeins: tradeins.length
  }), [repairs, tradeins])

  const [newTradein, setNewTradein] = useState({
  clientName: '', 
  clientWhatsapp: '', 
  deviceModel: '',
  targetProduct: '',        // ID du téléphone
  targetProductName: '',    // Nom du téléphone (pour affichage)
  targetProductPrice: 0,    // Prix du téléphone
  proposedValue: '', 
  condition: 'good', 
  notes: ''
})

  // Filtrage
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
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }
    return filtered
  }, [repairs, searchTerm, statusFilter])

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
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }
    return filtered
  }, [tradeins, searchTerm, statusFilter])

  // Pagination
  const currentData = activeTab === 'repairs' ? filteredRepairs : filteredTradeins
  const totalPages = Math.ceil(currentData.length / itemsPerPage)
  const paginatedData = currentData.slice(
    ((activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) - 1) * itemsPerPage,
    (activeTab === 'repairs' ? currentPage.repairs : currentPage.tradeins) * itemsPerPage
  )

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <Wrench className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Mes réparations', value: stats.totalRepairs, icon: Wrench, gradient: 'from-blue-500 to-cyan-500' },
            { label: 'En cours', value: stats.pendingRepairs, icon: Activity, gradient: 'from-amber-500 to-orange-500' },
            { label: 'Terminées', value: stats.completedRepairs, icon: CheckCircle, gradient: 'from-emerald-500 to-green-500' },
            { label: 'Prêtes', value: stats.readyRepairs, icon: Package, gradient: 'from-teal-500 to-cyan-500' },
            { label: 'Échanges', value: stats.pendingTradeins, icon: RefreshCw, gradient: 'from-purple-500 to-violet-500' },
            { label: 'Échanges Terminés', value: stats.readyTradeins, icon: CheckCircle, gradient: 'from-purple-500 to-violet-500' },
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

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <nav className="flex gap-2">
              <button
                onClick={() => { setActiveTab('repairs'); setCurrentPage(prev => ({ ...prev, repairs: 1 })); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'repairs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Wrench size={18} />
                Réparations
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'repairs' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {repairs.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('tradeins'); setCurrentPage(prev => ({ ...prev, tradeins: 1 })); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === 'tradeins'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <RefreshCw size={18} />
                Échanges
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'tradeins' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {tradeins.length}
                </span>
              </button>
            </nav>

            <button
              onClick={() => activeTab === 'repairs' ? setShowNewRepair(true) : setShowNewTradein(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={`Rechercher dans les ${activeTab === 'repairs' ? 'réparations' : 'échanges'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Tous les statuts</option>
                {activeTab === 'repairs' ? (
                  <>
                    <option value="assigned">Assignée</option>
                    <option value="diagnosing">Diagnostic</option>
                    <option value="repairing">En réparation</option>
                    <option value="ready">Prête</option>
                    <option value="completed">Terminée</option>
                  </>
                ) : (
                  <>
                    <option value="pending">En attente</option>
                    <option value="accepted">Accepté</option>
                    <option value="refused">Refusé</option>
                    <option value="completed">Terminé</option>
                  </>
                )}
              </select>
              {(searchTerm || statusFilter !== 'all') && (
                <button onClick={clearFilters} className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                  <X size={16} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Liste des éléments */}
          {currentData.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <AlertCircle className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {repairs.length === 0 && tradeins.length === 0
                  ? 'Aucune tâche assignée'
                  : 'Aucun résultat trouvé'}
              </h3>
              <p className="text-gray-500 mb-6">
                {repairs.length === 0 && tradeins.length === 0
                  ? 'Créez une nouvelle réparation ou un échange pour commencer'
                  : 'Modifiez vos critères de recherche'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {paginatedData.map((item) => {
                  const statusConfig = getStatusConfig(item.status)
                  const StatusIcon = statusConfig.icon

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
                              <a href={`https://wa.me/${item.clientWhatsapp.replace(/^\+/, '')}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-green-600 hover:text-green-700">
                                <Phone size={14} />
                                {item.clientWhatsapp}
                              </a>
                            )}
                          </div>

                          {activeTab === 'tradeins' && item.targetProduct && (
                            <p className="text-sm text-purple-600 flex items-center gap-1.5">
                              <RefreshCw size={14} />
                              Échange contre : {item.targetProduct}
                            </p>
                          )}

                          {(item.estimatedCost || item.proposedValue) && (
                            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                              <DollarSign size={14} />
                              {activeTab === 'repairs'
                                ? `Devis: ${item.estimatedCost?.toLocaleString('fr-FR')} FCFA`
                                : `Valeur: ${item.proposedValue?.toLocaleString('fr-FR')} FCFA`
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/technician/${activeTab === 'repairs' ? 'repair' : 'tradein'}/${item._id}`)}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
                          >
                            <Eye size={16} />
                            Détails
                          </button>

                          {activeTab === 'tradeins' && item.status === 'assigned' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateTradeinStatus(item._id, 'accepted')}
                                className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 text-sm font-medium"
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleUpdateTradeinStatus(item._id, 'refused')}
                                className="px-3 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                              >
                                Refuser
                              </button>
                            </div>
                          )}

                          {activeTab === 'tradeins' && item.status === 'accepted' && (
                            <button
                              onClick={() => handleUpdateTradeinStatus(item._id, 'completed')}
                              className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 text-sm font-medium"
                            >
                              Finaliser
                            </button>
                          )}
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
                      onClick={() => setCurrentPage(prev => ({
                        ...prev,
                        [activeTab]: Math.max(1, prev[activeTab] - 1)
                      }))}
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
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${current === pageNum
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white hover:shadow-sm'
                            }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => ({
                        ...prev,
                        [activeTab]: Math.min(totalPages, prev[activeTab] + 1)
                      }))}
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

      {/* Modal Nouvelle Réparation */}
      {showNewRepair && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewRepair(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Wrench size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nouvelle réparation</h3>
                  <p className="text-sm text-gray-500">Créez une nouvelle réparation manuellement</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleCreateRepair} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nom du client *</label>
                  <input type="text" value={newRepair.clientName} onChange={(e) => setNewRepair({ ...newRepair, clientName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">WhatsApp *</label>
                  <input type="text" value={newRepair.clientWhatsapp} onChange={(e) => setNewRepair({ ...newRepair, clientWhatsapp: e.target.value })} placeholder="+225 XX XX XX XX" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Modèle *</label>
                <input type="text" value={newRepair.deviceModel} onChange={(e) => setNewRepair({ ...newRepair, deviceModel: e.target.value })} placeholder="iPhone 13, Samsung..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea value={newRepair.issueDescription} onChange={(e) => setNewRepair({ ...newRepair, issueDescription: e.target.value })} rows="3" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Devis (FCFA)</label>
                  <input type="number" value={newRepair.estimatedCost} onChange={(e) => setNewRepair({ ...newRepair, estimatedCost: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Notes</label>
                  <textarea value={newRepair.notes} onChange={(e) => setNewRepair({ ...newRepair, notes: e.target.value })} rows="2" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowNewRepair(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Annuler</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-medium shadow-sm">Créer la réparation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvel Échange */}
      {showNewTradein && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewTradein(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500">
                  <RefreshCw size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nouvel échange</h3>
                  <p className="text-sm text-gray-500">Créez une nouvelle demande d'échange</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateTradein} className="p-6 space-y-5">
              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nom du client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTradein.clientName}
                    onChange={(e) => setNewTradein({ ...newTradein, clientName: e.target.value })}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTradein.clientWhatsapp}
                    onChange={(e) => setNewTradein({ ...newTradein, clientWhatsapp: e.target.value })}
                    placeholder="+225 XX XX XX XX"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Modèle à échanger <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTradein.deviceModel}
                    onChange={(e) => setNewTradein({ ...newTradein, deviceModel: e.target.value })}
                    placeholder="iPhone 12, Samsung S21..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">État</label>
                  <select
                    value={newTradein.condition}
                    onChange={(e) => setNewTradein({ ...newTradein, condition: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="new">Neuf</option>
                    <option value="like-new">Comme neuf</option>
                    <option value="good">Bon état</option>
                    <option value="fair">État moyen</option>
                    <option value="poor">Mauvais état</option>
                  </select>
                </div>
              </div>

              {/* Téléphone souhaité - SECTION AMÉLIORÉE */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Téléphone souhaité <span className="text-red-500">*</span>
                </label>
                {loadingPhones ? (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={16} className="animate-spin text-purple-500" />
                      <span className="text-gray-500">Chargement des téléphones disponibles...</span>
                    </div>
                  </div>
                ) : availablePhones.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-yellow-50">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={16} className="text-yellow-600" />
                      <span className="text-yellow-700">Aucun téléphone disponible en stock</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {/* Barre de recherche rapide */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Rechercher un téléphone..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          // Filtrer les téléphones affichés
                          const filtered = availablePhones.filter(phone =>
                            phone.name.toLowerCase().includes(searchTerm) ||
                            phone.brand?.toLowerCase().includes(searchTerm)
                          );
                          // Mettre à jour l'affichage
                          document.querySelectorAll('.phone-option').forEach(el => {
                            const phoneText = el.textContent.toLowerCase();
                            el.style.display = phoneText.includes(searchTerm) ? '' : 'none';
                          });
                        }}
                      />
                    </div>

                    {/* Liste des téléphones */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {availablePhones.map(phone => (
                        <label
                          key={phone._id}
                          className={`phone-option flex items-center gap-3 p-3 cursor-pointer hover:bg-purple-50 transition-colors ${selectedPhone?._id === phone._id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                            }`}
                        >
                          <input
                            type="radio"
                            name="targetPhone"
                            className="sr-only"
                            checked={selectedPhone?._id === phone._id}
                            onChange={() => {
                              setSelectedPhone(phone);
                              setNewTradein({
                                ...newTradein,
                                targetProduct: phone._id,
                                targetProductName: phone.name,
                                targetProductPrice: phone.price
                              });
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{phone.name}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${phone.stock <= 3 ? 'bg-red-50 text-red-700' :
                                  phone.stock <= 10 ? 'bg-amber-50 text-amber-700' :
                                    'bg-green-50 text-green-700'
                                }`}>
                                Stock: {phone.stock}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-500">
                                {phone.brand || 'Non spécifié'} {phone.model && `- ${phone.model}`}
                              </span>
                              <span className="text-sm font-semibold text-purple-600">
                                {phone.price?.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPhone?._id === phone._id ? 'border-purple-500' : 'border-gray-300'
                            }`}>
                            {selectedPhone?._id === phone._id && (
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPhone && (
                  <div className="mt-2 px-4 py-2 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">
                      📱 {selectedPhone.name} - {selectedPhone.price?.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                )}
              </div>

              {/* Valeur proposée */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Valeur proposée (FCFA)
                </label>
                <input
                  type="number"
                  value={newTradein.proposedValue}
                  onChange={(e) => setNewTradein({ ...newTradein, proposedValue: e.target.value })}
                  placeholder="Ex: 150000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {selectedPhone && newTradein.proposedValue && (
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className={`text-sm font-medium ${parseFloat(newTradein.proposedValue) > selectedPhone.price ? 'text-green-600' : 'text-amber-600'
                      }`}>
                      {parseFloat(newTradein.proposedValue) > selectedPhone.price
                        ? `+ ${(parseFloat(newTradein.proposedValue) - selectedPhone.price).toLocaleString('fr-FR')} FCFA (reste à payer)`
                        : selectedPhone.price - parseFloat(newTradein.proposedValue) > 0
                          ? `- ${(selectedPhone.price - parseFloat(newTradein.proposedValue)).toLocaleString('fr-FR')} FCFA (différence)`
                          : 'Montant équivalent'}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Notes complémentaires</label>
                <textarea
                  value={newTradein.notes}
                  onChange={(e) => setNewTradein({ ...newTradein, notes: e.target.value })}
                  rows="2"
                  placeholder="Informations supplémentaires..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTradein(false);
                    setSelectedPhone(null);
                  }}
                  className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingPhones || availablePhones.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:from-purple-700 hover:to-violet-700 font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer l'échange
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>)

}