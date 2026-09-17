import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  JEU_DE_DONNEES,
  NIVEAU_RETIRE,
  REQUETE_CORPUS,
  comparer,
  corpusDeLaBase,
  corpusDuDepot,
  empreinteDeRecette,
} from '@/scripts/db/check-corpus-parity.mjs'

/**
 * LE CONTRÔLE DE PARITÉ BASE/DÉPÔT — livrable 0b.5, vérifié sans Postgres.
 *
 * CE QUE LE CONTRÔLE DOIT FAIRE. `docs/PLAN_FINIR_MYKO.md` (§5, phase 0b) :
 * « échoue si l'empreinte du corpus en base diffère de celle du dépôt », placé
 * dans le job `migrate-and-deploy` de `release-production.yml` et PAS dans le
 * job principal de `ci.yml`, qui tourne sur des valeurs factices. Critère : « le
 * contrôle échoue sur l'écart d'aujourd'hui et passe après 0a.2 ».
 *
 * CE QUE CE FICHIER TIENT, ET CE QU'IL NE TIENT PAS. Vitest n'a pas de base : ce
 * fichier ne peut pas prouver que la lecture SQL rend les bonnes lignes. Il
 * tient les trois choses qui décident du reste, et il s'arrête là :
 *
 *   1. LE MAILLON PORTEUR — la règle d'empreinte du dépôt rend EXACTEMENT ce que
 *      les migrations écrivent en base. C'est le seul point où le contrôle
 *      pourrait mentir sans que rien ne le dise : si les deux règles
 *      s'écartaient, toute comparaison serait fausse et resterait verte tant que
 *      les deux côtés s'écarteraient pareillement. On confronte donc la règle
 *      aux 754 littéraux `content_hash` des dix tranches de corpus commitées.
 *   2. LE VERDICT — `comparer()` est pur, sans base ni fichier. On lui présente
 *      l'écart du §2.1, la parité, et les cas limites que l'aménagement des
 *      recettes retirées pourrait excuser à tort.
 *   3. LE CÂBLAGE — le contrôle est appelé là où le plan le place, et nulle part
 *      où il ne peut pas lire de base.
 *
 * Les deux comportements que ce fichier ne peut pas atteindre — la requête et la
 * connexion par psql — sont éprouvés par le job `db-tests` de `ci.yml`, qui
 * lance le contrôle sur les deux vraies bases qu'il construit.
 *
 * MESURE RELEVÉE AU LIVRABLE, sur des bases construites en rejouant le job
 * `db-tests` : sur une base restée à l'état du §2.1 (405 planifiables), le
 * contrôle sort en 1 et nomme 165 recettes du dépôt absentes du catalogue de la
 * base — les JUM-, VAR-, RAP- et DEN- — plus l'écart 405/568. Sur une base ayant
 * reçu 0a.2, il sort en 0, les deux empreintes étant
 * `c87d2705eb8e3d1f8b231a36743e699e090d51e8022cd714bb801fa28da1df29`.
 */

const RACINE = process.cwd()
const CORPUS = JSON.parse(readFileSync(join(RACINE, 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
const RAPPORT = JSON.parse(readFileSync(join(RACINE, 'scripts', 'data', 'out', 'corpus-v3-report.json'), 'utf8'))
const CI = readFileSync(join(RACINE, '.github', 'workflows', 'ci.yml'), 'utf8')
const RELEASE = readFileSync(join(RACINE, '.github', 'workflows', 'release-production.yml'), 'utf8')

const DEPOT = corpusDuDepot(CORPUS)

/**
 * Les couples `code → content_hash` que les migrations de corpus ÉCRIVENT en
 * base. Ils sont lus dans le SQL commité, c'est-à-dire dans ce que le pipeline
 * de production applique — pas dans la sortie régénérée d'un script, qui
 * pourrait différer de ce qui est inscrit au manifeste.
 */
const empreintesDesTranches = () => {
  const fichiers = readdirSync(join(RACINE, 'supabase', 'migrations'))
    .filter((nom) => /^\d{14}_corpus_v3_754_tranche_\d+\.sql$/.test(nom))
    .sort()
  const parCode = new Map()
  for (const nom of fichiers) {
    const sql = readFileSync(join(RACINE, 'supabase', 'migrations', nom), 'utf8')
    // Le bloc d'insertion d'une version : `ds.id, '<CODE>',` puis, plus bas,
    // `'<niveau>', 'candidate', '<empreinte>',`. La recherche est non gourmande,
    // donc chaque code prend l'empreinte de SON bloc.
    for (const trouve of sql.matchAll(/ds\.id, '([A-Z0-9-]+)',[\s\S]*?'[A-Z]', 'candidate', '([0-9a-f]{32})',/g)) {
      parCode.set(trouve[1], trouve[2])
    }
  }
  return { fichiers, parCode }
}

describe('0b.5 — la règle d’empreinte du dépôt est celle que les migrations écrivent', () => {
  it('rend, recette par recette, le content_hash que portent les dix tranches de corpus', () => {
    const { fichiers, parCode } = empreintesDesTranches()
    expect(fichiers.length).toBe(10)
    // Le compte d'abord : une expression régulière qui cesserait d'accrocher
    // rendrait « 0 écart » sur 0 comparaison, et ce zéro-là ne prouverait rien.
    expect(parCode.size).toBe(CORPUS.recipes.length)

    const absentes = CORPUS.recipes.filter((recette) => !parCode.has(recette.code)).map((r) => r.code)
    expect(absentes, 'recettes du corpus qu’aucune tranche ne charge').toEqual([])
    const ecarts = CORPUS.recipes
      .filter((recette) => parCode.get(recette.code) !== empreinteDeRecette(recette))
      .map((recette) => recette.code)
    expect(
      ecarts,
      'la règle d’empreinte du contrôle s’est écartée de celle du chargeur : toute comparaison de parité devient fausse',
    ).toEqual([])
    const enTrop = [...parCode.keys()].filter((code) => !CORPUS.recipes.some((recette) => recette.code === code))
    expect(enTrop, 'codes chargés par les tranches que le corpus ne déclare pas').toEqual([])
  })

  it('lit le corpus du dépôt en entier et n’en retire rien aujourd’hui', () => {
    expect(DEPOT.parCode.size).toBe(CORPUS.recipes.length)
    // Aucune recette du corpus n'est déclarée retirée : l'aménagement existe
    // pour la base, où FR-007 l'est. Le jour où le corpus en portera une, ce
    // chiffre bougera et c'est le fichier qui le dira, pas une surprise.
    expect(DEPOT.retirees).toEqual([])
    expect(DEPOT.empreinte).toMatch(/^[0-9a-f]{64}$/)
  })

  it('la requête ne lit qu’un jeu de données et ne modifie rien', () => {
    expect(REQUETE_CORPUS).toContain(`ds.code = '${JEU_DE_DONNEES}'`)
    expect(REQUETE_CORPUS.trim().toUpperCase().startsWith('SELECT')).toBe(true)
    for (const verbe of ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE']) {
      expect(REQUETE_CORPUS.toUpperCase()).not.toContain(verbe)
    }
  })
})

/** Une base fabriquée à partir du corpus du dépôt, que chaque cas déforme ensuite. */
const baseConforme = () => CORPUS.recipes.map((recette) => ({
  code: recette.code,
  contentHash: empreinteDeRecette(recette),
  qualityLevel: recette.confidence,
  planningEligible: true,
}))

const verdictDe = (lignes, publiables = RAPPORT.recipes_static_eligible) => comparer(
  DEPOT,
  corpusDeLaBase(lignes),
  {
    publiablesDeclarees: publiables,
    planifiablesEnBase: lignes.filter((ligne) => ligne.planningEligible).length,
  },
)

describe('0b.5 — le verdict', () => {
  it('accepte une base qui porte le corpus du dépôt', () => {
    const lignes = baseConforme()
    // Le nombre de planifiables est aligné sur ce que le rapport déclare
    // publiable : c'est l'état d'après 0a.2, pas une base parfaite imaginaire.
    for (const [index, ligne] of lignes.entries()) ligne.planningEligible = index < RAPPORT.recipes_static_eligible
    const verdict = verdictDe(lignes)
    expect(verdict.refus).toEqual([])
    expect(verdict.parite).toBe(true)
    expect(verdict.empreinteBase).toBe(verdict.empreinteDepot)
  })

  it('refuse l’écart du §2.1 : les jumeaux, les variantes et les reprises absents de la base', () => {
    // L'écart mesuré par le plan : la base est restée au corpus du 31 juillet,
    // et les codes versés en septembre n'y sont pas. On le rejoue en retirant
    // les préfixes que le §2.1 nomme.
    const absents = new Set(CORPUS.recipes
      .filter((recette) => /^(JUM|VAR|SRC)-/.test(recette.code))
      .map((recette) => recette.code))
    expect(absents.size).toBeGreaterThan(0)
    const lignes = baseConforme().filter((ligne) => !absents.has(ligne.code))
    const verdict = verdictDe(lignes)

    expect(verdict.parite).toBe(false)
    expect(verdict.manquantes).toEqual([...absents].sort())
    expect(verdict.divergentes).toEqual([])
    expect(verdict.enTrop).toEqual([])
    expect(verdict.refus.length).toBeGreaterThanOrEqual(1)
    expect(verdict.refus[0]).toContain('empreinte du corpus')
    // Le motif porte le compte : un refus qui ne dit pas combien oblige à
    // rouvrir la base pour savoir s'il s'agit d'une recette ou de cent.
    expect(verdict.refus[0]).toContain(`${absents.size} recette(s)`)
  })

  it('refuse une base au bon nombre de recettes mais au mauvais contenu', () => {
    // Le cas qu'un simple compte laisserait passer : 754 recettes des deux
    // côtés, et l'une d'elles n'est pas la même. C'est ce qu'un rechargement
    // partiellement appliqué produit.
    const lignes = baseConforme()
    lignes[3].contentHash = '0'.repeat(32)
    const verdict = verdictDe(lignes)
    expect(verdict.parite).toBe(false)
    expect(verdict.divergentes).toEqual([lignes[3].code])
    expect(verdict.manquantes).toEqual([])
  })

  it('refuse une recette servie par la base que le corpus ne déclare pas', () => {
    const lignes = [...baseConforme(), {
      code: 'FANTOME-001', contentHash: 'f'.repeat(32), qualityLevel: 'B', planningEligible: true,
    }]
    const verdict = verdictDe(lignes)
    expect(verdict.parite).toBe(false)
    expect(verdict.enTrop).toEqual(['FANTOME-001'])
  })

  it('n’excuse QUE la recette retirée du catalogue, et la nomme', () => {
    // L'aménagement : une recette sortie du corpus n'est pas supprimée en base,
    // elle est marquée niveau D (la règle de FR-007, dont vingt-deux créneaux
    // planifiés dépendent). Elle ne doit pas faire rougir le contrôle pour
    // toujours — et elle doit rester visible.
    const lignes = [...baseConforme(), {
      code: 'FR-007', contentHash: '1'.repeat(32), qualityLevel: NIVEAU_RETIRE, planningEligible: false,
    }]
    const verdict = verdictDe(lignes)
    expect(verdict.enTrop).toEqual([])
    expect(verdict.retireesEnBase).toEqual(['FR-007'])
    expect(verdict.refus.filter((motif) => motif.includes('empreinte du corpus'))).toEqual([])

    // Et l'aménagement s'arrête là : une recette QUE LE DÉPÔT DÉCLARE mais que
    // la base a mise au niveau D est une recette que la base ne sert plus. Le
    // marquage ne doit pas pouvoir servir d'excuse à sa disparition.
    const retireeAtort = baseConforme()
    retireeAtort[0].qualityLevel = NIVEAU_RETIRE
    const second = verdictDe(retireeAtort)
    expect(second.parite).toBe(false)
    expect(second.manquantes).toEqual([retireeAtort[0].code])
  })

  it('refuse à part l’écart de recettes servables, sous son propre nom', () => {
    // Le second terme de l'écart du §2.1. Il ne se déduit pas de l'empreinte :
    // ici le corpus est le bon, et pourtant la base n'en sert que 542 — le
    // chiffre mesuré quand le catalogue d'aliments arrive APRÈS les tranches.
    const lignes = baseConforme()
    for (const [index, ligne] of lignes.entries()) ligne.planningEligible = index < 542
    const verdict = verdictDe(lignes)
    expect(verdict.empreinteBase).toBe(verdict.empreinteDepot)
    expect(verdict.parite).toBe(false)
    expect(verdict.refus).toHaveLength(1)
    expect(verdict.refus[0]).toContain('recettes servables')
    expect(verdict.refus[0]).toContain('542')
    expect(verdict.refus[0]).toContain(String(RAPPORT.recipes_static_eligible))
  })

  it('ne contrôle pas les servables quand la référence manque, au lieu de l’inventer', () => {
    // Un contrôle qui se donnerait une référence par défaut passerait au vert
    // sur une absence. Il vaut mieux qu'il ne contrôle pas ce terme et que le
    // reste tienne : l'empreinte, elle, est toujours vérifiée.
    const lignes = baseConforme()
    for (const ligne of lignes) ligne.planningEligible = false
    const verdict = comparer(DEPOT, corpusDeLaBase(lignes), {})
    expect(verdict.parite).toBe(true)
    expect(verdict.planifiablesEnBase).toBeNull()
    expect(verdict.publiablesDeclarees).toBeNull()
  })
})

describe('0b.5 — le contrôle est câblé là où le plan le place', () => {
  it('tourne dans le job « migrate-and-deploy » de release-production.yml, après les migrations', () => {
    expect(RELEASE).toContain('scripts/db/check-corpus-parity.mjs')
    const migrate = RELEASE.slice(RELEASE.indexOf('migrate-and-deploy:'))
    expect(migrate).toContain('scripts/db/check-corpus-parity.mjs')
    // Après l'application, sinon il refuserait à chaque release l'état que la
    // release est justement en train de corriger.
    expect(migrate.indexOf('apply-migrations.sh apply'))
      .toBeLessThan(migrate.indexOf('scripts/db/check-corpus-parity.mjs'))
    // Avant le déploiement : on ne publie pas du code contre une base qui ne
    // sert pas le corpus qu'il suppose.
    expect(migrate.indexOf('scripts/db/check-corpus-parity.mjs'))
      .toBeLessThan(migrate.indexOf('vercel@'))
  })

  it('n’est pas placé dans le job « test » de ci.yml, qui n’a aucune base à lire', () => {
    // ci.yml lignes 18-19 : NEXT_PUBLIC_SUPABASE_URL vaut https://example.supabase.co.
    // L'y mettre aurait donné une porte verte sur rien — le défaut que le plan
    // relève déjà pour `npm run prices:check`.
    const jobTest = CI.slice(CI.indexOf('  test:'), CI.indexOf('  db-tests:'))
    expect(jobTest).toContain('https://example.supabase.co')
    expect(jobTest).not.toContain('check-corpus-parity')
    // Il tourne en revanche dans db-tests, qui a un Postgres, sur les deux
    // scénarios — celui des chargeurs et celui des seules migrations.
    const jobDb = CI.slice(CI.indexOf('  db-tests:'))
    expect(jobDb).toContain('check-corpus-parity')
    expect(jobDb).toContain('[A] Parité corpus base/dépôt')
    expect(jobDb).toContain('[B] Parité corpus base/dépôt')
  })
})
