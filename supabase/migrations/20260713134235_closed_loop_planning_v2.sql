-- already applied on production (versioned faithfully from supabase_migrations.schema_migrations)
-- version: 20260713134235  ·  name: closed_loop_planning_v2

-- Myko — boucle fermée planning / stock / nutrition / préparation / courses
-- Date : 2026-07-13
--
-- Cette migration est additive. Elle conserve les tables nutrition_plan_* comme
-- couche de compatibilité UI, et ajoute un noyau versionné et transactionnel.
-- Une publication de planning devient une seule opération atomique :
--   version → créneaux → validations → réservations FEFO → tâches → courses.

begin;

-- ---------------------------------------------------------------------------
-- 1. Foyer et objectifs nutritionnels versionnés
-- ---------------------------------------------------------------------------

create table if not exists public.household_members (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  name                text not null check (char_length(trim(name)) between 1 and 80),
  member_type         text not null default 'adult'
                      check (member_type in ('adult', 'child', 'guest')),
  portion_multiplier  numeric(4,2) not null default 1
                      check (portion_multiplier > 0 and portion_multiplier <= 5),
  active              boolean not null default true,
  preferences         jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists uq_household_members_user_name
  on public.household_members (user_id, lower(name));
create index if not exists idx_household_members_user_active
  on public.household_members (user_id, active);

create table if not exists public.nutrition_target_versions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  member_id           uuid not null references public.household_members(id) on delete cascade,
  effective_from      date not null default current_date,
  effective_to        date,
  target_kcal         numeric(8,2) check (target_kcal is null or target_kcal > 0),
  target_protein_g    numeric(8,2) check (target_protein_g is null or target_protein_g >= 0),
  target_carbs_g      numeric(8,2) check (target_carbs_g is null or target_carbs_g >= 0),
  target_fat_g        numeric(8,2) check (target_fat_g is null or target_fat_g >= 0),
  target_fiber_g      numeric(8,2) check (target_fiber_g is null or target_fiber_g >= 0),
  tolerance_percent   numeric(5,2) not null default 10
                      check (tolerance_percent between 0 and 50),
  source              text not null default 'legacy_goal',
  rationale           jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create index if not exists idx_nutrition_targets_member_dates
  on public.nutrition_target_versions (member_id, effective_from desc, effective_to);
create index if not exists idx_nutrition_targets_user
  on public.nutrition_target_versions (user_id);

-- ---------------------------------------------------------------------------
-- 2. Planning versionné et créneaux partagés par le foyer
-- ---------------------------------------------------------------------------

create table if not exists public.meal_plan_versions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  import_id           bigint not null
                      references public.nutrition_plan_imports(id) on delete cascade,
  version_no          integer not null check (version_no > 0),
  status              text not null default 'draft'
                      check (status in ('draft', 'review_required', 'published', 'superseded', 'archived')),
  source              text not null default 'closed_loop',
  window_start        date not null,
  window_end          date not null,
  input_hash          text not null,
  input_snapshot      jsonb not null default '{}'::jsonb,
  objective_scores    jsonb not null default '{}'::jsonb,
  validation_summary  jsonb not null default '{}'::jsonb,
  rules_version       text not null default 'closed-loop-v1',
  published_at        timestamptz,
  superseded_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (import_id, version_no),
  check (window_end >= window_start)
);

create index if not exists idx_meal_plan_versions_user_status
  on public.meal_plan_versions (user_id, status, window_start desc);
create index if not exists idx_meal_plan_versions_import
  on public.meal_plan_versions (import_id, version_no desc);
create unique index if not exists uq_meal_plan_one_published
  on public.meal_plan_versions (import_id)
  where status = 'published';

alter table public.nutrition_plan_imports
  add column if not exists active_plan_version_id uuid
  references public.meal_plan_versions(id) on delete set null;

create table if not exists public.meal_plan_slots (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid()
                        references auth.users(id) on delete cascade,
  plan_version_id       uuid not null references public.meal_plan_versions(id) on delete cascade,
  slot_key              text not null,
  meal_date             date not null,
  meal_type             text not null
                        check (meal_type in ('pdj', 'dejeuner', 'diner', 'collation')),
  title                 text not null,
  generated_recipe_id   bigint references public.generated_recipes(id) on delete set null,
  cooked_dish_id        bigint references public.cooked_dishes(id) on delete set null,
  servings              numeric(6,2) not null default 1 check (servings > 0),
  status                text not null default 'planned'
                        check (status in ('planned', 'in_progress', 'completed', 'substituted', 'skipped')),
  locked                boolean not null default false,
  source                text not null default 'plan',
  nutrition_by_member   jsonb not null default '{}'::jsonb,
  nutrition_total       jsonb not null default '{}'::jsonb,
  preparation           jsonb not null default '{}'::jsonb,
  stock_summary         jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (plan_version_id, slot_key)
);

create index if not exists idx_meal_plan_slots_user_date
  on public.meal_plan_slots (user_id, meal_date, meal_type);
create index if not exists idx_meal_plan_slots_version_date
  on public.meal_plan_slots (plan_version_id, meal_date, meal_type);

alter table public.nutrition_plan_meals
  add column if not exists meal_plan_slot_id uuid
    references public.meal_plan_slots(id) on delete set null,
  add column if not exists planned_servings numeric(6,2) not null default 1,
  add column if not exists locked boolean not null default false,
  add column if not exists nutrition_source text not null default 'legacy',
  add column if not exists nutrition_confidence numeric(4,3);

create index if not exists idx_nutrition_plan_meals_slot
  on public.nutrition_plan_meals (meal_plan_slot_id)
  where meal_plan_slot_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Validation explicable et qualité des données
-- ---------------------------------------------------------------------------

create table if not exists public.meal_plan_validation_issues (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid()
                    references auth.users(id) on delete cascade,
  plan_version_id   uuid not null references public.meal_plan_versions(id) on delete cascade,
  slot_id           uuid references public.meal_plan_slots(id) on delete cascade,
  severity          text not null check (severity in ('blocker', 'error', 'warning', 'info')),
  code              text not null,
  message           text not null,
  details           jsonb not null default '{}'::jsonb,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists idx_plan_issues_version_severity
  on public.meal_plan_validation_issues (plan_version_id, severity);

create table if not exists public.data_quality_issues (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid()
                    references auth.users(id) on delete cascade,
  plan_version_id   uuid references public.meal_plan_versions(id) on delete cascade,
  entity_type       text not null,
  entity_id         text,
  issue_code        text not null,
  severity          text not null default 'warning'
                    check (severity in ('error', 'warning', 'info')),
  status            text not null default 'open'
                    check (status in ('open', 'ignored', 'resolved')),
  details           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

create index if not exists idx_data_quality_user_status
  on public.data_quality_issues (user_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Réservations : disponible = physique - réservé
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_reservations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  plan_version_id     uuid not null references public.meal_plan_versions(id) on delete cascade,
  slot_id             uuid not null references public.meal_plan_slots(id) on delete cascade,
  lot_id              uuid references public.inventory_lots(id) on delete set null,
  canonical_food_id   bigint references public.canonical_foods(id) on delete set null,
  ingredient_name     text not null,
  reserved_quantity   numeric(12,3) not null check (reserved_quantity > 0),
  reserved_unit       text not null,
  needed_quantity     numeric(12,3),
  needed_unit         text,
  status              text not null default 'active'
                      check (status in ('active', 'consumed', 'released', 'expired')),
  metadata            jsonb not null default '{}'::jsonb,
  reserved_at         timestamptz not null default now(),
  consumed_at         timestamptz,
  released_at         timestamptz
);

create index if not exists idx_inventory_reservations_lot_active
  on public.inventory_reservations (lot_id, status)
  where status = 'active';
create index if not exists idx_inventory_reservations_slot
  on public.inventory_reservations (slot_id, status);
create index if not exists idx_inventory_reservations_version
  on public.inventory_reservations (plan_version_id, status);

create or replace view public.inventory_available_lots_v2
with (security_invoker = true)
as
select
  l.id,
  l.user_id,
  l.product_id,
  l.canonical_food_id,
  l.archetype_id,
  l.cultivar_id,
  l.qty_remaining as physical_quantity,
  coalesce(r.reserved_quantity, 0)::numeric as reserved_quantity,
  greatest(l.qty_remaining - coalesce(r.reserved_quantity, 0), 0)::numeric as available_quantity,
  l.unit,
  l.storage_method,
  l.storage_place,
  l.expiration_date,
  l.adjusted_expiration_date,
  l.is_opened,
  l.requires_storage_review
from public.inventory_lots l
left join lateral (
  select sum(ir.reserved_quantity) as reserved_quantity
  from public.inventory_reservations ir
  where ir.lot_id = l.id and ir.status = 'active'
) r on true;

grant select on public.inventory_available_lots_v2 to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Tâches de préparation sous forme de graphe
-- ---------------------------------------------------------------------------

alter table public.nutrition_plan_prep_tasks
  add column if not exists plan_version_id uuid
    references public.meal_plan_versions(id) on delete cascade,
  add column if not exists meal_plan_slot_id uuid
    references public.meal_plan_slots(id) on delete cascade,
  add column if not exists stable_key text,
  add column if not exists task_type text not null default 'legacy',
  add column if not exists workflow_status text not null default 'pending',
  add column if not exists earliest_start_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists safety_deadline_at timestamptz,
  add column if not exists duration_min integer,
  add column if not exists priority integer not null default 50,
  add column if not exists source text not null default 'legacy',
  add column if not exists instructions_json jsonb not null default '[]'::jsonb,
  add column if not exists snoozed_until timestamptz;

create index if not exists idx_prep_tasks_plan_due
  on public.nutrition_plan_prep_tasks (plan_version_id, due_at, workflow_status);
create index if not exists idx_prep_tasks_slot
  on public.nutrition_plan_prep_tasks (meal_plan_slot_id);
create unique index if not exists uq_prep_tasks_version_stable_key
  on public.nutrition_plan_prep_tasks (plan_version_id, stable_key)
  where plan_version_id is not null and stable_key is not null;

create table if not exists public.prep_task_dependencies (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users(id) on delete cascade,
  plan_version_id     uuid not null references public.meal_plan_versions(id) on delete cascade,
  task_id             bigint not null references public.nutrition_plan_prep_tasks(id) on delete cascade,
  depends_on_task_id  bigint not null references public.nutrition_plan_prep_tasks(id) on delete cascade,
  created_at          timestamptz not null default now(),
  unique (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create index if not exists idx_prep_dependencies_task
  on public.prep_task_dependencies (task_id, depends_on_task_id);

-- ---------------------------------------------------------------------------
-- 6. Courses structurées, tout en gardant l'UI historique compatible
-- ---------------------------------------------------------------------------

alter table public.nutrition_plan_shopping_items
  add column if not exists plan_version_id uuid
    references public.meal_plan_versions(id) on delete set null,
  add column if not exists required_qty numeric(12,3),
  add column if not exists stock_qty numeric(12,3),
  add column if not exists reserved_qty numeric(12,3),
  add column if not exists incoming_qty numeric(12,3),
  add column if not exists purchase_qty numeric(12,3),
  add column if not exists purchase_unit text,
  add column if not exists shopping_status text not null default 'needed',
  add column if not exists planning_source text not null default 'legacy',
  add column if not exists aisle_order integer not null default 999,
  add column if not exists shortage_reason text,
  add column if not exists needed_by date;

create index if not exists idx_shopping_items_plan_status
  on public.nutrition_plan_shopping_items (plan_version_id, shopping_status, aisle_order);

-- ---------------------------------------------------------------------------
-- 7. Nutrition reproductible et boucle de feedback
-- ---------------------------------------------------------------------------

create table if not exists public.recipe_nutrition_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid()
                        references auth.users(id) on delete cascade,
  generated_recipe_id   bigint not null references public.generated_recipes(id) on delete cascade,
  version_no            integer not null,
  ingredients_hash      text not null,
  source                text not null default 'recipe_declared',
  serving_count         numeric(8,2) not null default 1,
  nutrition_per_serving jsonb not null default '{}'::jsonb,
  micronutrients        jsonb not null default '{}'::jsonb,
  data_quality          jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  unique (generated_recipe_id, version_no)
);

create index if not exists idx_recipe_nutrition_latest
  on public.recipe_nutrition_snapshots (generated_recipe_id, version_no desc);

create table if not exists public.meal_feedback (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid()
                        references auth.users(id) on delete cascade,
  slot_id               uuid not null references public.meal_plan_slots(id) on delete cascade,
  plan_version_id       uuid not null references public.meal_plan_versions(id) on delete cascade,
  household_member_id   uuid references public.household_members(id) on delete set null,
  adherence             text not null default 'planned'
                        check (adherence in ('planned', 'substituted', 'skipped', 'improvised', 'leftover')),
  rating                integer check (rating between 1 and 5),
  reason_codes          text[] not null default '{}'::text[],
  notes                 text,
  actual_recipe_id      bigint references public.generated_recipes(id) on delete set null,
  created_at            timestamptz not null default now()
);

create index if not exists idx_meal_feedback_user_created
  on public.meal_feedback (user_id, created_at desc);
create index if not exists idx_meal_feedback_slot
  on public.meal_feedback (slot_id);

create table if not exists public.decision_audit_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid()
                    references auth.users(id) on delete cascade,
  plan_version_id   uuid references public.meal_plan_versions(id) on delete cascade,
  decision_type     text not null,
  rules_version     text not null,
  input_fingerprint text,
  decision          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists idx_decision_audit_user_created
  on public.decision_audit_log (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 8. RLS — toutes les nouvelles tables sont strictement isolées par user_id
-- ---------------------------------------------------------------------------

alter table public.household_members enable row level security;
alter table public.nutrition_target_versions enable row level security;
alter table public.meal_plan_versions enable row level security;
alter table public.meal_plan_slots enable row level security;
alter table public.meal_plan_validation_issues enable row level security;
alter table public.data_quality_issues enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.prep_task_dependencies enable row level security;
alter table public.recipe_nutrition_snapshots enable row level security;
alter table public.meal_feedback enable row level security;
alter table public.decision_audit_log enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'household_members',
    'nutrition_target_versions',
    'meal_plan_versions',
    'meal_plan_slots',
    'meal_plan_validation_issues',
    'data_quality_issues',
    'inventory_reservations',
    'prep_task_dependencies',
    'recipe_nutrition_snapshots',
    'meal_feedback'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- Le journal de décision est immuable côté client : SELECT + INSERT seulement.
drop policy if exists decision_audit_log_select_own on public.decision_audit_log;
create policy decision_audit_log_select_own on public.decision_audit_log
  for select using ((select auth.uid()) = user_id);
drop policy if exists decision_audit_log_insert_own on public.decision_audit_log;
create policy decision_audit_log_insert_own on public.decision_audit_log
  for insert with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 9. Publication atomique de la boucle fermée
-- ---------------------------------------------------------------------------

create or replace function public.publish_closed_loop_plan(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid                uuid := auth.uid();
  v_owner              uuid;
  v_import_id          bigint;
  v_version_id         uuid;
  v_version_no         integer;
  v_status             text;
  v_blockers           integer := 0;
  v_slot               jsonb;
  v_issue              jsonb;
  v_reservation        jsonb;
  v_task               jsonb;
  v_dependency         jsonb;
  v_item               jsonb;
  v_snapshot           jsonb;
  v_slot_id            uuid;
  v_task_id            bigint;
  v_slot_map           jsonb := '{}'::jsonb;
  v_task_map           jsonb := '{}'::jsonb;
  v_lot_qty            numeric;
  v_already_reserved   numeric;
  v_requested          numeric;
  v_snapshot_version   integer;
begin
  if v_uid is null then
    raise exception 'authentication_required';
  end if;

  v_import_id := nullif(p_payload->>'import_id', '')::bigint;
  if v_import_id is null then
    raise exception 'import_id_required';
  end if;

  select user_id into v_owner
  from public.nutrition_plan_imports
  where id = v_import_id
  for update;

  if v_owner is null or v_owner <> v_uid then
    raise exception 'plan_not_found_or_forbidden';
  end if;

  select count(*)::integer into v_blockers
  from jsonb_array_elements(coalesce(p_payload->'issues', '[]'::jsonb)) i
  where i->>'severity' in ('blocker', 'error');

  v_status := case when v_blockers > 0 then 'review_required' else 'published' end;

  -- Une nouvelle publication remplace proprement l'état actif précédent.
  update public.inventory_reservations r
  set status = 'released', released_at = now(),
      metadata = r.metadata || jsonb_build_object('release_reason', 'superseded')
  where r.status = 'active'
    and r.plan_version_id in (
      select id from public.meal_plan_versions
      where import_id = v_import_id and status in ('published', 'review_required')
    );

  update public.meal_plan_versions
  set status = 'superseded', superseded_at = now(), updated_at = now()
  where import_id = v_import_id and status in ('published', 'review_required');

  select coalesce(max(version_no), 0) + 1
  into v_version_no
  from public.meal_plan_versions
  where import_id = v_import_id;

  insert into public.meal_plan_versions (
    user_id, import_id, version_no, status, source,
    window_start, window_end, input_hash, input_snapshot,
    objective_scores, validation_summary, rules_version, published_at
  ) values (
    v_uid,
    v_import_id,
    v_version_no,
    v_status,
    coalesce(nullif(p_payload->>'source', ''), 'closed_loop'),
    (p_payload->>'window_start')::date,
    (p_payload->>'window_end')::date,
    coalesce(nullif(p_payload->>'input_hash', ''), md5(p_payload::text)),
    coalesce(p_payload->'input_snapshot', '{}'::jsonb),
    coalesce(p_payload->'objective_scores', '{}'::jsonb),
    coalesce(p_payload->'validation_summary', '{}'::jsonb),
    coalesce(nullif(p_payload->>'rules_version', ''), 'closed-loop-v1'),
    case when v_status = 'published' then now() else null end
  ) returning id into v_version_id;

  for v_slot in
    select value from jsonb_array_elements(coalesce(p_payload->'slots', '[]'::jsonb))
  loop
    insert into public.meal_plan_slots (
      user_id, plan_version_id, slot_key, meal_date, meal_type, title,
      generated_recipe_id, cooked_dish_id, servings, status, locked, source,
      nutrition_by_member, nutrition_total, preparation, stock_summary
    ) values (
      v_uid,
      v_version_id,
      v_slot->>'slot_key',
      (v_slot->>'meal_date')::date,
      v_slot->>'meal_type',
      v_slot->>'title',
      nullif(v_slot->>'generated_recipe_id', '')::bigint,
      nullif(v_slot->>'cooked_dish_id', '')::bigint,
      coalesce(nullif(v_slot->>'servings', '')::numeric, 1),
      coalesce(nullif(v_slot->>'status', ''), 'planned'),
      coalesce((v_slot->>'locked')::boolean, false),
      coalesce(nullif(v_slot->>'source', ''), 'plan'),
      coalesce(v_slot->'nutrition_by_member', '{}'::jsonb),
      coalesce(v_slot->'nutrition_total', '{}'::jsonb),
      coalesce(v_slot->'preparation', '{}'::jsonb),
      coalesce(v_slot->'stock_summary', '{}'::jsonb)
    ) returning id into v_slot_id;

    v_slot_map := v_slot_map || jsonb_build_object(v_slot->>'slot_key', v_slot_id::text);

    update public.nutrition_plan_meals
    set meal_plan_slot_id = v_slot_id,
        planned_servings = coalesce(nullif(v_slot->>'servings_per_member', '')::numeric, 1),
        locked = coalesce((v_slot->>'locked')::boolean, false),
        nutrition_source = coalesce(nullif(v_slot->>'nutrition_source', ''), 'plan_snapshot'),
        nutrition_confidence = nullif(v_slot->>'nutrition_confidence', '')::numeric
    where import_id = v_import_id
      and id in (
        select value::bigint
        from jsonb_array_elements_text(coalesce(v_slot->'meal_row_ids', '[]'::jsonb))
      );
  end loop;

  for v_issue in
    select value from jsonb_array_elements(coalesce(p_payload->'issues', '[]'::jsonb))
  loop
    insert into public.meal_plan_validation_issues (
      user_id, plan_version_id, slot_id, severity, code, message, details
    ) values (
      v_uid,
      v_version_id,
      nullif(v_slot_map->>(v_issue->>'slot_key'), '')::uuid,
      v_issue->>'severity',
      v_issue->>'code',
      v_issue->>'message',
      coalesce(v_issue->'details', '{}'::jsonb)
    );
  end loop;

  -- Snapshot nutritionnel immuable de chaque fiche utilisée. Le moteur fournit
  -- des valeurs calculées depuis les ingrédients liés (CIQUAL quand disponible)
  -- et leur niveau de couverture ; aucune valeur de prompt n'est promue en
  -- vérité silencieusement.
  for v_snapshot in
    select value from jsonb_array_elements(coalesce(p_payload->'recipe_snapshots', '[]'::jsonb))
  loop
    select coalesce(max(version_no), 0) + 1 into v_snapshot_version
    from public.recipe_nutrition_snapshots
    where generated_recipe_id = (v_snapshot->>'generated_recipe_id')::bigint;

    insert into public.recipe_nutrition_snapshots (
      user_id, generated_recipe_id, version_no, ingredients_hash, source,
      serving_count, nutrition_per_serving, micronutrients, data_quality
    ) values (
      v_uid,
      (v_snapshot->>'generated_recipe_id')::bigint,
      v_snapshot_version,
      coalesce(nullif(v_snapshot->>'ingredients_hash', ''), md5(v_snapshot::text)),
      coalesce(nullif(v_snapshot->>'source', ''), 'ingredient_calculation'),
      coalesce(nullif(v_snapshot->>'serving_count', '')::numeric, 1),
      coalesce(v_snapshot->'nutrition_per_serving', '{}'::jsonb),
      coalesce(v_snapshot->'micronutrients', '{}'::jsonb),
      coalesce(v_snapshot->'data_quality', '{}'::jsonb)
    );
  end loop;

  -- Les réservations ne deviennent actives que pour un plan sans blocage.
  if v_status = 'published' then
    for v_reservation in
      select value from jsonb_array_elements(coalesce(p_payload->'reservations', '[]'::jsonb))
    loop
      v_requested := (v_reservation->>'reserved_quantity')::numeric;

      select qty_remaining into v_lot_qty
      from public.inventory_lots
      where id = (v_reservation->>'lot_id')::uuid and user_id = v_uid
      for update;

      if v_lot_qty is null then
        raise exception 'stock_changed: lot % unavailable', v_reservation->>'lot_id';
      end if;

      select coalesce(sum(reserved_quantity), 0) into v_already_reserved
      from public.inventory_reservations
      where lot_id = (v_reservation->>'lot_id')::uuid and status = 'active';

      if v_requested > greatest(v_lot_qty - v_already_reserved, 0) + 0.0005 then
        raise exception 'stock_changed: lot % only % available, % requested',
          v_reservation->>'lot_id',
          greatest(v_lot_qty - v_already_reserved, 0),
          v_requested;
      end if;

      insert into public.inventory_reservations (
        user_id, plan_version_id, slot_id, lot_id, canonical_food_id,
        ingredient_name, reserved_quantity, reserved_unit,
        needed_quantity, needed_unit, metadata
      ) values (
        v_uid,
        v_version_id,
        (v_slot_map->>(v_reservation->>'slot_key'))::uuid,
        (v_reservation->>'lot_id')::uuid,
        nullif(v_reservation->>'canonical_food_id', '')::bigint,
        v_reservation->>'ingredient_name',
        v_requested,
        v_reservation->>'reserved_unit',
        nullif(v_reservation->>'needed_quantity', '')::numeric,
        nullif(v_reservation->>'needed_unit', ''),
        coalesce(v_reservation->'metadata', '{}'::jsonb)
      );
    end loop;
  end if;

  -- On remplace uniquement les tâches automatiques encore ouvertes.
  delete from public.nutrition_plan_prep_tasks
  where import_id = v_import_id and source = 'closed_loop' and done = false;

  for v_task in
    select value from jsonb_array_elements(coalesce(p_payload->'tasks', '[]'::jsonb))
  loop
    insert into public.nutrition_plan_prep_tasks (
      import_id, prep_date, prep_label, task, estimated_time, done,
      plan_version_id, meal_plan_slot_id, stable_key, task_type,
      workflow_status, earliest_start_at, due_at, safety_deadline_at,
      duration_min, priority, source, instructions_json
    ) values (
      v_import_id,
      (v_task->>'prep_date')::date,
      coalesce(nullif(v_task->>'prep_label', ''), 'À préparer'),
      v_task->>'title',
      case when nullif(v_task->>'duration_min', '') is not null
        then (v_task->>'duration_min') || ' min' else null end,
      false,
      v_version_id,
      nullif(v_slot_map->>(v_task->>'slot_key'), '')::uuid,
      v_task->>'task_key',
      coalesce(nullif(v_task->>'task_type', ''), 'prepare'),
      'pending',
      nullif(v_task->>'earliest_start_at', '')::timestamptz,
      nullif(v_task->>'due_at', '')::timestamptz,
      nullif(v_task->>'safety_deadline_at', '')::timestamptz,
      nullif(v_task->>'duration_min', '')::integer,
      coalesce(nullif(v_task->>'priority', '')::integer, 50),
      'closed_loop',
      coalesce(v_task->'instructions', '[]'::jsonb)
    ) returning id into v_task_id;

    v_task_map := v_task_map || jsonb_build_object(v_task->>'task_key', v_task_id);
  end loop;

  for v_dependency in
    select value from jsonb_array_elements(coalesce(p_payload->'dependencies', '[]'::jsonb))
  loop
    insert into public.prep_task_dependencies (
      user_id, plan_version_id, task_id, depends_on_task_id
    ) values (
      v_uid,
      v_version_id,
      (v_task_map->>(v_dependency->>'task_key'))::bigint,
      (v_task_map->>(v_dependency->>'depends_on_task_key'))::bigint
    );
  end loop;

  -- Les articles déjà achetés sont conservés jusqu'au rangement ; le reste est
  -- recalculé depuis les besoins structurés et le stock effectivement disponible.
  delete from public.nutrition_plan_shopping_items
  where import_id = v_import_id and coalesce(checked, false) = false;

  for v_item in
    select value from jsonb_array_elements(coalesce(p_payload->'shopping_items', '[]'::jsonb))
  loop
    insert into public.nutrition_plan_shopping_items (
      import_id, week_label, category, product_name, quantity, checked,
      canonical_food_id, archetype_id, notes, plan_version_id,
      required_qty, stock_qty, reserved_qty, incoming_qty,
      purchase_qty, purchase_unit, shopping_status, planning_source,
      aisle_order, shortage_reason, needed_by
    ) values (
      v_import_id,
      coalesce(nullif(v_item->>'week_label', ''), 'S1'),
      v_item->>'category',
      v_item->>'product_name',
      v_item->>'display_quantity',
      false,
      nullif(v_item->>'canonical_food_id', '')::bigint,
      nullif(v_item->>'archetype_id', '')::bigint,
      nullif(v_item->>'notes', ''),
      v_version_id,
      nullif(v_item->>'required_qty', '')::numeric,
      nullif(v_item->>'stock_qty', '')::numeric,
      nullif(v_item->>'reserved_qty', '')::numeric,
      nullif(v_item->>'incoming_qty', '')::numeric,
      nullif(v_item->>'purchase_qty', '')::numeric,
      v_item->>'purchase_unit',
      coalesce(nullif(v_item->>'shopping_status', ''), 'needed'),
      'closed_loop',
      coalesce(nullif(v_item->>'aisle_order', '')::integer, 999),
      nullif(v_item->>'shortage_reason', ''),
      nullif(v_item->>'needed_by', '')::date
    );
  end loop;

  update public.nutrition_plan_imports
  set active_plan_version_id = v_version_id
  where id = v_import_id;

  insert into public.decision_audit_log (
    user_id, plan_version_id, decision_type, rules_version,
    input_fingerprint, decision
  ) values (
    v_uid,
    v_version_id,
    'publish_plan',
    coalesce(nullif(p_payload->>'rules_version', ''), 'closed-loop-v1'),
    p_payload->>'input_hash',
    jsonb_build_object(
      'status', v_status,
      'version_no', v_version_no,
      'blockers', v_blockers,
      'slots', jsonb_array_length(coalesce(p_payload->'slots', '[]'::jsonb)),
      'reservations', jsonb_array_length(coalesce(p_payload->'reservations', '[]'::jsonb)),
      'tasks', jsonb_array_length(coalesce(p_payload->'tasks', '[]'::jsonb)),
      'recipe_snapshots', jsonb_array_length(coalesce(p_payload->'recipe_snapshots', '[]'::jsonb)),
      'shopping_items', jsonb_array_length(coalesce(p_payload->'shopping_items', '[]'::jsonb))
    )
  );

  return jsonb_build_object(
    'plan_version_id', v_version_id,
    'version_no', v_version_no,
    'status', v_status,
    'blockers', v_blockers
  );
end;
$$;

grant execute on function public.publish_closed_loop_plan(jsonb) to authenticated;

-- Tâche : terminer, rouvrir ou reporter sans contourner la propriété de l'import.
create or replace function public.set_prep_task_state(
  p_task_id bigint,
  p_action text,
  p_snoozed_until timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_task public.nutrition_plan_prep_tasks%rowtype;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;

  select t.* into v_task
  from public.nutrition_plan_prep_tasks t
  join public.nutrition_plan_imports i on i.id = t.import_id
  where t.id = p_task_id and i.user_id = v_uid
  for update of t;

  if v_task.id is null then raise exception 'task_not_found'; end if;

  if p_action = 'complete' then
    update public.nutrition_plan_prep_tasks
    set done = true, done_at = now(), workflow_status = 'done', snoozed_until = null
    where id = p_task_id;
  elsif p_action = 'reopen' then
    update public.nutrition_plan_prep_tasks
    set done = false, done_at = null, workflow_status = 'pending', snoozed_until = null
    where id = p_task_id;
  elsif p_action = 'snooze' and p_snoozed_until is not null then
    update public.nutrition_plan_prep_tasks
    set done = false, workflow_status = 'snoozed', snoozed_until = p_snoozed_until
    where id = p_task_id;
  else
    raise exception 'invalid_task_action';
  end if;

  return (
    select jsonb_build_object(
      'id', id, 'done', done, 'done_at', done_at,
      'workflow_status', workflow_status, 'snoozed_until', snoozed_until
    )
    from public.nutrition_plan_prep_tasks where id = p_task_id
  );
end;
$$;

grant execute on function public.set_prep_task_state(bigint, text, timestamptz) to authenticated;

-- Résultat réel d'un repas : feedback + état du créneau + libération des réservations.
create or replace function public.record_meal_plan_outcome(
  p_slot_id uuid,
  p_adherence text default 'planned',
  p_rating integer default null,
  p_reason_codes text[] default '{}'::text[],
  p_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_slot public.meal_plan_slots%rowtype;
  v_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_adherence not in ('planned', 'substituted', 'skipped', 'improvised', 'leftover') then
    raise exception 'invalid_adherence';
  end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then
    raise exception 'invalid_rating';
  end if;

  select * into v_slot
  from public.meal_plan_slots
  where id = p_slot_id and user_id = v_uid
  for update;

  if v_slot.id is null then raise exception 'slot_not_found'; end if;

  v_status := case p_adherence
    when 'skipped' then 'skipped'
    when 'substituted' then 'substituted'
    when 'improvised' then 'substituted'
    else 'completed'
  end;

  update public.meal_plan_slots
  set status = v_status, updated_at = now()
  where id = p_slot_id;

  insert into public.meal_feedback (
    user_id, slot_id, plan_version_id, adherence, rating, reason_codes, notes
  ) values (
    v_uid, p_slot_id, v_slot.plan_version_id, p_adherence,
    p_rating, coalesce(p_reason_codes, '{}'::text[]), p_notes
  );

  update public.inventory_reservations
  set status = case when p_adherence in ('planned', 'leftover') then 'consumed' else 'released' end,
      consumed_at = case when p_adherence in ('planned', 'leftover') then now() else consumed_at end,
      released_at = case when p_adherence not in ('planned', 'leftover') then now() else released_at end,
      metadata = metadata || jsonb_build_object('outcome', p_adherence)
  where slot_id = p_slot_id and status = 'active';

  insert into public.decision_audit_log (
    user_id, plan_version_id, decision_type, rules_version, decision
  ) values (
    v_uid, v_slot.plan_version_id, 'meal_outcome', 'closed-loop-v1',
    jsonb_build_object('slot_id', p_slot_id, 'adherence', p_adherence, 'rating', p_rating)
  );

  return jsonb_build_object('slot_id', p_slot_id, 'status', v_status, 'adherence', p_adherence);
end;
$$;

grant execute on function public.record_meal_plan_outcome(uuid, text, integer, text[], text) to authenticated;

-- Sauvegarde atomique du foyer et de ses cibles. Cette RPC remplace l'ancien
-- delete/insert côté API et interdit toute modification de schéma à l'exécution.
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

  delete from public.user_health_goals where user_id = v_uid;

  for v_goal in select value from jsonb_array_elements(p_goals)
  loop
    v_name := trim(v_goal->>'person_name');

    select id into v_member_id
    from public.household_members
    where user_id = v_uid and lower(name) = lower(v_name)
    for update;

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

    -- Plusieurs corrections le même jour remplacent la version du jour ; les
    -- versions antérieures sont fermées sans chevauchement.
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

grant execute on function public.save_household_nutrition(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Reprise des données : membres et cibles existantes, sans identifiants codés
-- ---------------------------------------------------------------------------

insert into public.household_members (user_id, name)
select distinct src.user_id, src.person_name
from (
  select g.user_id, g.person_name
  from public.user_health_goals g
  where nullif(trim(g.person_name), '') is not null
  union
  select i.user_id, m.person_name
  from public.nutrition_plan_meals m
  join public.nutrition_plan_imports i on i.id = m.import_id
  where nullif(trim(m.person_name), '') is not null
) src
where not exists (
  select 1 from public.household_members hm
  where hm.user_id = src.user_id and lower(hm.name) = lower(src.person_name)
);

insert into public.nutrition_target_versions (
  user_id, member_id, effective_from,
  target_kcal, target_protein_g, target_carbs_g, target_fat_g, target_fiber_g,
  source, rationale
)
select
  g.user_id,
  hm.id,
  coalesce(g.updated_at::date, g.created_at::date, current_date),
  g.target_calories,
  g.target_protein_g,
  g.target_carbs_g,
  g.target_fat_g,
  g.target_fiber_g,
  'legacy_goal',
  jsonb_build_object('migrated_from', 'user_health_goals')
from public.user_health_goals g
join public.household_members hm
  on hm.user_id = g.user_id and lower(hm.name) = lower(g.person_name)
where not exists (
  select 1 from public.nutrition_target_versions nt
  where nt.member_id = hm.id and nt.source = 'legacy_goal'
);

commit;
