/**
 * Calcul nutritionnel précis pour les recettes IA.
 *
 * Après qu'une recette est générée par Claude, ce module :
 * 1. Match chaque ingrédient à un canonical_food (CIQUAL)
 * 2. Si pas trouvé, crée un canonical_food + nutritional_data à partir des macros IA
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
 * Recherche le canonical_food ou archetype correspondant à un ingrédient.
 */
async function findFoodMatch(supabase, ingredientName) {
  const normalized = normalizeIngredientName(ingredientName)
  if (!normalized) return null

  // 1. Exact match on canonical_name
  const { data: exactMatch } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, nutrition_id')
    .ilike('canonical_name', normalized)
    .limit(1)

  if (exactMatch?.length) {
    return { canonical_food_id: exactMatch[0].id, archetype_id: null }
  }

  // 2. Prefix / contains match
  const { data: fuzzyMatch } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, nutrition_id')
    .ilike('canonical_name', `%${normalized}%`)
    .limit(1)

  if (fuzzyMatch?.length) {
    return { canonical_food_id: fuzzyMatch[0].id, archetype_id: null }
  }

  // 3. Fallback: archetypes
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name')
    .ilike('name', `%${normalized}%`)
    .limit(1)

  if (archetypes?.length) {
    return { canonical_food_id: null, archetype_id: archetypes[0].id }
  }

  return null
}

/**
 * Crée un canonical_food + nutritional_data pour un ingrédient inconnu,
 * en utilisant les macros per100g fournies par l'IA.
 */
async function createFoodFromAiData(supabase, ingredientName, per100g) {
  const normalized = normalizeIngredientName(ingredientName)
  if (!normalized || !per100g) return null

  try {
    // 1. Créer l'entrée nutritional_data
    const { data: nutritionRow, error: nutErr } = await supabase
      .from('nutritional_data')
      .insert({
        source_id: `ai_${normalized.replace(/\s+/g, '_')}_${Date.now()}`,
        calories_kcal: per100g.kcal || 0,
        proteines_g: per100g.p || 0,
        glucides_g: per100g.g || 0,
        lipides_g: per100g.l || 0,
        fibres_g: per100g.f || 0,
      })
      .select('id')
      .single()

    if (nutErr || !nutritionRow) {
      console.warn(`[PreciseNutrition] Erreur création nutritional_data pour "${ingredientName}":`, nutErr?.message)
      return null
    }

    // 2. Créer le canonical_food lié
    const { data: food, error: foodErr } = await supabase
      .from('canonical_foods')
      .insert({
        canonical_name: ingredientName.trim().toLowerCase(),
        nutrition_id: nutritionRow.id,
        primary_unit: 'g',
        unit_weight_grams: 100,
      })
      .select('id')
      .single()

    if (foodErr || !food) {
      console.warn(`[PreciseNutrition] Erreur création canonical_food pour "${ingredientName}":`, foodErr?.message)
      return null
    }

    console.log(`[PreciseNutrition] Créé canonical_food "${ingredientName}" (id: ${food.id}) avec nutrition (${per100g.kcal} kcal/100g)`)
    return { canonical_food_id: food.id, archetype_id: null }
  } catch (err) {
    console.warn(`[PreciseNutrition] Erreur création food "${ingredientName}":`, err.message)
    return null
  }
}

/**
 * Convertit les unités courantes en grammes pour le calcul.
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

/**
 * Convertit une quantité en grammes pour le calcul nutritionnel.
 */
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
 * Pour les ingrédients non trouvés en base, crée automatiquement
 * une entrée canonical_food + nutritional_data à partir des macros
 * per100g fournies par l'IA.
 *
 * @param {Object} supabase - Client Supabase
 * @param {string} userId - ID utilisateur
 * @param {Object} aiRecipe - Recette générée par Claude (avec per100g par ingrédient)
 * @param {string} cookingMethod - Méthode de cuisson (optionnel)
 * @returns {Object|null} { nutrition_per_serving, recipe_id } ou null si échec
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

    // 2. Pour chaque ingrédient : chercher en base, sinon créer avec les macros IA
    let matchedFromDb = 0
    let createdFromAi = 0
    let unresolved = 0
    const ingredientRows = []

    for (const ing of aiRecipe.ingredients) {
      const quantityG = toGrams(ing.quantity || 0, ing.unit)

      // Chercher dans la base existante
      let match = await findFoodMatch(supabase, ing.name)

      if (match) {
        matchedFromDb++
      } else if (ing.per100g && ing.per100g.kcal != null) {
        // Pas trouvé en base → créer avec les données nutritionnelles de l'IA
        match = await createFoodFromAiData(supabase, ing.name, ing.per100g)
        if (match) createdFromAi++
      }

      if (match) {
        ingredientRows.push({
          recipe_id: recipeId,
          canonical_food_id: match.canonical_food_id || null,
          archetype_id: match.archetype_id || null,
          quantity: quantityG,
          unit: 'g',
          notes: null,
        })
      } else {
        unresolved++
        ingredientRows.push({
          recipe_id: recipeId,
          canonical_food_id: null,
          archetype_id: null,
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

    const totalLinked = matchedFromDb + createdFromAi
    console.log(`[PreciseNutrition] "${aiRecipe.title}": ${matchedFromDb} trouvés en base, ${createdFromAi} créés depuis IA, ${unresolved} non résolus`)

    // Si moins de 50% des ingrédients ont un lien nutritionnel, pas fiable
    if (totalLinked < aiRecipe.ingredients.length * 0.5) {
      console.warn(`[PreciseNutrition] Trop peu d'ingrédients liés (${totalLinked}/${aiRecipe.ingredients.length}), fallback estimation IA`)
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
      await supabase.from('recipes').delete().eq('id', recipeId)
      return null
    }

    // 3. Appeler le calcul CIQUAL précis
    const { data: nutritionData, error: rpcError } = await supabase.rpc(
      'calculate_and_cache_nutrition',
      { recipe_id_param: recipeId }
    )

    if (rpcError) {
      console.warn('[PreciseNutrition] Erreur RPC nutrition:', rpcError.message)
      return null
    }

    // 4. Extraire les macros du résultat
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

    // Vérifier que le calcul a produit quelque chose de sensé
    if (!nutrition.kcal || nutrition.kcal < 10) {
      console.warn('[PreciseNutrition] Calcul a produit des valeurs nulles, fallback estimation IA')
      return null
    }

    console.log(`[PreciseNutrition] Macros calculées pour "${aiRecipe.title}":`, nutrition)

    return {
      nutrition_per_serving: nutrition,
      recipe_id: recipeId,
      matched_from_db: matchedFromDb,
      created_from_ai: createdFromAi,
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
