import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTechnicianAuth } from '../../context/TechnicianAuthContext'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function TechnicianLogin() {
  const navigate = useNavigate()
  const { login } = useTechnicianAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/api/technician/login', {
        email,
        password,
      })

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token)
        setToast({ type: 'success', message: 'Connexion réussie !' })
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
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center p-4">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-primary mb-2 text-center">Espace Technicien</h1>
        <p className="text-gray-600 text-center mb-6">ELI BUSINESS CENTER</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="technicien@elibusiness.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/cashier/login')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Accès technicien
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Accès administrateur
          </button>
        </div>
         </div>
    </div>
  )
}