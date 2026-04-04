'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react'

/**
 * Mode cuisine immersif plein écran.
 * Fond sombre, étapes une par une, timers intégrés, navigation simple.
 * Inspiré du mode cuisine de Claude.
 */
export default function CookMode({ open, onClose, recipe, steps, ingredients, recipeId, onRate }) {
  // -1 = landing, 0+ = step index, 'done' = finished
  const [currentStep, setCurrentStep] = useState(-1)
  const [rating, setRating] = useState(0)
  const isLanding = currentStep === -1

  useEffect(() => {
    if (open) {
      setCurrentStep(-1)
      setRating(0)
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const maxStep = (steps?.length || 1) - 1
    const handleKey = (e) => {
      if (currentStep === 'done') return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentStep(s => {
          if (s === maxStep) return 'done'
          return Math.min(s + 1, maxStep)
        })
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep(s => s === 'done' ? maxStep : Math.max(s - 1, -1))
      }
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, steps, onClose, currentStep])

  if (!open || !recipe) return null

  const recipeName = recipe.title || recipe.name
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)

  // ---- LANDING SCREEN (glass-morphism style) ----
  if (currentStep === -1) {
    return (
      <div style={styles.landingOverlay}>
        <button onClick={onClose} style={styles.landingCloseBtn}><X size={24} /></button>
        <div style={styles.landingScroll}>
          <div style={styles.landingContainer}>
            <h1 style={styles.landingTitle}>{recipeName}</h1>
            {recipe.description && (
              <p style={styles.landingDesc}>{recipe.description}</p>
            )}
            {totalTime > 0 && (
              <p style={styles.landingMeta}>{steps?.length || 0} étapes{totalTime ? ` · ${totalTime} min` : ''}</p>
            )}

            {/* Ingredients */}
            {ingredients?.length > 0 && (
              <div style={styles.ingredientsList}>
                <h3 style={styles.landingIngTitle}>INGRÉDIENTS</h3>
                {ingredients.map((ing, i) => (
                  <p key={i} style={styles.landingIngItem}>
                    {ing.quantity && <span style={styles.landingIngQty}>{ing.quantity} {ing.unit}</span>}
                    {' '}{ing.name}{ing.notes ? ` (${ing.notes})` : ''}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => setCurrentStep(0)}
              style={styles.landingStartBtn}
              disabled={!steps?.length}
            >
              Commencer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- DONE SCREEN (rating) ----
  if (currentStep === 'done') {
    return (
      <div style={styles.overlay}>
        <div style={styles.content}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍🍳</div>
            <h2 style={{ ...styles.stepTitle, marginBottom: 8 }}>Bon appétit !</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
              Comment c'était ?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 36,
                    cursor: 'pointer',
                    opacity: star <= rating ? 1 : 0.3,
                    transition: 'opacity 0.15s, transform 0.15s',
                    transform: star <= rating ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (rating > 0) onRate?.(rating)
                onClose?.()
              }}
              style={styles.doneBtn}
            >
              {rating > 0 ? 'Enregistrer & fermer' : 'Fermer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- STEP SCREEN ----
  if (!steps?.length) return null

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  const timerMinutes = step.duration_min || extractTimerFromText(step.instruction || step.description || '')
  const fullText = step.instruction || step.description || ''
  const { title: stepTitle, body: stepBody } = splitStepText(fullText)

  return (
    <div style={styles.overlay}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>{recipeName}</span>
        </div>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
      </div>

      {/* Step content */}
      <div style={styles.content}>
        <div style={styles.stepContainer}>
          {stepTitle && (
            <h2 style={styles.stepTitle}>{stepTitle}</h2>
          )}
          <p style={styles.stepText}>{stepBody || fullText}</p>

          {/* Timer */}
          {timerMinutes > 0 && (
            <Timer minutes={timerMinutes} key={`timer-${currentStep}-${timerMinutes}`} />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div style={styles.footer}>
        <button
          onClick={() => setCurrentStep(s => Math.max(-1, s - 1))}
          style={styles.navBtn}
        >
          <ChevronLeft size={24} />
        </button>

        <span style={styles.stepCounter}>
          Étape {currentStep + 1} sur {steps.length}
        </span>

        <button
          onClick={() => setCurrentStep(s => isLast ? 'done' : Math.min(steps.length - 1, s + 1))}
          style={styles.navBtn}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )
}

// --- Timer sub-component ---

function Timer({ minutes }) {
  const totalSeconds = minutes * 60
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false)
            // Vibrate or beep
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, remaining])

  const reset = () => {
    setRunning(false)
    setRemaining(totalSeconds)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0

  return (
    <div style={styles.timerContainer}>
      <div style={styles.timerDisplay}>
        <span style={{
          ...styles.timerText,
          color: remaining === 0 ? '#ef4444' : 'white',
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span style={styles.timerLabel}>{minutes} minutes</span>
      </div>

      <div style={styles.timerActions}>
        {remaining === 0 ? (
          <button onClick={reset} style={styles.timerBtn}>
            <RotateCcw size={18} />
            <span>Relancer</span>
          </button>
        ) : (
          <button
            onClick={() => setRunning(!running)}
            style={{
              ...styles.timerBtn,
              background: running ? 'rgba(255,255,255,0.1)' : 'rgba(96,165,250,0.2)',
              borderColor: running ? 'rgba(255,255,255,0.2)' : 'rgba(96,165,250,0.4)',
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            <span>{running ? 'Pause' : 'Démarrer'}</span>
          </button>
        )}
      </div>

      {/* Progress ring */}
      {running && (
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

// --- Helpers ---

function extractTimerFromText(text) {
  // Match patterns like "40 minutes", "5 à 8 minutes", "30min", "2h"
  const match = text.match(/(\d+)\s*(?:à\s*\d+\s*)?minutes?/i)
  if (match) return parseInt(match[1])
  const matchMin = text.match(/(\d+)\s*min/i)
  if (matchMin) return parseInt(matchMin[1])
  const matchH = text.match(/(\d+)\s*h(?:eure)?s?/i)
  if (matchH) return parseInt(matchH[1]) * 60
  return 0
}

function splitStepText(text) {
  // Try to split on ":" to get title and body
  const colonIndex = text.indexOf(':')
  if (colonIndex > 0 && colonIndex < 60) {
    return {
      title: text.substring(0, colonIndex).trim(),
      body: text.substring(colonIndex + 1).trim(),
    }
  }
  // Try first sentence as title if short enough
  const dotIndex = text.indexOf('.')
  if (dotIndex > 0 && dotIndex < 50) {
    return {
      title: text.substring(0, dotIndex).trim(),
      body: text.substring(dotIndex + 1).trim(),
    }
  }
  return { title: null, body: text }
}

// --- Styles ---

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#111111',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  recipeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  headerImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.8)',
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    padding: 8,
    display: 'flex',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    overflowY: 'auto',
  },
  stepContainer: {
    maxWidth: 640,
    width: '100%',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: 'white',
    marginBottom: 24,
    lineHeight: 1.3,
  },
  stepText: {
    fontSize: 17,
    lineHeight: 1.8,
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    padding: '20px 24px 28px',
    flexShrink: 0,
  },
  navBtn: {
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    transition: 'opacity 0.15s',
  },
  stepCounter: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
    minWidth: 120,
    textAlign: 'center',
  },

  // ── Landing screen (light glass-morphism) ──
  landingOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 30%, #fefce8 100%)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  landingCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    color: '#6b7280',
    cursor: 'pointer',
    padding: 8,
    display: 'flex',
    borderRadius: 10,
    zIndex: 10,
  },
  landingScroll: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '60px 24px 40px',
    overflowY: 'auto',
  },
  landingContainer: {
    textAlign: 'center',
    maxWidth: 520,
    width: '100%',
  },
  landingTitle: {
    fontFamily: "'Crimson Text', Georgia, serif",
    fontSize: 32,
    fontWeight: 700,
    color: '#16a34a',
    marginBottom: 12,
    lineHeight: 1.2,
  },
  landingDesc: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  landingMeta: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 32,
  },
  ingredientsList: {
    textAlign: 'left',
    marginBottom: 32,
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: 16,
    padding: '16px 20px',
  },
  landingIngTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  landingIngItem: {
    fontSize: 14,
    color: '#374151',
    margin: '6px 0',
    lineHeight: 1.4,
  },
  landingIngQty: {
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
  },
  landingStartBtn: {
    padding: '14px 48px',
    border: 'none',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
  },

  // Done screen button (dark theme)
  doneBtn: {
    padding: '14px 48px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 28,
    background: 'transparent',
    color: 'white',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    letterSpacing: 0.5,
  },

  // ── Dark theme styles (step-by-step + rating — kept dark for cooking) ──

  // Timer
  timerContainer: {
    marginTop: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  timerDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 300,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  timerActions: {
    display: 'flex',
    gap: 12,
  },
  timerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: 24,
    background: 'rgba(96,165,250,0.15)',
    color: 'rgba(96,165,250,1)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  progressBar: {
    width: 200,
    height: 3,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    background: 'rgba(96,165,250,0.6)',
    borderRadius: 2,
    transition: 'width 1s linear',
  },
}
