import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getImport, deleteImport } from '@/lib/nutritionPlanService'
import { estimationCourses } from '@/app/_pricing/estimations'
import { lireEnveloppe } from '@/components/pricing/budgetEnvelope'

/**
 * Enveloppe budgétaire du foyer, jointe à l'estimation.
 *
 * Elle est lue ICI plutôt que par un appel séparé côté page : le verdict
 * « dans / au-dessus de votre enveloppe » n'a de sens qu'à côté du montant, et
 * deux requêtes qui arrivent l'une après l'autre feraient clignoter le verdict
 * après le chiffre. Une absence d'enveloppe n'est pas une erreur — c'est l'état
 * de départ de tout foyer — donc la lecture ne fait jamais échouer la route.
 */
async function chargerEnveloppe(supabase, userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('food_budget_low, food_budget_high, food_budget_currency, food_budget_period, food_budget_set_on')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return lireEnveloppe(data)
}

export async function GET(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const data = await getImport(supabase, params.importId)

    /**
     * L'estimation des courses, au CONTENANT (§6.2) et par semaine.
     *
     * Servie avec le plan plutôt que par une route à part : les deux écrans qui
     * l'affichent — la liste de courses et le planning — chargent déjà cet
     * import, et un second aller-retour ferait apparaître le total quelques
     * centaines de millisecondes après la liste qu'il totalise.
     *
     * Enveloppée : une liste de courses doit s'afficher même si son chiffrage
     * échoue. L'estimation est un service rendu à la liste, pas une condition
     * de son existence.
     */
    let estimation = null
    try {
      estimation = estimationCourses(data.shoppingItems || [], {
        enveloppe: await chargerEnveloppe(supabase, user.id),
      })
    } catch {
      estimation = null
    }

    return NextResponse.json({ ...data, estimation })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    await deleteImport(supabase, params.importId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
