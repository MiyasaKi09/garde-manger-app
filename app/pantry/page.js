// app/pantry/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { estimateProductMeta } from '@/lib/meta';
import { convertWithMeta } from '@/lib/units';
import { SmartProductCreationModal } from '@/components/SmartProductCreation';

/* ----------------- Helpers dates & style ----------------- */
function daysUntil(date) {
  if (!date) return null;
  const today = new Date(); 
  today.setHours(0,0,0,0);
  const d = new Date(date); 
  d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  } catch { 
    return d; 
  }
}

const glassBase = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px) saturate(120%)',
  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
  color: 'var(--ink, #1f281f)',
};

/* ----------------- Recherche floue de produits ----------------- */
function fuzzyScore(needle, haystack) {
  if (!needle || !haystack) return 0;
  
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  
  if (h === n) return 1000;
  if (h.includes(n)) return 800;
  
  const needleWords = n.split(/\s+/);
  const haystackWords = h.split(/\s+/);
  
  let score = 0;
  let matchedWords = 0;
  
  for (const nWord of needleWords) {
    let bestWordScore = 0;
    for (const hWord of haystackWords) {
      if (hWord === nWord) bestWordScore = Math.max(bestWordScore, 100);
      else if (hWord.includes(nWord)) bestWordScore = Math.max(bestWordScore, 80);
      else if (nWord.includes(hWord)) bestWordScore = Math.max(bestWordScore, 60);
      else {
        const dist = levenshteinDistance(nWord, hWord);
        const maxLen = Math.max(nWord.length, hWord.length);
        if (dist <= maxLen * 0.3) bestWordScore = Math.max(bestWordScore, 40);
      }
    }
    score += bestWordScore;
    if (bestWordScore > 50) matchedWords++;
  }
  
  if (matchedWords === needleWords.length && needleWords.length > 1) {
    score *= 1.5;
  }
  
  return score;
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

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
      className={`lifespan-badge ${status}`}
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

/* ----------------- Formulaire d'ajout intelligent ----------------- */
function SmartAddForm({ locations, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('');
  const [dlc, setDlc] = useState('');
  const [locationId, setLocationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { data: products, error } = await supabase
          .from('products_catalog')
          .select('id, name, category, default_unit, density_g_per_ml, grams_per_unit')
          .limit(20);
          
        if (error) throw error;
        
        const scored = products
          .map(p => ({
            ...p,
            score: fuzzyScore(query, p.name) + fuzzyScore(query, p.category || '') * 0.3
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
    
    const estimatedDays = estimateDlcDays(product);
    if (estimatedDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + estimatedDays);
      setDlc(futureDate.toISOString().slice(0, 10));
    }
  }

  function estimateDlcDays(product) {
    const category = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    
    if (/frais|laitier|yaourt|crème|lait(?!\s*en\s*poudre)/.test(category + ' ' + name)) return 7;
    if (/viande|poisson|charcuterie/.test(category + ' ' + name)) return 3;
    if (/légume|fruit|herb/.test(category + ' ' + name)) {
      if (/tomate|salade|épinard|basilic/.test(name)) return 3;
      if (/carotte|oignon|pomme(?!\s*de\s*terre)|orange/.test(name)) return 14;
      return 7;
    }
    if (/conserve|sauce|huile|vinaigre/.test(category + ' ' + name)) return 365;
    if (/farine|sucre|sel|épice/.test(category + ' ' + name)) return 365;
    if (/pâtes|riz|quinoa|légumineuse/.test(category + ' ' + name)) return 365;
    if (/oeuf|œuf/.test(name)) return 28;
    return 7;
  }

  async function handleCreateProduct(productData) {
    try {
      const { data: newProduct, error: productError } = await supabase
        .from('products_catalog')
        .insert([productData])
        .select()
        .single();
        
      if (productError) throw productError;
      
      setSelectedProduct(newProduct);
      setQuery(newProduct.name);
      setUnit(newProduct.default_unit || 'g');
      setSuggestions([]);
      setShowCreateModal(false);
      
      if (newProduct.typical_shelf_life_days) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + newProduct.typical_shelf_life_days);
        setDlc(futureDate.toISOString().slice(0, 10));
      }
      
      alert(`Produit "${newProduct.name}" créé avec succès !`);
    } catch (err) {
      console.error('Erreur création produit:', err);
      alert('Erreur lors de la création: ' + err.message);
    }
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
    
    if (isLiquidProduct(product)) {
      return ['ml', 'cl', 'l', ...units.filter(u => !['ml','cl','l'].includes(u))];
    }
    
    return [...new Set(units)];
  }

  function isLiquidProduct(product) {
    if (!product) return false;
    const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
    return /lait|huile|jus|sauce|sirop|vinaigre|crème.*liquide|bouillon/.test(text);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      let product = selectedProduct;
      
      if (!product) {
        setShowCreateModal(true);
        setLoading(false);
        return;
      }
      
      if (!qty || Number(qty) <= 0) {
        alert('Veuillez saisir une quantité valide');
        setLoading(false);
        return;
      }
      
      const lot = {
        product_id: product.id,
        location_id: locationId || null,
        qty: Number(qty),
        unit: unit || product.default_unit || 'g',
        dlc: dlc || null,
        note: 'Ajouté via recherche intelligente',
        entered_at: new Date().toISOString()
      };

      await onAdd(lot, product);
      
      setQty(1);
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
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
      backdropFilter: 'blur(12px)',
      border: '2px solid rgba(34,197,94,0.2)'
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <h3 style={{margin:0, display:'flex', alignItems:'center', gap:8}}>
          🛒 Ajouter un produit intelligent
          <span style={{
            fontSize:'0.7rem', 
            background:'rgba(34,197,94,0.1)', 
            color:'#16a34a',
            padding:'2px 8px', 
            borderRadius:12,
            fontWeight:600
          }}>
            IA
          </span>
        </h3>
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
        <div style={{position:'relative', marginBottom:16}}>
          <input
            placeholder="🔍 Tapez le nom du produit (ex: tomate coeur de boeuf)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedProduct(null);
            }}
            style={{
              width:'100%', padding:'12px', borderRadius:8, border:'1px solid #ddd',
              fontSize:'1rem'
            }}
            required
          />
          
          {suggestions.length > 0 && (
            <div style={{
              position:'absolute', top:'100%', left:0, right:0, zIndex:10,
              background:'white', border:'1px solid #ddd', borderRadius:12, marginTop:4,
              boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:280, overflowY:'auto'
            }}>
              {suggestions.map(product => (
                <div
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  style={{
                    padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f0f0f0',
                    display:'flex', justifyContent:'space-between', alignItems:'center'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <div>
                    <div style={{fontWeight:600}}>{product.name}</div>
                    {product.category && (
                      <div style={{fontSize:'0.85rem', color:'#666'}}>{product.category}</div>
                    )}
                  </div>
                  <div style={{fontSize:'0.9rem', color:'#999'}}>
                    Score: {Math.round(product.score)}
                  </div>
                </div>
              ))}
              
              <div
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding:'12px 16px', cursor:'pointer', 
                  background:'linear-gradient(135deg, #e8f5e8, #f0f8f0)', 
                  color:'#2563eb', fontWeight:600,
                  borderTop: '2px solid #4ade80',
                  borderLeft: '4px solid #22c55e'
                }}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #dcfce7, #e8f5e8)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #e8f5e8, #f0f8f0)'}
              >
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{fontSize:'1.2rem'}}>✨</span>
                  <div>
                    <div style={{fontWeight:700}}>Créer "{query}" avec métadonnées avancées</div>
                    <div style={{fontSize:'0.8rem', color:'#16a34a', marginTop:2}}>
                      Mode IA : densité, poids unitaire, catégorie automatique
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SmartProductCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateProduct}
          initialName={query}
        />

        {selectedProduct && (
          <div style={{
            background:'linear-gradient(135deg, #e8f5e8, #f0f8f0)', 
            padding:16, borderRadius:12, marginBottom:16,
            border:'2px solid #90ee90'
          }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:700, fontSize:'1.1rem', color:'#2d5016'}}>
                  ✅ {selectedProduct.name}
                </div>
                <div style={{fontSize:'0.9rem', color:'#6b8e23', marginTop:4}}>
                  {selectedProduct.category} • Unité: {selectedProduct.default_unit || 'g'}
                  {selectedProduct.grams_per_unit && ` • ${selectedProduct.grams_per_unit}g/unité`}
                  {selectedProduct.density_g_per_ml !== 1.0 && ` • Densité: ${selectedProduct.density_g_per_ml}`}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setQuery('');
                  setUnit('');
                }}
                style={{
                  padding:'6px 12px', border:'1px solid #ddd', borderRadius:6,
                  background:'white', cursor:'pointer'
                }}
                title="Choisir un autre produit"
              >
                Changer
              </button>
            </div>
          </div>
        )}

        <div style={{
          display:'grid', 
          gridTemplateColumns:'120px 100px 140px 1fr auto', 
          gap:12, 
          alignItems:'end',
          background:'rgba(255,255,255,0.8)',
          padding:16,
          borderRadius:12,
          border:'1px solid #e0e0e0'
        }}>
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
              style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
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
              style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
            >
              {getAvailableUnitsForProduct(selectedProduct).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              DLC/DLUO
            </label>
            <input
              type="date"
              value={dlc}
              onChange={(e) => setDlc(e.target.value)}
              style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
              title="Date Limite de Consommation"
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666', marginBottom:4, display:'block'}}>
              Lieu
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={{width:'100%', padding:'8px', borderRadius:6, border:'1px solid #ddd'}}
            >
              <option value="">Choisir un lieu...</option>
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
              minWidth:100,
              padding:'10px 16px',
              background: loading ? '#ccc' : '#2563eb',
              color:'white',
              border:'none',
              borderRadius:8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight:600
            }}
          >
            {loading ? '⏳ Ajout...' : '✅ Ajouter'}
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
      const aUrgent = Math.min(...
