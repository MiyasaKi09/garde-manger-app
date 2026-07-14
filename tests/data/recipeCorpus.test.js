import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '@/scripts/data/lib/normalize.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const corpus = JSON.parse(readFileSync(join(root, 'data', 'recipes', 'r0.json'), 'utf8'))

const stepText = (r) => normalizeName(r.steps.map((s) => s.instruction).join(' '))
const ingFoods = (r) => r.ingredients.map((i) => normalizeName(i.food))
const ingForms = (r) => r.ingredients.map((i) => normalizeName(i.form || i.food))

describe('corpus recette R0 — structure', () => {
  it('source éditoriale rights-clean (CC0)', () => {
    expect(corpus.source.license).toBe('cc0-1.0')
    expect(corpus.source.rights).toBe('own_content')
  })

  it('chaque recette structurée + ingrédient rattaché à un composant déclaré', () => {
    expect(corpus.recipes.length).toBeGreaterThanOrEqual(8)
    for (const r of corpus.recipes) {
      expect(r.family && r.version.servings > 0 && r.components.length && r.ingredients.length && r.steps.length).toBeTruthy()
      const comps = new Set(r.components.map((c) => c.name))
      for (const ing of r.ingredients) {
        if (ing.component) expect(comps.has(ing.component)).toBe(true)
        expect(ing.form, `ingrédient ${ing.food} de ${r.family} sans forme explicite`).toBeTruthy()
      }
      const nums = r.steps.map((s) => s.n)
      expect(nums).toEqual([...nums].sort((a, b) => a - b))
    }
  })
})

describe('corpus recette R0 — qualité culinaire (verdict directeur)', () => {
  it('tout ingrédient nommé dans une étape figure dans les ingrédients', () => {
    const media = ['huile', 'beurre', 'vin', 'creme', 'lait', 'moutarde', 'citron', 'ail', 'oignon', 'vinaigre', 'persil']
    for (const r of corpus.recipes) {
      const txt = stepText(r)
      const foods = ingForms(r).join(' ')
      for (const m of media) {
        if (new RegExp(`\\b${m}`).test(txt)) {
          expect(new RegExp(m).test(foods), `${r.family}: étape mentionne « ${m} » mais absent des ingrédients`).toBe(true)
        }
      }
    }
  })

  it('cohérence cru/cuit : un ingrédient déjà cuit n\'est pas re-cuit', () => {
    for (const r of corpus.recipes) {
      const cooks = /\b(cuire|mijoter|poeler|saisir|four|bouillante)\b/.test(stepText(r))
      if (!cooks) continue
      for (const ing of r.ingredients) {
        if (ing.strictness !== 'required') continue
        const f = normalizeName(ing.form || '')
        // pois chiche cuit (salade froide, sans cuisson) est le seul cas légitime
        if (/cuit|bouilli/.test(f)) {
          expect(/pois chiche/.test(f), `${r.family}: ingrédient déjà cuit « ${ing.form} » dans une recette qui cuit`).toBe(true)
        }
      }
    }
  })

  it('matière grasse de cuisson présente quand une étape saisit/poêle/fait suer', () => {
    for (const r of corpus.recipes) {
      if (/\b(saisir|poeler|suer|dans l huile|dans le beurre|beurre mousseux|arroser)\b/.test(stepText(r))) {
        const foods = ingForms(r).join(' ')
        expect(/huile|beurre/.test(foods), `${r.family}: cuisson en matière grasse sans huile ni beurre`).toBe(true)
      }
    }
  })

  it('les validated_options portent au moins deux options explicites', () => {
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        if (ing.requirement_type === 'validated_options') {
          expect(Array.isArray(ing.options) && ing.options.length >= 2,
            `${r.family}: validated_options « ${ing.food} » sans options`).toBe(true)
          // la forme préférée fait partie des options
          expect(ing.options.includes(ing.form)).toBe(true)
        }
      }
    }
  })

  it('la protéine/poisson porte un critère de cuisson (T° à cœur)', () => {
    for (const r of corpus.recipes) {
      const hasProtein = r.components.some((c) => c.role === 'protein')
      if (!hasProtein) continue
      const hasCore = r.steps.some((s) => s.target_core_temperature_c > 0)
      expect(hasCore, `${r.family}: protéine sans T° à cœur`).toBe(true)
    }
  })

  it('la liste fonctionnelle F0 se dérive des formes exactes requises', () => {
    const forms = new Set()
    for (const r of corpus.recipes) for (const ing of r.ingredients) {
      if (ing.requirement_type !== 'seasoning_to_taste') forms.add(normalizeName(ing.form))
    }
    expect(forms.size).toBeGreaterThanOrEqual(18)
    expect(forms.has('lentille verte seche crue')).toBe(true)
    expect(forms.has('haricot vert cru')).toBe(true)
    expect(forms.has('oeuf cru')).toBe(true)
  })
})
