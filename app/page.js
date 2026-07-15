'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, CalendarDays, Camera, CheckCircle2, ChefHat,
  Clock3, Package, Plus, RefreshCw, ShoppingCart, Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { readCache, writeCache } from '@/lib/pageCache'
import OcrReviewList from './pantry/components/OcrReviewList'
import SmartAddForm from './pantry/components/SmartAddForm'
import './home.css'

const mealLabels = { pdj: 'Petit-déjeuner', dejeuner: 'Déjeuner', collation: 'Collation', diner: 'Dîner' }

const formatTime = (value) => value
  ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(value))
  : null

function Skeleton() {
  return (
    <div className="today-loading" aria-busy="true" aria-label="Chargement d’aujourd’hui">
      <div className="v21-skel" style={{ height: 150 }} />
      <div className="v21-skel" style={{ height: 82 }} />
      <div className="today-grid"><div className="v21-skel" style={{ height: 320 }} /><div className="v21-skel" style={{ height: 320 }} /></div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showOcr, setShowOcr] = useState(false)

  const loadToday = useCallback(async ({ silent = false, signal } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await authFetch('/api/today', { signal })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Erreur ${response.status}`)
      setToday(data)
      writeCache('today-v3', data)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Impossible de charger la journée')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (!session?.user) { router.push('/login'); return }
      const cached = readCache('today-v3')
      if (cached) { setToday(cached); setLoading(false); loadToday({ silent: true, signal: controller.signal }) }
      else loadToday({ signal: controller.signal })
    })
    return () => { active = false; controller.abort() }
  }, [loadToday, router])

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  if (loading && !today) return <div className="v21-home"><Skeleton /></div>

  if (error && !today) {
    return (
      <main className="v21-home today-error">
        <AlertTriangle size={26} />
        <h1>La journée n’a pas pu être assemblée.</h1>
        <p>{error}</p>
        <button className="v21-btn" onClick={() => loadToday()}><RefreshCw size={14} /> Réessayer</button>
      </main>
    )
  }

  const meals = today?.meals || []
  const tasks = today?.tasks || []
  const alerts = today?.alerts || []
  const shopping = today?.shopping || { requiredCount: 0, items: [] }
  const nutrition = today?.nutritionStatus || []
  const leftovers = today?.leftovers || []
  const nextAction = today?.nextAction

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <main className="v21-home">
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">{dateCap} · boucle fermée</span>
            <h1 className="v21-title">{greeting}.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Une seule prochaine action, calculée depuis le vrai planning et le vrai stock.</p>
          </div>
          <div className="v21-hero-side">
            <button onClick={() => setShowAddForm(true)} className="v21-btn"><Plus size={15} /> Ajouter</button>
            <button onClick={() => setShowOcr(true)} className="v21-btn ghost"><Camera size={15} /> Scanner</button>
          </div>
        </header>

        {nextAction ? (
          <Link href={nextAction.href} className={`today-action ${nextAction.priority >= 90 ? 'urgent' : ''}`}>
            <span className="today-action-label">À faire maintenant</span>
            <strong>{nextAction.title}</strong>
            <span>{nextAction.at ? `${formatTime(nextAction.at)} · ` : ''}{nextAction.type === 'task' ? 'préparation' : nextAction.type === 'meal' ? 'repas' : nextAction.type === 'shopping' ? 'courses' : 'à vérifier'} →</span>
          </Link>
        ) : (
          <div className="today-action done"><CheckCircle2 size={20} /><strong>Rien d’urgent pour le moment.</strong></div>
        )}

        <div className="v21-stats">
          <Link href="/planning" className="v21-stat">
            <span className="v21-stat-l">Repas aujourd’hui</span>
            <span className="v21-stat-v">{meals.length}</span>
            <span className="v21-stat-s">{today?.activePlan ? `plan ${today.activePlan.status}` : 'aucun plan actif'}</span>
          </Link>
          <Link href="/planning" className="v21-stat">
            <span className="v21-stat-l">Préparations</span>
            <span className="v21-stat-v">{tasks.length}</span>
            <span className="v21-stat-s">tâche{tasks.length !== 1 ? 's' : ''} restante{tasks.length !== 1 ? 's' : ''}</span>
          </Link>
          <Link href="/courses" className={`v21-stat ${shopping.requiredCount ? 'alert' : ''}`}>
            <span className="v21-stat-l">Courses</span>
            <span className="v21-stat-v">{shopping.requiredCount}</span>
            <span className="v21-stat-s">forme{shopping.requiredCount !== 1 ? 's' : ''} exacte{shopping.requiredCount !== 1 ? 's' : ''} à acheter</span>
          </Link>
        </div>

        <div className="today-grid">
          <section className="today-panel">
            <div className="v21-bh"><span className="v21-bl">La carte du jour</span><Link href="/planning" className="v21-link">Semaine →</Link></div>
            {meals.length ? (
              <div className="today-meals">
                {meals.map((meal) => {
                  const coverage = Number(meal.stockSummary?.coverage)
                  return (
                    <Link href={meal.href || '/planning'} key={meal.key || meal.id} className="today-meal">
                      <span className="today-meal-type">{mealLabels[meal.type] || meal.type}</span>
                      <strong>{meal.title}</strong>
                      <span className="today-meal-meta">
                        {meal.recipeCode ? `${meal.recipeCode} · ` : ''}
                        {Number.isFinite(coverage) ? `${Math.round(coverage * 100)} % du stock` : 'stock non calculé'}
                      </span>
                      {meal.sensory?.profile && <span className="today-profile">{meal.sensory.profile.replaceAll('_', ' ')}</span>}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="v21-empty"><p>Pas de repas planifié aujourd’hui.</p><Link href="/planning/assistant" className="v21-btn"><Sparkles size={14} /> Composer la semaine</Link></div>
            )}
          </section>

          <section className="today-panel today-side">
            <div className="v21-bh"><span className="v21-bl">Préparations</span></div>
            {tasks.length ? (
              <ol className="today-tasks">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <span className="today-task-time"><Clock3 size={13} /> {formatTime(task.dueAt) || 'Aujourd’hui'}</span>
                    <strong>{task.title}</strong>
                    <span>{task.durationMinutes ? `${task.durationMinutes} min` : task.label}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="today-muted">Aucune préparation en attente.</p>}
          </section>
        </div>

        {(alerts.length > 0 || leftovers.length > 0) && (
          <section className="today-watch">
            <div className="today-watch-head"><h2>À surveiller</h2><span>{alerts.length + leftovers.length} signal{alerts.length + leftovers.length !== 1 ? 'aux' : ''}</span></div>
            <div className="today-watch-list">
              {alerts.map((alert) => (
                <Link href={alert.href || '/pantry'} key={alert.id} className={`today-watch-row ${alert.severity}`}>
                  <AlertTriangle size={15} /><strong>{alert.title}</strong><span>{alert.severity}</span>
                </Link>
              ))}
              {leftovers.map((leftover) => (
                <Link href="/restes" key={`leftover-${leftover.id}`} className="today-watch-row leftover">
                  <ChefHat size={15} /><strong>{leftover.name}</strong><span>{leftover.portionsRemaining} portion{leftover.portionsRemaining !== 1 ? 's' : ''}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="today-grid today-lower">
          <section className="today-panel">
            <div className="v21-bh"><span className="v21-bl">Nutrition enregistrée</span><Link href="/nutrition" className="v21-link">Détails →</Link></div>
            {nutrition.length ? nutrition.map((member) => (
              <div className="today-nutrition" key={member.memberId}>
                <div><strong>{member.memberName}</strong><span>{member.consumed.kcal} kcal consommées</span></div>
                <div className="today-nutrition-bar"><i style={{ width: `${Math.min(member.kcalPercent || 0, 100)}%` }} /></div>
                <small>{member.kcalPercent == null ? 'Objectif non configuré' : `${member.kcalPercent} % de l’objectif · ${member.consumed.proteinG} g protéines`}</small>
              </div>
            )) : <p className="today-muted">Aucun membre actif dans le foyer.</p>}
          </section>

          <section className="today-panel today-side">
            <div className="v21-bh"><span className="v21-bl">Prochaines courses</span><Link href="/courses" className="v21-link">Ouvrir →</Link></div>
            {shopping.items.length ? (
              <ul className="today-shopping">
                {shopping.items.slice(0, 6).map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.purchaseQuantity ? `${Math.ceil(item.purchaseQuantity)} ${item.purchaseUnit || ''}` : item.displayQuantity}</span></li>)}
              </ul>
            ) : <p className="today-muted">Rien à acheter pour le plan actif.</p>}
          </section>
        </div>

        <nav className="v21-nav" aria-label="Navigation rapide">
          <Link href="/planning/assistant" className="v21-navlink"><Sparkles size={15} /> Myko</Link>
          <Link href="/pantry" className="v21-navlink"><Package size={15} /> Stock</Link>
          <Link href="/planning" className="v21-navlink"><CalendarDays size={15} /> Planning</Link>
          <Link href="/courses" className="v21-navlink"><ShoppingCart size={15} /> Courses</Link>
        </nav>
      </main>

      {showAddForm && <SmartAddForm open onClose={() => setShowAddForm(false)} onLotCreated={() => { setShowAddForm(false); loadToday({ silent: true }) }} />}
      {showOcr && <OcrReviewList onClose={() => setShowOcr(false)} onItemsAdded={() => { setShowOcr(false); loadToday({ silent: true }) }} />}
    </>
  )
}
