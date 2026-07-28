# MYKO — Encyclopédie culinaire

## Plan directeur de la bibliothèque documentaire

## Vision

Cette bibliothèque constitue la référence officielle de toute la connaissance
culinaire de Myko.

Elle ne décrit pas seulement des recettes mais l’ensemble des objets culinaires
nécessaires au moteur de planification, au stock, aux courses, à la nutrition et
aux futures IA.

## Volume 0 — Vision du projet

- Philosophie
- Architecture globale
- Principes de qualité
- Règles de normalisation
- Cycle de vie des données
- Roadmap

## Volume 1 — Bible des ingrédients

Objectif : référentiel de 2 500 à 3 000 ingrédients canoniques.

### Livres

A. Philosophie des ingrédients

B. Taxonomie complète :

- Fruits
- Légumes
- Céréales
- Légumineuses
- Viandes
- Poissons
- Fruits de mer
- Produits laitiers
- Matières grasses
- Herbes
- Épices
- Condiments
- Champignons
- Boissons
- Produits transformés

C. Conventions de nommage

D. Synonymes

E. Variétés

F. Formes culinaires

G. Unités

H. Densités

I. Conservation

J. Saisonnalité

K. Nutrition

L. Allergènes

M. Compatibilités

N. Substitutions

O. Profils sensoriels

P. Données Open Food Facts

Q. Historique

## Volume 2 — Bible des techniques

Environ 250 techniques :

- découpe ;
- cuisson ;
- préparation ;
- dressage ;
- conservation ;
- fermentation ;
- déshydratation ;
- fumage ;
- sous-vide.

Chaque technique précise :

- le matériel ;
- la difficulté ;
- le temps ;
- les impacts nutritionnels ;
- les ingrédients compatibles.

## Volume 3 — Préparations intermédiaires

Environ 250 :

- fonds ;
- bouillons ;
- pâtes ;
- appareils ;
- crèmes ;
- bases pâtissières ;
- marinades ;
- pâtes levées.

Toutes sont réutilisables par les recettes.

## Volume 4 — Sauces

Environ 300 :

- françaises ;
- italiennes ;
- asiatiques ;
- mexicaines ;
- indiennes ;
- froides ;
- chaudes ;
- émulsions ;
- réductions.

Chaque sauce est documentée comme une recette canonique.

## Volume 5 — Accompagnements

Environ 300 :

- pommes de terre ;
- riz ;
- pâtes ;
- polenta ;
- semoule ;
- légumes ;
- purées ;
- gratins ;
- salades ;
- légumineuses.

Le planning compose les assiettes à partir de ce corpus.

## Volume 6 — Desserts

Environ 350 :

- tartes ;
- gâteaux ;
- crèmes ;
- entremets ;
- biscuits ;
- glaces ;
- viennoiseries ;
- desserts fruités.

## Volume 7 — Petit-déjeuners

Environ 120 :

- porridges ;
- overnight oats ;
- tartines ;
- œufs ;
- granolas ;
- pancakes ;
- gaufres.

## Volume 8 — Collations

Environ 120 :

- fruits ;
- yaourts ;
- oléagineux ;
- préparations maison ;
- barres ;
- energy balls.

## Volume 9 — Boissons

Environ 150 :

- boissons chaudes ;
- boissons froides ;
- smoothies ;
- cocktails ;
- mocktails ;
- infusions.

## Volume 10 — Catalogue maître des recettes

Environ 2 000 recettes.

Aucune rédaction. Uniquement :

- nom canonique ;
- famille ;
- pays ;
- type de repas ;
- complétude.

Validation avant rédaction.

## Volumes 11 à 40 — Rédaction

Famille par famille.

Exemples :

11. Salades
12. Soupes
13. Bœuf
14. Porc
15. Volaille
16. Poissons
17. Fruits de mer
18. Cuisine italienne
19. Cuisine espagnole
20. Cuisine grecque
21. Cuisine maghrébine
22. Cuisine indienne
23. Cuisine asiatique
24. Cuisine mexicaine
25. Cuisine végétarienne
26. Sandwichs
27. Pizzas
28. Pâtes
29. Riz
30. Desserts français
31. Desserts italiens

Chaque recette contient :

- ingrédients canoniques ;
- étapes ;
- nutrition ;
- profils sensoriels ;
- batch ;
- congélation ;
- réchauffage ;
- accompagnements compatibles ;
- variantes ;
- substitutions ;
- score planning.

## Volume 41 — Menus

- menus saisonniers ;
- menus invités ;
- menus batch ;
- menus sportifs ;
- menus végétariens ;
- menus économiques.

## Volume 42 — Planning

- règles de génération ;
- fonction de score ;
- diversité ;
- rotation ;
- historique ;
- batch ;
- nutrition.

## Volume 43 — Données nutritionnelles

- macros ;
- micros ;
- objectifs ;
- calculs ;
- scores.

## Volume 44 — Stock

- gestion des DLC ;
- lots ;
- conversions ;
- réservations.

## Volume 45 — Courses

- construction intelligente ;
- optimisation ;
- fusion ;
- substitutions ;
- budget.

## Volume 46 — IA culinaire

- règles de décision ;
- explications ;
- contraintes ;
- apprentissage ;
- retour utilisateur.

## Volume 47 — Assurance qualité

- contrôles automatiques ;
- validation ;
- tests ;
- fixtures ;
- non-régression.

## Organisation des données

```text
PRODUITS
    ↓
INGRÉDIENTS
    ↓
TECHNIQUES
    ↓
PRÉPARATIONS
    ↓
SAUCES
    ↓
ACCOMPAGNEMENTS
    ↓
RECETTES
    ↓
ASSIETTES
    ↓
MENUS
    ↓
PLANNING
```

## Objectif final

Construire une bibliothèque culinaire de référence permettant :

- un corpus extrêmement cohérent ;
- une planification intelligente ;
- une gestion parfaite du stock ;
- des substitutions fiables ;
- une excellente qualité nutritionnelle ;
- une évolution durable sans duplication des connaissances.
