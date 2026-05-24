'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { Upload, FileSpreadsheet, Trash2, Calendar, Sparkles, Leaf, RefreshCw, X } from 'lucide-react'
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

  async function submitRegen() {
    if (!latestImport) return
    if (regenMode === 'days' && !regenDays.length) return
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
      <div className="planning-canvas" aria-hidden="true" />
      <div className="planning-container">
        {/* ═══ HERO HEADER ═══ */}
        <div className="hero-header">
          <div className="hero-decoration">
            <Leaf size={120} strokeWidth={0.5} />
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Planning</span>
              <h1 className="hero-title">Vos repas de la semaine</h1>
              <p className="hero-subtitle">Planifiez, cuisinez, savourez — avec l'aide de Myko</p>
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => router.push('/planning/assistant')}>
                <Sparkles size={18} />
                Demander à Myko
              </button>
              <button className="btn-secondary" onClick={() => router.push('/planning/import')}>
                <Upload size={18} />
                Importer .xlsx
              </button>
            </div>
          </div>
        </div>

        {/* ═══ CONTENU : un seul état de chargement, pas de flash ═══ */}
        {!planningReady ? (
          <section className="planning-section">
            <div className="section-header">
              <div className="section-accent"></div>
              <h2 className="section-title">Semaine en cours</h2>
            </div>
            <div className="planning-loading">Chargement du planning…</div>
          </section>
        ) : imports.length === 0 ? (
          <section className="planning-section">
            <div className="empty-state-card">
              <div className="empty-icon">
                <FileSpreadsheet size={48} strokeWidth={1.2} />
              </div>
              <h3>Aucun plan encore</h3>
              <p>Demande à Myko de créer un planning ou importe un fichier .xlsx</p>
              <button className="btn-primary btn-lg" onClick={() => router.push('/planning/assistant')}>
                <Sparkles size={20} />
                Créer un planning avec l'IA
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="planning-section">
              <div className="section-header">
                <div className="section-accent"></div>
                <h2 className="section-title">Semaine en cours</h2>
                <button className="btn-regen" onClick={() => { setRegenOpen(true); setRegenStatus('idle'); setRegenDays([]); setRegenMode('week') }}>
                  <RefreshCw size={14} />
                  Modifier
                </button>
              </div>
              <WeeklyPlanView imports={imports} />
            </section>

            <section className="planning-section">
              <div className="section-header">
                <div className="section-accent"></div>
                <h2 className="section-title">Suivi nutritionnel</h2>
              </div>
              <DailyNutritionRecap importId={latestImport.id} />
            </section>
          </>
        )}

        {/* ═══ MANAGE IMPORTS (compact) ═══ */}
        {planningReady && imports.length > 0 && (
          <section className="planning-section">
            <details className="imports-details">
              <summary className="imports-summary">
                <Calendar size={14} />
                {imports.length} plan{imports.length > 1 ? 's' : ''} importé{imports.length > 1 ? 's' : ''}
              </summary>
              <div className="imports-compact">
                {imports.map(imp => (
                  <div key={imp.id} className="import-row">
                    <span className="import-row-name" onClick={() => router.push(`/planning/${imp.id}`)}>
                      {imp.month_label || imp.file_name}
                    </span>
                    <span className="import-row-date">
                      {new Date(imp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <button className="delete-btn" onClick={(e) => handleDelete(imp.id, e)} title="Supprimer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>

      {/* ═══ MODAL RÉGÉNÉRATION ═══ */}
      {regenOpen && (
        <div className="regen-overlay" onClick={() => regenStatus === 'idle' || regenStatus === 'error' ? setRegenOpen(false) : null}>
          <div className="regen-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="regen-header">
              <span className="regen-title">Modifier le planning</span>
              {(regenStatus === 'idle' || regenStatus === 'error') && (
                <button className="regen-close" onClick={() => setRegenOpen(false)}><X size={18} /></button>
              )}
            </div>

            {regenStatus === 'idle' || regenStatus === 'error' ? (<>
              {/* Mode selector */}
              <div className="regen-modes">
                <button
                  className={`regen-mode-btn${regenMode === 'week' ? ' active' : ''}`}
                  onClick={() => setRegenMode('week')}
                >
                  Toute la semaine
                </button>
                <button
                  className={`regen-mode-btn${regenMode === 'days' ? ' active' : ''}`}
                  onClick={() => setRegenMode('days')}
                >
                  Jours précis
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

              {regenStatus === 'error' && <p className="regen-error">{regenError}</p>}

              <button
                className="regen-submit"
                onClick={submitRegen}
                disabled={regenMode === 'days' && !regenDays.length}
              >
                <RefreshCw size={16} />
                {regenMode === 'week'
                  ? 'Régénérer la semaine entière'
                  : regenDays.length
                    ? `Régénérer ${regenDays.length} jour${regenDays.length > 1 ? 's' : ''}`
                    : 'Sélectionne des jours'}
              </button>
              <p className="regen-note">Myko régénère en 2–4 min et écrit directement dans Supabase.</p>
            </>) : regenStatus === 'submitting' ? (
              <div className="regen-waiting">
                <div className="regen-spinner" />
                <p>Déclenchement de la routine…</p>
              </div>
            ) : regenStatus === 'waiting' ? (
              <div className="regen-waiting">
                <div className="regen-spinner" />
                <p>Myko régénère ton planning…</p>
                <p className="regen-note">Tu peux fermer cette fenêtre, le résultat apparaîtra automatiquement.</p>
                <button className="regen-cancel" onClick={() => setRegenOpen(false)}>Fermer et revenir plus tard</button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style jsx>{`
/* ===== REFONTE « MYCÉLIUM » — Planning (pilote) ===== */
/* Voile papier TRANSLUCIDE : laisse vivre les amibes animées en fond
   (signature Mycélium) tout en gardant le texte lisible. */
.planning-canvas {
  position: fixed; inset: 0; z-index: 0;
  background: var(--paper);
  opacity: 0.46;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(120% 95% at 50% 0%, #000 55%, rgba(0,0,0,0.78) 100%);
          mask-image: radial-gradient(120% 95% at 50% 0%, #000 55%, rgba(0,0,0,0.78) 100%);
}
.planning-container {
  position: relative; z-index: 1;
  max-width: 980px; margin: 0 auto;
  padding: clamp(22px, 4vw, 52px) clamp(16px, 4vw, 36px) 96px;
  font-family: var(--font-text);
  color: var(--ink-1);
  -webkit-font-smoothing: antialiased;
}

/* ── Masthead éditorial ── */
.hero-header {
  position: relative;
  padding: var(--s-5) 0 var(--s-6);
  border-bottom: 1px solid var(--line);
  margin-bottom: var(--s-7);
  overflow: hidden;
}
.hero-decoration {
  position: absolute; top: -34px; right: -20px;
  color: var(--brand); opacity: 0.06;
  transform: rotate(12deg); pointer-events: none;
}
.hero-content {
  position: relative; z-index: 1;
  display: flex; justify-content: space-between;
  align-items: flex-end; gap: var(--s-6); flex-wrap: wrap;
}
.hero-text { max-width: 620px; }
.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: var(--fs-xs); font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--accent); margin-bottom: var(--s-3);
}
.hero-eyebrow::before {
  content: ''; width: 26px; height: 2px;
  background: var(--accent); border-radius: 2px;
}
.hero-title {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-size: var(--fs-display); font-weight: 600;
  line-height: 1.04; letter-spacing: -0.025em;
  color: var(--ink-1); margin: 0 0 var(--s-3);
}
.hero-subtitle {
  font-size: var(--fs-body); color: var(--ink-2);
  margin: 0; line-height: 1.55; font-weight: 400;
}
.hero-actions { display: flex; gap: var(--s-3); flex-wrap: wrap; }

/* ── Boutons ── */
.btn-primary, .btn-secondary {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 13px 22px; border-radius: var(--r-pill);
  font-family: var(--font-text); font-size: var(--fs-sm);
  font-weight: 600; cursor: pointer;
  transition: transform var(--dur) var(--spring),
              background var(--dur-fast) var(--ease),
              box-shadow var(--dur-fast) var(--ease),
              border-color var(--dur-fast) var(--ease);
}
.btn-primary:active, .btn-secondary:active { transform: scale(0.96); }
.btn-primary {
  background: var(--brand); color: #fff; border: 1px solid var(--brand);
  box-shadow: var(--sh-1);
}
.btn-primary:hover {
  background: var(--brand-strong); border-color: var(--brand-strong);
  transform: translateY(-3px) scale(1.035);
  box-shadow: var(--sh-2), 0 0 0 4px var(--accent-soft);
}
.btn-secondary {
  background: transparent; color: var(--ink-1);
  border: 1px solid var(--line-strong);
}
.btn-secondary:hover {
  background: var(--surface); border-color: var(--ink-2);
  transform: translateY(-3px) scale(1.035);
}
.btn-lg { padding: 15px 28px; font-size: var(--fs-body); }

/* ── Sections ── */
.planning-section {
  margin-bottom: var(--s-7);
  animation: mykoReveal 0.62s var(--spring) both;
}
.planning-section:nth-of-type(2) { animation-delay: 0.07s; }
.planning-section:nth-of-type(3) { animation-delay: 0.14s; }
.planning-section:nth-of-type(4) { animation-delay: 0.2s; }
.section-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: var(--s-5);
  padding-bottom: var(--s-3);
  border-bottom: 1px solid var(--line);
}
.section-accent {
  width: 9px; height: 9px; border-radius: 2px;
  background: var(--accent); transform: rotate(45deg);
  flex-shrink: 0;
}
.section-title {
  font-family: var(--font-display);
  font-size: var(--fs-h2); font-weight: 600;
  letter-spacing: -0.015em; color: var(--ink-1); margin: 0;
}

/* ── Chargement (un seul état, sobre) ── */
.planning-loading {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: var(--s-7);
  text-align: center;
  color: var(--ink-3);
  font-family: var(--font-text);
  font-size: var(--fs-sm);
  letter-spacing: 0.02em;
  animation: mykoPulse 1.4s var(--ease) infinite;
}

/* ── État vide ── */
.empty-state-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: var(--s-8) var(--s-5);
  text-align: center;
  box-shadow: var(--sh-1);
}
.empty-icon {
  width: 76px; height: 76px; margin: 0 auto var(--s-4);
  background: var(--brand-soft); border-radius: var(--r-card);
  display: flex; align-items: center; justify-content: center;
  color: var(--brand);
}
.empty-state-card h3 {
  font-family: var(--font-display);
  font-size: 26px; font-weight: 600; letter-spacing: -0.02em;
  color: var(--ink-1); margin: 0 0 var(--s-2);
}
.empty-state-card p {
  color: var(--ink-2); font-size: var(--fs-body);
  margin: 0 auto var(--s-5); max-width: 360px; line-height: 1.55;
}
.empty-state-card .btn-primary {
  display: inline-flex;
  background: var(--brand); color: #fff; border-color: var(--brand);
}

/* ── Liste des plans (registre) ── */
.imports-details {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  overflow: hidden;
}
.imports-summary {
  display: flex; align-items: center; gap: 9px;
  padding: 14px 18px;
  font-family: var(--font-text);
  font-size: var(--fs-sm); font-weight: 600;
  color: var(--ink-2); cursor: pointer;
  list-style: none;
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.imports-summary::-webkit-details-marker { display: none; }
.imports-summary:hover { background: var(--surface-soft); color: var(--ink-1); }
.imports-compact {
  padding: 0 10px 10px;
  display: flex; flex-direction: column;
}
.import-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 12px;
  border-top: 1px solid var(--line);
  transition: background var(--dur) var(--ease);
}
.import-row:hover { background: var(--surface-soft); }
.import-row-name {
  flex: 1; min-width: 0;
  font-family: var(--font-display);
  font-size: var(--fs-body); font-weight: 600;
  color: var(--ink-1); cursor: pointer;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.import-row-name:hover { color: var(--brand); }
.import-row-date {
  font-size: var(--fs-xs); color: var(--ink-3);
  font-weight: 500; flex-shrink: 0; letter-spacing: 0.02em;
}
.delete-btn {
  background: none; border: none; color: var(--ink-3);
  cursor: pointer; padding: 8px; border-radius: var(--r-sm);
  display: flex; transition: var(--transition-base);
}
.delete-btn:hover { color: #c0392b; background: rgba(192, 57, 43, 0.08); }

/* ── Motion ── */
@keyframes mykoReveal {
  0%   { opacity: 0; transform: translateY(20px) scale(0.985); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes mykoPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
@media (prefers-reduced-motion: reduce) {
  .planning-section, .planning-loading { animation: none; }
}

/* ── Bouton "Modifier" dans le section-header ── */
.btn-regen {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--r-pill);
  font-family: var(--font-text); font-size: var(--fs-xs);
  font-weight: 600; cursor: pointer;
  background: var(--surface); color: var(--ink-2);
  border: 1px solid var(--line-strong);
  transition: var(--transition-base);
}
.btn-regen:hover { background: var(--surface-soft); color: var(--brand); border-color: var(--brand); }

/* ── Modal régénération ── */
.regen-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(24, 28, 22, 0.52);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  animation: mykoReveal 0.22s var(--ease) both;
}
.regen-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--sh-2);
  width: 100%; max-width: 440px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 18px;
}
.regen-header {
  display: flex; align-items: center; justify-content: space-between;
}
.regen-title {
  font-family: var(--font-display);
  font-size: var(--fs-h3); font-weight: 600;
  color: var(--ink-1); letter-spacing: -0.015em;
}
.regen-close {
  background: none; border: none; cursor: pointer;
  color: var(--ink-3); padding: 6px;
  border-radius: var(--r-sm); display: flex;
  transition: var(--transition-base);
}
.regen-close:hover { background: var(--surface-soft); color: var(--ink-1); }

.regen-modes {
  display: flex; gap: 8px;
}
.regen-mode-btn {
  flex: 1; padding: 10px 12px;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  background: transparent; cursor: pointer;
  font-family: var(--font-text); font-size: var(--fs-sm);
  font-weight: 600; color: var(--ink-2);
  transition: var(--transition-base);
}
.regen-mode-btn:hover { border-color: var(--brand); color: var(--brand); }
.regen-mode-btn.active {
  background: var(--brand-soft); border-color: var(--brand);
  color: var(--brand);
}

.regen-days-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
}
.regen-day-btn {
  display: flex; flex-direction: column; align-items: center;
  gap: 3px; padding: 10px 0;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  background: transparent; cursor: pointer;
  transition: var(--transition-base);
}
.regen-day-btn:hover { border-color: var(--brand); }
.regen-day-btn.active {
  background: var(--brand-soft); border-color: var(--brand);
}
.regen-day-name {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-3);
}
.regen-day-btn.active .regen-day-name { color: var(--brand); }
.regen-day-num {
  font-size: var(--fs-sm); font-weight: 700;
  color: var(--ink-1);
}
.regen-day-btn.active .regen-day-num { color: var(--brand); }

.regen-error {
  font-size: var(--fs-sm); color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: var(--r-sm); padding: 10px 14px;
  margin: 0; line-height: 1.45;
}

.regen-submit {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px;
  background: linear-gradient(135deg, var(--brand), #059669);
  color: #fff; border: none;
  border-radius: var(--r-pill); cursor: pointer;
  font-family: var(--font-text); font-size: var(--fs-body);
  font-weight: 600; box-shadow: var(--sh-1);
  transition: var(--transition-base);
}
.regen-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-2px); }
.regen-submit:disabled {
  opacity: 0.45; cursor: not-allowed; filter: none; transform: none;
}

.regen-note {
  font-size: var(--fs-xs); color: var(--ink-3);
  text-align: center; margin: -6px 0 0; line-height: 1.5;
}

.regen-waiting {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 8px 0 4px;
}
.regen-waiting p {
  font-size: var(--fs-body); font-weight: 600; color: var(--ink-1);
  margin: 0; text-align: center;
}
.regen-waiting .regen-note { font-size: var(--fs-xs); color: var(--ink-3); }
.regen-spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--line-strong);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: regenSpin 0.8s linear infinite;
}
@keyframes regenSpin { to { transform: rotate(360deg); } }

.regen-cancel {
  background: none; border: 1px solid var(--line-strong);
  border-radius: var(--r-pill); padding: 10px 22px;
  font-family: var(--font-text); font-size: var(--fs-sm);
  font-weight: 600; color: var(--ink-2); cursor: pointer;
  transition: var(--transition-base);
}
.regen-cancel:hover { background: var(--surface-soft); color: var(--ink-1); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .planning-container { padding: 20px 16px 64px; }
  .hero-header { padding: var(--s-3) 0 var(--s-5); margin-bottom: var(--s-6); }
  .hero-content { flex-direction: column; align-items: flex-start; gap: var(--s-4); }
  .hero-actions { width: 100%; }
  .hero-actions .btn-primary, .hero-actions .btn-secondary { flex: 1; justify-content: center; }
  .section-title { font-size: 18px; }
  .regen-days-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 480px) {
  .planning-container { padding: 16px 12px 48px; }
  .hero-actions { flex-direction: column; }
  .planning-section { margin-bottom: var(--s-6); }
  .regen-days-grid { grid-template-columns: repeat(4, 1fr); }
}
      `}</style>
    </>
  )
}
