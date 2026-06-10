'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/app/login/login.css'

/**
 * Définition d'un nouveau mot de passe, après un lien « Mot de passe oublié »
 * (le callback a déjà échangé le code → on arrive ici avec une session active).
 * Sert aussi de première définition pour un compte créé par magic link.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login?error=reset_expired')
      else setReady(true)
    })
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('8 caractères minimum')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Sécurité</p>
        <h1 className="auth-title">Nouveau mot de passe</h1>
        <div className="auth-rule" />
        <p className="auth-lede">Il servira sur tous vos appareils.</p>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field-l">Nouveau mot de passe (8+ caractères)</span>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-field-l">Confirmer</span>
            <input
              type="password"
              className="auth-input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '…' : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}
