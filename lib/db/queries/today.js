/** Server-side assembly of the stable Today view model. */
import { listMembers } from '@/lib/domain/household/memberRepository'
import { getActiveNutritionTargets } from '@/lib/domain/household/getActiveNutritionTargets'
import { buildTodayViewModel } from '@/lib/domain/today/todayViewModel'

const addDays = (isoDate, count) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

const daysBetween = (left, right) => Math.round(
  (new Date(`${String(left).slice(0, 10)}T00:00:00Z`) - new Date(`${right}T00:00:00Z`)) / 86400000,
)

const mealSortOrder = { pdj: 1, dejeuner: 2, collation: 3, diner: 4 }

export async function getToday(supabase, date) {
  const [members, targetsByMember, planResult, logsResult, dishesResult, inventoryResult] = await Promise.all([
    listMembers(supabase),
    getActiveNutritionTargets(supabase),
    supabase
      .from('meal_plan_versions')
      .select('id, import_id, version_no, status, source, window_start, window_end, objective_scores, validation_summary, rules_version, published_at')
      .in('status', ['published', 'review_required'])
      .lte('window_start', date)
      .gte('window_end', date)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('meal_log')
      .select('household_member_id, kcal, protein_g, carbs_g, fat_g, fiber_g')
      .eq('meal_date', date),
    supabase
      .from('cooked_dishes')
      .select('id, name, portions_remaining, expiration_date, storage_method')
      .gt('portions_remaining', 0)
      .order('expiration_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit, expiration_date, adjusted_expiration_date, requires_storage_review, archetype:archetypes!inventory_lots_archetype_id_fkey(name), canonical_food:canonical_foods!inventory_lots_canonical_food_id_fkey(canonical_name), product:products!inventory_lots_product_fkey(name)')
      .gt('qty_remaining', 0),
  ])

  if (planResult.error) throw new Error(`Lecture plan actif : ${planResult.error.message}`)
  const activePlanRow = planResult.data || null
  const loggedByMember = new Map()
  for (const log of logsResult.data || []) {
    if (!log.household_member_id) continue
    const current = loggedByMember.get(log.household_member_id) || { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
    current.kcal += Number(log.kcal) || 0
    current.proteinG += Number(log.protein_g) || 0
    current.carbsG += Number(log.carbs_g) || 0
    current.fatG += Number(log.fat_g) || 0
    current.fiberG += Number(log.fiber_g) || 0
    loggedByMember.set(log.household_member_id, current)
  }

  if (dishesResult.error) throw new Error(`Lecture plats cuisinés : ${dishesResult.error.message}`)

  // Plats cuisinés : les périmés (DLC < aujourd'hui, comparaison UTC — piège #4)
  // sont exclus des restes consommables MAIS signalés explicitement, au lieu de
  // disparaître en silence (audit F02 / test H). DLC absente (legacy) = non périmé.
  // Aucune mutation automatique : le plat reste en stock jusqu'à revue utilisateur.
  const leftovers = []
  const expiredDishAlerts = []
  for (const dish of dishesResult.data || []) {
    const expiry = dish.expiration_date ? String(dish.expiration_date).slice(0, 10) : null
    if (expiry && expiry < date) {
      const portions = Number(dish.portions_remaining) || 0
      expiredDishAlerts.push({
        id: `cooked-dish-expired-${dish.id}`,
        code: 'cooked_dish_expired',
        severity: 'error',
        title: `${dish.name} · périmé (${portions} portion${portions > 1 ? 's' : ''} restante${portions > 1 ? 's' : ''}) — à retirer`,
        href: '/pantry',
        daysRemaining: daysBetween(expiry, date),
        portionsRemaining: portions,
        expirationDate: dish.expiration_date,
      })
      continue
    }
    leftovers.push({
      id: dish.id,
      name: dish.name,
      portionsRemaining: Number(dish.portions_remaining) || 0,
      expirationDate: dish.expiration_date,
      storageMethod: dish.storage_method,
    })
  }

  const inventoryAlerts = (inventoryResult.data || []).flatMap((lot) => {
    const expiry = lot.adjusted_expiration_date || lot.expiration_date
    const days = expiry ? daysBetween(expiry, date) : null
    const name = lot.product?.name || lot.canonical_food?.canonical_name || lot.archetype?.name || 'Produit'
    if (lot.requires_storage_review) {
      return [{
        id: `storage-${lot.id}`, code: 'storage_review_required', severity: 'warning',
        title: `Rangement à vérifier · ${name}`, href: '/pantry', daysRemaining: days,
      }]
    }
    if (days == null || days > 3) return []
    return [{
      id: `expiry-${lot.id}`,
      code: days < 0 ? 'inventory_expired' : 'inventory_expiring',
      severity: days < 0 ? 'error' : 'warning',
      title: days < 0 ? `${name} est arrivé à échéance` : `${name} · ${days === 0 ? "aujourd'hui" : `J-${days}`}`,
      href: '/pantry',
      daysRemaining: days,
      quantity: Number(lot.qty_remaining),
      unit: lot.unit,
    }]
  })

  let slots = []
  let tasks = []
  let issues = []
  let dataQuality = []
  let shoppingRows = []
  let activePlan = null

  if (activePlanRow) {
    const [slotsResult, tasksResult, issuesResult, qualityResult, shoppingResult] = await Promise.all([
      supabase
        .from('meal_plan_slots')
        .select('id, slot_key, meal_date, meal_type, title, servings, status, source, nutrition_by_member, nutrition_total, preparation, stock_summary, recipe_execution_id')
        .eq('plan_version_id', activePlanRow.id)
        .eq('meal_date', date),
      supabase
        .from('nutrition_plan_prep_tasks')
        .select('id, task, prep_label, done, stable_key, task_type, workflow_status, earliest_start_at, due_at, safety_deadline_at, duration_min, priority, instructions_json, meal_plan_slot_id')
        .eq('plan_version_id', activePlanRow.id)
        .eq('prep_date', date),
      supabase
        .from('meal_plan_validation_issues')
        .select('id, slot_id, severity, code, message, details, resolved_at')
        .eq('plan_version_id', activePlanRow.id)
        .is('resolved_at', null),
      supabase
        .from('data_quality_issues')
        .select('id, entity_type, entity_id, issue_code, severity, status, details')
        .eq('plan_version_id', activePlanRow.id)
        .eq('status', 'open'),
      supabase
        .from('nutrition_plan_shopping_items')
        .select('id, category, product_name, quantity, purchase_qty, purchase_unit, needed_by, checked, shopping_status, aisle_order')
        .eq('plan_version_id', activePlanRow.id)
        .eq('checked', false)
        .order('aisle_order')
        .limit(20),
    ])
    for (const result of [slotsResult, tasksResult, issuesResult, qualityResult, shoppingResult]) {
      if (result.error) throw new Error(`Assemblage Aujourd'hui : ${result.error.message}`)
    }
    slots = slotsResult.data || []
    tasks = (tasksResult.data || []).map((task) => ({
      id: task.id,
      key: task.stable_key,
      title: task.task,
      label: task.prep_label,
      type: task.task_type,
      status: task.done ? 'done' : task.workflow_status,
      earliestStartAt: task.earliest_start_at,
      dueAt: task.due_at,
      safetyDeadlineAt: task.safety_deadline_at,
      durationMinutes: task.duration_min,
      priority: task.priority,
      instructions: task.instructions_json || [],
      href: `/planning/${activePlanRow.import_id}/batch`,
    }))
    issues = (issuesResult.data || []).map((issue) => ({
      id: issue.id,
      code: issue.code,
      severity: issue.severity,
      title: issue.message,
      details: issue.details,
      href: '/planning',
      resolved: Boolean(issue.resolved_at),
    }))
    dataQuality = qualityResult.data || []
    shoppingRows = shoppingResult.data || []
    activePlan = {
      id: activePlanRow.id,
      importId: activePlanRow.import_id,
      version: activePlanRow.version_no,
      status: activePlanRow.status,
      source: activePlanRow.source,
      windowStart: activePlanRow.window_start,
      windowEnd: activePlanRow.window_end,
      objectiveScores: activePlanRow.objective_scores,
      validationSummary: activePlanRow.validation_summary,
      rulesVersion: activePlanRow.rules_version,
    }
  } else {
    const { data: fallbackImport } = await supabase
      .from('nutrition_plan_imports')
      .select('id, date_range_start, date_range_end')
      .lte('date_range_start', date)
      .gte('date_range_end', date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (fallbackImport) {
      const [mealsResult, shoppingResult] = await Promise.all([
        supabase.from('nutrition_plan_meals').select('id, meal_date, meal_type, description, kcal, protein_g, carbs_g, fat_g, fiber_g').eq('import_id', fallbackImport.id).eq('meal_date', date),
        supabase.from('nutrition_plan_shopping_items').select('id, category, product_name, quantity, checked').eq('import_id', fallbackImport.id).eq('checked', false).limit(20),
      ])
      const uniqueMeals = new Map()
      for (const meal of mealsResult.data || []) {
        const key = `${meal.meal_date}-${meal.meal_type}-${meal.description}`
        if (!uniqueMeals.has(key)) uniqueMeals.set(key, meal)
      }
      slots = [...uniqueMeals.values()].map((meal) => ({
        ...meal, title: meal.description, status: 'planned', source: 'legacy',
        nutrition_total: { kcal: meal.kcal, proteinG: meal.protein_g, carbsG: meal.carbs_g, fatG: meal.fat_g, fiberG: meal.fiber_g },
      }))
      shoppingRows = shoppingResult.data || []
      activePlan = { id: null, importId: fallbackImport.id, status: 'legacy', source: 'legacy', windowStart: fallbackImport.date_range_start, windowEnd: fallbackImport.date_range_end }
    }
  }

  const meals = slots.map((slot) => ({
    id: slot.id,
    key: slot.slot_key || `${slot.meal_date}-${slot.meal_type}`,
    type: slot.meal_type,
    title: slot.title,
    servings: Number(slot.servings) || null,
    status: slot.status,
    source: slot.source,
    href: slot.preparation?.href || '/planning',
    nutrition: slot.nutrition_total || {},
    nutritionByMember: slot.nutrition_by_member || {},
    stockSummary: slot.stock_summary || {},
    sensory: slot.preparation?.sensory || null,
    recipeCode: slot.preparation?.recipe_code || null,
    sortOrder: mealSortOrder[slot.meal_type] || 99,
  }))
  const shortageAlerts = meals
    .filter((meal) => Number.isFinite(Number(meal.stockSummary?.coverage)) && Number(meal.stockSummary.coverage) < 1)
    .map((meal) => ({
      id: `shortage-${meal.id}`,
      code: 'meal_requires_shopping', severity: 'info',
      title: `${meal.title} · ingrédients à acheter`, href: '/courses',
    }))
  const shopping = {
    requiredCount: shoppingRows.length,
    items: shoppingRows.map((item) => ({
      id: item.id,
      category: item.category,
      name: item.product_name,
      displayQuantity: item.quantity,
      purchaseQuantity: item.purchase_qty,
      purchaseUnit: item.purchase_unit,
      neededBy: item.needed_by,
      status: item.shopping_status || 'needed',
    })),
  }

  return buildTodayViewModel({
    date,
    activePlan,
    members: members.filter((member) => member.active !== false),
    targetsByMember,
    loggedByMember,
    alerts: [...issues, ...inventoryAlerts, ...expiredDishAlerts, ...shortageAlerts],
    tasks,
    meals,
    leftovers,
    shopping,
    dataQuality,
  })
}
