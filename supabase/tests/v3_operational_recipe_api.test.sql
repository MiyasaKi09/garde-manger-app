-- Security and contract invariants for the V3 operational recipe API.
DO $$
DECLARE
  definition text;
BEGIN
  ASSERT has_function_privilege(
    'authenticated',
    'public.get_operational_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'authenticated must be allowed to execute the V3 recipe contract';

  ASSERT NOT has_function_privilege(
    'anon',
    'public.get_operational_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'anon must not execute the V3 recipe contract';

  ASSERT NOT has_function_privilege(
    'public',
    'public.get_operational_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'PUBLIC must not execute the V3 recipe contract';

  SELECT pg_get_functiondef(
    'public.get_operational_recipe_catalog_v3(text,integer,integer)'::regprocedure
  ) INTO definition;
  ASSERT definition ILIKE '%SECURITY DEFINER%', 'contract must be SECURITY DEFINER';
  ASSERT definition ILIKE '%SET search_path TO %', 'contract must pin its search_path';
  ASSERT definition ILIKE '%auth.uid() IS NULL%', 'contract must enforce authentication internally';
END $$;

DO $$
DECLARE
  definition text;
BEGIN
  ASSERT has_function_privilege(
    'authenticated',
    'public.get_editorial_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'authenticated must be allowed to execute the complete V3 editorial catalog';

  ASSERT NOT has_function_privilege(
    'anon',
    'public.get_editorial_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'anon must not execute the complete V3 editorial catalog';

  ASSERT NOT has_function_privilege(
    'public',
    'public.get_editorial_recipe_catalog_v3(text,integer,integer)',
    'EXECUTE'
  ), 'PUBLIC must not execute the complete V3 editorial catalog';

  SELECT pg_get_functiondef(
    'public.get_editorial_recipe_catalog_v3(text,integer,integer)'::regprocedure
  ) INTO definition;
  ASSERT definition ILIKE '%SECURITY DEFINER%', 'editorial contract must be SECURITY DEFINER';
  ASSERT definition ILIKE '%SET search_path TO %', 'editorial contract must pin its search_path';
  ASSERT definition ILIKE '%auth.uid() IS NULL%', 'editorial contract must enforce authentication internally';
END $$;

SELECT 'v3_operational_recipe_api.test.sql : OK' AS result;
