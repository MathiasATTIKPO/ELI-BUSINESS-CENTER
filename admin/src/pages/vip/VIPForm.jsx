import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  Lock,
  Wallet,
  Calendar,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  XCircle,
  ClipboardList
} from 'lucide-react'
import Toast from '../../components/Toast'
import api from '../../services/api'

export default function VIPForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const existingVIP = location.state?.vip

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    monthlyLimit: 0,
    billingCycleDay: 1,
    notes: '',
    isActive: true,
    password: ''
  })

  const [vipMeta, setVipMeta] = useState({
    repairsCount: 0,
    invoicesCount: 0,
    billedAmount: 0
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')

  const isEditing = Boolean(id)

  useEffect(() => {
    const hydrateForm = (vip) => {
      setFormData({
        name: vip.name || '',
        phone: vip.phone || '',
        whatsapp: vip.whatsapp || '',
        email: vip.email || '',
        monthlyLimit: vip.monthlyLimit || 0,
        billingCycleDay: vip.billingCycleDay || 1,
        notes: vip.notes || '',
        isActive: vip.isActive !== false,
        password: ''
      })
    }

    const fetchVIP = async () => {
      if (!isEditing) return
      try {
        setLoading(true)
        const [vipRes, repairsRes, invoicesRes] = await Promise.all([
          api.get(`/api/admin/vips/${id}`),
          api.get('/api/admin/vips/repairs').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/vips/invoices').catch(() => ({ data: { data: [] } }))
        ])

        if (vipRes.data.success) {
          const vip = vipRes.data.data || {}
          hydrateForm(vip)

          const repairs = (repairsRes.data.data || []).filter((r) => {
            const clientId = typeof r.vipClient === 'object' ? r.vipClient?._id : r.vipClient
            return clientId === id
          })

          const invoices = (invoicesRes.data.data || []).filter((inv) => {
            const clientId = typeof inv.vipClient === 'object' ? inv.vipClient?._id : inv.vipClient
            return clientId === id
          })

          setVipMeta({
            repairsCount: repairs.length,
            invoicesCount: invoices.length,
            billedAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
          })
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de charger le client VIP')
      } finally {
        setLoading(false)
      }
    }

    if (isEditing && existingVIP) {
      hydrateForm(existingVIP)
      return
    }

    fetchVIP()
  }, [id, existingVIP, isEditing])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.phone || !formData.email) {
      setError('Les champs nom, téléphone et email sont obligatoires')
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      const payload = { ...formData }
      if (!payload.password) delete payload.password

      const endpoint = isEditing
        ? `/api/admin/vips/${id}`
        : '/api/admin/vips'
      const method = isEditing ? 'put' : 'post'

      const response = await api[method](endpoint, payload)

      if (response.data.success) {
        if (!isEditing && response.data.generatedPassword) {
          setGeneratedPassword(response.data.generatedPassword)
          setSuccess('Client VIP créé avec succès. Communiquez le mot de passe temporaire au client.')
        } else {
          setSuccess(isEditing ? 'Client VIP mis à jour' : 'Client VIP créé avec succès')
          setGeneratedPassword('')
          setTimeout(() => navigate('/admin/vips'), 1500)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 space-y-6">
      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess('')} />}

      {generatedPassword && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-amber-800 mb-2">Mot de passe temporaire généré</h3>
          <p className="text-sm text-amber-700 mb-3">Communiquez ce mot de passe au client VIP. Il devra le changer à la première connexion.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="px-4 py-2 bg-white border border-amber-200 rounded-lg font-mono text-amber-900 text-sm">
              {generatedPassword}
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(generatedPassword)
                  setSuccess('Mot de passe temporaire copié.')
                } catch (_) {
                  setError('Impossible de copier automatiquement le mot de passe.')
                }
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              Copier
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/vips')}
              className="px-4 py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/vips')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group mb-3"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux clients VIP</span>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {isEditing ? 'Modifier le client VIP' : 'Nouveau client VIP'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing
              ? 'Modifiez les informations et paramètres du client VIP'
              : 'Ajoutez un nouveau client bénéficiant du programme VIP'}
          </p>
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl">
            <UserCheck size={16} />
            <span className="text-sm font-medium">Mode édition</span>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Réparations VIP</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{vipMeta.repairsCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Factures</p>
            <p className="text-xl font-bold text-amber-700 mt-1">{vipMeta.invoicesCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Total facturé</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{vipMeta.billedAmount.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Carte Informations Personnelles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Informations Personnelles</h2>
                <p className="text-sm text-gray-500">Coordonnées du client VIP</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User size={16} className="text-amber-600" />
                  Nom complet
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Jean Dupont"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <User size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone size={16} className="text-amber-600" />
                  Téléphone
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <Phone size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone size={16} className="text-green-600" />
                  WhatsApp
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-300 transition-all duration-200"
                  />
                  <Phone size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail size={16} className="text-amber-600" />
                  Adresse email
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jean@example.com"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-300 transition-all duration-200"
                    required
                  />
                  <Mail size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Paramètres VIP */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Paramètres VIP</h2>
                <p className="text-sm text-gray-500">Configuration du compte et du cycle de facturation</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Limite mensuelle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Wallet size={16} className="text-orange-600" />
                  Limite mensuelle (FCFA)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    name="monthlyLimit"
                    value={formData.monthlyLimit}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300 transition-all duration-200"
                  />
                  <Wallet size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Montant maximum de réparations autorisé par mois
                </p>
              </div>

              {/* Jour de cycle de facturation */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-orange-600" />
                  Jour du cycle de facturation
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    name="billingCycleDay"
                    value={formData.billingCycleDay}
                    onChange={handleChange}
                    placeholder="1"
                    min="1"
                    max="31"
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-300 transition-all duration-200"
                  />
                  <Calendar size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Jour du mois où la facture est générée (ex: 1 = 1er du mois)
                </p>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Lock size={16} className="text-amber-600" />
                  {isEditing ? 'Nouveau mot de passe' : 'Mot de passe (optionnel)'}
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-300 transition-all duration-200"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isEditing && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Si laissé vide, un mot de passe temporaire sera généré automatiquement
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ClipboardList size={16} className="text-amber-600" />
                  Notes internes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Informations complémentaires sur ce client VIP"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 hover:border-gray-300 transition-all duration-200 resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-r ${
                  formData.isActive ? 'from-emerald-500 to-green-500' : 'from-red-500 to-rose-500'
                }`}>
                  {formData.isActive ? <CheckCircle size={20} className="text-white" /> : <XCircle size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Statut du compte</h2>
                  <p className="text-sm text-gray-500">Activez ou désactivez l'accès du client VIP</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: true }))}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                  formData.isActive
                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                  <CheckCircle size={18} />
                  Compte actif
                </div>
                <p className="text-sm text-gray-600">Le client VIP peut se connecter et accéder à son espace.</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: false }))}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                  !formData.isActive
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <XCircle size={18} />
                  Compte inactif
                </div>
                <p className="text-sm text-gray-600">Le client VIP ne peut plus se connecter tant que ce statut est inactif.</p>
              </button>
            </div>
          </div>
        )}

        {/* Barre d'actions collante */}
        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 shadow-lg">
          <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/vips')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <X size={18} />
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Mettre à jour le client VIP' : 'Créer le client VIP'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}