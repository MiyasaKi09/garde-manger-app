// API pour supprimer un plat cuisiné
// DELETE /api/cooked-dishes/[id]

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { deleteCookedDish } from '@/lib/cookedDishesService';

export async function DELETE(request, { params }) {
  try {
    // Vérification authentification
    const { supabase, user, error: authError } = await authenticateRequest(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'ID du plat
    const dishId = parseInt(params.id);
    if (!dishId || isNaN(dishId)) {
      return NextResponse.json(
        { error: 'ID de plat invalide' },
        { status: 400 }
      );
    }

    // Supprimer le plat
    const result = await deleteCookedDish(dishId, user.id, supabase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Erreur DELETE /api/cooked-dishes/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
