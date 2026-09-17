-- La pâte à foncer cesse, EN BASE, d'être une tarte aux pommes.
--
-- CE QUI EST MESURÉ, ET COMMENT. Sur une base reconstruite par les seules
-- migrations — le chemin exact du pipeline de production, qui n'exécute aucun
-- chargeur — `catalog.food_nutrition_profiles` porte encore, pour
-- « pate brisee crue » et « pate sablee crue », le profil primaire
-- `23481:…` : « Tarte normande aux pommes (garniture farine, oeufs, crème,
-- sucre, calvados) », 313 kcal aux cent grammes, en confiance C. Le dépôt
-- déclare autre chose depuis le 30 juillet : les deux entrées EXACTES du
-- classeur Ciqual 2020 — 23414 « Pâte brisée, pur beurre, crue » (381 kcal) et
-- 23444 « Pâte sablée pur beurre, crue » (383 kcal) —, en confiance B. La
-- source est `scripts/data/out/recipe-food-catalog.json`, dont les deux fiches
-- portent l'arbitrage relu qui a écarté 23410 et 23440.
--
-- POURQUOI LA CORRECTION DE JUILLET N'A JAMAIS PRIS. `20260730160000_catalog_
-- pate_brisee_exacte.sql` a été écrite pour cela et son en-tête l'annonce
-- (« Elles passent publiables, le corpus de 386 à 392 »). Elle ne l'a pas fait :
-- comme tout SQL produit par `scripts/data/foods/build-recipe-food-sql.mjs`,
-- son bloc de profil est gardé par `IF v_profile IS NULL`. Sur une base qui
-- portait déjà un profil primaire — c'est-à-dire toute base existante — le bloc
-- est sauté, l'ancien proxy reste, et rien ne le signale. `20260917090000_
-- catalog_food_forms_549.sql` porte la même garde et a été sautée de même.
-- C'est la faute que le contrat opérationnel a corrigée pour l'origine
-- (« écrite APRÈS le IF et non dedans », build-recipe-food-sql.mjs) ; elle
-- demeure pour le profil nutritionnel, et cette migration en répare les deux
-- seules occurrences constatées.
--
-- CE QUE ÇA COÛTAIT, ET QUI L'A RÉVÉLÉ. Le gardien opérationnel de la RPC
-- exige `confidence_level IN ('A','B')` sur le profil primaire de chaque
-- ingrédient requis. À confiance C, les deux pâtes retiraient ONZE recettes du
-- catalogue servi : DESS-011, FR-005, FR-029, FR-036, FR-039, JUM-074,
-- REAL-088, VAR-035, VAR-037, VAR-038, VAR-041. Mesuré en rejouant la
-- qualification de `get_operational_recipe_catalog_v3` sur deux bases locales :
-- 509 recettes servies par la base des chargeurs, 498 par celle des seules
-- migrations ; la même base, ces deux profils réparés, en sert 509. Et la
-- valeur elle-même était fausse : dans une quiche la pâte porte la moitié des
-- calories de l'assiette, servie 25 % trop bas.
--
-- CE QU'ELLE NE FAIT PAS, ET POURQUOI. Elle ne réécrit pas tous les profils
-- primaires depuis le catalogue versionné. Comparaison faite, forme par forme,
-- entre `recipe-food-catalog.json` et la base des seules migrations : trois
-- écarts, dont un est une DÉCISION à ne pas défaire — « sel fin » porte
-- `override:sel fin` en confiance A, l'override explicite du chargeur F0, là où
-- le dépôt n'a pas de code Ciqual à donner. Une réécriture en bloc l'écraserait.
-- Les deux autres sont ceux-ci. La garde de `build-recipe-food-sql.mjs` reste
-- donc telle quelle et le sujet n'est pas clos : c'est un travail de catalogue,
-- pas de contrat opérationnel.
--
-- IDEMPOTENTE. Chaque écriture est conditionnée au proxy répudié : sur une base
-- déjà juste — celle des chargeurs, par exemple — elle ne touche aucune ligne.
-- Rollback : 20260917112000_pate_a_foncer_profil_exact_rollback.sql.

-- ── 1. La pâte brisée ───────────────────────────────────────────────────────
WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate brisee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23481:pate brisee crue'
)
UPDATE catalog.food_nutrition_profiles p
SET source_record_key = '23414:pate brisee crue',
    confidence_level = 'B'
FROM cibles
WHERE p.id = cibles.id;

-- Les valeurs suivent la fiche, et seulement si la fiche vient d'être posée :
-- le nom de l'enregistrement source est la preuve que c'est bien 23414 qu'on
-- décrit. Un profil laissé sur un autre code n'est pas touché.
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
    ('energy_kcal', 381::numeric, 'kcal'),
    ('protein_g', 6.33::numeric, 'g'),
    ('carbohydrate_g', 44.9::numeric, 'g'),
    ('fat_g', 19.5::numeric, 'g'),
    ('fiber_g', 1.88::numeric, 'g')
)
INSERT INTO catalog.food_nutrient_values
  (nutrition_profile_id, nutrient_code, amount, unit, value_status)
SELECT cibles.id, valeurs.nutrient_code, valeurs.amount, valeurs.unit, 'estimated'
FROM cibles CROSS JOIN valeurs
ON CONFLICT (nutrition_profile_id, nutrient_code) DO UPDATE
  SET amount = EXCLUDED.amount,
      unit = EXCLUDED.unit,
      value_status = EXCLUDED.value_status
WHERE catalog.food_nutrient_values.amount IS DISTINCT FROM EXCLUDED.amount
   OR catalog.food_nutrient_values.unit IS DISTINCT FROM EXCLUDED.unit
   OR catalog.food_nutrient_values.value_status IS DISTINCT FROM EXCLUDED.value_status;

-- ── 2. La pâte sablée ───────────────────────────────────────────────────────
WITH cibles AS (
  SELECT p.id
  FROM catalog.food_nutrition_profiles p
  JOIN catalog.food_forms ff ON ff.id = p.food_form_id
  WHERE ff.canonical_name_normalized = 'pate sablee crue'
    AND ff.status <> 'rejected'
    AND p.is_primary
    AND p.source_record_key = '23481:pate sablee crue'
)
UPDATE catalog.food_nutrition_profiles p
SET source_record_key = '23444:pate sablee crue',
    confidence_level = 'B'
FROM cibles
WHERE p.id = cibles.id;

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
    ('energy_kcal', 383::numeric, 'kcal'),
    ('protein_g', 5.95::numeric, 'g'),
    ('carbohydrate_g', 53.6::numeric, 'g'),
    ('fat_g', 15.8::numeric, 'g'),
    ('fiber_g', 1.65::numeric, 'g')
)
INSERT INTO catalog.food_nutrient_values
  (nutrition_profile_id, nutrient_code, amount, unit, value_status)
SELECT cibles.id, valeurs.nutrient_code, valeurs.amount, valeurs.unit, 'estimated'
FROM cibles CROSS JOIN valeurs
ON CONFLICT (nutrition_profile_id, nutrient_code) DO UPDATE
  SET amount = EXCLUDED.amount,
      unit = EXCLUDED.unit,
      value_status = EXCLUDED.value_status
WHERE catalog.food_nutrient_values.amount IS DISTINCT FROM EXCLUDED.amount
   OR catalog.food_nutrient_values.unit IS DISTINCT FROM EXCLUDED.unit
   OR catalog.food_nutrient_values.value_status IS DISTINCT FROM EXCLUDED.value_status;
