/**
 * Tests Vitest — corpus recette scraped V1.
 * Réf. MYKO_DATA_FOUNDATION_V2 §8.
 *
 * Lit data/recipes/corpus-v1.json (réel) si présent, sinon le sample.
 * Vérifie :
 *  - Chaque recette a ≥ 1 ingrédient + ≥ 1 étape + les champs canoniques.
 *  - content_hash change quand un champ canonique est modifié.
 *  - content_hash est order-independent pour techniques, variants, allergens.
 *  - Détection des assaisonnements (isSeasoning) sur formes normalisées.
 *  - Aucun doublon de famille (canonical_name_normalized).
 *  - Toutes les recettes sont au statut 'candidate' et confidence ≥ 'B'.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '@/scripts/data/lib/normalize.mjs'
import { canonicalRecipeV1, isSeasoning } from '@/scripts/data/recipes/build-corpus-v1.mjs'

const root       = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const realPath   = join(root, 'data', 'recipes', 'corpus-v1.json')
const samplePath = join(root, 'data', 'recipes', 'corpus-v1.sample.json')
const corpusPath = existsSync(realPath) ? realPath : samplePath
const corpus     = JSON.parse(readFileSync(corpusPath, 'utf8'))

const clone = (o) => JSON.parse(JSON.stringify(o))

// Rang de confiance pour les assertions
const CONF_RANK = { D: 0, C: 1, B: 2, A: 3, 'A+': 4 }
const confRank  = (c) => CONF_RANK[c] ?? -1

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — structure de base', () => {
  it('corpus chargé depuis le bon fichier', () => {
    expect(existsSync(corpusPath)).toBe(true)
    expect(corpus.corpus_version).toBe('scraped-v1')
    expect(Array.isArray(corpus.recipes)).toBe(true)
  })

  it('taille du corpus (72 recettes réelles ou count sample)', () => {
    if (existsSync(realPath)) {
      expect(corpus.recipes.length).toBe(72)
    } else {
      expect(corpus.recipes.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('doctrine : status candidate, min_confidence B', () => {
    expect(corpus.doctrine?.status).toBe('candidate')
    expect(corpus.doctrine?.min_confidence).toBe('B')
  })

  it('chaque recette a les champs obligatoires', () => {
    for (const r of corpus.recipes) {
      const tag = `recette ${r.code ?? r.family}`
      expect(r.family,       `${tag}: family manquant`).toBeTruthy()
      expect(r.code,         `${tag}: code manquant`).toBeTruthy()
      expect(r.category,     `${tag}: category manquant`).toBeTruthy()
      expect(r.confidence,   `${tag}: confidence manquant`).toBeTruthy()
      expect(r.servings,     `${tag}: servings doit être > 0`).toBeGreaterThan(0)
      expect(Array.isArray(r.ingredients), `${tag}: ingredients doit être un tableau`).toBe(true)
      expect(Array.isArray(r.steps),       `${tag}: steps doit être un tableau`).toBe(true)
      expect(Array.isArray(r.techniques),  `${tag}: techniques doit être un tableau`).toBe(true)
      expect(Array.isArray(r.variants),    `${tag}: variants doit être un tableau`).toBe(true)
      expect(Array.isArray(r.allergens),   `${tag}: allergens doit être un tableau`).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — ingrédients et étapes', () => {
  it('chaque recette a ≥ 1 ingrédient et ≥ 1 étape', () => {
    for (const r of corpus.recipes) {
      const tag = `recette ${r.code ?? r.family}`
      expect(r.ingredients.length, `${tag}: ≥ 1 ingrédient requis`).toBeGreaterThanOrEqual(1)
      expect(r.steps.length,       `${tag}: ≥ 1 étape requise`).toBeGreaterThanOrEqual(1)
    }
  })

  it('chaque ingrédient a form, quantity, unit, role, optional', () => {
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        const tag = `recette ${r.code}: ingrédient ${ing.form}`
        expect(ing.form,          `${tag}: form manquant`).toBeTruthy()
        expect(ing.quantity,      `${tag}: quantity doit être > 0`).toBeGreaterThan(0)
        expect(ing.unit,          `${tag}: unit manquant`).toBeTruthy()
        expect(ing.role,          `${tag}: role manquant`).toBeTruthy()
        expect(typeof ing.optional, `${tag}: optional doit être boolean`).toBe('boolean')
      }
    }
  })

  it('chaque étape a n (entier) et instruction (non vide)', () => {
    for (const r of corpus.recipes) {
      for (const s of r.steps) {
        const tag = `recette ${r.code}: étape ${s.n}`
        expect(typeof s.n, `${tag}: n doit être un nombre`).toBe('number')
        expect(Number.isInteger(s.n), `${tag}: n doit être un entier`).toBe(true)
        expect(s.instruction, `${tag}: instruction vide`).toBeTruthy()
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — statut et confiance', () => {
  it('toutes les recettes ont status candidate', () => {
    for (const r of corpus.recipes) {
      expect(r.status, `${r.code}: status doit être candidate`).toBe('candidate')
    }
  })

  it('toutes les recettes ont confidence ≥ B', () => {
    for (const r of corpus.recipes) {
      expect(confRank(r.confidence),
        `${r.code}: confidence ${r.confidence} < B`
      ).toBeGreaterThanOrEqual(confRank('B'))
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — content_hash', () => {
  const base = corpus.recipes[0]

  it('content_hash change quand un champ canonique change', () => {
    const h = (r) => canonicalRecipeV1(r)
    const cases = [
      (r) => { r.family = r.family + ' modifié' },
      (r) => { r.category = 'autre-categorie' },
      (r) => { r.servings = r.servings + 1 },
      (r) => { r.prep_minutes = (r.prep_minutes ?? 0) + 10 },
      (r) => { r.cook_minutes = (r.cook_minutes ?? 0) + 10 },
      (r) => { r.difficulty = r.difficulty === 'facile' ? 'difficile' : 'facile' },
      (r) => { r.ingredients[0].form = 'Nouvelle Forme Modifiée' },
      (r) => { r.ingredients[0].quantity = r.ingredients[0].quantity + 100 },
      (r) => { r.ingredients[0].unit = 'kg' },
      (r) => { r.ingredients[0].role = 'role modifié' },
      (r) => { r.ingredients[0].optional = !r.ingredients[0].optional },
      (r) => { r.steps[0].instruction = r.steps[0].instruction + ' (modifiée)' },
      (r) => { r.techniques = [...r.techniques, 'nouvelle-technique'] },
      (r) => { r.variants   = [...r.variants,   'nouvelle-variante']  },
      (r) => { r.allergens  = [...r.allergens,  'nouveau-allergene']  },
    ]
    for (const mutate of cases) {
      const m = clone(base)
      mutate(m)
      expect(h(m), `mutation ${mutate.toString()} devrait changer le hash`).not.toBe(h(base))
    }
  })

  it('content_hash est order-independent pour techniques, variants, allergens', () => {
    // Les listes doivent être TRIÉES dans la repr. canonique
    // Deux recettes identiques avec listes inversées → même hash
    const a = clone(base)
    const b = clone(base)
    if (a.techniques.length >= 2) {
      b.techniques = [...a.techniques].reverse()
      expect(canonicalRecipeV1(a)).toBe(canonicalRecipeV1(b))
    }
    if (a.variants.length >= 2) {
      b.variants = [...a.variants].reverse()
      expect(canonicalRecipeV1(a)).toBe(canonicalRecipeV1(b))
    }
    if (a.allergens.length >= 2) {
      b.allergens = [...a.allergens].reverse()
      expect(canonicalRecipeV1(a)).toBe(canonicalRecipeV1(b))
    }
  })

  it('le corpus entier a des hashes de contenu distincts (pas de doublon)', () => {
    const hashes = corpus.recipes.map(canonicalRecipeV1)
    const unique = new Set(hashes)
    expect(unique.size).toBe(hashes.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — détection des assaisonnements', () => {
  it('Sel fin et Poivre noir moulu détectés comme assaisonnements', () => {
    expect(isSeasoning(normalizeName('Sel fin'))).toBe(true)
    expect(isSeasoning(normalizeName('Poivre noir moulu'))).toBe(true)
    expect(isSeasoning(normalizeName('Sel de Guérande'))).toBe(true)
    expect(isSeasoning(normalizeName('Piment d\'Espelette'))).toBe(true)
    expect(isSeasoning(normalizeName('Curcuma moulu'))).toBe(true)
    expect(isSeasoning(normalizeName('Noix de muscade'))).toBe(true)
    expect(isSeasoning(normalizeName('Paprika fumé'))).toBe(true)
  })

  it('ingrédients non-assaisonnements non détectés', () => {
    expect(isSeasoning(normalizeName('Carotte crue'))).toBe(false)
    expect(isSeasoning(normalizeName('Beurre doux'))).toBe(false)
    expect(isSeasoning(normalizeName('Oignon jaune cru'))).toBe(false)
    expect(isSeasoning(normalizeName('Persil frais'))).toBe(false)
    expect(isSeasoning(normalizeName('Lard fumé'))).toBe(false)
  })

  it('dans le corpus, tout ingrédient optional + form seasoning est repérable', () => {
    // Au moins un ingrédient optional/seasoning dans le corpus entier
    let found = false
    for (const r of corpus.recipes) {
      for (const ing of r.ingredients) {
        if (ing.optional && isSeasoning(normalizeName(ing.form || ''))) {
          found = true
          break
        }
      }
      if (found) break
    }
    expect(found, 'Aucun assaisonnement optional détecté dans le corpus').toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — unicité des familles', () => {
  it('aucun doublon de canonical_name_normalized parmi les familles', () => {
    const norms = corpus.recipes.map((r) => normalizeName(r.family))
    const unique = new Set(norms)
    // Trouver les doublons pour les afficher en cas d'échec
    const duplicates = norms.filter((n, i) => norms.indexOf(n) !== i)
    expect(unique.size, `Familles dupliquées : ${duplicates.join(', ')}`).toBe(norms.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('corpus-v1 — intégrité du corpus', () => {
  it('steps ordonnées : numéros de step > 0 et uniques par recette', () => {
    for (const r of corpus.recipes) {
      const nums = r.steps.map((s) => s.n)
      const unique = new Set(nums)
      expect(unique.size, `${r.code}: numéros d'étapes dupliqués`).toBe(nums.length)
      expect(Math.min(...nums), `${r.code}: step_number doit être ≥ 1`).toBeGreaterThanOrEqual(1)
    }
  })

  it('forms_order count ≥ nombre de recettes (si présent)', () => {
    if (corpus.forms_order && corpus.forms_order.length > 0) {
      expect(corpus.forms_order.length).toBeGreaterThanOrEqual(corpus.recipes.length)
    }
  })
})
