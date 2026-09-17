'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, RefreshCw, Wand2, Trash2, AlertTriangle } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import {
  CIBLE_FOYER,
  INTENT_LIBELLE,
  LIBELLES_CONFIRMATION,
  STARCH_POURCENT_BORNES,
  corpsDeGeneration,
  corrigerChamp,
  dateEnFrancais,
  declarationsAEcrire,
  enFrancais,
  etatApresTraduction,
  etatDeGeneration,
  intentionNeutre,
  partEnPourcent,
  PRISE_LIBELLE,
  retirerLigne,
  lignesDePresence,
  viserPresence,
} from '@/lib/domain/planning/confirmationContraintes'
import { MAX_MINUTES_BORNES, INTENTS_MOTEUR } from '@/lib/domain/planning/intentFromPhrase'
import { MAX_MEAT_MEALS_PER_WEEK } from '@/lib/domain/planning/memberPlanningRules'
import { budgetClient, budgetTraduction, intentionDeRepli, repliDeclare } from '@/lib/domain/planning/budgetTraduction'

const PROGRESS_MESSAGES = [
  { delay: 0, text: 'Analyse exacte du garde-manger...' },
  { delay: 1200, text: 'Réservation globale des lots ouverts et proches de la date...' },
  { delay: 2600, text: 'Équilibrage nutritionnel et sensoriel des 14 repas...' },
  { delay: 4200, text: 'Calcul des quantités réellement manquantes...' },
  { delay: 6500, text: 'Publication atomique du planning...' },
]

function getNextMonday() {
  const d = new Date()
  const day = d.getDay() // 0=dim, 1=lun…
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + daysUntilMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekLabel(monday) {
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const opts = { day: 'numeric', month: 'long' }
  return `${monday.toLocaleDateString('fr-FR', opts)} — ${sunday.toLocaleDateString('fr-FR', opts)}`
}

/**
 * L'ÉCRAN DE L'ASSISTANT — livrables 4.1 (la phrase), 4.2 (la confirmation) et
 * 4.3 (le budget de latence et le repli déclaré).
 *
 * L'ORDRE, ET C'EST LE LIVRABLE : la phrase entre, les contraintes déduites
 * s'affichent, le foyer les CORRIGE s'il le faut — sans retaper la phrase —, et
 * la génération ne part qu'après confirmation. Les CGU de Jowzi concèdent la
 * « mauvaise interprétation d'un Prompt » ; un agent qui décide sans montrer ne
 * peut rien offrir de mieux. Montrer, et laisser corriger, est la réponse.
 *
 * LE CHEMIN RAPIDE RESTE OUVERT (clause du livrable 4.3). Les cinq intentions
 * sont des boutons, présents AVANT toute phrase et sans qu'aucun appel à un
 * modèle soit nécessaire. Qui veut « équilibré » clique « équilibré ». La
 * phrase s'ajoute, elle ne remplace pas — et les cinq mêmes boutons du panneau
 * de modification de `app/planning/page.js` ne bougent pas non plus.
 *
 * OÙ SONT LES RÈGLES. Dans `lib/domain/planning/confirmationContraintes.js`,
 * pas ici : ce dépôt n'a ni `@testing-library` ni jsdom, donc une règle laissée
 * dans le JSX ne s'éprouverait que par une recherche de texte. Ce composant
 * n'est qu'un branchement — il appelle le domaine, affiche ce qu'il rend, et ne
 * décide de rien.
 */
export default function PlanningAssistantPage() {
  const router = useRouter()
  const [status, setStatus] = useState('pick') // pick | generating | success | review | error
  const [progressText, setProgressText] = useState(PROGRESS_MESSAGES[0].text)
  const [errorMsg, setErrorMsg] = useState('')
  const [phrase, setPhrase] = useState('')
  const [traductionEtat, setTraductionEtat] = useState('repos') // repos | encours | lu | refuse
  const [traductionRefus, setTraductionRefus] = useState([])
  const [repli, setRepli] = useState(null)
  const [intention, setIntention] = useState(intentionNeutre())
  const [deduits, setDeduits] = useState([])
  const [attenteConfirmation, setAttenteConfirmation] = useState(false)
  const [lignes, setLignes] = useState([])
  const [membres, setMembres] = useState([])
  const [presenceIndisponible, setPresenceIndisponible] = useState(false)
  const [saisies, setSaisies] = useState({ maxMinutes: '', starchCap: '', meatQuota: '' })
  const [refusSaisie, setRefusSaisie] = useState({})
  const abortRef = useRef(null)
  const timersRef = useRef([])

  const windowStart = getNextMonday().toISOString().slice(0, 10)
  const weekLabel = formatWeekLabel(new Date(`${windowStart}T12:00:00`))
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const jour = new Date(`${windowStart}T00:00:00Z`)
      jour.setUTCDate(jour.getUTCDate() + index)
      return jour.toISOString().slice(0, 10)
    }),
    [windowStart],
  )

  // Les membres du foyer, pour apparier « Zoé » à quelqu'un. La route de
  // présence les rend déjà ; on ne LIT que ça ici, on n'écrit qu'à la
  // confirmation.
  useEffect(() => {
    let vivant = true
    authFetch(`/api/planning/presence?window_start=${windowStart}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!vivant) return
        if (!response.ok) { setPresenceIndisponible(true); return }
        setMembres(Array.isArray(data.members) ? data.members : [])
      })
      .catch(() => { if (vivant) setPresenceIndisponible(true) })
    return () => { vivant = false }
  }, [windowStart])

  const startProgressMessages = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    for (const msg of PROGRESS_MESSAGES) {
      const t = setTimeout(() => setProgressText(msg.text), msg.delay)
      timersRef.current.push(t)
    }
  }, [])

  const appliquerTraduction = useCallback((reponse) => {
    const etat = etatApresTraduction(reponse, { membres })
    setIntention(etat.intention)
    setDeduits(etat.deduits)
    setRepli(etat.repli)
    setLignes(etat.lignes)
    setAttenteConfirmation(etat.attenteConfirmation)
    setSaisies({
      maxMinutes: etat.intention.maxMinutes == null ? '' : String(etat.intention.maxMinutes),
      starchCap: etat.intention.starchCap == null ? '' : String(partEnPourcent(etat.intention.starchCap)),
      meatQuota: etat.intention.meatQuota == null ? '' : String(etat.intention.meatQuota),
    })
    setRefusSaisie({})
    setTraductionEtat('lu')
    setErrorMsg('')
  }, [membres])

  const traduirePhrase = useCallback(async () => {
    const texte = phrase.trim()
    if (!texte) return
    setTraductionEtat('encours')
    setTraductionRefus([])
    setRepli(null)

    // LE BUDGET, CÔTÉ NAVIGATEUR. La route coupe à 5 s ; le client attend le
    // budget plus la marge de transport, puis applique LE MÊME repli déclaré.
    // Sans cette seconde borne, un serveur muet ferait attendre indéfiniment —
    // et le critère dit « aucune génération n'attend plus de 5 s ».
    const budgetMs = budgetTraduction()
    const controleur = new AbortController()
    const depart = Date.now()
    const minuterie = setTimeout(() => controleur.abort(), budgetClient(budgetMs))
    try {
      const response = await authFetch('/api/planning/intent-from-phrase', {
        method: 'POST',
        signal: controleur.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: texte, window_start: windowStart, members: membres.map((m) => m.name) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setTraductionRefus(Array.isArray(data.refus) ? data.refus : [])
        setErrorMsg(data.error || `Traduction impossible (${response.status})`)
        setTraductionEtat('refuse')
        return
      }
      appliquerTraduction(data)
    } catch (err) {
      if (err?.name === 'AbortError') {
        appliquerTraduction({
          intention: intentionDeRepli(),
          repli: repliDeclare({ ms: Date.now() - depart, budgetMs }),
        })
        return
      }
      setErrorMsg(err.message || 'Traduction impossible')
      setTraductionEtat('refuse')
    } finally {
      clearTimeout(minuterie)
    }
  }, [appliquerTraduction, membres, phrase, windowStart])

  /** Corriger une contrainte à la main — sans retaper la phrase. */
  const corriger = useCallback((champ, saisie) => {
    if (champ !== 'intent') setSaisies((etat) => ({ ...etat, [champ]: saisie }))
    const resultat = corrigerChamp(intention, champ, saisie, { dates })
    if (!resultat.ok) {
      setRefusSaisie((etat) => ({ ...etat, [champ]: resultat.refus[0]?.message || 'Valeur refusée.' }))
      return
    }
    setRefusSaisie((etat) => { const suite = { ...etat }; delete suite[champ]; return suite })
    setIntention(resultat.intention)
    // Une valeur corrigée à la main n'est plus « déduite de ta phrase ».
    setDeduits((champs) => champs.filter((nom) => nom !== champ))
  }, [dates, intention])

  // Le retrait porte sur les LIGNES de l'écran, pas sur l'intention : refaire
  // les lignes depuis `intention.presence` effacerait les personnes déjà
  // corrigées à la main sur les autres absences.
  const retirer = useCallback((rang) => {
    setLignes((etat) => {
      const restantes = retirerLigne(etat, rang)
      if (!restantes.length) setDeduits((champs) => champs.filter((nom) => nom !== 'presence'))
      return restantes
    })
  }, [])

  const porte = etatDeGeneration({ attenteConfirmation, lignes, membres })

  const generatePlan = useCallback(async () => {
    setStatus('generating')
    setErrorMsg('')
    startProgressMessages()

    try {
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      // LA PRÉSENCE S'ÉCRIT AVANT, ET PAR SA PROPRE ROUTE. `generate-v3` relit
      // les déclarations en base (`loadPresenceDeclarations`) : les faire
      // voyager dans son corps créerait une seconde source de vérité pour la
      // même semaine. Une mutation passe par `app/api/`, jamais d'ici.
      const { declarations } = declarationsAEcrire(lignes, membres)
      if (declarations.length) {
        const presenceResponse = await authFetch('/api/planning/presence', {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ declarations }),
        })
        if (!presenceResponse.ok) {
          const presenceData = await presenceResponse.json().catch(() => ({}))
          throw new Error(presenceData.error || `Absences non enregistrées (${presenceResponse.status})`)
        }
      }

      const response = await authFetch('/api/planning/generate-v3', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpsDeGeneration(intention, { windowStart })),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Échec de génération (${response.status})`)
      setStatus(data.status === 'review_required' ? 'review' : 'success')
      setProgressText(data.status === 'review_required' ? 'Planning sauvegardé — revue nécessaire.' : 'Planning vérifié et sauvegardé !')
      setTimeout(() => router.push('/planning'), 700)

    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus('error')
      setErrorMsg(err.message || 'Erreur inconnue')
    } finally {
      timersRef.current.forEach(t => clearTimeout(t))
      abortRef.current = null
    }
  }, [intention, lignes, membres, router, startProgressMessages, windowStart])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const badge = (champ) => (deduits.includes(champ)
    ? <span className="asst-badge">déduit de ta phrase</span>
    : null)

  return (
    <div className="v21-page narrow">
      <button onClick={() => { abortRef.current?.abort(); router.push('/planning') }} className="asst-back">
        <ArrowLeft size={15} /> Retour au planning
      </button>

      {/* ═══ HERO ÉDITORIAL ═══ */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Assistant · Myko</span>
          <h1 className="v21-title">Générer le planning.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Stock, objectifs et anti-répétition — Myko compose la semaine prochaine.</p>
        </div>
      </header>

      {/* ═══ PICK ═══ */}
      {status === 'pick' && (
        <section className="v21-section flush asst-body">
          <p className="asst-text">
            Myko va créer le planning complet de la semaine prochaine en tenant compte de ton stock, de tes objectifs et de l&apos;anti-répétition.
          </p>

          <div className="asst-week">
            <span className="asst-week-l">Semaine générée</span>
            <span className="asst-week-v">{weekLabel}</span>
          </div>

          <div className="asst-phrase">
            <label className="asst-phrase-l" htmlFor="asst-phrase-input">Dis-le en une phrase <small>facultatif</small></label>
            <textarea
              id="asst-phrase-input"
              className="asst-phrase-input"
              value={phrase}
              maxLength={400}
              rows={2}
              placeholder="Semaine chargée, rien au-delà de 30 minutes — et Zoé dîne dehors mardi."
              onChange={(event) => setPhrase(event.target.value)}
            />
            <button
              type="button"
              onClick={traduirePhrase}
              className="v21-btn ghost"
              disabled={!phrase.trim() || traductionEtat === 'encours'}
            >
              <Wand2 size={15} /> {traductionEtat === 'encours' ? 'Lecture…' : 'Lire ma phrase'}
            </button>
            <p className="asst-note">
              La phrase ne décide de rien : elle est traduite en contraintes, tu les vérifies, et c&apos;est le moteur
              déterministe qui compose la semaine. Sans phrase, les cinq intentions ci-dessous suffisent.
            </p>
          </div>

          {/* ═══ LE REPLI DÉCLARÉ (4.3) — visible, jamais silencieux ═══ */}
          {repli && (
            <div className="asst-repli" role="status">
              <span className="asst-repli-t"><AlertTriangle size={14} /> Repli sur « Équilibré »</span>
              <p className="asst-note">{repli.message}</p>
            </div>
          )}

          {traductionEtat === 'refuse' && (
            <div className="asst-deduites">
              <span className="asst-week-l">Phrase non traduite</span>
              <p className="asst-note">{errorMsg}</p>
              {traductionRefus.map((motif, rang) => (
                <p key={`${motif.champ || 'racine'}-${rang}`} className="asst-note">
                  {motif.champ ? `${motif.champ} — ` : ''}{motif.message}
                </p>
              ))}
              <p className="asst-note">Rien n&apos;a été appliqué. Corrige les contraintes à la main ci-dessous, ou reformule.</p>
            </div>
          )}

          {/* ═══ LES CONTRAINTES, AVANT LE PLAN ET CORRIGEABLES (4.2) ═══ */}
          <div className="asst-deduites">
            <span className="asst-week-l">
              {attenteConfirmation ? 'Ce que Myko a compris — vérifie avant de générer' : 'Contraintes de la semaine'}
            </span>

            <div className="asst-champ">
              <span className="asst-deduite-l">{LIBELLES_CONFIRMATION.intent} {badge('intent')}</span>
              <div className="asst-intents">
                {INTENTS_MOTEUR.map((valeur) => (
                  <button
                    key={valeur}
                    type="button"
                    className={intention.intent === valeur ? 'active' : ''}
                    onClick={() => corriger('intent', intention.intent === valeur ? '' : valeur)}
                  >
                    {INTENT_LIBELLE[valeur]}
                  </button>
                ))}
              </div>
              <span className="asst-aide">
                {intention.intent ? enFrancais('intent', intention.intent) : 'Aucune — Myko cherche le meilleur compromis global.'}
              </span>
            </div>

            <div className="asst-champ">
              <label className="asst-deduite-l" htmlFor="asst-max-minutes">{LIBELLES_CONFIRMATION.maxMinutes} {badge('maxMinutes')}</label>
              <div className="asst-saisie">
                <input
                  id="asst-max-minutes"
                  type="number"
                  inputMode="numeric"
                  min={MAX_MINUTES_BORNES.min}
                  max={MAX_MINUTES_BORNES.max}
                  value={saisies.maxMinutes}
                  placeholder="sans limite"
                  onChange={(event) => corriger('maxMinutes', event.target.value)}
                />
                <span className="asst-unite">minutes par plat au plus</span>
              </div>
              {refusSaisie.maxMinutes && <span className="asst-refus">{refusSaisie.maxMinutes}</span>}
            </div>

            <div className="asst-champ">
              <label className="asst-deduite-l" htmlFor="asst-starch">{LIBELLES_CONFIRMATION.starchCap} {badge('starchCap')}</label>
              <div className="asst-saisie">
                <input
                  id="asst-starch"
                  type="number"
                  inputMode="numeric"
                  min={STARCH_POURCENT_BORNES.min}
                  max={STARCH_POURCENT_BORNES.max}
                  value={saisies.starchCap}
                  placeholder="réglage du foyer"
                  onChange={(event) => corriger('starchCap', event.target.value)}
                />
                <span className="asst-unite">% des créneaux au plus</span>
              </div>
              {refusSaisie.starchCap && <span className="asst-refus">{refusSaisie.starchCap}</span>}
            </div>

            <div className="asst-champ">
              <label className="asst-deduite-l" htmlFor="asst-meat">{LIBELLES_CONFIRMATION.meatQuota} {badge('meatQuota')}</label>
              <div className="asst-saisie">
                <input
                  id="asst-meat"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_MEAT_MEALS_PER_WEEK}
                  value={saisies.meatQuota}
                  placeholder="quotas déclarés"
                  onChange={(event) => corriger('meatQuota', event.target.value)}
                />
                <span className="asst-unite">repas carnés dans la semaine au plus</span>
              </div>
              {refusSaisie.meatQuota && <span className="asst-refus">{refusSaisie.meatQuota}</span>}
            </div>

            <div className="asst-champ">
              <span className="asst-deduite-l">{LIBELLES_CONFIRMATION.presence} {badge('presence')}</span>
              {!lignes.length && <span className="asst-aide">Aucune. La semaine est servie complète.</span>}
              {lignes.map((ligne) => (
                <div key={`${ligne.rang}`} className="asst-presence">
                  <select
                    aria-label={`Personne concernée par l'absence du ${dateEnFrancais(ligne.date)}`}
                    value={ligne.cible || ''}
                    onChange={(event) => setLignes((etat) => viserPresence(etat, ligne.rang, event.target.value))}
                  >
                    <option value="">Qui ? — {ligne.nomLu || 'non reconnu'}</option>
                    <option value={CIBLE_FOYER}>Tout le foyer</option>
                    {membres.map((membre) => (
                      <option key={membre.id} value={String(membre.id)}>{membre.name}</option>
                    ))}
                  </select>
                  <span className="asst-aide">
                    {ligne.present === false ? 'ne mange pas à la maison' : 'mange à la maison'} — {dateEnFrancais(ligne.date)}, {PRISE_LIBELLE[ligne.mealType] || ligne.mealType}
                  </span>
                  <button type="button" className="asst-retirer" onClick={() => retirer(ligne.rang)} aria-label="Retirer cette absence">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {presenceIndisponible && lignes.length > 0 && (
                <span className="asst-refus">Les absences ne peuvent pas être enregistrées : la table de présence n&apos;est pas disponible.</span>
              )}
            </div>

            {!porte.pret && <span className="asst-refus">{porte.message}</span>}
          </div>

          <button onClick={generatePlan} className="v21-btn" disabled={!porte.pret}>
            <Sparkles size={15} /> {porte.libelle}
          </button>

          <p className="asst-note">
            Le calcul est déterministe : stock réservé une seule fois, allergies bloquantes, recettes exactes et courses chiffrées.
            Rien n&apos;est écrit tant que tu n&apos;as pas confirmé.
          </p>
        </section>
      )}

      {/* ═══ GENERATING ═══ */}
      {status === 'generating' && (
        <section className="v21-section flush asst-body" aria-busy="true">
          <span className="asst-eyebrow-live">Myko travaille</span>
          <p className="asst-progress">{progressText}</p>
          <div className="asst-skel-group">
            <div className="v21-skel" style={{ height: 12, width: '90%' }} />
            <div className="v21-skel" style={{ height: 12, width: '70%' }} />
            <div className="v21-skel" style={{ height: 12, width: '80%' }} />
          </div>
          <p className="asst-note">La publication est atomique : aucun demi-planning ne sera sauvegardé.</p>
        </section>
      )}

      {/* ═══ ERROR ═══ */}
      {status === 'error' && (
        <section className="v21-section flush asst-body">
          <p className="asst-progress">Oups…</p>
          <p className="asst-error">{errorMsg}</p>
          <button onClick={generatePlan} className="v21-btn terra">
            <RefreshCw size={15} /> Réessayer
          </button>
        </section>
      )}

      {/* ═══ SUCCESS ═══ */}
      {status === 'success' && (
        <section className="v21-section flush asst-body">
          <span className="asst-eyebrow-live">Terminé</span>
          <p className="asst-progress">Planning sauvegardé.</p>
          <p className="asst-note">Redirection…</p>
        </section>
      )}

      {status === 'review' && (
        <section className="v21-section flush asst-body">
          <span className="asst-eyebrow-live">À vérifier</span>
          <p className="asst-progress">Planning sauvegardé, avec des alertes nutritionnelles.</p>
          <p className="asst-note">La semaine ne sera pas annoncée comme prête tant que ces écarts persistent. Redirection…</p>
        </section>
      )}

      <style jsx>{`
        .asst-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .asst-back:hover { color: var(--terracotta); }

        .asst-body { display: flex; flex-direction: column; align-items: flex-start; gap: 18px; padding-top: 30px; }

        .asst-text {
          font-family: var(--font-text); font-size: 15px; line-height: 1.6;
          color: var(--ink-2); max-width: 52ch; margin: 0;
        }

        .asst-week {
          display: flex; flex-direction: column; gap: 6px;
          width: 100%; padding: 18px 20px;
          border: 1px solid var(--line-strong); border-radius: 3px;
        }
        .asst-week-l {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-3);
        }
        .asst-week-v { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--ink-1); }

        .asst-note {
          font-family: var(--font-mono); font-size: 11px; line-height: 1.6;
          color: var(--ink-3); max-width: 48ch; margin: 0;
        }

        .asst-phrase { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .asst-phrase-l {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-3);
        }
        .asst-phrase-l small { text-transform: none; letter-spacing: 0; opacity: 0.7; }
        .asst-phrase-input {
          width: 100%; resize: vertical; min-height: 58px;
          font-family: var(--font-text); font-size: 15px; line-height: 1.5; color: var(--ink-1);
          background: transparent;
          border: 1px solid var(--line-strong); border-radius: 3px;
          padding: 12px 14px;
        }
        .asst-phrase-input:focus { outline: none; border-color: var(--terracotta); }
        .asst-phrase-input::placeholder { color: var(--ink-3); }

        .asst-repli {
          display: flex; flex-direction: column; gap: 8px; width: 100%;
          padding: 14px 18px; border-radius: 3px;
          border: 1px solid var(--state-expired); background: var(--state-expired-bg);
        }
        .asst-repli-t {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--state-expired);
        }

        .asst-deduites {
          display: flex; flex-direction: column; gap: 16px;
          width: 100%; padding: 16px 20px;
          border: 1px solid var(--line-strong); border-radius: 3px;
        }
        .asst-champ { display: flex; flex-direction: column; gap: 7px; width: 100%; }
        .asst-deduite-l {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--ink-3);
        }
        .asst-badge {
          font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.04em; text-transform: none;
          color: var(--terracotta); border: 1px solid var(--terracotta); border-radius: 999px; padding: 1px 8px;
        }
        .asst-aide { font-family: var(--font-text); font-size: 13.5px; color: var(--ink-2); }
        .asst-refus {
          font-family: var(--font-mono); font-size: 11px; line-height: 1.5;
          color: var(--state-expired);
        }

        .asst-intents { display: flex; flex-wrap: wrap; gap: 7px; }
        .asst-intents button {
          font-family: var(--font-text); font-size: 13.5px; color: var(--ink-2);
          background: transparent; border: 1px solid var(--line-strong); border-radius: 999px;
          padding: 5px 13px; cursor: pointer; transition: all 0.15s ease;
        }
        .asst-intents button:hover { border-color: var(--terracotta); color: var(--terracotta); }
        .asst-intents button.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; }

        .asst-saisie { display: flex; flex-wrap: wrap; align-items: baseline; gap: 9px; }
        .asst-saisie input {
          width: 110px;
          font-family: var(--font-text); font-size: 15px; color: var(--ink-1);
          background: transparent; border: 1px solid var(--line-strong); border-radius: 3px;
          padding: 7px 10px;
        }
        .asst-saisie input:focus { outline: none; border-color: var(--terracotta); }
        .asst-unite { font-family: var(--font-text); font-size: 13.5px; color: var(--ink-2); }

        .asst-presence { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; }
        .asst-presence select {
          font-family: var(--font-text); font-size: 13.5px; color: var(--ink-1);
          background: transparent; border: 1px solid var(--line-strong); border-radius: 3px;
          padding: 6px 9px;
        }
        .asst-retirer {
          display: inline-flex; align-items: center; justify-content: center;
          background: none; border: none; color: var(--ink-3); cursor: pointer; padding: 4px;
        }
        .asst-retirer:hover { color: var(--state-expired); }

        .asst-eyebrow-live {
          display: inline-block;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          background: var(--terracotta); color: #fff; padding: 5px 10px; border-radius: 3px;
        }
        .asst-progress {
          font-family: var(--font-display); font-size: 24px; font-weight: 600;
          letter-spacing: -0.02em; color: var(--ink-1); margin: 0;
        }
        .asst-skel-group { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 360px; }

        .asst-error {
          font-family: var(--font-text); font-size: 14px; line-height: 1.5; white-space: pre-line;
          color: var(--state-expired); background: var(--state-expired-bg);
          border: 1px solid var(--state-expired); border-radius: 3px;
          padding: 12px 16px; margin: 0; max-width: 52ch;
        }
      `}</style>
    </div>
  )
}
