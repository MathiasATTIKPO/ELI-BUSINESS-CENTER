import React, { useState, useEffect } from 'react'
import api from '../services/api'
import Table from '../components/Table'
import Toast from '../components/Toast'

export default function TradeIns() {
  const [tradeins, setTradeins] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTradeins()
  }, [])

  const fetchTradeins = async () => {
    try {
      const response = await api.get('/api/admin/tradeins')
      setTradeins(response.data.data || [])
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const filteredTradeins = statusFilter === 'all'
    ? tradeins
    : tradeins.filter(t => t.status === statusFilter)

  const columns = [
    { key: '_id', label: 'ID Demande', sortable: true, render: (val) => val?.substring(0, 8) },
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'phoneModel', label: 'Téléphone', sortable: true },
    {
      key: 'status',
      label: 'Statut',
      render: (val) => (
        <span className={`badge-tradein-${val}`}>
          {val}
        </span>
      ),
    },
  ]

  const actionColumn = (tradein) => (
    <a href={`/admin/tradeins/${tradein._id}`} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
      Voir détails
    </a>
  )

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div>
        <h1 className="text-3xl font-bold text-primary">Demandes d'Échange</h1>
        <p className="text-gray-600">Gérez les demandes d'échange de téléphones</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {['all', 'pending', 'accepted', 'refused', 'completed'].map((status) => (
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
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          data={filteredTradeins}
          actionColumn={actionColumn}
          searchField="clientName"
        />
      </div>
    </div>
  )
}
