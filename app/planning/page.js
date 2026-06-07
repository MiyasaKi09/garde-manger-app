'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, X } from 'lucide-react'
import WeeklyPlanView from './components/WeeklyPlanView'
import DailyNutritionRecap from './components/DailyNutritionRecap'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importsLoaded, setImportsLoaded] = useState(false)
  const [imports, setImports] = useState([])

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (user) loadImports() }, [user])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
    } catch (error) {
      console.error('Erreur auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadImports() {
    try {
      const res = await authFetch('/api/planning/imports')
      const data = await res.json()
      if (data.imports) setImports(data.imports)
    } catch (err) {
      console.error('Erreur chargement imports:', err)
    } finally {
      setImportsLoaded(true)
    }
  }

  async function handleDelete(importId, e) {
    e.stopPropagation()
    if (!confirm('Supprimer ce plan importé ?')) return
    try {
      await authFetch(`/api/planning/imports/${importId}`, { method: 'DELETE' })
      setImports(prev => prev.filter(i => i.id !== importId))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const latestImport = imports[0] || null
  const planningReady = !loading && importsLoaded

  // ── Régénération ──
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenMode, setRegenMode] = useState('week') // 'week' | 'days'
  const [regenDays, setRegenDays] = useState([])
  const [regenStatus, setRegenStatus] = useState('idle') // idle | submitting | waiting | done | error
  const [regenError, setRegenError] = useState('')
  const [regenMeals, setRegenMeals] = useState([]) // [{date, type}]
  const [regenInstructions, setRegenInstructions] = useState('')

  const weekDaysFromImport = latestImport ? (() => {
    const days = []
    const start = new Date(latestImport.date_range_start)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  })() : []

  const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  function toggleRegenDay(iso) {
    setRegenDays(prev => prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort())
  }

  function toggleRegenMeal(date, type) {
    setRegenMeals(prev => {
      const exists = prev.find(m => m.date === date && m.type === type)
      if (exists) return prev.filter(m => !(m.date === date && m.type === type))
      return [...prev, { date, type }]
    })
  }

  async function submitRegen() {
    if (!latestImport) return
    if (regenMode === 'days' && !regenDays.length) return
    if (regenMode === 'meals' && !regenMeals.length) return
    setRegenStatus('submitting')
    setRegenError('')

    const targetStart = latestImport.date_range_start
    const targetEnd = latestImport.date_range_end

    try {
      const res = await authFetch('/api/routine/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId: latestImport.id,
          targetStart,
          targetEnd,
          days: regenMode === 'days' ? regenDays : null,
          meals: regenMode === 'meals' ? regenMeals : null,
          instructions: regenInstructions.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || `Erreur (${res.status})`)
      }
      setRegenStatus('waiting')

      // Poll plan_regen_requests jusqu'à status='done'
      const MAX_WAIT = 6 * 60 * 1000
      const POLL = 8000
      const deadline = Date.now() + MAX_WAIT
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, POLL))
        const { data: rows } = await supabase
          .from('plan_regen_requests')
          .select('status')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
        const latest = rows?.[0]
        if (latest?.status === 'done') {
          setRegenStatus('done')
          setRegenOpen(false)
          await loadImports()
          return
        }
        if (latest?.status === 'error') {
          throw new Error('La routine a rencontré une erreur. Réessaie.')
        }
      }
      setRegenStatus('done')
      setRegenOpen(false)
      await loadImports()
    } catch (err) {
      setRegenStatus('error')
      setRegenError(err.message)
    }
  }

  return (
    <>
      <div className="v21-page wide">
        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning · réseau mycorhizien</span>
            <h1 className="v21-title">Vos repas de la semaine.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Planifiez, cuisinez, savourez — avec l'aide de Myko.</p>
          </div>
          <div className="v21-hero-side">
            <button className="v21-btn" onClick={() => router.push('/planning/assistant')}>
              <Sparkles size={15} /> Demander à Myko
            </button>
            {planningReady && imports.length > 0 && (
              <button className="v21-btn ghost" onClick={() => { setRegenOpen(true); setRegenStatus('idle'); setRegenDays([]); setRegenMeals([]); setRegenInstructions(''); setRegenMode('week') }}>
                <RefreshCw size={14} /> Modifier
              </button>
            )}
          </div>
        </header>

        {/* ═══ CONTENU : un seul état de chargement, pas de flash ═══ */}
        {!planningReady ? (
          <section className="v21-section flush" aria-busy="true" aria-label="Chargement du planning">
            <div className="v21-skel" style={{ height: 44, marginBottom: 18 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)' }}>
              {Array.from({ length: 7 }).map((_, i) => <div key={i} className="v21-skel" style={{ height: 180, borderRadius: 0 }} />)}
            </div>
          </section>
        ) : imports.length === 0 ? (
          <section className="v21-section flush">
            <div className="v21-empty">
              <p>Aucun plan encore. Demande à Myko de créer un planning ou importe un fichier .xlsx.</p>
              <button className="v21-btn" onClick={() => router.push('/planning/assistant')}>
                <Sparkles size={15} /> Créer un planning avec l'IA
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="v21-section">
              <div className="v21-bh"><span className="v21-bl">Semaine</span></div>
              <WeeklyPlanView imports={imports} />
            </section>

            <section className="v21-section flush">
              <div className="v21-bh"><span className="v21-bl">Nutrition — jour par jour</span></div>
              <DailyNutritionRecap importId={latestImport.id} />
            </section>
          </>
        )}
      </div>

      {/* ═══ MODAL RÉGÉNÉRATION ═══ */}
      {regenOpen && (
        <div className="regen-overlay" onClick={() => regenStatus === 'idle' || regenStatus === 'error' ? setRegenOpen(false) : null}>
          <div className="regen-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="regen-header">
              <span className="v21-bl">Modifier le planning</span>
              {(regenStatus === 'idle' || regenStatus === 'error') && (
                <button className="regen-close" onClick={() => setRegenOpen(false)}><X size={18} /></button>
              )}
            </div>

            {regenStatus === 'idle' || regenStatus === 'error' ? (<>
              {/* Mode selector */}
              <div className="v21-tabs regen-modes">
                <button
                  className={`v21-tab${regenMode === 'week' ? ' on' : ''}`}
                  onClick={() => setRegenMode('week')}
                >
                  Semaine entière
                </button>
                <button
                  className={`v21-tab${regenMode === 'days' ? ' on' : ''}`}
                  onClick={() => setRegenMode('days')}
                >
                  Jours précis
                </button>
                <button
                  className={`v21-tab${regenMode === 'meals' ? ' on' : ''}`}
                  onClick={() => setRegenMode('meals')}
                >
                  Un repas
                </button>
              </div>

              {/* Day picker */}
              {regenMode === 'days' && (
                <div className="regen-days-grid">
                  {weekDaysFromImport.map((d, i) => {
                    const iso = d.toISOString().split('T')[0]
                    const sel = regenDays.includes(iso)
                    return (
                      <button
                        key={iso}
                        onClick={() => toggleRegenDay(iso)}
                        className={`regen-day-btn${sel ? ' active' : ''}`}
                      >
                        <span className="regen-day-name">{DAY_LABELS_SHORT[i]}</span>
                        <span className="regen-day-num">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Meal picker */}
              {regenMode === 'meals' && (
                <div className="regen-meals-list">
                  {weekDaysFromImport.map((d, i) => {
                    const iso = d.toISOString().split('T')[0]
                    const midiSel = regenMeals.some(m => m.date === iso && m.type === 'dejeuner')
                    const soirSel = regenMeals.some(m => m.date === iso && m.type === 'diner')
                    return (
                      <div key={iso} className="regen-meal-row">
                        <span className="regen-meal-day">
                          <span className="regen-meal-day-name">{DAY_LABELS_SHORT[i]}</span>
                          <span className="regen-meal-day-num">{d.getDate()}</span>
                        </span>
                        <button onClick={() => toggleRegenMeal(iso, 'dejeuner')} className={`regen-meal-btn${midiSel ? ' active' : ''}`}>Midi</button>
                        <button onClick={() => toggleRegenMeal(iso, 'diner')} className={`regen-meal-btn${soirSel ? ' active' : ''}`}>Soir</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {regenStatus === 'error' && <p className="regen-error">{regenError}</p>}

              {/* Instructions libres */}
              <div className="regen-instructions-wrap">
                <textarea
                  className="regen-instructions"
                  placeholder="Instructions pour Myko (optionnel) — ex : cuisine inspirée nikkei pour jeudi midi, végétarien vendredi soir…"
                  value={regenInstructions}
                  onChange={e => setRegenInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <button
                className="v21-btn terra regen-submit"
                onClick={submitRegen}
                disabled={(regenMode === 'days' && !regenDays.length) || (regenMode === 'meals' && !regenMeals.length)}
              >
                <RefreshCw size={16} />
                {regenMode === 'week'
                  ? 'Régénérer la semaine entière'
                  : regenMode === 'days'
                    ? regenDays.length ? `Régénérer ${regenDays.length} jour${regenDays.length > 1 ? 's' : ''}` : 'Sélectionne des jours'
                    : regenMeals.length ? `Régénérer ${regenMeals.length} repas` : 'Sélectionne des repas'}
              </button>
              <p className="regen-note">Myko régénère en 2–4 min et écrit directement dans Supabase.</p>
            </>) : regenStatus === 'submitting' ? (
              <div className="regen-waiting">
                <div className="v21-skel" style={{ height: 10, width: '70%' }} />
                <p>Déclenchement de la routine…</p>
              </div>
            ) : regenStatus === 'waiting' ? (
              <div className="regen-waiting">
                <div className="v21-skel" style={{ height: 10, width: '85%' }} />
                <div className="v21-skel" style={{ height: 10, width: '60%' }} />
                <p>Myko régénère ton planning…</p>
                <p className="regen-note">Tu peux fermer cette fenêtre, le résultat apparaîtra automatiquement.</p>
                <button className="v21-btn ghost sm regen-cancel" onClick={() => setRegenOpen(false)}>Fermer et revenir plus tard</button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style jsx>{`
/* ── Modal régénération — V21 (papier, filets, rectangles) ── */
.regen-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(24, 28, 22, 0.52);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.regen-card {
  background: var(--paper);
  border: 1.5px solid var(--ink-1);
  border-radius: 3px;
  width: 100%; max-width: 460px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 18px;
}
.regen-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.regen-close {
  background: none; border: none; cursor: pointer;
  color: var(--ink-3); padding: 6px; border-radius: 3px; display: flex;
  transition: background 0.15s ease, color 0.15s ease;
}
.regen-close:hover { background: var(--surface-soft); color: var(--ink-1); }

/* Onglets de mode : réutilisent .v21-tabs/.v21-tab, mais en répartition égale */
.regen-modes { margin-top: 0; }
.regen-modes .v21-tab { flex: 1; text-align: center; }

.regen-days-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
}
.regen-day-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 3px; padding: 10px 0;
  border: 1px solid var(--line-strong);
  border-radius: 3px;
  background: transparent; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.regen-day-btn:hover { border-color: var(--ink-1); }
.regen-day-btn.active { background: var(--terracotta); border-color: var(--terracotta); }
.regen-day-name {
  font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-3);
}
.regen-day-btn.active .regen-day-name { color: #fff; }
.regen-day-num { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--ink-1); }
.regen-day-btn.active .regen-day-num { color: #fff; }

.regen-meals-list { display: flex; flex-direction: column; gap: 6px; }
.regen-meal-row { display: flex; align-items: center; gap: 10px; }
.regen-meal-day { display: flex; align-items: baseline; gap: 5px; width: 62px; flex-shrink: 0; }
.regen-meal-day-name {
  font-family: var(--font-mono);
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-3);
}
.regen-meal-day-num { font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--ink-1); }
.regen-meal-btn {
  flex: 1; padding: 9px 0;
  border: 1px solid var(--line-strong); border-radius: 3px;
  background: transparent; cursor: pointer;
  font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em;
  color: var(--ink-2); transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.regen-meal-btn:hover { border-color: var(--ink-1); color: var(--ink-1); }
.regen-meal-btn.active { background: var(--terracotta); border-color: var(--terracotta); color: #fff; }

.regen-error {
  font-family: var(--font-text); font-size: 13px; color: var(--state-expired);
  background: var(--state-expired-bg);
  border: 1px solid var(--state-expired);
  border-radius: 3px; padding: 10px 14px; margin: 0; line-height: 1.45;
}

.regen-submit { width: 100%; }
.regen-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.regen-note {
  font-family: var(--font-mono); font-size: 11px; color: var(--ink-3);
  text-align: center; margin: -6px 0 0; line-height: 1.5;
}

.regen-waiting {
  display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0 4px;
}
.regen-waiting .v21-skel { width: 100%; }
.regen-waiting p {
  font-family: var(--font-text); font-size: 14px; font-weight: 600; color: var(--ink-1);
  margin: 0; text-align: center;
}
.regen-cancel { margin-top: 4px; }

.regen-instructions-wrap { width: 100%; }
.regen-instructions {
  width: 100%; box-sizing: border-box; padding: 10px 13px;
  border: 1px solid var(--line-strong); border-radius: 3px;
  background: var(--surface);
  font-family: var(--font-text); font-size: 14px; color: var(--ink-1); line-height: 1.5;
  resize: vertical; outline: none; transition: border-color 0.15s ease;
}
.regen-instructions:focus { border-color: var(--terracotta); }
.regen-instructions::placeholder { color: var(--ink-3); }

@media (max-width: 560px) {
  .regen-days-grid { grid-template-columns: repeat(4, 1fr); }
}
      `}</style>
    </>
  )
}
