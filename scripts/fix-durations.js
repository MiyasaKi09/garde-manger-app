// Script pour fixer les durées des étapes de recette
// Usage: node scripts/fix-durations.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ (masqué)' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDurations() {
  try {
    console.log('🔧 Mise à jour des durées des étapes...\n');

    // Définir les durées pour chaque étape
    const updates = [
      { step_no: 1, duration: 10, desc: 'Cuisson des œufs' },
      { step_no: 2, duration: 10, desc: 'Cuisson haricots verts' },
      { step_no: 3, duration: 5, desc: 'Laver et couper tomates' },
      { step_no: 4, duration: 2, desc: 'Égoutter thon' },
      { step_no: 5, duration: 3, desc: 'Préparer vinaigrette' },
      { step_no: 6, duration: 5, desc: 'Disposer feuilles de laitue' },
      { step_no: 7, duration: 3, desc: 'Ajouter garniture finale' },
    ];

    for (const update of updates) {
      console.log(`⏱️  Étape ${update.step_no}: ${update.duration} min (${update.desc})`);

      const { error } = await supabase
        .from('recipe_steps')
        .update({ duration: update.duration })
        .eq('recipe_id', 9401)
        .eq('step_no', update.step_no);

      if (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Mise à jour réussie`);
      }
    }

    // Vérifier le résultat
    console.log('\n📊 Vérification des résultats:\n');

    const { data: steps, error: fetchError } = await supabase
      .from('recipe_steps')
      .select('step_no, duration, description')
      .eq('recipe_id', 9401)
      .order('step_no', { ascending: true });

    if (fetchError) {
      console.error('❌ Erreur lors de la vérification:', fetchError);
      return;
    }

    let totalDuration = 0;
    steps.forEach(step => {
      const duration = step.duration || 0;
      totalDuration += duration;
      console.log(`Étape ${step.step_no}: ${duration} min - ${step.description?.substring(0, 50)}...`);
    });

    console.log(`\n⏱️  TEMPS TOTAL: ${totalDuration} minutes`);
    console.log('✅ Toutes les mises à jour sont terminées!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixDurations();
