# 📅 Guide d'Intégration - Planning avec Suggestions Intelligentes

**Date** : 27 octobre 2025  
**Objectif** : Intégrer les suggestions d'accompagnements dans la page de planning  
**Statut** : ✅ Prêt pour implémentation

---

## 🎯 Objectif Final

Permettre aux utilisateurs de :
1. ✅ Planifier un plat principal dans leur calendrier de repas
2. 🤖 **Recevoir automatiquement des suggestions d'accompagnements**
3. ➕ Ajouter un accompagnement suggéré au même repas en 1 clic
4. 🎨 Visualiser l'harmonie du repas (score gastronomique)

---

## 📐 Architecture de l'Intégration

### Flux Utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│  1. Utilisateur sélectionne un plat dans le calendrier      │
│     Exemple: "One pot pasta" pour le dîner de mardi         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Détection automatique si c'est un PLAT_PRINCIPAL        │
│     → Oui = Afficher suggestions d'accompagnements          │
│     → Non = Masquer suggestions                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Appel API /api/recipes/suggestions                      │
│     POST { mainRecipeId: 278 }                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Affichage des 5 meilleures suggestions                  │
│     - Salade verte (Score: 85%)                             │
│     - Pain à l'ail (Score: 70%)                             │
│     - Parmesan râpé (Score: 65%)                            │
│     - ...                                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Utilisateur clique "Ajouter au planning"                │
│     → Sauvegarde dans Supabase (meal_plan)                  │
│     → Mise à jour visuelle du calendrier                    │
│     → Affichage du repas complet                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Modifications de la Page Planning

### État à Ajouter

```javascript
// app/planning/page.js

const [selectedMainDish, setSelectedMainDish] = useState(null);
// Structure: { id, name, date, mealType }

const [showSuggestions, setShowSuggestions] = useState(false);
```

### Détection du Plat Principal

```javascript
// Fonction appelée quand l'utilisateur clique sur un repas dans le calendrier
async function handleMealClick(date, mealType, recipeId) {
  // Charger la recette depuis Supabase
  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, name, role')
    .eq('id', recipeId)
    .single();

  // Si c'est un plat principal, activer les suggestions
  if (recipe.role === 'PLAT_PRINCIPAL') {
    setSelectedMainDish({
      id: recipe.id,
      name: recipe.name,
      date: date,
      mealType: mealType
    });
    setShowSuggestions(true);
  } else {
    // Si c'est déjà un accompagnement, ne pas afficher de suggestions
    setShowSuggestions(false);
  }
}
```

---

## 🎨 Interface Visuelle

### Wireframe de l'Intégration

```
┌─────────────────────────────────────────────────────────────┐
│                  📅 Planning des Repas                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [< Semaine précédente]  25-31 Oct 2025  [Semaine suivante >]│
│                                                              │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬───┐ │
│  │   Lun  │  Mar   │  Mer   │  Jeu   │  Ven   │  Sam   │Dim│ │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼───┤ │
│  │🌅 Ptit │        │        │        │        │        │   │ │
│  │Déj     │        │        │        │        │        │   │ │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼───┤ │
│  │☀️ Déj  │        │        │        │        │        │   │ │
│  │        │        │        │        │        │        │   │ │
│  ├────────┼────────┼────────┼────────┼────────┼────────┼───┤ │
│  │🌙 Dîner│ [278]  │        │        │        │        │   │ │
│  │        │One pot │        │        │        │        │   │ │
│  │        │pasta ⭐│        │        │        │        │   │ │
│  │        │ (SÉLEC)│        │        │        │        │   │ │
│  └────────┴────────┴────────┴────────┴────────┴────────┴───┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  🤖 Suggestions d'Accompagnements pour "One pot pasta"      │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🥗 Salade verte                    [Score: 85% 🟢] │    │
│  │ Raisons: 🧬 Arômes partagés • ⚖️ Équilibre parfait │    │
│  │ [+ Ajouter au planning]    [Voir la recette →]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🥖 Pain à l'ail                    [Score: 70% 🟠] │    │
│  │ Raisons: 🌍 Cuisine italienne • 🍂 Saison Automne  │    │
│  │ [+ Ajouter au planning]    [Voir la recette →]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🧀 Parmesan râpé                   [Score: 65% 🟡] │    │
│  │ Raisons: 🎭 Contraste de textures • 🧬 Arômes      │    │
│  │ [+ Ajouter au planning]    [Voir la recette →]     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 💻 Code d'Intégration Complet

### Version Simplifiée (Recommandée)

```jsx
'use client';

import { useState, useEffect } from 'react';
import PairingSuggestions from '@/components/PairingSuggestions';
import { supabase } from '@/lib/supabaseClient';

export default function PlanningPage() {
  const [user, setUser] = useState(null);
  const [planning, setPlanning] = useState({});
  const [selectedMainDish, setSelectedMainDish] = useState(null);

  // Charger le planning depuis Supabase
  async function loadPlanning() {
    const { data, error } = await supabase
      .from('meal_plan')
      .select(`
        id,
        date,
        meal_type,
        is_main,
        recipes (
          id,
          name,
          role,
          party_size
        )
      `)
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error) {
      // Organiser les données par date et meal_type
      const organized = {};
      data.forEach(meal => {
        const key = `${meal.date}_${meal.meal_type}`;
        if (!organized[key]) organized[key] = [];
        organized[key].push(meal);
      });
      setPlanning(organized);
    }
  }

  // Quand l'utilisateur clique sur un repas
  async function handleSelectMeal(date, mealType, recipeId) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id, name, role')
      .eq('id', recipeId)
      .single();

    if (recipe && recipe.role === 'PLAT_PRINCIPAL') {
      setSelectedMainDish({
        id: recipe.id,
        name: recipe.name,
        date: date,
        mealType: mealType
      });
    } else {
      setSelectedMainDish(null);
    }
  }

  // Ajouter un accompagnement au planning
  async function handleAddSideDish(sideRecipe) {
    try {
      const { error } = await supabase
        .from('meal_plan')
        .insert({
          user_id: user.id,
          date: selectedMainDish.date,
          meal_type: selectedMainDish.mealType,
          recipe_id: sideRecipe.id,
          is_main: false,
          main_recipe_id: selectedMainDish.id
        });

      if (error) throw error;

      alert(`✅ ${sideRecipe.name} ajouté au planning !`);
      
      // Recharger le planning
      await loadPlanning();
      
      // Optionnel : Fermer les suggestions
      // setSelectedMainDish(null);
    } catch (error) {
      console.error('Erreur ajout accompagnement:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  }

  return (
    <div className="planning-page">
      {/* Grille de planning */}
      <div className="planning-grid">
        {/* ... Votre grille existante ... */}
        
        {/* Exemple de cellule cliquable */}
        {Object.entries(planning).map(([key, meals]) => (
          <div
            key={key}
            className={`meal-cell ${
              selectedMainDish && 
              key === `${selectedMainDish.date}_${selectedMainDish.mealType}` 
                ? 'selected' 
                : ''
            }`}
            onClick={() => {
              const mainMeal = meals.find(m => m.is_main);
              if (mainMeal) {
                handleSelectMeal(
                  meals[0].date,
                  meals[0].meal_type,
                  mainMeal.recipes.id
                );
              }
            }}
          >
            {meals.map(meal => (
              <div key={meal.id} className="meal-item">
                {meal.is_main && '⭐'} {meal.recipes.name}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Suggestions d'accompagnements */}
      {selectedMainDish && (
        <div className="suggestions-section">
          <PairingSuggestions
            mainRecipeId={selectedMainDish.id}
            mainRecipeName={selectedMainDish.name}
            onAddRecipe={handleAddSideDish}
            filters={{
              diet: user?.diet_preference,
              season: getCurrentSeason()
            }}
            maxSuggestions={5}
          />
        </div>
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

### CSS pour l'Intégration

```css
/* app/planning/page.css (ou globals.css) */

.planning-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.planning-grid {
  /* Votre grille existante */
}

.meal-cell {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-cell:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.meal-cell.selected {
  border: 2px solid #059669;
  background: rgba(5, 150, 105, 0.1);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.meal-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.suggestions-section {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* Animation d'apparition */
.suggestions-section {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🗄️ Schéma de Base de Données

### Table `meal_plan` (Supabase)

```sql
CREATE TABLE meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'diner', 'collation')),
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  is_main BOOLEAN NOT NULL DEFAULT false,
  main_recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date, meal_type, recipe_id)
);

-- Index pour performance
CREATE INDEX idx_meal_plan_user_date ON meal_plan(user_id, date);
CREATE INDEX idx_meal_plan_recipe ON meal_plan(recipe_id);
CREATE INDEX idx_meal_plan_main ON meal_plan(main_recipe_id);

-- Row Level Security
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own meal plan"
  ON meal_plan FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plan"
  ON meal_plan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan"
  ON meal_plan FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plan"
  ON meal_plan FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 📊 Exemple de Données

### Scénario : Planifier un Repas Complet

```javascript
// 1. L'utilisateur ajoute "One pot pasta" au dîner de mardi
await supabase.from('meal_plan').insert({
  user_id: 'uuid-123',
  date: '2025-10-28',
  meal_type: 'diner',
  recipe_id: 278,  // One pot pasta
  is_main: true,
  main_recipe_id: null
});

// 2. Les suggestions s'affichent automatiquement
// API retourne: Salade verte (85%), Pain à l'ail (70%), etc.

// 3. L'utilisateur clique "Ajouter" sur "Salade verte"
await supabase.from('meal_plan').insert({
  user_id: 'uuid-123',
  date: '2025-10-28',
  meal_type: 'diner',
  recipe_id: 261,  // Salade verte
  is_main: false,
  main_recipe_id: 278  // Lien vers le plat principal
});

// 4. Le repas est maintenant complet
// Affichage final:
// 🌙 Dîner - Mardi 28 Oct
//   ⭐ One pot pasta (PLAT_PRINCIPAL)
//   🥗 Salade verte (ACCOMPAGNEMENT)
```

---

## 🔍 Requêtes Utiles

### Charger le Planning d'une Semaine

```javascript
const startDate = '2025-10-27';
const endDate = '2025-11-02';

const { data: meals } = await supabase
  .from('meal_plan')
  .select(`
    id,
    date,
    meal_type,
    is_main,
    main_recipe_id,
    recipes (
      id,
      name,
      description,
      role,
      party_size,
      recipe_tags (
        tags (
          name,
          tag_type
        )
      )
    )
  `)
  .eq('user_id', userId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: true })
  .order('meal_type', { ascending: true });
```

### Vérifier si un Repas a déjà un Accompagnement

```javascript
async function hasExistingSideDishes(date, mealType, mainRecipeId) {
  const { data, count } = await supabase
    .from('meal_plan')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_type', mealType)
    .eq('is_main', false)
    .eq('main_recipe_id', mainRecipeId);

  return count > 0;
}
```

---

## 🎯 Points d'Attention

### 1. Gestion des Doublons

```javascript
// Avant d'ajouter un accompagnement, vérifier qu'il n'existe pas déjà
async function handleAddSideDish(sideRecipe) {
  // Vérifier existence
  const { data: existing } = await supabase
    .from('meal_plan')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', selectedMainDish.date)
    .eq('meal_type', selectedMainDish.mealType)
    .eq('recipe_id', sideRecipe.id)
    .single();

  if (existing) {
    alert('⚠️ Cet accompagnement est déjà dans le planning !');
    return;
  }

  // Continuer l'ajout...
}
```

### 2. Limite d'Accompagnements

```javascript
// Limiter à 3 accompagnements max par repas
const MAX_SIDE_DISHES = 3;

async function handleAddSideDish(sideRecipe) {
  const { count } = await supabase
    .from('meal_plan')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('date', selectedMainDish.date)
    .eq('meal_type', selectedMainDish.mealType)
    .eq('is_main', false);

  if (count >= MAX_SIDE_DISHES) {
    alert(`⚠️ Maximum ${MAX_SIDE_DISHES} accompagnements par repas atteint !`);
    return;
  }

  // Continuer l'ajout...
}
```

### 3. Gestion des Quantités

```javascript
// Adapter la quantité au nombre de personnes
async function handleAddSideDish(sideRecipe) {
  const plannedServings = 4;  // Nombre de personnes prévu

  await supabase.from('meal_plan').insert({
    user_id: user.id,
    date: selectedMainDish.date,
    meal_type: selectedMainDish.mealType,
    recipe_id: sideRecipe.id,
    is_main: false,
    main_recipe_id: selectedMainDish.id,
    party_size: plannedServings  // Ajouter cette colonne si nécessaire
  });
}
```

---

## 🚀 Améliorations Futures

### Phase 2 : Filtres Avancés

```jsx
<PairingSuggestions
  mainRecipeId={278}
  mainRecipeName="One pot pasta"
  onAddRecipe={handleAddSideDish}
  filters={{
    diet: user.diet_preference,
    season: getCurrentSeason(),
    // Nouveaux filtres
    maxPrepTime: 30,  // Max 30 minutes
    difficulty: 'easy',
    cuisine: 'Italienne',
    excludeAllergens: ['nuts', 'dairy']
  }}
/>
```

### Phase 3 : Score de Repas Complet

```javascript
// Calculer un score global pour le repas complet
async function calculateMealScore(date, mealType) {
  const meals = planning[`${date}_${mealType}`];
  
  const mainDish = meals.find(m => m.is_main);
  const sideDishes = meals.filter(m => !m.is_main);
  
  // Calculer score nutritionnel, gastronomique, variété
  const score = {
    gastronomic: 0,  // Harmonie des saveurs
    nutritional: 0,  // Équilibre nutritionnel
    variety: 0,      // Diversité des ingrédients
    total: 0
  };
  
  // Logique de calcul...
  
  return score;
}
```

### Phase 4 : Suggestions Proactives

```javascript
// Suggérer automatiquement quand on ajoute un plat principal
useEffect(() => {
  if (selectedMainDish) {
    // Pré-charger les suggestions
    fetchSuggestions(selectedMainDish.id);
    
    // Afficher notification
    toast.info('💡 Voir les suggestions d\'accompagnements');
  }
}, [selectedMainDish]);
```

---

## ✅ Checklist d'Implémentation

- [ ] **Modifier app/planning/page.js**
  - [ ] Ajouter état `selectedMainDish`
  - [ ] Ajouter fonction `handleSelectMeal`
  - [ ] Ajouter fonction `handleAddSideDish`
  - [ ] Importer `PairingSuggestions`

- [ ] **Créer/Modifier table Supabase**
  - [ ] Créer table `meal_plan` avec colonnes requises
  - [ ] Ajouter RLS policies
  - [ ] Créer index pour performance

- [ ] **Tester l'Intégration**
  - [ ] Ajouter un plat principal au planning
  - [ ] Vérifier affichage des suggestions
  - [ ] Ajouter un accompagnement
  - [ ] Vérifier sauvegarde dans Supabase
  - [ ] Tester sur mobile

- [ ] **Optimisations**
  - [ ] Ajouter gestion des doublons
  - [ ] Limiter nombre d'accompagnements
  - [ ] Adapter quantités au nombre de personnes

- [ ] **Documentation**
  - [ ] Mettre à jour STATUS.md
  - [ ] Ajouter captures d'écran
  - [ ] Créer guide utilisateur

---

**Auteur** : GitHub Copilot AI  
**Date** : 27 octobre 2025  
**Statut** : ✅ Guide complet - Prêt pour implémentation  
**Prochaine étape** : Modifier `app/planning/page.js`
