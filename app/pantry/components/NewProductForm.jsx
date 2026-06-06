'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Formulaire de création d'un produit absent du catalogue.
 * Crée une vraie entrée canonical_foods (réutilisable) avec catégorie, unité
 * et durées de conservation par lieu. À la création, on enchaîne sur le lot.
 *
 * @param {string} initialName  nom pré-rempli (la recherche)
 * @param {function} onCancel
 * @param {function} onCreated  reçoit le produit { id, name, type:'canonical', ... }
 */
const UNITS = ['g', 'ml', 'cl', 'L', 'kg', 'pièce', 'unités']

export default function NewProductForm({ initialName = '', onCancel, onCreated }) {
  const [name, setName] = useState(initialName)
  const [categoryId, setCategoryId] = useState('')
  const [unit, setUnit] = useState('g')
  const [pantry, setPantry] = useState('')
  const [fridge, setFridge] = useState('7')
  const [freezer, setFreezer] = useState('90')
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('reference_categories').select('id, name').order('name')
      .then(({ data }) => setCategories(data || []))
  }, [])

  async function create() {
    if (!name.trim()) { setError('Le nom est requis'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        canonical_name: name.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        primary_unit: unit,
        shelf_life_days_pantry: pantry !== '' ? Number(pantry) : null,
        shelf_life_days_fridge: fridge !== '' ? Number(fridge) : null,
        shelf_life_days_freezer: freezer !== '' ? Number(freezer) : null,
      }
      const { data, error: insErr } = await supabase
        .from('canonical_foods')
        .insert(payload)
        .select('id')
        .single()
      if (insErr || !data) throw new Error(insErr?.message || 'Création échouée')
      onCreated({
        id: data.id,
        name: payload.canonical_name,
        type: 'canonical',
        category_id: payload.category_id,
        primary_unit: unit,
        shelf_life_days_pantry: payload.shelf_life_days_pantry,
        shelf_life_days_fridge: payload.shelf_life_days_fridge,
        shelf_life_days_freezer: payload.shelf_life_days_freezer,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={S.wrap}>
      <p style={S.intro}>Nouveau produit — il sera ajouté au catalogue et réutilisable.</p>

      <label style={S.label}>Nom du produit *</label>
      <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Pâté en croûte" autoFocus />

      <div style={S.row2}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Catégorie</label>
          <select style={S.input} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">— Aucune —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ width: 110 }}>
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
  intro: { fontSize: 13, color: '#6b7280', margin: '0 0 16px' },
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
