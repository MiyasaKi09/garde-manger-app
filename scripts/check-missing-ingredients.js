// Script pour identifier les recettes sans ingrédients
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('🔍 Recherche des recettes sans ingrédients...\n');

  // Charger toutes les recettes
  const { data: allRecipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, name')
    .order('id', { ascending: true });

  if (recipesError) {
    console.error('❌ Erreur chargement recettes:', recipesError);
    return;
  }

  console.log(`📋 Total de recettes dans la base: ${allRecipes.length}\n`);

  // Charger toutes les recettes qui ont des ingrédients
  const { data: recipesWithIngredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('recipe_id')
    .order('recipe_id', { ascending: true });

  if (ingredientsError) {
    console.error('❌ Erreur chargement ingrédients:', ingredientsError);
    return;
  }

  // Créer un Set des IDs de recettes qui ont des ingrédients
  const recipeIdsWithIngredients = new Set(
    recipesWithIngredients.map(r => r.recipe_id)
  );

  console.log(`✅ Recettes avec ingrédients: ${recipeIdsWithIngredients.size}\n`);

  // Identifier les recettes sans ingrédients
  const recipesWithoutIngredients = allRecipes.filter(
    recipe => !recipeIdsWithIngredients.has(recipe.id)
  );

  console.log(`❌ Recettes SANS ingrédients: ${recipesWithoutIngredients.length}\n`);

  if (recipesWithoutIngredients.length > 0) {
    console.log('Liste des recettes sans ingrédients:\n');

    recipesWithoutIngredients.forEach((recipe, index) => {
      console.log(`${index + 1}. ID ${recipe.id}: ${recipe.name}`);
    });
  }

  // Statistiques
  const percentageWithIngredients = (recipeIdsWithIngredients.size / allRecipes.length * 100).toFixed(1);
  console.log('\n📊 Statistiques:');
  console.log(`   Recettes avec ingrédients: ${recipeIdsWithIngredients.size} (${percentageWithIngredients}%)`);
  console.log(`   Recettes sans ingrédients: ${recipesWithoutIngredients.length} (${(100 - percentageWithIngredients).toFixed(1)}%)`);
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
