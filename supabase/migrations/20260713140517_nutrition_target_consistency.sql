-- already applied on production (versioned faithfully from supabase_migrations.schema_migrations)
-- version: 20260713140517  ·  name: nutrition_target_consistency

-- Une seule cible nutritionnelle effective par membre et par jour civil.
--
-- Le backfill legacy peut avoir créé une cible le jour même où l'utilisateur
-- enregistre son profil. La nouvelle cible doit remplacer cette projection au
-- lieu de coexister avec elle dans un ordre de lecture indéterminé.

begin;

with ranked as (
  select
    id,
    row_number() over (
      partition by member_id, effective_from
      order by
        case source when 'user_profile' then 2 when 'legacy_goal' then 0 else 1 end desc,
        created_at desc,
        id desc
    ) as position
  from public.nutrition_target_versions
)
delete from public.nutrition_target_versions target
using ranked
where target.id = ranked.id and ranked.position > 1;

create unique index if not exists uq_nutrition_targets_member_day
  on public.nutrition_target_versions (member_id, effective_from);

create or replace function public.replace_same_day_nutrition_target()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.nutrition_target_versions existing
  where existing.user_id = new.user_id
    and existing.member_id = new.member_id
    and existing.effective_from = new.effective_from;
  return new;
end;
$$;

drop trigger if exists trg_replace_same_day_nutrition_target
  on public.nutrition_target_versions;
create trigger trg_replace_same_day_nutrition_target
before insert on public.nutrition_target_versions
for each row execute function public.replace_same_day_nutrition_target();

revoke all on function public.replace_same_day_nutrition_target() from public, anon, authenticated;
grant execute on function public.replace_same_day_nutrition_target() to authenticated, service_role;

commit;
