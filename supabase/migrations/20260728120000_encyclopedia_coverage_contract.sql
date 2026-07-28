-- Agrégats canoniques de l'Encyclopédie Myko.
--
-- Ce contrat ne crée pas un deuxième corpus. Il expose uniquement des comptes
-- calculés sur catalog.* et culinary.* afin que le manifeste éditorial puisse
-- afficher sa couverture réelle sans contourner les RLS des objets sources.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_encyclopedia_coverage_v1()
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

  WITH recipe_index AS MATERIALIZED (
    SELECT
      rv.recipe_family_id,
      rv.publication_status,
      rv.planning_eligible,
      rv.techniques,
      lower(concat_ws(
        ' ',
        rf.canonical_name,
        rf.meal_role,
        rf.dish_structure,
        rf.cuisine_origin
      )) AS searchable
    FROM culinary.recipe_versions rv
    JOIN culinary.recipe_families rf
      ON rf.id = rv.recipe_family_id
    WHERE rv.publication_status IS DISTINCT FROM 'rejected'
      AND rf.status IS DISTINCT FROM 'rejected'
  ),
  technique_index AS MATERIALIZED (
    SELECT DISTINCT lower(btrim(technique.value)) AS normalized_name
    FROM recipe_index recipe
    CROSS JOIN LATERAL unnest(
      coalesce(recipe.techniques, ARRAY[]::text[])
    ) AS technique(value)
    WHERE nullif(btrim(technique.value), '') IS NOT NULL
  )
  SELECT jsonb_build_object(
    'contract_version', 'myko-encyclopedia-coverage-v1',
    'measured_at', transaction_timestamp(),
    'food_concepts', (
      SELECT count(*)
      FROM catalog.food_concepts
      WHERE status IS DISTINCT FROM 'rejected'
    ),
    'food_forms', (
      SELECT count(*)
      FROM catalog.food_forms
      WHERE status IS DISTINCT FROM 'rejected'
    ),
    'commercial_products', (
      SELECT count(*)
      FROM catalog.commercial_products
      WHERE status IS DISTINCT FROM 'rejected'
    ),
    'nutrition_profiles', (
      SELECT count(*)
      FROM catalog.food_nutrition_profiles
    ),
    'nutrient_values', (
      SELECT count(*)
      FROM catalog.food_nutrient_values
    ),
    'techniques', (
      SELECT count(*)
      FROM technique_index
    ),
    'recipe_families', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
    ),
    'recipe_versions', (
      SELECT count(*)
      FROM recipe_index
    ),
    'published_recipe_versions', (
      SELECT count(*)
      FROM recipe_index
      WHERE publication_status = 'published'
    ),
    'planning_ready', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE planning_eligible
    ),
    'preparations', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(fond|fumet|bouillon|marinade|saumure|pâte de base|appareil|préparation)'
    ),
    'sauces', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(sauce|pesto|vinaigrette|chutney|émulsion|réduction|jus réduit)'
    ),
    'accompaniments', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(accompagnement|garniture|purée|gratin|polenta|légumes rôtis)'
    ),
    'desserts', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(dessert|gâteau|tarte sucrée|pâtisserie|biscuit|flan|glace|sorbet|entremets)'
    ),
    'breakfasts', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(petit-déjeuner|petit déjeuner|porridge|granola|pancake|gaufre|brunch)'
    ),
    'snacks', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(collation|barre|bouchée|compote|energy ball)'
    ),
    'beverages', (
      SELECT count(DISTINCT recipe_family_id)
      FROM recipe_index
      WHERE searchable ~
        '(boisson|smoothie|cocktail|mocktail|infusion|thé glacé)'
    )
  )
  INTO result;

  RETURN result;
END;
$function$;

COMMENT ON FUNCTION public.get_encyclopedia_coverage_v1() IS
  'Contrat agrégé authentifié pour mesurer la couverture des volumes de l Encyclopédie Myko.';

REVOKE ALL ON FUNCTION public.get_encyclopedia_coverage_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_encyclopedia_coverage_v1() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_encyclopedia_coverage_v1() TO authenticated;

COMMIT;
