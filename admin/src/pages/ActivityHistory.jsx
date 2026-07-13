import React, { useEffect, useState, useMemo } from 'react'
import { 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  ChevronDown,
  Download,
  History,
  Activity,
  BarChart3,
  TrendingUp,
  Zap,
  Star,
  Shield,
  CheckCircle,
  Edit3,
  PlusCircle,
  RefreshCw
} from 'lucide-react'
import { getHistoryEntries, clearHistoryEntries } from '../utils/history'
import Toast from '../components/Toast'

export default function ActivityHistory() {
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterResource, setFilterResource] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const entries = getHistoryEntries()
    setHistory(entries)
  }

  const filteredHistory = useMemo(() => {
    let filtered = [...history]

    // Filtre par action
    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === filterAction)
    }

    // Filtre par ressource
    if (filterResource !== 'all') {
      filtered = filtered.filter(entry => entry.resource === filterResource)
    }

    // Filtre par date
    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= new Date(dateFrom))
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= endDate)
    }

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.action?.toLowerCase().includes(term) ||
        entry.resource?.toLowerCase().includes(term) ||
        entry.description?.toLowerCase().includes(term) ||
        entry.user?.toLowerCase().includes(term)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [history, searchTerm, filterAction, filterResource, dateFrom, dateTo, sortOrder])

  const handleClearHistory = () => {
    clearHistoryEntries()
    setHistory([])
    setDeleteConfirm(false)
    setToast({ type: 'success', message: 'Historique vidé avec succès' })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterAction('all')
    setFilterResource('all')
    setDateFrom('')
    setDateTo('')
    setSortOrder('desc')
  }

  const hasActiveFilters = searchTerm || filterAction !== 'all' || filterResource !== 'all' || dateFrom || dateTo

  // Actions et ressources uniques
  const uniqueActions = useMemo(() => ['all', ...new Set(history.map(entry => entry.action))], [history])
  const uniqueResources = useMemo(() => ['all', ...new Set(history.map(entry => entry.resource))], [history])

  // Statistiques
  const stats = useMemo(() => {
    const total = history.length
    const creations = history.filter(e => e.action === 'Création').length
    const updates = history.filter(e => e.action === 'Mise à jour').length
    const deletions = history.filter(e => e.action === 'Suppression').length
    const exports = history.filter(e => e.action === 'Export').length
    const today = new Date().toDateString()
    const todayActions = history.filter(e => new Date(e.timestamp).toDateString() === today).length

    return { total, creations, updates, deletions, exports, todayActions }
  }, [history])

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterAction, filterResource, dateFrom, dateTo])

  const getActionConfig = (action) => {
    const configs = {
      'Création': { 
        icon: PlusCircle, 
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-500',
        gradient: 'from-emerald-400 to-green-500'
      },
      'Mise à jour': { 
        icon: Edit3, 
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-500',
        gradient: 'from-blue-400 to-cyan-500'
      },
      'Suppression': { 
        icon: Trash2, 
        badge: 'bg-red-50 text-red-700 border-red-200',
        iconColor: 'text-red-500',
        gradient: 'from-red-400 to-rose-500'
      },
      'Export': { 
        icon: Download, 
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        iconColor: 'text-purple-500',
        gradient: 'from-purple-400 to-violet-500'
      }
    }
    return configs[action] || { 
      icon: Clock, 
      badge: 'bg-gray-50 text-gray-700 border-gray-200',
      iconColor: 'text-gray-500',
      gradient: 'from-gray-400 to-gray-500'
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Historique d'Activité
          </h1>
          <p className="text-gray-500 mt-1">Suivez toutes les actions réalisées dans l'administration</p>
        </div>
        
        <button
          onClick={() => setDeleteConfirm(true)}
          disabled={history.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={18} />
          Vider l'historique
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total actions', 
            value: stats.total, 
            icon: Activity, 
            gradient: 'from-violet-500 to-purple-500',
            subtitle: `${stats.todayActions} aujourd'hui`
          },
          { 
            label: 'Créations', 
            value: stats.creations, 
            icon: PlusCircle, 
            gradient: 'from-emerald-500 to-green-500',
            subtitle: 'Nouvelles entrées'
          },
          { 
            label: 'Modifications', 
            value: stats.updates, 
            icon: Edit3, 
            gradient: 'from-blue-500 to-cyan-500',
            subtitle: 'Mises à jour'
          },
          { 
            label: 'Suppressions', 
            value: stats.deletions, 
            icon: Trash2, 
            gradient: stats.deletions > 0 ? 'from-red-500 to-rose-500' : 'from-gray-400 to-gray-500',
            subtitle: stats.deletions > 0 ? 'Éléments supprimés' : 'Aucune suppression'
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`}></div>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.subtitle}</p>
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par action, ressource, description..."
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
            
            <div className="flex gap-3">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {action === 'all' ? 'Toutes les actions' : action}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl transition-all duration-200 ${
                  isFilterExpanded 
                    ? 'bg-violet-50 border-violet-300 text-violet-700' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={18} />
                Filtres
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse"></span>
                )}
                <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ressource</label>
                  <select
                    value={filterResource}
                    onChange={(e) => setFilterResource(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {uniqueResources.map(resource => (
                      <option key={resource} value={resource}>
                        {resource === 'all' ? 'Toutes les ressources' : resource}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    {sortOrder === 'desc' ? '↓ Plus récent' : '↑ Plus ancien'}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tableau de l'historique */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            {history.length === 0 ? (
              <History className="text-gray-400" size={32} />
            ) : (
              <Search className="text-gray-400" size={32} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {history.length === 0 ? 'Aucun historique' : 'Aucun résultat trouvé'}
          </h3>
          <p className="text-gray-500 mb-6">
            {history.length === 0 
              ? 'Les actions que vous effectuerez apparaîtront ici' 
              : 'Modifiez vos critères de recherche pour voir plus de résultats'}
          </p>
          {history.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Filter size={16} />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ressource</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedHistory.map((entry) => {
                  const actionConfig = getActionConfig(entry.action)
                  const ActionIcon = actionConfig.icon
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${actionConfig.badge}`}>
                          <ActionIcon size={12} className={actionConfig.iconColor} />
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-md">
                          {entry.description}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredHistory.length}</span>
                {' entrées'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-gray-400 px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${
                    currentPage === totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fadeIn">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Vider l'historique</h3>
                <p className="text-gray-600">
                  Vous êtes sur le point de supprimer définitivement les <strong>{history.length}</strong> entrées de l'historique.
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleClearHistory}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Vider l'historique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}