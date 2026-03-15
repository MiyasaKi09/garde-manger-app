import { supabase } from '@/lib/supabaseClient'

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  // If we have a session, send the Bearer token
  if (session?.access_token) {
    const headers = { ...options.headers, Authorization: `Bearer ${session.access_token}` }
    return fetch(url, { ...options, headers })
  }

  // No localStorage session — call without token, let server try cookies
  return fetch(url, { ...options, credentials: 'include' })
}
