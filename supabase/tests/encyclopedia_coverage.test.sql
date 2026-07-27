-- Sécurité et forme du contrat agrégé de l'Encyclopédie Myko.
DO $$
DECLARE
  definition text;
BEGIN
  ASSERT has_function_privilege(
    'authenticated',
    'public.get_encyclopedia_coverage_v1()',
    'EXECUTE'
  ), 'authenticated must execute the encyclopedia coverage contract';

  ASSERT NOT has_function_privilege(
    'anon',
    'public.get_encyclopedia_coverage_v1()',
    'EXECUTE'
  ), 'anon must not execute the encyclopedia coverage contract';

  ASSERT NOT has_function_privilege(
    'public',
    'public.get_encyclopedia_coverage_v1()',
    'EXECUTE'
  ), 'PUBLIC must not execute the encyclopedia coverage contract';

  SELECT pg_get_functiondef(
    'public.get_encyclopedia_coverage_v1()'::regprocedure
  ) INTO definition;
  ASSERT definition ILIKE '%SECURITY DEFINER%', 'contract must be SECURITY DEFINER';
  ASSERT definition ILIKE '%SET search_path TO %', 'contract must pin its search_path';
  ASSERT definition ILIKE '%auth.uid() IS NULL%', 'contract must enforce authentication internally';
END $$;

BEGIN;

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  payload jsonb;
BEGIN
  payload := public.get_encyclopedia_coverage_v1();
  ASSERT jsonb_typeof(payload) = 'object', 'contract must return a JSON object';
  ASSERT payload->>'contract_version' = 'myko-encyclopedia-coverage-v1',
    'contract version must remain stable';
  ASSERT payload ?& ARRAY[
    'food_concepts',
    'food_forms',
    'commercial_products',
    'techniques',
    'recipe_families',
    'recipe_versions',
    'planning_ready',
    'preparations',
    'sauces',
    'accompaniments',
    'desserts',
    'breakfasts',
    'snacks',
    'beverages'
  ], 'all volume metrics must be present';
  ASSERT (payload->>'food_concepts')::bigint >= 0,
    'food concept count must be non-negative';
  ASSERT (payload->>'recipe_families')::bigint >= 0,
    'recipe family count must be non-negative';
END $$;

ROLLBACK;

SELECT 'encyclopedia_coverage.test.sql : OK' AS result;
