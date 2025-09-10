// app/pantry/page.js - Version corrigée complète
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ProductAI, 
  ProductSearch, 
  DateHelpers, 
  PantryStyles 
} from './components/pantryUtils';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard';
import { LotsView } from './components/LotsView';
import { PantryControls } from './components/PantryControls';
import { PantryStats } from './components/PantryStats';

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
      
      setLots(prev => [{
        ...newLot,
        best_before: newLot.dlc || newLot.best_before
      }, ...prev]);
      
      setShowAddForm(false);
      
    } catch (err) {
      console.error('Erreur ajout lot:', err);
      throw err;
    }
  };

  const handleDeleteLot = async (lotId) => {
    try {
      const { error } = await supabase.from('inventory_lots').delete().eq('id', lotId);
      if (error) throw error;
      setLots(prev => prev.filter(l => l.id !== lotId));
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleUpdateLot = async (lotId, updates) => {
    try {
      const { data, error } = await supabase
        .from('inventory_lots')
        .update(updates)
        .eq('id', lotId)
        .select()
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

// Page principale simplifiée
export default function PantryPage() {
  const {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  } = usePantryData();

  // États pour les nouvelles fonctionnalités
  const [selectedProductForAdd, setSelectedProductForAdd] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);

  useEffect(() => { load(); }, [load]);

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

  const handleQuickAction = (action, data) => {
    if (action === 'add') {
      setSelectedProductForAdd(data);
      setShowAddForm(true);
    }
  };

  const handleProductOpen = ({ productId, name }) => {
    // Trouver tous les lots de ce produit
    const productLots = lots.filter(lot => lot.product?.id === productId);
    setDetailProduct({ productId, name, lots: productLots });
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      🔄 Chargement des données...
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* En-tête avec titre */}
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 800, 
        color: '#15803d', 
        margin: '0 0 24px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        🏺 Garde-Manger
      </h1>

      {/* Statistiques */}
      <PantryStats stats={stats} />

      {/* Contrôles */}
      <PantryControls
        q={q} setQ={setQ}
        locFilter={locFilter} setLocFilter={setLocFilter}
        view={view} setView={setView}
        showAddForm={showAddForm} setShowAddForm={setShowAddForm}
        locations={locations}
        onRefresh={load}
      />

      {/* Formulaire d'ajout intelligent */}
      {showAddForm && (
        <div style={{ marginBottom: 20 }}>
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
        <div style={{
          background: '#fee2e2', color: '#991b1b', padding: 16,
          borderRadius: 8, marginBottom: 20, border: '1px solid #fecaca'
        }}>
          ❌ {err}
        </div>
      )}

      {/* Modal de détail produit */}
      {detailProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            maxWidth: 800, width: '100%', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <h2>📦 Détail : {detailProduct.name}</h2>
              <button 
                onClick={() => setDetailProduct(null)}
                style={{background:'#dc2626', color:'white', border:'none', padding:'8px 12px', borderRadius:6, cursor:'pointer'}}
              >
                ❌ Fermer
              </button>
            </div>
            
            <div style={{marginBottom:16}}>
              <strong>Nombre de lots :</strong> {detailProduct.lots.length}
            </div>
            
            <div style={{display:'grid', gap:12}}>
              {detailProduct.lots.map(lot => (
                <div key={lot.id} style={{
                  border:'1px solid #ddd', padding:12, borderRadius:8,
                  display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                  <div>
                    <div><strong>{lot.qty} {lot.unit}</strong></div>
                    <div style={{fontSize:'0.9rem', color:'#666'}}>
                      📍 {lot.location?.name || 'Sans lieu'} • 
                      📅 DLC: {lot.dlc ? new Date(lot.dlc).toLocaleDateString('fr-FR') : 'Non définie'}
                    </div>
                    {lot.note && <div style={{fontSize:'0.8rem', opacity:0.7}}>💬 {lot.note}</div>}
                  </div>
                  
                  <div style={{display:'flex', gap:6}}>
                    <button
                      onClick={() => handleUpdateLot(lot.id, { qty: Math.max(0, Number(lot.qty) + 1) })}
                      style={{padding:'4px 8px', background:'#16a34a', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleUpdateLot(lot.id, { qty: Math.max(0, Number(lot.qty) - 1) })}
                      style={{padding:'4px 8px', background:'#ea580c', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}
                      disabled={Number(lot.qty) <= 0}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce lot ?')) {
                          handleDeleteLot(lot.id);
                          setDetailProduct(prev => ({
                            ...prev,
                            lots: prev.lots.filter(l => l.id !== lot.id)
                          }));
                        }
                      }}
                      style={{padding:'4px 8px', background:'#dc2626', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {detailProduct.lots.length === 0 && (
              <div style={{textAlign:'center', padding:40, color:'#666'}}>
                Aucun lot pour ce produit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {view === 'products' ? (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 16 
          }}>
            {byProduct.map(({ productId, name, category, unit, lots }) => (
              <ProductCard
                key={productId}
                productId={productId}
                name={name}
                category={category}
                unit={unit}
                lots={lots}
                onOpen={handleProductOpen}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
          
          {byProduct.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
              {q || locFilter !== 'Tous' ? 
                '🔍 Aucun produit ne correspond aux filtres.' :
                '📦 Aucun produit dans le garde-manger. Commencez par ajouter des lots !'
              }
            </div>
          )}
        </div>
      ) : (
        <LotsView
          lots={filtered}
          onDeleteLot={handleDeleteLot}
          onUpdateLot={handleUpdateLot}
        />
      )}
    </div>
  );
}
