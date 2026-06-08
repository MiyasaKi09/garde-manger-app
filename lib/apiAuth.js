import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import crypto from 'crypto'

/**
 * Vérification LOCALE du JWT (HS256) — voie rapide, sans aller-retour réseau vers
 * Supabase. Activée UNIQUEMENT si `SUPABASE_JWT_SECRET` est défini ; sinon on
 * retombe sur `getUser()` (réseau). La RLS au niveau de la base reste de toute
 * façon le garde-fou final (PostgREST revalide la signature du jeton).
 *
 * Compromis : la vérif locale ne détecte pas une session révoquée avant l'`exp`
 * du jeton (jetons courts ~1 h). Acceptable pour une app perso ; ne pas activer
 * si tu as besoin de couper l'accès instantanément à la déconnexion.
 */
function verifyJwtLocally(token) {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret || !token) return null
  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return null
    const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')
    const sigBuf = Buffer.from(s)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
    if (!payload?.sub) return null
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null
    return { id: payload.sub, email: payload.email || null, ...payload }
  } catch {
    return null
  }
}

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

    // Voie rapide : vérification locale (si SUPABASE_JWT_SECRET configuré).
    const localUser = verifyJwtLocally(token)
    if (localUser) {
      return { supabase, user: localUser, error: null }
    }

    // Sinon, validation réseau via Supabase.
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (!authError && user) {
      return { supabase, user, error: null }
    }
    console.warn('[Auth] Bearer token invalide:', authError?.message)
  }

  // Strategy 2: Session cookies (from @supabase/auth-helpers-nextjs)
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!authError && user) {
      return { supabase, user, error: null }
    }
    console.warn('[Auth] Cookies auth échoué:', authError?.message)
  } catch (e) {
    console.warn('[Auth] Erreur cookies fallback:', e.message)
  }

  return { supabase: null, user: null, error: 'Non authentifié' }
}
