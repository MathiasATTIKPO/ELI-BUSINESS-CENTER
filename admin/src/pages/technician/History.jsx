import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianHistory() {
  const navigate = useNavigate()
  const { user } = useTechnicianAuth()
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/technician/history')
      setRepairs(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement de l\'historique' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique des réparations</h1>
              <p className="text-sm text-gray-600">Réparations terminées - {user?.name}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/technician/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Réparations terminées ({repairs.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {repairs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Aucune réparation terminée pour le moment.
              </div>
            ) : (
              repairs.map((repair) => (
                <div key={repair._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {repair.deviceModel || 'Modèle non spécifié'}
                        </h3>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Terminée
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {repair.clientName} • {repair.clientWhatsapp}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {repair.issueDescription}
                      </p>
                      {repair.technicianReport && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">Rapport d'intervention :</p>
                          <p className="text-xs text-blue-800">{repair.technicianReport}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-sm text-gray-500">
                        Terminée le {new Date(repair.completedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <button
                        onClick={() => navigate(`/technician/repair/${repair._id}`)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}