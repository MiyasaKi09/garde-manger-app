'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, UserMinus } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import './PresenceGrid.css'

/**
 * QUI MANGE À LA MAISON CETTE SEMAINE — livrable 1.5.
 *
 * L'écran où le foyer DÉCLARE ses absences, déjeuner par déjeuner et dîner par
 * dîner. Trois partis pris, et ils valent d'être écrits :
 *
 * 1. IL NE DÉCLARE QUE LES DEUX PRISES PRINCIPALES. La table
 *    `public.meal_presence` et le moteur en connaissent quatre ; l'API accepte
 *    les quatre. Ajouter le petit-déjeuner et la collation ici est une colonne
 *    de plus, pas un mécanisme de plus — on ne les met pas tant que le foyer ne
 *    les a pas demandées, et on ne prétend pas qu'elles n'existent pas.
 *
 * 2. IL NE RÉGÉNÈRE RIEN. Déclarer une absence n'écrit dans aucune table de
 *    planning (§9.3 du plan : « zéro écriture hors publication atomique »). La
 *    semaine déjà publiée garde ses assiettes jusqu'à sa prochaine génération,
 *    et le bandeau le DIT au lieu de laisser croire le contraire.
 *
 * 3. IL N'INVENTE AUCUNE RÉCURRENCE. Pas de « tous les mardis » : une
 *    prévision rangée à côté de faits ne se distingue plus d'un fait.
 *
 * `published` porte, quand la semaine affichée est publiée, ce que la
 * transaction de publication a RÉELLEMENT servi
 * (`validation_summary.presence`). L'écran montre alors les deux nombres côte à
 * côte — ce qui est déclaré, ce qui est servi — parce qu'ils peuvent différer
 * tant que la semaine n'a pas été régénérée, et qu'un seul des deux affiché
 * laisserait croire que l'autre n'existe pas.
 */

const PRISES = [
  { type: 'dejeuner', label: 'Midi' },
  { type: 'diner', label: 'Soir' },
]

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function joursDeLaSemaine(windowStart) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${windowStart}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    return { iso: date.toISOString().slice(0, 10), label: JOURS_COURTS[index], numero: date.getUTCDate() }
  })
}

const cle = (membreId, date, type) => `${membreId}|${date}|${type}`

export default function PresenceGrid({ windowStart, onDeclared, published = [] }) {
  const [statut, setStatut] = useState('loading')
  const [membres, setMembres] = useState([])
  const [absences, setAbsences] = useState(new Set())
  const [enregistrement, setEnregistrement] = useState(null)
  const [aDeclare, setADeclare] = useState(false)

  const charger = useCallback(async () => {
    setStatut('loading')
    try {
      const response = await authFetch(`/api/planning/presence?window_start=${windowStart}`)
      const data = await response.json().catch(() => ({}))
      if (response.status === 503) { setStatut('unavailable'); return }
      if (!response.ok) throw new Error(data.error || 'Présence indisponible')
      setMembres(data.members || [])
      setAbsences(new Set((data.declarations || [])
        .filter((declaration) => declaration.present === false)
        .map((declaration) => cle(declaration.household_member_id, declaration.meal_date, declaration.meal_type))))
      setStatut('ready')
    } catch (error) {
      setStatut('error')
      toast.error(error.message)
    }
  }, [windowStart])

  useEffect(() => { charger() }, [charger])

  async function basculer(membre, date, type) {
    const identifiant = cle(membre.id, date, type)
    if (enregistrement) return
    const etaitAbsent = absences.has(identifiant)
    setEnregistrement(identifiant)
    try {
      const response = await authFetch('/api/planning/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          declarations: [{
            household_member_id: membre.id,
            meal_date: date,
            meal_type: type,
            // Revenir sur une absence EFFACE la déclaration : on repasse à
            // « rien n'est déclaré », qui est l'état d'origine de la grille.
            present: etaitAbsent ? null : false,
          }],
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Déclaration impossible')
      setAbsences((courant) => {
        const suivant = new Set(courant)
        if (etaitAbsent) suivant.delete(identifiant)
        else suivant.add(identifiant)
        return suivant
      })
      setADeclare(true)
      onDeclared?.()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setEnregistrement(null)
    }
  }

  if (statut === 'unavailable') {
    return (
      <section className="pg-card" aria-label="Présence du foyer">
        <header className="pg-head">
          <span className="pg-label">Présence</span>
          <h2>Qui mange à la maison</h2>
        </header>
        <p className="pg-note">
          <AlertTriangle size={14} /> La déclaration des absences attend sa migration de base.
          Rien n&apos;est perdu : la semaine reste calculée pour tout le foyer.
        </p>
      </section>
    )
  }

  const jours = joursDeLaSemaine(windowStart)
  /** Ce que la semaine PUBLIÉE sert à cette personne, ou `null` si rien n'est publié. */
  const servisPour = (membre) => {
    const ligne = (published || []).find((item) => (item.household_member_id
      ? item.household_member_id === membre.id
      : item.person_name === membre.name))
    return Number.isFinite(Number(ligne?.main_meals)) ? Number(ligne.main_meals) : null
  }
  const absencesDe = (membre) => jours
    .reduce((total, jour) => total + PRISES.filter((prise) => absences.has(cle(membre.id, jour.iso, prise.type))).length, 0)
  /** Les créneaux que cette grille propose, comptés sur elle et non écrits en dur. */
  const creneauxDeLaGrille = jours.length * PRISES.length

  return (
    <section className="pg-card" aria-label="Présence du foyer">
      <header className="pg-head">
        <span className="pg-label">Présence</span>
        <h2>Qui mange à la maison</h2>
        <p>Déjeuners et dîners. Un repas retiré ici sort des assiettes, des quantités de courses et du total nutritionnel.</p>
      </header>

      {statut === 'loading' ? (
        <p className="pg-note" aria-busy="true"><RefreshCw size={14} className="pg-spin" /> Lecture des déclarations…</p>
      ) : statut === 'error' ? (
        <p className="pg-note">
          <AlertTriangle size={14} /> Les déclarations n&apos;ont pas pu être lues.
          <button type="button" className="pg-retry" onClick={charger}>Réessayer</button>
        </p>
      ) : !membres.length ? (
        <p className="pg-note">Aucun membre actif dans le foyer.</p>
      ) : (
        <>
          {membres.map((membre) => (
            <div className="pg-member" key={membre.id}>
              <div className="pg-member-head">
                <b>{membre.name}</b>
                {/* Le dénominateur est COMPTÉ sur la grille affichée — jours ×
                    prises —, pas écrit à la main : c'est le même parcours que
                    `absencesDe`, si bien que les deux nombres ne peuvent pas
                    parler de semaines différentes (P18). À gauche ce que la
                    déclaration prévoit, à droite ce que la semaine publiée sert
                    vraiment — quand elle l'est. */}
                <span>
                  {creneauxDeLaGrille - absencesDe(membre)} repas sur {creneauxDeLaGrille}
                  {servisPour(membre) != null && ` · ${servisPour(membre)} servis`}
                </span>
              </div>
              <div className="pg-days">
                {jours.map((jour) => (
                  <div className="pg-day" key={jour.iso}>
                    <span className="pg-day-label">{jour.label} {jour.numero}</span>
                    {PRISES.map((prise) => {
                      const identifiant = cle(membre.id, jour.iso, prise.type)
                      const absent = absences.has(identifiant)
                      return (
                        <button
                          type="button"
                          key={prise.type}
                          className={`pg-slot${absent ? ' pg-absent' : ''}`}
                          onClick={() => basculer(membre, jour.iso, prise.type)}
                          disabled={enregistrement !== null}
                          aria-pressed={absent}
                          aria-label={`${membre.name}, ${prise.label.toLowerCase()} du ${jour.label} ${jour.numero} : ${absent ? 'hors domicile' : 'à la maison'}`}
                        >
                          {absent ? <UserMinus size={12} /> : null}
                          {prise.label}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {aDeclare && (
            <p className="pg-note pg-warn" role="status">
              <AlertTriangle size={14} />
              La semaine déjà publiée n&apos;a pas changé : ces déclarations sont prises en compte à la
              prochaine génération.
            </p>
          )}
        </>
      )}
    </section>
  )
}
