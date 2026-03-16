'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// ── Constants ──
const PDJ_J = { d: "200g skyr + 3 œufs durs", k: 383, p: 44, g: 9, l: 18, f: 0 }
const EMOJIS = { "Séance": "🏋️", "Repos": "😴", "WE": "🌴", "Marche": "🚶", "Activité libre": "🌊", "Repos actif": "🧘" }
const MEAL_ICONS = { pdj: "🌅", dej: "🥡", din: "🍳", col: "🥜" }

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

  // Group prep tasks by date, split dinner vs prep steps
  const prepByDate = {}
  for (const task of (prepTasks || [])) {
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
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 80 }}>
          <div style={{ background: "#1a1a2e", borderRadius: 6, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6,
              background: pct > 102 ? "linear-gradient(90deg,#e74c3c,#ff6b6b)" : "linear-gradient(90deg,#f39c12,#f1c40f)",
              transition: "width 0.4s ease" }} />
          </div>
        </div>
        <span style={{ color: "#f1c40f", fontWeight: 700 }}>{k}</span>
        <span style={{ color: "#3498db" }}>{pr}P</span>
        <span style={{ color: "#e67e22" }}>{g}G</span>
        <span style={{ color: "#9b59b6" }}>{l}L</span>
        <span style={{ color: "#2ecc71" }}>{f}F</span>
      </div>
    )
  }

  const MealCard = ({ icon, label, desc, macros, onClick, expandable, expanded }) => (
    <div
      onClick={expandable ? onClick : undefined}
      style={{
        background: expanded ? "#1e2a4a" : "#16213e",
        borderRadius: 16, padding: "14px 16px", cursor: expandable ? "pointer" : "default",
        border: expanded ? "1px solid #3498db44" : "1px solid #ffffff08",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#8899aa", fontWeight: 600 }}>{label}</span>
            {expandable && (
              <span style={{ fontSize: 10, color: "#3498db", background: "#3498db22", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                {expanded ? "▲ fermer" : "▼ étapes"}
              </span>
            )}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#e8e8f0", lineHeight: 1.4, fontWeight: 500 }}>{desc}</p>
        </div>
      </div>
      <MacroBar {...macros} />
    </div>
  )

  const StepsList = ({ steps, title, time, portions }) => (
    <div style={{ background: "#0d1b2a", borderRadius: 14, padding: 16, margin: "0 0 4px", border: "1px solid #ffffff08" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1c40f" }}>{title}</span>
        <span style={{ fontSize: 12, color: "#3498db", background: "#3498db18", padding: "3px 10px", borderRadius: 8 }}>⏱ {time}</span>
      </div>
      {portions && (
        <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 12, color: "#e8e8f0", padding: "8px 12px", background: "#1e3a5f22", borderRadius: 8, lineHeight: 1.5, border: "1px solid #3498db22" }}>
            <span style={{ color: "#f39c12", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Julien</span>
            <span style={{ color: "#8899aa", margin: "0 6px" }}>·</span>
            <span>{portions.pJ}</span>
          </div>
          <div style={{ fontSize: 12, color: "#e8e8f0", padding: "8px 12px", background: "#e74c3c0a", borderRadius: 8, lineHeight: 1.5, border: "1px solid #e74c3c18" }}>
            <span style={{ color: "#e74c3c", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Zoé</span>
            <span style={{ color: "#8899aa", margin: "0 6px" }}>·</span>
            <span>{portions.pZ}</span>
          </div>
        </div>
      )}
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex", gap: 10, padding: "10px 0",
            borderTop: i > 0 ? "1px solid #ffffff08" : "none",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "#f39c12",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#000",
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>{s.a}</span>
              <span style={{ fontSize: 11, color: "#f39c12", fontWeight: 500, flexShrink: 0 }}>{s.t}</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aabbcc", lineHeight: 1.6 }}>{s.dt}</p>
          </div>
        </div>
      ))}
    </div>
  )

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#667788" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #1e3a5f", borderTop: "3px solid #f39c12", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Chargement...</div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", color: "#e74c3c" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>!</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{error}</div>
          <button onClick={() => router.push('/planning')} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: "#f39c12", color: "#000", fontWeight: 600, cursor: "pointer" }}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!day) return null

  const emojiKey = Object.keys(EMOJIS).find(k => day.type?.includes(k))

  // ── Render ──
  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: "#0a0f1e", color: "#e8e8f0",
      fontFamily: "'DM Sans', 'Nunito', -apple-system, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "16px 16px 0", background: "linear-gradient(180deg, #0f1a30 0%, #0a0f1e 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              myko<span style={{ color: "#f39c12" }}>.</span>
            </h1>
          </div>
          <div style={{
            display: "flex", background: "#16213e", borderRadius: 10, overflow: "hidden", border: "1px solid #ffffff10",
          }}>
            {["j", "z"].map(pp => (
              <button key={pp} onClick={() => setPerson(pp)} style={{
                padding: "6px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: person === pp ? "#1e3a5f" : "transparent",
                color: person === pp ? "#f1c40f" : "#667788",
                transition: "all 0.2s",
              }}>
                {pp === "j" ? "Julien" : "Zoé"}
              </button>
            ))}
          </div>
        </div>

        {/* Day Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button onClick={prev} disabled={dayIdx === 0} style={{
            width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
            background: "#16213e", color: "#88aacc", fontSize: 16, opacity: dayIdx === 0 ? 0.3 : 1,
          }}>&#8592;</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {day.day} {day.date}
              <span style={{ marginLeft: 6 }}>{emojiKey ? EMOJIS[emojiKey] : ""}</span>
            </div>
            <div style={{ fontSize: 11, color: "#667788", marginTop: 2 }}>Semaine {day.wk} · {day.type}</div>
          </div>
          <button onClick={next} disabled={dayIdx === DATA.length - 1} style={{
            width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
            background: "#16213e", color: "#88aacc", fontSize: 16, opacity: dayIdx === DATA.length - 1 ? 0.3 : 1,
          }}>&#8594;</button>
        </div>

        {/* Total bar */}
        {tot && (
          <div style={{
            background: tot.ok ? "linear-gradient(135deg, #1b4332, #0d2818)" : "linear-gradient(135deg, #4a1a1a, #2a0e0e)",
            borderRadius: 12, padding: "10px 14px", marginBottom: 14,
            border: tot.ok ? "1px solid #2ecc7133" : "1px solid #e74c3c33",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: tot.ok ? "#2ecc71" : "#e74c3c" }}>
                {tot.ok ? "✅ Dans la cible" : "⚠️ Hors cible"}
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#f1c40f" }}>{tot.k} kcal</span>
            </div>
            <MacroBar k={tot.k} p={tot.p} g={tot.g} l={tot.l} f={tot.f} target={p === "j" ? 2050 : 1350} />
          </div>
        )}
      </div>

      {/* ── TAB: TODAY ── */}
      {tab === "today" && (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "0 16px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* PDJ (Julien only) */}
              {p === "j" && (
                <MealCard icon={MEAL_ICONS.pdj} label="Petit-déjeuner" desc={PDJ_J.d}
                  macros={{ k: PDJ_J.k, p: PDJ_J.p, g: PDJ_J.g, l: PDJ_J.l, f: PDJ_J.f }} />
              )}

              {/* Déjeuner */}
              <MealCard icon={MEAL_ICONS.dej} label="Déjeuner" desc={day.dej[p].d}
                macros={{ k: day.dej[p].k, p: day.dej[p].p, g: day.dej[p].g, l: day.dej[p].l, f: day.dej[p].f }} />

              {/* Dîner — expandable */}
              <MealCard icon={MEAL_ICONS.din} label="Dîner" desc={day.din[p].d}
                macros={{ k: day.din[p].k, p: day.din[p].p, g: day.din[p].g, l: day.din[p].l, f: day.din[p].f }}
                expandable={!!day.ck_din} expanded={expandedSection === "din"} onClick={() => toggle("din")} />

              {expandedSection === "din" && day.ck_din && (
                <StepsList steps={day.ck_din.steps} title={day.ck_din.name} time={day.ck_din.time}
                  portions={{ pJ: day.ck_din.pJ, pZ: day.ck_din.pZ }} />
              )}

              {/* Collation */}
              <MealCard icon={MEAL_ICONS.col} label="Collation" desc={day.col[p].d}
                macros={{ k: day.col[p].k, p: day.col[p].p, g: day.col[p].g, l: day.col[p].l, f: day.col[p].f }} />

              {/* Batch note */}
              {day.batch && (
                <div style={{ fontSize: 12, color: "#667788", padding: "6px 12px", background: "#ffffff04", borderRadius: 10, textAlign: "center" }}>
                  📦 {day.batch}
                </div>
              )}

              {/* Separator */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #ffffff15, transparent)", margin: "8px 0" }} />

              {/* Prep section */}
              {day.ck_prep ? (
                <>
                  <div
                    onClick={() => toggle("prep")}
                    style={{
                      background: expandedSection === "prep" ? "#1a2a1a" : "#16213e",
                      borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                      border: expandedSection === "prep" ? "1px solid #2ecc7133" : "1px solid #ffffff08",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>👨‍🍳</span>
                        <div>
                          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#2ecc71", fontWeight: 600 }}>
                            À préparer ce soir
                          </div>
                          <div style={{ fontSize: 13, color: "#e8e8f0", fontWeight: 500, marginTop: 2 }}>
                            {day.ck_prep.dishes.map(d => d.n).join(" + ")}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f39c12" }}>⏱ {day.ck_prep.time}</div>
                        <span style={{ fontSize: 10, color: "#3498db", fontWeight: 600 }}>
                          {expandedSection === "prep" ? "▲" : "▼ voir"}
                        </span>
                      </div>
                    </div>
                    {day.ck_prep.dishes.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {day.ck_prep.dishes.map((d, i) => (
                          <span key={i} style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 8,
                            background: "#2ecc7118", color: "#2ecc71", fontWeight: 500,
                          }}>
                            → {d.f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {expandedSection === "prep" && (
                    <StepsList steps={day.ck_prep.steps} title="Préparation" time={day.ck_prep.time} />
                  )}
                </>
              ) : (
                <div style={{
                  background: "#16213e", borderRadius: 16, padding: "14px 16px",
                  border: "1px solid #ffffff08", textAlign: "center",
                }}>
                  <span style={{ fontSize: 18 }}>🎉</span>
                  <div style={{ fontSize: 13, color: "#667788", marginTop: 4 }}>Rien à préparer ce soir</div>
                </div>
              )}
            </div>
          </div>

          {/* Day dots */}
          <div style={{
            padding: "10px 16px 8px", display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap",
          }}>
            {DATA.map((d, i) => (
              <button key={i} onClick={() => { setDayIdx(i); setExpandedSection(null) }} style={{
                width: i === dayIdx ? 20 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer",
                background: i === dayIdx ? "#f39c12" : d.wk === day.wk ? "#1e3a5f" : "#0d1b2a",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        </>
      )}

      {/* ── TAB: COURSES ── */}
      {tab === "courses" && (
        <div style={{ flex: 1, overflow: "auto", padding: "0 16px 24px" }}>
          {/* Week selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {GROC.map((g, i) => (
              <button key={i} onClick={() => setGrocWeek(i)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer",
                background: grocWeek === i ? "#1e3a5f" : "#16213e",
                color: grocWeek === i ? "#f1c40f" : "#667788",
                fontSize: 12, fontWeight: 600, transition: "all 0.2s",
              }}>{g.wk}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#667788", textAlign: "center", marginBottom: 12 }}>
            {GROC[grocWeek]?.label}
          </div>
          {GROC[grocWeek]?.cats.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e8f0", marginBottom: 6, padding: "6px 10px", background: "#1e3a5f", borderRadius: 8 }}>
                {cat.name}
              </div>
              {cat.items.map((item, ii) => {
                const key = `${grocWeek}-${ci}-${ii}`
                const isDone = checked[key]
                return (
                  <div key={ii} onClick={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                      borderBottom: "1px solid #ffffff06", cursor: "pointer",
                      opacity: isDone ? 0.4 : 1, transition: "opacity 0.2s",
                    }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: isDone ? "2px solid #2ecc71" : "2px solid #334455",
                      background: isDone ? "#2ecc7133" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: "#2ecc71",
                    }}>{isDone ? "✓" : ""}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#e8e8f0", fontWeight: 500, textDecoration: isDone ? "line-through" : "none" }}>
                        {item.p}
                      </div>
                      <div style={{ fontSize: 11, color: "#667788" }}>{item.u}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#f39c12", fontWeight: 600, flexShrink: 0 }}>{item.q}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div style={{
        display: "flex", borderTop: "1px solid #ffffff10",
        background: "#0d1225",
      }}>
        {[{ id: "today", icon: "📋", label: "Aujourd'hui" }, { id: "courses", icon: "🛒", label: "Courses" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 0 12px", border: "none", cursor: "pointer",
            background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
              color: tab === t.id ? "#f39c12" : "#556677",
            }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
