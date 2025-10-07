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

// Composant Modal pour les détails de recette - Style Myko
function RecipeModal({ recipe, onClose, inventoryStatus }) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(recipe.servings || 2);
  const [missingIngredients, setMissingIngredients] = useState([]);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecipeDetails();
  }, [recipe.id]);

  async function fetchRecipeDetails() {
    try {
      // Charger les ingrédients détaillés avec statut de stock
      const { data: ingredientsData } = await supabase
        .from('recipe_ingredients_detailed')
        .select(`
          *,
          stock_status,
          available_quantity
        `)
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
      
      // Identifier les ingrédients manquants
      const missing = (ingredientsData || []).filter(ing => 
        !ing.stock_status || ing.available_quantity < (ing.qty * servings / recipe.servings)
      );
      setMissingIngredients(missing);
      
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculer les macros (exemple - à adapter selon vos données nutrition)
  const calculateMacros = () => {
    if (!recipe.nutrition) return { proteins: 33, carbs: 33, fats: 34 };
    
    const { proteins = 0, carbs = 0, fats = 0 } = recipe.nutrition;
    const total = proteins + carbs + fats;
    
    return total > 0 ? {
      proteins: Math.round((proteins / total) * 100),
      carbs: Math.round((carbs / total) * 100), 
      fats: Math.round((fats / total) * 100)
    } : { proteins: 33, carbs: 33, fats: 34 };
  };

  const macros = calculateMacros();
  const calories = recipe.nutrition?.calories || 158;
  
  // Ajuster les quantités selon le nombre de portions
  const adjustedIngredients = ingredients.map(ing => ({
    ...ing,
    adjustedQty: (ing.qty * servings / recipe.servings).toFixed(1)
  }));

  async function addMissingToShoppingList() {
    if (missingIngredients.length === 0) return;
    
    try {
      // Logique pour ajouter à la liste de courses
      console.log('Ajout à la liste de courses:', missingIngredients);
      alert(`${missingIngredients.length} ingrédients ajoutés à votre liste de courses !`);
    } catch (error) {
      console.error('Erreur ajout liste courses:', error);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-modal myko-style">
          
          {/* Header avec bouton fermer */}
          <div className="modal-header-myko">
            <button onClick={onClose} className="modal-close-btn">✕</button>
          </div>

          {/* Photo grand format du plat */}
          <div className="recipe-hero-image">
            {recipe.image_url ? (
              <img src={recipe.image_url} alt={recipe.title} />
            ) : (
              <div className="recipe-placeholder-image">
                <span>📸</span>
                <p>Photo du plat</p>
              </div>
            )}
            <div className="recipe-hero-overlay">
              <h1>{recipe.title}</h1>
              <div className="recipe-badges">
                {recipe.is_veg && <span className="badge veg">🌱 Végé</span>}
                {recipe.difficulty && (
                  <span className={`badge difficulty-${recipe.difficulty}`}>
                    {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Infos rapides sous la photo */}
          <div className="recipe-quick-info">
            <div className="quick-info-item">
              <span className="info-icon">⏱</span>
              <div>
                <span className="info-value">{recipe.total_min || (recipe.prep_min + recipe.cook_min) || 30} min</span>
                <span className="info-label">Temps total</span>
              </div>
            </div>
            <div className="quick-info-item">
              <span className="info-icon">🔥</span>
              <div>
                <span className="info-value">{calories} kcal</span>
                <span className="info-label">Par portion</span>
              </div>
            </div>
            <div className="quick-info-item">
              <span className="info-icon">�</span>
              <div>
                <span className="info-value">{servings} portions</span>
                <span className="info-label">Actuel</span>
              </div>
            </div>
          </div>

          {/* Graphique macros circulaire */}
          <div className="macros-section">
            <h3>Répartition nutritionnelle</h3>
            <div className="macros-circle-container">
              <div className="macros-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#4caf50"
                    strokeWidth="10"
                    strokeDasharray={`${macros.proteins * 3.14} 314`}
                    strokeDashoffset="0"
                    transform="rotate(-90 60 60)"
                  />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#ff9800"
                    strokeWidth="10"
                    strokeDasharray={`${macros.carbs * 3.14} 314`}
                    strokeDashoffset={`-${macros.proteins * 3.14}`}
                    transform="rotate(-90 60 60)"
                  />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="#2196f3"
                    strokeWidth="10"
                    strokeDasharray={`${macros.fats * 3.14} 314`}
                    strokeDashoffset={`-${(macros.proteins + macros.carbs) * 3.14}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="macros-center">
                  <span className="calories-main">{calories}</span>
                  <span className="calories-unit">kcal</span>
                </div>
              </div>
              <div className="macros-legend">
                <div className="macro-item">
                  <span className="macro-color proteins"></span>
                  <span>Protéines {macros.proteins}%</span>
                </div>
                <div className="macro-item">
                  <span className="macro-color carbs"></span>
                  <span>Glucides {macros.carbs}%</span>
                </div>
                <div className="macro-item">
                  <span className="macro-color fats"></span>
                  <span>Lipides {macros.fats}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets style Myko */}
          <div className="myko-tabs">
            <button 
              className={`myko-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              Ingrédients
            </button>
            <button 
              className={`myko-tab ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              Instructions
            </button>
            <button 
              className={`myko-tab ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              Ustensiles
            </button>
            <button 
              className={`myko-tab ${activeTab === 'nutrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('nutrition')}
            >
              Nutrition
            </button>
          </div>

          {/* Contenu des onglets Myko */}
          <div className="myko-tab-content">
            {loading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <>
                {activeTab === 'ingredients' && (
                  <div className="ingredients-tab-myko">
                    {/* Sélecteur de portions */}
                    <div className="portions-selector">
                      <span>Portions :</span>
                      <div className="portions-controls">
                        <button 
                          onClick={() => setServings(Math.max(1, servings - 1))}
                          className="portion-btn"
                        >
                          -
                        </button>
                        <span className="portion-number">{servings}</span>
                        <button 
                          onClick={() => setServings(servings + 1)}
                          className="portion-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Liste des ingrédients avec icônes et statut */}
                    <div className="ingredients-list-myko">
                      {adjustedIngredients.map((ing, idx) => {
                        const isAvailable = ing.stock_status && ing.available_quantity >= ing.adjustedQty;
                        return (
                          <div key={ing.id || idx} className={`ingredient-item-myko ${isAvailable ? 'available' : 'missing'}`}>
                            <span className="ingredient-icon">
                              {getIngredientIcon(ing.display_name)}
                            </span>
                            <div className="ingredient-details">
                              <span className="ingredient-name">{ing.display_name}</span>
                              <span className="ingredient-qty">{ing.adjustedQty} {ing.unit}</span>
                              {ing.note && <span className="ingredient-note">{ing.note}</span>}
                            </div>
                            <span className={`stock-status ${isAvailable ? 'in-stock' : 'out-stock'}`}>
                              {isAvailable ? '✅' : '❌'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bouton pour ajouter les manquants */}
                    {missingIngredients.length > 0 && (
                      <button 
                        onClick={addMissingToShoppingList}
                        className="add-to-shopping-btn"
                      >
                        ➕ Ajouter les {missingIngredients.length} ingrédients manquants à la liste de courses
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'steps' && (
                  <div className="instructions-tab-myko">
                    {steps.length > 0 ? (
                      <ol className="recipe-steps-myko">
                        {steps.map((step, idx) => (
                          <li key={step.id || idx} className="step-item-myko">
                            <div className="step-content">
                              <p>{step.instruction}</p>
                              <div className="step-meta">
                                {step.duration_min && (
                                  <span className="step-duration">⏱ {step.duration_min} min</span>
                                )}
                                {step.temperature && (
                                  <span className="step-temp">
                                    🌡 {step.temperature}{step.temperature_unit || '°C'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : recipe.steps ? (
                      <div className="recipe-steps-text-myko">
                        {recipe.steps.split('\n').filter(step => step.trim()).map((step, idx) => (
                          <div key={idx} className="step-item-myko-text">
                            <div className="step-content">
                              <p>{step.trim()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">Aucune instruction définie</p>
                    )}
                  </div>
                )}

                {activeTab === 'tools' && (
                  <div className="utensils-tab-myko">
                    {tools.length > 0 ? (
                      <div className="utensils-grid-myko">
                        {tools.map((tool, idx) => (
                          <div key={tool.id || idx} className="utensil-item-myko">
                            <span className="utensil-icon">{getUtensilIcon(tool.utensil_name)}</span>
                            <div className="utensil-details">
                              <span className="utensil-name">
                                {tool.quantity > 1 && `${tool.quantity}× `}
                                {tool.utensil_name}
                              </span>
                              {tool.notes && <span className="utensil-note">{tool.notes}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">Aucun ustensile spécifique requis</p>
                    )}
                  </div>
                )}

                {activeTab === 'nutrition' && (
                  <div className="nutrition-tab-myko">
                    <div className="nutrition-detailed">
                      <h4>Apports nutritionnels par portion</h4>
                      
                      {/* Macronutriments détaillés */}
                      <div className="macro-details">
                        <div className="macro-detail-item">
                          <span className="macro-color proteins"></span>
                          <div>
                            <span className="macro-name">Protéines</span>
                            <span className="macro-value">{recipe.nutrition?.proteins || '15'} g ({macros.proteins}%)</span>
                          </div>
                        </div>
                        <div className="macro-detail-item">
                          <span className="macro-color carbs"></span>
                          <div>
                            <span className="macro-name">Glucides</span>
                            <span className="macro-value">{recipe.nutrition?.carbs || '20'} g ({macros.carbs}%)</span>
                          </div>
                        </div>
                        <div className="macro-detail-item">
                          <span className="macro-color fats"></span>
                          <div>
                            <span className="macro-name">Lipides</span>
                            <span className="macro-value">{recipe.nutrition?.fats || '8'} g ({macros.fats}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Vitamines et minéraux */}
                      <div className="vitamins-minerals">
                        <h5>Vitamines & Minéraux notables</h5>
                        <div className="nutrients-grid">
                          <div className="nutrient-item">
                            <span>Vitamine C</span>
                            <span>{recipe.nutrition?.vitaminC || '15'} mg</span>
                          </div>
                          <div className="nutrient-item">
                            <span>Vitamine D</span>
                            <span>{recipe.nutrition?.vitaminD || '2.1'} µg</span>
                          </div>
                          <div className="nutrient-item">
                            <span>Fer</span>
                            <span>{recipe.nutrition?.iron || '2.5'} mg</span>
                          </div>
                          <div className="nutrient-item">
                            <span>Calcium</span>
                            <span>{recipe.nutrition?.calcium || '80'} mg</span>
                          </div>
                        </div>
                      </div>

                      {/* Impact sur les besoins journaliers */}
                      <div className="daily-needs-impact">
                        <h5>Impact sur vos besoins journaliers</h5>
                        <div className="daily-impact-item">
                          <span className="impact-text">
                            Cette recette couvre <strong>32%</strong> de votre besoin journalier en protéines
                          </span>
                        </div>
                        <div className="daily-impact-item">
                          <span className="impact-text">
                            Apporte <strong>15%</strong> de vos besoins en vitamine C
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-actions-myko">
            <Link href={`/recipes/edit/${recipe.id}`} className="modal-btn-myko primary">
              ✏️ Modifier
            </Link>
            <Link href={`/planning?recipe=${recipe.id}`} className="modal-btn-myko secondary">
              📅 Planifier
            </Link>
            <button onClick={onClose} className="modal-btn-myko tertiary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fonctions utilitaires pour les icônes
function getIngredientIcon(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  // Poissons et fruits de mer
  if (name.includes('bar') || name.includes('poisson')) return '🐟';
  if (name.includes('saumon')) return '🍣';
  if (name.includes('thon')) return '🐟';
  
  // Légumes
  if (name.includes('tomate')) return '🍅';
  if (name.includes('maïs')) return '🌽';
  if (name.includes('avocat')) return '🥑';
  if (name.includes('oignon')) return '🧅';
  if (name.includes('ail')) return '🧄';
  if (name.includes('carotte')) return '🥕';
  if (name.includes('pomme de terre')) return '🥔';
  if (name.includes('épinard')) return '🥬';
  if (name.includes('salade')) return '🥬';
  
  // Fruits
  if (name.includes('citron')) return '🍋';
  if (name.includes('pomme')) return '🍎';
  if (name.includes('orange')) return '🍊';
  
  // Herbes et épices
  if (name.includes('persil') || name.includes('ciboulette') || name.includes('basilic')) return '🌿';
  if (name.includes('poivre') || name.includes('piment')) return '🌶️';
  
  // Huiles et condiments
  if (name.includes('huile')) return '🫒';
  if (name.includes('vinaigre')) return '🍶';
  if (name.includes('sel')) return '🧂';
  
  // Produits laitiers
  if (name.includes('fromage')) return '🧀';
  if (name.includes('beurre')) return '🧈';
  if (name.includes('lait') || name.includes('crème')) return '🥛';
  
  // Viandes
  if (name.includes('poulet') || name.includes('volaille')) return '🍗';
  if (name.includes('boeuf') || name.includes('steak')) return '🥩';
  if (name.includes('porc')) return '🥓';
  
  // Céréales et légumineuses
  if (name.includes('riz')) return '🍚';
  if (name.includes('pâtes')) return '🍝';
  if (name.includes('haricot')) return '🫘';
  
  // Par défaut
  return '🥘';
}

function getUtensilIcon(utensilName) {
  const name = utensilName.toLowerCase();
  
  if (name.includes('couteau')) return '🔪';
  if (name.includes('planche')) return '🪵';
  if (name.includes('saladier') || name.includes('bol')) return '🥣';
  if (name.includes('pince')) return '🍴';
  if (name.includes('poêle')) return '🍳';
  if (name.includes('gril') || name.includes('barbecue')) return '🔥';
  if (name.includes('casserole')) return '🥘';
  if (name.includes('four')) return '🔥';
  if (name.includes('mixeur') || name.includes('blender')) return '🌪️';
  if (name.includes('fouet')) return '🥄';
  if (name.includes('cuillère') || name.includes('cuiller')) return '🥄';
  if (name.includes('spatule')) return '🥄';
  
  // Par défaut
  return '🔧';
}
