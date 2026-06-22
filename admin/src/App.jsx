import React, { useState, useRef, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, Smartphone, Package, Users, ShoppingCart, History, FileText, Wrench, RefreshCw, Bell, CheckCheck, BarChart3, ListChecks } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TechnicianAuthProvider, useTechnicianAuth } from './context/TechnicianAuthContext'
import { CashierAuthProvider, useCashierAuth } from './context/CashierAuthContext'
import { NotificationProvider, useNotifications } from './context/NotificationContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import TechnicianProtectedRoute from './components/TechnicianProtectedRoute'
import CashierProtectedRoute from './components/CashierProtectedRoute'
import NotificationBell from './components/NotificationBell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Repairs from './pages/Repairs'
import RepairDetail from './pages/RepairDetail'
import TradeIns from './pages/TradeIns'
import TradeInDetail from './pages/TradeInDetail'
import Inventory from './pages/Inventory'
import Employees from './pages/Employees'
import EmployeeForm from './pages/EmployeeForm'
import ActivityHistory from './pages/ActivityHistory'
import CashierSales from './pages/cashier/Sales'
import CashierReport from './pages/cashier/Report'
import CashierLogin from './pages/cashier/Login'
import CashierRepairDetail from './pages/cashier/RepairDetail'
import CashierTradeInDetail from './pages/cashier/TradeInDetail'
import TechnicianLogin from './pages/technician/Login'
import TechnicianDashboard from './pages/technician/Dashboard'
import TechnicianRepairDetail from './pages/technician/RepairDetail'
import TechnicianHistory from './pages/technician/History'
import TechnicianTradeInDetail from './pages/technician/TradeInDetail'


// ========== COMPOSANT ADMIN ==========
function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/repairs', label: 'Réparations', icon: <Wrench size={18} /> },
    { path: '/admin/tradeins', label: 'Échanges', icon: <RefreshCw size={18} /> },
    { path: '/admin/products', label: 'Produits', icon: <Smartphone size={18} /> },
    { path: '/admin/inventory', label: 'Inventaire', icon: <Package size={18} /> },
    { path: '/admin/employees', label: 'Employés', icon: <Users size={18} /> },
    { path: '/admin/history', label: 'Historique', icon: <History size={18} /> },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">ELI Business Center</span>
          <span className="text-sm text-gray-500">| Administration</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />

          <button
  onClick={() => {
    logout('admin')
    navigate('/admin/login')
  }}
  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
>
  <LogOut size={16} />
  Déconnexion
</button>
        </div>
      </div>
      <div className="px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                isActive(item.path)
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

// ========== LAYOUT TECHNICIEN (une seule barre) ==========
function TechnicianLayout() {
  const { user, logout } = useTechnicianAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Espace Technicien</h1>
                <p className="text-sm text-gray-500">Bienvenue, {user?.name || 'Technicien'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              {/* Bouton Dashboard */}
              <button
                onClick={() => navigate('/technician/dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/technician/dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>

              {/* Bouton Historique */}
              <button
                onClick={() => navigate('/technician/history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/technician/history'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <History size={18} />
                <span className="hidden sm:inline">Historique</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
      <main className="p-6">
        <Routes>
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="repair/:id" element={<TechnicianRepairDetail />} />
          <Route path="tradein/:id" element={<TechnicianTradeInDetail />} />
          <Route path="history" element={<TechnicianHistory />} />
          <Route path="*" element={<Navigate to="/technician/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

// ========== LAYOUT CAISSIER (une seule barre) ==========
function CashierLayout() {
  const { user, logout } = useCashierAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <ShoppingCart size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Espace Caissier</h1>
                <p className="text-sm text-gray-500">Bienvenue, {user?.name || 'Caissier'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              
              {/* Bouton Ventes */}
              <button
                onClick={() => navigate('/cashier/sales')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/cashier/sales'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListChecks size={18} />
                <span className="hidden sm:inline">Ventes</span>
              </button>

              {/* Bouton Rapport */}
              <button
                onClick={() => navigate('/cashier/report')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/cashier/report'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={18} />
                <span className="hidden sm:inline">Rapport</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
      <main className="p-6">
        <Routes>
  <Route path="sales" element={<CashierSales />} />
  <Route path="repair/:id" element={<CashierRepairDetail />} />
  <Route path="tradein/:id" element={<CashierTradeInDetail />} />
  <Route path="report" element={<CashierReport />} />
  <Route path="*" element={<Navigate to="/cashier/sales" replace />} />
</Routes>
      </main>
    </div>
  )
}

// ========== APP PRINCIPALE ==========
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TechnicianAuthProvider>
          <CashierAuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/admin/login" element={<Login />} />
                <Route path="/technician/login" element={<TechnicianLogin />} />
                <Route
                  path="/technician/*"
                  element={
                    <TechnicianProtectedRoute>
                      <TechnicianLayout />
                    </TechnicianProtectedRoute>
                  }
                />
                <Route path="/cashier/login" element={<CashierLogin />} />
                <Route
                  path="/cashier/*"
                  element={
                    <CashierProtectedRoute>
                      <CashierLayout />
                    </CashierProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductForm />} />
                  <Route path="repairs" element={<Repairs />} />
                  <Route path="repairs/:id" element={<RepairDetail />} />
                  <Route path="tradeins" element={<TradeIns />} />
                  <Route path="tradeins/:id" element={<TradeInDetail />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="employees/:id" element={<EmployeeForm />} />
                  <Route path="employees/new" element={<EmployeeForm />} />
                  <Route path="history" element={<ActivityHistory />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
                <Route path="/" element={<Navigate to="/admin/login" replace />} />
                <Route path="*" element={<Navigate to="/admin/login" replace />} />
              </Routes>
            </NotificationProvider>
          </CashierAuthProvider>
        </TechnicianAuthProvider>
      </AuthProvider>
    </Router>
  )
}