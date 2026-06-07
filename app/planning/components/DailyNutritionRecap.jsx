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

  if (loading) return (
    <div aria-busy="true" aria-label="Chargement de la nutrition">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="v21-skel" style={{ height: 52, marginBottom: 1, borderRadius: 0 }} />
      ))}
    </div>
  )
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
          gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }
        .nutri-day-label {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 64px;
          flex-shrink: 0;
        }
        .nutri-persons-wrap {
          display: flex;
          gap: 22px;
          flex: 1;
          min-width: 0;
        }
        .nutri-person-block {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .nutri-macro-bar {
          width: 48px;
          height: 4px;
          background: var(--line);
          overflow: hidden;
          flex-shrink: 0;
        }
        .nutri-micro-row {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .nutri-day-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            padding: 12px 0;
          }
          .nutri-day-label {
            flex-direction: row;
            align-items: baseline;
            gap: 8px;
            min-width: 0;
          }
          .nutri-persons-wrap {
            flex-direction: column;
            gap: 8px;
          }
          .nutri-macro-bar {
            width: 40px;
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
  },
  dayName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--ink-3)',
  },
  dayDate: {
    fontFamily: 'var(--font-display)',
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--ink-1)',
    marginTop: 2,
  },
  personTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ink-2)',
    border: '1px solid var(--line-strong)',
    borderRadius: 3,
    padding: '2px 7px',
    flexShrink: 0,
  },
  macros: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 3,
    flexShrink: 0,
  },
  macroMain: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  macroUnit: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--ink-3)',
  },
  microValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--ink-2)',
    fontVariantNumeric: 'tabular-nums',
  },
  legend: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'var(--font-mono)',
    fontSize: 10.5,
    color: 'var(--ink-3)',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    display: 'inline-block',
  },
}
