import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/**
 * API CRUD recettes — cible de migration des mutations directes des éditeurs
 * client (app/recipes/edit/[id]). Écrit dans le schéma RÉEL (vérifié en base) :
 *
 *   recipes(name, description, prep_time_minutes, cook_time_minutes, servings,
 *           cooking_method, role, is_scalable_to_main, is_complete_meal,
 *           needs_side_dish)
 *   recipe_ingredients(recipe_id, archetype_id?, canonical_food_id?,
 *                      sub_recipe_id?, quantity NOT NULL, unit NOT NULL, notes?)
 *   recipe_steps(recipe_id, step_no, instruction, duration_min?, temperature?,
 *                temperature_unit?)
 *   recipe_utensils — ⚠️ table ABSENTE du schéma actuel : les ustensiles fournis
 *   sont tentés « best effort » et remontés dans `warnings` si l'écriture échoue.
 *
 * Compat éditeurs actuels : `title` est accepté comme alias de `name`,
 * `prep_min`/`cook_min` comme alias de `prep_time_minutes`/`cook_time_minutes`.
 * NB : la table `recipes` est un catalogue partagé SANS colonne user_id — pas
 * de scoping propriétaire possible ici ; l'accès en écriture relève des
 * policies RLS (cf. Phase 0.1 de l'audit).
 *
 * POST /api/recipes/manage — création
 *   body: {
 *     name | title: string (requis),
 *     description?, cooking_method?,
 *     servings?: int 1..100,
 *     prep_time_minutes | prep_min?: int 0..6000,
 *     cook_time_minutes | cook_min?: int 0..6000,
 *     role?: 'PLAT_PRINCIPAL'|'ACCOMPAGNEMENT'|'PLAT_COMPLET'|'ENTREE'|'DESSERT'|'SAUCE'|'PETIT_DEJEUNER'|'BASE'
 *       (défaut PLAT_PRINCIPAL),
 *     is_scalable_to_main?, is_complete_meal?, needs_side_dish?: boolean,
 *     ingredients?: [{ quantity: number>0, unit: string, archetype_id?,
 *                      canonical_food_id?, sub_recipe_id?, notes? }],
 *     steps?: [{ instruction: string, duration_min?, temperature?, temperature_unit? }],
 *     utensils?: [{ utensil_name: string, quantity?: int>=1, is_optional?, notes? }]
 *   }
 *   → 201 { success: true, recipe, ingredients_count, steps_count, utensils_count, warnings? }
 *
 * PUT /api/recipes/manage — mise à jour + remplacement des enfants
 *   body: { id: int (requis), ...mêmes champs que POST (tous optionnels) }
 *   Sémantique enfants : un tableau FOURNI remplace intégralement
 *   (delete + insert) ; un tableau ABSENT (undefined) est laissé tel quel.
 *   → 200 { success: true, recipe, ingredients_count?, steps_count?, utensils_count?, warnings? }
 *
 * DELETE /api/recipes/manage?id=123 (ou body { id })
 *   Supprime la recette ; les enfants (ingredients, steps, tags, pairings,
 *   nutrition_cache, instructions) sont supprimés par les FK ON DELETE CASCADE.
 *   → 200 { success: true }
 *   → 409 { error } si la recette est encore référencée (planned_meals,
 *     user_recipe_interactions, sub_recipe d'une autre recette — FK RESTRICT).
 *
 * Erreurs communes : 400 validation, 401 non authentifié, 404 introuvable, 500 DB.
 */

const ROLES = new Set([
  'PLAT_PRINCIPAL', 'ACCOMPAGNEMENT', 'PLAT_COMPLET', 'ENTREE',
  'DESSERT', 'SAUCE', 'PETIT_DEJEUNER', 'BASE',
])

const intIn = (v, min, max) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

/**
 * Construit le patch `recipes` depuis le body (alias acceptés).
 * @returns {{ fields: object, errors: string[] }}
 */
function parseRecipeFields(body, { requireName }) {
  const fields = {}
  const errors = []

  const rawName = body.name ?? body.title
  if (rawName !== undefined || requireName) {
    const name = typeof rawName === 'string' ? rawName.trim() : ''
    if (!name) errors.push('name (ou title) est requis et non vide')
    else if (name.length > 200) errors.push('name : 200 caractères max')
    else fields.name = name
  }

  if ('description' in body) {
    fields.description = body.description == null ? null : String(body.description)
  }
  if ('cooking_method' in body) {
    fields.cooking_method = body.cooking_method == null ? null : String(body.cooking_method)
  }

  if ('servings' in body && body.servings != null) {
    const s = intIn(body.servings, 1, 100)
    if (s === null) errors.push('servings doit être un entier entre 1 et 100')
    else fields.servings = s
  }
  const prepRaw = body.prep_time_minutes ?? body.prep_min
  if (prepRaw !== undefined && prepRaw !== null) {
    const p = intIn(prepRaw, 0, 6000)
    if (p === null) errors.push('prep_time_minutes doit être un entier entre 0 et 6000')
    else fields.prep_time_minutes = p
  }
  const cookRaw = body.cook_time_minutes ?? body.cook_min
  if (cookRaw !== undefined && cookRaw !== null) {
    const c = intIn(cookRaw, 0, 6000)
    if (c === null) errors.push('cook_time_minutes doit être un entier entre 0 et 6000')
    else fields.cook_time_minutes = c
  }

  if ('role' in body && body.role != null) {
    const role = String(body.role).toUpperCase()
    if (!ROLES.has(role)) errors.push(`role invalide (valeurs : ${[...ROLES].join(', ')})`)
    else fields.role = role
  }

  for (const flag of ['is_scalable_to_main', 'is_complete_meal', 'needs_side_dish']) {
    if (flag in body && body[flag] != null) {
      if (typeof body[flag] !== 'boolean') errors.push(`${flag} doit être un booléen`)
      else fields[flag] = body[flag]
    }
  }

  return { fields, errors }
}

/** Valide/normalise les tableaux enfants. @returns {{ rows, errors }} */
function parseIngredients(list) {
  const rows = []
  const errors = []
  ;(list || []).forEach((ing, i) => {
    if (!ing || typeof ing !== 'object') { errors.push(`ingredients[${i}] invalide`); return }
    const quantity = Number(ing.quantity ?? ing.qty)
    const unit = typeof ing.unit === 'string' ? ing.unit.trim() : ''
    if (!(quantity > 0)) errors.push(`ingredients[${i}].quantity doit être > 0`)
    if (!unit) errors.push(`ingredients[${i}].unit est requis`)
    if (!(quantity > 0) || !unit) return
    rows.push({
      quantity,
      unit,
      archetype_id: ing.archetype_id ?? null,
      canonical_food_id: ing.canonical_food_id ?? null,
      sub_recipe_id: ing.sub_recipe_id ?? null,
      notes: ing.notes ?? ing.note ?? null,
    })
  })
  return { rows, errors }
}

function parseSteps(list) {
  const rows = []
  const errors = []
  ;(list || []).forEach((step, i) => {
    const instruction = typeof step?.instruction === 'string' ? step.instruction.trim() : ''
    if (!instruction) { errors.push(`steps[${i}].instruction est requis`); return }
    rows.push({
      step_no: i + 1,
      instruction,
      duration_min: intIn(step.duration_min, 0, 6000),
      temperature: step.temperature != null ? Number(step.temperature) || null : null,
      temperature_unit: step.temperature_unit || '°C',
    })
  })
  return { rows, errors }
}

function parseUtensils(list) {
  const rows = []
  const errors = []
  ;(list || []).forEach((u, i) => {
    const name = typeof u?.utensil_name === 'string' ? u.utensil_name.trim() : ''
    if (!name) { errors.push(`utensils[${i}].utensil_name est requis`); return }
    rows.push({
      utensil_name: name,
      quantity: intIn(u.quantity, 1, 100) ?? 1,
      is_optional: u.is_optional === true,
      notes: u.notes ?? null,
    })
  })
  return { rows, errors }
}

/**
 * Remplace les enfants d'une recette (delete + insert).
 * `tolerateMissingTable` : recipe_utensils n'existe pas (encore) en base →
 * l'échec est remonté en warning au lieu de faire échouer la requête.
 */
async function replaceChildren(supabase, table, recipeId, rows, { tolerateMissingTable = false } = {}) {
  const { error: delErr } = await supabase.from(table).delete().eq('recipe_id', recipeId)
  if (delErr) {
    if (tolerateMissingTable) return { count: 0, warning: `${table} non purgée : ${delErr.message}` }
    return { count: 0, error: `${table} (delete) : ${delErr.message}` }
  }
  if (!rows.length) return { count: 0 }
  const { error: insErr } = await supabase
    .from(table)
    .insert(rows.map(r => ({ ...r, recipe_id: recipeId })))
  if (insErr) {
    if (tolerateMissingTable) return { count: 0, warning: `${table} non sauvegardée : ${insErr.message}` }
    return { count: 0, error: `${table} (insert) : ${insErr.message}` }
  }
  return { count: rows.length }
}

export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}

  const { fields, errors } = parseRecipeFields(body || {}, { requireName: true })
  const { rows: ingredients, errors: ingErrors } = parseIngredients(body?.ingredients)
  const { rows: steps, errors: stepErrors } = parseSteps(body?.steps)
  const { rows: utensils, errors: utErrors } = parseUtensils(body?.utensils)
  const allErrors = [...errors, ...ingErrors, ...stepErrors, ...utErrors]
  if (allErrors.length) {
    return NextResponse.json({ error: allErrors.join(' ; ') }, { status: 400 })
  }

  if (!fields.role) fields.role = 'PLAT_PRINCIPAL' // colonne NOT NULL

  const { data: recipe, error: insErr } = await supabase
    .from('recipes')
    .insert(fields)
    .select()
    .single()
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  const warnings = []
  const ingRes = await replaceChildren(supabase, 'recipe_ingredients', recipe.id, ingredients)
  const stepRes = !ingRes.error
    ? await replaceChildren(supabase, 'recipe_steps', recipe.id, steps)
    : { count: 0 }
  const hardError = ingRes.error || stepRes.error
  if (hardError) {
    // Rollback best effort : la suppression de la recette cascade sur les enfants.
    await supabase.from('recipes').delete().eq('id', recipe.id)
    return NextResponse.json({ error: hardError }, { status: 500 })
  }
  const utRes = await replaceChildren(supabase, 'recipe_utensils', recipe.id, utensils, { tolerateMissingTable: true })
  if (utRes.warning) warnings.push(utRes.warning)

  return NextResponse.json({
    success: true,
    recipe,
    ingredients_count: ingRes.count,
    steps_count: stepRes.count,
    utensils_count: utRes.count,
    warnings: warnings.length ? warnings : undefined,
  }, { status: 201 })
}

export async function PUT(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const id = intIn(body?.id, 1, Number.MAX_SAFE_INTEGER)
  if (!id) return NextResponse.json({ error: 'id (entier) requis' }, { status: 400 })

  const { fields, errors } = parseRecipeFields(body || {}, { requireName: false })
  const parsedChildren = {}
  const childErrors = []
  if (Array.isArray(body?.ingredients)) {
    const { rows, errors: e } = parseIngredients(body.ingredients)
    parsedChildren.ingredients = rows; childErrors.push(...e)
  }
  if (Array.isArray(body?.steps)) {
    const { rows, errors: e } = parseSteps(body.steps)
    parsedChildren.steps = rows; childErrors.push(...e)
  }
  if (Array.isArray(body?.utensils)) {
    const { rows, errors: e } = parseUtensils(body.utensils)
    parsedChildren.utensils = rows; childErrors.push(...e)
  }
  const allErrors = [...errors, ...childErrors]
  if (allErrors.length) {
    return NextResponse.json({ error: allErrors.join(' ; ') }, { status: 400 })
  }

  // La recette existe ?
  const { data: existing, error: exErr } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })

  let recipe = null
  if (Object.keys(fields).length) {
    const { data, error: updErr } = await supabase
      .from('recipes')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    recipe = data
  } else {
    const { data } = await supabase.from('recipes').select('*').eq('id', id).single()
    recipe = data
  }

  const warnings = []
  const counts = {}
  if (parsedChildren.ingredients) {
    const r = await replaceChildren(supabase, 'recipe_ingredients', id, parsedChildren.ingredients)
    if (r.error) return NextResponse.json({ error: r.error }, { status: 500 })
    counts.ingredients_count = r.count
  }
  if (parsedChildren.steps) {
    const r = await replaceChildren(supabase, 'recipe_steps', id, parsedChildren.steps)
    if (r.error) return NextResponse.json({ error: r.error }, { status: 500 })
    counts.steps_count = r.count
  }
  if (parsedChildren.utensils) {
    const r = await replaceChildren(supabase, 'recipe_utensils', id, parsedChildren.utensils, { tolerateMissingTable: true })
    if (r.warning) warnings.push(r.warning)
    counts.utensils_count = r.count
  }

  return NextResponse.json({
    success: true,
    recipe,
    ...counts,
    warnings: warnings.length ? warnings : undefined,
  })
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  let id = intIn(searchParams.get('id'), 1, Number.MAX_SAFE_INTEGER)
  if (!id) {
    let body = {}
    try { body = await request.json() } catch {}
    id = intIn(body?.id, 1, Number.MAX_SAFE_INTEGER)
  }
  if (!id) return NextResponse.json({ error: 'id (entier) requis' }, { status: 400 })

  // Les enfants directs (ingredients, steps, tags, pairings, nutrition_cache,
  // instructions) sont en ON DELETE CASCADE en base — pas de purge manuelle.
  // recipe_utensils (si la table est créée un jour) : purge best effort.
  await supabase.from('recipe_utensils').delete().eq('recipe_id', id)

  const { data: deleted, error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    // 23503 = violation FK (planned_meals / user_recipe_interactions / sub_recipe RESTRICT)
    const status = error.code === '23503' ? 409 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  if (!deleted?.length) return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })

  return NextResponse.json({ success: true })
}
