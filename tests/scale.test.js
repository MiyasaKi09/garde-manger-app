import { describe, it, expect } from 'vitest';
import { scaleQty, scaleCookTime, scalePrepTime, mealsFromBatch } from '@/lib/scale';

describe('scaleQty', () => {
  it('scale linéairement les quantités', () => {
    expect(scaleQty(200, 4, 2)).toBe(100);
    expect(scaleQty(200, 4, 6)).toBe(300);
  });

  it('retourne la quantité inchangée si les portions manquent', () => {
    expect(scaleQty(200, 0, 2)).toBe(200);
    expect(scaleQty(null, 4, 2)).toBeNull();
  });
});

describe('scaleCookTime (non linéaire, exposant 0.6)', () => {
  it('ne change pas le temps pour un ratio de 1', () => {
    expect(scaleCookTime(30, 1)).toBe(30);
  });

  it('scale sous-linéairement quand on double les portions', () => {
    const doubled = scaleCookTime(30, 2);
    expect(doubled).toBe(Math.round(30 * Math.pow(2, 0.6)));
    expect(doubled).toBeGreaterThan(30);
    expect(doubled).toBeLessThan(60); // PAS linéaire
  });

  it('réduit modérément quand on divise les portions', () => {
    const halved = scaleCookTime(30, 0.5);
    expect(halved).toBeLessThan(30);
    expect(halved).toBeGreaterThan(15); // PAS linéaire
  });

  it('retourne 0 si pas de temps de cuisson', () => {
    expect(scaleCookTime(0, 2)).toBe(0);
  });

  it('retourne le temps original pour un ratio invalide', () => {
    expect(scaleCookTime(30, 0)).toBe(30);
  });
});

describe('scalePrepTime (quasi linéaire, exposant 0.8)', () => {
  it('scale sous-linéairement', () => {
    const doubled = scalePrepTime(20, 2);
    expect(doubled).toBe(Math.round(20 * Math.pow(2, 0.8)));
    expect(doubled).toBeLessThan(40);
  });
});

describe('mealsFromBatch', () => {
  it('calcule le nombre de repas complets', () => {
    expect(mealsFromBatch(6, 2)).toBe(3);
    expect(mealsFromBatch(7, 2)).toBe(3);
  });
});
