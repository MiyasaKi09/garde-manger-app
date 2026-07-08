// app/api/recipes/[id]/nutrition/calculate/route.js
import { authenticateRequest } from '@/lib/apiAuth';

/**
 * POST /api/recipes/[id]/nutrition/calculate
 * Déclenche la RPC calculate_and_cache_nutrition pour la recette.
 * Utilise le client AUTHENTIFIÉ (plus de service role) : la RLS s'applique,
 * la RPC (SECURITY INVOKER) ne voit que ce que l'utilisateur peut voir.
 * Réponse inchangée : { success, data, message } | { error }.
 */
export async function POST(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request);
    if (authError || !user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = parseInt(id, 10);

    if (!recipeId) {
      return Response.json({ error: 'Recipe ID invalide' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc(
      'calculate_and_cache_nutrition',
      { recipe_id_param: recipeId }
    );

    if (error) {
      console.error('[nutrition/calculate] Erreur RPC:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      data,
      message: 'Valeurs nutritionnelles calculées et mises en cache'
    });

  } catch (error) {
    console.error('[nutrition/calculate] Erreur serveur:', error);
    return Response.json({
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 });
  }
}
