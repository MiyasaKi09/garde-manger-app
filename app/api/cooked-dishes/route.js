// API REST pour les plats cuisinés
// Endpoints: POST (créer), GET (lister)

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { createCookedDish } from '@/lib/cookedDishesService';

export const dynamic = 'force-dynamic';

// POST /api/cooked-dishes - Créer un nouveau plat cuisiné
export async function POST(request) {
  try {
    // Vérification authentification
    const { supabase, user, error: authError } = await authenticateRequest(request);

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
      notes: notes || null,
      supabaseClient: supabase,
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
//   ?onlyWithPortions=true  → uniquement portions_remaining > 0
//   ?expiringInDays=N       → expiration ≤ aujourd'hui + N jours
//   ?active=true            → restes « mangeables » : portions_remaining > 0
//                             ET non périmés (DLC comparée en UTC), tri DLC asc
export async function GET(request) {
  try {
    // Auth via apiAuth (Bearer + cookies) : le client retourné porte le jeton
    // utilisateur → compatible RLS, contrairement au client anon partagé.
    const { supabase, user, error: authError } = await authenticateRequest(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') === 'true';
    const onlyWithPortions = active || searchParams.get('onlyWithPortions') === 'true';
    const expiringInDays = searchParams.get('expiringInDays');

    // Comparaisons de dates en UTC (cf. règle DLC / timezone)
    const todayUtc = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('cooked_dishes')
      .select('*')
      .eq('user_id', user.id)
      .order('expiration_date', { ascending: true });

    if (onlyWithPortions) {
      query = query.gt('portions_remaining', 0);
    }
    if (active) {
      query = query.gte('expiration_date', todayUtc);
    }
    if (expiringInDays) {
      const target = new Date();
      target.setUTCDate(target.getUTCDate() + parseInt(expiringInDays));
      query = query.lte('expiration_date', target.toISOString().split('T')[0]);
    }

    const { data: dishes, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Erreur lors de la récupération des plats' },
        { status: 500 }
      );
    }

    // Jours restants avant DLC (0 = expire aujourd'hui), calculés en UTC
    const dishesWithDays = (dishes || []).map(dish => ({
      ...dish,
      days_until_expiration: Math.round(
        (Date.parse(dish.expiration_date) - Date.parse(todayUtc)) / 86400000
      )
    }));

    return NextResponse.json({
      success: true,
      dishes: dishesWithDays
    });

  } catch (error) {
    console.error('Erreur GET /api/cooked-dishes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
