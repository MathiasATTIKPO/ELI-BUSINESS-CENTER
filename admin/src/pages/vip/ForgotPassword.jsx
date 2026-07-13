import React, { useState } from 'react'
import api from '../../services/api'
import Toast from '../../components/Toast'

export default function VIPForgot() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/vip/forgot', { phone })
      setMessage({ type: 'success', text: res.data.message || 'Token envoyé' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      <h2 className="text-xl font-bold mb-4">Réinitialiser mot de passe - VIP</h2>
      <form onSubmit={submit} className="space-y-4">
        <input placeholder="Téléphone" value={phone} onChange={e=>setPhone(e.target.value)} className="input" />
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le code'}</button>
      </form>
    </div>
  )
}
