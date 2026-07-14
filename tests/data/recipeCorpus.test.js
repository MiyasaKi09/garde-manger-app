import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '@/scripts/data/lib/normalize.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const corpus = JSON.parse(readFileSync(join(root, 'data', 'recipes', 'r0.json'), 'utf8'))

describe('corpus recette R0', () => {
  it('source éditoriale rights-clean (CC0, contenu propre)', () => {
    expect(corpus.source.license).toBe('cc0-1.0')
    expect(corpus.source.rights).toBe('own_content')
  })

  it('chaque recette est structurée (famille, version, composants, ingrédients, étapes)', () => {
    expect(corpus.recipes.length).toBeGreaterThanOrEqual(8)
    for (const r of corpus.recipes) {
      expect(r.family).toBeTruthy()
      expect(r.version.servings).toBeGreaterThan(0)
      expect(r.components.length).toBeGreaterThan(0)
      expect(r.ingredients.length).toBeGreaterThan(0)
      expect(r.steps.length).toBeGreaterThan(0)
      // chaque ingrédient référence un composant déclaré (ou aucun, ex. assaisonnement)
      const comps = new Set(r.components.map((c) => c.name))
      for (const ing of r.ingredients) {
        if (ing.component) expect(comps.has(ing.component)).toBe(true)
        expect(['exact_form', 'validated_options', 'functional_requirement', 'sub_recipe', 'seasoning_to_taste'])
          .toContain(ing.requirement_type)
      }
      // étapes numérotées séquentiellement
      const nums = r.steps.map((s) => s.n)
      expect(nums).toEqual([...nums].sort((a, b) => a - b))
    }
  })

  it('la liste fonctionnelle F0 se dérive des ingrédients (union normalisée)', () => {
    const foods = new Set()
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        if (ing.requirement_type !== 'seasoning_to_taste') foods.add(normalizeName(ing.food))
      }
    }
    // F0 fonctionnel = ce que les recettes utilisent réellement (pas une liste arbitraire)
    expect(foods.size).toBeGreaterThanOrEqual(15)
    expect(foods.has('haut de cuisse de poulet')).toBe(true)
    expect(foods.has('lentille verte')).toBe(true)
    expect(foods.has('pomme de terre')).toBe(true)
  })

  it('la recette canonique poulet moutarde purée porte des axes de variation', () => {
    const poulet = corpus.recipes.find((r) => /moutarde/.test(normalizeName(r.family)))
    expect(poulet).toBeTruthy()
    expect(poulet.variation_axes.some((a) => a.name === 'morceau')).toBe(true)
  })
})
