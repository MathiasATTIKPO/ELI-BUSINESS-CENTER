import React, { useEffect, useState, useMemo } from 'react'
import { 
  FileText, 
  Search, 
  Wrench, 
  Filter, 
  ChevronDown, 
  X,
  Calendar,
  User,
  Clock,
  Download,
  Eye
} from 'lucide-react'
import api from '../services/api'
import Table from '../components/Table'
import Toast from '../components/Toast'
import { formatReference } from '../utils/formatReference'
import { exportCsv } from '../utils/exportCsv'
import { logHistoryEntry } from '../utils/history'

export default function Repairs() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [technicians, setTechnicians] = useState([])
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  useEffect(() => {
    fetchRepairs()
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/admin/employees')
      const techList = response.data.data?.filter(e => e.role === 'technician') || []
      setTechnicians(techList)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens')
    }
  }

  const fetchRepairs = async () => {
    try {
      const response = await api.get('/api/admin/repairs')
      setRepairs(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = repairs.length
    const pending = repairs.filter(r => r.status === 'pending').length
    const inProgress = repairs.filter(r => r.status === 'repairing').length
    const ready = repairs.filter(r => r.status === 'ready').length
    const completed = repairs.filter(r => r.status === 'completed' || r.status === 'paid' || r.status === 'soldee').length
    
    return { total, pending, inProgress, ready, completed }
  }, [repairs])

const filteredRepairs = useMemo(() => {
  return repairs
    .filter((repair) => {
      const statusMatch = statusFilter === 'all' || repair.status === statusFilter
      const techMatch = technicianFilter === 'all' || repair.assignedTo?._id === technicianFilter
      const dateMatch = (!dateFrom || new Date(repair.createdAt) >= new Date(dateFrom)) &&
        (!dateTo || new Date(repair.createdAt) <= new Date(dateTo))
      const searchMatch = !searchTerm ||
        repair.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.clientWhatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repair._id?.toLowerCase().includes(searchTerm.toLowerCase())

      return statusMatch && techMatch && dateMatch && searchMatch
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ⬅️ Tri du plus récent au plus ancien
}, [repairs, statusFilter, technicianFilter, dateFrom, dateTo, searchTerm])

  const handleExportRepairs = () => {
    const csvRows = filteredRepairs.map((repair) => ({
      Référence: formatReference(repair._id),
      Client: repair.clientName || 'N/A',
      Téléphone: repair.clientWhatsapp || 'N/A',
      Technicien: repair.assignedTo?.name || 'N/A',
      Caissier: repair.saleInfo?.validatedBy || 'N/A',
      Statut: repair.status,
      Date: new Date(repair.createdAt).toLocaleDateString('fr-FR'),
      Montant: repair.saleInfo?.amountPaid || repair.price || 0,
    }))

    exportCsv(csvRows, 'reparations_export')
    logHistoryEntry({
      action: 'Export',
      resource: 'Réparations',
      description: `Export des ${csvRows.length} demandes de réparation`,
    })
    setToast({ type: 'success', message: 'Export CSV généré avec succès' })
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setTechnicianFilter('all')
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = statusFilter !== 'all' || technicianFilter !== 'all' || searchTerm || dateFrom || dateTo

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    repairing: { label: 'En réparation', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Wrench },
    ready: { label: 'Prêt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Wrench },
    completed: { label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-200', icon: Wrench },
    paid: { label: 'Payé', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench },
    soldee: { label: 'Soldée', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Wrench },
  }

  const columns = [
    { key: '_id', label: 'Réf', sortable: true, render: (val) => formatReference(val) },
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'clientWhatsapp', label: 'Téléphone', sortable: false, render: (val) => val ? (val.startsWith('+') ? val : `+${val}`) : 'N/A' },
    { key: 'assignedTo', label: 'Technicien', sortable: false, render: (assignedTo) => assignedTo?.name || 'Aucun' },
    { key: 'saleInfo', label: 'Caissier', sortable: false, render: (saleInfo) => saleInfo?.validatedBy || 'N/A' },
    {
      key: 'status',
      label: 'Statut',
      render: (val) => {
        const config = statusConfig[val] || { label: val, color: 'bg-gray-100 text-gray-800 border-gray-200' }
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('fr-FR'),
    },
  ]

  const actionColumn = (repair) => (
    <a 
      href={`/admin/repairs/${repair._id}`} 
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Eye size={14} />
      Détails
    </a>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-gray-600 animate-pulse">Chargement des réparations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* En-tête avec stats */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Demandes de Réparation
            </h1>
            <p className="text-gray-500 mt-1">Gérez et suivez les réparations de vos clients</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleExportRepairs}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: Wrench, color: 'from-indigo-500 to-purple-500' },
            { label: 'En attente', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500' },
            { label: 'En cours', value: stats.inProgress, icon: Wrench, color: 'from-blue-500 to-cyan-500' },
            { label: 'Prêtes', value: stats.ready, icon: Wrench, color: 'from-emerald-500 to-green-500' },
            { label: 'Terminées', value: stats.completed, icon: Wrench, color: 'from-green-500 to-teal-500' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}></div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-10`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Recherche principale */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client, téléphone, référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`inline-flex items-center gap-2 px-4 py-3 border rounded-xl transition-all duration-200 ${
                isFilterExpanded 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              Filtres
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
              <ChevronDown size={16} className={`transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filtres avancés */}
          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Technicien</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={technicianFilter}
                      onChange={(e) => setTechnicianFilter(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="all">Tous les techniciens</option>
                      {technicians.map(tech => (
                        <option key={tech._id} value={tech._id}>{tech.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="w-full py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'repairing', 'ready', 
        //'completed', 
        'paid'].map((status) => {
          const config = statusConfig[status]
          const isActive = statusFilter === status
          
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 font-medium text-sm ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {status === 'all' ? 'Tous les statuts' : config?.label || status}
            </button>
          )
        })}
      </div>

      {/* Tableau des réparations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {filteredRepairs.length} réparation{filteredRepairs.length > 1 ? 's' : ''} trouvée{filteredRepairs.length > 1 ? 's' : ''}
            </h2>
          </div>
          <Table
            columns={columns}
            data={filteredRepairs}
            actionColumn={actionColumn}
            searchField="clientName"
          />
        </div>
      </div>
    </div>
  )
}