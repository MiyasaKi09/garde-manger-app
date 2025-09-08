'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabaseClient'

const ALLOWED = ['julenglet@gmail.com', 'zoefhebert@gmail.com']

export default function LoginPage() {
  const supabase = getSupabase()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/')

  useEffect(() => {
    const url = new URL(window.location.href)
    setRedirectTo(url.searchParams.get('redirect') || '/')
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!supabase) {
      setError("Supabase non configuré (variables d'env manquantes).")
      return
    }

    const emailNorm = (email || '').trim().toLowerCase()
    if (!ALLOWED.includes(emailNorm)) {
      setError("Cet email n'est pas autorisé.")
      return
    }

    const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const { error: err } = await supabase.auth.signInWithOtp({
      email: emailNorm,
      options: {
        emailRedirectTo,       // redirige vers /auth/callback (hash tokens)
        shouldCreateUser: true
      }
    })
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: '0 auto' }}>
      <h1>Connexion</h1>

      {!supabase && (
        <div style={{marginTop:12, padding:12, background:'#fee2e2', border:'1px solid #ef4444', borderRadius:8}}>
          <strong>Erreur :</strong> Supabase non configuré.
          Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
        </div>
      )}

      {sent ? (
        <p style={{marginTop:12}}>Un lien a été envoyé à <b>{email}</b>. Ouvre-le sur cet appareil.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <input
            className="input"
            type="email"
            required
            placeholder="email@exemple.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={!supabase}>
            Recevoir un lien
          </button>
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
          <div style={{ fontSize:12, opacity:.7, marginTop:6 }}>
            Emails autorisés : {ALLOWED.join(', ')}
          </div>
        </form>
      )}

      <div style={{marginTop:16}}>
        <Link href="/">← Revenir à l’accueil</Link>
      </div>
    </main>
  )
}
