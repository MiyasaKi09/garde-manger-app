-- Extraction reproductible du snapshot source utilisé par
-- data/foods/ciqual-reference. Lecture seule.
select
  c.alim_code as source_code,
  c.alim_nom_fr as name_fr,
  c.groupe as source_group,
  c.sous_groupe as source_subgroup,
  n.*
from public.ciqual_reference c
left join public.nutritional_data n on n.source_id = c.alim_code
order by c.alim_code::integer, c.alim_code;
