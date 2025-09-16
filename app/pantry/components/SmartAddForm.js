// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * OBJECTIF
 *  - Ne plus "tricher" avec des données codées en dur.
 *  - Rechercher dans Supabase (table: canonical_foods) uniquement.
 *  - Calculer l'unité et la DLC à partir des colonnes de la base.
 *  - Insérer le lot directement dans Supabase (table: inventory_lots).
 *  - Option: si l'utilisateur sélectionne un "nouveau produit", créer d'abord un canonical_food minimal.
 */

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confidence, setConfidence] = useState({ percent: 0, label: 'Faible', tone: 'warning' });
  const [loading, setLoading] = useState(false);

  const [lotData, setLotData] = useState({
    qty: '',
    unit: 'g',
    storage_method: 'pantry',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const supabase = createClientComponentClient();

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
      setSelectedProduct(null);
      setConfidence({ percent: 0, label: 'Faible', tone: 'warning' });
      setLotData({ qty: '', unit: 'g', storage_method: 'pantry', storage_place: '', expiration_date: '', notes: '' });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Focus on qty at step 2
  useEffect(() => {
    if (step === 2) setTimeout(() => qtyInputRef.current?.focus(), 100);
  }, [step]);

  // --- Helpers pure DB (pas de heuristiques codées en dur) ---
  const calcConfidence = useCallback((query, name) => {
    if (!query || !name) return { percent: 0, label: 'Faible', tone: 'warning' };
    const q = query.trim().toLowerCase();
    const n = name.trim().toLowerCase();
    let score = 0;
    if (n === q) score = 1.0;
    else if (n.startsWith(q)) score = 0.85;
    else if (n.includes(q)) score = 0.6;
    else score = 0.3;
    const percent = Math.round(score * 100);
    const label = percent >= 80 ? 'Élevée' : percent >= 50 ? 'Moyenne' : 'Faible';
    const tone = percent >= 80 ? 'good' : percent >= 50 ? 'neutral' : 'warning';
    return { percent, label, tone };
  }, []);

  const estimateExpiry = useCallback((product, method) => {
    if (!product) return '';
    const map = {
      fridge: product.shelf_life_days_fridge,
      pantry: product.shelf_life_days_pantry,
      freezer: product.shelf_life_days_freezer,
      counter: product.shelf_life_days_pantry ?? product.shelf_life_days_fridge
    };
    const days = map[method] ?? map.pantry ?? 7;
    if (!days || Number.isNaN(days)) return '';
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().slice(0, 10);
  }, []);

  const defaultQtyForUnit = useCallback((unit) => {
    if (!unit) return '';
    const u = unit.toLowerCase();
    if (u === 'u' || u === 'pièce') return 1;
    if (u === 'kg' || u === 'l') return 1;
    if (u === 'g' || u === 'ml') return 250;
    return '';
  }, []);

  // --- SEARCH: uniquement Supabase ---
  const searchProducts = useCallback(
    async (query) => {
      const q = query.trim();
      if (!q) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      const escaped = q.replace(/[,{}"]/g, '');
      setSearchLoading(true);
      setSearchError(null);
      try {
        // Recherche principale: canonical_name ILIKE + keywords array contains
        const { data, error } = await supabase
          .from('canonical_foods')
          .select(`
            id,
            canonical_name,
            category_id,
            subcategory,
            primary_unit,
            shelf_life_days_pantry,
            shelf_life_days_fridge,
            shelf_life_days_freezer
          `)
          .or(`canonical_name.ilike.%${escaped}%,keywords.cs.{"${escaped}"}`)
          .limit(12);

        if (error) throw error;

        const normalized = (data || []).map((row) => ({
          id: row.id,
          type: 'canonical',
          name: row.canonical_name,
          display_name: row.canonical_name,
          subcategory: row.subcategory,
          category: { name: row.subcategory || 'Aliment', icon: '🥬' },
          primary_unit: row.primary_unit || 'g',
          shelf_life_days_fridge: row.shelf_life_days_fridge,
          shelf_life_days_pantry: row.shelf_life_days_pantry,
          shelf_life_days_freezer: row.shelf_life_days_freezer,
          icon: '🥬'
        }));

        // Tri simple par pertinence sur le nom
        normalized.sort((a, b) => {
          const sa = a.name.toLowerCase();
          const sb = b.name.toLowerCase();
          const ql = q.toLowerCase();
          const ra = sa === ql ? 0 : sa.startsWith(ql) ? 1 : sa.includes(ql) ? 2 : 3;
          const rb = sb === ql ? 0 : sb.startsWith(ql) ? 1 : sb.includes(ql) ? 2 : 3;
          return ra - rb;
        });

        // Toujours offrir la création d'un nouveau produit (basée sur la saisie)
        const limitedResults = normalized.slice(0, 11);
        const results = [
          ...limitedResults,
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: q,
            category: { name: 'À définir', icon: '📦' },
            primary_unit: 'g',
            icon: '➕'
          }
        ];

        setSearchResults(results);
      } catch (e) {
        console.error('search error', e);
        setSearchError(e?.message || 'Erreur de recherche');
        setSearchResults([
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: `${q}`,
            category: { name: 'À définir', icon: '📦' },
            primary_unit: 'g',
            icon: '➕'
          }
        ]);
      } finally {
        setSearchLoading(false);
      }
    },
    [supabase]
  );

  // Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // Sélection
  const handleSelectProduct = useCallback(
    (product) => {
      setSelectedProduct(product);
      const conf = calcConfidence(searchQuery, product.name || product.display_name);
      setConfidence(conf);

      const unit = product.primary_unit || 'g';
      const expiry = product.type === 'canonical' ? estimateExpiry(product, 'pantry') : '';
      const qty = defaultQtyForUnit(unit);

      setLotData((prev) => ({ ...prev, unit, qty: prev.qty || qty, expiration_date: expiry }));
      setStep(2);
    },
    [searchQuery, calcConfidence, estimateExpiry, defaultQtyForUnit]
  );

  const handleStorageMethodChange = useCallback(
    (method) => {
      setLotData((prev) => ({
        ...prev,
        storage_method: method,
        expiration_date:
          selectedProduct?.type === 'canonical' ? estimateExpiry(selectedProduct, method) : prev.expiration_date
      }));
    },
    [selectedProduct, estimateExpiry]
  );

  // Création du produit canonique minimal si nécessaire
  const ensureCanonicalExists = useCallback(
    async (name) => {
      const clean = name.trim();
      if (!clean) throw new Error('Nom de produit vide');

      // 1) tenter de le retrouver strictement
      const { data: existing, error: exErr } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, primary_unit')
        .ilike('canonical_name', clean)
        .limit(1)
        .maybeSingle();
      if (exErr) throw exErr;
      if (existing) return existing;

      // 2) le créer minimalement
      const { data: inserted, error: insErr } = await supabase
        .from('canonical_foods')
        .insert({
          canonical_name: clean,
          primary_unit: 'g' // valeur par défaut raisonnable si inconnu
        })
        .select('id, canonical_name, primary_unit')
        .single();
      if (insErr) throw insErr;
      return inserted;
    },
    [supabase]
  );

  // Création du lot -> insertion directe Supabase
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) return;
    setLoading(true);
    try {
      // Auth (utile si RLS utilise user_id)
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || null;

      let canonical = null;
      if (selectedProduct.type === 'canonical') {
        canonical = { id: selectedProduct.id, primary_unit: selectedProduct.primary_unit };
      } else if (selectedProduct.type === 'new') {
        canonical = await ensureCanonicalExists(selectedProduct.name);
      }

      const payload = {
        canonical_food_id: canonical?.id ?? null,
        display_name: selectedProduct.display_name || selectedProduct.name,
        qty_remaining: Number(lotData.qty),
        unit: lotData.unit,
        effective_expiration: lotData.expiration_date || null,
        location_name: lotData.storage_place || null,
        notes: lotData.notes || null,
        storage_method: lotData.storage_method,
        created_by: userId // optionnel selon votre schéma
      };

      const { data: lot, error: lotErr } = await supabase
        .from('inventory_lots')
        .insert(payload)
        .select('id')
        .single();
      if (lotErr) throw lotErr;

      // callback parent si fourni
      if (onLotCreated) onLotCreated(lot?.id ?? null);

      // reset & close
      setLoading(false);
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      onClose?.();
    } catch (e) {
      console.error('create lot error', e);
      setLoading(false);
      alert(e?.message || 'Erreur lors de la création du lot');
    }
  }, [selectedProduct, lotData, supabase, ensureCanonicalExists, onLotCreated, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            <span>Ajouter un produit</span>
          </div>
          <button onClick={() => onClose?.()} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Étape 1: Recherche */}
          {step === 1 && (
            <div className="search-step">
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un produit (ex: tomate, yaourt, riz...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchLoading && <div className="loading">🔄</div>}
              </div>

              {searchQuery && (
                <div className="debug-info">
                  <small>
                    🔍 Recherche: "{searchQuery}" • {searchResults.length} résultats
                  </small>
                </div>
              )}

              {searchError && (
                <div className="search-error">
                  ⚠️ Une erreur est survenue lors de la recherche : {searchError}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="results-list">
                  {searchResults.map((product) => (
                    <div
                      key={`${product.type}-${product.id}`}
                      className={`result-item ${product.type === 'new' ? 'new-item' : ''}`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="result-icon">{product.icon}</div>
                      <div className="result-content">
                        <div className="result-name">
                          {product.display_name}
                          {product.type === 'new' && <span className="new-badge">Nouveau</span>}
                        </div>
                        <div className="result-meta">
                          {product.category?.name && <span className="category">{product.category.name}</span>}
                          {product.subcategory && <span className="subcategory">{product.subcategory}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="no-results">
                  <p>Aucun résultat.</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Détails du lot */}
          {step === 2 && selectedProduct && (
            <div className="form-step">
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div className="product-info">
                  <div className="product-name">{selectedProduct.display_name}</div>
                  <div className="product-source">{selectedProduct.type === 'canonical' ? 'Base de données' : 'Nouveau produit'}</div>
                </div>
                <div className={`confidence-badge ${confidence.tone}`}>
                  <ShieldCheck size={14} />
                  <span>
                    {confidence.label} ({confidence.percent}%)
                  </span>
                </div>
                <button onClick={() => setStep(1)} className="change-btn">
                  Changer
                </button>
              </div>

              <div className="lot-form">
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label htmlFor="qty">Quantité *</label>
                    <input
                      ref={qtyInputRef}
                      id="qty"
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={lotData.qty}
                      onChange={(e) => setLotData((prev) => ({ ...prev, qty: e.target.value }))}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label htmlFor="unit">Unité</label>
                    <select
                      id="unit"
                      value={lotData.unit}
                      onChange={(e) => setLotData((prev) => ({ ...prev, unit: e.target.value }))}
                      className="form-select"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="u">pièce</option>
                      <option value="pièce">pièce</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Méthode de stockage</label>
                  <div className="storage-grid">
                    {[
                      { value: 'fridge', label: 'Frigo', icon: '❄️' },
                      { value: 'pantry', label: 'Placard', icon: '🏠' },
                      { value: 'freezer', label: 'Congélateur', icon: '🧊' },
                      { value: 'counter', label: 'Plan travail', icon: '🏪' }
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleStorageMethodChange(m.value)}
                        className={`storage-btn ${lotData.storage_method === m.value ? 'active' : ''}`}
                      >
                        <span className="method-icon">{m.icon}</span>
                        <span className="method-label">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expiration_date">
                    <Calendar size={16} />Date d'expiration
                  </label>
                  <input
                    id="expiration_date"
                    type="date"
                    value={lotData.expiration_date}
                    onChange={(e) => setLotData((prev) => ({ ...prev, expiration_date: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="storage_place">
                    <MapPin size={16} />Lieu (optionnel)
                  </label>
                  <input
                    id="storage_place"
                    type="text"
                    value={lotData.storage_place}
                    onChange={(e) => setLotData((prev) => ({ ...prev, storage_place: e.target.value }))}
                    placeholder="ex: étagère du haut, tiroir légumes..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (optionnel)</label>
                  <textarea
                    id="notes"
                    value={lotData.notes}
                    onChange={(e) => setLotData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Marque, origine, particularités..."
                    className="form-textarea"
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button onClick={() => setStep(1)} className="btn-secondary" disabled={loading}>
                  Retour
                </button>
                <button onClick={handleCreateLot} className="btn-primary" disabled={loading || !lotData.qty}>
                  {loading ? 'Création...' : 'Créer le lot'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-container { background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,.2); max-width: 500px; width: 100%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f8fdf8; }
        .header-title { display: flex; align-items: center; gap: .5rem; font-size: 1.25rem; font-weight: 600; color: #1a3a1a; }
        .close-btn { background: none; border: none; cursor: pointer; padding: .5rem; border-radius: 8px; color: #6b7280; }
        .progress-bar { display: flex; padding: 1rem 1.5rem; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .progress-step { flex: 1; text-align: center; padding: .5rem; font-size: .875rem; font-weight: 500; color: #9ca3af; }
        .progress-step.active { color: #6b9d6b; }
        .modal-content { flex: 1; overflow-y: auto; padding: 1.5rem; }
        .search-wrapper { position: relative; margin-bottom: 1rem; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .search-input { width: 100%; padding: 1rem 1rem 1rem 3rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; }
        .search-input:focus { outline: none; border-color: #a8c5a8; box-shadow: 0 0 0 3px rgba(168,197,168,.1); }
        .loading { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
        .debug-info { margin-bottom: 1rem; padding: .5rem; background: #f0f9ff; border-radius: 6px; color: #1d4ed8; }
        .search-error { margin-bottom: 1rem; padding: .75rem 1rem; background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; color: #c2410c; font-size: .9rem; line-height: 1.4; }
        .results-list { display: flex; flex-direction: column; gap: .5rem; max-height: 300px; overflow-y: auto; }
        .result-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; background: white; }
        .result-item:hover { border-color: #c8d8c8; background: #f8fdf8; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .result-item.new-item { border-style: dashed; border-color: #a8c5a8; background: rgba(139,181,139,.05); }
        .result-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 8px; flex-shrink: 0; }
        .result-content { flex: 1; min-width: 0; }
        .result-name { font-weight: 600; color: #111827; display: flex; align-items: center; gap: .5rem; margin-bottom: .25rem; }
        .new-badge { background: #f0f9f0; color: #6b9d6b; padding: 2px 6px; border-radius: 4px; font-size: .75rem; font-weight: 500; }
        .result-meta { font-size: .875rem; color: #6b7280; display: flex; align-items: center; gap: .5rem; }
        .category { background: #eff6ff; color: #1d4ed8; padding: 1px 6px; border-radius: 4px; font-size: .75rem; }
        .subcategory { background: #f0fdf4; color: #047857; padding: 1px 6px; border-radius: 4px; font-size: .75rem; }
        .no-results { text-align: center; padding: 2rem 1rem; color: #6b7280; }
        .product-summary { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fdf8; border: 1px solid #dcf4dc; border-radius: 12px; margin-bottom: 1.5rem; }
        .product-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; }
        .product-info { flex: 1; }
        .product-name { font-weight: 600; color: #1a3a1a; margin-bottom: .25rem; }
        .product-source { font-size: .875rem; color: #6b7280; }
        .confidence-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 999px; }
        .confidence-badge.good { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .confidence-badge.neutral { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .confidence-badge.warning { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .change-btn { background: none; border: 1px solid #d1d5db; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; color: #6b7280; }
        .change-btn:hover { background: #f9fafb; }
        .lot-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: .5rem; }
        .form-group.flex-1 { flex: 1; }
        .form-group.flex-2 { flex: 2; }
        .form-group label { font-weight: 500; color: #374151; display: flex; align-items: center; gap: .5rem; font-size: 14px; }
        .form-input, .form-select, .form-textarea { padding: .75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #a8c5a8; box-shadow: 0 0 0 3px rgba(168,197,168,.1); }
        .storage-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
        .storage-btn { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; }
        .storage-btn:hover { border-color: #c8d8c8; }
        .storage-btn.active { border-color: #8bb58b; background: #f8fdf8; }
        .method-icon { font-size: 1.25rem; }
        .method-label { font-size: .875rem; font-weight: 500; color: #374151; }
        .form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
        .btn-secondary, .btn-primary { flex: 1; padding: .75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; border: none; }
        .btn-secondary { background: #f9fafb; border: 1px solid #d1d5db; color: #374151; }
        .btn-primary { background: #8bb58b; color: white; }
        .btn-primary:disabled, .btn-secondary:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 768px){
          .modal-container { margin: 0; max-height: 100vh; border-radius: 0; }
          .modal-content { padding: 1rem; }
          .form-row { flex-direction: column; gap: .75rem; }
          .storage-grid { grid-template-columns: 1fr; gap: .5rem; }
          .storage-btn { flex-direction: row; padding: .75rem; justify-content: flex-start; }
          .product-summary { flex-wrap: wrap; gap: .75rem; }
          .form-actions { flex-direction: column; }
          .result-meta { flex-direction: column; align-items: flex-start; gap: .25rem; }
        }
      `}</style>
    </div>
  );
}
