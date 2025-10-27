# 📊 Système Nutritionnel - Documentation Technique

## ✅ État d'Implémentation

### Composants Créés

1. **Base de données**
   - ✅ Table `nutritional_data` (existante)
   - ✅ Table `cooking_nutrition_factors` (73 coefficients importés)
   - ✅ Fonction PostgreSQL `calculate_recipe_nutrition()`

2. **Données scientifiques**
   - ✅ 73 coefficients de cuisson importés (9 méthodes)
   - ✅ Basés sur USDA et ANSES
   - ✅ Couvre : vitamines, macronutriments, minéraux

3. **Frontend**
   - ✅ Composant `NutritionFacts.jsx`
   - ✅ CSS avec design moderne
   - ✅ Intégré dans `/app/recipes/[id]/page.js`

4. **Documentation**
   - ✅ `GUIDE_INTEGRATION_CIQUAL.md` (guide complet)
   - ✅ `data/cooking_factors.csv` (données sources)
   - ✅ Scripts SQL prêts à l'emploi

---

## 🎯 Fonctionnement

### Calcul Nutritionnel

```javascript
// Frontend
<NutritionFacts recipeId={142} servings={1} />

// Backend (PostgreSQL)
SELECT * FROM calculate_recipe_nutrition(142);
```

### Flux de Données

```
1. Recipe Ingredients (recipe_ingredients)
   ↓
2. Canonical Foods (canonical_foods)
   ↓
3. Nutritional Data (nutritional_data)
   ↓
4. Apply Cooking Factors (cooking_nutrition_factors)
   ↓
5. Calculate per Serving
   ↓
6. Display in UI (NutritionFacts component)
```

---

## 📥 Prochaines Étapes

### 1. Importer les Données Ciqual

**Objectif** : Lier les 227 `canonical_foods` aux données nutritionnelles Ciqual

**Actions** :

```bash
# 1. Télécharger Ciqual 2020
wget https://ciqual.anses.fr/...

# 2. Créer le mapping manuel
# Éditer: data/mapping_canonical_ciqual.csv
canonical_food_id,ciqual_code,alim_nom_fr,confidence
1,11058,"Pomme de terre, cuite à l'eau",HIGH
2,20009,"Carotte, crue",HIGH
...

# 3. Exécuter le script d'import
python3 tools/import_ciqual_nutrition.py
```

**Résultat attendu** : 227 entrées dans `nutritional_data`, liées via `canonical_foods.nutrition_id`

---

### 2. Enrichir `nutritional_data`

**Colonnes manquantes** :

```sql
ALTER TABLE nutritional_data
ADD COLUMN fibres_g NUMERIC(10,2),
ADD COLUMN sel_g NUMERIC(10,2),
ADD COLUMN calcium_mg NUMERIC(10,2),
ADD COLUMN fer_mg NUMERIC(10,2),
ADD COLUMN vitamine_c_mg NUMERIC(10,2),
ADD COLUMN vitamine_d_ug NUMERIC(10,2),
ADD COLUMN folates_ug NUMERIC(10,2),
ADD COLUMN vitamine_b1_mg NUMERIC(10,2),
ADD COLUMN vitamine_b2_mg NUMERIC(10,2),
ADD COLUMN vitamine_b6_mg NUMERIC(10,2),
ADD COLUMN vitamine_b12_ug NUMERIC(10,2),
ADD COLUMN vitamine_e_mg NUMERIC(10,2);
```

---

### 3. Améliorer le Composant UI

**Fonctionnalités supplémentaires** :

- [ ] Afficher les micronutriments (vitamines, minéraux)
- [ ] Graphique de répartition (% calories par macronutriment)
- [ ] Comparaison avec AJR (Apports Journaliers Recommandés)
- [ ] Ajustement dynamique selon le nombre de portions
- [ ] Export PDF/image des valeurs nutritionnelles

**Exemple** :

```jsx
<NutritionFacts 
  recipeId={142} 
  servings={portions}
  showMicronutrients={true}
  showChart={true}
/>
```

---

## 🔬 Coefficients de Cuisson Implémentés

### Méthodes Disponibles

| Méthode | Nb Facteurs | Nutriments Couverts |
|---------|-------------|---------------------|
| `ebullition` | 9 | Vitamines B, C, macronutriments, minéraux |
| `vapeur` | 9 | Vitamines B, C, macronutriments, minéraux |
| `friture` | 5 | Vitamines C, E, macronutriments (+15% lipides) |
| `gril` | 6 | Vitamines B, C, macronutriments |
| `roti` | 7 | Vitamines B, C, E, macronutriments |
| `saute` | 6 | Vitamines B, C, E, macronutriments (+8% lipides) |
| `micro-ondes` | 7 | Vitamines B, C, macronutriments |
| `braise` | 6 | Vitamines B, C, macronutriments |
| `blanchi` | 5 | Vitamines, macronutriments |
| `cru` | 9 | Référence (100% rétention) |

### Exemples de Facteurs

**Vitamine C** (très sensible à la chaleur et l'eau) :
- Cru : 100%
- Micro-ondes : 80%
- Vapeur : 75%
- Blanchi : 70%
- Sauté : 60%
- Ébullition : 50%
- Rôti : 45%
- Gril : 40%
- Braise : 35%
- Friture : 30%

**Protéines** (très stables) :
- Toutes méthodes : 94-99%

**Lipides** :
- Cuissons sèches : 90-97% (perte)
- Friture : 115% (absorption +15%)
- Sauté : 108% (absorption +8%)

---

## 🧪 Tests et Validation

### Test Unitaire de la Fonction

```sql
-- Test sur une recette existante
SELECT * FROM calculate_recipe_nutrition(142);

-- Résultat attendu (exemple):
--  nutrient_name | value_per_serving | unit | value_total
-- ---------------+-------------------+------+-------------
--  Calories      |            285.5  | kcal |      1142.0
--  Protéines     |             12.3  | g    |        49.2
--  Glucides      |             35.2  | g    |       140.8
--  Lipides       |              8.9  | g    |        35.6
```

### Vérifications

```sql
-- 1. Vérifier que les coefficients sont bien importés
SELECT COUNT(*) FROM cooking_nutrition_factors;
-- Attendu: 73

-- 2. Vérifier les coefficients pour une méthode
SELECT * FROM cooking_nutrition_factors WHERE cooking_method = 'vapeur';

-- 3. Vérifier les recettes avec données nutritionnelles
SELECT 
    r.id,
    r.name,
    r.cooking_method,
    COUNT(ri.id) AS nb_ingredients,
    COUNT(nd.id) AS nb_with_nutrition
FROM recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN canonical_foods cf ON cf.id = COALESCE(
    ri.canonical_food_id,
    (SELECT a.canonical_food_id FROM archetypes a WHERE a.id = ri.archetype_id)
)
LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
WHERE r.id IN (142, 2, 9)
GROUP BY r.id, r.name, r.cooking_method;
```

---

## 📊 Statistiques Actuelles

### Base de Données

- **Recipes** : 878 recettes
- **Recipe Ingredients** : 3487 ingrédients
- **Canonical Foods** : 227 aliments de base
- **Nutritional Data** : 0 (à importer depuis Ciqual)
- **Cooking Factors** : 73 coefficients

### Couverture

- **Recettes avec ingrédients** : 766/878 (87%)
- **Recettes avec nutrition** : 0/878 (0% - en attente import Ciqual)

**Objectif** : 227/227 canonical_foods liés à Ciqual = 100% coverage

---

## 🔧 Maintenance

### Ajouter une Nouvelle Méthode de Cuisson

```sql
-- Exemple: "poché"
INSERT INTO cooking_nutrition_factors (cooking_method, nutrient_name, factor_type, factor_value)
VALUES
  ('poche', 'vitamine_c', 'RETENTION', 0.65),
  ('poche', 'vitamine_b1', 'RETENTION', 0.75),
  ('poche', 'proteines', 'RETENTION', 0.98),
  ('poche', 'glucides', 'RETENTION', 0.99),
  ('poche', 'lipides', 'RETENTION', 0.97);
```

### Mettre à Jour un Coefficient

```sql
-- Si de nouvelles études scientifiques sont publiées
UPDATE cooking_nutrition_factors
SET factor_value = 0.55  -- Nouvelle valeur
WHERE cooking_method = 'ebullition'
  AND nutrient_name = 'vitamine_c'
  AND factor_type = 'RETENTION';
```

---

## 📚 Ressources Externes

### Sources de Données

1. **Ciqual** (ANSES - France)
   - URL : https://ciqual.anses.fr/
   - Couverture : ~3000 aliments
   - Mise à jour : Annuelle

2. **USDA FoodData Central** (États-Unis)
   - URL : https://fdc.nal.usda.gov/
   - Couverture : ~350 000 aliments
   - Format : API REST + CSV

3. **Coefficients de Rétention USDA**
   - Document : "USDA Table of Nutrient Retention Factors"
   - Source scientifique de référence

### Littérature Scientifique

- Bergström, L. (1994). "Nutrient losses and gains in the preparation of foods"
- Bognár, A. (2002). "Tables on Weight Yield of Food and Retention Factors of Food Constituents"
- ANSES (2020). "Table de composition nutritionnelle des aliments Ciqual"

---

## ✨ Améliorations Futures

### Court Terme (1-2 semaines)

- [ ] Import complet des données Ciqual (227 aliments)
- [ ] Ajout des micronutriments (12 colonnes supplémentaires)
- [ ] Tests utilisateurs sur 10 recettes

### Moyen Terme (1-2 mois)

- [ ] Graphiques nutritionnels interactifs
- [ ] Comparaison avec AJR (Apports Journaliers Recommandés)
- [ ] Export PDF des informations nutritionnelles
- [ ] Filtrage recettes par critères nutritionnels

### Long Terme (3-6 mois)

- [ ] Recommandations nutritionnelles personnalisées
- [ ] Suivi nutritionnel hebdomadaire/mensuel
- [ ] Intégration avec objectifs santé utilisateur
- [ ] IA pour suggestions d'amélioration nutritionnelle

---

## 🎓 Guide de Contribution

### Ajouter un Nouvel Aliment Ciqual

1. Identifier le code Ciqual
2. Ajouter dans `mapping_canonical_ciqual.csv`
3. Ré-exécuter `import_ciqual_nutrition.py`
4. Vérifier avec `SELECT * FROM nutritional_data WHERE source_id = 'CODE';`

### Ajuster un Coefficient de Cuisson

1. Trouver la source scientifique
2. Ajouter la référence dans `cooking_factors.csv`
3. Mettre à jour la base avec `UPDATE cooking_nutrition_factors ...`
4. Documenter dans le commit Git

---

**Créé le** : 26 octobre 2025  
**Dernière mise à jour** : 26 octobre 2025  
**Auteur** : Système de Garde-Manger Intelligent  
**Version** : 1.0
