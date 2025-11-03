# LOGIQUE FINALE : Précise, Simple, Logique

## 🎯 OBJECTIFS
1. **Flexibilité** : Recettes peuvent être flexibles ("crème") ou précises ("crème liquide")
2. **Recherche intelligente** : "J'ai crème liquide" → trouve recettes avec "crème" OU "crème liquide"
3. **Hiérarchie** : crème > crème liquide (structure claire)
4. **Nutrition** : Savoir que crème vient du lait

## 📊 LA SOLUTION

### Niveau 1 : CANONICAL_FOOD
**Aliment de base naturel, source pour nutrition**

```
id | canonical_name | category_id | primary_unit
---|----------------|-------------|-------------
1  | lait           | 7           | ml
2  | bœuf           | 2           | g
3  | porc           | 2           | g
4  | tomate         | 1           | g
5  | blé            | 8           | g
```

### Niveau 2 : ARCHETYPE (avec hiérarchie interne)
**Transformations, avec parent_archetype_id pour la hiérarchie**

```sql
CREATE TABLE archetypes (
  id BIGINT PRIMARY KEY,
  archetype_name TEXT NOT NULL,
  canonical_food_id BIGINT REFERENCES canonical_foods(id), -- lien nutrition
  parent_archetype_id BIGINT REFERENCES archetypes(id),    -- hiérarchie
  process TEXT,
  primary_unit TEXT
);
```

**Exemple : Produits laitiers**
```
id  | archetype_name      | canonical_food_id | parent_archetype_id | process
----|---------------------|-------------------|---------------------|--------
100 | crème               | 1 (lait)          | NULL                | crème
101 | crème liquide       | 1 (lait)          | 100 (crème)         | crème
102 | crème épaisse       | 1 (lait)          | 100 (crème)         | crème
103 | crème fouettée      | 1 (lait)          | 100 (crème)         | crème
104 | crème pâtissière    | 1 (lait)          | NULL                | crème
---
200 | fromage             | 1 (lait)          | NULL                | fromage
201 | emmental            | 1 (lait)          | 200 (fromage)       | fromage
202 | gruyère             | 1 (lait)          | 200 (fromage)       | fromage
203 | fromage râpé        | 1 (lait)          | 200 (fromage)       | fromage
---
300 | beurre              | 1 (lait)          | NULL                | beurre
301 | beurre doux         | 1 (lait)          | 300 (beurre)        | beurre
302 | beurre demi-sel     | 1 (lait)          | 300 (beurre)        | beurre
```

**Exemple : Viande de porc**
```
id  | archetype_name | canonical_food_id | parent_archetype_id | process
----|----------------|-------------------|---------------------|--------
400 | jambon         | 3 (porc)          | NULL                | transformation
401 | jambon cru     | 3 (porc)          | 400 (jambon)        | transformation
402 | jambon cuit    | 3 (porc)          | 400 (jambon)        | transformation
---
410 | lardons        | 3 (porc)          | NULL                | transformation
411 | lardons fumés  | 3 (porc)          | 410 (lardons)       | fumé
```

**Exemple : Viande de bœuf**
```
id  | archetype_name     | canonical_food_id | parent_archetype_id | process
----|--------------------|-------------------|---------------------|--------
500 | bœuf haché         | 2 (bœuf)          | NULL                | haché
---
510 | steak de bœuf      | 2 (bœuf)          | NULL                | steak
511 | entrecôte          | 2 (bœuf)          | 510 (steak)         | steak
512 | faux-filet         | 2 (bœuf)          | 510 (steak)         | steak
513 | bavette            | 2 (bœuf)          | 510 (steak)         | steak
---
520 | bœuf à mijoter     | 2 (bœuf)          | NULL                | en morceaux
```

**Exemple : Farines**
```
id  | archetype_name | canonical_food_id | parent_archetype_id | process
----|----------------|-------------------|---------------------|--------
600 | farine de blé  | 5 (blé)           | NULL                | mouture
601 | farine T45     | 5 (blé)           | 600 (farine de blé) | mouture
602 | farine T55     | 5 (blé)           | 600 (farine de blé) | mouture
603 | farine T65     | 5 (blé)           | 600 (farine de blé) | mouture
```

### Niveau 3 : CULTIVAR (optionnel, rarement utilisé)
**Variétés biologiques vraiment différentes**

```
id | cultivar_name  | canonical_food_id | notes
---|----------------|-------------------|------
1  | lait de chèvre | 1 (lait)          | Goût différent
2  | morue          | X (cabillaud)     | Salé/séché
```

### Niveau 4 : PRODUCT (optionnel, rarement utilisé)
**Marques commerciales spécifiques**

```
id | product_name              | archetype_id
---|---------------------------|-------------
1  | Philadelphia              | 203 (fromage frais)
2  | Président Emmental râpé   | 203 (fromage râpé)
```

## 🔗 LIENS AVEC LES RECETTES

### Table recipe_ingredients
```sql
recipe_ingredients (
  recipe_id BIGINT,
  canonical_food_id BIGINT,  -- Si recette utilise aliment brut (rare)
  archetype_id BIGINT,       -- 90% des cas
  cultivar_id BIGINT,        -- Rare
  product_id BIGINT,         -- Rare
  quantity NUMERIC,
  unit TEXT
)
```

### Exemples de liens

**Recette FLEXIBLE "Quiche lorraine"** :
```sql
-- Recette accepte n'importe quelle crème
INSERT INTO recipe_ingredients VALUES
  (123, NULL, 100, NULL, NULL, 200, 'ml'); -- 100 = "crème" (parent)
```
→ Matchera avec : crème liquide, crème épaisse, crème fouettée

**Recette PRÉCISE "Crème brûlée"** :
```sql
-- Recette NÉCESSITE crème liquide spécifiquement
INSERT INTO recipe_ingredients VALUES
  (124, NULL, 101, NULL, NULL, 500, 'ml'); -- 101 = "crème liquide" (enfant)
```
→ Matchera SEULEMENT avec : crème liquide

**Recette avec fromage râpé** :
```sql
-- Recette accepte n'importe quel fromage râpé
INSERT INTO recipe_ingredients VALUES
  (125, NULL, 203, NULL, NULL, 100, 'g'); -- 203 = "fromage râpé" (enfant de fromage)
```
→ Matchera avec : emmental râpé, gruyère râpé, comté râpé, etc.

## 🔍 LOGIQUE DE RECHERCHE

### Cas 1 : Utilisateur a "crème liquide"
**Question** : "Quelles recettes je peux faire ?"

```sql
-- Trouve recettes qui demandent :
-- 1. Crème liquide exactement (101)
-- 2. Crème générique (100, le parent)
SELECT DISTINCT r.*
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.archetype_id = 101  -- crème liquide
   OR ri.archetype_id = (
       SELECT parent_archetype_id
       FROM archetypes
       WHERE id = 101
   );  -- 100 = crème (parent)
```

**Résultat** :
- ✅ Quiche lorraine (demande "crème" générique)
- ✅ Crème brûlée (demande "crème liquide" précis)
- ❌ PAS les recettes qui demandent "crème pâtissière" (autre branche)

### Cas 2 : Utilisateur cherche recettes avec "crème"
**Question** : "Toutes les recettes avec de la crème"

```sql
-- Trouve recettes qui demandent :
-- 1. Crème générique (100)
-- 2. N'importe quel enfant de crème (101, 102, 103)
WITH RECURSIVE creme_tree AS (
  SELECT id FROM archetypes WHERE id = 100
  UNION ALL
  SELECT a.id FROM archetypes a
  JOIN creme_tree ct ON a.parent_archetype_id = ct.id
)
SELECT DISTINCT r.*
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE ri.archetype_id IN (SELECT id FROM creme_tree);
```

**Résultat** :
- ✅ Quiche lorraine (demande "crème" générique)
- ✅ Crème brûlée (demande "crème liquide" spécifique)
- ✅ Chantilly (demande "crème fouettée" spécifique)
- ❌ PAS les recettes avec "crème pâtissière" (arbre différent)

## 📊 RÈGLES DE DÉCISION

### Quand créer un archetype PARENT (flexible) ?
**Exemples** : crème, fromage, jambon, steak de bœuf, pâtes longues

✅ Créer un parent si :
- Plusieurs variantes existent
- Les variantes sont substituables dans beaucoup de recettes
- Tu veux permettre la flexibilité

### Quand créer un archetype ENFANT (précis) ?
**Exemples** : crème liquide, emmental, jambon cru, entrecôte, spaghetti

✅ Créer un enfant si :
- C'est une variante spécifique du parent
- Certaines recettes ont VRAIMENT besoin de cette précision
- Ça reste substituable au parent dans la plupart des cas

### Quand créer un archetype STANDALONE (sans parent) ?
**Exemples** : crème pâtissière, bœuf haché, lardons

✅ Créer standalone si :
- C'est une transformation unique
- PAS substituable avec d'autres archetypes
- Utilisation spécifique

## 🎯 AVANTAGES DE CETTE SOLUTION

### ✅ Flexibilité
- Recettes flexibles → pointent vers parent ("crème")
- Recettes précises → pointent vers enfant ("crème liquide")
- **Les deux coexistent** !

### ✅ Recherche intelligente
- "J'ai crème liquide" → trouve recettes avec "crème" (parent) + "crème liquide"
- "J'ai emmental" → trouve recettes avec "fromage" (parent) + "emmental"

### ✅ Hiérarchie claire
```
crème (flexible)
  ├─ crème liquide (précis)
  ├─ crème épaisse (précis)
  └─ crème fouettée (précis)
```

### ✅ Nutrition
- Tous les archetypes pointent vers canonical_food_id
- crème → lait (on sait que ça vient du lait)
- emmental → lait
- jambon → porc

### ✅ Simple
- Pas besoin de 4 niveaux complexes
- 2 niveaux principaux : canonical + archetype
- La hiérarchie est dans archetype (parent_archetype_id)

## 📝 RÉSUMÉ

```
CANONICAL (lait, bœuf, porc)
    ↓ nutrition
ARCHETYPE PARENT (crème, fromage, jambon) ← recettes FLEXIBLES
    ↓ hiérarchie
ARCHETYPE ENFANT (crème liquide, emmental, jambon cru) ← recettes PRÉCISES
```

**90% des ingrédients = ARCHETYPE** (avec ou sans parent)
**10% des ingrédients = CANONICAL** (utilisés bruts)

**Recettes pointent vers** :
- Archetype parent → flexibilité maximale
- Archetype enfant → précision nécessaire
- Canonical → aliment brut (tomate, œuf, etc.)
