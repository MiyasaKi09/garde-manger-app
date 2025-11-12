-- Migration 021: Complétion shelf_life pour les 31 archetypes restants
-- Date: 2025-11-06
-- Description: Complète les durées de conservation des archetypes non couverts par migration 020

DO $$
DECLARE
  updated_count INT := 0;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   COMPLÉTION SHELF_LIFE - ARCHETYPES RESTANTS (31)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- BLÉ: Produits dérivés non couverts (8 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌾 PRODUITS DE BLÉ';

  -- Chapelure (pain sec) - longue conservation
  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 180,
    shelf_life_days_freezer = 365
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND a.name ILIKE '%chapelure%'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % chapelure (pantry: 180j)', updated_count;

  -- Semoule - longue conservation
  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 365,
    shelf_life_days_freezer = 730
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND a.name ILIKE '%semoule%'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % semoule (pantry: 365j)', updated_count;

  -- Pains spécifiques (baguette, brioche)
  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 3,
    shelf_life_days_fridge = 7,
    shelf_life_days_freezer = 90
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND (a.name ILIKE '%baguette%' OR a.name ILIKE '%brioche%')
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pains spécifiques (pantry: 3j, frigo: 7j)', updated_count;

  -- Pâtes sèches spécifiques (linguine, trofie, soba)
  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 730
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND (cf.canonical_name = 'blé' OR cf.canonical_name = 'sarrasin')
    AND (a.name ILIKE '%linguine%' OR a.name ILIKE '%trofie%' OR a.name ILIKE '%soba%')
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pâtes sèches spécifiques (pantry: 730j)', updated_count;

  -- Raviolis frais (pâtes fraîches)
  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 7,
    shelf_life_days_freezer = 90,
    open_shelf_life_days_fridge = 3
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'blé'
    AND a.name ILIKE '%ravioli%'
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % pâtes fraîches (frigo: 7j, freezer: 90j)', updated_count;

  -- =====================================================
  -- LAIT: Fromages génériques (5 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧀 FROMAGES GÉNÉRIQUES (lait de vache)';

  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 30,
    shelf_life_days_freezer = 90,
    open_shelf_life_days_fridge = 7
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'lait'
    AND (a.name ILIKE '%fromage%' OR a.name ILIKE '%feta%' OR a.name ILIKE '%mozzarella%')
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % fromages (frigo: 30j, freezer: 90j)', updated_count;

  -- =====================================================
  -- BIÈRE (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍺 BIÈRE';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 180,
    shelf_life_days_fridge = 365,
    open_shelf_life_days_fridge = 3
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'bière'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % bières (pantry: 180j, frigo: 365j)', updated_count;

  -- =====================================================
  -- CIDRE (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍎 CIDRE';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 180,
    shelf_life_days_fridge = 365,
    open_shelf_life_days_fridge = 5
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'cidre'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % cidres (pantry: 180j, frigo: 365j)', updated_count;

  -- =====================================================
  -- CACAO: Chocolat (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍫 CHOCOLAT';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 365,
    shelf_life_days_freezer = 730,
    open_shelf_life_days_pantry = 180
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'cacao'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % chocolats (pantry: 365j)', updated_count;

  -- =====================================================
  -- PRODUITS SECS (avoine, amande) - 2 archetypes
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥜 PRODUITS SECS (farines, flocons)';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 365,
    shelf_life_days_freezer = 730,
    open_shelf_life_days_pantry = 180
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name IN ('avoine', 'amande')
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % produits secs (pantry: 365j)', updated_count;

  -- =====================================================
  -- LÉGUMES FRAIS (6 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥬 LÉGUMES FRAIS';

  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 7,
    shelf_life_days_freezer = 180,
    open_shelf_life_days_fridge = 3
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name IN ('poireau', 'courgette', 'blette', 'légume')
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % légumes frais (frigo: 7j, freezer: 180j)', updated_count;

  -- =====================================================
  -- SAUCE TOMATE (conserve) - 1 archetype
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍅 SAUCE TOMATE';

  UPDATE archetypes a
  SET
    shelf_life_days_pantry = 730,
    open_shelf_life_days_fridge = 5
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND cf.canonical_name = 'tomate'
    AND a.name ILIKE '%sauce%'
    AND a.shelf_life_days_pantry IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % sauces tomate (pantry: 730j / 2 ans)', updated_count;

  -- =====================================================
  -- MORUE DESSALÉE (cultivar) - 1 archetype
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🐟 POISSON DESSALÉ (morue)';

  UPDATE archetypes a
  SET
    shelf_life_days_fridge = 3,
    shelf_life_days_freezer = 90,
    open_shelf_life_days_fridge = 1
  FROM cultivars cv
  WHERE a.cultivar_id = cv.id
    AND cv.cultivar_name = 'morue'
    AND a.shelf_life_days_fridge IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '  ✅ % morue dessalée (frigo: 3j, freezer: 90j)', updated_count;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Complétion des 31 archetypes restants terminée';
  RAISE NOTICE '';

END $$;

-- Vérification finale
SELECT
  'Archetypes SANS shelf_life (devrait être 0 ou proche)' as status,
  COUNT(*) as count
FROM archetypes
WHERE shelf_life_days_pantry IS NULL
  AND shelf_life_days_fridge IS NULL
  AND shelf_life_days_freezer IS NULL;
