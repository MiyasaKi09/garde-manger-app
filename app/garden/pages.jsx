'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
// Optionnel si tu utilises déjà un garde d'auth :
import AuthGate from '@/components/AuthGate';

/* ---------- Helpers ---------- */
const TOOL_TYPES = ['bed','raised-bed','row','tree','path'];
const PLANT_CHOICES = [
  '🥕 Carottes','🥬 Laitue','🍅 Tomates','🥒 Concombres','🌶️ Piments',
  '🧄 Ail','🧅 Oignons','🥔 Pommes de terre','🌿 Basilic','🌿 Persil','🌿 Menthe','🍓 Fraises'
];

function todayISO(){ return new Date().toISOString().slice(0,10); }
function plusMonthsISO(m=3){ const d=new Date(); d.setMonth(d.getMonth()+m); return d.toISOString().slice(0,10); }

/* ---------- Page ---------- */
export default function GardenPage(){
  return (
    <AuthGate>
      <GardenInner/>
    </AuthGate>
  );
}

function GardenInner(){
  const [userId,setUserId]=useState(null);

  const [areas,setAreas]=useState([]);      // [{id,type,x,y,width,height}]
  const [plants,setPlants]=useState([]);    // [{id,area_id,label,x,y,plant_date,harvest_date,status,last_care}]
  const [loading,setLoading]=useState(true);

  // UI state
  const [activeTool,setActiveTool]=useState('bed');
  const canvasRef = useRef(null);
  const drawingRef = useRef({ is:false, start:null });
  const [selected,setSelected]=useState(null); // { kind:'area'|'plant', id:<uuid> }

  // Modal planter
  const [modalOpen,setModalOpen]=useState(false);
  const [modalPoint,setModalPoint]=useState({x:0,y:0, areaId:null});
  const [modalPlant,setModalPlant]=useState({ label:'🍅 Tomates', plant_date: todayISO(), harvest_date: plusMonthsISO(3) });

  // Charger session & données
  useEffect(()=>{
    (async()=>{
      const { data: { user } } = await supabase.auth.getUser();
      if(!user){ setLoading(false); return; }
      setUserId(user.id);

      // Charger zones
      const { data: a, error: ea } = await supabase
        .from('garden_areas')
        .select('*')
        .order('created_at', { ascending:false });
      if(ea) console.error(ea);
      setAreas(a||[]);

      // Charger plantes
      const { data: p, error: ep } = await supabase
        .from('garden_plants')
        .select('*')
        .order('created_at', { ascending:false });
      if(ep) console.error(ep);
      setPlants(p||[]);
      setLoading(false);
    })();
  },[]);

  /* ---------- Canvas events ---------- */
  function onMouseDown(e){
    if(activeTool==='plant') return; // la plantation se fait au click simple
    const rect = canvasRef.current.getBoundingClientRect();
    drawingRef.current.is = true;
    drawingRef.current.start = { x:e.clientX-rect.left, y:e.clientY-rect.top };
  }
  async function onMouseUp(e){
    if(!drawingRef.current.is || activeTool==='plant') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const start = drawingRef.current.start;
    const end   = { x:e.clientX-rect.left, y:e.clientY-rect.top };
    drawingRef.current.is=false; drawingRef.current.start=null;

    // Créer une zone
    const x = Math.round(Math.min(start.x,end.x));
    const y = Math.round(Math.min(start.y,end.y));
    const width  = Math.max(50, Math.round(Math.abs(end.x-start.x)));
    const height = Math.max(50, Math.round(Math.abs(end.y-start.y)));

    const row = {
      user_id: userId,
      type: activeTool,
      x, y, width, height
    };
    const { data, error } = await supabase.from('garden_areas').insert(row).select('*').single();
    if(error){ alert(error.message); return; }
    setAreas(prev=>[data, ...prev]);
  }
  function onClickCanvas(e){
    if(activeTool!=='plant') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: Math.round(e.clientX-rect.left), y: Math.round(e.clientY-rect.top) };

    // trouver la zone cliquée
    const area = areas.find(a =>
      point.x>=a.x && point.x<=a.x+a.width &&
      point.y>=a.y && point.y<=a.y+a.height &&
      (a.type==='bed' || a.type==='raised-bed' || a.type==='row' || a.type==='tree')
    );
    if(!area) return;
    setModalPoint({x:point.x, y:point.y, areaId:area.id});
    setModalPlant({ label:'🍅 Tomates', plant_date: todayISO(), harvest_date: plusMonthsISO(3) });
    setModalOpen(true);
  }

  /* ---------- Actions zones ---------- */
  function selectArea(id){ setSelected({kind:'area', id}); }
  async function deleteArea(id){
    if(!confirm('Supprimer cette zone et ses plantes ?')) return;
    const { error } = await supabase.from('garden_areas').delete().eq('id', id);
    if(error) return alert(error.message);
    setAreas(prev=>prev.filter(a=>a.id!==id));
    setPlants(prev=>prev.filter(p=>p.area_id!==id));
    setSelected(null);
  }

  /* ---------- Actions plantes ---------- */
  function selectPlant(id){ setSelected({kind:'plant', id}); }
  async function createPlant(){
    const row = {
      user_id: userId,
      area_id: modalPoint.areaId,
      label: modalPlant.label,
      x: modalPoint.x,
      y: modalPoint.y,
      plant_date: modalPlant.plant_date || null,
      harvest_date: modalPlant.harvest_date || null,
      status: 'growing'
    };
    const { data, error } = await supabase.from('garden_plants').insert(row).select('*').single();
    if(error){ alert(error.message); return; }
    setPlants(prev=>[data, ...prev]);
    setModalOpen(false);
  }
  async function carePlant(id){
    const { data:updated, error } = await supabase
      .from('garden_plants')
      .update({ last_care: todayISO() })
      .eq('id', id)
      .select('*').single();
    if(error) return alert(error.message);
    setPlants(prev=>prev.map(p=>p.id===id?updated:p));
  }
  async function harvestPlant(id){
    // Ici on supprime la plante (tu pourras plus tard ajouter "ajout au stock" si tu veux)
    if(!confirm('Récolter et retirer la plante ?')) return;
    const { error } = await supabase.from('garden_plants').delete().eq('id', id);
    if(error) return alert(error.message);
    setPlants(prev=>prev.filter(p=>p.id!==id));
    if(selected?.kind==='plant' && selected.id===id) setSelected(null);
  }
  async function deletePlant(id){
    if(!confirm('Supprimer cette plante ?')) return;
    const { error } = await supabase.from('garden_plants').delete().eq('id', id);
    if(error) return alert(error.message);
    setPlants(prev=>prev.filter(p=>p.id!==id));
    if(selected?.kind==='plant' && selected.id===id) setSelected(null);
  }

  /* ---------- Sélections ---------- */
  const selectedArea = useMemo(()=> selected?.kind==='area' ? areas.find(a=>a.id===selected.id) : null, [selected,areas]);
  const selectedPlant = useMemo(()=> selected?.kind==='plant' ? plants.find(p=>p.id===selected.id) : null, [selected,plants]);

  /* ---------- Stats & alertes ---------- */
  const readyPlants = useMemo(()=>{
    const now = new Date();
    return plants.filter(p => p.harvest_date && new Date(p.harvest_date) <= now);
  },[plants]);
  const careNeeded = useMemo(()=>{
    const now = new Date();
    return plants.filter(p=>{
      if(!p.last_care){
        if(!p.plant_date) return true;
        const days = (now - new Date(p.plant_date)) / 86400000;
        return days > 14;
      }
      const days = (now - new Date(p.last_care)) / 86400000;
      return days > 7;
    });
  },[plants]);

  /* ---------- Rendu ---------- */
  if(loading) return <div className="p-6">Chargement…</div>;
  if(!userId) return (
    <div className="p-6">
      <div className="card" style={{maxWidth:520}}>
        <h2>Connexion requise</h2>
        <p>Connecte-toi pour accéder au potager.</p>
        <Link className="btn" href="/login?redirect=/garden">Se connecter</Link>
      </div>
    </div>
  );

  return (
    <div className="garden-page">
      {/* Header style Claude */}
      <header className="header">
        <div className="logo">
          <div className="mycorrhiza-icon"></div>
          <h1>Myko</h1>
        </div>
        <nav className="nav">
          <Link className="nav-btn" href="/">🏠 Accueil</Link>
          <button className="nav-btn active" onClick={()=>{}}>🌱 Potager</button>
          <Link className="nav-btn" href="/pantry">🏺 Stocks</Link>
          <Link className="nav-btn" href="/recipes">📖 Recettes</Link>
        </nav>
      </header>

      <div className="page active">
        <h2 className="page-title">🌱 Mon Potager Virtuel</h2>
        <p className="page-subtitle">Créez et gérez votre jardin schématique (données synchronisées)</p>

        <div className="garden-container">
          {/* Outils */}
          <aside className="garden-tools">
            <section className="tool-section">
              <h3>🛠️ Outils de création</h3>
              <div className="tool-grid">
                {TOOL_TYPES.map(t=>(
                  <button key={t}
                    className={`tool-btn ${activeTool===t?'active':''}`}
                    onClick={()=>setActiveTool(t)}
                    title={t}
                  >
                    <span className="tool-icon">{iconFor(t)}</span>
                    <span>{labelFor(t)}</span>
                  </button>
                ))}
                <button className={`tool-btn ${activeTool==='plant'?'active':''}`} onClick={()=>setActiveTool('plant')}>
                  <span className="tool-icon">🌱</span>
                  <span>Planter</span>
                </button>
              </div>
            </section>

            <section className="tool-section">
              <h3>🎛️ Actions</h3>
              <button className="btn" onClick={async()=>{
                if(!confirm('Effacer tout le jardin ?')) return;
                // Supprime en base (ordre: plantes puis zones)
                const { error: ep } = await supabase.from('garden_plants').delete().neq('id','00000000-0000-0000-0000-000000000000');
                if(ep) return alert(ep.message);
                const { error: ea } = await supabase.from('garden_areas').delete().neq('id','00000000-0000-0000-0000-000000000000');
                if(ea) return alert(ea.message);
                setPlants([]); setAreas([]); setSelected(null);
              }}>Effacer tout</button>
            </section>

            {/* Infos sélection */}
            <section className="tool-section">
              <h3>ℹ️ Informations</h3>
              {!selected && <p>Sélectionnez un élément dans le canevas…</p>}
              {selectedArea && (
                <div className="plant-info">
                  <h4>{labelFor(selectedArea.type)}</h4>
                  <p><b>Dimensions:</b> {selectedArea.width}×{selectedArea.height}px</p>
                  <p><b>Plantes dans la zone:</b> {plants.filter(p=>p.area_id===selectedArea.id).length}</p>
                  <button className="btn btn-small" style={{background:'#dc3545'}} onClick={()=>deleteArea(selectedArea.id)}>Supprimer la zone</button>
                </div>
              )}
              {selectedPlant && (
                <div className="plant-info">
                  <h4>{selectedPlant.label}</h4>
                  <p><b>Plantée le:</b> {selectedPlant.plant_date||'—'}</p>
                  <p><b>Récolte prévue:</b> {selectedPlant.harvest_date||'—'}</p>
                  {selectedPlant.last_care && <p><b>Dernier soin:</b> {selectedPlant.last_care}</p>}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap', marginTop:8}}>
                    <button className="btn btn-small" onClick={()=>carePlant(selectedPlant.id)}>💧 Entretenir</button>
                    <button className="btn btn-small" onClick={()=>harvestPlant(selectedPlant.id)}>🌾 Récolter</button>
                    <button className="btn btn-small" style={{background:'#dc3545'}} onClick={()=>deletePlant(selectedPlant.id)}>Supprimer</button>
                  </div>
                </div>
              )}
            </section>

            {/* Alertes & Suggestions */}
            <section className="tool-section">
              <h3>⚠️ Alertes</h3>
              <div className="alerts">
                {readyPlants.length>0 && <div className="alert-item">🌾 {readyPlants.length} plante(s) prête(s) à récolter</div>}
                {careNeeded.length>0 && <div className="alert-item">💧 {careNeeded.length} plante(s) ont besoin de soins</div>}
                {readyPlants.length===0 && careNeeded.length===0 && <div className="alert-item">✅ Tout va bien !</div>}
              </div>
              <h3>💡 Suggestions</h3>
              <div className="suggestions">
                <div className="suggestion-item">🌱 Saison: {seasonName()} — idées: {suggestedForSeason().join(', ')}</div>
              </div>
            </section>
          </aside>

          {/* Canevas */}
          <section
            ref={canvasRef}
            className="garden-canvas"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onClick={onClickCanvas}
          >
            {/* Zones */}
            {areas.map(a=>(
              <div key={a.id}
                   className={`garden-element ${classForArea(a.type)} ${selected?.kind==='area'&&selected.id===a.id?'selected':''}`}
                   style={{left:a.x, top:a.y, width:a.width, height:a.height}}
                   onClick={(e)=>{ e.stopPropagation(); selectArea(a.id); }}
              />
            ))}

            {/* Plantes */}
            {plants.map(p=>{
              const ready = p.harvest_date && new Date(p.harvest_date)<=new Date();
              const needsCare = !p.last_care
                ? (p.plant_date ? ((new Date()-new Date(p.plant_date))/86400000>14) : true)
                : ((new Date()-new Date(p.last_care))/86400000>7);
              return (
                <div key={p.id}
                  className={`garden-element plant ${ready?'ready-harvest':''} ${needsCare?'needs-care':''} ${selected?.kind==='plant'&&selected.id===p.id?'selected':''}`}
                  style={{left:p.x-15, top:p.y-15, width:30, height:30}}
                  title={p.label}
                  onClick={(e)=>{ e.stopPropagation(); selectPlant(p.id); }}
                  onDoubleClick={(e)=>{ e.stopPropagation(); if(ready) harvestPlant(p.id); }}
                >
                  {p.label.split(' ')[0]}
                </div>
              );
            })}
          </section>

          {/* Panneau info droite (optionnel : on concentre à gauche pour l’instant) */}
          <aside className="garden-info">
            <h3>📊 Tableau de bord</h3>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">{plants.length}</div>
                <div className="stat-label">Plantes</div>
              </div>
              <div className="stat">
                <div className="stat-number">{areas.length}</div>
                <div className="stat-label">Zones</div>
              </div>
              <div className="stat">
                <div className="stat-number">{readyPlants.length}</div>
                <div className="stat-label">Récoltes</div>
              </div>
            </div>
            <p style={{marginTop:12, opacity:.8}}>
              Astuces : double-clique une plante <em>prête</em> pour la récolter.  
              Utilise l’outil <b>Planter</b> puis clique dans un bac/lit/ligne.
            </p>
          </aside>
        </div>
      </div>

      {/* Modal planter */}
      {modalOpen && (
        <div className="modal show" onClick={()=>setModalOpen(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <span className="close" onClick={()=>setModalOpen(false)}>&times;</span>
            <h3>🌱 Planter ici</h3>
            <div className="form-group">
              <label>Type de plante</label>
              <select className="input" value={modalPlant.label} onChange={e=>setModalPlant(p=>({...p,label:e.target.value}))}>
                {PLANT_CHOICES.map(opt=><option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date de plantation</label>
              <input className="input" type="date" value={modalPlant.plant_date} onChange={e=>setModalPlant(p=>({...p,plant_date:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label>Récolte prévue</label>
              <input className="input" type="date" value={modalPlant.harvest_date} onChange={e=>setModalPlant(p=>({...p,harvest_date:e.target.value}))}/>
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn" onClick={createPlant}>Planter</button>
              <button className="btn" onClick={()=>setModalOpen(false)} style={{background:'#999'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Styles inspirés “Claude” */}
      <style jsx global>{styles}</style>
    </div>
  );
}

/* ---------- Petit “design system” inline ---------- */
function iconFor(t){
  switch(t){
    case 'bed': return '🟤';
    case 'raised-bed': return '📦';
    case 'row': return '📏';
    case 'tree': return '🌳';
    case 'path': return '🛤️';
    default: return '⬛';
  }
}
function labelFor(t){
  switch(t){
    case 'bed': return 'Bac';
    case 'raised-bed': return 'Surélevé';
    case 'row': return 'Ligne';
    case 'tree': return 'Zone arbre';
    case 'path': return 'Allée';
    default: return t;
  }
}
function classForArea(t){
  return ({
    'bed':'bed',
    'raised-bed':'raised-bed',
    'row':'row',
    'tree':'tree-area',
    'path':'path'
  }[t] || 'bed');
}
function seasonName(){
  const m = new Date().getMonth();
  return (['Hiver','Hiver','Printemps','Printemps','Printemps','Été','Été','Été','Automne','Automne','Automne','Hiver'])[m];
}
function suggestedForSeason(){
  const m = new Date().getMonth();
  const map = {
    0:['🥕 Carottes','🧅 Oignons'],
    1:['🥬 Laitue','🌿 Persil'],
    2:['🥔 Pommes de terre','🌿 Basilic'],
    3:['🍅 Tomates','🥒 Concombres'],
    4:['🌶️ Piments','🍓 Fraises'],
    5:['🧄 Ail','🌿 Menthe'],
    6:['🥬 Laitue','🥕 Carottes'],
    7:['🧅 Oignons','🌿 Persil'],
    8:['🥔 Pommes de terre','🍅 Tomates'],
    9:['🥕 Carottes','🧄 Ail'],
    10:['🥬 Laitue','🌿 Menthe'],
    11:['🧅 Oignons','🌿 Basilic']
  };
  return map[m] || ['🥬 Laitue','🥕 Carottes'];
}

/* ---------- CSS (reprend l’esthétique de Claude) ---------- */
const styles = `
:root {
  --primary-green: #2d5016;
  --accent-green: #6b8e23;
  --light-green: #9acd32;
  --warm-beige: #f5f5dc;
  --earth-brown: #8b4513;
  --soft-white: #fefefe;
  --shadow: rgba(45, 80, 22, 0.1);
  --mycorrhiza: #d2b48c;
  --soil-brown: #8B4513;
  --plant-green: #228B22;
}
.garden-page { font-family: Georgia, serif; background: linear-gradient(135deg, var(--warm-beige) 0%, #f0f8e8 100%); color: var(--primary-green); min-height: 100vh; }
.header { background: rgba(255,255,255,.95); backdrop-filter: blur(10px); box-shadow: 0 2px 20px var(--shadow); padding: 1rem 2rem; display:flex; justify-content:space-between; align-items:center; }
.logo { display:flex; align-items:center; gap:1rem; }
.mycorrhiza-icon { width:40px; height:40px; position:relative; }
.mycorrhiza-icon::before, .mycorrhiza-icon::after { content:''; position:absolute; border-radius:50%; background: var(--accent-green); }
.mycorrhiza-icon::before { width:15px; height:15px; top:5px; left:5px; box-shadow:20px 20px 0 -3px var(--earth-brown); }
.mycorrhiza-icon::after { width:2px; height:25px; top:10px; left:12px; border-radius:2px; background: var(--mycorrhiza); transform: rotate(45deg); }
h1 { font-size:2rem; color:var(--primary-green); font-weight:normal; }
.nav { display:flex; gap:1rem; }
.nav-btn { padding:.8rem 1.5rem; background:transparent; border:2px solid var(--accent-green); border-radius:25px; color: var(--accent-green); cursor:pointer; transition:.3s; }
.nav-btn.active, .nav-btn:hover { background: var(--accent-green); color:#fff; transform: translateY(-2px); }

.page { padding:2rem; max-width:1400px; margin:0 auto; }
.page-title { font-size:2.2rem; text-align:center; margin-bottom: .5rem; }
.page-subtitle { text-align:center; font-style:italic; color:var(--accent-green); margin-bottom: 1.5rem; }

.garden-container { display:grid; grid-template-columns: 300px 1fr 300px; gap:2rem; min-height: 70vh; }
.garden-tools, .garden-info { background: rgba(255,255,255,.95); border-radius:20px; padding:1.5rem; box-shadow: 0 8px 32px var(--shadow); overflow:auto; }
.garden-canvas { background: var(--soil-brown); border-radius:20px; position:relative; overflow:hidden; box-shadow: inset 0 0 50px rgba(0,0,0,.2); cursor: crosshair; min-height: 60vh; }

.tool-section { margin-bottom: 1.6rem; }
.tool-section h3 { color: var(--primary-green); margin-bottom:.8rem; border-bottom: 2px solid var(--mycorrhiza); padding-bottom:.4rem; }
.tool-grid { display:grid; grid-template-columns: 1fr 1fr; gap:.6rem; }
.tool-btn { padding:.8rem; border:2px solid var(--accent-green); background:#fff; border-radius:10px; cursor:pointer; font-size:.9rem; transition:.2s; display:flex; flex-direction:column; align-items:center; gap:.3rem; }
.tool-btn:hover, .tool-btn.active { background: var(--accent-green); color:#fff; transform: scale(1.05); }
.tool-icon { font-size:1.5rem; }

.garden-element { position:absolute; border:2px solid transparent; transition:.2s; user-select:none; }
.garden-element.selected { border-color: var(--light-green); box-shadow: 0 0 15px var(--light-green); }
.bed { background: var(--earth-brown); border-radius:10px; border:3px solid #654321; }
.raised-bed { background: linear-gradient(145deg, #a0522d, var(--earth-brown)); border-radius:15px; border:4px solid #654321; box-shadow: 0 5px 15px rgba(0,0,0,.3); }
.row { background: linear-gradient(90deg, var(--earth-brown), #a0522d); border-radius:5px; border:2px solid #654321; }
.tree-area { background: radial-gradient(circle, var(--plant-green), #2e7d32); border-radius:50%; border:3px solid #1b5e20; }
.path { background: linear-gradient(45deg, #deb887, #d2b48c); border-radius:5px; border:1px solid #cd853f; }

.plant { background: var(--plant-green); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.2rem; color:#fff; border:2px solid #1b5e20; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
.plant.ready-harvest { background: var(--light-green); animation: pulse 2s infinite; cursor:pointer; }
.plant.needs-care { border-color: #ff9800; box-shadow: 0 0 10px #ff9800; }
@keyframes pulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.1) } }

.plant-info { background: rgba(255,255,255,.95); padding:1rem; border-radius:10px; margin-bottom:1rem; border-left:4px solid var(--accent-green); }
.stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:1rem; margin-top:1rem; }
.stat { background: rgba(107,142,35,.1); padding:1rem; border-radius:10px; text-align:center; }
.stat-number { font-size:2rem; font-weight:700; color: var(--accent-green); }

.btn { background: linear-gradient(135deg, var(--accent-green), var(--light-green)); color:#fff; border:none; padding:.6rem 1.1rem; border-radius:25px; cursor:pointer; transition:.2s; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(107,142,35,.3); }
.btn-small { padding:.35rem .8rem; font-size:.85rem; border-radius:15px; }
.input { width:100%; padding:.65rem .8rem; border:2px solid var(--mycorrhiza); border-radius:10px; background:#fff; }

.alerts { background:#fff3cd; border:2px solid #ffc107; border-radius:10px; padding:1rem; margin-bottom:1rem; }
.alert-item { padding:.4rem 0; border-bottom:1px solid #ffc107; }
.alert-item:last-child { border-bottom:none; }
.suggestions { background:#e8f5e8; border:2px solid var(--plant-green); border-radius:10px; padding:1rem; margin-top:1rem; }
.suggestion-item { padding:.5rem 0; border-bottom:1px solid var(--plant-green); }
.suggestion-item:last-child { border-bottom:none; }

.modal { position:fixed; inset:0; background: rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal-content { background:#fff; padding:2rem; border-radius:20px; width:min(500px, 92vw); box-shadow: 0 20px 60px rgba(0,0,0,.3); position:relative; }
.close { position:absolute; right:16px; top:8px; font-size:2rem; cursor:pointer; color: var(--accent-green); }

@media (max-width: 1200px) {
  .garden-container { grid-template-columns: 1fr; grid-template-rows: auto auto 1fr; }
}
`;
