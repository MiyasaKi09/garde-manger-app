/**
 * 📘 Exemple d'Intégration du Composant PairingSuggestions
 * 
 * Ce fichier montre comment intégrer les suggestions d'accompagnements
 * dans une page de recette existante.
 */

'use client';

import { useState } from 'react';
import PairingSuggestions from '@/components/PairingSuggestions';

/**
 * Exemple 1 : Dans une page de détail de recette
 */
export function RecipeDetailWithPairing({ recipeId, recipeName }) {
  const [selectedRecipes, setSelectedRecipes] = useState([]);

  async function handleAddToPlanning(recipe) {
    // Exemple : ajouter à la liste des recettes sélectionnées
    setSelectedRecipes(prev => [...prev, recipe]);
    
    // Dans une vraie implémentation, vous feriez :
    // await supabase
    //   .from('meal_plan')
    //   .insert({
    //     user_id: userId,
    //     date: selectedDate,
    //     meal_type: 'diner',
    //     recipe_id: recipe.id
    //   });
  }

  return (
    <div>
      {/* Contenu principal de la recette */}
      <div className="recipe-detail">
        <h1>{recipeName}</h1>
        {/* ... autres détails ... */}
      </div>

      {/* Suggestions d'accompagnements */}
      <PairingSuggestions
        mainRecipeId={recipeId}
        mainRecipeName={recipeName}
        onAddRecipe={handleAddToPlanning}
        maxSuggestions={5}
      />

      {/* Afficher les recettes sélectionnées */}
      {selectedRecipes.length > 0 && (
        <div className="selected-recipes">
          <h3>Accompagnements sélectionnés</h3>
          <ul>
            {selectedRecipes.map((recipe, index) => (
              <li key={index}>{recipe.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Exemple 2 : Dans la page de planning avec filtres
 */
export function PlanningPageWithPairing() {
  const [mainRecipe, setMainRecipe] = useState(null);
  const [dietFilter, setDietFilter] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState(null);

  async function handleAddToPlanning(recipe) {
    // Implémenter l'ajout au planning ici
  }

  return (
    <div>
      {/* Sélection du plat principal */}
      <div>
        <h2>Choisir un plat principal</h2>
        <button onClick={() => setMainRecipe({ id: 278, name: 'One pot pasta' })}>
          One pot pasta
        </button>
        <button onClick={() => setMainRecipe({ id: 142, name: 'Entrecôte grillée' })}>
          Entrecôte grillée
        </button>
      </div>

      {/* Filtres */}
      <div>
        <select onChange={(e) => setDietFilter(e.target.value || null)}>
          <option value="">Tous régimes</option>
          <option value="Végétarien">Végétarien</option>
          <option value="Vegan">Vegan</option>
          <option value="Sans Gluten">Sans Gluten</option>
        </select>

        <select onChange={(e) => setSeasonFilter(e.target.value || null)}>
          <option value="">Toutes saisons</option>
          <option value="Printemps">Printemps</option>
          <option value="Été">Été</option>
          <option value="Automne">Automne</option>
          <option value="Hiver">Hiver</option>
        </select>
      </div>

      {/* Suggestions avec filtres */}
      {mainRecipe && (
        <PairingSuggestions
          mainRecipeId={mainRecipe.id}
          mainRecipeName={mainRecipe.name}
          onAddRecipe={handleAddToPlanning}
          filters={{
            diet: dietFilter,
            season: seasonFilter,
          }}
          maxSuggestions={10}
        />
      )}
    </div>
  );
}

/**
 * Exemple 3 : Intégration minimale
 */
export function MinimalPairingExample() {
  return (
    <PairingSuggestions
      mainRecipeId={278}
      mainRecipeName="One pot pasta tomate, basilic, mozzarella"
      onAddRecipe={async (recipe) => {
        alert(`${recipe.name} ajouté au planning !`);
      }}
    />
  );
}

/**
 * Exemple 4 : Avec gestion d'état avancée
 */
export function AdvancedPairingExample() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState('diner');
  const [mainRecipe, setMainRecipe] = useState({ id: 278, name: 'One pot pasta' });
  const [plannedMeals, setPlannedMeals] = useState({});

  async function handleAddToPlanning(recipe) {
    const key = `${selectedDate.toISOString().split('T')[0]}_${selectedMealType}_side`;
    
    setPlannedMeals(prev => ({
      ...prev,
      [key]: recipe
    }));

  }

  return (
    <div>
      <h2>Planifier un repas complet</h2>
      
      {/* Sélecteurs de date et type de repas */}
      <div>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
        <select
          value={selectedMealType}
          onChange={(e) => setSelectedMealType(e.target.value)}
        >
          <option value="petit-dejeuner">Petit-déjeuner</option>
          <option value="dejeuner">Déjeuner</option>
          <option value="diner">Dîner</option>
        </select>
      </div>

      {/* Plat principal */}
      <div>
        <h3>Plat principal</h3>
        <p>{mainRecipe.name}</p>
      </div>

      {/* Suggestions */}
      <PairingSuggestions
        mainRecipeId={mainRecipe.id}
        mainRecipeName={mainRecipe.name}
        onAddRecipe={handleAddToPlanning}
        maxSuggestions={5}
      />

      {/* Résumé du repas planifié */}
      <div>
        <h3>Repas planifié</h3>
        <p>Date: {selectedDate.toLocaleDateString('fr-FR')}</p>
        <p>Type: {selectedMealType}</p>
        <p>Principal: {mainRecipe.name}</p>
        {plannedMeals[`${selectedDate.toISOString().split('T')[0]}_${selectedMealType}_side`] && (
          <p>
            Accompagnement: {plannedMeals[`${selectedDate.toISOString().split('T')[0]}_${selectedMealType}_side`].name}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Exemple 5 : Version compacte (pour sidebar ou modal)
 */
export function CompactPairingExample({ recipeId, recipeName }) {
  return (
    <div style={{ maxWidth: '400px' }}>
      <PairingSuggestions
        mainRecipeId={recipeId}
        mainRecipeName={recipeName}
        onAddRecipe={async (recipe) => {
        }}
        maxSuggestions={3}
      />
    </div>
  );
}
