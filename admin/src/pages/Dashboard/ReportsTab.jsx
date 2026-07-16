import React from 'react'
import { DollarSign, Activity } from 'lucide-react'

export default function ReportsTab({ stats, sales, employees }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign size={20} className="text-emerald-600" />
          Rapport financier
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Chiffre d'affaires total</span><span className="font-bold text-xl text-emerald-600">{stats.totalRevenue.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl"><span className="font-medium text-gray-700">Ventes téléphones</span><span className="font-bold text-blue-600">{stats.phoneSalesRevenue.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl"><span className="font-medium text-gray-700">Réparations</span><span className="font-bold text-indigo-600">{stats.repairRevenue.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl"><span className="font-medium text-gray-700">Échanges</span><span className="font-bold text-purple-600">{stats.tradeinRevenue.toLocaleString('fr-FR')} FCFA</span></div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Transactions totales</span><span className="font-bold text-gray-900">{sales.length}</span></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity size={20} className="text-blue-600" />
          Rapport d'activité
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Téléphones vendus</span><span className="font-bold text-xl text-cyan-600">{stats.totalPhoneSales}</span></div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Réparations traitées</span><span className="font-bold text-xl text-blue-600">{stats.completedRepairsCount}</span></div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Échanges finalisés</span><span className="font-bold text-xl text-purple-600">{stats.tradeinsByStatus.find((s) => s.name === 'Terminée')?.value || 0}</span></div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Taux d'activité réparations</span><span className="font-bold text-gray-900">{stats.totalRepairs > 0 ? Math.round((stats.completedRepairsCount / stats.totalRepairs) * 100) : 0}%</span></div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"><span className="font-medium text-gray-700">Employés actifs</span><span className="font-bold text-gray-900">{employees.filter((e) => e.isActive !== false).length}</span></div>
        </div>
      </div>
    </div>
  )
}
