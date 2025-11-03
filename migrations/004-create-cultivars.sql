-- Migration 004: Créer les cultivars essentiels
-- Date: 2025-10-30
-- Description: Crée les cultivars pour les vraies différences biologiques/géographiques

DO $$
DECLARE
  lait_id BIGINT;
  cabillaud_id BIGINT;
  boeuf_id BIGINT;
  new_cultivar_id BIGINT;
BEGIN
  -- Récupérer les IDs des canonical_foods
  SELECT id INTO lait_id FROM canonical_foods WHERE canonical_name = 'lait';
  SELECT id INTO cabillaud_id FROM canonical_foods WHERE canonical_name = 'cabillaud';
  SELECT id INTO boeuf_id FROM canonical_foods WHERE canonical_name = 'bœuf';

  RAISE NOTICE 'IDs canonical: lait=%, cabillaud=%, boeuf=%', lait_id, cabillaud_id, boeuf_id;

  -- 1. LAIT DE CHÈVRE (goût différent, fromages spécifiques)
  IF NOT EXISTS (SELECT 1 FROM cultivars WHERE cultivar_name = 'lait de chèvre') THEN
    INSERT INTO cultivars (cultivar_name, canonical_food_id, notes)
    VALUES (
      'lait de chèvre',
      lait_id,
      'Lait de chèvre - Goût différent du lait de vache, utilisé pour fromages spécifiques (bûches, crottins, etc.)'
    )
    RETURNING id INTO new_cultivar_id;
    RAISE NOTICE '✅ Créé: lait de chèvre (id: %)', new_cultivar_id;
  ELSE
    SELECT id INTO new_cultivar_id FROM cultivars WHERE cultivar_name = 'lait de chèvre';
    RAISE NOTICE 'ℹ️  Existe déjà: lait de chèvre (id: %)', new_cultivar_id;
  END IF;

  -- 2. LAIT DE BREBIS (pour fromages spécifiques)
  IF NOT EXISTS (SELECT 1 FROM cultivars WHERE cultivar_name = 'lait de brebis') THEN
    INSERT INTO cultivars (cultivar_name, canonical_food_id, notes)
    VALUES (
      'lait de brebis',
      lait_id,
      'Lait de brebis - Utilisé pour fromages spécifiques comme Roquefort, Ossau-Iraty, Pélardon'
    )
    RETURNING id INTO new_cultivar_id;
    RAISE NOTICE '✅ Créé: lait de brebis (id: %)', new_cultivar_id;
  ELSE
    SELECT id INTO new_cultivar_id FROM cultivars WHERE cultivar_name = 'lait de brebis';
    RAISE NOTICE 'ℹ️  Existe déjà: lait de brebis (id: %)', new_cultivar_id;
  END IF;

  -- 3. MORUE (cabillaud salé et séché - transformation importante)
  IF cabillaud_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM cultivars WHERE cultivar_name = 'morue') THEN
      INSERT INTO cultivars (cultivar_name, canonical_food_id, notes)
      VALUES (
        'morue',
        cabillaud_id,
        'Morue - Cabillaud salé et séché. Nécessite dessalage avant utilisation. Goût et texture différents du cabillaud frais.'
      )
      RETURNING id INTO new_cultivar_id;
      RAISE NOTICE '✅ Créé: morue (id: %)', new_cultivar_id;
    ELSE
      SELECT id INTO new_cultivar_id FROM cultivars WHERE cultivar_name = 'morue';
      RAISE NOTICE 'ℹ️  Existe déjà: morue (id: %)', new_cultivar_id;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  canonical "cabillaud" non trouvé, skip morue';
  END IF;

  -- OPTIONNEL: BŒUF WAGYU (si vraiment nécessaire)
  -- Décommenter si besoin
  /*
  IF boeuf_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM cultivars WHERE cultivar_name = 'bœuf wagyu') THEN
      INSERT INTO cultivars (cultivar_name, canonical_food_id, notes)
      VALUES (
        'bœuf wagyu',
        boeuf_id,
        'Bœuf wagyu - Race japonaise avec persillage unique. Texture et goût très différents.'
      );
      RAISE NOTICE '✅ Créé: bœuf wagyu';
    END IF;
  END IF;
  */

END $$;

-- Vérification
SELECT
  c.id,
  c.cultivar_name,
  c.canonical_food_id,
  cf.canonical_name as canonical_source,
  c.notes
FROM cultivars c
JOIN canonical_foods cf ON c.canonical_food_id = cf.id
ORDER BY c.cultivar_name;

-- Compter les archetypes qui seront liés à ces cultivars
SELECT
  'Fromages de chèvre à lier' as info,
  COUNT(*) as nb
FROM archetypes
WHERE canonical_food_id = (SELECT id FROM canonical_foods WHERE canonical_name = 'lait')
  AND (name ILIKE '%chèvre%' OR name ILIKE '%chevre%')
  AND parent_archetype_id IS NULL;

SELECT
  'Fromages de brebis à lier' as info,
  COUNT(*) as nb
FROM archetypes
WHERE canonical_food_id = (SELECT id FROM canonical_foods WHERE canonical_name = 'lait')
  AND name IN ('Roquefort', 'Ossau-Iraty', 'Pélardon');
