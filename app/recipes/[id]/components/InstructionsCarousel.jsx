'use client'

import { useState } from 'react'

/**
 * Carousel d'instructions pas-à-pas avec navigation.
 * Extrait de recipes/[id]/page.js pour simplifier le JSX.
 */
export default function InstructionsCarousel({ steps, chefTips, onStartCookMode }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!steps || steps.length === 0) {
    return (
      <div className="instructions-section">
        <h2>Instructions</h2>
        <div className="instructions-content">
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
            Instructions non disponibles
          </p>
        </div>
      </div>
    )
  }

  const step = steps[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === steps.length - 1

  return (
    <div className="instructions-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Instructions</h2>
        {onStartCookMode && (
          <button onClick={onStartCookMode} style={styles.cookModeBtn}>
            Commencer la cuisine
          </button>
        )}
      </div>
      <div className="instructions-content">
        <div className="steps-carousel" style={{ position: 'relative', padding: '10px 0' }}>
          {/* Step card */}
          <div className="carousel-card" style={styles.card}>
            <div style={styles.stepNumber}>
              {step.step_no || currentIndex + 1}
            </div>
            <div style={styles.stepText}>
              {step.instruction || step.description}
            </div>
          </div>

          {/* Navigation */}
          <div style={styles.nav}>
            <button
              className="carousel-nav-btn"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={isFirst}
              style={{
                ...styles.navBtn,
                background: isFirst ? '#e5e7eb' : '#059669',
                color: isFirst ? '#9ca3af' : 'white',
                cursor: isFirst ? 'not-allowed' : 'pointer',
                boxShadow: isFirst ? 'none' : '0 2px 8px rgba(5,150,105,0.2)',
              }}
            >
              ← Précédent
            </button>

            <div className="carousel-dots" style={styles.dots}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? 32 : 10,
                    height: 10,
                    borderRadius: 5,
                    background: i === currentIndex ? '#059669' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    padding: 0,
                  }}
                  aria-label={`Aller à l'étape ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="carousel-nav-btn"
              onClick={() => setCurrentIndex(Math.min(steps.length - 1, currentIndex + 1))}
              disabled={isLast}
              style={{
                ...styles.navBtn,
                background: isLast ? '#e5e7eb' : '#059669',
                color: isLast ? '#9ca3af' : 'white',
                cursor: isLast ? 'not-allowed' : 'pointer',
                boxShadow: isLast ? 'none' : '0 2px 8px rgba(5,150,105,0.2)',
              }}
            >
              Suivant →
            </button>
          </div>

          <div style={styles.counter}>
            Étape {currentIndex + 1} sur {steps.length}
          </div>
        </div>
      </div>

      {chefTips && (
        <div className="chef-tips">
          <h3>💡 Conseils du chef</h3>
          <p>{chefTips}</p>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .carousel-nav-btn {
            padding: 10px 16px !important;
            font-size: 0.85rem !important;
          }
          .carousel-card {
            padding: 18px !important;
            min-height: 100px !important;
          }
          .carousel-dots {
            gap: 4px !important;
          }
        }
        @media (max-width: 480px) {
          .carousel-nav-btn {
            padding: 8px 12px !important;
            font-size: 0.8rem !important;
            border-radius: 10px !important;
          }
          .carousel-card {
            padding: 14px !important;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  cookModeBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #1f2937, #111827)',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: 24,
    minHeight: 140,
    position: 'relative',
    border: '2px solid #f3f4f6',
  },
  stepNumber: {
    position: 'absolute',
    top: -20,
    left: 32,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1.2rem',
    boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
  },
  stepText: {
    marginTop: 16,
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: '#1f2937',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  navBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  dots: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  counter: {
    textAlign: 'center',
    marginTop: 12,
    color: '#6b7280',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
}
