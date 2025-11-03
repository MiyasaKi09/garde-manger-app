-- Migration 009: Phase 2.1 - Poissons (13 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les poissons manquants avec hiérarchie

DO $$
DECLARE
  -- IDs récupérés
  cabillaud_id BIGINT;
  lotte_id BIGINT;
  sole_id BIGINT;
  cultivar_morue_id BIGINT;
  parent_poisson_id BIGINT;
  parent_poisson_blanc_id BIGINT;
  parent_fumet_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 2.1 : POISSONS (13 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Récupérer les IDs existants
  SELECT id INTO cabillaud_id FROM canonical_foods WHERE canonical_name = 'cabillaud';
  SELECT id INTO cultivar_morue_id FROM cultivars WHERE cultivar_name = 'morue';

  RAISE NOTICE 'IDs existants: cabillaud=%, cultivar morue=%', cabillaud_id, cultivar_morue_id;

  -- =====================================================
  -- PARTIE 1 : CANONICAL FOODS (2 nouveaux poissons)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CANONICAL FOODS (2 poissons)';

  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'lotte') THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('lotte', 'g')
    RETURNING id INTO lotte_id;
    RAISE NOTICE '  ✅ Créé: lotte (id: %)', lotte_id;
  ELSE
    SELECT id INTO lotte_id FROM canonical_foods WHERE canonical_name = 'lotte';
    RAISE NOTICE '  ℹ️  Existe déjà: lotte (id: %)', lotte_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'sole') THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('sole', 'g')
    RETURNING id INTO sole_id;
    RAISE NOTICE '  ✅ Créé: sole (id: %)', sole_id;
  ELSE
    SELECT id INTO sole_id FROM canonical_foods WHERE canonical_name = 'sole';
    RAISE NOTICE '  ℹ️  Existe déjà: sole (id: %)', sole_id;
  END IF;

  -- =====================================================
  -- PARTIE 2 : ARCHETYPES GÉNÉRIQUES (4 parents)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ARCHETYPES GÉNÉRIQUES (4 parents)';

  -- Parent "poisson" (générique flexible pour toutes recettes)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poisson') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poisson', cabillaud_id, 'poisson générique', 'g', NULL)
    RETURNING id INTO parent_poisson_id;
    RAISE NOTICE '  ✅ Créé parent: poisson (id: %)', parent_poisson_id;
  ELSE
    SELECT id INTO parent_poisson_id FROM archetypes WHERE name = 'poisson';
    RAISE NOTICE '  ℹ️  Existe déjà: poisson (id: %)', parent_poisson_id;
  END IF;

  -- Parent "poisson blanc"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poisson blanc') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poisson blanc', cabillaud_id, 'poisson blanc générique', 'g', parent_poisson_id)
    RETURNING id INTO parent_poisson_blanc_id;
    RAISE NOTICE '  ✅ Créé parent: poisson blanc → poisson (id: %)', parent_poisson_blanc_id;
  ELSE
    SELECT id INTO parent_poisson_blanc_id FROM archetypes WHERE name = 'poisson blanc';
    RAISE NOTICE '  ℹ️  Existe déjà: poisson blanc (id: %)', parent_poisson_blanc_id;
  END IF;

  -- "poissons variés" (très générique, enfant de poisson)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poissons variés') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poissons variés', cabillaud_id, 'mélange poissons', 'g', parent_poisson_id);
    RAISE NOTICE '  ✅ Créé enfant: poissons variés → poisson';
  END IF;

  -- "poissons rivière"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poissons rivière') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poissons rivière', cabillaud_id, 'poissons eau douce', 'g', parent_poisson_id);
    RAISE NOTICE '  ✅ Créé enfant: poissons rivière → poisson';
  END IF;

  -- =====================================================
  -- PARTIE 3 : POISSONS BLANCS (2 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 POISSONS BLANCS (2 archetypes)';

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poissons blancs variés') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poissons blancs variés', cabillaud_id, 'mélange poissons blancs', 'g', parent_poisson_blanc_id);
    RAISE NOTICE '  ✅ Créé enfant: poissons blancs variés → poisson blanc';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poissons de roche variés') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poissons de roche variés', cabillaud_id, 'poissons de roche', 'g', parent_poisson_blanc_id);
    RAISE NOTICE '  ✅ Créé enfant: poissons de roche variés → poisson blanc';
  END IF;

  -- =====================================================
  -- PARTIE 4 : MORUE DESSALÉE (1 archetype)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 MORUE DESSALÉE (1 archetype)';

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'morue dessalée') THEN
    INSERT INTO archetypes (name, cultivar_id, process, primary_unit, parent_archetype_id)
    VALUES ('morue dessalée', cultivar_morue_id, 'dessalage', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: morue dessalée (basé sur cultivar morue)';
  END IF;

  -- =====================================================
  -- PARTIE 5 : FUMET + ARÊTES + SAUCE (3 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 FUMET + ARÊTES + SAUCE (3 archetypes)';

  -- Parent "fumet de poisson"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fumet de poisson') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fumet de poisson', cabillaud_id, 'bouillon poisson', 'ml', NULL)
    RETURNING id INTO parent_fumet_id;
    RAISE NOTICE '  ✅ Créé parent: fumet de poisson (id: %)', parent_fumet_id;
  ELSE
    SELECT id INTO parent_fumet_id FROM archetypes WHERE name = 'fumet de poisson';
    RAISE NOTICE '  ℹ️  Existe déjà: fumet de poisson (id: %)', parent_fumet_id;
  END IF;

  -- "fumet poisson" (alias, enfant de fumet de poisson)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fumet poisson') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fumet poisson', cabillaud_id, 'bouillon poisson', 'ml', parent_fumet_id);
    RAISE NOTICE '  ✅ Créé enfant: fumet poisson → fumet de poisson';
  END IF;

  -- "arêtes poisson"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'arêtes poisson') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('arêtes poisson', cabillaud_id, 'arêtes pour fumet', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: arêtes poisson';
  END IF;

  -- "sauce poisson" (nuoc-mâm asiatique)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'sauce poisson') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('sauce poisson', cabillaud_id, 'fermentation poisson', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé: sauce poisson (nuoc-mâm)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 2.1 terminée : 13 ingrédients créés';
  RAISE NOTICE '   - 2 canonical foods (lotte, sole)';
  RAISE NOTICE '   - 11 archetypes:';
  RAISE NOTICE '     • 1 parent poisson + 2 enfants génériques';
  RAISE NOTICE '     • 1 parent poisson blanc + 2 enfants blancs';
  RAISE NOTICE '     • 1 morue dessalée (cultivar)';
  RAISE NOTICE '     • 1 parent fumet + 1 enfant fumet';
  RAISE NOTICE '     • 1 arêtes + 1 sauce poisson';

END $$;

-- Vérification
SELECT 'NOUVEAUX CANONICAL POISSONS' as type,
  id, canonical_name
FROM canonical_foods
WHERE canonical_name IN ('lotte', 'sole')
ORDER BY canonical_name;

SELECT 'NOUVEAUX ARCHETYPES POISSONS' as type,
  a.id,
  a.name,
  CASE
    WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone'
    ELSE 'enfant'
  END as niveau,
  p.name as parent_name,
  CASE
    WHEN a.canonical_food_id IS NOT NULL THEN cf.canonical_name
    WHEN a.cultivar_id IS NOT NULL THEN cv.cultivar_name
  END as base
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON a.cultivar_id = cv.id
WHERE a.name IN (
  'poisson', 'poisson blanc', 'poissons variés', 'poissons rivière',
  'poissons blancs variés', 'poissons de roche variés',
  'morue dessalée',
  'fumet de poisson', 'fumet poisson', 'arêtes poisson', 'sauce poisson'
)
ORDER BY
  CASE
    WHEN a.name = 'poisson' THEN 1
    WHEN a.name = 'poisson blanc' THEN 2
    WHEN a.name LIKE 'poissons%' THEN 3
    WHEN a.name = 'morue dessalée' THEN 4
    WHEN a.name LIKE 'fumet%' THEN 5
    ELSE 6
  END,
  a.name;

-- Compter la hiérarchie
SELECT
  p.name as parent_name,
  COUNT(a.id) as nb_enfants
FROM archetypes p
LEFT JOIN archetypes a ON a.parent_archetype_id = p.id
WHERE p.name IN ('poisson', 'poisson blanc', 'fumet de poisson')
GROUP BY p.id, p.name
ORDER BY p.name;
