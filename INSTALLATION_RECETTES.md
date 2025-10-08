# 🚀 Installation Express - Recettes Myko

## Étapes à suivre dans Supabase :

### 1. Exécuter le script des 100 recettes
```sql
-- Dans Supabase SQL Editor, exécuter :
-- Copier-coller le contenu de myko_100_recipes.sql
```

### 2. Vérifier que tout fonctionne
```sql
-- Test rapide :
SELECT COUNT(*) as total_recipes FROM recipes WHERE is_active = true;
SELECT COUNT(*) as total_categories FROM recipe_categories;
SELECT * FROM recipes_complete LIMIT 5;
```

### 3. Optionnel : Ajouter des ingrédients fictifs pour tester
```sql
-- Si vous voulez voir des recettes avec ingrédients :
-- (Remplacer 999 par de vrais IDs de votre inventory)

INSERT INTO recipe_ingredients (recipe_id, product_type, product_id, quantity, unit, ingredient_group) 
SELECT 
    id,
    'canonical',
    999, -- Remplacer par un vrai ID de canonical_foods
    500,
    'g',
    'base'
FROM recipes 
WHERE slug = 'ratatouille-provencale';
```

## Résultat attendu :
- ✅ 100+ recettes dans la base
- ✅ Page /recipes fonctionnelle avec scores Myko
- ✅ Filtres par catégorie, cuisine, régime
- ✅ Tri par score Myko et disponibilité inventory

## Prochaine étape :
Une fois les recettes chargées, nous pourrons :
1. Créer l'interface de création de recettes
2. Intégrer la sélection de recettes au planning
3. Connecter avec de vrais produits de votre inventory