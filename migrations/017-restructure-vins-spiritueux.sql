-- Migration 017: Restructuration vins et spiritueux
-- Date: 2025-11-03
-- Description: Migre vin blanc, vin rouge et cognac du canonical "raisin" vers "alcool"
--
-- PROBLÈME: Le vin n'est PAS du raisin, c'est du raisin FERMENTÉ
--           Le cognac n'est pas du raisin, c'est du vin DISTILLÉ
--
-- AVANT: raisin [canonical] → vin blanc, vin rouge, cognac [archetypes]
-- APRÈS: alcool [canonical] → vin blanc, vin rouge, cognac [archetypes]
--
-- IMPORTANT: Cette migration doit être exécutée APRÈS la migration 015 (qui crée le canonical "alcool")

DO $$
DECLARE
  alcool_id BIGINT;
  raisin_id BIGINT;
  vin_blanc_count INT;
  vin_rouge_count INT;
  cognac_count INT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   RESTRUCTURATION : VINS ET SPIRITUEUX';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- ÉTAPE 1 : VÉRIFIER LES PRÉREQUIS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VÉRIFICATION des prérequis';

  -- Vérifier que le canonical "alcool" existe (créé par migration 015)
  SELECT id INTO alcool_id FROM canonical_foods WHERE canonical_name = 'alcool';
  IF alcool_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: Le canonical "alcool" n''existe pas. Exécutez la migration 015 d''abord.';
  END IF;
  RAISE NOTICE '  ✅ Canonical "alcool" trouvé (id: %)', alcool_id;

  -- Récupérer l'ID du canonical "raisin"
  SELECT id INTO raisin_id FROM canonical_foods WHERE canonical_name = 'raisin';
  IF raisin_id IS NULL THEN
    RAISE EXCEPTION 'ERREUR: Le canonical "raisin" n''existe pas.';
  END IF;
  RAISE NOTICE '  ✅ Canonical "raisin" trouvé (id: %)', raisin_id;

  -- =====================================================
  -- ÉTAPE 2 : MIGRER LES ARCHETYPES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 MIGRATION des archetypes (raisin → alcool)';

  -- Migrer "vin blanc"
  UPDATE archetypes
  SET canonical_food_id = alcool_id,
      process = 'fermentation raisin blanc'
  WHERE name = 'vin blanc' AND canonical_food_id = raisin_id;
  GET DIAGNOSTICS vin_blanc_count = ROW_COUNT;

  IF vin_blanc_count > 0 THEN
    RAISE NOTICE '  ✅ Migré: vin blanc (% ligne(s))', vin_blanc_count;
  ELSE
    RAISE NOTICE '  ⚠️  Vin blanc: déjà migré ou non trouvé';
  END IF;

  -- Migrer "vin rouge"
  UPDATE archetypes
  SET canonical_food_id = alcool_id,
      process = 'fermentation raisin rouge'
  WHERE name = 'vin rouge' AND canonical_food_id = raisin_id;
  GET DIAGNOSTICS vin_rouge_count = ROW_COUNT;

  IF vin_rouge_count > 0 THEN
    RAISE NOTICE '  ✅ Migré: vin rouge (% ligne(s))', vin_rouge_count;
  ELSE
    RAISE NOTICE '  ⚠️  Vin rouge: déjà migré ou non trouvé';
  END IF;

  -- Migrer "cognac"
  UPDATE archetypes
  SET canonical_food_id = alcool_id,
      process = 'distillation vin'
  WHERE name = 'cognac' AND canonical_food_id = raisin_id;
  GET DIAGNOSTICS cognac_count = ROW_COUNT;

  IF cognac_count > 0 THEN
    RAISE NOTICE '  ✅ Migré: cognac (% ligne(s))', cognac_count;
  ELSE
    RAISE NOTICE '  ⚠️  Cognac: déjà migré ou non trouvé';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '';
  RAISE NOTICE 'Résumé:';
  RAISE NOTICE '  - % archetype(s) migré(s) de "raisin" vers "alcool"',
    vin_blanc_count + vin_rouge_count + cognac_count;
  RAISE NOTICE '  - Canonical "raisin" ne contient plus que: raisins secs, jus de raisin, etc.';
  RAISE NOTICE '  - Canonical "alcool" contient maintenant: vin blanc, vin rouge, cognac + 7 autres';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  '✅ ARCHETYPES SOUS "ALCOOL"' as status,
  a.id,
  a.name as archetype,
  cf.canonical_name as base_canonical,
  a.process as description
FROM archetypes a
JOIN canonical_foods cf ON a.canonical_food_id = cf.id
WHERE cf.canonical_name = 'alcool'
ORDER BY a.name;
