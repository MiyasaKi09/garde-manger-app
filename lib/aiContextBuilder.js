/**
 * Construit le contexte IA à partir des données Supabase.
 * Inclut : inventaire, goals, plan actuel, recettes connues (avec ratings),
 * historique des repas récents (pour la variété), saison,
 * restes à consommer (cooked_dishes), contraintes alimentaires
 * (user_allergies + user_diets), profil de goûts (ratings + meal_log 30j),
 * bilan nutritionnel réel 7j et micronutriments vs AJR ANSES.
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
  const [inventory, goals, currentPlan, knownRecipes, recentMeals, leftovers, dietary, mealLog] = await Promise.all([
    fetchInventory(supabase, userId),
    fetchHealthGoals(supabase, userId),
    fetchCurrentWeekPlan(supabase, userId),
    fetchKnownRecipes(supabase, userId),
    fetchRecentMeals(supabase, userId),
    fetchLeftovers(supabase, userId),
    fetchDietaryConstraints(supabase, userId),
    fetchMealLog(supabase, userId),
  ])

  const month = new Date().getMonth() + 1
  const season = SEASONAL_PRODUCE[month] || ''

  return {
    inventory, goals, currentPlan, knownRecipes, recentMeals, season,
    leftovers,
    allergies: dietary.allergies,
    diets: dietary.diets,
    mealLog,
  }
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
    parts.push('\nINVENTAIRE : Vide — tous les ingrédients devront être achetés. Propose quand même un planning complet et mets TOUT dans la liste de courses.')
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
    parts.push(`\n→ Complète la liste de courses avec TOUT ce qui manque par rapport aux recettes proposées (déduis les quantités en stock).`)

    // Anti-gaspillage : produits ⚠️ ≤ 3j à placer sur les 2 premiers jours
    const urgentItems = ctx.inventory
      .filter(i => i.days_until_expiry !== null && i.days_until_expiry >= 0 && i.days_until_expiry <= 3)
      .map(i => i.name)
    if (urgentItems.length > 0) {
      parts.push(`\n→ ANTI-GASPILLAGE (impératif) : chaque produit marqué ⚠️ (≤ 3 jours avant DLC) DOIT apparaître dans une recette des 2 PREMIERS JOURS du planning : ${urgentItems.join(', ')}.`)
    }
  }

  // Restes à consommer (plats déjà cuisinés, portions restantes)
  const leftovers = ctx.leftovers || []
  if (leftovers.length > 0) {
    const lines = leftovers.map(l => {
      let line = `- ${l.name} : ${l.portions} portion${l.portions > 1 ? 's' : ''}`
      if (l.days_until_expiry !== null) {
        if (l.days_until_expiry === 0) line += ' (DLC AUJOURD\'HUI)'
        else if (l.days_until_expiry <= 3) line += ` (⚠️ DLC dans ${l.days_until_expiry}j)`
        else line += ` (DLC dans ${l.days_until_expiry}j)`
      }
      if (l.kcal_per_portion) {
        line += ` [~${Math.round(l.kcal_per_portion)} kcal/portion${l.protein_g_per_portion ? ', ' + Math.round(l.protein_g_per_portion) + 'g prot' : ''}]`
      }
      if (l.storage) line += ` [${l.storage}]`
      return line
    })
    parts.push(`\nRESTES À PLACER EN PRIORITÉ (avant leur DLC) :\n${lines.join('\n')}
→ CONSIGNE : planifie ces restes sur les PREMIERS JOURS du planning, AVANT leur DLC (règle FIFO : le plus ancien d'abord). Un repas couvert par un reste = le reste tel quel (pas de nouvelle recette pour ce créneau), avec ses macros par portion comptées dans le total du jour.`)
  }

  // Contraintes alimentaires strictes (allergies + régimes)
  const allergies = ctx.allergies || []
  const diets = ctx.diets || []
  if (allergies.length > 0 || diets.length > 0) {
    const constraintLines = []
    if (allergies.length > 0) {
      constraintLines.push(`- Allergies / intolérances : ${allergies.join(', ')} → AUCUN plat, sauce, garniture ou sous-ingrédient ne doit en contenir, sous aucune forme.`)
    }
    if (diets.length > 0) {
      constraintLines.push(`- Régimes suivis : ${diets.join(', ')} → TOUS les plats proposés doivent les respecter.`)
    }
    parts.push(`\nCONTRAINTES ALIMENTAIRES STRICTES (zéro tolérance, priment sur toute autre règle) :\n${constraintLines.join('\n')}`)
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

  // Profil de goûts (ratings des recettes + fréquence réelle meal_log 30j)
  const tasteProfile = buildTasteProfile(ctx.knownRecipes || [], ctx.mealLog || [])
  if (tasteProfile.liked.length || tasteProfile.disliked.length || tasteProfile.frequent.length) {
    const tasteLines = []
    if (tasteProfile.liked.length) {
      tasteLines.push(`Plats AIMÉS (note ≥ 4/5) — à privilégier et à décliner :\n${tasteProfile.liked.map(t => `  - ${t}`).join('\n')}`)
    }
    if (tasteProfile.disliked.length) {
      tasteLines.push(`Plats À ÉVITER (note ≤ 2/5) — ne JAMAIS les reproposer :\n${tasteProfile.disliked.map(t => `  - ${t}`).join('\n')}`)
    }
    if (tasteProfile.frequent.length) {
      tasteLines.push(`Plats les plus souvent mangés ces 30 derniers jours (= appréciés en pratique) :\n${tasteProfile.frequent.map(f => `  - ${f.description} (${f.count}x)`).join('\n')}`)
    }
    parts.push(`\nPROFIL DE GOÛTS :\n${tasteLines.join('\n')}`)
  }

  // Bilan nutritionnel réel des 7 derniers jours vs objectifs
  const gaps = computeNutritionGaps(ctx.mealLog || [], ctx.goals || [])
  if (gaps.length > 0) {
    parts.push(`\nÉCARTS RÉCENTS À CORRIGER (réel mangé vs objectifs, moyenne/jour sur les 7 derniers jours) :\n${gaps.map(g => `- ${g}`).join('\n')}
→ Oriente le planning de la semaine pour CORRIGER ces écarts (ex. déficit en protéines → portions protéiques renforcées).`)
  }

  // Micronutriments < 70 % des AJR (si meal_log.micronutrients renseigné)
  const microAlerts = computeMicroGaps(ctx.mealLog || [], ctx.goals || [])
  if (microAlerts.length > 0) {
    parts.push(`\nMICRONUTRIMENTS SOUS 70 % DES AJR ANSES (7 derniers jours) :\n${microAlerts.map(a => `- ${a}`).join('\n')}
→ Choisis des plats qui comblent spécifiquement ces déficits cette semaine.`)
  }

  return parts.join('\n')
}

// --- Agrégations dérivées (goûts, écarts nutritionnels, micronutriments) ---

/**
 * Croise les ratings des recettes générées et la fréquence réelle des plats
 * mangés (meal_log 30j) pour produire un profil de goûts.
 */
function buildTasteProfile(knownRecipes, mealLog) {
  const liked = knownRecipes
    .filter(r => r.rating != null && r.rating >= 4)
    .map(r => `"${r.title}" [${r.rating}/5${r.cook_count ? `, cuisiné ${r.cook_count}x` : ''}]`)
    .slice(0, 25)

  const disliked = knownRecipes
    .filter(r => r.rating != null && r.rating <= 2)
    .map(r => `"${r.title}" [${r.rating}/5]`)
    .slice(0, 25)

  // Fréquence des plats réellement mangés (meal_log 30j) : ≥2 occurrences = apprécié
  const counts = new Map()
  for (const m of mealLog) {
    const desc = (m.description || '').trim()
    if (!desc) continue
    const key = desc.toLowerCase()
    if (!counts.has(key)) counts.set(key, { description: desc, count: 0 })
    counts.get(key).count++
  }
  const frequent = [...counts.values()]
    .filter(c => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return { liked, disliked, frequent }
}

/**
 * Agrège le meal_log des 7 derniers jours par personne (moyenne/jour) et
 * compare aux cibles user_health_goals. Retourne des phrases prêtes pour le prompt.
 */
function computeNutritionGaps(mealLog, goals) {
  if (!mealLog.length || !goals.length) return []

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const byPerson = new Map()

  for (const m of mealLog) {
    if (!m.meal_date || String(m.meal_date) < sevenDaysAgo) continue
    const person = m.person_name || 'Inconnu'
    if (!byPerson.has(person)) {
      byPerson.set(person, { days: new Set(), kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })
    }
    const acc = byPerson.get(person)
    acc.days.add(String(m.meal_date))
    acc.kcal += Number(m.kcal) || 0
    acc.protein_g += Number(m.protein_g) || 0
    acc.carbs_g += Number(m.carbs_g) || 0
    acc.fat_g += Number(m.fat_g) || 0
    acc.fiber_g += Number(m.fiber_g) || 0
  }

  const lines = []
  for (const [person, acc] of byPerson) {
    const goal = goals.find(g => g.person_name === person)
    if (!goal) continue
    const nDays = acc.days.size
    if (nDays < 3) continue // trop peu de données pour conclure

    const deltas = []
    const checks = [
      { label: 'kcal', avg: acc.kcal / nDays, target: Number(goal.target_calories), unit: 'kcal', threshold: 0.05, action: ['alléger les portions', 'augmenter les portions'] },
      { label: 'protéines', avg: acc.protein_g / nDays, target: Number(goal.target_protein_g), unit: 'g', threshold: 0.10, action: ['réduire légèrement', 'renforcer les protéines'] },
      { label: 'glucides', avg: acc.carbs_g / nDays, target: Number(goal.target_carbs_g), unit: 'g', threshold: 0.10, action: ['réduire les féculents', 'augmenter les féculents'] },
      { label: 'lipides', avg: acc.fat_g / nDays, target: Number(goal.target_fat_g), unit: 'g', threshold: 0.10, action: ['alléger en matières grasses', 'autoriser un peu plus de gras'] },
      { label: 'fibres', avg: acc.fiber_g / nDays, target: Number(goal.target_fiber_g), unit: 'g', threshold: 0.15, action: ['', 'plus de légumes et légumineuses'] },
    ]

    for (const c of checks) {
      if (!c.target || isNaN(c.target)) continue
      const delta = c.avg - c.target
      if (Math.abs(delta) / c.target <= c.threshold) continue
      const sign = delta > 0 ? '+' : '−'
      const action = delta > 0 ? c.action[0] : c.action[1]
      if (!action) continue
      deltas.push(`${sign}${Math.round(Math.abs(delta))} ${c.unit === 'kcal' ? 'kcal' : c.unit + ' de ' + c.label}/j → ${action}`)
    }

    if (deltas.length > 0) {
      lines.push(`${person} (${nDays}j de données) : ${deltas.join(' ; ')}`)
    } else {
      lines.push(`${person} (${nDays}j de données) : dans la cible ✓`)
    }
  }

  return lines
}

// AJR ANSES adultes (références journalières)
const MICRO_AJR = {
  fer_mg:        { label: 'fer',                  unit: 'mg', male: 11,  female: 16 },
  calcium_mg:    { label: 'calcium',              unit: 'mg', male: 950, female: 950 },
  magnesium_mg:  { label: 'magnésium',            unit: 'mg', male: 380, female: 300 },
  zinc_mg:       { label: 'zinc',                 unit: 'mg', male: 11,  female: 8 },
  iode_ug:       { label: 'iode',                 unit: 'µg', male: 150, female: 150 },
  b9_ug:         { label: 'vitamine B9 (folates)', unit: 'µg', male: 330, female: 330 },
  b12_ug:        { label: 'vitamine B12',         unit: 'µg', male: 4,   female: 4 },
  vitamine_d_ug: { label: 'vitamine D',           unit: 'µg', male: 15,  female: 15 },
  omega3_g:      { label: 'oméga-3 (EPA+DHA)',    unit: 'g',  male: 0.5, female: 0.5 },
}

/** Normalise une clé de micronutriment du JSONB meal_log.micronutrients vers MICRO_AJR. */
function normalizeMicroKey(key) {
  const k = String(key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  if (k.includes('omega') || k.includes('epadha')) return 'omega3_g'
  if (k.includes('fer') || k.includes('iron')) return 'fer_mg'
  if (k.includes('calcium')) return 'calcium_mg'
  if (k.includes('magnesium')) return 'magnesium_mg'
  if (k.includes('zinc')) return 'zinc_mg'
  if (k.includes('iode') || k.includes('iodine')) return 'iode_ug'
  if (k.includes('b9') || k.includes('folate')) return 'b9_ug'
  if (k.includes('b12') || k.includes('cobalamin')) return 'b12_ug'
  if (k.includes('vitamined') || k.includes('vitd') || k === 'd') return 'vitamine_d_ug'
  return null
}

/**
 * Agrège meal_log.micronutrients (jsonb) sur 7 jours par personne et signale
 * les micros < 70 % des AJR ANSES. Arrondi 2 décimales (convention micros).
 */
function computeMicroGaps(mealLog, goals) {
  if (!mealLog.length) return []

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const byPerson = new Map()

  for (const m of mealLog) {
    if (!m.meal_date || String(m.meal_date) < sevenDaysAgo) continue
    if (!m.micronutrients || typeof m.micronutrients !== 'object') continue
    const person = m.person_name || 'Inconnu'
    if (!byPerson.has(person)) byPerson.set(person, { days: new Set(), totals: {} })
    const acc = byPerson.get(person)
    acc.days.add(String(m.meal_date))
    for (const [rawKey, rawVal] of Object.entries(m.micronutrients)) {
      const key = normalizeMicroKey(rawKey)
      const val = Number(rawVal)
      if (!key || isNaN(val)) continue
      acc.totals[key] = (acc.totals[key] || 0) + val
    }
  }

  const lines = []
  for (const [person, acc] of byPerson) {
    const nDays = acc.days.size
    if (nDays < 3 || !Object.keys(acc.totals).length) continue

    const goal = (goals || []).find(g => g.person_name === person)
    const isFemale = String(goal?.sex || '').toLowerCase().startsWith('f')

    const deficits = []
    for (const [key, total] of Object.entries(acc.totals)) {
      const ref = MICRO_AJR[key]
      if (!ref) continue
      const ajr = isFemale ? ref.female : ref.male
      const avgPerDay = total / nDays
      const pct = (avgPerDay / ajr) * 100
      if (pct < 70) {
        deficits.push(`${ref.label} (${Math.round(pct)} % des AJR, ${Math.round(avgPerDay * 100) / 100} ${ref.unit}/j vs ${ajr} ${ref.unit})`)
      }
    }
    if (deficits.length > 0) {
      lines.push(`${person} : ${deficits.join(' ; ')}`)
    }
  }

  return lines
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
      ? Math.round((new Date(String(lot.expiration_date).split('T')[0]) - new Date(new Date().toISOString().split('T')[0])) / 86400000)
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

/**
 * Restes à consommer : plats cuisinés (cooked_dishes) avec portions restantes,
 * non terminés et non périmés. DLC comparée en UTC (piège timezone).
 */
async function fetchLeftovers(supabase, userId) {
  const todayUTC = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('cooked_dishes')
    .select('name, portions_remaining, expiration_date, storage_method, kcal_per_portion, protein_g_per_portion, carbs_g_per_portion, fat_g_per_portion')
    .eq('user_id', userId)
    .gt('portions_remaining', 0)
    .is('consumed_completely_at', null)
    .order('expiration_date', { ascending: true, nullsFirst: false })

  if (error || !data) return []

  return data
    .filter(d => !d.expiration_date || String(d.expiration_date).split('T')[0] >= todayUTC)
    .map(d => ({
      name: d.name,
      portions: d.portions_remaining,
      storage: d.storage_method,
      kcal_per_portion: d.kcal_per_portion,
      protein_g_per_portion: d.protein_g_per_portion,
      days_until_expiry: d.expiration_date
        ? Math.round((new Date(String(d.expiration_date).split('T')[0]) - new Date(todayUTC)) / 86400000)
        : null,
    }))
}

/**
 * Allergies (user_allergies → canonical_foods) et régimes (user_diets → diets).
 * Exporté : aussi utilisé par les routes routine pour transmettre les
 * contraintes aux Routines claude.ai.
 */
export async function fetchDietaryConstraints(supabase, userId) {
  const [allergyRes, dietRes] = await Promise.all([
    supabase
      .from('user_allergies')
      .select('canonical_food:canonical_foods(canonical_name)')
      .eq('user_id', userId),
    supabase
      .from('user_diets')
      .select('diet:diets(name)')
      .eq('user_id', userId),
  ])

  const allergies = (!allergyRes.error && allergyRes.data)
    ? allergyRes.data.map(r => r.canonical_food?.canonical_name).filter(Boolean)
    : []
  const diets = (!dietRes.error && dietRes.data)
    ? dietRes.data.map(r => r.diet?.name).filter(Boolean)
    : []

  return { allergies, diets }
}

/**
 * Formate les contraintes alimentaires en une phrase compacte (pour les
 * payloads webhook des Routines claude.ai).
 */
export function formatDietaryConstraints({ allergies = [], diets = [] } = {}) {
  const parts = []
  if (allergies.length) parts.push(`Allergies strictes (aucune trace, aucun sous-ingrédient) : ${allergies.join(', ')}.`)
  if (diets.length) parts.push(`Régimes à respecter : ${diets.join(', ')}.`)
  return parts.join(' ')
}

/**
 * Journal des repas réellement mangés (meal_log) sur 30 jours.
 * Sert au profil de goûts (30j) et au bilan nutritionnel/micros (7j).
 */
async function fetchMealLog(supabase, userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('meal_log')
    .select('person_name, meal_date, meal_type, description, kcal, protein_g, carbs_g, fat_g, fiber_g, micronutrients')
    .eq('user_id', userId)
    .gte('meal_date', thirtyDaysAgo)
    .order('meal_date', { ascending: false })
    .limit(500)

  if (error || !data) return []
  return data
}
