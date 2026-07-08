import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { calculateCookedDishExpiration } from '@/lib/shelfLifeRules';
import { deductFromStock } from '@/lib/deductNeeds';

/**
 * POST /api/recipes/[id]/cook
 * Crée un plat cuisiné à partir d'une recette et déduit les ingrédients de
 * l'inventaire de façon ATOMIQUE (RPC consume_lots_fefo via lib/deductNeeds :
 * lots scopés user_id, quantités bornées au stock restant, tout-ou-rien).
 * Fail-fast : si la déduction échoue, aucun plat n'est créé.
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

    // Récupérer la recette (catalogue partagé — pas de colonne user_id)
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

    // Ingrédients valides à déduire (lot + quantité > 0)
    const validIngredients = (ingredients || []).filter(
      i => i && i.lot_id && Number(i.quantity_used) > 0
    );

    // 1. Déduction ATOMIQUE du stock, AVANT la création du plat (fail-fast).
    //    deductFromStock scope les lots par user_id (ownership, M9), borne les
    //    quantités au stock restant et applique le tout via la RPC
    //    consume_lots_fefo (verrou de ligne, tout-ou-rien ; le lot vidé est
    //    supprimé par la RPC). usedLots (état AVANT déduction) sert au calcul
    //    de la DLC du plat : min(règle stockage, DLC lot le plus court).
    const { usedLots, error: deductError } = await deductFromStock(
      supabase,
      user.id,
      { deductions: validIngredients.map(i => ({ lot_id: i.lot_id, quantity_used: i.quantity_used })) }
    );
    if (deductError) {
      return NextResponse.json(
        { error: `Déduction du stock impossible : ${deductError}` },
        { status: 500 }
      );
    }
    const usedLotById = new Map((usedLots || []).map(l => [l.id, l]));

    // 2. Calculer la date d'expiration (inclut la contrainte DLC des lots)
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod, usedLots);

    // 3. Créer le plat cuisiné
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

    // 4. Traçabilité dans cooked_dish_ingredients. Un lot entièrement consommé
    //    a été SUPPRIMÉ par la RPC → lot_id null (la FK est ON DELETE SET NULL,
    //    on garde product_name/quantité). Un lot absent de usedLots n'appartenait
    //    pas à l'utilisateur ou n'existait plus → ignoré (comme avant).
    const ingredientsUsed = [];
    for (const ingredient of validIngredients) {
      const { lot_id, quantity_used, unit, product_name } = ingredient;
      const lot = usedLotById.get(lot_id);
      if (!lot) continue;
      const lotDeleted = Number(quantity_used) >= (lot.qty_remaining || 0);

      const { error: ingredientError } = await supabase
        .from('cooked_dish_ingredients')
        .insert({
          dish_id: dish.id,
          lot_id: lotDeleted ? null : lot_id,
          quantity_used: quantity_used,
          unit: unit || lot.unit,
          product_name: product_name || null,
        });

      if (ingredientError) {
        console.error('Erreur enregistrement ingrédient:', ingredientError);
      } else {
        ingredientsUsed.push({
          product_name: product_name || null,
          quantity_used,
          unit: unit || lot.unit,
        });
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
