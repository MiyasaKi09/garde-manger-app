'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/authFetch'
import { X, Check, ChefHat, Loader2, Flame } from 'lucide-react'

const MEAL_LABELS = { pdj: 'Petit-déj', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collation' }

/**
 * Feuille de confirmation « marquer cuisiné » — partagée accueil + planning.
 * Affiche la nutrition du repas + la liste ajustable des ingrédients à déduire
 * du stock (lots auto-choisis FEFO). Confirmer = POST /api/meals/cook
 * (déduit le stock + logue la nutrition du jour).
 *
 * @param {object} meal { type, dishName, entries:[{person_name, meal_date, kcal, protein_g, carbs_g, fat_g, fiber_g, description}] }
 */
export default function MealCookSheet({ open, onClose, meal, onDone }) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const mealDate = meal?.entries?.[0]?.meal_date
  const dishName = meal?.dishName

  // Repas « batch » (préparé d'avance) → on réchauffe : pas de déduction de stock,
  // le stock a déjà été retiré au moment de cuisiner le lot. Sinon, flux normal FEFO.
  const isBatch = (meal?.entries || []).some(e => e.batch_recipe_id)

  useEffect(() => {
    if (!open || !meal) return
    if (isBatch) { setRows([]); setError(null); setLoading(false) }
    else loadIngredients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meal?.dishName])

  async function loadIngredients() {
    setLoading(true); setError(null); setRows([])
    try {
      const julien = meal.entries.find(e => e.person_name === 'Julien') || meal.entries[0]
      const q = julien?.description || dishName
      if (!q) { setLoading(false); return }
      const recRes = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(q)}`)
      if (!recRes.ok) { setLoading(false); return }
      const recData = await recRes.json().catch(() => ({}))
      const recipeId = recData.recipe?.id
      if (!recipeId) { setLoading(false); return }
      const ingRes = await authFetch(`/api/recipes/generated/${recipeId}/available-ingredients`)
      const ingData = await ingRes.json().catch(() => ({}))
      const built = (ingData.ingredients || []).map(ing => {
        const lot = ing.available_lots?.[0] || null
        const avail = lot?.quantity_available ?? 0
        const take = lot ? Math.min(ing.quantity || 0, avail) : 0
        return {
          name: ing.name,
          unit: ing.unit || lot?.unit || 'g',
          qty: Math.round(take),
          lot_id: lot?.id || null,
          include: !!lot && take > 0,
        }
      })
      setRows(built)
    } catch {
      setError('Erreur de chargement des ingrédients')
    } finally {
      setLoading(false)
    }
  }

  function updateRow(i, patch) {
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  async function confirm() {
    setSaving(true); setError(null)
    try {
      const deductions = rows
        .filter(r => r.include && r.lot_id && r.qty > 0)
        .map(r => ({ lot_id: r.lot_id, quantity_used: r.qty, unit: r.unit, product_name: r.name }))
      const entries = (meal.entries || []).map(e => ({
        person_name: e.person_name, kcal: e.kcal, protein_g: e.protein_g,
        carbs_g: e.carbs_g, fat_g: e.fat_g, fiber_g: e.fiber_g,
      }))
      const batchRecipeId = (meal.entries || []).find(e => e.batch_recipe_id)?.batch_recipe_id || null
      const res = await authFetch('/api/meals/cook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_date: mealDate, meal_type: meal.type, dish_name: dishName, entries, deductions, batch_recipe_id: batchRecipeId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onDone?.()
      onClose?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !meal || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div style={S.overlay} onClick={onClose} />
      <div style={S.sheet}>
        <div style={S.grab} />
        <div style={S.header}>
          <div>
            <span style={S.badge}>{MEAL_LABELS[meal.type] || meal.type}</span>
            <h3 style={S.title}>{dishName}</h3>
          </div>
          <button onClick={onClose} style={S.close}><X size={18} /></button>
        </div>

        <div style={S.nutri}>
          {(meal.entries || []).filter(e => e.kcal).map((e, i) => (
            <span key={i} style={S.nutriItem}>
              {e.person_name?.charAt(0)}: {Math.round(e.kcal)} kcal · {Math.round(e.protein_g || 0)}g P
            </span>
          ))}
        </div>

        <p style={S.sectionLabel}>{isBatch ? "Préparé d'avance" : 'À déduire du stock'}</p>
        {isBatch ? (
          <p style={S.reheat}>
            <Flame size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Ce déjeuner a été cuisiné lors du batch — réchauffe ta barquette. Rien à déduire du stock (déjà retiré le jour de cuisine) ; seule la nutrition du jour sera enregistrée.</span>
          </p>
        ) : loading ? (
          <p style={S.hint}><Loader2 size={14} style={{ animation: 'mcs-spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }} />Chargement…</p>
        ) : rows.length === 0 ? (
          <p style={S.hint}>Aucun ingrédient lié au stock — seule la nutrition sera enregistrée.</p>
        ) : (
          <div style={S.list}>
            {rows.map((r, i) => (
              <div key={i} style={{ ...S.row, opacity: r.lot_id ? 1 : 0.5 }}>
                <button
                  onClick={() => r.lot_id && updateRow(i, { include: !r.include })}
                  style={{ ...S.check, background: r.include ? '#16a34a' : 'transparent', borderColor: r.include ? '#16a34a' : '#cbd5c0', cursor: r.lot_id ? 'pointer' : 'default' }}
                >
                  {r.include && <Check size={12} color="#fff" />}
                </button>
                <span style={S.rowName}>{r.name}</span>
                {r.lot_id ? (
                  <>
                    <input
                      type="number" min="0" value={r.qty}
                      onChange={e => updateRow(i, { qty: Math.max(0, Number(e.target.value)) })}
                      style={S.qtyInput}
                    />
                    <span style={S.unit}>{r.unit}</span>
                  </>
                ) : (
                  <span style={S.outStock}>pas en stock</span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p style={S.err}>{error}</p>}

        <button onClick={confirm} disabled={saving || loading} style={{ ...S.confirm, opacity: (saving || loading) ? 0.6 : 1 }}>
          {saving ? 'Enregistrement…' : isBatch ? <><Flame size={18} /> Confirmer — réchauffé</> : <><ChefHat size={18} /> Confirmer — cuisiné</>}
        </button>
        <style>{`@keyframes mcs-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </>,
    document.body
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 2000 },
  sheet: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '28px 28px 0 0', padding: '0 22px 32px', zIndex: 2001, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', maxWidth: 520, margin: '0 auto' },
  grab: { width: 40, height: 4, background: '#d1d5db', borderRadius: 4, margin: '12px auto 14px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  badge: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.4, background: '#ede9fe', color: '#5b21b6', fontFamily: "var(--font-text)" },
  title: { fontFamily: "var(--font-editorial)", fontSize: 23, fontWeight: 700, color: '#2d5a2d', margin: '8px 0 0', lineHeight: 1.2 },
  close: { border: 'none', background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 10, cursor: 'pointer', color: '#6b7280', display: 'flex', flexShrink: 0 },
  nutri: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
  nutriItem: { fontSize: 13, fontWeight: 600, color: '#4a7c4a', background: 'rgba(74,124,74,0.08)', borderRadius: 8, padding: '5px 10px' },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#8A8C7E', textTransform: 'uppercase', borderLeft: '2px solid #2F5D3A', paddingLeft: 8, margin: '0 0 10px' },
  hint: { color: '#9ca3af', fontSize: 13, margin: '0 0 16px' },
  reheat: { display: 'flex', gap: 9, alignItems: 'flex-start', color: '#b45309', fontSize: 13, lineHeight: 1.5, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.18)', borderRadius: 12, padding: '11px 13px', margin: '0 0 16px' },
  list: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, background: 'rgba(255,255,255,0.6)' },
  check: { width: 22, height: 22, borderRadius: 6, border: '1.5px solid #cbd5c0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 },
  rowName: { flex: 1, fontSize: 14, fontWeight: 500, color: '#1f281f' },
  qtyInput: { width: 64, padding: '6px 8px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 14, textAlign: 'right', fontFamily: 'inherit', outline: 'none' },
  unit: { fontSize: 13, color: '#6b7280', minWidth: 26 },
  outStock: { fontSize: 12, color: '#d97706', fontWeight: 600 },
  err: { color: '#dc2626', fontSize: 13, margin: '0 0 12px', textAlign: 'center' },
  confirm: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 0', background: 'linear-gradient(135deg, #2d5a2d, #4a7c4a)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "var(--font-text)", boxShadow: '0 4px 16px rgba(45,90,45,0.25)' },
}
