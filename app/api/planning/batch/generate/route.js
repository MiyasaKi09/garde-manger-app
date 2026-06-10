import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * POST /api/planning/batch/generate  { importId? }
 *
 * Génère un batch « prépa à l'avance » INTELLIGENT et le persiste dans l'app.
 * - Claude planifie QUAND cuisiner chaque plat (1 à 3 sessions selon la fraîcheur :
 *   les mijotés/congelables la veille, les plats fragiles en session d'appoint) et
 *   donne les conseils de conservation/réchauffage. Repli déterministe (règles par
 *   type de plat) si l'appel échoue → la génération n'échoue jamais.
 * - Les ingrédients sont agrégés/échelonnés depuis la fiche recette (déterministe).
 * Idempotent par import. S'exécute avec le client utilisateur → RLS = propriété.
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

/* ───────── profils de conservation par type de plat (repli déterministe) ───────── */
const DISH_PROFILES = [
  { re: /(bourguignon|blanquette|daube|pot-au-feu|joues|tajine|navarin|carbonnade|osso|boeuf braise|bœuf braise)/, keeps: 5, freeze: true, better: true },
  { re: /(dahl|dhal|curry|chili|cassoulet|lentille|pois chiche|haricot|soupe|veloute|velouté|potage|minestrone|ragout|ragoût|mijot)/, keeps: 5, freeze: true, better: true },
  { re: /(bolognaise|bolognese|sauce tomate|ratatouille|sauce)/, keeps: 5, freeze: true, better: true },
  { re: /(couscous|semoule|boulgour|boulghour)/, keeps: 4, freeze: true, better: false },
  { re: /(quinoa|buddha bowl|bowl|riz|risotto|pates|pâtes|nouilles|gnocchi|pilaf|poke)/, keeps: 4, freeze: true, better: false },
  { re: /(gratin|lasagne|hachis|parmentier|moussaka|enchilada|tarte|quiche|cake sale|clafoutis)/, keeps: 4, freeze: true, better: false },
  { re: /(poulet|dinde|volaille|porc|veau|agneau|saucisse|boeuf|bœuf|steak|wok|saute|sauté|emince|émincé|boulette)/, keeps: 4, freeze: true, better: false },
  { re: /(pho|ramen|bouillon)/, keeps: 4, freeze: true, better: false },
  { re: /(poisson|cabillaud|saumon|thon|colin|lieu|merlu|crevette|gambas|fruits de mer|moule|seiche|calamar|crustace)/, keeps: 2, freeze: false, better: false },
  { re: /(salade|crudite|crudité|tartine|wrap|carpaccio|taboule|taboulé|gaspacho|rouleau)/, keeps: 2, freeze: false, better: false },
  { re: /(omelette|oeuf|œuf|frittata|tortilla)/, keeps: 3, freeze: false, better: false },
]
function classifyDish(name) {
  const n = (name || '').toLowerCase()
  for (const p of DISH_PROFILES) if (p.re.test(n)) return p
  return { keeps: 3, freeze: true, better: false } // défaut prudent
}
function conservationAdvice(prof, cookDate, eats) {
  const latest = eats[eats.length - 1]
  const gap = daysBetween(cookDate, latest)
  const bits = []
  if (prof.better) bits.push('encore meilleur réchauffé')
  if (gap <= prof.keeps) bits.push(`se garde ${prof.keeps} j au frigo`)
  else if (prof.freeze) bits.push(`frigo jusqu'au ${frShort(addDays(cookDate, prof.keeps))}, congèle les portions suivantes (sortir la veille)`)
  else bits.push(`fragile, à manger sous ${prof.keeps} j`)
  return cap(bits.join(' · '))
}
function reheatFor(name) {
  const n = (name || '').toLowerCase()
  if (/(soupe|veloute|velouté|bouillon|dahl|curry|pho|ramen|chili|mijot|bourguignon|pot-au-feu|ragout|ragoût|tajine|blanquette)/.test(n))
    return "Casserole à feu doux 6–8 min en remuant (un filet d'eau si besoin), ou micro-ondes 3 min à couvert."
  if (/(salade|tartine|wrap|poke|carpaccio|taboul|cru|gaspacho)/.test(n))
    return "Se mange froid : sortir du frigo 10 min avant. Garder sauce/croûtons à part jusqu'au service."
  if (/(gratin|lasagne|hachis|parmentier|moussaka|enchilada|tarte|quiche)/.test(n))
    return "Four 180°C 12–15 min (ou micro-ondes 3–4 min). Couvrir pour garder le moelleux."
  if (/(riz|pates|pâtes|poulet|boeuf|bœuf|poisson|cabillaud|saumon|porc|dinde|veau|agneau|legume|légume|wok|saute|sauté|gnocchi|risotto|quinoa|semoule|couscous|nouilles)/.test(n))
    return "Micro-ondes 2–3 min à couvert (un filet d'eau sur le féculent), ou poêle à feu moyen 4–5 min."
  return "Micro-ondes 2–3 min à couvert, ou poêle à feu moyen — remuer à mi-parcours."
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

/* ───────── planification intelligente (Claude) ───────── */
const SYSTEM_PROMPT = `Tu es chef spécialiste du batch cooking et de la sécurité alimentaire. On te donne les déjeuners (lundi→vendredi) d'une semaine, DÉJÀ choisis : tu ne changes pas les plats, tu planifies seulement QUAND les cuisiner à l'avance et COMMENT les conserver.

Objectif : un bon ÉQUILIBRE entre peu de sessions ET fraîcheur. Vise au plus ~3 jours entre la cuisson et la consommation : il vaut mieux 2 sessions que garder un plat 5 jours au frigo.

Règles :
- Fais en général DEUX sessions : une le dimanche (cook_sunday) pour les déjeuners du DÉBUT de semaine (lundi→mercredi), et une session d'appoint en MILIEU de semaine (ex. le mercredi) pour la FIN de semaine (jeudi→vendredi). Ne cuisine PAS tout le dimanche pour le vendredi (5 jours, c'est trop long).
- Exception : un mijoté robuste et meilleur réchauffé (bourguignon, daube, dahl, currys) PEUT être cuisiné le dimanche même pour le milieu de semaine.
- Plats fragiles NON congelables (poisson/fruits de mer ≈2 j, salades/crudités/plats crus ≈1–2 j, œufs ≈3 j) : à cuisiner au plus près du jour où ils sont mangés (session d'appoint), jamais le dimanche pour la fin de semaine.
- cook_date ∈ allowed_cook_dates, et TOUJOURS ≤ au premier jour où le plat est mangé.
- Regroupe les plats d'une même tranche de semaine sur le MÊME jour de cuisine (2 sessions, pas 5).
- keeps_days = conservation frigo réaliste (entier). freezable = booléen. conservation = phrase COURTE, concrète, en français (ex : « Se garde 5 j au frigo, encore meilleur réchauffé » ou « Congèle les portions de vendredi, sors-les la veille »). reheat = consigne de réchauffage courte et adaptée. prep_minutes = temps de cuisson estimé du lot (entier).

Réponds UNIQUEMENT en JSON valide, sans texte autour, en RÉUTILISANT EXACTEMENT l'id fourni pour chaque plat : {"dishes":[{"id":"0","cook_date":"YYYY-MM-DD","keeps_days":5,"freezable":true,"conservation":"…","reheat":"…","prep_minutes":35}]}`

function extractJson(text) {
  if (!text) return null
  const a = text.indexOf('{'), b = text.lastIndexOf('}')
  if (a < 0 || b <= a) return null
  try { return JSON.parse(text.slice(a, b + 1)) } catch { return null }
}
async function scheduleWithClaude(dishesInput, cookSunday, allowedDates) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[batch] ANTHROPIC_API_KEY absente en prod — repli sur les règles')
    return null
  }
  try {
    const payload = { cook_sunday: cookSunday, allowed_cook_dates: allowedDates, dishes: dishesInput }
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Semaine à organiser (JSON) :\n${JSON.stringify(payload)}` }],
    })
    const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
    const json = extractJson(text)
    if (!json || !Array.isArray(json.dishes)) {
      console.error('[batch] Réponse Claude inexploitable:', (text || '').slice(0, 160))
      return null
    }
    const map = new Map()
    for (const d of json.dishes) {
      const id = d?.id != null ? String(d.id) : null
      if (id != null) map.set(id, d)
    }
    if (!map.size) {
      console.error('[batch] Claude: dishes sans id exploitable —', JSON.stringify(json.dishes).slice(0, 200))
      return null
    }
    return map
  } catch (e) {
    console.error('[batch] Claude indisponible:', e?.message || e)
    return null
  }
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

  const { data: allMeals, error: mErr } = await supabase
    .from('nutrition_plan_meals').select('*').eq('import_id', importId).eq('meal_type', 'dejeuner')
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  const lunches = (allMeals || []).filter(m => { const wd = weekdayOf(m.meal_date); return wd >= 1 && wd <= 5 })
  if (!lunches.length) return NextResponse.json({ error: 'Aucun déjeuner en semaine à préparer' }, { status: 400 })

  const { data: recipes } = await supabase
    .from('generated_recipes').select('id,title,name_normalized,servings,ingredients,steps').eq('user_id', user.id)

  // Regroupement par plat + jours mangés.
  const groups = new Map() // key -> { name, meals[], eats:Set }
  for (const m of lunches) {
    const key = dishKey(m)
    if (!groups.has(key)) groups.set(key, { name: key, meals: [], eats: new Set() })
    const g = groups.get(key); g.meals.push(m); g.eats.add(m.meal_date)
  }

  const cookSunday = addDays(imp.date_range_start, -1)
  const allowedDates = [cookSunday, ...Array.from({ length: 5 }, (_, i) => addDays(imp.date_range_start, i))] // dim + lun→ven

  // Entrée pour Claude — chaque plat porte un id stable (matching robuste, indépendant du nom).
  const groupList = [...groups.entries()] // [key, g] — l'index sert d'id
  const dishesInput = groupList.map(([key, g], i) => {
    const byDate = {}
    for (const m of g.meals) byDate[m.meal_date] = (byDate[m.meal_date] || 0) + 1
    return {
      id: String(i),
      name: g.name,
      total_portions: g.meals.length,
      eats: Object.entries(byDate).sort().map(([date, portions]) => ({ date, weekday: DOW_FR[weekdayOf(date)], portions })),
    }
  })

  const ai = await scheduleWithClaude(dishesInput, cookSunday, allowedDates)

  // Planning final par plat : Claude si valide, sinon règles déterministes.
  const plan = new Map() // key -> { cook_date, keeps_days, freezable, conservation, reheat, prep_minutes }
  let aiApplied = 0
  groupList.forEach(([key, g], i) => {
    const eats = [...g.eats].sort()
    const earliest = eats[0]
    const latest = eats[eats.length - 1]
    const prof = classifyDish(g.name)

    // base déterministe : on évite de garder un plat trop longtemps. Fenêtre de
    // fraîcheur ~3 j → session du dimanche pour le début de semaine (lun→mer),
    // session d'appoint le mercredi pour la fin de semaine (jeu→ven). On ne
    // cuisine jamais après le 1er repas du plat.
    const FRESH = 3
    const midweek = addDays(cookSunday, 3)
    let cookDate
    if (daysBetween(cookSunday, latest) <= FRESH) cookDate = cookSunday
    else cookDate = midweek <= earliest ? midweek : earliest
    let entry = {
      cook_date: cookDate,
      keeps_days: prof.keeps,
      freezable: prof.freeze,
      conservation: conservationAdvice(prof, cookDate, eats),
      reheat: reheatFor(g.name),
      prep_minutes: null,
    }

    // override Claude (matché par id) si cohérent (date allouée, jamais après le 1er repas)
    const a = ai?.get(String(i))
    if (a) {
      let used = false
      const cd = typeof a.cook_date === 'string' ? a.cook_date.slice(0, 10) : null
      if (cd && allowedDates.includes(cd) && cd <= earliest) { entry.cook_date = cd; used = true }
      if (Number.isFinite(a.keeps_days)) entry.keeps_days = Math.round(a.keeps_days)
      if (typeof a.freezable === 'boolean') entry.freezable = a.freezable
      if (typeof a.conservation === 'string' && a.conservation.trim()) { entry.conservation = cap(a.conservation.trim()); used = true }
      if (typeof a.reheat === 'string' && a.reheat.trim()) { entry.reheat = a.reheat.trim(); used = true }
      if (Number.isFinite(a.prep_minutes)) entry.prep_minutes = Math.round(a.prep_minutes)
      if (used) aiApplied++
    }
    plan.set(key, entry)
  })

  // ── Idempotence (ordre FK-safe) ──
  await supabase.from('nutrition_plan_meals').update({ batch_recipe_id: null }).eq('import_id', importId)
  await supabase.from('nutrition_plan_prep_tasks').delete().eq('import_id', importId)
  await supabase.from('nutrition_plan_batch_recipes').delete().eq('import_id', importId)

  let batchCount = 0, linkedCount = 0
  const prepRows = []
  const cookDatesUsed = new Set()

  for (const [key, g] of groups) {
    const p = plan.get(key)
    const portions = g.meals.length
    const rec = recipes?.length ? matchRecipe(g.meals[0].description || g.name, recipes) : null

    let ingredients = null, instructions = null, recMinutes = null
    if (rec) {
      const servings = Number(rec.servings) || portions || 1
      const factor = portions / servings
      const ingArr = Array.isArray(rec.ingredients) ? rec.ingredients : []
      if (ingArr.length) ingredients = ingArr.map(it => fmtIngredient(it, factor)).filter(Boolean).join(' · ')
      const stepArr = Array.isArray(rec.steps) ? rec.steps : []
      if (stepArr.length) {
        instructions = stepArr.slice().sort((x, y) => (x.step_no || 0) - (y.step_no || 0)).map((s, i) => `${i + 1}. ${s.instruction}`).join('\n')
        const sum = stepArr.reduce((t, s) => t + (Number(s.duration_min) || 0), 0)
        if (sum > 0) recMinutes = Math.min(sum, 90)
      }
    }
    const minutes = p.prep_minutes || recMinutes || 30

    const byPerson = {}
    for (const m of g.meals) byPerson[m.person_name] = (byPerson[m.person_name] || 0) + 1
    const portionsLabel = Object.entries(byPerson).map(([per, c]) => `${per}: ${c}`).join(' · ')

    const { data: inserted, error: insErr } = await supabase
      .from('nutrition_plan_batch_recipes')
      .insert({
        import_id: importId,
        name: g.name,
        cook_date: p.cook_date,
        portions_total: portions,
        keeps_days: p.keeps_days,
        freezable: p.freezable,
        ingredients,
        instructions,
        reheat: p.reheat,
        conservation: p.conservation,
        portions: portionsLabel,
        rendement: `${portions} portions`,
      })
      .select('id').single()
    if (insErr || !inserted) continue
    batchCount++
    cookDatesUsed.add(p.cook_date)

    const ids = g.meals.map(m => m.id)
    await supabase.from('nutrition_plan_meals').update({ batch_recipe_id: inserted.id }).in('id', ids)
    linkedCount += ids.length

    prepRows.push({
      import_id: importId,
      prep_date: p.cook_date,
      prep_label: 'Jour de cuisine',
      task: `Cuisiner ${g.name} — ${portions} portions, portionner en barquettes`,
      estimated_time: `${minutes} min`,
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
    })
  }
  if (prepRows.length) await supabase.from('nutrition_plan_prep_tasks').insert(prepRows)

  return NextResponse.json({
    ok: true, import_id: importId,
    sessions: [...cookDatesUsed].sort(),
    batch_recipes: batchCount, linked_meals: linkedCount,
    planner: aiApplied > 0 ? 'ai' : 'rules',
  })
}
