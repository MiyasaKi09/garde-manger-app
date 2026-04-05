import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/courses/add-to-stock
 * Quand un article de courses est coché, on l'ajoute au stock (inventory_lots).
 * Body: { itemId, productName, quantity }
 */
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { itemId, productName, quantity } = await request.json()
    if (!productName) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }

    // 1. Parse quantity string → number + unit
    const parsed = parseQuantity(quantity)

    // 2. Find matching product (archetype first, then canonical_food)
    const match = await findProduct(supabase, productName)

    // 3. Determine storage based on category
    const storage = guessStorage(productName, match)

    // 4. Create inventory lot
    const lotData = {
      canonical_food_id: match?.type === 'canonical' ? match.id : null,
      archetype_id: match?.type === 'archetype' ? match.id : null,
      cultivar_id: null,
      qty_remaining: parsed.qty,
      initial_qty: parsed.qty,
      unit: parsed.unit,
      storage_method: storage.method,
      storage_place: storage.place,
      acquired_on: new Date().toISOString().split('T')[0],
      notes: match ? `Ajouté depuis courses` : `${productName} (ajouté depuis courses)`,
    }

    const { data: lot, error } = await supabase
      .from('inventory_lots')
      .insert([lotData])
      .select()
      .single()

    if (error) {
      // Retry without optional fields in case of schema mismatch
      console.error('Erreur création lot (tentative 1):', error)
      const { data: lot2, error: error2 } = await supabase
        .from('inventory_lots')
        .insert([{
          canonical_food_id: lotData.canonical_food_id,
          archetype_id: lotData.archetype_id,
          qty_remaining: lotData.qty_remaining,
          initial_qty: lotData.initial_qty,
          unit: lotData.unit,
          notes: lotData.notes,
        }])
        .select()
        .single()

      if (error2) {
        console.error('Erreur création lot (tentative 2):', error2)
        return NextResponse.json({ error: error2.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, lot: lot2, matched: !!match })
    }

    return NextResponse.json({ success: true, lot, matched: !!match })
  } catch (err) {
    console.error('Erreur API add-to-stock:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * Parse "800g" → { qty: 800, unit: 'g' }
 * Parse "1kg" → { qty: 1000, unit: 'g' }
 * Parse "2L" → { qty: 2000, unit: 'ml' }
 * Parse "6 pièces" → { qty: 6, unit: 'unités' }
 * Parse "500g (en stock : 200g)" → { qty: 300, unit: 'g' }
 */
function parseQuantity(qtyStr) {
  if (!qtyStr) return { qty: 1, unit: 'unités' }

  const clean = qtyStr.trim().toLowerCase()

  // Handle "en stock" annotations - extract just the needed amount
  const stockMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\s*\(.*en stock.*?(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l)\)/i)
  if (stockMatch) {
    const total = parseFloat(stockMatch[1].replace(',', '.'))
    const inStock = parseFloat(stockMatch[3].replace(',', '.'))
    const unit = stockMatch[2]
    const needed = Math.max(0, total - inStock)
    return normalizeUnit(needed || total, unit)
  }

  // Try number + unit pattern
  const match = clean.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l|unités?|pièces?|boîtes?|paquets?|bouteilles?|sachets?|tranches?|gousses?|feuilles?)/)
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'))
    const unit = match[2]
    return normalizeUnit(num, unit)
  }

  // Just a number
  const numOnly = clean.match(/^(\d+(?:[.,]\d+)?)/)
  if (numOnly) {
    return { qty: parseFloat(numOnly[1].replace(',', '.')), unit: 'unités' }
  }

  return { qty: 1, unit: 'unités' }
}

function normalizeUnit(qty, unit) {
  switch (unit) {
    case 'kg': return { qty: qty * 1000, unit: 'g' }
    case 'l': return { qty: qty * 1000, unit: 'ml' }
    case 'cl': return { qty: qty * 10, unit: 'ml' }
    case 'g': return { qty, unit: 'g' }
    case 'ml': return { qty, unit: 'ml' }
    default: return { qty, unit: 'unités' }
  }
}

/**
 * Search for a product by name in archetypes and canonical_foods.
 */
async function findProduct(supabase, name) {
  const normalized = name.trim().toLowerCase()

  // Try archetype first (exact-ish match via ilike)
  const { data: archetypes } = await supabase
    .from('archetypes')
    .select('id, name')
    .ilike('name', `%${normalized}%`)
    .limit(5)

  if (archetypes?.length) {
    // Prefer exact match, then closest
    const exact = archetypes.find(a => a.name.toLowerCase() === normalized)
    if (exact) return { type: 'archetype', id: exact.id, name: exact.name }
    return { type: 'archetype', id: archetypes[0].id, name: archetypes[0].name }
  }

  // Try canonical_food
  const { data: canonicals } = await supabase
    .from('canonical_foods')
    .select('id, name')
    .ilike('name', `%${normalized}%`)
    .limit(5)

  if (canonicals?.length) {
    const exact = canonicals.find(c => c.name.toLowerCase() === normalized)
    if (exact) return { type: 'canonical', id: exact.id, name: exact.name }
    return { type: 'canonical', id: canonicals[0].id, name: canonicals[0].name }
  }

  // Try with base word (first meaningful word)
  const words = normalized.split(/\s+/).filter(w => w.length > 2 && !['de', 'du', 'des', 'le', 'la', 'les', 'au', 'aux', 'en'].includes(w))
  if (words.length > 0) {
    const baseWord = words[0]
    const { data: fuzzyArch } = await supabase
      .from('archetypes')
      .select('id, name')
      .ilike('name', `%${baseWord}%`)
      .limit(3)

    if (fuzzyArch?.length) {
      return { type: 'archetype', id: fuzzyArch[0].id, name: fuzzyArch[0].name }
    }

    const { data: fuzzyCan } = await supabase
      .from('canonical_foods')
      .select('id, name')
      .ilike('name', `%${baseWord}%`)
      .limit(3)

    if (fuzzyCan?.length) {
      return { type: 'canonical', id: fuzzyCan[0].id, name: fuzzyCan[0].name }
    }
  }

  return null
}

/**
 * Guess storage method and place from product name and category.
 */
function guessStorage(name, match) {
  const n = (name || '').toLowerCase()

  // Frais → frigo
  if (/lait|yaourt|skyr|fromage|crème|beurre|œuf|oeuf|poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|saumon|cabillaud|truite|poisson|jambon|lardons|saucisse/i.test(n)) {
    return { method: 'fridge', place: 'Frigo' }
  }

  // Surgelés
  if (/surgelé|congelé|glace/i.test(n)) {
    return { method: 'freezer', place: 'Congélateur' }
  }

  // Default → garde-manger
  return { method: 'pantry', place: 'Garde-manger' }
}
