import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Wrench, RefreshCw, Smartphone, DollarSign,
  Search, X, CheckCircle, Download
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts'
import { useCashierAuth } from '../../context/CashierAuthContext'
import api, { API_BASE_URL } from '../../services/api'
import Toast from '../../components/Toast'
import { useLocation, useNavigate, Link } from 'react-router-dom'

export default function CashierSales() {
  // États principaux
  const [repairs, setRepairs] = useState([])
  const [tradeins, setTradeins] = useState([])
  const [phoneSales, setPhoneSales] = useState([])
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [invoiceLink, setInvoiceLink] = useState('')

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

  // UI : onglets, recherche, pagination
  const [activeTab, setActiveTab] = useState('repairs')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState({ repairs: 1, tradeins: 1, phones: 1 })
  const [processing, setProcessing] = useState(false)
  const itemsPerPage = 6

  const location = useLocation()
  const navigate = useNavigate()
  const isAdminView = location.pathname.startsWith('/admin/cashier')

  // ========== CHARGEMENT DES DONNÉES ==========
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const base = isAdminView ? '/api/admin' : '/api/cashier'
      const [repairsRes, tradeinsRes, productsRes, salesRes] = await Promise.all([
        api.get(`${base}/repairs`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/tradeins`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/products`).catch(() => ({ data: { data: [] } })),
        api.get(`${base}/sales`).catch(() => ({ data: { data: [] } }))
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
    repairs.filter(r => r.status === 'completed' || r.status === 'ready'),
    [repairs]
  )

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
    const totalRevenue = allPaidPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    
    return {
      readyRepairs: readyRepairs.length,
      acceptedTradeins: acceptedTradeins.length,
      phoneSalesCount: phoneSales.length,
      phoneSalesRevenue,
      repairRevenue,
      tradeinRevenue,
      totalRevenue,
      totalTransactions: allPaidPayments.length
    }
  }, [readyRepairs, acceptedTradeins, phoneSales, repairs, tradeins, allPaidPayments])

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
  const filteredTradeins = useMemo(() => filterByTerm(acceptedTradeins, ['clientName', 'clientWhatsapp']), [acceptedTradeins, searchTerm])
  const filteredProducts = useMemo(() => filterByTerm(products, ['name', 'brand']), [products, searchTerm])

  const paginatedRepairs = filteredRepairs.slice((currentPage.repairs - 1) * itemsPerPage, currentPage.repairs * itemsPerPage)
  const paginatedTradeins = filteredTradeins.slice((currentPage.tradeins - 1) * itemsPerPage, currentPage.tradeins * itemsPerPage)
  const paginatedPhones = filteredProducts.slice((currentPage.phones - 1) * itemsPerPage, currentPage.phones * itemsPerPage)

  const totalRepairsPages = Math.ceil(filteredRepairs.length / itemsPerPage)
  const totalTradeinsPages = Math.ceil(filteredTradeins.length / itemsPerPage)
  const totalPhonesPages = Math.ceil(filteredProducts.length / itemsPerPage)

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
      if (pdf) {
        setInvoiceLink(pdf.startsWith('http') ? pdf : `${API_BASE_URL}${pdf}`)
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
              <p className="text-sm text-blue-700">Cliquez sur le bouton pour télécharger</p>
            </div>
            <button 
              onClick={() => window.open(invoiceLink, '_blank')} 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Download size={16} />
              Télécharger
            </button>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Réparations prêtes', value: stats.readyRepairs, sub: `${stats.repairRevenue.toLocaleString()} FCFA`, icon: Wrench, grad: 'from-blue-500 to-cyan-500' },
            { label: 'Échanges à encaisser', value: stats.acceptedTradeins, sub: `${stats.tradeinRevenue.toLocaleString()} FCFA`, icon: RefreshCw, grad: 'from-amber-500 to-orange-500' },
            { label: 'Téléphones vendus', value: stats.phoneSalesCount, sub: `${stats.phoneSalesRevenue.toLocaleString()} FCFA`, icon: Smartphone, grad: 'from-emerald-500 to-green-500' },
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
              { id: 'tradeins', label: 'Échanges', icon: RefreshCw, count: acceptedTradeins.length },
              { id: 'phones', label: 'Téléphones', icon: Smartphone, count: products.length },
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
          </div>
        </div>
      </div>

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
                    { value: 'mobile_money', label: '📱 Mobile Money' },
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
                  { value: 'mobile_money', label: '📱 Mobile Money' },
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