/**
 * Les tranches du référentiel de prix, importées AU BUILD.
 *
 * Même mécanique que lib/domain/recipes/canonicalCatalog.js : un `import`
 * statique de JSON, résolu par le bundler, figé une fois pour toutes. Le
 * référentiel est une donnée versionnée du dépôt, pas un appel réseau ; le lire
 * à chaud coûterait un accès disque par requête pour un fichier qui ne change
 * qu'au commit.
 *
 * POURQUOI LA LISTE EST MANUELLE, ET DOIT LE RESTER.
 * Un `import.meta.glob` (Vite) ou un `require.context` (webpack) ramasserait le
 * dossier automatiquement, mais aucun des deux ne fonctionne dans les deux
 * bundlers du dépôt à la fois — et surtout, un ramassage automatique fait d'une
 * tranche disparue un trou SILENCIEUX dans la couverture : les recettes
 * deviendraient un peu moins chiffrées, personne ne verrait pourquoi. Avec une
 * liste explicite, une tranche supprimée ou renommée casse le build sur une
 * ligne nommée. Dans un dépôt qui refuse les nombres invérifiables, une panne
 * bruyante vaut mieux qu'une couverture qui s'érode.
 *
 * Conséquence directe : n'inscrire ici QUE des fichiers déjà versionnés. Une
 * tranche annoncée mais pas encore produite ne s'ajoute pas « en avance » —
 * l'import statique d'un fichier absent casse le build de toute l'application,
 * pas seulement de la couche prix.
 *
 * Le contrat (§9) prévoit à terme un fichier unique `reference-fr.json` produit
 * par fusion. Tant qu'il n'existe pas, les tranches sont recollées à la lecture
 * par `buildPriceIndex`, qui porte la règle de collision (deux tranches peuvent
 * coter la même forme).
 */

import assaisonnement from '@/data/prices/tranches/assaisonnement.json'
import epicerie from '@/data/prices/tranches/epicerie.json'
import fraisAnimal from '@/data/prices/tranches/frais-animal.json'
import fraisVegetal from '@/data/prices/tranches/frais-vegetal.json'

/**
 * Le filtre n'est pas décoratif : un JSON vide ou tronqué s'importe sans erreur
 * et rendrait `undefined`, qui exploserait plus loin sur `.entries`. Ici, une
 * tranche illisible est simplement une tranche absente — donc des formes non
 * couvertes, ce que le système sait déjà représenter.
 */
export const TRANCHES = Object.freeze(
  [assaisonnement, epicerie, fraisAnimal, fraisVegetal].filter(
    (tranche) => tranche && typeof tranche === 'object' && Array.isArray(tranche.entries),
  ),
)
