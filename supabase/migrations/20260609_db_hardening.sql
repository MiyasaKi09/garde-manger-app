-- Durcissement du schéma (audit juin 2026)
-- 1. Suppression des FK dupliquées (on conserve celle dont le comportement
--    effectif est inchangé : RESTRICT prime sur SET NULL quand les deux existent,
--    et NO ACTION est neutralisé par SET NULL → on garde SET NULL sur gri_*).
-- 2. WITH CHECK explicite sur les policies FOR ALL qui n'en avaient pas
--    (comportement identique : Postgres utilisait déjà USING en fallback).
-- Idempotent : peut être ré-exécuté sans erreur.

-- === 1. FK dupliquées ===

-- inventory_lots : on garde *_fk (ON DELETE RESTRICT, comportement effectif actuel)
ALTER TABLE public.inventory_lots DROP CONSTRAINT IF EXISTS inventory_lots_archetype_id_fkey;
ALTER TABLE public.inventory_lots DROP CONSTRAINT IF EXISTS inventory_lots_canonical_food_id_fkey;
ALTER TABLE public.inventory_lots DROP CONSTRAINT IF EXISTS inventory_lots_cultivar_id_fkey;
-- product_id : deux FK identiques (RESTRICT), on garde inventory_lots_product_fk
ALTER TABLE public.inventory_lots DROP CONSTRAINT IF EXISTS inventory_lots_product_fkey;

-- products : deux FK identiques (RESTRICT), on garde products_archetype_fk
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_archetype_id_fkey;

-- generated_recipe_ingredients : on garde fk_gri_* (ON DELETE SET NULL,
-- comportement effectif actuel — le NO ACTION était neutralisé par le SET NULL)
ALTER TABLE public.generated_recipe_ingredients DROP CONSTRAINT IF EXISTS generated_recipe_ingredients_archetype_id_fkey;
ALTER TABLE public.generated_recipe_ingredients DROP CONSTRAINT IF EXISTS generated_recipe_ingredients_canonical_food_id_fkey;

-- === 2. WITH CHECK explicites ===

ALTER POLICY generated_recipes_user_policy ON public.generated_recipes
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY meal_log_user_policy ON public.meal_log
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY weight_entries_user_policy ON public.weight_entries
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY users_own_imports ON public.nutrition_plan_imports
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY users_own_batch_recipes ON public.nutrition_plan_batch_recipes
  WITH CHECK (import_id IN (SELECT id FROM public.nutrition_plan_imports
                            WHERE user_id = (SELECT auth.uid())));

ALTER POLICY users_own_totals ON public.nutrition_plan_daily_totals
  WITH CHECK (import_id IN (SELECT id FROM public.nutrition_plan_imports
                            WHERE user_id = (SELECT auth.uid())));

ALTER POLICY users_own_meals ON public.nutrition_plan_meals
  WITH CHECK (import_id IN (SELECT id FROM public.nutrition_plan_imports
                            WHERE user_id = (SELECT auth.uid())));

ALTER POLICY users_own_prep ON public.nutrition_plan_prep_tasks
  WITH CHECK (import_id IN (SELECT id FROM public.nutrition_plan_imports
                            WHERE user_id = (SELECT auth.uid())));

ALTER POLICY users_own_shopping ON public.nutrition_plan_shopping_items
  WITH CHECK (import_id IN (SELECT id FROM public.nutrition_plan_imports
                            WHERE user_id = (SELECT auth.uid())));

-- === 3. Documentation ===

COMMENT ON TABLE public._backup_views IS
  'Table interne réservée au service_role : RLS activé sans policy, volontairement inaccessible avec la clé anon.';
