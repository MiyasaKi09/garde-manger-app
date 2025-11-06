                                                  -- Migration 009 FIXED: Phase 2.1 - Poissons (archetypes spécifiques par espèce)
                                                              -- Date: 2025-11-03
                                                              -- Description: Supprime les archetypes génériques incorrects et crée des archetypes spécifiques

                                                              DO $$
                                                              DECLARE
                                                                -- IDs récupérés
                                                                cabillaud_id BIGINT;
                                                                lotte_id BIGINT;
                                                                sole_id BIGINT;
                                                                cultivar_morue_id BIGINT;
                                                                new_id BIGINT;
                                                              BEGIN

                                                                RAISE NOTICE '═══════════════════════════════════════════════════════';
                                                                RAISE NOTICE '   PHASE 2.1 FIXED : POISSONS (archetypes spécifiques)';
                                                                RAISE NOTICE '═══════════════════════════════════════════════════════';

                                                                -- Récupérer les IDs existants
                                                                SELECT id INTO cabillaud_id FROM canonical_foods WHERE canonical_name = 'cabillaud';
                                                                SELECT id INTO cultivar_morue_id FROM cultivars WHERE cultivar_name = 'morue';

                                                                RAISE NOTICE 'IDs existants: cabillaud=%, cultivar morue=%', cabillaud_id, cultivar_morue_id;

                                                                -- =====================================================
                                                                -- ÉTAPE 1 : SUPPRIMER LES ARCHETYPES GÉNÉRIQUES INCORRECTS
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '🗑️  SUPPRESSION des archetypes génériques incorrects';

                                                                DELETE FROM archetypes WHERE name IN (
                                                                  'poisson', 'poisson blanc', 'poissons variés', 'poissons rivière',
                                                                  'poissons blancs variés', 'poissons de roche variés'
                                                                );
                                                                RAISE NOTICE '  ✅ Supprimé: archetypes génériques avec hiérarchie';

                                                                -- =====================================================
                                                                -- ÉTAPE 2 : CRÉER CANONICAL FOODS MANQUANTS
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 CANONICAL FOODS (2 nouveaux poissons)';

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
                                                                -- ÉTAPE 3 : ARCHETYPES SPÉCIFIQUES - CABILLAUD
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 CABILLAUD (2 archetypes)';

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'filet de cabillaud') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('filet de cabillaud', cabillaud_id, 'découpe filet', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: filet de cabillaud';
                                                                END IF;

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'cabillaud fumé') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('cabillaud fumé', cabillaud_id, 'fumage', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: cabillaud fumé';
                                                                END IF;

                                                                -- =====================================================
                                                                -- ÉTAPE 4 : ARCHETYPES SPÉCIFIQUES - SOLE
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 SOLE (1 archetype)';

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'filet de sole') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('filet de sole', sole_id, 'découpe filet', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: filet de sole';
                                                                END IF;

                                                                -- =====================================================
                                                                -- ÉTAPE 5 : ARCHETYPES SPÉCIFIQUES - LOTTE
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 LOTTE (1 archetype)';

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'queue de lotte') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('queue de lotte', lotte_id, 'découpe queue', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: queue de lotte';
                                                                END IF;

                                                                -- =====================================================
                                                                -- ÉTAPE 6 : MORUE DESSALÉE (cultivar)
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 MORUE (1 archetype)';

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'morue dessalée') THEN
                                                                  INSERT INTO archetypes (name, cultivar_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('morue dessalée', cultivar_morue_id, 'dessalage', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: morue dessalée (cultivar)';
                                                                END IF;

                                                                -- =====================================================
                                                                -- ÉTAPE 7 : FUMET + ARÊTES + SAUCE (génériques utiles)
                                                                -- =====================================================
                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '📦 FUMET + ARÊTES + SAUCE (3 archetypes génériques)';

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fumet de poisson') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('fumet de poisson', cabillaud_id, 'bouillon poisson', 'ml', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: fumet de poisson (générique, base cabillaud)';
                                                                END IF;

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fumet poisson') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('fumet poisson', cabillaud_id, 'bouillon poisson', 'ml', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: fumet poisson (alias)';
                                                                END IF;

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'arêtes poisson') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('arêtes poisson', cabillaud_id, 'arêtes pour fumet', 'g', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: arêtes poisson';
                                                                END IF;

                                                                IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'sauce poisson') THEN
                                                                  INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
                                                                  VALUES ('sauce poisson', cabillaud_id, 'fermentation poisson (nuoc-mâm)', 'ml', NULL);
                                                                  RAISE NOTICE '  ✅ Créé: sauce poisson (nuoc-mâm)';
                                                                END IF;

                                                                RAISE NOTICE '';
                                                                RAISE NOTICE '✅ Phase 2.1 FIXED terminée : 10 ingrédients créés';
                                                                RAISE NOTICE '   - 2 canonical foods (lotte, sole)';
                                                                RAISE NOTICE '   - 2 archetypes cabillaud (filet, fumé)';
                                                                RAISE NOTICE '   - 1 archetype sole (filet)';
                                                                RAISE NOTICE '   - 1 archetype lotte (queue)';
                                                                RAISE NOTICE '   - 1 archetype morue (dessalée, cultivar)';
                                                                RAISE NOTICE '   - 3 génériques (fumet, arêtes, sauce)';

                                                              END $$;

                                                              -- Vérification
                                                              SELECT 'NOUVEAUX ARCHETYPES POISSONS' as type,
                                                                a.id,
                                                                a.name,
                                                                CASE
                                                                  WHEN a.canonical_food_id IS NOT NULL THEN cf.canonical_name
                                                                  WHEN a.cultivar_id IS NOT NULL THEN cv.cultivar_name
                                                                END as base,
                                                                'standalone (pas de hiérarchie)' as structure
                                                              FROM archetypes a
                                                              LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
                                                              LEFT JOIN cultivars cv ON a.cultivar_id = cv.id
                                                              WHERE a.name IN (
                                                                'filet de cabillaud', 'cabillaud fumé',
                                                                'filet de sole',
                                                                'queue de lotte',
                                                                'morue dessalée',
                                                                'fumet de poisson', 'fumet poisson', 'arêtes poisson', 'sauce poisson'
                                                              )
                                                              ORDER BY
                                                                CASE
                                                                  WHEN a.name LIKE '%cabillaud%' THEN 1
                                                                  WHEN a.name LIKE '%sole%' THEN 2
                                                                  WHEN a.name LIKE '%lotte%' THEN 3
                                                                  WHEN a.name LIKE '%morue%' THEN 4
                                                                  ELSE 5
                                                                END,
                                                                a.name;
