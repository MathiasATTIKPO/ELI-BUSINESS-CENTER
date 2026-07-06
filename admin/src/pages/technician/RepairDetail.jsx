import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  LogOut, ArrowLeft, Smartphone, User, Phone, Calendar, Clock,
  CheckCircle, AlertCircle, Wrench, FileText, MessageSquare,
  Camera, ChevronRight, Send, Save, RefreshCw, Package, Star,
  Zap, Shield, MapPin, Mail, DollarSign, Edit3, Eye,Search
} from 'lucide-react'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import api from '../../services/api'
import Toast from '../../components/Toast'
import { formatReference } from '../../utils/formatReference'

export default function TechnicianRepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useTechnicianAuth()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState(null)
  const [technicianReport, setTechnicianReport] = useState('')
  const [showFullImage, setShowFullImage] = useState(null)

  useEffect(() => {
    fetchRepair()
  }, [id])

  const fetchRepair = async () => {
    try {
      const response = await api.get(`/api/technician/repair/${id}`)
      setRepair(response.data.data)
      setTechnicianReport(response.data.data.technicianReport || '')
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement de la réparation' })
      navigate('/technician/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      const response = await api.put(`/api/technician/repair/${id}/status`, {
        status: newStatus,
        technicianReport: technicianReport
      })
      setRepair(response.data.data)
      setToast({ type: 'success', message: 'Statut mis à jour avec succès' })
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour' })
    } finally {
      setUpdating(false)
    }
  }

  const saveReport = async () => {
    if (!technicianReport.trim()) {
      setToast({ type: 'error', message: 'Veuillez saisir un rapport d\'intervention' })
      return
    }
    await updateStatus(repair.status)
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
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: User, 
        label: 'Assignée',
        gradient: 'from-blue-400 to-cyan-500',
        bgGradient: 'from-blue-500 to-cyan-500'
      },
      diagnosing: { 
        color: 'bg-purple-50 text-purple-700 border-purple-200', 
        icon: Search, 
        label: 'Diagnostic',
        gradient: 'from-purple-400 to-violet-500',
        bgGradient: 'from-purple-500 to-violet-500'
      },
      repairing: { 
        color: 'bg-orange-50 text-orange-700 border-orange-200', 
        icon: Wrench, 
        label: 'En réparation',
        gradient: 'from-orange-400 to-red-500',
        bgGradient: 'from-orange-500 to-red-500'
      },
      ready: { 
        color: 'bg-teal-50 text-teal-700 border-teal-200', 
        icon: Package, 
        label: 'Prête',
        gradient: 'from-teal-400 to-emerald-500',
        bgGradient: 'from-teal-500 to-emerald-500'
      },
      completed: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Terminée',
        gradient: 'from-emerald-400 to-green-500',
        bgGradient: 'from-emerald-500 to-green-500'
      },
      paid: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircle, 
        label: 'Payée',
        gradient: 'from-emerald-400 to-green-500',
        bgGradient: 'from-emerald-500 to-green-500'
      },
      cancelled: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        icon: AlertCircle, 
        label: 'Annulée',
        gradient: 'from-red-400 to-rose-500',
        bgGradient: 'from-red-500 to-rose-500'
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

  const getNextStatuses = (currentStatus) => {
    const flows = {
      assigned: [
        { value: 'diagnosing', label: 'Commencer le diagnostic', icon: Search, gradient: 'from-purple-500 to-violet-500' },
      ],
      diagnosing: [
        { value: 'repairing', label: 'Démarrer la réparation', icon: Wrench, gradient: 'from-orange-500 to-red-500' },
        { value: 'ready', label: 'Marquer comme prêt', icon: Package, gradient: 'from-teal-500 to-emerald-500' },
      ],
      repairing: [
        { value: 'ready', label: 'Réparation terminée', icon: CheckCircle, gradient: 'from-teal-500 to-emerald-500' },
      ],
      ready: [
        { value: 'completed', label: 'Finaliser', icon: Star, gradient: 'from-emerald-500 to-green-500' },
      ]
    }
    return flows[currentStatus] || []
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600"></div>
            <Wrench className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement de la réparation...</p>
        </div>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Réparation introuvable</p>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(repair.status)
  const StatusIcon = statusConfig.icon
  const nextStatuses = getNextStatuses(repair.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Barre supérieure */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/technician/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium hidden sm:inline">Retour</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                <span className="font-semibold text-gray-900">
                  {formatReference(repair._id)}
                </span>
              </div>
            </div>
            {/*<button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline font-medium">Déconnexion</span>
            </button>*/}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* En-tête */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${statusConfig.gradient}`}></div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {repair.deviceModel || repair.phoneModel || 'Réparation'}
                  </h1>
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Calendar size={14} />
                  Créée le {formatDate(repair.createdAt)}
                </p>
              </div>
              
              {nextStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => {
                    const NextIcon = status.icon
                    return (
                      <button
                        key={status.value}
                        onClick={() => updateStatus(status.value)}
                        disabled={updating}
                        className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${status.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                      >
                        <NextIcon size={18} />
                        {updating ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Mise à jour...
                          </>
                        ) : (
                          status.label
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Infos principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
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
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      {repair.clientName || 'Non spécifié'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp</p>
                    {repair.clientWhatsapp ? (
                      <a 
                        href={`https://wa.me/${repair.clientWhatsapp.replace(/^\+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-green-600 hover:text-green-700 flex items-center gap-2"
                      >
                        <Phone size={16} />
                        {repair.clientWhatsapp}
                      </a>
                    ) : (
                      <p className="text-gray-400">Non renseigné</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Appareil</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <Smartphone size={16} className="text-gray-400" />
                      {repair.deviceModel || 'Non spécifié'}
                    </p>
                  </div>
                  {repair.estimatedPrice && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Devis estimé</p>
                      <p className="font-bold text-emerald-600 flex items-center gap-2">
                        <DollarSign size={16} />
                        {repair.estimatedPrice.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description du problème */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                    <AlertCircle size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Problème Déclaré</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-gray-700 leading-relaxed">
                    {repair.issueDescription || 'Aucune description fournie par le client.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rapport d'intervention */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500">
                    <FileText size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Rapport d'Intervention</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Décrivez les interventions effectuées
                  </label>
                  <textarea
                    value={technicianReport}
                    onChange={(e) => setTechnicianReport(e.target.value)}
                    rows={6}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    placeholder="Détaillez les diagnostics, réparations effectuées, pièces utilisées et recommandations..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveReport}
                    disabled={updating || !technicianReport.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Sauvegarder le rapport
                      </>
                    )}
                  </button>
                  {technicianReport.trim() && (
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Rapport rédigé
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite - Photos et Historique */}
          <div className="space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                    <Camera size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Photos du client
                    {repair.photos?.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500 font-normal">
                        ({repair.photos.length})
                      </span>
                    )}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                {repair.photos && repair.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {repair.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => setShowFullImage(photo)}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}${photo}`}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-200 flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Aucune photo fournie</p>
                  </div>
                )}
              </div>
            </div>

            {/* Historique / Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600">
                    <Clock size={18} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Historique</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Création */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                      <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-gray-900">Réparation créée</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(repair.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Statut actuel */}
                  {repair.status !== 'pending' && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusConfig.bgGradient} ring-4 ring-opacity-20`} 
                          style={{ '--tw-ring-color': statusConfig.bgGradient.split(' ')[1] }}></div>
                        {repair.completedAt && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-semibold text-gray-900">
                          Statut : {statusConfig.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(repair.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Terminée */}
                  {repair.completedAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Réparation terminée</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(repair.completedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal image plein écran */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullImage(null)}
        >
          <img
            src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}${showFullImage}`}
            alt="Vue agrandie"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            onClick={() => setShowFullImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <AlertCircle size={24} />
          </button>
        </div>
      )}
    </div>
  )
}