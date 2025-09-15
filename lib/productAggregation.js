// app/lib/productAggregation.js
// Système d'agrégation intelligente des produits

import { supabase } from '@/lib/supabaseClient';

/**
 * Système d'agrégation des produits par famille
 * Gère la hiérarchie canonique > cultivar > dérivé
 */

// ============ TYPES D'AGRÉGATION ============

export const AGGREGATION_MODES = {
  // Mode strict : chaque produit est séparé
  STRICT: 'strict',
  
  // Mode famille : agrège par aliment canonique parent
  FAMILY: 'family',
  
  // Mode intelligent : agrège selon le contexte (recettes vs inventaire)
  SMART: 'smart'
};

// ============ FONCTIONS D'AGRÉGATION ============

/**
 * Récupère tous les lots avec leurs relations hiérarchiques
 */
export async function getLotsWithHierarchy(userId = null) {
  const { data: lots, error } = await supabase
    .from('v_inventory_display')
    .select(`
      *,
      canonical_food:canonical_foods(id, canonical_name, category_id),
      cultivar:cultivars(id, cultivar_name, canonical_food_id),
      generic_product:generic_products(id, name, category_id),
      derived_product:derived_products(id, derived_name, cultivar_id)
    `)
    .gt('qty_remaining', 0);

  if (error) throw error;

  return lots.map(lot => ({
    ...lot,
    // Détermination de l'ID canonique parent
    canonical_parent_id: getCanonicalParentId(lot),
    // Nom d'affichage selon le contexte
    display_name: getDisplayName(lot),
    // Niveau de spécificité (0 = canonique, 1 = cultivar, 2 = générique, 3 = dérivé)
    specificity_level: getSpecificityLevel(lot)
  }));
}

/**
 * Détermine l'ID de l'aliment canonique parent
 */
function getCanonicalParentId(lot) {
  if (lot.canonical_food_id) return lot.canonical_food_id;
  if (lot.cultivar_id && lot.cultivar?.canonical_food_id) return lot.cultivar.canonical_food_id;
  if (lot.derived_product_id && lot.derived_product?.cultivar?.canonical_food_id) {
    return lot.derived_product.cultivar.canonical_food_id;
  }
  return null; // Produit générique sans parent canonique
}

/**
 * Génère le nom d'affichage selon le contexte
 */
function getDisplayName(lot, context = 'inventory') {
  if (context === 'recipe_substitution') {
    // Pour les substitutions de recettes, on privilégie le nom canonique
    if (lot.canonical_parent_id) {
      return lot.canonical_food?.canonical_name || 'Aliment canonique';
    }
  }
  
  // Pour l'inventaire, on garde la spécificité
  if (lot.canonical_food_id) return lot.canonical_food.canonical_name;
  if (lot.cultivar_id) return `${lot.cultivar.cultivar_name}`;
  if (lot.generic_product_id) return lot.generic_product.name;
  if (lot.derived_product_id) return lot.derived_product.derived_name;
  
  return 'Produit inconnu';
}

/**
 * Détermine le niveau de spécificité
 */
function getSpecificityLevel(lot) {
  if (lot.canonical_food_id) return 0;
  if (lot.cultivar_id) return 1;
  if (lot.generic_product_id) return 2;
  if (lot.derived_product_id) return 3;
  return 4;
}

// ============ MOTEUR D'AGRÉGATION ============

/**
 * Agrège les lots selon le mode spécifié
 */
export function aggregateProducts(lots, mode = AGGREGATION_MODES.SMART, context = 'inventory') {
  switch (mode) {
    case AGGREGATION_MODES.STRICT:
      return aggregateStrict(lots);
    
    case AGGREGATION_MODES.FAMILY:
      return aggregateByFamily(lots);
    
    case AGGREGATION_MODES.SMART:
      return aggregateSmart(lots, context);
    
    default:
      return aggregateStrict(lots);
  }
}

/**
 * Mode strict : pas d'agrégation
 */
function aggregateStrict(lots) {
  const groups = new Map();
  
  lots.forEach(lot => {
    const key = `${lot.type}_${lot.canonical_food_id || lot.cultivar_id || lot.generic_product_id || lot.derived_product_id}`;
    
    if (!groups.has(key)) {
      groups.set(key, {
        groupKey: key,
        productId: lot.canonical_food_id || lot.cultivar_id || lot.generic_product_id || lot.derived_product_id,
        productName: lot.display_name,
        productType: lot.type,
        canonicalParentId: lot.canonical_parent_id,
        category: lot.category_name,
        lots: [],
        totalQuantity: 0,
        primaryUnit: lot.unit,
        aggregationInfo: {
          mode: 'strict',
          isAggregated: false,
          childProducts: []
        }
      });
    }
    
    const group = groups.get(key);
    group.lots.push(lot);
    group.totalQuantity += lot.qty_remaining || 0;
  });
  
  return Array.from(groups.values());
}

/**
 * Mode famille : agrégation par aliment canonique
 */
function aggregateByFamily(lots) {
  const groups = new Map();
  
  lots.forEach(lot => {
    const canonicalId = lot.canonical_parent_id || lot.canonical_food_id || lot.generic_product_id;
    const key = `family_${canonicalId}`;
    
    if (!groups.has(key)) {
      const canonicalName = lot.canonical_food?.canonical_name || 
                           lot.cultivar?.canonical_food?.canonical_name ||
                           lot.generic_product?.name ||
                           'Famille inconnue';
      
      groups.set(key, {
        groupKey: key,
        productId: canonicalId,
        productName: canonicalName,
        productType: 'family',
        canonicalParentId: canonicalId,
        category: lot.category_name,
        lots: [],
        totalQuantity: 0,
        primaryUnit: lot.unit,
        aggregationInfo: {
          mode: 'family',
          isAggregated: true,
          childProducts: new Set()
        }
      });
    }
    
    const group = groups.get(key);
    group.lots.push(lot);
    group.totalQuantity += lot.qty_remaining || 0;
    group.aggregationInfo.childProducts.add({
      id: lot.canonical_food_id || lot.cultivar_id || lot.generic_product_id || lot.derived_product_id,
      name: lot.display_name,
      type: lot.type,
      quantity: lot.qty_remaining
    });
  });
  
  // Conversion des Sets en Arrays
  groups.forEach(group => {
    group.aggregationInfo.childProducts = Array.from(group.aggregationInfo.childProducts);
  });
  
  return Array.from(groups.values());
}

/**
 * Mode intelligent : agrégation contextuelle
 */
function aggregateSmart(lots, context) {
  switch (context) {
    case 'recipe_matching':
    case 'recipe_substitution':
      // Pour les recettes, on agrège par famille pour permettre les substitutions
      return aggregateByFamily(lots).map(group => ({
        ...group,
        aggregationInfo: {
          ...group.aggregationInfo,
          mode: 'smart_recipe',
          allowSubstitution: true,
          substitutionNote: group.aggregationInfo.childProducts.length > 1 ? 
            `Inclut ${group.aggregationInfo.childProducts.length} variétés` : null
        }
      }));
    
    case 'shopping_list':
      // Pour les courses, on garde la spécificité mais on indique les alternatives
      return aggregateStrict(lots).map(group => {
        const relatedProducts = lots.filter(lot => 
          lot.canonical_parent_id === group.canonicalParentId && 
          lot.canonical_food_id !== group.productId &&
          lot.cultivar_id !== group.productId
        );
        
        return {
          ...group,
          aggregationInfo: {
            ...group.aggregationInfo,
            mode: 'smart_shopping',
            relatedProducts: relatedProducts.map(lot => ({
              id: lot.canonical_food_id || lot.cultivar_id,
              name: lot.display_name,
              quantity: lot.qty_remaining
            }))
          }
        };
      });
    
    case 'inventory':
    default:
      // Pour l'inventaire, on affiche les deux modes avec toggle
      return aggregateStrict(lots);
  }
}

// ============ GESTION DES RECETTES ============

/**
 * Recherche de produits compatibles pour une recette
 */
export async function findCompatibleProducts(recipeIngredient, availableLots) {
  const { product_id, product_name, qty, unit } = recipeIngredient;
  
  // Recherche directe
  const directMatches = availableLots.filter(lot => 
    lot.canonical_food_id === product_id ||
    lot.cultivar_id === product_id ||
    lot.generic_product_id === product_id
  );
  
  if (directMatches.length > 0) {
    return {
      type: 'direct',
      matches: directMatches,
      substitutions: []
    };
  }
  
  // Recherche par famille canonique
  const targetCanonicalId = await getCanonicalIdForProduct(product_id);
  
  if (targetCanonicalId) {
    const familyMatches = availableLots.filter(lot => 
      lot.canonical_parent_id === targetCanonicalId
    );
    
    return {
      type: 'substitution',
      matches: [],
      substitutions: familyMatches.map(lot => ({
        ...lot,
        substitutionNote: `${lot.display_name} peut remplacer ${product_name}`,
        compatibilityScore: calculateCompatibilityScore(recipeIngredient, lot)
      }))
    };
  }
  
  return {
    type: 'none',
    matches: [],
    substitutions: []
  };
}

/**
 * Calcule un score de compatibilité pour les substitutions
 */
function calculateCompatibilityScore(ingredient, lot) {
  let score = 100;
  
  // Pénalité selon le niveau de spécificité
  if (lot.specificity_level > 1) score -= 10;
  
  // Bonus si même catégorie
  if (lot.category_name === ingredient.category) score += 20;
  
  // Pénalité si unités incompatibles
  if (lot.unit !== ingredient.unit) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Récupère l'ID canonique d'un produit
 */
async function getCanonicalIdForProduct(productId) {
  // D'abord vérifier si c'est déjà un produit canonique
  const { data: canonical } = await supabase
    .from('canonical_foods')
    .select('id')
    .eq('id', productId)
    .single();
  
  if (canonical) return productId;
  
  // Vérifier si c'est un cultivar
  const { data: cultivar } = await supabase
    .from('cultivars')
    .select('canonical_food_id')
    .eq('id', productId)
    .single();
  
  if (cultivar) return cultivar.canonical_food_id;
  
  // Vérifier si c'est un produit dérivé
  const { data: derived } = await supabase
    .from('derived_products')
    .select('cultivar:cultivars(canonical_food_id)')
    .eq('id', productId)
    .single();
  
  if (derived?.cultivar?.canonical_food_id) return derived.cultivar.canonical_food_id;
  
  return null;
}

// ============ INTERFACE UTILISATEUR ============

/**
 * Composant de sélection du mode d'agrégation
 */
export function AggregationModeSelector({ mode, onModeChange, context }) {
  const modes = [
    {
      value: AGGREGATION_MODES.STRICT,
      label: 'Vue détaillée',
      description: 'Chaque produit séparément',
      icon: '🔍'
    },
    {
      value: AGGREGATION_MODES.FAMILY,
      label: 'Vue famille',
      description: 'Regrouper par type',
      icon: '👨‍👩‍👧‍👦'
    },
    {
      value: AGGREGATION_MODES.SMART,
      label: 'Vue intelligente',
      description: 'Adaptation automatique',
      icon: '🧠'
    }
  ];
  
  return (
    <div className="aggregation-selector">
      <label>Mode d'affichage :</label>
      <div className="mode-buttons">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={`mode-btn ${mode === m.value ? 'active' : ''}`}
            title={m.description}
          >
            <span className="mode-icon">{m.icon}</span>
            <span className="mode-label">{m.label}</span>
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .aggregation-selector {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .mode-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        
        .mode-btn:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }
        
        .mode-btn.active {
          border-color: #059669;
          background: #ecfdf5;
          color: #059669;
        }
        
        .mode-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}

/**
 * Composant d'affichage des informations d'agrégation
 */
export function AggregationInfo({ group }) {
  if (!group.aggregationInfo.isAggregated) return null;
  
  return (
    <div className="aggregation-info">
      <div className="aggregation-badge">
        Groupe de {group.aggregationInfo.childProducts.length} produits
      </div>
      
      <details className="aggregation-details">
        <summary>Voir le détail</summary>
        <ul className="child-products">
          {group.aggregationInfo.childProducts.map(child => (
            <li key={child.id} className="child-product">
              <span className="child-name">{child.name}</span>
              <span className="child-qty">{child.quantity} {child.unit}</span>
            </li>
          ))}
        </ul>
      </details>
      
      <style jsx>{`
        .aggregation-info {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          padding: 8px;
          margin-top: 8px;
          font-size: 12px;
        }
        
        .aggregation-badge {
          color: #0369a1;
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .aggregation-details summary {
          cursor: pointer;
          color: #0369a1;
        }
        
        .child-products {
          margin: 4px 0 0 16px;
          padding: 0;
        }
        
        .child-product {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        
        .child-name {
          color: #374151;
        }
        
        .child-qty {
          color: #6b7280;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

// ============ EXPORT ============

export default {
  AGGREGATION_MODES,
  getLotsWithHierarchy,
  aggregateProducts,
  findCompatibleProducts,
  AggregationModeSelector,
  AggregationInfo
};
