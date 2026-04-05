'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const TARGETS = {
  Julien: { kcal: 2050, p: 170, g: 170, l: 70 },
  Zoé: { kcal: 1350, p: 90, g: 120, l: 55 },
}

function pct(value, target) {
  if (!target || !value) return 0
  return Math.round((value / target) * 100)
}

function statusColor(percent) {
  if (percent >= 90 && percent <= 110) return '#16a34a' // on target
  if (percent >= 75 && percent <= 125) return '#f59e0b' // close
  return '#ef4444' // off
}

export default function DailyNutritionRecap({ importId }) {
  const [totals, setTotals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!importId) { setLoading(false); return }
    loadTotals()
  }, [importId])

  async function loadTotals() {
    try {
      const res = await authFetch(`/api/planning/imports/${importId}`)
      const data = await res.json()
      if (data.dailyTotals) setTotals(data.dailyTotals)
    } catch (err) {
      console.error('Erreur chargement totals:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>...</p>
  if (!totals.length) return null

  // Group by date
  const byDate = {}
  for (const t of totals) {
    if (!byDate[t.meal_date]) byDate[t.meal_date] = {}
    byDate[t.meal_date][t.person_name] = t
  }

  const dates = Object.keys(byDate).sort()

  return (
    <div style={S.container}>
      {dates.map(date => {
        const d = new Date(date + 'T12:00:00')
        const dayName = DAY_NAMES[d.getDay()]
        const dayNum = d.getDate()
        const month = d.toLocaleDateString('fr-FR', { month: 'short' })
        const persons = byDate[date]

        return (
          <div key={date} className="nutri-day-row">
            <div className="nutri-day-label">
              <span style={S.dayName}>{dayName}</span>
              <span style={S.dayDate}>{dayNum} {month}</span>
            </div>
            <div className="nutri-persons-wrap">
              {['Julien', 'Zoé'].map(name => {
                const p = persons[name]
                if (!p) return null
                const target = TARGETS[name] || {}
                const kcalPct = pct(p.kcal, target.kcal)
                const protPct = pct(p.protein_g, target.p)
                const carbsPct = pct(p.carbs_g, target.g)
                const fatPct = pct(p.fat_g, target.l)

                return (
                  <div key={name} className="nutri-person-block">
                    <span style={S.personTag}>{name.charAt(0)}</span>
                    <div style={S.macros}>
                      <span style={{ ...S.macroMain, color: statusColor(kcalPct) }}>
                        {Math.round(p.kcal || 0)}
                      </span>
                      <span style={S.macroUnit}>kcal</span>
                    </div>
                    <div className="nutri-macro-bar">
                      <div style={{ height: '100%', borderRadius: 2, transition: 'width 0.3s', width: `${Math.min(kcalPct, 100)}%`, background: statusColor(kcalPct) }} />
                    </div>
                    <div className="nutri-micro-row">
                      <span style={{ ...S.microValue, color: statusColor(protPct) }}>{Math.round(p.protein_g || 0)}P</span>
                      <span style={{ ...S.microValue, color: statusColor(carbsPct) }}>{Math.round(p.carbs_g || 0)}G</span>
                      <span style={{ ...S.microValue, color: statusColor(fatPct) }}>{Math.round(p.fat_g || 0)}L</span>
                      {p.fiber_g > 0 && <span style={S.microValue}>{Math.round(p.fiber_g)}F</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div style={S.legend}>
        <span style={S.legendItem}><span style={{ ...S.legendDot, background: '#16a34a' }} /> Dans la cible</span>
        <span style={S.legendItem}><span style={{ ...S.legendDot, background: '#f59e0b' }} /> Proche (±15%)</span>
        <span style={S.legendItem}><span style={{ ...S.legendDot, background: '#ef4444' }} /> Hors cible</span>
      </div>

      <style jsx>{`
        .nutri-day-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 14px;
        }
        .nutri-day-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 52px;
          flex-shrink: 0;
        }
        .nutri-persons-wrap {
          display: flex;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .nutri-person-block {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .nutri-macro-bar {
          width: 40px;
          height: 3px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 2px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .nutri-micro-row {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .nutri-day-row {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
            padding: 10px 12px;
          }
          .nutri-day-label {
            flex-direction: row;
            gap: 8px;
            min-width: 0;
          }
          .nutri-persons-wrap {
            flex-direction: column;
            gap: 6px;
          }
          .nutri-person-block {
            gap: 6px;
          }
          .nutri-macro-bar {
            width: 32px;
          }
        }

        @media (max-width: 480px) {
          .nutri-day-row {
            padding: 8px 10px;
            border-radius: 12px;
          }
          .nutri-micro-row {
            gap: 4px;
          }
        }
      `}</style>
    </div>
  )
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  dayName: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9ca3af',
    fontFamily: "'Inter', sans-serif",
  },
  dayDate: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--forest-800, #2d5a2d)',
    fontFamily: "'Crimson Text', Georgia, serif",
  },
  personTag: {
    fontSize: 10,
    fontWeight: 700,
    color: '#4a7c4a',
    background: 'rgba(74, 124, 74, 0.08)',
    borderRadius: 6,
    padding: '2px 6px',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
  },
  macros: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
    flexShrink: 0,
  },
  macroMain: {
    fontSize: 16,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  macroUnit: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: 600,
  },
  microValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6b7280',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: "'Inter', sans-serif",
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: "'Inter', sans-serif",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },
}
