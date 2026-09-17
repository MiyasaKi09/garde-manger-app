import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { ecartAnnonceConstate } from '@/lib/domain/planning/cookingTime'

export const dynamic = 'force-dynamic'

/**
 * CONSIGNER LE TEMPS RÉELLEMENT PASSÉ EN CUISINE — livrable 2.4.
 *
 * GET  /api/planning/session-time?plan_version_id=<uuid>
 *      Les sessions déjà chronométrées de cette version de plan, avec leur
 *      écart calculé (constaté − annoncé).
 * POST /api/planning/session-time
 *      `{ plan_version_id, session_date, session_window,
 *         announced_active_minutes, observed_active_minutes, note }`
 *
 * CE QUE CETTE ROUTE NE FAIT PAS, et c'est l'essentiel :
 *   — elle n'écrit RIEN dans les tables de planning. Le §9.3 du plan en fait un
 *     interdit (« zéro écriture dans les tables de planning hors publication
 *     atomique ») ; cette route n'écrit que dans `cooking_session_times` ;
 *   — elle ne stocke pas l'écart. Il se calcule à la lecture, à partir des deux
 *     nombres qui le produisent (`ecartAnnonceConstate`) ;
 *   — elle ne recalcule pas l'annonce. C'est l'appelant qui la transmet, parce
 *     que c'est l'annonce AFFICHÉE ce jour-là qui est en cause : relire celle
 *     du plan d'aujourd'hui pour la comparer à un chronomètre d'hier
 *     comparerait deux semaines différentes.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Mêmes libellés que `sessionWindowForHour` (cookingSessions.js). */
const FENETRES = ['matin', 'apres_midi', 'soir']
/**
 * Vingt-quatre heures. Ce n'est pas un jugement sur ce qui est raisonnable —
 * une session de six heures se déclare et doit se déclarer, c'est précisément
 * le cas qu'on veut voir. C'est la borne physique d'une journée : au-delà, la
 * saisie est une faute de frappe, et l'accepter écrirait un écart faux.
 */
const MINUTES_MAX = 24 * 60

const validationError = (message) => {
  const error = new Error(message)
  error.code = 'validation'
  return error
}

// Table absente : PostgREST répond `PGRST205` (table hors cache de schéma),
// une erreur SQL directe `42P01` — même convention que la route de présence.
const TABLE_ABSENTE = ['42P01', 'PGRST205']

const tableManquante = () => NextResponse.json(
  { error: 'Le temps constaté nécessite la migration cooking_session_times', code: 'migration_required' },
  { status: 503 },
)

const entierMinutes = (valeur, champ) => {
  const nombre = Number(valeur)
  if (!Number.isFinite(nombre) || nombre < 0 || nombre > MINUTES_MAX) {
    throw validationError(`${champ} doit être un nombre de minutes entre 0 et ${MINUTES_MAX}`)
  }
  return Math.round(nombre)
}

/** Une ligne de la table, augmentée de son écart CALCULÉ. */
const avecEcart = (ligne) => ({
  ...ligne,
  ecart: ecartAnnonceConstate({
    annonce: ligne.announced_active_minutes,
    constate: ligne.observed_active_minutes,
  }),
})

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const planVersionId = searchParams.get('plan_version_id')
  if (!UUID.test(String(planVersionId || ''))) {
    return NextResponse.json({ error: 'plan_version_id (uuid) requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cooking_session_times')
    .select('id, plan_version_id, session_date, session_window, announced_active_minutes, observed_active_minutes, note')
    .eq('plan_version_id', planVersionId)
    .order('session_date')
  if (TABLE_ABSENTE.includes(error?.code)) return tableManquante()
  if (error) return NextResponse.json({ error: `Temps de session indisponible: ${error.message}` }, { status: 500 })

  return NextResponse.json({ sessions: (data || []).map(avecEcart) })
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* corps vide → validation ci-dessous */ }

  try {
    if (!UUID.test(String(body.plan_version_id || ''))) throw validationError('plan_version_id (uuid) requis')
    if (!ISO_DATE.test(String(body.session_date || ''))) throw validationError('session_date (AAAA-MM-JJ) requis')
    if (!FENETRES.includes(body.session_window)) {
      throw validationError(`session_window invalide (attendu : ${FENETRES.join(', ')})`)
    }
    const ligne = {
      user_id: user.id,
      plan_version_id: body.plan_version_id,
      session_date: body.session_date,
      session_window: body.session_window,
      announced_active_minutes: entierMinutes(body.announced_active_minutes, 'announced_active_minutes'),
      observed_active_minutes: entierMinutes(body.observed_active_minutes, 'observed_active_minutes'),
      note: body.note ? String(body.note).slice(0, 300) : null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('cooking_session_times')
      .upsert(ligne, { onConflict: 'plan_version_id,session_date,session_window' })
      .select('id, plan_version_id, session_date, session_window, announced_active_minutes, observed_active_minutes, note')
      .single()
    if (TABLE_ABSENTE.includes(error?.code)) return tableManquante()
    if (error) throw new Error(`Enregistrement impossible: ${error.message}`)

    return NextResponse.json({ session: avecEcart(data) })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }
}
