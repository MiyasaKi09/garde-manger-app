// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Calendar, MapPin, Package, ChevronLeft, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
      setLotData({ 
        qty: '', 
        unit: 'g', 
        storage_method: 'pantry', 
        storage_place: '', 
        expiration_date: '', 
        notes: '' 
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Focus on qty at step 2
  useEffect(() => {
    if (step === 2) setTimeout(() => qtyInputRef.current?.focus(), 100);
  }, [step]);

  // Estimate expiry based on shelf life
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

  // Default quantity based on unit
  const defaultQtyForUnit = useCallback((unit) => {
    if (!unit) return '';
    const u = unit.toLowerCase();
    if (u === 'u' || u === 'pièce') return '1';
    if (u === 'kg' || u === 'l') return '1';
    if (u === 'g' || u === 'ml') return '250';
    return '';
  }, []);

  // Search products in Supabase
  const searchProducts = useCallback(
    async (query) => {
      const q = query.trim();
      if (!q) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }
      
      setSearchLoading(true);
      setSearchError(null);
      
      try {
        // Escape special characters for the query
        const escaped = q.replace(/[%_]/g, '\\$&');
        
        // Search in canonical_foods table
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
            shelf_life_days_freezer,
            keywords
          `)
          .or(`canonical_name.ilike.%${escaped}%`)
          .limit(15);

        if (error) throw error;

        // Also search in keywords if available
        let allResults = data || [];
        
        // Try to search in keywords array if the column exists
        if (data && data.length < 10) {
          const { data: keywordResults } = await supabase
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
            .contains('keywords', [q.toLowerCase()])
            .limit(10);
          
          if (keywordResults) {
            // Merge results, avoiding duplicates
            const existingIds = new Set(allResults.map(r => r.id));
            keywordResults.forEach(r => {
              if (!existingIds.has(r.id)) {
                allResults.push(r);
              }
            });
          }
        }

        const normalized = allResults.map((row) => ({
          id: row.id,
          type: 'canonical',
          name: row.canonical_name,
          display_name: row.canonical_name,
          subcategory: row.subcategory,
          category: { name: row.subcategory || 'Aliment', icon: '🥬' },
          primary_unit: row.primary_unit || 'g',
          shelf_life_days_fridge: row.shelf_life_days_fridge,
          shelf_life_days_pantry: row.shelf_life_days_pantry,
          shelf_life_days_freezer: row.shelf_life_days_freezer
        }));

        // Sort by relevance
        normalized.sort((a, b) => {
          const sa = a.name.toLowerCase();
          const sb = b.name.toLowerCase();
          const ql = q.toLowerCase();
          const ra = sa === ql ? 0 : sa.startsWith(ql) ? 1 : sa.includes(ql) ? 2 : 3;
          const rb = sb === ql ? 0 : sb.startsWith(ql) ? 1 : sb.includes(ql) ? 2 : 3;
          return ra - rb;
        });

        // Add option to create new product
        const results = [
          ...normalized.slice(0, 12),
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: `Créer "${q}"`,
            category: { name: 'Nouveau produit', icon: '➕' },
            primary_unit: 'g'
          }
        ];

        setSearchResults(results);
      } catch (e) {
        console.error('Search error:', e);
        setSearchError('Erreur de recherche');
        // Still offer to create new product on error
        setSearchResults([
          {
            id: 'new-product',
            type: 'new',
            name: q,
            display_name: `Créer "${q}"`,
            category: { name: 'Nouveau produit', icon: '➕' },
            primary_unit: 'g'
          }
        ]);
      } finally {
        setSearchLoading(false);
      }
    },
    [supabase]
  );

  // Debounce search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // Handle product selection
  const handleSelectProduct = useCallback(
    (product) => {
      setSelectedProduct(product);
      
      const unit = product.primary_unit || 'g';
      const expiry = product.type === 'canonical' ? estimateExpiry(product, lotData.storage_method) : '';
      const qty = defaultQtyForUnit(unit);

      setLotData((prev) => ({ 
        ...prev, 
        unit, 
        qty: qty, 
        expiration_date: expiry 
      }));
      setStep(2);
    },
    [lotData.storage_method, estimateExpiry, defaultQtyForUnit]
  );

  // Handle storage method change
  const handleStorageMethodChange = useCallback(
    (method) => {
      setLotData((prev) => ({
        ...prev,
        storage_method: method,
        expiration_date: selectedProduct?.type === 'canonical' 
          ? estimateExpiry(selectedProduct, method) 
          : prev.expiration_date
      }));
    },
    [selectedProduct, estimateExpiry]
  );

  // Ensure canonical product exists
  const ensureCanonicalExists = useCallback(
    async (name) => {
      const clean = name.trim();
      if (!clean) throw new Error('Nom de produit vide');

      // Check if it already exists
      const { data: existing, error: exErr } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, primary_unit')
        .ilike('canonical_name', clean)
        .limit(1)
        .maybeSingle();
      
      if (exErr) throw exErr;
      if (existing) return existing;

      // Create new canonical food
      const { data: inserted, error: insErr } = await supabase
        .from('canonical_foods')
        .insert({
          canonical_name: clean,
          primary_unit: lotData.unit || 'g'
        })
        .select('id, canonical_name, primary_unit')
        .single();
      
      if (insErr) throw insErr;
      return inserted;
    },
    [supabase, lotData.unit]
  );

  // Create inventory lot
  const handleCreateLot = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) return;
    
    setLoading(true);
    try {
      // Get user if needed for RLS
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id || null;

      let canonical = null;
      if (selectedProduct.type === 'canonical') {
        canonical = { id: selectedProduct.id };
      } else if (selectedProduct.type === 'new') {
        canonical = await ensureCanonicalExists(selectedProduct.name);
      }

      const payload = {
        canonical_food_id: canonical?.id ?? null,
        display_name: selectedProduct.name,
        qty_remaining: Number(lotData.qty),
        initial_qty: Number(lotData.qty),
        unit: lotData.unit,
        expiration_date: lotData.expiration_date || null,
        storage_place: lotData.storage_place || null,
        storage_method: lotData.storage_method,
        notes: lotData.notes || null,
        acquired_on: new Date().toISOString().split('T')[0],
        user_id: userId
      };

      const { data: lot, error: lotErr } = await supabase
        .from('inventory_lots')
        .insert(payload)
        .select('id')
        .single();
      
      if (lotErr) throw lotErr;

      // Callback parent
      if (onLotCreated) onLotCreated(lot?.id ?? null);

      // Reset and close
      onClose?.();
    } catch (e) {
      console.error('Create lot error:', e);
      alert(e?.message || 'Erreur lors de la création du lot');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, supabase, ensureCanonicalExists, onLotCreated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ajouter un produit</h2>
                <p className="text-sm text-gray-600">
                  {step === 1 ? 'Rechercher un aliment' : 'Détails du lot'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Search */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit (ex: tomate, lait, riz...)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {searchError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{searchError}</span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={`${product.type}-${product.id}`}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        product.type === 'new' 
                          ? 'border-dashed border-green-300 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {product.type === 'new' ? '➕' : '🥬'}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {product.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category?.name}
                            {product.subcategory && ` • ${product.subcategory}`}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {product.primary_unit}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && selectedProduct && (
            <div className="space-y-4">
              {/* Selected product */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🥬</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {selectedProduct.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedProduct.type === 'canonical' ? 'Produit existant' : 'Nouveau produit'}
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Changer
                  </button>
                </div>
              </div>

              {/* Quantity and unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité *
                  </label>
                  <input
                    ref={qtyInputRef}
                    type="number"
                    step="0.1"
                    value={lotData.qty}
                    onChange={(e) => setLotData(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité
                  </label>
                  <select
                    value={lotData.unit}
                    onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">L</option>
                    <option value="u">pièce</option>
                  </select>
                </div>
              </div>

              {/* Storage method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de stockage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'fridge', label: 'Frigo', icon: '❄️' },
                    { value: 'pantry', label: 'Placard', icon: '🗄️' },
                    { value: 'freezer', label: 'Congélateur', icon: '🧊' },
                    { value: 'counter', label: 'Plan de travail', icon: '🍽️' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handleStorageMethodChange(method.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        lotData.storage_method === method.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date d'expiration
                </label>
                <input
                  type="date"
                  value={lotData.expiration_date}
                  onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Storage place */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Emplacement (optionnel)
                </label>
                <input
                  type="text"
                  value={lotData.storage_place}
                  onChange={(e) => setLotData(prev => ({ ...prev, storage_place: e.target.value }))}
                  placeholder="Ex: Étagère du haut, tiroir légumes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={lotData.notes}
                  onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Marque, origine, particularités..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 2 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={handleCreateLot}
              disabled={loading || !lotData.qty}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Créer le lot</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
