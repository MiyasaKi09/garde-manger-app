# MYKO — Corpus culinaire canonique multi-source V1

**Date de génération : 2026-07-15**  
**Statut : données candidates prêtes à être transformées en seeds `catalog` / `culinary`**  
**Volume : 72 familles de recettes canoniques**  
**Formes alimentaires distinctes : 160**  
**Techniques distinctes : 145**

> Ce document est le résultat de la collecte et de la sélection, pas un plan de collecte. Les sources ont servi à repérer les familles populaires, comparer les variantes et arbitrer les techniques. Les textes canoniques ci-dessous sont des synthèses originales Myko : aucune méthode source n’est reproduite mot pour mot.

## 1. Doctrine d'intégration

- Chaque recette reste `candidate` avec confiance `B` jusqu'à revue culinaire et test de cuisine.
- Les quantités sont normalisées pour le nombre de portions indiqué.
- Chaque ingrédient vise une `food_form` exacte ; une forme absente doit créer une tâche de revue, jamais un rapprochement approximatif.
- Les variantes qui changent durée, rendement ou sécurité doivent devenir des branches d'instructions.
- Les sources tierces restent des provenances d'inspiration/comparaison ; le contenu publié appartient au corpus éditorial Myko.

## 2. Sources consultées et rôle

| Code | Site | Page | Usage dans le corpus |
|---|---|---|---|
| `marmiton_top` | Marmiton | [Top des internautes](https://www.marmiton.org/recettes/top-internautes.aspx) | sélection des familles populaires, notes et volume d'avis |
| `marmiton_bourguignon` | Marmiton | [Bœuf bourguignon : la vraie recette](https://www.marmiton.org/recettes/recette_boeuf-bourguignon_18889.aspx) | structure familiale française, saisie, déglaçage, mijotage |
| `marmiton_blanquette` | Marmiton | [Blanquette de veau : recette traditionnelle](https://www.marmiton.org/recettes/recette_blanquette-de-veau-facile_19219.aspx) | ingrédients usuels et liaison finale |
| `marmiton_lasagne` | Marmiton | [Lasagnes à la bolognaise](https://www.marmiton.org/recettes/recette_lasagnes-a-la-bolognaise_18215.aspx) | composition ragù, béchamel et montage |
| `marmiton_gratin` | Marmiton | [Gratin dauphinois, recette originale](https://www.marmiton.org/recettes/recette_gratin-dauphinois-recette-originale_22307.aspx) | structure pommes de terre, lait/crème, cuisson lente |
| `marmiton_hachis` | Marmiton | [Hachis Parmentier](https://www.marmiton.org/recettes/recette_hachis-parmentier_17639.aspx) | structure viande cuisinée + purée + gratinage |
| `marmiton_quiche` | Marmiton | [Quiche lorraine maison](https://www.marmiton.org/recettes/recette_quiche-lorraine_30283.aspx) | appareil œufs/crème et lardons |
| `marmiton_chili` | Marmiton | [Chili con carne facile](https://www.marmiton.org/recettes/recette_chili-con-carne-facile_15415.aspx) | version familiale française populaire |
| `marmiton_saumon` | Marmiton | [Saumon en papillote](https://www.marmiton.org/recettes/recette_amour-de-saumon-en-papillote_21494.aspx) | cuisson humide douce du poisson |
| `marmiton_poulet_moutarde` | Marmiton | [Poulet à la moutarde, estragon et champignons](https://www.marmiton.org/recettes/recette_poulet-a-la-moutarde-a-l-estragon-et-aux-champignons_19374.aspx) | famille poulet-moutarde et aromates |
| `marmiton_carbonade` | Marmiton | [Carbonades flamandes traditionnelles](https://www.marmiton.org/recettes/recette_carbonades-flamandes-traditionnelles_29711.aspx) | bière brune, pain d'épices et mijotage |
| `marmiton_couscous` | Marmiton | [Couscous poulet et merguez facile](https://www.marmiton.org/recettes/recette_couscous-poulet-et-merguez-facile_17751.aspx) | version familiale multi-composants |
| `marmiton_basquaise` | Marmiton | [Poulet basquaise](https://www.marmiton.org/recettes/recette_poulet-basquaise_16969.aspx) | poulet, poivrons et tomate |
| `marmiton_ratatouille` | Marmiton | [Ratatouille](https://www.marmiton.org/recettes/recette_ratatouille_23223.aspx) | famille provençale populaire |
| `bbc_bourguignon` | BBC Good Food | [Beef bourguignon](https://www.bbcgoodfood.com/recipes/beef-bourguignon) | quantités testées, garniture ajoutée tardivement, congélation |
| `serious_stews` | Serious Eats | [15 Stews to Amp Up the Cozy](https://www.seriouseats.com/stew-recipes-7565948) | arbitrages techniques : saisie, cuisson séparée des légumes, séquençage |
| `serious_beef` | Serious Eats | [15 Comforting Beef Stews](https://www.seriouseats.com/beef-stew-recipes-11865186) | comparaison des familles de ragoûts et techniques de braisage |
| `allrecipes_bourguignon` | Allrecipes | [9 Beef Bourguignon Recipes](https://www.allrecipes.com/gallery/beef-bourguignon-recipes/) | analyse des variantes traditionnelles, rapides, mijoteuse et végétariennes |
| `epicurious_bourguignon` | Epicurious | [Beef Bourguignon](https://www.epicurious.com/recipes/food/views/beef-bourguignon-56389455) | version classique, préparation en avance et accompagnements |

### Utilisation effective

- `marmiton_top` : utilisé comme signal pour 69 recette(s).
- `serious_stews` : utilisé comme signal pour 5 recette(s).
- `bbc_bourguignon` : utilisé comme signal pour 3 recette(s).
- `serious_beef` : utilisé comme signal pour 3 recette(s).
- `marmiton_lasagne` : utilisé comme signal pour 3 recette(s).
- `allrecipes_bourguignon` : utilisé comme signal pour 2 recette(s).
- `marmiton_blanquette` : utilisé comme signal pour 2 recette(s).
- `marmiton_hachis` : utilisé comme signal pour 2 recette(s).
- `marmiton_bourguignon` : utilisé comme signal pour 1 recette(s).
- `epicurious_bourguignon` : utilisé comme signal pour 1 recette(s).
- `marmiton_carbonade` : utilisé comme signal pour 1 recette(s).
- `marmiton_quiche` : utilisé comme signal pour 1 recette(s).
- `marmiton_gratin` : utilisé comme signal pour 1 recette(s).
- `marmiton_ratatouille` : utilisé comme signal pour 1 recette(s).
- `marmiton_basquaise` : utilisé comme signal pour 1 recette(s).
- `marmiton_poulet_moutarde` : utilisé comme signal pour 1 recette(s).
- `marmiton_couscous` : utilisé comme signal pour 1 recette(s).
- `marmiton_chili` : utilisé comme signal pour 1 recette(s).
- `marmiton_saumon` : utilisé comme signal pour 1 recette(s).

## 3. Résumé du corpus

| Catégorie | Nombre |
|---|---:|
| plat mijoté | 7 |
| accompagnement | 5 |
| dessert | 3 |
| dessert froid | 3 |
| gâteau | 3 |
| plat complet | 3 |
| pâtes | 3 |
| soupe | 3 |
| tarte salée | 3 |
| tarte sucrée | 3 |
| curry végétarien | 2 |
| gratin complet | 2 |
| poisson | 2 |
| salade complète | 2 |
| boulettes | 1 |
| boulettes végétales | 1 |
| cake salé | 1 |
| céréales et légumes | 1 |
| dessert et petit-déjeuner | 1 |
| entrée | 1 |
| gratin de légumes | 1 |
| légumes mijotés | 1 |
| légumineuses | 1 |
| petit gâteau | 1 |
| petit-déjeuner | 1 |
| pizza | 1 |
| plat bouilli | 1 |
| plat en sauce | 1 |
| pâte à choux salée | 1 |
| pâtes au four | 1 |
| pâtes en sauce | 1 |
| pâtisserie | 1 |
| riz crémeux | 1 |
| rôti | 1 |
| salade | 1 |
| sandwich chaud | 1 |
| sauce de base | 1 |
| soupe complète | 1 |
| tartinade | 1 |
| viande en sauce | 1 |
| œufs | 1 |
| œufs et tomate | 1 |

## 4. Recettes canoniques

### FR-001 — Bœuf bourguignon

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 180 min
- **Difficulté** : moyenne
- **Tags** : batch-cooking, congélation, hiver
- **Sources de comparaison** : `marmiton_bourguignon`, `bbc_bourguignon`, `serious_stews`, `allrecipes_bourguignon`, `epicurious_bourguignon`
- **Arbitrage** : Version canonique : garniture cuite séparément pour éviter les légumes surcuits.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru, paré | 1200 | g | protéine | non |
| Vin rouge sec | 750 | ml | liquide de braisage | non |
| Lardon fumé cru | 180 | g | garniture | non |
| Carotte crue | 350 | g | aromatique | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Oignon grelot cru | 250 | g | garniture | non |
| Champignon de Paris frais | 350 | g | garniture | non |
| Farine de blé T55 | 30 | g | liaison | non |
| Huile de colza raffinée | 25 | ml | saisie | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Ail cru | 12 | g | aromate | non |
| Sel fin | 8 | g | assaisonnement | oui |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Sécher et saler légèrement les cubes de bœuf. Les saisir en plusieurs fournées dans une cocotte très chaude.
2. Faire revenir les lardons, puis les carottes et l’oignon. Ajouter l’ail et la farine ; cuire une minute.
3. Déglacer au vin rouge, remettre la viande, ajouter le bouquet garni et compléter avec un peu d’eau si nécessaire.
4. Couvrir et braiser doucement au four à 155 °C pendant environ 2 h 30, jusqu’à tendreté.
5. Poêler séparément champignons et oignons grelots afin de conserver leur texture, puis les ajouter pour les 20 dernières minutes.
6. Rectifier la sauce par réduction douce ; poivrer et servir.

**Techniques** : saisie, déglaçage, braisage, réduction, garniture séparée.

**Variantes validables** : Version sans lardons ; version mijoteuse ; accompagnement purée, pommes vapeur ou tagliatelles.

**Conservation** : 3 jours au réfrigérateur ; 3 mois au congélateur. Meilleur réchauffé le lendemain.

**Allergènes** : gluten

---

### FR-002 — Blanquette de veau

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Tags** : tradition française, batch-cooking
- **Sources de comparaison** : `marmiton_blanquette`, `marmiton_top`
- **Arbitrage** : La version canonique évite de saisir la viande : la couleur blanche est un critère de famille.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule de veau crue, en cubes | 1200 | g | protéine | non |
| Carotte crue | 300 | g | garniture | non |
| Poireau cru | 200 | g | aromatique | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Champignon de Paris frais | 300 | g | garniture | non |
| Bouillon de volaille non salé | 1200 | ml | cuisson | non |
| Crème fraîche épaisse | 180 | g | liaison | non |
| Jaune d'œuf cru | 2 | u | liaison | non |
| Farine de blé T55 | 35 | g | roux | non |
| Beurre doux | 40 | g | roux | non |
| Citron jaune frais | 0.5 | u | acidité | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Sel fin | 7 | g | assaisonnement | oui |
| Poivre blanc moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Couvrir le veau de bouillon froid avec poireau, oignon, carottes et bouquet garni. Monter doucement au frémissement et écumer.
2. Cuire à très faible frémissement 1 h 30 à 2 h ; la viande doit être tendre sans se défaire.
3. Cuire les champignons à part avec une noix de beurre et un peu de citron.
4. Filtrer une partie du bouillon. Préparer un roux blanc avec beurre et farine, puis mouiller progressivement avec le bouillon.
5. Hors du feu, mélanger crème et jaunes d’œufs ; tempérer avec la sauce puis incorporer sans faire bouillir.
6. Réunir viande, carottes et champignons. Ajuster citron, sel et poivre.

**Techniques** : pochage, écumage, roux blanc, liaison aux jaunes, tempérage.

**Variantes validables** : Dinde ou poulet en version économique ; riz blanc ou pommes vapeur.

**Conservation** : 2 jours au réfrigérateur. Réchauffer sans ébullition pour préserver la liaison.

**Allergènes** : gluten, œuf, lait

---

### FR-003 — Carbonade flamande

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 180 min
- **Difficulté** : facile
- **Tags** : Nord, batch-cooking
- **Sources de comparaison** : `marmiton_carbonade`, `serious_beef`
- **Arbitrage** : Servir avec frites, pommes vapeur ou purée.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru, paré | 1200 | g | protéine | non |
| Bière brune belge | 750 | ml | liquide de braisage | non |
| Oignon jaune cru | 500 | g | aromatique | non |
| Pain d'épices | 100 | g | liaison et douceur | non |
| Moutarde de Dijon | 40 | g | condiment | non |
| Cassonade | 15 | g | équilibre | non |
| Vinaigre de cidre | 15 | ml | acidité | non |
| Beurre doux | 30 | g | saisie | non |
| Thym séché | 2 | g | aromate | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Sel fin | 7 | g | assaisonnement | oui |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Saisir le bœuf en fournées dans le beurre, puis réserver.
2. Faire fondre longuement les oignons jusqu’à légère coloration.
3. Ajouter cassonade et vinaigre, puis déglacer avec la bière.
4. Remettre le bœuf. Poser le pain d’épices tartiné de moutarde sur la surface.
5. Ajouter thym et laurier ; couvrir et mijoter 2 h 30 à 3 h.
6. Mélanger en fin de cuisson pour intégrer le pain d’épices et ajuster l’équilibre amer-acide-sucré.

**Techniques** : saisie, caramélisation des oignons, déglaçage, braisage, liaison au pain.

**Variantes validables** : Pain de campagne + moutarde si pain d’épices absent ; bière ambrée moins sucrée.

**Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : gluten, lait, moutarde

---

### FR-004 — Hachis Parmentier

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat complet
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : anti-gaspi, restes, batch-cooking
- **Sources de comparaison** : `marmiton_hachis`, `marmiton_top`
- **Arbitrage** : Priorité aux restes de pot-au-feu ou de viande braisée.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf cuit effiloché | 700 | g | protéine | non |
| Pomme de terre crue, épluchée | 1200 | g | féculent | non |
| Lait demi-écrémé | 220 | ml | purée | non |
| Beurre doux | 60 | g | purée | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Carotte crue | 150 | g | garniture | non |
| Bouillon de bœuf non salé | 150 | ml | moelleux | non |
| Chapelure de blé | 40 | g | gratinage | non |
| Huile d'olive vierge extra | 15 | ml | cuisson | non |
| Muscade moulue | 0.5 | g | assaisonnement | non |
| Sel fin | 7 | g | assaisonnement | oui |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Cuire les pommes de terre à l’eau salée, égoutter puis les dessécher brièvement.
2. Écraser avec lait chaud, beurre et muscade ; garder une purée souple.
3. Faire suer oignon et carotte. Ajouter le bœuf effiloché et le bouillon ; réduire jusqu’à une garniture juteuse mais non liquide.
4. Étaler la viande dans un plat, couvrir de purée et parsemer de chapelure.
5. Cuire 25 minutes à 190 °C puis gratiner quelques minutes.

**Techniques** : cuisson à l'eau, dessiccation, purée, suer, réduction, gratinage.

**Variantes validables** : Canard confit ; lentilles et champignons ; fromage râpé facultatif.

**Conservation** : 3 jours au réfrigérateur ; congélation 2 mois.

**Allergènes** : gluten, lait

---

### IT-001 — Lasagnes à la bolognaise

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtes au four
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 150 min
- **Difficulté** : moyenne
- **Tags** : Italie, batch-cooking, congélation
- **Sources de comparaison** : `marmiton_lasagne`, `marmiton_top`
- **Arbitrage** : Le repos après cuisson stabilise les couches.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Feuille de lasagne sèche | 350 | g | féculent | non |
| Bœuf haché cru 15 % MG | 600 | g | protéine | non |
| Porc haché cru | 250 | g | protéine | non |
| Tomate concassée en conserve | 1000 | g | sauce | non |
| Oignon jaune cru | 180 | g | soffritto | non |
| Carotte crue | 150 | g | soffritto | non |
| Céleri branche cru | 120 | g | soffritto | non |
| Vin rouge sec | 150 | ml | déglaçage | non |
| Lait demi-écrémé | 1100 | ml | béchamel et ragù | non |
| Farine de blé T55 | 90 | g | béchamel | non |
| Beurre doux | 90 | g | béchamel | non |
| Parmesan affiné | 120 | g | fromage | non |
| Huile d'olive vierge extra | 25 | ml | cuisson | non |
| Muscade moulue | 0.5 | g | béchamel | non |
| Sel fin | 10 | g | assaisonnement | oui |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer finement oignon, carotte et céleri. Ajouter les viandes et les émietter jusqu’à légère coloration.
2. Déglacer au vin, réduire, ajouter tomate et 150 ml de lait. Mijoter au moins 1 h 15.
3. Préparer une béchamel souple avec beurre, farine et le reste du lait ; parfumer de muscade.
4. Monter en alternant ragù, lasagnes, béchamel et parmesan. Terminer par béchamel et fromage.
5. Cuire 40 à 45 minutes à 180 °C. Reposer 15 minutes avant découpe.

**Techniques** : soffritto, saisie, déglaçage, mijotage, roux, montage, gratinage.

**Variantes validables** : Ragù 100 % bœuf ; épinards-ricotta ; courgettes-lentilles.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : gluten, lait

---

### FR-005 — Quiche lorraine

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte salée
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : Lorraine, déjeuner
- **Sources de comparaison** : `marmiton_quiche`, `marmiton_top`
- **Arbitrage** : Le sel est limité car les lardons sont déjà salés.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 280 | g | fond | non |
| Lardon fumé cru | 220 | g | garniture | non |
| Œuf cru | 4 | u | appareil | non |
| Crème fraîche liquide entière | 300 | ml | appareil | non |
| Lait demi-écrémé | 100 | ml | appareil | non |
| Muscade moulue | 0.5 | g | assaisonnement | non |
| Poivre noir moulu | 1.5 | g | assaisonnement | non |
| Sel fin | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Foncer la pâte, piquer et la refroidir 20 minutes.
2. Faire revenir les lardons sans les dessécher, puis égoutter leur graisse.
3. Mélanger œufs, crème, lait, muscade et poivre.
4. Répartir les lardons sur le fond et verser l’appareil.
5. Cuire à 180 °C pendant 35 à 40 minutes, jusqu’à prise avec un léger tremblement central.
6. Reposer 10 minutes avant de servir.

**Techniques** : fonçage, précuisson de garniture, appareil à crème prise, cuisson au four.

**Variantes validables** : Version canonique sans fromage ; oignon ou emmental seulement comme variantes non traditionnelles.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### FR-006 — Gratin dauphinois

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : accompagnement
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 75 min
- **Difficulté** : facile
- **Tags** : Dauphiné, accompagnement
- **Sources de comparaison** : `marmiton_gratin`, `bbc_bourguignon`, `marmiton_top`
- **Arbitrage** : L’amidon de la pomme de terre assure la liaison naturelle.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 1400 | g | féculent | non |
| Crème fraîche liquide entière | 500 | ml | liquide | non |
| Lait entier | 300 | ml | liquide | non |
| Ail cru | 8 | g | aromate | non |
| Beurre doux | 20 | g | plat | non |
| Muscade moulue | 0.5 | g | assaisonnement | non |
| Sel fin | 9 | g | assaisonnement | non |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Frotter le plat avec l’ail puis le beurrer.
2. Trancher les pommes de terre à 2–3 mm sans les rincer afin de conserver l’amidon.
3. Chauffer lait, crème, sel, muscade et poivre. Ajouter les pommes de terre et précuire 8 minutes en remuant délicatement.
4. Verser dans le plat, égaliser et cuire 60 à 70 minutes à 165 °C.
5. Laisser reposer 15 minutes avant service.

**Techniques** : taillage régulier, précuisson dans le lait, cuisson lente au four, repos.

**Variantes validables** : Version plus légère moitié lait ; aucune obligation de fromage.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-007 — Ratatouille provençale

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : légumes mijotés
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 60 min
- **Difficulté** : facile
- **Tags** : végétarien, vegan, été, batch-cooking
- **Sources de comparaison** : `marmiton_ratatouille`, `serious_stews`, `marmiton_top`
- **Arbitrage** : La cuisson séparée est retenue pour préserver l’identité de chaque légume.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 500 | g | légume | non |
| Courgette fraîche | 500 | g | légume | non |
| Poivron rouge frais | 300 | g | légume | non |
| Poivron jaune frais | 300 | g | légume | non |
| Tomate fraîche mûre | 700 | g | légume | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Huile d'olive vierge extra | 60 | ml | cuisson | non |
| Thym frais | 5 | g | aromate | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Sel fin | 8 | g | assaisonnement | non |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Tailler tous les légumes en morceaux réguliers.
2. Cuire séparément aubergines, courgettes et poivrons dans un peu d’huile pour maîtriser leurs textures.
3. Faire fondre oignon et ail, puis ajouter les tomates et les herbes ; compoter 15 minutes.
4. Réunir les légumes et mijoter encore 20 à 25 minutes.
5. Rectifier l’assaisonnement et servir chaud, tiède ou froid.

**Techniques** : taillage, cuissons séparées, compotage, mijotage.

**Variantes validables** : Cuisson tout-en-un plus simple mais texture moins précise ; œuf poché ou pois chiches en ajout.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### FR-008 — Poulet basquaise

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 65 min
- **Difficulté** : facile
- **Tags** : Pays basque, batch-cooking
- **Sources de comparaison** : `marmiton_basquaise`, `marmiton_top`
- **Arbitrage** : Le poulet avec os est la forme préférée pour la sauce.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1500 | g | protéine | non |
| Poivron rouge frais | 400 | g | garniture | non |
| Poivron vert frais | 300 | g | garniture | non |
| Tomate concassée en conserve | 700 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Jambon de Bayonne | 120 | g | garniture | oui |
| Vin blanc sec | 120 | ml | déglaçage | non |
| Huile d'olive vierge extra | 35 | ml | cuisson | non |
| Piment d'Espelette moulu | 2 | g | épice | non |
| Thym frais | 4 | g | aromate | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Saler légèrement et dorer les morceaux de poulet côté peau, puis réserver.
2. Faire fondre oignons, poivrons et ail. Ajouter éventuellement le jambon.
3. Déglacer au vin blanc, réduire de moitié, puis ajouter tomate, thym et piment.
4. Remettre le poulet, couvrir partiellement et mijoter 40 à 45 minutes.
5. Vérifier une température à cœur d’au moins 75 °C et réduire la sauce si nécessaire.

**Techniques** : saisie, suer, déglaçage, mijotage, réduction.

**Variantes validables** : Blanc de poulet : branche de cuisson plus courte ; version sans jambon.

**Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### FR-009 — Poulet à la moutarde et champignons

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat en sauce
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : rapide, familial
- **Sources de comparaison** : `marmiton_poulet_moutarde`, `marmiton_top`
- **Arbitrage** : Branches de cuisson nécessaires selon le morceau.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru, désossé, sans peau | 650 | g | protéine | non |
| Champignon de Paris frais | 350 | g | garniture | non |
| Échalote crue | 120 | g | aromatique | non |
| Moutarde de Dijon | 40 | g | sauce | non |
| Crème fraîche épaisse | 180 | g | sauce | non |
| Vin blanc sec | 100 | ml | déglaçage | non |
| Huile d'olive vierge extra | 20 | ml | saisie | non |
| Estragon frais | 8 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1.5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Saisir les hauts de cuisse dans l’huile et réserver.
2. Faire revenir échalotes et champignons jusqu’à évaporation de leur eau.
3. Déglacer au vin, réduire presque à sec, puis incorporer moutarde et crème.
4. Remettre le poulet et mijoter doucement 15 à 18 minutes.
5. Vérifier 75 °C à cœur, ajouter l’estragon et rectifier.

**Techniques** : saisie, évaporation, déglaçage, réduction, mijotage.

**Variantes validables** : Blanc de poulet : 10–12 minutes ; cuisses avec os : 30 minutes.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait, moutarde

---

### MAG-001 — Couscous poulet, merguez et légumes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat complet
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 120 min
- **Difficulté** : moyenne
- **Tags** : Maghreb, grand format, batch-cooking
- **Sources de comparaison** : `marmiton_couscous`, `marmiton_top`
- **Arbitrage** : La merguez est cuite séparément pour limiter le gras dans le bouillon.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1400 | g | protéine | non |
| Merguez crue | 600 | g | protéine | non |
| Semoule de blé dur moyenne sèche | 700 | g | féculent | non |
| Carotte crue | 500 | g | légume | non |
| Courgette fraîche | 500 | g | légume | non |
| Navet cru | 400 | g | légume | non |
| Pois chiche cuit, égoutté | 500 | g | légumineuse | non |
| Tomate concassée en conserve | 500 | g | bouillon | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Huile d'olive vierge extra | 50 | ml | cuisson | non |
| Ras el-hanout | 15 | g | épice | non |
| Harissa | 30 | g | condiment | oui |
| Sel fin | 10 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Dorer le poulet, puis faire suer l’oignon et les épices.
2. Ajouter tomate, carottes et navets ; couvrir d’eau et mijoter 45 minutes.
3. Ajouter courgettes et pois chiches pour les 20 dernières minutes.
4. Griller ou poêler les merguez séparément pour mieux contrôler la graisse.
5. Hydrater et égrener la semoule avec une partie du bouillon et un filet d’huile.
6. Servir les composants séparément, avec harissa détendue au bouillon.

**Techniques** : saisie, mijotage séquencé, grillade, hydratation, égrenage.

**Variantes validables** : Agneau ; légumes seuls ; raisins secs facultatifs dans la semoule.

**Conservation** : 3 jours au réfrigérateur, composants séparés.

**Allergènes** : gluten

---

### MX-001 — Chili con carne

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : facile
- **Tags** : batch-cooking, congélation
- **Sources de comparaison** : `marmiton_chili`, `allrecipes_bourguignon`, `serious_beef`, `marmiton_top`
- **Arbitrage** : Le haricot est ajouté tard pour conserver sa texture.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf haché cru 15 % MG | 800 | g | protéine | non |
| Haricot rouge cuit, égoutté | 700 | g | légumineuse | non |
| Tomate concassée en conserve | 800 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Poivron rouge frais | 250 | g | légume | non |
| Ail cru | 15 | g | aromatique | non |
| Bouillon de bœuf non salé | 250 | ml | liquide | non |
| Huile de colza raffinée | 20 | ml | cuisson | non |
| Cumin moulu | 8 | g | épice | non |
| Paprika fumé | 8 | g | épice | non |
| Piment en poudre | 2 | g | épice | oui |
| Origan séché | 3 | g | aromate | non |
| Sel fin | 7 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Colorer le bœuf en plusieurs fois pour éviter qu’il ne rende trop d’eau.
2. Faire revenir oignon, poivron et ail avec les épices.
3. Ajouter tomate et bouillon, remettre la viande et mijoter 60 minutes.
4. Ajouter les haricots rincés et poursuivre 20 minutes.
5. Rectifier le piment, la texture et le sel.

**Techniques** : saisie, torréfaction des épices, mijotage, réduction.

**Variantes validables** : Version texane sans haricots ; dinde hachée ; lentilles et champignons.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### FR-010 — Saumon en papillote aux légumes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : poisson
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 25 min
- **Difficulté** : facile
- **Tags** : rapide, poisson
- **Sources de comparaison** : `marmiton_saumon`, `marmiton_top`
- **Arbitrage** : La papillote limite le dessèchement et concentre les arômes.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pavé de saumon cru, sans peau | 600 | g | protéine | non |
| Courgette fraîche | 300 | g | légume | non |
| Carotte crue | 200 | g | légume | non |
| Poireau cru | 180 | g | légume | non |
| Citron jaune frais | 1 | u | acidité | non |
| Huile d'olive vierge extra | 20 | ml | assaisonnement | non |
| Aneth frais | 10 | g | aromate | non |
| Sel fin | 4 | g | assaisonnement | oui |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Tailler les légumes en julienne fine et les précuire 5 minutes à la poêle.
2. Répartir légumes, saumon, citron, huile et aneth dans quatre papillotes.
3. Fermer hermétiquement et cuire 14 à 18 minutes à 180 °C selon l’épaisseur.
4. Ouvrir prudemment ; viser une température à cœur de 52–55 °C pour une texture nacrée ou 63 °C pour une cuisson complète.

**Techniques** : julienne, précuisson, cuisson en papillote, contrôle température.

**Variantes validables** : Cabillaud : viser 60–63 °C ; fenouil à la place du poireau.

**Conservation** : 1 jour au réfrigérateur après cuisson.

**Allergènes** : poisson

---

### FR-011 — Cabillaud au citron, riz et légumes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : poisson
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 30 min
- **Difficulté** : facile
- **Tags** : poisson, équilibré
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Les branches de féculent doivent porter leurs propres temps et volumes d’eau.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Dos de cabillaud cru | 600 | g | protéine | non |
| Riz long blanc cru | 280 | g | féculent | non |
| Haricot vert cru | 500 | g | légume | non |
| Citron jaune frais | 1 | u | acidité | non |
| Beurre doux | 30 | g | sauce | non |
| Huile d'olive vierge extra | 15 | ml | cuisson | non |
| Persil frais | 15 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Cuire le riz par absorption selon sa variété.
2. Cuire les haricots verts à l’eau salée puis les rafraîchir brièvement.
3. Saisir doucement le cabillaud dans l’huile, puis terminer couvert avec un filet de citron.
4. Viser 60–63 °C à cœur. Monter le jus avec le beurre et le persil.
5. Servir immédiatement avec riz et haricots.

**Techniques** : cuisson par absorption, blanchiment, saisie douce, cuisson couverte, émulsion au beurre.

**Variantes validables** : Riz complet : branche 30–35 minutes et davantage d’eau ; quinoa.

**Conservation** : 1 jour au réfrigérateur.

**Allergènes** : poisson, lait

---

### VEG-001 — Lentilles vertes mijotées aux légumes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : légumineuses
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : vegan, batch-cooking, protéines végétales
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Forme exigée : lentille sèche crue, jamais lentille déjà cuite.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille verte sèche, crue | 400 | g | protéine végétale | non |
| Carotte crue | 300 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Céleri branche cru | 120 | g | aromatique | non |
| Ail cru | 10 | g | aromatique | non |
| Huile d'olive vierge extra | 25 | ml | cuisson | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Thym séché | 2 | g | aromate | non |
| Vinaigre de vin rouge | 15 | ml | finition | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer oignon, carotte et céleri dans l’huile.
2. Ajouter lentilles rincées, ail, thym et laurier ; couvrir de trois fois leur volume d’eau.
3. Cuire à frémissement 25 à 35 minutes selon la variété.
4. Saler vers la fin, égoutter si nécessaire et finir avec le vinaigre.

**Techniques** : suer, mijotage, assaisonnement tardif, acidification.

**Variantes validables** : Lardons ajoutés séparément ; œuf mollet ; moutarde dans la vinaigrette.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### VEG-002 — Salade de pois chiches, tomate et concombre

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : salade
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 0 min
- **Difficulté** : facile
- **Tags** : vegan, rapide, été
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Toutes les matières grasses et acidifiants sont explicitement listés.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois chiche cuit, égoutté | 500 | g | protéine végétale | non |
| Tomate fraîche mûre | 350 | g | légume | non |
| Concombre frais | 300 | g | légume | non |
| Oignon rouge cru | 80 | g | aromatique | non |
| Persil frais | 25 | g | aromate | non |
| Huile d'olive vierge extra | 35 | ml | vinaigrette | non |
| Jus de citron frais | 30 | ml | vinaigrette | non |
| Cumin moulu | 2 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Rincer et égoutter soigneusement les pois chiches.
2. Couper tomate et concombre, émincer l’oignon et hacher le persil.
3. Émulsionner huile, citron, cumin, sel et poivre.
4. Mélanger et laisser reposer 20 minutes au frais.

**Techniques** : égouttage, taillage, émulsion, marinade courte.

**Variantes validables** : Feta ; poivron ; menthe ; vinaigre à la place du citron.

**Conservation** : 2 jours au réfrigérateur.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### EGG-001 — Omelette aux fines herbes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : œufs
- **Portions** : 2
- **Temps** : préparation 8 min · cuisson 6 min
- **Difficulté** : facile
- **Tags** : rapide, petit budget
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : La matière grasse de cuisson est obligatoire dans la recette canonique.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 4 | u | protéine | non |
| Beurre doux | 15 | g | cuisson | non |
| Persil frais | 8 | g | aromate | non |
| Ciboulette fraîche | 8 | g | aromate | non |
| Sel fin | 2 | g | assaisonnement | oui |
| Poivre noir moulu | 0.5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Battre les œufs juste assez pour homogénéiser, puis ajouter les herbes.
2. Chauffer le beurre jusqu’à mousse légère.
3. Verser les œufs, remuer les parties prises vers le centre et arrêter lorsque la surface reste légèrement humide.
4. Plier et servir immédiatement.

**Techniques** : battage, cuisson à la poêle, coagulation contrôlée, pliage.

**Variantes validables** : Fromage ; champignons poêlés ; fines herbes différentes.

**Conservation** : À consommer immédiatement.

**Allergènes** : œuf, lait

---

### VEG-003 — Quinoa aux légumes rôtis

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : céréales et légumes
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : vegan, batch-cooking
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Quinoa cru distinct du quinoa déjà cuit.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Quinoa cru | 280 | g | féculent | non |
| Courgette fraîche | 300 | g | légume | non |
| Poivron rouge frais | 250 | g | légume | non |
| Carotte crue | 250 | g | légume | non |
| Oignon rouge cru | 150 | g | légume | non |
| Huile d'olive vierge extra | 35 | ml | cuisson | non |
| Jus de citron frais | 20 | ml | finition | non |
| Persil frais | 15 | g | aromate | non |
| Cumin moulu | 2 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Rincer le quinoa puis le cuire par absorption dans environ 1,8 fois son volume d’eau.
2. Tailler les légumes, les mélanger avec huile, cumin et sel puis les rôtir 25 minutes à 210 °C.
3. Égrener le quinoa, incorporer légumes, citron et persil.

**Techniques** : rinçage, cuisson par absorption, rôtissage, égrenage.

**Variantes validables** : Boulgour ; semoule ; feta ; pois chiches.

**Conservation** : 4 jours au réfrigérateur.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### IND-001 — Curry de pois chiches et épinards

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : curry végétarien
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : vegan, batch-cooking, Inde inspirée
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois chiche cuit, égoutté | 700 | g | protéine végétale | non |
| Épinard frais | 400 | g | légume | non |
| Tomate concassée en conserve | 600 | g | sauce | non |
| Lait de coco | 400 | ml | sauce | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Huile de colza raffinée | 25 | ml | cuisson | non |
| Curry en poudre | 12 | g | épice | non |
| Cumin moulu | 5 | g | épice | non |
| Curcuma moulu | 4 | g | épice | non |
| Jus de citron frais | 20 | ml | finition | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer l’oignon, puis ajouter ail, gingembre et épices ; cuire jusqu’à parfum.
2. Ajouter tomate et lait de coco, puis mijoter 15 minutes.
3. Ajouter pois chiches et cuire 10 minutes.
4. Incorporer les épinards jusqu’à tombée, finir au citron.

**Techniques** : suer, torréfaction des épices, mijotage, tombée des épinards.

**Variantes validables** : Lentilles ; chou-fleur ; yaourt en finition non vegan.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### IND-002 — Dahl de lentilles corail

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : curry végétarien
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : vegan, batch-cooking, petit budget
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille corail sèche, crue | 400 | g | protéine végétale | non |
| Tomate concassée en conserve | 500 | g | sauce | non |
| Lait de coco | 300 | ml | sauce | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Gingembre frais | 18 | g | aromatique | non |
| Huile de colza raffinée | 25 | ml | cuisson | non |
| Cumin en graines | 5 | g | épice | non |
| Curcuma moulu | 4 | g | épice | non |
| Garam masala | 6 | g | épice | non |
| Jus de citron frais | 20 | ml | finition | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Rincer les lentilles jusqu’à eau presque claire.
2. Faire revenir cumin, oignon, ail et gingembre dans l’huile.
3. Ajouter curcuma, tomate, lentilles, lait de coco et 500 ml d’eau.
4. Mijoter 25 minutes en remuant, jusqu’à texture crémeuse.
5. Ajouter garam masala et citron en fin de cuisson.

**Techniques** : rinçage, torréfaction, mijotage, liaison par amidon.

**Variantes validables** : Épinards ; carotte ; version sans coco avec bouillon.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### MED-001 — Shakshuka

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : œufs et tomate
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : végétarien, brunch
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 6 | u | protéine | non |
| Tomate concassée en conserve | 800 | g | sauce | non |
| Poivron rouge frais | 300 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Huile d'olive vierge extra | 30 | ml | cuisson | non |
| Cumin moulu | 4 | g | épice | non |
| Paprika fumé | 5 | g | épice | non |
| Piment en poudre | 1 | g | épice | oui |
| Persil frais | 15 | g | finition | non |
| Sel fin | 5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire fondre oignon et poivron dans l’huile.
2. Ajouter ail et épices, puis tomate ; mijoter 20 minutes jusqu’à sauce épaisse.
3. Creuser six cavités, casser les œufs et couvrir.
4. Cuire 6 à 10 minutes selon la prise souhaitée ; finir au persil.

**Techniques** : suer, mijotage, œufs pochés en sauce.

**Variantes validables** : Feta ; pois chiches ; aubergine rôtie.

**Conservation** : 2 jours pour la sauce seule ; œufs à cuire au moment.

**Allergènes** : œuf

---

### LEV-001 — Houmous

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tartinade
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 0 min
- **Difficulté** : facile
- **Tags** : vegan, apéritif
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois chiche cuit, égoutté | 500 | g | base | non |
| Tahini | 100 | g | matière grasse | non |
| Jus de citron frais | 70 | ml | acidité | non |
| Ail cru | 8 | g | aromatique | non |
| Huile d'olive vierge extra | 30 | ml | finition | non |
| Cumin moulu | 2 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | non |
| Eau glacée | 80 | ml | texture | non |

#### Étapes canoniques originales

1. Mixer tahini et citron jusqu’à épaississement, puis ajouter l’eau glacée progressivement.
2. Ajouter pois chiches, ail, cumin et sel ; mixer longuement jusqu’à texture lisse.
3. Ajuster avec eau et servir avec huile d’olive.

**Techniques** : émulsion, mixage fin, ajustement de texture.

**Variantes validables** : Betterave ; poivron rôti ; haricot blanc.

**Conservation** : 4 jours au réfrigérateur.

**Allergènes** : sésame

---

### LEV-002 — Falafels au four

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : boulettes végétales
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : facile
- **Tags** : vegan, meal-prep
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Utiliser des pois chiches trempés non cuits, sinon la pâte devient trop molle.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois chiche sec, cru | 350 | g | base | non |
| Oignon jaune cru | 120 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Persil frais | 30 | g | herbe | non |
| Coriandre fraîche | 30 | g | herbe | non |
| Cumin moulu | 6 | g | épice | non |
| Coriandre moulue | 5 | g | épice | non |
| Bicarbonate de sodium alimentaire | 3 | g | levée | non |
| Huile d'olive vierge extra | 30 | ml | cuisson | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Faire tremper les pois chiches secs 18 à 24 heures, puis les égoutter parfaitement.
2. Mixer grossièrement avec oignon, ail, herbes, épices, bicarbonate et sel.
3. Reposer 30 minutes, former des boulettes et les huiler légèrement.
4. Cuire 20 à 25 minutes à 210 °C en retournant à mi-cuisson.

**Techniques** : trempage, hachage, repos, façonnage, cuisson au four.

**Variantes validables** : Friture traditionnelle ; fèves sèches en mélange.

**Conservation** : 3 jours au réfrigérateur ; congélation avant ou après cuisson.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### IT-002 — Risotto aux champignons

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : riz crémeux
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Tags** : Italie, végétarien
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Le risotto fini doit être fluide, non compact.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz arborio cru | 320 | g | féculent | non |
| Champignon de Paris frais | 500 | g | garniture | non |
| Bouillon de légumes non salé | 1100 | ml | cuisson | non |
| Échalote crue | 100 | g | aromatique | non |
| Vin blanc sec | 120 | ml | déglaçage | non |
| Parmesan affiné | 80 | g | finition | non |
| Beurre doux | 50 | g | cuisson et finition | non |
| Huile d'olive vierge extra | 15 | ml | cuisson | non |
| Persil frais | 15 | g | finition | non |
| Sel fin | 4 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Poêler les champignons à feu vif et réserver.
2. Faire suer l’échalote, nacrer le riz puis déglacer au vin.
3. Ajouter le bouillon chaud progressivement en remuant régulièrement pendant 17 à 19 minutes.
4. Hors du feu, incorporer beurre, parmesan et champignons ; couvrir 2 minutes.
5. Ajuster la texture avec un peu de bouillon et finir au persil.

**Techniques** : poêlage, nacrage, déglaçage, cuisson par mouillage progressif, mantecatura.

**Variantes validables** : Cèpes ; courge ; asperges ; orge perlé.

**Conservation** : 2 jours au réfrigérateur, mais meilleur immédiatement.

**Allergènes** : lait

---

### IT-003 — Spaghetti carbonara

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtes
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Tags** : Italie, rapide
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : La crème est exclue de la version canonique.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Spaghetti secs | 400 | g | féculent | non |
| Guanciale cru | 180 | g | protéine | non |
| Jaune d'œuf cru | 5 | u | sauce | non |
| Œuf cru | 1 | u | sauce | non |
| Pecorino romano | 120 | g | fromage | non |
| Poivre noir en grains | 4 | g | épice | non |
| Sel fin | 4 | g | eau de cuisson | oui |

#### Étapes canoniques originales

1. Faire fondre et dorer doucement le guanciale ; conserver sa graisse.
2. Mélanger jaunes, œuf, pecorino râpé et poivre fraîchement moulu.
3. Cuire les spaghetti très al dente et conserver l’eau de cuisson.
4. Hors du feu, mélanger pâtes et guanciale, puis incorporer l’appareil aux œufs avec un peu d’eau de cuisson.
5. Remuer jusqu’à sauce crémeuse sans coagulation ; servir immédiatement.

**Techniques** : rendu de graisse, cuisson al dente, émulsion hors feu, tempérage.

**Variantes validables** : Pancetta si guanciale indisponible ; aucune crème dans la version canonique.

**Conservation** : À consommer immédiatement.

**Allergènes** : gluten, œuf, lait

---

### IT-004 — Spaghetti bolognaise familiale

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtes en sauce
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 100 min
- **Difficulté** : facile
- **Tags** : familial, batch-cooking
- **Sources de comparaison** : `marmiton_lasagne`, `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Spaghetti secs | 600 | g | féculent | non |
| Bœuf haché cru 15 % MG | 600 | g | protéine | non |
| Tomate concassée en conserve | 900 | g | sauce | non |
| Oignon jaune cru | 180 | g | soffritto | non |
| Carotte crue | 120 | g | soffritto | non |
| Céleri branche cru | 100 | g | soffritto | non |
| Vin rouge sec | 120 | ml | déglaçage | non |
| Huile d'olive vierge extra | 25 | ml | cuisson | non |
| Parmesan affiné | 80 | g | service | oui |
| Sel fin | 7 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer oignon, carotte et céleri très finement hachés.
2. Ajouter le bœuf, le colorer puis déglacer au vin.
3. Ajouter la tomate et mijoter au moins 75 minutes.
4. Cuire les pâtes al dente et les mélanger avec une partie de la sauce.
5. Servir avec parmesan facultatif.

**Techniques** : soffritto, saisie, déglaçage, mijotage, cuisson al dente.

**Variantes validables** : Porc et bœuf ; lentilles ; tagliatelles.

**Conservation** : 4 jours pour la sauce ; congélation 3 mois.

**Allergènes** : gluten, lait

---

### IT-005 — Pâtes au pesto

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtes
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Tags** : Italie, rapide, végétarien
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâtes sèches courtes | 400 | g | féculent | non |
| Basilic frais | 60 | g | sauce | non |
| Parmesan affiné | 60 | g | sauce | non |
| Pignon de pin | 35 | g | sauce | non |
| Ail cru | 5 | g | sauce | non |
| Huile d'olive vierge extra | 100 | ml | sauce | non |
| Sel fin | 4 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Mixer ou piler basilic, ail, pignons et parmesan sans chauffer excessivement.
2. Ajouter l’huile progressivement.
3. Cuire les pâtes al dente et réserver un peu d’eau.
4. Détendre le pesto avec l’eau de cuisson et mélanger hors du feu.

**Techniques** : pilonnage, émulsion, cuisson al dente, liaison à l'eau de cuisson.

**Variantes validables** : Noix ; amande ; pesto de roquette.

**Conservation** : 2 jours pour le pesto sous une fine couche d’huile.

**Allergènes** : gluten, lait, fruits à coque

---

### IT-006 — Gnocchi tomate et mozzarella

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtes
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 30 min
- **Difficulté** : facile
- **Tags** : Italie, végétarien
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Gnocchi de pomme de terre frais | 600 | g | féculent | non |
| Tomate concassée en conserve | 600 | g | sauce | non |
| Mozzarella | 250 | g | fromage | non |
| Oignon jaune cru | 120 | g | aromatique | non |
| Ail cru | 8 | g | aromatique | non |
| Huile d'olive vierge extra | 20 | ml | cuisson | non |
| Basilic frais | 15 | g | finition | non |
| Sel fin | 5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer oignon et ail, ajouter tomate et mijoter 20 minutes.
2. Pocher les gnocchi jusqu’à remontée, les égoutter.
3. Mélanger gnocchi et sauce, couvrir de mozzarella.
4. Gratiner 10 minutes à 220 °C et finir au basilic.

**Techniques** : suer, mijotage, pochage, gratinage.

**Variantes validables** : Épinards ; aubergine ; parmesan.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, lait

---

### IT-007 — Pizza margherita maison

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pizza
- **Portions** : 4
- **Temps** : préparation 40 min · cuisson 15 min
- **Difficulté** : moyenne
- **Tags** : Italie, boulange
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé type 00 | 500 | g | pâte | non |
| Eau | 325 | ml | pâte | non |
| Levure boulangère sèche | 3 | g | pâte | non |
| Sel fin | 10 | g | pâte | non |
| Huile d'olive vierge extra | 15 | ml | pâte | non |
| Tomate entière pelée en conserve | 400 | g | sauce | non |
| Mozzarella | 300 | g | garniture | non |
| Basilic frais | 15 | g | garniture | non |

#### Étapes canoniques originales

1. Pétrir farine, eau, levure, sel et huile jusqu’à pâte lisse.
2. Laisser fermenter 2 heures, puis diviser et détendre 30 minutes.
3. Écraser les tomates avec un peu de sel.
4. Étaler sans rouleau, garnir légèrement de tomate et mozzarella égouttée.
5. Cuire sur pierre ou plaque très chaude à la température maximale du four, puis ajouter le basilic.

**Techniques** : pétrissage, fermentation, façonnage, cuisson haute température.

**Variantes validables** : Pâte maturée 24 h au froid ; légumes grillés.

**Conservation** : À consommer immédiatement ; pâte crue 48 h au froid.

**Allergènes** : gluten, lait

---

### FR-012 — Soupe à l’oignon gratinée

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : soupe
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 75 min
- **Difficulté** : facile
- **Tags** : tradition française, hiver
- **Sources de comparaison** : `marmiton_top`, `serious_stews`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Oignon jaune cru | 1000 | g | base | non |
| Bouillon de bœuf non salé | 1500 | ml | liquide | non |
| Vin blanc sec | 150 | ml | déglaçage | non |
| Beurre doux | 50 | g | cuisson | non |
| Farine de blé T55 | 20 | g | liaison | oui |
| Pain de campagne | 300 | g | croûtons | non |
| Comté | 180 | g | gratinage | non |
| Thym séché | 2 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1.5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Émincer les oignons et les cuire très doucement au beurre 40 à 50 minutes jusqu’à brunissement profond.
2. Ajouter éventuellement la farine, puis déglacer au vin.
3. Ajouter bouillon et thym, mijoter 25 minutes.
4. Répartir dans des bols, couvrir de pain grillé et de comté.
5. Gratiner vivement jusqu’à coloration.

**Techniques** : caramélisation lente, déglaçage, mijotage, gratinage.

**Variantes validables** : Bouillon de légumes ; gruyère.

**Conservation** : 3 jours pour la soupe sans croûtons.

**Allergènes** : gluten, lait

---

### FR-013 — Velouté de champignons

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : soupe
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : végétarien, hiver
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Champignon de Paris frais | 800 | g | base | non |
| Pomme de terre crue, épluchée | 250 | g | liaison | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Bouillon de légumes non salé | 1000 | ml | liquide | non |
| Crème fraîche liquide entière | 150 | ml | finition | non |
| Beurre doux | 30 | g | cuisson | non |
| Thym frais | 3 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Colorer une petite partie des champignons pour la garniture et réserver.
2. Faire suer oignon et reste des champignons au beurre.
3. Ajouter pomme de terre, thym et bouillon ; cuire 25 minutes.
4. Mixer finement, ajouter crème et rectifier.
5. Servir avec les champignons colorés.

**Techniques** : coloration, suer, cuisson au bouillon, mixage, finition crème.

**Variantes validables** : Sans crème ; cèpes ; noisettes.

**Conservation** : 3 jours au réfrigérateur ; congélation sans crème.

**Allergènes** : lait

---

### FR-014 — Velouté de potimarron

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : soupe
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : automne, végétarien
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Potimarron frais, épépiné | 1000 | g | base | non |
| Pomme de terre crue, épluchée | 250 | g | liaison | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Bouillon de légumes non salé | 1100 | ml | liquide | non |
| Crème fraîche liquide entière | 120 | ml | finition | oui |
| Huile d'olive vierge extra | 20 | ml | cuisson | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer l’oignon, ajouter potimarron et pomme de terre en cubes.
2. Mouiller au bouillon et cuire 30 minutes.
3. Mixer très finement, ajouter éventuellement la crème.
4. Rectifier muscade et sel.

**Techniques** : suer, cuisson au bouillon, mixage.

**Variantes validables** : Lait de coco et curry ; carotte ; graines de courge.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : lait

---

### IT-008 — Minestrone

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : soupe complète
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : facile
- **Tags** : Italie, batch-cooking
- **Sources de comparaison** : `serious_stews`, `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot blanc cuit, égoutté | 500 | g | légumineuse | non |
| Petites pâtes sèches | 180 | g | féculent | non |
| Tomate concassée en conserve | 500 | g | base | non |
| Carotte crue | 250 | g | légume | non |
| Courgette fraîche | 300 | g | légume | non |
| Céleri branche cru | 150 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Poireau cru | 180 | g | légume | non |
| Bouillon de légumes non salé | 1500 | ml | liquide | non |
| Huile d'olive vierge extra | 30 | ml | cuisson | non |
| Parmesan affiné | 80 | g | service | oui |
| Basilic frais | 15 | g | finition | non |
| Sel fin | 7 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire suer oignon, carotte, céleri et poireau.
2. Ajouter tomate et bouillon ; mijoter 30 minutes.
3. Ajouter courgette, haricots et pâtes ; cuire jusqu’à pâtes al dente.
4. Finir au basilic et servir avec parmesan facultatif.

**Techniques** : suer, mijotage séquencé, cuisson des pâtes dans le bouillon.

**Variantes validables** : Riz ; chou ; pesto en finition.

**Conservation** : 4 jours au réfrigérateur ; les pâtes absorbent le bouillon.

**Allergènes** : gluten, lait

---

### FR-015 — Pot-au-feu

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat bouilli
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 210 min
- **Difficulté** : moyenne
- **Tags** : tradition française, anti-gaspi
- **Sources de comparaison** : `marmiton_top`, `serious_beef`
- **Arbitrage** : Produit plusieurs sous-produits : bouillon, viande cuite, légumes, moelle.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru, paré | 900 | g | protéine | non |
| Jarret de bœuf cru, avec os | 700 | g | protéine et collagène | non |
| Os à moelle de bœuf | 4 | u | garniture | non |
| Carotte crue | 600 | g | légume | non |
| Poireau cru | 500 | g | légume | non |
| Navet cru | 400 | g | légume | non |
| Céleri branche cru | 180 | g | aromatique | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Clou de girofle | 4 | u | épice | non |
| Sel fin | 12 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Départ à froid : couvrir viandes et os d’eau. Monter lentement à frémissement et écumer soigneusement.
2. Ajouter oignon piqué de girofle, céleri et bouquet garni ; cuire 2 heures à très petit frémissement.
3. Ajouter carottes, navets et poireaux selon leur temps de cuisson et poursuivre environ 1 heure.
4. Cuire les os à moelle protégés dans une mousseline ou séparément.
5. Servir bouillon, viandes, légumes, moutarde et cornichons.

**Techniques** : départ à froid, écumage, pochage long, cuisson séquencée.

**Variantes validables** : Poulet en complément ; pommes de terre cuites à part.

**Conservation** : 3 jours au réfrigérateur ; dégraisser le bouillon à froid.

**Allergènes** : aucun allergène majeur déclaré par la structure de base

---

### FR-016 — Coq au vin

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 150 min
- **Difficulté** : facile
- **Tags** : tradition française, batch-cooking
- **Sources de comparaison** : `serious_stews`, `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1600 | g | protéine | non |
| Vin rouge sec | 750 | ml | braisage | non |
| Lardon fumé cru | 180 | g | garniture | non |
| Champignon de Paris frais | 350 | g | garniture | non |
| Oignon grelot cru | 250 | g | garniture | non |
| Carotte crue | 250 | g | aromatique | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Farine de blé T55 | 25 | g | liaison | non |
| Huile de colza raffinée | 20 | ml | saisie | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Sel fin | 6 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Saisir les morceaux de poulet et réserver.
2. Faire revenir lardons, carotte et oignon ; ajouter farine.
3. Déglacer au vin, remettre le poulet et le bouquet garni.
4. Braiser doucement 75 à 90 minutes.
5. Poêler champignons et oignons grelots séparément puis les ajouter en fin de cuisson.
6. Réduire la sauce et vérifier 75 °C à cœur.

**Techniques** : saisie, déglaçage, braisage, garniture séparée, réduction.

**Variantes validables** : Vin blanc ; sans lardons ; véritable coq avec cuisson plus longue.

**Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : gluten

---

### FR-017 — Poulet rôti et pommes de terre

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : rôti
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : facile
- **Tags** : dimanche, restes
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Génère carcasse et jus pour bouillon et sauce.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru, prêt à cuire | 1800 | g | protéine | non |
| Pomme de terre crue, avec peau | 1200 | g | féculent | non |
| Oignon jaune cru | 250 | g | garniture | non |
| Ail cru | 20 | g | aromatique | non |
| Huile d'olive vierge extra | 35 | ml | cuisson | non |
| Beurre doux | 30 | g | cuisson | non |
| Thym frais | 5 | g | aromate | non |
| Citron jaune frais | 1 | u | aromate | non |
| Sel fin | 10 | g | assaisonnement | non |
| Poivre noir moulu | 2 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Saler le poulet à l’avance si possible. Tempérer 30 minutes avant cuisson.
2. Garnir la cavité de citron, ail et thym ; masser la peau avec beurre et huile.
3. Disposer pommes de terre et oignons autour.
4. Rôtir à 210 °C 20 minutes puis à 180 °C jusqu’à 75 °C dans la cuisse.
5. Reposer 15 minutes avant découpe, puis déglacer le plat avec un peu d’eau.

**Techniques** : salage anticipé, rôtissage, arrosage, contrôle température, repos, déglaçage.

**Variantes validables** : Poulet en crapaudine ; légumes racines ; herbes différentes.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-018 — Filet mignon de porc à la moutarde

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : viande en sauce
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : rapide
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet mignon de porc cru | 700 | g | protéine | non |
| Moutarde de Dijon | 35 | g | sauce | non |
| Crème fraîche épaisse | 180 | g | sauce | non |
| Échalote crue | 100 | g | aromatique | non |
| Vin blanc sec | 100 | ml | déglaçage | non |
| Huile de colza raffinée | 20 | ml | saisie | non |
| Thym frais | 3 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | oui |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Parer et couper le filet mignon en médaillons épais.
2. Saisir rapidement les médaillons et réserver.
3. Faire suer l’échalote, déglacer au vin et réduire.
4. Ajouter moutarde et crème, remettre le porc et cuire doucement jusqu’à 63–65 °C à cœur.
5. Reposer 5 minutes et servir.

**Techniques** : parage, saisie, déglaçage, réduction, cuisson contrôlée.

**Variantes validables** : Cuisson du filet entier au four ; champignons.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait, moutarde

---

### FR-019 — Boulettes de bœuf sauce tomate

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : boulettes
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 50 min
- **Difficulté** : facile
- **Tags** : familial, batch-cooking
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf haché cru 15 % MG | 750 | g | protéine | non |
| Œuf cru | 1 | u | liaison | non |
| Chapelure de blé | 60 | g | liaison | non |
| Lait demi-écrémé | 80 | ml | liaison | non |
| Parmesan affiné | 50 | g | assaisonnement | non |
| Tomate concassée en conserve | 900 | g | sauce | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Huile d'olive vierge extra | 25 | ml | cuisson | non |
| Persil frais | 20 | g | aromate | non |
| Sel fin | 7 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Tremper la chapelure dans le lait, puis mélanger délicatement avec viande, œuf, parmesan et persil.
2. Former des boulettes sans trop compacter et les colorer.
3. Faire suer oignon et ail, ajouter tomate et mijoter 15 minutes.
4. Ajouter les boulettes et poursuivre 20 minutes jusqu’à cuisson complète.

**Techniques** : panade, façonnage, saisie, mijotage.

**Variantes validables** : Porc et bœuf ; dinde ; lentilles.

**Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.

**Allergènes** : gluten, œuf, lait

---

### GR-001 — Moussaka

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gratin complet
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 90 min
- **Difficulté** : moyenne
- **Tags** : Grèce, batch-cooking
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 1400 | g | légume | non |
| Agneau haché cru | 700 | g | protéine | non |
| Tomate concassée en conserve | 700 | g | sauce | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Vin rouge sec | 100 | ml | déglaçage | non |
| Lait entier | 800 | ml | béchamel | non |
| Farine de blé T55 | 70 | g | béchamel | non |
| Beurre doux | 70 | g | béchamel | non |
| Œuf cru | 2 | u | béchamel | non |
| Parmesan affiné | 80 | g | gratinage | non |
| Cannelle moulue | 1 | g | épice | non |
| Huile d'olive vierge extra | 40 | ml | cuisson | non |
| Sel fin | 9 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Trancher, saler puis rôtir les aubergines jusqu’à tendreté.
2. Faire revenir oignon, ail et agneau ; déglacer au vin, ajouter tomate et cannelle puis réduire.
3. Préparer une béchamel épaisse, la laisser tiédir puis incorporer les œufs.
4. Monter aubergines, sauce à la viande et béchamel.
5. Parsemer de parmesan et cuire 40 minutes à 180 °C. Reposer 20 minutes.

**Techniques** : dégorgement, rôtissage, saisie, déglaçage, réduction, béchamel, montage, gratinage.

**Variantes validables** : Bœuf ; pommes de terre ; lentilles.

**Conservation** : 4 jours au réfrigérateur ; congélation 2 mois.

**Allergènes** : gluten, œuf, lait

---

### FR-020 — Gratin de courgettes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gratin de légumes
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : végétarien, été
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Courgette fraîche | 1200 | g | légume | non |
| Œuf cru | 3 | u | appareil | non |
| Crème fraîche liquide entière | 250 | ml | appareil | non |
| Comté | 120 | g | gratinage | non |
| Ail cru | 8 | g | aromatique | non |
| Huile d'olive vierge extra | 20 | ml | cuisson | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Trancher les courgettes et les poêler pour évaporer une partie de leur eau.
2. Mélanger œufs, crème, ail, muscade et la moitié du fromage.
3. Disposer les courgettes, verser l’appareil et couvrir du reste de fromage.
4. Cuire 30 à 35 minutes à 185 °C.

**Techniques** : poêlage, évaporation, appareil à crème prise, gratinage.

**Variantes validables** : Chèvre ; riz cuit en fond ; tomate.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : œuf, lait

---

### FR-021 — Fondue de poireaux

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : accompagnement
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 30 min
- **Difficulté** : facile
- **Tags** : végétarien, accompagnement
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poireau cru | 800 | g | légume | non |
| Beurre doux | 35 | g | cuisson | non |
| Crème fraîche épaisse | 100 | g | finition | non |
| Moutarde de Dijon | 15 | g | finition | oui |
| Jus de citron frais | 10 | ml | finition | non |
| Sel fin | 4 | g | assaisonnement | non |
| Poivre noir moulu | 1 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Laver soigneusement et émincer les poireaux.
2. Les faire tomber au beurre avec une pincée de sel.
3. Couvrir et cuire doucement 20 minutes, puis découvrir pour évaporer.
4. Ajouter crème, moutarde et citron ; cuire encore 3 minutes.

**Techniques** : lavage, tombée, étuvée, réduction.

**Variantes validables** : Sans crème ; curry ; servir avec poisson.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait, moutarde

---

### FR-022 — Endives au jambon

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gratin complet
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 55 min
- **Difficulté** : facile
- **Tags** : familial, hiver
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Endive fraîche | 8 | u | légume | non |
| Jambon blanc cuit | 8 | tranche | protéine | non |
| Lait demi-écrémé | 700 | ml | béchamel | non |
| Farine de blé T55 | 60 | g | béchamel | non |
| Beurre doux | 60 | g | béchamel | non |
| Comté | 120 | g | gratinage | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Cuire les endives à la vapeur ou à l’étouffée, puis les presser soigneusement.
2. Préparer une béchamel et l’assaisonner de muscade.
3. Enrouler chaque endive dans une tranche de jambon.
4. Napper de béchamel, couvrir de fromage et gratiner 25 minutes à 190 °C.

**Techniques** : vapeur, égouttage, béchamel, montage, gratinage.

**Variantes validables** : Poireaux ; dinde ; sauce légère.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, lait

---

### FR-023 — Croque-monsieur

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : sandwich chaud
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Tags** : rapide, déjeuner
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain de mie | 8 | tranche | base | non |
| Jambon blanc cuit | 4 | tranche | protéine | non |
| Comté | 160 | g | fromage | non |
| Béchamel préparée | 240 | g | sauce | non |
| Beurre doux | 20 | g | cuisson | non |
| Moutarde de Dijon | 15 | g | condiment | oui |

#### Étapes canoniques originales

1. Tartiner légèrement le pain de moutarde facultative.
2. Garnir de jambon et d’une partie du fromage, fermer.
3. Napper de béchamel et couvrir du reste de fromage.
4. Cuire 10 à 12 minutes à 200 °C puis gratiner.

**Techniques** : montage, cuisson au four, gratinage.

**Variantes validables** : Croque-madame avec œuf ; version poêlée sans béchamel.

**Conservation** : À consommer immédiatement.

**Allergènes** : gluten, lait, moutarde

---

### DESS-001 — Crêpes fines

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert et petit-déjeuner
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : facile
- **Tags** : Chandeleur, petit-déjeuner
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 250 | g | pâte | non |
| Œuf cru | 4 | u | pâte | non |
| Lait demi-écrémé | 600 | ml | pâte | non |
| Beurre doux | 40 | g | pâte | non |
| Sucre semoule | 25 | g | pâte | oui |
| Sel fin | 2 | g | pâte | non |
| Rhum ambré | 20 | ml | arôme | oui |

#### Étapes canoniques originales

1. Mélanger farine, sucre et sel. Ajouter les œufs puis le lait progressivement.
2. Incorporer le beurre fondu et le rhum facultatif.
3. Laisser reposer 30 minutes.
4. Cuire en fine couche dans une poêle légèrement graissée.

**Techniques** : mélange, repos, cuisson à la poêle.

**Variantes validables** : Sarrasin salé ; sans lactose ; zeste d’orange.

**Conservation** : 2 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### DESS-002 — Pancakes moelleux

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : petit-déjeuner
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : facile
- **Tags** : brunch
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 250 | g | pâte | non |
| Œuf cru | 2 | u | pâte | non |
| Lait demi-écrémé | 300 | ml | pâte | non |
| Beurre doux | 45 | g | pâte | non |
| Sucre semoule | 35 | g | pâte | non |
| Levure chimique | 12 | g | levée | non |
| Sel fin | 2 | g | pâte | non |

#### Étapes canoniques originales

1. Mélanger les ingrédients secs.
2. Mélanger œufs, lait et beurre fondu, puis incorporer sans travailler excessivement.
3. Reposer 15 minutes.
4. Cuire de petites louches à feu moyen ; retourner lorsque des bulles apparaissent.

**Techniques** : mélange limité, repos, cuisson à la poêle.

**Variantes validables** : Myrtilles ; banane ; farine semi-complète.

**Conservation** : 2 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### DESS-003 — Gâteau au yaourt

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gâteau
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : familial, goûter
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Yaourt nature | 125 | g | base | non |
| Farine de blé T55 | 250 | g | pâte | non |
| Sucre semoule | 180 | g | pâte | non |
| Œuf cru | 3 | u | pâte | non |
| Huile de colza raffinée | 100 | ml | matière grasse | non |
| Levure chimique | 11 | g | levée | non |
| Vanille liquide | 5 | ml | arôme | oui |
| Sel fin | 1 | g | pâte | non |

#### Étapes canoniques originales

1. Fouetter œufs et sucre, puis ajouter yaourt et huile.
2. Incorporer farine, levure et sel sans trop mélanger.
3. Verser dans un moule graissé.
4. Cuire 30 à 35 minutes à 175 °C.

**Techniques** : foisonnement léger, mélange, cuisson au four.

**Variantes validables** : Pommes ; citron ; chocolat.

**Conservation** : 4 jours à température ambiante bien emballé.

**Allergènes** : gluten, œuf, lait

---

### DESS-004 — Tiramisu classique

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert froid
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 0 min
- **Difficulté** : moyenne
- **Tags** : Italie, préparation à l'avance
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Œufs pasteurisés recommandés pour les publics à risque.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Mascarpone | 500 | g | crème | non |
| Œuf cru | 5 | u | crème | non |
| Sucre semoule | 110 | g | crème | non |
| Biscuit cuillère | 300 | g | structure | non |
| Café expresso refroidi | 450 | ml | imbibage | non |
| Cacao non sucré | 25 | g | finition | non |
| Marsala | 40 | ml | arôme | oui |

#### Étapes canoniques originales

1. Séparer les œufs. Fouetter jaunes et sucre, puis incorporer le mascarpone.
2. Monter les blancs et les incorporer délicatement.
3. Imbiber brièvement les biscuits dans le café aromatisé.
4. Monter en couches biscuits et crème.
5. Réfrigérer au moins 8 heures puis poudrer de cacao.

**Techniques** : foisonnement, incorporation délicate, imbibage, montage, repos froid.

**Variantes validables** : Œufs pasteurisés ; spéculoos ; fruits rouges.

**Conservation** : 2 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### DESS-005 — Mousse au chocolat

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert froid
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 0 min
- **Difficulté** : moyenne
- **Tags** : chocolat, préparation à l'avance
- **Sources de comparaison** : `marmiton_top`
- **Arbitrage** : Œufs pasteurisés recommandés pour les publics à risque.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chocolat noir 70 % | 250 | g | base | non |
| Œuf cru | 6 | u | structure | non |
| Beurre doux | 25 | g | texture | oui |
| Sucre semoule | 20 | g | équilibre | oui |
| Sel fin | 1 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Faire fondre doucement le chocolat avec le beurre facultatif.
2. Séparer les œufs et incorporer les jaunes au chocolat tiédi.
3. Monter les blancs avec le sel et éventuellement le sucre.
4. Incorporer les blancs en trois fois sans les casser.
5. Réfrigérer au moins 4 heures.

**Techniques** : fusion douce, tempérage, montage des blancs, incorporation, prise au froid.

**Variantes validables** : Sans beurre ; zestes d’orange ; café.

**Conservation** : 2 jours au réfrigérateur.

**Allergènes** : œuf, lait

---

### DESS-006 — Flan pâtissier vanille

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâtisserie
- **Portions** : 10
- **Temps** : préparation 35 min · cuisson 55 min
- **Difficulté** : moyenne
- **Tags** : pâtisserie française
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 320 | g | fond | non |
| Lait entier | 1000 | ml | appareil | non |
| Crème fraîche liquide entière | 250 | ml | appareil | non |
| Œuf cru | 4 | u | appareil | non |
| Jaune d'œuf cru | 3 | u | appareil | non |
| Sucre semoule | 200 | g | appareil | non |
| Fécule de maïs | 90 | g | liaison | non |
| Gousse de vanille | 2 | u | arôme | non |
| Beurre doux | 20 | g | finition | non |

#### Étapes canoniques originales

1. Foncer un cercle haut avec la pâte et réserver au froid.
2. Infuser la vanille dans lait et crème.
3. Fouetter œufs, jaunes, sucre et fécule. Verser le liquide chaud progressivement.
4. Remettre sur le feu et cuire jusqu’à épaississement marqué.
5. Ajouter le beurre, verser dans le fond et cuire 45 à 55 minutes à 180 °C.
6. Refroidir complètement puis réfrigérer avant découpe.

**Techniques** : fonçage, infusion, tempérage, cuisson crème, cuisson au four, prise au froid.

**Variantes validables** : Sans pâte ; chocolat ; praliné.

**Conservation** : 4 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### DESS-007 — Crumble aux pommes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : automne, dessert familial
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme fraîche | 1200 | g | fruit | non |
| Farine de blé T55 | 180 | g | crumble | non |
| Beurre doux | 150 | g | crumble | non |
| Cassonade | 140 | g | crumble | non |
| Cannelle moulue | 3 | g | épice | non |
| Jus de citron frais | 20 | ml | acidité | non |
| Sel fin | 1 | g | crumble | non |

#### Étapes canoniques originales

1. Éplucher et couper les pommes, les mélanger avec citron et cannelle.
2. Sabler farine, beurre, cassonade et sel en morceaux irréguliers.
3. Répartir le crumble sur les pommes sans tasser.
4. Cuire 35 à 40 minutes à 180 °C jusqu’à fruit tendre et dessus doré.

**Techniques** : taillage, sablage, cuisson au four.

**Variantes validables** : Poire ; fruits rouges ; poudre d’amande.

**Conservation** : 3 jours au réfrigérateur ou 2 jours à température fraîche.

**Allergènes** : gluten, lait

---

### DESS-008 — Riz au lait vanille

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert
- **Portions** : 6
- **Temps** : préparation 10 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : dessert familial
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz rond blanc cru | 180 | g | base | non |
| Lait entier | 1200 | ml | cuisson | non |
| Sucre semoule | 110 | g | sucre | non |
| Gousse de vanille | 1 | u | arôme | non |
| Sel fin | 1 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Rincer rapidement le riz puis le blanchir 2 minutes dans l’eau ; égoutter.
2. Porter le lait avec vanille à frémissement.
3. Ajouter le riz et cuire très doucement 35 à 45 minutes en remuant.
4. Ajouter le sucre en fin de cuisson et refroidir.

**Techniques** : blanchiment, cuisson lente au lait, remuage.

**Variantes validables** : Caramel ; cannelle ; zestes d’agrumes.

**Conservation** : 4 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-024 — Béchamel de base

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : sauce de base
- **Portions** : 8
- **Temps** : préparation 10 min · cuisson 15 min
- **Difficulté** : facile
- **Tags** : sauce mère, composant
- **Sources de comparaison** : `marmiton_top`, `marmiton_blanquette`, `marmiton_lasagne`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Beurre doux | 60 | g | roux | non |
| Farine de blé T55 | 60 | g | roux | non |
| Lait demi-écrémé | 750 | ml | liquide | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | non |
| Poivre blanc moulu | 0.5 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Faire fondre le beurre, ajouter la farine et cuire le roux 2 minutes sans coloration.
2. Ajouter le lait froid progressivement en fouettant.
3. Porter à frémissement et cuire 5 à 8 minutes.
4. Assaisonner de muscade, sel et poivre.

**Techniques** : roux blanc, mouillage progressif, cuisson de sauce.

**Variantes validables** : Mornay avec fromage ; version huile végétale.

**Conservation** : 3 jours au réfrigérateur, filmée au contact.

**Allergènes** : gluten, lait

---

### FR-025 — Purée de pommes de terre

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : accompagnement
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : accompagnement, composant
- **Sources de comparaison** : `marmiton_hachis`, `bbc_bourguignon`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 1200 | g | féculent | non |
| Beurre doux | 100 | g | matière grasse | non |
| Lait entier | 250 | ml | liquide | non |
| Sel fin | 8 | g | assaisonnement | non |
| Muscade moulue | 0.5 | g | épice | oui |

#### Étapes canoniques originales

1. Cuire les pommes de terre à l’eau salée jusqu’à tendreté.
2. Égoutter et dessécher une minute sur feu doux.
3. Passer au presse-purée, incorporer beurre puis lait chaud.
4. Ajuster la texture et servir immédiatement.

**Techniques** : cuisson à l'eau, dessiccation, écrasement, émulsion.

**Variantes validables** : Huile d’olive ; ail rôti ; céleri-rave.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-026 — Haricots verts persillés

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : accompagnement
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Tags** : accompagnement, légumes
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot vert cru | 700 | g | légume | non |
| Beurre doux | 25 | g | finition | non |
| Ail cru | 8 | g | aromatique | non |
| Persil frais | 20 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Équeuter les haricots et les cuire dans une grande eau salée 7 à 10 minutes.
2. Rafraîchir brièvement si service différé, puis égoutter.
3. Faire mousser le beurre avec l’ail, ajouter les haricots et sauter 2 minutes.
4. Finir au persil.

**Techniques** : blanchiment, rafraîchissement, sauter, beurre persillé.

**Variantes validables** : Huile d’olive ; amandes grillées.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-027 — Pommes de terre sautées

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : accompagnement
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Tags** : accompagnement
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, avec peau | 900 | g | féculent | non |
| Huile de colza raffinée | 35 | ml | cuisson | non |
| Beurre doux | 20 | g | finition | non |
| Ail cru | 8 | g | aromatique | non |
| Persil frais | 15 | g | aromate | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Couper les pommes de terre en cubes réguliers, les rincer puis les sécher.
2. Les précuire 6 minutes à l’eau ou à la vapeur.
3. Les sauter dans l’huile à feu moyen-vif jusqu’à coloration.
4. Ajouter beurre, ail et persil en fin de cuisson.

**Techniques** : rinçage, précuisson, sauter, finition aromatique.

**Variantes validables** : Graisse de canard ; paprika ; oignon.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-028 — Cake jambon et olives

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : cake salé
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : apéritif, batch-cooking
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 250 | g | pâte | non |
| Œuf cru | 4 | u | pâte | non |
| Lait demi-écrémé | 120 | ml | pâte | non |
| Huile d'olive vierge extra | 100 | ml | pâte | non |
| Levure chimique | 11 | g | levée | non |
| Jambon blanc cuit | 200 | g | garniture | non |
| Olive verte dénoyautée | 120 | g | garniture | non |
| Comté | 120 | g | garniture | non |
| Poivre noir moulu | 1 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Mélanger farine et levure.
2. Incorporer œufs, lait et huile sans trop travailler.
3. Ajouter jambon, olives égouttées et fromage.
4. Verser dans un moule et cuire 40 à 45 minutes à 175 °C.

**Techniques** : mélange, incorporation de garniture, cuisson au four.

**Variantes validables** : Feta et courgette ; thon et tomate ; lardons.

**Conservation** : 4 jours au réfrigérateur ; congélation en tranches.

**Allergènes** : gluten, œuf, lait

---

### DESS-009 — Banana bread

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gâteau
- **Portions** : 10
- **Temps** : préparation 20 min · cuisson 55 min
- **Difficulté** : facile
- **Tags** : anti-gaspi, goûter
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Banane mûre | 450 | g | fruit | non |
| Farine de blé T55 | 260 | g | pâte | non |
| Œuf cru | 2 | u | pâte | non |
| Beurre doux | 110 | g | matière grasse | non |
| Cassonade | 130 | g | sucre | non |
| Levure chimique | 8 | g | levée | non |
| Bicarbonate de sodium alimentaire | 3 | g | levée | non |
| Cannelle moulue | 2 | g | épice | non |
| Sel fin | 2 | g | pâte | non |

#### Étapes canoniques originales

1. Écraser les bananes.
2. Mélanger beurre fondu, cassonade et œufs, puis ajouter les bananes.
3. Incorporer les ingrédients secs juste jusqu’à disparition de la farine.
4. Cuire 50 à 60 minutes à 170 °C.

**Techniques** : écrasement, mélange limité, cuisson au four.

**Variantes validables** : Noix ; chocolat ; huile à la place du beurre.

**Conservation** : 5 jours bien emballé ; congélation 3 mois.

**Allergènes** : gluten, œuf, lait

---

### DESS-010 — Fondant au chocolat

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : gâteau
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 22 min
- **Difficulté** : facile
- **Tags** : chocolat
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chocolat noir 70 % | 250 | g | base | non |
| Beurre doux | 180 | g | matière grasse | non |
| Œuf cru | 5 | u | structure | non |
| Sucre semoule | 140 | g | sucre | non |
| Farine de blé T55 | 60 | g | structure | non |
| Sel fin | 1 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Faire fondre chocolat et beurre doucement.
2. Fouetter œufs et sucre sans rechercher un fort foisonnement.
3. Incorporer le chocolat puis la farine et le sel.
4. Cuire 18 à 22 minutes à 175 °C selon le centre souhaité.
5. Refroidir au moins 20 minutes avant découpe.

**Techniques** : fusion douce, mélange, cuisson courte, repos.

**Variantes validables** : Cœur coulant en ramequins ; noisette.

**Conservation** : 4 jours au réfrigérateur ou 2 jours à température fraîche.

**Allergènes** : gluten, œuf, lait

---

### DESS-011 — Tarte au citron meringuée

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte sucrée
- **Portions** : 10
- **Temps** : préparation 60 min · cuisson 40 min
- **Difficulté** : difficile
- **Tags** : pâtisserie
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte sablée crue | 350 | g | fond | non |
| Citron jaune frais | 5 | u | crème | non |
| Œuf cru | 4 | u | crème | non |
| Jaune d'œuf cru | 2 | u | crème | non |
| Sucre semoule | 260 | g | crème et meringue | non |
| Beurre doux | 140 | g | crème | non |
| Blanc d'œuf cru | 4 | u | meringue | non |
| Fécule de maïs | 20 | g | liaison | non |

#### Étapes canoniques originales

1. Foncer et cuire le fond à blanc.
2. Cuire jus et zestes de citron avec œufs, jaunes, sucre et fécule jusqu’à épaississement.
3. Hors du feu, incorporer le beurre et verser dans le fond refroidi.
4. Monter les blancs avec le sucre en meringue ferme.
5. Pocher sur la tarte et colorer au chalumeau ou sous le gril.

**Techniques** : fonçage, cuisson à blanc, crème citron, émulsion au beurre, meringue, pochage.

**Variantes validables** : Meringue italienne plus stable ; tartelettes.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### FR-029 — Tarte thon, tomate et moutarde

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte salée
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : déjeuner, rapide
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 280 | g | fond | non |
| Thon au naturel en conserve, égoutté | 280 | g | protéine | non |
| Tomate fraîche mûre | 500 | g | garniture | non |
| Moutarde de Dijon | 35 | g | condiment | non |
| Œuf cru | 3 | u | appareil | non |
| Crème fraîche liquide entière | 200 | ml | appareil | non |
| Comté | 80 | g | gratinage | oui |
| Herbes de Provence séchées | 2 | g | aromate | non |
| Sel fin | 3 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Foncer la pâte et étaler la moutarde.
2. Égoutter soigneusement le thon et les tomates tranchées.
3. Répartir thon et tomates.
4. Verser l’appareil œufs-crème, ajouter herbes et fromage facultatif.
5. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : fonçage, égouttage, montage, appareil à crème prise, cuisson au four.

**Variantes validables** : Courgette ; tomate en conserve bien égouttée.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait, poisson, moutarde

---

### FR-030 — Clafoutis aux cerises

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : été, dessert fruité
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cerise fraîche dénoyautée | 700 | g | fruit | non |
| Œuf cru | 4 | u | appareil | non |
| Lait entier | 400 | ml | appareil | non |
| Crème fraîche liquide entière | 100 | ml | appareil | non |
| Farine de blé T55 | 100 | g | structure | non |
| Sucre semoule | 120 | g | sucre | non |
| Beurre doux | 20 | g | plat | non |
| Vanille liquide | 5 | ml | arôme | non |

#### Étapes canoniques originales

1. Beurrer le plat et répartir les cerises.
2. Mélanger œufs, sucre, farine, lait, crème et vanille.
3. Verser sur les fruits.
4. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : appareil liquide, cuisson au four.

**Variantes validables** : Prune ; poire ; abricot.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### FR-031 — Gougères au fromage

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : pâte à choux salée
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Tags** : apéritif, Bourgogne
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Eau | 250 | ml | panade | non |
| Beurre doux | 100 | g | panade | non |
| Farine de blé T55 | 150 | g | panade | non |
| Œuf cru | 4 | u | pâte | non |
| Comté | 130 | g | garniture | non |
| Sel fin | 3 | g | assaisonnement | non |
| Muscade moulue | 0.5 | g | épice | oui |

#### Étapes canoniques originales

1. Porter eau, beurre et sel à ébullition.
2. Ajouter la farine d’un coup et dessécher la panade.
3. Incorporer les œufs progressivement, puis le fromage.
4. Pocher sur plaque et cuire 22 à 25 minutes à 190 °C sans ouvrir le four au début.

**Techniques** : panade, dessiccation, incorporation des œufs, pochage, cuisson vapeur.

**Variantes validables** : Gruyère ; herbes ; congélation crue pochée.

**Conservation** : 2 jours ; réchauffer au four.

**Allergènes** : gluten, œuf, lait

---

### FR-032 — Tarte tatin aux pommes

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte sucrée
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 45 min
- **Difficulté** : moyenne
- **Tags** : dessert français
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme fraîche | 1200 | g | fruit | non |
| Pâte feuilletée crue | 300 | g | fond | non |
| Sucre semoule | 180 | g | caramel | non |
| Beurre doux | 100 | g | caramel | non |
| Vanille liquide | 5 | ml | arôme | oui |
| Sel fin | 1 | g | équilibre | non |

#### Étapes canoniques originales

1. Préparer un caramel blond directement dans le moule ou une poêle allant au four.
2. Ajouter beurre et sel, puis ranger les pommes serrées.
3. Cuire les pommes 15 minutes sur le feu ou au four pour les attendrir.
4. Couvrir de pâte feuilletée en rentrant les bords.
5. Cuire 30 minutes à 190 °C puis retourner encore chaude avec précaution.

**Techniques** : caramel, précuisson fruit, montage inversé, cuisson au four, démoulage.

**Variantes validables** : Poire ; coing ; endive salée distincte.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, lait

---

### FR-033 — Salade de lentilles, œuf mollet et moutarde

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : salade complète
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 30 min
- **Difficulté** : facile
- **Tags** : salade, protéines
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille verte sèche, crue | 300 | g | légumineuse | non |
| Œuf cru | 4 | u | protéine | non |
| Carotte crue | 150 | g | légume | non |
| Échalote crue | 60 | g | aromatique | non |
| Moutarde de Dijon | 20 | g | vinaigrette | non |
| Vinaigre de vin rouge | 30 | ml | vinaigrette | non |
| Huile de noix | 30 | ml | vinaigrette | non |
| Huile de colza raffinée | 30 | ml | vinaigrette | non |
| Persil frais | 15 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Cuire les lentilles avec la carotte jusqu’à tendreté, puis égoutter.
2. Cuire les œufs 6 minutes 30, les refroidir et les écaler.
3. Émulsionner moutarde, vinaigre et huiles.
4. Assaisonner les lentilles encore tièdes avec échalote et persil.
5. Servir avec les œufs mollets.

**Techniques** : mijotage, œuf mollet, émulsion, assaisonnement tiède.

**Variantes validables** : Lardons ; feta ; noix.

**Conservation** : 3 jours pour les lentilles ; œufs 2 jours.

**Allergènes** : œuf, moutarde, fruits à coque

---

### FR-034 — Poireaux vinaigrette

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : entrée
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : facile
- **Tags** : entrée française, végétarien
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poireau cru | 800 | g | légume | non |
| Moutarde de Dijon | 20 | g | vinaigrette | non |
| Vinaigre de vin rouge | 25 | ml | vinaigrette | non |
| Huile de colza raffinée | 50 | ml | vinaigrette | non |
| Œuf cru | 2 | u | garniture | oui |
| Persil frais | 10 | g | finition | non |
| Sel fin | 4 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Nettoyer les poireaux et les cuire à la vapeur jusqu’à tendreté.
2. Les égoutter et les presser légèrement.
3. Émulsionner moutarde, vinaigre et huile.
4. Napper les poireaux tièdes et ajouter éventuellement œufs durs hachés et persil.

**Techniques** : vapeur, égouttage, émulsion.

**Variantes validables** : Câpres ; noisettes ; œufs mimosa.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : œuf, moutarde

---

### FR-035 — Salade niçoise structurée

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : salade complète
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 15 min
- **Difficulté** : facile
- **Tags** : salade, été, poisson
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Thon au naturel en conserve, égoutté | 300 | g | protéine | non |
| Œuf cru | 4 | u | protéine | non |
| Tomate fraîche mûre | 500 | g | légume | non |
| Haricot vert cru | 300 | g | légume | non |
| Pomme de terre crue, avec peau | 500 | g | féculent | non |
| Olive noire dénoyautée | 100 | g | garniture | non |
| Anchois à l'huile, égoutté | 60 | g | garniture | oui |
| Oignon rouge cru | 80 | g | aromatique | non |
| Huile d'olive vierge extra | 50 | ml | vinaigrette | non |
| Vinaigre de vin rouge | 20 | ml | vinaigrette | non |
| Sel fin | 4 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Cuire pommes de terre, haricots et œufs séparément, puis refroidir.
2. Tailler tomates et oignon.
3. Assembler sans écraser : pommes de terre, haricots, tomate, thon, œufs, olives et anchois.
4. Assaisonner d’huile et vinaigre juste avant service.

**Techniques** : cuissons séparées, refroidissement, assemblage, vinaigrette.

**Variantes validables** : Version sans pomme de terre selon tradition revendiquée ; poivron cru.

**Conservation** : 1 jour au réfrigérateur.

**Allergènes** : œuf, poisson

---

### FR-036 — Tarte aux poireaux et lardons

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte salée
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : déjeuner, hiver
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 280 | g | fond | non |
| Poireau cru | 700 | g | garniture | non |
| Lardon fumé cru | 180 | g | protéine | non |
| Œuf cru | 3 | u | appareil | non |
| Crème fraîche liquide entière | 250 | ml | appareil | non |
| Beurre doux | 20 | g | cuisson | non |
| Muscade moulue | 0.5 | g | épice | non |
| Poivre noir moulu | 1 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Faire fondre longuement les poireaux au beurre.
2. Colorer légèrement les lardons et les égoutter.
3. Foncer la pâte et répartir poireaux et lardons.
4. Verser l’appareil œufs-crème-muscat.
5. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : fondue, fonçage, appareil à crème prise, cuisson au four.

**Variantes validables** : Saumon fumé ; chèvre ; sans lardons.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### FR-037 — Parmentier de canard

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat complet
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 40 min
- **Difficulté** : facile
- **Tags** : Sud-Ouest, batch-cooking
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Confit de canard cuit, effiloché | 700 | g | protéine | non |
| Pomme de terre crue, épluchée | 1200 | g | féculent | non |
| Lait entier | 220 | ml | purée | non |
| Beurre doux | 70 | g | purée | non |
| Échalote crue | 120 | g | aromatique | non |
| Persil frais | 15 | g | aromate | non |
| Chapelure de blé | 40 | g | gratinage | non |
| Sel fin | 4 | g | assaisonnement | oui |

#### Étapes canoniques originales

1. Réchauffer doucement le confit, retirer os et excès de graisse puis effilocher.
2. Faire suer les échalotes, ajouter le canard et le persil.
3. Préparer une purée souple.
4. Monter canard puis purée, parsemer de chapelure.
5. Cuire 25 minutes à 190 °C puis gratiner.

**Techniques** : effilochage, suer, purée, montage, gratinage.

**Variantes validables** : Patate douce ; champignons ; noisettes.

**Conservation** : 3 jours au réfrigérateur ; congélation 2 mois.

**Allergènes** : gluten, lait

---

### FR-038 — Lapin à la moutarde

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : plat mijoté
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 75 min
- **Difficulté** : facile
- **Tags** : tradition française
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lapin cru, découpé | 1400 | g | protéine | non |
| Moutarde de Dijon | 60 | g | sauce | non |
| Crème fraîche épaisse | 200 | g | sauce | non |
| Vin blanc sec | 250 | ml | braisage | non |
| Échalote crue | 150 | g | aromatique | non |
| Bouillon de volaille non salé | 250 | ml | braisage | non |
| Huile de colza raffinée | 25 | ml | saisie | non |
| Thym frais | 4 | g | aromate | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Étapes canoniques originales

1. Enduire légèrement le lapin de moutarde et le saisir sans brûler le condiment.
2. Faire suer les échalotes, déglacer au vin.
3. Ajouter bouillon, thym et lapin ; couvrir et mijoter 55 à 65 minutes.
4. Retirer le lapin, réduire la sauce puis incorporer crème et reste de moutarde.

**Techniques** : saisie douce, déglaçage, braisage, réduction, finition crème.

**Variantes validables** : Poulet ; estragon ; champignons.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : lait, moutarde

---

### FR-039 — Tarte aux pommes alsacienne

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : tarte sucrée
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : facile
- **Tags** : Alsace, dessert
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 300 | g | fond | non |
| Pomme fraîche | 900 | g | fruit | non |
| Œuf cru | 3 | u | appareil | non |
| Crème fraîche liquide entière | 250 | ml | appareil | non |
| Sucre semoule | 120 | g | appareil | non |
| Cannelle moulue | 2 | g | épice | non |
| Vanille liquide | 5 | ml | arôme | non |

#### Étapes canoniques originales

1. Foncer la pâte et disposer les pommes en lamelles.
2. Cuire 20 minutes à 180 °C.
3. Mélanger œufs, crème, sucre, vanille et cannelle.
4. Verser l’appareil et poursuivre 20 à 25 minutes.

**Techniques** : fonçage, précuisson fruit, appareil à crème prise, cuisson au four.

**Variantes validables** : Poire ; raisins secs ; poudre d’amande.

**Conservation** : 3 jours au réfrigérateur.

**Allergènes** : gluten, œuf, lait

---

### DESS-012 — Panna cotta vanille

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : dessert froid
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 5 min
- **Difficulté** : facile
- **Tags** : Italie, préparation à l'avance
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Crème fraîche liquide entière | 600 | ml | base | non |
| Sucre semoule | 80 | g | sucre | non |
| Gélatine feuille | 8 | g | gélifiant | non |
| Gousse de vanille | 1 | u | arôme | non |

#### Étapes canoniques originales

1. Réhydrater la gélatine dans l’eau froide.
2. Chauffer crème, sucre et vanille sans ébullition prolongée.
3. Hors du feu, incorporer la gélatine essorée.
4. Verser en verrines et réfrigérer au moins 5 heures.

**Techniques** : réhydratation, infusion, gélification, prise au froid.

**Variantes validables** : Coulis fruits rouges ; café ; agar-agar avec protocole distinct.

**Conservation** : 4 jours au réfrigérateur.

**Allergènes** : lait

---

### FR-040 — Madeleines au miel

- **Statut** : `candidate`
- **Confiance** : `B`
- **Catégorie** : petit gâteau
- **Portions** : 24
- **Temps** : préparation 25 min · cuisson 12 min
- **Difficulté** : moyenne
- **Tags** : goûter, pâtisserie
- **Sources de comparaison** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 220 | g | pâte | non |
| Œuf cru | 4 | u | pâte | non |
| Beurre doux | 180 | g | matière grasse | non |
| Sucre semoule | 130 | g | sucre | non |
| Miel | 50 | g | sucre et arôme | non |
| Levure chimique | 8 | g | levée | non |
| Zeste de citron | 5 | g | arôme | non |
| Sel fin | 1 | g | pâte | non |

#### Étapes canoniques originales

1. Fouetter œufs, sucre et miel, puis ajouter farine, levure et sel.
2. Incorporer le beurre noisette tiédi et le zeste.
3. Réfrigérer la pâte au moins 2 heures.
4. Cuire dans des moules froids à 220 °C 4 minutes puis 180 °C 6 à 8 minutes.

**Techniques** : beurre noisette, mélange, repos froid, choc thermique, cuisson au four.

**Variantes validables** : Orange ; chocolat ; vanille.

**Conservation** : 4 jours en boîte hermétique.

**Allergènes** : gluten, œuf, lait

---

## 5. Graphe formes alimentaires → recettes

Ce graphe peut alimenter directement la construction du F0/F1. Une forme très connectée donne davantage de couverture culinaire.

| Forme alimentaire | Degré | Recettes |
|---|---:|---|
| Sel fin | 63 | FR-001, FR-002, FR-003, FR-004, IT-001, FR-005, FR-006, FR-007, FR-008, FR-009, MAG-001, MX-001, FR-010, FR-011, VEG-001, VEG-002, EGG-001, VEG-003, IND-001, IND-002, MED-001, LEV-001, LEV-002, IT-002, IT-003, IT-004, IT-005, IT-006, IT-007, FR-012, FR-013, FR-014, IT-008, FR-015, FR-016, FR-017, FR-018, FR-019, GR-001, FR-020, FR-021, FR-022, DESS-001, DESS-002, DESS-003, DESS-005, DESS-007, DESS-008, FR-024, FR-025, FR-026, FR-027, DESS-009, DESS-010, FR-029, FR-031, FR-032, FR-033, FR-034, FR-035, FR-037, FR-038, FR-040 |
| Beurre doux | 33 | FR-002, FR-003, FR-004, IT-001, FR-006, FR-011, EGG-001, IT-002, FR-012, FR-013, FR-017, GR-001, FR-021, FR-022, FR-023, DESS-001, DESS-002, DESS-005, DESS-006, DESS-007, FR-024, FR-025, FR-026, FR-027, DESS-009, DESS-010, DESS-011, FR-030, FR-031, FR-032, FR-036, FR-037, FR-040 |
| Huile d'olive vierge extra | 27 | FR-004, IT-001, FR-007, FR-008, FR-009, MAG-001, FR-010, FR-011, VEG-001, VEG-002, VEG-003, MED-001, LEV-001, LEV-002, IT-002, IT-004, IT-005, IT-006, IT-007, FR-014, IT-008, FR-017, FR-019, GR-001, FR-020, FR-028, FR-035 |
| Œuf cru | 26 | FR-005, EGG-001, MED-001, IT-003, FR-019, GR-001, FR-020, DESS-001, DESS-002, DESS-003, DESS-004, DESS-005, DESS-006, FR-028, DESS-009, DESS-010, DESS-011, FR-029, FR-030, FR-031, FR-033, FR-034, FR-035, FR-036, FR-039, FR-040 |
| Oignon jaune cru | 25 | FR-001, FR-002, FR-003, FR-004, IT-001, FR-007, FR-008, MAG-001, MX-001, VEG-001, IND-001, IND-002, MED-001, LEV-002, IT-004, IT-006, FR-012, FR-013, FR-014, IT-008, FR-015, FR-016, FR-017, FR-019, GR-001 |
| Ail cru | 19 | FR-001, FR-006, FR-007, FR-008, MX-001, VEG-001, IND-001, IND-002, MED-001, LEV-001, LEV-002, IT-005, IT-006, FR-017, FR-019, GR-001, FR-020, FR-026, FR-027 |
| Poivre noir moulu | 19 | FR-001, FR-003, FR-004, IT-001, FR-005, FR-006, FR-007, FR-009, FR-010, FR-011, VEG-002, EGG-001, FR-012, FR-013, FR-017, FR-018, FR-021, FR-028, FR-036 |
| Farine de blé T55 | 18 | FR-001, FR-002, IT-001, FR-012, FR-016, GR-001, FR-022, DESS-001, DESS-002, DESS-003, DESS-007, FR-024, FR-028, DESS-009, DESS-010, FR-030, FR-031, FR-040 |
| Sucre semoule | 14 | DESS-001, DESS-002, DESS-003, DESS-004, DESS-005, DESS-006, DESS-008, DESS-010, DESS-011, FR-030, FR-032, FR-039, DESS-012, FR-040 |
| Carotte crue | 13 | FR-001, FR-002, FR-004, IT-001, MAG-001, FR-010, VEG-001, VEG-003, IT-004, IT-008, FR-015, FR-016, FR-033 |
| Persil frais | 13 | FR-011, VEG-002, EGG-001, VEG-003, MED-001, LEV-002, IT-002, FR-019, FR-026, FR-027, FR-033, FR-034, FR-037 |
| Tomate concassée en conserve | 12 | IT-001, FR-008, MAG-001, MX-001, IND-001, IND-002, MED-001, IT-004, IT-006, IT-008, FR-019, GR-001 |
| Crème fraîche liquide entière | 11 | FR-005, FR-006, FR-013, FR-014, FR-020, DESS-006, FR-029, FR-030, FR-036, FR-039, DESS-012 |
| Huile de colza raffinée | 11 | FR-001, MX-001, IND-001, IND-002, FR-016, FR-018, DESS-003, FR-027, FR-033, FR-034, FR-038 |
| Muscade moulue | 11 | FR-004, IT-001, FR-005, FR-006, FR-014, FR-020, FR-022, FR-024, FR-025, FR-031, FR-036 |
| Lait demi-écrémé | 9 | FR-004, IT-001, FR-005, FR-019, FR-022, DESS-001, DESS-002, FR-024, FR-028 |
| Moutarde de Dijon | 9 | FR-003, FR-009, FR-018, FR-021, FR-023, FR-029, FR-033, FR-034, FR-038 |
| Comté | 7 | FR-012, FR-020, FR-022, FR-023, FR-028, FR-029, FR-031 |
| Cumin moulu | 7 | MX-001, VEG-002, VEG-003, IND-001, MED-001, LEV-001, LEV-002 |
| Jus de citron frais | 7 | VEG-002, VEG-003, IND-001, IND-002, LEV-001, FR-021, DESS-007 |
| Lait entier | 7 | FR-006, GR-001, DESS-006, DESS-008, FR-025, FR-030, FR-037 |
| Parmesan affiné | 7 | IT-001, IT-002, IT-004, IT-005, IT-008, FR-019, GR-001 |
| Poireau cru | 7 | FR-002, FR-010, IT-008, FR-015, FR-021, FR-034, FR-036 |
| Champignon de Paris frais | 6 | FR-001, FR-002, FR-009, IT-002, FR-013, FR-016 |
| Courgette fraîche | 6 | FR-007, MAG-001, FR-010, VEG-003, IT-008, FR-020 |
| Pomme de terre crue, épluchée | 6 | FR-004, FR-006, FR-013, FR-014, FR-025, FR-037 |
| Thym frais | 6 | FR-007, FR-008, FR-013, FR-017, FR-018, FR-038 |
| Vin blanc sec | 6 | FR-008, FR-009, IT-002, FR-012, FR-018, FR-038 |
| Échalote crue | 6 | FR-009, IT-002, FR-018, FR-033, FR-037, FR-038 |
| Citron jaune frais | 5 | FR-002, FR-010, FR-011, FR-017, DESS-011 |
| Crème fraîche épaisse | 5 | FR-002, FR-009, FR-018, FR-021, FR-038 |
| Céleri branche cru | 5 | IT-001, VEG-001, IT-004, IT-008, FR-015 |
| Levure chimique | 5 | DESS-002, DESS-003, FR-028, DESS-009, FR-040 |
| Poivron rouge frais | 5 | FR-007, FR-008, MX-001, VEG-003, MED-001 |
| Pâte brisée crue | 5 | FR-005, DESS-006, FR-029, FR-036, FR-039 |
| Vin rouge sec | 5 | FR-001, IT-001, IT-004, FR-016, GR-001 |
| Basilic frais | 4 | IT-005, IT-006, IT-007, IT-008 |
| Bouillon de légumes non salé | 4 | IT-002, FR-013, FR-014, IT-008 |
| Bouquet garni frais | 4 | FR-001, FR-002, FR-015, FR-016 |
| Bœuf haché cru 15 % MG | 4 | IT-001, MX-001, IT-004, FR-019 |
| Cannelle moulue | 4 | GR-001, DESS-007, DESS-009, FR-039 |
| Jaune d'œuf cru | 4 | FR-002, IT-003, DESS-006, DESS-011 |
| Lardon fumé cru | 4 | FR-001, FR-005, FR-016, FR-036 |
| Pois chiche cuit, égoutté | 4 | MAG-001, VEG-002, IND-001, LEV-001 |
| Tomate fraîche mûre | 4 | FR-007, VEG-002, FR-029, FR-035 |
| Vanille liquide | 4 | DESS-003, FR-030, FR-032, FR-039 |
| Vinaigre de vin rouge | 4 | VEG-001, FR-033, FR-034, FR-035 |
| Bouillon de bœuf non salé | 3 | FR-004, MX-001, FR-012 |
| Cassonade | 3 | FR-003, DESS-007, DESS-009 |
| Chapelure de blé | 3 | FR-004, FR-019, FR-037 |
| Cuisse de poulet crue, avec os, avec peau | 3 | FR-008, MAG-001, FR-016 |
| Feuille de laurier séchée | 3 | FR-003, FR-007, VEG-001 |
| Gousse de vanille | 3 | DESS-006, DESS-008, DESS-012 |
| Haricot vert cru | 3 | FR-011, FR-026, FR-035 |
| Jambon blanc cuit | 3 | FR-022, FR-023, FR-028 |
| Oignon rouge cru | 3 | VEG-002, VEG-003, FR-035 |
| Paleron de bœuf cru, paré | 3 | FR-001, FR-003, FR-015 |
| Pomme de terre crue, avec peau | 3 | FR-017, FR-027, FR-035 |
| Pomme fraîche | 3 | DESS-007, FR-032, FR-039 |
| Thym séché | 3 | FR-003, VEG-001, FR-012 |
| Aubergine fraîche | 2 | FR-007, GR-001 |
| Bicarbonate de sodium alimentaire | 2 | LEV-002, DESS-009 |
| Bouillon de volaille non salé | 2 | FR-002, FR-038 |
| Chocolat noir 70 % | 2 | DESS-005, DESS-010 |
| Curcuma moulu | 2 | IND-001, IND-002 |
| Eau | 2 | IT-007, FR-031 |
| Fécule de maïs | 2 | DESS-006, DESS-011 |
| Gingembre frais | 2 | IND-001, IND-002 |
| Lait de coco | 2 | IND-001, IND-002 |
| Lentille verte sèche, crue | 2 | VEG-001, FR-033 |
| Mozzarella | 2 | IT-006, IT-007 |
| Navet cru | 2 | MAG-001, FR-015 |
| Oignon grelot cru | 2 | FR-001, FR-016 |
| Paprika fumé | 2 | MX-001, MED-001 |
| Piment en poudre | 2 | MX-001, MED-001 |
| Poivre blanc moulu | 2 | FR-002, FR-024 |
| Spaghetti secs | 2 | IT-003, IT-004 |
| Thon au naturel en conserve, égoutté | 2 | FR-029, FR-035 |
| Agneau haché cru | 1 | GR-001 |
| Anchois à l'huile, égoutté | 1 | FR-035 |
| Aneth frais | 1 | FR-010 |
| Banane mûre | 1 | DESS-009 |
| Biscuit cuillère | 1 | DESS-004 |
| Bière brune belge | 1 | FR-003 |
| Blanc d'œuf cru | 1 | DESS-011 |
| Béchamel préparée | 1 | FR-023 |
| Bœuf cuit effiloché | 1 | FR-004 |
| Cacao non sucré | 1 | DESS-004 |
| Café expresso refroidi | 1 | DESS-004 |
| Cerise fraîche dénoyautée | 1 | FR-030 |
| Ciboulette fraîche | 1 | EGG-001 |
| Clou de girofle | 1 | FR-015 |
| Concombre frais | 1 | VEG-002 |
| Confit de canard cuit, effiloché | 1 | FR-037 |
| Coriandre fraîche | 1 | LEV-002 |
| Coriandre moulue | 1 | LEV-002 |
| Cumin en graines | 1 | IND-002 |
| Curry en poudre | 1 | IND-001 |
| Dos de cabillaud cru | 1 | FR-011 |
| Eau glacée | 1 | LEV-001 |
| Endive fraîche | 1 | FR-022 |
| Estragon frais | 1 | FR-009 |
| Farine de blé type 00 | 1 | IT-007 |
| Feuille de lasagne sèche | 1 | IT-001 |
| Filet mignon de porc cru | 1 | FR-018 |
| Garam masala | 1 | IND-002 |
| Gnocchi de pomme de terre frais | 1 | IT-006 |
| Guanciale cru | 1 | IT-003 |
| Gélatine feuille | 1 | DESS-012 |
| Haricot blanc cuit, égoutté | 1 | IT-008 |
| Haricot rouge cuit, égoutté | 1 | MX-001 |
| Harissa | 1 | MAG-001 |
| Haut de cuisse de poulet cru, désossé, sans peau | 1 | FR-009 |
| Herbes de Provence séchées | 1 | FR-029 |
| Huile de noix | 1 | FR-033 |
| Jambon de Bayonne | 1 | FR-008 |
| Jarret de bœuf cru, avec os | 1 | FR-015 |
| Lapin cru, découpé | 1 | FR-038 |
| Lentille corail sèche, crue | 1 | IND-002 |
| Levure boulangère sèche | 1 | IT-007 |
| Marsala | 1 | DESS-004 |
| Mascarpone | 1 | DESS-004 |
| Merguez crue | 1 | MAG-001 |
| Miel | 1 | FR-040 |
| Olive noire dénoyautée | 1 | FR-035 |
| Olive verte dénoyautée | 1 | FR-028 |
| Origan séché | 1 | MX-001 |
| Os à moelle de bœuf | 1 | FR-015 |
| Pain d'épices | 1 | FR-003 |
| Pain de campagne | 1 | FR-012 |
| Pain de mie | 1 | FR-023 |
| Pavé de saumon cru, sans peau | 1 | FR-010 |
| Pecorino romano | 1 | IT-003 |
| Petites pâtes sèches | 1 | IT-008 |
| Pignon de pin | 1 | IT-005 |
| Piment d'Espelette moulu | 1 | FR-008 |
| Pois chiche sec, cru | 1 | LEV-002 |
| Poivre noir en grains | 1 | IT-003 |
| Poivron jaune frais | 1 | FR-007 |
| Poivron vert frais | 1 | FR-008 |
| Porc haché cru | 1 | IT-001 |
| Potimarron frais, épépiné | 1 | FR-014 |
| Poulet entier cru, prêt à cuire | 1 | FR-017 |
| Pâte feuilletée crue | 1 | FR-032 |
| Pâte sablée crue | 1 | DESS-011 |
| Pâtes sèches courtes | 1 | IT-005 |
| Quinoa cru | 1 | VEG-003 |
| Ras el-hanout | 1 | MAG-001 |
| Rhum ambré | 1 | DESS-001 |
| Riz arborio cru | 1 | IT-002 |
| Riz long blanc cru | 1 | FR-011 |
| Riz rond blanc cru | 1 | DESS-008 |
| Semoule de blé dur moyenne sèche | 1 | MAG-001 |
| Tahini | 1 | LEV-001 |
| Tomate entière pelée en conserve | 1 | IT-007 |
| Vinaigre de cidre | 1 | FR-003 |
| Yaourt nature | 1 | DESS-003 |
| Zeste de citron | 1 | FR-040 |
| Épaule de veau crue, en cubes | 1 | FR-002 |
| Épinard frais | 1 | IND-001 |

## 6. Graphe techniques → recettes

| Technique | Degré | Recettes |
|---|---:|---|
| cuisson au four | 14 | FR-005, LEV-002, FR-023, DESS-003, DESS-006, DESS-007, FR-028, DESS-009, FR-029, FR-030, FR-032, FR-036, FR-039, FR-040 |
| mijotage | 14 | IT-001, FR-007, FR-008, FR-009, MX-001, VEG-001, IND-001, IND-002, MED-001, IT-004, IT-006, FR-012, FR-019, FR-033 |
| déglaçage | 13 | FR-001, FR-003, IT-001, FR-008, FR-009, IT-002, IT-004, FR-012, FR-016, FR-017, FR-018, GR-001, FR-038 |
| saisie | 12 | FR-001, FR-003, IT-001, FR-008, FR-009, MAG-001, MX-001, IT-004, FR-016, FR-018, FR-019, GR-001 |
| réduction | 10 | FR-001, FR-004, FR-008, FR-009, MX-001, FR-016, FR-018, GR-001, FR-021, FR-038 |
| suer | 10 | FR-004, FR-008, VEG-001, IND-001, MED-001, IT-006, FR-013, FR-014, IT-008, FR-037 |
| gratinage | 9 | FR-004, IT-001, IT-006, FR-012, GR-001, FR-020, FR-022, FR-023, FR-037 |
| montage | 7 | IT-001, GR-001, FR-022, FR-023, DESS-004, FR-029, FR-037 |
| fonçage | 6 | FR-005, DESS-006, DESS-011, FR-029, FR-036, FR-039 |
| repos | 6 | FR-006, LEV-002, FR-017, DESS-001, DESS-002, DESS-010 |
| émulsion | 6 | VEG-002, LEV-001, IT-005, FR-025, FR-033, FR-034 |
| appareil à crème prise | 5 | FR-005, FR-020, FR-029, FR-036, FR-039 |
| mélange | 5 | DESS-001, DESS-003, FR-028, DESS-010, FR-040 |
| braisage | 4 | FR-001, FR-003, FR-016, FR-038 |
| pochage | 4 | FR-002, IT-006, DESS-011, FR-031 |
| tempérage | 4 | FR-002, IT-003, DESS-005, DESS-006 |
| égouttage | 4 | VEG-002, FR-022, FR-029, FR-034 |
| blanchiment | 3 | FR-011, DESS-008, FR-026 |
| cuisson al dente | 3 | IT-003, IT-004, IT-005 |
| cuisson à la poêle | 3 | EGG-001, DESS-001, DESS-002 |
| dessiccation | 3 | FR-004, FR-025, FR-031 |
| façonnage | 3 | LEV-002, IT-007, FR-019 |
| prise au froid | 3 | DESS-005, DESS-006, DESS-012 |
| rinçage | 3 | VEG-003, IND-002, FR-027 |
| rôtissage | 3 | VEG-003, FR-017, GR-001 |
| taillage | 3 | FR-007, VEG-002, DESS-007 |
| béchamel | 2 | GR-001, FR-022 |
| contrôle température | 2 | FR-010, FR-017 |
| cuisson au bouillon | 2 | FR-013, FR-014 |
| cuisson par absorption | 2 | FR-011, VEG-003 |
| cuisson à l'eau | 2 | FR-004, FR-025 |
| cuissons séparées | 2 | FR-007, FR-035 |
| finition crème | 2 | FR-013, FR-038 |
| fusion douce | 2 | DESS-005, DESS-010 |
| garniture séparée | 2 | FR-001, FR-016 |
| infusion | 2 | DESS-006, DESS-012 |
| mijotage séquencé | 2 | MAG-001, IT-008 |
| mixage | 2 | FR-013, FR-014 |
| mélange limité | 2 | DESS-002, DESS-009 |
| panade | 2 | FR-019, FR-031 |
| poêlage | 2 | IT-002, FR-020 |
| précuisson | 2 | FR-010, FR-027 |
| précuisson fruit | 2 | FR-032, FR-039 |
| purée | 2 | FR-004, FR-037 |
| repos froid | 2 | DESS-004, FR-040 |
| roux blanc | 2 | FR-002, FR-024 |
| saisie douce | 2 | FR-011, FR-038 |
| sauter | 2 | FR-026, FR-027 |
| soffritto | 2 | IT-001, IT-004 |
| torréfaction des épices | 2 | MX-001, IND-001 |
| vapeur | 2 | FR-022, FR-034 |
| écrasement | 2 | FR-025, DESS-009 |
| écumage | 2 | FR-002, FR-015 |
| égrenage | 2 | MAG-001, VEG-003 |
| émulsion au beurre | 2 | FR-011, DESS-011 |
| évaporation | 2 | FR-009, FR-020 |
| acidification | 1 | VEG-001 |
| ajustement de texture | 1 | LEV-001 |
| appareil liquide | 1 | FR-030 |
| arrosage | 1 | FR-017 |
| assaisonnement tardif | 1 | VEG-001 |
| assaisonnement tiède | 1 | FR-033 |
| assemblage | 1 | FR-035 |
| battage | 1 | EGG-001 |
| beurre noisette | 1 | FR-040 |
| beurre persillé | 1 | FR-026 |
| caramel | 1 | FR-032 |
| caramélisation des oignons | 1 | FR-003 |
| caramélisation lente | 1 | FR-012 |
| choc thermique | 1 | FR-040 |
| coagulation contrôlée | 1 | EGG-001 |
| coloration | 1 | FR-013 |
| compotage | 1 | FR-007 |
| crème citron | 1 | DESS-011 |
| cuisson contrôlée | 1 | FR-018 |
| cuisson courte | 1 | DESS-010 |
| cuisson couverte | 1 | FR-011 |
| cuisson crème | 1 | DESS-006 |
| cuisson de sauce | 1 | FR-024 |
| cuisson des pâtes dans le bouillon | 1 | IT-008 |
| cuisson en papillote | 1 | FR-010 |
| cuisson haute température | 1 | IT-007 |
| cuisson lente au four | 1 | FR-006 |
| cuisson lente au lait | 1 | DESS-008 |
| cuisson par mouillage progressif | 1 | IT-002 |
| cuisson séquencée | 1 | FR-015 |
| cuisson vapeur | 1 | FR-031 |
| cuisson à blanc | 1 | DESS-011 |
| dégorgement | 1 | GR-001 |
| démoulage | 1 | FR-032 |
| départ à froid | 1 | FR-015 |
| effilochage | 1 | FR-037 |
| fermentation | 1 | IT-007 |
| finition aromatique | 1 | FR-027 |
| foisonnement | 1 | DESS-004 |
| foisonnement léger | 1 | DESS-003 |
| fondue | 1 | FR-036 |
| grillade | 1 | MAG-001 |
| gélification | 1 | DESS-012 |
| hachage | 1 | LEV-002 |
| hydratation | 1 | MAG-001 |
| imbibage | 1 | DESS-004 |
| incorporation | 1 | DESS-005 |
| incorporation de garniture | 1 | FR-028 |
| incorporation des œufs | 1 | FR-031 |
| incorporation délicate | 1 | DESS-004 |
| julienne | 1 | FR-010 |
| lavage | 1 | FR-021 |
| liaison au pain | 1 | FR-003 |
| liaison aux jaunes | 1 | FR-002 |
| liaison par amidon | 1 | IND-002 |
| liaison à l'eau de cuisson | 1 | IT-005 |
| mantecatura | 1 | IT-002 |
| marinade courte | 1 | VEG-002 |
| meringue | 1 | DESS-011 |
| mixage fin | 1 | LEV-001 |
| montage des blancs | 1 | DESS-005 |
| montage inversé | 1 | FR-032 |
| mouillage progressif | 1 | FR-024 |
| nacrage | 1 | IT-002 |
| parage | 1 | FR-018 |
| pilonnage | 1 | IT-005 |
| pliage | 1 | EGG-001 |
| pochage long | 1 | FR-015 |
| précuisson dans le lait | 1 | FR-006 |
| précuisson de garniture | 1 | FR-005 |
| pétrissage | 1 | IT-007 |
| rafraîchissement | 1 | FR-026 |
| refroidissement | 1 | FR-035 |
| remuage | 1 | DESS-008 |
| rendu de graisse | 1 | IT-003 |
| roux | 1 | IT-001 |
| réhydratation | 1 | DESS-012 |
| sablage | 1 | DESS-007 |
| salage anticipé | 1 | FR-017 |
| taillage régulier | 1 | FR-006 |
| tombée | 1 | FR-021 |
| tombée des épinards | 1 | IND-001 |
| torréfaction | 1 | IND-002 |
| trempage | 1 | LEV-002 |
| vinaigrette | 1 | FR-035 |
| émulsion hors feu | 1 | IT-003 |
| étuvée | 1 | FR-021 |
| œuf mollet | 1 | FR-033 |
| œufs pochés en sauce | 1 | MED-001 |

## 7. Ordre recommandé de création des formes

Les formes suivantes sont classées par degré de connexion décroissant. L'intégrateur doit commencer par elles, puis compléter les formes spécialisées.

1. **Sel fin** — 63 recette(s)
2. **Beurre doux** — 33 recette(s)
3. **Huile d'olive vierge extra** — 27 recette(s)
4. **Œuf cru** — 26 recette(s)
5. **Oignon jaune cru** — 25 recette(s)
6. **Ail cru** — 19 recette(s)
7. **Poivre noir moulu** — 19 recette(s)
8. **Farine de blé T55** — 18 recette(s)
9. **Sucre semoule** — 14 recette(s)
10. **Carotte crue** — 13 recette(s)
11. **Persil frais** — 13 recette(s)
12. **Tomate concassée en conserve** — 12 recette(s)
13. **Crème fraîche liquide entière** — 11 recette(s)
14. **Huile de colza raffinée** — 11 recette(s)
15. **Muscade moulue** — 11 recette(s)
16. **Lait demi-écrémé** — 9 recette(s)
17. **Moutarde de Dijon** — 9 recette(s)
18. **Comté** — 7 recette(s)
19. **Cumin moulu** — 7 recette(s)
20. **Jus de citron frais** — 7 recette(s)
21. **Lait entier** — 7 recette(s)
22. **Parmesan affiné** — 7 recette(s)
23. **Poireau cru** — 7 recette(s)
24. **Champignon de Paris frais** — 6 recette(s)
25. **Courgette fraîche** — 6 recette(s)
26. **Pomme de terre crue, épluchée** — 6 recette(s)
27. **Thym frais** — 6 recette(s)
28. **Vin blanc sec** — 6 recette(s)
29. **Échalote crue** — 6 recette(s)
30. **Citron jaune frais** — 5 recette(s)
31. **Crème fraîche épaisse** — 5 recette(s)
32. **Céleri branche cru** — 5 recette(s)
33. **Levure chimique** — 5 recette(s)
34. **Poivron rouge frais** — 5 recette(s)
35. **Pâte brisée crue** — 5 recette(s)
36. **Vin rouge sec** — 5 recette(s)
37. **Basilic frais** — 4 recette(s)
38. **Bouillon de légumes non salé** — 4 recette(s)
39. **Bouquet garni frais** — 4 recette(s)
40. **Bœuf haché cru 15 % MG** — 4 recette(s)
41. **Cannelle moulue** — 4 recette(s)
42. **Jaune d'œuf cru** — 4 recette(s)
43. **Lardon fumé cru** — 4 recette(s)
44. **Pois chiche cuit, égoutté** — 4 recette(s)
45. **Tomate fraîche mûre** — 4 recette(s)
46. **Vanille liquide** — 4 recette(s)
47. **Vinaigre de vin rouge** — 4 recette(s)
48. **Bouillon de bœuf non salé** — 3 recette(s)
49. **Cassonade** — 3 recette(s)
50. **Chapelure de blé** — 3 recette(s)
51. **Cuisse de poulet crue, avec os, avec peau** — 3 recette(s)
52. **Feuille de laurier séchée** — 3 recette(s)
53. **Gousse de vanille** — 3 recette(s)
54. **Haricot vert cru** — 3 recette(s)
55. **Jambon blanc cuit** — 3 recette(s)
56. **Oignon rouge cru** — 3 recette(s)
57. **Paleron de bœuf cru, paré** — 3 recette(s)
58. **Pomme de terre crue, avec peau** — 3 recette(s)
59. **Pomme fraîche** — 3 recette(s)
60. **Thym séché** — 3 recette(s)
61. **Aubergine fraîche** — 2 recette(s)
62. **Bicarbonate de sodium alimentaire** — 2 recette(s)
63. **Bouillon de volaille non salé** — 2 recette(s)
64. **Chocolat noir 70 %** — 2 recette(s)
65. **Curcuma moulu** — 2 recette(s)
66. **Eau** — 2 recette(s)
67. **Fécule de maïs** — 2 recette(s)
68. **Gingembre frais** — 2 recette(s)
69. **Lait de coco** — 2 recette(s)
70. **Lentille verte sèche, crue** — 2 recette(s)
71. **Mozzarella** — 2 recette(s)
72. **Navet cru** — 2 recette(s)
73. **Oignon grelot cru** — 2 recette(s)
74. **Paprika fumé** — 2 recette(s)
75. **Piment en poudre** — 2 recette(s)
76. **Poivre blanc moulu** — 2 recette(s)
77. **Spaghetti secs** — 2 recette(s)
78. **Thon au naturel en conserve, égoutté** — 2 recette(s)
79. **Agneau haché cru** — 1 recette(s)
80. **Anchois à l'huile, égoutté** — 1 recette(s)
81. **Aneth frais** — 1 recette(s)
82. **Banane mûre** — 1 recette(s)
83. **Biscuit cuillère** — 1 recette(s)
84. **Bière brune belge** — 1 recette(s)
85. **Blanc d'œuf cru** — 1 recette(s)
86. **Béchamel préparée** — 1 recette(s)
87. **Bœuf cuit effiloché** — 1 recette(s)
88. **Cacao non sucré** — 1 recette(s)
89. **Café expresso refroidi** — 1 recette(s)
90. **Cerise fraîche dénoyautée** — 1 recette(s)
91. **Ciboulette fraîche** — 1 recette(s)
92. **Clou de girofle** — 1 recette(s)
93. **Concombre frais** — 1 recette(s)
94. **Confit de canard cuit, effiloché** — 1 recette(s)
95. **Coriandre fraîche** — 1 recette(s)
96. **Coriandre moulue** — 1 recette(s)
97. **Cumin en graines** — 1 recette(s)
98. **Curry en poudre** — 1 recette(s)
99. **Dos de cabillaud cru** — 1 recette(s)
100. **Eau glacée** — 1 recette(s)
101. **Endive fraîche** — 1 recette(s)
102. **Estragon frais** — 1 recette(s)
103. **Farine de blé type 00** — 1 recette(s)
104. **Feuille de lasagne sèche** — 1 recette(s)
105. **Filet mignon de porc cru** — 1 recette(s)
106. **Garam masala** — 1 recette(s)
107. **Gnocchi de pomme de terre frais** — 1 recette(s)
108. **Guanciale cru** — 1 recette(s)
109. **Gélatine feuille** — 1 recette(s)
110. **Haricot blanc cuit, égoutté** — 1 recette(s)
111. **Haricot rouge cuit, égoutté** — 1 recette(s)
112. **Harissa** — 1 recette(s)
113. **Haut de cuisse de poulet cru, désossé, sans peau** — 1 recette(s)
114. **Herbes de Provence séchées** — 1 recette(s)
115. **Huile de noix** — 1 recette(s)
116. **Jambon de Bayonne** — 1 recette(s)
117. **Jarret de bœuf cru, avec os** — 1 recette(s)
118. **Lapin cru, découpé** — 1 recette(s)
119. **Lentille corail sèche, crue** — 1 recette(s)
120. **Levure boulangère sèche** — 1 recette(s)
121. **Marsala** — 1 recette(s)
122. **Mascarpone** — 1 recette(s)
123. **Merguez crue** — 1 recette(s)
124. **Miel** — 1 recette(s)
125. **Olive noire dénoyautée** — 1 recette(s)
126. **Olive verte dénoyautée** — 1 recette(s)
127. **Origan séché** — 1 recette(s)
128. **Os à moelle de bœuf** — 1 recette(s)
129. **Pain d'épices** — 1 recette(s)
130. **Pain de campagne** — 1 recette(s)
131. **Pain de mie** — 1 recette(s)
132. **Pavé de saumon cru, sans peau** — 1 recette(s)
133. **Pecorino romano** — 1 recette(s)
134. **Petites pâtes sèches** — 1 recette(s)
135. **Pignon de pin** — 1 recette(s)
136. **Piment d'Espelette moulu** — 1 recette(s)
137. **Pois chiche sec, cru** — 1 recette(s)
138. **Poivre noir en grains** — 1 recette(s)
139. **Poivron jaune frais** — 1 recette(s)
140. **Poivron vert frais** — 1 recette(s)
141. **Porc haché cru** — 1 recette(s)
142. **Potimarron frais, épépiné** — 1 recette(s)
143. **Poulet entier cru, prêt à cuire** — 1 recette(s)
144. **Pâte feuilletée crue** — 1 recette(s)
145. **Pâte sablée crue** — 1 recette(s)
146. **Pâtes sèches courtes** — 1 recette(s)
147. **Quinoa cru** — 1 recette(s)
148. **Ras el-hanout** — 1 recette(s)
149. **Rhum ambré** — 1 recette(s)
150. **Riz arborio cru** — 1 recette(s)
151. **Riz long blanc cru** — 1 recette(s)
152. **Riz rond blanc cru** — 1 recette(s)
153. **Semoule de blé dur moyenne sèche** — 1 recette(s)
154. **Tahini** — 1 recette(s)
155. **Tomate entière pelée en conserve** — 1 recette(s)
156. **Vinaigre de cidre** — 1 recette(s)
157. **Yaourt nature** — 1 recette(s)
158. **Zeste de citron** — 1 recette(s)
159. **Épaule de veau crue, en cubes** — 1 recette(s)
160. **Épinard frais** — 1 recette(s)

## 8. Contrat de transformation en base

Pour chaque recette :

1. créer ou retrouver `culinary.recipe_families` par identifiant stable ;
2. créer une `recipe_version` candidate avec hash du contenu complet ;
3. créer les composants et exigences d'ingrédients ;
4. résoudre uniquement par égalité exacte sur `food_forms.canonical_name_normalized` ;
5. créer une `quality.review_task` pour toute forme absente, conversion absente ou ambiguïté ;
6. créer les branches pour toutes les variantes qui modifient quantité, rendement, durée ou température ;
7. calculer la nutrition de façon déterministe ;
8. interdire la publication tant qu'un ingrédient requis n'est pas résolu ou qu'une tâche bloquante est ouverte.

## 9. Export JSON minimal dérivable

Le document Markdown est la source humaine. L'intégrateur peut parser les tableaux ou, de préférence, convertir les objets suivants en JSON/SQL à partir de la structure de ce fichier.

```json
{
  "corpus_version": "scraped-v1",
  "recipe_count": 72,
  "food_form_count": 160,
  "technique_count": 145,
  "publication_status": "candidate",
  "minimum_confidence": "B"
}
```

## 10. Limites explicites

- Ce corpus couvre un noyau domestique large mais ne représente pas toutes les cuisines du monde.
- Les pages commerciales consultées sont protégées : seules les données factuelles, les familles et les idées techniques ont été utilisées ; la rédaction Myko est originale.
- La validation sanitaire, allergénique et nutritionnelle reste déterministe et indépendante des sites culinaires.
- Une recette ne passe à `A` qu'après revue ; `A+` exige un test en cuisine.

## 11. Critère de réussite pour l'IA d'intégration

Le travail est terminé lorsque les 50 familles sont chargées comme candidates, que toutes les formes requises sont soit résolues soit accompagnées d'une tâche de revue, que le graphe est reproductible, et qu'aucune recette tierce n'a été copiée textuellement.