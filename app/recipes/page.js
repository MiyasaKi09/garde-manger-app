'use client'; // <-- Doit être en première ligne

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PartySizeControl from '@/components/PartySizeControl';
import AuthGate from '@/components/AuthGate';

const CATS = ['Tous','Végé','Viande/Poisson','Dessert','Accompagnement','Entrée','Boisson','Autre'];

/* ---------- utils ---------- */
function displayTitle(r){
  return r?.title || r?.name || 'Recette';
}
function mealsFromBatch(servingsPerBatch, people){
  if(!servingsPerBatch || !people) return 0;
  return Math.floor(Number(servingsPerBatch) / Number(people));
}

/* ---------- Carte ---------- */
function RecipeCard({ r, people = 2, onOpen, onDelete }) {
  const title = displayTitle(r);
  const nonDivisible = r?.is_divisible === false;
  const batchMeals = nonDivisible ? mealsFromBatch(r?.servings, people) : null;

  return (
    <div className="card" style={{display:'grid',gap:8, padding:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline', gap:10}}>
        <strong className="line-clamp-2" style={{fontSize:16}} title={title}>{title}</strong>
        <div style={{fontSize:12,opacity:.7}}>
          {r?.category || (r?.is_veg ? 'Végé' : '—')}
        </div>
      </div>

      <div style={{fontSize:12,opacity:.75}}>
        {r?.servings ?? 2} pers (base) • prep {r?.prep_min||0}′ • cuisson {r?.cook_min||0}′
      </div>

      <div style={{fontSize:12, marginTop:2}}>
        {nonDivisible ? (
          <span title="Recette non divisible (batch entier)">
            Batch entier • avec <b>{people}</b> pers → <b>{batchMeals ?? 0}</b> repas
          </span>
        ) : (
          <span>
            Ajustée pour <b>{people}</b> pers
          </span>
        )}
      </div>

      <div style={{display:'flex',gap:6,marginTop:6}}>
        <button className="btn" onClick={()=>onOpen(r)}>Ouvrir</button>
        <button className="btn" onClick={()=>onDelete(r)} title="Supprimer">Supprimer</button>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
function RecipeModal({ id, onClose }) {
  const [recipe,setRecipe]=useState(null);
  const [ings,setIngs]=useState([]);

  useEffect(()=>{ (async()=>{
    if(!id) return;
    const { data: r, error: e1 } = await supabase.from('recipes').select('*').eq('id', id).single();
    if (e1) console.error('recipe fetch error', e1);
    setRecipe(r||null);
    const { data: ri, error: e2 } = await supabase
      .from('recipe_ingredients')
      .select('id, qty, unit, note, product:products_catalog(id,name,default_unit)')
      .eq('recipe_id', id)
      .order('id');
    if (e2) console.error('ingredients fetch error', e2);
    setIngs(ri||[]);
  })(); },[id]);

  if(!id) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
      display:'grid', placeItems:'center', zIndex:100
    }}>
      <div className="card" style={{width:'min(860px, 92vw)', maxHeight:'88vh', overflow:'auto', display:'grid', gap:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center', gap:8}}>
          <h2 style={{margin:0}}>{displayTitle(recipe)}</h2>
          <button className="btn" onClick={onClose}>Fermer</button>
        </div>

        <div style={{fontSize:13,opacity:.75}}>
          {recipe?.category || (recipe?.is_veg?'Végé':'—')} • {recipe?.servings ?? 2} pers •
          {' '}prep {recipe?.prep_min||0}′ • cuisson {recipe?.cook_min||0}′
          {recipe?.is_divisible===false && (
            <span className="badge" style={{marginLeft:8}}>Non divisible</span>
          )}
        </div>

        {recipe?.description && <p style={{whiteSpace:'pre-wrap'}}>{recipe.description}</p>}

        <h3>Ingrédients</h3>
        <ul style={{margin:0,paddingLeft:18}}>
          {ings.map(i=>(
            <li key={i.id}>
              {i.qty} {i.unit} — {i.product?.name || '??'} {i.note ? <em style={{opacity:.7}}>({i.note})</em> : null}
            </li>
          ))}
          {ings.length===0 && <em style={{opacity:.7}}>Aucun ingrédient pour le moment.</em>}
        </ul>

        <div style={{display:'flex',gap:8,marginTop:8}}>
          <a className="btn" href={`/recettes/editer/${id}`}>Éditer</a>
          <a className="btn" href={`/cook/${id}`}>Cuisiner</a>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page protégée ---------- */
export default function RecipesPage(){
  return (
    <AuthGate>
      <RecipesInner />
    </AuthGate>
  );
}

/* ---------- Le contenu réel de la page ---------- */
function RecipesInner(){
  const [recipes,setRecipes]=useState([]);
  const [q,setQ]=useState('');
  const [cat,setCat]=useState('Tous');
  const [opening,setOpening]=useState(null);

  const [people, setPeople] = useState(2);

  // Form nouvel élément
  const [title,setTitle]=useState('');
  const [isVeg,setIsVeg]=useState(false);
  const [category,setCategory]=useState('');
  const [servings,setServings]=useState(2);
  const [isDivisible, setIsDivisible] = useState(true);

  useEffect(()=>{
    const saved = localStorage.getItem('myko.partySize');
    if(saved){
      const n = parseInt(saved,10);
      if(!Number.isNaN(n) && n>0) setPeople(n);
    }
  },[]);

  async function load(){
    const { data, error } = await supabase
      .from('recipes')
      .select('id,title,name,category,is_veg,servings,prep_min,cook_min,is_divisible,created_at')
      .order('created_at', { ascending:false })
      .order('title', { ascending:true });

    if (error) {
      console.error('Supabase recipes error:', error);
      alert(`Erreur chargement recettes: ${error.message}`);
      setRecipes([]);
      return;
    }
    setRecipes(data||[]);
  }

  useEffect(()=>{ load(); },[]); // <-- on appelait plus load()

  const filtered = useMemo(()=>{
    const s = (q||'').toLowerCase();
    return (recipes||[]).filter(r=>{
      const t = displayTitle(r).toLowerCase();
      const okQ = !s || t.includes(s);
      const okC = cat==='Tous'
        ? true
        : (cat==='Végé'
            ? (r.is_veg===true || r.category==='Végé')
            : (r.category===cat));
      return okQ && okC;
    });
  },[recipes,q,cat]);

  async function addRecipe(e){
    e.preventDefault();
    if(!title.trim()) return;
    const rec = {
      title: title.trim(),
      is_veg: isVeg,
      category: category || null,
      servings: Number(servings)||2,
      is_divisible: isDivisible
    };
    const { data, error } = await supabase.from('recipes').insert(rec).select('*').single();
    if(error) return alert(error.message);
    setRecipes(prev=>[data, ...prev]);
    setTitle(''); setIsVeg(false); setCategory(''); setServings(2); setIsDivisible(true);
  }

  async function deleteRecipe(r){
    if(!confirm(`Supprimer "${displayTitle(r)}" ?`)) return;
    const { error } = await supabase.from('recipes').delete().eq('id', r.id);
    if(error) return alert(error.message);
    setRecipes(prev=>prev.filter(x=>x.id!==r.id));
  }

  return (
    <div>
      <h1>Recettes</h1>

      {/* filtres + Nb personnes */}
      <div className="card" style={{display:'grid',gap:8}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <input className="input" placeholder="Rechercher…" value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:220}}/>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {CATS.map(c=>(
                <button key={c}
                  className={`btn ${cat===c?'primary':''}`}
                  onClick={()=>setCat(c)}
                >{c}</button>
              ))}
            </div>
          </div>
          <PartySizeControl value={people} onChange={(n)=>{ setPeople(n); localStorage.setItem('myko.partySize', String(n)); }} />
        </div>
      </div>

      {/* Ajouter */}
      <form onSubmit={addRecipe} className="card" style={{display:'grid',gap:8, marginTop:10, maxWidth:900}}>
        <h3 style={{margin:0}}>Ajouter une recette</h3>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:8, alignItems:'center'}}>
          <input className="input" placeholder="Nom de la recette" value={title} onChange={e=>setTitle(e.target.value)} required/>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">Catégorie…</option>
            {CATS.filter(c=>c!=='Tous' && c!=='Végé').map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <label className="input" style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={isVeg} onChange={e=>setIsVeg(e.target.checked)}/> Végé
          </label>
          <input className="input" type="number" min="1" value={servings} onChange={e=>setServings(e.target.value)} title="Portions"/>
          <label className="input" style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={!isDivisible} onChange={e=>setIsDivisible(!e.target.checked)}/>
            Non divisible
          </label>
        </div>
        <div><button className="btn primary" type="submit">Créer</button></div>
      </form>

      {/* grille */}
      <div className="grid" style={{gap:10, gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', marginTop:12}}>
        {filtered.map(r=>(
          <RecipeCard key={r.id} r={r} people={people} onOpen={setOpening} onDelete={deleteRecipe}/>
        ))}
        {filtered.length===0 && <p style={{opacity:.7}}>Aucune recette.</p>}
      </div>

      {/* modal */}
      {opening && <RecipeModal id={opening.id} onClose={()=>setOpening(null)}/>}
    </div>
  );
}
