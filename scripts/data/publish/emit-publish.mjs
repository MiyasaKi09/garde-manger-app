/**
 * Fabrique V2 — génère le SQL de PUBLICATION de la release F0 (idempotent).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.4 (Publish), §7.6 (release atomique).
 *
 * Encodage compact (codes courts) pour un payload minimal :
 *   scripts/data/out/f0-publish/00-setup.sql   source + blob + release + concepts
 *   scripts/data/out/f0-publish/10-forms.sql   formes + profils + valeurs (300, 1 payload)
 *   scripts/data/out/f0-publish/90-finalize.sql release→published + review_tasks
 *
 * Usage : node scripts/data/publish/emit-publish.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'out')
const PUB = join(OUT, 'f0-publish')
const release = JSON.parse(readFileSync(join(OUT, 'f0-release.json'), 'utf8'))

// code court → [nutrient_code, unité]. Couvre le minimum §10.16 + macros.
const CODES = {
  e: ['energy_kcal', 'kcal'], p: ['protein_g', 'g'], c: ['carbohydrate_g', 'g'],
  f: ['fat_g', 'g'], su: ['sugars_g', 'g'], fb: ['fiber_g', 'g'], sf: ['saturated_fat_g', 'g'],
  sl: ['salt_g', 'g'], na: ['sodium_mg', 'mg'], ca: ['calcium_mg', 'mg'], fe: ['iron_mg', 'mg'],
  mg: ['magnesium_mg', 'mg'], k: ['potassium_mg', 'mg'], ph: ['phosphorus_mg', 'mg'],
  zn: ['zinc_mg', 'mg'], io: ['iodine_ug', 'µg'], se: ['selenium_ug', 'µg'],
  va: ['retinol_ug', 'µg'], vd: ['vitamin_d_ug', 'µg'], vc: ['vitamin_c_mg', 'mg'],
  b9: ['vitamin_b9_ug', 'µg'], b12: ['vitamin_b12_ug', 'µg'],
}
const FULL_TO_SHORT = Object.fromEntries(Object.entries(CODES).map(([s, [full]]) => [full, s]))
const BLOB_SHA = 'a728c29d8d3c944aa679d62d7a2e591c80bac512059ea6772af95760f65da75d'
const RELEASE_VERSION = 'F0-2020.07.07'

const jlit = (obj) => `$json$${JSON.stringify(obj)}$json$`
mkdirSync(PUB, { recursive: true })

// ── Formes compactes ────────────────────────────────────────────────────────
const forms = release.forms.map((f) => {
  const v = {}
  const s = {}
  for (const [full, amt] of Object.entries(f.nutrition.values)) {
    const sc = FULL_TO_SHORT[full]
    if (sc == null || amt == null) continue
    v[sc] = amt
    const st = f.nutrition.statuses[full]
    if (st && st !== 'measured' && st !== 'not_available') s[sc] = st
  }
  const a = f.attributes
  return {
    a: f.alim_code, con: f.concept_normalized, cn: f.canonical_name, cnn: f.canonical_name_normalized,
    at: [a.cooking_state, a.preservation_state, a.physical_state, a.bone_state, a.skin_state].map((x) => x || '').join('|'),
    v, ...(Object.keys(s).length ? { s } : {}),
  }
})

// Table de correspondance code court → (code, unité) en VALUES.
const codeRows = Object.entries(CODES).map(([sc, [code, unit]]) => `('${sc}','${code}','${unit}')`).join(',')

const CHUNK = 100
const formChunks = []
for (let i = 0; i < forms.length; i += CHUNK) formChunks.push(forms.slice(i, i + CHUNK))
formChunks.forEach((chunk, ci) => {
  const label = String.fromCharCode(97 + ci) // a,b,c
  writeFileSync(join(PUB, `10${label}-forms.sql`), chunkSql(chunk, ci + 1, formChunks.length))
})

function chunkSql(chunk, part, total) {
  return `-- Publication F0 · formes (lot ${part}/${total}, ${chunk.length}) — payload compact. Idempotent.
create temp table _b (f jsonb);
insert into _b select value from jsonb_array_elements(${jlit(chunk)}::jsonb);
create temp table _m (sc text primary key, code text, unit text);
insert into _m values ${codeRows};

-- Formes (publiées, confiance B).
insert into catalog.food_forms
  (food_concept_id, canonical_name, canonical_name_normalized, cooking_state,
   preservation_state, physical_state, bone_state, skin_state,
   default_quantity_unit, status, confidence_level)
select fc.id, b.f->>'cn', b.f->>'cnn',
       nullif(split_part(b.f->>'at','|',1),''), nullif(split_part(b.f->>'at','|',2),''),
       nullif(split_part(b.f->>'at','|',3),''), nullif(split_part(b.f->>'at','|',4),''),
       nullif(split_part(b.f->>'at','|',5),''), 'g', 'published', 'B'
from _b b join catalog.food_concepts fc on fc.canonical_name_normalized = b.f->>'con'
on conflict (food_concept_id, canonical_name_normalized) do nothing;

-- Profils nutritionnels (1 par forme, primaire, publié).
insert into catalog.food_nutrition_profiles
  (food_form_id, source_dataset_id, source_record_key, basis_quantity, basis_unit,
   data_version, confidence_level, is_primary, published_at)
select ff.id, sd.id, b.f->>'a', 100, 'g', '2020-07-07', 'B', true, now()
from _b b
join catalog.food_concepts fc on fc.canonical_name_normalized = b.f->>'con'
join catalog.food_forms ff on ff.food_concept_id = fc.id and ff.canonical_name_normalized = b.f->>'cnn'
cross join (select id from ops.source_datasets where code = 'ciqual_2020') sd
on conflict (source_dataset_id, source_record_key, data_version) do nothing;

-- Valeurs de nutriments (code court → code+unité via _m ; statut mesuré par défaut).
insert into catalog.food_nutrient_values (nutrition_profile_id, nutrient_code, amount, unit, value_status)
select p.id, m.code, kv.value::numeric, m.unit, coalesce(b.f->'s'->>kv.key, 'measured')
from _b b
cross join (select id from ops.source_datasets where code = 'ciqual_2020') sd
join catalog.food_nutrition_profiles p
  on p.source_dataset_id = sd.id and p.data_version = '2020-07-07' and p.source_record_key = b.f->>'a'
join lateral jsonb_each_text(b.f->'v') kv on true
join _m m on m.sc = kv.key
on conflict (nutrition_profile_id, nutrient_code) do nothing;

drop table _b; drop table _m;
select
  (select count(*) from catalog.food_forms where status='published' and confidence_level='B') as forms,
  (select count(*) from catalog.food_nutrition_profiles where data_version='2020-07-07') as profiles,
  (select count(*) from catalog.food_nutrient_values v join catalog.food_nutrition_profiles p on p.id=v.nutrition_profile_id where p.data_version='2020-07-07') as values;
`
}

// ── Finalize ────────────────────────────────────────────────────────────────
const warned = release.forms.filter((f) => f.warnings.length)
const reviewPayload = warned.map((f) => ({ a: f.alim_code, cnn: f.canonical_name_normalized, w: f.warnings }))
const finalize = `-- Publication F0 · finalize (review_tasks anomalies + release published)
create temp table _w (w jsonb);
insert into _w select value from jsonb_array_elements(${jlit(reviewPayload)}::jsonb);
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
where version = '${RELEASE_VERSION}';
`
writeFileSync(join(PUB, '90-finalize.sql'), finalize)

console.log(JSON.stringify({
  forms: forms.length, nutrients: Object.keys(CODES).length,
  form_chunks: formChunks.length, review_tasks: warned.length,
}, null, 2))
