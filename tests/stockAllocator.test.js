import { describe, it, expect } from 'vitest';
import { allocateConsumption } from '@/lib/stockAllocator';

const bottle = (id, qty, opts = {}) => ({
  id, qty_remaining: qty, unit: 'l', is_opened: false,
  expiration_date: '2026-06-20', ...opts,
});

describe('allocateConsumption — le cas du lait', () => {
  it('5 bouteilles de 1 L, besoin 1,5 L → 1 vidée + 0,5 L sur la suivante', () => {
    const lots = [1, 2, 3, 4, 5].map(i => bottle(`b${i}`, 1));
    const { allocations, shortfall } = allocateConsumption(lots, 1.5, 'l');
    expect(shortfall).toBe(0);
    expect(allocations).toHaveLength(2);
    expect(allocations[0]).toMatchObject({ lot_id: 'b1', qty: 1, depleted: true });
    expect(allocations[1]).toMatchObject({ lot_id: 'b2', qty: 0.5, depleted: false });
  });

  it('finit la bouteille déjà ouverte avant d\'en entamer une neuve', () => {
    const lots = [
      bottle('neuve', 1),
      bottle('ouverte', 0.4, { is_opened: true, adjusted_expiration_date: '2026-06-12' }),
    ];
    const { allocations } = allocateConsumption(lots, 1.2, 'l');
    expect(allocations[0]).toMatchObject({ lot_id: 'ouverte', qty: 0.4, depleted: true });
    expect(allocations[1]).toMatchObject({ lot_id: 'neuve', qty: 0.8, depleted: false });
  });

  it('FEFO entre lots fermés : le plus proche de la DLC d\'abord', () => {
    const lots = [
      bottle('tard', 1, { expiration_date: '2026-07-01' }),
      bottle('tot', 1, { expiration_date: '2026-06-12' }),
    ];
    const { allocations } = allocateConsumption(lots, 0.5, 'l');
    expect(allocations[0].lot_id).toBe('tot');
  });

  it('convertit les unités du lot vers celles du besoin (cl → l)', () => {
    const lots = [bottle('cl', 150, { unit: 'cl' })]; // 1,5 L
    const { allocations, shortfall } = allocateConsumption(lots, 1, 'l');
    expect(shortfall).toBe(0);
    expect(allocations[0].qty).toBe(1);            // en unité du besoin (l)
    expect(allocations[0].qty_in_lot_unit).toBe(100); // en unité du lot (cl)
  });

  it('signale le manque quand le stock ne suffit pas', () => {
    const lots = [bottle('seule', 1)];
    const { allocations, shortfall } = allocateConsumption(lots, 2.5, 'l');
    expect(allocations[0]).toMatchObject({ qty: 1, depleted: true });
    expect(shortfall).toBe(1.5);
  });

  it('ignore les lots dont l\'unité n\'est pas comparable sans métadonnées', () => {
    const lots = [
      { id: 'pieces', qty_remaining: 3, unit: 'u', is_opened: false, expiration_date: '2026-06-15' },
      bottle('litre', 1),
    ];
    const { allocations, shortfall } = allocateConsumption(lots, 1.5, 'l');
    expect(allocations).toHaveLength(1);
    expect(allocations[0].lot_id).toBe('litre');
    expect(shortfall).toBe(0.5);
  });

  it('utilise grams_per_unit pour comparer pièces et grammes', () => {
    const lots = [{ id: 'oeufs', qty_remaining: 6, unit: 'u', is_opened: false, expiration_date: '2026-06-25' }];
    const { allocations, shortfall } = allocateConsumption(lots, 180, 'g', { grams_per_unit: 60 });
    expect(shortfall).toBe(0);
    expect(allocations[0].qty).toBe(180);          // 180 g demandés
    expect(allocations[0].qty_in_lot_unit).toBe(3); // = 3 œufs
  });
});
