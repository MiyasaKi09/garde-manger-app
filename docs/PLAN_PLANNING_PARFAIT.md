# Plan — vers un planning parfait

> Ce document est un plan de travail, pas une spécification : il dit dans quel
> ordre attaquer, pourquoi cet ordre, et à quel chiffre on saura que c'est fait.
> Chaque constat ci-dessous a été **mesuré** sur `main` (`6466629`, 3 septembre
> 2026) avec le moteur réel et le corpus réel — jamais déduit du code ni supposé.
> Les commandes de mesure sont en annexe pour que chacun puisse refaire les
> relevés et contester un chiffre.

Demande d'origine : *« un planning parfait, complet. Je pense qu'un des problèmes
est lié au manque de recettes, au manque de variantes végé, au fait que la
plupart des plats ne peuvent pas être en batch, une plus grande intelligence de
choix du planning »* — précisé ensuite : *Zoé n'est pas végétarienne, elle veut
simplement manger moins de viande que Julien.*

---

## 0. Le verdict en une page

Les quatre soupçons sont **tous confirmés, mais aucun n'a la cause qu'on lui
prête**. Le vivier n'est pas trop petit : 470 plats servables, et le solveur en
retient douze par semaine sans en reprendre un seul sur trois semaines. Le
problème est que **le moteur ne voit pas les données qui décideraient d'un bon
choix**, et qu'il en voit de fausses :

| Soupçon | Ce que la mesure dit | Cause réelle |
|---|---|---|
| Pas assez de recettes | 470 plats servables, 0 reprise sur 3 semaines, 12 distincts / 14 | Le vivier est **déséquilibré** (74 % France, 27 % des créneaux sur des pâtes, densité protéique médiane 0,047 là où Julien en demande 0,104), pas trop petit. Débloquer les 186 non publiables est une impasse : 295 formes bloquantes, 40 formes corrigées n'en libèrent que 61. |
| Pas de variante végé | 181 lignées carnées, **11** ont un jumeau végé (6 %) | Vrai. Mais le mécanisme « moins de viande » existe déjà (`vegetarian_meat_swaps_per_week`) et, faute de jumeau, il sert à Zoé **un autre plat** — dont deux fois du **boudin noir**, classé végétarien par le moteur. |
| Les plats ne sont pas batchables | 370 / 520 sont candidats au batch, 407 « congelables » | Faux dans l'autre sens : **90 des 407 « congelables » refusent la congélation en toutes lettres** (pan bagnat, carottes râpées, salades). Le pan bagnat a été produit en batch ×3 et « réchauffé ». La DLC de toute production est une constante (3 jours), la prose « 24 heures » n'est pas lue. 33 bases partagées existent, **0 plat n'en utilise une**. |
| Le choix manque d'intelligence | Score à 17 termes, faisceau 48, historique 56 jours, goûts pondérés | L'intelligence existe. Elle est **aveugle** (classification carné/végé par regex sur 41 formes de viande, 40 formes carnées lui échappent), **sourde** (aucune interface n'appelle ni le retour de goût ni le moteur d'alternatives ; « Remplacer ce repas » part vers une Routine LLM hors règles), et **mal alimentée** (Julien à 66 % de sa cible protéique parce que le solveur choisit des plats à 0,03–0,05 g/kcal puis double ses portions de pâtes). |

Le plan qui en découle inverse l'ordre intuitif : **d'abord rendre vraies les
données que le moteur lit, ensuite lui donner ce qu'il ne voit pas (viande par
personne, densité par personne, bases partagées), enfin seulement grossir le
vivier — de façon ciblée, jamais en masse.**

Et avant tout : **redéployer**. Le corpus est importé au build ; la production
sert encore la version d'avant les correctifs de répétition et de rôles
d'assiette (six pizzas). Rien de ce plan n'est visible sans redéploiement.

---

## 1. Ce que « parfait » veut dire — critères mesurables

Un planning est jugé sur une semaine générée pour le foyer réel (Julien 2 357
kcal / 216 g de protéines ; Zoé 1 525 kcal / 75 g), avec historique, sans stock,
et sur **trois semaines consécutives** pour que la chance n'y soit pour rien.

| # | Critère | Aujourd'hui (mesuré) | Cible |
|---|---|---|---|
| P1 | Plats distincts sur 14 créneaux | 12 | ≥ 12, et 0 reprise à 3 semaines (déjà tenu) |
| P2 | Part des créneaux sur pâtes | 15 / 56 = 27 % | ≤ 15 % ; aucun féculent > 25 % |
| P3 | Part des repas dont la protéine principale est laitier ou œuf | 18 / 56 = 32 % | ≤ 20 % |
| P4 | Julien — jours ≥ 85 % de la cible protéique | 2 / 7 (moyenne 66 %) | ≥ 6 / 7 (moyenne ≥ 90 %) |
| P5 | Julien — ratio de portion nécessaire pour atteindre les kcal | 1,6 à 2,0 (plafond 2) | ≤ 1,3 |
| P6 | Zoé — repas carnés par semaine | identiques à Julien (6 / 14) | = sa cible déclarée (ex. 3), Julien inchangé |
| P7 | Zoé — substitutions **hors lignée** (autre plat que Julien) | 4 / 4 | 0 quand un jumeau existe ; ≤ 1 sinon |
| P8 | Faux végétariens servis à qui veut moins de viande | 2 / 4 (boudin noir) | 0, garanti par test sur tout le corpus |
| P9 | Plats distincts **à cuisiner** pour le foyer | 14 à 16 | ≤ 12 (bases partagées, jumeaux cuits ensemble) |
| P10 | Minutes de cuisine par semaine (tout frais) | 1 065 (152 / jour) | ≤ 600, sans descendre sous 12 plats distincts |
| P11 | Productions batch dont la conservation déclarée contredit le plan | pan bagnat 24 h planifié sur 3 jours | 0 |
| P12 | Plats liés à une base partagée | 0 / 520 | ≥ 120, et ≥ 4 repas / semaine en tirent parti |
| P13 | Cuisines distinctes sur 3 semaines | 17 libellés, France 9 + 7 | ≥ 8 cuisines, aucune > 40 % |
| P14 | Retour de goût atteignable depuis le planning | non (aucun appelant) | oui, et lu par la génération suivante |

Ces quatorze lignes sont la définition de « fait ». Un chantier qui n'en bouge
aucune n'est pas prioritaire, quel que soit son attrait.

---

## 2. Diagnostic chiffré

### 2.1 Le vivier

- 706 recettes au corpus, **520 publiables**, **470 servables** en repas (196
  `main`, 179 `complete`, 95 `side`) ; 33 composants ; 17 desserts.
- Temps : 101 plats à ≤ 15 min de préparation, **76 à ≤ 30 min au total**, 164 à
  ≤ 45 min ; médiane 55 min. 151 plats servent ≥ 6.
- Origine : **France 350 / 470 (74 %)**, Italie 33, Grèce 9, Espagne 8, Maroc 8,
  Chine 6. Catégories : plat mijoté 89, salade composée 24, plat au four 21,
  tarte salée 20, gratin 19.
- 186 non publiables : 116 par forme inconnue, 131 par proxy de confiance C (62
  uniquement par proxy), 37 par conversion manquante. **295 formes bloquantes
  distinctes.** Déblocage glouton : 4 formes → 15 recettes, 10 → 27, 40 → 61.
  La queue est longue ; ce n'est pas un levier.

### 2.2 Végétarien et « moins de viande »

- 215 / 520 classés végétariens par `classifyRecipe`. **22 sont faux** : 15
  contiennent du bouillon de volaille, 7 du boudin noir. Cause : la
  classification lit une regex de 13 mots (`boeuf|veau|…|viande`) et les
  catégories `viandes`/`volailles`, alors que le catalogue range **40 formes
  carnées** ailleurs (`produits_transformes` : boudin, lardons, jambons,
  saucisses, confit ; `preparations_culinaires` : bouillons, fumet, dashi ;
  `condiments_sauces` : sauce poisson, gélatine ; `matieres_grasses` :
  saindoux).
- 181 lignées carnées, 11 avec jumeau végé (6 %) ; manque par catégorie : plat
  mijoté 25, plat sauté 7, tarte salée 6.
- Le mécanisme « moins de viande » **existe** : `vegetarian_meat_swaps_per_week`
  par membre (réglage exposé dans Paramètres → Planning, « Variantes
  végétariennes »). Mesure à 4 swaps demandés pour Zoé : 4 obtenus, **4 hors
  lignée** (Zoé mange un autre plat que Julien : 16 plats à cuisiner au lieu de
  14), et deux des quatre sont *Poêlée de rattes au boudin noir* et *Boudin
  noir aux pommes flambées* — servis comme « variante végétarienne » du
  pastitsio.
- Sans ce réglage, Julien et Zoé mangent strictement les mêmes plats
  (`variant_kind: household_base` sur 14 / 14).

### 2.3 Nutrition par personne

- Julien : kcal 101 %, **protéines 66 %** (112 à 204 g / jour), fibres 113 %,
  glucides 125 %, lipides 114 %. 2 jours sur 7 au-dessus de 85 % de la cible.
- Pour atteindre les kcal, la couche personnalisée sert à Julien **1,6 à 2,0
  portions** (plafond 2) de plats à 0,03–0,05 g de protéines par kcal — d'où le
  surplus de glucides et de lipides sans rattraper les protéines. Le jour où le
  déjeuner est dense (morue-pois chiches 0,138 ; tajine de veau-lentilles
  0,135), la cible est atteinte.
- Zoé : 99 / 102 / 119 %. Sa semaine est bonne.
- Le test `proteinDensity` reste rouge sur `main` (147,2 g contre 148,2 g de
  borne). Ajouter trois plats denses n'a rien changé (valeur identique à la 13e
  décimale) : le solveur ne les choisit pas. Poids nutritionnels actuels : kcal
  0,40, protéines 0,34, fibres 0,14, glucides 0,06, lipides 0,06.

### 2.4 Variété et plaisir

- Avec l'historique de 56 jours (le chemin de production) : **0 reprise sur 3
  semaines**, 12 distincts / 14 chaque semaine. Sans historique, la même semaine
  sort à l'identique quelle que soit la date : la variété inter-semaines repose
  entièrement sur l'historique, pas sur le choix.
- Sur 56 créneaux (4 semaines) : féculents — pâtes 15, pomme de terre 8,
  légumineuses 7, pain 6, riz 5, aucun 11 ; protéine principale — laitiers 11,
  bœuf 9, œufs 7, lentilles 5.
- Le bonus de saison vaut +4 (12 regex mensuelles de 3 à 5 légumes) face à des
  récompenses de stock à 28 / 48 et des pénalités de répétition à 36 / 60 : il
  ne départage rien.
- Goûts : le modèle (`tastePreferences`, sept niveaux d'appréciation, poids
  0,25–0,6 par sujet) et la boucle `meal_taste_feedback → member_food_preferences
  → buildHouseholdTasteProfile → planificateur` existent. **Aucune interface
  n'appelle `/api/meals/feedback`** ; le questionnaire (recette, ingrédient,
  texture, cuisine, restes) est le seul point d'entrée. Le bouton « noter »
  écrit dans `generated_recipes`, que le planificateur ne lit pas.
- « Remplacer ce repas » et la re-planification de fin de semaine passent par
  les **Routines claude.ai** (`/api/routine/modify-meal`, `/replan-week` : LLM,
  30–60 s, « Julien + Zoé » en dur, écritures Supabase hors moteur). Le moteur
  déterministe d'alternatives (`mealAlternatives.js`, `/api/planning/alternatives`)
  n'a **aucun appelant**. Le constat F12 de l'audit de juillet tient toujours.

### 2.5 Batch cooking

- Profil dérivé (`recipePlanningProfile`) : batchabilité haute 158, moyenne 212,
  basse 150 ; tenue au réchauffage bonne 300, moyenne 109, mauvaise 111 ;
  **370 / 520 candidats au batch**. Refus : servi froid 60, préparation trop
  courte 39, se dégrade 51.
- Congelable dérivé de la prose (`conservation` contient « congel » sans l'une
  de 4 négations) : 407. **90 d'entre eux refusent la congélation** dans la
  même phrase (« Congélation exclue », « supporte mal la congélation », « se
  congèle mal »…).
- La prose de conservation est lisible à la machine : 527 / 706 donnent des
  jours au réfrigérateur (en chiffres ou en lettres), 31 disent « à consommer
  immédiatement », 144 donnent des mois au congélateur, 145 refusent la
  congélation. **148 restent à qualifier à la main** (durées par composant :
  « sauce 3 jours ; œufs à pocher au moment »).
- Le moteur ne lit **aucune** durée : `productionShelfLifeDays` retourne la
  constante 3 jours (`recipe.shelfLifeDays` « pas encore exposé »). Le pan bagnat
  (24 h, congélation exclue, catégorie *sandwich*) est jugé batchable haut,
  réchauffage bon, congelable — parce que sa technique « pochage » (l'œuf) est
  dans la liste des techniques favorables et que *sandwich* n'est pas dans
  `COLD_SERVICE`.
- Bornes dures : **2 productions par semaine, 3 consommateurs chacune**, les
  jours de cuisine du questionnaire (`cooking_days`, `quick_days`) sont stockés
  mais ne bornent pas les productions.
- 33 composants au corpus, **0 plat lié** (`ingredient.component.code` n'est
  posé nulle part) : `sharedBases.js` (500 lignes) est inerte.
- 1 065 minutes de cuisine par semaine si tout est frais.

### 2.6 Ce qui va bien et qu'il ne faut pas casser

- La répétition intra-semaine (≤ 2 assiettes, `cooked_dish` exempté), les rôles
  d'assiette (0 dessert en repas), le budget en dimension asymétrique, les
  règles absolues à −500, la protection des créneaux épinglés/mangés, la boucle
  historique à 56 jours, les 1 400+ tests dont 54 fichiers sur le planning.

---

## 3. Cause racine

Le moteur décide sur des **attributs dérivés par regex** (carné, congelable,
servi froid, tenue au réchauffage, saison) au lieu d'attributs **déclarés et
vérifiés** ; et les canaux qui lui permettraient d'apprendre (goût, alternative,
remplacement) sont **débranchés ou détournés** vers une Routine LLM. Le vivier
est ensuite déséquilibré, mais un vivier parfait servi à ce moteur produirait
encore du boudin noir en variante végé et un sandwich en batch.

---

## 4. Les chantiers

Classés par **ce qu'ils déplacent dans le tableau du §1 rapporté à leur coût**.
Chaque chantier a un test d'acceptation qui rejoue la mesure d'origine.

### C0 — Redéployer Vercel (aujourd'hui, 0 j)

Sans quoi rien n'est visible. Déplace : les six pizzas, le far breton au dîner.

### C1 — Rendre vraies les données que le moteur lit (1 à 2 semaines)

Trois bugs de vérité, chacun avec un test sur **tout le corpus**, pas un
échantillon.

1. **Classification carnée par le catalogue, pas par regex.** Chaque forme du
   catalogue porte une origine (`animal:viande`, `animal:volaille`,
   `animal:poisson`, `animal:oeuf`, `animal:lait`, `vegetal`) déclarée dans les
   arbitrages ; `classifyRecipe` la lit. Les 40 formes carnées hors catégorie
   sont qualifiées à la main (liste en annexe A3). Test : 0 plat classé
   végétarien contenant une forme d'origine viande/volaille/poisson. Déplace P8.
2. **Conservation structurée.** Un script parse la prose vers
   `{ fridge_hours, eat_immediately, freezable, freezer_months, serve_cold }`
   (527 + 31 + 144 + 145 relevés automatiques), écrit un fichier d'arbitrage
   relu pour les 148 restants, et `build-corpus-v3` publie ces champs.
   `isRecipeFreezable`, `productionShelfLifeDays`, `servedCold` lisent le
   déclaré et **refusent de dériver** quand il manque (audit F13, point 5 :
   politique versionnée). Test : 0 production dont `useBy` dépasse la durée
   déclarée ; 0 congelable contredit par sa prose ; pan bagnat non candidat.
   Déplace P11, prépare C4.
3. **Rôle de service.** `serve_cold` déclaré (sandwich, salades, entrées
   froides, carottes râpées) et une **règle de bon sens sur la mutualisation** :
   un plat servi froid n'est pas « réchauffé », un plat à 24 h n'est pas produit
   pour 3 jours.

### C2 — Moins de viande pour Zoé, dans le même plat (3 semaines, démarre en parallèle de C1)

Le besoin n'est pas un régime : c'est **un curseur par personne**. Trois
mouvements.

1. **Modèle : le quota de viande est personnel.** Remplacer « nombre de swaps »
   par `meat_meals_per_week` par membre (Zoé : 3, Julien : 6, au choix). Le
   solveur choisit la semaine du foyer avec, en plus, la contrainte que Zoé
   puisse tenir son quota **sans changer de plat** aussi souvent que possible.
   L'interface existante (Paramètres → Planning) change de libellé et de
   sémantique. Déplace P6.
2. **Données : des jumeaux, pas des remplaçants.** Un jumeau végé est une
   recette de **même lignée** (`derivedFrom`), déclarée `variantOf`, sourcée
   comme toute recette du dépôt (deux sources réelles de la version végé du
   même plat : chili sin carne, bolognaise de lentilles, moussaka végé, tajine
   de légumes, lasagnes végé, parmentier de lentilles, curry de pois chiches,
   pastitsio aux lentilles…). Cible : **60 jumeaux en trois lots**, dans l'ordre
   de ce que le solveur sélectionne réellement (plat mijoté d'abord). Le
   planificateur refuse une substitution hors lignée dès qu'un jumeau existe.
   Déplace P7.
3. **Cuisine : une base, deux finitions.** Quand Julien mange la version carnée
   et Zoé le jumeau, la fiche de cuisine fusionne les étapes communes et sépare
   la protéine ; le compte de plats à cuisiner reste 14, pas 16. Déplace P9.

Option de repli, moins bonne mais immédiate : pour un plat `main` +
accompagnement, remplacer dans l'assiette de Zoé la portion de viande par une
portion de légumineuse cuite (composant existant). C'est une substitution
dégradée et elle doit être signalée comme telle — jamais présentée comme le
« même plat ».

### C3 — Nutrition par personne (2 semaines)

1. **Densité protéique comme contrainte de sélection, pas comme correction de
   portion.** Le solveur reçoit, par membre, un plancher de densité (g / kcal)
   à tenir sur au moins N créneaux par semaine (Julien : 0,10 sur ≥ 8 / 14).
   Aujourd'hui la couche personnalisée « double la portion de pâtes » ; elle
   doit au contraire pouvoir **compléter en protéine** (œufs, fromage blanc,
   légumineuse — les supports existent déjà pour le petit-déjeuner et la
   collation, pas pour les repas). Déplace P4, P5.
2. **Mesurer les poids avant d'y toucher.** Rejouer trois semaines à 0,34 /
   0,40 / 0,45 / 0,55 sur les protéines et consigner P4 pour chaque valeur ; ne
   retenir que ce qui améliore P4 sans dégrader P1–P3.
3. **Décision à prendre par le foyer, pas par le code** : 216 g pour 2 357 kcal
   font 37 % de l'énergie. Le plan ne baisse pas cette cible en silence (le test
   le dit lui-même) ; il demande qu'elle soit confirmée ou révisée.

### C4 — Un batch qui prépare vite plus de plats différents (4 semaines, après C1)

1. **Lier les plats aux 33 bases.** Script d'appariement par forme (sauce
   tomate, pois chiches cuits, lentilles cuites, riz cuit, pâte brisée, bouillon
   de légumes…) qui pose `ingredient.component.code`, avec fichier d'arbitrage
   relu. Cible ≥ 120 plats liés. `sharedBases.js` se met alors à fonctionner
   sans une ligne de code. Déplace P12, P9, P10.
2. **Des productions bornées par la capacité, pas par une constante.** Les
   `cooking_days` / `quick_days` du questionnaire deviennent la capacité : une
   session du dimanche porte 2 à 3 productions + 2 bases ; un soir « rapide »
   n'en porte aucune. `MAX_PLAN_PRODUCTIONS = 2` devient une conséquence de la
   capacité déclarée. Déplace P10.
3. **Le congélateur comme semaine N+1.** La fenêtre congélateur existe déjà dans
   le moteur (`freezerUseBy`) ; une fois `freezable` vrai, une production peut
   nourrir la semaine suivante — ce qui casse la répétition intra-semaine sans
   renoncer au batch. Déplace P1 et P10 ensemble.

### C5 — Plaisir, variété, et fermer la boucle (2 semaines, en parallèle de C4)

1. **Plafonds de féculent et de protéine principale** dans `weeklyBalance`
   (pâtes ≤ 3 / 14, laitiers + œufs ≤ 3 / 14 en protéine principale). Le
   modèle sait déjà compter (`starchDays`, `proteins`). Déplace P2, P3.
2. **Brancher ce qui existe.** « Remplacer ce repas » appelle
   `/api/planning/alternatives` (déterministe, sous règles), plus la Routine.
   Un retour en un geste sur chaque repas (aimé / pas aimé / trop souvent) appelle
   `/api/meals/feedback`, qui alimente déjà les goûts lus par la génération
   suivante. Épingler depuis la grille de semaine. Déplace P14.
3. **Saison déclarée par forme** (un calendrier par légume/fruit du catalogue,
   pénalité hors saison) plutôt que 12 regex à +4 — ou assumer que la saison ne
   compte pas. Ne pas laisser un terme qui ne fait rien.

### C6 — Plus de recettes, mais ciblées (en continu, un lot toutes les 2 semaines)

Le corpus n'est pas la cause, c'est un moyen ; chaque lot doit **déplacer une
ligne du §1** ou il n'est pas lancé. Dans l'ordre :

1. jumeaux végé (C2) — 60 ;
2. plats **complets** à densité ≥ 0,10 g / kcal, hors poisson blanc uniquement
   (P4) — 40 ;
3. plats à ≤ 30 min au total (76 aujourd'hui), du quotidien, pas de restaurant
   (P10) — 40 ;
4. cuisines sous-représentées avec des plats de semaine : Italie du quotidien,
   Espagne, Maghreb, Levant, Inde du Nord, Asie du Sud-Est, Mexique (P13) — 60 ;
5. les 21 proxies d'épices C → B (libère ≈ 15 recettes et 3 dahls) ;
6. **ne pas** poursuivre les 186 bloquées au-delà (queue de 295 formes).

Toujours par la chaîne existante (sources réelles, deux sites, empreintes, pas
de prose). Cible : 470 → 650 servables en un trimestre, et un vivier dont la
France pèse < 60 %.

### C7 — Sortir la Routine LLM du chemin de décision

Toute modification de plan (remplacer, re-planifier, régénérer une fiche) passe
par le moteur et ses règles ; la Routine ne reste, si elle reste, que pour la
rédaction. Ce chantier est la condition pour que C5.2 tienne dans le temps.

---

## 5. Ordre et calendrier

| Quand | Quoi | Livrable |
|---|---|---|
| Jour 0 | C0 | redéploiement |
| Semaines 1–2 | C1 ; démarrage du lot 1 de C6 (jumeaux) | 3 PR courtes (classification, conservation, service froid), chacune avec son test corpus entier ; rapport `report-week-quality` en CI |
| Semaines 2–4 | C2 + C3 en parallèle | quota de viande par membre ; densité par membre ; mesure des poids ; décision 216 g |
| Semaines 4–8 | C4 + C5 | liaison aux bases ; capacité ; plafonds ; boutons branchés |
| Semaines 6–10 | C7 | modification sous règles |
| En continu | C6 | un lot / 2 semaines, chacun rapporté au tableau du §1 |

Premier livrable de C1, avant tout correctif : **le rapport de qualité de
semaine** (les mesures de l'annexe, rendues durables et exécutées en CI sur
trois semaines). C'est lui qui dira si chaque chantier a payé.

---

## 6. Ce que ce plan ne recommande pas

- **Baisser la borne protéique du test** pour le faire passer : le test
  documente lui-même pourquoi non.
- **Réécrire le solveur** : ses 17 termes, son faisceau et son historique
  produisent déjà 0 reprise sur 3 semaines. Il manque des yeux, pas un cerveau.
- **Confier le choix à un LLM** : c'est ce que fait « Remplacer ce repas »
  aujourd'hui, hors règles, à 30–60 s la réponse. Le plan va dans l'autre sens.
- **Scraper pour débloquer les 186** : 40 formes pour 61 recettes ; le même
  effort en jumeaux végé déplace P6–P9.
- **Inventer des données de conservation ou d'origine** : ce qui n'est pas
  déclaré est absent, et le moteur refuse de dériver (même règle que pour les
  prix).

---

## 7. Décisions attendues du foyer

1. **Zoé : combien de repas carnés par semaine ?** (le plan suppose 3 sur 14 ;
   Julien inchangé).
2. **Julien : 216 g de protéines, confirmé ?** Sinon, quelle valeur ? Le plan ne
   la change pas seul.
3. **Capacité de cuisine** : quels jours pour une vraie session (2–3 heures) et
   quels soirs « 20 minutes maximum » ? Le questionnaire les stocke déjà mais
   rien ne les lit : ils ne bornent aujourd'hui aucune production.
4. **Rythme des lots de recettes** : un lot de 40 toutes les deux semaines est
   soutenable avec la chaîne actuelle ; plus vite, la vérification des sources
   devient le goulot.

---

## Annexe — Refaire les mesures

Toutes les mesures se rejouent avec le moteur réel dans l'environnement de test
(alias `@/`, import JSON). Fichier temporaire sous `tests/planning/`, exécuté par
`npx vitest run <fichier>`, supprimé ensuite ; la sortie console de vitest étant
muette, écrire dans un fichier.

### A1 — Semaine, nutrition par membre, swaps de Zoé

```js
import { generateClosedLoopPlan, classifyRecipe } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { buildPersonalizedMeals } from '@/lib/domain/planning/personalizedMeals'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { buildPlanningHistory } from '@/lib/domain/planning/repetitionRules'

const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const GOALS = [
  { person_name: 'Julien', target_calories: 2357, target_protein_g: 216, target_carbs_g: 196, target_fat_g: 79, target_fiber_g: 33 },
  { person_name: 'Zoé', target_calories: 1525, target_protein_g: 75, target_carbs_g: 192, target_fat_g: 51, target_fiber_g: 21 },
]
const MEMBERS = [
  { id: 'j', name: 'Julien', portion_multiplier: 1, preferences: { planning: { breakfast: true, snack: true } } },
  { id: 'z', name: 'Zoé', portion_multiplier: 1, preferences: { planning: { breakfast: false, snack: true, vegetarian_meat_swaps_per_week: 4 } } },
]
const recipes = getCanonicalRecipes({ servings: 2 })
const semaine = (debut, history) => generateClosedLoopPlan({
  slots: buildWeekSlots(debut), recipes, inventoryLots: [], history,
  constraints: { allowShopping: true, targetByMeal: { dejeuner: TARGET, diner: TARGET },
    maxMinutesByMeal: { dejeuner: 120, diner: 240 }, preferredActiveMinutes: 30 },
  beamWidth: 48, // mêmes paramètres que app/api/planning/generate-v3
})
// Historique : entries = slots des semaines précédentes { date, recipeCode, diversity }
const plan = semaine('2026-09-07', buildPlanningHistory({ entries: [], referenceDate: '2026-09-07' }))
const perso = buildPersonalizedMeals({ plan, recipes, members: MEMBERS, goals: GOALS })
// perso.daily[].total.{kcal,proteinG,fiberG}, perso.daily[].portion_ratio_lunch / _dinner
// perso.meals[] : person_name, meal_type, canonical_recipe_code, variant_kind
// carné : !classifyRecipe(recipe).vegetarian
```

### A2 — Faux végétariens (22) et formes carnées hors catégorie (40)

```js
// corpus : recettes classées végé dont un ingrédient porte un mot carné, avec
// des frontières Unicode (\b ne voit pas « é ») :
const W = new RegExp('(?<![\\p{L}\\p{N}_])(?:boudin|lardons?|jambon|saucisses?|…|bouillon de poule)(?![\\p{L}\\p{N}_])', 'iu')
// catalogue : scripts/data/out/recipe-food-catalog.json, formes dont le nom
// matche W et dont category ∉ {viandes, volailles, poissons_fruits_de_mer}
```

### A3 — Les 40 formes carnées à qualifier (catalogue, `category` actuelle)

`produits_transformes` : Bœuf à braiser cru (×2), Boudin noir à cuire,
Chicharrón de porc, Chorizo asturien, Chorizo criollo, Confit de canard cuit
(×2), Foie gras de canard cru, Gésier de canard confit, Jambon blanc cuit,
Jambon de Bayonne, Jambon serrano, Lardon fumé cru, Merguez crue, Saucisse
chinoise lap cheong, Saucisse de Montbéliard, Saucisse de Morteau, Saucisse de
Toulouse crue. `preparations_culinaires` : Bouillon d'agneau (×2), Bouillon
d'anchois (×2), Bouillon de bœuf (×2), Bouillon de crevette, Bouillon de porc et
poulet, Bouillon de poulet, Bouillon de veau non salé, Bouillon de volaille
(×3), Dashi, Fumet de poisson. `condiments_sauces` : Gélatine feuille, Sauce
poisson, Sauce soja légère spéciale poisson. `matieres_grasses` : Saindoux.
Sans catégorie : Sauce huître, Sauce Worcestershire.

### A4 — Conservation : parsabilité et faux congelables

```js
// nombres en chiffres ou en lettres, durée avant ou après le lieu :
const NUM = '(?:\\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|dix|douze|quinze)'
const RF  = new RegExp(NUM + '\\s*(?:à\\s*' + NUM + '\\s*)?jours?[^.;]{0,40}?(?:réfrigérateur|frigo|au frais)', 'i')
const RC  = new RegExp(NUM + '\\s*(?:à\\s*' + NUM + '\\s*)?mois[^.;]{0,30}?congél', 'i')
const NOC = /congélation (?:exclue|à éviter|déconseill|impossible)|ne se congèle pas|supporte mal la congélation|se congèle mal/i
// faux congelables : isRecipeFreezable(recipe) && NOC.test(recipe.conservation) → 90
```

### A5 — Blocage des 186 non publiables

`scripts/data/out/recipe-food-match-report.json` → `recipe_eligibility[]`,
champs `unresolved_required_forms`, `low_confidence_required_forms`,
`unresolved_conversion_required_forms` ; déblocage glouton par forme.
