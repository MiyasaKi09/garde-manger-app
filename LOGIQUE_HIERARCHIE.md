# LOGIQUE DE LA HIÉRARCHIE DES INGRÉDIENTS
## Pour une flexibilité maximale dans les recettes

## 📊 LES 4 NIVEAUX

### 1️⃣ CANONICAL_FOOD (Aliment de base naturel)
**Définition** : L'aliment tel qu'il existe dans la nature, non transformé

**Exemples** :
- `lait` (de tout animal produisant du lait)
- `bœuf` (viande de bœuf)
- `tomate` (le fruit)
- `blé` (la céréale)
- `poisson` (catégorie générale)

**Quand créer un canonical** :
- ✅ C'est un aliment de base naturel
- ✅ Il peut être transformé de multiples façons
- ❌ PAS pour les transformations (yaourt ≠ canonical, c'est un archetype du lait)

---

### 2️⃣ CULTIVAR (Variété biologique/géographique)
**Définition** : Sous-espèce, variété ou provenance qui change SIGNIFICATIVEMENT les propriétés

**Exemples** :
- `morue` → cultivar de `cabillaud` (sel et séchage = différence importante)
- `tomate San Marzano` → cultivar de `tomate` (si vraiment nécessaire pour la recette)
- `lait de chèvre` → cultivar de `lait` (goût très différent)

**Quand créer un cultivar** :
- ✅ La variété change vraiment le goût/texture/utilisation
- ✅ Les recettes ont besoin de cette précision
- ❌ PAS si c'est juste une variation mineure acceptée dans la recette

**RÈGLE IMPORTANTE** : Utiliser RAREMENT. La plupart du temps, on saute directement au niveau archetype.

---

### 3️⃣ ARCHETYPE (Transformation générique) 🎯 **NIVEAU CLÉ POUR LES RECETTES**
**Définition** : Résultat d'une transformation/préparation GÉNÉRIQUE qui accepte des variations

**Exemples concrets de FLEXIBILITÉ** :

#### Exemple 1 : Crème
```
canonical: lait
archetype: "crème fraîche"
```
**Ce que "crème fraîche" ACCEPTE dans une recette** :
- ✅ Crème liquide 30%
- ✅ Crème épaisse 35%
- ✅ Crème fleurette
- ✅ Crème entière
→ **Tout est "crème fraîche"** sauf si la recette précise explicitement le product

#### Exemple 2 : Fromage
```
canonical: lait
archetype: "fromage râpé"
```
**Ce que "fromage râpé" ACCEPTE** :
- ✅ Emmental râpé
- ✅ Gruyère râpé
- ✅ Comté râpé
- ✅ Mélange 3 fromages
→ **Tous peuvent remplacer "fromage râpé"** dans une recette

#### Exemple 3 : Jambon
```
canonical: porc
archetype: "jambon"
```
**Ce que "jambon" ACCEPTE** :
- ✅ Jambon blanc
- ✅ Jambon cru
- ✅ Jambon de Parme
- ✅ Jambon serrano
→ **Flexible sauf si la recette demande explicitement "jambon cru"**

#### Exemple 4 : Farine
```
canonical: blé
archetype: "farine de blé"
```
**Ce que "farine de blé" ACCEPTE** :
- ✅ Farine T45
- ✅ Farine T55
- ✅ Farine T65
- ✅ Farine T00 (italienne)
- ✅ Farine Manitoba
→ **Toutes les farines de blé** sauf farine complète (archetype différent)

#### Exemple 5 : Viande hachée
```
canonical: bœuf
archetype: "bœuf haché"
```
**Ce que "bœuf haché" ACCEPTE** :
- ✅ Bœuf haché 5% MG
- ✅ Bœuf haché 15% MG
- ✅ Bœuf haché 20% MG
- ✅ Steak haché
→ **Tout bœuf haché** quelle que soit la teneur en gras

**Quand créer un archetype** :
- ✅ C'est une transformation/préparation commune
- ✅ Plusieurs recettes l'utilisent
- ✅ Il doit accepter des variations mineures
- ✅ **C'EST ICI QUE LES RECETTES POINTENT** 🎯

---

### 4️⃣ PRODUCT (Produit commercial spécifique)
**Définition** : Marque commerciale OU préparation très spécifique nécessaire à certaines recettes

**Exemples** :
- `Philadelphia` → product de archetype "fromage frais"
- `St Môret` → product de archetype "fromage frais"
- `Président Emmental râpé` → product de archetype "fromage râpé"
- `Pâte de curry rouge Maesri` → product très spécifique

**Quand créer un product** :
- ✅ La marque/préparation spécifique est NÉCESSAIRE à la recette
- ✅ Aucun substitut générique ne fonctionne
- ❌ PAS par défaut pour tout

**RÈGLE IMPORTANTE** : Utiliser RAREMENT. Seulement quand vraiment nécessaire.

---

## 🎯 RÈGLE D'OR : OÙ POINTENT LES RECETTES ?

### Priorité 1 : ARCHETYPE (90% des cas)
```sql
recipe_ingredients (
  recipe_id: 123,
  canonical_food_id: NULL,
  archetype_id: 456,  -- ✅ "crème fraîche"
  product_id: NULL
)
```
→ **Maximum de flexibilité** : accepte crème liquide, épaisse, 30%, 35%

### Priorité 2 : CANONICAL (cas simples)
```sql
recipe_ingredients (
  recipe_id: 123,
  canonical_food_id: 789,  -- ✅ "tomate"
  archetype_id: NULL,
  product_id: NULL
)
```
→ Quand l'aliment est utilisé tel quel sans transformation

### Priorité 3 : PRODUCT (rare, cas spécifiques)
```sql
recipe_ingredients (
  recipe_id: 123,
  canonical_food_id: NULL,
  archetype_id: NULL,
  product_id: 999  -- ✅ "Philadelphia" (cheesecake américain)
)
```
→ Seulement si vraiment nécessaire

---

## 📋 EXEMPLES COMPLETS

### Exemple A : Produits laitiers

```
CANONICAL: lait
  ├─ ARCHETYPE: lait entier
  ├─ ARCHETYPE: lait demi-écrémé
  ├─ ARCHETYPE: crème fraîche (accepte liquide, épaisse, 30%, 35%)
  ├─ ARCHETYPE: crème pâtissière
  ├─ ARCHETYPE: beurre
  ├─ ARCHETYPE: fromage (très générique)
  ├─ ARCHETYPE: fromage râpé (accepte emmental, gruyère, comté)
  ├─ ARCHETYPE: fromage frais (accepte St Môret, Philadelphia, etc.)
  ├─ ARCHETYPE: yaourt
  ├─ ARCHETYPE: emmental
  ├─ ARCHETYPE: comté
  └─ ARCHETYPE: parmesan

CULTIVAR: lait de chèvre (si vraiment nécessaire)
  ├─ ARCHETYPE: fromage de chèvre
  └─ ARCHETYPE: bûche de chèvre

PRODUCT: Philadelphia (si recette très spécifique)
PRODUCT: Président Emmental râpé (si vraiment la marque compte)
```

**Recettes utilisent** :
- "crème fraîche" (archetype) → accepte toutes les crèmes
- "fromage râpé" (archetype) → accepte emmental, gruyère, comté
- "Philadelphia" (product) → seulement pour cheesecake new-yorkais authentique

### Exemple B : Viande de bœuf

```
CANONICAL: bœuf
  ├─ ARCHETYPE: bœuf haché (accepte 5%, 15%, 20% MG)
  ├─ ARCHETYPE: steak de bœuf (accepte entrecôte, faux-filet, bavette, rumsteck)
  ├─ ARCHETYPE: bœuf en morceaux (accepte gîte, paleron, joue - pour mijoter)
  ├─ ARCHETYPE: côte de bœuf
  ├─ ARCHETYPE: filet de bœuf
  ├─ ARCHETYPE: tournedos
  └─ ARCHETYPE: bouillon de bœuf

CULTIVAR: bœuf wagyu (si vraiment nécessaire pour la recette)
  └─ ARCHETYPE: steak wagyu

PRODUCT: (rarement utilisé pour viande)
```

**Recettes utilisent** :
- "bœuf haché" (archetype) → accepte toutes teneurs en MG
- "steak de bœuf" (archetype) → accepte entrecôte, faux-filet, bavette
- "bœuf en morceaux" (archetype) → accepte gîte, paleron, joue pour bourguignon

### Exemple C : Pâtes

```
CANONICAL: blé
  ├─ ARCHETYPE: farine de blé (accepte T45, T55, T65, T00, manitoba)
  ├─ ARCHETYPE: farine complète (T110, T150)
  ├─ ARCHETYPE: semoule
  ├─ ARCHETYPE: pâtes longues (accepte spaghetti, linguine, tagliatelles)
  ├─ ARCHETYPE: pâtes courtes (accepte penne, rigatoni, fusilli)
  └─ ARCHETYPE: lasagnes

CANONICAL: riz
  ├─ ARCHETYPE: nouilles de riz
  └─ ARCHETYPE: vermicelles de riz
```

**Recettes utilisent** :
- "pâtes longues" (archetype) → spaghetti, linguine, tagliatelles fonctionnent
- "farine de blé" (archetype) → T45, T55, T65 fonctionnent

---

## 🎓 PRINCIPES DIRECTEURS

### Principe 1 : Largesse maximale
**Une recette doit fonctionner avec des variations d'ingrédients**
- ❌ Mauvais : demander "crème liquide 30%" (trop spécifique)
- ✅ Bon : demander "crème fraîche" (accepte liquide/épaisse/30%/35%)

### Principe 2 : Le bon niveau
**Pointer vers le niveau approprié**
- 🥇 **ARCHETYPE** : 90% des recettes (flexibilité maximale)
- 🥈 **CANONICAL** : 8% des recettes (ingrédient brut non transformé)
- 🥉 **PRODUCT** : 2% des recettes (vraiment nécessaire)

### Principe 3 : Éviter la sur-spécification
**Ne pas créer trop de niveaux**
- ❌ Mauvais : archetype "crème liquide 30%", "crème épaisse 35%", "crème fleurette"
- ✅ Bon : archetype "crème fraîche" qui accepte toutes ces variations

### Principe 4 : Test de substituabilité
**Question à se poser** : "Est-ce que X peut remplacer Y dans la plupart des recettes ?"
- Si OUI → même archetype
- Si NON → archetypes différents

**Exemples** :
- "Crème liquide" peut remplacer "crème épaisse" ? → OUI → même archetype "crème fraîche"
- "Farine T45" peut remplacer "farine T65" ? → OUI → même archetype "farine de blé"
- "Crème fraîche" peut remplacer "crème pâtissière" ? → NON → archetypes différents

---

## ✅ RÉSUMÉ : Comment choisir ?

```
Cet ingrédient est-il naturel/non transformé ?
  ├─ OUI → CANONICAL (lait, bœuf, tomate)
  └─ NON ↓

C'est une variété qui change VRAIMENT les propriétés ?
  ├─ OUI → CULTIVAR (morue du cabillaud, lait de chèvre)
  └─ NON ↓

C'est une transformation/préparation GÉNÉRIQUE ?
  ├─ OUI → ARCHETYPE 🎯 (crème fraîche, bœuf haché, fromage râpé)
  └─ NON ↓

C'est un produit commercial spécifique nécessaire ?
  └─ OUI → PRODUCT (Philadelphia, St Môret)
```

---

## 💡 LA CLÉ : FLEXIBILITÉ

**Une bonne hiérarchie permet** :
1. À l'utilisateur de dire "J'ai de la crème liquide" → système trouve toutes les recettes demandant "crème fraîche"
2. À la recette de demander "crème fraîche" → accepte crème liquide, épaisse, 30%, 35%
3. De minimiser les "ingrédient manquant" quand on a un substitut acceptable
4. D'éviter la sur-spécification qui rend les recettes inutilisables

**90% des liens recipe_ingredients doivent pointer vers des ARCHETYPES**
