/**
 * Objectifs nutritionnels — mise en forme normalisée (domaine PUR, testable).
 * Réf. plan directeur PR 1, §9.11 / modèle §6.2.
 *
 * Forme normalisée : { kcal, proteinG, carbsG, fatG, fiberG, tolerancePercent,
 * source, memberId }. La source officielle est nutrition_target_versions ; le
 * repli legacy vient de user_health_goals.
 */

const num = (v) => (v == null || v === '' ? null : Number(v))
const DEFAULT_TOLERANCE = 15

/** Depuis une ligne nutrition_target_versions. */
export function shapeTargetsFromVersion(v) {
  if (!v) return null
  return {
    kcal: num(v.target_kcal),
    proteinG: num(v.target_protein_g),
    carbsG: num(v.target_carbs_g),
    fatG: num(v.target_fat_g),
    fiberG: num(v.target_fiber_g),
    tolerancePercent: v.tolerance_percent != null ? Number(v.tolerance_percent) : DEFAULT_TOLERANCE,
    source: v.source || 'version',
    memberId: v.member_id ?? null,
  }
}

/** Repli depuis user_health_goals (colonnes target_calories / target_*_g). */
export function shapeTargetsFromGoal(g) {
  if (!g) return null
  return {
    kcal: num(g.target_calories),
    proteinG: num(g.target_protein_g),
    carbsG: num(g.target_carbs_g),
    fatG: num(g.target_fat_g),
    fiberG: num(g.target_fiber_g),
    tolerancePercent: DEFAULT_TOLERANCE,
    source: 'legacy_goal_fallback',
    memberId: g.household_member_id ?? null,
  }
}
