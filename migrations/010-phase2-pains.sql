-- Migration 010: Phase 2.2 - Pains (12 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les types de pains manquants avec hiérarchie

DO $$
DECLARE
  -- IDs récupérés
  ble_id BIGINT;
  epices_id BIGINT;
  parent_pain_id BIGINT;
  pain_mie_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 2.2 : PAINS (12 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Récupérer les IDs existants
  SELECT id INTO ble_id FROM canonical_foods WHERE canonical_name = 'blé';
  SELECT id INTO parent_pain_id FROM archetypes WHERE name = 'pain' AND parent_archetype_id IS NULL;

  -- Vérifier si un canonical "mélange d'épices" ou similaire existe
  SELECT id INTO epices_id FROM canonical_foods WHERE canonical_name ILIKE '%épice%' OR canonical_name ILIKE '%spice%' LIMIT 1;
  IF epices_id IS NULL THEN
    -- Créer un canonical générique pour épices si nécessaire
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('épices', 'g')
    RETURNING id INTO epices_id;
    RAISE NOTICE 'Créé canonical: épices (id: %)', epices_id;
  END IF;

  RAISE NOTICE 'IDs existants: blé=%, pain parent=%, épices=%', ble_id, parent_pain_id, epices_id;

  -- =====================================================
  -- PARTIE 1 : PAINS BLANCS (5 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PAINS BLANCS (5 archetypes)';

  -- Baguette
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'baguette') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('baguette', ble_id, 'pain français long', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: baguette → pain';
  END IF;

  -- Pain de campagne
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pain de campagne') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pain de campagne', ble_id, 'pain rustique', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: pain de campagne → pain';
  END IF;

  -- Pain de mie
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pain de mie') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pain de mie', ble_id, 'pain tranché', 'g', parent_pain_id)
    RETURNING id INTO pain_mie_id;
    RAISE NOTICE '  ✅ Créé enfant: pain de mie → pain (id: %)', pain_mie_id;
  ELSE
    SELECT id INTO pain_mie_id FROM archetypes WHERE name = 'pain de mie';
    RAISE NOTICE '  ℹ️  Existe déjà: pain de mie (id: %)', pain_mie_id;
  END IF;

  -- Mie de pain / mie pain (synonymes de pain de mie)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'mie de pain') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('mie de pain', ble_id, 'pain tranché', 'g', pain_mie_id);
    RAISE NOTICE '  ✅ Créé enfant: mie de pain → pain de mie';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'mie pain') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('mie pain', ble_id, 'pain tranché', 'g', pain_mie_id);
    RAISE NOTICE '  ✅ Créé enfant: mie pain → pain de mie';
  END IF;

  -- =====================================================
  -- PARTIE 2 : PAINS SPÉCIAUX (3 enfants)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 PAINS SPÉCIAUX (3 archetypes)';

  -- Brioche
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'brioche') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('brioche', ble_id, 'pain enrichi beurre', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: brioche → pain';
  END IF;

  -- Pains burger
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pains burger') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pains burger', ble_id, 'pain rond burger', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: pains burger → pain';
  END IF;

  -- Pain d'épices
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pain d''épices') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pain d''épices', ble_id, 'pain sucré épicé', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: pain d''épices → pain';
  END IF;

  -- =====================================================
  -- PARTIE 3 : ÉTATS ET PRÉPARATIONS (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 ÉTATS ET PRÉPARATIONS (2 archetypes)';

  -- Pain rassis
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pain rassis') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pain rassis', ble_id, 'pain séché', 'g', parent_pain_id);
    RAISE NOTICE '  ✅ Créé enfant: pain rassis → pain';
  END IF;

  -- Pâte à pain
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'pâte à pain') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('pâte à pain', ble_id, 'pâte avant cuisson', 'g', NULL);
    RAISE NOTICE '  ✅ Créé standalone: pâte à pain (préparation)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 2.2 terminée : 10 ingrédients créés';
  RAISE NOTICE '   - 5 pains blancs (baguette, pain de campagne, pain de mie + 2 synonymes)';
  RAISE NOTICE '   - 3 pains spéciaux (brioche, pains burger, pain d''épices)';
  RAISE NOTICE '   - 2 états/préparations (pain rassis, pâte à pain)';

END $$;

-- Vérification
SELECT 'NOUVEAUX ARCHETYPES PAINS' as type,
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
  'baguette', 'pain de campagne', 'pain de mie', 'mie de pain', 'mie pain',
  'brioche', 'pains burger', 'pain d''épices',
  'pain rassis', 'pâte à pain'
)
ORDER BY
  CASE
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'pain' AND parent_archetype_id IS NULL) THEN 1
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'pain de mie') THEN 2
    WHEN a.parent_archetype_id IS NULL THEN 3
    ELSE 4
  END,
  a.name;

-- Compter les enfants du parent "pain"
SELECT
  'HIÉRARCHIE PAIN' as info,
  COUNT(*) as nb_total_enfants
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'pain' AND parent_archetype_id IS NULL);
