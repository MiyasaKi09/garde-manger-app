'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard';
import { LotsView } from './components/LotsView';
import { PantryStats } from './components/PantryStats';
import { EnhancedLotCard } from './components/EnhancedLotCard';

// Utilitaires DateHelpers
const DateHelpers = {
  daysUntil(dateStr) {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  },

  fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }
};

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
      const [{ data: locs, error: e1 }, { data: ls, error: e2 }] = await Promise.all([
        supabase.from('locations').select('id, name').order('name', { ascending: true }),
        supabase
          .from('inventory_lots')
          .select(`
            id, qty, unit, dlc, note, entered_at, location_id,
            product:products_catalog ( 
              id, name, category, default_unit, density_g_per_ml, grams_per_unit 
            ),
            location:locations ( id, name )
          `)
          .order('dlc', { ascending: true, nullsFirst: true })
          .order('entered_at', { ascending: false })
      ]);
      
      if (e1) throw e1;
      if (e2) throw e2;
      
      setLocations(locs || []);
      setLots((ls || []).map(lot => ({
        ...lot,
        best_before: lot.dlc || lot.best_before
      })));
      
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddLot = async (lotData, product) => {
    try {
      const { data: newLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotData])
        .select(`
          id, qty, unit, dlc, note, entered_at, location_id,
          product:products_catalog ( 
            id, name, category, default_unit, density_g_per_ml, grams_per_unit 
          ),
          location:locations ( id, name )
        `)
        .single();

      if (error) throw error;

      const lotWithBestBefore = {
        ...newLot,
        best_before: newLot.dlc || newLot.best_before
      };

      setLots(prev => [lotWithBestBefore, ...prev]);
      return lotWithBestBefore;
    } catch (error) {
      console.error('Erreur ajout:', error);
      throw error;
    }
  };

  const handleDeleteLot = async (lotId) => {
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', lotId);

      if (error) throw error;
      
      setLots(prev => prev.filter(l => l.id !== lotId));
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleUpdateLot = async (lotId, updates) => {
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .update(updates)
        .eq('id', lotId)
        .select(`
          id, qty, unit, dlc, note, entered_at, location_id,
          product:products_catalog ( 
            id, name, category, default_unit, density_g_per_ml, grams_per_unit 
          ),
          location:locations ( id, name )
        `)
        .single();

      if (error) throw error;

      setLots(prev => prev.map(l => l.id === lotId ? {
        ...l, ...data, best_before: data.dlc || data.best_before
      } : l));
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      alert('Erreur: ' + err.message);
    }
  };

  return {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  };
}

// Composant pour le sélecteur de vue
function ViewSelector({ view, setView }) {
  return (
    <div className="view-selector">
      <button
        onClick={() => setView('products')}
        className={view === 'products' ? 'btn primary' : 'btn secondary'}
        style={{ 
          flex: 1,
          borderRadius: 'var(--radius-md)',
          fontSize: '0.95rem'
        }}
      >
        📦 Vue par produits
      </button>
      <button
        onClick={() => setView('lots')}
        className={view === 'lots' ? 'btn primary' : 'btn secondary'}
        style={{ 
          flex: 1,
          borderRadius: 'var(--radius-md)',
          fontSize: '0.95rem'
        }}
      >
        📋 Tous les lots
      </button>
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
    console.log('Filtrage:', { 
      totalLots: lots?.length, 
      searchQuery: s, 
      locationFilter: locFilter 
    });
    
    return (lots || []).filter(l => {
      const okLoc = locFilter === 'Tous' || l.location?.name === locFilter;
      if (!okLoc) return false;
      
      if (!s) return true;
      
      const productName = (l.product?.name || '').toLowerCase();
      const category = (l.product?.category || '').toLowerCase();
      const note = (l.note || '').toLowerCase();
      
      return productName.includes(s) || category.includes(s) || note.includes(s);
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
          lots: [] 
        });
      }
      m.get(pid).lots.push(lot);
    }
    
    return Array.from(m.values()).sort((a, b) => {
      const aUrgent = Math.min(...a.lots.map(l => DateHelpers.daysUntil(l.best_before) ?? 999));
      const bUrgent = Math.min(...b.lots.map(l => DateHelpers.daysUntil(l.best_before) ?? 999));
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const totalProducts = byProduct.length;
    let expiredCount = 0;
    let soonCount = 0;
    let totalLots = filtered.length;
    
    for (const lot of filtered) {
      const days = DateHelpers.daysUntil(lot.best_before);
      if (days !== null) {
        if (days < 0) expiredCount++;
        else if (days <= 3) soonCount++;
      }
    }
    
    return { totalProducts, expiredCount, soonCount, totalLots };
  }, [byProduct, filtered]);

  // Debug pour identifier le problème de filtrage
  console.log('Debug - view:', view, 'filtered.length:', filtered?.length, 'lots.length:', lots?.length);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--forest-600)', marginTop: '1rem' }}>
          Chargement des données...
        </p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Titre principal */}
      <h1 style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        🏺 Garde-Manger
      </h1>

      {/* Stats */}
      <PantryStats stats={stats} />

      {/* Barre de contrôles */}
      <div className="toolbar">
        <input 
          className="input" 
          type="search"
          placeholder="🔍 Rechercher un produit..." 
          value={q} 
          onChange={e => setQ(e.target.value)}
          style={{ minWidth: '280px' }}
        />
        
        <select 
          className="input" 
          value={locFilter} 
          onChange={e => setLocFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="Tous">📍 Tous les lieux</option>
          {locations.map(l => (
            <option key={l.id} value={l.name}>{l.name}</option>
          ))}
          {locations.length === 0 && (
            <option disabled>(Aucun lieu)</option>
          )}
        </select>

        <button 
          className="btn secondary" 
          onClick={load}
          title="Rafraîchir les données"
        >
          ↻ Actualiser
        </button>
        
        <button 
          className="btn primary" 
          onClick={() => setShowAddForm(v => !v)}
        >
          {showAddForm ? '✕ Fermer' : '➕ Ajouter'}
        </button>
      </div>

      {/* Sélecteur de vue corrigé */}
      <ViewSelector view={view} setView={setView} />

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <SmartAddForm
            locations={locations}
            onAdd={handleAddLot}
            onClose={() => {
              setShowAddForm(false);
              setSelectedProductForAdd(null);
            }}
            initialProduct={selectedProductForAdd}
          />
        </div>
      )}

      {/* Messages d'erreur */}
      {err && (
        <div className="badge danger" style={{
          display: 'block',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: '0.95rem'
        }}>
          ❌ {err}
        </div>
      )}

      {/* Contenu principal - CORRECTION APPLIQUÉE */}
      {view === 'products' ? (
        <div className="grid cols-3">
          {byProduct.map(({ productId, name, category, unit, lots }) => (
            <ProductCard
              key={productId}
              productId={productId}
              name={name}
              category={category}
              unit={unit}
              lots={lots}
              onOpen={({ productId, name }) => {
                const productLots = lots.filter(lot => lot.product?.id === productId);
                setDetailProduct({ productId, name, lots: productLots });
              }}
              onQuickAction={(action, data) => {
                if (action === 'add') {
                  setSelectedProductForAdd(data);
                  setShowAddForm(true);
                }
              }}
            />
          ))}
          
          {byProduct.length === 0 && (
            <div className="empty-state">
              {q || locFilter !== 'Tous' ? 
                '🔍 Aucun produit ne correspond aux filtres.' :
                '📦 Aucun produit dans le garde-manger. Commencez par ajouter des lots !'
              }
            </div>
          )}
        </div>
      ) : (
        // CORRECTION: Passage des données filtrées à LotsView
        <LotsView
          lots={filtered}
          onDeleteLot={handleDeleteLot}
          onUpdateLot={handleUpdateLot}
        />
      )}

      {/* Modal de détail produit */}
      {detailProduct && (
        <div 
          style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={(e) => e.target === e.currentTarget && setDetailProduct(null)}
        >
          <div className="glass-card-prominent" style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--soft-gray)'
            }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  📦 {detailProduct.name}
                </h2>
                <div style={{
                  color: 'var(--forest-600)',
                  marginTop: '0.5rem',
                  fontWeight: 500
                }}>
                  {detailProduct.lots.length} lot{detailProduct.lots.length > 1 ? 's' : ''} • 
                  {detailProduct.lots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0).toFixed(1)} unités totales
                </div>
              </div>
              
              <button 
                className="btn danger"
                onClick={() => setDetailProduct(null)}
              >
                ✕ Fermer
              </button>
            </div>
            
            <div className="grid cols-2">
              {detailProduct.lots.map((lot, index) => (
                <EnhancedLotCard
                  key={lot.id}
                  lot={lot}
                  index={index}
                  locations={locations}
                  onUpdate={(updates) => {
                    handleUpdateLot(lot.id, updates);
                    setDetailProduct(prev => ({
                      ...prev,
                      lots: prev.lots.map(l => 
                        l.id === lot.id ? { ...l, ...updates } : l
                      )
                    }));
                  }}
                  onDelete={() => {
                    if (confirm(`Supprimer le lot de ${lot.qty} ${lot.unit} ?`)) {
                      handleDeleteLot(lot.id);
                      setDetailProduct(prev => ({
                        ...prev,
                        lots: prev.lots.filter(l => l.id !== lot.id)
                      }));
                    }
                  }}
                />
              ))}
            </div>
            
            {detailProduct.lots.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--medium-gray)',
                fontSize: '1.1rem',
                background: 'var(--earth-50)',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--soft-gray)'
              }}>
                📭 Aucun lot pour ce produit
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
