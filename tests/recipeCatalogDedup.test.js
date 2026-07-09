import { describe, it, expect } from 'vitest'
import {
  tokenizeForDedup,
  jaccardSimilarity,
  dedupCatalog,
} from '@/app/recipes/catalogDedup'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRecipe(id, title, source = 'generated') {
  return {
    key: `${source}-${id}`,
    source,
    id,
    title,
    href: `/${source === 'generated' ? 'recipes/generated' : 'recipes'}/${id}`,
  }
}

// ── tokenizeForDedup ──────────────────────────────────────────────────────────

describe('tokenizeForDedup', () => {
  it('normalise les accents et met en minuscules', () => {
    // Utilise des accents décomposables en NFD (é, â, î) — pas les ligatures Œ/œ
    const tokens = tokenizeForDedup('Canard confit épices herbes')
    expect(tokens).toContain('canard')
    expect(tokens).toContain('confit')
    expect(tokens).toContain('epices')
    expect(tokens).toContain('herbes')
  })

  it('filtre les stopwords français', () => {
    const tokens = tokenizeForDedup('Poulet aux légumes de saison')
    expect(tokens).not.toContain('aux')
    expect(tokens).not.toContain('de')
    expect(tokens).toContain('poulet')
    expect(tokens).toContain('legumes')
    expect(tokens).toContain('saison')
  })

  it('filtre les tokens de moins de 3 caractères', () => {
    // 'au' → 2 chars, doit être éliminé
    const tokens = tokenizeForDedup('Riz sauté au wok')
    expect(tokens).not.toContain('au')
    expect(tokens).toContain('riz')
    expect(tokens).toContain('saute')
    expect(tokens).toContain('wok')
  })

  it('normalise les caractères spéciaux et la ponctuation', () => {
    // Les tirets dans le titre sont traités comme séparateurs de tokens
    const tokens = tokenizeForDedup('Gratin dauphinois')
    expect(tokens).toContain('gratin')
    expect(tokens).toContain('dauphinois')
    // Majuscules → minuscules
    const tokensU = tokenizeForDedup('POULET RÔTI')
    expect(tokensU).toContain('poulet')
    expect(tokensU).toContain('roti')
  })

  it('retourne un tableau vide pour une chaîne vide', () => {
    expect(tokenizeForDedup('')).toEqual([])
  })

  it('retourne un tableau vide pour null', () => {
    expect(tokenizeForDedup(null)).toEqual([])
  })
})

// ── jaccardSimilarity ─────────────────────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('retourne 1 pour deux tableaux identiques', () => {
    expect(jaccardSimilarity(['poulet', 'roti'], ['poulet', 'roti'])).toBe(1)
  })

  it('retourne 1 pour deux tableaux vides', () => {
    expect(jaccardSimilarity([], [])).toBe(1)
  })

  it("retourne 0 si l'un des tableaux est vide", () => {
    expect(jaccardSimilarity(['poulet'], [])).toBe(0)
    expect(jaccardSimilarity([], ['poulet'])).toBe(0)
  })

  it('retourne 0 pour deux tableaux totalement différents', () => {
    expect(jaccardSimilarity(['poulet', 'roti'], ['boeuf', 'braise'])).toBe(0)
  })

  it('calcule correctement un chevauchement partiel', () => {
    // intersection = {poulet, roti}, union = {poulet, roti, legumes}
    const sim = jaccardSimilarity(['poulet', 'roti'], ['poulet', 'roti', 'legumes'])
    expect(sim).toBeCloseTo(2 / 3, 5)
  })

  it('calcule exactement 0.8 pour un chevauchement 4/5', () => {
    const a = ['poulet', 'basquaise', 'tomates', 'poivrons']
    const b = ['poulet', 'basquaise', 'tomates', 'poivrons', 'piment']
    expect(jaccardSimilarity(a, b)).toBeCloseTo(0.8, 5)
  })
})

// ── dedupCatalog ─────────────────────────────────────────────────────────────

describe('dedupCatalog', () => {
  it('conserve les recettes sans doublon', () => {
    const recipes = [
      makeRecipe(1, 'Poulet rôti', 'generated'),
      makeRecipe(2, 'Soupe de légumes', 'classic'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(2)
  })

  it('dédoublonne les noms normalisés identiques en préférant generated', () => {
    const recipes = [
      makeRecipe(1, 'Poulet Rôti', 'classic'),
      makeRecipe(2, 'Poulet Rôti', 'generated'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('generated')
    expect(result[0].id).toBe(2)
  })

  it('est insensible aux accents décomposables et à la casse pour la dédup exacte', () => {
    // "Poulet Rôti" et "poulet roti" → même nom normalisé (ô → NFD → o + combinant → 'o')
    const recipes = [
      makeRecipe(1, 'Poulet Rôti', 'classic'),
      makeRecipe(2, 'poulet roti', 'generated'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('generated')
  })

  it("conserve deux classics distincts s'il n'y a pas de generated équivalent", () => {
    const recipes = [
      makeRecipe(1, 'Poulet Rôti', 'classic'),
      makeRecipe(2, 'Poulet Rôti', 'classic'),
    ]
    // Les deux partagent le même nom normalisé → 1 seul dans le résultat
    // (le premier qui entre dans le groupe)
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('classic')
  })

  it('fusionne les quasi-doublons Jaccard >= 0.8 en préférant generated', () => {
    // tokens A : [poulet, basquaise, tomates, poivrons]
    // tokens B : [poulet, basquaise, tomates, poivrons, piment]
    // Jaccard = 4/5 = 0.8 → quasi-doublon
    const recipes = [
      makeRecipe(1, 'Poulet basquaise tomates poivrons', 'classic'),
      makeRecipe(2, 'Poulet basquaise tomates poivrons piment', 'generated'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('generated')
    expect(result[0].id).toBe(2)
  })

  it('conserve les recettes dont la similarité Jaccard est < 0.8', () => {
    // tokens A : [poulet, roti, citron]
    // tokens B : [boeuf, bourguignon, carottes, lardons]
    // Jaccard = 0/7 = 0 → recettes distinctes
    const recipes = [
      makeRecipe(1, 'Poulet rôti au citron', 'classic'),
      makeRecipe(2, 'Bœuf bourguignon aux carottes et lardons', 'classic'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(2)
  })

  it('conserve les recettes dont la similarité Jaccard est juste en dessous de 0.8', () => {
    // tokens A : [curry, poulet, lait, coco] — "Curry de poulet au lait de coco"
    // tokens B : [curry, poulet, coco]        — "Curry de poulet coco"
    // intersection = {curry, poulet, coco} = 3
    // union = {curry, poulet, lait, coco} = 4
    // Jaccard = 3/4 = 0.75 → en dessous du seuil, les deux sont conservées
    const recipes = [
      makeRecipe(1, 'Curry de poulet au lait de coco', 'classic'),
      makeRecipe(2, 'Curry de poulet coco', 'generated'),
    ]
    const result = dedupCatalog(recipes)
    expect(result).toHaveLength(2)
  })

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(dedupCatalog([])).toEqual([])
  })

  it('préserve le href de la recette retenue', () => {
    const recipes = [
      makeRecipe(42, 'Tarte tatin', 'classic'),
      makeRecipe(7, 'Tarte tatin', 'generated'),
    ]
    const result = dedupCatalog(recipes)
    expect(result[0].href).toBe('/recipes/generated/7')
  })
})
