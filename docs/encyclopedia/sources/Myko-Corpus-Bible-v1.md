# Myko Corpus Bible — Master Blueprint

## Objectif

Construire la meilleure base de connaissances culinaire possible afin que le
moteur de planification raisonne sur la cuisine et non sur une simple liste de
recettes.

| Objet | Cible |
|---|---:|
| Ingrédients canoniques | 4 500 |
| Techniques culinaires | 250 |
| Préparations intermédiaires | 250 |
| Sauces | 300 |
| Accompagnements | 300 |
| Recettes | 2 000 |
| Desserts | 350 |
| Boissons | 150 |

## Architecture

```text
Produits commerciaux
        │
        ▼
Ingrédients canoniques
        │
 ┌──────┴──────┐
 ▼             ▼
Techniques  Préparations
        │
        ▼
Sauces / Accompagnements
        │
        ▼
Recettes
        │
        ▼
Assiettes
        │
        ▼
Planning
```

## 01 — Ingredient Canonical Database

Chaque ingrédient reçoit un identifiant stable, par exemple `ING-000001`.

Informations minimales :

- nom canonique ;
- synonymes ;
- catégorie ;
- sous-catégorie ;
- nutrition ;
- densité ;
- unités ;
- formes culinaires ;
- DLC ;
- saison ;
- substitutions ;
- allergènes ;
- Open Food Facts liés ;
- produits commerciaux liés ;
- recettes utilisant cet ingrédient.

Règle absolue :

> Un concept culinaire = un seul ingrédient canonique.

## 02 — Taxonomie culinaire

- Petit-déjeuner
- Collation
- Entrée
- Plat principal
- Accompagnement
- Sauce
- Préparation
- Dessert
- Boisson

## 03 — Préparations intermédiaires

Toutes les préparations réutilisables deviennent des objets.

Exemples :

- béchamel ;
- fond brun ;
- fond blanc ;
- bouillon ;
- pâte brisée ;
- pâte feuilletée ;
- pâte à pizza ;
- pâte à choux ;
- pesto ;
- mayonnaise ;
- crème pâtissière ;
- caramel ;
- lemon curd.

## 04 — Accompagnements

Le planning ne choisit plus uniquement une recette. Il construit une assiette.

Exemple :

```text
Carbonade
    ↓
Pommes vapeur
    ↓
Haricots verts
    ↓
Quantités adaptées à chaque personne
```

## 05 — Métadonnées obligatoires des recettes

Chaque recette devra posséder :

- famille culinaire ;
- pays ;
- saison ;
- niveau de difficulté ;
- temps ;
- batchabilité ;
- qualité après congélation ;
- qualité après réchauffage ;
- score de diversité ;
- profil sensoriel ;
- accompagnements compatibles ;
- sauces compatibles ;
- variantes ;
- type de repas ;
- complétude nutritionnelle.

## 06 — Catalogue maître

Le projet sera construit dans cet ordre :

1. catalogue exhaustif des ingrédients ;
2. catalogue des techniques ;
3. catalogue des préparations ;
4. catalogue des sauces ;
5. catalogue des accompagnements ;
6. catalogue des recettes (environ 2 000) ;
7. rédaction détaillée par lots homogènes.

## 07 — Rédaction par lots

Exemple :

- Lot 01 — Salades françaises
- Lot 02 — Salades italiennes
- Lot 03 — Soupes
- Lot 04 — Veloutés

Chaque lot passe par validation, normalisation, enrichissement et intégration
avant le suivant.

## 08 — Principe directeur

Le volume n’est jamais l’objectif.

Chaque nouvel objet doit améliorer :

- la planification ;
- la nutrition ;
- les courses ;
- le stock ;
- les substitutions ;
- le batch cooking ;
- l’expérience utilisateur.

Cette bible est le document fondateur du futur corpus Myko.
