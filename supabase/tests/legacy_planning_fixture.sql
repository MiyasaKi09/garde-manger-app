-- Minimal historical planning state present in production before the
-- post-snapshot migrations are applied in CI scenario B.
create table if not exists public.nutrition_plan_meals (
  id bigserial primary key,
  import_id bigint not null,
  person_name text not null,
  household_member_id uuid,
  meal_date date not null,
  meal_type text not null,
  day_type text,
  short_label text,
  description text not null,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  batch_recipe_id bigint,
  generated_recipe_id bigint,
  is_leftover boolean not null default false,
  cooked_dish_id bigint,
  meal_plan_slot_id uuid,
  planned_servings numeric(6,2) not null default 1,
  locked boolean not null default false,
  nutrition_source text not null default 'legacy',
  nutrition_confidence numeric(4,3)
);

create table if not exists public.meal_plan_validation_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_version_id uuid not null,
  slot_id uuid,
  severity text not null
    check (severity in ('blocker', 'error', 'warning', 'info')),
  code text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
