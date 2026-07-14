/**
 * Assemble la vue « Aujourd'hui » côté SERVEUR (à n'importer que depuis une route
 * API). Réf. plan directeur PR 1, §9.15. Cette PR agrège encore des tables
 * historiques mais produit le contrat final (validé par assertTodayViewModel).
 */
import { listMembers } from '@/lib/domain/household/memberRepository'
import { getActiveNutritionTargets } from '@/lib/domain/household/getActiveNutritionTargets'
import { buildTodayViewModel } from '@/lib/domain/today/todayViewModel'

export async function getToday(supabase, date) {
  const [members, targetsByMember] = await Promise.all([
    listMembers(supabase),
    getActiveNutritionTargets(supabase),
  ])

  // kcal réellement loggés aujourd'hui, agrégés par membre (RLS = user courant).
  const { data: logs } = await supabase
    .from('meal_log')
    .select('household_member_id, kcal')
    .eq('meal_date', date)
  const loggedByMember = new Map()
  for (const l of logs || []) {
    if (!l.household_member_id) continue
    const cur = loggedByMember.get(l.household_member_id) || { kcal: 0 }
    cur.kcal += Number(l.kcal) || 0
    loggedByMember.set(l.household_member_id, cur)
  }

  // Restes actifs (plats cuisinés encore disponibles).
  const { data: dishes } = await supabase
    .from('cooked_dishes')
    .select('id, name, portions_remaining, expiration_date')
    .gt('portions_remaining', 0)
    .order('expiration_date', { ascending: true, nullsFirst: false })
  const leftovers = (dishes || []).map((d) => ({
    id: d.id,
    name: d.name,
    portionsRemaining: Number(d.portions_remaining) || 0,
    expirationDate: d.expiration_date,
  }))

  // Courses non cochées (indispensables restantes).
  const { count } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id', { count: 'exact', head: true })
    .eq('checked', false)
  const shopping = { requiredCount: count || 0, items: [] }

  return buildTodayViewModel({ date, members, targetsByMember, loggedByMember, leftovers, shopping })
}
