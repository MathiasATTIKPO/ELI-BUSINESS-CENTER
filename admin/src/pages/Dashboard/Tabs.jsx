import React from 'react'
import { Wrench, RefreshCw, Smartphone, Package, Users, ShoppingCart, History, FileText, Home, Clock } from 'lucide-react'

const ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home },
  { id: 'repairs', label: 'Réparations', icon: Wrench, badgeKey: 'pendingRepairsCount' },
  { id: 'tradeins', label: 'Échanges', icon: RefreshCw, badgeKey: 'pendingTradeinsCount' },
  { id: 'products', label: 'Produits', icon: Smartphone },
  { id: 'inventory', label: 'Inventaire', icon: Package },
  { id: 'employees', label: 'Employés', icon: Users },
  { id: 'sales', label: 'Ventes', icon: ShoppingCart },
  { id: 'invoices', label: 'Factures', icon: FileText },
  { id: 'history', label: 'Historique', icon: History },
  { id: 'reports', label: 'Rapports', icon: FileText },
]

export default function Tabs({ activeMainTab, setActiveMainTab, setActiveSubTab, badges }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <nav className="flex gap-1 px-2 overflow-x-auto scrollbar-hide">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeMainTab === item.id
          const badgeValue = item.badgeKey ? badges[item.badgeKey] : null

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveMainTab(item.id)
                setActiveSubTab(item.id === 'dashboard' ? 'overview' : 'list')
              }}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {item.label}
              {badgeValue > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white animate-pulse inline-flex items-center gap-1">
                  <Clock size={11} />
                  {badgeValue}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
