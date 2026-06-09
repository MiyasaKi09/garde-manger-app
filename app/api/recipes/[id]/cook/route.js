import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules';

/**
 * POST /api/recipes/[id]/cook
 * Crée un plat cuisiné à partir d'une recette
 * Version complète : déduit les ingrédients de l'inventaire
 */
export async function POST(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id: recipeId } = await params;
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

    // Récupérer les lots utilisés pour appliquer la règle DLC des restes
    // (DLC plat = min(règle stockage, DLC lot le plus court))
    let usedLotRows = [];
    const validLotIds = (ingredients || [])
      .filter(i => i.lot_id && i.quantity_used > 0)
      .map(i => i.lot_id);
    if (validLotIds.length > 0) {
      const { data: fetchedLots } = await supabase
        .from('inventory_lots')
        .select('id, adjusted_expiration_date, expiration_date, best_before')
        .in('id', validLotIds)
        .eq('user_id', user.id);
      usedLotRows = fetchedLots || [];
    }

    // Calculer la date d'expiration (inclut la contrainte DLC des lots)
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod, usedLotRows);

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

        // TODO: basculer sur la RPC consume_lots_fefo (migration 20260609) une fois appliquée
        // 1. Déduire la quantité du lot d'inventaire
        const { data: lot, error: lotError } = await supabase
          .from('inventory_lots')
          .select('id, qty_remaining, unit')
          .eq('id', lot_id)
          .eq('user_id', user.id)
          .single();

        if (lotError || !lot) {
          continue;
        }

        const newQty = Math.max(0, lot.qty_remaining - quantity_used);

        // Mettre à jour le lot
        const { error: updateError } = await supabase
          .from('inventory_lots')
          .update({ qty_remaining: newQty })
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
            product_name: product_name || null
          });

        if (ingredientError) {
          console.error('Erreur enregistrement ingrédient:', ingredientError);
        } else {
          ingredientsUsed.push({
            product_name: product_name || null,
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
