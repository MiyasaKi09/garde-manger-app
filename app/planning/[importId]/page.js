'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// ── Constants ──
const PDJ_J = { d: "200g skyr + 3 œufs durs", k: 383, p: 44, g: 9, l: 18, f: 0 }

// ── Data transformation (JSON → flat format) ──
function transformMeal(m) {
  if (!m) return { d: "", k: 0, p: 0, g: 0, l: 0, f: 0 }
  return { d: m.desc || "", k: m.kcal || 0, p: m.p || 0, g: m.g || 0, l: m.l || 0, f: m.f || 0 }
}

function transformData(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw

  const DATA = (data.days || []).map(day => ({
    date: day.date,
    day: day.dayName,
    type: day.type,
    wk: day.weekNum,
    dej: { j: transformMeal(day.dej?.j), z: transformMeal(day.dej?.z) },
    din: { j: transformMeal(day.din?.j), z: transformMeal(day.din?.z) },
    col: { j: transformMeal(day.col?.j), z: transformMeal(day.col?.z) },
    tot: {
      j: { k: day.total?.j?.kcal||0, p: day.total?.j?.p||0, g: day.total?.j?.g||0, l: day.total?.j?.l||0, f: day.total?.j?.f||0, ok: day.total?.j?.ok ? 1 : 0 },
      z: { k: day.total?.z?.kcal||0, p: day.total?.z?.p||0, g: day.total?.z?.g||0, l: day.total?.z?.l||0, f: day.total?.z?.f||0, ok: day.total?.z?.ok ? 1 : 0 },
    },
    ck_din: day.cooking?.dinner ? {
      name: day.cooking.dinner.name,
      time: day.cooking.dinner.totalTime,
      pJ: day.cooking.dinner.portionsJ || day.din?.j?.desc || "",
      pZ: day.cooking.dinner.portionsZ || day.din?.z?.desc || "",
      steps: (day.cooking.dinner.steps || []).map(s => ({ t: s.duration, a: s.action, dt: s.detail })),
    } : null,
    ck_prep: day.cooking?.prep && !day.cooking.prep.isFree ? {
      time: day.cooking.prep.totalTime,
      dishes: (day.cooking.prep.dishes || []).map(d => ({ n: d.name, f: d.for })),
      steps: (day.cooking.prep.steps || []).map(s => ({ t: s.duration, a: s.action, dt: s.detail })),
    } : null,
    batch: day.batch || "",
  }))

  const GROC = (data.groceries || []).map((g, i) => ({
    wk: `S${i + 1}`,
    label: g.weekLabel || g.week || `S${i + 1}`,
    cats: (g.categories || []).map(cat => ({
      name: cat.name,
      items: (cat.items || []).map(item => ({ p: item.product, q: item.quantity || "", u: item.usage || "" })),
    }))
  }))

  return { DATA, GROC }
}

function reconstructFromNormalized(importData) {
  const { meals, dailyTotals, shoppingItems, prepTasks } = importData
  const dateMap = {}
  for (const meal of meals) {
    if (!dateMap[meal.meal_date]) dateMap[meal.meal_date] = { meals: [], totals: [] }
    dateMap[meal.meal_date].meals.push(meal)
  }
  for (const total of dailyTotals) {
    if (!dateMap[total.meal_date]) dateMap[total.meal_date] = { meals: [], totals: [] }
    dateMap[total.meal_date].totals.push(total)
  }

  // Coexistence canonique + batch (P0-8 / F09) : quand le générateur batch a
  // écrit ses tâches (source 'batch', ou 'legacy' pour les lignes au défaut de
  // colonne), les tâches canoniques 'closed_loop' décrivent les MÊMES repas →
  // on les exclut pour ne pas doubler les étapes (comportement post-batch de
  // main). Sans tâche batch/legacy, tout est conservé (comportement pré-batch
  // inchangé).
  const allPrepTasks = prepTasks || []
  const hasBatchTasks = allPrepTasks.some(task => task.source === 'batch' || task.source === 'legacy')
  const visiblePrepTasks = hasBatchTasks ? allPrepTasks.filter(task => task.source !== 'closed_loop') : allPrepTasks

  // Group prep tasks by date, split dinner vs prep steps
  const prepByDate = {}
  for (const task of visiblePrepTasks) {
    const d = task.prep_date
    if (!d) continue
    if (!prepByDate[d]) prepByDate[d] = { dinner: [], prep: [] }
    const isPrep = task.task?.startsWith('[Prep] ')
    const rawTask = isPrep ? task.task.slice(7) : task.task || ''
    const colonIdx = rawTask.indexOf(': ')
    const action = colonIdx >= 0 ? rawTask.slice(0, colonIdx) : rawTask
    const detail = colonIdx >= 0 ? rawTask.slice(colonIdx + 2) : ''
    const step = { t: task.estimated_time || '', a: action, dt: detail }
    if (isPrep) prepByDate[d].prep.push(step)
    else prepByDate[d].dinner.push(step)
  }

  const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mTo = m => m ? { d: m.description||"", k: m.kcal||0, p: m.protein_g||0, g: m.carbs_g||0, l: m.fat_g||0, f: m.fiber_g||0 } : { d:"", k:0, p:0, g:0, l:0, f:0 }

  const DATA = Object.entries(dateMap).sort(([a],[b]) => a.localeCompare(b)).map(([date, { meals: dm, totals }]) => {
    const dt = new Date(date)
    const find = (p, t) => dm.find(m => m.person_name === p && m.meal_type === t)
    const jT = totals.find(t => t.person_name === 'Julien'), zT = totals.find(t => t.person_name === 'Zoé')
    const dinJ = find('Julien','diner'), dinZ = find('Zoé','diner')
    const dayPrep = prepByDate[date]
    const dinSteps = dayPrep?.dinner || []
    const prepSteps = dayPrep?.prep || []
    const totalDinTime = dinSteps.map(s => parseInt(s.t) || 0).reduce((a, b) => a + b, 0)
    const totalPrepTime = prepSteps.map(s => parseInt(s.t) || 0).reduce((a, b) => a + b, 0)
    return {
      date: `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`,
      day: dayNames[dt.getDay()], type: find('Julien','dejeuner')?.day_type || '', wk: 0,
      dej: { j: mTo(find('Julien','dejeuner')), z: mTo(find('Zoé','dejeuner')) },
      din: { j: mTo(dinJ), z: mTo(dinZ) },
      col: { j: mTo(find('Julien','collation')), z: mTo(find('Zoé','collation')) },
      tot: {
        j: { k: jT?.kcal||0, p: jT?.protein_g||0, g: jT?.carbs_g||0, l: jT?.fat_g||0, f: jT?.fiber_g||0, ok: jT?.validated ? 1 : 0 },
        z: { k: zT?.kcal||0, p: zT?.protein_g||0, g: zT?.carbs_g||0, l: zT?.fat_g||0, f: zT?.fiber_g||0, ok: zT?.validated ? 1 : 0 },
      },
      ck_din: dinSteps.length > 0 ? {
        name: dinJ?.description || dinZ?.description || 'Dîner',
        time: totalDinTime > 0 ? `${totalDinTime} min` : '',
        pJ: dinJ?.description || '',
        pZ: dinZ?.description || '',
        steps: dinSteps,
      } : null,
      ck_prep: prepSteps.length > 0 ? {
        time: totalPrepTime > 0 ? `${totalPrepTime} min` : '',
        dishes: [],
        steps: prepSteps,
      } : null,
      batch: "",
    }
  })

  const weekMap = {}
  for (const item of (shoppingItems || [])) {
    const wl = item.week_label || 'S1'
    if (!weekMap[wl]) weekMap[wl] = {}
    const cat = item.category || 'Autres'
    if (!weekMap[wl][cat]) weekMap[wl][cat] = []
    weekMap[wl][cat].push({ p: item.product_name, q: item.quantity || '', u: '' })
  }
  const GROC = Object.entries(weekMap).map(([label, cats], i) => ({
    wk: `S${i + 1}`, label,
    cats: Object.entries(cats).map(([name, items]) => ({ name, items }))
  }))

  return { DATA, GROC }
}

// ── Main App ──
export default function PlanningView() {
  const { importId } = useParams()
  const router = useRouter()
  const scrollRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [DATA, setDATA] = useState([])
  const [GROC, setGROC] = useState([])

  const [dayIdx, setDayIdx] = useState(0)
  const [person, setPerson] = useState("j")
  const [expandedSection, setExpandedSection] = useState(null)
  const [tab, setTab] = useState("today")
  const [checked, setChecked] = useState({})
  const [grocWeek, setGrocWeek] = useState(0)

  useEffect(() => { loadData() }, [importId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [dayIdx])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const opts = session?.access_token
        ? { headers: { 'Authorization': `Bearer ${session.access_token}` } }
        : { credentials: 'include' }

      const res = await fetch(`/api/planning/imports/${importId}`, opts)
      if (!res.ok) throw new Error('Import non trouvé')
      const result = await res.json()

      if (result.import?.raw_json) {
        const { DATA: d, GROC: g } = transformData(result.import.raw_json)
        setDATA(d)
        setGROC(g)
      } else {
        const { DATA: d, GROC: g } = reconstructFromNormalized(result)
        setDATA(d)
        setGROC(g)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const day = DATA[dayIdx]
  const p = person
  const tot = day?.tot?.[p]

  const prev = () => { setDayIdx(Math.max(0, dayIdx - 1)); setExpandedSection(null) }
  const next = () => { setDayIdx(Math.min(DATA.length - 1, dayIdx + 1)); setExpandedSection(null) }
  const toggle = (section) => { setExpandedSection(expandedSection === section ? null : section) }

  // ── Inner Components ──

  const MacroBar = ({ k, p: pr, g, l, f, target }) => {
    const pct = target ? Math.min((k / target) * 100, 100) : 100
    const over = target && (k / target) * 100 > 102
    return (
      <div className="pv-macrobar">
        <div className="pv-macrobar-track">
          <div className="pv-macrobar-fill" style={{ width: `${pct}%`, background: over ? 'var(--terracotta)' : 'var(--saffron)' }} />
        </div>
        <span className="pv-m"><b>{k}</b> kcal</span>
        <span className="pv-m"><b>{pr}</b>P</span>
        <span className="pv-m"><b>{g}</b>G</span>
        <span className="pv-m"><b>{l}</b>L</span>
        <span className="pv-m"><b>{f}</b>F</span>
      </div>
    )
  }

  // Barre de couleur par repas (alignée v21.css)
  const MEAL_BAR = { pdj: 'var(--m-pdj)', dej: 'var(--m-dej)', din: 'var(--m-din)', col: 'var(--m-col)' }

  const MealCard = ({ barKey, label, desc, macros, onClick, expandable, expanded }) => (
    <div
      onClick={expandable ? onClick : undefined}
      className={`pv-meal${expandable ? ' clickable' : ''}${expanded ? ' open' : ''}`}
    >
      <span className="pv-meal-bar" aria-hidden="true" style={{ background: MEAL_BAR[barKey] || MEAL_BAR.din }} />
      <div className="pv-meal-main">
        <div className="pv-meal-h">
          <span className="pv-meal-l">{label}</span>
          {expandable && (
            <span className="pv-meal-toggle">{expanded ? 'Fermer' : 'Étapes'}</span>
          )}
        </div>
        <p className="pv-meal-d">{desc}</p>
        <MacroBar {...macros} />
      </div>
    </div>
  )

  const StepsList = ({ steps, title, time, portions }) => (
    <div className="pv-steps">
      <div className="pv-steps-h">
        <span className="v21-bl">{title}</span>
        {time && <span className="pv-steps-time">{time}</span>}
      </div>
      {portions && (
        <div className="pv-portions">
          <div className="pv-portion">
            <span className="pv-portion-p">Julien</span>
            <span className="pv-portion-d">{portions.pJ}</span>
          </div>
          <div className="pv-portion">
            <span className="pv-portion-p">Zoé</span>
            <span className="pv-portion-d">{portions.pZ}</span>
          </div>
        </div>
      )}
      {steps.map((s, i) => (
        <div key={i} className="pv-step">
          <span className="pv-step-n">{i + 1}</span>
          <div className="pv-step-body">
            <div className="pv-step-top">
              <span className="pv-step-a">{s.a}</span>
              {s.t && <span className="pv-step-t">{s.t}</span>}
            </div>
            {s.dt && <p className="pv-step-dt">{s.dt}</p>}
          </div>
        </div>
      ))}
    </div>
  )

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="v21-page" aria-busy="true" aria-label="Chargement du planning">
        <div className="v21-skel" style={{ height: 90, marginBottom: 24 }} />
        <div className="v21-skel" style={{ height: 44, marginBottom: 18 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="v21-skel" style={{ height: 72, marginBottom: 12 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="v21-page">
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning</span>
            <h1 className="v21-title">Introuvable.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">{error}</p>
          </div>
        </header>
        <div className="v21-section flush" style={{ paddingTop: 28 }}>
          <button onClick={() => router.push('/planning')} className="v21-btn">Retour au planning</button>
        </div>
      </div>
    )
  }

  if (!day) return null

  // ── Render ──
  return (
    <div className="v21-page" ref={scrollRef}>
      {/* ═══ HERO ÉDITORIAL ═══ */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Planning · {day.day} {day.date}</span>
          <h1 className="v21-title">{day.day}.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Semaine {day.wk}{day.type ? ` · ${day.type}` : ''}.</p>
        </div>
        {/* Sélecteur de personne */}
        <div className="v21-hero-side">
          <div className="v21-tabs pv-person" role="tablist" aria-label="Personne">
            {["j", "z"].map(pp => (
              <button key={pp} role="tab" aria-selected={person === pp}
                onClick={() => setPerson(pp)}
                className={`v21-tab ${person === pp ? 'on' : ''}`}>
                {pp === "j" ? "Julien" : "Zoé"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Day nav + onglets */}
      <div className="pv-bar">
        <div className="pv-daynav">
          <button onClick={prev} disabled={dayIdx === 0} className="pv-arrow" aria-label="Jour précédent">&#8592;</button>
          <span className="pv-daynav-l">{day.day} {day.date}</span>
          <button onClick={next} disabled={dayIdx === DATA.length - 1} className="pv-arrow" aria-label="Jour suivant">&#8594;</button>
        </div>
        <div className="v21-tabs pv-tabs" role="tablist" aria-label="Vue">
          <button role="tab" aria-selected={tab === 'today'} className={`v21-tab ${tab === 'today' ? 'on' : ''}`} onClick={() => setTab('today')}>Aujourd'hui</button>
          <button role="tab" aria-selected={tab === 'courses'} className={`v21-tab ${tab === 'courses' ? 'on' : ''}`} onClick={() => setTab('courses')}>Courses</button>
        </div>
      </div>

      {/* Total du jour */}
      {tab === 'today' && tot && (
        <div className={`pv-total ${tot.ok ? 'ok' : 'warn'}`}>
          <div className="pv-total-head">
            <span className="pv-total-l">Total jour · {tot.ok ? 'dans la cible' : 'hors cible'}</span>
            <span className="pv-total-k">{tot.k} kcal</span>
          </div>
          <MacroBar k={tot.k} p={tot.p} g={tot.g} l={tot.l} f={tot.f} target={p === "j" ? 2050 : 1350} />
        </div>
      )}

      {/* ── TAB: TODAY ── */}
      {tab === "today" && (
        <section className="v21-section flush pv-today">
          {/* PDJ (Julien only) */}
          {p === "j" && (
            <MealCard barKey="pdj" label="Petit-déjeuner" desc={PDJ_J.d}
              macros={{ k: PDJ_J.k, p: PDJ_J.p, g: PDJ_J.g, l: PDJ_J.l, f: PDJ_J.f }} />
          )}

          {/* Déjeuner */}
          <MealCard barKey="dej" label="Déjeuner" desc={day.dej[p].d}
            macros={{ k: day.dej[p].k, p: day.dej[p].p, g: day.dej[p].g, l: day.dej[p].l, f: day.dej[p].f }} />

          {/* Dîner — expandable */}
          <MealCard barKey="din" label="Dîner" desc={day.din[p].d}
            macros={{ k: day.din[p].k, p: day.din[p].p, g: day.din[p].g, l: day.din[p].l, f: day.din[p].f }}
            expandable={!!day.ck_din} expanded={expandedSection === "din"} onClick={() => toggle("din")} />

          {expandedSection === "din" && day.ck_din && (
            <StepsList steps={day.ck_din.steps} title={day.ck_din.name} time={day.ck_din.time}
              portions={{ pJ: day.ck_din.pJ, pZ: day.ck_din.pZ }} />
          )}

          {/* Collation */}
          <MealCard barKey="col" label="Collation" desc={day.col[p].d}
            macros={{ k: day.col[p].k, p: day.col[p].p, g: day.col[p].g, l: day.col[p].l, f: day.col[p].f }} />

          {/* Batch note */}
          {day.batch && (
            <p className="pv-batch">{day.batch}</p>
          )}

          {/* Prep section */}
          {day.ck_prep ? (
            <>
              <div onClick={() => toggle("prep")} className={`pv-prep${expandedSection === "prep" ? ' open' : ''}`}>
                <span className="pv-prep-bar" aria-hidden="true" />
                <div className="pv-prep-main">
                  <span className="pv-prep-l">À préparer ce soir</span>
                  <span className="pv-prep-dish">{day.ck_prep.dishes.map(d => d.n).join(" + ")}</span>
                  {day.ck_prep.dishes.length > 0 && (
                    <div className="pv-prep-tags">
                      {day.ck_prep.dishes.map((d, i) => (
                        <span key={i} className="pv-prep-tag">{d.f}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pv-prep-right">
                  {day.ck_prep.time && <span className="pv-prep-time">{day.ck_prep.time}</span>}
                  <span className="pv-prep-toggle">{expandedSection === "prep" ? 'Fermer' : 'Voir'}</span>
                </div>
              </div>

              {expandedSection === "prep" && (
                <StepsList steps={day.ck_prep.steps} title="Préparation" time={day.ck_prep.time} />
              )}
            </>
          ) : (
            <p className="pv-noprep">Rien à préparer ce soir.</p>
          )}

          {/* Day dots — repères de jour (rectangles) */}
          <div className="pv-dots">
            {DATA.map((d, i) => (
              <button key={i} onClick={() => { setDayIdx(i); setExpandedSection(null) }}
                aria-label={`Jour ${i + 1}`}
                className={`pv-dot${i === dayIdx ? ' on' : ''}${d.wk === day.wk ? ' wk' : ''}`} />
            ))}
          </div>
        </section>
      )}

      {/* ── TAB: COURSES ── */}
      {tab === "courses" && (
        <section className="v21-section flush pv-courses">
          {/* Week selector */}
          {GROC.length > 0 && (
            <div className="v21-tabs pv-grocweeks" role="tablist" aria-label="Semaines">
              {GROC.map((g, i) => (
                <button key={i} role="tab" aria-selected={grocWeek === i}
                  className={`v21-tab ${grocWeek === i ? 'on' : ''}`}
                  onClick={() => setGrocWeek(i)}>{g.wk}</button>
              ))}
            </div>
          )}
          {GROC[grocWeek]?.label && <p className="pv-groclabel">{GROC[grocWeek].label}</p>}

          {GROC[grocWeek]?.cats.map((cat, ci) => (
            <div key={ci} className="pv-groccat">
              <div className="v21-bh"><span className="v21-bl">{cat.name}</span></div>
              <div className="v21-its">
                {cat.items.map((item, ii) => {
                  const key = `${grocWeek}-${ci}-${ii}`
                  const isDone = checked[key]
                  return (
                    <button key={ii} type="button"
                      onClick={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`v21-it pv-groc-it${isDone ? ' is-checked' : ''}`}>
                      <span className="v21-it-bar" aria-hidden="true" style={{ background: isDone ? 'var(--sage, #6FB05A)' : 'var(--line-strong)' }} />
                      <span className="pv-groc-check"><span className={`pv-groc-box${isDone ? ' on' : ''}`}>{isDone && "✓"}</span></span>
                      <span className="pv-groc-body">
                        <span className="pv-groc-name">{item.p}</span>
                        {item.u && <span className="pv-groc-u">{item.u}</span>}
                      </span>
                      <span className="pv-groc-q">{item.q}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <style jsx>{`
        /* Sélecteur personne / onglets : .v21-tabs sans bordures hautes/basses ici */
        .pv-person, .pv-tabs, .pv-grocweeks { border-top: none; border-bottom: none; padding: 0; margin-top: 0; }

        .pv-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
          padding: 16px 0; border-bottom: 1px solid var(--line);
        }
        .pv-daynav { display: flex; align-items: center; gap: 12px; }
        .pv-arrow {
          width: 34px; height: 34px; border-radius: 3px;
          border: 1px solid var(--line-strong); background: transparent; cursor: pointer;
          color: var(--ink-2); font-size: 16px; line-height: 1;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .pv-arrow:hover:not(:disabled) { border-color: var(--ink-1); color: var(--ink-1); }
        .pv-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
        .pv-daynav-l {
          font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--ink-2); min-width: 120px; text-align: center;
        }

        /* Total du jour */
        .pv-total { padding: 16px 0; border-bottom: 1.5px solid var(--ink-1); }
        .pv-total-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .pv-total-l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-2); }
        .pv-total.ok .pv-total-l { color: var(--state-fresh); }
        .pv-total.warn .pv-total-l { color: var(--state-soon); }
        .pv-total-k { font-family: var(--font-display); font-size: 22px; font-weight: 600; color: var(--ink-1); }

        .pv-today, .pv-courses { padding-top: 22px; display: flex; flex-direction: column; }

        /* Lignes de repas */
        .pv-meal {
          display: grid; grid-template-columns: 8px 1fr; align-items: stretch;
          border-bottom: 1px solid var(--line);
        }
        .pv-meal-bar { align-self: stretch; }
        .pv-meal.clickable { cursor: pointer; }
        .pv-meal.clickable:hover { background: var(--surface-soft); }
        .pv-meal-main { padding: 15px 16px; min-width: 0; }
        .pv-meal-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pv-meal-l { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
        .pv-meal-toggle {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--terracotta);
        }
        .pv-meal-d { font-family: var(--font-display); font-weight: 500; font-size: 18px; line-height: 1.3; color: var(--ink-1); margin: 5px 0 9px; }

        /* MacroBar */
        .pv-macrobar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .pv-macrobar-track { flex: 1; min-width: 90px; height: 5px; background: var(--line); overflow: hidden; }
        .pv-macrobar-fill { height: 100%; transition: width 0.4s ease; }
        .pv-m { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }
        .pv-m b { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }

        /* Étapes (StepsList) */
        .pv-steps { border-bottom: 1px solid var(--line); padding: 16px 16px 8px; background: var(--surface-soft); }
        .pv-steps-h { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .pv-steps-time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }
        .pv-portions { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .pv-portion { display: flex; gap: 10px; align-items: baseline; padding: 8px 12px; border: 1px solid var(--line); border-radius: 3px; }
        .pv-portion-p { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--terracotta); min-width: 48px; }
        .pv-portion-d { font-family: var(--font-text); font-size: 13px; color: var(--ink-2); line-height: 1.45; }
        .pv-step { display: flex; gap: 12px; padding: 11px 0; border-top: 1px solid var(--line); }
        .pv-step:first-of-type { border-top: none; }
        .pv-step-n {
          width: 24px; height: 24px; border-radius: 3px; flex-shrink: 0;
          background: var(--ink-1); color: var(--paper);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 12px; font-weight: 600;
        }
        .pv-step-body { flex: 1; min-width: 0; }
        .pv-step-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .pv-step-a { font-family: var(--font-text); font-size: 13px; font-weight: 600; color: var(--ink-1); }
        .pv-step-t { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); flex-shrink: 0; }
        .pv-step-dt { font-family: var(--font-text); font-size: 12px; color: var(--ink-2); line-height: 1.6; margin: 4px 0 0; }

        .pv-batch {
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; color: var(--ink-3);
          padding: 12px 0; border-bottom: 1px solid var(--line); margin: 0;
        }

        /* Prep */
        .pv-prep {
          display: grid; grid-template-columns: 8px 1fr auto; align-items: stretch;
          border-bottom: 1px solid var(--line); cursor: pointer;
        }
        .pv-prep:hover { background: var(--surface-soft); }
        .pv-prep-bar { align-self: stretch; background: var(--olive, #6E7A3F); }
        .pv-prep-main { padding: 15px 16px; min-width: 0; }
        .pv-prep-l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--state-fresh); }
        .pv-prep-dish { display: block; font-family: var(--font-display); font-size: 16px; font-weight: 500; color: var(--ink-1); margin-top: 3px; }
        .pv-prep-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .pv-prep-tag { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-2); border: 1px solid var(--line-strong); border-radius: 3px; padding: 2px 8px; }
        .pv-prep-right { padding: 15px 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; justify-content: center; }
        .pv-prep-time { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--ink-1); }
        .pv-prep-toggle { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--terracotta); }

        .pv-noprep { font-family: var(--font-text); font-size: 13px; color: var(--ink-3); padding: 14px 0; border-bottom: 1px solid var(--line); margin: 0; }

        /* Repères de jour */
        .pv-dots { display: flex; justify-content: center; gap: 5px; flex-wrap: wrap; padding: 22px 0 4px; }
        .pv-dot {
          width: 8px; height: 8px; border-radius: 2px; border: none; cursor: pointer;
          background: var(--line); transition: background 0.2s ease, width 0.2s ease;
        }
        .pv-dot.wk { background: var(--line-strong); }
        .pv-dot.on { width: 22px; background: var(--terracotta); }

        /* Courses */
        .pv-groclabel { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); text-align: center; margin: 12px 0 0; }
        .pv-groccat { padding-top: 22px; }
        .v21-it.pv-groc-it {
          grid-template-columns: 8px 30px 1fr auto; width: 100%;
          border: none; border-bottom: 1px solid var(--line);
          background: transparent; cursor: pointer; text-align: left; font: inherit;
        }
        .pv-groc-check { padding: 0 !important; justify-content: center; }
        .pv-groc-box {
          width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0;
          border: 1.5px solid var(--line-strong); background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: #fff;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .pv-groc-box.on { background: var(--brand); border-color: var(--brand); }
        .pv-groc-body { flex-direction: column; align-items: flex-start; gap: 2px; }
        .pv-groc-name { font-family: var(--font-display); font-size: 16px; font-weight: 500; color: var(--ink-1); }
        .pv-groc-u { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); }
        .pv-groc-q { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); white-space: nowrap; justify-content: flex-end; }
        .v21-it.is-checked { opacity: 0.55; }
        .v21-it.is-checked .pv-groc-name { text-decoration: line-through; color: var(--ink-3); }

        @media (max-width: 560px) {
          .v21-it.pv-groc-it { grid-template-columns: 8px 30px 1fr; }
          .pv-groc-q { display: none; }
        }
      `}</style>
    </div>
  )
}
