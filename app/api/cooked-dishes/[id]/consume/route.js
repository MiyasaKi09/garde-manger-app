// API pour consommer des portions d'un plat
// POST /api/cooked-dishes/[id]/consume

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { consumePortions } from '@/lib/cookedDishesService';

export async function POST(request, { params }) {
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

    // Récupérer le nombre de portions à consommer
    const body = await request.json();
    const portionsToConsume = parseInt(body.portions) || 1;

    if (portionsToConsume <= 0) {
      return NextResponse.json(
        { error: 'Nombre de portions invalide' },
        { status: 400 }
      );
    }

    // Consommer les portions
    const result = await consumePortions(dishId, user.id, portionsToConsume, supabase);

    if (!result.success) {
      // Plat périmé : conflit métier (le plat existe mais n'est plus
      // consommable) → 409, jamais une erreur serveur.
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la consommation' },
        { status: result.expired ? 409 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dish: result.dish,
      message: result.message,
      fullyConsumed: result.fullyConsumed
    });

  } catch (error) {
    console.error('Erreur POST /api/cooked-dishes/[id]/consume:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
