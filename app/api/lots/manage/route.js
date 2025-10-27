import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { openLot, closeLot, changeStorageMethod } from '@/lib/lotManagementService';

/**
 * POST /api/lots/manage
 * Gestion des lots : ouvrir, fermer, changer de stockage
 */
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, lotId, storageMethod } = body;

    if (!lotId) {
      return NextResponse.json(
        { error: 'lotId requis' }, 
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'open':
        result = await openLot(lotId, user.id);
        break;

      case 'close':
        result = await closeLot(lotId, user.id);
        break;

      case 'changeStorage':
        if (!storageMethod) {
          return NextResponse.json(
            { error: 'storageMethod requis pour changeStorage' }, 
            { status: 400 }
          );
        }
        result = await changeStorageMethod(lotId, user.id, storageMethod);
        break;

      default:
        return NextResponse.json(
          { error: `Action invalide: ${action}. Actions valides: open, close, changeStorage` }, 
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur API /lots/manage:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/lots/manage?lotId=xxx
 * Récupère les informations d'un lot avec sa DLC effective
 */
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lotId = searchParams.get('lotId');

    if (!lotId) {
      return NextResponse.json(
        { error: 'lotId requis' }, 
        { status: 400 }
      );
    }

    const { data: lot, error } = await supabase
      .from('inventory_lots_with_effective_dlc')
      .select('*')
      .eq('id', lotId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    if (!lot) {
      return NextResponse.json(
        { error: 'Lot non trouvé' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lot
    });

  } catch (error) {
    console.error('Erreur API GET /lots/manage:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
