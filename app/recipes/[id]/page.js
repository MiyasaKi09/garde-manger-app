// app/recipes/[id]/page.js
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { convertWithMeta } from '@/lib/units';
import IngredientSearchSelector from './IngredientSearchSelector';
import './recipe-detail.css';
import './IngredientSearchSelector.css';

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
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('basic');
  const [editedRecipe, setEditedRecipe] = useState({});
  const [editedIngredients, setEditedIngredients] = useState([]);
  const [editedInstructions, setEditedInstructions] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);

  // Préférence: ne jamais dépasser (cap l'auto-remplissage)
  const [noOverfill, setNoOverfill] = useState(true);

  // Fonctions pour l'édition
  async function loadAvailableIngredients() {
    try {
      console.log('🔍 Chargement des ingrédients disponibles...');
      const { data, error } = await supabase
        .from('canonical_foods')
        .select('id, name, category, subcategory')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      console.log('✅ Ingrédients chargés:', data?.length || 0, 'ingrédients');
      console.log('📋 Premiers ingrédients:', data?.slice(0, 5));
      setAvailableIngredients(data || []);
    } catch (error) {
      console.error('❌ Erreur chargement ingrédients:', error);
      // Essayons une requête plus simple en fallback
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('canonical_foods')
          .select('*')
          .limit(10);
        
        console.log('🔄 Tentative fallback:', fallbackData);
        if (!fallbackError && fallbackData) {
          setAvailableIngredients(fallbackData);
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback échoué:', fallbackErr);
      }
    }
  }

  function startEditing() {
    setEditedRecipe({
      name: recipe.title || '',
      description: recipe.description || '',
      short_description: recipe.short_description || '',
      prep_min: recipe.prep_min || 0,
      cook_min: recipe.cook_min || 0,
      rest_min: recipe.rest_min || 0,
      servings: recipe.servings || 4,
      chef_tips: recipe.chef_tips || '',
      is_vegetarian: recipe.is_vegetarian || false,
      is_vegan: recipe.is_vegan || false,
      is_gluten_free: recipe.is_gluten_free || false
    });

    // Convertir les instructions texte en blocs séparés
    const instructionsText = recipe.steps || '';
    const instructionLines = instructionsText.split(/\n+/).filter(line => line.trim());
    setEditedInstructions(instructionLines.map((line, index) => ({
      id: Math.random(),
      text: line.replace(/^\d+\.\s*/, ''), // Retirer la numérotation automatique
      duration: '',
      type: 'preparation'
    })));

    if (instructionLines.length === 0) {
      setEditedInstructions([{
        id: Math.random(),
        text: '',
        duration: '',
        type: 'preparation'
      }]);
    }
    setEditedIngredients(ings.map(ing => ({
      id: ing.id || Math.random(),
      canonical_food_id: ing.canonical_food_id || '',
      canonical_food_name: ing.canonical_foods?.name || '',
      quantity: ing.quantity || 0,
      unit: ing.unit || 'g',
      notes: ing.notes || ''
    })));
    loadAvailableIngredients();
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditedRecipe({});
    setEditedIngredients([]);
    setEditedInstructions([]);
  }

  function addInstruction() {
    setEditedInstructions(prev => [...prev, {
      id: Math.random(),
      text: '',
      duration: '',
      type: 'preparation'
    }]);
  }

  function updateInstruction(index, field, value) {
    setEditedInstructions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeInstruction(index) {
    setEditedInstructions(prev => prev.filter((_, i) => i !== index));
  }

  function addIngredient() {
    setEditedIngredients(prev => [...prev, {
      id: Math.random(),
      canonical_food_id: '',
      canonical_food_name: '',
      quantity: 0,
      unit: 'g',
      notes: ''
    }]);
  }

  function updateIngredient(index, field, value) {
    setEditedIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Si on change l'ingrédient, mettre à jour le nom
      if (field === 'canonical_food_id') {
        const ingredient = availableIngredients.find(ing => ing.id === parseInt(value));
        if (ingredient) {
          updated[index].canonical_food_name = ingredient.name;
        }
      }
      
      return updated;
    });
  }

  function removeIngredient(index) {
    setEditedIngredients(prev => prev.filter((_, i) => i !== index));
  }

  async function saveRecipe() {
    try {
      setSending(true);
      
      // 1. Sauvegarder la recette principale
      const instructionsText = editedInstructions
        .filter(inst => inst.text.trim())
        .map((inst, index) => `${index + 1}. ${inst.text.trim()}`)
        .join('\n\n');

      const recipeUpdate = {
        name: editedRecipe.name,
        description: editedRecipe.description,
        short_description: editedRecipe.short_description,
        prep_min: parseInt(editedRecipe.prep_min) || 0,
        cook_min: parseInt(editedRecipe.cook_min) || 0,
        rest_min: parseInt(editedRecipe.rest_min) || 0,
        servings: parseInt(editedRecipe.servings) || 4,
        instructions: instructionsText,
        chef_tips: editedRecipe.chef_tips,
        is_vegetarian: editedRecipe.is_vegetarian,
        is_vegan: editedRecipe.is_vegan,
        is_gluten_free: editedRecipe.is_gluten_free,
        updated_at: new Date().toISOString()
      };

      const { error: recipeError } = await supabase
        .from('recipes')
        .update(recipeUpdate)
        .eq('id', id);

      if (recipeError) throw recipeError;

      // 2. Supprimer les anciens ingrédients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) throw deleteError;

      // 3. Ajouter les nouveaux ingrédients
      const ingredientsToAdd = editedIngredients
        .filter(ing => ing.canonical_food_id && ing.quantity > 0)
        .map(ing => ({
          recipe_id: parseInt(id),
          canonical_food_id: parseInt(ing.canonical_food_id),
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          notes: ing.notes || null,
          created_at: new Date().toISOString()
        }));

      if (ingredientsToAdd.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsToAdd);

        if (ingredientsError) throw ingredientsError;
      }

      // 4. Recharger la recette
      window.location.reload();
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    
    // Charger les ingrédients disponibles dès le début
    await loadAvailableIngredients();
    
    // 1) recette + ingrédients + meta produit
    console.log('Chargement de la recette avec ID:', id);
    const { data: r, error: errR } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          id,
          canonical_food_id,
          quantity,
          unit,
          notes,
          canonical_foods (
            id,
            name,
            category,
            subcategory
          )
        )
      `)
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
    
    // Charger les ingrédients de la recette
    try {
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          id,
          quantity,
          unit,
          notes,
          canonical_food_id,
          canonical_foods(id, name, category, subcategory)
        `)
        .eq('recipe_id', id);

      if (ingredientsError) {
        console.error('Erreur chargement ingrédients:', ingredientsError);
      }

      const ingList = ingredients || [];
      setIngs(ingList);
      console.log('Ingrédients chargés:', ingList);

      // Pour l'instant, pas de chargement de lots détaillé
      setLotsByProduct({});
      setMetaByProduct({});
    } catch (error) {
      console.error('Erreur ingrédients:', error);
      setIngs([]);
    }

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

  // Interface d'édition avec onglets (style cohérent avec /recipes/edit/new)
  if (isEditing) {
    return (
      <div className="recipes-container">
        {/* Header */}
        <div className="edit-header-bar">
          <h1>✏️ Édition de "{recipe.title}"</h1>
          <div className="edit-actions">
            <button 
              className="btn-tertiary" 
              onClick={() => {
                console.log('📊 État actuel:');
                console.log('- Ingrédients disponibles:', availableIngredients.length);
                console.log('- Premiers ingrédients:', availableIngredients.slice(0, 3));
                alert(`${availableIngredients.length} ingrédients chargés (voir console)`);
              }}
            >
              🔍 Test données
            </button>
            <button 
              className="btn-primary" 
              onClick={saveRecipe}
              disabled={sending}
            >
              {sending ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
            <button className="btn-secondary" onClick={cancelEditing}>
              ❌ Annuler
            </button>
          </div>
        </div>

        {/* Tabs de navigation */}
        <div className="edit-tabs">
          <button 
            className={`tab-btn ${activeEditTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('basic')}
          >
            📝 Informations
          </button>
          <button 
            className={`tab-btn ${activeEditTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('ingredients')}
          >
            🥕 Ingrédients
          </button>
          <button 
            className={`tab-btn ${activeEditTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('instructions')}
          >
            📋 Instructions  
          </button>
          <button 
            className={`tab-btn ${activeEditTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('nutrition')}
          >
            📊 Nutrition
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="edit-content">
          {activeEditTab === 'basic' && (
            <div className="edit-section">
              <h2>📝 Informations générales</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Nom de la recette *</label>
                <input
                  type="text"
                  value={editedRecipe.name || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, name: e.target.value}))}
                  placeholder="Ex: Ratatouille provençale"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description courte</label>
                <input
                  type="text"
                  value={editedRecipe.short_description || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, short_description: e.target.value}))}
                  placeholder="Ex: Mijoté de légumes du soleil"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description complète</label>
              <textarea
                value={editedRecipe.description || ''}
                onChange={(e) => setEditedRecipe(prev => ({...prev, description: e.target.value}))}
                placeholder="Décrivez la recette, son origine, ses spécificités..."
                rows="4"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Temps de préparation (min)</label>
                <input
                  type="number"
                  min="0"
                  value={editedRecipe.prep_min || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, prep_min: e.target.value}))}
                />
              </div>

              <div className="form-group">
                <label>Temps de cuisson (min)</label>
                <input
                  type="number"
                  min="0"
                  value={editedRecipe.cook_min || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, cook_min: e.target.value}))}
                />
              </div>

              <div className="form-group">
                <label>Temps de repos (min)</label>
                <input
                  type="number"
                  min="0"
                  value={editedRecipe.rest_min || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, rest_min: e.target.value}))}
                />
              </div>

              <div className="form-group">
                <label>Portions</label>
                <input
                  type="number"
                  min="1"
                  value={editedRecipe.servings || ''}
                  onChange={(e) => setEditedRecipe(prev => ({...prev, servings: e.target.value}))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Régimes alimentaires</label>
              <div className="checkboxes-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editedRecipe.is_vegetarian || false}
                    onChange={(e) => setEditedRecipe(prev => ({...prev, is_vegetarian: e.target.checked}))}
                  />
                  🥬 Végétarien
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editedRecipe.is_vegan || false}
                    onChange={(e) => setEditedRecipe(prev => ({...prev, is_vegan: e.target.checked}))}
                  />
                  🌱 Vegan
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editedRecipe.is_gluten_free || false}
                    onChange={(e) => setEditedRecipe(prev => ({...prev, is_gluten_free: e.target.checked}))}
                  />
                  🌾 Sans gluten
                </label>
              </div>
            </div>
            </div>
          )}

          {activeEditTab === 'ingredients' && (
            <div className="edit-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>🥕 Ingrédients</h2>
              <button className="add-btn" onClick={addIngredient}>
                + Ajouter un ingrédient
              </button>
            </div>

            <div className="ingredients-list">
              {editedIngredients.map((ingredient, index) => (
                <div key={ingredient.id} className="ingredient-row">
                  <IngredientSearchSelector
                    availableIngredients={availableIngredients}
                    selectedIngredientId={ingredient.canonical_food_id}
                    onIngredientSelect={(ingredientId) => updateIngredient(index, 'canonical_food_id', ingredientId)}
                    placeholder="Rechercher un ingrédient..."
                  />

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ingredient.quantity || ''}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    placeholder="Qté"
                  />

                  <select
                    value={ingredient.unit || 'g'}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="unité">unité</option>
                    <option value="c.à.s">c.à.s</option>
                    <option value="c.à.c">c.à.c</option>
                    <option value="pincée">pincée</option>
                  </select>

                  <input
                    type="text"
                    value={ingredient.notes || ''}
                    onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                    placeholder="Notes (optionnel)"
                  />

                  <button
                    className="remove-btn"
                    onClick={() => removeIngredient(index)}
                    title="Supprimer cet ingrédient"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {editedIngredients.length === 0 && (
                <div className="empty-ingredients">
                  <p>Aucun ingrédient ajouté. Cliquez sur "Ajouter un ingrédient" pour commencer.</p>
                </div>
              )}
            </div>
            </div>
          )}

          {activeEditTab === 'instructions' && (
            <div className="edit-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>📋 Instructions</h2>
              <button className="add-btn" onClick={addInstruction}>
                + Ajouter une étape
              </button>
            </div>

            <div className="instructions-list">
              {editedInstructions.map((instruction, index) => (
                <div key={instruction.id} className="instruction-block">
                  <div className="instruction-header">
                    <div className="step-number">Étape {index + 1}</div>
                    <button
                      className="remove-btn"
                      onClick={() => removeInstruction(index)}
                      title="Supprimer cette étape"
                    >
                      🗑️
                    </button>
                  </div>
                  <textarea
                    value={instruction.text || ''}
                    onChange={(e) => updateInstruction(index, 'text', e.target.value)}
                    placeholder={`Décrivez l'étape ${index + 1} en détail...`}
                    rows="3"
                  />
                  <div className="instruction-meta">
                    <input
                      type="number"
                      min="0"
                      value={instruction.duration || ''}
                      onChange={(e) => updateInstruction(index, 'duration', e.target.value)}
                      placeholder="Temps (min)"
                      style={{width: '120px'}}
                    />
                    <select
                      value={instruction.type || 'preparation'}
                      onChange={(e) => updateInstruction(index, 'type', e.target.value)}
                      style={{width: '150px'}}
                    >
                      <option value="preparation">Préparation</option>
                      <option value="cooking">Cuisson</option>
                      <option value="resting">Repos</option>
                      <option value="assembly">Assemblage</option>
                    </select>
                  </div>
                </div>
              ))}

              {editedInstructions.length === 0 && (
                <div className="empty-instructions">
                  <p>Aucune étape ajoutée. Cliquez sur "Ajouter une étape" pour commencer.</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>💡 Conseils du chef (optionnel)</label>
              <textarea
                value={editedRecipe.chef_tips || ''}
                onChange={(e) => setEditedRecipe(prev => ({...prev, chef_tips: e.target.value}))}
                placeholder="Astuces, variations, conseils de présentation..."
                rows="3"
              />
            </div>
            </div>
          )}

          {activeEditTab === 'nutrition' && (
            <div className="edit-section">
              <h2>📊 Informations nutritionnelles</h2>
              <p style={{color: '#6b7280', fontStyle: 'italic', marginBottom: '20px'}}>
                Les informations nutritionnelles seront calculées automatiquement selon les ingrédients ajoutés.
                Cette section sera développée dans une prochaine version.
              </p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Score Myko estimé</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={recipe.myko_score || ''}
                    placeholder="Sera calculé automatiquement"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <button className="action-btn tertiary" onClick={startEditing}>
            📝 Modifier la recette
          </button>
        </div>
      </div>
    </div>
  );
}
