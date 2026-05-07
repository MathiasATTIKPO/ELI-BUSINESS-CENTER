import React, { useState, useEffect } from 'react'
import { Download, Filter } from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function CashierReport() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('all')

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
    fetchRepairs()
  }, [])

  const fetchRepairs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/repairs')
      const paidRepairs = response.data.data?.filter(r => r.status === 'paid') || []
      setRepairs(paidRepairs)
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const filteredRepairs = repairs.filter(r => {
    const paymentDate = r.saleInfo?.paymentDate ? new Date(r.saleInfo.paymentDate) : null
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const dateMatch = !paymentDate || (paymentDate >= start && paymentDate <= end)
    const methodMatch = paymentMethod === 'all' || r.saleInfo?.paymentMethod === paymentMethod

    return dateMatch && methodMatch
  })

  const totalAmount = filteredRepairs.reduce((sum, r) => sum + (r.saleInfo?.amountPaid || r.saleInfo?.amount || 0), 0)
  const totalRepairs = filteredRepairs.length

  const paymentMethods = {}
  filteredRepairs.forEach(r => {
    const method = r.saleInfo?.paymentMethod || 'unknown'
    paymentMethods[method] = (paymentMethods[method] || 0) + (r.saleInfo?.amountPaid || r.saleInfo?.amount || 0)
  })

  const exportReport = () => {
    let csv = 'Date,Client,Téléphone,Montant,Méthode,Notes\n'
    filteredRepairs.forEach(r => {
      const date = r.saleInfo?.paymentDate ? new Date(r.saleInfo.paymentDate).toLocaleDateString('fr-FR') : '-'
      const amount = r.saleInfo?.amountPaid || r.saleInfo?.amount || r.price || 0
      const method = r.saleInfo?.paymentMethod || '-'
      const notes = r.saleInfo?.notes?.replace(/"/g, '""') || ''
      csv += `"${date}","${r.clientName}","${r.whatsapp}","${amount}","${method}","${notes}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport-caisse-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapport de Caisse</h1>
          <p className="text-gray-600 mt-1">Suivi des ventes et des paiements</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 btn-info"
        >
          <Download size={20} />
          Exporter CSV
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filtres</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode de paiement
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-base"
            >
              <option value="all">Tous</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="check">Chèque</option>
              <option value="transfer">Virement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total des ventes</h3>
          <p className="text-3xl font-bold text-green-600">
            {totalAmount.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Nombre de transactions</h3>
          <p className="text-3xl font-bold text-blue-600">{totalRepairs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Moyenne par transaction</h3>
          <p className="text-3xl font-bold text-purple-600">
            {totalRepairs > 0 ? (totalAmount / totalRepairs).toLocaleString('fr-FR') : '0'} FCFA
          </p>
        </div>
      </div>

      {/* Paiements par méthode */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Paiements par méthode</h2>
        <div className="space-y-3">
          {Object.entries(paymentMethods).map(([method, amount]) => (
            <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium text-gray-900 capitalize">
                {method === 'cash' ? 'Espèces' :
                 method === 'card' ? 'Carte' :
                 method === 'check' ? 'Chèque' :
                 method === 'transfer' ? 'Virement' :
                 'Autre'}
              </span>
              <span className="font-bold text-gray-900">
                {amount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Détail des transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Détail des transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Montant</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Méthode</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRepairs.map(repair => (
                <tr key={repair._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {repair.saleInfo?.paymentDate
                      ? new Date(repair.saleInfo.paymentDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{repair.clientName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {(repair.saleInfo?.amountPaid || repair.saleInfo?.amount || repair.price || 0).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {repair.saleInfo?.paymentMethod === 'cash' ? 'Espèces' :
                     repair.saleInfo?.paymentMethod === 'card' ? 'Carte' :
                     repair.saleInfo?.paymentMethod === 'check' ? 'Chèque' :
                     repair.saleInfo?.paymentMethod === 'transfer' ? 'Virement' :
                     '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {repair.saleInfo?.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
