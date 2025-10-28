import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * GET /api/recipes/[id]/available-ingredients
 * 
 * Retourne les ingrédients de la recette avec les lots d'inventaire disponibles
 * pour chaque ingrédient, permettant à l'utilisateur de sélectionner quels lots utiliser.
 * 
 * Logique de matching :
 * 1. Si recipe_ingredient a canonical_food_id → chercher lots avec même canonical_food_id
 * 2. Si recipe_ingredient a archetype_id → chercher lots avec même archetype_id
 * 3. Matching intelligent par nom si pas d'IDs (fuzzy matching)
 */
export async function GET(request, { params }) {
  try {
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const recipeId = params.id;

    // 1. Récupérer les ingrédients de la recette avec leurs IDs
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
      console.error('Erreur récupération ingrédients:', ingredientsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des ingrédients' },
        { status: 500 }
      );
    }

    if (!recipeIngredients || recipeIngredients.length === 0) {
      return NextResponse.json({ ingredients: [] });
    }

    // 2. Pour chaque ingrédient, trouver les lots disponibles
    const ingredientsWithLots = await Promise.all(
      recipeIngredients.map(async (ingredient) => {
        let availableLots = [];

        // Cas 1: Matching par canonical_food_id
        if (ingredient.canonical_food_id) {
          const { data: lots } = await supabase
            .from('inventory_lots')
            .select(`
              id,
              product_name,
              quantity,
              unit,
              expiration_date,
              opened_at,
              products(id, canonical_food_id)
            `)
            .eq('user_id', user.id)
            .gt('quantity', 0)
            .or(`canonical_food_id.eq.${ingredient.canonical_food_id}`)
            .order('expiration_date', { ascending: true });

          if (lots && lots.length > 0) {
            availableLots = lots;
          }
        }

        // Cas 2: Si pas de lots trouvés, essayer par archetype_id
        if (availableLots.length === 0 && ingredient.archetype_id) {
          const { data: lots } = await supabase
            .from('inventory_lots')
            .select(`
              id,
              product_name,
              quantity,
              unit,
              expiration_date,
              opened_at,
              products(id, archetype_id)
            `)
            .eq('user_id', user.id)
            .gt('quantity', 0)
            .order('expiration_date', { ascending: true });

          if (lots && lots.length > 0) {
            // Filtrer les lots qui matchent l'archetype
            availableLots = lots.filter(lot => 
              lot.products?.archetype_id === ingredient.archetype_id
            );
          }
        }

        // Cas 3: Matching intelligent par nom (fuzzy)
        if (availableLots.length === 0) {
          const ingredientName = ingredient.canonical_foods?.canonical_name || 
                                 ingredient.archetypes?.name || '';
          
          if (ingredientName) {
            const { data: lots } = await supabase
              .from('inventory_lots')
              .select(`
                id,
                product_name,
                quantity,
                unit,
                expiration_date,
                opened_at
              `)
              .eq('user_id', user.id)
              .gt('quantity', 0)
              .ilike('product_name', `%${ingredientName}%`)
              .order('expiration_date', { ascending: true })
              .limit(5);

            if (lots && lots.length > 0) {
              availableLots = lots;
            }
          }
        }

        return {
          ingredient_id: ingredient.id,
          name: ingredient.canonical_foods?.canonical_name || 
                ingredient.archetypes?.name || 
                'Ingrédient inconnu',
          quantity_needed: ingredient.quantity,
          unit_needed: ingredient.unit,
          notes: ingredient.notes,
          canonical_food_id: ingredient.canonical_food_id,
          archetype_id: ingredient.archetype_id,
          available_lots: availableLots.map(lot => ({
            lot_id: lot.id,
            product_name: lot.product_name,
            quantity_available: lot.quantity,
            unit: lot.unit,
            expiration_date: lot.expiration_date,
            opened_at: lot.opened_at,
            // Calculer les jours avant expiration
            days_until_expiry: lot.expiration_date 
              ? Math.ceil((new Date(lot.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null
          })),
          has_enough: availableLots.some(lot => lot.quantity >= ingredient.quantity)
        };
      })
    );

    return NextResponse.json({
      recipe_id: parseInt(recipeId),
      ingredients: ingredientsWithLots
    });

  } catch (error) {
    console.error('Erreur API available-ingredients:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
