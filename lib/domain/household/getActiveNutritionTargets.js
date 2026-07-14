/**
 * Service officiel des objectifs nutritionnels actifs (SERVEUR). Réf. plan PR 1, §9.11.
 *
 * Ordre : 1) nutrition_target_versions active (effective_to IS NULL, la plus
 * récente) ; 2) repli user_health_goals (via household_member_id) pour un membre
 * sans version. Ne crée rien ici (lecture) — l'auto-création d'une version depuis
 * le repli se fera dans un service d'écriture dédié.
 *
 * @returns {Promise<Map<string, object>>} member_id → objectif normalisé.
 */
import { shapeTargetsFromVersion, shapeTargetsFromGoal } from '@/lib/domain/nutrition/targets'

export async function getActiveNutritionTargets(supabase) {
  const byMember = new Map()

  const { data: versions, error } = await supabase
    .from('nutrition_target_versions')
    .select('member_id, effective_from, target_kcal, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g, tolerance_percent, source')
    .is('effective_to', null)
    .order('effective_from', { ascending: false })
  if (error) throw new Error(`Lecture nutrition_target_versions : ${error.message}`)
  for (const v of versions || []) {
    if (v.member_id && !byMember.has(v.member_id)) byMember.set(v.member_id, shapeTargetsFromVersion(v))
  }

  // Repli : membres liés à un objectif legacy mais sans version active.
  const { data: goals, error: gErr } = await supabase
    .from('user_health_goals')
    .select('household_member_id, target_calories, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g')
    .not('household_member_id', 'is', null)
  if (gErr) throw new Error(`Lecture user_health_goals : ${gErr.message}`)
  for (const g of goals || []) {
    if (g.household_member_id && !byMember.has(g.household_member_id)) {
      byMember.set(g.household_member_id, shapeTargetsFromGoal(g))
    }
  }

  return byMember
}
