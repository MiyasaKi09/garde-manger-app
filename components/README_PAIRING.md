# 🎨 Composants - PairingSuggestions

Ce dossier contient le composant React pour afficher les suggestions d'accompagnements intelligentes.

---

## 📦 Fichiers

### `PairingSuggestions.jsx` (383 lignes)
Composant React principal qui affiche les suggestions d'accompagnements.

**Props** :
- `mainRecipeId` (number, requis) - ID du plat principal
- `mainRecipeName` (string, optionnel) - Nom du plat pour affichage
- `onAddRecipe` (function, requis) - Callback quand on ajoute une recette
- `filters` (object, optionnel) - Filtres `{ diet, season }`
- `maxSuggestions` (number, optionnel, défaut: 5) - Nombre max de suggestions

**États** :
- `suggestions` - Liste des suggestions retournées par l'API
- `loading` - État de chargement
- `error` - Message d'erreur éventuel
- `addingRecipe` - ID de la recette en cours d'ajout
- `expandedReasons` - IDs des suggestions avec raisons dépliées

**Sous-composants** :
- `ScoreBadge` - Badge coloré avec le score
- `SuggestionCard` - Carte d'une suggestion
- `LoadingState` - État de chargement
- `ErrorState` - État d'erreur
- `EmptyState` - État vide (aucune suggestion)

### `PairingSuggestions.css` (456 lignes)
Styles pour le composant avec design glassmorphism.

**Classes principales** :
- `.pairing-suggestions-container` - Conteneur principal
- `.suggestion-card` - Carte d'une suggestion
- `.score-badge` - Badge de score coloré
- `.reasons-container` - Liste des raisons
- `.add-button` - Bouton d'ajout au planning

**Design** :
- Glassmorphism : `background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px)`
- Couleurs de score : Vert (≥70), Orange (≥50), Jaune (≥30), Gris (<30)
- Responsive : Breakpoint à 768px pour mobile

### `PairingSuggestions.examples.jsx` (241 lignes)
5 exemples d'intégration du composant :

1. **RecipeDetailWithPairing** - Dans une page de détail de recette
2. **PlanningPageWithPairing** - Dans la page de planning avec filtres
3. **MinimalPairingExample** - Utilisation minimale (6 lignes)
4. **AdvancedPairingExample** - Avec gestion d'état complète
5. **CompactPairingExample** - Version compacte pour sidebar

---

## 🚀 Utilisation Rapide

### Import

```jsx
import PairingSuggestions from '@/components/PairingSuggestions';
```

### Exemple Minimal

```jsx
<PairingSuggestions
  mainRecipeId={278}
  mainRecipeName="One pot pasta"
  onAddRecipe={(recipe) => console.log('Ajout:', recipe)}
/>
```

### Exemple avec Supabase

```jsx
import { supabase } from '@/lib/supabaseClient';

<PairingSuggestions
  mainRecipeId={selectedRecipe.id}
  mainRecipeName={selectedRecipe.name}
  onAddRecipe={async (recipe) => {
    const { error } = await supabase
      .from('meal_plan')
      .insert({
        user_id: user.id,
        date: selectedDate,
        meal_type: 'diner',
        recipe_id: recipe.id,
        is_main: false
      });
    
    if (!error) alert(`✅ ${recipe.name} ajouté !`);
  }}
  filters={{
    diet: user?.diet_preference,
    season: getCurrentSeason()
  }}
  maxSuggestions={5}
/>
```

---

## 📖 Documentation

- **[GUIDE_INTEGRATION_PAIRING.md](../GUIDE_INTEGRATION_PAIRING.md)** - Guide complet d'utilisation
- **[INTEGRATION_PLANNING_GUIDE.md](../INTEGRATION_PLANNING_GUIDE.md)** - Intégration dans le planning
- **[PairingSuggestions.examples.jsx](./PairingSuggestions.examples.jsx)** - 5 exemples de code

---

## 🎨 Design

Le composant utilise le design glassmorphism pour s'intégrer au thème du site :

- **Fond** : `rgba(255, 255, 255, 0.25)` avec `backdrop-filter: blur(10px)`
- **Couleur primaire** : `#059669` (vert)
- **Bordures** : `1px solid rgba(255, 255, 255, 0.2)`
- **Ombres** : `0 4px 6px -1px rgba(0, 0, 0, 0.1)`

### Score Badges

- 🟢 **Vert** (≥70%) : Excellent
- 🟠 **Orange** (≥50%) : Bon
- 🟡 **Jaune** (≥30%) : Correct
- ⚪ **Gris** (<30%) : Faible

### Icônes des Raisons

- 🧬 `food_pairing` - Arômes partagés
- ⚖️ `balance` - Équilibre
- 🎭 `contrast` - Contraste
- 🌍 `terroir` - Terroir
- 🍂 `season` - Saison

---

## 🔧 Personnalisation

### Modifier les Couleurs

Éditez `PairingSuggestions.jsx` fonction `getScoreColor()` :

```javascript
function getScoreColor(score) {
  if (score >= 70) return '#22c55e';  // Vert
  if (score >= 50) return '#f59e0b';  // Orange
  if (score >= 30) return '#fbbf24';  // Jaune
  return '#9ca3af';                   // Gris
}
```

### Ajouter des Filtres

```jsx
<PairingSuggestions
  mainRecipeId={278}
  onAddRecipe={...}
  filters={{
    diet: "Végétarien",
    season: "Été",
    // Nouveaux filtres possibles (à implémenter dans l'API)
    maxPrepTime: 30,
    difficulty: "easy",
    cuisine: "Italienne"
  }}
/>
```

---

## 📊 Structure des Données

### Objet Suggestion Retourné

```javascript
{
  recipe: {
    id: 261,
    name: "Salade verte",
    description: "Salade fraîche de saison",
    role: "ACCOMPAGNEMENT",
    party_size: 4
  },
  score: 85,
  scorePercentage: 85,
  tags: ["Arôme-Herbes", "Saison-Été", ...],
  reasons: [
    {
      type: "food_pairing",
      description: "Arômes partagés : Arôme-Herbes",
      score: 20
    },
    {
      type: "balance",
      description: "Équilibre riche ↔ léger",
      score: 25
    }
  ],
  details: { ... }  // Détails des algorithmes
}
```

---

## 🧪 Tests

### Test Unitaire (Jest)

```javascript
import { render, screen } from '@testing-library/react';
import PairingSuggestions from './PairingSuggestions';

test('affiche les suggestions', async () => {
  render(
    <PairingSuggestions
      mainRecipeId={278}
      onAddRecipe={jest.fn()}
    />
  );
  
  await screen.findByText(/Suggestions d'accompagnements/i);
  // Assertions...
});
```

### Test d'Intégration

Créer une page de test `app/test-pairing/page.js` et tester manuellement.

---

## 🐛 Dépannage

### Aucune suggestion n'apparaît

1. Vérifier que l'API retourne des données :
   ```bash
   curl -X POST http://localhost:3000/api/recipes/suggestions \
     -H "Content-Type: application/json" \
     -d '{"mainRecipeId": 278}'
   ```

2. Vérifier la console navigateur pour erreurs

3. Tester sans filtres :
   ```jsx
   <PairingSuggestions
     mainRecipeId={278}
     onAddRecipe={...}
     filters={{}}  // Pas de filtres
   />
   ```

### Erreur CORS

Vérifier que l'API est sur le même domaine ou configurer CORS dans `next.config.js`.

### Styles ne s'appliquent pas

Vérifier que `PairingSuggestions.css` est bien importé dans `PairingSuggestions.jsx` :

```javascript
import './PairingSuggestions.css';
```

---

## 📝 Contribuer

Pour ajouter des fonctionnalités :

1. Modifier `PairingSuggestions.jsx`
2. Ajouter les styles correspondants dans `PairingSuggestions.css`
3. Créer un exemple dans `PairingSuggestions.examples.jsx`
4. Mettre à jour cette documentation

---

**Dernière mise à jour** : 27 octobre 2025  
**Version** : 1.0  
**Auteur** : GitHub Copilot AI
