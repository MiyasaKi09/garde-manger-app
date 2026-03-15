import { supabase } from '@/lib/supabaseClient'

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  const headers = { ...options.headers, Authorization: `Bearer ${session.access_token}` }
  return fetch(url, { ...options, headers })
}
