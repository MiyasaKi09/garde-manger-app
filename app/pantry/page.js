// app/pantry/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/* ----------------- Helpers dates & style ----------------- */
function daysUntil(date) {
  if (!date) return null;
  const today = new Date(); 
  today.setHours(0,0,0,0);
  const d = new Date(date); 
  d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

const glassBase = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px) saturate(120%)',
  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
  color: '#1f281f',
};

/* ----------------- Composants UI ----------------- */
function LifespanBadge({ date }) {
  const d = daysUntil(date);
  if (d === null) return null;

  let status='ok', icon='🌿', label=`${d} j`, color='#16a34a';
  if (d < 0)      { status='expired'; icon='🍂'; label=`Périmé ${Math.abs(d)}j`; color='#dc2626'; }
  else if (d===0) { status='today';   icon='⚡'; label="Aujourd'hui";           color='#ea580c'; }
  else if (d<=3)  { status='urgent';  icon='⏰'; label=`${d}j`;                  color='#ca8a04'; }
  else if (d<=7)  { status='soon';    icon='📅'; label=`${d}j`;                  color='#22c55e'; }

  return (
    <span
      style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 10px', borderRadius:999,
        background:`${color}15`, border:`1px solid ${color}40`, color
      }}
      title={date || ''}
    >
      <span>{icon}</span><span>{label}</span>
    </span>
  );
}

function Stat({ value, label, tone }) {
  const color = tone==='danger' ? '#dc2626' :
                tone==='warning' ? '#ea580c' :
                tone==='muted' ? '#57534e' : '#16a34a';
  return (
    <div style={{ 
      ...glassBase, 
      borderRadius:12, 
      padding:12, 
      textAlign:'center' 
    }}>
      <div style={{ fontSize:'1.6rem', fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:'.9rem', color:'#57534e' }}>{label}</div>
    </div>
  );
}

/* ----------------- Formulaire d'ajout simple ----------------- */
function SimpleAddForm({ locations, onAdd, onClose }) {
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('g');
  const [dlc, setDlc] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    
    setLoading(true);
    try {
      // 1. Créer ou trouver le produit
      let product;
      const { data: existingProduct } = await supabase
        .from('products_catalog')
        .select('id, name, default_unit')
        .ilike('name', productName.trim())
        .single();

      if (existingProduct) {
        product = existingProduct;
      } else {
        // Créer nouveau produit
        const { data: newProduct, error: productError } = await supabase
          .from('products_catalog')
          .insert([{
            name: productName.trim(),
            category: 'Autre',
            default_unit: unit,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (productError) throw productError;
        product = newProduct;
      }

      // 2. Créer le lot
      const lot = {
        product_id: product.id,
        location_id: locationId || null,
        qty: Number(qty),
        unit: unit,
        dlc: dlc || null,
        note: 'Ajouté manuellement',
        entered_at: new Date().toISOString()
      };

      await onAdd(lot, product);
      
      // Reset
      setProductName('');
      setQty(1);
      setUnit('g');
      setDlc('');
      setLocationId('');
      
    } catch (err) {
      console.error('Erreur ajout:', err);
      alert('Erreur lors de l\'ajout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      ...glassBase, 
      borderRadius:16, 
      padding:20,
      marginBottom:16,
      border: '2px solid rgba(34,197,94,0.2)'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h3 style={{margin:0}}>➕ Ajouter un produit</h3>
        <button 
          onClick={onClose}
          style={{
            background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer',
            padding:'6px 10px', borderRadius:6
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display:'grid', 
          gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', 
          gap:12, 
          alignItems:'end'
        }}>
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              Produit
            </label>
            <input
              placeholder="Nom du produit"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'
              }}
              required
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              Quantité
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'
              }}
              required
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              Unité
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'
              }}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="cl">cl</option>
              <option value="l">l</option>
              <option value="u">u</option>
            </select>
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              DLC
            </label>
            <input
              type="date"
              value={dlc}
              onChange={(e) => setDlc(e.target.value)}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'
              }}
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              Lieu
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{
                width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid #ddd'
              }}
            >
              <option value="">Choisir...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div style={{marginTop:16}}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding:'10px 20px',
              background: loading ? '#ccc' : '#2563eb',
              color:'white',
              border:'none',
              borderRadius:8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight:600
            }}
          >
            {loading ? 'Ajout...' : '✅ Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------- Carte de produit ----------------- */
function ProductCard({ productId, name, category, unit, lots=[], onOpen }) {
  const { total, nextDate, locations } = useMemo(()=>{
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      if (lot.location?.name) locSet.add(lot.location.name);
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) nextDate = d;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      nextDate, 
      locations: [...locSet].slice(0, 6)
    };
  }, [lots]);

  const soon = nextDate ? daysUntil(nextDate) : null;

  return (
    <div
      onClick={() => onOpen?.({ productId, name })}
      style={{
        ...glassBase,
        borderRadius:12,
        padding:14,
        display:'grid',
        gap:8,
        cursor:'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.target.style.transform = 'none'}
    >
      <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
        <div>
          <div style={{fontWeight:700, color:'#15803d'}}>{name}</div>
          <div style={{fontSize:'.85rem', color:'#78716c'}}>
            {category ? category[0].toUpperCase() + category.slice(1) : '—'}
          </div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      <div style={{display:'flex', alignItems:'baseline', gap:6}}>
        <span style={{fontSize:'1.6rem', fontWeight:800, color:'#15803d'}}>
          {total}
        </span>
        <span style={{opacity:.7}}>{lots[0]?.unit || unit || 'u'}</span>
      </div>

      {soon !== null && (
        <div style={{fontSize:'.9rem', color:'#57534e'}}>
          ⏰ Plus proche: {soon >= 0 ? `J+${soon}` : `périmé depuis ${Math.abs(soon)}j`}
        </div>
      )}

      {!!locations.length && (
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {locations.map(loc => (
            <span key={loc} style={{ 
              fontSize:'.8rem', padding:'4px 8px', borderRadius:999, 
              background:'rgba(0,0,0,0.04)' 
            }}>
              📍 {loc}
            </span>
          ))}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span style={{fontSize:'.8rem', color:'#78716c'}}>
          {lots.length} lot{lots.length > 1 ? 's' : ''}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen?.({ productId, name }); }}
          style={{
            padding:'4px 8px', fontSize:'0.8rem', 
            background:'#2563eb', color:'white',
            border:'none', borderRadius:4, cursor:'pointer'
          }}
        >
          Gérer →
        </button>
      </div>
    </div>
  );
}

/* ----------------- Page principale ----------------- */
export default function PantryPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [lots, setLots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('Tous');
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
            product:products_catalog ( id, name, category, default_unit ),
            location:locations ( id, name )
          `)
          .order('dlc', { ascending: true, nullsFirst: true })
          .order('entered_at', { ascending: false })
      ]);
      
      if (e1) throw e1;
      if (e2) throw e2;
      
      setLocations(locs || []);
      
      const normalizedLots = (ls || []).map(lot => ({
        ...lot,
        best_before: lot.dlc || lot.best_before
      }));
      
      setLots(normalizedLots);
      
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

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
      const aUrgent = Math.min(...a.lots.map(l => daysUntil(l.best_before) ?? 999));
      const bUrgent = Math.min(...b.lots.map(l => daysUntil(l.best_before) ?? 999));
      
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const expired = filtered.filter(l => daysUntil(l.best_before) < 0).length;
    const urgent = filtered.filter(l => {
      const d = daysUntil(l.best_before);
      return d !== null && d >= 0 && d <= 3;
    }).length;
    const soon = filtered.filter(l => {
      const d = daysUntil(l.best_before);
      return d !== null && d > 3 && d <= 7;
    }).length;
    
    return { total, expired, urgent, soon };
  }, [filtered]);

  async function addLot(lotData, productData) {
    const { data, error } = await supabase
      .from('inventory_lots')
      .insert([lotData])
      .select(`
        id, qty, unit, dlc, note, entered_at, location_id,
        product:products_catalog ( id, name, category, default_unit ),
        location:locations ( id, name )
      `)
      .single();
      
    if (error) throw error;
    
    const newLot = {
      ...data,
      best_before: data.dlc || data.best_before
    };
    
    setLots(prev => [newLot, ...prev]);
    setShowAddForm(false);
  }

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:16}}>
      {/* Header */}
      <section style={{ 
        ...glassBase, 
        borderRadius:16, 
        padding:20, 
        marginBottom:16 
      }}>
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
          <h1 style={{margin:0, display:'flex', alignItems:'center', gap:8}}>
            🏺 Garde-manger
            <span style={{fontSize:'0.6em', opacity:0.6}}>({stats.total} lots)</span>
          </h1>
        </div>

        {/* Stats */}
        <div style={{
          display:'grid', 
          gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', 
          gap:12, 
          marginTop:16
        }}>
          <Stat value={stats.total} label="Lots totaux" />
          <Stat value={stats.expired} label="Périmés" tone="danger" />
          <Stat value={stats.urgent} label="Urgent (≤3j)" tone="warning" />
          <Stat value={stats.soon} label="À surveiller (≤7j)" tone="muted" />
        </div>

        {/* Outils */}
        <div style={{
          display:'flex', gap:10, alignItems:'center', marginTop:16, 
          flexWrap:'wrap', justifyContent:'space-between'
        }}>
          <div style={{display:'flex', gap:10, alignItems:'center', flex:1}}>
            <input 
              placeholder="🔍 Rechercher un produit..." 
              value={q} 
              onChange={e => setQ(e.target.value)}
              style={{
                flex:1, maxWidth:300, padding:'8px 12px', borderRadius:8, 
                border:'1px solid #ddd'
              }}
            />
            
            <select 
              value={locFilter} 
              onChange={e => setLocFilter(e.target.value)}
              style={{minWidth:180, padding:'8px', borderRadius:8, border:'1px solid #ddd'}}
            >
              <option value="Tous">📍 Tous les lieux</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div style={{display:'flex', gap:8}}>
            <button 
              onClick={load}
              disabled={loading}
              style={{
                padding:'8px 16px', borderRadius:8, border:'1px solid #ddd',
                background:'white', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Chargement...' : '↻ Actualiser'}
            </button>
            
            <button 
              onClick={() => setShowAddForm(s => !s)}
              style={{
                padding:'8px 16px', borderRadius:8, border:'none',
                background:'#2563eb', color:'white', cursor:'pointer',
                fontWeight:600
              }}
            >
              {showAddForm ? '✕ Fermer' : '➕ Ajouter'}
            </button>
          </div>
        </div>
      </section>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <SimpleAddForm
          locations={locations}
          onAdd={addLot}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Messages d'erreur */}
      {err && (
        <div style={{ 
          ...glassBase, 
          borderRadius:12, 
          padding:16, 
          borderColor:'#dc2626', 
          color:'#dc2626', 
          marginBottom:16 
        }}>
          ⚠️ {err}
          <button 
            onClick={() => setErr('')}
            style={{
              marginLeft:12, padding:'4px 8px', borderRadius:4,
              border:'1px solid #dc2626', background:'white', cursor:'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div style={{ 
          ...glassBase, 
          borderRadius:12, 
          padding:48, 
          textAlign:'center' 
        }}>
          <div style={{fontSize:'2rem', marginBottom:8}}>⏳</div>
          <div>Chargement de votre garde-manger...</div>
        </div>
      )}

      {/* Contenu principal */}
      {!loading && (
        <>
          {/* Messages informatifs */}
          {stats.urgent > 0 && (
            <div style={{ 
              ...glassBase, 
              borderRadius:12, 
              padding:16,
              marginBottom:16,
              borderLeft:'4px solid #ea580c',
              background:'rgba(255,193,7,0.1)'
            }}>
              ⚠️ <strong>{stats.urgent}</strong> lot{stats.urgent > 1 ? 's' : ''} à consommer rapidement (≤ 3 jours)
            </div>
          )}
          
          {stats.expired > 0 && (
            <div style={{ 
              ...glassBase, 
              borderRadius:12, 
              padding:16,
              marginBottom:16,
              borderLeft:'4px solid #dc2626',
              background:'rgba(220,38,38,0.1)'
            }}>
              🍂 <strong>{stats.expired}</strong> lot{stats.expired > 1 ? 's' : ''} périmé{stats.expired > 1 ? 's' : ''}
            </div>
          )}

          {/* Vue par produits */}
          <section>
            {byProduct.length > 0 ? (
              <div style={{
                display:'grid', 
                gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
                gap:16
              }}>
                {byProduct.map(p => (
                  <ProductCard
                    key={p.productId}
                    productId={p.productId}
                    name={p.name}
                    category={p.category}
                    unit={p.unit}
                    lots={p.lots}
                    onOpen={() => console.log('Ouvrir produit:', p.name)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                ...glassBase, 
                borderRadius:12, 
                padding:48, 
                textAlign:'center' 
              }}>
                <div style={{fontSize:'3rem', marginBottom:16}}>🌾</div>
                <div style={{fontSize:'1.2rem', fontWeight:600, marginBottom:8}}>
                  Aucun produit trouvé
                </div>
                <div style={{color:'#57534e', marginBottom:16}}>
                  {q ? 
                    `Aucun résultat pour "${q}"` : 
                    'Votre garde-manger est vide'
                  }
                </div>
                {!q && (
                  <button 
                    onClick={() => setShowAddForm(true)}
                    style={{
                      padding:'12px 24px', borderRadius:8, border:'none',
                      background:'#2563eb', color:'white', cursor:'pointer',
                      fontWeight:600
                    }}
                  >
                    ➕ Ajouter votre premier produit
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
