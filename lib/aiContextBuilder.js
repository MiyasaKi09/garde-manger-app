/**
 * Construit le contexte IA à partir des données Supabase.
 * Inclut : inventaire, goals, plan actuel, recettes connues (avec ratings),
 * historique des repas récents (pour la variété), et saison.
 */

// Produits de saison en France métropolitaine
const SEASONAL_PRODUCE = {
  1:  'poireau, chou, endive, mâche, céleri-rave, navet, topinambour, potimarron, clémentine, kiwi, pomme, poire, orange',
  2:  'poireau, chou, endive, mâche, céleri-rave, navet, topinambour, clémentine, kiwi, pomme, poire, orange',
  3:  'poireau, chou, épinard, radis, asperge, pomme, kiwi, orange, pamplemousse',
  4:  'asperge, radis, épinard, petit pois, artichaut, carotte nouvelle, fraise, rhubarbe',
  5:  'asperge, petit pois, fève, artichaut, radis, laitue, fraise, cerise, rhubarbe',
  6:  'courgette, aubergine, tomate, poivron, haricot vert, concombre, fraise, cerise, abricot, pêche, framboise',
  7:  'courgette, aubergine, tomate, poivron, haricot vert, concombre, melon, pastèque, pêche, abricot, nectarine, framboise, myrtille',
  8:  'courgette, aubergine, tomate, poivron, haricot vert, concombre, melon, pastèque, figue, pêche, prune, mirabelle, mûre',
  9:  'courgette, aubergine, tomate, poivron, raisin, figue, prune, poire, pomme, cèpe, girolle',
  10: 'courge, potimarron, butternut, champignon, cèpe, châtaigne, coing, poire, pomme, raisin, noix',
  11: 'courge, potimarron, chou, poireau, endive, topinambour, châtaigne, pomme, poire, clémentine, kaki',
  12: 'chou, poireau, endive, mâche, céleri-rave, topinambour, clémentine, orange, kiwi, pomme, poire',
}

/**
 * Récupère et structure le contexte complet pour Claude.
 */
export async function buildAiContext(supabase, userId) {
  const [inventory, goals, currentPlan, knownRecipes, recentMeals] = await Promise.all([
    fetchInventory(supabase, userId),
    fetchHealthGoals(supabase, userId),
    fetchCurrentWeekPlan(supabase, userId),
    fetchKnownRecipes(supabase, userId),
    fetchRecentMeals(supabase, userId),
  ])

  const month = new Date().getMonth() + 1
  const season = SEASONAL_PRODUCE[month] || ''

  return { inventory, goals, currentPlan, knownRecipes, recentMeals, season }
}

/**
 * Formate le contexte en texte pour le system prompt.
 */
export function formatContextForPrompt(ctx) {
  const parts = []

  // Date + saison
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  parts.push(`Aujourd'hui : ${dateStr}`)
  if (ctx.season) {
    parts.push(`\nPRODUITS DE SAISON (${today.toLocaleDateString('fr-FR', { month: 'long' })}) :\n${ctx.season}`)
  }

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
        else if (i.days_until_expiry <= 3) line += ` (⚠️ ${i.days_until_expiry}j)`
        else line += ` (${i.days_until_expiry}j)`
      }
      if (i.storage) line += ` [${i.storage}]`
      return line
    })
    parts.push(`\nINVENTAIRE (${ctx.inventory.length} items) :\n${lines.join('\n')}`)
  }

  // Objectifs nutritionnels
  if (ctx.goals.length > 0) {
    const goalLines = ctx.goals.map(g =>
      `- ${g.person_name} : ${g.target_calories} kcal, ${g.target_protein_g}g prot, ${g.target_carbs_g}g gluc, ${g.target_fat_g}g lip${g.target_fiber_g ? ', ' + g.target_fiber_g + 'g fibres' : ''}${g.target_weight_kg ? ' (objectif: ' + g.target_weight_kg + 'kg)' : ''}`
    )
    parts.push(`\nOBJECTIFS NUTRITIONNELS :\n${goalLines.join('\n')}`)
  }

  // Planning en cours
  if (ctx.currentPlan.meals.length > 0) {
    const mealsByDate = {}
    for (const m of ctx.currentPlan.meals) {
      if (!mealsByDate[m.meal_date]) mealsByDate[m.meal_date] = []
      mealsByDate[m.meal_date].push(`  ${m.meal_type} (${m.person_name}): ${m.description}${m.kcal ? ' [' + m.kcal + ' kcal]' : ''}`)
    }
    const planLines = Object.entries(mealsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, meals]) => {
        const d = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        return `${d} :\n${meals.join('\n')}`
      })
    parts.push(`\nPLANNING SEMAINE EN COURS :\n${planLines.join('\n')}`)
  }

  // Recettes déjà connues (avec ratings)
  if (ctx.knownRecipes.length > 0) {
    const lines = ctx.knownRecipes.map(r => {
      let line = `- "${r.title}"`
      if (r.rating) line += ` [${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}]`
      if (r.cook_count) line += ` (cuisiné ${r.cook_count}x)`
      if (r.prep_min || r.cook_min) line += ` (${(r.prep_min || 0) + (r.cook_min || 0)}min)`
      return line
    })
    parts.push(`\nRECETTES DÉJÀ ENREGISTRÉES (${ctx.knownRecipes.length}) :\n${lines.join('\n')}`)
  }

  // Repas récents (pour éviter les répétitions)
  if (ctx.recentMeals.length > 0) {
    const uniqueDescs = [...new Set(ctx.recentMeals.map(m => m.description).filter(Boolean))]
    if (uniqueDescs.length > 0) {
      parts.push(`\nREPAS DES 14 DERNIERS JOURS (à varier) :\n${uniqueDescs.map(d => `- ${d}`).join('\n')}`)
    }
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

  return data.map(lot => ({
    name: lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || 'Inconnu',
    qty: lot.qty_remaining,
    unit: lot.unit,
    storage: lot.storage_method,
    days_until_expiry: lot.expiration_date
      ? Math.ceil((new Date(lot.expiration_date) - new Date()) / 86400000)
      : null,
  }))
}

async function fetchHealthGoals(supabase, userId) {
  const { data } = await supabase
    .from('user_health_goals')
    .select('*')
    .eq('user_id', userId)
  return data || []
}

async function fetchCurrentWeekPlan(supabase, userId) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const { data: imports } = await supabase
    .from('nutrition_plan_imports')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!imports?.length) return { meals: [] }

  const { data: meals } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_date, meal_type, person_name, description, kcal, protein_g, carbs_g, fat_g')
    .eq('import_id', imports[0].id)
    .gte('meal_date', monday.toISOString().split('T')[0])
    .lte('meal_date', sunday.toISOString().split('T')[0])
    .order('meal_date')

  return { importId: imports[0].id, meals: meals || [] }
}

async function fetchKnownRecipes(supabase, userId) {
  // Fetch from generated_recipes cache (AI-generated + rated)
  const { data } = await supabase
    .from('generated_recipes')
    .select('title, name_normalized, prep_min, cook_min, rating, cook_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  return data || []
}

async function fetchRecentMeals(supabase, userId) {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const { data } = await supabase
    .from('nutrition_plan_meals')
    .select('description, meal_date, meal_type')
    .gte('meal_date', twoWeeksAgo.toISOString().split('T')[0])
    .order('meal_date', { ascending: false })
    .limit(100)

  return data || []
}
