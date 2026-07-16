import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getExpirationStatus, getEffectiveExpiration } from '@/app/pantry/components/pantryUtils'
import { daysUntil } from '@/lib/dates'
import { resolveInventoryDisplayName } from '@/lib/inventoryDisplayName'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pantry — stock enrichi, prêt à afficher.
 *
 * Fait côté serveur ce que la page garde-manger faisait côté client :
 *   1. Charge tous les lots de l'utilisateur (RLS), triés par expiration.
 *   2. Enrichit avec canonical_foods (nom, densité, poids unitaire) OU
 *      archetypes (nom, expiry_kind, durées de conservation).
 *   3. Calcule par lot : product_name, expiry_kind, jours restants (UTC),
 *      statut (good | expiring_soon | expired | no_date — seuil J-3 DLC / J-7 DDM)
 *      et badge d'expiration — via les MÊMES helpers que la page (pantryUtils).
 *
 * → 200 {
 *     lots: [{ ...colonnes du lot, canonical_foods? | archetypes?,
 *              product_name, expiry_kind, effective_expiration,
 *              expiration_status, expiration_badge: { label, color, bgColor },
 *              days_until_expiration, grams_per_unit, density_g_per_ml, primary_unit }],
 *     stats: {
 *       total_products, at_risk,
 *       by_status: { good, expiring_soon, expired, no_date },
 *       by_location: [{ name, count }]   // trié par count décroissant
 *     }
 *   }
 * → 401 { error } si non authentifié
 * → 500 { error } si la lecture des lots échoue
 *
 * Pas de cache serveur (données utilisateur) — mais un seul aller-retour client.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('inventory_lots')
    .select('*')
    .order('expiration_date', { ascending: true, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let lots = data || []

  // Charger les contenants physiques en une requête groupée, jamais une
  // requête par lot. Les états terminaux restent disponibles dans la fiche
  // pour rendre l'historique compréhensible.
  const containerMap = new Map()
  const containerizedLotIds = lots.filter(l => l.is_containerized).map(l => l.id)
  if (containerizedLotIds.length) {
    const { data: containers, error: containersError } = await supabase
      .from('inventory_containers')
      .select('id, lot_id, ordinal, status, initial_quantity, remaining_quantity, unit, barcode, expiration_date, adjusted_expiration_date, opened_at, emptied_at')
      .in('lot_id', containerizedLotIds)
      .order('ordinal', { ascending: true })

    if (containersError) {
      return NextResponse.json({ error: containersError.message }, { status: 500 })
    }
    for (const container of containers || []) {
      const group = containerMap.get(container.lot_id) || []
      group.push(container)
      containerMap.set(container.lot_id, group)
    }
  }

  // Enrichir avec les canonical_foods ET les archetypes, en parallèle.
  if (lots.length > 0) {
    const canonicalIds = lots.filter(l => l.canonical_food_id).map(l => l.canonical_food_id)
    const archetypeIds = lots.filter(l => l.archetype_id).map(l => l.archetype_id)

    const [canonicalResult, archetypeResult] = await Promise.all([
      canonicalIds.length
        ? supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, unit_weight_grams, shelf_life_days_pantry')
            .in('id', canonicalIds)
        : Promise.resolve({ data: [] }),
      archetypeIds.length
        ? supabase
            .from('archetypes')
            .select('id, name, expiry_kind, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer, open_shelf_life_days_pantry, open_shelf_life_days_fridge, open_shelf_life_days_freezer')
            .in('id', archetypeIds)
        : Promise.resolve({ data: [] }),
    ])

    const canonicalMap = {}
    ;(canonicalResult.data || []).forEach(c => { canonicalMap[c.id] = c })
    const archetypeMap = {}
    ;(archetypeResult.data || []).forEach(a => { archetypeMap[a.id] = a })

    lots = lots.map(item => ({
      ...item,
      ...(item.canonical_food_id && canonicalMap[item.canonical_food_id]
        ? { canonical_foods: canonicalMap[item.canonical_food_id] }
        : {}),
      ...(item.archetype_id && archetypeMap[item.archetype_id]
        ? { archetypes: archetypeMap[item.archetype_id] }
        : {}),
    }))
  }

  // Transformer : mêmes champs calculés que l'ancien loadPantryItems client.
  const transformed = lots.map(item => {
    const productName = resolveInventoryDisplayName(item)

    const expiryKind = item.archetypes?.expiry_kind || null
    const days = daysUntil(item.adjusted_expiration_date || item.expiration_date)
    // seuil d'alerte selon le type : J-3 pour DLC, J-7 pour DDM
    const threshold = expiryKind === 'DDM' ? 7 : 3
    // string key utilisée par les filtres onglets (good | expiring_soon | expired | no_date)
    const statusKey = days === null ? 'no_date' : days < 0 ? 'expired' : days <= threshold ? 'expiring_soon' : 'good'

    return {
      ...item,
      containers: containerMap.get(item.id) || [],
      container_summary: (() => {
        const containers = containerMap.get(item.id) || []
        if (!item.is_containerized) return null
        return {
          total_count: containers.length,
          sealed_count: containers.filter(c => c.status === 'sealed').length,
          open_count: containers.filter(c => c.status === 'open').length,
          empty_count: containers.filter(c => c.status === 'empty').length,
          discarded_count: containers.filter(c => c.status === 'discarded').length,
          remaining_quantity: containers
            .filter(c => c.status === 'sealed' || c.status === 'open')
            .reduce((sum, c) => sum + Number(c.remaining_quantity || 0), 0),
        }
      })(),
      product_name: productName,
      expiry_kind: expiryKind,
      effective_expiration: getEffectiveExpiration(item),
      expiration_status: statusKey,
      expiration_badge: getExpirationStatus(days, expiryKind),
      days_until_expiration: days,
      // Métadonnées utilisant les vrais noms de colonnes
      grams_per_unit: item.canonical_foods?.unit_weight_grams || null,
      density_g_per_ml: item.canonical_foods?.density_g_per_ml || null,
      primary_unit: item.unit,
    }
  })

  // Stats agrégées (le client peut aussi les recalculer pour ses mises à jour optimistes).
  const byStatus = { good: 0, expiring_soon: 0, expired: 0, no_date: 0 }
  const locationCounts = {}
  for (const item of transformed) {
    byStatus[item.expiration_status] = (byStatus[item.expiration_status] || 0) + 1
    const loc = item.storage_place || 'Non rangé'
    locationCounts[loc] = (locationCounts[loc] || 0) + 1
  }
  const stats = {
    total_products: transformed.length,
    at_risk: byStatus.expired + byStatus.expiring_soon,
    by_status: byStatus,
    by_location: Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }

  return NextResponse.json({ lots: transformed, stats })
}
