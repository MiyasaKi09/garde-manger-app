require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeDB() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   ANALYSE DE LA BASE DE DONNÉES ACTUELLE');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Canonical foods
  const { data: canonicals } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .order('id');

  console.log('📊 CANONICAL_FOODS:', canonicals.length);
  console.log('Exemples:');
  canonicals.slice(0, 10).forEach(c => {
    console.log(`   ${c.id}: ${c.canonical_name}`);
  });

  // 2. Cultivars
  const { data: cultivars } = await supabase
    .from('cultivars')
    .select('*')
    .order('id');

  console.log(`\n📊 CULTIVARS: ${cultivars.length}`);
  if (cultivars.length > 0) {
    cultivars.forEach(c => console.log(`   ${c.id}: ${c.cultivar_name} → canonical ${c.canonical_food_id}`));
  } else {
    console.log('   (vide)');
  }

  // 3. Archetypes - voir lesquels ont canonical_food_id vs cultivar_id
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id, cultivar_id, process')
    .order('id');

  console.log(`\n📊 ARCHETYPES: ${archetypes.length}`);

  const withCanonical = archetypes.filter(a => a.canonical_food_id !== null && a.cultivar_id === null);
  const withCultivar = archetypes.filter(a => a.cultivar_id !== null && a.canonical_food_id === null);
  const withBoth = archetypes.filter(a => a.canonical_food_id !== null && a.cultivar_id !== null);
  const withNeither = archetypes.filter(a => a.canonical_food_id === null && a.cultivar_id === null);

  console.log(`   - Liés à canonical uniquement: ${withCanonical.length}`);
  console.log(`   - Liés à cultivar uniquement: ${withCultivar.length}`);
  console.log(`   - Liés aux deux (!!): ${withBoth.length}`);
  console.log(`   - Liés à rien: ${withNeither.length}`);

  console.log('\n   Exemples liés au canonical "lait":');
  const laitId = canonicals.find(c => c.canonical_name === 'lait')?.id;
  if (laitId) {
    const laitArchetypes = archetypes.filter(a => a.canonical_food_id === laitId).slice(0, 10);
    laitArchetypes.forEach(a => {
      console.log(`   ${a.id}: ${a.name} (${a.process})`);
    });
  }

  console.log('\n   Exemples liés au canonical "bœuf":');
  const boeufId = canonicals.find(c => c.canonical_name === 'bœuf')?.id;
  if (boeufId) {
    const boeufArchetypes = archetypes.filter(a => a.canonical_food_id === boeufId).slice(0, 10);
    boeufArchetypes.forEach(a => {
      console.log(`   ${a.id}: ${a.name} (${a.process})`);
    });
  }

  // 4. Recipe ingredients - voir ce qui est utilisé
  const { data: recipeIngredients } = await supabase
    .from('recipe_ingredients')
    .select('canonical_food_id, archetype_id');

  console.log(`\n📊 RECIPE_INGREDIENTS: ${recipeIngredients.length} liens`);

  const viaCanonical = recipeIngredients.filter(ri => ri.canonical_food_id !== null && ri.archetype_id === null);
  const viaArchetype = recipeIngredients.filter(ri => ri.archetype_id !== null && ri.canonical_food_id === null);
  const viaBoth = recipeIngredients.filter(ri => ri.canonical_food_id !== null && ri.archetype_id !== null);

  console.log(`   - Via canonical uniquement: ${viaCanonical.length}`);
  console.log(`   - Via archetype uniquement: ${viaArchetype.length}`);
  console.log(`   - Via les deux (!!): ${viaBoth.length}`);

  // 5. Analyser la cohérence
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   PROBLÈMES DÉTECTÉS');
  console.log('═══════════════════════════════════════════════════════\n');

  if (withBoth.length > 0) {
    console.log('❌ Archetypes avec canonical_food_id ET cultivar_id (incohérent):');
    withBoth.forEach(a => {
      console.log(`   ${a.id}: ${a.name}`);
    });
  }

  if (viaBoth.length > 0) {
    console.log('\n❌ Recipe_ingredients avec canonical_food_id ET archetype_id (incohérent):');
    console.log(`   ${viaBoth.length} liens`);
  }

  if (withNeither.length > 0) {
    console.log('\n⚠️  Archetypes sans canonical_food_id ni cultivar_id (orphelins):');
    withNeither.slice(0, 20).forEach(a => {
      console.log(`   ${a.id}: ${a.name}`);
    });
    if (withNeither.length > 20) {
      console.log(`   ... et ${withNeither.length - 20} autres`);
    }
  }

  // 6. Analyser les duplications potentielles
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   DUPLICATIONS POTENTIELLES');
  console.log('═══════════════════════════════════════════════════════\n');

  const archetypeNames = {};
  archetypes.forEach(a => {
    const normalized = a.name.toLowerCase().trim();
    if (!archetypeNames[normalized]) {
      archetypeNames[normalized] = [];
    }
    archetypeNames[normalized].push(a);
  });

  const duplicates = Object.entries(archetypeNames).filter(([name, list]) => list.length > 1);
  if (duplicates.length > 0) {
    console.log('⚠️  Noms d\'archetypes similaires (potentiels doublons):');
    duplicates.slice(0, 10).forEach(([name, list]) => {
      console.log(`\n   "${name}" (${list.length} fois):`);
      list.forEach(a => {
        console.log(`      - id ${a.id}: canonical=${a.canonical_food_id}, cultivar=${a.cultivar_id}`);
      });
    });
  }

  // Sauvegarder le rapport
  const report = {
    summary: {
      canonicals: canonicals.length,
      cultivars: cultivars.length,
      archetypes: archetypes.length,
      recipe_ingredients: recipeIngredients.length
    },
    archetypes_breakdown: {
      with_canonical: withCanonical.length,
      with_cultivar: withCultivar.length,
      with_both: withBoth.length,
      with_neither: withNeither.length
    },
    recipe_ingredients_breakdown: {
      via_canonical: viaCanonical.length,
      via_archetype: viaArchetype.length,
      via_both: viaBoth.length
    },
    problems: {
      archetypes_with_both: withBoth,
      recipe_ingredients_with_both: viaBoth.length,
      orphan_archetypes: withNeither.length,
      duplicate_names: duplicates.length
    }
  };

  fs.writeFileSync('DB_ANALYSIS.json', JSON.stringify(report, null, 2));
  console.log('\n✅ Rapport sauvegardé: DB_ANALYSIS.json');

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   RECOMMANDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Pour Option B (pragmatique), il faut:');
  console.log('1. Garder les archetypes liés au canonical (OK)');
  console.log('2. Créer des cultivars SEULEMENT pour les vrais différents');
  console.log('3. Nettoyer les incohérences (both, orphelins)');
  console.log('4. Fusionner les doublons');
  console.log('5. S\'assurer que recipe_ingredients pointe vers UN SEUL niveau\n');
}

analyzeDB().catch(console.error);
