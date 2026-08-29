import { EstimationDetail, EstimationIndisponible, EstimationSources } from './Estimation'
import './EstimationCourses.css'

/**
 * L'estimation d'une liste de courses, telle qu'elle s'affiche.
 *
 * ELLE PORTE `coutAchat` ET RIEN D'AUTRE EN TÊTE (§6.2). Une liste de courses
 * est ce qu'on pose sur le tapis de caisse : des contenants entiers, pas des
 * grammes exacts. Le coût de ce qui sera réellement mangé est un autre montant,
 * plus bas, et les présenter l'un pour l'autre ferait disparaître le surplus qui
 * rejoint le garde-manger — c'est-à-dire l'explication de l'écart entre « la
 * semaine coûte 62 € » et la somme des coûts de ses recettes.
 *
 * TROIS RÉSERVES, DANS L'ORDRE OÙ ELLES COMPTENT :
 *   1. la couverture, quand des articles n'ont pas de prix sourcé ;
 *   2. les articles sans conditionnement saisi, comptés à la quantité
 *      nécessaire — une sous-estimation que l'utilisateur peut corriger
 *      lui-même sur cette page, en trois secondes, en renseignant la boîte ;
 *   3. l'enveloppe du foyer, quand elle est posée.
 * Aucune n'est un avertissement : ce sont trois précisions, écrites du même ton
 * que le montant.
 */
export default function EstimationCourses({ estimation, titre = 'Estimation de la semaine', compact = false }) {
  if (!estimation) return null
  const achat = estimation.achat
  const budget = estimation.budget

  if (!achat?.affichable) {
    return (
      <div className={`myko-cou-est${compact ? ' myko-cou-est-compact' : ''}`}>
        <p className="myko-est-titre">{titre}</p>
        <EstimationIndisponible vue={achat} />
      </div>
    )
  }

  return (
    <div className={`myko-cou-est${compact ? ' myko-cou-est-compact' : ''}`}>
      <p className="myko-est-titre">{titre}</p>

      <p className="myko-cou-tete">
        <span className="myko-est-prefixe">{achat.prefixe}</span>
        <b className="myko-cou-somme">{achat.montant}</b>
        <span className="myko-est-fourchette">{achat.fourchette}</span>
      </p>
      <p className="myko-cou-sous">en contenants entiers, tels qu’on les achète</p>

      <EstimationDetail vue={achat} detaille={!compact} />

      {/* Le surplus n'est rendu par la couche de calcul que s'il est
          intégralement déterminé. Un surplus calculé sur la moitié des lignes
          annoncerait la moitié du vrai chiffre, sans aucun moyen de s'en
          apercevoir — c'est exactement le genre de nombre plausible et faux que
          le référentiel s'interdit. */}
      {estimation.surplus?.affichable && (
        <p className="myko-cou-surplus">
          dont <b>{estimation.surplus.montant}</b> de surplus, qui rejoindra le garde-manger
          plutôt que l’assiette de cette semaine.
        </p>
      )}

      {estimation.sansContenant > 0 && (
        <p className="myko-cou-contenants">
          {estimation.sansContenant} article{estimation.sansContenant > 1 ? 's' : ''} sans
          conditionnement renseigné {estimation.sansContenant > 1 ? 'sont comptés' : 'est compté'} à
          la quantité nécessaire : le total est d’autant plus bas que la vraie boîte est grande.
        </p>
      )}

      {budget && (
        <p className={`myko-cou-budget myko-cou-budget-${budget.etat}`}>{budget.texte}</p>
      )}

      <EstimationSources vue={achat} />
    </div>
  )
}
