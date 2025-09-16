'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';

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

  const supabase = useMemo(() => supabaseClient, []);

  // Reset form when open
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setConfidence({ percent: 0, label: 'Faible', tone: 'warning' });
      setLotData({ qty: '', unit: 'g', storage_method: 'pantry', storage_place: '', expiration_date: '', notes: '' });
      setSearchError(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (step === 2) setTimeout(() => qtyInputRef.current?.focus(), 100);
  }, [step]);

  // --- Helpers ---
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

  // --- Recherche produits ---
  const searchProducts = useCallback(async (query) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);

    try {
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
        .ilike('canonical_name', `%${q}%`)
        .limit(15);

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

      setSearchResults([
        ...normalized,
        {
          id: 'new-product',
          type: 'new',
          name: q,
          display_name: q,
          category: { name: 'À définir', icon: '📦' },
          primary_unit: 'g',
          icon: '➕'
        }
      ]);
    } catch (e) {
      console.error('search error', e);
      setSearchError(e?.message || 'Erreur lors de la recherche');
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // Sélection d’un produit
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    const conf = calcConfidence(searchQuery, product.name || product.display_name);
    setConfidence(conf);

    const unit = product.primary_unit || 'g';
    const expiry = product.type === 'canonical' ? estimateExpiry(product, 'pantry') : '';
    const qty = defaultQtyForUnit(unit);

    setLotData((prev) => ({ ...prev, unit, qty: prev.qty || qty, expiration_date: expiry }));
    setStep(2);
  }, [searchQuery, calcConfidence, estimateExpiry, defaultQtyForUnit]);

  // Création d’un lot
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || null;

      let canonical = null;
      if (selectedProduct.type === 'canonical') {
        canonical = { id: selectedProduct.id, primary_unit: selectedProduct.primary_unit };
      } else {
        const { data: inserted, error } = await supabase
          .from('canonical_foods')
          .insert({ canonical_name: selectedProduct.name, primary_unit: 'g' })
          .select('id, canonical_name, primary_unit')
          .single();
        if (error) throw error;
        canonical = inserted;
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
        created_by: userId
      };

      const { data: lot, error: lotErr } = await supabase
        .from('inventory_lots')
        .insert(payload)
        .select('id')
        .single();
      if (lotErr) throw lotErr;

      onLotCreated?.(lot?.id ?? null);
      onClose?.();
    } catch (e) {
      console.error('create lot error', e);
      alert(e?.message || 'Erreur lors de la création du lot');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, supabase, onLotCreated, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            <span>Ajouter un produit</span>
          </div>
          <button onClick={() => onClose?.()} className="close-btn"><X size={20} /></button>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="search-step">
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchLoading && <div className="loading">🔄</div>}
              </div>

              {searchError && <div className="error-info"><small>⚠️ {searchError}</small></div>}

              <div className="results-list">
                {searchResults.map((p) => (
                  <div key={`${p.type}-${p.id}`} className="result-item" onClick={() => handleSelectProduct(p)}>
                    <div className="result-icon">{p.icon}</div>
                    <div>{p.display_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="form-step">
              <div className="product-summary">
                <div className="product-icon">{selectedProduct.icon}</div>
                <div>{selectedProduct.display_name}</div>
              </div>

              <div className="lot-form">
                <label>Quantité *</label>
                <input ref={qtyInputRef} type="number" value={lotData.qty}
                  onChange={(e) => setLotData({ ...lotData, qty: e.target.value })} />

                <label>Unité</label>
                <select value={lotData.unit} onChange={(e) => setLotData({ ...lotData, unit: e.target.value })}>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="u">pièce</option>
                </select>

                <label>Date d'expiration</label>
                <input type="date" value={lotData.expiration_date}
                  onChange={(e) => setLotData({ ...lotData, expiration_date: e.target.value })} />

                <label>Lieu</label>
                <input type="text" value={lotData.storage_place}
                  onChange={(e) => setLotData({ ...lotData, storage_place: e.target.value })} />

                <label>Notes</label>
                <textarea value={lotData.notes}
                  onChange={(e) => setLotData({ ...lotData, notes: e.target.value })}></textarea>
              </div>

              <div className="form-actions">
                <button onClick={() => setStep(1)} disabled={loading}>Retour</button>
                <button onClick={handleCreateLot} disabled={loading || !lotData.qty}>
                  {loading ? 'Création...' : 'Créer le lot'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
