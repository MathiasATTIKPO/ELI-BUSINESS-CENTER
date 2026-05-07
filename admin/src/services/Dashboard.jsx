import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Package, Clock, CheckCircle } from 'lucide-react'
import api from '../../services/api'

export default function CashierDashboard() {
  const [stats, setStats] = useState({ readyRepairs: 0, pendingSales: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/admin/repairs') // Utilise l'endpoint existant
        const repairs = response.data.data || []
        const ready = repairs.filter(r => r.status === 'ready').length
        setStats({ readyRepairs: ready, pendingSales: 0 })
      } catch (error) {
        console.error('Erreur stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { 
      label: 'Réparations prêtes', 
      value: stats.readyRepairs, 
      icon: Clock, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100',
      link: '/cashier/repairs?status=ready'
    },
    { 
      label: 'Encaissements du jour', 
      value: '0', 
      icon: DollarSign, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    }
  ]

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-primary tracking-tight">ESPACE CAISSE</h1>
        <p className="text-gray-500 font-medium">Gestion des encaissements et livraisons clients.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => stat.link && navigate(stat.link)}
            className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 mb-6 uppercase tracking-wider">Actions prioritaires</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/cashier/repairs')}
            className="flex items-center justify-center gap-3 p-5 border-2 border-primary text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-all shadow-sm"
          >
            <Package size={24} />
            ENCAISSER UNE RÉPARATION
          </button>
        </div>
      </div>
    </div>
  )
}