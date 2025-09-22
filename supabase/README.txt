# Base de données Supabase - Documentation Complète

## 🏗️ Architecture de la base de données

Cette base de données gère un système complet de gestion d'inventaire alimentaire avec recettes, conversions d'unités et données nutritionnelles.

## 📊 Structure des tables (18 tables)

### 🗂️ **Tables de référence et catalogues**
- **`reference_categories`** (8 colonnes) : 14 catégories d'aliments avec icônes et propriétés
- **`canonical_foods`** (34 colonnes) : 289+ aliments de référence avec données nutritionnelles complètes
- **`locations`** (4 colonnes) : Lieux de stockage (Frigo 🧊, Placard 🧺, Congélateur ❄️)
- **`utensils_catalog`** (6 colonnes) : Catalogue des ustensiles de cuisine

### 🥕 **Hiérarchie des produits alimentaires**
```
canonical_foods (aliments de référence)
├── cultivars (variétés spécifiques)
│   └── derived_products (produits transformés)
└── generic_products (produits génériques utilisateur)
```

- **`canonical_foods`** : Base de données d'aliments de référence (pomme, carotte, etc.)
- **`cultivars`** : Variétés spécifiques (Pomme Gala, Carotte Nantaise, etc.)
- **`derived_products`** : Produits transformés (compote de pomme, carotte râpée, etc.)
- **`generic_products`** : Produits personnalisés utilisateur

### 📦 **Gestion des stocks**
- **`inventory_lots`** (19 colonnes) : Stocks actuels avec référence flexible vers la hiérarchie
- **`product_aliases`** (9 colonnes) : Alias et synonymes pour la recherche
- **`storage_guides`** (10 colonnes) : Guides de conservation par méthode

### 🍳 **Système de recettes**
- **`recipes`** (20 colonnes) : Recettes avec métadonnées complètes
- **`recipe_ingredients`** (14 colonnes) : Ingrédients avec référence flexible vers la hiérarchie
- **`recipe_steps`** (7 colonnes) : Étapes de préparation
- **`recipe_tools`** (3 colonnes) : Outils nécessaires
- **`recipe_utensils`** (7 colonnes) : Ustensiles avec quantités

### 🔄 **Conversion et métadonnées**
- **`unit_conversions_generic`** (5 colonnes) : Conversions d'unités génériques
- **`unit_conversions_product`** (6 colonnes) : Conversions spécifiques par produit
- **`substitutions`** (4 colonnes) : Substitutions possibles entre produits
- **`product_meta_observations`** (6 colonnes) : Observations utilisateur (poids/unité, densité)

## 🔗 Relations clés

### Hiérarchie alimentaire
```sql
reference_categories (14 catégories)
├── canonical_foods.category_id → reference_categories.id
    ├── cultivars.canonical_food_id → canonical_foods.id
    │   └── derived_products.cultivar_id → cultivars.id
    └── generic_products.category_id → reference_categories.id
```

### Système d'inventaire flexible
```sql
inventory_lots peut référencer:
├── canonical_food_id → canonical_foods.id (produit de base)
├── cultivar_id → cultivars.id (variété spécifique)
├── derived_product_id → derived_products.id (produit transformé)
└── generic_product_id → generic_products.id (produit utilisateur)
```

### Système de recettes
```sql
recipes
├── recipe_ingredients → référence flexible vers la hiérarchie
├── recipe_steps → étapes de préparation
├── recipe_tools → outils nécessaires
└── recipe_utensils → ustensiles avec quantités
```

## 🏷️ Catégories disponibles (14)

| ID | Nom | Icône | Stockage | Durée moyenne | Priorité |
|----|-----|-------|----------|---------------|----------|
| 1 | Fruits | 🍎 | Frigo | 7 jours | 50 |
| 2 | Légumes | 🥕 | Frigo | 5 jours | 50 |
| 3 | Champignons | 🍄 | Frigo | 7 jours | 160 |
| 4 | Œufs | 🥚 | Placard | 28 jours | 130 |
| 5 | Céréales | 🌾 | Placard | 365 jours | 30 |
| 6 | Légumineuses | 🫘 | Placard | 365 jours | 40 |
| 7 | Produits laitiers | 🥛 | Frigo | 7 jours | 50 |
| 8 | Viandes | 🥩 | Frigo | 3 jours | 60 |
| 9 | Poissons | 🐟 | Frigo | 2 jours | 70 |
| 10 | Épices | 🌶️ | Placard | 730 jours | 80 |
| 11 | Huiles | 🫒 | Placard | 365 jours | 90 |
| 12 | Conserves | 🥫 | Placard | 730 jours | 100 |
| 13 | Noix et graines | 🌰 | Placard | 180 jours | 140 |
| 14 | Édulcorants | 🍯 | Placard | 365 jours | 150 |

## 📍 Lieux de stockage

| ID | Nom | Icône | Ordre | Usage |
|----|-----|-------|-------|-------|
| UUID | Frigo | 🧊 | 1 | Produits frais |
| UUID | Placard | 🧺 | 2 | Conserves, céréales |
| UUID | Congélateur | ❄️ | 3 | Surgelés |

## 🔧 Champs importants

### Données nutritionnelles (pour 100g)
- `calories_per_100g` : Valeur énergétique
- `protein_g_per_100g`, `carbs_g_per_100g`, `fat_g_per_100g`
- `fiber_g_per_100g`, `sugar_g_per_100g`, `sodium_mg_per_100g`

### Durées de conservation par méthode
- `shelf_life_days_pantry` : Conservation placard
- `shelf_life_days_fridge` : Conservation frigo  
- `shelf_life_days_freezer` : Conservation congélateur

### Méthodes de conservation disponibles
- `can_conserve_bocal`, `can_lactofermentation`, `can_sechage`
- `can_congelation`, `can_confiture`, `can_vinaigre`, `can_huile`

### Métadonnées flexibles
- `keywords` : ARRAY de mots-clés pour la recherche
- `origin_country` : ARRAY des pays d'origine
- `process_params` : JSONB avec paramètres de transformation
- `structured_seasons` : JSONB avec données de saisonnalité

## 🎯 Fonctionnalités système

### Recherche intelligente
- **Alias multiples** : `product_aliases` permet plusieurs noms par produit
- **Recherche multilingue** : Support français avec mots-clés étendus
- **Score de popularité** : Classement des alias par utilisation

### Conversions d'unités
- **Génériques** : kg↔g, L↔ml, etc.
- **Spécifiques** : Par produit (1 pomme = 150g, etc.)
- **Observations utilisateur** : Apprentissage des conversions réelles

### Flexibilité d'inventaire
Chaque lot peut référencer :
- Un **aliment canonical** (pomme générique)
- Un **cultivar** (Pomme Gala spécifique)  
- Un **produit dérivé** (compote de pomme faite maison)
- Un **produit générique** (produit personnalisé utilisateur)

### Système de recettes avancé
- **Ingrédients flexibles** : Référence vers n'importe quel niveau de la hiérarchie
- **Métadonnées nutritionnelles** : Calcul automatique
- **Gestion des portions** : Recettes divisibles
- **Substitutions** : Remplacement d'ingrédients

## 🔧 Utilisation dans l'application

### Composants principaux
- **`SmartAddForm.js`** : Utilise `canonical_foods` pour la recherche de produits
- **Recherche** : Interroge nom canonique, sous-catégorie et mots-clés
- **Inventory** : Gestion flexible des lots avec référence adaptative
- **Recettes** : Système complet de gestion culinaire

### Tables actives vs. système hérité
- **Actives** : `canonical_foods`, `inventory_lots`, `reference_categories`
- **Extensibilité** : `cultivars`, `derived_products` pour spécialisation future
- **Personnalisation** : `generic_products` pour produits utilisateur

## 📝 Points techniques

- **UUID** pour `locations`, `recipes` et composants de recettes
- **bigint** avec séquences pour les données de référence
- **ARRAY** et **JSONB** pour flexibilité des métadonnées
- **Timestamps automatiques** avec triggers `updated_at`
- **Relations optionnelles** permettant flexibilité d'utilisation
