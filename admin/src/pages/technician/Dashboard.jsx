import React, { useEffect, useState } from 'react'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianDashboard() {
  const { user, logout } = useTechnicianAuth()
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      const response = await api.get('/api/technician/repairs')
      setRepairs(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement des réparations' })
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Espace Technicien</h1>
              <p className="text-sm text-gray-600">Bienvenue, {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">R</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Réparations</p>
                <p className="text-2xl font-semibold text-gray-900">{repairs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">E</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.filter(r => ['assigned', 'diagnosing', 'repairing'].includes(r.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">T</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Prêtes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {repairs.filter(r => r.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Repairs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mes Réparations</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {repairs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Aucune réparation assignée pour le moment.
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                          {getStatusText(repair.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {repair.clientName} • {repair.clientWhatsapp}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {repair.issueDescription}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(repair.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <button
                        onClick={() => window.location.href = `/technician/repair/${repair._id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
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