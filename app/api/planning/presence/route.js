import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { PRISES } from '@/lib/domain/planning/mealPresence'

export const dynamic = 'force-dynamic'

/**
 * DÉCLARER QUI MANGE À LA MAISON, ET QUAND — livrable 1.5.
 *
 * GET  /api/planning/presence?window_start=AAAA-MM-JJ
 *      Les déclarations de la fenêtre de sept jours, et les membres du foyer.
 * POST /api/planning/presence
 *      `{ declarations: [{ household_member_id, meal_date, meal_type, present, note }] }`
 *      Une déclaration par créneau : `present: false` retire l'assiette,
 *      `present: true` revient dessus, `null` efface la déclaration.
 *
 * DEUX CHOSES QUE CETTE ROUTE NE FAIT PAS.
 *   — Elle ne génère ni ne republie aucune semaine. Déclarer une absence
 *     n'écrit RIEN dans les tables de planning : c'est la génération suivante,
 *     et sa transaction de publication, qui en tient compte. Le §9.3 du plan en
 *     fait un interdit — « zéro écriture dans les tables de planning hors
 *     publication atomique » — et cette route le respecte : elle n'écrit que
 *     dans `meal_presence`.
 *   — Elle n'invente aucune récurrence. « Tous les mardis midi » se déclare
 *     mardi par mardi ; une règle récurrente serait une prévision rangée à côté
 *     de faits, et plus personne ne les distinguerait.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const FENETRE_JOURS = 7

const validationError = (message) => {
  const error = new Error(message)
  error.code = 'validation'
  return error
}

function addDays(isoDate, count) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

/**
 * Normalise une déclaration. Rien n'est complété : une ligne dont le membre, le
 * jour ou la prise manque est refusée avec son motif, jamais devinée.
 */
function normalizeDeclaration(entry = {}) {
  const memberId = String(entry.household_member_id ?? '').trim()
  if (!memberId) throw validationError('household_member_id requis')
  if (!ISO_DATE.test(String(entry.meal_date || ''))) throw validationError('meal_date (AAAA-MM-JJ) requis')
  if (!PRISES.includes(entry.meal_type)) throw validationError(`meal_type invalide (attendu : ${PRISES.join(', ')})`)
  if (entry.present !== true && entry.present !== false && entry.present !== null) {
    throw validationError('present doit valoir true, false ou null (null efface la déclaration)')
  }
  return {
    household_member_id: memberId,
    meal_date: entry.meal_date,
    meal_type: entry.meal_type,
    present: entry.present,
    note: entry.note ? String(entry.note).slice(0, 300) : null,
  }
}

// Table absente : PostgREST répond `PGRST205` (table hors cache de schéma),
// une erreur SQL directe `42P01` — même convention que
// `lib/storageDecisionServer.js:51`.
const TABLE_ABSENTE = ['42P01', 'PGRST205']

const tableManquante = () => NextResponse.json(
  { error: 'La présence par créneau nécessite la migration meal_presence', code: 'migration_required' },
  { status: 503 },
)

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const windowStart = searchParams.get('window_start')
  if (!ISO_DATE.test(String(windowStart || ''))) {
    return NextResponse.json({ error: 'window_start (AAAA-MM-JJ) requis' }, { status: 400 })
  }
  const windowEnd = addDays(windowStart, FENETRE_JOURS - 1)

  const [membersResult, presenceResult] = await Promise.all([
    supabase.from('household_members')
      .select('id, name').eq('user_id', user.id).eq('active', true).order('created_at'),
    supabase.from('meal_presence')
      .select('id, household_member_id, meal_date, meal_type, present, note')
      .gte('meal_date', windowStart).lte('meal_date', windowEnd)
      .order('meal_date').order('meal_type'),
  ])
  if (TABLE_ABSENTE.includes(presenceResult.error?.code)) return tableManquante()
  if (membersResult.error) {
    return NextResponse.json({ error: `Membres du foyer indisponibles: ${membersResult.error.message}` }, { status: 500 })
  }
  if (presenceResult.error) {
    return NextResponse.json({ error: `Présence indisponible: ${presenceResult.error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    window_start: windowStart,
    window_end: windowEnd,
    members: membersResult.data || [],
    declarations: presenceResult.data || [],
  })
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* corps vide → validation ci-dessous */ }

  try {
    const entries = Array.isArray(body.declarations) ? body.declarations : []
    if (!entries.length) throw validationError('declarations attendu (liste non vide)')
    if (entries.length > 56) throw validationError('56 déclarations au maximum par envoi (deux semaines de quatre prises)')
    const declarations = entries.map(normalizeDeclaration)

    // `present: null` = on retire la déclaration. Ce n'est pas « présent » : on
    // revient à « rien n'est déclaré », et la grille redevient complète.
    const aEffacer = declarations.filter((entry) => entry.present === null)
    const aEcrire = declarations.filter((entry) => entry.present !== null)

    for (const entry of aEffacer) {
      const { error } = await supabase.from('meal_presence').delete()
        .eq('household_member_id', entry.household_member_id)
        .eq('meal_date', entry.meal_date)
        .eq('meal_type', entry.meal_type)
      if (TABLE_ABSENTE.includes(error?.code)) return tableManquante()
      if (error) throw new Error(`Effacement impossible: ${error.message}`)
    }

    let saved = []
    if (aEcrire.length) {
      const { data, error } = await supabase.from('meal_presence')
        .upsert(
          aEcrire.map((entry) => ({ ...entry, user_id: user.id, updated_at: new Date().toISOString() })),
          { onConflict: 'household_member_id,meal_date,meal_type' },
        )
        .select('id, household_member_id, meal_date, meal_type, present, note')
      if (TABLE_ABSENTE.includes(error?.code)) return tableManquante()
      if (error) throw new Error(`Enregistrement impossible: ${error.message}`)
      saved = data || []
    }

    return NextResponse.json({
      declarations: saved,
      cleared: aEffacer.length,
      // Dit à l'appelant ce qui reste à faire : la semaine déjà publiée n'a pas
      // bougé. Tant qu'elle n'est pas régénérée, les assiettes retirées y sont
      // encore — et l'écran le montre plutôt que de le laisser croire.
      requires_regeneration: true,
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }
}
