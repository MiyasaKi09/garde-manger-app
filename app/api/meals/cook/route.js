import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules'
import { allocateConsumption } from '@/lib/stockAllocator'

export const dynamic = 'force-dynamic'

const NUTRI_FIELDS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g']

const round1 = (v) => Math.round(v * 10) / 10
// portions_cooked / portions_remaining sont numeric en base : on travaille au
// demi (0,5 / 1,5 / …) — arrondi au 0,5 le plus proche.
const roundHalf = (v) => Math.round(v * 2) / 2

/**
 * Lien reste ↔ créneau : on stocke un marqueur parsable dans cooked_dishes.notes
 * (`[slot:YYYY-MM-DD|meal_type]`). Choix retenu plutôt que la recherche par
 * user + source_meal_type + cooked_at : le marqueur reste exact même si deux
 * restes sont créés le même jour pour des créneaux différents, ou si on valide
 * un créneau d'une autre date que celle du jour de cuisine.
 */
const slotMarker = (mealDate, mealType) => `[slot:${mealDate}|${mealType}]`
const slotMarkerLike = (mealDate, mealType) =>
  `%${slotMarker(mealDate, mealType).replace(/[%_]/g, '\\$&')}%`

const entryPortions = (e) => {
  const p = Number(e?.portions_eaten)
  return Number.isFinite(p) && p > 0 ? p : 1
}

/**
 * POST /api/meals/cook — Marque un repas du plan comme « cuisiné / mangé ».
 *   - logue la nutrition du jour dans meal_log (une ligne par personne,
 *     micronutriments inclus) ;
 *   - déduit les lots choisis de l'inventaire ;
 *   - si `portions_prepared` > portions mangées : crée un reste (cooked_dishes)
 *     avec nutrition PAR PORTION dérivée des entries et DLC frigo
 *     (min(+3 j, DLC des lots utilisés)) ;
 *   - si `eaten_dish_id` : le repas est un reste existant → décrémente ses
 *     portions (pas de nouveau reste, pas de re-déduction de stock attendue) ;
 *   - si `batch_recipe_id` : décrémente une portion du plat batch correspondant.
 *
 * Idempotent sur le créneau (date + type) : les logs sont remplacés, et le reste
 * éventuellement créé par une validation précédente du même créneau est
 * supprimé puis recréé (retrouvé via le marqueur `[slot:...]` dans notes).
 * La décrémentation d'un plat (batch ou reste mangé) n'a lieu qu'à la PREMIÈRE
 * validation du créneau (pas de double décompte en revalidation) — pour changer
 * les portions consommées d'un plat, annuler (DELETE) puis revalider.
 *
 * body: {
 *   meal_date, meal_type, dish_name?,
 *   entries: [{ person_name, kcal, protein_g, carbs_g, fat_g, fiber_g,
 *               portions_eaten?, micronutrients? }],
 *     // kcal/macros d'une entry = TOTAL mangé par la personne
 *     // (déjà multiplié par portions_eaten côté client)
 *   deductions: [{ lot_id, quantity_used, unit?, product_name? }],
 *   batch_recipe_id?,        // repas issu d'un batch
 *   eaten_dish_id?,          // le repas mangé EST un reste existant (cooked_dishes.id)
 *   portions_prepared?       // total préparé ; surplus → reste
 * }
 *
 * Réponse: { success, logged, deducted, batchConsumed, leftover }
 *   - batchConsumed : portions décomptées du plat (batch ou reste mangé)
 *   - leftover : { id, name, portions_remaining, expiration_date } | null
 *
 * Limites connues :
 *   - portions_cooked / portions_remaining sont numeric en base : les
 *     demi-portions sont supportées (arrondi au 0,5 le plus proche, min 0,5
 *     pour un reste créé et pour un décrément de plat) ;
 *   - la revalidation d'un créneau recrée le reste de zéro : les portions déjà
 *     mangées sur l'ancien reste de ce créneau ne sont pas préservées.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const {
    meal_date, meal_type, dish_name,
    entries = [], deductions = [], needs = [],
    batch_recipe_id, eaten_dish_id, portions_prepared,
  } = body || {}
  if (!meal_date || !meal_type) {
    return NextResponse.json({ error: 'meal_date et meal_type requis' }, { status: 400 })
  }

  const validEntries = (entries || []).filter(e => e && e.person_name)
  const portionsEaten = validEntries.reduce((s, e) => s + entryPortions(e), 0)

  // Le créneau était-il déjà loggé ? (évite de re-décompter une portion de plat
  // — batch ou reste — si on re-marque le même repas sans l'avoir d'abord annulé).
  const { data: priorLog } = await supabase
    .from('meal_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)
    .limit(1)
  const alreadyLogged = (priorLog?.length || 0) > 0

  // Plat consommé : reste existant (eaten_dish_id) ou plat batch (batch_recipe_id)
  let consumedDish = null
  if (eaten_dish_id) {
    const { data: dish, error: dishErr } = await supabase
      .from('cooked_dishes')
      .select('id, name, portions_cooked, portions_remaining, kcal_per_portion, protein_g_per_portion, carbs_g_per_portion, fat_g_per_portion, fiber_g_per_portion')
      .eq('id', eaten_dish_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (dishErr || !dish) {
      return NextResponse.json({ error: 'Reste introuvable' }, { status: 404 })
    }
    consumedDish = dish
  } else if (batch_recipe_id) {
    const { data: dish } = await supabase
      .from('cooked_dishes')
      .select('id, portions_cooked, portions_remaining')
      .eq('user_id', user.id)
      .eq('batch_recipe_id', batch_recipe_id)
      .gt('portions_remaining', 0)
      .order('expiration_date', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (dish) consumedDish = dish
  }

  // 1. Nutrition du jour — remplace les logs du créneau (idempotent)
  await supabase
    .from('meal_log')
    .delete()
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)

  const logRows = validEntries.map(e => {
    const p = entryPortions(e)
    // Fallback nutrition : si l'entry n'a pas de valeur et qu'on mange un reste
    // qui connaît sa nutrition par portion, on calcule total = per_portion × portions.
    const val = (field) => {
      if (e[field] != null) return e[field]
      const per = eaten_dish_id ? consumedDish?.[`${field}_per_portion`] : null
      return per != null ? round1(Number(per) * p) : null
    }
    return {
      user_id: user.id,
      person_name: e.person_name,
      meal_date,
      meal_type,
      description: dish_name || consumedDish?.name || null,
      portions_eaten: p,
      kcal: val('kcal'),
      protein_g: val('protein_g'),
      carbs_g: val('carbs_g'),
      fat_g: val('fat_g'),
      fiber_g: val('fiber_g'),
      micronutrients: (e.micronutrients && typeof e.micronutrients === 'object') ? e.micronutrients : null,
      cooked_dish_id: consumedDish?.id ?? null,
    }
  })

  if (logRows.length) {
    const { error: logErr } = await supabase.from('meal_log').insert(logRows)
    if (logErr) {
      return NextResponse.json({ error: `Log nutrition: ${logErr.message}` }, { status: 500 })
    }
  }

  // 2a. Besoins « automatiques » : { canonical_food_id | archetype_id, qty, unit }
  //     → répartition multi-lots (lot ouvert d'abord, puis FEFO, un seul lot
  //     entamé) via lib/stockAllocator ; le trigger SQL auto_open_lot marque
  //     « ouvert » le lot partiellement consommé et réduit sa DLC.
  //     Ex : 5 bouteilles de 1 L, besoin 1,5 L → 1 vidée + 0,5 L sur la 2e.
  const allDeductions = [...(deductions || [])]
  const shortfalls = []
  for (const n of (needs || [])) {
    const qty = Number(n?.qty)
    if (!(qty > 0) || !n?.unit || (!n?.canonical_food_id && !n?.archetype_id)) continue

    let lotQuery = supabase
      .from('inventory_lots_resolved')
      .select('id, qty_remaining, unit, expiration_date, user_id')
      .eq('user_id', user.id)
      .gt('qty_remaining', 0)
    lotQuery = n.canonical_food_id
      ? lotQuery.eq('resolved_canonical_food_id', n.canonical_food_id)
      : lotQuery.eq('resolved_archetype_id', n.archetype_id)
    const { data: candidateLots } = await lotQuery

    if (!candidateLots?.length) {
      shortfalls.push({ ...n, missing: qty })
      continue
    }

    // is_opened / adjusted ne sont pas exposés par la vue : on les recharge
    const ids = candidateLots.map(l => l.id)
    const { data: fullLots } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit, is_opened, expiration_date, adjusted_expiration_date')
      .in('id', ids)

    let meta = {}
    if (n.canonical_food_id) {
      const { data: cf } = await supabase
        .from('canonical_foods')
        .select('unit_weight_grams, density_g_per_ml')
        .eq('id', n.canonical_food_id)
        .maybeSingle()
      meta = { grams_per_unit: cf?.unit_weight_grams, density_g_per_ml: cf?.density_g_per_ml }
    }

    const { allocations, shortfall } = allocateConsumption(fullLots || [], qty, n.unit, meta)
    for (const a of allocations) {
      allDeductions.push({ lot_id: a.lot_id, quantity_used: a.qty_in_lot_unit })
    }
    if (shortfall > 0) shortfalls.push({ ...n, missing: shortfall })
  }

  // 2b. Déduction du stock (on garde les DLC des lots pour la DLC du reste éventuel)
  let deductedCount = 0
  const usedLots = []
  for (const d of allDeductions) {
    const lotId = d?.lot_id
    const qty = Number(d?.quantity_used)
    if (!lotId || !(qty > 0)) continue
    const { data: lot, error: lotErr } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, adjusted_expiration_date, expiration_date, best_before')
      .eq('id', lotId)
      .eq('user_id', user.id)
      .single()
    if (lotErr || !lot) continue
    const newQty = Math.max(0, (lot.qty_remaining || 0) - qty)
    const { error: updErr } = await supabase
      .from('inventory_lots')
      .update({ qty_remaining: newQty })
      .eq('id', lotId)
      .eq('user_id', user.id)
    if (!updErr) {
      deductedCount++
      usedLots.push(lot)
    }
  }

  // 3. Décrément du plat consommé (reste mangé ou portion de batch).
  //    Une seule fois par créneau (cf. JSDoc).
  let dishConsumed = 0
  if (consumedDish && !alreadyLogged) {
    // Demi-portions acceptées (0,5 / 1,5 / …) — min 0,5 pour décompter au moins
    // quelque chose ; fallback 1 si aucune portion renseignée.
    const dec = Math.max(0.5, roundHalf(portionsEaten || 1))
    const newRemaining = Math.max(0, (consumedDish.portions_remaining || 0) - dec)
    const patch = { portions_remaining: newRemaining }
    if (newRemaining === 0) patch.consumed_completely_at = new Date().toISOString()
    const { error: cdErr } = await supabase
      .from('cooked_dishes')
      .update(patch)
      .eq('id', consumedDish.id)
      .eq('user_id', user.id)
    if (!cdErr) dishConsumed = (consumedDish.portions_remaining || 0) - newRemaining
  }

  // 4. Restes — idempotence : on purge TOUJOURS le reste lié à ce créneau
  //    (revalidation avec moins de portions préparées → pas de reste fantôme).
  //    Exception : si le plat mangé est lui-même le reste créé jadis par ce
  //    créneau, on ne le supprime évidemment pas.
  let purge = supabase
    .from('cooked_dishes')
    .delete()
    .eq('user_id', user.id)
    .like('notes', slotMarkerLike(meal_date, meal_type))
  if (eaten_dish_id) purge = purge.neq('id', eaten_dish_id)
  await purge

  let leftover = null
  const prepared = Number(portions_prepared)
  if (!eaten_dish_id && Number.isFinite(prepared) && prepared > portionsEaten) {
    const surplus = prepared - portionsEaten

    // Nutrition PAR PORTION : moyenne pondérée. e.kcal étant le TOTAL mangé par
    // la personne, per_portion = Σ(valeurs) / Σ(portions des entries renseignées).
    const per = {}
    for (const field of NUTRI_FIELDS) {
      let total = 0
      let weight = 0
      for (const e of validEntries) {
        if (e[field] == null) continue
        total += Number(e[field]) || 0
        weight += entryPortions(e)
      }
      per[field] = weight > 0 ? round1(total / weight) : null
    }

    const now = new Date()
    const expiration = calculateCookedDishExpiration(now, 'fridge', usedLots)
    // Demi-portions : arrondi au 0,5 ; un surplus existe donc min 0,5 restant,
    // et portions_cooked ne peut pas être inférieur aux portions restantes.
    const leftoverRemaining = Math.max(0.5, roundHalf(surplus))
    const leftoverCooked = Math.max(leftoverRemaining, roundHalf(prepared))
    const { data: created, error: leftoverErr } = await supabase
      .from('cooked_dishes')
      .insert({
        user_id: user.id,
        name: dish_name || 'Restes',
        portions_cooked: leftoverCooked,
        portions_remaining: leftoverRemaining,
        storage_method: 'fridge',
        cooked_at: now.toISOString(),
        expiration_date: expiration.toISOString().split('T')[0],
        notes: `Restes du repas ${slotMarker(meal_date, meal_type)}`,
        source_meal_type: meal_type,
        kcal_per_portion: per.kcal,
        protein_g_per_portion: per.protein_g,
        carbs_g_per_portion: per.carbs_g,
        fat_g_per_portion: per.fat_g,
        fiber_g_per_portion: per.fiber_g,
      })
      .select('id, name, portions_remaining, expiration_date')
      .single()
    if (!leftoverErr) leftover = created
  }

  return NextResponse.json({
    success: true,
    logged: logRows.length,
    deducted: deductedCount,
    batchConsumed: dishConsumed,
    leftover,
    shortfalls: shortfalls.length ? shortfalls : undefined,
  })
}

/**
 * DELETE /api/meals/cook — Annule la validation d'un créneau.
 *   - supprime les logs du créneau ;
 *   - re-crédite les portions décomptées sur les plats cuisinés référencés par
 *     les logs (cooked_dish_id), plafonné à portions_cooked, et réinitialise
 *     consumed_completely_at ;
 *   - fallback : si les logs n'ont pas de cooked_dish_id mais que
 *     `batch_recipe_id` est fourni dans le body, re-crédite le plat batch le
 *     plus récent (logs historiques d'avant la traçabilité) ;
 *   - supprime le reste créé par ce créneau (marqueur `[slot:...]`).
 *
 * body: { meal_date, meal_type, batch_recipe_id? }
 * Réponse: { success, restoredPortions }
 *
 * Limites connues :
 *   - le stock d'ingrédients (inventory_lots) n'est PAS restauré ;
 *   - la restauration batch en mode fallback peut viser un autre plat que celui
 *     décrémenté à l'origine si plusieurs plats partagent le même batch_recipe_id ;
 *   - la suppression du reste lié au créneau est définitive : les portions déjà
 *     mangées depuis ce reste restent logguées (leur cooked_dish_id passe à NULL
 *     via la FK ON DELETE SET NULL).
 */
export async function DELETE(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  let body = {}
  try { body = await request.json() } catch {}
  const { meal_date, meal_type, batch_recipe_id } = body || {}
  if (!meal_date || !meal_type) {
    return NextResponse.json({ error: 'meal_date et meal_type requis' }, { status: 400 })
  }

  // Lire les logs AVANT suppression pour savoir quoi restaurer.
  const { data: logs } = await supabase
    .from('meal_log')
    .select('cooked_dish_id, portions_eaten')
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)

  const { error } = await supabase
    .from('meal_log')
    .delete()
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Portions à restaurer, groupées par plat cuisiné.
  const byDish = new Map()
  let orphanPortions = 0
  for (const l of (logs || [])) {
    const p = Number(l.portions_eaten) || 1
    if (l.cooked_dish_id) byDish.set(l.cooked_dish_id, (byDish.get(l.cooked_dish_id) || 0) + p)
    else orphanPortions += p
  }

  async function restoreDish(dishId, portions) {
    const { data: dish } = await supabase
      .from('cooked_dishes')
      .select('id, portions_cooked, portions_remaining')
      .eq('id', dishId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!dish) return 0
    const target = Math.min(
      dish.portions_cooked || 0,
      (dish.portions_remaining || 0) + Math.max(0.5, roundHalf(portions))
    )
    if (target <= (dish.portions_remaining || 0)) return 0
    const patch = { portions_remaining: target }
    if (target > 0) patch.consumed_completely_at = null
    const { error: updErr } = await supabase
      .from('cooked_dishes')
      .update(patch)
      .eq('id', dish.id)
      .eq('user_id', user.id)
    return updErr ? 0 : target - (dish.portions_remaining || 0)
  }

  let restoredPortions = 0
  for (const [dishId, portions] of byDish) {
    restoredPortions += await restoreDish(dishId, portions)
  }

  // Fallback logs historiques (sans cooked_dish_id) : restauration via batch_recipe_id.
  if (batch_recipe_id && byDish.size === 0 && (logs || []).length > 0) {
    const { data: dish } = await supabase
      .from('cooked_dishes')
      .select('id')
      .eq('user_id', user.id)
      .eq('batch_recipe_id', batch_recipe_id)
      .order('cooked_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (dish) restoredPortions += await restoreDish(dish.id, orphanPortions || logs.length)
  }

  // Reste créé par ce créneau → suppression (retrouvé via le marqueur [slot:...]).
  await supabase
    .from('cooked_dishes')
    .delete()
    .eq('user_id', user.id)
    .like('notes', slotMarkerLike(meal_date, meal_type))

  return NextResponse.json({ success: true, restoredPortions })
}
