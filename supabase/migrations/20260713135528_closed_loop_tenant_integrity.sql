-- already applied on production (versioned faithfully from supabase_migrations.schema_migrations)
-- version: 20260713135528  ·  name: closed_loop_tenant_integrity

-- Boucle fermée V2 — intégrité multi-tenant des références.
--
-- Une égalité user_id dans une RLS protège la ligne elle-même, mais ne garantit
-- pas qu'une clé étrangère pointe vers une autre ligne du même propriétaire.
-- Ces politiques ferment ce cas pour toute écriture directe ou via RPC.

begin;

drop policy if exists nutrition_target_versions_insert_own on public.nutrition_target_versions;
create policy nutrition_target_versions_insert_own on public.nutrition_target_versions
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.household_members hm
      where hm.id = member_id and hm.user_id = (select auth.uid())
    )
  );
drop policy if exists nutrition_target_versions_update_own on public.nutrition_target_versions;
create policy nutrition_target_versions_update_own on public.nutrition_target_versions
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.household_members hm
      where hm.id = member_id and hm.user_id = (select auth.uid())
    )
  );

drop policy if exists meal_plan_versions_insert_own on public.meal_plan_versions;
create policy meal_plan_versions_insert_own on public.meal_plan_versions
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.nutrition_plan_imports i
      where i.id = import_id and i.user_id = (select auth.uid())
    )
  );
drop policy if exists meal_plan_versions_update_own on public.meal_plan_versions;
create policy meal_plan_versions_update_own on public.meal_plan_versions
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.nutrition_plan_imports i
      where i.id = import_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists meal_plan_slots_insert_own on public.meal_plan_slots;
create policy meal_plan_slots_insert_own on public.meal_plan_slots
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_versions pv
      where pv.id = plan_version_id and pv.user_id = (select auth.uid())
    )
    and (
      generated_recipe_id is null or exists (
        select 1 from public.generated_recipes gr
        where gr.id = generated_recipe_id and gr.user_id = (select auth.uid())
      )
    )
    and (
      cooked_dish_id is null or exists (
        select 1 from public.cooked_dishes cd
        where cd.id = cooked_dish_id and cd.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists meal_plan_slots_update_own on public.meal_plan_slots;
create policy meal_plan_slots_update_own on public.meal_plan_slots
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_versions pv
      where pv.id = plan_version_id and pv.user_id = (select auth.uid())
    )
    and (
      generated_recipe_id is null or exists (
        select 1 from public.generated_recipes gr
        where gr.id = generated_recipe_id and gr.user_id = (select auth.uid())
      )
    )
    and (
      cooked_dish_id is null or exists (
        select 1 from public.cooked_dishes cd
        where cd.id = cooked_dish_id and cd.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists meal_plan_validation_issues_insert_own on public.meal_plan_validation_issues;
create policy meal_plan_validation_issues_insert_own on public.meal_plan_validation_issues
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_versions pv
      where pv.id = plan_version_id and pv.user_id = (select auth.uid())
    )
    and (
      slot_id is null or exists (
        select 1 from public.meal_plan_slots s
        where s.id = meal_plan_validation_issues.slot_id
          and s.plan_version_id = meal_plan_validation_issues.plan_version_id
          and s.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists meal_plan_validation_issues_update_own on public.meal_plan_validation_issues;
create policy meal_plan_validation_issues_update_own on public.meal_plan_validation_issues
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_versions pv
      where pv.id = plan_version_id and pv.user_id = (select auth.uid())
    )
    and (
      slot_id is null or exists (
        select 1 from public.meal_plan_slots s
        where s.id = meal_plan_validation_issues.slot_id
          and s.plan_version_id = meal_plan_validation_issues.plan_version_id
          and s.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists data_quality_issues_insert_own on public.data_quality_issues;
create policy data_quality_issues_insert_own on public.data_quality_issues
  for insert with check (
    (select auth.uid()) = user_id
    and (
      plan_version_id is null or exists (
        select 1 from public.meal_plan_versions pv
        where pv.id = plan_version_id and pv.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists data_quality_issues_update_own on public.data_quality_issues;
create policy data_quality_issues_update_own on public.data_quality_issues
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      plan_version_id is null or exists (
        select 1 from public.meal_plan_versions pv
        where pv.id = plan_version_id and pv.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists inventory_reservations_insert_own on public.inventory_reservations;
create policy inventory_reservations_insert_own on public.inventory_reservations
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.meal_plan_slots s
      join public.meal_plan_versions pv on pv.id = s.plan_version_id
      where s.id = inventory_reservations.slot_id
        and s.plan_version_id = inventory_reservations.plan_version_id
        and s.user_id = (select auth.uid()) and pv.user_id = (select auth.uid())
    )
    and (
      lot_id is null or exists (
        select 1 from public.inventory_lots l
        where l.id = lot_id and l.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists inventory_reservations_update_own on public.inventory_reservations;
create policy inventory_reservations_update_own on public.inventory_reservations
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.meal_plan_slots s
      join public.meal_plan_versions pv on pv.id = s.plan_version_id
      where s.id = inventory_reservations.slot_id
        and s.plan_version_id = inventory_reservations.plan_version_id
        and s.user_id = (select auth.uid()) and pv.user_id = (select auth.uid())
    )
    and (
      lot_id is null or exists (
        select 1 from public.inventory_lots l
        where l.id = lot_id and l.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists prep_task_dependencies_insert_own on public.prep_task_dependencies;
create policy prep_task_dependencies_insert_own on public.prep_task_dependencies
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.nutrition_plan_prep_tasks task
      join public.nutrition_plan_imports i on i.id = task.import_id
      where task.id = prep_task_dependencies.task_id
        and task.plan_version_id = prep_task_dependencies.plan_version_id
        and i.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.nutrition_plan_prep_tasks dependency
      join public.nutrition_plan_imports i on i.id = dependency.import_id
      where dependency.id = prep_task_dependencies.depends_on_task_id
        and dependency.plan_version_id = prep_task_dependencies.plan_version_id
        and i.user_id = (select auth.uid())
    )
  );
drop policy if exists prep_task_dependencies_update_own on public.prep_task_dependencies;
create policy prep_task_dependencies_update_own on public.prep_task_dependencies
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.nutrition_plan_prep_tasks task
      join public.nutrition_plan_imports i on i.id = task.import_id
      where task.id = prep_task_dependencies.task_id
        and task.plan_version_id = prep_task_dependencies.plan_version_id
        and i.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.nutrition_plan_prep_tasks dependency
      join public.nutrition_plan_imports i on i.id = dependency.import_id
      where dependency.id = prep_task_dependencies.depends_on_task_id
        and dependency.plan_version_id = prep_task_dependencies.plan_version_id
        and i.user_id = (select auth.uid())
    )
  );

drop policy if exists recipe_nutrition_snapshots_insert_own on public.recipe_nutrition_snapshots;
create policy recipe_nutrition_snapshots_insert_own on public.recipe_nutrition_snapshots
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.generated_recipes gr
      where gr.id = generated_recipe_id and gr.user_id = (select auth.uid())
    )
  );
drop policy if exists recipe_nutrition_snapshots_update_own on public.recipe_nutrition_snapshots;
create policy recipe_nutrition_snapshots_update_own on public.recipe_nutrition_snapshots
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.generated_recipes gr
      where gr.id = generated_recipe_id and gr.user_id = (select auth.uid())
    )
  );

drop policy if exists meal_feedback_insert_own on public.meal_feedback;
create policy meal_feedback_insert_own on public.meal_feedback
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_slots s
      where s.id = meal_feedback.slot_id and s.plan_version_id = meal_feedback.plan_version_id
        and s.user_id = (select auth.uid())
    )
    and (
      household_member_id is null or exists (
        select 1 from public.household_members hm
        where hm.id = household_member_id and hm.user_id = (select auth.uid())
      )
    )
    and (
      actual_recipe_id is null or exists (
        select 1 from public.generated_recipes gr
        where gr.id = actual_recipe_id and gr.user_id = (select auth.uid())
      )
    )
  );
drop policy if exists meal_feedback_update_own on public.meal_feedback;
create policy meal_feedback_update_own on public.meal_feedback
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.meal_plan_slots s
      where s.id = meal_feedback.slot_id and s.plan_version_id = meal_feedback.plan_version_id
        and s.user_id = (select auth.uid())
    )
    and (
      household_member_id is null or exists (
        select 1 from public.household_members hm
        where hm.id = household_member_id and hm.user_id = (select auth.uid())
      )
    )
    and (
      actual_recipe_id is null or exists (
        select 1 from public.generated_recipes gr
        where gr.id = actual_recipe_id and gr.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists decision_audit_log_insert_own on public.decision_audit_log;
create policy decision_audit_log_insert_own on public.decision_audit_log
  for insert with check (
    (select auth.uid()) = user_id
    and (
      plan_version_id is null or exists (
        select 1 from public.meal_plan_versions pv
        where pv.id = plan_version_id and pv.user_id = (select auth.uid())
      )
    )
  );

commit;
