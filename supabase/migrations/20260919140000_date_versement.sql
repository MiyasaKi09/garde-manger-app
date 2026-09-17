-- La date de versement : ce que le catalogue a reçu, et QUAND.
--
-- POURQUOI CETTE MIGRATION EXISTE. Le plan (§5, phase 5) demande un écran
-- « Nouveautés de la semaine » filtré « sur la date de versement », parce que
-- la cause lente de départ chez les concurrents est le catalogue qui cesse de
-- bouger — « toujours pour les même recettes, il y a jamais de nouveautés »
-- (Kuri), « you just pick from the same recipes each time » (Mealime).
--
-- CETTE DATE N'EXISTAIT NULLE PART, et c'est la mesure qui a décidé de cette
-- migration. Relevé avant d'écrire une ligne :
--
--   — data/recipes/corpus-v3.json : 21 clés sur les 754 recettes, 6 clés
--     facultatives de plus, aucune n'est une date ;
--   — data/recipes/batches/*.json : `lot`, `intention`, `refuses`, `recipes` ;
--   — culinary.recipe_versions.created_at : les 754 lignes portent LA MÊME
--     valeur, celle du chargement par les dix tranches du livrable 0a.2 ;
--   — culinary.recipe_versions.published_at : NULL sur les 754 ;
--   — ops.source_datasets.current_version : `v3-300-real-dishes`, une étiquette
--     unique pour tout le catalogue ;
--   — ops.catalog_releases : 0 ligne.
--
-- Filtrer sur ce qui existait aurait donc rendu 754 « nouveautés de la
-- semaine » (created_at) ou 0 (published_at). Dans les deux cas l'écran ne dit
-- rien, et c'est un résultat qu'on écrit au lieu de le contourner.
--
-- CE QUE CETTE MIGRATION FAIT. Elle ajoute UNE colonne déclarative — le jour où
-- une recette est entrée au catalogue — et elle la projette dans la RPC
-- ÉDITORIALE, celle que la page des recettes lit. Elle ne la remplit pas : le
-- remplissage des lignes déjà chargées est une migration à part
-- (20260919141000), et les chargements futurs l'écrivent par la chaîne de
-- publication (scripts/data/recipes/build-corpus-v3.mjs, qui lit le registre
-- data/recipes/versements.json). Une colonne vide dit « personne n'a déclaré la
-- date de cette recette », ce qui est exactement vrai pour 706 des 754.
--
-- ELLE NE DATE RIEN RÉTROACTIVEMENT. Le registre ne porte qu'un lot : les 48
-- jumeaux végétariens du commit 65d5c05, entrés au corpus le 4 septembre 2026 —
-- mesuré, pas supposé : `git show 65d5c05^:data/recipes/corpus-v3.json` porte
-- 706 codes, `git show 65d5c05:…` en porte 754, et les 48 de l'écart sont
-- exactement les codes JUM-*. Les 706 autres recettes n'ont pas de date connue ;
-- leur en poser une serait inventer une donnée.
--
-- POURQUOI LA COLONNE EST UNE `date` ET PAS UN `timestamptz`. Un versement est
-- une journée, pas un instant : le lot du 4 septembre est « du 4 septembre »
-- pour qui le lit à Paris comme à Los Angeles. Un horodatage aurait rouvert le
-- piège n°4 du CLAUDE.md — la même ligne affichée au 3 ou au 4 selon le fuseau
-- du navigateur.
--
-- POURQUOI LA DATE N'EST PAS DANS LE CORPUS. Le chargeur écrit
-- `content_hash = md5(JSON.stringify(recette))` et
-- `scripts/db/check-corpus-parity.mjs` compare ces empreintes à celles de la
-- base, recette par recette (§9.3 du plan en fait un interdit). Ajouter un
-- champ dans les 48 recettes aurait changé leurs 48 empreintes et fait rougir
-- la parité contre une base déjà chargée, pour une donnée qui n'appartient pas
-- au contenu de la recette mais à son histoire d'entrée. Le registre est donc
-- un fichier À CÔTÉ du corpus, et le chargeur l'y joint.
--
-- LA SIGNATURE DE LA RPC ÉDITORIALE NE CHANGE PAS : trois arguments, mêmes
-- valeurs par défaut, même plafond de page (500) et même plafond d'offset. La
-- projection s'enrichit d'un champ FACULTATIF (`pouredOn`) et de deux compteurs
-- de métadonnées ; un client qui les ignore lit ce qu'il lisait.
--
-- LA RPC OPÉRATIONNELLE N'EST PAS TOUCHÉE. C'est elle que le planificateur lit,
-- et la date de versement n'entre dans aucune décision de planning : une
-- nouveauté ne doit pas être servie plus souvent parce qu'elle est nouvelle.
-- L'écran la lit, le solveur l'ignore.

-- ── 1. La colonne déclarative ───────────────────────────────────────────────
ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS corpus_poured_on date;

COMMENT ON COLUMN culinary.recipe_versions.corpus_poured_on IS
  'Jour où cette recette est entrée au catalogue (registre data/recipes/versements.json). NULL = date inconnue, jamais « ancienne ».';

-- Une date FUTURE serait un lot qui n'a pas eu lieu ; une date antérieure au
-- premier corpus V3 (15 juillet 2026, migration 20260715214547) serait une date
-- recopiée d'ailleurs. Les deux sont des fautes de saisie, et la base les
-- refuse plutôt que de les servir à un écran qui les afficherait comme vraies.
ALTER TABLE culinary.recipe_versions
  DROP CONSTRAINT IF EXISTS recipe_versions_corpus_poured_on_check;
ALTER TABLE culinary.recipe_versions
  ADD CONSTRAINT recipe_versions_corpus_poured_on_check
  CHECK (corpus_poured_on IS NULL OR corpus_poured_on >= DATE '2026-07-15');

-- L'écran demande « les recettes versées depuis lundi » : un index partiel sur
-- les seules lignes datées suffit, et il reste petit tant que la plupart des
-- recettes n'ont pas de date.
CREATE INDEX IF NOT EXISTS idx_recipe_versions_corpus_poured_on
  ON culinary.recipe_versions (corpus_poured_on DESC)
  WHERE corpus_poured_on IS NOT NULL;

-- ── 2. La RPC éditoriale publie la date ─────────────────────────────────────
-- Le corps ci-dessous est celui de 20260729140000_recipe_derivations.sql, mot
-- pour mot, plus trois lignes : `rv.corpus_poured_on` dans la CTE `qualified`,
-- `'pouredOn'` dans la charge utile, et deux compteurs de métadonnées. Vérifié
-- avant écriture que la base sert bien ce corps-là et pas un autre
-- (pg_get_functiondef comparé au fichier : identiques, 10 205 caractères).

CREATE OR REPLACE FUNCTION public.get_editorial_recipe_catalog_v3(
  p_code text DEFAULT NULL,
  p_limit integer DEFAULT 500,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  WITH qualified AS MATERIALIZED (
    SELECT
      rv.id AS recipe_version_id,
      rv.recipe_family_id,
      upper(rv.source_record_key) AS code,
      rv.title,
      rv.servings,
      rv.prep_minutes,
      rv.cook_minutes,
      rv.rest_minutes,
      rv.difficulty,
      rv.quality_level,
      rv.publication_status,
      rv.sensory_scores,
      rv.dominant_flavors,
      rv.aroma_families,
      rv.target_textures,
      rv.signature_ingredients,
      rv.identity_guardrails,
      rv.techniques,
      rv.variant_candidates,
      rv.allergens,
      rv.conservation_text,
      rv.corpus_poured_on,
      rv.planning_eligible AND rv.eligibility_issues = '[]'::jsonb AS operational_eligible,
      rv.eligibility_issues,
      rv.yield_quantity,
      rv.yield_unit,
      upper(base.source_record_key) AS derived_from_code,
      base.title AS derived_from_title,
      rv.derivation,
      rf.canonical_name AS family_name,
      rf.description,
      rf.cuisine_origin,
      rf.identity_level,
      rf.sensory_profile,
      rf.dish_structure,
      rf.status AS family_status,
      rf.confidence_level AS family_confidence,
      sd.code AS source_dataset_code,
      sd.current_version AS source_dataset_version,
      sd.name AS source_dataset_name,
      rv.source_url,
      rv.source_license
    FROM culinary.recipe_versions rv
    JOIN culinary.recipe_families rf ON rf.id = rv.recipe_family_id
    JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
    LEFT JOIN culinary.recipe_versions base ON base.id = rv.derived_from_version_id
    WHERE sd.code = 'myko_editorial_v3'
      AND rv.quality_level IN ('A', 'B')
      AND rf.confidence_level IN ('A', 'B')
      AND rv.source_record_key IS NOT NULL
      AND (p_code IS NULL OR upper(rv.source_record_key) = upper(btrim(p_code)))
  ),
  paged AS (
    SELECT *
    FROM qualified
    ORDER BY code
    LIMIT greatest(1, least(coalesce(p_limit, 500), 500))
    OFFSET greatest(0, least(coalesce(p_offset, 0), 10000))
  ),
  assembled AS (
    SELECT
      recipe.code,
      jsonb_build_object(
        'familyId', recipe.recipe_family_id,
        'recipeVersionId', recipe.recipe_version_id,
        'code', recipe.code,
        'family', recipe.family_name,
        'title', recipe.title,
        'description', recipe.description,
        'cuisineOrigin', recipe.cuisine_origin,
        'identityLevel', recipe.identity_level,
        'category', recipe.dish_structure,
        'servings', recipe.servings,
        'prepMinutes', coalesce(recipe.prep_minutes, 0),
        'cookMinutes', coalesce(recipe.cook_minutes, 0),
        'restMinutes', coalesce(recipe.rest_minutes, 0),
        'difficulty', recipe.difficulty,
        'confidence', recipe.quality_level,
        'familyConfidence', recipe.family_confidence,
        'catalogStatus', CASE WHEN recipe.operational_eligible
          THEN 'operational_candidate' ELSE 'editorial_candidate' END,
        'operationalEligible', recipe.operational_eligible,
        'eligibilityIssues', recipe.eligibility_issues,
        'publicationStatus', recipe.publication_status,
        'familyStatus', recipe.family_status,
        'yieldQuantity', recipe.yield_quantity,
        'yieldUnit', recipe.yield_unit,
        'allergens', to_jsonb(recipe.allergens),
        'techniques', to_jsonb(recipe.techniques),
        'derivedFrom', recipe.derived_from_code,
        'derivedFromTitle', recipe.derived_from_title,
        'derivation', CASE WHEN recipe.derivation = '{}'::jsonb THEN NULL ELSE recipe.derivation END,
        'derivatives', coalesce(derivatives.items, '[]'::jsonb),
        'variants', coalesce(variants.items, to_jsonb(recipe.variant_candidates)),
        'variantStatus', CASE
          WHEN coalesce(jsonb_array_length(derivatives.items), 0) > 0 THEN 'derived_recipes'
          WHEN coalesce(jsonb_array_length(variants.items), 0) > 0 THEN 'modeled_candidate'
          WHEN cardinality(recipe.variant_candidates) > 0 THEN 'source_backed_candidate'
          ELSE 'enrichment_planned'
        END,
        'conservation', recipe.conservation_text,
        'pouredOn', recipe.corpus_poured_on,
        'canonicalArbitration', NULL,
        'sensory', jsonb_build_object(
          'profile', recipe.sensory_profile,
          'scores', recipe.sensory_scores,
          'dominant_flavors', to_jsonb(recipe.dominant_flavors),
          'aroma_families', to_jsonb(recipe.aroma_families),
          'target_textures', to_jsonb(recipe.target_textures),
          'signature_ingredients', to_jsonb(recipe.signature_ingredients),
          'identity_guardrails', to_jsonb(recipe.identity_guardrails)
        ),
        'sources', jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'dataset', recipe.source_dataset_code,
          'datasetName', recipe.source_dataset_name,
          'version', recipe.source_dataset_version,
          'recordKey', recipe.code,
          'url', recipe.source_url,
          'license', recipe.source_license
        ))),
        'exactIngredients', coalesce(ingredients.items, '[]'::jsonb),
        'exactSteps', coalesce(steps.items, '[]'::jsonb)
      ) AS payload
    FROM paged recipe
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'foodFormId', form.id,
          'name', coalesce(requirement.source_name, form.canonical_name),
          'formNormalized', form.canonical_name_normalized,
          'quantity', requirement.quantity,
          'unit', requirement.unit,
          'grams', CASE WHEN conversion.factor IS NULL THEN NULL
            ELSE round(requirement.quantity * conversion.factor, 4) END,
          'per100g', nutrients.per_100g,
          'role', requirement.culinary_role,
          'preparationNote', requirement.preparation_note,
          'optional', requirement.is_optional,
          'strictness', requirement.strictness,
          'category', category.code,
          'source', nutrition_source.code,
          'sourceRecordKey', profile.source_record_key,
          'component', CASE WHEN child_version.id IS NULL THEN NULL ELSE jsonb_build_object(
            'code', upper(child_version.source_record_key),
            'name', component.name,
            'requiredQuantity', component.required_quantity,
            'requiredUnit', component.required_unit,
            'yieldQuantity', child_version.yield_quantity,
            'yieldUnit', child_version.yield_unit
          ) END
        )) ORDER BY requirement.position
      ) AS items
      FROM culinary.recipe_ingredient_requirements requirement
      LEFT JOIN culinary.recipe_components component ON component.id = requirement.component_id
      LEFT JOIN culinary.recipe_versions child_version ON child_version.id = component.sub_recipe_version_id
      LEFT JOIN catalog.food_forms form ON form.id = requirement.preferred_food_form_id
      LEFT JOIN catalog.food_concepts concept ON concept.id = form.food_concept_id
      LEFT JOIN catalog.food_categories category ON category.id = concept.category_id
      LEFT JOIN LATERAL (
        SELECT candidate.factor
        FROM catalog.food_unit_conversions candidate
        WHERE candidate.food_form_id = form.id
          AND candidate.from_unit = requirement.unit
          AND candidate.to_unit = 'g'
          AND candidate.factor > 0
          AND candidate.status IN ('candidate', 'published')
          AND candidate.confidence_level IN ('A', 'B')
        ORDER BY CASE candidate.status WHEN 'published' THEN 0 ELSE 1 END,
                 CASE candidate.confidence_level WHEN 'A' THEN 0 ELSE 1 END
        LIMIT 1
      ) conversion ON true
      LEFT JOIN LATERAL (
        SELECT candidate.id, candidate.source_dataset_id, candidate.source_record_key
        FROM catalog.food_nutrition_profiles candidate
        WHERE candidate.food_form_id = form.id
          AND candidate.is_primary
          AND candidate.basis_quantity = 100
          AND candidate.basis_unit = 'g'
          AND candidate.confidence_level IN ('A', 'B')
        ORDER BY CASE candidate.confidence_level WHEN 'A' THEN 0 ELSE 1 END,
                 candidate.published_at DESC NULLS LAST
        LIMIT 1
      ) profile ON true
      LEFT JOIN ops.source_datasets nutrition_source ON nutrition_source.id = profile.source_dataset_id
      LEFT JOIN LATERAL (
        SELECT jsonb_build_object(
          'kcal', max(value.amount) FILTER (WHERE value.nutrient_code = 'energy_kcal'),
          'proteinG', max(value.amount) FILTER (WHERE value.nutrient_code = 'protein_g'),
          'carbsG', max(value.amount) FILTER (WHERE value.nutrient_code = 'carbohydrate_g'),
          'fatG', max(value.amount) FILTER (WHERE value.nutrient_code = 'fat_g'),
          'fiberG', max(value.amount) FILTER (WHERE value.nutrient_code = 'fiber_g'),
          'saltG', max(value.amount) FILTER (WHERE value.nutrient_code = 'salt_g'),
          'sugarsG', max(value.amount) FILTER (WHERE value.nutrient_code = 'sugars_g'),
          'saturatedFatG', max(value.amount) FILTER (WHERE value.nutrient_code = 'saturated_fat_g')
        ) AS per_100g
        FROM catalog.food_nutrient_values value
        WHERE value.nutrition_profile_id = profile.id
        HAVING count(DISTINCT value.nutrient_code) FILTER (
          WHERE value.nutrient_code IN ('energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g')
        ) = 4
      ) nutrients ON true
      WHERE requirement.recipe_version_id = recipe.recipe_version_id
    ) ingredients ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(option.name ORDER BY option.name) AS items
      FROM culinary.recipe_variation_axes axis
      JOIN culinary.recipe_variation_options option ON option.variation_axis_id = axis.id
      WHERE axis.recipe_family_id = recipe.recipe_family_id
        AND option.status IN ('candidate', 'published')
    ) variants ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'n', step.step_number,
        'instruction', step.instruction,
        'activeMinutes', step.active_minutes,
        'passiveMinutes', step.passive_minutes,
        'temperatureC', step.temperature_c,
        'targetCoreTemperatureC', step.target_core_temperature_c,
        'equipmentCodes', to_jsonb(step.equipment_codes),
        'safetyCritical', step.safety_critical
      ) ORDER BY step.step_number) AS items
      FROM culinary.recipe_steps step
      WHERE step.recipe_version_id = recipe.recipe_version_id
        AND step.branch_id IS NULL
    ) steps ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'code', upper(derived.source_record_key),
        'title', derived.title,
        'label', derived.derivation->>'variant_label'
      ) ORDER BY derived.source_record_key) AS items
      FROM culinary.recipe_versions derived
      WHERE derived.derived_from_version_id = recipe.recipe_version_id
        AND derived.source_record_key IS NOT NULL
    ) derivatives ON true
  )
  SELECT jsonb_build_object(
    'contractVersion', 'v3-editorial-1',
    'metadata', jsonb_build_object(
      'source', 'supabase',
      'catalogStatus', 'editorial_candidate',
      'corpusVersion', coalesce((SELECT max(source_dataset_version) FROM qualified), 'unknown'),
      'totalCount', (SELECT count(*) FROM qualified),
      'operationalCount', (SELECT count(*) FROM qualified WHERE operational_eligible),
      'variantReadyCount', (SELECT count(*) FROM qualified WHERE cardinality(variant_candidates) > 0),
      'variantEnrichmentCount', (SELECT count(*) FROM qualified WHERE cardinality(variant_candidates) = 0),
      'derivedCount', (SELECT count(*) FROM qualified WHERE derived_from_code IS NOT NULL),
      'pouredCount', (SELECT count(*) FROM qualified WHERE corpus_poured_on IS NOT NULL),
      'latestPouredOn', (SELECT max(corpus_poured_on) FROM qualified),
      'returnedCount', count(*),
      'limit', greatest(1, least(coalesce(p_limit, 500), 500)),
      'offset', greatest(0, least(coalesce(p_offset, 0), 10000))
    ),
    'recipes', coalesce(jsonb_agg(assembled.payload ORDER BY assembled.code), '[]'::jsonb)
  )
  INTO result
  FROM assembled;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_editorial_recipe_catalog_v3(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_editorial_recipe_catalog_v3(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_editorial_recipe_catalog_v3(text, integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_editorial_recipe_catalog_v3(text, integer, integer) IS
  'Catalogue éditorial V3 complet, parenté des variantes dérivées et date de versement comprises. Signale séparément les recettes éligibles au planning strict.';

-- ── 3. Le résumé des versements, pour l'accueil ─────────────────────────────
--
-- POURQUOI UNE SECONDE PORTE, et pas la RPC éditoriale. L'accueil doit montrer
-- le lot de la semaine sans quoi « un lot qui se voit » n'est qu'un écran de
-- plus qu'on n'ouvre pas. Lui faire lire le catalogue éditorial coûterait
-- l'assemblage JSON des ingrédients et des étapes de 500 recettes pour
-- n'afficher qu'un compte et une date. Cette fonction ne rend que le strict
-- nécessaire : code, titre, origine, date — aucun ingrédient, aucune étape.
--
-- ELLE REND TOUJOURS LE DERNIER LOT CONNU, même s'il est vieux. `p_since`
-- borne la fenêtre demandée, mais la fenêtre servie est ramenée à la date du
-- dernier versement quand celui-ci est antérieur : un écran qui n'affiche rien
-- ne dit pas si le catalogue ne bouge plus ou si la requête était trop étroite.
-- `metadata.since` porte la fenêtre SERVIE, `metadata.requestedSince` celle qui
-- a été demandée, et `metadata.latestPouredOn` la date du dernier lot. C'est à
-- l'appelant de dire « cette semaine » ou « dernier lot », et il a de quoi.
--
-- LA QUALIFICATION EST CELLE DE LA RPC ÉDITORIALE, mot pour mot (jeu de données
-- éditorial, niveaux A/B de la version et de la famille, clé source présente).
-- Deux qualifications différentes auraient donné à l'accueil et à la page des
-- recettes deux comptes qui ne se rejoignent pas.
CREATE OR REPLACE FUNCTION public.get_recipe_pour_summary_v3(
  p_since date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result jsonb;
  v_demande date;
  v_dernier date;
  v_depuis date;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  -- Sept jours par défaut, comptés en UTC : la journée civile d'un versement
  -- est la même pour tous les lecteurs (piège n°4 du CLAUDE.md).
  v_demande := coalesce(p_since, ((pg_catalog.now() AT TIME ZONE 'UTC')::date - 7));

  SELECT max(rv.corpus_poured_on) INTO v_dernier
  FROM culinary.recipe_versions rv
  JOIN culinary.recipe_families rf ON rf.id = rv.recipe_family_id
  JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
  WHERE sd.code = 'myko_editorial_v3'
    AND rv.quality_level IN ('A', 'B')
    AND rf.confidence_level IN ('A', 'B')
    AND rv.source_record_key IS NOT NULL;

  v_depuis := CASE
    WHEN v_dernier IS NULL THEN v_demande
    WHEN v_dernier < v_demande THEN v_dernier
    ELSE v_demande
  END;

  WITH qualified AS (
    SELECT
      upper(rv.source_record_key) AS code,
      rf.canonical_name AS title,
      rf.cuisine_origin,
      rv.corpus_poured_on
    FROM culinary.recipe_versions rv
    JOIN culinary.recipe_families rf ON rf.id = rv.recipe_family_id
    JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
    WHERE sd.code = 'myko_editorial_v3'
      AND rv.quality_level IN ('A', 'B')
      AND rf.confidence_level IN ('A', 'B')
      AND rv.source_record_key IS NOT NULL
  ),
  fenetre AS (
    SELECT *
    FROM qualified
    WHERE corpus_poured_on IS NOT NULL
      AND corpus_poured_on >= v_depuis
    ORDER BY corpus_poured_on DESC, code
    LIMIT 200
  )
  SELECT jsonb_build_object(
    'contractVersion', 'v3-versement-1',
    'metadata', jsonb_build_object(
      'source', 'supabase',
      'requestedSince', v_demande,
      'since', v_depuis,
      'latestPouredOn', v_dernier,
      'catalogCount', (SELECT count(*) FROM qualified),
      'pouredCount', (SELECT count(*) FROM qualified WHERE corpus_poured_on IS NOT NULL),
      'undatedCount', (SELECT count(*) FROM qualified WHERE corpus_poured_on IS NULL),
      'matchingCount', (SELECT count(*) FROM qualified
                         WHERE corpus_poured_on IS NOT NULL AND corpus_poured_on >= v_depuis),
      'returnedCount', (SELECT count(*) FROM fenetre),
      'limit', 200
    ),
    'recipes', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'code', fenetre.code,
        'title', fenetre.title,
        'cuisineOrigin', fenetre.cuisine_origin,
        'pouredOn', fenetre.corpus_poured_on
      ) ORDER BY fenetre.corpus_poured_on DESC, fenetre.code)
      FROM fenetre
    ), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_recipe_pour_summary_v3(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_recipe_pour_summary_v3(date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_recipe_pour_summary_v3(date) TO authenticated;

COMMENT ON FUNCTION public.get_recipe_pour_summary_v3(date) IS
  'Résumé des versements au catalogue éditorial V3 : le dernier lot, sa date, son compte, et les recettes de la fenêtre demandée. Ne publie ni ingrédients ni étapes.';
