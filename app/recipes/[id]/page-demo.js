'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './recipe-detail.css';

// Données de démonstration - à synchroniser avec page.js
const DEMO_RECIPES = {
  'demo-1': {
    id: 'demo-1',
    title: 'Ratatouille Provençale',
    description: 'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons. Un classique de la cuisine française parfait pour l\'été.',
    prep_min: 30,
    cook_min: 60,
    rest_min: 0,
    servings: 6,
    myko_score: 95,
    instructions: 'Couper tous les légumes en dés réguliers. Dans une large poêle, faire revenir séparément les aubergines, puis les courgettes, puis les poivrons dans l\'huile d\'olive. Réserver chaque légume. Dans la même poêle, faire revenir l\'oignon émincé, ajouter l\'ail haché. Remettre tous les légumes, ajouter les tomates concassées, les herbes de Provence, le thym, le laurier. Saler, poivrer. Mijoter à feu doux 45 minutes en remuant de temps en temps.',
    difficulty: 'Facile',
    chef_tips: 'Cuire les légumes séparément d\'abord pour une meilleure texture. La ratatouille est encore meilleure réchauffée le lendemain.',
    ingredients: [
      { name: 'Aubergines', quantity: '2', unit: 'pièces' },
      { name: 'Courgettes', quantity: '3', unit: 'pièces' },
      { name: 'Poivrons rouges', quantity: '2', unit: 'pièces' },
      { name: 'Tomates', quantity: '6', unit: 'pièces' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '4', unit: 'gousses' },
      { name: 'Huile d\'olive', quantity: '6', unit: 'c. à soupe' },
      { name: 'Herbes de Provence', quantity: '2', unit: 'c. à café' },
      { name: 'Thym frais', quantity: '4', unit: 'branches' }
    ],
    nutrition: {
      calories: 180,
      proteins: 6,
      carbs: 22,
      fats: 9,
      fiber: 8
    }
  },
  'demo-2': {
    id: 'demo-2',
    title: 'Curry de lentilles corail',
    description: 'Curry végétarien aux lentilles corail, lait de coco et épices indiennes. Riche en protéines et en saveurs.',
    prep_min: 20,
    cook_min: 35,
    rest_min: 0,
    servings: 4,
    myko_score: 88,
    instructions: 'Rincer les lentilles corail à l\'eau froide. Dans une casserole, faire chauffer l\'huile et faire revenir l\'oignon émincé jusqu\'à ce qu\'il soit translucide. Ajouter l\'ail, le gingembre râpé et les épices (curcuma, cumin, coriandre, garam masala). Faire revenir 1 minute. Ajouter les lentilles, les tomates concassées et le lait de coco. Porter à ébullition puis réduire le feu et laisser mijoter 25-30 minutes jusqu\'à ce que les lentilles soient tendres. Saler, poivrer et ajouter le jus de citron. Garnir de coriandre fraîche.',
    difficulty: 'Moyen',
    chef_tips: 'Rincer les lentilles corail avant cuisson pour éviter l\'écume. Ajuster la consistance avec un peu d\'eau si nécessaire.',
    ingredients: [
      { name: 'Lentilles corail', quantity: '300', unit: 'g' },
      { name: 'Lait de coco', quantity: '400', unit: 'ml' },
      { name: 'Tomates concassées', quantity: '400', unit: 'g' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Ail', quantity: '3', unit: 'gousses' },
      { name: 'Gingembre frais', quantity: '2', unit: 'cm' },
      { name: 'Curcuma', quantity: '1', unit: 'c. à café' },
      { name: 'Cumin moulu', quantity: '1', unit: 'c. à café' },
      { name: 'Coriandre moulue', quantity: '1', unit: 'c. à café' },
      { name: 'Garam masala', quantity: '1/2', unit: 'c. à café' }
    ],
    nutrition: {
      calories: 320,
      proteins: 18,
      carbs: 42,
      fats: 12,
      fiber: 16
    }
  },
  'demo-3': {
    id: 'demo-3',
    title: 'Soupe de potimarron rôti',
    description: 'Velouté onctueux de potimarron rôti avec une pointe de gingembre. Parfait pour les soirées d\'automne.',
    prep_min: 20,
    cook_min: 45,
    rest_min: 0,
    servings: 6,
    myko_score: 90,
    instructions: 'Préchauffer le four à 200°C. Couper le potimarron en quartiers, retirer les graines. Badigeonner d\'huile d\'olive et rôtir 30 minutes. Pendant ce temps, faire suer l\'oignon dans une casserole avec un peu d\'huile. Ajouter le gingembre râpé. Quand le potimarron est tendre, retirer la chair et l\'ajouter à la casserole. Verser le bouillon, porter à ébullition et laisser mijoter 15 minutes. Mixer jusqu\'à obtenir un velouté lisse. Ajouter la crème, saler et poivrer. Servir avec des graines de courge grillées.',
    difficulty: 'Facile',
    chef_tips: 'Rôtir le potimarron au four développe ses saveurs. Garder quelques graines pour les faire griller en accompagnement.',
    ingredients: [
      { name: 'Potimarron', quantity: '1.5', unit: 'kg' },
      { name: 'Bouillon de légumes', quantity: '1', unit: 'L' },
      { name: 'Oignon', quantity: '1', unit: 'pièce' },
      { name: 'Gingembre frais', quantity: '3', unit: 'cm' },
      { name: 'Crème fraîche', quantity: '100', unit: 'ml' },
      { name: 'Huile d\'olive', quantity: '3', unit: 'c. à soupe' },
      { name: 'Graines de courge', quantity: '2', unit: 'c. à soupe' }
    ],
    nutrition: {
      calories: 145,
      proteins: 4,
      carbs: 18,
      fats: 7,
      fiber: 5
    }
  }
};

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Simuler un délai de chargement
      setTimeout(() => {
        const foundRecipe = DEMO_RECIPES[id];
        setRecipe(foundRecipe);
        setLoading(false);
      }, 500);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="recipe-detail-container">
        <div className="loading-spinner">
          Chargement de la recette...
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-container">
        <div className="error-message">
          <h2>Recette introuvable</h2>
          <p>Aucune recette trouvée avec l'ID: {id}</p>
          <Link href="/recipes" className="back-button">
            ← Retour aux recettes
          </Link>
        </div>
      </div>
    );
  }

  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0) + (recipe.rest_min || 0);

  return (
    <div className="recipe-detail-container">
      <div className="recipe-header">
        <Link href="/recipes" className="back-button">
          ← Retour aux recettes
        </Link>
        <div className="recipe-title-section">
          <h1 className="recipe-title">{recipe.title}</h1>
          <div className="recipe-badges">
            <span className={`myko-score ${recipe.myko_score >= 80 ? 'high-score' : 'medium-score'}`}>
              {recipe.myko_score}★ Myko
            </span>
            <span className="difficulty-badge">{recipe.difficulty}</span>
          </div>
        </div>
        <p className="recipe-description">{recipe.description}</p>
      </div>

      <div className="recipe-content">
        <div className="recipe-info-cards">
          <div className="info-card">
            <div className="info-icon">⏱️</div>
            <div className="info-content">
              <div className="info-label">Temps total</div>
              <div className="info-value">{totalTime} min</div>
              <div className="info-details">
                {recipe.prep_min > 0 && `Prep: ${recipe.prep_min}min`}
                {recipe.cook_min > 0 && ` • Cuisson: ${recipe.cook_min}min`}
                {recipe.rest_min > 0 && ` • Repos: ${recipe.rest_min}min`}
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">👥</div>
            <div className="info-content">
              <div className="info-label">Portions</div>
              <div className="info-value">{recipe.servings} parts</div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <div className="info-label">Difficulté</div>
              <div className="info-value">{recipe.difficulty}</div>
            </div>
          </div>

          {recipe.nutrition && (
            <div className="info-card">
              <div className="info-icon">🥗</div>
              <div className="info-content">
                <div className="info-label">Calories</div>
                <div className="info-value">{recipe.nutrition.calories} kcal</div>
                <div className="info-details">par portion</div>
              </div>
            </div>
          )}
        </div>

        <div className="recipe-body">
          <div className="ingredients-section">
            <h2>Ingrédients</h2>
            {recipe.ingredients ? (
              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="ingredient-item">
                    <span className="ingredient-quantity">
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                    <span className="ingredient-name">{ingredient.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-ingredients">Ingrédients non disponibles</p>
            )}
          </div>

          <div className="instructions-section">
            <h2>Instructions</h2>
            <div className="instructions-content">
              <p className="instructions-text">{recipe.instructions}</p>
            </div>

            {recipe.chef_tips && (
              <div className="chef-tips">
                <h3>💡 Conseils du chef</h3>
                <p>{recipe.chef_tips}</p>
              </div>
            )}
          </div>

          {recipe.nutrition && (
            <div className="nutrition-section">
              <h2>Valeurs nutritionnelles</h2>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Protéines</span>
                  <span className="nutrition-value">{recipe.nutrition.proteins}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Glucides</span>
                  <span className="nutrition-value">{recipe.nutrition.carbs}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Lipides</span>
                  <span className="nutrition-value">{recipe.nutrition.fats}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fibres</span>
                  <span className="nutrition-value">{recipe.nutrition.fiber}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="recipe-actions">
          <button className="action-btn primary">
            📅 Planifier cette recette
          </button>
          <button className="action-btn secondary">
            🛒 Ajouter aux courses
          </button>
          <button className="action-btn tertiary">
            📝 Modifier la recette
          </button>
        </div>
      </div>
    </div>
  );
}