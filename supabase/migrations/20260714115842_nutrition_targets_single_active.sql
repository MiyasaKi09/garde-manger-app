-- Un seul objectif nutritionnel ACTIF (effective_to IS NULL) par membre.
-- Appliqué en prod, idempotent. Réf. plan directeur PR 1, §9.11.
create unique index if not exists uq_nutrition_targets_member_active
  on public.nutrition_target_versions (member_id)
  where effective_to is null;
