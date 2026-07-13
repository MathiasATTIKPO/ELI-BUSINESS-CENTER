import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import PageHeader from '../../components/PageHeader'

const VipStats = () => {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/vip/stats')
        if (res.data.success) setStats(res.data.data)
      } catch (e) { console.error(e) }
    }
    fetch()
  }, [])

  if (!stats) return <div>Chargement...</div>

  const items = [
    { label: 'Clients VIP total', value: stats.totalVipClients ?? stats.activeClients ?? 0 },
    { label: 'Réparations non facturées', value: stats.unbilledRepairs ?? 0 },
    { label: 'Réparations facturées', value: stats.billedRepairs ?? 0 },
    { label: 'CA facturé (mois)', value: `${Number(stats.billedRevenue || 0).toLocaleString('fr-FR')} FCFA` },
    { label: 'CA encaissé (mois)', value: `${Number(stats.collectedRevenue || 0).toLocaleString('fr-FR')} FCFA` },
    { label: 'Créances en attente', value: `${Number(stats.receivables || 0).toLocaleString('fr-FR')} FCFA` },
    { label: 'Factures du mois', value: stats.invoicesThisMonth ?? 0 },
    { label: 'Factures en retard', value: stats.overdueInvoices ?? 0 },
    { label: 'Factures payées (mois)', value: stats.paidInvoices ?? 0 },
    { label: 'Factures impayées (mois)', value: stats.unpaidInvoices ?? 0 }
  ]

  return (
    <div>
      <PageHeader title="Statistiques VIP" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs uppercase text-gray-500">{item.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white border border-gray-100 rounded-xl p-4">
        <h3 className="font-semibold mb-3">Statistiques mensuelles et annuelles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Mois</th>
                <th className="py-2">Facturé</th>
                <th className="py-2">Encaissé</th>
                <th className="py-2">Nb factures</th>
              </tr>
            </thead>
            <tbody>
              {(stats.monthlySeries || []).map((row) => (
                <tr key={row.month} className="border-b border-gray-50">
                  <td className="py-2">{row.month}</td>
                  <td className="py-2">{Number(row.billed || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-2">{Number(row.collected || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="py-2">{row.invoices || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default VipStats
