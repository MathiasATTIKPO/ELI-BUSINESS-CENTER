import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Smartphone, User, Phone, Calendar,
  CheckCircle, AlertCircle, RefreshCw, FileText, Clock,
  Camera, Eye, DollarSign, CreditCard, Banknote, Package,
  Send, Download, Tag, Star, ThumbsUp, ThumbsDown, UserCheck
} from 'lucide-react'
import { useCashierAuth } from '../../hooks/useCashierAuth'
import api, { resolveMediaUrl } from '../../services/api'
import Toast from '../../components/Toast'
import { formatReference } from '../../utils/formatReference'

export default function CashierTradeInDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useCashierAuth()
  const [tradein, setTradein] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

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

  useEffect(() => {
    fetchTradein()
  }, [id])

  const fetchTradein = async () => {
    try {
      const url = isAdminView ? `/api/admin/tradeins/${id}` : `/api/cashier/tradeins/${id}`
      const response = await api.get(url)
      setTradein(response.data.data)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur chargement' })
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePayment = async (e) => {
    e.preventDefault()
    
    const amountValue = parseFloat(paymentData.amount)
    const proposedValue = tradein.proposedValue || 0
    
    if (!paymentData.amount || amountValue <= 0) {
      setToast({ type: 'error', message: 'Veuillez saisir un montant valide' })
      return
    }
    
    if (amountValue < proposedValue) {
      setToast({ type: 'error', message: `Le montant doit être au moins égal à ${proposedValue.toLocaleString('fr-FR')} FCFA` })
      return
    }

    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      
      // Appel à la route /pay qui existe déjà dans ton backend
      const paymentPayload = {
        amount: amountValue,
        paymentMethod: paymentData.paymentMethod,
        notes: paymentData.notes || ''
      }
      
      const response = await api.put(`${base}/tradeins/${id}/pay`, paymentPayload)
      
      // Générer la facture
      try {
        const invoiceResponse = await api.post('/api/invoice/generate', {
          requestType: 'tradein',
          requestId: id,
          clientName: tradein.clientName,
          clientWhatsapp: tradein.clientWhatsapp,
          amount: amountValue,
          paymentMethod: paymentData.paymentMethod,
          paymentDate: new Date().toISOString()
        })

        setInvoiceLink(`${base}/tradeins/${id}/invoice`)
      } catch (invoiceError) {
        console.error('Erreur génération facture:', invoiceError)
      }
      
      setToast({ type: 'success', message: 'Paiement validé avec succès' })
      setShowPaymentModal(false)
      
      setTimeout(() => {
        fetchTradein()
      }, 1000)
      
    } catch (error) {
      console.error('Erreur paiement:', error)
      const errorMessage = error.response?.data?.message || 'Erreur lors du paiement'
      setToast({ type: 'error', message: errorMessage })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'En attente' },
      assigned: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: UserCheck, label: 'Assigné' },
      accepted: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle, label: 'Accepté - Prêt pour paiement' },
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Complété' },
      paid: { color: 'bg-green-50 text-green-700 border-green-200', icon: DollarSign, label: 'Payé' },
      refused: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, label: 'Refusé' }
    }
    return configs[status] || { color: 'bg-gray-50 text-gray-700', icon: AlertCircle, label: status }
  }

  const getConditionConfig = (condition) => {
    const configs = {
      new: { label: 'Neuf', icon: Star, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      'like-new': { label: 'Comme neuf', icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      good: { label: 'Bon état', icon: ThumbsUp, color: 'text-green-600', bgColor: 'bg-green-50' },
      fair: { label: 'Moyen', icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
      poor: { label: 'Mauvais', icon: ThumbsDown, color: 'text-red-600', bgColor: 'bg-red-50' }
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
      const endpoint = invoiceLink || `${isAdminView ? '/api/admin' : '/api/cashier'}/tradeins/${id}/invoice`
      const response = await api.get(endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `facture_echange_${id}.pdf`)
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    )
  }

  if (!tradein) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-500">Échange introuvable</p>
      </div>
    )
  }

  const statusConfig = getStatusConfig(tradein.status)
  const StatusIcon = statusConfig.icon
  const conditionConfig = getConditionConfig(tradein.condition)
  const ConditionIcon = conditionConfig.icon
  
  // Le caissier peut payer uniquement si le statut est 'accepted'
  const canPay = tradein.status === 'accepted'
  const isPaid = tradein.status === 'paid'

  return (
    <div className="eli-canvas eli-content">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Retour
        </button>
        <div className="h-6 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-purple-600" />
          <span className="font-semibold">{formatReference(tradein._id)}</span>
        </div>
      </div>

      {/* Notification facture */}
      {invoiceLink && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            <div>
              <p className="font-bold text-gray-900">Facture générée</p>
              <p className="text-sm text-gray-600">Le paiement a été enregistré</p>
            </div>
          </div>
          <button 
            onClick={handleDownloadInvoice} 
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm flex items-center gap-2 hover:bg-blue-700"
          >
            <Download size={14} /> Télécharger
          </button>
        </div>
      )}

      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${
          isPaid ? 'from-emerald-400 to-green-500' : 
          tradein.status === 'accepted' ? 'from-blue-400 to-cyan-500' : 
          'from-gray-400 to-gray-500'
        }`}></div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{tradein.deviceModel || 'Échange'}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                <StatusIcon size={14} className="inline mr-1" />{statusConfig.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Calendar size={14} />
              Créé le {formatDate(tradein.createdAt)}
            </p>
          </div>
          
          {/* Bouton de paiement - UNIQUEMENT pour statut 'accepted' */}
          {canPay && !isPaid && (
            <button
              onClick={() => {
                setPaymentData({
                  amount: (tradein.proposedValue || 0).toString(),
                  paymentMethod: 'cash',
                  notes: ''
                })
                setShowPaymentModal(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 shadow-md flex items-center gap-2"
            >
              <Banknote size={18} /> Encaisser et générer la facture
            </button>
          )}
          
          {/* Badge payé */}
          {isPaid && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium border border-emerald-200">
              <CheckCircle size={16} /> Payé le {tradein.saleInfo?.paymentDate ? formatDate(tradein.saleInfo.paymentDate) : formatDate(new Date())}
            </div>
          )}
        </div>
      </div>

      {/* Informations client */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <User size={20} className="text-blue-500" />
          Informations client
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase">Client</p>
            <p className="font-semibold">{tradein.clientName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">WhatsApp</p>
            {tradein.clientWhatsapp ? (
              <a href={`https://wa.me/${tradein.clientWhatsapp.replace(/^\+/, '')}`} className="text-green-600 font-medium flex items-center gap-1">
                <Phone size={14} /> {tradein.clientWhatsapp}
              </a>
            ) : '-'}
          </div>
        </div>
      </div>

      {/* Informations du téléphone */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Smartphone size={20} className="text-purple-500" />
          Téléphone à échanger
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase">Modèle</p>
            <p className="font-semibold">{tradein.deviceModel || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">État</p>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${conditionConfig.bgColor} ${conditionConfig.color}`}>
              <ConditionIcon size={14} /> {conditionConfig.label}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Produit souhaité</p>
            <p className="font-semibold text-purple-600">{tradein.targetProduct || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Valeur proposée</p>
            <p className="font-bold text-emerald-600 text-xl">{(tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>

        {/* Photos */}
        {tradein.photos?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Camera size={14} className="text-gray-500" /> Photos ({tradein.photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {tradein.photos.map((photo, i) => (
                <img
                  key={i}
                  src={resolveMediaUrl(photo)}
                  alt=""
                  className="rounded-lg cursor-pointer hover:ring-2 ring-purple-300"
                  onClick={() => setShowFullImage(photo)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {tradein.description && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <FileText size={20} className="text-amber-500" /> Description
          </h2>
          <div className="bg-amber-50 p-4 rounded-xl">{tradein.description}</div>
        </div>
      )}

      {/* Rapport technicien */}
      {tradein.technicianReport && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" /> Rapport du technicien
          </h2>
          <div className="bg-blue-50 p-4 rounded-xl">{tradein.technicianReport}</div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Validation du paiement</h3>
              <p className="text-sm text-gray-500 mt-1">{tradein.clientName} – {tradein.deviceModel}</p>
              <p className="text-sm text-emerald-600 font-semibold mt-1">
                Montant: {(tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA
              </p>
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
                  min={tradein.proposedValue || 0}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Méthode</label>
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
          <img src={resolveMediaUrl(showFullImage)} alt="" className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}
    </div>
  )
}