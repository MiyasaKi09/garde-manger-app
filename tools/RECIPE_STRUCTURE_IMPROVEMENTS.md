# 🔧 AMÉLIORATION DE LA STRUCTURE DES RECETTES

## 🎯 Problèmes identifiés

Vous avez soulevé 3 problèmes critiques dans la modélisation actuelle :

### 1. ❌ Pas de sauces dans la base
- Les sauces sont essentielles (béchamel, hollandaise, tomate, etc.)
- Elles sont des composants de recettes, pas des plats autonomes
- **Impact** : Impossible de savoir qu'une lasagne nécessite une béchamel

### 2. ❌ Pas de distinction plat complet vs plat principal
- Un **plat complet** : Couscous (viande + légumes + semoule)
- Un **plat principal simple** : Steak grillé (nécessite accompagnement)
- **Impact** : Planification des repas incorrecte, liste de courses incomplète

### 3. ❌ Pas de gestion des sous-recettes
- Une lasagne utilise une béchamel ET une bolognaise
- Un burger utilise une sauce spéciale
- La colonne `sub_recipe_id` existe mais n'est pas utilisée
- **Impact** : Aucune visibilité sur les dépendances entre recettes

---

## ✅ Solutions implémentées

### Phase 1 : Structure de la base

**Fichier** : `fix_recipe_structure.sql`

#### 1.1 Ajouter le rôle SAUCE
```sql
ALTER TYPE recipe_role ADD VALUE IF NOT EXISTS 'SAUCE';
```

#### 1.2 Ajouter la colonne is_complete_meal
```sql
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_complete_meal BOOLEAN DEFAULT FALSE;
```
- `TRUE` = Plat complet (ne nécessite pas d'accompagnement)
  - Ex: Paella, Couscous, Lasagne, Pizza, Burger
- `FALSE` = Plat principal simple (nécessite un accompagnement)
  - Ex: Steak grillé, Poulet rôti, Poisson poêlé

#### 1.3 Ajouter la colonne needs_side_dish
```sql
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS needs_side_dish BOOLEAN DEFAULT NULL;
```
- `TRUE` = Besoin explicite d'accompagnement
- `FALSE` = Pas besoin d'accompagnement
- `NULL` = Non défini

#### 1.4 Importer les sauces essentielles

**24 sauces importées** :
- **Sauces classiques** : Béchamel, Hollandaise, Béarnaise, Poivre, Moutarde, Beurre blanc
- **Sauces tomate** : Nature, Basilic, Bolognaise
- **Sauces froides** : Mayonnaise, Aïoli, Pesto, Tapenade, Guacamole, Tzatziki, Salsa
- **Vinaigrettes** : Classique
- **Sauces asiatiques** : Soja sucrée, Curry
- **Autres** : Barbecue
- **Bouillons** : Légumes, Volaille, Veau, Poisson

---

### Phase 2 : Liens entre recettes

**Fichier** : `link_sub_recipes.sql`

Utilise la colonne existante `recipe_ingredients.sub_recipe_id` pour créer les liens.

#### Exemples de liens créés :

**Béchamel** utilisée dans :
- Lasagnes (500ml)
- Gratins d'endives, chou-fleur (300ml)
- Croque-monsieur (200ml)

**Sauce tomate** utilisée dans :
- Pâtes à la tomate (400ml)
- Pizzas (150ml)

**Bolognaise** utilisée dans :
- Spaghetti bolognaise (400ml)
- Lasagnes bolognaise (600ml)

**Mayonnaise** utilisée dans :
- Salades composées (100ml)
- Burgers (50ml)

**Vinaigrette** utilisée dans :
- Salades vertes, niçoise, grecque (100ml)

---

### Phase 3 : Catégorisation automatique

Le script `fix_recipe_structure.sql` catégorise automatiquement les recettes existantes :

#### Plats complets (is_complete_meal = TRUE)
```sql
UPDATE recipes SET is_complete_meal = TRUE
WHERE name ~* '(paella|couscous|pot-au-feu|blanquette|
                cassoulet|choucroute|tajine|curry|risotto|
                pasta|lasagne|pizza|burger|sandwich|wrap|
                bowl|poke|salade composée|quiche)'
```

#### Plats nécessitant accompagnement (needs_side_dish = TRUE)
```sql
UPDATE recipes SET needs_side_dish = TRUE
WHERE name ~* '(steak|côtelette|entrecôte|pavé|filet|
                rôti|poulet grillé|poisson grillé|escalope)'
```

---

## 📊 Résultats attendus

### Après exécution de fix_recipe_structure.sql :

```
role              | total | plats_complets | besoin_accompagnement
------------------+-------+----------------+----------------------
PLAT_PRINCIPAL    |  683  |      ~150      |         ~200
ENTREE            |  114  |        -       |           -
ACCOMPAGNEMENT    |   94  |        -       |           -
DESSERT           |  143  |        -       |           -
SAUCE             |   24  |        -       |           -
------------------+-------+----------------+----------------------
TOTAL             | 1058  |      ~150      |         ~200
```

### Après exécution de link_sub_recipes.sql :

```
sauce                    | utilisations | exemples
-------------------------+--------------+---------------------------
Sauce tomate nature      |      ~40     | Pizza margherita, Pâtes...
Sauce béchamel           |      ~25     | Lasagne, Gratin endives...
Mayonnaise               |      ~20     | Burger, Salade César...
Vinaigrette classique    |      ~15     | Salade verte, Niçoise...
Sauce bolognaise         |       ~5     | Spaghetti, Lasagne...
```

---

## 🚀 Instructions d'exécution

### Étape 1 : Améliorer la structure (obligatoire)

```bash
# Ouvrir dans VS Code et exécuter :
tools/fix_recipe_structure.sql
```

**Durée** : ~10 secondes  
**Actions** :
- Ajoute le rôle SAUCE
- Ajoute les colonnes is_complete_meal et needs_side_dish
- Importe 24 sauces essentielles
- Catégorise automatiquement les plats existants

### Étape 2 : Créer les liens sous-recettes (recommandé)

```bash
# Ouvrir dans VS Code et exécuter :
tools/link_sub_recipes.sql
```

**Durée** : ~5 secondes  
**Actions** :
- Crée les liens recipe_ingredients → sub_recipe_id
- Identifie automatiquement les recettes utilisant des sauces
- Ajoute les quantités estimées

---

## 🔮 Prochaines étapes (optionnelles)

### 1. Enrichir les sauces
Importer les ~100 autres sauces du fichier `bloc18_sauces_complet.txt` :
- Sauces brunes (demi-glace, espagnole, chasseur)
- Vinaigrettes variées (balsamique, miel, soja)
- Sauces asiatiques (teriyaki, nuoc-mam, hoisin)

### 2. Ajouter des recettes de bases
- Pâte à pizza
- Pâte à crêpes
- Pâtes fraîches
- Pâte brisée, feuilletée, sablée

### 3. Affiner la catégorisation manuelle
Parcourir les recettes non catégorisées (is_complete_meal IS NULL) et les classer.

### 4. Créer une logique de planification intelligente
```python
def plan_meal(main_dish):
    if main_dish.is_complete_meal:
        return [main_dish]  # Pas besoin d'accompagnement
    else:
        side_dish = choose_side_dish(main_dish)
        return [main_dish, side_dish]
```

---

## 📈 Impact sur l'application

### Avant :
```json
{
  "meal": "Steak grillé",
  "shopping_list": ["steak"]
}
```
❌ Liste de courses incomplète (manque légumes, féculents)

### Après :
```json
{
  "meal": "Steak grillé",
  "is_complete": false,
  "needs_side_dish": true,
  "suggested_sides": ["Pommes de terre rôties", "Haricots verts"],
  "shopping_list": ["steak", "pommes de terre", "haricots verts", "huile d'olive"]
}
```
✅ Liste de courses complète !

### Avec sous-recettes :
```json
{
  "meal": "Lasagne",
  "is_complete": true,
  "sub_recipes": [
    {"name": "Sauce béchamel", "quantity": 500, "unit": "ml"},
    {"name": "Sauce bolognaise", "quantity": 600, "unit": "ml"}
  ],
  "total_prep_time": 45,  // 15 lasagne + 5 béchamel + 15 bolognaise
  "total_cook_time": 135  // 45 lasagne + 10 béchamel + 90 bolognaise
}
```
✅ Temps de préparation réaliste calculé !

---

## ✅ Validation

Pour vérifier que tout fonctionne :

```sql
-- 1. Vérifier les sauces
SELECT COUNT(*) FROM recipes WHERE role = 'SAUCE';
-- Attendu : 24

-- 2. Vérifier la catégorisation
SELECT 
    COUNT(*) FILTER (WHERE is_complete_meal = TRUE) as plats_complets,
    COUNT(*) FILTER (WHERE needs_side_dish = TRUE) as besoin_accompagnement
FROM recipes WHERE role = 'PLAT_PRINCIPAL';
-- Attendu : ~150 plats complets, ~200 besoin accompagnement

-- 3. Vérifier les liens sous-recettes
SELECT COUNT(DISTINCT sub_recipe_id) 
FROM recipe_ingredients 
WHERE sub_recipe_id IS NOT NULL;
-- Attendu : 5-10 sauces utilisées

-- 4. Exemple concret
SELECT 
    r.name as recette,
    s.name as sous_recette,
    ri.quantity,
    ri.unit
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN recipes s ON s.id = ri.sub_recipe_id
WHERE r.name = 'Lasagne'
  AND ri.sub_recipe_id IS NOT NULL;
-- Attendu : Lasagne → Béchamel, Bolognaise
```

---

## 🎉 Conclusion

Ces améliorations résolvent les 3 problèmes majeurs :

1. ✅ **Sauces gérées** : 24 sauces essentielles + possibilité d'en ajouter 100+
2. ✅ **Plats catégorisés** : Distinction claire plat complet / plat simple
3. ✅ **Sous-recettes liées** : Liens automatiques via recipe_ingredients.sub_recipe_id

**Impact** :
- Planification de repas plus intelligente
- Listes de courses complètes
- Temps de préparation réalistes
- Navigation entre recettes (ex: "Voir la recette de la béchamel")
- Base solide pour des fonctionnalités avancées

🚀 **Prêt à exécuter !**
