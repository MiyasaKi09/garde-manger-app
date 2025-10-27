# 🔄 Spécifications : Système Complet de Gestion des Restes

**Date** : 27 octobre 2025  
**Version** : 2.0 - Système Ultra-Complet  
**Auteur** : GitHub Copilot AI

---

## 🎯 Vision Utilisateur

### Scénario Cible

**Matin** :
1. J'ouvre une bouteille de lait (1L)
2. J'utilise 250ml pour mon café
3. ✅ Le système note : "Lait ouvert, DLC ajustée à J+3 au lieu de J+10"

**Midi** :
1. Je cuisine des lasagnes (recette 4 portions)
2. Le système déduit les ingrédients de mon inventaire
3. On mange 2 portions
4. ✅ Le système crée : "Lasagnes maison (2 portions restantes, expire dans 3 jours)"

**Soir** :
1. Je consulte mon planning de demain
2. ✅ Le système suggère : "Finir les lasagnes (expirent demain)" au lieu de proposer une nouvelle recette
3. ✅ Il priorise aussi les recettes utilisant le lait ouvert

**Résultat** : Zéro gaspillage, planning optimisé, toujours au courant de ce qui risque de périmer.

---

## 📊 État Actuel vs. Vision

### ✅ Ce qui existe

| Fonctionnalité | État | Fichier |
|----------------|------|---------|
| Inventaire lots bruts | ✅ Complet | `inventory_lots` table |
| Consommation partielle | ✅ Bouton | `PantryProductCard.jsx` |
| Champ `opened_at` | ✅ Existe | DB column |
| Scoring urgence | ✅ +15pts si ouvert | `wastePreventionService.js` |
| Actions anti-gaspillage | ✅ 5 actions | `RestesManager.jsx` |
| Suggestions recettes | ✅ Basique | `wastePreventionService.js` |

### ❌ Ce qui manque

| Fonctionnalité | Impact | Priorité |
|----------------|--------|----------|
| **DLC ajustée après ouverture** | ⚠️ Critique | P0 |
| **Plats cuisinés trackés** | ⚠️ Critique | P0 |
| **Portions gérées** | ⚠️ Critique | P0 |
| **Déduction auto ingrédients** | 🔥 Haute | P1 |
| **Planning avec restes** | 🔥 Haute | P1 |
| **Historique consommation** | 📊 Moyenne | P2 |

---

## 🏗️ Architecture : 3 Phases

### Phase 1 : DLC Après Ouverture ⏱️ ~2h

**Objectif** : Gérer intelligemment la péremption après ouverture d'un produit.

#### 1.1 Modifications Base de Données

```sql
-- Migration 001: Ajout colonnes pour DLC ajustée
ALTER TABLE inventory_lots
ADD COLUMN IF NOT EXISTS adjusted_expiration_date DATE,
ADD COLUMN IF NOT EXISTS is_opened BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_inventory_lots_adjusted_exp 
ON inventory_lots(adjusted_expiration_date) 
WHERE adjusted_expiration_date IS NOT NULL;

COMMENT ON COLUMN inventory_lots.adjusted_expiration_date IS 
'Date de péremption recalculée après ouverture du produit';
COMMENT ON COLUMN inventory_lots.is_opened IS 
'Indique si le produit a été ouvert (bouteille, paquet, etc.)';
COMMENT ON COLUMN inventory_lots.opened_at IS 
'Timestamp précis de l''ouverture du produit';
```

#### 1.2 Règles Métier : Durée de Conservation Après Ouverture

```javascript
// lib/shelfLifeRules.js
export const SHELF_LIFE_AFTER_OPENING = {
  // Catégorie → { storage_method → jours }
  'Laitier': {
    fridge: 3,
    freezer: 30,
    pantry: 1  // Non recommandé
  },
  'Lait': {
    fridge: 3,
    freezer: 90,
    pantry: 1
  },
  'Yaourt': {
    fridge: 5,
    freezer: 60,
    pantry: 1
  },
  'Fromage': {
    fridge: 7,
    freezer: 90,
    pantry: 2
  },
  'Charcuterie': {
    fridge: 4,
    freezer: 60,
    pantry: 1
  },
  'Jambon': {
    fridge: 3,
    freezer: 60,
    pantry: 1
  },
  'Saucisson': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  },
  'Confiture': {
    fridge: 30,
    freezer: 180,
    pantry: 14
  },
  'Jus de fruits': {
    fridge: 5,
    freezer: 90,
    pantry: 2
  },
  'Sauce': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  },
  'Huile': {
    fridge: 90,
    freezer: 365,
    pantry: 60
  },
  'Vinaigre': {
    fridge: 180,
    freezer: 365,
    pantry: 90
  },
  'Condiments': {
    fridge: 14,
    freezer: 90,
    pantry: 7
  },
  'Pain': {
    fridge: 3,
    freezer: 30,
    pantry: 2
  },
  'Pâtisserie': {
    fridge: 2,
    freezer: 30,
    pantry: 1
  },
  // Default pour catégories non listées
  '_default': {
    fridge: 7,
    freezer: 90,
    pantry: 3
  }
};

/**
 * Calcule la nouvelle DLC après ouverture
 * @param {string} category - Catégorie du produit
 * @param {string} storageMethod - 'fridge', 'freezer', 'pantry'
 * @param {Date} openedAt - Date d'ouverture
 * @returns {Date} Nouvelle DLC
 */
export function calculateAdjustedExpiration(category, storageMethod, openedAt = new Date()) {
  const rules = SHELF_LIFE_AFTER_OPENING[category] || SHELF_LIFE_AFTER_OPENING['_default'];
  const daysToAdd = rules[storageMethod] || rules.fridge;
  
  const adjustedDate = new Date(openedAt);
  adjustedDate.setDate(adjustedDate.getDate() + daysToAdd);
  
  return adjustedDate;
}

/**
 * Détermine la catégorie depuis canonical_food ou nom produit
 */
export function inferCategory(productName, canonicalCategory) {
  if (canonicalCategory) return canonicalCategory;
  
  // Inférence basée sur le nom
  const lower = productName.toLowerCase();
  if (lower.includes('lait')) return 'Lait';
  if (lower.includes('yaourt') || lower.includes('yogurt')) return 'Yaourt';
  if (lower.includes('fromage')) return 'Fromage';
  if (lower.includes('jambon')) return 'Jambon';
  if (lower.includes('confiture')) return 'Confiture';
  if (lower.includes('jus')) return 'Jus de fruits';
  if (lower.includes('sauce')) return 'Sauce';
  // etc.
  
  return '_default';
}
```

#### 1.3 Service de Gestion

```javascript
// lib/lotManagementService.js
import { supabase } from './supabaseClient';
import { calculateAdjustedExpiration, inferCategory } from './shelfLifeRules';

/**
 * Marque un lot comme ouvert et ajuste sa DLC
 */
export async function openLot(lotId, userId) {
  try {
    // 1. Récupérer le lot avec ses infos
    const { data: lot, error: fetchError } = await supabase
      .from('inventory_lots')
      .select(`
        *,
        canonical_foods(canonical_name, category),
        products_catalog(product_name)
      `)
      .eq('id', lotId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!lot) throw new Error('Lot non trouvé');

    // 2. Déterminer la catégorie
    const category = inferCategory(
      lot.canonical_foods?.canonical_name || lot.products_catalog?.product_name || 'Produit',
      lot.canonical_foods?.category
    );

    // 3. Calculer nouvelle DLC
    const now = new Date();
    const adjustedExpiration = calculateAdjustedExpiration(
      category,
      lot.storage_method || 'fridge',
      now
    );

    // 4. Mise à jour en base
    const { data: updated, error: updateError } = await supabase
      .from('inventory_lots')
      .update({
        is_opened: true,
        opened_at: now.toISOString(),
        adjusted_expiration_date: adjustedExpiration.toISOString().split('T')[0]
      })
      .eq('id', lotId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      lot: updated,
      message: `📦 Produit ouvert ! Nouvelle DLC : ${adjustedExpiration.toLocaleDateString('fr-FR')}`,
      category,
      daysUntilExpiration: Math.ceil((adjustedExpiration - now) / (1000 * 60 * 60 * 24))
    };

  } catch (error) {
    console.error('Erreur openLot:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ferme un lot (reconditionnement, par exemple)
 */
export async function closeLot(lotId, userId) {
  const { data, error } = await supabase
    .from('inventory_lots')
    .update({
      is_opened: false,
      opened_at: null,
      adjusted_expiration_date: null
    })
    .eq('id', lotId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    lot: data,
    message: '✅ Produit refermé, DLC originale restaurée'
  };
}
```

#### 1.4 API Route

```javascript
// app/api/lots/open/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { openLot } from '@/lib/lotManagementService';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { lotId } = await request.json();

    if (!lotId) {
      return NextResponse.json({ error: 'lotId requis' }, { status: 400 });
    }

    const result = await openLot(lotId, user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur API /lots/open:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 1.5 UI : Bouton "Ouvrir" dans Carte Produit

```jsx
// app/pantry/components/PantryProductCard.jsx (ajout)

// Dans le composant, ajouter état et handler
const [opening, setOpening] = useState(false);

async function handleOpen() {
  if (!onOpen) return;
  setOpening(true);
  try {
    await onOpen(item.id);
  } finally {
    setOpening(false);
  }
}

// Dans le rendu des actions
{!item.is_opened && (
  <button 
    className="action-btn open"
    onClick={(e) => {
      e.stopPropagation();
      handleOpen();
    }}
    disabled={opening}
    title="Marquer comme ouvert (ajuste la date de péremption)"
  >
    {opening ? '⏳' : '📦'} Ouvrir
  </button>
)}

{item.is_opened && (
  <div className="opened-badge">
    ✅ Ouvert le {new Date(item.opened_at).toLocaleDateString('fr-FR')}
  </div>
)}
```

---

### Phase 2 : Plats Cuisinés / Restes ⏱️ ~3h

**Objectif** : Tracker les plats préparés comme des "lots virtuels" avec portions et DLC.

#### 2.1 Nouvelles Tables

```sql
-- Migration 002: Tables plats cuisinés

-- Table principale des plats cuisinés
CREATE TABLE IF NOT EXISTS cooked_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  
  -- Informations du plat
  name TEXT NOT NULL,
  description TEXT,
  
  -- Portions
  portions_cooked INT NOT NULL CHECK (portions_cooked > 0),
  portions_remaining INT NOT NULL CHECK (portions_remaining >= 0 AND portions_remaining <= portions_cooked),
  portion_size_g INT, -- Taille approximative d'une portion en grammes
  
  -- Dates
  cooked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expiration_date DATE NOT NULL, -- Auto-calculée : cooked_at + shelf_life
  consumed_completely_at TIMESTAMP,
  
  -- Stockage
  storage_method VARCHAR(50) NOT NULL DEFAULT 'fridge' CHECK (storage_method IN ('fridge', 'freezer', 'counter')),
  
  -- Métadonnées
  notes TEXT,
  photo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison : ingrédients utilisés pour cuisiner
CREATE TABLE IF NOT EXISTS cooked_dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES cooked_dishes(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES inventory_lots(id) ON DELETE SET NULL,
  
  -- Quantités
  quantity_used DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  
  -- Info produit (snapshot au moment de la cuisson)
  product_name TEXT NOT NULL,
  canonical_food_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cooked_dishes_user ON cooked_dishes(user_id);
CREATE INDEX idx_cooked_dishes_expiration ON cooked_dishes(expiration_date) WHERE portions_remaining > 0;
CREATE INDEX idx_cooked_dishes_recipe ON cooked_dishes(recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_cooked_dish_ingredients_dish ON cooked_dish_ingredients(dish_id);
CREATE INDEX idx_cooked_dish_ingredients_lot ON cooked_dish_ingredients(lot_id);

-- RLS Policies
ALTER TABLE cooked_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooked_dish_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cooked dishes"
  ON cooked_dishes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage ingredients of their dishes"
  ON cooked_dish_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cooked_dishes
      WHERE cooked_dishes.id = cooked_dish_ingredients.dish_id
      AND cooked_dishes.user_id = auth.uid()
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_cooked_dishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cooked_dishes_updated_at
BEFORE UPDATE ON cooked_dishes
FOR EACH ROW
EXECUTE FUNCTION update_cooked_dishes_updated_at();

-- Comments
COMMENT ON TABLE cooked_dishes IS 'Plats cuisinés maison avec gestion des portions restantes';
COMMENT ON COLUMN cooked_dishes.portions_cooked IS 'Nombre total de portions cuisinées initialement';
COMMENT ON COLUMN cooked_dishes.portions_remaining IS 'Nombre de portions encore disponibles';
COMMENT ON COLUMN cooked_dishes.expiration_date IS 'Date calculée automatiquement selon storage_method (fridge=3j, freezer=90j)';
COMMENT ON TABLE cooked_dish_ingredients IS 'Ingrédients utilisés pour cuisiner le plat (traçabilité)';
```

#### 2.2 Règles DLC Plats Cuisinés

```javascript
// lib/shelfLifeRules.js (suite)

export const COOKED_DISH_SHELF_LIFE = {
  // storage_method → jours
  'fridge': 3,      // Plat au frigo : 3 jours
  'freezer': 90,    // Plat congelé : 3 mois
  'counter': 1      // Température ambiante : 1 jour (non recommandé)
};

/**
 * Calcule la DLC d'un plat cuisin é
 */
export function calculateCookedDishExpiration(cookedAt = new Date(), storageMethod = 'fridge') {
  const days = COOKED_DISH_SHELF_LIFE[storageMethod] || COOKED_DISH_SHELF_LIFE.fridge;
  const expirationDate = new Date(cookedAt);
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate;
}
```

#### 2.3 Service Plats Cuisinés

```javascript
// lib/cookedDishesService.js
import { supabase } from './supabaseClient';
import { calculateCookedDishExpiration } from './shelfLifeRules';

/**
 * Crée un plat cuisiné après avoir cuisiné une recette
 */
export async function createCookedDish({
  userId,
  recipeId,
  name,
  portionsCooked,
  storageMethod = 'fridge',
  ingredientsUsed = [], // [{ lotId, quantityUsed, unit }]
  notes
}) {
  try {
    const cookedAt = new Date();
    const expirationDate = calculateCookedDishExpiration(cookedAt, storageMethod);

    // 1. Créer le plat
    const { data: dish, error: dishError } = await supabase
      .from('cooked_dishes')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        name,
        portions_cooked: portionsCooked,
        portions_remaining: portionsCooked,
        cooked_at: cookedAt.toISOString(),
        expiration_date: expirationDate.toISOString().split('T')[0],
        storage_method: storageMethod,
        notes
      })
      .select()
      .single();

    if (dishError) throw dishError;

    // 2. Enregistrer les ingrédients utilisés et déduire de l'inventaire
    for (const ing of ingredientsUsed) {
      // 2a. Récupérer info lot
      const { data: lot } = await supabase
        .from('inventory_lots')
        .select('product_name, canonical_food_id, qty_remaining, unit')
        .eq('id', ing.lotId)
        .single();

      if (lot) {
        // 2b. Enregistrer l'ingrédient
        await supabase
          .from('cooked_dish_ingredients')
          .insert({
            dish_id: dish.id,
            lot_id: ing.lotId,
            quantity_used: ing.quantityUsed,
            unit: ing.unit,
            product_name: lot.product_name,
            canonical_food_id: lot.canonical_food_id
          });

        // 2c. Déduire de l'inventaire
        const newQty = Math.max(0, lot.qty_remaining - ing.quantityUsed);
        await supabase
          .from('inventory_lots')
          .update({ qty_remaining: newQty })
          .eq('id', ing.lotId);
      }
    }

    return {
      success: true,
      dish,
      message: `🍽️ ${name} créé ! ${portionsCooked} portions, expire le ${expirationDate.toLocaleDateString('fr-FR')}`
    };

  } catch (error) {
    console.error('Erreur createCookedDish:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Consomme une ou plusieurs portions
 */
export async function consumePortions(dishId, userId, portionsToConsume = 1) {
  try {
    // 1. Récupérer le plat
    const { data: dish, error: fetchError } = await supabase
      .from('cooked_dishes')
      .select('*')
      .eq('id', dishId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Vérifier qu'il reste assez de portions
    if (dish.portions_remaining < portionsToConsume) {
      return {
        success: false,
        error: `Seulement ${dish.portions_remaining} portion(s) disponible(s)`
      };
    }

    const newRemaining = dish.portions_remaining - portionsToConsume;

    // 3. Mettre à jour
    const updates = {
      portions_remaining: newRemaining
    };

    // Si toutes les portions sont consommées
    if (newRemaining === 0) {
      updates.consumed_completely_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('cooked_dishes')
      .update(updates)
      .eq('id', dishId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      dish: updated,
      message: newRemaining === 0 
        ? `✅ ${dish.name} entièrement consommé !`
        : `🍽️ ${portionsToConsume} portion(s) consommée(s). Reste ${newRemaining} portion(s).`
    };

  } catch (error) {
    console.error('Erreur consumePortions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Congèle un plat (prolonge la DLC)
 */
export async function freezeCookedDish(dishId, userId) {
  try {
    const now = new Date();
    const newExpiration = calculateCookedDishExpiration(now, 'freezer');

    const { data, error } = await supabase
      .from('cooked_dishes')
      .update({
        storage_method: 'freezer',
        expiration_date: newExpiration.toISOString().split('T')[0]
      })
      .eq('id', dishId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      dish: data,
      message: `🧊 Plat congelé ! Nouvelle DLC : ${newExpiration.toLocaleDateString('fr-FR')}`
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Liste tous les plats avec portions restantes
 */
export async function getCookedDishes(userId, options = {}) {
  try {
    let query = supabase
      .from('cooked_dishes')
      .select(`
        *,
        recipes(id, recipe_name, role)
      `)
      .eq('user_id', userId)
      .order('expiration_date', { ascending: true });

    // Filtres optionnels
    if (options.onlyRemaining) {
      query = query.gt('portions_remaining', 0);
    }

    if (options.expiringWithinDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + options.expiringWithinDays);
      query = query.lte('expiration_date', cutoffDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      dishes: data || []
    };

  } catch (error) {
    console.error('Erreur getCookedDishes:', error);
    return { success: false, error: error.message, dishes: [] };
  }
}
```

---

### Phase 3 : Planning Intelligent ⏱️ ~2h

**Objectif** : Le planning suggère de finir les restes avant de cuisiner nouveau.

#### 3.1 Détection des Restes dans le Planning

```javascript
// lib/planningService.js (nouveau ou extension)

/**
 * Analyse les restes disponibles pour optimiser le planning
 */
export async function analyzeLeftoversForPlanning(userId, dateRange = { start: new Date(), days: 7 }) {
  try {
    // 1. Récupérer plats cuisinés avec portions restantes
    const { dishes } = await getCookedDishes(userId, {
      onlyRemaining: true,
      expiringWithinDays: dateRange.days
    });

    // 2. Récupérer produits à risque (phase 1)
    const { analysis } = await analyzeWasteRisks(userId, { daysThreshold: dateRange.days });

    // 3. Calculer scores de priorité
    const leftoverPriority = dishes.map(dish => {
      const daysLeft = Math.ceil(
        (new Date(dish.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        type: 'cooked_dish',
        id: dish.id,
        name: dish.name,
        portions: dish.portions_remaining,
        expirationDate: dish.expiration_date,
        daysLeft,
        urgencyScore: daysLeft <= 1 ? 100 : daysLeft <= 2 ? 75 : daysLeft <= 3 ? 50 : 25,
        action: 'Finir ce plat',
        recipe_id: dish.recipe_id
      };
    });

    const ingredientPriority = analysis.risks
      .filter(r => r.urgency.level === 'URGENT' || r.urgency.level === 'CRITICAL')
      .map(risk => ({
        type: 'raw_ingredient',
        id: risk.lotId,
        name: risk.productName,
        quantity: risk.quantity,
        unit: risk.unit,
        expirationDate: risk.expirationDate,
        daysLeft: risk.daysLeft,
        urgencyScore: risk.urgency.score,
        action: 'Cuisiner avec cet ingrédient'
      }));

    // 4. Fusionner et trier par urgence
    const allPriorities = [...leftoverPriority, ...ingredientPriority]
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    return {
      success: true,
      priorities: allPriorities,
      summary: {
        cookedDishesAtRisk: leftoverPriority.length,
        ingredientsAtRisk: ingredientPriority.length,
        totalItems: allPriorities.length
      }
    };

  } catch (error) {
    console.error('Erreur analyzeLeftoversForPlanning:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Suggère des repas optimisés pour le planning
 */
export async function suggestMealsForPlanning(userId, date) {
  try {
    // 1. Analyser les priorités
    const { priorities } = await analyzeLeftoversForPlanning(userId, { start: date, days: 7 });

    const suggestions = [];

    // 2. Prioriser les plats cuisinés qui expirent
    const urgentDishes = priorities
      .filter(p => p.type === 'cooked_dish' && p.daysLeft <= 2)
      .slice(0, 2);

    for (const dish of urgentDishes) {
      suggestions.push({
        priority: 'URGENT',
        type: 'leftovers',
        title: `Finir: ${dish.name}`,
        description: `${dish.portions} portion(s) restante(s), expire ${dish.daysLeft === 0 ? 'aujourd\'hui' : 'demain'}`,
        dish_id: dish.id,
        urgencyScore: dish.urgencyScore
      });
    }

    // 3. Suggérer recettes utilisant ingrédients à risque
    const urgentIngredients = priorities
      .filter(p => p.type === 'raw_ingredient' && p.urgencyScore >= 65)
      .slice(0, 5);

    if (urgentIngredients.length > 0) {
      // Chercher recettes compatibles
      const { suggestions: recipeSuggestions } = await suggestRecipesForWaste(userId, {
        risks: urgentIngredients
      });

      for (const recipe of recipeSuggestions.slice(0, 3)) {
        suggestions.push({
          priority: 'HIGH',
          type: 'recipe_with_expiring',
          title: recipe.recipeName,
          description: `Utilise ${recipe.matchingProducts.join(', ')} qui expirent bientôt`,
          recipe_id: recipe.recipeId,
          urgencyScore: recipe.urgencyScore
        });
      }
    }

    // 4. Suggestions normales si pas de priorités urgentes
    if (suggestions.length === 0) {
      suggestions.push({
        priority: 'NORMAL',
        type: 'standard',
        title: 'Cuisiner une nouvelle recette',
        description: 'Aucun reste urgent, profitez-en pour essayer quelque chose de nouveau !',
        urgencyScore: 0
      });
    }

    return {
      success: true,
      suggestions: suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore),
      hasUrgentItems: suggestions.some(s => s.priority === 'URGENT')
    };

  } catch (error) {
    console.error('Erreur suggestMealsForPlanning:', error);
    return { success: false, error: error.message };
  }
}
```

#### 3.2 UI Planning avec Restes

```jsx
// app/planning/components/LeftoversPriority.jsx

export default function LeftoversPriority({ userId, date }) {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriorities();
  }, [userId, date]);

  async function loadPriorities() {
    setLoading(true);
    const response = await fetch('/api/planning/priorities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date })
    });
    const data = await response.json();
    setPriorities(data.priorities || []);
    setLoading(false);
  }

  if (loading) return <div>Chargement...</div>;
  if (priorities.length === 0) return null;

  return (
    <div className="leftovers-priority">
      <h3>⚠️ Priorités Anti-Gaspillage</h3>
      
      {priorities.map(item => (
        <div key={`${item.type}-${item.id}`} className={`priority-card ${item.daysLeft <= 1 ? 'urgent' : ''}`}>
          <div className="priority-header">
            <span className="priority-icon">
              {item.type === 'cooked_dish' ? '🍽️' : '🥬'}
            </span>
            <h4>{item.name}</h4>
            <span className={`urgency-badge urgency-${item.urgencyScore >= 85 ? 'critical' : item.urgencyScore >= 65 ? 'high' : 'medium'}`}>
              {item.daysLeft === 0 ? 'AUJOURD\'HUI' : `${item.daysLeft}j`}
            </span>
          </div>
          
          <p className="priority-action">{item.action}</p>
          
          {item.type === 'cooked_dish' && (
            <p className="priority-details">{item.portions} portion(s) restante(s)</p>
          )}
          
          {item.type === 'raw_ingredient' && (
            <p className="priority-details">{item.quantity} {item.unit}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Checklist Complète

### Phase 1 : DLC Après Ouverture
- [ ] Migration SQL (colonnes adjusted_expiration_date, is_opened, opened_at)
- [ ] lib/shelfLifeRules.js (règles par catégorie)
- [ ] lib/lotManagementService.js (openLot, closeLot)
- [ ] app/api/lots/open/route.js
- [ ] UI bouton "Ouvrir" dans PantryProductCard
- [ ] UI affichage DLC ajustée vs originale
- [ ] Tests manuels (ouvrir lait, voir DLC change)

### Phase 2 : Plats Cuisinés
- [ ] Migration SQL (tables cooked_dishes, cooked_dish_ingredients)
- [ ] lib/cookedDishesService.js (create, consume, freeze, list)
- [ ] app/api/cooked-dishes/route.js (CRUD endpoints)
- [ ] Composant CookedDishCard
- [ ] Composant CookedDishesManager
- [ ] Modal après cuisson recette (créer plat + portions)
- [ ] Intégration dans onglet "À Risque" du pantry
- [ ] Déduction automatique ingrédients inventaire
- [ ] Tests cuisson → portions → consommation

### Phase 3 : Planning Intelligent
- [ ] lib/planningService.js (analyzeLeftovers, suggestMeals)
- [ ] app/api/planning/priorities/route.js
- [ ] Composant LeftoversPriority dans planning
- [ ] Logique priorisation: restes > ingrédients > nouveau
- [ ] UI suggestions "Finir [plat]" dans planning
- [ ] Tests scénario complet

### Documentation
- [ ] GUIDE_RESTES_COMPLET.md
- [ ] Workflows avec screenshots
- [ ] API documentation
- [ ] Exemples d'utilisation

---

## 🎯 Résultat Attendu

**L'utilisateur** :
1. Ouvre un produit → DLC ajustée automatiquement
2. Cuisine une recette → Plat créé avec portions
3. Mange des portions → Système track les restes
4. Consulte planning → Suggestions priorisent restes
5. **Résultat** : Zéro gaspillage, optimisation totale ! 🎉

---

**Prêt à commencer l'implémentation ?** 🚀
