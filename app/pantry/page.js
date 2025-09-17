'use client';  // ⚠️ CETTE LIGNE DOIT ÊTRE LA PREMIÈRE DU FICHIER

import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Leaf, Package, Droplets, Sun } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// ... autres imports ...

// ... le reste de votre code avant la fonction transformed ...

// Autour de la ligne 311, remplacez la fonction transformed par ceci :
const transformed = (data || []).map(item => {
  // NE PAS DÉCLARER LES VARIABLES ICI - SUPPRIMEZ CES LIGNES (312-329) :
  // const canonicalFoodId = ...
  // const cultivarId = ...
  // const derivedProductId = ...
  // const genericProductId = ...

  let productType = 'unknown';
  let productName = item.display_name || 'Produit inconnu';
  let primaryUnit = item.unit || null;
  let shelfLife = { pantry: null, fridge: null, freezer: null };
  let categoryInfo = null;
  let productInfo = null; // Ajoutez cette ligne

  if (item.canonical_food) {
    productType = 'canonical';
    productName = item.canonical_food.canonical_name;
    primaryUnit = item.canonical_food.primary_unit || primaryUnit;
    shelfLife = {
      pantry: item.canonical_food.shelf_life_days_pantry,
      fridge: item.canonical_food.shelf_life_days_fridge,
      freezer: item.canonical_food.shelf_life_days_freezer
    };
    categoryInfo = item.canonical_food.category;
    // Créer productInfo pour canonical
    productInfo = {
      id: item.canonical_food.id,
      type: 'canonical',
      canonical_food_id: item.canonical_food.id
    };
  } else if (item.cultivar) {
    productType = 'cultivar';
    productName = item.cultivar.cultivar_name;
    primaryUnit = item.cultivar.canonical_food?.primary_unit || primaryUnit;
    shelfLife = {
      pantry: item.cultivar.canonical_food?.shelf_life_days_pantry ?? null,
      fridge: item.cultivar.canonical_food?.shelf_life_days_fridge ?? null,
      freezer: item.cultivar.canonical_food?.shelf_life_days_freezer ?? null
    };
    categoryInfo = item.cultivar.canonical_food?.category;
    // Créer productInfo pour cultivar
    productInfo = {
      id: item.cultivar.id,
      type: 'cultivar',
      cultivar_id: item.cultivar.id,
      canonical_food_id: item.cultivar.canonical_food?.id
    };
  } else if (item.derived_product) {
    const parentCultivar = item.derived_product.cultivar;
    const canonical = parentCultivar?.canonical_food;
    const canonicalShelf = canonical
      ? {
          pantry: canonical.shelf_life_days_pantry,
          fridge: canonical.shelf_life_days_fridge,
          freezer: canonical.shelf_life_days_freezer
        }
      : { pantry: null, fridge: null, freezer: null };

    const expectedShelf = item.derived_product.expected_shelf_life_days;

    productInfo = {
      id: item.derived_product.id,
      name: item.derived_product.derived_name,
      type: 'derived',
      cultivar_id: parentCultivar?.id,
      canonical_food_id: canonical?.id || parentCultivar?.canonical_food_id || null,
      primary_unit: item.derived_product.package_unit || canonical?.primary_unit || 'unité',
      shelf_life: {
        pantry: expectedShelf ?? canonicalShelf.pantry,
        fridge: expectedShelf ?? canonicalShelf.fridge,
        freezer: expectedShelf ?? canonicalShelf.freezer
      }
    };
    
    productType = 'derived';
    productName = item.derived_product.derived_name;
    primaryUnit = productInfo.primary_unit;
    shelfLife = productInfo.shelf_life;
    categoryInfo = parentCultivar?.canonical_food?.category || canonical?.category || null;
  } else if (item.generic_product) {
    productInfo = {
      id: item.generic_product.id,
      name: item.generic_product.name,
      type: 'generic',
      primary_unit: item.generic_product.primary_unit
    };
    
    productType = 'generic';
    productName = item.generic_product.name;
    primaryUnit = item.generic_product.primary_unit || primaryUnit;
    shelfLife = {
      pantry: item.generic_product.shelf_life_days_pantry,
      fridge: item.generic_product.shelf_life_days_fridge,
      freezer: item.generic_product.shelf_life_days_freezer
    };
    categoryInfo = item.generic_product.category;
  }

  const locationName = item.location?.name ?? item.storage_place ?? 'Non spécifié';

  // DÉCLARATION UNIQUE DES VARIABLES (gardez seulement celle-ci) :
  const canonicalFoodId = item.canonical_food_id
    ?? productInfo?.canonical_food_id
    ?? (productType === 'canonical' ? productInfo?.id : null)
    ?? item.canonical_food?.id
    ?? item.cultivar?.canonical_food?.id
    ?? item.derived_product?.cultivar?.canonical_food?.id
    ?? null;

  const cultivarId = item.cultivar_id 
    ?? productInfo?.cultivar_id
    ?? (productType === 'cultivar' ? productInfo?.id : null)
    ?? item.cultivar?.id 
    ?? item.derived_product?.cultivar?.id
    ?? null;
  
  const genericProductId = item.generic_product_id 
    ?? (productType === 'generic' ? productInfo?.id : null)
    ?? item.generic_product?.id 
    ?? null;
  
  const derivedProductId = item.derived_product_id 
    ?? (productType === 'derived' ? productInfo?.id : null)
    ?? item.derived_product?.id 
    ?? null;

  return {
    id: item.id,
    user_id: item.user_id,
    quantity: item.quantity,
    unit: primaryUnit || item.unit || 'unité',
    expiry_date: item.expiry_date,
    purchase_date: item.purchase_date,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
    location: item.location || { id: null, name: locationName },
    storage_place: locationName,
    
    // Informations produit
    product: {
      id: canonicalFoodId || cultivarId || derivedProductId || genericProductId,
      name: productName,
      type: productType,
      category_id: categoryInfo?.id,
      category: categoryInfo,
      shelf_life: shelfLife,
      primary_unit: primaryUnit,
      icon: getCategoryIcon(categoryInfo?.id, categoryInfo?.name, productName)
    },

    // IDs de référence
    canonical_food_id: canonicalFoodId,
    cultivar_id: cultivarId,
    generic_product_id: genericProductId,
    derived_product_id: derivedProductId,
    
    // Objets complets pour référence
    canonical_food: item.canonical_food,
    cultivar: item.cultivar,
    generic_product: item.generic_product,
    derived_product: item.derived_product
  };
});
