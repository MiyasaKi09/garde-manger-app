-- Migration 003: Lier les archetypes enfants aux parents
-- Date: 2025-10-30
-- Description: Met à jour parent_archetype_id pour créer la hiérarchie

-- IMPORTANT: On ne lie que les archetypes SPÉCIFIQUES aux parents GÉNÉRIQUES
-- Exemple: "Lait entier UHT" → parent "lait", mais "lait" reste sans parent

DO $$
DECLARE
  parent_lait_id BIGINT;
  parent_creme_id BIGINT;
  parent_fromage_id BIGINT;
  parent_yaourt_id BIGINT;
  parent_beurre_id BIGINT;
  parent_jambon_id BIGINT;
  parent_lardon_id BIGINT;
  lait_canonical_id BIGINT;
  updated_count INT;
BEGIN
  -- Récupérer les IDs des parents
  SELECT id INTO parent_lait_id FROM archetypes WHERE name = 'lait' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_creme_id FROM archetypes WHERE name = 'crème' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_fromage_id FROM archetypes WHERE name = 'fromage' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_yaourt_id FROM archetypes WHERE name = 'yaourt' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_beurre_id FROM archetypes WHERE name = 'beurre' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_jambon_id FROM archetypes WHERE name = 'jambon' AND parent_archetype_id IS NULL;
  SELECT id INTO parent_lardon_id FROM archetypes WHERE name = 'lardon' AND parent_archetype_id IS NULL;

  SELECT id INTO lait_canonical_id FROM canonical_foods WHERE canonical_name = 'lait';

  RAISE NOTICE 'IDs des parents: lait=%, crème=%, fromage=%, yaourt=%, beurre=%, jambon=%, lardon=%',
    parent_lait_id, parent_creme_id, parent_fromage_id, parent_yaourt_id, parent_beurre_id, parent_jambon_id, parent_lardon_id;

  -- 1. LIER LES LAITS (sauf le parent lui-même)
  UPDATE archetypes
  SET parent_archetype_id = parent_lait_id
  WHERE canonical_food_id = lait_canonical_id
    AND (name ILIKE '%lait%' OR name IN (
      'Lait entier UHT', 'Lait demi-écrémé UHT', 'Lait écrémé UHT',
      'Lait entier frais', 'Lait demi-écrémé frais', 'Lait écrémé frais',
      'Lait concentré non sucré', 'Lait concentré sucré', 'Lait en poudre',
      'Lait sans lactose', 'Lait fermenté', 'Lait ribot', 'Kéfir'
    ))
    AND id != parent_lait_id
    AND parent_archetype_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Laits liés: %', updated_count;

  -- 2. LIER LES CRÈMES (sauf le parent lui-même)
  UPDATE archetypes
  SET parent_archetype_id = parent_creme_id
  WHERE canonical_food_id = lait_canonical_id
    AND (name ILIKE '%crème%' AND name NOT ILIKE '%crème de%' AND name NOT ILIKE 'cream cheese')
    AND id != parent_creme_id
    AND parent_archetype_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Crèmes liées: %', updated_count;

  -- 3. LIER LES FROMAGES (tous les fromages spécifiques)
  -- Liste des fromages connus
  UPDATE archetypes
  SET parent_archetype_id = parent_fromage_id
  WHERE canonical_food_id = lait_canonical_id
    AND (
      name IN (
        'Abondance', 'Beaufort', 'Bleu d''Auvergne', 'Brie', 'Brillat-Savarin',
        'Camembert', 'Cantal', 'Chaource', 'Cheddar', 'Comté',
        'Cottage cheese', 'Coulommiers', 'Cream cheese',
        'Crottin de chèvre', 'Edam', 'Emmental', 'Époisses', 'Explorateur',
        'Faisselle', 'feta', 'Fontina', 'Fourme d''Ambert',
        'Fromage à tartiner nature', 'fromage blanc',
        'Fromage blanc 0%', 'Fromage blanc 20%', 'Fromage blanc 40%',
        'Gorgonzola', 'Gouda', 'Gruyère', 'Livarot', 'Manchego',
        'Maroilles', 'Mascarpone', 'Mimolette', 'Mont d''Or', 'Morbier',
        'mozzarella', 'Munster', 'Neufchâtel', 'Ossau-Iraty',
        'Parmesan', 'Pecorino', 'Pélardon', 'Petit-suisse', 'Picodon',
        'Pont-l''Évêque', 'Pouligny-Saint-Pierre', 'Provolone',
        'Raclette', 'Reblochon', 'Ricotta', 'Rocamadour', 'Roquefort',
        'Saint-Marcellin', 'Saint-Nectaire', 'Sainte-Maure',
        'Tomme de Savoie', 'Vacherin', 'Valençay'
      )
      OR name ILIKE '%fromage%'
    )
    AND id != parent_fromage_id
    AND parent_archetype_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Fromages liés: %', updated_count;

  -- 4. LIER LES YAOURTS (sauf le parent lui-même)
  UPDATE archetypes
  SET parent_archetype_id = parent_yaourt_id
  WHERE canonical_food_id = lait_canonical_id
    AND name ILIKE '%yaourt%'
    AND id != parent_yaourt_id
    AND parent_archetype_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Yaourts liés: %', updated_count;

  -- 5. LIER LES BEURRES (sauf le parent lui-même)
  UPDATE archetypes
  SET parent_archetype_id = parent_beurre_id
  WHERE canonical_food_id = lait_canonical_id
    AND name ILIKE '%beurre%'
    AND id != parent_beurre_id
    AND parent_archetype_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Beurres liés: %', updated_count;

  -- 6. TRAITER LES CAS SPÉCIAUX: Chèvre
  -- Les fromages de chèvre restent orphelins pour l'instant
  -- (ils seront liés à un cultivar "lait de chèvre" plus tard)
  RAISE NOTICE 'ℹ️  Fromages de chèvre: restent orphelins (seront liés au cultivar lait de chèvre)';

END $$;

-- Vérification
SELECT
  'PARENTS' as type,
  name,
  id,
  parent_archetype_id,
  (SELECT COUNT(*) FROM archetypes WHERE parent_archetype_id = a.id) as nb_enfants
FROM archetypes a
WHERE name IN ('lait', 'crème', 'fromage', 'yaourt', 'beurre')
  AND parent_archetype_id IS NULL
ORDER BY name;

-- Voir quelques exemples d'enfants
SELECT
  'ENFANTS - LAIT' as type,
  name,
  id,
  parent_archetype_id
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'lait' AND parent_archetype_id IS NULL)
LIMIT 5;

SELECT
  'ENFANTS - CRÈME' as type,
  name,
  id,
  parent_archetype_id
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'crème' AND parent_archetype_id IS NULL)
LIMIT 5;

SELECT
  'ENFANTS - FROMAGE' as type,
  name,
  id,
  parent_archetype_id
FROM archetypes
WHERE parent_archetype_id = (SELECT id FROM archetypes WHERE name = 'fromage' AND parent_archetype_id IS NULL)
LIMIT 5;
