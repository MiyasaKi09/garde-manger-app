-- A validation warning must never roll back an otherwise executable weekly
-- plan simply because an older or alternate caller omitted its display text.
create or replace function public.ensure_plan_validation_issue_message()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.code := coalesce(nullif(btrim(new.code), ''), 'planning_rule');
  new.message := coalesce(
    nullif(btrim(new.message), ''),
    case new.code
      when 'fish_quota' then 'Le nombre de repas de poisson recommandé n’est pas atteint.'
      when 'meat_max' then 'Le nombre maximal de repas de viande est dépassé.'
      when 'vegetarian_min' then 'Le nombre minimal de repas végétariens n’est pas atteint.'
      when 'red_meat_min' then 'Le repère hebdomadaire de viande rouge n’est pas atteint.'
      when 'fatty_fish_min' then 'Le repère hebdomadaire de poisson gras n’est pas atteint.'
      when 'legumes_min' then 'Le nombre minimal de repas avec légumineuses n’est pas atteint.'
      when 'cuisines_min' then 'La semaine manque de diversité entre les cuisines proposées.'
      when 'proteins_min' then 'La semaine manque de diversité entre les sources de protéines.'
      when 'no_feasible_plan' then 'Aucun planning ne satisfait toutes les contraintes du foyer.'
      else case
        when new.code like 'protein_repeat_%'
          then 'Une même source de protéines revient trop souvent dans la semaine.'
        else format('La règle de planning « %s » demande une vérification.', new.code)
      end
    end
  );
  new.details := coalesce(new.details, '{}'::jsonb);
  return new;
end
$$;

drop trigger if exists meal_plan_validation_issues_ensure_message
  on public.meal_plan_validation_issues;
create trigger meal_plan_validation_issues_ensure_message
  before insert or update of code, message, details
  on public.meal_plan_validation_issues
  for each row execute function public.ensure_plan_validation_issue_message();

revoke all on function public.ensure_plan_validation_issue_message() from public, anon, authenticated;

comment on function public.ensure_plan_validation_issue_message() is
  'Defensive normalization for planning validation issues; prevents missing display text from aborting plan publication.';
