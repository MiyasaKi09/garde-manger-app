// app/pantry/[locationId]/page.js
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';
import { toast } from '@/components/Toast';

/* -------------------- helpers texte -------------------- */
const strip = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
function levenshtein(a, b) {
  a = strip(a); b = strip(b);
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i=0;i<=m;i++) dp[i][0]=i;
  for (let j=0;j<=n;j++) dp[0][j]=j;
  for (let i=1;i<=m;i++){
    for (let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[m][n];
}
function scoreCandidate(query, target) {
  const q = strip(query), t = strip(target);
  if (!q || !t) return 999;
  if (t.startsWith(q)) return 0;
  if (t.includes(q))  return 1;
  return levenshtein(q, t);
}
const todayISO = () => new Date().toISOString().slice(0,10);
const addDaysISO = (d) => new Date(Date.now() + d*86400000).toISOString().slice(0,10);

/* -------------------- Catégories & DLC -------------------- */
const CATEGORY_OPTIONS = [
  'Frais', 'Fruits/Légumes', 'Laitier', 'Fromage',
  'Viande/Poisson', 'Charcuterie', 'Boulangerie',
  'Sec', 'Conserve', 'Surgelé', 'Boisson', 'Autre'
];

const CAT_DAYS = {
  'Sec': 365, 'Surgelé': 180, 'Conserve': 1095,
  'Laitier': 7, 'Fromage': 21, 'Boulangerie': 3,
  'Frais': 7, 'Fruits/Légumes': 7, 'Viande/Poisson': 2,
  'Charcuterie': 5, 'Boisson': 365, 'Autre': 7
};

const KEYWORDS = [
  // Laitiers / fromages / charcut
  { rx:/ya+?ourt|yogh/i, days:14 },
  { rx:/fromage blanc/i, days:14 },
  { rx:/lait|cr[eé]me/i, days:7 },
  { rx:/fromage/i, days:21 },
  { rx:/jambon|charcut/i, days:5 },
  // Sec / conserve
  { rx:/p[aâ]tes|riz|farine|semoule|lentilles/i, days:365 },
  { rx:/conserve|cann/i, days:1095 },
  { rx:/sucre|sel|cafe/i, days:365 },
  { rx:/pain|brioche/i, days:3 },
  // Viandes/poissons
  { rx:/steak|boeuf|veau|agneau|poulet|dinde|porc/i, days:2 },
  { rx:/poisson|saumon|thon|cabillaud/i, days:2 },
  // Frais / primeur
  { rx:/tomate.*(c(oe|œur)ur).*boeuf/i, days:7 },
  { rx:/tomate/i, days:7 },
  { rx:/salade|courgette|pomme(?! de terre)|banane|carotte|oignon|poivron|concombre/i, days:7 },
  { rx:/herbe|persil|basilic|coriandre|menthe/i, days:5 },
  // Surgelé
  { rx:/surg|congel/i, days:180 },
];

function applyModifiers({ days, locationName='', isOpened=false, category='' }) {
  const loc = (locationName||'').toLowerCase();
  if (/cong|surg/.test(loc)) days = Math.max(days, 180);
  if (/placard|epicer|cave/.test(loc)) days = Math.min(days, 365);
  // frigo : ne pas descendre trop bas pour laitier/fromage
  if (/frigo|frigidaire/.test(loc) && /(lait|cr[eé]me|fromage|yaourt|charcut)/i.test(category||'')) {
    days = Math.max(Math.min(days, 21), 7);
  }
  if (isOpened) days = Math.max(1, Math.round(days*0.6));
  // Planchers
  const isProduce = /(Fruits\/Légumes|Frais)/.test(category||'');
  days = Math.max(days, isProduce ? 5 : 3);
  return days;
}

// Renvoie { days, source: 'product|category|keyword|default' }
function estimateShelfLife({ productRow, name='', category='', locationName='' }) {
  // 1) valeur déjà stockée sur le produit
  if (productRow?.shelf_life_days && productRow.shelf_life_days > 0) {
    const d = applyModifiers({ days: productRow.shelf_life_days, locationName, isOpened:false, category: productRow.category || category });
    return { days: d, source:'product' };
  }
  // 2) mot-clé
  const text = `${name} ${category}`.trim();
  for (const r of KEYWORDS) {
    if (r.rx.test(text)) {
      const d = applyModifiers({ days:r.days, locationName, isOpened:false, category });
      return { days: d, source:'keyword' };
    }
  }
  // 3) catégorie
  if (category && CAT_DAYS[category] != null) {
    const d = applyModifiers({ days: CAT_DAYS[category], locationName, isOpened:false, category });
    return { days: d, source:'category' };
  }
  // 4) défaut
  const d = applyModifiers({ days: 7, locationName, isOpened:false, category });
  return { days: d, source:'default' };
}

/* -------------------- petits helpers UI -------------------- */
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => { const k = keyFn(item); (acc[k]=acc[k]||[]).push(item); return acc; }, {});
}

/* =========================================================== */
export default function LocationDetail() {
  const { locationId } = useParams();

  const [locName, setLocName] = useState('…');
  const [lots, setLots] = useState([]);

  // catalogue + alias
  const [products, setProducts] = useState([]); // id,name,default_unit,category,shelf_life_days,…
  const [aliases, setAliases] = useState([]);

  // form
  const [nameInput, setNameInput] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [dlc, setDlc] = useState('');
  const [saving, setSaving] = useState(false);

  // produit sélectionné (depuis une suggestion)
  const [selectedProd, setSelectedProd] = useState(null); // {id,name,default_unit,category,shelf_life_days}
  const [chosenCategory, setChosenCategory] = useState(''); // override UI

  // autocomplete UI
  const [showSuggest, setShowSuggest] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const inputRef = useRef(null);
  const suggestRef = useRef(null);

  const UNIT_OPTIONS = ['g','kg','ml','cl','l','u'];

  async function refresh() {
    const { data: loc } = await supabase.from('locations').select('name').eq('id', locationId).single();
    if (loc) setLocName(loc.name);

    const { data: lotsRows } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, product:products_catalog(id,name,default_unit)')
      .eq('location_id', locationId)
      .order('dlc', { ascending: true });
    setLots(lotsRows || []);

    const { data: prods } = await supabase.from('products_catalog')
      .select('id,name,default_unit,category,shelf_life_days,density_g_per_ml,grams_per_unit')
      .order('name');
    setProducts(prods || []);

    const { data: aliasRows } = await supabase.from('product_aliases').select('product_id,alias');
    setAliases(aliasRows || []);
  }
  useEffect(()=>{ refresh(); },[locationId]);

  // fermer bulle
  useEffect(() => {
    function onDocDown(e) {
      const t = e.target;
      const inInput   = inputRef.current  && inputRef.current.contains(t);
      const inSuggest = suggestRef.current && suggestRef.current.contains(t);
      if (!inInput && !inSuggest) setShowSuggest(false);
    }
    function onKey(e){ if (e.key === 'Escape') setShowSuggest(false); }
    document.addEventListener('pointerdown', onDocDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDocDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  // suggestions = seulement produits existants (dédupliqués)
  const suggestions = useMemo(() => {
    const q = nameInput.trim();
    if (!q) return [];
    const cands = [];
    for (const p of products) cands.push({ id:p.id, label:p.name, base:p.name, score:scoreCandidate(q,p.name), unit:p.default_unit||'g' });
    for (const a of aliases) {
      const p = products.find(x=>x.id===a.product_id); if (!p) continue;
      cands.push({ id:p.id, label:p.name, base:a.alias, score:scoreCandidate(q, a.alias), unit:p.default_unit||'g' });
    }
    const best = new Map();
    for (const c of cands) { const prev = best.get(c.id); if (!prev || c.score<prev.score) best.set(c.id, c); }
    return Array.from(best.values()).sort((a,b)=>a.score-b.score).slice(0,7);
  }, [nameInput, products, aliases]);

  // Produit courant (si on a cliqué une suggestion)
  const currentProduct = useMemo(() => {
    if (!selectedProd) return null;
    return products.find(p => p.id === selectedProd.id) || selectedProd;
  }, [selectedProd, products]);

  // Estimation DLC (preview) – n’écrit rien en base
  const preview = useMemo(() => {
    if (dlc) return null;
    const name = currentProduct?.name || nameInput.trim();
    if (!name) return null;
    const category = chosenCategory || currentProduct?.category || '';
    const est = estimateShelfLife({ productRow: currentProduct, name, category, locationName: locName });
    return { ...est, date: addDaysISO(est.days) };
  }, [dlc, nameInput, currentProduct, chosenCategory, locName]);

  function onPickSuggestion(s) {
    setNameInput(s.label);
    const p = products.find(x=>x.id===s.id);
    if (p) {
      setSelectedProd(p);
      setChosenCategory(p.category || '');
      if (p.default_unit) setUnit(p.default_unit);
    }
    setShowSuggest(false);
    setTimeout(()=>inputRef.current?.focus(),0);
  }

  async function addLot(e) {
    e.preventDefault();
    if (!nameInput.trim() || !qty) return toast.error('Produit et quantité requis.');
    setSaving(true);
    try {
      // 1) on exige un produit existant (sélectionné)
      let prod = currentProduct;
      if (!prod) {
        // essayer de matcher sans créer
        const best = suggestions[0];
        if (best) {
          prod = products.find(p=>p.id===best.id);
        }
      }
      if (!prod) throw new Error("Choisis un produit existant (dans la liste). Pour créer un nouveau produit, passe par Paramètres → Données.");

      // 2) mettre à jour la catégorie si l’utilisateur l’a choisie
      const cat = chosenCategory || prod.category || '';
      if (cat && cat !== prod.category) {
        await supabase.from('products_catalog').update({ category: cat }).eq('id', prod.id);
        setProducts(prev => prev.map(p => p.id===prod.id ? {...p, category: cat} : p));
        prod = { ...prod, category: cat };
      }

      // 3) si le produit n’a pas de shelf_life_days → écrire l’estimation (basée sur cat/keyword)
      if (!prod.shelf_life_days || prod.shelf_life_days <= 0) {
        const est = estimateShelfLife({ productRow: prod, name: prod.name, category: cat, locationName: locName });
        await supabase.from('products_catalog').update({ shelf_life_days: est.days }).eq('id', prod.id);
        setProducts(prev => prev.map(p => p.id===prod.id ? {...p, shelf_life_days: est.days} : p));
        prod = { ...prod, shelf_life_days: est.days };
      }

      // 4) créer le lot
      const finalDlc = dlc || addDaysISO(estimateShelfLife({ productRow: prod, name: prod.name, category: prod.category, locationName: locName }).days);
      const finalUnit = unit || prod.default_unit || 'g';

      const { error } = await supabase.from('inventory_lots').insert({
        product_id: prod.id,
        location_id: locationId,
        qty: Number(qty),
        unit: finalUnit,
        dlc: finalDlc,
        source: 'achat'
      });
      if (error) throw error;

      setNameInput(''); setQty(''); setUnit('g'); setDlc('');
      setSelectedProd(null); setChosenCategory('');
      await refresh();
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function removeLot(id) {
    if (!confirm('Retirer ce lot ?')) return;
    const { error } = await supabase.from('inventory_lots').delete().eq('id', id);
    if (error) return toast.error(error.message);
    await refresh();
  }

  const groups = groupBy(lots, l => l.product?.name ?? '—');

  const flabel = { display:'grid', gap:6, fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.04em', textTransform:'uppercase', color:'var(--ink-3)' };
  const finput = { width:'100%', minWidth:0 };

  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Emplacement</span>
          <h1 className="v21-title">{locName}</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{lots.length} lot{lots.length !== 1 ? 's' : ''} rangé{lots.length !== 1 ? 's' : ''} ici.</p>
        </div>
      </header>

      {/* Formulaire ajout */}
      <section className="v21-section">
        <div className="v21-bh"><span className="v21-bl">Ajouter un produit</span></div>
        <form onSubmit={addLot} style={{display:'grid',gap:14,maxWidth:780}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:12}}>
            <label style={flabel}>Produit
              <div style={{position:'relative'}}>
                <input
                  ref={inputRef}
                  className="v21-search"
                  style={finput}
                  placeholder="Ex: Tomates"
                  value={nameInput}
                  onChange={e=>{ setNameInput(e.target.value); setShowSuggest(true); setSelectedProd(null); setChosenCategory(''); }}
                  onFocus={()=> setShowSuggest(true)}
                  autoComplete="off"
                  onKeyDown={(e)=>{
                    if(!showSuggest) return;
                    if(e.key==='ArrowDown'){ e.preventDefault(); setHoverIdx(i=>Math.min(i+1, (suggestions.length-1))); }
                    if(e.key==='ArrowUp'){ e.preventDefault(); setHoverIdx(i=>Math.max(i-1, 0)); }
                    if(e.key==='Enter' && hoverIdx>=0 && suggestions[hoverIdx]){
                      e.preventDefault(); onPickSuggestion(suggestions[hoverIdx]);
                    }
                    if(e.key==='Escape'){ setShowSuggest(false); }
                  }}
                  required
                />
                {showSuggest && nameInput.trim() && suggestions.length>0 && (
                  <div
                    ref={suggestRef}
                    style={{
                      position:'absolute', top:'100%', left:0, right:0, zIndex:50,
                      background:'var(--surface)', border:'1px solid var(--line-strong)', borderTop:'none',
                      borderRadius:'0 0 3px 3px', boxShadow:'var(--sh-2)',
                      maxHeight: 260, overflowY:'auto'
                    }}
                  >
                    {suggestions.map((s, idx)=>(
                      <div
                        key={s.id}
                        style={{
                          padding:'9px 12px', cursor:'pointer', fontFamily:'var(--font-text)', fontSize:14, color:'var(--ink-1)',
                          background: idx===hoverIdx ? 'var(--surface-soft)' : 'transparent'
                        }}
                        onMouseEnter={()=>setHoverIdx(idx)}
                        onMouseDown={()=>onPickSuggestion(s)}
                      >
                        <div style={{display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                          {s.label} <span style={{color:'var(--ink-3)',fontSize:12,fontFamily:'var(--font-mono)'}}>({s.unit||'g'})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <label style={flabel}>Quantité
              <input className="v21-search" style={finput} required type="number" step="0.01" min="0" value={qty} onChange={e=>setQty(e.target.value)}/>
            </label>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <label style={flabel}>Unité
              <select className="v21-search" style={finput} value={unit} onChange={e=>setUnit(e.target.value)}>
                {UNIT_OPTIONS.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </label>

            <label style={flabel}>Catégorie {currentProduct?.category ? <span style={{color:'var(--ink-3)',textTransform:'none'}}>(actuelle : {currentProduct.category})</span> : <span style={{color:'var(--ink-3)',textTransform:'none'}}>(non renseignée)</span>}
              <select className="v21-search" style={finput} value={chosenCategory} onChange={e=>setChosenCategory(e.target.value)}>
                <option value="">— choisir (optionnel)</option>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <label style={flabel}>DLC
              <input className="v21-search" style={finput} type="date" value={dlc} onChange={e=>setDlc(e.target.value)}/>
              {!dlc && preview && (
                <div style={{fontSize:12,color:'var(--ink-3)',marginTop:6,textTransform:'none',fontFamily:'var(--font-text)',letterSpacing:0}}>
                  Suggestion : <strong style={{color:'var(--ink-1)'}}>{preview.date}</strong> ({preview.days} j, source : {preview.source})
                </div>
              )}
            </label>
          </div>

          <div>
            <button className="v21-btn" type="submit" disabled={saving}>
              {saving ? 'Ajout…' : 'Ajouter ici'}
            </button>
          </div>
        </form>
      </section>

      {/* lots groupés par produit */}
      <section className="v21-section flush" style={{paddingTop:8}}>
        {Object.entries(groupBy(lots, l => l.product?.name ?? '—')).map(([name, items]) => (
          <div key={name} style={{marginTop:20}}>
            <div className="v21-bh" style={{marginBottom:8}}>
              <span style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:20,color:'var(--ink-1)'}}>{name}</span>
              <span className="v21-mast-c">{items.length} lot{items.length>1?'s':''}</span>
            </div>
            <div className="v21-its">
              {items.map(i=>(
                <div key={i.id} className="v21-it compact">
                  <span className="v21-it-bar" aria-hidden="true" />
                  <span className="v21-it-n" style={{fontSize:16}}>{i.qty} {i.unit}</span>
                  <span className="v21-it-st" style={{color:'var(--ink-3)',gap:10}}>
                    DLC {i.dlc || '—'}
                    <IconButton title="Retirer" onClick={()=>removeLot(i.id)}>✖️</IconButton>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {lots.length===0 && <div className="v21-empty"><p>Aucun produit ici.</p></div>}
      </section>
    </div>
  );
}
