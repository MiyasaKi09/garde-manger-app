-- Minimal historical planning state present in production before the
-- post-snapshot migrations are applied in CI scenario B.
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
