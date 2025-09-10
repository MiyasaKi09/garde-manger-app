'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard';
import { LotsView } from './components/LotsView';
import { PantryControls } from './components/PantryControls';
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
  }
};

// Page principale
export default function PantryPage() {
  const {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  } = usePantryData();

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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      🔄 Chargement des données...
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
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

      <PantryStats stats={stats} />

      <PantryControls
        q={q} setQ={setQ}
        locFilter={locFilter} setLocFilter={setLocFilter}
        view={view} setView={setView}
        showAddForm={showAddForm} setShowAddForm={setShowAddForm}
        locations={locations}
        onRefresh={load}
      />

      {/* Sélecteur de vue amélioré */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: 16,
        marginBottom: 20,
        display: 'flex',
        gap: 8,
        border: '1px solid rgba(34, 197, 94, 0.2)',
        backdropFilter: 'blur(12px)'
      }}>
        <button
          onClick={() => setView('products')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: view === 'products' 
              ? 'linear-gradient(135deg, #059669, #10b981)' 
              : 'transparent',
            color: view === 'products' ? 'white' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.95rem'
          }}
        >
          📦 Vue par produits
        </button>
        <button
          onClick={() => setView('lots')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: view === 'lots' 
              ? 'linear-gradient(135deg, #059669, #10b981)' 
              : 'transparent',
            color: view === 'lots' ? 'white' : '#6b7280',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.95rem'
          }}
        >
          📋 Tous les lots
        </button>
      </div>

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

      {err && (
        <div style={{
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: 16,
          borderRadius: 8, 
          marginBottom: 20, 
          border: '1px solid #fecaca'
        }}>
          ❌ {err}
        </div>
      )}

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
            padding: 20
          }}
          onClick={(e) => e.target === e.currentTarget && setDetailProduct(null)}
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 900,
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  margin: 0,
                  color: '#059669'
                }}>
                  📦 {detailProduct.name}
                </h2>
                <div style={{
                  fontSize: '1.1rem',
                  color: '#6b7280',
                  marginTop: 8,
                  fontWeight: 500
                }}>
                  {detailProduct.lots.length} lot{detailProduct.lots.length > 1 ? 's' : ''} • 
                  {detailProduct.lots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0).toFixed(1)} unités totales
                </div>
              </div>
              
              <button 
                onClick={() => setDetailProduct(null)}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  color: 'white',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                ✕ Fermer
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))'
            }}>
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
                padding: 60,
                color: '#9ca3af',
                fontSize: '1.2rem',
                fontWeight: 500,
                background: 'rgba(156, 163, 175, 0.1)',
                borderRadius: 20,
                border: '2px dashed rgba(156, 163, 175, 0.3)'
              }}>
                📭 Aucun lot pour ce produit
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'products' ? (
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
            <div style={{ 
              textAlign: 'center', 
              padding: 60, 
              color: '#6b7280',
              background: 'white',
              borderRadius: 16,
              border: '2px dashed #e5e7eb',
              gridColumn: '1 / -1'
            }}>
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
