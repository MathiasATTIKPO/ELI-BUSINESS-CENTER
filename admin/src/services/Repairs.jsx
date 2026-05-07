import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, CreditCard } from 'lucide-react'
import api from '../../services/api'

export default function CashierRepairs() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ready')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const response = await api.get('/api/admin/repairs')
        setRepairs(response.data.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchRepairs()
  }, [])

  const filteredRepairs = repairs.filter(r => filter === 'all' || r.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Paiements Réparations</h1>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2"
        >
          <option value="ready">Prêtes pour retrait</option>
          <option value="completed">Terminées (Payées)</option>
          <option value="all">Toutes</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Client / Modèle</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Prix</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Statut</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRepairs.map((repair) => (
              <tr key={repair._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{repair.clientName}</div>
                  <div className="text-sm text-gray-500">{repair.phoneModel}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-accent">
                    {(repair.price || 0).toLocaleString()} FCFA
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    repair.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {repair.status === 'ready' ? 'Prêt' : 'Payé'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => navigate(`/admin/repair/${repair._id}`)} // Réutilisation du détail admin pour simplicité ou créer une vue dédiée
                    className="text-primary hover:text-blue-800 font-medium inline-flex items-center gap-1"
                  >
                    {repair.status === 'ready' ? 'Encaisser' : 'Détails'}
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}