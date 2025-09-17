'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Leaf, Package, Droplets, Sun } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import PantryStats from './components/PantryStats';
import ProductCard from './components/ProductCard';
import LotsView from './components/LotsView';
import SmartAddForm from './components/SmartAddForm';

import { daysUntil, getExpirationStatus, formatQuantity, groupLotsByProduct } from './components/pantryUtils';

/* ===========================
   Hook données Supabase - Version corrigée pour la vraie DB
   =========================== */
function usePantryData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lots, setLots] = useState([]);
  const [categories, setCategories] = useState([]);
  const supabase = createClientComponentClient();

  const parseNullableNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const sanitizeText = (value) => {
    if (value === null || value === undefined) return null;
    if (value instanceof Date && !Number.isNaN(value.valueOf())) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return value;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Charger les catégories depuis reference_categories
      const { data: categoriesData } = await supabase
        .from('reference_categories')
        .select('*')
        .order('sort_priority');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        setLots([]);
        setLoading(false);
        return;
      }

      // ✅ CORRECTION: Adapter à la vraie structure de DB
      // On utilise inventory_lots qui peut référencer canonical_foods, cultivars ou generic_products
      const { data, error } = await supabase
        .from('inventory_lots')
        .select(`
          *,
          canonical_food:canonical_foods (
            id,
            canonical_name,
            category_id,
            subcategory,
            primary_unit,
            shelf_life_days_pantry,
            shelf_life_days_fridge,
            shelf_life_days_freezer,
            category:reference_categories(name, icon, color_hex)
          ),
          cultivar:cultivars (
            id,
            cultivar_name,
            canonical_food:canonical_foods (
              id,
              canonical_name,
              category_id,
              primary_unit,
              shelf_life_days_pantry,
              shelf_life_days_fridge,
              shelf_life_days_freezer,
              category:reference_categories(name, icon, color_hex)
            )
          ),
          derived_product:derived_products (
            id,
            derived_name,
            cultivar:cultivars (
              id,
              cultivar_name,
              canonical_food:canonical_foods (
                id,
                canonical_name,
                category_id,
                primary_unit,
                shelf_life_days_pantry,
                shelf_life_days_fridge,
                shelf_life_days_freezer,
                category:reference_categories(name, icon, color_hex)
              )
            )
          ),
          generic_product:generic_products (
            id,
            name,
            category_id,
            primary_unit,
            category:reference_categories(name, icon, color_hex)
          ),
          derived_product:derived_products (
            id,
            derived_name,
            cultivar_id,
            expected_shelf_life_days,
            package_unit,
            cultivar:cultivars (
              id,
              cultivar_name,
              canonical_food_id,
              canonical_food:canonical_foods (
                id,
                canonical_name,
                category_id,
                primary_unit,
                shelf_life_days_pantry,
                shelf_life_days_fridge,
                shelf_life_days_freezer,
                category:reference_categories(name, icon, color_hex)
              )
            )
          )
        `)
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      // Transformer les données pour les adapter à l'interface
      const transformed = (data || []).map(item => {
        const canonicalFoodId = item.canonical_food_id
          ?? item.canonical_food?.id
          ?? item.cultivar?.canonical_food?.id
          ?? item.derived_product?.cultivar?.canonical_food?.id
          ?? null;

        const cultivarId = item.cultivar_id
          ?? item.cultivar?.id
          ?? item.derived_product?.cultivar?.id
          ?? null;

        const derivedProductId = item.derived_product_id
          ?? item.derived_product?.id
          ?? null;

        const genericProductId = item.generic_product_id
          ?? item.generic_product?.id
          ?? null;

        let productType = 'unknown';
        let productName = item.display_name || 'Produit inconnu';
        let primaryUnit = item.unit || null;
        let shelfLife = { pantry: null, fridge: null, freezer: null };
        let categoryInfo = null;

        if (item.canonical_food) {
          productType = 'canonical';
          productName = item.canonical_food.canonical_name;
          primaryUnit = item.canonical_food.primary_unit || primaryUnit;
          shelfLife = {
            pantry: item.canonical_food.shelf_life_days_pantry,
            fridge: item.canonical_food.shelf_life_days_fridge,
            freezer: item.canonical_food.shelf_life_days_freezer
          };
          categoryInfo = item.canonical_food.category;
        } else if (item.cultivar) {
          productType = 'cultivar';
          productName = item.cultivar.cultivar_name;
          primaryUnit = item.cultivar.canonical_food?.primary_unit || primaryUnit;
          shelfLife = {
            pantry: item.cultivar.canonical_food?.shelf_life_days_pantry ?? null,
            fridge: item.cultivar.canonical_food?.shelf_life_days_fridge ?? null,
            freezer: item.cultivar.canonical_food?.shelf_life_days_freezer ?? null
          };
          categoryInfo = item.cultivar.canonical_food?.category;
        } else if (item.derived_product) {

          const parentCultivar = item.derived_product.cultivar;
          const canonical = parentCultivar?.canonical_food;
          const canonicalShelf = canonical
            ? {
                pantry: canonical.shelf_life_days_pantry,
                fridge: canonical.shelf_life_days_fridge,
                freezer: canonical.shelf_life_days_freezer
              }
            : { pantry: null, fridge: null, freezer: null };

          const expectedShelf = item.derived_product.expected_shelf_life_days;

          productInfo = {
            id: item.derived_product.id,
            name: item.derived_product.derived_name,
            type: 'derived',
            cultivar_id: parentCultivar?.id,
            canonical_food_id: canonical?.id || parentCultivar?.canonical_food_id || null,
            primary_unit: item.derived_product.package_unit || canonical?.primary_unit || 'unité',
            shelf_life: {
              pantry: expectedShelf ?? canonicalShelf.pantry,
              fridge: expectedShelf ?? canonicalShelf.fridge,
              freezer: expectedShelf ?? canonicalShelf.freezer
            }
          };
          categoryInfo = parentCultivar?.canonical_food?.category || canonical?.category || null;
        } else if (item.generic_product) {
          productInfo = {
            id: item.generic_product.id,
            name: item.generic_product.name,
            type: 'generic',
            primary_unit: item.generic_product.primary_unit

          };
          categoryInfo = item.derived_product.cultivar?.canonical_food?.category;
        } else if (item.generic_product) {
          productType = 'generic';
          productName = item.generic_product.name;
          primaryUnit = item.generic_product.primary_unit || primaryUnit;
          categoryInfo = item.generic_product.category;
        }

        const locationName = item.location?.name ?? item.storage_place ?? 'Non spécifié';

        return {
          id: item.id,

          canonical_food_id: canonicalFoodId,
          cultivar_id: cultivarId,
          generic_product_id: genericProductId,
          derived_product_id: derivedProductId,
          product_type: productType,
          display_name: item.display_name || productName || 'Produit inconnu',

          category_name: categoryInfo?.name || 'Autre',
          category_icon: categoryInfo?.icon || '📦',
          category_color: categoryInfo?.color_hex || '#808080',
          qty_remaining: Number(item.qty_remaining ?? 0),
          unit: item.unit || primaryUnit || 'unité',
          effective_expiration: item.expiration_date,

          location_name: locationName,
          location_id: item.location_id || null,
          storage_place: item.storage_place || null,

          storage_method: item.storage_method || 'pantry',
          notes: item.notes,
          meta: {
            shelf: shelfLife,
            primary_unit: primaryUnit || null,
            product_type: productType
          }
        };
      });

      setCategories(categoriesData || []);
      setLots(transformed);
    } catch (e) {
      console.error('Erreur chargement pantry:', e);
      setError('Impossible de charger les données du garde-manger.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(), [load]);

  // ✅ CORRECTION: Adapter addLot pour la vraie structure
  const addLot = useCallback(async (payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Construire l'objet d'insertion pour inventory_lots
      const insertData = {
        qty_remaining: parseNullableNumber(payload.qty_remaining ?? payload.qty),
        initial_qty: parseNullableNumber(payload.initial_qty ?? payload.qty_remaining ?? payload.qty),
        unit: sanitizeText(payload.unit),
        expiration_date: sanitizeText(payload.effective_expiration ?? payload.expiration_date),
        storage_method: sanitizeText(payload.storage_method) || 'pantry',
        storage_place: sanitizeText(payload.location_name ?? payload.storage_place),
        notes: payload.notes ?? null
      };

      if (!insertData.unit) delete insertData.unit;
      if (!insertData.storage_method) delete insertData.storage_method;
      if (!insertData.storage_place) delete insertData.storage_place;
      if (insertData.notes === undefined) delete insertData.notes;
      if (insertData.initial_qty === null) delete insertData.initial_qty;
      if (insertData.qty_remaining === null) delete insertData.qty_remaining;
      if (insertData.expiration_date === null) delete insertData.expiration_date;

      // Ajouter la référence au produit selon le type
      if (payload.canonical_food_id) {
        insertData.canonical_food_id = payload.canonical_food_id;
      }
      if (payload.cultivar_id) {
        insertData.cultivar_id = payload.cultivar_id;
      }
      if (payload.generic_product_id) {
        insertData.generic_product_id = payload.generic_product_id;
      }
      if (payload.derived_product_id) {
        insertData.derived_product_id = payload.derived_product_id;
      }

      const { error } = await supabase
        .from('inventory_lots')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      await load(); // Recharger les données
    } catch (error) {
      console.error('Erreur ajout lot:', error);
      setError('Erreur lors de l\'ajout du lot');
    }
  }, [supabase, load]);

  const updateLot = useCallback(async (id, patch) => {
    try {
      const updatePayload = {};

      if (patch.qty_remaining !== undefined || patch.qty !== undefined) {
        const qty = parseNullableNumber(patch.qty_remaining ?? patch.qty);
        updatePayload.qty_remaining = qty;
      }

      if (patch.unit !== undefined) {
        const unit = sanitizeText(patch.unit);
        updatePayload.unit = unit;
      }

      if (patch.effective_expiration !== undefined || patch.expiration_date !== undefined) {
        updatePayload.expiration_date = sanitizeText(patch.effective_expiration ?? patch.expiration_date);
      }

      if (patch.location_name !== undefined || patch.storage_place !== undefined) {
        updatePayload.storage_place = sanitizeText(patch.location_name ?? patch.storage_place);
      }

      if (patch.storage_method !== undefined) {
        updatePayload.storage_method = sanitizeText(patch.storage_method);
      }

      if (patch.notes !== undefined) {
        updatePayload.notes = patch.notes ?? null;
      }

      if (patch.initial_qty !== undefined) {
        updatePayload.initial_qty = parseNullableNumber(patch.initial_qty);
      }

      if (patch.opened_on !== undefined) {
        updatePayload.opened_on = sanitizeText(patch.opened_on);
      }

      if (patch.acquired_on !== undefined) {
        updatePayload.acquired_on = sanitizeText(patch.acquired_on);
      }

      if (patch.produced_on !== undefined) {
        updatePayload.produced_on = sanitizeText(patch.produced_on);
      }

      if (Object.keys(updatePayload).length === 0) {
        return;
      }

      const { error } = await supabase
        .from('inventory_lots')

        .update({
          qty_remaining: patch.qty_remaining,
          unit: patch.unit,
          expiration_date: patch.effective_expiration,
          ...(patch.location_name !== undefined ? { storage_place: patch.location_name } : {}),
          display_name: patch.display_name,
          notes: patch.notes
        })

        .eq('id', id);

      if (error) throw error;
      await load();
    } catch (error) {
      console.error('Erreur mise à jour lot:', error);
      setError('Erreur lors de la mise à jour');
    }
  }, [supabase, load]);

  const deleteLot = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await load();
    } catch (error) {
      console.error('Erreur suppression lot:', error);
      setError('Erreur lors de la suppression');
    }
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  // Grouper lots par produit
  const groupedProducts = useMemo(() => {
    return groupLotsByProduct(lots);
  }, [lots]);

  // Produits filtrés selon recherche + filtre
  const filteredProducts = useMemo(() => {
    let arr = [...groupedProducts];
    
    // Filtre recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(p => p.productName.toLowerCase().includes(q));
    }
    
    // Filtre état
    if (selectedFilter !== 'all') {
      arr = arr.filter(p => {
        const d = daysUntil(p.nextExpiry);
        if (selectedFilter === 'expiring') return d !== null && d <= 7;
        if (selectedFilter === 'fresh') return d === null || d > 7;
        return true;
      });
    }
    
    // Tri par urgence
    return arr.sort((a, b) => {
      const da = daysUntil(a.nextExpiry);
      const db = daysUntil(b.nextExpiry);
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
      if (d !== null && d <= 7) expiring++; 
      else fresh++;
    });
    return { totalProducts: total, expiringCount: expiring, freshCount: fresh };
  }, [groupedProducts]);

  // ✅ PROTECTION: Vérifier que tous les composants sont définis
  const componentsReady = useMemo(() => {
    const components = { PantryStats, ProductCard, LotsView, SmartAddForm, Leaf };
    const missing = Object.entries(components)
      .filter(([name, component]) => !component)
      .map(([name]) => name);
    
    if (missing.length > 0) {
      console.error('❌ Composants manquants:', missing);
      return false;
    }
    return true;
  }, []);

  if (!componentsReady) {
    return (
      <div className="pantry-container">
        <div className="error-text">
          Erreur: Certains composants ne sont pas disponibles. Vérifiez la console pour plus de détails.
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Leaf className="spin" size={32}/>
        </div>
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
            <h1>
              <Leaf className="title-icon"/> Mon garde-manger vivant
            </h1>
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
          <button onClick={refresh} className="btn-organic secondary">
            <RefreshCw size={16}/> Actualiser
          </button>
          <button onClick={()=>setShowAddForm(true)} className="btn-organic primary">
            <Package size={16}/> Ajouter
          </button>
        </div>
      </header>

      {/* Recherche + filtres */}
      <div className="search-bar glass-card">
        <div className="search-input-wrapper">
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
            >
              {f.label}
            </button>
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
            <ProductCard 
              key={p.productId} 
              product={p} 
              onOpen={()=>setActiveProduct(p)} 
            />
          ))
        )}
      </div>

      {/* Sheet lots */}
      {activeProduct && (
        <LotsView
          product={activeProduct}
          onClose={()=>setActiveProduct(null)}
          onUpdateLot={updateLot}
          onDeleteLot={deleteLot}
          onAddLot={(payload)=>{
            if (!activeProduct) return;

            const lotPayload = {
              ...payload,
              display_name: activeProduct.productName,
              category_name: activeProduct.category
            };

            switch (activeProduct.productType) {
              case 'canonical':
                lotPayload.canonical_food_id = activeProduct.canonicalId ?? activeProduct.productId;
                break;
              case 'cultivar':
                lotPayload.cultivar_id = activeProduct.cultivarId ?? activeProduct.productId;
                break;
              case 'derived':
                lotPayload.derived_product_id = activeProduct.derivedId ?? activeProduct.productId;
                break;
              case 'generic':
                lotPayload.generic_product_id = activeProduct.genericId ?? activeProduct.productId;
                break;
              default:
                if (activeProduct.canonicalId) {
                  lotPayload.canonical_food_id = activeProduct.canonicalId;
                } else if (activeProduct.cultivarId) {
                  lotPayload.cultivar_id = activeProduct.cultivarId;
                } else if (activeProduct.derivedId) {
                  lotPayload.derived_product_id = activeProduct.derivedId;
                } else if (activeProduct.genericId) {
                  lotPayload.generic_product_id = activeProduct.genericId;
                } else {
                  lotPayload.canonical_food_id = activeProduct.productId;
                }
                break;
            }

            addLot(lotPayload);
          }}
        />
      )}

      {/* Modal ajout intelligent - Version simplifiée */}
      <SmartAddForm
        open={showAddForm}
        onClose={()=>setShowAddForm(false)}
        onLotCreated={() => {
          refresh();
        }}
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
.btn-organic.secondary:hover{background:#fff;transform:translateY(-1px)}
.search-bar{margin-bottom:1.5rem;padding:1rem;animation:float-in .7s ease-out .05s both}
.search-input-wrapper{position:relative;margin-bottom:.75rem}
.search-input{width:100%;padding:.8rem 1rem;border:2px solid transparent;border-radius:999px;background:rgba(255,255,255,.85);font-size:1rem;transition:all .25s}
.search-input:focus{outline:none;border-color:var(--forest-400,#a8c5a8);background:#fff;box-shadow:0 0 0 3px rgba(168,197,168,.2)}
.filter-pills{display:flex;gap:.6rem;flex-wrap:wrap}
.filter-pill{padding:.45rem 1.1rem;border:2px solid var(--earth-200,#ebe5da);border-radius:999px;background:rgba(255,255,255,.75);color:var(--earth-700,#8b7a5d);font-size:.85rem;font-weight:550;cursor:pointer;transition:all .2s}
.filter-pill.active{background:var(--forest-500,#8bb58b);color:#fff;border-color:var(--forest-500,#8bb58b)}
.filter-pill:hover:not(.active){background:rgba(255,255,255,.9);border-color:var(--forest-400,#a8c5a8)}
.products-garden{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;animation:float-in .8s ease-out .1s both}
.empty-state{grid-column:1 / -1;padding:3rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1rem}
.empty-state h3{color:var(--forest-700,#2d5a2d);margin:0;font-size:1.25rem}
.empty-state p{color:var(--earth-600,#8b7a5d);margin:0}
.loading-container{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;color:var(--forest-600,#4a7c4a)}
.loading-spinner{animation:spin 2s linear infinite}
.error-text{margin-top:1rem;color:#dc2626;padding:1rem;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;display:flex;align-items:center;gap:0.5rem}
.error-text::before{content:'⚠️';font-size:1.1em}

/* Animations */
@keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes float-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* Variables CSS pour cohérence */
:root {
  --forest-50: #f8fdf8;
  --forest-100: #f0f9f0;
  --forest-200: #dcf4dc;
  --forest-300: #c8d8c8;
  --forest-400: #a8c5a8;
  --forest-500: #8bb58b;
  --forest-600: #6b9d6b;
  --forest-700: #2d5a2d;
  --forest-800: #1a3a1a;
  --earth-200: #ebe5da;
  --earth-600: #8b7a5d;
  --earth-700: #6d5d42;
}

/* Responsive */
@media (max-width: 768px) {
  .pantry-container { padding: 1rem; }
  .header-main { flex-direction: column; gap: 1rem; }
  .header-actions { width: 100%; justify-content: center; }
  .products-garden { grid-template-columns: 1fr; }
  .filter-pills { justify-content: center; }
}

@media (max-width: 480px) {
  .title-section h1 { font-size: 1.5rem; }
  .btn-organic { padding: 0.6rem 1rem; font-size: 0.8rem; }
  .search-input { padding: 0.7rem; }
  .filter-pill { padding: 0.4rem 1rem; font-size: 0.8rem; }
}
`;
