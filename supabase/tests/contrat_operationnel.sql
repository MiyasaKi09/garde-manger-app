-- ============================================================================
-- Le contrat opérationnel, vérifié SUR UNE VRAIE BASE.
-- ============================================================================
-- Ce fichier existe parce que la phase 0b n'applique aucune migration à la
-- main : la preuve qu'elle marche doit donc se rejouer, et se rejouer sur une
-- base, pas sur un JSON. Il est appelé deux fois par le job `db-tests` de
-- .github/workflows/ci.yml, et les deux passages ne prouvent pas la même chose :
--
--   — scénario A, après les chargeurs : la CHAÎNE DE PUBLICATION écrit bien les
--     quatre champs (livrable 0b.2). Les fichiers SQL y sont régénérés par
--     `node scripts/data/...`, donc ce qui est vérifié est le code d'émission,
--     pas un artefact ;
--   — scénario B, après `apply-migrations.sh` : les MIGRATIONS les portent
--     (livrables 0b.1 et 0b.2). La base y est chargée par les tranches du
--     17 septembre, générées avant le contrat, puis réparée par
--     20260917111000 — c'est exactement le chemin de la production.
--
-- CE QU'IL VÉRIFIE, et qui recouvre les critères d'acceptation de 0b.1 :
--   1. les deux colonnes déclaratives et leur vocabulaire fermé existent ;
--   2. la base porte les valeurs : origine sur chaque forme servie, profil de
--      conservation sur chaque recette planifiable, lignée sur les 48 jumeaux ;
--   3. la RPC opérationnelle — la seule porte du planificateur — publie les
--      quatre champs pour TOUT le catalogue servi, pas pour un échantillon ;
--   4. la projection de `component` fonctionne, prouvée par une sonde annulée.
--
-- Tout le fichier tient dans une transaction ANNULÉE à la fin : il ne laisse
-- rien derrière lui, ni la sonde, ni la table temporaire, ni le jeton d'auth.
-- ============================================================================

BEGIN;

-- La RPC refuse un appel non authentifié (`auth.uid() IS NULL`), et le stub
-- d'auth de la CI lit ce réglage. Il est LOCAL à la transaction : annulé avec
-- elle, il ne fuit pas vers les étapes suivantes.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

-- ── 1. Le schéma ────────────────────────────────────────────────────────────
DO $$
DECLARE n integer;
BEGIN
  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'catalog' AND table_name = 'food_forms'
      AND column_name IN ('origin', 'origin_source')
    HAVING count(*) = 2;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[contrat] catalog.food_forms.origin / origin_source manquent (20260917110000)';
  END IF;

  PERFORM 1 FROM information_schema.columns
    WHERE table_schema = 'culinary' AND table_name = 'recipe_versions'
      AND column_name = 'conservation_profile' AND data_type = 'jsonb';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[contrat] culinary.recipe_versions.conservation_profile manque (20260917110000)';
  END IF;

  PERFORM 1 FROM pg_constraint
    WHERE conname = 'food_forms_origin_check'
      AND conrelid = 'catalog.food_forms'::regclass;
  IF NOT FOUND THEN
    RAISE EXCEPTION '[contrat] le vocabulaire fermé des origines n''est pas contraint';
  END IF;

  -- Le vocabulaire est fermé POUR DE VRAI : une origine inventée doit être
  -- refusée par la base, pas seulement par le code qui écrit.
  BEGIN
    UPDATE catalog.food_forms SET origin = 'animal:licorne'
    WHERE id = (SELECT id FROM catalog.food_forms ORDER BY canonical_name_normalized LIMIT 1);
    RAISE EXCEPTION '[contrat] une origine hors vocabulaire a été acceptée';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  PERFORM 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'culinary' AND p.proname = 'conservation_profile_contract';
  IF NOT FOUND THEN
    RAISE EXCEPTION '[contrat] culinary.conservation_profile_contract manque';
  END IF;

  -- La traduction ne fabrique rien : un profil absent reste absent, une durée
  -- non numérique aussi. C'est ce qui interdit à une valeur plausible de
  -- décider une production.
  IF culinary.conservation_profile_contract(NULL) IS NOT NULL THEN
    RAISE EXCEPTION '[contrat] un profil absent doit rester absent';
  END IF;
  IF culinary.conservation_profile_contract('{"fridge_hours":"beaucoup"}'::jsonb) -> 'fridgeHours' <> 'null'::jsonb THEN
    RAISE EXCEPTION '[contrat] une durée non numérique doit valoir null';
  END IF;
  IF culinary.conservation_profile_contract('{"fridge_hours":0}'::jsonb) -> 'fridgeHours' <> 'null'::jsonb THEN
    RAISE EXCEPTION '[contrat] une durée nulle ou négative doit valoir null, jamais zéro';
  END IF;
  IF culinary.conservation_profile_contract('{}'::jsonb) -> 'eatImmediately' <> 'false'::jsonb THEN
    RAISE EXCEPTION '[contrat] eatImmediately non déclaré doit valoir false';
  END IF;
  IF culinary.conservation_profile_contract('{}'::jsonb) -> 'freezable' <> 'null'::jsonb THEN
    RAISE EXCEPTION '[contrat] freezable non déclaré doit valoir null, jamais false';
  END IF;

  RAISE NOTICE '[contrat] 1/4 schéma : colonnes, vocabulaire fermé et traduction en place.';
END $$;

-- ── 2. Ce que la base porte ─────────────────────────────────────────────────
DO $$
DECLARE
  v_versions integer;
  v_planifiables integer;
  v_profils integer;
  v_sans_profil integer;
  v_jumeaux integer;
  v_jumeaux_lignee integer;
  v_lignees integer;
  v_formes_servies integer;
  v_formes_sans_origine integer;
  v_recettes_confiance integer;
  v_formes_confiance integer;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE rv.planning_eligible),
         count(*) FILTER (WHERE rv.conservation_profile IS NOT NULL),
         count(*) FILTER (WHERE rv.planning_eligible AND rv.conservation_profile IS NULL),
         count(*) FILTER (WHERE upper(rv.source_record_key) LIKE 'JUM-%'),
         count(*) FILTER (WHERE upper(rv.source_record_key) LIKE 'JUM-%' AND rv.derived_from_version_id IS NOT NULL),
         count(*) FILTER (WHERE rv.derived_from_version_id IS NOT NULL)
    INTO v_versions, v_planifiables, v_profils, v_sans_profil, v_jumeaux, v_jumeaux_lignee, v_lignees
  FROM culinary.recipe_versions rv
  JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
  WHERE ds.code = 'myko_editorial_v3';

  IF v_versions < 754 THEN
    RAISE EXCEPTION '[contrat] % versions V3 en base, 754 attendues au minimum', v_versions;
  END IF;
  IF v_planifiables < 560 THEN
    RAISE EXCEPTION '[contrat] % recettes planifiables, >= 560 attendues (plan §5, 0a.2)', v_planifiables;
  END IF;

  -- La porte porte sur ce qui est SERVI : une recette planifiable sans profil
  -- déclaré ne pourrait pas être produite d'avance, et rien ne le dirait.
  IF v_sans_profil <> 0 THEN
    RAISE EXCEPTION '[contrat] % recettes planifiables sans profil de conservation', v_sans_profil;
  END IF;

  -- Les 48 jumeaux végétariens : sans leur lignée, le refus de substitution
  -- hors lignée (P7) ne peut pas s'exécuter en production — toute recette
  -- serait sa propre lignée (closedLoopPlanner.js:777).
  IF v_jumeaux < 48 THEN
    RAISE EXCEPTION '[contrat] % jumeaux JUM- en base, 48 attendus', v_jumeaux;
  END IF;
  IF v_jumeaux_lignee <> v_jumeaux THEN
    RAISE EXCEPTION '[contrat] % jumeaux sur % portent une lignée', v_jumeaux_lignee, v_jumeaux;
  END IF;

  -- Chaque forme employée en ingrédient REQUIS par une recette planifiable
  -- porte une origine. Sans elle, la RPC rend « inconnu » et le plat cesse
  -- d'être végétarien — c'est la panne que 20260917110000 répare.
  SELECT count(DISTINCT req.preferred_food_form_id),
         count(DISTINCT req.preferred_food_form_id) FILTER (WHERE ff.origin IS NULL)
    INTO v_formes_servies, v_formes_sans_origine
  FROM culinary.recipe_ingredient_requirements req
  JOIN culinary.recipe_versions rv ON rv.id = req.recipe_version_id
  JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
  JOIN catalog.food_forms ff ON ff.id = req.preferred_food_form_id
  WHERE ds.code = 'myko_editorial_v3'
    AND rv.planning_eligible
    AND req.strictness = 'required';

  IF v_formes_sans_origine <> 0 THEN
    RAISE EXCEPTION '[contrat] % formes requises sur % sans origine déclarée', v_formes_sans_origine, v_formes_servies;
  END IF;

  -- ET LE PROFIL NUTRITIONNEL DE CES MÊMES FORMES, parce qu'il décide de ce
  -- que la RPC sert. Son gardien exige la confiance A ou B : une forme qui
  -- porte un profil primaire de confiance MOINDRE retire silencieusement de
  -- l'assiette toutes les recettes qui l'emploient — la recette reste
  -- `planning_eligible`, `check-corpus-parity` reste vert, et seule la
  -- différence entre 568 planifiables et le nombre servi le trahit.
  -- C'est arrivé : « pate brisee crue » et « pate sablee crue » sont restées
  -- sur le proxy Ciqual 23481 en confiance C jusqu'à 20260917112000, et onze
  -- recettes ne sortaient plus. Le cas qu'on refuse ici est précis — un profil
  -- EXISTE mais sa confiance l'écarte —, et non « il manque un profil », qui
  -- est un autre défaut et se dit autrement.
  SELECT count(DISTINCT rv.id), count(DISTINCT ff.canonical_name_normalized)
    INTO v_recettes_confiance, v_formes_confiance
  FROM culinary.recipe_versions rv
  JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
  JOIN culinary.recipe_ingredient_requirements req ON req.recipe_version_id = rv.id
  JOIN catalog.food_forms ff ON ff.id = req.preferred_food_form_id
  WHERE ds.code = 'myko_editorial_v3'
    AND rv.planning_eligible
    AND EXISTS (
      SELECT 1 FROM catalog.food_nutrition_profiles p
      WHERE p.food_form_id = ff.id AND p.is_primary
        AND p.basis_quantity = 100 AND p.basis_unit = 'g')
    AND NOT EXISTS (
      SELECT 1 FROM catalog.food_nutrition_profiles p
      WHERE p.food_form_id = ff.id AND p.is_primary
        AND p.basis_quantity = 100 AND p.basis_unit = 'g'
        AND p.confidence_level IN ('A', 'B'));

  IF v_recettes_confiance <> 0 THEN
    RAISE EXCEPTION '[contrat] % recette(s) planifiable(s) écartée(s) du catalogue servi par % forme(s) dont le profil nutritionnel primaire est sous la confiance B',
      v_recettes_confiance, v_formes_confiance;
  END IF;

  RAISE NOTICE '[contrat] 2/4 base : % versions V3, % planifiables, % profils de conservation (% planifiable(s) sans profil), % lignées dont %/% jumeaux, % formes requises toutes avec origine et aucune sous la confiance B.',
    v_versions, v_planifiables, v_profils, v_sans_profil, v_lignees, v_jumeaux_lignee, v_jumeaux, v_formes_servies;
END $$;

-- ── 3. Ce que la RPC publie ─────────────────────────────────────────────────
-- Le catalogue est lu page par page, exactement comme le fait l'application
-- (lib/db/operationalRecipeCatalog.js) : la RPC rabote toute demande au-delà de
-- cent sans le dire, et vérifier sur une seule page reviendrait à vérifier
-- toujours les mêmes cent premiers codes.
CREATE TEMP TABLE _contrat_servi (code text PRIMARY KEY, payload jsonb) ON COMMIT DROP;

DO $$
DECLARE
  v_offset integer := 0;
  v_page jsonb;
  v_n integer;
  v_version text;
BEGIN
  LOOP
    v_page := public.get_operational_recipe_catalog_v3(NULL, 100, v_offset);
    v_version := v_page ->> 'contractVersion';
    SELECT count(*) INTO v_n FROM jsonb_array_elements(v_page -> 'recipes');
    EXIT WHEN v_n = 0;
    INSERT INTO _contrat_servi (code, payload)
      SELECT r ->> 'code', r FROM jsonb_array_elements(v_page -> 'recipes') AS r
      ON CONFLICT (code) DO NOTHING;
    v_offset := v_offset + 100;
    EXIT WHEN v_offset > 10000;
  END LOOP;

  IF v_version <> 'v3-operational-2' THEN
    RAISE EXCEPTION '[contrat] contractVersion = %, « v3-operational-2 » attendu : la RPC servie n''est pas celle du contrat', v_version;
  END IF;
END $$;

DO $$
DECLARE
  v_servies integer;
  v_sans_profil integer;
  v_profil_incomplet integer;
  v_ingredients integer;
  v_origine_nulle integer;
  v_origine_inconnue integer;
  v_jumeaux integer;
  v_jumeaux_lignee integer;
  v_lignees integer;
  v_components_rpc integer;
  v_components_base integer;
BEGIN
  SELECT count(*) INTO v_servies FROM _contrat_servi;
  IF v_servies < 500 THEN
    RAISE EXCEPTION '[contrat] % recettes servies par la RPC, >= 500 attendues (plan §5, 0a.3)', v_servies;
  END IF;

  -- Un profil publié, et publié DANS LE VOCABULAIRE DU MOTEUR. Les six clés
  -- sont celles que lib/domain/recipes/conservationProfile.js lit, et rien
  -- d'autre : un profil resté en snake_case passerait « non nul » et rendrait
  -- une durée indéfinie au planificateur.
  SELECT count(*) FILTER (WHERE payload -> 'conservationProfile' = 'null'::jsonb OR payload -> 'conservationProfile' IS NULL),
         count(*) FILTER (WHERE NOT (payload -> 'conservationProfile' ?& ARRAY[
           'fridgeHours', 'eatImmediately', 'freezable', 'freezerMonths', 'serveCold', 'source']))
    INTO v_sans_profil, v_profil_incomplet
  FROM _contrat_servi;
  IF v_sans_profil <> 0 THEN
    RAISE EXCEPTION '[contrat] % recettes servies sans conservationProfile', v_sans_profil;
  END IF;
  IF v_profil_incomplet <> 0 THEN
    RAISE EXCEPTION '[contrat] % profils servis hors du vocabulaire du moteur', v_profil_incomplet;
  END IF;

  -- Une origine par ingrédient, du vocabulaire fermé, et jamais « inconnu » :
  -- c'est la condition de P8 sur le chemin base. 'inconnu' n'est pas
  -- compatible végétarien, et un seul suffirait à faire disparaître un plat.
  SELECT count(*),
         count(*) FILTER (WHERE ing -> 'origin' = 'null'::jsonb OR ing -> 'origin' IS NULL),
         count(*) FILTER (WHERE ing ->> 'origin' = 'inconnu'),
         count(*) FILTER (WHERE ing -> 'component' <> 'null'::jsonb)
    INTO v_ingredients, v_origine_nulle, v_origine_inconnue, v_components_rpc
  FROM _contrat_servi, LATERAL jsonb_array_elements(payload -> 'exactIngredients') AS ing;

  IF v_ingredients = 0 THEN
    RAISE EXCEPTION '[contrat] aucun ingrédient servi : la projection ne prouve rien';
  END IF;
  IF v_origine_nulle <> 0 THEN
    RAISE EXCEPTION '[contrat] % ingrédients servis sans origine sur %', v_origine_nulle, v_ingredients;
  END IF;
  IF v_origine_inconnue <> 0 THEN
    RAISE EXCEPTION '[contrat] % ingrédients servis d''origine « inconnu » sur % : P8 tombe', v_origine_inconnue, v_ingredients;
  END IF;

  PERFORM 1 FROM _contrat_servi, LATERAL jsonb_array_elements(payload -> 'exactIngredients') AS ing
    WHERE ing ->> 'origin' NOT IN (
      'vegetal', 'mineral', 'animal:viande', 'animal:volaille', 'animal:poisson',
      'animal:fruits_de_mer', 'animal:oeuf', 'animal:lait', 'animal:miel', 'animal:autre', 'inconnu');
  IF FOUND THEN
    RAISE EXCEPTION '[contrat] une origine servie est hors du vocabulaire de lib/domain/foods/origins.js';
  END IF;

  -- La lignée. Les jumeaux qui passent les portes opérationnelles doivent tous
  -- porter la leur : c'est ce qui rend le refus de substitution hors lignée
  -- exécutable en production.
  SELECT count(*) FILTER (WHERE code LIKE 'JUM-%'),
         count(*) FILTER (WHERE code LIKE 'JUM-%' AND payload -> 'derivedFrom' <> 'null'::jsonb),
         count(*) FILTER (WHERE payload -> 'derivedFrom' <> 'null'::jsonb)
    INTO v_jumeaux, v_jumeaux_lignee, v_lignees
  FROM _contrat_servi;
  IF v_jumeaux = 0 THEN
    RAISE EXCEPTION '[contrat] aucun jumeau servi : la lignée ne prouve rien';
  END IF;
  IF v_jumeaux_lignee <> v_jumeaux THEN
    RAISE EXCEPTION '[contrat] % jumeaux servis sur % portent leur lignée', v_jumeaux_lignee, v_jumeaux;
  END IF;
  IF v_lignees < 200 THEN
    RAISE EXCEPTION '[contrat] % recettes servies portent une lignée, >= 200 attendues', v_lignees;
  END IF;

  -- `component` : autant d'ingrédients liés à une sous-recette dans la RPC que
  -- la base en porte parmi les recettes servies. Le compte peut valoir zéro
  -- aujourd'hui — aucune recette du corpus ne déclare encore de base partagée,
  -- c'est le livrable 2.1 qui les posera — et c'est pour cela que la sonde
  -- ci-dessous prouve la projection au lieu de la supposer.
  SELECT count(*) INTO v_components_base
  FROM culinary.recipe_ingredient_requirements req
  JOIN culinary.recipe_components comp ON comp.id = req.component_id
  JOIN culinary.recipe_versions rv ON rv.id = req.recipe_version_id
  JOIN _contrat_servi servi ON servi.code = upper(rv.source_record_key)
  WHERE comp.sub_recipe_version_id IS NOT NULL;

  IF v_components_rpc <> v_components_base THEN
    RAISE EXCEPTION '[contrat] % components publiés pour % portés en base', v_components_rpc, v_components_base;
  END IF;

  RAISE NOTICE '[contrat] 3/4 RPC : % recettes servies, % ingrédients tous avec origine (0 inconnu), % profils complets, % lignées dont %/% jumeaux, % components publiés pour % en base.',
    v_servies, v_ingredients, v_servies - v_sans_profil, v_lignees, v_jumeaux_lignee, v_jumeaux, v_components_rpc, v_components_base;
END $$;

-- ── 4. La sonde de `component` ──────────────────────────────────────────────
-- Aucune recette du corpus ne déclare encore de base partagée : le compte de
-- l'étape 3 vaut donc zéro égale zéro, ce qui ne prouve rien de la projection.
-- On relie ici, LE TEMPS DE LA TRANSACTION, un ingrédient d'une recette servie
-- au composant sous-recette que la composition du croque-monsieur pose déjà, et
-- on relit la RPC. La transaction est annulée : rien n'est laissé en base, et
-- le jour où le livrable 2.1 posera de vraies bases, l'étape 3 prendra le
-- relais sans que cette sonde change.
DO $$
DECLARE
  v_code text;
  v_component jsonb;
  v_lies integer;
BEGIN
  SELECT upper(rv.source_record_key) INTO v_code
  FROM culinary.recipe_components comp
  JOIN culinary.recipe_versions rv ON rv.id = comp.recipe_version_id
  JOIN _contrat_servi servi ON servi.code = upper(rv.source_record_key)
  WHERE comp.sub_recipe_version_id IS NOT NULL
  ORDER BY 1
  LIMIT 1;

  IF v_code IS NULL THEN
    RAISE EXCEPTION '[contrat] aucune recette servie ne porte de composant sous-recette : la composition du corpus a cessé de fonctionner';
  END IF;

  UPDATE culinary.recipe_ingredient_requirements req
  SET component_id = comp.id, requirement_type = 'sub_recipe'
  FROM culinary.recipe_components comp
  JOIN culinary.recipe_versions rv ON rv.id = comp.recipe_version_id
  WHERE comp.sub_recipe_version_id IS NOT NULL
    AND upper(rv.source_record_key) = v_code
    AND req.recipe_version_id = rv.id
    AND req.position = (
      SELECT min(inner_req.position)
      FROM culinary.recipe_ingredient_requirements inner_req
      WHERE inner_req.recipe_version_id = rv.id
        AND inner_req.preferred_food_form_id IS NOT NULL
    );
  GET DIAGNOSTICS v_lies = ROW_COUNT;
  IF v_lies <> 1 THEN
    RAISE EXCEPTION '[contrat] la sonde a relié % ingrédients au lieu d''un seul', v_lies;
  END IF;

  SELECT ing -> 'component' INTO v_component
  FROM (SELECT public.get_operational_recipe_catalog_v3(v_code, 100, 0) AS page) appel,
  LATERAL jsonb_array_elements(appel.page -> 'recipes') AS recette,
  LATERAL jsonb_array_elements(recette -> 'exactIngredients') AS ing
  WHERE ing -> 'component' <> 'null'::jsonb;

  IF v_component IS NULL THEN
    RAISE EXCEPTION '[contrat] la RPC ne publie pas le component de % alors que la base le porte', v_code;
  END IF;
  -- La forme exacte que lit lib/domain/planning/sharedBases.js (lignes 238-249).
  IF NOT (v_component ?& ARRAY['code', 'name', 'requiredQuantity', 'requiredUnit', 'yieldQuantity', 'yieldUnit']) THEN
    RAISE EXCEPTION '[contrat] le component publié n''a pas la forme que sharedBases.js lit : %', v_component;
  END IF;
  IF v_component ->> 'code' IS NULL THEN
    RAISE EXCEPTION '[contrat] le component publié n''a pas de code de sous-recette';
  END IF;

  RAISE NOTICE '[contrat] 4/4 sonde : % publie le component % (annulée avec la transaction).',
    v_code, v_component ->> 'code';
END $$;

ROLLBACK;
