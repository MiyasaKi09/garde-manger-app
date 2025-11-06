import fs from 'fs';

console.log('\n═══════════════════════════════════════════════════════');
console.log('   ANALYSE APPROFONDIE DU CSV ARCHETYPES');
console.log('═══════════════════════════════════════════════════════\n');

// Lire et parser le CSV manuellement
const csvContent = fs.readFileSync('/workspaces/garde-manger-app/supabase/exports/latest/csv/archetypes.csv', 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());
const headers = lines[0].split(',');
const archetypes = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = values[i] || '';
  });
  return obj;
});

console.log(`📊 Total archetypes: ${archetypes.length}\n`);

// Problèmes détectés
const problems = {
  archetype_generique: [],
  vins_et_spiritueux_mal_classes: [],
  yaourts_lait_specifique_mal_lies: [],
  fromages_sans_distinction_lait: [],
  pains_pates_trop_generiques: [],
  archetypes_incomplets: [],
  noms_suspects: []
};

archetypes.forEach(a => {
  const name = a.name?.toLowerCase() || '';
  const canonical_id = a.canonical_food_id;
  const cultivar_id = a.cultivar_id;

  // 1. Archetype générique fourre-tout
  if (name.includes('à classer') || name.includes('générique')) {
    problems.archetype_generique.push({
      id: a.id,
      name: a.name,
      canonical_id,
      issue: 'Archetype fourre-tout à supprimer'
    });
  }

  // 2. Vins et spiritueux basés sur "raisin" au lieu d'avoir leur propre canonical
  if ((name.includes('vin ') || name.includes('cognac')) && canonical_id === '1057') {
    problems.vins_et_spiritueux_mal_classes.push({
      id: a.id,
      name: a.name,
      canonical_id: '1057 (raisin)',
      issue: 'Devrait avoir son propre canonical (vin, cognac) ou archetype sous "alcool"'
    });
  }

  // 3. Yaourts spécifiques (chèvre, brebis) non liés aux cultivars
  if ((name.includes('lait de chèvre') || name.includes('lait de brebis') ||
       name.includes('yaourt') && (name.includes('chèvre') || name.includes('brebis'))) &&
      !cultivar_id) {
    problems.yaourts_lait_specifique_mal_lies.push({
      id: a.id,
      name: a.name,
      canonical_id,
      cultivar_id: cultivar_id || 'NULL',
      issue: 'Devrait être lié au cultivar correspondant (lait de chèvre/brebis)'
    });
  }

  // 4. Fromages sans distinction de type de lait (tous sur canonical lait)
  if ((name.includes('fromage') || name.includes('brie') || name.includes('camembert') ||
       name.includes('roquefort') || name.includes('comté') || name.includes('emmental') ||
       name.includes('chèvre') || name.includes('crottin') || name.includes('bûche')) &&
      canonical_id === '7001' && !cultivar_id) {
    problems.fromages_sans_distinction_lait.push({
      id: a.id,
      name: a.name,
      canonical_id: '7001 (lait)',
      issue: 'Fromage sans distinction lait vache/chèvre/brebis'
    });
  }

  // 5. Pains et pâtes peut-être trop génériques
  if ((name === 'pain' || name === 'pâte' || name === 'farine') && canonical_id === '5002') {
    problems.pains_pates_trop_generiques.push({
      id: a.id,
      name: a.name,
      canonical_id: '5002 (blé)',
      issue: 'Archetype très générique, vérifier si OK ou si besoin plus de spécificité'
    });
  }

  // 6. Archetypes avec données incomplètes (pas de shelf_life)
  if (!a.shelf_life_days_pantry && !a.shelf_life_days_fridge && !a.shelf_life_days_freezer) {
    problems.archetypes_incomplets.push({
      id: a.id,
      name: a.name,
      issue: 'Aucune durée de conservation définie'
    });
  }

  // 7. Noms suspects (majuscules bizarres, espaces multiples, etc.)
  if (a.name && (
    a.name.match(/\s{2,}/) || // espaces multiples
    a.name !== a.name.trim() || // espaces début/fin
    (a.name[0] && a.name[0] === a.name[0].toUpperCase() && !a.name.includes('Grand') && !a.name.includes('Marsala'))
  )) {
    problems.noms_suspects.push({
      id: a.id,
      name: a.name,
      issue: 'Nom avec formatage suspect'
    });
  }
});

// Afficher les résultats
console.log('🔍 PROBLÈMES DÉTECTÉS\n');

if (problems.archetype_generique.length > 0) {
  console.log(`\n❌ ARCHETYPE GÉNÉRIQUE FOURRE-TOUT (${problems.archetype_generique.length})`);
  console.log('─'.repeat(60));
  problems.archetype_generique.forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
    console.log(`      → ${p.issue}\n`);
  });
}

if (problems.vins_et_spiritueux_mal_classes.length > 0) {
  console.log(`\n⚠️  VINS/SPIRITUEUX MAL CLASSÉS (${problems.vins_et_spiritueux_mal_classes.length})`);
  console.log('─'.repeat(60));
  problems.vins_et_spiritueux_mal_classes.forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
    console.log(`      Canonical: ${p.canonical_id}`);
    console.log(`      → ${p.issue}\n`);
  });
}

if (problems.yaourts_lait_specifique_mal_lies.length > 0) {
  console.log(`\n⚠️  PRODUITS LAITIERS SPÉCIFIQUES MAL LIÉS (${problems.yaourts_lait_specifique_mal_lies.length})`);
  console.log('─'.repeat(60));
  problems.yaourts_lait_specifique_mal_lies.forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
    console.log(`      Canonical: ${p.canonical_id}, Cultivar: ${p.cultivar_id}`);
    console.log(`      → ${p.issue}\n`);
  });
}

if (problems.fromages_sans_distinction_lait.length > 0) {
  console.log(`\n⚠️  FROMAGES SANS DISTINCTION TYPE LAIT (${problems.fromages_sans_distinction_lait.length})`);
  console.log('─'.repeat(60));
  console.log('  NOTE: Ces fromages sont tous liés au canonical "lait" générique.');
  console.log('  Problème: On ne sait pas s\'ils sont au lait de vache, chèvre, ou brebis.\n');
  problems.fromages_sans_distinction_lait.slice(0, 10).forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
  });
  if (problems.fromages_sans_distinction_lait.length > 10) {
    console.log(`  ... et ${problems.fromages_sans_distinction_lait.length - 10} autres\n`);
  }
}

if (problems.pains_pates_trop_generiques.length > 0) {
  console.log(`\n⚠️  ARCHETYPES TRÈS GÉNÉRIQUES (${problems.pains_pates_trop_generiques.length})`);
  console.log('─'.repeat(60));
  problems.pains_pates_trop_generiques.forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
    console.log(`      → ${p.issue}\n`);
  });
}

if (problems.archetypes_incomplets.length > 0) {
  console.log(`\n⚠️  ARCHETYPES SANS DURÉE DE CONSERVATION (${problems.archetypes_incomplets.length})`);
  console.log('─'.repeat(60));
  problems.archetypes_incomplets.slice(0, 10).forEach(p => {
    console.log(`  [${p.id}] ${p.name}`);
  });
  if (problems.archetypes_incomplets.length > 10) {
    console.log(`  ... et ${problems.archetypes_incomplets.length - 10} autres\n`);
  }
}

if (problems.noms_suspects.length > 0) {
  console.log(`\n⚠️  NOMS AVEC FORMATAGE SUSPECT (${problems.noms_suspects.length})`);
  console.log('─'.repeat(60));
  problems.noms_suspects.slice(0, 5).forEach(p => {
    console.log(`  [${p.id}] "${p.name}"`);
    console.log(`      → ${p.issue}\n`);
  });
  if (problems.noms_suspects.length > 5) {
    console.log(`  ... et ${problems.noms_suspects.length - 5} autres\n`);
  }
}

// Statistiques par canonical
console.log('\n📊 STATISTIQUES PAR CANONICAL (Top 15)\n');
console.log('─'.repeat(60));
const byCanonical = {};
archetypes.forEach(a => {
  const id = a.canonical_food_id || 'NULL';
  byCanonical[id] = (byCanonical[id] || 0) + 1;
});

Object.entries(byCanonical)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([canonical_id, count]) => {
    console.log(`  Canonical ID ${canonical_id}: ${count} archetype(s)`);
  });

console.log('\n═══════════════════════════════════════════════════════');
console.log('RÉSUMÉ:');
console.log(`  - Archetype générique fourre-tout: ${problems.archetype_generique.length}`);
console.log(`  - Vins/spiritueux mal classés: ${problems.vins_et_spiritueux_mal_classes.length}`);
console.log(`  - Produits laitiers spécifiques mal liés: ${problems.yaourts_lait_specifique_mal_lies.length}`);
console.log(`  - Fromages sans distinction lait: ${problems.fromages_sans_distinction_lait.length}`);
console.log(`  - Archetypes très génériques: ${problems.pains_pates_trop_generiques.length}`);
console.log(`  - Archetypes sans durée conservation: ${problems.archetypes_incomplets.length}`);
console.log(`  - Noms avec formatage suspect: ${problems.noms_suspects.length}`);
console.log('═══════════════════════════════════════════════════════\n');

// Sauvegarder le rapport détaillé
const report = {
  date: new Date().toISOString(),
  total_archetypes: archetypes.length,
  problems,
  statistics: {
    by_canonical: byCanonical
  }
};

fs.writeFileSync('AUDIT_CSV_ARCHETYPES.json', JSON.stringify(report, null, 2));
console.log('✅ Rapport détaillé sauvegardé dans AUDIT_CSV_ARCHETYPES.json\n');
