# ✅ Mise à jour des pages recettes - Terminée

## 📊 Résumé des modifications

Les pages de recettes ont été mises à jour pour utiliser le nouveau système de base de données avec **canonical_foods**, **cultivars**, **archetypes** et **recipe_ingredients**.

---

## 🎯 Modifications effectuées

### 1. **Page liste des recettes** (`app/recipes/page.js`)

#### ✅ Chargement des recettes avec ingrédients
```javascript
// Avant: SELECT *
// Après: SELECT avec relations
.select(`
  *,
  recipe_ingredients (
    id,
    quantity,
    unit,
    notes,
    canonical_food_id,
    archetype_id,
    canonical_foods (...),
    archetypes (...)
  )
`)
```

#### ✅ Vérification de disponibilité améliorée
- Vérifie maintenant **canonical_food_id** ET **archetype_id**
- Calcule correctement le pourcentage de disponibilité
- Affiche les ingrédients urgents manquants

---

### 2. **Page détail recette** (`app/recipes/[id]/page.js`)

#### ✅ Chargement des ingrédients enrichi
```javascript
// Chargement avec relations vers canonical_foods ET archetypes
.select(`
  id, quantity, unit, notes,
  canonical_food_id, archetype_id,
  canonical_foods (id, canonical_name, ...),
  archetypes (id, name, process, ...)
`)
```

#### ✅ Affichage intelligent des ingrédients
- Détecte automatiquement si l'ingrédient est un **canonical_food** ou un **archetype**
- Affiche le nom correct avec indication "(transformé)" pour les archetypes
- Affiche quantité + unité + notes

#### ✅ Styles CSS ajoutés
- Liste d'ingrédients moderne avec hover effects
- Affichage clair de la quantité, nom et notes
- Design cohérent avec le reste de l'application

---

## 📝 Exemple d'affichage

### Liste des ingrédients
```
🥕 Ingrédients (7)

60 g     flocon d'avoine
15 g     graine de chia
200 ml   lait végétal
100 g    yaourt nature (transformé)
100 g    fruit rouge
1 càc    sirop d'érable (transformé)
0.5 càc  cannelle
```

---

## 🗄️ Structure de données utilisée

### Table `recipe_ingredients`
| Champ | Type | Description |
|-------|------|-------------|
| `recipe_id` | int | ID de la recette |
| `canonical_food_id` | bigint | ID du canonical_food (ou NULL) |
| `archetype_id` | bigint | ID de l'archetype (ou NULL) |
| `quantity` | numeric | Quantité nécessaire |
| `unit` | varchar | Unité (g, ml, pièce, etc.) |
| `notes` | text | Notes optionnelles |

### Relations
- `canonical_food_id` → `canonical_foods.id` (ingrédients de base)
- `archetype_id` → `archetypes.id` (produits transformés)

---

## 🚀 Comment tester

1. **Page liste des recettes** : `/recipes`
   - Voir toutes les recettes avec leur % de disponibilité
   - Filtrer par disponibilité (Réalisables / Partielles / Urgentes)
   - Trier par Score Myko / Disponibilité / Temps / Nom

2. **Page détail recette** : `/recipes/[id]`
   - Exemple : `/recipes/2` (Overnight porridge)
   - Voir la liste complète des ingrédients
   - Affichage de la quantité et de l'unité
   - Indication des produits transformés

---

## 📊 Statistiques de l'import

**Import des ingrédients réussi** :
- ✅ **3 487 ingrédients** insérés
- ✅ **766 recettes** ont des ingrédients
- ✅ **2 661** via `canonical_foods`
- ✅ **826** via `archetypes`
- 📊 **Taux de matching : 77.7%**

---

## 🔧 Prochaines étapes (optionnelles)

### 1. Ajouter les ingrédients manquants (~1003)
Les ingrédients non-matchés (22.3%) doivent être ajoutés manuellement dans :
- `canonical_foods` pour les ingrédients de base
- `archetypes` pour les produits transformés

### 2. Améliorer la page d'édition
- Adapter l'édition d'ingrédients pour gérer archetypes
- Ajouter un sélecteur "canonical vs archetype"

### 3. Intégration avec l'inventaire
- Lier recipe_ingredients avec inventory_lots
- Afficher les lots disponibles pour chaque ingrédient
- Permettre la réservation/utilisation directe

---

## ✅ Tests recommandés

```bash
# 1. Ouvrir la liste des recettes
http://localhost:3000/recipes

# 2. Vérifier une recette avec ingrédients
http://localhost:3000/recipes/2

# 3. Vérifier qu'une recette sans ingrédients affiche bien le message
http://localhost:3000/recipes/1

# 4. Tester les filtres de disponibilité
# Cliquer sur "Réalisables", "Partielles", "Urgentes"

# 5. Tester le tri
# Cliquer sur "Score Myko", "Disponibilité", "Temps", "Nom"
```

---

## 🐛 Debugging

Si les ingrédients ne s'affichent pas :

1. **Vérifier dans la console du navigateur** :
   ```javascript
   console.log('Ingrédients chargés:', ings.length, 'ingrédients');
   ```

2. **Vérifier dans Supabase** :
   ```sql
   SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = 2;
   ```

3. **Vérifier les relations** :
   ```sql
   SELECT 
     ri.*,
     cf.canonical_name,
     a.name as archetype_name
   FROM recipe_ingredients ri
   LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
   LEFT JOIN archetypes a ON a.id = ri.archetype_id
   WHERE ri.recipe_id = 2;
   ```

---

## 📁 Fichiers modifiés

- ✅ `/app/recipes/page.js` - Liste des recettes
- ✅ `/app/recipes/[id]/page.js` - Détail d'une recette
- ✅ `/app/recipes/[id]/recipe-detail.css` - Styles

---

**🎉 Les pages de recettes sont maintenant prêtes à utiliser le nouveau système de base de données !**
