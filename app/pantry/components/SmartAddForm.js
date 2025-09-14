// app/pantry/components/SmartAddForm.js - Version corrigée complète
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { daysUntil, formatDate } from '@/lib/dates'; // ✅ Import unifié
import { ProductAI, PantryStyles } from './pantryUtils';

// Utilitaire de recherche de produits
const ProductSearch = {
  fuzzyScore(query, text) {
    if (!query || !text) return 0;
    
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    
    // Correspondance exacte
    if (t.includes(q)) return 100;
    
    // Score basé sur les mots en commun
    const qWords = q.split(/\s+/);
    const tWords = t.split(/\s+/);
    let score = 0;
    
    for (const qWord of qWords) {
      for (const tWord of tWords) {
        if (tWord.includes(qWord)) {
          score += qWord.length / q.length * 50;
        }
      }
    }
    
    return score;
  }
};

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
      } catch (error) {
        console.error('Erreur recherche produits:', error);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  async function getOrCreateProduct(productName) {
    // 1. Chercher un produit existant
    const { data: existing } = await supabase
      .from('products_catalog')
      .select('*')
      .ilike('name', productName)
      .single();
      
    if (existing) return existing;
    
    // 2. Créer un nouveau produit avec l'IA
    const analysis = ProductAI.analyzeProductName(productName);
    
    const newProduct = {
      name: productName,
      category: analysis.category || 'autre',
      default_unit: analysis.unit || 'g',
      typical_shelf_life_days: analysis.shelfLife || 7,
      created_at: new Date().toISOString()
    };
    
    const { data: created, error } = await supabase
      .from('products_catalog')
      .insert([newProduct])
      .select()
      .single();
      
    if (error) throw error;
    return created;
  }

  function getAvailableUnitsForProduct(product) {
    if (!product) return ['g', 'u'];
    
    const defaultUnit = product.default_unit || 'g';
    const baseUnits = ['g', 'kg', 'u', 'ml', 'cl', 'l'];
    
    // Unités spécifiques selon le type de produit
    const units = [defaultUnit];
    
    if (isLiquidProduct(product)) {
      units.push(...baseUnits.filter(u => ['ml','cl','l'].includes(u)));
    } else {
      units.push(...baseUnits.filter(u => !['ml','cl','l'].includes(u)));
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
      borderRadius: 16, 
      padding: 24,
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
            background:'none', 
            border:'none', 
            fontSize:'1.5rem', 
            cursor:'pointer',
            opacity:0.7,
            transition:'opacity 0.2s'
          }}
          onMouseEnter={e=>e.target.style.opacity=1}
          onMouseLeave={e=>e.target.style.opacity=0.7}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{display:'grid', gap:20}}>
          {/* Recherche de produit */}
          <div>
            <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
              🔍 Nom du produit
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedProduct(null);
              }}
              placeholder="Ex: Tomates cerises, Yaourt nature..."
              style={{
                width:'100%', 
                padding:'12px', 
                borderRadius:8, 
                border:'2px solid #d1d5db',
                fontSize:'1rem'
              }}
              autoFocus={!initialProduct}
            />
            
            {/* Suggestions */}
            {suggestions.length > 0 && !selectedProduct && (
              <div style={{
                marginTop:8, 
                maxHeight:200, 
                overflowY:'auto',
                border:'1px solid #e5e7eb',
                borderRadius:8,
                background:'white'
              }}>
                {suggestions.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setQuery(p.name);
                      setUnit(p.default_unit || 'g');
                      setSuggestions([]);
                      
                      // Auto-suggestions
                      const analysis = ProductAI.analyzeProductName(p.name);
                      const suggestedLocation = ProductAI.findLocationByType(locations, analysis.location);
                      if (suggestedLocation && !locationId) {
                        setLocationId(suggestedLocation.id);
                      }
                      
                      // Auto-DLC
                      if (p.typical_shelf_life_days && !dlc) {
                        const futureDate = new Date();
                        futureDate.setDate(futureDate.getDate() + p.typical_shelf_life_days);
                        setDlc(futureDate.toISOString().slice(0, 10));
                      }
                    }}
                    style={{
                      padding:'12px',
                      cursor:'pointer',
                      borderBottom:'1px solid #f3f4f6',
                      transition:'background 0.15s'
                    }}
                    onMouseEnter={e=>e.target.style.background='#f9fafb'}
                    onMouseLeave={e=>e.target.style.background='white'}
                  >
                    <div style={{fontWeight:600}}>{p.name}</div>
                    <div style={{fontSize:'0.85rem', opacity:0.7}}>{p.category}</div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedProduct && (
              <div style={{
                marginTop:8, 
                padding:12, 
                background:'#ecfdf5', 
                border:'1px solid #10b981',
                borderRadius:8,
                fontSize:'0.9rem'
              }}>
                ✅ Produit sélectionné: <strong>{selectedProduct.name}</strong>
                {selectedProduct.category && ` (${selectedProduct.category})`}
              </div>
            )}
          </div>
          
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div>
              <label style={{fontSize:'1rem', color:'#374151', marginBottom:8, display:'block', fontWeight:600}}>
                🔢 Quantité
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width:'100%', 
                  padding:'12px', 
                  borderRadius:8, 
                  border:'2px solid #d1d5db',
                  fontSize:'1rem'
                }}
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
                  fontSize:'1rem'
                }}
              >
                {getAvailableUnitsForProduct(selectedProduct).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
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
