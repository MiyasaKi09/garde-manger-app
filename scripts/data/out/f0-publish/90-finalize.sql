-- Publication F0 · finalize (review_tasks anomalies + release published)
create temp table _w (w jsonb);
insert into _w select value from jsonb_array_elements($json$[{"a":"20004","cnn":"bette ou blette crue","w":["salt_sodium_mismatch"]},{"a":"20017","cnn":"chou fleur cuit","w":["salt_sodium_mismatch"]},{"a":"20030","cnn":"haricot vert cuit","w":["salt_sodium_mismatch"]},{"a":"11080","cnn":"herbes aromatiques fraiches aliment moyen","w":["salt_sodium_mismatch"]},{"a":"11014","cnn":"persil frais","w":["salt_sodium_mismatch"]},{"a":"1003","cnn":"liqueur","w":["energy_divergent:51%"]},{"a":"1015","cnn":"marsala","w":["energy_divergent:47%"]},{"a":"1021","cnn":"creme de cassis","w":["energy_divergent:33%"]}]$json$::jsonb);
insert into quality.review_tasks (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
select 'food_form', ff.id, 'nutrition_anomaly', 40,
       array(select jsonb_array_elements_text(w.w->'w')),
       jsonb_build_object('source','ciqual_2020','alim_code', w.w->>'a'), 'open'
from _w w join catalog.food_forms ff on ff.canonical_name_normalized = w.w->>'cnn'
where not exists (select 1 from quality.review_tasks rt where rt.entity_id = ff.id and rt.task_type = 'nutrition_anomaly');
drop table _w;

update ops.catalog_releases
set status = 'published', published_at = now(),
    quality_report = quality_report || jsonb_build_object(
      'published_forms', (select count(*) from catalog.food_forms where confidence_level='B' and status='published'),
      'nutrition_profiles', (select count(*) from catalog.food_nutrition_profiles where data_version='2020-07-07'),
      'nutrient_values', (select count(*) from catalog.food_nutrient_values v join catalog.food_nutrition_profiles p on p.id=v.nutrition_profile_id where p.data_version='2020-07-07'),
      'review_tasks', (select count(*) from quality.review_tasks where task_type='nutrition_anomaly'))
where version = 'F0-2020.07.07';
