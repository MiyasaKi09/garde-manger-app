-- Authenticated read contract for the V3 operational recipe subset.
-- Candidate rows are never presented as published: only recipes satisfying the
-- complete execution gates (exact forms, conversions and macros) are exposed.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_operational_recipe_catalog_v3(
  p_code text DEFAULT NULL,
  p_limit integer DEFAULT 100,
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
    LEFT JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
    WHERE rv.planning_eligible
      AND rv.eligibility_issues = '[]'::jsonb
      AND rv.quality_level IN ('A', 'B')
      AND rf.confidence_level IN ('A', 'B')
      AND rv.source_record_key IS NOT NULL
      AND (p_code IS NULL OR upper(rv.source_record_key) = upper(btrim(p_code)))
      AND NOT EXISTS (
        SELECT 1
        FROM culinary.recipe_ingredient_requirements requirement
        WHERE requirement.recipe_version_id = rv.id
          AND (
            requirement.preferred_food_form_id IS NULL
            OR NOT EXISTS (
              SELECT 1
              FROM catalog.food_unit_conversions conversion
              WHERE conversion.food_form_id = requirement.preferred_food_form_id
                AND conversion.from_unit = requirement.unit
                AND conversion.to_unit = 'g'
                AND conversion.factor > 0
                AND conversion.status IN ('candidate', 'published')
                AND conversion.confidence_level IN ('A', 'B')
            )
            OR NOT EXISTS (
              SELECT 1
              FROM catalog.food_nutrition_profiles profile
              WHERE profile.food_form_id = requirement.preferred_food_form_id
                AND profile.is_primary
                AND profile.basis_quantity = 100
                AND profile.basis_unit = 'g'
                AND profile.confidence_level IN ('A', 'B')
                AND (
                  SELECT count(DISTINCT value.nutrient_code)
                  FROM catalog.food_nutrient_values value
                  WHERE value.nutrition_profile_id = profile.id
                    AND value.nutrient_code IN ('energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g')
                ) = 4
            )
          )
      )
  ),
  paged AS (
    SELECT *
    FROM qualified
    ORDER BY code
    LIMIT greatest(1, least(coalesce(p_limit, 100), 100))
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
        'catalogStatus', 'operational_candidate',
        'publicationStatus', recipe.publication_status,
        'familyStatus', recipe.family_status,
        'allergens', to_jsonb(recipe.allergens),
        'techniques', to_jsonb(recipe.techniques),
        'variants', to_jsonb(recipe.variant_candidates),
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
        jsonb_build_object(
          'foodFormId', form.id,
          'name', form.canonical_name,
          'formNormalized', form.canonical_name_normalized,
          'quantity', requirement.quantity,
          'unit', requirement.unit,
          'grams', round(requirement.quantity * conversion.factor, 4),
          'per100g', nutrients.per_100g,
          'role', requirement.culinary_role,
          'preparationNote', requirement.preparation_note,
          'optional', requirement.is_optional,
          'strictness', requirement.strictness,
          'category', category.code,
          'source', nutrition_source.code,
          'sourceRecordKey', profile.source_record_key
        ) ORDER BY requirement.position
      ) AS items
      FROM culinary.recipe_ingredient_requirements requirement
      JOIN catalog.food_forms form ON form.id = requirement.preferred_food_form_id
      JOIN catalog.food_concepts concept ON concept.id = form.food_concept_id
      JOIN catalog.food_categories category ON category.id = concept.category_id
      JOIN LATERAL (
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
      JOIN LATERAL (
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
      JOIN LATERAL (
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
  )
  SELECT jsonb_build_object(
    'contractVersion', 'v3-operational-1',
    'metadata', jsonb_build_object(
      'source', 'supabase',
      'catalogStatus', 'operational_candidate',
      'corpusVersion', coalesce((SELECT max(source_dataset_version) FROM qualified), 'unknown'),
      'eligibleCount', (SELECT count(*) FROM qualified),
      'returnedCount', count(*),
      'limit', greatest(1, least(coalesce(p_limit, 100), 100)),
      'offset', greatest(0, least(coalesce(p_offset, 0), 10000))
    ),
    'recipes', coalesce(jsonb_agg(assembled.payload ORDER BY assembled.code), '[]'::jsonb)
  )
  INTO result
  FROM assembled;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) IS
  'Authenticated V3 read contract. Exposes only operational candidates passing exact-form, conversion and deterministic macro gates; does not publish them.';

COMMIT;
