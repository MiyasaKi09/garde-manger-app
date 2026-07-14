-- ============================================================================
-- Test de schéma — Fondation V2 (data-v2/foundation)
-- Réf. MYKO_DATA_FOUNDATION_V2 §8.1 (tests de schéma).
-- ============================================================================
-- Assertions structurelles et de sécurité. Exécutable via `supabase db test`,
-- psql, ou copié dans l'éditeur SQL. Ne dépend d'aucune donnée importée ;
-- vérifie uniquement la structure posée par les migrations v2_0001..0005.
-- Chaque bloc lève une exception si l'invariant est violé.
-- ============================================================================

-- 1. Les 9 schémas V2 existent.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM information_schema.schemata
  WHERE schema_name IN
    ('source_raw','staging','catalog','culinary','inventory','planning','private','quality','ops');
  ASSERT n = 9, format('Attendu 9 schémas V2, trouvé %s', n);
END $$;

-- 2. Tables clés présentes dans catalog / culinary / ops.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(v.sch || '.' || v.tbl, ', ') INTO missing
  FROM (VALUES
    ('catalog','food_categories'),('catalog','food_concepts'),('catalog','food_forms'),
    ('catalog','food_aliases'),('catalog','food_nutrition_profiles'),('catalog','food_nutrient_values'),
    ('catalog','food_storage_profiles'),('catalog','food_unit_conversions'),
    ('catalog','food_transformations'),('catalog','food_transformation_outputs'),
    ('catalog','commercial_products'),
    ('culinary','recipe_families'),('culinary','recipe_versions'),('culinary','recipe_components'),
    ('culinary','recipe_ingredient_requirements'),('culinary','recipe_requirement_options'),
    ('culinary','recipe_variation_axes'),('culinary','recipe_variation_options'),
    ('culinary','recipe_configuration_rules'),('culinary','recipe_instruction_branches'),
    ('culinary','recipe_steps'),('culinary','recipe_executions'),
    ('ops','source_datasets'),('ops','import_runs'),('ops','field_provenance'),('ops','catalog_releases'),
    ('quality','review_tasks'),('source_raw','import_blobs')
  ) AS v(sch, tbl)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables it
    WHERE it.table_schema = v.sch AND it.table_name = v.tbl
  );
  ASSERT missing IS NULL, format('Tables manquantes : %s', missing);
END $$;

-- 3. RLS activée sur toutes les tables catalog/culinary/ops/quality/source_raw.
DO $$
DECLARE off_count int;
BEGIN
  SELECT count(*) INTO off_count
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname IN ('catalog','culinary','ops','quality','source_raw')
    AND NOT c.relrowsecurity;
  ASSERT off_count = 0, format('%s table(s) sans RLS', off_count);
END $$;

-- 4. anon n'a AUCUN accès (pas d'USAGE de schéma).
DO $$
BEGIN
  ASSERT NOT has_schema_privilege('anon','catalog','USAGE'), 'anon ne doit pas avoir USAGE sur catalog';
  ASSERT NOT has_schema_privilege('anon','culinary','USAGE'), 'anon ne doit pas avoir USAGE sur culinary';
  ASSERT NOT has_schema_privilege('anon','ops','USAGE'), 'anon ne doit pas avoir USAGE sur ops';
END $$;

-- 5. authenticated peut lire le catalogue (RLS filtre les lignes publiées)
--    mais PAS les tables de fabrique (ops/source_raw/quality).
DO $$
BEGIN
  ASSERT has_table_privilege('authenticated','catalog.food_concepts','SELECT'),
    'authenticated doit pouvoir SELECT catalog.food_concepts';
  ASSERT has_table_privilege('authenticated','culinary.recipe_versions','SELECT'),
    'authenticated doit pouvoir SELECT culinary.recipe_versions';
  ASSERT NOT has_table_privilege('authenticated','ops.source_datasets','SELECT'),
    'authenticated ne doit PAS accéder à ops.source_datasets';
  ASSERT NOT has_table_privilege('authenticated','source_raw.import_blobs','SELECT'),
    'authenticated ne doit PAS accéder à source_raw.import_blobs';
END $$;

-- 6. Chaque table catalog/culinary porte au moins une policy de lecture.
DO $$
DECLARE without_policy text;
BEGIN
  SELECT string_agg(format('%s.%s', n.nspname, c.relname), ', ') INTO without_policy
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' AND n.nspname IN ('catalog','culinary')
    AND NOT EXISTS (SELECT 1 FROM pg_policies p
                    WHERE p.schemaname = n.nspname AND p.tablename = c.relname);
  ASSERT without_policy IS NULL, format('Tables publiables sans policy : %s', without_policy);
END $$;

-- 7. Taxonomie de catégories seedée (17 entrées stables).
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM catalog.food_categories;
  ASSERT n = 17, format('Attendu 17 catégories, trouvé %s', n);
END $$;

-- 8. Rôles techniques créés.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_roles
  WHERE rolname IN ('data_reader','data_importer','data_reviewer','data_publisher','app_server');
  ASSERT n = 5, format('Attendu 5 rôles techniques, trouvé %s', n);
END $$;

SELECT 'v2_foundation_schema.test.sql : OK' AS result;
