import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, Edit2, Trash2, Power, Search, 
  CheckCircle, XCircle, Users, UserPlus, Mail, Phone,
  Filter, ChevronDown, ChevronLeft, ChevronRight, X,
  Download, Award, Calendar, TrendingUp, UserCheck, UserX,
  Wallet, Shield
} from 'lucide-react'
import Toast from '../../components/Toast'
import PageHeader from '../../components/PageHeader'
import api from '../../services/api'
import { exportCsv } from '../../utils/exportCsv'
import { logHistoryEntry } from '../../utils/history'

export default function VIPs() {
  const navigate = useNavigate()
  const [vips, setVips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchVIPs()
  }, [])

  const fetchVIPs = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/admin/vips')
      if (response.data.success) {
        setVips(response.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des clients VIP')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/admin/vips/${id}`)
      if (response.data.success) {
        setSuccess('Client VIP supprimé avec succès')
        setDeleteConfirm(null)
        fetchVIPs()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (vip) => {
    try {
      const response = await api.put(`/api/admin/vips/${vip._id}`, {
        isActive: !vip.isActive
      })
      if (response.data.success) {
        setSuccess(`Client VIP ${response.data.data.isActive ? 'activé' : 'désactivé'} avec succès`)
        logHistoryEntry({
          action: 'Mise à jour',
          resource: 'Client VIP',
          description: `Statut ${response.data.data.isActive ? 'activé' : 'désactivé'} pour ${vip.name}`,
        })
        fetchVIPs()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut')
    }
  }

  const handleExport = () => {
    const csvRows = filteredAndSorted.map(v => ({
      Nom: v.name || 'N/A',
      Téléphone: v.phone || 'N/A',
      Email: v.email || 'N/A',
      WhatsApp: v.whatsapp || 'N/A',
      'Limite mensuelle (FCFA)': v.monthlyLimit || 0,
      'Jour cycle facturation': v.billingCycleDay || 1,
      Statut: v.isActive ? 'Actif' : 'Inactif',
    }))
    exportCsv(csvRows, 'vips_export')
    logHistoryEntry({
      action: 'Export',
      resource: 'Clients VIP',
      description: `Export des ${csvRows.length} clients VIP`,
    })
    setSuccess('Export CSV généré avec succès')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchTerm || filterStatus !== 'all'

  const stats = useMemo(() => {
    const total = vips.length
    const active = vips.filter(v => v.isActive).length
    const inactive = vips.filter(v => !v.isActive).length
    const totalLimit = vips.reduce((sum, v) => sum + (v.monthlyLimit || 0), 0)
    return { total, active, inactive, totalLimit }
  }, [vips])

  const filteredAndSorted = useMemo(() => {
    let filtered = [...vips]
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(s) ||
        v.email?.toLowerCase().includes(s) ||
        v.phone?.toLowerCase().includes(s)
      )
    }
    if (filterStatus === 'active') {
      filtered = filtered.filter(v => v.isActive)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(v => !v.isActive)
    }
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || ''
      let bVal = b[sortBy] || ''
      if (sortBy === 'isActive') {
        aVal = aVal ? 1 : 0
        bVal = bVal ? 1 : 0
      }
      if (sortBy === 'monthlyLimit') {
        aVal = aVal || 0
        bVal = bVal || 0
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return filtered
  }, [vips, searchTerm, filterStatus, sortBy, sortOrder])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-amber-600"></div>
            <Award className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement des clients VIP...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Gestion des Clients VIP
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos clients bénéficiant du programme VIP</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/accounts')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <Users size={18} />
            <span className="hidden sm:inline">Retour Comptes</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button
            onClick={() => navigate('/admin/vips/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Nouveau VIP</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total VIP</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500 bg-opacity-10">
              <Users size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Actifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-green-500 bg-opacity-10">
              <UserCheck size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Inactifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inactive}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500 bg-opacity-10">
              <UserX size={20} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-500"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Limite totale</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalLimit.toLocaleString()} FCFA
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500 bg-opacity-10">
              <Wallet size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
                  ? 'bg-amber-50 border-amber-300 text-amber-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              Filtres
              {hasActiveFilters && <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>}
              <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="name">Nom</option>
                    <option value="isActive">Statut</option>
                    <option value="monthlyLimit">Limite mensuelle</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
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

      {/* Tableau */}
      {vips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Award className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun client VIP</h3>
          <p className="text-gray-500 mb-6">Commencez par ajouter votre premier client VIP</p>
          <button
            onClick={() => navigate('/admin/vips/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
          >
            <UserPlus size={18} />
            Créer un VIP
          </button>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat</h3>
          <p className="text-gray-500 mb-6">Modifiez vos critères de recherche</p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <Filter size={16} />
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client VIP</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paramètres</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((vip) => (
                  <tr key={vip._id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                          {vip.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{vip.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            Ajouté le {new Date(vip.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {vip.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {vip.email}
                          </div>
                        )}
                        {vip.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            {vip.phone}
                          </div>
                        )}
                        {vip.whatsapp && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <Phone size={14} className="text-green-400" />
                            {vip.whatsapp}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Wallet size={14} className="text-amber-500" />
                          <span>{vip.monthlyLimit?.toLocaleString() || 0} FCFA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-amber-500" />
                          <span>Cycle: {vip.billingCycleDay || 1}er</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                        vip.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {vip.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {vip.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(vip)}
                          title={vip.isActive ? 'Désactiver' : 'Activer'}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            vip.isActive 
                              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/vips/${vip._id}/edit`, { state: { vip } })}
                          title="Modifier"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(vip)}
                          title="Supprimer"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSorted.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredAndSorted.length}</span>
                {' VIP'}
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
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && <span className="text-gray-400 px-1">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'bg-amber-600 text-white shadow-sm'
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
                <p className="text-gray-600">
                  Vous êtes sur le point de supprimer définitivement ce client VIP
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {deleteConfirm.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{deleteConfirm.name}</p>
                      <p className="text-sm text-gray-500">{deleteConfirm.email || deleteConfirm.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}