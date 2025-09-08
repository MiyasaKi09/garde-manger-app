'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const supabase = getSupabase()

  const [status, setStatus] = useState('Restauration de session…')
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      try {
        if (!supabase) {
          setError("Supabase non configuré (env manquantes).")
          return
        }

        // 1) Le hash doit contenir access_token/refresh_token
        const hash = window.location.hash
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
          setError('Aucun jeton trouvé dans cette URL.')
          return
        }

        // 2) On configure la session Supabase
        const { error: err } = await supabase.auth.setSession({ access_token, refresh_token })
        if (err) {
          setError(err.message)
          return
        }

        setStatus('Session restaurée ✔')
        // 3) Redirection finale
        const redirect = sp.get('redirect') || '/'
        router.replace(redirect)
      } catch (e) {
        setError(e.message || String(e))
      }
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <h1>Connexion</h1>
      {error ? (
        <div style={{marginTop:12, padding:12, background:'#fee2e2', border:'1px solid #ef4444', borderRadius:8}}>
          <div style={{fontWeight:600, marginBottom:6}}>Une erreur s’est produite</div>
          <div style={{whiteSpace:'pre-wrap'}}>{error}</div>
          <div style={{marginTop:12}}>
            <Link href="/login">Revenir à la connexion</Link>
          </div>
        </div>
      ) : (
        <p style={{marginTop:12}}>{status}</p>
      )}
    </main>
  )
}
