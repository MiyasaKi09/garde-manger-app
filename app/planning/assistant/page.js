'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import AiChat from '@/components/AiChat'
import Modal from '@/components/ui/Modal'
import GlassCard from '@/components/ui/GlassCard'

const SUGGESTIONS = [
  'Fais-moi un planning pour cette semaine',
  'Un planning avec beaucoup de protéines',
  'Planning rapide, max 30min par repas',
  'Planning anti-gaspi avec ce qu\'il y a en stock',
  'Un planning végétarien pour la semaine',
]

export default function PlanningAssistantPage() {
  const router = useRouter()
  const [planJson, setPlanJson] = useState(null)
  const [showReview, setShowReview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Try to extract JSON plan from assistant messages
  const handleMessage = useCallback((msg, allMessages) => {
    if (msg.role !== 'assistant') return

    // Look for JSON block in the message
    const jsonMatch = msg.content.match(/```json\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.days && Array.isArray(parsed.days)) {
          setPlanJson(parsed)
        }
      } catch {
        // Not valid JSON yet, that's ok
      }
    }
  }, [])

  const handleSavePlan = async () => {
    if (!planJson) return
    setSaving(true)
    setSaveError(null)

    try {
      const res = await authFetch('/api/ai/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planJson }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur sauvegarde')

      setShowReview(false)
      router.push(`/planning/${data.importId}`)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push('/planning')} style={styles.backBtn}>
          <ArrowLeft size={18} />
        </button>
        <div style={styles.headerTitle}>
          <Sparkles size={18} color="#16a34a" />
          <span>Assistant Planning</span>
        </div>
        {planJson && (
          <button onClick={() => setShowReview(true)} style={styles.saveBtn}>
            <Save size={16} />
            <span>Sauvegarder</span>
          </button>
        )}
      </div>

      {/* Chat */}
      <AiChat
        intent="planning"
        onMessage={handleMessage}
        placeholder="Décris le planning que tu veux..."
        welcomeTitle="Planifions tes repas !"
        welcomeSubtitle="Dis-moi tes envies, contraintes ou objectifs — je m'occupe du reste."
        suggestions={SUGGESTIONS}
      />

      {/* Review Modal */}
      <Modal open={showReview} onClose={() => setShowReview(false)} title="Confirmer le planning" width={600}>
        {planJson && (
          <>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              {planJson.label || 'Planning généré par Myko'}
            </p>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {planJson.days?.map((day, i) => (
                <GlassCard key={i} padding={12} radius={12} style={{ marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>
                    {day.dayName} {day.date}
                  </p>
                  {['pdj', 'dej', 'din', 'col'].map(mealType => {
                    const meal = day[mealType]
                    if (!meal) return null
                    return (
                      <div key={mealType} style={{ fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>
                          {mealType === 'pdj' ? 'Petit-déj' : mealType === 'dej' ? 'Déjeuner' : mealType === 'din' ? 'Dîner' : 'Collation'}
                        </span>
                        {meal.j && <p style={{ margin: '2px 0 2px 12px' }}>Julien: {meal.j.desc} <span style={{ color: '#9ca3af' }}>({meal.j.kcal} kcal)</span></p>}
                        {meal.z && <p style={{ margin: '2px 0 2px 12px' }}>Zoé: {meal.z.desc} <span style={{ color: '#9ca3af' }}>({meal.z.kcal} kcal)</span></p>}
                      </div>
                    )
                  })}
                </GlassCard>
              ))}
            </div>

            {saveError && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSavePlan} disabled={saving} style={styles.confirmBtn}>
                {saving ? 'Sauvegarde...' : 'Confirmer et sauvegarder'}
              </button>
              <button onClick={() => setShowReview(false)} style={styles.cancelBtn}>
                Modifier
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    background: 'rgba(255,255,255,0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  backBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 8,
    cursor: 'pointer',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--ink, #1f281f)',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    border: 'none',
    borderRadius: 10,
    background: '#16a34a',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: 10,
    background: '#16a34a',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10,
    background: 'transparent',
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
