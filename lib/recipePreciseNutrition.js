/**
 * Calcul nutritionnel précis pour les recettes IA.
 *
 * Respecte la hiérarchie du modèle de données :
 *   canonical_foods → archetypes → products
 *
 * Après qu'une recette est générée par Claude, ce module :
 * 1. Match chaque ingrédient dans l'ordre : archetype → canonical_food
 * 2. Crée la recette dans `recipes` + `recipe_ingredients`
 * 3. Appelle `calculate_and_cache_nutrition()` pour un calcul exact
 * 4. Retourne les macros précises par portion
 *
 * Corrections (audit juillet 2026) :
 * - I4 / R2 : createMissingFoodEntries devient un no-op (les données LLM ne
 *   doivent pas polluer les tables de référence CIQUAL)
 * - C4 : parsing RPC corrigé (retour wide single-row, pas tableau de nutrient_name)
 * - CHECK violation : les ingrédients non résolus sont désormais comptés/ignorés
 *   au lieu d'insérer des lignes avec archetype_id=null ET canonical_food_id=null
 * - Ghost recipe cleanup sur tous les chemins d'erreur
 * - toGrams délègue à lib/units.js pour les unités standard
 * - matched_ingredients ajouté en alias de matched_from_db
 */

import { toBase, unitClass } from './units';

/**
 * Normalise un nom d'ingrédient pour recherche.
 */
function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Extrait le mot-clé de base d'un nom d'ingrédient composé.
 * Ex: "crème fraîche épaisse" → "crème"
 *     "blanc de poulet" → "poulet"
 *     "huile d'olive vierge" → "huile"
 */
function extractBaseFoodName(name) {
  const normalized = name.toLowerCase().trim()

  // Patterns "X de Y" → Y est souvent la base (blanc de poulet → poulet)
  const deMatch = normalized.match(/(?:blanc|filet|cuisse|aiguillette|émincé|escalope|pavé|dos|tranche)s?\s+(?:de|d')\s*(.+)/)
  if (deMatch) return deMatch[1].split(/\s+/)[0]

  // Sinon le premier mot est souvent la base
  return normalized.split(/\s+/)[0]
}

/**
 * Recherche un ingrédient dans la hiérarchie : archetype → canonical_food.
 * Retourne le match le plus spécifique possible.
 */
async function findFoodMatch(supabase, ingredientName) {
  const normalized = normalizeIngredientName(ingredientName)
  if (!normalized) return null

  // 1. Exact match archetype (le plus spécifique)
  const { data: exactArchetype } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id')
    .ilike('name', normalized)
    .limit(1)

  if (exactArchetype?.length) {
    return {
      archetype_id: exactArchetype[0].id,
      canonical_food_id: exactArchetype[0].canonical_food_id,
      source: 'archetype_exact',
    }
  }

  // 2. Fuzzy match archetype (contient)
  const { data: fuzzyArchetype } = await supabase
    .from('archetypes')
    .select('id, name, canonical_food_id')
    .ilike('name', `%${normalized}%`)
    .limit(1)

  if (fuzzyArchetype?.length) {
    return {
      archetype_id: fuzzyArchetype[0].id,
      canonical_food_id: fuzzyArchetype[0].canonical_food_id,
      source: 'archetype_fuzzy',
    }
  }

  // 3. Exact match canonical_food
  const { data: exactCanonical } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, nutrition_id')
    .ilike('canonical_name', normalized)
    .limit(1)

  if (exactCanonical?.length) {
    return {
      archetype_id: null,
      canonical_food_id: exactCanonical[0].id,
      source: 'canonical_exact',
    }
  }

  // 4. Fuzzy match canonical_food (contient)
  const { data: fuzzyCanonical } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, nutrition_id')
    .ilike('canonical_name', `%${normalized}%`)
    .limit(1)

  if (fuzzyCanonical?.length) {
    return {
      archetype_id: null,
      canonical_food_id: fuzzyCanonical[0].id,
      source: 'canonical_fuzzy',
    }
  }

  // 5. Essai avec le mot-clé de base (ex: "crème fraîche épaisse" → chercher "crème")
  const baseName = extractBaseFoodName(ingredientName)
  if (baseName && baseName !== normalized) {
    const { data: baseCanonical } = await supabase
      .from('canonical_foods')
      .select('id, canonical_name, nutrition_id')
      .ilike('canonical_name', `%${baseName}%`)
      .limit(1)

    if (baseCanonical?.length) {
      return {
        archetype_id: null,
        canonical_food_id: baseCanonical[0].id,
        source: 'canonical_base_word',
        needsArchetype: true, // signale qu'on devrait créer un archetype spécifique
      }
    }
  }

  return null
}

/**
 * I4 / R2 — No-op intentionnel.
 *
 * Cette fonction NE DOIT PAS créer d'entrées dans canonical_foods, archetypes
 * ou nutritional_data à partir des estimations LLM. Ces tables sont des
 * références certifiées (CIQUAL France) ; les modifier avec des données IA
 * non vérifiées polluerait les calculs nutritionnels de tous les utilisateurs.
 *
 * Conservée pour ne pas casser les call-sites existants, mais toujours no-op.
 * @returns {null}
 */
async function createMissingFoodEntries(_supabase, _ingredientName, _per100g, _existingCanonicalId) {
  return null
}

/**
 * Supprime une recette fantôme (recette créée mais non finalisée).
 * Appelée sur tous les chemins d'erreur de calculatePreciseNutrition.
 */
async function cleanupGhostRecipe(supabase, recipeId) {
  if (!recipeId) return
  try {
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
    await supabase.from('recipes').delete().eq('id', recipeId)
  } catch (err) {
    console.error('[PreciseNutrition] cleanupGhostRecipe error:', err.message)
  }
}

/**
 * Convertit les unités courantes en grammes.
 */
function normalizeUnit(unit) {
  if (!unit) return 'g'
  const u = unit.toLowerCase().trim()
  const mapping = {
    'g': 'g', 'gr': 'g', 'gramme': 'g', 'grammes': 'g',
    'kg': 'kg', 'kilo': 'kg', 'kilos': 'kg',
    'ml': 'ml', 'millilitre': 'ml', 'millilitres': 'ml',
    'l': 'l', 'litre': 'l', 'litres': 'l',
    'cl': 'cl', 'centilitre': 'cl', 'centilitres': 'cl',
    'cs': 'cs', 'cuillère à soupe': 'cs', 'càs': 'cs',
    'cc': 'cc', 'cuillère à café': 'cc', 'càc': 'cc',
    'pièce': 'u', 'pièces': 'u', 'u': 'u', 'unité': 'u',
  }
  return mapping[u] || u
}

function toGrams(quantity, unit) {
  const u = normalizeUnit(unit)
  // Unités cuisine spécifiques — absentes de lib/units.js
  if (u === 'cs') return quantity * 15  // cuillère à soupe ≈ 15 ml ≈ 15 g
  if (u === 'cc') return quantity * 5   // cuillère à café  ≈  5 ml ≈  5 g
  // Unités standard : déléguer à lib/units.js
  // toBase retourne grammes pour 'mass' et millilitres pour 'vol' (≈ g pour l'eau)
  if (unitClass(u)) return toBase(quantity, u)
  // Fallback : quantité brute (ex: unités, pièces)
  return quantity
}

/**
 * Crée une recette dans `recipes` + `recipe_ingredients` à partir
 * de la recette IA, puis calcule la nutrition précise via CIQUAL.
 *
 * Chaque ingrédient est résolu dans l'ordre :
 * 1. Archetype existant (le plus spécifique)
 * 2. Canonical_food existant
 * 3. Création archetype + canonical_food avec les macros IA
 *
 * recipe_ingredients utilise archetype_id quand dispo, sinon canonical_food_id.
 */
export async function calculatePreciseNutrition(supabase, userId, aiRecipe, cookingMethod) {
  if (!aiRecipe?.ingredients?.length) return null

  // Déclaré avant le try pour être accessible dans le catch (nettoyage ghost recipe)
  let recipeId = null

  try {
    // 1. Créer la recette dans la table `recipes`
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name: aiRecipe.title,
        description: aiRecipe.description || null,
        prep_time_minutes: aiRecipe.prep_min || null,
        cook_time_minutes: aiRecipe.cook_min || null,
        servings: aiRecipe.servings || 2,
        cooking_method: cookingMethod || guessCookingMethod(aiRecipe),
      })
      .select('id')
      .single()

    if (recipeError || !recipe) {
      return null
    }

    recipeId = recipe.id

    // 2. Résoudre chaque ingrédient
    let matchedFromDb = 0
    let createdNew = 0
    let unresolved = 0
    let skipped = 0      // ingrédients non résolus, non insérés (évite violation CHECK)
    const ingredientRows = []

    for (const ing of aiRecipe.ingredients) {
      const quantityG = toGrams(ing.quantity || 0, ing.unit)

      // Chercher dans la hiérarchie existante
      let match = await findFoodMatch(supabase, ing.name)

      if (match && !match.needsArchetype) {
        // Trouvé en base — utiliser tel quel
        matchedFromDb++
      } else if (match?.needsArchetype && ing.per100g) {
        // createMissingFoodEntries est un no-op (I4/R2) → fallback sur le canonical trouvé
        matchedFromDb++
        match = { archetype_id: null, canonical_food_id: match.canonical_food_id }
      } else if (!match) {
        // createMissingFoodEntries est un no-op (I4/R2) → ingrédient non résolu
        match = null
      }

      if (match && (match.archetype_id || match.canonical_food_id)) {
        ingredientRows.push({
          recipe_id: recipeId,
          archetype_id: match.archetype_id || null,
          canonical_food_id: match.canonical_food_id || null,
          quantity: quantityG,
          unit: 'g',
          notes: null,
        })
      } else {
        // Ne pas insérer : violerait le CHECK recipe_ing_oneof_exactly_one
        // (archetype_id=null ET canonical_food_id=null interdit)
        unresolved++
        skipped++
      }
    }

    if (ingredientRows.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientRows)

      if (ingError) {
        console.error('[PreciseNutrition] Erreur insertion ingrédients:', ingError.message)
        await cleanupGhostRecipe(supabase, recipeId)
        return null
      }
    }

    const totalLinked = matchedFromDb + createdNew

    // Si moins de 50% liés, résultat pas assez fiable
    if (totalLinked < aiRecipe.ingredients.length * 0.5) {
      await cleanupGhostRecipe(supabase, recipeId)
      return null
    }

    // 3. Calcul CIQUAL précis
    const { data: nutritionData, error: rpcError } = await supabase.rpc(
      'calculate_and_cache_nutrition',
      { recipe_id_param: recipeId }
    )

    if (rpcError) {
      console.error('[PreciseNutrition] Erreur RPC:', rpcError.message)
      await cleanupGhostRecipe(supabase, recipeId)
      return null
    }

    // 4. Extraire les macros — l'RPC retourne UNE SEULE LIGNE en format wide
    // (colonnes : calories_per_serving, proteines_per_serving, glucides_per_serving,
    //  lipides_per_serving, etc.) — PAS un tableau de {nutrient_name, value_per_serving}
    const row = Array.isArray(nutritionData) ? nutritionData[0] : nutritionData
    const nutrition = {}
    if (row) {
      nutrition.kcal      = Math.round(row.calories_per_serving  || 0)
      nutrition.protein_g = Math.round((row.proteines_per_serving || 0) * 10) / 10
      nutrition.carbs_g   = Math.round((row.glucides_per_serving  || 0) * 10) / 10
      nutrition.fat_g     = Math.round((row.lipides_per_serving   || 0) * 10) / 10
    }

    if (!nutrition.kcal || nutrition.kcal < 10) {
      await cleanupGhostRecipe(supabase, recipeId)
      return null
    }

    return {
      nutrition_per_serving: nutrition,
      recipe_id: recipeId,
      matched_from_db: matchedFromDb,
      matched_ingredients: matchedFromDb,  // alias attendu par app/api/ai/recipe/route.js
      created_new: createdNew,
      unresolved,
      skipped,
      total_ingredients: aiRecipe.ingredients.length,
      source: 'ciqual',
    }
  } catch (err) {
    console.error('[PreciseNutrition] Erreur:', err.message)
    await cleanupGhostRecipe(supabase, recipeId)
    return null
  }
}

/**
 * Devine la méthode de cuisson à partir des étapes de la recette.
 */
function guessCookingMethod(aiRecipe) {
  const text = [
    ...(aiRecipe.steps || []).map(s => s.instruction || ''),
    aiRecipe.title || '',
  ].join(' ').toLowerCase()

  if (text.includes('four') || text.includes('rôti') || text.includes('gratin')) return 'oven'
  if (text.includes('poêle') || text.includes('sauté') || text.includes('revenir')) return 'pan_fry'
  if (text.includes('mijoter') || text.includes('feu doux') || text.includes('cocotte')) return 'simmer'
  if (text.includes('frire') || text.includes('friture')) return 'deep_fry'
  if (text.includes('vapeur')) return 'steam'
  if (text.includes('bouill') || text.includes('eau bouillante')) return 'boil'
  if (text.includes('grill') || text.includes('plancha') || text.includes('barbecue')) return 'grill'
  return 'mixed'
}
