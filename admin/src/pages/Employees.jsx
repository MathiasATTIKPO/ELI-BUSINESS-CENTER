import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  AlertCircle, 
  FileText, 
  Search, 
  ShieldCheck, 
  Wrench, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Users, 
  UserPlus,
  Mail,
  Phone,
  Star,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Briefcase,
  Award,
  Clock,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import api from '../services/api'
import { exportCsv } from '../utils/exportCsv'
import { logHistoryEntry } from '../utils/history'

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/admin/employees')
      if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des employés')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (id) => {
    try {
      const response = await api.delete(`/api/admin/employees/${id}`)
      if (response.data.success) {
        setSuccess('Employé supprimé avec succès')
        setDeleteConfirm(null)
        fetchEmployees()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleEmployeeStatus = async (employee) => {
    try {
      const response = await api.put(`/api/admin/employees/${employee._id}`, {
        isActive: !employee.isActive
      })
      if (response.data.success) {
        setSuccess(`Employé ${response.data.data.isActive ? 'activé' : 'désactivé'} avec succès`)
        logHistoryEntry({
          action: 'Mise à jour',
          resource: 'Employé',
          description: `Statut ${response.data.data.isActive ? 'activé' : 'désactivé'} pour ${employee.name}`,
        })
        fetchEmployees()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut')
    }
  }

  const handleExportEmployees = () => {
    const csvRows = filteredAndSortedEmployees.map((employee) => ({
      Nom: employee.name || 'N/A',
      Email: employee.email || 'N/A',
      Téléphone: employee.phone || 'N/A',
      Rôle: employee.role || 'N/A',
      Statut: employee.isActive ? 'Actif' : 'Inactif',
      Compétences: Array.isArray(employee.skills) ? employee.skills.join(', ') : '-',
    }))

    exportCsv(csvRows, 'employes_export')
    logHistoryEntry({
      action: 'Export',
      resource: 'Employés',
      description: `Export des ${csvRows.length} employés`,
    })
    setSuccess('Export CSV généré avec succès')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterRole('all')
    setFilterStatus('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchTerm || filterRole !== 'all' || filterStatus !== 'all'

  // Statistiques
  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter(e => e.isActive).length
    const inactive = employees.filter(e => !e.isActive).length
    const technicians = employees.filter(e => e.role === 'technician').length
    const cashiers = employees.filter(e => e.role === 'cashier').length
    const admins = employees.filter(e => e.role === 'admin').length
    
    return { total, active, inactive, technicians, cashiers, admins }
  }, [employees])

  const getRoleConfig = (role) => {
    const configs = {
      admin: { 
        label: 'Administrateur', 
        icon: ShieldCheck, 
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        gradient: 'from-purple-400 to-violet-500',
        badge: '👑'
      },
      technician: { 
        label: 'Technicien', 
        icon: Wrench, 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        gradient: 'from-blue-400 to-cyan-500',
        badge: '🔧'
      },
      cashier: { 
        label: 'Caissier', 
        icon: CreditCard, 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        gradient: 'from-emerald-400 to-green-500',
        badge: '💳'
      },
    }
    return configs[role] || { 
      label: role || 'Inconnu', 
      icon: Briefcase, 
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      gradient: 'from-gray-400 to-gray-500',
      badge: '👤'
    }
  }

  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees]
    
    // Recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(employee =>
        employee.name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.phone?.toLowerCase().includes(search) ||
        employee.role?.toLowerCase().includes(search)
      )
    }
    
    // Filtre rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(employee => employee.role === filterRole)
    }
    
    // Filtre statut
    if (filterStatus === 'active') {
      filtered = filtered.filter(employee => employee.isActive)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(employee => !employee.isActive)
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'isActive') {
        aVal = aVal ? 1 : 0
        bVal = bVal ? 1 : 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [employees, searchTerm, filterRole, filterStatus, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredAndSortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement des employés...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gestion des Employés
          </h1>
          <p className="text-gray-500 mt-1">Gérez votre équipe, leurs rôles et permissions</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportEmployees}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button
            onClick={() => navigate('/admin/employees/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Nouvel employé</span>
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total employés', 
            value: stats.total, 
            icon: Users, 
            gradient: 'from-blue-500 to-cyan-500',
            subtitle: `${stats.active} actifs`
          },
          { 
            label: 'Techniciens', 
            value: stats.technicians, 
            icon: Wrench, 
            gradient: 'from-purple-500 to-violet-500',
            subtitle: 'Réparations'
          },
          { 
            label: 'Caissiers', 
            value: stats.cashiers, 
            icon: CreditCard, 
            gradient: 'from-emerald-500 to-green-500',
            subtitle: 'Ventes'
          },
          { 
            label: 'Administrateurs', 
            value: stats.admins, 
            icon: ShieldCheck, 
            gradient: 'from-amber-500 to-orange-500',
            subtitle: 'Gestion'
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
                placeholder="Rechercher par nom, email, téléphone ou rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={18} />
              Filtres
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              )}
              <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Administrateur</option>
                    <option value="technician">Technicien</option>
                    <option value="cashier">Caissier</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Nom</option>
                    <option value="role">Rôle</option>
                    <option value="isActive">Statut</option>
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

      {/* Liste des employés */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Users className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun employé</h3>
          <p className="text-gray-500 mb-6">Commencez par ajouter votre premier employé</p>
          <button
            onClick={() => navigate('/admin/employees/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <UserPlus size={18} />
            Créer un employé
          </button>
        </div>
      ) : filteredAndSortedEmployees.length === 0 ? (
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employé</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compétences</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedEmployees.map((employee) => {
                  const roleConfig = getRoleConfig(employee.role)
                  const RoleIcon = roleConfig.icon
                  
                  return (
                    <tr key={employee._id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${roleConfig.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                            {employee.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{employee.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar size={12} />
                              Ajouté le {new Date(employee.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            {employee.email || 'N/A'}
                          </div>
                          {employee.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={14} className="text-gray-400" />
                              {employee.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                          <span>{roleConfig.badge}</span>
                          <RoleIcon size={12} />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(employee.skills) && employee.skills.length > 0 ? (
                            <>
                              {employee.skills.slice(0, 2).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                  {skill}
                                </span>
                              ))}
                              {employee.skills.length > 2 && (
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                                  +{employee.skills.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          employee.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {employee.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {employee.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleEmployeeStatus(employee)}
                            title={employee.isActive ? 'Désactiver' : 'Activer'}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              employee.isActive 
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/employees/${employee._id}`, { state: { employee } })}
                            title="Modifier"
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(employee)}
                            title="Supprimer"
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredAndSortedEmployees.length}</span>
                {' employés'}
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
                            ? 'bg-blue-600 text-white shadow-sm'
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

      {/* Modal de confirmation suppression */}
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
                  Vous êtes sur le point de supprimer définitivement l'employé
                </p>
                <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center text-white font-bold">
                      {deleteConfirm.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{deleteConfirm.name}</p>
                      <p className="text-sm text-gray-500">{deleteConfirm.email}</p>
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
                onClick={() => handleDeleteEmployee(deleteConfirm._id)}
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