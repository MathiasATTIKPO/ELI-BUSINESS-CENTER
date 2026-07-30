const asNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const firstDefined = (source, keys, fallback = 0) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key]
    }
  }
  return fallback
}

const makeRow = ({
  type = 'KPI',
  section,
  subsection = '',
  period = '',
  id = '',
  label = '',
  indicator,
  client = '',
  contact = '',
  category = '',
  status = '',
  quantity = '',
  value = '',
  unit = '',
  detail = '',
}) => ({
  Type: type,
  Section: section,
  'Sous-section': subsection,
  'Période': period,
  Identifiant: id,
  Libellé: label,
  Indicateur: indicator,
  Client: client,
  Contact: contact,
  'Catégorie': category,
  Statut: status,
  'Quantité': quantity,
  Valeur: value,
  'Unité': unit,
  'Détail': detail,
})

const appendKpis = (rows, stats, kpis) => {
  const processedTradeins = Math.max(0, asNumber(stats.totalTradeins) - asNumber(stats.pendingTradeins))
  const definitions = [
    ['Activité', 'Réparations reçues', stats.totalRepairs, 'dossier'],
    ['Activité', 'Réparations terminées', stats.completedRepairsCount, 'dossier'],
    ['Activité', 'Réparations en cours', stats.inProgressRepairs, 'dossier'],
    ['Activité', 'Réparations en attente', kpis.pendingRepairsCount, 'dossier'],
    ['Activité', 'Échanges reçus', stats.totalTradeins, 'dossier'],
    ['Activité', 'Échanges traités', processedTradeins, 'dossier'],
    ['Activité', 'Échanges en attente', kpis.pendingTradeinsCount ?? stats.pendingTradeins, 'dossier'],
    ['Activité', 'Ventes de téléphones', stats.totalPhoneSales, 'vente'],
    ['Revenus', 'Chiffre d’affaires total', stats.totalRevenue, 'FCFA'],
    ['Revenus', 'Chiffre d’affaires réparations', stats.repairRevenue, 'FCFA'],
    ['Revenus', 'Chiffre d’affaires échanges', stats.tradeinRevenue, 'FCFA'],
    ['Revenus', 'Chiffre d’affaires téléphones', stats.phoneSalesRevenue, 'FCFA'],
    ['Revenus', 'Chiffre d’affaires VIP', stats.vipRevenue, 'FCFA'],
    ['Revenus', 'Chiffre d’affaires revendeurs', stats.resellerSalesAmount, 'FCFA'],
    ['Équipe', 'Employés', stats.employees, 'personne'],
    ['Équipe', 'Techniciens', stats.technicians, 'personne'],
    ['Équipe', 'Caissiers', stats.cashiers, 'personne'],
    ['Clients VIP', 'Clients VIP', stats.totalVIPClients, 'client'],
    ['Clients VIP', 'Clients VIP actifs', stats.activeVIPClients, 'client'],
    ['Clients VIP', 'Réparations VIP', stats.vipRepairsCount, 'dossier'],
    ['Clients VIP', 'Factures VIP', stats.vipInvoicesCount, 'facture'],
    ['Revendeurs', 'Revendeurs actifs', stats.activeResellers, 'revendeur'],
    ['Revendeurs', 'Contrats vendus', stats.soldContractsCount, 'contrat'],
    ['Revendeurs', 'Contrats actifs', stats.activeContractsCount, 'contrat'],
    ['Performance', 'Délai moyen de réparation', stats.avgRepairTimeHours, 'heure'],
    ['Performance', 'Évolution du délai de réparation', stats.repairTimeTrendPct, '%'],
    ['Performance', 'Taux de réussite des réparations', stats.repairSuccessRate, '%'],
    ['Performance', 'Utilisation des techniciens', stats.technicianUtilizationRate, '%'],
    ['Performance', 'Revenu par technicien', stats.revenuePerTechnician, 'FCFA'],
    ['Performance', 'Revenu par employé', stats.revenuePerEmployee, 'FCFA'],
    ['Performance', 'Panier moyen global', stats.avgBasketGlobal, 'FCFA'],
    ['Performance', 'Panier moyen réparation', stats.avgBasketRepair, 'FCFA'],
    ['Performance', 'Panier moyen échange', stats.avgBasketTradein, 'FCFA'],
    ['Performance', 'Panier moyen téléphone', stats.avgBasketPhone, 'FCFA'],
    ['Performance', 'Récurrence client', stats.clientRecurrenceRate, '%'],
    ['Performance', 'Conversion VIP', stats.vipConversionRate, '%'],
    ['Performance', 'Panier moyen VIP', stats.vipAvgBasket, 'FCFA'],
    ['Performance', 'Panier moyen non-VIP', stats.nonVipAvgBasket, 'FCFA'],
    ['Performance', 'Taux d’acceptation des échanges', stats.exchangeAcceptanceRate, '%'],
    ['Performance', 'Valeur moyenne des échanges', stats.avgTradeinValue, 'FCFA'],
    ['Performance', 'Délai moyen de traitement des échanges', stats.avgTradeinProcessingHours, 'heure'],
    ['Tendances', 'Évolution du CA vs mois précédent', stats.revenueGrowthVsPrevMonth, '%'],
    ['Tendances', 'Comparaison annuelle', stats.annualComparisonPct, '%'],
    ['Tendances', 'Prévision du mois prochain', stats.salesForecastNextMonth, 'FCFA'],
  ]

  definitions.forEach(([section, indicator, value, unit]) => {
    rows.push(makeRow({ section, indicator, value: asNumber(value), unit }))
  })
}

const appendSeries = (rows, stats, salesEvolution, repairsEvolution, tradeinsEvolution, weeklyActivity) => {
  salesEvolution.forEach((point) => {
    const period = point.month || ''
    ;[
      ['Réparations', firstDefined(point, ['réparations', 'rÃ©parations', 'repairs'])],
      ['Échanges', firstDefined(point, ['échanges', 'Ã©changes', 'tradeins'])],
      ['Téléphones', firstDefined(point, ['téléphones', 'tÃ©lÃ©phones', 'phones'])],
    ].forEach(([label, value]) => {
      rows.push(makeRow({
        type: 'Série',
        section: 'Évolution des ventes',
        period,
        label,
        indicator: 'Chiffre d’affaires',
        value: asNumber(value),
        unit: 'FCFA',
      }))
    })
  })

  repairsEvolution.forEach((point) => rows.push(makeRow({
    type: 'Série',
    section: 'Évolution des réparations',
    period: point.month || '',
    indicator: 'Nombre de réparations',
    value: asNumber(point.count),
    unit: 'dossier',
  })))

  tradeinsEvolution.forEach((point) => rows.push(makeRow({
    type: 'Série',
    section: 'Évolution des échanges',
    period: point.month || '',
    indicator: 'Nombre d’échanges',
    value: asNumber(point.count),
    unit: 'dossier',
  })))

  weeklyActivity.forEach((point) => {
    ;[
      ['Réparations', firstDefined(point, ['réparations', 'rÃ©parations', 'repairs'])],
      ['Échanges', firstDefined(point, ['échanges', 'Ã©changes', 'tradeins'])],
      ['Ventes', firstDefined(point, ['ventes', 'sales'])],
    ].forEach(([label, value]) => rows.push(makeRow({
      type: 'Série',
      section: 'Activité hebdomadaire',
      period: point.day || '',
      label,
      indicator: 'Nombre d’opérations',
      value: asNumber(value),
      unit: 'opération',
    })))
  })

  ;(stats.topBrands || []).forEach((item) => {
    rows.push(makeRow({
      type: 'Classement',
      section: 'Top marques vendues',
      label: item.brand || 'Autres',
      indicator: 'Chiffre d’affaires',
      quantity: asNumber(item.quantity),
      value: asNumber(item.revenue),
      unit: 'FCFA',
    }))
  })

  ;(stats.topModelsSold || []).forEach((item) => {
    rows.push(makeRow({
      type: 'Classement',
      section: 'Top modèles vendus',
      label: item.model || 'Modèle inconnu',
      indicator: 'Chiffre d’affaires',
      quantity: asNumber(item.quantity),
      value: asNumber(item.revenue),
      unit: 'FCFA',
    }))
  })

  ;(stats.repairIssues || []).forEach((item) => rows.push(makeRow({
    type: 'Répartition',
    section: 'Pannes',
    label: item.issue || 'Autres',
    indicator: 'Nombre de dossiers',
    value: asNumber(item.value),
    unit: 'dossier',
  })))

  ;(stats.repairsByStatus || []).forEach((item) => rows.push(makeRow({
    type: 'Répartition',
    section: 'Réparations par statut',
    status: item.name || '',
    indicator: 'Nombre de dossiers',
    value: asNumber(item.value),
    unit: 'dossier',
  })))

  ;(stats.tradeinsByStatus || []).forEach((item) => rows.push(makeRow({
    type: 'Répartition',
    section: 'Échanges par statut',
    status: item.name || '',
    indicator: 'Nombre de dossiers',
    value: asNumber(item.value),
    unit: 'dossier',
  })))

  ;(stats.monthlyRevenue || []).forEach((item) => rows.push(makeRow({
    type: 'Série',
    section: 'Revenus mensuels',
    period: item.month || '',
    indicator: 'Chiffre d’affaires',
    value: asNumber(item.revenue),
    unit: 'FCFA',
  })))
}

const appendTables = (rows, products, inventory, employees, sales) => {
  products.forEach((item) => rows.push(makeRow({
    type: 'Donnée',
    section: 'Produits',
    id: item._id || '',
    label: item.name || '',
    category: item.brand || '',
    status: asNumber(item.stock) > 0 ? 'En stock' : 'Rupture',
    quantity: asNumber(item.stock),
    indicator: 'Prix unitaire',
    value: asNumber(item.price),
    unit: 'FCFA',
  })))

  inventory.forEach((item) => rows.push(makeRow({
    type: 'Donnée',
    section: 'Inventaire',
    id: item._id || '',
    label: item.name || '',
    category: item.category || '',
    status: asNumber(item.quantity) > 0 ? 'Disponible' : 'Rupture',
    quantity: asNumber(item.quantity),
    indicator: 'Prix unitaire',
    value: asNumber(item.unitPrice),
    unit: 'FCFA',
  })))

  employees.forEach((item) => rows.push(makeRow({
    type: 'Donnée',
    section: 'Employés',
    id: item._id || '',
    label: item.name || item.username || '',
    client: item.email || '',
    contact: item.phone || '',
    category: item.role || '',
    status: item.isActive === false ? 'Inactif' : 'Actif',
    indicator: 'Employé',
    value: '',
  })))

  sales.forEach((item) => rows.push(makeRow({
    type: 'Donnée',
    section: 'Transactions',
    period: item.date ? new Date(item.date).toLocaleString('fr-FR') : '',
    id: item._id || '',
    label: item.productName || '',
    client: item.clientName || '',
    contact: item.clientWhatsapp || '',
    category: item.type || '',
    status: item.status || '',
    quantity: asNumber(item.quantity || 1),
    indicator: 'Montant',
    value: asNumber(item.amount),
    unit: 'FCFA',
    detail: item.invoiceUrl || item.saleInfo?.invoiceUrl ? 'Facture disponible' : '',
  })))
}

export function buildDashboardCsvRows({
  stats = {},
  kpis = {},
  salesEvolution = [],
  repairsEvolution = [],
  tradeinsEvolution = [],
  weeklyActivity = [],
  products = [],
  inventory = [],
  employees = [],
  sales = [],
} = {}) {
  const rows = []
  appendKpis(rows, stats, kpis)
  appendSeries(rows, stats, salesEvolution, repairsEvolution, tradeinsEvolution, weeklyActivity)
  appendTables(rows, products, inventory, employees, sales)
  return rows
}
