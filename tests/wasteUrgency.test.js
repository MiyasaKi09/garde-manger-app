/**
 * Tests — Scoring d'urgence anti-gaspillage avec distinction DLC / DDM
 *
 * Valide :
 * 1. getUrgencyLevelForKind() pour les deux kinds
 * 2. calculateUrgencyScore() avec les bonus ouverts/quantité
 * 3. Export de URGENCY_LEVELS (labels et couleurs intacts)
 */
import { describe, it, expect } from 'vitest';
import {
  URGENCY_LEVELS,
  getUrgencyLevel,
  getUrgencyLevelForKind,
  calculateUrgencyScore,
} from '@/lib/wastePreventionService';

// ── Niveaux URGENCY_LEVELS ──────────────────────────────────────────────────

describe('URGENCY_LEVELS', () => {
  it('expose les 6 niveaux attendus par RestesManager', () => {
    const labels = Object.values(URGENCY_LEVELS).map(l => l.label);
    expect(labels).toContain('CRITIQUE');
    expect(labels).toContain('URGENT');
    expect(labels).toContain('ATTENTION');
    expect(labels).toContain('BIENTÔT');
    expect(labels).toContain('NORMAL');
    expect(labels).toContain('FRAIS');
  });

  it('score CRITIQUE = 100, FRAIS = 0', () => {
    expect(URGENCY_LEVELS.CRITICAL.score).toBe(100);
    expect(URGENCY_LEVELS.FRESH.score).toBe(0);
  });
});

// ── getUrgencyLevel (alias DLC) ─────────────────────────────────────────────

describe('getUrgencyLevel (DLC strict, sans kind)', () => {
  it('daysLeft null → NORMAL', () => {
    expect(getUrgencyLevel(null).label).toBe('NORMAL');
  });

  it('daysLeft < 0 → CRITIQUE', () => {
    expect(getUrgencyLevel(-1).label).toBe('CRITIQUE');
    expect(getUrgencyLevel(-10).label).toBe('CRITIQUE');
  });

  it('daysLeft = 0 → URGENT', () => {
    // 0 : expire aujourd'hui — encore >= 0 mais <= seuil URGENT(1)
    expect(getUrgencyLevel(0).label).toBe('URGENT');
  });

  it('daysLeft = 1 → URGENT', () => {
    expect(getUrgencyLevel(1).label).toBe('URGENT');
  });

  it('daysLeft = 2 → ATTENTION', () => {
    expect(getUrgencyLevel(2).label).toBe('ATTENTION');
  });

  it('daysLeft = 3 → ATTENTION', () => {
    expect(getUrgencyLevel(3).label).toBe('ATTENTION');
  });

  it('daysLeft = 4 → BIENTÔT', () => {
    expect(getUrgencyLevel(4).label).toBe('BIENTÔT');
  });

  it('daysLeft = 7 → BIENTÔT', () => {
    expect(getUrgencyLevel(7).label).toBe('BIENTÔT');
  });

  it('daysLeft = 8 → NORMAL', () => {
    expect(getUrgencyLevel(8).label).toBe('NORMAL');
  });

  it('daysLeft = 14 → NORMAL', () => {
    expect(getUrgencyLevel(14).label).toBe('NORMAL');
  });

  it('daysLeft = 15 → FRAIS', () => {
    expect(getUrgencyLevel(15).label).toBe('FRAIS');
  });
});

// ── getUrgencyLevelForKind — DLC ────────────────────────────────────────────

describe('getUrgencyLevelForKind avec kind DLC', () => {
  it('expire dans 1 jour → URGENT', () => {
    expect(getUrgencyLevelForKind(1, 'DLC').label).toBe('URGENT');
  });

  it('expire dans 3 jours → ATTENTION', () => {
    expect(getUrgencyLevelForKind(3, 'DLC').label).toBe('ATTENTION');
  });

  it('expire dans 7 jours → BIENTÔT', () => {
    expect(getUrgencyLevelForKind(7, 'DLC').label).toBe('BIENTÔT');
  });

  it('expire dans 14 jours → NORMAL', () => {
    expect(getUrgencyLevelForKind(14, 'DLC').label).toBe('NORMAL');
  });

  it('expire dans 15 jours → FRAIS', () => {
    expect(getUrgencyLevelForKind(15, 'DLC').label).toBe('FRAIS');
  });
});

// ── getUrgencyLevelForKind — DDM (seuils doublés) ──────────────────────────

describe('getUrgencyLevelForKind avec kind DDM (seuils plus souples)', () => {
  it('expire dans 1 jour → URGENT (DDM comme DLC pour < 0, mais 1 j ≤ seuil URGENT DDM=3)', () => {
    expect(getUrgencyLevelForKind(1, 'DDM').label).toBe('URGENT');
  });

  it('expire dans 3 jours → URGENT (DDM : seuil URGENT = 3)', () => {
    expect(getUrgencyLevelForKind(3, 'DDM').label).toBe('URGENT');
  });

  it('expire dans 4 jours → ATTENTION (DDM : seuil WARNING = 7)', () => {
    expect(getUrgencyLevelForKind(4, 'DDM').label).toBe('ATTENTION');
  });

  it('expire dans 7 jours → ATTENTION (DDM : seuil WARNING = 7)', () => {
    expect(getUrgencyLevelForKind(7, 'DDM').label).toBe('ATTENTION');
  });

  it('expire dans 8 jours → BIENTÔT (DDM : seuil SOON = 14)', () => {
    expect(getUrgencyLevelForKind(8, 'DDM').label).toBe('BIENTÔT');
  });

  it('expire dans 14 jours → BIENTÔT (DDM : seuil SOON = 14)', () => {
    expect(getUrgencyLevelForKind(14, 'DDM').label).toBe('BIENTÔT');
  });

  it('expire dans 15 jours → NORMAL (DDM : seuil NORMAL = 30)', () => {
    expect(getUrgencyLevelForKind(15, 'DDM').label).toBe('NORMAL');
  });

  it('expire dans 30 jours → NORMAL (DDM : seuil NORMAL = 30)', () => {
    expect(getUrgencyLevelForKind(30, 'DDM').label).toBe('NORMAL');
  });

  it('expire dans 31 jours → FRAIS (DDM)', () => {
    expect(getUrgencyLevelForKind(31, 'DDM').label).toBe('FRAIS');
  });

  it('ESTIMATE est alias de DDM', () => {
    expect(getUrgencyLevelForKind(7, 'ESTIMATE').label).toBe(
      getUrgencyLevelForKind(7, 'DDM').label
    );
  });
});

// ── DLC vs DDM — différence clé ────────────────────────────────────────────

describe('DLC vs DDM — même nb de jours, urgences différentes', () => {
  it('5 jours avant péremption : DLC=BIENTÔT, DDM=ATTENTION', () => {
    expect(getUrgencyLevelForKind(5, 'DLC').label).toBe('BIENTÔT');
    expect(getUrgencyLevelForKind(5, 'DDM').label).toBe('ATTENTION');
  });

  it('10 jours : DLC=NORMAL, DDM=BIENTÔT', () => {
    expect(getUrgencyLevelForKind(10, 'DLC').label).toBe('NORMAL');
    expect(getUrgencyLevelForKind(10, 'DDM').label).toBe('BIENTÔT');
  });

  it('périmé (-2 jours) : les deux → CRITIQUE', () => {
    expect(getUrgencyLevelForKind(-2, 'DLC').label).toBe('CRITIQUE');
    expect(getUrgencyLevelForKind(-2, 'DDM').label).toBe('CRITIQUE');
  });
});

// ── calculateUrgencyScore ───────────────────────────────────────────────────

describe('calculateUrgencyScore', () => {
  it('score de base = score du niveau', () => {
    // Lot non ouvert, petite quantité — pas de bonus
    const score = calculateUrgencyScore(URGENCY_LEVELS.SOON.score, { qty_remaining: 2 });
    expect(score).toBe(URGENCY_LEVELS.SOON.score); // 40
  });

  it('+15 si lot ouvert (opened_at)', () => {
    const base = URGENCY_LEVELS.SOON.score; // 40
    const score = calculateUrgencyScore(base, { opened_at: '2026-07-01', qty_remaining: 1 });
    expect(score).toBe(base + 15); // 55
  });

  it('+15 si lot ouvert (is_opened)', () => {
    const base = URGENCY_LEVELS.NORMAL.score; // 20
    const score = calculateUrgencyScore(base, { is_opened: true, qty_remaining: 1 });
    expect(score).toBe(base + 15); // 35
  });

  it('+5 bonus si qty_remaining > 5', () => {
    const base = URGENCY_LEVELS.WARNING.score; // 65
    const score = calculateUrgencyScore(base, { qty_remaining: 6 });
    expect(score).toBe(base + 5); // 70
  });

  it('+10 bonus si qty_remaining > 10', () => {
    const base = URGENCY_LEVELS.WARNING.score; // 65
    const score = calculateUrgencyScore(base, { qty_remaining: 11 });
    expect(score).toBe(base + 10); // 75
  });

  it('plafond à 100', () => {
    const score = calculateUrgencyScore(100, { is_opened: true, qty_remaining: 100 });
    expect(score).toBe(100);
  });
});
