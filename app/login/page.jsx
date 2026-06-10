'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import './login.css'

const ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_LOGIN_EMAIL || ''

/**
 * Connexion principale : email + mot de passe (rapide, multi-appareils).
 * Secours : lien magique, et « mot de passe oublié » qui permet aussi de
 * DÉFINIR un premier mot de passe sur un compte créé par magic link.
 * Session en cookies → reconnue par le middleware/serveur, persistante
 * indépendamment sur chaque appareil.
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState(ACCOUNT_EMAIL)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          /invalid login credentials/i.test(error.message)
            ? 'Email ou mot de passe incorrect. Si le compte a été créé par lien magique, utilisez « Mot de passe oublié » pour en définir un.'
            : error.message
        )
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) { setError('Renseignez votre email d\'abord'); return }
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setInfo('Lien magique envoyé — vérifiez votre boîte mail.')
    } catch {
      setError('Erreur lors de l\'envoi du lien')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Renseignez votre email d\'abord'); return }
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/reset`,
      })
      if (error) setError(error.message)
      else setInfo('Email envoyé — suivez le lien pour définir votre mot de passe.')
    } catch {
      setError('Erreur lors de l\'envoi de l\'email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Réseau mycorhizien</p>
        <h1 className="auth-title">Myko</h1>
        <div className="auth-rule" />
        <p className="auth-lede">Cultivez les connexions entre cuisine, garde-manger et potager.</p>

        {error && <p className="auth-error" role="alert">{error}</p>}
        {info && <p className="auth-info" role="status">{info}</p>}

        <form onSubmit={handleLogin}>
          <label className="auth-field">
            <span className="auth-field-l">Email</span>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-field-l">Mot de passe</span>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus={!!ACCOUNT_EMAIL}
              required
            />
          </label>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '…' : 'Entrer'}
          </button>
        </form>

        <div className="auth-links">
          <button type="button" className="auth-link" onClick={handleForgotPassword} disabled={loading}>
            Mot de passe oublié ?
          </button>
          <span className="auth-sep">·</span>
          <button type="button" className="auth-link" onClick={handleMagicLink} disabled={loading}>
            Lien magique
          </button>
        </div>
      </div>
    </div>
  )
}
