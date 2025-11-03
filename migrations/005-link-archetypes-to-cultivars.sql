-- Migration 005: Lier les archetypes aux cultivars
-- Date: 2025-10-30
-- Description: Lie les archetypes spécifiques (fromages de chèvre, de brebis) aux cultivars appropriés

DO $$
DECLARE
  cultivar_chevre_id BIGINT;
  cultivar_brebis_id BIGINT;
  lait_id BIGINT;
  updated_count INT;
BEGIN
  -- Récupérer les IDs des cultivars
  SELECT id INTO cultivar_chevre_id FROM cultivars WHERE cultivar_name = 'lait de chèvre';
  SELECT id INTO cultivar_brebis_id FROM cultivars WHERE cultivar_name = 'lait de brebis';
  SELECT id INTO lait_id FROM canonical_foods WHERE canonical_name = 'lait';

  RAISE NOTICE 'IDs cultivars: chèvre=%, brebis=%', cultivar_chevre_id, cultivar_brebis_id;

  -- 1. LIER LES FROMAGES DE CHÈVRE au cultivar "lait de chèvre"
  -- On retire le canonical_food_id et on met le cultivar_id à la place
  UPDATE archetypes
  SET
    cultivar_id = cultivar_chevre_id,
    canonical_food_id = NULL
  WHERE canonical_food_id = lait_id
    AND (name ILIKE '%chèvre%' OR name ILIKE '%chevre%')
    AND parent_archetype_id IS NULL
    AND cultivar_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fromages de chèvre liés au cultivar: %', updated_count;

  -- 2. LIER LES FROMAGES DE BREBIS au cultivar "lait de brebis"
  UPDATE archetypes
  SET
    cultivar_id = cultivar_brebis_id,
    canonical_food_id = NULL
  WHERE canonical_food_id = lait_id
    AND name IN ('Roquefort', 'Ossau-Iraty', 'Pélardon')
    AND cultivar_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fromages de brebis liés au cultivar: %', updated_count;

  -- NOTE: La morue sera créée dans la prochaine étape (avec les 385 ingrédients manquants)
  -- car il n'y a pas encore d'archetype "morue" ou "brandade de morue" dans la DB

END $$;

-- Vérification: Afficher tous les archetypes liés aux cultivars
SELECT
  'ARCHETYPES LIÉS AUX CULTIVARS' as info,
  a.id,
  a.name as archetype_name,
  c.cultivar_name,
  cf.canonical_name as canonical_source
FROM archetypes a
JOIN cultivars c ON a.cultivar_id = c.id
JOIN canonical_foods cf ON c.canonical_food_id = cf.id
ORDER BY c.cultivar_name, a.name;

-- Compter
SELECT
  c.cultivar_name,
  COUNT(a.id) as nb_archetypes
FROM cultivars c
LEFT JOIN archetypes a ON a.cultivar_id = c.id
GROUP BY c.id, c.cultivar_name
ORDER BY c.cultivar_name;
