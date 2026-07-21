import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Wrench, RefreshCw, Smartphone, DollarSign,
  Search, X, CheckCircle, Download, CreditCard, Banknote, Send, FileText, Eye
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import { useCashierAuth } from '../../hooks/useCashierAuth'
import api, { API_BASE_URL } from '../../services/api'
import Toast from '../../components/Toast'
import { useLocation, useNavigate, Link } from 'react-router-dom'

export default function CashierSales() {
  // États principaux
  const [repairs, setRepairs] = useState([])
  const [tradeins, setTradeins] = useState([])
  const [phoneSales, setPhoneSales] = useState([])
  const [vipBillableRepairs, setVipBillableRepairs] = useState([])
  const [vipInvoices, setVipInvoices] = useState([])
  const [resellerContractsPending, setResellerContractsPending] = useState([])
  const [resellerContractSummary, setResellerContractSummary] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    overdueCount: 0
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [invoiceLink, setInvoiceLink] = useState('')
  const [invoiceDownloadUrl, setInvoiceDownloadUrl] = useState('')

  // Gestion de la modale "Nouvelle vente"
  const [showNewSale, setShowNewSale] = useState(false)
  const [newSale, setNewSale] = useState({
    saleType: 'repair',
    repairId: '',
    amountPaid: '',
    paymentMethod: 'cash',
    notes: '',
    clientWhatsapp: '',
    phoneQuantity: 1,
    exchangeDeviceModel: '',
    exchangeDeviceBrand: '',
    exchangeDeviceCondition: 'good',
    exchangeDeviceImei: ''
  })

  // Gestion de la modale "Vente téléphone" (dédiée)
  const [showPhoneSale, setShowPhoneSale] = useState(false)
  const [phoneSale, setPhoneSale] = useState({
    productId: '', quantity: 1, amount: '', clientName: '',
    clientWhatsapp: '', paymentMethod: 'cash', notes: ''
  })

  // Gestion de la modale "Paiement échange" (dédiée)
  const [showNewTradeinPayment, setShowNewTradeinPayment] = useState(false)
  const [newTradeinPayment, setNewTradeinPayment] = useState({
    tradeinId: '', amountPaid: '', paymentMethod: 'cash', notes: ''
  })
  const [showResellerContractPaymentModal, setShowResellerContractPaymentModal] = useState(false)
  const [selectedResellerContract, setSelectedResellerContract] = useState(null)
  const [resellerContractPaymentData, setResellerContractPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    overrideReason: ''
  })
  const [vipFilters, setVipFilters] = useState({
    client: '',
    fromDate: '',
    toDate: '',
    status: 'all',
    repairNumber: ''
  })
  const [selectedVipRepairIds, setSelectedVipRepairIds] = useState([])
  const [showVipPreviewModal, setShowVipPreviewModal] = useState(false)
  const [selectedVipPreview, setSelectedVipPreview] = useState(null)
  const [showVipInvoicePaymentModal, setShowVipInvoicePaymentModal] = useState(false)
  const [selectedVipInvoice, setSelectedVipInvoice] = useState(null)
  const [vipInvoicePaymentData, setVipInvoicePaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    note: ''
  })

  // UI : onglets, recherche, pagination
  const [activeTab, setActiveTab] = useState('repairs')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState({ repairs: 1, vipRepairs: 1, vipInvoices: 1, tradeins: 1, phones: 1, contracts: 1 })
  const [processing, setProcessing] = useState(false)
  const itemsPerPage = 6

  const location = useLocation()
  const navigate = useNavigate()
  const isAdminView = location.pathname.startsWith('/admin/cashier')

  const resolveStoredUrl = (value) => {
    if (!value) return ''
    return value.startsWith('http') ? value : `${API_BASE_URL}${value}`
  }

  const openPdfBlob = async (endpoint) => {
    if (!endpoint) {
      setToast({ type: 'error', message: 'Aucune facture disponible pour cette action.' })
      return
    }

    const response = await api.get(endpoint, { responseType: 'blob' })
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
  }

  const downloadPdfBlob = async (endpoint, filename) => {
    if (!endpoint) {
      setToast({ type: 'error', message: 'Aucune facture disponible pour ce téléchargement.' })
      return
    }

    const response = await api.get(endpoint, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const getLatestVipReceiptUrl = (invoice) => {
    if (!invoice) return ''
    const payments = Array.isArray(invoice.payments) ? invoice.payments : []
    const latestPayment = payments.length ? payments[payments.length - 1] : null
    return latestPayment?.receiptUrl || invoice.receiptPath || ''
  }

  // ========== CHARGEMENT DES DONNÉES ==========
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      const vipBase = isAdminView ? '/api/admin/vip' : '/api/cashier/vip'
      const [repairsRes, tradeinsRes, productsRes, salesRes, contractsRes, vipRepairsRes, vipInvoicesRes] = await Promise.all([
        api.get(`${base}/repairs`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/tradeins`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/products`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/sales`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/reseller-contracts/pending-payment`).catch(() => ({ data: { data: [] } })),
        api.get(`${vipBase}/repairs/billable`).catch(() => ({ data: { data: [] } })),
        api.get(`${vipBase}/invoices`).catch(() => ({ data: { data: [] } }))
      ])

      setRepairs(repairsRes.data?.data || repairsRes.data || [])
      setTradeins(tradeinsRes.data?.data || tradeinsRes.data || [])

      // Produits : on ne garde que ceux en stock
      let items = productsRes.data?.data || productsRes.data || []
      if (!Array.isArray(items)) items = []
      setProducts(
        items
          .map(item => ({
            _id: item._id,
            name: item.name,
            brand: item.brand,
            quantity: item.stock || item.quantity || 0,
            unitPrice: item.price || item.unitPrice || 0
          }))
          .filter(item => item.quantity > 0)
      )

      setPhoneSales(salesRes.data?.data || salesRes.data || [])
      setVipBillableRepairs(Array.isArray(vipRepairsRes.data?.data) ? vipRepairsRes.data.data : [])
      setVipInvoices(Array.isArray(vipInvoicesRes.data?.data) ? vipInvoicesRes.data.data : [])
      setResellerContractsPending(contractsRes.data?.data || contractsRes.data || [])
      setResellerContractSummary(contractsRes.data?.meta || { pendingCount: 0, pendingAmount: 0, paidCount: 0, paidAmount: 0, overdueCount: 0 })
    } catch (error) {
      console.error('Erreur chargement:', error)
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/cashier/login'), 2000)
      } else {
        setToast({ type: 'error', message: 'Erreur de chargement' })
      }
    } finally {
      setLoading(false)
    }
  }, [isAdminView, navigate])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // ========== DONNÉES CALCULÉES ==========
  const readyRepairs = useMemo(() =>
    repairs.filter(r => (r.status === 'completed' || r.status === 'ready') && !r.isVip),
    [repairs]
  )

  const vipRepairs = useMemo(() => (
    Array.isArray(vipBillableRepairs) ? vipBillableRepairs : []
  ), [vipBillableRepairs])

  const vipInvoicesPending = useMemo(() => (
    (Array.isArray(vipInvoices) ? vipInvoices : []).filter(inv => String(inv.status || '').toLowerCase() === 'issued')
  ), [vipInvoices])

  const acceptedTradeins = useMemo(() =>
    tradeins.filter(t => t.status === 'completed' || t.status === 'accepted'),
    [tradeins]
  )

  const allPaidPayments = useMemo(() => [
    // Réparations payées
    ...repairs.filter(r => r.status === 'paid').map(r => ({
      ...r, 
      paymentType: 'repair', 
      transactionType: 'repair',
      paidAmount: r.saleInfo?.amountPaid || r.price || 0
    })),
    // Échanges payés
    ...tradeins.filter(t => t.status === 'paid').map(t => ({
      ...t, 
      paymentType: 'tradein', 
      transactionType: 'tradein',
      paidAmount: t.saleInfo?.amountPaid || t.saleInfo?.amount || t.proposedValue || 0
    })),
    // Ventes de téléphones
    ...phoneSales.map(s => ({
      _id: s._id || Math.random().toString(),
      paymentType: 'phone', 
      transactionType: 'phone',
      clientName: s.clientName || 'Client',
      clientWhatsapp: s.clientWhatsapp || '',
      paidAmount: s.totalAmount || s.amount || 0,
      saleInfo: {
        amount: s.totalAmount || s.amount || 0,
        amountPaid: s.totalAmount || s.amount || 0,
        paymentMethod: s.paymentMethod || 'cash',
        paymentDate: s.createdAt || s.paymentDate || s.date,
        notes: s.notes || '',
        validatedBy: s.seller || 'Caissier'
      }
    }))
  ], [repairs, tradeins, phoneSales])

  const stats = useMemo(() => {
    // Revenus par type
    const repairRevenue = repairs
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (r.saleInfo?.amountPaid || r.price || 0), 0)
    
    const tradeinRevenue = tradeins
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.saleInfo?.amountPaid || t.saleInfo?.amount || t.proposedValue || 0), 0)
    
    const phoneSalesRevenue = phoneSales
      .reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0)
    
    // Total unifié
    const totalRevenue = allPaidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0) + Number(resellerContractSummary.paidAmount || 0)
    const resellerContractsToCollect = Number(resellerContractSummary.pendingCount || 0)
    const resellerContractsAmount = Number(resellerContractSummary.pendingAmount || 0)
    const resellerContractsCollectedAmount = Number(resellerContractSummary.paidAmount || 0)
    
    return {
      readyRepairs: readyRepairs.length,
      acceptedTradeins: acceptedTradeins.length,
      phoneSalesCount: phoneSales.length,
      phoneSalesRevenue,
      repairRevenue,
      tradeinRevenue,
      resellerContractsToCollect,
      resellerContractsAmount,
      resellerContractsCollectedAmount,
      totalRevenue,
      totalTransactions: allPaidPayments.length + Number(resellerContractSummary.paidCount || 0)
    }
  }, [readyRepairs, acceptedTradeins, phoneSales, repairs, tradeins, allPaidPayments, resellerContractsPending, resellerContractSummary])

  const paymentMethodData = useMemo(() => {
    const methods = {}
    allPaidPayments.forEach(p => {
      const method = p.saleInfo?.paymentMethod || 'cash'
      const label = method === 'cash' ? 'Espèces' : 
                    method === 'card' ? 'Carte' : 
                    method === 'mobile_money' ? 'Paiement mobile' : 
                    method === 'check' ? 'Chèque' : 'Virement'
      methods[label] = (methods[label] || 0) + (p.paidAmount || 0)
    })
    return Object.entries(methods).map(([name, value], i) => ({
      name, 
      value, 
      color: ['#22c55e', '#3B82F6', '#f97316', '#8b5cf6', '#ec4899'][i]
    }))
  }, [allPaidPayments])

  // ========== FILTRAGE & PAGINATION ==========
  const filterByTerm = (list, fields) => {
    if (!searchTerm) return list
    const t = searchTerm.toLowerCase()
    return list.filter(item => fields.some(f => (item[f] || '').toLowerCase().includes(t)))
  }

  const filteredRepairs = useMemo(() => filterByTerm(readyRepairs, ['clientName', 'clientWhatsapp']), [readyRepairs, searchTerm])
  const filteredVipRepairs = useMemo(() => {
    return vipRepairs.filter((item) => {
      const matchSearch = !searchTerm ||
        String(item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.clientWhatsapp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.deviceModel || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchClient = !vipFilters.client || String(item.clientName || '').toLowerCase().includes(vipFilters.client.toLowerCase())
      const matchRepairNumber = !vipFilters.repairNumber || String(item.repairNumber || item._id || '').toLowerCase().includes(vipFilters.repairNumber.toLowerCase())
      const matchStatus = vipFilters.status === 'all'
        ? true
        : String(item.status || '').toLowerCase() === vipFilters.status.toLowerCase()
          || String(item.billingStatus || item.vipBilling?.status || '').toLowerCase() === vipFilters.status.toLowerCase()

      const rowDate = item.repairDate || item.completedAt || item.createdAt
      const rowDateObj = rowDate ? new Date(rowDate) : null
      const fromDateObj = vipFilters.fromDate ? new Date(vipFilters.fromDate) : null
      const toDateObj = vipFilters.toDate ? new Date(vipFilters.toDate) : null
      const matchDateFrom = !fromDateObj || (rowDateObj && rowDateObj >= fromDateObj)
      const matchDateTo = !toDateObj || (rowDateObj && rowDateObj <= new Date(toDateObj.getTime() + 24 * 60 * 60 * 1000 - 1))

      return matchSearch && matchClient && matchRepairNumber && matchStatus && matchDateFrom && matchDateTo
    })
  }, [vipRepairs, searchTerm, vipFilters])
  const filteredVipInvoices = useMemo(() => {
    return vipInvoicesPending.filter((item) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return String(item.invoiceNumber || '').toLowerCase().includes(term)
        || String(item.status || '').toLowerCase().includes(term)
        || String(item.vipClient?.name || '').toLowerCase().includes(term)
    })
  }, [vipInvoicesPending, searchTerm])
  const filteredTradeins = useMemo(() => filterByTerm(acceptedTradeins, ['clientName', 'clientWhatsapp']), [acceptedTradeins, searchTerm])
  const filteredProducts = useMemo(() => filterByTerm(products, ['name', 'brand']), [products, searchTerm])
  const filteredResellerContracts = useMemo(() => filterByTerm(resellerContractsPending, ['number']), [resellerContractsPending, searchTerm])

  const paginatedRepairs = filteredRepairs.slice((currentPage.repairs - 1) * itemsPerPage, currentPage.repairs * itemsPerPage)
  const paginatedVipRepairs = filteredVipRepairs.slice((currentPage.vipRepairs - 1) * itemsPerPage, currentPage.vipRepairs * itemsPerPage)
  const paginatedVipInvoices = filteredVipInvoices.slice((currentPage.vipInvoices - 1) * itemsPerPage, currentPage.vipInvoices * itemsPerPage)
  const paginatedTradeins = filteredTradeins.slice((currentPage.tradeins - 1) * itemsPerPage, currentPage.tradeins * itemsPerPage)
  const paginatedPhones = filteredProducts.slice((currentPage.phones - 1) * itemsPerPage, currentPage.phones * itemsPerPage)
  const paginatedContracts = filteredResellerContracts.slice((currentPage.contracts - 1) * itemsPerPage, currentPage.contracts * itemsPerPage)

  const totalRepairsPages = Math.ceil(filteredRepairs.length / itemsPerPage)
  const totalVipRepairsPages = Math.ceil(filteredVipRepairs.length / itemsPerPage)
  const totalVipInvoicesPages = Math.ceil(filteredVipInvoices.length / itemsPerPage)
  const totalTradeinsPages = Math.ceil(filteredTradeins.length / itemsPerPage)
  const totalPhonesPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const totalContractsPages = Math.ceil(filteredResellerContracts.length / itemsPerPage)

  const formatInvoiceStatus = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'issued') return 'Émise'
    if (normalized === 'paid') return 'Payée'
    if (normalized === 'partially_paid') return 'Partiellement payée'
    if (normalized === 'cancelled') return 'Annulée'
    if (normalized === 'overdue') return 'En retard'
    if (normalized === 'draft') return 'Brouillon'
    return status || '-'
  }

  const formatRepairStatus = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'ready') return 'Terminée'
    if (normalized === 'completed') return 'Terminée'
    if (normalized === 'paid' || normalized === 'soldee') return 'Soldée'
    return status || '-'
  }

  const formatBillingStatus = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'billable' || normalized === 'pending') return 'Non facturée'
    if (normalized === 'invoiced') return 'Facturée'
    if (normalized === 'paid' || normalized === 'soldee') return 'Soldée'
    return status || 'Non facturée'
  }

  // ========== GÉNÉRATION FACTURE (Fonction centralisée) ==========
  const generateInvoice = async ({ requestType, requestId, clientName, clientWhatsapp, amount, quantity, itemName, paymentMethod }) => {
    try {
      const payload = {
        requestType,
        requestId,
        clientName: clientName || 'Client',
        clientWhatsapp: clientWhatsapp || '',
        amount: +amount,
        quantity: quantity || 1,
        itemName: itemName || 'Article',
        paymentMethod: paymentMethod || 'cash'
      }
      console.log('📄 Génération facture:', payload)
      
      const inv = await api.post('/api/invoice/generate', payload)
      console.log('📄 Réponse facture:', inv.data)
      
      const pdf = inv?.data?.data?.pdfUrl
      const downloadUrl = inv?.data?.data?.downloadUrl
      if (pdf) {
        setInvoiceLink(pdf.startsWith('http') ? pdf : `${API_BASE_URL}${pdf}`)
        setInvoiceDownloadUrl(downloadUrl || '')
        return true
      }
      return false
    } catch (e) {
      console.error('❌ Erreur génération facture:', e.response?.data || e.message)
      return false
    }
  }

  // ========== HANDLERS ==========
  const handleNewSale = async (e) => {
    e.preventDefault()
    if (!newSale.repairId || !newSale.amountPaid) {
      setToast({ type: 'error', message: 'Champs requis manquants' })
      return
    }

    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      let invoiceRequestType = ''
      let invoiceRequestId = ''
      let clientNameForInvoice = ''
      let clientWhatsappForInvoice = ''
      let itemNameForInvoice = ''

      if (newSale.saleType === 'repair') {
        await api.put(`${base}/repairs/${newSale.repairId}/status`, {
          status: 'paid',
          saleInfo: {
            amount: +newSale.amountPaid,
            amountPaid: +newSale.amountPaid,
            paymentMethod: newSale.paymentMethod,
            paymentDate: new Date(),
            notes: newSale.notes
          }
        })
        setRepairs(prev => prev.map(r =>
          r._id === newSale.repairId ? { ...r, status: 'paid', saleInfo: { amount: +newSale.amountPaid, amountPaid: +newSale.amountPaid, paymentMethod: newSale.paymentMethod, paymentDate: new Date(), notes: newSale.notes } } : r
        ))
        const repair = readyRepairs.find(r => r._id === newSale.repairId)
        clientNameForInvoice = repair?.clientName || ''
        clientWhatsappForInvoice = repair?.clientWhatsapp || ''
        itemNameForInvoice = `Réparation - ${repair?.deviceModel || ''}`
        invoiceRequestType = 'repair'
        invoiceRequestId = newSale.repairId

      } else if (newSale.saleType === 'tradein') {
        await api.put(`${base}/tradeins/${newSale.repairId}/pay`, {
          amount: +newSale.amountPaid,
          paymentMethod: newSale.paymentMethod,
          paymentDate: new Date(),
          notes: newSale.notes
        })
        setTradeins(prev => prev.map(t =>
          t._id === newSale.repairId ? { ...t, status: 'paid', saleInfo: { amount: +newSale.amountPaid, amountPaid: +newSale.amountPaid, paymentMethod: newSale.paymentMethod, paymentDate: new Date(), notes: newSale.notes } } : t
        ))
        const tradein = acceptedTradeins.find(t => t._id === newSale.repairId)
        clientNameForInvoice = tradein?.clientName || ''
        clientWhatsappForInvoice = tradein?.clientWhatsapp || ''
        itemNameForInvoice = `Échange - ${tradein?.deviceModel || ''}`
        invoiceRequestType = 'tradein'
        invoiceRequestId = newSale.repairId

      } else if (newSale.saleType === 'phone') {
        await api.post(`${base}/products/${newSale.repairId}/sell`, {
          quantity: newSale.phoneQuantity || 1,
          clientWhatsapp: newSale.clientWhatsapp,
          amount: +newSale.amountPaid,
          paymentMethod: newSale.paymentMethod,
          notes: newSale.notes
        })
        setProducts(prev => prev.map(p =>
          p._id === newSale.repairId ? { ...p, quantity: p.quantity - (newSale.phoneQuantity || 1) } : p
        ))
        setPhoneSales(prev => [...prev, {
          _id: Date.now().toString(),
          productId: newSale.repairId,
          clientWhatsapp: newSale.clientWhatsapp,
          totalAmount: +newSale.amountPaid,
          paymentMethod: newSale.paymentMethod,
          createdAt: new Date(),
          notes: newSale.notes
        }])
        const product = products.find(p => p._id === newSale.repairId)
        clientNameForInvoice = newSale.clientWhatsapp || 'Client'
        clientWhatsappForInvoice = newSale.clientWhatsapp || ''
        itemNameForInvoice = product?.name || 'Téléphone'
        invoiceRequestType = 'product'
        invoiceRequestId = newSale.repairId
      }

      // Génération facture
      await generateInvoice({
        requestType: invoiceRequestType,
        requestId: invoiceRequestId,
        clientName: clientNameForInvoice,
        clientWhatsapp: clientWhatsappForInvoice,
        amount: +newSale.amountPaid,
        quantity: newSale.phoneQuantity || 1,
        itemName: itemNameForInvoice,
        paymentMethod: newSale.paymentMethod
      })

      setToast({ type: 'success', message: '✅ Vente enregistrée avec succès' })
      setShowNewSale(false)
      setNewSale({
        saleType: 'repair',
        repairId: '',
        amountPaid: '',
        paymentMethod: 'cash',
        notes: '',
        clientWhatsapp: '',
        phoneQuantity: 1,
        exchangeDeviceModel: '',
        exchangeDeviceBrand: '',
        exchangeDeviceCondition: 'good',
        exchangeDeviceImei: ''
      })

      setTimeout(() => fetchAllData(), 500)
    } catch (e) {
      console.error('Erreur vente:', e)
      if (e.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/cashier/login'), 2000)
      } else {
        setToast({ type: 'error', message: e.response?.data?.message || 'Erreur lors de la vente' })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleNewTradeinPayment = async (e) => {
    e.preventDefault()
    if (!newTradeinPayment.tradeinId || !newTradeinPayment.amountPaid) {
      setToast({ type: 'error', message: 'Champs requis manquants' })
      return
    }
    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      await api.put(`${base}/tradeins/${newTradeinPayment.tradeinId}/pay`, {
        amount: +newTradeinPayment.amountPaid,
        paymentMethod: newTradeinPayment.paymentMethod,
        paymentDate: new Date(),
        notes: newTradeinPayment.notes
      })
      setTradeins(prev => prev.map(t =>
        t._id === newTradeinPayment.tradeinId ? {
          ...t,
          status: 'paid',
          saleInfo: {
            amount: +newTradeinPayment.amountPaid,
            amountPaid: +newTradeinPayment.amountPaid,
            paymentMethod: newTradeinPayment.paymentMethod,
            paymentDate: new Date(),
            notes: newTradeinPayment.notes
          }
        } : t
      ))
      
      // Génération facture pour paiement échange
      const tradein = acceptedTradeins.find(t => t._id === newTradeinPayment.tradeinId)
      await generateInvoice({
        requestType: 'tradein',
        requestId: newTradeinPayment.tradeinId,
        clientName: tradein?.clientName || 'Client',
        clientWhatsapp: tradein?.clientWhatsapp || '',
        amount: +newTradeinPayment.amountPaid,
        itemName: `Échange - ${tradein?.deviceModel || ''}`,
        paymentMethod: newTradeinPayment.paymentMethod
      })

      setToast({ type: 'success', message: 'Paiement enregistré' })
      setShowNewTradeinPayment(false)
      setNewTradeinPayment({ tradeinId: '', amountPaid: '', paymentMethod: 'cash', notes: '' })
      setTimeout(() => fetchAllData(), 500)
    } catch (e) {
      console.error('Erreur paiement échange:', e)
      if (e.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/cashier/login'), 2000)
      } else {
        setToast({ type: 'error', message: e.response?.data?.message || 'Erreur' })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleNewPhoneSale = async (e) => {
    e.preventDefault()
    const { productId, amount, clientWhatsapp, quantity, paymentMethod, notes, clientName } = phoneSale
    if (!productId || !amount || !clientWhatsapp) {
      setToast({ type: 'error', message: 'Téléphone, montant et WhatsApp requis' })
      return
    }
    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      await api.post(`${base}/products/${productId}/sell`, {
        quantity: +quantity,
        clientName: clientName || 'Client',
        clientWhatsapp,
        amount: +amount,
        paymentMethod,
        notes
      })
      setProducts(prev => prev.map(p =>
        p._id === productId ? { ...p, quantity: p.quantity - (+quantity) } : p
      ))
      setPhoneSales(prev => [...prev, {
        _id: Date.now().toString(),
        productId,
        clientName: clientName || 'Client',
        clientWhatsapp,
        totalAmount: +amount,
        paymentMethod,
        createdAt: new Date(),
        notes
      }])

      // 🔧 GÉNÉRATION FACTURE CORRIGÉE
      const productName = products.find(p => p._id === productId)?.name || 'Téléphone'
      await generateInvoice({
        requestType: 'product',
        requestId: productId,
        clientName: clientName || 'Client',
        clientWhatsapp: clientWhatsapp,
        amount: +amount,
        quantity: +quantity,
        itemName: productName,
        paymentMethod: paymentMethod
      })

      setToast({ type: 'success', message: 'Vente téléphone enregistrée' })
      setShowPhoneSale(false)
      setPhoneSale({ productId: '', quantity: 1, amount: '', clientName: '', clientWhatsapp: '', paymentMethod: 'cash', notes: '' })
      setTimeout(() => fetchAllData(), 500)
    } catch (e) {
      console.error('Erreur vente téléphone:', e)
      if (e.response?.status === 401) {
        setToast({ type: 'error', message: 'Session expirée, veuillez vous reconnecter' })
        setTimeout(() => navigate('/cashier/login'), 2000)
      } else {
        setToast({ type: 'error', message: e.response?.data?.message || 'Erreur vente téléphone' })
      }
    } finally {
      setProcessing(false)
    }
  }

  const openResellerContractPaymentModal = (contract) => {
    setSelectedResellerContract(contract)
    setResellerContractPaymentData({
      amount: String(contract.payment?.amountExpected || contract.saleInfo?.amount || ''),
      paymentMethod: 'cash',
      notes: '',
      overrideReason: ''
    })
    setShowResellerContractPaymentModal(true)
  }

  const closeResellerContractPaymentModal = () => {
    setShowResellerContractPaymentModal(false)
    setSelectedResellerContract(null)
    setResellerContractPaymentData({ amount: '', paymentMethod: 'cash', notes: '', overrideReason: '' })
  }

  const handleCollectResellerContract = async (e) => {
    e.preventDefault()
    if (!selectedResellerContract) return

    const amount = Number(resellerContractPaymentData.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({ type: 'error', message: 'Montant invalide.' })
      return
    }

    const isOverdue = Boolean(selectedResellerContract?.payment?.isOverdue)
    if (isOverdue && isAdminView && !String(resellerContractPaymentData.overrideReason || '').trim()) {
      setToast({ type: 'error', message: 'Motif obligatoire pour un encaissement hors delai.' })
      return
    }

    setProcessing(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      const res = await api.put(`${base}/reseller-contracts/${selectedResellerContract._id}/pay`, {
        amount,
        paymentMethod: resellerContractPaymentData.paymentMethod,
        note: resellerContractPaymentData.notes,
        overrideReason: resellerContractPaymentData.overrideReason
      })

      if (res.data?.success) {
        await generateInvoice({
          requestType: 'reseller_contract',
          requestId: selectedResellerContract._id,
          clientName: selectedResellerContract.reseller?.name || 'Revendeur',
          clientWhatsapp: selectedResellerContract.reseller?.whatsapp || selectedResellerContract.reseller?.phone || '',
          amount,
          itemName: selectedResellerContract.product?.name || 'Téléphone',
          paymentMethod: resellerContractPaymentData.paymentMethod
        })
        setToast({ type: 'success', message: 'Encaissement enregistré avec succès.' })
        closeResellerContractPaymentModal()
        await fetchAllData()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Erreur lors de l\'encaissement.' })
    } finally {
      setProcessing(false)
    }
  }

  const openVipPreview = (repair, explicitRepairs = null) => {
    const vipClientId = repair?.vipClient?._id || repair?.vipClient || explicitRepairs?.[0]?.vipClient?._id || explicitRepairs?.[0]?.vipClient
    if (!vipClientId) {
      setToast({ type: 'error', message: 'Client VIP introuvable pour cette réparation.' })
      return
    }

    const sourceRepairs = Array.isArray(explicitRepairs) && explicitRepairs.length ? explicitRepairs : vipRepairs
    const clientRepairs = sourceRepairs.filter((row) => {
      const rowVipId = row?.vipClient?._id || row?.vipClient
      return String(rowVipId) === String(vipClientId)
    })

    const total = clientRepairs.reduce((sum, row) => sum + Number(row.cost || 0), 0)
    const vipClientRef = repair?.vipClient && typeof repair.vipClient === 'object' ? repair.vipClient : (clientRepairs[0]?.vipClient && typeof clientRepairs[0].vipClient === 'object' ? clientRepairs[0].vipClient : null)
    setSelectedVipPreview({
      vipClientId,
      clientName: repair.clientName || 'Client VIP',
      clientWhatsapp: repair.clientWhatsapp || '',
      clientPhone: vipClientRef?.phone || repair.clientWhatsapp || '',
      clientAddress: vipClientRef?.metadata?.address || '',
      vipStatus: vipClientRef?.isActive === false ? 'Inactif' : 'Actif',
      repairs: clientRepairs,
      total
    })
    setShowVipPreviewModal(true)
  }

  const openVipPreviewForSelection = () => {
    if (!selectedVipRepairIds.length) {
      setToast({ type: 'error', message: 'Sélectionnez au moins une réparation VIP.' })
      return
    }

    const selectedRows = vipRepairs.filter((row) => selectedVipRepairIds.includes(String(row._id)))
    if (!selectedRows.length) {
      setToast({ type: 'error', message: 'Sélection invalide.' })
      return
    }

    const clientIds = [...new Set(selectedRows.map((row) => String(row?.vipClient?._id || row?.vipClient || '')))]
    if (clientIds.length !== 1) {
      setToast({ type: 'error', message: 'La sélection doit contenir un seul client VIP.' })
      return
    }

    openVipPreview(selectedRows[0], selectedRows)
  }

  const closeVipPreview = () => {
    setShowVipPreviewModal(false)
    setSelectedVipPreview(null)
  }

  const handleGenerateVipInvoiceFromPreview = async () => {
    if (!selectedVipPreview || !selectedVipPreview.repairs?.length) {
      setToast({ type: 'error', message: 'Aucune réparation à facturer.' })
      return
    }

    setProcessing(true)
    try {
      const vipBase = isAdminView ? '/api/admin/vip' : '/api/cashier/vip'
      const repairIds = selectedVipPreview.repairs.map((row) => String(row._id))
      const res = await api.post(`${vipBase}/invoices/generate-manual`, {
        vipClientId: selectedVipPreview.vipClientId,
        repairIds,
        tvaRate: 0
      })

      if (res.data?.success) {
        const invoice = res.data?.data
        if (invoice?.pdfPath) {
          const link = invoice.pdfPath.startsWith('http') ? invoice.pdfPath : `${API_BASE_URL}${invoice.pdfPath}`
          setInvoiceLink(link)
        }
        setToast({ type: 'success', message: 'Facture VIP générée avec succès.' })
        setSelectedVipRepairIds([])
        closeVipPreview()
        await fetchAllData()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Impossible de générer la facture VIP.' })
    } finally {
      setProcessing(false)
    }
  }

  const openVipInvoicePaymentModal = (invoice) => {
    setSelectedVipInvoice(invoice)
    setVipInvoicePaymentData({
      amount: String(Math.max(0, Number(invoice.balance || invoice.total || 0))),
      paymentMethod: 'cash',
      paymentReference: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      note: ''
    })
    setShowVipInvoicePaymentModal(true)
  }

  const closeVipInvoicePaymentModal = () => {
    setShowVipInvoicePaymentModal(false)
    setSelectedVipInvoice(null)
    setVipInvoicePaymentData({ amount: '', paymentMethod: 'cash', paymentReference: '', paymentDate: new Date().toISOString().slice(0, 10), note: '' })
  }

  const handleSendVipReceiptToClient = async (invoice = selectedVipInvoice) => {
    if (!invoice?._id) return

    try {
      const vipBase = isAdminView ? '/api/admin/vip' : '/api/cashier/vip'
      const res = await api.post(`${vipBase}/invoices/${invoice._id}/send-receipt`)
      const whatsappUrl = res.data?.data?.whatsappUrl
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        setToast({ type: 'success', message: 'Lien du reçu prêt à être envoyé au client.' })
        return
      }
      setToast({ type: 'error', message: 'Impossible de générer le lien du reçu.' })
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Impossible d\'envoyer le reçu VIP.' })
    }
  }

  const handleCollectVipInvoicePayment = async (e) => {
    e.preventDefault()
    if (!selectedVipInvoice) return

    const amount = Number(vipInvoicePaymentData.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({ type: 'error', message: 'Montant invalide.' })
      return
    }

    setProcessing(true)
    try {
      const vipBase = isAdminView ? '/api/admin/vip' : '/api/cashier/vip'
      const res = await api.put(`${vipBase}/invoices/${selectedVipInvoice._id}/pay`, {
        amount,
        paymentMethod: vipInvoicePaymentData.paymentMethod,
        paymentReference: vipInvoicePaymentData.paymentReference,
        paymentDate: vipInvoicePaymentData.paymentDate,
        note: vipInvoicePaymentData.note
      })

      if (res.data?.success) {
        const updatedInvoice = res.data?.data
        const receipt = updatedInvoice?.receiptPath
        if (receipt) {
          const link = resolveStoredUrl(receipt)
          setInvoiceLink(link)
        }
        setSelectedVipInvoice(updatedInvoice || selectedVipInvoice)
        setToast({ type: 'success', message: 'Encaissement VIP enregistré.' })
        await fetchAllData()
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Erreur lors de l\'encaissement VIP.' })
    } finally {
      setProcessing(false)
    }
  }

  // ========== RENDU ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Facture */}
        {invoiceLink && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-blue-900">📄 Facture prête</p>
              <p className="text-sm text-blue-700">Actions: imprimer, télécharger ou envoyer au client</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPdfBlob(invoiceDownloadUrl)}
                className="px-3 py-2 bg-gray-700 text-white rounded-xl text-sm hover:bg-gray-800 transition"
              >
                Imprimer
              </button>
              <button
                onClick={() => downloadPdfBlob(invoiceDownloadUrl, 'facture.pdf')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Download size={16} />
                Télécharger PDF
              </button>
              <button
                onClick={() => {
                  if (selectedVipPreview?.clientWhatsapp) {
                    const phone = String(selectedVipPreview.clientWhatsapp).replace(/\D/g, '')
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Votre document est disponible: ${invoiceLink}`)}`, '_blank')
                  } else {
                    setToast({ type: 'error', message: 'Téléphone client indisponible pour l\'envoi.' })
                  }
                }}
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Réparations prêtes', value: stats.readyRepairs, sub: `${stats.repairRevenue.toLocaleString()} FCFA`, icon: Wrench, grad: 'from-blue-500 to-cyan-500' },
            { label: 'Échanges à encaisser', value: stats.acceptedTradeins, sub: `${stats.tradeinRevenue.toLocaleString()} FCFA`, icon: RefreshCw, grad: 'from-amber-500 to-orange-500' },
            { label: 'Téléphones vendus', value: stats.phoneSalesCount, sub: `${stats.phoneSalesRevenue.toLocaleString()} FCFA`, icon: Smartphone, grad: 'from-emerald-500 to-green-500' },
            { label: 'Contrats revendeur à encaisser', value: `${stats.resellerContractsAmount.toLocaleString()} FCFA`, sub: `${stats.resellerContractsToCollect} en attente • ${Number(resellerContractSummary.overdueCount || 0)} depasses`, icon: DollarSign, grad: 'from-indigo-500 to-blue-500' },
            { label: 'Total encaissé', value: `${stats.totalRevenue.toLocaleString()} FCFA`, sub: `${stats.totalTransactions} transactions`, icon: DollarSign, grad: 'from-purple-500 to-violet-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${s.grad}`}>
                  <s.icon size={20} className="text-white"/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="font-bold mb-4">Répartition des paiements</h3>
          {paymentMethodData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                    label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {paymentMethodData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-gray-400 text-center py-12">Aucune donnée</p>}
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-gray-400" size={20}/>
          <input
            type="text"
            placeholder="Rechercher par client, WhatsApp, produit..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3 text-gray-400"><X size={18}/></button>}
        </div>

        {/* Onglets et contenu */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="flex border-b">
            {[
              { id: 'repairs', label: 'Réparations', icon: Wrench, count: readyRepairs.length },
              { id: 'vipRepairs', label: 'Réparations VIP', icon: Wrench, count: vipRepairs.length },
              { id: 'vipInvoices', label: 'Factures VIP en attente', icon: FileText, count: vipInvoicesPending.length },
              { id: 'tradeins', label: 'Échanges', icon: RefreshCw, count: acceptedTradeins.length },
              { id: 'phones', label: 'Téléphones', icon: Smartphone, count: products.length },
              { id: 'contracts', label: 'Contrats revendeur', icon: DollarSign, count: resellerContractsPending.length },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(p => ({...p, [tab.id]: 1})) }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id ? 'text-emerald-600 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <tab.icon size={18}/>
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div>
            {/* Onglet Réparations */}
            {activeTab === 'repairs' && (filteredRepairs.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><Wrench size={48} className="mx-auto mb-2"/><p>Aucune réparation prête</p></div>
            ) : (
              <>
                <div className="divide-y">
                  {paginatedRepairs.map(r => (
                    <div key={r._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-semibold text-gray-900">{r.clientName || 'Client'}</p>
                        <p className="text-sm text-gray-500">{r.clientWhatsapp || 'WhatsApp non renseigné'}</p>
                        <p className="text-xs text-gray-400">{r.deviceModel || ''}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-emerald-600">{(r.price || 0).toLocaleString()} FCFA</span>
                        <button
                          type="button"
                          onClick={() => {
                            const basePath = isAdminView ? '/admin/cashier' : '/cashier'
                            navigate(`${basePath}/repair/${r._id}`)
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                        >
                          💰 Encaisser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage.repairs} total={totalRepairsPages} onChange={p => setCurrentPage(prev => ({...prev, repairs: p}))} />
              </>
            ))}

            {/* Onglet Réparations VIP */}
            {activeTab === 'vipRepairs' && (filteredVipRepairs.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><Wrench size={48} className="mx-auto mb-2"/><p>Aucune réparation VIP en attente</p></div>
            ) : (
              <>
                <div className="px-4 py-3 bg-blue-50 text-blue-700 text-sm border-b border-blue-100">
                  Paiements VIP à encaisser: une ligne par réparation (non facturée), avec prévisualisation avant génération de facture.
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 border-b border-gray-100 bg-gray-50/50">
                  <input
                    type="text"
                    placeholder="Filtrer client VIP"
                    value={vipFilters.client}
                    onChange={(e) => setVipFilters({ ...vipFilters, client: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    value={vipFilters.fromDate}
                    onChange={(e) => setVipFilters({ ...vipFilters, fromDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Du"
                  />
                  <input
                    type="date"
                    value={vipFilters.toDate}
                    onChange={(e) => setVipFilters({ ...vipFilters, toDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Au"
                  />
                  <select
                    value={vipFilters.status}
                    onChange={(e) => setVipFilters({ ...vipFilters, status: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="ready">Terminée</option>
                    <option value="completed">Terminée</option>
                    <option value="billable">Facturable</option>
                  </select>
                </div>
                <div className="px-4 pb-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="N° réparation"
                    value={vipFilters.repairNumber}
                    onChange={(e) => setVipFilters({ ...vipFilters, repairNumber: e.target.value })}
                    className="px-3 py-2 border rounded-lg min-w-[220px]"
                  />
                  <button
                    type="button"
                    onClick={openVipPreviewForSelection}
                    disabled={!selectedVipRepairIds.length}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Prévisualiser la sélection ({selectedVipRepairIds.length})
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Sélection</th>
                        <th className="px-3 py-2 text-left">N° Réparation</th>
                        <th className="px-3 py-2 text-left">Client VIP</th>
                        <th className="px-3 py-2 text-left">Téléphone</th>
                        <th className="px-3 py-2 text-left">IMEI</th>
                        <th className="px-3 py-2 text-left">Nature</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Technicien</th>
                        <th className="px-3 py-2 text-left">Montant</th>
                        <th className="px-3 py-2 text-left">Statut réparation</th>
                        <th className="px-3 py-2 text-left">Statut facturation</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedVipRepairs.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedVipRepairIds.includes(String(r._id))}
                              onChange={(e) => {
                                const id = String(r._id)
                                if (e.target.checked) {
                                  setSelectedVipRepairIds((prev) => [...prev, id])
                                } else {
                                  setSelectedVipRepairIds((prev) => prev.filter((item) => item !== id))
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold">{r.repairNumber || String(r._id).slice(-6).toUpperCase()}</td>
                          <td className="px-3 py-2 text-sm">{r.clientName || 'Client VIP'}</td>
                          <td className="px-3 py-2 text-sm">{r.deviceModel || '-'}</td>
                          <td className="px-3 py-2 text-sm">{r.imei || '-'}</td>
                          <td className="px-3 py-2 text-sm">{r.issueDescription || '-'}</td>
                          <td className="px-3 py-2 text-sm">{new Date(r.repairDate || r.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-2 text-sm">{r.technician?.name || '-'}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-indigo-700">{Number(r.cost || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td className="px-3 py-2 text-sm">{formatRepairStatus(r.status)}</td>
                          <td className="px-3 py-2 text-sm">{formatBillingStatus(r.billingStatus || r.vipBilling?.status)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => openVipPreview(r)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              Prévisualiser
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={currentPage.vipRepairs} total={totalVipRepairsPages} onChange={p => setCurrentPage(prev => ({...prev, vipRepairs: p}))} />
              </>
            ))}

            {/* Onglet Factures VIP en attente d'encaissement */}
            {activeTab === 'vipInvoices' && (filteredVipInvoices.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><FileText size={48} className="mx-auto mb-2"/><p>Aucune facture VIP en attente d'encaissement</p></div>
            ) : (
              <>
                <div className="divide-y">
                  {paginatedVipInvoices.map((inv) => (
                    <div key={inv._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-semibold text-gray-900">{inv.invoiceNumber || String(inv._id).slice(-6).toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Client VIP: {inv.vipClient?.name || '-'}</p>
                        <p className="text-xs text-gray-400">Date émission: {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('fr-FR')} • Réparations: {(inv.repairs || []).length} • Statut: {formatInvoiceStatus(inv.status)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-indigo-600">{Number(inv.total ?? 0).toLocaleString('fr-FR')} FCFA</span>
                        <button
                          type="button"
                          onClick={() => setSelectedVipPreview({
                            invoice: inv,
                            clientName: inv.vipClient?.name || 'Client VIP',
                            clientWhatsapp: inv.vipClient?.whatsapp || inv.vipClient?.phone || '',
                            clientPhone: inv.vipClient?.phone || '',
                            clientAddress: inv.vipClient?.metadata?.address || '',
                            vipStatus: inv.vipClient?.isActive === false ? 'Inactif' : 'Actif',
                            repairs: inv.repairs || [],
                            total: Number(inv.total || 0)
                          }) || setShowVipPreviewModal(true)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-700 text-white hover:bg-gray-800 flex items-center gap-1"
                        >
                          <Eye size={14} /> Consulter
                        </button>
                        <button
                          type="button"
                          onClick={() => openVipInvoicePaymentModal(inv)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Encaisser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage.vipInvoices} total={totalVipInvoicesPages} onChange={p => setCurrentPage(prev => ({...prev, vipInvoices: p}))} />
              </>
            ))}

            {/* Onglet Échanges */}
            {activeTab === 'tradeins' && (filteredTradeins.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><RefreshCw size={48} className="mx-auto mb-2"/><p>Aucun échange accepté</p></div>
            ) : (
              <>
                <div className="divide-y">
                  {paginatedTradeins.map(t => (
                    <div key={t._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-semibold text-gray-900">{t.clientName || 'Client'}</p>
                        <p className="text-sm text-gray-500">{t.clientWhatsapp || 'WhatsApp non renseigné'}</p>
                        <p className="text-xs text-gray-400">{t.deviceModel || ''}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-amber-600">{(t.proposedValue || 0).toLocaleString()} FCFA</span>
                        <button
                          type="button"
                          onClick={() => {
                            const basePath = isAdminView ? '/admin/cashier' : '/cashier'
                            navigate(`${basePath}/tradein/${t._id}`)
                          }}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition"
                        >
                          💰 Paiement
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage.tradeins} total={totalTradeinsPages} onChange={p => setCurrentPage(prev => ({...prev, tradeins: p}))} />
              </>
            ))}

            {/* Onglet Téléphones */}
            {activeTab === 'phones' && (filteredProducts.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><Smartphone size={48} className="mx-auto mb-2"/><p>Aucun téléphone en stock</p></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {paginatedPhones.map(item => (
                    <div key={item._id} className="border rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.brand && <p className="text-sm text-gray-500">{item.brand}</p>}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.quantity < 5 ? 'bg-orange-100 text-orange-700' : 
                          item.quantity < 10 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          Stock: {item.quantity}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 mb-4">{item.unitPrice.toLocaleString()} FCFA</p>
                      <button
                        onClick={() => {
                          setPhoneSale({
                            productId: item._id,
                            quantity: 1,
                            amount: item.unitPrice.toString(),
                            clientName: '',
                            clientWhatsapp: '',
                            paymentMethod: 'cash',
                            notes: ''
                          })
                          setShowPhoneSale(true)
                        }}
                        className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 0}
                      >
                        {item.quantity > 0 ? '📱 Vendre' : 'Rupture de stock'}
                      </button>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage.phones} total={totalPhonesPages} onChange={p => setCurrentPage(prev => ({...prev, phones: p}))} />
              </>
            ))}

            {/* Onglet Contrats revendeur */}
            {activeTab === 'contracts' && (filteredResellerContracts.length === 0 ? (
              <div className="p-16 text-center text-gray-400"><DollarSign size={48} className="mx-auto mb-2"/><p>Aucun contrat revendeur à encaisser</p></div>
            ) : (
              <>
                <div className="divide-y">
                  {paginatedContracts.map(c => (
                    <div key={c._id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-semibold text-gray-900">{c.number}</p>
                        <p className="text-sm text-gray-500">Revendeur: {c.reseller?.name || '-'}</p>
                        <p className="text-xs text-gray-400">Téléphone: {c.product?.name || '-'}</p>
                        {c.payment?.remainingMs !== null && c.payment?.remainingMs !== undefined && (
                          <p className={`text-xs mt-1 ${c.payment?.isOverdue ? 'text-red-600' : 'text-amber-700'}`}>
                            {c.payment?.isOverdue
                              ? 'Delai depasse (plus de 5h)'
                              : `Temps restant: ${Math.max(0, Math.floor(c.payment.remainingMs / 3600000))}h ${Math.max(0, Math.floor((c.payment.remainingMs % 3600000) / 60000))}m`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-indigo-600">{Number(c.payment?.amountExpected || c.saleInfo?.amount || 0).toLocaleString()} FCFA</span>
                        <button
                          type="button"
                          onClick={() => openResellerContractPaymentModal(c)}
                          disabled={processing || (c.payment?.isOverdue && !isAdminView)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                          {c.payment?.isOverdue && !isAdminView ? 'Manager requis' : 'Encaisser'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage.contracts} total={totalContractsPages} onChange={p => setCurrentPage(prev => ({...prev, contracts: p}))} />
              </>
            ))}
          </div>
        </div>
      </div>

      {showVipPreviewModal && selectedVipPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeVipPreview}>
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">{selectedVipPreview.invoice ? 'Consultation facture VIP' : 'Prévisualisation facture VIP'}</h3>
              <p className="text-sm text-gray-500">Client: {selectedVipPreview.clientName}</p>
              {selectedVipPreview.clientWhatsapp && <p className="text-xs text-gray-400">Téléphone: {selectedVipPreview.clientWhatsapp}</p>}
              {selectedVipPreview.clientAddress && <p className="text-xs text-gray-400">Adresse: {selectedVipPreview.clientAddress}</p>}
              <p className="text-xs text-gray-400">Statut VIP: {selectedVipPreview.vipStatus || 'Actif'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">N° réparation</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Téléphone</th>
                      <th className="px-3 py-2 text-left">IMEI</th>
                      <th className="px-3 py-2 text-left">Nature</th>
                      <th className="px-3 py-2 text-left">Intervention</th>
                      <th className="px-3 py-2 text-left">Technicien</th>
                      <th className="px-3 py-2 text-left">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(selectedVipPreview.repairs || []).map((row, index) => (
                      <tr key={row._id || index}>
                        <td className="px-3 py-2">{row.repairNumber || String(row.repairId || row._id || '').slice(-6).toUpperCase()}</td>
                        <td className="px-3 py-2">{new Date(row.repairDate || row.createdAt || Date.now()).toLocaleDateString('fr-FR')}</td>
                        <td className="px-3 py-2">{row.deviceModel || '-'}</td>
                        <td className="px-3 py-2">{row.imei || '-'}</td>
                        <td className="px-3 py-2">{row.issueDescription || row.description || '-'}</td>
                        <td className="px-3 py-2">{row.technicianReport || '-'}</td>
                        <td className="px-3 py-2">{row.technician?.name || row.technicianName || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-indigo-700">{Number(row.cost || row.total || 0).toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-sm text-indigo-800">Nombre total de réparations: <span className="font-bold">{(selectedVipPreview.repairs || []).length}</span></p>
                <p className="text-sm text-indigo-800">Total général: <span className="font-bold">{Number(selectedVipPreview.total || 0).toLocaleString('fr-FR')} FCFA</span></p>
                <p className="text-xs text-indigo-700 mt-1">Observation: la génération crée une créance (facture émise), sans encaissement automatique.</p>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeVipPreview} className="px-5 py-2.5 border rounded-xl">Fermer</button>
                {!selectedVipPreview.invoice && (
                  <button
                    type="button"
                    onClick={handleGenerateVipInvoiceFromPreview}
                    disabled={processing}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Générer la facture
                  </button>
                )}
                {selectedVipPreview.invoice && (
                  <button
                    type="button"
                    onClick={() => {
                      closeVipPreview()
                      openVipInvoicePaymentModal(selectedVipPreview.invoice)
                    }}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    Encaisser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showVipInvoicePaymentModal && selectedVipInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeVipInvoicePaymentModal}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Encaisser facture VIP</h3>
              <p className="text-sm text-gray-500">{selectedVipInvoice.invoiceNumber || String(selectedVipInvoice._id).slice(-6).toUpperCase()}</p>
            </div>
            {String(selectedVipInvoice.status || '').toLowerCase() === 'paid' ? (
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Facture payée. La réparation VIP associée est désormais soldée.
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Montant encaissé: <span className="font-semibold text-gray-900">{Number(selectedVipInvoice.paidAmount || selectedVipInvoice.total || 0).toLocaleString('fr-FR')} FCFA</span></p>
                  <p>Statut facture: <span className="font-semibold text-gray-900">{formatInvoiceStatus(selectedVipInvoice.status)}</span></p>
                </div>
                <div className="flex justify-end gap-3 flex-wrap">
                  <button type="button" onClick={closeVipInvoicePaymentModal} className="px-4 py-2.5 border rounded-xl">Fermer</button>
                  {getLatestVipReceiptUrl(selectedVipInvoice) && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`${API_BASE_URL}/api/invoices/receipts/vip/${selectedVipInvoice._id}`, '_blank', 'noopener,noreferrer')
                      }}
                      className="px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Download size={16} /> Télécharger le reçu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSendVipReceiptToClient(selectedVipInvoice)}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Send size={16} /> Envoyer le reçu
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleCollectVipInvoicePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Montant payé (solde à régler)</label>
                <input
                  type="number"
                  min="1"
                  value={vipInvoicePaymentData.amount}
                  readOnly
                  className="w-full px-4 py-2.5 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Mode de paiement</label>
                <select
                  value={vipInvoicePaymentData.paymentMethod}
                  onChange={e => setVipInvoicePaymentData({ ...vipInvoicePaymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl"
                >
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Monnaie mobile</option>
                  <option value="card">Carte</option>
                  <option value="transfer">Virement</option>
                  <option value="check">Chèque</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Date paiement</label>
                <input
                  type="date"
                  value={vipInvoicePaymentData.paymentDate}
                  onChange={e => setVipInvoicePaymentData({ ...vipInvoicePaymentData, paymentDate: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Référence de paiement</label>
                <input
                  type="text"
                  value={vipInvoicePaymentData.paymentReference}
                  onChange={e => setVipInvoicePaymentData({ ...vipInvoicePaymentData, paymentReference: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl"
                  placeholder="Transaction, ticket, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Note</label>
                <textarea
                  rows={2}
                  value={vipInvoicePaymentData.note}
                  onChange={e => setVipInvoicePaymentData({ ...vipInvoicePaymentData, note: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeVipInvoicePaymentModal} className="px-4 py-2.5 border rounded-xl">Annuler</button>
                <button type="submit" disabled={processing} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  Enregistrer le paiement
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {showResellerContractPaymentModal && selectedResellerContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeResellerContractPaymentModal}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Encaisser le contrat revendeur</h3>
              <p className="text-sm text-gray-500">
                {selectedResellerContract.number} - {selectedResellerContract.reseller?.name || 'Revendeur'}
              </p>
            </div>
            <form onSubmit={handleCollectResellerContract} className="p-6 space-y-4">
              {selectedResellerContract.payment?.isOverdue && (
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                  Delai de 5h depasse. Un override manager avec motif est requis.
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={resellerContractPaymentData.amount}
                  onChange={e => setResellerContractPaymentData({ ...resellerContractPaymentData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Espèces', icon: Banknote },
                    { value: 'card', label: 'Carte', icon: CreditCard },
                    { value: 'mobile_money', label: 'Monnaie mobile', icon: Smartphone },
                    { value: 'transfer', label: 'Virement', icon: Send },
                  ].map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setResellerContractPaymentData({ ...resellerContractPaymentData, paymentMethod: m.value })}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm ${
                        resellerContractPaymentData.paymentMethod === m.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <m.icon size={16} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Notes</label>
                <textarea
                  value={resellerContractPaymentData.notes}
                  onChange={e => setResellerContractPaymentData({ ...resellerContractPaymentData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {selectedResellerContract.payment?.isOverdue && isAdminView && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Motif d'override manager *</label>
                  <textarea
                    value={resellerContractPaymentData.overrideReason}
                    onChange={e => setResellerContractPaymentData({ ...resellerContractPaymentData, overrideReason: e.target.value })}
                    rows={3}
                    required
                    placeholder="Expliquez pourquoi l'encaissement est autorise apres le delai de 5h"
                    className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeResellerContractPaymentModal} className="px-5 py-2.5 border rounded-xl">Annuler</button>
                <button type="submit" disabled={processing} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                  {processing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={18} />}
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NOUVELLE VENTE */}
      {showNewSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewSale(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <h3 className="text-xl font-bold">💰 Nouvelle Vente</h3>
            </div>

            <form onSubmit={handleNewSale} className="p-6 space-y-4">
              {/* Type de vente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de vente *</label>
                <select
                  value={newSale.saleType}
                  onChange={e => setNewSale({...newSale, saleType: e.target.value, repairId: '', amountPaid: ''})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="repair">🔧 Réparation</option>
                  <option value="tradein">🔄 Échange</option>
                  <option value="phone">📱 Vente de téléphone</option>
                </select>
              </div>

              {/* RÉPARATION */}
              {newSale.saleType === 'repair' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Réparation à encaisser *</label>
                  <select
                    value={newSale.repairId}
                    onChange={e => {
                      const r = readyRepairs.find(x => x._id === e.target.value)
                      setNewSale({...newSale, repairId: e.target.value, amountPaid: (r?.price || 0).toString()})
                    }}
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {readyRepairs.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.clientName || 'Client'} – {(r.price || 0).toLocaleString()} FCFA
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ÉCHANGE */}
              {newSale.saleType === 'tradein' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Échange à encaisser *</label>
                    <select
                      value={newSale.repairId}
                      onChange={e => {
                        const t = acceptedTradeins.find(x => x._id === e.target.value)
                        setNewSale({...newSale, repairId: e.target.value, amountPaid: (t?.proposedValue || 0).toString()})
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {acceptedTradeins.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.clientName || 'Client'} – {(t.proposedValue || 0).toLocaleString()} FCFA
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-800">📱 Détails du téléphone échangé</p>
                    <input
                      type="text"
                      placeholder="Modèle du téléphone"
                      value={newSale.exchangeDeviceModel}
                      onChange={e => setNewSale({...newSale, exchangeDeviceModel: e.target.value})}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Marque"
                      value={newSale.exchangeDeviceBrand}
                      onChange={e => setNewSale({...newSale, exchangeDeviceBrand: e.target.value})}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white"
                    />
                    <select
                      value={newSale.exchangeDeviceCondition}
                      onChange={e => setNewSale({...newSale, exchangeDeviceCondition: e.target.value})}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white"
                    >
                      <option value="new">Neuf</option>
                      <option value="like-new">Comme neuf</option>
                      <option value="good">Bon état</option>
                      <option value="fair">État moyen</option>
                      <option value="poor">Mauvais état</option>
                    </select>
                    <input
                      type="text"
                      placeholder="IMEI ou N° de série"
                      value={newSale.exchangeDeviceImei}
                      onChange={e => setNewSale({...newSale, exchangeDeviceImei: e.target.value})}
                      className="w-full p-2.5 border border-amber-200 rounded-xl bg-white font-mono text-sm"
                    />
                  </div>
                </>
              )}

              {/* VENTE TÉLÉPHONE */}
              {newSale.saleType === 'phone' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone *</label>
                    <select
                      value={newSale.repairId}
                      onChange={e => {
                        const p = products.find(x => x._id === e.target.value)
                        setNewSale({...newSale, repairId: e.target.value, amountPaid: (p?.unitPrice || 0).toString(), phoneQuantity: 1})
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {products.filter(p => p.quantity > 0).map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} – {(p.unitPrice || 0).toLocaleString()} FCFA (Stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={newSale.phoneQuantity}
                      onChange={e => {
                        const qty = +e.target.value
                        const p = products.find(x => x._id === newSale.repairId)
                        setNewSale({...newSale, phoneQuantity: qty, amountPaid: ((p?.unitPrice || 0) * qty).toString()})
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp client *</label>
                    <input
                      type="text"
                      value={newSale.clientWhatsapp}
                      onChange={e => setNewSale({...newSale, clientWhatsapp: e.target.value})}
                      placeholder="+225 XX XX XX XX"
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Montant */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={newSale.amountPaid}
                  onChange={e => setNewSale({...newSale, amountPaid: e.target.value})}
                  placeholder="0"
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Méthode de paiement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Méthode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: '💵 Espèces' },
                    { value: 'card', label: '💳 Carte' },
                    { value: 'mobile_money', label: '📱 Monnaie mobile' },
                    { value: 'transfer', label: '🏦 Virement' },
                    { value: 'check', label: '🧾 Chèque' },
                  ].map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setNewSale({...newSale, paymentMethod: method.value})}
                      className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        newSale.paymentMethod === method.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newSale.notes}
                  onChange={e => setNewSale({...newSale, notes: e.target.value})}
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Notes éventuelles..."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewSale(false)}
                  className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      En cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Valider la vente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE PAIEMENT ÉCHANGE */}
      {showNewTradeinPayment && (
        <Modal title="💱 Paiement Échange" onClose={() => setShowNewTradeinPayment(false)}>
          <form onSubmit={handleNewTradeinPayment} className="space-y-4">
            <select
              value={newTradeinPayment.tradeinId}
              onChange={e => {
                const t = acceptedTradeins.find(x => x._id === e.target.value)
                setNewTradeinPayment({...newTradeinPayment, tradeinId: e.target.value, amountPaid: (t?.proposedValue || 0).toString()})
              }}
              className="w-full p-2.5 border border-gray-200 rounded-xl"
              required
            >
              <option value="">-- Sélectionner un échange --</option>
              {acceptedTradeins.map(t => (
                <option key={t._id} value={t._id}>{t.clientName} – {(t.proposedValue || 0).toLocaleString()} FCFA</option>
              ))}
            </select>
            <input
              type="number"
              value={newTradeinPayment.amountPaid}
              onChange={e => setNewTradeinPayment({...newTradeinPayment, amountPaid: e.target.value})}
              placeholder="Montant"
              className="w-full p-2.5 border border-gray-200 rounded-xl"
              required
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowNewTradeinPayment(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Valider</button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODALE VENTE TÉLÉPHONE */}
      {showPhoneSale && (
        <Modal title="📱 Vendre un téléphone" onClose={() => setShowPhoneSale(false)}>
          <form onSubmit={handleNewPhoneSale} className="space-y-4">
            <select
              value={phoneSale.productId}
              onChange={e => {
                const item = products.find(i => i._id === e.target.value)
                if (item) setPhoneSale({...phoneSale, productId: item._id, amount: (item.unitPrice * phoneSale.quantity).toString()})
              }}
              className="w-full p-2.5 border border-gray-200 rounded-xl"
              required
            >
              <option value="">-- Sélectionner --</option>
              {products.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name} - {item.unitPrice.toLocaleString()} FCFA (Stock: {item.quantity})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={phoneSale.quantity}
                  onChange={e => {
                    const q = +e.target.value
                    const item = products.find(i => i._id === phoneSale.productId)
                    setPhoneSale({...phoneSale, quantity: q, amount: item ? (item.unitPrice * q).toString() : phoneSale.amount})
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={phoneSale.amount}
                  onChange={e => setPhoneSale({...phoneSale, amount: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp client *</label>
              <input
                type="text"
                value={phoneSale.clientWhatsapp}
                onChange={e => setPhoneSale({...phoneSale, clientWhatsapp: e.target.value})}
                placeholder="+225 XX XX XX XX"
                className="w-full p-2.5 border border-gray-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Moyen de paiement</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'cash', label: '💵 Espèces' },
                  { value: 'card', label: '💳 Carte' },
                  { value: 'mobile_money', label: '📱 Monnaie mobile' },
                  { value: 'transfer', label: '🏦 Virement' },
                ].map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPhoneSale({...phoneSale, paymentMethod: method.value})}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      phoneSale.paymentMethod === method.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nom client (optionnel)</label>
              <input
                type="text"
                value={phoneSale.clientName}
                onChange={e => setPhoneSale({...phoneSale, clientName: e.target.value})}
                placeholder="Nom complet"
                className="w-full p-2.5 border border-gray-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea
                value={phoneSale.notes}
                onChange={e => setPhoneSale({...phoneSale, notes: e.target.value})}
                rows={2}
                className="w-full p-2.5 border border-gray-200 rounded-xl"
                placeholder="Notes éventuelles..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowPhoneSale(false)} className="px-5 py-2.5 border-2 border-gray-200 rounded-xl">Annuler</button>
              <button type="submit" disabled={processing} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl disabled:opacity-50 flex items-center gap-2">
                {processing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <><CheckCircle size={18} />Valider</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ========== COMPOSANTS AUXILIAIRES ==========
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50/50">
      <span className="text-sm text-gray-500">Page {page}/{total}</span>
      <div className="flex gap-2">
        <button 
          onClick={() => onChange(page - 1)} 
          disabled={page === 1} 
          className="px-3 py-1 rounded-lg border disabled:opacity-30 hover:bg-gray-100 transition"
        >
          ←
        </button>
        <button 
          onClick={() => onChange(page + 1)} 
          disabled={page === total} 
          className="px-3 py-1 rounded-lg border disabled:opacity-30 hover:bg-gray-100 transition"
        >
          →
        </button>
      </div>
    </div>
  )
}