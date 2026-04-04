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
import { Sparkles, Package, Camera, Plus, AlertTriangle, Scale, ChevronRight, Settings, CalendarDays, BarChart3 } from 'lucide-react'

const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [latestImportId, setLatestImportId] = useState(null)
  const [stockStats, setStockStats] = useState({ total: 0, expiring: 0, expired: 0, urgentItems: [] })
  const [nutritionToday, setNutritionToday] = useState({})
  const [goals, setGoals] = useState([])
  const [person, setPerson] = useState('Julien')
  const [latestWeight, setLatestWeight] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showOcr, setShowOcr] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      loadAll()
    })
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadPlan(), loadStock(), loadNutrition(), loadGoals(), loadWeight()])
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
    try { const { data } = await supabase.from('user_health_goals').select('*'); if (data) setGoals(data) } catch {}
  }

  async function loadWeight() {
    try { const r = await authFetch('/api/nutrition/weight?limit=1'); const d = await r.json(); if (d.entries?.length) setLatestWeight(d.entries[0]) } catch {}
  }

  const pg = goals.find(g => g.person_name === person) || {}
  const pn = nutritionToday[person] || { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 40 }}>🥬</span>
      <p style={{ color: '#7f8c7f', marginTop: 12 }}>Chargement...</p>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.bento}>

        {/* ═══ HERO — span full width ═══ */}
        <div style={{ ...S.cell, ...S.hero, gridColumn: '1 / -1' }}>
          <div>
            <p style={S.heroGreeting}>{greeting}</p>
            <h1 style={S.heroTitle}>Qu'est-ce qu'on<br />mange ?</h1>
          </div>
          <Link href="/planning/assistant" style={S.heroCta}>
            <Sparkles size={18} />
            <span>Demander à Myko</span>
          </Link>
        </div>

        {/* ═══ PLANNING DU JOUR — large cell ═══ */}
        <div style={{ ...S.cell, gridColumn: '1 / -1', minHeight: 0 }}>
          <div style={S.cellHeader}>
            <span style={S.cellLabel}>
              <CalendarDays size={14} /> Aujourd'hui
            </span>
            <Link href="/planning" style={S.cellLink}>Semaine <ChevronRight size={12} /></Link>
          </div>
          {latestImportId ? (
            <TodayMeals importId={latestImportId} />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 10 }}>Pas encore de planning</p>
              <Link href="/planning/assistant" style={S.emptyBtn}>
                <Sparkles size={14} /> Créer un planning
              </Link>
            </div>
          )}
        </div>

        {/* ═══ STOCK — left cell ═══ */}
        <div style={{ ...S.cell, gridColumn: 'span 1', gridRow: 'span 2' }}>
          <Link href="/pantry" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={S.cellHeader}>
              <span style={S.cellLabel}><Package size={14} /> Stock</span>
            </div>
            <div style={S.bigNumber}>{stockStats.total}</div>
            <p style={S.bigLabel}>produits</p>

            {(stockStats.expiring > 0 || stockStats.expired > 0) && (
              <div style={S.alertPill}>
                <AlertTriangle size={12} />
                {stockStats.expired > 0 && <span style={{ color: '#ef4444' }}>{stockStats.expired} !</span>}
                {stockStats.expiring > 0 && <span style={{ color: '#f59e0b' }}>{stockStats.expiring} bientôt</span>}
              </div>
            )}
          </Link>

          {stockStats.urgentItems.length > 0 && (
            <div style={S.urgentList}>
              {stockStats.urgentItems.map((it, i) => (
                <div key={i} style={S.urgentRow}>
                  <span style={S.urgentName}>{it.name}</span>
                  <span style={{ ...S.urgentBadge, color: it.days <= 0 ? '#ef4444' : '#f59e0b' }}>
                    {it.days <= 0 ? '!' : `${it.days}j`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ AJOUTER — top-right small ═══ */}
        <button onClick={() => setShowAddForm(true)} style={{ ...S.cell, ...S.actionCell }}>
          <Plus size={24} color="#16a34a" />
          <span style={S.actionLabel}>Ajouter</span>
        </button>

        {/* ═══ SCANNER — bottom-right small ═══ */}
        <button onClick={() => setShowOcr(true)} style={{ ...S.cell, ...S.actionCell }}>
          <Camera size={24} color="#3b82f6" />
          <span style={S.actionLabel}>Scanner</span>
        </button>

        {/* ═══ POIDS — small left ═══ */}
        <Link href="/nutrition" style={{ ...S.cell, ...S.weightCell, textDecoration: 'none', color: 'inherit' }}>
          <Scale size={20} color="#6b7280" />
          {latestWeight ? (
            <>
              <span style={S.weightValue}>{latestWeight.weight_kg}</span>
              <span style={S.weightUnit}>kg</span>
              {pg.target_weight_kg && (
                <span style={S.weightTarget}>→ {pg.target_weight_kg}</span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Pas de mesure</span>
          )}
        </Link>

        {/* ═══ MACROS — large right ═══ */}
        <div style={{ ...S.cell, gridColumn: '2 / -1' }}>
          <div style={S.cellHeader}>
            <span style={S.cellLabel}><BarChart3 size={14} /> Nutrition</span>
            <PersonSelector selected={person} onChange={setPerson} />
          </div>

          {pg.target_calories ? (
            <div style={{ marginTop: 4 }}>
              <NutritionBar label="kcal" value={pn.kcal} target={pg.target_calories} color="#16a34a" />
              <NutritionBar label="Prot" value={pn.protein_g} target={pg.target_protein_g} unit="g" color="#3b82f6" />
              <NutritionBar label="Gluc" value={pn.carbs_g} target={pg.target_carbs_g} unit="g" color="#f59e0b" />
              <NutritionBar label="Lip" value={pn.fat_g} target={pg.target_fat_g} unit="g" color="#ef4444" />
            </div>
          ) : (
            <Link href="/nutrition/onboarding" style={{ ...S.emptyBtn, marginTop: 12 }}>
              <Settings size={14} /> Configurer
            </Link>
          )}
        </div>

        {/* ═══ QUICK NAV — 4 cols at bottom ═══ */}
        <Link href="/planning/assistant" style={{ ...S.cell, ...S.navCell }}>
          <Sparkles size={18} color="#16a34a" />
          <span>Myko</span>
        </Link>
        <Link href="/pantry" style={{ ...S.cell, ...S.navCell }}>
          <Package size={18} color="#6b9d6b" />
          <span>Stock</span>
        </Link>
        <Link href="/planning" style={{ ...S.cell, ...S.navCell }}>
          <CalendarDays size={18} color="#3b82f6" />
          <span>Planning</span>
        </Link>
        <Link href="/nutrition" style={{ ...S.cell, ...S.navCell }}>
          <BarChart3 size={18} color="#f59e0b" />
          <span>Nutrition</span>
        </Link>
      </div>

      {/* Modals */}
      {showAddForm && <SmartAddForm open onClose={() => { setShowAddForm(false); loadStock() }} onLotCreated={() => { setShowAddForm(false); loadStock() }} />}
      {showOcr && <OcrReviewList onClose={() => setShowOcr(false)} onItemsAdded={() => { setShowOcr(false); loadStock() }} />}
    </div>
  )
}

/* ───── Styles ───── */

const glass = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(12px) saturate(120%)',
  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
  border: '1px solid rgba(255,255,255,0.35)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
}

const S = {
  page: {
    padding: '12px',
    maxWidth: 640,
    margin: '0 auto',
    paddingBottom: 40,
  },
  bento: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
  },

  // Base cell
  cell: {
    ...glass,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },

  // Hero
  hero: {
    background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(5,150,105,0.04))',
    padding: '28px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    minHeight: 120,
  },
  heroGreeting: {
    fontSize: 13,
    color: '#6b9d6b',
    fontWeight: 500,
    margin: '0 0 4px',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: "'Crimson Text', Georgia, serif",
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    margin: 0,
    lineHeight: 1.2,
  },
  heroCta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  // Cell header
  cellHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  cellLink: {
    fontSize: 11,
    color: '#16a34a',
    textDecoration: 'none',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },

  // Stock big number
  bigNumber: {
    fontSize: 40,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    lineHeight: 1,
    marginTop: 4,
  },
  bigLabel: {
    fontSize: 12,
    color: '#9ca3af',
    margin: '2px 0 8px',
  },
  alertPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 8px',
    background: 'rgba(245,158,11,0.08)',
    borderRadius: 8,
    marginBottom: 8,
  },
  urgentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    marginTop: 8,
    borderTop: '1px solid rgba(0,0,0,0.04)',
    paddingTop: 8,
  },
  urgentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11,
  },
  urgentName: {
    color: '#374151',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '70%',
  },
  urgentBadge: {
    fontWeight: 700,
    fontSize: 10,
  },

  // Action cells (Ajouter / Scanner)
  actionCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'transform 0.15s, box-shadow 0.15s',
    gridColumn: 'span 1',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
  },

  // Weight cell
  weightCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    gridColumn: 'span 1',
  },
  weightValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    lineHeight: 1,
  },
  weightUnit: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: 500,
  },
  weightTarget: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: 600,
    marginTop: 2,
  },

  // Nav cells
  navCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '14px 8px',
    textDecoration: 'none',
    color: 'var(--ink, #1f281f)',
    fontSize: 11,
    fontWeight: 600,
    gridColumn: 'span 1',
    transition: 'transform 0.15s',
  },

  // Empty state
  emptyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    background: 'rgba(22,163,74,0.08)',
    color: '#16a34a',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
