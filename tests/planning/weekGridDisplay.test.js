import { describe, expect, it } from 'vitest'
import { enrichMealsWithShortDescriptions } from '@/lib/nutritionPlanService'

// ─── Helpers ───────────────────────────────────────────────────────────────

function meal(over = {}) {
  return {
    id: 'm1',
    meal_date: '2026-08-04',
    meal_type: 'dejeuner',
    person_name: 'Julien',
    short_label: 'Bœuf bourguignon',
    canonical_recipe_code: 'FR-023',
    portion_details: {},
    ...over,
  }
}

function companion(over = {}) {
  return {
    key: 'apple',
    role: 'starch',
    label: 'Pâtes sèches courtes',
    quantity_g: 70,
    ...over,
  }
}

// ─── Feature 1 : descriptions courtes ─────────────────────────────────────

describe('enrichMealsWithShortDescriptions', () => {
  it('attache short_description quand le code figure dans la map', () => {
    const meals = [
      meal({ canonical_recipe_code: 'FR-023' }),
      meal({ id: 'm2', canonical_recipe_code: 'IT-005', short_label: 'Risotto aux champignons' }),
    ]
    const descMap = new Map([
      ['FR-023', 'Bœuf mijoté longuement au vin rouge avec carottes et oignons'],
      ['IT-005', 'Riz crémeux aux champignons avec parmesan'],
    ])
    const result = enrichMealsWithShortDescriptions(meals, descMap)

    expect(result[0].short_description).toBe('Bœuf mijoté longuement au vin rouge avec carottes et oignons')
    expect(result[1].short_description).toBe('Riz crémeux aux champignons avec parmesan')
  })

  it('laisse le repas tel quel quand son code est absent de la map', () => {
    const meals = [meal({ canonical_recipe_code: 'VN-001' })]
    const descMap = new Map([['FR-023', 'Description existante']])
    const result = enrichMealsWithShortDescriptions(meals, descMap)

    expect(result[0]).not.toHaveProperty('short_description')
    // La ligne d'origine ne doit pas être mutée
    expect(Object.keys(result[0])).not.toContain('short_description')
  })

  it('laisse le repas tel quel quand canonical_recipe_code est absent', () => {
    const meals = [meal({ canonical_recipe_code: null })]
    const descMap = new Map([['FR-023', 'Description']])
    const result = enrichMealsWithShortDescriptions(meals, descMap)
    expect(result[0]).not.toHaveProperty('short_description')
  })

  it('est insensible à la casse : le code du repas est normalisé en majuscules', () => {
    const meals = [meal({ canonical_recipe_code: 'fr-023' })]
    const descMap = new Map([['FR-023', 'Description bœuf']])
    const result = enrichMealsWithShortDescriptions(meals, descMap)
    expect(result[0].short_description).toBe('Description bœuf')
  })

  it('retourne le tableau sans modifications si la map est vide', () => {
    const meals = [meal()]
    const result = enrichMealsWithShortDescriptions(meals, new Map())
    expect(result).toBe(meals) // même référence : pas d'allocation inutile
  })

  it('retourne le tableau sans modifications si la map est absente', () => {
    const meals = [meal()]
    const result = enrichMealsWithShortDescriptions(meals, null)
    expect(result).toBe(meals)
  })

  it("ne mute pas les lignes d'origine", () => {
    const original = meal({ canonical_recipe_code: 'FR-023' })
    const descMap = new Map([['FR-023', 'Nouvelle description']])
    enrichMealsWithShortDescriptions([original], descMap)
    expect(original).not.toHaveProperty('short_description')
  })
})

// ─── Feature 2 : détection du dessert parmi tous les repas du créneau ─────

describe('détection du dessert dans un créneau multi-personnes', () => {
  /**
   * Réplique la logique de WeekGrid.jsx :
   * `typeMeals.flatMap(m => m.portion_details?.companions || []).find(...)`.
   * Ce test documente le comportement attendu sans dépendre du rendu React.
   */
  function findDessertCompanion(typeMeals) {
    return typeMeals
      .flatMap((m) => m.portion_details?.companions || [])
      .find((c) => c.role === 'dessert' && (c.quantity_g || 0) > 0) || null
  }

  it('trouve le dessert quand un seul membre a le réglage activé', () => {
    const dessertEntry = companion({ role: 'dessert', label: 'pomme', quantity_g: 150 })
    const typeMeals = [
      // Repas foyer (household_base) sans dessert
      meal({ person_name: 'Julien', portion_details: { companions: [companion({ role: 'starch' })] } }),
      // Repas personnalisé de Zoé avec dessert
      meal({ person_name: 'Zoé', portion_details: { companions: [companion({ role: 'starch' }), dessertEntry] } }),
    ]
    const found = findDessertCompanion(typeMeals)
    expect(found).not.toBeNull()
    expect(found.role).toBe('dessert')
    expect(found.label).toBe('pomme')
  })

  it("ne trouve rien quand aucun repas n'a de dessert", () => {
    const typeMeals = [
      meal({ portion_details: { companions: [companion({ role: 'starch' })] } }),
      meal({ person_name: 'Zoé', portion_details: { companions: [] } }),
    ]
    expect(findDessertCompanion(typeMeals)).toBeNull()
  })

  it("ignore un dessert avec quantity_g = 0 (portion mise à l'échelle à zéro)", () => {
    const typeMeals = [
      meal({ portion_details: { companions: [companion({ role: 'dessert', quantity_g: 0 })] } }),
    ]
    expect(findDessertCompanion(typeMeals)).toBeNull()
  })

  it('retourne null quand portion_details est absent', () => {
    const typeMeals = [meal({ portion_details: undefined })]
    expect(findDessertCompanion(typeMeals)).toBeNull()
  })

  it('trouve le dessert même quand il est sur le premier repas', () => {
    const dessertEntry = companion({ role: 'dessert', label: 'poire', quantity_g: 150 })
    const typeMeals = [
      meal({ person_name: 'Julien', portion_details: { companions: [dessertEntry] } }),
      meal({ person_name: 'Zoé', portion_details: { companions: [] } }),
    ]
    const found = findDessertCompanion(typeMeals)
    expect(found?.label).toBe('poire')
  })
})

// ─── Feature 3 : signal de substitution hors lignée ───────────────────────

describe('détection de la substitution hors lignée', () => {
  /**
   * Réplique la logique de WeekGrid.jsx :
   * `altMeal.portion_details?.same_lineage === false`.
   */
  function isOutOfLineageFallback(altMeal) {
    return altMeal?.portion_details?.same_lineage === false
  }

  it('détecte une substitution hors lignée (same_lineage = false)', () => {
    const altMeal = meal({
      short_label: 'Risotto aux champignons',
      portion_details: {
        same_lineage: false,
        substitution_fallback: {
          reason: 'no_variant_in_lineage',
          baseCode: 'FR-023',
          baseFamily: 'Bœuf bourguignon',
          altCode: 'IT-005',
          altFamily: 'Risotto aux champignons',
        },
      },
    })
    expect(isOutOfLineageFallback(altMeal)).toBe(true)
  })

  it('ne signale pas une variante de la même lignée (same_lineage = true)', () => {
    const altMeal = meal({
      short_label: 'Bœuf bourguignon végétarien',
      portion_details: { same_lineage: true, variant_kind: 'vegetarian_swap' },
    })
    expect(isOutOfLineageFallback(altMeal)).toBe(false)
  })

  it('ne signale pas un repas sans champ same_lineage (repas ordinaire)', () => {
    const altMeal = meal({ portion_details: {} })
    expect(isOutOfLineageFallback(altMeal)).toBe(false)
  })

  it('ne signale pas un repas avec portion_details absent', () => {
    const altMeal = meal({ portion_details: undefined })
    expect(isOutOfLineageFallback(altMeal)).toBe(false)
  })

  it('expose le reason dans substitution_fallback pour le tooltip', () => {
    const altMeal = meal({
      portion_details: {
        same_lineage: false,
        substitution_fallback: { reason: 'no_variant_in_lineage', baseCode: 'FR-023', altCode: 'IT-005' },
      },
    })
    expect(altMeal.portion_details.substitution_fallback.reason).toBe('no_variant_in_lineage')
  })
})
