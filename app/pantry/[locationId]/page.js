'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

/* ---------- helpers texte ---------- */
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
const toTitle = (s) => s ? s.trim().replace(/\s+/g,' ').replace(/^.| [a-z]/g, m => m.toUpperCase()) : s;
const pluralizeSoft = (s) => {
  const t = s.trim();
  return t.length>2 && !/[sxz]$/i.test(t) && !t.endsWith('s') ? t + 's' : t;
};
const todayISO = () => new Date().toISOString().slice(0,10);
const addDaysISO = (d) => new Date(Date.now() + d*86400000).toISOString().slice(0,10);

/* ---------- Estimation DLC (plancher 3j, tomates 7j) ---------- */
const CAT_DAYS = {
  'Sec': 365, 'Surgelé': 180, 'Conserve': 1095, 'Laitier': 7, 'Fromage': 21, 'Boulangerie': 3, 'Frais': 7, 'Viande/Poisson': 2,
};
const KEYWORDS = [
  { rx: /ya+?ourt|yogh/i, days: 14 },
  { rx: /fromage blanc/i, days: 14 },
  { rx: /lait|cr[eé]me/i, days: 7 },
  { rx: /fromage/i, days: 21 },
  { rx: /p[aâ]tes|riz|farine|semoule|lentilles/i, days: 365 },
  { rx: /conserve|cann/i, days: 1095 },
  { rx: /sucre|sel|cafe/i, days: 365 },
  { rx: /pain|brioche/i, days: 3 },
  { rx: /steak|boeuf|veau|agneau|poulet|dinde|porc/i, days: 2 },
  { rx: /poisson|saumon|thon|cabillaud/i, days: 2 },
  { rx: /jambon|charcut/i, days: 5 },
  { rx: /tomate|salade|courgette|pomme|banane|carotte|oignon/i, days: 7 },
  { rx: /herbe|persil|basilic|coriandre|menthe/i, days: 4 },
  { rx: /surg|congel/i, days: 180 },
];
function applyModifiers({ days, confidence, locationName='', isOpened=false, category='' }) {
  const loc = (locationName||'').toLowerCase();
  if (/cong|surg/.test(loc)) { days = Math.max(days, 180); confidence = Math.max(confidence, 0.6); }
  if (/placard|epicer|cave/.test(loc)) { days = Math.min(days, 365); }
  if (/frigo|frigidaire/.test(loc) && /(lait|creme|charcut|fromage|yaourt)/i.test((category||'')+' '+loc)) {
    days = Math.min(days, 21);
  }
  if (isOpened) { days = Math.max(1, Math.round(days * 0.6)); confidence -= 0.1; }
  return { days, confidence: Math.max(0.2, Math.min(1, confidence)) };
}
function estimateShelfLife({ name='', category='', locationName='', isOpened=false }) {
  for (const r of KEYWORDS) {
    if (r.rx.test(name)) {
      let days = r.days; let confidence = 0.8;
      ({ days, confidence } = applyModifiers({ days, confidence, locationName, isOpened, category }));
      if (!isOpened) days = Math.max(days, 3);
      return { days, confidence, reason: 'keyword' };
    }
  }
  let daysCat = null;
  for (const [cat, d] of Object.entries(CAT_DAYS)) {
    if (strip(category).includes(strip(cat))) { daysCat = d; break; }
  }
  if (daysCat == null) {
    if (/sec/.test(strip(category))) daysCat = 365;
    else if (/frais/.test(strip(category))) daysCat = 7;
  }
  if (daysCat != null) {
    let days = daysCat; let confidence = 0.6;
    ({ days, confidence } = applyModifiers({ days, confidence, locationName, isOpened, category }));
    if (!isOpened) days = Math.max(days, 3);
    return { days, confidence, reason: 'category' };
  }
  let days = 7; let confidence = 0.4;
  ({ days, confidence } = applyModifiers({ days, confidence, locationName, isOpened, category }));
  if (!isOpened) days = Math.max(days, 3);
  return { days, confidence, reason: 'default' };
}

/* ---------- helpers UI ---------- */
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => { const k = keyFn(item); (acc[k]=acc[k]||[]).push(item); return acc; }, {});
}

export default function LocationDetail() {
  const { locationId } = useParams();

  const [locName, setLocName] = useState('…');
  const [lots, setLots] = useState([]);

  // catalogue + alias
  const [products, setProducts] = useState([]); // id,name,default_unit,category,shelf_life_days,density_g_per_ml,grams_per_unit
  const [aliases, setAliases] = useState([]);   // {product_id, alias}

  // form
  const [nameInput, setNameInput] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [dlc, setDlc] = useState('');
  const [previewDlc, setPreviewDlc] = useState(null);
  const [saving, setSaving] = useState(false);

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

  // Fermer la bulle sur clic dehors / ESC
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

  // Suggestions (uniquement EXISTANT, dédupliqué par produit)
  const suggestions = useMemo(() => {
    const q = nameInput.trim();
    if (!q) return [];
    const cands = [];
    for (const p of products) cands.push({ id:p.id, label:p.name, base:p.name, score:scoreCandidate(q,p.name), unit:p.default_unit||'g' });
    for (const a of aliases) {
      const p = products.find(x=>x.id===a.product_id); if (!p) continue;
      cands.push({ id:p.id, label:p.name, base:a.alias, score:scoreCandidate(q, a.alias), unit:p.default_unit||'g' });
    }
    const best = new Map(); // id -> meilleur match
    for (const c of cands) { const prev = best.get(c.id); if (!prev || c.score<prev.score) best.set(c.id, c); }
    return Array.from(best.values()).sort((a,b)=>a.score-b.score).slice(0,7);
  }, [nameInput, products, aliases]);

  // Ghost-texte aligné : on superpose un “miroir” avec la même fonte/padding
  const inlineHint = useMemo(() => {
    const q = nameInput;
    if (!q || !suggestions.length) return '';
    const best = suggestions[0].label || '';
    const nQ = strip(q), nB = strip(best);
    if (!nB.startsWith(nQ) || nQ.length>=best.length) return '';
    return best.slice(q.length);
  }, [nameInput, suggestions]);

  /**
   * Résout un produit.
   * - lookupOnly=true : ne crée pas, ne génère pas d’alias (utilisé pour le PREVIEW/DLC).
   * - addAliasOnMatch=true : si on matche un existant et que le texte diffère → ajoute un alias (utilisé sur AJOUT).
   */
  async function resolveProduct(rawName, { lookupOnly=false, addAliasOnMatch=false, createIfMissing=true } = {}) {
    const q = rawName.trim();
    if (!q) throw new Error('Nom vide');

    let best = null;
    for (const p of products) {
      const s = scoreCandidate(q, p.name);
      if (!best || s<best.score) best = { id:p.id, name:p.name, unit:p.default_unit||'g', score:s, category:p.category, shelf:p.shelf_life_days };
    }
    for (const a of aliases) {
      const p = products.find(x=>x.id===a.product_id);
      if (!p) continue;
      const s = scoreCandidate(q, a.alias);
      if (!best || s<best.score) best = { id:p.id, name:p.name, unit:p.default_unit||'g', score:s, category:p.category, shelf:p.shelf_life_days };
    }

    if (best && best.score <= 2) {
      if (!lookupOnly && addAliasOnMatch) {
        const typed = strip(q), canonical = strip(best.name);
        if (typed && canonical && typed!==canonical) {
          await supabase.from('product_aliases').insert({ product_id: best.id, alias: q }).catch(()=>{});
        }
      }
      const shelfDays = Number(best.shelf) || estimateShelfLife({ name: best.name, category: best.category, locationName: locName }).days;
      return { id: best.id, unit: best.unit, created:false, canonicalName: best.name, shelfDays, category: best.category };
    }

    if (lookupOnly || !createIfMissing) {
      // on ne crée rien en mode preview
      const guessed = estimateShelfLife({ name: q, locationName: locName });
      return { id: null, unit: 'g', created:false, canonicalName: q, shelfDays: guessed.days, category: null };
    }

    // création (validée uniquement quand on clique “Ajouter”)
    const canonical = toTitle(pluralizeSoft(q));
    const already = products.find(p=> strip(p.name)===strip(canonical));
    if (already) {
      const shelfDays = Number(already.shelf_life_days) || estimateShelfLife({ name: already.name, category: already.category, locationName: locName }).days;
      return { id: already.id, unit: already.default_unit||'g', created:false, canonicalName: already.name, shelfDays, category: already.category };
    }
    const guessed = estimateShelfLife({ name: canonical, locationName: locName });
    const { data: ins, error } = await supabase
      .from('products_catalog')
      .insert({ name: canonical, default_unit: 'g', shelf_life_days: guessed.days })
      .select('id,name,default_unit,category,shelf_life_days,density_g_per_ml,grams_per_unit').single();
    if (error) throw error;
    await supabase.from('product_aliases').insert({ product_id: ins.id, alias: q }).catch(()=>{});
    setProducts(prev=>[...prev, ins]);
    return { id: ins.id, unit: ins.default_unit||'g', created:true, canonicalName: ins.name, shelfDays: guessed.days, category: ins.category };
  }

  // Pré-aperçu DLC : lookupOnly → ne crée pas, n’ajoute pas d’alias
  useEffect(()=>{ (async()=>{
    if (!nameInput.trim() || dlc) { setPreviewDlc(null); return; }
    try {
      const r = await resolveProduct(nameInput, { lookupOnly:true, addAliasOnMatch:false, createIfMissing:false });
      const when = addDaysISO(r.shelfDays || 7);
      setPreviewDlc(when);
    } catch { setPreviewDlc(null); }
  })(); /* eslint-disable-next-line */ }, [nameInput, dlc]);

  async function addLot(e) {
    e.preventDefault();
    if (!nameInput.trim() || !qty) return alert('Produit et quantité requis.');
    setSaving(true);
    try {
      // 👉 création & alias UNIQUEMENT ici
      const r = await resolveProduct(nameInput, { lookupOnly:false, addAliasOnMatch:true, createIfMissing:true });

      /* --- Apprentissage meta (densité / g par unité) si manquants --- */
      const prodRow = products.find(p => p.id === r.id);
      if (prodRow && (prodRow.density_g_per_ml == null || prodRow.grams_per_unit == null)) {
        const { estimateProductMeta } = await import('@/lib/meta'); // lazy
        const est = estimateProductMeta({ name: prodRow.name, category: prodRow.category });
        const patch = {};
        if (prodRow.density_g_per_ml == null && est.confidence_density >= 0.6) patch.density_g_per_ml = est.density_g_per_ml;
        if (prodRow.grams_per_unit == null && est.grams_per_unit && est.confidence_unit >= 0.6) patch.grams_per_unit = est.grams_per_unit;
        if (Object.keys(patch).length) {
          await supabase.from('products_catalog').update(patch).eq('id', prodRow.id);
          setProducts(prev => prev.map(p => p.id===prodRow.id ? {...p, ...patch} : p));
        }
      }
      /* --------------------------------------------------------------- */

      // Mémorise l’estimation DLC si produit sans valeur
      const prod = products.find(p=>p.id===r.id);
      if (prod && (prod.shelf_life_days==null || prod.shelf_life_days===0)) {
        await supabase.from('products_catalog').update({ shelf_life_days: r.shelfDays }).eq('id', r.id).catch(()=>{});
        setProducts(prev => prev.map(p => p.id===r.id ? {...p, shelf_life_days: r.shelfDays} : p));
      }

      const finalDlc = dlc || addDaysISO(r.shelfDays || 7);
      const finalUnit = unit || r.unit || 'g';

      const { error } = await supabase.from('inventory_lots').insert({
        product_id: r.id,
        location_id: locationId,
        qty: Number(qty),
        unit: finalUnit,
        dlc: finalDlc,
        source: 'achat'
      });
      if (error) throw error;

      setNameInput(''); setQty(''); setUnit('g'); setDlc(''); setPreviewDlc(null);
      await refresh();
      inputRef.current?.focus();
      setShowSuggest(false);
    } catch (err) {
      alert(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function removeLot(id) {
    if (!confirm('Retirer ce lot ?')) return;
    const { error } = await supabase.from('inventory_lots').delete().eq('id', id);
    if (error) return alert(error.message);
    await refresh();
  }

  const groups = groupBy(lots, l => l.product?.name ?? '—');

  return (
    <div>
      <h1>{locName}</h1>

      {/* Formulaire ajout */}
      <form onSubmit={addLot} className="card" style={{display:'grid',gap:8,maxWidth:760}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
          <label>Produit
            <div style={{position:'relative'}}>
              {/* Ghost/hint superposé (miroir) */}
              {inlineHint && (
                <div
                  aria-hidden
                  style={{
                    position:'absolute', inset:'0',
                    display:'flex', alignItems:'center',
                    padding:'8px 10px',
                    pointerEvents:'none',
                    font: 'inherit', lineHeight: 'inherit',
                    color:'rgba(0,0,0,.35)',
                    whiteSpace:'nowrap', overflow:'hidden'
                  }}
                >
                  <span style={{visibility:'hidden'}}>{nameInput}</span>
                  <span>{inlineHint}</span>
                </div>
              )}
              <input
                ref={inputRef}
                className="input"
                placeholder="Ex: Tomates"
                value={nameInput}
                onChange={e=>{ setNameInput(e.target.value); setShowSuggest(true); }}
                onFocus={()=> setShowSuggest(true)}
                autoComplete="off"
                onKeyDown={(e)=>{
                  if(!showSuggest) return;
                  if(e.key==='ArrowDown'){ e.preventDefault(); setHoverIdx(i=>Math.min(i+1, (suggestions.length-1))); }
                  if(e.key==='ArrowUp'){ e.preventDefault(); setHoverIdx(i=>Math.max(i-1, 0)); }
                  if(e.key==='Enter'){
                    if(hoverIdx>=0 && suggestions[hoverIdx]){
                      const s = suggestions[hoverIdx];
                      setNameInput(s.label);
                      const p = products.find(x=>x.id===s.id);
                      if (p?.default_unit) setUnit(p.default_unit);
                      setShowSuggest(false);
                      e.preventDefault();
                      setTimeout(()=>inputRef.current?.focus(),0);
                    }
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
                    background:'#fff', border:'1px solid #dcdce0', borderTop:'none',
                    borderBottomLeftRadius:10, borderBottomRightRadius:10, boxShadow:'0 6px 18px rgba(0,0,0,.06)',
                    maxHeight: 260, overflowY:'auto'
                  }}
                >
                  {suggestions.map((s, idx)=>(
                    <div
                      key={s.id}
                      style={{
                        padding:'8px 10px', cursor:'pointer',
                        background: idx===hoverIdx ? '#f5f5f7' : 'transparent'
                      }}
                      onMouseEnter={()=>setHoverIdx(idx)}
                      onMouseDown={()=>{
                        setNameInput(s.label);
                        const p = products.find(x=>x.id===s.id);
                        if (p?.default_unit) setUnit(p.default_unit);
                        setShowSuggest(false);
                        setTimeout(()=>inputRef.current?.focus(),0);
                      }}
                    >
                      <div style={{
                        display:'-webkit-box',
                        WebkitLineClamp:3,
                        WebkitBoxOrient:'vertical',
                        overflow:'hidden'
                      }}>
                        {s.label} <span style={{opacity:.6,fontSize:12}}>({s.unit||'g'})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </label>

          <label>Quantité
            <input className="input" required type="number" step="0.01" min="0" value={qty} onChange={e=>setQty(e.target.value)}/>
          </label>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <label>Unité
            <select className="input" value={unit} onChange={e=>setUnit(e.target.value)}>
              {['g','kg','ml','cl','l','u'].map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label>DLC
            <input className="input" type="date" value={dlc} onChange={e=>setDlc(e.target.value)}/>
            {!dlc && previewDlc && (
              <div style={{fontSize:12,opacity:.7,marginTop:4}}>
                Suggestion : {previewDlc} (appliquée si tu laisses vide)
              </div>
            )}
          </label>
        </div>

        <div>
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter ici'}
          </button>
        </div>
      </form>

      {/* lots groupés par produit */}
      {Object.entries(groupBy(lots, l => l.product?.name ?? '—')).map(([name, items]) => (
        <div key={name} className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <strong>{name}</strong>
            <span style={{opacity:.6,fontSize:12}}>{items.length} lot(s)</span>
          </div>
          <div style={{marginTop:6}}>
            {items.map(i=>(
              <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'6px 0'}}>
                <div>• {i.qty} {i.unit} — DLC {i.dlc || '—'}</div>
                <IconButton title="Retirer" onClick={()=>removeLot(i.id)}>✖️</IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
      {lots.length===0 && <p>Aucun produit ici.</p>}
    </div>
  );
}
