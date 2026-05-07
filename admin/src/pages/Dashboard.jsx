import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Wrench, DollarSign, AlertCircle, RefreshCw } from 'lucide-react'
import api from '../services/api'
import Toast from '../components/Toast'

export default function Dashboard() {
  const [data, setData] = useState({
    totalRepairs: 0,
    completedRepairs: 0,
    inProgressRepairs: 0,
    pendingRepairs: 0,
    repairRevenue: 0,
    tradeinRevenue: 0,
    totalRevenue: 0,
    averageRepairPrice: 0,
    technicians: 0,
    employees: 0,
    totalTradeins: 0,
    pendingTradeins: 0,
    repairsByStatus: [],
    repairsByTechnician: [],
    tradeinsByStatus: [],
    monthlyRevenue: []
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [repairsRes, employeesRes, tradeinsRes] = await Promise.all([
        api.get('/api/admin/repairs'),
        api.get('/api/admin/employees'),
        api.get('/api/admin/tradeins'),
      ])

      const repairs = repairsRes.data.data || []
      const employees = employeesRes.data.data || []
      const tradeins = tradeinsRes.data.data || []

      const totalTradeins = tradeins.length
      const pendingTradeins = tradeins.filter(t => t.status === 'pending').length

      // Statistiques générales
      const totalRepairs = repairs.length
      const completedRepairs = repairs.filter(r => r.status === 'completed' || r.status === 'paid').length
      const inProgressRepairs = repairs.filter(r => r.status === 'repairing' || r.status === 'assigned').length
      const pendingRepairs = repairs.filter(r => r.status === 'pending').length
      const repairRevenue = repairs.reduce((sum, r) => sum + (r.saleInfo?.amountPaid || r.saleInfo?.amount || r.price || 0), 0)
      const tradeinRevenue = tradeins.reduce((sum, t) => sum + (t.saleInfo?.amount || 0), 0)
      const totalRevenue = repairRevenue + tradeinRevenue
      const averageRepairPrice = totalRepairs > 0 ? repairRevenue / totalRepairs : 0

      const technicians = employees.filter(e => e.role === 'technician').length
      const allEmployees = employees.length

      // Réparations par statut
      const statusCounts = {
        pending: repairs.filter(r => r.status === 'pending').length,
        assigned: repairs.filter(r => r.status === 'assigned').length,
        repairing: repairs.filter(r => r.status === 'repairing').length,
        completed: repairs.filter(r => r.status === 'completed' || r.status === 'paid').length,
      }

      const repairsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name === 'pending' ? 'En attente' :
              name === 'assigned' ? 'Attribuée' :
              name === 'repairing' ? 'En réparation' :
              'Complétée',
        value,
        color: name === 'pending' ? '#f39c12' :
               name === 'assigned' ? '#1e2a5e' :
               name === 'repairing' ? '#3B82F6' :
               '#22c55e'
      }))

      // Réparations par technicien
      const technicianStats = {}
      repairs.forEach(repair => {
        if (repair.assignedTo) {
          const techName = repair.assignedTo.name || 'Unknown'
          if (!technicianStats[techName]) {
            technicianStats[techName] = { repairs: 0, revenue: 0 }
          }
          technicianStats[techName].repairs += 1
          technicianStats[techName].revenue += repair.price || 0
        }
      })

      const repairsByTechnician = Object.entries(technicianStats).map(([name, stats]) => ({
        name,
        repairs: stats.repairs,
        revenue: stats.revenue
      }))

      // Revenus mensuels
      const monthlyData = {}
      repairs.forEach(repair => {
        if (repair.completedAt) {
          const date = new Date(repair.completedAt)
          const month = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
          if (!monthlyData[month]) monthlyData[month] = 0
          monthlyData[month] += repair.price || 0
        }
      })

      const monthlyRevenue = Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue
      }))

      // Échanges par statut
      const tradeinStatusCounts = {
        pending: tradeins.filter(t => t.status === 'pending').length,
        accepted: tradeins.filter(t => t.status === 'accepted').length,
        completed: tradeins.filter(t => t.status === 'completed').length,
        refused: tradeins.filter(t => t.status === 'refused').length,
      }

      const tradeinsByStatus = Object.entries(tradeinStatusCounts).map(([name, value]) => ({
        name: name === 'pending' ? 'En attente' :
              name === 'accepted' ? 'Acceptée' :
              name === 'completed' ? 'Complétée' :
              'Refusée',
        value,
        color: name === 'pending' ? '#f39c12' :
               name === 'accepted' ? '#3B82F6' :
               name === 'completed' ? '#22c55e' :
               '#ef4444'
      }))

      setData({
        totalRepairs,
        completedRepairs,
        inProgressRepairs,
        pendingRepairs,
        repairRevenue,
        tradeinRevenue,
        totalRevenue,
        averageRepairPrice,
        technicians,
        employees: allEmployees,
        totalTradeins,
        pendingTradeins,
        repairsByStatus,
        tradeinsByStatus,
        repairsByTechnician: repairsByTechnician.slice(0, 5),
        monthlyRevenue
      })
    } catch (error) {
      setToast({ type: 'error', message: 'Erreur lors du chargement' })
    } finally {
      setLoading(false)
    }
  }

  const KPICard = ({ icon: Icon, title, value, subtitle, bgColor }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full`} style={{ backgroundColor: bgColor }}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div>
        <h1 className="text-3xl font-bold text-[#1e2a5e]">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de vos activités</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Wrench}
          title="Réparations totales"
          value={data.totalRepairs}
          subtitle={`${data.completedRepairs} complétées`}
          bgColor="#1e2a5e" // Bleu Nuit
        />
        <KPICard
          icon={AlertCircle}
          title="En réparation"
          value={data.inProgressRepairs}
          subtitle="À suivre"
          bgColor="#f39c12" // Or
        />
        <KPICard
          icon={DollarSign}
          title="Chiffre d'Affaires"
          value={`${(data.totalRevenue / 1000).toFixed(0)}K FCFA`}
          subtitle={`Rép: ${data.repairRevenue.toLocaleString()} | Éch: ${data.tradeinRevenue.toLocaleString()}`}
          bgColor="#22c55e"
        />
        <KPICard
          icon={RefreshCw}
          title="Échanges"
          value={data.totalTradeins}
          subtitle={`${data.pendingTradeins} en attente`}
          bgColor="#3B82F6"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réparations par statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Réparations par Statut</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.repairsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.repairsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top techniciens */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Techniciens</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.repairsByTechnician}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="repairs" fill="#3B82F6" name="Réparations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Échanges par statut et Revenus mensuels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Échanges par statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Échanges par Statut</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.tradeinsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.tradeinsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenus mensuels */}
        {data.monthlyRevenue.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenus Mensuels</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} FCFA`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  name="Revenu"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Réparations récentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Réparations en Cours</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <div>
              <p className="font-medium text-gray-900">Réparations assignées</p>
              <p className="text-sm text-gray-600">En attente de travail</p>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {data.repairsByStatus.find(s => s.name === 'Attribuée')?.value || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div>
              <p className="font-medium text-gray-900">Réparations en cours</p>
              <p className="text-sm text-gray-600">Actuellement en travail</p>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {data.repairsByStatus.find(s => s.name === 'En réparation')?.value || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div>
              <p className="font-medium text-gray-900">Réparations complétées</p>
              <p className="text-sm text-gray-600">Prêtes à être livrées</p>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {data.repairsByStatus.find(s => s.name === 'Complétée')?.value || 0}
            </span>
          </div>
        </div>
      </div>
      {/* Echanges récentes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Echanges en Cours</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <div>
              <p className="font-medium text-gray-900">Echanges en attente</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {data.tradeinsByStatus.find(s => s.name === 'En attente')?.value || 0}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div>
              <p className="font-medium text-gray-900">Echanges complétés</p>
              <p className="text-sm text-gray-600">Prêtes à être livrées</p>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {data.tradeinsByStatus.find(s => s.name === 'Complétée')?.value || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
