import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import { 
  Wrench, Mail, Lock, ArrowRight, Shield, CreditCard,
  Eye, EyeOff, Star, Zap
} from 'lucide-react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianLogin() {
  const navigate = useNavigate()
  const { login } = useTechnicianAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

 const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await api.post('/api/technician/login', {
      email,
      password,
    })

    if (response.data.success) {
      login(response.data.data.user, response.data.data.token, 'technician')  // ← Ajouter 'technician'
      setToast({ type: 'success', message: 'Connexion réussie ! Redirection...' })
      setTimeout(() => navigate('/technician/dashboard'), 1000)
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Erreur lors de la connexion'
    setToast({ type: 'error', message })
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-violet-900 to-purple-900 flex items-center justify-center p-4">
      {/* Cercles décoratifs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 animate-fadeIn">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 transform hover:scale-105 transition-transform duration-200">
              <Wrench className="text-white" size={36} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Zap size={14} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            ELI BUSINESS CENTER
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-300"></div>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full">
              <Wrench size={14} className="text-purple-600" />
              <p className="text-sm font-medium text-purple-700">Technicien</p>
            </div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-purple-300"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-purple-600" />
              Adresse email
            </label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="technicien@elibusiness.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lock size={16} className="text-purple-600" />
              Mot de passe
            </label>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3.5 rounded-xl font-bold hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
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
              onClick={() => navigate('/cashier/login')}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 group"
            >
              <CreditCard size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-emerald-700">Caissier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}