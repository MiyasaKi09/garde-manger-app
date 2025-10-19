# 🎨 Guide d'Enrichissement des Recettes

## 📋 Résumé de ce qui a été fait

### ✅ Import initial (600 recettes)
- **Fichier source** : `supabase/batch pour recette (1).txt`
- **Script Python** : `tools/import_recipes.py` (404 lignes)
- **Résultat** : 611 recettes au total dans la base
  - 427 plats principaux (69.9%)
  - 68 desserts (11.1%)
  - 66 entrées (10.8%)
  - 50 accompagnements (8.2%)

### ✅ Tags de base créés
- **Cuisines** : Française, Italienne, Espagnole, Asiatique, Orientale, etc.
- **Régimes** : Végétarien, Vegan
- **Méthodes** : Mijotage, Four, Poêle, etc.

### ✅ Nouveaux tags d'enrichissement créés
- **Difficulté** : Facile, Moyen, Difficile
- **Saisons** : Printemps, Été, Automne, Hiver
- **Usages** : Petit-déjeuner, Apéritif, Fête, Barbecue
- **Profils** : Gourmand, Healthy, Rapide

---

## 🚀 Ce qui reste à faire

### 1. Enrichir toutes les recettes avec les nouveaux tags

#### Méthode automatique (recommandée)
```bash
cd /workspaces/garde-manger-app
./tools/run_enrichment.sh
```

Ce script va :
- Exécuter 13 batches d'enrichissement
- Ajouter **986 associations de tags** automatiquement
- Afficher les statistiques finales

#### Méthode manuelle (si problème avec le script)
Exécutez chaque batch individuellement :
```bash
psql "$DATABASE_URL_TX" -f tools/enrich_batch_01.sql
psql "$DATABASE_URL_TX" -f tools/enrich_batch_02.sql
# ... jusqu'au batch 13
```

---

### 2. Ajouter des ingrédients réalistes aux recettes

Le script `tools/enrich_recipes.py` contient une fonction `generate_ingredients()` qui peut :
- Détecter les ingrédients probables à partir du nom de la recette
- Estimer les quantités
- Créer des associations dans `recipe_ingredients`

**À faire** : Créer un script SQL qui insère les ingrédients pour toutes les recettes

---

### 3. Améliorer les instructions

Actuellement, toutes les recettes ont 3 instructions génériques. Il faudrait :
- Générer des instructions plus détaillées et spécifiques
- Adapter selon le type de recette (dessert, plat principal, etc.)
- Adapter selon la méthode de cuisson (four, poêle, mijotage)

**Exemple de fonction** : `generate_detailed_instructions()` dans `enrich_recipes.py`

---

### 4. Créer des pairings de recettes

Associer automatiquement :
- Plats principaux ↔ Accompagnements
- Entrées ↔ Plats principaux
- Plats principaux ↔ Desserts

**Table à utiliser** : `recipe_pairings`

---

### 5. Affiner les temps de préparation/cuisson

Actuellement, les temps sont génériques (25/45 ou 20/40 minutes). Il faudrait :
- Analyser la complexité réelle de chaque recette
- Ajuster les temps selon :
  - La méthode de cuisson
  - Le nombre d'ingrédients estimé
  - La difficulté

---

## 📊 Statistiques actuelles

### Recettes par catégorie
```sql
SELECT role, COUNT(*) as nb
FROM recipes
GROUP BY role
ORDER BY nb DESC;
```

### Tags les plus utilisés
```sql
SELECT t.name, COUNT(rt.recipe_id) as nb_recettes
FROM tags t
LEFT JOIN recipe_tags rt ON t.id = rt.tag_id
GROUP BY t.id, t.name
ORDER BY nb_recettes DESC
LIMIT 20;
```

### Recettes sans tags
```sql
SELECT COUNT(*)
FROM recipes r
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE rt.id IS NULL;
```

---

## 🛠️ Outils disponibles

### Scripts Python
- `tools/import_recipes.py` - Import initial des recettes
- `tools/enrich_recipes.py` - Fonctions d'enrichissement
- `tools/generate_enrichment.py` - Génération du SQL d'enrichissement
- `tools/split_enrichment.py` - Division en batches

### Scripts SQL
- `tools/enrich_tags.sql` - Création des nouveaux tags (✅ exécuté)
- `tools/enrich_batch_01.sql` à `13.sql` - Batches d'enrichissement
- `tools/enrich_all_recipes.sql` - Version complète (6203 lignes)

### Scripts Shell
- `tools/run_enrichment.sh` - Exécution automatique de tous les batches
- `tools/import_all_recipes.sh` - Script d'import initial (✅ exécuté)

---

## 💡 Prochaines étapes recommandées

1. **Immédiat** : Exécutez `./tools/run_enrichment.sh` pour enrichir toutes les recettes
2. **Court terme** : Vérifiez les résultats avec les requêtes SQL ci-dessus
3. **Moyen terme** : Ajoutez les ingrédients automatiquement
4. **Long terme** : Améliorez les instructions et créez les pairings

---

## 📝 Notes

- Tous les scripts utilisent `ON CONFLICT DO NOTHING` pour éviter les doublons
- Les transactions sont atomiques (BEGIN/COMMIT)
- Les noms de recettes avec apostrophes sont correctement échappés
- Le système est idempotent : vous pouvez réexécuter les scripts sans problème
