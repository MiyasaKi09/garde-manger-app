import './Estimation.css'

/**
 * Les trois façons d'écrire une estimation à l'écran.
 *
 * Aucun `"use client"` : ces composants n'ont ni état ni gestionnaire
 * d'événement. Ils se rendent donc côté serveur sur la fiche recette, et
 * s'intègrent sans friction aux pages client (garde-manger, courses, planning)
 * qui reçoivent leur vue déjà calculée par une route d'API — le référentiel de
 * prix pèse 670 ko et n'a aucune raison de traverser le réseau jusqu'au
 * navigateur pour produire une ligne de texte.
 *
 * CE QU'ILS N'ONT PAS LE DROIT DE FAIRE, ET QUI EST GARANTI PAR CONSTRUCTION :
 * ils ne reçoivent JAMAIS un nombre, seulement une vue déjà formatée par
 * `estimationView`. Ils ne peuvent donc ni arrondir autrement que le §7.2, ni
 * écrire un montant sans sa date, ni oublier le « au moins » d'une couverture
 * partielle — il n'y a rien à oublier, tout est déjà dans la vue.
 *
 * L'ÉTAT PARTIEL EST LE CAS NORMAL. Le référentiel couvre 160 formes sur 534 et
 * le restera longtemps : une estimation partielle n'est pas une anomalie qu'on
 * signale en jaune, c'est le régime de croisière. Elle est donc composée comme
 * l'estimation complète — même graisse, même place — et ne diffère que par ses
 * mots : « Au moins » au lieu de « Estimation ≈ », et la liste de ce qui manque
 * en dessous, écrite calmement.
 */

/**
 * Le montant seul, en gros. Ne s'emploie jamais sans `EstimationDetail` à
 * côté : le §7.1 exige la date, et le §8.5 le compte des lignes chiffrées.
 */
export function EstimationMontant({ vue, taille = 'moyen' }) {
  if (!vue?.affichable) return null
  return (
    <span className={`myko-est-montant myko-est-${taille}`}>
      <span className="myko-est-prefixe">{vue.prefixe}</span>
      <b className="myko-est-valeur">{vue.montant}</b>
      <span className="myko-est-fourchette">{vue.fourchette}</span>
    </span>
  )
}

/**
 * Ce que le contrat impose à côté de tout montant : la couverture, la date du
 * référentiel, et la liste nommée de ce qui n'est pas chiffré.
 *
 * `detaille` déplie les non chiffrés ; replié, il n'en reste que le compte.
 * Aucun des deux n'est un repli au sens du §7.1 : la couverture et la date
 * restent visibles dans les deux cas — seule la liste des noms se replie, et
 * elle n'est pas ce que le contrat exige de montrer, seulement ce qu'il exige
 * de rendre accessible.
 */
export function EstimationDetail({ vue, detaille = true }) {
  if (!vue?.affichable) return null
  return (
    <span className="myko-est-detail">
      <span className="myko-est-couverture">{vue.couvertureTexte}</span>
      {vue.parageTexte && <span className="myko-est-nuance">{vue.parageTexte}</span>}
      {vue.adaptationsTexte && <span className="myko-est-nuance">{vue.adaptationsTexte}</span>}
      {vue.referentielTexte && <span className="myko-est-date">{vue.referentielTexte}</span>}
      {detaille && vue.nonChiffresTexte && (
        <span className="myko-est-manquants">{vue.nonChiffresTexte}</span>
      )}
      {!detaille && vue.nonChiffres.length > 0 && (
        <span className="myko-est-manquants">
          {vue.nonChiffres.length} sans prix sourcé
        </span>
      )}
    </span>
  )
}

/**
 * Le refus du §8, écrit comme une information et non comme une panne.
 *
 * Il nomme ce qui manque plutôt que de constater l'absence : « Estimation
 * indisponible » tout court se lit comme un bug, alors que c'est une décision
 * — on refuse d'assembler un total sur une poignée d'ingrédients, parce qu'un
 * total sur la moitié du plat serait plus trompeur que pas de total du tout.
 */
export function EstimationIndisponible({ vue, nonChiffres = true }) {
  if (!vue || vue.affichable) return null
  return (
    <div className="myko-est-refus">
      <p className="myko-est-refus-texte">{vue.indisponibleTexte}</p>
      {nonChiffres && vue.nonChiffres.length > 0 && (
        <p className="myko-est-refus-liste">{vue.nonChiffres.join(' · ')}</p>
      )}
      {vue.referentielTexte && <p className="myko-est-date">{vue.referentielTexte}</p>}
    </div>
  )
}

/**
 * Le bloc complet : titre, montant, détail — ou le refus, à la même place et
 * dans le même cadre.
 *
 * Le refus occupe DÉLIBÉRÉMENT la même boîte que le montant. Faire disparaître
 * le bloc quand il n'y a pas de chiffre donnerait deux mises en page selon la
 * couverture, et surtout laisserait croire que la fonctionnalité n'existe pas
 * sur les 65 % de recettes où le référentiel est encore trop partiel.
 */
export function EstimationBloc({ vue, titre = 'Coût estimé', suffixe = null, enfants = null, taille = 'moyen' }) {
  if (!vue) return null
  return (
    <div className={`myko-est-bloc${vue.affichable ? '' : ' myko-est-bloc-vide'}`}>
      <p className="myko-est-titre">{titre}</p>
      {vue.affichable ? (
        <>
          <p className="myko-est-ligne">
            <EstimationMontant vue={vue} taille={taille} />
            {suffixe && <span className="myko-est-suffixe">{suffixe}</span>}
          </p>
          <EstimationDetail vue={vue} />
          {enfants}
        </>
      ) : (
        <EstimationIndisponible vue={vue} />
      )}
    </div>
  )
}

/**
 * Estimation d'une seule ligne, pour une carte ou une rangée de liste.
 *
 * Le §8.5 s'applique ici aussi : même serré, le montant ne va jamais sans le
 * compte des lignes chiffrées. C'est ce qui empêche une carte de recette
 * partiellement chiffrée de se lire comme une carte complète — et donc
 * d'ouvrir, par comparaison visuelle, le classement par ignorance que le §8.4
 * interdit.
 */
export function EstimationLigne({ vue, suffixe = null }) {
  if (!vue) return null
  if (!vue.affichable) {
    return <span className="myko-est-inline myko-est-inline-vide">Estimation indisponible</span>
  }
  return (
    <span className={`myko-est-inline${vue.minorant ? ' myko-est-inline-minorant' : ''}`}>
      {/* Le « ≥ » compact remplace « Au moins » sur une carte — sauf sur un
          montant déjà écrit « moins de 0,10 € », où il donnerait « ≥ moins de ». */}
      <b>{vue.minorant && !vue.negligeable ? `≥ ${vue.montant}` : vue.montant}</b>
      {suffixe && <span className="myko-est-inline-suffixe">{suffixe}</span>}
      <span className="myko-est-inline-cov">{vue.priced}/{vue.quantified}</span>
      {/* §7.1 : la date reste visible À CÔTÉ du montant, même sur une carte —
          pas dans une infobulle. Un montant sans date est une affirmation
          intemporelle, et un prix n'en est jamais une. Elle est donc écrite,
          petite, plutôt que sacrifiée à la densité. */}
      {vue.mois && <span className="myko-est-inline-date">{vue.mois}</span>}
    </span>
  )
}

/**
 * Le pied de page d'attribution.
 *
 * Ce n'est pas de la politesse : une des deux sources du référentiel est sous
 * ODbL, licence à partage à l'identique qui impose de créditer. `priceIndex`
 * fait déjà remonter la liste des sources à attribuer — encore faut-il qu'un
 * écran l'écrive. Non affiché quand la liste est vide, ce qui arrive lorsque
 * plus aucune ligne chiffrée ne vient d'une source exigeant l'attribution.
 */
export function EstimationSources({ vue, licence = null }) {
  if (!vue?.attributionTexte) return null
  return (
    <p className="myko-est-sources">
      {/* « Estimations d'après », pas « Prix : » — le §7.1 proscrit le mot pour
          désigner ce que Myko affiche, y compris en pied de page. */}
      Estimations d’après {vue.attributionTexte}
      {licence ? ` · ${licence}` : ''}
    </p>
  )
}
