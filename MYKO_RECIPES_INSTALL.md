# 🌿 Myko Recipes Database - Guide d'Installation

## 📋 Vue d'ensemble

Système de recettes intelligent pour Myko qui s'intègre parfaitement avec votre architecture inventory existante (canonical_foods, cultivars, archetypes, products, inventory_lots).

## 🚀 Installation - Ordre d'Exécution

### Prérequis
- Supabase configuré avec les tables existantes : `canonical_foods`, `cultivars`, `archetypes`, `products`, `inventory_lots`
- Authentification Supabase active (`auth.users`)

### Étape 1: Tables Principales
```sql
-- Exécuter dans Supabase SQL Editor
\i myko_database_main.sql
```
**Contenu:** Tables de base, index, RLS, triggers

### Étape 2: Données d'Exemple
```sql
-- Exécuter après l'étape 1
\i myko_sample_data.sql
```
**Contenu:** Catégories, techniques de cuisson, profils nutritionnels, recettes d'exemple

### Étape 3: Intelligence Avancée
```sql
-- Exécuter après l'étape 2
\i myko_functions.sql
```
**Contenu:** Fonctions de calcul, triggers automatiques, vues intelligentes

## 🏗️ Architecture Créée

### Tables Principales
- `recipes` - Recettes avec scoring Myko automatique
- `recipe_ingredients` - Connecté à votre inventory (product_type + product_id)
- `recipe_steps` - Étapes avec techniques de cuisson
- `recipe_categories` - Catégories avec compatibilité repas
- `cooking_techniques` - Impact nutritionnel des cuissons
- `smart_substitutions` - Substitutions automatiques
- `meal_planning` - Planning connecté à l'inventory

### Fonctionnalités Intelligentes

#### 🧮 Calcul Nutritionnel Automatique
- Extraction depuis `nutrition_profile` des tables existantes
- Conversion d'unités automatique (utilise `density_g_per_ml`, `grams_per_unit`)
- Impact des techniques de cuisson sur les nutriments
- Calcul par portion automatique

#### ⭐ Score Myko (0-100 points)
- **Nutrition (30pts):** Équilibre calorique, protéines, fibres, vitamines
- **Inventory (30pts):** % ingrédients disponibles + bonus anti-gaspi
- **Saisonnier (15pts):** Bonus selon saison actuelle
- **Régimes (15pts):** Bonus végétarien, végan, sans gluten, etc.
- **Complexité (-20pts):** Malus selon temps de préparation

#### 🔄 Substitutions Automatiques
- **Canonical → Cultivars:** Auto-générées (tomate → tomate cerise)
- **Intelligence contextuelle:** Différents ratios selon usage (sauce vs salade)
- **Score de compatibilité:** Évaluation qualité de la substitution

#### 📅 Planning Intelligent
- Suggestions basées sur inventory disponible
- Priorité aux ingrédients qui expirent bientôt
- Gestion des restes → création automatique `inventory_lots`

## 🔗 Intégration avec Votre Système

### Compatibilité Inventory
```sql
-- Même système de référence que inventory_lots
product_type VARCHAR(20) -- 'canonical', 'cultivar', 'archetype', 'product'
product_id BIGINT       -- ID vers canonical_foods.id, cultivars.id, etc.
```

### Logique Nutritionnelle
```sql
-- Hiérarchie nutrition (ordre de priorité)
1. nutrition_override (products, cultivars)
2. nutrition_profile (archetypes, canonical_foods)
3. Valeurs par défaut
```

### Calcul des Techniques de Cuisson
```sql
-- Exemple: Vitamine C
'Cru' -> 100% retention
'Vapeur' -> 85% retention  
'Bouilli' -> 50% retention (perte dans l'eau)
'Frit' -> 40% retention
```

## 📊 Vues Disponibles

### `recipes_complete`
Recettes enrichies avec:
- Informations des tables de référence
- Statistiques d'ingrédients
- Disponibilité inventory en temps réel
- Saisonnalité actuelle

### `recipes_with_inventory` 
Focus sur la compatibilité inventory:
- Pourcentage d'ingrédients disponibles
- Compte des ingrédients qui expirent bientôt
- Score de faisabilité

## 🛠️ Fonctions Utilitaires

### Recommandations Intelligentes
```sql
SELECT * FROM get_recommended_recipes('user-uuid', 10);
-- Retourne les meilleures recettes selon inventory disponible
```

### Recalcul des Scores
```sql
SELECT * FROM recalculate_all_myko_scores();
-- Force le recalcul de tous les scores Myko
```

### Génération Automatique de Substitutions
```sql
SELECT * FROM auto_generate_canonical_substitutions();
-- Génère les substitutions canonical → cultivars
```

## 🔒 Sécurité (RLS)

### Politiques Configurées
- **Recettes:** Utilisateurs voient recettes publiques + leurs recettes privées
- **Planning:** Chaque utilisateur voit son propre planning
- **Modification:** Utilisateurs modifient seulement leurs recettes

## 🧪 Test du Système

### Vérification Installation
```sql
-- Compter les tables créées
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'recipe%' OR table_name LIKE 'cooking%' OR table_name LIKE 'smart%';

-- Vérifier les recettes d'exemple
SELECT title, myko_score, inventory_compatibility_score 
FROM recipes_complete 
ORDER BY myko_score DESC;
```

### Test avec Vos Données
```sql
-- Adapter avec vos vrais IDs de produits
INSERT INTO recipe_ingredients (recipe_id, product_type, product_id, quantity, unit) VALUES
((SELECT id FROM recipes LIMIT 1), 'canonical', [VOTRE_ID_TOMATE], 500, 'g');

-- Le score se recalculera automatiquement !
```

## 🎯 Prochaines Étapes

1. **Exécuter les 3 fichiers SQL** dans l'ordre
2. **Adapter les exemples** avec vos vrais IDs de produits
3. **Créer vos premières recettes** via l'interface
4. **Tester les recommandations** basées sur votre inventory

Le système est maintenant prêt pour l'intégration dans votre application Next.js ! 🚀