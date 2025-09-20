'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './recipes.css';

const CATEGORIES = ['Tous', 'Végé', 'Viande/Poisson', 'Dessert', 'Accompagnement', 'Entrée', 'Boisson', 'Autre'];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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
    } catch (error) {
      console.error('Erreur:', error);
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  }

  // Statistiques
  const stats = {
    total: filteredRecipes.length,
    vege: filteredRecipes.filter(r => r.is_veg).length,
    rapide: filteredRecipes.filter(r => (r.prep_min + r.cook_min) <= 30).length,
    categories: [...new Set(recipes.map(r => r.category))].filter(Boolean).length
  };

  // Fonction pour gérer les filtres rapides
  const handleQuickFilter = (filterType) => {
    switch(filterType) {
      case 'all':
        setCategoryFilter('Tous');
        setSearchTerm('');
        break;
      case 'vege':
        setCategoryFilter('Végé');
        break;
      case 'rapide':
        setSearchTerm('');
        break;
    }
  };

  if (loading) {
    return (
      <div className="recipes-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des recettes...</p>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      {/* Statistiques cliquables */}
      <div className="stats-container">
        <div 
          className="stat-card"
          onClick={() => handleQuickFilter('all')}
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{recipes.length}</div>
          <div className="stat-label">Recettes Total</div>
        </div>
        <div 
          className="stat-card"
          onClick={() => handleQuickFilter('vege')}
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{stats.vege}</div>
          <div className="stat-label">Végétariennes</div>
        </div>
        <div 
          className="stat-card"
          onClick={() => handleQuickFilter('rapide')}
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{stats.rapide}</div>
          <div className="stat-label">Rapides (-30min)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.categories}</div>
          <div className="stat-label">Catégories</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
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
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('position');
      
      setIngredients(ingredientsData || []);

      // Charger les ustensiles
      const { data: utensilsData } = await supabase
        .from('recipe_utensils')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('id');
      
      setUtensils(utensilsData || []);

      // Charger les étapes
      const { data: stepsData } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('step_no');
      
      setSteps(stepsData || []);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoadingDetails(false);
    }
  }

  if (!recipe) return null;

  const displayTitle = recipe.title || recipe.name || 'Recette';
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header du modal */}
        <div className="modal-header">
          <div>
            <h2>{displayTitle}</h2>
            <div className="modal-badges">
              {recipe.is_veg && <span className="badge-vege">🌱 Végétarien</span>}
              {recipe.category && <span className="category-badge">{recipe.category}</span>}
              {recipe.difficulty && <span className="difficulty-badge">{recipe.difficulty}</span>}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Infos de base */}
        <div className="modal-info-grid">
          <div className="modal-info-item">
            <span className="info-icon">👥</span>
            <span className="info-label">Portions:</span>
            <span className="info-value">{recipe.servings || 2} personnes</span>
          </div>
          <div className="modal-info-item">
            <span className="info-icon">⏱️</span>
            <span className="info-label">Préparation:</span>
            <span className="info-value">{recipe.prep_min || 0} minutes</span>
          </div>
          <div className="modal-info-item">
            <span className="info-icon">🍳</span>
            <span className="info-label">Cuisson:</span>
            <span className="info-value">{recipe.cook_min || 0} minutes</span>
          </div>
          <div className="modal-info-item">
            <span className="info-icon">⏰</span>
            <span className="info-label">Total:</span>
            <span className="info-value">{totalTime} minutes</span>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="modal-section">
            <h3>Description</h3>
            <p className="recipe-full-description">{recipe.description}</p>
          </div>
        )}

        {/* Ustensiles */}
        {!loadingDetails && utensils.length > 0 && (
          <div className="modal-section">
            <h3>🔧 Ustensiles nécessaires</h3>
            <div className="utensils-grid">
              {utensils.map((utensil, index) => (
                <div key={utensil.id || index} className="utensil-item">
                  <span className="utensil-name">{utensil.utensil_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingrédients */}
        <div className="modal-section">
          <h3>📝 Ingrédients</h3>
          {loadingDetails ? (
            <p className="loading-text">Chargement...</p>
          ) : ingredients.length > 0 ? (
            <ul className="ingredients-list-modal">
              {ingredients.map((ing, index) => (
                <li key={ing.id || index}>
                  <span className="ingredient-qty">{ing.qty} {ing.unit}</span>
                  <span className="ingredient-name">{ing.note || 'Ingrédient'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">Aucun ingrédient renseigné</p>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button 
            className="modal-btn primary"
            onClick={() => window.location.href = `/cook/${recipe.id}`}
          >
            🍳 Cuisiner
          </button>
          <button 
            className="modal-btn secondary"
            onClick={() => window.location.href = `/recipes/edit/${recipe.id}`}
          >
            ✏️ Modifier
          </button>
        </div>
      </div>
    </div>
  );
}
