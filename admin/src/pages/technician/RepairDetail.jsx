import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianRepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useTechnicianAuth()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState(null)
  const [technicianReport, setTechnicianReport] = useState('')

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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      diagnosing: 'bg-purple-100 text-purple-800',
      repairing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'En attente',
      assigned: 'Assignée',
      diagnosing: 'Diagnostic',
      repairing: 'En réparation',
      ready: 'Prête',
      completed: 'Terminée',
      cancelled: 'Annulée'
    }
    return texts[status] || status
  }

  const getNextStatuses = (currentStatus) => {
    const flows = {
      assigned: ['diagnosing'],
      diagnosing: ['repairing', 'ready'],
      repairing: ['ready'],
      ready: ['completed']
    }
    return flows[currentStatus] || []
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Réparation introuvable</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Header */}
      <button
        onClick={() => navigate('/technician/dashboard')}
        className="flex items-center gap-2 text-primary hover:underline transition"
      >
        ← Retour au tableau de bord
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {repair.phoneModel || repair.deviceModel || 'Réparation'}
        </h1>
        <p className="text-gray-500">ID: #{repair._id.substring(0, 8).toUpperCase()}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Statut actuel</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                  {getStatusText(repair.status)}
                </span>
              </div>

              {getNextStatuses(repair.status).length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-600">
                    Passer au statut suivant :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getNextStatuses(repair.status).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(status)}
                        disabled={updating}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90 disabled:opacity-50 transition shadow-sm"
                      >
                        {updating ? 'Mise à jour...' : getStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Détails de la demande</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Client</span>
                  <p className="font-semibold text-gray-900">{repair.clientName || 'Non spécifié'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">WhatsApp</span>
                  <p className="text-sm text-gray-900">{repair.clientWhatsapp}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Appareil</span>
                  <p className="text-sm text-gray-900">{repair.deviceModel || 'Non spécifié'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Problème déclaré</span>
                  <p className="text-sm text-gray-900">{repair.issueDescription}</p>
                </div>
              </div>
            </div>

            {/* Technician Report */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Rapport d'intervention</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Décrivez les interventions effectuées :
                  </label>
                  <textarea
                    value={technicianReport}
                    onChange={(e) => setTechnicianReport(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition"
                    placeholder="Détaillez les diagnostics, réparations et pièces utilisées..."
                  />
                </div>
                <button
                  onClick={() => updateStatus(repair.status)}
                  disabled={updating}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition shadow-md"
                >
                  {updating ? 'Sauvegarde...' : 'Sauvegarder le rapport'}
                </button>
              </div>
            </div>
          </div>

          {/* Photos Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos du client</h2>
              {repair.photos && repair.photos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {repair.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}${photo}`}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune photo fournie</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Réparation créée</p>
                    <p className="text-xs text-gray-500">
                      {new Date(repair.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                {repair.completedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Réparation terminée</p>
                      <p className="text-xs text-gray-500">
                        {new Date(repair.completedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      {/* </main> */}
    </div>
  )
}