'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'

const PROGRESS_MESSAGES = [
  { delay: 0,     text: 'Myko prépare ton planning...' },
  { delay: 8000,  text: 'Analyse du stock et des objectifs...' },
  { delay: 16000, text: 'Sélection des recettes de la semaine...' },
  { delay: 25000, text: 'Calcul des macros par personne...' },
  { delay: 35000, text: 'Optimisation de la liste de courses...' },
  { delay: 50000, text: 'Finalisation du planning...' },
  { delay: 70000, text: 'Ça prend un peu plus longtemps que prévu...' },
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

export default function PlanningAssistantPage() {
  const router = useRouter()
  const [status, setStatus] = useState('pick') // pick | generating | success | error
  const [progressText, setProgressText] = useState(PROGRESS_MESSAGES[0].text)
  const [errorMsg, setErrorMsg] = useState('')
  const abortRef = useRef(null)
  const timersRef = useRef([])

  const nextMonday = getNextMonday()
  const weekLabel = formatWeekLabel(nextMonday)

  const startProgressMessages = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    for (const msg of PROGRESS_MESSAGES) {
      const t = setTimeout(() => setProgressText(msg.text), msg.delay)
      timersRef.current.push(t)
    }
  }, [])

  const generatePlan = useCallback(async () => {
    setStatus('generating')
    setErrorMsg('')
    startProgressMessages()

    const abortableSleep = (ms, signal) => new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
    })

    try {
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      // Référence : id max des imports existants, pour détecter le nouveau.
      let baselineId = 0
      try {
        const baseRes = await authFetch('/api/planning/imports', { signal })
        const baseData = await baseRes.json()
        for (const imp of (baseData.imports || [])) {
          if (Number(imp.id) > baselineId) baselineId = Number(imp.id)
        }
      } catch (e) {
        if (e.name === 'AbortError') return
      }

      // Déclenche la routine (zéro coût API direct).
      const trigRes = await authFetch('/api/routine/generate-plan', {
        method: 'POST',
        signal,
      })
      const trigData = await trigRes.json().catch(() => ({}))
      if (!trigRes.ok && trigRes.status !== 202) {
        const detail = trigData.detail ? ` — ${trigData.detail}` : ''
        const hint = trigData.hint ? `\n${trigData.hint}` : ''
        throw new Error((trigData.error || `Erreur déclenchement (${trigRes.status})`) + detail + hint)
      }

      // Poll Supabase jusqu'à voir le nouvel import (la routine écrit directement).
      const MAX_WAIT_MS = 6 * 60 * 1000
      const POLL_MS = 12_000
      const deadline = Date.now() + MAX_WAIT_MS
      while (Date.now() < deadline) {
        await abortableSleep(POLL_MS, signal)
        const res = await authFetch('/api/planning/imports', { signal })
        const data = await res.json()
        const fresh = (data.imports || []).find(imp => Number(imp.id) > baselineId)
        if (fresh) {
          setStatus('success')
          setProgressText('Planning généré !')
          setTimeout(() => router.push('/planning'), 800)
          return
        }
      }
      throw new Error("La routine prend plus de temps que prévu. Ton planning apparaîtra dans l'onglet Planning dès qu'il sera prêt.")

    } catch (err) {
      if (err.name === 'AbortError') return
      setStatus('error')
      setErrorMsg(err.message || 'Erreur inconnue')
    } finally {
      timersRef.current.forEach(t => clearTimeout(t))
      abortRef.current = null
    }
  }, [router, startProgressMessages])

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

          <button onClick={generatePlan} className="v21-btn">
            <Sparkles size={15} /> Générer avec Myko
          </button>

          <p className="asst-note">
            La génération dure 2–4 minutes. Tu peux quitter la page — le planning apparaîtra dans l'onglet Planning.
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
          <p className="asst-note">Myko écrit directement dans Supabase au fur et à mesure.</p>
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
