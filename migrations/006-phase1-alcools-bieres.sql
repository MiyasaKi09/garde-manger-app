-- Migration 006: Phase 1 - Alcools et Bières (14 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les alcools et bières manquants avec hiérarchie

DO $$
DECLARE
  -- IDs récupérés
  new_id BIGINT;
  parent_biere_id BIGINT;
  parent_cidre_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 1.1 : ALCOOLS ET BIÈRES (14 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- PARTIE 1 : ALCOOLS (Canonical Foods)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ALCOOLS (8 canonical foods)';

  -- Grand Marnier
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'Grand Marnier') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('Grand Marnier', NULL, 'ml')
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé: Grand Marnier (canonical id: %)', new_id;
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: Grand Marnier';
  END IF;

  -- Marsala
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'Marsala') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('Marsala', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: Marsala';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: Marsala';
  END IF;

  -- Amaretto
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'amaretto') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('amaretto', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: amaretto';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: amaretto';
  END IF;

  -- Calvados
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'calvados') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('calvados', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: calvados';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: calvados';
  END IF;

  -- Kirsch
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'kirsch') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('kirsch', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: kirsch';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: kirsch';
  END IF;

  -- Porto
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'porto') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('porto', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: porto';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: porto';
  END IF;

  -- Rhum (parent générique)
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'rhum') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('rhum', NULL, 'ml');
    RAISE NOTICE '  ✅ Créé: rhum';
  ELSE
    RAISE NOTICE '  ℹ️  Existe déjà: rhum';
  END IF;

  -- =====================================================
  -- PARTIE 2 : BIÈRES (avec hiérarchie parent/enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 BIÈRES (4 archetypes avec hiérarchie)';

  -- Créer le canonical "bière" si nécessaire
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'bière') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('bière', NULL, 'ml')
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé canonical: bière (id: %)', new_id;
  ELSE
    SELECT id INTO new_id FROM canonical_foods WHERE canonical_name = 'bière';
    RAISE NOTICE '  ℹ️  Existe déjà canonical: bière (id: %)', new_id;
  END IF;

  -- Créer l'archetype PARENT "bière"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bière' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bière', new_id, 'fermentation', 'ml', NULL)
    RETURNING id INTO parent_biere_id;
    RAISE NOTICE '  ✅ Créé archetype parent: bière (id: %)', parent_biere_id;
  ELSE
    SELECT id INTO parent_biere_id FROM archetypes WHERE name = 'bière' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe déjà archetype: bière (id: %)', parent_biere_id;
  END IF;

  -- Créer les ENFANTS
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bière blonde') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bière blonde', new_id, 'fermentation', 'ml', parent_biere_id);
    RAISE NOTICE '  ✅ Créé enfant: bière blonde → bière';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bière ambrée') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bière ambrée', new_id, 'fermentation', 'ml', parent_biere_id);
    RAISE NOTICE '  ✅ Créé enfant: bière ambrée → bière';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'bière brune') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('bière brune', new_id, 'fermentation', 'ml', parent_biere_id);
    RAISE NOTICE '  ✅ Créé enfant: bière brune → bière';
  END IF;

  -- =====================================================
  -- PARTIE 3 : CIDRES (avec hiérarchie parent/enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 CIDRES (2 archetypes avec hiérarchie)';

  -- Créer le canonical "cidre" si nécessaire
  IF NOT EXISTS (SELECT 1 FROM canonical_foods WHERE canonical_name = 'cidre') THEN
    INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
    VALUES ('cidre', NULL, 'ml')
    RETURNING id INTO new_id;
    RAISE NOTICE '  ✅ Créé canonical: cidre (id: %)', new_id;
  ELSE
    SELECT id INTO new_id FROM canonical_foods WHERE canonical_name = 'cidre';
    RAISE NOTICE '  ℹ️  Existe déjà canonical: cidre (id: %)', new_id;
  END IF;

  -- Créer l'archetype PARENT "cidre"
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'cidre' AND parent_archetype_id IS NULL) THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('cidre', new_id, 'fermentation', 'ml', NULL)
    RETURNING id INTO parent_cidre_id;
    RAISE NOTICE '  ✅ Créé archetype parent: cidre (id: %)', parent_cidre_id;
  ELSE
    SELECT id INTO parent_cidre_id FROM archetypes WHERE name = 'cidre' AND parent_archetype_id IS NULL;
    RAISE NOTICE '  ℹ️  Existe déjà archetype: cidre (id: %)', parent_cidre_id;
  END IF;

  -- Créer l'ENFANT
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'cidre brut') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('cidre brut', new_id, 'fermentation', 'ml', parent_cidre_id);
    RAISE NOTICE '  ✅ Créé enfant: cidre brut → cidre';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 1.1 terminée : 14 ingrédients créés';
  RAISE NOTICE '   - 7 alcools (canonical)';
  RAISE NOTICE '   - 4 bières (1 parent + 3 enfants)';
  RAISE NOTICE '   - 2 cidres (1 parent + 1 enfant)';

END $$;

-- Vérification
SELECT 'NOUVEAUX CANONICAL FOODS' as type, canonical_name
FROM canonical_foods
WHERE canonical_name IN ('Grand Marnier', 'Marsala', 'amaretto', 'calvados', 'kirsch', 'porto', 'rhum', 'bière', 'cidre')
ORDER BY canonical_name;

SELECT 'NOUVEAUX ARCHETYPES BIÈRE' as type, name, parent_archetype_id
FROM archetypes
WHERE name ILIKE '%bière%' OR name ILIKE '%biere%'
ORDER BY parent_archetype_id NULLS FIRST, name;

SELECT 'NOUVEAUX ARCHETYPES CIDRE' as type, name, parent_archetype_id
FROM archetypes
WHERE name ILIKE '%cidre%'
ORDER BY parent_archetype_id NULLS FIRST, name;
