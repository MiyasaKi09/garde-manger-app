-- ============================================================================
-- AIDE-MÉMOIRE : COMMANDES SQL UTILES POUR TESTS PHASE 2
-- ============================================================================

-- ============================================================================
-- 🔑 TROUVER VOTRE USER_ID
-- ============================================================================

-- Méthode 1 : Via email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'votre@email.com';

-- Méthode 2 : Lister tous les utilisateurs
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- ============================================================================
-- 📦 VOIR VOS LOTS D'INVENTAIRE
-- ============================================================================

-- Voir tous vos lots actifs (non consommés)
SELECT 
  id,
  product_name,
  quantity_value || ' ' || quantity_unit as quantité,
  location,
  expiration_date,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_avant_expiration
FROM inventory_lots
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ Remplacer
AND consumed_at IS NULL
ORDER BY expiration_date;

-- Copier des IDs de lots pour tests
SELECT 
  id as lot_id,
  product_name,
  quantity_value || ' ' || quantity_unit as disponible
FROM inventory_lots
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ Remplacer
AND consumed_at IS NULL
AND quantity_value > 0
LIMIT 5;

-- ============================================================================
-- 🍽️ VOIR VOS PLATS CUISINÉS
-- ============================================================================

-- Tous les plats
SELECT 
  id,
  name,
  portions_cooked,
  portions_remaining,
  storage_method,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_restants,
  created_at
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ Remplacer
ORDER BY created_at DESC;

-- Plats actifs uniquement
SELECT * FROM cooked_dishes_active
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ Remplacer
ORDER BY expiration_date;

-- Plats expirant bientôt
SELECT 
  name,
  portions_remaining,
  storage_method,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_restants
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID'  -- ⚠️ Remplacer
AND portions_remaining > 0
AND expiration_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY expiration_date;

-- ============================================================================
-- 🔍 VOIR LES INGRÉDIENTS D'UN PLAT
-- ============================================================================

SELECT 
  cd.name as plat,
  cdi.product_name as ingrédient,
  cdi.quantity_used || ' ' || cdi.unit as quantité,
  cdi.used_at
FROM cooked_dish_ingredients cdi
JOIN cooked_dishes cd ON cd.id = cdi.dish_id
WHERE cd.id = 'DISH_ID'  -- ⚠️ Remplacer par l'ID du plat
ORDER BY cdi.product_name;

-- ============================================================================
-- 📊 VOS STATISTIQUES
-- ============================================================================

SELECT * FROM cooked_dishes_stats
WHERE user_id = 'YOUR_USER_ID';  -- ⚠️ Remplacer

-- Statistiques détaillées
SELECT 
  COUNT(*) FILTER (WHERE portions_remaining > 0) as plats_actifs,
  COUNT(*) FILTER (WHERE portions_remaining = 0) as plats_finis,
  COUNT(*) FILTER (WHERE storage_method = 'fridge') as au_frigo,
  COUNT(*) FILTER (WHERE storage_method = 'freezer') as au_congélateur,
  COUNT(*) FILTER (WHERE storage_method = 'counter') as au_comptoir,
  SUM(portions_cooked) as total_portions_cuisinées,
  SUM(portions_remaining) as portions_restantes,
  COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE AND portions_remaining > 0) as plats_expirés
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID';  -- ⚠️ Remplacer

-- ============================================================================
-- 🧹 NETTOYER LES DONNÉES DE TEST
-- ============================================================================

-- ⚠️ ATTENTION : Supprime tous vos plats de test
-- Décommenter uniquement si vous êtes sûr

/*
DELETE FROM cooked_dishes 
WHERE user_id = 'YOUR_USER_ID' 
AND notes LIKE '%test%';
*/

-- Supprimer un plat spécifique
/*
DELETE FROM cooked_dishes
WHERE id = 'DISH_ID';
*/

-- ============================================================================
-- 🔧 REQUÊTES DE DÉBOGAGE
-- ============================================================================

-- Vérifier qu'un lot existe avant de l'utiliser
SELECT EXISTS (
  SELECT 1 FROM inventory_lots 
  WHERE id = 'LOT_ID' 
  AND user_id = 'YOUR_USER_ID'
  AND consumed_at IS NULL
);

-- Voir l'historique des modifications d'un plat
SELECT 
  name,
  portions_remaining,
  storage_method,
  expiration_date,
  updated_at
FROM cooked_dishes
WHERE id = 'DISH_ID';

-- Vérifier les triggers
SELECT 
  name,
  portions_cooked,
  portions_remaining,
  consumed_completely_at,
  CASE 
    WHEN portions_remaining = 0 AND consumed_completely_at IS NOT NULL 
    THEN '✅ Trigger OK'
    WHEN portions_remaining = 0 AND consumed_completely_at IS NULL 
    THEN '❌ Trigger non déclenché'
    ELSE '⏳ Encore des portions'
  END as trigger_status
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- ============================================================================
-- 📝 TEMPLATE POUR CRÉER UN PLAT MANUELLEMENT
-- ============================================================================

/*
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID';  -- ⚠️ Remplacer
  v_dish_id uuid;
BEGIN
  -- Créer le plat
  INSERT INTO cooked_dishes (
    user_id, name, portions_cooked, portions_remaining,
    storage_method, cooked_at, expiration_date, notes
  ) VALUES (
    v_user_id,
    'Nom du plat',
    4,  -- portions totales
    4,  -- portions restantes
    'fridge',  -- ou 'freezer' ou 'counter'
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '3 days',  -- 3j pour fridge, 90j pour freezer, 1j pour counter
    'Notes optionnelles'
  )
  RETURNING id INTO v_dish_id;

  RAISE NOTICE 'Plat créé avec ID : %', v_dish_id;
  
  -- Optionnel : Ajouter des ingrédients
  INSERT INTO cooked_dish_ingredients (dish_id, lot_id, quantity_used, unit, product_name)
  VALUES
    (v_dish_id, 'LOT_ID_1', 250, 'g', 'Nom produit 1'),
    (v_dish_id, 'LOT_ID_2', 100, 'ml', 'Nom produit 2');
    
  -- Optionnel : Déduire des lots
  UPDATE inventory_lots 
  SET quantity_value = quantity_value - 250 
  WHERE id = 'LOT_ID_1';
  
END $$;
*/

-- ============================================================================
-- 🔄 TEMPLATE POUR SIMULER DES ACTIONS
-- ============================================================================

-- Consommer 2 portions
/*
UPDATE cooked_dishes
SET portions_remaining = portions_remaining - 2
WHERE id = 'DISH_ID';
*/

-- Congeler un plat
/*
UPDATE cooked_dishes
SET 
  storage_method = 'freezer',
  expiration_date = CURRENT_TIMESTAMP + INTERVAL '90 days'
WHERE id = 'DISH_ID';
*/

-- Décongeler un plat
/*
UPDATE cooked_dishes
SET 
  storage_method = 'fridge',
  expiration_date = CURRENT_TIMESTAMP + INTERVAL '3 days'
WHERE id = 'DISH_ID';
*/

-- ============================================================================
-- 🎯 REQUÊTES POUR L'UI
-- ============================================================================

-- Simuler GET /api/cooked-dishes (tous)
SELECT 
  cd.*,
  COALESCE(
    json_agg(
      json_build_object(
        'product_name', cdi.product_name,
        'quantity_used', cdi.quantity_used,
        'unit', cdi.unit
      )
    ) FILTER (WHERE cdi.id IS NOT NULL),
    '[]'
  ) as ingredients
FROM cooked_dishes cd
LEFT JOIN cooked_dish_ingredients cdi ON cdi.dish_id = cd.id
WHERE cd.user_id = 'YOUR_USER_ID'
AND cd.portions_remaining > 0
GROUP BY cd.id
ORDER BY cd.expiration_date;

-- Simuler GET /api/cooked-dishes?expiringInDays=3
SELECT *
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID'
AND portions_remaining > 0
AND expiration_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY expiration_date;

-- ============================================================================
-- FIN
-- ============================================================================
