import { describe, expect, it } from 'vitest'
import { formatServingsHuman, formatQuantityHuman } from '@/lib/domain/planning/humanQuantities'

// Lot P5 — Test I (audit §15) : quantités pratiques, portions humaines.
// Règle centrale : le moteur conserve les valeurs exactes en interne, l'écran
// principal affiche une catégorie de portion compréhensible.

describe('formatServingsHuman — barème déterministe', () => {

  // ── Demi-portion (< 0,75) ──────────────────────────────────────────────────
  it('0,5 → ½ portion', () => {
    const { display, exact } = formatServingsHuman(0.5)
    expect(display).toBe('\xBD portion')
    expect(exact).toBe(0.5)
  })

  it('0,25 → ½ portion (valeur inférieure à 0,75)', () => {
    expect(formatServingsHuman(0.25).display).toBe('\xBD portion')
  })

  it('0,6 → ½ portion (inférieur à 0,75)', () => {
    expect(formatServingsHuman(0.6).display).toBe('\xBD portion')
  })

  // ── 1 portion standard (|s - 1| ≤ 0,25) ──────────────────────────────────
  it('0,75 → 1 portion standard (limite basse de la zone 1)', () => {
    const { display, exact } = formatServingsHuman(0.75)
    expect(display).toBe('1 portion standard')
    expect(exact).toBe(0.75)
  })

  it('1,0 → 1 portion standard', () => {
    expect(formatServingsHuman(1).display).toBe('1 portion standard')
  })

  // Test I obligatoire (audit §15) : 1,25 interne → « 1 portion standard »
  it('1,25 → 1 portion standard  [test I]', () => {
    const { display, exact } = formatServingsHuman(1.25)
    expect(display).toBe('1 portion standard')
    expect(exact).toBe(1.25)
  })

  // ── 1 grande portion (1,25 < s < 1,75) ────────────────────────────────────
  it('1,5 → 1 grande portion', () => {
    const { display, exact } = formatServingsHuman(1.5)
    expect(display).toBe('1 grande portion')
    expect(exact).toBe(1.5)
  })

  // ── 2 portions standard (|s - 2| ≤ 0,25) ─────────────────────────────────
  it('1,75 → 2 portions standard', () => {
    expect(formatServingsHuman(1.75).display).toBe('2 portions standard')
  })

  it('2,0 → 2 portions standard', () => {
    const { display, exact } = formatServingsHuman(2)
    expect(display).toBe('2 portions standard')
    expect(exact).toBe(2)
  })

  it('2,25 → 2 portions standard', () => {
    expect(formatServingsHuman(2.25).display).toBe('2 portions standard')
  })

  // ── 2 grandes portions (2,25 < s < 2,75) ─────────────────────────────────
  it('2,5 → 2 grandes portions', () => {
    expect(formatServingsHuman(2.5).display).toBe('2 grandes portions')
  })

  // ── 3 portions standard ───────────────────────────────────────────────────
  it('2,75 → 3 portions standard', () => {
    expect(formatServingsHuman(2.75).display).toBe('3 portions standard')
  })

  it('3,0 → 3 portions standard', () => {
    expect(formatServingsHuman(3).display).toBe('3 portions standard')
  })

  it('4,0 → 4 portions standard', () => {
    expect(formatServingsHuman(4).display).toBe('4 portions standard')
  })

  // ── Valeurs invalides ─────────────────────────────────────────────────────
  it('0 ou négatif → —', () => {
    expect(formatServingsHuman(0).display).toBe('—')
    expect(formatServingsHuman(-1).display).toBe('—')
  })

  it('NaN, undefined → —', () => {
    expect(formatServingsHuman(NaN).display).toBe('—')
    expect(formatServingsHuman(undefined).display).toBe('—')
    expect(formatServingsHuman(null).display).toBe('—')
  })

  // ── L'exact est toujours conservé ─────────────────────────────────────────
  it('exact = valeur d\'entrée non arrondie', () => {
    expect(formatServingsHuman(1.25).exact).toBe(1.25)
    expect(formatServingsHuman(1.5).exact).toBe(1.5)
    expect(formatServingsHuman(0.75).exact).toBe(0.75)
  })
})

describe('formatQuantityHuman — arrondis par unité', () => {

  // ── Grammes ───────────────────────────────────────────────────────────────
  it('83 g → environ 85 g (arrondi à 5 g près)', () => {
    expect(formatQuantityHuman(83, 'g').display).toBe('environ 85 g')
  })

  it('97 g → environ 95 g', () => {
    expect(formatQuantityHuman(97, 'g').display).toBe('environ 95 g')
  })

  it('100 g → environ 100 g (frontière < 1 000, arrondi 10)', () => {
    // 100 n'est pas < 100, donc arrondi à 10 : Math.round(100/10)*10 = 100
    expect(formatQuantityHuman(100, 'g').display).toBe('environ 100 g')
  })

  it('143 g → environ 140 g (arrondi à 10 g)', () => {
    expect(formatQuantityHuman(143, 'g').display).toBe('environ 140 g')
  })

  it('756 g → environ 760 g', () => {
    expect(formatQuantityHuman(756, 'g').display).toBe('environ 760 g')
  })

  it('1 250 g → environ 1,3 kg (arrondi à 50 g, exprimé en kg)', () => {
    const { display } = formatQuantityHuman(1250, 'g')
    // 1250 arrondi à 50g = 1250 → 1250/1000 = 1,25 → "1,3 kg" en fr-FR
    expect(display).toMatch(/environ.*kg/)
  })

  it('1 480 g → environ 1,5 kg', () => {
    const { display } = formatQuantityHuman(1480, 'g')
    expect(display).toMatch(/environ.*kg/)
  })

  // ── Kilogrammes ───────────────────────────────────────────────────────────
  it('0,5 kg → environ 500 g', () => {
    const { display } = formatQuantityHuman(0.5, 'kg')
    expect(display).toBe('environ 500 g')
  })

  it('1,2 kg → exprimé en kg (≥ 1 000 g après arrondi)', () => {
    const { display } = formatQuantityHuman(1.2, 'kg')
    expect(display).toMatch(/kg/)
  })

  // ── Millilitres ───────────────────────────────────────────────────────────
  it('75 ml → environ 75 ml (arrondi à 5)', () => {
    expect(formatQuantityHuman(75, 'ml').display).toBe('environ 75 ml')
  })

  it('320 ml → environ 320 ml', () => {
    expect(formatQuantityHuman(320, 'ml').display).toBe('environ 320 ml')
  })

  it('1 100 ml → environ X l', () => {
    const { display } = formatQuantityHuman(1100, 'ml')
    expect(display).toMatch(/environ.*l/)
    expect(display).not.toMatch(/ml/)
  })

  // ── Centilitres ───────────────────────────────────────────────────────────
  it('25 cl → environ 250 ml', () => {
    expect(formatQuantityHuman(25, 'cl').display).toBe('environ 250 ml')
  })

  // ── Unités comptables ─────────────────────────────────────────────────────
  it('2 œufs (unit=œuf)', () => {
    const { display, exact } = formatQuantityHuman(2, 'œuf', 'œuf')
    expect(display).toBe('2 œuf')
    expect(exact).toBe(2)
  })

  it('1,8 œuf arrondi à 2', () => {
    expect(formatQuantityHuman(1.8, 'oeuf').display).toBe('2 oeuf')
  })

  it('1 pièce', () => {
    expect(formatQuantityHuman(1, 'pièce').display).toBe('1 pièce')
  })

  it('3 tranches', () => {
    expect(formatQuantityHuman(3, 'tranche', 'tranches de pain').display).toBe('3 tranches de pain')
  })

  // ── Sans unité / foodLabel ────────────────────────────────────────────────
  it('sans unité → integer seul', () => {
    expect(formatQuantityHuman(2.4, '').display).toBe('2')
  })

  // ── Exact toujours conservé ───────────────────────────────────────────────
  it('exact = valeur d\'entrée non modifiée', () => {
    expect(formatQuantityHuman(143, 'g').exact).toBe(143)
    expect(formatQuantityHuman(1.25, 'oeuf').exact).toBe(1.25)
  })

  // ── Valeurs invalides ─────────────────────────────────────────────────────
  it('NaN ou négatif → —', () => {
    expect(formatQuantityHuman(NaN, 'g').display).toBe('—')
    expect(formatQuantityHuman(-10, 'g').display).toBe('—')
  })
})
