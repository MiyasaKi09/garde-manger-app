import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules'
import { deductFromStock } from '@/lib/deductNeeds'

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

/**
 * Résout le créneau de plan actuellement publié pour un repas donné.
 * Fait deux requêtes légères : meal_plan_slots → meal_plan_versions (filtre
 * published). Retourne { slotId, cooked_dish_id } ou nulls si introuvable.
 * Fail-soft : toute erreur retourne des nulls (le reste de la route continue).
 *
 * Utilisé par POST (flip active→consumed) et DELETE (flip consumed→active).
 */
async function resolveActiveSlot(supabase, userId, mealDate, mealType) {
  try {
    const { data: slots } = await supabase
      .from('meal_plan_slots')
      .select('id, cooked_dish_id, plan_version_id')
      .eq('user_id', userId)
      .eq('meal_date', mealDate)
      .eq('meal_type', mealType)
      .limit(10)

    if (!slots || slots.length === 0) return { slotId: null, cooked_dish_id: null }

    const versionIds = slots.map(s => s.plan_version_id).filter(Boolean)
    if (versionIds.length === 0) return { slotId: null, cooked_dish_id: null }

    const { data: versions } = await supabase
      .from('meal_plan_versions')
      .select('id')
      .in('id', versionIds)
      .eq('status', 'published')
      .limit(1)

    if (!versions || versions.length === 0) return { slotId: null, cooked_dish_id: null }

    const publishedVersionId = versions[0].id
    const slot = slots.find(s => String(s.plan_version_id) === String(publishedVersionId))
    if (!slot) return { slotId: null, cooked_dish_id: null }

    return { slotId: slot.id, cooked_dish_id: slot.cooked_dish_id ?? null }
  } catch {
    return { slotId: null, cooked_dish_id: null }
  }
}

const entryPortions = (e) => {
  const p = Number(e?.portions_eaten)
  return Number.isFinite(p) && p > 0 ? p : 1
}

/**
 * Construit un objet prêt pour l'insertion dans inventory_lots à partir du
 * snapshot conservé dans meal_stock_deductions.lot_snapshot.
 * Utilisé lors de la restauration d'annulation (DELETE /api/meals/cook) pour
 * recréer un lot que la RPC consume_lots_fefo avait supprimé après vidage.
 *
 * @param {object} snap  - Contenu de lot_snapshot (peut avoir des nulls)
 * @param {number} qty   - Quantité à restituer (= qty_deducted de la déduction)
 * @param {string} userId - UUID de l'utilisateur propriétaire
 */
const buildLotFromSnapshot = (snap, qty, userId) => ({
  user_id: userId,
  qty_remaining: Number(qty),
  initial_qty: Number(qty),
  unit: snap.unit || 'unités',
  storage_method: snap.storage_method || 'pantry',
  storage_place: snap.storage_place || 'Garde-manger',
  acquired_on: snap.acquired_on || new Date().toISOString().split('T')[0],
  canonical_food_id: snap.canonical_food_id || null,
  cultivar_id: snap.cultivar_id || null,
  archetype_id: snap.archetype_id || null,
  product_id: snap.product_id || null,
  expiration_date: snap.expiration_date || null,
  adjusted_expiration_date: snap.adjusted_expiration_date || null,
  is_opened: snap.is_opened || false,
  opened_at: snap.opened_at || null,
})

/**
 * POST /api/meals/cook — Marque un repas du plan comme « cuisiné / mangé ».
 *   - déduit les lots choisis de l'inventaire (ATOMIQUE via la RPC
 *     consume_lots_fefo, AVANT toute écriture de log — fail-fast) ;
 *   - enregistre les déductions dans meal_stock_deductions (fail-soft) pour
 *     permettre la restauration lors d'une annulation (DELETE) ;
 *   - logue la nutrition du jour dans meal_log (une ligne par personne,
 *     micronutriments inclus) ;
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
 * Réponse: { success, logged, deducted, batchConsumed, leftover, deductions_recorded? }
 *   - batchConsumed : portions décomptées du plat (batch ou reste mangé)
 *   - leftover : { id, name, portions_remaining, expiration_date } | null
 *   - deductions_recorded : absent si OK, false si l'enregistrement des
 *     déductions a échoué (cuisson réussie mais restauration impossible)
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

  // Résolution du créneau de plan publié pour ce repas (P1 — fail-soft).
  // Permet de déduire cooked_dish_id depuis le slot quand eaten_dish_id n'est
  // pas fourni explicitement, et de retrouver le slot_id pour flipper la
  // réservation active→consumed après la consommation.
  const { slotId, cooked_dish_id: slotDishId } = await resolveActiveSlot(
    supabase, user.id, meal_date, meal_type,
  )
  // effectiveDishId : eaten_dish_id explicite en priorité, puis cooked_dish_id
  // du slot publié. Utilisé pour les gardes DLC, le décrément, et les restes.
  const effectiveDishId = eaten_dish_id ?? slotDishId

  // Plat consommé : reste existant (eaten_dish_id ou cooked_dish_id du slot)
  // ou plat batch (batch_recipe_id).
  // DLC comparées en UTC (piège #4) ; une DLC absente (plats legacy) n'est PAS
  // considérée comme périmée. Aucune mutation automatique d'un plat périmé ici :
  // il reste en stock, signalé ailleurs (audit F02 / test H). Si le batch ne
  // possède QUE des plats périmés à portions restantes → 409 (jamais de log
  // silencieux sans décrément).
  const todayUtc = new Date().toISOString().slice(0, 10)
  let consumedDish = null
  if (eaten_dish_id) {
    const { data: dish, error: dishErr } = await supabase
      .from('cooked_dishes')
      .select('id, name, portions_cooked, portions_remaining, expiration_date, kcal_per_portion, protein_g_per_portion, carbs_g_per_portion, fat_g_per_portion, fiber_g_per_portion')
      .eq('id', eaten_dish_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (dishErr || !dish) {
      return NextResponse.json({ error: 'Reste introuvable' }, { status: 404 })
    }
    if (dish.expiration_date && String(dish.expiration_date).slice(0, 10) < todayUtc) {
      const expiredOn = new Date(`${String(dish.expiration_date).slice(0, 10)}T00:00:00Z`)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      return NextResponse.json(
        { error: `« ${dish.name} » est périmé depuis le ${expiredOn} : ce reste ne peut plus être consommé. Retirez-le du stock.` },
        { status: 409 },
      )
    }
    consumedDish = dish
  } else if (batch_recipe_id) {
    // FEFO borné : jamais de plat périmé en sélection automatique.
    const { data: dish, error: dishErr } = await supabase
      .from('cooked_dishes')
      .select('id, portions_cooked, portions_remaining')
      .eq('user_id', user.id)
      .eq('batch_recipe_id', batch_recipe_id)
      .gt('portions_remaining', 0)
      .or(`expiration_date.is.null,expiration_date.gte.${todayUtc}`)
      .order('expiration_date', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (dishErr) {
      return NextResponse.json({ error: `Lecture du plat batch : ${dishErr.message}` }, { status: 500 })
    }
    if (dish) {
      consumedDish = dish
    } else {
      // Aucun plat VALIDE, mais des plats PÉRIMÉS à portions restantes existent
      // pour cette recette → 409 explicite (même esprit que eaten_dish_id),
      // AVANT toute écriture : on ne logue pas silencieusement un repas sans
      // décrément. S'il n'existe aucun plat du tout, comportement inchangé.
      const { data: expiredDish, error: expiredErr } = await supabase
        .from('cooked_dishes')
        .select('id, name, expiration_date')
        .eq('user_id', user.id)
        .eq('batch_recipe_id', batch_recipe_id)
        .gt('portions_remaining', 0)
        .lt('expiration_date', todayUtc)
        .order('expiration_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (expiredErr) {
        return NextResponse.json({ error: `Lecture du plat batch : ${expiredErr.message}` }, { status: 500 })
      }
      if (expiredDish) {
        const expiredOn = new Date(`${String(expiredDish.expiration_date).slice(0, 10)}T00:00:00Z`)
          .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
        return NextResponse.json(
          { error: `« ${expiredDish.name || 'Ce plat batch'} » est périmé depuis le ${expiredOn} : ce plat ne peut plus être consommé. Retirez-le du stock ou recuisinez la préparation.` },
          { status: 409 },
        )
      }
    }
  } else if (slotDishId) {
    // P1 — Le créneau de plan publié pointe vers un plat cuisiné existant.
    // Mêmes gardes DLC que pour eaten_dish_id : 409 si périmé, 404 si introuvable.
    const { data: dish, error: dishErr } = await supabase
      .from('cooked_dishes')
      .select('id, name, portions_cooked, portions_remaining, expiration_date, kcal_per_portion, protein_g_per_portion, carbs_g_per_portion, fat_g_per_portion, fiber_g_per_portion')
      .eq('id', slotDishId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (dishErr || !dish) {
      return NextResponse.json({ error: 'Reste introuvable' }, { status: 404 })
    }
    if (dish.expiration_date && String(dish.expiration_date).slice(0, 10) < todayUtc) {
      const expiredOn = new Date(`${String(dish.expiration_date).slice(0, 10)}T00:00:00Z`)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      return NextResponse.json(
        { error: `« ${dish.name} » est périmé depuis le ${expiredOn} : ce reste ne peut plus être consommé. Retirez-le du stock.` },
        { status: 409 },
      )
    }
    consumedDish = dish
  }

  // 1. Déduction du stock EN PREMIER : besoins automatiques (FEFO multi-lots)
  //    + déductions explicites, via le helper partagé (cf. lib/deductNeeds),
  //    qui applique la décrémentation de façon ATOMIQUE (RPC consume_lots_fefo).
  //    Fail-fast : si la déduction échoue, on ne touche NI aux logs NI aux
  //    plats — pas de logs orphelins sans déduction de stock.
  //    Ex : 5 bouteilles de 1 L, besoin 1,5 L → 1 vidée + 0,5 L sur la 2e
  //    (le trigger SQL auto_open_lot marque « ouvert » le lot entamé).
  const { deductedCount, usedLots, shortfalls, error: deductError } = await deductFromStock(
    supabase, user.id, { needs, deductions },
  )
  if (deductError) {
    return NextResponse.json(
      { error: `Déduction du stock impossible : ${deductError}` },
      { status: 500 },
    )
  }

  // 1b. Traçabilité des déductions — fail-soft.
  //     Chaque lot débité est enregistré dans meal_stock_deductions avec un
  //     snapshot suffisant pour recréer le lot s'il a été supprimé par la RPC
  //     (consume_lots_fefo supprime le lot quand qty_remaining → 0).
  //     Un échec ici n'interrompt pas la cuisson (la déduction est réelle) mais
  //     empêche la restauration lors d'une annulation → signalé via
  //     deductions_recorded: false dans la réponse.
  let deductionsRecorded = true
  if (usedLots && usedLots.length > 0) {
    // Idempotence : purger les déductions du créneau précédent avant d'insérer
    // (même logique que meal_log qui est supprimé/recréé à chaque validation).
    await supabase
      .from('meal_stock_deductions')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_date', meal_date)
      .eq('meal_type', meal_type)

    // Vérifier quels lots existent encore après la déduction RPC : la RPC supprime
    // les lots vidés → lot_id = null pour les lots manquants (évite une violation FK).
    const lotIds = usedLots.map(l => l.id)
    const { data: stillExisting } = await supabase
      .from('inventory_lots')
      .select('id')
      .in('id', lotIds)
      .eq('user_id', user.id)
    const existingSet = new Set((stillExisting || []).map(l => l.id))

    const deductionRows = usedLots.map(lot => ({
      user_id: user.id,
      meal_date,
      meal_type,
      // lot_id null si le lot a été supprimé par la RPC (lot vidé)
      lot_id: existingSet.has(lot.id) ? lot.id : null,
      lot_snapshot: {
        canonical_food_id: lot.canonical_food_id ?? null,
        cultivar_id:       lot.cultivar_id       ?? null,
        archetype_id:      lot.archetype_id      ?? null,
        product_id:        lot.product_id        ?? null,
        unit:                       lot.unit                       ?? null,
        expiration_date:            lot.expiration_date            ?? null,
        adjusted_expiration_date:   lot.adjusted_expiration_date   ?? null,
        storage_place:              lot.storage_place              ?? null,
        storage_method:             lot.storage_method             ?? null,
        is_opened:                  lot.is_opened                  ?? false,
        opened_at:                  lot.opened_at                  ?? null,
        acquired_on:                lot.acquired_on                ?? null,
      },
      qty_deducted: lot.qty_deducted,
    }))

    const { error: deductionErr } = await supabase
      .from('meal_stock_deductions')
      .insert(deductionRows)
    if (deductionErr) {
      console.error('[meals/cook POST] Erreur enregistrement déductions:', deductionErr.message)
      deductionsRecorded = false
    }
  }

  // 2. Nutrition du jour — remplace les logs du créneau (idempotent)
  await supabase
    .from('meal_log')
    .delete()
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)

  const logRows = validEntries.map(e => {
    const p = entryPortions(e)
    // Fallback nutrition : si l'entry n'a pas de valeur et qu'on mange un reste
    // (eaten_dish_id explicite ou issu du slot — effectiveDishId) qui connaît
    // sa nutrition par portion, on calcule total = per_portion × portions.
    const val = (field) => {
      if (e[field] != null) return e[field]
      const per = effectiveDishId ? consumedDish?.[`${field}_per_portion`] : null
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

  // 3b. Flip de réservation active → consumed (P1, fail-soft).
  //     Exécuté uniquement lors de la PREMIÈRE validation du créneau
  //     (alreadyLogged guard — même logique que le décrément en step 3).
  //     Une erreur ici ne bloque pas la cuisson : la réservation reste orpheline
  //     jusqu'à la prochaine réconciliation ou annulation.
  if (consumedDish && !alreadyLogged && slotId) {
    await supabase
      .from('inventory_reservations')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .eq('slot_id', slotId)
      .eq('cooked_dish_id', consumedDish.id)
      .eq('status', 'active')
      .eq('user_id', user.id)
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
  if (effectiveDishId) purge = purge.neq('id', effectiveDishId)
  await purge

  let leftover = null
  const prepared = Number(portions_prepared)
  if (!effectiveDishId && Number.isFinite(prepared) && prepared > portionsEaten) {
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
    // deductions_recorded absent si OK ; false si l'enregistrement a échoué
    // (la cuisson est réussie, mais l'annulation ne pourra pas restaurer le stock)
    ...(deductionsRecorded ? {} : { deductions_recorded: false }),
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
 *   - restaure le stock déduit depuis meal_stock_deductions (migration 20260709) :
 *     pour chaque déduction non restaurée du créneau, re-crédite qty_remaining
 *     sur le lot s'il existe encore (verrou optimiste ×3), ou recrée le lot
 *     entier depuis lot_snapshot si la RPC consume_lots_fefo l'avait supprimé
 *     après vidage (qty_remaining → 0) ;
 *   - supprime le reste créé par ce créneau (marqueur `[slot:...]`).
 *
 * body: { meal_date, meal_type, batch_recipe_id? }
 * Réponse: { success, restoredPortions, stock_restored: true,
 *            restored_lots: n, recreated_lots: m }
 *   - restored_lots  : lots incrémentés (encore présents dans inventory_lots)
 *   - recreated_lots : lots recréés depuis snapshot (avaient été supprimés)
 *   - Si aucune déduction n'avait été tracée (repas validé avant la migration
 *     20260709 ou avec deductions_recorded: false), restored_lots = 0 et
 *     recreated_lots = 0.
 *
 * Limites connues :
 *   - la restauration batch en mode fallback peut viser un autre plat que celui
 *     décrémenté à l'origine si plusieurs plats partagent le même batch_recipe_id ;
 *   - la suppression du reste lié au créneau est définitive : les portions déjà
 *     mangées depuis ce reste restent logguées (leur cooked_dish_id passe à NULL
 *     via la FK ON DELETE SET NULL) ;
 *   - si le POST a été appelé avant la migration 20260709 (ou avec
 *     deductions_recorded: false dans la réponse), aucune déduction n'est tracée
 *     et le stock ne peut pas être restauré (restored_lots = 0, recreated_lots = 0).
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

  // Lire les logs AVANT suppression pour savoir quoi restaurer (portions de plats).
  const { data: logs } = await supabase
    .from('meal_log')
    .select('cooked_dish_id, portions_eaten')
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)

  // Charger les déductions de stock non restaurées pour ce créneau AVANT de
  // supprimer meal_log (indépendant, mais regroupé avec la lecture des logs).
  const { data: stockDeductions } = await supabase
    .from('meal_stock_deductions')
    .select('id, lot_id, lot_snapshot, qty_deducted')
    .eq('user_id', user.id)
    .eq('meal_date', meal_date)
    .eq('meal_type', meal_type)
    .eq('restored', false)

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

  // Flip réservations consumed → active (chemin de re-crédit symétrique — P1).
  // On résout le slot APRÈS la suppression des logs (meal_plan_slots non affectés).
  // Fail-soft : pas d'erreur remontée si le slot est absent ou si aucune
  // réservation consumed ne correspond (rétrocompat pré-P1 assurée).
  if (byDish.size > 0) {
    const { slotId: cancelSlotId } = await resolveActiveSlot(supabase, user.id, meal_date, meal_type)
    if (cancelSlotId) {
      for (const dishId of byDish.keys()) {
        await supabase
          .from('inventory_reservations')
          .update({ status: 'active', consumed_at: null })
          .eq('slot_id', cancelSlotId)
          .eq('cooked_dish_id', dishId)
          .eq('status', 'consumed')
          .eq('user_id', user.id)
      }
    }
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

  // Restauration du stock d'ingrédients depuis meal_stock_deductions.
  // Deux cas :
  //   • lot_id non null → lot encore présent dans inventory_lots (la FK ON DELETE
  //     SET NULL l'aurait mis à null s'il avait disparu) → re-créditer qty_remaining
  //     (lecture + update avec verrou optimiste ×3, même pattern que lots/consume).
  //   • lot_id null → lot supprimé par la RPC (ou avant l'insert FK) → recréer
  //     un nouveau lot depuis lot_snapshot avec qty_remaining = qty_deducted.
  let restoredLots = 0
  let recreatedLots = 0

  if (stockDeductions && stockDeductions.length > 0) {
    const toUpdate  = stockDeductions.filter(r =>  r.lot_id)
    const toRecreate = stockDeductions.filter(r => !r.lot_id)

    // Lots encore présents : re-créditer (optimiste ×3)
    for (const row of toUpdate) {
      let creditedOk = false
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: lot } = await supabase
          .from('inventory_lots')
          .select('id, qty_remaining')
          .eq('id', row.lot_id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!lot) break  // lot disparu entre la lecture FK et maintenant (race rare)

        const newQty = (Number(lot.qty_remaining) || 0) + Number(row.qty_deducted)
        // Verrou optimiste : l'UPDATE ne correspondra à aucune ligne si qty_remaining
        // a changé entre la lecture et l'écriture → on relit et retente.
        const { data: updated } = await supabase
          .from('inventory_lots')
          .update({ qty_remaining: newQty })
          .eq('id', row.lot_id)
          .eq('qty_remaining', lot.qty_remaining)
          .eq('user_id', user.id)
          .select('id')

        if (updated && updated.length > 0) {
          creditedOk = true
          restoredLots++
          break
        }
        // 0 lignes mises à jour → conflit concurrent → relire et retenter
      }

      if (!creditedOk) {
        // Lot disparu pendant les tentatives → recrée depuis le snapshot
        const snap = row.lot_snapshot || {}
        const { error: reinsertErr } = await supabase
          .from('inventory_lots')
          .insert(buildLotFromSnapshot(snap, row.qty_deducted, user.id))
        if (!reinsertErr) recreatedLots++
      }
    }

    // Lots supprimés (lot_id IS NULL) : recréer en lot depuis le snapshot.
    // Insertion en lot (une seule requête) pour minimiser les allers-retours.
    if (toRecreate.length > 0) {
      const inserts = toRecreate.map(row =>
        buildLotFromSnapshot(row.lot_snapshot || {}, row.qty_deducted, user.id)
      )
      const { error: batchInsertErr } = await supabase
        .from('inventory_lots')
        .insert(inserts)
      if (!batchInsertErr) recreatedLots += toRecreate.length
    }

    // Marquer toutes les déductions du créneau comme restaurées
    await supabase
      .from('meal_stock_deductions')
      .update({ restored: true })
      .in('id', stockDeductions.map(r => r.id))
      .eq('user_id', user.id)
  }

  // Reste créé par ce créneau → suppression (retrouvé via le marqueur [slot:...]).
  await supabase
    .from('cooked_dishes')
    .delete()
    .eq('user_id', user.id)
    .like('notes', slotMarkerLike(meal_date, meal_type))

  return NextResponse.json({
    success: true,
    restoredPortions,
    stock_restored: true,
    restored_lots: restoredLots,
    recreated_lots: recreatedLots,
  })
}
