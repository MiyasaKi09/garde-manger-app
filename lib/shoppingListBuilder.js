/**
 * Construction de la liste de courses — déterministe, stock-aware.
 *
 * Source de vérité unique partagée par :
 *   - app/api/ai/plan/generate  (à la génération de plan, à partir de `days`)
 *   - app/api/courses/rebuild    (recalcul à la demande, à partir des repas en base)
 *
 * Principe : on agrège les ingrédients des recettes du plan AU NIVEAU CANONIQUE
 * (via generated_recipe_ingredients, peuplé par lib/ingredientResolver.js), puis
 * on DÉDUIT le stock réel (inventory_lots_resolved). La liste ne contient donc que
 * ce qui manque, exprimé avec les aliments du garde-manger (pas les noms fantaisie).
 */

import { normalizeRecipeName, cleanIngredientName } from '@/lib/recipeNormalizer'

const CATEGORIES = {
  poulet: 'Protéines', dinde: 'Protéines', boeuf: 'Protéines', porc: 'Protéines',
  saumon: 'Protéines', cabillaud: 'Protéines', saucisse: 'Protéines', steak: 'Protéines',
  viande: 'Protéines', filet: 'Protéines', jambon: 'Protéines', oeuf: 'Crémerie',
  skyr: 'Crémerie', crème: 'Crémerie', lait: 'Crémerie', fromage: 'Crémerie',
  gruyère: 'Crémerie', emmental: 'Crémerie', mozzarella: 'Crémerie', beurre: 'Crémerie',
  riz: 'Féculents', pâtes: 'Féculents', semoule: 'Féculents', pomme: 'Féculents',
  pain: 'Féculents', tortilla: 'Féculents', quinoa: 'Féculents', boulgour: 'Féculents',
  tomate: 'Légumes', oignon: 'Légumes', carotte: 'Légumes', poivron: 'Légumes',
  courgette: 'Légumes', brocoli: 'Légumes', haricot: 'Légumes', champignon: 'Légumes',
  asperge: 'Légumes', navet: 'Légumes', radis: 'Légumes', salade: 'Légumes',
  chou: 'Légumes', poireau: 'Légumes', endive: 'Légumes', concombre: 'Légumes',
  amande: 'Épicerie', noix: 'Épicerie', huile: 'Épicerie', passata: 'Conserves',
  concentré: 'Conserves', conserve: 'Conserves', lentille: 'Conserves', pois: 'Conserves',
}

/** Extrait le nom de plat d'une description ("Rougail saucisses 340g + riz" → "Rougail saucisses"). */
function dishNameFromDesc(desc) {
  if (!desc) return null
  const colonIdx = desc.indexOf(':')
  const base = colonIdx > 0 && colonIdx < 60 ? desc.substring(0, colonIdx) : desc
  // Coupe au premier nombre/quantité ("Rougail saucisses 340g" → "Rougail saucisses")
  const beforeQty = base.split(/\s+\d/)[0]
  const name = (beforeQty || base).trim()
  return name.length > 3 ? name : null
}

/**
 * Collecte les plats (dej + dîner) depuis nutrition_plan_meals d'un import.
 * @returns {{ dishNames: Map<string,{name,count}>, numDays: number }}
 */
async function collectDishNamesFromMeals(supabase, importId) {
  const { data: meals } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_date, meal_type, description')
    .eq('import_id', importId)
    .in('meal_type', ['dejeuner', 'diner'])

  const dishNames = new Map()
  const days = new Set()
  for (const m of (meals || [])) {
    if (m.meal_date) days.add(m.meal_date)
    const name = dishNameFromDesc(m.description)
    if (!name) continue
    const norm = normalizeRecipeName(name)
    if (!norm) continue
    if (!dishNames.has(norm)) dishNames.set(norm, { name, count: 0 })
    dishNames.get(norm).count++
  }
  return { dishNames, numDays: days.size || 7 }
}

/** Collecte les plats depuis la structure `days` d'un plan (dej/din, j/z). */
function collectDishNamesFromDays(days) {
  const dishNames = new Map()
  for (const day of (days || [])) {
    for (const mealKey of ['dej', 'din']) {
      const meal = day[mealKey]
      if (!meal) continue
      const desc = meal.j?.desc || meal.z?.desc
      const name = dishNameFromDesc(desc)
      if (!name) continue
      const norm = normalizeRecipeName(name)
      if (!norm) continue
      if (!dishNames.has(norm)) dishNames.set(norm, { name, count: 0 })
      dishNames.get(norm).count++
    }
  }
  return { dishNames, numDays: (days || []).length || 7 }
}

/**
 * Cœur : à partir des plats (Map normalisée), construit et REMPLACE la liste de
 * courses de l'import, en déduisant le stock. Renvoie le nombre d'articles.
 */
async function buildAndReplace(supabase, userId, importId, dishNames, numDays) {
  // 1. Ingrédients (avec IDs) de chaque recette
  const allIngredients = []
  for (const [norm, { count }] of dishNames) {
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
      for (const ing of (recipe.ingredients || [])) {
        if (!ing.name) continue
        allIngredients.push({
          canonicalFoodId: null, archetypeId: null,
          canonicalName: cleanIngredientName(ing.name), archetypeName: null,
          quantity: (ing.quantity || 0) * multiplier, unit: ing.unit || '',
        })
      }
    }
  }

  // 2. Items fixes (PDJ + collations) — pas d'IDs
  allIngredients.push(
    { canonicalFoodId: null, archetypeId: null, canonicalName: 'Skyr',    archetypeName: null, quantity: 200 * numDays + 200 * Math.ceil(numDays * 4 / 7), unit: 'g' },
    { canonicalFoodId: null, archetypeId: null, canonicalName: 'Oeufs',   archetypeName: null, quantity: 3 * numDays + Math.ceil(numDays * 3 / 7) * 2,     unit: 'pièces' },
    { canonicalFoodId: null, archetypeId: null, canonicalName: 'Amandes', archetypeName: null, quantity: 30 * numDays, unit: 'g' },
  )

  // 3. Agrégation par canonical_food_id (ou nom en repli)
  const aggregated = new Map()
  for (const ing of allIngredients) {
    const key = ing.canonicalFoodId != null
      ? `id:${ing.canonicalFoodId}`
      : `name:${ing.canonicalName.toLowerCase().trim()}`
    if (!aggregated.has(key)) {
      aggregated.set(key, {
        canonicalFoodId: ing.canonicalFoodId, archetypeId: ing.archetypeId,
        canonicalName: ing.canonicalName, archetypeNames: new Set(),
        totalQty: 0, unit: ing.unit,
      })
    }
    const agg = aggregated.get(key)
    agg.totalQty += ing.quantity || 0
    if (ing.archetypeName) agg.archetypeNames.add(ing.archetypeName)
  }

  // 4. Stock par resolved_canonical_food_id (ID-based, fiable)
  const { data: stockData } = await supabase
    .from('inventory_lots_resolved')
    .select('resolved_canonical_food_id, qty_remaining')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  const stockById = new Map()
  for (const lot of (stockData || [])) {
    const cfId = lot.resolved_canonical_food_id
    if (!cfId) continue
    stockById.set(cfId, (stockById.get(cfId) || 0) + (lot.qty_remaining || 0))
  }

  // Repli stock par nom (items sans canonical)
  const { data: stockFallback } = await supabase
    .from('inventory_lots')
    .select('qty_remaining, archetype:archetypes(name), canonical_food:canonical_foods(canonical_name), product:products(name)')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  const stockByName = new Map()
  for (const lot of (stockFallback || [])) {
    const name = (lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || '').toLowerCase()
    if (!name) continue
    stockByName.set(name, (stockByName.get(name) || 0) + (lot.qty_remaining || 0))
  }

  // 5. Construire les articles (déduits du stock)
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
    const variantNote = agg.archetypeNames.size > 0 ? [...agg.archetypeNames].join(', ') : null

    shoppingItems.push({
      import_id: importId,
      week_label: 'S1',
      category,
      product_name: agg.canonicalName,
      quantity: stockNote ? `${qtyStr} (${stockNote})` : qtyStr,
      checked: false,
      canonical_food_id: agg.canonicalFoodId ?? null,
      archetype_id: agg.archetypeId ?? null,
      notes: variantNote,
    })
  }

  // 6. Remplacer
  await supabase.from('nutrition_plan_shopping_items').delete().eq('import_id', importId)
  if (shoppingItems.length) {
    await supabase.from('nutrition_plan_shopping_items').insert(shoppingItems)
  }
  return shoppingItems.length
}

/** Recalcul depuis la structure `days` d'un plan (utilisé à la génération). */
export async function rebuildShoppingListFromDays(supabase, userId, importId, days) {
  const { dishNames, numDays } = collectDishNamesFromDays(days)
  return buildAndReplace(supabase, userId, importId, dishNames, numDays)
}

/** Recalcul à la demande depuis les repas en base (indépendant du mode de génération). */
export async function rebuildShoppingListFromImport(supabase, userId, importId) {
  const { dishNames, numDays } = await collectDishNamesFromMeals(supabase, importId)
  return buildAndReplace(supabase, userId, importId, dishNames, numDays)
}
