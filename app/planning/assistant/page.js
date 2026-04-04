'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, RefreshCw, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'

const PROGRESS_MESSAGES = [
  { delay: 0, text: 'Myko prépare ton planning...' },
  { delay: 8000, text: 'Analyse du stock et des objectifs...' },
  { delay: 16000, text: 'Sélection des recettes de la semaine...' },
  { delay: 25000, text: 'Calcul des macros par personne...' },
  { delay: 35000, text: 'Optimisation de la liste de courses...' },
  { delay: 50000, text: 'Finalisation du planning...' },
  { delay: 70000, text: 'Ça prend un peu plus longtemps que prévu...' },
]

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday) {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function formatDateFR(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function PlanningAssistantPage() {
  const router = useRouter()
  const [status, setStatus] = useState('pick') // pick | generating | saving | success | error
  const [progressText, setProgressText] = useState(PROGRESS_MESSAGES[0].text)
  const [errorMsg, setErrorMsg] = useState('')
  const [planJson, setPlanJson] = useState(null)
  const abortRef = useRef(null)
  const timersRef = useRef([])

  // Date picker state
  const today = new Date()
  const [weekOffset, setWeekOffset] = useState(0)
  const monday = getMonday(today)
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(monday)

  // Selected days (default: full week)
  const [selectedDays, setSelectedDays] = useState(() => {
    const m = getMonday(today)
    return getWeekDays(m).map(d => d.toISOString().split('T')[0])
  })

  // Update selected days when week changes
  useEffect(() => {
    setSelectedDays(weekDays.map(d => d.toISOString().split('T')[0]))
  }, [weekOffset])

  function toggleDay(dateStr) {
    setSelectedDays(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr].sort()
    )
  }

  function selectAll() {
    setSelectedDays(weekDays.map(d => d.toISOString().split('T')[0]))
  }

  const startProgressMessages = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    for (const msg of PROGRESS_MESSAGES) {
      const t = setTimeout(() => setProgressText(msg.text), msg.delay)
      timersRef.current.push(t)
    }
  }, [])

  const generatePlan = useCallback(async () => {
    if (!selectedDays.length) return
    setStatus('generating')
    setErrorMsg('')
    setPlanJson(null)
    startProgressMessages()

    try {
      abortRef.current = new AbortController()

      // Build date range description for Claude
      const sortedDays = [...selectedDays].sort()
      const firstDate = new Date(sortedDays[0])
      const lastDate = new Date(sortedDays[sortedDays.length - 1])
      const fromStr = formatDateFR(firstDate)
      const toStr = formatDateFR(lastDate)

      let prompt
      if (selectedDays.length === 7) {
        prompt = `Génère le planning complet de la semaine du ${fromStr} au ${toStr}.`
      } else {
        const dayNames = sortedDays.map(d => {
          const date = new Date(d)
          return `${DAY_NAMES[(date.getDay() + 6) % 7]} ${date.getDate()}`
        }).join(', ')
        prompt = `Génère le planning pour les jours suivants uniquement : ${dayNames} (du ${fromStr} au ${toStr}).`
      }

      const response = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'planning',
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) fullText += data.text
            if (data.error) throw new Error(data.error)
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }

      const parsed = extractJson(fullText)
      if (!parsed || !parsed.days || !Array.isArray(parsed.days)) {
        throw new Error('Le planning généré est invalide.')
      }

      setPlanJson(parsed)
      setStatus('saving')
      setProgressText('Sauvegarde du planning...')

      const saveRes = await authFetch('/api/ai/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: parsed }),
      })

      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Erreur de sauvegarde')

      setStatus('success')
      setProgressText('Planning sauvegardé !')
      setTimeout(() => router.push('/planning'), 800)

    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('[Planning Auto-Gen] Error:', err)
      setStatus('error')
      setErrorMsg(err.message || 'Erreur inconnue')
    } finally {
      timersRef.current.forEach(t => clearTimeout(t))
      abortRef.current = null
    }
  }, [router, startProgressMessages, selectedDays])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const handleRetry = () => {
    if (planJson && status === 'error' && errorMsg.includes('sauvegarde')) {
      retrySave()
    } else {
      generatePlan()
    }
  }

  const retrySave = async () => {
    if (!planJson) return
    setStatus('saving')
    setProgressText('Sauvegarde du planning...')
    setErrorMsg('')
    try {
      const saveRes = await authFetch('/api/ai/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planJson }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Erreur de sauvegarde')
      setStatus('success')
      setTimeout(() => router.push('/planning'), 800)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div style={S.page}>
      {/* Back button */}
      <button onClick={() => { abortRef.current?.abort(); router.push('/') }} style={S.backBtn}>
        <ArrowLeft size={18} />
      </button>

      {/* ═══ PICK DATES ═══ */}
      {status === 'pick' && (
        <div style={S.center}>
          <div style={S.iconWrap}>
            <Sparkles size={40} color="#16a34a" />
          </div>
          <h2 style={S.pickTitle}>Quel planning générer ?</h2>
          <p style={S.pickSubtitle}>Sélectionne les jours</p>

          {/* Week nav */}
          <div style={S.weekNav}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={S.weekNavBtn}>
              <ChevronLeft size={16} />
            </button>
            <span style={S.weekLabel}>
              {formatDateFR(weekDays[0])} — {formatDateFR(weekDays[6])}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={S.weekNavBtn}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day buttons */}
          <div style={S.daysRow}>
            {weekDays.map((d, i) => {
              const dateStr = d.toISOString().split('T')[0]
              const selected = selectedDays.includes(dateStr)
              const isToday = dateStr === todayStr
              return (
                <button
                  key={dateStr}
                  onClick={() => toggleDay(dateStr)}
                  style={{
                    ...S.dayBtn,
                    ...(selected ? S.dayBtnSelected : {}),
                    ...(isToday && !selected ? S.dayBtnToday : {}),
                  }}
                >
                  <span style={S.dayName}>{DAY_NAMES[i]}</span>
                  <span style={S.dayNum}>{d.getDate()}</span>
                </button>
              )
            })}
          </div>

          {/* Select all link */}
          {selectedDays.length < 7 && (
            <button onClick={selectAll} style={S.selectAllBtn}>Toute la semaine</button>
          )}

          {/* Generate button */}
          <button
            onClick={generatePlan}
            disabled={!selectedDays.length}
            style={{
              ...S.generateBtn,
              opacity: selectedDays.length ? 1 : 0.5,
            }}
          >
            <Sparkles size={18} />
            Générer {selectedDays.length === 7 ? 'la semaine' : `${selectedDays.length} jour${selectedDays.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* ═══ GENERATING / SAVING ═══ */}
      {(status === 'generating' || status === 'saving') && (
        <div style={S.center}>
          <div style={S.iconWrap}>
            <Sparkles size={40} color="#16a34a" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <p style={S.progressText}>{progressText}</p>
          <div style={S.progressBarOuter}>
            <div style={S.progressBarInner} />
          </div>
        </div>
      )}

      {/* ═══ ERROR ═══ */}
      {status === 'error' && (
        <div style={S.center}>
          <span style={{ fontSize: 48 }}>😕</span>
          <p style={S.progressText}>Oups...</p>
          <p style={S.errorText}>{errorMsg}</p>
          <button onClick={handleRetry} style={S.retryBtn}>
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
          <p style={S.successText}>Redirection...</p>
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

function extractJson(text) {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1]) } catch {}
  }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)) } catch {}
  }
  return null
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
    top: 12,
    left: 12,
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
    padding: '0 20px',
    textAlign: 'center',
    maxWidth: 440,
    width: '100%',
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'rgba(22,163,74,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  // ── Pick dates ──
  pickTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  pickSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    margin: 0,
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  weekNavBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#6b7280',
  },
  daysRow: {
    display: 'flex',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  dayBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '10px 0',
    width: 48,
    border: '1.5px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  dayBtnSelected: {
    background: '#16a34a',
    borderColor: '#16a34a',
    color: 'white',
  },
  dayBtnToday: {
    borderColor: 'rgba(22,163,74,0.4)',
  },
  dayName: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: 700,
  },
  selectAllBtn: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '2px 0',
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
    marginTop: 4,
  },

  // ── Generating ──
  progressText: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  progressBarOuter: {
    width: 180,
    height: 3,
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, #16a34a, transparent)',
    borderRadius: 2,
    animation: 'shimmer 1.5s ease-in-out infinite',
  },

  // ── Error ──
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    margin: 0,
    maxWidth: 400,
    lineHeight: 1.4,
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
  successText: {
    fontSize: 14,
    color: '#16a34a',
    margin: 0,
    fontWeight: 500,
  },
}
