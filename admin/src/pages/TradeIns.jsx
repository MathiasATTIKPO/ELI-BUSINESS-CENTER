import React, { useEffect, useState, useMemo } from 'react'
import { FileText,Search,Filter,Calendar,User,RefreshCw,CheckCircle,Clock,XCircle,AlertCircle,Eye, 
  Download,Smartphone,Target,ChevronDown,X,TrendingUp,ArrowUpRight,ArrowDownRight
} from 'lucide-react'
import api from '../services/api'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import { formatReference } from '../utils/formatReference'
import { exportCsv } from '../utils/exportCsv'
import { logHistoryEntry } from '../utils/history'

export default function TradeIns() {
  const [tradeins, setTradeins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  useEffect(() => {
    fetchTradeins()
  }, [])

  const fetchTradeins = async () => {
    try {
      const response = await api.get('/api/admin/tradeins')
      setTradeins(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending: { 
      color: 'bg-amber-50 text-amber-700 border-amber-200', 
      icon: Clock, 
      label: 'En attente',
      gradient: 'from-amber-500 to-orange-500'
    },
    accepted: { 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: CheckCircle, 
      label: 'Accepté',
      gradient: 'from-emerald-500 to-green-500'
    },
    refused: { 
      color: 'bg-red-50 text-red-700 border-red-200', 
      icon: XCircle, 
      label: 'Refusé',
      gradient: 'from-red-500 to-rose-500'
    },
    completed: { 
      color: 'bg-blue-50 text-blue-700 border-blue-200', 
      icon: CheckCircle, 
      label: 'Terminé',
      gradient: 'from-blue-500 to-indigo-500'
    },
    paid: { 
      color: 'bg-green-50 text-green-700 border-green-200', 
      icon: CheckCircle, 
      label: 'payé',
      gradient: 'from-emerald-500 to-green-500'
    },
    assigned: { 
      color: 'bg-purple-50 text-purple-700 border-purple-200', 
      icon: User, 
      label: 'Assigné',
      gradient: 'from-purple-500 to-violet-500'
    }
  }

  const stats = useMemo(() => {
    const total = tradeins.length
    const pending = tradeins.filter(t => t.status === 'pending').length
    const accepted = tradeins.filter(t => t.status === 'accepted').length
    const completed = tradeins.filter(t => t.status === 'completed').length
    const refused = tradeins.filter(t => t.status === 'refused').length
    
    // Calcul du taux d'acceptation
    const acceptanceRate = total > 0 ? ((accepted + completed) / total * 100).toFixed(1) : 0
    
    return { total, pending, accepted, completed, refused, acceptanceRate }
  }, [tradeins])

  const filteredTradeins = useMemo(() => {
    return tradeins.filter((tradein) => {
      const statusMatch = statusFilter === 'all' || tradein.status === statusFilter
      const dateMatch = (!dateFrom || new Date(tradein.createdAt) >= new Date(dateFrom)) &&
        (!dateTo || new Date(tradein.createdAt) <= new Date(dateTo))
      const searchMatch = !searchTerm ||
        tradein.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tradein.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tradein.clientWhatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tradein.targetProduct?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tradein._id?.toLowerCase().includes(searchTerm.toLowerCase())

      return statusMatch && dateMatch && searchMatch
    })
  }, [tradeins, statusFilter, dateFrom, dateTo, searchTerm])

  const handleExportTradeins = () => {
    const csvRows = filteredTradeins.map((tradein) => ({
      Référence: formatReference(tradein._id),
      Client: tradein.clientName || 'N/A',
      Téléphone: tradein.clientWhatsapp || 'N/A',
      Modèle: tradein.deviceModel || 'N/A',
      Souhaite: tradein.targetProduct || 'N/A',
      Technicien: tradein.assignedTo?.name || 'N/A',
      Caissier: tradein.saleInfo?.validatedBy || 'N/A',
      Statut: tradein.status,
      Date: new Date(tradein.createdAt).toLocaleDateString('fr-FR'),
      Montant: tradein.saleInfo?.amount || 0,
    }))

    exportCsv(csvRows, 'tradeins_export')
    logHistoryEntry({
      action: 'Export',
      resource: 'Échanges',
      description: `Export des ${csvRows.length} demandes d'échange`,
    })
    setToast({ type: 'success', message: 'Export CSV généré avec succès' })
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = statusFilter !== 'all' || searchTerm || dateFrom || dateTo

  const statusButtons = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'accepted' && 'paid', label: 'Acceptés' },
    { value: 'refused', label: 'Refusés' },
    //{ value: 'completed', label: 'Terminés' },
    { value: 'assigned', label: 'Assignés' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-indigo-600"></div>
            <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement des demandes d'échange...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Demandes d'Échange
          </h1>
          <p className="text-gray-500 mt-1">Suivez et gérez les demandes d'échange de vos clients</p>
        </div>
        
        <button
          onClick={handleExportTradeins}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
        >
          <Download size={18} />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { 
            label: 'Total', 
            value: stats.total, 
            icon: RefreshCw, 
            gradient: 'from-violet-500 to-purple-500',
            trend: null
          },
          { 
            label: 'En attente', 
            value: stats.pending, 
            icon: Clock, 
            gradient: 'from-amber-500 to-orange-500',
            trend: stats.pending > 0 ? 'up' : null
          },
          { 
            label: 'Acceptés', 
            value: stats.accepted, 
            icon: CheckCircle, 
            gradient: 'from-emerald-500 to-green-500',
            trend: 'up'
          },
          { 
            label: 'Terminés', 
            value: stats.completed, 
            icon: CheckCircle, 
            gradient: 'from-blue-500 to-indigo-500',
            trend: null
          },
          { 
            label: 'Taux acceptation', 
            value: `${stats.acceptanceRate}%`, 
            icon: TrendingUp, 
            gradient: 'from-cyan-500 to-blue-500',
            trend: stats.acceptanceRate > 50 ? 'up' : 'down'
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.trend && (
                      <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {stat.trend === 'up' ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.gradient} bg-opacity-10 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client, téléphone, modèle ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl transition-all duration-200 ${
                isFilterExpanded 
                  ? 'bg-violet-50 border-violet-300 text-violet-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              Filtres avancés
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse"></span>
              )}
              <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date fin</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {statusButtons.map((status) => {
          const config = statusConfig[status.value]
          const isActive = statusFilter === status.value
          
          return (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 font-medium text-sm ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {status.label}
              {status.value !== 'all' && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs ${
                  isActive ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tradeins.filter(t => t.status === status.value).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tableau des échanges */}
      {filteredTradeins.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <RefreshCw className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune demande d'échange trouvée</h3>
          <p className="text-gray-500 mb-6">Modifiez vos filtres ou créez une nouvelle demande d'échange</p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Filter size={16} />
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredTradeins.length} demande{filteredTradeins.length > 1 ? 's' : ''} d'échange
              </h2>
              <span className="text-sm text-gray-500">
                Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modèle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Souhaite</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Technicien</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTradeins.map((tradein) => {
                  const statusBadge = statusConfig[tradein.status] || { 
                    color: 'bg-gray-50 text-gray-700 border-gray-200', 
                    icon: AlertCircle, 
                    label: tradein.status 
                  }
                  const StatusIcon = statusBadge.icon
                  
                  return (
                    <tr key={tradein._id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {formatReference(tradein._id)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {(tradein.clientName || 'N/A').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{tradein.clientName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{tradein.clientWhatsapp || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-900">
                          <Smartphone size={14} className="text-gray-400" />
                          {tradein.deviceModel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Target size={14} className="text-violet-500" />
                          <span className="text-violet-700 font-medium">{tradein.targetProduct || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tradein.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                              <User size={12} className="text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-900">{tradein.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(tradein.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={`/admin/tradeins/${tradein._id}`} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={14} />
                          Détails
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}