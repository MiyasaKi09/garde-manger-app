'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Formulaire de création d'un produit absent du catalogue.
 * Deux types possibles :
 *   - Produit de base  → entrée canonical_foods (catégorie, unité, durées).
 *   - Variante         → entrée archetypes rattachée à un produit de base
 *                        existant (hérite sa nutrition ; durées propres).
 * À la création, on enchaîne sur le lot (stockage + DLC auto).
 *
 * @param {string} initialName
 * @param {function} onCancel
 * @param {function} onCreated  reçoit { id, name, type:'canonical'|'archetype', ... }
 */
const UNITS = ['g', 'ml', 'cl', 'L', 'kg', 'pièce', 'unités']

export default function NewProductForm({ initialName = '', onCancel, onCreated }) {
  const [kind, setKind] = useState('canonical') // 'canonical' | 'archetype'
  const [name, setName] = useState(initialName)
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('g')
  const [pantry, setPantry] = useState('')
  const [fridge, setFridge] = useState('7')
  const [freezer, setFreezer] = useState('90')

  const [categories, setCategories] = useState([])
  const [canonicals, setCanonicals] = useState([])
  const [parentSearch, setParentSearch] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('reference_categories').select('id, name').order('name')
      .then(({ data }) => setCategories(data || []))
    supabase.from('canonical_foods').select('id, canonical_name').order('canonical_name')
      .then(({ data }) => setCanonicals(data || []))
  }, [])

  function resolveParent() {
    const q = parentSearch.trim().toLowerCase()
    return canonicals.find(c => (c.canonical_name || '').toLowerCase() === q)
      || canonicals.find(c => (c.canonical_name || '').toLowerCase().includes(q) && q.length >= 2)
      || null
  }

  async function create() {
    if (!name.trim()) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      const shelf = {
        shelf_life_days_pantry: pantry !== '' ? Number(pantry) : null,
        shelf_life_days_fridge: fridge !== '' ? Number(fridge) : null,
        shelf_life_days_freezer: freezer !== '' ? Number(freezer) : null,
      }

      if (kind === 'archetype') {
        const parent = resolveParent()
        if (!parent) { setError('Choisis un produit de base existant à rattacher'); setSaving(false); return }
        const { data, error: insErr } = await supabase
          .from('archetypes')
          .insert({ name: name.trim(), canonical_food_id: parent.id, primary_unit: unit, ...shelf })
          .select('id')
          .single()
        if (insErr || !data) throw new Error(insErr?.message || 'Création échouée')
        onCreated({ id: data.id, name: name.trim(), type: 'archetype', primary_unit: unit, ...shelf })
        return
      }

      const { data, error: insErr } = await supabase
        .from('canonical_foods')
        .insert({
          canonical_name: name.trim(),
          category_id: categoryId ? Number(categoryId) : null,
          primary_unit: unit,
          ...shelf,
        })
        .select('id')
        .single()
      if (insErr || !data) throw new Error(insErr?.message || 'Création échouée')
      onCreated({ id: data.id, name: name.trim(), type: 'canonical', category_id: categoryId ? Number(categoryId) : null, primary_unit: unit, ...shelf })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.wrap}>
      {/* Type */}
      <div style={S.kindRow}>
        <button onClick={() => setKind('canonical')} style={{ ...S.kindBtn, ...(kind === 'canonical' ? S.kindActive : {}) }}>
          Produit de base
        </button>
        <button onClick={() => setKind('archetype')} style={{ ...S.kindBtn, ...(kind === 'archetype' ? S.kindActive : {}) }}>
          Variante d'un produit
        </button>
      </div>
      <p style={S.intro}>
        {kind === 'canonical'
          ? 'Nouvel aliment de base, ajouté au catalogue et réutilisable.'
          : 'Variante rattachée à un produit de base existant (hérite sa nutrition).'}
      </p>

      <label style={S.label}>Nom du produit *</label>
      <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Pâté en croûte" autoFocus />

      {kind === 'archetype' && (
        <>
          <label style={S.label}>Rattacher à (produit de base) *</label>
          <input style={S.input} list="npf-canon-list" value={parentSearch}
            onChange={e => setParentSearch(e.target.value)} placeholder="Ex : pâté, fromage, bœuf…" />
          <datalist id="npf-canon-list">
            {canonicals.map(c => <option key={c.id} value={c.canonical_name} />)}
          </datalist>
        </>
      )}

      <div style={S.row2}>
        {kind === 'canonical' && (
          <div style={{ flex: 1 }}>
            <label style={S.label}>Catégorie</label>
            <select style={S.input} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">— Aucune —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ width: kind === 'canonical' ? 110 : '100%' }}>
          <label style={S.label}>Unité</label>
          <select style={S.input} value={unit} onChange={e => setUnit(e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <label style={S.label}>Conservation (jours)</label>
      <div style={S.shelfRow}>
        <div style={S.shelfCell}>
          <span style={S.shelfTag}>🗄️ Placard</span>
          <input style={S.numInput} type="number" min="0" value={pantry} onChange={e => setPantry(e.target.value)} placeholder="—" />
        </div>
        <div style={S.shelfCell}>
          <span style={S.shelfTag}>🧊 Frigo</span>
          <input style={S.numInput} type="number" min="0" value={fridge} onChange={e => setFridge(e.target.value)} placeholder="—" />
        </div>
        <div style={S.shelfCell}>
          <span style={S.shelfTag}>❄️ Congélo</span>
          <input style={S.numInput} type="number" min="0" value={freezer} onChange={e => setFreezer(e.target.value)} placeholder="—" />
        </div>
      </div>
      <p style={S.tip}>Laisse vide un lieu si le produit ne s'y conserve pas. La date sera calculée selon le lieu choisi à l'étape suivante.</p>

      {error && <p style={S.err}>{error}</p>}

      <div style={S.actions}>
        <button onClick={onCancel} style={S.cancel} disabled={saving}>Retour</button>
        <button onClick={create} style={{ ...S.create, opacity: saving ? 0.6 : 1 }} disabled={saving}>
          {saving ? 'Création…' : 'Créer et continuer'}
        </button>
      </div>
    </div>
  )
}

const S = {
  wrap: { padding: '4px 2px 8px' },
  kindRow: { display: 'flex', gap: 8, marginBottom: 10 },
  kindBtn: { flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #d8dcc8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' },
  kindActive: { background: '#e7eee4', borderColor: '#2f5d3a', color: '#2f5d3a' },
  intro: { fontSize: 13, color: '#6b7280', margin: '0 0 14px' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5563', margin: '12px 0 6px' },
  input: { width: '100%', padding: '11px 12px', border: '1px solid #d8dcc8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' },
  row2: { display: 'flex', gap: 10 },
  shelfRow: { display: 'flex', gap: 8 },
  shelfCell: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  shelfTag: { fontSize: 11, fontWeight: 600, color: '#6b7280' },
  numInput: { width: '100%', padding: '9px 10px', border: '1px solid #d8dcc8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', textAlign: 'center' },
  tip: { fontSize: 11.5, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 },
  err: { color: '#dc2626', fontSize: 13, margin: '12px 0 0' },
  actions: { display: 'flex', gap: 10, marginTop: 20 },
  cancel: { padding: '12px 18px', border: '1px solid #d8dcc8', background: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#4b5563', cursor: 'pointer', fontFamily: 'inherit' },
  create: { flex: 1, padding: '12px 0', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #2d5a2d, #4a7c4a)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
