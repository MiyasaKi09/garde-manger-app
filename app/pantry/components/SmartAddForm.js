// app/pantry/components/SmartAddForm.js - Version corrigée complète
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { estimateProductMeta } from '@/lib/meta';
import { ProductAI, ProductSearch, PantryStyles } from './pantryUtils';

export function SmartAddForm({ locations, onAdd, onClose, initialProduct = null }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('');
  const [dlc, setDlc] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(false);

  // Effet pour pré-remplir avec le produit initial (quand on clique sur +)
  useEffect(() => {
    if (initialProduct) {
      setQuery(initialProduct.name);
      setSelectedProduct({
        id: initialProduct.productId,
        name: initialProduct.name,
        category: initialProduct.category,
        default_unit: initialProduct.unit
      });
      setUnit(initialProduct.unit || 'g');
      
      // Auto-suggestions pour ce produit
      const analysis = ProductAI.analyzeProductName(initialProduct.name);
      const suggestedLocation = ProductAI.findLocationByType(locations, analysis.location);
      if (suggestedLocation) {
        setLocationId(suggestedLocation.id);
      }
      
      // Auto-calcul DLC
      if (analysis.shelfLife) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + analysis.shelfLife);
        setDlc(futureDate.toISOString().slice(0, 10));
      }
    }
  }, [initialProduct, locations]);

  // Recherche de produits
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { data: products, error } = await supabase
          .from('products_catalog')
          .select('id, name, category, default_unit, typical_shelf_life_days, density_g_per_ml, grams_per_unit')
          .limit(20);
          
        if (error) throw error;
        
        const scored = products
          .map(p => ({
            ...p,
            score: ProductSearch.fuzzyScore(query, p.name) + 
                   ProductSearch.fuzzyScore(query, p.category || '') * 0.3
          }))
          .filter(p => p.score > 10)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
          
        setSuggestions(scored);
      } catch (err) {
        console.error('Erreur recherche produits:', err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function selectProduct(product) {
    setSelectedProduct(product);
    setQuery(product.name);
    setUnit(product.default_unit || 'g');
    setSuggestions([]);
    
    // Auto-sélection du lieu avec IA
    const analysis = ProductAI.analyzeProductName(product.name);
    const suggestedLocation = ProductAI.findLocationByType(locations, analysis.location);
    if (suggestedLocation) {
      setLocationId(suggestedLocation.id);
    }
    
    // Auto-calcul de la DLC
    const shelfLifeDays = product.typical_shelf_life_days || analysis.shelfLife;
    if (shelfLifeDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + shelfLifeDays);
      setDlc(futureDate.toISOString().slice(0, 10));
    }
  }

  // Fonction pour créer ou récupérer un produit
  async function getOrCreateProduct(productName) {
    const name = productName.trim();
    
    // 1. Vérifier si le produit existe déjà (recherche case-insensitive)
    const { data: existingProduct, error: searchError } = await supabase
      .from('products_catalog')
      .select('*')
      .ilike('name', name)
      .maybeSingle();
    
    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError;
    }
    
    // 2. Si le produit existe, le retourner
    if (existingProduct) {
      return existingProduct;
    }
    
    // 3. Sinon, créer un nouveau produit
    const analysis = ProductAI.analyzeProductName(name);
    const meta = estimateProductMeta({ name, category: analysis.category });
    
    const productData = {
      name: name,
      category: analysis.category || null,
      default_unit: analysis.unit || 'g',
      typical_shelf_life_days: analysis.shelfLife || 7,
      density_g_per_ml: meta?.density_g_per_ml || 1.0,
      grams_per_unit: meta?.grams_per_unit || null,
      created_at: new Date().toISOString()
    };
    
    const { data: newProduct, error: createError } = await supabase
      .from('products_catalog')
      .insert([productData])
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    return newProduct;
  }

  function getAvailableUnitsForProduct(product) {
    if (!product) return ['g', 'kg', 'ml', 'cl', 'l', 'u'];
    
    const units = ['g', 'kg'];
    
    if (product.density_g_per_ml && product.density_g_per_ml !== 1.0) {
      units.push('ml', 'cl', 'l');
    }
    
    if (product.grams_per_unit) {
      units.push('u');
    }
    
    // Priorité aux liquides
    if (isLiquidProduct(product)) {
      return ['ml', 'cl', 'l', ...units.filter(u => !['ml','cl','l'].includes(u))];
    }
    
    return [...new Set(units)];
  }

  function isLiquidProduct(product) {
    if (!product) return false;
    const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
    return /lait|huile|jus|sauce|sirop|vinaigre|crème.*liquide|bouillon|eau/.test(text);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // 1. Obtenir ou créer le produit
      let product = selectedProduct;
      if (!product) {
        product = await getOrCreateProduct(query);
        setSelectedProduct(product);
        
        // Auto-suggestions après création
        const analysis = ProductAI.analyzeProductName(product.name);
        const suggestedLocation = ProductAI.findLocationByType(locations, analysis.location);
        if (suggestedLocation && !locationId) {
          setLocationId(suggestedLocation.id);
        }
        
        // Auto-calcul DLC
        if (product.typical_shelf_life_days && !dlc) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + product.typical_shelf_life_days);
          setDlc(futureDate.toISOString().slice(0, 10));
        }
      }
      
      // 2. Validation
      if (!qty || Number(qty) <= 0) {
        alert('Veuillez saisir une quantité valide');
        setLoading(false);
        return;
      }
      
      // 3. Créer le lot
      const lot = {
        product_id: product.id,
        location_id: locationId || null,
        qty: Number(qty),
        unit: unit || product.default_unit || 'g',
        dlc: dlc || null,
        note: 'Ajouté via IA avancée',
        entered_at: new Date().toISOString()
      };

      await onAdd(lot, product);
      
      // 4. Reset après ajout réussi
      setQty(1);
      setDlc('');
      setLocationId('');
      setQuery('');
      setSelectedProduct(null);
      
    } catch (err) {
      console.error('Erreur ajout:', err);
      alert('Erreur lors de l\'ajout: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      ...PantryStyles.glassBase, 
      borderRadius:16, 
      padding:24,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
      backdropFilter: 'blur(16px)',
      border: '2px solid rgba(34,197,94,0.3)',
      position: 'relative',
      zIndex: 100
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <h3 style={{margin:0, display:'flex', alignItems:'center', gap:10, fontSize:'1.3rem'}}>
          🛒 Ajouter un produit intelligent
          <span style={{
            fontSize:'0.75rem', 
            background:'linear-gradient(135deg, #10b981, #059669)',
            color:'white',
            padding:'4px 10px', 
            borderRadius:16,
            fontWeight:700,
            textTransform:'uppercase',
            letterSpacing:'0.5px'
          }}>
            IA Avancée
          </span>
        </h3>
        <button 
          onClick={onClose}
          style={{
            background:'linear-gradient(135deg, #ef4444, #dc2626)', 
            color:'white',
            border:'none', 
            fontSize:'1rem', 
            cursor:'pointer',
            padding:'8px 12px', 
            borderRadius:8,
            fontWeight:600
          }}
        >
          ❌ Fermer
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{position:'relative', marginBottom:20}}>
          <input
            placeholder="🔍 Tapez le nom du produit (ex: tomate cœur de bœuf, huile d'olive...)"
            value={query}
            onChange={(e) => {
              const newQuery = e.target.value;
              setQuery(newQuery);
              setSelectedProduct(null);
              
              // Pre-analyse pour suggestions d'unité
              if (newQuery.length > 2) {
                const analysis = ProductAI.analyzeProductName(newQuery);
                setUnit(analysis.unit);
                
                // Suggestion de lieu en temps réel
                const suggestedLocation = ProductAI.findLocationByType(locations, analysis.location);
                if (suggestedLocation && !locationId) {
                  setLocationId(suggestedLocation.id);
                }
              }
            }}
            style={{
              width:'100%', 
              padding:'16px', 
              borderRadius:12, 
              border:'2px solid #d1d5db',
              fontSize:'1.1rem',
              background:'rgba(255,255,255,0.9)'
            }}
            required
          />
          
          {suggestions.length > 0 && (
            <div style={{
              position:'absolute', 
              top:'100%', 
              left:0, 
              right:0, 
              zIndex:10000,
              background:'white', 
              border:'2px solid #d1d5db', 
              borderRadius:16, 
              marginTop:8,
              boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', 
              maxHeight:320, 
              overflowY:'auto'
            }}>
              {suggestions.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  style={{
                    padding:'16px 20px', 
                    cursor:'pointer', 
                    borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display:'flex', 
                    justifyContent:'space-between', 
                    alignItems:'center'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <div>
                    <div style={{fontWeight:700, fontSize:'1.05rem', color:'#1f2937'}}>{product.name}</div>
                    {product.category && (
                      <div style={{fontSize:'0.9rem', color:'#6b7280', marginTop:2}}>
                        📂 {product.category}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize:'0.85rem', 
                    color:'#10b981', 
                    fontWeight:600,
                    background:'rgba(16,185,129,0.1)',
                    padding:'4px 8px',
                    borderRadius:8
                  }}>
                    Score: {Math.round(product.score)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div style={{
            background:'linear-gradient(135deg, #ecfdf5, #d1fae5)', 
            padding:20, 
            borderRadius:16, 
            marginBottom:20,
            border:'3px solid #34d399'
          }}>
            <div style={{
              fontWeight:800, 
              fontSize:'1.2rem', 
              color:'#064e3b',
              marginBottom:8
            }}>
              ✅ {selectedProduct.name}
            </div>
            <div style={{fontSize:'1rem', color:'#047857'}}>
              📂 {selectedProduct.category || 'Sans catégorie'} • 
              📏 {selectedProduct.default_unit || 'g'}
              {selectedProduct.typical_shelf_life_days && 
                ` • 📅 ${selectedProduct.typical_shelf_life_days} jours`}
            </div>
          </div>
        )}

        <div style={{
          display:'grid', 
          gridTemplateColumns:'140px 120px 160px 1fr auto', 
          gap:16, 
          alignItems:'end',
          background:'rgba(255,255,255,0.9)',
          padding:20,
          borderRadius:16,
          border:'2px solid #e5e7eb'
        }}>
          <div>
            <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
              📊 Quantité
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{
                width:'100%', 
                padding:'12px', 
                borderRadius:8, 
                border:'2px solid #d1d5db',
                fontSize:'1.1rem',
                fontWeight:600
              }}
              required
            />
          </div>
          
          <div>
            <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
              📏 Unité
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width:'100%', 
                padding:'12px', 
                borderRadius:8, 
                border:'2px solid #d1d5db',
                fontSize:'1rem',
                fontWeight:600
              }}
            >
              {getAvailableUnitsForProduct(selectedProduct).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
              📅 DLC/DLUO
            </label>
            <input
              type="date"
              value={dlc}
              onChange={(e) => setDlc(e.target.value)}
              style={{
                width:'100%', 
                padding:'12px', 
                borderRadius:8, 
                border:'2px solid #d1d5db',
                fontSize:'1rem'
              }}
              title="Date Limite de Consommation"
            />
          </div>
          
          <div>
            <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
              📍 Lieu de stockage
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{
                width:'100%', 
                padding:'12px', 
                borderRadius:8, 
                border:'2px solid #d1d5db',
                fontSize:'1rem'
              }}
            >
              <option value="">💡 IA suggère automatiquement...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              whiteSpace:'nowrap', 
              minWidth:120,
              padding:'14px 20px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color:'white',
              border:'none',
              borderRadius:12,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight:700,
              fontSize:'1rem',
              boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
            }}
          >
            {loading ? '⏳ Ajout...' : '✅ Ajouter au stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
