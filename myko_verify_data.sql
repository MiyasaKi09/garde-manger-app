-- ============================================
-- SCRIPT: Vérification des données recettes Myko
-- Description: Vérifier l'état des recettes, ingrédients et inventaire
-- ============================================

-- 1. État des recettes et de leurs ingrédients
SELECT 
  'RECETTES ET INGRÉDIENTS' as section,
  '' as spacer;

SELECT 
  r.id,
  r.name as recette,
  r.myko_score,
  COUNT(ri.id) as nb_ingredients,
  CASE 
    WHEN COUNT(ri.id) = 0 THEN '❌ Aucun ingrédient'
    WHEN COUNT(ri.id) < 5 THEN '⚠️ Peu d''ingrédients'
    ELSE '✅ Bien complété'
  END as statut
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id, r.name, r.myko_score
ORDER BY r.id;

-- 2. Détail des ingrédients par recette
SELECT 
  '' as spacer,
  'DÉTAIL DES INGRÉDIENTS' as section;

SELECT 
  r.name as recette,
  cf.name as ingredient,
  ri.quantity,
  ri.unit,
  ri.notes
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
ORDER BY r.id, cf.name;

-- 3. Ingrédients disponibles dans l'inventaire
SELECT 
  '' as spacer,
  'INVENTAIRE DISPONIBLE' as section;

SELECT 
  cf.name as ingredient,
  SUM(il.quantity_remaining) as quantite_restante,
  il.unit,
  COUNT(il.id) as nb_lots,
  MIN(il.expiry_date) as prochaine_expiration
FROM canonical_foods cf
JOIN products p ON cf.id = p.canonical_food_id
JOIN inventory_lots il ON p.id = il.product_id
WHERE il.quantity_remaining > 0
  AND il.expiry_date > CURRENT_DATE
GROUP BY cf.id, cf.name, il.unit
ORDER BY cf.name;

-- 4. Calcul de disponibilité par recette
SELECT 
  '' as spacer,
  'DISPONIBILITÉ PAR RECETTE' as section;

WITH recipe_availability AS (
  SELECT 
    r.id,
    r.name as recette,
    COUNT(ri.id) as total_ingredients,
    COUNT(CASE 
      WHEN EXISTS (
        SELECT 1 FROM inventory_lots il
        JOIN products p ON il.product_id = p.id
        WHERE p.canonical_food_id = ri.canonical_food_id
          AND il.quantity_remaining > 0
          AND il.expiry_date > CURRENT_DATE
      ) THEN 1 
    END) as available_ingredients
  FROM recipes r
  LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  GROUP BY r.id, r.name
)
SELECT 
  recette,
  total_ingredients,
  available_ingredients,
  CASE 
    WHEN total_ingredients = 0 THEN 0
    ELSE ROUND((available_ingredients::FLOAT / total_ingredients * 100), 0)
  END as pourcentage_disponible,
  CASE 
    WHEN total_ingredients = 0 THEN '❌ Aucun ingrédient défini'
    WHEN available_ingredients = total_ingredients THEN '🟢 Entièrement disponible'
    WHEN available_ingredients > 0 THEN '🟡 Partiellement disponible'
    ELSE '🔴 Aucun ingrédient disponible'
  END as statut
FROM recipe_availability
ORDER BY pourcentage_disponible DESC, recette;

-- 5. Ingrédients manquants par recette
SELECT 
  '' as spacer,
  'INGRÉDIENTS MANQUANTS' as section;

SELECT 
  r.name as recette,
  cf.name as ingredient_manquant,
  ri.quantity as quantite_requise,
  ri.unit
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_lots il
  JOIN products p ON il.product_id = p.id
  WHERE p.canonical_food_id = ri.canonical_food_id
    AND il.quantity_remaining > 0
    AND il.expiry_date > CURRENT_DATE
)
ORDER BY r.name, cf.name;