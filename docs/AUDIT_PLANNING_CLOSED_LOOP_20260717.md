# Audit complet du planning Myko — boucle fermée, restes et cuisine en avance

**Date de l’audit :** 17 juillet 2026  
**Périmètre :** dépôt GitHub, déploiement Vercel de production et base Supabase de Myko  
**Nature de cette PR :** audit et architecture cible uniquement, sans modification du comportement de production

---

## 1. Verdict

La partie planning n’est pas une boucle fermée malgré la présence de plusieurs briques qui portent ce nom.

Le système actuellement en production est composé de quatre circuits indépendants :

1. un moteur déterministe choisit quatorze recettes de déjeuner et dîner ;
2. un second module ajoute des petits-déjeuners et collations issus de rotations codées en dur ;
3. un endpoint séparé, déclenché manuellement, transforme après coup certains déjeuners en pseudo-batch cooking ;
4. l’exécution d’un repas peut créer un plat cuisiné restant, mais le moteur de planning ne relit jamais ce plat pour planifier sa consommation ou sa transformation.

Il existe donc une continuité technique partielle, mais pas de continuité métier entre :

> acheter → préparer → produire plusieurs portions → conserver → consommer → réutiliser ou transformer le reste → mettre à jour le stock → recalculer la suite.

Le défaut central n’est pas un problème de réglage des scores. Le modèle de décision actuel choisit **une recette indépendante par créneau**. Il ne sait pas choisir une chaîne d’actions culinaires dans le temps.

---

## 2. Ce qui était attendu

La cible fonctionnelle rappelée pendant l’audit est la suivante :

- Myko prépare une semaine glissante et conserve les prochaines 24 à 48 heures stables ;
- le stock physique ne diminue qu’après validation réelle d’une préparation ou d’un repas ;
- les réservations du planning sont distinctes du stock réellement possédé ;
- un plat préparé en six portions peut alimenter plusieurs repas avant sa date limite ;
- les plats déjà cuisinés sont prioritaires selon leur péremption ;
- un reste peut être mangé tel quel ou devenir l’entrée d’une autre recette validée ;
- la cuisine en avance fait partie du calcul du planning, elle n’est pas un post-traitement facultatif ;
- les tâches, les dépendances, les repas, les réservations et les courses appartiennent à la même version atomique ;
- l’utilisateur voit des quantités pratiques, tandis que les calculs fins restent internes ;
- l’intelligence artificielle ne décide pas des plats ni des transformations : elle travaille au plus sur un corpus validé, mais le planning reste déterministe et explicable.

---

## 3. Sources vérifiées

### GitHub

Audit du commit de production `6dce8bb5154bd4748cff3be0c8cfeb0bd53f9390`, branche `main`.

Fichiers centraux :

- `app/api/planning/generate-v3/route.js`
- `lib/domain/planning/closedLoopPlanner.js`
- `lib/domain/planning/canonicalPlanPayload.js`
- `lib/domain/planning/personalizedMeals.js`
- `app/api/planning/batch/generate/route.js`
- `app/api/meals/cook/route.js`
- `app/planning/page.js`
- `app/planning/components/WeekGrid.jsx`
- `app/planning/[importId]/batch/page.js`
- migrations de publication de la boucle fermée

### Vercel

Projet `garde-manger-app`, production déployée sur le commit audité, déploiement prêt et rattaché notamment à `my-ko.fr`.

Un incident antérieur du 16 juillet a produit trois erreurs sur `/api/planning/generate-v3` à cause d’un message de validation nul. Le correctif est présent dans le commit actuellement déployé. Aucun autre groupe d’erreurs Planning V3 n’a été remonté dans la fenêtre récente inspectée.

L’accès automatisé à la page authentifiée `/planning` n’a pas permis une inspection visuelle directe ; l’UX a donc été auditée à partir du code actif et des données réellement publiées.

### Supabase

Projet de production actif et sain. Les tables nécessaires existent déjà en grande partie :

- versions et créneaux de planning ;
- réservations de stock ;
- tâches et dépendances ;
- plats cuisinés et portions restantes ;
- sessions de cuisine ;
- recettes batch ;
- courses ;
- repas personnalisés.

Le problème n’est donc pas principalement l’absence de tables. Il vient de leur non-utilisation coordonnée.

---

## 4. État réellement publié en production

### Semaine du 20 au 26 juillet 2026

La dernière version active inspectée contient :

- 14 créneaux déjeuner/dîner ;
- 28 lignes de repas personnalisées au lieu des 49 attendues pour deux personnes avec petits-déjeuners et collations ;
- 14 tâches, toutes placées le jour même peu avant le repas ;
- 0 dépendance de tâches ;
- 0 recette batch ;
- 3 réservations de lots seulement ;
- 51 articles de courses ;
- aucun `cooked_dish_id` sur les 14 créneaux ;
- une couverture stock nulle ou presque nulle sur la quasi-totalité des repas.

La version est pourtant marquée `published` et l’interface affiche « La semaine est prête ».

Exemples de tâches publiées :

- préparer les boulettes le lundi juste avant le déjeuner ;
- préparer le poulet basquaise le lundi juste avant le dîner ;
- préparer chaque recette suivante le jour de sa consommation.

Il n’y a donc aucune organisation réelle en avance dans la version canonique.

### Semaine du 13 au 19 juillet 2026

Une version précédente contient bien 49 prises et cinq recettes dites batch, mais celles-ci ont été ajoutées après la publication du planning par un circuit distinct.

Les collations de Julien suivent une rotation fixe :

- 100 g de blanc de poulet rôti, amandes et fruit ;
- deux œufs, un paquet de jambon et un fruit ;
- une boîte de thon, amandes et fruit.

Aucune tâche antérieure ne produit le poulet rôti demandé par la collation. Il devient simplement un article à acheter.

Les cinq recettes batch sont toutes calibrées à deux portions, soit une portion par personne. Elles n’organisent donc pas une vraie surproduction destinée à plusieurs repas. Certaines métadonnées sont contradictoires : une salade avec œuf est marquée congelable et « encore meilleure réchauffée » alors que sa consigne indique de la manger froide.

Enfin, un plat cuisiné expiré depuis juin possède encore une portion restante non clôturée, ce qui révèle l’absence de politique robuste d’exclusion ou d’archivage des restes périmés.

---

## 5. Architecture actuelle

```text
Inventaire brut
      │
      ▼
Planificateur 14 recettes indépendantes
      │
      ├── réservations exactes en grammes
      ├── courses exactes en grammes
      └── une tâche par repas, le jour même

Plan 14 recettes
      │
      ▼
Personnalisation séparée
      ├── portions par quarts de portion
      ├── petit-déjeuner codé en dur
      └── collation codée en dur

Bouton manuel séparé
      │
      ▼
Générateur batch postérieur
      ├── seulement les déjeuners lundi-vendredi
      ├── regroupement par nom de plat
      ├── appel Anthropic possible
      └── anciennes tâches remplacées par du texte

Validation d’un repas
      │
      ▼
Déduction réelle du stock + éventuelle création d’un reste
      │
      └── aucune remontée vers le prochain calcul de planning
```

Cette architecture explique presque tous les symptômes observés.

---

## 6. Constats détaillés

### F01 — Critique — Le moteur ne planifie pas des flux de nourriture

`generateClosedLoopPlan` parcourt les créneaux et choisit une recette par créneau. Son état contient le stock restant, les recettes déjà choisies et un résumé hebdomadaire. Il ne contient ni productions culinaires futures, ni plats cuisinés existants, ni composants préparés, ni dépendances.

Conséquences :

- impossible de cuisiner six portions pour en utiliser deux aujourd’hui et quatre plus tard ;
- impossible de distinguer « préparer », « réchauffer », « assembler » et « transformer » ;
- impossible de garantir qu’un ingrédient transformé demandé mardi a bien été produit lundi ;
- chaque repas est optimisé comme une île.

### F02 — Critique — Les restes sont créés mais invisibles au planificateur

L’endpoint de validation d’un repas sait :

- créer un `cooked_dishes` lorsque la quantité préparée dépasse la quantité mangée ;
- enregistrer les portions restantes et leur date limite ;
- consommer un plat cuisiné existant ;
- ne déduire le stock qu’au moment réel de l’exécution.

C’est une bonne base d’exécution. En revanche, `generate-v3` ne charge que les `inventory_lots` bruts et les réservations. Il ne charge jamais `cooked_dishes`.

La boucle est donc cassée : Myko sait qu’un reste existe après cuisson, mais l’oublie lorsqu’il prépare la semaine suivante ou régénère un repas.

### F03 — Critique — Aucune transformation explicite de reste

Le système ne possède pas de graphe validé du type :

```text
poulet rôti préparé
  ├── portion servie telle quelle
  ├── salade de poulet
  ├── wrap au poulet
  └── curry de poulet déjà cuit
```

Sans cette structure, deux mauvaises options subsistent :

- ignorer les restes ;
- laisser un modèle génératif inventer une transformation.

La cible doit au contraire utiliser des règles de transformation issues du corpus culinaire validé.

### F04 — Critique — La collation au poulet est une constante, pas une décision faisable

Le fichier `personalizedMeals.js` contient une table d’aliments et une rotation codée en dur par prénom. Pour Julien, un jour sur trois demande exactement 100 g de blanc de poulet rôti.

Ce choix est fait après le planning principal :

- il ne vérifie pas la présence d’un plat de poulet déjà cuisiné ;
- il ne crée pas de tâche de cuisson ;
- il ne dépend d’aucune production antérieure ;
- il ne réserve aucun plat cuisiné ;
- il est transformé directement en besoin de courses avec stock déclaré à zéro.

Une collation ne devrait être autorisée que si chaque composant possède une source antérieure : stock brut consommable, produit acheté, ou production planifiée terminée avant l’heure de consommation.

### F05 — Élevé — Petits-déjeuners et collations contournent la boucle stock

Les supports personnalisés sont ajoutés après l’allocation des recettes. Leurs besoins sont agrégés par libellé puis envoyés aux courses avec `stock_qty = 0` et `reserved_qty = 0`.

Conséquences :

- achats en double possibles ;
- aliments déjà présents non utilisés ;
- absence de réservation ;
- absence de FEFO ;
- aucune cohérence avec un composant préparé.

Tous les types de prise doivent passer par le même modèle de ressources, même lorsque l’UX les présente plus simplement.

### F06 — Critique — Le batch cooking est un post-traitement facultatif

Le planning canonique est publié sans batch. L’utilisateur doit ensuite cliquer sur « Organiser les préparations », ce qui appelle un autre endpoint.

Ce second endpoint ne modifie pas la décision de repas. Il cherche seulement quand cuisiner les déjeuners déjà choisis. Il ne peut donc pas optimiser conjointement :

- choix des plats ;
- nombre de portions ;
- réutilisation de composants ;
- durée des sessions ;
- contraintes de conservation ;
- charge réelle des appareils ;
- produits urgents ;
- courses.

Le batch cooking doit être une dimension du solveur avant publication, pas une décoration ajoutée après coup.

### F07 — Critique — Le pseudo-batch cuisine surtout des plats uniques

Le générateur batch regroupe les lignes de déjeuner par nom de plat. Or le moteur principal pénalise fortement la répétition de recette. La plupart des groupes contiennent donc un seul déjeuner.

Le résultat est une liste de plats distincts à cuisiner d’avance, chacun en deux portions. Ce n’est pas du batch cooking au sens utile :

- pas de grande production ;
- pas de composants communs ;
- pas de mutualisation des découpes, sauces, céréales ou cuissons au four ;
- peu de réduction du temps actif ;
- pas de repas dérivés.

### F08 — Élevé — Les portions du batch sont calculées avec le nombre de lignes

L’endpoint batch utilise le nombre de lignes de repas pour déterminer le nombre de portions, alors que les repas personnalisés possèdent un `planned_servings` pouvant valoir 0,75, 1,25, 1,5, etc.

Deux lignes ne représentent donc pas nécessairement deux portions de recette. Le batch peut sous-produire ou surproduire sans le savoir.

### F09 — Critique — Deux systèmes de tâches se remplacent mutuellement

La publication canonique crée des tâches versionnées avec horaire, priorité et type. L’endpoint batch supprime ensuite les tâches de l’import et les recrée sous forme legacy, souvent sans :

- `plan_version_id` ;
- `meal_plan_slot_id` ;
- `stable_key` ;
- échéance ;
- deadline de sécurité ;
- instructions structurées ;
- dépendances.

Une régénération ou un nouveau batch peut donc faire diverger repas, tâches et version active.

### F10 — Critique — Le graphe de dépendances est volontairement vide

Le payload canonique publie toujours `dependencies: []`. La table `prep_task_dependencies` existe mais ne contient aucune ligne en production.

Une collation au poulet ne peut donc pas dépendre d’une tâche « rôtir le poulet ». Un repas réchauffé ne peut pas dépendre d’une tâche de cuisson et de portionnement. Un assemblage ne peut pas dépendre d’un composant préparé.

La table est prête, mais le moteur ne produit pas le graphe.

### F11 — Élevé — Les tâches sont planifiées le jour même

Pour chaque recette, `canonicalPlanPayload.js` produit une seule tâche « Préparer X » à la date du repas. L’heure la plus précoce est simplement l’heure du repas moins le temps de préparation actif.

Le système ne connaît pas :

- les disponibilités de cuisine du foyer ;
- une session du dimanche ;
- une session d’appoint le mercredi ;
- la cuisson passive ;
- les temps parallélisables ;
- le refroidissement ;
- le portionnement ;
- l’étiquetage ;
- la décongélation ;
- le réchauffage.

### F12 — Élevé — L’intelligence artificielle reste dans le chemin batch

L’endpoint batch appelle Anthropic pour fixer les dates de cuisson et les règles de conservation, avec un repli déterministe en cas d’échec.

Cela contredit l’architecture cible : un même planning peut recevoir une organisation différente selon la disponibilité de l’API ou la réponse du modèle. La sécurité alimentaire et la faisabilité temporelle ne doivent pas dépendre d’un texte généré.

### F13 — Élevé — Les règles de conservation par regex produisent déjà des incohérences

Le fallback classe les plats à partir de leur nom. Les données constatées montrent des contradictions : salade avec œuf marquée congelable, texte de réchauffage incohérent avec le service froid, recettes batch incomplètes.

La conservation doit venir :

1. du profil de sortie de la recette validée ;
2. du procédé réellement choisi ;
3. du mode de stockage ;
4. des ingrédients les plus contraignants ;
5. d’une politique versionnée.

### F14 — Élevé — Les quantités affichées sont trop précises pour la cuisine quotidienne

Le calcul nutritionnel fait varier le déjeuner et le dîner de 0,5 à 4 portions par pas de 0,25. L’interface peut donc afficher des valeurs comme 1,25 portion et des courses au gramme exact.

Ce niveau de précision est utile en interne, mais mauvais dans l’usage :

- il donne une illusion de mesure parfaite ;
- il rend le service pénible ;
- il ne correspond pas aux contenants et ustensiles ;
- il amplifie les erreurs nutritionnelles des données sources.

Le modèle doit conserver le calcul fin en arrière-plan et exposer :

- petite, standard ou grande portion ;
- un nombre de bols, parts ou barquettes ;
- des unités entières lorsque pertinentes ;
- des poids arrondis adaptés à l’aliment ;
- les détails exacts uniquement sur demande.

### F15 — Élevé — La validation nutritionnelle est trompeuse

La propriété journalière `valid` ne vérifie que l’écart calorique de ±5 %. Les protéines, glucides, lipides et fibres participent à un score d’optimisation, mais ne bloquent pas la validation.

La base peut ainsi publier « objectifs nutritionnels valides » alors que certaines cibles de macronutriments sont sensiblement manquées.

Il faut distinguer :

- validité de sécurité ;
- couverture des données ;
- respect de l’énergie ;
- respect des protéines ;
- qualité hebdomadaire ;
- alertes non bloquantes.

Un indicateur global « 100 % » ne doit pas agréger ces notions.

### F16 — Élevé — La semaine peut être déclarée prête alors qu’elle est incomplète

La dernière semaine active contient seulement 28 repas personnalisés, aucun petit-déjeuner, aucune collation et aucun batch. Elle est néanmoins `published`.

La page possède un mécanisme de « réparation personnalisée » lancé lors de son ouverture. Cette réparation :

- n’est pas garantie avant que l’utilisateur consulte la semaine ;
- modifie silencieusement des données au chargement ;
- peut déclencher une nouvelle version sans décision explicite ;
- rend l’état publié dépendant du passage sur une page.

Une version doit être complète avant activation, ou explicitement marquée incomplète.

### F17 — Élevé — La régénération silencieuse fragilise la stabilité 24–48 h

La page génère automatiquement les semaines manquantes et peut republier une semaine incomplète au chargement. Les créneaux proches ne sont pas verrouillés automatiquement par une politique temporelle.

La cible devrait :

- verrouiller les prises et préparations imminentes ;
- conserver les tâches déjà commencées ;
- demander confirmation lorsqu’un changement invalide un achat ou une préparation ;
- recalculer seulement le sous-graphe impacté.

### F18 — Moyen — L’UX du batch est pratiquement dissociée du planning

Une page batch détaillée existe et sait afficher les sessions, les recettes et la checklist. La page principale génère les préparations mais ne fournit pas de parcours évident vers cette page après le calcul.

Le planning hebdomadaire montre au mieux un petit badge « préparé · réchauffer ». Il ne montre pas :

- ce qui doit être cuisiné aujourd’hui ;
- ce que la session va produire ;
- quels repas seront couverts ;
- les portions restantes ;
- les transformations prévues.

### F19 — Moyen — Les membres et leurs règles restent codés en dur

Le comportement par défaut dépend des chaînes `Julien` et `Zoé`, et la grille possède deux filtres nommés explicitement.

Les préférences de repas, collations, variantes et tailles de portion doivent être portées par `household_members.preferences`, puis l’UI doit être construite dynamiquement.

### F20 — Moyen — Le moteur exact-forme ne comprend pas les états culinaires

L’inventaire est converti en grammes puis rapproché uniquement des formes exactes attendues par les recettes. Cette rigueur évite des substitutions dangereuses, mais elle ne modélise pas :

- cru versus cuit ;
- poulet rôti versus poulet cru ;
- riz cuit versus riz sec ;
- sauce préparée ;
- légumes déjà rôtis ;
- portions congelées ;
- pertes et rendements de cuisson.

La bonne réponse n’est pas d’assouplir le matching textuel. Il faut un modèle explicite de transformation et de rendement.

### F21 — Moyen — La qualité du plan ne pénalise pas assez le recours massif aux courses

`allowShopping` est toujours activé. Le moteur peut publier une semaine avec presque aucune couverture stock tant qu’il sait générer une liste de courses.

L’état « prêt » devrait être séparé en :

- plan nutritionnellement construit ;
- courses à faire ;
- ingrédients sécurisés ;
- préparations planifiées ;
- repas effectivement prêts.

---

## 7. Cause racine

Le système modélise aujourd’hui des **recettes consommées**, alors que le besoin porte sur des **ressources transformées dans le temps**.

Une vraie boucle fermée doit représenter cinq objets :

1. **ressource disponible** : lot brut, contenant ouvert, plat cuisiné ou composant ;
2. **action** : acheter, préparer, cuire, refroidir, congeler, décongeler, réchauffer, assembler ;
3. **production** : quantité et forme créées par une action ;
4. **consommation** : quantité prélevée par un repas ou une autre préparation ;
5. **dépendance temporelle** : une consommation ne peut exister qu’après sa production et avant sa péremption.

Tant que le solveur choisit seulement des recettes, les corrections locales ne pourront pas résoudre le problème.

---

## 8. Architecture cible

```text
OBJECTIFS DU FOYER
préférences · nutrition · disponibilités · stabilité
                         │
                         ▼
ÉTAT DES RESSOURCES
lots bruts · plats cuisinés · composants · achats déjà faits
                         │
                         ▼
CATALOGUE VALIDÉ
recettes · sorties · rendements · conservation · transformations
                         │
                         ▼
COMPILATEUR DE PLANNING DÉTERMINISTE
  1. place les restes existants FEFO
  2. choisit les productions mutualisables
  3. choisit les repas et transformations compatibles
  4. dimensionne les quantités produites
  5. construit les tâches et dépendances
  6. réserve les ressources
  7. calcule les achats restants
  8. valide nutrition, sécurité, temps et stabilité
                         │
                         ▼
PUBLICATION ATOMIQUE D’UNE VERSION
repas · productions · consommations · tâches · dépendances
réservations · courses · explications
                         │
                         ▼
EXÉCUTION
validation réelle → déduction stock → matérialisation des productions
                         │
                         └──────────────► nouvel état des ressources
```

### Principe fondamental

Un repas ne référence plus seulement une recette. Il référence une **source de nourriture** :

- recette à cuisiner fraîche ;
- production planifiée ;
- plat cuisiné existant ;
- transformation d’un plat ou composant existant ;
- assemblage sans cuisson.

---

## 9. Modèle de données recommandé

Les tables existantes peuvent être conservées, mais il manque une couche de prévision des productions.

### 9.1 `planned_productions`

Prévision, non assimilée à du stock réel :

- `id`
- `user_id`
- `plan_version_id`
- `recipe_execution_id`
- `source_task_id`
- `output_kind` : `dish`, `component`, `sauce`, `cooked_protein`, etc.
- `output_form_id` ou référence canonique de forme culinaire
- `planned_quantity`
- `planned_unit`
- `planned_portions`
- `storage_method`
- `available_from`
- `use_by`
- `status` : `planned`, `in_progress`, `materialized`, `cancelled`
- `materialized_cooked_dish_id`

Lorsqu’une tâche est validée, cette prévision est matérialisée en `cooked_dishes` ou en lot transformé réel.

### 9.2 `planned_consumptions`

Lien explicite entre une ressource et son usage :

- `slot_id` ou `consumer_task_id`
- `inventory_lot_id`, `cooked_dish_id` ou `planned_production_id`
- quantité prévue ;
- unité ;
- stratégie FEFO ;
- rôle : plat principal, composant, transformation.

### 9.3 Sorties de recette versionnées

Chaque version de recette doit déclarer :

- forme de sortie ;
- rendement ;
- nombre de portions standard ;
- facteur cru/cuit ;
- modalités de conservation ;
- compatibilité congélation ;
- délai de refroidissement ;
- possibilités de réchauffage ;
- transformations aval autorisées.

### 9.4 Règles de transformation

Exemples de règles déterministes :

```text
poulet rôti → salade de poulet
poulet rôti → wrap de poulet
légumes rôtis → frittata
légumes rôtis → soupe
riz cuit → riz sauté
lentilles cuites → salade de lentilles
sauce bolognaise → pâtes / lasagnes / hachis
```

Chaque règle pointe vers une recette réelle du corpus et indique les quantités, compléments et limites de conservation. Aucune transformation n’est inventée en production.

---

## 10. Algorithme cible

### Étape 1 — Figer l’horizon proche

- verrouiller les repas mangés ;
- verrouiller les prochaines 24 à 48 heures sauf demande explicite ;
- conserver les tâches commencées et les achats déjà validés ;
- charger la version active comme point de départ.

### Étape 2 — Charger les ressources

- lots bruts disponibles moins réservations actives ;
- plats cuisinés non expirés, triés FEFO ;
- productions déjà matérialisées ;
- achats cochés mais pas encore rangés comme ressources entrantes ;
- productions planifiées encore valides.

### Étape 3 — Placer les restes

Ordre :

1. consommation directe avant péremption ;
2. transformation validée avant péremption ;
3. congélation si autorisée et utile ;
4. alerte explicite si aucune solution.

Le système ne doit jamais laisser un plat périmer silencieusement alors qu’un créneau compatible existe.

### Étape 4 — Construire des stratégies de production

Le solveur compare des stratégies complètes, par exemple :

- cuisiner quatre portions lundi, en manger deux lundi et deux mercredi ;
- cuisiner six portions dimanche, conserver deux, congeler quatre ;
- rôtir une plaque de légumes puis les utiliser dans trois recettes ;
- rôtir un poulet, servir un repas et réserver une partie pour une collation ou un wrap.

### Étape 5 — Dimensionner

Le calcul interne reste précis, mais les sorties sont arrondies selon :

- portions standard du foyer ;
- capacité des contenants ;
- taille commerciale ;
- unités culinaires ;
- rendement de cuisson.

### Étape 6 — Construire le graphe temporel

Exemple :

```text
Acheter poulet
  ↓
Rôtir poulet dimanche 17 h
  ↓
Refroidir et portionner
  ├── dîner dimanche
  ├── collation lundi
  └── préparer wrap mardi
          ↓
        déjeuner mardi
```

Chaque nœud possède une durée, une fenêtre, une deadline de sécurité et des ressources consommées ou produites.

### Étape 7 — Vérifier les contraintes

Bloquantes :

- allergie/interdit ;
- ressource sans source ;
- consommation avant production ;
- consommation après péremption ;
- quantité négative ;
- dépendance orpheline ;
- créneau sans repas ;
- plan non atomique.

Qualitatives :

- nutrition hebdomadaire ;
- diversité ;
- goût ;
- saison ;
- temps actif ;
- nombre de sessions ;
- couverture stock ;
- gaspillage ;
- coût.

### Étape 8 — Publier atomiquement

La même transaction doit publier :

- créneaux ;
- affectations par personne ;
- productions planifiées ;
- consommations planifiées ;
- réservations ;
- tâches ;
- dépendances ;
- courses ;
- explications ;
- validation.

Le batch ne doit plus supprimer ou recréer des tâches en dehors de cette version.

---

## 11. Nouvelle logique des collations

Les collations doivent devenir de petites recettes d’assemblage validées.

Exemple « poulet rôti + fruit » :

```text
Préconditions possibles :
- 1 portion de poulet rôti déjà présente dans cooked_dishes ; ou
- production planifiée de poulet rôti terminée avant la collation.

Sinon :
- proposer une autre collation faisable ; ou
- ajouter explicitement une préparation préalable si elle est raisonnable.
```

Les rotations ne doivent plus dépendre du prénom. Elles doivent utiliser :

- préférences du membre ;
- besoins nutritionnels ;
- ressources disponibles ;
- répétition récente ;
- temps et contexte de consommation ;
- faisabilité de transport si nécessaire.

---

## 12. Présentation des quantités

### Interne

Conserver :

- grammes ;
- densités ;
- poids unitaire ;
- multiplicateurs nutritionnels ;
- pertes et rendements ;
- réservations exactes.

### Affichage utilisateur

Afficher par défaut :

- `1 portion standard` plutôt que `1,25 portion` ;
- `1 grande portion` lorsque l’écart est significatif ;
- `2 œufs`, `1 pot`, `1 fruit`, `1 tranche`, `1 bol` ;
- `environ 150 g` uniquement lorsque le poids est utile ;
- `préparer 6 portions : 2 ce soir, 2 mercredi, 2 à congeler`.

Les valeurs exactes restent accessibles dans un panneau nutrition ou stock, sans polluer le geste culinaire.

---

## 13. UX cible

### Vue principale

Deux niveaux complémentaires :

1. **Aujourd’hui / prochaines actions**
   - quoi sortir du congélateur ;
   - quoi préparer ;
   - quoi réchauffer ;
   - quoi manger en priorité ;
   - temps actif total.

2. **Semaine**
   - repas ;
   - source du repas ;
   - statut de préparation ;
   - portions restantes prévues ;
   - session qui le couvre.

### Statuts lisibles par repas

- `à cuisiner frais` ;
- `préparé dimanche` ;
- `à réchauffer` ;
- `reste à finir` ;
- `transforme le reste de lundi` ;
- `à décongeler la veille` ;
- `ingrédients à acheter`.

### Session de cuisine

Afficher directement dans le planning :

> Dimanche 17 h · 75 min actives · 3 préparations · 10 portions produites · couvre 6 prises.

La page détaillée batch reste utile, mais elle devient l’exécution d’un plan déjà cohérent, pas un générateur parallèle.

### Modification

Avant validation d’un changement, montrer :

- repas remplacés ;
- tâches supprimées ou ajoutées ;
- productions devenues inutiles ;
- restes à reclasser ;
- courses modifiées ;
- impact sur les 48 heures verrouillées.

---

## 14. Plan de mise en œuvre

### Lot P0 — Correctifs de sécurité et de crédibilité

1. retirer les collations protéinées nécessitant une préparation lorsqu’aucune source n’existe ;
2. faire passer petits-déjeuners et collations dans l’allocation stock ;
3. exclure et signaler les `cooked_dishes` expirés ;
4. rendre la validation nutritionnelle multidimensionnelle ;
5. ne plus afficher « semaine prête » si les 49 prises attendues ou les tâches nécessaires manquent ;
6. ajouter un accès direct à la page batch ;
7. supprimer la réparation silencieuse au chargement ou la remplacer par un état explicite ;
8. empêcher l’endpoint batch d’effacer les tâches canoniques.

### Lot P1 — Reconnexion des restes

1. charger `cooked_dishes` dans le contexte du solveur ;
2. créer des candidats `consume_existing_dish` ;
3. relier les slots à `cooked_dish_id` ;
4. réserver des portions de plat cuisiné sans les décrémenter ;
5. appliquer FEFO ;
6. recalculer proprement après consommation, annulation ou péremption.

### Lot P2 — Productions et dépendances

1. ajouter `planned_productions` et `planned_consumptions` ;
2. publier de vraies dépendances ;
3. matérialiser une production lors de la validation de tâche ;
4. calculer les quantités produites au niveau foyer ;
5. assurer l’atomicité avec le reste de la version.

### Lot P3 — Batch déterministe intégré

1. retirer Anthropic du chemin de décision ;
2. intégrer les sessions au solveur principal ;
3. choisir conjointement plats, quantités et dates ;
4. gérer composants communs et surproduction volontaire ;
5. intégrer conservation, congélation et décongélation ;
6. prendre en compte la capacité temporelle de l’utilisateur.

### Lot P4 — Transformations de restes

1. modéliser les sorties culinaires et formes ;
2. créer un corpus de transformations validées ;
3. scorer consommation directe versus transformation ;
4. intégrer les compléments nécessaires aux courses ;
5. afficher clairement la filiation des plats.

### Lot P5 — UX et simplification des quantités

1. vue « prochaines actions » ;
2. sessions intégrées à la semaine ;
3. statuts source/préparation sur chaque repas ;
4. tailles de portions humaines ;
5. détails exacts repliés ;
6. aperçu d’impact avant régénération.

---

## 15. Tests d’acceptation indispensables

### A. Collation dépendante

Un planning ne peut pas publier « poulet rôti » en collation si aucun plat cuisiné ni aucune tâche antérieure ne produit ce poulet.

### B. Plat en six portions

Un hachis de six portions alimente trois repas de deux portions avant sa date limite, sans acheter ni recuisiner le plat.

### C. Reste FEFO

Deux plats cuisinés compatibles existent : celui qui expire le premier est affecté en premier.

### D. Transformation

Le reste d’un poulet rôti peut alimenter un wrap uniquement si une règle de transformation validée existe et si les autres ingrédients sont disponibles ou achetés.

### E. Batch atomique

La publication d’une semaine crée simultanément repas, productions, consommations, tâches, dépendances, réservations et courses sur le même `plan_version_id`.

### F. Exécution réelle

Avant validation de cuisson, le stock physique ne diminue pas et la production reste prévisionnelle. Après validation, le stock est déduit et le plat réel est créé.

### G. Régénération partielle

Remplacer le dîner de jeudi ne modifie pas les repas verrouillés, ne détruit pas une production encore utilisée et recalcule uniquement le sous-graphe impacté.

### H. Péremption

Un plat expiré n’est ni consommable, ni transformable, ni présenté comme disponible. Il déclenche une action de revue ou de perte.

### I. Quantités pratiques

Le calcul peut conserver 1,25 portion en interne, mais l’écran principal affiche une catégorie de portion compréhensible et la session produit un nombre cohérent de parts/barquettes.

### J. Cohérence nutritionnelle

Une journée ne peut pas être déclarée entièrement valide sur le seul respect des calories si une contrainte protéique bloquante n’est pas atteinte.

### K. Cohérence batch

Le nombre de portions d’une recette batch est calculé à partir des `planned_servings`, pas du nombre de lignes de repas.

### L. Aucun orphelin

Toute consommation possède exactement une source et toute tâche dépendante possède une tâche parente appartenant à la même version.

---

## 16. Recommandation finale

Ne pas continuer à corriger le planning par ajout de nouvelles règles dans `closedLoopPlanner.js` ou de nouveaux aliments dans `personalizedMeals.js`.

La prochaine intervention doit d’abord introduire le modèle **production → conservation → consommation** et reconnecter `cooked_dishes` au solveur. C’est le plus petit changement architectural qui débloque réellement :

- restes ;
- batch cooking ;
- préparation en avance ;
- collations faisables ;
- quantités produites ;
- stabilité ;
- courses cohérentes ;
- baisse du gaspillage.

Une fois ce socle en place, les optimisations nutritionnelles, sensorielles et économiques pourront enfin s’appliquer à un planning exécutable plutôt qu’à une simple liste de recettes.
