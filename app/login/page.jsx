'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Email hardcodé — app perso, on simplifie
const ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_LOGIN_EMAIL || 'julien@myko.app'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: ACCOUNT_EMAIL,
        password,
      })

      if (error) {
        setError('Mauvais mot de passe')
      } else {
        router.push('/')
      }
    } catch {
      setError('Erreur de connexion')
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

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={S.input}
            autoFocus
            required
          />
          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? '...' : 'Entrer'}
          </button>
        </form>
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
    fontFamily: "'Crimson Text', Georgia, serif",
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
}
