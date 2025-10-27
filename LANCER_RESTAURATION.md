# 🎯 Guide d'exécution rapide - Restauration complète

## ✨ Ce qui a été créé

J'ai préparé un **système complet de restauration** avec 4 scripts prêts à l'emploi :

### 📦 Scripts disponibles

1. **`tools/restore_all.sh`** ⭐ **SCRIPT PRINCIPAL**
   - Exécute tout automatiquement en 3 étapes
   - Restaure 227 canonical_foods + 3487 recipe_ingredients
   - Importe 3178 aliments Ciqual (33 colonnes nutritionnelles)
   - Lie 16 légumes de base aux codes Ciqual

2. **`tools/restore_from_latest_export.sh`**
   - Restaure depuis `supabase/exports/latest/`
   - Utilise les CSV exportés le 27 octobre 2025 (14h53 UTC)

3. **`tools/reimport_ciqual_secure.sh`**
   - Réimporte Ciqual SANS CASCADE (sécurisé)
   - 33 colonnes : macros + fibres + 13 vitamines + 10 minéraux + acides gras

4. **`tools/link_canonical_to_ciqual.sql`**
   - SQL pour lier 16 aliments de base (légumes)

---

## 🚀 Exécution (1 commande !)

```bash
cd /workspaces/garde-manger-app
bash tools/restore_all.sh
```

Le script va :
1. ✅ Restaurer canonical_foods et recipe_ingredients
2. ✅ Réimporter Ciqual avec micronutriments
3. ✅ Lier les aliments de base
4. ✅ Tester une recette pour vérifier que ça marche

**Durée estimée** : 1-2 minutes

---

## 📋 Ce qui sera restauré

### Données (depuis export du 27 oct 2025)
- **227 canonical_foods** (pomme de terre, tomate, carotte, etc.)
- **3487 recipe_ingredients** (liens recette ↔ ingrédients)
- **878 recipes** (déjà présentes, non touchées)

### Données nutritionnelles (Ciqual 2020)
- **3178 aliments** avec profil complet
- **33 colonnes nutritionnelles** :
  - Macros : calories, protéines, glucides, lipides
  - Fibres et sucres
  - Acides gras : saturés, monoinsaturés, polyinsaturés, cholestérol
  - **13 vitamines** : A, D, E, K, C, B1-B12
  - **10 minéraux** : Ca, Fe, Mg, K, Na, Zn, Cu, Se, I

### Liens automatiques
- **16 légumes de base** liés aux codes Ciqual
  - Pomme de terre, tomate, carotte, oignon, échalote, ail
  - Poireau, courgette, aubergine, poivron, haricot vert
  - Brocoli, chou-fleur, épinard, salade, concombre

---

## 🧪 Après la restauration

### Tester le calcul nutritionnel

```sql
-- Trouver une recette testable
SELECT r.id, r.name 
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
WHERE cf.nutrition_id IS NOT NULL
LIMIT 5;

-- Tester avec un ID (exemple: 142)
SELECT * FROM calculate_recipe_nutrition(142);

-- Voir les micronutriments
SELECT * FROM get_recipe_micronutrients(142);
```

### Vérifier les données

```sql
SELECT 
    COUNT(*) AS total,
    COUNT(nutrition_id) AS avec_nutrition
FROM canonical_foods;

-- Devrait afficher : 227 total, ~16 avec nutrition
```

---

## 📊 Résultat attendu

Après exécution, vous aurez :

```
canonical_foods:          227 rows (✅ restauré)
  └─ avec nutrition_id:    16 rows (légumes de base liés)

recipe_ingredients:      3487 rows (✅ restauré)

nutritional_data:        3178 rows (✅ importé avec 33 colonnes)

recipes:                  878 rows (✅ intact)
```

---

## ⚠️ En cas de problème

### Erreur de connexion
```bash
# Vérifier que .env.local existe
cat .env.local

# Tester la connexion
source .env.local
psql "$DATABASE_URL_TX" -c "SELECT version();"
```

### CSV manquant
```bash
# Vérifier l'export
ls -lh supabase/exports/latest/csv/

# Régénérer le CSV Ciqual si besoin
bash tools/import_ciqual.sh
```

### Relancer une étape spécifique
```bash
# Juste la restauration
bash tools/restore_from_latest_export.sh

# Juste Ciqual
bash tools/reimport_ciqual_secure.sh

# Juste les liens
source .env.local
psql "$DATABASE_URL_TX" -f tools/link_canonical_to_ciqual.sql
```

---

## 🎯 Prochaines étapes (après restauration)

1. **Lier les 211 canonical_foods restants**
   - Script de matching automatique (à créer)
   - Ou liens manuels pour les 50 aliments les plus fréquents

2. **Mettre à jour le frontend**
   - Étendre `recipe_nutrition_cache` avec micronutriments
   - Enrichir `NutritionFacts.jsx` avec vitamines/minéraux
   - Afficher % AJR (Apports Journaliers Recommandés)

3. **Facteurs de cuisson pour micronutriments**
   - Rétention vitamine C : ébullition -50%, vapeur -25%
   - Étendre `cooking_nutrition_factors`

---

## 📚 Documentation complète

- **Guide complet** : `tools/README_RESTORE.md`
- **Architecture système** : `SYSTEME_NUTRITIONNEL.md`
- **Micronutriments** : `EXTENSION_MICRONUTRIMENTS.md`
- **Intégration Ciqual** : `GUIDE_INTEGRATION_CIQUAL.md`

---

## ✅ Prêt à lancer ?

```bash
bash tools/restore_all.sh
```

🎉 C'est parti !
