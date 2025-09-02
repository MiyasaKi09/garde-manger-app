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
        </div>
      </Section>

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
            </div>
        }
      </Section>

      {loading && <p style={{opacity:.6}}>Chargement…</p>}
    </div>
  );
}
