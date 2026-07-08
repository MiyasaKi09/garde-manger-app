// lib/wastePreventionService.js
/**
 * Service d'Intelligence Anti-Gaspillage — C5 rewrite (audit juillet 2026)
 *
 * Corrections appliquées :
 * - Requête réécrite contre le schéma réel (suppression de dlc, effective_expiration,
 *   products_catalog qui n'existent pas)
 * - Calculs de jours UTC-safe via daysUntil() de lib/dates.js
 * - Seuils d'urgence différenciés DLC (strict) / DDM (souple)
 * - Matching recettes via IDs FK de recipe_ingredients (plus d'ilike sur le nom)
 * - logWastePreventionAction : colonnes corrigées (action_type→action, quantity_saved→quantity)
 * - calculateWasteStats : colonnes corrigées (action_type→action, quantity_saved→quantity)
 */

import { supabase } from './supabaseClient';
import { daysUntil } from './dates';

// ============ CONSTANTES ============

/**
 * Niveaux d'urgence avec labels, couleurs et scores.
 * Conservés pour compatibilité avec RestesManager.jsx.
 */
const URGENCY_LEVELS = {
  CRITICAL: { label: 'CRITIQUE', color: '#ef4444', score: 100 },
  URGENT:   { label: 'URGENT',   color: '#f97316', score: 85  },
  WARNING:  { label: 'ATTENTION',color: '#f59e0b', score: 65  },
  SOON:     { label: 'BIENTÔT', color: '#eab308', score: 40  },
  NORMAL:   { label: 'NORMAL',   color: '#84cc16', score: 20  },
  FRESH:    { label: 'FRAIS',    color: '#22c55e', score: 0   },
};

/**
 * Seuils de jours par kind d'expiration.
 * DLC (Date Limite de Consommation) : règle stricte.
 * DDM/ESTIMATE : produits moins sensibles — seuils doublés.
 */
const THRESHOLDS = {
  DLC: {
    CRITICAL: 0,   // daysLeft < 0  → CRITIQUE (toujours)
    URGENT:   1,   // daysLeft <= 1
    WARNING:  3,   // daysLeft <= 3
    SOON:     7,   // daysLeft <= 7
    NORMAL:   14,  // daysLeft <= 14
  },
  DDM: {
    CRITICAL: 0,
    URGENT:   3,
    WARNING:  7,
    SOON:     14,
    NORMAL:   30,
  },
};
THRESHOLDS.ESTIMATE = THRESHOLDS.DDM; // alias

/**
 * Actions anti-gaspillage proposées à l'utilisateur.
 * Toutes les actions sont retournées pour tous les lots (filtrage simplifié).
 */
const WASTE_PREVENTION_ACTIONS = [
  {
    id: 'freeze',
    label: 'Congeler',
    icon: '🧊',
    description: 'Prolonger de plusieurs mois',
  },
  {
    id: 'preserve',
    label: 'Conserver',
    icon: '🥫',
    description: 'Faire une conserve/confiture',
  },
  {
    id: 'cook',
    label: 'Cuisiner',
    icon: '👨‍🍳',
    description: 'Utiliser dans une recette',
  },
  {
    id: 'transform',
    label: 'Transformer',
    icon: '🔄',
    description: 'Compote, soupe, etc.',
  },
  {
    id: 'share',
    label: 'Partager',
    icon: '🤝',
    description: 'Donner à un voisin/association',
  },
];

/** Labels pour storage_method (remplace l'ancienne table locations) */
const STORAGE_LABELS = {
  fridge:  'Réfrigérateur',
  freezer: 'Congélateur',
  pantry:  'Garde-manger',
  counter: 'Comptoir',
  cellar:  'Cave',
};

const STORAGE_ICONS = {
  fridge:  '🥶',
  freezer: '🧊',
  pantry:  '🏠',
  counter: '🍽️',
  cellar:  '🍷',
};

// ============ UTILITAIRES ============

/**
 * Détermine le niveau d'urgence selon les jours restants ET le kind d'expiration.
 * @param {number|null} daysLeft
 * @param {'DLC'|'DDM'|'ESTIMATE'} expiryKind
 */
function getUrgencyLevelForKind(daysLeft, expiryKind = 'DLC') {
  if (daysLeft === null) return URGENCY_LEVELS.NORMAL;
  if (daysLeft < 0) return URGENCY_LEVELS.CRITICAL;

  const t = THRESHOLDS[expiryKind] || THRESHOLDS.DLC;
  if (daysLeft <= t.URGENT)  return URGENCY_LEVELS.URGENT;
  if (daysLeft <= t.WARNING) return URGENCY_LEVELS.WARNING;
  if (daysLeft <= t.SOON)    return URGENCY_LEVELS.SOON;
  if (daysLeft <= t.NORMAL)  return URGENCY_LEVELS.NORMAL;
  return URGENCY_LEVELS.FRESH;
}

/**
 * Niveau d'urgence sans distinction DLC/DDM (export, compatibilité).
 * Utilise les seuils DLC par défaut.
 */
function getUrgencyLevel(daysLeft) {
  return getUrgencyLevelForKind(daysLeft, 'DLC');
}

/**
 * Score d'urgence composite (0-100).
 * La base est le score du niveau d'urgence.
 * Bonus si le lot est ouvert (+15) ou si la quantité restante est grande (+5/+10).
 */
function calculateUrgencyScore(baseScore, lot) {
  let score = baseScore;
  if (lot.is_opened || lot.opened_at) score += 15;
  const qty = parseFloat(lot.qty_remaining || 0);
  if (qty > 10) score += 10;
  else if (qty > 5) score += 5;
  return Math.min(100, score);
}

// ============ FONCTIONS PRINCIPALES ============

/**
 * Analyse l'inventaire et identifie les produits à risque de gaspillage.
 *
 * Retourne les champs attendus par RestesManager.jsx :
 *   risk.lotId, risk.productName, risk.isOpened, risk.quantity, risk.unit,
 *   risk.locationIcon, risk.location, risk.urgency.{level, color, score},
 *   risk.daysLeft, risk.recommendation, risk.actions[]
 *
 * @param {string} userId
 * @param {Object} [options]
 * @param {number}  [options.daysThreshold=7]   Fenêtre DLC (DDM utilise 2×)
 * @param {boolean} [options.includeOpened=true] Inclure lots ouverts
 * @param {number}  [options.minUrgencyScore=40] Score minimum pour inclure
 * @param {Object} [client] Client Supabase serveur
 */
export async function analyzeWasteRisks(userId, options = {}, client = supabase) {
  const {
    daysThreshold = 7,
    includeOpened = true,
    minUrgencyScore = 40,
  } = options;

  try {
    // Récupérer les lots avec les relations nécessaires.
    // On interroge la table de base inventory_lots (pas la vue — les FK joins
    // de Supabase JS ne fonctionnent pas sur les vues).
    const { data: lots, error } = await client
      .from('inventory_lots')
      .select(`
        id,
        qty_remaining,
        unit,
        expiration_date,
        adjusted_expiration_date,
        is_opened,
        opened_at,
        storage_place,
        storage_method,
        canonical_food_id,
        archetype_id,
        canonical_foods(canonical_name),
        archetypes(name, expiry_kind, canonical_food_id),
        products(name, archetypes(id, name, expiry_kind, canonical_food_id))
      `)
      .eq('user_id', userId)
      .gt('qty_remaining', 0);

    if (error) throw error;

    const risks = [];
    const stats = {
      totalAtRisk: 0,
      criticalCount: 0,
      urgentCount: 0,
      warningCount: 0,
      totalQuantityAtRisk: 0,
      categoriesAtRisk: {},
    };

    for (const lot of lots || []) {
      // Résoudre la date d'expiration effective
      const effectiveDate = lot.adjusted_expiration_date || lot.expiration_date;
      const daysLeft = daysUntil(effectiveDate);

      // Résoudre le kind d'expiration depuis la hiérarchie
      const expiryKind =
        lot.archetypes?.expiry_kind ||
        lot.products?.archetypes?.expiry_kind ||
        'DLC';

      // Seuil d'inclusion selon le kind
      const effectiveThreshold = expiryKind === 'DLC' ? daysThreshold : daysThreshold * 2;

      // Exclure les lots sans date d'expiration
      if (daysLeft === null) continue;
      // Exclure les lots dont la DLC est encore loin (sauf si ouverts)
      if (daysLeft > effectiveThreshold && !(includeOpened && lot.opened_at)) continue;

      const urgency = getUrgencyLevelForKind(daysLeft, expiryKind);
      const score = calculateUrgencyScore(urgency.score, lot);

      if (score < minUrgencyScore) continue;

      // Résoudre le nom du produit depuis la hiérarchie
      const productName =
        lot.canonical_foods?.canonical_name ||
        lot.archetypes?.name ||
        lot.products?.name ||
        'Produit inconnu';

      // Résoudre les IDs pour le matching recettes (non rendus par l'UI)
      const resolvedCanonicalFoodId =
        lot.canonical_food_id ||
        lot.archetypes?.canonical_food_id ||
        lot.products?.archetypes?.canonical_food_id ||
        null;
      const resolvedArchetypeId =
        lot.archetype_id ||
        lot.products?.archetypes?.id ||
        null;

      // Localisation : storage_place (libre) sinon label du storage_method
      const location =
        lot.storage_place ||
        STORAGE_LABELS[lot.storage_method] ||
        'Non spécifié';
      const locationIcon = STORAGE_ICONS[lot.storage_method] || '📦';

      const risk = {
        lotId: lot.id,
        productName,
        quantity: lot.qty_remaining || 0,
        unit: lot.unit || 'u',
        daysLeft,
        expirationDate: effectiveDate,
        expiryKind,
        isOpened: !!(lot.is_opened || lot.opened_at),
        openedAt: lot.opened_at,
        location,
        locationIcon,
        urgency: {
          level: urgency.label,
          color: urgency.color,
          score,
        },
        actions: WASTE_PREVENTION_ACTIONS.map(a => ({
          id: a.id,
          label: a.label,
          icon: a.icon,
          description: a.description,
        })),
        recommendation: getRecommendation(urgency, lot),
        // Champs internes utilisés par suggestRecipesForWaste — non rendus par l'UI
        _canonicalFoodId: resolvedCanonicalFoodId,
        _archetypeId: resolvedArchetypeId,
      };

      risks.push(risk);

      stats.totalAtRisk++;
      if (urgency.label === 'CRITIQUE')   stats.criticalCount++;
      else if (urgency.label === 'URGENT') stats.urgentCount++;
      else if (urgency.label === 'ATTENTION') stats.warningCount++;

      stats.totalQuantityAtRisk += parseFloat(risk.quantity || 0);
    }

    // Trier par score décroissant
    risks.sort((a, b) => b.urgency.score - a.urgency.score);

    return {
      risks,
      stats,
      summary: {
        total: stats.totalAtRisk,
        critical: stats.criticalCount,
        urgent: stats.urgentCount,
        warning: stats.warningCount,
        message: getWasteSummaryMessage(stats),
      },
    };

  } catch (error) {
    console.error('[WastePrevention] Erreur analyse:', error);
    throw error;
  }
}

/**
 * Suggère des recettes utilisant les produits à risque.
 * Matching via IDs FK dans recipe_ingredients (canonical_food_id / archetype_id),
 * pas via ilike sur les noms.
 *
 * Retourne les champs attendus par RestesManager.jsx :
 *   suggestion.recipeId, recipeName, description, prepTime, cookTime, servings,
 *   matchCount, urgencyScore, matchingProducts[], wasteReduction.{estimatedValue, co2}
 */
export async function suggestRecipesForWaste(userId, riskAnalysis, client = supabase) {
  try {
    if (!riskAnalysis?.risks?.length) {
      return { suggestions: [], message: 'Aucun produit à risque' };
    }

    // Collecter les IDs canoniques et archétypes des lots à risque
    const canonicalFoodIds = new Set();
    const archetypeIds = new Set();
    // Map id → productName pour reconstruire matchingProducts
    const idToName = new Map();

    for (const risk of riskAnalysis.risks) {
      if (risk._canonicalFoodId) {
        canonicalFoodIds.add(risk._canonicalFoodId);
        idToName.set(`cf:${risk._canonicalFoodId}`, risk.productName);
      }
      if (risk._archetypeId) {
        archetypeIds.add(risk._archetypeId);
        idToName.set(`a:${risk._archetypeId}`, risk.productName);
      }
    }

    if (canonicalFoodIds.size === 0 && archetypeIds.size === 0) {
      return { suggestions: [], message: 'Aucune correspondance possible dans les recettes' };
    }

    // Construire le filtre .or() pour Supabase
    const filterParts = [];
    if (canonicalFoodIds.size > 0) {
      filterParts.push(`canonical_food_id.in.(${[...canonicalFoodIds].join(',')})`);
    }
    if (archetypeIds.size > 0) {
      filterParts.push(`archetype_id.in.(${[...archetypeIds].join(',')})`);
    }

    // Trouver les ingrédients de recettes qui correspondent
    const { data: matchingIngredients, error: ingError } = await client
      .from('recipe_ingredients')
      .select('recipe_id, archetype_id, canonical_food_id')
      .or(filterParts.join(','));

    if (ingError) throw ingError;
    if (!matchingIngredients?.length) {
      return { suggestions: [], message: 'Aucune recette trouvée avec ces ingrédients' };
    }

    // Regrouper par recipe_id → set de product names
    const recipeIdToNames = new Map();
    for (const ing of matchingIngredients) {
      const name =
        idToName.get(`a:${ing.archetype_id}`) ||
        idToName.get(`cf:${ing.canonical_food_id}`);
      if (!name) continue;
      if (!recipeIdToNames.has(ing.recipe_id)) {
        recipeIdToNames.set(ing.recipe_id, new Set());
      }
      recipeIdToNames.get(ing.recipe_id).add(name);
    }

    if (recipeIdToNames.size === 0) {
      return { suggestions: [], message: 'Aucune recette trouvée avec ces ingrédients' };
    }

    // Récupérer les détails des recettes
    const recipeIds = [...recipeIdToNames.keys()];
    const { data: recipes, error: recipeError } = await client
      .from('recipes')
      .select('id, name, description, prep_time_minutes, cook_time_minutes, servings')
      .in('id', recipeIds)
      .limit(20);

    if (recipeError) throw recipeError;

    const suggestions = (recipes || []).map(recipe => {
      const matchingProductNames = [...(recipeIdToNames.get(recipe.id) || [])];
      const wasteReduction = calculateWasteReduction(matchingProductNames, riskAnalysis);
      const urgencyScore =
        matchingProductNames.reduce((sum, name) => {
          const risk = riskAnalysis.risks.find(r => r.productName === name);
          return sum + (risk?.urgency?.score || 0);
        }, 0) / Math.max(matchingProductNames.length, 1);

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        description: recipe.description,
        prepTime: recipe.prep_time_minutes,
        cookTime: recipe.cook_time_minutes,
        servings: recipe.servings,
        matchCount: matchingProductNames.length,
        urgencyScore,
        matchingProducts: matchingProductNames,
        wasteReduction,
      };
    });

    // Trier : plus de correspondances d'abord, puis urgence
    suggestions.sort((a, b) =>
      b.matchCount !== a.matchCount
        ? b.matchCount - a.matchCount
        : b.urgencyScore - a.urgencyScore
    );

    return {
      suggestions: suggestions.slice(0, 10),
      message: suggestions.length > 0
        ? `${suggestions.length} recette(s) trouvée(s) pour sauver vos produits`
        : 'Aucune recette trouvée avec ces ingrédients',
    };

  } catch (error) {
    console.error('[WastePrevention] Erreur suggestions recettes:', error);
    throw error;
  }
}

/**
 * Enregistre une action anti-gaspillage dans waste_prevention_log.
 *
 * Colonnes corrigées : action_type → action, quantity_saved → quantity.
 * La colonne notes n'existe pas dans le schéma — ignorée silencieusement.
 * Fail-soft : si la table n'est pas encore appliquée, retourne logged: false.
 *
 * @param {string} userId
 * @param {{ lotId, actionType, quantitySaved, notes }} action
 * @param {Object} [client]
 */
export async function logWastePreventionAction(userId, action, client = supabase) {
  const { lotId, actionType, quantitySaved } = action;

  try {
    const { data, error } = await client
      .from('waste_prevention_log')
      .insert({
        user_id: userId,
        lot_id: lotId || null,
        action: actionType,            // colonne réelle : action (pas action_type)
        quantity: quantitySaved || 0,  // colonne réelle : quantity (pas quantity_saved)
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Fail-soft : la table peut ne pas encore être déployée
      console.warn('[WastePrevention] logWastePreventionAction ignoré:', error.message);
      return { success: true, logged: false };
    }

    return { success: true, logged: true, data };

  } catch (error) {
    console.error('[WastePrevention] Erreur log action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcule les statistiques de gaspillage évité sur une période.
 *
 * Colonnes corrigées : action_type → action, quantity_saved → quantity.
 * Retourne les champs attendus par RestesManager.jsx :
 *   stats.quantitySaved, stats.estimatedMoneySaved, stats.co2Saved
 */
export async function calculateWasteStats(userId, period = 'month', client = supabase) {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7
        ));
        break;
      case 'year':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        break;
      case 'month':
      default:
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    const { data: actions, error } = await client
      .from('waste_prevention_log')
      .select('action, quantity, estimated_value_eur, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      // Fail-soft : table peut ne pas encore être déployée
      console.warn('[WastePrevention] calculateWasteStats ignoré:', error.message);
      return buildEmptyStats(period);
    }

    const totalActionsTaken = actions?.length || 0;
    const quantitySaved = actions?.reduce(
      (sum, a) => sum + (parseFloat(a.quantity) || 0), 0
    ) || 0;

    // Répartition par type d'action (colonne réelle : action)
    const actionBreakdown = {};
    for (const a of actions || []) {
      const type = a.action || 'unknown';
      actionBreakdown[type] = (actionBreakdown[type] || 0) + 1;
    }

    // Estimation argent économisé (5€/kg de nourriture en moyenne)
    const estimatedMoneySaved = Math.round(quantitySaved * 5);
    // Estimation CO2 évité (2.5 kg CO2 / kg nourriture)
    const co2Saved = Math.round(quantitySaved * 2.5 * 10) / 10;

    return {
      period,
      totalActionsTaken,
      quantitySaved,
      actionBreakdown,
      estimatedMoneySaved,
      co2Saved,
    };

  } catch (error) {
    console.error('[WastePrevention] Erreur calcul stats:', error);
    return buildEmptyStats(period);
  }
}

// ============ FONCTIONS UTILITAIRES ============

function buildEmptyStats(period) {
  return {
    period,
    totalActionsTaken: 0,
    quantitySaved: 0,
    actionBreakdown: {},
    estimatedMoneySaved: 0,
    co2Saved: 0,
  };
}

function getRecommendation(urgency, lot) {
  if (urgency.label === 'CRITIQUE') {
    return lot.expiryKind === 'DDM'
      ? 'Vérifier l\'état : produit DDM dépassé, souvent encore consommable — décider.'
      : 'URGENT : Vérifier l\'état et décider immédiatement (cuisiner, congeler ou jeter si périmé).';
  }
  if (urgency.label === 'URGENT')    return 'À consommer ou congeler aujourd\'hui.';
  if (urgency.label === 'ATTENTION') return 'Planifier l\'utilisation dans les 3 prochains jours.';
  if (urgency.label === 'BIENTÔT')  return 'À prévoir dans la semaine.';
  if (lot.opened_at || lot.is_opened) return 'Lot ouvert : à surveiller.';
  return 'Rien à signaler.';
}

function getWasteSummaryMessage(stats) {
  if (stats.criticalCount > 0) {
    return `${stats.criticalCount} produit(s) nécessitent une action immédiate !`;
  }
  if (stats.urgentCount > 0) {
    return `${stats.urgentCount} produit(s) à consommer ou congeler rapidement.`;
  }
  if (stats.warningCount > 0) {
    return `${stats.warningCount} produit(s) à surveiller cette semaine.`;
  }
  return 'Pas de produits urgents à gérer.';
}

function calculateWasteReduction(matchingProductNames, riskAnalysis) {
  let totalSaved = 0;
  for (const name of matchingProductNames) {
    const risk = riskAnalysis.risks.find(r => r.productName === name);
    if (risk) totalSaved += parseFloat(risk.quantity || 0);
  }
  return {
    quantity: Math.round(totalSaved * 10) / 10,
    estimatedValue: Math.round(totalSaved * 5),   // 5€/kg
    co2: Math.round(totalSaved * 2.5 * 10) / 10, // 2.5 kg CO2/kg
  };
}

// ============ EXPORTS nommés (compatibilité) ============

export {
  URGENCY_LEVELS,
  WASTE_PREVENTION_ACTIONS,
  getUrgencyLevel,
  getUrgencyLevelForKind,
  calculateUrgencyScore,
};
