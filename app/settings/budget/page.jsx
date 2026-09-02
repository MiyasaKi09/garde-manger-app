'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { authFetch, invalidateAuthCache } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import './budget.css'

/**
 * L'enveloppe alimentaire du foyer.
 *
 * POURQUOI DEUX BORNES ET NON UN PLAFOND. Une estimation de panier est un
 * intervalle (contrat §3.2), jamais un point. Comparer un intervalle à un seul
 * nombre force un arbitrage qu'on ne peut pas faire une fois pour toutes :
 * comparer la borne haute au plafond alerte dès qu'un dépassement est seulement
 * possible — donc presque toujours, donc plus personne ne regarde. Deux bornes
 * rendent la comparaison décidable, et le dépassement n'est affirmé que quand
 * même la borne la plus favorable dépasse.
 *
 * Le plancher n'est pas décoratif : un panier nettement sous l'enveloppe n'est
 * pas une bonne nouvelle en soi, c'est plus souvent le signe d'une semaine
 * sous-approvisionnée. Il reste facultatif — « je n'ai qu'un plafond » est une
 * situation légitime, et on ne fabrique pas une borne basse par symétrie.
 *
 * L'écriture passe par /api/settings/budget : CLAUDE.md interdit de muter
 * depuis un composant client, et ce que quelqu'un s'autorise à dépenser mérite
 * la règle plus que d'autres données.
 */

const PERIODES = [
  { cle: 'week', label: 'par semaine' },
  { cle: 'month', label: 'par mois' },
]

const MESSAGES = {
  enveloppe_vide: 'Indiquez au moins un montant.',
  borne_basse_invalide: 'Le plancher n’est pas un montant.',
  borne_haute_invalide: 'Le plafond n’est pas un montant.',
  borne_basse_non_positive: 'Le plancher doit être supérieur à zéro.',
  borne_haute_non_positive: 'Le plafond doit être supérieur à zéro.',
  bornes_inversees: 'Le plancher ne peut pas dépasser le plafond.',
  periode_invalide: 'Choisissez une périodicité.',
  devise_invalide: 'Devise inconnue.',
}

function formaterDate(iso) {
  if (!iso) return null
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const [annee, m, jour] = String(iso).split('-').map(Number)
  return `${jour} ${mois[m - 1]} ${annee}`
}

export default function BudgetSettings() {
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [enveloppe, setEnveloppe] = useState(null)
  const [bas, setBas] = useState('')
  const [haut, setHaut] = useState('')
  const [periode, setPeriode] = useState('month')

  const charger = useCallback(async () => {
    try {
      const res = await authFetch('/api/settings/budget')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Lecture impossible')
      setEnveloppe(json.enveloppe)
      setBas(json.enveloppe?.bas != null ? String(json.enveloppe.bas) : '')
      setHaut(json.enveloppe?.haut != null ? String(json.enveloppe.haut) : '')
      if (json.enveloppe?.periode) setPeriode(json.enveloppe.periode)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  async function enregistrer(event) {
    event.preventDefault()
    setEnregistrement(true)
    try {
      const res = await authFetch('/api/settings/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // La virgule décimale est ce que tape un clavier français ; la refuser
        // ferait échouer la saisie la plus naturelle sur une erreur de format.
        body: JSON.stringify({
          low: bas.trim() ? bas.replace(',', '.') : null,
          high: haut.trim() ? haut.replace(',', '.') : null,
          period: periode,
          currency: 'EUR',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(MESSAGES[json.error] || json.error || 'Enregistrement impossible')
      setEnveloppe(json.enveloppe)
      invalidateAuthCache()
      toast.success('Enveloppe enregistrée')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setEnregistrement(false)
    }
  }

  async function effacer() {
    setEnregistrement(true)
    try {
      const res = await authFetch('/api/settings/budget', { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Effacement impossible')
      setEnveloppe(null)
      setBas('')
      setHaut('')
      invalidateAuthCache()
      toast.success('Enveloppe effacée')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Paramètres</span>
          <h1 className="v21-title">Enveloppe</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Ce que le foyer se donne pour manger — une gamme, pas un plafond.</p>
        </div>
        {enveloppe && (
          <div className="v21-hero-side">
            <div className="v21-hero-badge">
              <span className="v">{enveloppe.haut != null ? `${enveloppe.haut} €` : `${enveloppe.bas} €`}</span>
              <span className="l">{enveloppe.periode === 'week' ? 'par semaine' : 'par mois'}</span>
            </div>
          </div>
        )}
      </header>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Votre enveloppe</span></div>

        <p className="bud-intro">
          Myko ne compare jamais un chiffre unique à votre budget : une estimation de courses est
          une <b>fourchette</b>. Une enveloppe en deux bornes permet de dire « dans » ou « au-dessus »
          sans alerter dès qu’un dépassement est seulement possible — et un dépassement n’est annoncé
          que lorsque même l’hypothèse la plus favorable le dépasse.
        </p>

        <form onSubmit={enregistrer} className="bud-form">
          <div className="bud-bornes">
            <label className="bud-field">
              <span className="bud-field-l">Plancher <em>facultatif</em></span>
              <span className="bud-input-wrap">
                <input
                  className="bud-input"
                  inputMode="decimal"
                  value={bas}
                  onChange={(event) => setBas(event.target.value)}
                  placeholder="—"
                  aria-label="Borne basse de l’enveloppe, en euros"
                />
                <span className="bud-unit">€</span>
              </span>
            </label>
            <span className="bud-tiret" aria-hidden="true">–</span>
            <label className="bud-field">
              <span className="bud-field-l">Plafond</span>
              <span className="bud-input-wrap">
                <input
                  className="bud-input"
                  inputMode="decimal"
                  value={haut}
                  onChange={(event) => setHaut(event.target.value)}
                  placeholder="—"
                  aria-label="Borne haute de l’enveloppe, en euros"
                />
                <span className="bud-unit">€</span>
              </span>
            </label>
          </div>

          <fieldset className="bud-periode">
            <legend className="bud-field-l">Périodicité</legend>
            {PERIODES.map((option) => (
              <label key={option.cle} className={`bud-radio${periode === option.cle ? ' on' : ''}`}>
                <input
                  type="radio"
                  name="periode"
                  value={option.cle}
                  checked={periode === option.cle}
                  onChange={() => setPeriode(option.cle)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <p className="bud-note">
            Une enveloppe mensuelle est ramenée à la semaine au prorata (un mois vaut 4,33 semaines,
            pas 4) pour se comparer à une liste de courses hebdomadaire.
          </p>

          <div className="bud-actions">
            <button type="submit" className="v21-btn" disabled={enregistrement || chargement}>
              {enregistrement ? '…' : enveloppe ? 'Mettre à jour l’enveloppe' : 'Poser l’enveloppe'}
            </button>
            {enveloppe && (
              <button type="button" className="v21-btn ghost" onClick={effacer} disabled={enregistrement}>
                Effacer
              </button>
            )}
          </div>
        </form>

        {enveloppe?.fixeeLe && (
          <p className="bud-datee">
            Fixée le {formaterDate(enveloppe.fixeeLe)}. Elle n’est jamais réindexée : décider à votre
            place ce que vous pouvez dépenser ne serait pas un calcul.
          </p>
        )}
      </section>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Où elle s’affiche</span></div>
        <p className="bud-ou">
          À côté de l’estimation de la semaine, sur le <Link href="/planning">planning</Link> et sur
          la <Link href="/courses">liste de courses</Link>. Tant que l’estimation ne porte pas sur
          tous les articles, elle reste un minorant : Myko peut alors affirmer un dépassement, jamais
          l’inverse.
        </p>
      </section>
    </div>
  )
}
