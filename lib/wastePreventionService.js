// lib/wastePreventionService.js
/**
 * Service d'Intelligence Anti-Gaspillage
 * 
 * Algorithmes:
 * 1. Scoring d'urgence des produits qui expirent
 * 2. Suggestions de recettes utilisant ces produits
 * 3. Actions anti-gaspillage (congélation, transformation)
 * 4. Calcul d'impact et statistiques
 */

import { supabase } from './supabaseClient';

// ============ CONSTANTES ============

const URGENCY_LEVELS = {
  CRITICAL: { days: 0, label: 'CRITIQUE', color: '#ef4444', score: 100 },
  URGENT: { days: 1, label: 'URGENT', color: '#f97316', score: 85 },
  WARNING: { days: 3, label: 'ATTENTION', color: '#f59e0b', score: 65 },
  SOON: { days: 7, label: 'BIENTÔT', color: '#eab308', score: 40 },
  NORMAL: { days: 14, label: 'NORMAL', color: '#84cc16', score: 20 },
  FRESH: { days: Infinity, label: 'FRAIS', color: '#22c55e', score: 0 }
};

const WASTE_PREVENTION_ACTIONS = {
  FREEZE: {
    id: 'freeze',
    label: 'Congeler',
    icon: '🧊',
    description: 'Prolonger de plusieurs mois',
    canFreeze: (product) => !['Salade', 'Concombre', 'Tomate'].includes(product.name)
  },
  PRESERVE: {
    id: 'preserve',
    label: 'Conserver',
    icon: '🥫',
    description: 'Faire une conserve/confiture',
    canPreserve: (product) => ['Fruits', 'Légumes', 'Viande'].some(cat => 
      product.category?.toLowerCase().includes(cat.toLowerCase())
    )
  },
  COOK: {
    id: 'cook',
    label: 'Cuisiner',
    icon: '👨‍🍳',
    description: 'Utiliser dans une recette',
    canCook: () => true
  },
  TRANSFORM: {
    id: 'transform',
    label: 'Transformer',
    icon: '🔄',
    description: 'Compote, soupe, etc.',
    canTransform: (product) => ['Fruits', 'Légumes'].some(cat =>
      product.category?.toLowerCase().includes(cat.toLowerCase())
    )
  },
  SHARE: {
    id: 'share',
    label: 'Partager',
    icon: '🤝',
    description: 'Donner à un voisin/association',
    canShare: () => true
  }
};

// ============ UTILITAIRES ============

/**
 * Calcule le nombre de jours avant expiration
 */
function daysUntilExpiration(expirationDate) {
  if (!expirationDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Détermine le niveau d'urgence
 */
function getUrgencyLevel(daysLeft) {
  if (daysLeft === null) return URGENCY_LEVELS.NORMAL;
  if (daysLeft < 0) return URGENCY_LEVELS.CRITICAL;
  if (daysLeft <= URGENCY_LEVELS.URGENT.days) return URGENCY_LEVELS.URGENT;
  if (daysLeft <= URGENCY_LEVELS.WARNING.days) return URGENCY_LEVELS.WARNING;
  if (daysLeft <= URGENCY_LEVELS.SOON.days) return URGENCY_LEVELS.SOON;
  if (daysLeft <= URGENCY_LEVELS.NORMAL.days) return URGENCY_LEVELS.NORMAL;
  return URGENCY_LEVELS.FRESH;
}

/**
 * Calcule un score d'urgence (0-100)
 */
function calculateUrgencyScore(lot) {
  const daysLeft = daysUntilExpiration(lot.dlc || lot.expiration_date || lot.effective_expiration);
  const urgency = getUrgencyLevel(daysLeft);
  
  let score = urgency.score;
  
  // Bonus si le lot est ouvert
  if (lot.opened_at) {
    score += 15;
  }
  
  // Bonus pour grande quantité (risque de gaspillage élevé)
  const qty = parseFloat(lot.qty_remaining || lot.qty || 0);
  if (qty > 10) {
    score += 10;
  } else if (qty > 5) {
    score += 5;
  }
  
  return Math.min(100, score);
}

// ============ FONCTIONS PRINCIPALES ============

/**
 * Analyse l'inventaire et identifie les produits à risque
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options d'analyse
 * @param {Object} [client] - Client Supabase (serveur) ; fallback navigateur si omis
 */
export async function analyzeWasteRisks(userId, options = {}, client = supabase) {
  const {
    daysThreshold = 7,  // Produits qui expirent dans X jours
    includeOpened = true,
    minUrgencyScore = 40
  } = options;

  try {
    // Récupérer les lots de l'utilisateur
    const { data: lots, error } = await client
      .from('inventory_lots')
      .select(`
        id,
        qty,
        qty_remaining,
        unit,
        dlc,
        expiration_date,
        effective_expiration,
        opened_at,
        location_id,
        product_id,
        product:products_catalog(
          id,
          name,
          category,
          default_unit
        ),
        location:locations(
          name,
          icon
        )
      `)
      .eq('user_id', userId)
      .order('dlc', { ascending: true });

    if (error) throw error;

    // Analyser chaque lot
    const risks = [];
    const stats = {
      totalAtRisk: 0,
      criticalCount: 0,
      urgentCount: 0,
      warningCount: 0,
      totalQuantityAtRisk: 0,
      categoriesAtRisk: {}
    };

    for (const lot of lots || []) {
      const daysLeft = daysUntilExpiration(
        lot.dlc || lot.expiration_date || lot.effective_expiration
      );
      
      // Filtrer selon critères
      if (daysLeft === null) continue;
      if (daysLeft > daysThreshold && !lot.opened_at) continue;
      if (!includeOpened && !lot.opened_at && daysLeft > daysThreshold) continue;
      
      const urgency = getUrgencyLevel(daysLeft);
      const score = calculateUrgencyScore(lot);
      
      if (score < minUrgencyScore) continue;

      // Actions recommandées
      const actions = Object.values(WASTE_PREVENTION_ACTIONS)
        .filter(action => action.canFreeze?.(lot.product) ?? 
                         action.canPreserve?.(lot.product) ??
                         action.canCook?.() ??
                         action.canTransform?.(lot.product) ??
                         action.canShare?.() ?? false)
        .map(action => ({
          id: action.id,
          label: action.label,
          icon: action.icon,
          description: action.description
        }));

      const risk = {
        lotId: lot.id,
        productId: lot.product?.id,
        productName: lot.product?.name || 'Produit inconnu',
        category: lot.product?.category,
        quantity: lot.qty_remaining || lot.qty || 0,
        unit: lot.unit || lot.product?.default_unit || 'u',
        daysLeft,
        expirationDate: lot.dlc || lot.expiration_date || lot.effective_expiration,
        isOpened: !!lot.opened_at,
        openedAt: lot.opened_at,
        location: lot.location?.name || 'Non spécifié',
        locationIcon: lot.location?.icon || '📦',
        urgency: {
          level: urgency.label,
          color: urgency.color,
          score
        },
        actions,
        recommendation: getRecommendation(urgency, lot)
      };

      risks.push(risk);

      // Mettre à jour les stats
      stats.totalAtRisk++;
      if (urgency.label === 'CRITIQUE') stats.criticalCount++;
      else if (urgency.label === 'URGENT') stats.urgentCount++;
      else if (urgency.label === 'ATTENTION') stats.warningCount++;
      
      stats.totalQuantityAtRisk += parseFloat(risk.quantity || 0);
      
      const cat = risk.category || 'Autre';
      stats.categoriesAtRisk[cat] = (stats.categoriesAtRisk[cat] || 0) + 1;
    }

    // Trier par score d'urgence décroissant
    risks.sort((a, b) => b.urgency.score - a.urgency.score);

    return {
      risks,
      stats,
      summary: {
        total: stats.totalAtRisk,
        critical: stats.criticalCount,
        urgent: stats.urgentCount,
        warning: stats.warningCount,
        message: getWasteSummaryMessage(stats)
      }
    };

  } catch (error) {
    console.error('Erreur analyse anti-gaspillage:', error);
    throw error;
  }
}

/**
 * Suggère des recettes utilisant les produits à risque
 */
export async function suggestRecipesForWaste(userId, riskAnalysis, client = supabase) {
  try {
    if (!riskAnalysis?.risks || riskAnalysis.risks.length === 0) {
      return { suggestions: [], message: 'Aucun produit à risque' };
    }

    // Récupérer les top 5 produits les plus urgents
    const urgentProducts = riskAnalysis.risks
      .slice(0, 5)
      .map(r => r.productName);

    // Rechercher des recettes qui utilisent ces produits
    // Note: Nécessite que recipe_ingredients soit lié aux noms de produits
    const { data: recipes, error } = await client
      .from('recipes')
      .select(`
        id,
        name,
        description,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        role,
        recipe_ingredients!inner(
          id,
          quantity,
          unit,
          notes
        )
      `)
      .limit(20);

    if (error) throw error;

    const suggestions = [];

    for (const recipe of recipes || []) {
      // Calculer combien de produits à risque cette recette utilise
      const matchingProducts = urgentProducts.filter(productName => {
        const recipeName = recipe.name.toLowerCase();
        const desc = (recipe.description || '').toLowerCase();
        const productLower = productName.toLowerCase();
        
        // Recherche basique par nom (à améliorer avec matching intelligent)
        return recipeName.includes(productLower) || desc.includes(productLower);
      });

      if (matchingProducts.length > 0) {
        suggestions.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          description: recipe.description,
          prepTime: recipe.prep_time_minutes,
          cookTime: recipe.cook_time_minutes,
          servings: recipe.servings,
          role: recipe.role,
          matchingProducts,
          matchCount: matchingProducts.length,
          wasteReduction: calculateWasteReduction(matchingProducts, riskAnalysis),
          urgencyScore: matchingProducts.reduce((sum, prod) => {
            const risk = riskAnalysis.risks.find(r => r.productName === prod);
            return sum + (risk?.urgency?.score || 0);
          }, 0) / matchingProducts.length
        });
      }
    }

    // Trier par nombre de produits sauvés et urgence
    suggestions.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.urgencyScore - a.urgencyScore;
    });

    return {
      suggestions: suggestions.slice(0, 10),
      message: suggestions.length > 0
        ? `${suggestions.length} recettes trouvées pour sauver vos produits`
        : 'Aucune recette trouvée avec ces ingrédients'
    };

  } catch (error) {
    console.error('Erreur suggestions recettes:', error);
    throw error;
  }
}

/**
 * Enregistre une action anti-gaspillage
 */
export async function logWastePreventionAction(userId, action, client = supabase) {
  const {
    lotId,
    actionType,  // 'freeze', 'preserve', 'cook', 'transform', 'share'
    quantitySaved,
    notes
  } = action;

  try {
    // Créer une table waste_prevention_log si nécessaire
    const { data, error } = await client
      .from('waste_prevention_log')
      .insert({
        user_id: userId,
        lot_id: lotId,
        action_type: actionType,
        quantity_saved: quantitySaved,
        notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: true, logged: false };
    }

    return { success: true, logged: true, data };

  } catch (error) {
    console.error('Erreur log action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcule les statistiques de gaspillage évité
 */
export async function calculateWasteStats(userId, period = 'month', client = supabase) {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data: actions, error } = await client
      .from('waste_prevention_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error && error.code !== 'PGRST116') { // Ignorer si table n'existe pas
      throw error;
    }

    const stats = {
      period,
      totalActionsTaken: actions?.length || 0,
      quantitySaved: actions?.reduce((sum, a) => sum + (parseFloat(a.quantity_saved) || 0), 0) || 0,
      actionBreakdown: {},
      estimatedMoneySaved: 0,
      co2Saved: 0
    };

    // Répartition par type d'action
    for (const action of actions || []) {
      const type = action.action_type;
      stats.actionBreakdown[type] = (stats.actionBreakdown[type] || 0) + 1;
    }

    // Estimation argent économisé (moyenne 5€/kg de nourriture)
    stats.estimatedMoneySaved = Math.round(stats.quantitySaved * 5);

    // Estimation CO2 évité (moyenne 2.5kg CO2/kg nourriture)
    stats.co2Saved = Math.round(stats.quantitySaved * 2.5 * 10) / 10;

    return stats;

  } catch (error) {
    console.error('Erreur calcul stats:', error);
    return {
      period,
      totalActionsTaken: 0,
      quantitySaved: 0,
      actionBreakdown: {},
      estimatedMoneySaved: 0,
      co2Saved: 0
    };
  }
}

// ============ FONCTIONS UTILITAIRES ============

function getRecommendation(urgency, lot) {
  if (urgency.label === 'CRITIQUE') {
    return `⚠️ URGENT : Vérifier l'état et décider immédiatement (cuisiner, congeler ou jeter si périmé)`;
  }
  if (urgency.label === 'URGENT') {
    return `🔥 À consommer ou congeler aujourd'hui`;
  }
  if (urgency.label === 'ATTENTION') {
    return `⏰ Planifier utilisation dans les 3 prochains jours`;
  }
  if (urgency.label === 'BIENTÔT') {
    return `📅 À prévoir dans la semaine`;
  }
  if (lot.opened_at) {
    return `📦 Lot ouvert : à surveiller`;
  }
  return `✅ Rien à signaler`;
}

function getWasteSummaryMessage(stats) {
  if (stats.criticalCount > 0) {
    return `⚠️ ${stats.criticalCount} produit(s) nécessitent une action immédiate !`;
  }
  if (stats.urgentCount > 0) {
    return `🔥 ${stats.urgentCount} produit(s) à consommer ou congeler rapidement`;
  }
  if (stats.warningCount > 0) {
    return `⏰ ${stats.warningCount} produit(s) à surveiller cette semaine`;
  }
  return `✅ Pas de produits urgents à gérer`;
}

function calculateWasteReduction(matchingProducts, riskAnalysis) {
  // Calcule combien de kg/unités seraient sauvés
  let totalSaved = 0;
  
  for (const productName of matchingProducts) {
    const risk = riskAnalysis.risks.find(r => r.productName === productName);
    if (risk) {
      totalSaved += parseFloat(risk.quantity || 0);
    }
  }
  
  return {
    quantity: Math.round(totalSaved * 10) / 10,
    estimatedValue: Math.round(totalSaved * 5), // 5€/kg moyenne
    co2: Math.round(totalSaved * 2.5 * 10) / 10  // 2.5kg CO2/kg
  };
}

// ============ EXPORTS ============

export {
  URGENCY_LEVELS,
  WASTE_PREVENTION_ACTIONS,
  daysUntilExpiration,
  getUrgencyLevel,
  calculateUrgencyScore
};
