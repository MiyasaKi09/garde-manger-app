import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'
import { COOKED_DISH_SHELF_LIFE } from '@/lib/shelfLifeRules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/planning/batch/generate  { importId? }
 *
 * DÉRIVATEUR déterministe du batch cooking (audit F12, Lot P3 volet B) :
 * plus AUCUN appel IA dans ce chemin — mêmes entrées, même sortie, toujours.
 *
 * 1. Chemin canonique (plans « boucle fermée ») : la version active du plan
 *    (meal_plan_versions published/review_required) a publié des
 *    planned_productions + des tâches versionnées (source='closed_loop').
 *    L'endpoint ne DÉCIDE rien : il dérive les recettes batch de ces
 *    productions (portions = planned_portions, jamais le nombre de lignes —
 *    test K/F08 ; conservation = storage_method + use_by du solveur — F13)
 *    et relie les repas via planned_consumptions.
 * 2. Repli legacy (anciens plans sans productions) : le regroupement
 *    déterministe historique MOINS l'appel IA. Les règles de conservation ne
 *    viennent JAMAIS d'une regex sur le nom du plat (F13) : sans profil
 *    validé, valeurs prudentes par défaut (72 h réfrigérateur via
 *    lib/shelfLifeRules.js, congélation non déclarée → non congelable,
 *    réchauffage générique) et conservation_source='default_conservative'.
 *
 * Idempotent par import. Ne touche JAMAIS aux tâches canoniques versionnées
 * (source='closed_loop' / plan_version_id non nul) — audit F09, régression P0-8.
 * S'exécute avec le client utilisateur → RLS = propriété.
 */

/* ───────── matching fiche recette (même logique que /api/recipes/generated) ───────── */
const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'aux', 'au', 'a', 'et', 'en',
  'l', 'd', 'un', 'une', 'sur', 'fines', 'maison', 'facon', 'fine',
  'portion', 'julien', 'zoe',
])
const tokens = (s) => normalizeRecipeName(s || '').split('-').filter(t => t.length >= 3 && !STOPWORDS.has(t))
function matchRecipe(desc, recipes) {
  const qSet = new Set(tokens(desc))
  if (!qSet.size) return null
  let best = null, bestScore = 0, bestRatio = 0
  for (const r of recipes) {
    const rt = tokens(r.name_normalized || r.title)
    if (!rt.length) continue
    const overlap = rt.filter(t => qSet.has(t)).length
    const ratio = overlap / rt.length
    if (overlap > bestScore || (overlap === bestScore && ratio > bestRatio)) {
      bestScore = overlap; bestRatio = ratio; best = r
    }
  }
  return bestScore >= 2 ? best : null
}

function dishKey(m) {
  const s = (m.short_label || '').trim()
  if (s) return s
  let d = (m.description || '').trim()
  const colon = d.indexOf(':')
  if (colon > 0 && colon < 60) d = d.slice(0, colon)
  return d.replace(/\s*\((?:portion|part)[^)]*\)\s*$/i, '').trim() || 'Plat'
}

/* ───────── dates (UTC, ISO yyyy-mm-dd) ───────── */
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const weekdayOf = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay() // 0 dim … 6 sam
const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000)
const DOW_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const frShort = (iso) => { const d = new Date(`${iso}T00:00:00Z`); return `${DOW_FR[d.getUTCDay()]} ${d.getUTCDate()}` }
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s
const frPortions = (value) => String(Math.round((Number(value) || 0) * 100) / 100).replace('.', ',')

/* ───────── conservation déterministe (F13 : jamais de regex sur le nom) ───────── */
// Sans profil validé : règle prudente de lib/shelfLifeRules.js — 3 j (72 h)
// au réfrigérateur pour un plat cuisiné maison. Congélation non déclarée →
// non congelable. Réchauffage générique (aucune inférence par nom de plat).
const DEFAULT_KEEPS_DAYS = COOKED_DISH_SHELF_LIFE.fridge
const REHEAT_GENERIC = 'Réchauffer à cœur : micro-ondes 2–3 min à couvert, ou casserole / poêle à feu doux — remuer à mi-parcours.'

// Chemin canonique : la conservation vient du procédé choisi par le solveur
// (storage_method) et de sa date limite (use_by) — profil de recette validé.
function canonicalConservation(production) {
  if (production.storage_method === 'freezer') {
    return cap(`au congélateur dès la cuisson — décongeler la veille au réfrigérateur, à consommer avant le ${frShort(production.use_by)}`)
  }
  return cap(`au réfrigérateur — à consommer avant le ${frShort(production.use_by)}`)
}

// Repli legacy : règle prudente par défaut, annoncée comme telle.
function conservativeConservation(cookDate, eats) {
  const latest = eats[eats.length - 1]
  const limit = addDays(cookDate, DEFAULT_KEEPS_DAYS)
  if (daysBetween(cookDate, latest) <= DEFAULT_KEEPS_DAYS) {
    return `Règle prudente par défaut : se garde ${DEFAULT_KEEPS_DAYS} j (72 h) au réfrigérateur`
  }
  return `Règle prudente par défaut : à consommer avant le ${frShort(limit)} — congélation non déclarée, prévoir une cuisson d'appoint pour ${frShort(latest)}`
}

/* ───────── ingrédient échelonné « 600g blanc de poulet » ───────── */
function fmtIngredient(it, factor) {
  const unit = (it.unit || '').trim()
  let qtyStr = ''
  if (it.quantity != null) {
    const q = Math.round(it.quantity * factor * 10) / 10
    qtyStr = unit && unit.length <= 3 ? `${q}${unit}` : `${q}${unit ? ' ' + unit : ''}`
  }
  return [qtyStr, it.name].filter(Boolean).join(' ').trim()
}

function instructionsFromTask(task) {
  const steps = Array.isArray(task?.instructions_json) ? task.instructions_json : []
  if (!steps.length) return null
  return steps.map((s, i) => `${i + 1}. ${s?.instruction || ''}`.trim()).join('\n') || null
}

/* ───────── nettoyage idempotent (ordre FK-safe, commun aux deux chemins) ───────── */
async function sweepPreviousBatch(supabase, importId) {
  const { error: unlinkErr } = await supabase
    .from('nutrition_plan_meals').update({ batch_recipe_id: null }).eq('import_id', importId)
  if (unlinkErr) return unlinkErr

  // On ne remplace QUE les tâches de CE générateur (source='batch') et les
  // lignes au défaut 'legacy' : la colonne `source` est NOT NULL DEFAULT
  // 'legacy' (migration 20260713134235) et des endpoints VIVANTS insèrent
  // encore des tâches sans `source` explicite (createImport via
  // lib/nutritionPlanService) — le balayage 'legacy' n'est donc PAS un
  // nettoyage one-shot historique. Les tâches canoniques versionnées
  // (source='closed_loop', plan_version_id renseigné) ne doivent JAMAIS être
  // touchées (audit F09, régression P0-8) — garde-fou supplémentaire : on ne
  // supprime rien qui soit rattaché à une version de plan.
  const { error: taskDelErr } = await supabase
    .from('nutrition_plan_prep_tasks')
    .delete()
    .eq('import_id', importId)
    .in('source', ['batch', 'legacy'])
    .is('plan_version_id', null)
  if (taskDelErr) return taskDelErr

  const { error: recipeDelErr } = await supabase
    .from('nutrition_plan_batch_recipes').delete().eq('import_id', importId)
  if (recipeDelErr) return recipeDelErr
  return null
}

/* ═════════ Chemin 1 — dérivation depuis le plan canonique (versions actives) ═════════ */
async function deriveFromCanonicalPlan(supabase, importId) {
  const { data: versions, error: vErr } = await supabase
    .from('meal_plan_versions')
    .select('id, version_no, status')
    .eq('import_id', importId)
    .in('status', ['published', 'review_required'])
    .order('version_no', { ascending: false })
    .limit(1)
  if (vErr) return { error: vErr }
  const version = versions?.[0]
  if (!version) return { productions: null }

  const { data: productions, error: pErr } = await supabase
    .from('planned_productions')
    .select('*')
    .eq('plan_version_id', version.id)
    .neq('status', 'cancelled')
    .order('production_key', { ascending: true })
  if (pErr) return { error: pErr }
  if (!productions?.length) return { productions: null }

  const { data: tasks, error: tErr } = await supabase
    .from('nutrition_plan_prep_tasks')
    .select('*')
    .eq('import_id', importId)
    .eq('plan_version_id', version.id)
    .eq('source', 'closed_loop')
    .order('id', { ascending: true })
  if (tErr) return { error: tErr }

  const { data: consumptions, error: cErr } = await supabase
    .from('planned_consumptions')
    .select('id, plan_version_id, slot_id, planned_production_id, portions')
    .eq('plan_version_id', version.id)
    .order('id', { ascending: true })
  if (cErr) return { error: cErr }

  return { version, productions, tasks: tasks || [], consumptions: consumptions || [] }
}

async function runCanonical(supabase, importId, canonical) {
  const { productions, tasks, consumptions } = canonical
  const taskById = new Map(tasks.map(t => [String(t.id), t]))

  const { data: meals, error: mealsErr } = await supabase
    .from('nutrition_plan_meals')
    .select('id, meal_plan_slot_id, planned_servings, person_name')
    .eq('import_id', importId)
    .order('id', { ascending: true })
  if (mealsErr) return NextResponse.json({ error: mealsErr.message }, { status: 500 })

  const sweepErr = await sweepPreviousBatch(supabase, importId)
  if (sweepErr) return NextResponse.json({ error: sweepErr.message }, { status: 500 })

  const slotIdsByProduction = new Map()
  for (const consumption of consumptions) {
    if (!consumption.planned_production_id || !consumption.slot_id) continue
    const key = String(consumption.planned_production_id)
    if (!slotIdsByProduction.has(key)) slotIdsByProduction.set(key, new Set())
    slotIdsByProduction.get(key).add(consumption.slot_id)
  }

  let batchCount = 0, linkedCount = 0
  const cookDatesUsed = new Set()
  const recipesOut = []

  for (const production of productions) {
    const sourceTask = production.source_task_id != null ? taskById.get(String(production.source_task_id)) : null
    const cookDate = sourceTask?.prep_date || production.available_from
    // F08/test K : portions = planned_portions du solveur, JAMAIS un nombre
    // de lignes de repas (portions_total est un entier — l'exact vit dans
    // rendement).
    const plannedPortions = Number(production.planned_portions) || 1
    const portionsTotal = Math.max(1, Math.round(plannedPortions))
    const keepsDays = Math.max(0, daysBetween(cookDate, production.use_by))
    const freezable = production.storage_method === 'freezer'

    const slotIds = [...(slotIdsByProduction.get(String(production.id)) || [])]
    const linkedMeals = slotIds.length
      ? (meals || []).filter(m => m.meal_plan_slot_id && slotIds.includes(m.meal_plan_slot_id))
      : []
    const byPerson = {}
    for (const m of linkedMeals) {
      byPerson[m.person_name] = (byPerson[m.person_name] || 0) + (Number(m.planned_servings) || 1)
    }
    const portionsLabel = Object.entries(byPerson)
      .map(([person, count]) => `${person}: ${frPortions(count)}`).join(' · ') || null

    const { data: inserted, error: insErr } = await supabase
      .from('nutrition_plan_batch_recipes')
      .insert({
        import_id: importId,
        name: production.output_name,
        cook_date: cookDate,
        portions_total: portionsTotal,
        keeps_days: keepsDays,
        freezable,
        ingredients: null,
        instructions: instructionsFromTask(sourceTask),
        reheat: REHEAT_GENERIC,
        conservation: canonicalConservation(production),
        portions: portionsLabel,
        rendement: `${frPortions(plannedPortions)} portions`,
      })
      .select('id').single()
    if (insErr || !inserted) continue
    batchCount++
    cookDatesUsed.add(cookDate)
    recipesOut.push({
      name: production.output_name,
      cook_date: cookDate,
      portions_total: portionsTotal,
      planned_portions: plannedPortions,
      freezable,
      conservation_source: 'recipe_profile',
    })

    if (linkedMeals.length) {
      const ids = linkedMeals.map(m => m.id)
      const { error: linkErr } = await supabase
        .from('nutrition_plan_meals').update({ batch_recipe_id: inserted.id }).in('id', ids)
      if (!linkErr) linkedCount += ids.length
    }
  }

  // Aucune tâche source='batch' recréée ici : la check-list du jour de
  // cuisine EST le plan canonique (tâches versionnées « Préparer X — N
  // portions » dont la validation matérialise la production, P2).
  return NextResponse.json({
    ok: true, import_id: importId,
    sessions: [...cookDatesUsed].sort(),
    batch_recipes: batchCount, linked_meals: linkedCount,
    planner: 'canonical',
    recipes: recipesOut,
  })
}

/* ═════════ Chemin 2 — repli déterministe legacy (anciens plans sans productions) ═════════ */
async function runLegacy(supabase, importId, imp, user) {
  const { data: allMeals, error: mErr } = await supabase
    .from('nutrition_plan_meals')
    .select('*')
    .eq('import_id', importId)
    .eq('meal_type', 'dejeuner')
    .order('id', { ascending: true })
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  const lunches = (allMeals || []).filter(m => { const wd = weekdayOf(m.meal_date); return wd >= 1 && wd <= 5 })
  if (!lunches.length) return NextResponse.json({ error: 'Aucun déjeuner en semaine à préparer' }, { status: 400 })

  const { data: recipes } = await supabase
    .from('generated_recipes').select('id,title,name_normalized,servings,ingredients,steps').eq('user_id', user.id)

  // Regroupement par plat + jours mangés (le regroupement par nom sert à
  // identifier LE MÊME plat sur plusieurs jours — pas à en déduire des règles
  // de conservation, F13).
  const groups = new Map() // key -> { name, meals[], eats:Set }
  for (const m of lunches) {
    const key = dishKey(m)
    if (!groups.has(key)) groups.set(key, { name: key, meals: [], eats: new Set() })
    const g = groups.get(key); g.meals.push(m); g.eats.add(m.meal_date)
  }

  const cookSunday = addDays(imp.date_range_start, -1)

  // Planification déterministe : fenêtre de fraîcheur alignée sur la règle
  // prudente (72 h) → session du dimanche pour le début de semaine, session
  // d'appoint le mercredi pour la fin de semaine. On ne cuisine jamais après
  // le premier repas du plat. Mêmes entrées → même sortie, toujours (F12).
  const FRESH = DEFAULT_KEEPS_DAYS
  const midweek = addDays(cookSunday, 3)
  const plan = new Map() // key -> { cook_date, keeps_days, freezable, conservation, reheat }
  for (const [key, g] of groups) {
    const eats = [...g.eats].sort()
    const earliest = eats[0]
    const latest = eats[eats.length - 1]
    let cookDate
    if (daysBetween(cookSunday, latest) <= FRESH) cookDate = cookSunday
    else cookDate = midweek <= earliest ? midweek : earliest
    plan.set(key, {
      cook_date: cookDate,
      keeps_days: DEFAULT_KEEPS_DAYS,
      freezable: false, // congélation non déclarée → non congelable (F13)
      conservation: conservativeConservation(cookDate, eats),
      reheat: REHEAT_GENERIC,
    })
  }

  const sweepErr = await sweepPreviousBatch(supabase, importId)
  if (sweepErr) return NextResponse.json({ error: sweepErr.message }, { status: 500 })

  let batchCount = 0, linkedCount = 0
  const prepRows = []
  const cookDatesUsed = new Set()
  const recipesOut = []

  for (const [key, g] of groups) {
    const p = plan.get(key)
    // F08/test K : portions = somme des planned_servings des lignes liées
    // (défaut 1 par ligne), jamais le nombre de lignes.
    const portionsExact = g.meals.reduce((sum, m) => sum + (Number(m.planned_servings) || 1), 0)
    const portionsTotal = Math.max(1, Math.round(portionsExact))
    const rec = recipes?.length ? matchRecipe(g.meals[0].description || g.name, recipes) : null

    let ingredients = null, instructions = null, recMinutes = null
    if (rec) {
      const servings = Number(rec.servings) || portionsExact || 1
      const factor = portionsExact / servings
      const ingArr = Array.isArray(rec.ingredients) ? rec.ingredients : []
      if (ingArr.length) ingredients = ingArr.map(it => fmtIngredient(it, factor)).filter(Boolean).join(' · ')
      const stepArr = Array.isArray(rec.steps) ? rec.steps : []
      if (stepArr.length) {
        instructions = stepArr.slice().sort((x, y) => (x.step_no || 0) - (y.step_no || 0)).map((s, i) => `${i + 1}. ${s.instruction}`).join('\n')
        const sum = stepArr.reduce((t, s) => t + (Number(s.duration_min) || 0), 0)
        if (sum > 0) recMinutes = Math.min(sum, 90)
      }
    }
    const minutes = recMinutes || 30

    const byPerson = {}
    for (const m of g.meals) {
      byPerson[m.person_name] = (byPerson[m.person_name] || 0) + (Number(m.planned_servings) || 1)
    }
    const portionsLabel = Object.entries(byPerson).map(([per, c]) => `${per}: ${frPortions(c)}`).join(' · ')

    const { data: inserted, error: insErr } = await supabase
      .from('nutrition_plan_batch_recipes')
      .insert({
        import_id: importId,
        name: g.name,
        cook_date: p.cook_date,
        portions_total: portionsTotal,
        keeps_days: p.keeps_days,
        freezable: p.freezable,
        ingredients,
        instructions,
        reheat: p.reheat,
        conservation: p.conservation,
        portions: portionsLabel,
        rendement: `${frPortions(portionsExact)} portions`,
      })
      .select('id').single()
    if (insErr || !inserted) continue
    batchCount++
    cookDatesUsed.add(p.cook_date)
    recipesOut.push({
      name: g.name,
      cook_date: p.cook_date,
      portions_total: portionsTotal,
      planned_portions: portionsExact,
      freezable: p.freezable,
      conservation_source: 'default_conservative',
    })

    const ids = g.meals.map(m => m.id)
    await supabase.from('nutrition_plan_meals').update({ batch_recipe_id: inserted.id }).in('id', ids)
    linkedCount += ids.length

    prepRows.push({
      import_id: importId,
      prep_date: p.cook_date,
      prep_label: 'Jour de cuisine',
      task: `Cuisiner ${g.name} — ${frPortions(portionsExact)} portions, portionner en barquettes`,
      estimated_time: `${minutes} min`,
      source: 'batch', // tague les tâches de ce générateur (idempotence scoping, F09)
    })
  }

  // Tâche de rangement par session de cuisine distincte.
  for (const cd of cookDatesUsed) {
    prepRows.push({
      import_id: importId,
      prep_date: cd,
      prep_label: 'Jour de cuisine',
      task: 'Étiqueter les barquettes (plat + date) et ranger au frigo / congélo',
      estimated_time: '10 min',
      source: 'batch',
    })
  }
  if (prepRows.length) {
    const { error: prepInsErr } = await supabase.from('nutrition_plan_prep_tasks').insert(prepRows)
    if (prepInsErr) return NextResponse.json({ error: prepInsErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true, import_id: importId,
    sessions: [...cookDatesUsed].sort(),
    batch_recipes: batchCount, linked_meals: linkedCount,
    planner: 'rules',
    recipes: recipesOut,
  })
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  let importId = body?.importId || null

  let imp = null
  if (importId) {
    const { data } = await supabase.from('nutrition_plan_imports').select('*').eq('id', importId).maybeSingle()
    imp = data
  } else {
    const { data } = await supabase.from('nutrition_plan_imports').select('*').order('id', { ascending: false }).limit(1)
    imp = data?.[0] || null
  }
  if (!imp) return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 })
  importId = imp.id

  // Version active + productions publiées par le solveur ? → dérivation
  // canonique. Sinon (anciens plans), repli déterministe pur.
  const canonical = await deriveFromCanonicalPlan(supabase, importId)
  if (canonical.error) return NextResponse.json({ error: canonical.error.message }, { status: 500 })
  if (canonical.productions?.length) return runCanonical(supabase, importId, canonical)

  return runLegacy(supabase, importId, imp, user)
}
