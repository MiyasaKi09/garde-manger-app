import { describe, expect, it } from 'vitest'
import { getMemberPlanningRules } from '@/lib/domain/planning/memberPlanningRules'
import {
  mergePlanningPreferences,
  normalizeFoodPreference,
  normalizeGoalInput,
  normalizeMeatMealsPerWeek,
  resolvePlanningGoals,
} from '@/lib/domain/settings/planningSettings'

describe('planning settings', () => {
  const member = { id: 'member-1', name: 'Nora' }

  it('validates a questionnaire result and binds it to the household member', () => {
    expect(normalizeGoalInput({
      target_calories: 2100,
      target_protein_g: 110,
      target_carbs_g: 240,
      target_fat_g: 70,
      target_fiber_g: 30,
      age: 31,
      sex: 'F',
      height_cm: 172,
      current_weight_kg: 72,
      target_weight_kg: 66,
      activity_level: 'light',
      weight_loss_rate: 0.5,
      bmr: 1500,
      tdee: 2100,
    }, member)).toMatchObject({ household_member_id: 'member-1', person_name: 'Nora', target_calories: 2100, calculation_source: 'questionnaire' })
  })

  it('keeps unrelated preferences while updating planning rules', () => {
    expect(mergePlanningPreferences({ locale: 'fr', planning: { breakfast: false } }, {
      breakfast: true,
      snack: true,
      vegetarian_meat_swaps_per_week: 3,
    })).toEqual({
      locale: 'fr',
      planning: { breakfast: true, snack: true, vegetarian_meat_swaps_per_week: 3 },
    })
  })

  it('écrit le quota carné quand il est déclaré, et rien quand il ne l\'est pas', () => {
    // Livrable 1.1. L'absence de clé est la seule forme honnête de l'absence de
    // réglage : un `meat_meals_per_week: null` posé dans le profil se relirait
    // comme « réglé à rien » et ne se distinguerait plus d'un réglage effacé.
    expect(mergePlanningPreferences({}, { meat_meals_per_week: 2 }).planning.meat_meals_per_week).toBe(2)
    expect(mergePlanningPreferences({}, { meat_meals_per_week: '4' }).planning.meat_meals_per_week).toBe(4)
    expect(mergePlanningPreferences({}, {}).planning).not.toHaveProperty('meat_meals_per_week')
    expect(mergePlanningPreferences({}, { meat_meals_per_week: '' }).planning).not.toHaveProperty('meat_meals_per_week')
    // Zéro EST une déclaration : « je ne mange pas de viande » se règle.
    expect(mergePlanningPreferences({}, { meat_meals_per_week: 0 }).planning.meat_meals_per_week).toBe(0)
  })

  it('refuse une saisie de quota inexploitable au lieu de la ramener à zéro', () => {
    // Ramener « abc » à 0 enregistrerait « cette personne ne mange pas de
    // viande », ce que personne n'a écrit — et le relecteur suivant ne pourrait
    // plus distinguer ce 0 d'un choix.
    for (const saisie of ['abc', -1, 15, Infinity]) {
      expect(() => normalizeMeatMealsPerWeek(saisie), String(saisie)).toThrowError('meat_meals_per_week_out_of_range')
    }
    expect(normalizeMeatMealsPerWeek(null)).toBeNull()
    expect(normalizeMeatMealsPerWeek(14)).toBe(14)
  })

  it('refuse aussi ce que Number() convertit en silence — trouvé en relecture', () => {
    // CE QUE LA PREMIÈRE VERSION LAISSAIT PASSER, et que les quatre cas
    // ci-dessus ne touchaient pas : `Number()` rend 0 pour une chaîne blanche,
    // pour un tableau vide et pour `false`, 1 pour `true`, 3 pour `[3]`.
    // Quatre de ces cinq saisies enregistraient donc « cette personne ne mange
    // pas de viande » — précisément la fabrication que ce livrable annonce
    // refuser — et la cinquième un quota de trois repas que personne n'avait
    // écrit. Le test qui garde une garantie doit éprouver ce qui la casse.
    for (const saisie of [[], [3], true, false, {}, '2abc']) {
      expect(() => normalizeMeatMealsPerWeek(saisie), JSON.stringify(saisie))
        .toThrowError('meat_meals_per_week_out_of_range')
    }
    // Une chaîne BLANCHE reste une absence et non un refus : c'est ce que rend
    // un champ effacé au clavier, et le refuser empêcherait de RETIRER un quota.
    expect(normalizeMeatMealsPerWeek('  ')).toBeNull()
    expect(normalizeMeatMealsPerWeek('\t')).toBeNull()
  })

  it('ne relit jamais comme un quota ce qui n\'en est pas un', () => {
    // Le point d'écriture refuse ; le point de LECTURE doit rendre l'absence,
    // parce qu'un profil peut déjà porter une de ces valeurs.
    for (const valeur of ['  ', [], [3], true, false, {}, '2abc']) {
      expect(
        getMemberPlanningRules({ preferences: { planning: { meat_meals_per_week: valeur } } }).meatMealsPerWeek,
        JSON.stringify(valeur),
      ).toBeNull()
    }
    // Et ce qui EST un quota se relit tel quel, chaîne numérique comprise.
    expect(getMemberPlanningRules({ preferences: { planning: { meat_meals_per_week: '3' } } }).meatMealsPerWeek).toBe(3)
    expect(getMemberPlanningRules({ preferences: { planning: { meat_meals_per_week: 0 } } }).meatMealsPerWeek).toBe(0)
  })

  it('normalizes strict bans and dislikes', () => {
    expect(normalizeFoodPreference({ name: '  Fruits   de mer ', kind: 'ban' }))
      .toMatchObject({ name: 'Fruits de mer', normalized_name: 'fruits de mer', kind: 'ban' })
    expect(normalizeFoodPreference({ name: 'Fenouil', kind: 'dislike' }).kind).toBe('dislike')
  })

  it('uses the active version as planning truth and falls back to legacy goals', () => {
    const members = [member, { id: 'member-2', name: 'Eli' }]
    const goals = resolvePlanningGoals({
      members,
      windowStart: '2026-07-27',
      healthGoals: [
        { household_member_id: 'member-1', person_name: 'Nora', target_calories: 1800, target_protein_g: 90 },
        { household_member_id: 'member-2', person_name: 'Eli', target_calories: 2200, target_protein_g: 120 },
      ],
      targetVersions: [
        { member_id: 'member-1', effective_from: '2026-07-24', effective_to: null, target_kcal: 1950, target_protein_g: 105, source: 'questionnaire' },
      ],
    })
    expect(goals[0]).toMatchObject({ person_name: 'Nora', target_calories: 1950, target_protein_g: 105, target_source: 'questionnaire' })
    expect(goals[1]).toMatchObject({ person_name: 'Eli', target_calories: 2200, target_source: 'user_health_goals' })
  })
})
