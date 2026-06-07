'use client'

import { useState } from 'react'

/**
 * Carousel d'instructions pas-à-pas, V21 éditorial.
 * Extrait de recipes/[id]/page.js pour simplifier le JSX.
 */
export default function InstructionsCarousel({ steps, chefTips, onStartCookMode }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!steps || steps.length === 0) {
    return (
      <div className="instructions-section">
        <div className="v21-bh"><span className="v21-bl">Instructions</span></div>
        <p className="ic-empty">Instructions non disponibles</p>
      </div>
    )
  }

  const step = steps[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === steps.length - 1

  return (
    <div className="instructions-section">
      <div className="v21-bh">
        <span className="v21-bl">Instructions</span>
        {onStartCookMode && (
          <button onClick={onStartCookMode} className="v21-btn sm">
            Commencer la cuisine
          </button>
        )}
      </div>

      <div className="ic-carousel">
        <div className="ic-card">
          <span className="ic-step-num">{step.step_no || currentIndex + 1}</span>
          <p className="ic-step-text">{step.instruction || step.description}</p>
        </div>

        <div className="ic-nav">
          <button
            className="v21-btn ghost sm"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={isFirst}
          >
            ← Précédent
          </button>

          <div className="ic-dots">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`ic-dot${i === currentIndex ? ' on' : ''}`}
                aria-label={`Aller à l'étape ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="v21-btn ghost sm"
            onClick={() => setCurrentIndex(Math.min(steps.length - 1, currentIndex + 1))}
            disabled={isLast}
          >
            Suivant →
          </button>
        </div>

        <div className="ic-counter">Étape {currentIndex + 1} sur {steps.length}</div>
      </div>

      {chefTips && (
        <div className="ic-tips">
          <span className="v21-bl">Conseils du chef</span>
          <p>{chefTips}</p>
        </div>
      )}
    </div>
  )
}
