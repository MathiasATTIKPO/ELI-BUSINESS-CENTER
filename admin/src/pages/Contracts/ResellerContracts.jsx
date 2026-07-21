import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Briefcase, FileDown, Clock } from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function ResellerContracts() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [resellers, setResellers] = useState([])
  const [catalogPhones, setCatalogPhones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showContractModal, setShowContractModal] = useState(false)
  const [creatingContract, setCreatingContract] = useState(false)
  const [processingActionId, setProcessingActionId] = useState('')
  const [downloadingContractId, setDownloadingContractId] = useState('')
  const isActionBusy = Boolean(processingActionId)
  const [declarationModal, setDeclarationModal] = useState({ open: false, action: '', contract: null })
  const [declarationForm, setDeclarationForm] = useState({ amount: '', note: '' })
  const [contractForm, setContractForm] = useState({
    targetType: 'existing',
    resellerId: '',
    resellerName: '',
    resellerPhone: '',
    resellerWhatsapp: '',
    resellerEmail: '',
    resellerAddress: '',
    resellerNotes: '',
    productId: '',
    imei: '',
    negotiatedPrice: '',
    expectedSalePrice: ''
  })

  // ⭐ État pour le modal de relance
  const [showRenewDelayModal, setShowRenewDelayModal] = useState(false)
  const [selectedContractForRenew, setSelectedContractForRenew] = useState(null)
  const [newDelayHours, setNewDelayHours] = useState(5)

  const loadContracts = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/api/admin/resellers/contracts/all')
      if (response.data?.success) {
        setContracts(response.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les contrats revendeur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContracts()
  }, [])

  const openContractModal = async () => {
    setShowContractModal(true)
    try {
      const [resellersRes, catalogRes] = await Promise.all([
        api.get('/api/admin/resellers'),
        api.get('/api/admin/resellers/catalog')
      ])

      if (resellersRes.data?.success) {
        setResellers(resellersRes.data.data || [])
      }
      if (catalogRes.data?.success) {
        setCatalogPhones(catalogRes.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les données de création de contrat')
      setResellers([])
      setCatalogPhones([])
    }
  }

  const resetContractForm = () => {
    setContractForm({
      targetType: 'existing',
      resellerId: '',
      resellerName: '',
      resellerPhone: '',
      resellerWhatsapp: '',
      resellerEmail: '',
      resellerAddress: '',
      resellerNotes: '',
      productId: '',
      imei: '',
      negotiatedPrice: '',
      expectedSalePrice: ''
    })
  }

  const closeContractModal = () => {
    setShowContractModal(false)
    setCreatingContract(false)
    setCatalogPhones([])
    resetContractForm()
  }

  const handleCreateContract = async (e) => {
    e.preventDefault()
    if (!contractForm.productId) {
      setError('Veuillez sélectionner un téléphone.')
      return
    }

    if (contractForm.targetType === 'existing' && !contractForm.resellerId) {
      setError('Veuillez sélectionner un revendeur existant.')
      return
    }

    if (contractForm.targetType === 'new' && (!contractForm.resellerName || !contractForm.resellerPhone)) {
      setError('Nom et téléphone du revendeur sont obligatoires pour un revendeur sans compte.')
      return
    }

    try {
      setCreatingContract(true)
      const selectedPhone = catalogPhones.find((item) => item._id === contractForm.productId)

      const payload = {
        productId: contractForm.productId,
        imei: contractForm.imei,
        negotiatedPrice: Number(contractForm.negotiatedPrice) || 0,
        expectedSalePrice: Number(contractForm.expectedSalePrice) || 0,
        catalogPrice: Number(selectedPhone?.unitPrice || 0)
      }

      if (contractForm.targetType === 'existing') {
        payload.resellerId = contractForm.resellerId
      } else {
        payload.resellerName = contractForm.resellerName
        payload.resellerPhone = contractForm.resellerPhone
        payload.resellerWhatsapp = contractForm.resellerWhatsapp
        payload.resellerEmail = contractForm.resellerEmail
        payload.resellerAddress = contractForm.resellerAddress
        payload.resellerNotes = contractForm.resellerNotes
      }

      const response = await api.post('/api/admin/resellers/contracts', payload)
      if (response.data?.success) {
        setSuccess('Contrat revendeur créé avec succès.')
        closeContractModal()
        await loadContracts()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du contrat revendeur')
    } finally {
      setCreatingContract(false)
    }
  }

  const handleContractAction = async (contractId, nextStatus, extraPayload = {}) => {
    try {
      setProcessingActionId(contractId)
      setError('')

      const response = await api.put(`/api/admin/resellers/contracts/${contractId}/status`, {
        status: nextStatus,
        ...extraPayload
      })

      if (response.data?.success) {
        if (nextStatus === 'approved') {
          setSuccess('Contrat accepté. En attente du retrait du téléphone.')
        } else if (nextStatus === 'active') {
          setSuccess('Retrait confirmé. Le compte à rebours de 48h est démarré.')
        } else if (nextStatus === 'sold') {
          setSuccess('Déclaration de vente enregistrée. Validation mutuelle en cours.')
        } else if (nextStatus === 'returned') {
          setSuccess('Déclaration de retour enregistrée. Validation mutuelle en cours.')
        }
        await loadContracts()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre à jour le statut du contrat')
    } finally {
      setProcessingActionId('')
    }
  }

  const openDeclarationModal = (contract, action) => {
    setDeclarationModal({ open: true, action, contract })
    setDeclarationForm({
      amount: action === 'sold' ? String(contract?.saleInfo?.amount || contract?.expectedSalePrice || contract?.negotiatedPrice || '') : '',
      note: ''
    })
  }

  const closeDeclarationModal = () => {
    setDeclarationModal({ open: false, action: '', contract: null })
    setDeclarationForm({ amount: '', note: '' })
  }

  const submitDeclaration = async (event) => {
    event.preventDefault()
    const { contract, action } = declarationModal
    if (!contract || !action) return

    if (action === 'sold') {
      const amount = Number(declarationForm.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Montant invalide pour la vente.')
        return
      }

      await handleContractAction(contract._id, 'sold', {
        saleInfo: {
          amount,
          note: declarationForm.note,
          declaredAt: new Date().toISOString(),
          declaredBy: 'admin'
        }
      })
    } else {
      await handleContractAction(contract._id, 'returned', {
        saleInfo: {
          note: declarationForm.note,
          returnedAt: new Date().toISOString(),
          declaredBy: 'admin'
        }
      })
    }

    closeDeclarationModal()
  }

  // ⭐ Fonctions pour la relance du délai
  const openRenewDelayModal = (contract) => {
    setSelectedContractForRenew(contract)
    setNewDelayHours(5)
    setShowRenewDelayModal(true)
  }

  const closeRenewDelayModal = () => {
    setShowRenewDelayModal(false)
    setSelectedContractForRenew(null)
    setNewDelayHours(5)
  }

  const handleRenewDelay = async () => {
    if (!selectedContractForRenew) return
    if (newDelayHours < 1) {
      setError('Le délai doit être d\'au moins 1 heure.')
      return
    }

    try {
      setProcessingActionId(selectedContractForRenew._id)
      setError('')

      const response = await api.put(`/api/admin/resellers/contracts/${selectedContractForRenew._id}/renew-delay`, {
        delayHours: newDelayHours
      })

      if (response.data?.success) {
        setSuccess(`Délai relancé avec succès (${newDelayHours}h).`)
        closeRenewDelayModal()
        await loadContracts()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de relancer le délai.')
    } finally {
      setProcessingActionId('')
    }
  }

  // ===== STATISTIQUES AVEC "PAIEMENT NON REÇU" =====
  const stats = useMemo(() => {
    const total = contracts.length
    const pending = contracts.filter((c) => c.status === 'pending').length
    const approved = contracts.filter((c) => c.status === 'approved').length
    const active = contracts.filter((c) => c.status === 'active').length
    const sold = contracts.filter((c) => c.status === 'sold').length
    const returned = contracts.filter((c) => c.status === 'returned').length
    const expired = contracts.filter((c) => c.status === 'expired').length
    const generatedAmount = contracts.reduce((sum, c) => sum + (c.saleInfo?.amount || 0), 0)

    const unpaid = contracts.filter((c) => {
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

    return { total, pending, approved, active, sold, returned, expired, generatedAmount, unpaid }
  }, [contracts])

  // ===== FILTRE AVEC "PAIEMENT NON REÇU" =====
  const filteredContracts = useMemo(() => {
    let items = [...contracts]

    if (statusFilter === 'unpaid') {
      items = items.filter((c) => {
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
      })
    } else if (statusFilter !== 'all') {
      items = items.filter((c) => c.status === statusFilter)
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      items = items.filter((c) =>
        c.number?.toLowerCase().includes(s) ||
        c.reseller?.name?.toLowerCase().includes(s) ||
        c.product?.name?.toLowerCase().includes(s)
      )
    }

    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [contracts, searchTerm, statusFilter])

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-violet-50 text-violet-700 border-violet-200',
      active: 'bg-blue-50 text-blue-700 border-blue-200',
      sold: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      returned: 'bg-slate-50 text-slate-700 border-slate-200',
      expired: 'bg-red-50 text-red-700 border-red-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200',
      unpaid: 'bg-red-100 text-red-800 border-red-300'
    }
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      approved: 'Validé',
      active: 'Actif',
      sold: 'Vendu',
      returned: 'Retourné',
      expired: 'Expiré',
      closed: 'Clôturé',
      unpaid: 'Paiement Non Reçu'
    }
    return labels[status] || 'Inconnu'
  }

  const downloadContractPdf = async (contract) => {
    try {
      setDownloadingContractId(contract._id)
      const response = await api.get(`/api/invoices/contracts/${contract._id}`, {
        responseType: 'blob'
      })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `contrat_revendeur_${contract.number || contract._id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de télécharger le contrat PDF')
    } finally {
      setDownloadingContractId('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement des contrats...</p>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Contrats Revendeurs</h1>
          <p className="text-gray-500 mt-1">Suivi global des contrats, statuts et performance.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openContractModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Briefcase size={16} />
            Nouveau contrat
          </button>
          <button
            type="button"
            onClick={loadContracts}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* TABLEAU DE BORD */}
      <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Validés</p>
          <p className="text-2xl font-bold text-violet-700">{stats.approved}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-blue-700">{stats.active}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Vendus</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.sold}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Retournés</p>
          <p className="text-2xl font-bold text-slate-700">{stats.returned}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">CA généré</p>
          <p className="text-2xl font-bold text-indigo-700">{stats.generatedAmount.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white border-2 border-red-500 rounded-xl p-4 shadow-md shadow-red-100">
          <p className="text-xs text-red-500 font-semibold">⚠️ Paiement Non Reçu</p>
          <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par numéro, revendeur ou téléphone"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Validé (attente retrait)</option>
            <option value="active">Actif</option>
            <option value="sold">Vendu</option>
            <option value="returned">Retourné</option>
            <option value="expired">Expiré</option>
            <option value="closed">Clôturé</option>
            <option value="unpaid" className="text-red-600 font-semibold">⚠️ Paiement Non Reçu</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-3">N° contrat</th>
                <th className="py-3 pr-3">Revendeur</th>
                <th className="py-3 pr-3">Téléphone</th>
                <th className="py-3 pr-3">Échéance</th>
                <th className="py-3 pr-3">Statut</th>
                <th className="py-3 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => {
                const isUnpaid = statusFilter === 'unpaid' || (
                  contract.status === 'sold' &&
                  !(contract.payment?.status === 'paid' && contract.payment?.paidByRole === 'cashier') &&
                  !(contract.history || []).some(h => h.action === 'cash_collected' && h.byRole === 'cashier')
                )

                return (
                  <tr key={contract._id} className={`border-b last:border-b-0 ${isUnpaid ? 'bg-red-50/50' : ''}`}>
                    <td className="py-3 pr-3 font-medium text-gray-900">{contract.number}</td>
                    <td className="py-3 pr-3 text-gray-700">{contract.reseller?.name || '-'}</td>
                    <td className="py-3 pr-3 text-gray-700">{contract.product?.name || '-'}</td>
                    <td className="py-3 pr-3 text-gray-700">{Number(contract.expectedSalePrice || contract.negotiatedPrice || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-3 pr-3 text-gray-700">{contract.dueAt ? new Date(contract.dueAt).toLocaleString('fr-FR') : '-'}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${isUnpaid ? 'bg-red-100 text-red-800 border-red-300' : getStatusBadge(contract.status)}`}>
                        {isUnpaid ? '⚠️ Paiement Non Reçu' : getStatusLabel(contract.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {contract.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleContractAction(contract._id, 'approved')}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
                          >
                            {processingActionId === contract._id ? 'Traitement...' : 'Accepter'}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadContractPdf(contract)}
                            disabled={downloadingContractId === contract._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <FileDown size={14} />
                            {downloadingContractId === contract._id ? 'Téléchargement...' : 'Contrat PDF'}
                          </button>
                        </div>
                      )}
                      {contract.status === 'approved' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleContractAction(contract._id, 'active')}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {processingActionId === contract._id ? 'Traitement...' : 'Confirmer retrait'}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadContractPdf(contract)}
                            disabled={downloadingContractId === contract._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <FileDown size={14} />
                            {downloadingContractId === contract._id ? 'Téléchargement...' : 'Contrat PDF'}
                          </button>
                        </div>
                      )}
                      {contract.status === 'active' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDeclarationModal(contract, 'returned')}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {processingActionId === contract._id ? 'Traitement...' : 'Déclarer retour'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeclarationModal(contract, 'sold')}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {processingActionId === contract._id ? 'Traitement...' : 'Déclarer vendu'}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadContractPdf(contract)}
                            disabled={downloadingContractId === contract._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <FileDown size={14} />
                            {downloadingContractId === contract._id ? 'Téléchargement...' : 'Contrat PDF'}
                          </button>
                        </div>
                      )}
                      {/* ⭐ Bouton "Relancer" pour les contrats non encaissés */}
                      {isUnpaid && (
                        <button
                          type="button"
                          onClick={() => openRenewDelayModal(contract)}
                          disabled={isActionBusy}
                          className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60 flex items-center gap-1 mt-1"
                        >
                          <Clock size={12} />
                          Relancer
                        </button>
                      )}
                      {!['pending', 'approved', 'active'].includes(contract.status) && !isUnpaid && (
                        <button
                          type="button"
                          onClick={() => downloadContractPdf(contract)}
                          disabled={downloadingContractId === contract._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          <FileDown size={14} />
                          {downloadingContractId === contract._id ? 'Téléchargement...' : 'Contrat PDF'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-8 text-gray-500">Aucun contrat trouvé.</div>
        )}
      </div>

      {/* MODAL CRÉATION CONTRAT */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Créer un contrat revendeur</h3>
            <p className="text-sm text-gray-500 mb-6">Vous pouvez créer un contrat pour un revendeur existant ou un revendeur sans compte.</p>

            <form onSubmit={handleCreateContract} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setContractForm((prev) => ({ ...prev, targetType: 'existing' }))}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${contractForm.targetType === 'existing' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  Revendeur existant
                </button>
                <button
                  type="button"
                  onClick={() => setContractForm((prev) => ({ ...prev, targetType: 'new' }))}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${contractForm.targetType === 'new' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  Revendeur sans compte
                </button>
              </div>

              {contractForm.targetType === 'existing' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Revendeur</label>
                  <select
                    value={contractForm.resellerId}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  >
                    <option value="">Sélectionner un revendeur</option>
                    {resellers.map((reseller) => (
                      <option key={reseller._id} value={reseller._id}>
                        {reseller.name} - {reseller.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom revendeur *"
                    value={contractForm.resellerName}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerName: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Téléphone *"
                    value={contractForm.resellerPhone}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerPhone: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp"
                    value={contractForm.resellerWhatsapp}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerWhatsapp: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contractForm.resellerEmail}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerEmail: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={contractForm.resellerAddress}
                    onChange={(e) => setContractForm((prev) => ({ ...prev, resellerAddress: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg sm:col-span-2"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Téléphone à attribuer</label>
                <select
                  value={contractForm.productId}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                >
                  <option value="">Sélectionner un téléphone en stock</option>
                  {catalogPhones.map((phone) => (
                    <option key={phone._id} value={phone._id}>
                      {phone.name} - Stock: {phone.quantity} - Prix: {(phone.unitPrice || 0).toLocaleString('fr-FR')} FCFA
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="IMEI (optionnel)"
                  value={contractForm.imei}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, imei: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Prix négocié"
                  value={contractForm.negotiatedPrice}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, negotiatedPrice: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                />
                {/*  <input
                  type="number"
                  placeholder="Prix final attendu"
                  value={contractForm.expectedSalePrice}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, expectedSalePrice: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                /> */}
              </div>

              {contractForm.targetType === 'new' && (
                <textarea
                  rows={2}
                  placeholder="Notes (optionnel)"
                  value={contractForm.resellerNotes}
                  onChange={(e) => setContractForm((prev) => ({ ...prev, resellerNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeContractModal}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={creatingContract}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                  disabled={creatingContract}
                >
                  {creatingContract ? 'Création...' : 'Créer le contrat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉCLARATION */}
      {declarationModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDeclarationModal}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5">
              <h3 className="text-xl font-bold text-gray-900">
                {declarationModal.action === 'sold' ? 'Déclarer la vente' : 'Déclarer le retour'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {declarationModal.contract?.number} - {declarationModal.contract?.product?.name || 'Téléphone'}
              </p>
            </div>

            <form onSubmit={submitDeclaration} className="space-y-4">
              {declarationModal.action === 'sold' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Montant vendu (FCFA) *</label>
                  <input
                    type="number"
                    value={declarationForm.amount}
                    onChange={(e) => setDeclarationForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Note</label>
                <textarea
                  value={declarationForm.note}
                  onChange={(e) => setDeclarationForm((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder={declarationModal.action === 'sold' ? 'Informations complémentaires sur la vente...' : 'Motif ou détails du retour...'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeDeclarationModal} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={isActionBusy} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60">
                  {isActionBusy ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐ MODAL RELANCE DÉLAI */}
      {showRenewDelayModal && selectedContractForRenew && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeRenewDelayModal}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock size={20} className="text-amber-600" />
                Relancer le délai d'encaissement
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Contrat #{selectedContractForRenew.number} - {selectedContractForRenew.reseller?.name || 'Revendeur'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                ⚠️ Le délai actuel est expiré. Vous pouvez relancer un nouveau compte à rebours pour permettre l'encaissement.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nouveau délai (en heures) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={newDelayHours}
                  onChange={(e) => setNewDelayHours(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">Délai minimum : 1h — Maximum : 72h</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeRenewDelayModal}
                  className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRenewDelay}
                  disabled={processingActionId === selectedContractForRenew._id}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {processingActionId === selectedContractForRenew._id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Clock size={18} />
                      Relancer le délai
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}