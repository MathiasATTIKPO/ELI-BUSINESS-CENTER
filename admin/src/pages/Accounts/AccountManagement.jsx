import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, ShieldCheck, Award, Store } from 'lucide-react'

export default function AccountManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('employees')

  const tabs = useMemo(() => ([
    {
      key: 'employees',
      label: 'Employés',
      icon: ShieldCheck,
      description: 'Créez les comptes employés (admin, caissier, technicien).',
      primaryActionLabel: 'Créer un employé',
      primaryAction: () => navigate('/admin/employees/new'),
      secondaryActionLabel: 'Gérer les employés',
      secondaryAction: () => navigate('/admin/employees')
    },
    {
      key: 'vips',
      label: 'Clients VIP',
      icon: Award,
      description: 'Créez et gérez les comptes clients VIP.',
      primaryActionLabel: 'Créer un VIP',
      primaryAction: () => navigate('/admin/vips/new'),
      secondaryActionLabel: 'Gérer les VIP',
      secondaryAction: () => navigate('/admin/vips')
    },
    {
      key: 'resellers',
      label: 'Revendeurs',
      icon: Store,
      description: 'Créez des comptes revendeurs et leurs contrats.',
      primaryActionLabel: 'Créer un revendeur',
      primaryAction: () => navigate('/admin/resellers/new'),
      secondaryActionLabel: 'Gérer les revendeurs',
      secondaryAction: () => navigate('/admin/resellers')
    }
  ]), [navigate])

  const currentTab = tabs.find((tab) => tab.key === activeTab) || tabs[0]
  const CurrentIcon = currentTab.icon

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Gestion des Comptes</h1>
        <p className="text-gray-500 mt-1">Regroupez la création des comptes employés, VIP et revendeurs dans un seul espace.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 pt-5 border-b border-gray-100 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition ${isActive ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <CurrentIcon size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentTab.label}</h2>
              <p className="text-gray-600 mt-1">{currentTab.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={currentTab.primaryAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 transition font-medium"
            >
              <UserPlus size={18} />
              {currentTab.primaryActionLabel}
            </button>
            <button
              type="button"
              onClick={currentTab.secondaryAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <Users size={18} />
              {currentTab.secondaryActionLabel}
            </button>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Astuce: pour les revendeurs sans compte plateforme, créez directement le contrat depuis la page revendeurs avec le bouton "Nouveau contrat".
          </div>
        </div>
      </div>
    </div>
  )
}
