'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import IngredientProductLinker from '@/components/IngredientProductLinker';
import '../../recipes.css';

export default function RecipeEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';

  const [recipe, setRecipe] = useState({
    title: '',
    category: '',
    servings: 4,
    prep_min: 15,
    cook_min: 30,
    description: ''
  });

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadRecipe();
    }
  }, [id]);

  async function loadRecipe() {
    setLoading(true);
    try {
      const { data: recipeData } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeData) {
        setRecipe(recipeData);

        const { data: ingredientsData } = await supabase
          .from('recipe_ingredients')
          .select('*')
          .eq('recipe_id', id)
          .order('position');
        
        setIngredients(ingredientsData || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function addIngredient() {
    const newIngredient = {
      id: `new_${Date.now()}`,
      qty: 1,
      unit: 'g',
      note: '',
      position: ingredients.length,
      is_optional: false
    };
    setIngredients([...ingredients, newIngredient]);
  }

  async function saveRecipe() {
    if (!recipe.title) {
      alert('Le titre est obligatoire');
      return;
    }

    try {
      let recipeId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from('recipes')
          .insert([recipe])
          .select()
          .single();
        
        if (error) throw error;
        recipeId = data.id;
      } else {
        const { error } = await supabase
          .from('recipes')
          .update(recipe)
          .eq('id', id);
        
        if (error) throw error;
      }

      // Sauvegarder les ingrédients
      for (const ing of ingredients) {
        if (ing.id?.startsWith('new_')) {
          const { id: _, ...ingData } = ing;
          await supabase
            .from('recipe_ingredients')
            .insert({ ...ingData, recipe_id: recipeId });
        } else {
          const { id: ingId, ...ingData } = ing;
          await supabase
            .from('recipe_ingredients')
            .update(ingData)
            .eq('id', ingId);
        }
      }

      alert('Recette sauvegardée !');
      router.push('/recipes');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="recipes-container">
      <h1>{isNew ? 'Nouvelle recette' : 'Modifier la recette'}</h1>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <h2>Informations de base</h2>
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Titre de la recette"
            value={recipe.title}
            onChange={(e) => setRecipe({...recipe, title: e.target.value})}
            style={{ padding: '0.5rem', fontSize: '1.2rem', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          
          <textarea
            placeholder="Description"
            value={recipe.description}
            onChange={(e) => setRecipe({...recipe, description: e.target.value})}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', minHeight: '100px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <input
              type="number"
              placeholder="Portions"
              value={recipe.servings}
              onChange={(e) => setRecipe({...recipe, servings: e.target.value})}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <input
              type="number"
              placeholder="Préparation (min)"
              value={recipe.prep_min}
              onChange={(e) => setRecipe({...recipe, prep_min: e.target.value})}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <input
              type="number"
              placeholder="Cuisson (min)"
              value={recipe.cook_min}
              onChange={(e) => setRecipe({...recipe, cook_min: e.target.value})}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <select
              value={recipe.category}
              onChange={(e) => setRecipe({...recipe, category: e.target.value})}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
            >
              <option value="">Catégorie</option>
              <option value="Entrée">Entrée</option>
              <option value="Plat">Plat</option>
              <option value="Dessert">Dessert</option>
              <option value="Boisson">Boisson</option>
            </select>
          </div>
        </div>

        <h2>Ingrédients</h2>
        <div style={{ marginBottom: '2rem' }}>
          {ingredients.map((ing, index) => (
            <div key={ing.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 80px 1fr 50px', 
              gap: '0.5rem', 
              marginBottom: '0.5rem' 
            }}>
              <input
                type="number"
                value={ing.qty}
                onChange={(e) => {
                  const updated = [...ingredients];
                  updated[index].qty = e.target.value;
                  setIngredients(updated);
                }}
                placeholder="Qté"
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => {
                  const updated = [...ingredients];
                  updated[index].unit = e.target.value;
                  setIngredients(updated);
                }}
                placeholder="Unité"
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <IngredientProductLinker 
                ingredient={ing}
                onUpdate={() => loadRecipe()}
              />
              <button
                onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                style={{ 
                  background: '#ff5252', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          ))}
          
          <button
            onClick={addIngredient}
            style={{
              padding: '0.5rem 1rem',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            + Ajouter un ingrédient
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={saveRecipe}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            💾 Sauvegarder
          </button>
          <button
            onClick={() => router.push('/recipes')}
            style={{
              padding: '0.75rem 2rem',
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
