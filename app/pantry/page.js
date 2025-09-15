'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Calendar,
  RefreshCw,
  Leaf,
  Droplets,
  Sun,
  X,
  Edit3,
  Trash2,
  ChevronRight,
  Check,
  Layers3
} from 'lucide-react';
// import { supabase } from '@/lib/supabaseClient'; // <-- décommente si tu branches Supabase

/* ===========================
   Hook données (à brancher)
   =========================== */
function usePantryData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lots, setLots] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // TODO: Supabase — remplace ce mock par ton fetch réel
      // Ex attendu pour lot:
      // { id, canonical_food_id, display_name, category_name, qty_remaining, unit, effective_expiration, location_name }
      await new Promise((r) => setTimeout(r, 250));
      setLots((prev) => prev.length ? prev : [
        { id: 'l1', canonical_food_id: 'p1', display_name: 'Pâtes Penne', category_name: 'Céréales', qty_remaining: 450, unit: 'g', effective_expiration: null, location_name: 'Placard sec' },
        { id: 'l2', canonical_food_id: 'p2', display_name: 'Carottes', category_name: 'Légumes', qty_remaining: 6, unit: 'pcs', effective_expiration: addDaysISO(3), location_name: 'Bac à légumes' },
        { id: 'l3', canonical_food_id: 'p2', display_name: 'Carottes', category_name: 'Légumes', qty_remaining: 4, unit: 'pcs', effective_expiration: addDaysISO(7), location_name: 'Bac à légumes' },
        { id: 'l4', canonical_food_id: 'p3', display_name: 'Lait demi-écrémé', category_name: 'Produits laitiers', qty_remaining: 0.75, unit: 'L', effective_expiration: addDaysISO(2), location_name: 'Frigo' },
      ]);

      // — Exemple Supabase —
      // const { data, error } = await supabase
      //   .from('inventory_lots_view')
      //   .select('*')
      //   .order('effective_expiration', { ascending: true });
      // if (error) throw error;
      // setLots(data ?? []);
    } catch (e) {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  // Mutations (optimistes) — à remplacer par Supabase
  const addLot = useCallback(async (newLot) => {
    // await supabase.from('products_inventory_lots').insert(newLot);
    setLots((prev) => [ { id: cryptoId(), ...newLot }, ...prev ]);
  }, []);

  const updateLot = useCallback(async (id, patch) => {
    // await supabase.from('products_inventory_lots').update(patch).eq('id', id);
    setLots((prev) => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const deleteLot = useCallback(async (id) => {
    // await supabase.from('products_inventory_lots').delete().eq('id', id);
    setLots((prev) => prev.filter(l => l.id !== id));
  }, []);

  return { loading, error, lots, refresh, addLot, updateLot, deleteLot };
}

/* =============
   Utilitaires
   ============= */
const addDaysISO = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const expiry = new Date(date); expiry.setHours(0,0,0,0);
  return Math.ceil((expiry - today) / 86400000);
};
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR',{ day:'2-digit', month:'short'}) : '';
const cryptoId = () => Math.random().toString(36).slice(2,10);

const getExpirationStatus = (days) => {
  if (days === null) return { emoji: '🌿', label: 'Stable', color: 'var(--earth-600)' };
  if (days < 0) return { emoji: '🍂', label: 'Périmé', color: '#dc2626' };
  if (days === 0) return { emoji: '⏰', label: "Aujourd'hui", color: '#ea580c' };
  if (days <= 3) return { emoji: '🍊', label: `${days}j`, color: 'var(--autumn-orange)' };
  if (days <= 7) return { emoji: '🌾', label: `${days}j`, color: 'var(--mushroom)' };
  return { emoji: '🌱', label: `${days}j`, color: 'var(--forest-500)' };
};

/* ======================
   Composants UI généraux
   ====================== */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal glass-card" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={18}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Sheet({ open, onClose, title, children, footer }) {
  return (
    <div className={`sheet-root ${open ? 'open': ''}`} aria-hidden={!open}>
      <div className="sheet-backdrop" onClick={onClose}/>
      <aside className="sheet-panel glass-card" role="dialog" aria-modal="true">
        <div className="sheet-header">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={18}/></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </aside>
    </div>
  );
}

/* ============================
   Page principale garde-manger
   ============================ */
export default function PantryPage() {
  const { loading, error, lots, refresh, addLot, updateLot, deleteLot } = usePantryData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // États UI
  const [activeProduct, setActiveProduct] = useState(null); // { productId, productName, ... }
  const [showAddForm, setShowAddForm] = useState(false);

  // Groupement produits
  const groupedProducts = useMemo(() => {
    const groups = new Map();
    lots.forEach(lot => {
      const productId = lot.canonical_food_id;
      const productName = lot.display_name;
      if (!groups.has(productId)) {
        groups.set(productId, {
          productId,
          productName,
          lots: [],
          totalQuantity: 0,
          unit: lot.unit,
          category: lot.category_name,
          nextExpiry: null
        });
      }
      const group = groups.get(productId);
      group.lots.push(lot);
      group.totalQuantity += Number(lot.qty_remaining || 0);
      const lotExpiry = lot.effective_expiration;
      if (lotExpiry && (!group.nextExpiry || new Date(lotExpiry) < new Date(group.nextExpiry))) {
        group.nextExpiry = lotExpiry;
      }
    });
    return Array.from(groups.values());
  }, [lots]);

  // Filtrage + tri
  const filteredProducts = useMemo(() => {
    let filtered = groupedProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(p => {
        const d = daysUntil(p.nextExpiry);
        if (selectedFilter === 'expiring') return d !== null && d <= 7;
        if (selectedFilter === 'fresh') return d === null || d > 7;
        return true;
      });
    }
    return filtered.sort((a,b)=>{
      const da = daysUntil(a.nextExpiry), db = daysUntil(b.nextExpiry);
      if (da === null && db === null) return a.productName.localeCompare(b.productName);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [groupedProducts, searchQuery, selectedFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = groupedProducts.length;
    let expiringCount = 0;
    let freshCount = 0;
    groupedProducts.forEach(p => {
      const d = daysUntil(p.nextExpiry);
      if (d !== null && d <= 7) expiringCount++; else freshCount++;
    });
    return { totalProducts, expiringCount, freshCount };
  }, [groupedProducts]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"><Leaf className="spin" size={32}/></div>
        <p>Chargement du garde-manger...</p>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* En-tête */}
      <header className="pantry-header glass-card">
        <div className="header-main">
          <div className="title-section">
            <h1><Leaf className="title-icon"/> Mon garde-manger vivant</h1>
            <p>Cultivez l'harmonie entre vos réserves et la nature</p>
          </div>

          <div className="stats-bubbles">
            <div className="stat-bubble fresh">
              <Sun size={20}/>
              <div className="stat-content">
                <span className="stat-value">{stats.freshCount}</span>
                <span className="stat-label">Frais</span>
              </div>
            </div>
            <div className="stat-bubble warning">
              <Droplets size={20}/>
              <div className="stat-content">
                <span className="stat-value">{stats.expiringCount}</span>
                <span className="stat-label">À consommer</span>
              </div>
            </div>
            <div className="stat-bubble total">
              <Package size={20}/>
              <div className="stat-content">
                <span className="stat-value">{stats.totalProducts}</span>
                <span className="stat-label">Produits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={refresh} className="btn-organic secondary">
            <RefreshCw size={16}/> Actualiser
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-organic primary">
            <Plus size={16}/> Ajouter
          </button>
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="search-bar glass-card">
        <div className="search-input-wrapper">
          <Search size={20}/>
          <input
            type="text"
            placeholder="Rechercher dans le garde-manger..."
            value={searchQuery}
            onChange={(e)=>setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-pills">
          {[
            {key:'all', label:'Tous'},
            {key:'expiring', label:'À consommer'},
            {key:'fresh', label:'Longue conservation'},
          ].map(f=>(
            <button
              key={f.key}
              className={`filter-pill ${selectedFilter===f.key?'active':''}`}
              onClick={()=>setSelectedFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Grille produits */}
      <div className="products-garden">
        {filteredProducts.length === 0 ? (
          <div className="empty-state glass-card">
            <Package size={48} style={{opacity:0.3}}/>
            <h3>Votre garde-manger attend ses premières réserves</h3>
            <p>Commencez à cultiver votre autonomie alimentaire</p>
            <button onClick={()=>setShowAddForm(true)} className="btn-organic primary">
              <Plus size={16}/> Ajouter un premier produit
            </button>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.productId}
              product={product}
              onOpen={()=>setActiveProduct(product)}
            />
          ))
        )}
      </div>

      {/* Panneau de gestion des lots d’un produit */}
      <ProductSheet
        product={activeProduct}
        onClose={()=>setActiveProduct(null)}
        onUpdateLot={updateLot}
        onDeleteLot={deleteLot}
        onAddLot={(payload)=>{
          addLot({
            canonical_food_id: activeProduct.productId,
            display_name: activeProduct.productName,
            category_name: activeProduct.category,
            ...payload
          });
        }}
      />

      {/* Modal ajout lot global */}
      <AddLotModal
        open={showAddForm}
        onClose={()=>setShowAddForm(false)}
        productsCatalog={groupedProducts.map(p=>({ id:p.productId, name:p.productName, unit:p.unit, category:p.category }))}
        onCreate={(payload)=>{
          if (payload.canonical_food_id) {
            addLot(payload);
          } else {
            // TODO: créer d’abord le produit si besoin
            addLot({ ...payload, canonical_food_id: cryptoId() });
          }
          setShowAddForm(false);
        }}
      />

      {error && <p className="error-text">{error}</p>}

      <style jsx>{styles}</style>
    </div>
  );
}

/* =========================
   Carte produit retravaillée
   ========================= */
function ProductCard({ product, onOpen }) {
  const d = daysUntil(product.nextExpiry);
  const status = getExpirationStatus(d);

  return (
    <button className="product-card glass-card" onClick={onOpen} aria-label={`Ouvrir ${product.productName}`}>
      <div className="card-accent"/>
      <div className="card-content">
        <div className="product-row">
          <div className="avatar">
            <span>{status.emoji}</span>
          </div>

          <div className="main">
            <h3 className="product-name">{product.productName}</h3>
            <div className="meta">
              <span className="category-badge">{product.category}</span>
              <span className="dot">•</span>
              <span className="quantity">
                {formatQty(product.totalQuantity)}{product.unit}
              </span>
            </div>

            <FreshnessBar days={d}/>
          </div>

          <ChevronRight className="chev" size={18}/>
        </div>

        {product.nextExpiry && (
          <div className="expiry-info" style={{ color: status.color }}>
            <Calendar size={14}/>
            <span>{formatDate(product.nextExpiry)}</span>
            <span className="expiry-label">{status.label}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function formatQty(q) {
  if (q >= 1000 && Number.isFinite(q)) return (q/1000).toFixed(1).replace('.', ',');
  if ((q+'').includes('.')) return Number(q).toFixed(2).replace(/\.00$/,'').replace('.', ',');
  return q;
}

function FreshnessBar({ days }) {
  let pct = 100;
  if (days === null) pct = 85;
  else if (days <= 0) pct = 8;
  else if (days <= 3) pct = 25 + (days/3)*10;
  else if (days <= 7) pct = 45 + (days-3)*8;
  else pct = 80;

  return (
    <div className="freshness">
      <div className="freshness-track">
        <div className="freshness-fill" style={{ width: `${pct}%` }}/>
      </div>
    </div>
  );
}

/* =============================
   Panneau latéral produit (lots)
   ============================= */
function ProductSheet({ product, onClose, onUpdateLot, onDeleteLot, onAddLot }) {
  const [editLotId, setEditLotId] = useState(null);
  const [form, setForm] = useState({ qty_remaining:'', unit:'', effective_expiration:'', location_name:'' });

  useEffect(()=>{
    setEditLotId(null);
  },[product]);

  if (!product) return null;

  const startEdit = (lot) => {
    setEditLotId(lot.id);
    setForm({
      qty_remaining: lot.qty_remaining,
      unit: lot.unit || '',
      effective_expiration: lot.effective_expiration || '',
      location_name: lot.location_name || ''
    });
  };

  const saveEdit = () => {
    onUpdateLot(editLotId, {
      qty_remaining: Number(form.qty_remaining),
      unit: form.unit || null,
      effective_expiration: form.effective_expiration || null,
      location_name: form.location_name || null,
    });
    setEditLotId(null);
  };

  const cancelEdit = () => setEditLotId(null);

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      title={`${product.productName}`}
      footer={
        <div className="sheet-footer-actions">
          <button className="btn-organic secondary" onClick={onClose}><X size={16}/> Fermer</button>
        </div>
      }
    >
      <div className="sheet-section">
        <div className="sheet-tags">
          <span className="category-badge">{product.category}</span>
          <span className="pill"><Layers3 size={14}/> {product.lots.length} lot(s)</span>
        </div>

        <div className="sheet-total">
          <div>
            <div className="total-label">Quantité totale</div>
            <div className="total-value">{formatQty(product.totalQuantity)}{product.unit}</div>
          </div>
          <button className="btn-organic primary" onClick={()=>onAddLotOpen()}>
            <Plus size={16}/> Ajouter un lot
          </button>
        </div>

        {/* Liste des lots */}
        <ul className="lots-list">
          {product.lots
            .slice()
            .sort((a,b)=>{
              const da = daysUntil(a.effective_expiration);
              const db = daysUntil(b.effective_expiration);
              if (da === null && db === null) return 0;
              if (da === null) return 1;
              if (db === null) return -1;
              return da - db;
            })
            .map((lot)=> {
              const d = daysUntil(lot.effective_expiration);
              const st = getExpirationStatus(d);
              const editing = editLotId === lot.id;
              return (
                <li key={lot.id} className="lot-row">
                  <div className="lot-left">
                    <span className="lot-emoji">{st.emoji}</span>
                    <div className="lot-info">
                      <div className="lot-title">
                        {editing ? (
                          <input
                            className="field sm"
                            type="number"
                            step="0.01"
                            value={form.qty_remaining}
                            onChange={e=>setForm(f=>({...f, qty_remaining:e.target.value}))}
                          />
                        ) : (
                          <strong>{formatQty(lot.qty_remaining)}{lot.unit}</strong>
                        )}
                        <span className="lot-location">
                          {editing ? (
                            <input
                              className="field sm"
                              placeholder="Lieu"
                              value={form.location_name}
                              onChange={e=>setForm(f=>({...f, location_name:e.target.value}))}
                            />
                          ) : (lot.location_name || '—')}
                        </span>
                      </div>
                      <div className="lot-sub">
                        <Calendar size={14}/>
                        {editing ? (
                          <input
                            className="field sm"
                            type="date"
                            value={form.effective_expiration || ''}
                            onChange={e=>setForm(f=>({...f, effective_expiration:e.target.value}))}
                          />
                        ) : (
                          <span className={`lot-date ${st.label==='Périmé'?'danger':''}`}>
                            {lot.effective_expiration ? formatDate(lot.effective_expiration) : 'Sans échéance'}
                          </span>
                        )}
                        {lot.effective_expiration && !editing && (
                          <span className="lot-chip" style={{color:st.color}}>{st.label}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lot-actions">
                    {editing ? (
                      <>
                        <button className="icon-btn success" onClick={saveEdit} aria-label="Enregistrer"><Check size={18}/></button>
                        <button className="icon-btn" onClick={cancelEdit} aria-label="Annuler"><X size={18}/></button>
                      </>
                    ) : (
                      <>
                        <button className="icon-btn" onClick={()=>startEdit(lot)} aria-label="Éditer"><Edit3 size={18}/></button>
                        <button className="icon-btn danger" onClick={()=>onDeleteLot(lot.id)} aria-label="Supprimer"><Trash2 size={18}/></button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>

        {/* Ajout rapide d’un lot pour ce produit */}
        <AddInlineLot
          defaultUnit={product.unit}
          onAdd={(payload)=>{
            onAddLot({
              id: cryptoId(),
              qty_remaining: Number(payload.qty_remaining),
              unit: payload.unit,
              effective_expiration: payload.effective_expiration || null,
              location_name: payload.location_name || null
            });
          }}
        />
      </div>
    </Sheet>
  );

  function onAddLotOpen() {
    // Scroll vers la section d’ajout inline
    const el = document.querySelector('#add-inline-lot');
    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

/* Ajout inline dans le sheet */
function AddInlineLot({ defaultUnit, onAdd }) {
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState(defaultUnit || 'g');
  const [exp, setExp] = useState('');
  const [loc, setLoc] = useState('');

  return (
    <div id="add-inline-lot" className="inline-add">
      <div className="inline-title">Ajouter un lot</div>
      <div className="inline-grid">
        <input className="field" type="number" step="0.01" placeholder="Quantité" value={qty} onChange={e=>setQty(e.target.value)} />
        <input className="field" placeholder="Unité" value={unit} onChange={e=>setUnit(e.target.value)} />
        <input className="field" type="date" value={exp} onChange={e=>setExp(e.target.value)} />
        <input className="field" placeholder="Lieu (Frigo, Placard…)" value={loc} onChange={e=>setLoc(e.target.value)} />
        <button className="btn-organic primary" onClick={()=>{
          if (!qty) return;
          onAdd({ qty_remaining: qty, unit, effective_expiration: exp || null, location_name: loc || null });
          setQty(''); setExp(''); setLoc('');
        }}>
          <Plus size={16}/> Ajouter
        </button>
      </div>
    </div>
  );
}

/* ==========================
   Modal création lot global
   ========================== */
function AddLotModal({ open, onClose, productsCatalog, onCreate }) {
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [exp, setExp] = useState('');
  const [loc, setLoc] = useState('');

  useEffect(()=>{
    if (!open) { setProductId(''); setProductName(''); setQty(''); setUnit('g'); setExp(''); setLoc(''); }
  },[open]);

  const submit = () => {
    if (!qty || !(productId || productName)) return;
    const payload = {
      canonical_food_id: productId || null,
      display_name: productName || (productsCatalog.find(p=>p.id===productId)?.name ?? ''),
      category_name: productsCatalog.find(p=>p.id===productId)?.category ?? null,
      qty_remaining: Number(qty),
      unit,
      effective_expiration: exp || null,
      location_name: loc || null
    };
    onCreate(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un lot">
      <div className="form-grid">
        <label>
          <span className="label">Produit existant</span>
          <select className="field" value={productId} onChange={e=>{ setProductId(e.target.value); if (e.target.value) setProductName(''); }}>
            <option value="">— Choisir —</option>
            {productsCatalog.map(p=>(
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="or">ou</div>
        <label>
          <span className="label">Nouveau produit</span>
          <input className="field" placeholder="Nom du produit" value={productName} onChange={e=>{ setProductName(e.target.value); if (e.target.value) setProductId(''); }} />
        </label>

        <label>
          <span className="label">Quantité</span>
          <input className="field" type="number" step="0.01" value={qty} onChange={e=>setQty(e.target.value)} />
        </label>
        <label>
          <span className="label">Unité</span>
          <input className="field" value={unit} onChange={e=>setUnit(e.target.value)} />
        </label>
        <label>
          <span className="label">Date limite</span>
          <input className="field" type="date" value={exp} onChange={e=>setExp(e.target.value)} />
        </label>
        <label>
          <span className="label">Lieu de stockage</span>
          <input className="field" placeholder="Frigo, Placard…" value={loc} onChange={e=>setLoc(e.target.value)} />
        </label>
      </div>

      <div className="modal-footer">
        <button className="btn-organic secondary" onClick={onClose}><X size={16}/> Annuler</button>
        <button className="btn-organic primary" onClick={submit}><Plus size={16}/> Créer le lot</button>
      </div>
    </Modal>
  );
}

/* ================
   Styles (JSX CSS)
   ================ */
const styles = `
.pantry-container{min-height:100vh;padding:1.5rem;max-width:1200px;margin:0 auto;font-family:'Inter',-apple-system,sans-serif}
.glass-card{background:rgba(255,255,255,.75);backdrop-filter:blur(6px) saturate(110%);-webkit-backdrop-filter:blur(6px) saturate(110%);border:1px solid rgba(0,0,0,.08);box-shadow:0 6px 20px rgba(0,0,0,.12);border-radius:20px;position:relative;overflow:hidden}
.pantry-header{margin-bottom:1.5rem;padding:1.5rem;animation:float-in .6s ease-out}
.header-main{display:flex;justify-content:space-between;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem}
.title-section h1{font-size:1.8rem;font-weight:750;color:var(--forest-700,#2d5a2d);display:flex;align-items:center;gap:.6rem;margin:0 0 .4rem}
.title-icon{animation:sway 3s ease-in-out infinite}
.title-section p{color:var(--earth-600,#8b7a5d);margin:0}
.stats-bubbles{display:flex;gap:1rem}
.stat-bubble{display:flex;align-items:center;gap:.7rem;padding:.8rem 1.2rem;background:rgba(255,255,255,.9);border-radius:999px;border:2px solid;transition:all .25s cubic-bezier(.4,0,.2,1)}
.stat-bubble:hover{transform:translateY(-2px) scale(1.03)}
.stat-bubble.fresh{border-color:var(--forest-300,#c8d8c8);color:var(--forest-600,#4a7c4a)}
.stat-bubble.warning{border-color:var(--mushroom,#d4a574);color:var(--autumn-orange,#e67e22)}
.stat-bubble.total{border-color:var(--earth-300,#ddd4c4);color:var(--earth-700,#8b7a5d)}
.stat-content{display:flex;flex-direction:column}
.stat-value{font-size:1.35rem;font-weight:800;line-height:1}
.stat-label{font-size:.75rem;opacity:.85}
.header-actions{display:flex;gap:.75rem}
.btn-organic{display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.2rem;border:none;border-radius:999px;font-weight:650;font-size:.9rem;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1)}
.btn-organic.primary{background:linear-gradient(135deg,var(--forest-500,#8bb58b),var(--forest-600,#6b9d6b));color:#fff;box-shadow:0 4px 12px rgba(139,181,139,.3)}
.btn-organic.primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(139,181,139,.4)}
.btn-organic.secondary{background:rgba(255,255,255,.85);color:var(--forest-700,#2d5a2d);border:2px solid var(--forest-300,#c8d8c8)}
.btn-organic.secondary:hover{background:#fff;transform:scale(1.03)}
.search-bar{margin-bottom:1.5rem;padding:1rem;animation:float-in .7s ease-out .05s both}
.search-input-wrapper{position:relative;margin-bottom:.75rem}
.search-input-wrapper svg{position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--earth-500,#b8a98e)}
.search-input{width:100%;padding:.8rem 1rem .8rem 2.8rem;border:2px solid transparent;border-radius:999px;background:rgba(255,255,255,.85);font-size:1rem;transition:all .25s}
.search-input:focus{outline:none;border-color:var(--forest-400,#a8c5a8);background:#fff;box-shadow:0 0 0 3px rgba(168,197,168,.2)}
.filter-pills{display:flex;gap:.6rem;flex-wrap:wrap}
.filter-pill{padding:.45rem 1.1rem;border:2px solid var(--earth-200,#ebe5da);border-radius:999px;background:rgba(255,255,255,.75);color:var(--earth-700,#8b7a5d);font-size:.85rem;font-weight:550;cursor:pointer;transition:all .2s}
.filter-pill:hover{background:#fff;transform:scale(1.04)}
.filter-pill.active{background:var(--forest-500,#8bb58b);color:#fff;border-color:var(--forest-500,#8bb58b)}
.products-garden{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;animation:float-in .8s ease-out .1s both}

/* Carte produit raffinée */
.product-card{padding:0;cursor:pointer;border:none;text-align:left}
.product-card .card-accent{height:3px;background:linear-gradient(90deg,var(--forest-400,#a8c5a8) 0%,var(--mushroom,#d4a574) 50%,var(--earth-400,#ccc0aa) 100%);opacity:.7}
.product-card .card-content{padding:1rem}
.product-row{display:flex;align-items:stretch;gap:.9rem}
.avatar{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:radial-gradient(100% 100% at 70% 10%, rgba(255,255,255,.9) 0%, rgba(255,255,255,.6) 100%), linear-gradient(135deg, rgba(168,197,168,.35), rgba(212,165,116,.25));border:1px solid rgba(0,0,0,.06)}
.avatar span{font-size:1.15rem}
.main{flex:1;min-width:0}
.product-name{font-size:1rem;font-weight:700;color:var(--forest-800,#1e3a1e);margin:.1rem 0 .25rem}
.meta{display:flex;align-items:center;gap:.5rem;color:var(--earth-700,#7a6a4f);font-size:.85rem}
.category-badge{padding:.15rem .6rem;background:rgba(168,197,168,.22);color:var(--forest-700,#2d5a2d);border-radius:999px;font-size:.72rem;font-weight:600}
.dot{opacity:.6}
.quantity{font-weight:700}
.chev{opacity:.35;align-self:center}
.freshness{margin-top:.5rem}
.freshness-track{height:8px;border-radius:999px;background:rgba(0,0,0,.06);overflow:hidden}
.freshness-fill{height:100%;background:linear-gradient(90deg,var(--forest-300,#c8e6a8),var(--autumn-orange,#e67e22));opacity:.8;transition:width .35s ease}
.product-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.12)}
.expiry-info{display:flex;align-items:center;gap:.4rem;font-size:.85rem;font-weight:600;margin-top:.65rem}
.expiry-label{margin-left:auto}

/* Sheet (panneau latéral) */
.sheet-root{position:fixed;inset:0;pointer-events:none;z-index:40}
.sheet-root.open{pointer-events:auto}
.sheet-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.2);opacity:0;transition:opacity .25s}
.sheet-root.open .sheet-backdrop{opacity:1}
.sheet-panel{position:absolute;top:0;right:-520px;width:520px;max-width:100vw;height:100%;display:flex;flex-direction:column;transform:translateX(0);transition:right .3s ease}
.sheet-root.open .sheet-panel{right:0}
.sheet-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1rem;border-bottom:1px solid rgba(0,0,0,.06)}
.sheet-body{padding:1rem;overflow:auto}
.sheet-footer{padding:1rem;border-top:1px solid rgba(0,0,0,.06)}
.sheet-section{display:grid;gap:1rem}
.sheet-tags{display:flex;gap:.5rem;align-items:center}
.pill{display:inline-flex;gap:.3rem;align-items:center;padding:.2rem .55rem;border:1px solid rgba(0,0,0,.08);border-radius:999px;font-size:.78rem;color:var(--earth-700,#7a6a4f);background:rgba(255,255,255,.7)}
.sheet-total{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.6);border:1px dashed rgba(0,0,0,.08);border-radius:14px;padding:.8rem 1rem}
.total-label{font-size:.8rem;color:var(--earth-600,#8b7a5d)}
.total-value{font-size:1.2rem;font-weight:800;color:var(--forest-800,#1e3a1e)}
.lots-list{display:grid;gap:.6rem;margin:0;padding:0;list-style:none}
.lot-row{display:flex;align-items:center;justify-content:space-between;padding:.7rem .7rem;border:1px solid rgba(0,0,0,.06);border-radius:12px;background:rgba(255,255,255,.85)}
.lot-left{display:flex;gap:.7rem;align-items:flex-start}
.lot-emoji{font-size:1.1rem}
.lot-info{display:grid;gap:.25rem}
.lot-title{display:flex;gap:.6rem;align-items:center}
.lot-location{font-size:.85rem;color:var(--earth-700,#7a6a4f);opacity:.9}
.lot-sub{display:flex;align-items:center;gap:.45rem;font-size:.85rem;color:var(--earth-700,#7a6a4f)}
.lot-date.danger{color:#dc2626}
.lot-chip{font-weight:700}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;border:1px solid rgba(0,0,0,.06);background:#fff;cursor:pointer}
.icon-btn:hover{transform:translateY(-1px)}
.icon-btn.danger{color:#b42318;border-color:rgba(180,35,24,.2);background:rgba(255,245,245,.9)}
.icon-btn.success{color:#14532d;border-color:rgba(20,83,45,.2);background:rgba(236,253,245,.9)}
.inline-add{margin-top:.5rem;padding:1rem;border:1px dashed rgba(0,0,0,.1);border-radius:14px;background:rgba(255,255,255,.6)}
.inline-title{font-weight:700;margin-bottom:.6rem;color:var(--forest-800,#1e3a1e)}
.inline-grid{display:grid;grid-template-columns:1fr 110px 1fr 1fr auto;gap:.5rem}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);display:grid;place-items:center;padding:1rem;z-index:50}
.modal{width:min(680px,100%);max-height:90vh;display:flex;flex-direction:column}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:1rem 1rem;border-bottom:1px solid rgba(0,0,0,.06)}
.modal-body{padding:1rem;overflow:auto}
.modal-footer{padding:1rem;border-top:1px solid rgba(0,0,0,.06);display:flex;justify-content:flex-end;gap:.5rem}
.form-grid{display:grid;grid-template-columns:1fr 60px 1fr;gap:.8rem;align-items:end}
.label{display:block;font-size:.8rem;color:var(--earth-700,#7a6a4f);margin-bottom:.25rem}
.field{width:100%;padding:.6rem .7rem;border:1.5px solid rgba(0,0,0,.08);border-radius:10px;background:#fff}
.field.sm{padding:.45rem .55rem}
.or{display:grid;place-items:center;color:var(--earth-600,#8b7a5d)}

/* Vide & chargement */
.empty-state{grid-column:1 / -1;padding:3rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.5rem}
.empty-state h3{color:var(--forest-700,#2d5a2d);margin:.2rem 0}
.empty-state p{color:var(--earth-600,#8b7a5d);max-width:420px;margin:0}
.loading-container{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;color:var(--forest-600,#4a7c4a)}
.loading-spinner{animation:spin 2s linear infinite}
.error-text{margin-top:1rem;color:#b42318}

/* Animations */
@keyframes float-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes spin{to{transform:rotate(360deg)}}

/* Responsive */
@media (max-width: 768px){
  .pantry-container{padding:1rem}
  .title-section h1{font-size:1.5rem}
  .header-main{flex-direction:column;gap:1rem}
  .stats-bubbles{width:100%;justify-content:space-between}
  .products-garden{grid-template-columns:1fr}
  .inline-grid{grid-template-columns:1fr 100px 1fr;gap:.5rem}
  .sheet-panel{width:100%}
}
`;

/* ============================
   Remarques d’intégration TODO
   ============================

1) Chargement des lots (Supabase)
---------------------------------
- Remplace le mock de `usePantryData.load()` par ta requête :
  const { data, error } = await supabase
    .from('inventory_lots_view') // ou ta vue/req jointe
    .select('*')
    .order('effective_expiration', { ascending: true });

- Adapte les champs si besoin pour matcher :
  { id, canonical_food_id, display_name, category_name, qty_remaining, unit, effective_expiration, location_name }

2) Création / mise à jour / suppression
---------------------------------------
- addLot(payload) :
  await supabase.from('products_inventory_lots').insert(payload).select().single();

- updateLot(id, patch) :
  await supabase.from('products_inventory_lots').update(patch).eq('id', id);

- deleteLot(id) :
  await supabase.from('products_inventory_lots').delete().eq('id', id);

3) UX
-----
- La carte s’ouvre au clic (sheet) → édition directe de chaque lot + ajout inline.
- Le bouton “Ajouter” ouvre une modal globale pour créer un lot (produit existant OU nouveau).
- Conversion unités/quantités : branche ton util existant si tu veux convertir à la volée.
- Pour l’effet “la carte grossit”, ajoute :focus-visible sur .product-card et renforce transform/box-shadow.

4) Accessibilité
----------------
- Les éléments cliquables sont des <button>, labels, rôles dialog, aria-modal.
- Les transitions restent sobres pour éviter le motion sickness.

Fin du bloc TODO
*/
