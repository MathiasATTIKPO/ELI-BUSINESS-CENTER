// admin/src/components/AdminTabsWithRouter.jsx
import React from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  Activity, Wrench, RefreshCw, Smartphone, Package, 
  Users, ShoppingCart, History, FileText 
} from 'lucide-react'
import Dashboard from '../pages/Dashboard'
import Repairs from '../pages/Repairs'
import TradeIns from '../pages/TradeIns'
import Products from '../pages/Products'
import Inventory from '../pages/Inventory'
import Employees from '../pages/Employees'
import ActivityHistory from '../pages/ActivityHistory'

export default function AdminTabsWithRouter() {
  const location = useLocation()
  const currentPath = location.pathname.split('/').pop() || 'dashboard'

  const tabs = [
    { path: 'dashboard', label: 'Tableau de bord', icon: <Activity size={18} />, component: Dashboard },
    { path: 'repairs', label: 'Réparations', icon: <Wrench size={18} />, component: Repairs },
    { path: 'tradeins', label: 'Échanges', icon: <RefreshCw size={18} />, component: TradeIns },
    { path: 'products', label: 'Produits', icon: <Smartphone size={18} />, component: Products },
    { path: 'inventory', label: 'Inventaire', icon: <Package size={18} />, component: Inventory },
    { path: 'employees', label: 'Employés', icon: <Users size={18} />, component: Employees },
    { path: 'sales', label: 'Ventes', icon: <ShoppingCart size={18} />, component: () => <div className="p-6 text-center">Page des ventes (à créer)</div> },
    { path: 'history', label: 'Historique', icon: <History size={18} />, component: ActivityHistory },
    { path: 'activity', label: 'Activité', icon: <FileText size={18} />, component: ActivityHistory }
  ]

  return (
    <div className="space-y-6">
      {/* Onglets principaux */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
        <nav className="flex gap-1 px-4 min-w-max">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={`/admin/${tab.path}`}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition ${
                currentPath === tab.path
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Routes pour chaque onglet */}
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="tradeins" element={<TradeIns />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="employees" element={<Employees />} />
        <Route path="sales" element={<div className="p-6 text-center">Page des ventes (à créer)</div>} />
        <Route path="history" element={<ActivityHistory />} />
        <Route path="activity" element={<ActivityHistory />} />
      </Routes>
    </div>
  )
}