-- Migration 011: Phase 2.3 - Pâtes (11 ingrédients pâtes + 6 préparations)
-- Date: 2025-10-30
-- Description: Crée les pâtes alimentaires et préparations manquantes

DO $$
DECLARE
  -- IDs récupérés
  ble_id BIGINT;
  riz_id BIGINT;
  sarrasin_id BIGINT;
  tomate_id BIGINT;
  epices_id BIGINT;
  parent_pates_id BIGINT;
  parent_nouilles_id BIGINT;
  parent_pates_courtes_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 2.3 : PÂTES (17 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Récupérer les IDs existants
  SELECT id INTO ble_id FROM canonical_foods WHERE canonical_name = 'blé';
  SELECT id INTO riz_id FROM canonical_foods WHERE canonical_name = 'riz';
  SELECT id INTO sarrasin_id FROM canonical_foods WHERE canonical_name = 'sarrasin';
  SELECT id INTO tomate_id FROM canonical_foods WHERE canonical_name = 'tomate';

  -- Vérifier/créer canonical "épices" pour pâte laksa
  SELECT id INTO epices_id FROM canonical_foods WHERE canonical_name = 'épices';
  IF epices_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('épices', 'g')
    RETURNING id INTO epices_id;
    RAISE NOTICE 'Créé canonical: épices (id: %)', epices_id;
  END IF;

  RAISE NOTICE 'IDs canonical: blé=%, riz=%, sarrasin=%, épices=%', ble_id, riz_id, sarrasin_id, epices_id;

  -- =====================================================
  -- PARTIE 1 : PARENT "PÂTES" (1 parent)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PARENT PÂTES (1 archetype)';

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâtes' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâtes', ble_id, 'pâtes générique', 'g', NULL)
    RETURNING id INTO parent_pates_id;
    RAISE NOTICE '  ✅ Créé parent: pâtes (id: %)', parent_pates_id;
  ELSE
    SELECT id INTO parent_pates_id FROM archetypes WHERE name = 'pâtes' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe déjà: pâtes (id: %)', parent_pates_id;
  END IF;

  -- =====================================================
  -- PARTIE 2 : PÂTES ITALIENNES (5 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PÂTES ITALIENNES (5 archetypes)';

  -- Pâtes courtes (parent intermédiaire)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâtes courtes') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâtes courtes', ble_id, 'pâtes courtes', 'g', parent_pates_id)
    RETURNING id INTO parent_pates_courtes_id;
    RAISE NOTICE '  ✅ Créé enfant: pâtes courtes → pâtes (id: %)', parent_pates_courtes_id;
  ELSE
    SELECT id INTO parent_pates_courtes_id FROM archetypes WHERE name = 'pâtes courtes';
    RAISE NOTICE '  ℹ️  Existe déjà: pâtes courtes (id: %)', parent_pates_courtes_id;
  END IF;

  -- Linguine
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'linguine') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('linguine', ble_id, 'pâtes longues plates', 'g', parent_pates_id);
    RAISE NOTICE '  ✅ Créé enfant: linguine → pâtes';
  END IF;

  -- Trofie (pâtes ligures)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'trofie') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('trofie', ble_id, 'pâtes courtes torsadées', 'g', parent_pates_courtes_id);
    RAISE NOTICE '  ✅ Créé enfant: trofie → pâtes courtes';
  END IF;

  -- Trofie ou linguine (option flexible)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'trofie ou linguine') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('trofie ou linguine', ble_id, 'option pâtes', 'g', parent_pates_id);
    RAISE NOTICE '  ✅ Créé enfant: trofie ou linguine → pâtes';
  END IF;

  -- Raviolis frais
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'raviolis frais') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('raviolis frais', ble_id, 'pâtes farcies', 'g', parent_pates_id);
    RAISE NOTICE '  ✅ Créé enfant: raviolis frais → pâtes';
  END IF;

  -- =====================================================
  -- PARTIE 3 : NOUILLES ASIATIQUES (6 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 NOUILLES ASIATIQUES (6 archetypes)';

  -- Parent "nouilles"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'nouilles') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('nouilles', ble_id, 'nouilles générique', 'g', parent_pates_id)
    RETURNING id INTO parent_nouilles_id;
    RAISE NOTICE '  ✅ Créé enfant: nouilles → pâtes (id: %)', parent_nouilles_id;
  ELSE
    SELECT id INTO parent_nouilles_id FROM archetypes WHERE name = 'nouilles';
    RAISE NOTICE '  ℹ️  Existe déjà: nouilles (id: %)', parent_nouilles_id;
  END IF;

  -- Nouilles chinoises
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'nouilles chinoises') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('nouilles chinoises', ble_id, 'nouilles chinoises', 'g', parent_nouilles_id);
    RAISE NOTICE '  ✅ Créé enfant: nouilles chinoises → nouilles';
  END IF;

  -- Nouilles ramen
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'nouilles ramen') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('nouilles ramen', ble_id, 'nouilles japonaises', 'g', parent_nouilles_id);
    RAISE NOTICE '  ✅ Créé enfant: nouilles ramen → nouilles';
  END IF;

  -- Nouilles soba (sarrasin)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'nouilles soba') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('nouilles soba', sarrasin_id, 'nouilles sarrasin', 'g', parent_nouilles_id);
    RAISE NOTICE '  ✅ Créé enfant: nouilles soba (sarrasin) → nouilles';
  END IF;

  -- Nouilles udon
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'nouilles udon') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('nouilles udon', ble_id, 'nouilles épaisses', 'g', parent_nouilles_id);
    RAISE NOTICE '  ✅ Créé enfant: nouilles udon → nouilles';
  END IF;

  -- Fideos pâtes (pâtes espagnoles fines)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fideos pâtes') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fideos pâtes', ble_id, 'pâtes fines espagnoles', 'g', parent_nouilles_id);
    RAISE NOTICE '  ✅ Créé enfant: fideos pâtes → nouilles';
  END IF;

  -- =====================================================
  -- PARTIE 4 : PÂTES DE BOULANGERIE (2 préparations)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PÂTES DE BOULANGERIE (2 archetypes)';

  -- Pâte phyllo
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâte phyllo') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâte phyllo', ble_id, 'pâte feuilletée fine', 'g', NULL);
    RAISE NOTICE '  ✅ Créé standalone: pâte phyllo';
  END IF;

  -- Pâte à pizza
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâte à pizza') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâte à pizza', ble_id, 'pâte pizza', 'g', NULL);
    RAISE NOTICE '  ✅ Créé standalone: pâte à pizza';
  END IF;

  -- =====================================================
  -- PARTIE 5 : CONDIMENTS "PÂTE" (4 condiments)
  -- Note: Ce sont des purées/pâtes de condiments, pas des pâtes alimentaires
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CONDIMENTS PÂTE (4 archetypes)';
  RAISE NOTICE '  ℹ️  Ces ingrédients sont mal classés - ce sont des condiments, pas des pâtes alimentaires';

  -- Pâte laksa (curry)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâte laksa') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâte laksa', epices_id, 'pâte curry malaisien', 'g', NULL);
    RAISE NOTICE '  ⚠️  Créé standalone: pâte laksa (condiment, base épices)';
  END IF;

  -- Les autres condiments ont été exclus de cette migration car ils nécessitent
  -- des canonical foods spécifiques (achiote, arachide, haricot rouge, sésame)
  -- qui devront être créés séparément

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 2.3 terminée : 15 ingrédients créés';
  RAISE NOTICE '   - 1 parent pâtes';
  RAISE NOTICE '   - 5 pâtes italiennes (linguine, trofie, raviolis, pâtes courtes + option)';
  RAISE NOTICE '   - 6 nouilles asiatiques (parent nouilles + 5 types)';
  RAISE NOTICE '   - 2 pâtes de boulangerie (phyllo, pizza)';
  RAISE NOTICE '   - 1 condiment pâte (laksa)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: 4 condiments "pâte" (achiote, arachide, haricot rouge, sésame)';
  RAISE NOTICE '   nécessitent des canonical foods spécifiques - créés dans Phase 3';

END $$;

-- Vérification
SELECT 'NOUVEAUX ARCHETYPES PÂTES' as type,
  a.id,
  a.name,
  CASE
    WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone'
    ELSE 'enfant'
  END as niveau,
  p.name as parent_name,
  cf.canonical_name as base
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
WHERE a.name IN (
  'pâtes', 'pâtes courtes', 'linguine', 'trofie', 'trofie ou linguine', 'raviolis frais',
  'nouilles', 'nouilles chinoises', 'nouilles ramen', 'nouilles soba', 'nouilles udon', 'fideos pâtes',
  'pâte phyllo', 'pâte à pizza', 'pâte laksa'
)
ORDER BY
  CASE
    WHEN a.name = 'pâtes' THEN 1
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'pâtes' AND parent_archetype_id IS NULL) THEN 2
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'nouilles') THEN 3
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'pâtes courtes') THEN 4
    ELSE 5
  END,
  a.name;

-- Hiérarchie
SELECT
  'HIÉRARCHIE PÂTES' as info,
  p.name as parent_name,
  COUNT(a.id) as nb_enfants
FROM archetypes p
LEFT JOIN archetypes a ON a.parent_archetype_id = p.id
WHERE p.name IN ('pâtes', 'nouilles', 'pâtes courtes')
GROUP BY p.id, p.name
ORDER BY p.name;
