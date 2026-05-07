import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TechnicianAuthProvider } from './context/TechnicianAuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import TechnicianProtectedRoute from './components/TechnicianProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
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
import CashierSales from './pages/cashier/Sales'
import CashierReport from './pages/cashier/Report'
import TechnicianLogin from './pages/technician/Login'
import TechnicianDashboard from './pages/technician/Dashboard'
import TechnicianRepairDetail from './pages/technician/RepairDetail'
import TechnicianHistory from './pages/technician/History'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TechnicianAuthProvider>
          <Routes>
            {/* Login */}
            <Route path="/admin/login" element={<Login />} />

            {/* Technician Routes */}
            <Route path="/technician/login" element={<TechnicianLogin />} />
            <Route
              path="/technician/*"
              element={
                <TechnicianProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Routes>
                      <Route path="dashboard" element={<TechnicianDashboard />} />
                      <Route path="repair/:id" element={<TechnicianRepairDetail />} />
                      <Route path="history" element={<TechnicianHistory />} />
                      <Route path="*" element={<Navigate to="/technician/dashboard" replace />} />
                    </Routes>
                  </div>
                </TechnicianProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-100">
                    <Sidebar />
                    <div className="flex-1 flex flex-col ml-64 transition-all">
                      <Header />
                      <main className="flex-1 overflow-auto p-6">
                        <Routes>
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
                          <Route path="cashier/sales" element={<CashierSales />} />
                          <Route path="cashier/report" element={<CashierReport />} />
                          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </TechnicianAuthProvider>
      </AuthProvider>
    </Router>
  )
}
