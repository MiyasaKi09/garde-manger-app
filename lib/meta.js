// lib/meta.js
const norm = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

const DENSITY_RULES = [
  { rx:/huile|oil/i, gml:0.92, conf:0.9 },
  { rx:/miel|honey/i, gml:1.42, conf:0.9 },
  { rx:/sirop|syrup/i, gml:1.30, conf:0.8 },
  { rx:/vinaigre/i,    gml:1.01, conf:0.8 },
  { rx:/lait|yaourt|yogh|creme|crème/i, gml:1.02, conf:0.8 },
  { rx:/eau|bouillon|jus|coulis/i, gml:1.00, conf:0.7 },
  // poudres & secs (g/ml "vrac")
  { rx:/farine/i,   gml:0.53, conf:0.8 },
  { rx:/semoule/i,  gml:0.59, conf:0.8 },
  { rx:/sucre/i,    gml:0.85, conf:0.7 },
  { rx:/riz/i,      gml:0.85, conf:0.7 },
  { rx:/p[aâ]tes/i, gml:0.60, conf:0.6 },
  { rx:/sel/i,      gml:1.20, conf:0.6 },
];

const UNIT_WEIGHT_RULES = [
  { rx:/oeuf|œuf|egg/i,             g:60,  conf:0.9 },
  { rx:/ail.*gousse|gousse.*ail/i,  g:5,   conf:0.9 },
  { rx:/citron/i,                   g:120, conf:0.8 },
  { rx:/orange/i,                   g:180, conf:0.8 },
  { rx:/pomme(?! de terre)/i,       g:150, conf:0.7 },
  { rx:/banane/i,                   g:120, conf:0.7 },
  { rx:/avocat/i,                   g:200, conf:0.7 },
  { rx:/oignon/i,                   g:110, conf:0.7 },
  { rx:/carotte/i,                  g:70,  conf:0.7 },
  { rx:/poivron/i,                  g:160, conf:0.7 },
  { rx:/concombre/i,                g:300, conf:0.7 },
  { rx:/courgette/i,                g:200, conf:0.7 },
  { rx:/pomme de terre|patate/i,    g:180, conf:0.7 },
  // Tomates : variétés
  { rx:/tomate.*coeur.*boeuf|tomate.*cœur.*boeuf/i, g:300, conf:0.9 },
  { rx:/tomate.*cerise/i,                          g:15,  conf:0.9 },
  { rx:/tomate/i,                                  g:120, conf:0.7 },
];

function pickRule(rules, text){
  for(const r of rules){ if(r.rx.test(text)) return r; }
  return null;
}

/** Estime densité (g/ml) et poids/unité (g/u) à partir du nom/catégorie */
export function estimateProductMeta({ name='', category='' }){
  const t = `${name} ${category}`;
  const densHit = pickRule(DENSITY_RULES, t);
  const unitHit = pickRule(UNIT_WEIGHT_RULES, t);
  const density = densHit ? densHit.gml : 1.0;              // par défaut eau
  const gramsPerUnit = unitHit ? unitHit.g : null;          // null si inconnu
  return {
    density_g_per_ml: density,
    grams_per_unit: gramsPerUnit,
    confidence_density: densHit ? densHit.conf : 0.5,
    confidence_unit: unitHit ? unitHit.conf : 0.3,
    reason: { density: densHit ? 'keyword' : 'default', unit: unitHit ? 'keyword' : 'unknown' }
  };
}
