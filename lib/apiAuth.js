import { createClient } from '@supabase/supabase-js'

export function getAuthenticatedClient(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { supabase: null, user: null, error: 'Non authentifié' }
  }

  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  return { supabase, token }
}

export async function authenticateRequest(request) {
  const { supabase, token, error } = getAuthenticatedClient(request)
  if (error) return { supabase: null, user: null, error }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { supabase: null, user: null, error: 'Non authentifié' }
  }

  return { supabase, user, error: null }
}
