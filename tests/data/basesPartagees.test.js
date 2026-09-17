import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BASE_REUSE_ACTIVE_MINUTES as REUSE_MOTEUR, recipeBaseRefs, usesSharedBase } from '@/lib/domain/planning/sharedBases'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import {
  BASE_REUSE_ACTIVE_MINUTES as REUSE_SCRIPT,
  VERSION_MIGRATION,
  EMPREINTES_GELEES,
  arbitrage,
  construireMigration,
  gardeDeclareeJours,
  minutesActives,
  verifierDecisions,
} from '../../scripts/data/recipes/link-shared-bases.mjs'

/**
 * L'ARBITRAGE DES BASES PARTAGÉES, RELU PAR UN TEST (livrable 2.1).
 *
 * Le fichier `data/recipes/arbitrations/bases-partagees.json` est le seul
 * endroit où un lien plat → base est décidé. La parade que le plan impose au
 * risque de faux positif est « chaque lien est arbitré et motivé ; UNE BASE NON
 * ARBITRÉE N'EST PAS POSÉE » : ce test la verrouille dans les deux sens — rien
 * au corpus qui ne soit à l'arbitrage, rien à l'arbitrage qui ne se retrouve au
 * corpus.
 *
 * Ce qu'il ne fait pas : mesurer le chemin base. C'est
 * `supabase/tests/bases_partagees.sql`, rejoué par le job `db-tests` dans les
 * deux scénarios. Un test Vitest qui lit du SQL comme du texte prouve qu'une
 * écriture est écrite, pas qu'elle rend la bonne valeur — même réserve que
 * `tests/db/contratOperationnel.test.js`, et pour la même raison.
 */

const RACINE = process.cwd()
const lire = (...segments) => readFileSync(join(RACINE, ...segments), 'utf8')
const CORPUS = JSON.parse(lire('data', 'recipes', 'corpus-v3.json'))
const MANIFESTE = JSON.parse(lire('scripts', 'db', 'migration-manifest.json'))
const MIGRATION = lire('supabase', 'migrations', `${VERSION_MIGRATION}_bases_partagees.sql`)
const ROLLBACK = lire('supabase', 'migrations', `${VERSION_MIGRATION}_bases_partagees_rollback.sql`)
const ASSERTIONS = lire('supabase', 'tests', 'bases_partagees.sql')

const SEUIL_DE_REPRISE = REUSE_SCRIPT
const posees = arbitrage.decisions.filter((decision) => decision.pose)
const refusees = arbitrage.decisions.filter((decision) => !decision.pose)
const platsLies = new Set(posees.map((decision) => decision.code))

describe('bases partagées — l’arbitrage', () => {
  it('se retrouve ligne à ligne dans le corpus, sans une divergence', () => {
    // C'est la porte du script lui-même : code, famille, portions, position,
    // forme, quantité, unité et caractère facultatif de CHAQUE décision sont
    // comparés au corpus. Une fiche réécrite fait rougir ici avant de faire
    // poser un lien approximatif.
    expect(verifierDecisions()).toEqual([])
  })

  it('motive chaque décision, et nomme le refus comme un refus', () => {
    for (const decision of arbitrage.decisions) {
      expect(String(decision.motif || '').length, `${decision.base} → ${decision.code}`).toBeGreaterThan(40)
    }
    for (const decision of refusees) {
      expect(decision.motif.startsWith('REFUSÉ'), `${decision.base} → ${decision.code}`).toBe(true)
    }
    // Les refus ne sont pas un ornement : ils sont la preuve que l'appariement
    // a été arbitré et non déroulé. Les trois familles nommées par les règles
    // R3 du fichier — « non salé », « jasmin », « salvadorienne » — doivent y
    // être, sans quoi le lot aurait cessé de refuser quoi que ce soit.
    expect(refusees.length).toBeGreaterThan(0)
    const formes = refusees.map((decision) => decision.ingredient)
    expect(formes).toContain('Bouillon de légumes non salé')
    expect(formes).toContain('Riz jasmin cuit froid')
    expect(formes).toContain('Sauce tomate salvadorienne')
  })

  it('ne pose que sur des bases que le solveur saura employer', () => {
    // `buildSharedBaseCatalog` écarte une base qui n'économise pas de temps ou
    // dont la garde n'est pas déclarée : elle deviendrait `shared_base_recipe_unknown`
    // et le lien serait posé pour rien.
    for (const base of new Set(posees.map((decision) => decision.base))) {
      const recette = CORPUS.recipes.find((item) => item.code === base)
      expect(recette, base).toBeTruthy()
      expect(minutesActives(recette), base).toBeGreaterThan(SEUIL_DE_REPRISE)
      expect(gardeDeclareeJours(recette), base).toBeGreaterThan(0)
    }
  })

  it('garde le même seuil de reprise que le moteur', () => {
    // Le script est un .mjs lancé par node et ne peut pas importer lib/ ;
    // la constante y est recopiée. Ce test est ce qui l'empêche de dériver.
    expect(REUSE_SCRIPT).toBe(REUSE_MOTEUR)
  })
})

describe('bases partagées — le corpus', () => {
  it('porte exactement les liens posés, et aucun autre', () => {
    const auCorpus = []
    for (const recette of CORPUS.recipes) {
      for (const [index, ingredient] of recette.ingredients.entries()) {
        if (!ingredient.component) continue
        auCorpus.push(`${recette.code}|${index + 1}|${ingredient.component.code}`)
      }
    }
    const attendus = posees.map((decision) => `${decision.code}|${decision.position}|${decision.base}`)
    expect(auCorpus.sort()).toEqual(attendus.sort())
  })

  it('déclare la quantité de la ligne d’ingrédient, et aucun rendement inventé', () => {
    for (const recette of CORPUS.recipes) {
      for (const ingredient of recette.ingredients) {
        if (!ingredient.component) continue
        expect(ingredient.component.requiredQuantity, recette.code).toBe(ingredient.quantity)
        expect(ingredient.component.requiredUnit, recette.code).toBe(ingredient.unit)
        // R5 : le rendement d'une base n'est pas déclaré tant qu'une fiche ne le
        // déclare pas. Une somme d'ingrédients crus serait un chiffre plausible
        // et faux — une sauce perd la moitié de son eau à la réduction.
        expect(ingredient.component.yieldQuantity, recette.code).toBeUndefined()
        expect(ingredient.component.yieldUnit, recette.code).toBeUndefined()
      }
    }
  })

  it('ne lie jamais une base à une autre base : aucune chaîne', () => {
    const bases = new Set(posees.map((decision) => decision.base))
    for (const code of bases) {
      expect(platsLies.has(code), `${code} est à la fois base et plat lié`).toBe(false)
    }
  })

  it('traverse materializeRecipe, sinon le chemin JSON resterait aveugle', () => {
    // La mesure qui compte côté dépôt : ce que le moteur VOIT. Le décompte
    // diffère de celui du corpus pour deux raisons déclarées — les ingrédients
    // facultatifs sont écartés par `recipeBaseRefs`, et une ligne dont la forme
    // n'est pas au catalogue d'aliments n'entre pas dans `exactIngredients`.
    const corpusEntier = getCanonicalRecipes({ eligibleOnly: false })
    const vues = corpusEntier.filter(usesSharedBase)
    expect(vues.length).toBeGreaterThan(0)
    const facultatifs = posees.filter((decision) => decision.optional).length
    const horsCatalogue = posees.length - corpusEntier
      .flatMap((recette) => recette.exactIngredients.filter((ingredient) => ingredient.component))
      .length
    expect(vues.length).toBe(platsLies.size - facultatifs - horsCatalogue)
    for (const recette of vues) {
      for (const ref of recipeBaseRefs(recette)) {
        expect(ref.code, recette.code).toBeTruthy()
        expect(ref.requiredQuantity, `${recette.code} → ${ref.code}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('bases partagées — la migration', () => {
  it('est inscrite au manifeste avec son rollback', () => {
    const apply = MANIFESTE.find((entree) => entree.file === `${VERSION_MIGRATION}_bases_partagees.sql`)
    const rollback = MANIFESTE.find((entree) => entree.file === `${VERSION_MIGRATION}_bases_partagees_rollback.sql`)
    expect(apply?.role).toBe('apply')
    expect(apply?.baseline).toBe('new')
    expect(rollback?.role).toBe('rollback')
    expect(existsSync(join(RACINE, 'supabase', 'migrations', `${VERSION_MIGRATION}_bases_partagees_rollback.sql`))).toBe(true)
  })

  it('est la projection exacte de l’arbitrage, régénérable à l’identique', () => {
    // Le fichier commité doit être ce que le script produit aujourd'hui :
    // sinon il aurait été édité à la main, et l'arbitrage cesserait d'être la
    // source. C'est la même discipline que les chargeurs générés.
    const { migration, rollback, lignes, plats } = construireMigration()
    expect(migration).toBe(MIGRATION)
    expect(rollback).toBe(ROLLBACK)
    expect(lignes).toBe(posees.length)
    expect(plats).toBe(platsLies.size)
  })

  it('porte l’empreinte d’AVANT que les tranches figées du corpus déclarent', () => {
    // `check-corpus-parity` compare recette par recette le md5 du JSON du dépôt
    // à `content_hash` en base. Poser un `component` change ce JSON ; les dix
    // tranches du 17 septembre sont figées et portent l'empreinte d'avant. Si la
    // migration se trompait d'empreinte d'avant, sa garde ne matcherait rien et
    // la parité resterait rouge sans que rien ne le dise.
    const empreintes = [...MIGRATION.matchAll(/\('([A-Z0-9-]+)', '([0-9a-f]{32})', '([0-9a-f]{32})'\)/g)]
    expect(empreintes).toHaveLength(platsLies.size)
    const tranches = readdirSync(join(RACINE, 'supabase', 'migrations'))
      .filter((fichier) => /corpus_v3_754_tranche_\d+\.sql$/.test(fichier))
      .map((fichier) => lire('supabase', 'migrations', fichier))
      .join('\n')
    expect(tranches.length).toBeGreaterThan(0)
    for (const [, code, avant, apres] of empreintes) {
      const recette = CORPUS.recipes.find((item) => item.code === code)
      expect(tranches.includes(`'${avant}'`), `${code} : empreinte d'avant absente des tranches`).toBe(true)
      const gelee = EMPREINTES_GELEES[code]
      if (!gelee) {
        const sansLien = { ...recette, ingredients: recette.ingredients.map(({ component, ...reste }) => reste) }
        expect(createHash('md5').update(JSON.stringify(sansLien)).digest('hex'), code).toBe(avant)
        expect(createHash('md5').update(JSON.stringify(recette)).digest('hex'), code).toBe(apres)
        continue
      }
      // UN PLAT LIÉ QU'UN LOT POSTÉRIEUR A RÉÉCRIT. Sa fiche a changé depuis le
      // 18 septembre : les deux empreintes de CETTE migration décrivent une
      // transition passée, et les recalculer depuis le corpus d'aujourd'hui
      // n'aurait aucun sens. Ce qui doit rester vrai, et qui est vérifié ici :
      // le gel déclare exactement ce que le fichier commité porte, la migration
      // qu'il cite existe, elle est postérieure, et c'est ELLE qui écrit
      // l'empreinte du corpus d'aujourd'hui. Sans ces quatre contrôles, le gel
      // serait une porte ouverte pour faire taire n'importe quelle dérive.
      expect([gelee.avant, gelee.apres], `${code} : le gel ne décrit pas le fichier commité`).toEqual([avant, apres])
      const posterieure = lire('supabase', 'migrations', gelee.depuis)
      expect(gelee.depuis > `${VERSION_MIGRATION}_bases_partagees.sql`, `${code} : ${gelee.depuis} n'est pas postérieure`).toBe(true)
      const aujourdhui = createHash('md5').update(JSON.stringify(recette)).digest('hex')
      expect(aujourdhui, `${code} : ${gelee.depuis} n'écrit pas l'empreinte du corpus d'aujourd'hui`).not.toBe(apres)
      expect(
        posterieure.includes(`'${aujourdhui}'`),
        `${code} : aucune migration postérieure ne porte l'empreinte du corpus d'aujourd'hui`,
      ).toBe(true)
    }
  })

  it('repose les liens à chaque chargement de corpus, sinon un rechargement les effacerait', () => {
    // Chaque bloc recette du chargeur commence par
    // `DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version`.
    // Sans le bloc de fin, un rechargement du corpus reviendrait à l'état inerte.
    const chargeur = lire('scripts', 'data', 'recipes', 'build-corpus-v3.mjs')
    expect(chargeur).toContain('const liensDeBase = []')
    expect(chargeur).toContain('INSERT INTO culinary.recipe_components')
    expect(chargeur).toContain("SET component_id = composant.id, requirement_type = 'sub_recipe'")
  })

  it('porte les liens en CTE, jamais en table temporaire : psql charge en autocommit', () => {
    // La faute a été commise, et elle a bloqué la CI entière : le bloc créait
    // `_liens_corpus` en `CREATE TEMP TABLE ... ON COMMIT DROP`, puis y insérait
    // dans l'instruction SUIVANTE. Or la CI charge le corpus avec
    // `psql -v ON_ERROR_STOP=1 -q -f`, sans `--single-transaction` et sans
    // `BEGIN` : chaque instruction est sa propre transaction, la table
    // disparaissait au commit de sa création, et l'INSERT échouait sur
    // « relation "_liens_corpus" does not exist » — chargeur arrêté, pipeline de
    // release verrouillé.
    //
    // Ce test tient sur le SQL PRODUIT, pas sur le générateur : le commentaire
    // du générateur cite le nom de la table disparue, et chercher le nom dans la
    // source rendrait ce test rouge pour la mauvaise raison. Les lignes de
    // commentaire du SQL sont retirées avant la mesure, pour cette même raison —
    // le chargeur porte l'explication ci-dessus, en toutes lettres.
    const sql = lire('scripts', 'data', 'out', 'corpus-v3-load.sql')
    const instructions = sql.replace(/^\s*--.*$/gm, '')
    expect(instructions).not.toMatch(/CREATE\s+TEMP\s+TABLE/i)
    expect(instructions).not.toMatch(/ON\s+COMMIT\s+DROP/i)
    // Les deux instructions qui consomment les liens les portent chacune la leur.
    const cte = sql.match(/WITH lien\(parent_code, base_code, ingredient_pos, ingredient_name, component_name, component_pos, required_quantity, required_unit\) AS \(/g)
    expect(cte, 'les deux instructions de liens doivent porter leur propre CTE').toHaveLength(2)
  })
})

describe('bases partagées — les assertions SQL', () => {
  it('attendent les comptes de l’arbitrage, et pas d’autres', () => {
    // Les deux seuls nombres écrits en dur dans supabase/tests/bases_partagees.sql
    // viennent d'ici. Les changer d'un côté seulement fait rougir ce test.
    expect(ASSERTIONS).toContain(`IF v_liens <> ${posees.length} THEN`)
    expect(ASSERTIONS).toContain(`IF v_plats <> ${platsLies.size} THEN`)
  })

  it('sont rejouées par les deux scénarios du job db-tests', () => {
    const ci = lire('.github', 'workflows', 'ci.yml')
    const appels = ci.match(/-f supabase\/tests\/bases_partagees\.sql/g) || []
    expect(appels).toHaveLength(2)
    expect(ci).toContain('DATABASE_URL: ${{ env.DB_A }}')
    expect(ci).toContain('DATABASE_URL: ${{ env.DB_B }}')
  })
})
