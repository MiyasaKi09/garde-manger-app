'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './recipes.css';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [inventoryStatus, setInventoryStatus] = useState({});
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecipes();
    checkInventoryAvailability();
  }, []);

  async function fetchRecipes() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            qty,
            unit,
            note,
            is_optional,
            canonical_food_id,
            generic_product_id,
            cultivar_id,
            derived_product_id
          )
        `)
        .order('title');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      const { data, error } = await supabase.rpc('get_recipes_availability');
      
      if (!error && data) {
        const statusMap = {};
        data.forEach(item => {
          statusMap[item.recipe_id] = {
            totalIngredients: item.total_ingredients,
            availableIngredients: item.available_ingredients,
            availabilityPercent: item.availability_percent
          };
        });
        setInventoryStatus(statusMap);
      }
    } catch (error) {
      console.error('Erreur vérification stocks:', error);
    }
  }

  async function deleteRecipe(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== id));
      alert('Recette supprimée avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function duplicateRecipe(recipe) {
    try {
      const { data: newRecipe, error } = await supabase.rpc('duplicate_recipe', {
        source_recipe_id: recipe.id
      });

      if (error) throw error;
      
      alert('Recette dupliquée avec succès');
      fetchRecipes();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la duplication');
    }
  }

  // Filtrage et tri
  const filteredRecipes = recipes
    .filter(recipe => {
      const matchSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = filterCategory === 'all' || recipe.category === filterCategory;
      const matchDifficulty = filterDifficulty === 'all' || recipe.difficulty === filterDifficulty;
      
      return matchSearch && matchCategory && matchDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'time':
          return (a.total_min || 0) - (b.total_min || 0);
        case 'difficulty':
          const diffOrder = { 'facile': 1, 'moyen': 2, 'difficile': 3 };
          return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
        case 'availability':
          const aAvail = inventoryStatus[a.id]?.availabilityPercent || 0;
          const bAvail = inventoryStatus[b.id]?.availabilityPercent || 0;
          return bAvail - aAvail;
        default:
          return 0;
      }
    });

  // Catégories uniques pour le filtre
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="recipes-container">
        <div className="loading-spinner">⏳ Chargement des recettes...</div>
      </div>
    );
  }

  return (
    <div className="recipes-container">
      <div className="recipes-header">
        <h1>📖 Mes Recettes</h1>
        <Link href="/recipes/new" className="btn-primary">
          ➕ Nouvelle recette
        </Link>
      </div>

      {/* Barre de filtres */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={filterDifficulty} 
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="filter-select"
        >
          <option value="all">Toutes difficultés</option>
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="title">Trier par nom</option>
          <option value="time">Trier par temps</option>
          <option value="difficulty">Trier par difficulté</option>
          <option value="availability">Trier par disponibilité</option>
        </select>
      </div>

      {/* Stats rapides */}
      <div className="recipes-stats">
        <div className="stat-card">
          <span className="stat-number">{recipes.length}</span>
          <span className="stat-label">Recettes totales</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {recipes.filter(r => inventoryStatus[r.id]?.availabilityPercent >= 90).length}
          </span>
          <span className="stat-label">Réalisables (≥90%)</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {recipes.filter(r => r.is_veg).length}
          </span>
          <span className="stat-label">Végétariennes</span>
        </div>
      </div>

      {/* Grille de recettes */}
      <div className="recipes-grid">
        {filteredRecipes.map(recipe => {
          const status = inventoryStatus[recipe.id] || {};
          const availabilityClass = 
            status.availabilityPercent >= 90 ? 'high' :
            status.availabilityPercent >= 50 ? 'medium' : 'low';
          
          return (
            <div key={recipe.id} className="recipe-card">
              {recipe.image_url && (
                <div className="recipe-image">
                  <img src={recipe.image_url} alt={recipe.title} />
                  {recipe.is_veg && <span className="badge veg">🌱 Végé</span>}
                </div>
              )}
              
              <div className="recipe-content">
                <h3>{recipe.title}</h3>
                
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}

                <div className="recipe-meta">
                  <span className="meta-item">
                    ⏱ {recipe.total_min || recipe.prep_min + recipe.cook_min || '?'} min
                  </span>
                  <span className="meta-item">
                    👥 {recipe.servings || 2} portions
                  </span>
                  {recipe.difficulty && (
                    <span className={`meta-item difficulty-${recipe.difficulty}`}>
                      {recipe.difficulty === 'facile' ? '👶' : 
                       recipe.difficulty === 'moyen' ? '👨‍🍳' : '👨‍🍳👨‍🍳'}
                      {recipe.difficulty}
                    </span>
                  )}
                </div>

                {status.availabilityPercent !== undefined && (
                  <div className={`availability-bar ${availabilityClass}`}>
                    <div 
                      className="availability-fill" 
                      style={{ width: `${status.availabilityPercent}%` }}
                    />
                    <span className="availability-text">
                      {status.availableIngredients}/{status.totalIngredients} ingrédients disponibles
                    </span>
                  </div>
                )}

                <div className="recipe-actions">
                  <button 
                    onClick={() => setSelectedRecipe(recipe)}
                    className="btn-secondary"
                    title="Voir détails"
                  >
                    👁 Voir
                  </button>
                  <Link 
                    href={`/recipes/edit/${recipe.id}`}
                    className="btn-secondary"
                    title="Modifier"
                  >
                    ✏️ Modifier
                  </Link>
                  <button 
                    onClick={() => duplicateRecipe(recipe)}
                    className="btn-secondary"
                    title="Dupliquer"
                  >
                    📑 Dupliquer
                  </button>
                  <button 
                    onClick={() => deleteRecipe(recipe.id)}
                    className="btn-danger"
                    title="Supprimer"
                  >
                    🗑
                  </button>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="recipe-tags">
                    {recipe.tags.map((tag, idx) => (
                      <span key={idx} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="no-results">
          <p>Aucune recette trouvée</p>
          <Link href="/recipes/new" className="btn-primary">
            Créer votre première recette
          </Link>
        </div>
      )}

      {/* Modal de détails de recette */}
      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          inventoryStatus={inventoryStatus[selectedRecipe.id]}
        />
      )}
    </div>
  );
}

// Composant Modal pour les détails de recette
function RecipeModal({ recipe, onClose, inventoryStatus }) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecipeDetails();
  }, [recipe.id]);

  async function fetchRecipeDetails() {
    try {
      // Charger les ingrédients détaillés
      const { data: ingredientsData } = await supabase
        .from('recipe_ingredients_detailed')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('position');
      
      // Charger les étapes
      const { data: stepsData } = await supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('step_no');
      
      // Charger les ustensiles
      const { data: utensilsData } = await supabase
        .from('recipe_utensils')
        .select('*')
        .eq('recipe_id', recipe.id);

      setIngredients(ingredientsData || []);
      setSteps(stepsData || []);
      setTools(utensilsData || []);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-modal">
          <div className="modal-header">
            <div>
              <h2>{recipe.title}</h2>
              <div className="modal-badges">
                {recipe.is_veg && <span className="badge veg">🌱 Végétarien</span>}
                {recipe.difficulty && (
                  <span className={`badge difficulty-${recipe.difficulty}`}>
                    {recipe.difficulty}
                  </span>
                )}
                {recipe.category && (
                  <span className="badge category">{recipe.category}</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="modal-close-btn">✕</button>
          </div>

          <div className="modal-info-grid">
            <div className="modal-info-item">
              <span className="info-label">⏱ Préparation:</span>
              <span className="info-value">{recipe.prep_min || '?'} min</span>
            </div>
            <div className="modal-info-item">
              <span className="info-label">🔥 Cuisson:</span>
              <span className="info-value">{recipe.cook_min || '?'} min</span>
            </div>
            <div className="modal-info-item">
              <span className="info-label">👥 Portions:</span>
              <span className="info-value">{recipe.servings || 2}</span>
            </div>
            {inventoryStatus && (
              <div className="modal-info-item">
                <span className="info-label">📦 Disponibilité:</span>
                <span className="info-value">{inventoryStatus.availabilityPercent}%</span>
              </div>
            )}
          </div>

          {recipe.description && (
            <div className="modal-section">
              <h3>Description</h3>
              <p className="recipe-full-description">{recipe.description}</p>
            </div>
          )}

          {/* Tabs de navigation */}
          <div className="modal-tabs">
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
              📝 Instructions
            </button>
            <button 
              className={`tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              🔧 Ustensiles
            </button>
            {recipe.nutrition && (
              <button 
                className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
                onClick={() => setActiveTab('nutrition')}
              >
                📊 Nutrition
              </button>
            )}
          </div>

          {/* Contenu des tabs */}
          <div className="modal-tab-content">
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <>
                {activeTab === 'ingredients' && (
                  <div className="modal-section">
                    {ingredients.length > 0 ? (
                      <ul className="ingredients-list-modal">
                        {ingredients.map((ing, idx) => (
                          <li key={ing.id || idx}>
                            <span className="ingredient-qty">
                              {ing.qty} {ing.unit}
                            </span>
                            <span className="ingredient-name">
                              {ing.display_name}
                              {ing.is_optional && ' (optionnel)'}
                            </span>
                            {ing.note && (
                              <span className="ingredient-note">{ing.note}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">Aucun ingrédient défini</p>
                    )}
                  </div>
                )}

                {activeTab === 'steps' && (
                  <div className="modal-section">
                    {steps.length > 0 ? (
                      recipe.steps ? (
                        <div className="recipe-steps-text">{recipe.steps}</div>
                      ) : (
                        <ol className="recipe-steps-list">
                          {steps.map((step, idx) => (
                            <li key={step.id || idx}>
                              {step.instruction}
                              {step.duration_min && (
                                <span className="step-duration"> ({step.duration_min} min)</span>
                              )}
                              {step.temperature && (
                                <span className="step-temp">
                                  {' '}à {step.temperature}{step.temperature_unit || '°C'}
                                </span>
                              )}
                            </li>
                          ))}
                        </ol>
                      )
                    ) : recipe.steps ? (
                      <div className="recipe-steps-text">{recipe.steps}</div>
                    ) : (
                      <p className="empty-text">Aucune instruction définie</p>
                    )}
                  </div>
                )}

                {activeTab === 'tools' && (
                  <div className="modal-section">
                    {tools.length > 0 ? (
                      <ul className="tools-list">
                        {tools.map((tool, idx) => (
                          <li key={tool.id || idx}>
                            {tool.quantity > 1 && `${tool.quantity}× `}
                            {tool.utensil_name}
                            {tool.is_optional && ' (optionnel)'}
                            {tool.notes && <span className="tool-note"> - {tool.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="empty-text">Aucun ustensile défini</p>
                    )}
                  </div>
                )}

                {activeTab === 'nutrition' && recipe.nutrition && (
                  <div className="modal-section">
                    <div className="nutrition-grid">
                      {Object.entries(recipe.nutrition).map(([key, value]) => (
                        <div key={key} className="nutrition-item">
                          <span className="nutrition-label">{key}:</span>
                          <span className="nutrition-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-actions">
            <Link href={`/recipes/edit/${recipe.id}`} className="modal-btn primary">
              ✏️ Modifier la recette
            </Link>
            <Link href={`/meal-planning?recipe=${recipe.id}`} className="modal-btn secondary">
              📅 Planifier ce repas
            </Link>
            <button onClick={onClose} className="modal-btn">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
