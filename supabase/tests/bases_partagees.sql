-- ============================================================================
-- LES BASES PARTAGÉES, VÉRIFIÉES SUR UNE VRAIE BASE (livrable 2.1)
-- ============================================================================
-- P12 se mesure « sur le chemin base, pas sur le chemin JSON » : c'est écrit
-- dans le pari 8 du §4 de docs/PLAN_FINIR_MYKO.md, et c'est tout le sens du
-- §0.3 — un lien posé au corpus que la RPC ne publie pas ne sert à rien. Vitest
-- n'a pas de base ; ce fichier tient donc la partie que seule une base peut
-- tenir, et il est appelé par le job `db-tests` de .github/workflows/ci.yml dans
-- les deux scénarios :
--
--   — scénario A, après les chargeurs régénérés : ce qui est éprouvé est le
--     CODE d'émission de scripts/data/recipes/build-corpus-v3.mjs, qui repose
--     les liens à chaque chargement (sans quoi un rechargement de corpus les
--     effacerait, chaque bloc recette commençant par un DELETE de ses
--     composants) ;
--   — scénario B, après apply-migrations.sh : ce qui est éprouvé est la
--     MIGRATION 20260918090000, c'est-à-dire le chemin de la production, où les
--     dix tranches du 17 septembre sont figées et ne portent aucun lien.
--
-- Les deux chemins doivent donner le MÊME compte. C'est la seule façon de
-- savoir qu'ils ne divergent pas en silence.
--
-- LES COMPTES ATTENDUS VIENNENT DE L'ARBITRAGE, et tests/data/basesPartagees.test.js
-- vérifie qu'ils n'ont pas dérivé de data/recipes/arbitrations/bases-partagees.json.
-- Les changer ici sans changer l'arbitrage fait rougir ce test-là.
--
-- Transaction ANNULÉE à la fin : rien n'est laissé en base.
-- ============================================================================

BEGIN;

-- La RPC refuse un appel non authentifié (`auth.uid() IS NULL`) ; le stub d'auth
-- de la CI lit ce réglage, LOCAL à la transaction.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

-- ── 1. Ce que la base porte ─────────────────────────────────────────────────
DO $$
DECLARE
  v_liens integer;
  v_plats integer;
  v_orphelins integer;
  v_roles integer;
BEGIN
  SELECT count(*), count(DISTINCT exigence.recipe_version_id)
    INTO v_liens, v_plats
  FROM culinary.recipe_ingredient_requirements exigence
  JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
  JOIN culinary.recipe_versions parent ON parent.id = exigence.recipe_version_id
  JOIN ops.source_datasets dataset ON dataset.id = parent.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
    AND composant.sub_recipe_version_id IS NOT NULL;

  IF v_liens <> 77 THEN
    RAISE EXCEPTION '[bases] % exigences liées à une sous-recette, 77 attendues (arbitrage bases-partagees)', v_liens;
  END IF;
  IF v_plats <> 71 THEN
    RAISE EXCEPTION '[bases] % plats liés, 71 attendus — P12 premier terme', v_plats;
  END IF;

  -- Un composant de base dont la sous-recette a disparu du corpus rendrait un
  -- `component.code` que le planificateur ne saurait pas résoudre : il noterait
  -- `shared_base_recipe_unknown` et le plat se cuisinerait comme avant. C'est un
  -- échec silencieux, donc un échec à nommer.
  SELECT count(*) INTO v_orphelins
  FROM culinary.recipe_components composant
  LEFT JOIN culinary.recipe_versions enfant ON enfant.id = composant.sub_recipe_version_id
  WHERE composant.component_role = 'base'
    AND (enfant.id IS NULL OR enfant.source_record_key IS NULL);
  IF v_orphelins <> 0 THEN
    RAISE EXCEPTION '[bases] % composants de rôle « base » sans sous-recette résoluble', v_orphelins;
  END IF;

  -- Le composant « plat » que le chargeur pose pour chaque recette n'a jamais de
  -- sous-recette : si l'un en portait une, c'est que le rattachement s'est fait
  -- sur la mauvaise ligne.
  SELECT count(*) INTO v_roles
  FROM culinary.recipe_components
  WHERE component_role = 'main' AND sub_recipe_version_id IS NOT NULL;
  IF v_roles <> 0 THEN
    RAISE EXCEPTION '[bases] % composants « plat » portent une sous-recette', v_roles;
  END IF;

  RAISE NOTICE '[bases] 1/3 base : % liens sur % plats, 0 orphelin.', v_liens, v_plats;
END $$;

-- ── 2. Ce que la quantité déclare ───────────────────────────────────────────
-- La quantité du composant est celle de la ligne d'ingrédient, pour les portions
-- de référence de la recette. Si les deux divergeaient, le plat achèterait une
-- quantité et en reprendrait une autre.
DO $$
DECLARE v_ecarts integer;
BEGIN
  SELECT count(*) INTO v_ecarts
  FROM culinary.recipe_ingredient_requirements exigence
  JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
  WHERE composant.sub_recipe_version_id IS NOT NULL
    AND (composant.required_quantity IS DISTINCT FROM exigence.quantity
         OR composant.required_unit IS DISTINCT FROM exigence.unit);
  IF v_ecarts <> 0 THEN
    RAISE EXCEPTION '[bases] % liens dont la quantité du composant diffère de la ligne d''ingrédient', v_ecarts;
  END IF;
  RAISE NOTICE '[bases] 2/3 quantités : 0 écart entre le composant et sa ligne d''ingrédient.';
END $$;

-- ── 3. Ce que la RPC PUBLIE ─────────────────────────────────────────────────
-- Le seul compte qui décide : le planificateur ne lit pas les tables, il lit
-- get_operational_recipe_catalog_v3. Un lien en base que la RPC ne publie pas
-- est un lien mort — c'est le constat du §0.3 du plan, et c'est ce que la
-- phase 0b a ouvert.
--
-- LE COMPTE ATTENDU N'EST PAS ÉCRIT EN DUR ICI, et c'est voulu. Le catalogue
-- servi est un sous-ensemble du corpus (`planning_eligible`, qualité A/B, toute
-- forme requise convertible et nutritionnellement connue) que ce fichier ne
-- décide pas ; et la projection joint les formes, si bien qu'une ligne liée dont
-- la forme est hors catalogue n'y paraît pas. Figer un nombre reviendrait à
-- recopier une mesure faite ailleurs. On compare donc la RPC à CE QUE LA BASE
-- PORTE pour les mêmes codes : les deux doivent dire la même chose, quel que
-- soit le sous-ensemble servi. C'est la méthode de l'étape 3 de
-- supabase/tests/contrat_operationnel.sql.
CREATE TEMP TABLE _bases_servies (code text PRIMARY KEY, liens integer) ON COMMIT DROP;

DO $$
DECLARE
  v_offset integer := 0;
  v_page jsonb;
  v_n integer;
BEGIN
  LOOP
    v_page := public.get_operational_recipe_catalog_v3(NULL, 100, v_offset);
    SELECT count(*) INTO v_n FROM jsonb_array_elements(v_page -> 'recipes');
    EXIT WHEN v_n = 0;
    INSERT INTO _bases_servies (code, liens)
      SELECT recette ->> 'code',
             (SELECT count(*) FROM jsonb_array_elements(recette -> 'exactIngredients') AS ing
               WHERE ing -> 'component' <> 'null'::jsonb)
      FROM jsonb_array_elements(v_page -> 'recipes') AS recette
      ON CONFLICT (code) DO NOTHING;
    v_offset := v_offset + 100;
    EXIT WHEN v_offset > 10000;
  END LOOP;
END $$;

DO $$
DECLARE
  v_servies integer;
  v_plats integer;
  v_liens integer;
  v_attendus integer;
  v_code text;
  v_publie jsonb;
  v_base text;
  v_quantite numeric;
  v_unite text;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE liens > 0), coalesce(sum(liens), 0)
    INTO v_servies, v_plats, v_liens
  FROM _bases_servies;

  IF v_servies < 500 THEN
    RAISE EXCEPTION '[bases] % recettes servies par la RPC, >= 500 attendues (plan §5, 0a.3)', v_servies;
  END IF;

  -- Ce que la base porte pour les codes effectivement servis, et dont la forme
  -- est rattachée au catalogue — la projection de la RPC joint `food_forms`, une
  -- ligne sans forme n'y paraît donc pas. C'est le compte exact que la RPC doit
  -- rendre : ni plus (elle inventerait), ni moins (elle perdrait un lien).
  SELECT count(*) INTO v_attendus
  FROM culinary.recipe_ingredient_requirements exigence
  JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
  JOIN culinary.recipe_versions parent ON parent.id = exigence.recipe_version_id
  JOIN ops.source_datasets dataset ON dataset.id = parent.source_dataset_id
  JOIN _bases_servies servie ON servie.code = upper(parent.source_record_key)
  WHERE dataset.code = 'myko_editorial_v3'
    AND composant.sub_recipe_version_id IS NOT NULL
    AND exigence.preferred_food_form_id IS NOT NULL;

  IF v_liens <> v_attendus THEN
    RAISE EXCEPTION '[bases] la RPC publie % ingrédients à component, % attendus d''après la base', v_liens, v_attendus;
  END IF;
  IF v_liens = 0 THEN
    RAISE EXCEPTION '[bases] aucun lien servi : le livrable 2.1 est de nouveau inerte en production';
  END IF;

  -- Un lien servi au hasard — le premier par ordre de code, donc reproductible —
  -- relu champ par champ contre la base. La forme publiée est exactement celle
  -- que lit lib/domain/planning/sharedBases.js (`recipeBaseRefs`).
  SELECT code INTO v_code FROM _bases_servies WHERE liens > 0 ORDER BY code LIMIT 1;

  SELECT upper(enfant.source_record_key), composant.required_quantity, composant.required_unit
    INTO v_base, v_quantite, v_unite
  FROM culinary.recipe_ingredient_requirements exigence
  JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
  JOIN culinary.recipe_versions parent ON parent.id = exigence.recipe_version_id
  JOIN culinary.recipe_versions enfant ON enfant.id = composant.sub_recipe_version_id
  JOIN ops.source_datasets dataset ON dataset.id = parent.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
    AND upper(parent.source_record_key) = v_code
    AND exigence.preferred_food_form_id IS NOT NULL
  ORDER BY exigence.position
  LIMIT 1;

  SELECT ing -> 'component' INTO v_publie
  FROM (SELECT public.get_operational_recipe_catalog_v3(v_code, 100, 0) AS page) appel,
  LATERAL jsonb_array_elements(appel.page -> 'recipes') AS recette,
  LATERAL jsonb_array_elements(recette -> 'exactIngredients') AS ing
  WHERE ing -> 'component' <> 'null'::jsonb
  LIMIT 1;

  IF v_publie IS NULL THEN
    RAISE EXCEPTION '[bases] % ne publie aucun component alors que la base en porte un', v_code;
  END IF;
  IF NOT (v_publie ?& ARRAY['code', 'name', 'requiredQuantity', 'requiredUnit', 'yieldQuantity', 'yieldUnit']) THEN
    RAISE EXCEPTION '[bases] le component de % n''a pas la forme que sharedBases.js lit : %', v_code, v_publie;
  END IF;
  IF v_publie ->> 'code' <> v_base THEN
    RAISE EXCEPTION '[bases] % publie la base % au lieu de %', v_code, v_publie ->> 'code', v_base;
  END IF;
  IF (v_publie ->> 'requiredQuantity')::numeric <> v_quantite OR v_publie ->> 'requiredUnit' <> v_unite THEN
    RAISE EXCEPTION '[bases] % publie % % au lieu de % %', v_code,
      v_publie ->> 'requiredQuantity', v_publie ->> 'requiredUnit', v_quantite, v_unite;
  END IF;

  RAISE NOTICE '[bases] 3/3 RPC : % liens publiés sur % plats, sur % recettes servies (sonde : % → %).',
    v_liens, v_plats, v_servies, v_code, v_base;
END $$;

ROLLBACK;
