// Classification simplifiée avec une approche GÉNÉRIQUE
// Principe: privilégier la largesse et accepter les variations
// Ex: "crème fraîche" accepte liquide, épaisse, 30%, 35%, etc.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCanonicalFoodIds() {
  const { data, error } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name');

  if (error) throw error;

  const index = {};
  data.forEach(cf => {
    index[cf.canonical_name.toLowerCase()] = cf.id;
  });
  return index;
}

async function simplifiedClassification() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   CLASSIFICATION SIMPLIFIÉE (APPROCHE GÉNÉRIQUE)');
  console.log('═══════════════════════════════════════════════════════\n');

  const canonicalIds = await getCanonicalFoodIds();

  // Charger les résultats de classification
  const results = JSON.parse(fs.readFileSync('CLASSIFICATION_RESULTS.json', 'utf-8'));

  // INGRÉDIENTS GÉNÉRIQUES à créer (canonical)
  const genericCanonical = [
    // === ALCOOLS (keep specific, different flavors) ===
    { name: 'Grand Marnier', unit: 'ml' },
    { name: 'Marsala', unit: 'ml' },
    { name: 'amaretto', unit: 'ml' },
    { name: 'calvados', unit: 'ml' },
    { name: 'kirsch', unit: 'ml' },
    { name: 'porto', unit: 'ml' },
    { name: 'rhum', unit: 'ml' },  // GENERIC (pas "rhum ambré")

    // === BIÈRES ET VINS (simplified) ===
    { name: 'bière', unit: 'ml' },  // GENERIC (pas blonde/ambrée/brune)
    { name: 'cidre', unit: 'ml' },  // GENERIC (pas "cidre brut")
    { name: 'vin blanc', unit: 'ml' },  // GENERIC
    { name: 'vin rouge', unit: 'ml' },  // GENERIC

    // === FARINES (by grain type, not by technical grade) ===
    { name: 'farine de blé', unit: 'g' },  // GENERIC (remplace T45, T65, T00, manitoba, etc.)
    { name: 'farine complète', unit: 'g' },  // Keep (different type)
    { name: 'farine de teff', unit: 'g' },  // Keep (different grain)

    // === PAINS (keep only structurally different) ===
    { name: 'pain', unit: 'g' },  // GENERIC (includes pain de campagne, pain rassis, etc.)
    { name: 'baguette', unit: 'g' },  // Keep (specific shape)
    { name: 'brioche', unit: 'g' },  // Keep (different dough)
    { name: 'pain de mie', unit: 'g' },  // Keep (specific type)
    { name: "pain d'épices", unit: 'g' },  // Keep (very specific)
    { name: 'pains burger', unit: 'pièce' },  // Keep (specific use)
    { name: 'mie de pain', unit: 'g' },  // Keep (breadcrumbs)

    // === PÂTES (simplified categories) ===
    { name: 'pâtes longues', unit: 'g' },  // GENERIC (linguine, tagliatelles, spaghetti, etc.)
    { name: 'pâtes courtes', unit: 'g' },  // GENERIC (penne, etc.)
    { name: 'nouilles', unit: 'g' },  // GENERIC Asian noodles (ramen, soba, udon, chinoises, etc.)
    { name: 'gnocchis', unit: 'g' },  // Keep (different structure)
    { name: 'raviolis', unit: 'g' },  // Keep (filled pasta)
    { name: 'cannelloni', unit: 'g' },  // Keep (specific shape)
    { name: 'pâte à pizza', unit: 'g' },  // Keep (ready-made)

    // === ÉPICES (keep specific, very different flavors) ===
    { name: 'paprika', unit: 'g' },  // GENERIC (includes doux, fumé, etc.)
    { name: 'curry', unit: 'g' },
    { name: 'garam masala', unit: 'g' },
    { name: 'cinq épices', unit: 'g' },
    { name: 'quatre-épices', unit: 'g' },
    { name: 'berbéré', unit: 'g' },

    // === POISSONS (generic categories) ===
    { name: 'poisson blanc', unit: 'g' },  // GENERIC (remplace tous les "poissons blancs variés", etc.)
    { name: 'lotte', unit: 'g' },  // Keep (specific)
    { name: 'sole', unit: 'g' },  // Keep (specific)
    { name: 'morue', unit: 'g' },  // GENERIC (includes dessalée)

    // === FRUITS DE MER ===
    { name: 'crevettes', unit: 'g' },  // Keep from existing
    { name: 'calamars', unit: 'g' },
    { name: 'palourdes', unit: 'g' },
    { name: 'homards', unit: 'g' },
    { name: 'langoustines', unit: 'g' },

    // === LÉGUMES (keep specific) ===
    { name: 'courgettes', unit: 'g' },
    { name: 'blettes', unit: 'g' },
    { name: 'poireaux', unit: 'g' },  // GENERIC (includes "blanc de poireau")
    { name: 'patates douces', unit: 'g' },

    // === PRODUITS VÉGÉTARIENS ===
    { name: 'tofu', unit: 'g' },  // GENERIC (ferme, frit, soyeux, etc.)
    { name: 'tempeh', unit: 'g' },
    { name: 'seitan', unit: 'g' },  // GENERIC (includes "seitan haché")

    // === CONDIMENTS ===
    { name: 'vinaigre de riz', unit: 'ml' },  // GENERIC
    { name: "vinaigre d'estragon", unit: 'ml' },
    { name: 'sauce poisson', unit: 'ml' },

    // === SPÉCIALITÉS ===
    { name: 'pâte phyllo', unit: 'g' },
    { name: 'pâte de sésame', unit: 'g' },
    { name: 'pâte arachide', unit: 'g' },
    { name: 'pâte haricot rouge', unit: 'g' },
    { name: 'pâte achiote', unit: 'g' },
    { name: 'pâte laksa', unit: 'g' },

    // === DIVERS ===
    { name: 'arêtes de poisson', unit: 'g' },
    { name: 'grenouilles', unit: 'g' },
  ];

  // ARCHETYPES GÉNÉRIQUES
  const laitId = canonicalIds['lait'];
  const boeufId = canonicalIds['bœuf'] || canonicalIds['boeuf'];
  const porcId = canonicalIds['porc'];
  const veauId = canonicalIds['veau'];
  const agneauId = canonicalIds['agneau'];
  const pouletId = canonicalIds['poulet'];
  const poissonId = canonicalIds['poisson'];

  const genericArchetypes = [
    // === PRODUITS LAITIERS ===
    // Fromages: UN SEUL archetype générique + catégories d'usage
    { name: 'fromage', parent_id: laitId, parent_name: 'lait', process: 'fromage', unit: 'g' },  // GENERIC
    { name: 'fromage râpé', parent_id: laitId, parent_name: 'lait', process: 'fromage', unit: 'g' },  // Keep (specific use)
    { name: 'fromage frais', parent_id: laitId, parent_name: 'lait', process: 'fromage', unit: 'g' },  // Keep (specific texture)
    { name: 'fromage de chèvre', parent_id: laitId, parent_name: 'lait', process: 'fromage', unit: 'g' },  // Keep (different milk)

    // Crèmes: DEUX archetypes (dairy vs pastry)
    { name: 'crème fraîche', parent_id: laitId, parent_name: 'lait', process: 'crème', unit: 'ml' },  // GENERIC (liquide, épaisse, 30%, 35%, fouettée, etc.)
    { name: 'crème pâtissière', parent_id: laitId, parent_name: 'lait', process: 'crème', unit: 'g' },  // GENERIC (includes chocolat, chiboust, etc.)

    // === VIANDES ===
    // Bœuf: archetypes GÉNÉRIQUES par type de découpe/préparation
    { name: 'bœuf haché', parent_id: boeufId, parent_name: 'bœuf', process: 'haché', unit: 'g' },  // GENERIC
    { name: 'bœuf en morceaux', parent_id: boeufId, parent_name: 'bœuf', process: 'en morceaux', unit: 'g' },  // GENERIC (braiser, mijoter, etc.)
    { name: 'steak de bœuf', parent_id: boeufId, parent_name: 'bœuf', process: 'steak', unit: 'pièce' },  // GENERIC (tournedos, pavé, entrecôte, etc.)
    { name: 'côte de bœuf', parent_id: boeufId, parent_name: 'bœuf', process: 'côte', unit: 'g' },
    { name: 'filet de bœuf', parent_id: boeufId, parent_name: 'bœuf', process: 'filet', unit: 'g' },

    // Veau: archetypes GÉNÉRIQUES
    { name: 'veau haché', parent_id: veauId, parent_name: 'veau', process: 'haché', unit: 'g' },
    { name: 'escalope de veau', parent_id: veauId, parent_name: 'veau', process: 'escalope', unit: 'pièce' },  // GENERIC
    { name: 'veau en morceaux', parent_id: veauId, parent_name: 'veau', process: 'en morceaux', unit: 'g' },  // GENERIC (blanquette, sauté, etc.)
    { name: 'côte de veau', parent_id: veauId, parent_name: 'veau', process: 'côte', unit: 'pièce' },
    { name: 'rôti de veau', parent_id: veauId, parent_name: 'veau', process: 'rôti', unit: 'g' },

    // Agneau: archetypes GÉNÉRIQUES
    { name: 'agneau haché', parent_id: agneauId, parent_name: 'agneau', process: 'haché', unit: 'g' },
    { name: 'agneau en morceaux', parent_id: agneauId, parent_name: 'agneau', process: 'en morceaux', unit: 'g' },  // GENERIC
    { name: 'côtelette d\'agneau', parent_id: agneauId, parent_name: 'agneau', process: 'côtelette', unit: 'pièce' },  // GENERIC
    { name: 'gigot d\'agneau', parent_id: agneauId, parent_name: 'agneau', process: 'gigot', unit: 'g' },
    { name: 'épaule d\'agneau', parent_id: agneauId, parent_name: 'agneau', process: 'épaule', unit: 'g' },

    // Porc/Charcuterie: archetypes GÉNÉRIQUES
    { name: 'lard', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },  // GENERIC (fumé, dessalé, etc.)
    { name: 'lardons', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },  // GENERIC (fumés, nature, etc.)
    { name: 'jambon', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },  // GENERIC (cru, cuit, blanc, serrano, ibérique, etc.)
    { name: 'saucisse', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },  // GENERIC (Toulouse, Strasbourg, fumées, etc.)
    { name: 'chair à saucisse', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },
    { name: 'boudin noir', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'g' },
    { name: 'bacon', parent_id: porcId, parent_name: 'porc', process: 'transformation', unit: 'tranche' },

    // === BOUILLONS ===
    { name: 'bouillon de bœuf', parent_id: boeufId, parent_name: 'bœuf', process: 'bouillon', unit: 'ml' },
    { name: 'bouillon de poulet', parent_id: pouletId, parent_name: 'poulet', process: 'bouillon', unit: 'ml' },  // GENERIC (volaille, etc.)
    { name: 'fumet de poisson', parent_id: poissonId, parent_name: 'poisson', process: 'bouillon', unit: 'ml' },
  ];

  // Afficher le résumé
  console.log('📋 INGRÉDIENTS CANONICAL GÉNÉRIQUES:');
  console.log(`   Total: ${genericCanonical.length} ingrédients\n`);
  genericCanonical.forEach(item => {
    console.log(`   ✓ ${item.name} (${item.unit})`);
  });

  console.log('\n📋 ARCHETYPES GÉNÉRIQUES:');
  console.log(`   Total: ${genericArchetypes.length} archetypes\n`);
  genericArchetypes.forEach(item => {
    console.log(`   ✓ ${item.name} → ${item.parent_name} (${item.unit})`);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                   STATISTIQUES');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('AVANT (classification automatique):');
  console.log(`   - Canonical à créer: ${results.a_creer_canonical.length}`);
  console.log(`   - Archetypes à créer: ${results.a_creer_archetype.length}`);
  console.log(`   - Ambigus: ${results.ambigus.length}`);
  console.log(`   - TOTAL: ${results.a_creer_canonical.length + results.a_creer_archetype.length + results.ambigus.length}\n`);

  console.log('APRÈS (approche générique):');
  console.log(`   - Canonical génériques: ${genericCanonical.length}`);
  console.log(`   - Archetypes génériques: ${genericArchetypes.length}`);
  console.log(`   - TOTAL: ${genericCanonical.length + genericArchetypes.length}`);
  console.log(`   - RÉDUCTION: ${((1 - (genericCanonical.length + genericArchetypes.length) / (results.a_creer_canonical.length + results.a_creer_archetype.length)) * 100).toFixed(0)}%\n`);

  console.log('💡 PRINCIPES DE SIMPLIFICATION:');
  console.log('   1. Farines: "farine de blé" au lieu de T45/T65/T00/manitoba');
  console.log('   2. Bières: "bière" au lieu de blonde/ambrée/brune');
  console.log('   3. Fromages: "fromage" générique + catégories d\'usage (râpé, frais)');
  console.log('   4. Crèmes: "crème fraîche" (liquide/épaisse/30%/35%) + "crème pâtissière"');
  console.log('   5. Viandes: archetypes génériques par type de découpe (steak, morceaux, etc.)');
  console.log('   6. Pâtes: "pâtes longues" et "pâtes courtes" au lieu de chaque forme');
  console.log('   7. Poissons: "poisson blanc" au lieu de "poissons blancs variés"');
  console.log('   8. Charcuterie: "jambon" au lieu de cru/cuit/serrano/ibérique\n');

  // Sauvegarder
  const output = {
    canonical: genericCanonical,
    archetypes: genericArchetypes,
    stats: {
      before: {
        canonical: results.a_creer_canonical.length,
        archetypes: results.a_creer_archetype.length,
        ambiguous: results.ambigus.length,
        total: results.a_creer_canonical.length + results.a_creer_archetype.length + results.ambigus.length
      },
      after: {
        canonical: genericCanonical.length,
        archetypes: genericArchetypes.length,
        total: genericCanonical.length + genericArchetypes.length
      },
      reduction_percent: ((1 - (genericCanonical.length + genericArchetypes.length) / (results.a_creer_canonical.length + results.a_creer_archetype.length)) * 100).toFixed(0)
    }
  };

  fs.writeFileSync('SIMPLIFIED_CLASSIFICATION.json', JSON.stringify(output, null, 2));
  console.log('✅ Classification simplifiée sauvegardée: SIMPLIFIED_CLASSIFICATION.json\n');

  return output;
}

simplifiedClassification().catch(console.error);
