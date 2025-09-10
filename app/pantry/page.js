{/* Option pour créer un nouveau produit avec modal avancée */}
              <div
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding:'12px 16px', cursor:'pointer', 
                  background:'#e8f5e8', color:'#2563eb', fontWeight:600,
                  borderTop: '2px solid #90ee90'
                }}
                onMouseEnter={(e) => e.target.style.background = '#d4edda'}
                onMouseLeave={(e) => e.target.style.background = '#e8f5e8'}
              >
                ➕// app/pantry/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { estimateProductMeta } from '@/lib/meta';
import { convertWithMeta } from '@/lib/units';

/* ----------------- Helpers dates & style ----------------- */
function daysUntil(date) {
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return d; }
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
  
  // Score exact
  if (h === n) return 1000;
  if (h.includes(n)) return 800;
  
  // Score par mots
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
        // Distance de Levenshtein simplifiée
        const dist = levenshteinDistance(nWord, hWord);
        const maxLen = Math.max(nWord.length, hWord.length);
        if (dist <= maxLen * 0.3) bestWordScore = Math.max(bestWordScore, 40);
      }
    }
    score += bestWordScore;
    if (bestWordScore > 50) matchedWords++;
  }
  
  // Bonus si tous les mots matchent
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

  let status='ok', icon='🌿', label=`${d} j`, color='var(--success)';
  if (d < 0)      { status='expired'; icon='🍂'; label=`Périmé ${Math.abs(d)}j`; color='var(--danger)'; }
  else if (d===0) { status='today';   icon='⚡'; label="Aujourd'hui";           color='var(--autumn-orange)'; }
  else if (d<=3)  { status='urgent';  icon='⏰'; label=`${d}j`;                  color='var(--autumn-yellow)'; }
  else if (d<=7)  { status='soon';    icon='📅'; label=`${d}j`;                  color='var(--forest-500)'; }

  return (
    <span
      className={`lifespan-badge ${status}`}
      style={{
        display:'inline-flex',alignItems:'center',gap:6,
        padding:'4px 10px', borderRadius:999,
        background:`linear-gradient(135deg, ${color}15, ${color}08)`,
        border:`1px solid ${color}40`, color
      }}
      title={date || ''}
    >
      <span>{icon}</span><span>{label}</span>
    </span>
  );
}

function Stat({ value, label, tone }) {
  const color = tone==='danger' ? 'var(--danger)' :
                tone==='warning' ? 'var(--autumn-orange)' :
                tone==='muted' ? 'var(--earth-700)' : 'var(--forest-600)';
  return (
    <div className="glass-card" style={{ ...glassBase, borderRadius:'var(--radius-lg)', padding:'12px', textAlign:'center' }}>
      <div style={{ fontSize:'1.6rem', fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:'.9rem', color:'var(--earth-700)' }}>{label}</div>
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

  // Recherche de produits avec délai
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
        
        // Calcul des scores et tri
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

  // Sélection d'un produit existant
  function selectProduct(product) {
    setSelectedProduct(product);
    setQuery(product.name);
    setUnit(product.default_unit || 'g');
    setSuggestions([]);
    
    // Estimation de la DLC basée sur la catégorie
    const estimatedDays = estimateDlcDays(product);
    if (estimatedDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + estimatedDays);
      setDlc(futureDate.toISOString().slice(0, 10));
    }
  }

  // Estimation des jours de conservation selon la catégorie
  function estimateDlcDays(product) {
    const category = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    
    // Produits frais
    if (/frais|laitier|yaourt|cr[eé]me|lait(?!\s*en\s*poudre)/.test(category + ' ' + name)) return 7;
    if (/viande|poisson|charcuterie/.test(category + ' ' + name)) return 3;
    if (/l[eé]gume|fruit|herb/.test(category + ' ' + name)) {
      if (/tomate|salade|[eé]pinard|basilic/.test(name)) return 3;
      if (/carotte|oignon|pomme(?!\s*de\s*terre)|orange/.test(name)) return 14;
      return 7;
    }
    
    // Produits secs/conserves
    if (/conserve|sauce|huile|vinaigre/.test(category + ' ' + name)) return 365;
    if (/farine|sucre|sel|[eé]pice/.test(category + ' ' + name)) return 365;
    if (/p[aâ]tes|riz|quinoa|l[eé]gumineuse/.test(category + ' ' + name)) return 365;
    
    // Oeufs
    if (/oeuf|œuf/.test(name)) return 28;
    
    // Défaut produits périssables
    return 7;
  }

  // Création d'un nouveau produit avec métadonnées
  async function createNewProduct(name) {
    const meta = estimateProductMeta({ name });
    
    const newProduct = {
      name: name.trim(),
      category: guessCategory(name),
      default_unit: guessDefaultUnit(name, meta),
      density_g_per_ml: meta.density_g_per_ml,
      grams_per_unit: meta.grams_per_unit,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products_catalog')
      .insert([newProduct])
      .select()
      .single();
      
    if (error) throw error;
    return { ...data, ...meta };
  }

  // Deviner la catégorie à partir du nom
  function guessCategory(name) {
    const n = name.toLowerCase();
    
    if (/tomate|concombre|salade|[eé]pinard|carotte|oignon|poivron|courgette|aubergine/.test(n)) return 'légume';
    if (/pomme(?!\s*de\s*terre)|poire|banane|orange|citron|fraise|raisin/.test(n)) return 'fruit';
    if (/lait|yaourt|cr[eé]me|fromage|beurre/.test(n)) return 'laitier';
    if (/poulet|bœuf|porc|agneau|jambon/.test(n)) return 'viande';
    if (/saumon|thon|cabillaud|crevette/.test(n)) return 'poisson';
    if (/huile|vinaigre|moutarde|ketchup/.test(n)) return 'condiment';
    if (/farine|sucre|sel|poivre/.test(n)) return 'épicerie de base';
    if (/p[aâ]tes|riz|quinoa|lentille/.test(n)) return 'féculents';
    if (/pain|baguette|croissant/.test(n)) return 'boulangerie';
    if (/oeuf|œuf/.test(n)) return 'œufs';
    
    return 'autre';
  }

  // Deviner l'unité par défaut
  function guessDefaultUnit(name, meta) {
    const n = name.toLowerCase();
    
    // Liquides
    if (/lait|huile|vinaigre|jus|sirop|sauce/.test(n)) return 'ml';
    
    // Unités naturelles
    if (/oeuf|œuf|citron|orange|pomme(?!\s*de\s*terre)|avocat/.test(n)) return 'u';
    
    // Masses pour le reste
    return 'g';
  }

  // Soumission du formulaire
  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      let product = selectedProduct;
      
      // Si pas de produit sélectionné, ouvrir la modal de création
      if (!product) {
        setShowCreateModal(true);
        return;
      }
      
      // Validation des données
      if (!qty || Number(qty) <= 0) {
        alert('Veuillez saisir une quantité valide');
        return;
      }
      
      // Créer le lot avec les bonnes métadonnées
      const lot = {
        product_id: product.id,
        location_id: locationId || null,
        qty: Number(qty),
        unit: unit || product.default_unit || 'g',
        dlc: dlc || null,
        note: `Ajouté via recherche (${selectedProduct ? 'trouvé' : 'créé'})`,
        entered_at: new Date().toISOString()
      };

      await onAdd(lot, product);
      
      // Reset form mais garde le produit sélectionné pour faciliter l'ajout multiple
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
    <div className="glass-card" style={{ 
      ...glassBase, 
      borderRadius:'var(--radius-xl)', 
      padding:'1.2rem',
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
          className="btn small secondary" 
          onClick={onClose}
          style={{minWidth:'auto', padding:'6px 10px'}}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Recherche de produit */}
        <div style={{position:'relative', marginBottom:16}}>
          <input
            className="input"
            placeholder="🔍 Tapez le nom du produit (ex: tomate coeur de boeuf)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedProduct(null);
            }}
            style={{width:'100%'}}
            required
          />
          
          {/* Suggestions */}
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
              
              {/* Option pour créer un nouveau produit */}
              <div
                onClick={() => setSelectedProduct(null)}
                style={{
                  padding:'12px 16px', cursor:'pointer', 
                  background:'#f8f9fa', color:'#2563eb', fontWeight:600
                }}
                onMouseEnter={(e) => e.target.style.background = '#e3f2fd'}
                onMouseLeave={(e) => e.target.style.background = '#f8f9fa'}
              >
                ➕ Créer "{query}" comme nouveau produit
              </div>
            </div>
          )}
        </div>

        {/* Détails du produit sélectionné */}
        {selectedProduct && (
          <div style={{
            background:'#e8f5e8', padding:12, borderRadius:8, marginBottom:16,
            border:'1px solid #90ee90'
          }}>
            <div style={{fontWeight:600}}>✅ Produit trouvé: {selectedProduct.name}</div>
            <div style={{fontSize:'0.9rem', color:'#555', marginTop:4}}>
              {selectedProduct.category} • Unité par défaut: {selectedProduct.default_unit || 'g'}
            </div>
          </div>
        )}

        {/* Formulaire de détails */}
        <div style={{display:'grid', gridTemplateColumns:'auto 1fr auto 1fr auto', gap:12, alignItems:'end'}}>
          <div>
            <label style={{fontSize:'0.9rem', color:'#666'}}>Quantité</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{width:80}}
              required
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666'}}>Unité</label>
            <input
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="g, kg, ml, u..."
              style={{width:100}}
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666'}}>DLC/DLUO</label>
            <input
              className="input"
              type="date"
              value={dlc}
              onChange={(e) => setDlc(e.target.value)}
              style={{width:140}}
            />
          </div>
          
          <div>
            <label style={{fontSize:'0.9rem', color:'#666'}}>Lieu</label>
            <select
              className="input"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Choisir...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
            style={{whiteSpace:'nowrap'}}
          >
            {loading ? '⏳' : '✅'} Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------- Carte de produit améliorée ----------------- */
function ProductCard({ productId, name, category, unit, lots=[], onOpen }) {
  const { total, totalConverted, nextDate, locations } = useMemo(()=>{
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    const firstLot = lots[0];
    
    // Calcul du total avec conversions intelligentes
    const targetUnit = firstLot?.unit || unit || 'g';
    let totalConverted = 0;
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      
      // Conversion vers unité cible si possible
      const meta = {
        density_g_per_ml: lot.product?.density_g_per_ml,
        grams_per_unit: lot.product?.grams_per_unit
      };
      
      const converted = convertWithMeta(
        Number(lot.qty || 0),
        lot.unit || 'g', 
        targetUnit,
        meta
      );
      
      totalConverted += converted.qty || 0;
      
      if (lot.location?.name) locSet.add(lot.location.name);
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) nextDate = d;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      totalConverted: Math.round(totalConverted * 100) / 100,
      nextDate, 
      locations: [...locSet].slice(0, 6),
      targetUnit
    };
  }, [lots, unit]);

  const soon = nextDate ? daysUntil(nextDate) : null;
  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : '—';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.({ productId, name })}
      onKeyDown={(e) => { if(e.key==='Enter' || e.key===' ') onOpen?.({ productId, name }); }}
      className="product-card"
      style={{
        ...glassBase,
        borderRadius:'var(--radius-lg)',
        padding:'14px',
        display:'grid',
        gap:8,
        cursor:'pointer',
        transition: 'transform var(--transition-base, .18s ease)'
      }}
      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.target.style.transform = 'none'}
    >
      <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
        <div>
          <div style={{fontWeight:700, color:'var(--forest-700)'}}>{name}</div>
          <div style={{fontSize:'.85rem', color:'var(--earth-600)'}}>{cap(category)}</div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      <div style={{display:'flex', alignItems:'baseline', gap:6}}>
        <span style={{fontSize:'1.6rem', fontWeight:800, color:'var(--forest-700)'}}>
          {totalConverted}
        </span>
        <span style={{opacity:.7}}>{lots[0]?.unit || unit || 'u'}</span>
        {total !== totalConverted && (
          <span style={{fontSize:'.8rem', color:'var(--earth-600)'}}>
            ({total} {unit || 'u'} brut)
          </span>
        )}
      </div>

      {soon !== null && (
        <div style={{fontSize:'.9rem', color:'var(--earth-700)'}}>
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
        <span style={{fontSize:'.8rem', color:'var(--earth-600)'}}>
          {lots.length} lot{lots.length > 1 ? 's' : ''}
        </span>
        <button className="btn small" onClick={(e) => { e.stopPropagation(); onOpen?.({ productId, name }); }}>
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
  const [openProduct, setOpenProduct] = useState(null);

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
      
      // Normalisation des lots avec best_before
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

  // Filtrage intelligent
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

  // Agrégation par produits avec score de pertinence
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
      // Tri par urgence puis par nom
      const aUrgent = Math.min(...a.lots.map(l => daysUntil(l.best_before) ?? 999));
      const bUrgent = Math.min(...b.lots.map(l => daysUntil(l.best_before) ?? 999));
      
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  // Stats améliorées
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

  // Ajouter un nouveau lot
  async function addLot(lotData, productData) {
    const { data, error } = await supabase
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
    
    const newLot = {
      ...data,
      best_before: data.dlc || data.best_before
    };
    
    setLots(prev => [newLot, ...prev]);
    setShowAddForm(false);
  }

  // Actions sur les lots
  async function incQty(lot, delta) {
    const newQty = Math.max(0, Number(lot.qty || 0) + delta);
    const { data, error } = await supabase
      .from('inventory_lots')
      .update({ qty: newQty })
      .eq('id', lot.id)
      .select('id, qty')
      .single();
      
    if (error) return alert(error.message);
    setLots(prev => prev.map(x => x.id === lot.id ? { ...x, qty: data.qty } : x));
  }

  async function deleteLot(lot) {
    if (!confirm(`Supprimer le lot de "${lot.product?.name}" ?`)) return;
    
    const { error } = await supabase.from('inventory_lots').delete().eq('id', lot.id);
    if (error) return alert(error.message);
    
    setLots(prev => prev.filter(x => x.id !== lot.id));
  }

  return (
    <div className="container">
      {/* Header avec stats */}
      <section className="glass-card" style={{ 
        ...glassBase, 
        borderRadius:'var(--radius-xl)', 
        padding:'1.2rem', 
        marginBottom:'1rem' 
      }}>
        <div style={{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12}}>
          <h1 style={{margin:0, display:'flex', alignItems:'center', gap:8}}>
            🏺 Garde-manger
            <span style={{fontSize:'0.6em', opacity:0.6}}>({stats.total} lots)</span>
          </h1>
          <div style={{display:'flex', gap:8}}>
            <button 
              className={`btn small ${view==='products'?'primary':''}`} 
              onClick={() => setView('products')}
            >
              📦 Par produits
            </button>
            <button 
              className={`btn small ${view==='locations'?'primary':''}`} 
              onClick={() => setView('locations')}
            >
              📍 Par lieux
            </button>
          </div>
        </div>

        {/* Stats dashboard */}
        <div className="grid cols-4" style={{marginTop:16, gap:12}}>
          <Stat value={stats.total} label="Lots totaux" />
          <Stat value={stats.expired} label="Périmés" tone="danger" />
          <Stat value={stats.urgent} label="Urgent (≤3j)" tone="warning" />
          <Stat value={stats.soon} label="À surveiller (≤7j)" tone="muted" />
        </div>

        {/* Barre d'outils */}
        <div style={{
          display:'flex', gap:10, alignItems:'center', marginTop:16, 
          flexWrap:'wrap', justifyContent:'space-between'
        }}>
          <div style={{display:'flex', gap:10, alignItems:'center', flex:1}}>
            <div style={{position:'relative', flex:1, maxWidth:300}}>
              <input 
                className="input" 
                placeholder="🔍 Rechercher un produit, catégorie..." 
                value={q} 
                onChange={e => setQ(e.target.value)}
                style={{paddingLeft:35}}
              />
              <span style={{
                position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
                fontSize:'1.1em', opacity:0.5
              }}>
                🔍
              </span>
            </div>
            
            <select 
              className="input" 
              value={locFilter} 
              onChange={e => setLocFilter(e.target.value)}
              style={{minWidth:180}}
            >
              <option value="Tous">📍 Tous les lieux</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div style={{display:'flex', gap:8}}>
            <button 
              className="btn" 
              onClick={load}
              disabled={loading}
              title="Actualiser les données"
            >
              <span style={{
                display:'inline-block', 
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}>
                ↻
              </span>
              {loading ? ' Chargement...' : ' Actualiser'}
            </button>
            
            <button 
              className="btn primary" 
              onClick={() => setShowAddForm(s => !s)}
              style={{fontWeight:600}}
            >
              {showAddForm ? '✕ Fermer' : '➕ Ajouter un produit'}
            </button>
          </div>
        </div>
      </section>

      {/* Formulaire d'ajout intelligent */}
      {showAddForm && (
        <SmartAddForm
          locations={locations}
          onAdd={addLot}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Messages d'erreur */}
      {err && (
        <div className="glass-card" style={{ 
          ...glassBase, 
          borderRadius:'var(--radius-lg)', 
          padding:'1rem', 
          borderColor:'var(--danger)', 
          color:'var(--danger)', 
          marginBottom:'1rem' 
        }}>
          ⚠️ {err}
          <button 
            className="btn small" 
            onClick={() => setErr('')}
            style={{marginLeft:12}}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="glass-card" style={{ 
          ...glassBase, 
          borderRadius:'var(--radius-lg)', 
          padding:'2rem', 
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
            <div className="glass-card" style={{ 
              ...glassBase, 
              borderRadius:'var(--radius-lg)', 
              padding:'1rem',
              marginBottom:'1rem',
              borderLeft:'4px solid var(--autumn-orange)',
              background:'rgba(255,193,7,0.1)'
            }}>
              ⚠️ <strong>{stats.urgent}</strong> lot{stats.urgent > 1 ? 's' : ''} à consommer rapidement (≤ 3 jours)
            </div>
          )}
          
          {stats.expired > 0 && (
            <div className="glass-card" style={{ 
              ...glassBase, 
              borderRadius:'var(--radius-lg)', 
              padding:'1rem',
              marginBottom:'1rem',
              borderLeft:'4px solid var(--danger)',
              background:'rgba(220,38,38,0.1)'
            }}>
              🍂 <strong>{stats.expired}</strong> lot{stats.expired > 1 ? 's' : ''} périmé{stats.expired > 1 ? 's' : ''}
            </div>
          )}

          {/* Vue par produits */}
          {view === 'products' ? (
            <section>
              {byProduct.length > 0 ? (
                <div className="grid cols-3" style={{gap:16}}>
                  {byProduct.map(p => (
                    <ProductCard
                      key={p.productId}
                      productId={p.productId}
                      name={p.name}
                      category={p.category}
                      unit={p.unit}
                      lots={p.lots}
                      onOpen={setOpenProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card" style={{ 
                  ...glassBase, 
                  borderRadius:'var(--radius-lg)', 
                  padding:'3rem', 
                  textAlign:'center' 
                }}>
                  <div style={{fontSize:'3rem', marginBottom:16}}>🌾</div>
                  <div style={{fontSize:'1.2rem', fontWeight:600, marginBottom:8}}>
                    Aucun produit trouvé
                  </div>
                  <div style={{color:'var(--earth-700)', marginBottom:16}}>
                    {q ? 
                      `Aucun résultat pour "${q}"` : 
                      'Votre garde-manger est vide ou tous les produits sont filtrés'
                    }
                  </div>
                  {!q && (
                    <button 
                      className="btn primary" 
                      onClick={() => setShowAddForm(true)}
                    >
                      ➕ Ajouter votre premier produit
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            /* Vue par lieux - code existant adapté */
            <section>
              {/* Implementation de la vue par lieux ici */}
              <div className="glass-card" style={{ 
                ...glassBase, 
                borderRadius:'var(--radius-lg)', 
                padding:'2rem', 
                textAlign:'center' 
              }}>
                <div>Vue par lieux - À implémenter</div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Styles CSS additionnels */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .grid.cols-3 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
        
        .grid.cols-4 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        
        .btn.small {
          padding: 6px 12px;
          font-size: 0.875rem;
        }
        
        .btn.primary {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: white;
          border-color: #2563eb;
        }
        
        .btn.primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
        }
        
        .input {
          padding: 8px 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.8);
          transition: all 0.2s;
        }
        
        .input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        
        :root {
          --danger: #dc2626;
          --success: #16a34a;
          --autumn-orange: #ea580c;
          --autumn-yellow: #ca8a04;
          --forest-500: #22c55e;
          --forest-600: #16a34a;
          --forest-700: #15803d;
          --earth-600: #78716c;
          --earth-700: #57534e;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --transition-base: 0.15s ease;
        }
      `}</style>
    </div>
  );
}
