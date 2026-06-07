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

// Registre garde-manger (ledger V21) — onglets + libellé d'état
const STOCK_TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'exp', label: 'Expirés' },
  { key: 'soon', label: 'Bientôt' },
  { key: 'ok', label: 'Bon état' },
]
const stockStatusLabel = (it) => {
  if (it.status === 'exp') return 'Périmé'
  if (it.status === 'soon') return it.days <= 0 ? "Aujourd'hui" : it.days === 1 ? 'Demain' : `J-${it.days}`
  return it.days != null ? `${it.days} j` : '—'
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [latestImportId, setLatestImportId] = useState(null)
  const [stockStats, setStockStats] = useState({ total: 0, expiring: 0, expired: 0, urgentItems: [], items: [] })
  const [stockTab, setStockTab] = useState('all')
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
        .select('id, qty_remaining, unit, storage_place, expiration_date, archetype:archetypes(name), canonical_food:canonical_foods(canonical_name), product:products(name)')
        .gt('qty_remaining', 0)
      if (!data) return
      const items = []
      let expiring = 0, expired = 0
      for (const lot of data) {
        const d = daysUntil(lot.expiration_date)
        if (d !== null) {
          if (d < 0) expired++
          else if (d <= 3) expiring++
        }
        const name = lot.product?.name || lot.archetype?.name || lot.canonical_food?.canonical_name || `Lot #${lot.id}`
        const status = d === null ? 'ok' : d < 0 ? 'exp' : d <= 3 ? 'soon' : 'ok'
        const q = lot.qty_remaining != null ? +(+lot.qty_remaining).toFixed(2) : null
        const qty = q != null ? `${q}${lot.unit ? ' ' + lot.unit : ''}` : ''
        items.push({ id: lot.id, name, qty, location: lot.storage_place || '', days: d, status })
      }
      const rank = { exp: 0, soon: 1, ok: 2 }
      items.sort((a, b) => (rank[a.status] - rank[b.status]) || ((a.days ?? 9999) - (b.days ?? 9999)))
      const urgentItems = items.filter(i => i.status !== 'ok').slice(0, 5)
      setStockStats({ total: data.length, expiring, expired, urgentItems, items })
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
  const filteredStock = (stockStats.items || []).filter(it => stockTab === 'all' || it.status === stockTab).slice(0, 6)

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

        {/* REPAS — aujourd'hui | COURSES + NUTRITION (deux colonnes V21) */}
        <div className="v21-cols">
          {/* Colonne gauche — Repas */}
          <section className="v21-col v21-col-main">
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

          {/* Colonne droite — Courses puis Nutrition */}
          <section className="v21-col v21-col-side">
            <div className="v21-sub">
              <div className="v21-bh"><span className="v21-bl">Courses</span>{shoppingStats.total > 0 && <Link href="/courses" className="v21-link">Ouvrir →</Link>}</div>
              {shoppingStats.total > 0 ? (
                <>
                  <div className="v21-bignum">{shoppingStats.checked} / {shoppingStats.total}</div>
                  <div className="v21-prog"><div className="v21-prog-fill" style={{ width: `${(shoppingStats.checked / shoppingStats.total) * 100}%` }} /></div>
                  {shoppingStats.uncheckedByCategory.length > 0 && (
                    <div className="v21-cats">
                      {shoppingStats.uncheckedByCategory.map(c => (
                        <Link key={c.name} href="/courses" className="v21-cat">{c.name} · {c.count}</Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href="/planning/assistant" className="v21-btn ghost"><Sparkles size={15} /> Créer une liste</Link>
              )}
            </div>

            <div className="v21-sub v21-sub-divided">
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
            </div>
          </section>
        </div>

        {/* GARDE-MANGER — registre (ledger éditorial) */}
        <section className="v21-ledger">
          <div className="v21-ledger-h">
            <h2 className="v21-ledger-title">Garde-manger</h2>
            <span className="v21-ledger-c">{stockStats.total} produit{stockStats.total !== 1 ? 's' : ''} · {surveiller} à surveiller</span>
          </div>
          {stockStats.total > 0 ? (
            <>
              <div className="v21-tabs" role="tablist" aria-label="Filtrer le garde-manger">
                {STOCK_TABS.map(t => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={stockTab === t.key}
                    className={`v21-tab ${stockTab === t.key ? 'on' : ''}`}
                    onClick={() => setStockTab(t.key)}
                  >{t.label}</button>
                ))}
              </div>
              {filteredStock.length > 0 ? (
                <div className="v21-its">
                  {filteredStock.map(it => (
                    <Link key={it.id} href="/pantry" className={`v21-it ${it.status}`}>
                      <span className="v21-it-bar" aria-hidden="true" />
                      <span className="v21-it-n">{it.name}</span>
                      <span className="v21-it-q">{it.qty}</span>
                      <span className="v21-it-lc">{it.location}</span>
                      <span className="v21-it-st">{stockStatusLabel(it)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="v21-next">Rien dans cette catégorie.</p>
              )}
              {(stockStats.items || []).length > filteredStock.length && (
                <Link href="/pantry" className="v21-link v21-ledger-all">Tout le garde-manger →</Link>
              )}
            </>
          ) : (
            <div className="v21-empty" style={{ paddingTop: 18 }}>
              <p>Ton garde-manger est vide.</p>
              <button onClick={() => setShowAddForm(true)} className="v21-btn"><Plus size={15} /> Ajouter un produit</button>
            </div>
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
