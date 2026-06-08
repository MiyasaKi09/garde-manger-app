'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, RefreshCw, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'

/**
 * Mode cuisine immersif plein écran.
 * Fond sombre, étapes une par une, timers intégrés, navigation simple.
 * Inspiré du mode cuisine de Claude.
 */
export default function CookMode({ open, onClose, recipe, steps, ingredients, recipeId, onRate, mealEntries, onRegenerated }) {
  // -1 = landing, 0+ = step index, 'done' = finished
  const [currentStep, setCurrentStep] = useState(-1)
  const [rating, setRating] = useState(0)
  const isLanding = currentStep === -1

  // Régénération de la recette via la routine Claude (écriture Supabase côté routine)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenDir, setRegenDir] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState('')
  const [regenDone, setRegenDone] = useState(false)

  useEffect(() => {
    if (open) {
      setCurrentStep(-1)
      setRating(0)
      setRegenOpen(false)
      setRegenDir('')
      setRegenError('')
      setRegenDone(false)
      setRegenLoading(false)
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

  // Rendu via portail sur <body> pour couvrir TOUTE la page (sinon un ancêtre
  // avec transform/animation piège le position:fixed et limite l'overlay).
  const portalTarget = typeof document !== 'undefined' ? document.body : null
  const portal = (node) => (portalTarget ? createPortal(node, portalTarget) : node)

  const recipeName = recipe.title || recipe.name
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)

  async function handleRegenerate() {
    if (regenLoading) return
    setRegenLoading(true)
    setRegenError('')
    try {
      const res = await authFetch('/api/routine/regenerate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId || undefined,
          recipe_name: recipeId ? undefined : recipeName,
          direction: regenDir || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la régénération')
      setRegenDone(true)
      onRegenerated?.()
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setRegenLoading(false)
    }
  }

  const responsiveStyles = (
    <style jsx global>{`
      /* ── CookMode Landing ── */
      .cook-landing-scroll {
        flex: 1; display: flex; flex-direction: column;
        padding: 32px 20px; overflow-y: auto;
        scrollbar-width: none;
      }
      .cook-landing-scroll::-webkit-scrollbar { display: none; }
      .cook-landing-card {
        background: var(--surface);
        border-radius: 28px;
        box-shadow: 0 32px 80px rgba(24,28,22,0.35), 0 4px 16px rgba(24,28,22,0.15);
        padding: 40px 36px;
        width: 100%; max-width: 560px;
        margin: auto; /* centre quand ça tient, sans couper le haut quand c'est grand */
        position: relative;
      }
      .cook-landing-card::-webkit-scrollbar { width: 4px; }
      .cook-landing-card::-webkit-scrollbar-track { background: transparent; }
      .cook-landing-card::-webkit-scrollbar-thumb { background: rgba(24,28,22,0.15); border-radius: 4px; }
      .cook-landing-close {
        position: absolute; top: 18px; right: 18px;
        border: none; background: rgba(24,28,22,0.06); color: var(--ink-3);
        cursor: pointer; padding: 8px; display: flex; border-radius: 50%;
        transition: background 0.15s;
      }
      .cook-landing-close:hover { background: rgba(24,28,22,0.12); }
      .cook-landing-title {
        font-family: var(--font-display);
        font-size: 30px; font-weight: 700;
        color: var(--ink-1); line-height: 1.15;
        letter-spacing: -0.02em; margin-bottom: 12px;
        padding-right: 40px;
      }
      .cook-landing-accent {
        width: 36px; height: 3px; background: var(--brand);
        border-radius: 2px; margin-bottom: 14px;
      }
      .cook-landing-desc {
        font-family: var(--font-editorial);
        font-size: 17px; color: var(--ink-2); line-height: 1.6;
        font-style: italic; margin-bottom: 16px;
      }
      .cook-meta-pill {
        display: inline-flex; align-items: center; gap: 6px;
        background: var(--brand-soft); color: var(--brand);
        border-radius: 999px; padding: 5px 14px;
        font-size: 13px; font-weight: 600; margin-bottom: 28px;
      }
      .cook-meta-sep { opacity: 0.5; }
      .cook-section-label {
        font-size: 10px; font-weight: 700; letter-spacing: 2px;
        color: var(--ink-3); text-transform: uppercase;
        border-left: 2px solid var(--brand); padding-left: 8px;
        margin-bottom: 14px; display: block;
      }
      .cook-nutrition-block {
        background: var(--paper); border-radius: 18px;
        padding: 20px 22px; margin-bottom: 20px; text-align: left;
      }
      .cook-persons-grid { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
      .cook-person-card {
        flex: 1; min-width: 170px;
        background: var(--surface); border-radius: 14px;
        padding: 14px 16px; border: 1px solid rgba(24,28,22,0.07);
        box-shadow: 0 1px 4px rgba(24,28,22,0.04);
      }
      .cook-person-name {
        display: inline-block; font-size: 11px; font-weight: 700;
        color: var(--brand); background: var(--brand-soft);
        padding: 3px 10px; border-radius: 6px;
        text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 12px;
      }
      .cook-macros-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .cook-macro-value { font-size: 20px; font-weight: 700; color: var(--ink-1); font-variant-numeric: tabular-nums; }
      .cook-ingredients-block {
        background: var(--paper); border-radius: 18px;
        padding: 20px 22px; margin-bottom: 28px; text-align: left;
      }
      .cook-ing-item {
        display: flex; align-items: baseline; gap: 8px;
        font-size: 14px; color: var(--ink-2); padding: 5px 0;
        border-bottom: 1px solid rgba(24,28,22,0.06);
      }
      .cook-ing-item:last-child { border-bottom: none; }
      .cook-ing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sprout); flex-shrink: 0; margin-top: 6px; }
      .cook-ing-qty { font-weight: 700; color: var(--ink-1); white-space: nowrap; }
      .cook-start-btn {
        width: 100%; padding: 17px; border: none; border-radius: 999px;
        background: var(--brand); color: white;
        font-size: 16px; font-weight: 700; cursor: pointer;
        font-family: inherit; letter-spacing: 0.03em;
        box-shadow: 0 6px 24px rgba(47,93,58,0.3);
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .cook-start-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(47,93,58,0.38); }
      .cook-start-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      /* ── Step & timer ── */
      .cook-step-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; overflow-y: auto; }
      .cook-step-card { max-width: 560px; width: 100%; background: var(--paper); border: 1.5px solid var(--ink-1); border-radius: 3px; padding: 36px 32px; text-align: left; box-shadow: 0 18px 50px -20px rgba(24,28,22,0.3); }
      .cook-step-title { font-family: var(--font-display); font-size: 25px; font-weight: 600; color: var(--ink-1); margin-bottom: 14px; line-height: 1.25; letter-spacing: -0.01em; }
      .cook-step-text { font-family: var(--font-text); font-size: 16px; line-height: 1.7; color: var(--ink-2); margin: 0; }
      .cook-timer-text { font-family: var(--font-display); font-size: 52px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; color: var(--ink-1); }
      .cook-footer { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 24px 28px; flex-shrink: 0; }

      @media (max-width: 768px) {
        .cook-landing-scroll { padding: 20px 12px 40px; }
        .cook-landing-card { padding: 28px 22px; border-radius: 22px; }
        .cook-landing-title { font-size: 24px; }
        .cook-persons-grid { flex-direction: column; }
        .cook-person-card { min-width: 0; }
        .cook-macro-value { font-size: 18px; }
        .cook-step-content { padding: 16px; }
        .cook-step-card { padding: 26px 20px; border-radius: 3px; }
        .cook-step-title { font-size: 22px; }
        .cook-step-text { font-size: 15px; }
        .cook-timer-text { font-size: 36px; }
        .cook-footer { padding: 12px 16px 20px; gap: 12px; }
      }

      @media (max-width: 480px) {
        .cook-landing-card { padding: 24px 16px; border-radius: 18px; }
        .cook-landing-title { font-size: 22px; }
        .cook-timer-text { font-size: 32px; }
        .cook-footer { padding: 10px 12px 16px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .cook-start-btn { transition: none; }
      }
    `}</style>
  )

  const cmStyles = (
    <style jsx global>{`
      .cm-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(24,28,22,0.5); display: flex; align-items: center; justify-content: center; padding: 24px; font-family: var(--font-text); }
      .cm-modal { position: relative; width: 680px; max-width: 100%; max-height: 92vh; background: var(--paper); border: 1.5px solid var(--ink-1); border-radius: 3px; box-shadow: 0 18px 50px -18px rgba(24,28,22,0.45), 0 4px 14px -8px rgba(24,28,22,0.3); display: flex; flex-direction: column; overflow: hidden; }
      .cm-x { position: absolute; top: 13px; right: 13px; z-index: 3; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--paper); border: 1px solid var(--ink-1); border-radius: 3px; font-family: var(--font-mono); font-size: 16px; line-height: 1; color: var(--ink-1); cursor: pointer; transition: background .12s, color .12s; }
      .cm-x:hover { background: var(--ink-1); color: var(--paper); }
      .cm-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
      .cm-head { padding: 16px 30px 14px; border-bottom: 1px solid var(--ink-1); }
      .cm-eyebrow { display: inline-block; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; background: var(--terracotta); color: #fff; padding: 4px 9px; border-radius: 3px; }
      .cm-title { font-family: var(--font-display); font-weight: 600; font-size: clamp(21px,3.1vw,26px); line-height: 1.04; letter-spacing: -.02em; margin: 10px 0 0; max-width: 580px; color: var(--ink-1); padding-right: 36px; }
      .cm-rule { height: 3px; width: 80px; background: var(--terracotta); margin: 11px 0 0; }
      .cm-desc { font-family: var(--font-editorial); font-style: italic; font-size: 14px; line-height: 1.34; color: var(--ink-2); margin-top: 8px; max-width: 580px; }
      .cm-meta { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .03em; color: var(--ink-3); text-transform: uppercase; margin-top: 8px; }
      .cm-seclabel { display: inline-block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; background: var(--ink-1); color: var(--paper); padding: 4px 9px; border-radius: 3px; }
      .cm-persona { border-bottom: 1px solid var(--ink-1); }
      .cm-persona-head { padding: 11px 30px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .cm-same { font-family: var(--font-mono); font-size: 10px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); }
      .cm-split { display: grid; margin-top: 7px; }
      .cm-col { padding: 10px 30px; position: relative; }
      .cm-col + .cm-col { border-left: 1px solid var(--ink-1); }
      .cm-who { display: inline-block; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; background: var(--ink-1); color: var(--paper); padding: 4px 10px; border-radius: 3px; }
      .cm-kcal { font-family: var(--font-display); font-weight: 600; font-size: clamp(36px,5.4vw,46px); line-height: .86; letter-spacing: -.03em; margin-top: 8px; color: var(--ink-1); }
      .cm-kcal .cm-u { font-family: var(--font-mono); font-weight: 500; font-size: 12px; letter-spacing: .04em; color: var(--ink-3); margin-left: 6px; vertical-align: 5px; text-transform: uppercase; }
      .cm-macros { margin-top: 8px; border-top: 1px solid var(--line); }
      .cm-macro { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px solid var(--line); }
      .cm-ml { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); }
      .cm-mv { font-family: var(--font-mono); font-weight: 600; font-size: 13px; color: var(--ink-1); }
      .cm-tick { height: 3px; width: 42px; margin-top: 8px; }
      .cm-col.j .cm-tick { background: var(--terracotta); }
      .cm-col.z .cm-tick { background: var(--olive); }
      .cm-sec { padding: 12px 30px 13px; }
      .cm-sh { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .cm-count { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .03em; color: var(--ink-3); text-transform: uppercase; }
      .cm-ingt { width: 100%; border-collapse: collapse; }
      .cm-ingt thead th { font-family: var(--font-mono); font-size: 9.5px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); text-align: right; padding: 0 0 6px; border-bottom: 1px solid var(--ink-1); }
      .cm-ingt thead th.cm-h-n { text-align: left; }
      .cm-ingt tbody td { padding: 3px 0; border-bottom: 1px solid var(--line); vertical-align: baseline; }
      .cm-ingt tbody tr:last-child td { border-bottom: none; }
      .cm-n { font-family: var(--font-display); font-weight: 500; font-size: 13.5px; line-height: 1.05; color: var(--ink-1); text-align: left; padding-right: 12px; }
      .cm-q { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; color: var(--ink-1); text-align: right; width: 74px; white-space: nowrap; }
      .cm-q.z { color: var(--ink-2); }
      .cm-q.common { color: var(--ink-3); text-align: right; }
      .cm-foot { padding: 11px 30px; border-top: 1px solid var(--ink-1); display: flex; gap: 12px; align-items: center; background: var(--paper); flex-wrap: wrap; }
      .cm-btn { font-family: var(--font-mono); font-size: 12.5px; letter-spacing: .04em; text-transform: uppercase; border-radius: 3px; padding: 11px 22px; cursor: pointer; border: 1px solid transparent; transition: filter .12s, background .12s, color .12s; }
      .cm-btn-primary { background: var(--terracotta); color: #fff; font-weight: 600; border-color: var(--terracotta); display: flex; align-items: center; justify-content: center; gap: 8px; }
      .cm-btn-primary:hover { filter: brightness(.94); }
      .cm-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
      .cm-cook { flex: 1; }
      .cm-btn-ghost { background: transparent; color: var(--ink-2); border-color: var(--ink-1); }
      .cm-btn-ghost:hover { background: var(--ink-1); color: var(--paper); border-color: var(--ink-1); }
      .cm-regen-row { flex: 1; display: flex; gap: 8px; align-items: center; min-width: 0; }
      .cm-regen-input { flex: 1; min-width: 0; font-family: var(--font-text); font-size: 13px; color: var(--ink-1); background: var(--surface); border: 1px solid var(--line-strong); border-radius: 3px; padding: 10px 12px; outline: none; }
      .cm-regen-input:focus { border-color: var(--terracotta); }
      .cm-regen-done { font-family: var(--font-mono); font-size: 12px; color: var(--brand); margin: 0; }
      .cm-regen-error { font-family: var(--font-mono); font-size: 11px; color: var(--state-expired, #8A3A20); margin: 6px 0 0; width: 100%; }
      @media (max-width: 720px) {
        .cm-backdrop { padding: 0; align-items: stretch; }
        .cm-modal { width: 100%; max-width: 100%; max-height: 100vh; height: 100vh; border: none; border-radius: 0; }
        .cm-head, .cm-sec, .cm-persona-head, .cm-col, .cm-foot { padding-left: 20px; padding-right: 20px; }
      }
      @media (max-width: 430px) {
        .cm-split { grid-template-columns: 1fr !important; }
        .cm-col + .cm-col { border-left: none; border-top: 1px solid var(--ink-1); }
      }
    `}</style>
  )

  // ---- LANDING SCREEN (V21) ----
  if (currentStep === -1) {
    const persons = mealEntries || []
    const totalKcal = persons.reduce((s, p) => s + (Number(p.kcal) || 0), 0)
    const parseQty = (q) => parseFloat(String(q ?? '').replace(',', '.'))
    const isScalable = (ing) => persons.length >= 2 && totalKcal > 0 && !isNaN(parseQty(ing.quantity))
    const scaledQty = (ing, p) => {
      const num = parseQty(ing.quantity)
      const share = totalKcal ? (Number(p.kcal) || 0) / totalKcal : 1 / Math.max(persons.length, 1)
      const v = num * share
      const r = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10
      return `${r}${ing.unit ? ' ' + ing.unit : ''}`
    }
    const nps = recipe?.nutrition_per_serving

    return portal(
      <div className="cm-backdrop">
        {cmStyles}
        <div className="cm-modal" role="dialog" aria-modal="true">
          <button onClick={onClose} className="cm-x" aria-label="Fermer">×</button>
          <div className="cm-body">
            <header className="cm-head">
              <span className="cm-eyebrow">{persons.length ? 'Du planning' : 'Recette'}</span>
              <h1 className="cm-title">{recipeName}</h1>
              <div className="cm-rule" />
              {recipe.description && <p className="cm-desc">{recipe.description}</p>}
              {(steps?.length > 0 || totalTime > 0) && (
                <div className="cm-meta">
                  {steps?.length > 0 ? `${steps.length} étape${steps.length > 1 ? 's' : ''}` : ''}
                  {steps?.length > 0 && totalTime > 0 ? ' · ' : ''}
                  {totalTime > 0 ? `${totalTime} min` : ''}
                </div>
              )}
            </header>

            {persons.length > 0 ? (
              <section className="cm-persona">
                <div className="cm-persona-head">
                  <span className="cm-seclabel">Nutrition par personne</span>
                  <span className="cm-same">Même plat · {persons.length} portion{persons.length > 1 ? 's' : ''}</span>
                </div>
                <div className="cm-split" style={{ gridTemplateColumns: `repeat(${persons.length}, 1fr)` }}>
                  {persons.map((p, i) => (
                    <div key={i} className={`cm-col ${i % 2 === 0 ? 'j' : 'z'}`}>
                      <span className="cm-who">{p.person_name || '?'}</span>
                      <div className="cm-tick" />
                      <div className="cm-kcal">{Math.round(p.kcal || 0)}<span className="cm-u">kcal</span></div>
                      <div className="cm-macros">
                        <div className="cm-macro"><span className="cm-ml">Protéines</span><span className="cm-mv">{Math.round(p.protein_g || 0)} g</span></div>
                        <div className="cm-macro"><span className="cm-ml">Glucides</span><span className="cm-mv">{Math.round(p.carbs_g || 0)} g</span></div>
                        <div className="cm-macro"><span className="cm-ml">Lipides</span><span className="cm-mv">{Math.round(p.fat_g || 0)} g</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : nps ? (
              <section className="cm-persona">
                <div className="cm-persona-head"><span className="cm-seclabel">Nutrition par portion</span></div>
                <div className="cm-split" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="cm-col j">
                    <div className="cm-kcal">{nps.kcal ?? '—'}<span className="cm-u">kcal</span></div>
                    <div className="cm-macros">
                      <div className="cm-macro"><span className="cm-ml">Protéines</span><span className="cm-mv">{nps.protein_g ?? '—'} g</span></div>
                      <div className="cm-macro"><span className="cm-ml">Glucides</span><span className="cm-mv">{nps.carbs_g ?? '—'} g</span></div>
                      <div className="cm-macro"><span className="cm-ml">Lipides</span><span className="cm-mv">{nps.fat_g ?? '—'} g</span></div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {ingredients?.length > 0 && (
              <section className="cm-sec">
                <div className="cm-sh">
                  <span className="cm-seclabel">{persons.length >= 2 ? 'Ingrédients · par personne' : 'Ingrédients'}</span>
                  <span className="cm-count">{ingredients.length} produit{ingredients.length > 1 ? 's' : ''}</span>
                </div>
                <table className="cm-ingt">
                  {persons.length >= 2 && (
                    <thead><tr><th className="cm-h-n">Ingrédient</th>{persons.map((p, i) => <th key={i}>{p.person_name}</th>)}</tr></thead>
                  )}
                  <tbody>
                    {ingredients.map((ing, i) => (
                      <tr key={i}>
                        <td className="cm-n">{ing.name}</td>
                        {persons.length >= 2 ? (
                          isScalable(ing)
                            ? persons.map((p, j) => <td key={j} className={`cm-q${j > 0 ? ' z' : ''}`}>{scaledQty(ing, p)}</td>)
                            : <td className="cm-q common" colSpan={persons.length}>{ing.quantity ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}` : 'au goût'}{ing.notes ? ` · ${ing.notes}` : ''}</td>
                        ) : (
                          <td className="cm-q">{ing.quantity ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}` : 'au goût'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>

          <footer className="cm-foot">
            {regenDone ? (
              <p className="cm-regen-done">Recette régénérée — ferme et relance la cuisine pour la voir.</p>
            ) : regenOpen ? (
              <div className="cm-regen-row">
                <input
                  type="text"
                  value={regenDir}
                  onChange={e => setRegenDir(e.target.value)}
                  placeholder="Ex : plus light, moins de beurre… (optionnel)"
                  className="cm-regen-input"
                  onKeyDown={e => e.key === 'Enter' && handleRegenerate()}
                  disabled={regenLoading}
                  autoFocus
                />
                <button onClick={handleRegenerate} disabled={regenLoading} className="cm-btn cm-btn-primary">
                  {regenLoading ? <><Loader2 size={14} style={{ animation: 'cm-spin 1s linear infinite' }} /> …</> : 'Régénérer'}
                </button>
                {!regenLoading && <button onClick={() => setRegenOpen(false)} className="cm-btn cm-btn-ghost">Annuler</button>}
                <style jsx global>{`@keyframes cm-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : (
              <>
                <button onClick={() => setCurrentStep(0)} disabled={!steps?.length} className="cm-btn cm-btn-primary cm-cook">✦ Cuisiner</button>
                <button onClick={() => setRegenOpen(true)} className="cm-btn cm-btn-ghost">Changer le plat</button>
              </>
            )}
            {regenError && <p className="cm-regen-error">{regenError}</p>}
          </footer>
        </div>
      </div>
    )
  }

  // ---- DONE SCREEN (rating) ----
  if (currentStep === 'done') {
    return portal(
      <div style={S.overlay}>
        {responsiveStyles}
        <div className="cook-step-content">
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍🍳</div>
            <h2 style={{ ...S.stepTitle, marginBottom: 8 }}>Bon appétit !</h2>
            <p style={{ color: 'var(--ink-3)', marginBottom: 32 }}>
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
                    color: 'var(--terracotta)',
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
              style={S.primaryBtn}
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

  return portal(
    <div style={S.overlay}>
      {/* Header */}
      <div style={S.header}>
        <span style={S.headerTitle}>{recipeName}</span>
        <button onClick={onClose} style={S.closeBtn}><X size={24} /></button>
      </div>

      {responsiveStyles}

      {/* Step content */}
      <div className="cook-step-content">
        <div className="cook-step-card">
          <div style={S.stepBadge}>Étape {currentStep + 1}/{steps.length}</div>
          {stepTitle && (
            <h2 className="cook-step-title">{stepTitle}</h2>
          )}
          <p className="cook-step-text">{stepBody || fullText}</p>

          {/* Timer */}
          {timerMinutes > 0 && (
            <Timer minutes={timerMinutes} key={`timer-${currentStep}-${timerMinutes}`} />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="cook-footer">
        <button
          onClick={() => setCurrentStep(s => Math.max(-1, s - 1))}
          style={S.navBtn}
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => setCurrentStep(s => isLast ? 'done' : Math.min(steps.length - 1, s + 1))}
          style={S.navBtnPrimary}
        >
          {isLast ? 'Terminer' : 'Suivant'}
          <ChevronRight size={18} />
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
    <div style={S.timerContainer}>
      <div style={S.timerDisplay}>
        <span className="cook-timer-text" style={{
          color: remaining === 0 ? 'var(--state-expired)' : 'var(--ink, var(--ink-1))',
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span style={S.timerLabel}>{minutes} minutes</span>
      </div>

      <div style={S.timerActions}>
        {remaining === 0 ? (
          <button onClick={reset} style={S.timerBtn}>
            <RotateCcw size={18} />
            <span>Relancer</span>
          </button>
        ) : (
          <button
            onClick={() => setRunning(!running)}
            style={{
              ...S.timerBtn,
              background: running ? 'transparent' : 'var(--terracotta)',
              color: running ? 'var(--ink-1)' : '#fff',
              borderColor: running ? 'var(--ink-1)' : 'var(--terracotta)',
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            <span>{running ? 'Pause' : 'Démarrer'}</span>
          </button>
        )}
      </div>

      {/* Progress ring */}
      {running && (
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
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

// Landing screen uses `styles.xxx`, steps/done use `S.xxx`
const styles = {
  landingOverlay: { position: 'fixed', inset: 0, background: 'rgba(24,28,22,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' },

  // Nutrition section (inline styles still used for these)
  macroItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  macroLabel: { fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 },
  macroDivider: { width: 1, height: 24, background: 'rgba(24,28,22,0.1)', flexShrink: 0 },
  personPortions: { fontSize: 12, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.4, textAlign: 'center' },
  nutritionBadge: { fontSize: 10, color: 'var(--brand)', fontWeight: 600, textAlign: 'right', marginTop: 10, letterSpacing: 0.3, opacity: 0.7 },

  // Régénérer
  regenWrap: { marginTop: 16, display: 'flex', justifyContent: 'center' },
  regenToggle: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', background: 'none', color: 'var(--ink-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  regenPanel: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 },
  regenInput: { width: '100%', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', boxSizing: 'border-box' },
  regenConfirm: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, var(--brand), var(--brand))', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  regenError: { color: 'var(--state-expired)', fontSize: 12, margin: 0, textAlign: 'center' },
  regenCancel: { background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0' },
  regenDoneText: { fontSize: 13, color: 'var(--brand)', fontWeight: 600, textAlign: 'center', margin: 0, lineHeight: 1.5, maxWidth: 360 },
}

// Steps + Done screens — V21 editorial
const S = {
  overlay: { position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 2000, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-text)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', flexShrink: 0, borderBottom: '1px solid var(--ink-1)' },
  headerTitle: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--ink-1)', letterSpacing: '-0.01em' },
  closeBtn: { border: '1px solid var(--ink-1)', background: 'transparent', color: 'var(--ink-1)', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 3 },
  content: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' },
  stepCard: { maxWidth: 560, width: '100%', background: 'var(--paper)', border: '1.5px solid var(--ink-1)', borderRadius: 3, padding: '36px 32px', boxShadow: '0 18px 50px -20px rgba(24,28,22,0.3)' },
  stepBadge: { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--paper)', background: 'var(--ink-1)', padding: '4px 10px', borderRadius: 3, display: 'inline-block', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.08em' },
  stepTitle: { fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 14, lineHeight: 1.25, letterSpacing: '-0.01em' },
  stepText: { fontFamily: 'var(--font-text)', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '16px 24px 28px', flexShrink: 0 },
  navBtn: { border: '1px solid var(--ink-1)', background: 'transparent', color: 'var(--ink-1)', cursor: 'pointer', padding: 12, display: 'flex', alignItems: 'center', borderRadius: 3 },
  navBtnPrimary: { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', border: '1px solid var(--terracotta)', borderRadius: 3, background: 'var(--terracotta)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' },
  primaryBtn: { padding: '14px 40px', border: '1px solid var(--terracotta)', borderRadius: 3, background: 'var(--terracotta)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' },

  // Timer — V21
  timerContainer: { marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 24, borderTop: '1px solid var(--line)' },
  timerDisplay: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  timerText: { fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em', color: 'var(--ink-1)' },
  timerLabel: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  timerActions: { display: 'flex', gap: 12 },
  timerBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', border: '1px solid var(--ink-1)', borderRadius: 3, background: 'transparent', color: 'var(--ink-1)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' },
  progressBar: { width: 220, height: 3, borderRadius: 0, background: 'var(--line)', overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', background: 'var(--terracotta)', borderRadius: 0, transition: 'width 1s linear' },
}
