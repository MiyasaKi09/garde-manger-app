# 🔄 Scripts de Restauration et Import Nutritionnel

## 📋 Vue d'ensemble

Ce dossier contient les scripts pour restaurer les données et importer le système nutritionnel complet.

## 🚀 Utilisation rapide

### Option 1 : Script maître (RECOMMANDÉ)

```bash
cd /workspaces/garde-manger-app
bash tools/restore_all.sh
```

Ce script exécute automatiquement les 3 étapes :
1. Restauration depuis export (canonical_foods + recipe_ingredients)
2. Réimport Ciqual sécurisé (3178 aliments, 33 colonnes)
3. Lien des aliments de base aux codes Ciqual

### Option 2 : Scripts individuels

Si vous voulez exécuter les étapes séparément :

```bash
# Étape 1 : Restaurer canonical_foods et recipe_ingredients
bash tools/restore_from_latest_export.sh

# Étape 2 : Réimporter Ciqual (SANS TRUNCATE CASCADE)
bash tools/reimport_ciqual_secure.sh

# Étape 3 : Lier canonical_foods aux données Ciqual
source .env.local
psql "$DATABASE_URL_TX" -f tools/link_canonical_to_ciqual.sql
```

---

## 📁 Scripts disponibles

### `restore_all.sh` ⭐ (Script maître)
**Usage** : `bash tools/restore_all.sh`

Restauration complète en 3 étapes automatiques :
- Restaure 227 canonical_foods
- Restaure 3487 recipe_ingredients
- Importe 3178 aliments Ciqual (33 colonnes)
- Lie 16 légumes de base aux codes Ciqual

### `restore_from_latest_export.sh`
**Usage** : `bash tools/restore_from_latest_export.sh`

Restaure les données depuis `supabase/exports/latest/` :
- `canonical_foods.csv` → 227 aliments
- `recipe_ingredients.csv` → 3487 liens recette-ingrédient

**Sécurité** : Utilise `TRUNCATE` (pas CASCADE) pour préserver les autres tables.

### `reimport_ciqual_secure.sh`
**Usage** : `bash tools/reimport_ciqual_secure.sh`

Réimporte les données nutritionnelles Ciqual :
- **Méthode** : `DELETE FROM nutritional_data` (PAS de TRUNCATE CASCADE)
- **Source** : `data/ciqual_dedup.csv` (généré par `import_ciqual.sh`)
- **Colonnes** : 33 (macros + fibres + vitamines + minéraux + acides gras)
- **Lignes** : 3178 aliments

**Prérequis** : Le fichier `data/ciqual_dedup.csv` doit exister (généré par `import_ciqual.sh`)

### `link_canonical_to_ciqual.sql`
**Usage** : `psql "$DATABASE_URL_TX" -f tools/link_canonical_to_ciqual.sql`

Lie les aliments de base aux codes Ciqual :
- Pomme de terre → 4003
- Tomate → 20047
- Carotte → 20008
- Oignon → 20034
- Échalote → 20068
- Ail → 11000
- Poireau → 20043
- Courgette → 20041
- Aubergine → 20053
- Poivron → 20151
- Haricot vert → 20061
- Brocoli → 20009
- Chou-fleur → 20013
- Épinard → 20059
- Salade → 20038
- Concombre → 20019

**Total** : 16 aliments liés (sur 227 canonical_foods)

### `import_ciqual.sh` (Script d'origine)
**Usage** : `bash tools/import_ciqual.sh`

Génère le CSV Ciqual depuis `data/mapping_canonical_ciqual.csv` :
- **Input** : `data/mapping_canonical_ciqual.csv` (3188 lignes, ISO-8859-1)
- **Output** : `data/ciqual_nutrition_import.csv` + `data/ciqual_dedup.csv`
- **Extraction** : 33 colonnes nutritionnelles
- **Parsing** : Gère `,` → `.`, `< 0.5` → `0.5`, `traces` → NULL

⚠️ **ATTENTION** : Ce script ne fait PAS l'import en base, seulement la génération du CSV.

---

## ⚠️ Sécurité et prévention

### Pourquoi `DELETE` et pas `TRUNCATE` ?

```sql
-- ❌ DANGEREUX : Supprime aussi les tables liées
TRUNCATE TABLE nutritional_data RESTART IDENTITY CASCADE;

-- ✅ SÛR : Supprime seulement nutritional_data
DELETE FROM nutritional_data;
```

Le mot-clé `CASCADE` dans `TRUNCATE` propage la suppression aux tables avec foreign keys :
- `canonical_foods.nutrition_id` → Table vidée
- `recipe_ingredients` (via canonical_foods) → Table vidée

### Sauvegarde automatique

Les exports sont automatiquement générés dans `supabase/exports/latest/` par GitHub Actions.

---

## 🧪 Tests post-restauration

### Vérifier les données

```sql
-- Compter les lignes
SELECT 
    'canonical_foods' AS table_name, COUNT(*) AS rows FROM canonical_foods
UNION ALL
SELECT 'recipe_ingredients', COUNT(*) FROM recipe_ingredients
UNION ALL
SELECT 'nutritional_data', COUNT(*) FROM nutritional_data;

-- Vérifier les liens
SELECT COUNT(*) AS nb_liens 
FROM canonical_foods 
WHERE nutrition_id IS NOT NULL;
```

### Test calcul nutritionnel

```sql
-- Trouver une recette testable
SELECT r.id, r.name, COUNT(cf.nutrition_id) AS nb_nutrients
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
WHERE cf.nutrition_id IS NOT NULL
GROUP BY r.id, r.name
HAVING COUNT(cf.nutrition_id) >= 2
LIMIT 5;

-- Tester avec l'ID trouvé
SELECT * FROM calculate_recipe_nutrition(142);
SELECT * FROM get_recipe_micronutrients(142);
```

---

## 📊 Structure des données

### Export `supabase/exports/latest/`

```
csv/
├── canonical_foods.csv          (227 lignes)
├── recipe_ingredients.csv       (3487 lignes)
├── recipes.csv                  (878 lignes)
├── cooking_nutrition_factors.csv (69 lignes)
└── nutritional_data.csv         (0 lignes - vide car export avant import)
```

### Données Ciqual

```
data/
├── mapping_canonical_ciqual.csv  (3188 lignes, source Ciqual)
├── ciqual_nutrition_import.csv   (généré, 3180 lignes)
└── ciqual_dedup.csv              (dédupliqué, 3178 lignes)
```

---

## 🎯 Feuille de route

### ✅ Fait
- [x] Script de restauration depuis export
- [x] Réimport Ciqual sécurisé (33 colonnes)
- [x] Lien 16 légumes de base
- [x] Fonction `get_recipe_micronutrients()`
- [x] Documentation complète

### 🔄 En cours
- [ ] Lier les 211 canonical_foods restants (script matching automatique)
- [ ] Étendre recipe_nutrition_cache avec micronutriments
- [ ] Mettre à jour NutritionFacts.jsx avec vitamines/minéraux

### 📅 À venir
- [ ] Facteurs de cuisson pour micronutriments (vitamine C, etc.)
- [ ] Affichage % AJR (Apports Journaliers Recommandés)
- [ ] Export PDF des valeurs nutritionnelles

---

## 🆘 Dépannage

### Problème : "psql: command not found"

Vérifiez que `DATABASE_URL_TX` est défini :
```bash
source .env.local
echo $DATABASE_URL_TX
```

### Problème : "data/ciqual_dedup.csv not found"

Générez le CSV d'abord :
```bash
bash tools/import_ciqual.sh
```

### Problème : "duplicate key violation"

Nettoyez la table avant :
```sql
DELETE FROM nutritional_data;
```

Puis relancez l'import.

### Problème : "Table is empty after restore"

Vérifiez que l'export existe :
```bash
ls -lh supabase/exports/latest/csv/
```

Si vide, utilisez un export manuel ou Time Travel Supabase.

---

## 📚 Ressources

- **Documentation système** : `SYSTEME_NUTRITIONNEL.md`
- **Extension micronutriments** : `EXTENSION_MICRONUTRIMENTS.md`
- **Guide Ciqual** : `GUIDE_INTEGRATION_CIQUAL.md`

---

**Dernière mise à jour** : 27 octobre 2025  
**Version** : 2.0 - Restauration complète avec micronutriments
