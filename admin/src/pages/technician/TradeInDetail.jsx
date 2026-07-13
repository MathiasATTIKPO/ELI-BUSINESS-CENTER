import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Package, CheckCircle, XCircle, AlertCircle, Clock, UserCheck,
  ArrowLeft, Smartphone, User, Phone, Calendar, DollarSign,
  RefreshCw, FileText, Camera, Eye, Star, Shield, Tag,
  MessageSquare, Send, Save, Zap, TrendingUp, Award,
  ThumbsUp, ThumbsDown, ClipboardCheck, CreditCard, Download,
  Printer, Banknote, Wallet
} from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'
import Modal from '../../components/Modal'
import { formatReference } from '../../utils/formatReference'

export default function TechnicianTradeInDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tradein, setTradein] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [updateStatusModal, setUpdateStatusModal] = useState({ isOpen: false, status: '' })
  const [technicianReport, setTechnicianReport] = useState('')
  const [updating, setUpdating] = useState(false)
  const [showFullImage, setShowFullImage] = useState(null)

  const resolveMediaUrl = (value) => {
    if (!value) return value
    if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001').replace(/\/+$/, '')
    return value.startsWith('/uploads') ? `${base}${value}` : value
  }

  // ========== ÉTATS POUR LA VALIDATION DE PAIEMENT ==========
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: ''
  })
  const [invoiceLink, setInvoiceLink] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchTradein()
  }, [id])

  const fetchTradein = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/technician/tradein/${id}`)
      setTradein(response.data.data)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setToast({ type: 'error', message: 'Erreur lors du chargement de la demande' })
    } finally {
      setLoading(false)
    }
  }


const handleUpdateStatus = async () => {
    if (!updateStatusModal.status) return
    
    setUpdating(true)
    try {
      const updateData = { status: updateStatusModal.status }
      if (technicianReport) {
        updateData.technicianReport = technicianReport
      }
      
      await api.put(`/api/technician/tradein/${id}/status`, updateData)
      
      setToast({ type: 'success', message: `Statut mis à jour : ${
        updateStatusModal.status === 'accepted' ? 'Accepté' :
        updateStatusModal.status === 'refused' ? 'Refusé' :
        'Complété (en attente de paiement)'
      }` })
      setUpdateStatusModal({ isOpen: false, status: '' })
      setTechnicianReport('')
      fetchTradein()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors de la mise à jour' })
    } finally {
      setUpdating(false)
    }
  }

  // ========== GESTION DU PAIEMENT ==========
 /* const handleValidatePayment = async (e) => {
    e.preventDefault()
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setToast({ type: 'error', message: 'Veuillez saisir un montant valide' })
      return
    }

    setProcessingPayment(true)
    try {
      // 1. Mise à jour du statut avec les informations de paiement
      await api.put(`/api/technician/tradein/${id}/status`, {
        status: 'completed',
        technicianReport: technicianReport || 'Échange finalisé avec paiement',
        saleInfo: {
          amount: parseFloat(paymentData.amount),
          amountPaid: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          paymentDate: new Date(),
          notes: paymentData.notes
        }
      })

      // 2. Génération de la facture
      const invoiceResponse = await api.post('/api/invoice/generate', {
        requestType: 'tradein',
        requestId: id,
        clientName: tradein.clientName,
        clientWhatsapp: tradein.clientWhatsapp,
        amount: parseFloat(paymentData.amount)
      })

      const invoiceUrl = invoiceResponse?.data?.data?.pdfUrl
      const fullInvoiceUrl = invoiceUrl?.startsWith('http') 
        ? invoiceUrl 
        : `${API_BASE_URL}${invoiceUrl}`
      
      setInvoiceLink(fullInvoiceUrl)
      setToast({ type: 'success', message: 'Paiement validé et facture générée avec succès !' })
      setShowPaymentModal(false)
      setPaymentData({ amount: '', paymentMethod: 'cash', notes: '' })
      fetchTradein()
    } catch (error) {
      console.error('Erreur paiement:', error)
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors de la validation du paiement' })
    } finally {
      setProcessingPayment(false)
    }
  }*/

  const handleGenerateInvoiceOnly = async () => {
    try {
      const amount = tradein.proposedValue || tradein.saleInfo?.amount || 0
      
      if (amount <= 0) {
        setToast({ type: 'error', message: 'Aucun montant défini pour générer une facture' })
        return
      }

      const response = await api.post('/api/invoice/generate', {
        requestType: 'tradein',
        requestId: id,
        clientName: tradein.clientName,
        clientWhatsapp: tradein.clientWhatsapp,
        amount: amount
      })

      const invoiceUrl = response?.data?.data?.pdfUrl
      const fullInvoiceUrl = invoiceUrl?.startsWith('http') 
        ? invoiceUrl 
        : `${API_BASE_URL}${invoiceUrl}`
      
      setInvoiceLink(fullInvoiceUrl)
      setToast({ type: 'success', message: 'Facture générée avec succès' })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la génération de la facture' })
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: Clock, 
        label: 'En attente',
        gradient: 'from-amber-400 to-orange-500',
        bgGradient: 'from-amber-500 to-orange-500'
      },
      assigned: {
        color: 'bg-violet-50 text-violet-700 border-violet-200',
        icon: UserCheck,
        label: 'Assigné',
        gradient: 'from-violet-400 to-purple-500',
        bgGradient: 'from-violet-500 to-purple-500'
      },
      accepted: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: CheckCircle, 
        label: 'Accepté',
        gradient: 'from-blue-400 to-cyan-500',
        bgGradient: 'from-blue-500 to-cyan-500'
      },
      refused: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        icon: XCircle, 
        label: 'Refusé',
        gradient: 'from-red-400 to-rose-500',
        bgGradient: 'from-red-500 to-rose-500'
      },
      completed: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Terminé',
        gradient: 'from-emerald-400 to-green-500',
        bgGradient: 'from-emerald-500 to-green-500'
      },
      paid: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Payée',
        gradient: 'from-emerald-400 to-green-500',
        bgGradient: 'from-emerald-500 to-green-500'
      }
    }
    return configs[status] || { 
      color: 'bg-gray-50 text-gray-700 border-gray-200', 
      icon: AlertCircle, 
      label: status,
      gradient: 'from-gray-400 to-gray-500',
      bgGradient: 'from-gray-500 to-gray-600'
    }
  }

  const getConditionConfig = (condition) => {
    const configs = {
      new: { label: 'Neuf', icon: Star, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      'like-new': { label: 'Comme neuf', icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      good: { label: 'Bon état', icon: ThumbsUp, color: 'text-green-600', bgColor: 'bg-green-50' },
      fair: { label: 'État moyen', icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50' },
      poor: { label: 'Mauvais état', icon: ThumbsDown, color: 'text-red-600', bgColor: 'bg-red-50' }
    }
    return configs[condition] || { label: condition, icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  }

  const getAvailableActions = () => {
    const actions = []
    switch (tradein?.status) {
      case 'pending':
      case 'assigned':
        actions.push({ 
          status: 'accepted', 
          label: 'Accepter l\'échange', 
          icon: CheckCircle,
          gradient: 'from-emerald-500 to-green-500',
          description: 'Valider la demande et procéder à l\'échange'
        })
        actions.push({ 
          status: 'refused', 
          label: 'Refuser l\'échange', 
          icon: XCircle,
          gradient: 'from-red-500 to-rose-500',
          description: 'Décliner la demande d\'échange'
        })
        break
     /* case 'accepted':
        actions.push({ 
          status: 'completed', 
          label: 'Finaliser l\'échange', 
          icon: ClipboardCheck,
          gradient: 'from-blue-500 to-indigo-500',
          description: 'Marquer l\'échange comme terminé'
        })
        break*/
      default:
        break
    }
    return actions
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodText = (method) => {
    const methods = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      card: 'Carte bancaire',
      check: 'Chèque',
      transfer: 'Virement'
    }
    return methods[method] || method
  }

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      mobile_money: Smartphone,
      card: CreditCard,
      check: FileText,
      transfer: Send
    }
    return icons[method] || CreditCard
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600"></div>
            <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de l'échange...</p>
        </div>
      </div>
    )
  }
  
  if (!tradein) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <AlertCircle className="text-gray-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Demande non trouvée</h2>
          <p className="text-gray-500 mb-6">Cette demande d'échange n'existe pas ou a été supprimée</p>
          <button
            onClick={() => navigate('/technician/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(tradein.status)
  const StatusIcon = statusConfig.icon
  const conditionConfig = getConditionConfig(tradein.condition)
  const ConditionIcon = conditionConfig.icon
  const availableActions = getAvailableActions()

  return (
    <div className="eli-canvas">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Barre supérieure */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/technician/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Retour au tableau de bord</span>
            </button>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-purple-600" />
              <span className="font-semibold text-gray-900">
                {formatReference(tradein._id)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="eli-content">
        {/* Notification Facture */}
        {invoiceLink && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Facture générée</h3>
                  <p className="text-sm text-blue-700">La facture est prête à être téléchargée</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.open(invoiceLink, '_blank')}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm flex items-center gap-2"
                >
                  <Download size={16} />
                  Télécharger
                </button>
                <button 
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/${tradein.clientWhatsapp?.replace(/^\+/, '')}?text=${encodeURIComponent(`Bonjour ${tradein.clientName},\n\nVotre facture pour l'échange est prête ! 📄\n\n💰 Montant : ${(tradein.saleInfo?.amount || tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA\n📎 ${invoiceLink}\n\nMerci de votre confiance ! 🙏`)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-sm flex items-center gap-2"
                >
                  <Send size={16} />
                  Envoyer WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${statusConfig.gradient}`}></div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Demande d'Échange
                  </h1>
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Créée le {formatDate(tradein.createdAt)}
                  </span>
                  {tradein.assignedTo && (
                    <span className="flex items-center gap-1 text-purple-600">
                      <UserCheck size={14} />
                      Assigné à vous
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl ${conditionConfig.bgColor} flex items-center gap-2`}>
                  <ConditionIcon size={18} className={conditionConfig.color} />
                  <span className={`font-semibold ${conditionConfig.color}`}>
                    {conditionConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* ... (Informations Client, Détails du téléphone, Description, Rapport existant) ... */}
            {/* Ces sections restent identiques à votre code actuel */}
            
            {/* Informations Client */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                    <User size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Informations Client</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      {tradein.clientName || 'Non spécifié'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp</p>
                    {tradein.clientWhatsapp ? (
                      <a
                        href={`https://wa.me/${tradein.clientWhatsapp.replace(/^\+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-green-600 hover:text-green-700 flex items-center gap-2"
                      >
                        <Phone size={16} />
                        {tradein.clientWhatsapp.startsWith('+') ? tradein.clientWhatsapp : `+${tradein.clientWhatsapp}`}
                      </a>
                    ) : (
                      <p className="text-gray-400">Non spécifié</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Détails du téléphone */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500">
                    <Smartphone size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Téléphone à échanger</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modèle</p>
                    <p className="font-semibold text-gray-900">{tradein.deviceModel || 'Non spécifié'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">État</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${conditionConfig.bgColor}`}>
                      <ConditionIcon size={16} className={conditionConfig.color} />
                      <span className={`font-semibold ${conditionConfig.color}`}>{conditionConfig.label}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit souhaité</p>
                    <p className="font-semibold text-purple-600 flex items-center gap-2">
                      <Tag size={16} />
                      {tradein.targetProduct || 'Non spécifié'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valeur proposée</p>
                    <p className="font-bold text-emerald-600 flex items-center gap-2">
                      <DollarSign size={16} />
                      {tradein.proposedValue ? `${tradein.proposedValue.toLocaleString('fr-FR')} FCFA` : 'Non définie'}
                    </p>
                  </div>
                </div>

                {/* Photos */}
                {tradein.photos && tradein.photos.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Camera size={16} className="text-gray-400" />
                      Photos du téléphone ({tradein.photos.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {tradein.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setShowFullImage(photo)}
                        >
                          <img
                            src={resolveMediaUrl(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 hover:border-purple-300 transition-all duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-200 flex items-center justify-center">
                            <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {tradein.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                      <MessageSquare size={18} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Description</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-gray-700 leading-relaxed">{tradein.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rapport existant */}
            {tradein.technicianReport && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                      <FileText size={18} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Rapport d'intervention</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-gray-700 leading-relaxed">{tradein.technicianReport}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* ========== SECTION VALIDATION ÉCHANGE ========== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                    <Wallet size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Validation de l'échange</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Montant proposé */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Montant de l'échange</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {(tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-3">
                  {/*tradein.status === 'accepted' && (
                    <button
                      onClick={() => {
                        setPaymentData({
                          amount: (tradein.proposedValue || 0).toString(),
                          paymentMethod: 'cash',
                          notes: ''
                        })
                        setShowPaymentModal(true)
                      }}
                      className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Valider le paiement
                    </button>
                  )*/}

                  {/*tradein.status === 'completed' && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle size={16} />
                        Paiement validé
                      </p>
                    </div>
                  )*/}

                  {/* Bouton générer facture (toujours visible si montant > 0) */}
                  {/*(tradein.proposedValue > 0 || tradein.saleInfo?.amount > 0) && (
                    <button
                      onClick={handleGenerateInvoiceOnly}
                      className="w-full p-4 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Printer size={20} />
                      Générer la facture
                    </button>
                  )*/}

                  {/* Lien facture existante */}
                  {tradein.saleInfo?.invoiceUrl && (
                    <button
                      onClick={() => {
                        const url = tradein.saleInfo.invoiceUrl.startsWith('http')
                          ? tradein.saleInfo.invoiceUrl
                          : `${API_BASE_URL}${tradein.saleInfo.invoiceUrl}`
                        window.open(url, '_blank')
                      }}
                      className="w-full p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Télécharger la facture
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions disponibles (statuts) */}
            {availableActions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                      <Zap size={18} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Actions statut</h2>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {availableActions.map((action) => {
                    const ActionIcon = action.icon
                    return (
                      <button
                        key={action.status}
                        onClick={() => setUpdateStatusModal({ isOpen: true, status: action.status })}
                        className={`w-full p-4 rounded-xl bg-gradient-to-r ${action.gradient} text-white hover:shadow-lg transition-all duration-200 group transform hover:scale-102`}
                      >
                        <div className="flex items-center gap-3">
                          <ActionIcon size={20} />
                          <div className="text-left">
                            <p className="font-semibold">{action.label}</p>
                            <p className="text-xs opacity-90">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Résumé */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-bold text-gray-900">Résumé</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Référence</span>
                  <span className="font-mono text-sm font-medium">{formatReference(tradein._id)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Statut</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon size={12} />
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Créé le</span>
                  <span className="text-sm font-medium">
                    {new Date(tradein.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {(tradein.proposedValue || tradein.saleInfo?.amount) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Montant</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {(tradein.saleInfo?.amount || tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Validation Paiement */}
      {/*showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Valider le paiement</h3>
                  <p className="text-sm text-gray-500">Enregistrer le paiement de l'échange</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleValidatePayment} className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Client</span>
                  <span className="font-semibold">{tradein.clientName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Modèle</span>
                  <span className="font-semibold">{tradein.deviceModel}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Montant à payer (FCFA) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Espèces', icon: Banknote },
                    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                    { value: 'card', label: 'Carte bancaire', icon: CreditCard },
                    { value: 'transfer', label: 'Virement', icon: Send },
                  ].map((method) => {
                    const Icon = method.icon
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentData({ ...paymentData, paymentMethod: method.value })}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          paymentData.paymentMethod === method.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Notes (optionnel)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Notes sur le paiement..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Valider le paiement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )*/}

      {/* Modal Mise à jour statut */}
      <Modal
        isOpen={updateStatusModal.isOpen}
        title={
          updateStatusModal.status === 'accepted' ? 'Accepter l\'échange' :
          updateStatusModal.status === 'refused' ? 'Refuser l\'échange' :
          'Finaliser l\'échange'
        }
        confirmText={updating ? 'Traitement...' : 'Confirmer'}
        onClose={() => {
          setUpdateStatusModal({ isOpen: false, status: '' })
          setTechnicianReport('')
        }}
        onConfirm={handleUpdateStatus}
        confirmDisabled={updating}
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${
            updateStatusModal.status === 'accepted' ? 'bg-emerald-50 border border-emerald-200' :
            updateStatusModal.status === 'refused' ? 'bg-red-50 border border-red-200' :     
            updateStatusModal.status === 'completed' ? 'bg-blue-50 border border-blue-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <p className="text-gray-700 font-medium">
              {updateStatusModal.status === 'accepted' && 'Vous allez accepter cette demande d\'échange.'}
              {updateStatusModal.status === 'refused' && 'Vous allez refuser cette demande d\'échange. Cette action est irréversible.'}
              {updateStatusModal.status === 'completed' && 'Vous allez finaliser cet échange.'}
            </p>
          </div>
          
          {(updateStatusModal.status === 'accepted' || updateStatusModal.status === 'completed') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rapport d'intervention</label>
              <textarea
                value={technicianReport}
                onChange={(e) => setTechnicianReport(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Décrivez votre évaluation du téléphone..."
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal image plein écran */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullImage(null)}
        >
          <img
            src={resolveMediaUrl(showFullImage)}
            alt="Vue agrandie"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            onClick={() => setShowFullImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
      )}
    </div>
  )
}