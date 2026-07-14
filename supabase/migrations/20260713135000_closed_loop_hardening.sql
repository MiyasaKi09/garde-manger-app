-- already applied on production (versioned faithfully from supabase_migrations.schema_migrations)
-- version: 20260713135000  ·  name: closed_loop_hardening

-- Boucle fermée V2 — durcissement après audit Supabase.
--
-- 1. Les données privées ne sont plus exposées au rôle anonyme dans PostgREST
--    ou GraphQL (les accès authentifiés restent protégés par les RLS).
-- 2. Les RPC applicatives ne sont exécutables que par un utilisateur connecté
--    ou un rôle de service.
-- 3. Toutes les nouvelles clés étrangères ont un index couvrant.
-- 4. La sauvegarde du foyer conserve l'identité d'un membre renommé et
--    désactive proprement les membres retirés.

begin;

revoke all on table
  public.household_members,
  public.nutrition_target_versions,
  public.meal_plan_versions,
  public.meal_plan_slots,
  public.meal_plan_validation_issues,
  public.data_quality_issues,
  public.inventory_reservations,
  public.nutrition_plan_prep_tasks,
  public.prep_task_dependencies,
  public.nutrition_plan_shopping_items,
  public.recipe_nutrition_snapshots,
  public.meal_feedback,
  public.decision_audit_log,
  public.inventory_available_lots_v2
from public, anon;

revoke all on function public.publish_closed_loop_plan(jsonb) from public, anon;
revoke all on function public.set_prep_task_state(bigint, text, timestamptz) from public, anon;
revoke all on function public.record_meal_plan_outcome(uuid, text, integer, text[], text) from public, anon;
revoke all on function public.save_household_nutrition(jsonb) from public, anon;

grant execute on function public.publish_closed_loop_plan(jsonb) to authenticated, service_role;
grant execute on function public.set_prep_task_state(bigint, text, timestamptz) to authenticated, service_role;
grant execute on function public.record_meal_plan_outcome(uuid, text, integer, text[], text) to authenticated, service_role;
grant execute on function public.save_household_nutrition(jsonb) to authenticated, service_role;

create index if not exists idx_data_quality_plan_version
  on public.data_quality_issues (plan_version_id);
create index if not exists idx_decision_audit_plan_version
  on public.decision_audit_log (plan_version_id);
create index if not exists idx_inventory_reservations_canonical
  on public.inventory_reservations (canonical_food_id);
create index if not exists idx_inventory_reservations_user
  on public.inventory_reservations (user_id);
create index if not exists idx_meal_feedback_actual_recipe
  on public.meal_feedback (actual_recipe_id);
create index if not exists idx_meal_feedback_member
  on public.meal_feedback (household_member_id);
create index if not exists idx_meal_feedback_plan_version
  on public.meal_feedback (plan_version_id);
create index if not exists idx_meal_plan_slots_cooked_dish
  on public.meal_plan_slots (cooked_dish_id);
create index if not exists idx_meal_plan_slots_generated_recipe
  on public.meal_plan_slots (generated_recipe_id);
create index if not exists idx_plan_issues_slot
  on public.meal_plan_validation_issues (slot_id);
create index if not exists idx_plan_issues_user
  on public.meal_plan_validation_issues (user_id);
create index if not exists idx_prep_dependencies_depends_on
  on public.prep_task_dependencies (depends_on_task_id);
create index if not exists idx_prep_dependencies_plan_version
  on public.prep_task_dependencies (plan_version_id);
create index if not exists idx_prep_dependencies_user
  on public.prep_task_dependencies (user_id);
create index if not exists idx_recipe_nutrition_user
  on public.recipe_nutrition_snapshots (user_id);

create or replace function public.save_household_nutrition(p_goals jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_goal jsonb;
  v_member_id uuid;
  v_requested_member_id uuid;
  v_name text;
  v_count integer := 0;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if jsonb_typeof(p_goals) <> 'array' or jsonb_array_length(p_goals) = 0 then
    raise exception 'goals_array_required';
  end if;

  if exists (
    select 1
    from (
      select lower(trim(value->>'person_name')) as name, count(*)
      from jsonb_array_elements(p_goals)
      group by lower(trim(value->>'person_name'))
      having count(*) > 1 or lower(trim(value->>'person_name')) = ''
    ) duplicated
  ) then
    raise exception 'duplicate_or_empty_member_name';
  end if;

  -- Un profil absent du nouveau payload est archivé, pas supprimé : ses
  -- historiques nutritionnels et retours de repas restent auditables.
  update public.household_members hm
  set active = false, updated_at = now()
  where hm.user_id = v_uid
    and not exists (
      select 1
      from jsonb_array_elements(p_goals) goal
      where (
        nullif(goal->>'household_member_id', '') is not null
        and goal->>'household_member_id' = hm.id::text
      ) or lower(trim(goal->>'person_name')) = lower(hm.name)
    );

  delete from public.user_health_goals where user_id = v_uid;

  for v_goal in select value from jsonb_array_elements(p_goals)
  loop
    v_name := trim(v_goal->>'person_name');
    v_member_id := null;
    v_requested_member_id := null;

    if nullif(v_goal->>'household_member_id', '') is not null then
      begin
        v_requested_member_id := (v_goal->>'household_member_id')::uuid;
      exception when invalid_text_representation then
        raise exception 'invalid_household_member_id';
      end;

      select id into v_member_id
      from public.household_members
      where id = v_requested_member_id and user_id = v_uid
      for update;

      if v_member_id is null then raise exception 'household_member_not_found'; end if;
    else
      select id into v_member_id
      from public.household_members
      where user_id = v_uid and lower(name) = lower(v_name)
      for update;
    end if;

    if v_member_id is null then
      insert into public.household_members (
        user_id, name, portion_multiplier, active
      ) values (
        v_uid,
        v_name,
        coalesce(nullif(v_goal->>'portion_multiplier', '')::numeric, 1),
        true
      ) returning id into v_member_id;
    else
      update public.household_members
      set name = v_name,
          portion_multiplier = coalesce(nullif(v_goal->>'portion_multiplier', '')::numeric, portion_multiplier),
          active = true,
          updated_at = now()
      where id = v_member_id;
    end if;

    delete from public.nutrition_target_versions
    where member_id = v_member_id and effective_from = current_date and source = 'user_profile';

    update public.nutrition_target_versions
    set effective_to = current_date - 1
    where member_id = v_member_id
      and effective_from < current_date
      and (effective_to is null or effective_to >= current_date);

    insert into public.nutrition_target_versions (
      user_id, member_id, effective_from,
      target_kcal, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g,
      tolerance_percent, source, rationale
    ) values (
      v_uid,
      v_member_id,
      current_date,
      nullif(v_goal->>'target_calories', '')::numeric,
      nullif(v_goal->>'target_protein_g', '')::numeric,
      nullif(v_goal->>'target_carbs_g', '')::numeric,
      nullif(v_goal->>'target_fat_g', '')::numeric,
      nullif(v_goal->>'target_fiber_g', '')::numeric,
      coalesce(nullif(v_goal->>'tolerance_percent', '')::numeric, 10),
      'user_profile',
      jsonb_build_object(
        'age', v_goal->'age',
        'sex', v_goal->'sex',
        'height_cm', v_goal->'height_cm',
        'activity_level', v_goal->'activity_level',
        'bmr', v_goal->'bmr',
        'tdee', v_goal->'tdee'
      )
    );

    insert into public.user_health_goals (
      user_id, person_name, target_calories, target_protein_g,
      target_fat_g, target_carbs_g, target_fiber_g, target_weight_kg,
      age, sex, height_cm, current_weight_kg, activity_level,
      weight_loss_rate, bmr, tdee, updated_at
    ) values (
      v_uid,
      v_name,
      nullif(v_goal->>'target_calories', '')::numeric,
      nullif(v_goal->>'target_protein_g', '')::numeric,
      nullif(v_goal->>'target_fat_g', '')::numeric,
      nullif(v_goal->>'target_carbs_g', '')::numeric,
      nullif(v_goal->>'target_fiber_g', '')::numeric,
      nullif(v_goal->>'target_weight_kg', '')::numeric,
      nullif(v_goal->>'age', '')::integer,
      nullif(v_goal->>'sex', ''),
      nullif(v_goal->>'height_cm', '')::numeric,
      nullif(v_goal->>'current_weight_kg', '')::numeric,
      nullif(v_goal->>'activity_level', ''),
      nullif(v_goal->>'weight_loss_rate', '')::numeric,
      nullif(v_goal->>'bmr', '')::numeric,
      nullif(v_goal->>'tdee', '')::numeric,
      now()
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('saved', v_count);
end;
$$;

-- CREATE OR REPLACE rétablit le privilège PUBLIC par défaut sur certaines
-- installations PostgreSQL : on le retire après le remplacement.
revoke all on function public.save_household_nutrition(jsonb) from public, anon;
grant execute on function public.save_household_nutrition(jsonb) to authenticated, service_role;

commit;
