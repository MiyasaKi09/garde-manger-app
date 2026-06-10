import { describe, it, expect } from 'vitest';
import { parseQuantity, normalizeUnit } from '@/lib/parseQuantity';

describe('parseQuantity', () => {
  it('ignore les annotations de stock : « 600 g (400 g en stock) »', () => {
    expect(parseQuantity('600 g (400 g en stock)')).toEqual({ qty: 600, unit: 'g' });
  });

  it('parse les décimales à virgule et normalise kg → g : « 1,5 kg »', () => {
    expect(parseQuantity('1,5 kg')).toEqual({ qty: 1500, unit: 'g' });
  });

  it('cumule les multiplications : « 2 x 400 g » → 800 g', () => {
    expect(parseQuantity('2 x 400 g')).toEqual({ qty: 800, unit: 'g' });
  });

  it('parse une fraction seule : « 1/2 » → 0.5 unité', () => {
    expect(parseQuantity('1/2')).toEqual({ qty: 0.5, unit: 'unités' });
  });

  it('parse un nombre mixte avec unité : « 1 1/2 kg » → 1500 g', () => {
    expect(parseQuantity('1 1/2 kg')).toEqual({ qty: 1500, unit: 'g' });
  });

  it('accepte la variante « gr » collée au nombre : « 250gr »', () => {
    expect(parseQuantity('250gr')).toEqual({ qty: 250, unit: 'g' });
  });

  it('ramène les contenants à des unités : « 3 boîtes »', () => {
    expect(parseQuantity('3 boîtes')).toEqual({ qty: 3, unit: 'unités' });
  });

  it('retourne 1 unité par défaut pour une chaîne vide', () => {
    expect(parseQuantity('')).toEqual({ qty: 1, unit: 'unités' });
  });

  it('retourne 1 unité par défaut pour null/undefined', () => {
    expect(parseQuantity(null)).toEqual({ qty: 1, unit: 'unités' });
    expect(parseQuantity(undefined)).toEqual({ qty: 1, unit: 'unités' });
  });

  it('gère le séparateur « · en stock » : « 3 · en stock »', () => {
    expect(parseQuantity('3 · en stock')).toEqual({ qty: 3, unit: 'unités' });
  });

  it('normalise les volumes : « 1/2 l » → 500 ml', () => {
    expect(parseQuantity('1/2 l')).toEqual({ qty: 500, unit: 'ml' });
  });

  it('ne retombe pas sur une unité partielle dans un mot : « 2 grandes courgettes »', () => {
    // « gr » suivi d'une lettre ne doit pas matcher comme unité
    expect(parseQuantity('2 grandes courgettes')).toEqual({ qty: 2, unit: 'unités' });
  });

  it('ne produit jamais de NaN ni de quantité ≤ 0', () => {
    const samples = ['', 'abc', '0', 'x 3', '1,5 kg', '2 x 400 g', '1/2', '???'];
    for (const s of samples) {
      const { qty, unit } = parseQuantity(s);
      expect(Number.isFinite(qty)).toBe(true);
      expect(qty).toBeGreaterThan(0);
      expect(typeof unit).toBe('string');
    }
  });
});

describe('normalizeUnit', () => {
  it('convertit kg en grammes', () => {
    expect(normalizeUnit(2, 'kg')).toEqual({ qty: 2000, unit: 'g' });
  });

  it('convertit l et cl en millilitres', () => {
    expect(normalizeUnit(1.5, 'l')).toEqual({ qty: 1500, unit: 'ml' });
    expect(normalizeUnit(25, 'cl')).toEqual({ qty: 250, unit: 'ml' });
  });

  it('conserve g/gr/ml tels quels (gr → g)', () => {
    expect(normalizeUnit(250, 'g')).toEqual({ qty: 250, unit: 'g' });
    expect(normalizeUnit(250, 'gr')).toEqual({ qty: 250, unit: 'g' });
    expect(normalizeUnit(330, 'ml')).toEqual({ qty: 330, unit: 'ml' });
  });

  it('ramène les unités inconnues à « unités »', () => {
    expect(normalizeUnit(3, 'boîtes')).toEqual({ qty: 3, unit: 'unités' });
    expect(normalizeUnit(2, 'paquets')).toEqual({ qty: 2, unit: 'unités' });
  });
});
