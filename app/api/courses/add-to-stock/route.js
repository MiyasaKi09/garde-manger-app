import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { matchIngredient } from '@/lib/ingredientMatcher'

/**
 * POST /api/courses/add-to-stock
 * Ajoute un article de courses au stock (inventory_lots) quand il est coché.
 *
 * Body:
 *   { productName, quantity,
 *     canonicalFoodId?, archetypeId?,         ← IDs depuis nutrition_plan_shopping_items
 *     containerQty?, containerSize?, containerUnit?   ← conditionnement (ex: 3 × 1L)
 *   }
 *
 * Flux :
 *   1. Résoudre l'ingrédient (IDs directs ou recherche par nom)
 *   2. Déduire le mode de stockage (frigo/congélateur/garde-manger)
 *   3. Lire shelf_life_days_[method] depuis archetypes / canonical_foods
 *   4. Calculer expiration_date = aujourd'hui + shelf_life_days
 *   5. Créer le ou les lots (N lots si conditionnement multi-contenants)
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
      canonicalFoodId = null,
      archetypeId = null,
      containerQty = null,
      containerSize = null,
      containerUnit = null,
    } = await request.json()

    if (!productName) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }

    // 1. Résoudre les IDs ingrédient via le matcher partagé
    let resolvedArchetypeId = archetypeId
    let resolvedCanonicalFoodId = canonicalFoodId

    if (!resolvedArchetypeId && !resolvedCanonicalFoodId) {
      const match = await matchIngredient(supabase, productName)
      resolvedArchetypeId = match.archetypeId
      resolvedCanonicalFoodId = match.canonicalFoodId
    }

    const matched = !!(resolvedArchetypeId || resolvedCanonicalFoodId)

    // 2. Déduire le mode de stockage depuis le nom du produit
    const storage = guessStorage(productName)

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
      notes: productName,
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

    // 7. Insérer les lots
    const { data: lots, error } = await supabase
      .from('inventory_lots')
      .insert(lotsToCreate)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lots, matched, lotsCreated: lots.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
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

/**
 * Parse une chaîne de quantité en {qty, unit}.
 * Gère le format "600 g (400 g en stock)" → extrait 600 g.
 */
function parseQuantity(qtyStr) {
  if (!qtyStr) return { qty: 1, unit: 'unités' }
  const clean = qtyStr.trim().toLowerCase()

  // Ignorer l'annotation "(X en stock)" et lire juste la partie avant
  const withNote = clean.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l|unités?|pièces?|boîtes?|paquets?|bouteilles?|sachets?|tranches?|gousses?|feuilles?)\s*\(/)
  if (withNote) return normalizeUnit(parseFloat(withNote[1].replace(',', '.')), withNote[2])

  const m = clean.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l|unités?|pièces?|boîtes?|paquets?|bouteilles?|sachets?|tranches?|gousses?|feuilles?)/)
  if (m) return normalizeUnit(parseFloat(m[1].replace(',', '.')), m[2])

  const numOnly = clean.match(/^(\d+(?:[.,]\d+)?)/)
  if (numOnly) return { qty: parseFloat(numOnly[1].replace(',', '.')), unit: 'unités' }

  return { qty: 1, unit: 'unités' }
}

function normalizeUnit(qty, unit) {
  switch (unit) {
    case 'kg': return { qty: qty * 1000, unit: 'g' }
    case 'l':  return { qty: qty * 1000, unit: 'ml' }
    case 'cl': return { qty: qty * 10,   unit: 'ml' }
    case 'g':  return { qty, unit: 'g' }
    case 'ml': return { qty, unit: 'ml' }
    default:   return { qty, unit: 'unités' }
  }
}
