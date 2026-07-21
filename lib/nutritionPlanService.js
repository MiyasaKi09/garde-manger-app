/**
 * Service CRUD Supabase pour les tables nutrition_plan_*.
 * Utilisé côté serveur (API routes) et côté client (pages).
 */
import { computeWeekReadiness, expectedMealCountForWindow } from '@/lib/domain/planning/readiness'

/**
 * Crée un import et insère toutes les données parsées.
 */
export async function createImport(supabase, userId, parsedData) {
  const { meta, meals, dailyTotals, batchRecipes, prepTasks, shoppingItems, rawJson } = parsedData

  // 1. Créer l'import
  const { data: importRow, error: importErr } = await supabase
    .from('nutrition_plan_imports')
    .insert({
      user_id: userId,
      file_name: meta.fileName || 'import.json',
      month_label: meta.monthLabel || null,
      date_range_start: meta.dateRangeStart || null,
      date_range_end: meta.dateRangeEnd || null,
      raw_json: rawJson || null
    })
    .select('id')
    .single()

  if (importErr) throw new Error(`Erreur création import: ${importErr.message}`)
  const importId = importRow.id

  // 2. Bulk insert meals
  if (meals.length > 0) {
    const mealRows = meals.map(m => ({ import_id: importId, ...m }))
    const { error } = await supabase.from('nutrition_plan_meals').insert(mealRows)
    if (error) throw new Error(`Erreur insertion meals: ${error.message}`)
  }

  // 3. Bulk insert daily totals
  if (dailyTotals.length > 0) {
    const totalRows = dailyTotals.map(t => ({ import_id: importId, ...t }))
    const { error } = await supabase.from('nutrition_plan_daily_totals').insert(totalRows)
    if (error) throw new Error(`Erreur insertion totals: ${error.message}`)
  }

  // 4. Bulk insert batch recipes
  if (batchRecipes.length > 0) {
    const recipeRows = batchRecipes.map(r => ({ import_id: importId, ...r }))
    const { error } = await supabase.from('nutrition_plan_batch_recipes').insert(recipeRows)
    if (error) throw new Error(`Erreur insertion recipes: ${error.message}`)
  }

  // 5. Bulk insert prep tasks
  if (prepTasks.length > 0) {
    const taskRows = prepTasks.map(t => ({ import_id: importId, ...t }))
    const { error } = await supabase.from('nutrition_plan_prep_tasks').insert(taskRows)
    if (error) throw new Error(`Erreur insertion prep tasks: ${error.message}`)
  }

  // 6. Bulk insert shopping items
  if (shoppingItems.length > 0) {
    const itemRows = shoppingItems.map(i => ({ import_id: importId, ...i }))
    const { error } = await supabase.from('nutrition_plan_shopping_items').insert(itemRows)
    if (error) throw new Error(`Erreur insertion shopping: ${error.message}`)
  }

  return {
    importId,
    summary: {
      meals: meals.length,
      dailyTotals: dailyTotals.length,
      batchRecipes: batchRecipes.length,
      prepTasks: prepTasks.length,
      shoppingItems: shoppingItems.length
    }
  }
}

/**
 * Liste tous les imports de l'utilisateur.
 */
export async function listImports(supabase) {
  const { data, error } = await supabase
    .from('nutrition_plan_imports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erreur liste imports: ${error.message}`)
  return data
}

/**
 * Agrège les repas en totaux journaliers par personne — même forme que les
 * lignes de `nutrition_plan_daily_totals` (meal_date, person_name, kcal,
 * protein_g, carbs_g, fat_g, fiber_g, validated).
 *
 * Utilisé quand la table daily_totals est vide (plans écrits par la Routine) ;
 * les imports xlsx gardent leur chemin actuel. Fonction pure — testée dans
 * tests/dailyTotalsAggregation.test.js.
 *
 * Arrondis : kcal à l'entier, macros à 1 décimale (convention CIQUAL du projet).
 * `validated` (« dans la cible ») : |kcal − target_calories| ≤ 10 % de la cible,
 * calculé seulement si un objectif existe pour la personne — sinon omis.
 *
 * @param {object[]} meals — lignes nutrition_plan_meals (meal_date, person_name, kcal, protein_g, carbs_g, fat_g, fiber_g)
 * @param {object[]} goals — lignes user_health_goals (person_name, target_calories)
 */
export function aggregateDailyTotals(meals = [], goals = []) {
  const targetByPerson = new Map()
  for (const g of goals || []) {
    const target = Number(g?.target_calories)
    if (g?.person_name && Number.isFinite(target) && target > 0) {
      targetByPerson.set(g.person_name, target)
    }
  }

  const acc = new Map()
  for (const m of meals || []) {
    if (!m?.meal_date || !m?.person_name) continue
    const key = `${m.meal_date}|${m.person_name}`
    if (!acc.has(key)) {
      acc.set(key, {
        meal_date: m.meal_date,
        person_name: m.person_name,
        kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
        fiber_g: null, // null tant qu'aucun repas ne renseigne les fibres
      })
    }
    const t = acc.get(key)
    t.kcal += Number(m.kcal) || 0
    t.protein_g += Number(m.protein_g) || 0
    t.carbs_g += Number(m.carbs_g) || 0
    t.fat_g += Number(m.fat_g) || 0
    if (m.fiber_g != null) t.fiber_g = (t.fiber_g || 0) + (Number(m.fiber_g) || 0)
  }

  const round1 = v => Math.round(v * 10) / 10
  return [...acc.values()]
    .sort((a, b) =>
      a.meal_date.localeCompare(b.meal_date) ||
      a.person_name.localeCompare(b.person_name))
    .map(t => {
      const row = {
        meal_date: t.meal_date,
        person_name: t.person_name,
        kcal: Math.round(t.kcal),
        protein_g: round1(t.protein_g),
        carbs_g: round1(t.carbs_g),
        fat_g: round1(t.fat_g),
        fiber_g: t.fiber_g == null ? null : round1(t.fiber_g),
        computed: true, // distingue des lignes persistées en base
      }
      const target = targetByPerson.get(t.person_name)
      if (target) row.validated = Math.abs(t.kcal - target) <= target * 0.1
      return row
    })
}

/**
 * Récupère toutes les données d'un import.
 */
export async function getImport(supabase, importId) {
  const [
    { data: importData, error: e1 },
    { data: meals, error: e2 },
    { data: dailyTotals, error: e3 },
    { data: batchRecipes, error: e4 },
    { data: prepTasks, error: e5 },
    { data: shoppingItems, error: e6 }
  ] = await Promise.all([
    supabase.from('nutrition_plan_imports').select('*').eq('id', importId).single(),
    supabase.from('nutrition_plan_meals').select('*').eq('import_id', importId).order('meal_date'),
    supabase.from('nutrition_plan_daily_totals').select('*').eq('import_id', importId).order('meal_date'),
    supabase.from('nutrition_plan_batch_recipes').select('*').eq('import_id', importId),
    supabase.from('nutrition_plan_prep_tasks').select('*').eq('import_id', importId).order('prep_date'),
    supabase.from('nutrition_plan_shopping_items').select('*').eq('import_id', importId).order('id')
  ])

  if (e1) throw new Error(`Import non trouvé: ${e1.message}`)

  const activeVersionId = importData?.active_plan_version_id || null
  const [{ data: activeVersion }, { data: householdMembers }] = await Promise.all([
    activeVersionId
      ? supabase.from('meal_plan_versions').select('id, status, validation_summary, rules_version, published_at').eq('id', activeVersionId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('household_members').select('id, name, active, preferences').eq('active', true).order('created_at'),
  ])

  // Les plans canoniques antérieurs aux affectations personnalisées portent
  // la fiche sur le créneau commun. On enrichit les lignes par personne pour
  // qu'elles ouvrent immédiatement cette fiche, sans repli fuzzy ni faux 404.
  const slotIds = [...new Set((meals || []).map((meal) => meal.meal_plan_slot_id).filter(Boolean))]
  let slotById = new Map()
  if (slotIds.length) {
    const { data: slots } = await supabase
      .from('meal_plan_slots')
      .select('id, recipe_execution_id, preparation')
      .in('id', slotIds)
    slotById = new Map((slots || []).map((slot) => [slot.id, slot]))
  }
  const effectiveMeals = (meals || []).map((meal) => {
    const slot = slotById.get(meal.meal_plan_slot_id)
    const code = meal.canonical_recipe_code || slot?.preparation?.recipe_code || null
    return {
      ...meal,
      canonical_recipe_code: code,
      canonical_recipe_execution_id: meal.canonical_recipe_execution_id || slot?.recipe_execution_id || null,
      recipe_href: code ? `/recipes/canonical/${code}` : null,
    }
  })

  // La Routine n'écrit pas nutrition_plan_daily_totals : quand la table est
  // vide pour cet import, on calcule les totaux/jour/personne par agrégation
  // des repas (la page « par personne » fonctionne aussi pour ces plans).
  let effectiveTotals = dailyTotals || []
  if (!effectiveTotals.length && effectiveMeals.length) {
    let goals = []
    try {
      // RLS scope la lecture à l'utilisateur courant — best-effort : sans
      // objectifs, les totaux sortent simplement sans flag `validated`.
      const { data: goalRows } = await supabase
        .from('user_health_goals')
        .select('person_name, target_calories')
      goals = goalRows || []
    } catch { /* validated omis */ }
    effectiveTotals = aggregateDailyTotals(effectiveMeals, goals)
  }

  const activePrepTasks = activeVersionId
    ? (prepTasks || []).filter((task) => task.plan_version_id === activeVersionId)
    : (prepTasks || [])
  const activeShoppingItems = activeVersionId
    ? (shoppingItems || []).filter((item) => item.plan_version_id === activeVersionId || item.checked)
    : (shoppingItems || [])
  const start = new Date(`${importData.date_range_start}T00:00:00Z`)
  const end = new Date(`${importData.date_range_end}T00:00:00Z`)
  const dayCount = Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    ? 0
    : Math.max(0, Math.floor((end - start) / 86_400_000) + 1)
  const expectedMeals = expectedMealCountForWindow(householdMembers || [], dayCount)
  const uniqueMealCount = new Set(effectiveMeals.map((meal) => `${meal.meal_date}|${meal.meal_type}|${meal.household_member_id || meal.person_name}`)).size
  const readiness = computeWeekReadiness({
    expectedMeals,
    uniqueMealCount,
    prepTaskCount: activePrepTasks.length,
    planStatus: activeVersion?.status || null,
    validationStatus: activeVersion?.validation_summary?.status || null,
  })

  return {
    import: importData,
    meals: effectiveMeals,
    dailyTotals: effectiveTotals,
    batchRecipes: batchRecipes || [],
    prepTasks: activePrepTasks,
    shoppingItems: activeShoppingItems,
    householdMembers: householdMembers || [],
    activePlanVersion: activeVersion || null,
    readiness: { ...readiness, expectedMeals, uniqueMealCount, dayCount },
    canonicalPreparationCount: activePrepTasks.filter((task) => ['prepare_recipe', 'prepare_recipe_variant', 'prepare_support'].includes(task.task_type)).length,
  }
}

/**
 * Supprime un import (cascade delete).
 */
export async function deleteImport(supabase, importId) {
  const { error } = await supabase
    .from('nutrition_plan_imports')
    .delete()
    .eq('id', importId)

  if (error) throw new Error(`Erreur suppression: ${error.message}`)
}

/**
 * Met à jour le statut checked d'un item de courses.
 */
export async function toggleShoppingItem(supabase, itemId, checked) {
  const { error } = await supabase
    .from('nutrition_plan_shopping_items')
    .update({ checked })
    .eq('id', itemId)

  if (error) throw new Error(`Erreur toggle: ${error.message}`)
}

/**
 * Met à jour un repas (swap de plat).
 */
export async function updateMeal(supabase, importId, mealDate, mealType, personName, newData) {
  const { error } = await supabase
    .from('nutrition_plan_meals')
    .update({
      description: newData.description,
      kcal: newData.kcal ?? null,
      protein_g: newData.protein_g ?? null,
      carbs_g: newData.carbs_g ?? null,
      fat_g: newData.fat_g ?? null,
      fiber_g: newData.fiber_g ?? null,
    })
    .eq('import_id', importId)
    .eq('meal_date', mealDate)
    .eq('meal_type', mealType)
    .eq('person_name', personName)

  if (error) throw new Error(`Erreur update meal: ${error.message}`)
}

/**
 * Ajoute des items à la liste de courses d'un import.
 */
export async function addShoppingItems(supabase, importId, items) {
  if (!items.length) return
  const rows = items.map(i => ({
    import_id: importId,
    week_label: i.week_label || 'S1',
    category: i.category || null,
    product_name: i.product,
    quantity: i.quantity || null,
    checked: false,
  }))
  const { error } = await supabase
    .from('nutrition_plan_shopping_items')
    .insert(rows)
  if (error) throw new Error(`Erreur ajout courses: ${error.message}`)
}

/**
 * Supprime des items de la liste de courses par nom de produit (non cochés uniquement).
 */
export async function removeShoppingItems(supabase, importId, productNames) {
  if (!productNames.length) return
  const { error } = await supabase
    .from('nutrition_plan_shopping_items')
    .delete()
    .eq('import_id', importId)
    .eq('checked', false)
    .in('product_name', productNames)
  if (error) throw new Error(`Erreur suppression courses: ${error.message}`)
}
