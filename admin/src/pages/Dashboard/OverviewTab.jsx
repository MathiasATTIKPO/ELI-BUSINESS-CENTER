import React from 'react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'
import { Wrench, RefreshCw, Smartphone, DollarSign, Users, ShoppingCart, TrendingUp, BarChart3, Calendar, PieChartIcon, Download, Clock, Target } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import ChartCard from '../../components/ui/ChartCard'
import { exportCsv } from '../../utils/exportCsv'

function CustomTooltip({ active, payload, label }) {
  if (!(active && payload && payload.length)) return null
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function OverviewTab({ stats, salesEvolution, repairsEvolution, tradeinsEvolution, weeklyActivity, setToast }) {
  const exportVipResellerStatsCsv = () => {
    const rows = [
      { Bloc: 'KPI VIP', Indicateur: 'Clients VIP total', Valeur: stats.totalVIPClients },
      { Bloc: 'KPI VIP', Indicateur: 'Clients VIP actifs', Valeur: stats.activeVIPClients },
      { Bloc: 'KPI VIP', Indicateur: 'Reparations VIP', Valeur: stats.vipRepairsCount },
      { Bloc: 'KPI VIP', Indicateur: 'Factures VIP', Valeur: stats.vipInvoicesCount },
      { Bloc: 'KPI VIP', Indicateur: 'CA VIP (FCFA)', Valeur: stats.vipRevenue },
      { Bloc: 'KPI Revendeur', Indicateur: 'Revendeurs actifs', Valeur: stats.activeResellers },
      { Bloc: 'KPI Revendeur', Indicateur: 'Contrats vendus', Valeur: stats.soldContractsCount },
      { Bloc: 'KPI Revendeur', Indicateur: 'Contrats actifs', Valeur: stats.activeContractsCount },
      { Bloc: 'KPI Revendeur', Indicateur: 'CA Revendeur (FCFA)', Valeur: stats.resellerSalesAmount },
    ]
    exportCsv(rows, 'stats_vip_revendeurs_dashboard')
    setToast({ type: 'success', message: 'Export CSV des statistiques VIP/revendeurs genere.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={exportVipResellerStatsCsv} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm">
          <Download size={16} />
          Export CSV VIP/Revendeurs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Wrench} title="Réparations" value={stats.totalRepairs} subtitle={`${stats.completedRepairsCount} terminées`} gradient="from-blue-500 to-cyan-500" />
        <StatCard icon={RefreshCw} title="Échanges" value={stats.totalTradeins} subtitle={`${stats.totalTradeins - stats.pendingTradeins} traités`} gradient="from-purple-500 to-violet-500" />
        <StatCard icon={Smartphone} title="Ventes téléphones" value={stats.totalPhoneSales} subtitle={`${stats.phoneSalesRevenue.toLocaleString('fr-FR')} FCFA`} gradient="from-cyan-500 to-blue-500" />
        <StatCard icon={DollarSign} title="CA total" value={`${(stats.totalRevenue / 1000000).toFixed(1)}M FCFA`} subtitle={`Réparations: ${(stats.repairRevenue/1000).toFixed(0)}k | Échanges: ${(stats.tradeinRevenue/1000).toFixed(0)}k`} gradient="from-emerald-500 to-green-500" />
        <StatCard icon={Users} title="Clients VIP" value={stats.totalVIPClients} subtitle={`${stats.vipRepairsCount} réparations | ${stats.vipRevenue.toLocaleString('fr-FR')} FCFA`} gradient="from-amber-500 to-orange-500" />
        <StatCard icon={ShoppingCart} title="Revendeurs" value={stats.activeResellers} subtitle={`${stats.soldContractsCount} ventes | ${stats.resellerSalesAmount.toLocaleString('fr-FR')} FCFA`} gradient="from-teal-500 to-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Délai moyen réparation"
          value={`${(stats.avgRepairTimeHours || 0).toFixed(1)}h`}
          subtitle={`${stats.repairTimeTrendPct > 0 ? '▲' : '▼'} ${Math.abs(stats.repairTimeTrendPct || 0).toFixed(1)}% vs mois précédent`}
          gradient="from-orange-500 to-red-500"
        />
        <StatCard
          icon={DollarSign}
          title="Panier moyen global"
          value={`${Math.round(stats.avgBasketGlobal || 0).toLocaleString('fr-FR')} FCFA`}
          subtitle={`Tél: ${Math.round(stats.avgBasketPhone || 0).toLocaleString('fr-FR')} | Rép: ${Math.round(stats.avgBasketRepair || 0).toLocaleString('fr-FR')}`}
          gradient="from-indigo-500 to-blue-500"
        />
        <StatCard
          icon={Users}
          title="Conversion VIP"
          value={`${(stats.vipConversionRate || 0).toFixed(1)}%`}
          subtitle={`Panier VIP ${Math.round(stats.vipAvgBasket || 0).toLocaleString('fr-FR')} vs Non-VIP ${Math.round(stats.nonVipAvgBasket || 0).toLocaleString('fr-FR')}`}
          gradient="from-fuchsia-500 to-pink-500"
        />
        <StatCard
          icon={Target}
          title="Taux acceptation échanges"
          value={`${(stats.exchangeAcceptanceRate || 0).toFixed(1)}%`}
          subtitle={`Valeur moyenne: ${Math.round(stats.avgTradeinValue || 0).toLocaleString('fr-FR')} FCFA`}
          gradient="from-teal-500 to-cyan-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Évolution des ventes (FCFA)" icon={TrendingUp}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="réparations" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="échanges" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="téléphones" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Évolution du nombre de réparations" icon={BarChart3} iconClassName="text-emerald-600">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairsEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Top 5 marques vendues" icon={Smartphone} iconClassName="text-blue-600">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topBrands || []} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="brand" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Répartition des pannes" icon={PieChartIcon}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.repairIssues || []} dataKey="value" nameKey="issue" cx="50%" cy="50%" innerRadius={50} outerRadius={95}>
                  {(stats.repairIssues || []).map((entry, index) => (
                    <Cell key={index} fill={['#2563eb', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Utilisation techniciens" icon={Wrench} iconClassName="text-emerald-600">
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="45%"
                outerRadius="85%"
                data={[{ name: 'Taux', value: Number((stats.technicianUtilizationRate || 0).toFixed(1)) }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={12} fill="#22c55e" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center -mt-10 text-2xl font-bold text-emerald-700">{(stats.technicianUtilizationRate || 0).toFixed(1)}%</p>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top 5 modèles vendus" icon={BarChart3} iconClassName="text-indigo-600">
          <div className="space-y-3">
            {(stats.topModelsSold || []).map((model, idx) => (
              <div key={`${model.model}-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div>
                  <p className="font-semibold text-gray-900">{model.model}</p>
                  <p className="text-sm text-gray-600">Qté: {model.quantity}</p>
                </div>
                <span className="font-bold text-indigo-700">{Math.round(model.revenue || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Tendances financières" icon={TrendingUp} iconClassName="text-emerald-600">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-gray-700 font-medium">Évolution CA vs mois précédent</span>
              <span className={`font-bold ${(stats.revenueGrowthVsPrevMonth || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {(stats.revenueGrowthVsPrevMonth || 0).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <span className="text-gray-700 font-medium">Comparaison annuelle (même mois N-1)</span>
              <span className={`font-bold ${(stats.annualComparisonPct || 0) >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                {(stats.annualComparisonPct || 0).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
              <span className="text-gray-700 font-medium">Prévision ventes mois prochain</span>
              <span className="font-bold text-purple-700">{Math.round(stats.salesForecastNextMonth || 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <span className="text-gray-700 font-medium">Récurrence client</span>
              <span className="font-bold text-amber-700">{(stats.clientRecurrenceRate || 0).toFixed(1)}%</span>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Évolution du nombre d'échanges" icon={RefreshCw} iconClassName="text-purple-600">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeinsEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Activité hebdomadaire" icon={Calendar} iconClassName="text-orange-600">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="réparations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="échanges" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ventes" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Réparations par statut" icon={PieChartIcon}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.repairsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {stats.repairsByStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenus mensuels" icon={TrendingUp} iconClassName="text-emerald-600">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
