// API pour consommer des portions d'un plat
// POST /api/cooked-dishes/[id]/consume

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { consumePortions } from '@/lib/cookedDishesService';

export async function POST(request, { params }) {
  try {
    // Vérification authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
    const result = await consumePortions(dishId, user.id, portionsToConsume);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la consommation' },
        { status: 500 }
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
