/**
 * Fabrique V2 — chargeur du corpus recette R0 (data-v2/recipe-factory).
 * Réf. MYKO_DATA_FOUNDATION_V2 §6, §11 + verdicts directeur (corrections + durcissement R0).
 *
 * Garanties :
 *  - content_hash calculé sur le CONTENU CANONIQUE COMPLET : famille, meal_role,
 *    dish_structure, titre, portions, temps, difficulté, composants (+rôle/position),
 *    association ingrédient↔composant, strictness, culinary_role, preparation_note,
 *    options (forme, quantity_factor, quality_impact, branche), étapes (+branche, T°),
 *    branches, axes (+selection_mode). Toute modif de contenu change le hash.
 *  - configuration_hash du run d'import = HASH DU CORPUS (union des hash de recettes) :
 *    un corpus différent produit un run d'import distinct (provenance versionnée).
 *  - provenance RÉÉCRITE à chaque contenu (delete+insert) : jamais de hash périmé.
 *  - VARIANTES EXÉCUTABLES : chaque option validée qui change la cuisson porte une
 *    recipe_instruction_branch propre ; ses étapes y sont rattachées (branch_id) ;
 *    l'option (recipe_requirement_options) pointe la branche + porte quantity_factor
 *    (rendement, ex. désossage) et quality_impact. L'axe de variation relie ses
 *    options aux branches par selection_condition (relation déterministe).
 *  - Liste fonctionnelle F0 = UNION des formes préférées ET de toutes les alternatives
 *    (options validées, options d'axe, formes de branche), assaisonnements inclus.
 *  - Assaisonnements : forme réelle rattachée (Sel fin, Poivre…) + quantité de référence
 *    (pour le sodium) ; `seasoning_to_taste` + is_optional = ajustable au goût.
 *  - SQL IDEMPOTENT : upsert version (draft) puis purge des enfants avant réinsertion.
 *
 * N'APPLIQUE RIEN en base : émet scripts/data/out/r0-load.sql (appliqué post-merge,
 * via le mécanisme de migration/chargement documenté). Usage : node scripts/data/recipes/build-r0.mjs
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
const jsonLit = (o) => `${q(JSON.stringify(o))}::jsonb`
const num = (v) => (v === null || v === undefined ? 'NULL' : Number(v))
const norm = (s) => (s === null || s === undefined ? null : normalizeName(s))

/** Normalise une option validée (string legacy ou objet) en {form, quantity_factor, quality_impact, branch}. */
function optionOf(o) {
  if (typeof o === 'string') return { form: o, quantity_factor: 1, quality_impact: 0, branch: null }
  return { form: o.form, quantity_factor: o.quantity_factor ?? 1, quality_impact: o.quality_impact ?? 0, branch: o.branch ?? null }
}

/** Représentation canonique déterministe et COMPLÈTE d'une recette (base du content_hash). */
export function canonicalRecipe(r) {
  const comps = r.components.map((c) => ({ n: normalizeName(c.name), r: c.role, p: c.position })).sort((a, b) => a.p - b.p)
  const branches = (r.branches || [])
    .map((b) => ({ n: normalizeName(b.name), axis: norm(b.axis), opt: norm(b.option), c: b.confidence ?? null }))
    .sort((a, b) => a.n.localeCompare(b.n))
  const ings = r.ingredients.map((i, idx) => ({
    pos: idx + 1,
    comp: norm(i.component),
    food: normalizeName(i.food),
    form: norm(i.form),
    q: i.quantity, u: i.unit,
    t: i.requirement_type, strict: i.strictness,
    role: norm(i.culinary_role), prep: norm(i.preparation_note),
    opt: !!i.is_optional,
    options: (i.options || []).map(optionOf)
      .map((o) => ({ form: norm(o.form), qf: o.quantity_factor, qi: o.quality_impact, br: o.branch ? normalizeName(o.branch) : null }))
      .sort((a, b) => a.form.localeCompare(b.form)),
  }))
  const steps = r.steps.map((s) => ({
    n: s.n, br: s.branch ? normalizeName(s.branch) : null, i: s.instruction,
    a: s.active_minutes ?? null, p: s.passive_minutes ?? null, t: s.temperature_c ?? null, core: s.target_core_temperature_c ?? null,
  })).sort((a, b) => (a.n - b.n) || String(a.br).localeCompare(String(b.br)))
  const axes = (r.variation_axes || [])
    .map((a) => ({ n: normalizeName(a.name), mode: a.selection_mode, options: a.options.map((o) => normalizeName(o)).sort() }))
    .sort((a, b) => a.n.localeCompare(b.n))
  return JSON.stringify({
    family: normalizeName(r.family), meal_role: r.meal_role ?? null, dish: r.dish_structure ?? null,
    title: r.version.title, servings: r.version.servings,
    prep: r.version.prep_minutes ?? null, cook: r.version.cook_minutes ?? null,
    rest: r.version.rest_minutes ?? null, difficulty: r.version.difficulty ?? null,
    comps, branches, ings, steps, axes,
  })
}
const contentHash = (r) => createHash('md5').update(canonicalRecipe(r)).digest('hex')

/** Hash du corpus entier = identité du run d'import (union ordonnée des hash de recettes). */
const corpusHash = createHash('md5').update(corpus.recipes.map(contentHash).sort().join(',')).digest('hex')

/** Forme par IDENTITÉ EXACTE (nom de forme normalisé). NULL si absente. */
function exactFormSql(formName) {
  const target = normalizeName(formName)
  return `(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = ${q(target)}
     order by ff.canonical_name_normalized limit 1)`
}

let sql = `-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. IDEMPOTENT.
-- corpus_hash = ${corpusHash}
insert into ops.source_datasets (code,name,publisher,source_url,license_code,allowed_uses,update_strategy,current_version,last_checked_at)
values ('myko_editorial','Recettes éditoriales Myko','Myko','internal','cc0-1.0',
        '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
        'manual','r0',now())
on conflict (code) do update set last_checked_at=now();

-- Run d'import R0 identifié par le HASH DU CORPUS (un corpus modifié => nouveau run).
insert into ops.import_runs (source_dataset_id, source_version, code_version, configuration_hash, status, started_at, completed_at, candidate_count)
select sd.id, 'r0', 'r0-loader-2.0', ${q(corpusHash)}, 'completed', now(), now(), ${corpus.recipes.length}
from ops.source_datasets sd where sd.code='myko_editorial'
  and not exists (select 1 from ops.import_runs r where r.configuration_hash = ${q(corpusHash)});
`

// ── Liste fonctionnelle F0 : UNION des formes préférées + toutes les alternatives ──
const foods = new Map()
const addForm = (name) => { if (name) foods.set(normalizeName(name), name) }

for (const r of corpus.recipes) {
  const famNorm = normalizeName(r.family)
  const hash = contentHash(r)
  const compVars = r.components.map((c) => `v_comp_${normalizeName(c.name).replace(/[^a-z0-9]+/g, '_')}`)
  const branchList = r.branches || []
  const branchVars = branchList.map((b) => `v_br_${normalizeName(b.name).replace(/[^a-z0-9]+/g, '_')}`)
  const branchVarByName = new Map(branchList.map((b, i) => [b.name, branchVars[i]]))

  const decl = [...compVars, ...branchVars].map((v) => `${v} uuid`).join('; ')
  sql += `\nDO $$\nDECLARE v_fam uuid; v_ver uuid;${decl ? ' ' + decl + ';' : ''}\nBEGIN\n`
  sql += `  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES(${q(r.family)},${q(famNorm)},${q(r.meal_role)},${q(r.dish_structure)},'candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;\n`
  sql += `  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,${q(r.version.title)},sd.id,${q('r0:' + famNorm)},'Myko','cc0-1.0',${r.version.servings},${num(r.version.prep_minutes)},${num(r.version.cook_minutes)},${q(r.version.difficulty)},'C','draft',${q(hash)}
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;\n`
  // provenance RÉÉCRITE (delete+insert) : reflète toujours le hash courant + le run courant.
  sql += `  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,${q('r0:' + famNorm)},to_jsonb(${q(hash)}::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash=${q(corpusHash)} LIMIT 1) run
    WHERE sd.code='myko_editorial';\n`
  // idempotence : purge des enfants (ordre FK : options -> exigences -> étapes -> branches -> composants -> axes).
  sql += `  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;\n`

  // composants
  r.components.forEach((c, i) => {
    sql += `  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,${q(c.name)},${q(c.role)},${c.position}) RETURNING id INTO ${compVars[i]};\n`
  })

  // branches d'instructions (créées avant les étapes/options qui les référencent)
  branchList.forEach((b, i) => {
    const cond = { axis: norm(b.axis), option: norm(b.option) }
    sql += `  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,${q(b.name)},${jsonLit(cond)},${q(b.confidence || 'C')}) RETURNING id INTO ${branchVars[i]};\n`
  })

  // exigences d'ingrédients + options validées (avec branche/rendement/impact)
  r.ingredients.forEach((ing, i) => {
    addForm(ing.form)
    const compIdx = ing.component == null ? -1 : r.components.findIndex((c) => c.name === ing.component)
    const compVar = compIdx >= 0 ? compVars[compIdx] : 'NULL'
    // Les assaisonnements chiffrés portent désormais leur forme réelle (Sel fin, Poivre…).
    const pref = ing.form ? exactFormSql(ing.form) : 'NULL'
    sql += `  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,${compVar},${q(ing.requirement_type)},${pref},${ing.quantity},${q(ing.unit)},${q(ing.strictness)},${ing.culinary_role ? q(ing.culinary_role) : 'NULL'},${ing.preparation_note ? q(ing.preparation_note) : 'NULL'},${ing.is_optional ? 'true' : 'false'},${i + 1});\n`
    if (ing.requirement_type === 'validated_options' && Array.isArray(ing.options)) {
      ing.options.map(optionOf).forEach((opt, oi) => {
        addForm(opt.form)
        const brVar = opt.branch && branchVarByName.get(opt.branch) ? branchVarByName.get(opt.branch) : 'NULL'
        sql += `  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, ${exactFormSql(opt.form)}, ${oi + 1}, ${opt.quantity_factor}, ${brVar}, ${opt.quality_impact}, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=${i + 1}
          AND ${exactFormSql(opt.form)} IS NOT NULL;\n`
      })
    }
  })

  // étapes (les étapes propres à une variante portent branch_id)
  for (const s of r.steps) {
    const brVar = s.branch && branchVarByName.get(s.branch) ? branchVarByName.get(s.branch) : 'NULL'
    sql += `  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,${brVar},${s.n},${q(s.instruction)},${s.active_minutes ?? 'NULL'},${s.passive_minutes ?? 'NULL'},${s.temperature_c ?? 'NULL'},${s.target_core_temperature_c ?? 'NULL'});\n`
  }

  // axes de variation : chaque option d'axe nommée comme la forme (reliée aux branches par selection_condition)
  for (const ax of r.variation_axes || []) {
    for (const o of ax.options) addForm(o)
    sql += `  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,${q(ax.name)},${q(ax.selection_mode)},true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ${ax.options.map((o) => `(${q(o)})`).join(',')}) AS x(name);\n`
  }
  sql += `END $$;\n`
}

const foodList = [...foods.entries()].sort()
sql += `\n-- Liste fonctionnelle F0 dérivée de R0 (union préférées + alternatives) : ${foodList.length} formes distinctes requises.\n`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'r0-load.sql'), sql)
writeFileSync(join(OUT, 'r0-functional-foods.json'),
  JSON.stringify({ corpus_hash: corpusHash, count: foodList.length, forms: foodList.map(([n, disp]) => ({ normalized: n, name: disp })) }, null, 2))
console.log(JSON.stringify({ recipes: corpus.recipes.length, corpus_hash: corpusHash, distinct_required_forms: foodList.length, sql_bytes: Buffer.byteLength(sql) }, null, 2))
