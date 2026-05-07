import React, { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import api from '../services/api'
import Table from '../components/Table'
import Toast from '../components/Toast'

export default function Repairs() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [technicians, setTechnicians] = useState([])

  useEffect(() => {
    fetchRepairs()
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('/api/admin/employees')
      const techList = response.data.data?.filter(e => e.role === 'technician') || []
      setTechnicians(techList)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens')
    }
  }

  const fetchRepairs = async () => {
    try {
      const response = await api.get('/api/admin/repairs')
      setRepairs(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const filteredRepairs = repairs.filter(r => {
    const statusMatch = statusFilter === 'all' || r.status === statusFilter
    const techMatch = technicianFilter === 'all' || r.assignedTo?._id === technicianFilter
    const searchMatch = !searchTerm || 
      r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r._id?.includes(searchTerm)
    return statusMatch && techMatch && searchMatch
  })

  const columns = [
    { key: '_id', label: 'ID Demande', sortable: true, render: (val) => val?.substring(0, 8) },
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'phoneModel', label: 'Téléphone', sortable: true },
    {
      key: 'status',
      label: 'Statut',
      render: (val) => (
        <span className={`badge-status-${val}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('fr-FR'),
    },
  ]

  const actionColumn = (repair) => (
    <a href={`/admin/repairs/${repair._id}`} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
      Voir détails
    </a>
  )

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div>
        <h1 className="text-3xl font-bold text-primary">Demandes de Réparation</h1>
        <p className="text-gray-600">Gérez les demandes de réparation de vos clients</p>
      </div>

      {/* Barre de recherche et filtres avancés */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client, téléphone ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les techniciens</option>
            {technicians.map(tech => (
              <option key={tech._id} value={tech._id}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', 'pending', 'quoted', 'accepted', 'repairing', 'ready', 'completed', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'Tous' : status}
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          data={filteredRepairs}
          actionColumn={actionColumn}
          searchField="clientName"
        />
      </div>
    </div>
  )
}
