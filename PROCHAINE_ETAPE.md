# 🎯 PROCHAINE ÉTAPE : Intégration dans le Planning

**Date** : 27 octobre 2025  
**Tâche** : Intégrer le composant `PairingSuggestions` dans `app/planning/page.js`  
**Difficulté** : ⭐⭐ Moyenne  
**Temps estimé** : 30-45 minutes

---

## ✅ Prérequis

Avant de commencer, vérifier que :

- [x] Backend API créé (`lib/pairingService.js` + `app/api/recipes/suggestions/route.js`)
- [x] Composant React créé (`components/PairingSuggestions.jsx`)
- [x] Styles créés (`components/PairingSuggestions.css`)
- [x] Documentation lue (`INTEGRATION_PLANNING_GUIDE.md`)

---

## 📋 Plan d'Action

### Étape 1 : Tester l'API (5 minutes)

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal, tester l'API
curl -X POST http://localhost:3000/api/recipes/suggestions \
  -H "Content-Type: application/json" \
  -d '{"mainRecipeId": 278, "maxSuggestions": 5}'

# Vous devriez voir un JSON avec des suggestions
```

**✅ Checkpoint** : L'API retourne bien des suggestions

---

### Étape 2 : Créer une Page de Test (10 minutes)

Créer `app/test-pairing/page.js` :

```jsx
'use client';

import PairingSuggestions from '@/components/PairingSuggestions';

export default function TestPairingPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🧪 Test - Suggestions d'Accompagnements</h1>
      <p>Test du composant PairingSuggestions</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Plat principal : One pot pasta</h2>
        
        <PairingSuggestions
          mainRecipeId={278}
          mainRecipeName="One pot pasta"
          onAddRecipe={(recipe) => {
            alert(`✅ Recette ajoutée: ${recipe.name}`);
            console.log('Détails:', recipe);
          }}
          maxSuggestions={5}
        />
      </div>
    </div>
  );
}
```

Ouvrir http://localhost:3000/test-pairing

**✅ Checkpoint** : Le composant s'affiche et montre des suggestions

---

### Étape 3 : Créer la Table `meal_plan` dans Supabase (5 minutes)

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans "SQL Editor"
4. Exécuter :

```sql
-- Créer la table meal_plan
CREATE TABLE IF NOT EXISTS meal_plan (
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
CREATE INDEX IF NOT EXISTS idx_meal_plan_user_date ON meal_plan(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipe ON meal_plan(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_main ON meal_plan(main_recipe_id);

-- Row Level Security
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;

-- Policies
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

**✅ Checkpoint** : Table créée sans erreur

---

### Étape 4 : Modifier `app/planning/page.js` (20 minutes)

Ouvrir `app/planning/page.js` et effectuer les modifications suivantes :

#### 4.1 Import du Composant

```jsx
// En haut du fichier, ajouter :
import PairingSuggestions from '@/components/PairingSuggestions';
```

#### 4.2 Ajouter les États

```jsx
// Dans le composant, après les autres useState :
const [selectedMainDish, setSelectedMainDish] = useState(null);
// Structure: { id, name, date, mealType }
```

#### 4.3 Fonction de Sélection d'un Repas

```jsx
// Fonction appelée quand l'utilisateur clique sur un repas
async function handleSelectMeal(date, mealType, recipe) {
  if (recipe.role === 'PLAT_PRINCIPAL') {
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
```

#### 4.4 Fonction d'Ajout d'Accompagnement

```jsx
// Fonction pour ajouter un accompagnement au planning
async function handleAddSideDish(sideRecipe) {
  if (!user || !selectedMainDish) return;

  try {
    // Vérifier si déjà ajouté
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

    // Ajouter au planning
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
    // await loadPlanning();
  } catch (error) {
    console.error('Erreur ajout accompagnement:', error);
    alert(`❌ Erreur: ${error.message}`);
  }
}
```

#### 4.5 Afficher le Composant

```jsx
// À la fin du JSX, avant la fermeture de la div principale :
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

// Ajouter cette fonction helper si elle n'existe pas :
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
}
```

#### 4.6 Ajouter les Styles CSS

```css
/* À la fin du fichier CSS du planning */

.suggestions-section {
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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

**✅ Checkpoint** : Code modifié sans erreur de syntaxe

---

### Étape 5 : Tester l'Intégration (10 minutes)

1. Rafraîchir la page de planning
2. Ajouter un plat principal (rôle = PLAT_PRINCIPAL) à un repas
3. Cliquer sur ce repas pour le sélectionner
4. Vérifier que les suggestions apparaissent en dessous
5. Cliquer sur "Ajouter au planning" sur une suggestion
6. Vérifier que l'accompagnement est ajouté

**✅ Checkpoint** : L'intégration fonctionne de bout en bout

---

## 🐛 Dépannage

### Problème : Aucune suggestion ne s'affiche

**Solutions** :
1. Vérifier la console navigateur (F12)
2. Vérifier que le plat sélectionné a bien `role = 'PLAT_PRINCIPAL'`
3. Tester l'API directement avec curl (voir Étape 1)
4. Vérifier que les recettes ont des tags dans la base

### Problème : Erreur Supabase lors de l'ajout

**Solutions** :
1. Vérifier que la table `meal_plan` existe
2. Vérifier les RLS policies
3. Vérifier que `user.id` est défini (utilisateur connecté)
4. Regarder les logs Supabase

### Problème : Le composant ne s'affiche pas

**Solutions** :
1. Vérifier l'import : `import PairingSuggestions from '@/components/PairingSuggestions';`
2. Vérifier que le fichier CSS est importé dans le composant
3. Vérifier la console pour erreurs React

---

## 📚 Documentation de Référence

- **Guide complet** : `INTEGRATION_PLANNING_GUIDE.md`
- **Exemples de code** : `components/PairingSuggestions.examples.jsx`
- **Documentation API** : `API_PAIRING_README.md`
- **Dépannage** : `GUIDE_INTEGRATION_PAIRING.md` section "Dépannage"

---

## ✅ Validation Finale

Une fois l'intégration terminée, vérifier :

- [ ] API testée et fonctionnelle
- [ ] Composant testé isolément
- [ ] Table `meal_plan` créée dans Supabase
- [ ] `app/planning/page.js` modifié
- [ ] Suggestions s'affichent quand plat principal sélectionné
- [ ] Ajout d'accompagnement fonctionne
- [ ] Données sauvegardées dans Supabase
- [ ] Aucune erreur console
- [ ] Design cohérent avec le reste du site
- [ ] Responsive mobile testé

---

## 🎉 Félicitations !

Une fois toutes les étapes validées, vous avez réussi l'intégration complète du système de suggestions intelligentes dans votre application de planning de repas !

**Prochaines améliorations possibles** :
- Ajouter un badge "Myko Score" pour le repas complet
- Permettre de retirer un accompagnement
- Afficher les accompagnements déjà ajoutés
- Ajouter des filtres personnalisés
- Créer des suggestions pour tous les types de repas

---

**Créé par** : GitHub Copilot AI  
**Date** : 27 octobre 2025, 23:30 UTC  
**Bonne chance pour l'intégration ! 🚀**
