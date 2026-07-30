import React, { useState } from 'react'
import api from '../../services/api'
import Toast from '../../components/Toast'
import RecoveryCard from '../../components/auth/RecoveryCard'

export default function VIPForgot() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/api/vip/forgot', { phone: phone.trim() })
      setMessage({ type: 'success', text: res.data.message || 'Token envoyé' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur' })
    } finally { setLoading(false) }
  }

  return (
    <RecoveryCard
      role="vip"
      title="Mot de passe oublié"
      subtitle="Indiquez le numéro associé à votre compte VIP."
      backTo="/vip/login"
    >
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      {(variant) => (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="vip-recovery-phone" className="label-base">Téléphone</label>
            <input
              id="vip-recovery-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+228 XX XX XX XX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`input-base ${variant.focus}`}
              required
            />
          </div>
          <button
            type="submit"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r px-4 font-bold text-white transition disabled:opacity-60 ${variant.button}`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Envoi…' : 'Envoyer le code'}
          </button>
        </form>
      )}
    </RecoveryCard>
  )
}
