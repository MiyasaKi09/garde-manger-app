'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Check, Refrigerator, AlertTriangle } from 'lucide-react'
import CookSession from '@/app/planning/components/CookSession'
import { isDishExpired, pickDisplayedCookedDish } from '@/lib/domain/planning/cookedDishDisplay'
import './BatchPage.css'

const DOW = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const dayShort = (iso) => {
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : DOW[d.getDay()]
}
const frDate = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
const cleanName = (name) => (name || 'Préparation').split('\n')[0].replace(/^B\d+\s*[—–-]\s*/, '').trim()
const frNum = (value) => String(Math.round((Number(value) || 0) * 100) / 100).replace('.', ',')

// Ingrédients d'une préparation : ingredients_json ([{name, quantity, unit}])
// en priorité, repli sur le texte ·-séparé legacy. Retourne un texte multi-ligne.
function formatIngredients(recipe) {
  const json = recipe?.ingredients_json
  if (Array.isArray(json) && json.length) {
    const lines = json
      .map(i => {
        if (!i) return null
        if (typeof i === 'string') return i.trim() || null
        const name = String(i.name || '').trim()
        if (!name) return null
        const qty = [i.quantity, i.unit].filter(v => v != null && String(v).trim() !== '').join(' ')
        return qty ? `${name} — ${qty}` : name
      })
      .filter(Boolean)
    if (lines.length) return lines.join('\n')
  }
  if (recipe?.ingredients) return String(recipe.ingredients).replace(/\s*[·|]\s*/g, '\n')
  return null
}

export default function BatchPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [doneMap, setDoneMap] = useState({}) // taskId -> bool (persisté)
  const [cookedMap, setCookedMap] = useState({}) // batch_recipe_id -> cooked_dish (en stock)
  const [cookingId, setCookingId] = useState(null) // gardé pour compatibilité (spinner undo etc.)
  const [cookSheet, setCookSheet] = useState(null) // meal passé à CookSession en mode batchCook
  // Plan canonique (Lot P3 volet B) : productions planifiées + dépendances de
  // tâches de la version active — lues directement (lecture seule, RLS).
  const [canonical, setCanonical] = useState({ productions: [], dependencies: [] })

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await authFetch(`/api/planning/imports/${importId}`)
      if (!res.ok) { router.push('/planning'); return }
      const d = await res.json()
      setData(d)
      const m = {}
      for (const t of (d.prepTasks || [])) m[t.id] = !!t.done
      setDoneMap(m)
      // Sessions dérivées du plan canonique (audit §13) : productions
      // planifiées et dépendances (réchauffer ← préparer) de la version
      // active. Lecture seule côté client (RLS user_id) — les mutations
      // restent dans les API routes.
      const closedLoopTasks = (d.prepTasks || []).filter(t => t.source === 'closed_loop' && t.plan_version_id)
      if (closedLoopTasks.length) {
        const versionIds = [...new Set(closedLoopTasks.map(t => t.plan_version_id))]
        const [{ data: productions, error: prodErr }, { data: dependencies, error: depErr }] = await Promise.all([
          supabase
            .from('planned_productions')
            .select('id, plan_version_id, source_task_id, production_key, output_name, planned_portions, storage_method, available_from, use_by, status')
            .in('plan_version_id', versionIds)
            .neq('status', 'cancelled'),
          supabase
            .from('prep_task_dependencies')
            .select('id, plan_version_id, task_id, depends_on_task_id')
            .in('plan_version_id', versionIds),
        ])
        if (!prodErr && !depErr) {
          setCanonical({ productions: productions || [], dependencies: dependencies || [] })
        }
      }
      // Plats déjà cuisinés (en stock) pour les préparations de cet import.
      // Un expiré et un frais recuit peuvent partager le même batch_recipe_id
      // (P0-3) : on affiche le frais le plus récent, sinon l'expiré le plus
      // récent (état « Périmé — à retirer »).
      const ids = (d.batchRecipes || []).map(r => r.id)
      if (ids.length) {
        const { data: cooked, error: cookedErr } = await supabase
          .from('cooked_dishes')
          .select('id, batch_recipe_id, portions_remaining, portions_cooked, expiration_date, storage_method, cooked_at')
          .in('batch_recipe_id', ids)
        if (!cookedErr) {
          const byBatch = new Map()
          for (const c of (cooked || [])) {
            if (!byBatch.has(c.batch_recipe_id)) byBatch.set(c.batch_recipe_id, [])
            byBatch.get(c.batch_recipe_id).push(c)
          }
          const cm = {}
          for (const [batchId, dishes] of byBatch) {
            const displayed = pickDisplayedCookedDish(dishes)
            if (displayed) cm[batchId] = displayed
          }
          setCookedMap(cm)
        }
      }
      setLoading(false)
    }
    load()
  }, [importId])

  function cookPrep(recipe) {
    setCookSheet({
      batch: true,
      batchRecipeId: recipe.id,
      dishName: cleanName(recipe.name),
      portionsTotal: recipe.portions_total || 1,
      type: 'dejeuner',
    })
  }

  function handleBatchCooked(data) {
    if (data?.dish) {
      setCookedMap(prev => ({ ...prev, [data.dish.batch_recipe_id]: data.dish }))
    }
  }

  async function uncookPrep(recipe) {
    // On retire UNIQUEMENT le plat affiché (id exact) : « retirer » un expiré
    // ne doit jamais détruire un plat frais recuit du même batch_recipe_id.
    const displayed = cookedMap[recipe.id]
    setCookedMap(prev => { const n = { ...prev }; delete n[recipe.id]; return n })
    try {
      await authFetch('/api/planning/batch/cook', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchRecipeId: recipe.id, cookedDishId: displayed?.id ?? null }),
      })
    } catch { /* l'UI a déjà retiré l'état */ }
  }

  async function toggleTask(task) {
    const next = !doneMap[task.id]
    setDoneMap(prev => ({ ...prev, [task.id]: next }))
    try {
      const res = await authFetch(`/api/planning/prep-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: next }),
      })
      if (!res.ok) throw new Error('patch failed')
    } catch {
      setDoneMap(prev => ({ ...prev, [task.id]: !next })) // revert
    }
  }

  // ── Sessions « jour de cuisine » : groupées par cook_date (modèle prépa à l'avance). ──
  const sessions = useMemo(() => {
    if (!data) return []
    const meals = data.meals || []
    const allTasks = data.prepTasks || []
    // Tâches batch/legacy (générateur) d'un côté, tâches canoniques
    // versionnées (source='closed_loop', audit F09) de l'autre : quand un
    // plan canonique existe, la check-list du jour de cuisine devient ses
    // tâches « Préparer X » (leur validation matérialise la production, P2).
    const prepTasks = allTasks.filter(t => t.source !== 'closed_loop')
    const closedLoop = allTasks.filter(t => t.source === 'closed_loop')
    const prepareTasks = closedLoop.filter(t => ['prepare_recipe', 'prepare_recipe_variant', 'prepare_support'].includes(t.task_type))
    const recipes = data.batchRecipes || []

    // Index canoniques : production par tâche source, tâches dépendantes
    // (réchauffer ← préparer) par tâche parente.
    const taskById = new Map(closedLoop.map(t => [String(t.id), t]))
    const productionByTask = new Map()
    for (const p of canonical.productions) {
      if (p.source_task_id != null) productionByTask.set(String(p.source_task_id), p)
    }
    const dependentsByTask = new Map()
    for (const dep of canonical.dependencies) {
      const parentKey = String(dep.depends_on_task_id)
      const child = taskById.get(String(dep.task_id))
      if (!child) continue
      if (!dependentsByTask.has(parentKey)) dependentsByTask.set(parentKey, [])
      dependentsByTask.get(parentKey).push(child)
    }

    // Résumé canonique d'un jour de session (audit §13 : « Dimanche · 75 min
    // actives · 3 préparations · 10 portions · couvre 6 repas »).
    const canonicalInfoFor = (date) => {
      const dayPrepares = prepareTasks.filter(t => t.prep_date === date)
      if (!dayPrepares.length) return null
      let minutes = 0
      let portions = 0
      const followUps = []
      for (const t of dayPrepares) {
        minutes += Number(t.duration_min) || 0
        const production = productionByTask.get(String(t.id)) || null
        if (production) portions += Number(production.planned_portions) || 0
        for (const child of (dependentsByTask.get(String(t.id)) || [])) {
          followUps.push({ task: child, production })
        }
      }
      followUps.sort((a, b) => (a.task.prep_date || '').localeCompare(b.task.prep_date || ''))
      return {
        prepares: dayPrepares,
        minutes,
        portions,
        covers: dayPrepares.length + followUps.length,
        followUps,
      }
    }

    // jours couverts par chaque préparation (repas → batch_recipe_id)
    const coverByBatch = new Map()
    for (const m of meals) {
      if (!m.batch_recipe_id) continue
      if (!coverByBatch.has(m.batch_recipe_id)) coverByBatch.set(m.batch_recipe_id, new Set())
      coverByBatch.get(m.batch_recipe_id).add(m.meal_date)
    }
    const daysOf = (r) => [...(coverByBatch.get(r.id) || [])].sort().map(dayShort)

    const mkSession = (date, label, sRecipes, sTasks) => {
      const canon = date ? canonicalInfoFor(date) : null
      // Check-list : les tâches du générateur si présentes, sinon les tâches
      // canoniques « Préparer » du jour (même endpoint PATCH, même persistance).
      const tasks = sTasks.length ? sTasks : (canon ? canon.prepares : [])
      return {
        date, label,
        recipes: sRecipes,
        tasks,
        daysOf,
        canonical: canon,
        portions: canon ? canon.portions : sRecipes.reduce((s, r) => s + (Number(r.portions_total) || 0), 0),
        minutes: canon ? canon.minutes : sTasks.reduce((s, t) => {
          const m = (t.estimated_time || '').match(/(\d+)\s*min/i)
          return s + (m ? parseInt(m[1], 10) : 0)
        }, 0),
      }
    }

    if (recipes.some(r => r.cook_date)) {
      const keys = [...new Set([
        ...recipes.map(r => r.cook_date).filter(Boolean),
        ...prepareTasks.map(t => t.prep_date).filter(Boolean),
      ])].sort()
      return keys.map(date => mkSession(
        date, null,
        recipes.filter(r => r.cook_date === date),
        prepTasks.filter(t => t.prep_date === date),
      ))
    }

    // Plan canonique publié mais dérivation batch pas encore lancée : les
    // sessions viennent des tâches « Préparer X » groupées par jour (§13).
    if (prepareTasks.length) {
      const keys = [...new Set(prepareTasks.map(t => t.prep_date).filter(Boolean))].sort()
      return keys.map(date => mkSession(date, null, [], []))
    }

    // ── Legacy : pas de cook_date → on groupe les tâches par prep_date, recettes en référence. ──
    const map = {}
    for (const t of prepTasks) {
      const key = t.prep_date || 'unknown'
      if (!map[key]) map[key] = { date: t.prep_date, label: t.prep_label, tasks: [] }
      map[key].tasks.push(t)
    }
    const arr = Object.values(map)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(g => mkSession(g.date, g.label, [], g.tasks))
    if (recipes.length) {
      if (arr.length) arr[0].recipes = recipes
      else arr.push(mkSession(null, 'Préparations', recipes, []))
    }
    return arr
  }, [data, canonical])

  function cookDateLabel(date, label) {
    if (label) return label
    if (!date) return 'Préparations'
    return `Cuisine du ${new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
  }

  if (loading) return (
    <div className="v21-page" aria-busy="true" aria-label="Chargement">
      <div className="v21-skel" style={{ height: 90, marginBottom: 24 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="v21-skel" style={{ height: 96, marginBottom: 14 }} />
      ))}
    </div>
  )
  if (!data) return null

  const hasAnything = sessions.some(s => s.tasks.length || s.recipes.length)

  return (
    <>
      <div className="v21-page">
        <button className="bat-back" onClick={() => router.push('/planning')}>
          <ArrowLeft size={15} /> Retour au planning
        </button>

        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning · batch cooking</span>
            <h1 className="v21-title">Jour de cuisine.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">On cuisine tout en lots, on portionne en barquettes — puis la semaine, on réchauffe.</p>
          </div>
        </header>

        {!hasAnything && (
          <section className="v21-section flush">
            <div className="v21-empty">
              <p>Pas encore de préparations publiées. Demande ou recalcule le planning : Myko publiera les sessions, les variantes et les quantités avec le reste de la semaine.</p>
              <button className="v21-btn" onClick={() => router.push('/planning')}>← Retour au planning</button>
            </div>
          </section>
        )}

        {sessions.map((sess, si) => {
          const total = sess.tasks.length
          const done = sess.tasks.filter(t => doneMap[t.id]).length
          const pct = total ? Math.round((done / total) * 100) : 0
          const allDone = total > 0 && done === total

          return (
            <section key={si} className="bat-sess">
              {/* En-tête de session — format §13 quand le plan canonique existe */}
              <div className="bat-sess-h">
                <div className="bat-sess-date">{cookDateLabel(sess.date, sess.label)}</div>
                <div className="bat-sess-meta">
                  {sess.canonical ? (
                    <>
                      {sess.canonical.minutes > 0 && <span>{sess.canonical.minutes} min actives</span>}
                      <span>{sess.canonical.prepares.length} préparation{sess.canonical.prepares.length > 1 ? 's' : ''}</span>
                      {sess.canonical.portions > 0 && <span>{frNum(sess.canonical.portions)} portions</span>}
                      <span>couvre {sess.canonical.covers} repas</span>
                    </>
                  ) : (
                    <>
                      {sess.recipes.length > 0 && <span>{sess.recipes.length} plat{sess.recipes.length > 1 ? 's' : ''}</span>}
                      {sess.portions > 0 && <span>{frNum(sess.portions)} portions</span>}
                      {sess.minutes > 0 && <span>≈ {sess.minutes} min</span>}
                    </>
                  )}
                </div>
              </div>

              {/* Dépendances du plan canonique : réchauffer ← préparer (F10/§13) */}
              {sess.canonical && sess.canonical.followUps.length > 0 && (
                <div className="bat-deps">
                  {sess.canonical.followUps.map(({ task, production }) => (
                    <div key={task.id} className="bat-dep">
                      <span className="bat-dep-when">{dayShort(task.prep_date)} {frDate(task.prep_date)}</span>
                      <span className="bat-dep-t">{task.task}</span>
                      <span className="bat-dep-arrow">
                        ← préparé ce jour{production?.storage_method === 'freezer' ? ' · congelé, décongeler la veille' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Avancement de la check-list */}
              {total > 0 && (
                <div className="bat-prog">
                  <div className="bat-prog-bar"><div className="bat-prog-fill" style={{ width: `${pct}%` }} /></div>
                  <span className={`bat-prog-n${allDone ? ' done' : ''}`}>
                    {allDone ? 'Tout est prêt 🎉' : `${done}/${total} fait${done > 1 ? 's' : ''}`}
                  </span>
                </div>
              )}

              {/* Check-list persistante */}
              {sess.tasks.length > 0 && (
                <div className="bat-list">
                  {sess.tasks.map(task => {
                    const isOn = !!doneMap[task.id]
                    return (
                      <button
                        key={task.id}
                        type="button"
                        className={`bat-item${isOn ? ' on' : ''}`}
                        onClick={() => toggleTask(task)}
                        aria-pressed={isOn}
                      >
                        <span className={`bat-ck${isOn ? ' on' : ''}`}>{isOn && <Check size={11} color="#fff" />}</span>
                        <span className="bat-item-t">{task.task}</span>
                        {task.estimated_time && !/🎉/.test(task.estimated_time) && (
                          <span className="bat-item-time">{task.estimated_time}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Préparations (recettes du lot) */}
              {sess.recipes.length > 0 && (
                <div className="bat-preps">
                  <div className="v21-bh"><span className="v21-bl">Les préparations</span></div>
                  {sess.recipes.map((recipe, i) => {
                    const key = `${si}-${i}`
                    const name = cleanName(recipe.name)
                    const open = expanded === key
                    const days = sess.daysOf(recipe)
                    return (
                      <div key={key} className="bat-prep">
                        <button type="button" className="bat-prep-head" onClick={() => setExpanded(open ? null : key)} aria-expanded={open}>
                          <span className="bat-prep-main">
                            <span className="bat-prep-name">{name}</span>
                            {recipe.conservation && <span className="bat-prep-keep">{recipe.conservation}</span>}
                          </span>
                          <span className="bat-prep-meta">
                            {recipe.portions_total ? <span className="bat-prep-port">{recipe.portions_total} portions</span> : null}
                            {days.length > 0 && <span>couvre {days.join(' · ')}</span>}
                          </span>
                          {open ? <ChevronUp size={16} color="var(--ink-3)" /> : <ChevronDown size={16} color="var(--ink-3)" />}
                        </button>
                        {(() => {
                          const cooked = cookedMap[recipe.id]
                          // Plat périmé (DLC dépassée, comparaison UTC) : état explicite
                          // non consommable — on garde le bouton « retirer » (audit F02 / test H).
                          if (cooked && isDishExpired(cooked.expiration_date)) return (
                            <div className="bat-prep-cook bat-prep-cook-expired">
                              <AlertTriangle size={13} />
                              <span>Périmé — à retirer · {cooked.portions_remaining}/{cooked.portions_cooked} portion{cooked.portions_cooked > 1 ? 's' : ''} · DLC dépassée le {frDate(cooked.expiration_date)}</span>
                              <button className="bat-cook-undo" onClick={() => uncookPrep(recipe)}>retirer</button>
                            </div>
                          )
                          if (cooked) return (
                            <div className="bat-prep-cook done">
                              <Refrigerator size={13} />
                              <span>Au stock · {cooked.portions_remaining}/{cooked.portions_cooked} portion{cooked.portions_cooked > 1 ? 's' : ''}{cooked.expiration_date ? ` · à manger avant le ${frDate(cooked.expiration_date)}` : ''}</span>
                              <button className="bat-cook-undo" onClick={() => uncookPrep(recipe)}>retirer</button>
                            </div>
                          )
                          return (
                            <div className="bat-prep-cook">
                              <button className="bat-cook-btn" onClick={() => cookPrep(recipe)}>
                                <Refrigerator size={13} /> Cuisiner &amp; déduire du stock
                              </button>
                            </div>
                          )
                        })()}
                        {open && (
                          <div className="bat-prep-detail">
                            {(() => {
                              // v5 : ingredients_json (jsonb structuré) d'abord,
                              // repli sur le texte ·-séparé des imports legacy.
                              const text = formatIngredients(recipe)
                              if (!text) return null
                              return <div className="bat-r-block"><span className="bat-r-l">Ingrédients</span><div className="bat-r-t">{text}</div></div>
                            })()}
                            {recipe.instructions && <div className="bat-r-block"><span className="bat-r-l">Préparation</span><div className="bat-r-t">{recipe.instructions}</div></div>}
                            {recipe.portions && !recipe.portions_total && <div className="bat-r-block"><span className="bat-r-l">Portions</span><div className="bat-r-t">{recipe.portions}</div></div>}
                            {recipe.reheat && <div className="bat-r-reheat"><b>Réchauffage —</b> {recipe.reheat}</div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <CookSession
        open={!!cookSheet}
        meal={cookSheet}
        onClose={() => setCookSheet(null)}
        onDone={handleBatchCooked}
      />

      <style jsx>{`
        .bat-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .bat-back:hover { color: var(--terracotta); }

        .bat-sess { padding: 26px 0 8px; border-top: 1.5px solid var(--ink-1); }
        .bat-sess:first-of-type { border-top: none; }
        .bat-sess-h { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
        .bat-sess-date {
          font-family: var(--font-display); font-size: 24px; font-weight: 600;
          letter-spacing: -0.02em; color: var(--ink-1); text-transform: capitalize; line-height: 1.05;
        }
        .bat-sess-meta { display: flex; gap: 8px; flex-wrap: wrap; }
        .bat-sess-meta span {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--ink-2); border: 1px solid var(--line-strong); border-radius: 3px; padding: 3px 8px;
        }

        /* Avancement */
        .bat-prog { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .bat-prog-bar { flex: 1; height: 4px; background: var(--line); border-radius: 2px; overflow: hidden; }
        .bat-prog-fill { height: 100%; background: var(--brand); transition: width 0.25s ease; }
        .bat-prog-n { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); letter-spacing: 0.02em; white-space: nowrap; }
        .bat-prog-n.done { color: var(--brand); font-weight: 600; }

        /* Check-list */
        .bat-list { display: flex; flex-direction: column; margin-bottom: 8px; }
        .bat-item {
          display: flex; align-items: flex-start; gap: 13px; width: 100%; text-align: left;
          padding: 14px 4px; background: transparent; border: none; border-bottom: 1px solid var(--line);
          cursor: pointer; transition: background 0.12s ease;
        }
        .bat-item:hover { background: var(--surface-soft); }
        .bat-ck {
          flex: none; width: 19px; height: 19px; margin-top: 1px;
          border: 1.5px solid var(--line-strong); border-radius: 4px; background: var(--paper);
          display: inline-flex; align-items: center; justify-content: center;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .bat-item:hover .bat-ck { border-color: var(--terracotta); }
        .bat-ck.on { background: var(--brand); border-color: var(--brand); }
        .bat-item-t { flex: 1; min-width: 0; font-family: var(--font-text); font-size: 14.5px; color: var(--ink-1); line-height: 1.45; }
        .bat-item.on .bat-item-t { text-decoration: line-through; color: var(--ink-3); }
        .bat-item-time { flex: none; font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); white-space: nowrap; margin-top: 2px; }

        /* Préparations */
        .bat-preps { margin-top: 20px; }
        .bat-preps .v21-bh { margin-bottom: 4px; }
        .bat-prep { border-bottom: 1px solid var(--line); }
        .bat-prep-head {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 14px 4px; background: transparent; border: none; cursor: pointer; text-align: left;
          transition: background 0.15s ease;
        }
        .bat-prep-head:hover { background: var(--surface-soft); }
        .bat-prep-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .bat-prep-name { font-family: var(--font-display); font-size: 17px; font-weight: 500; color: var(--ink-1); }
        .bat-prep-keep { font-family: var(--font-mono); font-size: 10.5px; color: #6E7A3F; letter-spacing: 0.01em; line-height: 1.4; text-transform: none; }

        /* Action « cuisiné → au stock » */
        .bat-prep-cook { padding: 0 4px 12px; }
        .bat-cook-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: transparent; border: 1px solid var(--line-strong); border-radius: 3px;
          padding: 8px 12px; cursor: pointer;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.02em; color: var(--ink-1);
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .bat-cook-btn:hover:not(:disabled) { border-color: var(--terracotta); color: var(--terracotta); }
        .bat-cook-btn:disabled { opacity: 0.6; cursor: default; }
        .bat-prep-cook.done {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.01em; color: #4f7d3f;
        }
        .bat-prep-cook.done > svg { flex: none; }
        .bat-cook-undo {
          background: none; border: none; cursor: pointer; padding: 0 0 0 6px;
          font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); text-decoration: underline;
        }
        .bat-cook-undo:hover { color: var(--state-expired); }
        .bat-spin { animation: batspin 0.9s linear infinite; }
        @keyframes batspin { to { transform: rotate(360deg); } }
        .bat-prep-meta { display: flex; gap: 10px; align-items: center; flex-shrink: 0; font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.03em; }
        .bat-prep-port { color: var(--terracotta); font-weight: 600; }

        .bat-prep-detail { padding: 0 4px 16px; }
        .bat-r-block { margin-bottom: 12px; }
        .bat-r-l { display: block; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .bat-r-t { font-family: var(--font-text); font-size: 13px; color: var(--ink-2); line-height: 1.6; white-space: pre-line; }
        .bat-r-reheat {
          font-family: var(--font-text); font-size: 12.5px; color: var(--state-soon); line-height: 1.5;
          background: var(--state-soon-bg); border-radius: 3px; padding: 9px 12px; margin-top: 4px;
        }
        .bat-r-reheat b { color: var(--ink-1); }

        @media (max-width: 560px) {
          .bat-item-time { display: none; }
        }
      `}</style>
    </>
  )
}
