import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('   VÉRIFICATION DES MIGRATIONS');
console.log('═══════════════════════════════════════════════════════\n');

async function verifyMigrations() {
  // Migration 014: Vérifier que les archetypes poisson génériques sont supprimés
  console.log('📋 MIGRATION 014: Suppression archetypes poisson génériques\n');
  
  const { data: poissonGeneriques } = await supabase
    .from('archetypes')
    .select('*')
    .in('name', ['fumet de poisson', 'fumet poisson', 'arêtes poisson', 'sauce poisson']);
  
  if (poissonGeneriques.length === 0) {
    console.log('  ✅ Migration 014 réussie: 0 archetypes génériques trouvés\n');
  } else {
    console.log(`  ❌ Migration 014 échouée: ${poissonGeneriques.length} archetypes génériques encore présents:\n`);
    poissonGeneriques.forEach(a => console.log(`     - [${a.id}] ${a.name}`));
    console.log();
  }

  // Migration 015: Vérifier que le canonical "alcool" existe et contient les archetypes
  console.log('📋 MIGRATION 015: Restructuration alcools\n');
  
  const { data: alcoolCanonical } = await supabase
    .from('canonical_foods')
    .select('id')
    .eq('canonical_name', 'alcool')
    .single();
  
  if (alcoolCanonical) {
    console.log(`  ✅ Canonical "alcool" créé (id: ${alcoolCanonical.id})`);
    
    const { data: alcoolArchetypes } = await supabase
      .from('archetypes')
      .select('name')
      .eq('canonical_food_id', alcoolCanonical.id)
      .order('name');
    
    console.log(`  ✅ ${alcoolArchetypes.length} archetype(s) sous "alcool":`);
    alcoolArchetypes.forEach(a => console.log(`     - ${a.name}`));
    console.log();
  } else {
    console.log('  ❌ Canonical "alcool" non trouvé\n');
  }

  // Migration 016: Vérifier que l'archetype générique est supprimé
  console.log('📋 MIGRATION 016: Suppression archetype générique\n');
  
  const { data: archetypeGenerique } = await supabase
    .from('archetypes')
    .select('*')
    .or('name.ilike.%classer%,name.ilike.%générique%');
  
  if (archetypeGenerique.length === 0) {
    console.log('  ✅ Migration 016 réussie: Aucun archetype générique trouvé\n');
  } else {
    console.log(`  ❌ Migration 016 échouée: ${archetypeGenerique.length} archetype(s) générique(s):\n`);
    archetypeGenerique.forEach(a => console.log(`     - [${a.id}] ${a.name}`));
    console.log();
  }

  // Migration 017: Vérifier que vins/spiritueux sont sous "alcool"
  console.log('📋 MIGRATION 017: Restructuration vins/spiritueux\n');
  
  if (alcoolCanonical) {
    const { data: vins } = await supabase
      .from('archetypes')
      .select('name, process')
      .eq('canonical_food_id', alcoolCanonical.id)
      .in('name', ['vin blanc', 'vin rouge', 'cognac']);
    
    if (vins.length === 3) {
      console.log('  ✅ Migration 017 réussie: 3 vins/spiritueux migrés vers "alcool":');
      vins.forEach(v => console.log(`     - ${v.name} (process: ${v.process})`));
      console.log();
    } else {
      console.log(`  ⚠️  Migration 017 partielle: ${vins.length}/3 vins migrés\n`);
    }
  }

  // Migration 018: Vérifier fromages chèvre/brebis sur cultivars
  console.log('📋 MIGRATION 018: Fromages chèvre/brebis\n');
  
  const { data: chevreCultivar } = await supabase
    .from('cultivars')
    .select('id')
    .eq('cultivar_name', 'lait de chèvre')
    .single();
  
  const { data: brebisCultivar } = await supabase
    .from('cultivars')
    .select('id')
    .eq('cultivar_name', 'lait de brebis')
    .single();
  
  if (chevreCultivar) {
    const { data: chevreArchetypes } = await supabase
      .from('archetypes')
      .select('name')
      .eq('cultivar_id', chevreCultivar.id)
      .order('name');
    
    console.log(`  ✅ Cultivar "lait de chèvre": ${chevreArchetypes.length} archetype(s)`);
    chevreArchetypes.forEach(a => console.log(`     - ${a.name}`));
    console.log();
  }
  
  if (brebisCultivar) {
    const { data: brebisArchetypes } = await supabase
      .from('archetypes')
      .select('name')
      .eq('cultivar_id', brebisCultivar.id)
      .order('name');
    
    console.log(`  ✅ Cultivar "lait de brebis": ${brebisArchetypes.length} archetype(s)`);
    brebisArchetypes.forEach(a => console.log(`     - ${a.name}`));
    console.log();
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('VÉRIFICATION TERMINÉE\n');
}

verifyMigrations().catch(console.error);
