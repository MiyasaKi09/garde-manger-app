-- ============================================================================
-- Migration V2 · 0005 — RLS & grants (fondation)
-- Réf. MYKO_DATA_FOUNDATION_V2 §9 (sécurité Supabase V2).
-- ============================================================================
-- Règles :
--   anon           → aucun accès (pas d'USAGE de schéma + RLS activée).
--   authenticated  → lecture des données PUBLIÉES du catalogue, aucune écriture.
--   service_role   → import/publication (bypass RLS).
-- Les écritures métier passent par des routes serveur / RPC (§9.3), pas encore
-- créées ici (fondation). Idempotent.
-- ============================================================================

-- ── 1. Activer RLS sur toutes les tables V2 (defense in depth) ──────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname IN
      ('catalog','culinary','ops','quality','source_raw','staging','inventory','planning','private')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── 2. Révoquer tout accès anon/authenticated par défaut sur les schémas ─────
-- (anon n'a pas d'USAGE ; on verrouille aussi les privilèges de table hérités.)
REVOKE ALL ON ALL TABLES IN SCHEMA
  catalog, culinary, ops, quality, source_raw, staging, inventory, planning, private
  FROM anon, authenticated;

-- ── 3. Lecture catalogue publié pour `authenticated` ────────────────────────
-- Privilège SELECT (les LIGNES restent filtrées par les policies ci-dessous ;
-- une table sans policy => aucune ligne visible).
GRANT SELECT ON ALL TABLES IN SCHEMA catalog, culinary TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog, culinary
  GRANT SELECT ON TABLES TO authenticated;

-- Référence publique (rangement) : lisible sans restriction.
DROP POLICY IF EXISTS p_food_categories_read ON catalog.food_categories;
CREATE POLICY p_food_categories_read ON catalog.food_categories
  FOR SELECT TO authenticated USING (true);

-- Entités portant un `status` : visibles si 'published'.
DROP POLICY IF EXISTS p_food_concepts_read ON catalog.food_concepts;
CREATE POLICY p_food_concepts_read ON catalog.food_concepts
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_food_forms_read ON catalog.food_forms;
CREATE POLICY p_food_forms_read ON catalog.food_forms
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_food_storage_read ON catalog.food_storage_profiles;
CREATE POLICY p_food_storage_read ON catalog.food_storage_profiles
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_food_conversions_read ON catalog.food_unit_conversions;
CREATE POLICY p_food_conversions_read ON catalog.food_unit_conversions
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_food_transformations_read ON catalog.food_transformations;
CREATE POLICY p_food_transformations_read ON catalog.food_transformations
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_commercial_products_read ON catalog.commercial_products;
CREATE POLICY p_commercial_products_read ON catalog.commercial_products
  FOR SELECT TO authenticated USING (status = 'published');

-- Aliases : visibles si l'entité cible (concept OU forme) est publiée.
DROP POLICY IF EXISTS p_food_aliases_read ON catalog.food_aliases;
CREATE POLICY p_food_aliases_read ON catalog.food_aliases
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM catalog.food_concepts c
            WHERE c.id = food_aliases.food_concept_id AND c.status = 'published')
    OR EXISTS (SELECT 1 FROM catalog.food_forms f
            WHERE f.id = food_aliases.food_form_id AND f.status = 'published')
  );

-- Profils nutritionnels : visibles si publiés.
DROP POLICY IF EXISTS p_nutrition_profiles_read ON catalog.food_nutrition_profiles;
CREATE POLICY p_nutrition_profiles_read ON catalog.food_nutrition_profiles
  FOR SELECT TO authenticated USING (published_at IS NOT NULL);

-- Valeurs de nutriments : suivent la publication de leur profil.
DROP POLICY IF EXISTS p_nutrient_values_read ON catalog.food_nutrient_values;
CREATE POLICY p_nutrient_values_read ON catalog.food_nutrient_values
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM catalog.food_nutrition_profiles p
            WHERE p.id = food_nutrient_values.nutrition_profile_id
              AND p.published_at IS NOT NULL)
  );

-- Sorties de transformation : suivent la publication de la transformation.
DROP POLICY IF EXISTS p_transformation_outputs_read ON catalog.food_transformation_outputs;
CREATE POLICY p_transformation_outputs_read ON catalog.food_transformation_outputs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM catalog.food_transformations t
            WHERE t.id = food_transformation_outputs.transformation_id
              AND t.status = 'published')
  );

-- ── 4. Lecture culinaire publiée pour `authenticated` ───────────────────────
DROP POLICY IF EXISTS p_recipe_families_read ON culinary.recipe_families;
CREATE POLICY p_recipe_families_read ON culinary.recipe_families
  FOR SELECT TO authenticated USING (status = 'published');

DROP POLICY IF EXISTS p_recipe_versions_read ON culinary.recipe_versions;
CREATE POLICY p_recipe_versions_read ON culinary.recipe_versions
  FOR SELECT TO authenticated USING (publication_status = 'published');

-- Enfants d'une version : visibles si la version est publiée.
DO $$
DECLARE
  child text;
  child_tables text[] := ARRAY[
    'recipe_components','recipe_ingredient_requirements',
    'recipe_instruction_branches','recipe_steps','recipe_executions'
  ];
BEGIN
  FOREACH child IN ARRAY child_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS p_%s_read ON culinary.%I', child, child);
    EXECUTE format($f$
      CREATE POLICY p_%s_read ON culinary.%I
        FOR SELECT TO authenticated USING (
          EXISTS (SELECT 1 FROM culinary.recipe_versions v
                  WHERE v.id = %I.recipe_version_id
                    AND v.publication_status = 'published')
        )$f$, child, child, child);
  END LOOP;
END $$;

-- recipe_requirement_options : suit la publication de la version via l'exigence.
DROP POLICY IF EXISTS p_recipe_requirement_options_read ON culinary.recipe_requirement_options;
CREATE POLICY p_recipe_requirement_options_read ON culinary.recipe_requirement_options
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM culinary.recipe_ingredient_requirements req
      JOIN culinary.recipe_versions v ON v.id = req.recipe_version_id
      WHERE req.id = recipe_requirement_options.requirement_id
        AND v.publication_status = 'published'
    )
  );

-- Axes/options/règles de variation : suivent la publication de la famille.
DROP POLICY IF EXISTS p_recipe_variation_axes_read ON culinary.recipe_variation_axes;
CREATE POLICY p_recipe_variation_axes_read ON culinary.recipe_variation_axes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM culinary.recipe_families fam
            WHERE fam.id = recipe_variation_axes.recipe_family_id
              AND fam.status = 'published')
  );

DROP POLICY IF EXISTS p_recipe_variation_options_read ON culinary.recipe_variation_options;
CREATE POLICY p_recipe_variation_options_read ON culinary.recipe_variation_options
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM culinary.recipe_variation_axes ax
      JOIN culinary.recipe_families fam ON fam.id = ax.recipe_family_id
      WHERE ax.id = recipe_variation_options.variation_axis_id
        AND fam.status = 'published'
    )
  );

DROP POLICY IF EXISTS p_recipe_configuration_rules_read ON culinary.recipe_configuration_rules;
CREATE POLICY p_recipe_configuration_rules_read ON culinary.recipe_configuration_rules
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM culinary.recipe_families fam
            WHERE fam.id = recipe_configuration_rules.recipe_family_id
              AND fam.status = 'published')
  );

-- ── 5. Rôles techniques : privilèges ciblés ─────────────────────────────────
-- data_reader / app_server : lecture du catalogue publié (RLS s'applique aussi).
GRANT SELECT ON ALL TABLES IN SCHEMA catalog, culinary TO data_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog, culinary GRANT SELECT ON TABLES TO data_reader;

-- data_importer : écrit uniquement source_raw + staging.
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA source_raw, staging TO data_importer;
ALTER DEFAULT PRIVILEGES IN SCHEMA source_raw, staging
  GRANT SELECT, INSERT, UPDATE ON TABLES TO data_importer;
GRANT SELECT, INSERT, UPDATE ON ops.import_runs, ops.field_provenance TO data_importer;

-- data_reviewer : traite les tâches de qualité.
GRANT SELECT, UPDATE ON quality.review_tasks TO data_reviewer;

-- data_publisher : publie les releases + promeut les entités candidates.
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA catalog, culinary, ops TO data_publisher;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog, culinary, ops
  GRANT SELECT, INSERT, UPDATE ON TABLES TO data_publisher;
