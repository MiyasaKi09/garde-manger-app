-- Migration 002: Créer les archetypes PARENT manquants (CORRIGÉ)
-- Date: 2025-10-30
-- Description: Crée les archetypes parent génériques pour permettre la flexibilité dans les recettes

-- ÉTAPE 1: Synchroniser la séquence avec les données existantes
DO $$
DECLARE
  max_id BIGINT;
BEGIN
  -- Trouver l'ID maximum actuel
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM archetypes;

  -- Mettre à jour la séquence pour qu'elle commence après le max
  EXECUTE format('SELECT setval(''archetypes_id_seq'', %s, true)', max_id);

  RAISE NOTICE 'Séquence synchronisée à %', max_id;
END $$;

-- ÉTAPE 2: Créer les parents manquants
DO $$
DECLARE
  lait_id BIGINT;
  new_lait_id BIGINT;
  new_creme_id BIGINT;
  new_fromage_id BIGINT;
BEGIN
  SELECT id INTO lait_id FROM canonical_foods WHERE canonical_name = 'lait';

  -- Vérifier si "lait" existe déjà
  SELECT id INTO new_lait_id FROM archetypes WHERE name = 'lait' AND canonical_food_id = lait_id;

  IF new_lait_id IS NULL THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('lait', lait_id, 'lait', 'ml', NULL)
    RETURNING id INTO new_lait_id;
    RAISE NOTICE 'Créé: lait (id: %)', new_lait_id;
  ELSE
    RAISE NOTICE 'Existe déjà: lait (id: %)', new_lait_id;
  END IF;

  -- Vérifier si "crème" existe déjà
  SELECT id INTO new_creme_id FROM archetypes WHERE name = 'crème' AND canonical_food_id = lait_id;

  IF new_creme_id IS NULL THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('crème', lait_id, 'crème', 'ml', NULL)
    RETURNING id INTO new_creme_id;
    RAISE NOTICE 'Créé: crème (id: %)', new_creme_id;
  ELSE
    RAISE NOTICE 'Existe déjà: crème (id: %)', new_creme_id;
  END IF;

  -- Vérifier si "fromage" existe déjà
  SELECT id INTO new_fromage_id FROM archetypes WHERE name = 'fromage' AND canonical_food_id = lait_id;

  IF new_fromage_id IS NULL THEN
    INSERT INTO archetypes (name, canonical_food_id, process, primary_unit, parent_archetype_id)
    VALUES ('fromage', lait_id, 'fromage', 'g', NULL)
    RETURNING id INTO new_fromage_id;
    RAISE NOTICE 'Créé: fromage (id: %)', new_fromage_id;
  ELSE
    RAISE NOTICE 'Existe déjà: fromage (id: %)', new_fromage_id;
  END IF;

END $$;

-- ÉTAPE 3: Vérification
SELECT
  id,
  name,
  canonical_food_id,
  parent_archetype_id,
  primary_unit
FROM archetypes
WHERE name IN ('lait', 'crème', 'fromage', 'yaourt', 'beurre', 'jambon', 'farine', 'pain')
ORDER BY name;
