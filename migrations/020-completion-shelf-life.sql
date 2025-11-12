-- Migration 020: Complétion intelligente shelf_life
-- Date: 2025-11-06
-- Description: Complète les durées de conservation manquantes en fonction des catégories d'aliments
--              Basé sur les standards de sécurité alimentaire

DO $$
DECLARE
  updated_count INT := 0;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   COMPLÉTION SHELF_LIFE PAR CATÉGORIE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- VIANDES FRAÎCHES (bœuf, veau, porc, agneau, poulet)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥩 VIANDES FRAÎCHES';

  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 3,
    shelf_life_days_freezer = 120,
    open_shelf_life_days_fridge = 1
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name IN ('bœuf', 'veau', 'porc', 'agneau', 'poulet')
    AND a.shelf_life_days_fridge IS NULL
    AND a.shelf_life_days_freezer IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % viandes mises à jour (frigo: 3j, freezer: 120j)', updated_count;

  -- =====================================================
  -- POISSONS FRAIS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🐟 POISSONS FRAIS';

  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 2,
    shelf_life_days_freezer = 60,
    open_shelf_life_days_fridge = 1
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name IN ('cabillaud', 'sole', 'lotte', 'saumon')
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % poissons mis à jour (frigo: 2j, freezer: 60j)', updated_count;

  -- =====================================================
  -- ALCOOLS (longue conservation)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍷 ALCOOLS';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 1825,  -- 5 ans
    open_shelf_life_days_pantry = 365
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'alcool'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % alcools mis à jour (pantry: 1825j / 5 ans)', updated_count;

  -- =====================================================
  -- FROMAGES (selon type: frais ou affiné)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧀 FROMAGES';

  -- Fromages frais
  UPDATE archetypes
  SET
    shelf_life_days_fridge = 14,
    shelf_life_days_freezer = 60,
    open_shelf_life_days_fridge = 7
  WHERE (name ILIKE '%fromage frais%' OR name ILIKE '%fromage blanc%')
    AND shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % fromages frais (frigo: 14j)', updated_count;

  -- Autres fromages (affinés)
  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 45,
    shelf_life_days_freezer = 90,
    open_shelf_life_days_fridge = 14
  FROM cultivars cv
  WHERE a.cultivar_id = cv.id
    AND cv.cultivar_name IN ('lait de chèvre', 'lait de brebis')
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % fromages affinés (frigo: 45j)', updated_count;

  -- =====================================================
  -- PRODUITS LAITIERS (beurre, crème, yaourt)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥛 PRODUITS LAITIERS';

  -- Beurre
  UPDATE archetypes
  SET
    shelf_life_days_fridge = 90,
    shelf_life_days_freezer = 270,
    open_shelf_life_days_fridge = 30
  WHERE name ILIKE '%beurre%'
    AND shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % beurres (frigo: 90j, freezer: 270j)', updated_count;

  -- Crème
  UPDATE archetypes
  SET
    shelf_life_days_fridge = 30,
    shelf_life_days_freezer = 120,
    open_shelf_life_days_fridge = 5
  WHERE name ILIKE '%crème%'
    AND name NOT ILIKE '%ice%'
    AND shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % crèmes (frigo: 30j, freezer: 120j)', updated_count;

  -- Yaourt et lait fermenté
  UPDATE archetypes
  SET
    shelf_life_days_fridge = 21,
    shelf_life_days_freezer = 60,
    open_shelf_life_days_fridge = 3
  WHERE (name ILIKE '%yaourt%' OR name ILIKE '%lait%')
    AND shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % yaourts/laits (frigo: 21j)', updated_count;

  -- =====================================================
  -- PAINS (courte conservation)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍞 PAINS';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 3,
    shelf_life_days_fridge = 7,
    shelf_life_days_freezer = 90
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND a.name ILIKE '%pain%'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pains (pantry: 3j, frigo: 7j, freezer: 90j)', updated_count;

  -- =====================================================
  -- PÂTES SÈCHES (longue conservation)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍝 PÂTES SÈCHES';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 730  -- 2 ans
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND (a.name ILIKE '%pâte%' OR a.name ILIKE '%spaghetti%' OR a.name ILIKE '%nouille%')
    AND a.name NOT ILIKE '%pain%'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pâtes sèches (pantry: 730j / 2 ans)', updated_count;

  -- =====================================================
  -- ÉPICES (très longue conservation)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌶️ ÉPICES';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 730,  -- 2 ans
    open_shelf_life_days_pantry = 365
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'épices'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % épices (pantry: 730j / 2 ans)', updated_count;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Complétion shelf_life terminée';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  'Archetypes SANS shelf_life (tous champs)' as status,
  COUNT(*) as count
FROM archetypes
WHERE shelf_life_days_pantry IS NULL
  AND shelf_life_days_fridge IS NULL
  AND shelf_life_days_freezer IS NULL;
