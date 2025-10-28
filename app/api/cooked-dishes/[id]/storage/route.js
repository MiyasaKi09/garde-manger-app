// API pour changer le mode de stockage d'un plat
// POST /api/cooked-dishes/[id]/storage

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { changeStorageMethod } from '@/lib/cookedDishesService';

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

    // Récupérer le nouveau mode de stockage
    const body = await request.json();
    const { storageMethod } = body;

    if (!storageMethod || !['fridge', 'freezer', 'counter'].includes(storageMethod)) {
      return NextResponse.json(
        { error: 'Mode de stockage invalide (fridge, freezer, ou counter)' },
        { status: 400 }
      );
    }

    // Changer le stockage
    const result = await changeStorageMethod(dishId, user.id, storageMethod);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors du changement de stockage' },
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
    console.error('Erreur POST /api/cooked-dishes/[id]/storage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
