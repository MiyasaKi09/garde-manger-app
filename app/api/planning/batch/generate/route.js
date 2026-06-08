import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/planning/batch/generate  { importId? }
 *
 * Génère le batch « prépa à l'avance » DANS l'app (déterministe, zéro appel IA) :
 * regroupe les déjeuners lun–ven par plat, agrège/échelle les ingrédients depuis
 * la fiche recette correspondante, fixe le jour de cuisine (dimanche), relie chaque
 * repas (meals.batch_recipe_id) et écrit la check-list (prep_tasks). Idempotent par
 * import. S'exécute avec le client utilisateur → RLS garantit la propriété.
 */

const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'aux', 'au', 'a', 'et', 'en',
  'l', 'd', 'un', 'une', 'sur', 'fines', 'maison', 'facon', 'fine',
  'portion', 'julien', 'zoe',
])
function tokens(str) {
  return normalizeRecipeName(str || '').split('-').filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

// Meilleure fiche recette pour une description de repas (même logique que /api/recipes/generated).
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

// Nom du plat d'un repas (surnom court sinon description nettoyée).
function dishKey(m) {
  const s = (m.short_label || '').trim()
  if (s) return s
  let d = (m.description || '').trim()
  const colon = d.indexOf(':')
  if (colon > 0 && colon < 60) d = d.slice(0, colon)
  return d.replace(/\s*\((?:portion|part)[^)]*\)\s*$/i, '').trim() || 'Plat'
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const weekdayOf = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay() // 0 dim … 6 sam

// Conseil de réchauffage adapté au type de plat.
function reheatFor(name) {
  const n = (name || '').toLowerCase()
  if (/(soupe|veloute|velouté|bouillon|dahl|curry|pho|ramen|chili|mijot|bourguignon|pot-au-feu|ragout|ragoût|tajine|blanquette)/.test(n))
    return "Casserole à feu doux 6–8 min en remuant (un filet d'eau si besoin), ou micro-ondes 3 min à couvert."
  if (/(salade|tartine|wrap|bowl|poke|carpaccio|taboul|cru|gaspacho)/.test(n))
    return "Se mange froid : sortir du frigo 10 min avant. Garder sauce/croûtons à part jusqu'au service."
  if (/(gratin|lasagne|hachis|parmentier|quiche|tarte|gateau|gâteau|moussaka|enchilada)/.test(n))
    return "Four 180°C 12–15 min (ou micro-ondes 3–4 min). Couvrir pour garder le moelleux."
  if (/(riz|pates|pâtes|poulet|boeuf|bœuf|poisson|cabillaud|saumon|porc|dinde|veau|agneau|legume|légume|wok|saute|sauté|gnocchi|risotto|quinoa|semoule|nouilles)/.test(n))
    return "Micro-ondes 2–3 min à couvert (un filet d'eau sur le féculent), ou poêle à feu moyen 4–5 min."
  return "Micro-ondes 2–3 min à couvert, ou poêle à feu moyen — remuer à mi-parcours."
}

// Ingrédient échelonné « 600g blanc de poulet ».
function fmtIngredient(it, factor) {
  const unit = (it.unit || '').trim()
  let qtyStr = ''
  if (it.quantity != null) {
    const q = Math.round(it.quantity * factor * 10) / 10
    qtyStr = unit && unit.length <= 3 ? `${q}${unit}` : `${q}${unit ? ' ' + unit : ''}`
  }
  return [qtyStr, it.name].filter(Boolean).join(' ').trim()
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  let importId = body?.importId || null

  // Import ciblé (sinon le plus récent de l'utilisateur).
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

  // Déjeuners de la semaine (lun–ven uniquement).
  const { data: allMeals, error: mErr } = await supabase
    .from('nutrition_plan_meals').select('*').eq('import_id', importId).eq('meal_type', 'dejeuner')
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  const lunches = (allMeals || []).filter(m => {
    const wd = weekdayOf(m.meal_date)
    return wd >= 1 && wd <= 5
  })
  if (!lunches.length) return NextResponse.json({ error: 'Aucun déjeuner en semaine à préparer' }, { status: 400 })

  // Fiches recettes pour enrichir ingrédients/instructions.
  const { data: recipes } = await supabase
    .from('generated_recipes')
    .select('id,title,name_normalized,servings,ingredients,steps')
    .eq('user_id', user.id)

  const cookDate = addDays(imp.date_range_start, -1) // dimanche avant le lundi

  // Regroupement par plat.
  const groups = new Map()
  for (const m of lunches) {
    const key = dishKey(m)
    if (!groups.has(key)) groups.set(key, { name: key, meals: [] })
    groups.get(key).meals.push(m)
  }

  // Idempotence : on efface l'ancien batch de CET import (ordre FK-safe).
  await supabase.from('nutrition_plan_meals').update({ batch_recipe_id: null }).eq('import_id', importId)
  await supabase.from('nutrition_plan_prep_tasks').delete().eq('import_id', importId)
  await supabase.from('nutrition_plan_batch_recipes').delete().eq('import_id', importId)

  let batchCount = 0, linkedCount = 0
  const prepRows = []

  for (const g of groups.values()) {
    const portions = g.meals.length
    const rec = recipes?.length ? matchRecipe(g.meals[0].description || g.name, recipes) : null

    let ingredients = null, instructions = null, minutes = 30
    if (rec) {
      const servings = Number(rec.servings) || portions || 1
      const factor = portions / servings
      const ingArr = Array.isArray(rec.ingredients) ? rec.ingredients : []
      if (ingArr.length) ingredients = ingArr.map(it => fmtIngredient(it, factor)).filter(Boolean).join(' · ')
      const stepArr = Array.isArray(rec.steps) ? rec.steps : []
      if (stepArr.length) {
        instructions = stepArr.slice().sort((a, b) => (a.step_no || 0) - (b.step_no || 0))
          .map((s, i) => `${i + 1}. ${s.instruction}`).join('\n')
        const sum = stepArr.reduce((t, s) => t + (Number(s.duration_min) || 0), 0)
        if (sum > 0) minutes = Math.min(sum, 90)
      }
    }

    const byPerson = {}
    for (const m of g.meals) byPerson[m.person_name] = (byPerson[m.person_name] || 0) + 1
    const portionsLabel = Object.entries(byPerson).map(([p, c]) => `${p}: ${c}`).join(' · ')

    const { data: inserted, error: insErr } = await supabase
      .from('nutrition_plan_batch_recipes')
      .insert({
        import_id: importId,
        name: g.name,
        cook_date: cookDate,
        portions_total: portions,
        ingredients,
        instructions,
        reheat: reheatFor(g.name),
        portions: portionsLabel,
        rendement: `${portions} portions`,
      })
      .select('id').single()
    if (insErr || !inserted) continue
    batchCount++

    const ids = g.meals.map(m => m.id)
    await supabase.from('nutrition_plan_meals').update({ batch_recipe_id: inserted.id }).in('id', ids)
    linkedCount += ids.length

    prepRows.push({
      import_id: importId,
      prep_date: cookDate,
      prep_label: 'Jour de cuisine',
      task: `Cuisiner ${g.name} — ${portions} portions, portionner en barquettes`,
      estimated_time: `${minutes} min`,
    })
  }

  // Tâche finale.
  prepRows.push({
    import_id: importId,
    prep_date: cookDate,
    prep_label: 'Jour de cuisine',
    task: 'Étiqueter les barquettes (plat + date) et ranger au frigo / congélo',
    estimated_time: '10 min',
  })
  await supabase.from('nutrition_plan_prep_tasks').insert(prepRows)

  return NextResponse.json({
    ok: true, import_id: importId, cook_date: cookDate,
    batch_recipes: batchCount, linked_meals: linkedCount,
  })
}
