import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  Search, 
  Smartphone, 
  Package, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Tag,
  BarChart3
} from 'lucide-react'
import api from '../services/api'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('table') // 'table' ou 'grid'
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [filterStock, setFilterStock] = useState('all') // 'all', 'inStock', 'lowStock', 'outOfStock'
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const itemsPerPage = 12

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/admin/products')
      setProducts(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement des produits' })
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]
    
    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.price?.toString().includes(term)
      )
    }
    
    // Filtre statut
    if (filterStatus === 'active') {
      filtered = filtered.filter(p => p.active)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(p => !p.active)
    }
    
    // Filtre stock
    if (filterStock === 'inStock') {
      filtered = filtered.filter(p => p.stock >= 5)
    } else if (filterStock === 'lowStock') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock < 5)
    } else if (filterStock === 'outOfStock') {
      filtered = filtered.filter(p => p.stock === 0)
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'price' || sortBy === 'stock') {
        aVal = Number(aVal) || 0
        bVal = Number(bVal) || 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [products, searchTerm, filterStatus, filterStock, sortBy, sortOrder])

  const handleDelete = async (product) => {
    try {
      await api.delete(`/api/admin/products/${product._id}`)
      setToast({ type: 'success', message: 'Produit supprimé avec succès' })
      fetchProducts()
      setDeleteModal({ isOpen: false, product: null })
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la suppression' })
    }
  }

  const toggleStatus = async (product, e) => {
    if (e) e.stopPropagation()
    try {
      await api.put(`/api/admin/products/${product._id}`, {
        active: !product.active,
      })
      setToast({ type: 'success', message: `Produit ${!product.active ? 'activé' : 'désactivé'} avec succès` })
      fetchProducts()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('all')
    setFilterStock('all')
    setSortBy('name')
    setSortOrder('asc')
  }

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterStock !== 'all'

  // Statistiques avancées
  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter(p => p.active).length
    const inStock = products.filter(p => p.stock > 0).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 5).length
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + p.price, 0) / total : 0
    
    return { total, active, inStock, outOfStock, lowStock, totalValue, avgPrice }
  }, [products])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'text-red-600 bg-red-50', label: 'Rupture', icon: XCircle }
    if (stock < 5) return { color: 'text-orange-600 bg-orange-50', label: 'Stock faible', icon: AlertCircle }
    return { color: 'text-emerald-600 bg-emerald-50', label: 'En stock', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement du catalogue...</p>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Catalogue Produits
          </h1>
          <p className="text-gray-500 mt-1">Gérez votre inventaire de produits et téléphones</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button
            onClick={() => window.location.href = '/admin/products/new'}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouveau produit</span>
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total produits', 
            value: stats.total, 
            icon: Package, 
            gradient: 'from-blue-500 to-cyan-500',
            subtitle: `${stats.active} actifs`
          },
          { 
            label: 'Valeur stock', 
            value: `${(stats.totalValue / 1000000).toFixed(1)}M FCFA`, 
            icon: DollarSign, 
            gradient: 'from-emerald-500 to-green-500',
            subtitle: `Prix moyen: ${Math.round(stats.avgPrice).toLocaleString('fr-FR')} FCFA`
          },
          { 
            label: 'En stock', 
            value: stats.inStock, 
            icon: CheckCircle, 
            gradient: 'from-violet-500 to-purple-500',
            subtitle: `${stats.lowStock} en stock faible`
          },
          { 
            label: 'En rupture', 
            value: stats.outOfStock, 
            icon: AlertCircle, 
            gradient: stats.outOfStock > 0 ? 'from-red-500 to-rose-500' : 'from-gray-400 to-gray-500',
            subtitle: stats.outOfStock > 0 ? 'Nécessite réapprovisionnement' : 'Stock optimal'
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
                placeholder="Rechercher par nom, marque, catégorie ou prix..."
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
            
            <div className="flex gap-3">
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
          </div>

          {isFilterExpanded && (
            <div className="pt-4 border-t border-gray-100 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'active', label: 'Actifs' },
                      { value: 'inactive', label: 'Inactifs' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterStatus(option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterStatus === option.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'inStock', label: 'En stock' },
                      { value: 'lowStock', label: 'Faible' },
                      { value: 'outOfStock', label: 'Rupture' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterStock(option.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterStock === option.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Nom</option>
                    <option value="price">Prix</option>
                    <option value="stock">Stock</option>
                    <option value="brand">Marque</option>
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

      {/* Vue en grille */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock)
            const StockIcon = stockStatus.icon
            
            return (
              <div
                key={product._id}
                onClick={() => window.location.href = `/admin/products/${product._id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Smartphone size={24} className="text-blue-600" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => toggleStatus(product, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        product.active 
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteModal({ isOpen: true, product })
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{product.brand || 'Sans marque'}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600">
                    {product.price?.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${stockStatus.color}`}>
                    <StockIcon size={12} />
                    {product.stock} en stock
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {product.active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {product.active ? 'Actif' : 'Inactif'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = `/admin/products/${product._id}`
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    Modifier
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vue en tableau */}
      {viewMode === 'table' && (
        <>
          {paginatedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Package className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500 mb-6">Modifiez vos critères de recherche ou ajoutez un nouveau produit</p>
              <button
                onClick={() => window.location.href = '/admin/products/new'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Ajouter un produit
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock)
                      const StockIcon = stockStatus.icon
                      
                      return (
                        <tr 
                          key={product._id} 
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                          onClick={() => window.location.href = `/admin/products/${product._id}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <Smartphone size={18} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.brand || 'Sans marque'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-blue-600">
                              {product.price?.toLocaleString('fr-FR')} FCFA
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${stockStatus.color.split(' ')[0]}`}></div>
                              <span className={`font-medium ${stockStatus.color.split(' ')[0]}`}>
                                {product.stock}
                              </span>
                              {product.stock < 5 && product.stock > 0 && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                  Faible
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                              product.active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {product.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {product.active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={(e) => toggleStatus(product, e)}
                                className={`p-2 rounded-lg transition-all duration-200 ${
                                  product.active 
                                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={product.active ? 'Désactiver' : 'Activer'}
                              >
                                <Power size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `/admin/products/${product._id}`
                                }}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                                title="Modifier"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteModal({ isOpen: true, product })
                                }}
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
              
              {/* Pagination moderne */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' - '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)}</span>
                    {' sur '}
                    <span className="font-medium">{filteredAndSortedProducts.length}</span>
                    {' produits'}
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
                            <span className="text-gray-400">...</span>
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
        </>
      )}

      {/* Modal de confirmation suppression */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Confirmer la suppression"
        confirmText="Supprimer définitivement"
        isDanger={true}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={() => handleDelete(deleteModal.product)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="text-red-600" size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Supprimer le produit
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{deleteModal.product?.name}</strong>
                {deleteModal.product?.brand && ` - ${deleteModal.product.brand}`}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Cette action est irréversible. Le produit sera définitivement supprimé de votre catalogue.
          </p>
        </div>
      </Modal>
    </div>
  )
}