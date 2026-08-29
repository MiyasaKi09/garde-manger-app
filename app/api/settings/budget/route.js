import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normaliserEnveloppe, lireEnveloppe } from '@/components/pricing/budgetEnvelope'

export const dynamic = 'force-dynamic'

/**
 * L'enveloppe alimentaire du foyer — lecture, pose, effacement.
 *
 * Elle vit dans `user_profiles.food_budget_*`, posée par la migration
 * 20260824121000_household_food_budget. Cette route est la seule écriture :
 * CLAUDE.md interdit d'écrire depuis un composant client, et cette donnée-là
 * mérite la règle plus que d'autres — ce que quelqu'un s'autorise à dépenser en
 * dit autant sur lui que ce qu'il dépense, et la RLS qui protège la ligne ne
 * protège rien si le chemin d'écriture contourne l'authentification.
 *
 * UNE ENVELOPPE EST DATÉE. `food_budget_set_on` est écrit à chaque pose, jamais
 * saisi : c'est un fait (« vous l'avez fixée ce jour-là »), pas une préférence.
 * Il n'est JAMAIS réindexé — décider à la place de quelqu'un ce qu'il peut
 * dépenser n'est pas un calcul, c'est une substitution. Il sert seulement à
 * pouvoir lui demander, dans deux ans, si c'est encore la sienne.
 */

const COLONNES = 'food_budget_low, food_budget_high, food_budget_currency, food_budget_period, food_budget_set_on'

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_profiles')
    .select(COLONNES)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: `Lecture de l’enveloppe impossible: ${error.message}` }, { status: 500 })

  // Pas de profil = pas encore d'enveloppe. Ce n'est pas un 404 : l'utilisateur
  // existe, c'est son enveloppe qui n'a jamais été posée, et l'écran doit
  // proposer de la poser plutôt qu'annoncer une absence de ressource.
  return NextResponse.json({ enveloppe: lireEnveloppe(data), brut: data ?? null })
}

export async function PUT(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch {}

  let enveloppe
  try {
    enveloppe = normaliserEnveloppe(body)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'validation' ? 400 : 500 })
  }

  const ligne = {
    user_id: user.id,
    food_budget_low: enveloppe.low,
    food_budget_high: enveloppe.high,
    food_budget_currency: enveloppe.currency,
    food_budget_period: enveloppe.period,
    food_budget_set_on: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  }

  // `upsert` sur la clé primaire : le profil peut ne pas exister encore, et
  // poser une enveloppe ne doit pas exiger d'être passé par un autre écran.
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(ligne, { onConflict: 'user_id' })
    .select(COLONNES)
    .single()
  if (error) return NextResponse.json({ error: `Enregistrement impossible: ${error.message}` }, { status: 500 })

  return NextResponse.json({ enveloppe: lireEnveloppe(data) })
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  /**
   * Effacer l'enveloppe remet les CINQ colonnes à NULL, pas seulement les
   * montants : la contrainte de la table exige que périodicité et devise
   * disparaissent avec eux. Une périodicité orpheline serait refusée par la
   * base — et si elle passait, elle décrirait une enveloppe sans montant, ce
   * qui ne veut rien dire.
   */
  const { error } = await supabase
    .from('user_profiles')
    .update({
      food_budget_low: null,
      food_budget_high: null,
      food_budget_currency: null,
      food_budget_period: null,
      food_budget_set_on: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: `Effacement impossible: ${error.message}` }, { status: 500 })

  return NextResponse.json({ enveloppe: null })
}
