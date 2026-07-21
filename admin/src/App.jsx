import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LogOut, LayoutDashboard, Smartphone, Package, Users,
  ShoppingCart, History, FileText, Wrench, RefreshCw,
  Bell, CheckCheck, BarChart3, ListChecks, Settings as SettingsIcon
} from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { TechnicianAuthProvider } from './context/TechnicianAuthContext'
import { CashierAuthProvider } from './context/CashierAuthContext'
import { ResellerAuthProvider } from './context/ResellerAuthContext'
import { VIPAuthProvider } from './context/VIPAuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { useAuth } from './hooks/useAuth'
import { useTechnicianAuth } from './hooks/useTechnicianAuth'
import { useCashierAuth } from './hooks/useCashierAuth'
import { useResellerAuth } from './hooks/useResellerAuth'
import { useVIPAuth } from './hooks/useVIPAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import TechnicianProtectedRoute from './components/TechnicianProtectedRoute'
import CashierProtectedRoute from './components/CashierProtectedRoute'
import NotificationBell from './components/NotificationBell'
import UpdateBadge from './components/UpdateBadge'
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
import Resellers from './pages/Resellers/Resellers'
import ResellerForm from './pages/Resellers/ResellerForm'
import ResellerDetail from './pages/Resellers/ResellerDetail'
import VIPs from './pages/vip/VIPs'
import VIPForm from './pages/vip/VIPForm'
import VIPDetail from './pages/vip/VIPDetail'
import AccountManagement from './pages/Accounts/AccountManagement'
import ResellerContracts from './pages/Contracts/ResellerContracts'
import VipStats from './pages/vip/Stats'
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
import ResellerLogin from './pages/reseller/Login'
import ResellerForgot from './pages/reseller/ForgotPassword'
import ResellerReset from './pages/reseller/ResetPassword'
import ResellerChangePassword from './pages/reseller/ChangePassword'
import ResellerDashboard from './pages/reseller/Dashboard'
import VIPLogin from './pages/vip/Login'
import VIPForgot from './pages/vip/ForgotPassword'
import VIPReset from './pages/vip/ResetPassword'
import VIPChangePassword from './pages/vip/ChangePassword'
import VIPDashboard from './pages/vip/Dashboard'
import ResellerProtectedRoute from './components/ResellerProtectedRoute'
import VIPProtectedRoute from './components/VIPProtectedRoute'
import Settings from './pages/Settings/Setting'
import ErrorPage from './pages/ErrorPage'
import ErrorBoundary from './components/ErrorBoundary'

// ========== COMPOSANT ADMIN ==========
function AdminNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const navItems = [
    { path: '/admin/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/repairs', label: 'Réparations', icon: <Wrench size={18} /> },
    { path: '/admin/tradeins', label: 'Échanges', icon: <RefreshCw size={18} /> },
    { path: '/admin/products', label: 'Produits', icon: <Smartphone size={18} /> },
    { path: '/admin/inventory', label: 'Inventaire', icon: <Package size={18} /> },
    { path: '/admin/contracts', label: 'Contrats', icon: <FileText size={18} /> },
    { path: '/admin/accounts', label: 'Comptes', icon: <Users size={18} /> },
    { path: '/admin/history', label: 'Historique', icon: <History size={18} /> },
    { path: '/admin/settings', label: 'Paramètres', icon: <SettingsIcon size={18} /> },
  ]

  const isActive = (path) => {
    if (path === '/admin/accounts') {
      return (
        location.pathname.startsWith('/admin/accounts') ||
        location.pathname.startsWith('/admin/employees') ||
        location.pathname.startsWith('/admin/vips') ||
        location.pathname.startsWith('/admin/resellers')
      )
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">ELI Business Center</span>
          <span className="text-sm text-gray-500">| Administration</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <NotificationBell />
          <UpdateBadge />
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition ${isActive(item.path)
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
      <main className="p-3 sm:p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}

// ========== LAYOUT TECHNICIEN ==========
function TechnicianLayout() {
  const { user, logout } = useTechnicianAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Espace Technicien</h1>
                <p className="text-sm text-gray-500">Bienvenue, {user?.name || 'Technicien'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UpdateBadge />
              <button
                onClick={() => navigate('/technician/dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/technician/dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Tableau de bord</span>
              </button>
              <button
                onClick={() => navigate('/technician/history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/technician/history'
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
      <main className="p-3 sm:p-4 lg:p-6">
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

// ========== LAYOUT CAISSIER ==========
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
              <UpdateBadge />
              <button
                onClick={() => navigate('/cashier/sales')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/cashier/sales'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <ListChecks size={18} />
                <span className="hidden sm:inline">Ventes</span>
              </button>
              <button
                onClick={() => navigate('/cashier/report')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${location.pathname === '/cashier/report'
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
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <AuthProvider>
          <TechnicianAuthProvider>
            <CashierAuthProvider>
              <ResellerAuthProvider>
                <VIPAuthProvider>
                  <NotificationProvider>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/admin/login" element={<Login />} />
                      <Route path="/technician/login" element={<TechnicianLogin />} />
                      <Route path="/reseller/login" element={<ResellerLogin />} />
                      <Route path="/reseller/forgot" element={<ResellerForgot />} />
                      <Route path="/reseller/reset" element={<ResellerReset />} />
                      <Route path="/reseller/change-password" element={<ResellerChangePassword />} />
                      <Route path="/vip/login" element={<VIPLogin />} />
                      <Route path="/vip/forgot" element={<VIPForgot />} />
                      <Route path="/vip/reset" element={<VIPReset />} />
                      <Route path="/vip/change-password" element={<VIPChangePassword />} />
                      <Route path="/cashier/login" element={<CashierLogin />} />

                      {/* Protected routes */}
                      <Route
                        path="/technician/*"
                        element={
                          <TechnicianProtectedRoute>
                            <TechnicianLayout />
                          </TechnicianProtectedRoute>
                        }
                      />
                      <Route
                        path="/reseller/*"
                        element={
                          <ResellerProtectedRoute>
                            <ResellerDashboard />
                          </ResellerProtectedRoute>
                        }
                      />
                      <Route
                        path="/vip/*"
                        element={
                          <VIPProtectedRoute>
                            <VIPDashboard />
                          </VIPProtectedRoute>
                        }
                      />
                      <Route
                        path="/cashier/*"
                        element={
                          <CashierProtectedRoute>
                            <CashierLayout />
                          </CashierProtectedRoute>
                        }
                      />

                      {/* Admin routes (with nested layout) */}
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
                        <Route path="contracts" element={<ResellerContracts />} />
                        <Route path="accounts" element={<AccountManagement />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="resellers" element={<Resellers />} />
                        <Route path="resellers/new" element={<ResellerForm />} />
                        <Route path="resellers/:id/edit" element={<ResellerForm />} />
                        <Route path="resellers/:id" element={<ResellerDetail />} />
                        <Route path="vips" element={<VIPs />} />
                        <Route path="vips/new" element={<VIPForm />} />
                        <Route path="vips/:id/edit" element={<VIPForm />} />
                        <Route path="vips/:id" element={<VIPDetail />} />
                        <Route path="vips/stats" element={<VipStats />} />
                        <Route path="employees" element={<Employees />} />
                        <Route path="employees/:id" element={<EmployeeForm />} />
                        <Route path="employees/new" element={<EmployeeForm />} />
                        <Route path="history" element={<ActivityHistory />} />
                        {/* Fallback inside admin */}
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Route>

                      {/* Root redirect */}
                      <Route path="/" element={<Navigate to="/admin/login" replace />} />

                      {/* Error routes */}
                      <Route path="/404" element={<ErrorPage type="404" />} />
                      <Route path="/500" element={<ErrorPage type="500" />} />
                      <Route path="/offline" element={<ErrorPage type="offline" />} />
                      <Route path="*" element={<ErrorPage type="404" />} />
                    </Routes>
                  </NotificationProvider>
                </VIPAuthProvider>
              </ResellerAuthProvider>
            </CashierAuthProvider>
          </TechnicianAuthProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  )
}