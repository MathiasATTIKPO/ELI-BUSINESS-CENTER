import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useResellerAuth } from '../../hooks/useResellerAuth'
import api from '../../services/api'
import Toast from '../../components/Toast'
import {
  ShoppingBag, RefreshCw, DollarSign, TrendingUp,
  Search, X, Clock, Phone, Store,
  FileText, Calendar, LogOut, AlertCircle, Filter
} from 'lucide-react'

export default function ResellerDashboard() {
  const { user, logout } = useResellerAuth()
  const [contracts, setContracts] = useState([])
  const [catalog, setCatalog] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [catalogFilter, setCatalogFilter] = useState('all')
  const itemsPerPage = 5

  const [requestForm, setRequestForm] = useState({
    productId: '',
    proposedPrice: '',
    expectedSalePrice: '',
    comment: ''
  })

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    contract: null,
    action: null
  })
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [declarationForm, setDeclarationForm] = useState({
    amount: '',
    realSalePrice: '',
    note: ''
  })

  // ⭐ Fonction pour calculer le temps restant avant expiration du délai d'encaissement
  const getRemainingTime = useCallback((contract) => {
    if (contract.status !== 'sold') return null

    const isPaidByCashier = 
      contract.payment?.status === 'paid' && 
      contract.payment?.paidByRole === 'cashier'
    if (isPaidByCashier) return { status: 'paid', label: '✅ Encaissé', color: 'text-emerald-600' }

    const hasCashCollection = (contract.history || []).some(
      (h) => h.action === 'cash_collected' && h.byRole === 'cashier'
    )
    if (hasCashCollection) return { status: 'paid', label: '✅ Encaissé', color: 'text-emerald-600' }

    const declaredAt = contract.saleInfo?.declaredAt || contract.confirmation?.finalizedAt
    if (!declaredAt) return null

    const elapsedMs = Date.now() - new Date(declaredAt).getTime()
    const remainingMs = Math.max(0, 5 * 60 * 60 * 1000 - elapsedMs)
    const remainingHours = remainingMs / (1000 * 60 * 60)

    if (remainingHours <= 0) {
      return { status: 'expired', label: '⏰ Délai expiré !', color: 'text-red-600 font-bold' }
    }

    const hours = Math.floor(remainingHours)
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000)

    return {
      status: 'pending',
      label: `${hours}h ${minutes}m ${seconds}s`,
      color: hours < 1 ? 'text-orange-600 font-bold' : 'text-gray-600'
    }
  }, [])

  // ⭐ Calcul des ventes non encaissées
  const unpaidCount = useMemo(() => {
    return contracts.filter((c) => {
      if (c.status !== 'sold') return false

      const isPaidByCashier = 
        c.payment?.status === 'paid' && 
        c.payment?.paidByRole === 'cashier'
      if (isPaidByCashier) return false

      const hasCashCollection = (c.history || []).some(
        (h) => h.action === 'cash_collected' && h.byRole === 'cashier'
      )
      if (hasCashCollection) return false

      const declaredAt = c.saleInfo?.declaredAt || c.confirmation?.finalizedAt
      if (!declaredAt) return false

      const hoursElapsed = (Date.now() - new Date(declaredAt).getTime()) / (1000 * 60 * 60)
      return hoursElapsed >= 5
    }).length
  }, [contracts])

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [contractsRes, catalogRes, statsRes] = await Promise.all([
        api.get('/api/reseller/contracts/me'),
        api.get('/api/reseller/catalog'),
        api.get('/api/reseller/stats/me')
      ])

      if (contractsRes.data?.success) setContracts(contractsRes.data.data || [])
      if (catalogRes.data?.success) setCatalog(catalogRes.data.data || [])
      if (statsRes.data?.success) setStats(statsRes.data.data || null)
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Erreur de chargement' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?._id) loadDashboard()
  }, [user, loadDashboard])

  // ⭐ Timer pour mettre à jour les délais en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setContracts(prev => [...prev])
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRequestPhone = async (e) => {
    e.preventDefault()
    if (!requestForm.productId) {
      setToast({ type: 'error', message: 'Veuillez sélectionner un téléphone.' })
      return
    }

    try {
      const payload = {
        productId: requestForm.productId,
        proposedPrice: Number(requestForm.proposedPrice) || 0,
        expectedSalePrice: Number(requestForm.expectedSalePrice) || 0,
        comment: requestForm.comment
      }
      const res = await api.post('/api/reseller/request', payload)
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Demande envoyée. En attente de validation.' })
        setRequestForm({ productId: '', proposedPrice: '', expectedSalePrice: '', comment: '' })
        await loadDashboard()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Impossible d\'envoyer la demande.' })
    }
  }

  const openConfirmModal = (contract, action) => {
    setDeclarationForm({
      amount: action === 'sold' ? String(contract?.saleInfo?.amount || contract?.expectedSalePrice || contract?.negotiatedPrice || '') : '',
      realSalePrice: '',
      note: ''
    })
    setConfirmModal({ open: true, contract, action })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, contract: null, action: null })
    setDeclarationForm({ amount: '', realSalePrice: '', note: '' })
  }

  const executeContractAction = async () => {
    const { contract, action } = confirmModal
    if (!contract) return

    try {
      setActionSubmitting(true)
      let payload = {}
      if (action === 'sold') {
        const numAmount = Number(declarationForm.amount)
        if (!Number.isFinite(numAmount) || numAmount <= 0) {
          setToast({ type: 'error', message: 'Montant invalide.' })
          return
        }

        const realSalePrice = declarationForm.realSalePrice.trim() !== '' ? Number(declarationForm.realSalePrice) : null
        if (declarationForm.realSalePrice.trim() !== '' && (!Number.isFinite(realSalePrice) || realSalePrice <= 0)) {
          setToast({ type: 'error', message: 'Prix réel invalide.' })
          return
        }

        payload = {
          status: 'sold',
          saleInfo: {
            amount: numAmount,
            realSalePrice: realSalePrice || undefined,
            note: declarationForm.note,
            declaredAt: new Date().toISOString(),
            declaredBy: 'reseller'
          }
        }
      } else {
        payload = {
          status: 'returned',
          saleInfo: { returnedAt: new Date().toISOString(), declaredBy: 'reseller', note: declarationForm.note }
        }
      }

      const res = await api.put(`/api/reseller/contracts/${contract._id}/status`, payload)
      if (res.data?.success) {
        setToast({ type: 'success', message: res.data?.message || `Contrat ${contract.number} : déclaration enregistrée.` })
        closeConfirmModal()
        await loadDashboard()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Erreur lors de l\'action.' })
    } finally {
      setActionSubmitting(false)
    }
  }

  const filteredContracts = useMemo(() => {
    if (!searchTerm) return contracts
    const term = searchTerm.toLowerCase()
    return contracts.filter(c =>
      c.number?.toLowerCase().includes(term) ||
      c.product?.name?.toLowerCase().includes(term) ||
      c.status?.toLowerCase().includes(term)
    )
  }, [contracts, searchTerm])

  // ⭐ Filtrage du catalogue
  const filteredCatalog = useMemo(() => {
    if (catalogFilter === 'available') {
      return catalog.filter(item => item.quantity > 0)
    }
    return catalog
  }, [catalog, catalogFilter])

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage)
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const activeContracts = contracts.filter(c => c.status === 'active')
  const pendingContracts = contracts.filter(c => c.status === 'pending')
  const statsData = stats || {
    activeContracts: activeContracts.length,
    pendingContracts: pendingContracts.length,
    totalGenerated: contracts.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0),
    successRate: contracts.length ? Math.round((contracts.filter(c => c.status === 'sold').length / contracts.length) * 100) : 0
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/reseller/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Espace Revendeur
            </h1>
            <p className="text-gray-500 mt-1">Bienvenue, <span className="font-semibold">{user?.name || 'Revendeur'}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline font-medium">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* ⭐ Cartes statistiques avec la carte "Ventes non encaissées" */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Contrats en cours', value: statsData.activeContracts, icon: ShoppingBag, grad: 'from-emerald-500 to-teal-500' },
            { label: 'Demandes en attente', value: statsData.pendingContracts, icon: Clock, grad: 'from-amber-500 to-orange-500' },
            { label: 'Montant généré', value: `${(statsData.totalGenerated || 0).toLocaleString()} FCFA`, icon: DollarSign, grad: 'from-blue-500 to-cyan-500' },
            { label: 'Taux de réussite', value: `${statsData.successRate || 0}%`, icon: TrendingUp, grad: 'from-purple-500 to-violet-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${stat.grad}`}>
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          ))}
          {/* ⭐ Carte "Ventes non encaissées" en rouge */}
          <div className="bg-white border-2 border-red-300 rounded-2xl p-5 hover:shadow-md transition-shadow bg-red-50/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                  <AlertCircle size={14} className="text-red-500" />
                  Ventes non encaissées
                </p>
                <p className="text-2xl font-bold text-red-700 mt-1">{unpaidCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500">
                <AlertCircle size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par numéro de contrat, produit, statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <h2 className="text-lg font-bold text-gray-900">Mes contrats</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-3" />
                <p>Aucun contrat trouvé</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {paginatedContracts.map((c) => {
                    const remainingTime = getRemainingTime(c)
                    return (
                      <div key={c._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                        <div className="flex-1 min-w-[180px]">
                          <p className="font-semibold text-gray-900">#{c.number}</p>
                          <p className="text-sm text-gray-600">{c.product?.name || 'Téléphone'}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              c.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              c.status === 'approved' ? 'bg-violet-100 text-violet-700' :
                              c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              c.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                              c.status === 'returned' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {c.status === 'active' ? 'En cours' :
                               c.status === 'approved' ? 'Validé (attente retrait)' :
                               c.status === 'pending' ? 'En attente' :
                               c.status === 'sold' ? 'Vendu' :
                               c.status === 'returned' ? 'Retourné' :
                               c.status}
                            </span>
                            {c.dueAt && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(c.dueAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {/* ⭐ Affichage du délai restant pour l'encaissement */}
                          {c.status === 'sold' && remainingTime && (
                            <div className="mt-1">
                              <p className={`text-xs ${remainingTime.color}`}>
                                {remainingTime.label}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {c.status === 'active' && (
                            <>
                              <button
                                onClick={() => openConfirmModal(c, 'returned')}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                              >
                                Retourner
                              </button>
                              <button
                                onClick={() => openConfirmModal(c, 'sold')}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg text-xs font-medium hover:from-emerald-700 hover:to-green-700 transition shadow-sm"
                              >
                                Vendu
                              </button>
                            </>
                          )}
                          {c.status === 'sold' && (
                            <span className="text-sm font-bold text-emerald-600">
                              {c.saleInfo?.amount?.toLocaleString() || 0} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Pagination page={currentPage} total={totalPages} onChange={setCurrentPage} />
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
              <h2 className="text-lg font-bold text-gray-900">Demander un téléphone</h2>
            </div>
            <form onSubmit={handleRequestPhone} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Produit *</label>
                <select
                  value={requestForm.productId}
                  onChange={(e) => setRequestForm({ ...requestForm, productId: e.target.value })}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {filteredCatalog.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix proposé (FCFA)</label>
                <input
                  type="number"
                  value={requestForm.proposedPrice}
                  onChange={(e) => setRequestForm({ ...requestForm, proposedPrice: e.target.value })}
                  placeholder="Montant proposé"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix de vente attendu (FCFA)</label>
                <input
                  type="number"
                  value={requestForm.expectedSalePrice}
                  onChange={(e) => setRequestForm({ ...requestForm, expectedSalePrice: e.target.value })}
                  placeholder="Prix de vente estimé"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commentaire</label>
                <textarea
                  value={requestForm.comment}
                  onChange={(e) => setRequestForm({ ...requestForm, comment: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Informations complémentaires..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-md hover:shadow-lg"
              >
                Envoyer la demande
              </button>
            </form>
          </div>
        </div>

        {/* ⭐ Catalogue avec filtre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-white flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Phone size={20} className="text-teal-600" />
              Téléphones disponibles
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={catalogFilter}
                onChange={(e) => setCatalogFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Tous</option>
                <option value="available">Disponibles uniquement</option>
              </select>
            </div>
          </div>
          {filteredCatalog.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Store size={48} className="mx-auto mb-3" />
              <p>{catalogFilter === 'available' ? 'Aucun téléphone disponible actuellement.' : 'Aucun téléphone enregistré.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {filteredCatalog.map((item) => (
                <div key={item._id} className={`border rounded-xl p-4 hover:shadow-md transition ${item.quantity === 0 ? 'bg-gray-100 opacity-60' : 'bg-gray-50/30'}`}>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Catégorie: {item.category || 'N/A'}</p>
                  <p className={`text-sm font-medium mt-2 ${item.quantity === 0 ? 'text-red-500' : 'text-emerald-700'}`}>
                    Stock: {item.quantity}
                  </p>
                  <p className="text-sm font-bold text-blue-700">{(item.unitPrice || 0).toLocaleString()} FCFA</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeConfirmModal}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">
                {confirmModal.action === 'sold' ? 'Vendre le téléphone' : 'Retourner le téléphone'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                {confirmModal.action === 'sold'
                  ? `Déclarez la vente du contrat #${confirmModal.contract?.number} avec les informations nécessaires.`
                  : `Déclarez le retour du téléphone pour le contrat #${confirmModal.contract?.number}.`
                }
              </p>
              {confirmModal.action === 'sold' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Montant reversé (FCFA) *</label>
                    <input
                      type="number"
                      value={declarationForm.amount}
                      onChange={(e) => setDeclarationForm((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Prix réel de vente</label>
                    <input
                      type="number"
                      value={declarationForm.realSalePrice}
                      onChange={(e) => setDeclarationForm((prev) => ({ ...prev, realSalePrice: e.target.value }))}
                      className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Note</label>
                <textarea
                  value={declarationForm.note}
                  onChange={(e) => setDeclarationForm((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder={confirmModal.action === 'sold' ? 'Détails sur la vente...' : 'Détails sur le retour...'}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={closeConfirmModal}
                  className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={executeContractAction}
                  disabled={actionSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-medium shadow-sm disabled:opacity-60"
                >
                  {actionSubmitting ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
      <span className="text-sm text-gray-500">Page {page} / {total}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition"
        >
          ←
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === total}
          className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition"
        >
          →
        </button>
      </div>
    </div>
  )
}