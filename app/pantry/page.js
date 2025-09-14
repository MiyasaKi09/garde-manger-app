// ================================================================
// 4. app/pantry/page.js - VERSION NETTOYÉE
// ================================================================

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

  // ... reste des méthodes handleAddLot, handleDeleteLot, handleUpdateLot identiques ...

  return {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  };
}

// Composants UI helpers (gardent la même structure)
function SearchBar({ q, setQ, locFilter, setLocFilter, locations }) {
  // ... code identique ...
}

function ViewSelector({ view, setView }) {
  // ... code identique ...
}

function Header() {
  // ... code identique ...
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

  if (loading) return <div>Chargement...</div>;

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
        >
          {showAddForm ? '✕ Fermer' : '➕ Ajouter'}
        </button>
      </div>

      <ViewSelector view={view} setView={setView} />

      {/* Reste du JSX identique... */}
      
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

      {err && (
        <div className="badge danger" style={{
          display: 'block',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          ❌ {err}
        </div>
      )}

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
        <div className="modal-backdrop" onClick={() => setDetailProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2>{detailProduct.name}</h2>
              <button 
                onClick={() => setDetailProduct(null)}
                className="btn secondary small"
              >
                ✕
              </button>
            </div>
            
            <div className="grid cols-2" style={{ gap: '1rem' }}>
              {detailProduct.lots.map(lot => (
                <EnhancedLotCard
                  key={lot.id}
                  lot={lot}
                  onDelete={() => {
                    handleDeleteLot(lot.id);
                    setDetailProduct(null);
                  }}
                  onUpdate={(updates) => handleUpdateLot(lot.id, updates)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
