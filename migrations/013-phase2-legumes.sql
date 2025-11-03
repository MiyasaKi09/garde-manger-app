-- Migration 013: Phase 2.5 - Légumes (6 ingrédients)
-- Date: 2025-10-30
-- Description: Crée les légumes manquants avec hiérarchie

DO $$
DECLARE
  -- IDs récupérés
  poireau_cf_id BIGINT;
  courgette_cf_id BIGINT;
  blette_cf_id BIGINT;
  laitue_cf_id BIGINT;
  legumes_generique_id BIGINT;
  parent_poireau_id BIGINT;
  new_id BIGINT;
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   PHASE 2.5 : LÉGUMES (6 ingrédients)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- Vérifier/créer les canonical foods nécessaires
  SELECT id INTO poireau_cf_id FROM canonical_foods WHERE canonical_name = 'poireau';
  IF poireau_cf_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('poireau', 'g')
    RETURNING id INTO poireau_cf_id;
    RAISE NOTICE 'Créé canonical: poireau (id: %)', poireau_cf_id;
  END IF;

  SELECT id INTO courgette_cf_id FROM canonical_foods WHERE canonical_name = 'courgette';
  IF courgette_cf_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('courgette', 'g')
    RETURNING id INTO courgette_cf_id;
    RAISE NOTICE 'Créé canonical: courgette (id: %)', courgette_cf_id;
  END IF;

  SELECT id INTO blette_cf_id FROM canonical_foods WHERE canonical_name = 'blette';
  IF blette_cf_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('blette', 'g')
    RETURNING id INTO blette_cf_id;
    RAISE NOTICE 'Créé canonical: blette (id: %)', blette_cf_id;
  END IF;

  SELECT id INTO laitue_cf_id FROM canonical_foods WHERE canonical_name = 'laitue';
  IF laitue_cf_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('laitue', 'g')
    RETURNING id INTO laitue_cf_id;
    RAISE NOTICE 'Créé canonical: laitue (id: %)', laitue_cf_id;
  END IF;

  -- Créer un canonical "légume" générique si nécessaire
  SELECT id INTO legumes_generique_id FROM canonical_foods WHERE canonical_name = 'légume';
  IF legumes_generique_id IS NULL THEN
    INSERT INTO canonical_foods (canonical_name, primary_unit)
    VALUES ('légume', 'g')
    RETURNING id INTO legumes_generique_id;
    RAISE NOTICE 'Créé canonical: légume (id: %)', legumes_generique_id;
  END IF;

  RAISE NOTICE 'IDs canonical: poireau=%, courgette=%, blette=%, laitue=%, légume=%',
    poireau_cf_id, courgette_cf_id, blette_cf_id, laitue_cf_id, legumes_generique_id;

  -- =====================================================
  -- PARTIE 1 : POIREAUX (1 parent + 1 enfant)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 POIREAUX (2 archetypes)';

  -- Parent "poireaux" (pluriel, générique)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'poireaux') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('poireaux', poireau_cf_id, 'poireaux entiers', 'g', NULL)
    RETURNING id INTO parent_poireau_id;
    RAISE NOTICE '  ✅ Créé parent: poireaux (id: %)', parent_poireau_id;
  ELSE
    SELECT id INTO parent_poireau_id FROM archetypes WHERE name = 'poireaux';
    RAISE NOTICE '  ℹ️  Existe déjà: poireaux (id: %)', parent_poireau_id;
  END IF;

  -- "Blanc de poireau" (partie spécifique)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'blanc de poireau') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('blanc de poireau', poireau_cf_id, 'partie blanche', 'g', parent_poireau_id);
    RAISE NOTICE '  ✅ Créé enfant: blanc de poireau → poireaux';
  END IF;

  -- =====================================================
  -- PARTIE 2 : AUTRES LÉGUMES (3 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 AUTRES LÉGUMES (3 archetypes)';

  -- Courgettes (pluriel car souvent plusieurs)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'courgettes') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('courgettes', courgette_cf_id, 'courgettes', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: courgettes';
  END IF;

  -- Blettes
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'blettes') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('blettes', blette_cf_id, 'blettes', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: blettes';
  END IF;

  -- Laitue romaine (était mal classée dans produits laitiers)
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'laitue romaine') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('laitue romaine', laitue_cf_id, 'laitue romaine', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: laitue romaine';
  END IF;

  -- =====================================================
  -- PARTIE 3 : LÉGUMES GÉNÉRIQUES (1 archetype)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '📦 LÉGUMES GÉNÉRIQUES (1 archetype)';

  -- Légumes variés cuits
  IF NOT EXISTS (SELECT 1 FROM archetypes WHERE name = 'légumes variés cuits') THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('légumes variés cuits', legumes_generique_id, 'mélange légumes cuits', 'g', NULL);
    RAISE NOTICE '  ✅ Créé: légumes variés cuits';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Phase 2.5 terminée : 6 ingrédients créés';
  RAISE NOTICE '   - 1 parent poireaux + 1 enfant (blanc de poireau)';
  RAISE NOTICE '   - 3 légumes standalone (courgettes, blettes, laitue romaine)';
  RAISE NOTICE '   - 1 mélange générique (légumes variés cuits)';

END $$;

-- Vérification
SELECT 'NOUVEAUX CANONICAL LÉGUMES' as type,
  id, canonical_name
FROM canonical_foods
WHERE canonical_name IN ('poireau', 'courgette', 'blette', 'laitue', 'légume')
ORDER BY canonical_name;

SELECT 'NOUVEAUX ARCHETYPES LÉGUMES' as type,
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
  'poireaux', 'blanc de poireau', 'courgettes', 'blettes',
  'laitue romaine', 'légumes variés cuits'
)
ORDER BY
  CASE
    WHEN a.name = 'poireaux' THEN 1
    WHEN a.parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'poireaux') THEN 2
    ELSE 3
  END,
  a.name;

-- Compter les enfants
SELECT
  'HIÉRARCHIE POIREAUX' as info,
  COUNT(*) as nb_enfants
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'poireaux');
