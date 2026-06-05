/**
 * Importeur de recettes depuis le plan — déterministe, SANS API.
 *
 * Les descriptions de repas (nutrition_plan_meals) contiennent les ingrédients :
 *   « Chakchouka au poulet: 170g poulet + 3 œufs + 150g passata + poivrons »
 * On en extrait nom + ingrédients pour créer/dédupliquer des generated_recipes.
 * Objectif (vision utilisateur) : la base de recettes grossit toute seule, et
 * chaque plat du plan devient retrouvable + reliable au stock — sans appel IA.
 *
 * Les étapes (steps) restent vides (pas d'API) ; elles seront générées à la
 * demande quand l'utilisateur ouvre la recette.
 */

import { normalizeRecipeName, cleanRecipeName, cleanIngredientName } from '@/lib/recipeNormalizer'
import { parseIngredient } from '@/lib/ingredientResolver'

/**
 * Parse une description de repas en { name, ingredients[] }.
 * Gère le format « Plat: a + b + c » (77 % des cas) et, à défaut, « Plat 340g + b ».
 */
export function parsePlanMeal(desc) {
  if (!desc) return null
  let name, body
  const colon = desc.indexOf(':')
  if (colon > 0 && colon < 60) {
    name = desc.slice(0, colon).trim()
    body = desc.slice(colon + 1)
  } else {
    // Pas de ':' → nom = texte avant la 1re quantité ; on saute la 1re part
    // (qui contient le nom) pour ne pas en faire un faux ingrédient.
    const m = desc.match(/\s\d/)
    name = (m ? desc.slice(0, m.index) : desc).trim()
    const parts = desc.split('+')
    body = parts.length > 1 ? parts.slice(1).join('+') : ''
  }
  name = name.replace(/[\s+\-–]+$/, '').trim()
  if (!name || name.length < 3) return null

  const ingredients = []
  for (const part of body.split('+').map(s => s.trim()).filter(Boolean)) {
    const pi = parseIngredient(part)
    // Nettoie le nom : parenthèses « (140g) » + quantité résiduelle en fin.
    let nm = cleanIngredientName(pi.raw_name || '')
      .replace(/\s*\d+[.,]?\d*\s*(?:g|kg|mg|ml|cl|l)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (nm.length > 1 && !/^\d+$/.test(nm)) {
      ingredients.push({ name: nm, quantity: pi.quantity, unit: pi.unit, notes: null })
    }
  }
  return { name, ingredients }
}

const coreTokens = norm => new Set((norm || '').split('-').filter(t => t.length >= 3))

/** Dédup recette : exact → préfixe → containment → recouvrement (≥ 0.6). */
export function matchRecipe(norm, recipes) {
  const exact = recipes.find(r => r.name_normalized === norm)
  if (exact) return exact
  const prefix = recipes.find(r =>
    r.name_normalized?.startsWith(norm + '-') || norm.startsWith(r.name_normalized + '-'))
  if (prefix) return prefix

  const want = coreTokens(norm)
  if (!want.size) return null
  // Containment : tous les tokens de l'un sont dans l'autre (« basquaise » ⊆
  // « poulet-basquaise »). Préfère le plus de tokens communs.
  let best = null, bestScore = 0
  for (const r of recipes) {
    const have = coreTokens(r.name_normalized)
    if (!have.size) continue
    let shared = 0
    for (const t of want) if (have.has(t)) shared++
    const contained = shared === want.size || shared === have.size
    const score = shared / Math.max(want.size, have.size)
    const eff = contained ? Math.max(score, 0.75) : score
    if (eff > bestScore) { bestScore = eff; best = r }
  }
  return bestScore >= 0.6 ? best : null
}

/**
 * Garantit qu'un generated_recipe existe pour chaque plat du plan (dédup flou).
 * Crée les nouveaux avec leurs ingrédients extraits ; complète ceux sans
 * ingrédients. Ne crée jamais de recette vide. Idempotent.
 *
 * @returns {{ dishes, created, updated, matched }}
 */
export async function ensureRecipesForImport(supabase, userId, importId) {
  const { data: meals } = await supabase
    .from('nutrition_plan_meals')
    .select('meal_type, description')
    .eq('import_id', importId)
    .in('meal_type', ['dejeuner', 'diner'])

  // Dédup des plats du plan (on garde la variante avec le plus d'ingrédients)
  const dishes = new Map()
  for (const m of (meals || [])) {
    const parsed = parsePlanMeal(m.description)
    if (!parsed) continue
    const clean = cleanRecipeName(parsed.name) || parsed.name
    const norm = normalizeRecipeName(clean)
    if (!norm) continue
    const prev = dishes.get(norm)
    if (!prev || parsed.ingredients.length > prev.ingredients.length) {
      dishes.set(norm, { name: clean, ingredients: parsed.ingredients })
    }
  }
  if (!dishes.size) return { dishes: 0, created: 0, updated: 0, matched: 0 }

  const { data: existing } = await supabase
    .from('generated_recipes')
    .select('id, name_normalized, steps, ingredients')
    .eq('user_id', userId)
  const pool = existing || []

  let created = 0, updated = 0, matched = 0
  for (const [norm, dish] of dishes) {
    const hit = matchRecipe(norm, pool)
    if (hit) {
      matched++
      const hasIng = Array.isArray(hit.ingredients) && hit.ingredients.length > 0
      if (!hasIng && dish.ingredients.length) {
        await supabase.from('generated_recipes')
          .update({ ingredients: dish.ingredients }).eq('id', hit.id)
        hit.ingredients = dish.ingredients
        updated++
      }
      continue
    }
    if (!dish.ingredients.length) continue // ne pas créer de recette vide
    const { data: ins } = await supabase
      .from('generated_recipes')
      .insert({
        user_id: userId, name_normalized: norm, title: dish.name,
        ingredients: dish.ingredients, steps: [], servings: 2, source: 'plan',
      })
      .select('id, name_normalized, ingredients, steps')
      .single()
    if (ins) { created++; pool.push(ins) } // réutilisable pour la dédup intra-lot
  }
  return { dishes: dishes.size, created, updated, matched }
}
