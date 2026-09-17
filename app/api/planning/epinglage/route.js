import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { CONSUMED_STATUSES } from '@/lib/domain/planning/slotProtection'

export const dynamic = 'force-dynamic'

/**
 * ÉPINGLER UN CRÉNEAU — livrable 3.4.
 *
 * POST /api/planning/epinglage
 *      `{ import_id, meal_date, meal_type, locked }`
 *
 * CE QUI MANQUAIT. `lib/domain/planning/slotProtection.js:39` LIT `slot.locked`
 * depuis le 13 juillet ; `app/api/planning/generate-v3/route.js` le RESPECTE —
 * un créneau protégé reçoit `fixedRecipeCode` au lieu d'être recalculé ; et la
 * transaction de publication le REPORTE d'une version de plan à la suivante
 * (`supabase/migrations/20260717000002_p2_planned_productions.sql:336`,
 * `locked = coalesce((v_slot->>'locked')::boolean, false)`). Trois maillons sur
 * quatre. Il manquait celui qui l'écrit : aucune route, aucun écran. Le foyer
 * avait donc un verrou sans clé.
 *
 * POURQUOI CETTE ROUTE ÉCRIT DANS UNE TABLE DE PLANNING, ALORS QUE LE §9.3 DU
 * PLAN L'INTERDIT. L'interdit vise les écritures qui DÉCIDENT — un plat, une
 * quantité, une liste de courses posés hors moteur et hors invariants, ce que
 * font aujourd'hui les trois boutons de Routine. Une épingle ne décide de rien :
 * elle n'écrit ni recette, ni portion, ni repas ; elle enregistre une
 * déclaration de l'utilisateur SUR un créneau déjà publié, et c'est la
 * génération suivante — donc la publication atomique — qui en tire les
 * conséquences. La garde est mécanique et non déclarative : le patch envoyé à
 * Supabase ne contient QUE `locked`, et `tests/planning/epinglage.test.js` le
 * relit colonne par colonne. Le jour où cette route écrirait autre chose, le
 * test rougit.
 *
 * CE QU'ELLE NE FAIT PAS. Elle ne régénère pas la semaine, elle ne republie
 * rien, et elle ne protège pas un créneau déjà mangé — un repas consommé est
 * protégé par son statut, pas par une épingle, et le dire deux fois donnerait
 * deux sources de vérité pour la même chose.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const PRISES = ['pdj', 'dejeuner', 'collation', 'diner']

const erreurValidation = (message) => {
  const erreur = new Error(message)
  erreur.code = 'validation'
  return erreur
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* corps vide → validation ci-dessous */ }

  try {
    const importId = Number(body.import_id ?? body.importId) || null
    if (!importId) throw erreurValidation('import_id requis')
    if (!ISO_DATE.test(String(body.meal_date || ''))) throw erreurValidation('meal_date (AAAA-MM-JJ) requis')
    if (!PRISES.includes(body.meal_type)) throw erreurValidation(`meal_type invalide (attendu : ${PRISES.join(', ')})`)
    if (typeof body.locked !== 'boolean') throw erreurValidation('locked doit valoir true ou false')

    const { data: planImport, error: importError } = await supabase
      .from('nutrition_plan_imports')
      .select('id, active_plan_version_id')
      .eq('id', importId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (importError) throw new Error(`Lecture du planning impossible: ${importError.message}`)
    if (!planImport?.active_plan_version_id) {
      return NextResponse.json({ error: 'Planning introuvable ou non publié' }, { status: 404 })
    }

    const { data: slots, error: slotError } = await supabase
      .from('meal_plan_slots')
      .select('id, slot_key, meal_date, meal_type, status, locked')
      .eq('plan_version_id', planImport.active_plan_version_id)
      .eq('user_id', user.id)
      .eq('meal_date', body.meal_date)
      .eq('meal_type', body.meal_type)
    if (slotError) throw new Error(`Lecture du créneau impossible: ${slotError.message}`)
    const slot = (slots || [])[0]
    if (!slot) return NextResponse.json({ error: 'Créneau introuvable dans ce planning' }, { status: 404 })

    // Un créneau mangé est déjà protégé par son statut. Épingler par-dessus ne
    // changerait rien et laisserait croire que l'épingle en est la cause ;
    // dépingler laisserait croire qu'on vient de le rendre remplaçable, ce qui
    // est faux. On le dit, on n'écrit pas.
    if (CONSUMED_STATUSES.includes(slot.status)) {
      return NextResponse.json({
        error: 'Ce repas est déjà protégé parce qu’il est marqué cuisiné ou consommé',
        code: 'deja_protege_par_le_statut',
        slot_key: slot.slot_key,
        status: slot.status,
      }, { status: 409 })
    }

    // LE PATCH NE PORTE QUE `locked`. Voir l'en-tête : c'est la garde qui rend
    // cette écriture compatible avec le §9.3 du plan.
    const { data: saved, error: updateError } = await supabase
      .from('meal_plan_slots')
      .update({ locked: body.locked })
      .eq('id', slot.id)
      .eq('user_id', user.id)
      .select('id, slot_key, meal_date, meal_type, locked')
      .maybeSingle()
    if (updateError) throw new Error(`Épinglage impossible: ${updateError.message}`)

    return NextResponse.json({
      slot_key: saved?.slot_key ?? slot.slot_key,
      meal_date: saved?.meal_date ?? slot.meal_date,
      meal_type: saved?.meal_type ?? slot.meal_type,
      locked: saved?.locked ?? body.locked,
      // Ce que l'épingle change, et quand : rien maintenant, tout à la
      // prochaine génération. L'écran le dit plutôt que de le laisser deviner.
      protects_next_generation: body.locked,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }
}
