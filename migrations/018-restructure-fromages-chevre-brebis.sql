-- Migration 018: Restructuration fromages et produits laitiers chèvre/brebis
-- Date: 2025-11-03
-- Description: Migre les fromages et produits laitiers spécifiques chèvre/brebis
--              du canonical "lait" vers les cultivars correspondants
--
-- LOGIQUE: "lait" = implicitement lait de vache (l'évident)
--          Les exceptions (chèvre/brebis) utilisent les cultivars
--
-- AVANT: lait [canonical] → Crottin de chèvre, Roquefort, Yaourt lait de chèvre, etc.
-- APRÈS: lait de chèvre [cultivar] → Crottin de chèvre, Yaourt lait de chèvre, etc.
--        lait de brebis [cultivar] → Roquefort, Pecorino, Yaourt lait de brebis, etc.

DO $$
DECLARE
  lait_canonical_id BIGINT;
  chevre_cultivar_id BIGINT;
  brebis_cultivar_id BIGINT;
  chevre_count INT := 0;
  brebis_count INT := 0;
  additional_count INT := 0;
  rec RECORD;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   RESTRUCTURATION : FROMAGES CHÈVRE/BREBIS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- ÉTAPE 1 : VÉRIFIER LES PRÉREQUIS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VÉRIFICATION des prérequis';

  -- Vérifier canonical "lait"
  SELECT id INTO lait_canonical_id FROM canonical_foods WHERE canonical_name = 'lait';
  IF lait_canonical_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: Le canonical "lait" n''existe pas.';
  END IF;
  RAISE NOTICE '  ✅ Canonical "lait" trouvé (id: %)', lait_canonical_id;

  -- Vérifier cultivar "lait de chèvre"
  SELECT id INTO chevre_cultivar_id FROM cultivars WHERE cultivar_name = 'lait de chèvre';
  IF chevre_cultivar_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: Le cultivar "lait de chèvre" n''existe pas.';
  END IF;
  RAISE NOTICE '  ✅ Cultivar "lait de chèvre" trouvé (id: %)', chevre_cultivar_id;

  -- Vérifier cultivar "lait de brebis"
  SELECT id INTO brebis_cultivar_id FROM cultivars WHERE cultivar_name = 'lait de brebis';
  IF brebis_cultivar_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: Le cultivar "lait de brebis" n''existe pas.';
  END IF;
  RAISE NOTICE '  ✅ Cultivar "lait de brebis" trouvé (id: %)', brebis_cultivar_id;

  -- =====================================================
  -- ÉTAPE 2 : MIGRER LES FROMAGES/PRODUITS CHÈVRE
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 MIGRATION : Produits CHÈVRE (8 archetypes)';

  -- Migrer les 8 produits chèvre identifiés
  UPDATE archetypes
  SET canonical_food_id = NULL,
      cultivar_id = chevre_cultivar_id
  WHERE canonical_food_id = lait_canonical_id
    AND name IN (
      'Crottin de chèvre',
      'fromage de chèvre',
      'Picodon',
      'Pouligny-Saint-Pierre',
      'Rocamadour',
      'Sainte-Maure',
      'Valençay',
      'Yaourt lait de chèvre'
    );
  GET DIAGNOSTICS chevre_count = ROW_COUNT;

  RAISE NOTICE '  ✅ Migré: % archetype(s) chèvre vers cultivar "lait de chèvre"', chevre_count;

  -- Lister les archetypes migrés
  RAISE NOTICE '';
  RAISE NOTICE '  Archetypes chèvre migrés:';
  FOR rec IN
    SELECT name
    FROM archetypes
    WHERE cultivar_id = chevre_cultivar_id
    ORDER BY name
  LOOP
    RAISE NOTICE '    - %', rec.name;
  END LOOP;

  -- =====================================================
  -- ÉTAPE 3 : MIGRER LES FROMAGES/PRODUITS BREBIS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 MIGRATION : Produits BREBIS (2 archetypes)';

  -- Migrer les 2 produits brebis identifiés
  UPDATE archetypes
  SET canonical_food_id = NULL,
      cultivar_id = brebis_cultivar_id
  WHERE canonical_food_id = lait_canonical_id
    AND name IN (
      'Pecorino',
      'Yaourt lait de brebis'
    );
  GET DIAGNOSTICS brebis_count = ROW_COUNT;

  RAISE NOTICE '  ✅ Migré: % archetype(s) brebis vers cultivar "lait de brebis"', brebis_count;

  -- Lister les archetypes migrés
  RAISE NOTICE '';
  RAISE NOTICE '  Archetypes brebis migrés:';
  FOR rec IN
    SELECT name
    FROM archetypes
    WHERE cultivar_id = brebis_cultivar_id
    ORDER BY name
  LOOP
    RAISE NOTICE '    - %', rec.name;
  END LOOP;

  -- =====================================================
  -- ÉTAPE 4 : VÉRIFIER AUTRES FROMAGES BREBIS POTENTIELS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VÉRIFICATION : Autres fromages brebis potentiels';

  -- Chercher le Roquefort (devrait être brebis mais peut être mal classé)
  IF EXISTS (
    SELECT 1 FROM archetypes
    WHERE canonical_food_id = lait_canonical_id
    AND (name ILIKE '%roquefort%' OR name ILIKE '%ossau%')
  ) THEN
    RAISE NOTICE '  ⚠️  ATTENTION: Roquefort ou Ossau-Iraty trouvé sur canonical "lait"';
    RAISE NOTICE '      Ces fromages devraient être migrés vers "lait de brebis"';

    -- Migrer automatiquement
    UPDATE archetypes
    SET canonical_food_id = NULL,
        cultivar_id = brebis_cultivar_id
    WHERE canonical_food_id = lait_canonical_id
      AND (name ILIKE '%roquefort%' OR name ILIKE '%ossau%');
    GET DIAGNOSTICS additional_count = ROW_COUNT;
    brebis_count := brebis_count + additional_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé:';
  RAISE NOTICE '  - % archetype(s) CHÈVRE migrés vers cultivar "lait de chèvre"', chevre_count;
  RAISE NOTICE '  - % archetype(s) BREBIS migrés vers cultivar "lait de brebis"', brebis_count;
  RAISE NOTICE '  - Les fromages VACHE restent sur canonical "lait" (implicite)';
  RAISE NOTICE '';

END $$;

-- Vérification finale
SELECT
  '✅ ARCHETYPES CHÈVRE (cultivar lait de chèvre)' as status,
  a.id,
  a.name,
  cv.cultivar_name as cultivar
FROM archetypes a
JOIN cultivars cv ON a.cultivar_id = cv.id
WHERE cv.cultivar_name = 'lait de chèvre'
ORDER BY a.name;

SELECT
  '✅ ARCHETYPES BREBIS (cultivar lait de brebis)' as status,
  a.id,
  a.name,
  cv.cultivar_name as cultivar
FROM archetypes a
JOIN cultivars cv ON a.cultivar_id = cv.id
WHERE cv.cultivar_name = 'lait de brebis'
ORDER BY a.name;
