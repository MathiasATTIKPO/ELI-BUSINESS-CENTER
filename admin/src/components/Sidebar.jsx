import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ isMobileOpen, setMobileOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [open, setOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const menuItems = [
    { label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { label: 'Produits', icon: '📦', path: '/admin/products' },
    { label: 'Réparations', icon: '🔧', path: '/admin/repairs' },
    { label: 'Échanges', icon: '🔄', path: '/admin/tradeins' },
    { label: 'Inventaire', icon: '📋', path: '/admin/inventory' },
    { label: 'Employés', icon: '👥', path: '/admin/employees' },
    { label: 'Historique', icon: '🕒', path: '/admin/history' },
    { label: 'Ventes (Caisse)', icon: '💳', path: '/admin/cashier/sales' },
    { label: 'Rapport Caisse', icon: '📄', path: '/admin/cashier/report' },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  return (
    <div className={`fixed top-0 left-0 h-screen z-40 transform transition-all duration-300 flex flex-col bg-primary text-white ${open ? 'w-64' : 'w-20'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:h-auto shadow-2xl`}> 
      {/* Header */}
      <div className="p-6 border-b border-primary/60 flex justify-between items-center">
        {isMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-primary/60"
          >
            ✕
          </button>
        )}
        {open && <h1 className="text-xl font-bold">Admin</h1>}
        <button
          onClick={() => setOpen(!open)}
          className="p-1 hover:bg-primary/60 rounded"
        >
          {open ? '◄' : '►'}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)
              setMobileOpen(false)
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl transition flex items-center gap-4 ${isActive(item.path) ? 'bg-white/15 text-white shadow-inner' : 'text-slate-100 hover:bg-white/10'}`}
          >
            <span className="text-xl">{item.icon}</span>
            {open && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary/60">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-danger transition flex items-center gap-3"
        >
          <span className="text-xl">🚪</span>
          {open && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  )
}
