/**
 * Enrichissement stock-aware de la liste de courses — déterministe, SANS API.
 *
 * Approche NON DESTRUCTIVE : on ne supprime ni ne reconstruit jamais la liste.
 * On enrichit chaque article existant EN PLACE :
 *   - résolution du nom → entité canonique/archétype (lib/ingredientResolver.js)
 *   - marquage « déjà en stock » si l'aliment est présent dans l'inventaire
 *
 * (La reconstruction depuis les recettes a été abandonnée : matching plat→recette
 *  trop fragile — ~36 % — et destructeur.)
 */

import { loadResolverData, resolveIngredient } from '@/lib/ingredientResolver'

const STOCK_MARK = ' · déjà en stock'

/**
 * Enrichit en place les articles de la liste d'un import.
 * @returns {{ items, enriched, inStock } | { aborted, reason }}
 */
export async function rebuildShoppingListFromImport(supabase, userId, importId) {
  const { data: items } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, quantity')
    .eq('import_id', importId)

  if (!items?.length) {
    return { aborted: true, reason: 'Liste vide — rien à enrichir' }
  }

  const { candidates, stock } = await loadResolverData(supabase, userId)

  let enriched = 0
  let inStockCount = 0
  for (const item of items) {
    const r = resolveIngredient(item.product_name, { candidates, stock })
    const inStock = r.match_status === 'stock'

    // Idempotent : retire un éventuel marqueur précédent avant de ré-appliquer.
    const baseQty = String(item.quantity || '').split(STOCK_MARK)[0]
    const newQty = inStock ? baseQty + STOCK_MARK : baseQty

    const patch = {
      // Contrainte « pas les deux » : archétype → archetype_id seul, sinon canonique.
      canonical_food_id: r.archetype_id ? null : (r.canonical_food_id ?? null),
      archetype_id: r.archetype_id ?? null,
      quantity: newQty,
    }
    const { error } = await supabase
      .from('nutrition_plan_shopping_items')
      .update(patch)
      .eq('id', item.id)
    if (!error) {
      enriched++
      if (inStock) inStockCount++
    }
  }

  return { items: items.length, enriched, inStock: inStockCount }
}
