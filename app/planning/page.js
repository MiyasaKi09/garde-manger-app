'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight, CalendarDays, Check, Clock3, RefreshCw, ShoppingBasket, Sparkles, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { computeWeekReadiness } from '@/lib/domain/planning/readiness'
import { toast } from '@/components/Toast'
import WeekGrid from './components/WeekGrid'
import WeeklyNutritionRecap from './components/WeeklyNutritionRecap'
import './PlanningDashboard.css'

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const INTENTS = [
  { value: 'balanced', label: 'Équilibré', detail: 'Le meilleur compromis global' },
  { value: 'stock', label: 'Priorité stock', detail: 'Utilise les produits urgents' },
  { value: 'quick', label: 'Rapide', detail: 'Préparation active courte' },
  { value: 'light', label: 'Plus léger', detail: 'Moins riche, plus frais' },
  { value: 'vegetarian', label: 'Végétarien', detail: 'Sans viande ni poisson' },
]

function localIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function mondayForOffset(offset = 0) {
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7)
  return monday
}

function weekDatesForOffset(offset = 0) {
  const monday = mondayForOffset(offset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function addDays(iso, count) {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + count)
  return localIso(date)
}

function findImport(imports, start, end) {
  return imports.find((item) => item.file_name === 'myko-canonical-v3' && item.date_range_start === start)
    || imports.find((item) => item.date_range_start === start)
    || imports.find((item) => item.date_range_start <= end && item.date_range_end >= start)
    || null
}

export default function PlanningPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [importsLoaded, setImportsLoaded] = useState(false)
  const [imports, setImports] = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekData, setWeekData] = useState(null)
  // Cycle de chargement de la semaine : la readiness n'est évaluée QUE sur des
  // données réellement chargées ('ready') — jamais sur un échec ou un reste de
  // l'import précédent (minor P0 : « Semaine incomplète — 0/N » fantôme).
  const [weekStatus, setWeekStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'
  const [reloadKey, setReloadKey] = useState(0)
  const [horizonStatus, setHorizonStatus] = useState('idle')
  const [batchStatus, setBatchStatus] = useState('idle')
  const [repairStatus, setRepairStatus] = useState('idle')
  const [nutritionGoals, setNutritionGoals] = useState([])
  const [goalsStatus, setGoalsStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [modifyOpen, setModifyOpen] = useState(false)
  const [modifyScope, setModifyScope] = useState('week')
  const [modifyDays, setModifyDays] = useState([])
  const [modifyMeals, setModifyMeals] = useState([])
  const [intent, setIntent] = useState('balanced')
  const [instructions, setInstructions] = useState('')
  const [modifyStatus, setModifyStatus] = useState('idle')
  const horizonStarted = useRef(false)

  const weekDates = weekDatesForOffset(weekOffset)
  const weekStart = localIso(weekDates[0])
  const weekEnd = localIso(weekDates[6])
  const selectedImport = findImport(imports, weekStart, weekEnd)
  const selectedImportId = selectedImport?.id || null
  const meals = weekData?.meals || []
  const batchRecipes = weekData?.batchRecipes || []
  const shoppingItems = weekData?.shoppingItems || []

  const refreshImports = useCallback(async () => {
    const response = await authFetch('/api/planning/imports')
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Impossible de charger les semaines')
    setImports(data.imports || [])
    setImportsLoaded(true)
    return data.imports || []
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }
        if (!cancelled) setUser(session.user)
      } catch {
        router.push('/login')
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    if (!user) return
    refreshImports().catch(() => {
      setImportsLoaded(true)
      toast.error('Le planning ne peut pas être chargé pour le moment')
    })
    ;(async () => {
      try {
        const response = await authFetch('/api/nutrition/goals')
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Objectifs nutritionnels indisponibles')
        setNutritionGoals(data.goals || [])
        setGoalsStatus('ready')
      } catch {
        // Sans objectifs, les prises attendues sont inconnues : la semaine ne
        // sera jamais annoncée « prête » (cf. computeWeekReadiness, F16).
        setGoalsStatus('error')
      }
    })()
  }, [user, refreshImports])

  useEffect(() => {
    if (!user || !importsLoaded || horizonStarted.current) return
    horizonStarted.current = true
    ;(async () => {
      const currentStart = localIso(mondayForOffset(0))
      const nextStart = addDays(currentStart, 7)
      const missing = [currentStart, nextStart].filter((start) =>
        !imports.some((item) => item.file_name === 'myko-canonical-v3' && item.date_range_start === start))
      if (!missing.length) { setHorizonStatus('ready'); return }
      setHorizonStatus('preparing')
      try {
        for (const windowStart of missing) {
          const response = await authFetch('/api/planning/generate-v3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ window_start: windowStart, scope: 'week', intent: 'balanced' }),
          })
          const data = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(data.error || 'Préparation automatique incomplète')
        }
        await refreshImports()
        setReloadKey((value) => value + 1)
        setHorizonStatus('ready')
      } catch (error) {
        setHorizonStatus('error')
        toast.error(error.message)
      }
    })()
  }, [imports, importsLoaded, refreshImports, user])

  useEffect(() => {
    // Reset systématique au changement d'import : les repas de la semaine
    // précédente ne doivent jamais être évalués comme ceux de l'import courant.
    setWeekData(null)
    if (!selectedImportId) { setWeekStatus('idle'); return }
    let cancelled = false
    setWeekStatus('loading')
    ;(async () => {
      try {
        const response = await authFetch(`/api/planning/imports/${selectedImportId}`)
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Semaine indisponible')
        if (!cancelled) {
          setWeekData({
            meals: data.meals || [],
            batchRecipes: data.batchRecipes || [],
            prepTasks: data.prepTasks || [],
            shoppingItems: data.shoppingItems || [],
          })
          setWeekStatus('ready')
        }
      } catch (error) {
        if (!cancelled) {
          setWeekStatus('error')
          toast.error(error.message)
        }
      }
    })()
    return () => { cancelled = true }
  }, [selectedImportId, reloadKey])

  // P0-7 (audit F16/F17) : plus AUCUNE réparation silencieuse au chargement.
  // Une semaine publiée mais incomplète est signalée (bannière « Semaine
  // incomplète ») et ne se régénère que sur clic explicite via repairWeek().
  async function repairWeek() {
    if (!selectedImportId || repairStatus === 'saving') return
    setRepairStatus('saving')
    try {
      const response = await authFetch('/api/planning/generate-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_id: selectedImportId, window_start: weekStart, scope: 'week', intent: 'balanced' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Recalcul de la semaine impossible')
      await refreshImports()
      setReloadKey((value) => value + 1)
      setRepairStatus('idle')
      toast.success('Semaine recalculée : les repas non verrouillés ont été remplacés')
    } catch (error) {
      setRepairStatus('error')
      toast.error(error.message)
    }
  }

  function openModification({ scope = 'week', date = null, type = null } = {}) {
    setModifyScope(scope)
    setModifyDays(scope === 'days' && date ? [date] : [])
    setModifyMeals(scope === 'meals' && date && type ? [{ date, type }] : [])
    setIntent('balanced')
    setInstructions('')
    setModifyStatus('idle')
    setModifyOpen(true)
  }

  function toggleDay(date) {
    setModifyDays((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date].sort())
  }

  function toggleMeal(date, type) {
    setModifyMeals((current) => current.some((meal) => meal.date === date && meal.type === type)
      ? current.filter((meal) => !(meal.date === date && meal.type === type))
      : [...current, { date, type }])
  }

  async function applyModification() {
    if (modifyScope === 'days' && !modifyDays.length) return
    if (modifyScope === 'meals' && !modifyMeals.length) return
    setModifyStatus('saving')
    try {
      const response = await authFetch('/api/planning/generate-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_id: selectedImportId,
          window_start: weekStart,
          scope: selectedImportId ? modifyScope : 'week',
          days: modifyScope === 'days' ? modifyDays : [],
          meals: modifyScope === 'meals' ? modifyMeals : [],
          intent,
          instructions: instructions.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'La modification a échoué')
      await refreshImports()
      setReloadKey((value) => value + 1)
      setModifyOpen(false)
      const recalculated = data.summary?.personalized_meals || data.summary?.changed || 14
      toast.success(`${recalculated} prises personnalisées recalculées avec les règles du foyer`)
    } catch (error) {
      setModifyStatus('error')
      toast.error(error.message)
    }
  }

  async function planBatch() {
    if (!selectedImportId || batchStatus === 'saving') return
    setBatchStatus('saving')
    try {
      const response = await authFetch('/api/planning/batch/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importId: selectedImportId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Batch impossible')
      setBatchStatus('done')
      setReloadKey((value) => value + 1)
      toast.success('Les préparations de la semaine sont prêtes')
      // P0-6 (audit F18) : accès direct au jour de cuisine après le calcul.
      router.push(`/planning/${selectedImportId}/batch`)
    } catch (error) {
      setBatchStatus('error')
      toast.error(error.message)
    }
  }

  const plannedSlots = new Set(meals
    .filter((meal) => ['dejeuner', 'diner'].includes(meal.meal_type))
    .map((meal) => `${meal.meal_date}|${meal.meal_type}`)).size
  const personalizedMeals = new Set(meals.map((meal) => `${meal.meal_date}|${meal.meal_type}|${meal.person_name}`)).size
  const plannedDays = new Set(meals.map((meal) => meal.meal_date)).size

  // Prises attendues sur la semaine — formule héritée de l'ancienne réparation
  // automatique : 3 prises/jour/personne + 1 collation pour Julien. Règle codée
  // en dur (audit F19, hors périmètre P0) : la source de vérité future est
  // memberRules / household_members.preferences.
  const goalPeople = [...new Set(nutritionGoals.map((goal) => goal.person_name).filter(Boolean))]
  const expectedPerDay = goalPeople.length * 3 + (goalPeople.some((name) => name.localeCompare('Julien', 'fr', { sensitivity: 'base' }) === 0) ? 1 : 0)
  const expectedMeals = expectedPerDay * 7
  const prepTaskCount = (weekData?.prepTasks || []).length
  const readiness = computeWeekReadiness({ expectedMeals, uniqueMealCount: personalizedMeals, prepTaskCount })

  const rangeLabel = `${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
  const nextWeekStart = addDays(localIso(mondayForOffset(0)), 7)
  const nextWeekReady = imports.some((item) => item.file_name === 'myko-canonical-v3' && item.date_range_start === nextWeekStart)
  const loading = authLoading || !importsLoaded
  const weekLoading = weekStatus === 'loading'
  // Un import sélectionné n'est « évalué » que si sa semaine est réellement
  // chargée ; sans import ('idle'), l'absence de données EST l'évaluation.
  const weekAssessed = !loading && goalsStatus !== 'loading' && (selectedImportId ? weekStatus === 'ready' : true)

  return (
    <main className="planning-shell">
      <header className="planning-overview">
        <div>
          <span className="planning-kicker">Planning du foyer</span>
          {/* F16 : « La semaine est prête. » uniquement quand toutes les prises
              attendues et au moins une tâche de préparation existent. */}
          <h1>
            {!weekAssessed
              ? 'Planning de la semaine.'
              : readiness.ready
                ? 'La semaine est prête.'
                : expectedMeals > 0
                  ? `Semaine incomplète — ${personalizedMeals}/${expectedMeals} prises`
                  : 'Semaine à vérifier.'}
          </h1>
          <p>
            {weekAssessed && !readiness.ready && expectedMeals === 0
              ? 'Les objectifs nutritionnels du foyer sont indisponibles : impossible de vérifier les prises attendues.'
              : 'Recettes, stock, équilibre et courses recalculés ensemble — sans attente ni génération opaque.'}
          </p>
        </div>
        <div className="planning-overview-actions">
          <div className={`planning-horizon ${horizonStatus}`}>
            {horizonStatus === 'preparing' ? <RefreshCw size={15} className="planning-spin" /> : <Check size={15} />}
            <span>{horizonStatus === 'preparing' ? 'Préparation des deux semaines…' : nextWeekReady ? 'Semaine suivante déjà prête' : 'Horizon à compléter'}</span>
          </div>
          <button className="planning-primary" onClick={() => openModification({ scope: 'week' })}>
            <Sparkles size={16} /> {selectedImportId ? 'Modifier la semaine' : 'Préparer cette semaine'}
          </button>
        </div>
      </header>

      {/* P0-5/P0-7 (F16/F17) : état explicite d'une semaine incomplète, avec
          régénération UNIQUEMENT sur action de l'utilisateur — plus de POST
          silencieux au chargement. */}
      {weekAssessed && selectedImportId && !readiness.ready && (
        <section className="planning-incomplete" role="status">
          <AlertTriangle size={16} />
          <div className="planning-incomplete-text">
            <b>Semaine incomplète</b>
            <p>
              {readiness.reason === 'goals_missing'
                ? 'Objectifs nutritionnels indisponibles : le nombre de prises attendues ne peut pas être vérifié.'
                : readiness.reason === 'meals_missing'
                  ? `${readiness.missingMeals} prise${readiness.missingMeals > 1 ? 's' : ''} manquante${readiness.missingMeals > 1 ? 's' : ''} sur les ${expectedMeals} attendues (petits-déjeuners, collations ou variantes non générés).`
                  : 'Aucune tâche de préparation n’est planifiée pour cette semaine.'}
            </p>
          </div>
          {readiness.reason !== 'goals_missing' && (
            <button className="planning-repair" onClick={repairWeek} disabled={repairStatus === 'saving'}>
              <RefreshCw size={14} className={repairStatus === 'saving' ? 'planning-spin' : undefined} />
              {repairStatus === 'saving' ? 'Recalcul en cours…' : 'Recalculer la semaine (remplace les repas non verrouillés)'}
            </button>
          )}
        </section>
      )}

      {/* Échec de CHARGEMENT de la semaine : message d'erreur explicite — jamais
          la bannière « Semaine incomplète » ni son bouton « Recalculer » (qui
          remplacerait des repas peut-être présents mais illisibles). */}
      {!loading && selectedImportId && weekStatus === 'error' && (
        <section className="planning-incomplete" role="alert">
          <AlertTriangle size={16} />
          <div className="planning-incomplete-text">
            <b>Semaine impossible à charger</b>
            <p>Les repas de cette semaine n’ont pas pu être lus. Rien n’a été modifié — réessaie dans un instant.</p>
          </div>
          <button className="planning-repair" onClick={() => setReloadKey((value) => value + 1)}>
            <RefreshCw size={14} /> Réessayer
          </button>
        </section>
      )}

      <section className="planning-summary" aria-label="Résumé de la semaine">
        <div><CalendarDays size={18} /><span><b>{rangeLabel}</b><small>Semaine affichée</small></span></div>
        <div className={weekAssessed && !readiness.ready ? 'planning-summary-warn' : undefined}>
          {weekAssessed && !readiness.ready ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>
            <b>{expectedMeals > 0 ? `${personalizedMeals}/${expectedMeals} prises` : `${personalizedMeals || plannedSlots} prises`}</b>
            <small>{!weekAssessed ? `${plannedDays || 7} jours personnalisés` : readiness.ready ? `${plannedDays || 7} jours personnalisés` : 'Semaine incomplète'}</small>
          </span>
        </div>
        <div><ShoppingBasket size={18} /><span><b>{shoppingItems.length} produits</b><small>À prévoir aux courses</small></span></div>
        <div><Clock3 size={18} /><span><b>{batchRecipes.length} préparations</b><small>Organisation en avance</small></span></div>
      </section>

      {loading ? (
        <section className="planning-loading" aria-busy="true">
          <RefreshCw className="planning-spin" /> Mise en place du planning…
        </section>
      ) : (
        <div className="planning-workspace">
          <section className="planning-main">
            {selectedImportId && weekStatus === 'ready' && <WeeklyNutritionRecap meals={meals} goals={nutritionGoals} />}
            {weekLoading ? (
              <div className="planning-loading" aria-busy="true"><RefreshCw className="planning-spin" /> Chargement de la semaine…</div>
            ) : selectedImportId && weekStatus === 'error' ? (
              <div className="planning-empty">
                <AlertTriangle size={30} />
                <h2>La semaine n’a pas pu être chargée.</h2>
                <p>Les repas existent peut-être déjà : rien n’a été modifié.</p>
                <button className="planning-primary" onClick={() => setReloadKey((value) => value + 1)}>Réessayer</button>
              </div>
            ) : selectedImportId ? (
              <WeekGrid
                meals={meals}
                weekDates={weekDates}
                weekOffset={weekOffset}
                onPrevWeek={() => setWeekOffset((value) => value - 1)}
                onNextWeek={() => setWeekOffset((value) => value + 1)}
                importId={selectedImportId}
                onModifyDay={(date) => openModification({ scope: 'days', date })}
                onModifyMeal={(date, type) => openModification({ scope: 'meals', date, type })}
              />
            ) : (
              <div className="planning-empty">
                <CalendarDays size={30} />
                <h2>Cette semaine n’est pas encore dressée.</h2>
                <p>Myko peut la composer immédiatement avec les règles fixes du foyer.</p>
                <button className="planning-primary" onClick={() => openModification({ scope: 'week' })}>Préparer la semaine</button>
              </div>
            )}
          </section>

          <aside className="planning-side">
            <article className="planning-side-card accent">
              <span className="planning-side-label">Cuisine en avance</span>
              <h2>Préparer sans courir</h2>
              <p>Les déjeuners compatibles sont regroupés en sessions de cuisine et reliés aux jours où ils seront servis.</p>
              <button onClick={planBatch} disabled={!selectedImportId || batchStatus === 'saving'}>
                {batchStatus === 'saving' ? <RefreshCw size={14} className="planning-spin" /> : <Clock3 size={14} />}
                {batchRecipes.length ? 'Recalculer les préparations' : 'Organiser les préparations'}
              </button>
              {/* P0-6 (F18) : accès permanent à la page batch quand des préparations existent. */}
              {selectedImportId && batchRecipes.length > 0 && (
                <button className="planning-batch-link" onClick={() => router.push(`/planning/${selectedImportId}/batch`)}>
                  <ArrowRight size={14} /> Voir les préparations
                </button>
              )}
            </article>
            <article className="planning-side-card">
              <span className="planning-side-label">Courses</span>
              <h2>{shoppingItems.length ? `${shoppingItems.length} produits à prévoir` : 'Tout est couvert'}</h2>
              <p>La liste tient compte des quantités réservées dans le stock pour toute la semaine.</p>
              <button onClick={() => router.push('/courses')}><ShoppingBasket size={14} /> Ouvrir les courses</button>
            </article>
          </aside>
        </div>
      )}

      {modifyOpen && (
        <div className="planning-modify-overlay" onClick={() => modifyStatus !== 'saving' && setModifyOpen(false)}>
          <section className="planning-modify" role="dialog" aria-modal="true" aria-labelledby="modify-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span className="planning-kicker">Ajustement déterministe</span><h2 id="modify-title">Que faut-il modifier ?</h2></div>
              <button className="planning-close" onClick={() => setModifyOpen(false)} disabled={modifyStatus === 'saving'} aria-label="Fermer"><X size={18} /></button>
            </header>

            <div className="planning-scope-tabs">
              <button className={modifyScope === 'week' ? 'active' : ''} onClick={() => setModifyScope('week')}>Toute la semaine</button>
              <button className={modifyScope === 'days' ? 'active' : ''} onClick={() => setModifyScope('days')}>Un ou plusieurs jours</button>
              <button className={modifyScope === 'meals' ? 'active' : ''} onClick={() => setModifyScope('meals')}>Un ou plusieurs repas</button>
            </div>

            {modifyScope === 'days' && (
              <div className="planning-day-picker">
                {weekDates.map((date, index) => {
                  const iso = localIso(date)
                  return <button key={iso} className={modifyDays.includes(iso) ? 'active' : ''} onClick={() => toggleDay(iso)}><span>{DAY_SHORT[index]}</span><b>{date.getDate()}</b></button>
                })}
              </div>
            )}

            {modifyScope === 'meals' && (
              <div className="planning-meal-picker">
                {weekDates.map((date, index) => {
                  const iso = localIso(date)
                  return <div key={iso}><span><b>{DAY_SHORT[index]}</b> {date.getDate()}</span>{['dejeuner', 'diner'].map((type) => <button key={type} className={modifyMeals.some((meal) => meal.date === iso && meal.type === type) ? 'active' : ''} onClick={() => toggleMeal(iso, type)}>{type === 'dejeuner' ? 'Midi' : 'Soir'}</button>)}</div>
                })}
              </div>
            )}

            <div className="planning-intents">
              <span className="planning-field-label">Priorité pour les repas remplacés</span>
              <div>{INTENTS.map((item) => <button key={item.value} className={intent === item.value ? 'active' : ''} onClick={() => setIntent(item.value)}><b>{item.label}</b><small>{item.detail}</small></button>)}</div>
            </div>

            <label className="planning-instructions">
              <span className="planning-field-label">Demande précise <small>facultatif</small></span>
              <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} placeholder="Ex. : plus rapide, végétarien, utiliser le stock urgent…" />
              <small>Les mots-clés sont traduits en règles fixes ; aucun appel à une IA n’est nécessaire.</small>
            </label>

            <footer>
              <p>Les repas non sélectionnés restent inchangés. Stock et courses sont recalculés pour toute la semaine.</p>
              <button className="planning-primary" onClick={applyModification} disabled={modifyStatus === 'saving' || (modifyScope === 'days' && !modifyDays.length) || (modifyScope === 'meals' && !modifyMeals.length)}>
                {modifyStatus === 'saving' ? <RefreshCw size={15} className="planning-spin" /> : <RefreshCw size={15} />}
                {modifyStatus === 'saving' ? 'Recalcul en cours…' : 'Appliquer maintenant'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}
