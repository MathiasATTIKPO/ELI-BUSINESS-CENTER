import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Eye, EyeOff, KeyRound, Lock, LogOut, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import TokenManager from '../../services/tokenManager'
import Toast from '../../components/Toast'
import { useAuth } from '../../hooks/useAuth'
import { useTechnicianAuth } from '../../hooks/useTechnicianAuth'
import { useCashierAuth } from '../../hooks/useCashierAuth'
import { useResellerAuth } from '../../hooks/useResellerAuth'
import { useVIPAuth } from '../../hooks/useVIPAuth'

const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    home: '/admin/dashboard',
    login: '/admin/login',
    gradient: 'from-blue-700 via-indigo-800 to-slate-900',
    button: 'from-blue-600 to-indigo-600',
  },
  technician: {
    label: 'Technicien',
    home: '/technician/dashboard',
    login: '/technician/login',
    gradient: 'from-purple-700 via-violet-800 to-slate-900',
    button: 'from-purple-600 to-violet-600',
  },
  cashier: {
    label: 'Caissier',
    home: '/cashier/sales',
    login: '/cashier/login',
    gradient: 'from-emerald-700 via-green-800 to-slate-900',
    button: 'from-emerald-600 to-green-600',
  },
  reseller: {
    label: 'Revendeur',
    home: '/reseller/dashboard',
    login: '/reseller/login',
    gradient: 'from-emerald-700 via-teal-800 to-slate-900',
    button: 'from-emerald-600 to-teal-600',
  },
  vip: {
    label: 'Client VIP',
    home: '/vip/dashboard',
    login: '/vip/login',
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
    button: 'from-amber-600 to-orange-600',
  },
}

export default function ChangePassword({ role }) {
  const navigate = useNavigate()
  const adminAuth = useAuth()
  const technicianAuth = useTechnicianAuth()
  const cashierAuth = useCashierAuth()
  const resellerAuth = useResellerAuth()
  const vipAuth = useVIPAuth()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin

  const updateSession = (user, token) => {
    if (role === 'admin') adminAuth.login(user, token, 'admin')
    else if (role === 'technician') technicianAuth.login(user, token, 'technician')
    else if (role === 'cashier') cashierAuth.login(user, token, 'cashier')
    else if (role === 'reseller') resellerAuth.login(user, token, 'reseller')
    else if (role === 'vip') vipAuth.login(user, token, 'vip')
  }

  const logout = () => {
    if (role === 'admin') adminAuth.logout('admin')
    else if (role === 'technician') technicianAuth.logout()
    else if (role === 'cashier') cashierAuth.logout()
    else if (role === 'reseller') resellerAuth.logout()
    else if (role === 'vip') vipAuth.logout()
    navigate(config.login, { replace: true })
  }

  const submit = async (event) => {
    event.preventDefault()
    setToast(null)

    if (newPassword.length < 8) {
      setToast({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (newPassword !== confirmation) {
      setToast({ type: 'error', message: 'La confirmation ne correspond pas au nouveau mot de passe.' })
      return
    }
    if (oldPassword === newPassword) {
      setToast({ type: 'error', message: 'Choisissez un mot de passe différent du mot de passe actuel.' })
      return
    }

    const token = TokenManager.getTokenByRole(role)
    if (!token) {
      navigate(config.login, { replace: true })
      return
    }

    setLoading(true)
    try {
      const response = await api.post(
        '/api/account/change-password',
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const user = response.data?.data?.user
      const refreshedToken = response.data?.data?.token
      if (!user || !refreshedToken) {
        throw new Error('Réponse de session incomplète.')
      }

      updateSession(user, refreshedToken)
      setToast({ type: 'success', message: 'Mot de passe modifié. Redirection en cours…' })
      setTimeout(() => navigate(config.home, { replace: true }), 700)
    } catch (error) {
      setToast({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Impossible de modifier le mot de passe.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex min-h-screen min-h-[100dvh] items-start justify-center overflow-y-auto bg-gradient-to-br px-4 py-6 sm:items-center sm:py-8 ${config.gradient}`}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-7 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${config.button} shadow-lg`}>
            <KeyRound className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-slate-600">
            {config.label} · Cette étape est obligatoire avant d’accéder à votre espace.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck className="mt-0.5 shrink-0" size={19} />
          <p>Utilisez au moins 8 caractères et choisissez un mot de passe différent du mot de passe temporaire.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor={`${role}-current-password`} className="mb-2 block text-sm font-semibold text-slate-700">Mot de passe actuel</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id={`${role}-current-password`}
                name="oldPassword"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((value) => !value)}
                className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Afficher ou masquer le mot de passe actuel"
              >
                {showOldPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`${role}-new-password`} className="mb-2 block text-sm font-semibold text-slate-700">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id={`${role}-new-password`}
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-1 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Afficher ou masquer le nouveau mot de passe"
              >
                {showNewPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={`${role}-confirm-password`} className="mb-2 block text-sm font-semibold text-slate-700">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id={`${role}-confirm-password`}
                name="confirmation"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-r ${config.button} py-3.5 font-bold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? 'Modification en cours…' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="mt-5 flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-red-600"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
