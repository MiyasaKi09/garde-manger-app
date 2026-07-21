-- Rollback ciblé des index de performance V5. Aucun contenu métier n'est
-- modifié ; les contraintes et les données restent en place.

DROP INDEX IF EXISTS public.idx_cooked_dishes_source_plan_version_id;
DROP INDEX IF EXISTS public.idx_cooked_dishes_planned_production_id;
DROP INDEX IF EXISTS public.idx_cooked_dishes_canonical_recipe_execution_id;
DROP INDEX IF EXISTS public.idx_planned_productions_recipe_execution_id;
DROP INDEX IF EXISTS public.idx_planned_demands_user_id;
DROP INDEX IF EXISTS public.idx_planned_demands_slot_id;
