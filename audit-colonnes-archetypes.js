import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   AUDIT COMPLET DES COLONNES ARCHETYPES');
console.log('═══════════════════════════════════════════════════════\n');

async function auditArchetypes() {
  // Récupérer tous les archetypes avec leurs relations
  const { data: archetypes, error } = await supabase
    .from('archetypes')
    .select(`
      *,
      canonical_foods(canonical_name),
      cultivars(cultivar_name, canonical_foods(canonical_name))
    `);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log(`📊 Total archetypes: ${archetypes.length}\n`);

  const report = {
    total: archetypes.length,
    columns: {}
  };

  // =====================================================
  // Analyse de chaque colonne
  // =====================================================

  // 1. NAME
  console.log('📝 COLONNE: name');
  const nameIssues = {
    null: archetypes.filter(a => !a.name),
    empty: archetypes.filter(a => a.name === ''),
    tooShort: archetypes.filter(a => a.name && a.name.length < 3),
    duplicates: []
  };

  // Détecter les doublons
  const nameCount = {};
  archetypes.forEach(a => {
    if (a.name) {
      nameCount[a.name] = (nameCount[a.name] || 0) + 1;
    }
  });
  Object.entries(nameCount).forEach(([name, count]) => {
    if (count > 1) {
      nameIssues.duplicates.push({ name, count, items: archetypes.filter(a => a.name === name) });
    }
  });

  console.log(`  ⚠️  NULL: ${nameIssues.null.length}`);
  console.log(`  ⚠️  Vide: ${nameIssues.empty.length}`);
  console.log(`  ⚠️  Trop court (<3 chars): ${nameIssues.tooShort.length}`);
  console.log(`  ⚠️  Doublons: ${nameIssues.duplicates.length} noms en double`);
  if (nameIssues.duplicates.length > 0) {
    console.log(`      Top 5:`);
    nameIssues.duplicates.slice(0, 5).forEach(d => {
      console.log(`      - "${d.name}" (${d.count}x) : IDs ${d.items.map(i => i.id).join(', ')}`);
    });
  }
  report.columns.name = nameIssues;

  // 2. CANONICAL_FOOD_ID vs CULTIVAR_ID
  console.log('\n🔗 COLONNE: canonical_food_id / cultivar_id');
  const originIssues = {
    both: archetypes.filter(a => a.canonical_food_id && a.cultivar_id),
    neither: archetypes.filter(a => !a.canonical_food_id && !a.cultivar_id),
    onlyCanonical: archetypes.filter(a => a.canonical_food_id && !a.cultivar_id).length,
    onlyCultivar: archetypes.filter(a => !a.canonical_food_id && a.cultivar_id).length
  };
  console.log(`  ✅ Canonical uniquement: ${originIssues.onlyCanonical}`);
  console.log(`  ✅ Cultivar uniquement: ${originIssues.onlyCultivar}`);
  console.log(`  ⚠️  LES DEUX (invalide): ${originIssues.both.length}`);
  console.log(`  ⚠️  AUCUN (invalide): ${originIssues.neither.length}`);
  if (originIssues.both.length > 0) {
    originIssues.both.slice(0, 3).forEach(a => {
      console.log(`      [${a.id}] ${a.name} - canonical: ${a.canonical_foods?.canonical_name}, cultivar: ${a.cultivars?.cultivar_name}`);
    });
  }
  report.columns.origin = originIssues;

  // 3. PROCESS
  console.log('\n⚙️  COLONNE: process');
  const processIssues = {
    null: archetypes.filter(a => !a.process),
    empty: archetypes.filter(a => a.process === ''),
    generic: archetypes.filter(a => a.process && (a.process === 'transformation de base' || a.process === 'base')),
    tooShort: archetypes.filter(a => a.process && a.process.length < 3)
  };
  console.log(`  ⚠️  NULL: ${processIssues.null.length}`);
  console.log(`  ⚠️  Vide: ${processIssues.empty.length}`);
  console.log(`  ⚠️  Générique ("transformation de base"): ${processIssues.generic.length}`);
  console.log(`  ⚠️  Trop court: ${processIssues.tooShort.length}`);
  report.columns.process = processIssues;

  // 4. PRIMARY_UNIT
  console.log('\n📏 COLONNE: primary_unit');
  const unitIssues = {
    null: archetypes.filter(a => !a.primary_unit),
    empty: archetypes.filter(a => a.primary_unit === ''),
    byUnit: {}
  };
  archetypes.forEach(a => {
    if (a.primary_unit) {
      unitIssues.byUnit[a.primary_unit] = (unitIssues.byUnit[a.primary_unit] || 0) + 1;
    }
  });
  console.log(`  ⚠️  NULL: ${unitIssues.null.length}`);
  console.log(`  ⚠️  Vide: ${unitIssues.empty.length}`);
  console.log(`  📊 Distribution des unités:`);
  Object.entries(unitIssues.byUnit)
    .sort((a, b) => b[1] - a[1])
    .forEach(([unit, count]) => {
      console.log(`      ${unit}: ${count}`);
    });
  report.columns.primary_unit = unitIssues;

  // 5. SHELF_LIFE
  console.log('\n📅 COLONNES: shelf_life_*');
  const shelfLifeIssues = {
    noPantry: archetypes.filter(a => !a.shelf_life_days_pantry),
    noFridge: archetypes.filter(a => !a.shelf_life_days_fridge),
    noFreezer: archetypes.filter(a => !a.shelf_life_days_freezer),
    noStorage: archetypes.filter(a => !a.shelf_life_days_pantry && !a.shelf_life_days_fridge && !a.shelf_life_days_freezer),
    noOpenFridge: archetypes.filter(a => !a.open_shelf_life_days_fridge),
    noOpenPantry: archetypes.filter(a => !a.open_shelf_life_days_pantry)
  };
  console.log(`  ⚠️  Aucun storage (pantry/fridge/freezer): ${shelfLifeIssues.noStorage.length}`);
  console.log(`  ℹ️  Pas de pantry: ${shelfLifeIssues.noPantry.length}`);
  console.log(`  ℹ️  Pas de fridge: ${shelfLifeIssues.noFridge.length}`);
  console.log(`  ℹ️  Pas de freezer: ${shelfLifeIssues.noFreezer.length}`);
  console.log(`  ℹ️  Pas de open_fridge: ${shelfLifeIssues.noOpenFridge.length}`);
  console.log(`  ℹ️  Pas de open_pantry: ${shelfLifeIssues.noOpenPantry.length}`);

  if (shelfLifeIssues.noStorage.length > 0) {
    console.log(`\n  Top 10 sans shelf_life:`);
    shelfLifeIssues.noStorage.slice(0, 10).forEach(a => {
      const origin = a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name || '???';
      console.log(`      [${a.id}] ${a.name} (${origin})`);
    });
  }
  report.columns.shelf_life = shelfLifeIssues;

  // 6. PARENT_ARCHETYPE_ID
  console.log('\n🌳 COLONNE: parent_archetype_id');
  const parentIssues = {
    withParent: archetypes.filter(a => a.parent_archetype_id),
    orphan: archetypes.filter(a => !a.parent_archetype_id),
    invalidParent: []
  };

  // Vérifier si les parents existent
  const allIds = new Set(archetypes.map(a => a.id));
  parentIssues.withParent.forEach(a => {
    if (!allIds.has(a.parent_archetype_id)) {
      parentIssues.invalidParent.push(a);
    }
  });

  console.log(`  ✅ Avec parent: ${parentIssues.withParent.length}`);
  console.log(`  ℹ️  Sans parent (racine): ${parentIssues.orphan.length}`);
  console.log(`  ⚠️  Parent invalide (ID inexistant): ${parentIssues.invalidParent.length}`);

  if (parentIssues.invalidParent.length > 0) {
    console.log(`      Liste:`);
    parentIssues.invalidParent.forEach(a => {
      console.log(`      [${a.id}] ${a.name} -> parent_id: ${a.parent_archetype_id} (inexistant)`);
    });
  }
  report.columns.parent_archetype_id = parentIssues;

  // 7. TAGS
  console.log('\n🏷️  COLONNE: tags');
  const tagsIssues = {
    null: archetypes.filter(a => !a.tags),
    empty: archetypes.filter(a => a.tags && a.tags.length === 0),
    withTags: archetypes.filter(a => a.tags && a.tags.length > 0),
    allTags: new Set()
  };

  archetypes.forEach(a => {
    if (a.tags && Array.isArray(a.tags)) {
      a.tags.forEach(tag => tagsIssues.allTags.add(tag));
    }
  });

  console.log(`  ℹ️  NULL: ${tagsIssues.null.length}`);
  console.log(`  ℹ️  Array vide: ${tagsIssues.empty.length}`);
  console.log(`  ✅ Avec tags: ${tagsIssues.withTags.length}`);
  console.log(`  📊 Tags uniques: ${tagsIssues.allTags.size}`);

  if (tagsIssues.allTags.size > 0) {
    console.log(`      Tags existants: ${Array.from(tagsIssues.allTags).slice(0, 20).join(', ')}${tagsIssues.allTags.size > 20 ? '...' : ''}`);
  }
  report.columns.tags = {
    ...tagsIssues,
    allTags: Array.from(tagsIssues.allTags)
  };

  // 8. DESCRIPTION
  console.log('\n📖 COLONNE: description');
  const descIssues = {
    null: archetypes.filter(a => !a.description),
    empty: archetypes.filter(a => a.description === ''),
    withDescription: archetypes.filter(a => a.description && a.description.length > 0),
    tooShort: archetypes.filter(a => a.description && a.description.length < 10)
  };
  console.log(`  ℹ️  NULL: ${descIssues.null.length}`);
  console.log(`  ℹ️  Vide: ${descIssues.empty.length}`);
  console.log(`  ✅ Avec description: ${descIssues.withDescription.length}`);
  console.log(`  ⚠️  Trop courte (<10 chars): ${descIssues.tooShort.length}`);
  report.columns.description = descIssues;

  // =====================================================
  // Résumé des problèmes critiques
  // =====================================================
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('   RÉSUMÉ DES PROBLÈMES CRITIQUES');
  console.log('═══════════════════════════════════════════════════════\n');

  const criticalIssues = [];

  if (nameIssues.null.length > 0 || nameIssues.empty.length > 0) {
    criticalIssues.push(`🔴 ${nameIssues.null.length + nameIssues.empty.length} archetypes SANS NOM`);
  }

  if (nameIssues.duplicates.length > 0) {
    criticalIssues.push(`🟡 ${nameIssues.duplicates.length} NOMS EN DOUBLE`);
  }

  if (originIssues.both.length > 0) {
    criticalIssues.push(`🔴 ${originIssues.both.length} archetypes avec CANONICAL ET CULTIVAR (invalide)`);
  }

  if (originIssues.neither.length > 0) {
    criticalIssues.push(`🔴 ${originIssues.neither.length} archetypes SANS origine (ni canonical ni cultivar)`);
  }

  if (unitIssues.null.length + unitIssues.empty.length > 0) {
    criticalIssues.push(`🟡 ${unitIssues.null.length + unitIssues.empty.length} archetypes SANS primary_unit`);
  }

  if (processIssues.null.length + processIssues.empty.length > 0) {
    criticalIssues.push(`🟡 ${processIssues.null.length + processIssues.empty.length} archetypes SANS process`);
  }

  if (shelfLifeIssues.noStorage.length > 0) {
    criticalIssues.push(`🟡 ${shelfLifeIssues.noStorage.length} archetypes SANS durée de conservation`);
  }

  if (parentIssues.invalidParent.length > 0) {
    criticalIssues.push(`🔴 ${parentIssues.invalidParent.length} archetypes avec PARENT INVALIDE`);
  }

  if (criticalIssues.length === 0) {
    console.log('✅ AUCUN PROBLÈME CRITIQUE DÉTECTÉ\n');
  } else {
    console.log('⚠️  PROBLÈMES DÉTECTÉS:\n');
    criticalIssues.forEach(issue => console.log(`  ${issue}`));
    console.log('');
  }

  // Sauvegarder le rapport
  fs.writeFileSync('AUDIT_COLONNES_ARCHETYPES.json', JSON.stringify({
    ...report,
    criticalIssues,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('✅ Rapport détaillé sauvegardé: AUDIT_COLONNES_ARCHETYPES.json\n');
}

auditArchetypes().catch(console.error);
