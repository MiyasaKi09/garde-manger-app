// Audit complet de l'état actuel de la base de données des ingrédients
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditComplet() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('     AUDIT COMPLET DE LA BASE INGRÉDIENTS');
  console.log('═══════════════════════════════════════════════════════\n');

  const rapport = {
    canonical_foods: {},
    archetypes: {},
    cultivars: {},
    recipe_ingredients: {},
    problemes: [],
    statistiques: {}
  };

  // ========================================
  // 1. CANONICAL_FOODS
  // ========================================
  console.log('1️⃣  CANONICAL_FOODS\n');

  const { data: canonicalFoods, error: cfError } = await supabase
    .from('canonical_foods')
    .select('*')
    .order('id');

  if (cfError) {
    console.error('❌ Erreur:', cfError);
    return;
  }

  console.log(`📊 Total: ${canonicalFoods.length} canonical_foods\n`);

  // Identifier les doublons par nom
  const canonicalByNormalizedName = {};
  const doublonsCanonical = [];

  canonicalFoods.forEach(cf => {
    const normalized = cf.canonical_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (canonicalByNormalizedName[normalized]) {
      doublonsCanonical.push({
        nom_normalise: normalized,
        items: [canonicalByNormalizedName[normalized], cf]
      });
    } else {
      canonicalByNormalizedName[normalized] = cf;
    }
  });

  if (doublonsCanonical.length > 0) {
    console.log('⚠️  DOUBLONS DÉTECTÉS:');
    doublonsCanonical.forEach(doublon => {
      console.log(`   "${doublon.nom_normalise}":`);
      doublon.items.forEach(item => {
        console.log(`     - ID ${item.id}: "${item.canonical_name}"`);
      });
    });
    console.log('');
    rapport.problemes.push(...doublonsCanonical.map(d => ({
      type: 'doublon_canonical',
      details: d
    })));
  }

  // Lister tous les canonical_foods
  console.log('📋 Liste complète:');
  canonicalFoods.slice(0, 50).forEach(cf => {
    console.log(`   ${cf.id.toString().padStart(5)}: ${cf.canonical_name} (${cf.primary_unit || 'N/A'})`);
  });
  if (canonicalFoods.length > 50) {
    console.log(`   ... et ${canonicalFoods.length - 50} autres`);
  }
  console.log('');

  rapport.canonical_foods = {
    total: canonicalFoods.length,
    liste: canonicalFoods,
    doublons: doublonsCanonical
  };

  // ========================================
  // 2. CULTIVARS
  // ========================================
  console.log('\n2️⃣  CULTIVARS\n');

  const { data: cultivars, error: cultivarsError } = await supabase
    .from('cultivars')
    .select('*')
    .order('id');

  if (cultivarsError) {
    console.error('❌ Erreur:', cultivarsError);
  } else {
    console.log(`📊 Total: ${cultivars?.length || 0} cultivars\n`);

    if (cultivars && cultivars.length > 0) {
      console.log('📋 Liste:');
      cultivars.forEach(cv => {
        const parent = canonicalFoods.find(cf => cf.id === cv.canonical_food_id);
        console.log(`   ${cv.id}: ${cv.name} (parent: ${parent?.canonical_name || 'ID ' + cv.canonical_food_id})`);
      });
      console.log('');
    } else {
      console.log('ℹ️  Aucun cultivar dans la base\n');
    }

    rapport.cultivars = {
      total: cultivars?.length || 0,
      liste: cultivars || []
    };
  }

  // ========================================
  // 3. ARCHETYPES
  // ========================================
  console.log('\n3️⃣  ARCHETYPES\n');

  const { data: archetypes, error: archError } = await supabase
    .from('archetypes')
    .select('*')
    .order('id');

  if (archError) {
    console.error('❌ Erreur:', archError);
    return;
  }

  console.log(`📊 Total: ${archetypes.length} archetypes\n`);

  // Grouper par canonical_food_id
  const archetypesByCanonical = {};
  archetypes.forEach(arch => {
    if (!archetypesByCanonical[arch.canonical_food_id]) {
      archetypesByCanonical[arch.canonical_food_id] = [];
    }
    archetypesByCanonical[arch.canonical_food_id].push(arch);
  });

  console.log('📋 Archetypes groupés par canonical_food:');
  Object.entries(archetypesByCanonical).forEach(([canonicalId, archs]) => {
    const parent = canonicalFoods.find(cf => cf.id === parseInt(canonicalId));
    console.log(`\n   ${parent?.canonical_name || 'ID ' + canonicalId} (${archs.length} archetypes):`);
    archs.slice(0, 10).forEach(arch => {
      console.log(`     - ${arch.name} (process: ${arch.process || 'N/A'})`);
    });
    if (archs.length > 10) {
      console.log(`     ... et ${archs.length - 10} autres`);
    }
  });
  console.log('');

  rapport.archetypes = {
    total: archetypes.length,
    liste: archetypes,
    par_canonical: archetypesByCanonical
  };

  // ========================================
  // 4. RECIPE_INGREDIENTS (liens critiques)
  // ========================================
  console.log('\n4️⃣  RECIPE_INGREDIENTS (LIENS CRITIQUES)\n');

  const { data: recipeIngredients, error: riError } = await supabase
    .from('recipe_ingredients')
    .select('id, recipe_id, canonical_food_id, archetype_id, quantity, unit');

  if (riError) {
    console.error('❌ Erreur:', riError);
    return;
  }

  console.log(`📊 Total: ${recipeIngredients.length} liens recipe_ingredients\n`);

  // Analyser l'utilisation
  const canonicalUsage = {};
  const archetypeUsage = {};
  const usageStats = {
    via_canonical: 0,
    via_archetype: 0,
    orphelins: 0
  };

  recipeIngredients.forEach(ri => {
    if (ri.canonical_food_id) {
      usageStats.via_canonical++;
      canonicalUsage[ri.canonical_food_id] = (canonicalUsage[ri.canonical_food_id] || 0) + 1;
    }

    if (ri.archetype_id) {
      usageStats.via_archetype++;
      archetypeUsage[ri.archetype_id] = (archetypeUsage[ri.archetype_id] || 0) + 1;
    }

    if (!ri.canonical_food_id && !ri.archetype_id) {
      usageStats.orphelins++;
    }
  });

  console.log('📊 Statistiques d\'utilisation:');
  console.log(`   - Liens via canonical_food: ${usageStats.via_canonical}`);
  console.log(`   - Liens via archetype: ${usageStats.via_archetype}`);
  console.log(`   - Liens orphelins (ni canonical ni archetype): ${usageStats.orphelins}\n`);

  // Canonical_foods utilisés
  const canonicalUtilises = Object.keys(canonicalUsage).map(id => parseInt(id));
  const canonicalNonUtilises = canonicalFoods.filter(cf => !canonicalUtilises.includes(cf.id));

  console.log(`✅ ${canonicalUtilises.length} canonical_foods UTILISÉS dans des recettes`);
  console.log(`⚠️  ${canonicalNonUtilises.length} canonical_foods NON UTILISÉS\n`);

  if (canonicalNonUtilises.length > 0 && canonicalNonUtilises.length <= 30) {
    console.log('📋 Canonical_foods NON utilisés:');
    canonicalNonUtilises.forEach(cf => {
      console.log(`   - ID ${cf.id}: ${cf.canonical_name}`);
    });
    console.log('');
  }

  // Archetypes utilisés
  const archetypesUtilises = Object.keys(archetypeUsage).map(id => parseInt(id));
  const archetypesNonUtilises = archetypes.filter(arch => !archetypesUtilises.includes(arch.id));

  console.log(`✅ ${archetypesUtilises.length} archetypes UTILISÉS dans des recettes`);
  console.log(`⚠️  ${archetypesNonUtilises.length} archetypes NON UTILISÉS\n`);

  // Top 10 des ingrédients les plus utilisés
  const topCanonical = Object.entries(canonicalUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topArchetypes = Object.entries(archetypeUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('🏆 TOP 10 canonical_foods les plus utilisés:');
  topCanonical.forEach(([id, count]) => {
    const cf = canonicalFoods.find(c => c.id === parseInt(id));
    console.log(`   ${count.toString().padStart(4)}× ${cf?.canonical_name || 'ID ' + id}`);
  });
  console.log('');

  console.log('🏆 TOP 10 archetypes les plus utilisés:');
  topArchetypes.forEach(([id, count]) => {
    const arch = archetypes.find(a => a.id === parseInt(id));
    console.log(`   ${count.toString().padStart(4)}× ${arch?.name || 'ID ' + id}`);
  });
  console.log('');

  rapport.recipe_ingredients = {
    total: recipeIngredients.length,
    stats: usageStats,
    canonical_utilises: canonicalUtilises.length,
    canonical_non_utilises: canonicalNonUtilises.length,
    archetypes_utilises: archetypesUtilises.length,
    archetypes_non_utilises: archetypesNonUtilises.length,
    top_canonical: topCanonical,
    top_archetypes: topArchetypes
  };

  // ========================================
  // 5. VÉRIFIER LES LIENS CASSÉS
  // ========================================
  console.log('\n5️⃣  VÉRIFICATION DES LIENS CASSÉS\n');

  const liensCasses = {
    canonical_inexistant: [],
    archetype_inexistant: []
  };

  recipeIngredients.forEach(ri => {
    if (ri.canonical_food_id) {
      const exists = canonicalFoods.find(cf => cf.id === ri.canonical_food_id);
      if (!exists) {
        liensCasses.canonical_inexistant.push(ri);
      }
    }

    if (ri.archetype_id) {
      const exists = archetypes.find(a => a.id === ri.archetype_id);
      if (!exists) {
        liensCasses.archetype_inexistant.push(ri);
      }
    }
  });

  if (liensCasses.canonical_inexistant.length > 0) {
    console.log(`❌ ${liensCasses.canonical_inexistant.length} liens vers des canonical_foods INEXISTANTS!`);
    liensCasses.canonical_inexistant.slice(0, 5).forEach(ri => {
      console.log(`   - Recipe ${ri.recipe_id}: pointe vers canonical_food_id ${ri.canonical_food_id} (n'existe pas)`);
    });
    console.log('');
  }

  if (liensCasses.archetype_inexistant.length > 0) {
    console.log(`❌ ${liensCasses.archetype_inexistant.length} liens vers des archetypes INEXISTANTS!`);
    liensCasses.archetype_inexistant.slice(0, 5).forEach(ri => {
      console.log(`   - Recipe ${ri.recipe_id}: pointe vers archetype_id ${ri.archetype_id} (n'existe pas)`);
    });
    console.log('');
  }

  if (liensCasses.canonical_inexistant.length === 0 && liensCasses.archetype_inexistant.length === 0) {
    console.log('✅ Aucun lien cassé détecté!\n');
  }

  rapport.problemes.push(...liensCasses.canonical_inexistant.map(ri => ({
    type: 'lien_canonical_casse',
    details: ri
  })));

  rapport.problemes.push(...liensCasses.archetype_inexistant.map(ri => ({
    type: 'lien_archetype_casse',
    details: ri
  })));

  // ========================================
  // 6. RÉSUMÉ FINAL
  // ========================================
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                   RÉSUMÉ FINAL');
  console.log('═══════════════════════════════════════════════════════\n');

  rapport.statistiques = {
    canonical_foods: canonicalFoods.length,
    cultivars: cultivars?.length || 0,
    archetypes: archetypes.length,
    recipe_ingredients: recipeIngredients.length,
    doublons: doublonsCanonical.length,
    liens_casses: liensCasses.canonical_inexistant.length + liensCasses.archetype_inexistant.length,
    canonical_non_utilises: canonicalNonUtilises.length,
    archetypes_non_utilises: archetypesNonUtilises.length
  };

  console.log('📊 TOTAUX:');
  console.log(`   - Canonical_foods: ${rapport.statistiques.canonical_foods}`);
  console.log(`   - Cultivars: ${rapport.statistiques.cultivars}`);
  console.log(`   - Archetypes: ${rapport.statistiques.archetypes}`);
  console.log(`   - Recipe_ingredients: ${rapport.statistiques.recipe_ingredients}\n`);

  console.log('⚠️  PROBLÈMES:');
  console.log(`   - Doublons canonical: ${rapport.statistiques.doublons}`);
  console.log(`   - Liens cassés: ${rapport.statistiques.liens_casses}`);
  console.log(`   - Canonical non utilisés: ${rapport.statistiques.canonical_non_utilises}`);
  console.log(`   - Archetypes non utilisés: ${rapport.statistiques.archetypes_non_utilises}\n`);

  console.log('📊 UTILISATION:');
  console.log(`   - Via canonical_food: ${usageStats.via_canonical}`);
  console.log(`   - Via archetype: ${usageStats.via_archetype}`);
  console.log(`   - Orphelins: ${usageStats.orphelins}\n`);

  // Sauvegarder le rapport complet
  fs.writeFileSync('AUDIT_INGREDIENTS_COMPLET.json', JSON.stringify(rapport, null, 2));
  console.log('✅ Rapport complet sauvegardé: AUDIT_INGREDIENTS_COMPLET.json\n');

  // Créer un rapport simplifié en markdown
  let md = '# AUDIT COMPLET DES INGRÉDIENTS\n\n';
  md += `Date: ${new Date().toISOString()}\n\n`;
  md += '## 📊 Statistiques\n\n';
  md += `- **Canonical_foods**: ${rapport.statistiques.canonical_foods}\n`;
  md += `- **Cultivars**: ${rapport.statistiques.cultivars}\n`;
  md += `- **Archetypes**: ${rapport.statistiques.archetypes}\n`;
  md += `- **Recipe_ingredients**: ${rapport.statistiques.recipe_ingredients}\n\n`;

  md += '## ⚠️ Problèmes détectés\n\n';
  md += `- **Doublons**: ${rapport.statistiques.doublons}\n`;
  md += `- **Liens cassés**: ${rapport.statistiques.liens_casses}\n`;
  md += `- **Canonical non utilisés**: ${rapport.statistiques.canonical_non_utilises}\n`;
  md += `- **Archetypes non utilisés**: ${rapport.statistiques.archetypes_non_utilises}\n\n`;

  if (doublonsCanonical.length > 0) {
    md += '### Doublons détectés\n\n';
    doublonsCanonical.forEach(doublon => {
      md += `- **${doublon.nom_normalise}**:\n`;
      doublon.items.forEach(item => {
        md += `  - ID ${item.id}: "${item.canonical_name}"\n`;
      });
    });
    md += '\n';
  }

  fs.writeFileSync('AUDIT_INGREDIENTS_RESUME.md', md);
  console.log('✅ Résumé sauvegardé: AUDIT_INGREDIENTS_RESUME.md\n');

  console.log('═══════════════════════════════════════════════════════\n');
}

auditComplet().catch(console.error);
