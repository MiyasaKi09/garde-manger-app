/**
 * Service CRUD Supabase pour les tables nutrition_plan_*.
 * Utilisé côté serveur (API routes) et côté client (pages).
 */

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

  return {
    import: importData,
    meals: meals || [],
    dailyTotals: dailyTotals || [],
    batchRecipes: batchRecipes || [],
    prepTasks: prepTasks || [],
    shoppingItems: shoppingItems || []
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
