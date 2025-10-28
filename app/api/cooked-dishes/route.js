// API REST pour les plats cuisinés
// Endpoints: POST (créer), GET (lister)

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  createCookedDish,
  getCookedDishes
} from '@/lib/cookedDishesService';

// POST /api/cooked-dishes - Créer un nouveau plat cuisiné
export async function POST(request) {
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

    // Récupérer les données
    const body = await request.json();
    const {
      name,
      recipeId,
      portionsCooked,
      storageMethod,
      ingredientsUsed,
      notes
    } = body;

    // Validation
    if (!name || !portionsCooked) {
      return NextResponse.json(
        { error: 'Paramètres manquants (name, portionsCooked requis)' },
        { status: 400 }
      );
    }

    // Créer le plat
    const result = await createCookedDish({
      userId: user.id,
      name,
      recipeId: recipeId || null,
      portionsCooked: parseInt(portionsCooked),
      storageMethod: storageMethod || 'fridge',
      ingredientsUsed: ingredientsUsed || [],
      notes: notes || null
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la création du plat' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dish: result.dish,
      message: result.message,
      daysUntilExpiration: result.daysUntilExpiration
    });

  } catch (error) {
    console.error('Erreur POST /api/cooked-dishes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET /api/cooked-dishes - Lister les plats cuisinés
export async function GET(request) {
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

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const onlyWithPortions = searchParams.get('onlyWithPortions') === 'true';
    const expiringInDays = searchParams.get('expiringInDays');

    const options = {
      onlyWithPortions,
      expiringInDays: expiringInDays ? parseInt(expiringInDays) : null
    };

    // Récupérer les plats
    const result = await getCookedDishes(user.id, options);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la récupération des plats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dishes: result.dishes
    });

  } catch (error) {
    console.error('Erreur GET /api/cooked-dishes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
