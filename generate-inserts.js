// Générer les inserts SQL pour canonical_foods, cultivars et archetypes
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs des canonical_foods existants (récupérés de la requête précédente)
const CANONICAL_IDS = {
  'lait': 7001,
  'bœuf': 14011,
  'porc': 2051,
  'veau': 8015,
  'agneau': 4001,
  'poulet': 2054,
  'saumon': 2062,
  'cabillaud': 2004,
};

// Nouveaux canonical_foods à créer
const newCanonicalFoods = [
  { name: 'lait de chèvre', primary_unit: 'ml', category_id: null },
  { name: 'pain', primary_unit: 'g', category_id: null },
  { name: 'farine de blé', primary_unit: 'g', category_id: null },
  { name: 'vin', primary_unit: 'ml', category_id: null },
  { name: 'bière', primary_unit: 'ml', category_id: null },
  { name: 'pâtes', primary_unit: 'g', category_id: null },
  { name: 'riz', primary_unit: 'g', category_id: null },
  { name: 'soja', primary_unit: 'g', category_id: null },
  { name: 'blé', primary_unit: 'g', category_id: null },
];

// Cultivars à créer (variétés de canonical_foods)
const newCultivars = [
  { name: 'morue', canonical_food_id: CANONICAL_IDS['cabillaud'], specificity: 'salé/séché' },
];

// Archetypes principaux à créer (transformations/préparations)
const newArchetypes = [
  // === FROMAGES (archetypes de lait) ===
  { name: 'emmental', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage affiné', primary_unit: 'g' },
  { name: 'gruyère', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage affiné', primary_unit: 'g' },
  { name: 'comté', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage affiné', primary_unit: 'g' },
  { name: 'parmesan', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage affiné', primary_unit: 'g' },
  { name: 'mozzarella', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage frais', primary_unit: 'g' },
  { name: 'ricotta', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage frais', primary_unit: 'g' },
  { name: 'pecorino', canonical_food_id: CANONICAL_IDS['lait'], process: 'fromage affiné', primary_unit: 'g' },
  // Fromages de chèvre - à créer après avoir l'ID de "lait de chèvre"
  // { name: 'chèvre frais', canonical_food_id: NEW_ID, process: 'fromage frais', primary_unit: 'g' },
  // { name: 'feta', canonical_food_id: NEW_ID, process: 'fromage frais', primary_unit: 'g' },

  // === VIANDE BŒUF ===
  { name: 'bœuf haché', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'haché', primary_unit: 'g' },
  { name: 'bœuf en morceaux', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'en morceaux', primary_unit: 'g' },
  { name: 'steak de bœuf', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'steak', primary_unit: 'pièce' },
  { name: 'entrecôte', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'entrecôte', primary_unit: 'g' },
  { name: 'filet de bœuf', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'filet', primary_unit: 'g' },
  { name: 'côte de bœuf', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'côte', primary_unit: 'g' },

  // === VIANDE VEAU ===
  { name: 'veau haché', canonical_food_id: CANONICAL_IDS['veau'], process: 'haché', primary_unit: 'g' },
  { name: 'veau en morceaux', canonical_food_id: CANONICAL_IDS['veau'], process: 'en morceaux', primary_unit: 'g' },
  { name: 'escalope de veau', canonical_food_id: CANONICAL_IDS['veau'], process: 'escalope', primary_unit: 'pièce' },
  { name: 'rôti de veau', canonical_food_id: CANONICAL_IDS['veau'], process: 'rôti', primary_unit: 'g' },
  { name: 'paupiette de veau', canonical_food_id: CANONICAL_IDS['veau'], process: 'paupiette', primary_unit: 'pièce' },

  // === VIANDE AGNEAU ===
  { name: 'agneau haché', canonical_food_id: CANONICAL_IDS['agneau'], process: 'haché', primary_unit: 'g' },
  { name: 'agneau en morceaux', canonical_food_id: CANONICAL_IDS['agneau'], process: 'en morceaux', primary_unit: 'g' },
  { name: 'côtelette d\'agneau', canonical_food_id: CANONICAL_IDS['agneau'], process: 'côtelette', primary_unit: 'pièce' },
  { name: 'épaule d\'agneau', canonical_food_id: CANONICAL_IDS['agneau'], process: 'épaule', primary_unit: 'g' },
  { name: 'gigot d\'agneau', canonical_food_id: CANONICAL_IDS['agneau'], process: 'gigot', primary_unit: 'g' },

  // === CHARCUTERIE (archetypes de porc) ===
  { name: 'lardons', canonical_food_id: CANONICAL_IDS['porc'], process: 'lardons', primary_unit: 'g' },
  { name: 'bacon', canonical_food_id: CANONICAL_IDS['porc'], process: 'bacon', primary_unit: 'tranche' },
  { name: 'jambon cuit', canonical_food_id: CANONICAL_IDS['porc'], process: 'jambon cuit', primary_unit: 'g' },
  { name: 'jambon cru', canonical_food_id: CANONICAL_IDS['porc'], process: 'jambon cru', primary_unit: 'g' },
  { name: 'saucisse', canonical_food_id: CANONICAL_IDS['porc'], process: 'saucisse', primary_unit: 'pièce' },
  { name: 'chair à saucisse', canonical_food_id: CANONICAL_IDS['porc'], process: 'chair à saucisse', primary_unit: 'g' },
  { name: 'boudin noir', canonical_food_id: CANONICAL_IDS['porc'], process: 'boudin', primary_unit: 'pièce' },

  // === POISSON ===
  { name: 'saumon fumé', canonical_food_id: CANONICAL_IDS['saumon'], process: 'fumé', primary_unit: 'g' },
  // morue dessalée sera créé après avoir l'ID du cultivar "morue"

  // === BOUILLONS (archetypes de viande/poisson) ===
  { name: 'bouillon de bœuf', canonical_food_id: CANONICAL_IDS['bœuf'], process: 'bouillon', primary_unit: 'ml' },
  { name: 'bouillon de volaille', canonical_food_id: CANONICAL_IDS['poulet'], process: 'bouillon', primary_unit: 'ml' },
  { name: 'fumet de poisson', canonical_food_id: CANONICAL_IDS['cabillaud'], process: 'fumet', primary_unit: 'ml' },

  // === PRODUITS À BASE DE SOJA ===
  // { name: 'tofu', canonical_food_id: NEW_SOJA_ID, process: 'tofu', primary_unit: 'g' },
  // { name: 'tempeh', canonical_food_id: NEW_SOJA_ID, process: 'tempeh', primary_unit: 'g' },

  // === PRODUITS À BASE DE BLÉ ===
  // { name: 'seitan', canonical_food_id: NEW_BLE_ID, process: 'seitan', primary_unit: 'g' },
];

async function generateInserts() {
  console.log('=== GÉNÉRATION DES INSERTS ===\n');

  let sqlStatements = [];

  // 1. Nouveaux canonical_foods
  console.log('1️⃣ Canonical_foods à créer:', newCanonicalFoods.length);
  newCanonicalFoods.forEach(cf => {
    sqlStatements.push(`INSERT INTO canonical_foods (canonical_name, primary_unit, category_id) VALUES ('${cf.name}', '${cf.primary_unit}', NULL);`);
  });

  // 2. Cultivars
  console.log('2️⃣ Cultivars à créer:', newCultivars.length);
  newCultivars.forEach(cv => {
    sqlStatements.push(`INSERT INTO cultivars (name, canonical_food_id, specificity) VALUES ('${cv.name}', ${cv.canonical_food_id}, '${cv.specificity}');`);
  });

  // 3. Archetypes
  console.log('3️⃣ Archetypes à créer:', newArchetypes.length);
  newArchetypes.forEach(arch => {
    sqlStatements.push(`INSERT INTO archetypes (name, canonical_food_id, process, primary_unit) VALUES ('${arch.name}', ${arch.canonical_food_id}, '${arch.process}', '${arch.primary_unit}');`);
  });

  // Sauvegarder le SQL
  const sqlContent = sqlStatements.join('\n');
  fs.writeFileSync('INSERT_INGREDIENTS.sql', sqlContent);

  console.log('\n✅ Fichier SQL généré: INSERT_INGREDIENTS.sql');
  console.log(`📊 Total: ${sqlStatements.length} statements`);

  console.log('\n=== RÉSUMÉ ===');
  console.log(`- ${newCanonicalFoods.length} nouveaux canonical_foods`);
  console.log(`- ${newCultivars.length} nouveaux cultivars`);
  console.log(`- ${newArchetypes.length} nouveaux archetypes`);

  // Afficher les mapping pour l'import
  console.log('\n=== MAPPING POUR IMPORT ===');
  console.log('Les variantes suivantes seront mappées:');
  console.log('\nFROM: boeuf haché, viande hachée, viande boeuf');
  console.log('  TO: bœuf haché (archetype)');
  console.log('\nFROM: lardons, lardons fumés, lard, poitrine fumée');
  console.log('  TO: lardons (archetype)');
  console.log('\nFROM: fromage râpé, gruyère râpé, comté râpé, parmesan râpé');
  console.log('  TO: [fromage spécifique] (archetype) - à gérer individuellement');
}

generateInserts().catch(console.error);
