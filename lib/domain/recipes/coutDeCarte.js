/**
 * Le bloc `cost` d'une carte de catalogue — et la raison pour laquelle il vit
 * dans un fichier à lui.
 *
 * CE QU'IL FAIT. Il prend une recette DÉJÀ MATÉRIALISÉE et un index de prix
 * déjà construit, et il en tire les ARGUMENTS de la rédaction, jamais la
 * rédaction : des nombres bruts et un verdict, aucune chaîne formatée. La mise
 * en mots — « au moins », les pas d'arrondi du §7.2, la date à côté du montant
 * — appartient à `components/pricing/estimationView`, qui n'a rien à faire dans
 * la couche de domaine ; et la forme choisie ici est exactement celle que
 * `vueEstimation` consomme, de sorte qu'un écran écrit
 * `vueEstimation(carte.canonical_quality.cost)` et rien d'autre.
 *
 * POURQUOI IL N'EST PLUS DANS `canonicalCatalog.js` — jalon J1 de la phase 5.
 * Ce bloc était exporté depuis `canonicalCatalog.js` parce que le catalogue
 * servi par l'API construit ses cartes depuis la base et non depuis le corpus
 * versionné : les deux chemins doivent poser le MÊME bloc, sans quoi une même
 * recette n'aurait pas la même carte selon l'écran qui la demande. Cette raison
 * tient toujours — c'est pourquoi la fonction reste UNE, et que les deux
 * chemins l'importent d'ici.
 *
 * Mais `canonicalCatalog.js` importe `data/recipes/corpus-v3.json` (6,7 Mio) et
 * `scripts/data/out/recipe-food-catalog.json` (616 Kio) au build. Un `import`
 * ES ne prend pas une fonction : il prend le module, et tout ce que le module
 * importe. `app/_pricing/estimations.js` ne voulait que `coutDeCarte` — qui ne
 * lit NI l'un NI l'autre, elle n'a besoin que de la recette qu'on lui passe —
 * et emportait les deux fichiers dans le bundle serveur des quatre routes qui
 * la lisent. Mesuré avant le déplacement, sur `npm run build` en production :
 * `.next/server/chunks/7127.js` pesait 5 629 329 octets, chargé par
 * `app/api/pantry/route.js`, `app/api/recipes/catalog/route.js`,
 * `app/api/planning/imports/[importId]/route.js` et
 * `app/recipes/canonical/[code]/page.js` — les quatre importateurs
 * d'`estimations.js`, et les seuls.
 *
 * Déplacer la fonction ici coupe cette arête, et elle seule. Rien d'autre ne
 * change : `canonicalCatalog.js` la réexporte pour ses propres cartes, les
 * tests continuent de lire le corpus du dépôt comme avant, et la production
 * continue de lire la base. `tests/recipes/corpusHorsBundle.test.js` mesure le
 * graphe d'imports depuis les entrées Next et interdit le retour de l'arête.
 *
 * §8.4 rappelé ici parce que c'est ici que la tentation naîtra : ces cartes ne
 * doivent JAMAIS être triées par `central`. Une recette paraît moins chère
 * quand elle est moins couverte ; trier des couvertures inégales, c'est trier
 * par ignorance. `classerParCout` existe pour le faire correctement, en
 * séparant explicitement le sous-ensemble intégralement chiffré.
 */

import { computeRecipeCost } from '@/lib/domain/pricing/recipeCost'

export function coutDeCarte(recipe, index) {
  const cout = computeRecipeCost(recipe, index)
  return {
    fourchette: cout.coutConsomme.parPortion,
    fourchetteTotale: cout.coutConsomme.total,
    couverture: cout.coverage,
    referenceDate: cout.referenceDate,
    affichable: cout.displayable,
    refus: cout.displayRefusal,
    parageInconnu: cout.parageInconnu,
    parPortion: true,
    adaptations: cout.lines.filter((ligne) => ligne.priced && ligne.confidence === 'B').length,
    attributions: cout.attributions,
  }
}
