import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Toast from '../../components/Toast'
import RecoveryCard from '../../components/auth/RecoveryCard'

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
    <RecoveryCard
      role="reseller"
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe d’au moins 8 caractères."
      backTo="/reseller/login"
    >
      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
      {(variant) => (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="reseller-new-password" className="label-base">Nouveau mot de passe</label>
            <input
              id="reseller-new-password"
              name="newPassword"
              placeholder="Au moins 8 caractères"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={`input-base ${variant.focus}`}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r px-4 font-bold text-white transition disabled:opacity-60 ${variant.button}`}
            disabled={loading || !token}
            aria-busy={loading}
          >
            {loading ? 'Traitement…' : 'Réinitialiser'}
          </button>
          {!token ? <p className="text-sm text-red-600">Le lien de réinitialisation est incomplet ou invalide.</p> : null}
        </form>
      )}
    </RecoveryCard>
  )
}
