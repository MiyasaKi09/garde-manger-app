const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function auditComplete() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   AUDIT COMPLET DE LA STRUCTURE HIÉRARCHIQUE');
  console.log('═══════════════════════════════════════════════════════\n');

  // ===== VÉRIFIER LA LOGIQUE GÉNÉRALE =====
  console.log('📋 LOGIQUE ATTENDUE :');
  console.log('  CANONICAL = Espèce de base (cabillaud, bœuf, lait, blé)');
  console.log('  CULTIVAR = Variété plus précise (morue, lait de chèvre)');
  console.log('  ARCHETYPE = Transformation spécifique (filet de cabillaud, steak de bœuf)\n');

  // ===== 1. ARCHETYPES AVEC PARENT_ARCHETYPE_ID =====
  console.log('═══════════════════════════════════════════════════════');
  console.log('1️⃣  VÉRIFICATION : HIÉRARCHIES PARENT/ENFANT');
  console.log('═══════════════════════════════════════════════════════\n');

  const { data: parents } = await supabase
    .from('archetypes')
    .select('id, name, canonical_foods(canonical_name), cultivars(cultivar_name)')
    .is('parent_archetype_id', null)
    .order('name');

  console.log(`📊 ${parents.length} ARCHETYPES PARENTS trouvés :\n`);

  for (const parent of parents) {
    const base = parent.canonical_foods?.canonical_name || parent.cultivars?.cultivar_name;

    // Compter les enfants
    const { data: children } = await supabase
      .from('archetypes')
      .select('id, name')
      .eq('parent_archetype_id', parent.id);

    const nbChildren = children?.length || 0;

    if (nbChildren > 0) {
      console.log(`✅ ${parent.name} (base: ${base}) → ${nbChildren} enfant(s)`);
      children.slice(0, 3).forEach(c => console.log(`   └─ ${c.name}`));
      if (nbChildren > 3) console.log(`   └─ ... et ${nbChildren - 3} autres`);
    } else {
      console.log(`⚠️  ${parent.name} (base: ${base}) → 0 enfant (parent vide ou standalone)`);
    }
  }

  // ===== 2. ARCHETYPES LIÉS À CANONICAL =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('2️⃣  VÉRIFICATION : ARCHETYPES → CANONICAL');
  console.log('═══════════════════════════════════════════════════════\n');

  const { data: archetypesCanonical } = await supabase
    .from('archetypes')
    .select('name, canonical_foods(canonical_name)')
    .not('canonical_food_id', 'is', null)
    .order('canonical_foods(canonical_name)', { ascending: true })
    .limit(50);

  const byCanonical = {};
  archetypesCanonical.forEach(a => {
    const canonical = a.canonical_foods?.canonical_name || 'NULL';
    if (!byCanonical[canonical]) byCanonical[canonical] = [];
    byCanonical[canonical].push(a.name);
  });

  console.log('📊 EXEMPLES d\'archetypes par canonical :\n');
  Object.entries(byCanonical).slice(0, 10).forEach(([canonical, archetypes]) => {
    console.log(`✅ ${canonical} → ${archetypes.length} archetype(s)`);
    archetypes.slice(0, 3).forEach(a => console.log(`   └─ ${a}`));
    if (archetypes.length > 3) console.log(`   └─ ... et ${archetypes.length - 3} autres`);
  });

  // ===== 3. ARCHETYPES LIÉS À CULTIVAR =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('3️⃣  VÉRIFICATION : ARCHETYPES → CULTIVAR');
  console.log('═══════════════════════════════════════════════════════\n');

  const { data: archetypesCultivar } = await supabase
    .from('archetypes')
    .select('name, cultivars(cultivar_name, canonical_foods(canonical_name))')
    .not('cultivar_id', 'is', null);

  console.log(`📊 ${archetypesCultivar.length} ARCHETYPES liés à cultivar :\n`);

  archetypesCultivar.forEach(a => {
    const cultivar = a.cultivars?.cultivar_name;
    const canonical = a.cultivars?.canonical_foods?.canonical_name;
    console.log(`✅ ${a.name} → cultivar: ${cultivar} (base: ${canonical})`);
  });

  // ===== 4. PROBLÈMES POTENTIELS =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('4️⃣  DÉTECTION DE PROBLÈMES');
  console.log('═══════════════════════════════════════════════════════\n');

  // Archetypes sans canonical ET sans cultivar
  const { data: orphelins } = await supabase
    .from('archetypes')
    .select('id, name')
    .is('canonical_food_id', null)
    .is('cultivar_id', null);

  if (orphelins && orphelins.length > 0) {
    console.log(`❌ ${orphelins.length} ARCHETYPES ORPHELINS (sans canonical ni cultivar) :`);
    orphelins.forEach(a => console.log(`   - ${a.name} (id: ${a.id})`));
  } else {
    console.log('✅ Pas d\'archetypes orphelins');
  }

  // Archetypes génériques suspects (avec hiérarchie mais trop génériques)
  const { data: generiques } = await supabase
    .from('archetypes')
    .select('id, name, canonical_foods(canonical_name)')
    .is('parent_archetype_id', null)
    .not('canonical_food_id', 'is', null)
    .order('name');

  console.log('\n⚠️  ARCHETYPES PARENTS GÉNÉRIQUES à vérifier :');
  const suspects = generiques.filter(a => {
    const name = a.name.toLowerCase();
    return name === 'poisson' || name === 'viande' || name === 'légume' ||
           name === 'poisson blanc' || name === 'poissons variés';
  });

  if (suspects.length > 0) {
    suspects.forEach(a => {
      console.log(`   ❌ ${a.name} (base: ${a.canonical_foods?.canonical_name}) - TROP GÉNÉRIQUE`);
    });
  } else {
    console.log('   ✅ Pas d\'archetypes parents trop génériques détectés');
  }

  // ===== 5. CULTIVARS EXISTANTS =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('5️⃣  CULTIVARS EXISTANTS');
  console.log('═══════════════════════════════════════════════════════\n');

  const { data: cultivars } = await supabase
    .from('cultivars')
    .select('id, cultivar_name, canonical_foods(canonical_name)')
    .order('canonical_foods(canonical_name)', { ascending: true });

  console.log(`📊 ${cultivars.length} CULTIVARS trouvés :\n`);

  const byCan = {};
  cultivars.forEach(c => {
    const can = c.canonical_foods?.canonical_name || 'NULL';
    if (!byCan[can]) byCan[can] = [];
    byCan[can].push(c.cultivar_name);
  });

  Object.entries(byCan).forEach(([canonical, cvs]) => {
    console.log(`✅ ${canonical} → ${cvs.length} cultivar(s): ${cvs.join(', ')}`);
  });

  // ===== 6. RÉSUMÉ FINAL =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   RÉSUMÉ FINAL');
  console.log('═══════════════════════════════════════════════════════\n');

  const { count: nbCanonical } = await supabase
    .from('canonical_foods')
    .select('*', { count: 'exact', head: true });

  const { count: nbCultivars } = await supabase
    .from('cultivars')
    .select('*', { count: 'exact', head: true });

  const { count: nbArchetypes } = await supabase
    .from('archetypes')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 TOTAUX :`);
  console.log(`   - ${nbCanonical} canonical foods`);
  console.log(`   - ${nbCultivars} cultivars`);
  console.log(`   - ${nbArchetypes} archetypes`);

  console.log('\n✅ Audit terminé !');
}

auditComplete();
