// Script pour importer les ingrédients manquants depuis le fichier CSV
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fonction pour nettoyer les chaînes JSON malformées
function parseIngredientsString(ingredientsStr) {
  try {
    // Remplacer les doubles guillemets triples par des guillemets simples
    let cleaned = ingredientsStr
      .replace(/"""/g, '"')
      .replace(/\r\n/g, ' ')
      .trim();

    // Si ça commence et finit par des guillemets, les enlever
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // Séparer par les virgules en respectant les guillemets
    const ingredients = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        if (current.trim()) {
          ingredients.push(current.trim().replace(/^"|"$/g, ''));
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      ingredients.push(current.trim().replace(/^"|"$/g, ''));
    }

    return ingredients.map(ing => {
      const parts = ing.split('|');
      if (parts.length >= 3) {
        return {
          quantity: parseFloat(parts[0]) || 0,
          unit: parts[1],
          name: parts.slice(2).join('|')
        };
      }
      return null;
    }).filter(Boolean);

  } catch (error) {
    console.error('Erreur parsing ingrédients:', error.message);
    return [];
  }
}

// Fonction pour normaliser un nom d'ingrédient pour la recherche
function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^\w\s]/g, '') // Enlever la ponctuation
    .trim();
}

// Fonction pour trouver le canonical_food ou archetype correspondant
async function findFoodMatch(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);

  // 1. Chercher dans canonical_foods
  const { data: canonicalFoods } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .ilike('canonical_name', `%${normalized}%`)
    .limit(1);

  if (canonicalFoods && canonicalFoods.length > 0) {
    return { canonical_food_id: canonicalFoods[0].id, archetype_id: null };
  }

  // 2. Chercher dans archetypes
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name')
    .ilike('name', `%${normalized}%`)
    .limit(1);

  if (archetypes && archetypes.length > 0) {
    return { canonical_food_id: null, archetype_id: archetypes[0].id };
  }

  // Pas de correspondance trouvée
  return null;
}

async function main() {
  console.log('🚀 Démarrage de l\'import des ingrédients...\n');

  // Lire le fichier CSV complet
  const fileContent = fs.readFileSync(
    '/workspaces/garde-manger-app/LISTE_TOUTES_RECETTES COMPLETE.txt',
    'utf-8'
  );

  const lines = fileContent.split('\n').slice(1); // Sauter l'en-tête
  console.log(`📋 ${lines.length} recettes trouvées dans le fichier\n`);

  let recipesProcessed = 0;
  let ingredientsAdded = 0;
  let ingredientsSkipped = 0;
  let recipesWithIngredients = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Parser la ligne CSV - format : ID,Nom,Portions,"ing1","ing2"...
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const thirdComma = line.indexOf(',', secondComma + 1);

    if (firstComma === -1 || secondComma === -1 || thirdComma === -1) {
      console.log(`⚠️  Ligne ignorée (format incorrect): ${line.substring(0, 50)}...`);
      continue;
    }

    const recipeId = line.substring(0, firstComma);
    const recipeName = line.substring(firstComma + 1, secondComma);
    const portions = line.substring(secondComma + 1, thirdComma);
    const ingredientsStr = line.substring(thirdComma + 1);

    // Vérifier si la recette existe dans la DB
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('id', parseInt(recipeId))
      .single();

    if (recipeError || !recipe) {
      console.log(`⚠️  Recette ${recipeId} (${recipeName}) introuvable dans la DB`);
      continue;
    }

    // Vérifier si la recette a déjà des ingrédients
    const { data: existingIngredients, error: existingError } = await supabase
      .from('recipe_ingredients')
      .select('id')
      .eq('recipe_id', parseInt(recipeId));

    if (existingIngredients && existingIngredients.length > 0) {
      console.log(`✅ Recette ${recipeId} (${recipeName}) a déjà ${existingIngredients.length} ingrédients`);
      recipesWithIngredients++;
      recipesProcessed++;
      continue;
    }

    // Parser les ingrédients
    const ingredients = parseIngredientsString(ingredientsStr);
    console.log(`\n🔍 Traitement recette ${recipeId} (${recipeName}) - ${ingredients.length} ingrédients`);

    let addedCount = 0;
    for (const ingredient of ingredients) {
      // Chercher la correspondance
      const match = await findFoodMatch(ingredient.name);

      if (match) {
        // Insérer l'ingrédient
        const { error: insertError } = await supabase
          .from('recipe_ingredients')
          .insert({
            recipe_id: parseInt(recipeId),
            canonical_food_id: match.canonical_food_id,
            archetype_id: match.archetype_id,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            notes: null
          });

        if (insertError) {
          console.log(`   ❌ Erreur insertion "${ingredient.name}":`, insertError.message);
          ingredientsSkipped++;
        } else {
          console.log(`   ✅ "${ingredient.name}" (${ingredient.quantity} ${ingredient.unit})`);
          ingredientsAdded++;
          addedCount++;
        }
      } else {
        console.log(`   ⚠️  "${ingredient.name}" - aucune correspondance trouvée`);
        ingredientsSkipped++;
      }
    }

    if (addedCount > 0) {
      recipesWithIngredients++;
    }
    recipesProcessed++;

    // Petite pause pour ne pas surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n📊 Résumé de l\'import :');
  console.log(`   Recettes traitées: ${recipesProcessed}`);
  console.log(`   Recettes avec ingrédients ajoutés: ${recipesWithIngredients}`);
  console.log(`   Ingrédients ajoutés: ${ingredientsAdded}`);
  console.log(`   Ingrédients ignorés (pas de correspondance): ${ingredientsSkipped}`);
  console.log('\n✅ Import terminé !');
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
