# 🎨 Guide d'Intégration - Composant PairingSuggestions

**Date** : 27 octobre 2025  
**Composant** : `PairingSuggestions.jsx`  
**Statut** : ✅ Prêt pour intégration

---

## 📋 Vue d'Ensemble

Le composant `PairingSuggestions` affiche des suggestions d'accompagnements intelligentes basées sur 4 algorithmes gastronomiques. Il est conçu pour être intégré dans :

- 📅 **Page de planning** - Suggérer accompagnements lors de la planification des repas
- 🍽️ **Page de détail de recette** - Suggérer accompagnements pour un plat
- 🛒 **Liste de courses** - Compléter un repas avec accompagnements harmonieux

---

## 🚀 Installation & Import

### 1. Fichiers créés

```
components/
├── PairingSuggestions.jsx        # Composant principal
├── PairingSuggestions.css        # Styles (glassmorphism)
└── PairingSuggestions.examples.jsx  # Exemples d'utilisation
```

### 2. Import dans votre page

```javascript
import PairingSuggestions from '@/components/PairingSuggestions';
```

---

## 📖 Utilisation de Base

### Exemple Minimal

```jsx
<PairingSuggestions
  mainRecipeId={278}
  mainRecipeName="One pot pasta"
  onAddRecipe={async (recipe) => {
    console.log('Recette ajoutée:', recipe);
    alert(`${recipe.name} ajouté !`);
  }}
/>
```

---

## 🎛️ Props du Composant

| Prop | Type | Requis | Défaut | Description |
|------|------|--------|--------|-------------|
| `mainRecipeId` | `number` | ✅ Oui | - | ID du plat principal |
| `mainRecipeName` | `string` | ❌ Non | - | Nom du plat (pour affichage) |
| `onAddRecipe` | `function` | ✅ Oui | - | Callback quand on ajoute une recette |
| `filters` | `object` | ❌ Non | `{}` | Filtres (diet, season) |
| `maxSuggestions` | `number` | ❌ Non | `5` | Nombre max de suggestions |

### Props `filters`

```javascript
filters={{
  diet: "Végétarien",  // "Végétarien", "Vegan", "Sans Gluten", "Sans Lactose"
  season: "Été"        // "Printemps", "Été", "Automne", "Hiver"
}}
```

### Callback `onAddRecipe`

```javascript
async function onAddRecipe(recipe) {
  // recipe = {
  //   id: number,
  //   name: string,
  //   description: string,
  //   role: "ACCOMPAGNEMENT",
  //   party_size: number
  // }
  
  // Exemple : Ajouter au planning
  await supabase
    .from('meal_plan')
    .insert({
      user_id: userId,
      date: selectedDate,
      meal_type: 'diner',
      recipe_id: recipe.id,
      is_main: false
    });
}
```

---

## 💡 Exemples d'Intégration

### Exemple 1 : Intégration dans le Planning

```jsx
'use client';

import { useState } from 'react';
import PairingSuggestions from '@/components/PairingSuggestions';
import { supabase } from '@/lib/supabaseClient';

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState('diner');
  const [mainRecipe, setMainRecipe] = useState(null);
  const [user, setUser] = useState(null);

  // Fonction appelée quand on ajoute un accompagnement
  async function handleAddSideDish(sideRecipe) {
    try {
      const { error } = await supabase
        .from('meal_plan')
        .insert({
          user_id: user.id,
          date: selectedDate.toISOString().split('T')[0],
          meal_type: selectedMealType,
          recipe_id: sideRecipe.id,
          is_main: false,  // C'est un accompagnement
          main_recipe_id: mainRecipe.id  // Lien vers le plat principal
        });

      if (error) throw error;

      alert(`✅ ${sideRecipe.name} ajouté au planning !`);
      
      // Recharger le planning
      // await loadPlanning();
    } catch (error) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  }

  return (
    <div>
      {/* ... Grille de planning ... */}

      {/* Afficher suggestions quand un plat principal est sélectionné */}
      {mainRecipe && mainRecipe.role === 'PLAT_PRINCIPAL' && (
        <PairingSuggestions
          mainRecipeId={mainRecipe.id}
          mainRecipeName={mainRecipe.name}
          onAddRecipe={handleAddSideDish}
          filters={{
            // Filtrer selon préférences utilisateur
            diet: user?.diet_preference,
            // Filtrer selon saison actuelle
            season: getCurrentSeason()
          }}
          maxSuggestions={5}
        />
      )}
    </div>
  );
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}
```

---

### Exemple 2 : Intégration dans une Page de Recette

```jsx
'use client';

import { useState, useEffect } from 'react';
import PairingSuggestions from '@/components/PairingSuggestions';
import { useParams } from 'next/navigation';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [selectedSideDishes, setSelectedSideDishes] = useState([]);

  async function handleAddSideDish(sideRecipe) {
    // Ajouter à la liste locale
    setSelectedSideDishes(prev => [...prev, sideRecipe]);
    
    // Optionnel : Sauvegarder dans favoris ou planning
    console.log('Accompagnement sélectionné:', sideRecipe);
  }

  return (
    <div>
      {/* Détails de la recette */}
      <div className="recipe-detail">
        <h1>{recipe?.name}</h1>
        {/* ... */}
      </div>

      {/* Suggestions d'accompagnements (si plat principal) */}
      {recipe?.role === 'PLAT_PRINCIPAL' && (
        <PairingSuggestions
          mainRecipeId={parseInt(id)}
          mainRecipeName={recipe.name}
          onAddRecipe={handleAddSideDish}
          maxSuggestions={5}
        />
      )}

      {/* Afficher accompagnements sélectionnés */}
      {selectedSideDishes.length > 0 && (
        <div className="selected-sides">
          <h3>🍽️ Accompagnements sélectionnés</h3>
          <ul>
            {selectedSideDishes.map((side, index) => (
              <li key={index}>
                <a href={`/recipes/${side.id}`}>{side.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### Exemple 3 : Avec Filtres Dynamiques

```jsx
'use client';

import { useState } from 'react';
import PairingSuggestions from '@/components/PairingSuggestions';

export default function PlanningWithFilters() {
  const [mainRecipe, setMainRecipe] = useState({ id: 278, name: 'One pot pasta' });
  const [dietFilter, setDietFilter] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState(null);

  return (
    <div>
      {/* Filtres */}
      <div className="filters">
        <label>
          Régime :
          <select onChange={(e) => setDietFilter(e.target.value || null)}>
            <option value="">Tous</option>
            <option value="Végétarien">Végétarien</option>
            <option value="Vegan">Vegan</option>
            <option value="Sans Gluten">Sans Gluten</option>
            <option value="Sans Lactose">Sans Lactose</option>
          </select>
        </label>

        <label>
          Saison :
          <select onChange={(e) => setSeasonFilter(e.target.value || null)}>
            <option value="">Toutes</option>
            <option value="Printemps">Printemps</option>
            <option value="Été">Été</option>
            <option value="Automne">Automne</option>
            <option value="Hiver">Hiver</option>
          </select>
        </label>
      </div>

      {/* Suggestions avec filtres */}
      <PairingSuggestions
        mainRecipeId={mainRecipe.id}
        mainRecipeName={mainRecipe.name}
        onAddRecipe={async (recipe) => {
          console.log('Ajout:', recipe);
        }}
        filters={{
          diet: dietFilter,
          season: seasonFilter
        }}
        maxSuggestions={10}
      />
    </div>
  );
}
```

---

## 🎨 Personnalisation des Styles

### Modifier les Couleurs

```css
/* Dans votre fichier CSS global ou module */

/* Changer la couleur des badges de score "Excellent" */
.score-badge {
  /* Modifier getScoreColor() dans PairingSuggestions.jsx */
}

/* Personnaliser les cartes de suggestion */
.suggestion-card {
  background: rgba(255, 255, 255, 0.6);
  /* Ajoutez vos styles */
}

/* Bouton d'ajout */
.add-button {
  background: #059669;
  /* Personnalisez */
}
```

### Variables CSS (Optionnel)

```css
:root {
  --pairing-primary: #059669;
  --pairing-bg: rgba(255, 255, 255, 0.25);
  --pairing-border: rgba(255, 255, 255, 0.2);
  --pairing-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## 📊 Données Retournées

### Structure d'une Suggestion

```javascript
{
  recipe: {
    id: 261,
    name: "Pâtes à la sauce tomate et basilic frais",
    description: "Pâtes fraîches avec sauce tomate maison",
    role: "ACCOMPAGNEMENT",
    party_size: 4
  },
  score: 50,
  scorePercentage: 50,
  tags: ["Arôme-Épicé Frais", "Été", "Italienne", "Saveur-Acide", ...],
  reasons: [
    {
      type: "food_pairing",
      description: "Arômes partagés : Arôme-Épicé Frais",
      score: 10
    },
    {
      type: "terroir",
      description: "Cuisine commune : Italienne",
      score: 15
    },
    {
      type: "season",
      description: "Saison : Été",
      score: 10
    },
    {
      type: "contrast",
      description: "Contraste de textures : Texture-Croquant ↔ Texture-Crémeux",
      score: 15
    }
  ],
  details: {
    foodPairing: { score: 10, sharedAromatics: ["Arôme-Épicé Frais"] },
    balance: { score: 0, balanced: false, reason: null },
    contrast: { score: 15, contrasts: ["Texture-Croquant ↔ Texture-Crémeux"] },
    terroir: { score: 15, sharedCuisines: ["Italienne"] },
    season: { score: 10, season: "Été" }
  }
}
```

---

## 🔧 Gestion d'État Avancée

### Avec Context API

```jsx
// PlanningContext.jsx
import { createContext, useContext, useState } from 'react';

const PlanningContext = createContext();

export function PlanningProvider({ children }) {
  const [plannedMeals, setPlannedMeals] = useState({});

  async function addSideDishToPlanning(date, mealType, sideRecipe, mainRecipeId) {
    // Logique d'ajout
    setPlannedMeals(prev => ({
      ...prev,
      [`${date}_${mealType}_side`]: sideRecipe
    }));
  }

  return (
    <PlanningContext.Provider value={{ plannedMeals, addSideDishToPlanning }}>
      {children}
    </PlanningContext.Provider>
  );
}

export const usePlanning = () => useContext(PlanningContext);

// Utilisation dans le composant
import { usePlanning } from '@/context/PlanningContext';

function MyComponent() {
  const { addSideDishToPlanning } = usePlanning();

  return (
    <PairingSuggestions
      mainRecipeId={278}
      onAddRecipe={(recipe) => addSideDishToPlanning(new Date(), 'diner', recipe, 278)}
    />
  );
}
```

---

## 🧪 Tests

### Test Unitaire (Jest + React Testing Library)

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PairingSuggestions from '@/components/PairingSuggestions';

// Mock fetch
global.fetch = jest.fn();

describe('PairingSuggestions', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('affiche les suggestions après chargement', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            recipe: { id: 261, name: 'Pâtes tomate' },
            score: 50,
            scorePercentage: 50,
            reasons: [
              { type: 'terroir', description: 'Italienne', score: 15 }
            ]
          }
        ]
      })
    });

    render(
      <PairingSuggestions
        mainRecipeId={278}
        mainRecipeName="One pot pasta"
        onAddRecipe={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pâtes tomate')).toBeInTheDocument();
    });
  });

  test('appelle onAddRecipe quand on clique sur Ajouter', async () => {
    const mockAdd = jest.fn();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [{
          recipe: { id: 261, name: 'Pâtes tomate' },
          score: 50,
          scorePercentage: 50,
          reasons: []
        }]
      })
    });

    render(
      <PairingSuggestions
        mainRecipeId={278}
        onAddRecipe={mockAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pâtes tomate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Ajouter au planning'));

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ id: 261, name: 'Pâtes tomate' })
    );
  });
});
```

---

## 🚨 Dépannage

### Problème : Aucune suggestion n'apparaît

**Causes possibles** :
1. Le plat principal n'a pas de tags dans la base de données
2. Aucun accompagnement compatible dans la base
3. Les filtres sont trop restrictifs

**Solutions** :
```javascript
// Vérifier dans la console navigateur
console.log('mainRecipeId:', mainRecipeId);

// Tester sans filtres
<PairingSuggestions
  mainRecipeId={278}
  onAddRecipe={...}
  filters={{}}  // Pas de filtres
  maxSuggestions={10}  // Plus de suggestions
/>
```

---

### Problème : Erreur CORS

**Solution** : Vérifier que l'API est sur le même domaine ou configurer CORS

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

---

### Problème : Temps de chargement long

**Solution** : Ajouter un indicateur de chargement plus visible

```jsx
// Le composant gère déjà le loading, mais vous pouvez personnaliser :
{loading && (
  <div className="custom-loading">
    <YourCustomSpinner />
    <p>Recherche des meilleurs accompagnements...</p>
  </div>
)}
```

---

## 📈 Performance

### Optimisations

```javascript
// 1. Mémoisation du composant
import { memo } from 'react';

export default memo(PairingSuggestions, (prevProps, nextProps) => {
  return (
    prevProps.mainRecipeId === nextProps.mainRecipeId &&
    prevProps.filters === nextProps.filters
  );
});

// 2. Debounce des changements de filtres
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedFetch = useCallback(
  debounce(() => fetchSuggestions(), 300),
  []
);
```

---

## 📚 Ressources Complémentaires

- **[API_PAIRING_README.md](../API_PAIRING_README.md)** - Documentation de l'API
- **[REQUETES_PAIRING_TEST.md](../REQUETES_PAIRING_TEST.md)** - Tests de l'API
- **[ASSEMBLAGE_INTELLIGENT.md](../ASSEMBLAGE_INTELLIGENT.md)** - Spécifications théoriques
- **[PairingSuggestions.examples.jsx](./PairingSuggestions.examples.jsx)** - Exemples de code

---

## ✅ Checklist d'Intégration

- [ ] Importer le composant `PairingSuggestions`
- [ ] Importer le CSS `PairingSuggestions.css`
- [ ] Définir le callback `onAddRecipe`
- [ ] Tester avec un ID de recette valide
- [ ] Vérifier les permissions Supabase
- [ ] Tester les filtres (diet, season)
- [ ] Tester sur mobile (responsive)
- [ ] Ajouter gestion d'erreurs personnalisée si nécessaire

---

**Auteur** : GitHub Copilot AI  
**Date** : 27 octobre 2025  
**Statut** : ✅ Documentation complète - Prêt pour intégration
