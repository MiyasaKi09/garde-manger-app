import { describe, it, expect } from 'vitest';
import { convertWithMeta, unitClass, sumAvailableInUnitWithMeta } from '@/lib/units';

describe('unitClass', () => {
  it('reconnaît les unités en minuscules', () => {
    expect(unitClass('g')).toBe('mass');
    expect(unitClass('kg')).toBe('mass');
    expect(unitClass('ml')).toBe('vol');
    expect(unitClass('l')).toBe('vol');
    expect(unitClass('u')).toBe('count');
  });

  it('est insensible à la casse', () => {
    expect(unitClass('L')).toBe('vol');
    expect(unitClass('ML')).toBe('vol');
  });

  it('retourne null pour une unité inconnue', () => {
    expect(unitClass('pincée')).toBeNull();
  });
});

describe('convertWithMeta', () => {
  it('convertit dans la même classe (kg → g)', () => {
    expect(convertWithMeta(1.5, 'kg', 'g')).toEqual({ qty: 1500, unit: 'g' });
  });

  it('convertit count → masse via grams_per_unit', () => {
    const r = convertWithMeta(2, 'u', 'g', { grams_per_unit: 120 });
    expect(r).toEqual({ qty: 240, unit: 'g' });
  });

  it('convertit masse → count via grams_per_unit', () => {
    const r = convertWithMeta(360, 'g', 'u', { grams_per_unit: 120 });
    expect(r).toEqual({ qty: 3, unit: 'u' });
  });

  it('convertit volume → masse via la densité', () => {
    const r = convertWithMeta(100, 'ml', 'g', { density_g_per_ml: 1.03 });
    expect(r.qty).toBeCloseTo(103, 5);
    expect(r.unit).toBe('g');
  });

  it('convertit volume → count (bug && corrigé)', () => {
    // 1 l, densité 1 → 1000 g ; 100 g/unité → 10 unités
    const r = convertWithMeta(1, 'l', 'u', { density_g_per_ml: 1, grams_per_unit: 100 });
    expect(r.qty).toBeCloseTo(10, 5);
    expect(r.unit).toBe('u');
  });

  it('convertit count → volume', () => {
    // 2 u × 120 g, densité 1 → 240 ml
    const r = convertWithMeta(2, 'u', 'ml', { density_g_per_ml: 1, grams_per_unit: 120 });
    expect(r.qty).toBeCloseTo(240, 5);
    expect(r.unit).toBe('ml');
  });

  it('retourne la quantité inchangée sans conversion fiable', () => {
    // count → vol sans grams_per_unit : pas de conversion possible
    const r = convertWithMeta(2, 'u', 'ml', {});
    expect(r).toEqual({ qty: 2, unit: 'u' });
  });
});

describe('sumAvailableInUnitWithMeta', () => {
  it('somme des lots hétérogènes dans une unité cible', () => {
    const lots = [
      { qty: 500, unit: 'g' },
      { qty: 1, unit: 'kg' },
    ];
    expect(sumAvailableInUnitWithMeta(lots, 'g')).toBeCloseTo(1500, 5);
  });
});
