import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { createImport } from '@/lib/nutritionPlanService'
import { parseJsonPlan } from '@/lib/jsonPlanParser'
import { normalizeRecipeName, cleanRecipeName, cleanIngredientName } from '@/lib/recipeNormalizer'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'
import { matchIngredient } from '@/lib/ingredientMatcher'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/ai/plan/generate
 * 1. Saves the plan to nutrition_plan_* tables
 * 2. Auto-saves all unique recipes to generated_recipes (for future reuse)
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { plan } = body
  if (!plan?.days?.length) {
    return NextResponse.json({ error: 'Plan invalide : "days" requis' }, { status: 400 })
  }

  try {
    const jsonString = JSON.stringify(plan)
    const parsed = parseJsonPlan(jsonString, `myko-ai-${new Date().toISOString().slice(0, 10)}.json`)
    parsed.meta.fileName = `Planning Myko IA - ${plan.label || new Date().toLocaleDateString('fr-FR')}`

    const result = await createImport(supabase, user.id, {
      ...parsed,
      rawJson: jsonString,
    })

    // ── Auto-save recipes to generated_recipes (with steps from cooking data) ──
    if (plan.recipes?.length) {
      const savedCount = await autoSaveRecipes(supabase, user.id, plan.recipes, plan.days || [])
    }

    // ── Generate complete recipe cards for dishes missing steps ──
    await generateMissingRecipes(supabase, user.id, plan.days || [])

    // ── Rebuild shopping list from REAL recipe ingredients - stock ──
    await rebuildShoppingList(supabase, user.id, result.importId, plan.days || [])

    return NextResponse.json({
      success: true,
      importId: result.importId,
      summary: result.summary,
    })
  } catch (err) {
    console.error('[AI Plan Generate] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur sauvegarde du plan' },
      { status: 500 }
    )
  }
}

/**
 * Save all recipes from the plan to generated_recipes with COMPLETE data
 * (ingredients + steps extracted from cooking data in days).
 * Skips recipes that already exist with steps. Updates those without steps.
 */
async function autoSaveRecipes(supabase, userId, recipes, days) {
  let saved = 0

  // Build a map of cooking steps from all days (dinner + prep)
  const cookingStepsMap = buildCookingStepsMap(days)

  for (const recipe of recipes) {
    const cleanName = cleanRecipeName(recipe.name)
    const normalized = normalizeRecipeName(cleanName || recipe.name)
    if (!normalized) continue

    // Check if already exists — exact match first
    let existing = null
    const { data: exactMatch } = await supabase
      .from('generated_recipes')
      .select('id, steps, name_normalized')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    if (exactMatch?.length) {
      existing = exactMatch[0]
    } else {
      // Fuzzy match: find recipes whose normalized name contains ours or vice versa
      const { data: allRecipes } = await supabase
        .from('generated_recipes')
        .select('id, steps, name_normalized, title')
        .eq('user_id', userId)
        .ilike('name_normalized', `%${normalized.split('-').slice(0, 3).join('-')}%`)
        .limit(10)

      if (allRecipes?.length) {
        const normTokens = new Set(normalized.split('-').filter(t => t.length >= 3))
        let bestMatch = null, bestScore = 0
        for (const r of allRecipes) {
          const rTokens = r.name_normalized.split('-').filter(t => t.length >= 3)
          if (!rTokens.length) continue
          const overlap = rTokens.filter(t => normTokens.has(t)).length
          const score = overlap / Math.max(normTokens.size, rTokens.length)
          if (score > bestScore && score >= 0.7) {
            bestScore = score
            bestMatch = r
          }
        }
        if (bestMatch) existing = bestMatch
      }
    }

    // Skip if already saved WITH steps
    if (existing && existing.steps?.length > 0) continue

    // Parse ingredients from string to array if needed
    let ingredients = []
    if (typeof recipe.ingredients === 'string') {
      ingredients = recipe.ingredients.split(',').map(s => {
        const trimmed = s.trim()
        const match = trimmed.match(/^(\d+[.,]?\d*)\s*(g|kg|ml|L|cl)?\s*(.+)$/)
        if (match) return { quantity: parseFloat(match[1]), unit: match[2] || '', name: match[3].trim() }
        return { name: trimmed, quantity: null, unit: '' }
      })
    } else if (Array.isArray(recipe.ingredients)) {
      ingredients = recipe.ingredients
    }

    // Parse macros
    let nutrition = null
    if (recipe.macros100g) {
      nutrition = {
        kcal: recipe.macros100g.kcal,
        protein_g: recipe.macros100g.p,
        carbs_g: recipe.macros100g.g,
        fat_g: recipe.macros100g.l,
        fiber_g: recipe.macros100g.f,
      }
    }

    // Parse timing
    let prep_min = null, cook_min = null
    if (recipe.timing) {
      const actifMatch = (recipe.timing.actif || '').match(/(\d+)/)
      const totalMatch = (recipe.timing.total || '').match(/(\d+)/)
      if (actifMatch) prep_min = parseInt(actifMatch[1])
      if (totalMatch) cook_min = Math.max(0, parseInt(totalMatch[1]) - (prep_min || 0))
    }

    // Extract steps from cooking data — match by recipe name
    const steps = findStepsForRecipe(recipe.name, cookingStepsMap)

    // Build description from recipe data
    const description = [
      recipe.rendement ? `Rendement: ${recipe.rendement}` : null,
      recipe.portions ? `Portions — J: ${recipe.portions.j}, Z: ${recipe.portions.z}` : null,
      recipe.jour2 ? `Jour 2: ${recipe.jour2}` : null,
    ].filter(Boolean).join('. ')

    const recipeData = {
      user_id: userId,
      name_normalized: normalized,
      title: recipe.name,
      description: description || null,
      servings: 2,
      prep_min,
      cook_min,
      ingredients,
      steps,
      chef_tips: recipe.jour2 ? `Variation jour 2 : ${recipe.jour2}` : null,
      nutrition_per_serving: nutrition,
      source: 'plan',
    }

    if (existing?.length > 0) {
      // Update existing entry that had empty steps
      const { error } = await supabase
        .from('generated_recipes')
        .update({
          ingredients,
          steps,
          description: recipeData.description,
          chef_tips: recipeData.chef_tips,
          prep_min,
          cook_min,
          nutrition_per_serving: nutrition,
        })
        .eq('id', existing[0].id)
      if (!error) saved++
    } else {
      // Insert new
      const { error } = await supabase
        .from('generated_recipes')
        .insert(recipeData)
      if (!error) saved++
    }
  }

  return saved
}

/**
 * Builds a map of recipe name → cooking steps from all days in the plan.
 * Extracts from cooking.dinner and cooking.prep.
 */
function buildCookingStepsMap(days) {
  const map = {} // normalized name → steps array

  for (const day of (days || [])) {
    const cooking = day.cooking
    if (!cooking) continue

    // Dinner steps
    if (cooking.dinner?.steps?.length && cooking.dinner.name) {
      const key = normalizeRecipeName(cooking.dinner.name)
      if (key && !map[key]) {
        map[key] = cooking.dinner.steps.map((s, i) => ({
          step_no: i + 1,
          instruction: `${s.action}: ${s.detail}`,
          duration_min: parseDuration(s.duration),
        }))
      }
    }

    // Prep steps (for batch cooking)
    if (cooking.prep?.steps?.length && cooking.prep.for) {
      const prepName = cooking.prep.for
      const key = normalizeRecipeName(prepName)
      if (key && !map[key]) {
        map[key] = cooking.prep.steps.map((s, i) => ({
          step_no: i + 1,
          instruction: `${s.action}: ${s.detail}`,
          duration_min: parseDuration(s.duration),
        }))
      }
    }
  }

  return map
}

/**
 * Find cooking steps that match a recipe name.
 * Tries exact match first, then fuzzy (recipe name contained in cooking name or vice versa).
 */
function findStepsForRecipe(recipeName, stepsMap) {
  const normalized = normalizeRecipeName(recipeName)
  if (!normalized) return []

  // Exact match
  if (stepsMap[normalized]) return stepsMap[normalized]

  // Fuzzy: check if any cooking name contains the recipe name or vice versa
  for (const [key, steps] of Object.entries(stepsMap)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return steps
    }
  }

  // No match found — steps will be empty, but the recipe API will regenerate on first cook
  return []
}

/**
 * Parse duration string like "5min", "15 min" → number
 */
function parseDuration(str) {
  if (!str) return null
  const match = String(str).match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

/**
 * Rebuild the shopping list from REAL recipe ingredients in the database,
 * deducting what's available in stock. Replaces Claude's guessed groceries.
 *
 * Linking strategy:
 *   1. For each recipe, try generated_recipe_ingredients (linked IDs) first.
 *      Fall back to generated_recipes.ingredients (raw JSONB) if none linked yet.
 *   2. Aggregate by canonical_food_id (resolves variants: Charlotte+Monalisa → Pomme de terre).
 *   3. Deduct stock using inventory_lots_resolved.resolved_canonical_food_id (ID-based, not string).
 *   4. Store canonical_food_id + archetype_id on shopping items for reliable add-to-stock later.
 */
async function rebuildShoppingList(supabase, userId, importId, days) {
  // 1. Collect unique dish names from the plan (dej + din only)
  const dishNames = new Map() // normalized → { name, count }
  for (const day of days) {
    for (const mealKey of ['dej', 'din']) {
      const meal = day[mealKey]
      if (!meal) continue
      for (const personKey of ['j', 'z']) {
        const desc = meal[personKey]?.desc
        if (!desc) continue
        const colonIdx = desc.indexOf(':')
        const name = colonIdx > 0 && colonIdx < 60 ? desc.substring(0, colonIdx).trim() : desc.trim()
        if (name.length <= 3) continue
        const norm = normalizeRecipeName(name)
        if (!norm) continue
        if (!dishNames.has(norm)) {
          dishNames.set(norm, { name, count: 0 })
        }
        break // count the dish once per meal slot
      }
    }
  }
  for (const day of days) {
    for (const mealKey of ['dej', 'din']) {
      const meal = day[mealKey]
      if (!meal) continue
      const desc = meal.j?.desc || meal.z?.desc
      if (!desc) continue
      const colonIdx = desc.indexOf(':')
      const name = colonIdx > 0 && colonIdx < 60 ? desc.substring(0, colonIdx).trim() : desc.trim()
      const norm = normalizeRecipeName(name)
      if (norm && dishNames.has(norm)) {
        dishNames.get(norm).count++
      }
    }
  }

  // 2. Collect ingredients with IDs from each recipe
  // allIngredients: { canonicalFoodId, archetypeId, canonicalName, archetypeName, quantity, unit }
  const allIngredients = []
  for (const [norm, { name, count }] of dishNames) {
    const { data: recipeRows } = await supabase
      .from('generated_recipes')
      .select('id, ingredients, servings')
      .eq('user_id', userId)
      .eq('name_normalized', norm)
      .limit(1)

    if (!recipeRows?.length) continue
    const recipe = recipeRows[0]
    const recipeServings = recipe.servings || 2
    const multiplier = count > recipeServings ? Math.ceil(count / recipeServings) : 1

    // Try linked ingredients first
    const { data: linked } = await supabase
      .from('generated_recipe_ingredients')
      .select(`
        raw_name, quantity, unit, canonical_food_id, archetype_id,
        archetype:archetypes(name, canonical_food_id),
        canonical_food:canonical_foods(canonical_name)
      `)
      .eq('generated_recipe_id', recipe.id)
      .neq('match_status', 'unmatched')

    if (linked?.length) {
      for (const ing of linked) {
        const cfId = ing.canonical_food_id ?? ing.archetype?.canonical_food_id ?? null
        const cfName = ing.canonical_food?.canonical_name ?? ing.archetype?.name ?? ing.raw_name
        allIngredients.push({
          canonicalFoodId: cfId,
          archetypeId: ing.archetype_id ?? null,
          canonicalName: cfName,
          archetypeName: ing.archetype?.name ?? null,
          quantity: (ing.quantity || 0) * multiplier,
          unit: ing.unit || '',
        })
      }
    } else {
      // Fallback: raw JSONB ingredients — resolve IDs via matcher
      for (const ing of (recipe.ingredients || [])) {
        if (!ing.name) continue
        const cleanName = cleanIngredientName(ing.name)
        const match = await matchIngredient(supabase, cleanName)
        allIngredients.push({
          canonicalFoodId: match.canonicalFoodId,
          archetypeId: match.archetypeId,
          canonicalName: match.matchedName || cleanName,
          archetypeName: null,
          rawName: cleanName,
          quantity: (ing.quantity || 0) * multiplier,
          unit: ing.unit || '',
        })
      }
    }
  }

  // 3. Add fixed ingredients (PDJ + collations) — resolve IDs via matcher
  const numDays = days.length
  const fixedItems = [
    { name: 'Skyr', quantity: 200 * numDays + 200 * Math.ceil(numDays * 4 / 7), unit: 'g' },
    { name: 'Oeufs', quantity: 3 * numDays + Math.ceil(numDays * 3 / 7) * 2, unit: 'pièces' },
    { name: 'Amandes', quantity: 30 * numDays, unit: 'g' },
  ]
  for (const fix of fixedItems) {
    const match = await matchIngredient(supabase, fix.name)
    allIngredients.push({
      canonicalFoodId: match.canonicalFoodId,
      archetypeId: match.archetypeId,
      canonicalName: match.matchedName || fix.name,
      archetypeName: null,
      rawName: fix.name,
      quantity: fix.quantity,
      unit: fix.unit,
    })
  }

  // 4. Aggregate by canonical_food_id (or lowercase name as fallback)
  const aggregated = new Map()
  for (const ing of allIngredients) {
    const key = ing.canonicalFoodId != null
      ? `id:${ing.canonicalFoodId}`
      : `name:${ing.canonicalName.toLowerCase().trim()}`

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        canonicalFoodId: ing.canonicalFoodId,
        archetypeId: ing.archetypeId,
        canonicalName: ing.canonicalName,
        archetypeNames: new Set(),
        rawNames: new Set(),
        totalQty: 0,
        unit: ing.unit,
      })
    }
    const agg = aggregated.get(key)
    agg.totalQty += ing.quantity || 0
    if (ing.archetypeName) agg.archetypeNames.add(ing.archetypeName)
    if (ing.rawName && ing.rawName.toLowerCase() !== agg.canonicalName.toLowerCase()) {
      agg.rawNames.add(ing.rawName)
    }
  }

  // 5. Fetch current stock by resolved_canonical_food_id (ID-based, accurate)
  const { data: stockData } = await supabase
    .from('inventory_lots_resolved')
    .select('resolved_canonical_food_id, qty_remaining, unit')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)

  const stockById = new Map() // canonical_food_id → qty
  for (const lot of (stockData || [])) {
    const cfId = lot.resolved_canonical_food_id
    if (!cfId) continue
    stockById.set(cfId, (stockById.get(cfId) || 0) + (lot.qty_remaining || 0))
  }

  // String-based stock fallback for items without canonical_food_id
  const { data: stockFallbackData } = await supabase
    .from('inventory_lots')
    .select('qty_remaining, unit, archetype:archetypes(name), canonical_food:canonical_foods(canonical_name), product:products(name)')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)

  const stockByName = new Map() // lowercase name → qty
  for (const lot of (stockFallbackData || [])) {
    const name = (lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || '').toLowerCase()
    if (!name) continue
    stockByName.set(name, (stockByName.get(name) || 0) + (lot.qty_remaining || 0))
  }

  // 6. Build shopping items
  const CATEGORIES = {
    poulet: 'Protéines', dinde: 'Protéines', boeuf: 'Protéines', porc: 'Protéines',
    saumon: 'Protéines', cabillaud: 'Protéines', saucisse: 'Protéines', steak: 'Protéines',
    viande: 'Protéines', filet: 'Protéines', jambon: 'Protéines', oeuf: 'Crémerie',
    skyr: 'Crémerie', crème: 'Crémerie', lait: 'Crémerie', fromage: 'Crémerie',
    gruyère: 'Crémerie', emmental: 'Crémerie', mozzarella: 'Crémerie', beurre: 'Crémerie',
    riz: 'Féculents', pâtes: 'Féculents', semoule: 'Féculents', pomme: 'Féculents',
    pain: 'Féculents', tortilla: 'Féculents', quinoa: 'Féculents',
    tomate: 'Légumes', oignon: 'Légumes', carotte: 'Légumes', poivron: 'Légumes',
    courgette: 'Légumes', brocoli: 'Légumes', haricot: 'Légumes', champignon: 'Légumes',
    asperge: 'Légumes', navet: 'Légumes', radis: 'Légumes', salade: 'Légumes',
    chou: 'Légumes', poireau: 'Légumes', endive: 'Légumes', concombre: 'Légumes',
    amande: 'Épicerie', noix: 'Épicerie', huile: 'Épicerie', passata: 'Conserves',
    concentré: 'Conserves', conserve: 'Conserves', lentille: 'Conserves', pois: 'Conserves',
  }

  const shoppingItems = []
  for (const [, agg] of aggregated) {
    if (agg.totalQty <= 0) continue

    const inStock = agg.canonicalFoodId != null
      ? (stockById.get(agg.canonicalFoodId) || 0)
      : (stockByName.get(agg.canonicalName.toLowerCase().trim()) || 0)

    const needed = Math.max(0, agg.totalQty - inStock)
    if (needed <= 0) continue

    const nameLower = agg.canonicalName.toLowerCase()
    let category = 'Épicerie'
    for (const [keyword, cat] of Object.entries(CATEGORIES)) {
      if (nameLower.includes(keyword)) { category = cat; break }
    }

    const qtyStr = `${Math.round(needed)}${agg.unit ? ' ' + agg.unit : ''}`
    const stockNote = inStock > 0 ? `${Math.round(inStock)}${agg.unit ? ' ' + agg.unit : ''} en stock` : null

    // Display name: prefer rawName (user-friendly), fallback to canonical
    const displayName = agg.rawNames.size === 1
      ? [...agg.rawNames][0]
      : agg.canonicalName

    // Notes: archetype variants + raw recipe names if multiple
    const noteParts = []
    if (agg.archetypeNames.size > 0) noteParts.push([...agg.archetypeNames].join(', '))
    if (agg.rawNames.size > 1) noteParts.push([...agg.rawNames].join(', '))
    const notes = noteParts.length > 0 ? noteParts.join(' · ') : null

    shoppingItems.push({
      import_id: importId,
      week_label: 'S1',
      category,
      product_name: displayName,
      quantity: stockNote ? `${qtyStr} (${stockNote})` : qtyStr,
      checked: false,
      canonical_food_id: agg.canonicalFoodId ?? null,
      archetype_id: agg.archetypeId ?? null,
      notes,
    })
  }

  // 7. Delete old shopping items and insert new ones
  await supabase
    .from('nutrition_plan_shopping_items')
    .delete()
    .eq('import_id', importId)

  if (shoppingItems.length > 0) {
    await supabase
      .from('nutrition_plan_shopping_items')
      .insert(shoppingItems)
  }

  return shoppingItems.length
}

/**
 * Extract all unique dish names from the planning days,
 * check which ones are missing complete recipes (no steps),
 * and generate them via Claude.
 */
async function generateMissingRecipes(supabase, userId, days) {
  // 1. Collect all unique dish names from dej + din
  const dishNames = new Set()
  for (const day of days) {
    for (const mealKey of ['dej', 'din']) {
      const meal = day[mealKey]
      if (!meal) continue
      // Get name from j or z description (before ":")
      for (const personKey of ['j', 'z']) {
        const desc = meal[personKey]?.desc
        if (!desc) continue
        const colonIdx = desc.indexOf(':')
        const name = colonIdx > 0 && colonIdx < 60 ? desc.substring(0, colonIdx).trim() : desc.trim()
        if (name.length > 3) dishNames.add(name)
      }
    }
  }

  if (!dishNames.size) return 0

  // 2. Check which ones are missing steps in the cache (with fuzzy dedup)
  const toGenerate = []
  for (const name of dishNames) {
    const cleanName = cleanRecipeName(name)
    const normalized = normalizeRecipeName(cleanName || name)
    if (!normalized) continue

    // Exact match
    const { data: exactMatch } = await supabase
      .from('generated_recipes')
      .select('id, steps, name_normalized')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    let existingId = null
    let hasSteps = false

    if (exactMatch?.length) {
      existingId = exactMatch[0].id
      hasSteps = exactMatch[0].steps?.length > 0
    } else {
      // Fuzzy match
      const corePrefix = normalized.split('-').slice(0, 3).join('-')
      const { data: fuzzy } = await supabase
        .from('generated_recipes')
        .select('id, steps, name_normalized')
        .eq('user_id', userId)
        .ilike('name_normalized', `%${corePrefix}%`)
        .limit(10)

      if (fuzzy?.length) {
        const normTokens = new Set(normalized.split('-').filter(t => t.length >= 3))
        for (const r of fuzzy) {
          const rTokens = r.name_normalized.split('-').filter(t => t.length >= 3)
          const overlap = rTokens.filter(t => normTokens.has(t)).length
          const score = overlap / Math.max(normTokens.size, rTokens.length)
          if (score >= 0.7) {
            existingId = r.id
            hasSteps = r.steps?.length > 0
            break
          }
        }
      }
    }

    if (hasSteps) continue
    toGenerate.push({ name: cleanName || name, normalized, existingId })
  }

  if (!toGenerate.length) return 0

  // 3. Generate each missing recipe via Claude (batch)
  let generated = 0
  const ctx = await buildAiContext(supabase, userId)
  const context = formatContextForPrompt(ctx)

  for (const { name, normalized, existingId } of toGenerate) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `Tu es Myko, un chef cuisinier expert. Génère une fiche recette complète.

${context}

RÈGLES :
- Réponds UNIQUEMENT avec du JSON valide, sans texte autour.
- Adapte pour 2 personnes (Julien + Zoé).
- Aliments interdits : thon, panais, épinards, céleri, crevettes, whey.
- Étapes détaillées avec temps précis et quantités en grammes.
- Noms d'ingrédients SIMPLES et GÉNÉRIQUES : jamais de "(pour le rougail)", "(burger)", "(minestrone)" ou référence au plat entre parenthèses. Juste le nom de l'aliment.

FORMAT JSON :
{
  "title": "Nom du plat",
  "description": "Description courte",
  "servings": 2,
  "prep_min": 15,
  "cook_min": 30,
  "ingredients": [
    { "name": "Poulet", "quantity": 500, "unit": "g", "notes": "" }
  ],
  "steps": [
    { "step_no": 1, "instruction": "Titre: Description détaillée...", "duration_min": null }
  ],
  "chef_tips": "Conseil optionnel",
  "nutrition_per_serving": { "kcal": 450, "protein_g": 35, "carbs_g": 40, "fat_g": 15, "fiber_g": 6 }
}`,
        messages: [{
          role: 'user',
          content: `Génère la fiche recette complète pour : "${name}" (2 portions, Julien et Zoé)`,
        }],
      })

      const text = response.content?.[0]?.text || ''
      let recipe = null
      try {
        recipe = JSON.parse(text)
      } catch {
        const match = text.match(/\{[\s\S]*\}/)
        if (match) recipe = JSON.parse(match[0])
      }

      if (!recipe?.steps?.length) continue

      const recipeData = {
        title: recipe.title || name,
        description: recipe.description || null,
        servings: recipe.servings || 2,
        prep_min: recipe.prep_min || null,
        cook_min: recipe.cook_min || null,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        chef_tips: recipe.chef_tips || null,
        nutrition_per_serving: recipe.nutrition_per_serving || null,
      }

      if (existingId) {
        await supabase.from('generated_recipes').update(recipeData).eq('id', existingId)
      } else {
        await supabase.from('generated_recipes').insert({
          user_id: userId,
          name_normalized: normalized,
          ...recipeData,
          source: 'plan',
        })
      }

      generated++
    } catch (err) {
      console.error(`[Plan Generate] Erreur génération recette "${name}":`, err.message)
    }
  }

  return generated
}
