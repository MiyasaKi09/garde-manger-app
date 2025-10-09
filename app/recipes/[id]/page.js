// app/recipes/[id]/page.js
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { convertWithMeta } from '@/lib/units';
import './recipe-detail.css';

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

function roundForUnit(q, unit) {
  const u = (unit||'').toLowerCase();
  // On autorise 2 décimales partout (même 'u' au cas où tu stockes des demi-pièces).
  return Math.round(Number(q) * 100) / 100;
}

// Ligne d’un lot sélectionnable pour un ingrédient
function LotRow({ lot, ing, meta, onChange }) {
  const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
  const lotInNeed = convertWithMeta(Number(lot.qty), lot.unit, needUnit, meta).qty;

  const [checked, setChecked] = useState(false);
  const [qty, setQty] = useState('');

  useEffect(()=>{ onChange({ id: lot.id, checked, qty, unit: lot.unit }); }, [checked, qty]); // eslint-disable-line

  return (
    <div className="card" style={{display:'grid',gridTemplateColumns:'auto 1fr 240px 180px',gap:8,alignItems:'center'}}>
      <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} />
      <div>
        <div style={{fontWeight:600}}>{lot.product_name || ing.product?.name || 'Produit'}</div>
        <div style={{opacity:.7,fontSize:12}}>
          Lot {String(lot.id).slice(0,8)} • DLC {lot.dlc || '—'} • Entré le {lot.entered_at?.slice(0,10) || '—'}
        </div>
      </div>
      <div style={{opacity:.9}}>
        Stock: <strong>{Number(lot.qty).toFixed(2)} {lot.unit}</strong>
        <div style={{fontSize:12,opacity:.7}}>≈ {lotInNeed.toFixed(2)} {needUnit}</div>
      </div>
      <div style={{display:'flex',gap:6,alignItems:'center'}}>
        <span style={{opacity:.7,fontSize:12}}>Prendre</span>
        <input
          className="input"
          type="number" step="0.01" min="0"
          value={qty}
          onChange={e=>setQty(e.target.value)}
          style={{width:110}}
        />
        <span style={{opacity:.9}}>{lot.unit}</span>
      </div>
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [ings, setIngs] = useState([]);
  const [lotsByProduct, setLotsByProduct] = useState({});   // product_id -> lots[]
  const [metaByProduct, setMetaByProduct] = useState({});   // product_id -> meta
  const [plan, setPlan] = useState({});                     // product_id -> { lot_id -> {checked, qty, unit} }
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Préférence: ne jamais dépasser (cap l'auto-remplissage)
  const [noOverfill, setNoOverfill] = useState(true);

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    // 1) recette + ingrédients + meta produit
    console.log('Chargement de la recette avec ID:', id);
    const { data: r, error: errR } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id).single();
    if (errR) { 
      console.error('Erreur lors du chargement de la recette:', errR);
      console.log('ID recherché:', id);
      setError(`Recette avec l'ID ${id} introuvable. Erreur: ${errR.message}`); 
      setLoading(false); 
      return; 
    }

    if (!r) {
      console.error('Aucune recette trouvée avec l\'ID:', id);
      setError(`Aucune recette trouvée avec l'ID ${id}`);
      setLoading(false);
      return;
    }

    console.log('Recette trouvée:', r);
    console.log('Colonnes disponibles:', Object.keys(r));

    const totalTime = (r?.prep_min || 0) + (r?.cook_min || 0) + (r?.rest_min || 0);
    setRecipe({ 
      id: r?.id, 
      title: r?.title || r?.name, 
      description: r?.description,
      short_description: r?.short_description,
      time_min: totalTime, 
      prep_min: r?.prep_min,
      cook_min: r?.cook_min,
      rest_min: r?.rest_min,
      servings: r?.servings,
      steps: r?.instructions,
      myko_score: r?.myko_score,
      chef_tips: r?.chef_tips,
      is_vegetarian: r?.is_vegetarian,
      is_vegan: r?.is_vegan,
      is_gluten_free: r?.is_gluten_free
    });
    
    // Pour l'instant, pas d'ingrédients dans les données mock
    const ingList = [];
    setIngs(ingList);

    // 2) Pour l'instant, pas de chargement d'ingrédients/lots en mode mock
    setLotsByProduct({});
    setMetaByProduct({});
    setLoading(false);
  })(); }, [id]);

  function setLotSelection(product_id, lot_id, patch) {
    setPlan(prev => {
      const forProd = { ...(prev[product_id] || {}) };
      const prevLot = forProd[lot_id] || { checked:false, qty:'', unit: lotsByProduct[product_id]?.find(l=>l.id===lot_id)?.unit || 'g' };
      forProd[lot_id] = { ...prevLot, ...patch };
      return { ...prev, [product_id]: forProd };
    });
  }

  // Couverture par rapport au besoin (en unité de l’ingrédient)
  const coverage = useMemo(() => {
    const out = {};
    for (const ing of ings) {
      const pid = ing.product_id;
      const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
      const needQty = Number(ing.qty || 0);
      const meta = metaByProduct[pid] || {};
      let covered = 0;
      const picks = plan[pid] || {};
      for (const lot of (lotsByProduct[pid] || [])) {
        const pick = picks[lot.id];
        if (!pick?.checked) continue;
        const take = Number(pick.qty || 0);
        if (!(take > 0)) continue;
        const inNeed = convertWithMeta(take, pick.unit || lot.unit, needUnit, meta).qty;
        covered += inNeed;
      }
      out[pid] = { needQty, needUnit, covered, ok: covered + 1e-9 >= needQty || ing.optional };
    }
    return out;
  }, [ings, plan, lotsByProduct, metaByProduct]);

  // Auto-remplit pour UN ingrédient (respecte la préférence noOverfill)
  function autoFillForProduct(pid) {
    const ing = (ings || []).find(x => x.product_id === pid);
    if (!ing) return;

    const needUnit = (ing.unit || ing.product?.default_unit || 'g').toLowerCase();
    const target = Number(ing.qty || 0);
    let remaining = target;
    const meta = metaByProduct[pid] || {};
    const lots = (lotsByProduct[pid] || []).slice(); // déjà FIFO par tri

    // on réinitialise la sélection courante de ce produit
    setPlan(prev => ({ ...prev, [pid]: {} }));

    for (const lot of lots) {
      if (remaining <= 1e-9) break;

      // quantité dispo convertie dans l’unité demandée
      const lotInNeed = convertWithMeta(Number(lot.qty), lot.unit, needUnit, meta).qty;
      if (lotInNeed <= 0) continue;

      // quantité à prendre dans l’unité demandée
      let takeInNeed = Math.min(lotInNeed, remaining);
      if (takeInNeed <= 0) continue;

      // reconvertir vers l'unité du lot pour saisie UI
      let takeInLot = convertWithMeta(takeInNeed, needUnit, lot.unit, meta).qty;
      // arrondi propre
      takeInLot = roundForUnit(takeInLot, lot.unit);
      // ne pas dépasser le lot
      takeInLot = Math.min(takeInLot, Number(lot.qty));

      // si préférence "ne jamais dépasser", on recalcule la prise en needUnit après arrondi
      if (noOverfill) {
        const backInNeed = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
        // Si l'arrondi provoque un dépassement, on réduit un poil
        if (backInNeed > remaining + 1e-9) {
          // réduisons dans l'unité du lot
          const step = (lot.unit.toLowerCase() === 'u') ? 0.01 : 0.01; // pas minimal
          while (takeInLot > 0) {
            takeInLot = Math.max(0, roundForUnit(takeInLot - step, lot.unit));
            const chk = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
            if (chk <= remaining + 1e-9) break;
          }
        }
      }

      if (takeInLot <= 0) continue;

      // met à jour sélection UI
      setLotSelection(pid, lot.id, { checked: true, qty: takeInLot, unit: lot.unit });

      // décrémente remaining sur la base de la quantité réellement prise (après arrondi)
      const takenInNeed = convertWithMeta(takeInLot, lot.unit, needUnit, meta).qty;
      remaining -= takenInNeed;
    }
  }

  // Auto-remplit tous les ingrédients
  function autoFillAll() {
    for (const ing of (ings || [])) autoFillForProduct(ing.product_id);
  }

  async function cook() {
    setError('');
    setSending(true);
    try {
      // Construire un plan à partir de la sélection (si présent)
      const flatPlan = [];
      let hasAny = false;

      for (const ing of ings) {
        const pid = ing.product_id;
        const picks = plan[pid] || {};
        for (const lot of (lotsByProduct[pid] || [])) {
          const p = picks[lot.id];
          if (p?.checked && Number(p.qty) > 0) {
            hasAny = true;
            flatPlan.push({
              product_id: pid,
              lot_id: lot.id,
              qty: Number(p.qty),
              unit: (p.unit || lot.unit)
            });
          }
        }
      }

      // Si plan présent, vérifier couverture (sauf ingrédients optionnels)
      if (hasAny) {
        const notOk = Object.values(coverage).find(c => !c.ok);
        if (notOk) {
          throw new Error("Le plan ne couvre pas les besoins d’au moins un ingrédient (ou quantité = 0).");
        }
      }

      const res = await fetch(`/api/cook/${id}`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: hasAny ? JSON.stringify({ plan: flatPlan }) : '{}'
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.missing?.length) {
          const first = json.missing[0];
          throw new Error(`Stock insuffisant pour ${first.name}: il manque ${first.missingQty} ${first.unit} (dispo ${first.available}).`);
        }
        throw new Error(json?.error || 'Erreur inconnue');
      }
      router.push('/recipes'); // ou afficher un toast de succès
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="recipe-detail-container">
        <div className="loading-spinner" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          fontSize: '1.2rem',
          color: '#374151'
        }}>
          Chargement de la recette...
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="recipe-detail-container">
        <div className="error-message" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626' }}>Erreur</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }
  
  if (!recipe) {
    return (
      <div className="recipe-detail-container">
        <div className="error-message" style={{
          background: 'rgba(107, 114, 128, 0.1)',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2>Recette introuvable</h2>
          <p>Aucune recette trouvée avec l'ID: {id}</p>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Retour aux recettes
          </button>
        </div>
      </div>
    );
  }

  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0);

  return (
    <div className="recipe-detail-container">
      <div className="recipe-header">
        <button 
          onClick={() => window.history.back()}
          className="back-button"
        >
          ← Retour aux recettes
        </button>
        
        <div className="recipe-title-section">
          <h1 className="recipe-title">{recipe.title}</h1>
          <div className="recipe-badges">
            <span className={`myko-score ${recipe.myko_score >= 80 ? 'high-score' : 'medium-score'}`}>
              {recipe.myko_score}★ Myko
            </span>
          </div>
        </div>
        
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
      </div>

      <div className="recipe-content">
        <div className="recipe-info-cards">
          <div className="info-card">
            <div className="info-icon">⏱️</div>
            <div className="info-content">
              <div className="info-label">Temps total</div>
              <div className="info-value">{totalTime} min</div>
              <div className="info-details">
                {recipe.prep_min > 0 && `Prep: ${recipe.prep_min}min`}
                {recipe.cook_min > 0 && ` • Cuisson: ${recipe.cook_min}min`}
                {recipe.rest_min > 0 && ` • Repos: ${recipe.rest_min}min`}
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">👥</div>
            <div className="info-content">
              <div className="info-label">Portions</div>
              <div className="info-value">{recipe.servings || 'Non défini'}</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <div className="info-label">Score Myko</div>
              <div className="info-value">{recipe.myko_score}/100</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">🌱</div>
            <div className="info-content">
              <div className="info-label">Régime</div>
              <div className="info-value">
                {recipe.is_vegan ? 'Vegan' : recipe.is_vegetarian ? 'Végétarien' : 'Omnivore'}
              </div>
            </div>
          </div>
        </div>

        <div className="recipe-body">
          <div className="ingredients-section">
            <h2>Ingrédients</h2>
            <p className="no-ingredients">
              Ingrédients non disponibles en mode développement.
              <br />
              Configurez une vraie base de données Supabase pour voir les ingrédients.
            </p>
          </div>

          <div className="instructions-section">
            <h2>Instructions</h2>
            <div className="instructions-content">
              {recipe.steps ? (
                <p className="instructions-text">{recipe.steps}</p>
              ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  Instructions non disponibles
                </p>
              )}
            </div>

            {recipe.chef_tips && (
              <div className="chef-tips">
                <h3>💡 Conseils du chef</h3>
                <p>{recipe.chef_tips}</p>
              </div>
            )}
          </div>
        </div>

        <div className="recipe-actions">
          <button className="action-btn primary">
            📅 Planifier cette recette
          </button>
          <button className="action-btn secondary">
            🛒 Ajouter aux courses
          </button>
          <button className="action-btn tertiary">
            📝 Modifier la recette
          </button>
        </div>
      </div>
    </div>
  );
}
