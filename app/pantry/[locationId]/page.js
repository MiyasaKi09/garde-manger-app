'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

// ---------- utils ----------
const strip = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
function levenshtein(a, b) {
  a = strip(a); b = strip(b);
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({length: m+1}, (_,i)=>Array(n+1).fill(0));
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

// Règles simples d’estimation si shelf_life_days absent
function guessShelfLifeDays(name='', category='') {
  const n = strip(name);
  const c = strip(category);
  const has = (k) => n.includes(k);

  // Catégories “secs”
  if (c.includes('sec') || has('pate') || has('riz') || has('farine') || has('semoule') || has('lentille') || has('boite') || has('conserve')) return 365;
  if (has('cann')) return 1095; // conserves
  if (has('sucre') || has('sel') || has('cafe')) return 365;

  // Laitier
  if (has('yaourt') || has('yogh') || has('fromage blanc')) return 14;
  if (has('lait') || has('creme')) return 7;
  if (has('fromage')) return 21;

  // Boulangerie
  if (has('pain') || has('brioche')) return 3;

  // Viande/poisson/charcuterie
  if (has('steak') || has('boeuf') || has('veau') || has('agneau') || has('poulet') || has('dinde') || has('porc')) return 2;
  if (has('poisson') || has('saumon') || has('thon') || has('cabillaud')) return 2;
  if (has('jambon') || has('charcut')) return 5;

  // Fruits & légumes frais
  if (c.includes('frais') || has('tomate') || has('salade') || has('courgette') || has('pomme') || has('banane') || has('carotte') || has('oignon')) return 5;
  if (has('herbe') || has('persil') || has('basilic') || has('coriandre') || has('menthe')) return 3;

  // Surgelé
  if (has('surg') || has('congel')) return 180;

  // Par défaut
  return 7;
}

// ---------- page ----------
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => { const k = keyFn(item); (acc[k]=acc[k]||[]).push(item); return acc; }, {});
}

export default function LocationDetail() {
  const { locationId } = useParams();
  const [locName, setLocName] = useState('…');
  const [lots, setLots] = useState([]);

  // catalogue + alias
  const [products, setProducts] = useState([]);            // [{id,name,default_unit,category,shelf_life_days}]
  const [aliases, setAliases] = useState([]);              // [{product_id, alias}]
  const [loading, setLoading] = useState(true);

  // formulaire ajout
  const [nameInput, setNameInput] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [dlc, setDlc] = useState('');
  const [previewDlc, setPreviewDlc] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  async function refresh() {
    setLoading(true);
    const { data: loc } = await supabase.from('locations').select('name').eq('id', locationId).single();
    if (loc) setLocName(loc.name);

    const { data: lotsRows } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, product:products_catalog(id,name,default_unit)')
      .eq('location_id', locationId)
      .order('dlc', { ascending: true });
    setLots(lotsRows || []);

    const { data: prods } = await supabase.from('products_catalog')
      .select('id,name,default_unit,category,shelf_life_days').order('name');
    setProducts(prods || []);
    const { data: aliasRows } = await supabase.from('product_aliases').select('product_id,alias');
    setAliases(aliasRows || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [locationId]);

  // suggestions dynamiques
  const suggestions = useMemo(() => {
    const q = nameInput.trim();
    if (!q) return [];
    const candidates = [];
    for (const p of products) {
      candidates.push({ id: p.id, label: p.name, base: p.name, score: scoreCandidate(q, p.name), unit: p.default_unit || 'g' });
    }
    for (const a of aliases) {
      const p = products.find(x => x.id === a.product_id);
      if (!p) continue;
      candidates.push({ id: p.id, label: p.name, base: a.alias, score: scoreCandidate(q, a.alias), unit: p.default_unit || 'g' });
    }
    const best = new Map();
    for (const c of candidates) {
      const prev = best.get(c.id);
      if (!prev || c.score < prev.score) best.set(c.id, c);
    }
    return Array.from(best.values()).sort((a,b)=>a.score-b.score).slice(0,7);
  }, [nameInput, products, aliases]);

  // résout un nom → id produit (ou création) + renvoie la shelf_life si connue/estimée
  async function resolveProduct(rawName) {
    const q = rawName.trim();
    if (!q) throw new Error('Nom vide');

    let best = null;
    for (const p of products) {
      const s = scoreCandidate(q, p.name);
      if (best===null || s < best.score) best = { type:'product', id:p.id, name:p.name, unit:p.default_unit||'g', score:s, category:p.category, shelf:p.shelf_life_days };
    }
    for (const a of aliases) {
      const p = products.find(x=>x.id===a.product_id);
      if (!p) continue;
      const s = scoreCandidate(q, a.alias);
      if (best===null || s < best.score) best = { type:'alias', id:p.id, name:p.name, unit:p.default_unit||'g', score:s, category:p.category, shelf:p.shelf_life_days, alias:a.alias };
    }

    if (best && best.score <= 2) {
      // on enregistre l'alias tapé si différent
      const typed = strip(q), canonical = strip(best.name);
      if (typed && canonical && typed !== canonical) {
        await supabase.from('product_aliases').insert({ product_id: best.id, alias: q }).catch(()=>{});
      }
      const shelfDays = Number(best.shelf) || guessShelfLifeDays(best.name, best.category);
      return { id: best.id, unit: best.unit, created: false, canonicalName: best.name, shelfDays };
    }

    // sinon création
    let canonical = toTitle(pluralizeSoft(q));
    const already = products.find(p => strip(p.name) === strip(canonical));
    if (already) {
      const shelfDays = Number(already.shelf_life_days) || guessShelfLifeDays(already.name, already.category);
      return { id: already.id, unit: already.default_unit||'g', created:false, canonicalName: already.name, shelfDays };
    }

    // estimer une shelf life par défaut (catégorie inconnue ici → nom seul)
    const guessedDays = guessShelfLifeDays(canonical, '');
    const { data: ins, error } = await supabase
      .from('products_catalog')
      .insert({ name: canonical, default_unit: 'g', shelf_life_days: guessedDays })
      .select('id,name,default_unit,category,shelf_life_days').single();
    if (error) throw error;

    await supabase.from('product_aliases').insert({ product_id: ins.id, alias: q }).catch(()=>{});

    setProducts(prev => [...prev, ins]);

    return { id: ins.id, unit: ins.default_unit || 'g', created: true, canonicalName: ins.name, shelfDays: guessedDays };
  }

  // prévisualiser la DLC si l’utilisateur ne renseigne pas le champ
  useEffect(() => {
    (async () => {
      if (!nameInput.trim() || dlc) { setPreviewDlc(null); return; }
      try {
        const r = await resolveProduct(nameInput);
        const when = addDaysISO(r.shelfDays || 7);
        setPreviewDlc(when);
      } catch { setPreviewDlc(null); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameInput, dlc]);

  async function addLot(e) {
    e.preventDefault();
    if (!nameInput.trim() || !qty) return alert('Produit et quantité requis.');
    setSaving(true);
    try {
      const r = await resolveProduct(nameInput);

      // après avoir obtenu `r = await resolveProduct(nameInput)` :
      const prodRow = products.find(p=>p.id===r.id);
      if (prodRow && (prodRow.density_g_per_ml==null || prodRow.grams_per_unit==null)) {
        const { estimateProductMeta } = await import('@/lib/meta');
        const est = estimateProductMeta({ name: prodRow.name, category: prodRow.category });
        const patch = {};
        if (prodRow.density_g_per_ml==null && est.confidence_density>=0.6) patch.density_g_per_ml = est.density_g_per_ml;
        if (prodRow.grams_per_unit==null && est.grams_per_unit && est.confidence_unit>=0.6) patch.grams_per_unit = est.grams_per_unit;
        if (Object.keys(patch).length) {
          await supabase.from('products_catalog').update(patch).eq('id', prodRow.id);
          setProducts(prev => prev.map(p => p.id===prodRow.id ? {...p, ...patch} : p));
        }
      }

      // si pas de DLC saisie, appliquer notre proposition
      const finalDlc = dlc || addDaysISO(r.shelfDays || 7);
      // si le produit n'avait pas de shelf_life_days en base, on l’écrit avec l’estimation (apprentissage)
      if (!r.created) {
        const prod = products.find(p=>p.id===r.id);
        if (prod && (prod.shelf_life_days == null || prod.shelf_life_days === 0)) {
          await supabase.from('products_catalog').update({ shelf_life_days: r.shelfDays }).eq('id', r.id).catch(()=>{});
          setProducts(prev => prev.map(p => p.id===r.id ? {...p, shelf_life_days: r.shelfDays} : p));
        }
      }

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

      {/* mini formulaire ajouter un lot avec auto-complétion + auto-DLC */}
      <form onSubmit={addLot} className="card" style={{display:'grid',gap:8,maxWidth:660}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
          <label>Produit
            <div style={{position:'relative'}}>
              <input
                ref={inputRef}
                className="input"
                placeholder="Ex: Tomates"
                value={nameInput}
                onChange={e=>setNameInput(e.target.value)}
                autoComplete="off"
                required
              />
              {/* suggestions */}
              {nameInput.trim() && suggestions.length>0 && (
                <div style={{
                  position:'absolute', top:'100%', left:0, right:0, zIndex:20,
                  background:'#fff', border:'1px solid #dcdce0', borderTop:'none',
                  borderBottomLeftRadius:10, borderBottomRightRadius:10, boxShadow:'0 6px 18px rgba(0,0,0,.06)'
                }}>
                  {suggestions.map(s => (
                    <div
                      key={s.id}
                      style={{padding:'8px 10px', cursor:'pointer'}}
                      onMouseDown={()=>{
                        setNameInput(s.label);
                        const p = products.find(x=>x.id===s.id);
                        if (p?.default_unit) setUnit(p.default_unit);
                      }}
                    >
                      {s.label} <span style={{opacity:.6,fontSize:12}}>({s.unit||'g'})</span>
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
            <input className="input" required value={unit} onChange={e=>setUnit(e.target.value)}/>
          </label>
          <label>DLC
            <input className="input" type="date" value={dlc} onChange={e=>setDlc(e.target.value)}/>
            {!dlc && previewDlc && (
              <div style={{fontSize:12,opacity:.7,marginTop:4}}>
                Suggestion : {previewDlc} (sera appliquée si tu laisses vide)
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
      {Object.entries(groups).map(([name, items]) => (
        <div key={name} className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
            <strong>{name}</strong>
            <span style={{opacity:.6,fontSize:12}}>{items.length} lot(s)</span>
          </div>
          <div style={{marginTop:6}}>
            {items.map(i => (
              <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,padding:'6px 0'}}>
                <div>• {i.qty} {i.unit} — DLC {i.dlc || '—'}</div>
                <IconButton title="Retirer" onClick={()=>removeLot(i.id)}>✖️</IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!loading && lots.length===0 && <p>Aucun produit ici.</p>}
    </div>
  );
}
