/**
 * LIER LES PLATS AUX BASES PARTAGÉES — livrable 2.1 de docs/PLAN_FINIR_MYKO.md,
 * chantier C4.1 de docs/PLAN_PLANNING_PARFAIT.md.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE SCRIPT FAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `lib/domain/planning/sharedBases.js` (509 lignes) sait depuis longtemps
 * mutualiser une BASE — une sauce, un bouillon, une pâte cuits une fois pour
 * plusieurs plats différents de la semaine. Il est câblé dans le solveur, il est
 * testé, et il était INERTE : un plat déclare qu'il emploie une base par un
 * ingrédient qui porte `component.code`, et aucune des 754 recettes du corpus
 * n'en portait un.
 *
 * Ce script pose ces `component`, et rien d'autre. Il lit :
 *   — `data/recipes/corpus-v3.json`, le corpus éditorial ;
 *   — `data/recipes/arbitrations/bases-partagees.json`, l'arbitrage RELU.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN FICHIER D'ARBITRAGE, ET PAS UN APPARIEMENT AUTOMATIQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le risque nommé par le plan est le faux positif : « une sauce tomate qui n'est
 * pas la même ». Il est réel et mesuré — le corpus porte une « Sauce tomate
 * salvadorienne » qui n'est pas la sauce tomate française de RAP-001, un
 * « Bouillon de légumes non salé » qui n'est pas le bouillon salé de RAP-007, un
 * « Riz jasmin cuit froid » qui n'est pas le riz créole de RAP-016. Un
 * appariement par ressemblance de libellé les aurait tous les trois attrapés, et
 * personne n'aurait pu, six mois plus tard, distinguer un lien vrai d'un lien
 * vraisemblable.
 *
 * D'où la règle, qui est la parade imposée par le plan : UNE BASE NON ARBITRÉE
 * N'EST PAS POSÉE. Ce script ne cherche rien, ne devine rien, n'infère rien d'un
 * nom. Il applique des décisions écrites et motivées une par une, et il REFUSE
 * de travailler dès qu'une décision ne se retrouve pas exactement au corpus :
 * un code inconnu, une forme absente, une position qui a bougé, une quantité qui
 * ne correspond plus arrêtent le script au lieu de poser un lien approximatif.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE SCRIPT ÉCRIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. `data/recipes/corpus-v3.json` : la clé `component` sur les lignes
 *    d'ingrédient arbitrées, et SEULEMENT sur celles-là — une ligne qui portait
 *    un `component` qu'aucune décision ne déclare plus le perd. Le script est
 *    donc idempotent et réversible : retirer une décision de l'arbitrage suffit
 *    à dé-lier le plat.
 *
 * 2. `supabase/migrations/20260918090000_bases_partagees.sql` et son rollback :
 *    le CHEMIN BASE. Sans eux, les liens ne vivraient que dans le JSON du dépôt,
 *    et le planificateur de production — qui lit la base par
 *    `get_operational_recipe_catalog_v3` — n'en verrait aucun. C'est exactement
 *    le défaut que le §0.3 du plan a mesuré et que la phase 0b a corrigé côté
 *    projection ; il serait absurde de le recréer côté données.
 *    Le script ÉCRIT ces fichiers, il ne les applique pas : c'est
 *    `release-production.yml` qui applique, après inscription au manifeste par
 *    `node scripts/db/build-manifest.mjs`.
 *
 * Pourquoi une migration séparée plutôt qu'un rechargement du corpus : les dix
 * tranches du 17 septembre sont FIGÉES (`scripts/db/build-corpus-migration.mjs`
 * l'explique — `apply-migrations.sh` refuse un fichier dont l'empreinte a changé
 * après enregistrement). Poser les liens par une migration dédiée est la même
 * méthode que `20260917111000_contrat_operationnel_valeurs.sql` a employée pour
 * les origines et les profils de conservation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE SCRIPT NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne déclare AUCUN rendement (`yieldQuantity`). Le rendement d'une base est
 * une donnée culinaire qu'une fiche déclare ou ne déclare pas ; le corpus n'en
 * déclare qu'un seul (FR-024, 870 g). En calculer un depuis la somme des
 * ingrédients crus serait fabriquer un chiffre plausible — et il serait faux,
 * une sauce perdant à la réduction la moitié de ce qui entre dans la casserole.
 * Deux motifs de l'arbitrage signalent au passage qu'un plat demande plus qu'une
 * fournée ne rend ; c'est une information, pas une correction silencieuse.
 *
 * Il n'écrit pas non plus de recette de base. Vingt-trois des trente-trois
 * composants du corpus ne sont l'ingrédient d'aucun plat, et huit formes
 * préparées très employées (« Pomme de terre cuite » dans 43 plats, « Pois
 * chiche cuit, égoutté » dans 15, « Pâte feuilletée crue » dans 10…) n'ont
 * aucune base. Écrire ces bases-là est un lot d'usine — sept portes, deux
 * sources sur deux sites — et c'est ce qui sépare les 71 plats liés ici des 120
 * que P12 demande. Le script le COMPTE et l'imprime ; il ne le comble pas.
 *
 * Usage :
 *   node scripts/data/recipes/link-shared-bases.mjs --dry-run   # mesure seule
 *   node scripts/data/recipes/link-shared-bases.mjs             # écrit
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const ARBITRAGE = join(ROOT, 'data', 'recipes', 'arbitrations', 'bases-partagees.json')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')

/**
 * Horodatage FIGÉ de la migration. `apply-migrations.sh` indexe le registre par
 * version et refuse un fichier dont l'empreinte a changé après enregistrement :
 * une version recalculée à chaque exécution rendrait le rejeu impossible. Un lot
 * de liens ultérieur écrira sa propre migration sous un nouvel horodatage,
 * déclaré ici, sans toucher à celle-ci.
 */
const VERSION_MIGRATION = '20260918090000'
const NOM_MIGRATION = 'bases_partagees'

/**
 * LES DEUX PORTES DE `buildSharedBaseCatalog`, RECOPIÉES.
 *
 * Ce script est un `.mjs` lancé par node ; les modules de `lib/` s'importent
 * entre eux sans extension et ne se résolvent donc pas hors du bundler. Les deux
 * constantes sont recopiées plutôt qu'importées, et
 * `tests/data/basesPartagees.test.js` vérifie qu'elles n'ont pas dérivé de
 * `lib/domain/planning/sharedBases.js` — un test qui échoue le jour où l'une des
 * deux bouge d'un côté seulement.
 *
 * Une base n'entre au catalogue du solveur que si :
 *   — la reprendre économise du temps : `prepMinutes > BASE_REUSE_ACTIVE_MINUTES` ;
 *   — sa garde est DÉCLARÉE : `refrigeratorShelfLifeDays` rend un entier, c'est
 *     à dire un profil de conservation non « eat_immediately » d'au moins 24 h.
 * Une base qui ne passe pas ces portes n'est pas une base : le script refuse le
 * lien plutôt que de le poser sur un composant que le moteur ignorera.
 */
const BASE_REUSE_ACTIVE_MINUTES = 4

/** Miroir de `cookingSessions.refrigeratorShelfLifeDays`, sur la forme corpus. */
function gardeDeclareeJours(recette) {
  const profil = recette?.conservation_profile
  if (!profil || profil.eat_immediately === true) return null
  const heures = Number(profil.fridge_hours)
  if (!Number.isFinite(heures) || heures < 24) return null
  return Math.floor(heures / 24)
}

/** Minutes ACTIVES d'une base : sa préparation seule (`baseActiveMinutes`). */
const minutesActives = (recette) => {
  const minutes = Number(recette?.prep_minutes)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0
}

/**
 * Le script n'écrit que lancé en ligne de commande. Le test qui relit les
 * décisions IMPORTE ce module, et un import qui réécrirait le corpus le ferait
 * au milieu d'une suite où d'autres tests lisent ce même fichier. Même garde que
 * `assign-plate-roles.mjs` et `assign-dish-descriptions.mjs`.
 */
const lanceALaMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
const dryRun = !lanceALaMain || process.argv.includes('--dry-run')

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const arbitrage = JSON.parse(readFileSync(ARBITRAGE, 'utf8'))
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

/**
 * RELECTURE DE CHAQUE DÉCISION CONTRE LE CORPUS.
 *
 * Chaque champ factuel de l'arbitrage — code, forme, position, quantité, unité,
 * caractère facultatif — est comparé à ce que le corpus porte VRAIMENT. Une
 * divergence est une erreur, pas un avertissement : l'arbitrage a été relu
 * contre un état du corpus, et si le corpus a bougé depuis, la décision doit
 * être relue avant d'être posée. C'est la seule façon d'empêcher qu'un lot de
 * liens survive silencieusement à la réécriture d'une fiche.
 */
export function verifierDecisions() {
  const erreurs = []
  const vues = new Set()
  for (const decision of arbitrage.decisions) {
    const ou = `${decision.base} → ${decision.code}`
    const cle = `${decision.base}|${decision.code}|${decision.position}`
    if (vues.has(cle)) erreurs.push(`${ou} : décision en double`)
    vues.add(cle)

    const recette = parCode.get(decision.code)
    if (!recette) { erreurs.push(`${ou} : recette absente du corpus`); continue }
    if (recette.family !== decision.family) erreurs.push(`${ou} : famille « ${recette.family} » au corpus, « ${decision.family} » à l'arbitrage`)
    if (recette.servings !== decision.servings) erreurs.push(`${ou} : ${recette.servings} parts au corpus, ${decision.servings} à l'arbitrage`)

    const ingredient = recette.ingredients[decision.position - 1]
    if (!ingredient) { erreurs.push(`${ou} : aucune ligne d'ingrédient en position ${decision.position}`); continue }
    if (ingredient.form !== decision.ingredient) erreurs.push(`${ou} : position ${decision.position} porte « ${ingredient.form} », l'arbitrage déclare « ${decision.ingredient} »`)
    if (Number(ingredient.quantity) !== Number(decision.quantity)) erreurs.push(`${ou} : ${ingredient.quantity} au corpus, ${decision.quantity} à l'arbitrage`)
    if (ingredient.unit !== decision.unit) erreurs.push(`${ou} : unité « ${ingredient.unit} » au corpus, « ${decision.unit} » à l'arbitrage`)
    if (Boolean(ingredient.optional) !== Boolean(decision.optional)) erreurs.push(`${ou} : facultatif ${Boolean(ingredient.optional)} au corpus, ${Boolean(decision.optional)} à l'arbitrage`)

    if (!String(decision.motif || '').trim()) erreurs.push(`${ou} : décision sans motif`)
    if (!decision.pose) continue

    const base = parCode.get(decision.base)
    if (!base) { erreurs.push(`${ou} : base absente du corpus`); continue }
    if (base.family !== decision.base_family) erreurs.push(`${ou} : la base s'appelle « ${base.family} » au corpus`)
    if (base.code === recette.code) erreurs.push(`${ou} : une recette ne peut pas être sa propre base`)
    // Une base qui emploierait elle-même une base du lot ferait une chaîne que
    // ni le solveur ni la session de cuisine ne savent dérouler. Aucun cas au
    // corpus aujourd'hui ; la porte reste, parce qu'elle coûte une ligne.
    if (arbitrage.decisions.some((autre) => autre.pose && autre.code === decision.base)) {
      erreurs.push(`${ou} : ${decision.base} est elle-même liée à une base — chaîne interdite`)
    }
    if (minutesActives(base) <= BASE_REUSE_ACTIVE_MINUTES) {
      erreurs.push(`${ou} : la base ne coûte que ${minutesActives(base)} min actives, la reprendre en coûte ${BASE_REUSE_ACTIVE_MINUTES} — le solveur l'ignorerait`)
    }
    if (gardeDeclareeJours(base) == null) {
      erreurs.push(`${ou} : la base ne déclare aucune garde au réfrigérateur — le solveur l'ignorerait`)
    }
  }
  return erreurs
}

/**
 * Application des décisions au corpus. Rend le corpus modifié et le compte des
 * lignes touchées. Les liens NON POSÉS (`pose: false`) sont traités comme
 * absents : c'est ce qui rend un refus effectif et pas seulement documenté.
 */
export function appliquerDecisions(corpusCible = corpus) {
  const parCodeCible = new Map(corpusCible.recipes.map((recette) => [recette.code, recette]))
  const poses = arbitrage.decisions.filter((decision) => decision.pose)
  const attendus = new Map()
  for (const decision of poses) {
    attendus.set(`${decision.code}|${decision.position}`, decision)
  }

  let ajoutes = 0
  let retires = 0
  let inchanges = 0
  for (const recette of corpusCible.recipes) {
    for (const [index, ingredient] of recette.ingredients.entries()) {
      const decision = attendus.get(`${recette.code}|${index + 1}`)
      if (!decision) {
        if (ingredient.component) { delete ingredient.component; retires += 1 }
        continue
      }
      const base = parCodeCible.get(decision.base)
      const component = {
        code: decision.base,
        name: base.family,
        requiredQuantity: Number(decision.quantity),
        requiredUnit: decision.unit,
      }
      if (JSON.stringify(ingredient.component) === JSON.stringify(component)) { inchanges += 1; continue }
      ingredient.component = component
      ajoutes += 1
    }
  }
  return { corpus: corpusCible, ajoutes, retires, inchanges, poses: poses.length }
}

/**
 * LA MIGRATION. Deux écritures, dans cet ordre : le composant (qui porte le lien
 * vers la sous-recette), puis l'exigence d'ingrédient qui le désigne.
 *
 * Idempotence par garde d'existence et non par `ON CONFLICT` : la table
 * `culinary.recipe_components` n'a pas de contrainte d'unicité sur
 * (recipe_version_id, sub_recipe_version_id), et lui en ajouter une ici
 * toucherait une table que d'autres chargements écrivent. La garde `NOT EXISTS`
 * rend le second passage sans effet, ce que le rejeu de la release exige.
 *
 * Rien n'est supprimé : un composant déjà posé par un autre chargement reste, et
 * une exigence déjà rattachée n'est pas réécrite (`IS DISTINCT FROM`).
 */
/**
 * Empreinte d'une recette, à l'identique de `build-corpus-v3.mjs` (`hashRecipe`)
 * et de `scripts/db/check-corpus-parity.mjs` (`empreinteDeRecette`). Les trois
 * doivent calculer LA MÊME chose : c'est ce md5 que la base garde dans
 * `culinary.recipe_versions.content_hash` et que le contrôle de parité compare
 * recette par recette.
 */
const empreinteDeRecette = (recette) => createHash('md5').update(JSON.stringify(recette)).digest('hex')

/**
 * Empreintes AVANT et APRÈS pour chaque plat lié.
 *
 * Poser un `component` change le JSON de la recette, donc son empreinte, donc
 * ce que `check-corpus-parity` attend de la base. Les dix tranches du
 * 17 septembre sont figées et portent l'empreinte d'AVANT : sans cette mise à
 * jour, la parité échouerait sur 71 recettes dès la première release, pour un
 * écart qui n'en est pas un — la base porterait bien le lien, elle le dirait
 * simplement sous une empreinte périmée.
 *
 * Elle est écrite dans LA MÊME migration que les liens, après eux, donc dans la
 * même transaction (`apply-migrations.sh` applique un fichier par transaction).
 * Les deux tiennent ou ne tiennent ni l'une ni l'autre : une empreinte qui
 * déclarerait un lien que la base n'a pas posé serait exactement le genre de
 * chiffre plausible et invérifiable que ce dépôt s'interdit.
 */
/**
 * EMPREINTES GELÉES — les plats liés qu'un lot POSTÉRIEUR a réécrits.
 *
 * Cette migration est appliquée et figée : `apply-migrations.sh` refuse un
 * fichier dont l'empreinte a changé après enregistrement. Or les deux
 * empreintes ci-dessus se RECALCULENT depuis le corpus d'aujourd'hui, si bien
 * qu'un lot ultérieur qui touche à la fiche d'un plat lié ferait produire à ce
 * script un fichier différent de celui qui est commité — et le premier
 * `apply-migrations.sh` de la release suivante s'arrêterait sur une dérive de
 * checksum.
 *
 * On ne recalcule donc PAS les empreintes de ces codes : on écrit celles que la
 * migration a réellement posées le 18 septembre. Ce n'est pas une porte
 * assouplie, c'est le contraire : cette migration décrit une transition qui a
 * eu lieu, pas l'état courant. L'état courant est écrit par la migration citée
 * dans `depuis`, et `tests/db/corpusParity.test.js` le vérifie en rejouant
 * toute la chaîne dans l'ordre — un gel qui ne correspondrait à aucune
 * migration postérieure y serait vu immédiatement.
 */
export const EMPREINTES_GELEES = {
  'VAR-035': {
    avant: 'b14de1af7ef345b97b681cab2f4cad28',
    apres: 'd347791f5fe6e490e55c7ae8f58c02d3',
    depuis: '20260919150000_corpus_v3_lot_jumeaux_13.sql',
    motif: 'Le lot « jumeaux 13 » rattache la Quiche aux poireaux à la Tarte aux '
      + 'poireaux et lardons (derived_from) et ajoute à son arbitrage le paragraphe qui '
      + "l'explique. Sa fiche a donc changé APRÈS le 18 septembre.",
  },
}

function empreintes(corpusLie) {
  const liees = corpusLie.recipes.filter((recette) => recette.ingredients.some((ingredient) => ingredient.component))
  return liees.map((recette) => {
    const gelee = EMPREINTES_GELEES[recette.code]
    if (gelee) return { code: recette.code, avant: gelee.avant, apres: gelee.apres, gelee: true }
    const sansLien = {
      ...recette,
      ingredients: recette.ingredients.map(({ component, ...reste }) => reste),
    }
    return { code: recette.code, avant: empreinteDeRecette(sansLien), apres: empreinteDeRecette(recette) }
  }).sort((a, b) => a.code.localeCompare(b.code))
}

export function construireMigration(corpusLie = corpus) {
  const poses = arbitrage.decisions.filter((decision) => decision.pose)
  const parRecette = new Map()
  for (const decision of poses) {
    if (!parRecette.has(decision.code)) parRecette.set(decision.code, [])
    parRecette.get(decision.code).push(decision)
  }
  const lignes = []
  for (const [code, decisions] of [...parRecette.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    // Position du composant dans la recette parente : 1 est déjà pris par le
    // composant « plat » que le chargeur de corpus insère pour chaque recette.
    // Les bases suivent, dans l'ordre de leurs lignes d'ingrédient.
    const ordonnees = [...decisions].sort((a, b) => a.position - b.position)
    ordonnees.forEach((decision, rang) => {
      lignes.push({ ...decision, componentPosition: rang + 2, code })
    })
  }

  const q = (value) => `'${String(value).replace(/'/g, "''")}'`
  const valeurs = lignes.map((ligne) => `    (${q(ligne.code)}, ${q(ligne.base)}, ${ligne.position}, ${q(ligne.ingredient)}, ${q(ligne.base_family)}, ${ligne.componentPosition}, ${Number(ligne.quantity)}, ${q(ligne.unit)})`).join(',\n')
  const empreintesLiens = empreintes(corpusLie)

  const entete = `-- ============================================================================
-- BASES PARTAGÉES — les plats déclarent la base qu'ils emploient (livrable 2.1)
-- ============================================================================
-- Généré par scripts/data/recipes/link-shared-bases.mjs depuis
-- data/recipes/arbitrations/bases-partagees.json. NE PAS ÉDITER À LA MAIN :
-- l'arbitrage est la source, ce fichier en est la projection.
--
-- POURQUOI CETTE MIGRATION EXISTE. lib/domain/planning/sharedBases.js lit
-- \`ingredient.component.code\`. Sur le chemin BASE, ce champ vient de
-- get_operational_recipe_catalog_v3, qui le projette depuis
-- culinary.recipe_components.sub_recipe_version_id (migration 20260917110000,
-- phase 0b). La projection existe ; il n'y avait rien à projeter — 0 exigence
-- d'ingrédient ne portait de component_id. Cette migration pose les ${lignes.length} liens
-- arbitrés sur ${parRecette.size} plats.
--
-- ORDRE : le composant d'abord, l'exigence ensuite. Idempotent (gardes
-- d'existence), sans suppression, rollback dans le fichier voisin.
-- ============================================================================

CREATE TEMP TABLE _liens (
  parent_code       text,
  base_code         text,
  ingredient_pos    integer,
  ingredient_name   text,
  component_name    text,
  component_pos     integer,
  required_quantity numeric,
  required_unit     text
) ON COMMIT DROP;

INSERT INTO _liens VALUES
${valeurs};

-- 1. Le composant : une ligne par (plat, base), qui porte la sous-recette et la
--    quantité que le plat en demande pour ses portions de référence.
INSERT INTO culinary.recipe_components
  (recipe_version_id, name, component_role, position, sub_recipe_version_id,
   required_quantity, required_unit)
SELECT parent.id, lien.component_name, 'base', lien.component_pos, enfant.id,
       lien.required_quantity, lien.required_unit
FROM _liens lien
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions parent
  ON parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
JOIN culinary.recipe_versions enfant
  ON enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
WHERE NOT EXISTS (
  SELECT 1 FROM culinary.recipe_components existant
  WHERE existant.recipe_version_id = parent.id
    AND existant.sub_recipe_version_id = enfant.id
);

-- 2. L'exigence d'ingrédient désigne ce composant. Le rapprochement se fait sur
--    la POSITION et sur le LIBELLÉ ÉDITORIAL à la fois : la position seule
--    rattacherait la base à la mauvaise ligne si une fiche était réécrite, et le
--    libellé seul ne trancherait pas une recette qui emploierait deux fois la
--    même forme.
UPDATE culinary.recipe_ingredient_requirements exigence
SET component_id = composant.id,
    requirement_type = 'sub_recipe'
FROM _liens lien
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions parent
  ON parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
JOIN culinary.recipe_versions enfant
  ON enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
JOIN culinary.recipe_components composant
  ON composant.recipe_version_id = parent.id AND composant.sub_recipe_version_id = enfant.id
WHERE exigence.recipe_version_id = parent.id
  AND exigence.position = lien.ingredient_pos
  AND exigence.source_name = lien.ingredient_name
  AND (exigence.component_id IS DISTINCT FROM composant.id
       OR exigence.requirement_type IS DISTINCT FROM 'sub_recipe');

-- 3. L'empreinte de contenu des plats liés. \`check-corpus-parity\` compare
--    recette par recette le md5 du JSON du dépôt à \`content_hash\` en base ;
--    poser un \`component\` change ce JSON. Les dix tranches du 17 septembre
--    sont figées et portent l'empreinte d'AVANT : sans cette mise à jour, la
--    parité échouerait sur ${empreintesLiens.length} recettes à la première release, pour un écart
--    qui n'en est pas un. Écrite APRÈS les liens et dans la même transaction.
--    La garde sur l'empreinte d'avant évite d'écraser un rechargement de corpus
--    plus récent qui porterait déjà la nouvelle.
CREATE TEMP TABLE _empreintes (code text, avant text, apres text) ON COMMIT DROP;

INSERT INTO _empreintes VALUES
${empreintesLiens.map((item) => `    (${q(item.code)}, ${q(item.avant)}, ${q(item.apres)})`).join(',\n')};

UPDATE culinary.recipe_versions version
SET content_hash = empreinte.apres
FROM _empreintes empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
WHERE version.source_dataset_id = dataset.id
  AND upper(version.source_record_key) = empreinte.code
  AND version.content_hash = empreinte.avant;

-- La provenance du champ « content » porte le même md5 que la version (le
-- chargeur écrit les deux en un seul passage). Personne ne la LIT aujourd'hui —
-- aucune occurrence de \`field_provenance\` hors des chargeurs — mais la laisser
-- sur l'ancienne empreinte ferait dire à la trace de provenance autre chose
-- qu'à la ligne qu'elle trace, et c'est le genre d'écart qu'on ne retrouve plus.
UPDATE ops.field_provenance provenance
SET normalized_value = to_jsonb(empreinte.apres)
FROM _empreintes empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions version
  ON version.source_dataset_id = dataset.id AND upper(version.source_record_key) = empreinte.code
WHERE provenance.entity_schema = 'culinary'
  AND provenance.entity_table = 'recipe_versions'
  AND provenance.entity_id = version.id
  AND provenance.field_name = 'content'
  AND provenance.normalized_value = to_jsonb(empreinte.avant);

-- Ce que la migration a réellement posé, imprimé par l'application : un compte
-- inférieur à ${lignes.length} dit qu'une fiche a bougé en base depuis l'arbitrage.
SELECT count(*) AS exigences_liees
FROM culinary.recipe_ingredient_requirements exigence
JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
WHERE composant.sub_recipe_version_id IS NOT NULL;
`

  const rollback = `-- ============================================================================
-- ROLLBACK — bases partagées (${VERSION_MIGRATION})
-- ============================================================================
-- Détache les exigences d'ingrédient de leur composant de base, puis supprime
-- les composants posés par la migration. Ne touche AUCUN composant « plat » ni
-- aucun composant sans sous-recette : seuls les composants de rôle « base »
-- portant une sous-recette sont concernés, et seulement pour les ${parRecette.size} plats
-- que l'arbitrage nomme.
-- ============================================================================

CREATE TEMP TABLE _liens_rollback (parent_code text, base_code text) ON COMMIT DROP;

INSERT INTO _liens_rollback VALUES
${[...new Set(lignes.map((ligne) => `    (${q(ligne.code)}, ${q(ligne.base)})`))].join(',\n')};

UPDATE culinary.recipe_ingredient_requirements exigence
SET component_id = plat.id,
    requirement_type = 'exact_form'
FROM _liens_rollback lien
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions parent
  ON parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
JOIN culinary.recipe_versions enfant
  ON enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
JOIN culinary.recipe_components composant
  ON composant.recipe_version_id = parent.id AND composant.sub_recipe_version_id = enfant.id
LEFT JOIN culinary.recipe_components plat
  ON plat.recipe_version_id = parent.id AND plat.sub_recipe_version_id IS NULL AND plat.position = 1
WHERE exigence.component_id = composant.id;

DELETE FROM culinary.recipe_components composant
USING _liens_rollback lien,
     ops.source_datasets dataset,
     culinary.recipe_versions parent,
     culinary.recipe_versions enfant
WHERE dataset.code = 'myko_editorial_v3'
  AND parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
  AND enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
  AND composant.recipe_version_id = parent.id
  AND composant.sub_recipe_version_id = enfant.id
  AND composant.component_role = 'base';

-- L'empreinte revient à celle d'AVANT les liens, celle que portent les dix
-- tranches figées du 17 septembre : défaire les liens sans défaire l'empreinte
-- laisserait \`check-corpus-parity\` rouge sur une base pourtant conforme.
CREATE TEMP TABLE _empreintes_rollback (code text, avant text, apres text) ON COMMIT DROP;

INSERT INTO _empreintes_rollback VALUES
${empreintesLiens.map((item) => `    (${q(item.code)}, ${q(item.avant)}, ${q(item.apres)})`).join(',\n')};

UPDATE culinary.recipe_versions version
SET content_hash = empreinte.avant
FROM _empreintes_rollback empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
WHERE version.source_dataset_id = dataset.id
  AND upper(version.source_record_key) = empreinte.code
  AND version.content_hash = empreinte.apres;

UPDATE ops.field_provenance provenance
SET normalized_value = to_jsonb(empreinte.avant)
FROM _empreintes_rollback empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions version
  ON version.source_dataset_id = dataset.id AND upper(version.source_record_key) = empreinte.code
WHERE provenance.entity_schema = 'culinary'
  AND provenance.entity_table = 'recipe_versions'
  AND provenance.entity_id = version.id
  AND provenance.field_name = 'content'
  AND provenance.normalized_value = to_jsonb(empreinte.apres);
`
  return { migration: entete, rollback, lignes: lignes.length, plats: parRecette.size }
}

// ─── Rapport ────────────────────────────────────────────────────────────────

function rapport() {
  const poses = arbitrage.decisions.filter((decision) => decision.pose)
  const refuses = arbitrage.decisions.filter((decision) => !decision.pose)
  const platsLies = new Set(poses.map((decision) => decision.code))

  // Les trois découpages que le §contexte_relecture de l'arbitrage annonce. Un
  // total seul mentirait : un lien sur un ingrédient facultatif ne sera jamais
  // vu par le solveur, un dessert ne peut pas occuper un créneau de repas, et
  // une base qui rend une minute n'est pas une base qui en rend seize.
  const facultatifs = poses.filter((decision) => decision.optional)
  const desserts = poses.filter((decision) => parCode.get(decision.code)?.plate?.role === 'dessert')
  const parBase = new Map()
  for (const decision of poses) {
    if (!parBase.has(decision.base)) parBase.set(decision.base, [])
    parBase.get(decision.base).push(decision)
  }

  const composants = corpus.recipes.filter((recette) => recette.plate?.role === 'component')
  const formes = new Map()
  for (const recette of corpus.recipes) {
    for (const ingredient of recette.ingredients) {
      formes.set(ingredient.form, (formes.get(ingredient.form) || 0) + 1)
    }
  }
  const nommes = new Set(arbitrage.decisions.map((decision) => decision.base))
  const jamaisNommes = composants.filter((recette) => !nommes.has(recette.code))

  const lignes = []
  lignes.push(`Arbitrage : ${arbitrage.decisions.length} décisions relues — ${poses.length} liens posés sur ${platsLies.size} plats distincts, ${refuses.length} refusés.`)
  lignes.push(`Par base :`)
  for (const [base, decisions] of [...parBase.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
    const recette = parCode.get(base)
    const gain = minutesActives(recette) - BASE_REUSE_ACTIVE_MINUTES
    lignes.push(`  ${base} ${recette.family} — ${decisions.length} plat(s) · ${minutesActives(recette)} min actives, ${gain} min gagnées par reprise · garde ${gardeDeclareeJours(recette)} j`)
  }
  lignes.push(`Réserves : ${facultatifs.length} lien(s) sur un ingrédient FACULTATIF (invisibles au solveur : recipeBaseRefs les écarte) · `
    + `${desserts.length} plat(s) de rôle dessert (jamais un créneau de repas).`)
  lignes.push(`P12 — premier terme : ${platsLies.size} plats liés pour une cible de 120. NON TENU.`)
  lignes.push(`Cause mesurée : ${composants.length} composants au corpus, ${nommes.size} nommés par une forme d'ingrédient, ${jamaisNommes.length} ne sont l'ingrédient d'aucun plat :`)
  lignes.push(`  ${jamaisNommes.map((recette) => `${recette.code} ${recette.family}`).join(', ')}`)
  lignes.push(`Formes préparées très employées SANS base au corpus (le travail d'usine qui séparerait 71 de 120) :`)
  for (const forme of ['Pomme de terre cuite', 'Confit de canard cuit', 'Pois chiche cuit, égoutté',
    'Pâte feuilletée crue', 'Bouillon de légumes non salé', 'Haricot blanc cuit, égoutté',
    'Poulet cuit effiloché', 'Haricot rouge cuit, égoutté']) {
    lignes.push(`  ${String(formes.get(forme) || 0).padStart(3)} plats · ${forme}`)
  }
  return lignes.join('\n')
}

const erreurs = verifierDecisions()
if (erreurs.length) {
  console.error(`L'arbitrage ne correspond plus au corpus — aucun lien posé.\n  ${erreurs.join('\n  ')}`)
  if (lanceALaMain) process.exit(1)
} else {
  const applique = appliquerDecisions()
  const { migration, rollback, lignes, plats } = construireMigration()
  if (!dryRun) {
    writeFileSync(CORPUS, `${JSON.stringify(applique.corpus, null, 2)}\n`)
    writeFileSync(join(MIGRATIONS, `${VERSION_MIGRATION}_${NOM_MIGRATION}.sql`), migration)
    writeFileSync(join(MIGRATIONS, `${VERSION_MIGRATION}_${NOM_MIGRATION}_rollback.sql`), rollback)
  }
  if (lanceALaMain) {
    console.log(rapport())
    console.log(`Corpus : ${applique.ajoutes} lien(s) écrits, ${applique.inchanges} inchangé(s), ${applique.retires} retiré(s).`)
    console.log(`Migration ${VERSION_MIGRATION}_${NOM_MIGRATION}.sql : ${lignes} liens sur ${plats} plats${dryRun ? ' (simulation, rien écrit)' : ''}.`)
    if (!dryRun) console.log('Inscrire au manifeste : node scripts/db/build-manifest.mjs')
  }
}

export { arbitrage, BASE_REUSE_ACTIVE_MINUTES, gardeDeclareeJours, minutesActives, VERSION_MIGRATION }
