/**
 * 🎯 API d'Assemblage Intelligent de Recettes
 * 
 * Endpoint : POST /api/recipes/suggestions
 * 
 * Suggère des accompagnements harmonieux pour un plat principal
 * en utilisant 4 algorithmes de pairing gastronomique :
 * 
 * 1. Food Pairing (gastronomie moléculaire)
 * 2. Règle d'Équilibre (riche ↔ léger)
 * 3. Règle de Contraste (textures opposées)
 * 4. Règle du Terroir (cuisine commune)
 * 
 * @see lib/pairingService.js pour l'implémentation des algorithmes
 * @see ASSEMBLAGE_INTELLIGENT.md pour les spécifications
 */

import { NextResponse } from 'next/server';
import { suggestPairings, debugPairing } from '@/lib/pairingService';

/**
 * POST /api/recipes/suggestions
 * 
 * Body:
 * {
 *   "mainRecipeId": 123,           // ID du plat principal (requis)
 *   "diet": "Végétarien",          // Filtre régime (optionnel)
 *   "season": "Automne",           // Filtre saison (optionnel)
 *   "maxSuggestions": 5            // Nombre max de suggestions (défaut: 5)
 * }
 * 
 * Response:
 * {
 *   "mainRecipe": {
 *     "id": 123,
 *     "name": "Bœuf Bourguignon",
 *     "tags": ["Intensité-Riche", "Française", ...]
 *   },
 *   "suggestions": [
 *     {
 *       "recipe": { id, name, description, ... },
 *       "score": 65,
 *       "scorePercentage": 65,
 *       "reasons": [
 *         { type: "balance", description: "Léger pour équilibrer", score: 25 },
 *         { type: "terroir", description: "Cuisine commune : Française", score: 15 },
 *         ...
 *       ],
 *       "details": { foodPairing: {...}, balance: {...}, ... }
 *     }
 *   ],
 *   "summary": {
 *     "totalCandidates": 150,
 *     "validSuggestions": 47,
 *     "returned": 5
 *   }
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { mainRecipeId, diet, season, maxSuggestions = 5 } = body;

    // Validation
    if (!mainRecipeId || typeof mainRecipeId !== 'number') {
      return NextResponse.json(
        { 
          error: 'Paramètre mainRecipeId requis (nombre)', 
          example: { mainRecipeId: 123 } 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Requête de pairing:', {
      mainRecipeId,
      diet,
      season,
      maxSuggestions,
    });

    // Appeler le service de pairing
    const suggestions = await suggestPairings(mainRecipeId, {
      diet,
      season,
      maxSuggestions,
    });

    // Statistiques
    const summary = {
      totalCandidates: suggestions.length, // Note: ceci sera le nombre après filtrage
      validSuggestions: suggestions.length,
      returned: suggestions.length,
    };

    // Récupérer les infos du plat principal pour la réponse
    const mainRecipeInfo = suggestions.length > 0 
      ? { id: mainRecipeId, name: 'Plat principal' } // On pourrait enrichir cela
      : null;

    return NextResponse.json({
      mainRecipe: mainRecipeInfo,
      suggestions,
      summary,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erreur API suggestions:', error);

    // Erreur métier vs erreur serveur
    if (error.message.includes('non trouvée') || error.message.includes('Erreur tags')) {
      return NextResponse.json(
        { 
          error: 'Recette introuvable ou sans tags', 
          details: error.message,
          help: 'Vérifiez que la recette existe et possède des tags gastronomiques'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la génération des suggestions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recipes/suggestions?debug=true&main=123&side=456
 * 
 * Mode debug : Compare deux recettes spécifiques et affiche les détails du score
 * Utile pour comprendre pourquoi deux plats sont compatibles ou non
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');
    const mainId = parseInt(searchParams.get('main') || '0');
    const sideId = parseInt(searchParams.get('side') || '0');

    if (debug === 'true' && mainId && sideId) {
      console.log(`🔬 Mode debug: Analyse pairing entre ${mainId} et ${sideId}`);

      const debugInfo = await debugPairing(mainId, sideId);

      return NextResponse.json({
        mode: 'debug',
        ...debugInfo,
        interpretation: {
          excellent: debugInfo.scorePercentage >= 70,
          good: debugInfo.scorePercentage >= 50,
          acceptable: debugInfo.scorePercentage >= 30,
          poor: debugInfo.scorePercentage < 30,
        },
      });
    }

    // Documentation de l'API si GET sans paramètres
    return NextResponse.json({
      name: 'API d\'Assemblage Intelligent de Recettes',
      version: '1.0',
      endpoints: {
        suggestions: {
          method: 'POST',
          url: '/api/recipes/suggestions',
          description: 'Suggère des accompagnements pour un plat principal',
          body: {
            mainRecipeId: 'number (requis)',
            diet: 'string (optionnel) - Végétarien, Vegan, Sans Gluten, Sans Lactose',
            season: 'string (optionnel) - Printemps, Été, Automne, Hiver',
            maxSuggestions: 'number (optionnel, défaut: 5)',
          },
        },
        debug: {
          method: 'GET',
          url: '/api/recipes/suggestions?debug=true&main=123&side=456',
          description: 'Analyse détaillée du pairing entre deux recettes',
        },
      },
      algorithms: {
        foodPairing: '30 points - Arômes partagés (gastronomie moléculaire)',
        balance: '25 points - Équilibre intensité (riche ↔ léger)',
        contrast: '20 points - Contraste de textures',
        terroir: '15 points - Cuisine commune',
        season: '10 points - Saison commune',
      },
      documentation: '/ASSEMBLAGE_INTELLIGENT.md',
    });

  } catch (error) {
    console.error('❌ Erreur GET suggestions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
