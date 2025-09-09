/>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function LotCard({ lot, onIncQty, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const days = daysUntil(lot.best_before);
  const isUrgent = days !== null && days <= 3;
  
  return (
    <div 
      className={`lot-card card ${isUrgent ? 'urgent' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        overflow: 'visible',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'all var(--transition-base)',
      }}
    >
      {/* Badge de fraîcheur */}
      <div style={{ marginBottom: '0.75rem' }}>
        <LifespanIndicator bestBefore={lot.best_before} />
      </div>

      {/* Nom du produit */}
      <h4 style={{ 
        margin: '0 0 0.5rem 0',
        fontSize: '1.1rem',
        color: 'var(--forest-700)',
        fontWeight: '600',
      }}>
        {lot.product?.name || 'Produit inconnu'}
      </h4>

      {/* Quantité */}
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '300',
        color: 'var(--forest-600)',
        marginBottom: '0.5rem',
      }}>
        <span style={{ fontWeight: '600' }}>{Number(lot.qty) || 0}</span>
        {' '}
        <span style={{ fontSize: '1rem', color: 'var(--earth-500)' }}>
          {lot.unit || 'unité'}
        </span>
      </div>

      {/* Date de péremption */}
      {lot.best_before && (
        <div style={{
          fontSize: '0.9rem',
          color: 'var(--earth-600)',
          marginBottom: '0.5rem',
        }}>
          📅 {fmtDate(lot.best_before)}
        </div>
      )}

      {/* Note */}
      {lot.note && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--medium-gray)',
          fontStyle: 'italic',
          marginBottom: '0.75rem',
          padding: '0.5rem',
          background: 'var(--earth-50)',
          borderRadius: 'var(--radius-sm)',
        }}>
          💬 {lot.note}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: 'auto',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--soft-gray)',
      }}>
        <button 
          className="btn small"
          onClick={() => onIncQty(lot, 1)}
          style={{ flex: 1 }}
        >
          <span>➕</span>
        </button>
        <button 
          className="btn small secondary"
          onClick={() => onIncQty(lot, -1)}
          disabled={(Number(lot.qty) || 0) <= 0}
          style={{ flex: 1 }}
        >
          <span>➖</span>
        </button>
        <button 
          className="btn small danger"
          onClick={() => onDelete(lot)}
          title="Supprimer ce lot"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function AddLotForm({ locations, onAdd, onClose }) {
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pièce');
  const [bestBefore, setBestBefore] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !qty) return;
    
    setIsSubmitting(true);
    await onAdd({
      productName: productName.trim(),
      qty: Number(qty),
      unit,
      bestBefore: bestBefore || null,
      location,
      note: note.trim() || null,
    });
    setIsSubmitting(false);
    
    // Reset form
    setProductName('');
    setQty('');
    setUnit('pièce');
    setBestBefore('');
    setNote('');
  };

  return (
    <div className="add-lot-form card" style={{
      background: 'linear-gradient(135deg, var(--forest-50), var(--earth-50))',
      border: '2px solid var(--forest-300)',
      marginBottom: '1.5rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{ margin: 0 }}>🌱 Ajouter un nouveau lot</h3>
        <button 
          className="btn icon"
          onClick={onClose}
          title="Fermer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid cols-2" style={{ marginBottom: '1rem' }}>
          <div>
            <label htmlFor="product">Produit *</label>
            <input
              id="product"
              className="input"
              placeholder="Ex: Tomates cerises"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="qty">Quantité *</label>
              <input
                id="qty"
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="unit">Unité</label>
              <select
                id="unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="pièce">pièce</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="l">L</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid cols-3" style={{ marginBottom: '1rem' }}>
          <div>
            <label htmlFor="bestBefore">Date limite</label>
            <input
              id="bestBefore"
              className="input"
              type="date"
              value={bestBefore}
              onChange={(e) => setBestBefore(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="location">Lieu de stockage</label>
            <select
              id="location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Choisir un lieu...</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="note">Note (optionnel)</label>
            <input
              id="note"
              className="input"
              placeholder="Ex: Bio, local..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="button"
            className="btn secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            type="submit"
            className="btn primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                Ajout...
              </>
            ) : (
              <>
                <span>➕</span>
                Ajouter le lot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PantryPage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [locations, setLocations] = useState([]);
  const [lots, setLots] = useState([]);
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');
  const [showAddForm, setShowAddForm] = useState(false);

  // Charger l'utilisateur
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      // Lieux
      const { data: locs, error: e1 } = await supabase
        .from(P_LOC_TABLE)
        .select('id, name')
        .order('name', { ascending: true });
      if (e1) throw e1;
      setLocations(locs || []);

      // Lots avec jointures
      const { data: ls, error: e2 } = await supabase
        .from('pantry_lots')
        .select(`
          id, product_id, location_id, qty, unit, best_before, note, created_at,
          product:products_catalog ( id, name ),
          location:${P_LOC_TABLE} ( id, name )
        `)
        .order('best_before', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });
      if (e2) throw e2;

      setLots(ls || []);
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Filtrage
  const filtered = useMemo(() => {
    const s = (q || '').toLowerCase().trim();
    return (lots || []).filter(l => {
      const okLoc = locFilter === 'Tous' || l.location?.name === locFilter;
      const okQ = !s || (l.product?.name?.toLowerCase().includes(s) || l.note?.toLowerCase().includes(s));
      return okLoc && okQ;
    });
  }, [lots, q, locFilter]);

  // Regroupement par lieu
  const grouped = useMemo(() => {
    const m = new Map();
    for (const lot of filtered) {
      const key = lot.location?.name || 'Sans lieu';
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(lot);
    }
    // Tri par urgence
    for (const [k, arr] of m) {
      arr.sort((a, b) => {
        const da = daysUntil(a.best_before);
        const db = daysUntil(b.best_before);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
    }
    return m;
  }, [filtered]);

  // Actions
  async function deleteLot(lot) {
    if (!confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) return;
    const { error } = await supabase.from('pantry_lots').delete().eq('id', lot.id);
    if (error) return alert(error.message);
    setLots(prev => prev.filter(x => x.id !== lot.id));
  }

  async function incQty(lot, delta) {
    const newQty = Math.max(0, Number(lot.qty || 0) + delta);
    const { data, error } = await supabase
      .from('pantry_lots')
      .update({ qty: newQty })
      .eq('id', lot.id)
      .select('id, qty')
      .single();
    if (error) return alert(error.message);
    setLots(prev => prev.map(x => x.id === lot.id ? { ...x, qty: data.qty } : x));
  }

  async function addLot(formData) {
    const { productName, qty, unit, bestBefore, location, note } = formData;
    
    // Trouver/créer le produit
    let productId = null;
    const { data: found, error: e1 } = await supabase
      .from('products_catalog')
      .select('id,name')
      .ilike('name', productName)
      .limit(1)
      .maybeSingle();
    
    if (e1 && e1.code !== 'PGRST116') {
      alert(e1.message);
      return;
    }
    
    if (found?.id) {
      productId = found.id;
    } else {
      const { data: created, error: e2 } = await supabase
        .from('products_catalog')
        .insert({ name: productName })
        .select('id')
        .single();
      if (e2) {
        alert(e2.message);
        return;
      }
      productId = created.id;
    }

    // Lieu
    const loc = locations.find(l => l.name === location) || null;
    const locationId = loc?.id ?? null;

    // Créer le lot
    const payload = {
      product_id: productId,
      location_id: locationId,
      qty,
      unit: unit || null,
      best_before: bestBefore,
      note,
    };
    
    const { data: lot, error: e3 } = await supabase
      .from('pantry_lots')
      .insert(payload)
      .select(`
        id, product_id, location_id, qty, unit, best_before, note, created_at,
        product:products_catalog ( id, name ),
        location:${P_LOC_TABLE} ( id, name )
      `)
      .single();
    
    if (e3) {
      alert(e3.message);
      return;
    }

    setLots(prev => [lot, ...prev]);
    setShowAddForm(false);
  }

  // Stats globales
  const stats = useMemo(() => {
    const total = lots.length;
    const expired = lots.filter(l => daysUntil(l.best_before) < 0).length;
    const urgent = lots.filter(l => {
      const d = daysUntil(l.best_before);
      return d !== null && d >= 0 && d <= 3;
    }).length;
    const soon = lots.filter(l => {
      const d = daysUntil(l.best_before);
      return d !== null && d > 3 && d <= 7;
    }).length;
    return { total, expired, urgent, soon };
  }, [lots]);

  return (
    <div className="container">
      {/* En-tête avec stats */}
      <div className="pantry-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>🏺 Garde-Manger</h1>
        
        {/* Stats visuelles */}
        <div className="stats-row" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div className="stat-card card" style={{
            textAlign: 'center',
            padding: '1rem',
            background: 'linear-gradient(135deg, var(--forest-50), var(--forest-100))',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--forest-600)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--forest-700)' }}>
              Lots totaux
            </div>
          </div>
          
          {stats.expired > 0 && (
            <div className="stat-card card urgent" style={{
              textAlign: 'center',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--danger)' }}>
                {stats.expired}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>
                Périmé{stats.expired > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          {stats.urgent > 0 && (
            <div className="stat-card card" style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(243,156,18,0.1), rgba(230,126,34,0.05))',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--autumn-orange)' }}>
                {stats.urgent}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--autumn-orange)' }}>
                Urgent{stats.urgent > 1 ? 's' : ''} (≤3j)
              </div>
            </div>
          )}
          
          {stats.soon > 0 && (
            <div className="stat-card card" style={{
              textAlign: 'center',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(212,165,116,0.1), rgba(160,130,109,0.05))',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--earth-600)' }}>
                {stats.soon}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>
                À surveiller (≤7j)
              </div>
            </div>
          )}
        </div>

        {/* Barre d'outils */}
        <div className="toolbar">
          <div style={{ flex: 1, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="🔍 Rechercher un produit..."
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            
            <select
              className="input"
              value={locFilter}
              onChange={e => setLocFilter(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="Tous">📍 Tous les lieux</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
            
            <button className="btn" onClick={load}>
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>
                ↻
              </span>
              Rafraîchir
            </button>
            
            <button 
              className="btn primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✕ Fermer' : '➕ Ajouter un lot'}
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <AddLotForm
          locations={locations}
          onAdd={addLot}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Erreur */}
      {err && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(231,76,60,0.1), rgba(192,57,43,0.05))',
          border: '2px solid var(--danger)',
          color: 'var(--danger)',
          marginBottom: '1rem',
        }}>
          ⚠️ {err}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Chargement du garde-manger...</p>
        </div>
      )}

      {/* Lots groupés par lieu */}
      {!loading && (
        <div className="lots-container">
          {[...grouped.keys()].map(groupName => (
            <LocationSection
              key={groupName}
              locationName={groupName}
              lots={grouped.get(groupName) || []}
              onIncQty={incQty}
              onDeleteLot={deleteLot}
            />
          ))}
          
          {grouped.size === 0 && (
            <div className="card" style={{
              textAlign: 'center',
              padding: '3rem',
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🌾</span>
              <h3 style={{ color: 'var(--earth-600)' }}>Garde-manger vide</h3>
              <p style={{ color: 'var(--medium-gray)' }}>
                Commencez par ajouter vos premiers lots !
              </p>
              <button 
                className="btn primary"
                onClick={() => setShowAddForm(true)}
                style={{ marginTop: '1rem' }}
              >
                ➕ Ajouter mon premier lot
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const P_LOC_TABLE = 'pantry_locations';

// Helpers visuels améliorés
function fmtDate(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return x.toLocaleDateString('fr-FR', options);
  } catch {
    return d;
  }
}

function daysUntil(d) {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x - today) / 86400000);
}

function LifespanIndicator({ bestBefore }) {
  const days = daysUntil(bestBefore);
  if (days === null) return null;

  let status, icon, label, color;
  
  if (days < 0) {
    status = 'expired';
    icon = '🍂';
    label = `Périmé depuis ${Math.abs(days)}j`;
    color = 'var(--danger)';
  } else if (days === 0) {
    status = 'today';
    icon = '⚡';
    label = "Aujourd'hui";
    color = 'var(--autumn-orange)';
  } else if (days <= 3) {
    status = 'urgent';
    icon = '⏰';
    label = `${days}j restant${days > 1 ? 's' : ''}`;
    color = 'var(--autumn-yellow)';
  } else if (days <= 7) {
    status = 'soon';
    icon = '📅';
    label = `${days} jours`;
    color = 'var(--forest-400)';
  } else {
    status = 'ok';
    icon = '🌿';
    label = `${days} jours`;
    color = 'var(--success)';
  }

  return (
    <div 
      className={`lifespan-badge ${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '500',
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `1px solid ${color}40`,
        color: color,
      }}
    >
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function LocationSection({ locationName, lots, onIncQty, onDeleteLot }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Statistiques du lieu
  const stats = useMemo(() => {
    const expired = lots.filter(l => daysUntil(l.best_before) < 0).length;
    const urgent = lots.filter(l => {
      const d = daysUntil(l.best_before);
      return d !== null && d >= 0 && d <= 3;
    }).length;
    return { expired, urgent, total: lots.length };
  }, [lots]);

  return (
    <section className="location-section card" style={{ marginBottom: '1.5rem' }}>
      <div 
        className="location-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: isExpanded ? '1rem' : 0,
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)',
          transition: 'background var(--transition-base)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📍</span>
            {locationName}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {stats.expired > 0 && (
              <span className="badge danger">
                {stats.expired} périmé{stats.expired > 1 ? 's' : ''}
              </span>
            )}
            {stats.urgent > 0 && (
              <span className="badge warning">
                {stats.urgent} urgent{stats.urgent > 1 ? 's' : ''}
              </span>
            )}
            <span className="badge info">{stats.total} total</span>
          </div>
        </div>
        <button 
          className="btn icon"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          ▼
        </button>
      </div>

      {isExpanded && (
        <div className="location-content">
          {lots.length === 0 ? (
            <div 
              style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--medium-gray)',
                fontStyle: 'italic',
              }}
            >
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🌾</span>
              Aucun lot dans ce lieu
            </div>
          ) : (
            <div className="grid cols-3">
              {lots.map(lot => (
                <LotCard 
                  key={lot.id}
