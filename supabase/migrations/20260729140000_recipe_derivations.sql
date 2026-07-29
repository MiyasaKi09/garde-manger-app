-- Recettes dérivées — une variante devient une recette à part entière.
--
-- Jusqu'ici une variante n'était qu'une chaîne de caractères dans
-- `culinary.recipe_variation_options` : « Version aux poireaux dominants ». On
-- ne pouvait ni l'ouvrir, ni la peser, ni la planifier, parce que la base ne
-- savait pas ce qu'elle changeait. Elle devient ici une `recipe_version`
-- ordinaire, reliée à sa base par `derived_from_version_id` et portant dans
-- `derivation` le DELTA qui l'en sépare.
--
-- Deux conséquences voulues :
--
--   1. tout ce qui sait lire une recette sait lire une dérivée, sans exception
--      — nutrition, ingrédients, étapes, éligibilité au planning ;
--   2. le planificateur peut refuser de servir une base et sa dérivée la même
--      semaine, parce que la parenté est enfin une donnée et non une
--      convention de nommage.
--
-- La dérivation ne se met pas en cascade : une dérivée ne dérive jamais d'une
-- dérivée. Une chaîne de parenté ferait de la lignée un arbre, et la question
-- « ces deux plats sont-ils le même ? » n'aurait plus de réponse locale.
--
-- La fonction de catalogue ci-dessous est la définition en place, augmentée de
-- la seule parenté : elle a été patchée depuis le texte existant plutôt que
-- réécrite, une recopie à la main ayant déjà produit ici des références à des
-- tables qui n'existent pas.

BEGIN;

ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS derived_from_version_id uuid
    REFERENCES culinary.recipe_versions(id) ON DELETE RESTRICT;

ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS derivation jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN culinary.recipe_versions.derived_from_version_id IS
  'Recette de base dont celle-ci est une variante documentée. NULL pour une recette de plein droit.';
COMMENT ON COLUMN culinary.recipe_versions.derivation IS
  'Delta structuré appliqué à la base : étiquette de variante, opérations sur les ingrédients, réécritures d''étapes.';

-- Une dérivée ne dérive pas d'une dérivée, et ne dérive pas d'elle-même. La
-- règle passe par un déclencheur : une contrainte CHECK ne peut pas interroger
-- une autre ligne de la table.
CREATE OR REPLACE FUNCTION culinary.assert_no_derivation_chain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_parent_is_derived boolean;
BEGIN
  IF NEW.derived_from_version_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.derived_from_version_id = NEW.id THEN
    RAISE EXCEPTION 'Une recette ne peut pas dériver d''elle-même (%)', NEW.id
      USING ERRCODE = '23514';
  END IF;
  SELECT derived_from_version_id IS NOT NULL INTO v_parent_is_derived
  FROM culinary.recipe_versions
  WHERE id = NEW.derived_from_version_id;
  IF v_parent_is_derived THEN
    RAISE EXCEPTION 'Dérivation en cascade interdite : % dérive d''une recette elle-même dérivée', NEW.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_no_derivation_chain ON culinary.recipe_versions;
CREATE TRIGGER trg_no_derivation_chain
  BEFORE INSERT OR UPDATE OF derived_from_version_id ON culinary.recipe_versions
  FOR EACH ROW EXECUTE FUNCTION culinary.assert_no_derivation_chain();

-- Une base doit retrouver ses dérivées sans balayer la table.
CREATE INDEX IF NOT EXISTS idx_recipe_versions_derived_from
  ON culinary.recipe_versions (derived_from_version_id)
  WHERE derived_from_version_id IS NOT NULL;

-- Une variante dérivée n'a pas d'identité propre au répertoire culinaire : elle
-- emprunte celle de sa base et s'en écarte d'un delta documenté. Le niveau
-- « documented_variation » dit exactement cela, et la contrainte doit l'admettre
-- — sans quoi le chargement du corpus s'arrête sur la première dérivée.
ALTER TABLE culinary.recipe_families
  DROP CONSTRAINT IF EXISTS recipe_families_identity_level_check;
ALTER TABLE culinary.recipe_families
  ADD CONSTRAINT recipe_families_identity_level_check
  CHECK (identity_level IS NULL OR identity_level = ANY (ARRAY[
    'named_traditional_dish'::text,
    'domestic_standard'::text,
    'documented_variation'::text
  ]));

-- ── Le catalogue éditorial expose la parenté ────────────────────────────────
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
  'Catalogue éditorial V3 complet, parenté des variantes dérivées comprise. Signale séparément les recettes éligibles au planning strict.';

COMMIT;
