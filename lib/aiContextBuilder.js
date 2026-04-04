/**
 * Construit le contexte IA à partir des données Supabase.
 * Utilisé par les API routes pour injecter l'état actuel dans le system prompt.
 */

/**
 * Récupère et structure le contexte complet pour Claude.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function buildAiContext(supabase, userId) {
  const [inventory, goals, currentPlan, recipeSummary] = await Promise.all([
    fetchInventory(supabase, userId),
    fetchHealthGoals(supabase, userId),
    fetchCurrentWeekPlan(supabase, userId),
    fetchRecipeSummary(supabase),
  ])

  return { inventory, goals, currentPlan, recipeSummary }
}

/**
 * Formate le contexte en texte pour le system prompt.
 */
export function formatContextForPrompt(ctx) {
  const parts = []

  // Date
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  parts.push(`Aujourd'hui : ${today}`)

  // Inventaire
  if (ctx.inventory.length === 0) {
    parts.push('\nINVENTAIRE : Vide.')
  } else {
    const lines = ctx.inventory.map(i => {
      let line = `- ${i.name}`
      if (i.qty) line += ` : ${i.qty}${i.unit ? ' ' + i.unit : ''}`
      if (i.days_until_expiry !== null) {
        if (i.days_until_expiry < 0) line += ' (PÉRIMÉ)'
        else if (i.days_until_expiry === 0) line += ' (expire AUJOURD\'HUI)'
        else if (i.days_until_expiry <= 3) line += ` (expire dans ${i.days_until_expiry}j ⚠️)`
        else line += ` (expire dans ${i.days_until_expiry}j)`
      }
      if (i.storage) line += ` [${i.storage}]`
      return line
    })
    parts.push(`\nINVENTAIRE (${ctx.inventory.length} items) :\n${lines.join('\n')}`)
  }

  // Objectifs nutritionnels
  if (ctx.goals.length > 0) {
    const goalLines = ctx.goals.map(g =>
      `- ${g.person_name} : ${g.target_calories} kcal, ${g.target_protein_g}g prot, ${g.target_carbs_g}g gluc, ${g.target_fat_g}g lip${g.target_fiber_g ? ', ' + g.target_fiber_g + 'g fibres' : ''}${g.target_weight_kg ? ' (objectif poids: ' + g.target_weight_kg + 'kg)' : ''}`
    )
    parts.push(`\nOBJECTIFS NUTRITIONNELS :\n${goalLines.join('\n')}`)
  } else {
    parts.push('\nOBJECTIFS NUTRITIONNELS : Non définis.')
  }

  // Planning en cours
  if (ctx.currentPlan.meals.length > 0) {
    const mealsByDate = {}
    for (const m of ctx.currentPlan.meals) {
      const key = m.meal_date
      if (!mealsByDate[key]) mealsByDate[key] = []
      mealsByDate[key].push(`  ${m.meal_type} (${m.person_name}): ${m.description}${m.kcal ? ' [' + m.kcal + ' kcal]' : ''}`)
    }
    const planLines = Object.entries(mealsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, meals]) => {
        const d = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        return `${d} :\n${meals.join('\n')}`
      })
    parts.push(`\nPLANNING SEMAINE EN COURS :\n${planLines.join('\n')}`)
  }

  // Recettes disponibles (résumé compact)
  if (ctx.recipeSummary.length > 0) {
    const recipeLines = ctx.recipeSummary.map(r => {
      let line = `- ${r.name}`
      if (r.prep_time_minutes || r.cook_time_minutes) {
        const total = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0)
        line += ` (${total}min)`
      }
      if (r.tags) line += ` [${r.tags}]`
      return line
    })
    parts.push(`\nRECETTES DISPONIBLES (${ctx.recipeSummary.length}) :\n${recipeLines.join('\n')}`)
  }

  return parts.join('\n')
}

// --- Fetch helpers ---

async function fetchInventory(supabase, userId) {
  const { data, error } = await supabase
    .from('inventory_lots')
    .select(`
      id, qty_remaining, unit, storage_method, expiration_date,
      archetype:archetypes(name),
      canonical_food:canonical_foods(canonical_name),
      product:products(name)
    `)
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
    .order('expiration_date', { ascending: true, nullsFirst: false })

  if (error || !data) return []

  return data.map(lot => {
    const name = lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || 'Inconnu'
    const daysUntilExpiry = lot.expiration_date
      ? Math.ceil((new Date(lot.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    return {
      name,
      qty: lot.qty_remaining,
      unit: lot.unit,
      storage: lot.storage_method,
      days_until_expiry: daysUntilExpiry,
    }
  })
}

async function fetchHealthGoals(supabase, userId) {
  const { data, error } = await supabase
    .from('user_health_goals')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) return []
  return data
}

async function fetchCurrentWeekPlan(supabase, userId) {
  // Get the most recent import's meals for this week
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const mondayStr = monday.toISOString().split('T')[0]
  const sundayStr = sunday.toISOString().split('T')[0]

  const { data: imports } = await supabase
    .from('nutrition_plan_imports')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!imports?.length) return { meals: [] }

  const importId = imports[0].id

  const { data: meals, error } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_date, meal_type, person_name, description, kcal, protein_g, carbs_g, fat_g')
    .eq('import_id', importId)
    .gte('meal_date', mondayStr)
    .lte('meal_date', sundayStr)
    .order('meal_date')

  if (error || !meals) return { meals: [] }
  return { importId, meals }
}

async function fetchRecipeSummary(supabase) {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id, name, prep_time_minutes, cook_time_minutes, servings, cooking_method,
      recipe_tags(tag:tags(name))
    `)
    .order('name')

  if (error || !data) return []

  return data.map(r => ({
    id: r.id,
    name: r.name,
    prep_time_minutes: r.prep_time_minutes,
    cook_time_minutes: r.cook_time_minutes,
    servings: r.servings,
    tags: r.recipe_tags?.map(rt => rt.tag?.name).filter(Boolean).join(', ') || null,
  }))
}
