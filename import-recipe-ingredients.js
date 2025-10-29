// Import des ingrédients depuis LISTE_TOUTES_RECETTES COMPLETE.txt
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour parser une ligne CSV avec des guillemets
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Fonction pour normaliser un nom d'ingrédient
function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/['']/g, "'") // Normaliser les apostrophes
    .replace(/\s+/g, ' '); // Normaliser les espaces
}

// Fonction pour trouver un ingrédient dans la base
async function findIngredient(ingredientName, canonicalFoods, archetypes) {
  const normalized = normalizeIngredientName(ingredientName);

  // Chercher dans canonical_foods
  let match = canonicalFoods.find(cf =>
    normalizeIngredientName(cf.canonical_name) === normalized
  );

  if (match) {
    return { type: 'canonical_food', id: match.id, name: match.canonical_name };
  }

  // Chercher dans archetypes
  match = archetypes.find(arch =>
    normalizeIngredientName(arch.name) === normalized
  );

  if (match) {
    return { type: 'archetype', id: match.id, name: match.name };
  }

  // Chercher des correspondances partielles
  const partialMatches = canonicalFoods.filter(cf =>
    normalizeIngredientName(cf.canonical_name).includes(normalized) ||
    normalized.includes(normalizeIngredientName(cf.canonical_name))
  );

  if (partialMatches.length === 1) {
    return { type: 'canonical_food', id: partialMatches[0].id, name: partialMatches[0].canonical_name };
  }

  return null;
}

async function importIngredients() {
  console.log('=== IMPORT DES INGRÉDIENTS DES RECETTES ===\n');

  // 1. Charger les canonical_foods et archetypes
  console.log('1️⃣ Chargement des aliments canoniques et archetypes...');

  const { data: canonicalFoods, error: cfError } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, primary_unit');

  if (cfError) {
    console.error('❌ Erreur chargement canonical_foods:', cfError);
    return;
  }

  const { data: archetypes, error: archError } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id, primary_unit');

  if (archError) {
    console.error('❌ Erreur chargement archetypes:', archError);
    return;
  }

  console.log(`✅ ${canonicalFoods.length} aliments canoniques`);
  console.log(`✅ ${archetypes.length} archetypes\n`);

  // 2. Lire et parser le fichier CSV
  console.log('2️⃣ Lecture du fichier CSV...');

  const filePath = path.join(__dirname, 'LISTE_TOUTES_RECETTES COMPLETE.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  console.log(`✅ ${lines.length - 1} recettes trouvées\n`);

  // 3. Charger toutes les recettes existantes
  console.log('3️⃣ Chargement des recettes existantes...');

  const { data: existingRecipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id');

  if (recipesError) {
    console.error('❌ Erreur chargement recettes:', recipesError);
    return;
  }

  const existingRecipeIds = new Set(existingRecipes.map(r => r.id));
  console.log(`✅ ${existingRecipeIds.size} recettes existantes\n`);

  // 4. Parser chaque ligne et préparer les insertions
  console.log('4️⃣ Parsing des recettes et matching des ingrédients...\n');

  const ingredientsByRecipe = {}; // Pour gérer les doublons
  const notFoundIngredients = new Set();
  let processedRecipes = 0;
  let skippedRecipes = 0;

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = parseCSVLine(line);

    if (parts.length < 4) {
      console.log(`⚠️  Ligne ${i + 1} ignorée (format invalide)`);
      continue;
    }

    const recipeId = parseInt(parts[0]);
    const recipeName = parts[1];
    const servings = parseInt(parts[2]);

    // Vérifier si la recette existe
    if (!existingRecipeIds.has(recipeId)) {
      skippedRecipes++;
      continue;
    }

    // Parser les ingrédients (à partir de parts[3])
    const ingredients = parts.slice(3);
    let foundCount = 0;
    let notFoundCount = 0;

    if (!ingredientsByRecipe[recipeId]) {
      ingredientsByRecipe[recipeId] = {};
    }

    for (const ingredientStr of ingredients) {
      if (!ingredientStr || ingredientStr.trim() === '') continue;

      // Format: "quantité|unité|nom"
      const ingredientParts = ingredientStr.split('|');
      if (ingredientParts.length !== 3) {
        console.log(`⚠️  Ingrédient ignoré (format invalide): "${ingredientStr}" dans recette ${recipeId}`);
        continue;
      }

      const [quantityStr, unit, name] = ingredientParts;

      // Parser la quantité
      let quantity = parseFloat(quantityStr);
      if (isNaN(quantity)) {
        quantity = 1; // Valeur par défaut si la quantité ne peut pas être parsée
      }

      // Trouver l'ingrédient dans la base
      const match = await findIngredient(name, canonicalFoods, archetypes);

      if (match) {
        // Créer une clé unique pour éviter les doublons
        const key = `${match.type === 'canonical_food' ? match.id : 'null'}-${match.type === 'archetype' ? match.id : 'null'}-${unit}`;

        if (ingredientsByRecipe[recipeId][key]) {
          // Agréger la quantité si doublon
          ingredientsByRecipe[recipeId][key].quantity += quantity;
        } else {
          ingredientsByRecipe[recipeId][key] = {
            recipe_id: recipeId,
            canonical_food_id: match.type === 'canonical_food' ? match.id : null,
            archetype_id: match.type === 'archetype' ? match.id : null,
            quantity: quantity,
            unit: unit,
            notes: null
          };
        }
        foundCount++;
      } else {
        notFoundIngredients.add(name);
        notFoundCount++;
      }
    }

    processedRecipes++;

    if (processedRecipes % 50 === 0) {
      console.log(`📊 Progression: ${processedRecipes} recettes traitées...`);
    }
  }

  // Aplatir l'objet pour créer le tableau d'ingrédients
  const ingredientsToInsert = [];
  for (const recipeId in ingredientsByRecipe) {
    for (const key in ingredientsByRecipe[recipeId]) {
      ingredientsToInsert.push(ingredientsByRecipe[recipeId][key]);
    }
  }

  console.log(`\n✅ ${processedRecipes} recettes traitées`);
  console.log(`⏭️  ${skippedRecipes} recettes ignorées (n'existent pas dans la base)`);
  console.log(`📦 ${ingredientsToInsert.length} ingrédients à insérer`);
  console.log(`❌ ${notFoundIngredients.size} ingrédients non trouvés\n`);

  if (notFoundIngredients.size > 0) {
    console.log('=== INGRÉDIENTS NON TROUVÉS ===');
    const notFoundArray = Array.from(notFoundIngredients).sort();
    notFoundArray.slice(0, 50).forEach(name => console.log(`  - ${name}`));
    if (notFoundArray.length > 50) {
      console.log(`  ... et ${notFoundArray.length - 50} autres\n`);
    }

    // Sauvegarder la liste complète
    fs.writeFileSync('INGREDIENTS_NON_TROUVES.txt', notFoundArray.join('\n'));
    console.log('✅ Liste complète sauvegardée dans INGREDIENTS_NON_TROUVES.txt\n');
  }

  // 4. Demander confirmation avant l'insertion
  console.log('=== PRÊT POUR L\'INSERTION ===');
  console.log(`${ingredientsToInsert.length} ingrédients seront insérés`);
  console.log('\nVoulez-vous continuer? (Modifier le script pour confirmer)\n');

  // Lancer l'insertion:
  await performInsertion(ingredientsToInsert);
}

async function performInsertion(ingredientsToInsert) {
  console.log('\n5️⃣ Insertion des ingrédients...\n');

  // D'abord, supprimer tous les ingrédients existants pour éviter les doublons
  console.log('🗑️  Suppression des ingrédients existants...');
  const { error: deleteError } = await supabase
    .from('recipe_ingredients')
    .delete()
    .neq('id', 0); // Supprimer tous les enregistrements

  if (deleteError) {
    console.error('❌ Erreur suppression:', deleteError);
    return;
  }

  console.log('✅ Ingrédients existants supprimés\n');

  // Insérer par batches de 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < ingredientsToInsert.length; i += BATCH_SIZE) {
    const batch = ingredientsToInsert.slice(i, i + BATCH_SIZE);

    const { error: insertError } = await supabase
      .from('recipe_ingredients')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Erreur insertion batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
      continue;
    }

    inserted += batch.length;
    console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} ingrédients insérés (total: ${inserted})`);
  }

  console.log(`\n✅ Import terminé: ${inserted} ingrédients insérés!`);
}

importIngredients().catch(console.error);
