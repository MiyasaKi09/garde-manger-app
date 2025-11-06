const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifyPhase2() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   VÉRIFICATION PHASE 2 - SECONDAIRES');
  console.log('═══════════════════════════════════════════════════════\n');

  // ===== PHASE 2.1 : POISSONS =====
  console.log('📦 PHASE 2.1 : POISSONS');

  const { data: poissons, error: err1 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id, canonical_foods(canonical_name), cultivars(cultivar_name)')
    .in('name', [
      'poisson', 'poisson blanc', 'poissons variés', 'poissons rivière',
      'poissons blancs variés', 'poissons de roche variés',
      'morue dessalée',
      'fumet de poisson', 'fumet poisson', 'arêtes poisson', 'sauce poisson'
    ])
    .order('name');

  if (err1) {
    console.error('❌ Erreur:', err1);
  } else {
    console.log(`✅ ${poissons.length}/11 archetypes poissons trouvés`);
    poissons.forEach(p => {
      const base = p.canonical_foods?.canonical_name || p.cultivars?.cultivar_name || 'NULL';
      console.log(`   - ${p.name} (base: ${base}, parent_id: ${p.parent_archetype_id || 'NULL'})`);
    });
  }

  // ===== PHASE 2.2 : PAINS =====
  console.log('\n📦 PHASE 2.2 : PAINS');

  const { data: pains, error: err2 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id')
    .in('name', [
      'baguette', 'pain de campagne', 'pain de mie', 'mie de pain', 'mie pain',
      'brioche', 'pains burger', 'pain d\'épices',
      'pain rassis', 'pâte à pain'
    ])
    .order('name');

  if (err2) {
    console.error('❌ Erreur:', err2);
  } else {
    console.log(`✅ ${pains.length}/10 archetypes pains trouvés`);
    pains.forEach(p => {
      console.log(`   - ${p.name} (parent_id: ${p.parent_archetype_id || 'NULL'})`);
    });
  }

  // ===== PHASE 2.3 : PÂTES =====
  console.log('\n📦 PHASE 2.3 : PÂTES');

  const { data: pates, error: err3 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id, canonical_foods(canonical_name)')
    .in('name', [
      'pâtes', 'pâtes courtes', 'linguine', 'trofie', 'trofie ou linguine', 'raviolis frais',
      'nouilles', 'nouilles chinoises', 'nouilles ramen', 'nouilles soba', 'nouilles udon', 'fideos pâtes',
      'pâte phyllo', 'pâte à pizza', 'pâte laksa'
    ])
    .order('name');

  if (err3) {
    console.error('❌ Erreur:', err3);
  } else {
    console.log(`✅ ${pates.length}/15 archetypes pâtes trouvés`);
    pates.forEach(p => {
      const base = p.canonical_foods?.canonical_name || 'NULL';
      console.log(`   - ${p.name} (base: ${base}, parent_id: ${p.parent_archetype_id || 'NULL'})`);
    });
  }

  // ===== PHASE 2.4 : ÉPICES =====
  console.log('\n📦 PHASE 2.4 : ÉPICES');

  const { data: epices, error: err4 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id')
    .in('name', [
      'paprika', 'paprika doux', 'paprika fumé',
      'berbéré épices', 'cinq épices', 'curry', 'garam masala',
      'quatre-épices', 'épices speculoos', 'épices pain épices'
    ])
    .order('name');

  if (err4) {
    console.error('❌ Erreur:', err4);
  } else {
    console.log(`✅ ${epices.length}/10 archetypes épices trouvés`);
    epices.forEach(p => {
      console.log(`   - ${p.name} (parent_id: ${p.parent_archetype_id || 'NULL'})`);
    });
  }

  // ===== PHASE 2.5 : LÉGUMES =====
  console.log('\n📦 PHASE 2.5 : LÉGUMES');

  const { data: legumes, error: err5 } = await supabase
    .from('archetypes')
    .select('id, name, parent_archetype_id, canonical_foods(canonical_name)')
    .in('name', [
      'poireaux', 'blanc de poireau', 'courgettes', 'blettes',
      'laitue romaine', 'légumes variés cuits'
    ])
    .order('name');

  if (err5) {
    console.error('❌ Erreur:', err5);
  } else {
    console.log(`✅ ${legumes.length}/6 archetypes légumes trouvés`);
    legumes.forEach(p => {
      const base = p.canonical_foods?.canonical_name || 'NULL';
      console.log(`   - ${p.name} (base: ${base}, parent_id: ${p.parent_archetype_id || 'NULL'})`);
    });
  }

  // ===== HIÉRARCHIES =====
  console.log('\n📊 HIÉRARCHIES CRÉÉES :');

  const hierarchies = [
    'poisson', 'poisson blanc', 'fumet de poisson',
    'pain', 'pain de mie',
    'pâtes', 'nouilles', 'pâtes courtes',
    'paprika',
    'poireaux'
  ];

  for (const parent_name of hierarchies) {
    const { data: children, error } = await supabase
      .from('archetypes')
      .select('id, name')
      .eq('parent_archetype_id', supabase.rpc('get_archetype_id_by_name', { archetype_name: parent_name }));

    // Alternative: récupérer d'abord l'ID du parent
    const { data: parent } = await supabase
      .from('archetypes')
      .select('id')
      .eq('name', parent_name)
      .is('parent_archetype_id', null)
      .single();

    if (parent) {
      const { data: children } = await supabase
        .from('archetypes')
        .select('id, name')
        .eq('parent_archetype_id', parent.id);

      console.log(`   ${parent_name}: ${children?.length || 0} enfant(s)`);
    }
  }

  // ===== RÉSUMÉ GLOBAL =====
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   RÉSUMÉ PHASE 2');
  console.log('═══════════════════════════════════════════════════════');

  const total = (poissons?.length || 0) + (pains?.length || 0) + (pates?.length || 0) +
                (epices?.length || 0) + (legumes?.length || 0);

  console.log(`\n✅ TOTAL PHASE 2 : ${total}/52 ingrédients créés`);
  console.log('\nDétail par sous-phase :');
  console.log(`   Phase 2.1 (Poissons)     : ${poissons?.length || 0}/11`);
  console.log(`   Phase 2.2 (Pains)        : ${pains?.length || 0}/10`);
  console.log(`   Phase 2.3 (Pâtes)        : ${pates?.length || 0}/15`);
  console.log(`   Phase 2.4 (Épices)       : ${epices?.length || 0}/10`);
  console.log(`   Phase 2.5 (Légumes)      : ${legumes?.length || 0}/6`);

  if (total === 52) {
    console.log('\n🎉 PHASE 2 COMPLÈTE ! Toutes les migrations ont réussi.\n');
  } else {
    console.log('\n⚠️  Certains ingrédients manquent. Vérifier les erreurs ci-dessus.\n');
  }
}

verifyPhase2();
