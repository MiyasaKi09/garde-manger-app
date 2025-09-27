'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SLOTS = ['midi','soir'];

 useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');

function startOfWeek(d=new Date()){
  const dt = new Date(d);
  const day = (dt.getDay()+6)%7; // lundi=0
  dt.setDate(dt.getDate()-day);
  dt.setHours(0,0,0,0);
  return dt;
}
function fmtISO(d){ return d.toISOString().slice(0,10); }

export default function PlannerPage(){
  const [weekStart,setWeekStart]=useState(()=>startOfWeek());
  const days = useMemo(()=>Array.from({length:7},(_,i)=> new Date(weekStart.getTime()+i*86400000)),[weekStart]);

  const [recipes,setRecipes]=useState([]);
  const [plan,setPlan]=useState([]);      // entries of current week
  const [leftovers,setLeftovers]=useState([]);
  const [saving,setSaving]=useState(false);

  async function load(){
    const { data: r } = await supabase.from('recipes').select('id,name').order('name');
    setRecipes(r||[]);
    const { data: p } = await supabase
      .from('meal_plan')
      .select('id, plan_date, slot, recipe_id, servings, recipe:recipes(name)')
      .gte('plan_date', fmtISO(days[0]))
      .lte('plan_date', fmtISO(days[6]));
    setPlan(p||[]);
    const { data: lo } = await supabase
      .from('leftovers')
      .select('id, recipe_id, portions_left, dlc, recipe:recipes(name)')
      .gte('dlc', fmtISO(new Date()));
    setLeftovers(lo||[]);
  }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[weekStart]);

  function moveWeek(delta){
    setWeekStart(w => new Date(w.getTime()+delta*7*86400000));
  }

  const cell = (date, slot) => (plan||[]).find(p => p.plan_date === fmtISO(date) && p.slot === slot);

  async function setCell(date, slot, recipeId){
    setSaving(true);
    try{
      const existing = cell(date, slot);
      if (recipeId==='__clear__') {
        if(existing) await supabase.from('meal_plan').delete().eq('id', existing.id);
      } else if (existing) {
        await supabase.from('meal_plan').update({ recipe_id: recipeId }).eq('id', existing.id);
      } else {
        await supabase.from('meal_plan').insert({ plan_date: fmtISO(date), slot, recipe_id: recipeId, servings: 2 });
      }
      await load();
    } finally { setSaving(false); }
  }

  async function markCooked(date, slot){
    const p = cell(date, slot);
    if(!p) return;
    const servings = p.servings || 2;
    const ok = confirm(`Marquer "${p.recipe?.name}" comme cuisiné (${servings} part.) ?`);
    if(!ok) return;
    // 1) journal
    await supabase.from('meal_log').insert({ recipe_id: p.recipe_id, servings, from_plan_id: p.id });
    // 2) restes (par défaut: se garde 3 jours, tout au frigo)
    const dlc = fmtISO(new Date(new Date().getTime()+3*86400000));
    const { data: locs } = await supabase.from('locations').select('id,name').ilike('name','%frigo%').limit(1);
    const locId = locs?.[0]?.id ?? null;
    await supabase.from('leftovers').insert({
      recipe_id: p.recipe_id, cooked_on: fmtISO(new Date()), dlc,
      portions_total: servings, portions_left: servings, location_id: locId
    });
    alert('Cuisiné + restes enregistrés.');
    await load();
  }

  async function eatLeftover(lo){
    if (lo.portions_left<=0) return;
    await supabase.from('leftovers').update({ portions_left: lo.portions_left-1 }).eq('id', lo.id);
    await load();
  }

  return (
    <div>
      <h1>Planning de la semaine</h1>

      <div className="card" style={{display:'flex',gap:8,alignItems:'center'}}>
        <button className="btn" onClick={()=>moveWeek(-1)}>&larr; Semaine -1</button>
        <div style={{fontWeight:600}}>
          {fmtISO(days[0]).slice(5)} → {fmtISO(days[6]).slice(5)}
        </div>
        <button className="btn" onClick={()=>moveWeek(+1)}>Semaine +1 &rarr;</button>
        {saving && <span style={{opacity:.6}}>Sauvegarde…</span>}
      </div>

      {/* grille semaine */}
      <div className="card" style={{overflowX:'auto', marginTop:10}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', padding:'8px'}}>Jour</th>
              {SLOTS.map(s=><th key={s} style={{textAlign:'left', padding:'8px'}}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map(d=>{
              const iso = fmtISO(d);
              const nice = d.toLocaleDateString(undefined, { weekday:'short', day:'2-digit', month:'2-digit' });
              return (
                <tr key={iso} style={{borderTop:'1px solid #eee'}}>
                  <td style={{padding:'8px', whiteSpace:'nowrap'}}>{nice}</td>
                  {SLOTS.map(s=>{
                    const p = cell(d, s);
                    return (
                      <td key={s} style={{padding:'8px', minWidth:260}}>
                        <div style={{display:'grid', gap:6}}>
                          <select className="input"
                            value={p?.recipe_id || ''}
                            onChange={e=>setCell(d, s, e.target.value || '__clear__')}
                          >
                            <option value="">{p ? '— changer / vider —' : 'Choisir une recette…'}</option>
                            <option value="__clear__">Vider</option>
                            {recipes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          {p && (
                            <div style={{display:'flex', gap:6}}>
                              <a className="btn" href={`/recettes#${p.recipe_id}`}>Ouvrir</a>
                              <button className="btn" onClick={()=>markCooked(d, s)}>Cuisiné ✓</button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Restes */}
      <div className="card" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Restes au frigo/congélo</h3>
        {(leftovers||[]).length===0 && <p style={{opacity:.7}}>Aucun reste.</p>}
        <div className="grid" style={{gap:8, gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))'}}>
          {leftovers.map(lo=>(
            <div key={lo.id} className="card" style={{display:'grid', gap:6}}>
              <strong>{lo.recipe?.name || 'Plat'}</strong>
              <div style={{fontSize:12,opacity:.75}}>
                À consommer avant le {lo.dlc} • parts restantes: {lo.portions_left}
              </div>
              <div style={{display:'flex', gap:6}}>
                <button className="btn" onClick={()=>eatLeftover(lo)} disabled={lo.portions_left<=0}>– 1 part</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
