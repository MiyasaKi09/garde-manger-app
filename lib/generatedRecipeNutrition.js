/**
 * Nutrition canonique des recettes générées (Routine / plan / IA).
 *
 * Source de vérité unique pour recalculer la nutrition d'une recette générée à
 * partir de ses ingrédients RÉSOLUS (generated_recipe_ingredients → canonical /
 * archetype → CIQUAL). S'appuie sur la fonction SQL
 * `calculate_generated_recipe_nutrition` (conversion des unités en grammes +
 * overrides d'archétype + modificateurs de process), puis écrit le résultat
 * dans `generated_recipes.nutrition_per_serving`.
 *
 * À appeler après chaque (re)liaison d'ingrédients : self-heal à l'affichage,
 * backfill global, ou correction manuelle d'un lien.
 */

/**
 * Recalcule et persiste la nutrition par portion d'une recette générée.
 * @param {object} supabase  client Supabase (serveur, RLS de l'utilisateur)
 * @param {number} recipeId  id de la recette générée
 * @returns {Promise<object|null>}  { kcal, protein_g, carbs_g, fat_g, fiber_g,
 *   source:'ciqual', computed_at } ou null si le calcul n'a rien donné.
 */
export async function recomputeGeneratedNutrition(supabase, recipeId) {
  if (!recipeId) return null

  const { data, error } = await supabase.rpc('calculate_generated_recipe_nutrition', {
    gen_recipe_id_param: recipeId,
  })
  if (error) throw new Error(`Calcul nutrition recette ${recipeId}: ${error.message}`)

  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  const kcal = Number(row.kcal) || 0
  // Aucune valeur exploitable (recette sans ingrédient lié / quantifié) → ne pas écraser.
  if (kcal <= 0) return null

  const nutrition = {
    kcal: Math.round(kcal),
    protein_g: round1(row.protein_g),
    carbs_g: round1(row.carbs_g),
    fat_g: round1(row.fat_g),
    fiber_g: round1(row.fiber_g),
    // Micronutriments par portion (clés alignées sur nutritional_data / page nutrition).
    micronutrients: normalizeMicros(row.micros),
    source: 'ciqual',
    computed_at: new Date().toISOString(),
  }

  const { error: updErr } = await supabase
    .from('generated_recipes')
    .update({ nutrition_per_serving: nutrition })
    .eq('id', recipeId)
  if (updErr) throw new Error(`Écriture nutrition recette ${recipeId}: ${updErr.message}`)

  return nutrition
}

/**
 * Recalcule la nutrition d'un lot de recettes générées (best-effort : une erreur
 * sur une recette n'interrompt pas les autres).
 * @returns {Promise<{updated:number, failed:number}>}
 */
export async function recomputeGeneratedNutritionBatch(supabase, recipeIds = []) {
  let updated = 0
  let failed = 0
  for (const id of recipeIds) {
    try {
      const res = await recomputeGeneratedNutrition(supabase, id)
      if (res) updated++
    } catch {
      failed++
    }
  }
  return { updated, failed }
}

function round1(v) {
  return Math.round((Number(v) || 0) * 10) / 10
}

/**
 * Normalise le jsonb de micros de la RPC : valeurs numériques (la RPC peut les
 * renvoyer en texte selon le driver), clés à valeur nulle/zéro retirées pour ne
 * garder qu'un objet propre. Retourne null si aucun micro exploitable.
 */
function normalizeMicros(micros) {
  if (!micros || typeof micros !== 'object') return null
  const out = {}
  for (const [k, v] of Object.entries(micros)) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) out[k] = n
  }
  return Object.keys(out).length ? out : null
}
