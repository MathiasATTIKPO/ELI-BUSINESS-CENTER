import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, DollarSign, User, Phone, Calendar, Package, UserPlus, 
  CheckCircle, Clock, XCircle, AlertCircle, Smartphone, RefreshCw, 
  Edit2, Save, X, Eye, Star, Shield, Tag, MessageSquare, Zap,
  ThumbsUp, ThumbsDown, Wallet, CreditCard, Download, Printer,
  Banknote, Send, FileText, Camera, TrendingUp, Award, ClipboardCheck,
  Search, Filter, ChevronRight
} from 'lucide-react'
import api, { resolveMediaUrl } from '../services/api'
import Toast from '../components/Toast'
import ImageGallery from '../components/ImageGallery'
import Modal from '../components/Modal'
import { formatReference } from '../utils/formatReference'

export default function TradeInDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tradein, setTradein] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [valueModal, setValueModal] = useState({ isOpen: false, value: '' })
  const [exchangeModal, setExchangeModal] = useState({ isOpen: false, selectedProduct: null })
  const [assignModal, setAssignModal] = useState({ isOpen: false, technicianId: '' })
  const [products, setProducts] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [targetModal, setTargetModal] = useState({ isOpen: false, value: '' })
  const [showFullImage, setShowFullImage] = useState(null)

  // Validation de paiement
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
    fetchProducts()
    fetchTechnicians()
  }, [id])

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/admin/employees')
      const techniciansList = response.data.data?.filter(emp => emp.role === 'technician') || []
      setTechnicians(techniciansList)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/admin/products')
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des produits')
    }
  }

  const fetchTradein = async () => {
    try {
      const response = await api.get(`/api/admin/tradein/${id}`)
      setTradein(response.data.data)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateValue = async () => {
    // Ne pas permettre de modifier la valeur si déjà complété
    if (tradein.status === 'paid' || tradein.status === 'completed') {
      setToast({ type: 'error', message: 'Impossible de modifier une valeur pour un échange déjà payé' })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/value`, { proposedValue: parseFloat(valueModal.value) })
      setToast({ type: 'success', message: 'Valeur proposée enregistrée' })
      setValueModal({ isOpen: false, value: '' })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
    }
  }

  const handleStatusChange = async (newStatus) => {
    // Ne pas permettre de changer le statut si déjà complété
    if (tradein.status === 'paid' || tradein.status === 'completed') {
      setToast({ type: 'error', message: 'Impossible de modifier un échange déjà payé' })
      return
    }
    if (newStatus === 'accepted') {
      setExchangeModal({ isOpen: true, selectedProduct: null })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/status`, { status: newStatus })
      setToast({ type: 'success', message: `Statut mis à jour : ${getStatusText(newStatus)}` })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    }
  }

  const handleAcceptExchange = async () => {
    if (!exchangeModal.selectedProduct) {
      setToast({ type: 'error', message: 'Veuillez sélectionner un produit d\'échange' })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/accept`, { 
        status: 'accepted',
        exchangeProduct: exchangeModal.selectedProduct._id 
      })
      setToast({ type: 'success', message: 'Échange accepté avec succès' })
      setExchangeModal({ isOpen: false, selectedProduct: null })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de l\'acceptation' })
    }
  }

  const handleAssignTechnician = async () => {
    // Ne pas permettre d'assigner si déjà complété
    if (tradein.status === 'completed') {
      setToast({ type: 'error', message: 'Impossible d\'assigner un technicien à un échange déjà payé' })
      return
    }
    if (!assignModal.technicianId) {
      setToast({ type: 'error', message: 'Veuillez choisir un technicien' })
      return
    }
    try {
      const response = await api.put(`/api/admin/tradein/${id}/assign`, { 
        employeeId: assignModal.technicianId 
      })
      if (response.data.success) {
        setToast({ type: 'success', message: 'Technicien assigné avec succès' })
        setAssignModal({ isOpen: false, technicianId: '' })
        await fetchTradein()
      } else {
        setToast({ type: 'error', message: 'L\'assignation a échoué, veuillez réessayer' })
      }
    } catch (error) {
      console.error('Erreur assignation:', error)
      setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors de l\'assignation' })
    }
  }

  // Gestion du paiement
  const handleValidatePayment = async (e) => {
    e.preventDefault()
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setToast({ type: 'error', message: 'Veuillez saisir un montant valide' })
      return
    }

    setProcessingPayment(true)
    try {
      await api.put(`/api/admin/tradein/${id}/status`, {
        status: 'completed',
        saleInfo: {
          amount: parseFloat(paymentData.amount),
          amountPaid: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          paymentDate: new Date(),
          notes: paymentData.notes
        }
      })

      const invoiceResponse = await api.post('/api/invoice/generate', {
        requestType: 'tradein',
        requestId: id,
        clientName: tradein.clientName,
        clientWhatsapp: tradein.clientWhatsapp,
        amount: parseFloat(paymentData.amount)
      })

      setInvoiceLink(`/api/admin/tradeins/${id}/invoice`)
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
  }

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

      setInvoiceLink(`/api/admin/tradeins/${id}/invoice`)
      setToast({ type: 'success', message: 'Facture générée avec succès' })
      fetchTradein()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la génération de la facture' })
    }
  }

  const handleUpdateTarget = async () => {
    // Ne pas permettre de modifier la cible si déjà complété
    if (tradein.status === 'paid' || tradein.status === 'completed') {
      setToast({ type: 'error', message: 'Impossible de modifier un échange déjà payé' })
      return
    }
    try {
      await api.put(`/api/admin/tradein/${id}/target`, { targetProduct: targetModal.value })
      setToast({ type: 'success', message: 'Produit souhaité mis à jour' })
      setTargetModal({ isOpen: false, value: '' })
      fetchTradein()
    } catch (err) { 
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' }) 
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const endpoint = invoiceLink || `/api/admin/tradeins/${id}/invoice`
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

 const getStatusConfig = (status) => {
  const configs = {
    pending: { 
      color: 'bg-amber-50 text-amber-700 border-amber-200', 
      icon: Clock, label: 'En attente',
      gradient: 'from-amber-400 to-orange-500'
    },
    assigned: {
      color: 'bg-violet-50 text-violet-700 border-violet-200',
      icon: UserPlus, label: 'Assigné',
      gradient: 'from-violet-400 to-purple-500'
    },
    accepted: { 
      color: 'bg-blue-50 text-blue-700 border-blue-200', 
      icon: CheckCircle, label: 'Accepté',
      gradient: 'from-blue-400 to-cyan-500'
    },
    refused: { 
      color: 'bg-red-50 text-red-700 border-red-200', 
      icon: XCircle, label: 'Refusé',
      gradient: 'from-red-400 to-rose-500'
    },
    completed: { 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: CheckCircle, label: 'Payé',
      gradient: 'from-emerald-400 to-green-500'
    },
    paid: { 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      icon: CheckCircle, label: 'Payé',
      gradient: 'from-emerald-400 to-green-500'
    }
  }
  return configs[status] || { 
    color: 'bg-gray-50 text-gray-700 border-gray-200', 
    icon: AlertCircle, label: status === 'completed' ? 'Payé': status === 'paid' ? 'Payé' : status === 'pending' ? 'En attente' : status === 'accepted' ? 'Accepté' : status === 'refused' ? 'Refusé' : status === 'assigned' ? 'Assigné' : status,
    gradient: 'from-gray-400 to-gray-500'
  }
}

  const getStatusText = (status) => {
  const texts = { 
    pending: 'En attente', 
    accepted: 'Accepté', 
    refused: 'Refusé', 
    completed: 'terminé', 
    paid: 'Payé',
    assigned: 'Assigné' 
  }
  return texts[status] || status
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

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getPaymentMethodText = (method) => {
    const methods = { cash: 'Espèces', mobile_money: 'Mobile Money', card: 'Carte bancaire', check: 'Chèque', transfer: 'Virement' }
    return methods[method] || method
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de l'échange...</p>
        </div>
      </div>
    )
  }
  
  if (!tradein) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <AlertCircle className="text-gray-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Demande non trouvée</h2>
          <p className="text-gray-500 mb-6">Cette demande d'échange n'existe pas ou a été supprimée</p>
          <button onClick={() => navigate('/admin/tradeins')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
            <ArrowLeft size={18} />
            Retour aux demandes
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(tradein.status)
  const StatusIcon = statusConfig.icon
  const conditionConfig = getConditionConfig(tradein.condition)
  const ConditionIcon = conditionConfig.icon
  const isCompleted = tradein.status === 'paid' || tradein.status === 'completed'

  return (
    <div className="eli-canvas">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Bandeau informatif si l'échange est payé */}
      {isCompleted && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={20} />
            <div>
              <p className="font-semibold text-emerald-800">Échange payé</p>
              <p className="text-sm text-emerald-600">Cet échange a été payé. Aucune modification n'est possible.</p>
            </div>
          </div>
        </div>
      )}

      {/* Barre supérieure */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/admin/tradeins')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Retour aux demandes</span>
            </button>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-blue-600" />
              <span className="font-semibold text-gray-900">{formatReference(tradein._id)}</span>
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
                <button onClick={handleDownloadInvoice} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm flex items-center gap-2">
                  <Download size={16} /> Télécharger
                </button>
                <button onClick={() => {
                  const whatsappUrl = `https://wa.me/${tradein.clientWhatsapp?.replace(/^\+/, '')}?text=${encodeURIComponent(`Bonjour ${tradein.clientName},\n\nVotre facture pour l'échange est prête ! 📄\n\n💰 Montant : ${(tradein.saleInfo?.amount || tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA\n📎 ${invoiceLink}\n\nMerci de votre confiance ! 🙏`)}`
                  window.open(whatsappUrl, '_blank')
                }} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-sm flex items-center gap-2">
                  <Send size={16} /> Envoyer WhatsApp
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Demande d'Échange</h1>
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                    <StatusIcon size={14} /> {statusConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> Créée le {formatDate(tradein.createdAt)}</span>
                  {tradein.assignedTo && (
                    <span className="flex items-center gap-1 text-purple-600"><UserPlus size={14} /> Assigné à {tradein.assignedTo.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl ${conditionConfig.bgColor} flex items-center gap-2`}>
                  <ConditionIcon size={18} className={conditionConfig.color} />
                  <span className={`font-semibold ${conditionConfig.color}`}>{conditionConfig.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations Client */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"><User size={18} className="text-white" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Informations Client</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} className="text-gray-400" /> {tradein.clientName || 'Non spécifié'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp</p>
                    {tradein.clientWhatsapp ? (
                      <a href={`https://wa.me/${tradein.clientWhatsapp.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className="font-medium text-green-600 hover:text-green-700 flex items-center gap-2">
                        <Phone size={16} /> {tradein.clientWhatsapp}
                      </a>
                    ) : <p className="text-gray-400">Non spécifié</p>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Caissier</p>
                    <p className="font-semibold text-gray-900">{tradein.saleInfo?.validatedBy || 'Non défini'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Téléphone à échanger */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500"><Smartphone size={18} className="text-white" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Téléphone à Échanger</h2>
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-purple-600">{tradein.targetProduct || 'Non spécifié'}</span>
                      <button 
                        onClick={() => setTargetModal({ isOpen: true, value: tradein.targetProduct || '' })} 
                        disabled={isCompleted}
                        className={`p-1 transition ${isCompleted ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-600'}`} 
                        title={isCompleted ? 'Non modifiable' : 'Modifier'}
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  {tradein.exchangeProduct && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit accepté</p>
                      <p className="font-semibold text-green-600">{tradein.exchangeProduct.name}</p>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {tradein.photos && tradein.photos.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Camera size={16} className="text-gray-400" /> Photos ({tradein.photos.length})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {tradein.photos.map((photo, index) => (
                        <div key={index} className="relative group cursor-pointer" onClick={() => setShowFullImage(photo)}>
                          <img src={resolveMediaUrl(photo)} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 hover:border-purple-300 transition-all duration-200" />
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
                    <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500"><MessageSquare size={18} className="text-white" /></div>
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
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Valeur de Reprise */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500"><DollarSign size={18} className="text-white" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Valeur de Reprise</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">Montant proposé</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {tradein.proposedValue ? `${tradein.proposedValue.toLocaleString('fr-FR')} FCFA` : 'Non définie'}
                  </p>
                </div>
                <button 
                  onClick={() => setValueModal({ isOpen: true, value: tradein.proposedValue?.toString() || '' })} 
                  disabled={isCompleted}
                  className={`w-full p-3 rounded-xl transition-all font-medium shadow-sm ${
                    isCompleted 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                  }`}
                >
                  {isCompleted ? 'Non modifiable (payé)' : (tradein.proposedValue ? 'Modifier la valeur' : 'Proposer une valeur')}
                </button>
              </div>
            </div>
{/* Validation de l'échange */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"><Wallet size={18} className="text-white" /></div>
      <h2 className="text-lg font-bold text-gray-900">Validation</h2>
    </div>
  </div>
  <div className="p-6 space-y-3">
    {tradein.status === 'accepted' && !isCompleted && (
      <button onClick={() => {
        setPaymentData({ amount: (tradein.proposedValue || 0).toString(), paymentMethod: 'cash', notes: '' })
        setShowPaymentModal(true)
      }} className="w-full p-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-semibold shadow-sm flex items-center justify-center gap-2">
        <CreditCard size={20} /> Valider le paiement
      </button>
    )}
    {isCompleted && (
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle size={16} /> Paiement validé - Échange finalisé</p>
      </div>
    )}
    
    {/* Bouton Générer la facture - TOUJOURS ACTIF */}
    {(tradein.proposedValue > 0 || tradein.saleInfo?.amount > 0) && (
      <button 
        onClick={handleGenerateInvoiceOnly} 
        className="w-full p-4 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold flex items-center justify-center gap-2"
      >
        <Printer size={20} /> Générer la facture
      </button>
    )}
    
    {tradein.saleInfo?.invoiceUrl && (
        <button onClick={handleDownloadInvoice} className="w-full p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2">
        <Download size={20} /> Télécharger la facture
      </button>
    )}
    
    {tradein.status === 'accepted' && !tradein.saleInfo?.amount && (
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-sm text-amber-700 flex items-center gap-2"><AlertCircle size={14} /> En attente de paiement</p>
      </div>
    )}
  </div>
</div>

            {/* Statut et Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500"><Zap size={18} className="text-white" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Actions</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Assignation technicien */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Technicien assigné</p>
                  <p className="font-semibold text-gray-900">{tradein.assignedTo?.name || 'Aucun'}</p>
                </div>
                <button 
                  onClick={() => setAssignModal({ isOpen: true, technicianId: tradein.assignedTo?._id || '' })} 
                  disabled={isCompleted}
                  className={`w-full p-3 rounded-xl transition-all font-medium shadow-sm flex items-center justify-center gap-2 ${
                    isCompleted 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  <UserPlus size={18} /> 
                  {isCompleted ? 'Non modifiable (payé)' : (tradein.assignedTo ? 'Changer' : 'Attribuer') + ' un technicien'}
                </button>

                {/* Boutons Accepter/Refuser */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusChange('accepted')} 
                    disabled={isCompleted || tradein.status === 'refused'} 
                    className={`flex-1 p-3 rounded-xl transition-all font-medium shadow-sm flex items-center justify-center gap-2 ${
                      isCompleted || tradein.status === 'refused'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                    }`}
                  >
                    <CheckCircle size={18} /> Accepter
                  </button>
                  <button 
                    onClick={() => handleStatusChange('refused')} 
                    disabled={isCompleted || tradein.status === 'refused'} 
                    className={`flex-1 p-3 rounded-xl transition-all font-medium shadow-sm flex items-center justify-center gap-2 ${
                      isCompleted || tradein.status === 'refused'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                    }`}
                  >
                    <XCircle size={18} /> Refuser
                  </button>
                </div>

                {isCompleted && tradein.saleInfo?.amount && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm text-emerald-800">✅ Finalisé - {tradein.saleInfo.amount.toLocaleString('fr-FR')} FCFA payés</p>
                  </div>
                )}
              </div>
            </div>

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
                    <StatusIcon size={12} /> {statusConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Créé le</span>
                  <span className="text-sm font-medium">{new Date(tradein.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {(tradein.proposedValue || tradein.saleInfo?.amount) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Montant</span>
                    <span className="text-sm font-bold text-emerald-600">{(tradein.saleInfo?.amount || tradein.proposedValue || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Modal Valeur */}
      <Modal isOpen={valueModal.isOpen} title="Proposer une valeur de reprise" confirmText="Enregistrer" onClose={() => setValueModal({ isOpen: false, value: '' })} onConfirm={handleUpdateValue}>
        <div className="space-y-4">
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="number" value={valueModal.value} onChange={(e) => setValueModal({ ...valueModal, value: e.target.value })} placeholder="Montant en FCFA" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </Modal>

      {/* Modal Produit Souhaité */}
      <Modal isOpen={targetModal.isOpen} title="Modifier le produit souhaité" confirmText="Enregistrer" onClose={() => setTargetModal({ isOpen: false, value: '' })} onConfirm={handleUpdateTarget}>
        <select value={targetModal.value} onChange={(e) => setTargetModal({ ...targetModal, value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="">-- Aucun --</option>
          {products.map(p => <option key={p._id} value={p.name}>{p.name} - {p.price?.toLocaleString()} FCFA</option>)}
        </select>
      </Modal>

      {/* Modal Échange */}
      <Modal isOpen={exchangeModal.isOpen} title="Sélectionner le produit d'échange" confirmText="Accepter l'échange" onClose={() => setExchangeModal({ isOpen: false, selectedProduct: null })} onConfirm={handleAcceptExchange}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Sélectionnez le produit que vous souhaitez échanger contre le téléphone du client.</p>
          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
            {products.filter(p => p.active && p.stock > 0).length > 0 ? products.filter(p => p.active && p.stock > 0).map(product => (
              <div key={product._id} onClick={() => setExchangeModal({ ...exchangeModal, selectedProduct: product })} className={`p-3 border rounded-lg cursor-pointer transition ${exchangeModal.selectedProduct?._id === product._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <Package className="text-gray-400" size={20} />
                  <div><p className="font-medium">{product.name}</p><p className="text-sm text-gray-500">Prix: {product.price?.toLocaleString('fr-FR')} FCFA | Stock: {product.stock || 0}</p></div>
                </div>
              </div>
            )) : <div className="p-4 text-sm text-gray-500">Aucun produit disponible en stock pour l'échange.</div>}
          </div>
          {exchangeModal.selectedProduct && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Produit sélectionné: {exchangeModal.selectedProduct.name}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Assignation Technicien */}
      <Modal isOpen={assignModal.isOpen} title="Attribuer un technicien" confirmText="Attribuer" onClose={() => setAssignModal({ isOpen: false, technicianId: '' })} onConfirm={handleAssignTechnician}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Sélectionner un technicien</label>
          <select value={assignModal.technicianId} onChange={(e) => setAssignModal({ ...assignModal, technicianId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">-- Choisir --</option>
            {technicians.map(tech => <option key={tech._id} value={tech._id}>{tech.name} - {tech.email}</option>)}
          </select>
          {technicians.length === 0 && <p className="text-sm text-orange-500">Aucun technicien disponible.</p>}
        </div>
      </Modal>

      {/* Modal Validation Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500"><CreditCard size={20} className="text-white" /></div>
                <div><h3 className="text-xl font-bold text-gray-900">Valider le paiement</h3><p className="text-sm text-gray-500">Enregistrer le paiement de l'échange</p></div>
              </div>
            </div>
            <form onSubmit={handleValidatePayment} className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center"><span className="text-sm text-gray-500">Client</span><span className="font-semibold">{tradein.clientName}</span></div>
                <div className="flex justify-between items-center mt-2"><span className="text-sm text-gray-500">Modèle</span><span className="font-semibold">{tradein.deviceModel}</span></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Montant à payer (FCFA) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'cash', label: 'Espèces', icon: Banknote }, { value: 'card', label: 'Carte bancaire', icon: CreditCard }, { value: 'transfer', label: 'Virement', icon: Send }].map((method) => {
                    const Icon = method.icon
                    return (
                      <button key={method.value} type="button" onClick={() => setPaymentData({ ...paymentData, paymentMethod: method.value })} className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentData.paymentMethod === method.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <Icon size={18} /><span className="text-sm font-medium">{method.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium">Annuler</button>
                <button type="submit" disabled={processingPayment} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-medium shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {processingPayment ? <><RefreshCw size={16} className="animate-spin" /> Traitement...</> : <><CheckCircle size={18} /> Valider le paiement</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Image plein écran */}
      {showFullImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowFullImage(null)}>
          <img src={resolveMediaUrl(showFullImage)} alt="Vue agrandie" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setShowFullImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><XCircle size={24} /></button>
        </div>
      )}
    </div>
  )
}