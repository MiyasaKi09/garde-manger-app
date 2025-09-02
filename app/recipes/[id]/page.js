'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RecipeDetail(){
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ (async ()=>{
    const { data: r } = await supabase.from('recipes').select('*').eq('id', id).single();
    setRecipe(r||null);
    const { data: ing } = await supabase.from('recipe_ingredients')
      .select('id, qty, unit, optional, product:products_catalog(id,name)')
      .eq('recipe_id', id);
    setIngredients(ing||[]);
  })() }, [id]);

  const cook = async ()=>{
    setLoading(true);
    const res = await fetch(`/api/cook/${id}`, { method:'POST' });
    const json = await res.json();
    setLoading(false);
    if(!res.ok) alert(json.error || 'Erreur');
    else alert('Cuisiné ✅ (décrément FIFO)');
  };

  if(!recipe) return <p>Chargement…</p>;
  return (
    <div>
      <h1>{recipe.title}</h1>
      <h3>Ingrédients</h3>
      <ul>
        {ingredients.map(i => (
          <li key={i.id}>
            {i.product?.name} — {i.qty} {i.unit}{i.optional ? ' (optionnel)' : ''}
          </li>
        ))}
      </ul>
      <button disabled={loading} onClick={cook}>{loading ? 'En cours…' : 'Cuisiner'}</button>
      <h3>Étapes</h3>
      <pre className="card" style={{whiteSpace:'pre-wrap'}}>{recipe.steps || '—'}</pre>
    </div>
  );
}
