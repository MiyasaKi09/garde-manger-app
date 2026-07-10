import { describe, it, expect } from 'vitest';
import {
  computeScaleRatio,
  scaleQuantity,
  buildDraftIngredient,
  sumAvailableForNeed,
  hasEnoughStock,
} from '@/lib/cookingSessionDraft';

// Ingrédient normalisé type (recette de 4 portions)
const lentilles = {
  name: 'Lentilles vertes',
  entity_type: 'canonical',
  entity_id: 42,
  quantity: 200,
  unit: 'g',
};

describe('computeScaleRatio — rescaling linéaire des portions', () => {
  it('2 portions demandées sur une recette de 4 → ratio 0,5', () => {
    expect(computeScaleRatio(2, 4)).toBe(0.5);
    expect(computeScaleRatio(6, 4)).toBe(1.5);
  });

  it('retombe sur 1 si les portions sont absentes ou invalides', () => {
    expect(computeScaleRatio(null, 4)).toBe(1);
    expect(computeScaleRatio(2, 0)).toBe(1);
    expect(computeScaleRatio(undefined, undefined)).toBe(1);
  });
});

describe('scaleQuantity — quantités rescalées', () => {
  it('multiplie linéairement et arrondit au millième', () => {
    expect(scaleQuantity(200, 0.5)).toBe(100);
    expect(scaleQuantity(1, 1 / 3)).toBe(0.333);
  });

  it('une quantité absente reste null (« sel », « poivre »)', () => {
    expect(scaleQuantity(null, 0.5)).toBeNull();
    expect(scaleQuantity(undefined, 0.5)).toBeNull();
    expect(scaleQuantity('', 0.5)).toBeNull();
  });
});

describe('buildDraftIngredient — recette de 4 cuisinée pour 2', () => {
  const ratio = computeScaleRatio(2, 4);

  it('halve la quantité planifiée et conserve l\'identité de l\'ingrédient', () => {
    // Allocation mockée : le stock couvre tout
    const allocation = { allocations: [{ lot_id: 'L1', qty: 100 }], shortfall: 0 };
    const draft = buildDraftIngredient(lentilles, ratio, allocation);
    expect(draft).toMatchObject({
      planned_name: 'Lentilles vertes',
      planned_entity_type: 'canonical',
      planned_entity_id: 42,
      planned_quantity: 100, // 200 g × 0,5
      planned_unit: 'g',
    });
  });

  it('status ok quand l\'allocateur couvre tout (shortfall 0)', () => {
    const allocation = { allocations: [{ lot_id: 'L1', qty: 60 }, { lot_id: 'L2', qty: 40 }], shortfall: 0 };
    const draft = buildDraftIngredient(lentilles, ratio, allocation);
    expect(draft.status).toBe('ok');
    expect(draft.missing_qty).toBe(0);
    expect(draft.allocations).toHaveLength(2);
  });

  it('status partial + missing_qty quand le stock ne couvre qu\'une partie', () => {
    const allocation = { allocations: [{ lot_id: 'L1', qty: 70 }], shortfall: 30 };
    const draft = buildDraftIngredient(lentilles, ratio, allocation);
    expect(draft.status).toBe('partial');
    expect(draft.missing_qty).toBe(30);
  });

  it('status missing quand l\'allocateur ne trouve aucun lot', () => {
    const allocation = { allocations: [], shortfall: 100 };
    const draft = buildDraftIngredient(lentilles, ratio, allocation);
    expect(draft.status).toBe('missing');
    expect(draft.missing_qty).toBe(100);
    expect(draft.allocations).toEqual([]);
  });

  it('ingrédient non lié (allocation null) → missing explicite, jamais ignoré', () => {
    const inconnu = { name: 'Sumac', entity_type: null, entity_id: null, quantity: 10, unit: 'g' };
    const draft = buildDraftIngredient(inconnu, ratio, null);
    expect(draft.status).toBe('missing');
    expect(draft.missing_qty).toBe(5); // 10 g × 0,5
    expect(draft.allocations).toEqual([]);
    expect(draft.planned_entity_type).toBeNull();
  });
});

describe('sumAvailableForNeed — somme multi-lots avec conversion d\'unités', () => {
  it('somme plusieurs lots dans l\'unité du besoin (kg + g → g)', () => {
    const lots = [
      { qty_remaining: 0.4, unit: 'kg' },
      { qty_remaining: 250, unit: 'g' },
    ];
    // 400 g + 250 g : aucun lot seul ne couvre 500 g, mais la somme oui
    expect(sumAvailableForNeed(lots, 'g')).toBe(650);
    expect(hasEnoughStock(lots, 500, 'g')).toBe(true);
  });

  it('convertit volume ↔ masse via la densité du canonique (cas g/ml)', () => {
    const lots = [{ qty_remaining: 500, unit: 'ml' }];
    // Crème : densité 1,0 → 500 ml = 500 g
    expect(sumAvailableForNeed(lots, 'g', { density_g_per_ml: 1.0 })).toBe(500);
  });

  it('exclut les lots non convertibles au lieu de compter à l\'aveugle', () => {
    const lots = [
      { qty_remaining: 300, unit: 'g' },
      { qty_remaining: 2, unit: 'u' }, // pas de grams_per_unit → inconvertible vers g
    ];
    expect(sumAvailableForNeed(lots, 'g')).toBe(300);
    expect(hasEnoughStock(lots, 400, 'g')).toBe(false);
    // Avec le poids unitaire du canonique, les 2 unités comptent (2 × 60 g)
    expect(sumAvailableForNeed(lots, 'g', { grams_per_unit: 60 })).toBe(420);
    expect(hasEnoughStock(lots, 400, 'g', { grams_per_unit: 60 })).toBe(true);
  });

  it('quantité de besoin inconnue → hasEnoughStock refuse de promettre', () => {
    const lots = [{ qty_remaining: 100, unit: 'g' }];
    expect(hasEnoughStock(lots, null, 'g')).toBe(false);
    expect(hasEnoughStock(lots, 0, 'g')).toBe(false);
  });
});
