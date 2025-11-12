-- Migration 019: Complétion intelligente des données manquantes
-- Date: 2025-11-06
-- Description: Complète automatiquement les colonnes manquantes (primary_unit, process, shelf_life)
--              en se basant sur les canonical_foods et les patterns détectés

DO $$
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   COMPLÉTION INTELLIGENTE DES DONNÉES MANQUANTES';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- ÉTAPE 1 : COPIER primary_unit DU CANONICAL (si manquant)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ÉTAPE 1: Copie primary_unit des canonicals';

  UPDATE archetypes a
  SET primary_unit = cf.primary_unit
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND (a.primary_unit IS NULL OR a.primary_unit = '');

  RAISE NOTICE '  ✅ primary_unit copié depuis canonical_foods';

  -- =====================================================
  -- ÉTAPE 2 : COPIER primary_unit DU CULTIVAR (si manquant)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ÉTAPE 2: Copie primary_unit des cultivars';

  UPDATE archetypes a
  SET primary_unit = cf.primary_unit
  FROM cultivars cv
  JOIN canonical_foods cf ON cv.canonical_food_id = cf.id
  WHERE a.cultivar_id = cv.id
    AND (a.primary_unit IS NULL OR a.primary_unit = '');

  RAISE NOTICE '  ✅ primary_unit copié depuis cultivars';

  -- =====================================================
  -- ÉTAPE 3 : AJOUTER process BASIQUE (si manquant)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ÉTAPE 3: Ajout process basique pour archetypes sans process';

  -- Process par défaut pour archetypes liés à un canonical
  UPDATE archetypes a
  SET process = 'transformation de base'
  FROM canonical_foods cf
  WHERE a.canonical_food_id = cf.id
    AND (a.process IS NULL OR a.process = '');

  RAISE NOTICE '  ✅ process ajouté pour archetypes avec canonical_food_id';

  -- Process par défaut pour archetypes liés à un cultivar
  UPDATE archetypes a
  SET process = 'transformation de base'
  FROM cultivars cv
  WHERE a.cultivar_id = cv.id
    AND (a.process IS NULL OR a.process = '');

  RAISE NOTICE '  ✅ process ajouté pour archetypes avec cultivar_id';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Complétion terminée avec succès';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  'Archetypes SANS primary_unit (devrait être 0)' as status,
  COUNT(*) as count
FROM archetypes
WHERE primary_unit IS NULL OR primary_unit = '';

SELECT
  'Archetypes SANS process' as status,
  COUNT(*) as count
FROM archetypes
WHERE process IS NULL OR process = '';
