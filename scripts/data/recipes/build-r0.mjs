/**
 * Fabrique V2 — chargeur du corpus recette R0 (data-v2/recipe-factory).
 * Réf. MYKO_DATA_FOUNDATION_V2 §6, §11 + verdict directeur (corrections R0).
 *
 * Corrections :
 *  - content_hash calculé sur le CONTENU CANONIQUE COMPLET (ingrédients, quantités,
 *    étapes, T°, variantes), pas sur le nom → une modif de contenu change le hash.
 *  - SQL IDEMPOTENT : upsert version (draft), puis DELETE des enfants avant réinsertion
 *    → une seconde exécution ne duplique rien.
 *  - Rattachement d'ingrédient à une forme par IDENTITÉ EXACTE (nom de forme normalisé,
 *    état inclus). Plus de « nom le plus court » : si aucune forme exacte n'existe,
 *    preferred_food_form_id = NULL → l'aliment est signalé comme forme F0 à fournir.
 *
 * N'APPLIQUE RIEN en base : émet scripts/data/out/r0-load.sql (appliqué post-merge).
 * Usage : node scripts/data/recipes/build-r0.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'out')
const corpus = JSON.parse(readFileSync(join(ROOT, 'data', 'recipes', 'r0.json'), 'utf8'))

const q = (s) => `'${String(s).replace(/'/g, "''")}'`

/** Représentation canonique déterministe d'une recette (base du content_hash). */
function canonicalRecipe(r) {
  const ings = r.ingredients.map((i) => ({
    food: normalizeName(i.food), form: i.form ? normalizeName(i.form) : null,
    q: i.quantity, u: i.unit, t: i.requirement_type, opt: !!i.is_optional,
    options: (i.options || []).map((o) => normalizeName(o)).sort(),
  }))
  const steps = r.steps.map((s) => ({ n: s.n, i: s.instruction, a: s.active_minutes ?? null, p: s.passive_minutes ?? null, t: s.temperature_c ?? null, core: s.target_core_temperature_c ?? null }))
  const axes = (r.variation_axes || []).map((a) => ({ name: normalizeName(a.name), options: a.options.map((o) => normalizeName(o)).sort() }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return JSON.stringify({ family: normalizeName(r.family), title: r.version.title, servings: r.version.servings, ings, steps, axes })
}
const contentHash = (r) => createHash('md5').update(canonicalRecipe(r)).digest('hex')

/** Forme par IDENTITÉ EXACTE (nom de forme normalisé). NULL si absente. */
function exactFormSql(ing) {
  const target = normalizeName(ing.form || ing.food)
  return `(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = ${q(target)}
     order by ff.canonical_name_normalized limit 1)`
}

let sql = `-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. IDEMPOTENT.
insert into ops.source_datasets (code,name,publisher,source_url,license_code,allowed_uses,update_strategy,current_version,last_checked_at)
values ('myko_editorial','Recettes éditoriales Myko','Myko','internal','cc0-1.0',
        '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
        'manual','r0',now())
on conflict (code) do update set last_checked_at=now();
`

const foods = new Map()
for (const r of corpus.recipes) {
  const famNorm = normalizeName(r.family)
  const hash = contentHash(r)
  const compVars = r.components.map((c) => `v_comp_${normalizeName(c.name).replace(/[^a-z0-9]+/g, '_')}`)
  sql += `\nDO $$\nDECLARE v_fam uuid; v_ver uuid; ${compVars.map((v) => `${v} uuid`).join('; ')};\nBEGIN\n`
  sql += `  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES(${q(r.family)},${q(famNorm)},${q(r.meal_role)},${q(r.dish_structure)},'candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;\n`
  // upsert version (draft) par (famille, version 1) — met à jour le content_hash.
  sql += `  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,${q(r.version.title)},sd.id,${q('r0:' + famNorm)},'Myko','cc0-1.0',${r.version.servings},${r.version.prep_minutes},${r.version.cook_minutes},${q(r.version.difficulty)},'C','draft',${q(hash)}
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;\n`
  // idempotence : purge des enfants de cette version avant réinsertion.
  sql += `  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;\n`
  r.components.forEach((c, i) => {
    sql += `  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,${q(c.name)},${q(c.role)},${c.position}) RETURNING id INTO ${compVars[i]};\n`
  })
  r.ingredients.forEach((ing, i) => {
    foods.set(normalizeName(ing.form || ing.food), ing.form || ing.food)
    const compIdx = ing.component == null ? -1 : r.components.findIndex((c) => c.name === ing.component)
    const compVar = compIdx >= 0 ? compVars[compIdx] : 'NULL'
    const pref = ing.requirement_type === 'seasoning_to_taste' ? 'NULL' : exactFormSql(ing)
    sql += `  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,${compVar},${q(ing.requirement_type)},${pref},${ing.quantity},${q(ing.unit)},${q(ing.strictness)},${ing.culinary_role ? q(ing.culinary_role) : 'NULL'},${ing.preparation_note ? q(ing.preparation_note) : 'NULL'},${ing.is_optional ? 'true' : 'false'},${i + 1});\n`
    // options d'une exigence validated_options : lignes recipe_requirement_options réelles.
    if (ing.requirement_type === 'validated_options' && Array.isArray(ing.options)) {
      ing.options.forEach((opt, oi) => {
        const optNorm = normalizeName(opt)
        sql += `  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff where ff.status<>'rejected' and ff.canonical_name_normalized=${q(optNorm)} limit 1), ${oi + 1}, 1, 0, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=${i + 1}
          AND (select ff.id from catalog.food_forms ff where ff.status<>'rejected' and ff.canonical_name_normalized=${q(optNorm)} limit 1) IS NOT NULL;\n`
      })
    }
  })
  for (const s of r.steps) {
    sql += `  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,${s.n},${q(s.instruction)},${s.active_minutes ?? 'NULL'},${s.passive_minutes ?? 'NULL'},${s.temperature_c ?? 'NULL'},${s.target_core_temperature_c ?? 'NULL'});\n`
  }
  for (const ax of r.variation_axes || []) {
    sql += `  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,${q(ax.name)},${q(ax.selection_mode)},true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ${ax.options.map((o) => `(${q(o)})`).join(',')}) AS x(name);\n`
  }
  sql += `END $$;\n`
}

const foodList = [...foods.entries()].sort()
sql += `\n-- Liste fonctionnelle F0 dérivée de R0 : ${foodList.length} formes distinctes requises.\n`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'r0-load.sql'), sql)
writeFileSync(join(OUT, 'r0-functional-foods.json'),
  JSON.stringify({ count: foodList.length, forms: foodList.map(([norm, disp]) => ({ normalized: norm, name: disp })) }, null, 2))
console.log(JSON.stringify({ recipes: corpus.recipes.length, distinct_required_forms: foodList.length, sql_bytes: Buffer.byteLength(sql) }, null, 2))
