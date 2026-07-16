import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { parseQuantity, normalizeUnit } from '@/lib/parseQuantity'
import { loadResolverData, resolveIngredient, ensureCanonical } from '@/lib/ingredientResolver'
import { buildStorageDecision } from '@/lib/storageDecisionServer'
import { normalizeIsoDate, todayIso } from '@/lib/storageDecision'
import { sanitizeInventoryLabel } from '@/lib/inventoryDisplayName'

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
 *   3. Prendre une décision de conservation unique, sourcée et validée.
 *   4. Prioriser la date d'étiquette, puis la politique et le catalogue.
 *   5. Refuser un rangement dangereux ou encore ambigu.
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
      category = '',
      purchaseState = 'unknown',
      foodState = 'unknown',
      storageMethod = null,
      useByDate = null,
      bestBeforeDate = null,
      acquiredOn = null,
    } = await request.json()

    if (!productName) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
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

    // 2. Décision unique utilisée également par la prévisualisation du panneau.
    //    Le congélateur reste une possibilité, jamais le défaut d'un produit frais.
    const acquired_on = normalizeIsoDate(acquiredOn) || todayIso()
    const storageDecision = await buildStorageDecision(supabase, {
      productName,
      category,
      canonicalFoodId: resolvedCanonicalFoodId,
      archetypeId: resolvedArchetypeId,
      purchaseState,
      foodState,
      storageMethod,
      useByDate,
      bestBeforeDate,
      acquiredOn: acquired_on,
    })

    if (!storageDecision.valid) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_STORAGE_DECISION',
        error: storageDecision.error || storageDecision.reason,
        storageDecision,
        items: [{ id: itemId, ok: false, error: storageDecision.error || storageDecision.reason }],
      }, { status: 422 })
    }

    if (storageDecision.requiresConfirmation) {
      return NextResponse.json({
        success: false,
        code: 'STORAGE_CONFIRMATION_REQUIRED',
        error: 'Lieu de conservation à confirmer avant le rangement',
        storageDecision,
        items: [{ id: itemId, ok: false, error: 'Lieu de conservation à confirmer' }],
      }, { status: 422 })
    }

    const expiration_date = storageDecision.expirationDate

    // Idempotence seulement APRÈS validation. Une décision refusée ne doit
    // jamais supprimer un lot créé lors d'un rangement précédent.
    if (itemId != null) {
      const cleanup = await cleanupCreatedLots(supabase, user.id, itemId)
      if (cleanup.error) {
        return NextResponse.json({
          success: false,
          error: cleanup.error,
          items: [{ id: itemId, ok: false, error: cleanup.error }],
        }, { status: 500 })
      }
    }

    // 5. Construire le template de lot
    const baseLot = {
      archetype_id: resolvedArchetypeId ?? null,
      canonical_food_id: resolvedCanonicalFoodId ?? null,
      storage_method: storageDecision.method,
      storage_place: storageDecision.place,
      acquired_on,
      expiration_date,
      storage_decision_source: storageDecision.storageSource,
      storage_decision_confidence: storageDecision.confidence,
      storage_policy_version: storageDecision.policyVersion,
      expiration_source: storageDecision.expirationSource,
      expiration_kind: storageDecision.expiryKind,
      requires_storage_review: storageDecision.needsReview,
      label_use_by_date: normalizeIsoDate(useByDate),
      label_best_before_date: normalizeIsoDate(bestBeforeDate),
      notes: matched ? null : productName,
      // Conserver la forme exacte choisie dans les courses. Les FK génériques
      // restent disponibles pour le matching, sans dégrader le nom affiché.
      commercial_name: sanitizeInventoryLabel(productName),
    }

    // 6. Déterminer la quantité : conditionnement multi-contenants ou total unique
    const useContainers = containerQty > 1 && containerSize != null
    let lotsToCreate

    if (useContainers) {
      const perUnit = normalizeUnit(containerSize, (containerUnit || 'unités').toLowerCase())
      lotsToCreate = [{
        ...baseLot,
        qty_remaining: perUnit.qty * containerQty,
        initial_qty: perUnit.qty * containerQty,
        unit: perUnit.unit,
        is_containerized: true,
        container_size: perUnit.qty,
        container_unit: perUnit.unit,
        container_count_initial: containerQty,
      }]
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

    // Journal des mouvements — best-effort (échec non bloquant)
    try {
      const movements = lots.map(lot => ({
        user_id:         user.id,
        lot_id:          lot.id,
        movement_type:   'purchase',
        quantity_before: 0,
        quantity_delta:  Number(lot.initial_qty) || 0,
        quantity_after:  Number(lot.qty_remaining) || 0,
      }))
      await supabase.from('inventory_movements').insert(movements)
      // Erreur Supabase ignorée intentionnellement (journal non bloquant)
    } catch {
      // Erreur réseau ou autre — non bloquante
    }

    return NextResponse.json({
      // Champs legacy (utilisés par app/courses/page.js — ne pas supprimer)
      success: true,
      lots,
      lotIds,
      matched,
      lotsCreated: lots.length,
      expirationDate: expiration_date,
      storageDecision,
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
