# HIÉRARCHIE COMPLÈTE DES INGRÉDIENTS

## 🏗️ STRUCTURE À 4 NIVEAUX

```
CANONICAL (aliment naturel de base)
    ↓
CULTIVAR (variété biologique/géographique)
    ↓
ARCHETYPE (transformation)
    ↓ (avec parent_archetype_id pour hiérarchie interne)
PRODUCT (produit commercial réel)
```

## 📊 NIVEAU 1 : CANONICAL_FOOD
**Aliment de base naturel, source nutritionnelle**

```sql
canonical_foods (
  id BIGINT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  category_id BIGINT,
  primary_unit TEXT
)
```

**Exemples** :
- `lait` (de tout animal laitier)
- `bœuf` (viande bovine)
- `cabillaud` (poisson)
- `tomate` (fruit)
- `blé` (céréale)

## 📊 NIVEAU 2 : CULTIVAR
**Variété biologique ou géographique qui change significativement les propriétés**

```sql
cultivars (
  id BIGINT PRIMARY KEY,
  cultivar_name TEXT NOT NULL,
  canonical_food_id BIGINT REFERENCES canonical_foods(id), -- lien vers canonical
  origin TEXT,
  notes TEXT
)
```

**Exemples** :
```
id | cultivar_name      | canonical_food_id | notes
---|--------------------|--------------------|------------------------
1  | lait de chèvre     | 1 (lait)           | Goût différent, texture différente
2  | lait de brebis     | 1 (lait)           | Pour fromages spécifiques
3  | morue              | 15 (cabillaud)     | Cabillaud salé et séché
4  | bœuf wagyu         | 2 (bœuf)           | Persillage unique
5  | tomate San Marzano | 8 (tomate)         | Forme allongée, sauce
```

**Quand créer un cultivar** :
- ✅ Variété avec goût/texture vraiment différents
- ✅ Origine géographique qui compte (AOP, IGP)
- ✅ Transformation qui crée une nouvelle "base" (morue ≠ cabillaud frais)
- ❌ PAS pour chaque petite variation

## 📊 NIVEAU 3 : ARCHETYPE
**Transformation ou préparation, avec hiérarchie interne**

```sql
archetypes (
  id BIGINT PRIMARY KEY,
  archetype_name TEXT NOT NULL,
  canonical_food_id BIGINT REFERENCES canonical_foods(id), -- si lié au canonical
  cultivar_id BIGINT REFERENCES cultivars(id),             -- si lié au cultivar
  parent_archetype_id BIGINT REFERENCES archetypes(id),    -- hiérarchie interne
  process TEXT,
  primary_unit TEXT,

  CONSTRAINT archetype_source CHECK (
    (canonical_food_id IS NOT NULL AND cultivar_id IS NULL) OR
    (canonical_food_id IS NULL AND cultivar_id IS NOT NULL)
  )
)
```

**Exemples reliés au CANONICAL** :
```
id  | archetype_name   | canonical_food_id | cultivar_id | parent_archetype_id
----|------------------|-------------------|-------------|--------------------
100 | crème            | 1 (lait)          | NULL        | NULL
101 | crème liquide    | 1 (lait)          | NULL        | 100
102 | crème épaisse    | 1 (lait)          | NULL        | 100
---
200 | fromage          | 1 (lait)          | NULL        | NULL
201 | emmental         | 1 (lait)          | NULL        | 200
202 | gruyère          | 1 (lait)          | NULL        | 200
203 | fromage râpé     | 1 (lait)          | NULL        | 200
```

**Exemples reliés au CULTIVAR** :
```
id  | archetype_name     | canonical_food_id | cultivar_id         | parent_archetype_id
----|--------------------|--------------------|---------------------|--------------------
250 | fromage de chèvre  | NULL               | 1 (lait de chèvre)  | NULL
251 | bûche de chèvre    | NULL               | 1 (lait de chèvre)  | 250
252 | crottin de chèvre  | NULL               | 1 (lait de chèvre)  | 250
---
260 | roquefort          | NULL               | 2 (lait de brebis)  | NULL
---
300 | brandade de morue  | NULL               | 3 (morue)           | NULL
301 | morue dessalée     | NULL               | 3 (morue)           | NULL
```

**Hiérarchie interne d'archetypes** :
```
id  | archetype_name | canonical_food_id | parent_archetype_id | notes
----|----------------|-------------------|---------------------|------------------
500 | steak de bœuf  | 2 (bœuf)          | NULL                | Archetype parent
511 | entrecôte      | 2 (bœuf)          | 500                 | Type de steak
512 | faux-filet     | 2 (bœuf)          | 500                 | Type de steak
513 | bavette        | 2 (bœuf)          | 500                 | Type de steak
```

## 📊 NIVEAU 4 : PRODUCT
**Produit commercial réel, marque spécifique**

```sql
products (
  id BIGINT PRIMARY KEY,
  product_name TEXT NOT NULL,
  brand TEXT,
  archetype_id BIGINT REFERENCES archetypes(id), -- lié à l'archetype
  barcode TEXT,
  nutritional_info JSONB
)
```

**Exemples** :
```
id | product_name             | brand      | archetype_id
---|--------------------------|------------|-------------
1  | Crème liquide 30%        | Président  | 101 (crème liquide)
2  | Crème épaisse entière    | Elle & Vire| 102 (crème épaisse)
3  | Emmental râpé            | Président  | 203 (fromage râpé)
4  | Philadelphia             | Philadelphia| 204 (fromage frais)
5  | Bûche de chèvre Soignon  | Soignon    | 251 (bûche de chèvre)
```

## 🔗 EXEMPLES COMPLETS

### Exemple A : Produits laitiers classiques
```
CANONICAL: lait
  └─ ARCHETYPE: crème (parent, flexible)
      ├─ ARCHETYPE: crème liquide (enfant, précis)
      │   └─ PRODUCT: Président Crème Liquide 30%
      ├─ ARCHETYPE: crème épaisse (enfant, précis)
      │   └─ PRODUCT: Elle & Vire Crème Épaisse
      └─ ARCHETYPE: crème fouettée (enfant, précis)
```

### Exemple B : Produits laitiers de chèvre
```
CANONICAL: lait
  └─ CULTIVAR: lait de chèvre (variété différente)
      └─ ARCHETYPE: fromage de chèvre (parent)
          ├─ ARCHETYPE: bûche de chèvre (enfant)
          │   └─ PRODUCT: Soignon Bûche de Chèvre
          ├─ ARCHETYPE: crottin de chèvre (enfant)
          └─ ARCHETYPE: chèvre frais (enfant)
              └─ PRODUCT: Chavroux
```

### Exemple C : Viande de bœuf
```
CANONICAL: bœuf
  ├─ ARCHETYPE: bœuf haché (standalone)
  │   └─ PRODUCT: Charal Bœuf Haché 5%
  └─ ARCHETYPE: steak de bœuf (parent, flexible)
      ├─ ARCHETYPE: entrecôte (enfant, précis)
      ├─ ARCHETYPE: faux-filet (enfant, précis)
      └─ ARCHETYPE: bavette (enfant, précis)

CANONICAL: bœuf
  └─ CULTIVAR: bœuf wagyu (variété premium)
      └─ ARCHETYPE: steak wagyu
```

### Exemple D : Cabillaud et morue
```
CANONICAL: cabillaud
  ├─ ARCHETYPE: filet de cabillaud (transformation simple)
  └─ CULTIVAR: morue (cabillaud salé/séché = variété technique)
      ├─ ARCHETYPE: morue dessalée
      └─ ARCHETYPE: brandade de morue
```

### Exemple E : Tomates
```
CANONICAL: tomate
  ├─ ARCHETYPE: tomate concassée
  ├─ ARCHETYPE: coulis de tomate
  └─ ARCHETYPE: concentré de tomate
      └─ PRODUCT: Mutti Concentré de Tomate

CANONICAL: tomate
  └─ CULTIVAR: tomate San Marzano (variété spécifique)
      └─ ARCHETYPE: tomates San Marzano pelées
          └─ PRODUCT: Mutti San Marzano DOP
```

### Exemple F : Fromages
```
CANONICAL: lait
  └─ ARCHETYPE: fromage (parent très générique)
      ├─ ARCHETYPE: emmental (enfant)
      │   └─ PRODUCT: Emmental Président
      ├─ ARCHETYPE: gruyère (enfant)
      ├─ ARCHETYPE: comté (enfant)
      └─ ARCHETYPE: fromage râpé (enfant = usage)
          └─ PRODUCT: Président 3 Fromages Râpés

CANONICAL: lait
  └─ CULTIVAR: lait de chèvre
      └─ ARCHETYPE: fromage de chèvre
          └─ ARCHETYPE: chèvre frais
              └─ PRODUCT: Chavroux
```

## 🔗 LIENS AVEC LES RECETTES

### Table recipe_ingredients
```sql
recipe_ingredients (
  recipe_id BIGINT,
  canonical_food_id BIGINT,  -- Rare : tomate fraîche, œuf
  cultivar_id BIGINT,        -- Très rare : morue spécifiquement
  archetype_id BIGINT,       -- 90% des cas
  product_id BIGINT,         -- Rare : marque spécifique nécessaire
  quantity NUMERIC,
  unit TEXT,

  CONSTRAINT ingredient_source CHECK (
    -- Un seul niveau doit être renseigné
    (canonical_food_id IS NOT NULL AND cultivar_id IS NULL AND archetype_id IS NULL AND product_id IS NULL) OR
    (canonical_food_id IS NULL AND cultivar_id IS NOT NULL AND archetype_id IS NULL AND product_id IS NULL) OR
    (canonical_food_id IS NULL AND cultivar_id IS NULL AND archetype_id IS NOT NULL AND product_id IS NULL) OR
    (canonical_food_id IS NULL AND cultivar_id IS NULL AND archetype_id IS NULL AND product_id IS NOT NULL)
  )
)
```

### Exemples de liens

**Recette flexible avec crème** :
```sql
-- Accepte crème liquide, épaisse, fouettée
INSERT INTO recipe_ingredients VALUES
  (123, NULL, NULL, 100, NULL, 200, 'ml'); -- 100 = "crème" (parent)
```

**Recette précise avec crème liquide** :
```sql
-- Nécessite spécifiquement crème liquide
INSERT INTO recipe_ingredients VALUES
  (124, NULL, NULL, 101, NULL, 500, 'ml'); -- 101 = "crème liquide" (enfant)
```

**Recette avec fromage de chèvre** :
```sql
-- Nécessite fromage de chèvre (pas lait de vache)
INSERT INTO recipe_ingredients VALUES
  (125, NULL, NULL, 250, NULL, 100, 'g'); -- 250 = "fromage de chèvre" (lié au cultivar)
```

**Recette avec morue** :
```sql
-- Option 1 : morue en général (cultivar)
INSERT INTO recipe_ingredients VALUES
  (126, NULL, 3, NULL, NULL, 400, 'g'); -- 3 = cultivar "morue"

-- Option 2 : morue dessalée (archetype du cultivar)
INSERT INTO recipe_ingredients VALUES
  (127, NULL, NULL, 301, NULL, 400, 'g'); -- 301 = "morue dessalée"
```

**Recette avec produit spécifique** :
```sql
-- Cheesecake new-yorkais : DOIT être Philadelphia
INSERT INTO recipe_ingredients VALUES
  (128, NULL, NULL, NULL, 4, 250, 'g'); -- 4 = "Philadelphia"
```

## 🔍 LOGIQUE DE RECHERCHE

### Cas 1 : "J'ai de la crème liquide, quelles recettes ?"

```sql
-- Trouve recettes qui demandent :
-- 1. Crème liquide (101)
-- 2. Crème générique (100, le parent)
-- 3. Produits de crème liquide

WITH ingredient_matches AS (
  -- Match direct sur archetype
  SELECT 101 as archetype_id
  UNION
  -- Match sur parent
  SELECT parent_archetype_id
  FROM archetypes
  WHERE id = 101 AND parent_archetype_id IS NOT NULL
  UNION
  -- Match sur produits
  SELECT archetype_id
  FROM products
  WHERE archetype_id = 101
)
SELECT DISTINCT r.*
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.archetype_id IN (SELECT archetype_id FROM ingredient_matches);
```

### Cas 2 : "J'ai du fromage de chèvre, quelles recettes ?"

```sql
-- Trouve recettes qui demandent :
-- 1. Fromage de chèvre (archetype 250)
-- 2. Enfants de fromage de chèvre (bûche, crottin)
-- 3. Le cultivar lait de chèvre (rare mais possible)

WITH RECURSIVE chèvre_tree AS (
  -- Le cultivar
  SELECT 1 as cultivar_id, NULL as archetype_id
  UNION ALL
  -- L'archetype parent lié au cultivar
  SELECT NULL, 250
  UNION ALL
  -- Les enfants de l'archetype
  SELECT NULL, id FROM archetypes WHERE parent_archetype_id = 250
)
SELECT DISTINCT r.*
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.cultivar_id IN (SELECT cultivar_id FROM chèvre_tree WHERE cultivar_id IS NOT NULL)
   OR ri.archetype_id IN (SELECT archetype_id FROM chèvre_tree WHERE archetype_id IS NOT NULL);
```

## 📊 RÈGLES DE CLASSIFICATION

### CANONICAL → CULTIVAR ?

**Créer un CULTIVAR si** :
- ✅ Goût/texture significativement différents (lait de chèvre vs vache)
- ✅ Origine géographique importante (AOP, IGP)
- ✅ Transformation qui crée une "nouvelle base" (morue du cabillaud)
- ✅ Propriétés nutritionnelles très différentes

**PAS de CULTIVAR si** :
- ❌ Simple variation de maturité (tomate mûre vs verte → même canonical)
- ❌ Variation de taille (petite/grosse tomate → même canonical)
- ❌ Variation de couleur sans impact goût (poivron rouge/vert → même canonical)

### CANONICAL/CULTIVAR → ARCHETYPE ?

**Lier au CANONICAL si** :
- ✅ Transformation standard applicable à tous les cultivars
- ✅ Exemple : "crème" vient du lait (n'importe quel lait)

**Lier au CULTIVAR si** :
- ✅ Transformation spécifique à ce cultivar
- ✅ Exemple : "fromage de chèvre" vient du lait de chèvre UNIQUEMENT

### ARCHETYPE parent ou enfant ?

**Créer un PARENT si** :
- ✅ Plusieurs variantes substituables existent
- ✅ Beaucoup de recettes acceptent n'importe quelle variante
- ✅ Tu veux permettre la flexibilité

**Créer un ENFANT si** :
- ✅ C'est une variante spécifique d'un parent
- ✅ Certaines recettes ont vraiment besoin de cette précision
- ✅ Mais reste substituable au parent dans la majorité des cas

**Créer STANDALONE si** :
- ✅ Transformation unique sans variantes
- ✅ Pas de flexibilité nécessaire
- ✅ Exemple : bœuf haché, brandade de morue

### ARCHETYPE → PRODUCT ?

**Créer un PRODUCT si** :
- ✅ Marque spécifique nécessaire (Philadelphia pour cheesecake)
- ✅ Produit commercial avec composition unique
- ✅ Tu veux tracker les codes-barres pour scan

**PAS de PRODUCT si** :
- ❌ N'importe quelle marque fonctionne

## 📈 STATISTIQUES ATTENDUES

**Répartition dans la base** :
- `CANONICAL` : ~200-300 aliments de base
- `CULTIVAR` : ~50-100 variétés importantes
- `ARCHETYPE` : ~500-1000 transformations
- `PRODUCT` : ~100-500 produits commerciaux (si utilisé)

**Liens dans recipe_ingredients** :
- 90% → `archetype_id`
- 8% → `canonical_food_id`
- 1% → `cultivar_id`
- 1% → `product_id`

## ✅ RÉSUMÉ VISUEL

```
┌─────────────────────────────────────────────────────────────┐
│ CANONICAL: lait (aliment naturel)                           │
│   │                                                          │
│   ├─ CULTIVAR: lait de chèvre (variété biologique)          │
│   │    │                                                     │
│   │    └─ ARCHETYPE: fromage de chèvre (transformation)     │
│   │         │                                                │
│   │         ├─ ARCHETYPE: bûche de chèvre (type spécifique) │
│   │         │    │                                           │
│   │         │    └─ PRODUCT: Soignon Bûche (marque)         │
│   │         │                                                │
│   │         └─ ARCHETYPE: chèvre frais                       │
│   │              │                                           │
│   │              └─ PRODUCT: Chavroux                        │
│   │                                                          │
│   └─ ARCHETYPE: crème (transformation, parent)              │
│        │                                                     │
│        ├─ ARCHETYPE: crème liquide (enfant)                 │
│        │    │                                                │
│        │    └─ PRODUCT: Président Crème Liquide 30%         │
│        │                                                     │
│        └─ ARCHETYPE: crème épaisse (enfant)                 │
│             │                                                │
│             └─ PRODUCT: Elle & Vire Crème Épaisse           │
└─────────────────────────────────────────────────────────────┘

RECETTES POINTENT VERS :
  🎯 ARCHETYPE (90%) → Maximum de flexibilité
  🥉 CANONICAL (8%) → Ingrédient brut
  🥈 CULTIVAR (1%) → Variété nécessaire
  🏅 PRODUCT (1%) → Marque obligatoire
```

Cette hiérarchie est **précise, simple, logique** et permet une **flexibilité maximale** ! 🎯
