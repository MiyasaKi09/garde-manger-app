// Service de gestion des plats cuisinés
// Permet de créer, consommer, congeler et gérer les plats préparés

import { supabase } from './supabaseClient';
import { calculateCookedDishExpiration } from './shelfLifeRules';

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
  notes = null
}) {
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

    // Calculer la DLC du plat cuisiné
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod);

    // 1. Créer le plat cuisiné
    const { data: dish, error: dishError } = await supabase
      .from('cooked_dishes')
      .insert({
        user_id: userId,
        name: name.trim(),
        recipe_id: recipeId,
        portions_cooked: portionsCooked,
        portions_remaining: portionsCooked, // Toutes les portions au départ
        storage_method: storageMethod,
        cooked_at: cookedAt.toISOString(),
        expiration_date: expirationDate.toISOString().split('T')[0],
        notes: notes
      })
      .select()
      .single();

    if (dishError) {
      console.error('Erreur création plat:', dishError);
      throw dishError;
    }

    // 2. Enregistrer les ingrédients utilisés et déduire de l'inventaire
    if (ingredientsUsed && ingredientsUsed.length > 0) {
      const ingredientRecords = [];
      const inventoryUpdates = [];

      for (const ingredient of ingredientsUsed) {
        const { lotId, quantityUsed, unit, productName } = ingredient;

        if (!lotId || !quantityUsed || quantityUsed <= 0) {
          continue; // Skip invalid ingredients
        }

        // Enregistrer l'ingrédient utilisé
        ingredientRecords.push({
          dish_id: dish.id,
          lot_id: lotId,
          quantity_used: quantityUsed,
          unit: unit || 'u',
          product_name: productName || null
        });

        // Récupérer le lot pour déduire la quantité
        const { data: lot, error: lotError } = await supabase
          .from('inventory_lots')
          .select('qty_remaining, unit')
          .eq('id', lotId)
          .eq('user_id', userId)
          .single();

        if (!lotError && lot) {
          // Déduire la quantité utilisée
          const newQuantity = Math.max(0, lot.qty_remaining - quantityUsed);
          
          inventoryUpdates.push({
            lotId,
            newQuantity
          });
        }
      }

      // Insérer les ingrédients utilisés
      if (ingredientRecords.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('cooked_dish_ingredients')
          .insert(ingredientRecords);

        if (ingredientsError) {
          console.error('Erreur enregistrement ingrédients:', ingredientsError);
          // Non bloquant
        }
      }

      // Mettre à jour l'inventaire
      for (const update of inventoryUpdates) {
        const { error: updateError } = await supabase
          .from('inventory_lots')
          .update({ qty_remaining: update.newQuantity })
          .eq('id', update.lotId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('Erreur mise à jour inventaire:', updateError);
          // Non bloquant
        }
      }
    }

    // Message de succès
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
    console.error('Erreur createCookedDish:', error);
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
export async function consumePortions(dishId, userId, portionsToConsume = 1) {
  try {
    // Validation
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }
    if (portionsToConsume <= 0) {
      throw new Error('Nombre de portions invalide');
    }

    // Récupérer le plat
    const { data: dish, error: fetchError } = await supabase
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

    // Calculer les portions restantes
    const newPortionsRemaining = Math.max(
      0,
      dish.portions_remaining - portionsToConsume
    );

    // Mettre à jour le plat
    const { data: updatedDish, error: updateError } = await supabase
      .from('cooked_dishes')
      .update({
        portions_remaining: newPortionsRemaining
      })
      .eq('id', dishId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const message = newPortionsRemaining === 0
      ? `Plat "${dish.name}" entièrement consommé ! 🎉`
      : `${portionsToConsume} portion(s) consommée(s). Reste ${newPortionsRemaining} portion(s).`;

    return {
      success: true,
      dish: updatedDish,
      message,
      fullyConsumed: newPortionsRemaining === 0
    };

  } catch (error) {
    console.error('Erreur consumePortions:', error);
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
export async function changeStorageMethod(dishId, userId, newStorageMethod) {
  try {
    // Validation
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }
    if (!['fridge', 'freezer', 'counter'].includes(newStorageMethod)) {
      throw new Error('Mode de stockage invalide');
    }

    // Récupérer le plat
    const { data: dish, error: fetchError } = await supabase
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

    // Recalculer la DLC selon le nouveau mode de stockage
    const cookedAt = new Date(dish.cooked_at);
    const newExpirationDate = calculateCookedDishExpiration(cookedAt, newStorageMethod);

    // Mettre à jour le plat
    const { data: updatedDish, error: updateError } = await supabase
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

    const message = `Plat déplacé au ${storageLabels[newStorageMethod]}. Nouvelle DLC : ${daysUntilExpiration} jours.`;

    return {
      success: true,
      dish: updatedDish,
      message,
      daysUntilExpiration
    };

  } catch (error) {
    console.error('Erreur changeStorageMethod:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du changement de stockage'
    };
  }
}

/**
 * Récupérer tous les plats actifs d'un utilisateur
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} options - Options de filtrage
 * @param {boolean} options.onlyWithPortions - Ne retourner que les plats avec portions restantes
 * @param {number} options.expiringInDays - Filtrer par jours avant expiration
 * @returns {Promise<{success: boolean, dishes: Array}>}
 */
export async function getCookedDishes(userId, options = {}) {
  try {
    if (!userId) {
      throw new Error('User ID requis');
    }

    let query = supabase
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

    // Filtrer par portions restantes
    if (options.onlyWithPortions) {
      query = query.gt('portions_remaining', 0);
    }

    // Filtrer par expiration
    if (options.expiringInDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + options.expiringInDays);
      query = query.lte('expiration_date', targetDate.toISOString().split('T')[0]);
    }

    const { data: dishes, error } = await query;

    if (error) {
      throw error;
    }

    // Calculer les jours restants pour chaque plat
    const dishesWithDays = (dishes || []).map(dish => ({
      ...dish,
      days_until_expiration: Math.ceil(
        (new Date(dish.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    }));

    return {
      success: true,
      dishes: dishesWithDays
    };

  } catch (error) {
    console.error('Erreur getCookedDishes:', error);
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
export async function deleteCookedDish(dishId, userId) {
  try {
    if (!dishId || !userId) {
      throw new Error('Paramètres manquants');
    }

    const { error } = await supabase
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
    console.error('Erreur deleteCookedDish:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    };
  }
}
