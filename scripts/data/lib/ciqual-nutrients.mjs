/**
 * Fabrique V2 — cartographie des colonnes Ciqual → nutrient_code contrôlé.
 * Réf. MYKO_DATA_FOUNDATION_V2 §3.5 (food_nutrient_values), §10.16 (micros minimaux).
 * Les colonnes sont repérées par MOTIF sur l'entête (robuste aux réordonnancements).
 */

// [nutrient_code, unité, motif d'entête]. Ordre = ordre d'insertion souhaité.
export const NUTRIENT_COLUMNS = [
  ['energy_kcal',   'kcal', /Energie,\s*R.glement UE.*kcal/i],
  ['water_g',       'g',    /^Eau\b/i],
  ['protein_g',     'g',    /Prot.ines,\s*N x 6\.25/i],
  ['fat_g',         'g',    /^Lipides\b/i],
  ['carbohydrate_g','g',    /^Glucides\b/i],
  ['sugars_g',      'g',    /^Sucres\b/i],
  ['fiber_g',       'g',    /^Fibres/i],
  ['saturated_fat_g','g',   /^AG satur.s/i],
  ['cholesterol_mg','mg',   /^Cholest.rol/i],
  ['salt_g',        'g',    /^Sel chlorure/i],
  ['sodium_mg',     'mg',   /^Sodium\b/i],
  ['calcium_mg',    'mg',   /^Calcium\b/i],
  ['copper_mg',     'mg',   /^Cuivre\b/i],
  ['iron_mg',       'mg',   /^Fer\b/i],
  ['iodine_ug',     'µg',   /^Iode\b/i],
  ['magnesium_mg',  'mg',   /^Magn.sium\b/i],
  ['manganese_mg',  'mg',   /^Mangan.se\b/i],
  ['phosphorus_mg', 'mg',   /^Phosphore\b/i],
  ['potassium_mg',  'mg',   /^Potassium\b/i],
  ['selenium_ug',   'µg',   /^S.l.nium\b/i],
  ['zinc_mg',       'mg',   /^Zinc\b/i],
  ['retinol_ug',    'µg',   /^R.tinol\b/i],
  ['beta_carotene_ug','µg', /^Beta-Carot.ne/i],
  ['vitamin_d_ug',  'µg',   /^Vitamine D\b/i],
  ['vitamin_e_mg',  'mg',   /^Vitamine E\b/i],
  ['vitamin_c_mg',  'mg',   /^Vitamine C\b/i],
  ['vitamin_b1_mg', 'mg',   /Vitamine B1\b/i],
  ['vitamin_b2_mg', 'mg',   /Vitamine B2\b/i],
  ['vitamin_b3_mg', 'mg',   /Vitamine B3\b/i],
  ['vitamin_b5_mg', 'mg',   /Vitamine B5\b/i],
  ['vitamin_b6_mg', 'mg',   /Vitamine B6\b/i],
  ['vitamin_b9_ug', 'µg',   /Vitamine B9\b/i],
  ['vitamin_b12_ug','µg',   /Vitamine B12\b/i],
]

/** Construit { nutrient_code: {index, unit} } à partir de l'entête réelle. */
export function mapNutrientColumns(header) {
  const map = {}
  for (const [code, unit, pattern] of NUTRIENT_COLUMNS) {
    const idx = header.findIndex((h) => typeof h === 'string' && pattern.test(h))
    if (idx >= 0) map[code] = { index: idx, unit }
  }
  return map
}

// Indices fixes des colonnes d'identité Ciqual.
export const COL = {
  grp_code: 0, ssgrp_code: 1, ssssgrp_code: 2,
  grp_nom: 3, ssgrp_nom: 4, ssssgrp_nom: 5,
  alim_code: 6, alim_nom_fr: 7, alim_nom_sci: 8,
}
