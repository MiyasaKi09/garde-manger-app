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
    <div style={S.page}>
      <button onClick={() => { abortRef.current?.abort(); router.push('/planning') }} style={S.backBtn}>
        <ArrowLeft size={18} />
      </button>

      {/* ═══ PICK ═══ */}
      {status === 'pick' && (
        <div style={S.center}>
          <div style={S.iconWrap}>
            <Sparkles size={40} color="#16a34a" />
          </div>
          <h2 style={S.title}>Générer le planning</h2>
          <p style={S.subtitle}>
            Myko va créer le planning complet de la semaine prochaine en tenant compte de ton stock, de tes objectifs et de l'anti-répétition.
          </p>

          <div style={S.weekCard}>
            <span style={S.weekLabel}>Semaine générée</span>
            <span style={S.weekDates}>{weekLabel}</span>
          </div>

          <button onClick={generatePlan} style={S.generateBtn}>
            <Sparkles size={18} />
            Générer avec Myko
          </button>

          <p style={S.note}>
            La génération dure 2–4 minutes. Tu peux quitter la page — le planning apparaîtra dans l'onglet Planning.
          </p>
        </div>
      )}

      {/* ═══ GENERATING ═══ */}
      {status === 'generating' && (
        <div style={S.center}>
          <div style={S.iconWrap}>
            <Sparkles size={40} color="#16a34a" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <p style={S.progressText}>{progressText}</p>
          <div style={S.progressBarOuter}>
            <div style={S.progressBarInner} />
          </div>
          <p style={S.note}>Myko écrit directement dans Supabase au fur et à mesure.</p>
        </div>
      )}

      {/* ═══ ERROR ═══ */}
      {status === 'error' && (
        <div style={S.center}>
          <span style={{ fontSize: 48 }}>😕</span>
          <p style={S.progressText}>Oups...</p>
          <p style={S.errorText}>{errorMsg}</p>
          <button onClick={generatePlan} style={S.retryBtn}>
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      )}

      {/* ═══ SUCCESS ═══ */}
      {status === 'success' && (
        <div style={S.center}>
          <div style={S.iconWrap}>
            <Sparkles size={40} color="#16a34a" />
          </div>
          <p style={S.progressText}>Planning sauvegardé !</p>
          <p style={S.note}>Redirection...</p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

const S = {
  page: {
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 12, left: 12,
    border: 'none',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    padding: 10,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: '0 24px',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
  },
  iconWrap: {
    width: 90, height: 90,
    borderRadius: '50%',
    background: 'rgba(22,163,74,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.55,
    maxWidth: 360,
  },
  weekCard: {
    width: '100%',
    background: 'rgba(22,163,74,0.05)',
    border: '1.5px solid rgba(22,163,74,0.18)',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#16a34a',
  },
  weekDates: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px 0',
    border: 'none',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    margin: 0,
    lineHeight: 1.5,
    maxWidth: 340,
  },
  progressText: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  progressBarOuter: {
    width: 180, height: 3,
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarInner: {
    position: 'absolute',
    top: 0, left: 0,
    width: '50%', height: '100%',
    background: 'linear-gradient(90deg, transparent, #16a34a, transparent)',
    borderRadius: 2,
    animation: 'shimmer 1.5s ease-in-out infinite',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    margin: 0,
    maxWidth: 400,
    lineHeight: 1.4,
    whiteSpace: 'pre-line',
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
  },
}
