import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useResellerAuth } from '../../hooks/useResellerAuth'
import Toast from '../../components/Toast'

export default function ResellerChangePassword() {
  const { user } = useResellerAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/reseller/change-password', { oldPassword, newPassword })
      setMessage({ type: 'success', text: res.data.message })
      setTimeout(() => navigate('/reseller/dashboard'), 1200)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      <h2 className="text-xl font-bold mb-4">Changer le mot de passe - Revendeur</h2>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Ancien mot de passe" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} className="input" type="password" />
        <input placeholder="Nouveau mot de passe" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="input" type="password" />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Traitement...' : 'Changer le mot de passe'}</button>
      </form>
    </div>
  )
}
