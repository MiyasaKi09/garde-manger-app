'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const SLOTS = ['midi','soir'];

function startOfWeek(d=new Date()){
  const dt = new Date(d);
  const day = (dt.getDay()+6)%7; // lundi=0
  dt.setDate(dt.getDate()-day);
  dt.setHours(0,0,0,0);
  return dt;
}

function fmtISO(d){ 
  return d.toISOString().slice(0,10); 
}

export default function PlannerPage(){
  const router = useRouter();
  const [weekStart,setWeekStart]=useState(()=>startOfWeek());
  const days = useMemo(()=>Array.from({length:7},(_,i)=> new Date(weekStart.getTime()+i*86400000)),[weekStart]);

  const [recipes,setRecipes]=useState([]);
  const [plan,setPlan]=useState([]);      // entries of current week
  const [leftovers,setLeftovers]=useState([]);
  const [saving,setSaving]=useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

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
  
  useEffect(()=>{ 
    load(); 
    /* eslint-disable-next-line */ 
  },[weekStart]);

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
    } finally { 
      setSaving(false); 
    }
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
    await supabase.from('leftovers').insert({ recipe_id: p.recipe_id, portions_left: servings, dlc, location_id: locId });
    // 3) supprimer du planning
    await supabase.from('meal_plan').delete().eq('id', p.id);
    await load();
  }

  const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📅 Planning des repas</h1>
      
      {/* Navigation semaine */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => moveWeek(-1)} className="btn secondary">← Semaine précédente</button>
        <h2>{fmtISO(days[0])} - {fmtISO(days[6])}</h2>
        <button onClick={() => moveWeek(1)} className="btn secondary">Semaine suivante →</button>
      </div>

      {/* Grille planning */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'auto repeat(7, 1fr)', 
        gap: '1px', 
        background: '#ddd',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* En-têtes */}
        <div style={{ background: '#f5f5f5', padding: '0.5rem', fontWeight: 'bold' }}></div>
        {days.map((day, i) => (
          <div key={i} style={{ background: '#f5f5f5', padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>
            {dayNames[i]}<br />
            <small>{day.getDate()}/{day.getMonth()+1}</small>
          </div>
        ))}

        {/* Lignes des slots */}
        {SLOTS.map(slot => (
          <React.Fragment key={slot}>
            <div style={{ background: '#f9f9f9', padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>
              {slot === 'midi' ? '🌞 Midi' : '🌙 Soir'}
            </div>
            {days.map((day, i) => {
              const entry = cell(day, slot);
              return (
                <div key={i} style={{ background: 'white', padding: '0.5rem', minHeight: '80px' }}>
                  {entry ? (
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {entry.recipe?.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                        {entry.servings} pers.
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => markCooked(day, slot)}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          className="btn success small"
                        >
                          ✓ Fait
                        </button>
                        <button 
                          onClick={() => setCell(day, slot, '__clear__')}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                          className="btn danger small"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select 
                      onChange={(e) => e.target.value && setCell(day, slot, e.target.value)}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                      disabled={saving}
                    >
                      <option value="">Choisir recette...</option>
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Restes disponibles */}
      {leftovers.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>🍲 Restes disponibles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {leftovers.map(lo => (
              <div key={lo.id} style={{ padding: '0.5rem', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                <div style={{ fontWeight: 'bold' }}>{lo.recipe?.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {lo.portions_left} part. - DLC: {lo.dlc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
