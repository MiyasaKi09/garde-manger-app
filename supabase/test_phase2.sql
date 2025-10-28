-- ============================================================================
-- SCRIPT DE TEST PHASE 2 - PLATS CUISINÉS
-- ============================================================================
-- Ce script permet de tester rapidement la Phase 2 en créant des données
-- de test et en vérifiant que tout fonctionne correctement.
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : VÉRIFIER QUE LA MIGRATION EST APPLIQUÉE
-- ============================================================================

-- Vérifier que les tables existent
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name
    ) THEN '✅ Existe'
    ELSE '❌ Manquante'
  END as status
FROM (
  VALUES 
    ('cooked_dishes'),
    ('cooked_dish_ingredients')
) AS t(table_name);

-- Vérifier que les vues existent
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' AND information_schema.views.table_name = v.table_name
    ) THEN '✅ Existe'
    ELSE '❌ Manquante'
  END as status
FROM (
  VALUES 
    ('cooked_dishes_active'),
    ('cooked_dishes_stats')
) AS v(table_name);

-- Vérifier les triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing || ' ' || event_manipulation as trigger_event
FROM information_schema.triggers
WHERE event_object_table = 'cooked_dishes'
ORDER BY trigger_name;

-- ============================================================================
-- ÉTAPE 2 : CRÉER DES DONNÉES DE TEST
-- ============================================================================

-- REMPLACER 'YOUR_USER_ID' PAR VOTRE VRAI USER_ID
-- Pour trouver votre user_id :
-- SELECT id FROM auth.users WHERE email = 'votre@email.com';

-- Créer des ingrédients de test pour une lasagne
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI
  v_lot_pates uuid;
  v_lot_sauce uuid;
  v_lot_viande uuid;
  v_lot_fromage uuid;
BEGIN
  -- Insérer les lots d'ingrédients
  INSERT INTO inventory_lots (
    user_id, product_id, product_name, 
    quantity_value, quantity_unit, location,
    purchase_date, expiration_date
  ) VALUES
    (v_user_id, gen_random_uuid(), 'Pâtes à lasagne', 500, 'g', 'pantry', CURRENT_DATE, CURRENT_DATE + 180)
  RETURNING id INTO v_lot_pates;

  INSERT INTO inventory_lots (
    user_id, product_id, product_name, 
    quantity_value, quantity_unit, location,
    purchase_date, expiration_date
  ) VALUES
    (v_user_id, gen_random_uuid(), 'Sauce tomate', 400, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 30)
  RETURNING id INTO v_lot_sauce;

  INSERT INTO inventory_lots (
    user_id, product_id, product_name, 
    quantity_value, quantity_unit, location,
    purchase_date, expiration_date
  ) VALUES
    (v_user_id, gen_random_uuid(), 'Viande hachée', 500, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 3)
  RETURNING id INTO v_lot_viande;

  INSERT INTO inventory_lots (
    user_id, product_id, product_name, 
    quantity_value, quantity_unit, location,
    purchase_date, expiration_date
  ) VALUES
    (v_user_id, gen_random_uuid(), 'Fromage râpé', 200, 'g', 'fridge', CURRENT_DATE, CURRENT_DATE + 20)
  RETURNING id INTO v_lot_fromage;

  RAISE NOTICE 'Ingrédients créés :';
  RAISE NOTICE 'Pâtes : %', v_lot_pates;
  RAISE NOTICE 'Sauce : %', v_lot_sauce;
  RAISE NOTICE 'Viande : %', v_lot_viande;
  RAISE NOTICE 'Fromage : %', v_lot_fromage;
END $$;

-- ============================================================================
-- ÉTAPE 3 : VOIR LES INGRÉDIENTS CRÉÉS
-- ============================================================================

SELECT 
  id,
  product_name,
  quantity_value || ' ' || quantity_unit as quantité,
  location,
  expiration_date
FROM inventory_lots
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND consumed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- ÉTAPE 4 : CRÉER UN PLAT CUISINÉ (SIMULATION)
-- ============================================================================

-- Note : Normalement fait via l'API, mais on peut simuler ici
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI
  v_dish_id uuid;
  v_lot_pates uuid;
  v_lot_sauce uuid;
  v_lot_viande uuid;
  v_lot_fromage uuid;
BEGIN
  -- Récupérer les IDs des lots (derniers créés)
  SELECT id INTO v_lot_pates 
  FROM inventory_lots 
  WHERE user_id = v_user_id AND product_name = 'Pâtes à lasagne'
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_lot_sauce 
  FROM inventory_lots 
  WHERE user_id = v_user_id AND product_name = 'Sauce tomate'
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_lot_viande 
  FROM inventory_lots 
  WHERE user_id = v_user_id AND product_name = 'Viande hachée'
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_lot_fromage 
  FROM inventory_lots 
  WHERE user_id = v_user_id AND product_name = 'Fromage râpé'
  ORDER BY created_at DESC LIMIT 1;

  -- Créer le plat
  INSERT INTO cooked_dishes (
    user_id, name, portions_cooked, portions_remaining,
    storage_method, cooked_at, expiration_date,
    notes
  ) VALUES (
    v_user_id, 
    'Lasagnes maison', 
    4, 
    4,
    'fridge',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'Préparées pour tester Phase 2'
  )
  RETURNING id INTO v_dish_id;

  -- Enregistrer les ingrédients utilisés
  INSERT INTO cooked_dish_ingredients (dish_id, lot_id, quantity_used, unit, product_name)
  VALUES
    (v_dish_id, v_lot_pates, 250, 'g', 'Pâtes à lasagne'),
    (v_dish_id, v_lot_sauce, 400, 'g', 'Sauce tomate'),
    (v_dish_id, v_lot_viande, 500, 'g', 'Viande hachée'),
    (v_dish_id, v_lot_fromage, 100, 'g', 'Fromage râpé');

  -- Déduire les quantités des lots
  UPDATE inventory_lots SET quantity_value = quantity_value - 250 WHERE id = v_lot_pates;
  UPDATE inventory_lots SET quantity_value = quantity_value - 400, consumed_at = CURRENT_TIMESTAMP WHERE id = v_lot_sauce;
  UPDATE inventory_lots SET quantity_value = quantity_value - 500, consumed_at = CURRENT_TIMESTAMP WHERE id = v_lot_viande;
  UPDATE inventory_lots SET quantity_value = quantity_value - 100 WHERE id = v_lot_fromage;

  RAISE NOTICE 'Plat créé : %', v_dish_id;
  RAISE NOTICE 'Lasagnes maison - 4 portions - Expire dans 3 jours';
END $$;

-- ============================================================================
-- ÉTAPE 5 : VÉRIFIER LE PLAT CRÉÉ
-- ============================================================================

SELECT 
  id,
  name,
  portions_cooked,
  portions_remaining,
  storage_method,
  cooked_at,
  expiration_date,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_avant_expiration,
  notes
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
ORDER BY cooked_at DESC;

-- ============================================================================
-- ÉTAPE 6 : VOIR LES INGRÉDIENTS DU PLAT
-- ============================================================================

SELECT 
  cd.name as plat,
  cdi.product_name as ingrédient,
  cdi.quantity_used || ' ' || cdi.unit as quantité_utilisée,
  cdi.used_at
FROM cooked_dish_ingredients cdi
JOIN cooked_dishes cd ON cd.id = cdi.dish_id
WHERE cd.user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
ORDER BY cdi.used_at DESC;

-- ============================================================================
-- ÉTAPE 7 : VÉRIFIER LA DÉDUCTION DES INGRÉDIENTS
-- ============================================================================

SELECT 
  product_name,
  quantity_value || ' ' || quantity_unit as quantité_restante,
  CASE 
    WHEN consumed_at IS NOT NULL THEN '✅ Consommé complètement'
    ELSE '📦 Encore disponible'
  END as statut
FROM inventory_lots
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND product_name IN ('Pâtes à lasagne', 'Sauce tomate', 'Viande hachée', 'Fromage râpé')
ORDER BY created_at DESC;

-- Résultats attendus :
-- Pâtes : 250g restants (500 - 250)
-- Sauce : 0g - Consommé complètement (400 - 400)
-- Viande : 0g - Consommé complètement (500 - 500)
-- Fromage : 100g restants (200 - 100)

-- ============================================================================
-- ÉTAPE 8 : TESTER LA VUE cooked_dishes_active
-- ============================================================================

SELECT * FROM cooked_dishes_active
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
ORDER BY expiration_date;

-- Devrait montrer uniquement les plats avec portions_remaining > 0

-- ============================================================================
-- ÉTAPE 9 : TESTER LA VUE cooked_dishes_stats
-- ============================================================================

SELECT * FROM cooked_dishes_stats
WHERE user_id = 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI

-- Devrait afficher :
-- total_dishes: 1
-- active_dishes: 1
-- consumed_dishes: 0
-- total_portions_cooked: 4
-- total_portions_remaining: 4

-- ============================================================================
-- ÉTAPE 10 : SIMULER LA CONSOMMATION DE PORTIONS
-- ============================================================================

-- Manger 2 portions
UPDATE cooked_dishes
SET portions_remaining = portions_remaining - 2
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Lasagnes maison';

-- Vérifier
SELECT 
  name,
  portions_cooked,
  portions_remaining,
  consumed_completely_at
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Lasagnes maison';

-- Résultat attendu :
-- portions_cooked: 4
-- portions_remaining: 2
-- consumed_completely_at: NULL

-- ============================================================================
-- ÉTAPE 11 : TESTER LE TRIGGER consumed_completely_at
-- ============================================================================

-- Manger les 2 dernières portions
UPDATE cooked_dishes
SET portions_remaining = 0
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Lasagnes maison';

-- Vérifier que consumed_completely_at a été rempli automatiquement
SELECT 
  name,
  portions_remaining,
  consumed_completely_at,
  CASE 
    WHEN consumed_completely_at IS NOT NULL THEN '✅ Trigger fonctionnel'
    ELSE '❌ Trigger non déclenché'
  END as trigger_status
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Lasagnes maison';

-- ============================================================================
-- ÉTAPE 12 : TESTER LE CHANGEMENT DE STOCKAGE (CONGÉLATION)
-- ============================================================================

-- Créer un nouveau plat pour ce test
DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI
  v_dish_id uuid;
BEGIN
  INSERT INTO cooked_dishes (
    user_id, name, portions_cooked, portions_remaining,
    storage_method, cooked_at, expiration_date,
    notes
  ) VALUES (
    v_user_id,
    'Ragoût de bœuf',
    6,
    6,
    'fridge',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    'Test congélation'
  )
  RETURNING id INTO v_dish_id;

  RAISE NOTICE 'Ragoût créé : %', v_dish_id;
  RAISE NOTICE 'Stockage initial : fridge - Expire dans 3 jours';
END $$;

-- Voir le plat
SELECT 
  name,
  storage_method,
  cooked_at,
  expiration_date,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_avant_expiration
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Ragoût de bœuf';

-- Simuler la congélation (normalement fait via API)
-- Note : La recalculation de DLC se fait dans le service, pas directement en SQL
UPDATE cooked_dishes
SET 
  storage_method = 'freezer',
  expiration_date = CURRENT_TIMESTAMP + INTERVAL '90 days'
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Ragoût de bœuf';

-- Vérifier
SELECT 
  name,
  storage_method,
  expiration_date,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_avant_expiration
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND name = 'Ragoût de bœuf';

-- Résultat attendu :
-- storage_method: freezer
-- jours_avant_expiration: ~90

-- ============================================================================
-- ÉTAPE 13 : NETTOYER LES DONNÉES DE TEST
-- ============================================================================

-- ⚠️ ATTENTION : Ceci supprime TOUTES vos données de test
-- Décommenter uniquement si vous voulez tout supprimer

/*
DELETE FROM cooked_dishes 
WHERE user_id = 'YOUR_USER_ID' 
AND notes LIKE '%test%';

DELETE FROM inventory_lots 
WHERE user_id = 'YOUR_USER_ID'
AND product_name IN ('Pâtes à lasagne', 'Sauce tomate', 'Viande hachée', 'Fromage râpé');
*/

-- ============================================================================
-- REQUÊTES UTILES POUR LE MONITORING
-- ============================================================================

-- Voir tous les plats actifs avec urgence
SELECT 
  name,
  portions_remaining || '/' || portions_cooked as portions,
  storage_method,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_restants,
  CASE 
    WHEN EXTRACT(DAY FROM expiration_date - CURRENT_DATE) < 0 THEN '🔴 EXPIRÉ'
    WHEN EXTRACT(DAY FROM expiration_date - CURRENT_DATE) <= 2 THEN '🔴 URGENT'
    WHEN EXTRACT(DAY FROM expiration_date - CURRENT_DATE) <= 5 THEN '🟠 ATTENTION'
    ELSE '🟢 OK'
  END as urgence
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND portions_remaining > 0
ORDER BY expiration_date;

-- Plats à finir rapidement (3 jours)
SELECT 
  name,
  portions_remaining,
  expiration_date,
  EXTRACT(DAY FROM expiration_date - CURRENT_DATE) as jours_restants
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID' -- ⚠️ REMPLACER ICI
AND portions_remaining > 0
AND expiration_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY expiration_date;

-- Statistiques globales
SELECT 
  COUNT(*) FILTER (WHERE portions_remaining > 0) as plats_actifs,
  COUNT(*) FILTER (WHERE portions_remaining = 0) as plats_consommés,
  SUM(portions_remaining) as portions_totales_restantes,
  COUNT(*) FILTER (WHERE storage_method = 'freezer') as plats_congelés,
  COUNT(*) FILTER (WHERE expiration_date < CURRENT_DATE AND portions_remaining > 0) as plats_expirés
FROM cooked_dishes
WHERE user_id = 'YOUR_USER_ID'; -- ⚠️ REMPLACER ICI

-- ============================================================================
-- FIN DU SCRIPT DE TEST
-- ============================================================================
