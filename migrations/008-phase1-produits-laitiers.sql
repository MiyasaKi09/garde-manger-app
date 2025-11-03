-- Migration 008: Phase 1.3 - Produits Laitiers (21 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les produits laitiers manquants avec hiérarchie

DO $$
DECLARE
  -- IDs récupérés
  lait_id BIGINT;
  chataigne_id BIGINT;
  sucre_id BIGINT;
  parent_beurre_id BIGINT;
  parent_creme_id BIGINT;
  parent_fromage_id BIGINT;
  parent_creme_patissiere_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 1.3 : PRODUITS LAITIERS (21 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Récupérer les IDs des canonical et parents existants
  SELECT id INTO lait_id FROM canonical_foods WHERE canonical_name = 'lait';
  SELECT id INTO chataigne_id FROM canonical_foods WHERE canonical_name = 'châtaigne';
  SELECT id INTO sucre_id FROM canonical_foods WHERE canonical_name = 'sucre';
  SELECT id INTO parent_beurre_id FROM archetypes WHERE name = 'beurre' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_creme_id FROM archetypes WHERE name = 'crème' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_fromage_id FROM archetypes WHERE name = 'fromage' AND parent_archetype_id IS NULL;

  RAISE NOTICE 'IDs canonical: lait=%, châtaigne=%, sucre=%', lait_id, chataigne_id, sucre_id;
  RAISE NOTICE 'IDs parents: beurre=%, crème=%, fromage=%',
    parent_beurre_id, parent_creme_id, parent_fromage_id;

  -- =====================================================
  -- PARTIE 1 : BABEURRE (1 archetype)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 BABEURRE (1 archetype)';

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'babeurre') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('babeurre', lait_id, 'fermentation', 'ml', NULL)
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé: babeurre (id: %)', new_id;
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: babeurre';
  END IF;

  -- =====================================================
  -- PARTIE 2 : BEURRES + CARAMEL (7 enfants beurre + 1 caramel)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 BEURRES + CARAMEL (8 archetypes)';

  -- Enfants de "beurre"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre clarifié') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre clarifié', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'clarification', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre clarifié → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre de tourage') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre de tourage', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'préparation', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre de tourage → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre fondu') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre fondu', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'fonte', 'ml', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre fondu → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre froid') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre froid', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'réfrigération', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre froid → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre manié') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre manié', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'mélange avec farine', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre manié → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre mou') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre mou', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'température ambiante', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre mou → beurre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'beurre pour glaçage') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('beurre pour glaçage', (SELECT canonical_food_id FROM archetypes WHERE id = parent_beurre_id),
            'préparation', 'g', parent_beurre_id);
    RAISE NOTICE '  ✅ Créé enfant: beurre pour glaçage → beurre';
  END IF;

  -- Caramel beurre salé (standalone basé sur sucre, pas beurre)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'caramel beurre salé') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('caramel beurre salé', sucre_id, 'cuisson caramel', 'g', NULL)
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé standalone: caramel beurre salé (id: %)', new_id;
  END IF;

  -- =====================================================
  -- PARTIE 3 : CRÈMES (5 crèmes laitières + 1 crème marrons)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CRÈMES (6 archetypes)';

  -- Enfants de "crème"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'crème chiboust') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème chiboust', (SELECT canonical_food_id FROM archetypes WHERE id = parent_creme_id),
            'pâtisserie', 'g', parent_creme_id);
    RAISE NOTICE '  ✅ Créé enfant: crème chiboust → crème';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'crème fouettée') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème fouettée', (SELECT canonical_food_id FROM archetypes WHERE id = parent_creme_id),
            'fouettage', 'ml', parent_creme_id);
    RAISE NOTICE '  ✅ Créé enfant: crème fouettée → crème';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'crème marrons') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème marrons', chataigne_id, 'transformation marrons', 'g', NULL)
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé standalone: crème marrons (id: %)', new_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'crème pâtissière') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème pâtissière', (SELECT canonical_food_id FROM archetypes WHERE id = parent_creme_id),
            'cuisson pâtisserie', 'g', parent_creme_id)
    RETURNING id INTO parent_creme_patissiere_id;
    RAISE NOTICE '  ✅ Créé enfant: crème pâtissière → crème (id: %)', parent_creme_patissiere_id;
  ELSE
    SELECT id INTO parent_creme_patissiere_id FROM archetypes WHERE name = 'crème pâtissière';
    RAISE NOTICE '  ℹ️  Existe déjà: crème pâtissière (id: %)', parent_creme_patissiere_id;
  END IF;

  -- Crème pâtissière chocolat (enfant direct de crème, pas de crème pâtissière)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'crème pâtissière chocolat') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème pâtissière chocolat', (SELECT canonical_food_id FROM archetypes WHERE id = parent_creme_id),
            'cuisson pâtisserie chocolat', 'g', parent_creme_id);
    RAISE NOTICE '  ✅ Créé enfant: crème pâtissière chocolat → crème';
  END IF;

  -- Ganache ou crème (standalone spécial pour recettes)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'ganache ou crème') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('ganache ou crème', (SELECT canonical_food_id FROM archetypes WHERE id = parent_creme_id),
            'option multiple', 'ml', NULL);
    RAISE NOTICE '  ✅ Créé standalone: ganache ou crème';
  END IF;

  -- =====================================================
  -- PARTIE 4 : FROMAGES (4 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 FROMAGES (4 archetypes)';

  -- Enfants de "fromage"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fromage Minas') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fromage Minas', (SELECT canonical_food_id FROM archetypes WHERE id = parent_fromage_id),
            'fromage brésilien', 'g', parent_fromage_id);
    RAISE NOTICE '  ✅ Créé enfant: fromage Minas → fromage';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fromage de chèvre') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fromage de chèvre', (SELECT canonical_food_id FROM archetypes WHERE id = parent_fromage_id),
            'fromage chèvre générique', 'g', parent_fromage_id);
    RAISE NOTICE '  ✅ Créé enfant: fromage de chèvre → fromage';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fromage frais') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fromage frais', (SELECT canonical_food_id FROM archetypes WHERE id = parent_fromage_id),
            'fromage frais', 'g', parent_fromage_id);
    RAISE NOTICE '  ✅ Créé enfant: fromage frais → fromage';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'fromage râpé') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fromage râpé', (SELECT canonical_food_id FROM archetypes WHERE id = parent_fromage_id),
            'râpage', 'g', parent_fromage_id);
    RAISE NOTICE '  ✅ Créé enfant: fromage râpé → fromage';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 1.3 terminée : 21 ingrédients créés';
  RAISE NOTICE '   - 1 babeurre (standalone, base lait)';
  RAISE NOTICE '   - 7 beurres (enfants de beurre)';
  RAISE NOTICE '   - 1 caramel beurre salé (standalone, base sucre)';
  RAISE NOTICE '   - 5 crèmes laitières (enfants de crème)';
  RAISE NOTICE '   - 1 crème marrons (standalone, base châtaigne)';
  RAISE NOTICE '   - 4 fromages (enfants de fromage)';

END $$;

-- Vérification
SELECT 'NOUVEAUX ARCHETYPES BEURRE' as type,
  a.name,
  CASE WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone' ELSE 'enfant' END as niveau,
  p.name as parent_name
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
WHERE a.name IN ('babeurre', 'beurre clarifié', 'beurre de tourage', 'beurre fondu',
                 'beurre froid', 'beurre manié', 'beurre mou', 'beurre pour glaçage',
                 'caramel beurre salé')
ORDER BY a.parent_archetype_id NULLS FIRST, a.name;

SELECT 'NOUVEAUX ARCHETYPES CRÈME' as type,
  a.name,
  CASE WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone' ELSE 'enfant' END as niveau,
  p.name as parent_name
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
WHERE a.name IN ('crème chiboust', 'crème fouettée', 'crème marrons',
                 'crème pâtissière', 'crème pâtissière chocolat', 'ganache ou crème')
ORDER BY a.parent_archetype_id NULLS FIRST, a.name;

SELECT 'NOUVEAUX ARCHETYPES FROMAGE' as type,
  a.name,
  CASE WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone' ELSE 'enfant' END as niveau,
  p.name as parent_name
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
WHERE a.name IN ('fromage Minas', 'fromage de chèvre', 'fromage frais', 'fromage râpé')
ORDER BY a.parent_archetype_id NULLS FIRST, a.name;

-- Compter les archetypes par parent
SELECT
  p.name as parent_name,
  COUNT(a.id) as nb_enfants
FROM archetypes p
LEFT JOIN archetypes a ON a.parent_archetype_id = p.id
WHERE p.name IN ('beurre', 'crème', 'fromage')
GROUP BY p.id, p.name
ORDER BY p.name;
