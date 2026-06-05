import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/generated/[id]/cook
 *
 * Cuisine une recette GÉNÉRÉE : crée un cooked_dish et déduit les lots choisis
 * de l'inventaire. cooked_dishes.recipe_id reste null (le FK pointe vers la
 * table `recipes`, pas `generated_recipes`) ; on conserve le nom.
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

  // Déduction des lots
  const ingredientsUsed = []
  for (const ingredient of ingredients) {
    const { lot_id, quantity_used, unit, product_name } = ingredient || {}
    if (!lot_id || !quantity_used || quantity_used <= 0) continue

    const { data: lot, error: lotError } = await supabase
      .from('inventory_lots')
      .select('id, qty_remaining, unit')
      .eq('id', lot_id)
      .eq('user_id', user.id)
      .single()
    if (lotError || !lot) continue

    const newQty = Math.max(0, lot.qty_remaining - quantity_used)
    const { error: updateError } = await supabase
      .from('inventory_lots')
      .update({ qty_remaining: newQty })
      .eq('id', lot_id)
      .eq('user_id', user.id)
    if (updateError) {
      console.error(`[Generated Cook] Erreur mise à jour lot ${lot_id}:`, updateError)
      continue
    }

    const { error: ciError } = await supabase
      .from('cooked_dish_ingredients')
      .insert({
        dish_id: dish.id,
        lot_id,
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
