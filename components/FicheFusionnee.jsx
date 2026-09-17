'use client'

import { Users, Split, Utensils, AlertTriangle } from 'lucide-react'
import './FicheFusionnee.css'

/**
 * LA FICHE DE CUISINE FUSIONNÉE, À L'ÉCRAN — livrable 2.3.
 *
 * Un seul composant pour les deux écrans que le plan nomme
 * (`app/planning/components/CookSession.jsx` et
 * `components/CookingSessionSheet.jsx`) : deux rendus séparés finiraient par
 * diverger, et c'est le genre d'écart qui fait qu'une même fiche ne dit pas la
 * même chose selon l'écran par lequel on l'ouvre.
 *
 * IL NE CALCULE RIEN. Les blocs, le point de divergence, les quantités
 * communes, les exclusions : tout vient de `lib/domain/recipes/ficheFusionnee.js`,
 * qui les lit dans l'arbitrage relu. Ce fichier met en page, il ne décide pas —
 * et il n'affiche AUCUN chiffre qu'il aurait lui-même dérivé.
 *
 * QUAND IL N'AFFICHE RIEN. Un couple non déclaré ne produit pas de message :
 * l'utilisateur n'a aucune raison de savoir qu'une fusion a été cherchée. Un
 * couple relu ET refusé, lui, affiche son motif — parce que sans lui le foyer
 * conclurait que l'application ne sait pas fusionner, alors que c'est la
 * recette qui ne s'y prête pas, pour une raison écrite.
 */

const ROLES = {
  commune: { titre: 'Ensemble', detail: 'Un seul récipient, pour les deux assiettes.' },
  parallele: { titre: 'Pour chacun des deux plats', detail: 'Le même geste, fait sur chaque plat.' },
}

function ListeIngredients({ titre, ingredients, sousTitre }) {
  if (!ingredients?.length) return null
  return (
    <div className="ff-ing-bloc">
      <p className="ff-ing-titre">{titre}</p>
      {sousTitre && <p className="ff-ing-sous">{sousTitre}</p>}
      <ul className="ff-ing-liste">
        {ingredients.map((ingredient) => (
          <li key={`${ingredient.name}-${ingredient.unit}`} className="ff-ing-ligne">
            <span className="ff-ing-nom">
              {ingredient.name}
              {ingredient.optional && <span className="ff-ing-opt"> · facultatif</span>}
            </span>
            <span className="ff-ing-qte">
              {Math.round(Number(ingredient.quantity) * 10) / 10} {ingredient.unit}
              {ingredient.part_carnee != null && ingredient.part_vegetarienne != null && (
                <span className="ff-ing-part">
                  {' '}({Math.round(ingredient.part_carnee * 10) / 10} + {Math.round(ingredient.part_vegetarienne * 10) / 10})
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FicheFusionnee({ fiche, compacte = false }) {
  if (!fiche) return null

  if (!fiche.fusionnee) {
    if (fiche.raison?.code !== 'declare_non_fusionnable') return null
    return (
      <section className="ff-refus" aria-label="Pourquoi ces deux plats se cuisinent séparément">
        <p className="ff-refus-titre">
          <AlertTriangle size={14} aria-hidden="true" />
          Deux préparations, et voici pourquoi
        </p>
        <p className="ff-refus-motif">{fiche.raison.message}</p>
      </section>
    )
  }

  const nomsCarne = fiche.carne.mangeurs?.length ? fiche.carne.mangeurs.join(' et ') : 'version carnée'
  const nomsVege = fiche.vege.mangeurs?.length ? fiche.vege.mangeurs.join(' et ') : 'version végétarienne'

  return (
    <section className="ff-fiche" aria-label="Fiche de cuisine fusionnée">
      <header className="ff-entete">
        <p className="ff-eyebrow">
          <Users size={13} aria-hidden="true" />
          Deux assiettes, une seule préparation
        </p>
        <p className="ff-plats">
          <span className="ff-plat ff-plat-carne">{fiche.carne.family}</span>
          <span className="ff-plat-qui">{nomsCarne}</span>
          <span className="ff-plat-sep" aria-hidden="true">·</span>
          <span className="ff-plat ff-plat-vege">{fiche.vege.family}</span>
          <span className="ff-plat-qui">{nomsVege}</span>
        </p>
        <p className="ff-lignee">
          Même lignée {fiche.lignee} · {fiche.compte.blocsCommuns} étape
          {fiche.compte.blocsCommuns > 1 ? 's' : ''} faite
          {fiche.compte.blocsCommuns > 1 ? 's' : ''} une seule fois
          {fiche.compte.blocsParalleles > 0 && `, ${fiche.compte.blocsParalleles} à répéter sur chaque plat`}
        </p>
      </header>

      {fiche.exclusions?.length > 0 && (
        <p className="ff-exclusion" role="note">
          <AlertTriangle size={13} aria-hidden="true" />
          <span>
            Hors de la préparation commune :{' '}
            {fiche.exclusions.map((exclusion) => exclusion.forme).join(', ')} — à réserver à l’assiette carnée.
          </span>
        </p>
      )}

      <ol className="ff-blocs">
        {fiche.blocs.map((bloc, index) => {
          if (bloc.role === 'divergente') {
            const separation = fiche.pointDeDivergence === index
            return (
              <li key={`bloc-${index}`} className="ff-bloc ff-bloc-divergent">
                {separation && (
                  <p className="ff-separation">
                    <Split size={13} aria-hidden="true" />
                    Point de divergence — on répartit ce qui précède entre les deux plats
                  </p>
                )}
                <div className="ff-branches">
                  {bloc.carne.length > 0 && (
                    <div className="ff-branche ff-branche-carne">
                      <p className="ff-branche-titre">{nomsCarne} · {fiche.carne.family}</p>
                      {bloc.carne.map((etape) => (
                        <p key={`c-${etape.n}`} className="ff-etape">{etape.instruction}</p>
                      ))}
                    </div>
                  )}
                  {bloc.vege.length > 0 && (
                    <div className="ff-branche ff-branche-vege">
                      <p className="ff-branche-titre">{nomsVege} · {fiche.vege.family}</p>
                      {bloc.vege.map((etape) => (
                        <p key={`v-${etape.n}`} className="ff-etape">{etape.instruction}</p>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            )
          }
          const role = ROLES[bloc.role] || ROLES.commune
          return (
            <li key={`bloc-${index}`} className={`ff-bloc ff-bloc-${bloc.role}`}>
              <p className="ff-bloc-titre">
                <Utensils size={13} aria-hidden="true" />
                {role.titre}
                <span className="ff-bloc-detail">{role.detail}</span>
              </p>
              {bloc.etapes.map((etape) => (
                <p key={`e-${etape.n}`} className="ff-etape">{etape.instruction}</p>
              ))}
            </li>
          )
        })}
      </ol>

      {!compacte && (
        <div className="ff-ingredients">
          <ListeIngredients
            titre="Communs aux deux recettes"
            sousTitre="Quantité totale à sortir, somme des deux assiettes (part carnée + part végétarienne). Les étapes disent ce qui va dans le récipient commun et ce qui rejoint chaque branche."
            ingredients={fiche.ingredients.communs}
          />
          <ListeIngredients titre={`Pour ${nomsCarne}`} ingredients={fiche.ingredients.brancheCarnee} />
          <ListeIngredients titre={`Pour ${nomsVege}`} ingredients={fiche.ingredients.brancheVegetarienne} />
          {fiche.ingredients.ecartsUnite?.length > 0 && (
            <p className="ff-ecart" role="note">
              Non additionné, faute d’unité commune :{' '}
              {fiche.ingredients.ecartsUnite.map((ecart) => `${ecart.forme} (${ecart.uniteCarne} / ${ecart.uniteVege})`).join(', ')}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
