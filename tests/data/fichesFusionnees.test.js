import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipe } from '@/lib/domain/recipes/canonicalCatalog'
import { ingredientOrigin, isVegetarianCompatibleOrigin } from '@/lib/domain/foods/origins'
import { couplesDeclares, couplesFusionnablesDeclares } from '@/lib/domain/recipes/ficheFusionnee'

/**
 * L'ARBITRAGE DES FICHES FUSIONNÉES, RELU PAR UN TEST — livrable 2.3.
 *
 * `data/recipes/arbitrations/fiches-fusionnees.json` est le SEUL endroit où un
 * couple (plat carné, jumeau végétarien) est déclaré cuisinable en une fois.
 * Le plan pose la règle : le point de divergence se calcule, puis il est
 * déclaré ; il n'est jamais deviné à l'exécution. Ce fichier verrouille ce que
 * la déclaration doit tenir pour que la fiche servie soit vraie.
 *
 * QUATRE PROPRIÉTÉS, ET CHACUNE RÉPOND À UNE FAÇON DE SE TROMPER :
 *   1. le couple existe vraiment — deux codes du corpus, MÊME LIGNÉE, l'un
 *      carné, l'autre végétarien selon `classifyRecipe`, pas selon le nom ;
 *   2. la fiche ne perd ni n'invente un geste — chaque étape de chaque recette
 *      apparaît une fois et une seule dans les blocs, dans l'ordre de sa
 *      recette ;
 *   3. rien de carné dans le pot commun — aucune forme d'origine non
 *      végétarienne parmi les ingrédients que les deux recettes partagent.
 *      C'est la propriété qui protège l'assiette de Zoé, et c'est la seule que
 *      la machine peut vérifier à notre place ;
 *   4. un refus est motivé — un couple relu et refusé porte son motif, parce
 *      qu'un refus sans raison se rouvre tous les six mois.
 */

const ARBITRAGE = JSON.parse(readFileSync(
  join(process.cwd(), 'data', 'recipes', 'arbitrations', 'fiches-fusionnees.json'),
  'utf8',
))

const decisions = ARBITRAGE.decisions
const fusionnables = decisions.filter((decision) => decision.fusionnable)
const refusees = decisions.filter((decision) => !decision.fusionnable)
const lignee = (recette) => recette?.derivedFrom || recette?.code

describe('fiches fusionnées — l’arbitrage', () => {
  it('ne déclare que des couples du corpus, de même lignée, l’un carné l’autre végétarien', () => {
    const fautes = []
    for (const decision of decisions) {
      const carne = getCanonicalRecipe(decision.carne)
      const vege = getCanonicalRecipe(decision.vege)
      if (!carne) { fautes.push(`${decision.carne} absent du corpus`); continue }
      if (!vege) { fautes.push(`${decision.vege} absent du corpus`); continue }
      if (carne.family !== decision.famille_carne) fautes.push(`${decision.carne} : famille déclarée « ${decision.famille_carne} », corpus « ${carne.family} »`)
      if (vege.family !== decision.famille_vege) fautes.push(`${decision.vege} : famille déclarée « ${decision.famille_vege} », corpus « ${vege.family} »`)
      if (lignee(carne) !== lignee(vege)) fautes.push(`${decision.carne}/${decision.vege} : lignées ${lignee(carne)} et ${lignee(vege)}`)
      if (lignee(vege) !== decision.lignee) fautes.push(`${decision.carne}/${decision.vege} : lignée déclarée ${decision.lignee}, calculée ${lignee(vege)}`)
      if (classifyRecipe(carne).vegetarian) fautes.push(`${decision.carne} est classée végétarienne : ce n'est pas le côté carné d'un couple`)
      if (!classifyRecipe(vege).vegetarian) fautes.push(`${decision.vege} n'est pas classée végétarienne`)
    }
    expect(fautes).toEqual([])
  })

  it('déclare chaque couple une seule fois', () => {
    const cles = decisions.map((decision) => `${decision.carne}/${decision.vege}`)
    expect(cles.length).toBe(new Set(cles).size)
  })

  it('couvre chaque étape des deux recettes une fois et une seule, dans l’ordre', () => {
    const fautes = []
    for (const decision of fusionnables) {
      const carne = getCanonicalRecipe(decision.carne)
      const vege = getCanonicalRecipe(decision.vege)
      for (const [cote, recette] of [['carne', carne], ['vege', vege]]) {
        const declarees = decision.blocs.flatMap((bloc) => bloc[cote] || [])
        const attendues = (recette.exactSteps || []).map((etape) => Number(etape.n))
        const triees = [...declarees].sort((gauche, droite) => gauche - droite)
        if (JSON.stringify(triees) !== JSON.stringify(attendues)) {
          fautes.push(`${decision.carne}/${decision.vege} côté ${cote} : étapes déclarées ${declarees.join(',')} pour ${attendues.join(',')} au corpus`)
        }
        if (JSON.stringify(declarees) !== JSON.stringify(triees)) {
          fautes.push(`${decision.carne}/${decision.vege} côté ${cote} : les blocs ne suivent pas l'ordre de la recette (${declarees.join(',')})`)
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('donne à chaque bloc commun ou parallèle un texte pris d’un côté qui porte des étapes', () => {
    const fautes = []
    for (const decision of fusionnables) {
      for (const bloc of decision.blocs) {
        if (bloc.role === 'divergente') {
          if (!(bloc.carne || []).length && !(bloc.vege || []).length) {
            fautes.push(`${decision.carne}/${decision.vege} : bloc divergent vide des deux côtés`)
          }
          continue
        }
        if (!['commune', 'parallele'].includes(bloc.role)) {
          fautes.push(`${decision.carne}/${decision.vege} : rôle de bloc inconnu « ${bloc.role} »`)
          continue
        }
        if (!['carne', 'vege'].includes(bloc.texte)) {
          fautes.push(`${decision.carne}/${decision.vege} : bloc ${bloc.role} sans côté de texte déclaré`)
          continue
        }
        if (!(bloc[bloc.texte] || []).length) {
          fautes.push(`${decision.carne}/${decision.vege} : le texte est pris côté ${bloc.texte}, qui n'a aucune étape dans ce bloc`)
        }
        // Un bloc commun ou parallèle est un geste que les DEUX recettes font :
        // s'il n'a d'étapes que d'un côté, ce n'est pas un bloc commun, c'est un
        // bloc divergent mal nommé.
        if (!(bloc.carne || []).length || !(bloc.vege || []).length) {
          fautes.push(`${decision.carne}/${decision.vege} : bloc ${bloc.role} sans vis-à-vis des deux côtés`)
        }
      }
      if (!decision.blocs.some((bloc) => bloc.role === 'commune')) {
        fautes.push(`${decision.carne}/${decision.vege} : déclaré fusionnable sans un seul bloc commun`)
      }
    }
    expect(fautes).toEqual([])
  })

  it('ne laisse aucune forme d’origine non végétarienne dans ce que les deux recettes partagent', () => {
    // La propriété qui protège l'assiette de Zoé. Ce que les deux recettes ont
    // en commun finit dans un seul récipient : si une forme carnée s'y trouvait,
    // la fusion la lui servirait. Les ingrédients FACULTATIFS comptent ici comme
    // les autres — le jambon de Bayonne du poulet basquaise est facultatif, et
    // c'est exactement lui que l'arbitrage doit exclure de la base commune.
    const fautes = []
    for (const decision of fusionnables) {
      const carne = getCanonicalRecipe(decision.carne)
      const vege = getCanonicalRecipe(decision.vege)
      const formesVege = new Set((vege.exactIngredients || []).map((ingredient) => ingredient.formNormalized))
      const exclus = new Set((decision.exclus_de_la_base_commune || []).map((exclusion) => exclusion.forme))
      for (const ingredient of carne.exactIngredients || []) {
        if (!formesVege.has(ingredient.formNormalized)) continue
        if (exclus.has(ingredient.name)) continue
        if (!isVegetarianCompatibleOrigin(ingredientOrigin(ingredient))) {
          fautes.push(`${decision.carne}/${decision.vege} : « ${ingredient.name} » (${ingredientOrigin(ingredient)}) est partagé par les deux recettes sans être exclu de la base commune`)
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('n’exclut de la base commune que des formes que la recette carnée porte vraiment', () => {
    const fautes = []
    for (const decision of decisions) {
      const carne = getCanonicalRecipe(decision.carne)
      for (const exclusion of decision.exclus_de_la_base_commune || []) {
        const porte = (carne.exactIngredients || []).some((ingredient) => ingredient.name === exclusion.forme)
        if (!porte) fautes.push(`${decision.carne} : « ${exclusion.forme} » exclue de la base commune mais absente de la recette`)
        if (!exclusion.motif || exclusion.motif.length < 40) fautes.push(`${decision.carne} : exclusion « ${exclusion.forme} » sans motif`)
      }
    }
    expect(fautes).toEqual([])
  })

  it('ne nomme jamais une forme exclue dans le texte d’un bloc commun', () => {
    // L'exclusion ne suffit pas à protéger l'assiette : encore faut-il que le
    // TEXTE affiché dans le bloc commun ne demande pas de l'ajouter. Le cas est
    // réel — l'étape 2 du poulet basquaise dit « Ajouter éventuellement le
    // jambon », et c'est cette étape-là qui tombe dans le bloc commun. La parade
    // déclarée est de prendre le texte du jumeau ; ce test vérifie qu'elle tient
    // sur le texte réellement servi, pas sur l'intention.
    const motsGeneriques = new Set(['cru', 'crue', 'cuit', 'cuite', 'frais', 'fraiche', 'sec', 'seche', 'moulu', 'moulue', 'fine', 'entier', 'entiere', 'avec', 'sans'])
    const mots = (valeur) => String(valeur || '')
      .replace(/œ/gi, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().split(/[^a-z0-9]+/)
      .filter((mot) => mot.length > 3 && !motsGeneriques.has(mot))
    const fautes = []
    for (const decision of fusionnables) {
      const interdits = (decision.exclus_de_la_base_commune || []).flatMap((exclusion) => mots(exclusion.forme))
      if (!interdits.length) continue
      const recettes = { carne: getCanonicalRecipe(decision.carne), vege: getCanonicalRecipe(decision.vege) }
      for (const bloc of decision.blocs.filter((item) => item.role !== 'divergente')) {
        const textes = (bloc[bloc.texte] || [])
          .map((numero) => recettes[bloc.texte].exactSteps.find((etape) => Number(etape.n) === numero)?.instruction || '')
          .join(' ')
        const trouves = mots(textes).filter((mot) => interdits.includes(mot))
        if (trouves.length) fautes.push(`${decision.carne}/${decision.vege} : le texte commun (côté ${bloc.texte}) nomme ${[...new Set(trouves)].join(', ')}, qui est exclu de la base commune`)
      }
    }
    expect(fautes).toEqual([])
  })

  it('déclare des protéines qui séparent réellement les deux recettes', () => {
    const fautes = []
    for (const decision of decisions) {
      const carne = getCanonicalRecipe(decision.carne)
      const vege = getCanonicalRecipe(decision.vege)
      const formes = (recette) => new Set((recette.exactIngredients || []).map((ingredient) => ingredient.name))
      for (const [cote, porteur, oppose] of [
        ['proteine_carne', formes(carne), formes(vege)],
        ['proteine_vege', formes(vege), formes(carne)],
      ]) {
        for (const forme of decision[cote] || []) {
          if (!porteur.has(forme)) fautes.push(`${decision.carne}/${decision.vege} : ${cote} « ${forme} » absente de sa propre recette`)
          if (oppose.has(forme)) fautes.push(`${decision.carne}/${decision.vege} : ${cote} « ${forme} » présente aussi dans l'autre recette — elle ne sépare rien`)
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('motive chaque refus, et n’y laisse aucun bloc', () => {
    const fautes = []
    for (const decision of refusees) {
      if (!decision.motif || decision.motif.length < 120) fautes.push(`${decision.carne}/${decision.vege} : refus sans motif circonstancié`)
      if (decision.blocs) fautes.push(`${decision.carne}/${decision.vege} : refusé mais porte des blocs`)
    }
    expect(fautes).toEqual([])
  })

  it('expose au domaine exactement ce que le fichier déclare', () => {
    expect(couplesDeclares()).toHaveLength(decisions.length)
    expect(couplesFusionnablesDeclares().map((couple) => `${couple.carne}/${couple.vege}`))
      .toEqual(fusionnables.map((decision) => `${decision.carne}/${decision.vege}`))
  })
})
