import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '@/scripts/data/lib/normalize.mjs'
import { canonicalRecipe } from '@/scripts/data/recipes/build-r0.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const corpus = JSON.parse(readFileSync(join(root, 'data', 'recipes', 'r0.json'), 'utf8'))

const clone = (o) => JSON.parse(JSON.stringify(o))
const stepText = (r) => normalizeName(r.steps.map((s) => s.instruction).join(' '))
const ingForms = (r) => r.ingredients.map((i) => normalizeName(i.form || i.food))
const optForm = (o) => (typeof o === 'string' ? o : o.form)
/** Union des formes préférées + toutes les alternatives (comme le loader dérive F0). */
function functionalUnion() {
  const set = new Set()
  for (const r of corpus.recipes) {
    for (const ing of r.ingredients) {
      if (ing.form) set.add(normalizeName(ing.form))
      for (const o of ing.options || []) set.add(normalizeName(optForm(o)))
    }
    for (const ax of r.variation_axes || []) for (const o of ax.options) set.add(normalizeName(o))
    for (const b of r.branches || []) set.add(normalizeName(b.option))
  }
  return set
}

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

  it('la protéine/poisson porte un critère de cuisson (T° à cœur)', () => {
    for (const r of corpus.recipes) {
      const hasProtein = r.components.some((c) => c.role === 'protein')
      if (!hasProtein) continue
      const hasCore = r.steps.some((s) => s.target_core_temperature_c > 0)
      expect(hasCore, `${r.family}: protéine sans T° à cœur`).toBe(true)
    }
  })
})

describe('corpus recette R0 — variantes exécutables (verdict directeur #2)', () => {
  it('validated_options : ≥ 2 options objets, forme préférée incluse, facteur/impact présents', () => {
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        if (ing.requirement_type !== 'validated_options') continue
        expect(Array.isArray(ing.options) && ing.options.length >= 2, `${r.family}: ${ing.food} sans options`).toBe(true)
        expect(ing.options.map(optForm)).toContain(ing.form)
        for (const o of ing.options) {
          expect(typeof o).toBe('object')
          expect(o.quantity_factor > 0, `${r.family}: option ${o.form} sans quantity_factor`).toBe(true)
          expect(typeof o.quality_impact).toBe('number')
        }
      }
    }
  })

  it('toute option qui change la cuisson est BRANCHÉE : branche déclarée + étapes propres', () => {
    for (const r of corpus.recipes) {
      const branchNames = new Set((r.branches || []).map((b) => b.name))
      for (const ing of r.ingredients) {
        for (const o of ing.options || []) {
          if (!o.branch) continue
          expect(branchNames.has(o.branch), `${r.family}: option ${o.form} référence une branche inconnue ${o.branch}`).toBe(true)
          const branchSteps = r.steps.filter((s) => s.branch === o.branch)
          expect(branchSteps.length > 0, `${r.family}: branche ${o.branch} sans étape propre`).toBe(true)
        }
      }
      // toute branche déclarée est référencée par une option ET rattachée à une option d'axe
      for (const b of r.branches || []) {
        const referenced = r.ingredients.some((ing) => (ing.options || []).some((o) => o.branch === b.name))
        expect(referenced, `${r.family}: branche ${b.name} jamais choisie par une option`).toBe(true)
        const axis = (r.variation_axes || []).find((a) => a.name === b.axis)
        expect(axis && axis.options.includes(b.option), `${r.family}: branche ${b.name} sans option d'axe correspondante`).toBe(true)
      }
    }
  })

  it('les morceaux avec os portent un rendement (quantity_factor > 1) et une cuisson distincte', () => {
    const poulet = corpus.recipes.find((r) => /poulet/i.test(r.family))
    const morceau = poulet.ingredients.find((i) => i.requirement_type === 'validated_options')
    const boneIn = morceau.options.find((o) => /avec os/i.test(o.form))
    expect(boneIn.quantity_factor).toBeGreaterThan(1) // désossage
    // 3 morceaux => 3 durées de mijotage distinctes
    const simmer = poulet.steps.filter((s) => s.branch && /mijoter/i.test(s.instruction)).map((s) => s.passive_minutes)
    expect(new Set(simmer).size).toBe(simmer.length)
    expect(simmer.length).toBe(3)
  })

  it('riz blanc et riz complet ont des temps de cuisson distincts (option branchée)', () => {
    const cab = corpus.recipes.find((r) => /cabillaud/i.test(r.family))
    const rizSteps = cab.steps.filter((s) => s.branch && /riz/i.test(s.instruction))
    expect(rizSteps.length).toBe(2)
    expect(new Set(rizSteps.map((s) => s.passive_minutes)).size).toBe(2)
  })
})

describe('corpus recette R0 — assaisonnements et F0', () => {
  it('les assaisonnements chiffrés portent une forme réelle + ajustables au goût', () => {
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        if (ing.requirement_type !== 'seasoning_to_taste') continue
        expect(ing.form, `${r.family}: assaisonnement ${ing.food} sans forme`).toBeTruthy()
        expect(ing.quantity > 0, `${r.family}: assaisonnement ${ing.food} sans quantité de référence`).toBe(true)
        expect(ing.is_optional).toBe(true)
      }
    }
  })

  it('la liste fonctionnelle F0 = UNION préférées + alternatives (verdict directeur #3)', () => {
    const u = functionalUnion()
    // les alternatives omises auparavant y figurent désormais
    for (const f of ['cuisse de poulet crue avec os avec peau', 'blanc de poulet cru sans peau', 'gruyere rape', 'riz complet cru']) {
      expect(u.has(f), `F0 devrait contenir l'alternative « ${f} »`).toBe(true)
    }
    // les assaisonnements (formes réelles) aussi
    expect(u.has('sel fin')).toBe(true)
    expect(u.has('poivre noir moulu')).toBe(true)
    expect(u.size).toBeGreaterThanOrEqual(30)
  })
})

describe('corpus recette R0 — hash de contenu complet (verdict directeur)', () => {
  const base = corpus.recipes[0]
  const h = (r) => canonicalRecipe(r)

  it('le hash change si un champ de contenu change', () => {
    const cases = [
      (r) => { r.meal_role = 'dejeuner' },
      (r) => { r.dish_structure = 'autre' },
      (r) => { r.version.difficulty = 'moyen' },
      (r) => { r.version.prep_minutes = 999 },
      (r) => { r.version.cook_minutes = 999 },
      (r) => { r.components[0].role = 'side' },
      (r) => { r.ingredients[0].strictness = 'required' },
      (r) => { r.ingredients[0].culinary_role = 'autre role' },
      (r) => { r.ingredients.find((i) => i.preparation_note !== undefined || true).preparation_note = 'note ajoutée' },
      (r) => { r.ingredients[0].options[1].quantity_factor = 2 },
      (r) => { r.ingredients[0].options[1].quality_impact = 0.9 },
      (r) => { r.steps[0].active_minutes = 42 },
      (r) => { r.variation_axes[0].selection_mode = 'multiple' },
    ]
    for (const mutate of cases) {
      const m = clone(base)
      mutate(m)
      expect(h(m), `mutation ${mutate.toString()} devrait changer le hash`).not.toBe(h(base))
    }
  })

  it('le hash est stable et indépendant de l\'ordre des options', () => {
    const a = clone(base)
    const b = clone(base)
    b.ingredients[0].options = [...b.ingredients[0].options].reverse()
    expect(h(a)).toBe(h(b))
  })
})
