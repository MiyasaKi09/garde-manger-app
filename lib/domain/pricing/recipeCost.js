/**
 * Coût estimé d'une recette — en fourchette, au total et par portion.
 *
 * DÉCALQUE, ET OÙ LE DÉCALQUE S'ARRÊTE. La couverture est celle de
 * `nutritionCoverage` (lib/domain/nutrition/calculator.js), `withData` devenant
 * `priced` (§6). Mais `materializeRecipe` pose un BLOQUEUR quand la couverture
 * nutritionnelle n'est pas à 100 %, et cette couche n'en pose aucun (§6.1) :
 * une recette dont on ignore le prix reste parfaitement cuisinable. Rien ici ne
 * touche à `materializeRecipe`, ne fabrique d'issue prix, ni ne fait varier
 * `eligible` — le prix se calcule EN AVAL de la recette déjà matérialisée.
 *
 * Ce module rend `coutConsomme` et lui seul (§6.2) : ce que le plat consomme,
 * assis sur les grammes exacts. Ce qu'on paie en caisse est un autre montant,
 * assis sur des contenants entiers, et il vit dans shoppingListCost.js. Les
 * confondre ferait passer le surplus qui rejoint le garde-manger pour de la
 * nourriture mangée.
 */

import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { trouverPrix, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import {
  arrondirFourchette,
  calculerCouverture,
  composerFourchettes,
  diviserFourchette,
  fourchetteLigne,
  masseAcheteeGrammes,
  verdictAffichage,
} from '@/lib/domain/pricing/priceMath'

const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * Ingrédients exploitables, quelle que soit la forme de l'entrée.
 *
 * On accepte une recette matérialisée (`exactIngredients`) comme un simple
 * tableau de lignes : la couche prix n'a besoin que de trois choses — un nom,
 * une forme, des grammes — et exiger l'objet complet de `materializeRecipe`
 * empêcherait de chiffrer un panier assemblé à la main.
 */
function lignesDeRecette(recette) {
  if (Array.isArray(recette)) return recette
  if (Array.isArray(recette?.exactIngredients)) return recette.exactIngredients
  return []
}

/**
 * Mise à l'échelle des portions.
 *
 * Les masses sont multipliées directement, et ce n'est PAS un raccourci :
 * `materializeRecipe` calcule `quantity × scale` puis convertit par `toGramsV2`,
 * dont toutes les branches sont linéaires en la quantité. Mettre à l'échelle les
 * grammes ou re-matérialiser la recette donne donc exactement le même nombre,
 * au flottant près.
 *
 * Cette linéarité vaut pour les MASSES et pour elles seules. Le piège 6 de
 * CLAUDE.md — les temps de cuisson ne scalent pas linéairement — porte sur les
 * durées, qui ne traversent jamais ce fichier.
 */
function facteurEchelle(recette, servingsDemandees) {
  const base = nombre(recette?.servings)
  const cible = nombre(servingsDemandees)
  if (cible == null || cible <= 0 || base == null || base <= 0) return { facteur: 1, servings: base ?? null }
  return { facteur: cible / base, servings: cible }
}

/**
 * @param {Object|Array} recette — recette matérialisée, ou tableau de lignes
 *   `{ name, formNormalized, grams }`
 * @param {Object} index — index rendu par `buildPriceIndex` / `obtenirIndexPrix`
 * @param {{ servings?: number|null }} options
 */
export function computeRecipeCost(recette, index, { servings = null } = {}) {
  const idx = index || INDEX_PRIX_VIDE
  const { facteur, servings: portions } = facteurEchelle(recette, servings)
  const lignes = []

  for (const ingredient of lignesDeRecette(recette)) {
    const grammes = nombre(ingredient?.grams)
    const nom = ingredient?.name ?? ingredient?.form ?? null
    const forme = ingredient?.formNormalized
      || ingredient?.form_normalized
      || (nom ? normalizeFoodForm(nom) : null)
    const grammesEchelle = grammes == null ? null : grammes * facteur

    const base = {
      name: nom,
      formNormalized: forme,
      grams: grammesEchelle,
      optional: Boolean(ingredient?.optional),
    }

    // Une ligne sans grammes exploitables n'est pas « non chiffrée » : elle
    // n'est pas quantifiée du tout, exactement comme en nutrition, et elle
    // n'entre donc dans aucun des deux dénominateurs de la couverture.
    if (grammesEchelle == null || grammesEchelle <= 0) {
      lignes.push({ ...base, priced: false, reason: 'non_quantifie', range: null, entry: null })
      continue
    }

    const recherche = trouverPrix(idx, forme)
    if (!recherche.trouve) {
      lignes.push({ ...base, priced: false, reason: recherche.raison, range: null, entry: null })
      continue
    }

    const entree = recherche.entree
    const range = fourchetteLigne(entree.perKg, grammesEchelle, entree.edibleYield.value)
    if (!range) {
      lignes.push({ ...base, priced: false, reason: 'fourchette_incalculable', range: null, entry: entree })
      continue
    }

    lignes.push({
      ...base,
      priced: true,
      reason: null,
      range,
      // La masse ACHETÉE diffère de la masse de la forme dès que le rendement
      // est sourcé et < 1 ; l'exposer permet à l'interface d'expliquer l'écart
      // au lieu de le subir.
      purchasedGrams: masseAcheteeGrammes(grammesEchelle, entree.edibleYield.value),
      yieldKnown: entree.edibleYield.known,
      confidence: entree.confidence,
      entry: entree,
    })
  }

  const couverture = calculerCouverture(lignes)
  const total = composerFourchettes(lignes.filter((l) => l.priced).map((l) => l.range))
  const parPortion = portions ? diviserFourchette(total, portions) : null
  const verdict = verdictAffichage(couverture, { referentielPerime: Boolean(idx.stale) })

  return {
    servings: portions,
    scale: facteur,
    currency: idx.currency,
    referenceDate: idx.referenceDate,

    coutConsomme: {
      total,
      parPortion,
      // Les montants arrondis sont fournis À CÔTÉ des bruts, jamais à leur
      // place : arrondir avant de composer propagerait l'arrondi dans la
      // quadrature, et vingt arrondis à 0,10 € composés donnent une largeur
      // fantôme que rien n'a observée.
      totalArrondi: arrondirFourchette(total),
      parPortionArrondi: arrondirFourchette(parPortion, { parPortion: true }),
    },

    coverage: couverture,

    /**
     * Le montant est un MINORANT dès que l'une des deux causes joue, et les deux
     * poussent dans le même sens — vers le haut. Les lignes non chiffrées ne
     * peuvent qu'ajouter (§7.3) ; un rendement laissé à 1,00 faute de source
     * sous-estime la masse achetée (§2.3). D'où « au moins » et « hors pertes de
     * parage », qui ne sont pas des précautions de style mais deux constats.
     */
    minorant: couverture.pct !== 100 || couverture.yieldKnownPct !== 100,
    parageInconnu: couverture.yieldKnownPct !== 100,

    displayable: verdict.affichable,
    displayRefusal: verdict.refus,

    lines: lignes,
    attributions: idx.attributions ?? [],
  }
}

/**
 * §8.4 — comparer des recettes par prix.
 *
 * « Une recette paraît moins chère quand elle est moins couverte : trier par
 * prix des couvertures inégales, c'est trier par ignorance. » Le tri n'est donc
 * autorisé qu'à l'intérieur du sous-ensemble intégralement couvert, et la
 * fonction rend explicitement les deux ensembles pour que l'interface puisse
 * dire sur quoi porte son classement — au lieu de faire disparaître les exclues.
 *
 * Ce qui a été écarté : trier tout le monde en marquant les incomplètes d'un
 * astérisque. L'ordre reste faux, et un astérisque n'a jamais empêché personne
 * de lire la première ligne comme « la moins chère ».
 */
export function classerParCout(estimations) {
  const comparables = []
  const nonComparables = []
  for (const estimation of estimations || []) {
    const complet = estimation?.displayable
      && estimation.coverage?.pct === 100
      && estimation.coutConsomme?.total
    ;(complet ? comparables : nonComparables).push(estimation)
  }
  comparables.sort((a, b) => a.coutConsomme.total.central - b.coutConsomme.total.central)
  return {
    comparables,
    nonComparables,
    /** Vrai quand le classement porte sur tout l'ensemble : seul cas où l'interface peut se taire. */
    complet: nonComparables.length === 0,
  }
}
