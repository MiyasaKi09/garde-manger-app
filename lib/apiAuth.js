import { createClient } from '@supabase/supabase-js'

export async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('[Auth] Pas de header Authorization. Headers:', Object.fromEntries(request.headers.entries()))
    return { supabase: null, user: null, error: 'Non authentifié (pas de token)' }
  }

  const token = authHeader.split(' ')[1]
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[Auth] Variables Supabase manquantes:', { hasUrl: !!url, hasKey: !!key })
    return { supabase: null, user: null, error: 'Configuration serveur manquante' }
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    console.error('[Auth] getUser échoué:', authError?.message)
    return { supabase: null, user: null, error: `Non authentifié (${authError?.message || 'user null'})` }
  }

  return { supabase, user, error: null }
}
