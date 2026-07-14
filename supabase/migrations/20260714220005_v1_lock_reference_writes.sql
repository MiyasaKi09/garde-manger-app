-- ============================================================================
-- Migration V1 (durcissement sécurité) — verrouiller l'écriture des tables de
-- RÉFÉRENCE encore actives. Réf. audit directeur (fix F0, point 15).
-- ============================================================================
-- Constat : plusieurs tables public.* ont une policy « FOR ALL … USING(true) »
-- pour `authenticated` → n'importe quel utilisateur peut MODIFIER le référentiel
-- partagé (nutrition, archétypes, aliments canoniques…). Ces tables sont LUES par
-- l'app mais écrites uniquement par les imports (service_role, qui bypass RLS).
-- On remplace donc, pour ces tables de référence PURES, la policy ALL par une
-- policy SELECT seule + révocation des privilèges d'écriture pour authenticated.
--
-- Portée volontairement RESTREINTE aux données de référence non éditées par le
-- client. Les tables potentiellement écrites par l'app (recipes, recipe_*,
-- products, meal_plans, planned_meals, pantry_items, user_recipe_interactions)
-- ne sont PAS touchées ici : leur cas (dont le partage au sein du foyer) relève
-- d'une décision produit — voir docs/OPERATIONS.md.
-- Réversible (recréer les policies). Idempotent.
-- ============================================================================

DO $$
DECLARE
  t text;
  r record;
  reftables text[] := ARRAY[
    'nutritional_data','canonical_foods','archetypes','processes',
    'cooking_nutrition_factors','process_nutrition_modifiers','countries','cultivars',
    'diets','reference_categories','reference_subcategories','seasonality',
    'canonical_food_origins','canonical_food_processes','archetype_nutrition_overrides'
  ];
BEGIN
  FOREACH t IN ARRAY reftables LOOP
    -- La table doit exister.
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      CONTINUE;
    END IF;

    -- 1. Supprimer les policies d'écriture (ALL/INSERT/UPDATE/DELETE) visant authenticated.
    FOR r IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t
        AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
        AND 'authenticated' = ANY(roles)
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, t);
    END LOOP;

    -- 2. Garantir une policy de LECTURE pour authenticated (les lectures continuent).
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t
        AND cmd IN ('SELECT') AND 'authenticated' = ANY(roles)
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
                     'ref_read_authenticated', t);
    END IF;

    -- 3. Révoquer les privilèges d'écriture (niveau GRANT) pour authenticated.
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END $$;

-- Rattacher le chemin durable du fichier source brut (point 6).
UPDATE source_raw.import_blobs
SET object_path = 'data/sources/raw/ciqual_2020_FR_2020-07-07.xls.gz'
WHERE sha256 = 'a728c29d8d3c944aa679d62d7a2e591c80bac512059ea6772af95760f65da75d';
