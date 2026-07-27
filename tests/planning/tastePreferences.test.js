import { describe, expect, it } from 'vitest'
import {
  APPRECIATION,
  EMPTY_TASTE_PROFILE,
  buildHouseholdTasteProfile,
  isTasteForbidden,
  normalizeTastePreference,
  preferenceFromFeedback,
  recipeTasteSubjects,
  requestedRepeatDelayDays,
  tasteScore,
} from '@/lib/domain/planning/tastePreferences'
import { recipeDiversityProfile } from '@/lib/domain/planning/closedLoopPlanner'

// Lot 2 du plan de refonte — modèle complet des goûts (§5) et retour après
// consommation (§6).

const preference = (memberId, subjectType, subjectValue, appreciation, extra = {}) => ({
  household_member_id: memberId,
  subject_type: subjectType,
  subject_value: subjectValue,
  subject_label: subjectValue,
  appreciation,
  strict: false,
  ...extra,
})

const recipe = {
  code: 'IT-001',
  family: 'Lasagnes à la bolognaise',
  category: 'plat principal',
  cuisineOrigin: 'Italie',
  techniques: ['four'],
  servings: 2,
  prepMinutes: 30,
  cookMinutes: 45,
  sensory: { profile: 'warm_aromatic', scores: { richness: 4 }, target_textures: ['fondant'] },
  exactIngredients: [
    { name: 'boeuf hache', formNormalized: 'boeuf hache', category: 'viandes', grams: 300, optional: false },
    { name: 'coriandre', formNormalized: 'coriandre', category: 'herbes_aromates', grams: 10, optional: false },
  ],
  nutritionPerServing: { kcal: 700, proteinG: 40, carbsG: 60, fatG: 30, fiberG: 5 },
}

describe('normalizeTastePreference', () => {
  it('écarte une ligne inexploitable plutôt que de l’interpréter', () => {
    expect(normalizeTastePreference({ subject_type: 'planete', subject_value: 'x', appreciation: 'liked' })).toBeNull()
    expect(normalizeTastePreference({ subject_type: 'ingredient', subject_value: '', appreciation: 'liked' })).toBeNull()
    expect(normalizeTastePreference({ subject_type: 'ingredient', subject_value: 'x', appreciation: 'bof' })).toBeNull()
  })

  it('rend un interdit strict même si la ligne ne le dit pas', () => {
    const normalized = normalizeTastePreference(preference(1, 'ingredient', 'arachide', APPRECIATION.FORBIDDEN))
    expect(normalized.strict).toBe(true)
  })

  it('normalise le sujet comme le reste du moteur', () => {
    expect(normalizeTastePreference(preference(1, 'ingredient', 'Céleri Rave', APPRECIATION.DISLIKED)).subjectValue)
      .toBe('celeri rave')
  })
})

describe('buildHouseholdTasteProfile — compromis de foyer (§5)', () => {
  it('fait primer le refus : l’interdit d’une seule personne interdit pour tous', () => {
    const profile = buildHouseholdTasteProfile([
      preference(1, 'ingredient', 'arachide', APPRECIATION.FORBIDDEN),
      preference(2, 'ingredient', 'arachide', APPRECIATION.FAVORITE),
    ])
    expect(profile.subjects['ingredient|arachide'].appreciation).toBe(APPRECIATION.FORBIDDEN)
    expect(profile.forbidden.ingredient).toContain('arachide')
  })

  it('ne sert pas à quelqu’un un plat qu’il déteste sous prétexte que l’autre l’adore', () => {
    const profile = buildHouseholdTasteProfile([
      preference(1, 'ingredient', 'coriandre', APPRECIATION.DISLIKED),
      preference(2, 'ingredient', 'coriandre', APPRECIATION.FAVORITE),
    ])
    expect(profile.subjects['ingredient|coriandre'].appreciation).toBe(APPRECIATION.DISLIKED)
    expect(profile.subjects['ingredient|coriandre'].dissenting).toBe(true)
  })

  it('partage l’envie quand personne ne s’y oppose', () => {
    const profile = buildHouseholdTasteProfile([
      preference(1, 'cuisine', 'italie', APPRECIATION.FAVORITE),
      preference(2, 'cuisine', 'italie', APPRECIATION.NEUTRAL),
    ])
    expect(profile.subjects['cuisine|italie'].appreciation).toBe(APPRECIATION.LIKED)
    expect(profile.subjects['cuisine|italie'].dissenting).toBe(true)
  })

  it('retient le délai de retour le plus long demandé', () => {
    const profile = buildHouseholdTasteProfile([
      preference(1, 'recipe', 'pizza', APPRECIATION.FAVORITE, { repeat_delay_days: 7 }),
      preference(2, 'recipe', 'pizza', APPRECIATION.LIKED, { repeat_delay_days: 30 }),
    ])
    expect(profile.subjects['recipe|pizza'].repeatDelayDays).toBe(30)
  })

  it('rend un profil vide exploitable sans cas particulier', () => {
    expect(EMPTY_TASTE_PROFILE.isEmpty).toBe(true)
    expect(tasteScore(recipe, EMPTY_TASTE_PROFILE)).toEqual({ total: 0, reasons: [] })
    expect(isTasteForbidden(recipe, EMPTY_TASTE_PROFILE)).toBeNull()
  })
})

describe('rapprochement recette ↔ goûts', () => {
  const diversity = recipeDiversityProfile(recipe)

  it('expose la recette, ses ingrédients et ses dimensions sensorielles', () => {
    const subjects = recipeTasteSubjects(recipe, diversity)
    const types = new Set(subjects.map(([type]) => type))
    expect(types).toContain('recipe')
    expect(types).toContain('ingredient')
    expect(types).toContain('cuisine')
    expect(subjects.some(([type, value]) => type === 'ingredient' && value === 'coriandre')).toBe(true)
  })

  it('écarte une recette contenant un ingrédient strictement interdit', () => {
    const profile = buildHouseholdTasteProfile([preference(1, 'ingredient', 'boeuf hache', APPRECIATION.FORBIDDEN)])
    expect(isTasteForbidden(recipe, profile, diversity)).toMatchObject({ subjectType: 'ingredient' })
  })

  it('note positivement un favori et négativement une aversion, sans symétrie', () => {
    const aime = tasteScore(recipe, buildHouseholdTasteProfile([preference(1, 'recipe', 'IT-001', APPRECIATION.FAVORITE)]), diversity)
    const deteste = tasteScore(recipe, buildHouseholdTasteProfile([preference(1, 'recipe', 'IT-001', APPRECIATION.DISLIKED)]), diversity)
    expect(aime.total).toBeGreaterThan(0)
    expect(deteste.total).toBeLessThan(0)
    // Déplaire coûte plus cher que plaire ne rapporte.
    expect(Math.abs(deteste.total)).toBeGreaterThan(Math.abs(aime.total))
  })

  it('pèse moins un ingrédient qu’une recette entière', () => {
    const parIngredient = tasteScore(recipe, buildHouseholdTasteProfile([preference(1, 'ingredient', 'coriandre', APPRECIATION.FAVORITE)]), diversity)
    const parRecette = tasteScore(recipe, buildHouseholdTasteProfile([preference(1, 'recipe', 'IT-001', APPRECIATION.FAVORITE)]), diversity)
    expect(parRecette.total).toBeGreaterThan(parIngredient.total)
  })

  it('ne pèse rien quand personne ne s’est prononcé', () => {
    const profile = buildHouseholdTasteProfile([preference(1, 'ingredient', 'ananas', APPRECIATION.DISLIKED)])
    expect(tasteScore(recipe, profile, diversity).total).toBe(0)
  })

  it('remonte le délai de retour demandé pour ce plat', () => {
    const profile = buildHouseholdTasteProfile([preference(1, 'recipe', 'IT-001', APPRECIATION.LIKED, { repeat_delay_days: 30 })])
    expect(requestedRepeatDelayDays(recipe, profile)).toBe(30)
    expect(requestedRepeatDelayDays(recipe, EMPTY_TASTE_PROFILE)).toBeNull()
  })
})

describe('preferenceFromFeedback — apprentissage après consommation (§6)', () => {
  it('transforme « aimé » en favori et « ne plus proposer » en aversion', () => {
    expect(preferenceFromFeedback({ appreciation: 'loved', canonical_recipe_code: 'IT-001' }))
      .toMatchObject({ appreciation: APPRECIATION.FAVORITE, subject_type: 'recipe', strict: false })
    expect(preferenceFromFeedback({ appreciation: 'never_again', canonical_recipe_code: 'IT-001' }))
      .toMatchObject({ appreciation: APPRECIATION.DISLIKED })
  })

  it('n’apprend rien d’un « acceptable » : il confirme l’existant', () => {
    expect(preferenceFromFeedback({ appreciation: 'acceptable', canonical_recipe_code: 'IT-001' })).toBeNull()
  })

  it('ne crée jamais une contrainte dure depuis un retour', () => {
    expect(preferenceFromFeedback({ appreciation: 'never_again', canonical_recipe_code: 'IT-001' }).strict).toBe(false)
  })

  it('n’invente rien sans recette identifiée', () => {
    expect(preferenceFromFeedback({ appreciation: 'loved' })).toBeNull()
  })
})
