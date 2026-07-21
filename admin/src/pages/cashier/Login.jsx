import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCashierAuth } from '../../hooks/useCashierAuth'
import { 
  CreditCard, Mail, Lock, ArrowRight, Shield, Wrench,
  Eye, EyeOff, Star, DollarSign
} from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function CashierLogin() {
  const navigate = useNavigate()
  const { login } = useCashierAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await api.post('/api/cashier/login', {
      email,
      password,
    })

    if (response.data.success) {
      login(response.data.data.user, response.data.data.token, 'cashier')  // ← Ajouter 'cashier'
      setToast({ type: 'success', message: 'Connexion réussie ! Redirection...' })
      setTimeout(() => navigate('/cashier/sales'), 1000)
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la connexion'
    setToast({ type: 'error', message })
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-900 to-emerald-900 flex items-center justify-center p-4">
      {/* Cercles décoratifs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 animate-fadeIn">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-transform duration-200">
              <CreditCard className="text-white" size={36} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <DollarSign size={14} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            ELI BUSINESS CENTER
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-300"></div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
              <CreditCard size={14} className="text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">Caissier</p>
            </div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-300"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-emerald-600" />
              Adresse email
            </label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="caissier@elibusiness.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock size={16} className="text-emerald-600" />
              Mot de passe
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Connexion en cours...
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Autres espaces
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
            >
              <Shield size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700">Administrateur</span>
            </button>
            <button
              onClick={() => navigate('/technician/login')}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
            >
              <Wrench size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700">Technicien</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}