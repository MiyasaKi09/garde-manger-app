'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

export default function Pantry() {
  const [locations, setLocations] = useState([]);
  const [counts, setCounts] = useState({});
  const [adding, setAdding] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', icon: '📦' });
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  async function refresh() {
    const { data: locs } = await supabase.from('locations').select('*').order('sort_order');
    setLocations(locs || []);
    // compter les lots par lieu
    const { data: lots } = await supabase.from('inventory_lots').select('id, location_id');
    const c = {};
    (lots || []).forEach(l => { c[l.location_id] = (c[l.location_id] || 0) + 1; });
    setCounts(c);
  }

  useEffect(() => { refresh(); }, []);

  async function createLocation(e) {
    e?.preventDefault?.();
    if (!newLoc.name.trim()) return;
    const maxOrder = locations.reduce((m, l) => Math.max(m, l.sort_order || 0), 0);
    const { error } = await supabase.from('locations').insert({
      name: newLoc.name.trim(),
      icon: newLoc.icon || '📦',
      sort_order: maxOrder + 1
    });
    if (error) return alert(error.message);
    setNewLoc({ name: '', icon: '📦' });
    setAdding(false);
    await refresh();
  }

  async function renameLocation(id) {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    const { error } = await supabase.from('locations').update({ name: renameVal.trim() }).eq('id', id);
    if (error) return alert(error.message);
    setRenamingId(null);
    await refresh();
  }

  async function deleteLocation(id) {
    // sécurité: ne supprime que si aucun lot
    if ((counts[id] || 0) > 0) return alert("Ce lieu contient encore des lots. Déplace-les avant de supprimer.");
    if (!confirm('Supprimer ce lieu ?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return alert(error.message);
    await refresh();
  }

  return (
    <div>
      <h1>Garde-manger</h1>

      {/* Actions rapides (ajouter un lot = renvoie vers le lieu après) */}
      <div style={{margin:'8px 0'}}>
        <Link href="/pantry" style={{textDecoration:'none'}}>
          <span className="badge">➕ Ajouter un lot → depuis un lieu</span>
        </Link>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
        {/* Carte + (nouveau lieu) */}
        <div className="card" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',minHeight:120}}>
          {!adding ? (
            <button onClick={()=>setAdding(true)} style={{padding:10,borderRadius:10,border:'1px dashed #ccc',background:'#fafafa',cursor:'pointer'}}>
              ➕ Nouveau lieu
            </button>
          ) : (
            <form onSubmit={createLocation} style={{display:'grid',gap:8}}>
              <label>Nom
                <input value={newLoc.name} onChange={e=>setNewLoc(s=>({...s,name:e.target.value}))} placeholder="Placard" />
              </label>
              <label>Icône
                <input value={newLoc.icon} onChange={e=>setNewLoc(s=>({...s,icon:e.target.value}))} placeholder="📦" />
              </label>
              <div style={{display:'flex',gap:8}}>
                <button type="submit">Créer</button>
                <button type="button" onClick={()=>{setAdding(false);setNewLoc({name:'',icon:'📦'});}}>Annuler</button>
              </div>
            </form>
          )}
        </div>

        {/* Lieux existants */}
        {locations.map(loc => (
          <div key={loc.id} className="card" style={{position:'relative',minHeight:120}}>
            {/* menu discret en haut à droite */}
            <div style={{position:'absolute',top:8,right:8,display:'flex',gap:4}}>
              {renamingId === loc.id ? (
                <>
                  <IconButton title="Valider" onClick={()=>renameLocation(loc.id)}>✅</IconButton>
                  <IconButton title="Annuler" onClick={()=>setRenamingId(null)}>✖️</IconButton>
                </>
              ) : (
                <>
                  <IconButton title="Renommer" onClick={()=>{setRenamingId(loc.id);setRenameVal(loc.name);}}>✏️</IconButton>
                  <IconButton title="Supprimer" onClick={()=>deleteLocation(loc.id)}>🗑️</IconButton>
                </>
              )}
            </div>

            <Link href={`/pantry/${loc.id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{fontSize:28}}>{loc.icon || '📦'}</div>
              {renamingId === loc.id ? (
                <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} />
              ) : (
                <div><strong>{loc.name}</strong></div>
              )}
              <div style={{opacity:.6,marginTop:6}}>
                {(counts[loc.id]||0)} lot(s)
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
