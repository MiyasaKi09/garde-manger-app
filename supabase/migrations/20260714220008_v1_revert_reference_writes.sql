-- ============================================================================
-- Migration V1 — REVERT du verrouillage d'écriture des tables de référence
-- (annule 20260714220005). Réf. audit directeur (fix F0, point 15).
-- ============================================================================
-- Raison : l'app ÉCRIT certaines de ces tables comme `authenticated`. Ex. la revue
-- des ingrédients (`POST /api/ingredients/review`, action confirm/relink sur un
-- canonique) fait `canonical_foods.verified = true` — le catalogue canonique est
-- explicitement « partagé du foyer, vérifiable par tout utilisateur authentifié ».
-- Le lockdown 220005 cassait donc cette fonctionnalité (e2e recipe-repair en échec).
--
-- On restaure l'accès complet. Le durcissement des écritures catalogue V1 nécessite
-- une analyse PAR TABLE des chemins d'écriture réels de l'app (canonical_foods,
-- archetypes… sont éditables par l'utilisateur ; nutritional_data via le pipeline
-- nutrition). Reporté et documenté (docs/F0_HARDENING.md) plutôt qu'appliqué à
-- l'aveugle. L'update de object_path (point 6) fait par 220005 est conservé.
-- Idempotent.
-- ============================================================================

DO $$
DECLARE t text;
  reftables text[] := ARRAY[
    'nutritional_data','canonical_foods','archetypes','processes',
    'cooking_nutrition_factors','process_nutrition_modifiers','countries','cultivars',
    'diets','reference_categories','reference_subcategories','seasonality',
    'canonical_food_origins','canonical_food_processes','archetype_nutrition_overrides'
  ];
BEGIN
  FOREACH t IN ARRAY reftables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS ref_read_authenticated ON public.%I', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='ALL' AND 'authenticated'=ANY(roles)) THEN
      EXECUTE format('CREATE POLICY ref_all_authenticated ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END IF;
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;
