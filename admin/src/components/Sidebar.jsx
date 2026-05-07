import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const navigate = useNavigate()
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
    { label: 'Ventes (Caisse)', icon: '💳', path: '/admin/cashier/sales' },
    { label: 'Rapport Caisse', icon: '📄', path: '/admin/cashier/report' },
  ]

  return (
    <div className={`${open ? 'w-64' : 'w-20'} bg-primary text-white h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col`}>
      {/* Header */}
      <div className="p-6 border-b border-primary/60 flex justify-between items-center">
        {open && <h1 className="text-xl font-bold">Admin</h1>}
        <button
          onClick={() => setOpen(!open)}
          className="p-1 hover:bg-primary/60 rounded"
        >
          {open ? '◄' : '►'}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/60 transition flex items-center gap-3"
          >
            <span className="text-xl">{item.icon}</span>
            {open && <span>{item.label}</span>}
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
