'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { daysUntil } from '@/lib/dates';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard';
import { LotsView } from './components/LotsView';
import { PantryStats } from './components/PantryStats';
import { EnhancedLotCard } from './components/EnhancedLotCard';

// Hook personnalisé pour la gestion des données
function usePantryData() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');
  const [view, setView] = useState('products');
  const [showAddForm, setShowAddForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    
    try {
      // Récupération des emplacements de stockage depuis storage_guides
      const { data: storageData, error: e1 } = await supabase
        .from('storage_guides')
        .select('method')
        .is('owner_id', null); // Guides globaux seulement

      const storageLocations = [...new Set(storageData?.map(s => s.method) || [])];
      
      // Transformation en format compatible avec l'ancien système
      const formattedLocations = storageLocations.map((method, index) => ({
        id: index + 1,
        name: method === 'fridge' ? 'Frigo' 
            : method === 'pantry' ? 'Placard'
            : method === 'freezer' ? 'Congélateur'
            : method === 'cellar' ? 'Cave'
            : method === 'counter' ? 'Plan de travail'
            : method
      }));

      // Récupération des lots via la vue unifiée
      const { data: lotsData, error: e2 } = await supabase
        .from('v_inventory_display')
        .select('*')
        .order('effective_expiration', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (e2) throw e2;
      
      setLocations(formattedLocations);
      setLots((lotsData || []).map(lot => ({
        ...lot,
        // Compatibilité avec l'ancien format
        id: lot.id,
        qty: lot.qty_remaining,
        unit: lot.unit,
        dlc: lot.effective_expiration,
        best_before: lot.effective_expiration,
        note: lot.notes,
        entered_at: lot.created_at,
        location_id: null, // Pas utilisé dans le nouveau système
        product: {
          id: lot.canonical_food_id || lot.cultivar_id || lot.derived_product_id || lot.generic_product_id,
          name: lot.display_name,
          category: lot.category_name,
          default_unit: lot.default_unit,
          density_g_per_ml: lot.density_g_per_ml,
          grams_per_unit: lot.unit_weight_grams
        },
        location: {
          id: 1,
          name: lot.storage_method === 'fridge' ? 'Frigo' 
              : lot.storage_method === 'pantry' ? 'Placard'
              : lot.storage_method === 'freezer' ? 'Congélateur'
              : lot.storage_method === 'cellar' ? 'Cave'
              : lot.storage_method === 'counter' ? 'Plan de travail'
              : lot.recommended_storage || 'Non défini'
        },
        // Nouvelles propriétés
        product_type: lot.product_type,
        category_icon: lot.category_icon,
        category_color: lot.category_color,
        storage_place: lot.storage_place
      })));
      
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddLot = useCallback(async (lotData, productInfo) => {
    try {
      setErr('');
      
      // Déterminer quel type de produit on ajoute
      let insertData = {
        owner_id: (await supabase.auth.getUser()).data.user?.id,
        initial_qty: lotData.qty,
        qty_remaining: lotData.qty,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place || '',
        acquired_on: lotData.acquired_on || new Date().toISOString().split('T')[0],
        expiration_date: lotData.dlc,
        notes: lotData.note || ''
      };

      // Assignation selon le type de produit
      if (productInfo.product_type === 'canonical') {
        insertData.canonical_food_id = productInfo.id;
      } else if (productInfo.product_type === 'cultivar') {
        insertData.cultivar_id = productInfo.id;
      } else if (productInfo.product_type === 'derived') {
        insertData.derived_product_id = productInfo.id;
      } else if (productInfo.product_type === 'generic') {
        insertData.generic_product_id = productInfo.id;
      }

      const { data: newLot, error } = await supabase
        .from('inventory_lots')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Recharger les données pour avoir la vue complète
      await load();
      return true;
    } catch (e) {
      console.error(e);
      setErr(e.message);
      return false;
    }
  }, [load]);

  const handleDeleteLot = useCallback(async (lotId) => {
    try {
      setErr('');
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', lotId);
      
      if (error) throw error;
      
      setLots(prev => prev.filter(l => l.id !== lotId));
      return true;
    } catch (e) {
      console.error(e);
      setErr(e.message);
      return false;
    }
  }, []);

  const handleUpdateLot = useCallback(async (lotId, updates) => {
    try {
      setErr('');
      
      // Transformation des champs pour la nouvelle structure
      const updateData = {};
      if (updates.qty !== undefined) updateData.qty_remaining = updates.qty;
      if (updates.dlc !== undefined) updateData.expiration_date = updates.dlc;
      if (updates.note !== undefined) updateData.notes = updates.note;
      if (updates.storage_method !== undefined) updateData.storage_method = updates.storage_method;
      if (updates.storage_place !== undefined) updateData.storage_place = updates.storage_place;
      
      const { error } = await supabase
        .from('inventory_lots')
        .update(updateData)
        .eq('id', lotId);
      
      if (error) throw error;
      
      setLots(prev => prev.map(l => 
        l.id === lotId 
          ? { 
              ...l, 
              qty: updates.qty !== undefined ? updates.qty : l.qty,
              dlc: updates.dlc !== undefined ? updates.dlc : l.dlc,
              best_before: updates.dlc !== undefined ? updates.dlc : l.best_before,
              note: updates.note !== undefined ? updates.note : l.note
            }
          : l
      ));
      return true;
    } catch (e) {
      console.error(e);
      setErr(e.message);
      return false;
    }
  }, []);

  return {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  };
}

// Composants d'interface
function SearchBar({ q, setQ, locFilter, setLocFilter, locations }) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '2px solid var(--earth-300)',
            fontSize: '1rem'
          }}
        />
      </div>
      
      <select
        value={locFilter}
        onChange={(e) => setLocFilter(e.target.value)}
        style={{
          padding: '0.75rem',
          borderRadius: '0.5rem',
          border: '2px solid var(--earth-300)',
          fontSize: '1rem',
          minWidth: '150px'
        }}
      >
        <option value="Tous">📍 Tous les lieux</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.name}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  const views = [
    { key: 'products', icon: '📦', label: 'Par produit' },
    { key: 'lots', icon: '🏷️', label: 'Par lot' },
    { key: 'stats', icon: '📊', label: 'Statistiques' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap'
    }}>
      {views.map(({ key, icon, label }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`btn ${view === key ? 'primary' : 'secondary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem'
          }}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

function Header() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--forest-400) 0%, var(--earth-400) 100%)',
      margin: '-2rem -2rem 2rem -2rem',
      padding: '2rem',
      borderRadius: '0 0 1rem 1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        color: 'white'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, var(--forest-500), var(--forest-400))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(58, 107, 30, 0.3)'
        }}>
          <span style={{ fontSize: '20px' }}>🏺</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
          fontFamily: 'Crimson Text, serif',
          fontWeight: '600',
          background: 'linear-gradient(135deg, var(--forest-700), var(--forest-500))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Garde-Manger
        </h1>
      </div>
    </div>
  );
}

// Page principale
export default function PantryPage() {
  const {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  } = usePantryData();

  const [selectedProductForAdd, setSelectedProductForAdd] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);

  useEffect(() => { 
    load(); 
  }, [load]);

  // Filtrage des lots
  const filtered = useMemo(() => {
    const s = (q || '').toLowerCase().trim();
    
    return (lots || []).filter(l => {
      const okLoc = locFilter === 'Tous' || l.location?.name === locFilter;
      if (!okLoc) return false;
      
      if (!s) return true;
      
      const productName = (l.product?.name || '').toLowerCase();
      const category = (l.product?.category || '').toLowerCase();
      const note = (l.note || '').toLowerCase();
      const storagePlace = (l.storage_place || '').toLowerCase();
      
      return productName.includes(s) || category.includes(s) || note.includes(s) || storagePlace.includes(s);
    });
  }, [lots, q, locFilter]);

  // Groupement par produit pour la vue "products"
  const byProduct = useMemo(() => {
    const m = new Map();
    
    for (const lot of filtered) {
      const pid = lot.product?.id;
      if (!pid) continue;
      
      if (!m.has(pid)) {
        m.set(pid, { 
          productId: pid, 
          name: lot.product.name, 
          category: lot.product.category,
          unit: lot.product.default_unit || lot.unit,
          lots: [],
          category_icon: lot.category_icon,
          category_color: lot.category_color,
          product_type: lot.product_type
        });
      }
      m.get(pid).lots.push(lot);
    }
    
    return Array.from(m.values()).sort((a, b) => {
      const aUrgent = Math.min(...a.lots.map(l => daysUntil(l.best_before) ?? 999));
      const bUrgent = Math.min(...b.lots.map(l => daysUntil(l.best_before) ?? 999));
      return aUrgent - bUrgent;
    });
  }, [filtered]);

  if (loading) {
    return (
      <div className="page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column'
        }}>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--forest-600)' }}>
            Chargement du garde-manger...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      
      <SearchBar 
        q={q} 
        setQ={setQ} 
        locFilter={locFilter} 
        setLocFilter={setLocFilter}
        locations={locations}
      />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`btn ${showAddForm ? 'danger' : 'primary'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {showAddForm ? (
            <>
              <span>❌</span>
              Annuler
            </>
          ) : (
            <>
              <span>➕</span>
              Ajouter un produit
            </>
          )}
        </button>

        <ViewToggle view={view} setView={setView} />
      </div>

      {err && (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          <strong>Erreur :</strong> {err}
        </div>
      )}

      {showAddForm && (
        <div style={{ marginBottom: '2rem' }}>
          <SmartAddForm
            onSave={handleAddLot}
            onCancel={() => setShowAddForm(false)}
            locations={locations}
          />
        </div>
      )}

      {view === 'stats' && <PantryStats lots={filtered} />}
      
      {view === 'products' && (
        <div className="grid cols-1 md:cols-2 lg:cols-3" style={{ gap: '1rem' }}>
          {byProduct.length === 0 ? (
            <div style={{ 
              gridColumn: '1/-1', 
              textAlign: 'center', 
              padding: '3rem',
              color: 'var(--medium-gray)'
            }}>
              {q || locFilter !== 'Tous' ? (
                <>
                  <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
                  <p>Aucun produit trouvé avec ces critères</p>
                  <button 
                    onClick={() => { setQ(''); setLocFilter('Tous'); }}
                    className="btn secondary"
                    style={{ marginTop: '1rem' }}
                  >
                    Effacer les filtres
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</p>
                  <p>Votre garde-manger est vide</p>
                  <p style={{ fontSize: '0.9rem' }}>Ajoutez vos premiers produits pour commencer</p>
                </>
              )}
            </div>
          ) : (
            byProduct.map(product => (
              <ProductCard
                key={product.productId}
                product={product}
                onUpdate={handleUpdateLot}
                onDelete={handleDeleteLot}
                onDetail={setDetailProduct}
              />
            ))
          )}
        </div>
      )}
      
      {view === 'lots' && (
        <LotsView 
          lots={filtered}
          onUpdate={handleUpdateLot}
          onDelete={handleDeleteLot}
        />
      )}
    </div>
  );
}
