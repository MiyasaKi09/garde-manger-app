import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/routine/generate-batch
 * Génère le « jour de cuisine » batch pour la semaine :
 *  - lit les déjeuners lun–ven de l'import ciblé (ou le plus récent)
 *  - crée une nutrition_plan_batch_recipes par plat distinct (avec ingrédients
 *    scalés, reheat, instructions) via Claude
 *  - relie chaque repas via batch_recipe_id
 *  - écrit la check-list du jour de cuisine dans nutrition_plan_prep_tasks
 * Idempotent : réinitialise les données précédentes avant de recréer.
 * Body optionnel : { importId } pour cibler une semaine précise.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch { /* body optionnel */ }
  const { importId: bodyImportId } = body || {}

  // ── 1. Résoudre l'import cible ──────────────────────────────────────────
  let importId = bodyImportId ? Number(bodyImportId) : null
  let dateRangeStart

  if (importId) {
    const { data: imp, error: impErr } = await supabase
      .from('nutrition_plan_imports')
      .select('id, date_range_start')
      .eq('id', importId)
      .single()
    if (impErr || !imp) {
      return NextResponse.json({ error: 'Import introuvable' }, { status: 404 })
    }
    dateRangeStart = imp.date_range_start
  } else {
    const { data: imp, error: impErr } = await supabase
      .from('nutrition_plan_imports')
      .select('id, date_range_start')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(1)
      .single()
    if (impErr || !imp) {
      return NextResponse.json({ error: 'Aucun import trouvé' }, { status: 404 })
    }
    importId = imp.id
    dateRangeStart = imp.date_range_start
  }

  // ── 2. Calculer les dates de la semaine ─────────────────────────────────
  const monday = new Date(`${dateRangeStart}T00:00:00Z`)
  const cookDate = new Date(monday)
  cookDate.setUTCDate(cookDate.getUTCDate() - 1) // dimanche précédant le lundi
  const cookDateStr = cookDate.toISOString().slice(0, 10)
  const mondayStr = monday.toISOString().slice(0, 10)
  const friday = new Date(monday)
  friday.setUTCDate(friday.getUTCDate() + 4)
  const fridayStr = friday.toISOString().slice(0, 10)

  // ── 3. Lire les déjeuners lun–ven ───────────────────────────────────────
  const { data: meals, error: mealsErr } = await supabase
    .from('nutrition_plan_meals')
    .select('id, person_name, meal_date, description, short_label, kcal, protein_g, carbs_g, fat_g, fiber_g')
    .eq('import_id', importId)
    .eq('meal_type', 'dejeuner')
    .gte('meal_date', mondayStr)
    .lte('meal_date', fridayStr)

  if (mealsErr) {
    return NextResponse.json({ error: mealsErr.message }, { status: 500 })
  }
  if (!meals?.length) {
    return NextResponse.json(
      { error: 'Aucun déjeuner trouvé pour cette semaine', import_id: importId, week: mondayStr },
      { status: 404 },
    )
  }

  // ── 4. Idempotence : réinitialiser les données précédentes ──────────────
  await supabase
    .from('nutrition_plan_meals')
    .update({ batch_recipe_id: null })
    .eq('import_id', importId)

  await supabase
    .from('nutrition_plan_batch_recipes')
    .delete()
    .eq('import_id', importId)

  await supabase
    .from('nutrition_plan_prep_tasks')
    .delete()
    .eq('import_id', importId)

  // ── 5. Regrouper les déjeuners par plat ─────────────────────────────────
  // Julien + Zoé le même jour = même plat (2 portions)
  // Si le plat revient sur 2 jours = 4 portions
  const dishMap = new Map() // normalizedKey -> { label, description, dates, mealIds, portions }

  for (const meal of meals) {
    const key = normalizeLabel(meal.short_label || meal.description)
    const displayLabel = meal.short_label
      || meal.description.split(':')[0].trim()

    if (!dishMap.has(key)) {
      dishMap.set(key, {
        label: displayLabel,
        description: meal.description || displayLabel,
        dates: new Set(),
        mealIds: [],
        portions: 0,
      })
    }
    const dish = dishMap.get(key)
    dish.dates.add(meal.meal_date)
    dish.mealIds.push(meal.id)
    dish.portions += 1
  }

  const dishes = [...dishMap.values()]

  // ── 6. Générer les recettes via Claude ──────────────────────────────────
  const dishList = dishes
    .map((d, i) =>
      `${i + 1}. "${d.label}" — ${d.portions} portion(s)\n   Description plan : ${d.description}`,
    )
    .join('\n')

  const aiMessage = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: 'Tu es un assistant batch-cooking. Réponds UNIQUEMENT en JSON valide, sans texte avant ni après.',
    messages: [
      {
        role: 'user',
        content: `Pour chaque plat ci-dessous, génère une recette batch adaptée au nombre de portions.

Plats :
${dishList}

Réponds avec un tableau JSON (une entrée par plat, même ordre) :
[
  {
    "name": "nom exact du plat",
    "ingredients": "600g blanc de poulet · 300g riz · 200g brocoli · 2 cs huile d'olive · sel, poivre",
    "macros_per_100g": "Énergie ~160 kcal, Prot ~14g, Glu ~12g, Lip ~5g, Fibres ~2g",
    "rendement": "X portions de ~350g chacune",
    "portions": "Diviser équitablement en barquettes hermétiques. Se conserve 4 jours au frigo.",
    "reheat": "Micro-ondes 2-3 min à 800W en ajoutant 2 cs d'eau",
    "instructions": "1. ... 2. ... 3. ...",
    "estimated_time": "35 min"
  }
]

Règles : quantités réalistes et proportionnées au nb de portions, conseil de réchauffage adapté au plat (micro-ondes / poêle / four), recettes pratiques batch-cooking.`,
      },
    ],
  })

  let recipeDetails
  try {
    const raw = aiMessage.content[0].text.trim()
    // Extraire le JSON si enveloppé dans des backticks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw]
    recipeDetails = JSON.parse(jsonMatch[1])
    if (!Array.isArray(recipeDetails)) throw new Error('not an array')
  } catch {
    return NextResponse.json(
      { error: 'Erreur parsing réponse Claude', raw: aiMessage.content[0]?.text?.slice(0, 500) },
      { status: 500 },
    )
  }

  // ── 7. Insérer les batch recipes et relier les repas ────────────────────
  let linkedMeals = 0

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i]
    const details = recipeDetails[i] || {}

    const { data: recipe, error: recipeErr } = await supabase
      .from('nutrition_plan_batch_recipes')
      .insert({
        import_id: importId,
        name: dish.label,
        cook_date: cookDateStr,
        portions_total: dish.portions,
        ingredients: details.ingredients || '',
        macros_per_100g: details.macros_per_100g || '',
        rendement: details.rendement || `${dish.portions} portions`,
        portions: details.portions || '',
        reheat: details.reheat || '',
        instructions: details.instructions || '',
      })
      .select('id')
      .single()

    if (recipeErr) {
      continue
    }

    // Relier les repas correspondants
    const { error: updateErr } = await supabase
      .from('nutrition_plan_meals')
      .update({ batch_recipe_id: recipe.id })
      .in('id', dish.mealIds)

    if (!updateErr) {
      linkedMeals += dish.mealIds.length
    }

    // Tâche de préparation pour ce plat
    await supabase.from('nutrition_plan_prep_tasks').insert({
      import_id: importId,
      prep_date: cookDateStr,
      prep_label: 'Jour de cuisine',
      task: `Cuisiner ${dish.label} — ${dish.portions} portions, portionner en barquettes`,
      estimated_time: details.estimated_time || '30 min',
    })
  }

  // Tâche finale : étiqueter & ranger
  await supabase.from('nutrition_plan_prep_tasks').insert({
    import_id: importId,
    prep_date: cookDateStr,
    prep_label: 'Jour de cuisine',
    task: 'Étiqueter & ranger (frigo/congélo)',
    estimated_time: '10 min',
  })

  return NextResponse.json({
    import_id: importId,
    cook_date: cookDateStr,
    batch_recipes: dishes.length,
    linked_meals: linkedMeals,
  })
}

function normalizeLabel(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}
