import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/recipes/[id]/available-ingredients
 *
 * Retourne les ingrédients de la recette avec les lots d'inventaire disponibles.
 * Utilise 2 requêtes (recette + lots batch) au lieu d'une boucle N+1.
 */
export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const recipeId = params.id;

    // 1. Ingrédients de la recette
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .select(`
        id,
        recipe_id,
        canonical_food_id,
        archetype_id,
        quantity,
        unit,
        notes,
        canonical_foods(id, canonical_name),
        archetypes(id, name)
      `)
      .eq('recipe_id', recipeId)
      .order('id');

    if (ingredientsError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des ingrédients' },
        { status: 500 }
      );
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return NextResponse.json({ ingredients: [] });
    }

    // 2. Collecter les IDs pour le batch
    const canonicalIds = recipeIngredients
      .map(i => i.canonical_food_id)
      .filter(Boolean);
    const archetypeIds = recipeIngredients
      .map(i => i.archetype_id)
      .filter(Boolean);

    // 3. Une seule requête batch pour tous les lots pertinents
    let lotsQuery = supabase
      .from('inventory_lots')
      .select(`
        id,
        canonical_food_id,
        archetype_id,
        qty_remaining,
        unit,
        expiration_date,
        opened_at,
        canonical_foods(canonical_name),
        archetypes(name)
      `)
      .eq('user_id', user.id)
      .gt('qty_remaining', 0)
      .order('expiration_date', { ascending: true, nullsFirst: false });

    if (canonicalIds.length > 0 && archetypeIds.length > 0) {
      lotsQuery = lotsQuery.or(
        `canonical_food_id.in.(${canonicalIds.join(',')}),archetype_id.in.(${archetypeIds.join(',')})`
      );
    } else if (canonicalIds.length > 0) {
      lotsQuery = lotsQuery.in('canonical_food_id', canonicalIds);
    } else if (archetypeIds.length > 0) {
      lotsQuery = lotsQuery.in('archetype_id', archetypeIds);
    } else {
      // Aucun ID connu → pas de lots
      return NextResponse.json({
        recipe_id: parseInt(recipeId),
        ingredients: recipeIngredients.map(ingredient => ({
          ingredient_id: ingredient.id,
          name: ingredient.canonical_foods?.canonical_name || ingredient.archetypes?.name || 'Ingrédient inconnu',
          quantity_needed: ingredient.quantity,
          unit_needed: ingredient.unit,
          notes: ingredient.notes,
          canonical_food_id: ingredient.canonical_food_id,
          archetype_id: ingredient.archetype_id,
          available_lots: [],
          has_enough: false,
        }))
      });
    }

    const { data: allLots } = await lotsQuery;

    const todayISO = new Date().toISOString().split('T')[0];

    // 4. Regrouper en mémoire
    const ingredientsWithLots = recipeIngredients.map(ingredient => {
      const matchingLots = (allLots || []).filter(lot =>
        (ingredient.canonical_food_id && lot.canonical_food_id === ingredient.canonical_food_id) ||
        (ingredient.archetype_id && lot.archetype_id === ingredient.archetype_id)
      );

      return {
        ingredient_id: ingredient.id,
        name: ingredient.canonical_foods?.canonical_name || ingredient.archetypes?.name || 'Ingrédient inconnu',
        quantity_needed: ingredient.quantity,
        unit_needed: ingredient.unit,
        notes: ingredient.notes,
        canonical_food_id: ingredient.canonical_food_id,
        archetype_id: ingredient.archetype_id,
        available_lots: matchingLots.map(lot => ({
          lot_id: lot.id,
          product_name: lot.canonical_foods?.canonical_name || lot.archetypes?.name || 'Produit',
          quantity_available: lot.qty_remaining,
          unit: lot.unit,
          expiration_date: lot.expiration_date,
          opened_at: lot.opened_at,
          days_until_expiry: lot.expiration_date
            ? Math.round((new Date(String(lot.expiration_date).split('T')[0]) - new Date(todayISO)) / 86400000)
            : null,
        })),
        has_enough: matchingLots.some(lot => lot.qty_remaining >= ingredient.quantity),
      };
    });

    return NextResponse.json({
      recipe_id: parseInt(recipeId),
      ingredients: ingredientsWithLots,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}
