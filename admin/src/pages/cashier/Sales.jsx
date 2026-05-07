import React, { useState, useEffect } from 'react'
import { Plus, Eye, Trash2, AlertCircle, Filter } from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function CashierSales() {
  const [sales, setSales] = useState([])
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showNewSale, setShowNewSale] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [newSale, setNewSale] = useState({
    repairId: '',
    amountPaid: '',
    paymentMethod: 'cash',
    notes: ''
  })

  useEffect(() => {
    fetchRepairsAndSales()
  }, [])

  const fetchRepairsAndSales = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/repairs')
      const completedRepairs = response.data.data?.filter(r => r.status === 'completed') || []
      setRepairs(completedRepairs)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const handleNewSale = async (e) => {
    e.preventDefault()
    if (!newSale.repairId || !newSale.amountPaid) {
      setToast({ type: 'error', message: 'Veuillez remplir tous les champs' })
      return
    }

    try {
      const selectedRepair = repairs.find(r => r._id === newSale.repairId)
      await api.put(`/api/admin/repair/${newSale.repairId}/status`, { 
        status: 'paid',
        saleInfo: {
          amount: parseFloat(newSale.amountPaid),
          amountPaid: parseFloat(newSale.amountPaid),
          paymentMethod: newSale.paymentMethod,
          paymentDate: new Date(),
          notes: newSale.notes
        }
      })
      
      setToast({ type: 'success', message: 'Vente enregistrée' })
      setNewSale({ repairId: '', amountPaid: '', paymentMethod: 'cash', notes: '' })
      setShowNewSale(false)
      fetchRepairsAndSales()
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors de l\'enregistrement' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Espace Caissier</h1>
          <p className="text-gray-600 mt-1">Gestion des ventes et des paiements</p>
        </div>
        <button
          onClick={() => setShowNewSale(true)}
          className="flex items-center gap-2 btn-success"
        >
          <Plus size={20} />
          Nouvelle Vente
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Réparations terminées</h3>
          <p className="text-3xl font-bold text-info">{repairs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Montant total</h3>
          <p className="text-3xl font-bold text-success">
            {repairs.reduce((sum, r) => sum + (r.price || 0), 0).toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Paiements reçus</h3>
          <p className="text-3xl font-bold text-purple-600">
            {repairs.filter(r => r.status === 'paid').length}
          </p>
        </div>
      </div>

      {/* Liste des réparations disponibles */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Réparations à vendre</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : repairs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={32} />
            <p className="text-gray-600">Aucune réparation terminée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Téléphone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Devis</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {repairs.map(repair => (
                  <tr key={repair._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{repair.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{repair.whatsapp}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {repair.price?.toLocaleString('fr-FR') || '-'} FCFA
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                        Prêt à vendre
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setNewSale({
                            repairId: repair._id,
                            amountPaid: repair.price?.toString() || '',
                            paymentMethod: 'cash',
                            notes: ''
                          })
                          setShowNewSale(true)
                        }}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Valider vente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nouvelle Vente */}
      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvelle Vente</h3>
            <form onSubmit={handleNewSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Réparation
                </label>
                <select
                  value={newSale.repairId}
                  onChange={(e) => {
                    const repair = repairs.find(r => r._id === e.target.value)
                    setNewSale({
                      ...newSale,
                      repairId: e.target.value,
                      amountPaid: repair?.price?.toString() || ''
                    })
                  }}
                  className="input-base"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  {repairs.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.clientName} - {r.price?.toLocaleString('fr-FR') || '-'} FCFA
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé (FCFA)
                </label>
                <input
                  type="number"
                  value={newSale.amountPaid}
                  onChange={(e) => setNewSale({ ...newSale, amountPaid: e.target.value })}
                  placeholder="0"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  value={newSale.paymentMethod}
                  onChange={(e) => setNewSale({ ...newSale, paymentMethod: e.target.value })}
                  className="input-base"
                >
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newSale.notes}
                  onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                  placeholder="Notes optionnelles..."
                  className="input-base"
                  rows="3"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewSale(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
