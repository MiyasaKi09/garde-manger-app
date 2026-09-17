#!/usr/bin/env node
/**
 * build-contrat-operationnel-migration.mjs — remplit les deux colonnes
 * déclaratives du contrat opérationnel sur une base DÉJÀ chargée.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * 20260917110000 ajoute `catalog.food_forms.origin` et
 * `culinary.recipe_versions.conservation_profile`, et la chaîne de publication
 * les écrit désormais (scripts/data/foods/build-recipe-food-sql.mjs,
 * scripts/data/recipes/build-corpus-v3.mjs). Mais la base de production a déjà
 * reçu ses 549 formes et ses 754 recettes par les migrations du 17 septembre,
 * générées AVANT cette écriture : les colonnes y naîtraient vides.
 *
 * Deux façons de réparer, une seule tenable :
 *   — régénérer les dix tranches de corpus et le chargeur de catalogue. Refusé :
 *     `scripts/db/apply-migrations.sh` refuse un fichier dont l'empreinte a
 *     changé après son enregistrement, et ces migrations sont déjà au
 *     manifeste. Réécrire leur contenu casserait la release au lieu de la
 *     réparer ;
 *   — écrire une migration de plus, qui pose les valeurs sur les lignes en
 *     place. C'est ce que fait ce script, et elle est idempotente : chaque
 *     UPDATE est gardé par un `IS DISTINCT FROM`, donc un second passage
 *     n'écrit rien.
 *
 * D'OÙ VIENNENT LES VALEURS
 * -------------------------
 * Des deux artefacts versionnés du dépôt, et d'eux seuls :
 *   — `scripts/data/out/recipe-food-catalog.json` pour l'origine des formes,
 *     résolue par arbitrage relu ou par une case Ciqual sans ambiguïté
 *     (scripts/data/lib/origins.mjs) ;
 *   — `data/recipes/corpus-v3.json` pour le profil de conservation, écrit par
 *     scripts/data/recipes/derive-conservation-profiles.mjs depuis la prose et
 *     les arbitrages relus.
 * Aucune valeur n'est calculée ici. Ce script recopie ce que le dépôt déclare,
 * et il refuse d'écrire ce que le dépôt ne déclare pas.
 *
 * Usage :
 *   node scripts/db/build-contrat-operationnel-migration.mjs
 *   node scripts/db/build-manifest.mjs
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isKnownOrigin } from '../data/lib/origins.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const CATALOGUE = resolve(REPO_ROOT, 'scripts/data/out/recipe-food-catalog.json')
const CORPUS = resolve(REPO_ROOT, 'data/recipes/corpus-v3.json')
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'supabase/migrations')

/**
 * Horodatage FIGÉ, pour la même raison que celui des tranches de corpus : le
 * registre de migrations est indexé par version et refuse une empreinte qui
 * change après enregistrement. Une nouvelle campagne de valeurs s'écrira sous
 * un nouvel horodatage, déclaré ici, sans toucher à celle-ci.
 */
const VERSION = '20260917111000'
const NOM = 'contrat_operationnel_valeurs'

const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8'))
const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))

const q = (value) => `'${String(value).replace(/'/g, "''")}'`
const qn = (value) => (value == null ? 'NULL' : q(value))
const jsonb = (value) => `${q(JSON.stringify(value))}::jsonb`

// ── Refus avant écriture ────────────────────────────────────────────────────
// Une origine hors vocabulaire violerait le CHECK posé par 20260917110000 et
// ferait échouer la release entière. On le voit ici, à la génération, plutôt
// qu'en production.
const originesRefusees = catalogue.forms.filter((form) => !isKnownOrigin(form.origin))
if (originesRefusees.length) {
  console.error(`Origines hors vocabulaire : ${originesRefusees.map((f) => f.canonical_name_normalized).slice(0, 20).join(', ')}`)
  process.exit(1)
}

const profilsRefuses = corpus.recipes.filter((recipe) => recipe.conservation_profile != null
  && (typeof recipe.conservation_profile !== 'object' || Array.isArray(recipe.conservation_profile)))
if (profilsRefuses.length) {
  console.error(`Profils de conservation qui ne sont pas des objets : ${profilsRefuses.map((r) => r.code).slice(0, 20).join(', ')}`)
  process.exit(1)
}

const formes = catalogue.forms.map((form) => ({
  cle: form.canonical_name_normalized,
  origin: form.origin,
  origin_source: form.origin_source || null,
}))
// Une recette sans profil déclaré n'entre pas dans la liste : la colonne reste
// NULL, et NULL veut dire « non déclaré ». Poser une ligne à NULL reviendrait au
// même résultat, mais ferait croire à une décision là où il n'y en a pas.
const recettes = corpus.recipes
  .filter((recipe) => recipe.conservation_profile && typeof recipe.conservation_profile === 'object')
  .map((recipe) => ({ code: recipe.code, profile: recipe.conservation_profile }))

const empreinte = createHash('md5')
  .update(JSON.stringify({ formes, recettes }))
  .digest('hex')

const valeursFormes = formes
  .map((forme) => `    (${q(forme.cle)}, ${q(forme.origin)}, ${qn(forme.origin_source)})`)
  .join(',\n')

const valeursRecettes = recettes
  .map((recette) => `    (${q(recette.code)}, ${jsonb(recette.profile)})`)
  .join(',\n')

const migration = `-- Le contrat opérationnel, rempli sur les lignes déjà en base.
--
-- 20260917110000 a ouvert deux colonnes déclaratives ; cette migration les
-- remplit pour ce que la base porte déjà — ${formes.length} formes d'aliment et
-- ${recettes.length} recettes. Sans elle, une base chargée par les migrations du
-- 17 septembre (catalogue 20260917090000, tranches de corpus 20260917091000 à
-- 20260917104000) aurait les colonnes et pas les valeurs : la RPC rendrait
-- \`origin\` nul pour chaque ingrédient — c'est-à-dire aucun plat végétarien —
-- et aucun profil de conservation, donc aucune portion produite d'avance.
--
-- POURQUOI UNE MIGRATION DE PLUS PLUTÔT QUE LA RÉÉCRITURE DES TRANCHES.
-- \`scripts/db/apply-migrations.sh\` refuse un fichier dont l'empreinte a changé
-- après son enregistrement. Les tranches sont au manifeste : les régénérer avec
-- la colonne nouvelle casserait la release au lieu de la réparer. Les
-- chargements FUTURS, eux, écrivent les deux colonnes directement — la chaîne
-- de publication a été reprise pour cela — et cette migration devient alors
-- sans effet, ce que son \`IS DISTINCT FROM\` rend littéral.
--
-- CE QU'ELLE N'INVENTE PAS. Les valeurs sont recopiées de deux artefacts
-- versionnés : scripts/data/out/recipe-food-catalog.json pour l'origine (elle-
-- même issue d'un arbitrage relu ou d'une case Ciqual sans ambiguïté) et
-- data/recipes/corpus-v3.json pour la conservation. Une recette sans profil
-- déclaré n'apparaît pas dans la liste et garde NULL ; une forme dont personne
-- n'a tranché l'origine porte 'inconnu', qui est une décision et non un vide.
--
-- IDEMPOTENTE, et deux fois : chaque UPDATE est gardé par \`IS DISTINCT FROM\`,
-- et le registre de migrations ne rejoue pas une version déjà appliquée.
--
-- Généré par scripts/db/build-contrat-operationnel-migration.mjs. Ne pas
-- éditer à la main.
-- empreinte_valeurs = ${empreinte}

-- ── Origine biologique des formes ───────────────────────────────────────────
-- La mise à jour porte sur TOUTES les lignes de même nom normalisé, pas sur la
-- seule que le chargeur aurait choisie. Une exigence de recette résout sa forme
-- par ce nom (\`ORDER BY status published first\`) ; si deux lignes le partagent,
-- l'origine doit être la même quelle que soit celle qui sort, sans quoi le
-- verdict végétarien dépendrait d'un ordre de tri. Les formes rejetées sont
-- laissées de côté : elles ne sont jamais servies.
WITH origines(cle, origin, origin_source) AS (
  VALUES
${valeursFormes}
)
UPDATE catalog.food_forms ff
SET origin = origines.origin,
    origin_source = origines.origin_source,
    updated_at = now()
FROM origines
WHERE ff.canonical_name_normalized = origines.cle
  AND ff.status <> 'rejected'
  AND (ff.origin IS DISTINCT FROM origines.origin
    OR ff.origin_source IS DISTINCT FROM origines.origin_source);

-- ── Profil de conservation des recettes ─────────────────────────────────────
-- Le rapprochement se fait par le CODE de la recette, sur le seul jeu de
-- données éditorial : c'est la clé que le corpus porte, et les identifiants de
-- version sont réattribués à chaque rechargement.
WITH profils(code, conservation_profile) AS (
  VALUES
${valeursRecettes}
)
UPDATE culinary.recipe_versions rv
SET conservation_profile = profils.conservation_profile
FROM profils, ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) = profils.code
  AND rv.conservation_profile IS DISTINCT FROM profils.conservation_profile;
`

const rollback = `-- Rollback des valeurs du contrat opérationnel (${VERSION}).
--
-- Il remet à NULL les deux colonnes déclaratives sur les lignes que cette
-- migration a visées — ${formes.length} formes et ${recettes.length} recettes.
--
-- CE QU'IL FAUT SAVOIR AVANT DE LE JOUER. Il ne distingue pas ce que CETTE
-- migration a écrit de ce qu'un chargement postérieur aurait écrit : la base ne
-- garde pas cette trace, et prétendre le contraire serait inventer une
-- précision qu'on n'a pas. Rejoué après un chargement de corpus récent, il
-- efface donc aussi les valeurs venues de la chaîne de publication. Elles se
-- rechargent depuis les artefacts versionnés du dépôt — rien n'est perdu pour
-- de bon, mais rien n'est récupérable depuis la base seule.
--
-- ET CE QU'IL COÛTE, MAINTENANT QUE LES RACCORDS JSON SONT PARTIS. Le livrable
-- 0b.4 a retiré de lib/domain/recipes/operationalCatalog.js les deux imports
-- qui comblaient ces colonnes depuis le corpus embarqué. Plus rien ne comble :
-- à colonnes vidées, chaque ingrédient servi vaut 'inconnu' et AUCUN plat n'est
-- végétarien en production — mesuré sur la capture du catalogue servi, 5 297
-- ingrédients « inconnu » sur 346 formes et 0 plat végétarien sur 509. Jouer ce
-- rollback demande donc de remettre les raccords d'abord, ou de recharger les
-- valeurs aussitôt.
--
-- Généré par scripts/db/build-contrat-operationnel-migration.mjs.

WITH origines(cle) AS (
  VALUES
${formes.map((forme) => `    (${q(forme.cle)})`).join(',\n')}
)
UPDATE catalog.food_forms ff
SET origin = NULL, origin_source = NULL, updated_at = now()
FROM origines
WHERE ff.canonical_name_normalized = origines.cle
  AND (ff.origin IS NOT NULL OR ff.origin_source IS NOT NULL);

WITH profils(code) AS (
  VALUES
${recettes.map((recette) => `    (${q(recette.code)})`).join(',\n')}
)
UPDATE culinary.recipe_versions rv
SET conservation_profile = NULL
FROM profils, ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) = profils.code
  AND rv.conservation_profile IS NOT NULL;
`

writeFileSync(resolve(MIGRATIONS_DIR, `${VERSION}_${NOM}.sql`), migration)
writeFileSync(resolve(MIGRATIONS_DIR, `${VERSION}_${NOM}_rollback.sql`), rollback)

const origines = formes.reduce((acc, forme) => {
  acc[forme.origin] = (acc[forme.origin] || 0) + 1
  return acc
}, {})

console.log(JSON.stringify({
  empreinte_valeurs: empreinte,
  formes: formes.length,
  formes_par_origine: origines,
  recettes_avec_profil: recettes.length,
  recettes_sans_profil: corpus.recipes.length - recettes.length,
  octets: Buffer.byteLength(migration),
}, null, 2))
