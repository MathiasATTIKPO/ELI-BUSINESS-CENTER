import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  DollarSign, 
  User, 
  Phone, 
  Calendar, 
  Wrench, 
  Smartphone, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Banknote,
  Users,
  History,
  Send,
  Download,
  ExternalLink,
  Camera,
  ClipboardList,
  X
} from 'lucide-react'
import api from '../services/api'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ImageGallery from '../components/ImageGallery'
import { formatReference } from '../utils/formatReference'
import { useAuth } from '../context/AuthContext'

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeRole } = useAuth()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [priceModal, setPriceModal] = useState({ isOpen: false, price: '', method: 'cash', notes: '' })
  const [assignModal, setAssignModal] = useState({ isOpen: false, technicianId: '' })
  const [technicians, setTechnicians] = useState([])

  // Fonctions utilitaires
  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border-amber-200', gradient: 'from-amber-400 to-orange-400', icon: Clock },
      repairing: { label: 'En réparation', color: 'bg-blue-100 text-blue-800 border-blue-200', gradient: 'from-blue-400 to-cyan-400', icon: Wrench },
      ready: { label: 'Prêt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', gradient: 'from-emerald-400 to-green-400', icon: CheckCircle },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-200', gradient: 'from-green-400 to-teal-400', icon: CheckCircle },
      paid: { label: 'Payé', color: 'bg-purple-100 text-purple-800 border-purple-200', gradient: 'from-purple-400 to-violet-400', icon: CheckCircle },
      soldee: { label: 'Soldée', color: 'bg-purple-100 text-purple-800 border-purple-200', gradient: 'from-purple-400 to-violet-400', icon: CheckCircle }
    }
    return configs[status] || configs.pending
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'En attente',
      repairing: 'En réparation',
      ready: 'Prêt',
      completed: 'Terminé',
      paid: 'Payé',
      soldee: 'Soldée'
    }
    return texts[status] || status
  }

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      mobile_money: Smartphone,
      card: CreditCard,
      transfer: Send
    }
    return icons[method] || Banknote
  }

  const getPaymentMethodText = (method) => {
    const texts = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      card: 'Carte',
      transfer: 'Virement'
    }
    return texts[method] || method
  }

  const statusFlow = ['pending', 'repairing', 'ready', 'completed', 'paid']

  useEffect(() => {
    if (activeRole !== 'admin') {
      setToast({ type: 'error', message: 'Accès non autorisé. Vous devez être administrateur.' })
      setTimeout(() => navigate('/admin/dashboard'), 2000)
      return
    }
    fetchRepair()
    fetchTechnicians()
  }, [id, activeRole, navigate])

  const fetchRepair = async () => {
    try {
      const response = await api.get(`/api/admin/repair/${id}`)
      setRepair(response.data.data)
    } catch (error) {
      console.error('Erreur fetchRepair:', error)
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/admin/login'), 2000)
      } else {
        setToast({ type: 'error', message: error.response?.data?.message || 'Erreur lors du chargement' })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/admin/employees')
      const technicianList = response.data.data?.filter(emp => emp.role === 'technician') || []
      setTechnicians(technicianList)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  const handleSavePrice = async () => {
    try {
      const payload = { 
        price: parseFloat(priceModal.price), 
        estimatedPrice: parseFloat(priceModal.price),
        saleInfo: {
          amount: parseFloat(priceModal.price),
          amountPaid: repair?.saleInfo?.amountPaid || 0,
          paymentMethod: priceModal.method,
          paymentDate: repair?.saleInfo?.paymentDate || null,
          notes: priceModal.notes
        }
      }
      await api.put(`/api/admin/repair/${id}/price`, payload)
      setToast({ type: 'success', message: 'Devis enregistré avec succès' })
      setPriceModal({ isOpen: false, price: '', method: 'cash', notes: '' })
      fetchRepair()
    } catch (error) {
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/admin/login'), 2000)
      } else {
        setToast({ type: 'error', message: 'Erreur lors de la sauvegarde' })
      }
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (repair.status === 'paid') {
      setToast({ type: 'error', message: 'Impossible de modifier une réparation déjà payée' })
      return
    }
    try {
      await api.put(`/api/admin/repair/${id}/status`, { status: newStatus })
      setToast({ type: 'success', message: `Statut mis à jour : ${getStatusText(newStatus)}` })
      fetchRepair()
    } catch (error) {
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/admin/login'), 2000)
      } else {
        setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
      }
    }
  }

  const handleGenerateInvoice = async () => {
    try {
      const response = await api.get(`/api/admin/repairs/${id}/invoice`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `facture_reparation_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ type: 'success', message: 'Facture générée avec succès' })
      fetchRepair()
    } catch (error) {
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/admin/login'), 2000)
      } else {
        setToast({ type: 'error', message: 'Erreur lors de la génération de la facture' })
      }
    }
  }

  const handleAssignTechnician = async () => {
    if (repair.status === 'paid') {
      setToast({ type: 'error', message: 'Impossible d\'assigner un technicien à une réparation déjà payée' })
      return
    }
    if (!assignModal.technicianId) {
      setToast({ type: 'error', message: 'Veuillez sélectionner un technicien' })
      return
    }
    try {
      await api.put(`/api/admin/repair/${id}/assign`, { employeeId: assignModal.technicianId })
      setToast({ type: 'success', message: 'Réparation attribuée au technicien' })
      setAssignModal({ isOpen: false, technicianId: '' })
      fetchRepair()
    } catch (error) {
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/admin/login'), 2000)
      } else {
        setToast({ type: 'error', message: 'Erreur lors de l\'attribution' })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <Wrench className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement des détails...</p>
        </div>
      </div>
    )
  }
  
  if (!repair) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <AlertCircle className="text-gray-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Demande non trouvée</h2>
          <p className="text-gray-500 mb-6">Cette demande de réparation n'existe pas ou a été supprimée</p>
          <button 
            onClick={() => navigate('/admin/repairs')} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour aux demandes
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(repair.status)
  const StatusIcon = statusConfig.icon
  const isPaid = repair.status === 'paid' || repair.status === 'soldee'
  const isVipRepair = Boolean(repair.isVip)
  const effectiveStatusFlow = isVipRepair ? statusFlow.filter((s) => s !== 'paid') : statusFlow

  return (
    <div className="eli-content">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {isVipRepair && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="font-semibold text-amber-800">Réparation VIP</p>
          <p className="text-sm text-amber-700">Encaissement immédiat désactivé: cette réparation sera ajoutée à la facture mensuelle VIP.</p>
        </div>
      )}

      {isPaid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-emerald-600" size={20} />
          <div>
            <p className="font-semibold text-emerald-800">Réparation soldée</p>
            <p className="text-sm text-emerald-600">Cette réparation est soldée. Aucune modification n'est possible.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/admin/repairs')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux demandes</span>
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={handleGenerateInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Facture</span>
          </button>
          {repair.saleInfo?.invoiceUrl && (
            <button
              onClick={handleGenerateInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${statusConfig.gradient}`}></div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Réparation {formatReference(repair._id)}
                </h1>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                  <StatusIcon size={14} />
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(repair.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {repair.updatedAt && (
                  <span className="flex items-center gap-1">
                    <History size={14} />
                    Mis à jour le {new Date(repair.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {effectiveStatusFlow.map((status, index) => {
                const config = getStatusConfig(status)
                const Icon = config.icon
                const currentStatusIndex = effectiveStatusFlow.indexOf(repair.status)
                const isCompleted = currentStatusIndex >= index
                const isCurrent = repair.status === status
                const isDisabled = isPaid && !isCurrent && !isCompleted
                
                return (
                  <React.Fragment key={status}>
                    {index > 0 && (
                      <div className={`flex-1 h-0.5 min-w-[2rem] ${
                        isCompleted ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gray-200'
                      }`}></div>
                    )}
                    <button
                      onClick={() => !isDisabled && handleStatusChange(status)}
                      disabled={isDisabled}
                      className={`flex flex-col items-center gap-1 min-w-[4rem] transition-all ${
                        isCurrent ? 'scale-110' : 'hover:scale-105'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : isCompleted
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {config.label}
                      </span>
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <User size={18} className="text-blue-600" />
                </div>
                Informations Client
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-semibold text-gray-900">{repair.clientName || 'Non renseigné'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Contact WhatsApp</p>
                  {repair.clientWhatsapp ? (
                    <a 
                      href={`https://wa.me/${repair.clientWhatsapp.replace(/^\+/, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium group"
                    >
                      <Phone size={16} />
                      {repair.clientWhatsapp.startsWith('+') ? repair.clientWhatsapp : `+${repair.clientWhatsapp}`}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <p className="text-gray-400">Non renseigné</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Caissier</p>
                  <p className="font-medium text-gray-900">{repair.saleInfo?.validatedBy || 'Non défini'}</p>
                </div>
                {repair.clientEmail && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <a href={`mailto:${repair.clientEmail}`} className="text-blue-600 hover:text-blue-700 font-medium">
                      {repair.clientEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Wrench size={18} className="text-orange-600" />
                </div>
                Détails de la Réparation
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Appareil</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Smartphone size={16} className="text-gray-400" />
                    {repair.deviceModel || 'Non renseigné'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Technicien assigné</p>
                  {repair.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 flex items-center justify-center text-white text-sm font-medium">
                        {repair.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-gray-900">{repair.assignedTo.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">Non assigné</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Description de la panne</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {repair.issueDescription || 'Aucune description fournie.'}
                  </p>
                </div>
              </div>

              {repair.diagnostic && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Diagnostic technique</p>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-gray-700 leading-relaxed">{repair.diagnostic}</p>
                  </div>
                </div>
              )}

              {repair.technicianReport && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Rapport technique</p>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-gray-700 leading-relaxed">{repair.technicianReport}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {repair.photos && repair.photos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Camera size={18} className="text-green-600" />
                  </div>
                  Photos ({repair.photos.length})
                </h2>
              </div>
              <div className="p-6">
                <ImageGallery images={repair.photos} title="Photos de l'appareil" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                Prix & Paiement
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Montant du devis</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {repair.saleInfo?.amountPaid || repair.saleInfo?.amount || repair.price
                    ? `${(repair.saleInfo?.amountPaid || repair.saleInfo?.amount || repair.price).toLocaleString('fr-FR')}`
                    : '---'}
                  <span className="text-lg"> FCFA</span>
                </p>
              </div>

              {(repair.saleInfo?.paymentMethod || repair.saleInfo?.paymentDate) && (
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  {repair.saleInfo?.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Méthode</span>
                      <span className="flex items-center gap-2 font-medium">
                        {React.createElement(getPaymentMethodIcon(repair.saleInfo.paymentMethod), { size: 16 })}
                        {getPaymentMethodText(repair.saleInfo.paymentMethod)}
                      </span>
                    </div>
                  )}
                  {repair.saleInfo?.paymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Date paiement</span>
                      <span className="font-medium">
                        {new Date(repair.saleInfo.paymentDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {repair.saleInfo?.notes && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm text-amber-800">{repair.saleInfo.notes}</p>
                </div>
              )}

              <button
                onClick={() => setPriceModal({
                  isOpen: true,
                  price: (repair.saleInfo?.amount || repair.price || '').toString(),
                  method: repair.saleInfo?.paymentMethod || 'cash',
                  notes: repair.saleInfo?.notes || ''
                })}
                disabled={isPaid}
                className={`w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm font-medium ${
                  isPaid
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:shadow-md'
                }`}
              >
                {isPaid ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Payé - Non modifiable
                  </span>
                ) : (
                  repair.price ? 'Modifier le devis' : 'Définir le devis'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users size={18} className="text-purple-600" />
                </div>
                Technicien
              </h2>
            </div>
            <div className="p-6">
              {repair.assignedTo ? (
                <div className="flex items-center gap-4 mb-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center text-white text-lg font-bold">
                    {repair.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{repair.assignedTo.name}</p>
                    <p className="text-sm text-gray-500">{repair.assignedTo.email || 'Technicien'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">Aucun technicien assigné</p>
                </div>
              )}
              
              <button
                onClick={() => setAssignModal({ isOpen: true, technicianId: repair.assignedTo?._id || '' })}
                disabled={isPaid}
                className={`w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isPaid
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50'
                }`}
              >
                {isPaid ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Non modifiable (payé)
                  </span>
                ) : (
                  repair.assignedTo ? 'Changer de technicien' : 'Assigner un technicien'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100">
                  <ClipboardList size={18} className="text-gray-600" />
                </div>
                Résumé
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Référence</span>
                <span className="font-mono text-sm font-medium">{formatReference(repair._id)}</span>
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
                  {new Date(repair.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {repair.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Terminé le</span>
                  <span className="text-sm font-medium">
                    {new Date(repair.completedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={priceModal.isOpen}
        title="Définir le devis"
        confirmText="Enregistrer le devis"
        onClose={() => setPriceModal({ isOpen: false, price: '', method: 'cash', notes: '' })}
        onConfirm={handleSavePrice}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Montant du devis (FCFA)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={priceModal.price}
                onChange={(e) => setPriceModal({ ...priceModal, price: e.target.value })}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Méthode de paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash', label: 'Espèces', icon: Banknote },
                { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                { value: 'card', label: 'Carte', icon: CreditCard },
                { value: 'transfer', label: 'Virement', icon: Send },
              ].map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPriceModal({ ...priceModal, method: method.value })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      priceModal.method === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={priceModal.notes}
              onChange={(e) => setPriceModal({...priceModal, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Notes sur le devis..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignModal.isOpen}
        title="Assigner un technicien"
        confirmText="Confirmer l'assignation"
        onClose={() => setAssignModal({ isOpen: false, technicianId: '' })}
        onConfirm={handleAssignTechnician}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Sélectionner un technicien
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {technicians.length > 0 ? (
                technicians.map(tech => (
                  <button
                    key={tech._id}
                    type="button"
                    onClick={() => setAssignModal({ ...assignModal, technicianId: tech._id })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      assignModal.technicianId === tech._id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      assignModal.technicianId === tech._id
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                        : 'bg-gray-400'
                    }`}>
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{tech.name}</p>
                      <p className="text-sm text-gray-500">{tech.email || 'Technicien'}</p>
                      {tech.skills && tech.skills.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {tech.skills.slice(0, 2).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                          {tech.skills.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{tech.skills.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {assignModal.technicianId === tech._id && (
                      <CheckCircle className="text-purple-600" size={20} />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-500 font-medium">Aucun technicien disponible</p>
                  <p className="text-sm text-gray-400 mt-1">Ajoutez des techniciens dans la section employés</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}