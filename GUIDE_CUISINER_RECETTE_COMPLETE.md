# 🎉 Fonctionnalité "Cuisiner une Recette" - VERSION COMPLÈTE

## 📋 Vue d'ensemble

Cette fonctionnalité permet de **cuisiner une recette** directement depuis la page des recettes, en sélectionnant les ingrédients de l'inventaire à utiliser et en déduisant automatiquement les quantités.

---

## ✨ Fonctionnalités

### 🎯 Ce qui a été ajouté

1. **Sélecteur d'ingrédients intelligent** (`IngredientSelector`)
   - Affiche tous les ingrédients de la recette
   - Trouve automatiquement les lots d'inventaire correspondants
   - Matching par `canonical_food_id`, `archetype_id` ou nom (fuzzy)
   - Permet de sélectionner quels lots utiliser
   - Ajustement des quantités à utiliser par lot
   - Indicateur visuel de progression (✅ ⚠️ ❌)

2. **API d'ingrédients disponibles**
   - `GET /api/recipes/[id]/available-ingredients`
   - Retourne les ingrédients avec leurs lots disponibles
   - Priorise les lots par date d'expiration (FIFO)
   - Calcule les jours restants avant expiration

3. **API de cuisson améliorée**
   - `POST /api/recipes/[id]/cook` (mis à jour)
   - Accepte la liste des lots sélectionnés
   - Déduit automatiquement les quantités de l'inventaire
   - Enregistre dans `cooked_dish_ingredients` la traçabilité
   - Retourne les ingrédients utilisés

4. **Dialog de cuisson amélioré**
   - Intègre le sélecteur d'ingrédients
   - Validation visuelle des ingrédients sélectionnés
   - Envoie les lots au backend

---

## 🔧 Structure technique

### Fichiers créés

```
app/
└── api/
    └── recipes/
        └── [id]/
            ├── cook/
            │   └── route.js (modifié)
            └── available-ingredients/
                └── route.js (créé)

components/
├── IngredientSelector.jsx (créé)
├── IngredientSelector.css (créé)
├── CreateDishFromRecipeDialog.jsx (modifié)
└── CreateDishFromRecipeDialog.css (existant)
```

---

## 🎬 Workflow utilisateur

### 1. Page Recettes
```
User clique "🍳 Cuisiner" sur une recette
└─► Dialog s'ouvre
```

### 2. Dialog de cuisson
```
┌─────────────────────────────────────────────────────────┐
│ 🍳 Cuisiner "Lasagnes maison"                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 👥 Portions: [−] 6 [+]                                 │
│ 📦 Stockage: [❄️ Frigo] [🧊 Congélo] [🏠 Comptoir]    │
│ 📝 Notes: ...                                          │
│                                                         │
│ 🥕 Ingrédients nécessaires                             │
│ ┌───────────────────────────────────────────────────┐  │
│ │ ✅ Viande hachée         500g                     │  │
│ │ ▓▓▓▓▓▓▓▓▓▓ 100%                                  │  │
│ │ ☐ Viande hachée bœuf (600g, exp: 3j) [-] 500g [+] │  │
│ │ ☑ Viande hachée porc (300g, exp: 5j) [-] 0g [+]   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ ⚠️ Tomates                400g                    │  │
│ │ ▓▓▓▓▓░░░░░ 50%                                   │  │
│ │ ☑ Tomates cerises (200g, exp: 2j) [-] 200g [+]    │  │
│ │ ☐ Tomates italiennes (500g, exp: 7j) [-] 0g [+]   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│        [Annuler]  [✅ Ajouter au garde-manger]         │
└─────────────────────────────────────────────────────────┘
```

### 3. Validation
```
L'utilisateur peut :
- Choisir quels lots utiliser (checkbox)
- Ajuster les quantités de chaque lot
- Voir la progression (barre verte)
- Identifier les lots à risque (🔴 expiré, 🟠 < 3j)
```

### 4. Soumission
```
Click "Ajouter au garde-manger"
└─► API POST /api/recipes/[id]/cook
    ├─► Crée le plat dans `cooked_dishes`
    ├─► Pour chaque lot sélectionné:
    │   ├─► Déduit la quantité de `inventory_lots`
    │   └─► Enregistre dans `cooked_dish_ingredients`
    └─► Retourne le plat créé + ingrédients utilisés
```

### 5. Résultat
```
✅ "Lasagnes maison" ajouté au garde-manger avec 6 portions !

Ingrédients utilisés :
- Viande hachée bœuf : 500g
- Tomates cerises : 200g
- Pâtes lasagne : 250g
...
```

---

## 🧠 Logique de matching intelligente

L'API `available-ingredients` utilise une stratégie en cascade :

### Stratégie 1 : Matching par `canonical_food_id`
```sql
SELECT * FROM inventory_lots
WHERE canonical_food_id = :recipe_ingredient_canonical_food_id
AND user_id = :user_id
AND quantity > 0
ORDER BY expiration_date ASC
```

### Stratégie 2 : Matching par `archetype_id`
Si aucun lot trouvé par canonical_food_id :
```sql
SELECT * FROM inventory_lots il
JOIN products p ON il.product_id = p.id
WHERE p.archetype_id = :recipe_ingredient_archetype_id
AND il.user_id = :user_id
AND il.quantity > 0
ORDER BY il.expiration_date ASC
```

### Stratégie 3 : Fuzzy matching par nom
Si toujours aucun lot :
```sql
SELECT * FROM inventory_lots
WHERE product_name ILIKE '%:ingredient_name%'
AND user_id = :user_id
AND quantity > 0
ORDER BY expiration_date ASC
LIMIT 5
```

---

## 📊 Structure de données

### Table `cooked_dish_ingredients`
```sql
CREATE TABLE cooked_dish_ingredients (
  id BIGSERIAL PRIMARY KEY,
  dish_id BIGINT NOT NULL REFERENCES cooked_dishes(id),
  lot_id UUID REFERENCES inventory_lots(id),
  quantity_used DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  product_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Traçabilité** : On peut retrouver quels lots ont été utilisés pour chaque plat.

---

## 🎨 Composants React

### `IngredientSelector`
**Props :**
- `recipeId` : ID de la recette
- `portions` : Nombre de portions (pour ajuster les quantités)
- `onSelectionChange(selectedLots)` : Callback avec les lots sélectionnés

**État :**
```javascript
selectedLots = {
  ingredient_id_1: [
    { lot_id, product_name, quantity_to_use, unit },
    { lot_id, product_name, quantity_to_use, unit }
  ],
  ingredient_id_2: [...]
}
```

**Rendu :**
- Liste des ingrédients avec barres de progression
- Pour chaque ingrédient : liste des lots disponibles
- Checkbox pour sélectionner un lot
- Input number pour ajuster la quantité
- Indicateurs visuels (✅ ⚠️ ❌)

---

## 🔄 Flux de données

```
1. User ouvre dialog
   └─► CreateDishFromRecipeDialog.jsx

2. Dialog monte IngredientSelector
   └─► IngredientSelector.jsx useEffect()
       └─► GET /api/recipes/[id]/available-ingredients
           └─► Retourne { ingredients: [...] }

3. User sélectionne lots et quantités
   └─► setState(selectedLots)
       └─► onSelectionChange(selectedLots) vers Dialog

4. User clique "Ajouter"
   └─► Dialog appelle POST /api/recipes/[id]/cook
       └─► Body: { portions, storageMethod, notes, ingredients }

5. API traite la requête
   ├─► Crée le plat (cooked_dishes)
   ├─► Pour chaque ingrédient:
   │   ├─► UPDATE inventory_lots SET quantity = quantity - :used
   │   └─► INSERT INTO cooked_dish_ingredients
   └─► Retourne { dish, ingredients_used }

6. Success
   └─► Dialog se ferme
       └─► Message de succès
```

---

## ✅ Avantages de cette version

1. **Traçabilité complète**
   - On sait exactement quels lots ont été utilisés
   - Historique dans `cooked_dish_ingredients`

2. **Gestion automatique des stocks**
   - Les quantités sont déduites de l'inventaire
   - Pas besoin de gérer manuellement

3. **Priorisation FIFO**
   - Les lots les plus proches de l'expiration sont proposés en premier
   - Réduit le gaspillage

4. **Flexibilité**
   - L'utilisateur peut choisir quels lots utiliser
   - Possibilité d'utiliser plusieurs lots pour un même ingrédient
   - Ajustement des quantités

5. **UX intuitive**
   - Indicateurs visuels clairs
   - Progression en temps réel
   - Validation avant soumission

---

## 🚀 Testing

### 1. Créer des lots d'inventaire
```
Aller dans Garde-manger → Ajouter un produit
- Viande hachée : 600g
- Tomates : 400g
- Pâtes : 500g
```

### 2. Tester le workflow
```
1. /recipes → Trouver "Lasagnes"
2. Click "🍳 Cuisiner"
3. Vérifier que les ingrédients apparaissent
4. Vérifier que les lots sont trouvés
5. Sélectionner les lots
6. Ajuster les quantités
7. Click "Ajouter au garde-manger"
8. Vérifier dans /pantry que les quantités ont été déduites
9. Vérifier dans Garde-manger → À Risque que le plat apparaît
```

### 3. Cas limites à tester
- Recette sans ingrédients
- Ingrédient sans lot disponible
- Lot avec quantité insuffisante
- Utilisation de plusieurs lots pour un ingrédient
- Annulation du dialog

---

## 📝 Notes techniques

### Conversion d'unités
**Version actuelle** : Pas de conversion automatique
- L'utilisateur doit gérer manuellement si les unités diffèrent
- Ex: Recette demande `200g`, lot a `0.2kg` → User doit entrer `0.2` et non `200`

**Future amélioration** :
- Intégrer le système de conversion d'unités (`lib/units.js`)
- Convertir automatiquement les quantités
- Afficher les deux unités (recette vs lot)

### Performance
- Les requêtes de matching sont séquentielles (OK pour < 50 ingrédients)
- Pour optimiser : batch les requêtes dans une seule query SQL

### Sécurité
- Validation côté serveur de toutes les données
- Vérification `user_id` pour chaque lot
- Protection contre les quantités négatives
- Limite les quantités au stock disponible

---

## 🎯 Prochaines étapes possibles

1. **Ajustement automatique des portions**
   - Calculer les quantités d'ingrédients selon portions choisies
   - Multiplier par ratio portions_choisies / portions_recette

2. **Conversion d'unités automatique**
   - Intégrer `lib/units.js`
   - Convertir kg ↔ g, ml ↔ l, etc.

3. **Suggestions intelligentes**
   - Proposer des substituts si ingrédient manquant
   - "Remplacer tomates par sauce tomate ?"

4. **Mode "Shopping list"**
   - Si ingrédients manquants → ajouter à la liste de courses

5. **Validation nutritionnelle**
   - Afficher les valeurs nutritionnelles du plat cuisiné
   - Basé sur `recipe_nutrition_cache`

---

## 🐛 Troubleshooting

### Problème : Aucun lot trouvé
**Cause** : Pas de correspondance entre recipe_ingredients et inventory
**Solution** : Vérifier que les produits ont `canonical_food_id` ou `archetype_id`

### Problème : Erreur lors de la déduction
**Cause** : Lot supprimé ou quantité insuffisante
**Solution** : L'API ignore l'ingrédient avec warning (pas de blocage)

### Problème : Quantités incorrectes
**Cause** : Unités différentes entre recette et lot
**Solution** : Convertir manuellement ou implémenter conversion auto

---

## 📚 Fichiers concernés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| `app/api/recipes/[id]/available-ingredients/route.js` | API pour récupérer les ingrédients et lots | 170 |
| `app/api/recipes/[id]/cook/route.js` | API pour créer le plat et déduire stocks | 160 |
| `components/IngredientSelector.jsx` | Composant de sélection des lots | 270 |
| `components/IngredientSelector.css` | Styles du sélecteur | 280 |
| `components/CreateDishFromRecipeDialog.jsx` | Dialog de cuisson (modifié) | 220 |

**Total** : ~1100 lignes de code

---

## ✅ Checklist de validation

- [x] API `available-ingredients` créée
- [x] Logique de matching (3 stratégies)
- [x] Composant `IngredientSelector` créé
- [x] Styles CSS avec indicateurs visuels
- [x] Dialog intégré avec sélecteur
- [x] API `cook` mise à jour pour déduction
- [x] Enregistrement dans `cooked_dish_ingredients`
- [x] Validation des données
- [x] Gestion des erreurs
- [x] Documentation complète

---

**Version** : 2.0 - Complète avec déduction automatique  
**Date** : Octobre 2025  
**Statut** : ✅ Prêt à tester
