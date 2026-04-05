/**
 * Calcul nutritionnel précis pour les recettes IA.
 *
 * Respecte la hiérarchie du modèle de données :
 *   canonical_foods → archetypes → products
 *
 * Après qu'une recette est générée par Claude, ce module :
 * 1. Match chaque ingrédient dans l'ordre : archetype → canonical_food
 * 2. Si pas trouvé, crée les entrées manquantes en respectant la hiérarchie
 * 3. Crée la recette dans `recipes` + `recipe_ingredients`
 * 4. Appelle `calculate_and_cache_nutrition()` pour un calcul exact
 * 5. Retourne les macros précises par portion
 */

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
 * Crée les entrées manquantes dans la hiérarchie pour un ingrédient inconnu.
 *
 * Logique :
 * - Si un canonical_food existe déjà (match partiel) → crée un archetype dessus
 * - Si rien n'existe → crée canonical_food + nutritional_data + archetype
 */
async function createMissingFoodEntries(supabase, ingredientName, per100g, existingCanonicalId) {
  if (!per100g || per100g.kcal == null) return null
  const cleanName = ingredientName.trim().toLowerCase()

  try {
    let canonicalFoodId = existingCanonicalId

    // Si pas de canonical existant, en créer un
    if (!canonicalFoodId) {
      // Créer nutritional_data
      const { data: nutritionRow, error: nutErr } = await supabase
        .from('nutritional_data')
        .insert({
          source_id: `ai_${normalizeIngredientName(cleanName).replace(/\s+/g, '_')}_${Date.now()}`,
          calories_kcal: per100g.kcal || 0,
          proteines_g: per100g.p || 0,
          glucides_g: per100g.g || 0,
          lipides_g: per100g.l || 0,
          fibres_g: per100g.f || 0,
        })
        .select('id')
        .single()

      if (nutErr || !nutritionRow) {
        console.warn(`[PreciseNutrition] Erreur création nutritional_data pour "${cleanName}":`, nutErr?.message)
        return null
      }

      // Créer canonical_food
      const { data: food, error: foodErr } = await supabase
        .from('canonical_foods')
        .insert({
          canonical_name: extractBaseFoodName(cleanName),
          nutrition_id: nutritionRow.id,
          primary_unit: 'g',
          unit_weight_grams: 100,
        })
        .select('id')
        .single()

      if (foodErr || !food) {
        console.warn(`[PreciseNutrition] Erreur création canonical_food pour "${cleanName}":`, foodErr?.message)
        return null
      }

      canonicalFoodId = food.id
      console.log(`[PreciseNutrition] Créé canonical_food "${extractBaseFoodName(cleanName)}" (id: ${food.id})`)
    }

    // Créer l'archetype spécifique lié au canonical
    const { data: archetype, error: archErr } = await supabase
      .from('archetypes')
      .insert({
        name: cleanName,
        canonical_food_id: canonicalFoodId,
        primary_unit: 'g',
        grams_per_unit: 100,
        is_default: !existingCanonicalId, // default si c'est un nouveau canonical
      })
      .select('id')
      .single()

    if (archErr || !archetype) {
      // L'archetype a échoué mais on a quand même le canonical
      console.warn(`[PreciseNutrition] Erreur création archetype pour "${cleanName}":`, archErr?.message)
      return {
        archetype_id: null,
        canonical_food_id: canonicalFoodId,
        source: 'created_canonical_only',
      }
    }

    console.log(`[PreciseNutrition] Créé archetype "${cleanName}" (id: ${archetype.id}) → canonical_food ${canonicalFoodId}`)

    return {
      archetype_id: archetype.id,
      canonical_food_id: canonicalFoodId,
      source: 'created_full',
    }
  } catch (err) {
    console.warn(`[PreciseNutrition] Erreur création hiérarchie pour "${cleanName}":`, err.message)
    return null
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
  switch (u) {
    case 'kg': return quantity * 1000
    case 'l': return quantity * 1000
    case 'cl': return quantity * 10
    case 'ml': return quantity
    case 'cs': return quantity * 15
    case 'cc': return quantity * 5
    case 'g': return quantity
    default: return quantity
  }
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
      console.warn('[PreciseNutrition] Erreur création recette:', recipeError?.message)
      return null
    }

    const recipeId = recipe.id

    // 2. Résoudre chaque ingrédient
    let matchedFromDb = 0
    let createdNew = 0
    let unresolved = 0
    const ingredientRows = []

    for (const ing of aiRecipe.ingredients) {
      const quantityG = toGrams(ing.quantity || 0, ing.unit)

      // Chercher dans la hiérarchie existante
      let match = await findFoodMatch(supabase, ing.name)

      if (match && !match.needsArchetype) {
        // Trouvé en base — utiliser tel quel
        matchedFromDb++
      } else if (match?.needsArchetype && ing.per100g) {
        // Base canonical trouvée mais l'ingrédient est plus spécifique → créer archetype
        const created = await createMissingFoodEntries(supabase, ing.name, ing.per100g, match.canonical_food_id)
        if (created) {
          match = created
          createdNew++
        } else {
          matchedFromDb++ // fallback sur le canonical trouvé
        }
      } else if (!match && ing.per100g && ing.per100g.kcal != null) {
        // Rien trouvé → créer canonical + archetype
        match = await createMissingFoodEntries(supabase, ing.name, ing.per100g, null)
        if (match) createdNew++
      }

      if (match) {
        ingredientRows.push({
          recipe_id: recipeId,
          archetype_id: match.archetype_id || null,
          canonical_food_id: match.canonical_food_id || null,
          quantity: quantityG,
          unit: 'g',
          notes: null,
        })
      } else {
        unresolved++
        ingredientRows.push({
          recipe_id: recipeId,
          archetype_id: null,
          canonical_food_id: null,
          quantity: quantityG,
          unit: 'g',
          notes: `Non résolu: ${ing.name}`,
        })
      }
    }

    if (ingredientRows.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientRows)

      if (ingError) {
        console.warn('[PreciseNutrition] Erreur insertion ingrédients:', ingError.message)
      }
    }

    const totalLinked = matchedFromDb + createdNew
    console.log(`[PreciseNutrition] "${aiRecipe.title}": ${matchedFromDb} en base, ${createdNew} créés, ${unresolved} non résolus`)

    // Si moins de 50% liés, pas fiable
    if (totalLinked < aiRecipe.ingredients.length * 0.5) {
      console.warn(`[PreciseNutrition] Trop peu d'ingrédients liés (${totalLinked}/${aiRecipe.ingredients.length}), fallback estimation`)
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
      await supabase.from('recipes').delete().eq('id', recipeId)
      return null
    }

    // 3. Calcul CIQUAL précis
    const { data: nutritionData, error: rpcError } = await supabase.rpc(
      'calculate_and_cache_nutrition',
      { recipe_id_param: recipeId }
    )

    if (rpcError) {
      console.warn('[PreciseNutrition] Erreur RPC nutrition:', rpcError.message)
      return null
    }

    // 4. Extraire les macros
    const nutrition = {}
    if (Array.isArray(nutritionData)) {
      for (const row of nutritionData) {
        const name = (row.nutrient_name || '').toLowerCase()
        if (name.includes('calorie')) nutrition.kcal = Math.round(row.value_per_serving || 0)
        else if (name.includes('protéine') || name.includes('proteine')) nutrition.protein_g = Math.round(row.value_per_serving || 0)
        else if (name.includes('glucide')) nutrition.carbs_g = Math.round(row.value_per_serving || 0)
        else if (name.includes('lipide')) nutrition.fat_g = Math.round(row.value_per_serving || 0)
        else if (name.includes('fibre')) nutrition.fiber_g = Math.round(row.value_per_serving || 0)
      }
    }

    if (!nutrition.kcal || nutrition.kcal < 10) {
      console.warn('[PreciseNutrition] Calcul a produit des valeurs nulles, fallback estimation IA')
      return null
    }

    console.log(`[PreciseNutrition] Macros pour "${aiRecipe.title}":`, nutrition)

    return {
      nutrition_per_serving: nutrition,
      recipe_id: recipeId,
      matched_from_db: matchedFromDb,
      created_new: createdNew,
      unresolved,
      total_ingredients: aiRecipe.ingredients.length,
      source: 'ciqual',
    }
  } catch (err) {
    console.error('[PreciseNutrition] Erreur:', err.message)
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
