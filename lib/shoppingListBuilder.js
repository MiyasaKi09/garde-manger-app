/**
 * Construction de la liste de courses — déterministe, stock-aware, SANS API.
 *
 * On reconstruit la liste COMPLÈTE directement depuis les descriptions de repas
 * du plan (« Plat: 170g poulet + 3 œufs + 150g passata… »), sans dépendre du
 * matching de recettes (trop fragile). Chaque ingrédient est résolu au niveau
 * canonique, les quantités sommées sur la semaine, puis le stock est déduit.
 */

import { parsePlanMeal } from '@/lib/recipeImporter'
import { loadResolverData, resolveIngredient, normalizeFood } from '@/lib/ingredientResolver'

const CATEGORIES = {
  poulet: 'Protéines', dinde: 'Protéines', boeuf: 'Protéines', porc: 'Protéines',
  saumon: 'Protéines', cabillaud: 'Protéines', saucisse: 'Protéines', steak: 'Protéines',
  viande: 'Protéines', filet: 'Protéines', jambon: 'Protéines', lieu: 'Protéines',
  dorade: 'Protéines', poisson: 'Protéines', lardon: 'Protéines', oeuf: 'Crémerie',
  skyr: 'Crémerie', creme: 'Crémerie', crème: 'Crémerie', lait: 'Crémerie', fromage: 'Crémerie',
  gruyère: 'Crémerie', emmental: 'Crémerie', mozzarella: 'Crémerie', beurre: 'Crémerie',
  parmesan: 'Crémerie', yaourt: 'Crémerie', comté: 'Crémerie', feta: 'Crémerie',
  riz: 'Féculents', pâtes: 'Féculents', pate: 'Féculents', semoule: 'Féculents', pomme: 'Féculents',
  pain: 'Féculents', tortilla: 'Féculents', quinoa: 'Féculents', boulgour: 'Féculents',
  polenta: 'Féculents', grenaille: 'Féculents', pdt: 'Féculents', frites: 'Féculents', naan: 'Féculents',
  tomate: 'Légumes', oignon: 'Légumes', carotte: 'Légumes', poivron: 'Légumes',
  courgette: 'Légumes', brocoli: 'Légumes', haricot: 'Légumes', champignon: 'Légumes',
  asperge: 'Légumes', navet: 'Légumes', radis: 'Légumes', salade: 'Légumes',
  chou: 'Légumes', poireau: 'Légumes', endive: 'Légumes', concombre: 'Légumes',
  betterave: 'Légumes', mâche: 'Légumes', courge: 'Légumes', aubergine: 'Légumes',
  amande: 'Épicerie', noix: 'Épicerie', huile: 'Épicerie', passata: 'Conserves',
  concentré: 'Conserves', conserve: 'Conserves', lentille: 'Conserves', pois: 'Conserves', soja: 'Conserves',
}

/** Normalise une quantité vers une unité de base (g / ml / pièce). */
function baseUnit(unit) {
  const u = normalizeFood(unit || '')
  if (['g', 'gr', 'gramme', 'grammes'].includes(u)) return { f: 1, u: 'g' }
  if (['kg', 'kilo', 'kilos'].includes(u)) return { f: 1000, u: 'g' }
  if (u === 'mg') return { f: 0.001, u: 'g' }
  if (['l', 'litre', 'litres'].includes(u)) return { f: 1000, u: 'ml' }
  if (u === 'cl') return { f: 10, u: 'ml' }
  if (u === 'ml') return { f: 1, u: 'ml' }
  return { f: 1, u: 'pièce' }
}

function pickCategory(name) {
  const nl = normalizeFood(name)
  for (const [kw, cat] of Object.entries(CATEGORIES)) {
    if (nl.includes(normalizeFood(kw))) return cat
  }
  return 'Épicerie'
}

/**
 * Reconstruit la liste complète d'un import depuis ses repas, en déduisant le
 * stock. Remplace la liste existante. Renvoie { items } ou { aborted, reason }.
 */
export async function rebuildShoppingListFromImport(supabase, userId, importId) {
  const { data: meals } = await supabase
    .from('nutrition_plan_meals')
    .select('description')
    .eq('import_id', importId)

  const rawIngs = []
  for (const m of (meals || [])) {
    const p = parsePlanMeal(m.description)
    if (p) for (const ing of p.ingredients) rawIngs.push(ing)
  }
  // Sécurité : ne pas écraser une liste si l'extraction n'a presque rien donné.
  if (rawIngs.length < 5) {
    return { aborted: true, reason: 'Pas assez d\'ingrédients détectés dans le plan — liste inchangée' }
  }

  const [{ data: cfsName }, { data: archsName }, resolverData] = await Promise.all([
    supabase.from('canonical_foods').select('id, canonical_name'),
    supabase.from('archetypes').select('id, name, canonical_food_id'),
    loadResolverData(supabase, userId),
  ])
  const { candidates, stock } = resolverData
  const cName = new Map((cfsName || []).map(c => [c.id, c.canonical_name]))
  const aName = new Map((archsName || []).map(a => [a.id, a.name]))
  const aCanon = new Map((archsName || []).map(a => [a.id, a.canonical_food_id]))

  // Agrégation par entité (canonique/archétype) + unité de base.
  const agg = new Map()
  for (const ing of rawIngs) {
    const r = resolveIngredient(ing, { candidates, stock })
    const cfId = r.canonical_food_id ?? (r.archetype_id ? aCanon.get(r.archetype_id) : null)
    const name = r.archetype_id ? aName.get(r.archetype_id)
      : r.canonical_food_id ? cName.get(r.canonical_food_id)
      : (ing.name || '').trim()
    if (!name) continue
    const bu = baseUnit(ing.unit)
    const entity = r.archetype_id ? `a${r.archetype_id}`
      : r.canonical_food_id ? `c${r.canonical_food_id}`
      : `n:${normalizeFood(name)}`
    const key = `${entity}|${bu.u}`
    if (!agg.has(key)) {
      agg.set(key, { name, canonicalFoodId: cfId, archetypeId: r.archetype_id ?? null, unit: bu.u, qty: 0 })
    }
    agg.get(key).qty += (ing.quantity || 0) * bu.f
  }

  // Stock par canonique résolu.
  const { data: stockData } = await supabase
    .from('inventory_lots_resolved')
    .select('resolved_canonical_food_id, qty_remaining')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  const stockById = new Map()
  for (const lot of (stockData || [])) {
    const id = lot.resolved_canonical_food_id
    if (!id) continue
    stockById.set(id, (stockById.get(id) || 0) + (lot.qty_remaining || 0))
  }

  // Articles (déduits du stock).
  const items = []
  for (const a of agg.values()) {
    if (a.qty <= 0) continue
    const inStock = a.canonicalFoodId != null ? (stockById.get(a.canonicalFoodId) || 0) : 0
    const needed = Math.max(0, a.qty - inStock)
    if (needed <= 0) continue

    const unitLabel = a.unit === 'pièce' ? (Math.round(needed) > 1 ? ' pièces' : ' pièce') : ' ' + a.unit
    const qtyStr = `${Math.round(needed)}${unitLabel}`
    const stockNote = inStock > 0 ? `${Math.round(inStock)} ${a.unit} en stock` : null

    items.push({
      import_id: importId,
      week_label: 'S1',
      category: pickCategory(a.name),
      product_name: a.name,
      quantity: stockNote ? `${qtyStr} (${stockNote})` : qtyStr,
      checked: false,
      canonical_food_id: a.canonicalFoodId ?? null,
      archetype_id: a.archetypeId ?? null,
      notes: null,
    })
  }

  if (!items.length) {
    return { aborted: true, reason: 'Liste reconstruite vide — liste inchangée' }
  }

  await supabase.from('nutrition_plan_shopping_items').delete().eq('import_id', importId)
  await supabase.from('nutrition_plan_shopping_items').insert(items)
  return { items: items.length }
}
