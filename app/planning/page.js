'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, X, Check } from 'lucide-react'
import WeekGrid from './components/WeekGrid'

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

  // ── Semaine affichée (lundi → dimanche, comme WeeklyPlanView) ──
  const [weekOffset, setWeekOffset] = useState(0)

  function getWeekDates(offset) {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d)
    }
    return days
  }

  const fmt = d => d.toISOString().split('T')[0]
  const weekDates = getWeekDates(weekOffset)
  const weekStart = fmt(weekDates[0])
  const weekEnd = fmt(weekDates[6])

  // L'import qui COUVRE la semaine affichée (même règle que WeeklyPlanView).
  const selectedImport =
    imports.find(i => i.date_range_start === weekStart) ||
    imports.find(i => i.date_range_start <= weekEnd && i.date_range_end >= weekStart) ||
    null
  const selectedImportId = selectedImport?.id || null

  // ── Données de la semaine sélectionnée (un seul fetch + cache mémoire) ──
  const detailCacheRef = useRef({}) // importId -> { meals, batchRecipes, prepTasks, shoppingItems }
  const [weekData, setWeekData] = useState(null)
  const [weekLoading, setWeekLoading] = useState(true)

  useEffect(() => {
    if (!selectedImportId) { setWeekData(null); setWeekLoading(false); return }
    let cancelled = false
    const cached = detailCacheRef.current[selectedImportId]
    if (cached) { setWeekData(cached); setWeekLoading(false); return }
    setWeekLoading(true)
    ;(async () => {
      try {
        const res = await authFetch(`/api/planning/imports/${selectedImportId}`)
        const data = await res.json()
        const payload = {
          meals: data.meals || [],
          batchRecipes: data.batchRecipes || [],
          prepTasks: data.prepTasks || [],
          shoppingItems: data.shoppingItems || [],
        }
        detailCacheRef.current[selectedImportId] = payload
        if (!cancelled) setWeekData(payload)
      } catch (err) {
        console.error('Erreur chargement semaine:', err)
        if (!cancelled) setWeekData({ meals: [], batchRecipes: [], prepTasks: [], shoppingItems: [] })
      } finally {
        if (!cancelled) setWeekLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [selectedImportId])

  const meals = weekData?.meals || []
  const batchRecipes = weekData?.batchRecipes || []
  const prepTasks = weekData?.prepTasks || []
  const shoppingItems = weekData?.shoppingItems || []

  const weekRangeLabel = `${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`

  // ── Régénération ── (flux conservé verbatim)
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
          detailCacheRef.current = {} // invalide le cache : les repas ont changé
          await loadImports()
          return
        }
        if (latest?.status === 'error') {
          throw new Error('La routine a rencontré une erreur. Réessaie.')
        }
      }
      setRegenStatus('done')
      setRegenOpen(false)
      detailCacheRef.current = {}
      await loadImports()
    } catch (err) {
      setRegenStatus('error')
      setRegenError(err.message)
    }
  }

  function openRegen() {
    setRegenOpen(true); setRegenStatus('idle'); setRegenDays([]); setRegenMeals([]); setRegenInstructions(''); setRegenMode('week')
  }

  // ── Sessions de batch : regroupées par `timing` ──
  const batchSessions = (() => {
    if (!batchRecipes.length) return []
    const groups = new Map()
    for (const r of batchRecipes) {
      const key = (r.timing && String(r.timing).trim()) || '__base__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(r)
    }
    return [...groups.entries()].map(([key, bases]) => {
      const title = key === '__base__' ? 'Bases à préparer' : key
      // Temps estimé : si une prepTask correspond au timing, on l'affiche.
      const matchTask = prepTasks.find(t => (t.prep_label || '').trim() === key) ||
        (key !== '__base__' ? prepTasks.find(t => key && (t.prep_label || '').toLowerCase().includes(String(key).toLowerCase())) : null)
      return { key, title, bases, estimated: matchTask?.estimated_time || null }
    })
  })()

  return (
    <>
      <div className="v21-page wide">
        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning</span>
            <h1 className="v21-title">La semaine</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Sept jours dressés comme une carte, pilotés d'un coup d'œil.</p>
          </div>
          <div className="v21-hero-side">
            <button className="v21-btn" onClick={() => router.push('/planning/assistant')}>
              <Sparkles size={15} /> Demander à Myko
            </button>
            {planningReady && imports.length > 0 && (
              <button className="v21-btn ghost" onClick={openRegen}>
                <RefreshCw size={14} /> Modifier
              </button>
            )}
          </div>
        </header>

        {/* ═══ CONTENU ═══ */}
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
          /* ═══ LE COCKPIT : rail | grille ═══ */
          <div className="ck-board">
            {/* ─── RAIL GAUCHE : sessions de batch ─── */}
            <aside className="ck-rail">
              <div className="ck-railhead">
                <span className="ck-rail-t">Sessions de batch</span>
                <div className="ck-rail-title">Préparer la semaine</div>
                <div className="ck-rail-cap">cuisinez en lots, mangez sans effort</div>
              </div>

              {weekLoading ? (
                <div className="ck-rail-body" aria-busy="true">
                  <div className="v21-skel" style={{ height: 16, width: '60%', marginBottom: 14 }} />
                  <div className="v21-skel" style={{ height: 13, width: '90%', marginBottom: 9 }} />
                  <div className="v21-skel" style={{ height: 13, width: '80%', marginBottom: 9 }} />
                  <div className="v21-skel" style={{ height: 13, width: '85%' }} />
                </div>
              ) : batchSessions.length ? (
                <>
                  {batchSessions.map(sess => (
                    <div key={sess.key} className="ck-sess">
                      <div className="ck-sess-h">
                        <div className="ck-sess-nm">{sess.title}</div>
                        <div className="ck-sess-meta">
                          {sess.estimated ? `≈ ${sess.estimated} · ` : ''}
                          {sess.bases.length} base{sess.bases.length > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="ck-bases">
                        {sess.bases.map((b, i) => (
                          <BaseRow key={`${sess.key}-${i}`} base={b} />
                        ))}
                      </div>
                    </div>
                  ))}
                  <a className="ck-courses" href="/courses" onClick={(e) => { e.preventDefault(); router.push('/courses') }}>
                    Ouvrir la liste de courses · {shoppingItems.length} →
                  </a>
                </>
              ) : (
                /* État vide — aucune session de batch pour cette semaine */
                <>
                  <div className="ck-rail-empty">
                    <p className="ck-empty-txt">Pas encore de sessions de batch pour cette semaine.</p>
                    {selectedImportId && (
                      <button
                        className="ck-empty-link"
                        onClick={() => router.push(`/planning/${selectedImportId}/batch`)}
                      >
                        Préparer un batch →
                      </button>
                    )}
                  </div>
                  <a className="ck-courses" href="/courses" onClick={(e) => { e.preventDefault(); router.push('/courses') }}>
                    Ouvrir la liste de courses · {shoppingItems.length} →
                  </a>
                </>
              )}
            </aside>

            {/* ─── GRILLE DROITE ─── */}
            {weekLoading ? (
              <section className="ck-grid-loading" aria-busy="true" aria-label="Chargement de la grille">
                <div className="v21-skel" style={{ height: 44, marginBottom: 1, borderRadius: 0 }} />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="v21-skel" style={{ height: 72, marginBottom: 1, borderRadius: 0 }} />
                ))}
              </section>
            ) : (
              <WeekGrid
                meals={meals}
                weekDates={weekDates}
                weekOffset={weekOffset}
                onPrevWeek={() => setWeekOffset(w => w - 1)}
                onNextWeek={() => setWeekOffset(w => w + 1)}
              />
            )}
          </div>
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
/* ═══════════════════════════════════════════════════════════════════════
   COCKPIT — board (rail | grille), divisé par un filet sombre.
   Réutilise les tokens v21 (papier, ink, filets, terracotta).
   ═══════════════════════════════════════════════════════════════════════ */
.ck-board {
  display: grid; grid-template-columns: 340px 1fr;
  border-top: 1px solid var(--ink-1);
}
.ck-rail { border-right: 1px solid var(--ink-1); min-width: 0; }

/* En-tête du rail */
.ck-railhead { padding: 30px 28px 22px; border-bottom: 1px solid var(--ink-1); }
.ck-rail-t {
  display: inline-block;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
  background: var(--ink-1); color: var(--paper); padding: 4px 9px; border-radius: 3px;
}
.ck-rail-title {
  font-family: var(--font-display); font-weight: 600; font-size: 27px; letter-spacing: -0.02em; line-height: 1;
  margin-top: 16px; color: var(--ink-1);
}
.ck-rail-cap { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); letter-spacing: 0.02em; margin-top: 8px; }

/* Corps du rail (skeleton) */
.ck-rail-body { padding: 24px 28px; }

/* Une session de batch */
.ck-sess { padding: 24px 28px 8px; border-bottom: 1px solid var(--ink-1); position: relative; }
.ck-sess::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ink-3); }
.ck-sess-h { margin-bottom: 10px; }
.ck-sess-nm { font-family: var(--font-display); font-weight: 600; font-size: 21px; letter-spacing: -0.01em; line-height: 1.08; color: var(--ink-1); }
.ck-sess-meta { font-family: var(--font-mono); font-size: 11px; color: var(--terracotta); font-weight: 500; letter-spacing: 0.02em; margin-top: 5px; }

/* Une base = case + nom + qty */
.ck-bases { display: flex; flex-direction: column; }
.ck-base { display: flex; align-items: flex-start; gap: 11px; padding: 11px 0; border-bottom: 1px solid var(--line); }
.ck-base:last-child { border-bottom: none; }
.ck-ck {
  flex: none; width: 15px; height: 15px; border: 1.5px solid var(--line-strong); border-radius: 3px;
  margin-top: 2px; cursor: pointer; background: transparent; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ck-ck:hover { border-color: var(--terracotta); }
.ck-ck.on { background: var(--brand); border-color: var(--brand); }
.ck-base-b { flex: 1; min-width: 0; }
.ck-base-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.ck-base-nm { font-family: var(--font-display); font-weight: 500; font-size: 15.5px; line-height: 1.2; color: var(--ink-1); }
.ck-base-q { font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); font-weight: 500; white-space: nowrap; flex: none; }

/* État vide du rail */
.ck-rail-empty { padding: 26px 28px; }
.ck-empty-txt { font-family: var(--font-mono); font-size: 11.5px; color: var(--ink-3); line-height: 1.6; letter-spacing: 0.01em; margin: 0 0 14px; }
.ck-empty-link {
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em; color: var(--terracotta);
  background: transparent; border: none; padding: 0; cursor: pointer; text-decoration: none;
}
.ck-empty-link:hover { text-decoration: underline; }

/* Lien courses (bas du rail) */
.ck-courses {
  display: block; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.02em;
  color: var(--terracotta); text-decoration: none; padding: 20px 28px; cursor: pointer;
  border-top: 1px solid var(--line);
}
.ck-courses:hover { text-decoration: underline; }

/* Skeleton de la grille (panneau droit pendant le fetch) */
.ck-grid-loading { min-width: 0; padding: 18px 42px; }

.ck-empty-link:focus-visible, .ck-courses:focus-visible, .ck-ck:focus-visible {
  outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 3px;
}

/* Responsive : le board s'empile (rail au-dessus) */
@media (max-width: 880px) {
  .ck-board { grid-template-columns: 1fr; }
  .ck-rail { border-right: none; border-bottom: 1px solid var(--ink-1); }
  .ck-railhead, .ck-sess, .ck-rail-empty, .ck-rail-body { padding-left: 22px; padding-right: 22px; }
  .ck-courses { padding-left: 22px; padding-right: 22px; }
  .ck-grid-loading { padding: 16px 22px; }
}

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

/* ── Ligne de base avec case à cocher locale (état visuel) ── */
function BaseRow({ base }) {
  const [done, setDone] = useState(false)
  const qty = (base.portions && String(base.portions).trim()) || (base.rendement && String(base.rendement).trim()) || ''
  return (
    <div className="ck-base">
      <button
        className={`ck-ck${done ? ' on' : ''}`}
        onClick={() => setDone(d => !d)}
        aria-pressed={done}
        title={done ? 'Préparée' : 'À préparer'}
      >
        {done && <Check size={10} color="#fff" />}
      </button>
      <div className="ck-base-b">
        <div className="ck-base-top">
          <span className="ck-base-nm" style={done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
            {base.name || 'Base'}
          </span>
          {qty && <span className="ck-base-q">{qty}</span>}
        </div>
      </div>
    </div>
  )
}
