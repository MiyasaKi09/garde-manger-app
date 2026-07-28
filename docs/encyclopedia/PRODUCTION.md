# MYKO — Protocole de production de l’encyclopédie

## Finalité

Les 48 volumes constituent le corpus de référence à terminer **avant** de
brancher les ingrédients, recettes, interactions, automatismes de planning,
stock, courses ou IA dans le produit.

La présence d’un sommaire, d’un contrat, d’un nom, d’une ligne SQL ou d’un
rattachement automatique ne signifie pas qu’un contenu est terminé.

## Les trois niveaux à ne jamais confondre

| Niveau | Définition | Peut compter dans la complétude ? |
|---|---|---:|
| Inventorié | identité ou terme repéré, éventuellement classé automatiquement | non |
| Rédigé | fiche matériellement remplie avec tous ses champs obligatoires | non |
| Validé | fiche sourcée, contrôlée, reliée, sans blocage et passée par toutes les portes qualité | oui |

Une entrée ne passe jamais directement de l’inventaire à la validation.

## Porte globale d’intégration

`ready_for_integration` vaut `true` uniquement si :

1. les 282 livres possèdent leur contenu réel ;
2. chaque livre a atteint sa cible avec des entrées validées ;
3. les 48 volumes sont validés ;
4. toutes les dépendances amont sont validées ;
5. les contrôles de V47 passent sans erreur critique ;
6. les manifestes générés correspondent exactement aux sources versionnées.

Tant que cette porte est fermée :

- les agrégats Supabase servent seulement à mesurer l’inventaire existant ;
- aucune quantité live ne peut augmenter le pourcentage de complétude ;
- l’IA ne peut pas promouvoir un candidat en contenu validé ;
- les objets incomplets ne deviennent pas des références du planning.

## Définition de terminé par famille de volumes

### V00 — Doctrine

Les six livres doivent être intégralement rédigés, cohérents entre eux,
illustrés par des exemples et contre-exemples et reliés à des tests
machine-readable. V00 fixe les définitions qui gouvernent tous les autres
volumes.

### V01 — Ingrédients

V01 est complet à **4 500 ingrédients canoniques validés**, avec au minimum :

- identité, code stable, taxonomie et synonymes ;
- variétés utiles et formes culinaires distinctes ;
- unités autorisées, poids unitaires et densités applicables ;
- conservation par forme, emballage et état ouvert ;
- saisonnalité géographique ;
- profil nutritionnel sourcé ;
- allergènes ;
- compatibilités, substitutions et impacts de substitution ;
- profil sensoriel ;
- provenance, confiance et historique.

Une ligne CIQUAL ou Open Food Facts n’est pas à elle seule un ingrédient
canonique complet. Elle est une source ou un produit lié.

### V02 — Techniques

V02 est complet à **250 techniques canoniques validées**. Un mot extrait d’une
étape de recette n’est qu’un candidat. Chaque technique doit décrire le geste,
le matériel, les paramètres mesurables, les signes de réussite, les erreurs,
les risques, les impacts nutritionnels, les ingrédients compatibles et les
transformations produites.

### V03 à V09 — Objets culinaires réutilisables

| Volume | Cible validée |
|---|---:|
| V03 Préparations intermédiaires | 250 |
| V04 Sauces | 300 |
| V05 Accompagnements | 300 |
| V06 Desserts | 350 |
| V07 Petits-déjeuners | 120 |
| V08 Collations | 120 |
| V09 Boissons | 150 |

Chaque objet possède une identité propre et une fiche exécutable. La simple
mention d’une sauce, d’un bouillon ou d’un accompagnement dans une recette ne
compte pas comme fiche rédigée.

### V10 — Catalogue maître

V10 est complet à **2 000 familles de recettes validées**. Le catalogue fixe
l’identité, la famille, l’origine, le rôle dans le repas, la saison, les
relations et la complétude attendue avant la rédaction détaillée. Il ne duplique
pas les recettes.

### V11 à V40 — Recettes rédigées

Chaque recette du catalogue maître est rédigée dans son volume principal puis
référencée depuis ses autres vues éditoriales. Une fiche validée comporte :

- ingrédients canoniques et formes exactes ;
- quantités convertibles et rendement ;
- composants et sous-recettes ;
- étapes ordonnées avec temps, températures et contrôles ;
- nutrition déterministe ;
- profil sensoriel et garde-fous d’identité ;
- batch, conservation, congélation et réchauffage ;
- sauces et accompagnements compatibles ;
- variantes et substitutions avec impacts ;
- allergènes, saison, difficulté et matériel ;
- score et contraintes de planning ;
- sources et niveau de confiance.

Les cibles propres inscrites dans chaque volume sont des objectifs de
couverture éditoriale. Une recette reste une seule identité canonique même si
elle appartient à plusieurs volumes.

### V41 à V47 — Règles du produit

Ces volumes sont des spécifications complètes, pas l’implémentation :

- V41 définit les menus canoniques ;
- V42 définit toutes les règles de planning et d’arbitrage ;
- V43 définit nutrition, calculs, objectifs et incertitudes ;
- V44 définit stock, lots, DLC, conversions et réservations ;
- V45 définit courses, conditionnements, fusion, budget et substitutions ;
- V46 définit strictement ce que l’IA peut décider ou expliquer ;
- V47 définit validations, fixtures et non-régressions.

Chaque règle doit avoir des entrées, sorties, invariants, priorités, modes
dégradés, exemples, contre-exemples et tests d’acceptation.

## Ordre de production

| Lot | Volumes | Condition de sortie |
|---|---|---|
| P0 | V00 | doctrine validée et non contradictoire |
| P1 | V01 | 4 500 ingrédients complets |
| P2 | V02 | 250 techniques complètes |
| P3 | V03 | 250 préparations complètes |
| P4 | V04–V05 | 300 sauces et 300 accompagnements complets |
| P5 | V06–V09 | quatre catalogues de repas complets |
| P6 | V10 | 2 000 identités de recettes arbitrées |
| P7 | V11–V40 | 2 000 recettes intégralement rédigées et reliées |
| P8 | V41–V46 | toutes les règles fonctionnelles documentées |
| P9 | V47 | corpus entier validé, fixtures et non-régressions vertes |
| I1 | Intégration | import atomique vers Supabase et branchement du site |

Un lot peut préparer l’inventaire du lot suivant, mais ne peut pas le valider
tant que ses dépendances ne sont pas validées.

## Politique de sources

Chaque fait conserve :

- l’identifiant de la source ;
- l’éditeur et la version ;
- la licence ;
- la date d’accès ;
- la clé de l’enregistrement source ;
- la méthode de transformation ;
- le niveau de confiance ;
- la justification de toute approximation.

Les sources publiques servent à proposer des candidats. Elles ne décident ni
de l’identité culinaire ni de la validation Myko.

## Politique de correction

Les contenus publiés sont immuables. Une correction produit une nouvelle
version, conserve la précédente et documente :

- la raison ;
- les champs modifiés ;
- l’impact sur les objets dépendants ;
- les migrations ou recalculs nécessaires ;
- le test empêchant la régression.

## État initial après création de l’ossature

La livraison `MYKO-ENC-1` fournit les 48 sommaires, les 282 contrats de livres,
un inventaire de candidats et les rattachements éditoriaux. Elle ne contient
encore aucun livre ni volume validé. Cet état est volontairement affiché comme
`authoring` et l’intégration globale reste bloquée.
