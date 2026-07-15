-- Répare l ancien chargement lu en Windows-1252, sans modifier les textes UTF-8
-- déjà corrects. Modélise ensuite uniquement les variantes présentes dans la
-- source éditoriale et crée le lien de sous-recette croque-monsieur/béchamel.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.repair_mojibake(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  BEGIN
    RETURN convert_from(convert_to(input, 'WIN1252'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    RETURN input;
  END;
END;
$function$;

UPDATE culinary.recipe_families family
SET canonical_name = pg_temp.repair_mojibake(family.canonical_name),
    description = pg_temp.repair_mojibake(family.description),
    culinary_origin = pg_temp.repair_mojibake(family.culinary_origin),
    cuisine_origin = pg_temp.repair_mojibake(family.cuisine_origin),
    meal_role = pg_temp.repair_mojibake(family.meal_role),
    dish_structure = pg_temp.repair_mojibake(family.dish_structure),
    sensory_profile = pg_temp.repair_mojibake(family.sensory_profile),
    updated_at = now()
WHERE family.id IN (
  SELECT version.recipe_family_id
  FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
);

UPDATE culinary.recipe_versions version
SET title = pg_temp.repair_mojibake(version.title),
    difficulty = pg_temp.repair_mojibake(version.difficulty),
    dominant_flavors = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.dominant_flavors) value),
    aroma_families = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.aroma_families) value),
    target_textures = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.target_textures) value),
    signature_ingredients = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.signature_ingredients) value),
    identity_guardrails = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.identity_guardrails) value),
    techniques = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.techniques) value),
    variant_candidates = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.variant_candidates) value),
    allergens = ARRAY(SELECT pg_temp.repair_mojibake(value) FROM unnest(version.allergens) value),
    conservation_text = pg_temp.repair_mojibake(version.conservation_text)
FROM ops.source_datasets dataset
WHERE dataset.id = version.source_dataset_id
  AND dataset.code = 'myko_editorial_v3';

UPDATE culinary.recipe_components component
SET name = pg_temp.repair_mojibake(component.name),
    component_role = pg_temp.repair_mojibake(component.component_role)
WHERE component.recipe_version_id IN (
  SELECT version.id FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
);

UPDATE culinary.recipe_ingredient_requirements requirement
SET source_name = pg_temp.repair_mojibake(requirement.source_name),
    culinary_role = pg_temp.repair_mojibake(requirement.culinary_role),
    preparation_note = pg_temp.repair_mojibake(requirement.preparation_note)
WHERE requirement.recipe_version_id IN (
  SELECT version.id FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
);

UPDATE culinary.recipe_steps step
SET instruction = pg_temp.repair_mojibake(step.instruction)
WHERE step.recipe_version_id IN (
  SELECT version.id FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
);

UPDATE catalog.food_forms form
SET canonical_name = pg_temp.repair_mojibake(form.canonical_name)
WHERE form.id IN (
  SELECT requirement.preferred_food_form_id
  FROM culinary.recipe_ingredient_requirements requirement
  JOIN culinary.recipe_versions version ON version.id = requirement.recipe_version_id
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
    AND requirement.preferred_food_form_id IS NOT NULL
);

DELETE FROM culinary.recipe_variation_axes axis
WHERE axis.name = 'Variante culinaire'
  AND axis.recipe_family_id IN (
    SELECT version.recipe_family_id
    FROM culinary.recipe_versions version
    JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
    WHERE dataset.code = 'myko_editorial_v3'
  );

WITH inserted_axes AS (
  INSERT INTO culinary.recipe_variation_axes
    (recipe_family_id, name, selection_mode, required)
  SELECT version.recipe_family_id, 'Variante culinaire', 'single', false
  FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3'
    AND cardinality(version.variant_candidates) > 0
  RETURNING id, recipe_family_id
)
INSERT INTO culinary.recipe_variation_options
  (variation_axis_id, name, confidence_level, status)
SELECT axis.id, candidate.name, version.quality_level, 'candidate'
FROM inserted_axes axis
JOIN culinary.recipe_versions version ON version.recipe_family_id = axis.recipe_family_id
CROSS JOIN LATERAL unnest(version.variant_candidates) candidate(name);

DELETE FROM quality.review_tasks task
WHERE task.entity_type = 'recipe_version'
  AND task.task_type IN ('variant_validation', 'variant_enrichment', 'variants_need_branch_modeling')
  AND task.entity_id IN (
    SELECT version.id FROM culinary.recipe_versions version
    JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
    WHERE dataset.code = 'myko_editorial_v3'
  );

INSERT INTO quality.review_tasks
  (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
SELECT 'recipe_version', version.id,
       CASE WHEN cardinality(version.variant_candidates) > 0 THEN 'variant_validation' ELSE 'variant_enrichment' END,
       CASE WHEN cardinality(version.variant_candidates) > 0 THEN 5 ELSE 6 END,
       CASE WHEN cardinality(version.variant_candidates) > 0
         THEN ARRAY['source_backed_variant_needs_test']
         ELSE ARRAY['variant_not_yet_sourced'] END,
       jsonb_build_object(
         'recipe_code', version.source_record_key,
         'variants', to_jsonb(version.variant_candidates),
         'policy', 'source_or_test_required'
       ),
       'open'
FROM culinary.recipe_versions version
JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
WHERE dataset.code = 'myko_editorial_v3';

UPDATE culinary.recipe_versions version
SET yield_quantity = 870,
    yield_unit = 'g'
FROM ops.source_datasets dataset
WHERE dataset.id = version.source_dataset_id
  AND dataset.code = 'myko_editorial_v3'
  AND version.source_record_key = 'FR-024';

DO $composition$
DECLARE
  parent_version uuid;
  child_version uuid;
  linked_component uuid;
BEGIN
  SELECT version.id INTO parent_version
  FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3' AND version.source_record_key = 'FR-023';

  SELECT version.id INTO child_version
  FROM culinary.recipe_versions version
  JOIN ops.source_datasets dataset ON dataset.id = version.source_dataset_id
  WHERE dataset.code = 'myko_editorial_v3' AND version.source_record_key = 'FR-024';

  IF parent_version IS NOT NULL AND child_version IS NOT NULL THEN
    DELETE FROM culinary.recipe_components
    WHERE recipe_version_id = parent_version AND sub_recipe_version_id = child_version;

    INSERT INTO culinary.recipe_components
      (recipe_version_id, name, component_role, position, sub_recipe_version_id,
       required_quantity, required_unit)
    VALUES
      (parent_version, 'Béchamel maison', 'sauce', 2, child_version, 240, 'g')
    RETURNING id INTO linked_component;

    UPDATE culinary.recipe_ingredient_requirements
    SET component_id = linked_component,
        requirement_type = 'sub_recipe'
    WHERE recipe_version_id = parent_version
      AND position = 4;
  END IF;
END
$composition$;

COMMIT;
