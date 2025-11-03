require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSimpleArchetypesUsage() {
  console.log('🔍 Vérification de l\'usage des archetypes simples\n');

  // Archetypes à vérifier (qui devraient devenir parents)
  const simpleNames = [
    'lait', 'crème', 'fromage', 'yaourt', 'beurre',
    'jambon', 'lardon', 'farine', 'pain', 'pâte'
  ];

  for (const name of simpleNames) {
    // Trouver l'archetype
    const { data: archetypes } = await supabase
      .from('archetypes')
      .select('id, name')
      .ilike('name', name);

    if (archetypes && archetypes.length > 0) {
      for (const archetype of archetypes) {
        // Compter l'usage dans recipe_ingredients
        const { data: usage, count } = await supabase
          .from('recipe_ingredients')
          .select('id', { count: 'exact', head: true })
          .eq('archetype_id', archetype.id);

        console.log(`📦 "${archetype.name}" (id: ${archetype.id})`);
        console.log(`   → Utilisé dans ${count || 0} recettes`);

        if (count && count > 0) {
          // Montrer quelques exemples
          const { data: examples } = await supabase
            .from('recipe_ingredients')
            .select('recipe_id, recipes(title)')
            .eq('archetype_id', archetype.id)
            .limit(3);

          if (examples && examples.length > 0) {
            console.log(`   Exemples:`);
            examples.forEach(ex => {
              console.log(`     - Recette ${ex.recipe_id}: ${ex.recipes?.title}`);
            });
          }
        }
        console.log();
      }
    } else {
      console.log(`❌ "${name}" n'existe pas\n`);
    }
  }
}

checkSimpleArchetypesUsage().catch(console.error);
