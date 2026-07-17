// Service de gestion des plats cuisinés
// Permet de créer, consommer, congeler et gérer les plats préparés

import { supabase } from './supabaseClient';
import { authFetch } from './authFetch';
import { calculateCookedDishExpiration } from './shelfLifeRules';

// Détection navigateur : en browser → mutations via API routes ;
// côté serveur (API routes) → Supabase direct pour éviter la circularité.
const isBrowser = typeof window !== 'undefined'

/**
 * Créer un nouveau plat cuisiné
 *
 * @param {Object} params - Paramètres du plat
 * @param {string} params.userId - ID de l'utilisateur
 * @param {string} params.name - Nom du plat
 * @param {number|null} params.recipeId - ID de la recette (optionnel)
 * @param {number} params.portionsCooked - Nombre de portions cuisinées
 * @param {string} params.storageMethod - Mode de stockage (fridge, freezer, counter)
 * @param {Array<Object>} params.ingredientsUsed - Ingrédients utilisés [{lotId, quantityUsed, unit, productName}]
 * @param {string|null} params.notes - Notes optionnelles
 * @returns {Promise<{success: boolean, dish: Object, message: string}>}
 */
export async function createCookedDish({
  userId,
  name,
  recipeId = null,
  portionsCooked,
  storageMethod = 'fridge',
  ingredientsUsed = [],
  notes = null,
  supabaseClient = null,
}) {
  // Chemin navigateur : délégation à l'API route
  if (isBrowser) {
    try {
      const res = await authFetch('/api/cooked-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, recipeId, portionsCooked, storageMethod, ingredientsUsed, notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la création du plat' }
      }
      return {
        success: true,
        dish: data.dish,
        message: data.message,
        daysUntilExpiration: data.daysUntilExpiration,
      }
    } catch (err) {
      return { success: false, error: err.message || 'Erreur lors de la création du plat' }
    }
  }

  // Chemin serveur (appelé par l'API route elle-même) : Supabase direct
  const db = supabaseClient || supabase
  try {
    // Validation
    if (!userId) {
      throw new Error('User ID requis');
    }
    if (!name || name.trim() === '') {
      throw new Error('Nom du plat requis');
    }
    if (!portionsCooked || portionsCooked <= 0) {
      throw new Error('Nombre de portions invalide');
    }
    if (!['fridge', 'freezer', 'counter'].includes(storageMethod)) {
      throw new Error('Mode de stockage invalide');
    }

    // Récupérer les dates d'expiration des lots utilisés pour appliquer la règle
    // DLC plat = min(règle stockage, DLC lot le plus court)
    let usedLotRows = [];
    const validLotIds = (ingredientsUsed || [])
      .filter(i => i.lotId && i.quantityUsed > 0)
      .map(i => i.lotId);
    if (validLotIds.length > 0) {
      const { data: fetchedLots } = await db
        .from('inventory_lots')
        .select('id, adjusted_expiration_date, expiration_date, best_before')
        .in('id', validLotIds)
        .eq('user_id', userId);
      usedLotRows = fetchedLots || [];
    }

    // Calculer la DLC du plat cuisiné (inclut la contrainte DLC des lots)
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod, usedLotRows);

    // 1. Créer le plat cuisiné
    const { data: dish, error: dishError } = await db
      .from('cooked_dishes')
      .insert({
        user_id: userId,
        name: name.trim(),
        recipe_id: recipeId,
        portions_cooked: portionsCooked,
        portions_remaining: portionsCooked,
        storage_method: storageMethod,
        cooked_at: cookedAt.toISOString(),
        expiration_date: expirationDate.toISOString().split('T')[0],
        notes: notes
      })
      .select()
      .single();

    if (dishError) {
      throw dishError;
    }

    // 2. Enregistrer les ingrédients utilisés et déduire de l'inventaire
    if (ingredientsUsed && ingredientsUsed.length > 0) {
      const ingredientRecords = [];
      const inventoryUpdates = [];

      for (const ingredient of ingredientsUsed) {
        const { lotId, quantityUsed, unit, productName } = ingredient;

        if (!lotId || !quantityUsed || quantityUsed <= 0) {
          continue;
        }

        ingredientRecords.push({
          dish_id: dish.id,
          lot_id: lotId,
          quantity_used: quantityUsed,
          unit: unit || 'u',
          product_name: productName || null
        });

        const { data: lot, error: lotError } = await db
          .from('inventory_lots')
          .select('qty_remaining, unit')
          .eq('id', lotId)
          .eq('user_id', userId)
          .single();

        if (!lotError && lot) {
          const newQuantity = Math.max(0, lot.qty_remaining - quantityUsed);
          inventoryUpdates.push({ lotId, newQuantity });
        }
      }

      if (ingredientRecords.length > 0) {
        await db
          .from('cooked_dish_ingredients')
          .insert(ingredientRecords);
      }

      for (const update of inventoryUpdates) {
        await db
          .from('inventory_lots')
          .update({ qty_remaining: update.newQuantity })
          .eq('id', update.lotId)
          .eq('user_id', userId);
      }
    }

    const daysUntilExpiration = Math.ceil(
      (expirationDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    return {
      success: true,
      dish,
      message: `Plat "${name}" créé avec ${portionsCooked} portions. Expire dans ${daysUntilExpiration} jours.`,
      daysUntilExpiration
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du plat'
    };
  }
}

/**
 * Consommer des portions d'un plat cuisiné
 *
 * @param {number} dishId - ID du plat
 * @param {string} userId - ID de l'utilisateur
 * @param {number} portionsToConsume - Nombre de portions à consommer
 * @returns {Promise<{success: boolean, dish: Object, message: string}>}
 */
export async function consumePortions(dishId, userId, portionsToConsume = 1, supabaseClient = null) {
  // Chemin navigateur
  if (isBrowser) {
    try {
      const res = await authFetch(`/api/cooked-dishes/${dishId}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portions: portionsToConsume }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la consommation' }
      }
      return {
        success: true,
        dish: data.dish,
        message: data.message,
        fullyConsumed: data.fullyConsumed,
      }
    } catch (err) {
      return { success: false, error: err.message || 'Erreur lors de la consommation' }
    }
  }

  const db = supabaseClient || supabase

  // Chemin serveur
  try {
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }
    if (portionsToConsume <= 0) {
      throw new Error('Nombre de portions invalide');
    }

    const { data: dish, error: fetchError } = await db
      .from('cooked_dishes')
      .select('*')
      .eq('id', dishId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error('Plat introuvable');
    }

    if (dish.portions_remaining <= 0) {
      return {
        success: false,
        error: 'Ce plat est déjà entièrement consommé'
      };
    }

    const newPortionsRemaining = Math.max(
      0,
      dish.portions_remaining - portionsToConsume
    );

    const { data: updatedDish, error: updateError } = await db
      .from('cooked_dishes')
      .update({ portions_remaining: newPortionsRemaining })
      .eq('id', dishId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const message = newPortionsRemaining === 0
      ? `Plat "${dish.name}" entièrement consommé !`
      : `${portionsToConsume} portion(s) consommée(s). Reste ${newPortionsRemaining} portion(s).`;

    return {
      success: true,
      dish: updatedDish,
      message,
      fullyConsumed: newPortionsRemaining === 0
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la consommation'
    };
  }
}

/**
 * Congeler ou décongeler un plat cuisiné
 *
 * @param {number} dishId - ID du plat
 * @param {string} userId - ID de l'utilisateur
 * @param {string} newStorageMethod - Nouveau mode de stockage (fridge, freezer, counter)
 * @returns {Promise<{success: boolean, dish: Object, message: string}>}
 */
export async function changeStorageMethod(dishId, userId, newStorageMethod, supabaseClient = null) {
  // Chemin navigateur
  if (isBrowser) {
    try {
      const res = await authFetch(`/api/cooked-dishes/${dishId}/storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageMethod: newStorageMethod }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors du changement de stockage' }
      }
      return {
        success: true,
        dish: data.dish,
        message: data.message,
        daysUntilExpiration: data.daysUntilExpiration,
      }
    } catch (err) {
      return { success: false, error: err.message || 'Erreur lors du changement de stockage' }
    }
  }

  const db = supabaseClient || supabase

  // Chemin serveur
  try {
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }
    if (!['fridge', 'freezer', 'counter'].includes(newStorageMethod)) {
      throw new Error('Mode de stockage invalide');
    }

    const { data: dish, error: fetchError } = await db
      .from('cooked_dishes')
      .select('*')
      .eq('id', dishId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error('Plat introuvable');
    }

    if (dish.storage_method === newStorageMethod) {
      return {
        success: false,
        error: `Le plat est déjà stocké en mode "${newStorageMethod}"`
      };
    }

    const cookedAt = new Date(dish.cooked_at);
    const newExpirationDate = calculateCookedDishExpiration(cookedAt, newStorageMethod);

    const { data: updatedDish, error: updateError } = await db
      .from('cooked_dishes')
      .update({
        storage_method: newStorageMethod,
        expiration_date: newExpirationDate.toISOString().split('T')[0]
      })
      .eq('id', dishId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const storageLabels = {
      fridge: 'frigo',
      freezer: 'congélateur',
      counter: 'comptoir'
    };

    const daysUntilExpiration = Math.ceil(
      (newExpirationDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    return {
      success: true,
      dish: updatedDish,
      message: `Plat déplacé au ${storageLabels[newStorageMethod]}. Nouvelle DLC : ${daysUntilExpiration} jours.`,
      daysUntilExpiration
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors du changement de stockage'
    };
  }
}

/**
 * Récupérer tous les plats actifs d'un utilisateur
 *
 * Par défaut, les plats périmés (DLC strictement antérieure à aujourd'hui,
 * comparaison en UTC — piège #4) sont EXCLUS de la liste ; une DLC absente
 * (plats legacy) est considérée comme NON périmée. Passer `includeExpired: true`
 * pour les récupérer (revue / retrait du stock) : chaque plat retourné porte
 * alors un booléen calculé `expired`.
 *
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options de filtrage
 * @param {boolean} options.onlyWithPortions - Ne retourner que les plats avec portions restantes
 * @param {number} options.expiringInDays - Filtrer par jours avant expiration
 * @param {boolean} options.includeExpired - Inclure les plats dont la DLC est dépassée (défaut false)
 * @returns {Promise<{success: boolean, dishes: Array}>}
 */
export async function getCookedDishes(userId, options = {}, supabaseClient = null) {
  const db = supabaseClient || supabase
  try {
    if (!userId) {
      throw new Error('User ID requis');
    }

    // Comparaisons de dates en UTC (règle DLC / timezone)
    const todayUtc = new Date().toISOString().split('T')[0];

    let query = db
      .from('cooked_dishes')
      .select(`
        *,
        recipe:recipes(id, title, image_url),
        ingredients:cooked_dish_ingredients(
          id,
          quantity_used,
          unit,
          product_name,
          lot:inventory_lots(id, product_type, product_id)
        )
      `)
      .eq('user_id', userId)
      .order('expiration_date', { ascending: true });

    if (options.onlyWithPortions) {
      query = query.gt('portions_remaining', 0);
    }

    if (!options.includeExpired) {
      // DLC null (legacy) = non périmé → conservé.
      query = query.or(`expiration_date.is.null,expiration_date.gte.${todayUtc}`);
    }

    if (options.expiringInDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + options.expiringInDays);
      query = query.lte('expiration_date', targetDate.toISOString().split('T')[0]);
    }

    const { data: dishes, error } = await query;

    if (error) {
      throw error;
    }

    const dishesWithDays = (dishes || []).map(dish => ({
      ...dish,
      expired: Boolean(dish.expiration_date) && String(dish.expiration_date).slice(0, 10) < todayUtc,
      days_until_expiration: Math.ceil(
        (new Date(dish.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    }));

    return {
      success: true,
      dishes: dishesWithDays
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des plats',
      dishes: []
    };
  }
}

/**
 * Supprimer un plat cuisiné
 *
 * @param {number} dishId - ID du plat
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteCookedDish(dishId, userId, supabaseClient = null) {
  // Chemin navigateur
  if (isBrowser) {
    try {
      const res = await authFetch(`/api/cooked-dishes/${dishId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la suppression' }
      }
      return { success: true, message: data.message || 'Plat supprimé avec succès' }
    } catch (err) {
      return { success: false, error: err.message || 'Erreur lors de la suppression' }
    }
  }

  const db = supabaseClient || supabase

  // Chemin serveur
  try {
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }

    const { error } = await db
      .from('cooked_dishes')
      .delete()
      .eq('id', dishId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Plat supprimé avec succès'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    };
  }
}
