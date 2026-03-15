'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// ── Type config ──
const TYPES = {
  "Séance A":{ emoji:"💪", color:"#D4634B", label:"Push" },
  "Séance B":{ emoji:"🦵", color:"#D4634B", label:"Legs" },
  "Séance C":{ emoji:"🏋️", color:"#D4634B", label:"Pull" },
  "Séance":{ emoji:"💪", color:"#D4634B", label:"Séance" },
  "Marche":{ emoji:"🚶", color:"#6B8F71", label:"Walk" },
  "Activité libre":{ emoji:"🌊", color:"#7BA7BC", label:"Free" },
  "Repos actif":{ emoji:"🧘", color:"#C4956A", label:"Rest" },
  "Repos":{ emoji:"🧘", color:"#C4956A", label:"Repos" },
  "WE":{ emoji:"🌊", color:"#7BA7BC", label:"WE" },
}
const getT = t => { for(const[k,v] of Object.entries(TYPES)) if(t?.includes(k)) return v; return {emoji:"📅",color:"#999",label:""}; }

// ── Data transformation ──
function macroArr(m) {
  if (!m) return [0,0,0,0,0]
  return [m.kcal||0, m.p||0, m.g||0, m.l||0, m.f||0]
}

function totalArr(t) {
  if (!t) return [0,0,0,0,0]
  return [t.kcal||0, t.p||0, t.g||0, t.l||0, t.f||0]
}

function transformData(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw

  const days = (data.days || []).map(day => ({
    d: day.date,
    dn: day.dayName,
    t: day.type,
    w: day.weekNum,
    jd: day.dej?.j?.desc || "",
    jdm: macroArr(day.dej?.j),
    jn: day.din?.j?.desc || "",
    jnm: macroArr(day.din?.j),
    jc: day.col?.j?.desc || "",
    jcm: macroArr(day.col?.j),
    jco: day.col?.j?.option || "",
    zd: day.dej?.z?.desc || "",
    zdm: macroArr(day.dej?.z),
    zn: day.din?.z?.desc || "",
    znm: macroArr(day.din?.z),
    zc: day.col?.z?.desc || "",
    zcm: macroArr(day.col?.z),
    jt: totalArr(day.total?.j),
    zt: totalArr(day.total?.z),
    jo: day.total?.j?.ok || false,
    zo: day.total?.z?.ok || false,
    prep: (() => {
      const cp = day.cooking?.prep
      if (!cp || cp.isFree) return "LIBRE"
      const names = (cp.dishes || []).map(d => d.name)
      return names.length ? names.join(". ") + "." : (cp.steps || []).map(s => s.action).join(". ") + "."
    })(),
    pt: day.cooking?.prep?.totalTime || "0 min",
    pf: day.cooking?.prep?.isFree || !day.cooking?.prep,
    batch: day.batch || "",
    cooking: day.cooking || null,
  }))

  const groceries = (data.groceries || []).map((g, i) => ({
    week: i + 1,
    label: g.weekLabel || g.week || `S${i+1}`,
    cats: (g.categories || []).map(cat => ({
      name: cat.name,
      items: (cat.items || []).map(item => ({
        p: item.product,
        q: item.quantity || "",
        u: item.usage || "",
      }))
    }))
  }))

  const prepData = {}
  for (const day of (data.days || [])) {
    if (day.cooking) {
      prepData[day.date] = {}
      if (day.cooking.dinner) {
        prepData[day.date].dinner = {
          name: day.cooking.dinner.name,
          steps: day.cooking.dinner.steps || [],
          totalTime: day.cooking.dinner.totalTime,
        }
      }
      if (day.cooking.prep && !day.cooking.prep.isFree) {
        prepData[day.date].prep = {
          dishes: day.cooking.prep.dishes || [],
          steps: day.cooking.prep.steps || [],
          totalTime: day.cooking.prep.totalTime,
        }
      }
    }
  }

  return { days, groceries, prepData }
}

function reconstructFromNormalized(importData) {
  const { meals, dailyTotals, shoppingItems } = importData
  const dateMap = {}
  for (const meal of meals) {
    if (!dateMap[meal.meal_date]) dateMap[meal.meal_date] = { meals: [], totals: [] }
    dateMap[meal.meal_date].meals.push(meal)
  }
  for (const total of dailyTotals) {
    if (!dateMap[total.meal_date]) dateMap[total.meal_date] = { meals: [], totals: [] }
    dateMap[total.meal_date].totals.push(total)
  }
  const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mToA = m => m ? [m.kcal||0, m.protein_g||0, m.carbs_g||0, m.fat_g||0, m.fiber_g||0] : [0,0,0,0,0]
  const tToA = t => t ? [t.kcal||0, t.protein_g||0, t.carbs_g||0, t.fat_g||0, t.fiber_g||0] : [0,0,0,0,0]

  const days = Object.entries(dateMap).sort(([a],[b]) => a.localeCompare(b)).map(([date, { meals: dm, totals }]) => {
    const dt = new Date(date)
    const find = (p, t) => dm.find(m => m.person_name === p && m.meal_type === t)
    const jD = find('Julien','dejeuner'), jN = find('Julien','diner'), jC = find('Julien','collation')
    const zD = find('Zoé','dejeuner'), zN = find('Zoé','diner'), zC = find('Zoé','collation')
    const jT = totals.find(t => t.person_name === 'Julien'), zT = totals.find(t => t.person_name === 'Zoé')
    return {
      d: `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`,
      dn: dayNames[dt.getDay()], t: jD?.day_type || '', w: 0,
      jd: jD?.description||'', jdm: mToA(jD), jn: jN?.description||'', jnm: mToA(jN),
      jc: jC?.description||'', jcm: mToA(jC), jco: '',
      zd: zD?.description||'', zdm: mToA(zD), zn: zN?.description||'', znm: mToA(zN),
      zc: zC?.description||'', zcm: mToA(zC),
      jt: tToA(jT), zt: tToA(zT), jo: jT?.validated||false, zo: zT?.validated||false,
      prep: '', pt: '0 min', pf: true, batch: '', cooking: null,
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
  const groceries = Object.entries(weekMap).map(([label, cats], i) => ({
    week: i + 1, label,
    cats: Object.entries(cats).map(([name, items]) => ({ name, items }))
  }))

  return { days, groceries, prepData: {} }
}

// ── Components ──

const MealCard = ({ emoji, label, descJ, macrosJ, descZ, macrosZ, person }) => {
  const desc = person === "j" ? descJ : descZ
  const m = person === "j" ? macrosJ : macrosZ
  if (!desc) return null
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"16px 18px", marginBottom:10, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:18 }}>{emoji}</span>
        <span style={{ fontSize:12, fontWeight:700, color:"#8B7355", letterSpacing:1, textTransform:"uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize:14, color:"#2D2A26", lineHeight:1.5, marginBottom:8 }}>{desc}</div>
      {m && m[0] > 0 && (
        <div style={{ display:"flex", gap:12, fontSize:12 }}>
          <span style={{ fontWeight:700, color:"#2D2A26" }}>{m[0]} kcal</span>
          <span style={{ color:"#D4634B" }}>P {m[1]}g</span>
          <span style={{ color:"#8B7355" }}>G {m[2]}g</span>
          <span style={{ color:"#7BA7BC" }}>L {m[3]}g</span>
          <span style={{ color:"#6B8F71" }}>F {m[4]}g</span>
        </div>
      )}
    </div>
  )
}

const MacroRing = ({ value, max, color, label }) => {
  const pct = Math.min(value / max, 1)
  const r = 28, c = 2 * Math.PI * r
  return (
    <div style={{ textAlign:"center" }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EDEAE5" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${c * pct} ${c * (1 - pct)}`}
          strokeLinecap="round" transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x="32" y="35" textAnchor="middle" style={{ fontSize:13, fontWeight:700, fill:"#2D2A26" }}>{value}</text>
      </svg>
      <div style={{ fontSize:10, color:"#999", marginTop:2 }}>{label}</div>
    </div>
  )
}

const GroceryItem = ({ item, checked, onToggle }) => (
  <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #F0EDE8", cursor:"pointer" }}>
    <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${checked?"#6B8F71":"#D0C9BE"}`, background:checked?"#6B8F71":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
      {checked && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>}
    </div>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:14, color:checked?"#BBB":"#2D2A26", textDecoration:checked?"line-through":"none", fontWeight:500, transition:"all 0.15s" }}>{item.p}</div>
      <div style={{ fontSize:11, color:checked?"#CCC":"#999", marginTop:1 }}>{item.q}{item.u ? ` — ${item.u}` : ''}</div>
    </div>
  </div>
)

const StepTimeline = ({ steps }) => (
  <div>
    {steps.map((step, i) => (
      <div key={i} style={{ display:"flex", gap:12, marginBottom:2 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:20, flexShrink:0 }}>
          <div style={{ width:10, height:10, borderRadius:5, background:"#C4956A", marginTop:6 }} />
          {i < steps.length - 1 && <div style={{ width:2, flex:1, background:"#E8E4DD", marginTop:2 }} />}
        </div>
        <div style={{ flex:1, background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:6, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:step.detail?4:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#2D2A26" }}>{step.action}</div>
            {step.duration && step.duration !== "—" && (
              <span style={{ fontSize:10, color:"#C4956A", fontWeight:600, fontFamily:"'Outfit',sans-serif", background:"#C4956A10", padding:"2px 6px", borderRadius:4 }}>{step.duration}</span>
            )}
          </div>
          {step.detail && <div style={{ fontSize:12, color:"#777", lineHeight:1.5, marginTop:2 }}>{step.detail}</div>}
        </div>
      </div>
    ))}
  </div>
)

// ── Main App ──
export default function PlanningView() {
  const { importId } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [DAYS, setDAYS] = useState([])
  const [GROCERIES, setGROCERIES] = useState([])
  const [PREP_DATA, setPREP_DATA] = useState({})
  const [planLabel, setPlanLabel] = useState('')

  const [view, setView] = useState("today")
  const [dayIdx, setDayIdx] = useState(0)
  const [person, setPerson] = useState("j")
  const [weekIdx, setWeekIdx] = useState(0)
  const [checked, setChecked] = useState({})
  const [touchStart, setTouchStart] = useState(null)

  useEffect(() => { loadData() }, [importId])

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
        const { days, groceries, prepData } = transformData(result.import.raw_json)
        setDAYS(days)
        setGROCERIES(groceries)
        setPREP_DATA(prepData)
      } else {
        const { days, groceries, prepData } = reconstructFromNormalized(result)
        setDAYS(days)
        setGROCERIES(groceries)
        setPREP_DATA(prepData)
      }
      setPlanLabel(result.import?.month_label || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const day = DAYS[dayIdx]
  const total = person === "j" ? day?.jt : day?.zt
  const tgtK = person === "j" ? 2050 : 1350
  const tgtP = person === "j" ? 170 : 90

  const prevDay = () => setDayIdx(i => Math.max(0, i - 1))
  const nextDay = () => setDayIdx(i => Math.min(DAYS.length - 1, i + 1))

  const handleTouchStart = e => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd = e => {
    if (!touchStart) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { diff > 0 ? nextDay() : prevDay() }
    setTouchStart(null)
  }

  const toggleCheck = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

  const groceryWeek = GROCERIES[weekIdx] || GROCERIES[0]
  const allItems = groceryWeek?.cats?.flatMap(c => c.items) || []
  const checkedCount = allItems.filter((_, i) => checked[`${weekIdx}-${i}`]).length

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#F7F4EF", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:"#8B7355" }}>
          <div style={{ width:40, height:40, border:"3px solid #E8E4DD", borderTop:"3px solid #C4956A", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }} />
          <div style={{ fontFamily:"'Outfit',sans-serif", fontSize:14 }}>Chargement...</div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight:"100vh", background:"#F7F4EF", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ textAlign:"center", color:"#D4634B" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>!</div>
          <div style={{ fontSize:16, fontWeight:600 }}>{error}</div>
          <button onClick={() => router.push('/planning')} style={{ marginTop:16, padding:"10px 24px", borderRadius:10, border:"none", background:"#C4956A", color:"#fff", fontWeight:600, cursor:"pointer" }}>
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!day) return null

  return (
    <div style={{ minHeight:"100vh", background:"#F7F4EF", fontFamily:"'Source Serif 4','Georgia',serif", maxWidth:480, margin:"0 auto", position:"relative", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700;800&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Organic bg shapes */}
      <div style={{ position:"fixed", top:-80, right:-60, width:220, height:220, borderRadius:"50%", background:"#6B8F7118", zIndex:0 }} />
      <div style={{ position:"fixed", top:200, left:-80, width:180, height:180, borderRadius:"50%", background:"#C4956A12", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:40, right:-40, width:160, height:160, borderRadius:"50%", background:"#D4634B08", zIndex:0 }} />

      {/* Person toggle */}
      <div style={{ position:"relative", zIndex:2, display:"flex", justifyContent:"center", paddingTop:16 }}>
        <div style={{ display:"flex", background:"#EDEAE5", borderRadius:20, padding:3 }}>
          {[["j","Julien"],["z","Zoé"]].map(([id,n]) => (
            <button key={id} onClick={() => setPerson(id)}
              style={{ padding:"6px 20px", borderRadius:17, border:"none", background:person===id?"#fff":"transparent",
                color:person===id?"#2D2A26":"#999", fontSize:13, fontWeight:600, cursor:"pointer",
                fontFamily:"'Outfit',sans-serif", boxShadow:person===id?"0 1px 3px rgba(0,0,0,0.08)":"none", transition:"all 0.2s" }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ position:"relative", zIndex:2, display:"flex", justifyContent:"center", gap:4, padding:"12px 16px 8px" }}>
        {[["today","Aujourd'hui","🍽️"],["prep","Ce soir","🔪"],["courses","Courses","🛒"]].map(([id,label,ico]) => (
          <button key={id} onClick={() => setView(id)}
            style={{ padding:"8px 16px", borderRadius:12, border:view===id?"2px solid #C4956A":"2px solid transparent",
              background:view===id?"#C4956A12":"transparent", color:view===id?"#8B7355":"#AAA",
              fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.2s" }}>
            {ico} {label}
          </button>
        ))}
      </div>

      {/* ── VIEW: TODAY ── */}
      {view === "today" && (
        <div style={{ position:"relative", zIndex:1, padding:"0 16px 100px" }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

          {/* Day header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0 16px" }}>
            <button onClick={prevDay} disabled={dayIdx===0}
              style={{ width:36, height:36, borderRadius:18, border:"none", background:dayIdx===0?"transparent":"#EDEAE5",
                color:"#8B7355", fontSize:18, cursor:dayIdx===0?"default":"pointer", opacity:dayIdx===0?0.3:1 }}>&#8249;</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:800, color:"#2D2A26" }}>{day.dn} {day.d}</div>
            </div>
            <button onClick={nextDay} disabled={dayIdx===DAYS.length-1}
              style={{ width:36, height:36, borderRadius:18, border:"none", background:dayIdx===DAYS.length-1?"transparent":"#EDEAE5",
                color:"#8B7355", fontSize:18, cursor:dayIdx===DAYS.length-1?"default":"pointer", opacity:dayIdx===DAYS.length-1?0.3:1 }}>&#8250;</button>
          </div>

          {/* Macro summary rings */}
          {total && (
            <div style={{ background:"#fff", borderRadius:20, padding:"16px 12px", marginBottom:14, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", display:"flex", justifyContent:"space-around", alignItems:"center" }}>
              <MacroRing value={total[0]} max={tgtK} color={total[0]>tgtK+100?"#D4634B":total[0]<tgtK-100?"#C4956A":"#6B8F71"} label="kcal" />
              <MacroRing value={total[1]} max={tgtP} color="#D4634B" label="Prot" />
              <MacroRing value={total[2]} max={person==="j"?170:120} color="#C4956A" label="Gluc" />
              <MacroRing value={total[3]} max={person==="j"?70:55} color="#7BA7BC" label="Lip" />
              <MacroRing value={total[4]} max={person==="j"?27:20} color="#6B8F71" label="Fib" />
            </div>
          )}

          {/* PDJ (Julien only) */}
          {person === "j" && (
            <MealCard emoji="🌅" label="Petit-déjeuner" descJ="200g skyr + 3 œufs durs (180g)" macrosJ={[383,44,9,18,0]} person="j" />
          )}

          {/* Meals */}
          <MealCard emoji="🌤️" label="Déjeuner" descJ={day.jd} macrosJ={day.jdm} descZ={day.zd} macrosZ={day.zdm} person={person} />
          <MealCard emoji="🌙" label="Dîner" descJ={day.jn} macrosJ={day.jnm} descZ={day.zn} macrosZ={day.znm} person={person} />
          <MealCard emoji="🥜" label="Collation" descJ={day.jc} macrosJ={day.jcm} descZ={day.zc} macrosZ={day.zcm} person={person} />

          {/* Batch info */}
          {day.batch && (
            <div style={{ background:"#FAF3E8", borderRadius:12, padding:"10px 14px", marginTop:4, borderLeft:"3px solid #C4956A" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#C4956A", fontFamily:"'Outfit',sans-serif", letterSpacing:0.5 }}>📦 BATCH</div>
              <div style={{ fontSize:12, color:"#8B7355", marginTop:2 }}>{day.batch}</div>
            </div>
          )}

          {/* Day dots */}
          <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:16, flexWrap:"wrap" }}>
            {DAYS.map((_, i) => (
              <div key={i} onClick={() => setDayIdx(i)}
                style={{ width:i===dayIdx?20:8, height:8, borderRadius:4, background:i===dayIdx?"#C4956A":"#D0C9BE", cursor:"pointer", transition:"all 0.2s" }} />
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW: PREP ── */}
      {view === "prep" && (() => {
        const data = PREP_DATA[day.d]
        const tmr = dayIdx < DAYS.length - 1 ? DAYS[dayIdx + 1] : null

        return (
          <div style={{ position:"relative", zIndex:1, padding:"0 16px 100px" }}>

            {/* Header with nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0" }}>
              <button onClick={prevDay} disabled={dayIdx===0}
                style={{ width:36, height:36, borderRadius:18, border:"none", background:dayIdx===0?"transparent":"#EDEAE5",
                  color:"#8B7355", fontSize:18, cursor:dayIdx===0?"default":"pointer", opacity:dayIdx===0?0.3:1 }}>&#8249;</button>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#999", fontFamily:"'Outfit',sans-serif", letterSpacing:1 }}>CE SOIR</div>
                <div style={{ fontSize:22, fontWeight:800, color:"#2D2A26" }}>{day.dn} {day.d}</div>
              </div>
              <button onClick={nextDay} disabled={dayIdx===DAYS.length-1}
                style={{ width:36, height:36, borderRadius:18, border:"none", background:dayIdx===DAYS.length-1?"transparent":"#EDEAE5",
                  color:"#8B7355", fontSize:18, cursor:dayIdx===DAYS.length-1?"default":"pointer", opacity:dayIdx===DAYS.length-1?0.3:1 }}>&#8250;</button>
            </div>

            {/* SECTION 1: DÎNER CE SOIR */}
            {data?.dinner && (
              <div style={{ marginBottom:24 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, padding:"0 2px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>🍽️</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:"#2D2A26" }}>Dîner ce soir</div>
                      <div style={{ fontSize:12, color:"#8B7355" }}>{data.dinner.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#D4634B", background:"#D4634B12", padding:"4px 10px", borderRadius:8, fontFamily:"'Outfit',sans-serif" }}>
                    ⏱️ {data.dinner.totalTime}
                  </div>
                </div>

                {/* Portions J + Z */}
                <div style={{ background:"#fff", borderRadius:12, padding:"10px 14px", marginBottom:10, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", display:"flex", gap:12 }}>
                  <div style={{ flex:1, paddingLeft:4, borderLeft:"3px solid #D4634B30" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:"#D4634B", fontFamily:"'Outfit',sans-serif" }}>JULIEN</div>
                    <div style={{ fontSize:11, color:"#555", lineHeight:1.4 }}>{day.jn}</div>
                  </div>
                  <div style={{ flex:1, paddingLeft:4, borderLeft:"3px solid #6B8F7130" }}>
                    <div style={{ fontSize:9, fontWeight:700, color:"#6B8F71", fontFamily:"'Outfit',sans-serif" }}>ZOÉ</div>
                    <div style={{ fontSize:11, color:"#555", lineHeight:1.4 }}>{day.zn}</div>
                  </div>
                </div>

                <StepTimeline steps={data.dinner.steps} />
              </div>
            )}

            {/* SECTION 2: PREP DEMAIN */}
            {data?.prep ? (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, padding:"0 2px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>📦</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:"#2D2A26" }}>Prep pour demain</div>
                      <div style={{ fontSize:12, color:"#8B7355" }}>Après le dîner ou en parallèle</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#C4956A", background:"#C4956A12", padding:"4px 10px", borderRadius:8, fontFamily:"'Outfit',sans-serif" }}>
                    ⏱️ {data.prep.totalTime}
                  </div>
                </div>

                {/* Dish recap */}
                <div style={{ background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:10, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  {data.prep.dishes.map((dish, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:i<data.prep.dishes.length-1?"1px solid #F0EDE8":"none" }}>
                      <span style={{ fontSize:16 }}>{dish.type==="batch"?"🍲":"📦"}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#2D2A26" }}>{dish.name}</div>
                        <div style={{ fontSize:10, color:"#999" }}>→ {dish.for}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <StepTimeline steps={data.prep.steps} />
              </div>
            ) : !data?.dinner ? (
              <div style={{ background:"#EDF7EF", borderRadius:20, padding:"32px 24px", textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#6B8F71" }}>Soir libre !</div>
                <div style={{ fontSize:13, color:"#6B8F71", marginTop:4, opacity:0.8 }}>Pas de prep. Tout se cuisine frais demain.</div>
              </div>
            ) : (
              <div style={{ background:"#EDF7EF", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>✅</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#6B8F71" }}>Pas de prep ce soir</div>
                  <div style={{ fontSize:11, color:"#6B8F71", opacity:0.8 }}>Après le dîner : repos !</div>
                </div>
              </div>
            )}

            {/* Tomorrow preview */}
            {tmr && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#999", fontFamily:"'Outfit',sans-serif", marginBottom:10, paddingLeft:4 }}>
                  DEMAIN — {tmr.dn} {tmr.d}
                </div>
                <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:8, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#8B7355", letterSpacing:1, marginBottom:4 }}>🌤️ MIDI</div>
                      <div style={{ fontSize:11, color:"#2D2A26", lineHeight:1.4 }}>{tmr.jd?.slice(0, 60)}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#8B7355", letterSpacing:1, marginBottom:4 }}>🌙 SOIR</div>
                      <div style={{ fontSize:11, color:"#2D2A26", lineHeight:1.4 }}>{tmr.jn?.slice(0, 60)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Day dots */}
            <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:16, flexWrap:"wrap" }}>
              {DAYS.map((_, i) => (
                <div key={i} onClick={() => setDayIdx(i)}
                  style={{ width:i===dayIdx?20:8, height:8, borderRadius:4, background:i===dayIdx?"#C4956A":"#D0C9BE", cursor:"pointer", transition:"all 0.2s" }} />
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── VIEW: COURSES ── */}
      {view === "courses" && groceryWeek && (
        <div style={{ position:"relative", zIndex:1, padding:"0 16px 100px" }}>
          <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
            <div style={{ fontSize:20, fontWeight:800, color:"#2D2A26" }}>Listes de courses</div>
          </div>

          {/* Week selector */}
          <div style={{ display:"flex", gap:6, marginBottom:12, justifyContent:"center" }}>
            {GROCERIES.map((g, i) => (
              <button key={i} onClick={() => setWeekIdx(i)}
                style={{ padding:"6px 16px", borderRadius:10, border:`2px solid ${weekIdx===i?"#6B8F71":"#E0DCD5"}`,
                  background:weekIdx===i?"#6B8F71":"transparent", color:weekIdx===i?"#fff":"#999",
                  fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                S{g.week}
              </button>
            ))}
          </div>

          {/* Progress */}
          <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", marginBottom:14, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#2D2A26", fontFamily:"'Outfit',sans-serif" }}>{groceryWeek.label}</span>
              <span style={{ fontSize:12, color:checkedCount===allItems.length?"#6B8F71":"#999", fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>
                {checkedCount}/{allItems.length}
              </span>
            </div>
            <div style={{ height:4, borderRadius:2, background:"#EDEAE5", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${allItems.length ? (checkedCount/allItems.length)*100 : 0}%`, background:"#6B8F71", borderRadius:2, transition:"width 0.3s" }} />
            </div>
          </div>

          {/* Categories */}
          {groceryWeek.cats.map((cat, ci) => {
            let globalStart = 0
            for (let k = 0; k < ci; k++) globalStart += groceryWeek.cats[k].items.length
            return (
              <div key={ci} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#C4956A", letterSpacing:1, textTransform:"uppercase",
                  fontFamily:"'Outfit',sans-serif", padding:"8px 0 4px" }}>{cat.name}</div>
                <div style={{ background:"#fff", borderRadius:14, padding:"4px 16px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                  {cat.items.map((item, ii) => (
                    <GroceryItem key={ii} item={item}
                      checked={!!checked[`${weekIdx}-${globalStart + ii}`]}
                      onToggle={() => toggleCheck(`${weekIdx}-${globalStart + ii}`)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
