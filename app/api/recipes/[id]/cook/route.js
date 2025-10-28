import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules';

/**
 * POST /api/recipes/[id]/cook
 * Crée un plat cuisiné à partir d'une recette
 * Version complète : déduit les ingrédients de l'inventaire
 */
export async function POST(request, { params }) {
  try {
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: recipeId } = params;
    const body = await request.json();
    const { portions, storageMethod, notes, ingredients = [] } = body;

    // Validation
    if (!portions || portions < 1) {
      return NextResponse.json(
        { error: 'Le nombre de portions doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (!storageMethod || !['fridge', 'freezer', 'counter'].includes(storageMethod)) {
      return NextResponse.json(
        { error: 'Mode de stockage invalide' },
        { status: 400 }
      );
    }

    // Récupérer la recette
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: 'Recette non trouvée' },
        { status: 404 }
      );
    }

    // Calculer la date d'expiration
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod);

    // Créer le plat cuisiné
    const { data: dish, error: dishError } = await supabase
      .from('cooked_dishes')
      .insert({
        user_id: user.id,
        name: recipe.name,
        recipe_id: parseInt(recipeId),
        portions_cooked: portions,
        portions_remaining: portions,
        storage_method: storageMethod,
        cooked_at: cookedAt.toISOString(),
        expiration_date: expirationDate.toISOString().split('T')[0], // DATE format
        notes: notes || null,
      })
      .select()
      .single();

    if (dishError) {
      console.error('Erreur création plat:', dishError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du plat' },
        { status: 500 }
      );
    }

    // Déduire les ingrédients de l'inventaire et enregistrer dans cooked_dish_ingredients
    let ingredientsUsed = [];
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        const { lot_id, quantity_used, unit, product_name } = ingredient;

        if (!lot_id || !quantity_used || quantity_used <= 0) {
          continue; // Ignorer les entrées invalides
        }

        // 1. Déduire la quantité du lot d'inventaire
        const { data: lot, error: lotError } = await supabase
          .from('inventory_lots')
          .select('id, quantity, unit, product_name')
          .eq('id', lot_id)
          .eq('user_id', user.id)
          .single();

        if (lotError || !lot) {
          console.warn(`Lot ${lot_id} non trouvé, ignoré`);
          continue;
        }

        const newQuantity = Math.max(0, lot.quantity - quantity_used);

        // Mettre à jour le lot
        const { error: updateError } = await supabase
          .from('inventory_lots')
          .update({ 
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', lot_id);

        if (updateError) {
          console.error(`Erreur mise à jour lot ${lot_id}:`, updateError);
          continue;
        }

        // 2. Enregistrer dans cooked_dish_ingredients
        const { error: ingredientError } = await supabase
          .from('cooked_dish_ingredients')
          .insert({
            dish_id: dish.id,
            lot_id: lot_id,
            quantity_used: quantity_used,
            unit: unit || lot.unit,
            product_name: product_name || lot.product_name
          });

        if (ingredientError) {
          console.error('Erreur enregistrement ingrédient:', ingredientError);
        } else {
          ingredientsUsed.push({
            product_name: product_name || lot.product_name,
            quantity_used,
            unit: unit || lot.unit
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      dish,
      ingredients_used: ingredientsUsed,
      message: `"${recipe.name}" ajouté au garde-manger avec ${portions} portion${portions > 1 ? 's' : ''} !`,
    });

  } catch (error) {
    console.error('Erreur /api/recipes/[id]/cook:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
