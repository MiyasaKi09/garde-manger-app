/**
 * Service de gestion des lots d'inventaire
 * Gère l'ouverture/fermeture des produits et le calcul des DLC ajustées
 * @module lotManagementService
 */

import { supabase } from './supabaseClient';
import { calculateAdjustedExpiration, inferCategory, getShelfLifeMessage } from './shelfLifeRules';

/**
 * Marque un lot comme ouvert et ajuste sa DLC
 * @param {string} lotId - ID du lot à ouvrir
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [client] - Client Supabase (serveur) ; fallback navigateur si omis
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function openLot(lotId, userId, client = supabase) {
  try {
    // 1. Récupérer le lot avec toutes ses informations
    const { data: lot, error: fetchError } = await client
      .from('inventory_lots')
      .select(`
        *,
        canonical_foods(canonical_name, category),
        archetypes(name, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer, open_shelf_life_days_pantry, open_shelf_life_days_fridge, open_shelf_life_days_freezer),
        products_catalog(product_name, category_name)
      `)
      .eq('id', lotId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!lot) throw new Error('Lot non trouvé');

    // Vérifier si déjà ouvert
    if (lot.is_opened) {
      return {
        success: false,
        error: 'Ce produit est déjà marqué comme ouvert'
      };
    }

    // 2. Déterminer le nom et la catégorie du produit
    const productName = lot.canonical_foods?.canonical_name
      || lot.archetypes?.name
      || lot.products_catalog?.product_name
      || lot.product_name
      || 'Produit';

    const canonicalCategory = lot.canonical_foods?.category
      || lot.products_catalog?.category_name;

    const category = inferCategory(productName, canonicalCategory);

    // 3. Calculer la nouvelle DLC
    const now = new Date();
    const storageMethod = lot.storage_method || 'fridge';
    const originalDLC = lot.expiration_date ? new Date(lot.expiration_date) : null;
    
    const adjustedExpiration = calculateAdjustedExpiration(
      category,
      storageMethod,
      now,
      originalDLC
    );

    // Si null (produit ne se conserve pas après ouverture avec cette méthode)
    if (adjustedExpiration === null) {
      return {
        success: false,
        error: `⚠️ Ce produit ne se conserve pas bien ${
          storageMethod === 'freezer' ? 'congelé' : 
          storageMethod === 'pantry' ? 'au garde-manger' : 
          'au frigo'
        } une fois ouvert. Consommez-le rapidement ou changez de méthode de stockage.`
      };
    }

    // 4. Mise à jour en base de données
    const { data: updated, error: updateError } = await client
      .from('inventory_lots')
      .update({
        is_opened: true,
        opened_at: now.toISOString(),
        adjusted_expiration_date: adjustedExpiration.toISOString().split('T')[0]
      })
      .eq('id', lotId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Calculer jours restants et message
    const daysUntilExpiration = Math.ceil((adjustedExpiration - now) / (1000 * 60 * 60 * 24));
    const message = getShelfLifeMessage(category, storageMethod, daysUntilExpiration);

    return {
      success: true,
      lot: updated,
      productName,
      category,
      originalDLC: originalDLC ? originalDLC.toLocaleDateString('fr-FR') : null,
      adjustedDLC: adjustedExpiration.toLocaleDateString('fr-FR'),
      daysUntilExpiration,
      storageMethod,
      message: `📦 ${productName} ouvert !\n${message}\nNouvelle DLC : ${adjustedExpiration.toLocaleDateString('fr-FR')}`,
      messageShort: `Ouvert ! ${daysUntilExpiration}j restants`
    };

  } catch (error) {
    console.error('Erreur openLot:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ferme un lot (reconditionnement, par exemple)
 * Restaure la DLC originale
 * @param {string} lotId - ID du lot à fermer
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [client] - Client Supabase (serveur) ; fallback navigateur si omis
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function closeLot(lotId, userId, client = supabase) {
  try {
    const { data, error } = await client
      .from('inventory_lots')
      .update({
        is_opened: false,
        opened_at: null,
        adjusted_expiration_date: null
      })
      .eq('id', lotId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      lot: data,
      message: '✅ Produit refermé, DLC originale restaurée'
    };

  } catch (error) {
    console.error('Erreur closeLot:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Change le mode de stockage d'un lot et recalcule la DLC si ouvert
 * @param {string} lotId - ID du lot
 * @param {string} userId - ID de l'utilisateur
 * @param {string} newStorageMethod - Nouvelle méthode ('fridge', 'freezer', 'pantry')
 * @param {Object} [client] - Client Supabase (serveur) ; fallback navigateur si omis
 * @returns {Promise<Object>} Résultat de l'opération
 */
export async function changeStorageMethod(lotId, userId, newStorageMethod, client = supabase) {
  try {
    // 1. Récupérer le lot
    const { data: lot, error: fetchError } = await client
      .from('inventory_lots')
      .select(`
        *,
        canonical_foods(canonical_name, category),
        archetypes(name, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer, open_shelf_life_days_pantry, open_shelf_life_days_fridge, open_shelf_life_days_freezer),
        products_catalog(product_name, category_name)
      `)
      .eq('id', lotId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!lot) throw new Error('Lot non trouvé');

    const updates = {
      storage_method: newStorageMethod
    };

    // 2. Si le lot est ouvert, recalculer la DLC
    if (lot.is_opened) {
      const productName = lot.canonical_foods?.canonical_name
        || lot.archetypes?.name
        || lot.products_catalog?.product_name
        || lot.product_name
        || 'Produit';

      const canonicalCategory = lot.canonical_foods?.category
        || lot.products_catalog?.category_name;

      const category = inferCategory(productName, canonicalCategory);
      const openedAt = lot.opened_at ? new Date(lot.opened_at) : new Date();
      const originalDLC = lot.expiration_date ? new Date(lot.expiration_date) : null;

      const newAdjustedExpiration = calculateAdjustedExpiration(
        category,
        newStorageMethod,
        openedAt,
        originalDLC
      );

      if (newAdjustedExpiration === null) {
        return {
          success: false,
          error: `⚠️ Ce produit ne se conserve pas bien avec la méthode "${newStorageMethod}" une fois ouvert.`
        };
      }

      updates.adjusted_expiration_date = newAdjustedExpiration.toISOString().split('T')[0];
    }

    // 3. Mise à jour
    const { data: updated, error: updateError } = await client
      .from('inventory_lots')
      .update(updates)
      .eq('id', lotId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    const storageLabel = {
      fridge: 'réfrigérateur',
      freezer: 'congélateur',
      pantry: 'garde-manger'
    }[newStorageMethod] || newStorageMethod;

    return {
      success: true,
      lot: updated,
      message: lot.is_opened 
        ? `✅ Déplacé au ${storageLabel} et DLC recalculée`
        : `✅ Déplacé au ${storageLabel}`
    };

  } catch (error) {
    console.error('Erreur changeStorageMethod:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupère la DLC effective d'un lot (ajustée si ouvert, originale sinon)
 * @param {Object} lot - Objet lot
 * @returns {Date|null} DLC effective
 */
export function getEffectiveExpiration(lot) {
  if (lot.adjusted_expiration_date) {
    return new Date(lot.adjusted_expiration_date);
  }
  if (lot.expiration_date) {
    return new Date(lot.expiration_date);
  }
  return null;
}

/**
 * Calcule les jours restants avant expiration (basé sur DLC effective)
 * @param {Object} lot - Objet lot
 * @returns {number|null} Jours restants
 */
export function getDaysUntilExpiration(lot) {
  const effectiveDLC = getEffectiveExpiration(lot);
  if (!effectiveDLC) return null;

  const now = new Date();
  const diffTime = effectiveDLC - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default {
  openLot,
  closeLot,
  changeStorageMethod,
  getEffectiveExpiration,
  getDaysUntilExpiration
};
