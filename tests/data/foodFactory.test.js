import { describe, it, expect } from 'vitest'
import { normalizeName, parseCiqualValue, parseFoodName } from '@/scripts/data/lib/normalize.mjs'
import { resolveCategory, isKnownCategory } from '@/scripts/data/lib/categories.mjs'
import { detectAnomalies } from '@/scripts/data/lib/anomalies.mjs'
import { mapNutrientColumns } from '@/scripts/data/lib/ciqual-nutrients.mjs'

describe('normalizeName', () => {
  it('minuscule, retire accents et ponctuation', () => {
    expect(normalizeName('Chou-fleur, cuit')).toBe('chou fleur cuit')
    expect(normalizeName("Pomme Granny Smith, pulpe et peau, crue")).toBe('pomme granny smith pulpe et peau crue')
    expect(normalizeName('Épeautre')).toBe('epeautre')
  })
})

describe('parseCiqualValue', () => {
  it('virgule décimale, traces, tirets, seuils <', () => {
    expect(parseCiqualValue('45,4')).toEqual({ amount: 45.4, status: 'measured' })
    expect(parseCiqualValue('traces')).toEqual({ amount: null, status: 'trace' })
    expect(parseCiqualValue('-')).toEqual({ amount: null, status: 'not_available' })
    expect(parseCiqualValue('< 0,01')).toEqual({
      amount: null,
      status: 'less_than',
      upper_bound: 0.01,
    })
    expect(parseCiqualValue('< 0')).toEqual({
      amount: null,
      status: 'less_than',
      upper_bound: 0,
    })
    expect(parseCiqualValue(12.5)).toEqual({ amount: 12.5, status: 'measured' })
    expect(parseCiqualValue(null)).toEqual({ amount: null, status: 'not_available' })
  })
})

describe('parseFoodName', () => {
  it('extrait concept + états cuisson/os/peau', () => {
    const r = parseFoodName('Poulet, cuisse, viande et peau, cru')
    expect(r.concept).toBe('Poulet')
    expect(r.cooking_state).toBe('raw')
    const c = parseFoodName('Carotte, cuite')
    expect(c.cooking_state).toBe('cooked')
    const d = parseFoodName('Dinde, escalope, crue')
    expect(d.bone_state).toBe('boneless')
  })

  /**
   * Le masculin singulier finit par une lettre accentuée, et `\b` de JavaScript
   * ne connaît que l'ASCII : il n'existe aucune frontière de mot après « é ».
   * `/\bsurgelé\b/` ne reconnaissait donc PAS « surgelé », alors qu'il
   * reconnaissait « surgelée » et « surgelés » — le féminin et le pluriel
   * marchaient, ce qui rendait la panne indétectable à la lecture.
   *
   * Elle a coûté exactement ceci : « Petit pois surgelé », seule forme surgelée
   * du catalogue, sortait avec preservation_state = null, soit indistinguable
   * d'un légume frais pour tout ce qui lit cet état. Onze herbes et épices
   * « séché », deux découpes « désossé » et un « appertisé » étaient dans le
   * même cas.
   */
  it('reconnaît le masculin singulier, dont la finale est accentuée', () => {
    expect(parseFoodName('Petit pois surgelé').preservation_state).toBe('frozen')
    expect(parseFoodName('Épinard surgelé').preservation_state).toBe('frozen')
    expect(parseFoodName('Thym séché').preservation_state).toBe('dried')
    expect(parseFoodName('Haricot flageolet appertisé, égoutté').preservation_state).toBe('canned')
    expect(parseFoodName('Haut de cuisse de poulet cru, désossé').bone_state).toBe('boneless')
    // La frontière GAUCHE souffrait du même défaut : un « à » n'est pas plus
    // un caractère de mot qu'un « é ».
    expect(parseFoodName("Bœuf, macreuse, à l'étuvée").cooking_state).toBe('cooked')
  })

  it('le féminin et le pluriel continuent de marcher', () => {
    expect(parseFoodName('Carotte, surgelée, crue').preservation_state).toBe('frozen')
    expect(parseFoodName('Petits pois, surgelés, crus').preservation_state).toBe('frozen')
    expect(parseFoodName('Épinard frais').preservation_state).toBe('fresh')
  })

  it('ne déborde pas sur un mot qui commence pareil', () => {
    // « Crumble » et « Cruche » commencent par « cru » : sans frontière droite,
    // ils passeraient pour des aliments crus.
    expect(parseFoodName('Crumble aux pommes').cooking_state).toBe(null)
    expect(parseFoodName('Cruche').cooking_state).toBe(null)
  })
})

describe('resolveCategory', () => {
  it('mappe les groupes Ciqual vers la taxonomie Myko', () => {
    expect(resolveCategory('fruits, légumes, légumineuses et oléagineux', 'légumes', 'Carotte, crue')).toBe('legumes')
    expect(resolveCategory('fruits, légumes, légumineuses et oléagineux', 'fruits', 'Pomme')).toBe('fruits')
    expect(resolveCategory('produits laitiers et assimilés', 'fromages', 'Brie')).toBe('produits_laitiers')
    expect(resolveCategory('matières grasses', '', 'Huile')).toBe('matieres_grasses')
    expect(resolveCategory('aliments infantiles', '', 'Petit pot')).toBe(null)
  })

  it('œufs et charcuterie AVANT volailles (pas de faux positif)', () => {
    expect(resolveCategory('viandes, œufs, poissons et assimilés', 'œufs', "Oeuf de caille, cru")).toBe('oeufs')
    expect(resolveCategory('viandes, œufs, poissons et assimilés', 'charcuteries', 'Rillettes de canard')).toBe('produits_transformes')
  })

  it('"Baudroie" ne matche pas "oie" (word boundary → poisson)', () => {
    expect(resolveCategory('viandes, œufs, poissons et assimilés', 'poissons', 'Lotte ou baudroie, crue')).toBe('poissons_fruits_de_mer')
  })

  it('toutes les catégories retournées sont connues', () => {
    const c = resolveCategory('viandes, œufs, poissons et assimilés', 'volailles', 'Poulet, cru')
    expect(isKnownCategory(c)).toBe(true)
  })
})

describe('detectAnomalies', () => {
  it('nutriment négatif → bloquant', () => {
    expect(detectAnomalies({ energy_kcal: 100, protein_g: -1 }).blocking.length).toBeGreaterThan(0)
  })
  it('somme macros > 100 g → bloquant', () => {
    expect(detectAnomalies({ protein_g: 60, carbohydrate_g: 30, fat_g: 20 }).blocking.some((b) => b.startsWith('macro_sum'))).toBe(true)
  })
  it('cohérence 4-4-9 : profil cohérent = aucune anomalie', () => {
    const r = detectAnomalies({ energy_kcal: 113, protein_g: 20, carbohydrate_g: 0, fat_g: 3.73 })
    expect(r.blocking).toEqual([])
  })
  it('énergie aberrante > 950 → bloquant', () => {
    expect(detectAnomalies({ energy_kcal: 1200, fat_g: 50 }).blocking.some((b) => b.startsWith('energy_out_of_range'))).toBe(true)
  })
})

describe('mapNutrientColumns', () => {
  it('repère les colonnes par motif d\'entête', () => {
    const header = [
      'alim_code', 'alim_nom_fr',
      'Energie, Règlement UE N° 1169/2011 (kcal/100 g)',
      'Protéines, N x 6.25 (g/100 g)', 'Lipides (g/100 g)', 'Fer (mg/100 g)',
      'Vitamine B12 (µg/100 g)',
    ]
    const m = mapNutrientColumns(header)
    expect(m.energy_kcal.index).toBe(2)
    expect(m.protein_g.index).toBe(3)
    expect(m.iron_mg).toMatchObject({ unit: 'mg' })
    expect(m.vitamin_b12_ug.index).toBe(6)
  })

  it('distingue les folates totaux des équivalents DFE de Ciqual 2025', () => {
    const header = [
      'Vitamine B9, équivalents folates alimentaires DFE (µg/100 g)',
      'Vitamine B9 ou Folates totaux (µg/100 g)',
    ]
    expect(mapNutrientColumns(header).vitamin_b9_ug.index).toBe(1)
  })
})
