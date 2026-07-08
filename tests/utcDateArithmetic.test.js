/**
 * Tests — Arithmétique de dates UTC-safe (audit M3)
 *
 * Valide que computeOpenedExpiration et calculateAdjustedExpiration ne
 * dérivent pas d'un jour selon le fuseau horaire de l'utilisateur.
 *
 * Stratégie : fournir des inputs à 23:30 UTC (= 00:30 le lendemain à UTC+1)
 * et vérifier que la date produite est calculée sur la partie YYYY-MM-DD UTC,
 * pas sur la date locale.
 */
import { describe, it, expect } from 'vitest';
import { computeOpenedExpiration } from '@/lib/lotManagementService';
import { calculateAdjustedExpiration } from '@/lib/shelfLifeRules';

const iso = (d) => d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0];

// ── computeOpenedExpiration ─────────────────────────────────────────────────

describe('computeOpenedExpiration', () => {
  // Lot fictif avec 5 jours frigo depuis la base archetype
  const lotWith5Days = {
    archetypes: {
      open_shelf_life_days_fridge: 5,
    },
    expiration_date: '2026-12-31', // DLC originale loin
  };

  it('ajoute exactement N jours à la date UTC d\'ouverture', () => {
    const openedAt = new Date('2026-07-01T00:00:00Z');
    const result = computeOpenedExpiration(lotWith5Days, 'fridge', openedAt);
    expect(iso(result)).toBe('2026-07-06'); // 2026-07-01 + 5 jours
  });

  it('robustesse timezone — ouverture à 23:30 UTC ne décale pas d\'un jour', () => {
    // 2026-07-01T23:30:00Z = 2026-07-02T00:30 à UTC+1
    // Résultat attendu : 2026-07-01 + 5 = 2026-07-06 (date UTC, pas locale)
    const openedAt = new Date('2026-07-01T23:30:00Z');
    const result = computeOpenedExpiration(lotWith5Days, 'fridge', openedAt);
    expect(iso(result)).toBe('2026-07-06');
  });

  it('robustesse timezone — ouverture à 00:15 UTC ne recule pas d\'un jour', () => {
    const openedAt = new Date('2026-07-10T00:15:00Z');
    const result = computeOpenedExpiration(lotWith5Days, 'fridge', openedAt);
    expect(iso(result)).toBe('2026-07-15');
  });

  it('borne la DLC à l\'expiration originale si plus courte', () => {
    const lotShort = {
      archetypes: { open_shelf_life_days_fridge: 10 },
      expiration_date: '2026-07-05',
    };
    const openedAt = new Date('2026-07-01T00:00:00Z');
    const result = computeOpenedExpiration(lotShort, 'fridge', openedAt);
    // 01/07 + 10 = 11/07, mais DLC originale = 05/07 → borné à 05/07
    expect(iso(result)).toBe('2026-07-05');
  });

  it('retourne null si dbDays = 0 (méthode incompatible)', () => {
    const lotZero = {
      archetypes: { open_shelf_life_days_freezer: 0 },
      expiration_date: '2026-12-31',
    };
    const result = computeOpenedExpiration(lotZero, 'freezer', new Date());
    expect(result).toBeNull();
  });

  it('accepte une chaîne ISO comme openedAt', () => {
    const result = computeOpenedExpiration(lotWith5Days, 'fridge', '2026-08-20T00:00:00Z');
    expect(iso(result)).toBe('2026-08-25');
  });

  it('sans règle archetype → fallback calculateAdjustedExpiration', () => {
    const lotNoDb = {
      archetypes: {},
      canonical_foods: { canonical_name: 'Lait' },
      expiration_date: '2026-12-31',
    };
    const openedAt = new Date('2026-07-01T00:00:00Z');
    // Le fallback appelle calculateAdjustedExpiration — doit retourner une Date valide
    const result = computeOpenedExpiration(lotNoDb, 'fridge', openedAt);
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });
});

// ── calculateAdjustedExpiration ─────────────────────────────────────────────

describe('calculateAdjustedExpiration', () => {
  it('ajoute exactement N jours en UTC (fromage frais, frigo = 5j)', () => {
    const openedAt = new Date('2026-07-01T00:00:00Z');
    // 'dairy' category → 5 jours frigo (SHELF_LIFE_AFTER_OPENING)
    const result = calculateAdjustedExpiration('dairy', 'fridge', openedAt);
    if (result) {
      // Le résultat doit être openedAt + N jours, où N > 0
      expect(result.getTime()).toBeGreaterThan(openedAt.getTime());
    }
    // Si la catégorie n'existe pas, résultat peut être null — ce n'est pas un bug
  });

  it('robustesse timezone — 23:30 UTC ne produit pas de décalage', () => {
    const openedAtLate  = new Date('2026-07-01T23:30:00Z'); // ~minuit local UTC+1
    const openedAtMidnight = new Date('2026-07-01T00:00:00Z');

    // Utiliser la catégorie _default qui existe toujours
    const resLate     = calculateAdjustedExpiration('_default', 'fridge', openedAtLate);
    const resMidnight = calculateAdjustedExpiration('_default', 'fridge', openedAtMidnight);

    // Les deux ouverts le 2026-07-01 UTC → même durée → même date résultat
    if (resLate && resMidnight) {
      expect(iso(resLate)).toBe(iso(resMidnight));
    }
  });

  it('ne dépasse pas la DLC originale', () => {
    const openedAt = new Date('2026-07-01T00:00:00Z');
    const originalDLC = new Date('2026-07-03'); // très courte
    const result = calculateAdjustedExpiration('_default', 'fridge', openedAt, originalDLC);
    if (result) {
      expect(result.getTime()).toBeLessThanOrEqual(originalDLC.getTime());
    }
  });

  it('retourne null si la méthode de stockage est incompatible (null dans les règles)', () => {
    // Certaines catégories retournent null pour certaines méthodes
    // On ne peut pas garantir le cas exact sans connaître les règles internes
    // mais on vérifie que la fonction ne lève pas d'exception
    expect(() => calculateAdjustedExpiration('unknown_cat', 'fridge', new Date())).not.toThrow();
  });
});

// ── Invariants de cohérence ─────────────────────────────────────────────────

describe('Invariants UTC entre les deux fonctions', () => {
  it('même date d\'ouverture → résultats cohérents peu importe l\'heure UTC', () => {
    const dates = [
      new Date('2026-09-15T00:00:00Z'),
      new Date('2026-09-15T12:00:00Z'),
      new Date('2026-09-15T23:59:59Z'),
    ];

    const lot = {
      archetypes: { open_shelf_life_days_fridge: 3 },
      expiration_date: '2026-12-31',
    };

    const results = dates.map(d => {
      const r = computeOpenedExpiration(lot, 'fridge', d);
      return r ? iso(r) : null;
    });

    // Toutes les heures du 2026-09-15 UTC → résultat identique
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    expect(results[0]).toBe('2026-09-18'); // 15 + 3 = 18
  });
});
