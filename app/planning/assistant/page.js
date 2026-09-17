'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, RefreshCw, Wand2 } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'

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
 * LE CHAMP DE SAISIE — livrable 4.1.
 *
 * UN CHAMP, PAS UN DIALOGUE. La phrase entre, le traducteur rend cinq
 * contraintes, l'écran les montre. Le modèle ne décide de rien : il n'a ni
 * recette, ni stock, ni semaine sous les yeux, et `/api/planning/intent-from-phrase`
 * n'écrit rien en base. C'est `generate-v3` — déterministe — qui décide, comme
 * avant ce livrable.
 *
 * CE QUI MANQUE ENCORE ICI, ET QUI EST ÉCRIT PLUTÔT QUE LAISSÉ À DEVINER :
 * les contraintes s'affichent mais ne se CORRIGENT pas à la main, et elles ne
 * partent pas encore avec la génération. C'est le livrable 4.2 (écran de
 * confirmation modifiable) et le 4.3 (budget de latence et repli déclaré). Un
 * champ qui appliquerait en silence une contrainte mal déduite serait
 * exactement ce que le 4.2 existe pour empêcher.
 */
const LIBELLES_CONTRAINTES = {
  intent: 'Intention',
  starchCap: 'Plafond de féculent',
  meatQuota: 'Repas carnés au plus',
  maxMinutes: 'Minutes par plat au plus',
  presence: 'Absences déclarées',
}

const INTENT_LABEL = {
  balanced: 'Équilibré', stock: 'Priorité stock', quick: 'Rapide', light: 'Plus léger', vegetarian: 'Végétarien',
}

/** Rend une contrainte déduite en français, ou `null` si la phrase n'en parle pas. */
function formatContrainte(champ, valeur) {
  if (valeur == null) return null
  if (champ === 'intent') return INTENT_LABEL[valeur] || valeur
  if (champ === 'starchCap') return `${Math.round(valeur * 100)} % des repas`
  if (champ === 'meatQuota') return `${valeur} repas sur la semaine`
  if (champ === 'maxMinutes') return `${valeur} minutes`
  if (champ === 'presence') {
    if (!valeur.length) return null
    return valeur.map((ligne) => `${ligne.person || 'le foyer'} — ${ligne.date}, ${ligne.mealType}`).join(' · ')
  }
  return String(valeur)
}

export default function PlanningAssistantPage() {
  const router = useRouter()
  const [status, setStatus] = useState('pick') // pick | generating | success | review | error
  const [progressText, setProgressText] = useState(PROGRESS_MESSAGES[0].text)
  const [errorMsg, setErrorMsg] = useState('')
  const [phrase, setPhrase] = useState('')
  const [traduction, setTraduction] = useState(null)
  const [traductionEtat, setTraductionEtat] = useState('repos') // repos | encours | lu | refuse
  const [traductionRefus, setTraductionRefus] = useState([])
  const abortRef = useRef(null)
  const timersRef = useRef([])

  const windowStart = getNextMonday().toISOString().slice(0, 10)
  const weekLabel = formatWeekLabel(new Date(`${windowStart}T12:00:00`))

  const startProgressMessages = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    for (const msg of PROGRESS_MESSAGES) {
      const t = setTimeout(() => setProgressText(msg.text), msg.delay)
      timersRef.current.push(t)
    }
  }, [])

  const traduirePhrase = useCallback(async () => {
    const texte = phrase.trim()
    if (!texte) return
    setTraductionEtat('encours')
    setTraduction(null)
    setTraductionRefus([])
    try {
      const response = await authFetch('/api/planning/intent-from-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: texte, window_start: windowStart }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setTraductionRefus(Array.isArray(data.refus) ? data.refus : [])
        setErrorMsg(data.error || `Traduction impossible (${response.status})`)
        setTraductionEtat('refuse')
        return
      }
      setTraduction(data.intention || null)
      setTraductionEtat('lu')
      setErrorMsg('')
    } catch (err) {
      setErrorMsg(err.message || 'Traduction impossible')
      setTraductionEtat('refuse')
    }
  }, [phrase, windowStart])

  const generatePlan = useCallback(async () => {
    setStatus('generating')
    setErrorMsg('')
    startProgressMessages()

    try {
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal
      const response = await authFetch('/api/planning/generate-v3', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ window_start: windowStart }),
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
  }, [router, startProgressMessages, windowStart])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

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
            Myko va créer le planning complet de la semaine prochaine en tenant compte de ton stock, de tes objectifs et de l'anti-répétition.
          </p>

          <div className="asst-week">
            <span className="asst-week-l">Semaine générée</span>
            <span className="asst-week-v">{weekLabel}</span>
          </div>

          <div className="asst-phrase">
            <label className="asst-phrase-l" htmlFor="asst-phrase-input">Dis-le en une phrase</label>
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
              La phrase ne décide de rien : elle est traduite en contraintes, et c&apos;est le moteur déterministe qui compose la semaine.
            </p>
          </div>

          {traductionEtat === 'lu' && traduction && (
            <div className="asst-deduites">
              <span className="asst-week-l">Contraintes déduites</span>
              {Object.keys(LIBELLES_CONTRAINTES)
                .map((champ) => [champ, formatContrainte(champ, traduction[champ])])
                .filter(([, valeur]) => valeur != null)
                .map(([champ, valeur]) => (
                  <div key={champ} className="asst-deduite">
                    <span className="asst-deduite-l">{LIBELLES_CONTRAINTES[champ]}</span>
                    <span className="asst-deduite-v">{valeur}</span>
                  </div>
                ))}
              {Object.keys(LIBELLES_CONTRAINTES).every((champ) => formatContrainte(champ, traduction[champ]) == null) && (
                <p className="asst-note">Aucune contrainte lue dans cette phrase.</p>
              )}
              <p className="asst-note">
                Ces contraintes ne partent pas encore avec la génération : elles s&apos;afficheront pour correction avant d&apos;être appliquées.
              </p>
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
            </div>
          )}

          <button onClick={generatePlan} className="v21-btn">
            <Sparkles size={15} /> Générer avec Myko
          </button>

          <p className="asst-note">
            Le calcul est déterministe : stock réservé une seule fois, allergies bloquantes, recettes exactes et courses chiffrées.
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
        .asst-phrase-input {
          width: 100%; resize: vertical; min-height: 58px;
          font-family: var(--font-text); font-size: 15px; line-height: 1.5; color: var(--ink-1);
          background: transparent;
          border: 1px solid var(--line-strong); border-radius: 3px;
          padding: 12px 14px;
        }
        .asst-phrase-input:focus { outline: none; border-color: var(--terracotta); }
        .asst-phrase-input::placeholder { color: var(--ink-3); }

        .asst-deduites {
          display: flex; flex-direction: column; gap: 10px;
          width: 100%; padding: 16px 20px;
          border: 1px solid var(--line-strong); border-radius: 3px;
        }
        .asst-deduite { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
        .asst-deduite-l {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--ink-3); min-width: 15ch;
        }
        .asst-deduite-v { font-family: var(--font-text); font-size: 15px; color: var(--ink-1); }

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
