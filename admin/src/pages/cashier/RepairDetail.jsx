import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Smartphone, User, Phone, Calendar, Clock,
  CheckCircle, AlertCircle, Wrench, FileText,
  Camera, Eye, DollarSign, CreditCard, Banknote,
  Send, RefreshCw, Download, Star, ThumbsUp, ThumbsDown,
  GoalIcon
} from 'lucide-react'
import { useCashierAuth } from '../../context/CashierAuthContext'
import api, { resolveMediaUrl } from '../../services/api'
import Toast from '../../components/Toast'
import { formatReference } from '../../utils/formatReference'

export default function CashierRepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useCashierAuth()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: ''
  })
  const [invoiceLink, setInvoiceLink] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showFullImage, setShowFullImage] = useState(null)

  const isAdminView = window.location.pathname.startsWith('/admin/cashier')
  const basePath = isAdminView ? '/admin/cashier' : '/cashier'

  useEffect(() => {
    fetchRepair()
  }, [id])

  const fetchRepair = async () => {
    try {
      const url = isAdminView ? `/api/admin/repairs/${id}` : `/api/cashier/repairs/${id}`
      const response = await api.get(url)
      setRepair(response.data.data)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement de la réparation' })
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePayment = async (e) => {
    e.preventDefault()
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setToast({ type: 'error', message: 'Veuillez saisir un montant valide' })
      return
    }

    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      
      // Mettre à jour le statut vers "paid" (payé)
      await api.put(`${base}/repairs/${id}/status`, {
        status: 'paid',
        saleInfo: {
          amount: parseFloat(paymentData.amount),
          amountPaid: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          paymentDate: new Date(),
          notes: paymentData.notes
        }
      })

      setInvoiceLink(`${base}/repairs/${id}/invoice`)
      setToast({ type: 'success', message: 'Paiement validé et facture générée' })
      setShowPaymentModal(false)
      fetchRepair() // Recharger les données
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors du paiement' })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle, label: 'Affecté' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GoalIcon, label: 'Terminé' },
      ready: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GoalIcon, label: 'Terminé' },

      paid: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: DollarSign, label: 'Payé' },
      pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle, label: 'En attente' },
      repairing: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle, label: 'En réparation' }
    }
    return configs[status] || { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle, label: status }
  }

  const getConditionConfig = (condition) => {
    const configs = {
      completed: { label: 'Réparé', icon: Star, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      ready: { label: 'Terminé', icon: Star, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      paid: { label: 'Payé', icon: ThumbsUp, color: 'text-green-600', bgColor: 'bg-green-50' },
      repairing: { label: 'En réparation', icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
      pending: { label: 'En attente', icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }
    return configs[condition] || { label: condition, icon: AlertCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleDownloadInvoice = async () => {
    try {
      const endpoint = invoiceLink || `${isAdminView ? '/api/admin' : '/api/cashier'}/repairs/${id}/invoice`
      const response = await api.get(endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `facture_reparation_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors du téléchargement de la facture' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-500">Réparation introuvable</p>
      </div>
    )
  }

  const statusConfig = getStatusConfig(repair.status)
  const StatusIcon = statusConfig.icon
  const conditionConfig = getConditionConfig(repair.status)
  const ConditionIcon = conditionConfig.icon
  
  // Le bouton de paiement est visible si le statut est 'accepted' (accepté par le technicien)
const isReadyForPayment = ['accepted', 'completed', 'ready'].includes(repair.status)
const isPaid = repair.status === 'paid'
const isVipRepair = Boolean(repair.isVip)
  return (
    <div className="eli-canvas eli-content">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {isVipRepair && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">Dossier VIP</p>
          <p className="text-sm text-amber-700">Cette réparation est facturée mensuellement au client VIP. Encaissement immédiat désactivé.</p>
        </div>
      )}

      {/* Barre de retour */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>
        <div className="h-6 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <Smartphone size={18} className="text-purple-600" />
          <span className="font-semibold text-gray-900">{formatReference(repair._id)}</span>
        </div>
      </div>

      {/* Notification facture */}
      {invoiceLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="font-bold text-blue-900">Facture générée</p>
            <p className="text-sm text-blue-700">Prête à être téléchargée</p>
          </div>
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2"
          >
            <Download size={14} /> Télécharger
          </button>
        </div>
      )}

      {/* En-tête réparation */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${repair.status === 'completed' ? 'from-blue-400 to-cyan-500' : 'from-purple-400 to-violet-500'}`}></div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{repair.deviceModel || 'Réparation'}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                <StatusIcon size={14} className="inline mr-1" />{statusConfig.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Calendar size={14} />
              Créé le {formatDate(repair.createdAt)}
            </p>
          </div>
          {isReadyForPayment && !isPaid && !isVipRepair && (
            <button
              onClick={() => {
                setPaymentData({
                  amount: (repair.price || 0).toString(),
                  paymentMethod: 'cash',
                  notes: ''
                })
                setShowPaymentModal(true)
              }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 shadow-sm flex items-center gap-2"
            >
              <Banknote size={18} />
              Encaisser le paiement
            </button>
          )}
          {isPaid && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
              <CheckCircle size={16} />
              Payé
            </div>
          )}
        </div>
      </div>

      {/* Détails client */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User size={20} className="text-blue-500" /> Informations Client
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase">Client</p>
            <p className="font-semibold">{repair.clientName || 'Non spécifié'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">WhatsApp</p>
            {repair.clientWhatsapp ? (
              <a href={`https://wa.me/${repair.clientWhatsapp.replace(/^\+/, '')}`} className="text-green-600 font-medium">
                {repair.clientWhatsapp}
              </a>
            ) : '-'}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Appareil à réparer</p>
            <p className="font-semibold">{repair.deviceModel || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">État de l'appareil</p>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${conditionConfig.bgColor} ${conditionConfig.color}`}>
              <ConditionIcon size={14} /> {conditionConfig.label}
            </div>
          </div> 
          <div>
            <p className="text-xs text-gray-400 uppercase">Problème signalé</p>
            <p className="font-semibold text-purple-600">{repair.issueDescription || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Valeur Dévis</p>
            <p className="font-bold text-emerald-600">{(repair.price || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      </div>

      {/* Rapport technicien */}
      {repair.technicianReport && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Wrench size={20} className="text-blue-500" /> Rapport du technicien
          </h2>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-gray-700">{repair.technicianReport}</p>
          </div>
        </div>
      )}

      {/* Photos */}
      {repair.photos?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Camera size={20} className="text-purple-500" /> Photos ({repair.photos.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {repair.photos.map((photo, i) => (
              <img
                key={i}
                src={resolveMediaUrl(photo)}
                alt={`Photo ${i+1}`}
                className="rounded-xl cursor-pointer hover:ring-2 ring-purple-300"
                onClick={() => setShowFullImage(photo)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Encaisser le paiement</h3>
              <p className="text-sm text-gray-500">{repair.clientName} – {repair.deviceModel}</p>
            </div>
            <form onSubmit={handleValidatePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Espèces', icon: Banknote },
                    { value: 'card', label: 'Carte', icon: CreditCard },
                    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                    { value: 'transfer', label: 'Virement', icon: Send },
                  ].map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentData({ ...paymentData, paymentMethod: m.value })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm ${
                        paymentData.paymentMethod === m.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <m.icon size={16} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Notes</label>
                <textarea
                  value={paymentData.notes}
                  onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 border rounded-xl">Annuler</button>
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                  {processing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={18} />}
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal image plein écran */}
      {showFullImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowFullImage(null)}>
          <img src={resolveMediaUrl(showFullImage)} alt="Agrandie" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  )
}