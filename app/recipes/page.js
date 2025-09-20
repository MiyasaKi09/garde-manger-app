// ========================================
// FICHIER: app/recipes/page.js
// Page Recettes avec style glassmorphisme nature
// ========================================

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
  const [showIngredients, setShowIngredients] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
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
      // Données de démo en cas d'erreur
      setRecipes(getDemoRecipes());
    } finally {
      setLoading(false);
    }
  }

  function getDemoRecipes() {
    return [
      {
        id: 1,
        title: 'Ratatouille Provençale',
        category: 'Végé',
        is_veg: true,
        servings: 4,
        prep_min: 20,
        cook_min: 45,
        difficulty: 'Facile',
        description: 'Un classique de la cuisine méditerranéenne'
      },
      {
        id: 2,
        title: 'Poulet Rôti aux Herbes',
        category: 'Viande/Poisson',
        is_veg: false,
        servings: 6,
        prep_min: 15,
        cook_min: 90,
        difficulty: 'Moyen'
      },
      {
        id: 3,
        title: 'Tarte aux Pommes',
        category: 'Dessert',
        is_veg: true,
        servings: 8,
        prep_min: 30,
        cook_min: 40,
        difficulty: 'Moyen'
      }
    ];
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
      // Suppression locale en cas d'erreur
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
        // Filtrer les recettes rapides (< 30 min)
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
              onShowIngredients={() => setShowIngredients(recipe.id)}
            />
          ))
        )}
      </div>

      {/* Bouton flottant pour ajouter */}
      <button 
        className="recipes-fab"
        onClick={() => setShowAddModal(true)}
        title="Ajouter une recette"
      >
        +
      </button>
    </div>
  );
}

// Composant RecipeCard
function RecipeCard({ recipe, onDelete, onShowIngredients }) {
  const [expanded, setExpanded] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const displayTitle = recipe.title || recipe.name || 'Recette sans nom';
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0);

  // Charger les ingrédients au clic
  const handleCardClick = async () => {
    if (!expanded && ingredients.length === 0) {
      setLoadingIngredients(true);
      try {
        const { data, error } = await supabase
          .from('recipe_ingredients')
          .select('*, product:products_catalog(name)')
          .eq('recipe_id', recipe.id)
          .order('position');
        
        if (!error) {
          setIngredients(data || []);
        }
      } catch (error) {
        console.error('Erreur chargement ingrédients:', error);
      } finally {
        setLoadingIngredients(false);
      }
    }
    setExpanded(!expanded);
  };

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
      className={`recipe-card ${expanded ? 'expanded' : ''}`}
      onClick={handleCardClick}
      style={{cursor: 'pointer'}}
    >
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

      {/* Description (si présente) */}
      {recipe.description && !expanded && (
        <p className="recipe-description">{recipe.description}</p>
      )}

      {/* Section expandée */}
      {expanded && (
        <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
          {recipe.description && (
            <p className="recipe-description-full">{recipe.description}</p>
          )}
          
          {/* Ingrédients */}
          {loadingIngredients ? (
            <p className="loading-text">Chargement des ingrédients...</p>
          ) : ingredients.length > 0 ? (
            <div className="ingredients-section">
              <h4>Ingrédients</h4>
              <ul className="ingredients-list">
                {ingredients.map(ing => (
                  <li key={ing.id}>
                    <span className="ingredient-qty">{ing.qty} {ing.unit}</span>
                    <span className="ingredient-name">
                      {ing.product?.name || ing.note || 'Ingrédient'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Actions */}
          <div className="card-actions">
            <button 
              className="action-btn cook"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/cook/${recipe.id}`;
              }}
            >
              🍳 Cuisiner
            </button>
            <button 
              className="action-btn edit"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/recettes/editer/${recipe.id}`;
              }}
            >
              ✏️ Éditer
            </button>
            <button 
              className="action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Indicateur d'expansion */}
      <div className="expand-indicator">
        {expanded ? '▲ Réduire' : '▼ Voir plus'}
      </div>
    </div>
  );
}
