'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IconButton from '@/components/ui/IconButton';

export default function Pantry() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [counts, setCounts] = useState({});
  const [editMode, setEditMode] = useState(false);

  // nouveau lieu (form en dehors des cartes)
  const [showNew, setShowNew] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', icon: '📦' });

  // renommer (uniquement en mode édition)
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  // ajout lot rapide : choix du lieu (tu es redirigé vers la page du lieu)
  const [targetLocId, setTargetLocId] = useState('');

  async function refresh() {
    const { data: locs } = await supabase.from('locations').select('*').order('sort_order');
    setLocations(locs || []);
    // compter les lots par lieu
    const { data: lots } = await supabase.from('inventory_lots').select('id, location_id');
    const c = {};
    (lots || []).forEach(l => { c[l.location_id] = (c[l.location_id] || 0) + 1; });
    setCounts(c);
    if (!targetLocId && (locs||[]).length) setTargetLocId(locs[0].id);
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
    setShowNew(false);
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
    if ((counts[id] || 0) > 0) return alert("Ce lieu contient encore des lots. Déplace-les avant de supprimer.");
    if (!confirm('Supprimer ce lieu ?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return alert(error.message);
    await refresh();
  }

  return (
    <div>
      <h1>Garde-manger</h1>

      {/* barre d’outils */}
      <div className="toolbar">
        <button className="btn" onClick={()=>setShowNew(v=>!v)}>
          {showNew ? 'Annuler nouveau lieu' : '➕ Nouveau lieu'}
        </button>

        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span className="badge">Ajouter un lot dans :</span>
          <select value={targetLocId} onChange={e=>setTargetLocId(e.target.value)}>
            {(locations||[]).map(l=> <option key={l.id} value={l.id}>{l.icon || '📦'} {l.name}</option>)}
          </select>
          <button className="btn primary" onClick={()=> targetLocId && router.push(`/pantry/${targetLocId}`)}>
            Ouvrir le lieu
          </button>
        </div>

        <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
          <span className="badge">Mode édition</span>
          <button className="btn" onClick={()=>setEditMode(v=>!v)}>{editMode ? 'Désactiver' : 'Activer'}</button>
        </div>
      </div>

      {/* formulaire nouveau lieu (en dehors des cartes) */}
      {showNew && (
        <form onSubmit={createLocation} className="card" style={{display:'grid',gap:8,maxWidth:560,margin:'12px 0'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
            <label>Nom
              <input className="input" value={newLoc.name} onChange={e=>setNewLoc(s=>({...s,name:e.target.value}))} placeholder="Placard" />
            </label>
            <label>Icône
              <input className="input" value={newLoc.icon} onChange={e=>setNewLoc(s=>({...s,icon:e.target.value}))} placeholder="📦" />
            </label>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn primary" type="submit">Créer le lieu</button>
            <button className="btn" type="button" onClick={()=>{setShowNew(false);setNewLoc({name:'',icon:'📦'});}}>Annuler</button>
          </div>
        </form>
      )}

      {/* cartes lieux */}
      <div className="grid auto" style={{marginTop:12}}>
        {locations.map(loc => (
          <div key={loc.id} className="card" style={{position:'relative',minHeight:118}}>
            {/* overlay d’actions visible UNIQUEMENT en mode édition */}
            {editMode && (
              <div style={{position:'absolute',top:8,right:8,display:'flex',gap:6}}>
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
            )}

            <Link href={`/pantry/${loc.id}`} style={{textDecoration:'none',color:'inherit'}}>
              <div style={{fontSize:28,marginBottom:6}}>{loc.icon || '📦'}</div>

              {renamingId === loc.id ? (
                <input
                  autoFocus
                  className="input"
                  value={renameVal}
                  onChange={e=>setRenameVal(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') renameLocation(loc.id); if(e.key==='Escape') setRenamingId(null); }}
                />
              ) : (
                <div style={{fontWeight:600}}>{loc.name}</div>
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
