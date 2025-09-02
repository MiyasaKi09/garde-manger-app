'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { (async () => {
    const { data, error } = await supabase.from('recipes').select('id,title,time_min,tags').order('title');
    if (!error) setRecipes(data||[]);
  })() }, []);
  return (
    <div>
      <h1>Recettes</h1>
      {recipes.length===0 && <p>Pas encore de recette.</p>}
      {recipes.map(r => (
        <Link key={r.id} href={`/recipes/${r.id}`} className="card" style={{display:'block',textDecoration:'none',color:'inherit'}}>
          <strong>{r.title}</strong><br />
          <small>{r.time_min ? `${r.time_min} min · ` : ''}{(r.tags||[]).join(' · ')}</small>
        </Link>
      ))}
    </div>
  );
}
