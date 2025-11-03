require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHierarchyStats() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   STATISTIQUES DE LA HIÉRARCHIE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Compter les parents
  const { data: parents } = await supabase
    .from('archetypes')
    .select('id, name')
    .is('parent_archetype_id', null);

  console.log(`📊 ARCHETYPES PARENT: ${parents.length}`);

  // Pour chaque parent, compter les enfants
  for (const parent of parents.filter(p => ['lait', 'crème', 'fromage', 'yaourt', 'beurre', 'jambon', 'lardon', 'farine', 'pain'].includes(p.name))) {
    const { count } = await supabase
      .from('archetypes')
      .select('id', { count: 'exact', head: true })
      .eq('parent_archetype_id', parent.id);

    console.log(`   ${parent.name}: ${count} enfants`);
  }

  // Compter les enfants
  const { data: children } = await supabase
    .from('archetypes')
    .select('id, name')
    .not('parent_archetype_id', 'is', null);

  console.log(`\n📊 ARCHETYPES ENFANT: ${children.length}`);

  // Compter les orphelins (ni parent ni enfant liés)
  const { data: orphans } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id')
    .is('parent_archetype_id', null);

  // Filtrer pour ne garder que ceux qui n'ont pas d'enfants
  const trueOrphans = [];
  for (const orphan of orphans) {
    const { count } = await supabase
      .from('archetypes')
      .select('id', { count: 'exact', head: true })
      .eq('parent_archetype_id', orphan.id);

    if (count === 0) {
      trueOrphans.push(orphan);
    }
  }

  console.log(`\n📊 ARCHETYPES STANDALONE (ni parent ni enfant): ${trueOrphans.length}`);
  console.log('   Exemples:');
  trueOrphans.slice(0, 10).forEach(o => {
    console.log(`   - ${o.name}`);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Total archetypes: ${parents.length + children.length}`);
  console.log(`  - Parents (avec enfants): ${parents.length - trueOrphans.length}`);
  console.log(`  - Enfants (liés à un parent): ${children.length}`);
  console.log(`  - Standalone (ni parent ni enfant): ${trueOrphans.length}`);

  // Vérifier les archetypes de produits laitiers
  const { data: laitiers } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id')
    .eq('canonical_food_id', (await supabase.from('canonical_foods').select('id').eq('canonical_name', 'lait').single()).data.id);

  const laitiersParent = laitiers.filter(a => a.parent_archetype_id === null);
  const laitiersEnfant = laitiers.filter(a => a.parent_archetype_id !== null);

  console.log('\n📊 DÉTAIL PRODUITS LAITIERS:');
  console.log(`   Total: ${laitiers.length}`);
  console.log(`   Parents: ${laitiersParent.length}`);
  console.log(`   Enfants: ${laitiersEnfant.length}`);

  // Vérifier les fromages de chèvre (qui doivent rester orphelins)
  const fromagesChevreOrphans = laitiers.filter(a =>
    a.parent_archetype_id === null &&
    (a.name.toLowerCase().includes('chèvre') || a.name.toLowerCase().includes('chevre'))
  );

  console.log(`\n📦 Fromages de chèvre orphelins (normal, seront liés au cultivar): ${fromagesChevreOrphans.length}`);
  fromagesChevreOrphans.forEach(f => console.log(`   - ${f.name}`));
}

checkHierarchyStats().catch(console.error);
