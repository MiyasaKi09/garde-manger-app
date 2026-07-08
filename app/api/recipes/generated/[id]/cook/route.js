import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules'
import { deductFromStock } from '@/lib/deductNeeds'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/generated/[id]/cook
 *
 * Cuisine une recette GÉNÉRÉE : crée un cooked_dish et déduit les lots choisis
 * de l'inventaire de façon ATOMIQUE (RPC consume_lots_fefo via lib/deductNeeds,
 * lots scopés user_id, fail-fast avant création du plat).
 * cooked_dishes.recipe_id reste null (le FK pointe vers la table `recipes`,
 * pas `generated_recipes`) ; on conserve le nom.
 *
 * body: { portions, storageMethod, notes?, ingredients: [{ lot_id, quantity_used, unit, product_name }] }
 */
export async function POST(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: recipeId } = await params
  let body = {}
  try { body = await request.json() } catch {}
  const { portions, storageMethod, notes, ingredients = [] } = body || {}

  if (!portions || portions < 1) {
    return NextResponse.json({ error: 'Le nombre de portions doit être supérieur à 0' }, { status: 400 })
  }
  if (!storageMethod || !['fridge', 'freezer', 'counter'].includes(storageMethod)) {
    return NextResponse.json({ error: 'Mode de stockage invalide' }, { status: 400 })
  }

  // Recette générée (scopée à l'utilisateur)
  const { data: recipe, error: recipeError } = await supabase
    .from('generated_recipes')
    .select('id, title')
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .single()

  if (recipeError || !recipe) {
    return NextResponse.json({ error: 'Recette non trouvée' }, { status: 404 })
  }

  // Déduction ATOMIQUE du stock AVANT la création du plat (fail-fast).
  // deductFromStock scope les lots par user_id, borne les quantités au stock
  // restant et applique le tout via la RPC consume_lots_fefo (tout-ou-rien ;
  // le lot vidé est supprimé par la RPC).
  const validIngredients = (ingredients || []).filter(
    i => i && i.lot_id && Number(i.quantity_used) > 0
  )
  const { usedLots, error: deductError } = await deductFromStock(
    supabase,
    user.id,
    { deductions: validIngredients.map(i => ({ lot_id: i.lot_id, quantity_used: i.quantity_used })) }
  )
  if (deductError) {
    return NextResponse.json(
      { error: `Déduction du stock impossible : ${deductError}` },
      { status: 500 }
    )
  }
  const usedLotById = new Map((usedLots || []).map(l => [l.id, l]))

  const cookedAt = new Date()
  const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod)

  const { data: dish, error: dishError } = await supabase
    .from('cooked_dishes')
    .insert({
      user_id: user.id,
      name: recipe.title,
      recipe_id: null, // FK → recipes ; pas applicable aux recettes générées
      portions_cooked: portions,
      portions_remaining: portions,
      storage_method: storageMethod,
      cooked_at: cookedAt.toISOString(),
      expiration_date: expirationDate.toISOString().split('T')[0],
      notes: notes || null,
    })
    .select()
    .single()

  if (dishError) {
    console.error('[Generated Cook] Erreur création plat:', dishError)
    return NextResponse.json({ error: 'Erreur lors de la création du plat' }, { status: 500 })
  }

  // Traçabilité dans cooked_dish_ingredients (la déduction a déjà eu lieu).
  // Un lot entièrement consommé a été SUPPRIMÉ par la RPC → lot_id null
  // (FK ON DELETE SET NULL) ; un lot absent de usedLots (non possédé /
  // introuvable) est ignoré, comme avant.
  const ingredientsUsed = []
  for (const ingredient of validIngredients) {
    const { lot_id, quantity_used, unit, product_name } = ingredient
    const lot = usedLotById.get(lot_id)
    if (!lot) continue
    const lotDeleted = Number(quantity_used) >= (lot.qty_remaining || 0)

    const { error: ciError } = await supabase
      .from('cooked_dish_ingredients')
      .insert({
        dish_id: dish.id,
        lot_id: lotDeleted ? null : lot_id,
        quantity_used,
        unit: unit || lot.unit,
        product_name: product_name || null,
      })
    if (!ciError) {
      ingredientsUsed.push({ product_name: product_name || null, quantity_used, unit: unit || lot.unit })
    }
  }

  return NextResponse.json({
    success: true,
    dish,
    ingredients_used: ingredientsUsed,
    message: `"${recipe.title}" ajouté au garde-manger avec ${portions} portion${portions > 1 ? 's' : ''} !`,
  })
}
