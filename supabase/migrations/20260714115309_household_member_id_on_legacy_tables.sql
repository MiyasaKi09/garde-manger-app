-- Rattache les lignes historiques (person_name) à un membre du foyer, sans
-- supprimer person_name (projection de compatibilité). Appliqué en prod,
-- idempotent. Réf. plan directeur PR 1, §9.10.
alter table public.meal_log                    add column if not exists household_member_id uuid references public.household_members(id) on delete set null;
alter table public.user_health_goals           add column if not exists household_member_id uuid references public.household_members(id) on delete set null;
alter table public.weight_entries              add column if not exists household_member_id uuid references public.household_members(id) on delete set null;
alter table public.nutrition_plan_meals        add column if not exists household_member_id uuid references public.household_members(id) on delete set null;
alter table public.nutrition_plan_daily_totals add column if not exists household_member_id uuid references public.household_members(id) on delete set null;

-- Backfill — tables avec user_id direct
update public.meal_log t set household_member_id = ln.household_member_id
from public.household_member_legacy_names ln
where t.household_member_id is null and t.person_name is not null
  and ln.user_id = t.user_id and ln.normalized_name = lower(btrim(public.unaccent(t.person_name)));

update public.user_health_goals t set household_member_id = ln.household_member_id
from public.household_member_legacy_names ln
where t.household_member_id is null and t.person_name is not null
  and ln.user_id = t.user_id and ln.normalized_name = lower(btrim(public.unaccent(t.person_name)));

update public.weight_entries t set household_member_id = ln.household_member_id
from public.household_member_legacy_names ln
where t.household_member_id is null and t.person_name is not null
  and ln.user_id = t.user_id and ln.normalized_name = lower(btrim(public.unaccent(t.person_name)));

-- Backfill — tables « import-scoped » (user via nutrition_plan_imports)
update public.nutrition_plan_meals t set household_member_id = ln.household_member_id
from public.nutrition_plan_imports imp
join public.household_member_legacy_names ln on ln.user_id = imp.user_id
where t.household_member_id is null and t.person_name is not null
  and imp.id = t.import_id and ln.normalized_name = lower(btrim(public.unaccent(t.person_name)));

update public.nutrition_plan_daily_totals t set household_member_id = ln.household_member_id
from public.nutrition_plan_imports imp
join public.household_member_legacy_names ln on ln.user_id = imp.user_id
where t.household_member_id is null and t.person_name is not null
  and imp.id = t.import_id and ln.normalized_name = lower(btrim(public.unaccent(t.person_name)));

create index if not exists idx_meal_log_household_member             on public.meal_log(household_member_id);
create index if not exists idx_nutrition_plan_meals_household_member on public.nutrition_plan_meals(household_member_id);
