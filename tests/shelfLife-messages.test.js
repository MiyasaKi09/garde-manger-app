import { describe, it, expect, afterEach } from 'vitest';
import {
  inferCategory,
  calculateAdjustedExpiration,
  getShelfLifeMessage,
  SHELF_LIFE_AFTER_OPENING,
} from '@/lib/shelfLifeRules';

describe('inferCategory', () => {
  it.each([
    ['lait', 'Lait'],
    ['yaourt', 'Yaourt'],
    ['beurre demi-sel', 'Beurre'],
    ["jus d'orange", 'Jus de fruits'],
    ['confiture', 'Confiture'],
    ['mayonnaise', 'Mayonnaise'],
    ['poulet rôti', '_default'],
    ['produit inconnu', '_default'],
  ])('infère « %s » → %s', (name, expected) => {
    expect(inferCategory(name)).toBe(expected);
  });

  it('priorise la catégorie canonique quand elle existe dans les règles', () => {
    expect(inferCategory('produit inconnu', 'Miel')).toBe('Miel');
  });

  it('ignore une catégorie canonique inconnue et retombe sur le nom', () => {
    expect(inferCategory('lait entier', 'CategorieInexistante')).toBe('Lait');
  });

  it('ne confond pas le lait de coco avec le lait', () => {
    expect(inferCategory('lait de coco')).not.toBe('Lait');
  });
});

describe('calculateAdjustedExpiration', () => {
  const openedAt = new Date(2026, 5, 1); // 1er juin 2026 (heure locale)

  const plusDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  it('ajoute la durée de conservation après ouverture (Beurre frigo : 14 j)', () => {
    const result = calculateAdjustedExpiration('Beurre', 'fridge', openedAt);
    expect(result.getTime()).toBe(plusDays(openedAt, 14).getTime());
  });

  it('utilise la règle _default pour une catégorie inconnue (frigo : 7 j)', () => {
    const result = calculateAdjustedExpiration('_default', 'fridge', openedAt);
    expect(result.getTime()).toBe(plusDays(openedAt, 7).getTime());
  });

  it('plafonne à la DLC d’origine si elle arrive avant', () => {
    const originalDLC = plusDays(openedAt, 4); // avant ouverture + 14 j
    const result = calculateAdjustedExpiration('Beurre', 'fridge', openedAt, originalDLC);
    expect(result.getTime()).toBe(new Date(originalDLC).getTime());
  });

  it('ne plafonne pas si la DLC d’origine est plus lointaine', () => {
    const originalDLC = plusDays(openedAt, 365);
    const result = calculateAdjustedExpiration('Beurre', 'fridge', openedAt, originalDLC);
    expect(result.getTime()).toBe(plusDays(openedAt, 14).getTime());
  });

  describe('méthode non conservable (durée null)', () => {
    const TEST_CATEGORY = '__test_non_conservable__';

    afterEach(() => {
      delete SHELF_LIFE_AFTER_OPENING[TEST_CATEGORY];
    });

    it('retourne null quand frigo et méthode demandée sont null', () => {
      SHELF_LIFE_AFTER_OPENING[TEST_CATEGORY] = { fridge: null, freezer: null, pantry: 1 };
      const result = calculateAdjustedExpiration(TEST_CATEGORY, 'freezer', openedAt);
      expect(result).toBeNull();
    });

    it('comportement actuel : freezer null retombe sur la durée frigo (Mayonnaise)', () => {
      // Mayonnaise.freezer === null mais le code fait `rules[method] || rules.fridge`
      // → repli sur fridge (7 j) au lieu de null. Documente le comportement réel.
      expect(SHELF_LIFE_AFTER_OPENING['Mayonnaise'].freezer).toBeNull();
      const result = calculateAdjustedExpiration('Mayonnaise', 'freezer', openedAt);
      expect(result.getTime()).toBe(
        plusDays(openedAt, SHELF_LIFE_AFTER_OPENING['Mayonnaise'].fridge).getTime()
      );
    });
  });
});

describe('getShelfLifeMessage', () => {
  it('signale un produit périmé', () => {
    expect(getShelfLifeMessage('Lait', 'fridge', 0)).toContain('périmé');
  });

  it('signale une consommation le jour même', () => {
    expect(getShelfLifeMessage('Lait', 'fridge', 1)).toContain("aujourd'hui");
  });

  it('alerte sous 3 jours', () => {
    expect(getShelfLifeMessage('Lait', 'fridge', 3)).toContain('rapidement');
  });

  it('reste neutre au-delà de 7 jours', () => {
    expect(getShelfLifeMessage('Lait', 'fridge', 14)).toContain('Bon état');
  });
});
