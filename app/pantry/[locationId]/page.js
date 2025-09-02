'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

// ---------- utils fuzzy ----------
const strip = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
function levenshtein(a, b) {
  a = strip(a); b = strip(b);
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({length: m+1}, (_,i)=>[i, ...Array(n).fill(0)]);
  for (let j=1;j<=n;j++) dp[0][j]=j;
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
  if (t.startsWith(q)) return 0;                // parfait début
  if (t.includes(q))  return 1;                // contient
  return levenshtein(q, t);                    // distance
}
const toTitle = (s) => s ? s.trim().replace(/\s+/g,' ').replace(/^.| [a-z]/g, m => m.toUpperCase()) : s;
const pluralizeSoft = (s) => {
  const t = s.trim();
  // Règle très simple: si >2 lettres et ne finit pas par 's', ajoute 's' (évite "Lait")
  return t.length>2 && !/[sxz]$/i.test(t) && !t.endsWith('s') ? t + 's' : t;
};

// ---------- page ----------
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => { const k = keyFn(item); (acc[k]=acc[k]||[]).push(item); return acc; }, {});
}

export default function LocationDetail() {
  const { locationId } = useParams();
  const [locName, setLocName] = useState('…');
  const [lots, setLots] = useState([]);

  // catalogue + alias
  const [products, setProducts] = useState([]);            // [{id,name,default_unit}]
  const [aliases, setAliases] = useState([]);              // [{product_id, alias}]
  const [loading, setLoading] = useState(true);

  // formulaire ajout
  const [nameInput, setNameInput] = useState('');          // saisie libre
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [dlc, setDlc] = useState('');
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

    const { data: prods } = await supabase.from('products_catalog').select('id,name,default_unit').order('name');
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

    // noms directs
    for (const p of products) {
      candidates.push({ id: p.id, label: p.name, base: p.name, score: scoreCandidate(q, p.name), unit: p.default_unit || 'g' });
    }
    // alias → pointe vers le produit
    for (const a of aliases) {
      const p = products.find(x => x.id === a.product_id);
      if (!p) continue;
      candidates.push({ id: p.id, label: p.name, base: a.alias, score: scoreCandidate(q, a.alias), unit: p.default_unit || 'g' });
    }

    // dédup par id en gardant le meilleur score
    const best = new Map();
    for (const c of candidates) {
      const prev = best.get(c.id);
      if (!prev || c.score < prev.score) best.set(c.id, c);
    }
    return Array.from(best.values()).sort((a,b)=>a.score-b.score).slice(0,7);
  }, [nameInput, products, aliases]);

  // résout un nom → id produit (ou création)
  async function resolveProductId(rawName) {
    const q = rawName.trim();
    if (!q) throw new Error('Nom vide');

    // 1) essaie correspondance existante
    let best = null;
    for (const p of products) {
      const s = scoreCandidate(q, p.name);
      if (best===null || s < best.score) best = { type:'product', id:p.id, name:p.name, unit:p.default_unit||'g', score:s };
    }
    for (const a of aliases) {
      const p = products.find(x=>x.id===a.product_id);
      if (!p) continue;
      const s = scoreCandidate(q, a.alias);
      if (best===null || s < best.score) best = { type:'alias', id:p.id, name:p.name, unit:p.default_unit||'g', score:s, alias:a.alias };
    }

    // Seuils “bonne” correspondance (faute légère ou proche)
    if (best && best.score <= 2) {
      // optionnel: si l'utilisateur a tapé une variante différente du nom canonique, on l'enregistre en alias
      const typed = strip(q), canonical = strip(best.name);
      if (typed && canonical && typed !== canonical) {
        await supabase.from('product_aliases').insert({ product_id: best.id, alias: q }).catch(()=>{});
      }
      return { id: best.id, unit: best.unit, created: false, canonicalName: best.name };
    }

    // 2) sinon on CRÉE le produit (nom canonique propre)
    let canonical = toTitle(pluralizeSoft(q)); // "tomate" -> "Tomates"
    // évite doublon exact qui pourrait exister mais non scoré
    const already = products.find(p => strip(p.name) === strip(canonical));
    if (already) return { id: already.id, unit: already.default_unit||'g', created:false, canonicalName: already.name };

    const { data: ins, error } = await supabase
      .from('products_catalog')
      .insert({ name: canonical, default_unit: 'g' })
      .select('id,name,default_unit').single();
    if (error) throw error;

    // on garde l’orthographe saisie comme alias
    await supabase.from('product_aliases').insert({ product_id: ins.id, alias: q }).catch(()=>{});

    // maj cache local minimal
    setProducts(prev => [...prev, ins]);

    return { id: ins.id, unit: ins.default_unit || 'g', created: true, canonicalName: ins.name };
  }

  async function addLot(e) {
    e.preventDefault();
    if (!nameInput.trim() || !qty) return alert('Produit et quantité requis.');
    setSaving(true);
    try {
      const { id: product_id, unit: defaultUnit } = await resolveProductId(nameInput);
      const finalUnit = unit || defaultUnit || 'g';
      const { error } = await supabase.from('inventory_lots').insert({
        product_id,
        location_id: locationId,
        qty: Number(qty),
        unit: finalUnit,
        dlc: dlc || null,
        source: 'achat'
      });
      if (error) throw error;
      // reset form
      setNameInput('');
      setQty('');
      setUnit('g');
      setDlc('');
      await refresh();
      // focus à nouveau sur le champ
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

      {/* mini formulaire ajouter un lot avec autocomplétion */}
      <form onSubmit={addLot} className="card" style={{display:'grid',gap:8,maxWidth:620}}>
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
                        setNameInput(s.label); // nom canonique
                        setUnit(s.unit || 'g');
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
