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
import { Sparkles, Package, Camera, Plus, AlertTriangle, Scale, ChevronRight, Settings, CalendarDays, BarChart3, ShoppingCart } from 'lucide-react'
import './home.css'

const daysUntil = (d) => {
  if (!d) return null;
  const todayISO = new Date().toISOString().split('T')[0];
  const targetISO = String(d).split('T')[0];
  return Math.round((new Date(targetISO) - new Date(todayISO)) / 86400000);
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
  const [shoppingStats, setShoppingStats] = useState({ total: 0, checked: 0, uncheckedByCategory: [] })

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
      if (d.imports?.length) setLatestImportId(d.imports[0].id)
    } catch {}
  }

  async function loadStock() {
    try {
      const { data } = await supabase.from('inventory_lots').select('id, qty_remaining, expiration_date, notes').gt('qty_remaining', 0)
      if (!data) return
      const urgent = []
      let expiring = 0, expired = 0
      for (const lot of data) {
        const d = daysUntil(lot.expiration_date)
        if (d !== null && d < 0) expired++
        if (d !== null && d >= 0 && d <= 3) { expiring++; if (urgent.length < 4) urgent.push({ ...lot, days: d, name: lot.notes || `#${lot.id}` }) }
      }
      setStockStats({ total: data.length, expiring, expired, urgentItems: urgent })
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
      if (!d.imports?.length) return
      const r2 = await authFetch(`/api/planning/imports/${d.imports[0].id}`)
      const d2 = await r2.json()
      const items = d2.shoppingItems || []
      if (!items.length) return
      const checked = items.filter(i => i.checked).length
      const byCat = {}
      for (const it of items) {
        if (it.checked) continue
        const c = it.category || 'Autres'
        byCat[c] = (byCat[c] || 0) + 1
      }
      const uncheckedByCategory = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, count]) => ({ name, count }))
      setShoppingStats({ total: items.length, checked, uncheckedByCategory })
    } catch {}
  }

  const pg = goals.find(g => g.person_name === person) || {}
  const pn = nutritionToday[person] || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return (
    <div className="myko-loading" style={{ margin: '20vh auto', maxWidth: 400 }}>
      Chargement de Myko…
    </div>
  )

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="home-page">
        <div className="home-bento">

          {/* HERO — pleine largeur */}
          <div className="home-cell home-hero">
            <div>
              <p className="home-greeting">{greeting}</p>
              <h1 className="home-title">Qu'est-ce qu'on<br />mange ?</h1>
            </div>
            <Link href="/planning/assistant" className="btn-primary">
              <Sparkles size={18} />
              <span>Demander à Myko</span>
            </Link>
          </div>

          {/* PLANNING DU JOUR — pleine largeur */}
          <div className="home-cell home-cell-full">
            <div className="home-cell-header">
              <span className="home-cell-label"><CalendarDays size={14} /> Vos repas</span>
              <Link href="/planning" className="home-cell-link">Semaine <ChevronRight size={12} /></Link>
            </div>
            {latestImportId ? (
              <TodayMeals importId={latestImportId} />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p className="home-empty-hint">Pas encore de planning</p>
                <Link href="/planning/assistant" className="home-empty-btn">
                  <Sparkles size={14} /> Créer un planning
                </Link>
              </div>
            )}
          </div>

          {/* STOCK — cellule gauche grande */}
          <div className="home-cell home-cell-stock">
            <Link href="/pantry" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="home-cell-header">
                <span className="home-cell-label"><Package size={14} /> Stock</span>
              </div>
              <div className="home-big-number">{stockStats.total}</div>
              <p className="home-big-label">produits</p>
              {(stockStats.expiring > 0 || stockStats.expired > 0) && (
                <div className="home-alert-pill">
                  <AlertTriangle size={12} />
                  {stockStats.expired > 0 && <span className="home-alert-expired">{stockStats.expired} !</span>}
                  {stockStats.expiring > 0 && <span className="home-alert-expiring">{stockStats.expiring} bientôt</span>}
                </div>
              )}
            </Link>
            {stockStats.urgentItems.length > 0 && (
              <div className="home-urgent-list">
                {stockStats.urgentItems.map((it, i) => (
                  <div key={i} className="home-urgent-row">
                    <span className="home-urgent-name">{it.name}</span>
                    <span className={`home-urgent-badge ${it.days <= 0 ? 'home-urgent-expired' : 'home-urgent-warning'}`}>
                      {it.days <= 0 ? '!' : `${it.days}j`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AJOUTER */}
          <button onClick={() => setShowAddForm(true)} className="home-cell home-action-cell">
            <Plus size={24} className="home-action-icon-green" />
            <span className="home-action-label">Ajouter</span>
          </button>

          {/* SCANNER */}
          <button onClick={() => setShowOcr(true)} className="home-cell home-action-cell">
            <Camera size={24} className="home-action-icon-blue" />
            <span className="home-action-label">Scanner</span>
          </button>

          {/* COURSES — pleine largeur */}
          <Link href="/courses" className="home-cell home-cell-full home-cell-link-block">
            <div className="home-cell-header">
              <span className="home-cell-label"><ShoppingCart size={14} /> Courses</span>
              {shoppingStats.total > 0 && (
                <span className="home-cell-link">{shoppingStats.total - shoppingStats.checked} restants <ChevronRight size={12} /></span>
              )}
            </div>
            {shoppingStats.total > 0 ? (
              <>
                <div className="home-progress-row">
                  <div className="home-progress-bar">
                    <div className="home-progress-fill" style={{ width: `${(shoppingStats.checked / shoppingStats.total) * 100}%` }} />
                  </div>
                  <span className="home-progress-label">{shoppingStats.checked}/{shoppingStats.total}</span>
                </div>
                {shoppingStats.uncheckedByCategory.length > 0 && (
                  <div className="home-pills">
                    {shoppingStats.uncheckedByCategory.map(c => (
                      <span key={c.name} className="home-pill">{c.name} ({c.count})</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="home-empty-hint">Pas de liste en cours</p>
            )}
          </Link>

          {/* POIDS */}
          <Link href="/nutrition" className="home-cell home-weight-cell">
            <Scale size={20} className="home-weight-icon" />
            {latestWeight ? (
              <>
                <span className="home-weight-value">{latestWeight.weight_kg}</span>
                <span className="home-weight-unit">kg</span>
                {pg.target_weight_kg && <span className="home-weight-target">→ {pg.target_weight_kg}</span>}
              </>
            ) : (
              <span className="home-empty-hint" style={{ fontSize: 12 }}>Pas de mesure</span>
            )}
          </Link>

          {/* MACROS */}
          <div className="home-cell home-cell-macros">
            <div className="home-cell-header">
              <span className="home-cell-label"><BarChart3 size={14} /> Nutrition</span>
              <PersonSelector selected={person} onChange={setPerson} />
            </div>
            {pg.target_calories ? (
              <div style={{ marginTop: 4 }}>
                <NutritionBar label="kcal" value={pn.kcal} target={pg.target_calories} color="var(--brand)" />
                <NutritionBar label="Prot" value={pn.protein_g} target={pg.target_protein_g} unit="g" color="#3b82f6" />
                <NutritionBar label="Gluc" value={pn.carbs_g} target={pg.target_carbs_g} unit="g" color="#f59e0b" />
                <NutritionBar label="Lip" value={pn.fat_g} target={pg.target_fat_g} unit="g" color="#ef4444" />
              </div>
            ) : (
              <Link href="/nutrition/onboarding" className="home-empty-btn" style={{ marginTop: 12 }}>
                <Settings size={14} /> Configurer
              </Link>
            )}
          </div>

          {/* QUICK NAV */}
          <div className="home-nav-grid">
            <Link href="/planning/assistant" className="home-cell home-nav-cell">
              <Sparkles size={18} style={{ color: 'var(--brand)' }} />
              <span>Myko</span>
            </Link>
            <Link href="/pantry" className="home-cell home-nav-cell">
              <Package size={18} style={{ color: 'var(--brand)' }} />
              <span>Stock</span>
            </Link>
            <Link href="/planning" className="home-cell home-nav-cell">
              <CalendarDays size={18} style={{ color: 'var(--ink-2)' }} />
              <span>Planning</span>
            </Link>
            <Link href="/courses" className="home-cell home-nav-cell">
              <ShoppingCart size={18} style={{ color: 'var(--accent)' }} />
              <span>Courses</span>
            </Link>
            <Link href="/nutrition" className="home-cell home-nav-cell">
              <BarChart3 size={18} style={{ color: 'var(--ink-2)' }} />
              <span>Nutrition</span>
            </Link>
          </div>

        </div>
      </div>

      {showAddForm && <SmartAddForm open onClose={() => { setShowAddForm(false); loadStock() }} onLotCreated={() => { setShowAddForm(false); loadStock() }} />}
      {showOcr && <OcrReviewList onClose={() => setShowOcr(false)} onItemsAdded={() => { setShowOcr(false); loadStock() }} />}
    </>
  )
}
