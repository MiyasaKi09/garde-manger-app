# 📘 Schéma de Base de Données - Garde-Manger App

## Document de Référence
Basé sur : **"Blueprint Architectural pour un Écosystème Culinaire Intelligent : Reconstruction d'un Schéma Relationnel"**

---

## ✅ Structure Actuelle Conforme au Document

### 1. Hiérarchie Alimentaire à 4 Niveaux

#### Niveau 1 : `canonical_foods` (Concept)
- **Rôle** : Racine abstraite (ex: "Pomme", "Tomate", "Poulet")
- **Colonnes clés** : `id`, `canonical_name`, `category_id`, `nutrition_id`
- **Status** : ✅ Implémenté correctement

#### Niveau 2 : `cultivars` (Variété)
- **Rôle** : Variétés biologiques (ex: "Granny Smith", "San Marzano")
- **Colonnes clés** : `id`, `canonical_food_id`, `cultivar_name`
- **Status** : ✅ Implémenté correctement

#### Niveau 3 : `archetypes` (Forme/Processus)
- **Rôle** : États transformés (ex: "Compote de pommes", "Tomates en conserve")
- **Colonnes clés** : `id`, `canonical_food_id`, `cultivar_id`, `process`, `shelf_life_days`
- **Status** : ✅ Implémenté correctement
- **Note** : **Pont critique** entre recettes et inventaire

#### Niveau 4 : `products` (SKU Commercial)
- **Rôle** : Produits achetables (ex: "Compote Andros 720g")
- **Colonnes clés** : `id` (UUID), `archetype_id`, `brand`, `ean`, `package_size`
- **Status** : ✅ Implémenté correctement

---

### 2. Modèle de Recettes Déconstruit

#### Table `recipes`
- **Champs essentiels** : `name`, `description`, `prep_time_minutes`, `cook_time_minutes`, `servings`
- **Champ taxonomique** : `role` (ENUM: ENTREE, PLAT_PRINCIPAL, DESSERT, ACCOMPAGNEMENT)
- **Champ méthode** : `cooking_method`
- **Status** : ✅ Implémenté - 611 recettes

#### Table `recipe_ingredients` 
- **Rôle** : Jonction recette ↔ ingrédients
- **Clés étrangères** : `archetype_id`, `canonical_food_id`, `sub_recipe_id` (tous NULLABLE)
- **Attributs** : `quantity`, `unit`, `notes`
- **Status** : ✅ Support sous-recettes inclus
- **Principe clé** : Découplag recettes/marques - les recettes demandent des archétypes, pas des produits

#### Table `instructions`
- **Rôle** : Instructions ordonnées
- **Champs** : `recipe_id`, `step_number`, `description`
- **Status** : ✅ Implémenté - 1800 instructions (3 par recette actuellement)

#### Table `recipe_pairings`
- **Rôle** : Composition de menus complets
- **Champs** : `main_recipe_id`, `side_recipe_id`
- **Status** : ✅ Implémenté - prêt pour associations algorithmiques

#### Table `tags` + `recipe_tags`
- **Rôle** : Étiquetage multi-facettes
- **Types** : Cuisines, Régimes, Mots-clés fonctionnels, Saisons, Occasions
- **Status** : ✅ 45 tags simplifiés (sans préfixes)
- **Exemples** : "Italienne", "Végétarien", "Rapide", "Été", "Apéritif"

---

### 3. Inventaire Dynamique (Anti-Gaspillage)

#### Table `inventory_lots`
- **Rôle** : Lots physiques d'aliments de l'utilisateur
- **Champs critiques** : 
  - `product_id` (UUID) - ✅ Clé étrangère vers `products`
  - `canonical_food_id`, `archetype_id` (alternatives flexibles)
  - `qty_remaining`, `expiration_date`
  - `storage_method` ('pantry', 'fridge', 'freezer')
- **Status** : ✅ Corrigé - product_id est UUID (pas BIGINT)
- **Contrainte** : `inventory_lots_one_of` - un seul type parent par lot

#### Tables de Conversion d'Unités
- `unit_conversions_generic` : Facteurs universels (1 tasse = 236ml)
- `unit_conversions_product` : Conversions spécifiques (1 tasse farine = 120g)
- **Status** : ✅ Implémentées

---

### 4. Module Profil Utilisateur (NOUVEAU - Lacune corrigée)

#### ✨ `user_profiles`
- **Champs** : `user_id`, `novelty_preference` (0-1)
- **Rôle** : Curseur "Habitude vs. Nouveauté"

#### ✨ `diets` (Référence)
- **Contenu** : Végétarien, Vegan, Sans Gluten, Halal, Kasher, Paléo, Cétogène, Faible en glucides
- **Rôle** : Table de référence des régimes

#### ✨ `user_diets`
- **Rôle** : Association utilisateur ↔ régimes (plusieurs-à-plusieurs)

#### ✨ `user_allergies`
- **Rôle** : Allergies utilisateur ↔ aliments canoniques
- **Exemple** : user123 → canonical_food "Arachides"

#### ✨ `user_health_goals`
- **Champs** : `target_calories`, `target_protein_g`, `target_fat_g`, `target_carbs_g`
- **Rôle** : Objectifs nutritionnels quantifiés

**Status** : ✅ Module complet créé (Section 4.3 du document)

---

### 5. Données Nutritionnelles

#### Table `nutritional_data`
- **Rôle** : Registre centralisé (valeurs pour 100g)
- **Champs** : `calories_kcal`, `proteines_g`, `glucides_g`, `lipides_g`
- **Liaison** : Depuis `canonical_foods.nutrition_id`

#### Table `cooking_nutrition_factors`
- **Rôle** : Facteurs de correction (impact cuisson sur nutriments)
- **Champs** : `cooking_method`, `nutrient_name`, `factor_type`, `factor_value`
- **Exemple** : Ébullition → vitamine C → rétention 0.7

**Status** : ✅ Implémenté - permet calculs nutritionnels scientifiques

---

### 6. Planification de Repas

#### Table `meal_plans`
- **Champs** : `id`, `user_id`, `week_start_date`

#### Table `planned_meals`
- **Champs** : `plan_id`, `recipe_id`, `meal_date`, `meal_type`
- **Enum meal_type** : BREAKFAST, LUNCH, DINNER, SNACK

**Status** : ✅ Implémenté

---

## 🎯 État de l'Enrichissement

### Données Actuelles
- **611 recettes** importées
  - 427 Plats Principaux (69.9%)
  - 68 Desserts (11.1%)
  - 66 Entrées (10.8%)
  - 50 Accompagnements (8.2%)

- **45 tags simplifiés** (sans préfixes)
  - 11 cuisines (Française, Italienne, etc.)
  - 5 régimes (Végétarien, Vegan, etc.)
  - 20+ mots-clés fonctionnels
  - 4 saisons
  - 5+ occasions

- **276 associations** recette↔tag actuelles

### Script d'Enrichissement v2
- **Fichier** : `tools/enrich_recipes_v2.py`
- **Sortie** : `tools/enrich_recipes_v2.sql`
- **Associations à créer** : 859
- **Logique** : Détection intelligente basée sur noms de recettes
  - Cuisines par mots-clés caractéristiques
  - Régimes par absence/présence d'ingrédients animaux
  - Saisons par ingrédients typiques
  - Occasions/usages contextuels

---

## 🚀 Prochaines Étapes

### 1. Exécuter l'enrichissement
```bash
psql "$DATABASE_URL_TX" -f tools/enrich_recipes_v2.sql
```

### 2. Ajouter des ingrédients réalistes
- Utiliser `recipe_ingredients` pour lier recettes → archetypes/canonical_foods
- Mapper intelligemment depuis noms de recettes

### 3. Améliorer les instructions
- Remplacer les 3 instructions génériques par des étapes détaillées
- Adapter selon `cooking_method` et `role`

### 4. Créer des pairings
- Remplir `recipe_pairings` avec associations logiques
- Plats principaux ↔ Accompagnements

### 5. Implémenter les algorithmes
- **Anti-Gaspillage** : Score d'urgence basé sur `expiration_date`
- **Nutritionnel** : Calcul avec `nutritional_data` + `cooking_nutrition_factors`
- **Recommandation Hybride** : Filtrage contenu + collaboratif

---

## 📊 Principes Architecturaux Clés

1. **Découplage Recettes/Marques** : Les recettes référencent des `archetypes`, pas des `products`
2. **Hiérarchie à 4 Niveaux** : Concept → Variété → Forme → Produit
3. **Normalisation Nutritionnelle** : Données au niveau `canonical_foods`, héritage possible
4. **Flexibilité Ingrédients** : `archetype_id` OU `canonical_food_id` dans recipes
5. **Modularité** : Support sous-recettes via `sub_recipe_id`
6. **Personnalisation** : Module profil utilisateur complet

---

## 🛠️ Fichiers Générés

### Scripts Python
- `tools/enrich_recipes_v2.py` - Enrichissement intelligent

### Scripts SQL
- `tools/enrich_recipes_v2.sql` - 859 associations de tags

### Documentation
- `SCHEMA_DATABASE.md` (ce fichier)

---

## ✨ Conformité Document Technique

| Composant | Document | Implémentation | Status |
|-----------|----------|----------------|--------|
| Hiérarchie 4 niveaux | ✓ | ✓ | ✅ |
| Recettes déconstruites | ✓ | ✓ | ✅ |
| Support sous-recettes | ✓ | ✓ | ✅ |
| Inventaire polymorphe corrigé | ✓ | ✓ | ✅ |
| Module profil utilisateur | ✓ (manquant) | ✓ (créé) | ✅ |
| Données nutritionnelles | ✓ | ✓ | ✅ |
| Facteurs cuisson | ✓ | ✓ | ✅ |
| Tags multi-facettes | ✓ | ✓ | ✅ |

---

**Date de création** : 19 octobre 2025  
**Basé sur** : Blueprint Architectural pour un Écosystème Culinaire Intelligent
