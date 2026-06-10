/**
 * Construction de la liste de courses — déterministe, stock-aware, SANS API.
 *
 * Hybride, robuste à tous les formats de plan :
 *   A. Si les descriptions de repas contiennent les ingrédients
 *      (« Plat: 170g poulet + 3 œufs + … ») → on RECONSTRUIT la liste complète :
 *      tous les ingrédients, agrégés au canonique, quantités sommées, stock déduit.
 *   B. Sinon (descriptions = noms de plats) → on ENRICHIT la liste existante
 *      EN PLACE : on résout chaque article → entité canonique (le rend
 *      « rangeable » au stock) et on marque « en stock » le cas échéant.
 *      Non destructeur : on ne supprime jamais une liste qu'on ne peut pas
 *      reconstruire.
 */

import { parsePlanMeal } from '@/lib/recipeImporter'
import { loadResolverData, resolveIngredient, normalizeFood } from '@/lib/ingredientResolver'
import { convertWithMeta, unitClass } from '@/lib/units'

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

const STOCK_MARK = ' · en stock'

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

  const { candidates, stock } = await loadResolverData(supabase, userId)

  // ── A. Reconstruction complète depuis les repas ──
  if (rawIngs.length >= 5) {
    return rebuildFromIngredients(supabase, userId, importId, rawIngs, candidates, stock)
  }

  // ── B. Repli : enrichir la liste existante en place (non destructeur) ──
  return enrichExisting(supabase, importId, candidates, stock)
}

async function rebuildFromIngredients(supabase, userId, importId, rawIngs, candidates, stock) {
  const [{ data: cfsName }, { data: archsName }] = await Promise.all([
    supabase.from('canonical_foods').select('id, canonical_name, unit_weight_grams, density_g_per_ml'),
    supabase.from('archetypes').select('id, name, canonical_food_id'),
  ])
  const cName = new Map((cfsName || []).map(c => [c.id, c.canonical_name]))
  // Métadonnées de conversion (pièce ↔ g ↔ ml) au niveau canonique
  const cMeta = new Map((cfsName || []).map(c => [c.id, {
    grams_per_unit: c.unit_weight_grams || 0,
    density_g_per_ml: c.density_g_per_ml || 0,
  }]))
  const aName = new Map((archsName || []).map(a => [a.id, a.name]))
  const aCanon = new Map((archsName || []).map(a => [a.id, a.canonical_food_id]))

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

  const stockById = await stockLotsByCanonical(supabase, userId)

  // Préserver l'état coché + le lien vers les lots créés à travers la reconstruction
  const { data: prevItems } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('product_name, checked, created_lot_ids')
    .eq('import_id', importId)
  const prevByName = new Map((prevItems || []).map(p => [normalizeFood(p.product_name), p]))

  const items = []
  for (const a of agg.values()) {
    if (a.qty <= 0) continue
    let inStock = 0
    let incomparable = false
    if (a.canonicalFoodId != null) {
      const meta = cMeta.get(a.canonicalFoodId) || {}
      const r = deductibleStock(stockById.get(a.canonicalFoodId), a.unit, meta)
      inStock = r.qty
      incomparable = r.incomparable
    }
    const needed = Math.max(0, a.qty - inStock)
    if (needed <= 0) continue
    const unitLabel = a.unit === 'pièce' ? (Math.round(needed) > 1 ? ' pièces' : ' pièce') : ' ' + a.unit
    const qtyStr = `${Math.round(needed)}${unitLabel}`
    const noteParts = []
    if (inStock > 0) noteParts.push(`${Math.round(inStock)} ${a.unit} en stock`)
    if (incomparable) noteParts.push('stock non comparable')
    const prev = prevByName.get(normalizeFood(a.name))
    items.push({
      import_id: importId, week_label: 'S1', category: pickCategory(a.name),
      product_name: a.name,
      quantity: noteParts.length ? `${qtyStr} (${noteParts.join(' · ')})` : qtyStr,
      checked: prev?.checked ?? false,
      created_lot_ids: prev?.checked ? (prev.created_lot_ids ?? null) : null,
      canonical_food_id: a.canonicalFoodId ?? null,
      archetype_id: a.archetypeId ?? null,
      notes: null,
    })
  }

  if (!items.length) {
    // Reconstruction vide → on n'écrase pas, on enrichit l'existant.
    return enrichExisting(supabase, importId, candidates, stock)
  }

  await supabase.from('nutrition_plan_shopping_items').delete().eq('import_id', importId)
  await supabase.from('nutrition_plan_shopping_items').insert(items)
  return { items: items.length, mode: 'rebuilt' }
}

async function enrichExisting(supabase, importId, candidates, stock) {
  const { data: existing } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id, product_name, quantity')
    .eq('import_id', importId)

  if (!existing?.length) {
    return { aborted: true, reason: 'Aucun repas exploitable ni liste à enrichir' }
  }

  let enriched = 0, inStockCount = 0
  for (const it of existing) {
    const r = resolveIngredient(it.product_name, { candidates, stock })
    const inStock = r.match_status === 'stock'
    const baseQty = String(it.quantity || '').split(STOCK_MARK)[0]
    const { error } = await supabase
      .from('nutrition_plan_shopping_items')
      .update({
        canonical_food_id: r.canonical_food_id ?? null,
        archetype_id: r.archetype_id ?? null,
        quantity: inStock ? baseQty + STOCK_MARK : baseQty,
      })
      .eq('id', it.id)
    if (!error) {
      enriched++
      if (inStock) inStockCount++
    }
  }
  return { items: existing.length, enriched, inStock: inStockCount, mode: 'enriched' }
}

/** Lots en stock groupés par canonique, AVEC leur unité (pas de somme aveugle). */
async function stockLotsByCanonical(supabase, userId) {
  const { data } = await supabase
    .from('inventory_lots_resolved')
    .select('resolved_canonical_food_id, qty_remaining, unit')
    .eq('user_id', userId)
    .gt('qty_remaining', 0)
  const m = new Map()
  for (const lot of (data || [])) {
    const id = lot.resolved_canonical_food_id
    if (!id) continue
    if (!m.has(id)) m.set(id, [])
    m.get(id).push({ qty: lot.qty_remaining || 0, unit: lot.unit })
  }
  return m
}

// Unités libres des lots → codes lib/units.js (g/kg/ml/cl/l/u)
const UNIT_CODES = {
  g: 'g', gr: 'g', gramme: 'g', grammes: 'g',
  kg: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'ml', cl: 'cl', l: 'l', litre: 'l', litres: 'l',
  u: 'u', unite: 'u', unites: 'u', piece: 'u', pieces: 'u', pc: 'u', pcs: 'u',
}

function unitCode(unit) {
  return UNIT_CODES[normalizeFood(unit || '')] ?? null
}

/**
 * Somme du stock convertible vers l'unité du besoin (g / ml / pièce),
 * via convertWithMeta (unit_weight_grams → grams_per_unit, density_g_per_ml).
 *
 * Un lot dont l'unité est inconnue, ou dont la conversion cross-classe est
 * impossible faute de métadonnées, n'est PAS déduit (sur-acheter vaut mieux
 * que manquer) → incomparable: true pour annoter la liste.
 */
function deductibleStock(lots, needUnit, meta = {}) {
  const target = needUnit === 'pièce' ? 'u' : needUnit
  const targetClass = unitClass(target)
  let total = 0
  let incomparable = false

  for (const lot of (lots || [])) {
    const qty = Number(lot.qty || 0)
    if (qty <= 0) continue

    const code = unitCode(lot.unit)
    const lotClass = code ? unitClass(code) : null
    if (!lotClass || !targetClass) { incomparable = true; continue }

    // Même classe (masse↔masse, volume↔volume, pièce↔pièce) : toujours fiable
    if (lotClass === targetClass) {
      total += convertWithMeta(qty, code, target, meta).qty
      continue
    }

    // Cross-classe : uniquement avec métadonnées explicites du canonique
    const gPerUnit = Number(meta.grams_per_unit || 0)
    const density = Number(meta.density_g_per_ml || 0)
    const pair = [lotClass, targetClass].sort().join('-')
    const convertible =
      (pair === 'count-mass' && gPerUnit > 0) ||
      (pair === 'mass-vol' && density > 0) ||
      (pair === 'count-vol' && gPerUnit > 0 && density > 0)

    if (!convertible) { incomparable = true; continue }

    total += convertWithMeta(qty, code, target, {
      grams_per_unit: gPerUnit,
      density_g_per_ml: density || 1,
    }).qty
  }

  return { qty: total, incomparable }
}
