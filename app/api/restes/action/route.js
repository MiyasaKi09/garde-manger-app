// app/api/restes/action/route.js
/**
 * API d'Actions Anti-Gaspillage
 *
 * POST /api/restes/action
 * Enregistre une action de prévention du gaspillage
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { logWastePreventionAction } from '@/lib/wastePreventionService';

export async function POST(req) {
  try {
    // Auth : userId dérivé de la session, jamais du body
    const { supabase, user, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const {
      lotId,
      actionType,  // 'freeze', 'preserve', 'cook', 'transform', 'share'
      quantitySaved,
      notes
    } = body;

    if (!lotId || !actionType) {
      return NextResponse.json(
        { error: 'lotId et actionType sont requis' },
        { status: 400 }
      );
    }

    // Valider le type d'action
    const validActions = ['freeze', 'preserve', 'cook', 'transform', 'share', 'consumed'];
    if (!validActions.includes(actionType)) {
      return NextResponse.json(
        { error: `actionType doit être: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Enregistrer l'action
    const result = await logWastePreventionAction(userId, {
      lotId,
      actionType,
      quantitySaved: quantitySaved || 0,
      notes
    }, supabase);

    if (!result.success) {
      console.error('Erreur log action anti-gaspillage:', result.error);
      return NextResponse.json(
        { error: 'Échec de l\'enregistrement de l\'action', message: result.error },
        { status: 500 }
      );
    }

    // Actions spécifiques selon le type
    let updateResult = null;

    if (actionType === 'freeze') {
      // Mettre à jour la localisation du lot vers le congélateur
      const { data, error } = await supabase
        .from('inventory_lots')
        .update({
          storage_method: 'freezer',
          // Prolonger la DLC (exemple: +6 mois)
          // expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .eq('id', lotId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Erreur mutation freeze:', error);
        return NextResponse.json(
          { error: 'Échec de la mise à jour du lot (congélation)', message: error.message },
          { status: 500 }
        );
      }

      updateResult = { action: 'freeze', data };
    }

    if (actionType === 'consumed') {
      // Marquer le lot comme consommé (ou réduire la quantité)
      const { data, error } = await supabase
        .from('inventory_lots')
        .update({
          qty_remaining: 0,
          consumed_at: new Date().toISOString()
        })
        .eq('id', lotId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Erreur mutation consumed:', error);
        return NextResponse.json(
          { error: 'Échec de la mise à jour du lot (consommation)', message: error.message },
          { status: 500 }
        );
      }

      updateResult = { action: 'consumed', data };
    }

    return NextResponse.json({
      success: true,
      action: result,
      update: updateResult,
      message: getSuccessMessage(actionType),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API action:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'enregistrement de l\'action',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  return NextResponse.json({
    endpoint: 'POST /api/restes/action',
    description: 'Enregistre une action de prévention du gaspillage (utilisateur authentifié)',
    parameters: {
      lotId: 'ID du lot concerné (requis)',
      actionType: 'Type d\'action: freeze, preserve, cook, transform, share, consumed (requis)',
      quantitySaved: 'Quantité sauvée (optionnel)',
      notes: 'Notes additionnelles (optionnel)'
    },
    validActions: ['freeze', 'preserve', 'cook', 'transform', 'share', 'consumed'],
    example: {
      lotId: 'lot-456',
      actionType: 'freeze',
      quantitySaved: 500,
      notes: 'Congelé pour une utilisation ultérieure'
    }
  });
}

function getSuccessMessage(actionType) {
  const messages = {
    freeze: '🧊 Produit congelé avec succès ! Il se conservera plusieurs mois.',
    preserve: '🥫 Conservation enregistrée ! Pensez à étiqueter avec la date.',
    cook: '👨‍🍳 Recette ajoutée au planning ! Bon appétit.',
    transform: '🔄 Transformation enregistrée ! Produit sauvé du gaspillage.',
    share: '🤝 Partage enregistré ! Merci pour votre générosité.',
    consumed: '✅ Produit consommé ! Zéro gaspillage.'
  };
  return messages[actionType] || '✅ Action enregistrée avec succès !';
}
