// lib/supabaseClient.js
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) return null

  // Flux implicit/hash côté client
  return createBrowserClient(url, anon, {
    auth: {
      flowType: 'implicit',          // important: pas "pkce"
      detectSessionInUrl: false      // on gère le hash nous-mêmes dans /auth/callback
    }
  })
}
