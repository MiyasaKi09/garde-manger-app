import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   ANALYSE DES DONNÉES MANQUANTES');
console.log('═══════════════════════════════════════════════════════\n');

async function analyzeIncompleteData() {
  // Récupérer tous les archetypes
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('*')
    .order('name');

  // Analyser les données manquantes
  const incomplete = {
    no_shelf_life: [],
    no_process: [],
    no_primary_unit: [],
    all_missing: []
  };

  archetypes.forEach(a => {
    const hasShelfLife = a.shelf_life_days_pantry || a.shelf_life_days_fridge || a.shelf_life_days_freezer;
    const hasProcess = a.process && a.process.trim().length > 0;
    const hasUnit = a.primary_unit && a.primary_unit.trim().length > 0;

    if (!hasShelfLife) {
      incomplete.no_shelf_life.push(a);
    }
    if (!hasProcess) {
      incomplete.no_process.push(a);
    }
    if (!hasUnit) {
      incomplete.no_primary_unit.push(a);
    }
    if (!hasShelfLife && !hasProcess && !hasUnit) {
      incomplete.all_missing.push(a);
    }
  });

  console.log('📊 STATISTIQUES:\n');
  console.log(`  Total archetypes: ${archetypes.length}`);
  console.log(`  Sans durée de conservation: ${incomplete.no_shelf_life.length}`);
  console.log(`  Sans process: ${incomplete.no_process.length}`);
  console.log(`  Sans primary_unit: ${incomplete.no_primary_unit.length}`);
  console.log(`  Toutes données manquantes: ${incomplete.all_missing.length}\n`);

  // Afficher les archetypes avec toutes les données manquantes
  if (incomplete.all_missing.length > 0) {
    console.log('❌ ARCHETYPES SANS AUCUNE DONNÉE (à compléter en priorité):\n');
    incomplete.all_missing.forEach(a => {
      console.log(`  [${a.id}] ${a.name}`);
    });
    console.log();
  }

  // Sauvegarder le rapport
  fs.writeFileSync('INCOMPLETE_DATA_REPORT.json', JSON.stringify({
    date: new Date().toISOString(),
    statistics: {
      total: archetypes.length,
      no_shelf_life: incomplete.no_shelf_life.length,
      no_process: incomplete.no_process.length,
      no_primary_unit: incomplete.no_primary_unit.length,
      all_missing: incomplete.all_missing.length
    },
    archetypes: {
      no_shelf_life: incomplete.no_shelf_life.map(a => ({ id: a.id, name: a.name })),
      no_process: incomplete.no_process.map(a => ({ id: a.id, name: a.name })),
      no_primary_unit: incomplete.no_primary_unit.map(a => ({ id: a.id, name: a.name })),
      all_missing: incomplete.all_missing.map(a => ({ id: a.id, name: a.name }))
    }
  }, null, 2));

  console.log('✅ Rapport sauvegardé dans INCOMPLETE_DATA_REPORT.json\n');
}

analyzeIncompleteData().catch(console.error);
