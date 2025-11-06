import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAlcoolUsage() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   VÉRIFICATION USAGE DES ALCOOLS DANS LES RECETTES');
  console.log('═══════════════════════════════════════════════════════\n');

  const alcoohols = ['Grand Marnier', 'Marsala', 'amaretto', 'calvados', 'kirsch', 'porto', 'rhum'];

  for (const alcool of alcoohols) {
    // Récupérer le canonical
    const { data: canonical } = await supabase
      .from('canonical_foods')
      .select('id')
      .eq('canonical_name', alcool)
      .single();

    if (!canonical) {
      console.log(`❌ ${alcool}: canonical non trouvé`);
      continue;
    }

    // Vérifier les archetypes qui dépendent de ce canonical
    const { data: archetypes } = await supabase
      .from('archetypes')
      .select('id, name')
      .eq('canonical_food_id', canonical.id);

    // Vérifier les recettes qui utilisent ce canonical directement
    const { data: recipeIngredients, error } = await supabase
      .from('recipe_ingredients')
      .select('id, recipe_id, recipes(title)')
      .eq('canonical_food_id', canonical.id);

    // Vérifier les recettes qui utilisent les archetypes de ce canonical
    let archetypeUsage = 0;
    if (archetypes && archetypes.length > 0) {
      for (const arch of archetypes) {
        const { data: archRecipes } = await supabase
          .from('recipe_ingredients')
          .select('id')
          .eq('archetype_id', arch.id);
        archetypeUsage += archRecipes?.length || 0;
      }
    }

    console.log(`\n📦 ${alcool} (id: ${canonical.id})`);
    console.log(`   - Archetypes dépendants: ${archetypes?.length || 0}`);
    if (archetypes && archetypes.length > 0) {
      archetypes.forEach(a => console.log(`     • ${a.name} (id: ${a.id})`));
    }
    console.log(`   - Recettes utilisant le canonical: ${recipeIngredients?.length || 0}`);
    if (recipeIngredients && recipeIngredients.length > 0 && recipeIngredients.length < 10) {
      recipeIngredients.forEach(ri => console.log(`     • ${ri.recipes?.title || 'N/A'}`));
    }
    console.log(`   - Recettes utilisant les archetypes: ${archetypeUsage}`);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

checkAlcoolUsage().catch(console.error);
