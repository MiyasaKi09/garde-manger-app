-- Rollback du profil exact des pâtes à foncer (20260917112000).
--
-- Il remet les deux profils primaires sur le proxy répudié : `23481:…`,
-- « Tarte normande aux pommes », 313 kcal, confiance C — l'état dans lequel la
-- base des seules migrations les portait avant la réparation.
--
-- CE QU'IL FAUT SAVOIR AVANT DE LE JOUER, ET QUI N'EST PAS UN DÉTAIL. Il
-- restaure une valeur que le dépôt a explicitement écartée : la pâte brisée
-- redevient une tarte finie, 25 % trop basse en énergie sur l'ingrédient qui
-- porte la moitié d'une quiche. Et le gardien opérationnel de la RPC exige la
-- confiance A ou B : à confiance C, onze recettes cessent d'être servies
-- (DESS-011, FR-005, FR-029, FR-036, FR-039, JUM-074, REAL-088, VAR-035,
-- VAR-037, VAR-038, VAR-041) et `check-corpus-parity` reste vert — il compte
-- les recettes du corpus, pas celles que la RPC qualifie. C'est donc un retour
-- en arrière qui se voit dans le catalogue servi et nulle part ailleurs.
--
-- Il ne distingue pas ce que la migration a écrit de ce qu'un chargement
-- postérieur aurait écrit : la base ne garde pas cette trace. Sur une base
-- passée par `scripts/data/out/recipe-food-load.sql`, où les deux profils sont
-- justes sans que 20260917112000 y soit pour rien, ce rollback les dégrade
-- quand même. Elles se rechargent depuis le catalogue versionné.

-- ── 1. La pâte brisée ───────────────────────────────────────────────────────
WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate brisee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23414:pate brisee crue'
), valeurs(nutrient_code, amount, unit) AS (
  VALUES
    ('energy_kcal', 313::numeric, 'kcal'),
    ('protein_g', 4.44::numeric, 'g'),
    ('carbohydrate_g', 38.7::numeric, 'g'),
    ('fat_g', 15::numeric, 'g'),
    ('fiber_g', 2.5::numeric, 'g')
)
INSERT INTO catalog.food_nutrient_values
  (nutrition_profile_id, nutrient_code, amount, unit, value_status)
SELECT cibles.id, valeurs.nutrient_code, valeurs.amount, valeurs.unit, 'estimated'
FROM cibles CROSS JOIN valeurs
ON CONFLICT (nutrition_profile_id, nutrient_code) DO UPDATE
  SET amount = EXCLUDED.amount,
      unit = EXCLUDED.unit,
      value_status = EXCLUDED.value_status;

WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate brisee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23414:pate brisee crue'
)
UPDATE catalog.food_nutrition_profiles p
SET source_record_key = '23481:pate brisee crue',
    confidence_level = 'C'
FROM cibles
WHERE p.id = cibles.id;

-- ── 2. La pâte sablée ───────────────────────────────────────────────────────
WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate sablee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23444:pate sablee crue'
), valeurs(nutrient_code, amount, unit) AS (
  VALUES
    ('energy_kcal', 313::numeric, 'kcal'),
    ('protein_g', 4.44::numeric, 'g'),
    ('carbohydrate_g', 38.7::numeric, 'g'),
    ('fat_g', 15::numeric, 'g'),
    ('fiber_g', 2.5::numeric, 'g')
)
INSERT INTO catalog.food_nutrient_values
  (nutrition_profile_id, nutrient_code, amount, unit, value_status)
SELECT cibles.id, valeurs.nutrient_code, valeurs.amount, valeurs.unit, 'estimated'
FROM cibles CROSS JOIN valeurs
ON CONFLICT (nutrition_profile_id, nutrient_code) DO UPDATE
  SET amount = EXCLUDED.amount,
      unit = EXCLUDED.unit,
      value_status = EXCLUDED.value_status;

WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate sablee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23444:pate sablee crue'
)
UPDATE catalog.food_nutrition_profiles p
SET source_record_key = '23481:pate sablee crue',
    confidence_level = 'C'
FROM cibles
WHERE p.id = cibles.id;
