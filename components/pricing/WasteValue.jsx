import { EstimationDetail, EstimationIndisponible, EstimationSources } from './Estimation'
import './WasteValue.css'

/**
 * La valeur de ce qui va être perdu.
 *
 * C'est le seul écran de Myko qui dit quelque chose qu'aucune application de
 * courses ne peut dire. Un comparateur de prix connaît le prix du beurre ; un
 * suivi de budget connaît la somme dépensée. Aucun des deux ne sait que CE
 * beurre-là, entamé le 12, dont la DLC a été raccourcie par l'ouverture, vaut
 * 1,80 € et sera jeté jeudi — parce qu'il faut pour cela un modèle de
 * péremption par lot, avec dates ajustées à l'ouverture et règle FEFO. Ce
 * composant est donc traité comme une affirmation, pas comme une ligne de plus
 * dans un tableau de bord.
 *
 * DEUX MONTANTS, ET LEUR ORDRE EST DÉLIBÉRÉ.
 *   « à risque » d'abord : la perte est encore ÉVITABLE, et c'est ce montant
 *   qui peut changer le dîner de ce soir. C'est le seul des deux qui sert à
 *   quelque chose.
 *   « déjà périmé » ensuite, et plus discret : le constat n'appelle aucune
 *   action, et l'afficher gros transformerait un outil en reproche.
 *
 * CE QUI REMPLACE QUOI. `lib/wastePreventionService.js` calculait une valeur à
 * `quantitySaved × 5`, « 5 €/kg en moyenne » — un nombre sans source, sans date
 * et sans fourchette, identique pour le sel et pour le safran. Ici chaque lot
 * porte un prix sourcé, daté, en fourchette, et un lot sans prix n'affiche
 * rien plutôt qu'une moyenne.
 */

const jourLabel = (jours) => {
  if (jours == null) return 'sans date'
  if (jours < 0) return `périmé depuis ${-jours} j`
  if (jours === 0) return "aujourd'hui"
  if (jours === 1) return 'demain'
  return `dans ${jours} j`
}

/**
 * Une rangée de lot. Le montant du lot s'affiche même quand le TOTAL est
 * refusé : le refus du §8 porte sur l'agrégat, jamais sur la ligne, parce
 * qu'une valeur de lot est un nombre sourcé isolément alors qu'un total
 * silencieux sur la moitié de la masse trompe sur son propre périmètre.
 */
function LigneLot({ lot }) {
  return (
    <li className={`myko-waste-lot${lot.chiffre ? '' : ' myko-waste-lot-nu'}`}>
      <span className="myko-waste-lot-nom">
        {lot.nom || 'Lot sans nom'}
        {lot.dateRaccourcieParOuverture && (
          <em title="La date a été raccourcie à l’ouverture du contenant">entamé</em>
        )}
      </span>
      <span className="myko-waste-lot-quand">{jourLabel(lot.joursRestants)}</span>
      <span className="myko-waste-lot-valeur">
        {lot.chiffre ? lot.montant : <i>prix non sourcé</i>}
      </span>
    </li>
  )
}

/**
 * @param {Object} props.valeur — bloc rendu par la route API :
 *   { aRisque: { vue, lots, count }, perime: { vue, lots, count }, seuils, referentiel }
 * @param {number} props.limiteLots — nombre de lots nommés sous le montant
 */
export default function WasteValue({ valeur, limiteLots = 5, compact = false }) {
  if (!valeur) return null
  const aRisque = valeur.aRisque
  const perime = valeur.perime
  const rien = (aRisque?.count || 0) === 0 && (perime?.count || 0) === 0

  if (rien) {
    return (
      <div className="myko-waste myko-waste-calme">
        <p className="myko-est-titre">Valeur en jeu</p>
        <p className="myko-waste-calme-texte">
          Rien n’arrive à sa date dans les prochains jours.
        </p>
      </div>
    )
  }

  return (
    <div className={`myko-waste${compact ? ' myko-waste-compact' : ''}`}>
      <p className="myko-est-titre">Ce qui va être perdu</p>

      {aRisque?.count > 0 ? (
        <>
          {aRisque.vue?.affichable ? (
            <p className="myko-waste-tete">
              <span className="myko-est-prefixe">{aRisque.vue.prefixe}</span>
              <b className="myko-waste-somme">{aRisque.vue.montant}</b>
              <span className="myko-est-fourchette">{aRisque.vue.fourchette}</span>
            </p>
          ) : (
            <EstimationIndisponible vue={aRisque.vue} nonChiffres={false} />
          )}
          <p className="myko-waste-phrase">
            {aRisque.count} lot{aRisque.count > 1 ? 's' : ''} {aRisque.count > 1 ? 'arrivent' : 'arrive'} à sa date —
            {' '}<b>c’est encore évitable</b>.
          </p>
          <EstimationDetail vue={aRisque.vue} />
          {aRisque.lots?.length > 0 && (
            <ul className="myko-waste-lots">
              {aRisque.lots.slice(0, limiteLots).map((lot, index) => (
                <LigneLot key={lot.id ?? `${lot.nom}-${index}`} lot={lot} />
              ))}
            </ul>
          )}
          {aRisque.lots?.length > limiteLots && (
            <p className="myko-waste-reste">
              et {aRisque.lots.length - limiteLots} autre{aRisque.lots.length - limiteLots > 1 ? 's' : ''} lot{aRisque.lots.length - limiteLots > 1 ? 's' : ''}
            </p>
          )}
        </>
      ) : (
        <p className="myko-waste-calme-texte">Rien n’arrive à sa date dans les prochains jours.</p>
      )}

      {perime?.count > 0 && (
        <div className="myko-waste-perime">
          <span className="myko-waste-perime-l">Déjà périmé</span>
          <span className="myko-waste-perime-v">
            {perime.vue?.affichable ? perime.vue.montant : '—'}
          </span>
          <span className="myko-waste-perime-c">
            {perime.count} lot{perime.count > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <EstimationSources vue={aRisque?.vue || perime?.vue} licence={valeur.referentiel?.licence} />
    </div>
  )
}
