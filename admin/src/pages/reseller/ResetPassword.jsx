import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function ResellerReset() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/reseller/reset', { token, newPassword })
      setMessage({ type: 'success', text: res.data.message })
      setTimeout(() => navigate('/reseller/login'), 1500)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      <h2 className="text-xl font-bold mb-4">Réinitialisation mot de passe - Revendeur</h2>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Nouveau mot de passe" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="input" type="password" />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Traitement...' : 'Réinitialiser'}</button>
      </form>
    </div>
  )
}
