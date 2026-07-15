import { createBearerSupabase, createCookieSupabase } from '@/lib/supabase/request'

export async function authenticateRequest(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()
      if (token) {
        const supabase = createBearerSupabase(token)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (!error && user) return { supabase, user, error: null }
      }
    }

    const supabase = await createCookieSupabase()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return { supabase, user, error: null }
    return { supabase: null, user: null, error: 'Non authentifié' }
  } catch (error) {
    console.error('[Auth] Initialisation Supabase impossible:', error)
    return { supabase: null, user: null, error: 'Configuration serveur manquante' }
  }
}
