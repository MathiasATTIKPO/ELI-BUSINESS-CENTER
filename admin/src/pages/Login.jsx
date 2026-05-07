import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Toast from '../components/Toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/api/admin/login', {
        email,
        password,
      })

      if (response.data.success) {
        console.log('Login response data:', response.data)
        console.log('User data:', response.data.data.user)
        console.log('Token:', response.data.data.token ? 'present' : 'missing')
        login(response.data.data.user, response.data.data.token)
        setToast({ type: 'success', message: 'Connexion réussie !' })
        setTimeout(() => navigate('/admin/dashboard'), 1000)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la connexion'
      setToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center p-4">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">Admin</h1>
        <p className="text-gray-600 text-center mb-6">ELI BUSINESS CENTER</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-base"
              placeholder="admin@admin.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

       {/*  <p className="text-center text-gray-500 text-sm mt-6">
          Identifiants : admin@elibusiness.com / password123
        </p> */}


         </div>
         <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/technician/login')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Accès technicien
          </button>
           </div>
         <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/cashier/login')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Accès cassier
          </button>
      </div>
    </div>
  )
}
