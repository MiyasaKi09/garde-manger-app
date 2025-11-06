-- Migration 015: Restructuration des alcools
-- Date: 2025-11-03
-- Description: Transforme les alcools spécifiques (Grand Marnier, Marsala, etc.)
--              de canonical foods en archetypes sous un nouveau canonical "alcool"
--
-- AVANT: Grand Marnier [canonical] → Marsala [canonical] → etc.
-- APRÈS: alcool [canonical] → Grand Marnier [archetype] → Marsala [archetype] → etc.

DO $$
DECLARE
  alcool_canonical_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   RESTRUCTURATION : ALCOOLS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- ÉTAPE 1 : CRÉER LE CANONICAL "alcool"
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CRÉATION CANONICAL: alcool';

  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'alcool') THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('alcool', 'ml')
    RETURNING id INTO alcool_canonical_id;
    RAISE NOTICE '  ✅ Créé: alcool (id: %)', alcool_canonical_id;
  ELSE
    SELECT id INTO alcool_canonical_id FROM canonical_foods WHERE canonical_name = 'alcool';
    RAISE NOTICE '  ℹ️  Existe déjà: alcool (id: %)', alcool_canonical_id;
  END IF;

  -- =====================================================
  -- ÉTAPE 2 : CRÉER LES ARCHETYPES (7 alcools)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CRÉATION ARCHETYPES (7 alcools spécifiques)';

  -- Grand Marnier (liqueur orange cognac)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'Grand Marnier') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('Grand Marnier', alcool_canonical_id, 'liqueur orange cognac', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: Grand Marnier';
  END IF;

  -- Marsala (vin fortifié italien)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'Marsala') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('Marsala', alcool_canonical_id, 'vin fortifié italien', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: Marsala';
  END IF;

  -- amaretto (liqueur amande)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'amaretto') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('amaretto', alcool_canonical_id, 'liqueur amande', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: amaretto';
  END IF;

  -- calvados (eau-de-vie pomme)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'calvados') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('calvados', alcool_canonical_id, 'eau-de-vie pomme normand', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: calvados';
  END IF;

  -- kirsch (eau-de-vie cerise)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'kirsch') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('kirsch', alcool_canonical_id, 'eau-de-vie cerise', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: kirsch';
  END IF;

  -- porto (vin fortifié portugais)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'porto') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('porto', alcool_canonical_id, 'vin fortifié portugais', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: porto';
  END IF;

  -- rhum (eau-de-vie canne à sucre)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'rhum') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('rhum', alcool_canonical_id, 'eau-de-vie canne à sucre', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé archetype: rhum';
  END IF;

  -- =====================================================
  -- ÉTAPE 3 : SUPPRIMER LES ANCIENS CANONICALS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  SUPPRESSION anciens canonicals (maintenant archetypes)';

  DELETE FROM canonical_foods WHERE canonical_name IN (
    'Grand Marnier', 'Marsala', 'amaretto', 'calvados',
    'kirsch', 'porto', 'rhum'
  );
  RAISE NOTICE '  ✅ Supprimé: 7 anciens canonical foods';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration terminée avec succès';
  RAISE NOTICE '';
  RAISE NOTICE 'Résultat:';
  RAISE NOTICE '  - 1 nouveau canonical: alcool';
  RAISE NOTICE '  - 7 nouveaux archetypes: Grand Marnier, Marsala, amaretto, calvados, kirsch, porto, rhum';
  RAISE NOTICE '  - 7 canonicals supprimés';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  '✅ NOUVEAUX ARCHETYPES ALCOOLS' as status,
  a.id,
  a.name as archetype,
  cf.canonical_name as base_canonical,
  a.process as description,
  a.primary_unit as unit
FROM archetypes a
JOIN canonical_foods cf ON a.canonical_food_id = cf.id
WHERE cf.canonical_name = 'alcool'
ORDER BY a.name;
