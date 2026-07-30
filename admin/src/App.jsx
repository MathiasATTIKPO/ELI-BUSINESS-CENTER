import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Smartphone, Package, Users,
  ShoppingCart, History, FileText, Wrench, RefreshCw,
  BarChart3, ListChecks, Settings as SettingsIcon
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
import PortalHeader from './components/layout/PortalHeader'
import ResellerProtectedRoute from './components/ResellerProtectedRoute'
import VIPProtectedRoute from './components/VIPProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorPage from './pages/ErrorPage'
import { resolvePortalNavigation } from './utils/portalNavigation'

const Login = React.lazy(() => import('./pages/Login'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Products = React.lazy(() => import('./pages/Products'))
const ProductForm = React.lazy(() => import('./pages/ProductForm'))
const Repairs = React.lazy(() => import('./pages/Repairs'))
const RepairDetail = React.lazy(() => import('./pages/RepairDetail'))
const TradeIns = React.lazy(() => import('./pages/TradeIns'))
const TradeInDetail = React.lazy(() => import('./pages/TradeInDetail'))
const Inventory = React.lazy(() => import('./pages/Inventory'))
const Employees = React.lazy(() => import('./pages/Employees'))
const EmployeeForm = React.lazy(() => import('./pages/EmployeeForm'))
const ActivityHistory = React.lazy(() => import('./pages/ActivityHistory'))
const Resellers = React.lazy(() => import('./pages/Resellers/Resellers'))
const ResellerForm = React.lazy(() => import('./pages/Resellers/ResellerForm'))
const ResellerDetail = React.lazy(() => import('./pages/Resellers/ResellerDetail'))
const VIPs = React.lazy(() => import('./pages/vip/VIPs'))
const VIPForm = React.lazy(() => import('./pages/vip/VIPForm'))
const VIPDetail = React.lazy(() => import('./pages/vip/VIPDetail'))
const AccountManagement = React.lazy(() => import('./pages/Accounts/AccountManagement'))
const ResellerContracts = React.lazy(() => import('./pages/Contracts/ResellerContracts'))
const VipStats = React.lazy(() => import('./pages/vip/Stats'))
const CashierSales = React.lazy(() => import('./pages/cashier/Sales'))
const CashierReport = React.lazy(() => import('./pages/cashier/Report'))
const CashierLogin = React.lazy(() => import('./pages/cashier/Login'))
const CashierRepairDetail = React.lazy(() => import('./pages/cashier/RepairDetail'))
const CashierTradeInDetail = React.lazy(() => import('./pages/cashier/TradeInDetail'))
const TechnicianLogin = React.lazy(() => import('./pages/technician/Login'))
const TechnicianDashboard = React.lazy(() => import('./pages/technician/Dashboard'))
const TechnicianRepairDetail = React.lazy(() => import('./pages/technician/RepairDetail'))
const TechnicianHistory = React.lazy(() => import('./pages/technician/History'))
const TechnicianTradeInDetail = React.lazy(() => import('./pages/technician/TradeInDetail'))
const ResellerLogin = React.lazy(() => import('./pages/reseller/Login'))
const ResellerForgot = React.lazy(() => import('./pages/reseller/ForgotPassword'))
const ResellerReset = React.lazy(() => import('./pages/reseller/ResetPassword'))
const ResellerDashboard = React.lazy(() => import('./pages/reseller/Dashboard'))
const VIPLogin = React.lazy(() => import('./pages/vip/Login'))
const VIPForgot = React.lazy(() => import('./pages/vip/ForgotPassword'))
const VIPReset = React.lazy(() => import('./pages/vip/ResetPassword'))
const VIPDashboard = React.lazy(() => import('./pages/vip/Dashboard'))
const ChangePassword = React.lazy(() => import('./pages/auth/ChangePassword'))
const Settings = React.lazy(() => import('./pages/Settings/Setting'))
function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center p-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" aria-hidden="true" />
        <p className="text-sm font-medium">Chargement de votre espace…</p>
      </div>
    </div>
  )
}

function PortalEntryRedirect() {
  const { destination } = resolvePortalNavigation()
  return <Navigate to={destination} replace />
}

function AdminLayout() {
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

  const isAdminItemActive = (path, pathname) => {
    if (path === '/admin/accounts') {
      return (
        pathname.startsWith('/admin/accounts') ||
        pathname.startsWith('/admin/employees') ||
        pathname.startsWith('/admin/vips') ||
        pathname.startsWith('/admin/resellers')
      )
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        role="admin"
        icon={LayoutDashboard}
        title="ELI Business Center"
        subtitle="Administration"
        navItems={navItems}
        isItemActive={isAdminItemActive}
        onLogout={() => {
          logout('admin')
          navigate('/admin/login')
        }}
      />
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}

// ========== LAYOUT TECHNICIEN ==========
function TechnicianLayout() {
  const { user, logout } = useTechnicianAuth()
  const navigate = useNavigate()
  const navItems = [
    { path: '/technician/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
    { path: '/technician/history', label: 'Historique', icon: <History size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        role="technician"
        icon={Wrench}
        title="Espace Technicien"
        subtitle={`Bienvenue, ${user?.name || 'Technicien'}`}
        navItems={navItems}
        onLogout={() => {
          logout()
          navigate('/technician/login')
        }}
      />
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}

// ========== LAYOUT CAISSIER ==========
function CashierLayout() {
  const { user, logout } = useCashierAuth()
  const navigate = useNavigate()
  const navItems = [
    { path: '/cashier/sales', label: 'Ventes', icon: <ListChecks size={18} /> },
    { path: '/cashier/report', label: 'Rapport', icon: <BarChart3 size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        role="cashier"
        icon={ShoppingCart}
        title="Espace Caissier"
        subtitle={`Bienvenue, ${user?.name || 'Caissier'}`}
        navItems={navItems}
        onLogout={() => {
          logout()
          navigate('/cashier/login')
        }}
      />
      <main className="min-w-0">
        <Outlet />
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
                    <React.Suspense fallback={<RouteLoadingFallback />}>
                      <Routes>
                      {/* Public routes */}
                      <Route path="/admin/login" element={<Login />} />
                      <Route path="/technician/login" element={<TechnicianLogin />} />
                      <Route path="/reseller/login" element={<ResellerLogin />} />
                      <Route path="/reseller/forgot" element={<ResellerForgot />} />
                      <Route path="/reseller/reset" element={<ResellerReset />} />
                      <Route path="/vip/login" element={<VIPLogin />} />
                      <Route path="/vip/forgot" element={<VIPForgot />} />
                      <Route path="/vip/reset" element={<VIPReset />} />
                      <Route path="/cashier/login" element={<CashierLogin />} />

                      {/* Authenticated password-change routes */}
                      <Route
                        path="/admin/change-password"
                        element={<ProtectedRoute><ChangePassword role="admin" /></ProtectedRoute>}
                      />
                      <Route
                        path="/technician/change-password"
                        element={<TechnicianProtectedRoute><ChangePassword role="technician" /></TechnicianProtectedRoute>}
                      />
                      <Route
                        path="/cashier/change-password"
                        element={<CashierProtectedRoute><ChangePassword role="cashier" /></CashierProtectedRoute>}
                      />
                      <Route
                        path="/reseller/change-password"
                        element={<ResellerProtectedRoute><ChangePassword role="reseller" /></ResellerProtectedRoute>}
                      />
                      <Route
                        path="/vip/change-password"
                        element={<VIPProtectedRoute><ChangePassword role="vip" /></VIPProtectedRoute>}
                      />

                      {/* Protected routes */}
                      <Route
                        path="/technician"
                        element={
                          <TechnicianProtectedRoute>
                            <TechnicianLayout />
                          </TechnicianProtectedRoute>
                        }
                      >
                        <Route index element={<Navigate to="/technician/dashboard" replace />} />
                        <Route path="dashboard" element={<TechnicianDashboard />} />
                        <Route path="repair/:id" element={<TechnicianRepairDetail />} />
                        <Route path="tradein/:id" element={<TechnicianTradeInDetail />} />
                        <Route path="history" element={<TechnicianHistory />} />
                        <Route path="*" element={<ErrorPage type="404" portalRole="technician" />} />
                      </Route>
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
                        path="/cashier"
                        element={
                          <CashierProtectedRoute>
                            <CashierLayout />
                          </CashierProtectedRoute>
                        }
                      >
                        <Route index element={<Navigate to="/cashier/sales" replace />} />
                        <Route path="sales" element={<CashierSales />} />
                        <Route path="repair/:id" element={<CashierRepairDetail />} />
                        <Route path="tradein/:id" element={<CashierTradeInDetail />} />
                        <Route path="report" element={<CashierReport />} />
                        <Route path="*" element={<ErrorPage type="404" portalRole="cashier" />} />
                      </Route>

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
                        <Route path="*" element={<ErrorPage type="404" portalRole="admin" />} />
                      </Route>

                      {/* Root redirect */}
                      <Route path="/" element={<PortalEntryRedirect />} />

                      {/* Error routes */}
                      <Route path="/404" element={<ErrorPage type="404" />} />
                      <Route path="/500" element={<ErrorPage type="500" />} />
                      <Route path="/offline" element={<ErrorPage type="offline" />} />
                      <Route path="*" element={<ErrorPage type="404" />} />
                      </Routes>
                    </React.Suspense>
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
