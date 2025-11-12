import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   EXPORT ARCHETYPES AVEC COLONNES À COMPLÉTER');
console.log('═══════════════════════════════════════════════════════\n');

async function exportIncomplete() {
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select(`
      id,
      name,
      canonical_food_id,
      cultivar_id,
      process,
      primary_unit,
      shelf_life_days_pantry,
      shelf_life_days_fridge,
      shelf_life_days_freezer,
      open_shelf_life_days_pantry,
      open_shelf_life_days_fridge,
      parent_archetype_id,
      canonical_foods(canonical_name),
      cultivars(cultivar_name, canonical_foods(canonical_name))
    `)
    .order('id');

  console.log(`📊 Total archetypes: ${archetypes.length}\n`);

  // =====================================================
  // 1. PROCESS GÉNÉRIQUES À AMÉLIORER
  // =====================================================
  console.log('⚙️  PROCESS GÉNÉRIQUES (100 archetypes)\n');

  const genericProcess = archetypes.filter(a =>
    a.process === 'transformation de base' || a.process === 'base'
  );

  const processByCategory = {
    viandes: [],
    poissons: [],
    produits_laitiers: [],
    fromages: [],
    legumes: [],
    fruits: [],
    cereales: [],
    alcools: [],
    autres: []
  };

  genericProcess.forEach(a => {
    const canonical = a.canonical_foods?.canonical_name || '';
    const cultivar = a.cultivars?.cultivar_name || '';
    const origin = canonical || cultivar;

    // Catégoriser
    if (['bœuf', 'veau', 'porc', 'agneau', 'poulet', 'canard', 'dinde'].includes(origin)) {
      processByCategory.viandes.push(a);
    } else if (['cabillaud', 'sole', 'lotte', 'saumon', 'thon', 'morue', 'bar', 'dorade'].includes(origin)) {
      processByCategory.poissons.push(a);
    } else if (origin === 'lait' && !a.name.toLowerCase().includes('fromage')) {
      processByCategory.produits_laitiers.push(a);
    } else if (origin === 'lait' || ['chèvre', 'brebis'].includes(cultivar) || a.name.toLowerCase().includes('fromage')) {
      processByCategory.fromages.push(a);
    } else if (['oignon', 'carotte', 'pomme de terre', 'poireau', 'courgette', 'tomate', 'aubergine', 'poivron', 'champignon', 'blette', 'légume'].includes(origin)) {
      processByCategory.legumes.push(a);
    } else if (['pomme', 'poire', 'fraise', 'framboise', 'orange', 'citron'].includes(origin)) {
      processByCategory.fruits.push(a);
    } else if (['blé', 'riz', 'avoine', 'sarrasin'].includes(origin)) {
      processByCategory.cereales.push(a);
    } else if (origin === 'alcool' || ['bière', 'cidre', 'vin'].includes(origin)) {
      processByCategory.alcools.push(a);
    } else {
      processByCategory.autres.push(a);
    }
  });

  Object.entries(processByCategory).forEach(([cat, items]) => {
    if (items.length > 0) {
      console.log(`\n${cat.toUpperCase()} (${items.length}):`);
      items.forEach(a => {
        const origin = a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name || '???';
        console.log(`  [${a.id}] ${a.name} (${origin})`);
      });
    }
  });

  // =====================================================
  // 2. OPEN_SHELF_LIFE MANQUANTS
  // =====================================================
  console.log('\n\n📅 OPEN_SHELF_LIFE MANQUANTS\n');

  const missingOpenFridge = archetypes.filter(a =>
    !a.open_shelf_life_days_fridge && a.shelf_life_days_fridge
  );

  const missingOpenPantry = archetypes.filter(a =>
    !a.open_shelf_life_days_pantry && a.shelf_life_days_pantry
  );

  console.log(`Produits avec shelf_life_fridge mais sans open_shelf_life_fridge: ${missingOpenFridge.length}`);
  console.log(`Produits avec shelf_life_pantry mais sans open_shelf_life_pantry: ${missingOpenPantry.length}`);

  // Catégoriser les open_fridge manquants
  const openFridgeByType = {
    viandes: [],
    poissons: [],
    produits_laitiers: [],
    fromages: [],
    legumes: [],
    autres: []
  };

  missingOpenFridge.forEach(a => {
    const canonical = a.canonical_foods?.canonical_name || '';
    const cultivar = a.cultivars?.cultivar_name || '';
    const origin = canonical || cultivar;

    if (['bœuf', 'veau', 'porc', 'agneau', 'poulet', 'canard', 'dinde'].includes(origin)) {
      openFridgeByType.viandes.push(a);
    } else if (['cabillaud', 'sole', 'lotte', 'saumon', 'thon', 'morue', 'bar', 'dorade'].includes(origin)) {
      openFridgeByType.poissons.push(a);
    } else if (origin === 'lait' && !a.name.toLowerCase().includes('fromage')) {
      openFridgeByType.produits_laitiers.push(a);
    } else if (origin === 'lait' || ['chèvre', 'brebis'].includes(cultivar) || a.name.toLowerCase().includes('fromage')) {
      openFridgeByType.fromages.push(a);
    } else if (['oignon', 'carotte', 'pomme de terre', 'poireau', 'courgette', 'tomate', 'aubergine', 'poivron', 'champignon', 'blette', 'légume'].includes(origin)) {
      openFridgeByType.legumes.push(a);
    } else {
      openFridgeByType.autres.push(a);
    }
  });

  console.log('\nPar catégorie (open_fridge):');
  Object.entries(openFridgeByType).forEach(([cat, items]) => {
    if (items.length > 0) {
      console.log(`  ${cat}: ${items.length}`);
    }
  });

  // Catégoriser les open_pantry manquants
  const openPantryByType = {
    conserves: [],
    secs: [],
    alcools: [],
    condiments: [],
    autres: []
  };

  missingOpenPantry.forEach(a => {
    const canonical = a.canonical_foods?.canonical_name || '';
    const name = a.name.toLowerCase();

    if (name.includes('conserve') || name.includes('boîte') || name.includes('bocal')) {
      openPantryByType.conserves.push(a);
    } else if (['blé', 'riz', 'avoine', 'sarrasin', 'pâtes'].some(c => canonical.includes(c)) || name.includes('farine') || name.includes('semoule')) {
      openPantryByType.secs.push(a);
    } else if (canonical === 'alcool' || ['bière', 'cidre'].includes(canonical)) {
      openPantryByType.alcools.push(a);
    } else if (name.includes('sauce') || name.includes('vinaigre') || name.includes('huile') || name.includes('épice')) {
      openPantryByType.condiments.push(a);
    } else {
      openPantryByType.autres.push(a);
    }
  });

  console.log('\nPar catégorie (open_pantry):');
  Object.entries(openPantryByType).forEach(([cat, items]) => {
    if (items.length > 0) {
      console.log(`  ${cat}: ${items.length}`);
    }
  });

  // =====================================================
  // SAUVEGARDER LE RAPPORT DÉTAILLÉ
  // =====================================================

  const report = {
    total: archetypes.length,
    process_generiques: {
      total: genericProcess.length,
      by_category: {}
    },
    open_shelf_life: {
      missing_fridge: {
        total: missingOpenFridge.length,
        by_type: {}
      },
      missing_pantry: {
        total: missingOpenPantry.length,
        by_type: {}
      }
    }
  };

  // Ajouter les détails pour process
  Object.entries(processByCategory).forEach(([cat, items]) => {
    if (items.length > 0) {
      report.process_generiques.by_category[cat] = items.map(a => ({
        id: a.id,
        name: a.name,
        origin: a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name,
        current_process: a.process
      }));
    }
  });

  // Ajouter les détails pour open_fridge
  Object.entries(openFridgeByType).forEach(([cat, items]) => {
    if (items.length > 0) {
      report.open_shelf_life.missing_fridge.by_type[cat] = items.map(a => ({
        id: a.id,
        name: a.name,
        origin: a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name,
        shelf_life_fridge: a.shelf_life_days_fridge
      }));
    }
  });

  // Ajouter les détails pour open_pantry
  Object.entries(openPantryByType).forEach(([cat, items]) => {
    if (items.length > 0) {
      report.open_shelf_life.missing_pantry.by_type[cat] = items.map(a => ({
        id: a.id,
        name: a.name,
        origin: a.canonical_foods?.canonical_name || a.cultivars?.cultivar_name,
        shelf_life_pantry: a.shelf_life_days_pantry
      }));
    }
  });

  fs.writeFileSync('ARCHETYPES_A_COMPLETER.json', JSON.stringify(report, null, 2));

  console.log('\n\n✅ Rapport détaillé sauvegardé: ARCHETYPES_A_COMPLETER.json\n');

  return report;
}

exportIncomplete().catch(console.error);
