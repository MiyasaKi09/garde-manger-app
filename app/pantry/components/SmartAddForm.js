// app/pantry/components/SmartAddForm.js - Version complète corrigée

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PantryStyles } from './pantryUtils';

export function SmartAddForm({ onSave, onCancel, locations }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Recherche et sélection de produit
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Données du lot
  const [lotData, setLotData] = useState({
    qty: '',
    unit: 'g',
    storage_method: 'fridge',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  // Recherche unifiée dans tous les types de produits
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Recherche dans les aliments canoniques
      const { data: canonicalResults } = await supabase
        .from('canonical_foods')
        .select(`
          id, canonical_name, 
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml,
          keywords
        `)
        .or(`canonical_name.ilike.%${query}%,keywords.cs.{${query}}`)
        .limit(10);

      // Recherche dans les variétés
      const { data: cultivarResults } = await supabase
        .from('cultivars')
        .select(`
          id, cultivar_name, synonyms,
          canonical_food:canonical_foods(
            canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
            category:reference_categories(name, icon, color_hex)
          )
        `)
        .or(`cultivar_name.ilike.%${query}%,synonyms.cs.{${query}}`)
        .limit(10);

      // Recherche dans les produits génériques
      const { data: genericResults } = await supabase
        .from('generic_products')
        .select(`
          id, name, keywords,
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml
        `)
        .or(`name.ilike.%${query}%,keywords.cs.{${query}}`)
        .limit(10);

      // Recherche dans les produits dérivés
      const { data: derivedResults } = await supabase
        .from('derived_products')
        .select(`
          id, derived_name, process_method,
          cultivar:cultivars(
            cultivar_name,
            canonical_food:canonical_foods(
              canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
              category:reference_categories(name, icon, color_hex)
            )
          )
        `)
        .ilike('derived_name', `%${query}%`)
        .limit(5);

      // Formatage des résultats
      const results = [];

      // Aliments canoniques
      (canonicalResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'canonical',
          name: item.canonical_name,
          display_name: item.canonical_name,
          category: item.category,
          primary_unit: item.primary_unit,
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          source: 'Aliment de base'
        });
      });

      // Variétés
      (cultivarResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'cultivar',
          name: item.cultivar_name,
          display_name: `${item.cultivar_name} (${item.canonical_food?.canonical_name})`,
          category: item.canonical_food?.category,
          primary_unit: item.canonical_food?.primary_unit,
          unit_weight_grams: item.canonical_food?.unit_weight_grams,
          density_g_per_ml: item.canonical_food?.density_g_per_ml,
          source: 'Variété'
        });
      });

      // Produits génériques
      (genericResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'generic',
          name: item.name,
          display_name: item.name,
          category: item.category,
          primary_unit: item.primary_unit,
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          source: 'Produit commerce'
        });
      });

      // Produits dérivés
      (derivedResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'derived',
          name: item.derived_name,
          display_name: `${item.derived_name} (${item.cultivar?.cultivar_name || item.cultivar?.canonical_food?.canonical_name})`,
          category: item.cultivar?.canonical_food?.category,
          primary_unit: item.cultivar?.canonical_food?.primary_unit,
          unit_weight_grams: item.cultivar?.canonical_food?.unit_weight_grams,
          density_g_per_ml: item.cultivar?.canonical_food?.density_g_per_ml,
          process_method: item.process_method,
          source: 'Transformation'
        });
      });

      // Tri par pertinence
      results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const typeOrder = { canonical: 0, cultivar: 1, generic: 2, derived: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setSearchResults(results.slice(0, 15));
    } catch (err) {
      console.error('Erreur de recherche:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Sélection d'un produit
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit || 'g'
    }));
    setStep(2);
  }, []);

  // Création d'un nouveau produit rapide
  const handleCreateQuickProduct = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Création d'un produit générique simple
      const { data: newProduct, error } = await supabase
        .from('generic_products')
        .insert([{
          name: searchQuery.trim(),
          primary_unit: 'g'
        }])
        .select(`
          id, name, primary_unit,
          category:reference_categories(name, icon, color_hex)
        `)
        .single();

      if (error) throw error;

      const product = {
        id: newProduct.id,
        type: 'generic',
        name: newProduct.name,
        display_name: newProduct.name,
        category: newProduct.category,
        primary_unit: newProduct.primary_unit,
        source: 'Nouveau produit'
      };

      handleSelectProduct(product);
    } catch (err) {
      console.error('Erreur création produit:', err);
      setError('Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, handleSelectProduct]);

  // Sauvegarde du lot
  const handleSave = useCallback(async () => {
    if (!selectedProduct || !lotData.qty) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const success = await onSave(lotData, {
        ...selectedProduct,
        product_type: selectedProduct.type
      });
      
      if (success) {
        onCancel();
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, lotData, onSave, onCancel]);

  // Estimation automatique de la DLC
  const estimateExpirationDate = useCallback(async (productType, productId, storageMethod) => {
    try {
      // Recherche des guides de conservation
      let guideQuery = supabase
        .from('storage_guides')
        .select('shelf_life_days')
        .eq('method', storageMethod)
        .limit(1);

      if (productType === 'canonical') {
        guideQuery = guideQuery.eq('canonical_food_id', productId);
      } else if (productType === 'cultivar') {
        guideQuery = guideQuery.eq('cultivar_id', productId);
      } else if (productType === 'derived') {
        guideQuery = guideQuery.eq('derived_product_id', productId);
      }

      const { data: guides } = await guideQuery;
      
      if (guides && guides.length > 0) {
        const days = guides[0].shelf_life_days;
        if (days) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          return date.toISOString().split('T')[0];
        }
      }

      // Fallback: estimation basique par méthode de stockage
      const defaultDays = {
        'fridge': 7,
        'freezer': 90,
        'pantry': 30,
        'cellar': 60,
        'counter': 3
      };

      const days = defaultDays[storageMethod] || 7;
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
      
    } catch (err) {
      console.error('Erreur estimation DLC:', err);
      return '';
    }
  }, []);

  // Mise à jour automatique de la DLC quand on change la méthode de stockage
  useEffect(() => {
    if (selectedProduct && lotData.storage_method && !lotData.expiration_date) {
      estimateExpirationDate(selectedProduct.type, selectedProduct.id, lotData.storage_method)
        .then(date => {
          if (date) {
            setLotData(prev => ({ ...prev, expiration_date: date }));
          }
        });
    }
  }, [selectedProduct, lotData.storage_method, lotData.expiration_date, estimateExpirationDate]);

  return (
    <div style={{
      ...PantryStyles.glassBase,
      padding: '1.5rem',
      borderRadius: '1rem',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h3 style={{ 
        marginBottom: '1.5rem', 
        color: 'var(--forest-700)',
        textAlign: 'center'
      }}>
        ➕ Ajouter un produit au garde-manger
      </h3>

      {error && (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Étape 1: Recherche de produit */}
      {step === 1 && (
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Nom du produit
          </label>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '0.5rem',
              border: '2px solid var(--earth-300)',
              fontSize: '1rem'
            }}
            autoFocus
          />

          {/* Résultats de recherche */}
          {searchLoading && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--forest-600)' }}>
                Produits trouvés :
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map((product, index) => (
                  <button
                    key={`${product.type}-${product.id}-${index}`}
                    onClick={() => handleSelectProduct(product)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      border: '1px solid var(--earth-300)',
                      borderRadius: '0.5rem',
                      background: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>
                      {product.category?.icon || '📦'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {product.display_name}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--medium-gray)',
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <span>📂 {product.category?.name || 'Sans catégorie'}</span>
                        <span>🏷️ {product.source}</span>
                        <span>📏 {product.primary_unit}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Option de création rapide */}
          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div style={{
              padding: '1rem',
              border: '2px dashed var(--earth-300)',
              borderRadius: '0.5rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <p style={{ marginBottom: '1rem' }}>
                Produit "{searchQuery}" non trouvé
              </p>
              <button
                onClick={handleCreateQuickProduct}
                className="btn secondary"
                disabled={loading}
              >
                ➕ Créer ce produit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Étape 2: Détails du lot */}
      {step === 2 && selectedProduct && (
        <div>
          {/* Produit sélectionné */}
          <div style={{
            padding: '1rem',
            background: 'var(--earth-100)',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '2rem' }}>
              {selectedProduct.category?.icon || '📦'}
            </span>
            <div>
              <h4 style={{ margin: 0 }}>
                {selectedProduct.display_name}
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem', 
                color: 'var(--medium-gray)' 
              }}>
                {selectedProduct.category?.name} • {selectedProduct.source}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="btn secondary small"
              style={{ marginLeft: 'auto' }}
            >
              Changer
            </button>
          </div>

          {/* Formulaire du lot */}
          <div className="grid cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quantité *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={lotData.qty}
                onChange={(e) => setLotData(prev => ({ ...prev, qty: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--earth-300)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Unité
              </label>
              <select
                value={lotData.unit}
                onChange={(e) => setLotData(prev => ({ ...prev, unit: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--earth-300)'
                }}
              >
                <option value="g">Grammes (g)</option>
                <option value="kg">Kilogrammes (kg)</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="cl">Centilitres (cl)</option>
                <option value="l">Litres (l)</option>
                <option value="u">Unités (u)</option>
              </select>
            </div>
          </div>

          <div className="grid cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Lieu de stockage
              </label>
              <select
                value={lotData.storage_method}
                onChange={(e) => setLotData(prev => ({ ...prev, storage_method: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--earth-300)'
                }}
              >
                <option value="fridge">🧊 Frigo</option>
                <option value="freezer">❄️ Congélateur</option>
                <option value="pantry">🏠 Placard</option>
                <option value="cellar">🍷 Cave</option>
                <option value="counter">🪑 Plan de travail</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Date de péremption
              </label>
              <input
                type="date"
                value={lotData.expiration_date}
                onChange={(e) => setLotData(prev => ({ ...prev, expiration_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--earth-300)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Emplacement précis (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Bac à légumes, Étagère du haut..."
              value={lotData.storage_place}
              onChange={(e) => setLotData(prev => ({ ...prev, storage_place: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--earth-300)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Notes (optionnel)
            </label>
            <textarea
              placeholder="Informations complémentaires..."
              value={lotData.notes}
              onChange={(e) => setLotData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--earth-300)',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
        paddingTop: '1rem',
        borderTop: '1px solid var(--earth-200)'
      }}>
        <button
          onClick={onCancel}
          className="btn secondary"
          disabled={loading}
        >
          Annuler
        </button>
        
        {step === 2 && (
          <button
            onClick={handleSave}
            className="btn primary"
            disabled={loading || !selectedProduct || !lotData.qty}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </div>
    </div>
  );
}
