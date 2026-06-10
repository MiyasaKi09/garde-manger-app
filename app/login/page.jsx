'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_LOGIN_EMAIL || ''

/**
 * Connexion principale : email + mot de passe (rapide, multi-appareils).
 * Secours : lien magique par email, et « mot de passe oublié » qui permet
 * aussi de DÉFINIR un premier mot de passe sur un compte créé par magic link.
 * La session est stockée en cookies → reconnue par le middleware et le serveur,
 * et persiste indépendamment sur chaque appareil.
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
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🥬</div>
        <h1 style={S.title}>Myko</h1>

        {error && <p style={S.error}>{error}</p>}
        {info && <p style={S.info}>{info}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            style={S.input}
            autoComplete="username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={S.input}
            autoComplete="current-password"
            autoFocus={!!ACCOUNT_EMAIL}
            required
          />
          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? '…' : 'Entrer'}
          </button>
        </form>

        <div style={S.links}>
          <button type="button" style={S.link} onClick={handleForgotPassword} disabled={loading}>
            Mot de passe oublié ?
          </button>
          <span style={S.sep}>·</span>
          <button type="button" style={S.link} onClick={handleMagicLink} disabled={loading}>
            Lien magique
          </button>
        </div>
      </div>
    </div>
  )
}

const S = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 100px)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 24,
    padding: '40px 28px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: {
    fontFamily: 'var(--font-editorial)',
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    marginBottom: 28,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 12px',
    background: 'rgba(220,38,38,0.06)',
    borderRadius: 10,
  },
  info: {
    color: '#15803d',
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 12px',
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 10,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 14,
    fontSize: 16,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
  },
  links: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--ink, #1f281f)',
    opacity: 0.7,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'inherit',
    padding: 0,
  },
  sep: { opacity: 0.4, fontSize: 13 },
}
