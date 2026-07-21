import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useVIPAuth } from '../../hooks/useVIPAuth'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Toast from '../../components/Toast'
import { API_BASE_URL } from '../../services/api'
import {
  Award, FileText, DollarSign, TrendingUp, Wrench,
  Search, X, LogOut, RefreshCw, Phone, Calendar,
  AlertCircle, CheckCircle, Clock, Crown, User
} from 'lucide-react'

export default function VIPDashboard() {
  const { user, logout } = useVIPAuth()
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState({ totalBilled: 0, totalPaid: 0, totalBalance: 0 })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const itemsPerPage = 5

  // Formulaire de demande de réparation
  const [repairForm, setRepairForm] = useState({
    clientName: '',
    clientWhatsapp: '',
    deviceModel: '',
    issueDescription: '',
    notes: ''
  })

  // Chargement des données
  const loadData = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const [invRes, repairRes] = await Promise.all([
        api.get('/api/vip/portal/my-invoices'),
        api.get('/api/vip/portal/my-repairs')
      ])

      if (invRes.data?.success) {
        setInvoices(invRes.data.data?.invoices || [])
        setSummary(invRes.data.data?.summary || { totalBilled: 0, totalPaid: 0, totalBalance: 0 })
      }
      if (repairRes.data?.success) {
        setRepairs(repairRes.data.data || [])
      }

      setRepairForm((prev) => ({
        ...prev,
        clientName: user?.name || '',
        clientWhatsapp: user?.whatsapp || user?.phone || ''
      }))
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Erreur de chargement' })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Soumettre une demande de réparation
  const handleRepairRequest = async (e) => {
    e.preventDefault()
    if (!repairForm.deviceModel) {
      setToast({ type: 'error', message: 'Le modèle de l\'appareil est obligatoire.' })
      return
    }

    try {
      const res = await api.post('/api/vip/portal/repairs/request', repairForm)
      if (res.data?.success) {
        setToast({ type: 'success', message: 'Demande de réparation envoyée.' })
        setRepairForm((prev) => ({
          ...prev,
          deviceModel: '',
          issueDescription: '',
          notes: ''
        }))
        await loadData()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Impossible de créer la demande.' })
    }
  }

  // Déconnexion
  const handleLogout = () => {
    logout()
    navigate('/vip/login')
  }

  const openInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceModal(true)
  }

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false)
    setSelectedInvoice(null)
  }

  // Filtrage et pagination des factures
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices
    const term = searchTerm.toLowerCase()
    return invoices.filter(inv =>
      (inv.invoiceNumber || '').toLowerCase().includes(term) ||
      (inv.status || '').toLowerCase().includes(term)
    )
  }, [invoices, searchTerm])

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* En-tête avec déconnexion */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Espace Client VIP
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <User size={16} className="text-amber-500" />
              Bienvenue, <span className="font-semibold">{user?.name || 'Client'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total facturé', value: `${(summary.totalBilled || 0).toLocaleString()} FCFA`, icon: FileText, grad: 'from-amber-500 to-orange-500' },
            { label: 'Total payé', value: `${(summary.totalPaid || 0).toLocaleString()} FCFA`, icon: CheckCircle, grad: 'from-emerald-500 to-green-500' },
            { label: 'Solde restant', value: `${(summary.totalBalance || 0).toLocaleString()} FCFA`, icon: AlertCircle, grad: 'from-red-500 to-rose-500' },
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
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une facture (numéro, statut)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Liste des factures */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-amber-600" />
                Mes factures
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-3" />
                <p>Aucune facture trouvée</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {paginatedInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-semibold text-gray-900">{inv.invoiceNumber || `Facture #${String(inv._id).slice(-6)}`}</p>
                        <p className="text-sm text-gray-600">
                          Période: {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          inv.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                          inv.status === 'partially_paid' ? 'bg-amber-100 text-amber-700' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          inv.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inv.status === 'draft' ? 'Brouillon' :
                           inv.status === 'issued' ? 'Emise' :
                           inv.status === 'partially_paid' ? 'Partiellement payee' :
                           inv.status === 'paid' ? 'Payee' :
                           inv.status === 'cancelled' ? 'Annulee' :
                           inv.status === 'overdue' ? 'En retard' :
                           inv.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">{(inv.total || 0).toLocaleString()} FCFA</p>
                        <p className="text-xs text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        <button
                          type="button"
                          onClick={() => openInvoiceModal(inv)}
                          className="text-xs text-gray-700 hover:underline mt-1 mr-2"
                        >
                          Consulter
                        </button>
                        {inv.pdfPath && (
                          <button
                            type="button"
                            onClick={() => {
                              const url = inv.pdfPath.startsWith('http') ? inv.pdfPath : `${API_BASE_URL}${inv.pdfPath}`
                              window.open(url, '_blank')
                            }}
                            className="text-xs text-blue-600 hover:underline mt-1"
                          >
                            Voir PDF
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage} total={totalPages} onChange={setCurrentPage} />
              </>
            )}
          </div>

          {/* Formulaire de demande de réparation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={20} className="text-orange-500" />
                Demander une réparation
              </h2>
            </div>
            <form onSubmit={handleRepairRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Modèle *</label>
                <input
                  type="text"
                  value={repairForm.deviceModel}
                  onChange={(e) => setRepairForm({ ...repairForm, deviceModel: e.target.value })}
                  placeholder="Ex: iPhone 12"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description du problème</label>
                <textarea
                  value={repairForm.issueDescription}
                  onChange={(e) => setRepairForm({ ...repairForm, issueDescription: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="Décrivez le problème..."
                />
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Le prix de reparation est defini uniquement par l'equipe interne.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={repairForm.notes}
                  onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                  rows={1}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="Informations complémentaires..."
                />
              </div>
              {/* Champs cachés pour clientName et clientWhatsapp (pré-remplis) */}
              <input type="hidden" value={repairForm.clientName} />
              <input type="hidden" value={repairForm.clientWhatsapp} />

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition shadow-md hover:shadow-lg"
              >
                Envoyer la demande
              </button>
            </form>
          </div>
        </div>

        {/* Historique des réparations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" />
              Historique des réparations
            </h2>
          </div>
          {repairs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Wrench size={48} className="mx-auto mb-3" />
              <p>Aucune réparation enregistrée.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {repairs.slice(0, 10).map((r) => (
                <div key={r._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{r.deviceModel}</p>

                {showInvoiceModal && selectedInvoice && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeInvoiceModal}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-900">Consultation facture VIP</h3>
                        <p className="text-sm text-gray-500">Numéro: {selectedInvoice.invoiceNumber || `Facture #${String(selectedInvoice._id).slice(-6)}`}</p>
                        <p className="text-sm text-gray-500">Date création: {new Date(selectedInvoice.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-gray-50 border rounded-xl p-3">
                            <p className="text-xs text-gray-500">Statut</p>
                            <p className="font-semibold text-gray-900">
                              {selectedInvoice.status === 'issued' ? 'Émise' : selectedInvoice.status === 'paid' ? 'Payée' : selectedInvoice.status === 'cancelled' ? 'Annulée' : selectedInvoice.status}
                            </p>
                          </div>
                          <div className="bg-gray-50 border rounded-xl p-3">
                            <p className="text-xs text-gray-500">Montant total</p>
                            <p className="font-semibold text-gray-900">{Number(selectedInvoice.total || 0).toLocaleString('fr-FR')} FCFA</p>
                          </div>
                          <div className="bg-gray-50 border rounded-xl p-3">
                            <p className="text-xs text-gray-500">Nombre de réparations</p>
                            <p className="font-semibold text-gray-900">{(selectedInvoice.repairs || []).length}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                              <tr>
                                <th className="px-3 py-2 text-left">Réparation</th>
                                <th className="px-3 py-2 text-left">Téléphone</th>
                                <th className="px-3 py-2 text-left">IMEI</th>
                                <th className="px-3 py-2 text-left">Travaux réalisés</th>
                                <th className="px-3 py-2 text-left">Montant</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {(selectedInvoice.repairs || []).map((line, index) => (
                                <tr key={line.repairId || index}>
                                  <td className="px-3 py-2">{String(line.repairId || '').slice(-6).toUpperCase() || '-'}</td>
                                  <td className="px-3 py-2">{line.deviceModel || '-'}</td>
                                  <td className="px-3 py-2">{line.imei || '-'}</td>
                                  <td className="px-3 py-2">{line.description || '-'}</td>
                                  <td className="px-3 py-2 font-semibold text-amber-700">{Number(line.total || 0).toLocaleString('fr-FR')} FCFA</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="text-sm text-amber-800">Total facture: <span className="font-bold">{Number(selectedInvoice.total || 0).toLocaleString('fr-FR')} FCFA</span></p>
                          <p className="text-sm text-amber-800">Historique paiement: {(selectedInvoice.payments || []).length} enregistrement(s)</p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                              <tr>
                                <th className="px-3 py-2 text-left">Date paiement</th>
                                <th className="px-3 py-2 text-left">Montant</th>
                                <th className="px-3 py-2 text-left">Mode</th>
                                <th className="px-3 py-2 text-left">Référence</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {(selectedInvoice.payments || []).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-3 py-3 text-gray-500">Aucun paiement enregistré.</td>
                                </tr>
                              ) : (
                                (selectedInvoice.payments || []).map((p, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2">{new Date(p.paidAt).toLocaleString('fr-FR')}</td>
                                    <td className="px-3 py-2">{Number(p.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                                    <td className="px-3 py-2">{p.method || '-'}</td>
                                    <td className="px-3 py-2">{p.reference || '-'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end">
                          <button type="button" onClick={closeInvoiceModal} className="px-5 py-2.5 border rounded-xl">Fermer</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                    <p className="text-sm text-gray-600">{r.issueDescription || 'Réparation'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {r.status === 'completed' ? 'Terminée' :
                       r.status === 'in_progress' ? 'En cours' :
                       r.status === 'pending' ? 'En attente' : r.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(r.date || r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ========== COMPOSANT PAGINATION ==========
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