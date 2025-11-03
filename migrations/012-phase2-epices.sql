-- Migration 012: Phase 2.4 - Épices (10 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les mélanges d'épices manquants

DO $$
DECLARE
  -- IDs récupérés
  epices_generique_id BIGINT;
  parent_paprika_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 2.4 : ÉPICES (10 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Vérifier si un canonical "épices" existe
  SELECT id INTO epices_generique_id FROM canonical_foods WHERE canonical_name = 'épices';
  IF epices_generique_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('épices', 'g')
    RETURNING id INTO epices_generique_id;
    RAISE NOTICE 'Créé canonical: épices (id: %)', epices_generique_id;
  ELSE
    RAISE NOTICE 'ID canonical épices: %', epices_generique_id;
  END IF;

  -- =====================================================
  -- PARTIE 1 : PAPRIKA (1 parent + 2 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PAPRIKA (3 archetypes)';

  -- Parent "paprika"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'paprika' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('paprika', epices_generique_id, 'poudre poivron', 'g', NULL)
    RETURNING id INTO parent_paprika_id;
    RAISE NOTICE '  ✅ Créé parent: paprika (id: %)', parent_paprika_id;
  ELSE
    SELECT id INTO parent_paprika_id FROM archetypes WHERE name = 'paprika' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe déjà: paprika (id: %)', parent_paprika_id;
  END IF;

  -- Paprika doux
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'paprika doux') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('paprika doux', epices_generique_id, 'paprika doux', 'g', parent_paprika_id);
    RAISE NOTICE '  ✅ Créé enfant: paprika doux → paprika';
  END IF;

  -- Paprika fumé
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'paprika fumé') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('paprika fumé', epices_generique_id, 'paprika fumé', 'g', parent_paprika_id);
    RAISE NOTICE '  ✅ Créé enfant: paprika fumé → paprika';
  END IF;

  -- =====================================================
  -- PARTIE 2 : MÉLANGES D'ÉPICES (7 standalone)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 MÉLANGES D''ÉPICES (7 archetypes)';

  -- Berbéré (mélange éthiopien)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'berbéré épices') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('berbéré épices', epices_generique_id, 'mélange éthiopien', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: berbéré épices';
  END IF;

  -- Cinq épices (mélange chinois)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'cinq épices') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('cinq épices', epices_generique_id, 'mélange chinois', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: cinq épices';
  END IF;

  -- Curry (mélange indien/asiatique)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'curry') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('curry', epices_generique_id, 'mélange curry', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: curry';
  END IF;

  -- Garam masala (mélange indien)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'garam masala') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('garam masala', epices_generique_id, 'mélange indien', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: garam masala';
  END IF;

  -- Quatre-épices (mélange français)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'quatre-épices') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('quatre-épices', epices_generique_id, 'mélange français', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: quatre-épices';
  END IF;

  -- Épices speculoos (mélange néerlandais/belge)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'épices speculoos') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('épices speculoos', epices_generique_id, 'mélange speculoos', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: épices speculoos';
  END IF;

  -- Épices pain d'épices (pour cohérence, même si listé ailleurs)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'épices pain épices') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('épices pain épices', epices_generique_id, 'mélange pain d''épices', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: épices pain épices';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 2.4 terminée : 10 ingrédients créés';
  RAISE NOTICE '   - 1 parent paprika + 2 enfants (doux, fumé)';
  RAISE NOTICE '   - 7 mélanges d''épices standalone';

END $$;

-- Vérification
SELECT 'NOUVEAUX ARCHETYPES ÉPICES' as type,
  a.id,
  a.name,
  CASE
    WHEN a.parent_archetype_id IS NULL THEN 'parent/standalone'
    ELSE 'enfant'
  END as niveau,
  p.name as parent_name
FROM archetypes a
LEFT JOIN archetypes p ON a.parent_archetype_id = p.id
WHERE a.name IN (
  'paprika', 'paprika doux', 'paprika fumé',
  'berbéré épices', 'cinq épices', 'curry', 'garam masala',
  'quatre-épices', 'épices speculoos', 'épices pain épices'
)
ORDER BY
  CASE
    WHEN a.name = 'paprika' AND a.parent_archetype_id IS NULL THEN 1
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'paprika' AND parent_archetype_id IS NULL) THEN 2
    ELSE 3
  END,
  a.name;

-- Compter les enfants du paprika
SELECT
  'HIÉRARCHIE PAPRIKA' as info,
  COUNT(*) as nb_enfants
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'paprika' AND parent_archetype_id IS NULL);
