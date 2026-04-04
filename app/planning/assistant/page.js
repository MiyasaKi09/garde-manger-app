'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react'
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

export default function PlanningAssistantPage() {
  const router = useRouter()
  const [status, setStatus] = useState('generating') // generating | saving | success | error
  const [progressText, setProgressText] = useState(PROGRESS_MESSAGES[0].text)
  const [errorMsg, setErrorMsg] = useState('')
  const [planJson, setPlanJson] = useState(null)
  const abortRef = useRef(null)
  const timersRef = useRef([])

  const startProgressMessages = useCallback(() => {
    // Clear any existing timers
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
    setPlanJson(null)
    startProgressMessages()

    try {
      abortRef.current = new AbortController()

      // Determine which week to generate
      const today = new Date()
      const dayOfWeek = today.getDay()
      // If Friday or later, generate next week
      const targetMonday = new Date(today)
      if (dayOfWeek >= 5) {
        targetMonday.setDate(today.getDate() + (8 - dayOfWeek))
      } else {
        targetMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
      }
      const mondayStr = targetMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

      const response = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'planning',
          messages: [{
            role: 'user',
            content: `Génère le planning complet de la semaine du ${mondayStr}.`,
          }],
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }

      // Read SSE stream
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

      // Extract JSON from response
      const parsed = extractJson(fullText)
      if (!parsed || !parsed.days || !Array.isArray(parsed.days)) {
        throw new Error('Le planning généré est invalide. Pas de structure "days" trouvée.')
      }

      setPlanJson(parsed)

      // Auto-save
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

      // Redirect after short delay
      setTimeout(() => {
        router.push('/planning')
      }, 800)

    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('[Planning Auto-Gen] Error:', err)
      setStatus('error')
      setErrorMsg(err.message || 'Erreur inconnue')
    } finally {
      timersRef.current.forEach(t => clearTimeout(t))
      abortRef.current = null
    }
  }, [router, startProgressMessages])

  // Auto-generate on mount
  useEffect(() => {
    generatePlan()
    return () => {
      abortRef.current?.abort()
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    // If we have the JSON but save failed, just retry save
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
      setTimeout(() => router.push(`/planning/${saveData.importId}`), 800)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div style={S.page}>
      {/* Back button */}
      <button onClick={() => { abortRef.current?.abort(); router.push('/') }} style={S.backBtn}>
        <ArrowLeft size={18} />
      </button>

      <div style={S.center}>
        {/* Icon */}
        <div style={S.iconWrap}>
          {status === 'error' ? (
            <span style={{ fontSize: 48 }}>😕</span>
          ) : (
            <Sparkles size={48} color="#16a34a" style={status === 'generating' || status === 'saving' ? { animation: 'pulse 2s ease-in-out infinite' } : {}} />
          )}
        </div>

        {/* Status text */}
        <p style={S.progressText}>{status === 'error' ? 'Oups...' : progressText}</p>

        {/* Progress bar */}
        {(status === 'generating' || status === 'saving') && (
          <div style={S.progressBarOuter}>
            <div style={S.progressBarInner} />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={S.errorBox}>
            <p style={S.errorText}>{errorMsg}</p>
            <button onClick={handleRetry} style={S.retryBtn}>
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <p style={S.successText}>Redirection...</p>
        )}
      </div>

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

/**
 * Extracts JSON from Claude's response.
 * Tries ```json block first, then raw JSON extraction.
 */
function extractJson(text) {
  // Try ```json block
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    try { return JSON.parse(jsonBlockMatch[1]) } catch {}
  }

  // Try raw JSON (find first { to last })
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)) } catch {}
  }

  return null
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 30%, #fefce8 100%)',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    border: 'none',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 10,
    cursor: 'pointer',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '0 24px',
    textAlign: 'center',
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'rgba(22,163,74,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  progressBarOuter: {
    width: 200,
    height: 4,
    background: 'rgba(22,163,74,0.1)',
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
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
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
    background: '#16a34a',
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
