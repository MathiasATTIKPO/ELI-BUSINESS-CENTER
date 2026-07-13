import React, { useEffect, useState, useMemo } from 'react'
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  AlertCircle, 
  Box, 
  Tag, 
  DollarSign, 
  MapPin, 
  Truck, 
  Layers, 
  X, 
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  RefreshCw,
  ChevronDown,
  Zap,
  Shield,
  Info,
  CheckCircle  
} from 'lucide-react'
import api from '../services/api'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const itemsPerPage = 12

  const [formData, setFormData] = useState({
    name: '',
    category: 'screen',
    description: '',
    sku: '',
    quantity: 0,
    minQuantity: 5,
    unitPrice: 0,
    supplier: '',
    location: ''
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await api.get('/api/admin/inventory')
      setItems(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement de l\'inventaire' })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items]
    
    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term)
      )
    }
    
    // Filtre catégorie
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory)
    }
    
    // Filtre stock
    if (filterStock === 'inStock') {
      filtered = filtered.filter(item => item.quantity > item.minQuantity)
    } else if (filterStock === 'lowStock') {
      filtered = filtered.filter(item => item.quantity <= item.minQuantity && item.quantity > 0)
    } else if (filterStock === 'outOfStock') {
      filtered = filtered.filter(item => item.quantity === 0)
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'quantity' || sortBy === 'minQuantity' || sortBy === 'unitPrice') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [items, searchTerm, filterCategory, filterStock, sortBy, sortOrder])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      setToast({ type: 'error', message: 'Le nom de l\'article est requis' })
      return
    }
    if (!formData.sku) {
      setToast({ type: 'error', message: 'Le SKU est requis' })
      return
    }
    if (formData.unitPrice <= 0) {
      setToast({ type: 'error', message: 'Le prix unitaire doit être supérieur à 0' })
      return
    }

    try {
      if (editingItem) {
        await api.put(`/api/admin/inventory/${editingItem._id}`, formData)
        setToast({ type: 'success', message: 'Article mis à jour avec succès' })
      } else {
        await api.post('/api/admin/inventory', formData)
        setToast({ type: 'success', message: 'Article ajouté avec succès' })
      }

      fetchItems()
      setShowModal(false)
      resetForm()
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors de l\'enregistrement' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/inventory/${id}`)
      setToast({ type: 'success', message: 'Article supprimé avec succès' })
      fetchItems()
      setDeleteConfirm(null)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la suppression' })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'screen',
      description: '',
      sku: '',
      quantity: 0,
      minQuantity: 5,
      unitPrice: 0,
      supplier: '',
      location: ''
    })
    setEditingItem(null)
  }

  const openModal = (item = null) => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || 'screen',
        description: item.description || '',
        sku: item.sku || '',
        quantity: item.quantity || 0,
        minQuantity: item.minQuantity || 5,
        unitPrice: item.unitPrice || 0,
        supplier: item.supplier || '',
        location: item.location || ''
      })
      setEditingItem(item)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('all')
    setFilterStock('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterStock !== 'all'

  const getCategoryConfig = (category) => {
    const configs = {
      screen: { label: 'Écran', icon: '📱', color: 'bg-blue-50 text-blue-700 border-blue-200', gradient: 'from-blue-400 to-cyan-500' },
      battery: { label: 'Batterie', icon: '🔋', color: 'bg-green-50 text-green-700 border-green-200', gradient: 'from-green-400 to-emerald-500' },
      motherboard: { label: 'Carte mère', icon: '💻', color: 'bg-purple-50 text-purple-700 border-purple-200', gradient: 'from-purple-400 to-violet-500' },
      camera: { label: 'Caméra', icon: '📷', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', gradient: 'from-yellow-400 to-orange-500' },
      speaker: { label: 'Haut-parleur', icon: '🔊', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', gradient: 'from-indigo-400 to-blue-500' },
      charger: { label: 'Chargeur', icon: '⚡', color: 'bg-orange-50 text-orange-700 border-orange-200', gradient: 'from-orange-400 to-red-500' },
      case: { label: 'Coque', icon: '📱', color: 'bg-pink-50 text-pink-700 border-pink-200', gradient: 'from-pink-400 to-rose-500' },
      other: { label: 'Autre', icon: '📦', color: 'bg-gray-50 text-gray-700 border-gray-200', gradient: 'from-gray-400 to-gray-500' }
    }
    return configs[category] || configs.other
  }

  const getStockStatus = (quantity, minQuantity) => {
    if (quantity === 0) return { 
      label: 'Rupture', 
      icon: X, 
      color: 'bg-red-50 text-red-700 border-red-200',
      textColor: 'text-red-600'
    }
    if (quantity <= minQuantity) return { 
      label: 'Stock faible', 
      icon: AlertCircle, 
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      textColor: 'text-orange-600'
    }
    return { 
      label: 'En stock', 
      icon: CheckCircle, 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColor: 'text-emerald-600'
    }
  }

  // Statistiques avancées
  const stats = useMemo(() => {
    const total = items.length
    const inStock = items.filter(i => i.quantity > i.minQuantity).length
    const lowStock = items.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length
    const outOfStock = items.filter(i => i.quantity === 0).length
    const totalValue = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const needsReorder = items.filter(i => i.quantity <= i.minQuantity).length
    
    return { total, inStock, lowStock, outOfStock, totalValue, needsReorder }
  }, [items])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const paginatedItems = filteredAndSortedItems.slice(
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
            <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de l'inventaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Gestion d'Inventaire
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos pièces détachées, accessoires et stocks</p>
        </div>
        
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        >
          <Plus size={18} />
          Nouvel article
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total articles', 
            value: stats.total, 
            icon: Package, 
            gradient: 'from-teal-500 to-emerald-500',
            subtitle: `${stats.inStock} en stock optimal`
          },
          { 
            label: 'Valeur stock', 
            value: `${(stats.totalValue / 1000000).toFixed(1)}M`, 
            icon: DollarSign, 
            gradient: 'from-blue-500 to-cyan-500',
            subtitle: 'FCFA'
          },
          { 
            label: 'Stock faible', 
            value: stats.lowStock, 
            icon: AlertCircle, 
            gradient: 'from-amber-500 to-orange-500',
            subtitle: stats.lowStock > 0 ? 'À réapprovisionner' : 'Stock OK'
          },
          { 
            label: 'En rupture', 
            value: stats.outOfStock, 
            icon: X, 
            gradient: stats.outOfStock > 0 ? 'from-red-500 to-rose-500' : 'from-gray-400 to-gray-500',
            subtitle: stats.outOfStock > 0 ? 'Urgent' : 'Aucune rupture'
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
                placeholder="Rechercher par nom, SKU, catégorie, fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                  ? 'bg-teal-50 border-teal-300 text-teal-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={18} />
              Filtres avancés
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
              )}
              <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Toutes les catégories</option>
                    <option value="screen">📱 Écran</option>
                    <option value="battery">🔋 Batterie</option>
                    <option value="motherboard">💻 Carte mère</option>
                    <option value="camera">📷 Caméra</option>
                    <option value="speaker">🔊 Haut-parleur</option>
                    <option value="charger">⚡ Chargeur</option>
                    <option value="case">📱 Coque</option>
                    <option value="other">📦 Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</label>
                  <select
                    value={filterStock}
                    onChange={(e) => setFilterStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tous les états</option>
                    <option value="inStock">En stock</option>
                    <option value="lowStock">Stock faible</option>
                    <option value="outOfStock">En rupture</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="name">Nom</option>
                    <option value="quantity">Quantité</option>
                    <option value="unitPrice">Prix unitaire</option>
                    <option value="category">Catégorie</option>
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

      {/* Tableau modernisé */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <Warehouse className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun article trouvé</h3>
          <p className="text-gray-500 mb-6">
            {items.length === 0 
              ? 'Commencez par ajouter votre premier article à l\'inventaire' 
              : 'Modifiez vos critères de recherche pour voir plus de résultats'}
          </p>
          {items.length === 0 ? (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              Ajouter un article
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Article</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Emplacement</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedItems.map((item) => {
                  const categoryConfig = getCategoryConfig(item.category)
                  const stockStatus = getStockStatus(item.quantity, item.minQuantity)
                  const StatusIcon = stockStatus.icon
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${categoryConfig.gradient} flex items-center justify-center text-lg`}>
                            {categoryConfig.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${categoryConfig.color}`}>
                          {categoryConfig.icon}
                          {categoryConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-lg ${stockStatus.textColor}`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-gray-400">
                              / min {item.minQuantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${stockStatus.textColor.replace('text', 'bg')}`}></div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                              <StatusIcon size={10} />
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          {item.unitPrice?.toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {item.location || 'Non défini'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                            title="Supprimer"
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
          
          {/* Pagination modernisée */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)}</span>
                {' sur '}
                <span className="font-medium">{filteredAndSortedItems.length}</span>
                {' articles'}
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
                            ? 'bg-teal-600 text-white shadow-sm'
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

      {/* Modal d'ajout/modification modernisé */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Modifier l\'article' : 'Nouvel article'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Package size={16} className="text-teal-600" />
                Nom de l'article
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Ex: Écran iPhone 13"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Layers size={16} className="text-teal-600" />
                Catégorie
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              >
                <option value="screen">📱 Écran</option>
                <option value="battery">🔋 Batterie</option>
                <option value="motherboard">💻 Carte mère</option>
                <option value="camera">📷 Caméra</option>
                <option value="speaker">🔊 Haut-parleur</option>
                <option value="charger">⚡ Chargeur</option>
                <option value="case">📱 Coque</option>
                <option value="other">📦 Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag size={16} className="text-teal-600" />
                SKU (référence)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                placeholder="Ex: SCR-IP13-001"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <DollarSign size={16} className="text-emerald-600" />
                Prix unitaire (FCFA)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                min="0"
                step="100"
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Box size={16} className="text-teal-600" />
                Quantité en stock
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <AlertCircle size={16} className="text-amber-600" />
                Stock minimum
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                min="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ClipboardList size={16} className="text-teal-600" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              placeholder="Description détaillée de l'article..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Truck size={16} className="text-teal-600" />
                Fournisseur
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin size={16} className="text-teal-600" />
                Emplacement
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Étagère A-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <Save size={16} />
              {editingItem ? 'Mettre à jour' : 'Ajouter l\'article'}
            </button>
          </div>
        </form>
      </Modal>

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
                  Vous êtes sur le point de supprimer définitivement l'article
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-gray-900">{deleteConfirm.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{deleteConfirm.sku}</p>
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

// Ajoutez CheckCircle dans les imports