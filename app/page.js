'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { todayISO } from '@/lib/utils';

// --- helpers UI ---
function Section({ title, children, right }) {
  return (
    <section style={{margin:'16px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12}}>
        <h2 style={{margin:'8px 0'}}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
function Card({ children, urgent=false }) {
  return <div className="card" style={{ borderWidth: urgent ? 2 : 1 }}>{children}</div>;
}
function Stat({ icon, label }) {
  return (
    <div className="card" style={{display:'flex',gap:10,alignItems:'center'}}>
      <div style={{fontSize:22}}>{icon}</div>
      <div style={{lineHeight:1.2}}>{label}</div>
    </div>
  );
}
const addDaysISO = (d) => new Date(Date.now()+d*86400000).toISOString().slice(0,10);
const daysLeft = (dlc) => dlc ? Math.ceil((new Date(dlc) - new Date())/86400000) : null;

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [tasksToday, setTasksToday] = useState([]);
  const [tasksNext, setTasksNext] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [harvestsRecent, setHarvestsRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    const today = todayISO();
    const soon3 = addDaysISO(3);
    const soon7 = addDaysISO(7);

    // 1) Lots (stock)
    const { data: lotsData } = await supabase
      .from('inventory_lots')
      .select('id, product_id, qty, unit, dlc, opened_at, entered_at, product:products_catalog(name,category), location:locations(name)')
      .order('dlc',{ascending:true});
    setLots(lotsData || []);

    // 2) Recettes + ingrédients
    const { data: recipesData } = await supabase
      .from('recipes')
      .select('id, title, time_min, tags, ingredients:recipe_ingredients(product_id, qty, unit, optional, product:products_catalog(name))')
      .order('title');
    setRecipes(recipesData || []);

    // 3) Potager
    // Tâches du jour (et en retard)
    const { data: todayTasks } = await supabase
      .from('care_tasks')
      .select('id, type, due_date, planting:plantings(id, sow_or_plant_date, variety:plant_varieties(species,variety), bed:garden_beds(name))')
      .is('done_at', null).lte('due_date', today).order('due_date',{ascending:true});
    setTasksToday(todayTasks || []);

    // Tâches à venir (7 jours)
    const { data: nextTasks } = await supabase
      .from('care_tasks')
      .select('id, type, due_date, planting:plantings(id, sow_or_plant_date, variety:plant_varieties(species,variety), bed:garden_beds(name))')
      .is('done_at', null).gt('due_date', today).lte('due_date', soon7).order('due_date',{ascending:true});
    setTasksNext(nextTasks || []);

    // Plantations en cours (5 dernières)
    const { data: plantingsData } = await supabase
      .from('plantings')
      .select('id, status, sow_or_plant_date, note, variety:plant_varieties(species,variety), bed:garden_beds(name)')
      .eq('status','en_cours')
      .order('sow_or_plant_date', { ascending:false })
      .limit(5);
    setPlantings(plantingsData || []);

    // Récoltes récentes (7 jours)
    const sevenAgo = addDaysISO(-7);
    const { data: harvestsData } = await supabase
      .from('harvests')
      .select('id, date, qty, unit, planting:plantings(variety:plant_varieties(species,variety))')
      .gte('date', sevenAgo).order('date',{ascending:false}).limit(5);
    setHarvestsRecent(harvestsData || []);

    setLoading(false);
  })() },[]);

  // --- Résumés & alertes ---
  const summary = useMemo(()=>{
    const productsSet = new Set(lots.map(l => l.product_id).filter(Boolean));
    const lotsOpen = lots.filter(l => !!l.opened_at).length;
    const expired = [], urgent = [], soon = [];
    const today = todayISO(), soon3 = addDaysISO(3), soon7 = addDaysISO(7);

    for (const l of lots) {
      if (!l.dlc) continue;
      if (l.dlc < today) expired.push(l);
      else if (l.dlc <= soon3) urgent.push(l);
      else if (l.dlc <= soon7) soon.push(l);
    }
    return {
      totalProducts: productsSet.size,
      totalLots: lots.length,
      lotsOpen,
      expired, urgent, soon
    };
  }, [lots]);

  // --- Recettes suggérées ---
  const suggestedRecipes = useMemo(()=>{
    if (!recipes.length) return [];
    // index disponibilité par produit
    const byProduct = new Map();
    const urgentProducts = new Set();
    const soon3 = addDaysISO(3);
    for (const l of lots) {
      const curr = byProduct.get(l.product_id) || 0;
      byProduct.set(l.product_id, curr + Number(l.qty||0));
      if (l.dlc && l.dlc <= soon3) urgentProducts.add(l.product_id);
    }
    const ok = [];
    const usesUrgent = [];
    for (const r of recipes) {
      const ings = r.ingredients || [];
      // complet dispo ?
      let allOk = true; let touchesUrgent = false;
      for (const ing of ings) {
        const need = Number(ing.qty||0);
        const have = byProduct.get(ing.product_id) || 0;
        if (!ing.optional && have < need) { allOk = false; }
        if (urgentProducts.has(ing.product_id)) touchesUrgent = true;
      }
      if (allOk) ok.push(r);
      else if (touchesUrgent) usesUrgent.push(r);
import Link from 'next/link';
import { useEffect } from 'react';

/** Page d’accueil esthétique, reliée aux vraies pages de l’app */
export default function Home() {
  useEffect(() => {
    // Effet ripple minimal (optionnel)
    function onClick(e){
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains('btn')) return;
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'var(--mycorrhiza)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '1000';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }
    return (ok.length ? ok : usesUrgent).slice(0,3);
  }, [recipes, lots]);

  // --- UI bits ---
  const AlertList = ({ title, items }) => (
    <Section title={title} right={<Link href="/pantry">Tout voir →</Link>}>
      {(!items || items.length===0) ? <Card>Rien ici 🎉</Card> :
        items.slice(0,5).map(i => (
          <Card key={i.id} urgent>
            <div style={{display:'flex',justifyContent:'space-between',gap:8}}>
              <div><strong>{i.product?.name}</strong> — {i.qty} {i.unit} • <em>{i.location?.name||'—'}</em></div>
              <div className="badge">{daysLeft(i.dlc) ?? '—'} j</div>
            </div>
          </Card>
        ))
      }
    </Section>
  );
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div>
      <h1>Myko — Tableau de bord</h1>

      {/* Résumé global */}
      <Section title="Résumé global" right={<Link href="/add">+ Ajouter un lot</Link>}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
          <Stat icon="🥫" label={<><strong>{summary.totalProducts}</strong> produits distincts<br/><small>{summary.totalLots} lots • {summary.lotsOpen} ouverts</small></>} />
          <Stat icon="⚠️" label={<><strong>{summary.urgent.length}</strong> urgents • <strong>{summary.expired.length}</strong> périmés<br/><small>{summary.soon.length} bientôt (≤7j)</small></>} />
          <Stat icon="🌾" label={<><strong>{harvestsRecent.length}</strong> récoltes récentes<br/><small>sur 7 jours</small></>} />
        </div>
      </Section>

      {/* Actions rapides */}
      <Section title="Actions rapides">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
          <Link href="/add"><Card>➕ Ajouter un lot</Card></Link>
          <Link href="/scanner"><Card>📷 Scanner un ticket</Card></Link>
          <Link href="/recipes"><Card>🍳 Recettes</Card></Link>
          <Link href="/garden"><Card>🌱 Potager</Card></Link>
        </div>
      </Section>

      {/* Alertes anti-gaspi */}
      <Section title="Anti-gaspi">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          <AlertList title="Périmés" items={summary.expired} />
          <AlertList title="Urgents (≤3j)" items={summary.urgent} />
          <AlertList title="Bientôt (≤7j)" items={summary.soon} />
    <div className="landing">
      <div className="background-pattern"></div>
      <div className="connections" id="connections"></div>

      <header className="header">
        <div className="logo">
          <div className="mycorrhiza-icon"></div>
          <h1>Myko</h1>
        </div>
      </Section>
        <p className="tagline">Cultivez vos connexions alimentaires</p>
      </header>

      {/* Potager */}
      <Section title="Potager">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          <Card>
            <strong>🗓️ Tâches du jour</strong>
            {(!tasksToday || tasksToday.length===0) ? <p style={{margin:'8px 0'}}>Rien pour aujourd’hui.</p> :
              tasksToday.slice(0,6).map(t => (
                <div key={t.id} style={{marginTop:6}}>
                  • {t.type} — {t.planting?.variety?.species} {t.planting?.variety?.variety||''}
                  {t.planting?.bed?.name ? <> • {t.planting.bed.name}</> : null}
                </div>
              ))
            }
            <div style={{marginTop:8}}><Link href="/garden">Voir le potager →</Link></div>
          </Card>

          <Card>
            <strong>⏭️ À venir (7 jours)</strong>
            {(!tasksNext || tasksNext.length===0) ? <p style={{margin:'8px 0'}}>R.A.S.</p> :
              tasksNext.slice(0,6).map(t => (
                <div key={t.id} style={{marginTop:6}}>
                  • {t.due_date} — {t.type} — {t.planting?.variety?.species} {t.planting?.variety?.variety||''}
                </div>
              ))
            }
          </Card>

          <Card>
            <strong>🌿 Plantations en cours</strong>
            {(!plantings || plantings.length===0) ? <p style={{margin:'8px 0'}}>Aucune en cours.</p> :
              plantings.map(p => (
                <div key={p.id} style={{marginTop:6}}>
                  • {p.variety?.species} {p.variety?.variety||''} — {p.bed?.name||'—'} • {p.status}
                </div>
              ))
            }
            {harvestsRecent?.length>0 && (
              <>
                <hr style={{margin:'12px 0',border:'none',borderTop:'1px solid #eee'}}/>
                <strong>🧺 Récoltes récentes</strong>
                {harvestsRecent.map(h => (
                  <div key={h.id} style={{marginTop:6}}>
                    • {h.date} — {h.qty} {h.unit} • {h.planting?.variety?.species} {h.planting?.variety?.variety||''}
                  </div>
                ))}
              </>
            )}
          </Card>
        </div>
      </Section>
      <div className="manifesto">
        « Ne laisse rien mourir en silence. Donne une seconde vie à chaque aliment. »
      </div>

      {/* Recettes suggérées */}
      <Section title="Recettes suggérées" right={<Link href="/recipes">Toutes les recettes →</Link>}>
        {(!suggestedRecipes || suggestedRecipes.length===0)
          ? <Card>Aucune suggestion (ajoute des recettes ou des lots urgents).</Card>
          : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
              {suggestedRecipes.map(r => (
                <Link key={r.id} href={`/recipes/${r.id}`} className="card" style={{display:'block',textDecoration:'none',color:'inherit'}}>
                  <strong>{r.title}</strong><br/>
                  <small>{r.time_min ? `${r.time_min} min · `:''}{(r.tags||[]).join(' · ')}</small>
                </Link>
              ))}
      <div className="main-container">
        {/* Garde-Manger */}
        <section className="module">
          <h2><span className="module-icon">🏺</span> Garde-Manger</h2>
          <p style={{marginBottom:12}}>
            Gérez vos lieux, lots (DLC), conversions d’unités, et suivez vos stocks en temps réel.
          </p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link className="btn" href="/pantry">Ouvrir le garde-manger</Link>
            <Link className="btn" href="/pantry#add">Ajouter un lot</Link>
          </div>
          <div className="item-list" style={{marginTop:14}}>
            <div className="item">
              <div className="item-info">
                <strong>Tomates (cœur de bœuf)</strong><br />
                3 pièces • DLC 12/09
              </div>
              <div className="item-actions">
                <Link className="btn btn-small" href="/pantry">Voir</Link>
              </div>
            </div>
        }
      </Section>
            <div className="item">
              <div className="item-info">
                <strong>Crème fraîche</strong><br />
                20&nbsp;cl • DLC 10/09
              </div>
              <div className="item-actions">
                <Link className="btn btn-small" href="/pantry">Voir</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Potager */}
        <section className="module">
          <h2><span className="module-icon">🌱</span> Potager</h2>
          <p style={{marginBottom:12}}>
            Suivez semis, plantations, récoltes, et reliez-les au garde-manger.
          </p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link className="btn" href="/garden">Ouvrir le potager</Link>
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-number">8</div>
              <div className="stat-label">Plantes</div>
            </div>
            <div className="stat">
              <div className="stat-number">2</div>
              <div className="stat-label">Prêtes</div>
            </div>
          </div>
        </section>

        {/* Recettes */}
        <section className="module">
          <h2><span className="module-icon">📖</span> Recettes</h2>
          <p style={{marginBottom:12}}>
            Créez, importez, planifiez. Cuisinez en déduisant automatiquement les bons lots (FEFO).
          </p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Link className="btn" href="/recipes">Voir les recettes</Link>
            <Link className="btn" href="/recipes#new">Ajouter</Link>
            <Link className="btn" href="/ingest">Importer depuis une URL</Link>
          </div>
          <div className="item-list" style={{marginTop:14}}>
            <div className="item">
              <div className="item-info">
                <strong>Quiche lorraine</strong><br />
                45′ • 4 pers
              </div>
              <div className="item-actions">
                <Link className="btn btn-small" href="/recipes">Ouvrir</Link>
                <Link className="btn btn-small" href="/cook/RECIPE_ID">Cuisiner</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Connexions / Suggestions */}
        <section className="module">
          <h2><span className="module-icon">🕸️</span> Réseau Mycorhizien</h2>
          <div className="stats">
            <div className="stat">
              <div className="stat-number">16</div>
              <div className="stat-label">Connexions</div>
            </div>
            <div className="stat">
              <div className="stat-number">5</div>
              <div className="stat-label">DLC proches</div>
            </div>
          </div>
          <div className="input-group" style={{marginTop:16}}>
            <label>Recherche intelligente</label>
            <div style={{display:'flex',gap:8}}>
              <input className="input" placeholder="Que faire avec des tomates qui vont s’abîmer ?" />
              <Link className="btn" href="/recipes">Chercher</Link>
            </div>
          </div>
        </section>
      </div>

      {loading && <p style={{opacity:.6}}>Chargement…</p>}
      {/* Styles “Claude”, portés ici */}
      <style jsx global>{`
        :root {
          --primary-green: #2d5016;
          --accent-green: #6b8e23;
          --light-green: #9acd32;
          --warm-beige: #f5f5dc;
          --earth-brown: #8b4513;
          --soft-white: #fefefe;
          --shadow: rgba(45, 80, 22, 0.1);
          --mycorrhiza: #d2b48c;
        }
        .landing { font-family: Georgia, serif; background: linear-gradient(135deg, var(--warm-beige) 0%, #f0f8e8 100%); color: var(--primary-green); min-height: 100vh; overflow-x: hidden; }
        .background-pattern { position: fixed; inset: 0; pointer-events: none; z-index: -1; background-image:
          radial-gradient(circle at 20% 20%, rgba(107,142,35,.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 60%, rgba(210,180,140,.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(154,205,50,.03) 0%, transparent 50%); }
        .header { text-align: center; padding: 2rem; background: rgba(255,255,255,.9); backdrop-filter: blur(10px); box-shadow: 0 2px 20px var(--shadow); }
        .logo { display:flex; align-items:center; justify-content:center; gap:1rem; margin-bottom:1rem; }
        .mycorrhiza-icon { width:60px; height:60px; position:relative; }
        .mycorrhiza-icon::before,.mycorrhiza-icon::after { content:''; position:absolute; border-radius:50%; background:var(--accent-green); }
        .mycorrhiza-icon::before { width:20px; height:20px; top:5px; left:5px; box-shadow:35px 35px 0 -5px var(--earth-brown); }
        .mycorrhiza-icon::after { width:2px; height:40px; top:15px; left:14px; border-radius:2px; background:var(--mycorrhiza); transform: rotate(45deg); }
        h1 { font-size:3rem; color:var(--primary-green); font-weight:normal; letter-spacing:2px; }
        .tagline { font-style:italic; color:var(--accent-green); margin-top:.5rem; font-size:1.1rem; }
        .manifesto { background: linear-gradient(135deg, rgba(107,142,35,.1), rgba(210,180,140,.1)); padding:1.5rem; margin:2rem; border-radius:15px; text-align:center; font-style:italic; font-size:1.1rem; border:2px solid var(--mycorrhiza); box-shadow:0 4px 15px var(--shadow); }
        .main-container { display:grid; grid-template-columns: repeat(auto-fit, minmax(350px,1fr)); gap:2rem; padding:2rem; max-width:1400px; margin:0 auto; }
        .module { background: rgba(255,255,255,.95); border-radius:20px; padding:2rem; box-shadow:0 8px 32px var(--shadow); border:1px solid rgba(107,142,35,.2); transition:.3s; position:relative; overflow:hidden; }
        .module::before { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle, var(--mycorrhiza) 1px, transparent 1px); background-size:20px 20px; opacity:.05; animation: float 20s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform: translateY(0) rotate(0)} 50%{transform: translateY(-10px) rotate(180deg)} }
        .module:hover { transform: translateY(-5px); box-shadow: 0 15px 40px var(--shadow); }
        .module h2 { font-size:1.8rem; color:var(--primary-green); margin-bottom:1.2rem; display:flex; align-items:center; gap:1rem; }
        .module-icon { width:40px; height:40px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; }
        .input { width:100%; padding:.8rem; border:2px solid var(--mycorrhiza); border-radius:10px; background:var(--soft-white); color:var(--primary-green); font-family:inherit; transition:.3s; }
        .input:focus { outline:none; border-color: var(--accent-green); box-shadow: 0 0 10px rgba(107,142,35,.2); }
        .btn { background: linear-gradient(135deg, var(--accent-green), var(--light-green)); color:#fff; border:none; padding:.8rem 1.2rem; border-radius:25px; cursor:pointer; font-size:1rem; transition:.3s; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(107,142,35,.3); }
        .btn-small { padding:.45rem .8rem; font-size:.85rem; border-radius:15px; }
        .item-list { max-height: 300px; overflow:auto; margin-top: .5rem; }
        .item { background: linear-gradient(90deg, rgba(154,205,50,.1), rgba(210,180,140,.1)); padding:1rem; margin:.5rem 0; border-radius:10px; border-left:4px solid var(--accent-green); display:flex; justify-content:space-between; align-items:center; transition:.3s; }
        .item:hover { transform: translateX(5px); box-shadow: 3px 3px 10px var(--shadow); }
        .item-info { flex:1; }
        .item-actions { display:flex; gap:.5rem; }
        .stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:1rem; margin-top:1rem; }
        .stat { background: rgba(107,142,35,.1); padding:1rem; border-radius:10px; text-align:center; }
        .stat-number { font-size:2rem; font-weight:700; color:var(--accent-green); }
        @keyframes ripple { to { transform: scale(4); opacity: 0; } }
        @media (max-width:768px){ .main-container{grid-template-columns:1fr; padding:1rem;} h1{font-size:2rem;} .module{padding:1.5rem;} }
      `}</style>
    </div>
  );
}
