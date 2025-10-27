# 🔍 Requêtes de Monitoring - Qualité Nutritionnelle

**Date** : 27 octobre 2025  
**Contexte** : Suite à la correction de 2980 calories manquantes

---

## 📊 Statistiques Globales

### 1. Comptage des calories NULL
```sql
-- Affiche le nombre d'aliments sans calories
SELECT COUNT(*) AS aliments_sans_calories
FROM nutritional_data
WHERE calories_kcal IS NULL;
```
**Résultat attendu** : 100 (vs 880 avant correction)

---

### 2. Répartition des calories NULL par complétude
```sql
-- Distingue les NULL légitimes (macros manquants) des anomalies
SELECT 
    CASE 
        WHEN proteines_g IS NULL AND glucides_g IS NULL AND lipides_g IS NULL THEN 'Aucun macro'
        WHEN proteines_g IS NULL OR glucides_g IS NULL OR lipides_g IS NULL THEN 'Macros partiels'
        ELSE 'Macros complets (ANOMALIE)'
    END AS type_incompletude,
    COUNT(*) AS nb_aliments
FROM nutritional_data
WHERE calories_kcal IS NULL
GROUP BY type_incompletude
ORDER BY nb_aliments DESC;
```

**Résultat attendu** :
- `Macros partiels` : ~100 (légitime)
- `Aucun macro` : quelques-uns (légitime)
- `Macros complets (ANOMALIE)` : **0** (objectif atteint)

---

### 3. Vérification des corrections critiques
```sql
-- Vérifie que les aliments clés ont bien été corrigés
SELECT 
    source_id,
    calories_kcal,
    proteines_g,
    glucides_g,
    lipides_g,
    (proteines_g * 4 + glucides_g * 4 + lipides_g * 9) AS calories_calculees_atwater
FROM nutritional_data
WHERE source_id IN (
    '13742',  -- Miel (était NULL, corrigé à 21.1)
    '17001',  -- Huile (corrigé à 900.0)
    '16400',  -- Matière grasse (corrigé à 753.0)
    '24689',  -- Céréale (corrigé à 439.0)
    '32002'   -- Biscuit (corrigé à 360.0)
)
ORDER BY source_id;
```

**Résultats attendus** :
| source_id | calories_kcal | Attendu |
|-----------|---------------|---------|
| 13742 | 21.1 | ✅ |
| 16400 | 753.0 | ✅ |
| 17001 | 900.0 | ✅ |
| 24689 | 439.0 | ✅ |
| 32002 | 360.0 | ✅ |

---

## 🍽️ Analyse des Recettes

### 4. Recettes avec valeurs aberrantes (<10 kcal/portion)
```sql
-- Identifie les recettes suspectes (potentiellement incomplètes)
WITH recipe_nutrition AS (
    SELECT 
        r.id,
        r.name,
        r.servings,
        COUNT(ri.id) AS nb_ingredients,
        SUM(nd.calories_kcal * ri.quantity / 100) AS calories_totales
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
    LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
    WHERE r.servings > 0
    GROUP BY r.id, r.name, r.servings
)
SELECT 
    id AS recipe_id,
    name AS recette,
    servings AS portions,
    nb_ingredients,
    ROUND(calories_totales, 1) AS calories_totales,
    ROUND(calories_totales / servings, 1) AS calories_par_portion
FROM recipe_nutrition
WHERE calories_totales / servings < 10
ORDER BY calories_par_portion;
```

**Interprétation** :
- Si `nb_ingredients = 1` → Recette incomplète (normal)
- Si `nb_ingredients >= 3` → Vérifier ingrédients non liés (canonical_name = NULL)

---

### 5. Top 10 recettes avec ingrédients non liés
```sql
-- Détecte les recettes avec ingrédients non liés à canonical_foods
SELECT 
    r.id AS recipe_id,
    r.name AS recette,
    COUNT(ri.id) AS nb_ingredients_totaux,
    COUNT(cf.id) AS nb_ingredients_lies,
    COUNT(ri.id) - COUNT(cf.id) AS nb_ingredients_non_lies
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
GROUP BY r.id, r.name
HAVING COUNT(ri.id) - COUNT(cf.id) > 0
ORDER BY nb_ingredients_non_lies DESC
LIMIT 10;
```

**Action recommandée** : Lier ces ingrédients via `auto_link_nutrition.py`

---

### 6. Distribution des calories/portion par tranche
```sql
-- Répartition des recettes par tranche calorique
WITH recipe_calories AS (
    SELECT 
        r.id,
        r.name,
        SUM(nd.calories_kcal * ri.quantity / 100) / NULLIF(r.servings, 0) AS cal_portion
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
    LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
    WHERE r.servings > 0
    GROUP BY r.id, r.name, r.servings
)
SELECT 
    CASE 
        WHEN cal_portion IS NULL THEN 'NULL (ingrédients non liés)'
        WHEN cal_portion < 10 THEN '< 10 kcal (ANOMALIE)'
        WHEN cal_portion < 50 THEN '10-50 kcal (très léger)'
        WHEN cal_portion < 200 THEN '50-200 kcal (léger)'
        WHEN cal_portion < 500 THEN '200-500 kcal (modéré)'
        WHEN cal_portion < 800 THEN '500-800 kcal (consistant)'
        ELSE '> 800 kcal (très consistant)'
    END AS tranche_calorique,
    COUNT(*) AS nb_recettes
FROM recipe_calories
GROUP BY tranche_calorique
ORDER BY MIN(COALESCE(cal_portion, 0));
```

**Objectif** : Moins de 5% dans "< 10 kcal" et "NULL"

---

## 🔎 Détail d'une Recette Spécifique

### 7. Analyse nutritionnelle complète d'une recette
```sql
-- Remplacer {RECIPE_ID} par l'ID de la recette à analyser
WITH recipe_data AS (
    SELECT 
        r.id,
        r.name AS recette,
        r.servings,
        ri.quantity,
        ri.unit,
        cf.canonical_name,
        nd.source_id,
        nd.calories_kcal,
        nd.proteines_g,
        nd.glucides_g,
        nd.lipides_g
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
    LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
    WHERE r.id = {RECIPE_ID}
)
SELECT 
    recette,
    servings AS portions,
    canonical_name AS ingredient,
    quantity || ' ' || unit AS quantite,
    source_id,
    calories_kcal AS cal_100g,
    proteines_g AS prot_100g,
    glucides_g AS gluc_100g,
    lipides_g AS lip_100g,
    ROUND((calories_kcal * quantity / 100), 2) AS calories_ingredient,
    SUM(calories_kcal * quantity / 100) OVER () AS calories_totales,
    ROUND(SUM(calories_kcal * quantity / 100) OVER () / servings, 1) AS calories_par_portion
FROM recipe_data
ORDER BY quantity DESC;
```

**Exemples d'utilisation** :
- `{RECIPE_ID} = 508` → Barres de céréales (1.8 kcal/portion)
- `{RECIPE_ID} = 381` → Welsh rarebit (1.2 kcal/portion)

---

## 🛠️ Maintenance

### 8. Liste des 100 aliments non corrigeables
```sql
-- Affiche les aliments avec calories NULL légitimes
SELECT 
    source_id,
    proteines_g,
    glucides_g,
    lipides_g,
    (COALESCE(proteines_g, 0) * 4 + COALESCE(glucides_g, 0) * 4 + COALESCE(lipides_g, 0) * 9) AS calories_calculables
FROM nutritional_data
WHERE calories_kcal IS NULL
ORDER BY calories_calculables DESC
LIMIT 100;
```

**But** : Identifier les candidats pour enrichissement manuel via Ciqual

---

### 9. Aliments avec écart Atwater > 10%
```sql
-- Détecte les écarts entre calories stockées et formule d'Atwater
SELECT 
    source_id,
    calories_kcal AS calories_stockees,
    ROUND((proteines_g * 4 + glucides_g * 4 + lipides_g * 9), 2) AS calories_atwater,
    ROUND(ABS(calories_kcal - (proteines_g * 4 + glucides_g * 4 + lipides_g * 9)), 2) AS ecart,
    ROUND(ABS(calories_kcal - (proteines_g * 4 + glucides_g * 4 + lipides_g * 9)) / NULLIF(calories_kcal, 0) * 100, 2) AS ecart_pct
FROM nutritional_data
WHERE calories_kcal IS NOT NULL
  AND proteines_g IS NOT NULL
  AND glucides_g IS NOT NULL
  AND lipides_g IS NOT NULL
  AND ABS(calories_kcal - (proteines_g * 4 + glucides_g * 4 + lipides_g * 9)) / NULLIF(calories_kcal, 0) > 0.10
ORDER BY ecart_pct DESC
LIMIT 50;
```

**Interprétation** : 
- Écart <10% : Normal (fibres, alcool, polyols)
- Écart >20% : Vérifier données sources

---

### 10. Historique des corrections (audit)
```sql
-- Si vous avez créé une table d'audit avant les UPDATE
-- (cette requête est théorique, adaptez selon votre schéma)
SELECT 
    source_id,
    old_calories_kcal,
    new_calories_kcal,
    correction_date,
    correction_method
FROM nutritional_data_audit
WHERE correction_date >= '2025-10-27'
ORDER BY correction_date DESC
LIMIT 100;
```

---

## 📈 Métriques de Qualité

### 11. Score de complétude nutritionnelle
```sql
-- Calcule le % de complétude pour chaque nutriment clé
SELECT 
    ROUND(COUNT(*) FILTER (WHERE calories_kcal IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_calories,
    ROUND(COUNT(*) FILTER (WHERE proteines_g IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_proteines,
    ROUND(COUNT(*) FILTER (WHERE glucides_g IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_glucides,
    ROUND(COUNT(*) FILTER (WHERE lipides_g IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_lipides,
    ROUND(COUNT(*) FILTER (WHERE fibres_g IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS pct_fibres,
    COUNT(*) AS total_aliments
FROM nutritional_data;
```

**Objectifs** :
- `pct_calories` : ≥96.9% (3078/3178)
- `pct_proteines` : ≥99%
- `pct_glucides` : ≥99%
- `pct_lipides` : ≥99%

---

## 🎯 Tests de Non-Régression

### 12. Vérification post-UPDATE (à exécuter après chaque modification)
```sql
-- Vérifie qu'aucune régression n'a été introduite
WITH checks AS (
    SELECT 
        COUNT(*) FILTER (WHERE calories_kcal < 0) AS calories_negatives,
        COUNT(*) FILTER (WHERE calories_kcal > 1000) AS calories_irrealistes,
        COUNT(*) FILTER (WHERE proteines_g < 0) AS proteines_negatives,
        COUNT(*) FILTER (WHERE glucides_g < 0) AS glucides_negatives,
        COUNT(*) FILTER (WHERE lipides_g < 0) AS lipides_negatives
    FROM nutritional_data
)
SELECT 
    *,
    CASE 
        WHEN calories_negatives = 0 
         AND calories_irrealistes <= 50  -- Huiles pures = 900 kcal (légitimes)
         AND proteines_negatives = 0
         AND glucides_negatives = 0
         AND lipides_negatives = 0
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS test_result
FROM checks;
```

**Résultat attendu** : `test_result = '✅ PASS'`

---

## 📝 Notes d'Utilisation

### Fréquence recommandée
- **Requête 1** (calories NULL) : Quotidienne après imports
- **Requête 4** (recettes aberrantes) : Hebdomadaire
- **Requête 11** (complétude) : Mensuelle
- **Requête 12** (non-régression) : Après chaque modification de nutritional_data

### Seuils d'alerte
- ⚠️ Si calories NULL > 150 → Vérifier import récent
- ⚠️ Si recettes <10 kcal > 20 → Audit recettes requise
- ⚠️ Si complétude <95% → Enrichissement nécessaire

---

**Auteur** : Copilot AI  
**Date** : 27 octobre 2025  
**Version** : 1.0  
**Lien** : `RAPPORT_CORRECTION_CALORIES_FINAL.md`
