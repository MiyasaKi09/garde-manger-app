'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Leaf, Package, Droplets, Sun } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import PantryStats from './components/PantryStats';
import ProductCard from './components/ProductCard';
import LotsView from './components/LotsView';
import SmartAddForm from './components/SmartAddForm';

import { daysUntil, getExpirationStatus, formatQty } from './components/pantryUtils';

/* ===========================
   Hook données Supabase
   =========================== */
function usePantryData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lots, setLots] = useState([]);
  const [categories, setCategories] = useState([]);
  const supabase = createClientComponentClient();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_priority');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLots([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from('user_food_items')
        .select(`
          *,
          canonical_food:canonical_food_item_id (
            id,
            canonical_name,
            category_id,
            subcategory,
            primary_unit,
            shelf_life_days_pantry,
            shelf_life_days_fridge,
            shelf_life_days_freezer
          ),
          location:location_id ( name, icon )
        `)
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const transformed = (data || []).map(item => {
        const cat = categoriesData?.find(c => c.id === item.canonical_food?.category_id);
        return {
          id: item.id,
          canonical_food_id: item.canonical_food_item_id,
          display_name: item.custom_name || item.canonical_food?.canonical_name || 'Produit',
          category_name: cat?.name || 'Autre',
          category_icon: cat?.icon || '📦',
          category_color: cat?.color_hex || '#808080',
          qty_remaining: item.quantity,
          unit: item.unit || item.canonical_food?.primary_unit || 'unité',
          effective_expiration: item.expiry_date,
          location_name: item.location?.name || 'Non spécifié',
          location_id: item.location_id || null,
          meta: {
            shelf: {
              pantry: item.canonical_food?.shelf_life_days_pantry ?? null,
              fridge: item.canonical_food?.shelf_life_days_fridge ?? null,
              freezer: item.canonical_food?.shelf_life_days_freezer ?? null,
            },
            primary_unit: item.canonical_food?.primary_unit ?? null,
            category_id: item.canonical_food?.category_id ?? null,
          }
        };
      });

      setCategories(categoriesData || []);
      setLots(transformed);
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const addLot = useCallback(async (payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_food_items')
      .insert({
        user_id: user.id,
        canonical_food_item_id: payload.canonical_food_id,
        custom_name: payload.display_name,
        quantity: payload.qty_remaining,
        unit: payload.unit,
        expiry_date: payload.effective_expiration,
        location_id: payload.location_id || null
      })
      .select()
      .single();

    if (!error) await load();
  }, [supabase, load]);

  const updateLot = useCallback(async (id, patch) => {
    const { error } = await supabase
      .from('user_food_items')
      .update({
        quantity: patch.qty_remaining,
        unit: patch.unit,
        expiry_date: patch.effective_expiration,
        custom_name: patch.display_name
      })
      .eq('id', id);
    if (!error) await load();
  }, [supabase, load]);

  const deleteLot = useCallback(async (id) => {
    const { error } = await supabase.from('user_food_items').delete().eq('id', id);
    if (!error) await load();
  }, [supabase, load]);

  return { loading, error, lots, categories, refresh, addLot, updateLot, deleteLot };
}

/* ============================
   Page principale garde-manger
   ============================ */
export default function PantryPage() {
  const { loading, error, lots, categories, refresh, addLot, updateLot, deleteLot } = usePantryData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeProduct, setActiveProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Groupement
  const groupedProducts = useMemo(() => {
    const groups = new Map();
    lots.forEach(lot => {
      const id = lot.canonical_food_id;
      if (!groups.has(id)) {
        groups.set(id, {
          productId: id,
          productName: lot.display_name,
          lots: [],
          totalQuantity: 0,
          unit: lot.unit,
          category: lot.category_name,
          categoryIcon: lot.category_icon,
          categoryColor: lot.category_color,
          nextExpiry: null
        });
      }
      const g = groups.get(id);
      g.lots.push(lot);
      g.totalQuantity += Number(lot.qty_remaining || 0);
      if (lot.effective_expiration && (!g.nextExpiry || new Date(lot.effective_expiration) < new Date(g.nextExpiry))) {
        g.nextExpiry = lot.effective_expiration;
      }
    });
    return Array.from(groups.values());
  }, [lots]);

  // Filtre + tri
  const filteredProducts = useMemo(() => {
    let arr = groupedProducts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(p => p.productName.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (selectedFilter !== 'all') {
      arr = arr.filter(p => {
        const d = daysUntil(p.nextExpiry);
        if (selectedFilter === 'expiring') return d !== null && d <= 7;
        if (selectedFilter === 'fresh') return d === null || d > 7;
        return true;
      });
    }
    return arr.sort((a,b)=>{
      const da = daysUntil(a.nextExpiry), db = daysUntil(b.nextExpiry);
      if (da === null && db === null) return a.productName.localeCompare(b.productName);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [groupedProducts, searchQuery, selectedFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = groupedProducts.length;
    let expiring = 0, fresh = 0;
    groupedProducts.forEach(p => {
      const d = daysUntil(p.nextExpiry);
      if (d !== null && d <= 7) expiring++; else fresh++;
    });
    return { totalProducts: total, expiringCount: expiring, freshCount: fresh };
  }, [groupedProducts]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"><Leaf className="spin" size={32}/></div>
        <p>Chargement du garde-manger...</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* En-tête + stats */}
      <header className="pantry-header glass-card">
        <div className="header-main">
          <div className="title-section">
            <h1><Leaf className="title-icon"/> Mon garde-manger vivant</h1>
            <p>Cultivez l'harmonie entre vos réserves et la nature</p>
          </div>
          <PantryStats
            stats={stats}
            onAll={()=>setSelectedFilter('all')}
            onFresh={()=>setSelectedFilter('fresh')}
            onExpiring={()=>setSelectedFilter('expiring')}
          />
        </div>
        <div className="header-actions">
          <button onClick={refresh} className="btn-organic secondary"><RefreshCw size={16}/> Actualiser</button>
          <button onClick={()=>setShowAddForm(true)} className="btn-organic primary"><Package size={16}/> Ajouter</button>
        </div>
      </header>

      {/* Recherche + filtres */}
      <div className="search-bar glass-card">
        <div className="search-input-wrapper">
          <svg width="0" height="0" style={{position:'absolute'}} aria-hidden />{/* éviter décalage icône SSR */}
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
              <Package size={16}/> Ajouter un premier produit
            </button>
          </div>
        ) : (
          filteredProducts.map(p => (
            <ProductCard key={p.productId} product={p} onOpen={()=>setActiveProduct(p)} />
          ))
        )}
      </div>

      {/* Sheet lots */}
      <LotsView
        product={activeProduct}
        onClose={()=>setActiveProduct(null)}
        onUpdateLot={updateLot}
        onDeleteLot={deleteLot}
        onAddLot={(payload)=>{
          if (!activeProduct) return;
          addLot({
            canonical_food_id: activeProduct.productId,
            display_name: activeProduct.productName,
            category_name: activeProduct.category,
            ...payload
          });
        }}
      />

      {/* Modal ajout intelligent */}
      <SmartAddForm
        open={showAddForm}
        onClose={()=>setShowAddForm(false)}
        // catalogue minimal pour auto-complétion (id, name, unit, category, meta shelf)
        productsCatalog={groupedProducts.map(p=>({
          id: p.productId,
          name: p.productName,
          unit: p.unit,
          category: p.category
        }))}
        categories={categories}
        onCreate={(payload)=>{ addLot(payload); setShowAddForm(false); }}
      />

      {error && <p className="error-text">{error}</p>}
      <style jsx>{styles}</style>
    </div>
  );
}

/* ================
   Styles (JSX CSS)
   ================ */
const styles = `
/* … mêmes styles que la version précédente (identiques) … */
.pantry-container{min-height:100vh;padding:1.5rem;max-width:1200px;margin:0 auto;font-family:'Inter',-apple-system,sans-serif}
.glass-card{background:rgba(255,255,255,.75);backdrop-filter:blur(6px) saturate(110%);-webkit-backdrop-filter:blur(6px) saturate(110%);border:1px solid rgba(0,0,0,.08);box-shadow:0 6px 20px rgba(0,0,0,.12);border-radius:20px;position:relative;overflow:hidden}
.pantry-header{margin-bottom:1.5rem;padding:1.5rem;animation:float-in .6s ease-out}
.header-main{display:flex;justify-content:space-between;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem}
.title-section h1{font-size:1.8rem;font-weight:750;color:var(--forest-700,#2d5a2d);display:flex;align-items:center;gap:.6rem;margin:0 0 .4rem}
.title-icon{animation:sway 3s ease-in-out infinite}
.title-section p{color:var(--earth-600,#8b7a5d);margin:0}
.header-actions{display:flex;gap:.75rem}
.btn-organic{display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.2rem;border:none;border-radius:999px;font-weight:650;font-size:.9rem;cursor:pointer;transition:all .25s cubic-bezier(.4,0,.2,1)}
.btn-organic.primary{background:linear-gradient(135deg,var(--forest-500,#8bb58b),var(--forest-600,#6b9d6b));color:#fff;box-shadow:0 4px 12px rgba(139,181,139,.3)}
.btn-organic.primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(139,181,139,.4)}
.btn-organic.secondary{background:rgba(255,255,255,.85);color:var(--forest-700,#2d5a2d);border:2px solid var(--forest-300,#c8d8c8)}
.search-bar{margin-bottom:1.5rem;padding:1rem;animation:float-in .7s ease-out .05s both}
.search-input-wrapper{position:relative;margin-bottom:.75rem}
.search-input{width:100%;padding:.8rem 1rem;border:2px solid transparent;border-radius:999px;background:rgba(255,255,255,.85);font-size:1rem;transition:all .25s}
.search-input:focus{outline:none;border-color:var(--forest-400,#a8c5a8);background:#fff;box-shadow:0 0 0 3px rgba(168,197,168,.2)}
.filter-pills{display:flex;gap:.6rem;flex-wrap:wrap}
.filter-pill{padding:.45rem 1.1rem;border:2px solid var(--earth-200,#ebe5da);border-radius:999px;background:rgba(255,255,255,.75);color:var(--earth-700,#8b7a5d);font-size:.85rem;font-weight:550;cursor:pointer;transition:all .2s}
.filter-pill.active{background:var(--forest-500,#8bb58b);color:#fff;border-color:var(--forest-500,#8bb58b)}
.products-garden{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;animation:float-in .8s ease-out .1s both}
.empty-state{grid-column:1 / -1;padding:3rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.5rem}
.empty-state h3{color:var(--forest-700,#2d5a2d)}
.loading-container{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;color:var(--forest-600,#4a7c4a)}
.loading-spinner{animation:spin 2s linear infinite}
.error-text{margin-top:1rem;color:#b42318}
@keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
`;
