// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

let browserClient = null

export function getSupabase() {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  browserClient = createClient(url, anon, {
    auth: {
      flowType: 'implicit',        // on utilise le flux hash (magic link)
      detectSessionInUrl: false,   // on gère le hash nous-mêmes dans /auth/callback
      persistSession: true,
      autoRefreshToken: true,
    }
  })
  return browserClient
}
