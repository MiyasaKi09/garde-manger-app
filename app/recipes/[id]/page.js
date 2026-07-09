// app/recipes/[id]/page.js
'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/authFetch';
import { toast } from '@/components/Toast';
import IngredientSearchSelector from './IngredientSearchSelector';
import InstructionsCarousel from './components/InstructionsCarousel';
import CookMode from '@/components/CookMode';
import CookWizard from '@/components/CookWizard';
import './recipe-detail.css';
import './IngredientSearchSelector.css';

function roundForUnit(q, unit) {
  const u = (unit||'').toLowerCase();
  // On autorise 2 décimales partout (même 'u' au cas où tu stockes des demi-pièces).
  return Math.round(Number(q) * 100) / 100;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [ings, setIngs] = useState([]);
  const [recipeSteps, setRecipeSteps] = useState([]);       // Étapes de la recette depuis recipe_steps
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('basic');
  const [editedRecipe, setEditedRecipe] = useState({});
  const [editedIngredients, setEditedIngredients] = useState([]);
  const [editedInstructions, setEditedInstructions] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);

  const [showCookWizard, setShowCookWizard] = useState(false);
  const [showCookMode, setShowCookMode] = useState(false);

  // État pour les données nutritionnelles
  const [nutrition, setNutrition] = useState(null);
  const [micronutrients, setMicronutrients] = useState(null);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);
  const [ingredientsWithoutNutrition, setIngredientsWithoutNutrition] = useState(0);

  // Ref pour le drag-to-scroll des ingrédients
  const ingredientsListRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

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
      const { data, error } = await supabase
        .from('canonical_foods')
        .select('id, name, category, subcategory')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setAvailableIngredients(data || []);
    } catch {
      // Non bloquant : l'édition d'ingrédients sera vide
    }
  }

  function startEditing() {
    setEditedRecipe({
      name: recipe.title || '',
      description: recipe.description || '',
      prep_min: recipe.prep_min || 0,
      cook_min: recipe.cook_min || 0,
      servings: recipe.servings || 4,
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

      const ingredientRows = editedIngredients
        .filter(ing => ing.canonical_food_id && Number(ing.quantity) > 0)
        .map(ing => ({
          canonical_food_id: parseInt(ing.canonical_food_id),
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          notes: ing.notes || null,
        }));

      const stepRows = editedInstructions
        .filter(inst => inst.text && inst.text.trim())
        .map((inst, index) => ({
          step_no: index + 1,
          instruction: inst.text.trim(),
          duration_min: inst.duration ? parseInt(inst.duration) : null,
          temperature: inst.temperature ? parseFloat(inst.temperature) : null,
          temperature_unit: inst.temperature_unit || '°C',
        }));

      const res = await authFetch('/api/recipes/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(id),
          name: editedRecipe.name,
          description: editedRecipe.description || null,
          prep_min: parseInt(editedRecipe.prep_min) || 0,
          cook_min: parseInt(editedRecipe.cook_min) || 0,
          servings: parseInt(editedRecipe.servings) || 4,
          ingredients: ingredientRows,
          steps: stepRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);

      router.refresh();
    } catch (error) {
      toast.error(`Erreur lors de la sauvegarde : ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  useEffect(()=>{ (async ()=>{
    setLoading(true);
    
    // Charger les ingrédients disponibles dès le début
    await loadAvailableIngredients();
    
    // 1) recette classique (maybeSingle évite l'exception PostgREST si absent)
    const { data: r, error: errR } = await supabase
      .from('recipes')
      .select('id, name, description, prep_time_minutes, cook_time_minutes, servings, cooking_method')
      .eq('id', id)
      .maybeSingle();

    if (errR) {
      setError('Une erreur est survenue lors du chargement de la recette.');
      setLoading(false);
      return;
    }

    if (!r) {
      // Vérifier si cet id correspond à une recette générée → redirection
      const { data: gen } = await supabase
        .from('generated_recipes')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      if (gen) {
        router.replace(`/recipes/generated/${id}`);
        return;
      }
      setNotFound(true);
      setLoading(false);
      return;
    }

    const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
    setRecipe({
      id: r.id,
      title: r.name,
      description: r.description,
      time_min: totalTime,
      prep_min: r.prep_time_minutes,
      cook_min: r.cook_time_minutes,
      servings: r.servings,
      cooking_method: r.cooking_method,
    });
    
    // Charger les ingrédients de la recette (requête séparée et robuste)
    try {
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
        ingredients = [];
      }

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

    } catch {
      setIngs([]);
    }

    // Charger les étapes de la recette depuis recipe_steps
    try {
      const { data: steps, error: stepsError } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', id)
        .order('step_no', { ascending: true });

      if (stepsError) {
        setRecipeSteps([]);
      } else {
        setRecipeSteps(steps || []);
      }
    } catch {
      setRecipeSteps([]);
    }

    // Charger les données nutritionnelles
    try {
      const { data: nutritionData, error: nutritionError } = await supabase
        .from('recipe_nutrition_cache')
        .select('*')
        .eq('recipe_id', id)
        .maybeSingle();

      if (!nutritionError && nutritionData) {
        setNutrition({
          calories: nutritionData.calories_per_serving,
          proteines: nutritionData.proteines_per_serving,
          glucides: nutritionData.glucides_per_serving,
          lipides: nutritionData.lipides_per_serving
        });
      }
    } catch {
      // Non bloquant
    }

    // Charger les micronutriments depuis les ingrédients
    try {
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

          if (nutritionData) {
            ingredientsWithNutrition++;
            const qty = parseFloat(ing.quantity) || 100;
            const factor = qty / 100;

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
          }
        });

        // Diviser par le nombre de portions pour avoir les valeurs par portion
        const servings = r?.servings || 1;
        const microPerServing = {};
        for (const key of Object.keys(micro)) {
          microPerServing[key] = Math.round((micro[key] / servings) * 100) / 100;
        }
        setMicronutrients(microPerServing);
        setIngredientsWithoutNutrition(ingredientsWithoutNutrition);
      }
    } catch {
      // Non bloquant
    }

    setLoading(false);
  })(); }, [id]);

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

  if (loading) {
    return (
      <div className="v21-page narrow">
        <div className="v21-skel" style={{ height: 24, width: 120 }} />
        <div className="v21-skel" style={{ height: 56, width: '70%', marginTop: 22 }} />
        <div className="v21-skel" style={{ height: 3, width: 92, marginTop: 22 }} />
        <div className="v21-skel" style={{ height: 200, marginTop: 28 }} />
        <div className="v21-skel" style={{ height: 260, marginTop: 24 }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="v21-page narrow">
        <div className="rd-error">
          <h2>Recette introuvable</h2>
          <p>Cette recette n'existe pas ou a été supprimée.</p>
          <button onClick={() => router.push('/recipes')} className="v21-btn">← Retour aux recettes</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v21-page narrow">
        <div className="rd-error">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={() => window.history.back()} className="v21-btn">← Retour</button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="v21-page narrow">
        <div className="rd-error">
          <h2>Recette introuvable</h2>
          <p>Aucune recette trouvée avec l'ID&nbsp;: {id}</p>
          <button onClick={() => window.history.back()} className="v21-btn">← Retour aux recettes</button>
        </div>
      </div>
    );
  }

  // Interface d'édition avec onglets (style cohérent avec /recipes/edit/new)
  if (isEditing) {
    return (
      <div className="v21-page narrow">
        {/* Header */}
        <div className="edit-header-bar">
          <h1>Édition — {recipe.title}</h1>
          <div className="edit-actions">
            <button className="btn-primary" onClick={saveRecipe} disabled={sending}>
              {sending ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <button className="btn-secondary" onClick={cancelEditing}>
              Annuler
            </button>
          </div>
        </div>

        {/* Tabs de navigation */}
        <div className="edit-tabs">
          <button
            className={`tab-btn ${activeEditTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('basic')}
          >
            Informations
          </button>
          <button
            className={`tab-btn ${activeEditTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('ingredients')}
          >
            Ingrédients
          </button>
          <button
            className={`tab-btn ${activeEditTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('instructions')}
          >
            Instructions
          </button>
          <button
            className={`tab-btn ${activeEditTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveEditTab('nutrition')}
          >
            Nutrition
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="edit-content">
          {activeEditTab === 'basic' && (
            <div className="edit-section">
              <h2>Informations générales</h2>
            
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
            <div className="edit-section-head">
              <h2>Ingrédients</h2>
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
                    ✕
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
            <div className="edit-section-head">
              <h2>Instructions</h2>
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
                      ✕
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
              <label>Conseils du chef (optionnel)</label>
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
              <h2>Informations nutritionnelles</h2>
              <p className="info-text">
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
    <div className="v21-page narrow rd-page">
      <button onClick={() => window.history.back()} className="v21-link rd-back">
        ← Recettes
      </button>

      <header className="rd-head">
        <span className="v21-eyebrow">Recette</span>
        <h1 className="v21-title rd-title">{recipe.title}</h1>
        <div className="v21-rule" />
        {recipe.description && <p className="v21-lede rd-desc">{recipe.description}</p>}
        <p className="rd-meta-line">
          {[
            `${totalTime} min`,
            `${recipe.servings || 4} portions`,
          ].filter(Boolean).join('  ·  ')}
        </p>
      </header>

      <div className="recipe-content">
        {/* Bandeau nutrition (par portion) */}
        {nutrition && (
          <div className="rd-nutrition">
            <div className="rd-nut-item"><span className="rd-nut-val">{Math.round(nutrition.calories)}</span><span className="rd-nut-label">kcal</span></div>
            <div className="rd-nut-item"><span className="rd-nut-val">{nutrition.proteines.toFixed(1)}g</span><span className="rd-nut-label">Protéines</span></div>
            <div className="rd-nut-item"><span className="rd-nut-val">{nutrition.glucides.toFixed(1)}g</span><span className="rd-nut-label">Glucides</span></div>
            <div className="rd-nut-item"><span className="rd-nut-val">{nutrition.lipides.toFixed(1)}g</span><span className="rd-nut-label">Lipides</span></div>
            <button className="rd-nut-toggle" onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}>
              {showDetailedNutrition ? '▼ Détails' : '▶ Détails'}
            </button>
          </div>
        )}

        {/* Avertissement nutrition incomplète */}
        {ingredientsWithoutNutrition > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.65, fontStyle: 'italic' }}>
            Valeurs partielles — {ingredientsWithoutNutrition} ingrédient{ingredientsWithoutNutrition > 1 ? 's' : ''} sans données nutritionnelles
          </p>
        )}

        {/* Section détails nutritionnels */}
        {nutrition && showDetailedNutrition && (
          <div className="rd-nut-detail">
            <span className="v21-bl">Valeurs détaillées · par portion</span>

            {/* Macronutriments principaux */}
            <div className="rd-nut-grid">
              <div className="rd-nut-card">
                <div className="rd-nut-card-l">Énergie</div>
                <div className="rd-nut-card-v">{Math.round(nutrition.calories)} <span>kcal</span></div>
              </div>
              <div className="rd-nut-card">
                <div className="rd-nut-card-l">Protéines</div>
                <div className="rd-nut-card-v">{nutrition.proteines.toFixed(1)} <span>g</span></div>
              </div>
              <div className="rd-nut-card">
                <div className="rd-nut-card-l">Glucides</div>
                <div className="rd-nut-card-v">{nutrition.glucides.toFixed(1)} <span>g</span></div>
              </div>
              <div className="rd-nut-card">
                <div className="rd-nut-card-l">Lipides</div>
                <div className="rd-nut-card-v">{nutrition.lipides.toFixed(1)} <span>g</span></div>
              </div>
            </div>

            {/* Micronutriments */}
            {micronutrients && (
              <>
                {/* Autres nutriments */}
                {(micronutrients.fibres > 0 || micronutrients.sucres > 0 || micronutrients.ag_satures > 0) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 className="rd-nut-h4">
                      Autres nutriments
                    </h4>
                    <div className="rd-micro-grid">
                      {micronutrients.fibres > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Fibres</span>
                          <span className="rd-micro-v">
                            {micronutrients.fibres.toFixed(1)} g
                          </span>
                        </div>
                      )}
                      {micronutrients.sucres > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Sucres</span>
                          <span className="rd-micro-v">
                            {micronutrients.sucres.toFixed(1)} g
                          </span>
                        </div>
                      )}
                      {micronutrients.ag_satures > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">AG saturés</span>
                          <span className="rd-micro-v">
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
                    <h4 className="rd-nut-h4">
                      Minéraux
                    </h4>
                    <div className="rd-micro-grid">
                      {micronutrients.calcium > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Calcium</span>
                          <span className="rd-micro-v">
                            {micronutrients.calcium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.fer > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Fer</span>
                          <span className="rd-micro-v">
                            {micronutrients.fer.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.magnesium > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Magnésium</span>
                          <span className="rd-micro-v">
                            {micronutrients.magnesium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.potassium > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Potassium</span>
                          <span className="rd-micro-v">
                            {micronutrients.potassium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.sodium > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Sodium</span>
                          <span className="rd-micro-v">
                            {micronutrients.sodium.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.zinc > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Zinc</span>
                          <span className="rd-micro-v">
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
                    <h4 className="rd-nut-h4">
                      Vitamines
                    </h4>
                    <div className="rd-micro-grid">
                      {micronutrients.vitamine_a > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine A</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_a.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_c > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine C</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_c.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_d > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine D</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_d.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_e > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine E</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_e.toFixed(1)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_k > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine K</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_k.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b1 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B1</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_b1.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b2 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B2</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_b2.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b3 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B3</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_b3.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b6 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B6</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_b6.toFixed(2)} mg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b9 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B9</span>
                          <span className="rd-micro-v">
                            {micronutrients.vitamine_b9.toFixed(1)} µg
                          </span>
                        </div>
                      )}
                      {micronutrients.vitamine_b12 > 0 && (
                        <div className="rd-micro-card">
                          <span className="rd-micro-l">Vitamine B12</span>
                          <span className="rd-micro-v">
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

        <div className="recipe-body">
          <div className="ingredients-section">
            <div className="v21-bh"><span className="v21-bl">Ingrédients · {ings.length}</span></div>
            {ings.length > 0 ? (
              <ul ref={ingredientsListRef} className="ingredients-list">
                {ings.map((ing, index) => {
                  const displayName = ing.name || ing.canonical_foods?.name || 'Ingrédient inconnu';

                  return (
                    <li key={ing.id || index} className="ingredient-item">
                      <span className="ingredient-quantity">
                        {roundForUnit(ing.quantity, ing.unit)} {ing.unit}
                      </span>
                      <span className="ingredient-name">
                        {displayName}
                      </span>
                      {ing.notes && (
                        <span className="ingredient-notes">({ing.notes})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-ingredients">
                Aucun ingrédient défini pour cette recette.
              </p>
            )}
          </div>

          <InstructionsCarousel steps={recipeSteps} chefTips={recipe.chef_tips} onStartCookMode={() => setShowCookMode(true)} />
        </div>

        <div className="recipe-actions">
          <button className="v21-btn terra" onClick={() => setShowCookMode(true)}>
            Commencer la cuisine
          </button>
          <button className="v21-btn" onClick={() => setShowCookWizard(true)}>
            Préparer &amp; déduire le stock
          </button>
          <button className="v21-btn ghost" onClick={startEditing}>
            Modifier
          </button>
        </div>

        <CookMode
          open={showCookMode}
          onClose={() => setShowCookMode(false)}
          recipe={recipe}
          steps={recipeSteps}
          ingredients={ings}
        />

        <CookWizard
          open={showCookWizard}
          onClose={() => setShowCookWizard(false)}
          recipe={recipe}
          onComplete={() => setShowCookWizard(false)}
        />
      </div>
    </div>
  );
}
