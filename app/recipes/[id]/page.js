// app/recipes/[id]/page.js
'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
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
  const [recipeSteps, setRecipeSteps] = useState([]);       // Étapes de la recette depuis recipe_steps
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

  // État pour le carrousel d'instructions
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // État pour les données nutritionnelles
  const [nutrition, setNutrition] = useState(null);
  const [micronutrients, setMicronutrients] = useState(null);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);

  // Ref pour le drag-to-scroll des ingrédients
  const ingredientsListRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Préférence: ne jamais dépasser (cap l'auto-remplissage)
  const [noOverfill, setNoOverfill] = useState(true);

  // Handlers pour le drag-to-scroll des ingrédients
  const handleMouseDown = (e) => {
    if (!ingredientsListRef.current) return;
    setIsDragging(true);
    setStartY(e.pageY - ingredientsListRef.current.offsetTop);
    setScrollTop(ingredientsListRef.current.scrollTop);
    ingredientsListRef.current.style.cursor = 'grabbing';
    ingredientsListRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !ingredientsListRef.current) return;
    e.preventDefault();
    const y = e.pageY - ingredientsListRef.current.offsetTop;
    const walk = (y - startY) * 2;
    ingredientsListRef.current.scrollTop = scrollTop - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (ingredientsListRef.current) {
      ingredientsListRef.current.style.cursor = 'grab';
      ingredientsListRef.current.style.userSelect = 'auto';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (ingredientsListRef.current) {
        ingredientsListRef.current.style.cursor = 'grab';
        ingredientsListRef.current.style.userSelect = 'auto';
      }
    }
  };

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

    // Charger les étapes depuis recipeSteps
    if (recipeSteps && recipeSteps.length > 0) {
      setEditedInstructions(recipeSteps.map(step => ({
        id: step.id || Math.random(),
        step_no: step.step_no,
        text: step.instruction || step.description || '',
        duration: step.duration_min || '',
        temperature: step.temperature || '',
        temperature_unit: step.temperature_unit || '°C',
        type: step.type || 'preparation'
      })));
    } else {
      // Si pas d'étapes, créer une étape vide
      setEditedInstructions([{
        id: Math.random(),
        step_no: 1,
        text: '',
        duration: '',
        temperature: '',
        temperature_unit: '°C',
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
      step_no: prev.length + 1,
      text: '',
      duration: '',
      temperature: '',
      temperature_unit: '°C',
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

      // 1. Sauvegarder la recette principale (sans instructions dans le champ texte)
      const recipeUpdate = {
        name: editedRecipe.name,
        description: editedRecipe.description,
        short_description: editedRecipe.short_description,
        prep_min: parseInt(editedRecipe.prep_min) || 0,
        cook_min: parseInt(editedRecipe.cook_min) || 0,
        rest_min: parseInt(editedRecipe.rest_min) || 0,
        servings: parseInt(editedRecipe.servings) || 4,
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
      const { error: deleteIngredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteIngredientsError) throw deleteIngredientsError;

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

      // 4. Supprimer les anciennes étapes
      const { error: deleteStepsError } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', id);

      if (deleteStepsError) throw deleteStepsError;

      // 5. Ajouter les nouvelles étapes
      const stepsToAdd = editedInstructions
        .filter(inst => inst.text && inst.text.trim())
        .map((inst, index) => ({
          recipe_id: parseInt(id),
          step_no: index + 1,
          instruction: inst.text.trim(),
          duration_min: inst.duration ? parseInt(inst.duration) : null,
          temperature: inst.temperature ? parseFloat(inst.temperature) : null,
          temperature_unit: inst.temperature_unit || '°C',
          type: inst.type || 'preparation',
          created_at: new Date().toISOString()
        }));

      if (stepsToAdd.length > 0) {
        const { error: stepsError } = await supabase
          .from('recipe_steps')
          .insert(stepsToAdd);

        if (stepsError) throw stepsError;
      }

      // 6. Recharger la recette
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
    
    // Essayer d'abord avec les relations
    let { data: r, error: errR } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    // Si erreur avec les relations, essayer une requête simple
    if (errR) {
      console.error('Erreur première requête:', errR);
      // Essayons une requête de fallback plus simple
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fallbackError) {
        console.error('Erreur requête fallback:', fallbackError);
      } else {
        r = fallbackData;
        errR = null;
      }
    }
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

    const totalTime = (r?.prep_time_minutes || 0) + (r?.cook_time_minutes || 0) + (r?.rest_min || 0);
    setRecipe({ 
      id: r?.id, 
      title: r?.title || r?.name, 
      description: r?.description,
      short_description: r?.short_description,
      time_min: totalTime, 
      prep_min: r?.prep_time_minutes,
      cook_min: r?.cook_time_minutes,
      rest_min: r?.rest_min,
      servings: r?.servings,
      steps: r?.instructions,
      myko_score: r?.myko_score,
      chef_tips: r?.chef_tips,
      is_vegetarian: r?.is_vegetarian,
      is_vegan: r?.is_vegan,
      is_gluten_free: r?.is_gluten_free
    });
    
    // Charger les ingrédients de la recette (requête séparée et robuste)
    try {
      console.log('🥕 Chargement des ingrédients pour la recette:', id);
      
      // Charger avec les relations vers canonical_foods ET archetypes
      let { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select(`
          id,
          quantity,
          unit,
          notes,
          canonical_food_id,
          archetype_id,
          canonical_foods (
            id,
            canonical_name,
            category_id,
            primary_unit
          ),
          archetypes (
            id,
            name,
            canonical_food_id,
            process,
            primary_unit
          )
        `)
        .eq('recipe_id', id);

      if (ingredientsError) {
        console.error('❌ Erreur chargement ingrédients:', ingredientsError);
        ingredients = [];
      }

      console.log(`✅ ${ingredients?.length || 0} ingrédients chargés`);

      // Enrichir les ingrédients avec le nom et l'unité corrects
      const enrichedIngredients = (ingredients || []).map(ingredient => {
        // Déterminer le nom et l'unité en fonction de canonical_food ou archetype
        let name, primary_unit, source_type, source_id;
        
        if (ingredient.archetype_id && ingredient.archetypes) {
          // Si c'est un archetype, utiliser ses infos
          name = ingredient.archetypes.name;
          primary_unit = ingredient.archetypes.primary_unit || ingredient.unit;
          source_type = 'archetype';
          source_id = ingredient.archetype_id;
        } else if (ingredient.canonical_food_id && ingredient.canonical_foods) {
          // Sinon utiliser le canonical_food
          name = ingredient.canonical_foods.canonical_name;
          primary_unit = ingredient.canonical_foods.primary_unit || ingredient.unit;
          source_type = 'canonical_food';
          source_id = ingredient.canonical_food_id;
        } else {
          // Fallback si ni l'un ni l'autre
          name = 'Ingrédient inconnu';
          primary_unit = ingredient.unit || 'g';
          source_type = 'unknown';
          source_id = null;
        }

        return {
          ...ingredient,
          name,
          primary_unit,
          source_type,
          source_id,
          // Garder la compatibilité avec l'ancien système
          canonical_foods: ingredient.canonical_foods || { 
            id: source_id, 
            name 
          }
        };
      });

      const ingList = enrichedIngredients;
      setIngs(ingList);
      console.log('✅ Ingrédients chargés:', ingList.length, 'ingrédients');
      console.log('📋 Détail des ingrédients:', ingList);
      
      if (ingList.length > 0) {
        console.log('📌 Premier ingrédient:', ingList[0]);
      }

      // Pour l'instant, pas de chargement de lots détaillé
      setLotsByProduct({});
      setMetaByProduct({});
    } catch (error) {
      console.error('Erreur ingrédients:', error);
      setIngs([]);
    }

    // Charger les étapes de la recette depuis recipe_steps
    try {
      console.log('📋 Chargement des étapes pour la recette:', id);

      const { data: steps, error: stepsError } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', id)
        .order('step_no', { ascending: true });

      if (stepsError) {
        console.error('❌ Erreur chargement étapes:', stepsError);
        setRecipeSteps([]);
      } else {
        console.log(`✅ ${steps?.length || 0} étapes chargées`);
        setRecipeSteps(steps || []);
      }
    } catch (error) {
      console.error('Erreur étapes:', error);
      setRecipeSteps([]);
    }

    // Charger les données nutritionnelles
    try {
      console.log('🍎 Chargement des données nutritionnelles...');

      const { data: nutritionData, error: nutritionError } = await supabase
        .from('recipe_nutrition_cache')
        .select('*')
        .eq('recipe_id', id)
        .maybeSingle();

      if (nutritionError) {
        console.error('❌ Erreur nutrition:', nutritionError);
      } else if (nutritionData) {
        console.log('✅ Données nutritionnelles chargées');
        setNutrition({
          calories: nutritionData.calories_per_serving,
          proteines: nutritionData.proteines_per_serving,
          glucides: nutritionData.glucides_per_serving,
          lipides: nutritionData.lipides_per_serving
        });
      }
    } catch (error) {
      console.error('Erreur nutrition:', error);
    }

    // Charger les micronutriments depuis les ingrédients
    try {
      console.log('🥕 Chargement des micronutriments...');

      const { data: ingredients, error: ingError } = await supabase
        .from('recipe_ingredients')
        .select(`
          quantity,
          unit,
          canonical_food_id,
          archetype_id,
          canonical_foods (
            id,
            canonical_name,
            nutrition_id,
            nutritional_data (
              fibres_g,
              sucres_g,
              ag_satures_g,
              calcium_mg,
              fer_mg,
              magnesium_mg,
              potassium_mg,
              sodium_mg,
              zinc_mg,
              vitamine_a_ug,
              vitamine_c_mg,
              vitamine_d_ug,
              vitamine_e_mg,
              vitamine_k_ug,
              vitamine_b1_mg,
              vitamine_b2_mg,
              vitamine_b3_mg,
              vitamine_b6_mg,
              vitamine_b9_ug,
              vitamine_b12_ug
            )
          ),
          archetypes (
            canonical_food_id,
            canonical_foods (
              id,
              canonical_name,
              nutrition_id,
              nutritional_data (
                fibres_g,
                sucres_g,
                ag_satures_g,
                calcium_mg,
                fer_mg,
                magnesium_mg,
                potassium_mg,
                sodium_mg,
                zinc_mg,
                vitamine_a_ug,
                vitamine_c_mg,
                vitamine_d_ug,
                vitamine_e_mg,
                vitamine_k_ug,
                vitamine_b1_mg,
                vitamine_b2_mg,
                vitamine_b3_mg,
                vitamine_b6_mg,
                vitamine_b9_ug,
                vitamine_b12_ug
              )
            )
          )
        `)
        .eq('recipe_id', id);

      if (!ingError && ingredients && ingredients.length > 0) {
        const micro = {
          fibres: 0,
          sucres: 0,
          ag_satures: 0,
          calcium: 0,
          fer: 0,
          magnesium: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
          vitamine_a: 0,
          vitamine_c: 0,
          vitamine_d: 0,
          vitamine_e: 0,
          vitamine_k: 0,
          vitamine_b1: 0,
          vitamine_b2: 0,
          vitamine_b3: 0,
          vitamine_b6: 0,
          vitamine_b9: 0,
          vitamine_b12: 0,
        };

        let ingredientsWithNutrition = 0;
        let ingredientsWithoutNutrition = 0;

        ingredients.forEach((ing, index) => {
          // Priorité: canonical_foods direct, sinon archetype's canonical_foods
          const canonicalFood = ing.canonical_foods || ing.archetypes?.canonical_foods;
          const nutritionData = canonicalFood?.nutritional_data;

          console.log(`\n🥕 Ingrédient #${index + 1}:`);
          console.log(`   ID canonical_food: ${ing.canonical_food_id || 'via archetype'}`);
          console.log(`   ID archetype: ${ing.archetype_id || 'n/a'}`);
          console.log(`   Quantité: ${ing.quantity} ${ing.unit}`);
          console.log(`   Canonical food trouvé: ${canonicalFood ? '✓' : '✗'}`);
          console.log(`   Données nutritionnelles: ${nutritionData ? '✓' : '✗'}`);

          if (nutritionData) {
            ingredientsWithNutrition++;
            const qty = parseFloat(ing.quantity) || 100;
            const factor = qty / 100;

            console.log(`   📊 Calculs nutritionnels:`);
            console.log(`      - Facteur multiplicateur: ${factor.toFixed(2)} (${qty}g / 100g)`);
            console.log(`      - Fibres: ${nutritionData.fibres_g || 0}g × ${factor.toFixed(2)} = ${((nutritionData.fibres_g || 0) * factor).toFixed(2)}g`);
            console.log(`      - Calcium: ${nutritionData.calcium_mg || 0}mg × ${factor.toFixed(2)} = ${((nutritionData.calcium_mg || 0) * factor).toFixed(2)}mg`);
            console.log(`      - Vitamine C: ${nutritionData.vitamine_c_mg || 0}mg × ${factor.toFixed(2)} = ${((nutritionData.vitamine_c_mg || 0) * factor).toFixed(2)}mg`);

            micro.fibres += (nutritionData.fibres_g || 0) * factor;
            micro.sucres += (nutritionData.sucres_g || 0) * factor;
            micro.ag_satures += (nutritionData.ag_satures_g || 0) * factor;
            micro.calcium += (nutritionData.calcium_mg || 0) * factor;
            micro.fer += (nutritionData.fer_mg || 0) * factor;
            micro.magnesium += (nutritionData.magnesium_mg || 0) * factor;
            micro.potassium += (nutritionData.potassium_mg || 0) * factor;
            micro.sodium += (nutritionData.sodium_mg || 0) * factor;
            micro.zinc += (nutritionData.zinc_mg || 0) * factor;
            micro.vitamine_a += (nutritionData.vitamine_a_ug || 0) * factor;
            micro.vitamine_c += (nutritionData.vitamine_c_mg || 0) * factor;
            micro.vitamine_d += (nutritionData.vitamine_d_ug || 0) * factor;
            micro.vitamine_e += (nutritionData.vitamine_e_mg || 0) * factor;
            micro.vitamine_k += (nutritionData.vitamine_k_ug || 0) * factor;
            micro.vitamine_b1 += (nutritionData.vitamine_b1_mg || 0) * factor;
            micro.vitamine_b2 += (nutritionData.vitamine_b2_mg || 0) * factor;
            micro.vitamine_b3 += (nutritionData.vitamine_b3_mg || 0) * factor;
            micro.vitamine_b6 += (nutritionData.vitamine_b6_mg || 0) * factor;
            micro.vitamine_b9 += (nutritionData.vitamine_b9_ug || 0) * factor;
            micro.vitamine_b12 += (nutritionData.vitamine_b12_ug || 0) * factor;
          } else {
            ingredientsWithoutNutrition++;
            console.log(`   ⚠️  Pas de données nutritionnelles disponibles`);
            if (!canonicalFood) {
              console.log(`   ❌ Canonical food non trouvé - vérifier la relation dans recipe_ingredients`);
            } else if (!canonicalFood.nutrition_id) {
              console.log(`   ❌ nutrition_id manquant dans canonical_foods`);
            }
          }
        });

        console.log(`\n📊 Résumé du calcul nutritionnel:`);
        console.log(`   ✅ Ingrédients avec données: ${ingredientsWithNutrition}`);
        console.log(`   ❌ Ingrédients sans données: ${ingredientsWithoutNutrition}`);
        console.log(`   📈 Totaux calculés:`);
        console.log(`      - Fibres: ${micro.fibres.toFixed(1)}g`);
        console.log(`      - Calcium: ${micro.calcium.toFixed(1)}mg`);
        console.log(`      - Vitamine C: ${micro.vitamine_c.toFixed(1)}mg`);

        console.log('✅ Micronutriments calculés');
        setMicronutrients(micro);
      }
    } catch (error) {
      console.error('Erreur micronutriments:', error);
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

  // Calculer le temps total à partir de la somme des durées des étapes
  const totalTime = useMemo(() => {
    if (recipeSteps && recipeSteps.length > 0) {
      return recipeSteps.reduce((sum, step) => {
        const duration = parseInt(step.duration_min) || 0;
        return sum + duration;
      }, 0);
    }
    // Fallback sur les valeurs de la recette si pas d'étapes
    return (recipe?.prep_min || 0) + (recipe?.cook_min || 0) + (recipe?.rest_min || 0);
  }, [recipeSteps, recipe]);

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
                  <div className="instruction-meta" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input
                      type="number"
                      min="0"
                      value={instruction.duration || ''}
                      onChange={(e) => updateInstruction(index, 'duration', e.target.value)}
                      placeholder="Temps (min)"
                      style={{width: '120px'}}
                    />
                    <input
                      type="number"
                      min="0"
                      value={instruction.temperature || ''}
                      onChange={(e) => updateInstruction(index, 'temperature', e.target.value)}
                      placeholder="Temp."
                      style={{width: '80px'}}
                    />
                    <select
                      value={instruction.temperature_unit || '°C'}
                      onChange={(e) => updateInstruction(index, 'temperature_unit', e.target.value)}
                      style={{width: '60px'}}
                    >
                      <option value="°C">°C</option>
                      <option value="°F">°F</option>
                    </select>
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
        {/* Cartes d'information condensées */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <span>⏱️</span>
            <span style={{ fontWeight: '600' }}>{totalTime} min</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <span>👥</span>
            <span style={{ fontWeight: '600' }}>{recipe.servings || 4} portions</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <span>📊</span>
            <span style={{ fontWeight: '600' }}>{recipe.myko_score}/100</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <span>🌱</span>
            <span style={{ fontWeight: '600' }}>
              {recipe.is_vegan ? 'Vegan' : recipe.is_vegetarian ? 'Végétarien' : 'Omnivore'}
            </span>
          </div>

          {/* Badges nutritionnels */}
          {nutrition && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <span>🔥</span>
                <span style={{ fontWeight: '600' }}>{Math.round(nutrition.calories)} kcal</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <span>🥩</span>
                <span style={{ fontWeight: '600' }}>{nutrition.proteines.toFixed(1)}g prot.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <span>🌾</span>
                <span style={{ fontWeight: '600' }}>{nutrition.glucides.toFixed(1)}g gluc.</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
                borderRadius: '8px',
                fontSize: '0.9rem'
              }}>
                <span>🧈</span>
                <span style={{ fontWeight: '600' }}>{nutrition.lipides.toFixed(1)}g lip.</span>
              </div>
            </>
          )}

          {/* Bouton pour afficher les détails nutritionnels */}
          {nutrition && (
            <button
              onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.color = '#059669';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.color = '#6b7280';
              }}
            >
              {showDetailedNutrition ? '▼' : '▶'} Détails nutritionnels
            </button>
          )}
        </div>

        {/* Section détails nutritionnels */}
        {nutrition && showDetailedNutrition && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid #bbf7d0',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#047857'
            }}>
              📊 Valeurs nutritionnelles détaillées (par portion)
            </h3>

            {/* Macronutriments principaux */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Énergie</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#059669' }}>
                  {Math.round(nutrition.calories)} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>kcal</span>
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Protéines</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#dc2626' }}>
                  {nutrition.proteines.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>g</span>
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Glucides</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#7c3aed' }}>
                  {nutrition.glucides.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>g</span>
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Lipides</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ca8a04' }}>
                  {nutrition.lipides.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: '400' }}>g</span>
                </div>
              </div>
            </div>

            {/* Micronutriments */}
            {micronutrients && (
              <>
                {/* Autres nutriments */}
                {(micronutrients.fibres > 0 || micronutrients.sucres > 0 || micronutrients.ag_satures > 0) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#047857',
                      marginBottom: '12px',
                      borderBottom: '1px solid #bbf7d0',
                      paddingBottom: '8px'
                    }}>
                      Autres nutriments
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px'
                    }}>
                      {micronutrients.fibres > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Fibres</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.fibres.toFixed(1)} g
                          </span>
                        </div>
                      )}
                      {micronutrients.sucres > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Sucres</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.sucres.toFixed(1)} g
                          </span>
                        </div>
                      )}
                      {micronutrients.ag_satures > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>AG saturés</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.ag_satures.toFixed(1)} g
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Minéraux */}
                {(micronutrients.calcium > 0 || micronutrients.fer > 0 || micronutrients.magnesium > 0 ||
                  micronutrients.potassium > 0 || micronutrients.sodium > 0 || micronutrients.zinc > 0) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#047857',
                      marginBottom: '12px',
                      borderBottom: '1px solid #bbf7d0',
                      paddingBottom: '8px'
                    }}>
                      ⚡ Minéraux
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px'
                    }}>
                      {micronutrients.calcium > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Calcium</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.calcium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.fer > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Fer</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.fer.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.magnesium > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Magnésium</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.magnesium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.potassium > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Potassium</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.potassium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.sodium > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Sodium</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.sodium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.zinc > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Zinc</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.zinc.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vitamines */}
                {(micronutrients.vitamine_a > 0 || micronutrients.vitamine_c > 0 || micronutrients.vitamine_d > 0 ||
                  micronutrients.vitamine_e > 0 || micronutrients.vitamine_k > 0 || micronutrients.vitamine_b1 > 0 ||
                  micronutrients.vitamine_b2 > 0 || micronutrients.vitamine_b3 > 0 || micronutrients.vitamine_b6 > 0 ||
                  micronutrients.vitamine_b9 > 0 || micronutrients.vitamine_b12 > 0) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#047857',
                      marginBottom: '12px',
                      borderBottom: '1px solid #bbf7d0',
                      paddingBottom: '8px'
                    }}>
                      🌈 Vitamines
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                      gap: '8px'
                    }}>
                      {micronutrients.vitamine_a > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine A</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_a.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_c > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine C</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_c.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_d > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine D</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_d.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_e > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine E</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_e.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_k > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine K</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_k.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b1 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B1</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b1.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b2 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B2</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b2.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b3 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B3</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b3.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b6 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B6</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b6.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b9 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B9</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b9.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b12 > 0 && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#374151' }}>Vitamine B12</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#059669' }}>
                            {micronutrients.vitamine_b12.toFixed(2)} µg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="recipe-body" style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          <div className="ingredients-section">
            <h2>Ingrédients ({ings.length})</h2>
            {ings.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <ul
                  ref={ingredientsListRef}
                  className="ingredients-list hide-scrollbar"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    maxHeight: '320px',
                    overflowY: 'scroll',
                    paddingRight: '8px',
                    cursor: 'grab',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    position: 'relative',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {ings.map((ing, index) => {
                  // Déterminer le nom à afficher
                  const displayName = ing.name || ing.canonical_foods?.name || 'Ingrédient inconnu';
                  
                  // Créer le lien vers la page du produit si on a l'ID
                  const productId = ing.canonical_food_id || ing.archetype_id;
                  const productUrl = productId ? `/produits/${productId}` : null;
                  
                  return (
                    <li key={ing.id || index} className="ingredient-item">
                      <span className="ingredient-quantity">
                        {roundForUnit(ing.quantity, ing.unit)} {ing.unit}
                      </span>
                      {productUrl ? (
                        <a 
                          href={productUrl} 
                          className="ingredient-name ingredient-link"
                          style={{ 
                            color: '#059669', 
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#047857'}
                          onMouseLeave={(e) => e.target.style.color = '#059669'}
                        >
                          {displayName}
                        </a>
                      ) : (
                        <span className="ingredient-name">
                          {displayName}
                        </span>
                      )}
                      {ing.notes && (
                        <span className="ingredient-notes">({ing.notes})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {/* Gradient pour indiquer qu'il y a plus de contenu */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40px',
                background: 'linear-gradient(to bottom, transparent, white)',
                pointerEvents: 'none'
              }} />
            </div>
            ) : (
              <p className="no-ingredients" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                Aucun ingrédient défini pour cette recette.
              </p>
            )}
          </div>

          <div className="instructions-section">
            <h2>Instructions</h2>
            <div className="instructions-content">
              {recipeSteps && recipeSteps.length > 0 ? (
                <div className="steps-carousel" style={{
                  position: 'relative',
                  padding: '10px 0'
                }}>
                  {/* Carte de l'étape actuelle */}
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    padding: '24px',
                    minHeight: '140px',
                    position: 'relative',
                    border: '2px solid #f3f4f6'
                  }}>
                    {/* Numéro de l'étape */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '32px',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 12px rgba(5,150,105,0.3)'
                    }}>
                      {recipeSteps[currentStepIndex].step_no || currentStepIndex + 1}
                    </div>

                    {/* Description de l'étape */}
                    <div style={{
                      marginTop: '16px',
                      fontSize: '1.05rem',
                      lineHeight: '1.7',
                      color: '#1f2937'
                    }}>
                      {recipeSteps[currentStepIndex].instruction || recipeSteps[currentStepIndex].description}
                    </div>
                  </div>

                  {/* Boutons de navigation */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                      disabled={currentStepIndex === 0}
                      style={{
                        background: currentStepIndex === 0 ? '#e5e7eb' : '#059669',
                        color: currentStepIndex === 0 ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: currentStepIndex === 0 ? 'none' : '0 2px 8px rgba(5,150,105,0.2)'
                      }}
                    >
                      ← Précédent
                    </button>

                    {/* Indicateurs de points */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {recipeSteps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentStepIndex(index)}
                          style={{
                            width: index === currentStepIndex ? '32px' : '10px',
                            height: '10px',
                            borderRadius: '5px',
                            background: index === currentStepIndex ? '#059669' : '#d1d5db',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            padding: 0
                          }}
                          aria-label={`Aller à l'étape ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentStepIndex(Math.min(recipeSteps.length - 1, currentStepIndex + 1))}
                      disabled={currentStepIndex === recipeSteps.length - 1}
                      style={{
                        background: currentStepIndex === recipeSteps.length - 1 ? '#e5e7eb' : '#059669',
                        color: currentStepIndex === recipeSteps.length - 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: currentStepIndex === recipeSteps.length - 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: currentStepIndex === recipeSteps.length - 1 ? 'none' : '0 2px 8px rgba(5,150,105,0.2)'
                      }}
                    >
                      Suivant →
                    </button>
                  </div>

                  {/* Compteur d'étapes */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '12px',
                    color: '#6b7280',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    Étape {currentStepIndex + 1} sur {recipeSteps.length}
                  </div>
                </div>
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
