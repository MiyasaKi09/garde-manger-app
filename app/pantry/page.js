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
}// app/pantry/page.js - Version corrigée complète
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
// Les imports des composants sont commentés car ils n'existent pas encore
// import { SmartAddForm } from './components/SmartAddForm';
// import { ProductCard } from './components/ProductCard';
// import { LotsView } from './components/LotsView';
// import { PantryControls } from './components/PantryControls';
// import { PantryStats } from './components/PantryStats';

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

// Utilitaires DateHelpers (si pas importés depuis pantryUtils)
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

// Composant pour chaque carte de lot améliorée
function EnhancedLotCard({ lot, index, locations, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQty, setEditQty] = useState(lot.qty);
  const [editDlc, setEditDlc] = useState(lot.dlc || '');
  const [editLocationId, setEditLocationId] = useState(lot.location_id || '');
  const [customIncrement, setCustomIncrement] = useState(1);
  
  const days = DateHelpers.daysUntil(lot.best_before);
  const isUrgent = days !== null && days <= 3;
  
  function handleQuickUpdate(delta) {
    const increment = lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? 10 : 1);
    const newQty = Math.max(0, Number(lot.qty || 0) + (delta * increment));
    onUpdate({ qty: newQty });
  }
  
  function handleSaveEdit() {
    const updates = {
      qty: Number(editQty),
      dlc: editDlc || null,
      location_id: editLocationId || null
    };
    onUpdate(updates);
    setIsEditing(false);
  }
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(15px)',
      border: `2px solid ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)'}`,
      borderRadius: 20,
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `lotCardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-5px) scale(1.02)';
      e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0px) scale(1)';
      e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Barre d'urgence animée */}
      {isUrgent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)',
          backgroundSize: '200% 100%',
          animation: 'gradientWave 2s ease-in-out infinite'
        }} />
      )}
      
      {/* Header du lot */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: 20
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#065f46',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {lot.qty} {lot.unit}
            {isUrgent && <span style={{ animation: 'pulse 2s infinite' }}>⚠️</span>}
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: 4
          }}>
            📍 {lot.location?.name || 'Sans lieu'}
          </div>
          
          <div style={{
            fontSize: '0.95rem',
            color: isUrgent ? '#dc2626' : '#6b7280'
          }}>
            📅 DLC: {lot.dlc ? new Date(lot.dlc).toLocaleDateString('fr-FR') : 'Non définie'}
            {days !== null && (
              <span style={{ 
                marginLeft: 8,
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.8rem',
                fontWeight: 600,
                background: isUrgent ? '#fee2e2' : '#f3f4f6',
                color: isUrgent ? '#dc2626' : '#6b7280'
              }}>
                {days >= 0 ? `J+${days}` : `Périmé depuis ${Math.abs(days)}j`}
              </span>
            )}
          </div>
          
          {lot.note && (
            <div style={{
              fontSize: '0.85rem',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: 8
            }}>
              💬 {lot.note}
            </div>
          )}
        </div>
      </div>
      
      {/* Contrôles de quantité avancés */}
      {!isEditing ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: lot.unit === 'u' ? 'auto 1fr auto' : '1fr 1fr 1fr',
          gap: 12,
          marginBottom: 16
        }}>
          {lot.unit === 'u' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 600 }}>×</span>
              <input
                type="number"
                min="1"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(Number(e.target.value) || 1)}
                style={{
                  width: 50,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              />
            </div>
          )}
          
          <button
            onClick={() => handleQuickUpdate(-1)}
            disabled={Number(lot.qty) <= 0}
            style={{
              padding: '12px',
              background: Number(lot.qty) <= 0 ? 'rgba(156, 163, 175, 0.3)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
              color: Number(lot.qty) <= 0 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: 12,
              cursor: Number(lot.qty) <= 0 ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: Number(lot.qty) <= 0 ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (Number(lot.qty) > 0) {
                e.target.style.transform = 'scale(1.1) rotate(-2deg)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            -{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
          
          <button
            onClick={() => handleQuickUpdate(1)}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1) rotate(2deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            +{lot.unit === 'u' ? customIncrement : (lot.unit === 'g' ? '10g' : '1')}
          </button>
        </div>
      ) : (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: 16,
          borderRadius: 16,
          border: '2px solid rgba(59, 130, 246, 0.3)',
          marginBottom: 16
        }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Quantité
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Date limite
              </label>
              <input
                type="date"
                value={editDlc}
                onChange={(e) => setEditDlc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>
                Lieu
              </label>
              <select
                value={editLocationId}
                onChange={(e) => setEditLocationId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1rem'
                }}
              >
                <option value="">Sans lieu</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end'
      }}>
        {!isEditing ? (
          <>
            <button
              onClick={() => {
                setEditQty(lot.qty);
                setEditDlc(lot.dlc || '');
                setEditLocationId(lot.location_id || '');
                setIsEditing(true);
              }}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              ✏️ Modifier
            </button>
            
            <button
              onClick={onDelete}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              🗑️ Supprimer
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '10px 16px',
                background: 'rgba(156, 163, 175, 0.3)',
                color: '#6b7280',
                border: '2px solid rgba(156, 163, 175, 0.3)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Annuler
            </button>
            
            <button
              onClick={handleSaveEdit}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)'
              }}
            >
              ✅ Sauvegarder
            </button>
          </>
        )}
      </div>
    </div>
  );
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

      {/* Statistiques simplifiées */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white',
          padding: '20px',
          borderRadius: 16,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalProducts}</div>
          <div style={{ opacity: 0.9 }}>Produits</div>
        </div>
        
        <div style={{
          background: stats.expiredCount > 0 ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #6b7280, #9ca3af)',
          color: 'white',
          padding: '20px',
          borderRadius: 16,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.expiredCount}</div>
          <div style={{ opacity: 0.9 }}>Périmés</div>
        </div>
        
        <div style={{
          background: stats.soonCount > 0 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #6b7280, #9ca3af)',
          color: 'white',
          padding: '20px',
          borderRadius: 16,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.soonCount}</div>
          <div style={{ opacity: 0.9 }}>Bientôt périmés</div>
        </div>
      </div>

      {/* Contrôles simplifiés */}
      <div style={{
        background: 'white',
        padding: 20,
        borderRadius: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: 24
      }}>
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: 1,
              minWidth: 250,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: '1rem'
            }}
          />
          
          <select
            value={locFilter}
            onChange={(e) => setLocFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
              minWidth: 150
            }}
          >
            <option value="Tous">Tous les lieux</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            {showAddForm ? '❌ Fermer' : '➕ Ajouter'}
          </button>
          
          <button
            onClick={load}
            style={{
              padding: '12px 16px',
              background: '#f3f4f6',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout simple */}
      {showAddForm && (
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: 24,
          border: '2px solid #059669'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#059669' }}>Ajouter un nouveau lot</h3>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>
            Pour une version complète, ajoutez les composants SmartAddForm, ProductCard, etc.
          </p>
        </div>
      )}

      {/* Messages d'erreur */}
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

      {/* Modal de détail produit améliorée */}
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

      {/* Contenu principal - Vue produits simplifiée */}
      {view === 'products' ? (
        <div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 16 
          }}>
            {byProduct.map(({ productId, name, category, unit, lots }) => {
              const totalQty = lots.reduce((sum, lot) => sum + Number(lot.qty || 0), 0);
              const urgentLots = lots.filter(lot => {
                const days = DateHelpers.daysUntil(lot.best_before);
                return days !== null && days <= 3;
              });
              const isUrgent = urgentLots.length > 0;
              
              return (
                <div 
                  key={productId}
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: isUrgent ? '2px solid #ef4444' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleProductOpen({ productId, name })}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: 12
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#059669'
                    }}>
                      {name}
                    </h3>
                    {isUrgent && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        ⚠️ Urgent
                      </span>
                    )}
                  </div>
                  
                  {category && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: 8
                    }}>
                      🏷️ {category}
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 12
                  }}>
                    📦 {totalQty.toFixed(1)} {unit || ''}
                  </div>
                  
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {lots.length} lot{lots.length > 1 ? 's' : ''}
                    {urgentLots.length > 0 && (
                      <span style={{ color: '#dc2626', marginLeft: 8 }}>
                        • {urgentLots.length} urgent{urgentLots.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {byProduct.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: 60, 
              color: '#6b7280',
              background: 'white',
              borderRadius: 16,
              border: '2px dashed #e5e7eb'
            }}>
              {q || locFilter !== 'Tous' ? 
                '🔍 Aucun produit ne correspond aux filtres.' :
                '📦 Aucun produit dans le garde-manger. Commencez par ajouter des lots !'
              }
            </div>
          )}
        </div>
      ) : (
        // Vue lots simplifiée
        <div style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {filtered.map((lot, index) => (
            <EnhancedLotCard
              key={lot.id}
              lot={lot}
              index={index}
              locations={locations}
              onUpdate={(updates) => handleUpdateLot(lot.id, updates)}
              onDelete={() => {
                if (confirm(`Supprimer le lot de ${lot.qty} ${lot.unit} ?`)) {
                  handleDeleteLot(lot.id);
                }
              }}
            />
          ))}
          
          {filtered.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: 60, 
              color: '#6b7280',
              background: 'white',
              borderRadius: 16,
              border: '2px dashed #e5e7eb',
              gridColumn: '1 / -1'
            }}>
              📭 Aucun lot ne correspond aux filtres.
            </div>
          )}
        </div>
      )}
      
      {/* Styles CSS pour les animations */}
      <style jsx global>{`
        @keyframes lotCardIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes gradientWave {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
