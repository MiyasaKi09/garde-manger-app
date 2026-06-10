'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.title}>Nouveau mot de passe</h1>
        <p style={S.lede}>Il servira sur tous vos appareils.</p>
        {error && <p style={S.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (8+ caractères)"
            style={S.input}
            autoComplete="new-password"
            autoFocus
            required
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmer le mot de passe"
            style={S.input}
            autoComplete="new-password"
            required
          />
          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? '…' : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}

const S = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 100px)', padding: 24 },
  card: {
    width: '100%', maxWidth: 340, textAlign: 'center',
    background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 24, padding: '36px 28px', border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  title: { fontFamily: 'var(--font-editorial)', fontSize: 24, fontWeight: 600, color: 'var(--ink, #1f281f)', marginBottom: 6 },
  lede: { fontSize: 13, opacity: 0.7, marginBottom: 20 },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.06)', borderRadius: 10 },
  input: {
    width: '100%', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
    fontSize: 16, fontFamily: 'inherit', background: 'rgba(255,255,255,0.7)', textAlign: 'center',
    marginBottom: 12, boxSizing: 'border-box', outline: 'none',
  },
  btn: {
    width: '100%', padding: '14px', border: 'none', borderRadius: 14,
    background: 'linear-gradient(135deg, #16a34a, #059669)', color: 'white',
    fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
  },
}
