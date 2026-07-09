import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { parseQuantity, normalizeUnit } from '@/lib/parseQuantity'
import { loadResolverData, resolveIngredient, ensureCanonical } from '@/lib/ingredientResolver'

/**
 * POST /api/courses/add-to-stock
 * Ajoute un article de courses au stock (inventory_lots) quand il est coché.
 *
 * Body:
 *   { productName, quantity,
 *     itemId?,                                ← id nutrition_plan_shopping_items (lien lots ↔ article)
 *     canonicalFoodId?, archetypeId?,         ← IDs depuis nutrition_plan_shopping_items
 *     containerQty?, containerSize?, containerUnit?   ← conditionnement (ex: 3 × 1L)
 *   }
 *
 * Réponse :
 *   { success, lots, lotIds, matched, lotsCreated, expirationDate,   ← champs legacy (courses/page.js)
 *     items: [{ id, ok, lot_id?, error? }], created_lots, auto_created }
 *
 * Flux :
 *   1. Résoudre l'ingrédient : IDs directs (si fournis) OU résolveur central
 *      (loadResolverData + resolveIngredient) OU creation garantie (ensureCanonical).
 *      Garantie : le lot insert a TOUJOURS exactement une FK d'identité.
 *   2. Écrire la FK résolue sur l'item de courses (évite de repasser par le résolveur).
 *   3. Déduire le mode de stockage (frigo/congélateur/garde-manger).
 *   4. Lire shelf_life_days_[method] depuis archetypes / canonical_foods.
 *   5. Calculer expiration_date = aujourd'hui + shelf_life_days.
 *   6. Créer le ou les lots (N lots si conditionnement multi-contenants).
 *
 * NB : user_id des lots est posé par le default DB (auth.uid()) — on ne l'envoie jamais.
 */
export async function POST(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const {
      productName,
      quantity,
      itemId = null,
      canonicalFoodId = null,
      archetypeId = null,
      containerQty = null,
      containerSize = null,
      containerUnit = null,
    } = await request.json()

    if (!productName) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }

    // 0. Idempotence : si l'article garde des lots d'un cochage précédent
    //    (décochage raté, double cochage…), nettoyer les lots non entamés
    //    AVANT d'en recréer — évite les doublons de stock.
    if (itemId != null) {
      await cleanupCreatedLots(supabase, user.id, itemId)
    }

    // 1. Résoudre les IDs ingrédient
    //    Chemin rapide : les IDs sont déjà dans l'item de courses (flow normal).
    //    Chemin résolveur : résolution déterministe (tokens/synonymes/tiers) via
    //    le résolveur central, puis creation garantie (ensureCanonical) si toujours
    //    non résolu — évite la violation de la contrainte inventory_lots_one_of.
    let resolvedArchetypeId = archetypeId
    let resolvedCanonicalFoodId = canonicalFoodId
    let autoCreated = false

    if (!resolvedArchetypeId && !resolvedCanonicalFoodId) {
      // Charger le catalogue et le stock une seule fois
      const ctx = await loadResolverData(supabase, user.id)
      const r = resolveIngredient(productName, ctx)
      resolvedArchetypeId = r.archetype_id ?? null
      resolvedCanonicalFoodId = r.canonical_food_id ?? null

      if (!resolvedArchetypeId && !resolvedCanonicalFoodId) {
        // Dernier recours : créer un canonique tracé (source='auto', verified=false)
        const ensured = await ensureCanonical(supabase, productName, ctx)
        if (ensured?.canonical_food_id) {
          resolvedCanonicalFoodId = ensured.canonical_food_id
          autoCreated = true
        }
      }

      // Réécrire la FK résolue sur l'item de courses pour les passages ultérieurs
      if (itemId != null && (resolvedCanonicalFoodId || resolvedArchetypeId)) {
        await supabase
          .from('nutrition_plan_shopping_items')
          .update({
            canonical_food_id: resolvedCanonicalFoodId ?? null,
            archetype_id: resolvedArchetypeId ?? null,
          })
          .eq('id', itemId)
      }
    }

    const matched = !!(resolvedArchetypeId || resolvedCanonicalFoodId)

    // Garde-fou : sans AUCUNE identité (nom vide/inexploitable, ensureCanonical
    // a rendu null), on n'insère PAS — l'insert violerait inventory_lots_one_of.
    // Erreur par article, le reste du lot de courses continue.
    if (!matched) {
      return NextResponse.json({
        success: false,
        matched: false,
        error: `Ingrédient non identifiable : « ${productName} »`,
        items: itemId ? [{ id: itemId, ok: false, error: 'Ingrédient non identifiable' }] : [],
      })
    }

    // 2. Déduire le mode de stockage : DB en priorité si un seul champ est renseigné
    const dbStorageMethod = await resolveStorageHint(supabase, resolvedArchetypeId, resolvedCanonicalFoodId)
    const storage = dbStorageMethod
      ? { method: dbStorageMethod, place: STORAGE_PLACES[dbStorageMethod] }
      : guessStorage(productName)

    // 3. Lire les données de conservation depuis le DB, fallback sur règles mot-clé
    const shelfLifeDays = await resolveShelfLife(supabase, resolvedArchetypeId, resolvedCanonicalFoodId, storage.method)
      ?? guessShelfLifeFallback(productName, storage.method)

    // 4. Calculer la date d'expiration
    const today = new Date()
    const expDate = new Date(today)
    expDate.setDate(expDate.getDate() + shelfLifeDays)
    const acquired_on = today.toISOString().split('T')[0]
    const expiration_date = expDate.toISOString().split('T')[0]

    // 5. Construire le template de lot
    const baseLot = {
      archetype_id: resolvedArchetypeId ?? null,
      canonical_food_id: resolvedCanonicalFoodId ?? null,
      storage_method: storage.method,
      storage_place: storage.place,
      acquired_on,
      expiration_date,
      notes: matched ? null : productName,
    }

    // 6. Déterminer la quantité : conditionnement multi-contenants ou total unique
    const useContainers = containerQty > 1 && containerSize != null
    let lotsToCreate

    if (useContainers) {
      const perUnit = normalizeUnit(containerSize, (containerUnit || 'unités').toLowerCase())
      lotsToCreate = Array.from({ length: containerQty }, () => ({
        ...baseLot,
        qty_remaining: perUnit.qty,
        initial_qty: perUnit.qty,
        unit: perUnit.unit,
        is_containerized: true,
        container_size: containerSize,
        container_unit: containerUnit,
      }))
    } else {
      const parsed = parseQuantity(quantity)
      lotsToCreate = [{
        ...baseLot,
        qty_remaining: parsed.qty,
        initial_qty: parsed.qty,
        unit: parsed.unit,
      }]
    }

    // 7. Insérer les lots — erreur par item, jamais d'échec global
    let lots = []
    let insertError = null
    try {
      const { data: lotData, error: lotErr } = await supabase
        .from('inventory_lots')
        .insert(lotsToCreate)
        .select()
      if (lotErr) insertError = lotErr.message
      else lots = lotData || []
    } catch (e) {
      insertError = e.message
    }

    if (insertError) {
      return NextResponse.json({
        // Champs legacy
        success: false,
        error: insertError,
        lotIds: [],
        matched,
        lotsCreated: 0,
        // Champs par item
        items: [{ id: itemId, ok: false, error: insertError }],
        created_lots: 0,
        auto_created: autoCreated,
      })
    }

    const lotIds = lots.map(l => l.id)
    return NextResponse.json({
      // Champs legacy (utilisés par app/courses/page.js — ne pas supprimer)
      success: true,
      lots,
      lotIds,
      matched,
      lotsCreated: lots.length,
      expirationDate: expiration_date,
      // Champs par item
      items: [{ id: itemId, ok: true, lot_id: lots[0]?.id ?? null }],
      created_lots: lots.length,
      auto_created: autoCreated,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/courses/add-to-stock
 * Annule le rangement d'un article décoché.
 * Body: { itemId }
 *
 * Supprime les lots listés dans nutrition_plan_shopping_items.created_lot_ids
 * appartenant à l'utilisateur ET non entamés (qty_remaining = initial_qty).
 * Les lots déjà partiellement consommés sont CONSERVÉS (kept > 0 dans la
 * réponse → l'UI informe l'utilisateur). created_lot_ids est vidé ensuite.
 *
 * Réponse : { success, deleted, kept }
 */
export async function DELETE(request) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let body = {}
    try { body = await request.json() } catch {}
    const itemId = body?.itemId ?? new URL(request.url).searchParams.get('itemId')
    if (itemId == null) {
      return NextResponse.json({ error: 'itemId requis' }, { status: 400 })
    }

    const result = await cleanupCreatedLots(supabase, user.id, itemId)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: result.deleted, kept: result.kept })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Supprime les lots référencés par created_lot_ids de l'article, appartenant
 * à l'utilisateur et NON entamés (qty_remaining = initial_qty). Les lots
 * entamés sont conservés. Vide created_lot_ids dans tous les cas.
 * Retourne { deleted, kept } ou { error }.
 */
async function cleanupCreatedLots(supabase, userId, itemId) {
  // RLS: la policy "users_own_shopping" vérifie via import_id → nutrition_plan_imports.user_id
  const { data: item, error: itemErr } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('id, created_lot_ids')
    .eq('id', itemId)
    .maybeSingle()

  if (itemErr) return { error: itemErr.message }
  const lotIds = item?.created_lot_ids || []
  if (!item || lotIds.length === 0) return { deleted: 0, kept: 0 }

  const { data: lots, error: lotsErr } = await supabase
    .from('inventory_lots')
    .select('id, qty_remaining, initial_qty')
    .in('id', lotIds)
    .eq('user_id', userId)

  if (lotsErr) return { error: lotsErr.message }

  // Ne JAMAIS supprimer un lot déjà entamé
  const untouched = (lots || []).filter(l => Number(l.qty_remaining) >= Number(l.initial_qty))
  const kept = (lots || []).length - untouched.length

  if (untouched.length > 0) {
    const { error: delErr } = await supabase
      .from('inventory_lots')
      .delete()
      .in('id', untouched.map(l => l.id))
      .eq('user_id', userId)
    if (delErr) return { error: delErr.message }
  }

  const { error: clearErr } = await supabase
    .from('nutrition_plan_shopping_items')
    .update({ created_lot_ids: null })
    .eq('id', itemId)
  if (clearErr) return { error: clearErr.message }

  return { deleted: untouched.length, kept }
}

/**
 * Lit shelf_life_days_[storageMethod] depuis archetypes (puis canonical_food en fallback).
 * Retourne le nombre de jours, ou null si non trouvé.
 */
async function resolveShelfLife(supabase, archetypeId, canonicalFoodId, storageMethod) {
  const field = `shelf_life_days_${storageMethod}`

  if (archetypeId) {
    const { data } = await supabase
      .from('archetypes')
      .select(`${field}, canonical_food:canonical_foods(${field})`)
      .eq('id', archetypeId)
      .single()

    if (data) {
      const days = data[field] ?? data.canonical_food?.[field] ?? null
      if (days) return days
    }
  }

  if (canonicalFoodId) {
    const { data } = await supabase
      .from('canonical_foods')
      .select(field)
      .eq('id', canonicalFoodId)
      .single()

    if (data?.[field]) return data[field]
  }

  return null
}

/**
 * Fallback par mots-clés quand aucune donnée DB n'est disponible.
 */
function guessShelfLifeFallback(name, storageMethod) {
  const n = name.toLowerCase()
  if (storageMethod === 'freezer') return 180
  if (/huile|vinaigre|épice|cumin|cannelle|paprika|curcuma|curry|poivre|muscade|thym|origan|herbes/i.test(n)) return 365
  if (/conserve|passata|concentré|boîte|bocal|farine|sucre|sel|maïzena|pâtes|riz|semoule|quinoa|lentilles|pois/i.test(n)) return 365
  if (/amande|noix|noisette|cacahuète|fruit.?sec/i.test(n)) return 180
  if (storageMethod === 'fridge') {
    if (/poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|saucisse|lardons|bacon/i.test(n)) return 4
    if (/saumon|cabillaud|truite|poisson/i.test(n)) return 3
    if (/lait/i.test(n)) return 7
    if (/yaourt|skyr/i.test(n)) return 21
    if (/fromage|beurre|crème/i.test(n)) return 21
    if (/œuf|oeuf/i.test(n)) return 28
    if (/salade|épinard|mâche/i.test(n)) return 5
    if (/champignon/i.test(n)) return 5
    if (/tomate|courgette|aubergine|poivron/i.test(n)) return 7
    if (/carotte|navet|poireau|chou|brocoli/i.test(n)) return 14
    return 7
  }
  return 90
}

const STORAGE_PLACES = {
  pantry: 'Garde-manger',
  fridge: 'Frigo',
  freezer: 'Congélateur',
}

/**
 * Résout le mode de stockage depuis la DB (archetype ou canonical_food).
 * Retourne la méthode uniquement si exactement un champ shelf_life est renseigné
 * (signal non ambigu). Sinon retourne null pour laisser guessStorage() décider.
 */
async function resolveStorageHint(supabase, archetypeId, canonicalFoodId) {
  const fields = 'shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer'
  let data = null

  if (archetypeId) {
    const { data: arch } = await supabase
      .from('archetypes')
      .select(fields)
      .eq('id', archetypeId)
      .single()
    data = arch
  } else if (canonicalFoodId) {
    const { data: cf } = await supabase
      .from('canonical_foods')
      .select(fields)
      .eq('id', canonicalFoodId)
      .single()
    data = cf
  }

  if (!data) return null

  const populated = [
    data.shelf_life_days_pantry  && 'pantry',
    data.shelf_life_days_fridge  && 'fridge',
    data.shelf_life_days_freezer && 'freezer',
  ].filter(Boolean)

  // Signal non ambigu : un seul mode de conservation renseigné en DB
  return populated.length === 1 ? populated[0] : null
}

/**
 * Déduit le mode de stockage depuis le nom du produit.
 */
function guessStorage(name) {
  const n = name.toLowerCase()
  if (/surgelé|congelé|glace/i.test(n)) return { method: 'freezer', place: 'Congélateur' }
  if (/lait|yaourt|skyr|fromage|beurre|crème|œuf|oeuf|poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|saumon|cabillaud|truite|poisson|jambon|lardons|saucisse|merguez|chorizo|magret|canard|guanciale|pancetta|bacon/i.test(n)) return { method: 'fridge', place: 'Frigo' }
  if (/salade|laitue|tomate|concombre|courgette|aubergine|poivron|brocoli|chou|fenouil|navet|radis|carotte|poireau|champignon|épinard|haricot.?vert|asperge|céleri|betterave|endive|mâche|roquette|persil|coriandre|menthe|basilic|ciboulette|fraise|framboise|myrtille/i.test(n)) return { method: 'fridge', place: 'Frigo' }
  if (/frais|fraîche/i.test(n)) return { method: 'fridge', place: 'Frigo' }
  return { method: 'pantry', place: 'Garde-manger' }
}
