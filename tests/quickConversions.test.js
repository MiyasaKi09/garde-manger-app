import { describe, it, expect } from 'vitest';
import { getQuickConversions } from '@/lib/quickConversions';

const noNaN = (conversions) => {
  for (const c of conversions) {
    expect(Number.isFinite(c.qty)).toBe(true);
    expect(c.label).not.toContain('NaN');
    expect(typeof c.unit).toBe('string');
  }
};

describe('getQuickConversions — produits liquides (density_g_per_ml)', () => {
  const water = { density_g_per_ml: 1 };

  it("convertit 1 l (unité minuscule 'l') en poids", () => {
    const res = getQuickConversions(1, 'l', water);
    noNaN(res);
    expect(res).toContainEqual({ unit: 'kg', qty: 1, label: '1 kg' });
  });

  it("convertit 50 cl (unité minuscule 'cl') en poids", () => {
    const res = getQuickConversions(50, 'cl', { density_g_per_ml: 1.03 });
    noNaN(res);
    // 50 cl = 500 ml × 1.03 = 515 g
    expect(res).toContainEqual({ unit: 'g', qty: 515, label: '515 g' });
  });

  it("convertit 250 ml (unité minuscule 'ml') en poids avec densité < 1", () => {
    const res = getQuickConversions(250, 'ml', { density_g_per_ml: 0.92 });
    noNaN(res);
    expect(res).toContainEqual({ unit: 'g', qty: 230, label: '230 g' });
  });

  it('est cohérent entre l, cl et ml pour la même quantité physique', () => {
    const fromL = getQuickConversions(1, 'l', water)[0];
    const fromCl = getQuickConversions(100, 'cl', water)[0];
    const fromMl = getQuickConversions(1000, 'ml', water)[0];
    // 1 l = 100 cl = 1000 ml → même conversion poids
    expect(fromCl).toEqual(fromL);
    expect(fromMl).toEqual(fromL);
  });

  it('propose le litre en plus quand 1000 ml ou plus', () => {
    const res = getQuickConversions(1500, 'ml', water);
    noNaN(res);
    expect(res).toContainEqual({ unit: 'l', qty: 1.5, label: '1.5 l' });
  });

  it('convertit le poids vers le meilleur volume (g → cl)', () => {
    const res = getQuickConversions(500, 'g', water);
    noNaN(res);
    // 500 g / 1 g/ml = 500 ml → affiché en cl
    expect(res).toContainEqual({ unit: 'cl', qty: 50, label: '50 cl' });
  });

  it('convertit kg → litres pour les grandes quantités', () => {
    const res = getQuickConversions(2, 'kg', water);
    noNaN(res);
    expect(res).toContainEqual({ unit: 'l', qty: 2, label: '2 l' });
  });
});

describe('getQuickConversions — produits comptables (grams_per_unit)', () => {
  const tomato = { grams_per_unit: 150 };

  it('convertit des pièces en poids', () => {
    const res = getQuickConversions(3, 'u', tomato);
    noNaN(res);
    expect(res).toContainEqual({ unit: 'g', qty: 450, label: '450 g' });
  });

  it('convertit des grammes en pièces', () => {
    const res = getQuickConversions(300, 'g', tomato);
    noNaN(res);
    expect(res).toContainEqual({ unit: 'u', qty: 2, label: '2 pièces' });
  });

  it('singularise le label pour une seule pièce', () => {
    const res = getQuickConversions(150, 'g', tomato);
    expect(res).toContainEqual({ unit: 'u', qty: 1, label: '1 pièce' });
  });

  it('convertit kg en pièces (et propose les grammes sous 1 kg)', () => {
    const res = getQuickConversions(0.6, 'kg', { grams_per_unit: 600 });
    noNaN(res);
    expect(res).toContainEqual({ unit: 'g', qty: 600, label: '600 g' });
    expect(res).toContainEqual({ unit: 'u', qty: 1, label: '1 pièce' });
  });
});

describe('getQuickConversions — robustesse', () => {
  it('retourne [] sans métadonnées', () => {
    expect(getQuickConversions(500, 'g', {})).toEqual([]);
    expect(getQuickConversions(500, 'g')).toEqual([]);
  });

  it('retourne [] avec des métadonnées non numériques', () => {
    expect(getQuickConversions(500, 'g', { density_g_per_ml: 'abc' })).toEqual([]);
  });

  it('ne produit jamais de NaN sur un balayage unités × métadonnées', () => {
    const metas = [
      { density_g_per_ml: 1 },
      { density_g_per_ml: 0.92 },
      { grams_per_unit: 150 },
      { grams_per_unit: 150, density_g_per_ml: 1 },
    ];
    const units = ['l', 'cl', 'ml', 'g', 'kg', 'u'];
    for (const meta of metas) {
      for (const unit of units) {
        for (const qty of [0.5, 1, 250, 1500]) {
          noNaN(getQuickConversions(qty, unit, meta));
        }
      }
    }
  });

  it('tolère une unité inconnue ou absente (aucune conversion, pas de throw)', () => {
    expect(() => getQuickConversions(2, undefined, { density_g_per_ml: 1 })).not.toThrow();
    expect(getQuickConversions(2, 'pincée', { density_g_per_ml: 1 })).toEqual([]);
  });
});
