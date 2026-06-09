// app/api/restes/analyze/route.js
/**
 * API d'Analyse Anti-Gaspillage
 *
 * POST /api/restes/analyze
 * Analyse l'inventaire et retourne les produits à risque + suggestions
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { analyzeWasteRisks, suggestRecipesForWaste, calculateWasteStats } from '@/lib/wastePreventionService';

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
      daysThreshold = 7,
      includeOpened = true,
      includeStats = true,
      includeRecipeSuggestions = true
    } = body;

    // 1. Analyser les risques de gaspillage
    const riskAnalysis = await analyzeWasteRisks(userId, {
      daysThreshold,
      includeOpened
    }, supabase);

    // 2. Suggérer des recettes (optionnel)
    let recipeSuggestions = null;
    if (includeRecipeSuggestions && riskAnalysis.risks.length > 0) {
      recipeSuggestions = await suggestRecipesForWaste(userId, riskAnalysis, supabase);
    }

    // 3. Calculer les stats (optionnel)
    let stats = null;
    if (includeStats) {
      stats = await calculateWasteStats(userId, 'month', supabase);
    }

    return NextResponse.json({
      success: true,
      analysis: riskAnalysis,
      recipeSuggestions,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API analyze:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  // Mode debug : retourne un exemple de réponse
  return NextResponse.json({
    endpoint: 'POST /api/restes/analyze',
    description: 'Analyse l\'inventaire pour identifier les produits à risque de gaspillage (utilisateur authentifié)',
    parameters: {
      daysThreshold: 'Nombre de jours avant expiration (défaut: 7)',
      includeOpened: 'Inclure les produits ouverts (défaut: true)',
      includeStats: 'Inclure les statistiques (défaut: true)',
      includeRecipeSuggestions: 'Inclure suggestions de recettes (défaut: true)'
    },
    example: {
      daysThreshold: 7,
      includeOpened: true,
      includeStats: true,
      includeRecipeSuggestions: true
    },
    response: {
      analysis: {
        risks: '[Array of products at risk]',
        stats: '{Statistics about risks}',
        summary: '{Summary message}'
      },
      recipeSuggestions: {
        suggestions: '[Array of recipe suggestions]',
        message: 'Summary message'
      },
      stats: {
        period: 'month',
        totalActionsTaken: 0,
        quantitySaved: 0,
        estimatedMoneySaved: 0,
        co2Saved: 0
      }
    }
  });
}
