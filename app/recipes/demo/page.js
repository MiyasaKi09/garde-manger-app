'use client';

import { useState } from 'react';
import '../recipes.css';

// Données de démonstration pour tester l'interface Myko
const DEMO_RECIPE = {
  id: 1,
  title: "Bar grillé à la salsa de maïs et avocat",
  description: "Un plat léger et savoureux alliant la fraîcheur de l'avocat au croquant du maïs grillé.",
  image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&q=80",
  servings: 4,
  total_min: 30,
  prep_min: 15,
  cook_min: 15,
  difficulty: "moyen",
  category: "Poisson",
  is_veg: false,
  nutrition: {
    calories: 158,
    proteins: 25,
    carbs: 12,
    fats: 6,
    vitaminC: 15,
    vitaminD: 2.1,
    iron: 2.5,
    calcium: 80
  }
};

const DEMO_INGREDIENTS = [
  { id: 1, display_name: "Filet de bar", qty: 150, unit: "g", stock_status: true, available_quantity: 200 },
  { id: 2, display_name: "Maïs en grains", qty: 75, unit: "g", stock_status: false, available_quantity: 0 },
  { id: 3, display_name: "Avocat", qty: 1, unit: "pièce", stock_status: true, available_quantity: 2 },
  { id: 4, display_name: "Tomate cerise", qty: 100, unit: "g", stock_status: true, available_quantity: 150 },
  { id: 5, display_name: "Oignon rouge", qty: 50, unit: "g", stock_status: false, available_quantity: 0 },
  { id: 6, display_name: "Huile d'olive", qty: 2, unit: "c.à.s", stock_status: true, available_quantity: 500 },
  { id: 7, display_name: "Citron vert", qty: 1, unit: "pièce", stock_status: true, available_quantity: 3 },
  { id: 8, display_name: "Coriandre fraîche", qty: 10, unit: "g", stock_status: true, available_quantity: 15 }
];

const DEMO_STEPS = [
  { id: 1, instruction: "Assaisonner le poisson avec huile d'olive, sel et poivre. Laisser mariner 10 minutes.", duration_min: 10 },
  { id: 2, instruction: "Préparer la salsa : mélanger le maïs, l'avocat coupé en dés, les tomates cerises et l'oignon rouge.", duration_min: 5 },
  { id: 3, instruction: "Ajouter le jus de citron vert et la coriandre ciselée à la salsa. Assaisonner.", duration_min: 2 },
  { id: 4, instruction: "Griller le poisson sur une plancha ou dans une poêle bien chaude, 4 minutes par face.", duration_min: 8, temperature: 200, temperature_unit: "°C" },
  { id: 5, instruction: "Dresser le poisson sur assiette et accompagner de la salsa fraîche. Servir immédiatement.", duration_min: 2 }
];

const DEMO_TOOLS = [
  { id: 1, utensil_name: "Couteau de cuisine", quantity: 1 },
  { id: 2, utensil_name: "Planche à découper", quantity: 1 },
  { id: 3, utensil_name: "Saladier", quantity: 2 },
  { id: 4, utensil_name: "Plancha ou poêle", quantity: 1 },
  { id: 5, utensil_name: "Pince de cuisine", quantity: 1 }
];

export default function RecipesDemoPage() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const inventoryStatus = {
    1: {
      totalIngredients: 8,
      availableIngredients: 6,
      availabilityPercent: 75
    }
  };

  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Démo</span>
          <h1 className="v21-title">Interface recettes</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Aperçu de la fiche recette Myko en action.</p>
        </div>
        <div className="v21-hero-side">
          <button onClick={() => setSelectedRecipe(DEMO_RECIPE)} className="v21-btn terra">
            Voir la recette
          </button>
        </div>
      </header>

      {selectedRecipe && (
        <RecipeModalDemo 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)}
          inventoryStatus={inventoryStatus[selectedRecipe.id]}
        />
      )}
    </div>
  );
}

// Copie du composant modal avec les données de démo
function RecipeModalDemo({ recipe, onClose, inventoryStatus }) {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [servings, setServings] = useState(recipe.servings || 2);
  
  // Simulation des données chargées
  const ingredients = DEMO_INGREDIENTS;
  const steps = DEMO_STEPS;
  const tools = DEMO_TOOLS;
  const loading = false;
  
  const missingIngredients = ingredients.filter(ing => 
    !ing.stock_status || ing.available_quantity < (ing.qty * servings / recipe.servings)
  );

  // Calculer les macros
  const calculateMacros = () => {
    const { proteins = 25, carbs = 12, fats = 6 } = recipe.nutrition;
    const total = proteins + carbs + fats;
    
    return {
      proteins: Math.round((proteins / total) * 100),
      carbs: Math.round((carbs / total) * 100), 
      fats: Math.round((fats / total) * 100)
    };
  };

  const macros = calculateMacros();
  const calories = recipe.nutrition?.calories || 158;
  
  // Ajuster les quantités selon le nombre de portions
  const adjustedIngredients = ingredients.map(ing => ({
    ...ing,
    adjustedQty: (ing.qty * servings / recipe.servings).toFixed(1)
  }));

  function addMissingToShoppingList() {
    alert(`${missingIngredients.length} ingrédients ajoutés à votre liste de courses !`);
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
            <img src={recipe.image_url} alt={recipe.title} />
            <div className="recipe-hero-overlay">
              <h1>{recipe.title}</h1>
              <div className="recipe-badges">
                {recipe.is_veg && <span className="badge veg">🌱 Végé</span>}
                <span className={`badge difficulty-${recipe.difficulty}`}>
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Infos rapides sous la photo */}
          <div className="recipe-quick-info">
            <div className="quick-info-item">
              <span className="info-icon">⏱</span>
              <div>
                <span className="info-value">{recipe.total_min} min</span>
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
              <span className="info-icon">👥</span>
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
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="utensils-tab-myko">
                <div className="utensils-grid-myko">
                  {tools.map((tool, idx) => (
                    <div key={tool.id || idx} className="utensil-item-myko">
                      <span className="utensil-icon">{getUtensilIcon(tool.utensil_name)}</span>
                      <div className="utensil-details">
                        <span className="utensil-name">
                          {tool.quantity > 1 && `${tool.quantity}× `}
                          {tool.utensil_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
                        <span className="macro-value">{recipe.nutrition.proteins} g ({macros.proteins}%)</span>
                      </div>
                    </div>
                    <div className="macro-detail-item">
                      <span className="macro-color carbs"></span>
                      <div>
                        <span className="macro-name">Glucides</span>
                        <span className="macro-value">{recipe.nutrition.carbs} g ({macros.carbs}%)</span>
                      </div>
                    </div>
                    <div className="macro-detail-item">
                      <span className="macro-color fats"></span>
                      <div>
                        <span className="macro-name">Lipides</span>
                        <span className="macro-value">{recipe.nutrition.fats} g ({macros.fats}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Vitamines et minéraux */}
                  <div className="vitamins-minerals">
                    <h5>Vitamines & Minéraux notables</h5>
                    <div className="nutrients-grid">
                      <div className="nutrient-item">
                        <span>Vitamine C</span>
                        <span>{recipe.nutrition.vitaminC} mg</span>
                      </div>
                      <div className="nutrient-item">
                        <span>Vitamine D</span>
                        <span>{recipe.nutrition.vitaminD} µg</span>
                      </div>
                      <div className="nutrient-item">
                        <span>Fer</span>
                        <span>{recipe.nutrition.iron} mg</span>
                      </div>
                      <div className="nutrient-item">
                        <span>Calcium</span>
                        <span>{recipe.nutrition.calcium} mg</span>
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
          </div>

          <div className="modal-actions-myko">
            <button className="modal-btn-myko primary">
              ✏️ Modifier
            </button>
            <button className="modal-btn-myko secondary">
              📅 Planifier
            </button>
            <button onClick={onClose} className="modal-btn-myko tertiary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fonctions utilitaires pour les icônes (copiées du fichier principal)
function getIngredientIcon(ingredientName) {
  const name = ingredientName.toLowerCase();
  
  if (name.includes('bar') || name.includes('poisson')) return '🐟';
  if (name.includes('maïs')) return '🌽';
  if (name.includes('avocat')) return '🥑';
  if (name.includes('tomate')) return '🍅';
  if (name.includes('oignon')) return '🧅';
  if (name.includes('huile')) return '🫒';
  if (name.includes('citron')) return '🍋';
  if (name.includes('coriandre') || name.includes('persil') || name.includes('basilic')) return '🌿';
  
  return '🥘';
}

function getUtensilIcon(utensilName) {
  const name = utensilName.toLowerCase();
  
  if (name.includes('couteau')) return '🔪';
  if (name.includes('planche')) return '🪵';
  if (name.includes('saladier') || name.includes('bol')) return '🥣';
  if (name.includes('pince')) return '🍴';
  if (name.includes('poêle') || name.includes('plancha')) return '🍳';
  
  return '🔧';
}