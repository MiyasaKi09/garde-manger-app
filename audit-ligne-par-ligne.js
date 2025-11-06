const fs = require('fs');

// Charger l'export
const data = JSON.parse(fs.readFileSync('DB_FULL_EXPORT.json', 'utf8'));

console.log('═══════════════════════════════════════════════════════');
console.log('   AUDIT LIGNE PAR LIGNE');
console.log('═══════════════════════════════════════════════════════\n');

const problems = [];
const corrections = [];

// ===== 1. ANALYSER LES CANONICAL FOODS =====
console.log('1️⃣ Analyse des CANONICAL FOODS...\n');

const canonicalsByName = {};
data.canonical_foods.forEach(c => {
  canonicalsByName[c.id] = c.canonical_name;

  // Problème: canonical trop spécifique qui devrait être cultivar
  const tooSpecific = [
    'Grand Marnier', 'Marsala', 'amaretto', 'calvados', 'kirsch', 'porto', 'rhum'
  ];

  if (tooSpecific.includes(c.canonical_name)) {
    problems.push({
      type: 'CANONICAL_TOO_SPECIFIC',
      severity: 'WARNING',
      item: `canonical[${c.id}]: ${c.canonical_name}`,
      reason: 'Nom de marque/produit spécifique devrait être en archetype ou product',
      suggestion: 'Créer canonical "alcool" ou "spiritueux" et mettre ça en archetype'
    });
  }
});

console.log(`   Analysé: ${data.canonical_foods.length} canonical foods`);
console.log(`   Problèmes détectés: ${problems.length}\n`);

// ===== 2. ANALYSER LES CULTIVARS =====
console.log('2️⃣ Analyse des CULTIVARS...\n');

data.cultivars.forEach(cv => {
  // Vérifier que le cultivar a bien un canonical_food_id
  if (!cv.canonical_food_id) {
    problems.push({
      type: 'CULTIVAR_NO_CANONICAL',
      severity: 'ERROR',
      item: `cultivar[${cv.id}]: ${cv.cultivar_name}`,
      reason: 'Cultivar sans canonical_food_id',
      correction: 'Lier à un canonical food'
    });
  }
});

console.log(`   Analysé: ${data.cultivars.length} cultivars`);
console.log(`   Total problèmes: ${problems.length}\n`);

// ===== 3. ANALYSER LES ARCHETYPES =====
console.log('3️⃣ Analyse des ARCHETYPES...\n');

const archetypesByCanonical = {};
const archetypesByCultivar = {};
const orphanArchetypes = [];

data.archetypes.forEach(a => {
  // Vérifier qu'il a soit canonical soit cultivar
  if (!a.canonical_food_id && !a.cultivar_id) {
    orphanArchetypes.push(a);
    problems.push({
      type: 'ARCHETYPE_ORPHAN',
      severity: 'ERROR',
      item: `archetype[${a.id}]: ${a.name}`,
      reason: 'Ni canonical_food_id ni cultivar_id',
      correction: 'Lier à un canonical ou cultivar'
    });
  }

  // Grouper par base
  if (a.canonical_food_id) {
    const baseName = a.canonical_foods?.canonical_name || 'NULL';
    if (!archetypesByCanonical[baseName]) archetypesByCanonical[baseName] = [];
    archetypesByCanonical[baseName].push(a);
  }

  if (a.cultivar_id) {
    const cvName = a.cultivars?.cultivar_name || 'NULL';
    if (!archetypesByCultivar[cvName]) archetypesByCultivar[cvName] = [];
    archetypesByCultivar[cvName].push(a);
  }

  // Détecter les archetypes parents génériques problématiques
  const genericNames = ['poisson', 'viande', 'légume', 'fruit', 'céréale'];
  if (genericNames.includes(a.name.toLowerCase()) && a.parent_archetype_id === null) {
    problems.push({
      type: 'ARCHETYPE_TOO_GENERIC',
      severity: 'ERROR',
      item: `archetype[${a.id}]: ${a.name}`,
      reason: 'Archetype parent trop générique (devrait être canonical)',
      correction: `Supprimer cet archetype, "${a.name}" devrait être un canonical`
    });
  }

  // Détecter les incohérences de nommage
  if (a.canonical_food_id) {
    const baseName = a.canonical_foods?.canonical_name;
    const archetypeName = a.name.toLowerCase();

    // Ex: "filet de poisson" basé sur cabillaud = mauvais
    if (archetypeName.includes('poisson') && baseName === 'cabillaud') {
      problems.push({
        type: 'ARCHETYPE_NAMING_MISMATCH',
        severity: 'WARNING',
        item: `archetype[${a.id}]: ${a.name}`,
        reason: `Nom contient "poisson" mais basé sur "${baseName}"`,
        correction: `Renommer en "filet de ${baseName}" ou lier à canonical "poisson"`
      });
    }
  }
});

console.log(`   Analysé: ${data.archetypes.length} archetypes`);
console.log(`   Orphelins: ${orphanArchetypes.length}`);
console.log(`   Total problèmes: ${problems.length}\n`);

// ===== 4. RAPPORT DES PROBLÈMES =====
console.log('═══════════════════════════════════════════════════════');
console.log('   RAPPORT DES PROBLÈMES');
console.log('═══════════════════════════════════════════════════════\n');

const byType = {};
problems.forEach(p => {
  if (!byType[p.type]) byType[p.type] = [];
  byType[p.type].push(p);
});

Object.entries(byType).forEach(([type, probs]) => {
  console.log(`\n${type} (${probs.length}):`);
  console.log('─'.repeat(60));
  probs.slice(0, 10).forEach(p => {
    console.log(`\n[${p.severity}] ${p.item}`);
    console.log(`  Raison: ${p.reason}`);
    if (p.suggestion) console.log(`  Suggestion: ${p.suggestion}`);
    if (p.correction) console.log(`  Correction: ${p.correction}`);
  });
  if (probs.length > 10) {
    console.log(`\n... et ${probs.length - 10} autres problèmes du même type`);
  }
});

// ===== 5. STATISTIQUES =====
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('   STATISTIQUES');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`📊 ARCHETYPES PAR CANONICAL (top 20):\n`);
Object.entries(archetypesByCanonical)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .forEach(([canonical, archs]) => {
    console.log(`  ${canonical}: ${archs.length} archetype(s)`);
  });

console.log(`\n📊 CULTIVARS AVEC ARCHETYPES:\n`);
Object.entries(archetypesByCultivar).forEach(([cultivar, archs]) => {
  console.log(`  ${cultivar}: ${archs.length} archetype(s)`);
});

// ===== 6. SAUVEGARDER RAPPORT DÉTAILLÉ =====
const report = {
  audit_date: new Date().toISOString(),
  summary: {
    canonical_foods: data.canonical_foods.length,
    cultivars: data.cultivars.length,
    archetypes: data.archetypes.length,
    problems_found: problems.length,
    problems_by_severity: {
      ERROR: problems.filter(p => p.severity === 'ERROR').length,
      WARNING: problems.filter(p => p.severity === 'WARNING').length
    }
  },
  problems: problems,
  statistics: {
    archetypes_by_canonical: Object.entries(archetypesByCanonical)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 50)
      .map(([name, archs]) => ({ canonical: name, count: archs.length })),
    archetypes_by_cultivar: Object.entries(archetypesByCultivar)
      .map(([name, archs]) => ({ cultivar: name, count: archs.length })),
    orphan_archetypes: orphanArchetypes
  }
};

fs.writeFileSync('AUDIT_REPORT.json', JSON.stringify(report, null, 2));
console.log('\n✅ Rapport détaillé sauvegardé dans AUDIT_REPORT.json');

console.log('\n═══════════════════════════════════════════════════════');
console.log(`   RÉSUMÉ: ${problems.length} PROBLÈMES DÉTECTÉS`);
console.log(`   - ${problems.filter(p => p.severity === 'ERROR').length} ERREURS`);
console.log(`   - ${problems.filter(p => p.severity === 'WARNING').length} WARNINGS`);
console.log('═══════════════════════════════════════════════════════\n');
