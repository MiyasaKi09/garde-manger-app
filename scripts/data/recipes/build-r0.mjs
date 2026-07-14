/**
 * Fabrique V2 — chargeur du corpus recette R0 (data-v2/recipe-factory).
 * Réf. MYKO_DATA_FOUNDATION_V2 §6, §11.
 *
 * Lit data/recipes/r0.json (contenu éditorial propre, CC0) et émet le SQL qui insère
 * les recettes en CANDIDATES (publication_status='draft') dans le schéma culinary,
 * rattache au mieux chaque ingrédient à une food_form existante, et liste la LISTE
 * FONCTIONNELLE d'aliments (union des ingrédients) = cible de reconstruction F0.
 *
 * Usage : node scripts/data/recipes/build-r0.mjs  →  scripts/data/out/r0-load.sql
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'out')
const corpus = JSON.parse(readFileSync(join(ROOT, 'data', 'recipes', 'r0.json'), 'utf8'))

const q = (s) => `'${String(s).replace(/'/g, "''")}'`
const idOrNull = (norm) =>
  // rattachement best-effort : concept dont le nom normalisé recoupe l'ingrédient
  // (égalité, ou l'un contient l'autre), forme représentative la plus courte.
  `(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = ${q(norm)}
       or position(${q(norm)} in fc.canonical_name_normalized) > 0
       or (length(${q(norm)}) >= 5 and position(fc.canonical_name_normalized in ${q(norm)}) > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1)`

let sql = `-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. Idempotent.
insert into ops.source_datasets (code,name,publisher,source_url,license_code,allowed_uses,update_strategy,current_version,last_checked_at)
values ('myko_editorial','Recettes éditoriales Myko','Myko','internal','cc0-1.0',
        '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
        'manual','r0',now())
on conflict (code) do update set last_checked_at=now();
`

const foods = new Map() // normalized -> display
for (const r of corpus.recipes) {
  const famNorm = normalizeName(r.family)
  const verHash = `md5(${q('r0:' + famNorm + ':v1')})`
  const compVars = r.components.map((c) => `v_comp_${normalizeName(c.name).replace(/[^a-z0-9]+/g, '_')}`)
  sql += `\nDO $$\nDECLARE v_fam uuid; v_ver uuid; ${compVars.map((v) => `${v} uuid`).join('; ')};\nBEGIN\n`
  sql += `  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES(${q(r.family)},${q(famNorm)},${q(r.meal_role)},${q(r.dish_structure)},'candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;\n`
  const v = r.version
  sql += `  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,${q(v.title)},sd.id,${q('r0:' + famNorm)},${v.servings},${v.prep_minutes},${v.cook_minutes},${q(v.difficulty)},'C','draft',${verHash}
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;\n`
  sql += `  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=${verHash};\n`
  // components
  r.components.forEach((c, i) => {
    const vn = compVars[i]
    sql += `  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,${q(c.name)},${q(c.role)},${c.position}) RETURNING id INTO ${vn};\n`
  })
  // ingredients
  r.ingredients.forEach((ing, i) => {
    const norm = normalizeName(ing.food)
    foods.set(norm, ing.food)
    const compIdx = r.components.findIndex((c) => c.name === ing.component)
    const compVar = compIdx >= 0 ? compVars[compIdx] : 'NULL'
    const pref = ing.requirement_type === 'seasoning_to_taste' ? 'NULL' : idOrNull(norm)
    sql += `  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,${compVar},${q(ing.requirement_type)},${pref},${ing.quantity},${q(ing.unit)},${q(ing.strictness)},${ing.culinary_role ? q(ing.culinary_role) : 'NULL'},${ing.is_optional ? 'true' : 'false'},${i + 1});\n`
  })
  // steps
  for (const s of r.steps) {
    sql += `  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,${s.n},${q(s.instruction)},${s.active_minutes ?? 'NULL'},${s.passive_minutes ?? 'NULL'},${s.temperature_c ?? 'NULL'});\n`
  }
  // variation axes + options
  for (const ax of r.variation_axes || []) {
    sql += `  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required)
      VALUES(v_fam,${q(ax.name)},${q(ax.selection_mode)},true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,confidence_level,status)
      SELECT ax.id, x.name, 'C','candidate' FROM ax, (VALUES ${ax.options.map((o) => `(${q(o)})`).join(',')}) AS x(name);\n`
  }
  sql += `END $$;\n`
}

// Liste fonctionnelle (union des ingrédients) — cible de reconstruction F0.
const foodList = [...foods.entries()].sort()
sql += `\n-- Liste fonctionnelle F0 dérivée de R0 : ${foodList.length} aliments distincts.\n`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'r0-load.sql'), sql)
writeFileSync(join(OUT, 'r0-functional-foods.json'),
  JSON.stringify({ count: foodList.length, foods: foodList.map(([norm, disp]) => ({ normalized: norm, name: disp })) }, null, 2))
console.log(JSON.stringify({ recipes: corpus.recipes.length, distinct_ingredient_foods: foodList.length, sql_bytes: Buffer.byteLength(sql) }, null, 2))
