'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import NutritionBar from '@/components/ui/NutritionBar'
import PersonSelector from '@/components/ui/PersonSelector'
import TodayMeals from './planning/components/TodayMeals'
import OcrReviewList from './pantry/components/OcrReviewList'
import SmartAddForm from './pantry/components/SmartAddForm'
import { Sparkles, Package, Camera, Plus, Settings, CalendarDays, BarChart3, ShoppingCart } from 'lucide-react'
import './home.css'

const daysUntil = (d) => {
  if (!d) return null;
  const todayISO = new Date().toISOString().split('T')[0];
  const targetISO = String(d).split('T')[0];
  return Math.round((new Date(targetISO) - new Date(todayISO)) / 86400000);
}

// Choisit l'import qui COUVRE aujourd'hui (comme le planning), sinon le dernier.
const pickImportForToday = (imports) => {
  if (!imports?.length) return null;
  const today = new Date().toISOString().split('T')[0];
  return imports.find(i =>
    i.date_range_start && i.date_range_end &&
    i.date_range_start <= today && i.date_range_end >= today
  ) || imports[0];
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [latestImportId, setLatestImportId] = useState(null)
  const [stockStats, setStockStats] = useState({ total: 0, expiring: 0, expired: 0, urgentItems: [] })
  const [nutritionToday, setNutritionToday] = useState({})
  const [goals, setGoals] = useState([])
  const [person, setPerson] = useState('')
  const [latestWeight, setLatestWeight] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showOcr, setShowOcr] = useState(false)
  const [shoppingStats, setShoppingStats] = useState({ total: 0, checked: 0, uncheckedByCategory: [], nextItems: [] })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      loadAll()
    })
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadPlan(), loadStock(), loadNutrition(), loadGoals(), loadWeight(), loadShopping()])
    setLoading(false)
  }

  async function loadPlan() {
    try {
      const r = await authFetch('/api/planning/imports')
      const d = await r.json()
      const imp = pickImportForToday(d.imports)
      if (imp) setLatestImportId(imp.id)
    } catch {}
  }

  async function loadStock() {
    try {
      const { data } = await supabase
        .from('inventory_lots')
        .select('id, qty_remaining, expiration_date, archetype:archetypes(name), canonical_food:canonical_foods(canonical_name), product:products(name)')
        .gt('qty_remaining', 0)
      if (!data) return
      const urgent = []
      let expiring = 0, expired = 0
      for (const lot of data) {
        const d = daysUntil(lot.expiration_date)
        if (d === null) continue
        if (d < 0) expired++
        else if (d <= 3) expiring++
        // « À consommer vite » : périmé, DLC (J-3) et DDM (J-7)
        if (d <= 7) {
          const name = lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || `Lot #${lot.id}`
          urgent.push({ id: lot.id, days: d, name })
        }
      }
      urgent.sort((a, b) => a.days - b.days)
      setStockStats({ total: data.length, expiring, expired, urgentItems: urgent.slice(0, 5) })
    } catch {}
  }

  async function loadNutrition() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const r = await authFetch(`/api/nutrition/log?from=${today}&to=${today}`)
      const d = await r.json()
      if (!d.entries) return
      const bp = {}
      for (const e of d.entries) {
        const p = e.person_name || 'Julien'
        if (!bp[p]) bp[p] = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
        bp[p].kcal += e.kcal || 0; bp[p].protein_g += e.protein_g || 0
        bp[p].carbs_g += e.carbs_g || 0; bp[p].fat_g += e.fat_g || 0
      }
      setNutritionToday(bp)
    } catch {}
  }

  async function loadGoals() {
    try {
      const res = await authFetch('/api/nutrition/goals')
      const data = await res.json()
      if (data.goals) setGoals(data.goals)
    } catch {}
  }

  async function loadWeight() {
    try { const r = await authFetch('/api/nutrition/weight?limit=1'); const d = await r.json(); if (d.entries?.length) setLatestWeight(d.entries[0]) } catch {}
  }

  async function loadShopping() {
    try {
      const r = await authFetch('/api/planning/imports')
      const d = await r.json()
      const imp = pickImportForToday(d.imports)
      if (!imp) return
      const r2 = await authFetch(`/api/planning/imports/${imp.id}`)
      const d2 = await r2.json()
      const items = d2.shoppingItems || []
      if (!items.length) return
      const checked = items.filter(i => i.checked).length
      const byCat = {}
      const nextItems = []
      for (const it of items) {
        if (it.checked) continue
        const c = it.category || 'Autres'
        byCat[c] = (byCat[c] || 0) + 1
        if (nextItems.length < 6 && it.product_name) nextItems.push(it.product_name)
      }
      const uncheckedByCategory = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count }))
      setShoppingStats({ total: items.length, checked, uncheckedByCategory, nextItems })
    } catch {}
  }

  const pg = goals.find(g => g.person_name === person) || {}
  const pn = nutritionToday[person] || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)
  const surveiller = stockStats.expiring + stockStats.expired
  const coursesLeft = shoppingStats.total > 0 ? shoppingStats.total - shoppingStats.checked : 0

  if (loading) return (
    <div className="v21-home" aria-busy="true" aria-label="Chargement de Myko">
      <div className="skeleton" style={{ height: 150, borderRadius: 'var(--r-card)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
        {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 'var(--r-card)' }} />)}
      </div>
      <div className="skeleton" style={{ height: 220, borderRadius: 'var(--r-card)', marginTop: 24 }} />
    </div>
  )

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="v21-home">

        {/* HERO ÉDITORIAL */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">{dateCap} · réseau mycorhizien</span>
            <h1 className="v21-title">{greeting}.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Ce qui mûrit, ce qui se cuisine, ce qui se partage.</p>
          </div>
          <div className="v21-hero-side">
            <button onClick={() => setShowAddForm(true)} className="v21-btn"><Plus size={15} /> Ajouter</button>
            <button onClick={() => setShowOcr(true)} className="v21-btn ghost"><Camera size={15} /> Scanner</button>
          </div>
        </header>

        {/* STATS — bandeau à filets */}
        <div className="v21-stats">
          <Link href="/pantry" className="v21-stat">
            <span className="v21-stat-l">Garde-manger</span>
            <span className="v21-stat-v">{stockStats.total}</span>
            <span className="v21-stat-s">{surveiller > 0 ? `${surveiller} à surveiller` : 'produits en stock'}</span>
          </Link>
          <Link href="/courses" className="v21-stat">
            <span className="v21-stat-l">Courses</span>
            <span className="v21-stat-v">{coursesLeft}</span>
            <span className="v21-stat-s">{shoppingStats.total > 0 ? `restants · ${shoppingStats.checked}/${shoppingStats.total}` : 'rien à acheter'}</span>
          </Link>
          <Link href="/nutrition" className="v21-stat">
            <span className="v21-stat-l">Poids</span>
            <span className="v21-stat-v">{latestWeight ? latestWeight.weight_kg : '—'}</span>
            <span className="v21-stat-s">{latestWeight ? (pg.target_weight_kg ? `kg → ${pg.target_weight_kg}` : 'kg') : 'pas de mesure'}</span>
          </Link>
        </div>

        {/* À SURVEILLER (anti-gaspi) */}
        {stockStats.urgentItems.length > 0 && (
          <section className="v21-block">
            <div className="v21-bh"><span className="v21-bl">À surveiller</span><Link href="/pantry" className="v21-link">Garde-manger →</Link></div>
            <div className="v21-urgent">
              {stockStats.urgentItems.map((it) => (
                <Link key={it.id} href="/pantry" className="v21-urgent-row">
                  <span className="v21-urgent-name">{it.name}</span>
                  <span className={`v21-urgent-tag ${it.days <= 0 ? 'exp' : 'soon'}`}>{it.days <= 0 ? 'périmé' : `J-${it.days}`}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* REPAS + NUTRITION */}
        <div className="v21-cols">
          <section className="v21-block">
            <div className="v21-bh"><span className="v21-bl">Repas — aujourd'hui</span><Link href="/planning" className="v21-link">Semaine →</Link></div>
            {latestImportId ? (
              <TodayMeals importId={latestImportId} />
            ) : (
              <div className="v21-empty">
                <p>Pas encore de planning cette semaine.</p>
                <Link href="/planning/assistant" className="v21-btn"><Sparkles size={15} /> Créer un planning</Link>
              </div>
            )}
          </section>
          <section className="v21-block">
            <div className="v21-bh"><span className="v21-bl">Nutrition</span><PersonSelector selected={person} onChange={setPerson} /></div>
            {pg.target_calories ? (
              <div className="v21-macros">
                <NutritionBar label="kcal" value={pn.kcal} target={pg.target_calories} color="var(--brand)" />
                <NutritionBar label="Prot" value={pn.protein_g} target={pg.target_protein_g} unit="g" color="#3b82f6" />
                <NutritionBar label="Gluc" value={pn.carbs_g} target={pg.target_carbs_g} unit="g" color="#f59e0b" />
                <NutritionBar label="Lip" value={pn.fat_g} target={pg.target_fat_g} unit="g" color="#ef4444" />
              </div>
            ) : pn.kcal > 0 ? (
              <div>
                <p className="v21-next" style={{ marginTop: 0 }}>Consommé aujourd'hui</p>
                <p style={{ margin: '4px 0 12px', fontFamily: 'var(--font-display)', color: 'var(--ink-1)', fontSize: 18 }}>
                  {Math.round(pn.kcal)} kcal · {Math.round(pn.protein_g)}g P · {Math.round(pn.carbs_g)}g G · {Math.round(pn.fat_g)}g L
                </p>
                <Link href="/nutrition/onboarding" className="v21-btn ghost"><Settings size={15} /> Définir des objectifs</Link>
              </div>
            ) : (
              <Link href="/nutrition/onboarding" className="v21-btn ghost"><Settings size={15} /> Configurer mes objectifs</Link>
            )}
          </section>
        </div>

        {/* COURSES */}
        <section className="v21-block">
          <div className="v21-bh"><span className="v21-bl">Courses</span>{shoppingStats.total > 0 && <Link href="/courses" className="v21-link">{coursesLeft} restants →</Link>}</div>
          {shoppingStats.total > 0 ? (
            <>
              <div className="v21-prog"><div className="v21-prog-fill" style={{ width: `${(shoppingStats.checked / shoppingStats.total) * 100}%` }} /></div>
              {shoppingStats.uncheckedByCategory.length > 0 && (
                <div className="v21-cats">
                  {shoppingStats.uncheckedByCategory.map(c => (
                    <Link key={c.name} href="/courses" className="v21-cat">{c.name} · {c.count}</Link>
                  ))}
                </div>
              )}
              {shoppingStats.nextItems?.length > 0 && (
                <p className="v21-next">À acheter : {shoppingStats.nextItems.join(' · ')}{coursesLeft > shoppingStats.nextItems.length ? '…' : ''}</p>
              )}
            </>
          ) : (
            <Link href="/planning/assistant" className="v21-btn ghost"><Sparkles size={15} /> Créer une liste</Link>
          )}
        </section>

        {/* NAV RAPIDE */}
        <nav className="v21-nav">
          <Link href="/planning/assistant" className="v21-navlink"><Sparkles size={15} /> Myko</Link>
          <Link href="/pantry" className="v21-navlink"><Package size={15} /> Stock</Link>
          <Link href="/planning" className="v21-navlink"><CalendarDays size={15} /> Planning</Link>
          <Link href="/courses" className="v21-navlink"><ShoppingCart size={15} /> Courses</Link>
          <Link href="/nutrition" className="v21-navlink"><BarChart3 size={15} /> Nutrition</Link>
        </nav>

      </div>

      {showAddForm && <SmartAddForm open onClose={() => { setShowAddForm(false); loadStock() }} onLotCreated={() => { setShowAddForm(false); loadStock() }} />}
      {showOcr && <OcrReviewList onClose={() => setShowOcr(false)} onItemsAdded={() => { setShowOcr(false); loadStock() }} />}
    </>
  )
}
