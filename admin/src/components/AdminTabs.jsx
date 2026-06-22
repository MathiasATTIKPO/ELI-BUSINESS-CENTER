// admin/src/components/AdminTabs.jsx
import React, { useState, Suspense, lazy, useEffect } from 'react'
import { 
  Activity, Wrench, RefreshCw, Smartphone, Package, 
  Users, ShoppingCart, History, FileText, Loader 
} from 'lucide-react'
import api from '../services/api'

// Importer dynamiquement les pages
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Repairs = lazy(() => import('../pages/Repairs'))
const TradeIns = lazy(() => import('../pages/TradeIns'))
const Products = lazy(() => import('../pages/Products'))
const Inventory = lazy(() => import('../pages/Inventory'))
const Employees = lazy(() => import('../pages/Employees'))
const ActivityHistory = lazy(() => import('../pages/ActivityHistory'))

// Composant de chargement
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader className="animate-spin text-blue-600" size={48} />
  </div>
)

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [pendingRepairsCount, setPendingRepairsCount] = useState(0)
  const [pendingTradeinsCount, setPendingTradeinsCount] = useState(0)
  const [loadingBadges, setLoadingBadges] = useState(true)

  // Récupérer les compteurs pour les badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [repairsRes, tradeinsRes] = await Promise.all([
          api.get('/api/admin/repairs'),
          api.get('/api/admin/tradeins')
        ])
        
        const repairs = repairsRes.data.data || []
        const tradeins = tradeinsRes.data.data || []
        
        setPendingRepairsCount(repairs.filter(r => r.status === 'pending').length)
        setPendingTradeinsCount(tradeins.filter(t => t.status === 'pending').length)
      } catch (error) {
        console.error('Erreur lors du chargement des compteurs:', error)
      } finally {
        setLoadingBadges(false)
      }
    }
    
    fetchCounts()
    
    // Rafraîchir les compteurs toutes les 30 secondes
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <Activity size={18} />, component: Dashboard, badge: null },
    { id: 'repairs', label: 'Réparations', icon: <Wrench size={18} />, component: Repairs, badge: pendingRepairsCount },
    { id: 'tradeins', label: 'Échanges', icon: <RefreshCw size={18} />, component: TradeIns, badge: pendingTradeinsCount },
    { id: 'products', label: 'Produits', icon: <Smartphone size={18} />, component: Products, badge: null },
    { id: 'inventory', label: 'Inventaire', icon: <Package size={18} />, component: Inventory, badge: null },
    { id: 'employees', label: 'Employés', icon: <Users size={18} />, component: Employees, badge: null },
    { id: 'sales', label: 'Ventes', icon: <ShoppingCart size={18} />, component: () => <div className="p-6 text-center">Page des ventes (à créer)</div>, badge: null },
    { id: 'history', label: 'Historique', icon: <History size={18} />, component: ActivityHistory, badge: null },
    { id: 'activity', label: 'Activité', icon: <FileText size={18} />, component: ActivityHistory, badge: null }
  ]

  const CurrentComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard

  return (
    <div className="space-y-6">
      {/* Onglets principaux */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg overflow-x-auto">
        <nav className="flex gap-1 px-4 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {!loadingBadges && tab.badge > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500 text-white min-w-[20px] text-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <Suspense fallback={<PageLoader />}>
        <CurrentComponent />
      </Suspense>
    </div>
  )
}