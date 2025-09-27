'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import './recipes.css';

const CATEGORIES = ['Tous', 'Végé', 'Viande/Poisson', 'Dessert', 'Accompagnement', 'Entrée', 'Boisson', 'Autre'];

// Composant RecipeCard (simplifié, sans expansion)
function RecipeCard({ recipe, onDelete, onOpenModal }) {
  const displayTitle = recipe.title || recipe.name || 'Recette sans nom';
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Facile': return 'difficulty-easy';
      case 'Moyen': return 'difficulty-medium';
      case 'Difficile': return 'difficulty-hard';
      default: return '';
    }
  };

  const getTimeIcon = () => {
    if (totalTime <= 15) return '⚡';
    if (totalTime <= 30) return '⏱️';
    if (totalTime <= 60) return '⏰';
    return '⏳';
  };

  return (
    <div 
      className="recipe-card"
      onClick={() => onOpenModal(recipe)}
      style={{cursor: 'pointer'}}
    >
      {/* Badge recette rapide */}
      {totalTime <= 30 && (
        <span className="quick-recipe">Rapide</span>
      )}

      {/* En-tête */}
      <div className="card-header">
        <h3>{displayTitle}</h3>
        <div className="card-badges">
          {recipe.is_veg && <span className="badge-vege">🌱 Végé</span>}
          {recipe.category && <span className="category-badge">{recipe.category}</span>}
        </div>
      </div>

      {/* Infos rapides */}
      <div className="card-info">
        <div className="info-row">
          <span className="info-icon">👥</span>
          <span className="info-value">{recipe.servings || 2} pers</span>
        </div>
        
        <div className="info-row">
          <span className="info-icon">{getTimeIcon()}</span>
          <span className="info-value">
            {recipe.prep_min || 0}′ prep + {recipe.cook_min || 0}′ cuisson
          </span>
        </div>

        {recipe.difficulty && (
          <div className="info-row">
            <span className={`difficulty-badge ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty}
            </span>
          </div>
        )}
      </div>

      {/* Description courte */}
      {recipe.description && (
        <p className="recipe-description">{recipe.description}</p>
      )}

      {/* Indicateur de clic */}
      <div className="card-click-indicator">
        Cliquez pour voir la recette
      </div>
    </div>
  );
}

// Composant Modal pour afficher les détails
function RecipeModal({ recipe, onClose }) {
  const [ingredients, setIngredients] = useState([]);
  const [utensils, setUtensils] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    if (recipe) {
      loadRecipeDetails();
    }
  }, [recipe]);

  async function loadRecipeDetails() {
    if (!recipe) return;
    
    setLoadingDetails(true);
    try {
      // Charger les ingrédients
      const { data: ingredientsData } = await supabase
        .from('recipe_ingredients')
        .select('*, product:products_catalog(name)')
        .eq('recipe_id', recipe.id)
        .order('position');
      
      setIngredients(ingredientsData || []);

      // Charger les ustensiles
      const { data: utensilsData } = await supabase
        .from('recipe_utensils')
        .select('*, utensil:utensils(name)')
        .eq('recipe_id', recipe.id);
      
      setUtensils(utensilsData || []);

      // Parser les étapes depuis le champ steps (JSON ou texte)
      if (recipe.steps) {
        try {
          const parsedSteps = typeof recipe.steps === 'string' 
            ? JSON.parse(recipe.steps) 
            : recipe.steps;
          setSteps(Array.isArray(parsedSteps) ? parsedSteps : []);
        } catch (e) {
          // Si ce n'est pas du JSON, traiter comme du texte
          const textSteps = recipe.steps.split('\n').filter(step => step.trim());
          setSteps(textSteps.map((step, index) => ({ id: index, text: step.trim() })));
        }
      } else {
        setSteps([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    } finally {
      setLoadingDetails(false);
    }
  }

  if (!recipe) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.title || recipe.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loadingDetails ? (
            <div className="loading">Chargement des détails...</div>
          ) : (
            <>
              {/* Informations générales */}
              <div className="recipe-meta">
                <span>👥 {recipe.servings || 2} personnes</span>
                <span>⏱️ {recipe.prep_min || 0}′ prep</span>
                <span>🔥 {recipe.cook_min || 0}′ cuisson</span>
                {recipe.difficulty && <span>📊 {recipe.difficulty}</span>}
              </div>

              {recipe.description && (
                <div className="recipe-description-full">
                  <p>{recipe.description}</p>
                </div>
              )}

              {/* Ingrédients */}
              {ingredients.length > 0 && (
                <div className="recipe-section">
                  <h3>🛒 Ingrédients</h3>
                  <ul className="ingredients-list">
                    {ingredients.map((ing, index) => (
                      <li key={index} className={ing.optional ? 'optional' : ''}>
                        <span className="quantity">{ing.qty} {ing.unit}</span>
                        <span className="ingredient-name">
                          {ing.product?.name || ing.note || 'Ingrédient'}
                        </span>
                        {ing.optional && <span className="optional-badge">Optionnel</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ustensiles */}
              {utensils.length > 0 && (
                <div className="recipe-section">
                  <h3>🔧 Ustensiles</h3>
                  <ul className="utensils-list">
                    {utensils.map((ut, index) => (
                      <li key={index}>{ut.utensil?.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Étapes */}
              {steps.length > 0 && (
                <div className="recipe-section">
                  <h3>👨‍🍳 Préparation</h3>
                  <ol className="steps-list">
                    {steps.map((step, index) => (
                      <li key={index}>
                        {typeof step === 'string' ? step : step.text || step.description}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Fermer</button>
          <button 
            className="btn primary"
            onClick={() => window.location.href = `/recipes/edit/${recipe.id}`}
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);
  
  // Charger les recettes
  useEffect(() => {
    loadRecipes();
  }, []);

  // Filtrer les recettes
  useEffect(() => {
    let filtered = [...recipes];

    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        (recipe.title || recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'Tous') {
      if (categoryFilter === 'Végé') {
        filtered = filtered.filter(r => r.is_veg);
      } else {
        filtered = filtered.filter(r => r.category === categoryFilter);
      }
    }

    setFilteredRecipes(filtered);
  }, [recipes, searchTerm, categoryFilter]);

  async function loadRecipes() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette recette ?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadRecipes();
      alert('Recette supprimée');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="loading-state">
          <h2>Chargement des recettes...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      {/* En-tête */}
      <div className="recipes-header">
        <h1>👨‍🍳 Mes Recettes</h1>
        <p>Organisez et partagez vos créations culinaires</p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="recipes-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'Tous' ? '📁 Toutes catégories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grille de recettes */}
      <div className="recipes-grid">
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <h2>Aucune recette trouvée</h2>
            <p>Ajustez vos filtres ou ajoutez de nouvelles recettes</p>
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe}
              onDelete={() => handleDelete(recipe.id)}
              onOpenModal={setSelectedRecipe}
            />
          ))
        )}
      </div>

      {/* Modal de détails de recette */}
      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Bouton flottant pour ajouter */}
      <button 
        className="recipes-fab"
        onClick={() => window.location.href = '/recipes/edit/new'}
        title="Ajouter une recette"
      >
        +
      </button>
    </div>
  );
}
