# HIÉRARCHIE DES INGRÉDIENTS

Documentation de référence pour la classification des aliments dans Garde-Manger

## 📋 Vue d'ensemble

La hiérarchie suit le modèle:
```
CANONICAL_FOOD → CULTIVAR → ARCHETYPE
```

---

## 1️⃣ CANONICAL_FOOD (Aliment de base)

### Définition
Un **canonical_food** est un **aliment de base naturel**, non transformé, tel qu'il existe dans la nature ou dans sa forme la plus élémentaire.

### Caractéristiques
- ✅ Produit brut, naturel
- ✅ Non ou très peu transformé
- ✅ Peut être consommé tel quel (ou après cuisson simple)
- ✅ Constitue la "racine" de la hiérarchie

### Exemples corrects
- **bœuf** (l'animal/viande)
- **lait** (de vache)
- **pomme de terre**
- **tomate**
- **cabillaud** (le poisson)
- **blé** (la céréale)
- **soja** (la légumineuse)
- **poireau**
- **carotte**

### ❌ Contre-exemples (NE SONT PAS des canonical_foods)
- ~~bœuf haché~~ → c'est un **archetype** (transformation)
- ~~fromage~~ → c'est un **archetype** (transformation du lait)
- ~~pain~~ → c'est un **archetype** (transformation de la farine)
- ~~morue~~ → c'est un **cultivar** (variété spéciale de cabillaud)

---

## 2️⃣ CULTIVAR (Variété/Sous-espèce)

### Définition
Un **cultivar** est une **variété ou sous-espèce** d'un canonical_food. C'est une variation naturelle (ou cultivée) de l'aliment de base, mais qui reste **non transformé**.

### Caractéristiques
- ✅ Variété spécifique d'un canonical_food
- ✅ Différence génétique, de terroir, ou de méthode de production
- ✅ Toujours dans un état brut/naturel
- ✅ **Pointe vers un canonical_food parent**

### Exemples corrects
```
canonical_food: pomme de terre
├─ cultivar: pomme de terre Charlotte
├─ cultivar: pomme de terre Bintje
└─ cultivar: pomme de terre Ratte

canonical_food: tomate
├─ cultivar: tomate cerise
├─ cultivar: tomate cœur de bœuf
└─ cultivar: tomate San Marzano

canonical_food: cabillaud
└─ cultivar: morue (cabillaud salé/séché mais pas encore cuisiné)

canonical_food: lait
├─ cultivar: lait de vache Jersey
└─ cultivar: lait de vache Holstein
```

### ❌ Contre-exemples (NE SONT PAS des cultivars)
- ~~purée de pommes de terre~~ → **archetype** (transformation)
- ~~sauce tomate~~ → **archetype** (transformation)
- ~~morue dessalée~~ → **archetype** (préparation culinaire)

---

## 3️⃣ ARCHETYPE (Transformation/Préparation)

### Définition
Un **archetype** est une **transformation, préparation ou forme spécifique** d'un canonical_food (ou d'un cultivar). C'est le résultat d'un **processus** appliqué à l'aliment de base.

### Caractéristiques
- ✅ Résultat d'une transformation
- ✅ Préparation culinaire
- ✅ Découpe spécifique
- ✅ Processus de conservation
- ✅ **Pointe vers un canonical_food (ou cultivar) parent**
- ✅ Possède un attribut **`process`** qui décrit la transformation

### Exemples corrects

#### A) Transformations de viande
```
canonical_food: bœuf
├─ archetype: bœuf haché (process: "haché")
├─ archetype: steak de bœuf (process: "steak/découpe")
├─ archetype: entrecôte (process: "entrecôte/découpe")
├─ archetype: bœuf en morceaux (process: "en morceaux")
├─ archetype: bœuf séché (process: "séché")
└─ archetype: bouillon de bœuf (process: "bouillon/cuisson longue")

canonical_food: porc
├─ archetype: lardons (process: "lardons/découpe")
├─ archetype: bacon (process: "bacon/fumé")
├─ archetype: jambon cuit (process: "jambon cuit")
├─ archetype: jambon cru (process: "jambon cru/séché")
├─ archetype: saucisse (process: "saucisse/hachage+embossage")
└─ archetype: chair à saucisse (process: "haché+assaisonné")
```

#### B) Transformations de lait
```
canonical_food: lait (de vache)
├─ archetype: emmental (process: "fromage affiné")
├─ archetype: gruyère (process: "fromage affiné")
├─ archetype: parmesan (process: "fromage affiné")
├─ archetype: mozzarella (process: "fromage frais")
├─ archetype: ricotta (process: "fromage frais")
├─ archetype: crème fraîche (process: "écrémage+fermentation")
├─ archetype: beurre (process: "barattage")
└─ archetype: yaourt (process: "fermentation")

canonical_food: lait de chèvre
├─ archetype: chèvre frais (process: "fromage frais")
├─ archetype: feta (process: "fromage frais saumuré")
└─ archetype: crottin de Chavignol (process: "fromage affiné")
```

#### C) Transformations de poisson
```
canonical_food: saumon
├─ archetype: saumon fumé (process: "fumé")
├─ archetype: pavé de saumon (process: "découpe/pavé")
└─ archetype: saumon en conserve (process: "conserve")

cultivar: morue (de cabillaud)
└─ archetype: morue dessalée (process: "dessalage")
```

#### D) Transformations de céréales
```
canonical_food: blé
├─ archetype: farine de blé (process: "mouture")
└─ archetype: seitan (process: "extraction gluten")

canonical_food: soja
├─ archetype: tofu (process: "caillage")
├─ archetype: tempeh (process: "fermentation")
└─ archetype: lait de soja (process: "broyage+filtration")
```

#### E) Transformations de légumes
```
canonical_food: pomme de terre
├─ archetype: purée de pommes de terre (process: "purée")
├─ archetype: frites (process: "découpe+friture")
└─ archetype: pommes dauphine (process: "purée+pâte à choux")

canonical_food: tomate
├─ archetype: sauce tomate (process: "cuisson+réduction")
├─ archetype: concentré de tomate (process: "cuisson+concentration")
└─ archetype: tomates séchées (process: "séchage")
```

---

## 🎯 RÈGLES DE CLASSIFICATION

### Comment savoir à quel niveau placer un ingrédient?

#### Posez-vous ces questions:

1. **Est-ce un produit naturel brut?**
   - OUI → `canonical_food`
   - NON → continuez

2. **Est-ce une variété/sous-espèce d'un produit naturel?**
   - OUI → `cultivar` (+ lien vers le canonical_food parent)
   - NON → continuez

3. **Est-ce le résultat d'une transformation/préparation?**
   - OUI → `archetype` (+ lien vers le canonical_food/cultivar parent + décrire le `process`)

---

## 📝 CAS SPÉCIAUX

### Cas 1: "Fromage"
❌ **Erreur**: Créer "fromage" comme canonical_food
✅ **Correct**: Chaque fromage est un archetype de "lait"
```
lait → emmental, gruyère, parmesan, mozzarella, etc.
```

### Cas 2: "Viande hachée"
❌ **Erreur**: Créer "viande hachée" comme canonical_food
✅ **Correct**: Archetype de la viande spécifique
```
bœuf → bœuf haché
veau → veau haché
porc → porc haché
```

### Cas 3: "Pâtes"
🤔 **Débat**: Canonical ou Archetype?

**Option A** (Actuelle): Canonical
- Les pâtes sont un produit de base dans la cuisine
- Variété: `linguine`, `tagliatelles`, `penne` = canonical_foods

**Option B** (Plus rigoureuse): Archetype
```
canonical: farine de blé
archetype: pâtes (process: "pétrissage+découpe")
  ├─ archetype: linguine (process: "pâtes longues")
  ├─ archetype: tagliatelles (process: "pâtes longues")
  └─ archetype: penne (process: "pâtes courtes")
```

**Recommandation**: Option A pour simplicité

### Cas 4: "Pain"
🤔 Similaire aux pâtes

**Option A** (Simple): Canonical
- `pain de campagne`, `baguette`, `pain de mie` = canonical_foods

**Option B** (Rigoureuse): Archetype
```
canonical: farine de blé
archetype: pain (process: "panification")
  ├─ archetype: baguette (process: "pain français")
  └─ archetype: pain de mie (process: "pain moulé")
```

**Recommandation**: Option A pour simplicité

---

## ✅ RÉSUMÉ VISUEL

```
NIVEAU         | QUE REPRÉSENTE-T-IL?              | EXEMPLES
---------------|-----------------------------------|---------------------------
CANONICAL      | Aliment de base naturel           | bœuf, lait, pomme de terre
CULTIVAR       | Variété d'un canonical            | morue (de cabillaud)
                                                    | Charlotte (pomme de terre)
ARCHETYPE      | Transformation/Préparation        | bœuf haché, emmental
               | Découpe spécifique                | steak, entrecôte
               | Processus de conservation         | jambon cru, saumon fumé
```

---

## 🔄 WORKFLOW D'AJOUT D'UN NOUVEL INGRÉDIENT

1. **Identifier l'aliment de base** → Existe-t-il un canonical_food correspondant?
   - Si OUI → passer à l'étape 2
   - Si NON → créer le canonical_food

2. **Est-ce une variété spécifique?** → Faut-il un cultivar?
   - Si OUI → créer le cultivar avec lien vers le canonical
   - Si NON → passer à l'étape 3

3. **Est-ce transformé/préparé?** → Créer un archetype
   - Définir le `process` (ex: "haché", "fumé", "fromage affiné")
   - Lier au canonical_food (ou cultivar si pertinent)
   - Définir l'unité primaire

---

## 📊 EXEMPLES COMPLETS

### Exemple 1: Bourride sétoise (recette de l'utilisateur)
Ingrédients: jaune d'œuf, huile d'olive, ail

```
1. "oeuf" → canonical_food
   "jaune d'œuf" → archetype (process: "séparation")

2. "olive" → canonical_food
   "huile d'olive" → archetype (process: "pressage")

3. "ail" → canonical_food (pas de transformation)
```

### Exemple 2: Burger au bœuf
Ingrédients: steak haché, pain burger, fromage

```
1. "bœuf" → canonical_food
   "steak haché" → archetype (process: "haché+formé")

2. "farine de blé" → archetype (du canonical "blé")
   "pain burger" → archetype (process: "panification")
   OU "pain burger" → canonical (par simplicité)

3. "lait" → canonical_food
   "cheddar" → archetype (process: "fromage affiné")
```

---

## 🚀 PROCHAINES ÉTAPES

1. Valider cette hiérarchie avec l'équipe
2. Migrer les données existantes si nécessaire
3. Créer les canonical_foods manquants
4. Créer les cultivars nécessaires
5. Créer les archetypes pour les transformations courantes
6. Mettre à jour le script d'import des recettes

