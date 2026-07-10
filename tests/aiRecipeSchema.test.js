import { describe, it, expect } from 'vitest'
import { validateGeneratedRecipe } from '@/lib/aiRecipeSchema'

function baseRecipe(overrides = {}) {
  return {
    title: 'Poulet rôti aux herbes',
    description: 'Un classique du dimanche',
    servings: 2,
    prep_min: 15,
    cook_min: 45,
    ingredients: [
      { name: 'Poulet', quantity: 500, unit: 'g', notes: '' },
      { name: 'Thym', quantity: null, unit: '', notes: 'quelques branches' },
    ],
    steps: [
      { step_no: 1, instruction: 'Préchauffer: four à 200°C', duration_min: null },
      { step_no: 2, instruction: 'Rôtir: enfourner le poulet', duration_min: 45 },
    ],
    chef_tips: 'Arroser régulièrement',
    nutrition_per_serving: { kcal: 450, protein_g: 35, carbs_g: 5, fat_g: 30, fiber_g: 1 },
    ...overrides,
  }
}

describe('validateGeneratedRecipe — cas valides', () => {
  it('laisse passer une recette valide sans erreur ni modification', () => {
    const res = validateGeneratedRecipe(baseRecipe())
    expect(res.ok).toBe(true)
    expect(res.errors).toEqual([])
    expect(res.value.title).toBe('Poulet rôti aux herbes')
    expect(res.value.servings).toBe(2)
    expect(res.value.ingredients).toHaveLength(2)
    expect(res.value.ingredients[1].quantity).toBeNull()
    expect(res.value.steps).toEqual([
      { step_no: 1, instruction: 'Préchauffer: four à 200°C', duration_min: null },
      { step_no: 2, instruction: 'Rôtir: enfourner le poulet', duration_min: 45 },
    ])
    expect(res.value.nutrition_per_serving).toEqual({
      kcal: 450, protein_g: 35, carbs_g: 5, fat_g: 30, fiber_g: 1,
    })
  })

  it('trim les chaînes (title, name, unit, notes, instruction)', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      title: '  Gratin dauphinois  ',
      ingredients: [{ name: '  Pomme de terre ', quantity: 800, unit: ' g ', notes: ' bien fermes ' }],
      steps: [{ step_no: 1, instruction: '  Éplucher les pommes de terre  ', duration_min: 10 }],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.title).toBe('Gratin dauphinois')
    expect(res.value.ingredients[0]).toMatchObject({
      name: 'Pomme de terre', unit: 'g', notes: 'bien fermes',
    })
    expect(res.value.steps[0].instruction).toBe('Éplucher les pommes de terre')
  })

  it('tronque un titre > 200 caractères en le signalant (réparable)', () => {
    const res = validateGeneratedRecipe(baseRecipe({ title: 'x'.repeat(250) }))
    expect(res.ok).toBe(true)
    expect(res.value.title).toHaveLength(200)
    expect(res.errors.some(e => e.startsWith('title'))).toBe(true)
  })
})

describe('validateGeneratedRecipe — servings', () => {
  it('coerce une chaîne numérique et arrondit un flottant', () => {
    expect(validateGeneratedRecipe(baseRecipe({ servings: '4' })).value.servings).toBe(4)
    expect(validateGeneratedRecipe(baseRecipe({ servings: 3.7 })).value.servings).toBe(4)
  })

  it('retombe sur 2 (avec erreur) hors bornes 1-24 ou non numérique', () => {
    const zero = validateGeneratedRecipe(baseRecipe({ servings: 0 }))
    expect(zero.value.servings).toBe(2)
    expect(zero.errors.some(e => e.startsWith('servings'))).toBe(true)

    const huge = validateGeneratedRecipe(baseRecipe({ servings: 100 }))
    expect(huge.value.servings).toBe(2)

    const bad = validateGeneratedRecipe(baseRecipe({ servings: 'beaucoup' }))
    expect(bad.value.servings).toBe(2)
    expect(bad.errors.some(e => e.startsWith('servings'))).toBe(true)
  })
})

describe('validateGeneratedRecipe — ingrédients', () => {
  it('coerce les quantités en chaîne ("12,5" → 12.5)', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      ingredients: [
        { name: 'Crème', quantity: '12,5', unit: 'cl' },
        { name: 'Beurre', quantity: ' 30 ', unit: 'g' },
      ],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.ingredients[0].quantity).toBe(12.5)
    expect(res.value.ingredients[1].quantity).toBe(30)
  })

  it('rejette ligne par ligne les quantités négatives ou nulles (0), garde les autres', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      ingredients: [
        { name: 'Poulet', quantity: 500, unit: 'g' },
        { name: 'Sel', quantity: -5, unit: 'g' },
        { name: 'Poivre', quantity: 0, unit: 'g' },
      ],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.ingredients).toHaveLength(1)
    expect(res.value.ingredients[0].name).toBe('Poulet')
    expect(res.errors.filter(e => e.includes('quantité ≤ 0'))).toHaveLength(2)
  })

  it('supprime les lignes sans nom et laisse quantity null quand absente', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      ingredients: [
        { name: '   ', quantity: 100, unit: 'g' },
        { name: 'Thym' },
        null,
      ],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.ingredients).toHaveLength(1)
    expect(res.value.ingredients[0]).toEqual({ name: 'Thym', quantity: null, unit: '', notes: '' })
  })
})

describe('validateGeneratedRecipe — étapes', () => {
  it('renumérote les step_no séquentiellement (1..n)', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      steps: [
        { step_no: 5, instruction: 'Étape A', duration_min: null },
        { step_no: 2, instruction: 'Étape B', duration_min: 10 },
        { step_no: 9, instruction: 'Étape C', duration_min: null },
      ],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.steps.map(s => s.step_no)).toEqual([1, 2, 3])
    expect(res.errors.some(e => e.includes('renumérot'))).toBe(true)
  })

  it('supprime les étapes sans instruction et met à null une duration_min invalide', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      steps: [
        { step_no: 1, instruction: '', duration_min: 5 },
        { step_no: 2, instruction: 'Cuire', duration_min: -3 },
        { step_no: 3, instruction: 'Servir', duration_min: '15' },
      ],
    }))
    expect(res.ok).toBe(true)
    expect(res.value.steps).toHaveLength(2)
    expect(res.value.steps[0]).toMatchObject({ step_no: 1, instruction: 'Cuire', duration_min: null })
    expect(res.value.steps[1]).toMatchObject({ step_no: 2, instruction: 'Servir', duration_min: 15 })
  })
})

describe('validateGeneratedRecipe — irréparable (ok=false, value=null)', () => {
  it('refuse sans titre', () => {
    const res = validateGeneratedRecipe(baseRecipe({ title: '   ' }))
    expect(res.ok).toBe(false)
    expect(res.value).toBeNull()
    expect(res.errors.some(e => e.startsWith('title'))).toBe(true)
  })

  it('refuse quand aucun ingrédient valide ne subsiste', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      ingredients: [{ name: '' }, { name: '  ' }, 'pas un objet'],
    }))
    expect(res.ok).toBe(false)
    expect(res.value).toBeNull()
  })

  it('refuse quand aucune étape valide ne subsiste, et refuse un non-objet', () => {
    const noSteps = validateGeneratedRecipe(baseRecipe({ steps: [] }))
    expect(noSteps.ok).toBe(false)
    expect(noSteps.value).toBeNull()

    expect(validateGeneratedRecipe(null).ok).toBe(false)
    expect(validateGeneratedRecipe('recette').ok).toBe(false)
    expect(validateGeneratedRecipe([1, 2]).ok).toBe(false)
  })
})

describe('validateGeneratedRecipe — nutrition et chef_tips', () => {
  it('coerce les chaînes numériques, rejette les négatifs → null, tolère les champs absents', () => {
    const res = validateGeneratedRecipe(baseRecipe({
      nutrition_per_serving: { kcal: '450', protein_g: -10, carbs_g: '38,5', fat_g: null },
    }))
    expect(res.ok).toBe(true)
    expect(res.value.nutrition_per_serving).toEqual({
      kcal: 450, protein_g: null, carbs_g: 38.5, fat_g: null, fiber_g: null,
    })
    expect(res.errors.some(e => e.includes('protein_g'))).toBe(true)
  })

  it('nutrition non-objet → null ; chef_tips vide → null, long → tronqué à 1000', () => {
    const bad = validateGeneratedRecipe(baseRecipe({ nutrition_per_serving: 'environ 450 kcal' }))
    expect(bad.ok).toBe(true)
    expect(bad.value.nutrition_per_serving).toBeNull()

    const tips = validateGeneratedRecipe(baseRecipe({ chef_tips: '  ' }))
    expect(tips.value.chef_tips).toBeNull()

    const long = validateGeneratedRecipe(baseRecipe({ chef_tips: 'a'.repeat(1200) }))
    expect(long.value.chef_tips).toHaveLength(1000)
    expect(long.errors.some(e => e.startsWith('chef_tips'))).toBe(true)
  })
})
