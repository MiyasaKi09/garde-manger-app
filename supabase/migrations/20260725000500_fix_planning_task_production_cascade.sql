-- Les productions et consommations planifiées sont des projections d'une tâche
-- de préparation. Lorsqu'un planning non exécuté est remplacé, les tâches
-- automatiques sont supprimées puis recréées. Les dépendances doivent donc
-- suivre la même sémantique de cycle de vie.

ALTER TABLE public.planned_consumptions
  DROP CONSTRAINT IF EXISTS planned_consumptions_planned_production_id_fkey,
  ADD CONSTRAINT planned_consumptions_planned_production_id_fkey
    FOREIGN KEY (planned_production_id)
    REFERENCES public.planned_productions(id)
    ON DELETE CASCADE;

ALTER TABLE public.planned_productions
  DROP CONSTRAINT IF EXISTS planned_productions_source_task_id_fkey,
  ADD CONSTRAINT planned_productions_source_task_id_fkey
    FOREIGN KEY (source_task_id)
    REFERENCES public.nutrition_plan_prep_tasks(id)
    ON DELETE CASCADE;
