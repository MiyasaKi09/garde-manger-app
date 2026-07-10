import { describe, it, expect } from 'vitest'
import { reviewStatusFor, isRecipeLinkComplete } from '@/lib/ingredientResolver'

/**
 * Tests unitaires Vague 2 — Liaisons (confiance & complétude).
 *
 * reviewStatusFor : seuils de confiance → statut de revue.
 *   >= 0.9      → 'auto'
 *   0.65 … <0.9 → 'proposed'
 *   < 0.65      → 'pending'
 *   auto-créé   → 'pending' (quel que soit le score)
 *
 * isRecipeLinkComplete : prédicat de complétude d'une liaison recette
 * (compte de lignes >= compte JSONB source, aucune ligne unmatched non confirmée).
 */

describe('reviewStatusFor', () => {
  // ── Seuils nominaux ──────────────────────────────────────────────────────
  it("0.95 → 'auto' (liaison fiable)", () => {
    expect(reviewStatusFor(0.95)).toBe('auto')
  })

  it("0.8 → 'proposed' (liaison plausible)", () => {
    expect(reviewStatusFor(0.8)).toBe('proposed')
  })

  it("0.5 → 'pending' (liaison douteuse)", () => {
    expect(reviewStatusFor(0.5)).toBe('pending')
  })

  // ── Bornes exactes ───────────────────────────────────────────────────────
  it("0.9 exactement → 'auto' (borne incluse)", () => {
    expect(reviewStatusFor(0.9)).toBe('auto')
  })

  it("0.65 exactement → 'proposed' (borne incluse)", () => {
    expect(reviewStatusFor(0.65)).toBe('proposed')
  })

  it("0.649 → 'pending' (juste sous le seuil)", () => {
    expect(reviewStatusFor(0.649)).toBe('pending')
  })

  it("1 → 'auto' ; 0 → 'pending' (extrémités de [0,1])", () => {
    expect(reviewStatusFor(1)).toBe('auto')
    expect(reviewStatusFor(0)).toBe('pending')
  })

  // ── Auto-création : toujours pending ─────────────────────────────────────
  it("canonique auto-créé → 'pending' même avec une confiance élevée", () => {
    expect(reviewStatusFor(0.95, true)).toBe('pending')
    expect(reviewStatusFor(0.5, true)).toBe('pending')
    expect(reviewStatusFor(0, true)).toBe('pending')
  })

  // ── Entrées dégénérées ───────────────────────────────────────────────────
  it("confiance non numérique (null / undefined / NaN) → 'pending'", () => {
    expect(reviewStatusFor(null)).toBe('pending')
    expect(reviewStatusFor(undefined)).toBe('pending')
    expect(reviewStatusFor(NaN)).toBe('pending')
  })
})

describe('isRecipeLinkComplete', () => {
  const row = (match_status, review_status = null) => ({ match_status, review_status })

  // ── Couverture du compte source ──────────────────────────────────────────
  it('moins de lignes que le JSONB source → incomplet', () => {
    expect(isRecipeLinkComplete(3, [row('canonical'), row('stock')])).toBe(false)
  })

  it('aucune ligne pour une recette avec ingrédients → incomplet', () => {
    expect(isRecipeLinkComplete(2, [])).toBe(false)
  })

  it('autant de lignes que le source, toutes liées → complet', () => {
    expect(isRecipeLinkComplete(2, [row('canonical'), row('stock')])).toBe(true)
  })

  it('plus de lignes que le source (dédoublement historique) → complet', () => {
    expect(isRecipeLinkComplete(1, [row('canonical'), row('archetype')])).toBe(true)
  })

  it('recette sans ingrédients JSONB → complet (rien à lier)', () => {
    expect(isRecipeLinkComplete(0, [])).toBe(true)
  })

  // ── Lignes unmatched ─────────────────────────────────────────────────────
  it('une ligne unmatched non confirmée → incomplet', () => {
    expect(isRecipeLinkComplete(2, [row('canonical'), row('unmatched', 'pending')])).toBe(false)
  })

  it('une ligne unmatched avec review_status NULL (pré-migration) → incomplet', () => {
    expect(isRecipeLinkComplete(2, [row('canonical'), row('unmatched')])).toBe(false)
  })

  it("une ligne unmatched CONFIRMÉE par l'utilisateur → complet", () => {
    expect(isRecipeLinkComplete(2, [row('canonical'), row('unmatched', 'confirmed')])).toBe(true)
  })

  // ── Entrées dégénérées ───────────────────────────────────────────────────
  it('rows non-tableau → traité comme vide (complet ssi sourceCount = 0)', () => {
    expect(isRecipeLinkComplete(0, null)).toBe(true)
    expect(isRecipeLinkComplete(1, null)).toBe(false)
  })

  it('sourceCount non numérique → traité comme 0', () => {
    expect(isRecipeLinkComplete(null, [])).toBe(true)
    expect(isRecipeLinkComplete(undefined, [row('canonical')])).toBe(true)
  })
})
