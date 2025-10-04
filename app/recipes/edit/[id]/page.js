'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import '../../recipes.css';

export default function RecipeEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const recipeId = isNew ? null : params.id;
  
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // État de la recette
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'moyen',
    servings: 4,
    prep_min: 15,
    cook_min: 30,
    total_min: 45,
    is_veg: false,
    is_divisible: true,
    tags: [],
    image_url: '',
    source_canonical_url: '',
    author: '',
    nutrition: {
      macros: {
        calories: '',
        proteins: '',
        carbs: '',
        fats: ''
      },
      micros: {}
    }
  });
  
  // Ingrédients
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState({
    qty: '',
    unit: 'g',
    name: '',
    note: '',
    is_optional: false
  });
  
  // Étapes
  const [steps, setSteps] = useState([]);
  const [useTextSteps, setUseTextSteps] = useState(false);
  const [textSteps, setTextSteps] = useState('');
  
  // Ustensiles
  const [utensils, setUtensils] = useState([]);
  const [newUtensil, setNewUtensil] = useState({
    utensil_name: '',
    quantity: 1,
    is_optional: false,
    notes: ''
  });

  // Suggestions pour les produits
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // État pour les micronutriments
  const [selectedMicronutrient, setSelectedMicronutrient] = useState('');
  const [microValue, setMicroValue] = useState('');
  const [microUnit, setMicroUnit] = useState('mg');
  const [showMicroSuggestions, setShowMicroSuggestions] = useState(false);

  // Liste prédéfinie de micronutriments courants
  const micronutrientSuggestions = [
    // Vitamines liposolubles
    { name: 'Vitamine A', defaultUnit: 'µg', category: 'Vitamines' },
    { name: 'Vitamine D', defaultUnit: 'µg', category: 'Vitamines' },
    { name: 'Vitamine E', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine K', defaultUnit: 'µg', category: 'Vitamines' },
    // Vitamines hydrosolubles
    { name: 'Vitamine C', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B1 (Thiamine)', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B2 (Riboflavine)', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B3 (Niacine)', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B5 (Acide pantothénique)', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B6', defaultUnit: 'mg', category: 'Vitamines' },
    { name: 'Vitamine B9 (Folate)', defaultUnit: 'µg', category: 'Vitamines' },
    { name: 'Vitamine B12', defaultUnit: 'µg', category: 'Vitamines' },
    { name: 'Biotine (B8)', defaultUnit: 'µg', category: 'Vitamines' },
    // Minéraux majeurs
    { name: 'Calcium', defaultUnit: 'mg', category: 'Minéraux' },
    { name: 'Phosphore', defaultUnit: 'mg', category: 'Minéraux' },
    { name: 'Magnésium', defaultUnit: 'mg', category: 'Minéraux' },
    { name: 'Sodium', defaultUnit: 'mg', category: 'Minéraux' },
    { name: 'Potassium', defaultUnit: 'mg', category: 'Minéraux' },
    { name: 'Chlorure', defaultUnit: 'mg', category: 'Minéraux' },
    // Oligo-éléments
    { name: 'Fer', defaultUnit: 'mg', category: 'Oligo-éléments' },
    { name: 'Zinc', defaultUnit: 'mg', category: 'Oligo-éléments' },
    { name: 'Cuivre', defaultUnit: 'mg', category: 'Oligo-éléments' },
    { name: 'Manganèse', defaultUnit: 'mg', category: 'Oligo-éléments' },
    { name: 'Sélénium', defaultUnit: 'µg', category: 'Oligo-éléments' },
    { name: 'Iode', defaultUnit: 'µg', category: 'Oligo-éléments' },
    { name: 'Chrome', defaultUnit: 'µg', category: 'Oligo-éléments' },
    { name: 'Molybdène', defaultUnit: 'µg', category: 'Oligo-éléments' },
    // Autres composés nutritionnels
    { name: 'Fibres alimentaires', defaultUnit: 'g', category: 'Autres' },
    { name: 'Fibres solubles', defaultUnit: 'g', category: 'Autres' },
    { name: 'Fibres insolubles', defaultUnit: 'g', category: 'Autres' },
    { name: 'Sucres totaux', defaultUnit: 'g', category: 'Autres' },
    { name: 'Sucres ajoutés', defaultUnit: 'g', category: 'Autres' },
    { name: 'Amidon', defaultUnit: 'g', category: 'Autres' },
    { name: 'Cholestérol', defaultUnit: 'mg', category: 'Autres' },
    // Acides gras
    { name: 'Acides gras saturés', defaultUnit: 'g', category: 'Acides gras' },
    { name: 'Acides gras monoinsaturés', defaultUnit: 'g', category: 'Acides gras' },
    { name: 'Acides gras polyinsaturés', defaultUnit: 'g', category: 'Acides gras' },
    { name: 'Acides gras trans', defaultUnit: 'g', category: 'Acides gras' },
    { name: 'Oméga 3 (EPA+DHA)', defaultUnit: 'mg', category: 'Acides gras' },
    { name: 'Oméga 6', defaultUnit: 'mg', category: 'Acides gras' },
    { name: 'Oméga 9', defaultUnit: 'mg', category: 'Acides gras' },
    // Composés bioactifs
    { name: 'Polyphénols', defaultUnit: 'mg', category: 'Antioxydants' },
    { name: 'Flavonoïdes', defaultUnit: 'mg', category: 'Antioxydants' },
    { name: 'Caroténoïdes', defaultUnit: 'µg', category: 'Antioxydants' },
    { name: 'Lycopène', defaultUnit: 'mg', category: 'Antioxydants' },
    { name: 'Bêta-carotène', defaultUnit: 'µg', category: 'Antioxydants' },
    { name: 'Lutéine', defaultUnit: 'µg', category: 'Antioxydants' },
    { name: 'Resvératrol', defaultUnit: 'mg', category: 'Antioxydants' },
    { name: 'Coenzyme Q10', defaultUnit: 'mg', category: 'Antioxydants' }
  ];

  useEffect(() => {
    if (!isNew && recipeId) {
      loadRecipe();
    }
  }, [recipeId]);

  // Calcul automatique du temps total
  useEffect(() => {
    const total = (parseInt(recipe.prep_min) || 0) + (parseInt(recipe.cook_min) || 0);
    setRecipe(prev => ({ ...prev, total_min: total }));
  }, [recipe.prep_min, recipe.cook_min]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (showMicroSuggestions && !event.target.closest('.micro-suggestions-dropdown') && 
          !event.target.closest('.form-group')) {
        setShowMicroSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMicroSuggestions]);

  async function loadRecipe() {
    try {
      // Charger la recette
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;

      // Charger les ingrédients
      const { data: ingredientsData } = await supabase
        .from('recipe_ingredients_detailed')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('position');

      // Charger les étapes
      const { data: stepsData } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('step_no');

      // Charger les ustensiles
      const { data: utensilsData } = await supabase
        .from('recipe_utensils')
        .select('*')
        .eq('recipe_id', recipeId);

      // Assurer la bonne structure pour nutrition
      let nutritionData = recipeData.nutrition || { macros: {}, micros: {} };
      
      // Si l'ancien format est détecté, le convertir
      if (nutritionData && !nutritionData.macros && !nutritionData.micros) {
        const oldNutrition = { ...nutritionData };
        nutritionData = {
          macros: {
            calories: oldNutrition.calories || '',
            proteins: oldNutrition.proteins || '',
            carbs: oldNutrition.carbs || '',
            fats: oldNutrition.fats || ''
          },
          micros: {}
        };
        
        // Transférer les autres nutriments vers micros
        Object.keys(oldNutrition).forEach(key => {
          if (!['calories', 'proteins', 'carbs', 'fats'].includes(key)) {
            nutritionData.micros[key] = {
              value: oldNutrition[key],
              unit: key === 'fibers' ? 'g' : 'mg'
            };
          }
        });
      }

      setRecipe({
        ...recipeData,
        tags: recipeData.tags || [],
        nutrition: nutritionData
      });

      if (recipeData.steps && (!stepsData || stepsData.length === 0)) {
        setUseTextSteps(true);
        setTextSteps(recipeData.steps);
      } else {
        setSteps(stepsData || []);
      }

      setIngredients(ingredientsData || []);
      setUtensils(utensilsData || []);
      
    } catch (error) {
      console.error('Erreur chargement recette:', error);
      alert('Erreur lors du chargement de la recette');
    } finally {
      setLoading(false);
    }
  }

  async function searchProducts(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      setProductSuggestions([]);
      return;
    }

    setSearchingProducts(true);
    try {
      // Recherche dans canonical_foods
      const { data: canonicalData } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, category_id')
        .ilike('canonical_name', `%${searchTerm}%`)
        .limit(5);

      // Recherche dans generic_products
      const { data: genericData } = await supabase
        .from('generic_products')
        .select('id, name, category_id')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      const suggestions = [
        ...(canonicalData || []).map(item => ({
          id: item.id,
          name: item.canonical_name,
          type: 'canonical',
          category_id: item.category_id
        })),
        ...(genericData || []).map(item => ({
          id: item.id,
          name: item.name,
          type: 'generic',
          category_id: item.category_id
        }))
      ];

      setProductSuggestions(suggestions);
    } catch (error) {
      console.error('Erreur recherche produits:', error);
    } finally {
      setSearchingProducts(false);
    }
  }

  function addIngredient() {
    if (!newIngredient.name || !newIngredient.qty) {
      alert('Veuillez remplir au moins le nom et la quantité');
      return;
    }

    setIngredients([...ingredients, {
      ...newIngredient,
      id: `new-${Date.now()}`,
      position: ingredients.length
    }]);

    setNewIngredient({
      qty: '',
      unit: 'g',
      name: '',
      note: '',
      is_optional: false
    });
  }

  function removeIngredient(index) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStep() {
    const newStep = {
      id: `new-${Date.now()}`,
      step_no: steps.length + 1,
      instruction: '',
      duration_min: null,
      temperature: null,
      temperature_unit: '°C'
    };
    setSteps([...steps, newStep]);
  }

  function updateStep(index, field, value) {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  }

  function removeStep(index) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function addUtensil() {
    if (!newUtensil.utensil_name) {
      alert('Veuillez entrer le nom de l\'ustensile');
      return;
    }

    setUtensils([...utensils, {
      ...newUtensil,
      id: `new-${Date.now()}`
    }]);

    setNewUtensil({
      utensil_name: '',
      quantity: 1,
      is_optional: false,
      notes: ''
    });
  }

  function removeUtensil(index) {
    setUtensils(utensils.filter((_, i) => i !== index));
  }

  function addMicronutrient() {
    if (!selectedMicronutrient || !microValue) {
      alert('Veuillez sélectionner un nutriment et entrer une valeur');
      return;
    }

    const newNutrition = { ...recipe.nutrition };
    if (!newNutrition.micros) {
      newNutrition.micros = {};
    }
    
    newNutrition.micros[selectedMicronutrient] = {
      value: parseFloat(microValue),
      unit: microUnit
    };

    setRecipe({ ...recipe, nutrition: newNutrition });
    setSelectedMicronutrient('');
    setMicroValue('');
    setMicroUnit('mg');
    setShowMicroSuggestions(false);
  }

  function removeMicronutrient(name) {
    const newNutrition = { ...recipe.nutrition };
    if (newNutrition.micros) {
      delete newNutrition.micros[name];
    }
    setRecipe({ ...recipe, nutrition: newNutrition });
  }

  function selectMicronutrientSuggestion(suggestion) {
    setSelectedMicronutrient(suggestion.name);
    setMicroUnit(suggestion.defaultUnit);
    setShowMicroSuggestions(false);
  }

  async function saveRecipe() {
    if (!recipe.title) {
      alert('Le titre est obligatoire');
      return;
    }

    setSaving(true);
    try {
      let savedRecipeId = recipeId;

      // Nettoyer les données nutrition (enlever les valeurs vides)
      let cleanedNutrition = null;
      if (recipe.nutrition) {
        const macros = {};
        const micros = {};
        
        // Nettoyer les macros
        if (recipe.nutrition.macros) {
          Object.entries(recipe.nutrition.macros).forEach(([key, value]) => {
            if (value && value !== '') {
              macros[key] = value;
            }
          });
        }
        
        // Nettoyer les micros
        if (recipe.nutrition.micros) {
          Object.entries(recipe.nutrition.micros).forEach(([key, data]) => {
            if (data && data.value && data.value !== '') {
              micros[key] = data;
            }
          });
        }
        
        if (Object.keys(macros).length > 0 || Object.keys(micros).length > 0) {
          cleanedNutrition = { macros, micros };
        }
      }

      // Sauvegarder la recette principale
      const recipeData = {
        ...recipe,
        steps: useTextSteps ? textSteps : null,
        tags: recipe.tags.length > 0 ? recipe.tags : null,
        nutrition: cleanedNutrition
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('recipes')
          .insert([recipeData])
          .select()
          .single();

        if (error) throw error;
        savedRecipeId = data.id;
      } else {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipeId);

        if (error) throw error;
      }

      // Supprimer les anciennes données liées
      if (!isNew) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', savedRecipeId);
        await supabase.from('recipe_steps').delete().eq('recipe_id', savedRecipeId);
        await supabase.from('recipe_utensils').delete().eq('recipe_id', savedRecipeId);
      }

      // Sauvegarder les ingrédients
      if (ingredients.length > 0) {
        const ingredientsToSave = ingredients.map((ing, idx) => ({
          recipe_id: savedRecipeId,
          qty: parseFloat(ing.qty),
          unit: ing.unit,
          note: ing.note || null,
          is_optional: ing.is_optional || false,
          position: idx,
          // Vous devrez ajouter la logique pour lier aux bons produits
          product_id: ing.product_id || null
        }));

        const { error } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsToSave);

        if (error) throw error;
      }

      // Sauvegarder les étapes (si pas en mode texte)
      if (!useTextSteps && steps.length > 0) {
        const stepsToSave = steps.map((step, idx) => ({
          recipe_id: savedRecipeId,
          step_no: idx + 1,
          instruction: step.instruction,
          duration_min: step.duration_min ? parseInt(step.duration_min) : null,
          temperature: step.temperature ? parseInt(step.temperature) : null,
          temperature_unit: step.temperature_unit || '°C'
        }));

        const { error } = await supabase
          .from('recipe_steps')
          .insert(stepsToSave);

        if (error) throw error;
      }

      // Sauvegarder les ustensiles
      if (utensils.length > 0) {
        const utensilsToSave = utensils.map(utensil => ({
          recipe_id: savedRecipeId,
          utensil_name: utensil.utensil_name,
          quantity: parseInt(utensil.quantity) || 1,
          is_optional: utensil.is_optional || false,
          notes: utensil.notes || null
        }));

        const { error } = await supabase
          .from('recipe_utensils')
          .insert(utensilsToSave);

        if (error) throw error;
      }

      alert('Recette sauvegardée avec succès!');
      router.push('/recipes');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      <div className="recipes-header">
        <h1>{isNew ? '➕ Nouvelle recette' : '✏️ Modifier la recette'}</h1>
        <Link href="/recipes" className="btn-secondary">
          ← Retour aux recettes
        </Link>
      </div>

      {/* Tabs de navigation */}
      <div className="edit-tabs">
        <button 
          className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          📝 Informations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          🥕 Ingrédients
        </button>
        <button 
          className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          📋 Instructions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🔧 Ustensiles
        </button>
        <button 
          className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          📊 Nutrition
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="edit-content">
        {activeTab === 'basic' && (
          <div className="edit-section">
            <h2>Informations de base</h2>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Titre de la recette *</label>
                <input
                  type="text"
                  value={recipe.title}
                  onChange={(e) => setRecipe({...recipe, title: e.target.value})}
                  placeholder="Ex: Tarte aux pommes maison"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={recipe.description}
                  onChange={(e) => setRecipe({...recipe, description: e.target.value})}
                  placeholder="Une délicieuse tarte aux pommes avec une pâte croustillante..."
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={recipe.category}
                  onChange={(e) => setRecipe({...recipe, category: e.target.value})}
                  className="form-select"
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="entrée">Entrée</option>
                  <option value="plat">Plat principal</option>
                  <option value="dessert">Dessert</option>
                  <option value="collation">Collation</option>
                  <option value="boisson">Boisson</option>
                  <option value="sauce">Sauce</option>
                  <option value="accompagnement">Accompagnement</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulté</label>
                <select
                  value={recipe.difficulty}
                  onChange={(e) => setRecipe({...recipe, difficulty: e.target.value})}
                  className="form-select"
                >
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre de portions</label>
                <input
                  type="number"
                  value={recipe.servings}
                  onChange={(e) => setRecipe({...recipe, servings: parseInt(e.target.value) || 0})}
                  min="1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Temps de préparation (min)</label>
                <input
                  type="number"
                  value={recipe.prep_min}
                  onChange={(e) => setRecipe({...recipe, prep_min: parseInt(e.target.value) || 0})}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Temps de cuisson (min)</label>
                <input
                  type="number"
                  value={recipe.cook_min}
                  onChange={(e) => setRecipe({...recipe, cook_min: parseInt(e.target.value) || 0})}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Temps total (min)</label>
                <input
                  type="number"
                  value={recipe.total_min}
                  readOnly
                  className="form-input readonly"
                />
              </div>

              <div className="form-group full-width">
                <label>URL de l\'image</label>
                <input
                  type="url"
                  value={recipe.image_url}
                  onChange={(e) => setRecipe({...recipe, image_url: e.target.value})}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Source/URL originale</label>
                <input
                  type="url"
                  value={recipe.source_canonical_url}
                  onChange={(e) => setRecipe({...recipe, source_canonical_url: e.target.value})}
                  placeholder="https://..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Auteur</label>
                <input
                  type="text"
                  value={recipe.author}
                  onChange={(e) => setRecipe({...recipe, author: e.target.value})}
                  placeholder="Nom de l\'auteur"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={recipe.tags.join(', ')}
                  onChange={(e) => setRecipe({
                    ...recipe, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="Ex: rapide, sans gluten, été"
                  className="form-input"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={recipe.is_veg}
                    onChange={(e) => setRecipe({...recipe, is_veg: e.target.checked})}
                  />
                  <span>🌱 Végétarien</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={recipe.is_divisible}
                    onChange={(e) => setRecipe({...recipe, is_divisible: e.target.checked})}
                  />
                  <span>Recette divisible</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="edit-section">
            <h2>Ingrédients</h2>
            
            {/* Liste des ingrédients existants */}
            {ingredients.length > 0 && (
              <div className="ingredients-list-edit">
                {ingredients.map((ing, idx) => (
                  <div key={ing.id || idx} className="ingredient-item-edit">
                    <span className="ingredient-position">{idx + 1}</span>
                    <span className="ingredient-qty">{ing.qty} {ing.unit}</span>
                    <span className="ingredient-name">
                      {ing.display_name || ing.name}
                      {ing.is_optional && ' (optionnel)'}
                    </span>
                    {ing.note && <span className="ingredient-note">{ing.note}</span>}
                    <button 
                      onClick={() => removeIngredient(idx)}
                      className="btn-remove"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d\'ajout d\'ingrédient */}
            <div className="add-ingredient-form">
              <h3>Ajouter un ingrédient</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Quantité *</label>
                  <input
                    type="number"
                    value={newIngredient.qty}
                    onChange={(e) => setNewIngredient({...newIngredient, qty: e.target.value})}
                    placeholder="100"
                    className="form-input"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Unité</label>
                  <select
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                    className="form-select"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="u">unité(s)</option>
                    <option value="cs">c.à.s</option>
                    <option value="cc">c.à.c</option>
                    <option value="pincée">pincée</option>
                  </select>
                </div>

                <div className="form-group span-2">
                  <label>Nom de l\'ingrédient *</label>
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={(e) => {
                      setNewIngredient({...newIngredient, name: e.target.value});
                      searchProducts(e.target.value);
                    }}
                    placeholder="Ex: Tomates cerises"
                    className="form-input"
                  />
                  {searchingProducts && <span className="searching">Recherche...</span>}
                  {productSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {productSuggestions.map(sugg => (
                        <div 
                          key={`${sugg.type}-${sugg.id}`}
                          className="suggestion-item"
                          onClick={() => {
                            setNewIngredient({...newIngredient, name: sugg.name});
                            setProductSuggestions([]);
                          }}
                        >
                          {sugg.name}
                          <span className="suggestion-type">{sugg.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group span-2">
                  <label>Note (optionnel)</label>
                  <input
                    type="text"
                    value={newIngredient.note}
                    onChange={(e) => setNewIngredient({...newIngredient, note: e.target.value})}
                    placeholder="Ex: coupées en deux"
                    className="form-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newIngredient.is_optional}
                      onChange={(e) => setNewIngredient({...newIngredient, is_optional: e.target.checked})}
                    />
                    <span>Optionnel</span>
                  </label>
                </div>

                <div className="form-group">
                  <button 
                    onClick={addIngredient}
                    className="btn-primary"
                    type="button"
                  >
                    ➕ Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="edit-section">
            <h2>Instructions</h2>
            
            <div className="steps-mode-selector">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={useTextSteps}
                  onChange={() => setUseTextSteps(true)}
                />
                <span>Mode texte libre</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={!useTextSteps}
                  onChange={() => setUseTextSteps(false)}
                />
                <span>Mode étapes structurées</span>
              </label>
            </div>

            {useTextSteps ? (
              <div className="form-group">
                <label>Instructions (texte libre)</label>
                <textarea
                  value={textSteps}
                  onChange={(e) => setTextSteps(e.target.value)}
                  placeholder="Décrivez les étapes de préparation..."
                  className="form-textarea"
                  rows="10"
                />
              </div>
            ) : (
              <>
                {steps.map((step, idx) => (
                  <div key={step.id || idx} className="step-item-edit">
                    <div className="step-header">
                      <span className="step-number">Étape {idx + 1}</span>
                      <button 
                        onClick={() => removeStep(idx)}
                        className="btn-remove"
                        title="Supprimer cette étape"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Instruction</label>
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                          placeholder="Décrivez cette étape..."
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Durée (min)</label>
                        <input
                          type="number"
                          value={step.duration_min || ''}
                          onChange={(e) => updateStep(idx, 'duration_min', e.target.value)}
                          placeholder="10"
                          className="form-input"
                          min="0"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Température</label>
                        <input
                          type="number"
                          value={step.temperature || ''}
                          onChange={(e) => updateStep(idx, 'temperature', e.target.value)}
                          placeholder="180"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Unité temp.</label>
                        <select
                          value={step.temperature_unit || '°C'}
                          onChange={(e) => updateStep(idx, 'temperature_unit', e.target.value)}
                          className="form-select"
                        >
                          <option value="°C">°C</option>
                          <option value="°F">°F</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={addStep}
                  className="btn-secondary"
                  type="button"
                >
                  ➕ Ajouter une étape
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="edit-section">
            <h2>Ustensiles</h2>
            
            {/* Liste des ustensiles existants */}
            {utensils.length > 0 && (
              <div className="utensils-list-edit">
                {utensils.map((utensil, idx) => (
                  <div key={utensil.id || idx} className="utensil-item-edit">
                    <span className="utensil-qty">
                      {utensil.quantity > 1 && `${utensil.quantity}× `}
                    </span>
                    <span className="utensil-name">
                      {utensil.utensil_name}
                      {utensil.is_optional && ' (optionnel)'}
                    </span>
                    {utensil.notes && <span className="utensil-note">{utensil.notes}</span>}
                    <button 
                      onClick={() => removeUtensil(idx)}
                      className="btn-remove"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d\'ajout d\'ustensile */}
            <div className="add-utensil-form">
              <h3>Ajouter un ustensile</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom de l\'ustensile *</label>
                  <input
                    type="text"
                    value={newUtensil.utensil_name}
                    onChange={(e) => setNewUtensil({...newUtensil, utensil_name: e.target.value})}
                    placeholder="Ex: Poêle"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Quantité</label>
                  <input
                    type="number"
                    value={newUtensil.quantity}
                    onChange={(e) => setNewUtensil({...newUtensil, quantity: e.target.value})}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    value={newUtensil.notes}
                    onChange={(e) => setNewUtensil({...newUtensil, notes: e.target.value})}
                    placeholder="Ex: 28 cm de diamètre"
                    className="form-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newUtensil.is_optional}
                      onChange={(e) => setNewUtensil({...newUtensil, is_optional: e.target.checked})}
                    />
                    <span>Optionnel</span>
                  </label>
                </div>

                <div className="form-group">
                  <button 
                    onClick={addUtensil}
                    className="btn-primary"
                    type="button"
                  >
                    ➕ Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="edit-section">
            <h2>Informations nutritionnelles</h2>
            <p className="info-text">
              Les informations nutritionnelles peuvent être calculées automatiquement 
              à partir des ingrédients ou saisies manuellement. Toutes les valeurs sont par portion.
            </p>
            
            {/* Macronutriments */}
            <div className="nutrition-section">
              <h3>Macronutriments (par portion)</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Calories (kcal)</label>
                  <input
                    type="number"
                    value={recipe.nutrition?.macros?.calories || ''}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutrition: {
                        ...recipe.nutrition,
                        macros: { ...recipe.nutrition?.macros, calories: e.target.value }
                      }
                    })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Protéines (g)</label>
                  <input
                    type="number"
                    value={recipe.nutrition?.macros?.proteins || ''}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutrition: {
                        ...recipe.nutrition,
                        macros: { ...recipe.nutrition?.macros, proteins: e.target.value }
                      }
                    })}
                    className="form-input"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Glucides (g)</label>
                  <input
                    type="number"
                    value={recipe.nutrition?.macros?.carbs || ''}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutrition: {
                        ...recipe.nutrition,
                        macros: { ...recipe.nutrition?.macros, carbs: e.target.value }
                      }
                    })}
                    className="form-input"
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>Lipides (g)</label>
                  <input
                    type="number"
                    value={recipe.nutrition?.macros?.fats || ''}
                    onChange={(e) => setRecipe({
                      ...recipe,
                      nutrition: {
                        ...recipe.nutrition,
                        macros: { ...recipe.nutrition?.macros, fats: e.target.value }
                      }
                    })}
                    className="form-input"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Micronutriments */}
            <div className="nutrition-section">
              <h3>Micronutriments (par portion)</h3>
              
              {/* Liste des micronutriments ajoutés */}
              {recipe.nutrition?.micros && Object.keys(recipe.nutrition.micros).length > 0 && (
                <div className="micros-list">
                  {Object.entries(recipe.nutrition.micros).map(([name, data]) => (
                    <div key={name} className="micro-item">
                      <span className="micro-name">{name}</span>
                      <span className="micro-value">
                        {data.value} {data.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMicronutrient(name)}
                        className="btn-remove-micro"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout de micronutriment */}
              <div className="add-micro-form">
                <h4>Ajouter un micronutriment</h4>
                <div className="form-grid">
                  <div className="form-group span-2" style={{ position: 'relative' }}>
                    <label>Nom du nutriment</label>
                    <input
                      type="text"
                      value={selectedMicronutrient}
                      onChange={(e) => {
                        setSelectedMicronutrient(e.target.value);
                        setShowMicroSuggestions(true);
                      }}
                      onFocus={() => setShowMicroSuggestions(true)}
                      placeholder="Ex: Vitamine C, Fer, Calcium..."
                      className="form-input"
                    />
                    
                    {showMicroSuggestions && (
                      <div className="micro-suggestions-dropdown">
                        <div className="suggestions-header">
                          <small>Suggestions courantes (cliquez pour sélectionner)</small>
                          <button
                            type="button"
                            onClick={() => setShowMicroSuggestions(false)}
                            className="close-suggestions"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="suggestions-content">
                          {['Vitamines', 'Minéraux', 'Oligo-éléments', 'Acides gras', 'Antioxydants', 'Autres'].map(category => {
                            const categorySuggestions = micronutrientSuggestions
                              .filter(s => s.category === category)
                              .filter(s => 
                                !selectedMicronutrient || 
                                s.name.toLowerCase().includes(selectedMicronutrient.toLowerCase())
                              )
                              .filter(s => 
                                !recipe.nutrition?.micros || 
                                !recipe.nutrition.micros[s.name]
                              );
                            
                            if (categorySuggestions.length === 0) return null;
                            
                            return (
                              <div key={category} className="suggestion-category">
                                <div className="category-header">{category}</div>
                                <div className="suggestions-grid">
                                  {categorySuggestions.map(suggestion => (
                                    <button
                                      key={suggestion.name}
                                      type="button"
                                      className="micro-suggestion-btn"
                                      onClick={() => selectMicronutrientSuggestion(suggestion)}
                                    >
                                      <span className="suggestion-name">{suggestion.name}</span>
                                      <span className="suggestion-unit">{suggestion.defaultUnit}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Valeur</label>
                    <input
                      type="number"
                      value={microValue}
                      onChange={(e) => setMicroValue(e.target.value)}
                      placeholder="0"
                      className="form-input"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Unité</label>
                    <select
                      value={microUnit}
                      onChange={(e) => setMicroUnit(e.target.value)}
                      className="form-select"
                    >
                      <option value="g">g</option>
                      <option value="mg">mg</option>
                      <option value="µg">µg (mcg)</option>
                      <option value="UI">UI</option>
                      <option value="%">% AJR</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button
                      type="button"
                      onClick={addMicronutrient}
                      className="btn-primary"
                    >
                      ➕ Ajouter
                    </button>
                  </div>
                </div>

                <div className="micro-info">
                  <small>
                    💡 Astuce : Vous pouvez ajouter n'importe quel nutriment ou composé nutritionnel 
                    (vitamines, minéraux, acides aminés, antioxydants, etc.)
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre d\'actions fixe */}
      <div className="edit-actions-bar">
        <Link href="/recipes" className="btn-secondary">
          ✕ Annuler
        </Link>
        <button 
          onClick={saveRecipe}
          disabled={saving || !recipe.title}
          className="btn-primary"
        >
          {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder la recette'}
        </button>
      </div>
    </div>
  );
}
