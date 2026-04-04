import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import { createImport } from '@/lib/nutritionPlanService'
import { parseJsonPlan } from '@/lib/jsonPlanParser'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'
import { buildAiContext, formatContextForPrompt } from '@/lib/aiContextBuilder'

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
      console.log(`[Plan Generate] ${savedCount}/${plan.recipes.length} recettes sauvegardées`)
    }

    // ── Generate complete recipe cards for dishes missing steps ──
    const generatedCount = await generateMissingRecipes(supabase, user.id, plan.days || [])
    if (generatedCount > 0) {
      console.log(`[Plan Generate] ${generatedCount} fiches recettes générées via Claude`)
    }

    // ── Rebuild shopping list from REAL recipe ingredients - stock ──
    const shoppingCount = await rebuildShoppingList(supabase, user.id, result.importId, plan.days || [])
    console.log(`[Plan Generate] Liste de courses recalculée: ${shoppingCount} articles`)

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
    const normalized = normalizeRecipeName(recipe.name)
    if (!normalized) continue

    // Check if already exists
    const { data: existing } = await supabase
      .from('generated_recipes')
      .select('id, steps')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    // Skip if already saved WITH steps
    if (existing?.length > 0 && existing[0].steps?.length > 0) continue

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
 */
async function rebuildShoppingList(supabase, userId, importId, days) {
  // 1. Collect unique dish names from the plan (dej + din only, not pdj/col which are fixed)
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
        // Only count once per day per dish (batch = same dish, counted once)
        break // j is enough to count the dish once
      }
    }
  }

  // Count how many DAYS each dish appears (for batch sizing)
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

  // 2. Get recipe ingredients from the database
  const allIngredients = [] // { name, quantity, unit }
  for (const [norm, { name, count }] of dishNames) {
    const { data } = await supabase
      .from('generated_recipes')
      .select('ingredients, servings')
      .eq('user_id', userId)
      .eq('name_normalized', norm)
      .limit(1)

    if (!data?.length || !data[0].ingredients?.length) continue

    const recipe = data[0]
    const recipeServings = recipe.servings || 2
    // A batch serves 2 days (count=2) with 2 people = recipe ingredients × 1
    // A single day dish (count=1) with 2 people = recipe ingredients × 1
    // (recipes are already sized for 2 servings)
    // If batch spans 2 days, ingredients are for the full batch already
    const multiplier = count > recipeServings ? Math.ceil(count / recipeServings) : 1

    for (const ing of recipe.ingredients) {
      if (!ing.name) continue
      allIngredients.push({
        name: ing.name,
        quantity: (ing.quantity || 0) * multiplier,
        unit: ing.unit || '',
      })
    }
  }

  // 3. Add fixed ingredients (PDJ skyr + oeufs, collations)
  // Count days in the plan
  const numDays = days.length
  allIngredients.push(
    { name: 'Skyr', quantity: 200 * numDays + 200 * Math.ceil(numDays * 4 / 7), unit: 'g' }, // Julien PDJ + ~4 collations/week
    { name: 'Oeufs', quantity: 3 * numDays + Math.ceil(numDays * 3 / 7) * 2, unit: 'pièces' }, // 3/jour PDJ + ~3 collations oeufs/sem
    { name: 'Amandes', quantity: 30 * numDays, unit: 'g' }, // collations
  )

  // 4. Aggregate by ingredient name (merge quantities)
  const aggregated = new Map() // lowercase name → { name, totalQty, unit }
  for (const ing of allIngredients) {
    const key = ing.name.toLowerCase().trim()
    if (!aggregated.has(key)) {
      aggregated.set(key, { name: ing.name, totalQty: 0, unit: ing.unit })
    }
    aggregated.get(key).totalQty += ing.quantity || 0
  }

  // 5. Get current stock
  const { data: stockData } = await supabase
    .from('inventory_lots')
    .select(`qty_remaining, unit, archetype:archetypes(name), canonical_food:canonical_foods(canonical_name), product:products(name)`)
    .eq('user_id', userId)
    .gt('qty_remaining', 0)

  const stock = new Map() // lowercase name → qty
  for (const lot of (stockData || [])) {
    const name = (lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || '').toLowerCase()
    if (!name) continue
    stock.set(name, (stock.get(name) || 0) + (lot.qty_remaining || 0))
  }

  // 6. Calculate what's needed (ingredients - stock)
  const shoppingItems = []
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

  for (const [key, { name, totalQty, unit }] of aggregated) {
    if (totalQty <= 0) continue

    // Check stock
    const inStock = stock.get(key) || 0
    const needed = Math.max(0, totalQty - inStock)
    if (needed <= 0) continue

    // Guess category
    let category = 'Épicerie'
    for (const [keyword, cat] of Object.entries(CATEGORIES)) {
      if (key.includes(keyword)) { category = cat; break }
    }

    const qtyStr = needed > 0 ? `${Math.round(needed)}${unit ? ' ' + unit : ''}` : null
    const note = inStock > 0 ? `${Math.round(inStock)}${unit ? ' ' + unit : ''} en stock` : null

    shoppingItems.push({
      import_id: importId,
      week_label: 'S1',
      category,
      product_name: name,
      quantity: note ? `${qtyStr} (${note})` : qtyStr,
      checked: false,
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

  // 2. Check which ones are missing steps in the cache
  const toGenerate = []
  for (const name of dishNames) {
    const normalized = normalizeRecipeName(name)
    if (!normalized) continue

    const { data: existing } = await supabase
      .from('generated_recipes')
      .select('id, steps')
      .eq('user_id', userId)
      .eq('name_normalized', normalized)
      .limit(1)

    if (existing?.length > 0 && existing[0].steps?.length > 0) continue
    toGenerate.push({ name, normalized, existingId: existing?.[0]?.id || null })
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
      console.log(`[Plan Generate] Fiche recette générée: "${name}"`)
    } catch (err) {
      console.warn(`[Plan Generate] Erreur génération recette "${name}":`, err.message)
    }
  }

  return generated
}
