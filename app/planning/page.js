'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw, X, Check } from 'lucide-react'
import WeekGrid from './components/WeekGrid'
import WeeklyNutritionRecap from './components/WeeklyNutritionRecap'
import ConfirmDialog from '@/components/ConfirmDialog'
import { toast } from '@/components/Toast'

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importsLoaded, setImportsLoaded] = useState(false)
  const [imports, setImports] = useState([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [importToDelete, setImportToDelete] = useState(null)

  useEffect(() => { checkAuth() }, [])
  useEffect(() => { if (user) loadImports() }, [user])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
    } catch {
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
    } catch {
      // imports restent vides
    } finally {
      setImportsLoaded(true)
    }
  }

  function handleDelete(importId, e) {
    e.stopPropagation()
    setImportToDelete(importId)
    setConfirmDeleteOpen(true)
  }

  async function doDelete() {
    if (!importToDelete) return
    try {
      await authFetch(`/api/planning/imports/${importToDelete}`, { method: 'DELETE' })
      setImports(prev => prev.filter(i => i.id !== importToDelete))
    } catch {
      toast.error('Erreur lors de la suppression du plan')
    } finally {
      setImportToDelete(null)
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
      } catch {
        if (!cancelled) {
          toast.error('Erreur lors du chargement des données de la semaine')
          setWeekData({ meals: [], batchRecipes: [], prepTasks: [], shoppingItems: [] })
        }
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

  // Cibles nutritionnelles par personne (pour le récap hebdo). Best-effort.
  const [nutritionGoals, setNutritionGoals] = useState([])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch('/api/nutrition/goals')
        const data = await res.json().catch(() => ({}))
        if (!cancelled && res.ok) setNutritionGoals(data.goals || [])
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const weekRangeLabel = `${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`

  // ── Régénération ──
  // Machine à états du poller :
  //   idle → submitting → waiting → done | error | stalled
  //   stalled = 6 min sans résolution : la routine continue en arrière-plan,
  //   on ne simule PLUS un « done » — l'utilisateur peut « Vérifier » (re-check
  //   ponctuel) ou « Relancer » (retour au formulaire).
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenMode, setRegenMode] = useState('week') // 'week' | 'days' | 'meals'
  const [regenDays, setRegenDays] = useState([])
  const [regenStatus, setRegenStatus] = useState('idle') // idle | submitting | waiting | done | error | stalled
  const [regenError, setRegenError] = useState('')
  const [regenMeals, setRegenMeals] = useState([]) // [{date, type}]
  const [regenInstructions, setRegenInstructions] = useState('')
  const [validation, setValidation] = useState(null) // rapport /validate quand !ok
  const pollTokenRef = useRef(0) // invalide les boucles de polling obsolètes

  const REGEN_MAX_WAIT = 6 * 60 * 1000
  const REGEN_POLL_MS = 8000

  // Dernière requête de régénération de l'utilisateur. Repli sans error_message
  // tant que la migration v5 (colonne error_message) n'est pas appliquée.
  async function fetchLatestRegen(userId) {
    let { data, error } = await supabase
      .from('plan_regen_requests')
      .select('id, status, error_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      ;({ data } = await supabase
        .from('plan_regen_requests')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1))
    }
    return data?.[0] || null
  }

  // Validation post-génération : signale les manques (créneaux, macros, fiches,
  // courses) et propose « Compléter ». Best-effort — ne bloque jamais le flux.
  async function runValidation(importId) {
    if (!importId) return
    try {
      const res = await authFetch(`/api/planning/imports/${importId}/validate`)
      const report = await res.json().catch(() => null)
      if (!res.ok || !report) return
      if (report.ok) { setValidation(null); return }
      setValidation({ importId, ...report })
      const summary = validationSummary(report)
      if (summary) toast.warning(`Plan incomplet : ${summary}`)
    } catch { /* best-effort */ }
  }

  function validationSummary(report) {
    const parts = []
    const n1 = report.missing_slots?.length || 0
    const n2 = report.invalid_macros?.length || 0
    const n3 = report.dej_diner_sans_fiche?.length || 0
    if (n1) parts.push(`${n1} créneau${n1 > 1 ? 'x' : ''} manquant${n1 > 1 ? 's' : ''}`)
    if (n2) parts.push(`${n2} repas sans macros`)
    if (n3) parts.push(`${n3} repas sans fiche`)
    if (!report.shopping_count) parts.push('liste de courses vide')
    return parts.join(', ')
  }

  // Pré-remplit le modal en mode « Un repas » avec les créneaux à compléter.
  function completeMissing() {
    if (!validation) return
    const slots = new Map()
    const add = s => { if (s?.date && s?.type) slots.set(`${s.date}|${s.type}`, { date: s.date, type: s.type }) }
    ;(validation.missing_slots || []).forEach(add)
    ;(validation.dej_diner_sans_fiche || []).forEach(add)
    ;(validation.invalid_macros || []).forEach(add)
    setRegenMeals([...slots.values()])
    setRegenMode('meals')
    setRegenDays([])
    setRegenInstructions('')
    setRegenError('')
    setRegenStatus('idle')
    setRegenOpen(true)
  }

  // Résolution « done » : recharge les imports, invalide le cache, valide le plan.
  async function onRegenDone() {
    detailCacheRef.current = {} // les repas ont changé
    let targetImportId = null
    try {
      const res = await authFetch('/api/planning/imports')
      const data = await res.json().catch(() => ({}))
      if (data.imports) {
        setImports(data.imports)
        targetImportId = data.imports[0]?.id || null
      }
    } catch { /* le rail se resynchronisera au prochain passage */ }
    // Résolution identité ingrédients avant validation — fire-and-forget, best-effort.
    // Permet à validate de voir les FK correctement remplies.
    if (targetImportId) {
      try {
        await authFetch('/api/ingredients/resolve-pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ import_id: targetImportId }),
        })
      } catch { /* best-effort — la validation continue quoi qu'il arrive */ }
    }
    if (targetImportId) await runValidation(targetImportId)
    setRegenStatus('done')
    setRegenOpen(false)
  }

  // Boucle de polling honnête : done → validation ; error → error_message ;
  // budget épuisé → « stalled » (jamais de faux succès).
  async function pollRegen(userId, budgetMs = REGEN_MAX_WAIT) {
    const token = ++pollTokenRef.current
    const deadline = Date.now() + budgetMs
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, REGEN_POLL_MS))
      if (pollTokenRef.current !== token) return
      const latest = await fetchLatestRegen(userId)
      if (pollTokenRef.current !== token) return
      if (latest?.status === 'done') { await onRegenDone(); return }
      if (latest?.status === 'error') {
        const msg = latest.error_message || 'La routine a rencontré une erreur. Réessaie.'
        toast.error(msg)
        setRegenStatus('error')
        setRegenError(msg)
        return
      }
    }
    if (pollTokenRef.current === token) setRegenStatus('stalled')
  }

  // « Vérifier » depuis l'état stalled : un seul re-check, sans relancer la boucle.
  async function checkRegenOnce() {
    if (!user) return
    const latest = await fetchLatestRegen(user.id)
    if (latest?.status === 'done') { await onRegenDone(); return }
    if (latest?.status === 'error') {
      const msg = latest.error_message || 'La routine a rencontré une erreur. Réessaie.'
      toast.error(msg)
      setRegenStatus('error')
      setRegenError(msg)
      return
    }
    toast.info('Toujours en cours — Myko continue de générer en arrière-plan.')
  }

  // Reprise au montage : si une requête pending/processing de moins de 15 min
  // existe, on ré-affiche la progression (l'onglet a pu être fermé entre-temps).
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const latest = await fetchLatestRegen(user.id)
      if (cancelled || !latest) return
      if (!['pending', 'processing'].includes(latest.status)) return
      const age = Date.now() - new Date(latest.created_at).getTime()
      if (!(age >= 0 && age < 15 * 60 * 1000)) return
      setRegenOpen(true)
      setRegenStatus('waiting')
      pollRegen(user.id, Math.max(60 * 1000, REGEN_MAX_WAIT - age))
    })()
    return () => { cancelled = true; pollTokenRef.current++ }
  }, [user])

  // ── Planification du batch (génération intelligente in-app) ──
  const [batchStatus, setBatchStatus] = useState('idle') // idle | submitting | done | error
  const [batchError, setBatchError] = useState('')
  const [batchResult, setBatchResult] = useState(null) // { sessions, batch_recipes, planner }

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
      setValidation(null)
      setRegenStatus('waiting')

      // Poll honnête de plan_regen_requests : done → validation du plan,
      // error → error_message, 6 min sans réponse → stalled (pas de faux done).
      await pollRegen(user?.id)
    } catch (err) {
      setRegenStatus('error')
      setRegenError(err.message)
    }
  }

  function openRegen() {
    pollTokenRef.current++ // stoppe une éventuelle boucle de polling en cours
    setRegenOpen(true); setRegenStatus('idle'); setRegenDays([]); setRegenMeals([]); setRegenInstructions(''); setRegenMode('week')
  }

  // ── Génère le batch DANS l'app (déterministe, instantané) puis rafraîchit la semaine. ──
  async function planBatch() {
    if (!selectedImportId || batchStatus === 'submitting') return
    setBatchStatus('submitting'); setBatchError(''); setBatchResult(null)
    try {
      const res = await authFetch('/api/planning/batch/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: selectedImportId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erreur (${res.status})`)
      setBatchResult(data)

      // Recharge le détail de l'import (préparations + repas reliés) et rafraîchit le rail.
      const r2 = await authFetch(`/api/planning/imports/${selectedImportId}`)
      const d2 = await r2.json().catch(() => ({}))
      const payload = {
        meals: d2.meals || [],
        batchRecipes: d2.batchRecipes || [],
        prepTasks: d2.prepTasks || [],
        shoppingItems: d2.shoppingItems || [],
      }
      detailCacheRef.current[selectedImportId] = payload
      setWeekData(payload)
      setBatchStatus('done')
    } catch (err) {
      setBatchStatus('error'); setBatchError(err.message)
    }
  }

  // ── Sessions de batch : une vraie « journée de cuisine » par cook_date ──
  // Modèle « prépa à l'avance » : on cuisine tout en lots (le dimanche), on réchauffe
  // chaque déjeuner de la semaine. Repli sur l'ancien regroupement par `timing`
  // (durée) pour les imports legacy sans cook_date.
  const batchSessions = (() => {
    if (!batchRecipes.length) return []

    // Jours (meal_date) couverts par chaque préparation, via repas → batch_recipe_id.
    const coverByBatch = new Map() // batchId -> Set(meal_date)
    for (const m of meals) {
      if (!m.batch_recipe_id) continue
      if (!coverByBatch.has(m.batch_recipe_id)) coverByBatch.set(m.batch_recipe_id, new Set())
      coverByBatch.get(m.batch_recipe_id).add(m.meal_date)
    }
    const daysOf = (b) => [...(coverByBatch.get(b.id) || [])].sort().map(batchDayLabel)

    if (batchRecipes.some(b => b.cook_date)) {
      const groups = new Map()
      for (const r of batchRecipes) {
        const key = r.cook_date || '__base__'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(r)
      }
      return [...groups.entries()]
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
        .map(([key, bases]) => {
          const cookDate = key === '__base__' ? null : key
          const portions = bases.reduce((s, b) => s + (Number(b.portions_total) || 0), 0)
          const covered = new Set()
          for (const b of bases) (coverByBatch.get(b.id) || []).forEach(d => covered.add(d))
          const matchTask = cookDate ? prepTasks.find(t => t.prep_date === cookDate) : null
          return {
            key,
            title: cookDate ? `Cuisine du ${batchCookDateLabel(cookDate)}` : 'À préparer',
            cookDate, bases, daysOf, portions, covers: covered.size,
            estimated: matchTask?.estimated_time || null,
          }
        })
    }

    // ── Legacy : regroupé par `timing` (durée), sans lien repas. ──
    const groups = new Map()
    for (const r of batchRecipes) {
      const k = (r.timing && String(r.timing).trim()) || '__base__'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(r)
    }
    return [...groups.entries()].map(([k, bases]) => {
      const matchTask = prepTasks.find(t => (t.prep_label || '').trim() === k) ||
        (k !== '__base__' ? prepTasks.find(t => k && (t.prep_label || '').toLowerCase().includes(String(k).toLowerCase())) : null)
      return {
        key: k, title: k === '__base__' ? 'Bases à préparer' : k,
        cookDate: null, bases, daysOf: () => [], portions: 0, covers: 0,
        estimated: matchTask?.estimated_time || null,
      }
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

        {/* ═══ BANNIÈRE VALIDATION — plan incomplet après régénération ═══ */}
        {validation && (
          <div className="regen-vbanner" role="status">
            <span className="regen-vbanner-txt">
              Plan incomplet — {validationSummary(validation) || 'des éléments manquent'}
              {' '}({validation.meals_count}/{validation.expected_count} repas).
            </span>
            <div className="regen-vbanner-actions">
              <button className="v21-btn sm" onClick={completeMissing}>Compléter</button>
              <button className="regen-vbanner-close" onClick={() => setValidation(null)} aria-label="Masquer">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

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
                {selectedImportId && (
                  <button
                    className="ck-plan-btn"
                    onClick={planBatch}
                    disabled={batchStatus === 'submitting'}
                  >
                    {batchStatus === 'submitting' ? (
                      <><RefreshCw size={13} className="ck-spin" /> Génération du batch…</>
                    ) : batchSessions.length ? (
                      <><RefreshCw size={13} /> Replanifier le batch</>
                    ) : (
                      <><Sparkles size={13} /> Planifier le batch</>
                    )}
                  </button>
                )}
                {batchStatus === 'error' && <div className="ck-plan-err">{batchError}</div>}
                {batchStatus === 'done' && batchResult && (
                  <div className="ck-plan-ok">
                    ✓ {batchResult.batch_recipes} préparation{batchResult.batch_recipes > 1 ? 's' : ''}
                    {' · '}{(batchResult.sessions?.length || 1)} session{(batchResult.sessions?.length || 1) > 1 ? 's' : ''} de cuisine
                    {batchResult.planner === 'ai' ? ' · planifié par Myko (IA)' : ' · planifié (règles)'}
                  </div>
                )}
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
                          {sess.bases.length} plat{sess.bases.length > 1 ? 's' : ''}
                          {sess.portions ? ` · ${sess.portions} portions` : ''}
                          {sess.covers ? ` · couvre ${sess.covers} déjeuner${sess.covers > 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                      <div className="ck-bases">
                        {sess.bases.map((b, i) => (
                          <BaseRow key={`${sess.key}-${i}`} base={b} days={sess.daysOf(b)} />
                        ))}
                      </div>
                      {sess.cookDate && selectedImportId && (
                        <button
                          className="ck-sess-open"
                          onClick={() => router.push(`/planning/${selectedImportId}/batch`)}
                        >
                          Ouvrir le jour de cuisine →
                        </button>
                      )}
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
                    <p className="ck-empty-txt">
                      Pas encore de préparations pour cette semaine. Lance <b>« Planifier le batch »</b> ci-dessus : Myko regroupe tes déjeuners en lots à cuisiner d'avance, puis tu n'as plus qu'à réchauffer.
                    </p>
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
              <div className="ck-grid-col">
                <WeeklyNutritionRecap meals={meals} goals={nutritionGoals} />
                <WeekGrid
                  meals={meals}
                  weekDates={weekDates}
                  weekOffset={weekOffset}
                  onPrevWeek={() => setWeekOffset(w => w - 1)}
                  onNextWeek={() => setWeekOffset(w => w + 1)}
                  importId={selectedImportId}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODAL RÉGÉNÉRATION ═══ */}
      {regenOpen && (
        <div className="regen-overlay" onClick={() => ['idle', 'error', 'stalled'].includes(regenStatus) ? setRegenOpen(false) : null}>
          <div className="regen-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="regen-header">
              <span className="v21-bl">Modifier le planning</span>
              {['idle', 'error', 'stalled'].includes(regenStatus) && (
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
            ) : regenStatus === 'stalled' ? (
              <div className="regen-waiting regen-stalled">
                <p>La génération prend plus de temps que prévu — elle continue en arrière-plan.</p>
                <p className="regen-note">
                  Le résultat apparaîtra dès que la routine aura terminé. Tu peux vérifier
                  maintenant, ou relancer une nouvelle demande.
                </p>
                <div className="regen-stall-actions">
                  <button className="v21-btn sm" onClick={checkRegenOnce}>Vérifier</button>
                  <button
                    className="v21-btn ghost sm"
                    onClick={() => { setRegenStatus('idle'); setRegenError('') }}
                  >
                    Relancer
                  </button>
                </div>
                <button className="v21-btn ghost sm regen-cancel" onClick={() => setRegenOpen(false)}>Fermer</button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => { setConfirmDeleteOpen(false); setImportToDelete(null) }}
        onConfirm={doDelete}
        title="Supprimer ce plan ?"
        message="Cette action est irréversible. Le plan importé et tous ses repas seront supprimés."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <style jsx global>{`
/* ═══════════════════════════════════════════════════════════════════════
   COCKPIT — board (rail | grille), divisé par un filet sombre.
   Réutilise les tokens v21 (papier, ink, filets, terracotta).
   global : BaseRow étant un composant séparé, ses classes (.ck-base…)
   doivent rester non-scopées pour recevoir le style.
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

/* Bouton « Planifier le batch » (déclenche la Routine) */
.ck-plan-btn {
  margin-top: 18px; width: 100%;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  background: var(--terracotta); color: #fff; border: none; border-radius: 3px;
  padding: 11px 14px; cursor: pointer;
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 500;
  transition: filter 0.15s ease, opacity 0.15s ease;
}
.ck-plan-btn:hover:not(:disabled) { filter: brightness(1.06); }
.ck-plan-btn:disabled { opacity: 0.65; cursor: default; }
.ck-plan-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
.ck-spin { animation: ck-spin 0.9s linear infinite; }
@keyframes ck-spin { to { transform: rotate(360deg); } }
.ck-plan-hint { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); letter-spacing: 0.01em; line-height: 1.5; margin-top: 10px; }
.ck-plan-err {
  font-family: var(--font-text); font-size: 12.5px; color: var(--state-expired);
  background: var(--state-expired-bg); border: 1px solid var(--state-expired);
  border-radius: 3px; padding: 8px 11px; margin-top: 10px; line-height: 1.45;
}
.ck-plan-ok {
  font-family: var(--font-mono); font-size: 10.5px; color: #4f7d3f; letter-spacing: 0.01em;
  background: rgba(111, 176, 90, 0.1); border: 1px solid rgba(111, 176, 90, 0.3);
  border-radius: 3px; padding: 8px 11px; margin-top: 10px; line-height: 1.5;
}

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
.ck-base-cov { font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); letter-spacing: 0.03em; margin-top: 4px; }

/* Lien « Ouvrir le jour de cuisine » en pied de session */
.ck-sess-open {
  display: inline-block; margin: 4px 0 18px; padding: 0;
  background: transparent; border: none; cursor: pointer;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; color: var(--terracotta);
}
.ck-sess-open:hover { text-decoration: underline; }
.ck-sess-open:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 3px; }

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
.ck-grid-col { min-width: 0; display: flex; flex-direction: column; }

/* ── Récap nutritionnel hebdo (au-dessus de la grille) ─────────────────── */
.wnr {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 22px;
  padding: 10px 42px 8px; border-bottom: 1px solid rgba(0,0,0,0.08);
  font-size: 12px; color: var(--ink-3);
}
.wnr-lbl {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--ink-3);
}
.wnr-person { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 7px; }
.wnr-person b { color: var(--ink-1); font-weight: 600; }
.wnr-dot { width: 8px; height: 8px; border-radius: 50%; align-self: center; background: #c7c2b8; }
.wnr-ok   { background: #4c8a4f; }
.wnr-warn { background: #d8952f; }
.wnr-off  { background: #c0492f; }
.wnr-none { background: #c7c2b8; }
.wnr-kcal b, .wnr-kcal { color: var(--ink-2, #574f42); }
.wnr-macros { color: var(--ink-3); }
.wnr-days { font-style: italic; }
@media (max-width: 900px) { .wnr { padding: 10px 22px 8px; } }

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

/* État « stalled » : génération plus longue que prévu, jamais de faux done */
.regen-stalled p:first-child {
  font-family: var(--font-text); font-size: 14px; font-weight: 600; color: var(--ink-1);
}
.regen-stall-actions { display: flex; gap: 10px; justify-content: center; }

/* Bannière de validation post-génération (plan incomplet) */
.regen-vbanner {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  border: 1px solid var(--state-soon, #b07d2a);
  background: var(--state-soon-bg, rgba(176, 125, 42, 0.08));
  border-radius: 3px; padding: 11px 14px; margin-bottom: 18px;
}
.regen-vbanner-txt {
  font-family: var(--font-text); font-size: 13.5px; color: var(--ink-1); line-height: 1.45;
}
.regen-vbanner-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.regen-vbanner-close {
  background: none; border: none; cursor: pointer; padding: 5px;
  color: var(--ink-3); border-radius: 3px; display: flex;
  transition: background 0.15s ease, color 0.15s ease;
}
.regen-vbanner-close:hover { background: var(--surface-soft); color: var(--ink-1); }
@media (max-width: 560px) {
  .regen-vbanner { flex-direction: column; align-items: flex-start; }
}

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

/* ── Libellés de date pour les sessions de batch ── */
const BATCH_DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
function batchDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : BATCH_DOW[d.getDay()]
}
function batchCookDateLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* ── Ligne de préparation : case (visuelle) + nom + portions + jours couverts. ── */
function BaseRow({ base, days = [] }) {
  const [done, setDone] = useState(false)
  const qty = base.portions_total
    ? `${base.portions_total} portions`
    : (base.portions && String(base.portions).trim()) || (base.rendement && String(base.rendement).trim()) || ''
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
            {base.name || 'Préparation'}
          </span>
          {qty && <span className="ck-base-q">{qty}</span>}
        </div>
        {days.length > 0 && <div className="ck-base-cov">couvre {days.join(' · ')}</div>}
      </div>
    </div>
  )
}
