require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('Vérification de la structure DB...\n');

  // Vérifier archetypes
  const { data: archetypes, error: archetypesError } = await supabase
    .from('archetypes')
    .select('*')
    .limit(1);

  if (archetypesError) {
    console.log('❌ Erreur archetypes:', archetypesError);
  } else {
    console.log('✅ Table archetypes:');
    if (archetypes.length > 0) {
      console.log('   Colonnes:', Object.keys(archetypes[0]));
    }
  }

  // Vérifier cultivars
  const { data: cultivars, error: cultivarsError } = await supabase
    .from('cultivars')
    .select('*')
    .limit(1);

  if (cultivarsError) {
    console.log('\n❌ Table cultivars n\'existe pas ou erreur:', cultivarsError.message);
  } else {
    console.log('\n✅ Table cultivars:');
    if (cultivars.length > 0) {
      console.log('   Colonnes:', Object.keys(cultivars[0]));
      console.log('   Nombre de cultivars:', cultivars.length);
    } else {
      console.log('   Table vide');
    }
  }

  // Vérifier products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (productsError) {
    console.log('\n❌ Table products n\'existe pas ou erreur:', productsError.message);
  } else {
    console.log('\n✅ Table products:');
    if (products.length > 0) {
      console.log('   Colonnes:', Object.keys(products[0]));
      console.log('   Nombre de products:', products.length);
    } else {
      console.log('   Table vide');
    }
  }

  // Vérifier recipe_ingredients
  const { data: recipeIngredients, error: riError } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .limit(1);

  if (riError) {
    console.log('\n❌ Erreur recipe_ingredients:', riError);
  } else {
    console.log('\n✅ Table recipe_ingredients:');
    if (recipeIngredients.length > 0) {
      console.log('   Colonnes:', Object.keys(recipeIngredients[0]));
    }
  }
}

checkStructure().catch(console.error);
