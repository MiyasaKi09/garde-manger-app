import { describe, it, expect } from 'vitest';
import { parseJsonPlan } from '@/lib/jsonPlanParser';

/** Plan complet : 2 jours, 2 personnes, totaux, cooking, recettes, courses. */
const fullPlan = {
  id: 'avril-2026',
  label: 'Avril 2026',
  days: [
    {
      date: '01/04',
      dayName: 'Mercredi',
      type: 'batch',
      dej: {
        j: { desc: 'Poulet rôti, riz complet', kcal: 650, p: 45, g: 70, l: 15, f: 8 },
        z: { desc: 'Salade composée', kcal: 480, p: 30, g: 50, l: 18, f: 9 },
      },
      din: {
        j: { desc: 'Soupe + tartines', kcal: 550, p: 25, g: 60, l: 20, f: 10 },
        z: { desc: 'Omelette champignons', kcal: 420, p: 28, g: 12, l: 28, f: 4 },
      },
      col: {
        j: { desc: 'Skyr + amandes', kcal: 250, p: 20, g: 15, l: 10, f: 3 },
      },
      total: {
        j: { kcal: 1450, p: 90, g: 145, l: 45, f: 21, ok: true },
        z: { kcal: 900, p: 58, g: 62, l: 46, f: 13, ok: false },
      },
      cooking: {
        dinner: { steps: [{ action: 'Cuire', detail: 'le riz complet', duration: '15 min' }] },
        prep: { steps: [{ action: 'Découper', detail: 'les légumes' }] },
      },
    },
    {
      date: '02/04',
      dayName: 'Jeudi',
      type: 'express',
      dej: {
        j: { desc: 'Restes batch', kcal: 600.46, p: 40, g: 65, l: 14, f: 7 },
      },
    },
  ],
  recipes: [
    {
      name: 'Dahl de lentilles',
      timing: { actif: '20 min', total: '45 min' },
      ingredients: 'lentilles corail, lait de coco',
      macros100g: { kcal: 120, p: 7, g: 15, l: 3, f: 4 },
      rendement: '1,6 kg',
      portions: { j: '400 g', z: '300 g' },
      reheat: 'micro-ondes 2 min',
      jour2: 'Ajouter la coriandre fraîche',
    },
  ],
  groceries: [
    {
      week: 'S1',
      categories: [
        {
          name: 'Frais',
          items: [{ product: 'Poulet fermier', quantity: '1,2 kg' }, { product: 'Skyr' }],
        },
      ],
    },
  ],
};

describe('parseJsonPlan — plan complet', () => {
  const result = parseJsonPlan(JSON.stringify(fullPlan), 'plan-avril.json');

  it('retourne le contrat de sortie complet', () => {
    expect(result).toHaveProperty('meals');
    expect(result).toHaveProperty('dailyTotals');
    expect(result).toHaveProperty('batchRecipes');
    expect(result).toHaveProperty('prepTasks');
    expect(result).toHaveProperty('shoppingItems');
    expect(result).toHaveProperty('meta');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.meals)).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('extrait tous les repas des deux personnes', () => {
    // Jour 1 : Julien dej+din+col (3) + Zoé dej+din (2) ; Jour 2 : Julien dej (1)
    expect(result.meals).toHaveLength(6);
    const julien = result.meals.filter((m) => m.person_name === 'Julien');
    const zoe = result.meals.filter((m) => m.person_name === 'Zoé');
    expect(julien).toHaveLength(4);
    expect(zoe).toHaveLength(2);
  });

  it('résout les dates ISO avec l’année du label « Avril 2026 »', () => {
    const dates = [...new Set(result.meals.map((m) => m.meal_date))].sort();
    expect(dates).toEqual(['2026-04-01', '2026-04-02']);
    expect(result.meta.dateRangeStart).toBe('2026-04-01');
    expect(result.meta.dateRangeEnd).toBe('2026-04-02');
    expect(result.meta.monthLabel).toBe('Avril 2026');
  });

  it('la somme des kcal des repas de Julien J1 égale le total quotidien', () => {
    const j1 = result.meals.filter(
      (m) => m.person_name === 'Julien' && m.meal_date === '2026-04-01'
    );
    const sum = j1.reduce((acc, m) => acc + m.kcal, 0);
    const total = result.dailyTotals.find(
      (t) => t.person_name === 'Julien' && t.meal_date === '2026-04-01'
    );
    expect(sum).toBe(650 + 550 + 250);
    expect(total.kcal).toBe(sum);
    expect(total.validated).toBe(true);
  });

  it('reporte validated=false quand ok n’est pas true', () => {
    const zoe = result.dailyTotals.find((t) => t.person_name === 'Zoé');
    expect(zoe.validated).toBe(false);
  });

  it('arrondit les macros à 1 décimale', () => {
    const restes = result.meals.find((m) => m.description === 'Restes batch');
    expect(restes.kcal).toBe(600.5);
  });

  it('mappe les types de repas et day_type', () => {
    const dej = result.meals.find((m) => m.description === 'Poulet rôti, riz complet');
    expect(dej.meal_type).toBe('dejeuner');
    expect(dej.day_type).toBe('batch');
    const col = result.meals.find((m) => m.meal_type === 'collation');
    expect(col.description).toBe('Skyr + amandes');
  });

  it('construit les tâches de prep (dinner + [Prep])', () => {
    expect(result.prepTasks).toHaveLength(2);
    expect(result.prepTasks[0]).toEqual({
      prep_date: '2026-04-01',
      prep_label: 'Mercredi 01/04',
      task: 'Cuire: le riz complet',
      estimated_time: '15 min',
    });
    expect(result.prepTasks[1].task).toBe('[Prep] Découper: les légumes');
    expect(result.prepTasks[1].estimated_time).toBeNull();
  });

  it('formate les recettes batch (timing, macros, portions)', () => {
    expect(result.batchRecipes).toHaveLength(1);
    const r = result.batchRecipes[0];
    expect(r.name).toBe('Dahl de lentilles');
    expect(r.timing).toBe('20 min / 45 min');
    expect(r.macros_per_100g).toBe('120 kcal | 7P | 15G | 3L | 4F');
    expect(r.portions).toBe('Julien: 400 g — Zoé: 300 g');
    expect(r.instructions).toBe('Ajouter la coriandre fraîche');
  });

  it('aplati la liste de courses par semaine/catégorie', () => {
    expect(result.shoppingItems).toHaveLength(2);
    expect(result.shoppingItems[0]).toEqual({
      week_label: 'S1',
      category: 'Frais',
      product_name: 'Poulet fermier',
      quantity: '1,2 kg',
      checked: false,
    });
    // Quantité absente → null
    expect(result.shoppingItems[1].quantity).toBeNull();
  });
});

describe('parseJsonPlan — champs manquants', () => {
  it('ne throw pas et met les macros absentes à null', () => {
    const partial = {
      days: [
        {
          date: '03/06',
          dayName: 'Mercredi',
          dej: { j: { desc: 'Repas sans macros' } },
          // pas de din/col/total/cooking
        },
      ],
      // pas de recipes ni groceries
    };

    let result;
    expect(() => {
      result = parseJsonPlan(JSON.stringify(partial), 'plan-2025.json');
    }).not.toThrow();

    expect(result.meals).toHaveLength(1);
    const meal = result.meals[0];
    expect(meal.meal_date).toBe('2025-06-03'); // année déduite du nom de fichier
    expect(meal.kcal).toBeNull();
    expect(meal.protein_g).toBeNull();
    expect(meal.carbs_g).toBeNull();
    expect(meal.fat_g).toBeNull();
    expect(meal.fiber_g).toBeNull();
    expect(meal.day_type).toBeNull();

    expect(result.dailyTotals).toEqual([]);
    expect(result.prepTasks).toEqual([]);
    expect(result.batchRecipes).toEqual([]);
    expect(result.shoppingItems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('tolère un objet vide (aucun jour)', () => {
    let result;
    expect(() => {
      result = parseJsonPlan('{}', 'plan.json');
    }).not.toThrow();
    expect(result.meals).toEqual([]);
    expect(result.meta.dateRangeStart).toBeNull();
    expect(result.meta.dateRangeEnd).toBeNull();
    expect(result.meta.monthLabel).toBeNull();
  });
});

describe('parseJsonPlan — payload malformé', () => {
  it('signale les dates invalides en warning et skippe le jour, sans throw', () => {
    const malformed = {
      label: 'Avril 2026',
      days: [
        { date: 'n/a', dej: { j: { desc: 'Jour avec date cassée', kcal: 'abc' } } },
        { date: '05/04', dej: { j: { desc: 'Jour valide', kcal: '512.34' } } },
      ],
    };

    let result;
    expect(() => {
      result = parseJsonPlan(JSON.stringify(malformed), 'plan.json');
    }).not.toThrow();

    expect(result.warnings).toEqual(['Date invalide: n/a']);
    expect(result.meals).toHaveLength(1);
    expect(result.meals[0].meal_date).toBe('2026-04-05');
    // kcal en chaîne numérique → parsé et arrondi ; "abc" aurait donné null
    expect(result.meals[0].kcal).toBe(512.3);
  });

  it('ignore les valeurs nutritionnelles non numériques (null, pas de NaN)', () => {
    const payload = {
      days: [
        { date: '01/04', dej: { j: { desc: 'X', kcal: 'abc', p: null, g: undefined } } },
      ],
      label: '2026',
    };
    const result = parseJsonPlan(JSON.stringify(payload), 'plan.json');
    const meal = result.meals[0];
    expect(meal.kcal).toBeNull();
    expect(meal.protein_g).toBeNull();
    expect(meal.carbs_g).toBeNull();
    expect(Number.isNaN(meal.kcal)).toBe(false);
  });
});
