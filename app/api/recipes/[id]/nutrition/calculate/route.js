// app/api/recipes/[id]/nutrition/calculate/route.js
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const recipeId = parseInt(id);
    const supabase = getSupabase();

    if (!recipeId) {
      return Response.json({ error: 'Recipe ID invalide' }, { status: 400 });
    }

    console.log(`🔄 Calcul nutritionnel pour recette ${recipeId}...`);

    // Appeler calculate_and_cache_nutrition avec service role
    const { data, error } = await supabase.rpc(
      'calculate_and_cache_nutrition',
      { recipe_id_param: recipeId }
    );

    if (error) {
      console.error('❌ Erreur:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Calcul terminé et mis en cache');

    return Response.json({ 
      success: true, 
      data,
      message: 'Valeurs nutritionnelles calculées et mises en cache'
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return Response.json({ 
      error: 'Erreur serveur', 
      details: error.message 
    }, { status: 500 });
  }
}
