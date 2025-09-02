'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RecipeDetail(){
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [undoToken, setUndoToken] = useState(null);
  const [missing, setMissing] = useState([]); // [{name, missingQty, unit, available}, ...]

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
    setMissing([]);
    setUndoToken(null);
    const res = await fetch(`/api/cook/${id}`, { method:'POST' });
    const json = await res.json();
    setLoading(false);

    if(!res.ok){
      if (json?.missing?.length) {
        // Affiche la liste complète des manquants
        setMissing(json.missing);
      } else {
        alert(json.error || 'Erreur');
      }
    } else {
      setUndoToken(json.undoToken || null);
    }
  };

  const undo = async ()=>{
    if(!undoToken) return;
    const res = await fetch('/api/cook/undo', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ undoToken })
    });
    const json = await res.json();
    if(!res.ok){ alert(json.error || 'Erreur undo'); return; }
    setUndoToken(null);
    alert('Annulé ✅');
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

      <div style={{display:'flex',gap:8,alignItems:'center',margin:'8px 0'}}>
        <button disabled={loading} onClick={cook}>{loading ? 'En cours…' : 'Cuisiner'}</button>
        {undoToken && <button onClick={undo}>Annuler</button>}
      </div>

      {missing.length>0 && (
        <div className="card" style={{borderColor:'#f66'}}>
          <strong>Manque de stock :</strong>
          <ul>
            {missing.map((m, idx)=>(
              <li key={idx}>
                {m.name} — manque {m.missingQty} {m.unit} (disponible {m.available} {m.unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Étapes</h3>
      <pre className="card" style={{whiteSpace:'pre-wrap'}}>{recipe.steps || '—'}</pre>
    </div>
  );
}
