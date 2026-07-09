import { describe, it, expect } from 'vitest'
import { cleanFullNameForCanonical } from '@/lib/ingredientResolver'

/**
 * Tests unitaires pour cleanFullNameForCanonical.
 *
 * Cette fonction pure extrait un nom canonique propre d'un libellé brut
 * de courses (avec quantités, parenthèses, pourcentages, etc.).
 * Elle est le cœur de la voie "fallback nom complet" d'ensureCanonical.
 */
describe('cleanFullNameForCanonical', () => {
  // ── Suppression des parenthèses ──────────────────────────────────────────
  it('supprime le contenu entre parenthèses — "(2 pièces)"', () => {
    expect(cleanFullNameForCanonical('Suprêmes de pintade (2 pièces)')).toBe('Suprêmes de pintade')
  })

  it('supprime les parenthèses avec texte — "(pour le rougail)"', () => {
    expect(cleanFullNameForCanonical('Sauce tomate (pour le rougail)')).toBe('Sauce tomate')
  })

  // ── Suppression des pourcentages ─────────────────────────────────────────
  it('supprime la mention de teneur grasse — "5% MG"', () => {
    expect(cleanFullNameForCanonical('Bœuf haché 5% MG')).toBe('Bœuf haché')
  })

  it('supprime un pourcentage sans sigle — "0%"', () => {
    expect(cleanFullNameForCanonical('Yaourt nature 0%')).toBe('Yaourt nature')
  })

  it('supprime un pourcentage avec sigle deux lettres — "15% MF"', () => {
    expect(cleanFullNameForCanonical('Fromage blanc 15% MF')).toBe('Fromage blanc')
  })

  // ── Suppression de la quantité en tête ──────────────────────────────────
  it('supprime "300 g de" et met en majuscule', () => {
    expect(cleanFullNameForCanonical('300 g de filet de merlu')).toBe('Filet de merlu')
  })

  it('supprime "1,5 kg de"', () => {
    expect(cleanFullNameForCanonical('1,5 kg de pommes de terre')).toBe('Pommes de terre')
  })

  it('supprime un simple entier sans unité ni "de"', () => {
    expect(cleanFullNameForCanonical('2 pintades entières')).toBe('Pintades entières')
  })

  // ── Cas déjà propres ─────────────────────────────────────────────────────
  it('laisse intact un nom déjà propre', () => {
    expect(cleanFullNameForCanonical('Filet de saumon')).toBe('Filet de saumon')
  })

  it('met en majuscule un nom tout en minuscules', () => {
    expect(cleanFullNameForCanonical('poulet rôti')).toBe('Poulet rôti')
  })

  it('ne touche pas à la casse du reste du nom', () => {
    expect(cleanFullNameForCanonical('Lait UHT demi-écrémé')).toBe('Lait UHT demi-écrémé')
  })

  // ── Cas nuls / absurdes ──────────────────────────────────────────────────
  it('retourne null pour une chaîne vide', () => {
    expect(cleanFullNameForCanonical('')).toBeNull()
  })

  it('retourne null pour une chaîne de 2 caractères', () => {
    expect(cleanFullNameForCanonical('AB')).toBeNull()
  })

  it('retourne null pour null', () => {
    expect(cleanFullNameForCanonical(null)).toBeNull()
  })

  it('retourne null pour undefined', () => {
    expect(cleanFullNameForCanonical(undefined)).toBeNull()
  })

  it('retourne null quand le résultat après nettoyage est < 3 caractères', () => {
    // "300 g de x" → après strip quantité → "x" → 1 char → null
    expect(cleanFullNameForCanonical('300 g de x')).toBeNull()
  })

  // ── Combinaisons ─────────────────────────────────────────────────────────
  it('supprime à la fois la quantité et les parenthèses', () => {
    expect(cleanFullNameForCanonical('2 cuisses de poulet (avec peau)')).toBe('Cuisses de poulet')
  })

  it('gère les espaces multiples après nettoyage', () => {
    // "Bœuf  haché" avec double espace → "Bœuf haché"
    expect(cleanFullNameForCanonical('Bœuf  haché 5% MG')).toBe('Bœuf haché')
  })
})
