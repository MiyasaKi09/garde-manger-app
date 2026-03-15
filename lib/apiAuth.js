import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function authenticateRequest(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[Auth] Variables Supabase manquantes:', { hasUrl: !!url, hasKey: !!key })
    return { supabase: null, user: null, error: 'Configuration serveur manquante' }
  }

  // Strategy 1: Bearer token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (!authError && user) {
      console.log('[Auth] Authentifié via Bearer token:', user.email)
      return { supabase, user, error: null }
    }
    console.warn('[Auth] Bearer token invalide:', authError?.message)
  }

  // Strategy 2: Session cookies (from @supabase/auth-helpers-nextjs)
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!authError && user) {
      console.log('[Auth] Authentifié via cookies:', user.email)
      return { supabase, user, error: null }
    }
    console.warn('[Auth] Cookies auth échoué:', authError?.message)
  } catch (e) {
    console.warn('[Auth] Erreur cookies fallback:', e.message)
  }

  return { supabase: null, user: null, error: 'Non authentifié' }
}
