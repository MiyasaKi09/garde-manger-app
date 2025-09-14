'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { daysUntil } from '@/lib/dates'; // ✅ Import unifié
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

  const handleAddLot = useCallback(async (lotData, product) => {
    try {
      setErr('');
      
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
      
      const enrichedLot = {
        ...newLot,
        best_before: newLot.dlc || newLot.best_before
      };
      
      setLots(prev => [enrichedLot, ...prev]);
      return true;
    } catch (e) {
      console.error('Erreur ajout lot:', e);
      setErr(e.message || 'Erreur lors de l\'ajout');
      return false;
    }
  }, []);

  const handleDeleteLot = useCallback(async (lotId) => {
    try {
      setErr('');
      
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', lotId);
      
      if (error) throw error;
      
      setLots(prev => prev.filter(lot => lot.id !== lotId));
      return true;
    } catch (e) {
      console.error('Erreur suppression lot:', e);
      setErr(e.message || 'Erreur lors de la suppression');
      return false;
    }
  }, []);

  const handleUpdateLot = useCallback(async (lotId, updates) => {
    try {
      setErr('');
      
      const { data: updatedLot, error } = await supabase
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
      
      const enrichedLot = {
        ...updatedLot,
        best_before: updatedLot.dlc || updatedLot.best_before
      };
      
      setLots(prev => prev.map(lot => 
        lot.id === lotId ? enrichedLot : lot
      ));
      return true;
    } catch (e) {
      console.error('Erreur mise à jour lot:', e);
      setErr(e.message || 'Erreur lors de la mise à jour');
      return false;
    }
  }, []);

  return {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  };
}

// Composants UI helpers
function SearchBar({ q, setQ, locFilter, setLocFilter, locations }) {
  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap'
    }}>
      <input
        type="text"
        placeholder="🔍 Rechercher un produit..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{
          flex: '2',
          minWidth: '200px',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--forest-300)',
          fontSize: '1rem'
        }}
      />
      
      <select
        value={locFilter}
        onChange={(e) => setLocFilter(e.target.value)}
        style={{
          flex: '1',
          minWidth: '150px',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--forest-300)',
          fontSize: '1rem'
        }}
      >
        <option value="Tous">📍 Tous les lieux</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.name}>
            📍 {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ViewSelector({ view, setView }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      padding: '0.25rem',
      background: 'var(--forest-100)',
      borderRadius: 'var(--radius-md)',
      width: 'fit-content'
    }}>
      {[
        { key: 'products', icon: '🧺', label: 'Produits' },
        { key: 'lots', icon: '📦', label: 'Lots' },
        { key: 'stats', icon: '📊', label: 'Stats' }
      ].map(({ key, icon, label }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`btn small ${view === key ? 'primary' : 'secondary'}`}
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
          {showAddForm ? '✕ Fermer' : '➕ Ajouter'}
        </button>
      </div>

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

      {/* Contenu principal */}
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
      ) : view === 'lots' ? (
        <LotsView 
          lots={filtered} 
          onDeleteLot={handleDeleteLot}
          onUpdateLot={handleUpdateLot}
        />
      ) : (
        <PantryStats lots={filtered} />
      )}

      {/* Modal de détails produit */}
      {detailProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailProduct(null);
            }
          }}
        >
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid var(--forest-200)'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0,
                  color: 'var(--forest-800)',
                  fontFamily: "'Crimson Text', Georgia, serif"
                }}>
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
                onClick={() => setDetailProduct(null)}
                style={{
                  background: 'var(--forest-100)',
                  border: '2px solid var(--forest-300)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: 'var(--forest-700)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.target.style.background = 'var(--forest-200)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'var(--forest-100)';
                  e.target.style.transform = 'scale(1)';
                }}
                title="Fermer"
              >
                ✕
              </button>
            </div>
            
            {/* Contenu du modal */}
            <div className="grid cols-2" style={{ gap: '1.5rem' }}>
              {detailProduct.lots.map(lot => (
                <EnhancedLotCard
                  key={lot.id}
                  lot={lot}
                  locations={locations}
                  onDelete={() => {
                    handleDeleteLot(lot.id);
                    setDetailProduct(null);
                  }}
                  onUpdate={(updates) => handleUpdateLot(lot.id, updates)}
                />
              ))}
              
              {detailProduct.lots.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--forest-600)',
                  border: '2px dashed var(--forest-300)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--forest-50)'
                }}>
                  📦 Aucun lot pour ce produit
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
