import { describe, it, expect } from 'vitest';
import { calculateCookedDishExpiration, COOKED_DISH_SHELF_LIFE } from '@/lib/shelfLifeRules';

const iso = (d) => d.toISOString().split('T')[0];

describe('calculateCookedDishExpiration', () => {
  const cookedAt = new Date('2026-06-09T12:00:00Z');

  it('applique la règle frigo (+3 jours) sans lots', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'fridge');
    expect(iso(exp)).toBe('2026-06-12');
  });

  it('applique la règle congélateur (+90 jours)', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'freezer');
    const expected = new Date(cookedAt);
    expected.setDate(expected.getDate() + 90);
    expect(iso(exp)).toBe(iso(expected));
  });

  it('borne la DLC à celle du lot le plus court utilisé', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'fridge', [
      { expiration_date: '2026-06-10' },
      { expiration_date: '2026-06-25' },
    ]);
    expect(iso(exp)).toBe('2026-06-10');
  });

  it('garde la règle de stockage si tous les lots expirent après', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'fridge', [
      { expiration_date: '2026-08-01' },
    ]);
    expect(iso(exp)).toBe('2026-06-12');
  });

  it('priorise adjusted_expiration_date côté lots', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'fridge', [
      { expiration_date: '2026-08-01', adjusted_expiration_date: '2026-06-11' },
    ]);
    expect(iso(exp)).toBe('2026-06-11');
  });

  it('ignore les lots sans date', () => {
    const exp = calculateCookedDishExpiration(cookedAt, 'fridge', [{ id: 'x' }]);
    expect(iso(exp)).toBe('2026-06-12');
  });

  it('expose les durées de référence', () => {
    expect(COOKED_DISH_SHELF_LIFE.fridge).toBe(3);
    expect(COOKED_DISH_SHELF_LIFE.freezer).toBe(90);
    expect(COOKED_DISH_SHELF_LIFE.counter).toBe(1);
  });
});
