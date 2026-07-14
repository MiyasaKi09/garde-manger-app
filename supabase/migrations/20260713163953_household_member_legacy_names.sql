-- Mapping des noms historiques (person_name) → membre du foyer. Appliqué en prod,
-- idempotent. Réf. plan directeur PR 1, §9.10.
create table if not exists public.household_member_legacy_names (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_member_id uuid not null references public.household_members(id) on delete cascade,
  normalized_name text not null,
  raw_name text,
  created_at timestamptz not null default now(),
  unique (user_id, normalized_name)
);

alter table public.household_member_legacy_names enable row level security;

drop policy if exists hmln_owner_all on public.household_member_legacy_names;
create policy hmln_owner_all on public.household_member_legacy_names
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.household_member_legacy_names from anon;

-- Backfill 1 : forme normalisée du nom canonique de chaque membre.
insert into public.household_member_legacy_names (user_id, household_member_id, normalized_name, raw_name)
select m.user_id, m.id, lower(btrim(public.unaccent(m.name))), m.name
from public.household_members m
where m.name is not null
on conflict (user_id, normalized_name) do nothing;

-- Backfill 2 : variantes d'orthographe rencontrées dans les tables historiques
-- (person_name), rattachées au membre du même utilisateur par nom normalisé.
insert into public.household_member_legacy_names (user_id, household_member_id, normalized_name, raw_name)
select distinct src.user_id, m.id, src.norm, src.raw
from (
  select user_id, person_name as raw, lower(btrim(public.unaccent(person_name))) as norm
    from public.meal_log where person_name is not null
  union
  select user_id, person_name, lower(btrim(public.unaccent(person_name)))
    from public.weight_entries where person_name is not null
  union
  select user_id, person_name, lower(btrim(public.unaccent(person_name)))
    from public.user_health_goals where person_name is not null
) src
join public.household_members m
  on m.user_id = src.user_id
 and lower(btrim(public.unaccent(m.name))) = src.norm
on conflict (user_id, normalized_name) do nothing;
