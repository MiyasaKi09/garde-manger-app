# MYKO — Corpus culinaire canonique V3

## 302 recettes réelles avec identité et empreinte sensorielle

- **Recettes totales** : 302
- **Recettes V1 reprises et enrichies** : 72
- **Nouveaux plats réels ajoutés** : 230
- **Formes alimentaires connectées** : 727
- **Techniques connectées** : 351
- **Familles aromatiques connectées** : 328

> Ce fichier remplace le corpus V2 matriciel de 500 compositions, qui ne doit pas être intégré. Ici, une entrée représente soit un plat nommé attesté, soit — uniquement pour quelques recettes V1 conservées — un standard domestique explicitement marqué. Aucune nouvelle entrée n’est construite par simple combinaison « protéine + féculent + légume ».

## 1. Contrat sensoriel obligatoire

Chaque recette porte désormais :

- cinq goûts : sucré, salé, acide, amer, umami sur 0–5 ;
- chaleur pimentée et pungence sur 0–5 ;
- richesse, fraîcheur et intensité sur 0–5 ;
- saveurs dominantes ;
- familles aromatiques ;
- textures cibles ;
- ingrédients signatures ;
- garde-fous d’identité et dérives interdites.

Une substitution ne peut être acceptée sur la seule équivalence nutritionnelle. Elle doit préserver ou compenser le profil sensoriel, la texture et l’identité du plat.

## 2. Niveaux d’identité

| Niveau | Signification |
|---|---|
| `named_traditional_dish` | Plat nommé, culturellement identifiable, avec ingrédients et technique signatures. |
| `domestic_standard` | Recette domestique réelle et utile, sans prétention à une identité patrimoniale précise. |
| `candidate B` | Structure suffisamment documentée pour intégration candidate, mais non publiée avant revue. |

## 3. Sources de sélection et de comparaison

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

### Sources complémentaires du V3

| Code | URL | Usage |
|---|---|---|
| `serious_spanish` | https://www.seriouseats.com/spanish-recipes-12012851 | plats espagnols nommés et techniques signatures |
| `serious_chinese` | https://www.seriouseats.com/chinese-food-recipes-8558073 | plats chinois régionaux et populaires |
| `serious_chinese_comfort` | https://www.seriouseats.com/chinese-comfort-food-recipes-11984444 | profils de sauces, nouilles et textures chinoises |
| `serious_global` | https://www.seriouseats.com/easy-global-dinner-recipes-11954334 | plats mondiaux identifiables et sous-représentés |
| `serious_mexican` | https://www.seriouseats.com/mexican-taco-picnic-menu | tacos, carnitas, salsas et maïs |
| `serious_dashi` | https://www.seriouseats.com/dashi-japanese-stock | rôle du dashi dans les plats japonais |
| `allrecipes_world` | https://www.allrecipes.com/gallery/complete-menus-celebrate-world-cuisines/ | menus et plats internationaux populaires |
| `allrecipes_world2` | https://www.allrecipes.com/gallery/best-menus-of-world-cuisines/ | menus marocains, éthiopiens, japonais, coréens, grecs et européens |
| `epicurious_indian` | https://www.epicurious.com/recipes-menus/vegetarian-indian-recipes | diversité des dals, sabzis, chaats et pains indiens |
| `epicurious_global` | https://www.epicurious.com/recipes-menus/5-new-easy-globally-inspired-weeknight-dinners-article | comparaison de plats mondiaux contemporains |
| `simply_mediterranean` | https://www.simplyrecipes.com/mediterranean-recipes-11999639 | plats méditerranéens nommés et leurs ingrédients signatures |

Les textes canoniques sont des synthèses originales Myko. Les pages tierces servent à confirmer l’existence du plat, ses traits récurrents et ses variantes ; elles ne sont pas copiées.

## 4. Distribution du corpus

### Par type d’identité

| Type | Nombre |
|---|---:|
| `named_traditional_dish` | 260 |
| `domestic_standard` | 42 |

### Par cuisine ou origine déclarée

| Cuisine | Nombre |
|---|---:|
| France / cuisine domestique internationale | 72 |
| France | 20 |
| Japon | 16 |
| Italie | 15 |
| Inde | 13 |
| Corée | 12 |
| Espagne | 11 |
| Mexique | 10 |
| Grèce | 7 |
| Thaïlande | 7 |
| Levant | 6 |
| Chine Sichuan | 6 |
| Vietnam | 6 |
| Maroc | 5 |
| Portugal | 4 |
| Turquie | 4 |
| Éthiopie | 4 |
| Nigeria | 4 |
| Inde du Sud | 4 |
| Chine | 4 |
| Chine Canton | 4 |
| Pérou | 4 |
| Afrique du Sud | 3 |
| Taïwan | 3 |
| Indonésie | 3 |
| Brésil | 3 |
| Pologne | 3 |
| Sénégal | 2 |
| Ghana | 2 |
| Kenya | 2 |
| Chine Shanghai | 2 |
| Philippines | 2 |
| Argentine | 2 |
| Venezuela | 2 |
| Jamaïque | 2 |
| Allemagne | 2 |
| Hongrie | 2 |
| Royaume-Uni | 2 |
| Palestine | 1 |
| Liban | 1 |
| Tunisie | 1 |
| Mali/Sénégal | 1 |
| Nigeria/Ghana | 1 |
| Côte d’Ivoire | 1 |
| Inde/Royaume-Uni | 1 |
| Cachemire | 1 |
| Goa | 1 |
| Pakistan | 1 |
| Pakistan/Inde | 1 |
| Inde/Pakistan | 1 |
| Chine Jiangsu | 1 |
| Laos/Thaïlande | 1 |
| Thaïlande du Nord | 1 |
| Malaisie/Singapour | 1 |
| Malaisie | 1 |
| Mexique Yucatán | 1 |
| Mexique Jalisco | 1 |
| Mexique Oaxaca | 1 |
| Mexique Veracruz | 1 |
| Salvador | 1 |
| Brésil Bahia | 1 |
| Cuba | 1 |
| Porto Rico | 1 |
| Autriche | 1 |
| Russie | 1 |

### Par famille sensorielle principale

| Profil | Nombre |
|---|---:|
| `warm_aromatic` | 46 |
| `savory_crisp` | 34 |
| `spicy_umami` | 32 |
| `fresh_acidic` | 29 |
| `tomato_herbal` | 24 |
| `earthy_herbal` | 21 |
| `creamy_delicate` | 20 |
| `smoky_sweet` | 20 |
| `sweet_spiced` | 19 |
| `brothy_umami` | 18 |
| `rich_winey` | 16 |
| `tangy_creamy` | 10 |
| `fermented_pungent` | 5 |
| `sweet_fresh` | 4 |
| `nutty_savory` | 4 |

## 5. Index des recettes

| ID | Plat | Cuisine | Identité | Profil sensoriel |
|---|---|---|---|---|
| `FR-001` | Bœuf bourguignon | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-002` | Blanquette de veau | France / cuisine domestique internationale | `named_traditional_dish` | `creamy_delicate` |
| `FR-003` | Carbonade flamande | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-004` | Hachis Parmentier | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `IT-001` | Lasagnes à la bolognaise | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-005` | Quiche lorraine | France / cuisine domestique internationale | `named_traditional_dish` | `creamy_delicate` |
| `FR-006` | Gratin dauphinois | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `FR-007` | Ratatouille provençale | France / cuisine domestique internationale | `named_traditional_dish` | `tomato_herbal` |
| `FR-008` | Poulet basquaise | France / cuisine domestique internationale | `named_traditional_dish` | `spicy_umami` |
| `FR-009` | Poulet à la moutarde et champignons | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `MAG-001` | Couscous poulet, merguez et légumes | France / cuisine domestique internationale | `named_traditional_dish` | `spicy_umami` |
| `MX-001` | Chili con carne | France / cuisine domestique internationale | `named_traditional_dish` | `spicy_umami` |
| `FR-010` | Saumon en papillote aux légumes | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `FR-011` | Cabillaud au beurre citronné, riz et haricots verts | France / cuisine domestique internationale | `domestic_standard` | `fresh_acidic` |
| `VEG-001` | Lentilles vertes mijotées aux légumes | France / cuisine domestique internationale | `domestic_standard` | `rich_winey` |
| `VEG-002` | Salade de pois chiches, tomate et concombre | France / cuisine domestique internationale | `domestic_standard` | `fresh_acidic` |
| `EGG-001` | Omelette aux fines herbes | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `VEG-003` | Quinoa aux légumes rôtis | France / cuisine domestique internationale | `domestic_standard` | `fresh_acidic` |
| `IND-001` | Curry de pois chiches et épinards | France / cuisine domestique internationale | `domestic_standard` | `tomato_herbal` |
| `IND-002` | Dahl de lentilles corail | France / cuisine domestique internationale | `domestic_standard` | `tomato_herbal` |
| `MED-001` | Shakshuka | France / cuisine domestique internationale | `named_traditional_dish` | `spicy_umami` |
| `LEV-001` | Houmous | France / cuisine domestique internationale | `named_traditional_dish` | `earthy_herbal` |
| `LEV-002` | Falafels au four | France / cuisine domestique internationale | `named_traditional_dish` | `earthy_herbal` |
| `IT-002` | Risotto aux champignons | France / cuisine domestique internationale | `named_traditional_dish` | `earthy_herbal` |
| `IT-003` | Spaghetti carbonara | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `IT-004` | Spaghetti à la sauce bolognaise | France / cuisine domestique internationale | `domestic_standard` | `rich_winey` |
| `IT-005` | Pâtes au pesto | France / cuisine domestique internationale | `named_traditional_dish` | `tomato_herbal` |
| `IT-006` | Gnocchi tomate et mozzarella | France / cuisine domestique internationale | `domestic_standard` | `tomato_herbal` |
| `IT-007` | Pizza margherita maison | France / cuisine domestique internationale | `named_traditional_dish` | `tomato_herbal` |
| `FR-012` | Soupe à l’oignon gratinée | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `FR-013` | Velouté de champignons | France / cuisine domestique internationale | `domestic_standard` | `earthy_herbal` |
| `FR-014` | Velouté de potimarron | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `IT-008` | Minestrone | France / cuisine domestique internationale | `named_traditional_dish` | `tomato_herbal` |
| `FR-015` | Pot-au-feu | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `FR-016` | Coq au vin | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-017` | Poulet rôti et pommes de terre | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `FR-018` | Filet mignon de porc à la moutarde | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-019` | Boulettes de bœuf sauce tomate | France / cuisine domestique internationale | `domestic_standard` | `tomato_herbal` |
| `GR-001` | Moussaka | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-020` | Gratin de courgettes | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-021` | Fondue de poireaux | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-022` | Endives au jambon | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-023` | Croque-monsieur | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `DESS-001` | Crêpes fines | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `DESS-002` | Pancakes moelleux | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `DESS-003` | Gâteau au yaourt | France / cuisine domestique internationale | `domestic_standard` | `sweet_fresh` |
| `DESS-004` | Tiramisu classique | France / cuisine domestique internationale | `named_traditional_dish` | `sweet_fresh` |
| `DESS-005` | Mousse au chocolat | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `DESS-006` | Flan pâtissier vanille | France / cuisine domestique internationale | `named_traditional_dish` | `sweet_spiced` |
| `DESS-007` | Crumble aux pommes | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `DESS-008` | Riz au lait vanille | France / cuisine domestique internationale | `domestic_standard` | `sweet_fresh` |
| `FR-024` | Béchamel de base | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-025` | Purée de pommes de terre | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `FR-026` | Haricots verts persillés | France / cuisine domestique internationale | `domestic_standard` | `earthy_herbal` |
| `FR-027` | Pommes de terre sautées | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `FR-028` | Cake jambon et olives | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `DESS-009` | Banana bread | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `DESS-010` | Fondant au chocolat | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `DESS-011` | Tarte au citron meringuée | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `FR-029` | Tarte thon, tomate et moutarde | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-030` | Clafoutis aux cerises | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `FR-031` | Gougères au fromage | France / cuisine domestique internationale | `domestic_standard` | `warm_aromatic` |
| `FR-032` | Tarte tatin aux pommes | France / cuisine domestique internationale | `named_traditional_dish` | `sweet_spiced` |
| `FR-033` | Salade de lentilles, œuf mollet et moutarde | France / cuisine domestique internationale | `domestic_standard` | `rich_winey` |
| `FR-034` | Poireaux vinaigrette | France / cuisine domestique internationale | `domestic_standard` | `rich_winey` |
| `FR-035` | Salade niçoise | France / cuisine domestique internationale | `named_traditional_dish` | `rich_winey` |
| `FR-036` | Tarte aux poireaux et lardons | France / cuisine domestique internationale | `domestic_standard` | `creamy_delicate` |
| `FR-037` | Parmentier de canard | France / cuisine domestique internationale | `named_traditional_dish` | `warm_aromatic` |
| `FR-038` | Lapin à la moutarde | France / cuisine domestique internationale | `domestic_standard` | `rich_winey` |
| `FR-039` | Tarte aux pommes alsacienne | France / cuisine domestique internationale | `domestic_standard` | `sweet_spiced` |
| `DESS-012` | Panna cotta vanille | France / cuisine domestique internationale | `named_traditional_dish` | `sweet_fresh` |
| `FR-040` | Madeleines au miel | France / cuisine domestique internationale | `named_traditional_dish` | `sweet_spiced` |
| `REAL-073` | Cassoulet de Castelnaudary | France | `named_traditional_dish` | `rich_winey` |
| `REAL-074` | Choucroute garnie alsacienne | France | `named_traditional_dish` | `fermented_pungent` |
| `REAL-075` | Tartiflette | France | `named_traditional_dish` | `creamy_delicate` |
| `REAL-076` | Aligot de l’Aubrac | France | `named_traditional_dish` | `creamy_delicate` |
| `REAL-077` | Garbure béarnaise | France | `named_traditional_dish` | `earthy_herbal` |
| `REAL-078` | Axoa de veau | France | `named_traditional_dish` | `warm_aromatic` |
| `REAL-079` | Bouillabaisse marseillaise | France | `named_traditional_dish` | `brothy_umami` |
| `REAL-080` | Brandade de morue | France | `named_traditional_dish` | `creamy_delicate` |
| `REAL-081` | Sole meunière | France | `named_traditional_dish` | `savory_crisp` |
| `REAL-082` | Quenelles de brochet sauce Nantua | France | `named_traditional_dish` | `creamy_delicate` |
| `REAL-083` | Navarin d’agneau printanier | France | `named_traditional_dish` | `earthy_herbal` |
| `REAL-084` | Petit salé aux lentilles | France | `named_traditional_dish` | `earthy_herbal` |
| `REAL-085` | Tomates farcies à la chair | France | `named_traditional_dish` | `tomato_herbal` |
| `REAL-086` | Œufs en meurette | France | `named_traditional_dish` | `rich_winey` |
| `REAL-087` | Salade lyonnaise | France | `named_traditional_dish` | `fresh_acidic` |
| `REAL-088` | Flamiche aux poireaux | France | `named_traditional_dish` | `creamy_delicate` |
| `REAL-089` | Kouign-amann | France | `named_traditional_dish` | `sweet_spiced` |
| `REAL-090` | Cannelés de Bordeaux | France | `named_traditional_dish` | `sweet_spiced` |
| `REAL-091` | Far breton aux pruneaux | France | `named_traditional_dish` | `sweet_spiced` |
| `REAL-092` | Piperade basquaise | France | `named_traditional_dish` | `tomato_herbal` |
| `REAL-093` | Ossobuco alla milanese | Italie | `named_traditional_dish` | `rich_winey` |
| `REAL-094` | Saltimbocca alla romana | Italie | `named_traditional_dish` | `savory_crisp` |
| `REAL-095` | Pollo alla cacciatora | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-096` | Vitello tonnato | Italie | `named_traditional_dish` | `tangy_creamy` |
| `REAL-097` | Arancini siciliens au ragù | Italie | `named_traditional_dish` | `savory_crisp` |
| `REAL-098` | Ribollita toscane | Italie | `named_traditional_dish` | `earthy_herbal` |
| `REAL-099` | Pappa al pomodoro | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-100` | Cacio e pepe | Italie | `named_traditional_dish` | `savory_crisp` |
| `REAL-101` | Bucatini all’amatriciana | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-102` | Spaghetti alla puttanesca | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-103` | Pasta alla Norma | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-104` | Orecchiette alle cime di rapa | Italie | `named_traditional_dish` | `earthy_herbal` |
| `REAL-105` | Parmigiana di melanzane | Italie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-106` | Caponata sicilienne | Italie | `named_traditional_dish` | `fresh_acidic` |
| `REAL-107` | Focaccia genovese | Italie | `named_traditional_dish` | `savory_crisp` |
| `REAL-108` | Tortilla española | Espagne | `named_traditional_dish` | `savory_crisp` |
| `REAL-109` | Croquetas de jamón | Espagne | `named_traditional_dish` | `savory_crisp` |
| `REAL-110` | Paella valenciana | Espagne | `named_traditional_dish` | `warm_aromatic` |
| `REAL-111` | Arroz negro | Espagne | `named_traditional_dish` | `brothy_umami` |
| `REAL-112` | Fideuà | Espagne | `named_traditional_dish` | `brothy_umami` |
| `REAL-113` | Fabada asturiana | Espagne | `named_traditional_dish` | `earthy_herbal` |
| `REAL-114` | Gazpacho andalou | Espagne | `named_traditional_dish` | `fresh_acidic` |
| `REAL-115` | Salmorejo cordobés | Espagne | `named_traditional_dish` | `fresh_acidic` |
| `REAL-116` | Gambas al ajillo | Espagne | `named_traditional_dish` | `savory_crisp` |
| `REAL-117` | Bacalao al pil-pil | Espagne | `named_traditional_dish` | `creamy_delicate` |
| `REAL-118` | Pulpo a la gallega | Espagne | `named_traditional_dish` | `brothy_umami` |
| `REAL-119` | Bacalhau à Brás | Portugal | `named_traditional_dish` | `creamy_delicate` |
| `REAL-120` | Caldo verde | Portugal | `named_traditional_dish` | `earthy_herbal` |
| `REAL-121` | Francesinha | Portugal | `named_traditional_dish` | `smoky_sweet` |
| `REAL-122` | Pastéis de nata | Portugal | `named_traditional_dish` | `sweet_spiced` |
| `REAL-123` | Spanakopita | Grèce | `named_traditional_dish` | `fresh_acidic` |
| `REAL-124` | Dolmades | Grèce | `named_traditional_dish` | `fresh_acidic` |
| `REAL-125` | Fasolada | Grèce | `named_traditional_dish` | `earthy_herbal` |
| `REAL-126` | Gigantes plaki | Grèce | `named_traditional_dish` | `earthy_herbal` |
| `REAL-127` | Souvlaki de porc | Grèce | `named_traditional_dish` | `savory_crisp` |
| `REAL-128` | Kleftiko d’agneau | Grèce | `named_traditional_dish` | `warm_aromatic` |
| `REAL-129` | Avgolemono | Grèce | `named_traditional_dish` | `tangy_creamy` |
| `REAL-130` | İmam bayıldı | Turquie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-131` | Menemen | Turquie | `named_traditional_dish` | `tomato_herbal` |
| `REAL-132` | Mantı turcs | Turquie | `named_traditional_dish` | `tangy_creamy` |
| `REAL-133` | Lahmacun | Turquie | `named_traditional_dish` | `warm_aromatic` |
| `REAL-134` | Musakhan palestinien | Palestine | `named_traditional_dish` | `warm_aromatic` |
| `REAL-135` | Maqluba | Levant | `named_traditional_dish` | `warm_aromatic` |
| `REAL-136` | Mujaddara | Levant | `named_traditional_dish` | `earthy_herbal` |
| `REAL-137` | Fattoush | Levant | `named_traditional_dish` | `fresh_acidic` |
| `REAL-138` | Taboulé libanais | Liban | `named_traditional_dish` | `fresh_acidic` |
| `REAL-139` | Baba ganoush | Levant | `named_traditional_dish` | `smoky_sweet` |
| `REAL-140` | Muhammara | Levant | `named_traditional_dish` | `nutty_savory` |
| `REAL-141` | Kibbeh bil sanieh | Levant | `named_traditional_dish` | `warm_aromatic` |
| `REAL-142` | Tajine de poulet au citron confit et olives | Maroc | `named_traditional_dish` | `warm_aromatic` |
| `REAL-143` | Tajine d’agneau aux pruneaux | Maroc | `named_traditional_dish` | `sweet_spiced` |
| `REAL-144` | Harira | Maroc | `named_traditional_dish` | `warm_aromatic` |
| `REAL-145` | Pastilla au poulet et amandes | Maroc | `named_traditional_dish` | `sweet_spiced` |
| `REAL-146` | Rfissa | Maroc | `named_traditional_dish` | `warm_aromatic` |
| `REAL-147` | Brik à l’œuf | Tunisie | `named_traditional_dish` | `savory_crisp` |
| `REAL-148` | Doro wat | Éthiopie | `named_traditional_dish` | `spicy_umami` |
| `REAL-149` | Misir wat | Éthiopie | `named_traditional_dish` | `spicy_umami` |
| `REAL-150` | Shiro wat | Éthiopie | `named_traditional_dish` | `warm_aromatic` |
| `REAL-151` | Tibs de bœuf | Éthiopie | `named_traditional_dish` | `savory_crisp` |
| `REAL-152` | Jollof rice nigérian | Nigeria | `named_traditional_dish` | `smoky_sweet` |
| `REAL-153` | Thiéboudienne | Sénégal | `named_traditional_dish` | `spicy_umami` |
| `REAL-154` | Poulet yassa | Sénégal | `named_traditional_dish` | `fresh_acidic` |
| `REAL-155` | Mafé de bœuf | Mali/Sénégal | `named_traditional_dish` | `nutty_savory` |
| `REAL-156` | Suya de bœuf | Nigeria | `named_traditional_dish` | `spicy_umami` |
| `REAL-157` | Egusi soup | Nigeria | `named_traditional_dish` | `nutty_savory` |
| `REAL-158` | Moi moi | Nigeria | `named_traditional_dish` | `warm_aromatic` |
| `REAL-159` | Akara | Nigeria/Ghana | `named_traditional_dish` | `savory_crisp` |
| `REAL-160` | Kelewele | Ghana | `named_traditional_dish` | `sweet_spiced` |
| `REAL-161` | Waakye | Ghana | `named_traditional_dish` | `earthy_herbal` |
| `REAL-162` | Kenyan beef wet fry | Kenya | `named_traditional_dish` | `tomato_herbal` |
| `REAL-163` | Ugali et sukuma wiki | Kenya | `named_traditional_dish` | `earthy_herbal` |
| `REAL-164` | Bobotie | Afrique du Sud | `named_traditional_dish` | `sweet_spiced` |
| `REAL-165` | Bunny chow | Afrique du Sud | `named_traditional_dish` | `warm_aromatic` |
| `REAL-166` | Chakalaka | Afrique du Sud | `named_traditional_dish` | `spicy_umami` |
| `REAL-167` | Kedjenou de poulet | Côte d’Ivoire | `named_traditional_dish` | `warm_aromatic` |
| `REAL-168` | Butter chicken murgh makhani | Inde | `named_traditional_dish` | `tangy_creamy` |
| `REAL-169` | Chicken tikka masala | Inde/Royaume-Uni | `named_traditional_dish` | `tangy_creamy` |
| `REAL-170` | Tandoori chicken | Inde | `named_traditional_dish` | `smoky_sweet` |
| `REAL-171` | Biryani hyderabadi au poulet | Inde | `named_traditional_dish` | `warm_aromatic` |
| `REAL-172` | Rogan josh | Cachemire | `named_traditional_dish` | `warm_aromatic` |
| `REAL-173` | Saag paneer | Inde | `named_traditional_dish` | `earthy_herbal` |
| `REAL-174` | Chana masala | Inde | `named_traditional_dish` | `warm_aromatic` |
| `REAL-175` | Rajma masala | Inde | `named_traditional_dish` | `earthy_herbal` |
| `REAL-176` | Aloo gobi | Inde | `named_traditional_dish` | `warm_aromatic` |
| `REAL-177` | Baingan bharta | Inde | `named_traditional_dish` | `smoky_sweet` |
| `REAL-178` | Dal makhani | Inde | `named_traditional_dish` | `creamy_delicate` |
| `REAL-179` | Sambar | Inde du Sud | `named_traditional_dish` | `fresh_acidic` |
| `REAL-180` | Rasam | Inde du Sud | `named_traditional_dish` | `fresh_acidic` |
| `REAL-181` | Masala dosa | Inde du Sud | `named_traditional_dish` | `savory_crisp` |
| `REAL-182` | Idli | Inde du Sud | `named_traditional_dish` | `fresh_acidic` |
| `REAL-183` | Vada pav | Inde | `named_traditional_dish` | `spicy_umami` |
| `REAL-184` | Pav bhaji | Inde | `named_traditional_dish` | `spicy_umami` |
| `REAL-185` | Samosa aux pommes de terre | Inde | `named_traditional_dish` | `savory_crisp` |
| `REAL-186` | Pakora d’oignons | Inde | `named_traditional_dish` | `savory_crisp` |
| `REAL-187` | Vindaloo de porc | Goa | `named_traditional_dish` | `spicy_umami` |
| `REAL-188` | Nihari | Pakistan | `named_traditional_dish` | `warm_aromatic` |
| `REAL-189` | Haleem | Pakistan/Inde | `named_traditional_dish` | `warm_aromatic` |
| `REAL-190` | Keema matar | Inde/Pakistan | `named_traditional_dish` | `warm_aromatic` |
| `REAL-191` | Mapo tofu | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-192` | Gong bao ji ding | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-193` | Dan dan noodles | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-194` | Hong shao rou | Chine Shanghai | `named_traditional_dish` | `smoky_sweet` |
| `REAL-195` | Hui guo rou | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-196` | Yu xiang qie zi | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-197` | Gan bian si ji dou | Chine Sichuan | `named_traditional_dish` | `spicy_umami` |
| `REAL-198` | Fan qie chao dan | Chine | `named_traditional_dish` | `tomato_herbal` |
| `REAL-199` | Lion’s head meatballs | Chine Jiangsu | `named_traditional_dish` | `brothy_umami` |
| `REAL-200` | Jiaozi porc ciboulette | Chine | `named_traditional_dish` | `savory_crisp` |
| `REAL-201` | Xiaolongbao | Chine Shanghai | `named_traditional_dish` | `brothy_umami` |
| `REAL-202` | Cong you bing | Chine | `named_traditional_dish` | `savory_crisp` |
| `REAL-203` | Cantonese clay pot rice | Chine Canton | `named_traditional_dish` | `brothy_umami` |
| `REAL-204` | Char siu | Chine Canton | `named_traditional_dish` | `smoky_sweet` |
| `REAL-205` | Poisson vapeur gingembre ciboule | Chine Canton | `named_traditional_dish` | `brothy_umami` |
| `REAL-206` | Wonton soup | Chine Canton | `named_traditional_dish` | `brothy_umami` |
| `REAL-207` | Suanla tang | Chine | `named_traditional_dish` | `spicy_umami` |
| `REAL-208` | Lu rou fan | Taïwan | `named_traditional_dish` | `smoky_sweet` |
| `REAL-209` | Taiwan beef noodle soup | Taïwan | `named_traditional_dish` | `brothy_umami` |
| `REAL-210` | San bei ji | Taïwan | `named_traditional_dish` | `spicy_umami` |
| `REAL-211` | Shoyu ramen | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-212` | Miso ramen | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-213` | Tonkotsu ramen | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-214` | Oyakodon | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-215` | Katsudon | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-216` | Gyudon | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-217` | Okonomiyaki Osaka | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-218` | Takoyaki | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-219` | Tempura de crevettes et légumes | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-220` | Karaage | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-221` | Japanese curry rice | Japon | `named_traditional_dish` | `warm_aromatic` |
| `REAL-222` | Nikujaga | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-223` | Sukiyaki | Japon | `named_traditional_dish` | `brothy_umami` |
| `REAL-224` | Yakisoba | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-225` | Tamagoyaki | Japon | `named_traditional_dish` | `sweet_spiced` |
| `REAL-226` | Gyoza porc chou | Japon | `named_traditional_dish` | `savory_crisp` |
| `REAL-227` | Bibimbap de Jeonju | Corée | `named_traditional_dish` | `spicy_umami` |
| `REAL-228` | Bulgogi | Corée | `named_traditional_dish` | `smoky_sweet` |
| `REAL-229` | Galbi gui | Corée | `named_traditional_dish` | `smoky_sweet` |
| `REAL-230` | Japchae | Corée | `named_traditional_dish` | `savory_crisp` |
| `REAL-231` | Tteokbokki | Corée | `named_traditional_dish` | `spicy_umami` |
| `REAL-232` | Kimchi jjigae | Corée | `named_traditional_dish` | `fermented_pungent` |
| `REAL-233` | Doenjang jjigae | Corée | `named_traditional_dish` | `fermented_pungent` |
| `REAL-234` | Sundubu jjigae | Corée | `named_traditional_dish` | `spicy_umami` |
| `REAL-235` | Dakgalbi | Corée | `named_traditional_dish` | `spicy_umami` |
| `REAL-236` | Haemul pajeon | Corée | `named_traditional_dish` | `savory_crisp` |
| `REAL-237` | Kimbap | Corée | `named_traditional_dish` | `savory_crisp` |
| `REAL-238` | Bossam | Corée | `named_traditional_dish` | `fermented_pungent` |
| `REAL-239` | Phở bò | Vietnam | `named_traditional_dish` | `brothy_umami` |
| `REAL-240` | Bún chả | Vietnam | `named_traditional_dish` | `smoky_sweet` |
| `REAL-241` | Bánh mì thịt | Vietnam | `named_traditional_dish` | `fresh_acidic` |
| `REAL-242` | Gỏi cuốn | Vietnam | `named_traditional_dish` | `fresh_acidic` |
| `REAL-243` | Bún bò Huế | Vietnam | `named_traditional_dish` | `spicy_umami` |
| `REAL-244` | Thịt kho trứng | Vietnam | `named_traditional_dish` | `smoky_sweet` |
| `REAL-245` | Pad thaï | Thaïlande | `named_traditional_dish` | `fresh_acidic` |
| `REAL-246` | Gaeng keow wan | Thaïlande | `named_traditional_dish` | `spicy_umami` |
| `REAL-247` | Massaman curry | Thaïlande | `named_traditional_dish` | `warm_aromatic` |
| `REAL-248` | Tom yum goong | Thaïlande | `named_traditional_dish` | `fresh_acidic` |
| `REAL-249` | Tom kha gai | Thaïlande | `named_traditional_dish` | `tangy_creamy` |
| `REAL-250` | Som tam | Thaïlande | `named_traditional_dish` | `fresh_acidic` |
| `REAL-251` | Larb de porc | Laos/Thaïlande | `named_traditional_dish` | `fresh_acidic` |
| `REAL-252` | Pad kra pao | Thaïlande | `named_traditional_dish` | `spicy_umami` |
| `REAL-253` | Khao soi | Thaïlande du Nord | `named_traditional_dish` | `spicy_umami` |
| `REAL-254` | Nasi goreng | Indonésie | `named_traditional_dish` | `smoky_sweet` |
| `REAL-255` | Rendang de bœuf | Indonésie | `named_traditional_dish` | `spicy_umami` |
| `REAL-256` | Gado-gado | Indonésie | `named_traditional_dish` | `nutty_savory` |
| `REAL-257` | Laksa curry | Malaisie/Singapour | `named_traditional_dish` | `spicy_umami` |
| `REAL-258` | Char kway teow | Malaisie | `named_traditional_dish` | `smoky_sweet` |
| `REAL-259` | Chicken adobo | Philippines | `named_traditional_dish` | `fresh_acidic` |
| `REAL-260` | Sinigang de porc | Philippines | `named_traditional_dish` | `fresh_acidic` |
| `REAL-261` | Tacos al pastor | Mexique | `named_traditional_dish` | `smoky_sweet` |
| `REAL-262` | Carnitas | Mexique | `named_traditional_dish` | `smoky_sweet` |
| `REAL-263` | Cochinita pibil | Mexique Yucatán | `named_traditional_dish` | `warm_aromatic` |
| `REAL-264` | Mole poblano au poulet | Mexique | `named_traditional_dish` | `warm_aromatic` |
| `REAL-265` | Enchiladas verdes | Mexique | `named_traditional_dish` | `fresh_acidic` |
| `REAL-266` | Chilaquiles rojos | Mexique | `named_traditional_dish` | `tomato_herbal` |
| `REAL-267` | Pozole rojo | Mexique | `named_traditional_dish` | `warm_aromatic` |
| `REAL-268` | Birria de res | Mexique Jalisco | `named_traditional_dish` | `warm_aromatic` |
| `REAL-269` | Tamales de poulet salsa verde | Mexique | `named_traditional_dish` | `savory_crisp` |
| `REAL-270` | Tlayuda oaxaqueña | Mexique Oaxaca | `named_traditional_dish` | `smoky_sweet` |
| `REAL-271` | Sopa de tortilla | Mexique | `named_traditional_dish` | `tomato_herbal` |
| `REAL-272` | Pescado a la veracruzana | Mexique Veracruz | `named_traditional_dish` | `tomato_herbal` |
| `REAL-273` | Ceviche de poisson à la mexicaine | Mexique | `named_traditional_dish` | `fresh_acidic` |
| `REAL-274` | Esquites | Mexique | `named_traditional_dish` | `smoky_sweet` |
| `REAL-275` | Pupusas revueltas | Salvador | `named_traditional_dish` | `savory_crisp` |
| `REAL-276` | Feijoada completa | Brésil | `named_traditional_dish` | `earthy_herbal` |
| `REAL-277` | Moqueca baiana | Brésil Bahia | `named_traditional_dish` | `tangy_creamy` |
| `REAL-278` | Pão de queijo | Brésil | `named_traditional_dish` | `savory_crisp` |
| `REAL-279` | Coxinha de frango | Brésil | `named_traditional_dish` | `savory_crisp` |
| `REAL-280` | Empanadas argentines au bœuf | Argentine | `named_traditional_dish` | `warm_aromatic` |
| `REAL-281` | Locro criollo | Argentine | `named_traditional_dish` | `earthy_herbal` |
| `REAL-282` | Lomo saltado | Pérou | `named_traditional_dish` | `spicy_umami` |
| `REAL-283` | Ají de gallina | Pérou | `named_traditional_dish` | `tangy_creamy` |
| `REAL-284` | Causa limeña | Pérou | `named_traditional_dish` | `fresh_acidic` |
| `REAL-285` | Anticuchos de corazón | Pérou | `named_traditional_dish` | `smoky_sweet` |
| `REAL-286` | Arepas reina pepiada | Venezuela | `named_traditional_dish` | `fresh_acidic` |
| `REAL-287` | Pabellón criollo | Venezuela | `named_traditional_dish` | `smoky_sweet` |
| `REAL-288` | Jerk chicken | Jamaïque | `named_traditional_dish` | `spicy_umami` |
| `REAL-289` | Curry goat jamaïcain | Jamaïque | `named_traditional_dish` | `warm_aromatic` |
| `REAL-290` | Ropa vieja | Cuba | `named_traditional_dish` | `tomato_herbal` |
| `REAL-291` | Mofongo | Porto Rico | `named_traditional_dish` | `savory_crisp` |
| `REAL-292` | Sauerbraten | Allemagne | `named_traditional_dish` | `fresh_acidic` |
| `REAL-293` | Rinderrouladen | Allemagne | `named_traditional_dish` | `rich_winey` |
| `REAL-294` | Wiener schnitzel | Autriche | `named_traditional_dish` | `savory_crisp` |
| `REAL-295` | Goulash hongrois | Hongrie | `named_traditional_dish` | `warm_aromatic` |
| `REAL-296` | Chicken paprikash | Hongrie | `named_traditional_dish` | `tangy_creamy` |
| `REAL-297` | Pierogi ruskie | Pologne | `named_traditional_dish` | `creamy_delicate` |
| `REAL-298` | Bigos | Pologne | `named_traditional_dish` | `fermented_pungent` |
| `REAL-299` | Barszcz czerwony | Pologne | `named_traditional_dish` | `fresh_acidic` |
| `REAL-300` | Beef stroganoff | Russie | `named_traditional_dish` | `tangy_creamy` |
| `REAL-301` | Shepherd’s pie | Royaume-Uni | `named_traditional_dish` | `rich_winey` |
| `REAL-302` | Fish and chips | Royaume-Uni | `named_traditional_dish` | `savory_crisp` |

## 6. Fiches canoniques complètes

### FR-001 — Bœuf bourguignon

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_bourguignon`, `bbc_bourguignon`, `serious_stews`, `allrecipes_bourguignon`, `epicurious_bourguignon`

- **Arbitrage canonique** : Version canonique : garniture cuite séparément pour éviter les légumes surcuits.

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

#### Méthode canonique

1. Sécher et saler légèrement les cubes de bœuf. Les saisir en plusieurs fournées dans une cocotte très chaude.
2. Faire revenir les lardons, puis les carottes et l’oignon. Ajouter l’ail et la farine ; cuire une minute.
3. Déglacer au vin rouge, remettre la viande, ajouter le bouquet garni et compléter avec un peu d’eau si nécessaire.
4. Couvrir et braiser doucement au four à 155 °C pendant environ 2 h 30, jusqu’à tendreté.
5. Poêler séparément champignons et oignons grelots afin de conserver leur texture, puis les ajouter pour les 20 dernières minutes.
6. Rectifier la sauce par réduction douce ; poivrer et servir.

**Techniques** : saisie, déglaçage, braisage, réduction, garniture séparée.

**Variantes candidates** : Version sans lardons ; version mijoteuse ; accompagnement purée, pommes vapeur ou tagliatelles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, oignon_compoté, vin_rouge_réduit, champignon_terreux, fumé
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Paleron de bœuf cru, paré, Vin rouge sec, Lardon fumé cru, Carotte crue
- **Garde-fous / dérives interdites** : vin_rouge_dominant, viande_braisée_non_hachée, garniture_champignons_oignons, pas_de_tomate_dominante
- **Conservation** : 3 jours au réfrigérateur ; 3 mois au congélateur. Meilleur réchauffé le lendemain.
- **Allergènes structurels** : gluten

---

### FR-002 — Blanquette de veau

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_blanquette`, `marmiton_top`

- **Arbitrage canonique** : La version canonique évite de saisir la viande : la couleur blanche est un critère de famille.

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

#### Méthode canonique

1. Couvrir le veau de bouillon froid avec poireau, oignon, carottes et bouquet garni. Monter doucement au frémissement et écumer.
2. Cuire à très faible frémissement 1 h 30 à 2 h ; la viande doit être tendre sans se défaire.
3. Cuire les champignons à part avec une noix de beurre et un peu de citron.
4. Filtrer une partie du bouillon. Préparer un roux blanc avec beurre et farine, puis mouiller progressivement avec le bouillon.
5. Hors du feu, mélanger crème et jaunes d’œufs ; tempérer avec la sauce puis incorporer sans faire bouillir.
6. Réunir viande, carottes et champignons. Ajuster citron, sel et poivre.

**Techniques** : pochage, écumage, roux blanc, liaison aux jaunes, tempérage.

**Variantes candidates** : Dinde ou poulet en version économique ; riz blanc ou pommes vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, oignon_compoté, champignon_terreux, beurre, lacté, agrume
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Épaule de veau crue, en cubes, Carotte crue, Poireau cru, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur. Réchauffer sans ébullition pour préserver la liaison.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-003 — Carbonade flamande

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 180 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_carbonade`, `serious_beef`

- **Arbitrage canonique** : Servir avec frites, pommes vapeur ou purée.

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

#### Méthode canonique

1. Saisir le bœuf en fournées dans le beurre, puis réserver.
2. Faire fondre longuement les oignons jusqu’à légère coloration.
3. Ajouter cassonade et vinaigre, puis déglacer avec la bière.
4. Remettre le bœuf. Poser le pain d’épices tartiné de moutarde sur la surface.
5. Ajouter thym et laurier ; couvrir et mijoter 2 h 30 à 3 h.
6. Mélanger en fin de cuisson pour intégrer le pain d’épices et ajuster l’équilibre amer-acide-sucré.

**Techniques** : saisie, caramélisation des oignons, déglaçage, braisage, liaison au pain.

**Variantes candidates** : Pain de campagne + moutarde si pain d’épices absent ; bière ambrée moins sucrée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, beurre, moutarde, thym, laurier
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Paleron de bœuf cru, paré, Bière brune belge, Oignon jaune cru, Pain d'épices
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : gluten, lait, moutarde

---

### FR-004 — Hachis Parmentier

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat complet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_hachis`, `marmiton_top`

- **Arbitrage canonique** : Priorité aux restes de pot-au-feu ou de viande braisée.

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

#### Méthode canonique

1. Cuire les pommes de terre à l’eau salée, égoutter puis les dessécher brièvement.
2. Écraser avec lait chaud, beurre et muscade ; garder une purée souple.
3. Faire suer oignon et carotte. Ajouter le bœuf effiloché et le bouillon ; réduire jusqu’à une garniture juteuse mais non liquide.
4. Étaler la viande dans un plat, couvrir de purée et parsemer de chapelure.
5. Cuire 25 minutes à 190 °C puis gratiner quelques minutes.

**Techniques** : cuisson à l'eau, dessiccation, purée, suer, réduction, gratinage.

**Variantes candidates** : Canard confit ; lentilles et champignons ; fromage râpé facultatif.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Bœuf cuit effiloché, Pomme de terre crue, épluchée, Lait demi-écrémé, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation 2 mois.
- **Allergènes structurels** : gluten, lait

---

### IT-001 — Lasagnes à la bolognaise

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes au four
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_lasagne`, `marmiton_top`

- **Arbitrage canonique** : Le repos après cuisson stabilise les couches.

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

#### Méthode canonique

1. Faire suer finement oignon, carotte et céleri. Ajouter les viandes et les émietter jusqu’à légère coloration.
2. Déglacer au vin, réduire, ajouter tomate et 150 ml de lait. Mijoter au moins 1 h 15.
3. Préparer une béchamel souple avec beurre, farine et le reste du lait ; parfumer de muscade.
4. Monter en alternant ragù, lasagnes, béchamel et parmesan. Terminer par béchamel et fromage.
5. Cuire 40 à 45 minutes à 180 °C. Reposer 15 minutes avant découpe.

**Techniques** : soffritto, saisie, déglaçage, mijotage, roux, montage, gratinage.

**Variantes candidates** : Ragù 100 % bœuf ; épinards-ricotta ; courgettes-lentilles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, tomate_cuite, beurre, parmesan
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Feuille de lasagne sèche, Bœuf haché cru 15 % MG, Porc haché cru, Tomate concassée en conserve
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : céleri, gluten, lait

---

### FR-005 — Quiche lorraine

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : tarte salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_quiche`, `marmiton_top`

- **Arbitrage canonique** : Le sel est limité car les lardons sont déjà salés.

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

#### Méthode canonique

1. Foncer la pâte, piquer et la refroidir 20 minutes.
2. Faire revenir les lardons sans les dessécher, puis égoutter leur graisse.
3. Mélanger œufs, crème, lait, muscade et poivre.
4. Répartir les lardons sur le fond et verser l’appareil.
5. Cuire à 180 °C pendant 35 à 40 minutes, jusqu’à prise avec un léger tremblement central.
6. Reposer 10 minutes avant de servir.

**Techniques** : fonçage, précuisson de garniture, appareil à crème prise, cuisson au four.

**Variantes candidates** : Version canonique sans fromage ; oignon ou emmental seulement comme variantes non traditionnelles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : lacté, fumé
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte brisée crue, Lardon fumé cru, Œuf cru, Crème fraîche liquide entière
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-006 — Gratin dauphinois

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : accompagnement
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 75 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_gratin`, `bbc_bourguignon`, `marmiton_top`

- **Arbitrage canonique** : L’amidon de la pomme de terre assure la liaison naturelle.

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

#### Méthode canonique

1. Frotter le plat avec l’ail puis le beurrer.
2. Trancher les pommes de terre à 2–3 mm sans les rincer afin de conserver l’amidon.
3. Chauffer lait, crème, sel, muscade et poivre. Ajouter les pommes de terre et précuire 8 minutes en remuant délicatement.
4. Verser dans le plat, égaliser et cuire 60 à 70 minutes à 165 °C.
5. Laisser reposer 15 minutes avant service.

**Techniques** : taillage régulier, précuisson dans le lait, cuisson lente au four, repos.

**Variantes candidates** : Version plus légère moitié lait ; aucune obligation de fromage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, beurre, lacté
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Crème fraîche liquide entière, Lait entier, Ail cru
- **Garde-fous / dérives interdites** : pomme_de_terre_tranchée, crème_ou_lait, pas_de_fromage_obligatoire, amidon_non_rincé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### FR-007 — Ratatouille provençale

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : légumes mijotés
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 60 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_ratatouille`, `serious_stews`, `marmiton_top`

- **Arbitrage canonique** : La cuisson séparée est retenue pour préserver l’identité de chaque légume.

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

#### Méthode canonique

1. Tailler tous les légumes en morceaux réguliers.
2. Cuire séparément aubergines, courgettes et poivrons dans un peu d’huile pour maîtriser leurs textures.
3. Faire fondre oignon et ail, puis ajouter les tomates et les herbes ; compoter 15 minutes.
4. Réunir les légumes et mijoter encore 20 à 25 minutes.
5. Rectifier l’assaisonnement et servir chaud, tiède ou froid.

**Techniques** : taillage, cuissons séparées, compotage, mijotage.

**Variantes candidates** : Cuisson tout-en-un plus simple mais texture moins précise ; œuf poché ou pois chiches en ajout.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, thym, laurier
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Aubergine fraîche, Courgette fraîche, Poivron rouge frais, Poivron jaune frais
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### FR-008 — Poulet basquaise

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 65 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_basquaise`, `marmiton_top`

- **Arbitrage canonique** : Le poulet avec os est la forme préférée pour la sauce.

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

#### Méthode canonique

1. Saler légèrement et dorer les morceaux de poulet côté peau, puis réserver.
2. Faire fondre oignons, poivrons et ail. Ajouter éventuellement le jambon.
3. Déglacer au vin blanc, réduire de moitié, puis ajouter tomate, thym et piment.
4. Remettre le poulet, couvrir partiellement et mijoter 40 à 45 minutes.
5. Vérifier une température à cœur d’au moins 75 °C et réduire la sauce si nécessaire.

**Techniques** : saisie, suer, déglaçage, mijotage, réduction.

**Variantes candidates** : Blanc de poulet : branche de cuisson plus courte ; version sans jambon.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, vin_blanc_réduit, tomate_cuite, thym, piment
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Poivron rouge frais, Poivron vert frais, Tomate concassée en conserve
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### FR-009 — Poulet à la moutarde et champignons

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : plat en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_poulet_moutarde`, `marmiton_top`

- **Arbitrage canonique** : Branches de cuisson nécessaires selon le morceau.

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

#### Méthode canonique

1. Saisir les hauts de cuisse dans l’huile et réserver.
2. Faire revenir échalotes et champignons jusqu’à évaporation de leur eau.
3. Déglacer au vin, réduire presque à sec, puis incorporer moutarde et crème.
4. Remettre le poulet et mijoter doucement 15 à 18 minutes.
5. Vérifier 75 °C à cœur, ajouter l’estragon et rectifier.

**Techniques** : saisie, évaporation, déglaçage, réduction, mijotage.

**Variantes candidates** : Blanc de poulet : 10–12 minutes ; cuisses avec os : 30 minutes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : échalote, vin_blanc_réduit, champignon_terreux, lacté, moutarde
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Haut de cuisse de poulet cru, désossé, sans peau, Champignon de Paris frais, Échalote crue, Moutarde de Dijon
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### MAG-001 — Couscous poulet, merguez et légumes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat complet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_couscous`, `marmiton_top`

- **Arbitrage canonique** : La merguez est cuite séparément pour limiter le gras dans le bouillon.

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

#### Méthode canonique

1. Dorer le poulet, puis faire suer l’oignon et les épices.
2. Ajouter tomate, carottes et navets ; couvrir d’eau et mijoter 45 minutes.
3. Ajouter courgettes et pois chiches pour les 20 dernières minutes.
4. Griller ou poêler les merguez séparément pour mieux contrôler la graisse.
5. Hydrater et égrener la semoule avec une partie du bouillon et un filet d’huile.
6. Servir les composants séparément, avec harissa détendue au bouillon.

**Techniques** : saisie, mijotage séquencé, grillade, hydratation, égrenage.

**Variantes candidates** : Agneau ; légumes seuls ; raisins secs facultatifs dans la semoule.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : oignon_compoté, tomate_cuite
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Merguez crue, Semoule de blé dur moyenne sèche, Carotte crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur, composants séparés.
- **Allergènes structurels** : gluten

---

### MX-001 — Chili con carne

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_chili`, `allrecipes_bourguignon`, `serious_beef`, `marmiton_top`

- **Arbitrage canonique** : Le haricot est ajouté tard pour conserver sa texture.

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

#### Méthode canonique

1. Colorer le bœuf en plusieurs fois pour éviter qu’il ne rende trop d’eau.
2. Faire revenir oignon, poivron et ail avec les épices.
3. Ajouter tomate et bouillon, remettre la viande et mijoter 60 minutes.
4. Ajouter les haricots rincés et poursuivre 20 minutes.
5. Rectifier le piment, la texture et le sel.

**Techniques** : saisie, torréfaction des épices, mijotage, réduction.

**Variantes candidates** : Version texane sans haricots ; dinde hachée ; lentilles et champignons.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, cumin, paprika, piment, fumé
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Bœuf haché cru 15 % MG, Haricot rouge cuit, égoutté, Tomate concassée en conserve, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### FR-010 — Saumon en papillote aux légumes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : poisson
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 25 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_saumon`, `marmiton_top`

- **Arbitrage canonique** : La papillote limite le dessèchement et concentre les arômes.

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

#### Méthode canonique

1. Tailler les légumes en julienne fine et les précuire 5 minutes à la poêle.
2. Répartir légumes, saumon, citron, huile et aneth dans quatre papillotes.
3. Fermer hermétiquement et cuire 14 à 18 minutes à 180 °C selon l’épaisseur.
4. Ouvrir prudemment ; viser une température à cœur de 52–55 °C pour une texture nacrée ou 63 °C pour une cuisson complète.

**Techniques** : julienne, précuisson, cuisson en papillote, contrôle température.

**Variantes candidates** : Cabillaud : viser 60–63 °C ; fenouil à la place du poireau.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : agrume
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pavé de saumon cru, sans peau, Courgette fraîche, Carotte crue, Poireau cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 1 jour au réfrigérateur après cuisson.
- **Allergènes structurels** : poisson

---

### FR-011 — Cabillaud au beurre citronné, riz et haricots verts

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : poisson
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 30 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Les branches de féculent doivent porter leurs propres temps et volumes d’eau.

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

#### Méthode canonique

1. Cuire le riz par absorption selon sa variété.
2. Cuire les haricots verts à l’eau salée puis les rafraîchir brièvement.
3. Saisir doucement le cabillaud dans l’huile, puis terminer couvert avec un filet de citron.
4. Viser 60–63 °C à cœur. Monter le jus avec le beurre et le persil.
5. Servir immédiatement avec riz et haricots.

**Techniques** : cuisson par absorption, blanchiment, saisie douce, cuisson couverte, émulsion au beurre.

**Variantes candidates** : Riz complet : branche 30–35 minutes et davantage d’eau ; quinoa.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : beurre, agrume
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Dos de cabillaud cru, Riz long blanc cru, Haricot vert cru, Citron jaune frais
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 1 jour au réfrigérateur.
- **Allergènes structurels** : lait, poisson

---

### VEG-001 — Lentilles vertes mijotées aux légumes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : légumineuses
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Forme exigée : lentille sèche crue, jamais lentille déjà cuite.

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

#### Méthode canonique

1. Faire suer oignon, carotte et céleri dans l’huile.
2. Ajouter lentilles rincées, ail, thym et laurier ; couvrir de trois fois leur volume d’eau.
3. Cuire à frémissement 25 à 35 minutes selon la variété.
4. Saler vers la fin, égoutter si nécessaire et finir avec le vinaigre.

**Techniques** : suer, mijotage, assaisonnement tardif, acidification.

**Variantes candidates** : Lardons ajoutés séparément ; œuf mollet ; moutarde dans la vinaigrette.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, oignon_compoté, vin_rouge_réduit, thym, laurier
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Lentille verte sèche, crue, Carotte crue, Oignon jaune cru, Céleri branche cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base, céleri

---

### VEG-002 — Salade de pois chiches, tomate et concombre

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : salade
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 0 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Toutes les matières grasses et acidifiants sont explicitement listés.

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

#### Méthode canonique

1. Rincer et égoutter soigneusement les pois chiches.
2. Couper tomate et concombre, émincer l’oignon et hacher le persil.
3. Émulsionner huile, citron, cumin, sel et poivre.
4. Mélanger et laisser reposer 20 minutes au frais.

**Techniques** : égouttage, taillage, émulsion, marinade courte.

**Variantes candidates** : Feta ; poivron ; menthe ; vinaigre à la place du citron.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, cumin
- **Textures cibles** : croquant_frais, éléments_distincts
- **Ingrédients signatures** : Pois chiche cuit, égoutté, Tomate fraîche mûre, Concombre frais, Oignon rouge cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### EGG-001 — Omelette aux fines herbes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : œufs
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 2
- **Temps** : préparation 8 min · cuisson 6 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : La matière grasse de cuisson est obligatoire dans la recette canonique.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 4 | u | protéine | non |
| Beurre doux | 15 | g | cuisson | non |
| Persil frais | 8 | g | aromate | non |
| Ciboulette fraîche | 8 | g | aromate | non |
| Sel fin | 2 | g | assaisonnement | oui |
| Poivre noir moulu | 0.5 | g | assaisonnement | oui |

#### Méthode canonique

1. Battre les œufs juste assez pour homogénéiser, puis ajouter les herbes.
2. Chauffer le beurre jusqu’à mousse légère.
3. Verser les œufs, remuer les parties prises vers le centre et arrêter lorsque la surface reste légèrement humide.
4. Plier et servir immédiatement.

**Techniques** : battage, cuisson à la poêle, coagulation contrôlée, pliage.

**Variantes candidates** : Fromage ; champignons poêlés ; fines herbes différentes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Œuf cru, Beurre doux, Persil frais, Ciboulette fraîche
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : lait, œuf

---

### VEG-003 — Quinoa aux légumes rôtis

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : céréales et légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Quinoa cru distinct du quinoa déjà cuit.

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

#### Méthode canonique

1. Rincer le quinoa puis le cuire par absorption dans environ 1,8 fois son volume d’eau.
2. Tailler les légumes, les mélanger avec huile, cumin et sel puis les rôtir 25 minutes à 210 °C.
3. Égrener le quinoa, incorporer légumes, citron et persil.

**Techniques** : rinçage, cuisson par absorption, rôtissage, égrenage.

**Variantes candidates** : Boulgour ; semoule ; feta ; pois chiches.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, agrume, cumin
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Quinoa cru, Courgette fraîche, Poivron rouge frais, Carotte crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### IND-001 — Curry de pois chiches et épinards

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : curry végétarien
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Faire suer l’oignon, puis ajouter ail, gingembre et épices ; cuire jusqu’à parfum.
2. Ajouter tomate et lait de coco, puis mijoter 15 minutes.
3. Ajouter pois chiches et cuire 10 minutes.
4. Incorporer les épinards jusqu’à tombée, finir au citron.

**Techniques** : suer, torréfaction des épices, mijotage, tombée des épinards.

**Variantes candidates** : Lentilles ; chou-fleur ; yaourt en finition non vegan.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, cumin, gingembre, coco
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Pois chiche cuit, égoutté, Épinard frais, Tomate concassée en conserve, Lait de coco
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base, lait

---

### IND-002 — Dahl de lentilles corail

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : curry végétarien
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Rincer les lentilles jusqu’à eau presque claire.
2. Faire revenir cumin, oignon, ail et gingembre dans l’huile.
3. Ajouter curcuma, tomate, lentilles, lait de coco et 500 ml d’eau.
4. Mijoter 25 minutes en remuant, jusqu’à texture crémeuse.
5. Ajouter garam masala et citron en fin de cuisson.

**Techniques** : rinçage, torréfaction, mijotage, liaison par amidon.

**Variantes candidates** : Épinards ; carotte ; version sans coco avec bouillon.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, cumin, gingembre, coco
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Lentille corail sèche, crue, Tomate concassée en conserve, Lait de coco, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base, lait

---

### MED-001 — Shakshuka

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : œufs et tomate
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Faire fondre oignon et poivron dans l’huile.
2. Ajouter ail et épices, puis tomate ; mijoter 20 minutes jusqu’à sauce épaisse.
3. Creuser six cavités, casser les œufs et couvrir.
4. Cuire 6 à 10 minutes selon la prise souhaitée ; finir au persil.

**Techniques** : suer, mijotage, œufs pochés en sauce.

**Variantes candidates** : Feta ; pois chiches ; aubergine rôtie.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, cumin, paprika, piment, fumé
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Œuf cru, Tomate concassée en conserve, Poivron rouge frais, Oignon jaune cru
- **Garde-fous / dérives interdites** : œufs_cuits_dans_sauce_tomate_poivron, cumin_et_paprika, sauce_épaisse
- **Conservation** : 2 jours pour la sauce seule ; œufs à cuire au moment.
- **Allergènes structurels** : œuf

---

### LEV-001 — Houmous

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : tartinade
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 0 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Mixer tahini et citron jusqu’à épaississement, puis ajouter l’eau glacée progressivement.
2. Ajouter pois chiches, ail, cumin et sel ; mixer longuement jusqu’à texture lisse.
3. Ajuster avec eau et servir avec huile d’olive.

**Techniques** : émulsion, mixage fin, ajustement de texture.

**Variantes candidates** : Betterave ; poivron rôti ; haricot blanc.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, agrume, cumin
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pois chiche cuit, égoutté, Tahini, Jus de citron frais, Ail cru
- **Garde-fous / dérives interdites** : pois_chiche, tahini, citron, texture_lisse
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : sésame

---

### LEV-002 — Falafels au four

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : boulettes végétales
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Utiliser des pois chiches trempés non cuits, sinon la pâte devient trop molle.

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

#### Méthode canonique

1. Faire tremper les pois chiches secs 18 à 24 heures, puis les égoutter parfaitement.
2. Mixer grossièrement avec oignon, ail, herbes, épices, bicarbonate et sel.
3. Reposer 30 minutes, former des boulettes et les huiler légèrement.
4. Cuire 20 à 25 minutes à 210 °C en retournant à mi-cuisson.

**Techniques** : trempage, hachage, repos, façonnage, cuisson au four.

**Variantes candidates** : Friture traditionnelle ; fèves sèches en mélange.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, coriandre, cumin
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pois chiche sec, cru, Oignon jaune cru, Ail cru, Persil frais
- **Garde-fous / dérives interdites** : pois_chiches_trempés_non_cuits, herbes_et_cumin, pas_de_pois_chiches_en_conserve_pour_la_pâte
- **Conservation** : 3 jours au réfrigérateur ; congélation avant ou après cuisson.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base

---

### IT-002 — Risotto aux champignons

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz crémeux
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Le risotto fini doit être fluide, non compact.

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

#### Méthode canonique

1. Poêler les champignons à feu vif et réserver.
2. Faire suer l’échalote, nacrer le riz puis déglacer au vin.
3. Ajouter le bouillon chaud progressivement en remuant régulièrement pendant 17 à 19 minutes.
4. Hors du feu, incorporer beurre, parmesan et champignons ; couvrir 2 minutes.
5. Ajuster la texture avec un peu de bouillon et finir au persil.

**Techniques** : poêlage, nacrage, déglaçage, cuisson par mouillage progressif, mantecatura.

**Variantes candidates** : Cèpes ; courge ; asperges ; orge perlé.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : échalote, vin_blanc_réduit, champignon_terreux, beurre, parmesan
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Riz arborio cru, Champignon de Paris frais, Bouillon de légumes non salé, Échalote crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur, mais meilleur immédiatement.
- **Allergènes structurels** : lait

---

### IT-003 — Spaghetti carbonara

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : La crème est exclue de la version canonique.

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

#### Méthode canonique

1. Faire fondre et dorer doucement le guanciale ; conserver sa graisse.
2. Mélanger jaunes, œuf, pecorino râpé et poivre fraîchement moulu.
3. Cuire les spaghetti très al dente et conserver l’eau de cuisson.
4. Hors du feu, mélanger pâtes et guanciale, puis incorporer l’appareil aux œufs avec un peu d’eau de cuisson.
5. Remuer jusqu’à sauce crémeuse sans coagulation ; servir immédiatement.

**Techniques** : rendu de graisse, cuisson al dente, émulsion hors feu, tempérage.

**Variantes candidates** : Pancetta si guanciale indisponible ; aucune crème dans la version canonique.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : aromates_cuits, matière_grasse_chauffée
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Spaghetti secs, Guanciale cru, Jaune d'œuf cru, Œuf cru
- **Garde-fous / dérives interdites** : pas_de_crème, œufs_hors_du_feu, pecorino_ou_parmesan_affiné, guanciale_ou_pancetta
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait, œuf

---

### IT-004 — Spaghetti à la sauce bolognaise

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : pâtes en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 100 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_lasagne`, `marmiton_top`

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

#### Méthode canonique

1. Faire suer oignon, carotte et céleri très finement hachés.
2. Ajouter le bœuf, le colorer puis déglacer au vin.
3. Ajouter la tomate et mijoter au moins 75 minutes.
4. Cuire les pâtes al dente et les mélanger avec une partie de la sauce.
5. Servir avec parmesan facultatif.

**Techniques** : soffritto, saisie, déglaçage, mijotage, cuisson al dente.

**Variantes candidates** : Porc et bœuf ; lentilles ; tagliatelles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, tomate_cuite, parmesan
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Spaghetti secs, Bœuf haché cru 15 % MG, Tomate concassée en conserve, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours pour la sauce ; congélation 3 mois.
- **Allergènes structurels** : céleri, gluten, lait

---

### IT-005 — Pâtes au pesto

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Mixer ou piler basilic, ail, pignons et parmesan sans chauffer excessivement.
2. Ajouter l’huile progressivement.
3. Cuire les pâtes al dente et réserver un peu d’eau.
4. Détendre le pesto avec l’eau de cuisson et mélanger hors du feu.

**Techniques** : pilonnage, émulsion, cuisson al dente, liaison à l'eau de cuisson.

**Variantes candidates** : Noix ; amande ; pesto de roquette.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, parmesan, basilic
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pâtes sèches courtes, Basilic frais, Parmesan affiné, Pignon de pin
- **Garde-fous / dérives interdites** : basilic_dominant, huile_olive, fromage_affiné, ne_pas_cuire_le_pesto
- **Conservation** : 2 jours pour le pesto sous une fine couche d’huile.
- **Allergènes structurels** : fruits à coque, gluten, lait

---

### IT-006 — Gnocchi tomate et mozzarella

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : pâtes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 30 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Faire suer oignon et ail, ajouter tomate et mijoter 20 minutes.
2. Pocher les gnocchi jusqu’à remontée, les égoutter.
3. Mélanger gnocchi et sauce, couvrir de mozzarella.
4. Gratiner 10 minutes à 220 °C et finir au basilic.

**Techniques** : suer, mijotage, pochage, gratinage.

**Variantes candidates** : Épinards ; aubergine ; parmesan.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, basilic
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Gnocchi de pomme de terre frais, Tomate concassée en conserve, Mozzarella, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### IT-007 — Pizza margherita maison

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : pizza
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 40 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Pétrir farine, eau, levure, sel et huile jusqu’à pâte lisse.
2. Laisser fermenter 2 heures, puis diviser et détendre 30 minutes.
3. Écraser les tomates avec un peu de sel.
4. Étaler sans rouleau, garnir légèrement de tomate et mozzarella égouttée.
5. Cuire sur pierre ou plaque très chaude à la température maximale du four, puis ajouter le basilic.

**Techniques** : pétrissage, fermentation, façonnage, cuisson haute température.

**Variantes candidates** : Pâte maturée 24 h au froid ; légumes grillés.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : tomate_cuite, basilic
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Farine de blé type 00, Eau, Levure boulangère sèche, Sel fin
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : À consommer immédiatement ; pâte crue 48 h au froid.
- **Allergènes structurels** : gluten, lait

---

### FR-012 — Soupe à l’oignon gratinée

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 75 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`, `serious_stews`

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

#### Méthode canonique

1. Émincer les oignons et les cuire très doucement au beurre 40 à 50 minutes jusqu’à brunissement profond.
2. Ajouter éventuellement la farine, puis déglacer au vin.
3. Ajouter bouillon et thym, mijoter 25 minutes.
4. Répartir dans des bols, couvrir de pain grillé et de comté.
5. Gratiner vivement jusqu’à coloration.

**Techniques** : caramélisation lente, déglaçage, mijotage, gratinage.

**Variantes candidates** : Bouillon de légumes ; gruyère.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, vin_blanc_réduit, beurre, comté, thym
- **Textures cibles** : liquide_nappant, éléments_tendres
- **Ingrédients signatures** : Oignon jaune cru, Bouillon de bœuf non salé, Vin blanc sec, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours pour la soupe sans croûtons.
- **Allergènes structurels** : gluten, lait

---

### FR-013 — Velouté de champignons

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : soupe
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Colorer une petite partie des champignons pour la garniture et réserver.
2. Faire suer oignon et reste des champignons au beurre.
3. Ajouter pomme de terre, thym et bouillon ; cuire 25 minutes.
4. Mixer finement, ajouter crème et rectifier.
5. Servir avec les champignons colorés.

**Techniques** : coloration, suer, cuisson au bouillon, mixage, finition crème.

**Variantes candidates** : Sans crème ; cèpes ; noisettes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, champignon_terreux, beurre, lacté, thym
- **Textures cibles** : liquide_nappant, éléments_tendres
- **Ingrédients signatures** : Champignon de Paris frais, Pomme de terre crue, épluchée, Oignon jaune cru, Bouillon de légumes non salé
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation sans crème.
- **Allergènes structurels** : lait

---

### FR-014 — Velouté de potimarron

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : soupe
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Faire suer l’oignon, ajouter potimarron et pomme de terre en cubes.
2. Mouiller au bouillon et cuire 30 minutes.
3. Mixer très finement, ajouter éventuellement la crème.
4. Rectifier muscade et sel.

**Techniques** : suer, cuisson au bouillon, mixage.

**Variantes candidates** : Lait de coco et curry ; carotte ; graines de courge.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, lacté
- **Textures cibles** : liquide_nappant, éléments_tendres
- **Ingrédients signatures** : Potimarron frais, épépiné, Pomme de terre crue, épluchée, Oignon jaune cru, Bouillon de légumes non salé
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : lait

---

### IT-008 — Minestrone

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe complète
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : facile
- **Sources-signaux** : `serious_stews`, `marmiton_top`

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

#### Méthode canonique

1. Faire suer oignon, carotte, céleri et poireau.
2. Ajouter tomate et bouillon ; mijoter 30 minutes.
3. Ajouter courgette, haricots et pâtes ; cuire jusqu’à pâtes al dente.
4. Finir au basilic et servir avec parmesan facultatif.

**Techniques** : suer, mijotage séquencé, cuisson des pâtes dans le bouillon.

**Variantes candidates** : Riz ; chou ; pesto en finition.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : oignon_compoté, tomate_cuite, parmesan, basilic
- **Textures cibles** : liquide_nappant, éléments_tendres
- **Ingrédients signatures** : Haricot blanc cuit, égoutté, Petites pâtes sèches, Tomate concassée en conserve, Carotte crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; les pâtes absorbent le bouillon.
- **Allergènes structurels** : céleri, gluten, lait

---

### FR-015 — Pot-au-feu

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat bouilli
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 210 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`, `serious_beef`

- **Arbitrage canonique** : Produit plusieurs sous-produits : bouillon, viande cuite, légumes, moelle.

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

#### Méthode canonique

1. Départ à froid : couvrir viandes et os d’eau. Monter lentement à frémissement et écumer soigneusement.
2. Ajouter oignon piqué de girofle, céleri et bouquet garni ; cuire 2 heures à très petit frémissement.
3. Ajouter carottes, navets et poireaux selon leur temps de cuisson et poursuivre environ 1 heure.
4. Cuire les os à moelle protégés dans une mousseline ou séparément.
5. Servir bouillon, viandes, légumes, moutarde et cornichons.

**Techniques** : départ à froid, écumage, pochage long, cuisson séquencée.

**Variantes candidates** : Poulet en complément ; pommes de terre cuites à part.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Paleron de bœuf cru, paré, Jarret de bœuf cru, avec os, Os à moelle de bœuf, Carotte crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; dégraisser le bouillon à froid.
- **Allergènes structurels** : aucun allergène majeur déclaré par la structure de base, céleri

---

### FR-016 — Coq au vin

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 150 min
- **Difficulté** : facile
- **Sources-signaux** : `serious_stews`, `marmiton_top`

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

#### Méthode canonique

1. Saisir les morceaux de poulet et réserver.
2. Faire revenir lardons, carotte et oignon ; ajouter farine.
3. Déglacer au vin, remettre le poulet et le bouquet garni.
4. Braiser doucement 75 à 90 minutes.
5. Poêler champignons et oignons grelots séparément puis les ajouter en fin de cuisson.
6. Réduire la sauce et vérifier 75 °C à cœur.

**Techniques** : saisie, déglaçage, braisage, garniture séparée, réduction.

**Variantes candidates** : Vin blanc ; sans lardons ; véritable coq avec cuisson plus longue.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, champignon_terreux, fumé
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Vin rouge sec, Lardon fumé cru, Champignon de Paris frais
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : gluten

---

### FR-017 — Poulet rôti et pommes de terre

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : rôti
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Génère carcasse et jus pour bouillon et sauce.

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

#### Méthode canonique

1. Saler le poulet à l’avance si possible. Tempérer 30 minutes avant cuisson.
2. Garnir la cavité de citron, ail et thym ; masser la peau avec beurre et huile.
3. Disposer pommes de terre et oignons autour.
4. Rôtir à 210 °C 20 minutes puis à 180 °C jusqu’à 75 °C dans la cuisse.
5. Reposer 15 minutes avant découpe, puis déglacer le plat avec un peu d’eau.

**Techniques** : salage anticipé, rôtissage, arrosage, contrôle température, repos, déglaçage.

**Variantes candidates** : Poulet en crapaudine ; légumes racines ; herbes différentes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, beurre, agrume, thym
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Poulet entier cru, prêt à cuire, Pomme de terre crue, avec peau, Oignon jaune cru, Ail cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### FR-018 — Filet mignon de porc à la moutarde

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : viande en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Parer et couper le filet mignon en médaillons épais.
2. Saisir rapidement les médaillons et réserver.
3. Faire suer l’échalote, déglacer au vin et réduire.
4. Ajouter moutarde et crème, remettre le porc et cuire doucement jusqu’à 63–65 °C à cœur.
5. Reposer 5 minutes et servir.

**Techniques** : parage, saisie, déglaçage, réduction, cuisson contrôlée.

**Variantes candidates** : Cuisson du filet entier au four ; champignons.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : échalote, vin_blanc_réduit, lacté, moutarde, thym
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Filet mignon de porc cru, Moutarde de Dijon, Crème fraîche épaisse, Échalote crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### FR-019 — Boulettes de bœuf sauce tomate

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : boulettes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 50 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Tremper la chapelure dans le lait, puis mélanger délicatement avec viande, œuf, parmesan et persil.
2. Former des boulettes sans trop compacter et les colorer.
3. Faire suer oignon et ail, ajouter tomate et mijoter 15 minutes.
4. Ajouter les boulettes et poursuivre 20 minutes jusqu’à cuisson complète.

**Techniques** : panade, façonnage, saisie, mijotage.

**Variantes candidates** : Porc et bœuf ; dinde ; lentilles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, parmesan
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Bœuf haché cru 15 % MG, Œuf cru, Chapelure de blé, Lait demi-écrémé
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : gluten, lait, œuf

---

### GR-001 — Moussaka

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : gratin complet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Trancher, saler puis rôtir les aubergines jusqu’à tendreté.
2. Faire revenir oignon, ail et agneau ; déglacer au vin, ajouter tomate et cannelle puis réduire.
3. Préparer une béchamel épaisse, la laisser tiédir puis incorporer les œufs.
4. Monter aubergines, sauce à la viande et béchamel.
5. Parsemer de parmesan et cuire 40 minutes à 180 °C. Reposer 20 minutes.

**Techniques** : dégorgement, rôtissage, saisie, déglaçage, réduction, béchamel, montage, gratinage.

**Variantes candidates** : Bœuf ; pommes de terre ; lentilles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, oignon_compoté, vin_rouge_réduit, tomate_cuite, beurre, parmesan, cannelle
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Aubergine fraîche, Agneau haché cru, Tomate concassée en conserve, Oignon jaune cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation 2 mois.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-020 — Gratin de courgettes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : gratin de légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Trancher les courgettes et les poêler pour évaporer une partie de leur eau.
2. Mélanger œufs, crème, ail, muscade et la moitié du fromage.
3. Disposer les courgettes, verser l’appareil et couvrir du reste de fromage.
4. Cuire 30 à 35 minutes à 185 °C.

**Techniques** : poêlage, évaporation, appareil à crème prise, gratinage.

**Variantes candidates** : Chèvre ; riz cuit en fond ; tomate.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, lacté, comté
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Courgette fraîche, Œuf cru, Crème fraîche liquide entière, Comté
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, œuf

---

### FR-021 — Fondue de poireaux

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : accompagnement
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 30 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Laver soigneusement et émincer les poireaux.
2. Les faire tomber au beurre avec une pincée de sel.
3. Couvrir et cuire doucement 20 minutes, puis découvrir pour évaporer.
4. Ajouter crème, moutarde et citron ; cuire encore 3 minutes.

**Techniques** : lavage, tombée, étuvée, réduction.

**Variantes candidates** : Sans crème ; curry ; servir avec poisson.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre, lacté, moutarde, agrume
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Poireau cru, Beurre doux, Crème fraîche épaisse, Jus de citron frais
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### FR-022 — Endives au jambon

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : gratin complet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 55 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Cuire les endives à la vapeur ou à l’étouffée, puis les presser soigneusement.
2. Préparer une béchamel et l’assaisonner de muscade.
3. Enrouler chaque endive dans une tranche de jambon.
4. Napper de béchamel, couvrir de fromage et gratiner 25 minutes à 190 °C.

**Techniques** : vapeur, égouttage, béchamel, montage, gratinage.

**Variantes candidates** : Poireaux ; dinde ; sauce légère.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre, comté
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Endive fraîche, Jambon blanc cuit, Lait demi-écrémé, Farine de blé T55
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### FR-023 — Croque-monsieur

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : sandwich chaud
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain de mie | 8 | tranche | base | non |
| Jambon blanc cuit | 4 | tranche | protéine | non |
| Comté | 160 | g | fromage | non |
| Béchamel préparée | 240 | g | sauce | non |
| Beurre doux | 20 | g | cuisson | non |
| Moutarde de Dijon | 15 | g | condiment | oui |

#### Méthode canonique

1. Tartiner légèrement le pain de moutarde facultative.
2. Garnir de jambon et d’une partie du fromage, fermer.
3. Napper de béchamel et couvrir du reste de fromage.
4. Cuire 10 à 12 minutes à 200 °C puis gratiner.

**Techniques** : montage, cuisson au four, gratinage.

**Variantes candidates** : Croque-madame avec œuf ; version poêlée sans béchamel.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre, comté, moutarde
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pain de mie, Jambon blanc cuit, Comté, Béchamel préparée
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait, moutarde

---

### DESS-001 — Crêpes fines

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : dessert et petit-déjeuner
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Mélanger farine, sucre et sel. Ajouter les œufs puis le lait progressivement.
2. Incorporer le beurre fondu et le rhum facultatif.
3. Laisser reposer 30 minutes.
4. Cuire en fine couche dans une poêle légèrement graissée.

**Techniques** : mélange, repos, cuisson à la poêle.

**Variantes candidates** : Sarrasin salé ; sans lactose ; zeste d’orange.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Farine de blé T55, Œuf cru, Lait demi-écrémé, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-002 — Pancakes moelleux

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : petit-déjeuner
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Mélanger les ingrédients secs.
2. Mélanger œufs, lait et beurre fondu, puis incorporer sans travailler excessivement.
3. Reposer 15 minutes.
4. Cuire de petites louches à feu moyen ; retourner lorsque des bulles apparaissent.

**Techniques** : mélange limité, repos, cuisson à la poêle.

**Variantes candidates** : Myrtilles ; banane ; farine semi-complète.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Farine de blé T55, Œuf cru, Lait demi-écrémé, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-003 — Gâteau au yaourt

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : gâteau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Fouetter œufs et sucre, puis ajouter yaourt et huile.
2. Incorporer farine, levure et sel sans trop mélanger.
3. Verser dans un moule graissé.
4. Cuire 30 à 35 minutes à 175 °C.

**Techniques** : foisonnement léger, mélange, cuisson au four.

**Variantes candidates** : Pommes ; citron ; chocolat.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 0/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 0/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 2/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : fruité, frais, acidulé
- **Aromas signatures** : vanille
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Yaourt nature, Farine de blé T55, Sucre semoule, Œuf cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours à température ambiante bien emballé.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-004 — Tiramisu classique

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : dessert froid
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Œufs pasteurisés recommandés pour les publics à risque.

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

#### Méthode canonique

1. Séparer les œufs. Fouetter jaunes et sucre, puis incorporer le mascarpone.
2. Monter les blancs et les incorporer délicatement.
3. Imbiber brièvement les biscuits dans le café aromatisé.
4. Monter en couches biscuits et crème.
5. Réfrigérer au moins 8 heures puis poudrer de cacao.

**Techniques** : foisonnement, incorporation délicate, imbibage, montage, repos froid.

**Variantes candidates** : Œufs pasteurisés ; spéculoos ; fruits rouges.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 0/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 0/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 2/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : fruité, frais, acidulé
- **Aromas signatures** : café
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Mascarpone, Œuf cru, Sucre semoule, Biscuit cuillère
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-005 — Mousse au chocolat

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : dessert froid
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

- **Arbitrage canonique** : Œufs pasteurisés recommandés pour les publics à risque.

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chocolat noir 70 % | 250 | g | base | non |
| Œuf cru | 6 | u | structure | non |
| Beurre doux | 25 | g | texture | oui |
| Sucre semoule | 20 | g | équilibre | oui |
| Sel fin | 1 | g | assaisonnement | non |

#### Méthode canonique

1. Faire fondre doucement le chocolat avec le beurre facultatif.
2. Séparer les œufs et incorporer les jaunes au chocolat tiédi.
3. Monter les blancs avec le sel et éventuellement le sucre.
4. Incorporer les blancs en trois fois sans les casser.
5. Réfrigérer au moins 4 heures.

**Techniques** : fusion douce, tempérage, montage des blancs, incorporation, prise au froid.

**Variantes candidates** : Sans beurre ; zestes d’orange ; café.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, cacao
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Chocolat noir 70 %, Œuf cru, Sel fin
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-006 — Flan pâtissier vanille

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtisserie
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 35 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Foncer un cercle haut avec la pâte et réserver au froid.
2. Infuser la vanille dans lait et crème.
3. Fouetter œufs, jaunes, sucre et fécule. Verser le liquide chaud progressivement.
4. Remettre sur le feu et cuire jusqu’à épaississement marqué.
5. Ajouter le beurre, verser dans le fond et cuire 45 à 55 minutes à 180 °C.
6. Refroidir complètement puis réfrigérer avant découpe.

**Techniques** : fonçage, infusion, tempérage, cuisson crème, cuisson au four, prise au froid.

**Variantes candidates** : Sans pâte ; chocolat ; praliné.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, lacté, vanille
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte brisée crue, Lait entier, Crème fraîche liquide entière, Œuf cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-007 — Crumble aux pommes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : dessert
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Éplucher et couper les pommes, les mélanger avec citron et cannelle.
2. Sabler farine, beurre, cassonade et sel en morceaux irréguliers.
3. Répartir le crumble sur les pommes sans tasser.
4. Cuire 35 à 40 minutes à 180 °C jusqu’à fruit tendre et dessus doré.

**Techniques** : taillage, sablage, cuisson au four.

**Variantes candidates** : Poire ; fruits rouges ; poudre d’amande.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : ail, beurre, agrume, cannelle
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pomme fraîche, Farine de blé T55, Beurre doux, Cassonade
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ou 2 jours à température fraîche.
- **Allergènes structurels** : gluten, lait

---

### DESS-008 — Riz au lait vanille

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : dessert
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 10 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz rond blanc cru | 180 | g | base | non |
| Lait entier | 1200 | ml | cuisson | non |
| Sucre semoule | 110 | g | sucre | non |
| Gousse de vanille | 1 | u | arôme | non |
| Sel fin | 1 | g | assaisonnement | non |

#### Méthode canonique

1. Rincer rapidement le riz puis le blanchir 2 minutes dans l’eau ; égoutter.
2. Porter le lait avec vanille à frémissement.
3. Ajouter le riz et cuire très doucement 35 à 45 minutes en remuant.
4. Ajouter le sucre en fin de cuisson et refroidir.

**Techniques** : blanchiment, cuisson lente au lait, remuage.

**Variantes candidates** : Caramel ; cannelle ; zestes d’agrumes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 0/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 0/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 2/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : fruité, frais, acidulé
- **Aromas signatures** : vanille
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Riz rond blanc cru, Lait entier, Sucre semoule, Gousse de vanille
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### FR-024 — Béchamel de base

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : sauce de base
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 10 min · cuisson 15 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`, `marmiton_blanquette`, `marmiton_lasagne`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Beurre doux | 60 | g | roux | non |
| Farine de blé T55 | 60 | g | roux | non |
| Lait demi-écrémé | 750 | ml | liquide | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | non |
| Poivre blanc moulu | 0.5 | g | assaisonnement | oui |

#### Méthode canonique

1. Faire fondre le beurre, ajouter la farine et cuire le roux 2 minutes sans coloration.
2. Ajouter le lait froid progressivement en fouettant.
3. Porter à frémissement et cuire 5 à 8 minutes.
4. Assaisonner de muscade, sel et poivre.

**Techniques** : roux blanc, mouillage progressif, cuisson de sauce.

**Variantes candidates** : Mornay avec fromage ; version huile végétale.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Beurre doux, Farine de blé T55, Lait demi-écrémé, Muscade moulue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur, filmée au contact.
- **Allergènes structurels** : gluten, lait

---

### FR-025 — Purée de pommes de terre

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : accompagnement
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_hachis`, `bbc_bourguignon`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 1200 | g | féculent | non |
| Beurre doux | 100 | g | matière grasse | non |
| Lait entier | 250 | ml | liquide | non |
| Sel fin | 8 | g | assaisonnement | non |
| Muscade moulue | 0.5 | g | épice | oui |

#### Méthode canonique

1. Cuire les pommes de terre à l’eau salée jusqu’à tendreté.
2. Égoutter et dessécher une minute sur feu doux.
3. Passer au presse-purée, incorporer beurre puis lait chaud.
4. Ajuster la texture et servir immédiatement.

**Techniques** : cuisson à l'eau, dessiccation, écrasement, émulsion.

**Variantes candidates** : Huile d’olive ; ail rôti ; céleri-rave.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Beurre doux, Lait entier, Sel fin
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### FR-026 — Haricots verts persillés

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : accompagnement
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 15 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot vert cru | 700 | g | légume | non |
| Beurre doux | 25 | g | finition | non |
| Ail cru | 8 | g | aromatique | non |
| Persil frais | 20 | g | aromate | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Méthode canonique

1. Équeuter les haricots et les cuire dans une grande eau salée 7 à 10 minutes.
2. Rafraîchir brièvement si service différé, puis égoutter.
3. Faire mousser le beurre avec l’ail, ajouter les haricots et sauter 2 minutes.
4. Finir au persil.

**Techniques** : blanchiment, rafraîchissement, sauter, beurre persillé.

**Variantes candidates** : Huile d’olive ; amandes grillées.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Haricot vert cru, Beurre doux, Ail cru, Persil frais
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### FR-027 — Pommes de terre sautées

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : accompagnement
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, avec peau | 900 | g | féculent | non |
| Huile de colza raffinée | 35 | ml | cuisson | non |
| Beurre doux | 20 | g | finition | non |
| Ail cru | 8 | g | aromatique | non |
| Persil frais | 15 | g | aromate | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Méthode canonique

1. Couper les pommes de terre en cubes réguliers, les rincer puis les sécher.
2. Les précuire 6 minutes à l’eau ou à la vapeur.
3. Les sauter dans l’huile à feu moyen-vif jusqu’à coloration.
4. Ajouter beurre, ail et persil en fin de cuisson.

**Techniques** : rinçage, précuisson, sauter, finition aromatique.

**Variantes candidates** : Graisse de canard ; paprika ; oignon.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Pomme de terre crue, avec peau, Huile de colza raffinée, Beurre doux, Ail cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### FR-028 — Cake jambon et olives

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : cake salé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Mélanger farine et levure.
2. Incorporer œufs, lait et huile sans trop travailler.
3. Ajouter jambon, olives égouttées et fromage.
4. Verser dans un moule et cuire 40 à 45 minutes à 175 °C.

**Techniques** : mélange, incorporation de garniture, cuisson au four.

**Variantes candidates** : Feta et courgette ; thon et tomate ; lardons.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : comté
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Farine de blé T55, Œuf cru, Lait demi-écrémé, Huile d'olive vierge extra
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ; congélation en tranches.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-009 — Banana bread

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : gâteau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 20 min · cuisson 55 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Écraser les bananes.
2. Mélanger beurre fondu, cassonade et œufs, puis ajouter les bananes.
3. Incorporer les ingrédients secs juste jusqu’à disparition de la farine.
4. Cuire 50 à 60 minutes à 170 °C.

**Techniques** : écrasement, mélange limité, cuisson au four.

**Variantes candidates** : Noix ; chocolat ; huile à la place du beurre.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : beurre, cannelle
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Banane mûre, Farine de blé T55, Œuf cru, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 5 jours bien emballé ; congélation 3 mois.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-010 — Fondant au chocolat

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : gâteau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 15 min · cuisson 22 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chocolat noir 70 % | 250 | g | base | non |
| Beurre doux | 180 | g | matière grasse | non |
| Œuf cru | 5 | u | structure | non |
| Sucre semoule | 140 | g | sucre | non |
| Farine de blé T55 | 60 | g | structure | non |
| Sel fin | 1 | g | assaisonnement | non |

#### Méthode canonique

1. Faire fondre chocolat et beurre doucement.
2. Fouetter œufs et sucre sans rechercher un fort foisonnement.
3. Incorporer le chocolat puis la farine et le sel.
4. Cuire 18 à 22 minutes à 175 °C selon le centre souhaité.
5. Refroidir au moins 20 minutes avant découpe.

**Techniques** : fusion douce, mélange, cuisson courte, repos.

**Variantes candidates** : Cœur coulant en ramequins ; noisette.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, cacao
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Chocolat noir 70 %, Beurre doux, Œuf cru, Sucre semoule
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur ou 2 jours à température fraîche.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-011 — Tarte au citron meringuée

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : tarte sucrée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 60 min · cuisson 40 min
- **Difficulté** : difficile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Foncer et cuire le fond à blanc.
2. Cuire jus et zestes de citron avec œufs, jaunes, sucre et fécule jusqu’à épaississement.
3. Hors du feu, incorporer le beurre et verser dans le fond refroidi.
4. Monter les blancs avec le sucre en meringue ferme.
5. Pocher sur la tarte et colorer au chalumeau ou sous le gril.

**Techniques** : fonçage, cuisson à blanc, crème citron, émulsion au beurre, meringue, pochage.

**Variantes candidates** : Meringue italienne plus stable ; tartelettes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, lacté, agrume
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte sablée crue, Citron jaune frais, Œuf cru, Jaune d'œuf cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-029 — Tarte thon, tomate et moutarde

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : tarte salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Foncer la pâte et étaler la moutarde.
2. Égoutter soigneusement le thon et les tomates tranchées.
3. Répartir thon et tomates.
4. Verser l’appareil œufs-crème, ajouter herbes et fromage facultatif.
5. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : fonçage, égouttage, montage, appareil à crème prise, cuisson au four.

**Variantes candidates** : Courgette ; tomate en conserve bien égouttée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : tomate_cuite, lacté, comté, moutarde
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte brisée crue, Thon au naturel en conserve, égoutté, Tomate fraîche mûre, Moutarde de Dijon
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, moutarde, poisson, œuf

---

### FR-030 — Clafoutis aux cerises

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : dessert
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Beurrer le plat et répartir les cerises.
2. Mélanger œufs, sucre, farine, lait, crème et vanille.
3. Verser sur les fruits.
4. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : appareil liquide, cuisson au four.

**Variantes candidates** : Prune ; poire ; abricot.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, lacté, vanille
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Cerise fraîche dénoyautée, Œuf cru, Lait entier, Crème fraîche liquide entière
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-031 — Gougères au fromage

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : pâte à choux salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Porter eau, beurre et sel à ébullition.
2. Ajouter la farine d’un coup et dessécher la panade.
3. Incorporer les œufs progressivement, puis le fromage.
4. Pocher sur plaque et cuire 22 à 25 minutes à 190 °C sans ouvrir le four au début.

**Techniques** : panade, dessiccation, incorporation des œufs, pochage, cuisson vapeur.

**Variantes candidates** : Gruyère ; herbes ; congélation crue pochée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : beurre, fromage_affiné, comté
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Eau, Beurre doux, Farine de blé T55, Œuf cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 2 jours ; réchauffer au four.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-032 — Tarte tatin aux pommes

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : tarte sucrée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme fraîche | 1200 | g | fruit | non |
| Pâte feuilletée crue | 300 | g | fond | non |
| Sucre semoule | 180 | g | caramel | non |
| Beurre doux | 100 | g | caramel | non |
| Vanille liquide | 5 | ml | arôme | oui |
| Sel fin | 1 | g | équilibre | non |

#### Méthode canonique

1. Préparer un caramel blond directement dans le moule ou une poêle allant au four.
2. Ajouter beurre et sel, puis ranger les pommes serrées.
3. Cuire les pommes 15 minutes sur le feu ou au four pour les attendrir.
4. Couvrir de pâte feuilletée en rentrant les bords.
5. Cuire 30 minutes à 190 °C puis retourner encore chaude avec précaution.

**Techniques** : caramel, précuisson fruit, montage inversé, cuisson au four, démoulage.

**Variantes candidates** : Poire ; coing ; endive salée distincte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, vanille
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pomme fraîche, Pâte feuilletée crue, Sucre semoule, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### FR-033 — Salade de lentilles, œuf mollet et moutarde

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : salade complète
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 30 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Cuire les lentilles avec la carotte jusqu’à tendreté, puis égoutter.
2. Cuire les œufs 6 minutes 30, les refroidir et les écaler.
3. Émulsionner moutarde, vinaigre et huiles.
4. Assaisonner les lentilles encore tièdes avec échalote et persil.
5. Servir avec les œufs mollets.

**Techniques** : mijotage, œuf mollet, émulsion, assaisonnement tiède.

**Variantes candidates** : Lardons ; feta ; noix.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : échalote, vin_rouge_réduit, moutarde
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Lentille verte sèche, crue, Œuf cru, Carotte crue, Échalote crue
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours pour les lentilles ; œufs 2 jours.
- **Allergènes structurels** : fruits à coque, moutarde, œuf

---

### FR-034 — Poireaux vinaigrette

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : entrée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Nettoyer les poireaux et les cuire à la vapeur jusqu’à tendreté.
2. Les égoutter et les presser légèrement.
3. Émulsionner moutarde, vinaigre et huile.
4. Napper les poireaux tièdes et ajouter éventuellement œufs durs hachés et persil.

**Techniques** : vapeur, égouttage, émulsion.

**Variantes candidates** : Câpres ; noisettes ; œufs mimosa.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : vin_rouge_réduit, moutarde
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Poireau cru, Moutarde de Dijon, Vinaigre de vin rouge, Huile de colza raffinée
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde, œuf

---

### FR-035 — Salade niçoise

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade complète
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 15 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Cuire pommes de terre, haricots et œufs séparément, puis refroidir.
2. Tailler tomates et oignon.
3. Assembler sans écraser : pommes de terre, haricots, tomate, thon, œufs, olives et anchois.
4. Assaisonner d’huile et vinaigre juste avant service.

**Techniques** : cuissons séparées, refroidissement, assemblage, vinaigrette.

**Variantes candidates** : Version sans pomme de terre selon tradition revendiquée ; poivron cru.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, tomate_cuite
- **Textures cibles** : croquant_frais, éléments_distincts
- **Ingrédients signatures** : Thon au naturel en conserve, égoutté, Œuf cru, Tomate fraîche mûre, Haricot vert cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 1 jour au réfrigérateur.
- **Allergènes structurels** : poisson, œuf

---

### FR-036 — Tarte aux poireaux et lardons

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : tarte salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Faire fondre longuement les poireaux au beurre.
2. Colorer légèrement les lardons et les égoutter.
3. Foncer la pâte et répartir poireaux et lardons.
4. Verser l’appareil œufs-crème-muscat.
5. Cuire 35 à 40 minutes à 180 °C.

**Techniques** : fondue, fonçage, appareil à crème prise, cuisson au four.

**Variantes candidates** : Saumon fumé ; chèvre ; sans lardons.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre, lacté, fumé
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte brisée crue, Poireau cru, Lardon fumé cru, Œuf cru
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### FR-037 — Parmentier de canard

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat complet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 40 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Réchauffer doucement le confit, retirer os et excès de graisse puis effilocher.
2. Faire suer les échalotes, ajouter le canard et le persil.
3. Préparer une purée souple.
4. Monter canard puis purée, parsemer de chapelure.
5. Cuire 25 minutes à 190 °C puis gratiner.

**Techniques** : effilochage, suer, purée, montage, gratinage.

**Variantes candidates** : Patate douce ; champignons ; noisettes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : échalote, beurre
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Confit de canard cuit, effiloché, Pomme de terre crue, épluchée, Lait entier, Beurre doux
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur ; congélation 2 mois.
- **Allergènes structurels** : gluten, lait

---

### FR-038 — Lapin à la moutarde

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : plat mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 75 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Enduire légèrement le lapin de moutarde et le saisir sans brûler le condiment.
2. Faire suer les échalotes, déglacer au vin.
3. Ajouter bouillon, thym et lapin ; couvrir et mijoter 55 à 65 minutes.
4. Retirer le lapin, réduire la sauce puis incorporer crème et reste de moutarde.

**Techniques** : saisie douce, déglaçage, braisage, réduction, finition crème.

**Variantes candidates** : Poulet ; estragon ; champignons.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, échalote, vin_blanc_réduit, lacté, moutarde, thym
- **Textures cibles** : protéine_fondante, sauce_nappante
- **Ingrédients signatures** : Lapin cru, découpé, Moutarde de Dijon, Crème fraîche épaisse, Vin blanc sec
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### FR-039 — Tarte aux pommes alsacienne

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `domestic_standard`
- **Catégorie** : tarte sucrée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Foncer la pâte et disposer les pommes en lamelles.
2. Cuire 20 minutes à 180 °C.
3. Mélanger œufs, crème, sucre, vanille et cannelle.
4. Verser l’appareil et poursuivre 20 à 25 minutes.

**Techniques** : fonçage, précuisson fruit, appareil à crème prise, cuisson au four.

**Variantes candidates** : Poire ; raisins secs ; poudre d’amande.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : lacté, cannelle, vanille
- **Textures cibles** : dessus_doré, intérieur_fondant_ou_crémeux
- **Ingrédients signatures** : Pâte brisée crue, Pomme fraîche, Œuf cru, Crème fraîche liquide entière
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### DESS-012 — Panna cotta vanille

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : dessert froid
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 5 min
- **Difficulté** : facile
- **Sources-signaux** : `marmiton_top`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Crème fraîche liquide entière | 600 | ml | base | non |
| Sucre semoule | 80 | g | sucre | non |
| Gélatine feuille | 8 | g | gélifiant | non |
| Gousse de vanille | 1 | u | arôme | non |

#### Méthode canonique

1. Réhydrater la gélatine dans l’eau froide.
2. Chauffer crème, sucre et vanille sans ébullition prolongée.
3. Hors du feu, incorporer la gélatine essorée.
4. Verser en verrines et réfrigérer au moins 5 heures.

**Techniques** : réhydratation, infusion, gélification, prise au froid.

**Variantes candidates** : Coulis fruits rouges ; café ; agar-agar avec protocole distinct.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 0/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 0/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 2/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : fruité, frais, acidulé
- **Aromas signatures** : lacté, vanille
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Crème fraîche liquide entière, Sucre semoule, Gélatine feuille, Gousse de vanille
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### FR-040 — Madeleines au miel

- **Cuisine / origine** : France / cuisine domestique internationale
- **Identité** : `named_traditional_dish`
- **Catégorie** : petit gâteau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 24
- **Temps** : préparation 25 min · cuisson 12 min
- **Difficulté** : moyenne
- **Sources-signaux** : `marmiton_top`

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

#### Méthode canonique

1. Fouetter œufs, sucre et miel, puis ajouter farine, levure et sel.
2. Incorporer le beurre noisette tiédi et le zeste.
3. Réfrigérer la pâte au moins 2 heures.
4. Cuire dans des moules froids à 220 °C 4 minutes puis 180 °C 6 à 8 minutes.

**Techniques** : beurre noisette, mélange, repos froid, choc thermique, cuisson au four.

**Variantes candidates** : Orange ; chocolat ; vanille.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, agrume, miel
- **Textures cibles** : tendre, contraste_léger
- **Ingrédients signatures** : Farine de blé T55, Œuf cru, Beurre doux, Sucre semoule
- **Garde-fous / dérives interdites** : conserver_les_ingrédients_signatures, conserver_la_technique_centrale, ne_pas_remplacer_par_un_simple_équivalent_nutritionnel
- **Conservation** : 4 jours en boîte hermétique.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-073 — Cassoulet de Castelnaudary

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot lingot sec | 600 | g | base | non |
| Confit de canard cuit | 800 | g | viande | non |
| Saucisse de Toulouse crue | 600 | g | viande | non |
| Poitrine de porc demi-sel | 300 | g | viande | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Carotte crue | 200 | g | aromatique | non |
| Tomate concassée en conserve | 300 | g | liaison | non |
| Ail cru | 15 | g | aromatique | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Chapelure de blé | 80 | g | croûte | oui |

#### Méthode canonique

1. Tremper les haricots une nuit puis les précuire avec les aromates.
2. Dorer saucisse et poitrine, puis réchauffer le confit pour récupérer un peu de graisse.
3. Monter haricots, viandes et jus dans une cassole, avec juste assez de bouillon.
4. Cuire très lentement au four en enfonçant plusieurs fois la croûte qui se forme.

**Techniques** : trempage, précuisson, montage, cuisson lente au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, canard_confit, porc, haricot, thym
- **Textures cibles** : haricots_fondants, viandes_confites, croûte_gratinée
- **Ingrédients signatures** : haricot_lingot, confit_de_canard, saucisse_de_toulouse
- **Garde-fous / dérives interdites** : pas_de_riz, cuisson_longue, croûte_reformée, haricots_non_en_purée
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : gluten

---

### REAL-074 — Choucroute garnie alsacienne

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : plat de chou fermenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Choucroute crue fermentée | 1500 | g | base | non |
| Palette de porc fumée | 800 | g | viande | non |
| Poitrine de porc fumée | 400 | g | viande | non |
| Saucisse de Strasbourg | 8 | u | viande | non |
| Saucisse de Montbéliard | 4 | u | viande | non |
| Pomme de terre crue, avec peau | 1200 | g | féculent | non |
| Vin blanc sec d Alsace | 500 | ml | cuisson | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Baie de genièvre | 10 | u | épice | non |
| Carvi en graines | 4 | g | épice | non |
| Feuille de laurier séchée | 2 | u | aromate | non |

#### Méthode canonique

1. Rincer brièvement la choucroute seulement si elle est très acide, puis l’essorer.
2. Faire suer l’oignon, ajouter choucroute, vin, genièvre, carvi et viandes longues à cuire.
3. Mijoter à couvert environ deux heures, puis ajouter les saucisses sans les faire éclater.
4. Cuire les pommes de terre séparément et servir autour de la choucroute.

**Techniques** : fermentation existante, mijotage, cuisson séquencée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 5/5 |
| Acide | 4/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 4/5 |
| Pungence | 5/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fermenté, piquant, umami
- **Aromas signatures** : oignon_compoté, vin_blanc_réduit, laurier, fumé, chou_lactique, genièvre, carvi, porc_fumé
- **Textures cibles** : chou_souple, viandes_juteuses, pommes_de_terre_fermes
- **Ingrédients signatures** : choucroute_fermentée, porc_fumé, saucisses, genièvre
- **Garde-fous / dérives interdites** : ne_pas_remplacer_choucroute_par_chou_frais, acidité_lactique_présente, saucisses_non_bouillies
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-075 — Tartiflette

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : gratin de pommes de terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, avec peau | 1200 | g | base | non |
| Reblochon au lait cru | 500 | g | fromage | non |
| Lardon fumé cru | 250 | g | garniture | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Vin blanc sec | 120 | ml | déglaçage | non |
| Crème fraîche épaisse | 120 | g | liaison | oui |
| Poivre noir moulu | 2 | g | assaisonnement | non |

#### Méthode canonique

1. Cuire les pommes de terre avec leur peau jusqu’à presque tendreté, puis les trancher.
2. Faire revenir lardons et oignons, déglacer au vin blanc.
3. Monter pommes de terre et garniture dans un plat, puis poser le reblochon coupé en deux, croûte vers le haut.
4. Cuire jusqu’à fromage fondu et croûte bien dorée.

**Techniques** : précuisson, saisie, déglaçage, gratinage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : oignon_compoté, vin_blanc_réduit, lacté, fumé, reblochon, lardon_fumé, oignon, vin_blanc
- **Textures cibles** : pommes_de_terre_fondantes, fromage_coulant, dessus_doré
- **Ingrédients signatures** : reblochon, pomme_de_terre, lardon, oignon
- **Garde-fous / dérives interdites** : reblochon_indispensable, pas_de_fromage_râpé_seul, plat_gras_et_fondant
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-076 — Aligot de l’Aubrac

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : purée filante
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 1200 | g | base | non |
| Tome fraîche de l’Aubrac | 600 | g | fromage | non |
| Crème fraîche épaisse | 180 | g | liaison | non |
| Beurre doux | 60 | g | matière grasse | non |
| Ail cru | 8 | g | aromatique | non |
| Sel fin | 8 | g | assaisonnement | non |

#### Méthode canonique

1. Cuire les pommes de terre avec l’ail puis les dessécher soigneusement.
2. Passer au presse-purée et incorporer beurre et crème chauds.
3. Ajouter la tome fraîche en lamelles sur feu doux.
4. Travailler énergiquement jusqu’à obtenir un long ruban lisse et élastique.

**Techniques** : cuisson à l’eau, dessiccation, émulsion, filage du fromage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, beurre, lacté, fromage_affiné, pomme_de_terre, lait_frais
- **Textures cibles** : purée_lisse, élasticité_filante
- **Ingrédients signatures** : tome_fraîche, pomme_de_terre, ail
- **Garde-fous / dérives interdites** : tome_fraîche_indispensable, ne_pas_utiliser_mixeur, texture_filante_obligatoire
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-077 — Garbure béarnaise

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe-repas
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot tarbais sec | 400 | g | légumineuse | non |
| Chou vert frais | 700 | g | légume | non |
| Confit de canard cuit | 500 | g | viande | non |
| Jambon de Bayonne avec os | 500 | g | viande | non |
| Pomme de terre crue, épluchée | 700 | g | féculent | non |
| Poireau cru | 250 | g | légume | non |
| Carotte crue | 250 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Bouquet garni frais | 1 | u | aromate | non |

#### Méthode canonique

1. Tremper les haricots puis les cuire avec le jambon, l’oignon et le bouquet garni.
2. Ajouter carottes, poireaux et chou en respectant leur temps de cuisson.
3. Ajouter les pommes de terre et le confit vers la fin.
4. Mijoter jusqu’à bouillon épais et légumes très tendres, puis laisser reposer avant service.

**Techniques** : trempage, pochage long, cuisson séquencée, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, chou, haricot, canard, jambon
- **Textures cibles** : bouillon_épais, légumes_fondants, viande_effilochable
- **Ingrédients signatures** : haricot_tarbais, chou, confit, jambon
- **Garde-fous / dérives interdites** : doit_rester_soupe_repas, pas_de_mixage, cuisson_longue
- **Conservation** : 4 jours au réfrigérateur ; congélation 3 mois.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-078 — Axoa de veau

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : sauté basque
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 75 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule de veau crue | 1000 | g | viande | non |
| Piment doux vert frais | 500 | g | légume | non |
| Poivron rouge frais | 300 | g | légume | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Piment d’Espelette moulu | 4 | g | épice | non |
| Jambon de Bayonne | 120 | g | garniture | oui |
| Huile d’olive vierge extra | 35 | ml | cuisson | non |
| Bouillon de veau non salé | 250 | ml | cuisson | non |

#### Méthode canonique

1. Détailler le veau au couteau en petits dés, sans le hacher.
2. Faire fondre oignon, piments doux et ail dans l’huile.
3. Ajouter le veau, le jambon facultatif et le piment d’Espelette.
4. Mouiller légèrement puis mijoter jusqu’à viande tendre et jus court.

**Techniques** : découpe au couteau, suer, sauté, mijotage court.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, piment, piment_doux, piment_espelette, veau, oignon
- **Textures cibles** : petits_dés_tendres, jus_court, légumes_fondants
- **Ingrédients signatures** : veau_en_dés, piments_doux, piment_espelette
- **Garde-fous / dérives interdites** : viande_non_hachée, pas_de_sauce_tomate_dominante, piment_aromatique_plus_que_brûlant
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-079 — Bouillabaisse marseillaise

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de poissons
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 70 min · cuisson 60 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Rascasse crue entière | 800 | g | poisson | non |
| Congre cru | 600 | g | poisson | non |
| Saint-pierre cru | 600 | g | poisson | non |
| Rouget grondin cru | 600 | g | poisson | non |
| Crabe vert cru | 400 | g | crustacé | oui |
| Tomate fraîche mûre | 600 | g | bouillon | non |
| Fenouil frais | 250 | g | aromatique | non |
| Poireau cru | 200 | g | aromatique | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Safran | 0.5 | g | épice | non |
| Zeste d orange | 6 | g | arôme | non |
| Huile d’olive vierge extra | 60 | ml | cuisson | non |
| Pain de campagne | 400 | g | service | non |
| Rouille | 200 | g | service | non |

#### Méthode canonique

1. Lever ou faire lever les poissons, réserver les morceaux nobles et utiliser têtes et arêtes pour le fond.
2. Faire revenir aromates, tomate, safran et zeste, ajouter les parures et couvrir d’eau ; cuire puis filtrer.
3. Cuire d’abord les poissons fermes dans le bouillon bouillant, puis les plus fragiles.
4. Servir le bouillon sur croûtons avec rouille, puis les poissons séparément.

**Techniques** : fumet, filtration, cuisson séquencée, service en deux temps.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, poisson_roche, safran, fenouil, orange
- **Textures cibles** : bouillon_intense, poissons_entiers_non_défaits, croûtons_croustillants
- **Ingrédients signatures** : poissons_de_roche, safran, fenouil, rouille
- **Garde-fous / dérives interdites** : plusieurs_poissons_de_roche, service_bouillon_et_poissons, pas_de_simple_soupe_crémée
- **Conservation** : Bouillon 2 jours ; poissons 1 jour.
- **Allergènes structurels** : crustacés, gluten, poisson

---

### REAL-080 — Brandade de morue

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : émulsion de poisson
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Morue salée sèche | 700 | g | poisson | non |
| Pomme de terre crue, épluchée | 600 | g | base | oui |
| Huile d’olive vierge extra | 180 | ml | émulsion | non |
| Lait entier | 300 | ml | émulsion | non |
| Ail cru | 15 | g | aromatique | non |
| Jus de citron frais | 20 | ml | acidité | non |
| Pain de campagne | 300 | g | service | non |

#### Méthode canonique

1. Dessaler la morue au froid en renouvelant l’eau.
2. Pocher doucement la morue, l’effeuiller et retirer peau et arêtes.
3. Écraser avec l’ail et éventuellement la pomme de terre, puis incorporer alternativement huile et lait chauds.
4. Ajuster au citron et servir chaude ou gratinée.

**Techniques** : dessalage, pochage, effeuillage, émulsion.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, agrume, morue, huile_olive, lait, citron
- **Textures cibles** : émulsion_fibreuse_et_lisse, gratination_facultative
- **Ingrédients signatures** : morue_salée, huile_olive, ail
- **Garde-fous / dérives interdites** : morue_dessalée_indispensable, pas_de_poisson_frais_neutre, émulsion_non_liquide
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, poisson

---

### REAL-081 — Sole meunière

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : poisson poêlé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Sole entière crue, parée | 4 | u | poisson | non |
| Farine de blé T55 | 80 | g | enrobage | non |
| Beurre doux | 160 | g | cuisson_et_sauce | non |
| Citron jaune frais | 2 | u | acidité | non |
| Persil frais | 25 | g | finition | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Méthode canonique

1. Peler et parer les soles, les sécher et les fariner très légèrement.
2. Les cuire au beurre mousseux sans brûler les solides du lait.
3. Retirer les poissons et préparer un beurre noisette dans la même poêle.
4. Ajouter citron et persil, puis napper immédiatement.

**Techniques** : farinage, poêlage, beurre noisette, nappage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : beurre, agrume, beurre_noisette, citron, persil, poisson
- **Textures cibles** : chair_nacrée, bords_légèrement_croustillants, sauce_mousseuse
- **Ingrédients signatures** : sole, beurre_noisette, citron
- **Garde-fous / dérives interdites** : poisson_entier_ou_filets_fins, farinage_léger, beurre_noisette_non_brûlé
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait, poisson

---

### REAL-082 — Quenelles de brochet sauce Nantua

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : quenelles en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 70 min · cuisson 45 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chair de brochet crue | 500 | g | base | non |
| Farine de blé T55 | 180 | g | panade | non |
| Lait entier | 300 | ml | panade | non |
| Beurre doux | 150 | g | panade_et_sauce | non |
| Œuf cru | 5 | u | structure | non |
| Crème fraîche liquide entière | 300 | ml | sauce | non |
| Écrevisse cuite décortiquée | 250 | g | sauce | non |
| Cognac | 40 | ml | sauce | non |
| Concentré de tomate | 20 | g | sauce | non |

#### Méthode canonique

1. Préparer une panade avec lait, beurre et farine puis la dessécher.
2. Mixer ou piler la chair de brochet très froide, incorporer panade puis œufs progressivement.
3. Façonner et pocher les quenelles à eau frémissante.
4. Préparer la sauce Nantua avec carcasses ou écrevisses, cognac, crème et tomate, puis gratiner les quenelles nappées.

**Techniques** : panade, dessiccation, émulsion froide, pochage, sauce crustacés, gratinage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : tomate_cuite, beurre, lacté, brochet, écrevisse, cognac, crème
- **Textures cibles** : quenelle_aérienne, sauce_nappante, dessus_gratiné
- **Ingrédients signatures** : brochet, panade, sauce_nantua
- **Garde-fous / dérives interdites** : chair_de_brochet, texture_soufflée, sauce_écrevisse_indispensable
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, gluten, lait, poisson, œuf

---

### REAL-083 — Navarin d’agneau printanier

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût d’agneau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 110 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule d’agneau crue | 1200 | g | viande | non |
| Navet nouveau cru | 400 | g | légume | non |
| Carotte nouvelle crue | 350 | g | légume | non |
| Petit pois frais écossé | 300 | g | légume | non |
| Pomme de terre nouvelle crue | 500 | g | féculent | non |
| Oignon grelot cru | 250 | g | garniture | non |
| Tomate concentrée | 30 | g | liaison | non |
| Farine de blé T55 | 25 | g | liaison | non |
| Bouillon d’agneau non salé | 700 | ml | cuisson | non |
| Bouquet garni frais | 1 | u | aromate | non |

#### Méthode canonique

1. Colorer les morceaux d’agneau puis les singer légèrement.
2. Ajouter tomate, bouquet garni et bouillon, puis braiser environ une heure.
3. Glacer ou cuire séparément les petits légumes pour préserver leur couleur.
4. Réunir viande et légumes en fin de cuisson, puis réduire la sauce.

**Techniques** : saisie, singer, braisage, cuisson séparée des légumes, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, agneau, navet, petits_pois, thym
- **Textures cibles** : viande_fondante, légumes_justes, sauce_nappante
- **Ingrédients signatures** : agneau, légumes_printaniers
- **Garde-fous / dérives interdites** : légumes_ajoutés_tard, pas_de_légumes_surcuits, agneau_non_haché
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-084 — Petit salé aux lentilles

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc et légumineuses
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Palette de porc demi-sel | 1000 | g | viande | non |
| Lentille verte sèche, crue | 450 | g | légumineuse | non |
| Saucisse de Morteau | 2 | u | viande | non |
| Carotte crue | 300 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Clou de girofle | 3 | u | épice | non |
| Bouquet garni frais | 1 | u | aromate | non |
| Ail cru | 10 | g | aromatique | non |

#### Méthode canonique

1. Dessaler la palette si nécessaire, puis la pocher doucement avec aromates.
2. Cuire les lentilles séparément avec carotte, oignon et bouquet garni.
3. Pocher la saucisse sans la piquer.
4. Réunir en fin de cuisson et ajuster le sel seulement après dégustation.

**Techniques** : dessalage, pochage, cuisson séparée, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, porc_salé, lentille, clou_girofle, fumé
- **Textures cibles** : lentilles_entières, porc_fondant, saucisse_juteuse
- **Ingrédients signatures** : palette_demi_sel, lentille_verte, saucisse_fumée
- **Garde-fous / dérives interdites** : ne_pas_saler_avant_fin, lentilles_non_en_purée, porc_dessalé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-085 — Tomates farcies à la chair

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : légumes farcis
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tomate fraîche mûre | 12 | u | contenant | non |
| Porc haché cru | 500 | g | farce | non |
| Veau haché cru | 300 | g | farce | non |
| Pain rassis | 120 | g | liaison | non |
| Lait demi-écrémé | 150 | ml | liaison | non |
| Œuf cru | 1 | u | liaison | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Persil frais | 25 | g | herbe | non |
| Riz long blanc cru | 250 | g | accompagnement | oui |

#### Méthode canonique

1. Évider les tomates, saler légèrement l’intérieur et les laisser s’égoutter.
2. Préparer une panade avec pain et lait, puis mélanger aux viandes, œuf, oignon, ail et persil.
3. Farcir sans tasser et remettre les chapeaux.
4. Cuire au four dans un plat contenant la pulpe, éventuellement avec du riz qui absorbera le jus.

**Techniques** : évidage, dégorgement, panade, farce, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, tomate_rôtie, farce, persil
- **Textures cibles** : tomate_tendre_non_effondrée, farce_juteuse
- **Ingrédients signatures** : tomate, farce_porc_veau, persil
- **Garde-fous / dérives interdites** : tomate_entière_farcies, farce_non_sèche, pas_de_simple_sauce_bolognaise
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-086 — Œufs en meurette

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : œufs pochés en sauce au vin
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 8 | u | protéine | non |
| Vin rouge de Bourgogne | 750 | ml | sauce | non |
| Lardon fumé cru | 160 | g | garniture | non |
| Champignon de Paris frais | 300 | g | garniture | non |
| Oignon grelot cru | 200 | g | garniture | non |
| Échalote crue | 100 | g | aromatique | non |
| Beurre doux | 60 | g | cuisson | non |
| Farine de blé T55 | 20 | g | liaison | non |
| Pain de campagne | 8 | tranche | service | non |

#### Méthode canonique

1. Réduire le vin avec échalote et aromates, puis le lier légèrement au beurre manié.
2. Poêler lardons, champignons et oignons grelots séparément.
3. Pocher les œufs pour garder un jaune coulant.
4. Servir sur croûtons avec sauce au vin et garniture.

**Techniques** : réduction, beurre manié, pochage, garniture séparée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, échalote, vin_rouge_réduit, champignon_terreux, beurre, fumé, vin_rouge, lardon
- **Textures cibles** : blanc_pris_jaune_coulant, sauce_nappante, croûton_croustillant
- **Ingrédients signatures** : œuf_poché, sauce_vin_rouge, lardons
- **Garde-fous / dérives interdites** : jaune_coulant, sauce_au_vin_dominante, pas_de_sauce_crémée
- **Conservation** : Sauce 3 jours ; œufs à pocher au moment.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-087 — Salade lyonnaise

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade composée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Frisée fraîche | 300 | g | salade | non |
| Lardon fumé cru | 200 | g | garniture | non |
| Œuf cru | 4 | u | protéine | non |
| Pain de campagne | 200 | g | croûtons | non |
| Vinaigre de vin rouge | 35 | ml | vinaigrette | non |
| Moutarde de Dijon | 15 | g | vinaigrette | non |
| Huile de noix | 35 | ml | vinaigrette | non |
| Huile de colza raffinée | 25 | ml | vinaigrette | non |
| Échalote crue | 60 | g | aromatique | non |

#### Méthode canonique

1. Préparer et essorer soigneusement la frisée.
2. Dorer les lardons et les croûtons séparément.
3. Pocher les œufs en gardant les jaunes coulants.
4. Assaisonner la salade avec une vinaigrette chaude ou tiède, puis ajouter garnitures et œufs.

**Techniques** : poêlage, pochage, émulsion, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : échalote, vin_rouge_réduit, moutarde, fumé, frisée, lardon, vinaigre, noix
- **Textures cibles** : salade_croquante, lardons_croustillants, jaune_coulant
- **Ingrédients signatures** : frisée, lardon, œuf_poché, croûtons
- **Garde-fous / dérives interdites** : frisée_amère, œuf_coulant, vinaigrette_acidulée
- **Conservation** : À assembler au dernier moment.
- **Allergènes structurels** : fruits à coque, gluten, moutarde, œuf

---

### REAL-088 — Flamiche aux poireaux

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : tarte salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte brisée crue | 320 | g | fond | non |
| Poireau cru | 900 | g | garniture | non |
| Œuf cru | 3 | u | appareil | non |
| Crème fraîche épaisse | 250 | g | appareil | non |
| Beurre doux | 40 | g | cuisson | non |
| Muscade moulue | 0.5 | g | épice | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Méthode canonique

1. Faire fondre très doucement les poireaux au beurre sans coloration et évaporer leur eau.
2. Foncer la pâte et la piquer.
3. Mélanger œufs, crème, muscade et poireaux refroidis.
4. Verser et cuire jusqu’à appareil pris et pâte dorée.

**Techniques** : fondue, évaporation, fonçage, appareil à crème prise.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : beurre, lacté, poireau, crème, muscade
- **Textures cibles** : fondant_de_poireau, pâte_croustillante, appareil_moelleux
- **Ingrédients signatures** : poireau, crème, pâte
- **Garde-fous / dérives interdites** : poireau_dominant, pas_de_lardons_obligatoires, garniture_non_aqueuse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-089 — Kouign-amann

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtisserie levée feuilletée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 50 min · cuisson 40 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Eau | 300 | ml | hydratation | non |
| Levure boulangère fraîche | 15 | g | fermentation | non |
| Beurre demi-sel | 400 | g | tourage | non |
| Sucre semoule | 400 | g | caramélisation | non |
| Sel fin | 3 | g | pâte | non |

#### Méthode canonique

1. Préparer une pâte levée peu riche et la laisser fermenter.
2. Enfermer le beurre froid puis effectuer les tours en incorporant progressivement le sucre.
3. Façonner sans faire fondre le beurre et placer dans un moule beurré.
4. Cuire jusqu’à feuilletage profond et caramel ambré, puis démouler encore chaud.

**Techniques** : pâte levée, tourage, feuilletage, caramélisation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, beurre_demi_sel, caramel, pâte_levée
- **Textures cibles** : extérieur_caramélisé, feuilletage_dense, cœur_moelleux
- **Ingrédients signatures** : beurre_demi_sel, sucre, feuilletage
- **Garde-fous / dérives interdites** : forte_proportion_beurre_sucre, tourage, caramel_non_brûlé
- **Conservation** : 2 jours à température ambiante.
- **Allergènes structurels** : gluten, lait

---

### REAL-090 — Cannelés de Bordeaux

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : petit gâteau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 16
- **Temps** : préparation 25 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lait entier | 500 | ml | appareil | non |
| Farine de blé T55 | 100 | g | structure | non |
| Sucre semoule | 220 | g | sucre | non |
| Œuf cru | 2 | u | structure | non |
| Jaune d’œuf cru | 2 | u | structure | non |
| Beurre doux | 50 | g | matière grasse | non |
| Rhum ambré | 50 | ml | arôme | non |
| Gousse de vanille | 1 | u | arôme | non |

#### Méthode canonique

1. Infuser vanille dans le lait chaud avec le beurre.
2. Mélanger sucre, farine, œufs et jaunes sans incorporer trop d’air, puis verser le lait.
3. Ajouter le rhum et laisser reposer la pâte 24 heures.
4. Cuire très chaud au départ puis plus modérément pour obtenir une croûte sombre et un cœur custard.

**Techniques** : infusion, appareil liquide, repos long, cuisson à deux températures.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, vanille, rhum, caramel, lait
- **Textures cibles** : croûte_très_caramélisée, cœur_humide_alvéolé
- **Ingrédients signatures** : rhum, vanille, lait, cuisson_forte
- **Garde-fous / dérives interdites** : repos_24h, croûte_sombre, cœur_tendre, pas_de_gâteau_sec
- **Conservation** : 2 jours à température ambiante.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-091 — Far breton aux pruneaux

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : flan cuit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 20 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pruneau dénoyauté | 350 | g | fruit | non |
| Farine de blé T55 | 200 | g | structure | non |
| Sucre semoule | 160 | g | sucre | non |
| Œuf cru | 5 | u | structure | non |
| Lait entier | 900 | ml | appareil | non |
| Rhum ambré | 40 | ml | arôme | oui |
| Beurre demi-sel | 30 | g | moule | non |

#### Méthode canonique

1. Faire macérer les pruneaux dans le rhum facultatif.
2. Préparer un appareil lisse avec œufs, sucre, farine et lait.
3. Beurrer généreusement le plat et répartir les pruneaux.
4. Verser l’appareil et cuire jusqu’à bords gonflés, surface brune et centre pris.

**Techniques** : macération, appareil à flan, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : beurre, pruneau, rhum, lait, beurre_demi_sel
- **Textures cibles** : bords_caramélisés, cœur_dense_et_fondant
- **Ingrédients signatures** : pruneau, appareil_lacté
- **Garde-fous / dérives interdites** : pruneaux_entiers, texture_plus_dense_qu_un_clafoutis, beurre_demi_sel
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-092 — Piperade basquaise

- **Cuisine / origine** : France
- **Identité** : `named_traditional_dish`
- **Catégorie** : compotée de poivrons
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poivron rouge frais | 400 | g | légume | non |
| Piment doux vert frais | 400 | g | légume | non |
| Tomate fraîche mûre | 600 | g | légume | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Huile d’olive vierge extra | 45 | ml | cuisson | non |
| Piment d’Espelette moulu | 3 | g | épice | non |
| Œuf cru | 6 | u | service | oui |
| Jambon de Bayonne | 160 | g | service | oui |

#### Méthode canonique

1. Peler éventuellement les poivrons et les émincer avec les oignons.
2. Faire compoter oignons, poivrons et ail sans coloration agressive.
3. Ajouter les tomates mondées et cuire jusqu’à jus concentré.
4. Assaisonner au piment d’Espelette et servir seule, avec œufs brouillés ou jambon.

**Techniques** : compotage, réduction, œufs brouillés facultatifs.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, piment, poivron, piment_doux, tomate, piment_espelette
- **Textures cibles** : légumes_confits, jus_court, œufs_moelleux_facultatifs
- **Ingrédients signatures** : poivrons, piments_doux, tomate
- **Garde-fous / dérives interdites** : poivron_dominant, piment_espelette, pas_de_texture_aqueuse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : œuf

---

### REAL-093 — Ossobuco alla milanese

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : veau braisé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Jarret de veau cru, en tranches avec os | 1200 | g | viande | non |
| Vin blanc sec | 250 | ml | déglaçage | non |
| Bouillon de veau non salé | 600 | ml | braisage | non |
| Tomate concassée en conserve | 300 | g | sauce | oui |
| Oignon jaune cru | 180 | g | soffritto | non |
| Carotte crue | 150 | g | soffritto | non |
| Céleri branche cru | 120 | g | soffritto | non |
| Farine de blé T55 | 40 | g | enrobage | non |
| Beurre doux | 50 | g | cuisson | non |
| Zeste de citron | 8 | g | gremolata | non |
| Ail cru | 8 | g | gremolata | non |
| Persil frais | 25 | g | gremolata | non |

#### Méthode canonique

1. Fariner légèrement les tranches de jarret et les colorer au beurre.
2. Faire fondre le soffritto, déglacer au vin puis ajouter bouillon et tomate facultative.
3. Braiser doucement jusqu’à viande tendre et moelle encore intacte.
4. Servir avec gremolata fraîche de citron, ail et persil.

**Techniques** : farinage, saisie, soffritto, déglaçage, braisage, gremolata.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : ail, oignon_compoté, vin_blanc_réduit, tomate_cuite, beurre, agrume, veau, vin_blanc
- **Textures cibles** : viande_fondante, moelle_onctueuse, sauce_nappante
- **Ingrédients signatures** : jarret_de_veau_avec_os, gremolata
- **Garde-fous / dérives interdites** : os_et_moelle_indispensables, gremolata_au_service, pas_de_viande_désossée
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : céleri, gluten, lait

---

### REAL-094 — Saltimbocca alla romana

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : escalope poêlée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Escalope de veau crue fine | 8 | u | viande | non |
| Jambon de Parme | 8 | tranche | garniture | non |
| Feuille de sauge fraîche | 16 | u | aromate | non |
| Farine de blé T55 | 50 | g | enrobage | non |
| Beurre doux | 60 | g | cuisson | non |
| Vin blanc sec | 120 | ml | déglaçage | non |
| Poivre noir moulu | 1 | g | assaisonnement | non |

#### Méthode canonique

1. Aplatir les escalopes, poser jambon et sauge puis maintenir avec un pic.
2. Fariner uniquement la face viande et saisir rapidement au beurre.
3. Retourner brièvement côté jambon sans le dessécher.
4. Déglacer au vin blanc et napper avec le jus réduit.

**Techniques** : aplatir, montage, saisie, déglaçage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : vin_blanc_réduit, beurre, sauge, jambon_cru, veau, vin_blanc
- **Textures cibles** : veau_tendre, jambon_légèrement_croustillant, jus_court
- **Ingrédients signatures** : veau_fin, jambon_de_parme, sauge
- **Garde-fous / dérives interdites** : sauge_fraîche, cuisson_très_courte, pas_de_sauce_crème
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait

---

### REAL-095 — Pollo alla cacciatora

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet mijoté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1500 | g | viande | non |
| Tomate concassée en conserve | 700 | g | sauce | non |
| Champignon de Paris frais | 350 | g | garniture | non |
| Vin rouge sec | 180 | ml | déglaçage | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Olive noire dénoyautée | 120 | g | garniture | oui |
| Romarin frais | 5 | g | aromate | non |
| Huile d’olive vierge extra | 35 | ml | cuisson | non |

#### Méthode canonique

1. Dorer le poulet côté peau puis réserver.
2. Faire revenir oignon, ail et champignons, puis déglacer au vin.
3. Ajouter tomate, romarin et olives facultatives.
4. Remettre le poulet et mijoter jusqu’à 75 °C à cœur et sauce concentrée.

**Techniques** : saisie, déglaçage, mijotage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, vin_rouge_réduit, tomate_cuite, champignon_terreux, tomate, romarin, vin
- **Textures cibles** : peau_dorée, chair_fondante, sauce_rustique
- **Ingrédients signatures** : poulet_avec_os, tomate, herbes
- **Garde-fous / dérives interdites** : poulet_avec_os, cuisson_mijotée, pas_de_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-096 — Vitello tonnato

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : veau froid en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Noix de veau crue | 1000 | g | viande | non |
| Vin blanc sec | 250 | ml | pochage | non |
| Bouillon de légumes non salé | 500 | ml | pochage | non |
| Thon à l’huile en conserve, égoutté | 250 | g | sauce | non |
| Anchois à l’huile, égoutté | 40 | g | sauce | non |
| Câpre au vinaigre, égouttée | 60 | g | sauce | non |
| Jaune d’œuf cuit | 3 | u | sauce | non |
| Huile d’olive vierge extra | 100 | ml | sauce | non |
| Jus de citron frais | 30 | ml | acidité | non |

#### Méthode canonique

1. Pocher ou rôtir doucement le veau avec vin et aromates, puis le refroidir complètement.
2. Mixer thon, anchois, câpres, jaunes, citron et huile en sauce lisse.
3. Trancher le veau très finement.
4. Napper de sauce et laisser maturer plusieurs heures au froid avant service.

**Techniques** : pochage ou rôtissage doux, refroidissement, mixage, tranchage fin, marinade froide.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : vin_blanc_réduit, agrume, thon, anchois, câpre, citron, veau
- **Textures cibles** : veau_fin_et_tendre, sauce_crémeuse_froide
- **Ingrédients signatures** : veau_froid, sauce_thon_câpres
- **Garde-fous / dérives interdites** : service_froid, tranches_fines, sauce_tonnata_indispensable
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, poisson, œuf

---

### REAL-097 — Arancini siciliens au ragù

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : croquettes de riz
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 90 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz arborio cru | 500 | g | base | non |
| Bouillon de volaille non salé | 1100 | ml | cuisson | non |
| Safran | 0.3 | g | arôme | non |
| Bœuf haché cru 15 % MG | 300 | g | ragù | non |
| Tomate concassée en conserve | 300 | g | ragù | non |
| Petit pois surgelé | 150 | g | ragù | non |
| Mozzarella | 250 | g | cœur | non |
| Œuf cru | 3 | u | panure | non |
| Farine de blé T55 | 150 | g | panure | non |
| Chapelure de blé | 300 | g | panure | non |
| Huile de friture | 1500 | ml | friture | non |

#### Méthode canonique

1. Cuire le riz au bouillon et au safran jusqu’à sec, puis le refroidir.
2. Préparer un ragù épais avec viande, tomate et petits pois.
3. Former les boules de riz autour du ragù et de mozzarella.
4. Paner puis frire jusqu’à croûte uniformément dorée.

**Techniques** : cuisson du riz, refroidissement, façonnage, panure, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, tomate_cuite, safran, ragù, mozzarella, riz_frit
- **Textures cibles** : croûte_croustillante, riz_moelleux, cœur_fondant
- **Ingrédients signatures** : riz_safrané, farce_ragù, panure
- **Garde-fous / dérives interdites** : riz_refroidi, farce_au_centre, panure_et_friture
- **Conservation** : 2 jours au réfrigérateur ; réchauffer au four.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-098 — Ribollita toscane

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de pain et haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot cannellini sec | 400 | g | légumineuse | non |
| Chou noir kale | 500 | g | légume | non |
| Pain toscan rassis | 350 | g | liaison | non |
| Tomate concassée en conserve | 500 | g | sauce | non |
| Carotte crue | 250 | g | soffritto | non |
| Céleri branche cru | 180 | g | soffritto | non |
| Oignon jaune cru | 200 | g | soffritto | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |
| Romarin frais | 5 | g | aromate | non |

#### Méthode canonique

1. Tremper et cuire les haricots, en mixer une petite partie pour épaissir.
2. Faire le soffritto, ajouter tomate, chou et haricots.
3. Mijoter jusqu’à légumes très tendres puis alterner soupe et pain rassis.
4. Refroidir, puis « re-bouillir » le lendemain avec huile d’olive.

**Techniques** : trempage, soffritto, mijotage, liaison au pain, réchauffage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, haricot, chou_noir, pain, huile_olive, romarin
- **Textures cibles** : soupe_très_épaisse, pain_fondu, haricots_entiers
- **Ingrédients signatures** : cannellini, chou_noir, pain_rassis
- **Garde-fous / dérives interdites** : doit_être_réchauffée, pain_rassis, texture_épaisse
- **Conservation** : 4 jours au réfrigérateur ; meilleure le lendemain.
- **Allergènes structurels** : céleri, gluten

---

### REAL-099 — Pappa al pomodoro

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de tomate et pain
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tomate entière pelée en conserve | 1000 | g | base | non |
| Pain toscan rassis | 350 | g | liaison | non |
| Bouillon de légumes non salé | 600 | ml | liquide | non |
| Ail cru | 15 | g | aromatique | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |
| Basilic frais | 30 | g | herbe | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Méthode canonique

1. Faire doucement revenir l’ail dans l’huile sans le brûler.
2. Ajouter tomate et bouillon, puis mijoter.
3. Incorporer le pain en morceaux et cuire jusqu’à absorption complète.
4. Écraser grossièrement, finir au basilic et à l’huile crue.

**Techniques** : suer, mijotage, liaison au pain, écrasement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, tomate_cuite, basilic, tomate, huile_olive, pain
- **Textures cibles** : épaisse_et_rustique, pain_fondu
- **Ingrédients signatures** : tomate, pain_rassis, basilic
- **Garde-fous / dérives interdites** : pas_de_crème, pain_comme_liaison, huile_olive_en_finition
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-100 — Cacio e pepe

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 10 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tonnarelli secs | 400 | g | pâtes | non |
| Pecorino romano | 180 | g | sauce | non |
| Poivre noir en grains | 8 | g | épice | non |
| Sel fin | 4 | g | eau de cuisson | non |

#### Méthode canonique

1. Torréfier le poivre concassé dans une grande poêle.
2. Cuire les pâtes très al dente en gardant une eau riche en amidon.
3. Former hors du feu une crème de pecorino avec eau de cuisson tiédie.
4. Émulsionner pâtes, poivre et crème sans faire grainer le fromage.

**Techniques** : torréfaction, cuisson al dente, émulsion hors feu.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : pecorino, poivre_noir, amidon_de_pâte
- **Textures cibles** : pâtes_fermes, sauce_lisse_et_nappante
- **Ingrédients signatures** : pecorino, poivre, pâtes
- **Garde-fous / dérives interdites** : seulement_pecorino_poivre_eau_de_cuisson, pas_de_crème, pas_de_beurre_obligatoire
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : lait

---

### REAL-101 — Bucatini all’amatriciana

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bucatini secs | 400 | g | pâtes | non |
| Guanciale cru | 180 | g | garniture | non |
| Tomate entière pelée en conserve | 600 | g | sauce | non |
| Pecorino romano | 100 | g | finition | non |
| Piment séché | 1 | g | épice | oui |
| Vin blanc sec | 80 | ml | déglaçage | oui |

#### Méthode canonique

1. Faire fondre le guanciale jusqu’à bords croustillants et réserver une partie.
2. Déglacer facultativement, ajouter tomate et piment puis réduire.
3. Cuire les bucatini al dente et les terminer dans la sauce.
4. Ajouter pecorino hors du feu et remettre le guanciale croustillant.

**Techniques** : rendu de graisse, réduction, cuisson al dente, mantecatura.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : vin_blanc_réduit, tomate_cuite, piment, guanciale, tomate, pecorino
- **Textures cibles** : pâtes_fermes, sauce_brillante, guanciale_croustillant
- **Ingrédients signatures** : guanciale, tomate, pecorino
- **Garde-fous / dérives interdites** : pas_d_oignon_dominant, pas_de_crème, guanciale_préféré
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-102 — Spaghetti alla puttanesca

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Spaghetti secs | 400 | g | pâtes | non |
| Tomate entière pelée en conserve | 700 | g | sauce | non |
| Anchois à l’huile, égoutté | 50 | g | umami | non |
| Olive noire dénoyautée | 140 | g | garniture | non |
| Câpre au vinaigre, égouttée | 60 | g | garniture | non |
| Ail cru | 12 | g | aromatique | non |
| Piment séché | 2 | g | épice | non |
| Huile d’olive vierge extra | 35 | ml | cuisson | non |
| Persil frais | 20 | g | finition | non |

#### Méthode canonique

1. Faire fondre anchois, ail et piment dans l’huile.
2. Ajouter tomate, olives et câpres puis réduire vivement.
3. Cuire les spaghetti al dente et les terminer dans la sauce.
4. Finir au persil sans ajouter de fromage.

**Techniques** : fonte des anchois, réduction, cuisson al dente, enrobage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, tomate_cuite, piment, anchois, câpre, olive
- **Textures cibles** : sauce_concentrée, pâtes_fermes
- **Ingrédients signatures** : anchois, olives, câpres, tomate
- **Garde-fous / dérives interdites** : salinité_marine, pas_de_fromage, saveurs_intenses
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-103 — Pasta alla Norma

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Rigatoni secs | 400 | g | pâtes | non |
| Aubergine fraîche | 700 | g | garniture | non |
| Tomate entière pelée en conserve | 700 | g | sauce | non |
| Ricotta salata | 120 | g | finition | non |
| Ail cru | 10 | g | aromatique | non |
| Basilic frais | 25 | g | herbe | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Méthode canonique

1. Saler les aubergines si nécessaire, les sécher puis les frire ou rôtir jusqu’à brunissement.
2. Préparer une sauce tomate simple à l’ail et au basilic.
3. Cuire les pâtes al dente et les terminer dans la sauce.
4. Ajouter aubergines et ricotta salata râpée au service.

**Techniques** : dégorgement, friture ou rôtissage, réduction, cuisson al dente.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, tomate_cuite, basilic, aubergine, tomate, ricotta_salata
- **Textures cibles** : aubergine_fondante_aux_bords_dorés, pâtes_fermes
- **Ingrédients signatures** : aubergine, ricotta_salata, tomate
- **Garde-fous / dérives interdites** : ricotta_salata_non_mozzarella, aubergine_dominante, basilic_frais
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-104 — Orecchiette alle cime di rapa

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtes et légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Orecchiette sèches | 400 | g | pâtes | non |
| Cime di rapa fraîches | 700 | g | légume | non |
| Anchois à l’huile, égoutté | 40 | g | umami | non |
| Ail cru | 12 | g | aromatique | non |
| Piment séché | 2 | g | épice | non |
| Huile d’olive vierge extra | 60 | ml | sauce | non |
| Chapelure de blé grillée | 60 | g | finition | oui |

#### Méthode canonique

1. Nettoyer les cime di rapa et les blanchir dans l’eau des pâtes.
2. Faire fondre anchois, ail et piment dans l’huile.
3. Cuire les orecchiette dans la même eau et les transférer dans la poêle avec les légumes.
4. Émulsionner avec eau de cuisson et finir de chapelure grillée facultative.

**Techniques** : blanchiment, fonte des anchois, cuisson al dente, émulsion.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, piment, verdure_amère, anchois, huile_olive
- **Textures cibles** : pâtes_fermes, feuilles_tendres, chapelure_croquante
- **Ingrédients signatures** : cime_di_rapa, orecchiette, anchois
- **Garde-fous / dérives interdites** : amertume_végétale_présente, pas_de_sauce_tomate, pas_de_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson

---

### REAL-105 — Parmigiana di melanzane

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : gratin d aubergines
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 1600 | g | base | non |
| Tomate entière pelée en conserve | 1000 | g | sauce | non |
| Mozzarella | 500 | g | fromage | non |
| Parmesan affiné | 180 | g | fromage | non |
| Basilic frais | 30 | g | herbe | non |
| Ail cru | 12 | g | aromatique | non |
| Huile d’olive vierge extra | 120 | ml | cuisson | non |
| Farine de blé T55 | 100 | g | enrobage | oui |

#### Méthode canonique

1. Trancher et saler les aubergines, les sécher puis les frire ou rôtir.
2. Préparer une sauce tomate concentrée à l’ail et au basilic.
3. Monter aubergines, tomate, mozzarella égouttée et parmesan en couches.
4. Cuire jusqu’à prise et gratinage, puis reposer avant découpe.

**Techniques** : dégorgement, friture ou rôtissage, réduction, montage, gratinage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, tomate_cuite, parmesan, basilic, aubergine, tomate
- **Textures cibles** : couches_fondantes, dessus_gratiné, tenue_à_la_découpe
- **Ingrédients signatures** : aubergine, mozzarella, parmesan, tomate
- **Garde-fous / dérives interdites** : pas_de_pâtes, aubergine_en_couches, repos_avant_découpe
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### REAL-106 — Caponata sicilienne

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : condiment de légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 1000 | g | base | non |
| Céleri branche cru | 250 | g | légume | non |
| Tomate concassée en conserve | 500 | g | sauce | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Olive verte dénoyautée | 150 | g | garniture | non |
| Câpre au vinaigre, égouttée | 70 | g | garniture | non |
| Vinaigre de vin rouge | 80 | ml | acidité | non |
| Sucre semoule | 40 | g | équilibre | non |
| Pignon de pin | 50 | g | croquant | oui |
| Huile d’olive vierge extra | 100 | ml | cuisson | non |

#### Méthode canonique

1. Frire ou rôtir l’aubergine séparément jusqu’à fondante.
2. Faire compoter oignon, céleri et tomate.
3. Ajouter olives, câpres, vinaigre et sucre pour obtenir un équilibre aigre-doux.
4. Réunir avec l’aubergine, refroidir et laisser maturer avant service.

**Techniques** : friture ou rôtissage, compotage, aigre-doux, marinade froide.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, tomate_cuite, aubergine, câpre, olive, vinaigre, caramel_léger
- **Textures cibles** : aubergine_fondante, éléments_distincts, jus_sirupeux
- **Ingrédients signatures** : aubergine, olives, câpres, aigre_doux
- **Garde-fous / dérives interdites** : service_tiède_ou_froid, équilibre_agrodolce, pas_de_purée
- **Conservation** : 5 jours au réfrigérateur.
- **Allergènes structurels** : céleri, fruits à coque, gluten

---

### REAL-107 — Focaccia genovese

- **Cuisine / origine** : Italie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pain plat levé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T65 | 600 | g | pâte | non |
| Eau | 420 | ml | hydratation | non |
| Levure boulangère sèche | 5 | g | fermentation | non |
| Huile d’olive vierge extra | 100 | ml | pâte_et_surface | non |
| Sel fin | 14 | g | pâte | non |
| Saumure légère | 80 | ml | surface | non |

#### Méthode canonique

1. Mélanger une pâte très hydratée et développer le gluten par rabats.
2. Fermenter jusqu’à pâte gonflée, puis l’étaler sans la dégazer complètement.
3. Former les fossettes avec les doigts et verser huile et saumure.
4. Cuire à four très chaud jusqu’à dessous croustillant et surface dorée.

**Techniques** : hydratation élevée, rabats, fermentation, façonnage par fossettes, cuisson forte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : huile_olive, pâte_fermentée, sel
- **Textures cibles** : croûte_fine, base_croustillante, mie_aérée_et_huileuse
- **Ingrédients signatures** : farine, eau, huile_olive, saumure
- **Garde-fous / dérives interdites** : forte_hydratation, fossettes, huile_et_saumure, pas_de_pâte_sèche
- **Conservation** : 2 jours ; congélation 2 mois.
- **Allergènes structurels** : gluten

---

### REAL-108 — Tortilla española

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : omelette épaisse
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 800 | g | base | non |
| Œuf cru | 8 | u | liaison | non |
| Oignon jaune cru | 250 | g | aromatique | oui |
| Huile d’olive vierge extra | 300 | ml | cuisson | non |
| Sel fin | 6 | g | assaisonnement | non |

#### Méthode canonique

1. Confire doucement pommes de terre et oignon dans l’huile sans brunir.
2. Égoutter, mélanger aux œufs salés et laisser reposer quelques minutes.
3. Cuire à la poêle jusqu’à bords pris.
4. Retourner et terminer en gardant le centre moelleux.

**Techniques** : confire, coagulation, retournement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, huile_olive, pomme_de_terre, œuf
- **Textures cibles** : extérieur_doré, centre_moelleux
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Œuf cru, Oignon jaune cru, Huile d’olive vierge extra
- **Garde-fous / dérives interdites** : pommes_de_terre_confites, œufs_assaisonnés, pas_de_lait
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : œuf

---

### REAL-109 — Croquetas de jamón

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : tapas frits
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 25 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Jambon serrano | 180 | g | garniture | non |
| Lait entier | 700 | ml | béchamel | non |
| Farine de blé T55 | 90 | g | roux | non |
| Beurre doux | 90 | g | roux | non |
| Œuf cru | 2 | u | panure | non |
| Chapelure de blé | 250 | g | panure | non |
| Huile de friture | 1200 | ml | friture | non |

#### Méthode canonique

1. Cuire une béchamel très épaisse avec jambon finement haché.
2. Étaler et refroidir au moins quatre heures.
3. Façonner, passer dans œuf puis chapelure.
4. Frire jusqu’à croûte fine et centre coulant.

**Techniques** : roux, refroidissement, façonnage, panure, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : beurre, jambon_affiné, béchamel, noix_muscade
- **Textures cibles** : croûte_croustillante, cœur_très_crémeux
- **Ingrédients signatures** : Jambon serrano, Lait entier, Farine de blé T55, Beurre doux
- **Garde-fous / dérives interdites** : béchamel_épaisse_refroidie, panure, friture
- **Conservation** : 2 jours ; congélation avant friture.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-110 — Paella valenciana

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz en paella
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz bomba cru | 500 | g | base | non |
| Poulet cru en morceaux | 700 | g | viande | non |
| Lapin cru en morceaux | 500 | g | viande | non |
| Haricot vert plat cru | 300 | g | légume | non |
| Garrofó cuit | 250 | g | légumineuse | non |
| Tomate râpée | 250 | g | sofrito | non |
| Safran | 0.4 | g | épice | non |
| Romarin frais | 4 | g | aromate | non |
| Bouillon de volaille non salé | 1400 | ml | cuisson | non |
| Huile d’olive vierge extra | 60 | ml | cuisson | non |

#### Méthode canonique

1. Colorer poulet et lapin dans la paella.
2. Ajouter haricots, tomate et safran, puis mouiller.
3. Répartir le riz sans remuer après reprise de l’ébullition.
4. Cuire jusqu’à grains secs et socarrat léger, puis reposer.

**Techniques** : saisie, sofrito, cuisson du riz, socarrat, repos.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, tomate_cuite, safran, romarin, viandes_rôties, tomate
- **Textures cibles** : riz_sec_et_distinct, socarrat_croustillant, viandes_tendres
- **Ingrédients signatures** : Riz bomba cru, Poulet cru en morceaux, Lapin cru en morceaux, Haricot vert plat cru
- **Garde-fous / dérives interdites** : pas_de_chorizo, lapin_et_poulet, riz_non_remué, socarrat
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-111 — Arroz negro

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz aux fruits de mer
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz bomba cru | 400 | g | base | non |
| Calamar cru nettoyé | 600 | g | fruits_de_mer | non |
| Encre de seiche | 30 | g | coloration | non |
| Fumet de poisson | 1100 | ml | cuisson | non |
| Tomate râpée | 200 | g | sofrito | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Huile d’olive vierge extra | 50 | ml | cuisson | non |
| Aïoli | 180 | g | service | non |

#### Méthode canonique

1. Saisir le calamar, puis préparer un sofrito très réduit.
2. Dissoudre l’encre dans le fumet chaud.
3. Ajouter le riz et le fumet, puis cuire sans remuer.
4. Reposer et servir avec aïoli.

**Techniques** : saisie, sofrito, cuisson du riz, repos.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, encre_marine, calamar, tomate
- **Textures cibles** : riz_sec, socarrat_léger, calamar_tendre
- **Ingrédients signatures** : Riz bomba cru, Calamar cru nettoyé, Encre de seiche, Fumet de poisson
- **Garde-fous / dérives interdites** : encre_de_seiche, calamar, fumet, aïoli
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : mollusques, poisson

---

### REAL-112 — Fideuà

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles aux fruits de mer
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Fideo court sec | 400 | g | base | non |
| Crevette crue entière | 500 | g | fruits_de_mer | non |
| Calamar cru nettoyé | 400 | g | fruits_de_mer | non |
| Fumet de poisson | 1000 | ml | cuisson | non |
| Tomate râpée | 220 | g | sofrito | non |
| Ail cru | 12 | g | aromatique | non |
| Safran | 0.3 | g | épice | non |
| Huile d’olive vierge extra | 50 | ml | cuisson | non |
| Aïoli | 160 | g | service | non |

#### Méthode canonique

1. Griller légèrement les fideos à sec ou dans l’huile.
2. Saisir fruits de mer et préparer le sofrito.
3. Ajouter fumet safrané et cuire les nouilles sans remuer excessivement.
4. Laisser sécher légèrement et servir avec aïoli.

**Techniques** : torréfaction, saisie, sofrito, cuisson par absorption.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, tomate_cuite, safran, fruits_de_mer, tomate
- **Textures cibles** : nouilles_fermes, bords_grillés, fruits_de_mer_tendres
- **Ingrédients signatures** : Fideo court sec, Crevette crue entière, Calamar cru nettoyé, Fumet de poisson
- **Garde-fous / dérives interdites** : fideo_court, fumet, fruits_de_mer, aïoli
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, mollusques, poisson

---

### REAL-113 — Fabada asturiana

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Faba asturiana sèche | 500 | g | base | non |
| Chorizo asturien | 250 | g | viande | non |
| Morcilla asturienne | 250 | g | viande | non |
| Poitrine de porc salée | 300 | g | viande | non |
| Safran | 0.2 | g | épice | non |
| Feuille de laurier séchée | 2 | u | aromate | non |

#### Méthode canonique

1. Tremper les fabes une nuit.
2. Les cuire à très faible frémissement avec poitrine et chorizo, en les effrayant avec un peu d’eau froide.
3. Ajouter la morcilla tardivement pour éviter qu’elle éclate.
4. Reposer avant service pour lier le bouillon.

**Techniques** : trempage, mijotage doux, cuisson séquencée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : laurier, haricot, porc_fumé, safran
- **Textures cibles** : haricots_entiers_et_crémeux, bouillon_lie, saucisses_intactes
- **Ingrédients signatures** : Faba asturiana sèche, Chorizo asturien, Morcilla asturienne, Poitrine de porc salée
- **Garde-fous / dérives interdites** : faba_asturiana, compango, cuisson_sans_remuer
- **Conservation** : 4 jours ; meilleure le lendemain.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-114 — Gazpacho andalou

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe froide
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tomate fraîche mûre | 1200 | g | base | non |
| Concombre frais | 250 | g | légume | non |
| Poivron vert frais | 200 | g | légume | non |
| Pain rassis | 100 | g | liaison | non |
| Huile d’olive vierge extra | 100 | ml | émulsion | non |
| Vinaigre de xérès | 40 | ml | acidité | non |
| Ail cru | 6 | g | aromatique | non |
| Sel fin | 8 | g | assaisonnement | non |

#### Méthode canonique

1. Mixer tomates, concombre, poivron, pain, ail et vinaigre.
2. Émulsionner avec l’huile en filet.
3. Passer au chinois pour une texture fine.
4. Refroidir plusieurs heures et ajuster l’acidité.

**Techniques** : mixage, émulsion, filtration, refroidissement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, tomate_cuite, tomate_crue, concombre, poivron, vinaigre_xérès
- **Textures cibles** : fluide_et_velouté, très_frais
- **Ingrédients signatures** : Tomate fraîche mûre, Concombre frais, Poivron vert frais, Pain rassis
- **Garde-fous / dérives interdites** : tomates_mûres, huile_olive, vinaigre_xérès, service_froid
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-115 — Salmorejo cordobés

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe froide épaisse
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 10 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tomate fraîche mûre | 1000 | g | base | non |
| Pain blanc rassis | 250 | g | liaison | non |
| Huile d’olive vierge extra | 150 | ml | émulsion | non |
| Ail cru | 6 | g | aromatique | non |
| Vinaigre de xérès | 20 | ml | acidité | non |
| Œuf dur | 3 | u | garniture | non |
| Jambon serrano | 120 | g | garniture | non |

#### Méthode canonique

1. Mixer tomate, pain, ail et vinaigre jusqu’à parfaite homogénéité.
2. Émulsionner avec l’huile pour obtenir une crème épaisse.
3. Refroidir.
4. Servir avec œuf dur et jambon hachés.

**Techniques** : mixage, émulsion, refroidissement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, tomate_cuite, tomate, huile_olive, jambon
- **Textures cibles** : très_épais_et_soyeux, garnitures_distinctes
- **Ingrédients signatures** : Tomate fraîche mûre, Pain blanc rassis, Huile d’olive vierge extra, Ail cru
- **Garde-fous / dérives interdites** : plus_épais_que_gazpacho, pain_et_huile, œuf_jambon
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, œuf

---

### REAL-116 — Gambas al ajillo

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : tapas de crevettes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 8 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Crevette crue décortiquée | 600 | g | principal | non |
| Huile d’olive vierge extra | 160 | ml | cuisson | non |
| Ail cru | 25 | g | aromatique | non |
| Piment séché | 2 | g | épice | non |
| Xérès sec | 40 | ml | déglaçage | oui |
| Persil frais | 20 | g | finition | non |
| Pain de campagne | 300 | g | service | non |

#### Méthode canonique

1. Sécher les crevettes et trancher l’ail.
2. Infuser doucement ail et piment dans l’huile sans brûler.
3. Augmenter le feu, ajouter les crevettes et cuire très brièvement.
4. Déglacer facultativement au xérès et finir au persil.

**Techniques** : infusion, saisie, déglaçage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, piment, ail_frit, huile_olive, crevette, xérès
- **Textures cibles** : crevettes_juteuses, ail_croustillant, huile_aromatique
- **Ingrédients signatures** : Crevette crue décortiquée, Huile d’olive vierge extra, Ail cru, Piment séché
- **Garde-fous / dérives interdites** : beaucoup_d_ail, huile_olive, cuisson_très_courte
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : crustacés, gluten

---

### REAL-117 — Bacalao al pil-pil

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : morue en émulsion
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Morue salée sèche | 800 | g | poisson | non |
| Huile d’olive vierge extra | 300 | ml | émulsion | non |
| Ail cru | 20 | g | aromatique | non |
| Piment séché | 2 | g | épice | non |

#### Méthode canonique

1. Dessaler la morue au froid.
2. Confire doucement l’ail et le piment dans l’huile, puis les retirer.
3. Cuire la morue peau vers le bas à basse température.
4. Émulsionner la gélatine libérée avec l’huile par mouvement circulaire jusqu’à sauce épaisse.

**Techniques** : dessalage, confit, émulsion.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, piment, morue, huile_olive
- **Textures cibles** : morue_nacrée, sauce_gélatineuse_émulsionnée
- **Ingrédients signatures** : Morue salée sèche, Huile d’olive vierge extra, Ail cru, Piment séché
- **Garde-fous / dérives interdites** : morue_avec_peau, huile_olive, émulsion_sans_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-118 — Pulpo a la gallega

- **Cuisine / origine** : Espagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulpe et pommes de terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_spanish`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulpe cru nettoyé | 1200 | g | principal | non |
| Pomme de terre crue, avec peau | 800 | g | base | non |
| Huile d’olive vierge extra | 80 | ml | finition | non |
| Paprika doux | 5 | g | épice | non |
| Paprika fumé | 3 | g | épice | non |
| Fleur de sel | 6 | g | assaisonnement | non |

#### Méthode canonique

1. Attendrir le poulpe par congélation préalable ou battage.
2. Le plonger plusieurs fois dans l’eau bouillante puis le cuire à frémissement jusqu’à tendre.
3. Cuire les pommes de terre dans l’eau du poulpe.
4. Trancher sur planche, assaisonner d’huile, paprika et sel.

**Techniques** : attendrissement, pochage, tranchage, assaisonnement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : paprika, fumé, poulpe, paprika_fumé, huile_olive
- **Textures cibles** : poulpe_tendre_non_mou, pommes_de_terre_fermes
- **Ingrédients signatures** : Poulpe cru nettoyé, Pomme de terre crue, avec peau, Huile d’olive vierge extra, Paprika doux
- **Garde-fous / dérives interdites** : poulpe, planche_en_bois, paprika, huile
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : mollusques

---

### REAL-119 — Bacalhau à Brás

- **Cuisine / origine** : Portugal
- **Identité** : `named_traditional_dish`
- **Catégorie** : morue aux œufs et pommes paille
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Morue salée sèche | 600 | g | poisson | non |
| Pomme de terre paille | 500 | g | base | non |
| Œuf cru | 8 | u | liaison | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |
| Olive noire entière | 100 | g | garniture | non |
| Persil frais | 20 | g | finition | non |

#### Méthode canonique

1. Dessaler et effeuiller la morue.
2. Faire fondre longuement l’oignon dans l’huile, ajouter la morue.
3. Incorporer les pommes paille puis les œufs battus hors feu vif.
4. Arrêter lorsque les œufs restent crémeux, finir olives et persil.

**Techniques** : dessalage, effeuillage, fondue, coagulation contrôlée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, oignon_compoté, morue, oignon, œuf, olive
- **Textures cibles** : œufs_crémeux, pommes_paille_partiellement_croustillantes
- **Ingrédients signatures** : Morue salée sèche, Pomme de terre paille, Œuf cru, Oignon jaune cru
- **Garde-fous / dérives interdites** : morue_dessalée, pommes_paille, œufs_non_secs
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, œuf

---

### REAL-120 — Caldo verde

- **Cuisine / origine** : Portugal
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de chou
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 800 | g | base | non |
| Chou kale portugais | 350 | g | légume | non |
| Chouriço portugais | 250 | g | garniture | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 10 | g | aromatique | non |
| Huile d’olive vierge extra | 60 | ml | finition | non |
| Bouillon de légumes non salé | 1200 | ml | liquide | non |

#### Méthode canonique

1. Cuire pommes de terre, oignon et ail dans le bouillon puis mixer.
2. Émincer le chou en filaments très fins.
3. Ajouter chou et chouriço tranché dans la soupe et cuire brièvement.
4. Finir avec huile d’olive crue.

**Techniques** : cuisson au bouillon, mixage, chiffonnade, finition.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, chou, huile_olive, chouriço
- **Textures cibles** : base_veloutée, chou_fin_encore_vert, saucisse_tendre
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Chou kale portugais, Chouriço portugais, Oignon jaune cru
- **Garde-fous / dérives interdites** : chou_en_chiffonnade, pomme_de_terre, chouriço
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-121 — Francesinha

- **Cuisine / origine** : Portugal
- **Identité** : `named_traditional_dish`
- **Catégorie** : sandwich gratiné en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain de mie épais | 8 | tranche | base | non |
| Steak de bœuf cru fin | 4 | u | viande | non |
| Jambon blanc cuit | 4 | tranche | garniture | non |
| Linguiça portugaise | 2 | u | garniture | non |
| Fromage flamengo | 300 | g | couverture | non |
| Bière blonde | 500 | ml | sauce | non |
| Tomate concassée en conserve | 250 | g | sauce | non |
| Bouillon de bœuf non salé | 250 | ml | sauce | non |
| Piment frais | 1 | u | épice | non |
| Œuf cru | 4 | u | garniture | oui |

#### Méthode canonique

1. Préparer une sauce réduite à base de bière, tomate, bouillon et piment.
2. Griller steak et saucisse, puis monter le sandwich avec jambon.
3. Couvrir complètement de fromage et gratiner.
4. Napper de sauce brûlante et ajouter un œuf au plat facultatif.

**Techniques** : réduction, grillade, montage, gratinage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : tomate_cuite, fromage_affiné, piment, bière, tomate, viandes_grillées, fromage
- **Textures cibles** : pain_imbibé, fromage_fondu, viandes_grillées, sauce_nappante
- **Ingrédients signatures** : Pain de mie épais, Steak de bœuf cru fin, Jambon blanc cuit, Linguiça portugaise
- **Garde-fous / dérives interdites** : sandwich_multi_viandes, fromage_total, sauce_bière_tomate
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-122 — Pastéis de nata

- **Cuisine / origine** : Portugal
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâtisserie
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 12
- **Temps** : préparation 50 min · cuisson 20 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte feuilletée inversée | 500 | g | fond | non |
| Lait entier | 500 | ml | crème | non |
| Sucre semoule | 300 | g | sirop | non |
| Jaune d’œuf cru | 8 | u | liaison | non |
| Farine de blé T55 | 50 | g | liaison | non |
| Zeste de citron | 6 | g | arôme | non |
| Bâton de cannelle | 1 | u | arôme | non |

#### Méthode canonique

1. Rouler la pâte en boudin et foncer les moules avec des spirales.
2. Préparer un sirop et une crème au lait, puis les réunir avec les jaunes sans coaguler.
3. Remplir les fonds.
4. Cuire à température maximale jusqu’à pâte très croustillante et taches brunes sur la crème.

**Techniques** : fonçage, sirop, tempérage, cuisson forte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : agrume, cannelle, citron, caramel, lait
- **Textures cibles** : feuilletage_croustillant, crème_onctueuse_tachetée
- **Ingrédients signatures** : Pâte feuilletée inversée, Lait entier, Sucre semoule, Jaune d’œuf cru
- **Garde-fous / dérives interdites** : pâte_en_spirale, crème_aux_jaunes, cuisson_très_forte
- **Conservation** : 2 jours ; meilleur le jour même.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-123 — Spanakopita

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : tourte aux épinards
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte filo | 500 | g | enveloppe | non |
| Épinard frais | 1200 | g | garniture | non |
| Feta | 400 | g | fromage | non |
| Œuf cru | 3 | u | liaison | non |
| Oignon nouveau frais | 180 | g | aromatique | non |
| Aneth frais | 25 | g | herbe | non |
| Persil frais | 25 | g | herbe | non |
| Huile d’olive vierge extra | 120 | ml | montage | non |

#### Méthode canonique

1. Faire tomber les épinards, les presser et les refroidir.
2. Mélanger avec feta, œufs, oignons et herbes.
3. Superposer les feuilles filo huilées, répartir la farce et refermer.
4. Cuire jusqu’à pâte croustillante et farce prise.

**Techniques** : tombée, égouttage, montage filo, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, feta, aneth, épinard, huile_olive
- **Textures cibles** : filo_croustillante, farce_fondante
- **Ingrédients signatures** : Pâte filo, Épinard frais, Feta, Œuf cru
- **Garde-fous / dérives interdites** : épinard_feta_filo, herbes_fraîches, farce_non_aqueuse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-124 — Dolmades

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : feuilles de vigne farcies
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Feuille de vigne en saumure | 50 | u | enveloppe | non |
| Riz rond cru | 350 | g | farce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Aneth frais | 25 | g | herbe | non |
| Menthe fraîche | 20 | g | herbe | non |
| Pignon de pin | 50 | g | croquant | oui |
| Raisin sec | 40 | g | douceur | oui |
| Huile d’olive vierge extra | 120 | ml | cuisson | non |
| Jus de citron frais | 80 | ml | acidité | non |

#### Méthode canonique

1. Rincer les feuilles et préparer une farce de riz cru, oignon, herbes et huile.
2. Rouler de petits cylindres sans serrer pour laisser gonfler le riz.
3. Ranger serrés dans une casserole, couvrir d’eau, huile et citron.
4. Cuire doucement sous une assiette puis refroidir dans le jus.

**Techniques** : farce, roulage, cuisson étouffée, refroidissement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, agrume, feuille_vigne, citron, aneth, menthe, huile_olive
- **Textures cibles** : feuille_tendre, riz_moelleux, rouleaux_intacts
- **Ingrédients signatures** : Feuille de vigne en saumure, Riz rond cru, Oignon jaune cru, Aneth frais
- **Garde-fous / dérives interdites** : feuille_de_vigne, riz, herbes, citron
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque

---

### REAL-125 — Fasolada

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot blanc sec | 500 | g | base | non |
| Tomate concassée en conserve | 600 | g | sauce | non |
| Carotte crue | 300 | g | légume | non |
| Céleri branche cru | 180 | g | aromatique | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Persil frais | 20 | g | finition | non |

#### Méthode canonique

1. Tremper les haricots et commencer leur cuisson à l’eau.
2. Ajouter oignon, carotte, céleri, tomate et laurier.
3. Mijoter jusqu’à haricots crémeux mais entiers.
4. Finir généreusement à l’huile d’olive et au persil.

**Techniques** : trempage, mijotage, finition huile.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, laurier, haricot, tomate, céleri, huile_olive
- **Textures cibles** : bouillon_épais, haricots_crémeux
- **Ingrédients signatures** : Haricot blanc sec, Tomate concassée en conserve, Carotte crue, Céleri branche cru
- **Garde-fous / dérives interdites** : haricot_blanc, tomate, huile_olive
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : céleri

---

### REAL-126 — Gigantes plaki

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : haricots géants au four
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot géant sec | 500 | g | base | non |
| Tomate concassée en conserve | 700 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Carotte crue | 200 | g | légume | non |
| Céleri branche cru | 150 | g | aromatique | non |
| Huile d’olive vierge extra | 100 | ml | cuisson | non |
| Aneth frais | 20 | g | herbe | non |
| Persil frais | 20 | g | herbe | non |

#### Méthode canonique

1. Tremper puis précuire les haricots jusqu’à presque tendres.
2. Préparer une sauce tomate aux légumes et herbes.
3. Mélanger dans un plat avec beaucoup d’huile d’olive.
4. Cuire au four jusqu’à sauce confite et surface légèrement caramélisée.

**Techniques** : trempage, précuisson, compotage, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, haricot, tomate, aneth, huile_olive
- **Textures cibles** : haricots_fondants, sauce_confite
- **Ingrédients signatures** : Haricot géant sec, Tomate concassée en conserve, Oignon jaune cru, Carotte crue
- **Garde-fous / dérives interdites** : haricot_géant, cuisson_au_four, huile_olive
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : céleri

---

### REAL-127 — Souvlaki de porc

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : brochettes grillées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Échine de porc crue | 800 | g | viande | non |
| Huile d’olive vierge extra | 60 | ml | marinade | non |
| Jus de citron frais | 50 | ml | acidité | non |
| Ail cru | 12 | g | aromatique | non |
| Origan séché | 6 | g | herbe | non |
| Pain pita | 8 | u | service | non |
| Tzatziki | 250 | g | service | non |
| Tomate fraîche mûre | 300 | g | garniture | non |

#### Méthode canonique

1. Découper le porc en cubes et mariner avec huile, citron, ail et origan.
2. Monter sur brochettes et griller vivement.
3. Laisser reposer brièvement.
4. Servir dans pita avec tomate et tzatziki.

**Techniques** : marinade, brochette, grillade, repos.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, tomate_cuite, agrume, citron, origan, porc_grillé
- **Textures cibles** : bords_grillés, cœur_juteux, pita_souple
- **Ingrédients signatures** : Échine de porc crue, Huile d’olive vierge extra, Jus de citron frais, Ail cru
- **Garde-fous / dérives interdites** : porc_mariné, origan, citron, grillade
- **Conservation** : Composants 3 jours séparément.
- **Allergènes structurels** : gluten

---

### REAL-128 — Kleftiko d’agneau

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : agneau en papillote
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 210 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule d’agneau crue | 1400 | g | viande | non |
| Pomme de terre crue, épluchée | 1000 | g | féculent | non |
| Jus de citron frais | 80 | ml | acidité | non |
| Ail cru | 20 | g | aromatique | non |
| Origan séché | 6 | g | herbe | non |
| Feta | 200 | g | finition | oui |
| Huile d’olive vierge extra | 70 | ml | cuisson | non |

#### Méthode canonique

1. Mariner l’agneau avec citron, ail, origan et huile.
2. Enfermer avec les pommes de terre dans une papillote de papier cuisson et aluminium.
3. Cuire longtemps à basse température jusqu’à viande détachable.
4. Ouvrir, ajouter feta facultative et colorer à four vif.

**Techniques** : marinade, papillote, cuisson lente, gratination.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, agrume, agneau, citron, origan
- **Textures cibles** : viande_confite, pommes_de_terre_fondantes, bords_rôtis
- **Ingrédients signatures** : Épaule d’agneau crue, Pomme de terre crue, épluchée, Jus de citron frais, Ail cru
- **Garde-fous / dérives interdites** : agneau, papillote, citron_origan
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-129 — Avgolemono

- **Cuisine / origine** : Grèce
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe poulet citron
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru | 1400 | g | bouillon | non |
| Riz rond cru | 180 | g | féculent | non |
| Œuf cru | 3 | u | liaison | non |
| Jus de citron frais | 100 | ml | acidité | non |
| Carotte crue | 200 | g | aromatique | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Aneth frais | 15 | g | finition | non |

#### Méthode canonique

1. Pocher le poulet avec aromates, filtrer le bouillon et effilocher la chair.
2. Cuire le riz dans le bouillon.
3. Fouetter œufs et citron, puis tempérer progressivement avec le bouillon chaud.
4. Réincorporer sans faire bouillir et ajouter poulet et aneth.

**Techniques** : pochage, filtration, tempérage, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : oignon_compoté, agrume, citron, poulet, œuf, aneth
- **Textures cibles** : bouillon_velouté, riz_tendre, poulet_effiloché
- **Ingrédients signatures** : Poulet entier cru, Riz rond cru, Œuf cru, Jus de citron frais
- **Garde-fous / dérives interdites** : liaison_œuf_citron, pas_de_crème, ne_pas_bouillir
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : œuf

---

### REAL-130 — İmam bayıldı

- **Cuisine / origine** : Turquie
- **Identité** : `named_traditional_dish`
- **Catégorie** : aubergines farcies
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 6 | u | base | non |
| Oignon jaune cru | 500 | g | farce | non |
| Tomate fraîche mûre | 600 | g | farce | non |
| Ail cru | 20 | g | aromatique | non |
| Huile d’olive vierge extra | 160 | ml | cuisson | non |
| Persil frais | 25 | g | herbe | non |
| Sucre semoule | 8 | g | équilibre | oui |
| Jus de citron frais | 30 | ml | acidité | non |

#### Méthode canonique

1. Fendre et saler les aubergines, puis les colorer ou rôtir jusqu’à assouplies.
2. Compoter longuement oignon, ail et tomate dans l’huile.
3. Farcir les aubergines avec cette garniture.
4. Cuire doucement au four et servir à température ambiante.

**Techniques** : dégorgement, compotage, farcissage, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, aubergine, oignon, tomate, huile_olive
- **Textures cibles** : aubergine_confite, farce_fondante
- **Ingrédients signatures** : Aubergine fraîche, Oignon jaune cru, Tomate fraîche mûre, Ail cru
- **Garde-fous / dérives interdites** : plat_végétal, beaucoup_d_oignon_et_huile, service_tiède
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-131 — Menemen

- **Cuisine / origine** : Turquie
- **Identité** : `named_traditional_dish`
- **Catégorie** : œufs brouillés à la tomate
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 8 | u | protéine | non |
| Tomate fraîche mûre | 700 | g | base | non |
| Piment vert doux frais | 250 | g | légume | non |
| Oignon jaune cru | 150 | g | aromatique | oui |
| Beurre doux | 40 | g | cuisson | non |
| Pul biber | 3 | g | épice | non |

#### Méthode canonique

1. Faire fondre les piments et éventuellement l’oignon.
2. Ajouter les tomates et réduire jusqu’à sauce épaisse.
3. Ajouter les œufs et remuer doucement pour garder de gros morceaux crémeux.
4. Servir immédiatement avec pain.

**Techniques** : compotage, réduction, coagulation contrôlée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : oignon_compoté, tomate_cuite, beurre, piment, tomate, piment_doux, œuf
- **Textures cibles** : œufs_crémeux, sauce_épaisse
- **Ingrédients signatures** : Œuf cru, Tomate fraîche mûre, Piment vert doux frais, Oignon jaune cru
- **Garde-fous / dérives interdites** : œufs_dans_tomate_et_piment, pas_d_omelette_sèche
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, œuf

---

### REAL-132 — Mantı turcs

- **Cuisine / origine** : Turquie
- **Identité** : `named_traditional_dish`
- **Catégorie** : raviolis au yaourt
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 90 min · cuisson 20 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Œuf cru | 1 | u | pâte | non |
| Eau | 180 | ml | pâte | non |
| Bœuf haché cru 15 % MG | 400 | g | farce | non |
| Oignon jaune cru | 120 | g | farce | non |
| Yaourt grec | 500 | g | sauce | non |
| Ail cru | 15 | g | sauce | non |
| Beurre doux | 80 | g | sauce | non |
| Paprika doux | 5 | g | épice | non |
| Menthe séchée | 3 | g | finition | non |

#### Méthode canonique

1. Pétrir une pâte ferme, l’étaler très finement et couper de petits carrés.
2. Déposer une minuscule farce de viande et oignon, puis fermer.
3. Pocher les mantı jusqu’à tendres.
4. Servir avec yaourt à l’ail et beurre chaud au paprika et menthe.

**Techniques** : pétrissage, laminage, farce, pochage, sauces.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, oignon_compoté, beurre, paprika, yaourt_ail, beurre_paprika, menthe, viande
- **Textures cibles** : petits_raviolis_tendres, sauce_froide_et_beurre_chaud
- **Ingrédients signatures** : Farine de blé T55, Œuf cru, Eau, Bœuf haché cru 15 % MG
- **Garde-fous / dérives interdites** : petite_taille, yaourt_ail, beurre_épicé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-133 — Lahmacun

- **Cuisine / origine** : Turquie
- **Identité** : `named_traditional_dish`
- **Catégorie** : pain plat garni
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 45 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Eau | 300 | ml | pâte | non |
| Levure boulangère sèche | 5 | g | fermentation | non |
| Agneau haché cru | 450 | g | garniture | non |
| Tomate fraîche mûre | 300 | g | garniture | non |
| Poivron rouge frais | 200 | g | garniture | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Persil frais | 25 | g | herbe | non |
| Pul biber | 4 | g | épice | non |
| Jus de citron frais | 50 | ml | service | non |

#### Méthode canonique

1. Préparer une pâte levée souple et la diviser.
2. Hacher très finement viande, tomate, poivron, oignon, persil et épices.
3. Étaler la pâte très mince, répartir une couche fine de farce.
4. Cuire très chaud puis rouler avec citron et herbes.

**Techniques** : pâte levée, hachage, étalage, cuisson forte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, tomate_cuite, agrume, agneau, tomate, piment, persil, citron
- **Textures cibles** : pain_fin_aux_bords_croustillants, farce_juteuse
- **Ingrédients signatures** : Farine de blé T55, Eau, Levure boulangère sèche, Agneau haché cru
- **Garde-fous / dérives interdites** : pain_très_fin, farce_crue_étalée, cuisson_très_chaude
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-134 — Musakhan palestinien

- **Cuisine / origine** : Palestine
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet au sumac sur pain
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 80 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1500 | g | viande | non |
| Oignon jaune cru | 900 | g | base | non |
| Pain taboon | 6 | u | support | non |
| Sumac moulu | 30 | g | épice | non |
| Huile d’olive vierge extra | 180 | ml | cuisson | non |
| Pignon de pin | 80 | g | garniture | non |
| Piment de la Jamaïque moulu | 3 | g | épice | non |

#### Méthode canonique

1. Rôtir ou braiser le poulet assaisonné de sumac et épices.
2. Confire longuement les oignons dans beaucoup d’huile d’olive avec sumac.
3. Imbiber légèrement le pain de jus et d’huile, couvrir d’oignons.
4. Poser le poulet, réchauffer au four et finir de pignons.

**Techniques** : rôtissage, confit d’oignon, montage, réchauffage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, piment, sumac, oignon_confit, huile_olive, poulet, pignon
- **Textures cibles** : pain_imprégné, bords_croustillants, poulet_juteux, oignons_confits
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Oignon jaune cru, Pain taboon, Sumac moulu
- **Garde-fous / dérives interdites** : sumac_dominant, oignons_abondants, pain_taboon
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten

---

### REAL-135 — Maqluba

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz renversé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 90 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz basmati cru | 500 | g | base | non |
| Épaule d’agneau crue | 800 | g | viande | non |
| Aubergine fraîche | 700 | g | légume | non |
| Chou-fleur frais | 500 | g | légume | non |
| Bouillon d’agneau non salé | 1100 | ml | cuisson | non |
| Cannelle moulue | 2 | g | épice | non |
| Piment de la Jamaïque moulu | 3 | g | épice | non |
| Amande grillée | 80 | g | garniture | non |

#### Méthode canonique

1. Cuire partiellement la viande et conserver le bouillon.
2. Frire ou rôtir aubergine et chou-fleur.
3. Monter en couches dans une marmite : viande, légumes, riz et bouillon épicé.
4. Cuire par absorption, reposer puis renverser d’un geste net.

**Techniques** : précuisson, friture ou rôtissage, montage, absorption, renversement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : piment, cannelle, agneau, aubergine, chou_fleur
- **Textures cibles** : riz_grainé, légumes_fondants, forme_renversée_tenue
- **Ingrédients signatures** : Riz basmati cru, Épaule d’agneau crue, Aubergine fraîche, Chou-fleur frais
- **Garde-fous / dérives interdites** : montage_en_couches, renversement, riz_non_pâteux
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque

---

### REAL-136 — Mujaddara

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz lentilles oignons
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_global`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille brune sèche, crue | 350 | g | légumineuse | non |
| Riz long blanc cru | 300 | g | céréale | non |
| Oignon jaune cru | 800 | g | garniture | non |
| Huile d’olive vierge extra | 100 | ml | cuisson | non |
| Cumin moulu | 5 | g | épice | non |
| Yaourt nature | 250 | g | service | oui |

#### Méthode canonique

1. Cuire les lentilles jusqu’à mi-tendreté.
2. Caraméliser une grande quantité d’oignons jusqu’à brun foncé, en réserver une partie croustillante.
3. Ajouter riz, lentilles, cumin et eau mesurée, puis cuire par absorption.
4. Servir avec les oignons et yaourt facultatif.

**Techniques** : précuisson, caramélisation, absorption.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, cumin, oignon_caramélisé, lentille, huile_olive
- **Textures cibles** : riz_et_lentilles_distincts, oignons_croustillants
- **Ingrédients signatures** : Lentille brune sèche, crue, Riz long blanc cru, Oignon jaune cru, Huile d’olive vierge extra
- **Garde-fous / dérives interdites** : oignon_très_abondant, lentilles_et_riz, caramélisation_profonde
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-137 — Fattoush

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade de pain
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 8 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain pita | 4 | u | croquant | non |
| Tomate fraîche mûre | 500 | g | légume | non |
| Concombre frais | 400 | g | légume | non |
| Radis frais | 200 | g | légume | non |
| Laitue romaine fraîche | 300 | g | salade | non |
| Persil plat frais | 30 | g | herbe | non |
| Menthe fraîche | 25 | g | herbe | non |
| Sumac moulu | 8 | g | épice | non |
| Mélasse de grenade | 40 | ml | vinaigrette | non |
| Jus de citron frais | 50 | ml | vinaigrette | non |
| Huile d’olive vierge extra | 70 | ml | vinaigrette | non |

#### Méthode canonique

1. Griller ou frire le pain pita et le casser en éclats.
2. Tailler les légumes et hacher abondamment les herbes.
3. Émulsionner citron, mélasse de grenade, huile et sumac.
4. Assembler juste avant service pour garder le pain croustillant.

**Techniques** : grillade du pain, taillage, émulsion, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, tomate_cuite, agrume, sumac, menthe, persil, mélasse_grenade
- **Textures cibles** : légumes_croquants, pain_croustillant
- **Ingrédients signatures** : Pain pita, Tomate fraîche mûre, Concombre frais, Radis frais
- **Garde-fous / dérives interdites** : pain_pita, sumac, mélasse_grenade, herbes
- **Conservation** : À assembler au dernier moment.
- **Allergènes structurels** : gluten

---

### REAL-138 — Taboulé libanais

- **Cuisine / origine** : Liban
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade d herbes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Persil plat frais | 400 | g | base | non |
| Tomate fraîche mûre | 400 | g | légume | non |
| Boulgour fin cru | 80 | g | céréale | non |
| Menthe fraîche | 40 | g | herbe | non |
| Oignon nouveau frais | 150 | g | aromatique | non |
| Jus de citron frais | 100 | ml | acidité | non |
| Huile d’olive vierge extra | 90 | ml | vinaigrette | non |

#### Méthode canonique

1. Réhydrater très peu le boulgour ou le laisser gonfler dans le jus de tomate et citron.
2. Hacher le persil au couteau sans le réduire en purée.
3. Tailler tomate, menthe et oignon très finement.
4. Mélanger avec citron et huile peu avant service.

**Techniques** : hachage fin, réhydratation, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, tomate_cuite, agrume, persil, citron, menthe, tomate
- **Textures cibles** : très_frais, herbes_légères, peu_de_boulgour
- **Ingrédients signatures** : Persil plat frais, Tomate fraîche mûre, Boulgour fin cru, Menthe fraîche
- **Garde-fous / dérives interdites** : persil_majoritaire, peu_de_boulgour, citron_abondant
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-139 — Baba ganoush

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : purée d aubergine fumée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `simply_mediterranean`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 1000 | g | base | non |
| Tahini | 100 | g | sauce | non |
| Jus de citron frais | 70 | ml | acidité | non |
| Ail cru | 10 | g | aromatique | non |
| Huile d’olive vierge extra | 50 | ml | finition | non |
| Persil frais | 20 | g | herbe | non |

#### Méthode canonique

1. Brûler ou griller les aubergines entières jusqu’à peau noire et chair effondrée.
2. Égoutter la chair pour retirer l’excès d’eau.
3. Écraser avec tahini, citron et ail en gardant une légère texture.
4. Finir à l’huile et aux herbes.

**Techniques** : grillade directe, égouttage, écrasement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, agrume, aubergine_fumée, tahini, citron
- **Textures cibles** : crémeux_avec_fibres_légères
- **Ingrédients signatures** : Aubergine fraîche, Tahini, Jus de citron frais, Ail cru
- **Garde-fous / dérives interdites** : aubergine_vraiment_fumée, tahini, citron, pas_de_purée_neutre
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : sésame

---

### REAL-140 — Muhammara

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : tartinade de poivron et noix
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 25 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_global`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poivron rouge frais | 800 | g | base | non |
| Noix | 180 | g | oléagineux | non |
| Chapelure de blé | 100 | g | liaison | non |
| Mélasse de grenade | 60 | ml | acidité_douce | non |
| Huile d’olive vierge extra | 80 | ml | émulsion | non |
| Piment d Alep | 8 | g | épice | non |
| Cumin moulu | 3 | g | épice | non |

#### Méthode canonique

1. Griller les poivrons jusqu’à peau noire, les peler et les égoutter.
2. Torréfier les noix.
3. Mixer grossièrement poivron, noix, chapelure, mélasse et épices.
4. Ajouter l’huile pour une texture épaisse et tartinable.

**Techniques** : grillade, torréfaction, mixage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : oléagineux, toasté, savoureux
- **Aromas signatures** : cumin, piment, poivron_fumé, noix, mélasse_grenade, piment_alep
- **Textures cibles** : épaisse_légèrement_granuleuse
- **Ingrédients signatures** : Poivron rouge frais, Noix, Chapelure de blé, Mélasse de grenade
- **Garde-fous / dérives interdites** : poivron_grillé, noix, mélasse_grenade
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten

---

### REAL-141 — Kibbeh bil sanieh

- **Cuisine / origine** : Levant
- **Identité** : `named_traditional_dish`
- **Catégorie** : kibbeh au four
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 45 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Boulgour fin cru | 350 | g | enveloppe | non |
| Agneau haché cru | 800 | g | viande | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Pignon de pin | 100 | g | farce | non |
| Cannelle moulue | 2 | g | épice | non |
| Piment de la Jamaïque moulu | 3 | g | épice | non |
| Huile d’olive vierge extra | 80 | ml | cuisson | non |

#### Méthode canonique

1. Faire gonfler le boulgour et le pétrir avec une partie de l’agneau et les épices.
2. Préparer une farce d’agneau sauté, oignon et pignons.
3. Monter une couche de pâte de kibbeh, la farce, puis une seconde couche.
4. Inciser en losanges, huiler et cuire jusqu’à croûte dorée.

**Techniques** : réhydratation, pétrissage, farce, montage, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, piment, cannelle, agneau, boulgour, pignon
- **Textures cibles** : croûte_ferme, cœur_juteux, grains_fins
- **Ingrédients signatures** : Boulgour fin cru, Agneau haché cru, Oignon jaune cru, Pignon de pin
- **Garde-fous / dérives interdites** : boulgour_et_agneau_pétris, farce_centrale, découpe_losanges
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten

---

### REAL-142 — Tajine de poulet au citron confit et olives

- **Cuisine / origine** : Maroc
- **Identité** : `named_traditional_dish`
- **Catégorie** : tajine
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 75 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `simply_mediterranean`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, sans peau | 1500 | g | viande | non |
| Citron confit au sel | 2 | u | signature | non |
| Olive verte dénoyautée | 250 | g | garniture | non |
| Oignon jaune cru | 400 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre moulu | 4 | g | épice | non |
| Curcuma moulu | 4 | g | épice | non |
| Safran | 0.2 | g | épice | non |
| Coriandre fraîche | 25 | g | herbe | non |
| Persil frais | 25 | g | herbe | non |
| Huile d’olive vierge extra | 60 | ml | cuisson | non |

#### Méthode canonique

1. Mariner ou masser le poulet avec épices, ail et herbes.
2. Faire fondre les oignons, poser le poulet et ajouter très peu d’eau.
3. Cuire couvert jusqu’à poulet tendre.
4. Ajouter olives et peau du citron confit rincée en fin de cuisson, puis réduire le jus.

**Techniques** : marinade, cuisson étouffée, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, agrume, coriandre, gingembre, citron_confit, olive, safran
- **Textures cibles** : poulet_fondant, jus_court_et_brillant
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, sans peau, Citron confit au sel, Olive verte dénoyautée, Oignon jaune cru
- **Garde-fous / dérives interdites** : citron_confit_et_olives, peu_de_liquide, pas_de_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-143 — Tajine d’agneau aux pruneaux

- **Cuisine / origine** : Maroc
- **Identité** : `named_traditional_dish`
- **Catégorie** : tajine sucré-salé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule d’agneau crue | 1200 | g | viande | non |
| Pruneau dénoyauté | 350 | g | fruit | non |
| Oignon jaune cru | 350 | g | aromatique | non |
| Miel | 60 | g | équilibre | non |
| Cannelle en bâton | 2 | u | épice | non |
| Gingembre moulu | 4 | g | épice | non |
| Safran | 0.2 | g | épice | non |
| Amande mondée | 120 | g | garniture | non |
| Sésame | 30 | g | finition | non |

#### Méthode canonique

1. Faire revenir doucement l’agneau avec oignon et épices.
2. Mouiller peu et cuire à couvert jusqu’à tendreté.
3. Pocher les pruneaux dans une partie du jus avec miel et cannelle.
4. Réunir, glacer la sauce et finir d’amandes et sésame.

**Techniques** : mijotage, pochage, glacage, torréfaction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : oignon_compoté, gingembre, sésame_toasté, cannelle, miel, agneau, pruneau, safran
- **Textures cibles** : viande_fondante, pruneaux_glacés, amandes_croquantes
- **Ingrédients signatures** : Épaule d’agneau crue, Pruneau dénoyauté, Oignon jaune cru, Miel
- **Garde-fous / dérives interdites** : sucré_salé_assumé, pruneaux_entiers, sauce_sirupeuse_non_dessert
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, sésame

---

### REAL-144 — Harira

- **Cuisine / origine** : Maroc
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe complète
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille brune sèche, crue | 200 | g | légumineuse | non |
| Pois chiche cuit, égoutté | 400 | g | légumineuse | non |
| Agneau cru en petits dés | 350 | g | viande | oui |
| Tomate concassée en conserve | 800 | g | base | non |
| Céleri branche cru | 180 | g | aromatique | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Coriandre fraîche | 30 | g | herbe | non |
| Persil frais | 30 | g | herbe | non |
| Vermicelle fin sec | 120 | g | féculent | non |
| Farine de blé T55 | 60 | g | liaison | non |
| Gingembre moulu | 4 | g | épice | non |
| Cannelle moulue | 1 | g | épice | non |

#### Méthode canonique

1. Faire revenir viande facultative, oignon, céleri, herbes et épices.
2. Ajouter tomate, lentilles et eau, puis mijoter.
3. Ajouter pois chiches et vermicelles.
4. Verser progressivement une liaison farine-eau pour épaissir sans grumeaux.

**Techniques** : suer, mijotage, liaison, cuisson des vermicelles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, tomate_cuite, coriandre, gingembre, cannelle, tomate, céleri
- **Textures cibles** : soupe_nappante, légumineuses_tendres, vermicelles
- **Ingrédients signatures** : Lentille brune sèche, crue, Pois chiche cuit, égoutté, Agneau cru en petits dés, Tomate concassée en conserve
- **Garde-fous / dérives interdites** : liaison_farinaire, herbes_abondantes, lentilles_pois_chiches
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : céleri, gluten

---

### REAL-145 — Pastilla au poulet et amandes

- **Cuisine / origine** : Maroc
- **Identité** : `named_traditional_dish`
- **Catégorie** : tourte sucrée-salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 70 min · cuisson 100 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Feuille de brick | 12 | u | enveloppe | non |
| Cuisse de poulet crue, avec os, sans peau | 1200 | g | viande | non |
| Oignon jaune cru | 600 | g | garniture | non |
| Œuf cru | 6 | u | liaison | non |
| Amande mondée | 250 | g | croquant | non |
| Sucre glace | 60 | g | finition | non |
| Cannelle moulue | 8 | g | épice | non |
| Safran | 0.2 | g | épice | non |
| Gingembre moulu | 4 | g | épice | non |
| Beurre clarifié | 120 | g | montage | non |

#### Méthode canonique

1. Cuire le poulet avec oignons, épices et très peu d’eau, puis l’effilocher.
2. Réduire fortement les oignons et incorporer les œufs pour obtenir une farce sèche.
3. Frire ou griller les amandes avec sucre et cannelle.
4. Monter les couches dans les bricks beurrées et cuire jusqu’à très croustillant.

**Techniques** : mijotage, effilochage, réduction, liaison aux œufs, montage brick.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : oignon_compoté, beurre, gingembre, cannelle, safran, amande, poulet, oignon
- **Textures cibles** : brick_croustillante, farce_moelleuse, amandes_granuleuses
- **Ingrédients signatures** : Feuille de brick, Cuisse de poulet crue, avec os, sans peau, Oignon jaune cru, Œuf cru
- **Garde-fous / dérives interdites** : trois_composants_poulet_œufs_amandes, sucré_salé, brick
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, lait, œuf

---

### REAL-146 — Rfissa

- **Cuisine / origine** : Maroc
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet lentilles et msemen
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 100 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `bbc_good_food`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, sans peau | 1500 | g | viande | non |
| Msemen cuit | 8 | u | pain | non |
| Lentille brune sèche, crue | 250 | g | légumineuse | non |
| Oignon jaune cru | 500 | g | aromatique | non |
| Fenugrec en graines | 20 | g | épice | non |
| Ras el hanout | 12 | g | épice | non |
| Safran | 0.2 | g | épice | non |
| Coriandre fraîche | 25 | g | herbe | non |
| Beurre clarifié | 50 | g | cuisson | non |

#### Méthode canonique

1. Cuire le poulet avec oignons, lentilles, fenugrec et épices dans un bouillon parfumé.
2. Effilocher ou laisser les morceaux entiers.
3. Découper le msemen en rubans et le disposer dans un grand plat.
4. Imbiber de bouillon, ajouter lentilles, oignons et poulet.

**Techniques** : mijotage, cuisson des lentilles, déchirage, imbibage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, beurre, coriandre, fenugrec, ras_el_hanout, oignon, poulet
- **Textures cibles** : pain_imprégné, lentilles_tendres, poulet_fondant
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, sans peau, Msemen cuit, Lentille brune sèche, crue, Oignon jaune cru
- **Garde-fous / dérives interdites** : msemen_déchiré, fenugrec, lentilles, poulet
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-147 — Brik à l’œuf

- **Cuisine / origine** : Tunisie
- **Identité** : `named_traditional_dish`
- **Catégorie** : feuille frite farcie
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 10 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Feuille de brick | 4 | u | enveloppe | non |
| Œuf cru | 4 | u | cœur | non |
| Thon au naturel en conserve, égoutté | 160 | g | farce | non |
| Pomme de terre cuite | 250 | g | farce | non |
| Câpre au vinaigre, égouttée | 40 | g | farce | non |
| Persil frais | 20 | g | herbe | non |
| Harissa | 20 | g | condiment | oui |
| Huile de friture | 1000 | ml | friture | non |
| Citron jaune frais | 1 | u | service | non |

#### Méthode canonique

1. Préparer la farce de pomme de terre, thon, câpres et persil.
2. Déposer sur la brick, creuser et casser l’œuf.
3. Replier rapidement et frire en arrosant pour souder.
4. Servir immédiatement avec citron, en gardant le jaune coulant.

**Techniques** : farce, pliage, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : agrume, œuf, thon, câpre, harissa, citron
- **Textures cibles** : brick_très_croustillante, jaune_coulant
- **Ingrédients signatures** : Feuille de brick, Œuf cru, Thon au naturel en conserve, égoutté, Pomme de terre cuite
- **Garde-fous / dérives interdites** : feuille_de_brick, œuf_entier, jaune_coulant, friture
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : poisson, œuf

---

### REAL-148 — Doro wat

- **Cuisine / origine** : Éthiopie
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de poulet épicé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, sans peau | 1500 | g | viande | non |
| Oignon rouge cru | 900 | g | base | non |
| Berbéré | 35 | g | épice | non |
| Beurre clarifié épicé niter kibbeh | 120 | g | cuisson | non |
| Ail cru | 20 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Œuf dur | 6 | u | garniture | non |
| Jus de citron frais | 40 | ml | marinade | non |

#### Méthode canonique

1. Faire mariner le poulet au citron.
2. Cuire très longuement les oignons à sec puis ajouter le niter kibbeh et le berbéré.
3. Ajouter ail, gingembre et poulet avec peu d’eau, puis mijoter jusqu’à sauce très épaisse.
4. Ajouter les œufs incisés en fin de cuisson et servir avec injera.

**Techniques** : compotage long, torréfaction, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, beurre, agrume, gingembre, berbéré, niter_kibbeh
- **Textures cibles** : sauce_très_épaisse, poulet_fondant, œuf_ferme
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, sans peau, Oignon rouge cru, Berbéré, Beurre clarifié épicé niter kibbeh
- **Garde-fous / dérives interdites** : oignon_très_abondant, berbéré, niter_kibbeh, œufs
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : lait, œuf

---

### REAL-149 — Misir wat

- **Cuisine / origine** : Éthiopie
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de lentilles
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `epicurious_indian`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille corail sèche, crue | 450 | g | base | non |
| Oignon rouge cru | 500 | g | aromatique | non |
| Berbéré | 25 | g | épice | non |
| Beurre clarifié épicé niter kibbeh | 80 | g | cuisson | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Tomate concentrée | 40 | g | liaison | non |

#### Méthode canonique

1. Compoter les oignons sans matière grasse jusqu’à très tendres.
2. Ajouter niter kibbeh, berbéré, ail, gingembre et tomate.
3. Ajouter lentilles et eau progressivement.
4. Cuire jusqu’à texture épaisse mais lentilles encore perceptibles.

**Techniques** : compotage, torréfaction, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, beurre, gingembre, berbéré, lentille, oignon
- **Textures cibles** : épais_et_crémeux, grains_partiellement_fondus
- **Ingrédients signatures** : Lentille corail sèche, crue, Oignon rouge cru, Berbéré, Beurre clarifié épicé niter kibbeh
- **Garde-fous / dérives interdites** : berbéré, oignon_compoté, lentilles_corail
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-150 — Shiro wat

- **Cuisine / origine** : Éthiopie
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de pois chiche
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de pois chiche grillée | 300 | g | base | non |
| Oignon rouge cru | 400 | g | aromatique | non |
| Berbéré | 18 | g | épice | non |
| Beurre clarifié épicé niter kibbeh | 70 | g | cuisson | non |
| Ail cru | 12 | g | aromatique | non |
| Tomate concentrée | 30 | g | liaison | non |
| Bouillon de légumes non salé | 1000 | ml | liquide | non |

#### Méthode canonique

1. Compoter l’oignon, puis ajouter matière grasse, berbéré et tomate.
2. Délayer la farine de pois chiche dans du bouillon froid.
3. Verser progressivement en fouettant.
4. Cuire doucement jusqu’à sauce lisse et épaisse.

**Techniques** : compotage, délayage, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, beurre, pois_chiche_grillé, berbéré, oignon
- **Textures cibles** : lisse, nappant, sans_grumeaux
- **Ingrédients signatures** : Farine de pois chiche grillée, Oignon rouge cru, Berbéré, Beurre clarifié épicé niter kibbeh
- **Garde-fous / dérives interdites** : farine_de_pois_chiche_grillée, berbéré, texture_sauce
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### REAL-151 — Tibs de bœuf

- **Cuisine / origine** : Éthiopie
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf sauté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à griller cru, en cubes | 800 | g | viande | non |
| Beurre clarifié épicé niter kibbeh | 80 | g | cuisson | non |
| Oignon rouge cru | 250 | g | aromatique | non |
| Piment vert frais | 150 | g | légume | non |
| Tomate fraîche mûre | 300 | g | garniture | oui |
| Romarin frais | 5 | g | herbe | non |
| Ail cru | 12 | g | aromatique | non |
| Awaze | 50 | g | condiment | oui |

#### Méthode canonique

1. Chauffer fortement la poêle et saisir le bœuf en petites quantités.
2. Ajouter oignon et piment sans faire bouillir la viande.
3. Ajouter niter kibbeh, ail et romarin.
4. Servir immédiatement avec awaze et injera.

**Techniques** : saisie vive, sauté, finition.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, beurre, piment, niter_kibbeh, romarin, bœuf_saisi
- **Textures cibles** : bords_rôtis, cœur_juteux, légumes_encore_fermes
- **Ingrédients signatures** : Bœuf à griller cru, en cubes, Beurre clarifié épicé niter kibbeh, Oignon rouge cru, Piment vert frais
- **Garde-fous / dérives interdites** : saisie_vive, niter_kibbeh, injera
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : lait

---

### REAL-152 — Jollof rice nigérian

- **Cuisine / origine** : Nigeria
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz à la tomate
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz long étuvé cru | 500 | g | base | non |
| Tomate fraîche mûre | 700 | g | sauce | non |
| Poivron rouge frais | 400 | g | sauce | non |
| Piment scotch bonnet | 1 | u | épice | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Tomate concentrée | 80 | g | liaison | non |
| Bouillon de volaille non salé | 1000 | ml | cuisson | non |
| Huile végétale raffinée | 100 | ml | cuisson | non |
| Thym séché | 3 | g | herbe | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Curry en poudre | 5 | g | épice | non |

#### Méthode canonique

1. Mixer tomate, poivron, piment et une partie de l’oignon, puis cuire cette base jusqu’à perdre son eau crue.
2. Frire la tomate concentrée et les épices dans l’huile, puis ajouter la base réduite.
3. Ajouter riz et bouillon mesuré, couvrir hermétiquement et cuire sans remuer.
4. Laisser légèrement attacher pour une note fumée et reposer avant d’égrener.

**Techniques** : mixage, réduction, friture de concentré, absorption, repos.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, thym, laurier, piment, tomate_réduite, poivron
- **Textures cibles** : riz_grainé, base_légèrement_fumée
- **Ingrédients signatures** : Riz long étuvé cru, Tomate fraîche mûre, Poivron rouge frais, Piment scotch bonnet
- **Garde-fous / dérives interdites** : sauce_tomate_poivron_longuement_réduite, riz_étuvé, cuisson_couverte
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-153 — Thiéboudienne

- **Cuisine / origine** : Sénégal
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz au poisson
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Mérou cru entier | 1200 | g | poisson | non |
| Riz brisé cru | 600 | g | base | non |
| Tomate concentrée | 100 | g | sauce | non |
| Carotte crue | 300 | g | légume | non |
| Chou blanc frais | 500 | g | légume | non |
| Manioc cru, épluché | 400 | g | légume | non |
| Aubergine africaine fraîche | 300 | g | légume | non |
| Persil frais | 40 | g | roff | non |
| Ail cru | 20 | g | roff | non |
| Piment frais | 2 | u | épice | non |
| Huile d’arachide | 100 | ml | cuisson | non |

#### Méthode canonique

1. Farcir le poisson d’un roff de persil, ail et piment, puis le saisir.
2. Préparer une sauce tomate et y cuire les gros légumes séquentiellement.
3. Retirer poisson et légumes, puis cuire le riz dans le bouillon concentré.
4. Servir riz, poisson et légumes avec le fond légèrement attaché.

**Techniques** : farce, saisie, cuisson séquencée, absorption.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, tomate_cuite, piment, poisson, tomate, persil, huile_arachide
- **Textures cibles** : riz_imbibé, poisson_tendre, légumes_entiers
- **Ingrédients signatures** : Mérou cru entier, Riz brisé cru, Tomate concentrée, Carotte crue
- **Garde-fous / dérives interdites** : poisson_farcis_au_roff, riz_brisé, légumes_entiers
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, poisson

---

### REAL-154 — Poulet yassa

- **Cuisine / origine** : Sénégal
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet aux oignons citron
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 75 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, sans peau | 1500 | g | viande | non |
| Oignon jaune cru | 1000 | g | base | non |
| Jus de citron frais | 180 | ml | marinade | non |
| Moutarde de Dijon | 60 | g | marinade | non |
| Piment frais | 1 | u | épice | non |
| Huile d’arachide | 70 | ml | cuisson | non |
| Ail cru | 15 | g | aromatique | non |
| Feuille de laurier séchée | 2 | u | aromate | non |

#### Méthode canonique

1. Mariner le poulet avec citron, moutarde, ail et une partie des oignons.
2. Griller ou saisir fortement le poulet.
3. Compoter la grande quantité d’oignons avec la marinade jusqu’à acidité adoucie.
4. Remettre le poulet et mijoter jusqu’à tendreté.

**Techniques** : marinade, grillade, compotage, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, oignon_compoté, moutarde, agrume, laurier, piment, citron, oignon
- **Textures cibles** : poulet_aux_bords_grillés, oignons_confits, sauce_acidulée
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, sans peau, Oignon jaune cru, Jus de citron frais, Moutarde de Dijon
- **Garde-fous / dérives interdites** : beaucoup_d_oignons, citron_moutarde, grillade_préalable
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, moutarde

---

### REAL-155 — Mafé de bœuf

- **Cuisine / origine** : Mali/Sénégal
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût à l arachide
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à braiser cru | 1000 | g | viande | non |
| Pâte d’arachide pure | 250 | g | sauce | non |
| Tomate concentrée | 70 | g | sauce | non |
| Patate douce crue, épluchée | 500 | g | légume | non |
| Carotte crue | 300 | g | légume | non |
| Chou blanc frais | 350 | g | légume | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Piment frais | 1 | u | épice | non |
| Bouillon de bœuf non salé | 900 | ml | cuisson | non |

#### Méthode canonique

1. Colorer le bœuf et faire revenir l’oignon avec la tomate concentrée.
2. Ajouter bouillon et pâte d’arachide en fouettant.
3. Mijoter la viande, puis ajouter les légumes selon leur temps de cuisson.
4. Réduire jusqu’à sauce épaisse et brillante.

**Techniques** : saisie, friture de concentré, mijotage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : oléagineux, toasté, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, piment, arachide, tomate, bœuf
- **Textures cibles** : sauce_onctueuse, viande_fondante, légumes_entiers
- **Ingrédients signatures** : Bœuf à braiser cru, Pâte d’arachide pure, Tomate concentrée, Patate douce crue, épluchée
- **Garde-fous / dérives interdites** : pâte_arachide_non_sucrée, sauce_épaisse, légumes_séquencés
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide

---

### REAL-156 — Suya de bœuf

- **Cuisine / origine** : Nigeria
- **Identité** : `named_traditional_dish`
- **Catégorie** : brochettes épicées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à griller cru, en fines lamelles | 800 | g | viande | non |
| Arachide grillée moulue | 120 | g | épice | non |
| Paprika fumé | 10 | g | épice | non |
| Gingembre moulu | 6 | g | épice | non |
| Piment de Cayenne | 5 | g | épice | non |
| Oignon en poudre | 5 | g | épice | non |
| Huile d’arachide | 40 | ml | marinade | non |
| Oignon rouge cru | 200 | g | service | non |
| Tomate fraîche mûre | 300 | g | service | non |

#### Méthode canonique

1. Mélanger arachide moulue et épices pour le yaji.
2. Enrober les lamelles de bœuf d’huile puis de yaji et mariner.
3. Enfiler sur brochettes serrées et griller à feu vif.
4. Saupoudrer encore de yaji et servir avec oignon et tomate crus.

**Techniques** : marinade sèche, brochette, grillade.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : oignon_compoté, tomate_cuite, paprika, piment, gingembre, fumé, arachide_grillée, bœuf_grillé
- **Textures cibles** : bords_grillés, viande_moelleuse, poudre_sèche
- **Ingrédients signatures** : Bœuf à griller cru, en fines lamelles, Arachide grillée moulue, Paprika fumé, Gingembre moulu
- **Garde-fous / dérives interdites** : yaji_arachide_épices, lamelles_fines, grillade
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide

---

### REAL-157 — Egusi soup

- **Cuisine / origine** : Nigeria
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de graines
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Graine de melon egusi moulue | 300 | g | base | non |
| Épinard africain frais | 600 | g | légume | non |
| Bœuf à braiser cru | 600 | g | viande | non |
| Poisson fumé | 250 | g | umami | non |
| Huile de palme rouge | 120 | ml | cuisson | non |
| Tomate fraîche mûre | 350 | g | sauce | non |
| Oignon jaune cru | 200 | g | aromatique | non |
| Piment frais | 2 | u | épice | non |
| Écrevisse séchée moulue | 40 | g | umami | non |

#### Méthode canonique

1. Cuire le bœuf jusqu’à tendre et réserver son bouillon.
2. Préparer une base de tomate, oignon, piment et huile de palme.
3. Ajouter l’egusi en pâte ou en pluie et laisser former des amas tendres.
4. Ajouter viande, poisson fumé, écrevisse et feuilles, puis mijoter brièvement.

**Techniques** : pochage, base tomate, cuisson des graines, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : oléagineux, toasté, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, piment, fumé, egusi, huile_de_palme, poisson_fumé
- **Textures cibles** : sauce_granuleuse_et_épaisse, feuilles_tendres
- **Ingrédients signatures** : Graine de melon egusi moulue, Épinard africain frais, Bœuf à braiser cru, Poisson fumé
- **Garde-fous / dérives interdites** : egusi, huile_de_palme, protéines_fumées, feuilles
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, poisson

---

### REAL-158 — Moi moi

- **Cuisine / origine** : Nigeria
- **Identité** : `named_traditional_dish`
- **Catégorie** : flan de haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot cornille sec | 500 | g | base | non |
| Poivron rouge frais | 250 | g | aromatique | non |
| Piment frais | 1 | u | épice | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Huile végétale raffinée | 80 | ml | matière grasse | non |
| Écrevisse séchée moulue | 30 | g | umami | oui |
| Œuf dur | 4 | u | garniture | oui |
| Poisson fumé | 150 | g | garniture | oui |

#### Méthode canonique

1. Tremper les haricots, retirer les peaux et mixer très finement avec poivron et oignon.
2. Incorporer huile, assaisonnement et garnitures facultatives.
3. Verser en feuilles, ramequins ou sachets adaptés.
4. Cuire à la vapeur jusqu’à flan ferme et humide.

**Techniques** : trempage, dépelliculage, mixage, vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, piment, fumé, haricot, poivron, écrevisse
- **Textures cibles** : flan_lisse_et_moelleux
- **Ingrédients signatures** : Haricot cornille sec, Poivron rouge frais, Piment frais, Oignon jaune cru
- **Garde-fous / dérives interdites** : haricots_dépelliculés, mixage_fin, cuisson_vapeur
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, poisson, œuf

---

### REAL-159 — Akara

- **Cuisine / origine** : Nigeria/Ghana
- **Identité** : `named_traditional_dish`
- **Catégorie** : beignets de haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot cornille sec | 500 | g | base | non |
| Oignon jaune cru | 150 | g | aromatique | non |
| Piment frais | 1 | u | épice | non |
| Sel fin | 8 | g | assaisonnement | non |
| Huile de friture | 1200 | ml | friture | non |

#### Méthode canonique

1. Tremper et dépelliculer les haricots.
2. Mixer avec très peu d’eau, oignon et piment.
3. Battre la pâte pour l’aérer.
4. Frire par cuillerées jusqu’à extérieur doré et intérieur léger.

**Techniques** : trempage, dépelliculage, mixage, foisonnement, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, piment, haricot, oignon, friture
- **Textures cibles** : croûte_croustillante, intérieur_aéré
- **Ingrédients signatures** : Haricot cornille sec, Oignon jaune cru, Piment frais, Sel fin
- **Garde-fous / dérives interdites** : haricots_dépelliculés, pâte_aérée, friture
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-160 — Kelewele

- **Cuisine / origine** : Ghana
- **Identité** : `named_traditional_dish`
- **Catégorie** : bananes plantain épicées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Banane plantain mûre | 1000 | g | base | non |
| Gingembre frais | 25 | g | épice | non |
| Piment de Cayenne | 4 | g | épice | non |
| Clou de girofle moulu | 1 | g | épice | non |
| Muscade moulue | 1 | g | épice | non |
| Huile de friture | 1000 | ml | friture | non |
| Arachide grillée | 100 | g | service | oui |

#### Méthode canonique

1. Couper les plantains mûrs en cubes ou biais.
2. Les enrober de gingembre pilé et épices.
3. Laisser mariner brièvement.
4. Frire jusqu’à bords très caramélisés et servir avec arachides.

**Techniques** : marinade, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : piment, gingembre, plantain_caramélisé, clou_girofle
- **Textures cibles** : extérieur_caramélisé, intérieur_fondant
- **Ingrédients signatures** : Banane plantain mûre, Gingembre frais, Piment de Cayenne, Clou de girofle moulu
- **Garde-fous / dérives interdites** : plantain_mûr, gingembre_piment, friture
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide

---

### REAL-161 — Waakye

- **Cuisine / origine** : Ghana
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz et haricots
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz long blanc cru | 500 | g | céréale | non |
| Haricot cornille sec | 350 | g | légumineuse | non |
| Feuille de sorgho séchée | 5 | u | coloration | oui |
| Bicarbonate de sodium alimentaire | 2 | g | alcalinité | oui |
| Sel fin | 8 | g | assaisonnement | non |

#### Méthode canonique

1. Tremper les haricots et commencer leur cuisson.
2. Ajouter feuilles de sorgho ou un peu de bicarbonate pour la couleur traditionnelle.
3. Ajouter le riz quand les haricots sont presque tendres.
4. Cuire ensemble jusqu’à grains tendres et servir avec sauces et garnitures séparées.

**Techniques** : trempage, cuisson combinée, absorption.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : haricot, riz, feuille_sorgho
- **Textures cibles** : grains_tendres_mais_distincts
- **Ingrédients signatures** : Riz long blanc cru, Haricot cornille sec, Feuille de sorgho séchée, Bicarbonate de sodium alimentaire
- **Garde-fous / dérives interdites** : riz_et_cornille_cuits_ensemble, service_avec_garnitures
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-162 — Kenyan beef wet fry

- **Cuisine / origine** : Kenya
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf sauté en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à braiser cru, en petits cubes | 900 | g | viande | non |
| Tomate fraîche mûre | 600 | g | sauce | non |
| Oignon rouge cru | 300 | g | aromatique | non |
| Poivron vert frais | 200 | g | légume | non |
| Coriandre fraîche | 30 | g | herbe | non |
| Ail cru | 12 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Huile végétale raffinée | 50 | ml | cuisson | non |

#### Méthode canonique

1. Cuire le bœuf avec peu d’eau jusqu’à tendre et presque sec.
2. Ajouter huile et oignons, puis faire frire la viande.
3. Ajouter tomate, poivron, ail et gingembre.
4. Cuire jusqu’à sauce courte et finir à la coriandre.

**Techniques** : pochage, évaporation, friture, compotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, coriandre, gingembre, bœuf_frit, tomate
- **Textures cibles** : viande_tendre_aux_bords_rôtis, sauce_courte
- **Ingrédients signatures** : Bœuf à braiser cru, en petits cubes, Tomate fraîche mûre, Oignon rouge cru, Poivron vert frais
- **Garde-fous / dérives interdites** : viande_d_abord_bouillie_puis_frite, sauce_tomate_courte
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-163 — Ugali et sukuma wiki

- **Cuisine / origine** : Kenya
- **Identité** : `named_traditional_dish`
- **Catégorie** : polenta de maïs et légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de maïs blanche | 500 | g | base | non |
| Eau | 1000 | ml | cuisson | non |
| Chou kale frais | 800 | g | légume | non |
| Tomate fraîche mûre | 350 | g | sauce | non |
| Oignon rouge cru | 200 | g | aromatique | non |
| Huile végétale raffinée | 40 | ml | cuisson | non |

#### Méthode canonique

1. Verser la farine de maïs dans l’eau bouillante en remuant fortement.
2. Cuire et travailler jusqu’à masse ferme qui se détache de la casserole.
3. Faire revenir oignon et tomate, puis ajouter le kale émincé.
4. Cuire jusqu’à tendre mais encore vert et servir avec l’ugali façonné.

**Techniques** : polenta ferme, sauté de légumes.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, tomate_cuite, maïs, chou, tomate, oignon
- **Textures cibles** : ugali_ferme_et_lisse, feuilles_tendres
- **Ingrédients signatures** : Farine de maïs blanche, Eau, Chou kale frais, Tomate fraîche mûre
- **Garde-fous / dérives interdites** : ugali_très_ferme, sukuma_wiki_sauté, service_ensemble
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-164 — Bobotie

- **Cuisine / origine** : Afrique du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : gratin de viande épicée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf haché cru 15 % MG | 900 | g | viande | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Pain de mie | 120 | g | liaison | non |
| Lait entier | 400 | ml | liaison | non |
| Œuf cru | 4 | u | appareil | non |
| Curry en poudre | 12 | g | épice | non |
| Curcuma moulu | 3 | g | épice | non |
| Chutney d abricot | 80 | g | douceur | non |
| Raisin sec | 80 | g | douceur | non |
| Amande effilée | 60 | g | garniture | non |
| Feuille de laurier séchée | 3 | u | aromate | non |

#### Méthode canonique

1. Faire tremper le pain dans une partie du lait.
2. Faire revenir oignon, viande, curry, chutney et raisins, puis ajouter le pain essoré.
3. Mettre dans un plat et verser dessus œufs battus avec le reste du lait.
4. Ajouter laurier et amandes, puis cuire jusqu’à appareil pris.

**Techniques** : sauté, panade, montage, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : oignon_compoté, laurier, curry, abricot, raisin, viande
- **Textures cibles** : farce_moelleuse, dessus_custard, amandes_croquantes
- **Ingrédients signatures** : Bœuf haché cru 15 % MG, Oignon jaune cru, Pain de mie, Lait entier
- **Garde-fous / dérives interdites** : viande_épicée_sucrée, appareil_œuf_lait, dessus_pris
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten, lait, œuf

---

### REAL-165 — Bunny chow

- **Cuisine / origine** : Afrique du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : pain farci au curry
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 110 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain blanc en miche | 2 | u | contenant | non |
| Épaule d’agneau crue | 1000 | g | viande | non |
| Pomme de terre crue, épluchée | 600 | g | féculent | non |
| Tomate concassée en conserve | 600 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Curry de Durban | 20 | g | épice | non |
| Feuille de curry fraîche | 12 | u | aromate | non |

#### Méthode canonique

1. Préparer un curry d’agneau bien épais avec oignon, gingembre, ail, épices et pomme de terre.
2. Mijoter jusqu’à viande tendre et sauce peu liquide.
3. Évider les miches en gardant un couvercle de mie.
4. Remplir généreusement de curry et servir immédiatement.

**Techniques** : curry, mijotage, évidage, montage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, gingembre, curry, agneau, pain
- **Textures cibles** : pain_imprégné_sans_s_effondrer, curry_épais
- **Ingrédients signatures** : Pain blanc en miche, Épaule d’agneau crue, Pomme de terre crue, épluchée, Tomate concassée en conserve
- **Garde-fous / dérives interdites** : curry_dans_miche_évidée, sauce_épaisse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-166 — Chakalaka

- **Cuisine / origine** : Afrique du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : relish de légumes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poivron rouge frais | 400 | g | légume | non |
| Carotte crue | 300 | g | légume | non |
| Chou blanc frais | 400 | g | légume | non |
| Haricot blanc cuit, égoutté | 400 | g | légumineuse | oui |
| Tomate concassée en conserve | 500 | g | sauce | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Curry en poudre | 10 | g | épice | non |
| Piment frais | 2 | u | épice | non |
| Huile végétale raffinée | 50 | ml | cuisson | non |

#### Méthode canonique

1. Faire revenir oignon, ail, curry et piment.
2. Ajouter poivron et carotte, puis tomate.
3. Ajouter chou et haricots facultatifs sans trop cuire.
4. Servir chaud ou froid après maturation.

**Techniques** : sauté, compotage, marinade.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, piment, curry, poivron, tomate
- **Textures cibles** : légumes_encore_texturés, sauce_courte
- **Ingrédients signatures** : Poivron rouge frais, Carotte crue, Chou blanc frais, Haricot blanc cuit, égoutté
- **Garde-fous / dérives interdites** : relish_pimenté_légumes, service_chaud_ou_froid
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-167 — Kedjenou de poulet

- **Cuisine / origine** : Côte d’Ivoire
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet étouffé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 80 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru en morceaux | 1600 | g | viande | non |
| Tomate fraîche mûre | 600 | g | légume | non |
| Aubergine africaine fraîche | 500 | g | légume | non |
| Oignon jaune cru | 350 | g | aromatique | non |
| Piment frais | 1 | u | épice | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Feuille de laurier séchée | 2 | u | aromate | non |

#### Méthode canonique

1. Mettre tous les ingrédients dans une cocotte épaisse sans ajouter d’eau.
2. Fermer hermétiquement.
3. Cuire à feu doux en secouant régulièrement la cocotte sans l’ouvrir.
4. Ouvrir seulement lorsque poulet et légumes ont produit un jus concentré.

**Techniques** : cuisson étouffée, secouage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, laurier, piment, gingembre, poulet, tomate
- **Textures cibles** : poulet_très_tendre, légumes_confits, jus_concentré
- **Ingrédients signatures** : Poulet entier cru en morceaux, Tomate fraîche mûre, Aubergine africaine fraîche, Oignon jaune cru
- **Garde-fous / dérives interdites** : aucune_eau_ajoutée, cuisson_fermée, secouer_sans_ouvrir
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-168 — Butter chicken murgh makhani

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry de poulet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru, désossé | 900 | g | viande | non |
| Yaourt nature | 180 | g | marinade | non |
| Tomate concassée en conserve | 800 | g | sauce | non |
| Beurre clarifié ghee | 100 | g | cuisson | non |
| Crème fraîche liquide entière | 180 | ml | sauce | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Garam masala | 8 | g | épice | non |
| Fenugrec séché kasuri methi | 5 | g | signature | non |
| Piment du Cachemire moulu | 6 | g | épice | non |

#### Méthode canonique

1. Mariner le poulet au yaourt, gingembre, ail et piment puis le griller.
2. Cuire longuement tomate, beurre et épices, puis mixer et filtrer.
3. Ajouter crème et fenugrec séché.
4. Réchauffer le poulet dans la sauce sans prolonger excessivement la cuisson.

**Techniques** : marinade, grillade, mixage, filtration, finition crème.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, tomate_cuite, beurre, lacté, piment, gingembre, tomate, fenugrec
- **Textures cibles** : poulet_grillé, sauce_très_lisse_et_onctueuse
- **Ingrédients signatures** : Haut de cuisse de poulet cru, désossé, Yaourt nature, Tomate concassée en conserve, Beurre clarifié ghee
- **Garde-fous / dérives interdites** : poulet_grillé_séparément, sauce_tomate_beurre, kasuri_methi
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-169 — Chicken tikka masala

- **Cuisine / origine** : Inde/Royaume-Uni
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry de poulet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Blanc de poulet cru, sans peau | 900 | g | viande | non |
| Yaourt nature | 200 | g | marinade | non |
| Tomate concassée en conserve | 800 | g | sauce | non |
| Crème fraîche liquide entière | 180 | ml | sauce | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Ail cru | 18 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Garam masala | 10 | g | épice | non |
| Cumin moulu | 5 | g | épice | non |
| Paprika doux | 8 | g | épice | non |

#### Méthode canonique

1. Mariner le poulet avec yaourt et épices, puis le griller en morceaux.
2. Faire revenir oignon, ail et gingembre, puis les épices.
3. Ajouter tomate et réduire jusqu’à perte de l’acidité crue.
4. Ajouter crème puis poulet grillé et finir brièvement.

**Techniques** : marinade, grillade, torréfaction, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, lacté, cumin, paprika, gingembre, grillade
- **Textures cibles** : morceaux_grillés, sauce_épaisse
- **Ingrédients signatures** : Blanc de poulet cru, sans peau, Yaourt nature, Tomate concassée en conserve, Crème fraîche liquide entière
- **Garde-fous / dérives interdites** : poulet_tikka_grillé, puis_sauce_crémeuse_tomate
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-170 — Tandoori chicken

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet grillé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_indian`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, sans peau | 1600 | g | viande | non |
| Yaourt nature | 300 | g | marinade | non |
| Jus de citron frais | 60 | ml | acidité | non |
| Ail cru | 20 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Piment du Cachemire moulu | 12 | g | épice | non |
| Garam masala | 10 | g | épice | non |
| Cumin moulu | 6 | g | épice | non |
| Coriandre moulue | 6 | g | épice | non |
| Huile de moutarde | 40 | ml | marinade | non |

#### Méthode canonique

1. Inciser le poulet et effectuer une première marinade citron-sel.
2. Ajouter la marinade au yaourt, épices, ail, gingembre et huile.
3. Mariner plusieurs heures au froid.
4. Griller ou rôtir très chaud jusqu’à bords carbonisés et 75 °C à cœur.

**Techniques** : incision, double marinade, grillade forte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, moutarde, agrume, coriandre, cumin, piment, gingembre, tandoor
- **Textures cibles** : bords_noircis, chair_juteuse
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, sans peau, Yaourt nature, Jus de citron frais, Ail cru
- **Garde-fous / dérives interdites** : incisions, double_marinade, forte_chaleur
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### REAL-171 — Biryani hyderabadi au poulet

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz en couches
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 90 min
- **Difficulté** : difficile
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz basmati cru | 600 | g | base | non |
| Cuisse de poulet crue, désossée | 1000 | g | viande | non |
| Yaourt nature | 250 | g | marinade | non |
| Oignon frit | 250 | g | garniture | non |
| Menthe fraîche | 40 | g | herbe | non |
| Coriandre fraîche | 40 | g | herbe | non |
| Ghee | 100 | g | matière grasse | non |
| Safran | 0.4 | g | arôme | non |
| Lait entier | 100 | ml | safran | non |
| Garam masala | 10 | g | épice | non |
| Cardamome verte | 8 | u | épice | non |
| Cannelle en bâton | 2 | u | épice | non |

#### Méthode canonique

1. Mariner le poulet avec yaourt, épices, herbes et oignon frit.
2. Parboil le riz avec épices entières puis l’égoutter encore ferme.
3. Monter poulet cru mariné, riz, safran, ghee, menthe et oignons en couches.
4. Sceller et cuire en dum jusqu’à poulet cuit et riz parfumé, puis reposer avant d’ouvrir.

**Techniques** : marinade, parboiling, montage, dum.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, coriandre, cannelle, cardamome, safran, menthe, oignon_frit, ghee
- **Textures cibles** : riz_grainé, viande_tendre, couches_distinctes
- **Ingrédients signatures** : Riz basmati cru, Cuisse de poulet crue, désossée, Yaourt nature, Oignon frit
- **Garde-fous / dérives interdites** : cuisson_dum, riz_parboiled, couches, safran
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-172 — Rogan josh

- **Cuisine / origine** : Cachemire
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry d’agneau
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule d’agneau crue | 1200 | g | viande | non |
| Yaourt nature | 250 | g | sauce | non |
| Oignon jaune cru | 300 | g | aromatique | oui |
| Piment du Cachemire moulu | 12 | g | épice | non |
| Fenouil moulu | 8 | g | épice | non |
| Gingembre moulu | 5 | g | épice | non |
| Cardamome noire | 3 | u | épice | non |
| Cannelle en bâton | 2 | u | épice | non |
| Ghee | 80 | g | cuisson | non |

#### Méthode canonique

1. Colorer l’agneau dans le ghee.
2. Faire revenir les épices entières et moulues sans les brûler.
3. Ajouter le yaourt progressivement pour éviter qu’il tranche.
4. Mijoter longuement jusqu’à viande tendre et huile remontée en surface.

**Techniques** : saisie, torréfaction, tempérage du yaourt, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, piment, gingembre, cannelle, cardamome, piment_cachemire, fenouil, agneau
- **Textures cibles** : viande_fondante, sauce_rouge_nappante
- **Ingrédients signatures** : Épaule d’agneau crue, Yaourt nature, Oignon jaune cru, Piment du Cachemire moulu
- **Garde-fous / dérives interdites** : couleur_du_piment_non_tomate, fenouil, yaourt
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-173 — Saag paneer

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : épinards au fromage
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épinard frais | 1200 | g | base | non |
| Paneer | 500 | g | fromage | non |
| Oignon jaune cru | 220 | g | aromatique | non |
| Tomate fraîche mûre | 250 | g | sauce | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Cumin en graines | 5 | g | épice | non |
| Garam masala | 5 | g | épice | non |
| Ghee | 60 | g | cuisson | non |
| Crème fraîche liquide entière | 100 | ml | finition | oui |

#### Méthode canonique

1. Blanchir brièvement les épinards puis les mixer grossièrement.
2. Dorer le paneer et réserver.
3. Faire revenir cumin, oignon, ail, gingembre et tomate.
4. Ajouter épinards puis paneer, cuire doucement et finir de crème facultative.

**Techniques** : blanchiment, mixage, saisie, tarka.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, lacté, cumin, gingembre, épinard, paneer
- **Textures cibles** : purée_végétale_avec_texture, paneer_doré
- **Ingrédients signatures** : Épinard frais, Paneer, Oignon jaune cru, Tomate fraîche mûre
- **Garde-fous / dérives interdites** : épinard_dominant, paneer_non_fondu, épices_non_tomate
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-174 — Chana masala

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : pois chiches épicés
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois chiche cuit, égoutté | 900 | g | base | non |
| Tomate concassée en conserve | 600 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Chana masala | 12 | g | épice | non |
| Cumin en graines | 5 | g | épice | non |
| Amchur poudre de mangue | 6 | g | acidité | non |
| Coriandre fraîche | 25 | g | finition | non |
| Huile végétale raffinée | 50 | ml | cuisson | non |

#### Méthode canonique

1. Faire revenir cumin, oignon, ail et gingembre jusqu’à brunissement léger.
2. Ajouter épices et tomate, puis cuire le masala jusqu’à séparation de l’huile.
3. Ajouter pois chiches et un peu de leur liquide, puis écraser une petite partie.
4. Finir à l’amchur et à la coriandre.

**Techniques** : tarka, cuisson du masala, mijotage, écrasement partiel.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, coriandre, cumin, gingembre, amchur, tomate
- **Textures cibles** : pois_chiches_entiers, sauce_épaisse
- **Ingrédients signatures** : Pois chiche cuit, égoutté, Tomate concassée en conserve, Oignon jaune cru, Ail cru
- **Garde-fous / dérives interdites** : masala_bien_cuit, acidité_amchur, quelques_pois_chiches_écrasés
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-175 — Rajma masala

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : haricots rouges épicés
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot rouge sec | 500 | g | base | non |
| Tomate concassée en conserve | 650 | g | sauce | non |
| Oignon jaune cru | 280 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Cumin en graines | 5 | g | épice | non |
| Garam masala | 8 | g | épice | non |
| Piment du Cachemire moulu | 6 | g | épice | non |
| Ghee | 50 | g | cuisson | non |

#### Méthode canonique

1. Tremper puis cuire les haricots jusqu’à très tendres.
2. Préparer un masala brun d’oignon, tomate, ail, gingembre et épices.
3. Ajouter les haricots avec leur liquide et mijoter longuement.
4. Écraser quelques haricots pour une sauce crémeuse.

**Techniques** : trempage, cuisson sous pression, tarka, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, cumin, piment, gingembre, haricot, tomate
- **Textures cibles** : haricots_très_tendres, sauce_crémeuse
- **Ingrédients signatures** : Haricot rouge sec, Tomate concassée en conserve, Oignon jaune cru, Ail cru
- **Garde-fous / dérives interdites** : haricots_cuits_très_tendres, mijotage_long, servi_avec_riz
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-176 — Aloo gobi

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : pommes de terre chou-fleur
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 700 | g | légume | non |
| Chou-fleur frais | 800 | g | légume | non |
| Tomate fraîche mûre | 300 | g | sauce | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Gingembre frais | 18 | g | aromatique | non |
| Cumin en graines | 5 | g | épice | non |
| Curcuma moulu | 4 | g | épice | non |
| Garam masala | 5 | g | épice | non |
| Coriandre fraîche | 20 | g | finition | non |

#### Méthode canonique

1. Faire grésiller le cumin, puis ajouter oignon, ail et gingembre.
2. Ajouter tomate et épices jusqu’à masala sec.
3. Ajouter pommes de terre puis chou-fleur avec très peu d’eau.
4. Cuire couvert puis découvert pour garder les fleurons entiers et finir à la coriandre.

**Techniques** : tarka, cuisson étouffée, évaporation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, coriandre, cumin, gingembre, curcuma, chou_fleur
- **Textures cibles** : pommes_de_terre_tendres, chou_fleur_entier, sauce_sèche
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Chou-fleur frais, Tomate fraîche mûre, Oignon jaune cru
- **Garde-fous / dérives interdites** : plat_sec_non_curry_liquide, chou_fleur_non_en_purée
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-177 — Baingan bharta

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : aubergine fumée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine fraîche | 1200 | g | base | non |
| Tomate fraîche mûre | 500 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Piment vert frais | 2 | u | épice | non |
| Cumin en graines | 5 | g | épice | non |
| Coriandre fraîche | 25 | g | finition | non |
| Huile de moutarde | 50 | ml | cuisson | non |

#### Méthode canonique

1. Brûler les aubergines entières directement à la flamme jusqu’à chair fumée.
2. Peler, égoutter et écraser grossièrement.
3. Préparer un masala de cumin, oignon, tomate, ail, gingembre et piment.
4. Ajouter l’aubergine, cuire jusqu’à sec et finir à la coriandre.

**Techniques** : brûlage, pelage, écrasement, tarka.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, moutarde, coriandre, cumin, piment, gingembre
- **Textures cibles** : purée_rustique, petits_morceaux, sec_non_aqueux
- **Ingrédients signatures** : Aubergine fraîche, Tomate fraîche mûre, Oignon jaune cru, Ail cru
- **Garde-fous / dérives interdites** : fumage_direct_indispensable, texture_rustique
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde

---

### REAL-178 — Dal makhani

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : lentilles noires crémeuses
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 25 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Lentille urad noire entière sèche | 400 | g | base | non |
| Haricot rouge sec | 100 | g | base | non |
| Tomate concassée en conserve | 500 | g | sauce | non |
| Beurre doux | 120 | g | matière grasse | non |
| Crème fraîche liquide entière | 180 | ml | finition | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Garam masala | 6 | g | épice | non |
| Piment du Cachemire moulu | 5 | g | épice | non |

#### Méthode canonique

1. Tremper urad et haricots, puis les cuire jusqu’à très tendres.
2. Préparer une base tomate, ail, gingembre et piment.
3. Mijoter ensemble très longtemps en remuant et en ajoutant de l’eau.
4. Finir au beurre, à la crème et au garam masala.

**Techniques** : trempage, cuisson sous pression, mijotage long, finition crème.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : ail, tomate_cuite, beurre, lacté, piment, gingembre, lentille_noire, tomate
- **Textures cibles** : très_crémeux, grains_partiellement_fondus
- **Ingrédients signatures** : Lentille urad noire entière sèche, Haricot rouge sec, Tomate concassée en conserve, Beurre doux
- **Garde-fous / dérives interdites** : urad_entier, cuisson_très_longue, beurre_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-179 — Sambar

- **Cuisine / origine** : Inde du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût lentilles tamarin
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pois d arhar toor dal sec | 350 | g | base | non |
| Tamarin en pâte | 50 | g | acidité | non |
| Aubergine fraîche | 300 | g | légume | non |
| Gombo frais | 250 | g | légume | non |
| Courge fraîche | 300 | g | légume | non |
| Tomate fraîche mûre | 300 | g | légume | non |
| Sambar powder | 20 | g | épice | non |
| Graine de moutarde | 5 | g | tadka | non |
| Feuille de curry fraîche | 15 | u | tadka | non |
| Asafoetida | 1 | g | tadka | non |
| Huile végétale raffinée | 40 | ml | cuisson | non |

#### Méthode canonique

1. Cuire le toor dal jusqu’à crémeux.
2. Cuire les légumes dans eau, tamarin et sambar powder.
3. Mélanger dal et légumes, puis ajuster l’acidité.
4. Faire un tadka de moutarde, curry leaves et asafoetida et le verser dessus.

**Techniques** : cuisson du dal, cuisson légumes, tadka.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : tomate_cuite, moutarde, tamarin, feuille_curry, lentille
- **Textures cibles** : bouillon_nappant, légumes_tendres, dal_fondu
- **Ingrédients signatures** : Pois d arhar toor dal sec, Tamarin en pâte, Aubergine fraîche, Gombo frais
- **Garde-fous / dérives interdites** : toor_dal, tamarin, sambar_powder, tadka
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde

---

### REAL-180 — Rasam

- **Cuisine / origine** : Inde du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : bouillon épicé au tamarin
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 15 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tamarin en pâte | 45 | g | acidité | non |
| Tomate fraîche mûre | 400 | g | base | non |
| Toor dal cuit | 150 | g | liaison | oui |
| Poivre noir en grains | 6 | g | épice | non |
| Cumin en graines | 6 | g | épice | non |
| Ail cru | 10 | g | aromatique | non |
| Graine de moutarde | 4 | g | tadka | non |
| Feuille de curry fraîche | 12 | u | tadka | non |
| Coriandre fraîche | 20 | g | finition | non |

#### Méthode canonique

1. Extraire l’eau de tamarin et y cuire tomate, ail, cumin et poivre pilés.
2. Ajouter un peu de dal cuit ou d’eau de dal.
3. Arrêter avant une longue ébullition pour garder les arômes.
4. Verser le tadka de moutarde et curry leaves, puis la coriandre.

**Techniques** : infusion, tadka, cuisson courte.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, tomate_cuite, moutarde, coriandre, cumin, tamarin, poivre, feuille_curry
- **Textures cibles** : bouillon_léger_et_vif
- **Ingrédients signatures** : Tamarin en pâte, Tomate fraîche mûre, Toor dal cuit, Poivre noir en grains
- **Garde-fous / dérives interdites** : acidité_tamarin, poivre_cumin, pas_de_texture_crémeuse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde

---

### REAL-181 — Masala dosa

- **Cuisine / origine** : Inde du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : crêpe fermentée farcie
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 35 min
- **Difficulté** : difficile
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz cru | 500 | g | pâte | non |
| Lentille urad blanche sèche | 150 | g | pâte | non |
| Fenugrec en graines | 5 | g | fermentation | non |
| Pomme de terre crue, épluchée | 800 | g | farce | non |
| Oignon jaune cru | 250 | g | farce | non |
| Graine de moutarde | 5 | g | tadka | non |
| Curcuma moulu | 3 | g | épice | non |
| Feuille de curry fraîche | 12 | u | aromate | non |
| Huile végétale raffinée | 60 | ml | cuisson | non |

#### Méthode canonique

1. Tremper séparément riz et urad, mixer puis fermenter la pâte une nuit.
2. Préparer une farce sèche de pomme de terre avec moutarde, oignon, curcuma et curry leaves.
3. Étaler une fine dosa sur plaque chaude et huiler légèrement.
4. Déposer la farce, plier et servir immédiatement avec sambar et chutney.

**Techniques** : trempage, mixage, fermentation, étalage, cuisson plaque.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, moutarde, fermentation, riz, urad, curry_leaf
- **Textures cibles** : crêpe_très_croustillante, farce_moelleuse
- **Ingrédients signatures** : Riz cru, Lentille urad blanche sèche, Fenugrec en graines, Pomme de terre crue, épluchée
- **Garde-fous / dérives interdites** : pâte_fermentée_riz_urad, étalage_fin, farce_pomme_de_terre
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde

---

### REAL-182 — Idli

- **Cuisine / origine** : Inde du Sud
- **Identité** : `named_traditional_dish`
- **Catégorie** : gâteau vapeur fermenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz étuvé cru | 500 | g | pâte | non |
| Lentille urad blanche sèche | 180 | g | pâte | non |
| Fenugrec en graines | 4 | g | fermentation | non |
| Sel fin | 10 | g | assaisonnement | non |

#### Méthode canonique

1. Tremper séparément riz et urad.
2. Mixer urad très aérée et riz légèrement granuleux, puis mélanger.
3. Fermenter jusqu’à pâte gonflée et acidulée.
4. Verser dans les moules et cuire à la vapeur sans surcuire.

**Techniques** : trempage, mixage, fermentation, vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : fermentation, riz, urad
- **Textures cibles** : très_aéré, spongieux, humide
- **Ingrédients signatures** : Riz étuvé cru, Lentille urad blanche sèche, Fenugrec en graines, Sel fin
- **Garde-fous / dérives interdites** : fermentation_naturelle, vapeur, pas_de_levure_chimique_seule
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-183 — Vada pav

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : sandwich de beignet de pomme de terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pain pav | 8 | u | base | non |
| Pomme de terre cuite | 800 | g | farce | non |
| Farine de pois chiche | 250 | g | pâte | non |
| Ail cru | 20 | g | aromatique | non |
| Piment vert frais | 4 | u | épice | non |
| Graine de moutarde | 5 | g | tadka | non |
| Feuille de curry fraîche | 12 | u | aromate | non |
| Curcuma moulu | 3 | g | épice | non |
| Chutney vert coriandre | 200 | g | sauce | non |
| Chutney sec ail cacahuète | 150 | g | sauce | non |
| Huile de friture | 1200 | ml | friture | non |

#### Méthode canonique

1. Préparer une farce de pomme de terre au tadka de moutarde, ail, piment et curry leaves.
2. Former des boules et les enrober de pâte de pois chiche.
3. Frire jusqu’à croûte gonflée.
4. Monter dans les pav avec les deux chutneys et piment frit facultatif.

**Techniques** : tadka, façonnage, enrobage, friture, montage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, moutarde, coriandre, piment, cacahuète
- **Textures cibles** : beignet_croustillant, pomme_de_terre_moelleuse, pain_souple
- **Ingrédients signatures** : Pain pav, Pomme de terre cuite, Farine de pois chiche, Ail cru
- **Garde-fous / dérives interdites** : beignet_batata_vada, deux_chutneys, pain_pav
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, gluten, moutarde

---

### REAL-184 — Pav bhaji

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry de légumes et pain
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre crue, épluchée | 700 | g | légume | non |
| Chou-fleur frais | 500 | g | légume | non |
| Petit pois surgelé | 300 | g | légume | non |
| Poivron vert frais | 250 | g | légume | non |
| Tomate fraîche mûre | 700 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Pav bhaji masala | 20 | g | épice | non |
| Beurre doux | 140 | g | cuisson | non |
| Pain pav | 12 | u | service | non |
| Jus de citron frais | 60 | ml | finition | non |
| Coriandre fraîche | 30 | g | finition | non |

#### Méthode canonique

1. Cuire les légumes jusqu’à tendres puis les écraser grossièrement.
2. Faire revenir oignon, tomate, poivron, masala et beaucoup de beurre.
3. Ajouter les légumes et les travailler sur la plaque avec un presse-purée.
4. Griller les pav au beurre et servir avec citron, oignon cru et coriandre.

**Techniques** : cuisson légumes, écrasement, bhuna, grillade du pain.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : oignon_compoté, tomate_cuite, beurre, agrume, coriandre, masala, tomate, citron
- **Textures cibles** : purée_rustique_épaisse, pain_grillé
- **Ingrédients signatures** : Pomme de terre crue, épluchée, Chou-fleur frais, Petit pois surgelé, Poivron vert frais
- **Garde-fous / dérives interdites** : légumes_écrasés_sur_plaque, pav_beurré, citron
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### REAL-185 — Samosa aux pommes de terre

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : chausson frit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 70 min · cuisson 35 min
- **Difficulté** : difficile
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Ghee | 90 | g | pâte | non |
| Pomme de terre cuite | 800 | g | farce | non |
| Petit pois surgelé | 200 | g | farce | non |
| Cumin en graines | 5 | g | épice | non |
| Coriandre en graines | 5 | g | épice | non |
| Garam masala | 5 | g | épice | non |
| Amchur poudre de mangue | 5 | g | acidité | non |
| Piment vert frais | 2 | u | épice | non |
| Huile de friture | 1500 | ml | friture | non |

#### Méthode canonique

1. Sabler farine et ghee, ajouter peu d’eau pour une pâte ferme et la reposer.
2. Préparer une farce sèche de pomme de terre, pois et épices.
3. Former des cônes, farcir et sceller soigneusement.
4. Frire à température modérée pour une pâte cloquée et croustillante.

**Techniques** : sablage, repos, farce, pliage, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : coriandre, cumin, piment, amchur, pomme_de_terre
- **Textures cibles** : pâte_croustillante_et_cloquée, farce_sèche
- **Ingrédients signatures** : Farine de blé T55, Ghee, Pomme de terre cuite, Petit pois surgelé
- **Garde-fous / dérives interdites** : pâte_sablée_sans_levure, forme_triangulaire, friture_lente
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-186 — Pakora d’oignons

- **Cuisine / origine** : Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : beignets
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 20 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `epicurious_indian`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Oignon jaune cru | 700 | g | base | non |
| Farine de pois chiche | 250 | g | pâte | non |
| Farine de riz | 50 | g | croustillant | non |
| Ajwain graines | 4 | g | épice | non |
| Cumin moulu | 4 | g | épice | non |
| Piment rouge moulu | 3 | g | épice | non |
| Coriandre fraîche | 25 | g | herbe | non |
| Huile de friture | 1200 | ml | friture | non |

#### Méthode canonique

1. Saler les oignons émincés pour leur faire rendre un peu d’eau.
2. Ajouter farines, épices et herbes avec très peu d’eau.
3. Former des amas irréguliers.
4. Frire jusqu’à très croustillants et servir immédiatement.

**Techniques** : dégorgement, mélange, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, coriandre, cumin, piment, oignon_frit, ajwain
- **Textures cibles** : très_croustillant, irrégulier, centre_tendre
- **Ingrédients signatures** : Oignon jaune cru, Farine de pois chiche, Farine de riz, Ajwain graines
- **Garde-fous / dérives interdites** : peu_d_eau, pâte_non_lisse, amas_irréguliers
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-187 — Vindaloo de porc

- **Cuisine / origine** : Goa
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry vinaigré
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 100 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule de porc crue | 1100 | g | viande | non |
| Vinaigre de palmier ou cidre | 120 | ml | marinade | non |
| Ail cru | 25 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Piment rouge séché | 15 | g | épice | non |
| Cumin en graines | 6 | g | épice | non |
| Coriandre en graines | 8 | g | épice | non |
| Cannelle en bâton | 1 | u | épice | non |
| Clou de girofle | 6 | u | épice | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Jaggery | 20 | g | équilibre | non |

#### Méthode canonique

1. Mixer vinaigre, ail, gingembre et épices en pâte, puis mariner le porc.
2. Faire brunir l’oignon et saisir la viande avec sa marinade.
3. Ajouter peu d’eau et mijoter jusqu’à tendreté.
4. Équilibrer acidité, piment et jaggery sans rendre le plat sucré.

**Techniques** : torréfaction, mixage, marinade, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, oignon_compoté, coriandre, cumin, piment, gingembre, cannelle, vinaigre
- **Textures cibles** : viande_fondante, sauce_épaisse_et_acidulée
- **Ingrédients signatures** : Épaule de porc crue, Vinaigre de palmier ou cidre, Ail cru, Gingembre frais
- **Garde-fous / dérives interdites** : vinaigre_et_ail_dominants, pas_de_pomme_de_terre_obligatoire, piment_réel
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-188 — Nihari

- **Cuisine / origine** : Pakistan
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 300 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Jarret de bœuf cru avec os | 1500 | g | viande | non |
| Ghee | 120 | g | cuisson | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Farine de blé atta | 70 | g | liaison | non |
| Nihari masala | 25 | g | épice | non |
| Gingembre frais | 30 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Jus de citron frais | 50 | ml | service | non |
| Coriandre fraîche | 25 | g | finition | non |
| Piment vert frais | 3 | u | finition | non |

#### Méthode canonique

1. Saisir le jarret dans le ghee avec oignon, ail, gingembre et masala.
2. Ajouter beaucoup d’eau et cuire très longuement, idéalement toute une nuit.
3. Lier légèrement avec farine délayée et mijoter encore.
4. Servir avec gingembre en julienne, coriandre, piment et citron.

**Techniques** : saisie, cuisson longue, liaison, finition.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, agrume, coriandre, piment, gingembre, jarret, épices
- **Textures cibles** : viande_effilochable, bouillon_nappant, moelle
- **Ingrédients signatures** : Jarret de bœuf cru avec os, Ghee, Oignon jaune cru, Farine de blé atta
- **Garde-fous / dérives interdites** : jarret_avec_os, cuisson_très_longue, finition_fraîche
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-189 — Haleem

- **Cuisine / origine** : Pakistan/Inde
- **Identité** : `named_traditional_dish`
- **Catégorie** : bouillie de céréales et viande
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 45 min · cuisson 240 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Blé concassé | 300 | g | céréale | non |
| Orge perlé cru | 150 | g | céréale | non |
| Lentille chana dal sèche | 150 | g | légumineuse | non |
| Lentille urad sèche | 100 | g | légumineuse | non |
| Bœuf à braiser cru | 900 | g | viande | non |
| Oignon frit | 250 | g | garniture | non |
| Ghee | 100 | g | cuisson | non |
| Haleem masala | 20 | g | épice | non |
| Gingembre frais | 30 | g | finition | non |
| Jus de citron frais | 60 | ml | finition | non |

#### Méthode canonique

1. Tremper céréales et légumineuses, puis les cuire jusqu’à très molles.
2. Cuire la viande séparément avec épices jusqu’à effilochable.
3. Réunir et battre longuement pour une texture homogène filante.
4. Finir de ghee, oignon frit, gingembre et citron.

**Techniques** : trempage, cuisson longue, effilochage, battage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, agrume, gingembre, céréales, viande, épices, oignon_frit
- **Textures cibles** : épais, filant, quasi_homogène
- **Ingrédients signatures** : Blé concassé, Orge perlé cru, Lentille chana dal sèche, Lentille urad sèche
- **Garde-fous / dérives interdites** : mélange_céréales_lentilles_viande, battage_long
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-190 — Keema matar

- **Cuisine / origine** : Inde/Pakistan
- **Identité** : `named_traditional_dish`
- **Catégorie** : viande hachée aux petits pois
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_indian`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Agneau haché cru | 800 | g | viande | non |
| Petit pois surgelé | 350 | g | légume | non |
| Tomate fraîche mûre | 500 | g | sauce | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |
| Cumin en graines | 5 | g | épice | non |
| Garam masala | 7 | g | épice | non |
| Piment du Cachemire moulu | 5 | g | épice | non |
| Coriandre fraîche | 25 | g | finition | non |

#### Méthode canonique

1. Faire brunir l’oignon, puis ajouter ail, gingembre et épices.
2. Ajouter la viande hachée et la frire jusqu’à grains séparés.
3. Ajouter tomate et cuire jusqu’à huile visible.
4. Ajouter petits pois et finir à la coriandre.

**Techniques** : bhuna, saisie de viande, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, coriandre, cumin, piment, gingembre, agneau
- **Textures cibles** : viande_granuleuse_non_en_bloc, sauce_courte, pois_tendres
- **Ingrédients signatures** : Agneau haché cru, Petit pois surgelé, Tomate fraîche mûre, Oignon jaune cru
- **Garde-fous / dérives interdites** : viande_bhuna, petits_pois_ajoutés_tard
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-191 — Mapo tofu

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : tofu pimenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tofu soyeux ferme | 700 | g | base | non |
| Bœuf haché cru | 220 | g | garniture | non |
| Doubanjiang | 60 | g | sauce | non |
| Douchi haricot noir fermenté | 20 | g | umami | non |
| Poivre du Sichuan | 8 | g | épice | non |
| Huile pimentée | 60 | ml | cuisson | non |
| Ail cru | 12 | g | aromatique | non |
| Gingembre frais | 15 | g | aromatique | non |
| Bouillon de volaille | 350 | ml | sauce | non |
| Fécule de maïs | 20 | g | liaison | non |
| Ciboule fraîche | 30 | g | finition | non |

#### Méthode canonique

1. Blanchir doucement le tofu en cubes dans l’eau salée.
2. Frire le bœuf jusqu’à croustillant, puis ajouter doubanjiang, douchi, ail et gingembre.
3. Ajouter bouillon et tofu, mijoter sans casser.
4. Lier en plusieurs fois et finir au poivre du Sichuan fraîchement moulu.

**Techniques** : blanchiment, friture des aromates, mijotage, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, piment, gingembre, doubanjiang, douchi, poivre_sichuan, huile_pimentée
- **Textures cibles** : tofu_tremblant, sauce_nappante, viande_croustillante
- **Ingrédients signatures** : Tofu soyeux ferme, Bœuf haché cru, Doubanjiang, Douchi haricot noir fermenté
- **Garde-fous / dérives interdites** : mala, fermentations, liaison_progressive, tofu_soyeux
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-192 — Gong bao ji ding

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet sauté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 12 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 650 | g | viande | non |
| Cacahuète grillée | 120 | g | croquant | non |
| Piment rouge séché | 15 | g | épice | non |
| Poivre du Sichuan | 5 | g | épice | non |
| Sauce soja légère | 35 | ml | assaisonnement | non |
| Vinaigre noir chinois | 35 | ml | acidité | non |
| Sucre semoule | 25 | g | équilibre | non |
| Vin Shaoxing | 30 | ml | marinade | non |
| Fécule de maïs | 18 | g | marinade | non |
| Ciboule fraîche | 80 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Gingembre frais | 15 | g | aromatique | non |

#### Méthode canonique

1. Mariner le poulet en dés avec Shaoxing, soja et fécule.
2. Faire parfumer huile, piments et Sichuan sans brûler.
3. Sauter le poulet à feu vif, ajouter aromates.
4. Verser la sauce aigre-douce courte et ajouter les cacahuètes au dernier moment.

**Techniques** : marinade, velveting, sauté, wok hei.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, piment, gingembre, soja_fermenté, piment_séché, poivre_sichuan, cacahuète, vinaigre_noir
- **Textures cibles** : poulet_juteux, cacahuètes_croquantes, sauce_brillante
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Cacahuète grillée, Piment rouge séché, Poivre du Sichuan
- **Garde-fous / dérives interdites** : poulet_en_dés, cacahuète, piments_entiers, équilibre_sucré_acide
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, gluten, soja

---

### REAL-193 — Dan dan noodles

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles pimentées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille de blé chinoise sèche | 400 | g | base | non |
| Porc haché cru | 250 | g | garniture | non |
| Ya cai légumes de moutarde conservés | 80 | g | garniture | non |
| Tahini de sésame chinois | 100 | g | sauce | non |
| Huile pimentée | 100 | ml | sauce | non |
| Sauce soja légère | 40 | ml | assaisonnement | non |
| Vinaigre noir chinois | 35 | ml | acidité | non |
| Poivre du Sichuan | 6 | g | épice | non |
| Cacahuète grillée | 70 | g | finition | non |
| Ciboule fraîche | 40 | g | finition | non |

#### Méthode canonique

1. Frire le porc avec ya cai jusqu’à sec et savoureux.
2. Mélanger dans chaque bol sésame, huile pimentée, soja, vinaigre et Sichuan.
3. Cuire les nouilles, ajouter un peu d’eau de cuisson dans la sauce.
4. Mélanger vivement avec porc, cacahuètes et ciboule.

**Techniques** : friture sèche, assemblage de sauce, cuisson nouilles.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : moutarde, piment, soja_fermenté, sésame_toasté, sésame, huile_pimentée, ya_cai, poivre_sichuan
- **Textures cibles** : nouilles_élastiques, sauce_épaisse, porc_sec
- **Ingrédients signatures** : Nouille de blé chinoise sèche, Porc haché cru, Ya cai légumes de moutarde conservés, Tahini de sésame chinois
- **Garde-fous / dérives interdites** : sauce_dans_le_bol, porc_ya_cai, mala
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, gluten, moutarde, soja, sésame

---

### REAL-194 — Hong shao rou

- **Cuisine / origine** : Chine Shanghai
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc braisé rouge
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poitrine de porc crue avec couenne | 1000 | g | viande | non |
| Sucre candi | 70 | g | caramel | non |
| Sauce soja légère | 50 | ml | assaisonnement | non |
| Sauce soja foncée | 25 | ml | couleur | non |
| Vin Shaoxing | 120 | ml | arôme | non |
| Gingembre frais | 30 | g | aromatique | non |
| Ciboule fraîche | 80 | g | aromatique | non |
| Anis étoilé | 3 | u | épice | non |
| Cannelle cassia | 1 | u | épice | non |

#### Méthode canonique

1. Blanchir la poitrine puis la couper en cubes.
2. Faire un caramel ambré avec le sucre et enrober la viande.
3. Ajouter soja, Shaoxing, aromates et eau, puis braiser doucement.
4. Réduire à découvert jusqu’à glaçage brillant.

**Techniques** : blanchiment, caramel, braisage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : gingembre, soja_fermenté, cannelle, caramel, shaoxing, anis, soja, porc
- **Textures cibles** : gras_fondant, couenne_gélatineuse, glaçage_collant
- **Ingrédients signatures** : Poitrine de porc crue avec couenne, Sucre candi, Sauce soja légère, Sauce soja foncée
- **Garde-fous / dérives interdites** : poitrine_avec_couenne, caramel, braisage_long, glaçage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-195 — Hui guo rou

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc deux fois cuit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poitrine de porc crue avec couenne | 800 | g | viande | non |
| Poireau chinois | 350 | g | légume | non |
| Doubanjiang | 50 | g | sauce | non |
| Douchi haricot noir fermenté | 20 | g | umami | non |
| Sauce soja légère | 20 | ml | assaisonnement | non |
| Sucre semoule | 12 | g | équilibre | non |
| Huile végétale | 30 | ml | cuisson | non |
| Gingembre frais | 15 | g | pochage | non |

#### Méthode canonique

1. Pocher la poitrine entière avec gingembre jusqu’à presque cuite puis refroidir.
2. Trancher très finement.
3. Faire frire les tranches jusqu’à courbées et graisse rendue.
4. Ajouter doubanjiang, douchi et poireaux, puis sauter brièvement.

**Techniques** : pochage, refroidissement, tranchage, friture, sauté.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : gingembre, soja_fermenté, doubanjiang, douchi, porc_frit, poireau
- **Textures cibles** : bords_croustillants, gras_fondant, poireau_tendre
- **Ingrédients signatures** : Poitrine de porc crue avec couenne, Poireau chinois, Doubanjiang, Douchi haricot noir fermenté
- **Garde-fous / dérives interdites** : porc_poché_puis_frit, deux_cuissons, doubanjiang
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja

---

### REAL-196 — Yu xiang qie zi

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : aubergine sauce parfum poisson
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Aubergine chinoise fraîche | 800 | g | base | non |
| Porc haché cru | 150 | g | garniture | oui |
| Doubanjiang | 40 | g | sauce | non |
| Vinaigre noir chinois | 35 | ml | acidité | non |
| Sucre semoule | 25 | g | équilibre | non |
| Sauce soja légère | 25 | ml | assaisonnement | non |
| Ail cru | 18 | g | aromatique | non |
| Gingembre frais | 18 | g | aromatique | non |
| Ciboule fraîche | 50 | g | aromatique | non |
| Fécule de maïs | 15 | g | liaison | non |

#### Méthode canonique

1. Cuire les aubergines par friture ou vapeur puis saisie jusqu’à fondantes.
2. Frire porc facultatif, doubanjiang, ail et gingembre.
3. Ajouter sauce soja-vinaigre-sucre et les aubergines.
4. Lier légèrement et finir à la ciboule.

**Techniques** : friture ou vapeur, sauté, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, gingembre, soja_fermenté, vinaigre, doubanjiang
- **Textures cibles** : aubergine_fondante, sauce_brillante
- **Ingrédients signatures** : Aubergine chinoise fraîche, Porc haché cru, Doubanjiang, Vinaigre noir chinois
- **Garde-fous / dérives interdites** : profil_yu_xiang_sucré_acide_ail_gingembre, pas_de_poisson_nécessaire
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja

---

### REAL-197 — Gan bian si ji dou

- **Cuisine / origine** : Chine Sichuan
- **Identité** : `named_traditional_dish`
- **Catégorie** : haricots verts frits à sec
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot vert cru | 700 | g | base | non |
| Porc haché cru | 150 | g | garniture | oui |
| Ya cai légumes de moutarde conservés | 60 | g | umami | non |
| Piment rouge séché | 10 | g | épice | non |
| Poivre du Sichuan | 4 | g | épice | non |
| Ail cru | 12 | g | aromatique | non |
| Huile végétale | 80 | ml | cuisson | non |

#### Méthode canonique

1. Frire ou saisir longuement les haricots jusqu’à peau ridée.
2. Égoutter l’excès d’huile.
3. Frire porc facultatif, ya cai, piment, Sichuan et ail.
4. Remettre les haricots et sauter jusqu’à enrobage sec.

**Techniques** : friture sèche, sauté.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, moutarde, piment, ya_cai, sichuan
- **Textures cibles** : peau_ridée, bords_grillés, intérieur_tendre
- **Ingrédients signatures** : Haricot vert cru, Porc haché cru, Ya cai légumes de moutarde conservés, Piment rouge séché
- **Garde-fous / dérives interdites** : haricots_ridés, cuisson_sèche, ya_cai
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : moutarde

---

### REAL-198 — Fan qie chao dan

- **Cuisine / origine** : Chine
- **Identité** : `named_traditional_dish`
- **Catégorie** : œufs brouillés tomate
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 10 min · cuisson 10 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 8 | u | protéine | non |
| Tomate fraîche mûre | 700 | g | base | non |
| Ciboule fraîche | 40 | g | aromatique | non |
| Sucre semoule | 12 | g | équilibre | non |
| Huile végétale | 60 | ml | cuisson | non |
| Sel fin | 5 | g | assaisonnement | non |

#### Méthode canonique

1. Brouiller les œufs très rapidement dans une huile chaude puis réserver encore tendres.
2. Cuire les tomates jusqu’à jus épais, avec un peu de sucre selon leur acidité.
3. Remettre les œufs.
4. Mélanger brièvement et finir à la ciboule.

**Techniques** : brouillage rapide, compotage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : tomate_cuite, tomate_fraîche, œuf, ciboule
- **Textures cibles** : gros_morceaux_d_œuf_tendre, sauce_juteuse
- **Ingrédients signatures** : Œuf cru, Tomate fraîche mûre, Ciboule fraîche, Sucre semoule
- **Garde-fous / dérives interdites** : œufs_cuits_séparément, tomate_sucrée_savoureuse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, œuf

---

### REAL-199 — Lion’s head meatballs

- **Cuisine / origine** : Chine Jiangsu
- **Identité** : `named_traditional_dish`
- **Catégorie** : grosses boulettes braisées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Porc haché cru gras | 900 | g | viande | non |
| Châtaigne d’eau | 180 | g | texture | non |
| Œuf cru | 1 | u | liaison | non |
| Fécule de maïs | 30 | g | liaison | non |
| Sauce soja légère | 35 | ml | assaisonnement | non |
| Vin Shaoxing | 40 | ml | arôme | non |
| Gingembre frais | 20 | g | aromatique | non |
| Chou chinois frais | 600 | g | braisage | non |
| Bouillon de volaille | 800 | ml | cuisson | non |

#### Méthode canonique

1. Mélanger le porc dans un seul sens avec assaisonnements et châtaignes d’eau.
2. Former quatre grosses boulettes et les saisir.
3. Les braiser longuement sur un lit de chou avec bouillon.
4. Servir lorsqu’elles sont très tendres mais se tiennent.

**Techniques** : mélange directionnel, façonnage, saisie, braisage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, gingembre, soja_fermenté, porc, shaoxing, chou
- **Textures cibles** : boulette_très_tendre, châtaigne_croquante, bouillon_léger
- **Ingrédients signatures** : Porc haché cru gras, Châtaigne d’eau, Œuf cru, Fécule de maïs
- **Garde-fous / dérives interdites** : très_grosses_boulettes, braisage, châtaigne_d_eau
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, œuf

---

### REAL-200 — Jiaozi porc ciboulette

- **Cuisine / origine** : Chine
- **Identité** : `named_traditional_dish`
- **Catégorie** : raviolis
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 90 min · cuisson 20 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Eau | 260 | ml | pâte | non |
| Porc haché cru | 500 | g | farce | non |
| Ciboulette chinoise fraîche | 500 | g | farce | non |
| Sauce soja légère | 35 | ml | assaisonnement | non |
| Huile de sésame grillé | 25 | ml | arôme | non |
| Gingembre frais | 18 | g | aromatique | non |
| Poivre blanc moulu | 2 | g | épice | non |

#### Méthode canonique

1. Pétrir une pâte souple et la reposer.
2. Mélanger porc et assaisonnements jusqu’à collants, puis incorporer ciboulette.
3. Abaisser de petits disques, farcir et plisser.
4. Pocher, cuire vapeur ou poêler selon la variante.

**Techniques** : pétrissage, mélange directionnel, pliage, pochage ou poêlage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : gingembre, soja_fermenté, sésame_toasté, porc, ciboulette, sésame
- **Textures cibles** : pâte_tendre, farce_juteuse
- **Ingrédients signatures** : Farine de blé T55, Eau, Porc haché cru, Ciboulette chinoise fraîche
- **Garde-fous / dérives interdites** : ratio_porc_ciboulette, farce_collante, pliage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja, sésame

---

### REAL-201 — Xiaolongbao

- **Cuisine / origine** : Chine Shanghai
- **Identité** : `named_traditional_dish`
- **Catégorie** : raviolis vapeur au bouillon
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 120 min · cuisson 15 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Eau chaude | 260 | ml | pâte | non |
| Porc haché cru | 500 | g | farce | non |
| Gelée de bouillon de porc | 400 | g | aspic | non |
| Sauce soja légère | 30 | ml | assaisonnement | non |
| Vin Shaoxing | 30 | ml | arôme | non |
| Gingembre frais | 20 | g | aromatique | non |
| Ciboule fraîche | 50 | g | aromatique | non |

#### Méthode canonique

1. Préparer un bouillon riche en gélatine, le refroidir et le couper en dés.
2. Mélanger porc et assaisonnements puis incorporer l’aspic.
3. Abaisser de petits disques très fins et plisser autour de la farce.
4. Cuire à la vapeur et servir brûlants avec vinaigre et gingembre.

**Techniques** : gelée de bouillon, pétrissage, pliage, vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : gingembre, soja_fermenté, bouillon_gélatineux, porc, shaoxing
- **Textures cibles** : peau_fine, farce_juteuse, bouillon_liquide
- **Ingrédients signatures** : Farine de blé T55, Eau chaude, Porc haché cru, Gelée de bouillon de porc
- **Garde-fous / dérives interdites** : aspic_dans_la_farce, plissage_fin, vapeur
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja

---

### REAL-202 — Cong you bing

- **Cuisine / origine** : Chine
- **Identité** : `named_traditional_dish`
- **Catégorie** : galette feuilletée à la ciboule
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 50 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 500 | g | pâte | non |
| Eau chaude | 280 | ml | pâte | non |
| Ciboule fraîche | 180 | g | garniture | non |
| Huile végétale | 80 | ml | feuilletage | non |
| Sel fin | 8 | g | assaisonnement | non |

#### Méthode canonique

1. Pétrir une pâte à eau chaude et la reposer.
2. Étaler, huiler, saler et couvrir de ciboule.
3. Rouler en boudin puis en escargot, reposer et réétaler.
4. Poêler jusqu’à couches croustillantes et centre souple.

**Techniques** : pâte eau chaude, laminage, roulage, poêlage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ciboule, huile, pâte_grillée
- **Textures cibles** : couches_feuilletées, bords_croustillants, centre_moelleux
- **Ingrédients signatures** : Farine de blé T55, Eau chaude, Ciboule fraîche, Huile végétale
- **Garde-fous / dérives interdites** : roulage_en_escargot, ciboule, poêlage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-203 — Cantonese clay pot rice

- **Cuisine / origine** : Chine Canton
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz en pot en terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz jasmin cru | 500 | g | base | non |
| Saucisse chinoise lap cheong | 250 | g | garniture | non |
| Poulet cru désossé | 500 | g | garniture | non |
| Shiitaké séché | 60 | g | garniture | non |
| Gai lan frais | 400 | g | légume | non |
| Sauce soja légère | 40 | ml | sauce | non |
| Sauce soja foncée | 20 | ml | sauce | non |
| Huile de sésame grillé | 20 | ml | arôme | non |

#### Méthode canonique

1. Tremper le riz et les shiitakés.
2. Commencer la cuisson du riz dans le pot en terre.
3. Ajouter garnitures marinées quand le riz est à moitié cuit.
4. Créer une croûte de riz au fond, arroser de sauce et servir avec gai lan.

**Techniques** : trempage, cuisson en pot, croûte de riz.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : soja_fermenté, sésame_toasté, lap_cheong, shiitaké, soja, sésame
- **Textures cibles** : riz_tendre, croûte_croustillante, garnitures_juteuses
- **Ingrédients signatures** : Riz jasmin cru, Saucisse chinoise lap cheong, Poulet cru désossé, Shiitaké séché
- **Garde-fous / dérives interdites** : pot_en_terre, croûte_de_riz, garnitures_cuites_sur_riz
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-204 — Char siu

- **Cuisine / origine** : Chine Canton
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc rôti laqué
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 25 min · cuisson 50 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Échine de porc crue en bandes | 1200 | g | viande | non |
| Miel | 80 | g | laque | non |
| Sauce hoisin | 100 | g | marinade | non |
| Sauce soja légère | 50 | ml | marinade | non |
| Vin Shaoxing | 50 | ml | marinade | non |
| Tofu rouge fermenté | 50 | g | couleur_et_umami | oui |
| Cinq épices chinoises | 5 | g | épice | non |
| Ail cru | 15 | g | aromatique | non |

#### Méthode canonique

1. Mariner les bandes de porc plusieurs heures.
2. Rôtir suspendues ou sur grille en les retournant.
3. Réduire la marinade sûre ou préparer une laque séparée.
4. Laquer plusieurs fois à forte chaleur jusqu’à bords caramélisés.

**Techniques** : marinade, rôtissage, laquage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, soja_fermenté, miel, hoisin, cinq_épices, shaoxing
- **Textures cibles** : bords_collants_et_carbonisés, cœur_juteux
- **Ingrédients signatures** : Échine de porc crue en bandes, Miel, Sauce hoisin, Sauce soja légère
- **Garde-fous / dérives interdites** : bandes_épaisses, laquage_successif, caramélisation
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-205 — Poisson vapeur gingembre ciboule

- **Cuisine / origine** : Chine Canton
- **Identité** : `named_traditional_dish`
- **Catégorie** : poisson vapeur
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bar entier cru vidé | 1200 | g | poisson | non |
| Gingembre frais | 40 | g | aromatique | non |
| Ciboule fraîche | 100 | g | aromatique | non |
| Sauce soja légère spéciale poisson | 50 | ml | sauce | non |
| Huile végétale | 60 | ml | finition | non |
| Coriandre fraîche | 25 | g | finition | non |

#### Méthode canonique

1. Inciser légèrement le poisson et le poser sur gingembre et ciboule.
2. Cuire à la vapeur juste jusqu’à chair se détachant de l’arête.
3. Jeter le liquide de cuisson et ajouter soja et aromates frais.
4. Verser l’huile fumante sur la ciboule et servir.

**Techniques** : vapeur, huile fumante.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : coriandre, gingembre, soja_fermenté, poisson_frais, ciboule, soja
- **Textures cibles** : chair_nacrée, peau_souple, aromates_frisés
- **Ingrédients signatures** : Bar entier cru vidé, Gingembre frais, Ciboule fraîche, Sauce soja légère spéciale poisson
- **Garde-fous / dérives interdites** : poisson_entier, cuisson_vapeur_courte, huile_fumante
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : poisson, soja

---

### REAL-206 — Wonton soup

- **Cuisine / origine** : Chine Canton
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de raviolis
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 60 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte à wonton | 40 | u | enveloppe | non |
| Porc haché cru | 350 | g | farce | non |
| Crevette crue décortiquée | 250 | g | farce | non |
| Ciboule fraîche | 60 | g | aromatique | non |
| Gingembre frais | 15 | g | aromatique | non |
| Huile de sésame grillé | 20 | ml | arôme | non |
| Bouillon de volaille clair | 1500 | ml | soupe | non |
| Chou chinois frais | 300 | g | légume | non |

#### Méthode canonique

1. Mélanger porc, crevette et assaisonnements jusqu’à farce collante.
2. Farcir et plier les wontons.
3. Les pocher séparément ou dans le bouillon frémissant.
4. Servir dans un bouillon clair avec chou et ciboule.

**Techniques** : mélange de farce, pliage, pochage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, gingembre, sésame_toasté, bouillon_clair, crevette, porc, sésame
- **Textures cibles** : enveloppe_soyeuse, farce_juteuse, bouillon_léger
- **Ingrédients signatures** : Pâte à wonton, Porc haché cru, Crevette crue décortiquée, Ciboule fraîche
- **Garde-fous / dérives interdites** : bouillon_clair, wontons_fins, farce_porc_crevette
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, sésame

---

### REAL-207 — Suanla tang

- **Cuisine / origine** : Chine
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe aigre-piquante
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `serious_chinese_comfort`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bouillon de volaille | 1500 | ml | base | non |
| Tofu ferme | 300 | g | garniture | non |
| Porc cru en julienne | 250 | g | garniture | non |
| Shiitaké séché | 40 | g | garniture | non |
| Pousse de bambou | 250 | g | garniture | non |
| Vinaigre noir chinois | 80 | ml | acidité | non |
| Poivre blanc moulu | 8 | g | piquant | non |
| Sauce soja légère | 35 | ml | assaisonnement | non |
| Fécule de maïs | 35 | g | liaison | non |
| Œuf cru | 2 | u | filaments | non |

#### Méthode canonique

1. Cuire porc, champignons et bambou dans le bouillon.
2. Assaisonner fortement au vinaigre et poivre blanc.
3. Lier à la fécule jusqu’à texture nappante.
4. Verser les œufs en filet, ajouter tofu et servir sans longue ébullition.

**Techniques** : julienne, liaison, filaments d’œuf.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, soja_fermenté, vinaigre_noir, poivre_blanc, shiitaké, soja
- **Textures cibles** : soupe_nappante, filaments_d_œuf, garnitures_fines
- **Ingrédients signatures** : Bouillon de volaille, Tofu ferme, Porc cru en julienne, Shiitaké séché
- **Garde-fous / dérives interdites** : acidité_et_poivre_blanc, liaison, filaments_d_œuf
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, œuf

---

### REAL-208 — Lu rou fan

- **Cuisine / origine** : Taïwan
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc braisé sur riz
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poitrine de porc crue | 800 | g | viande | non |
| Riz jasmin cru | 500 | g | base | non |
| Échalote frite | 150 | g | aromatique | non |
| Sauce soja légère | 60 | ml | sauce | non |
| Sauce soja foncée | 25 | ml | couleur | non |
| Sucre candi | 50 | g | équilibre | non |
| Vin Shaoxing | 80 | ml | arôme | non |
| Cinq épices chinoises | 4 | g | épice | non |
| Œuf dur | 6 | u | garniture | oui |

#### Méthode canonique

1. Couper la poitrine en très petits dés et la faire rendre.
2. Ajouter échalote frite, soja, sucre, Shaoxing et épices.
3. Braiser doucement jusqu’à sauce collante et viande fondante.
4. Servir sur riz avec œuf braisé facultatif.

**Techniques** : rendu de graisse, braisage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : échalote, soja_fermenté, échalote_frite, soja, cinq_épices, porc
- **Textures cibles** : petits_dés_fondants, sauce_collante, riz_moelleux
- **Ingrédients signatures** : Poitrine de porc crue, Riz jasmin cru, Échalote frite, Sauce soja légère
- **Garde-fous / dérives interdites** : porc_en_petits_dés, échalote_frite, service_sur_riz
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, œuf

---

### REAL-209 — Taiwan beef noodle soup

- **Cuisine / origine** : Taïwan
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles au bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Jarret de bœuf cru | 1200 | g | viande | non |
| Nouille de blé chinoise sèche | 500 | g | base | non |
| Tomate fraîche mûre | 500 | g | bouillon | non |
| Doubanjiang | 50 | g | sauce | non |
| Sauce soja légère | 70 | ml | assaisonnement | non |
| Vin Shaoxing | 100 | ml | arôme | non |
| Gingembre frais | 30 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Anis étoilé | 3 | u | épice | non |
| Chou chinois frais | 400 | g | garniture | non |

#### Méthode canonique

1. Blanchir le bœuf puis le rincer.
2. Faire frire doubanjiang, aromates et tomate, déglacer au Shaoxing.
3. Ajouter bœuf, soja, épices et eau, puis braiser jusqu’à tendre.
4. Cuire les nouilles séparément et servir avec bouillon, bœuf et légumes.

**Techniques** : blanchiment, friture des aromates, braisage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, tomate_cuite, gingembre, soja_fermenté, bœuf, soja, doubanjiang, anis
- **Textures cibles** : bouillon_riche, nouilles_élastiques, bœuf_fondant
- **Ingrédients signatures** : Jarret de bœuf cru, Nouille de blé chinoise sèche, Tomate fraîche mûre, Doubanjiang
- **Garde-fous / dérives interdites** : bouillon_braisé, jarret, nouilles_séparées
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja

---

### REAL-210 — San bei ji

- **Cuisine / origine** : Taïwan
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet trois tasses
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_chinese`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 900 | g | viande | non |
| Huile de sésame grillé | 80 | ml | cuisson | non |
| Sauce soja légère | 80 | ml | sauce | non |
| Vin de riz taïwanais | 100 | ml | sauce | non |
| Ail cru entier | 80 | g | aromatique | non |
| Gingembre frais | 50 | g | aromatique | non |
| Basilic thaï frais | 80 | g | finition | non |
| Piment rouge frais | 2 | u | épice | non |
| Sucre candi | 30 | g | équilibre | non |

#### Méthode canonique

1. Faire revenir gingembre et ail entiers dans l’huile de sésame.
2. Ajouter le poulet et le colorer.
3. Ajouter soja, vin et sucre, puis braiser à découvert jusqu’à glaçage.
4. Ajouter basilic et piment à la toute fin.

**Techniques** : sauté, braisage à découvert, glacage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, basilic, piment, gingembre, soja_fermenté, sésame_toasté, sésame, soja
- **Textures cibles** : poulet_glacé, ail_fondant, basilic_frais
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Huile de sésame grillé, Sauce soja légère, Vin de riz taïwanais
- **Garde-fous / dérives interdites** : trois_liquides_sésame_soja_vin, basilic_abondant, sauce_réduite
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-211 — Shoyu ramen

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 90 min · cuisson 240 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille ramen fraîche | 600 | g | base | non |
| Bouillon de poulet | 1800 | ml | bouillon | non |
| Dashi | 600 | ml | bouillon | non |
| Sauce soja japonaise | 140 | ml | tare | non |
| Chashu de porc | 500 | g | garniture | non |
| Œuf mariné ajitama | 6 | u | garniture | non |
| Menma pousse de bambou assaisonnée | 200 | g | garniture | non |
| Ciboule fraîche | 60 | g | finition | non |
| Nori | 6 | feuille | garniture | non |

#### Méthode canonique

1. Préparer séparément bouillon, dashi et tare de soja.
2. Réchauffer les garnitures sans troubler le bouillon.
3. Cuire les nouilles très brièvement.
4. Assembler tare, bouillon, nouilles et garnitures dans cet ordre.

**Techniques** : bouillon, dashi, tare, cuisson nouilles, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : soja_fermenté, dashi, soja, poulet, porc, nori
- **Textures cibles** : bouillon_clair, nouilles_élastiques, chashu_fondant
- **Ingrédients signatures** : Nouille ramen fraîche, Bouillon de poulet, Dashi, Sauce soja japonaise
- **Garde-fous / dérives interdites** : tare_distincte, bouillon_et_nouilles_séparés, dashi
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, soja, œuf

---

### REAL-212 — Miso ramen

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 45 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille ramen fraîche | 600 | g | base | non |
| Bouillon de porc et poulet | 2200 | ml | bouillon | non |
| Miso rouge | 180 | g | tare | non |
| Miso blanc | 100 | g | tare | non |
| Porc haché cru | 300 | g | garniture | non |
| Maïs doux en grains | 250 | g | garniture | non |
| Pousse de soja fraîche | 350 | g | garniture | non |
| Beurre doux | 60 | g | finition | oui |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 20 | g | aromatique | non |

#### Méthode canonique

1. Faire revenir porc, ail et gingembre, puis ajouter les misos sans les brûler.
2. Délayer avec le bouillon et garder au frémissement.
3. Sauter rapidement pousses de soja et maïs.
4. Cuire les nouilles et assembler avec beurre facultatif.

**Techniques** : sauté, tare miso, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, beurre, gingembre, miso, porc, maïs
- **Textures cibles** : bouillon_trouble_et_riche, nouilles_élastiques, légumes_croquants
- **Ingrédients signatures** : Nouille ramen fraîche, Bouillon de porc et poulet, Miso rouge, Miso blanc
- **Garde-fous / dérives interdites** : miso_dominant, pas_de_longue_ébullition_du_miso
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, soja

---

### REAL-213 — Tonkotsu ramen

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 720 min
- **Difficulté** : difficile
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille ramen fine fraîche | 600 | g | base | non |
| Os de porc blanchis | 2500 | g | bouillon | non |
| Pied de porc cru | 1000 | g | gélatine | non |
| Ail cru | 30 | g | aromatique | non |
| Gingembre frais | 40 | g | aromatique | non |
| Chashu de porc | 500 | g | garniture | non |
| Œuf mariné ajitama | 6 | u | garniture | non |
| Ciboule fraîche | 60 | g | finition | non |
| Tare de soja | 180 | ml | assaisonnement | non |

#### Méthode canonique

1. Blanchir et nettoyer soigneusement os et pieds.
2. Faire bouillir vigoureusement de longues heures en complétant l’eau pour émulsionner gras et collagène.
3. Filtrer et maintenir très chaud.
4. Cuire les nouilles fines et assembler avec tare et garnitures.

**Techniques** : blanchiment, nettoyage, ébullition longue, émulsion.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : ail, gingembre, porc, collagène
- **Textures cibles** : bouillon_blanc_émulsionné, nouilles_fermes, chashu_fondant
- **Ingrédients signatures** : Nouille ramen fine fraîche, Os de porc blanchis, Pied de porc cru, Ail cru
- **Garde-fous / dérives interdites** : ébullition_vigoureuse_bouillon_blanc, os_nettoyés, assemblage_rapide
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja, œuf

---

### REAL-214 — Oyakodon

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : bol de riz poulet œuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz japonais cru | 400 | g | base | non |
| Haut de cuisse de poulet cru désossé | 600 | g | viande | non |
| Œuf cru | 6 | u | liaison | non |
| Dashi | 500 | ml | cuisson | non |
| Sauce soja japonaise | 60 | ml | assaisonnement | non |
| Mirin | 70 | ml | douceur | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ciboule fraîche | 40 | g | finition | non |

#### Méthode canonique

1. Cuire le riz et le garder chaud.
2. Mijoter oignon et poulet dans dashi, soja et mirin.
3. Verser les œufs battus en deux fois sans les cuire complètement.
4. Glisser sur le riz et finir à la ciboule.

**Techniques** : mijotage, coagulation contrôlée, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : oignon_compoté, soja_fermenté, dashi, soja, mirin, œuf, poulet
- **Textures cibles** : œuf_tendre_et_coulant, poulet_juteux, riz_moelleux
- **Ingrédients signatures** : Riz japonais cru, Haut de cuisse de poulet cru désossé, Œuf cru, Dashi
- **Garde-fous / dérives interdites** : œuf_en_deux_fois, service_sur_riz, pas_de_sauce_épaisse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, soja, œuf

---

### REAL-215 — Katsudon

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : bol de riz au porc pané
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz japonais cru | 400 | g | base | non |
| Côte de porc désossée crue | 4 | u | viande | non |
| Farine de blé T55 | 80 | g | panure | non |
| Œuf cru | 7 | u | panure_et_sauce | non |
| Panko | 200 | g | panure | non |
| Dashi | 450 | ml | sauce | non |
| Sauce soja japonaise | 55 | ml | assaisonnement | non |
| Mirin | 65 | ml | douceur | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Huile de friture | 1200 | ml | friture | non |

#### Méthode canonique

1. Paner et frire les côtes de porc, puis les trancher.
2. Mijoter oignon dans dashi, soja et mirin.
3. Déposer le tonkatsu et verser les œufs battus autour.
4. Cuire juste pris et glisser sur le riz.

**Techniques** : panure, friture, mijotage, coagulation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, soja_fermenté, porc_frit, dashi, soja, œuf
- **Textures cibles** : panure_partiellement_imbibée, œuf_tendre, riz_moelleux
- **Ingrédients signatures** : Riz japonais cru, Côte de porc désossée crue, Farine de blé T55, Œuf cru
- **Garde-fous / dérives interdites** : tonkatsu_frit_puis_mijoté, œuf_tendre, bol_de_riz
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, soja, œuf

---

### REAL-216 — Gyudon

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : bol de riz au bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz japonais cru | 400 | g | base | non |
| Bœuf cru très finement tranché | 600 | g | viande | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Dashi | 500 | ml | cuisson | non |
| Sauce soja japonaise | 70 | ml | assaisonnement | non |
| Mirin | 70 | ml | douceur | non |
| Sucre semoule | 25 | g | équilibre | non |
| Gingembre mariné beni shoga | 80 | g | garniture | non |

#### Méthode canonique

1. Mijoter l’oignon dans dashi, soja, mirin et sucre.
2. Ajouter les tranches de bœuf et les séparer délicatement.
3. Écumer et cuire seulement jusqu’à tendres.
4. Servir sur riz avec gingembre mariné.

**Techniques** : mijotage court, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : oignon_compoté, gingembre, soja_fermenté, dashi, soja, bœuf, oignon, gingembre_mariné
- **Textures cibles** : bœuf_tendre, riz_moelleux, jus_léger
- **Ingrédients signatures** : Riz japonais cru, Bœuf cru très finement tranché, Oignon jaune cru, Dashi
- **Garde-fous / dérives interdites** : bœuf_très_fin, cuisson_courte, gingembre_mariné
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, soja

---

### REAL-217 — Okonomiyaki Osaka

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : galette de chou
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Chou blanc frais | 800 | g | base | non |
| Farine de blé T55 | 250 | g | pâte | non |
| Dashi | 300 | ml | pâte | non |
| Œuf cru | 4 | u | liaison | non |
| Igname nagaimo râpé | 150 | g | aération | oui |
| Poitrine de porc crue fine | 300 | g | garniture | non |
| Sauce okonomiyaki | 180 | g | finition | non |
| Mayonnaise japonaise | 120 | g | finition | non |
| Katsuobushi | 30 | g | finition | non |
| Aonori | 10 | g | finition | non |

#### Méthode canonique

1. Mélanger farine, dashi, œufs et nagaimo, puis incorporer beaucoup de chou.
2. Cuire une galette épaisse avec tranches de porc sur le dessus.
3. Retourner sans écraser et cuire à cœur.
4. Napper de sauces, aonori et katsuobushi.

**Techniques** : mélange, poêlage, retournement, finition.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : chou, porc, sauce_sucrée_salée, katsuobushi
- **Textures cibles** : extérieur_doré, intérieur_moelleux_chou, porc_croustillant
- **Ingrédients signatures** : Chou blanc frais, Farine de blé T55, Dashi, Œuf cru
- **Garde-fous / dérives interdites** : beaucoup_de_chou, galette_épaisse, sauces_et_katsuobushi
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, œuf

---

### REAL-218 — Takoyaki

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : boulettes de poulpe
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 30 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_dashi`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 300 | g | pâte | non |
| Dashi | 900 | ml | pâte | non |
| Œuf cru | 3 | u | liaison | non |
| Poulpe cuit | 350 | g | garniture | non |
| Tenkasu miettes de tempura | 100 | g | garniture | non |
| Gingembre mariné rouge | 60 | g | garniture | non |
| Ciboule fraîche | 60 | g | garniture | non |
| Sauce takoyaki | 180 | g | finition | non |
| Mayonnaise japonaise | 120 | g | finition | non |
| Katsuobushi | 30 | g | finition | non |

#### Méthode canonique

1. Préparer une pâte très fluide au dashi.
2. Remplir généreusement les alvéoles huilées, ajouter poulpe et garnitures.
3. Retourner progressivement avec des pics pour former des sphères.
4. Cuire jusqu’à extérieur doré et intérieur presque crémeux, puis garnir.

**Techniques** : pâte fluide, cuisson alvéoles, rotation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : gingembre, dashi, poulpe, katsuobushi
- **Textures cibles** : extérieur_croustillant, intérieur_coulant_moelleux
- **Ingrédients signatures** : Farine de blé T55, Dashi, Œuf cru, Poulpe cuit
- **Garde-fous / dérives interdites** : plaque_à_alvéoles, poulpe, retournements_successifs
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, mollusques, poisson, œuf

---

### REAL-219 — Tempura de crevettes et légumes

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : friture légère
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 25 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_dashi`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Crevette crue décortiquée avec queue | 500 | g | principal | non |
| Patate douce crue | 300 | g | légume | non |
| Aubergine japonaise fraîche | 300 | g | légume | non |
| Farine de blé faible en gluten | 250 | g | pâte | non |
| Eau glacée gazeuse | 400 | ml | pâte | non |
| Œuf cru | 1 | u | pâte | non |
| Huile de friture | 1500 | ml | friture | non |
| Dashi | 300 | ml | tentsuyu | non |
| Sauce soja japonaise | 50 | ml | tentsuyu | non |
| Mirin | 50 | ml | tentsuyu | non |

#### Méthode canonique

1. Préparer les ingrédients fins et secs, entailler les crevettes pour les garder droites.
2. Mélanger très peu la pâte glacée en laissant des grumeaux.
3. Frire par petites quantités à température adaptée.
4. Égoutter sur grille et servir immédiatement avec tentsuyu.

**Techniques** : préparation, pâte glacée, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : soja_fermenté, friture_légère, dashi, soja
- **Textures cibles** : enrobage_fin_et_croustillant, intérieur_juste_cuit
- **Ingrédients signatures** : Crevette crue décortiquée avec queue, Patate douce crue, Aubergine japonaise fraîche, Farine de blé faible en gluten
- **Garde-fous / dérives interdites** : pâte_glacée_peu_mélangée, friture_immédiate
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : crustacés, gluten, poisson, soja, œuf

---

### REAL-220 — Karaage

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet frit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 900 | g | viande | non |
| Sauce soja japonaise | 60 | ml | marinade | non |
| Saké de cuisine | 50 | ml | marinade | non |
| Gingembre frais | 25 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Fécule de pomme de terre katakuriko | 180 | g | enrobage | non |
| Huile de friture | 1200 | ml | friture | non |
| Citron jaune frais | 1 | u | service | non |

#### Méthode canonique

1. Mariner le poulet en morceaux avec soja, saké, gingembre et ail.
2. Égoutter légèrement et enrober de katakuriko en créant des aspérités.
3. Frire une première fois à température modérée.
4. Laisser reposer puis frire brièvement plus chaud pour croustiller.

**Techniques** : marinade, enrobage, double friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, agrume, gingembre, soja_fermenté, soja, poulet_frit
- **Textures cibles** : croûte_craggy_croustillante, chair_juteuse
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Sauce soja japonaise, Saké de cuisine, Gingembre frais
- **Garde-fous / dérives interdites** : haut_de_cuisse, katakuriko, double_friture
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-221 — Japanese curry rice

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry au riz
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz japonais cru | 500 | g | base | non |
| Épaule de porc crue | 800 | g | viande | non |
| Pomme de terre crue, épluchée | 600 | g | légume | non |
| Carotte crue | 350 | g | légume | non |
| Oignon jaune cru | 400 | g | aromatique | non |
| Roux de curry japonais | 180 | g | liaison | non |
| Pomme fraîche râpée | 120 | g | douceur | oui |
| Bouillon de volaille | 1200 | ml | cuisson | non |

#### Méthode canonique

1. Colorer la viande et faire brunir légèrement les oignons.
2. Ajouter carottes, pommes de terre et bouillon, puis mijoter.
3. Couper le feu et dissoudre le roux de curry.
4. Reprendre une cuisson douce jusqu’à sauce épaisse et servir sur riz.

**Techniques** : saisie, mijotage, liaison au roux.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, curry_doux, oignon, pomme, porc
- **Textures cibles** : sauce_très_épaisse, légumes_fondants, riz_moelleux
- **Ingrédients signatures** : Riz japonais cru, Épaule de porc crue, Pomme de terre crue, épluchée, Carotte crue
- **Garde-fous / dérives interdites** : roux_de_curry_japonais, sauce_épaisse, service_sur_riz
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-222 — Nikujaga

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût bœuf pommes de terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf cru finement tranché | 600 | g | viande | non |
| Pomme de terre crue, épluchée | 900 | g | base | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Carotte crue | 250 | g | légume | non |
| Shirataki rincé | 300 | g | garniture | non |
| Dashi | 800 | ml | cuisson | non |
| Sauce soja japonaise | 70 | ml | assaisonnement | non |
| Mirin | 70 | ml | douceur | non |
| Sucre semoule | 30 | g | équilibre | non |

#### Méthode canonique

1. Sauter brièvement le bœuf et l’oignon.
2. Ajouter légumes, shirataki et dashi.
3. Assaisonner sucre, mirin puis soja et cuire sous otoshibuta.
4. Réduire jusqu’à légumes glacés et laisser reposer pour imprégner.

**Techniques** : sauté, mijotage sous couvercle tombant, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : oignon_compoté, soja_fermenté, dashi, soja, mirin, bœuf
- **Textures cibles** : pommes_de_terre_fondantes_bords_intacts, bœuf_tendre
- **Ingrédients signatures** : Bœuf cru finement tranché, Pomme de terre crue, épluchée, Oignon jaune cru, Carotte crue
- **Garde-fous / dérives interdites** : otoshibuta, équilibre_sucré_salé, pommes_de_terre
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, soja

---

### REAL-223 — Sukiyaki

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : fondue de bœuf sucrée salée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf persillé cru très fin | 800 | g | viande | non |
| Tofu ferme | 400 | g | garniture | non |
| Chou chinois frais | 600 | g | légume | non |
| Shiitaké frais | 300 | g | garniture | non |
| Shirataki rincé | 300 | g | garniture | non |
| Ciboule japonaise negi | 300 | g | aromatique | non |
| Sauce soja japonaise | 120 | ml | warishita | non |
| Mirin | 120 | ml | warishita | non |
| Sucre semoule | 80 | g | warishita | non |
| Saké | 100 | ml | warishita | non |
| Œuf cru pasteurisé | 6 | u | trempette | oui |

#### Méthode canonique

1. Préparer la warishita sucrée-salée.
2. Saisir quelques tranches de bœuf avec sucre et soja, puis ajouter sauce et garnitures.
3. Cuire les ingrédients par vagues à table sans surcuire le bœuf.
4. Tremper éventuellement chaque bouchée dans l’œuf cru pasteurisé.

**Techniques** : fondue, cuisson séquencée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : soja_fermenté, soja, mirin, bœuf, shiitaké
- **Textures cibles** : bœuf_très_tendre, légumes_justes, bouillon_concentré
- **Ingrédients signatures** : Bœuf persillé cru très fin, Tofu ferme, Chou chinois frais, Shiitaké frais
- **Garde-fous / dérives interdites** : cuisson_à_table, bœuf_très_fin, warishita
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, soja, œuf

---

### REAL-224 — Yakisoba

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles sautées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille yakisoba précuite | 600 | g | base | non |
| Poitrine de porc crue fine | 300 | g | viande | non |
| Chou blanc frais | 500 | g | légume | non |
| Carotte crue | 200 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Sauce yakisoba | 160 | ml | sauce | non |
| Gingembre mariné rouge | 60 | g | finition | non |
| Aonori | 8 | g | finition | non |

#### Méthode canonique

1. Détacher les nouilles à la vapeur ou avec un peu d’eau.
2. Saisir porc et légumes à feu vif.
3. Ajouter les nouilles et les laisser légèrement griller.
4. Verser la sauce sur les bords chauds, mélanger et finir gingembre et aonori.

**Techniques** : sauté, grillade des nouilles, déglacage sauce.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, gingembre, sauce_yakisoba, porc, chou
- **Textures cibles** : nouilles_aux_bords_grillés, légumes_encore_fermes
- **Ingrédients signatures** : Nouille yakisoba précuite, Poitrine de porc crue fine, Chou blanc frais, Carotte crue
- **Garde-fous / dérives interdites** : nouilles_précuites_sautées, sauce_brune, gingembre_rouge
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-225 — Tamagoyaki

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : omelette roulée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 10 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_dashi`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Œuf cru | 8 | u | base | non |
| Dashi | 80 | ml | assaisonnement | non |
| Sucre semoule | 25 | g | douceur | non |
| Sauce soja japonaise | 10 | ml | assaisonnement | non |
| Mirin | 20 | ml | douceur | non |
| Huile végétale | 20 | ml | cuisson | non |

#### Méthode canonique

1. Mélanger les œufs sans incorporer trop d’air avec dashi et assaisonnements.
2. Verser une fine couche dans la poêle rectangulaire.
3. Rouler, huiler et recommencer en enroulant chaque couche autour de la précédente.
4. Presser éventuellement dans une natte et trancher.

**Techniques** : coagulation en couches, roulage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 5/5 |
| Salé | 1/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 1/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : sucré, beurré, épices douces
- **Aromas signatures** : soja_fermenté, dashi, œuf, mirin
- **Textures cibles** : couches_fines_moelleuses, rouleau_régulier
- **Ingrédients signatures** : Œuf cru, Dashi, Sucre semoule, Sauce soja japonaise
- **Garde-fous / dérives interdites** : cuisson_en_couches, roulage, poêle_rectangulaire
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, soja, œuf

---

### REAL-226 — Gyoza porc chou

- **Cuisine / origine** : Japon
- **Identité** : `named_traditional_dish`
- **Catégorie** : raviolis poêlés vapeur
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pâte à gyoza | 40 | u | enveloppe | non |
| Porc haché cru | 500 | g | farce | non |
| Chou blanc frais | 500 | g | farce | non |
| Ciboule fraîche | 80 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Gingembre frais | 18 | g | aromatique | non |
| Sauce soja japonaise | 30 | ml | assaisonnement | non |
| Huile de sésame grillé | 20 | ml | arôme | non |
| Huile végétale | 30 | ml | cuisson | non |

#### Méthode canonique

1. Saler le chou haché puis l’essorer.
2. Mélanger porc, chou et assaisonnements jusqu’à farce collante.
3. Farcir et plisser les disques.
4. Dorer le dessous, ajouter eau et couvrir, puis découvrir pour recrisper.

**Techniques** : dégorgement, pliage, poêlage-vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, gingembre, soja_fermenté, sésame_toasté, porc, chou, sésame
- **Textures cibles** : fond_croustillant, dessus_tendre, farce_juteuse
- **Ingrédients signatures** : Pâte à gyoza, Porc haché cru, Chou blanc frais, Ciboule fraîche
- **Garde-fous / dérives interdites** : poêlage_vapeur, farce_porc_chou, pliage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-227 — Bibimbap de Jeonju

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : bol de riz mélangé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 70 min · cuisson 40 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz rond coréen cru | 500 | g | base | non |
| Bœuf cru finement tranché | 400 | g | viande | non |
| Œuf cru | 6 | u | garniture | non |
| Épinard frais | 300 | g | namul | non |
| Pousse de soja fraîche | 300 | g | namul | non |
| Carotte crue | 250 | g | namul | non |
| Courgette fraîche | 250 | g | namul | non |
| Shiitaké frais | 250 | g | namul | non |
| Gochujang | 120 | g | sauce | non |
| Huile de sésame grillé | 50 | ml | assaisonnement | non |
| Sésame grillé | 30 | g | finition | non |

#### Méthode canonique

1. Cuire le riz et préparer chaque légume séparément en namul avec assaisonnement propre.
2. Mariner et saisir le bœuf.
3. Cuire les œufs au plat et préparer la sauce gochujang.
4. Disposer les couleurs séparément sur le riz, puis mélanger seulement au moment de manger.

**Techniques** : cuissons séparées, marinade, saisie, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : sésame_toasté, gochujang, sésame, bœuf, légumes_assaisonnés
- **Textures cibles** : riz_moelleux, légumes_aux_textures_distinctes, jaune_coulant
- **Ingrédients signatures** : Riz rond coréen cru, Bœuf cru finement tranché, Œuf cru, Épinard frais
- **Garde-fous / dérives interdites** : garnitures_séparées, cinq_couleurs, mélange_à_table
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame, œuf

---

### REAL-228 — Bulgogi

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf mariné grillé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Entrecôte de bœuf crue finement tranchée | 900 | g | viande | non |
| Sauce soja coréenne | 80 | ml | marinade | non |
| Poire asiatique fraîche | 180 | g | marinade | non |
| Sucre brun | 35 | g | marinade | non |
| Huile de sésame grillé | 30 | ml | marinade | non |
| Ail cru | 18 | g | aromatique | non |
| Ciboule fraîche | 80 | g | aromatique | non |
| Sésame grillé | 25 | g | finition | non |
| Champignon shiitaké frais | 250 | g | garniture | oui |

#### Méthode canonique

1. Mélanger soja, poire râpée, sucre, sésame, ail et ciboule.
2. Mariner brièvement le bœuf très fin.
3. Griller ou sauter à feu très vif en petites quantités.
4. Finir au sésame et servir avec riz et feuilles de salade.

**Techniques** : marinade, saisie vive.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, champignon_terreux, soja_fermenté, sésame_toasté, poire, soja, sésame, bœuf_grillé
- **Textures cibles** : bords_caramélisés, viande_très_tendre
- **Ingrédients signatures** : Entrecôte de bœuf crue finement tranchée, Sauce soja coréenne, Poire asiatique fraîche, Sucre brun
- **Garde-fous / dérives interdites** : bœuf_très_fin, poire_dans_marinade, forte_chaleur
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-229 — Galbi gui

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : travers de bœuf grillés
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Travers de bœuf flanken cru | 1400 | g | viande | non |
| Sauce soja coréenne | 100 | ml | marinade | non |
| Poire asiatique fraîche | 200 | g | marinade | non |
| Sucre brun | 50 | g | marinade | non |
| Mirin | 60 | ml | marinade | non |
| Huile de sésame grillé | 30 | ml | marinade | non |
| Ail cru | 20 | g | aromatique | non |
| Ciboule fraîche | 80 | g | aromatique | non |

#### Méthode canonique

1. Faire tremper brièvement les travers pour retirer l’excès de sang, puis sécher.
2. Mariner avec soja, poire, sucre, mirin, sésame et ail.
3. Griller vivement des deux côtés jusqu’à caramélisation.
4. Découper aux ciseaux et servir immédiatement.

**Techniques** : trempage, marinade, grillade.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, soja_fermenté, sésame_toasté, soja, poire, sésame, bœuf_grillé
- **Textures cibles** : bords_caramélisés, viande_juteuse_autour_de_l_os
- **Ingrédients signatures** : Travers de bœuf flanken cru, Sauce soja coréenne, Poire asiatique fraîche, Sucre brun
- **Garde-fous / dérives interdites** : coupe_flanken, marinade_sucrée_salée, grillade
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-230 — Japchae

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles de patate douce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 50 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille de patate douce sèche | 400 | g | base | non |
| Bœuf cru finement tranché | 300 | g | garniture | non |
| Épinard frais | 300 | g | légume | non |
| Carotte crue | 250 | g | légume | non |
| Oignon jaune cru | 220 | g | légume | non |
| Shiitaké frais | 250 | g | garniture | non |
| Sauce soja coréenne | 80 | ml | assaisonnement | non |
| Sucre brun | 35 | g | équilibre | non |
| Huile de sésame grillé | 50 | ml | finition | non |
| Sésame grillé | 25 | g | finition | non |

#### Méthode canonique

1. Cuire les nouilles puis les couper si nécessaire.
2. Cuire séparément bœuf et chaque légume pour préserver couleurs et textures.
3. Assaisonner les nouilles de soja, sucre et sésame.
4. Réunir tous les éléments et mélanger sans casser.

**Techniques** : cuissons séparées, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : oignon_compoté, soja_fermenté, sésame_toasté, sésame, soja, shiitaké, bœuf
- **Textures cibles** : nouilles_élastiques, légumes_distincts
- **Ingrédients signatures** : Nouille de patate douce sèche, Bœuf cru finement tranché, Épinard frais, Carotte crue
- **Garde-fous / dérives interdites** : cuissons_séparées, nouilles_translucides, huile_sésame
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-231 — Tteokbokki

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : gâteaux de riz pimentés
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Gâteau de riz coréen tteok | 800 | g | base | non |
| Gochujang | 120 | g | sauce | non |
| Gochugaru | 15 | g | épice | non |
| Bouillon d’anchois et algue | 900 | ml | cuisson | non |
| Eomuk gâteau de poisson | 300 | g | garniture | non |
| Ciboule fraîche | 80 | g | aromatique | non |
| Sucre brun | 40 | g | équilibre | non |
| Œuf dur | 4 | u | garniture | oui |

#### Méthode canonique

1. Faire un bouillon d’anchois et kombu puis retirer les solides.
2. Dissoudre gochujang, gochugaru et sucre.
3. Ajouter tteok et eomuk, puis cuire en remuant jusqu’à sauce épaisse.
4. Finir à la ciboule et aux œufs facultatifs.

**Techniques** : bouillon, mijotage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : gochujang, anchois, poisson, sucre
- **Textures cibles** : tteok_très_moelleux_et_chewy, sauce_collante
- **Ingrédients signatures** : Gâteau de riz coréen tteok, Gochujang, Gochugaru, Bouillon d’anchois et algue
- **Garde-fous / dérives interdites** : gâteaux_de_riz, gochujang, sauce_épaisse
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, œuf

---

### REAL-232 — Kimchi jjigae

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de kimchi
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 45 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Kimchi de chou fermenté mûr | 700 | g | base | non |
| Poitrine de porc crue | 500 | g | viande | non |
| Tofu ferme | 400 | g | garniture | non |
| Bouillon d’anchois | 1000 | ml | liquide | non |
| Gochugaru | 12 | g | épice | non |
| Gochujang | 40 | g | sauce | oui |
| Ail cru | 12 | g | aromatique | non |
| Ciboule fraîche | 60 | g | finition | non |

#### Méthode canonique

1. Faire revenir le porc puis le kimchi mûr pour concentrer les arômes.
2. Ajouter bouillon, jus de kimchi, ail et piment.
3. Mijoter jusqu’à porc tendre et bouillon rouge intense.
4. Ajouter tofu et ciboule en fin de cuisson.

**Techniques** : sauté, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 5/5 |
| Acide | 4/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 4/5 |
| Pungence | 5/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fermenté, piquant, umami
- **Aromas signatures** : ail, kimchi_mûr, porc, gochugaru, anchois
- **Textures cibles** : bouillon_riche, kimchi_tendre, tofu_soyeux
- **Ingrédients signatures** : Kimchi de chou fermenté mûr, Poitrine de porc crue, Tofu ferme, Bouillon d’anchois
- **Garde-fous / dérives interdites** : kimchi_mûr_indispensable, jus_de_kimchi, mijotage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, soja

---

### REAL-233 — Doenjang jjigae

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de pâte de soja
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Doenjang pâte de soja fermentée | 100 | g | base | non |
| Tofu ferme | 400 | g | garniture | non |
| Courgette fraîche | 300 | g | légume | non |
| Pomme de terre crue, épluchée | 350 | g | légume | non |
| Oignon jaune cru | 180 | g | aromatique | non |
| Shiitaké frais | 200 | g | garniture | non |
| Bouillon d’anchois | 1100 | ml | liquide | non |
| Piment vert frais | 2 | u | épice | non |
| Ail cru | 10 | g | aromatique | non |

#### Méthode canonique

1. Dissoudre le doenjang dans le bouillon puis filtrer les gros résidus si souhaité.
2. Ajouter pomme de terre, oignon et champignon.
3. Ajouter courgette et tofu plus tard.
4. Finir au piment et à l’ail sans masquer la fermentation.

**Techniques** : bouillon, mijotage séquencé.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 5/5 |
| Acide | 4/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 4/5 |
| Pungence | 5/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fermenté, piquant, umami
- **Aromas signatures** : ail, oignon_compoté, piment, doenjang, anchois, shiitaké
- **Textures cibles** : bouillon_trouble, légumes_tendres, tofu
- **Ingrédients signatures** : Doenjang pâte de soja fermentée, Tofu ferme, Courgette fraîche, Pomme de terre crue, épluchée
- **Garde-fous / dérives interdites** : doenjang_dominant, pas_de_sauce_sucrée, bouillon_léger
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, soja

---

### REAL-234 — Sundubu jjigae

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de tofu soyeux
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tofu soyeux sundubu | 800 | g | base | non |
| Palourde fraîche | 500 | g | fruits_de_mer | non |
| Porc haché cru | 200 | g | garniture | oui |
| Bouillon d’anchois | 900 | ml | liquide | non |
| Gochugaru | 18 | g | épice | non |
| Huile de sésame grillé | 25 | ml | cuisson | non |
| Ail cru | 12 | g | aromatique | non |
| Œuf cru | 4 | u | finition | non |
| Ciboule fraîche | 60 | g | finition | non |

#### Méthode canonique

1. Faire une huile pimentée avec sésame, gochugaru et ail sans brûler.
2. Ajouter porc facultatif puis bouillon et palourdes.
3. Ajouter le tofu soyeux en gros morceaux et porter à frémissement.
4. Casser un œuf dans chaque portion et finir à la ciboule.

**Techniques** : huile pimentée, mijotage, coagulation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, piment, sésame_toasté, gochugaru, palourde, sésame, tofu
- **Textures cibles** : tofu_très_soyeux, bouillon_piquant, œuf_coulant
- **Ingrédients signatures** : Tofu soyeux sundubu, Palourde fraîche, Porc haché cru, Bouillon d’anchois
- **Garde-fous / dérives interdites** : tofu_sundubu, huile_pimentée, service_bouillant
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : mollusques, poisson, soja, sésame, œuf

---

### REAL-235 — Dakgalbi

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet sauté pimenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 900 | g | viande | non |
| Gochujang | 100 | g | marinade | non |
| Gochugaru | 12 | g | épice | non |
| Patate douce crue, épluchée | 400 | g | légume | non |
| Chou blanc frais | 500 | g | légume | non |
| Gâteau de riz coréen tteok | 300 | g | garniture | non |
| Ciboule fraîche | 100 | g | aromatique | non |
| Sauce soja coréenne | 40 | ml | marinade | non |
| Ail cru | 15 | g | aromatique | non |
| Huile de sésame grillé | 20 | ml | finition | non |

#### Méthode canonique

1. Mariner le poulet avec gochujang, gochugaru, soja et ail.
2. Sauter poulet, patate douce et chou sur grande plaque.
3. Ajouter tteok et un peu d’eau, puis cuire jusqu’à sauce collante.
4. Finir à la ciboule et au sésame.

**Techniques** : marinade, sauté sur plaque, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, soja_fermenté, sésame_toasté, gochujang, poulet, chou, sésame
- **Textures cibles** : poulet_juteux, tteok_chewy, chou_caramélisé
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Gochujang, Gochugaru, Patate douce crue, épluchée
- **Garde-fous / dérives interdites** : cuisson_sur_plaque, sauce_pimentée_collante, tteok
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja, sésame

---

### REAL-236 — Haemul pajeon

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : crêpe fruits de mer ciboule
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 250 | g | pâte | non |
| Fécule de pomme de terre | 60 | g | croustillant | non |
| Eau glacée | 400 | ml | pâte | non |
| Œuf cru | 2 | u | liaison | non |
| Ciboule fraîche longue | 400 | g | base | non |
| Crevette crue décortiquée | 250 | g | fruits_de_mer | non |
| Calamar cru nettoyé | 250 | g | fruits_de_mer | non |
| Huile végétale | 100 | ml | cuisson | non |
| Sauce soja coréenne | 40 | ml | sauce | non |
| Vinaigre de riz | 30 | ml | sauce | non |

#### Méthode canonique

1. Aligner les ciboules dans une poêle largement huilée.
2. Verser une pâte froide légère et répartir les fruits de mer.
3. Cuire jusqu’à dessous très croustillant, retourner et presser légèrement.
4. Servir avec sauce soja-vinaigre.

**Techniques** : pâte froide, poêlage, retournement.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : soja_fermenté, ciboule, fruits_de_mer, huile, soja
- **Textures cibles** : bords_très_croustillants, centre_moelleux, fruits_de_mer_tendres
- **Ingrédients signatures** : Farine de blé T55, Fécule de pomme de terre, Eau glacée, Œuf cru
- **Garde-fous / dérives interdites** : ciboules_longues, poêle_huilée, pâte_légère
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, gluten, mollusques, soja, œuf

---

### REAL-237 — Kimbap

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : rouleau de riz
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 70 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz rond coréen cru | 500 | g | base | non |
| Algue gim nori | 10 | feuille | enveloppe | non |
| Œuf cru | 4 | u | garniture | non |
| Carotte crue | 250 | g | garniture | non |
| Épinard frais | 300 | g | garniture | non |
| Radis jaune mariné danmuji | 300 | g | garniture | non |
| Bœuf mariné bulgogi cuit | 350 | g | garniture | non |
| Huile de sésame grillé | 40 | ml | assaisonnement | non |
| Sésame grillé | 25 | g | finition | non |

#### Méthode canonique

1. Assaisonner le riz chaud de sel et huile de sésame sans vinaigre.
2. Préparer chaque garniture séparément en longues bandes.
3. Étaler riz et garnitures sur le gim puis rouler fermement.
4. Huiler légèrement, parsemer de sésame et trancher.

**Techniques** : cuissons séparées, roulage, tranchage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : sésame_toasté, sésame, gim, bœuf, légumes_marinés
- **Textures cibles** : riz_moelleux, garnitures_distinctes, algue_souple
- **Ingrédients signatures** : Riz rond coréen cru, Algue gim nori, Œuf cru, Carotte crue
- **Garde-fous / dérives interdites** : riz_sésame_non_vinaigré, garnitures_cuites, roulage
- **Conservation** : À consommer le jour même.
- **Allergènes structurels** : sésame, œuf

---

### REAL-238 — Bossam

- **Cuisine / origine** : Corée
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc bouilli et wraps
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 100 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poitrine de porc crue | 1200 | g | viande | non |
| Doenjang pâte de soja fermentée | 60 | g | pochage | non |
| Café moulu | 10 | g | pochage | oui |
| Ail cru | 30 | g | aromatique | non |
| Gingembre frais | 30 | g | aromatique | non |
| Chou chinois salé | 800 | g | wrap | non |
| Saewoojeot crevette fermentée | 80 | g | sauce | non |
| Ssamjang | 150 | g | sauce | non |
| Ail cru tranché | 30 | g | service | non |

#### Méthode canonique

1. Pocher doucement la poitrine avec doenjang, ail, gingembre et aromates jusqu’à tendre.
2. Laisser reposer puis trancher proprement.
3. Préparer chou salé ou kimchi frais et sauces fermentées.
4. Envelopper porc, ail et sauce dans le chou à table.

**Techniques** : pochage, repos, tranchage, assemblage à table.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 5/5 |
| Acide | 4/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 4/5 |
| Pungence | 5/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fermenté, piquant, umami
- **Aromas signatures** : ail, gingembre, café, porc, doenjang, crevette_fermentée
- **Textures cibles** : porc_tendre_en_tranches, chou_croquant
- **Ingrédients signatures** : Poitrine de porc crue, Doenjang pâte de soja fermentée, Café moulu, Ail cru
- **Garde-fous / dérives interdites** : porc_bouilli_non_rôti, wraps_de_chou, sauces_fermentées
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, soja

---

### REAL-239 — Phở bò

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles au bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 360 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Os de bœuf blanchis | 2500 | g | bouillon | non |
| Paleron de bœuf cru | 800 | g | viande | non |
| Nouille de riz plate sèche | 600 | g | base | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Gingembre frais | 120 | g | aromatique | non |
| Anis étoilé | 6 | u | épice | non |
| Cannelle cassia | 2 | u | épice | non |
| Clou de girofle | 8 | u | épice | non |
| Sauce poisson | 100 | ml | assaisonnement | non |
| Sucre candi | 50 | g | équilibre | non |
| Basilic thaï frais | 100 | g | service | non |
| Pousse de soja fraîche | 400 | g | service | non |
| Citron vert frais | 4 | u | service | non |

#### Méthode canonique

1. Blanchir et nettoyer les os, puis griller oignon et gingembre.
2. Torréfier les épices et cuire un bouillon très clair plusieurs heures en écumant.
3. Cuire le paleron dans le bouillon, refroidir et trancher ; garder éventuellement du bœuf cru très fin pour le service.
4. Cuire les nouilles, couvrir de bouillon brûlant et servir avec herbes, pousses et citron vert.

**Techniques** : blanchiment, grillade aromates, torréfaction, bouillon long, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 2/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : bouillon, umami, aromatique
- **Aromas signatures** : oignon_compoté, agrume, basilic, gingembre, cannelle, anis, gingembre_grillé, sauce_poisson
- **Textures cibles** : bouillon_clair, nouilles_souples, viande_tendre
- **Ingrédients signatures** : Os de bœuf blanchis, Paleron de bœuf cru, Nouille de riz plate sèche, Oignon jaune cru
- **Garde-fous / dérives interdites** : bouillon_clair_écumé, épices_torréfiées, herbes_à_table
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, soja

---

### REAL-240 — Bún chả

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc grillé nouilles herbes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 50 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Porc haché cru | 500 | g | boulettes | non |
| Poitrine de porc crue fine | 500 | g | grillade | non |
| Vermicelle de riz sec | 500 | g | base | non |
| Sauce poisson | 100 | ml | marinade_et_sauce | non |
| Sucre de palme | 80 | g | équilibre | non |
| Échalote crue | 120 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Vinaigre de riz | 80 | ml | acidité | non |
| Carotte crue | 200 | g | pickles | non |
| Papaye verte | 250 | g | pickles | non |
| Menthe fraîche | 80 | g | service | non |
| Coriandre fraîche | 80 | g | service | non |

#### Méthode canonique

1. Mariner poitrine et boulettes avec poisson, sucre, échalote et ail.
2. Griller jusqu’à bords caramélisés.
3. Préparer une sauce nuoc cham légère avec pickles.
4. Servir viande dans la sauce avec vermicelles froids et beaucoup d’herbes.

**Techniques** : marinade, grillade, pickles, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, échalote, coriandre, porc_grillé, sauce_poisson, herbes, pickles
- **Textures cibles** : viande_caramélisée, nouilles_souples, crudités_croquantes
- **Ingrédients signatures** : Porc haché cru, Poitrine de porc crue fine, Vermicelle de riz sec, Sauce poisson
- **Garde-fous / dérives interdites** : deux_formes_de_porc, grillade_charbon, service_décomposé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-241 — Bánh mì thịt

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : sandwich
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Baguette vietnamienne | 6 | u | pain | non |
| Porc rôti vietnamien | 700 | g | viande | non |
| Pâté de foie | 180 | g | tartinade | non |
| Mayonnaise | 120 | g | sauce | non |
| Carotte crue | 250 | g | pickle | non |
| Radis daikon cru | 250 | g | pickle | non |
| Vinaigre de riz | 100 | ml | pickle | non |
| Coriandre fraîche | 80 | g | herbe | non |
| Concombre frais | 300 | g | crudité | non |
| Piment frais | 3 | u | épice | non |
| Sauce soja légère | 40 | ml | assaisonnement | non |

#### Méthode canonique

1. Préparer les pickles de carotte et daikon.
2. Réchauffer le pain pour une croûte fine et un intérieur léger.
3. Tartiner pâté et mayonnaise, puis ajouter porc.
4. Compléter de pickles, concombre, coriandre, piment et soja.

**Techniques** : pickles, montage, réchauffage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : coriandre, piment, soja_fermenté, pâté, porc, pickles
- **Textures cibles** : pain_croustillant, viande_tendre, pickles_croquants
- **Ingrédients signatures** : Baguette vietnamienne, Porc rôti vietnamien, Pâté de foie, Mayonnaise
- **Garde-fous / dérives interdites** : baguette_légère, pickles, herbes, contraste_chaud_froid
- **Conservation** : Composants séparés 3 jours.
- **Allergènes structurels** : soja

---

### REAL-242 — Gỏi cuốn

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : rouleaux de printemps
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 60 min · cuisson 20 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Galette de riz | 20 | u | enveloppe | non |
| Crevette cuite décortiquée | 400 | g | garniture | non |
| Poitrine de porc cuite | 350 | g | garniture | non |
| Vermicelle de riz cuit | 400 | g | garniture | non |
| Laitue fraîche | 250 | g | garniture | non |
| Menthe fraîche | 80 | g | herbe | non |
| Ciboulette asiatique | 80 | g | herbe | non |
| Sauce hoisin | 120 | g | sauce | non |
| Cacahuète grillée | 80 | g | sauce | non |

#### Méthode canonique

1. Préparer toutes les garnitures froides en bandes.
2. Humidifier une galette de riz sans la détremper.
3. Disposer herbes, vermicelles, porc et crevettes pour une coupe nette.
4. Rouler serré et servir immédiatement avec sauce hoisin-cacahuète.

**Techniques** : mise en place, humidification, roulage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : menthe, crevette, porc, cacahuète
- **Textures cibles** : galette_souple, herbes_fraîches, garnitures_distinctes
- **Ingrédients signatures** : Galette de riz, Crevette cuite décortiquée, Poitrine de porc cuite, Vermicelle de riz cuit
- **Garde-fous / dérives interdites** : rouleau_non_frit, herbes_abondantes, transparence_des_crevettes
- **Conservation** : À consommer le jour même.
- **Allergènes structurels** : arachide, crustacés

---

### REAL-243 — Bún bò Huế

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles pimentée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 240 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Jarret de bœuf cru | 1000 | g | viande | non |
| Pied de porc cru | 700 | g | viande | non |
| Nouille de riz épaisse ronde | 600 | g | base | non |
| Citronnelle fraîche | 100 | g | aromatique | non |
| Pâte de crevette fermentée mắm ruốc | 40 | g | umami | non |
| Huile pimentée au roucou | 80 | ml | finition | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Sauce poisson | 80 | ml | assaisonnement | non |
| Chou émincé frais | 400 | g | service | non |
| Herbes vietnamiennes fraîches | 150 | g | service | non |

#### Méthode canonique

1. Blanchir les viandes puis préparer un bouillon avec citronnelle.
2. Délayer la pâte de crevette avec précaution et filtrer.
3. Cuire les viandes jusqu’à tendres, assaisonner de poisson et huile pimentée.
4. Servir avec nouilles épaisses, viandes tranchées, chou et herbes.

**Techniques** : blanchiment, bouillon, fermentation filtrée, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : oignon_compoté, agrume, piment, citronnelle, crevette_fermentée, bœuf
- **Textures cibles** : bouillon_riche, nouilles_épaisses, viandes_gélatineuses
- **Ingrédients signatures** : Jarret de bœuf cru, Pied de porc cru, Nouille de riz épaisse ronde, Citronnelle fraîche
- **Garde-fous / dérives interdites** : citronnelle_abondante, mam_ruoc, huile_pimentée
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, poisson

---

### REAL-244 — Thịt kho trứng

- **Cuisine / origine** : Vietnam
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc braisé œufs
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 120 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poitrine de porc crue | 1000 | g | viande | non |
| Œuf dur | 8 | u | garniture | non |
| Eau de coco | 800 | ml | braisage | non |
| Sauce poisson | 80 | ml | assaisonnement | non |
| Sucre semoule | 70 | g | caramel | non |
| Échalote crue | 120 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Poivre noir moulu | 3 | g | épice | non |

#### Méthode canonique

1. Blanchir le porc puis le couper en cubes.
2. Faire un caramel clair, ajouter porc, échalote et ail.
3. Ajouter sauce poisson et eau de coco, puis braiser doucement.
4. Ajouter les œufs en fin de cuisson pour les colorer sans les durcir.

**Techniques** : blanchiment, caramel, braisage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, échalote, coco, caramel, eau_coco, sauce_poisson, porc
- **Textures cibles** : gras_fondant, sauce_claire_sirupeuse, œufs_colorés
- **Ingrédients signatures** : Poitrine de porc crue, Œuf dur, Eau de coco, Sauce poisson
- **Garde-fous / dérives interdites** : eau_de_coco, caramel, œufs_braisés, porc_avec_gras
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, poisson, œuf

---

### REAL-245 — Pad thaï

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles sautées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 35 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille de riz plate sèche | 400 | g | base | non |
| Crevette crue décortiquée | 400 | g | protéine | non |
| Tofu ferme | 250 | g | protéine | non |
| Œuf cru | 3 | u | liaison | non |
| Tamarin en pâte | 70 | g | acidité | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Sucre de palme | 70 | g | équilibre | non |
| Pousse de soja fraîche | 350 | g | légume | non |
| Ciboulette chinoise fraîche | 150 | g | herbe | non |
| Cacahuète grillée | 100 | g | finition | non |
| Citron vert frais | 3 | u | service | non |

#### Méthode canonique

1. Tremper les nouilles jusqu’à souples mais encore fermes.
2. Préparer une sauce tamarin-poisson-sucre équilibrée.
3. Sauter tofu et crevettes, pousser sur le côté et cuire les œufs.
4. Ajouter nouilles et sauce, puis pousses et ciboulette brièvement ; finir cacahuètes et citron vert.

**Techniques** : trempage, sauté, coagulation, enrobage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : agrume, tamarin, sauce_poisson, cacahuète, ciboulette
- **Textures cibles** : nouilles_chewy, pousses_croquantes, cacahuètes
- **Ingrédients signatures** : Nouille de riz plate sèche, Crevette crue décortiquée, Tofu ferme, Œuf cru
- **Garde-fous / dérives interdites** : tamarin_sauce_poisson_sucre, pas_de_ketchup, nouilles_non_molles
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, crustacés, poisson, soja, œuf

---

### REAL-246 — Gaeng keow wan

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry vert
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 800 | g | viande | non |
| Lait de coco | 800 | ml | sauce | non |
| Pâte de curry vert | 100 | g | épice | non |
| Aubergine thaï fraîche | 400 | g | légume | non |
| Pousse de bambou | 250 | g | légume | non |
| Basilic thaï frais | 80 | g | herbe | non |
| Feuille de combava | 8 | u | aromate | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Sucre de palme | 35 | g | équilibre | non |

#### Méthode canonique

1. Faire craquer la crème de coco jusqu’à huile séparée, puis frire la pâte de curry.
2. Ajouter poulet et lait de coco restant.
3. Ajouter aubergines, bambou, feuilles de combava et cuire jusqu’à juste tendres.
4. Équilibrer poisson et sucre, puis ajouter basilic hors feu.

**Techniques** : craquage coco, friture pâte, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : basilic, coco, curry_vert, combava, basilic_thaï
- **Textures cibles** : sauce_onctueuse, aubergines_tendres, poulet_juteux
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Lait de coco, Pâte de curry vert, Aubergine thaï fraîche
- **Garde-fous / dérives interdites** : pâte_curry_frite, combava, basilic_thaï, équilibre_sucré_salé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, poisson

---

### REAL-247 — Massaman curry

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : curry de bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à braiser cru | 1000 | g | viande | non |
| Lait de coco | 900 | ml | sauce | non |
| Pâte de curry massaman | 120 | g | épice | non |
| Pomme de terre crue, épluchée | 700 | g | légume | non |
| Oignon jaune cru | 300 | g | légume | non |
| Cacahuète grillée | 120 | g | garniture | non |
| Tamarin en pâte | 60 | g | acidité | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Sucre de palme | 50 | g | équilibre | non |
| Cannelle en bâton | 1 | u | épice | non |
| Cardamome verte | 6 | u | épice | non |

#### Méthode canonique

1. Frire la pâte de curry dans la crème de coco.
2. Ajouter bœuf et épices entières, puis lait de coco et eau.
3. Braiser jusqu’à viande presque tendre, puis ajouter pommes de terre et oignons.
4. Équilibrer tamarin, poisson et sucre, finir aux cacahuètes.

**Techniques** : friture pâte, braisage, équilibrage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, coco, cannelle, cardamome, tamarin, cacahuète
- **Textures cibles** : bœuf_fondant, pommes_de_terre_tendres, sauce_épaisse
- **Ingrédients signatures** : Bœuf à braiser cru, Lait de coco, Pâte de curry massaman, Pomme de terre crue, épluchée
- **Garde-fous / dérives interdites** : curry_doux_épices_chaudes, tamarin, cacahuète
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, lait, poisson

---

### REAL-248 — Tom yum goong

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe aigre pimentée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Crevette crue entière | 700 | g | principal | non |
| Bouillon de crevette | 1200 | ml | base | non |
| Citronnelle fraîche | 80 | g | aromatique | non |
| Galanga frais | 50 | g | aromatique | non |
| Feuille de combava | 10 | u | aromate | non |
| Champignon de paille | 300 | g | garniture | non |
| Piment frais | 5 | u | épice | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Jus de citron vert frais | 100 | ml | acidité | non |
| Nam prik pao | 50 | g | sauce | oui |

#### Méthode canonique

1. Préparer un bouillon avec têtes et carapaces, puis filtrer.
2. Infuser citronnelle, galanga et combava sans les surcuire.
3. Ajouter champignons et crevettes très brièvement.
4. Hors du feu, équilibrer sauce poisson, citron vert, piment et nam prik pao.

**Techniques** : fumet, infusion, cuisson courte, équilibrage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, champignon_terreux, agrume, piment, citronnelle, galanga, combava, citron_vert
- **Textures cibles** : bouillon_clair, crevettes_juteuses
- **Ingrédients signatures** : Crevette crue entière, Bouillon de crevette, Citronnelle fraîche, Galanga frais
- **Garde-fous / dérives interdites** : acidité_ajoutée_hors_feu, aromates_non_mangés, crevettes_courtes
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, poisson

---

### REAL-249 — Tom kha gai

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe coco galanga
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `epicurious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haut de cuisse de poulet cru désossé | 600 | g | viande | non |
| Lait de coco | 800 | ml | base | non |
| Bouillon de volaille | 600 | ml | base | non |
| Galanga frais | 60 | g | aromatique | non |
| Citronnelle fraîche | 70 | g | aromatique | non |
| Feuille de combava | 8 | u | aromate | non |
| Champignon de paille | 300 | g | garniture | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Jus de citron vert frais | 80 | ml | acidité | non |
| Piment frais | 3 | u | épice | non |

#### Méthode canonique

1. Infuser galanga, citronnelle et combava dans bouillon et coco.
2. Ajouter le poulet et cuire doucement.
3. Ajouter les champignons brièvement.
4. Hors du feu, équilibrer sauce poisson, citron vert et piment.

**Techniques** : infusion, mijotage doux, équilibrage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, champignon_terreux, agrume, piment, coco, galanga, citronnelle, combava
- **Textures cibles** : bouillon_crémeux, poulet_tendre
- **Ingrédients signatures** : Haut de cuisse de poulet cru désossé, Lait de coco, Bouillon de volaille, Galanga frais
- **Garde-fous / dérives interdites** : galanga_non_gingembre, citron_vert_hors_feu, coco_non_bouilli_fort
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, poisson

---

### REAL-250 — Som tam

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade de papaye verte
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Papaye verte | 800 | g | base | non |
| Haricot kilomètre cru | 200 | g | légume | non |
| Tomate cerise fraîche | 250 | g | légume | non |
| Ail cru | 12 | g | aromatique | non |
| Piment oiseau frais | 4 | u | épice | non |
| Sauce poisson | 50 | ml | assaisonnement | non |
| Jus de citron vert frais | 70 | ml | acidité | non |
| Sucre de palme | 45 | g | équilibre | non |
| Crevette séchée | 40 | g | umami | non |
| Cacahuète grillée | 80 | g | croquant | non |

#### Méthode canonique

1. Piler ail et piment dans un mortier.
2. Ajouter haricots et tomates et les meurtrir légèrement.
3. Ajouter poisson, citron vert, sucre et crevette séchée.
4. Ajouter la papaye râpée et mélanger au pilon sans l’écraser.

**Techniques** : pilonnage, meurtrissage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, tomate_cuite, agrume, piment, citron_vert, poisson, papaye, cacahuète
- **Textures cibles** : très_croquant, juteux
- **Ingrédients signatures** : Papaye verte, Haricot kilomètre cru, Tomate cerise fraîche, Ail cru
- **Garde-fous / dérives interdites** : papaye_verte, mortier, équilibre_acide_sucré_salé_pimenté
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, crustacés, poisson

---

### REAL-251 — Larb de porc

- **Cuisine / origine** : Laos/Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade de viande hachée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Porc haché cru | 700 | g | viande | non |
| Riz gluant cru grillé moulu | 50 | g | texture | non |
| Jus de citron vert frais | 80 | ml | acidité | non |
| Sauce poisson | 60 | ml | assaisonnement | non |
| Échalote crue | 150 | g | aromatique | non |
| Menthe fraîche | 60 | g | herbe | non |
| Coriandre fraîche | 40 | g | herbe | non |
| Piment séché moulu | 6 | g | épice | non |
| Laitue fraîche | 300 | g | service | non |

#### Méthode canonique

1. Griller puis moudre le riz gluant pour le khao khua.
2. Cuire le porc avec très peu d’eau sans le faire brunir excessivement.
3. Hors du feu, ajouter poisson, citron, échalote, piment et riz grillé.
4. Finir aux herbes et servir tiède dans des feuilles.

**Techniques** : torréfaction, hachis poché, assemblage hors feu.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : échalote, agrume, coriandre, piment, citron_vert, menthe, riz_grillé
- **Textures cibles** : viande_granuleuse, herbes_fraîches, poudre_granuleuse
- **Ingrédients signatures** : Porc haché cru, Riz gluant cru grillé moulu, Jus de citron vert frais, Sauce poisson
- **Garde-fous / dérives interdites** : khao_khua, assaisonnement_hors_feu, beaucoup_d_herbes
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-252 — Pad kra pao

- **Cuisine / origine** : Thaïlande
- **Identité** : `named_traditional_dish`
- **Catégorie** : sauté basilic sacré
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 15 min · cuisson 12 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Porc haché cru | 700 | g | viande | non |
| Basilic sacré frais | 100 | g | herbe | non |
| Ail cru | 20 | g | aromatique | non |
| Piment oiseau frais | 6 | u | épice | non |
| Sauce poisson | 45 | ml | assaisonnement | non |
| Sauce soja claire | 30 | ml | assaisonnement | non |
| Sauce huître | 40 | ml | sauce | non |
| Sucre de palme | 15 | g | équilibre | non |
| Œuf cru | 4 | u | garniture | non |
| Riz jasmin cru | 400 | g | base | non |

#### Méthode canonique

1. Piler grossièrement ail et piment.
2. Sauter à feu très vif, ajouter porc et le faire frire jusqu’à bords rôtis.
3. Ajouter sauces et sucre, réduire presque à sec.
4. Ajouter basilic sacré hors feu et servir sur riz avec œuf frit.

**Techniques** : pilonnage, sauté vif, friture œuf.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, basilic, piment, soja_fermenté, basilic_sacré, sauce_poisson
- **Textures cibles** : viande_sèche_aux_bords_rôtis, œuf_croustillant_jaune_coulant
- **Ingrédients signatures** : Porc haché cru, Basilic sacré frais, Ail cru, Piment oiseau frais
- **Garde-fous / dérives interdites** : basilic_sacré_non_basilic_thaï, sauté_très_vif, sauce_courte
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson, soja, œuf

---

### REAL-253 — Khao soi

- **Cuisine / origine** : Thaïlande du Nord
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe curry nouilles
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille aux œufs fraîche | 600 | g | base | non |
| Cuisse de poulet crue, avec os | 1200 | g | viande | non |
| Lait de coco | 900 | ml | sauce | non |
| Pâte de curry khao soi | 120 | g | épice | non |
| Bouillon de volaille | 900 | ml | liquide | non |
| Nouille frite croustillante | 150 | g | garniture | non |
| Moutarde verte fermentée | 200 | g | garniture | non |
| Échalote crue | 150 | g | service | non |
| Citron vert frais | 3 | u | service | non |
| Huile pimentée | 60 | ml | service | non |

#### Méthode canonique

1. Frire la pâte de curry dans la crème de coco.
2. Ajouter poulet, reste de coco et bouillon, puis mijoter jusqu’à tendre.
3. Cuire les nouilles souples et frire une petite partie pour la garniture.
4. Servir avec nouilles, poulet, bouillon, nouilles croustillantes et condiments.

**Techniques** : friture pâte, mijotage, friture nouilles, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, échalote, moutarde, agrume, piment, coco, curry, moutarde_fermentée
- **Textures cibles** : nouilles_souples_et_croustillantes, poulet_fondant, bouillon_crémeux
- **Ingrédients signatures** : Nouille aux œufs fraîche, Cuisse de poulet crue, avec os, Lait de coco, Pâte de curry khao soi
- **Garde-fous / dérives interdites** : double_texture_de_nouilles, condiments_acides, cuisses_avec_os
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde, œuf

---

### REAL-254 — Nasi goreng

- **Cuisine / origine** : Indonésie
- **Identité** : `named_traditional_dish`
- **Catégorie** : riz frit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Riz jasmin cuit froid | 900 | g | base | non |
| Crevette crue décortiquée | 300 | g | protéine | non |
| Poulet cuit effiloché | 300 | g | protéine | oui |
| Kecap manis | 80 | ml | sauce | non |
| Terasi pâte de crevette | 15 | g | umami | non |
| Échalote crue | 150 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Piment frais | 3 | u | épice | non |
| Œuf cru | 4 | u | garniture | non |
| Concombre frais | 250 | g | service | non |

#### Méthode canonique

1. Piler échalote, ail, piment et terasi puis les frire jusqu’à parfumés.
2. Ajouter protéines et riz froid, sauter à feu vif.
3. Ajouter kecap manis et laisser caraméliser légèrement.
4. Servir avec œuf frit et concombre.

**Techniques** : pilonnage, friture aromates, sauté vif.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, échalote, piment, terasi, kecap_manis, riz_grillé
- **Textures cibles** : riz_grainé_aux_bords_grillés, œuf_croustillant
- **Ingrédients signatures** : Riz jasmin cuit froid, Crevette crue décortiquée, Poulet cuit effiloché, Kecap manis
- **Garde-fous / dérives interdites** : terasi, kecap_manis, riz_froid, wok
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, œuf

---

### REAL-255 — Rendang de bœuf

- **Cuisine / origine** : Indonésie
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf confit épicé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à braiser cru | 1400 | g | viande | non |
| Lait de coco | 1200 | ml | cuisson | non |
| Citronnelle fraîche | 100 | g | aromatique | non |
| Galanga frais | 60 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Échalote crue | 250 | g | aromatique | non |
| Piment rouge frais | 80 | g | épice | non |
| Feuille de combava | 10 | u | aromate | non |
| Noix de coco râpée grillée kerisik | 120 | g | liaison | non |
| Tamarin en pâte | 40 | g | acidité | non |

#### Méthode canonique

1. Mixer échalote, ail, galanga, citronnelle et piment.
2. Cuire le bœuf dans coco et pâte d’épices à frémissement.
3. Poursuivre à découvert plusieurs heures en remuant de plus en plus.
4. Ajouter kerisik et cuire jusqu’à sauce entièrement réduite, huile séparée et viande sombre.

**Techniques** : mixage, mijotage, réduction longue, caramélisation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, échalote, agrume, piment, coco, coco_grillée, galanga, citronnelle
- **Textures cibles** : viande_très_fondante, enrobage_sec_et_huileux
- **Ingrédients signatures** : Bœuf à braiser cru, Lait de coco, Citronnelle fraîche, Galanga frais
- **Garde-fous / dérives interdites** : réduction_totale_longue, kerisik, pas_de_sauce_liquide
- **Conservation** : 5 jours ; congélation 3 mois.
- **Allergènes structurels** : fruits à coque, lait

---

### REAL-256 — Gado-gado

- **Cuisine / origine** : Indonésie
- **Identité** : `named_traditional_dish`
- **Catégorie** : salade sauce cacahuète
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 50 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre cuite | 500 | g | légume | non |
| Haricot vert cuit | 350 | g | légume | non |
| Pousse de soja blanchie | 300 | g | légume | non |
| Chou blanc blanchi | 300 | g | légume | non |
| Tofu ferme frit | 350 | g | protéine | non |
| Tempeh frit | 350 | g | protéine | non |
| Œuf dur | 4 | u | garniture | non |
| Pâte d’arachide pure | 220 | g | sauce | non |
| Sucre de palme | 50 | g | sauce | non |
| Tamarin en pâte | 35 | g | sauce | non |
| Piment frais | 2 | u | sauce | non |
| Krupuk crackers | 100 | g | croquant | non |

#### Méthode canonique

1. Cuire chaque légume séparément et les refroidir.
2. Frire tofu et tempeh.
3. Cuire une sauce cacahuète avec sucre, tamarin et piment jusqu’à nappante.
4. Disposer tous les éléments et napper au moment, finir de krupuk.

**Techniques** : cuissons séparées, friture, sauce, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : oléagineux, toasté, savoureux
- **Aromas signatures** : piment, cacahuète, tamarin, tempeh
- **Textures cibles** : légumes_aux_textures_distinctes, tofu_croustillant, sauce_épaisse
- **Ingrédients signatures** : Pomme de terre cuite, Haricot vert cuit, Pousse de soja blanchie, Chou blanc blanchi
- **Garde-fous / dérives interdites** : éléments_séparés, sauce_cacahuète_cuite, krupuk
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : arachide, soja, œuf

---

### REAL-257 — Laksa curry

- **Cuisine / origine** : Malaisie/Singapour
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de nouilles coco
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille de riz épaisse | 600 | g | base | non |
| Crevette crue décortiquée | 500 | g | protéine | non |
| Tofu puff frit | 250 | g | garniture | non |
| Lait de coco | 900 | ml | bouillon | non |
| Bouillon de crevette | 900 | ml | bouillon | non |
| Pâte de laksa | 150 | g | épice | non |
| Pousse de soja fraîche | 350 | g | garniture | non |
| Œuf dur | 4 | u | garniture | non |
| Feuille de laksa vietnamienne | 40 | g | herbe | non |
| Citron vert frais | 3 | u | service | non |

#### Méthode canonique

1. Frire la pâte de laksa jusqu’à huile séparée.
2. Ajouter bouillon et coco, puis mijoter pour intégrer les arômes.
3. Pocher crevettes et tofu brièvement.
4. Servir sur nouilles avec pousses, œuf, herbes et citron vert.

**Techniques** : friture pâte, bouillon, pochage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : agrume, coco, pâte_laksa, crevette, herbes
- **Textures cibles** : bouillon_crémeux, nouilles_souples, tofu_spongieux
- **Ingrédients signatures** : Nouille de riz épaisse, Crevette crue décortiquée, Tofu puff frit, Lait de coco
- **Garde-fous / dérives interdites** : pâte_laksa_frite, fruits_de_mer, coco, condiments_frais
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, lait, soja, œuf

---

### REAL-258 — Char kway teow

- **Cuisine / origine** : Malaisie
- **Identité** : `named_traditional_dish`
- **Catégorie** : nouilles de riz sautées
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 10 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_global`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Nouille de riz large fraîche | 800 | g | base | non |
| Crevette crue décortiquée | 350 | g | protéine | non |
| Saucisse chinoise lap cheong | 200 | g | garniture | non |
| Coque fraîche | 400 | g | fruits_de_mer | oui |
| Œuf cru | 3 | u | liaison | non |
| Pousse de soja fraîche | 350 | g | légume | non |
| Ciboulette chinoise fraîche | 150 | g | herbe | non |
| Sauce soja foncée | 35 | ml | sauce | non |
| Sauce soja légère | 35 | ml | sauce | non |
| Sambal | 40 | g | épice | non |
| Saindoux | 60 | g | cuisson | non |

#### Méthode canonique

1. Préparer toutes les garnitures avant de chauffer le wok.
2. Sauter lap cheong, crevettes et coques au saindoux.
3. Ajouter nouilles, sauces et sambal à feu maximal.
4. Pousser sur le côté, cuire l’œuf, puis ajouter pousses et ciboulette très brièvement.

**Techniques** : mise en place, sauté wok, coagulation.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : soja_fermenté, wok_hei, lap_cheong, sambal, fruits_de_mer
- **Textures cibles** : nouilles_souples_aux_bords_grillés, pousses_croquantes
- **Ingrédients signatures** : Nouille de riz large fraîche, Crevette crue décortiquée, Saucisse chinoise lap cheong, Coque fraîche
- **Garde-fous / dérives interdites** : wok_très_chaud, nouilles_fraîches, saindoux_ou_graisse
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : crustacés, mollusques, soja, œuf

---

### REAL-259 — Chicken adobo

- **Cuisine / origine** : Philippines
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet braisé vinaigré
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1500 | g | viande | non |
| Vinaigre de canne | 180 | ml | acidité | non |
| Sauce soja philippine | 120 | ml | assaisonnement | non |
| Ail cru | 35 | g | aromatique | non |
| Poivre noir en grains | 8 | g | épice | non |
| Feuille de laurier séchée | 4 | u | aromate | non |
| Sucre brun | 20 | g | équilibre | oui |

#### Méthode canonique

1. Mariner facultativement le poulet dans soja, ail et poivre.
2. Saisir le poulet côté peau.
3. Ajouter vinaigre, soja et laurier sans remuer immédiatement, puis braiser.
4. Retirer le poulet, réduire la sauce et le reglacer.

**Techniques** : marinade, saisie, braisage, réduction.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, laurier, soja_fermenté, vinaigre, soja, poivre
- **Textures cibles** : peau_dorée, chair_fondante, sauce_brillante
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Vinaigre de canne, Sauce soja philippine, Ail cru
- **Garde-fous / dérives interdites** : vinaigre_non_cuit_trop_tôt, ail_abondant, réduction_finale
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-260 — Sinigang de porc

- **Cuisine / origine** : Philippines
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe aigre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 100 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Travers de porc crus | 1000 | g | viande | non |
| Tamarin frais ou pâte | 120 | g | acidité | non |
| Tomate fraîche mûre | 400 | g | base | non |
| Radis daikon cru | 350 | g | légume | non |
| Haricot kilomètre cru | 300 | g | légume | non |
| Aubergine fraîche | 300 | g | légume | non |
| Épinard d’eau kangkong | 300 | g | légume | non |
| Sauce poisson | 50 | ml | assaisonnement | non |
| Piment vert frais | 2 | u | épice | non |

#### Méthode canonique

1. Pocher le porc et écumer jusqu’à presque tendre.
2. Ajouter tomate et tamarin pour obtenir un bouillon franchement aigre.
3. Ajouter les légumes du plus ferme au plus fragile.
4. Assaisonner de sauce poisson et servir bouillant.

**Techniques** : pochage, écumage, cuisson séquencée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : tomate_cuite, piment, tamarin, porc, tomate, légumes
- **Textures cibles** : bouillon_clair_acide, porc_tendre, légumes_distincts
- **Ingrédients signatures** : Travers de porc crus, Tamarin frais ou pâte, Tomate fraîche mûre, Radis daikon cru
- **Garde-fous / dérives interdites** : acidité_tamarin_dominante, cuisson_séquencée, pas_de_coco
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-261 — Tacos al pastor

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : tacos de porc mariné
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 90 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_mexican`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Échine de porc crue en fines tranches | 1200 | g | viande | non |
| Piment guajillo séché | 40 | g | marinade | non |
| Piment ancho séché | 30 | g | marinade | non |
| Achiote pâte | 50 | g | marinade | non |
| Vinaigre blanc | 80 | ml | acidité | non |
| Ananas frais | 500 | g | garniture | non |
| Oignon blanc cru | 200 | g | service | non |
| Coriandre fraîche | 80 | g | service | non |
| Tortilla de maïs | 24 | u | service | non |

#### Méthode canonique

1. Réhydrater les piments et mixer avec achiote, vinaigre et épices.
2. Mariner les tranches de porc puis les empiler serrées, idéalement sur broche verticale.
3. Rôtir en tranchant les couches caramélisées au fur et à mesure, avec ananas.
4. Servir dans tortillas avec oignon, coriandre et jus de cuisson.

**Techniques** : marinade, empilage, rôtissage, tranchage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : oignon_compoté, coriandre, piment, achiote, porc_caramélisé, ananas
- **Textures cibles** : bords_croustillants, viande_juteuse, tortilla_souple
- **Ingrédients signatures** : Échine de porc crue en fines tranches, Piment guajillo séché, Piment ancho séché, Achiote pâte
- **Garde-fous / dérives interdites** : porc_en_couches, achiote_ananas, caramélisation
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-262 — Carnitas

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc confit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 25 min · cuisson 210 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_mexican`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule de porc crue | 1800 | g | viande | non |
| Saindoux | 500 | g | confit | non |
| Orange fraîche | 2 | u | arôme | non |
| Oignon blanc cru | 200 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Cannelle en bâton | 1 | u | épice | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Tortilla de maïs | 24 | u | service | non |
| Salsa verde | 300 | g | service | non |

#### Méthode canonique

1. Saler le porc et le disposer très serré avec saindoux, orange et aromates.
2. Cuire lentement couvert jusqu’à effilochable.
3. Effilocher grossièrement en gardant des morceaux.
4. Passer sous le gril ou à la poêle pour créer des bords croustillants avant de servir en tacos.

**Techniques** : confit, effilochage, croustillage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, oignon_compoté, laurier, cannelle, porc, orange, graisse
- **Textures cibles** : extérieur_croustillant, intérieur_conf it
- **Ingrédients signatures** : Épaule de porc crue, Saindoux, Orange fraîche, Oignon blanc cru
- **Garde-fous / dérives interdites** : confit_puis_croustillage, épaule_de_porc, jus_réutilisé
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-263 — Cochinita pibil

- **Cuisine / origine** : Mexique Yucatán
- **Identité** : `named_traditional_dish`
- **Catégorie** : porc à l achiote
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 40 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_mexican`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Épaule de porc crue | 1600 | g | viande | non |
| Achiote pâte | 100 | g | marinade | non |
| Jus d orange amère | 250 | ml | acidité | non |
| Ail cru | 20 | g | aromatique | non |
| Origan mexicain séché | 6 | g | herbe | non |
| Feuille de bananier | 6 | u | enveloppe | non |
| Oignon rouge cru | 300 | g | pickle | non |
| Vinaigre blanc | 120 | ml | pickle | non |
| Piment habanero | 2 | u | service | non |

#### Méthode canonique

1. Mixer achiote, agrume, ail et origan, puis mariner le porc.
2. Envelopper hermétiquement dans les feuilles de bananier.
3. Cuire très lentement jusqu’à effilochable.
4. Servir avec oignons rouges marinés et habanero.

**Techniques** : marinade, enveloppement, cuisson lente, effilochage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, piment, achiote, orange_amère, feuille_bananier, habanero
- **Textures cibles** : porc_effiloché_juteux, pickles_croquants
- **Ingrédients signatures** : Épaule de porc crue, Achiote pâte, Jus d orange amère, Ail cru
- **Garde-fous / dérives interdites** : achiote, agrumes, feuille_bananier, pickles
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-264 — Mole poblano au poulet

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : sauce mole
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 120 min · cuisson 150 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru en morceaux | 1600 | g | viande | non |
| Piment ancho séché | 50 | g | sauce | non |
| Piment mulato séché | 50 | g | sauce | non |
| Piment pasilla séché | 40 | g | sauce | non |
| Tomate fraîche mûre | 500 | g | sauce | non |
| Tomatillo frais | 350 | g | sauce | non |
| Amande | 80 | g | oléagineux | non |
| Sésame | 80 | g | oléagineux | non |
| Tortilla de maïs grillée | 3 | u | liaison | non |
| Pain rassis | 100 | g | liaison | non |
| Raisin sec | 70 | g | douceur | non |
| Chocolat noir mexicain | 100 | g | amertume | non |
| Cannelle en bâton | 1 | u | épice | non |
| Clou de girofle | 5 | u | épice | non |
| Bouillon de volaille | 1200 | ml | cuisson | non |

#### Méthode canonique

1. Pocher ou rôtir le poulet et garder le bouillon.
2. Frire séparément piments, fruits, graines, épices, pain et tortilla sans les brûler.
3. Mixer très finement avec du bouillon puis frire la pâte obtenue.
4. Mijoter longuement, ajouter chocolat pour l’équilibre et napper le poulet.

**Techniques** : fritures séparées, mixage, filtration, friture de sauce, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, tomate_cuite, piment, sésame_toasté, cannelle, cacao, piments_secs, sésame
- **Textures cibles** : sauce_très_lisse_et_épaisse, poulet_tendre
- **Ingrédients signatures** : Poulet entier cru en morceaux, Piment ancho séché, Piment mulato séché, Piment pasilla séché
- **Garde-fous / dérives interdites** : multiples_composants_frits_et_mixés, chocolat_non_dominant, sauce_complexe
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten, sésame

---

### REAL-265 — Enchiladas verdes

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : tortillas en sauce
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 40 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tortilla de maïs | 16 | u | base | non |
| Poulet cuit effiloché | 700 | g | farce | non |
| Tomatillo frais | 900 | g | sauce | non |
| Piment serrano | 3 | u | épice | non |
| Oignon blanc cru | 200 | g | aromatique | non |
| Coriandre fraîche | 60 | g | herbe | non |
| Crème mexicaine | 200 | g | finition | non |
| Fromage frais mexicain | 200 | g | finition | non |
| Huile végétale | 80 | ml | cuisson | non |

#### Méthode canonique

1. Rôtir ou bouillir tomatillos et serranos, puis mixer avec oignon et coriandre.
2. Frire brièvement les tortillas pour les assouplir.
3. Les tremper dans la salsa chaude, farcir de poulet et rouler.
4. Napper de salsa, crème, fromage et oignon frais.

**Techniques** : rôtissage, mixage, friture rapide, montage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, lacté, fromage_affiné, coriandre, piment, tomatillo, serrano, crème
- **Textures cibles** : tortilla_souple, sauce_vive, poulet_moelleux
- **Ingrédients signatures** : Tortilla de maïs, Poulet cuit effiloché, Tomatillo frais, Piment serrano
- **Garde-fous / dérives interdites** : tomatillo_dominant, tortillas_trempées_pas_gratin_obligatoire
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-266 — Chilaquiles rojos

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : tortillas en salsa
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_mexican`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tortilla de maïs rassise | 16 | u | base | non |
| Tomate fraîche mûre | 700 | g | sauce | non |
| Piment guajillo séché | 30 | g | sauce | non |
| Oignon blanc cru | 180 | g | aromatique | non |
| Ail cru | 12 | g | aromatique | non |
| Huile végétale | 100 | ml | friture | non |
| Crème mexicaine | 180 | g | finition | non |
| Fromage frais mexicain | 180 | g | finition | non |
| Œuf cru | 4 | u | garniture | oui |

#### Méthode canonique

1. Couper et frire ou cuire les tortillas jusqu’à chips fermes.
2. Préparer une salsa rouge rôtie et la cuire.
3. Mélanger les chips à la salsa juste assez pour les enrober sans les dissoudre.
4. Servir immédiatement avec crème, fromage, oignon et œuf facultatif.

**Techniques** : friture, rôtissage, mixage, enrobage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, lacté, fromage_affiné, piment, piment_guajillo, tomate
- **Textures cibles** : chips_partiellement_croquantes, sauce_épaisse
- **Ingrédients signatures** : Tortilla de maïs rassise, Tomate fraîche mûre, Piment guajillo séché, Oignon blanc cru
- **Garde-fous / dérives interdites** : chips_de_tortilla_sauce_au_dernier_moment, contraste_de_texture
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, œuf

---

### REAL-267 — Pozole rojo

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe de maïs nixtamalisé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 50 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Maïs pozolero nixtamalisé cuit | 1200 | g | base | non |
| Épaule de porc crue | 1200 | g | viande | non |
| Piment guajillo séché | 50 | g | sauce | non |
| Piment ancho séché | 30 | g | sauce | non |
| Ail cru | 20 | g | aromatique | non |
| Oignon blanc cru | 250 | g | aromatique | non |
| Chou blanc frais | 500 | g | service | non |
| Radis frais | 250 | g | service | non |
| Origan mexicain séché | 8 | g | service | non |
| Citron vert frais | 4 | u | service | non |

#### Méthode canonique

1. Cuire le porc avec oignon et ail jusqu’à tendre, puis l’effilocher partiellement.
2. Mixer les piments réhydratés et filtrer la sauce dans le bouillon.
3. Ajouter le maïs pozolero et mijoter jusqu’à grains ouverts.
4. Servir avec chou, radis, origan, citron et piment.

**Techniques** : pochage, mixage, filtration, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, oignon_compoté, agrume, piment, maïs_nixtamalisé, porc, origan
- **Textures cibles** : bouillon_riche, maïs_chewy, crudités_croquantes
- **Ingrédients signatures** : Maïs pozolero nixtamalisé cuit, Épaule de porc crue, Piment guajillo séché, Piment ancho séché
- **Garde-fous / dérives interdites** : maïs_pozolero, condiments_à_table, bouillon_pimenté
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-268 — Birria de res

- **Cuisine / origine** : Mexique Jalisco
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf braisé pimenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 50 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru | 1200 | g | viande | non |
| Jarret de bœuf cru avec os | 800 | g | viande | non |
| Piment guajillo séché | 60 | g | marinade | non |
| Piment ancho séché | 35 | g | marinade | non |
| Tomate fraîche mûre | 400 | g | sauce | non |
| Vinaigre blanc | 60 | ml | acidité | non |
| Ail cru | 20 | g | aromatique | non |
| Cumin moulu | 5 | g | épice | non |
| Clou de girofle | 5 | u | épice | non |
| Cannelle en bâton | 1 | u | épice | non |
| Bouillon de bœuf | 1500 | ml | cuisson | non |

#### Méthode canonique

1. Griller et réhydrater les piments, puis mixer avec tomate, vinaigre et épices.
2. Mariner les viandes dans l’adobo.
3. Braiser couvert jusqu’à viande effilochable et bouillon rouge riche.
4. Servir en soupe ou tacos trempés dans le consommé.

**Techniques** : grillade piments, mixage, marinade, braisage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, tomate_cuite, cumin, piment, cannelle, piments_secs, clou_girofle, bœuf
- **Textures cibles** : viande_effilochée, consommé_gélatineux
- **Ingrédients signatures** : Paleron de bœuf cru, Jarret de bœuf cru avec os, Piment guajillo séché, Piment ancho séché
- **Garde-fous / dérives interdites** : adobo_de_piments, viande_avec_os, consommé_servi
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-269 — Tamales de poulet salsa verde

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : pâte de maïs vapeur
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 90 min · cuisson 80 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Masa harina pour tamal | 700 | g | pâte | non |
| Saindoux | 220 | g | pâte | non |
| Bouillon de volaille | 800 | ml | hydratation | non |
| Poulet cuit effiloché | 700 | g | farce | non |
| Salsa verde | 500 | g | farce | non |
| Feuille de maïs sèche | 30 | u | enveloppe | non |
| Levure chimique | 10 | g | aération | non |

#### Méthode canonique

1. Tremper les feuilles de maïs.
2. Fouetter le saindoux puis incorporer masa, levure et bouillon jusqu’à pâte légère.
3. Étaler sur les feuilles, ajouter poulet et salsa, puis plier.
4. Cuire à la vapeur jusqu’à pâte se détachant de la feuille.

**Techniques** : trempage, foisonnement, montage, vapeur.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, maïs, saindoux, tomatillo, poulet
- **Textures cibles** : pâte_moelleuse_et_aérée, farce_juteuse
- **Ingrédients signatures** : Masa harina pour tamal, Saindoux, Bouillon de volaille, Poulet cuit effiloché
- **Garde-fous / dérives interdites** : masa_fouettée, enveloppe_maïs, cuisson_vapeur
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-270 — Tlayuda oaxaqueña

- **Cuisine / origine** : Mexique Oaxaca
- **Identité** : `named_traditional_dish`
- **Catégorie** : grande tortilla garnie
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 35 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tlayuda grande | 4 | u | base | non |
| Haricot noir refrit | 500 | g | tartinade | non |
| Saindoux asiento | 100 | g | matière grasse | non |
| Quesillo Oaxaca | 400 | g | fromage | non |
| Tasajo de bœuf | 600 | g | viande | non |
| Chou blanc frais | 300 | g | garniture | non |
| Tomate fraîche mûre | 300 | g | garniture | non |
| Avocat frais | 3 | u | garniture | non |
| Salsa roja | 250 | g | sauce | non |

#### Méthode canonique

1. Griller la tlayuda pour la rendre ferme mais pliable.
2. Étaler asiento puis haricots.
3. Ajouter quesillo et viande grillée.
4. Finir chou, tomate, avocat et salsa, puis plier ou servir ouverte.

**Techniques** : grillade, montage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : tomate_cuite, maïs_grillé, haricot, quesillo, viande_grillée
- **Textures cibles** : tortilla_croquante, fromage_filant, crudités_fraîches
- **Ingrédients signatures** : Tlayuda grande, Haricot noir refrit, Saindoux asiento, Quesillo Oaxaca
- **Garde-fous / dérives interdites** : tlayuda_géante, asiento, quesillo, grillade
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-271 — Sopa de tortilla

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe tomate piment tortilla
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tomate fraîche mûre | 800 | g | base | non |
| Piment pasilla séché | 25 | g | épice | non |
| Bouillon de volaille | 1400 | ml | liquide | non |
| Tortilla de maïs | 10 | u | garniture | non |
| Avocat frais | 2 | u | garniture | non |
| Fromage frais mexicain | 200 | g | garniture | non |
| Crème mexicaine | 150 | g | garniture | non |
| Ail cru | 12 | g | aromatique | non |
| Oignon blanc cru | 180 | g | aromatique | non |

#### Méthode canonique

1. Rôtir tomate, ail et oignon, puis mixer avec une partie du pasilla.
2. Frire la sauce puis ajouter le bouillon et mijoter.
3. Couper et frire les tortillas en lanières, frire aussi du pasilla.
4. Servir le bouillon avec lanières, avocat, fromage et crème.

**Techniques** : rôtissage, mixage, friture, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, lacté, fromage_affiné, piment, tomate_rôtie, pasilla
- **Textures cibles** : bouillon_lisse, lanières_croustillantes, garnitures_crémeuses
- **Ingrédients signatures** : Tomate fraîche mûre, Piment pasilla séché, Bouillon de volaille, Tortilla de maïs
- **Garde-fous / dérives interdites** : tortilla_frite_ajoutée_au_service, pasilla, tomate_rôtie
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-272 — Pescado a la veracruzana

- **Cuisine / origine** : Mexique Veracruz
- **Identité** : `named_traditional_dish`
- **Catégorie** : poisson sauce tomate olives
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 25 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet de vivaneau cru | 800 | g | poisson | non |
| Tomate fraîche mûre | 800 | g | sauce | non |
| Olive verte dénoyautée | 150 | g | garniture | non |
| Câpre au vinaigre | 60 | g | garniture | non |
| Piment jalapeño mariné | 80 | g | épice | non |
| Oignon blanc cru | 200 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Origan mexicain séché | 5 | g | herbe | non |
| Huile d’olive vierge extra | 50 | ml | cuisson | non |

#### Méthode canonique

1. Faire revenir oignon et ail, puis compoter la tomate.
2. Ajouter olives, câpres, jalapeños et origan.
3. Saisir ou déposer le poisson dans la sauce.
4. Cuire juste jusqu’à chair nacrée et servir avec la sauce vive.

**Techniques** : compotage, pochage ou saisie.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, piment, tomate, olive, câpre, jalapeño
- **Textures cibles** : poisson_nacré, sauce_morceaux
- **Ingrédients signatures** : Filet de vivaneau cru, Tomate fraîche mûre, Olive verte dénoyautée, Câpre au vinaigre
- **Garde-fous / dérives interdites** : profil_méditerranéen_mexicain, olives_câpres_jalapeño
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : poisson

---

### REAL-273 — Ceviche de poisson à la mexicaine

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : poisson mariné
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 0 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poisson blanc très frais sans arêtes | 700 | g | poisson | non |
| Jus de citron vert frais | 250 | ml | marinade | non |
| Tomate fraîche mûre | 300 | g | garniture | non |
| Oignon rouge cru | 150 | g | aromatique | non |
| Concombre frais | 250 | g | garniture | non |
| Piment serrano | 2 | u | épice | non |
| Coriandre fraîche | 60 | g | herbe | non |
| Avocat frais | 2 | u | garniture | non |
| Tostada de maïs | 12 | u | service | non |

#### Méthode canonique

1. Couper le poisson en dés réguliers et le garder très froid.
2. Mariner au citron vert juste le temps nécessaire selon la taille.
3. Égoutter partiellement puis ajouter tomate, oignon, concombre, piment et coriandre.
4. Servir immédiatement avec avocat et tostadas.

**Techniques** : taillage, marinade froide, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, coriandre, piment, citron_vert, poisson_frais
- **Textures cibles** : poisson_ferme, crudités_croquantes, tostada_croustillante
- **Ingrédients signatures** : Poisson blanc très frais sans arêtes, Jus de citron vert frais, Tomate fraîche mûre, Oignon rouge cru
- **Garde-fous / dérives interdites** : poisson_ultra_frais, chaîne_du_froid, marinade_non_substitut_de_cuisson_sanitaire
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : poisson

---

### REAL-274 — Esquites

- **Cuisine / origine** : Mexique
- **Identité** : `named_traditional_dish`
- **Catégorie** : maïs de rue en salade
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 20 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `serious_mexican`, `allrecipes_world`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Maïs doux frais en grains | 800 | g | base | non |
| Mayonnaise | 120 | g | sauce | non |
| Crème mexicaine | 100 | g | sauce | non |
| Fromage cotija | 150 | g | finition | non |
| Jus de citron vert frais | 60 | ml | acidité | non |
| Piment ancho moulu | 5 | g | épice | non |
| Piment jalapeño frais | 2 | u | épice | non |
| Ail cru | 8 | g | aromatique | non |
| Coriandre fraîche | 30 | g | herbe | non |

#### Méthode canonique

1. Griller ou saisir très fortement les grains de maïs.
2. Mélanger mayonnaise, crème, citron, ail et piments.
3. Enrober le maïs encore chaud.
4. Finir cotija et coriandre.

**Techniques** : grillade, émulsion, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, lacté, fromage_affiné, agrume, coriandre, piment, maïs_grillé, citron_vert
- **Textures cibles** : grains_croquants, crémeux
- **Ingrédients signatures** : Maïs doux frais en grains, Mayonnaise, Crème mexicaine, Fromage cotija
- **Garde-fous / dérives interdites** : maïs_rôti, crème_mayo, citron_cotija
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-275 — Pupusas revueltas

- **Cuisine / origine** : Salvador
- **Identité** : `named_traditional_dish`
- **Catégorie** : galettes de maïs farcies
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 60 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Masa harina | 600 | g | pâte | non |
| Eau | 500 | ml | hydratation | non |
| Fromage quesillo | 350 | g | farce | non |
| Porc cuit haché chicharrón | 350 | g | farce | non |
| Haricot rouge refrit | 250 | g | farce | non |
| Chou blanc fermenté curtido | 500 | g | service | non |
| Sauce tomate salvadorienne | 300 | g | service | non |

#### Méthode canonique

1. Hydrater la masa jusqu’à souple et non collante.
2. Préparer les farces et les mélanger ou les garder séparées.
3. Enfermer la farce dans une boule, aplatir sans percer.
4. Cuire sur comal jusqu’à taches brunes et servir avec curtido et salsa.

**Techniques** : hydratation, farce, façonnage, comal.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : tomate_cuite, fromage_affiné, maïs, fromage, porc, curtido
- **Textures cibles** : extérieur_grillé, centre_fondant, curtido_croquant
- **Ingrédients signatures** : Masa harina, Eau, Fromage quesillo, Porc cuit haché chicharrón
- **Garde-fous / dérives interdites** : masa_farcie, cuisson_comal, curtido_indispensable
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-276 — Feijoada completa

- **Cuisine / origine** : Brésil
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de haricots noirs
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 50 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Haricot noir sec | 700 | g | base | non |
| Épaule de porc salée | 500 | g | viande | non |
| Poitrine de porc fumée | 350 | g | viande | non |
| Saucisse linguiça | 400 | g | viande | non |
| Travers de porc salés | 500 | g | viande | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 25 | g | aromatique | non |
| Feuille de laurier séchée | 3 | u | aromate | non |
| Orange fraîche | 4 | u | service | non |
| Chou kale frais | 600 | g | service | non |
| Farofa de manioc | 300 | g | service | non |

#### Méthode canonique

1. Dessaler les viandes si nécessaire et tremper les haricots.
2. Cuire haricots et viandes longues à cuire, puis ajouter saucisses plus tard.
3. Faire revenir ail et oignon et les incorporer pour épaissir le bouillon.
4. Servir avec riz, chou sauté, orange et farofa.

**Techniques** : dessalage, trempage, mijotage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : ail, oignon_compoté, laurier, fumé, haricot_noir, porc_fumé, orange
- **Textures cibles** : bouillon_épais, haricots_crémeux, viandes_tendres
- **Ingrédients signatures** : Haricot noir sec, Épaule de porc salée, Poitrine de porc fumée, Saucisse linguiça
- **Garde-fous / dérives interdites** : haricot_noir, mélange_de_porcs, accompagnements_complets
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-277 — Moqueca baiana

- **Cuisine / origine** : Brésil Bahia
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de poisson coco
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 40 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet de poisson blanc ferme cru | 1000 | g | poisson | non |
| Crevette crue décortiquée | 400 | g | fruits_de_mer | oui |
| Lait de coco | 600 | ml | sauce | non |
| Huile de dendê | 80 | ml | signature | non |
| Tomate fraîche mûre | 600 | g | légume | non |
| Poivron rouge frais | 300 | g | légume | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Jus de citron vert frais | 70 | ml | marinade | non |
| Coriandre fraîche | 50 | g | herbe | non |

#### Méthode canonique

1. Mariner brièvement le poisson au citron vert et à l’ail.
2. Superposer oignon, poivron, tomate et poisson dans une cocotte.
3. Ajouter coco et dendê, couvrir et cuire sans remuer agressivement.
4. Ajouter crevettes en fin de cuisson et finir à la coriandre.

**Techniques** : marinade, montage en couches, cuisson étouffée.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, agrume, coriandre, coco, dendê, citron_vert
- **Textures cibles** : poisson_entier_non_défait, sauce_crémeuse, légumes_tendres
- **Ingrédients signatures** : Filet de poisson blanc ferme cru, Crevette crue décortiquée, Lait de coco, Huile de dendê
- **Garde-fous / dérives interdites** : huile_de_dendê, coco, cuisson_en_couches, coriandre
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés, lait, poisson

---

### REAL-278 — Pão de queijo

- **Cuisine / origine** : Brésil
- **Identité** : `named_traditional_dish`
- **Catégorie** : petits pains au fromage
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Fécule de manioc aigre polvilho azedo | 500 | g | base | non |
| Lait entier | 250 | ml | liquide | non |
| Huile végétale | 100 | ml | matière grasse | non |
| Œuf cru | 3 | u | liaison | non |
| Fromage meia-cura râpé | 300 | g | fromage | non |
| Sel fin | 8 | g | assaisonnement | non |

#### Méthode canonique

1. Ébouillanter la fécule avec lait, huile et sel.
2. Laisser tiédir puis incorporer les œufs un à un.
3. Ajouter le fromage et former des boules.
4. Cuire jusqu’à gonflées, creuses et légèrement dorées.

**Techniques** : échaudage, mélange, façonnage, cuisson au four.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : fromage_affiné, manioc, fromage, lait
- **Textures cibles** : croûte_fine, intérieur_chewy_et_aéré
- **Ingrédients signatures** : Fécule de manioc aigre polvilho azedo, Lait entier, Huile végétale, Œuf cru
- **Garde-fous / dérives interdites** : polvilho_aigre, texture_élastique, sans_farine_de_blé
- **Conservation** : 2 jours ; congélation crue 3 mois.
- **Allergènes structurels** : lait, œuf

---

### REAL-279 — Coxinha de frango

- **Cuisine / origine** : Brésil
- **Identité** : `named_traditional_dish`
- **Catégorie** : croquette de poulet
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 80 min · cuisson 35 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet cuit effiloché | 700 | g | farce | non |
| Bouillon de volaille | 800 | ml | pâte | non |
| Farine de blé T55 | 500 | g | pâte | non |
| Beurre doux | 80 | g | pâte | non |
| Fromage catupiry | 250 | g | farce | oui |
| Oignon jaune cru | 180 | g | farce | non |
| Tomate fraîche mûre | 250 | g | farce | non |
| Persil frais | 25 | g | herbe | non |
| Œuf cru | 2 | u | panure | non |
| Chapelure de blé | 300 | g | panure | non |
| Huile de friture | 1500 | ml | friture | non |

#### Méthode canonique

1. Préparer une farce de poulet sèche et savoureuse, avec catupiry facultatif.
2. Porter bouillon et beurre à ébullition, ajouter farine d’un coup et dessécher la pâte.
3. Façonner autour de la farce en forme de goutte.
4. Paner et frire jusqu’à uniformément dorée.

**Techniques** : farce, panade, dessiccation, façonnage, panure, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, beurre, fromage_affiné, poulet, bouillon, catupiry
- **Textures cibles** : croûte_croustillante, pâte_moelleuse, farce_juteuse
- **Ingrédients signatures** : Poulet cuit effiloché, Bouillon de volaille, Farine de blé T55, Beurre doux
- **Garde-fous / dérives interdites** : forme_goutte, pâte_cuite_au_bouillon, farce_poulet
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-280 — Empanadas argentines au bœuf

- **Cuisine / origine** : Argentine
- **Identité** : `named_traditional_dish`
- **Catégorie** : chaussons
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 80 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 600 | g | pâte | non |
| Saindoux | 120 | g | pâte | non |
| Bœuf haché au couteau | 700 | g | farce | non |
| Oignon jaune cru | 500 | g | farce | non |
| Œuf dur | 3 | u | garniture | non |
| Olive verte dénoyautée | 120 | g | garniture | non |
| Cumin moulu | 6 | g | épice | non |
| Paprika doux | 8 | g | épice | non |
| Raisin sec | 80 | g | garniture | oui |

#### Méthode canonique

1. Préparer une pâte au saindoux et la reposer.
2. Cuire beaucoup d’oignon, ajouter bœuf brièvement puis refroidir la farce.
3. Ajouter œuf, olives et raisins facultatifs.
4. Farcir, réaliser le repulgue et cuire au four ou frire.

**Techniques** : pâte, farce, refroidissement, pliage, cuisson.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, cumin, paprika, bœuf, oignon, olive
- **Textures cibles** : pâte_croustillante, farce_juteuse_et_morceaux
- **Ingrédients signatures** : Farine de blé T55, Saindoux, Bœuf haché au couteau, Oignon jaune cru
- **Garde-fous / dérives interdites** : farce_refroidie, repulgue, bœuf_non_sauce_tomate
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, œuf

---

### REAL-281 — Locro criollo

- **Cuisine / origine** : Argentine
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de maïs
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 40 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Maïs blanc sec hominy | 600 | g | base | non |
| Haricot blanc sec | 300 | g | légumineuse | non |
| Courge fraîche | 900 | g | liaison | non |
| Pied de porc cru | 500 | g | gélatine | non |
| Poitrine de porc crue | 400 | g | viande | non |
| Chorizo criollo | 400 | g | viande | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Paprika doux | 10 | g | épice | non |
| Cumin moulu | 6 | g | épice | non |
| Piment moulu | 4 | g | épice | non |

#### Méthode canonique

1. Tremper maïs et haricots.
2. Cuire avec viandes longues et beaucoup d’eau jusqu’à tendreté.
3. Ajouter courge, qui doit se défaire et épaissir le ragoût.
4. Ajouter chorizo plus tard et servir avec huile pimentée à l’oignon.

**Techniques** : trempage, mijotage long, liaison naturelle.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 2/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : terreux, herbacé, savoureux
- **Aromas signatures** : oignon_compoté, cumin, paprika, piment, maïs, courge, porc
- **Textures cibles** : très_épais, maïs_chewy, courge_fondue
- **Ingrédients signatures** : Maïs blanc sec hominy, Haricot blanc sec, Courge fraîche, Pied de porc cru
- **Garde-fous / dérives interdites** : maïs_blanc_sec, courge_comme_liaison, mélange_de_porcs
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-282 — Lomo saltado

- **Cuisine / origine** : Pérou
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf sauté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 4
- **Temps** : préparation 30 min · cuisson 12 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet ou faux-filet de bœuf cru en lanières | 800 | g | viande | non |
| Oignon rouge cru | 350 | g | légume | non |
| Tomate fraîche mûre | 400 | g | légume | non |
| Piment ají amarillo frais | 80 | g | épice | non |
| Sauce soja légère | 60 | ml | sauce | non |
| Vinaigre de vin rouge | 35 | ml | acidité | non |
| Coriandre fraîche | 30 | g | finition | non |
| Frite de pomme de terre | 700 | g | accompagnement | non |
| Riz long blanc cuit | 700 | g | accompagnement | non |

#### Méthode canonique

1. Saisir le bœuf en petites quantités à feu maximal.
2. Sauter rapidement oignon, tomate et ají amarillo en gardant leur structure.
3. Déglacer soja et vinaigre, remettre le bœuf et flamber éventuellement au pisco.
4. Mélanger avec une partie des frites et servir avec riz.

**Techniques** : saisie wok, déglaçage, assemblage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, tomate_cuite, coriandre, piment, soja_fermenté, wok_hei, soja
- **Textures cibles** : bœuf_saisi, légumes_croquants_fondants, frites
- **Ingrédients signatures** : Filet ou faux-filet de bœuf cru en lanières, Oignon rouge cru, Tomate fraîche mûre, Piment ají amarillo frais
- **Garde-fous / dérives interdites** : sauté_très_vif, soja_vinaigre, frites_et_riz
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : soja

---

### REAL-283 — Ají de gallina

- **Cuisine / origine** : Pérou
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet crémeux pimenté
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 75 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru | 1400 | g | viande | non |
| Piment ají amarillo en pâte | 100 | g | épice | non |
| Pain blanc rassis | 200 | g | liaison | non |
| Lait évaporé | 500 | ml | sauce | non |
| Noix | 120 | g | oléagineux | non |
| Parmesan affiné | 80 | g | umami | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Pomme de terre cuite | 700 | g | service | non |
| Œuf dur | 4 | u | garniture | non |
| Olive noire | 100 | g | garniture | non |

#### Méthode canonique

1. Pocher le poulet et l’effilocher, conserver le bouillon.
2. Tremper le pain dans lait et bouillon puis mixer avec noix.
3. Faire revenir oignon, ail et ají amarillo, ajouter la liaison.
4. Ajouter poulet et fromage, cuire jusqu’à sauce crémeuse et servir sur pommes de terre.

**Techniques** : pochage, effilochage, mixage, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, oignon_compoté, parmesan, piment, aji_amarillo, noix, lait, poulet
- **Textures cibles** : poulet_effiloché, sauce_épaisse_et_lisse
- **Ingrédients signatures** : Poulet entier cru, Piment ají amarillo en pâte, Pain blanc rassis, Lait évaporé
- **Garde-fous / dérives interdites** : pain_comme_liaison, aji_amarillo, poulet_effiloché
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : fruits à coque, gluten, lait, œuf

---

### REAL-284 — Causa limeña

- **Cuisine / origine** : Pérou
- **Identité** : `named_traditional_dish`
- **Catégorie** : terrine froide de pomme de terre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Pomme de terre jaune cuite | 1200 | g | base | non |
| Pâte d ají amarillo | 60 | g | assaisonnement | non |
| Jus de citron vert frais | 80 | ml | acidité | non |
| Huile végétale | 60 | ml | émulsion | non |
| Thon au naturel en conserve égoutté | 350 | g | farce | non |
| Mayonnaise | 180 | g | farce | non |
| Avocat frais | 3 | u | farce | non |
| Œuf dur | 4 | u | garniture | non |
| Olive noire | 100 | g | garniture | non |

#### Méthode canonique

1. Passer les pommes de terre chaudes au presse-purée puis refroidir.
2. Assaisonner avec ají amarillo, citron, huile et sel jusqu’à pâte souple.
3. Monter en couches avec thon-mayonnaise et avocat.
4. Réfrigérer, démouler et garnir d’œuf et olives.

**Techniques** : purée, assaisonnement, montage froid.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : agrume, aji_amarillo, citron_vert, pomme_de_terre, avocat
- **Textures cibles** : purée_froide_lisse, couches_nettes, avocat_crémeux
- **Ingrédients signatures** : Pomme de terre jaune cuite, Pâte d ají amarillo, Jus de citron vert frais, Huile végétale
- **Garde-fous / dérives interdites** : pomme_de_terre_jaune, service_froid, couches, aji_amarillo
- **Conservation** : 2 jours au réfrigérateur.
- **Allergènes structurels** : poisson, œuf

---

### REAL-285 — Anticuchos de corazón

- **Cuisine / origine** : Pérou
- **Identité** : `named_traditional_dish`
- **Catégorie** : brochettes de cœur
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cœur de bœuf cru | 1000 | g | viande | non |
| Pâte d ají panca | 100 | g | marinade | non |
| Vinaigre de vin rouge | 100 | ml | acidité | non |
| Ail cru | 20 | g | aromatique | non |
| Cumin moulu | 6 | g | épice | non |
| Origan séché | 5 | g | herbe | non |
| Huile végétale | 60 | ml | marinade | non |
| Pomme de terre cuite | 700 | g | service | non |
| Maïs choclo cuit | 500 | g | service | non |

#### Méthode canonique

1. Parer soigneusement le cœur et le couper en morceaux réguliers.
2. Mariner avec ají panca, vinaigre, ail, cumin et origan.
3. Monter sur brochettes et griller très vivement en badigeonnant.
4. Servir avec pomme de terre et gros maïs.

**Techniques** : parage, marinade, brochette, grillade.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, vin_rouge_réduit, cumin, aji_panca, vinaigre, cœur_grillé
- **Textures cibles** : bords_grillés, cœur_tendre_non_caoutchouteux
- **Ingrédients signatures** : Cœur de bœuf cru, Pâte d ají panca, Vinaigre de vin rouge, Ail cru
- **Garde-fous / dérives interdites** : cœur_de_bœuf, marinade_aji_panca, grillade_courte
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-286 — Arepas reina pepiada

- **Cuisine / origine** : Venezuela
- **Identité** : `named_traditional_dish`
- **Catégorie** : galettes de maïs farcies
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 35 min · cuisson 30 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de maïs précuite blanche | 500 | g | pâte | non |
| Eau | 650 | ml | hydratation | non |
| Poulet cuit effiloché | 600 | g | farce | non |
| Avocat frais | 3 | u | farce | non |
| Mayonnaise | 150 | g | farce | non |
| Coriandre fraîche | 30 | g | herbe | non |
| Jus de citron vert frais | 40 | ml | acidité | non |
| Oignon nouveau frais | 80 | g | aromatique | non |

#### Méthode canonique

1. Hydrater la farine de maïs avec eau et sel, reposer puis former des disques.
2. Cuire sur plaque puis finir au four jusqu’à croûte et intérieur cuit.
3. Mélanger poulet, avocat, mayonnaise, citron et aromates.
4. Ouvrir les arepas et farcir généreusement.

**Techniques** : hydratation, façonnage, plaque, farce.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, agrume, coriandre, maïs, avocat, poulet, citron_vert
- **Textures cibles** : croûte_légère, intérieur_moelleux, farce_crémeuse
- **Ingrédients signatures** : Farine de maïs précuite blanche, Eau, Poulet cuit effiloché, Avocat frais
- **Garde-fous / dérives interdites** : farine_de_maïs_précuite, arepa_ouverte, farce_poulet_avocat
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-287 — Pabellón criollo

- **Cuisine / origine** : Venezuela
- **Identité** : `named_traditional_dish`
- **Catégorie** : assiette bœuf haricots riz
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 45 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Bœuf à braiser cru | 1000 | g | viande | non |
| Haricot noir sec | 450 | g | légumineuse | non |
| Riz long blanc cru | 400 | g | céréale | non |
| Banane plantain mûre | 4 | u | garniture | non |
| Tomate fraîche mûre | 500 | g | sauce | non |
| Poivron rouge frais | 250 | g | sauce | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Ail cru | 15 | g | aromatique | non |
| Cumin moulu | 5 | g | épice | non |

#### Méthode canonique

1. Pocher le bœuf puis l’effilocher et le cuire dans un sofrito tomate-poivron.
2. Cuire les haricots noirs jusqu’à crémeux.
3. Cuire le riz séparément et frire les plantains.
4. Servir les quatre éléments distinctement dans l’assiette.

**Techniques** : pochage, effilochage, mijotage, cuissons séparées.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 3/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fumé, caramélisé, savoureux
- **Aromas signatures** : ail, oignon_compoté, tomate_cuite, cumin, bœuf_effiloché, haricot_noir, plantain, sofrito
- **Textures cibles** : éléments_distincts, plantain_caramélisé, haricots_crémeux
- **Ingrédients signatures** : Bœuf à braiser cru, Haricot noir sec, Riz long blanc cru, Banane plantain mûre
- **Garde-fous / dérives interdites** : quatre_composants_distincts, bœuf_effiloché, plantain
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-288 — Jerk chicken

- **Cuisine / origine** : Jamaïque
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet grillé épicé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Poulet entier cru en morceaux | 1800 | g | viande | non |
| Piment scotch bonnet | 5 | u | épice | non |
| Piment de la Jamaïque en grains | 12 | g | épice | non |
| Thym frais | 20 | g | herbe | non |
| Ciboule fraîche | 150 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Sauce soja | 50 | ml | marinade | non |
| Jus de citron vert frais | 80 | ml | acidité | non |
| Sucre brun | 40 | g | équilibre | non |

#### Méthode canonique

1. Mixer piments, allspice, thym, ciboule, ail, gingembre, soja, citron et sucre.
2. Entailler le poulet et mariner une nuit.
3. Griller lentement avec fumée de bois pimento si possible, puis colorer.
4. Atteindre 75 °C à cœur et laisser reposer.

**Techniques** : mixage, marinade, grillade fumée, repos.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 5/5 |
| Pungence | 4/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : pimenté, fermenté, umami
- **Aromas signatures** : ail, agrume, thym, piment, gingembre, soja_fermenté, fumé, allspice
- **Textures cibles** : peau_noircie, chair_juteuse
- **Ingrédients signatures** : Poulet entier cru en morceaux, Piment scotch bonnet, Piment de la Jamaïque en grains, Thym frais
- **Garde-fous / dérives interdites** : scotch_bonnet, allspice, thym, fumée, marinade_longue
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : soja

---

### REAL-289 — Curry goat jamaïcain

- **Cuisine / origine** : Jamaïque
- **Identité** : `named_traditional_dish`
- **Catégorie** : chèvre au curry
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 210 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Viande de chèvre crue avec os | 1400 | g | viande | non |
| Curry jamaïcain en poudre | 25 | g | épice | non |
| Piment scotch bonnet | 2 | u | épice | non |
| Piment de la Jamaïque moulu | 4 | g | épice | non |
| Thym frais | 15 | g | herbe | non |
| Ciboule fraîche | 120 | g | aromatique | non |
| Ail cru | 20 | g | aromatique | non |
| Gingembre frais | 25 | g | aromatique | non |
| Pomme de terre crue, épluchée | 700 | g | légume | non |
| Lait de coco | 400 | ml | sauce | oui |

#### Méthode canonique

1. Mariner la chèvre avec curry, allspice, aromates et piment.
2. Faire frire le curry restant dans l’huile, puis saisir la viande.
3. Mouiller et braiser très longuement.
4. Ajouter les pommes de terre en fin de cuisson et coco facultatif.

**Techniques** : marinade, friture épices, saisie, braisage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : ail, thym, piment, gingembre, coco, curry, allspice, chèvre
- **Textures cibles** : viande_très_fondante, sauce_épaisse, pommes_de_terre
- **Ingrédients signatures** : Viande de chèvre crue avec os, Curry jamaïcain en poudre, Piment scotch bonnet, Piment de la Jamaïque moulu
- **Garde-fous / dérives interdites** : chèvre_avec_os, curry_frit, cuisson_longue
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-290 — Ropa vieja

- **Cuisine / origine** : Cuba
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf effiloché tomate poivrons
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 35 min · cuisson 180 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Flanchet de bœuf cru | 1200 | g | viande | non |
| Tomate concassée en conserve | 700 | g | sauce | non |
| Poivron rouge frais | 350 | g | légume | non |
| Poivron vert frais | 300 | g | légume | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Ail cru | 18 | g | aromatique | non |
| Vin blanc sec | 150 | ml | déglaçage | non |
| Cumin moulu | 6 | g | épice | non |
| Origan séché | 5 | g | herbe | non |
| Olive verte dénoyautée | 150 | g | garniture | non |

#### Méthode canonique

1. Pocher ou braiser le bœuf jusqu’à effilochable, puis le déchirer en longues fibres.
2. Préparer un sofrito d’oignon, poivrons, ail, tomate, cumin et origan.
3. Déglacer au vin, ajouter la viande et un peu de bouillon.
4. Mijoter jusqu’à fibres imprégnées et finir aux olives.

**Techniques** : pochage, effilochage, sofrito, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 3/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 3/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : tomate, herbacé, acidulé
- **Aromas signatures** : ail, oignon_compoté, vin_blanc_réduit, tomate_cuite, cumin, sofrito, olive, bœuf
- **Textures cibles** : longues_fibres_tendres, sauce_courte, légumes_fondants
- **Ingrédients signatures** : Flanchet de bœuf cru, Tomate concassée en conserve, Poivron rouge frais, Poivron vert frais
- **Garde-fous / dérives interdites** : bœuf_effiloché_en_fibres, sofrito_poivrons, olives
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-291 — Mofongo

- **Cuisine / origine** : Porto Rico
- **Identité** : `named_traditional_dish`
- **Catégorie** : plantain pilé
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Banane plantain verte | 6 | u | base | non |
| Ail cru | 20 | g | aromatique | non |
| Chicharrón de porc | 200 | g | garniture | non |
| Huile de friture | 1200 | ml | friture | non |
| Bouillon de volaille | 250 | ml | humidification | non |
| Crevette à l’ail cuite | 600 | g | garniture | oui |

#### Méthode canonique

1. Frire les morceaux de plantain vert jusqu’à tendres sans brunissement excessif.
2. Piler dans un pilon avec ail et chicharrón.
3. Ajouter un peu de bouillon pour lier sans transformer en purée lisse.
4. Mouler et servir seul ou avec crevettes en sauce.

**Techniques** : friture, pilonnage, moulage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : ail, plantain_vert, chicharrón
- **Textures cibles** : masse_pilée_granuleuse, chicharrón_croquant
- **Ingrédients signatures** : Banane plantain verte, Ail cru, Chicharrón de porc, Huile de friture
- **Garde-fous / dérives interdites** : plantain_vert_frit, pilon, ail, chicharrón
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : crustacés

---

### REAL-292 — Sauerbraten

- **Cuisine / origine** : Allemagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf mariné aigre-doux
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 45 min · cuisson 210 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru | 1400 | g | viande | non |
| Vinaigre de vin rouge | 250 | ml | marinade | non |
| Vin rouge sec | 500 | ml | marinade | non |
| Oignon jaune cru | 300 | g | aromatique | non |
| Carotte crue | 250 | g | aromatique | non |
| Baie de genièvre | 10 | u | épice | non |
| Clou de girofle | 6 | u | épice | non |
| Feuille de laurier séchée | 3 | u | aromate | non |
| Pain d’épices allemand | 120 | g | liaison | non |
| Sucre brun | 40 | g | équilibre | non |

#### Méthode canonique

1. Mariner le bœuf plusieurs jours dans vin, vinaigre, légumes et épices.
2. Égoutter, sécher et saisir la viande, puis filtrer la marinade.
3. Braiser avec une partie de la marinade jusqu’à tendreté.
4. Lier et équilibrer la sauce avec pain d’épices ou gingersnaps et sucre.

**Techniques** : marinade longue, saisie, braisage, liaison.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, laurier, vinaigre, genièvre, clou_girofle, pain_épices
- **Textures cibles** : viande_fondante, sauce_nappante_aigre_douce
- **Ingrédients signatures** : Paleron de bœuf cru, Vinaigre de vin rouge, Vin rouge sec, Oignon jaune cru
- **Garde-fous / dérives interdites** : marinade_plusieurs_jours, acidité_douce, liaison_pain_épices
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten

---

### REAL-293 — Rinderrouladen

- **Cuisine / origine** : Allemagne
- **Identité** : `named_traditional_dish`
- **Catégorie** : roulades de bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 50 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world`, `allrecipes_world2`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Tranche de bœuf crue fine | 8 | u | viande | non |
| Moutarde allemande | 80 | g | garniture | non |
| Poitrine de porc fumée | 250 | g | garniture | non |
| Cornichon au vinaigre | 200 | g | garniture | non |
| Oignon jaune cru | 250 | g | garniture | non |
| Bouillon de bœuf | 1000 | ml | braisage | non |
| Vin rouge sec | 200 | ml | déglaçage | non |
| Beurre clarifié | 60 | g | cuisson | non |

#### Méthode canonique

1. Aplatir les tranches, tartiner de moutarde et garnir de lard, cornichon et oignon.
2. Rouler serré et ficeler ou piquer.
3. Saisir les roulades, déglacer et braiser longuement.
4. Retirer les roulades et réduire la sauce.

**Techniques** : aplatir, farce, roulage, saisie, braisage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, vin_rouge_réduit, beurre, moutarde, fumé, cornichon, lard, vin
- **Textures cibles** : viande_fondante, farce_acidulée, sauce_nappante
- **Ingrédients signatures** : Tranche de bœuf crue fine, Moutarde allemande, Poitrine de porc fumée, Cornichon au vinaigre
- **Garde-fous / dérives interdites** : roulade_garnie_moutarde_lard_cornichon, braisage
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait, moutarde

---

### REAL-294 — Wiener schnitzel

- **Cuisine / origine** : Autriche
- **Identité** : `named_traditional_dish`
- **Catégorie** : escalope panée
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 30 min · cuisson 15 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Escalope de veau crue fine | 6 | u | viande | non |
| Farine de blé T55 | 120 | g | panure | non |
| Œuf cru | 3 | u | panure | non |
| Chapelure fine de blé | 250 | g | panure | non |
| Beurre clarifié | 400 | g | friture | non |
| Citron jaune frais | 2 | u | service | non |
| Persil frais | 20 | g | finition | non |

#### Méthode canonique

1. Aplatir le veau très finement sans le déchirer.
2. Fariner, passer dans l’œuf puis chapelure sans presser.
3. Cuire dans une quantité généreuse de graisse en agitant la poêle pour faire souffler la panure.
4. Égoutter et servir immédiatement avec citron.

**Techniques** : aplatir, panure, friture peu profonde.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : beurre, agrume, veau, beurre_clarifié, citron
- **Textures cibles** : panure_soufflée_et_croustillante, veau_tendre
- **Ingrédients signatures** : Escalope de veau crue fine, Farine de blé T55, Œuf cru, Chapelure fine de blé
- **Garde-fous / dérives interdites** : veau_non_porc, panure_non_pressée, cuisson_dans_graisse_abondante
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, lait, œuf

---

### REAL-295 — Goulash hongrois

- **Cuisine / origine** : Hongrie
- **Identité** : `named_traditional_dish`
- **Catégorie** : soupe-ragoût de bœuf
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 150 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Paleron de bœuf cru | 1200 | g | viande | non |
| Oignon jaune cru | 600 | g | base | non |
| Paprika doux hongrois | 30 | g | épice | non |
| Paprika fort hongrois | 5 | g | épice | non |
| Carvi en graines | 5 | g | épice | non |
| Pomme de terre crue, épluchée | 700 | g | légume | non |
| Poivron vert frais | 250 | g | légume | non |
| Tomate fraîche mûre | 300 | g | légume | non |
| Saindoux | 70 | g | cuisson | non |
| Bouillon de bœuf | 1200 | ml | cuisson | non |

#### Méthode canonique

1. Faire fondre les oignons dans le saindoux sans les brûler.
2. Hors feu direct, ajouter le paprika pour éviter l’amertume.
3. Ajouter bœuf, carvi, tomate et bouillon, puis mijoter.
4. Ajouter pommes de terre et poivron en fin de cuisson pour une soupe-ragoût.

**Techniques** : fondue d’oignons, torréfaction douce, mijotage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 2/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 3/5 |
| Pungence | 3/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : épices chaudes, aromatique, profond
- **Aromas signatures** : oignon_compoté, tomate_cuite, paprika, carvi, bœuf, oignon
- **Textures cibles** : viande_fondante, bouillon_rouge, légumes_tendres
- **Ingrédients signatures** : Paleron de bœuf cru, Oignon jaune cru, Paprika doux hongrois, Paprika fort hongrois
- **Garde-fous / dérives interdites** : paprika_hongrois, beaucoup_d_oignon, plus_soupe_que_sauce_crème
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-296 — Chicken paprikash

- **Cuisine / origine** : Hongrie
- **Identité** : `named_traditional_dish`
- **Catégorie** : poulet au paprika
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 70 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Cuisse de poulet crue, avec os, avec peau | 1500 | g | viande | non |
| Oignon jaune cru | 500 | g | base | non |
| Paprika doux hongrois | 25 | g | épice | non |
| Crème aigre | 300 | g | sauce | non |
| Farine de blé T55 | 30 | g | liaison | non |
| Bouillon de volaille | 600 | ml | cuisson | non |
| Saindoux | 60 | g | cuisson | non |
| Poivron vert frais | 200 | g | garniture | oui |

#### Méthode canonique

1. Colorer légèrement le poulet puis le réserver.
2. Faire fondre l’oignon, retirer du feu pour ajouter le paprika.
3. Ajouter bouillon et poulet, puis mijoter jusqu’à tendre.
4. Tempérer crème aigre et farine avec la sauce, incorporer sans forte ébullition.

**Techniques** : saisie, fondue, liaison crème aigre.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : ail, oignon_compoté, lacté, paprika, crème_aigre, oignon, poulet
- **Textures cibles** : poulet_fondant, sauce_lisse_acidulée
- **Ingrédients signatures** : Cuisse de poulet crue, avec os, avec peau, Oignon jaune cru, Paprika doux hongrois, Crème aigre
- **Garde-fous / dérives interdites** : paprika_non_brûlé, crème_aigre_tempérée, cuisses_avec_os
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### REAL-297 — Pierogi ruskie

- **Cuisine / origine** : Pologne
- **Identité** : `named_traditional_dish`
- **Catégorie** : raviolis pomme de terre fromage
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 90 min · cuisson 30 min
- **Difficulté** : difficile
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Farine de blé T55 | 600 | g | pâte | non |
| Eau chaude | 300 | ml | pâte | non |
| Pomme de terre cuite | 900 | g | farce | non |
| Fromage blanc twaróg | 500 | g | farce | non |
| Oignon jaune cru | 400 | g | garniture | non |
| Beurre doux | 100 | g | service | non |
| Poivre noir moulu | 4 | g | assaisonnement | non |

#### Méthode canonique

1. Préparer une pâte souple à l’eau chaude et la reposer.
2. Écraser pommes de terre et twaróg avec oignon revenu et poivre.
3. Abaisser, découper, farcir et sceller.
4. Pocher puis servir avec beurre et oignons dorés, éventuellement poêler.

**Techniques** : pâte, farce, pliage, pochage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 1/5 |
| Amer | 0/5 |
| Umami | 4/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 1/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 3/5 |

- **Dominantes** : crémeux, doux, savoureux
- **Aromas signatures** : oignon_compoté, beurre, fromage_affiné, pomme_de_terre, fromage_blanc, oignon
- **Textures cibles** : pâte_tendre, farce_dense, bords_poêlés_facultatifs
- **Ingrédients signatures** : Farine de blé T55, Eau chaude, Pomme de terre cuite, Fromage blanc twaróg
- **Garde-fous / dérives interdites** : farce_pomme_de_terre_twarog, pochage, pas_de_viande
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait

---

### REAL-298 — Bigos

- **Cuisine / origine** : Pologne
- **Identité** : `named_traditional_dish`
- **Catégorie** : ragoût de chou et viandes
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 10
- **Temps** : préparation 45 min · cuisson 240 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Choucroute crue fermentée | 1000 | g | base | non |
| Chou blanc frais | 700 | g | base | non |
| Épaule de porc crue | 600 | g | viande | non |
| Saucisse fumée kielbasa | 400 | g | viande | non |
| Bœuf à braiser cru | 400 | g | viande | non |
| Champignon séché | 50 | g | umami | non |
| Pruneau dénoyauté | 120 | g | douceur | non |
| Vin rouge sec | 250 | ml | cuisson | non |
| Baie de genièvre | 8 | u | épice | non |
| Feuille de laurier séchée | 3 | u | aromate | non |

#### Méthode canonique

1. Rincer légèrement la choucroute si nécessaire et la mélanger au chou frais.
2. Dorer les viandes séparément.
3. Réunir avec champignons, pruneaux, vin et épices.
4. Mijoter plusieurs heures, refroidir et réchauffer au moins une fois.

**Techniques** : saisie, mijotage long, réchauffage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 5/5 |
| Acide | 4/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 4/5 |
| Pungence | 5/5 |
| Richesse | 3/5 |
| Fraîcheur | 2/5 |
| Intensité | 5/5 |

- **Dominantes** : fermenté, piquant, umami
- **Aromas signatures** : vin_rouge_réduit, champignon_terreux, laurier, fumé, choucroute, genièvre, pruneau, champignon
- **Textures cibles** : chou_très_fondant, viandes_tendres, jus_concentré
- **Ingrédients signatures** : Choucroute crue fermentée, Chou blanc frais, Épaule de porc crue, Saucisse fumée kielbasa
- **Garde-fous / dérives interdites** : choucroute_et_chou_frais, mélange_de_viandes, réchauffages
- **Conservation** : 5 jours ; meilleur réchauffé.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-299 — Barszcz czerwony

- **Cuisine / origine** : Pologne
- **Identité** : `named_traditional_dish`
- **Catégorie** : bouillon de betterave
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 30 min · cuisson 60 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Betterave crue | 1200 | g | base | non |
| Bouillon de légumes | 1400 | ml | liquide | non |
| Zakwas de betterave fermenté | 400 | ml | acidité | non |
| Champignon séché | 30 | g | umami | non |
| Pomme fraîche | 150 | g | douceur | non |
| Ail cru | 10 | g | aromatique | non |
| Feuille de laurier séchée | 2 | u | aromate | non |
| Piment de la Jamaïque en grains | 6 | u | épice | non |
| Jus de citron frais | 30 | ml | ajustement | non |

#### Méthode canonique

1. Cuire doucement betteraves, champignons, pomme et épices dans le bouillon sans forte ébullition.
2. Filtrer pour un bouillon clair.
3. Ajouter le zakwas hors du feu vif pour préserver son acidité et sa couleur.
4. Ajuster avec citron, sucre ou sel et servir avec uszka facultatifs.

**Techniques** : infusion, filtration, acidification.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 5/5 |
| Amer | 1/5 |
| Umami | 2/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 1/5 |
| Fraîcheur | 5/5 |
| Intensité | 3/5 |

- **Dominantes** : frais, acidulé, herbacé
- **Aromas signatures** : ail, champignon_terreux, agrume, laurier, piment, betterave, fermentation, champignon
- **Textures cibles** : bouillon_clair, acidulé
- **Ingrédients signatures** : Betterave crue, Bouillon de légumes, Zakwas de betterave fermenté, Champignon séché
- **Garde-fous / dérives interdites** : zakwas_fermenté, couleur_rouge_claire, pas_de_crème_obligatoire
- **Conservation** : 4 jours au réfrigérateur.
- **Allergènes structurels** : aucun détecté automatiquement

---

### REAL-300 — Beef stroganoff

- **Cuisine / origine** : Russie
- **Identité** : `named_traditional_dish`
- **Catégorie** : bœuf sauce crème aigre
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 25 min · cuisson 25 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet de bœuf cru en lanières | 800 | g | viande | non |
| Champignon de Paris frais | 400 | g | garniture | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Crème aigre | 300 | g | sauce | non |
| Moutarde de Dijon | 25 | g | condiment | non |
| Bouillon de bœuf | 250 | ml | sauce | non |
| Beurre doux | 60 | g | cuisson | non |
| Farine de blé T55 | 20 | g | liaison | oui |
| Aneth frais | 20 | g | finition | non |

#### Méthode canonique

1. Saisir le bœuf très rapidement et le réserver.
2. Colorer les champignons puis faire fondre l’oignon.
3. Déglacer au bouillon, ajouter moutarde et réduire.
4. Hors forte ébullition, ajouter crème aigre puis remettre le bœuf brièvement.

**Techniques** : saisie rapide, coloration, déglaçage, tempérage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 4/5 |
| Amer | 0/5 |
| Umami | 3/5 |
| Chaleur pimentée | 2/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 3/5 |
| Intensité | 4/5 |

- **Dominantes** : acidulé, crémeux, épices
- **Aromas signatures** : oignon_compoté, champignon_terreux, beurre, lacté, moutarde, crème_aigre, champignon, bœuf
- **Textures cibles** : bœuf_tendre, champignons_dorés, sauce_nappante
- **Ingrédients signatures** : Filet de bœuf cru en lanières, Champignon de Paris frais, Oignon jaune cru, Crème aigre
- **Garde-fous / dérives interdites** : bœuf_cuisson_courte, crème_aigre_non_bouillie, pas_de_tomate_dominante
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : gluten, lait, moutarde

---

### REAL-301 — Shepherd’s pie

- **Cuisine / origine** : Royaume-Uni
- **Identité** : `named_traditional_dish`
- **Catégorie** : hachis d’agneau gratiné
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 8
- **Temps** : préparation 40 min · cuisson 55 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Agneau haché cru | 900 | g | viande | non |
| Pomme de terre crue, épluchée | 1400 | g | purée | non |
| Carotte crue | 300 | g | légume | non |
| Petit pois surgelé | 250 | g | légume | non |
| Oignon jaune cru | 250 | g | aromatique | non |
| Bouillon d’agneau | 500 | ml | sauce | non |
| Concentré de tomate | 40 | g | liaison | non |
| Sauce Worcestershire | 40 | ml | umami | non |
| Beurre doux | 80 | g | purée | non |
| Lait entier | 250 | ml | purée | non |

#### Méthode canonique

1. Faire revenir l’agneau jusqu’à brun, ajouter légumes, tomate, Worcestershire et bouillon.
2. Réduire jusqu’à garniture épaisse.
3. Préparer une purée souple mais tenant.
4. Monter et cuire jusqu’à dessus doré et bords bouillonnants.

**Techniques** : saisie, réduction, purée, montage, gratinage.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 3/5 |
| Acide | 2/5 |
| Amer | 1/5 |
| Umami | 5/5 |
| Chaleur pimentée | 0/5 |
| Pungence | 2/5 |
| Richesse | 5/5 |
| Fraîcheur | 1/5 |
| Intensité | 5/5 |

- **Dominantes** : umami, rôti, vinique
- **Aromas signatures** : oignon_compoté, tomate_cuite, beurre, agneau, worcestershire, purée, légumes
- **Textures cibles** : farce_juteuse_épaisse, purée_dorée
- **Ingrédients signatures** : Agneau haché cru, Pomme de terre crue, épluchée, Carotte crue, Petit pois surgelé
- **Garde-fous / dérives interdites** : agneau_non_bœuf, purée_en_couverture, garniture_non_liquide
- **Conservation** : 3 jours au réfrigérateur.
- **Allergènes structurels** : lait

---

### REAL-302 — Fish and chips

- **Cuisine / origine** : Royaume-Uni
- **Identité** : `named_traditional_dish`
- **Catégorie** : poisson frit
- **Statut / confiance** : `candidate` / `B`
- **Portions** : 6
- **Temps** : préparation 45 min · cuisson 35 min
- **Difficulté** : moyenne
- **Sources-signaux** : `allrecipes_world2`, `serious_global`

#### Ingrédients normalisés

| Forme alimentaire exacte | Quantité | Unité | Rôle | Optionnel |
|---|---:|---|---|---|
| Filet de cabillaud cru | 1000 | g | poisson | non |
| Farine de blé T55 | 300 | g | pâte | non |
| Bière blonde froide | 450 | ml | pâte | non |
| Levure chimique | 8 | g | aération | non |
| Pomme de terre crue, épluchée | 1400 | g | frites | non |
| Huile de friture | 2500 | ml | friture | non |
| Vinaigre de malt | 100 | ml | service | non |
| Petit pois surgelé | 400 | g | accompagnement | non |

#### Méthode canonique

1. Tailler les pommes de terre, les rincer, blanchir puis refroidir.
2. Préparer une pâte froide à la bière juste avant usage.
3. Fariner le poisson, enrober et frire jusqu’à croûte légère.
4. Faire la seconde cuisson des frites et servir avec vinaigre de malt et pois écrasés.

**Techniques** : double cuisson, pâte froide, friture.

#### Empreinte sensorielle

| Dimension | Score / cible |
|---|---|
| Sucré | 1/5 |
| Salé | 4/5 |
| Acide | 1/5 |
| Amer | 1/5 |
| Umami | 4/5 |
| Chaleur pimentée | 1/5 |
| Pungence | 2/5 |
| Richesse | 4/5 |
| Fraîcheur | 2/5 |
| Intensité | 4/5 |

- **Dominantes** : croustillant, salé, rôti
- **Aromas signatures** : bière, poisson, friture, vinaigre_malt
- **Textures cibles** : pâte_croustillante, poisson_nacré, frites_craquantes
- **Ingrédients signatures** : Filet de cabillaud cru, Farine de blé T55, Bière blonde froide, Levure chimique
- **Garde-fous / dérives interdites** : double_cuisson_frites, pâte_bière_froide, poisson_épais
- **Conservation** : À consommer immédiatement.
- **Allergènes structurels** : gluten, poisson

---

## 7. Graphe formes alimentaires → recettes

| Forme alimentaire | Degré | Recettes |
|---|---:|---|
| Ail cru | 114 | FR-001, FR-006, FR-007, FR-008, MX-001, VEG-001, IND-001, IND-002, MED-001, LEV-001, LEV-002, IT-005, IT-006, FR-017, FR-019, GR-001, FR-020, FR-026, FR-027, REAL-073, REAL-076, REAL-077, REAL-078, REAL-079, REAL-080, REAL-084, REAL-085, REAL-092, REAL-093, REAL-095, REAL-099, REAL-102, REAL-103, REAL-104, REAL-105, REAL-111, REAL-112, REAL-114, REAL-115, REAL-116, REAL-117, REAL-120, REAL-127, REAL-128, REAL-130, REAL-132, REAL-139, REAL-142, REAL-148, REAL-149, REAL-150, REAL-151, REAL-153, REAL-154, REAL-162, REAL-165, REAL-166, REAL-167, REAL-168, REAL-169, REAL-170, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-178, REAL-180, REAL-183, REAL-187, REAL-188, REAL-190, REAL-191, REAL-192, REAL-196, REAL-197, REAL-204, REAL-209, REAL-212, REAL-213, REAL-220, REAL-226, REAL-228, REAL-229, REAL-232, REAL-233, REAL-234, REAL-235, REAL-238, REAL-240, REAL-244, REAL-250, REAL-252, REAL-254, REAL-255, REAL-259, REAL-262, REAL-263, REAL-266, REAL-267, REAL-268, REAL-271, REAL-272, REAL-274, REAL-276, REAL-277, REAL-283, REAL-285, REAL-287, REAL-288, REAL-289, REAL-290, REAL-291, REAL-299 |
| Oignon jaune cru | 107 | FR-001, FR-002, FR-003, FR-004, IT-001, FR-007, FR-008, MAG-001, MX-001, VEG-001, IND-001, IND-002, MED-001, LEV-002, IT-004, IT-006, FR-012, FR-013, FR-014, IT-008, FR-015, FR-016, FR-017, FR-019, GR-001, REAL-073, REAL-074, REAL-075, REAL-077, REAL-078, REAL-079, REAL-084, REAL-085, REAL-092, REAL-093, REAL-095, REAL-098, REAL-106, REAL-108, REAL-111, REAL-119, REAL-120, REAL-124, REAL-125, REAL-126, REAL-129, REAL-130, REAL-131, REAL-132, REAL-133, REAL-134, REAL-136, REAL-141, REAL-142, REAL-143, REAL-144, REAL-145, REAL-146, REAL-152, REAL-154, REAL-155, REAL-157, REAL-158, REAL-159, REAL-164, REAL-165, REAL-166, REAL-167, REAL-169, REAL-172, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-181, REAL-184, REAL-186, REAL-187, REAL-188, REAL-190, REAL-214, REAL-215, REAL-216, REAL-221, REAL-222, REAL-224, REAL-230, REAL-233, REAL-239, REAL-243, REAL-247, REAL-276, REAL-277, REAL-279, REAL-280, REAL-281, REAL-283, REAL-287, REAL-290, REAL-292, REAL-293, REAL-295, REAL-296, REAL-297, REAL-300, REAL-301 |
| Sel fin | 79 | FR-001, FR-002, FR-003, FR-004, IT-001, FR-005, FR-006, FR-007, FR-008, FR-009, MAG-001, MX-001, FR-010, FR-011, VEG-001, VEG-002, EGG-001, VEG-003, IND-001, IND-002, MED-001, LEV-001, LEV-002, IT-002, IT-003, IT-004, IT-005, IT-006, IT-007, FR-012, FR-013, FR-014, IT-008, FR-015, FR-016, FR-017, FR-018, FR-019, GR-001, FR-020, FR-021, FR-022, DESS-001, DESS-002, DESS-003, DESS-005, DESS-007, DESS-008, FR-024, FR-025, FR-026, FR-027, DESS-009, DESS-010, FR-029, FR-031, FR-032, FR-033, FR-034, FR-035, FR-037, FR-038, FR-040, REAL-076, REAL-081, REAL-088, REAL-089, REAL-099, REAL-100, REAL-103, REAL-107, REAL-108, REAL-114, REAL-159, REAL-161, REAL-182, REAL-198, REAL-202, REAL-278 |
| Œuf cru | 67 | FR-005, EGG-001, MED-001, IT-003, FR-019, GR-001, FR-020, DESS-001, DESS-002, DESS-003, DESS-004, DESS-005, DESS-006, FR-028, DESS-009, DESS-010, DESS-011, FR-029, FR-030, FR-031, FR-033, FR-034, FR-035, FR-036, FR-039, FR-040, REAL-082, REAL-085, REAL-086, REAL-087, REAL-088, REAL-090, REAL-091, REAL-092, REAL-097, REAL-108, REAL-109, REAL-119, REAL-121, REAL-123, REAL-129, REAL-131, REAL-132, REAL-145, REAL-147, REAL-164, REAL-198, REAL-199, REAL-207, REAL-214, REAL-215, REAL-217, REAL-218, REAL-219, REAL-225, REAL-227, REAL-234, REAL-236, REAL-237, REAL-245, REAL-252, REAL-254, REAL-258, REAL-266, REAL-278, REAL-279, REAL-294 |
| Beurre doux | 51 | FR-002, FR-003, FR-004, IT-001, FR-006, FR-011, EGG-001, IT-002, FR-012, FR-013, FR-017, GR-001, FR-021, FR-022, FR-023, DESS-001, DESS-002, DESS-005, DESS-006, DESS-007, FR-024, FR-025, FR-026, FR-027, DESS-009, DESS-010, DESS-011, FR-030, FR-031, FR-032, FR-036, FR-037, FR-040, REAL-076, REAL-081, REAL-082, REAL-086, REAL-088, REAL-090, REAL-093, REAL-094, REAL-109, REAL-131, REAL-132, REAL-178, REAL-184, REAL-212, REAL-279, REAL-297, REAL-300, REAL-301 |
| Farine de blé T55 | 49 | FR-001, FR-002, IT-001, FR-012, FR-016, GR-001, FR-022, DESS-001, DESS-002, DESS-003, DESS-007, FR-024, FR-028, DESS-009, DESS-010, FR-030, FR-031, FR-040, REAL-081, REAL-082, REAL-083, REAL-086, REAL-089, REAL-090, REAL-091, REAL-093, REAL-094, REAL-097, REAL-105, REAL-109, REAL-122, REAL-132, REAL-133, REAL-144, REAL-185, REAL-200, REAL-201, REAL-202, REAL-215, REAL-217, REAL-218, REAL-236, REAL-279, REAL-280, REAL-294, REAL-296, REAL-297, REAL-300, REAL-302 |
| Tomate fraîche mûre | 44 | FR-007, VEG-002, FR-029, FR-035, REAL-079, REAL-085, REAL-092, REAL-114, REAL-115, REAL-127, REAL-130, REAL-131, REAL-133, REAL-137, REAL-138, REAL-151, REAL-152, REAL-156, REAL-157, REAL-162, REAL-163, REAL-167, REAL-173, REAL-176, REAL-177, REAL-179, REAL-180, REAL-184, REAL-190, REAL-198, REAL-209, REAL-260, REAL-264, REAL-266, REAL-268, REAL-270, REAL-271, REAL-272, REAL-273, REAL-277, REAL-279, REAL-282, REAL-287, REAL-295 |
| Gingembre frais | 41 | IND-001, IND-002, REAL-148, REAL-149, REAL-160, REAL-162, REAL-165, REAL-167, REAL-168, REAL-169, REAL-170, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-178, REAL-187, REAL-188, REAL-189, REAL-190, REAL-191, REAL-192, REAL-194, REAL-195, REAL-196, REAL-199, REAL-200, REAL-201, REAL-205, REAL-206, REAL-209, REAL-210, REAL-212, REAL-213, REAL-220, REAL-226, REAL-238, REAL-239, REAL-288, REAL-289 |
| Huile d’olive vierge extra | 41 | REAL-078, REAL-079, REAL-080, REAL-092, REAL-095, REAL-096, REAL-098, REAL-099, REAL-102, REAL-103, REAL-104, REAL-105, REAL-106, REAL-107, REAL-108, REAL-110, REAL-111, REAL-112, REAL-114, REAL-115, REAL-116, REAL-117, REAL-118, REAL-119, REAL-120, REAL-123, REAL-124, REAL-125, REAL-126, REAL-127, REAL-128, REAL-130, REAL-134, REAL-136, REAL-137, REAL-138, REAL-139, REAL-140, REAL-141, REAL-142, REAL-272 |
| Carotte crue | 34 | FR-001, FR-002, FR-004, IT-001, MAG-001, FR-010, VEG-001, VEG-003, IT-004, IT-008, FR-015, FR-016, FR-033, REAL-073, REAL-077, REAL-084, REAL-093, REAL-098, REAL-125, REAL-126, REAL-129, REAL-153, REAL-155, REAL-166, REAL-221, REAL-222, REAL-224, REAL-227, REAL-230, REAL-237, REAL-240, REAL-241, REAL-292, REAL-301 |
| Persil frais | 31 | FR-011, VEG-002, EGG-001, VEG-003, MED-001, LEV-002, IT-002, FR-019, FR-026, FR-027, FR-033, FR-034, FR-037, REAL-081, REAL-085, REAL-093, REAL-102, REAL-116, REAL-119, REAL-123, REAL-125, REAL-126, REAL-130, REAL-133, REAL-139, REAL-142, REAL-144, REAL-147, REAL-153, REAL-279, REAL-294 |
| Tomate concassée en conserve | 30 | IT-001, FR-008, MAG-001, MX-001, IND-001, IND-002, MED-001, IT-004, IT-006, IT-008, FR-019, GR-001, REAL-073, REAL-093, REAL-095, REAL-097, REAL-098, REAL-106, REAL-121, REAL-125, REAL-126, REAL-144, REAL-165, REAL-166, REAL-168, REAL-169, REAL-174, REAL-175, REAL-178, REAL-290 |
| Sucre semoule | 29 | DESS-001, DESS-002, DESS-003, DESS-004, DESS-005, DESS-006, DESS-008, DESS-010, DESS-011, FR-030, FR-032, FR-039, DESS-012, FR-040, REAL-089, REAL-090, REAL-091, REAL-106, REAL-122, REAL-130, REAL-192, REAL-195, REAL-196, REAL-198, REAL-216, REAL-222, REAL-223, REAL-225, REAL-244 |
| Huile d'olive vierge extra | 27 | FR-004, IT-001, FR-007, FR-008, FR-009, MAG-001, FR-010, FR-011, VEG-001, VEG-002, VEG-003, MED-001, LEV-001, LEV-002, IT-002, IT-004, IT-005, IT-006, IT-007, FR-014, IT-008, FR-017, FR-019, GR-001, FR-020, FR-028, FR-035 |
| Coriandre fraîche | 25 | LEV-002, REAL-142, REAL-144, REAL-146, REAL-162, REAL-171, REAL-174, REAL-176, REAL-177, REAL-180, REAL-184, REAL-186, REAL-188, REAL-190, REAL-205, REAL-240, REAL-241, REAL-251, REAL-261, REAL-265, REAL-273, REAL-274, REAL-277, REAL-282, REAL-286 |
| Jus de citron frais | 25 | VEG-002, VEG-003, IND-001, IND-002, LEV-001, FR-021, DESS-007, REAL-080, REAL-096, REAL-124, REAL-127, REAL-128, REAL-129, REAL-130, REAL-133, REAL-137, REAL-138, REAL-139, REAL-148, REAL-154, REAL-170, REAL-184, REAL-188, REAL-189, REAL-299 |
| Pomme de terre crue, épluchée | 24 | FR-004, FR-006, FR-013, FR-014, FR-025, FR-037, REAL-076, REAL-077, REAL-080, REAL-108, REAL-120, REAL-128, REAL-165, REAL-176, REAL-181, REAL-184, REAL-221, REAL-222, REAL-233, REAL-247, REAL-289, REAL-295, REAL-301, REAL-302 |
| Ciboule fraîche | 23 | REAL-191, REAL-192, REAL-193, REAL-194, REAL-196, REAL-198, REAL-201, REAL-202, REAL-205, REAL-206, REAL-211, REAL-213, REAL-214, REAL-218, REAL-226, REAL-228, REAL-229, REAL-231, REAL-232, REAL-234, REAL-235, REAL-288, REAL-289 |
| Poivre noir moulu | 23 | FR-001, FR-003, FR-004, IT-001, FR-005, FR-006, FR-007, FR-009, FR-010, FR-011, VEG-002, EGG-001, FR-012, FR-013, FR-017, FR-018, FR-021, FR-028, FR-036, REAL-075, REAL-094, REAL-244, REAL-297 |
| Cumin moulu | 18 | MX-001, VEG-002, VEG-003, IND-001, MED-001, LEV-001, LEV-002, REAL-136, REAL-140, REAL-169, REAL-170, REAL-186, REAL-268, REAL-280, REAL-281, REAL-285, REAL-287, REAL-290 |
| Lait entier | 17 | FR-006, GR-001, DESS-006, DESS-008, FR-025, FR-030, FR-037, REAL-080, REAL-082, REAL-090, REAL-091, REAL-109, REAL-122, REAL-164, REAL-171, REAL-278, REAL-301 |
| Sauce soja légère | 17 | REAL-192, REAL-193, REAL-194, REAL-195, REAL-196, REAL-199, REAL-200, REAL-201, REAL-203, REAL-204, REAL-207, REAL-208, REAL-209, REAL-210, REAL-241, REAL-258, REAL-282 |
| Crème fraîche liquide entière | 16 | FR-005, FR-006, FR-013, FR-014, FR-020, DESS-006, FR-029, FR-030, FR-036, FR-039, DESS-012, REAL-082, REAL-168, REAL-169, REAL-173, REAL-178 |
| Feuille de laurier séchée | 16 | FR-003, FR-007, VEG-001, REAL-074, REAL-113, REAL-125, REAL-152, REAL-154, REAL-164, REAL-167, REAL-259, REAL-262, REAL-276, REAL-292, REAL-298, REAL-299 |
| Poivron rouge frais | 15 | FR-007, FR-008, MX-001, VEG-003, MED-001, REAL-078, REAL-092, REAL-133, REAL-140, REAL-152, REAL-158, REAL-166, REAL-277, REAL-287, REAL-290 |
| Huile de friture | 14 | REAL-097, REAL-109, REAL-147, REAL-159, REAL-160, REAL-183, REAL-185, REAL-186, REAL-215, REAL-219, REAL-220, REAL-279, REAL-291, REAL-302 |
| Piment frais | 14 | REAL-121, REAL-153, REAL-154, REAL-155, REAL-157, REAL-158, REAL-159, REAL-166, REAL-167, REAL-241, REAL-248, REAL-249, REAL-254, REAL-256 |
| Porc haché cru | 14 | IT-001, REAL-085, REAL-193, REAL-196, REAL-197, REAL-200, REAL-201, REAL-206, REAL-212, REAL-226, REAL-234, REAL-240, REAL-251, REAL-252 |
| Échalote crue | 14 | FR-009, IT-002, FR-018, FR-033, FR-037, FR-038, REAL-086, REAL-087, REAL-240, REAL-244, REAL-251, REAL-253, REAL-254, REAL-255 |
| Huile végétale | 13 | REAL-195, REAL-197, REAL-198, REAL-202, REAL-205, REAL-225, REAL-226, REAL-236, REAL-265, REAL-266, REAL-278, REAL-284, REAL-285 |
| Muscade moulue | 13 | FR-004, IT-001, FR-005, FR-006, FR-014, FR-020, FR-022, FR-024, FR-025, FR-031, FR-036, REAL-088, REAL-160 |
| Oignon rouge cru | 13 | VEG-002, VEG-003, FR-035, REAL-148, REAL-149, REAL-150, REAL-151, REAL-156, REAL-162, REAL-163, REAL-263, REAL-273, REAL-282 |
| Sauce poisson | 13 | REAL-239, REAL-240, REAL-243, REAL-244, REAL-245, REAL-246, REAL-247, REAL-248, REAL-249, REAL-250, REAL-251, REAL-252, REAL-260 |
| Bouillon de volaille | 12 | REAL-191, REAL-199, REAL-207, REAL-221, REAL-249, REAL-253, REAL-264, REAL-269, REAL-271, REAL-279, REAL-291, REAL-296 |
| Huile de colza raffinée | 12 | FR-001, MX-001, IND-001, IND-002, FR-016, FR-018, DESS-003, FR-027, FR-033, FR-034, FR-038, REAL-087 |
| Huile de sésame grillé | 12 | REAL-200, REAL-203, REAL-206, REAL-210, REAL-226, REAL-227, REAL-228, REAL-229, REAL-230, REAL-234, REAL-235, REAL-237 |
| Moutarde de Dijon | 12 | FR-003, FR-009, FR-018, FR-021, FR-023, FR-029, FR-033, FR-034, FR-038, REAL-087, REAL-154, REAL-300 |
| Vin blanc sec | 12 | FR-008, FR-009, IT-002, FR-012, FR-018, FR-038, REAL-075, REAL-093, REAL-094, REAL-096, REAL-101, REAL-290 |
| Aubergine fraîche | 11 | FR-007, GR-001, REAL-103, REAL-105, REAL-106, REAL-130, REAL-135, REAL-139, REAL-177, REAL-179, REAL-260 |
| Céleri branche cru | 11 | IT-001, VEG-001, IT-004, IT-008, FR-015, REAL-093, REAL-098, REAL-106, REAL-125, REAL-126, REAL-144 |
| Garam masala | 11 | IND-002, REAL-168, REAL-169, REAL-170, REAL-171, REAL-173, REAL-175, REAL-176, REAL-178, REAL-185, REAL-190 |
| Œuf dur | 11 | REAL-115, REAL-148, REAL-158, REAL-208, REAL-231, REAL-244, REAL-256, REAL-257, REAL-280, REAL-283, REAL-284 |
| Chou blanc frais | 10 | REAL-153, REAL-155, REAL-166, REAL-217, REAL-224, REAL-226, REAL-235, REAL-267, REAL-270, REAL-298 |
| Cumin en graines | 10 | IND-002, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-180, REAL-185, REAL-187, REAL-190 |
| Eau | 10 | IT-007, FR-031, REAL-089, REAL-107, REAL-132, REAL-133, REAL-163, REAL-200, REAL-275, REAL-286 |
| Jus de citron vert frais | 10 | REAL-248, REAL-249, REAL-250, REAL-251, REAL-273, REAL-274, REAL-277, REAL-284, REAL-286, REAL-288 |
| Lait de coco | 10 | IND-001, IND-002, REAL-246, REAL-247, REAL-249, REAL-253, REAL-255, REAL-257, REAL-277, REAL-289 |
| Lait demi-écrémé | 10 | FR-004, IT-001, FR-005, FR-019, FR-022, DESS-001, DESS-002, FR-024, FR-028, REAL-085 |
| Poireau cru | 10 | FR-002, FR-010, IT-008, FR-015, FR-021, FR-034, FR-036, REAL-077, REAL-079, REAL-088 |
| Safran | 10 | REAL-079, REAL-097, REAL-110, REAL-112, REAL-113, REAL-142, REAL-143, REAL-145, REAL-146, REAL-171 |
| Sauce soja japonaise | 10 | REAL-211, REAL-214, REAL-215, REAL-216, REAL-219, REAL-220, REAL-222, REAL-223, REAL-225, REAL-226 |
| Champignon de Paris frais | 9 | FR-001, FR-002, FR-009, IT-002, FR-013, FR-016, REAL-086, REAL-095, REAL-300 |
| Citron jaune frais | 9 | FR-002, FR-010, FR-011, FR-017, DESS-011, REAL-081, REAL-147, REAL-220, REAL-294 |
| Dashi | 9 | REAL-211, REAL-214, REAL-215, REAL-216, REAL-217, REAL-218, REAL-219, REAL-222, REAL-225 |
| Parmesan affiné | 9 | IT-001, IT-002, IT-004, IT-005, IT-008, FR-019, GR-001, REAL-105, REAL-283 |
| Vin rouge sec | 9 | FR-001, IT-001, IT-004, FR-016, GR-001, REAL-095, REAL-292, REAL-293, REAL-298 |
| Vinaigre de vin rouge | 9 | VEG-001, FR-033, FR-034, FR-035, REAL-087, REAL-106, REAL-282, REAL-285, REAL-292 |
| Bouillon de légumes non salé | 8 | IT-002, FR-013, FR-014, IT-008, REAL-096, REAL-099, REAL-120, REAL-150 |
| Bouquet garni frais | 8 | FR-001, FR-002, FR-015, FR-016, REAL-073, REAL-077, REAL-083, REAL-084 |
| Cannelle en bâton | 8 | REAL-143, REAL-171, REAL-172, REAL-187, REAL-247, REAL-262, REAL-264, REAL-268 |
| Cannelle moulue | 8 | GR-001, DESS-007, DESS-009, FR-039, REAL-135, REAL-141, REAL-144, REAL-145 |
| Chapelure de blé | 8 | FR-004, FR-019, FR-037, REAL-073, REAL-097, REAL-109, REAL-140, REAL-279 |
| Courgette fraîche | 8 | FR-007, MAG-001, FR-010, VEG-003, IT-008, FR-020, REAL-227, REAL-233 |
| Crevette crue décortiquée | 8 | REAL-116, REAL-206, REAL-236, REAL-245, REAL-254, REAL-257, REAL-258, REAL-277 |
| Crème fraîche épaisse | 8 | FR-002, FR-009, FR-018, FR-021, FR-038, REAL-075, REAL-076, REAL-088 |
| Huile végétale raffinée | 8 | REAL-152, REAL-158, REAL-162, REAL-163, REAL-166, REAL-174, REAL-179, REAL-181 |
| Mirin | 8 | REAL-214, REAL-215, REAL-216, REAL-219, REAL-222, REAL-223, REAL-225, REAL-229 |
| Thym frais | 8 | FR-007, FR-008, FR-013, FR-017, FR-018, FR-038, REAL-288, REAL-289 |
| Basilic frais | 7 | IT-005, IT-006, IT-007, IT-008, REAL-099, REAL-103, REAL-105 |
| Bœuf haché cru 15 % MG | 7 | IT-001, MX-001, IT-004, FR-019, REAL-097, REAL-132, REAL-164 |
| Bœuf à braiser cru | 7 | REAL-155, REAL-157, REAL-189, REAL-247, REAL-255, REAL-287, REAL-298 |
| Clou de girofle | 7 | FR-015, REAL-084, REAL-187, REAL-239, REAL-264, REAL-268, REAL-292 |
| Comté | 7 | FR-012, FR-020, FR-022, FR-023, FR-028, FR-029, FR-031 |
| Cuisse de poulet crue, avec os, avec peau | 7 | FR-008, MAG-001, FR-016, REAL-095, REAL-134, REAL-259, REAL-296 |
| Curcuma moulu | 7 | IND-001, IND-002, REAL-142, REAL-164, REAL-176, REAL-181, REAL-183 |
| Fécule de maïs | 7 | DESS-006, DESS-011, REAL-191, REAL-192, REAL-196, REAL-199, REAL-207 |
| Ghee | 7 | REAL-171, REAL-172, REAL-173, REAL-175, REAL-185, REAL-188, REAL-189 |
| Haut de cuisse de poulet cru désossé | 7 | REAL-192, REAL-210, REAL-214, REAL-220, REAL-235, REAL-246, REAL-249 |
| Lardon fumé cru | 7 | FR-001, FR-005, FR-016, FR-036, REAL-075, REAL-086, REAL-087 |
| Levure chimique | 7 | DESS-002, DESS-003, FR-028, DESS-009, FR-040, REAL-269, REAL-302 |
| Menthe fraîche | 7 | REAL-124, REAL-137, REAL-138, REAL-171, REAL-240, REAL-242, REAL-251 |
| Oignon blanc cru | 7 | REAL-261, REAL-262, REAL-265, REAL-266, REAL-267, REAL-271, REAL-272 |
| Piment vert frais | 7 | REAL-151, REAL-177, REAL-183, REAL-185, REAL-188, REAL-233, REAL-260 |
| Poivron vert frais | 7 | FR-008, REAL-114, REAL-162, REAL-184, REAL-290, REAL-295, REAL-296 |
| Pomme de terre cuite | 7 | REAL-147, REAL-183, REAL-185, REAL-256, REAL-283, REAL-285, REAL-297 |
| Sucre brun | 7 | REAL-228, REAL-229, REAL-230, REAL-231, REAL-259, REAL-288, REAL-292 |
| Sucre de palme | 7 | REAL-240, REAL-245, REAL-246, REAL-247, REAL-250, REAL-252, REAL-256 |
| Vin Shaoxing | 7 | REAL-192, REAL-194, REAL-199, REAL-201, REAL-204, REAL-208, REAL-209 |
| Yaourt nature | 7 | DESS-003, REAL-136, REAL-168, REAL-169, REAL-170, REAL-171, REAL-172 |
| Aneth frais | 6 | FR-010, REAL-123, REAL-124, REAL-126, REAL-129, REAL-300 |
| Cacahuète grillée | 6 | REAL-192, REAL-193, REAL-242, REAL-245, REAL-247, REAL-250 |
| Concombre frais | 6 | VEG-002, REAL-114, REAL-137, REAL-241, REAL-254, REAL-273 |
| Cuisse de poulet crue, avec os, sans peau | 6 | REAL-142, REAL-145, REAL-146, REAL-148, REAL-154, REAL-170 |
| Gingembre moulu | 6 | REAL-142, REAL-143, REAL-144, REAL-145, REAL-156, REAL-172 |
| Olive verte dénoyautée | 6 | FR-028, REAL-106, REAL-142, REAL-272, REAL-280, REAL-290 |
| Pain de campagne | 6 | FR-012, REAL-079, REAL-080, REAL-086, REAL-087, REAL-116 |
| Petit pois surgelé | 6 | REAL-097, REAL-184, REAL-185, REAL-190, REAL-301, REAL-302 |
| Piment du Cachemire moulu | 6 | REAL-168, REAL-170, REAL-172, REAL-175, REAL-178, REAL-190 |
| Pois chiche cuit, égoutté | 6 | MAG-001, VEG-002, IND-001, LEV-001, REAL-144, REAL-174 |
| Pomme de terre crue, avec peau | 6 | FR-017, FR-027, FR-035, REAL-074, REAL-075, REAL-118 |
| Pousse de soja fraîche | 6 | REAL-212, REAL-227, REAL-239, REAL-245, REAL-257, REAL-258 |
| Pâte brisée crue | 6 | FR-005, DESS-006, FR-029, FR-036, FR-039, REAL-088 |
| Saindoux | 6 | REAL-258, REAL-262, REAL-269, REAL-280, REAL-295, REAL-296 |
| Tamarin en pâte | 6 | REAL-179, REAL-180, REAL-245, REAL-247, REAL-255, REAL-256 |
| Tomate concentrée | 6 | REAL-083, REAL-149, REAL-150, REAL-152, REAL-153, REAL-155 |
| Tomate entière pelée en conserve | 6 | IT-007, REAL-099, REAL-101, REAL-102, REAL-103, REAL-105 |
| Épaule de porc crue | 6 | REAL-187, REAL-221, REAL-262, REAL-263, REAL-267, REAL-298 |
| Épaule d’agneau crue | 6 | REAL-083, REAL-128, REAL-135, REAL-143, REAL-165, REAL-172 |
| Épinard frais | 6 | IND-001, REAL-123, REAL-173, REAL-227, REAL-230, REAL-237 |
| Agneau haché cru | 5 | GR-001, REAL-133, REAL-141, REAL-190, REAL-301 |
| Avocat frais | 5 | REAL-270, REAL-271, REAL-273, REAL-284, REAL-286 |
| Bouillon de bœuf non salé | 5 | FR-004, MX-001, FR-012, REAL-121, REAL-155 |
| Bouillon de volaille non salé | 5 | FR-002, FR-038, REAL-097, REAL-110, REAL-152 |
| Citron vert frais | 5 | REAL-239, REAL-245, REAL-253, REAL-257, REAL-267 |
| Feuille de curry fraîche | 5 | REAL-165, REAL-179, REAL-180, REAL-181, REAL-183 |
| Origan séché | 5 | MX-001, REAL-127, REAL-128, REAL-285, REAL-290 |
| Paprika doux | 5 | REAL-118, REAL-132, REAL-169, REAL-280, REAL-281 |
| Pignon de pin | 5 | IT-005, REAL-106, REAL-124, REAL-134, REAL-141 |
| Piment séché | 5 | REAL-101, REAL-102, REAL-104, REAL-116, REAL-117 |
| Poitrine de porc crue | 5 | REAL-208, REAL-232, REAL-238, REAL-244, REAL-281 |
| Poulet cuit effiloché | 5 | REAL-254, REAL-265, REAL-269, REAL-279, REAL-286 |
| Riz long blanc cru | 5 | FR-011, REAL-085, REAL-136, REAL-161, REAL-287 |
| Sauce soja coréenne | 5 | REAL-228, REAL-229, REAL-230, REAL-235, REAL-236 |
| Tofu ferme | 5 | REAL-207, REAL-223, REAL-232, REAL-233, REAL-245 |
| Beurre clarifié | 4 | REAL-145, REAL-146, REAL-293, REAL-294 |
| Beurre clarifié épicé niter kibbeh | 4 | REAL-148, REAL-149, REAL-150, REAL-151 |
| Bouillon de bœuf | 4 | REAL-268, REAL-293, REAL-295, REAL-300 |
| Chou chinois frais | 4 | REAL-199, REAL-206, REAL-209, REAL-223 |
| Citronnelle fraîche | 4 | REAL-243, REAL-248, REAL-249, REAL-255 |
| Crème mexicaine | 4 | REAL-265, REAL-266, REAL-271, REAL-274 |
| Curry en poudre | 4 | IND-001, REAL-152, REAL-164, REAL-166 |
| Câpre au vinaigre, égouttée | 4 | REAL-096, REAL-102, REAL-106, REAL-147 |
| Doubanjiang | 4 | REAL-191, REAL-195, REAL-196, REAL-209 |
| Feuille de combava | 4 | REAL-246, REAL-248, REAL-249, REAL-255 |
| Gochugaru | 4 | REAL-231, REAL-232, REAL-234, REAL-235 |
| Gochujang | 4 | REAL-227, REAL-231, REAL-232, REAL-235 |
| Gousse de vanille | 4 | DESS-006, DESS-008, DESS-012, REAL-090 |
| Graine de moutarde | 4 | REAL-179, REAL-180, REAL-181, REAL-183 |
| Haricot vert cru | 4 | FR-011, FR-026, FR-035, REAL-197 |
| Jambon blanc cuit | 4 | FR-022, FR-023, FR-028, REAL-121 |
| Jaune d'œuf cru | 4 | FR-002, IT-003, DESS-006, DESS-011 |
| Mayonnaise | 4 | REAL-241, REAL-274, REAL-284, REAL-286 |
| Mozzarella | 4 | IT-006, IT-007, REAL-097, REAL-105 |
| Oignon grelot cru | 4 | FR-001, FR-016, REAL-083, REAL-086 |
| Paleron de bœuf cru | 4 | REAL-239, REAL-268, REAL-292, REAL-295 |
| Paprika fumé | 4 | MX-001, MED-001, REAL-118, REAL-156 |
| Piment ancho séché | 4 | REAL-261, REAL-264, REAL-267, REAL-268 |
| Piment de la Jamaïque moulu | 4 | REAL-134, REAL-135, REAL-141, REAL-289 |
| Piment guajillo séché | 4 | REAL-261, REAL-266, REAL-267, REAL-268 |
| Poivre blanc moulu | 4 | FR-002, FR-024, REAL-200, REAL-207 |
| Poivre du Sichuan | 4 | REAL-191, REAL-192, REAL-193, REAL-197 |
| Poivre noir en grains | 4 | IT-003, REAL-100, REAL-180, REAL-259 |
| Pomme fraîche | 4 | DESS-007, FR-032, FR-039, REAL-299 |
| Raisin sec | 4 | REAL-124, REAL-164, REAL-264, REAL-280 |
| Riz japonais cru | 4 | REAL-214, REAL-215, REAL-216, REAL-221 |
| Romarin frais | 4 | REAL-095, REAL-098, REAL-110, REAL-151 |
| Sauce soja foncée | 4 | REAL-194, REAL-203, REAL-208, REAL-258 |
| Shiitaké frais | 4 | REAL-223, REAL-227, REAL-230, REAL-233 |
| Sucre candi | 4 | REAL-194, REAL-208, REAL-210, REAL-239 |
| Sésame grillé | 4 | REAL-227, REAL-228, REAL-230, REAL-237 |
| Thym séché | 4 | FR-003, VEG-001, FR-012, REAL-152 |
| Tortilla de maïs | 4 | REAL-261, REAL-262, REAL-265, REAL-271 |
| Vanille liquide | 4 | DESS-003, FR-030, FR-032, FR-039 |
| Vinaigre noir chinois | 4 | REAL-192, REAL-193, REAL-196, REAL-207 |
| Anchois à l’huile, égoutté | 3 | REAL-096, REAL-102, REAL-104 |
| Anis étoilé | 3 | REAL-194, REAL-209, REAL-239 |
| Baie de genièvre | 3 | REAL-074, REAL-292, REAL-298 |
| Basilic thaï frais | 3 | REAL-210, REAL-239, REAL-246 |
| Berbéré | 3 | REAL-148, REAL-149, REAL-150 |
| Bicarbonate de sodium alimentaire | 3 | LEV-002, DESS-009, REAL-161 |
| Bouillon d’anchois | 3 | REAL-232, REAL-233, REAL-234 |
| Bœuf cru finement tranché | 3 | REAL-222, REAL-227, REAL-230 |
| Calamar cru nettoyé | 3 | REAL-111, REAL-112, REAL-236 |
| Cassonade | 3 | FR-003, DESS-007, DESS-009 |
| Chou-fleur frais | 3 | REAL-135, REAL-176, REAL-184 |
| Ciboulette chinoise fraîche | 3 | REAL-200, REAL-245, REAL-258 |
| Eau chaude | 3 | REAL-201, REAL-202, REAL-297 |
| Fenugrec en graines | 3 | REAL-146, REAL-181, REAL-182 |
| Fromage frais mexicain | 3 | REAL-265, REAL-266, REAL-271 |
| Galanga frais | 3 | REAL-248, REAL-249, REAL-255 |
| Haricot cornille sec | 3 | REAL-158, REAL-159, REAL-161 |
| Huile d’arachide | 3 | REAL-153, REAL-154, REAL-156 |
| Huile pimentée | 3 | REAL-191, REAL-193, REAL-253 |
| Jambon de Bayonne | 3 | FR-008, REAL-078, REAL-092 |
| Lentille brune sèche, crue | 3 | REAL-136, REAL-144, REAL-146 |
| Lentille verte sèche, crue | 3 | VEG-001, FR-033, REAL-084 |
| Levure boulangère sèche | 3 | IT-007, REAL-107, REAL-133 |
| Miel | 3 | FR-040, REAL-143, REAL-204 |
| Morue salée sèche | 3 | REAL-080, REAL-117, REAL-119 |
| Oignon nouveau frais | 3 | REAL-123, REAL-138, REAL-286 |
| Olive noire dénoyautée | 3 | FR-035, REAL-095, REAL-102 |
| Origan mexicain séché | 3 | REAL-263, REAL-267, REAL-272 |
| Pain rassis | 3 | REAL-085, REAL-114, REAL-264 |
| Paleron de bœuf cru, paré | 3 | FR-001, FR-003, FR-015 |
| Pecorino romano | 3 | IT-003, REAL-100, REAL-101 |
| Pied de porc cru | 3 | REAL-213, REAL-243, REAL-281 |
| Piment rouge séché | 3 | REAL-187, REAL-192, REAL-197 |
| Piment scotch bonnet | 3 | REAL-152, REAL-288, REAL-289 |
| Poitrine de porc crue fine | 3 | REAL-217, REAL-224, REAL-240 |
| Poitrine de porc fumée | 3 | REAL-074, REAL-276, REAL-293 |
| Poulet entier cru en morceaux | 3 | REAL-167, REAL-264, REAL-288 |
| Pruneau dénoyauté | 3 | REAL-091, REAL-143, REAL-298 |
| Rhum ambré | 3 | DESS-001, REAL-090, REAL-091 |
| Riz jasmin cru | 3 | REAL-203, REAL-208, REAL-252 |
| Spaghetti secs | 3 | IT-003, IT-004, REAL-102 |
| Thon au naturel en conserve, égoutté | 3 | FR-029, FR-035, REAL-147 |
| Tomate râpée | 3 | REAL-110, REAL-111, REAL-112 |
| Vinaigre blanc | 3 | REAL-261, REAL-263, REAL-268 |
| Vinaigre de riz | 3 | REAL-236, REAL-240, REAL-241 |
| Zeste de citron | 3 | FR-040, REAL-093, REAL-122 |
| Achiote pâte | 2 | REAL-261, REAL-263 |
| Amande mondée | 2 | REAL-143, REAL-145 |
| Amchur poudre de mangue | 2 | REAL-174, REAL-185 |
| Aonori | 2 | REAL-217, REAL-224 |
| Aubergine africaine fraîche | 2 | REAL-153, REAL-167 |
| Aïoli | 2 | REAL-111, REAL-112 |
| Banane plantain mûre | 2 | REAL-160, REAL-287 |
| Beurre demi-sel | 2 | REAL-089, REAL-091 |
| Bouillon de crevette | 2 | REAL-248, REAL-257 |
| Bouillon de veau non salé | 2 | REAL-078, REAL-093 |
| Bouillon d’agneau non salé | 2 | REAL-083, REAL-135 |
| Boulgour fin cru | 2 | REAL-138, REAL-141 |
| Cannelle cassia | 2 | REAL-194, REAL-239 |
| Cardamome verte | 2 | REAL-171, REAL-247 |
| Carvi en graines | 2 | REAL-074, REAL-295 |
| Champignon de paille | 2 | REAL-248, REAL-249 |
| Champignon séché | 2 | REAL-298, REAL-299 |
| Chashu de porc | 2 | REAL-211, REAL-213 |
| Chocolat noir 70 % | 2 | DESS-005, DESS-010 |
| Chou kale frais | 2 | REAL-163, REAL-276 |
| Choucroute crue fermentée | 2 | REAL-074, REAL-298 |
| Cinq épices chinoises | 2 | REAL-204, REAL-208 |
| Concentré de tomate | 2 | REAL-082, REAL-301 |
| Confit de canard cuit | 2 | REAL-073, REAL-077 |
| Coriandre en graines | 2 | REAL-185, REAL-187 |
| Coriandre moulue | 2 | LEV-002, REAL-170 |
| Courge fraîche | 2 | REAL-179, REAL-281 |
| Crevette crue entière | 2 | REAL-112, REAL-248 |
| Crème aigre | 2 | REAL-296, REAL-300 |
| Doenjang pâte de soja fermentée | 2 | REAL-233, REAL-238 |
| Douchi haricot noir fermenté | 2 | REAL-191, REAL-195 |
| Eau glacée | 2 | LEV-001, REAL-236 |
| Escalope de veau crue fine | 2 | REAL-094, REAL-294 |
| Farine de pois chiche | 2 | REAL-183, REAL-186 |
| Feta | 2 | REAL-123, REAL-128 |
| Feuille de brick | 2 | REAL-145, REAL-147 |
| Fumet de poisson | 2 | REAL-111, REAL-112 |
| Gingembre mariné rouge | 2 | REAL-218, REAL-224 |
| Guanciale cru | 2 | IT-003, REAL-101 |
| Gâteau de riz coréen tteok | 2 | REAL-231, REAL-235 |
| Haricot blanc cuit, égoutté | 2 | IT-008, REAL-166 |
| Haricot blanc sec | 2 | REAL-125, REAL-281 |
| Haricot kilomètre cru | 2 | REAL-250, REAL-260 |
| Haricot noir sec | 2 | REAL-276, REAL-287 |
| Haricot rouge sec | 2 | REAL-175, REAL-178 |
| Harissa | 2 | MAG-001, REAL-147 |
| Huile de moutarde | 2 | REAL-170, REAL-177 |
| Huile de noix | 2 | FR-033, REAL-087 |
| Jambon serrano | 2 | REAL-109, REAL-115 |
| Jarret de bœuf cru | 2 | REAL-209, REAL-243 |
| Jarret de bœuf cru avec os | 2 | REAL-188, REAL-268 |
| Jaune d’œuf cru | 2 | REAL-090, REAL-122 |
| Katsuobushi | 2 | REAL-217, REAL-218 |
| Laitue fraîche | 2 | REAL-242, REAL-251 |
| Lentille corail sèche, crue | 2 | IND-002, REAL-149 |
| Lentille urad blanche sèche | 2 | REAL-181, REAL-182 |
| Mayonnaise japonaise | 2 | REAL-217, REAL-218 |
| Mélasse de grenade | 2 | REAL-137, REAL-140 |
| Navet cru | 2 | MAG-001, FR-015 |
| Noix | 2 | REAL-140, REAL-283 |
| Nouille de blé chinoise sèche | 2 | REAL-193, REAL-209 |
| Nouille de riz plate sèche | 2 | REAL-239, REAL-245 |
| Nouille ramen fraîche | 2 | REAL-211, REAL-212 |
| Oignon frit | 2 | REAL-171, REAL-189 |
| Olive noire | 2 | REAL-283, REAL-284 |
| Orange fraîche | 2 | REAL-262, REAL-276 |
| Pain blanc rassis | 2 | REAL-115, REAL-283 |
| Pain de mie | 2 | FR-023, REAL-164 |
| Pain pav | 2 | REAL-183, REAL-184 |
| Pain pita | 2 | REAL-127, REAL-137 |
| Pain toscan rassis | 2 | REAL-098, REAL-099 |
| Papaye verte | 2 | REAL-240, REAL-250 |
| Paprika doux hongrois | 2 | REAL-295, REAL-296 |
| Patate douce crue, épluchée | 2 | REAL-155, REAL-235 |
| Persil plat frais | 2 | REAL-137, REAL-138 |
| Piment de Cayenne | 2 | REAL-156, REAL-160 |
| Piment de la Jamaïque en grains | 2 | REAL-288, REAL-299 |
| Piment doux vert frais | 2 | REAL-078, REAL-092 |
| Piment d’Espelette moulu | 2 | REAL-078, REAL-092 |
| Piment en poudre | 2 | MX-001, MED-001 |
| Piment oiseau frais | 2 | REAL-250, REAL-252 |
| Piment pasilla séché | 2 | REAL-264, REAL-271 |
| Piment rouge frais | 2 | REAL-210, REAL-255 |
| Piment serrano | 2 | REAL-265, REAL-273 |
| Poire asiatique fraîche | 2 | REAL-228, REAL-229 |
| Poisson fumé | 2 | REAL-157, REAL-158 |
| Poitrine de porc crue avec couenne | 2 | REAL-194, REAL-195 |
| Poulet entier cru | 2 | REAL-129, REAL-283 |
| Pousse de bambou | 2 | REAL-207, REAL-246 |
| Pul biber | 2 | REAL-131, REAL-133 |
| Pâte d’arachide pure | 2 | REAL-155, REAL-256 |
| Radis daikon cru | 2 | REAL-241, REAL-260 |
| Radis frais | 2 | REAL-137, REAL-267 |
| Riz arborio cru | 2 | IT-002, REAL-097 |
| Riz basmati cru | 2 | REAL-135, REAL-171 |
| Riz bomba cru | 2 | REAL-110, REAL-111 |
| Riz rond coréen cru | 2 | REAL-227, REAL-237 |
| Riz rond cru | 2 | REAL-124, REAL-129 |
| Salsa verde | 2 | REAL-262, REAL-269 |
| Sauce hoisin | 2 | REAL-204, REAL-242 |
| Saucisse chinoise lap cheong | 2 | REAL-203, REAL-258 |
| Shiitaké séché | 2 | REAL-203, REAL-207 |
| Shirataki rincé | 2 | REAL-222, REAL-223 |
| Sumac moulu | 2 | REAL-134, REAL-137 |
| Sésame | 2 | REAL-143, REAL-264 |
| Tahini | 2 | LEV-001, REAL-139 |
| Tomatillo frais | 2 | REAL-264, REAL-265 |
| Vinaigre de xérès | 2 | REAL-114, REAL-115 |
| Ya cai légumes de moutarde conservés | 2 | REAL-193, REAL-197 |
| Écrevisse séchée moulue | 2 | REAL-157, REAL-158 |
| Œuf mariné ajitama | 2 | REAL-211, REAL-213 |
| Agneau cru en petits dés | 1 | REAL-144 |
| Ail cru entier | 1 | REAL-210 |
| Ail cru tranché | 1 | REAL-238 |
| Ajwain graines | 1 | REAL-186 |
| Algue gim nori | 1 | REAL-237 |
| Amande | 1 | REAL-264 |
| Amande effilée | 1 | REAL-164 |
| Amande grillée | 1 | REAL-135 |
| Ananas frais | 1 | REAL-261 |
| Anchois à l'huile, égoutté | 1 | FR-035 |
| Arachide grillée | 1 | REAL-160 |
| Arachide grillée moulue | 1 | REAL-156 |
| Asafoetida | 1 | REAL-179 |
| Aubergine chinoise fraîche | 1 | REAL-196 |
| Aubergine japonaise fraîche | 1 | REAL-219 |
| Aubergine thaï fraîche | 1 | REAL-246 |
| Awaze | 1 | REAL-151 |
| Baguette vietnamienne | 1 | REAL-241 |
| Banane mûre | 1 | DESS-009 |
| Banane plantain verte | 1 | REAL-291 |
| Bar entier cru vidé | 1 | REAL-205 |
| Basilic sacré frais | 1 | REAL-252 |
| Betterave crue | 1 | REAL-299 |
| Beurre clarifié ghee | 1 | REAL-168 |
| Biscuit cuillère | 1 | DESS-004 |
| Bière blonde | 1 | REAL-121 |
| Bière blonde froide | 1 | REAL-302 |
| Bière brune belge | 1 | FR-003 |
| Blanc d'œuf cru | 1 | DESS-011 |
| Blanc de poulet cru, sans peau | 1 | REAL-169 |
| Blé concassé | 1 | REAL-189 |
| Bouillon de légumes | 1 | REAL-299 |
| Bouillon de porc et poulet | 1 | REAL-212 |
| Bouillon de poulet | 1 | REAL-211 |
| Bouillon de volaille clair | 1 | REAL-206 |
| Bouillon d’agneau | 1 | REAL-301 |
| Bouillon d’anchois et algue | 1 | REAL-231 |
| Bucatini secs | 1 | REAL-101 |
| Bâton de cannelle | 1 | REAL-122 |
| Béchamel préparée | 1 | FR-023 |
| Bœuf cru très finement tranché | 1 | REAL-216 |
| Bœuf cuit effiloché | 1 | FR-004 |
| Bœuf haché au couteau | 1 | REAL-280 |
| Bœuf haché cru | 1 | REAL-191 |
| Bœuf mariné bulgogi cuit | 1 | REAL-237 |
| Bœuf persillé cru très fin | 1 | REAL-223 |
| Bœuf à braiser cru, en petits cubes | 1 | REAL-162 |
| Bœuf à griller cru, en cubes | 1 | REAL-151 |
| Bœuf à griller cru, en fines lamelles | 1 | REAL-156 |
| Cacao non sucré | 1 | DESS-004 |
| Café expresso refroidi | 1 | DESS-004 |
| Café moulu | 1 | REAL-238 |
| Cardamome noire | 1 | REAL-172 |
| Carotte nouvelle crue | 1 | REAL-083 |
| Cerise fraîche dénoyautée | 1 | FR-030 |
| Chair de brochet crue | 1 | REAL-082 |
| Champignon shiitaké frais | 1 | REAL-228 |
| Chana masala | 1 | REAL-174 |
| Chapelure de blé grillée | 1 | REAL-104 |
| Chapelure fine de blé | 1 | REAL-294 |
| Chicharrón de porc | 1 | REAL-291 |
| Chocolat noir mexicain | 1 | REAL-264 |
| Chorizo asturien | 1 | REAL-113 |
| Chorizo criollo | 1 | REAL-281 |
| Chou blanc blanchi | 1 | REAL-256 |
| Chou blanc fermenté curtido | 1 | REAL-275 |
| Chou chinois salé | 1 | REAL-238 |
| Chou kale portugais | 1 | REAL-120 |
| Chou noir kale | 1 | REAL-098 |
| Chou vert frais | 1 | REAL-077 |
| Chou émincé frais | 1 | REAL-243 |
| Chouriço portugais | 1 | REAL-120 |
| Chutney d abricot | 1 | REAL-164 |
| Chutney sec ail cacahuète | 1 | REAL-183 |
| Chutney vert coriandre | 1 | REAL-183 |
| Châtaigne d’eau | 1 | REAL-199 |
| Ciboule fraîche longue | 1 | REAL-236 |
| Ciboule japonaise negi | 1 | REAL-223 |
| Ciboulette asiatique | 1 | REAL-242 |
| Ciboulette fraîche | 1 | EGG-001 |
| Cime di rapa fraîches | 1 | REAL-104 |
| Citron confit au sel | 1 | REAL-142 |
| Clou de girofle moulu | 1 | REAL-160 |
| Cognac | 1 | REAL-082 |
| Confit de canard cuit, effiloché | 1 | FR-037 |
| Congre cru | 1 | REAL-079 |
| Coque fraîche | 1 | REAL-258 |
| Cornichon au vinaigre | 1 | REAL-293 |
| Crabe vert cru | 1 | REAL-079 |
| Crevette crue décortiquée avec queue | 1 | REAL-219 |
| Crevette cuite décortiquée | 1 | REAL-242 |
| Crevette séchée | 1 | REAL-250 |
| Crevette à l’ail cuite | 1 | REAL-291 |
| Cuisse de poulet crue, avec os | 1 | REAL-253 |
| Cuisse de poulet crue, désossée | 1 | REAL-171 |
| Curry de Durban | 1 | REAL-165 |
| Curry jamaïcain en poudre | 1 | REAL-289 |
| Câpre au vinaigre | 1 | REAL-272 |
| Côte de porc désossée crue | 1 | REAL-215 |
| Cœur de bœuf cru | 1 | REAL-285 |
| Dos de cabillaud cru | 1 | FR-011 |
| Eau de coco | 1 | REAL-244 |
| Eau glacée gazeuse | 1 | REAL-219 |
| Encre de seiche | 1 | REAL-111 |
| Endive fraîche | 1 | FR-022 |
| Entrecôte de bœuf crue finement tranchée | 1 | REAL-228 |
| Eomuk gâteau de poisson | 1 | REAL-231 |
| Estragon frais | 1 | FR-009 |
| Faba asturiana sèche | 1 | REAL-113 |
| Farine de blé T65 | 1 | REAL-107 |
| Farine de blé atta | 1 | REAL-188 |
| Farine de blé faible en gluten | 1 | REAL-219 |
| Farine de blé type 00 | 1 | IT-007 |
| Farine de maïs blanche | 1 | REAL-163 |
| Farine de maïs précuite blanche | 1 | REAL-286 |
| Farine de pois chiche grillée | 1 | REAL-150 |
| Farine de riz | 1 | REAL-186 |
| Farofa de manioc | 1 | REAL-276 |
| Fenouil frais | 1 | REAL-079 |
| Fenouil moulu | 1 | REAL-172 |
| Fenugrec séché kasuri methi | 1 | REAL-168 |
| Feuille de bananier | 1 | REAL-263 |
| Feuille de laksa vietnamienne | 1 | REAL-257 |
| Feuille de lasagne sèche | 1 | IT-001 |
| Feuille de maïs sèche | 1 | REAL-269 |
| Feuille de sauge fraîche | 1 | REAL-094 |
| Feuille de sorgho séchée | 1 | REAL-161 |
| Feuille de vigne en saumure | 1 | REAL-124 |
| Fideo court sec | 1 | REAL-112 |
| Filet de bœuf cru en lanières | 1 | REAL-300 |
| Filet de cabillaud cru | 1 | REAL-302 |
| Filet de poisson blanc ferme cru | 1 | REAL-277 |
| Filet de vivaneau cru | 1 | REAL-272 |
| Filet mignon de porc cru | 1 | FR-018 |
| Filet ou faux-filet de bœuf cru en lanières | 1 | REAL-282 |
| Flanchet de bœuf cru | 1 | REAL-290 |
| Fleur de sel | 1 | REAL-118 |
| Frisée fraîche | 1 | REAL-087 |
| Frite de pomme de terre | 1 | REAL-282 |
| Fromage blanc twaróg | 1 | REAL-297 |
| Fromage catupiry | 1 | REAL-279 |
| Fromage cotija | 1 | REAL-274 |
| Fromage flamengo | 1 | REAL-121 |
| Fromage meia-cura râpé | 1 | REAL-278 |
| Fromage quesillo | 1 | REAL-275 |
| Fécule de manioc aigre polvilho azedo | 1 | REAL-278 |
| Fécule de pomme de terre | 1 | REAL-236 |
| Fécule de pomme de terre katakuriko | 1 | REAL-220 |
| Gai lan frais | 1 | REAL-203 |
| Galette de riz | 1 | REAL-242 |
| Garrofó cuit | 1 | REAL-110 |
| Gelée de bouillon de porc | 1 | REAL-201 |
| Gingembre mariné beni shoga | 1 | REAL-216 |
| Gnocchi de pomme de terre frais | 1 | IT-006 |
| Gombo frais | 1 | REAL-179 |
| Graine de melon egusi moulue | 1 | REAL-157 |
| Gélatine feuille | 1 | DESS-012 |
| Haleem masala | 1 | REAL-189 |
| Haricot cannellini sec | 1 | REAL-098 |
| Haricot géant sec | 1 | REAL-126 |
| Haricot lingot sec | 1 | REAL-073 |
| Haricot noir refrit | 1 | REAL-270 |
| Haricot rouge cuit, égoutté | 1 | MX-001 |
| Haricot rouge refrit | 1 | REAL-275 |
| Haricot tarbais sec | 1 | REAL-077 |
| Haricot vert cuit | 1 | REAL-256 |
| Haricot vert plat cru | 1 | REAL-110 |
| Haut de cuisse de poulet cru, désossé | 1 | REAL-168 |
| Haut de cuisse de poulet cru, désossé, sans peau | 1 | FR-009 |
| Herbes de Provence séchées | 1 | FR-029 |
| Herbes vietnamiennes fraîches | 1 | REAL-243 |
| Huile de dendê | 1 | REAL-277 |
| Huile de palme rouge | 1 | REAL-157 |
| Huile pimentée au roucou | 1 | REAL-243 |
| Igname nagaimo râpé | 1 | REAL-217 |
| Jaggery | 1 | REAL-187 |
| Jambon de Bayonne avec os | 1 | REAL-077 |
| Jambon de Parme | 1 | REAL-094 |
| Jarret de bœuf cru, avec os | 1 | FR-015 |
| Jarret de veau cru, en tranches avec os | 1 | REAL-093 |
| Jaune d’œuf cuit | 1 | REAL-096 |
| Jus d orange amère | 1 | REAL-263 |
| Kecap manis | 1 | REAL-254 |
| Kimchi de chou fermenté mûr | 1 | REAL-232 |
| Krupuk crackers | 1 | REAL-256 |
| Lait évaporé | 1 | REAL-283 |
| Laitue romaine fraîche | 1 | REAL-137 |
| Lapin cru en morceaux | 1 | REAL-110 |
| Lapin cru, découpé | 1 | FR-038 |
| Lentille chana dal sèche | 1 | REAL-189 |
| Lentille urad noire entière sèche | 1 | REAL-178 |
| Lentille urad sèche | 1 | REAL-189 |
| Levure boulangère fraîche | 1 | REAL-089 |
| Linguiça portugaise | 1 | REAL-121 |
| Manioc cru, épluché | 1 | REAL-153 |
| Marsala | 1 | DESS-004 |
| Masa harina | 1 | REAL-275 |
| Masa harina pour tamal | 1 | REAL-269 |
| Mascarpone | 1 | DESS-004 |
| Maïs blanc sec hominy | 1 | REAL-281 |
| Maïs choclo cuit | 1 | REAL-285 |
| Maïs doux en grains | 1 | REAL-212 |
| Maïs doux frais en grains | 1 | REAL-274 |
| Maïs pozolero nixtamalisé cuit | 1 | REAL-267 |
| Menma pousse de bambou assaisonnée | 1 | REAL-211 |
| Menthe séchée | 1 | REAL-132 |
| Merguez crue | 1 | MAG-001 |
| Miso blanc | 1 | REAL-212 |
| Miso rouge | 1 | REAL-212 |
| Morcilla asturienne | 1 | REAL-113 |
| Moutarde allemande | 1 | REAL-293 |
| Moutarde verte fermentée | 1 | REAL-253 |
| Msemen cuit | 1 | REAL-146 |
| Mérou cru entier | 1 | REAL-153 |
| Nam prik pao | 1 | REAL-248 |
| Navet nouveau cru | 1 | REAL-083 |
| Nihari masala | 1 | REAL-188 |
| Noix de coco râpée grillée kerisik | 1 | REAL-255 |
| Noix de veau crue | 1 | REAL-096 |
| Nori | 1 | REAL-211 |
| Nouille aux œufs fraîche | 1 | REAL-253 |
| Nouille de patate douce sèche | 1 | REAL-230 |
| Nouille de riz large fraîche | 1 | REAL-258 |
| Nouille de riz épaisse | 1 | REAL-257 |
| Nouille de riz épaisse ronde | 1 | REAL-243 |
| Nouille frite croustillante | 1 | REAL-253 |
| Nouille ramen fine fraîche | 1 | REAL-213 |
| Nouille yakisoba précuite | 1 | REAL-224 |
| Oignon en poudre | 1 | REAL-156 |
| Olive noire entière | 1 | REAL-119 |
| Orecchiette sèches | 1 | REAL-104 |
| Orge perlé cru | 1 | REAL-189 |
| Os de bœuf blanchis | 1 | REAL-239 |
| Os de porc blanchis | 1 | REAL-213 |
| Os à moelle de bœuf | 1 | FR-015 |
| Pain blanc en miche | 1 | REAL-165 |
| Pain d'épices | 1 | FR-003 |
| Pain de mie épais | 1 | REAL-121 |
| Pain d’épices allemand | 1 | REAL-292 |
| Pain taboon | 1 | REAL-134 |
| Palette de porc demi-sel | 1 | REAL-084 |
| Palette de porc fumée | 1 | REAL-074 |
| Palourde fraîche | 1 | REAL-234 |
| Paneer | 1 | REAL-173 |
| Panko | 1 | REAL-215 |
| Paprika fort hongrois | 1 | REAL-295 |
| Patate douce crue | 1 | REAL-219 |
| Pav bhaji masala | 1 | REAL-184 |
| Pavé de saumon cru, sans peau | 1 | FR-010 |
| Petit pois frais écossé | 1 | REAL-083 |
| Petites pâtes sèches | 1 | IT-008 |
| Piment ají amarillo en pâte | 1 | REAL-283 |
| Piment ají amarillo frais | 1 | REAL-282 |
| Piment ancho moulu | 1 | REAL-274 |
| Piment d Alep | 1 | REAL-140 |
| Piment d'Espelette moulu | 1 | FR-008 |
| Piment habanero | 1 | REAL-263 |
| Piment jalapeño frais | 1 | REAL-274 |
| Piment jalapeño mariné | 1 | REAL-272 |
| Piment moulu | 1 | REAL-281 |
| Piment mulato séché | 1 | REAL-264 |
| Piment rouge moulu | 1 | REAL-186 |
| Piment séché moulu | 1 | REAL-251 |
| Piment vert doux frais | 1 | REAL-131 |
| Poireau chinois | 1 | REAL-195 |
| Pois chiche sec, cru | 1 | LEV-002 |
| Pois d arhar toor dal sec | 1 | REAL-179 |
| Poisson blanc très frais sans arêtes | 1 | REAL-273 |
| Poitrine de porc cuite | 1 | REAL-242 |
| Poitrine de porc demi-sel | 1 | REAL-073 |
| Poitrine de porc salée | 1 | REAL-113 |
| Poivron jaune frais | 1 | FR-007 |
| Pomme de terre jaune cuite | 1 | REAL-284 |
| Pomme de terre nouvelle crue | 1 | REAL-083 |
| Pomme de terre paille | 1 | REAL-119 |
| Pomme fraîche râpée | 1 | REAL-221 |
| Porc cru en julienne | 1 | REAL-207 |
| Porc cuit haché chicharrón | 1 | REAL-275 |
| Porc haché cru gras | 1 | REAL-199 |
| Porc rôti vietnamien | 1 | REAL-241 |
| Potimarron frais, épépiné | 1 | FR-014 |
| Poulet cru désossé | 1 | REAL-203 |
| Poulet cru en morceaux | 1 | REAL-110 |
| Poulet entier cru, prêt à cuire | 1 | FR-017 |
| Poulpe cru nettoyé | 1 | REAL-118 |
| Poulpe cuit | 1 | REAL-218 |
| Pousse de soja blanchie | 1 | REAL-256 |
| Pâte d ají amarillo | 1 | REAL-284 |
| Pâte d ají panca | 1 | REAL-285 |
| Pâte de crevette fermentée mắm ruốc | 1 | REAL-243 |
| Pâte de curry khao soi | 1 | REAL-253 |
| Pâte de curry massaman | 1 | REAL-247 |
| Pâte de curry vert | 1 | REAL-246 |
| Pâte de laksa | 1 | REAL-257 |
| Pâte feuilletée crue | 1 | FR-032 |
| Pâte feuilletée inversée | 1 | REAL-122 |
| Pâte filo | 1 | REAL-123 |
| Pâte sablée crue | 1 | DESS-011 |
| Pâte à gyoza | 1 | REAL-226 |
| Pâte à wonton | 1 | REAL-206 |
| Pâtes sèches courtes | 1 | IT-005 |
| Pâté de foie | 1 | REAL-241 |
| Quesillo Oaxaca | 1 | REAL-270 |
| Quinoa cru | 1 | VEG-003 |
| Radis jaune mariné danmuji | 1 | REAL-237 |
| Ras el hanout | 1 | REAL-146 |
| Ras el-hanout | 1 | MAG-001 |
| Rascasse crue entière | 1 | REAL-079 |
| Reblochon au lait cru | 1 | REAL-075 |
| Ricotta salata | 1 | REAL-103 |
| Rigatoni secs | 1 | REAL-103 |
| Riz brisé cru | 1 | REAL-153 |
| Riz cru | 1 | REAL-181 |
| Riz gluant cru grillé moulu | 1 | REAL-251 |
| Riz jasmin cuit froid | 1 | REAL-254 |
| Riz long blanc cuit | 1 | REAL-282 |
| Riz long étuvé cru | 1 | REAL-152 |
| Riz rond blanc cru | 1 | DESS-008 |
| Riz étuvé cru | 1 | REAL-182 |
| Rouget grondin cru | 1 | REAL-079 |
| Rouille | 1 | REAL-079 |
| Roux de curry japonais | 1 | REAL-221 |
| Saewoojeot crevette fermentée | 1 | REAL-238 |
| Saindoux asiento | 1 | REAL-270 |
| Saint-pierre cru | 1 | REAL-079 |
| Saké | 1 | REAL-223 |
| Saké de cuisine | 1 | REAL-220 |
| Salsa roja | 1 | REAL-270 |
| Sambal | 1 | REAL-258 |
| Sambar powder | 1 | REAL-179 |
| Sauce Worcestershire | 1 | REAL-301 |
| Sauce huître | 1 | REAL-252 |
| Sauce okonomiyaki | 1 | REAL-217 |
| Sauce soja | 1 | REAL-288 |
| Sauce soja claire | 1 | REAL-252 |
| Sauce soja légère spéciale poisson | 1 | REAL-205 |
| Sauce soja philippine | 1 | REAL-259 |
| Sauce takoyaki | 1 | REAL-218 |
| Sauce tomate salvadorienne | 1 | REAL-275 |
| Sauce yakisoba | 1 | REAL-224 |
| Saucisse de Montbéliard | 1 | REAL-074 |
| Saucisse de Morteau | 1 | REAL-084 |
| Saucisse de Strasbourg | 1 | REAL-074 |
| Saucisse de Toulouse crue | 1 | REAL-073 |
| Saucisse fumée kielbasa | 1 | REAL-298 |
| Saucisse linguiça | 1 | REAL-276 |
| Saumure légère | 1 | REAL-107 |
| Semoule de blé dur moyenne sèche | 1 | MAG-001 |
| Sole entière crue, parée | 1 | REAL-081 |
| Ssamjang | 1 | REAL-238 |
| Steak de bœuf cru fin | 1 | REAL-121 |
| Sucre glace | 1 | REAL-145 |
| Tahini de sésame chinois | 1 | REAL-193 |
| Tamarin frais ou pâte | 1 | REAL-260 |
| Tare de soja | 1 | REAL-213 |
| Tasajo de bœuf | 1 | REAL-270 |
| Tempeh frit | 1 | REAL-256 |
| Tenkasu miettes de tempura | 1 | REAL-218 |
| Terasi pâte de crevette | 1 | REAL-254 |
| Thon au naturel en conserve égoutté | 1 | REAL-284 |
| Thon à l’huile en conserve, égoutté | 1 | REAL-096 |
| Tlayuda grande | 1 | REAL-270 |
| Tofu ferme frit | 1 | REAL-256 |
| Tofu puff frit | 1 | REAL-257 |
| Tofu rouge fermenté | 1 | REAL-204 |
| Tofu soyeux ferme | 1 | REAL-191 |
| Tofu soyeux sundubu | 1 | REAL-234 |
| Tomate cerise fraîche | 1 | REAL-250 |
| Tome fraîche de l’Aubrac | 1 | REAL-076 |
| Tonnarelli secs | 1 | REAL-100 |
| Toor dal cuit | 1 | REAL-180 |
| Tortilla de maïs grillée | 1 | REAL-264 |
| Tortilla de maïs rassise | 1 | REAL-266 |
| Tostada de maïs | 1 | REAL-273 |
| Tranche de bœuf crue fine | 1 | REAL-293 |
| Travers de bœuf flanken cru | 1 | REAL-229 |
| Travers de porc crus | 1 | REAL-260 |
| Travers de porc salés | 1 | REAL-276 |
| Tzatziki | 1 | REAL-127 |
| Veau haché cru | 1 | REAL-085 |
| Vermicelle de riz cuit | 1 | REAL-242 |
| Vermicelle de riz sec | 1 | REAL-240 |
| Vermicelle fin sec | 1 | REAL-144 |
| Viande de chèvre crue avec os | 1 | REAL-289 |
| Vin blanc sec d Alsace | 1 | REAL-074 |
| Vin de riz taïwanais | 1 | REAL-210 |
| Vin rouge de Bourgogne | 1 | REAL-086 |
| Vinaigre de canne | 1 | REAL-259 |
| Vinaigre de cidre | 1 | FR-003 |
| Vinaigre de malt | 1 | REAL-302 |
| Vinaigre de palmier ou cidre | 1 | REAL-187 |
| Xérès sec | 1 | REAL-116 |
| Yaourt grec | 1 | REAL-132 |
| Zakwas de betterave fermenté | 1 | REAL-299 |
| Zeste d orange | 1 | REAL-079 |
| Échalote frite | 1 | REAL-208 |
| Échine de porc crue | 1 | REAL-127 |
| Échine de porc crue en bandes | 1 | REAL-204 |
| Échine de porc crue en fines tranches | 1 | REAL-261 |
| Écrevisse cuite décortiquée | 1 | REAL-082 |
| Épaule de porc salée | 1 | REAL-276 |
| Épaule de veau crue | 1 | REAL-078 |
| Épaule de veau crue, en cubes | 1 | FR-002 |
| Épinard africain frais | 1 | REAL-157 |
| Épinard d’eau kangkong | 1 | REAL-260 |
| Œuf cru pasteurisé | 1 | REAL-223 |

## 8. Graphe techniques → recettes

| Technique | Degré | Recettes |
|---|---:|---|
| mijotage | 50 | IT-001, FR-007, FR-008, FR-009, MX-001, VEG-001, IND-001, IND-002, MED-001, IT-004, IT-006, FR-012, FR-019, FR-033, REAL-074, REAL-077, REAL-095, REAL-098, REAL-099, REAL-125, REAL-143, REAL-144, REAL-145, REAL-146, REAL-148, REAL-149, REAL-154, REAL-155, REAL-157, REAL-165, REAL-172, REAL-174, REAL-175, REAL-187, REAL-191, REAL-214, REAL-215, REAL-221, REAL-231, REAL-232, REAL-234, REAL-246, REAL-253, REAL-255, REAL-264, REAL-267, REAL-276, REAL-287, REAL-290, REAL-295 |
| saisie | 36 | FR-001, FR-003, IT-001, FR-008, FR-009, MAG-001, MX-001, IT-004, FR-016, FR-018, FR-019, GR-001, REAL-075, REAL-083, REAL-093, REAL-094, REAL-095, REAL-110, REAL-111, REAL-112, REAL-116, REAL-153, REAL-155, REAL-172, REAL-173, REAL-188, REAL-199, REAL-221, REAL-227, REAL-259, REAL-289, REAL-292, REAL-293, REAL-296, REAL-298, REAL-301 |
| réduction | 33 | FR-001, FR-004, FR-008, FR-009, MX-001, FR-016, FR-018, GR-001, FR-021, FR-038, REAL-083, REAL-086, REAL-092, REAL-095, REAL-101, REAL-102, REAL-103, REAL-105, REAL-121, REAL-131, REAL-142, REAL-145, REAL-152, REAL-155, REAL-169, REAL-190, REAL-194, REAL-208, REAL-222, REAL-231, REAL-235, REAL-259, REAL-301 |
| marinade | 26 | REAL-127, REAL-128, REAL-142, REAL-154, REAL-160, REAL-166, REAL-168, REAL-169, REAL-171, REAL-187, REAL-192, REAL-204, REAL-220, REAL-227, REAL-228, REAL-229, REAL-235, REAL-240, REAL-259, REAL-261, REAL-263, REAL-268, REAL-277, REAL-285, REAL-288, REAL-289 |
| assemblage | 25 | FR-035, REAL-084, REAL-087, REAL-137, REAL-138, REAL-198, REAL-209, REAL-211, REAL-212, REAL-214, REAL-216, REAL-227, REAL-230, REAL-239, REAL-240, REAL-243, REAL-250, REAL-253, REAL-256, REAL-257, REAL-271, REAL-273, REAL-274, REAL-276, REAL-282 |
| pochage | 25 | FR-002, IT-006, DESS-011, FR-031, REAL-080, REAL-082, REAL-084, REAL-086, REAL-087, REAL-118, REAL-129, REAL-132, REAL-143, REAL-157, REAL-162, REAL-195, REAL-206, REAL-238, REAL-257, REAL-260, REAL-267, REAL-283, REAL-287, REAL-290, REAL-297 |
| mixage | 24 | FR-013, FR-014, REAL-096, REAL-114, REAL-115, REAL-120, REAL-140, REAL-152, REAL-158, REAL-159, REAL-168, REAL-173, REAL-181, REAL-182, REAL-187, REAL-255, REAL-264, REAL-265, REAL-266, REAL-267, REAL-268, REAL-271, REAL-283, REAL-288 |
| montage | 23 | IT-001, GR-001, FR-022, FR-023, DESS-004, FR-029, FR-037, REAL-073, REAL-094, REAL-105, REAL-121, REAL-134, REAL-135, REAL-141, REAL-164, REAL-165, REAL-171, REAL-183, REAL-241, REAL-265, REAL-269, REAL-270, REAL-301 |
| cuisson au four | 22 | FR-005, LEV-002, FR-023, DESS-003, DESS-006, DESS-007, FR-028, DESS-009, FR-029, FR-030, FR-032, FR-036, FR-039, FR-040, REAL-085, REAL-091, REAL-123, REAL-126, REAL-130, REAL-141, REAL-164, REAL-278 |
| trempage | 21 | LEV-002, REAL-073, REAL-077, REAL-098, REAL-113, REAL-125, REAL-126, REAL-158, REAL-159, REAL-161, REAL-175, REAL-178, REAL-181, REAL-182, REAL-189, REAL-203, REAL-229, REAL-245, REAL-269, REAL-276, REAL-281 |
| déglaçage | 20 | FR-001, FR-003, IT-001, FR-008, FR-009, IT-002, IT-004, FR-012, FR-016, FR-017, FR-018, GR-001, FR-038, REAL-075, REAL-093, REAL-094, REAL-095, REAL-116, REAL-282, REAL-300 |
| friture | 18 | REAL-097, REAL-109, REAL-147, REAL-159, REAL-160, REAL-162, REAL-183, REAL-185, REAL-186, REAL-195, REAL-215, REAL-219, REAL-256, REAL-266, REAL-271, REAL-279, REAL-291, REAL-302 |
| braisage | 17 | FR-001, FR-003, FR-016, FR-038, REAL-083, REAL-093, REAL-194, REAL-199, REAL-208, REAL-209, REAL-244, REAL-247, REAL-259, REAL-268, REAL-289, REAL-292, REAL-293 |
| émulsion | 16 | VEG-002, LEV-001, IT-005, FR-025, FR-033, FR-034, REAL-076, REAL-080, REAL-087, REAL-104, REAL-114, REAL-115, REAL-117, REAL-137, REAL-213, REAL-274 |
| gratinage | 14 | FR-004, IT-001, IT-006, FR-012, GR-001, FR-020, FR-022, FR-023, FR-037, REAL-075, REAL-082, REAL-105, REAL-121, REAL-301 |
| sauté | 14 | REAL-078, REAL-151, REAL-164, REAL-166, REAL-192, REAL-195, REAL-196, REAL-197, REAL-210, REAL-212, REAL-222, REAL-224, REAL-232, REAL-245 |
| compotage | 13 | FR-007, REAL-092, REAL-106, REAL-126, REAL-130, REAL-131, REAL-149, REAL-150, REAL-154, REAL-162, REAL-166, REAL-198, REAL-272 |
| farce | 13 | REAL-085, REAL-124, REAL-132, REAL-141, REAL-147, REAL-153, REAL-185, REAL-275, REAL-279, REAL-280, REAL-286, REAL-293, REAL-297 |
| grillade | 13 | MAG-001, REAL-121, REAL-127, REAL-140, REAL-154, REAL-156, REAL-168, REAL-169, REAL-229, REAL-240, REAL-270, REAL-274, REAL-285 |
| repos | 13 | FR-006, LEV-002, FR-017, DESS-001, DESS-002, DESS-010, REAL-110, REAL-111, REAL-127, REAL-152, REAL-185, REAL-238, REAL-288 |
| suer | 13 | FR-004, FR-008, VEG-001, IND-001, MED-001, IT-006, FR-013, FR-014, IT-008, FR-037, REAL-078, REAL-099, REAL-144 |
| blanchiment | 12 | FR-011, DESS-008, FR-026, REAL-104, REAL-173, REAL-191, REAL-194, REAL-209, REAL-213, REAL-239, REAL-243, REAL-244 |
| torréfaction | 12 | IND-002, REAL-100, REAL-112, REAL-140, REAL-143, REAL-148, REAL-149, REAL-169, REAL-172, REAL-187, REAL-239, REAL-251 |
| façonnage | 11 | LEV-002, IT-007, FR-019, REAL-097, REAL-109, REAL-183, REAL-199, REAL-275, REAL-278, REAL-279, REAL-286 |
| liaison | 9 | REAL-129, REAL-144, REAL-150, REAL-188, REAL-191, REAL-196, REAL-207, REAL-283, REAL-292 |
| pliage | 9 | EGG-001, REAL-147, REAL-185, REAL-200, REAL-201, REAL-206, REAL-226, REAL-280, REAL-297 |
| refroidissement | 9 | FR-035, REAL-096, REAL-097, REAL-109, REAL-114, REAL-115, REAL-124, REAL-195, REAL-280 |
| rôtissage | 9 | VEG-003, FR-017, GR-001, REAL-134, REAL-204, REAL-261, REAL-265, REAL-266, REAL-271 |
| cuisson al dente | 8 | IT-003, IT-004, IT-005, REAL-100, REAL-101, REAL-102, REAL-103, REAL-104 |
| cuisson séquencée | 8 | FR-015, REAL-074, REAL-077, REAL-079, REAL-113, REAL-153, REAL-223, REAL-260 |
| effilochage | 8 | FR-037, REAL-145, REAL-189, REAL-262, REAL-263, REAL-283, REAL-287, REAL-290 |
| fonçage | 8 | FR-005, DESS-006, DESS-011, FR-029, FR-036, FR-039, REAL-088, REAL-122 |
| infusion | 8 | DESS-006, DESS-012, REAL-090, REAL-116, REAL-180, REAL-248, REAL-249, REAL-299 |
| mélange | 8 | DESS-001, DESS-003, FR-028, DESS-010, FR-040, REAL-186, REAL-217, REAL-278 |
| cuissons séparées | 7 | FR-007, FR-035, REAL-227, REAL-230, REAL-237, REAL-256, REAL-287 |
| dégorgement | 7 | GR-001, REAL-085, REAL-103, REAL-105, REAL-130, REAL-186, REAL-226 |
| filtration | 7 | REAL-079, REAL-114, REAL-129, REAL-168, REAL-264, REAL-267, REAL-299 |
| poêlage | 7 | IT-002, FR-020, REAL-081, REAL-087, REAL-202, REAL-217, REAL-236 |
| précuisson | 7 | FR-010, FR-027, REAL-073, REAL-075, REAL-126, REAL-135, REAL-136 |
| tempérage | 7 | FR-002, IT-003, DESS-005, DESS-006, REAL-122, REAL-129, REAL-300 |
| vapeur | 7 | FR-022, FR-034, REAL-158, REAL-182, REAL-201, REAL-205, REAL-269 |
| appareil à crème prise | 6 | FR-005, FR-020, FR-029, FR-036, FR-039, REAL-088 |
| dessiccation | 6 | FR-004, FR-025, FR-031, REAL-076, REAL-082, REAL-279 |
| panade | 6 | FR-019, FR-031, REAL-082, REAL-085, REAL-164, REAL-279 |
| roulage | 6 | REAL-124, REAL-202, REAL-225, REAL-237, REAL-242, REAL-293 |
| écrasement | 6 | FR-025, DESS-009, REAL-099, REAL-139, REAL-177, REAL-184 |
| égouttage | 6 | VEG-002, FR-022, FR-029, FR-034, REAL-123, REAL-139 |
| absorption | 5 | REAL-135, REAL-136, REAL-152, REAL-153, REAL-161 |
| bouillon | 5 | REAL-211, REAL-231, REAL-233, REAL-243, REAL-257 |
| coagulation | 5 | REAL-108, REAL-215, REAL-234, REAL-245, REAL-258 |
| cuisson étouffée | 5 | REAL-124, REAL-142, REAL-167, REAL-176, REAL-277 |
| dessalage | 5 | REAL-080, REAL-084, REAL-117, REAL-119, REAL-276 |
| enrobage | 5 | REAL-102, REAL-183, REAL-220, REAL-245, REAL-266 |
| fondue | 5 | FR-036, REAL-088, REAL-119, REAL-223, REAL-296 |
| panure | 5 | REAL-097, REAL-109, REAL-215, REAL-279, REAL-294 |
| pilonnage | 5 | IT-005, REAL-250, REAL-252, REAL-254, REAL-291 |
| pétrissage | 5 | IT-007, REAL-132, REAL-141, REAL-200, REAL-201 |
| taillage | 5 | FR-007, VEG-002, DESS-007, REAL-137, REAL-273 |
| tarka | 5 | REAL-173, REAL-174, REAL-175, REAL-176, REAL-177 |
| tranchage | 5 | REAL-118, REAL-195, REAL-237, REAL-238, REAL-261 |
| évaporation | 5 | FR-009, FR-020, REAL-088, REAL-162, REAL-176 |
| coagulation contrôlée | 4 | EGG-001, REAL-119, REAL-131, REAL-214 |
| fermentation | 4 | IT-007, REAL-107, REAL-181, REAL-182 |
| finition | 4 | REAL-120, REAL-151, REAL-188, REAL-217 |
| finition crème | 4 | FR-013, FR-038, REAL-168, REAL-178 |
| friture ou rôtissage | 4 | REAL-103, REAL-105, REAL-106, REAL-135 |
| friture pâte | 4 | REAL-246, REAL-247, REAL-253, REAL-257 |
| purée | 4 | FR-004, FR-037, REAL-284, REAL-301 |
| réchauffage | 4 | REAL-098, REAL-134, REAL-241, REAL-298 |
| soffritto | 4 | IT-001, IT-004, REAL-093, REAL-098 |
| sofrito | 4 | REAL-110, REAL-111, REAL-112, REAL-290 |
| aplatir | 3 | REAL-094, REAL-293, REAL-294 |
| brochette | 3 | REAL-127, REAL-156, REAL-285 |
| caramel | 3 | FR-032, REAL-194, REAL-244 |
| caramélisation | 3 | REAL-089, REAL-136, REAL-255 |
| cuisson au bouillon | 3 | FR-013, FR-014, REAL-120 |
| cuisson courte | 3 | DESS-010, REAL-180, REAL-248 |
| cuisson du riz | 3 | REAL-097, REAL-110, REAL-111 |
| cuisson forte | 3 | REAL-107, REAL-122, REAL-133 |
| cuisson par absorption | 3 | FR-011, VEG-003, REAL-112 |
| cuisson à la poêle | 3 | EGG-001, DESS-001, DESS-002 |
| foisonnement | 3 | DESS-004, REAL-159, REAL-269 |
| garniture séparée | 3 | FR-001, FR-016, REAL-086 |
| hydratation | 3 | MAG-001, REAL-275, REAL-286 |
| liaison au pain | 3 | FR-003, REAL-098, REAL-099 |
| marinade froide | 3 | REAL-096, REAL-106, REAL-273 |
| mijotage long | 3 | REAL-178, REAL-281, REAL-298 |
| mijotage séquencé | 3 | MAG-001, IT-008, REAL-233 |
| prise au froid | 3 | DESS-005, DESS-006, DESS-012 |
| rendu de graisse | 3 | IT-003, REAL-101, REAL-208 |
| retournement | 3 | REAL-108, REAL-217, REAL-236 |
| rinçage | 3 | VEG-003, IND-002, FR-027 |
| réhydratation | 3 | DESS-012, REAL-138, REAL-141 |
| tadka | 3 | REAL-179, REAL-180, REAL-183 |
| écumage | 3 | FR-002, FR-015, REAL-260 |
| équilibrage | 3 | REAL-247, REAL-248, REAL-249 |
| acidification | 2 | VEG-001, REAL-299 |
| appareil liquide | 2 | FR-030, REAL-090 |
| assaisonnement | 2 | REAL-118, REAL-284 |
| battage | 2 | EGG-001, REAL-189 |
| beurre noisette | 2 | FR-040, REAL-081 |
| bhuna | 2 | REAL-184, REAL-190 |
| béchamel | 2 | GR-001, FR-022 |
| coloration | 2 | FR-013, REAL-300 |
| confit | 2 | REAL-117, REAL-262 |
| contrôle température | 2 | FR-010, FR-017 |
| cuisson lente | 2 | REAL-128, REAL-263 |
| cuisson lente au four | 2 | FR-006, REAL-073 |
| cuisson longue | 2 | REAL-188, REAL-189 |
| cuisson légumes | 2 | REAL-179, REAL-184 |
| cuisson nouilles | 2 | REAL-193, REAL-211 |
| cuisson sous pression | 2 | REAL-175, REAL-178 |
| cuisson à l'eau | 2 | FR-004, FR-025 |
| dépelliculage | 2 | REAL-158, REAL-159 |
| effeuillage | 2 | REAL-080, REAL-119 |
| farinage | 2 | REAL-081, REAL-093 |
| fonte des anchois | 2 | REAL-102, REAL-104 |
| friture de concentré | 2 | REAL-152, REAL-155 |
| friture des aromates | 2 | REAL-191, REAL-209 |
| friture sèche | 2 | REAL-193, REAL-197 |
| fumet | 2 | REAL-079, REAL-248 |
| fusion douce | 2 | DESS-005, DESS-010 |
| glacage | 2 | REAL-143, REAL-210 |
| grillade du pain | 2 | REAL-137, REAL-184 |
| hachage | 2 | LEV-002, REAL-133 |
| imbibage | 2 | DESS-004, REAL-146 |
| julienne | 2 | FR-010, REAL-207 |
| laminage | 2 | REAL-132, REAL-202 |
| mantecatura | 2 | IT-002, REAL-101 |
| mijotage court | 2 | REAL-078, REAL-216 |
| mijotage doux | 2 | REAL-113, REAL-249 |
| mise en place | 2 | REAL-242, REAL-258 |
| mélange directionnel | 2 | REAL-199, REAL-200 |
| mélange limité | 2 | DESS-002, DESS-009 |
| parage | 2 | FR-018, REAL-285 |
| pickles | 2 | REAL-240, REAL-241 |
| pochage long | 2 | FR-015, REAL-077 |
| précuisson fruit | 2 | FR-032, FR-039 |
| pâte | 2 | REAL-280, REAL-297 |
| pâte froide | 2 | REAL-236, REAL-302 |
| pâte levée | 2 | REAL-089, REAL-133 |
| repos froid | 2 | DESS-004, FR-040 |
| roux | 2 | IT-001, REAL-109 |
| roux blanc | 2 | FR-002, FR-024 |
| sablage | 2 | DESS-007, REAL-185 |
| saisie douce | 2 | FR-011, FR-038 |
| saisie vive | 2 | REAL-151, REAL-228 |
| sauter | 2 | FR-026, FR-027 |
| sauté vif | 2 | REAL-252, REAL-254 |
| tombée | 2 | FR-021, REAL-123 |
| torréfaction des épices | 2 | MX-001, IND-001 |
| égrenage | 2 | MAG-001, VEG-003 |
| émulsion au beurre | 2 | FR-011, DESS-011 |
| émulsion hors feu | 2 | IT-003, REAL-100 |
| étalage | 2 | REAL-133, REAL-181 |
| évidage | 2 | REAL-085, REAL-165 |
| aigre-doux | 1 | REAL-106 |
| ajustement de texture | 1 | LEV-001 |
| appareil à flan | 1 | REAL-091 |
| arrosage | 1 | FR-017 |
| assaisonnement tardif | 1 | VEG-001 |
| assaisonnement tiède | 1 | FR-033 |
| assemblage de sauce | 1 | REAL-193 |
| assemblage hors feu | 1 | REAL-251 |
| assemblage à table | 1 | REAL-238 |
| attendrissement | 1 | REAL-118 |
| base tomate | 1 | REAL-157 |
| beurre manié | 1 | REAL-086 |
| beurre persillé | 1 | FR-026 |
| bouillon long | 1 | REAL-239 |
| braisage à découvert | 1 | REAL-210 |
| brouillage rapide | 1 | REAL-198 |
| brûlage | 1 | REAL-177 |
| caramélisation des oignons | 1 | FR-003 |
| caramélisation lente | 1 | FR-012 |
| chiffonnade | 1 | REAL-120 |
| choc thermique | 1 | FR-040 |
| coagulation en couches | 1 | REAL-225 |
| comal | 1 | REAL-275 |
| compotage long | 1 | REAL-148 |
| confire | 1 | REAL-108 |
| confit d’oignon | 1 | REAL-134 |
| craquage coco | 1 | REAL-246 |
| croustillage | 1 | REAL-262 |
| croûte de riz | 1 | REAL-203 |
| crème citron | 1 | DESS-011 |
| cuisson | 1 | REAL-280 |
| cuisson alvéoles | 1 | REAL-218 |
| cuisson combinée | 1 | REAL-161 |
| cuisson contrôlée | 1 | FR-018 |
| cuisson couverte | 1 | FR-011 |
| cuisson crème | 1 | DESS-006 |
| cuisson de sauce | 1 | FR-024 |
| cuisson des graines | 1 | REAL-157 |
| cuisson des lentilles | 1 | REAL-146 |
| cuisson des pâtes dans le bouillon | 1 | IT-008 |
| cuisson des vermicelles | 1 | REAL-144 |
| cuisson du dal | 1 | REAL-179 |
| cuisson du masala | 1 | REAL-174 |
| cuisson en papillote | 1 | FR-010 |
| cuisson en pot | 1 | REAL-203 |
| cuisson haute température | 1 | IT-007 |
| cuisson lente au lait | 1 | DESS-008 |
| cuisson par mouillage progressif | 1 | IT-002 |
| cuisson plaque | 1 | REAL-181 |
| cuisson séparée | 1 | REAL-084 |
| cuisson séparée des légumes | 1 | REAL-083 |
| cuisson vapeur | 1 | FR-031 |
| cuisson à blanc | 1 | DESS-011 |
| cuisson à deux températures | 1 | REAL-090 |
| cuisson à l’eau | 1 | REAL-076 |
| curry | 1 | REAL-165 |
| dashi | 1 | REAL-211 |
| double cuisson | 1 | REAL-302 |
| double friture | 1 | REAL-220 |
| double marinade | 1 | REAL-170 |
| dum | 1 | REAL-171 |
| déchirage | 1 | REAL-146 |
| découpe au couteau | 1 | REAL-078 |
| déglacage sauce | 1 | REAL-224 |
| délayage | 1 | REAL-150 |
| démoulage | 1 | FR-032 |
| départ à froid | 1 | FR-015 |
| empilage | 1 | REAL-261 |
| enveloppement | 1 | REAL-263 |
| farcissage | 1 | REAL-130 |
| façonnage par fossettes | 1 | REAL-107 |
| fermentation existante | 1 | REAL-074 |
| fermentation filtrée | 1 | REAL-243 |
| feuilletage | 1 | REAL-089 |
| filage du fromage | 1 | REAL-076 |
| filaments d’œuf | 1 | REAL-207 |
| finition aromatique | 1 | FR-027 |
| finition huile | 1 | REAL-125 |
| foisonnement léger | 1 | DESS-003 |
| fondue d’oignons | 1 | REAL-295 |
| friture aromates | 1 | REAL-254 |
| friture de sauce | 1 | REAL-264 |
| friture nouilles | 1 | REAL-253 |
| friture ou vapeur | 1 | REAL-196 |
| friture peu profonde | 1 | REAL-294 |
| friture rapide | 1 | REAL-265 |
| friture épices | 1 | REAL-289 |
| friture œuf | 1 | REAL-252 |
| fritures séparées | 1 | REAL-264 |
| gelée de bouillon | 1 | REAL-201 |
| gratination | 1 | REAL-128 |
| gremolata | 1 | REAL-093 |
| grillade aromates | 1 | REAL-239 |
| grillade des nouilles | 1 | REAL-224 |
| grillade directe | 1 | REAL-139 |
| grillade forte | 1 | REAL-170 |
| grillade fumée | 1 | REAL-288 |
| grillade piments | 1 | REAL-268 |
| gélification | 1 | DESS-012 |
| hachage fin | 1 | REAL-138 |
| hachis poché | 1 | REAL-251 |
| huile fumante | 1 | REAL-205 |
| huile pimentée | 1 | REAL-234 |
| humidification | 1 | REAL-242 |
| hydratation élevée | 1 | REAL-107 |
| incision | 1 | REAL-170 |
| incorporation | 1 | DESS-005 |
| incorporation de garniture | 1 | FR-028 |
| incorporation des œufs | 1 | FR-031 |
| incorporation délicate | 1 | DESS-004 |
| laquage | 1 | REAL-204 |
| lavage | 1 | FR-021 |
| liaison au roux | 1 | REAL-221 |
| liaison aux jaunes | 1 | FR-002 |
| liaison aux œufs | 1 | REAL-145 |
| liaison crème aigre | 1 | REAL-296 |
| liaison naturelle | 1 | REAL-281 |
| liaison par amidon | 1 | IND-002 |
| liaison à l'eau de cuisson | 1 | IT-005 |
| macération | 1 | REAL-091 |
| marinade courte | 1 | VEG-002 |
| marinade longue | 1 | REAL-292 |
| marinade sèche | 1 | REAL-156 |
| meringue | 1 | DESS-011 |
| meurtrissage | 1 | REAL-250 |
| mijotage sous couvercle tombant | 1 | REAL-222 |
| mixage fin | 1 | LEV-001 |
| montage brick | 1 | REAL-145 |
| montage des blancs | 1 | DESS-005 |
| montage en couches | 1 | REAL-277 |
| montage filo | 1 | REAL-123 |
| montage froid | 1 | REAL-284 |
| montage inversé | 1 | FR-032 |
| mouillage progressif | 1 | FR-024 |
| moulage | 1 | REAL-291 |
| mélange de farce | 1 | REAL-206 |
| nacrage | 1 | IT-002 |
| nappage | 1 | REAL-081 |
| nettoyage | 1 | REAL-213 |
| papillote | 1 | REAL-128 |
| parboiling | 1 | REAL-171 |
| pelage | 1 | REAL-177 |
| plaque | 1 | REAL-286 |
| pochage ou poêlage | 1 | REAL-200 |
| pochage ou rôtissage doux | 1 | REAL-096 |
| pochage ou saisie | 1 | REAL-272 |
| polenta ferme | 1 | REAL-163 |
| poêlage-vapeur | 1 | REAL-226 |
| précuisson dans le lait | 1 | FR-006 |
| précuisson de garniture | 1 | FR-005 |
| préparation | 1 | REAL-219 |
| pâte eau chaude | 1 | REAL-202 |
| pâte fluide | 1 | REAL-218 |
| pâte glacée | 1 | REAL-219 |
| rabats | 1 | REAL-107 |
| rafraîchissement | 1 | FR-026 |
| remuage | 1 | DESS-008 |
| renversement | 1 | REAL-135 |
| repos long | 1 | REAL-090 |
| rotation | 1 | REAL-218 |
| réduction longue | 1 | REAL-255 |
| saisie de viande | 1 | REAL-190 |
| saisie rapide | 1 | REAL-300 |
| saisie wok | 1 | REAL-282 |
| salage anticipé | 1 | FR-017 |
| sauce | 1 | REAL-256 |
| sauce crustacés | 1 | REAL-082 |
| sauces | 1 | REAL-132 |
| sauté de légumes | 1 | REAL-163 |
| sauté sur plaque | 1 | REAL-235 |
| sauté wok | 1 | REAL-258 |
| secouage | 1 | REAL-167 |
| service en deux temps | 1 | REAL-079 |
| singer | 1 | REAL-083 |
| sirop | 1 | REAL-122 |
| socarrat | 1 | REAL-110 |
| taillage régulier | 1 | FR-006 |
| tare | 1 | REAL-211 |
| tare miso | 1 | REAL-212 |
| tempérage du yaourt | 1 | REAL-172 |
| tombée des épinards | 1 | IND-001 |
| torréfaction douce | 1 | REAL-295 |
| tourage | 1 | REAL-089 |
| tranchage fin | 1 | REAL-096 |
| velveting | 1 | REAL-192 |
| vinaigrette | 1 | FR-035 |
| wok hei | 1 | REAL-192 |
| ébullition longue | 1 | REAL-213 |
| échaudage | 1 | REAL-278 |
| écrasement partiel | 1 | REAL-174 |
| émulsion froide | 1 | REAL-082 |
| étuvée | 1 | FR-021 |
| œuf mollet | 1 | FR-033 |
| œufs brouillés facultatifs | 1 | REAL-092 |
| œufs pochés en sauce | 1 | MED-001 |

## 9. Graphe aromatique → recettes

| Famille aromatique | Degré | Recettes |
|---|---:|---|
| ail | 136 | FR-001, FR-002, FR-006, FR-007, FR-008, MX-001, VEG-001, VEG-002, IND-001, IND-002, MED-001, LEV-001, LEV-002, IT-005, IT-006, FR-017, FR-019, GR-001, FR-020, DESS-007, FR-026, FR-027, FR-038, REAL-073, REAL-076, REAL-077, REAL-078, REAL-079, REAL-080, REAL-084, REAL-085, REAL-092, REAL-093, REAL-095, REAL-097, REAL-099, REAL-102, REAL-103, REAL-104, REAL-105, REAL-110, REAL-111, REAL-112, REAL-114, REAL-115, REAL-116, REAL-117, REAL-119, REAL-120, REAL-127, REAL-128, REAL-130, REAL-132, REAL-137, REAL-139, REAL-142, REAL-148, REAL-149, REAL-150, REAL-151, REAL-152, REAL-153, REAL-154, REAL-162, REAL-165, REAL-166, REAL-167, REAL-168, REAL-169, REAL-170, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-178, REAL-180, REAL-183, REAL-187, REAL-188, REAL-190, REAL-191, REAL-192, REAL-196, REAL-197, REAL-199, REAL-204, REAL-206, REAL-207, REAL-209, REAL-210, REAL-212, REAL-213, REAL-220, REAL-221, REAL-226, REAL-228, REAL-229, REAL-232, REAL-233, REAL-234, REAL-235, REAL-238, REAL-240, REAL-244, REAL-248, REAL-249, REAL-250, REAL-252, REAL-253, REAL-254, REAL-255, REAL-259, REAL-262, REAL-263, REAL-264, REAL-266, REAL-267, REAL-268, REAL-269, REAL-271, REAL-272, REAL-273, REAL-274, REAL-276, REAL-277, REAL-279, REAL-283, REAL-285, REAL-287, REAL-288, REAL-289, REAL-290, REAL-291, REAL-296, REAL-299 |
| oignon_compoté | 134 | FR-001, FR-002, FR-003, FR-004, IT-001, FR-007, FR-008, MAG-001, MX-001, VEG-001, VEG-002, VEG-003, IND-001, IND-002, MED-001, LEV-002, IT-004, IT-006, FR-012, FR-013, FR-014, IT-008, FR-015, FR-016, FR-017, FR-019, GR-001, FR-035, REAL-073, REAL-074, REAL-075, REAL-077, REAL-078, REAL-079, REAL-083, REAL-084, REAL-085, REAL-086, REAL-092, REAL-093, REAL-095, REAL-098, REAL-106, REAL-108, REAL-111, REAL-119, REAL-120, REAL-123, REAL-124, REAL-125, REAL-126, REAL-129, REAL-130, REAL-131, REAL-132, REAL-133, REAL-134, REAL-136, REAL-138, REAL-141, REAL-142, REAL-143, REAL-144, REAL-145, REAL-146, REAL-148, REAL-149, REAL-150, REAL-151, REAL-152, REAL-154, REAL-155, REAL-156, REAL-157, REAL-158, REAL-159, REAL-162, REAL-163, REAL-164, REAL-165, REAL-166, REAL-167, REAL-169, REAL-171, REAL-172, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-181, REAL-184, REAL-186, REAL-187, REAL-188, REAL-189, REAL-190, REAL-214, REAL-215, REAL-216, REAL-221, REAL-222, REAL-224, REAL-230, REAL-233, REAL-239, REAL-243, REAL-247, REAL-261, REAL-262, REAL-263, REAL-265, REAL-266, REAL-267, REAL-271, REAL-272, REAL-273, REAL-276, REAL-277, REAL-279, REAL-280, REAL-281, REAL-282, REAL-283, REAL-286, REAL-287, REAL-290, REAL-292, REAL-293, REAL-295, REAL-296, REAL-297, REAL-300, REAL-301 |
| tomate_cuite | 92 | IT-001, FR-007, FR-008, MAG-001, MX-001, VEG-002, IND-001, IND-002, MED-001, IT-004, IT-006, IT-007, IT-008, FR-019, GR-001, FR-029, FR-035, REAL-073, REAL-079, REAL-082, REAL-083, REAL-085, REAL-092, REAL-093, REAL-095, REAL-097, REAL-098, REAL-099, REAL-101, REAL-102, REAL-103, REAL-105, REAL-106, REAL-110, REAL-111, REAL-112, REAL-114, REAL-115, REAL-121, REAL-125, REAL-126, REAL-127, REAL-130, REAL-131, REAL-133, REAL-137, REAL-138, REAL-144, REAL-149, REAL-150, REAL-151, REAL-152, REAL-153, REAL-155, REAL-156, REAL-157, REAL-162, REAL-163, REAL-165, REAL-166, REAL-167, REAL-168, REAL-169, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-178, REAL-179, REAL-180, REAL-184, REAL-190, REAL-198, REAL-209, REAL-250, REAL-260, REAL-264, REAL-266, REAL-268, REAL-270, REAL-271, REAL-272, REAL-273, REAL-275, REAL-277, REAL-279, REAL-282, REAL-287, REAL-290, REAL-295, REAL-301 |
| piment | 77 | FR-008, MX-001, MED-001, REAL-078, REAL-092, REAL-101, REAL-102, REAL-104, REAL-116, REAL-117, REAL-121, REAL-131, REAL-133, REAL-134, REAL-135, REAL-140, REAL-141, REAL-151, REAL-152, REAL-153, REAL-154, REAL-155, REAL-156, REAL-157, REAL-158, REAL-159, REAL-160, REAL-166, REAL-167, REAL-168, REAL-170, REAL-172, REAL-175, REAL-177, REAL-178, REAL-183, REAL-185, REAL-186, REAL-187, REAL-188, REAL-190, REAL-191, REAL-192, REAL-193, REAL-197, REAL-210, REAL-233, REAL-234, REAL-241, REAL-243, REAL-248, REAL-249, REAL-250, REAL-251, REAL-252, REAL-253, REAL-254, REAL-255, REAL-256, REAL-260, REAL-261, REAL-263, REAL-264, REAL-265, REAL-266, REAL-267, REAL-268, REAL-271, REAL-272, REAL-273, REAL-274, REAL-281, REAL-282, REAL-283, REAL-288, REAL-289, REAL-299 |
| beurre | 62 | FR-002, FR-003, FR-004, IT-001, FR-006, FR-011, EGG-001, IT-002, FR-012, FR-013, FR-017, GR-001, FR-021, FR-022, FR-023, DESS-001, DESS-002, DESS-005, DESS-006, DESS-007, FR-024, FR-025, FR-026, FR-027, DESS-009, DESS-010, DESS-011, FR-030, FR-031, FR-032, FR-036, FR-037, FR-040, REAL-076, REAL-081, REAL-082, REAL-086, REAL-088, REAL-089, REAL-090, REAL-091, REAL-093, REAL-094, REAL-109, REAL-131, REAL-132, REAL-145, REAL-146, REAL-148, REAL-149, REAL-150, REAL-151, REAL-168, REAL-178, REAL-184, REAL-212, REAL-279, REAL-293, REAL-294, REAL-297, REAL-300, REAL-301 |
| agrume | 55 | FR-002, FR-010, FR-011, VEG-002, VEG-003, IND-001, IND-002, LEV-001, FR-017, FR-021, DESS-007, DESS-011, FR-040, REAL-080, REAL-081, REAL-093, REAL-096, REAL-122, REAL-124, REAL-127, REAL-128, REAL-129, REAL-130, REAL-133, REAL-137, REAL-138, REAL-139, REAL-142, REAL-147, REAL-148, REAL-154, REAL-170, REAL-184, REAL-188, REAL-189, REAL-220, REAL-239, REAL-243, REAL-245, REAL-248, REAL-249, REAL-250, REAL-251, REAL-253, REAL-255, REAL-257, REAL-267, REAL-273, REAL-274, REAL-277, REAL-284, REAL-286, REAL-288, REAL-294, REAL-299 |
| gingembre | 50 | IND-001, IND-002, REAL-142, REAL-143, REAL-144, REAL-145, REAL-148, REAL-149, REAL-156, REAL-160, REAL-162, REAL-165, REAL-167, REAL-168, REAL-169, REAL-170, REAL-172, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-178, REAL-187, REAL-188, REAL-189, REAL-190, REAL-191, REAL-192, REAL-194, REAL-195, REAL-196, REAL-199, REAL-200, REAL-201, REAL-205, REAL-206, REAL-209, REAL-210, REAL-212, REAL-213, REAL-216, REAL-218, REAL-220, REAL-224, REAL-226, REAL-238, REAL-239, REAL-288, REAL-289 |
| soja_fermenté | 36 | REAL-192, REAL-193, REAL-194, REAL-195, REAL-196, REAL-199, REAL-200, REAL-201, REAL-203, REAL-204, REAL-205, REAL-207, REAL-208, REAL-209, REAL-210, REAL-211, REAL-214, REAL-215, REAL-216, REAL-219, REAL-220, REAL-222, REAL-223, REAL-225, REAL-226, REAL-228, REAL-229, REAL-230, REAL-235, REAL-236, REAL-241, REAL-252, REAL-258, REAL-259, REAL-282, REAL-288 |
| tomate | 32 | REAL-092, REAL-095, REAL-099, REAL-101, REAL-103, REAL-105, REAL-110, REAL-111, REAL-112, REAL-115, REAL-121, REAL-125, REAL-126, REAL-130, REAL-131, REAL-133, REAL-138, REAL-144, REAL-153, REAL-155, REAL-162, REAL-163, REAL-166, REAL-167, REAL-168, REAL-174, REAL-175, REAL-178, REAL-184, REAL-260, REAL-266, REAL-272 |
| lacté | 31 | FR-002, FR-005, FR-006, FR-009, FR-013, FR-014, FR-018, FR-020, FR-021, DESS-006, DESS-011, FR-029, FR-030, FR-036, FR-038, FR-039, DESS-012, REAL-075, REAL-076, REAL-082, REAL-088, REAL-168, REAL-169, REAL-173, REAL-178, REAL-265, REAL-266, REAL-271, REAL-274, REAL-296, REAL-300 |
| coriandre | 29 | LEV-002, REAL-142, REAL-144, REAL-146, REAL-162, REAL-170, REAL-171, REAL-174, REAL-176, REAL-177, REAL-180, REAL-183, REAL-184, REAL-185, REAL-186, REAL-187, REAL-188, REAL-190, REAL-205, REAL-240, REAL-241, REAL-251, REAL-261, REAL-265, REAL-273, REAL-274, REAL-277, REAL-282, REAL-286 |
| cumin | 28 | MX-001, VEG-002, VEG-003, IND-001, IND-002, MED-001, LEV-001, LEV-002, REAL-136, REAL-140, REAL-169, REAL-170, REAL-173, REAL-174, REAL-175, REAL-176, REAL-177, REAL-180, REAL-185, REAL-186, REAL-187, REAL-190, REAL-268, REAL-280, REAL-281, REAL-285, REAL-287, REAL-290 |
| porc | 24 | REAL-073, REAL-194, REAL-199, REAL-200, REAL-201, REAL-206, REAL-208, REAL-211, REAL-212, REAL-213, REAL-217, REAL-221, REAL-224, REAL-226, REAL-232, REAL-238, REAL-241, REAL-242, REAL-244, REAL-260, REAL-262, REAL-267, REAL-275, REAL-281 |
| moutarde | 22 | FR-003, FR-009, FR-018, FR-021, FR-023, FR-029, FR-033, FR-034, FR-038, REAL-087, REAL-154, REAL-170, REAL-177, REAL-179, REAL-180, REAL-181, REAL-183, REAL-193, REAL-197, REAL-253, REAL-293, REAL-300 |
| soja | 21 | REAL-194, REAL-203, REAL-205, REAL-207, REAL-208, REAL-209, REAL-210, REAL-211, REAL-214, REAL-215, REAL-216, REAL-219, REAL-220, REAL-222, REAL-223, REAL-228, REAL-229, REAL-230, REAL-236, REAL-259, REAL-282 |
| cannelle | 19 | GR-001, DESS-007, DESS-009, FR-039, REAL-122, REAL-135, REAL-141, REAL-143, REAL-144, REAL-145, REAL-171, REAL-172, REAL-187, REAL-194, REAL-239, REAL-247, REAL-262, REAL-264, REAL-268 |
| fumé | 19 | FR-001, FR-005, MX-001, MED-001, FR-016, FR-036, REAL-074, REAL-075, REAL-084, REAL-086, REAL-087, REAL-118, REAL-156, REAL-157, REAL-158, REAL-276, REAL-288, REAL-293, REAL-298 |
| huile_olive | 18 | REAL-080, REAL-098, REAL-099, REAL-104, REAL-107, REAL-108, REAL-115, REAL-116, REAL-117, REAL-118, REAL-120, REAL-123, REAL-124, REAL-125, REAL-126, REAL-130, REAL-134, REAL-136 |
| vin_rouge_réduit | 18 | FR-001, IT-001, VEG-001, IT-004, FR-016, GR-001, FR-033, FR-034, FR-035, REAL-086, REAL-087, REAL-095, REAL-106, REAL-282, REAL-285, REAL-292, REAL-293, REAL-298 |
| oignon | 17 | REAL-075, REAL-078, REAL-119, REAL-130, REAL-145, REAL-146, REAL-149, REAL-150, REAL-154, REAL-159, REAL-163, REAL-216, REAL-221, REAL-280, REAL-295, REAL-296, REAL-297 |
| laurier | 16 | FR-003, FR-007, VEG-001, REAL-074, REAL-113, REAL-125, REAL-152, REAL-154, REAL-164, REAL-167, REAL-259, REAL-262, REAL-276, REAL-292, REAL-298, REAL-299 |
| citron | 15 | REAL-080, REAL-081, REAL-096, REAL-122, REAL-124, REAL-127, REAL-128, REAL-129, REAL-133, REAL-138, REAL-139, REAL-147, REAL-154, REAL-184, REAL-294 |
| sésame_toasté | 15 | REAL-143, REAL-193, REAL-200, REAL-203, REAL-206, REAL-210, REAL-226, REAL-227, REAL-228, REAL-229, REAL-230, REAL-234, REAL-235, REAL-237, REAL-264 |
| échalote | 15 | FR-009, IT-002, FR-018, FR-033, FR-037, FR-038, REAL-086, REAL-087, REAL-208, REAL-240, REAL-244, REAL-251, REAL-253, REAL-254, REAL-255 |
| bœuf | 14 | REAL-155, REAL-209, REAL-216, REAL-222, REAL-223, REAL-227, REAL-230, REAL-237, REAL-243, REAL-268, REAL-280, REAL-290, REAL-295, REAL-300 |
| champignon_terreux | 14 | FR-001, FR-002, FR-009, IT-002, FR-013, FR-016, REAL-086, REAL-095, REAL-228, REAL-248, REAL-249, REAL-298, REAL-299, REAL-300 |
| sésame | 14 | REAL-193, REAL-200, REAL-203, REAL-206, REAL-210, REAL-226, REAL-227, REAL-228, REAL-229, REAL-230, REAL-234, REAL-235, REAL-237, REAL-264 |
| thym | 14 | FR-003, FR-007, FR-008, VEG-001, FR-012, FR-013, FR-017, FR-018, FR-038, REAL-073, REAL-083, REAL-152, REAL-288, REAL-289 |
| poulet | 13 | REAL-129, REAL-134, REAL-145, REAL-146, REAL-167, REAL-211, REAL-214, REAL-235, REAL-269, REAL-279, REAL-283, REAL-286, REAL-296 |
| vin_blanc_réduit | 13 | FR-008, FR-009, IT-002, FR-012, FR-018, FR-038, REAL-074, REAL-075, REAL-093, REAL-094, REAL-096, REAL-101, REAL-290 |
| basilic | 11 | IT-005, IT-006, IT-007, IT-008, REAL-099, REAL-103, REAL-105, REAL-210, REAL-239, REAL-246, REAL-252 |
| coco | 11 | IND-001, IND-002, REAL-244, REAL-246, REAL-247, REAL-249, REAL-253, REAL-255, REAL-257, REAL-277, REAL-289 |
| fromage_affiné | 11 | FR-031, REAL-076, REAL-121, REAL-265, REAL-266, REAL-271, REAL-274, REAL-275, REAL-278, REAL-279, REAL-297 |
| haricot | 11 | REAL-073, REAL-077, REAL-098, REAL-113, REAL-125, REAL-126, REAL-158, REAL-159, REAL-161, REAL-175, REAL-270 |
| agneau | 10 | REAL-083, REAL-128, REAL-133, REAL-135, REAL-141, REAL-143, REAL-165, REAL-172, REAL-190, REAL-301 |
| paprika | 10 | MX-001, MED-001, REAL-118, REAL-132, REAL-156, REAL-169, REAL-280, REAL-281, REAL-295, REAL-296 |
| parmesan | 9 | IT-001, IT-002, IT-004, IT-005, IT-008, FR-019, GR-001, REAL-105, REAL-283 |
| safran | 9 | REAL-079, REAL-097, REAL-110, REAL-112, REAL-113, REAL-142, REAL-143, REAL-145, REAL-171 |
| œuf | 9 | REAL-108, REAL-119, REAL-129, REAL-131, REAL-147, REAL-198, REAL-214, REAL-215, REAL-225 |
| chou | 8 | REAL-077, REAL-120, REAL-163, REAL-199, REAL-217, REAL-224, REAL-226, REAL-235 |
| citron_vert | 8 | REAL-248, REAL-250, REAL-251, REAL-273, REAL-274, REAL-277, REAL-284, REAL-286 |
| dashi | 8 | REAL-211, REAL-214, REAL-215, REAL-216, REAL-218, REAL-219, REAL-222, REAL-225 |
| vanille | 8 | DESS-003, DESS-006, DESS-008, FR-030, FR-032, FR-039, DESS-012, REAL-090 |
| cacahuète | 7 | REAL-183, REAL-192, REAL-242, REAL-245, REAL-247, REAL-250, REAL-256 |
| comté | 7 | FR-012, FR-020, FR-022, FR-023, FR-028, FR-029, FR-031 |
| menthe | 7 | REAL-124, REAL-132, REAL-137, REAL-138, REAL-171, REAL-242, REAL-251 |
| olive | 7 | REAL-102, REAL-106, REAL-119, REAL-142, REAL-272, REAL-280, REAL-290 |
| vinaigre | 7 | REAL-087, REAL-106, REAL-187, REAL-196, REAL-259, REAL-285, REAL-292 |
| anchois | 6 | REAL-096, REAL-102, REAL-104, REAL-231, REAL-232, REAL-233 |
| lait | 6 | REAL-080, REAL-090, REAL-091, REAL-122, REAL-278, REAL-283 |
| maïs | 6 | REAL-163, REAL-212, REAL-269, REAL-275, REAL-281, REAL-286 |
| persil | 6 | REAL-081, REAL-085, REAL-133, REAL-137, REAL-138, REAL-153 |
| tamarin | 6 | REAL-179, REAL-180, REAL-245, REAL-247, REAL-256, REAL-260 |
| aubergine | 5 | REAL-103, REAL-105, REAL-106, REAL-130, REAL-135 |
| caramel | 5 | REAL-089, REAL-090, REAL-122, REAL-194, REAL-244 |
| curry | 5 | REAL-164, REAL-165, REAL-166, REAL-253, REAL-289 |
| câpre | 5 | REAL-096, REAL-102, REAL-106, REAL-147, REAL-272 |
| poisson | 5 | REAL-081, REAL-153, REAL-231, REAL-250, REAL-302 |
| poivron | 5 | REAL-092, REAL-114, REAL-152, REAL-158, REAL-166 |
| pomme_de_terre | 5 | REAL-076, REAL-108, REAL-185, REAL-284, REAL-297 |
| sauce_poisson | 5 | REAL-239, REAL-240, REAL-244, REAL-245, REAL-252 |
| shiitaké | 5 | REAL-203, REAL-207, REAL-223, REAL-230, REAL-233 |
| veau | 5 | REAL-078, REAL-093, REAL-094, REAL-096, REAL-294 |
| aneth | 4 | REAL-123, REAL-124, REAL-126, REAL-129 |
| ciboule | 4 | REAL-198, REAL-202, REAL-205, REAL-236 |
| citronnelle | 4 | REAL-243, REAL-248, REAL-249, REAL-255 |
| clou_girofle | 4 | REAL-084, REAL-160, REAL-268, REAL-292 |
| crevette | 4 | REAL-116, REAL-206, REAL-242, REAL-257 |
| doubanjiang | 4 | REAL-191, REAL-195, REAL-196, REAL-209 |
| lentille | 4 | REAL-084, REAL-136, REAL-149, REAL-179 |
| mirin | 4 | REAL-214, REAL-222, REAL-223, REAL-225 |
| romarin | 4 | REAL-095, REAL-098, REAL-110, REAL-151 |
| shaoxing | 4 | REAL-194, REAL-199, REAL-201, REAL-204 |
| anis | 3 | REAL-194, REAL-209, REAL-239 |
| berbéré | 3 | REAL-148, REAL-149, REAL-150 |
| bœuf_grillé | 3 | REAL-156, REAL-228, REAL-229 |
| cacao | 3 | DESS-005, DESS-010, REAL-264 |
| cardamome | 3 | REAL-171, REAL-172, REAL-247 |
| champignon | 3 | REAL-298, REAL-299, REAL-300 |
| combava | 3 | REAL-246, REAL-248, REAL-249 |
| crème | 3 | REAL-082, REAL-088, REAL-265 |
| fermentation | 3 | REAL-181, REAL-182, REAL-299 |
| fromage | 3 | REAL-121, REAL-275, REAL-278 |
| fruits_de_mer | 3 | REAL-112, REAL-236, REAL-258 |
| galanga | 3 | REAL-248, REAL-249, REAL-255 |
| genièvre | 3 | REAL-074, REAL-292, REAL-298 |
| gochujang | 3 | REAL-227, REAL-231, REAL-235 |
| miel | 3 | FR-040, REAL-143, REAL-204 |
| morue | 3 | REAL-080, REAL-117, REAL-119 |
| noix | 3 | REAL-087, REAL-140, REAL-283 |
| oignon_frit | 3 | REAL-171, REAL-186, REAL-189 |
| orange | 3 | REAL-079, REAL-262, REAL-276 |
| origan | 3 | REAL-127, REAL-128, REAL-267 |
| pain | 3 | REAL-098, REAL-099, REAL-165 |
| piment_doux | 3 | REAL-078, REAL-092, REAL-131 |
| poivre_sichuan | 3 | REAL-191, REAL-192, REAL-193 |
| porc_fumé | 3 | REAL-074, REAL-113, REAL-276 |
| pruneau | 3 | REAL-091, REAL-143, REAL-298 |
| riz | 3 | REAL-161, REAL-181, REAL-182 |
| viande | 3 | REAL-132, REAL-164, REAL-189 |
| vin_blanc | 3 | REAL-075, REAL-093, REAL-094 |
| achiote | 2 | REAL-261, REAL-263 |
| aji_amarillo | 2 | REAL-283, REAL-284 |
| allspice | 2 | REAL-288, REAL-289 |
| amchur | 2 | REAL-174, REAL-185 |
| avocat | 2 | REAL-284, REAL-286 |
| beurre_demi_sel | 2 | REAL-089, REAL-091 |
| bière | 2 | REAL-121, REAL-302 |
| café | 2 | DESS-004, REAL-238 |
| carvi | 2 | REAL-074, REAL-295 |
| chou_fleur | 2 | REAL-135, REAL-176 |
| ciboulette | 2 | REAL-200, REAL-245 |
| cinq_épices | 2 | REAL-204, REAL-208 |
| crevette_fermentée | 2 | REAL-238, REAL-243 |
| crème_aigre | 2 | REAL-296, REAL-300 |
| céleri | 2 | REAL-125, REAL-144 |
| doenjang | 2 | REAL-233, REAL-238 |
| douchi | 2 | REAL-191, REAL-195 |
| fenouil | 2 | REAL-079, REAL-172 |
| fenugrec | 2 | REAL-146, REAL-168 |
| feuille_curry | 2 | REAL-179, REAL-180 |
| friture | 2 | REAL-159, REAL-302 |
| gochugaru | 2 | REAL-232, REAL-234 |
| haricot_noir | 2 | REAL-276, REAL-287 |
| herbes | 2 | REAL-240, REAL-257 |
| huile | 2 | REAL-202, REAL-236 |
| huile_pimentée | 2 | REAL-191, REAL-193 |
| jambon | 2 | REAL-077, REAL-115 |
| katsuobushi | 2 | REAL-217, REAL-218 |
| lap_cheong | 2 | REAL-203, REAL-258 |
| lardon | 2 | REAL-086, REAL-087 |
| légumes | 2 | REAL-260, REAL-301 |
| maïs_grillé | 2 | REAL-270, REAL-274 |
| mélasse_grenade | 2 | REAL-137, REAL-140 |
| niter_kibbeh | 2 | REAL-148, REAL-151 |
| pecorino | 2 | REAL-100, REAL-101 |
| pickles | 2 | REAL-240, REAL-241 |
| pignon | 2 | REAL-134, REAL-141 |
| piment_espelette | 2 | REAL-078, REAL-092 |
| piments_secs | 2 | REAL-264, REAL-268 |
| poire | 2 | REAL-228, REAL-229 |
| poireau | 2 | REAL-088, REAL-195 |
| poisson_frais | 2 | REAL-205, REAL-273 |
| poivre | 2 | REAL-180, REAL-259 |
| porc_frit | 2 | REAL-195, REAL-215 |
| porc_grillé | 2 | REAL-127, REAL-240 |
| poulpe | 2 | REAL-118, REAL-218 |
| rhum | 2 | REAL-090, REAL-091 |
| riz_grillé | 2 | REAL-251, REAL-254 |
| sofrito | 2 | REAL-287, REAL-290 |
| sumac | 2 | REAL-134, REAL-137 |
| thon | 2 | REAL-096, REAL-147 |
| tomate_rôtie | 2 | REAL-085, REAL-271 |
| tomatillo | 2 | REAL-265, REAL-269 |
| urad | 2 | REAL-181, REAL-182 |
| vin | 2 | REAL-095, REAL-293 |
| vinaigre_noir | 2 | REAL-192, REAL-207 |
| wok_hei | 2 | REAL-258, REAL-282 |
| ya_cai | 2 | REAL-193, REAL-197 |
| écrevisse | 2 | REAL-082, REAL-158 |
| épices | 2 | REAL-188, REAL-189 |
| épinard | 2 | REAL-123, REAL-173 |
| abricot | 1 | REAL-164 |
| ail_frit | 1 | REAL-116 |
| aji_panca | 1 | REAL-285 |
| ajwain | 1 | REAL-186 |
| amande | 1 | REAL-145 |
| amidon_de_pâte | 1 | REAL-100 |
| ananas | 1 | REAL-261 |
| arachide | 1 | REAL-155 |
| arachide_grillée | 1 | REAL-156 |
| aromates_cuits | 1 | IT-003 |
| aubergine_fumée | 1 | REAL-139 |
| basilic_sacré | 1 | REAL-252 |
| basilic_thaï | 1 | REAL-246 |
| betterave | 1 | REAL-299 |
| beurre_clarifié | 1 | REAL-294 |
| beurre_noisette | 1 | REAL-081 |
| beurre_paprika | 1 | REAL-132 |
| bouillon | 1 | REAL-279 |
| bouillon_clair | 1 | REAL-206 |
| bouillon_gélatineux | 1 | REAL-201 |
| boulgour | 1 | REAL-141 |
| brochet | 1 | REAL-082 |
| béchamel | 1 | REAL-109 |
| bœuf_effiloché | 1 | REAL-287 |
| bœuf_frit | 1 | REAL-162 |
| bœuf_saisi | 1 | REAL-151 |
| calamar | 1 | REAL-111 |
| canard | 1 | REAL-077 |
| canard_confit | 1 | REAL-073 |
| caramel_léger | 1 | REAL-106 |
| catupiry | 1 | REAL-279 |
| chicharrón | 1 | REAL-291 |
| chou_lactique | 1 | REAL-074 |
| chou_noir | 1 | REAL-098 |
| choucroute | 1 | REAL-298 |
| chouriço | 1 | REAL-120 |
| chèvre | 1 | REAL-289 |
| citron_confit | 1 | REAL-142 |
| coco_grillée | 1 | REAL-255 |
| cognac | 1 | REAL-082 |
| collagène | 1 | REAL-213 |
| concombre | 1 | REAL-114 |
| cornichon | 1 | REAL-293 |
| courge | 1 | REAL-281 |
| curcuma | 1 | REAL-176 |
| curry_doux | 1 | REAL-221 |
| curry_leaf | 1 | REAL-181 |
| curry_vert | 1 | REAL-246 |
| curtido | 1 | REAL-275 |
| céréales | 1 | REAL-189 |
| cœur_grillé | 1 | REAL-285 |
| dendê | 1 | REAL-277 |
| eau_coco | 1 | REAL-244 |
| egusi | 1 | REAL-157 |
| encre_marine | 1 | REAL-111 |
| farce | 1 | REAL-085 |
| feta | 1 | REAL-123 |
| feuille_bananier | 1 | REAL-263 |
| feuille_sorgho | 1 | REAL-161 |
| feuille_vigne | 1 | REAL-124 |
| frisée | 1 | REAL-087 |
| friture_légère | 1 | REAL-219 |
| fromage_blanc | 1 | REAL-297 |
| ghee | 1 | REAL-171 |
| gim | 1 | REAL-237 |
| gingembre_grillé | 1 | REAL-239 |
| gingembre_mariné | 1 | REAL-216 |
| graisse | 1 | REAL-262 |
| grillade | 1 | REAL-169 |
| guanciale | 1 | REAL-101 |
| habanero | 1 | REAL-263 |
| harissa | 1 | REAL-147 |
| hoisin | 1 | REAL-204 |
| huile_arachide | 1 | REAL-153 |
| huile_de_palme | 1 | REAL-157 |
| jalapeño | 1 | REAL-272 |
| jambon_affiné | 1 | REAL-109 |
| jambon_cru | 1 | REAL-094 |
| jarret | 1 | REAL-188 |
| kecap_manis | 1 | REAL-254 |
| kimchi_mûr | 1 | REAL-232 |
| lait_frais | 1 | REAL-076 |
| lard | 1 | REAL-293 |
| lardon_fumé | 1 | REAL-075 |
| lentille_noire | 1 | REAL-178 |
| légumes_assaisonnés | 1 | REAL-227 |
| légumes_marinés | 1 | REAL-237 |
| manioc | 1 | REAL-278 |
| masala | 1 | REAL-184 |
| matière_grasse_chauffée | 1 | IT-003 |
| maïs_nixtamalisé | 1 | REAL-267 |
| miso | 1 | REAL-212 |
| moutarde_fermentée | 1 | REAL-253 |
| mozzarella | 1 | REAL-097 |
| muscade | 1 | REAL-088 |
| navet | 1 | REAL-083 |
| noix_muscade | 1 | REAL-109 |
| nori | 1 | REAL-211 |
| oignon_caramélisé | 1 | REAL-136 |
| oignon_confit | 1 | REAL-134 |
| orange_amère | 1 | REAL-263 |
| pain_épices | 1 | REAL-292 |
| palourde | 1 | REAL-234 |
| paneer | 1 | REAL-173 |
| papaye | 1 | REAL-250 |
| paprika_fumé | 1 | REAL-118 |
| pasilla | 1 | REAL-271 |
| petits_pois | 1 | REAL-083 |
| piment_alep | 1 | REAL-140 |
| piment_cachemire | 1 | REAL-172 |
| piment_guajillo | 1 | REAL-266 |
| piment_séché | 1 | REAL-192 |
| plantain | 1 | REAL-287 |
| plantain_caramélisé | 1 | REAL-160 |
| plantain_vert | 1 | REAL-291 |
| pois_chiche_grillé | 1 | REAL-150 |
| poisson_fumé | 1 | REAL-157 |
| poisson_roche | 1 | REAL-079 |
| poivre_blanc | 1 | REAL-207 |
| poivre_noir | 1 | REAL-100 |
| poivron_fumé | 1 | REAL-140 |
| pomme | 1 | REAL-221 |
| porc_caramélisé | 1 | REAL-261 |
| porc_salé | 1 | REAL-084 |
| poulet_frit | 1 | REAL-220 |
| purée | 1 | REAL-301 |
| pâte_fermentée | 1 | REAL-107 |
| pâte_grillée | 1 | REAL-202 |
| pâte_laksa | 1 | REAL-257 |
| pâte_levée | 1 | REAL-089 |
| pâté | 1 | REAL-241 |
| quesillo | 1 | REAL-270 |
| ragù | 1 | REAL-097 |
| raisin | 1 | REAL-164 |
| ras_el_hanout | 1 | REAL-146 |
| reblochon | 1 | REAL-075 |
| ricotta_salata | 1 | REAL-103 |
| riz_frit | 1 | REAL-097 |
| saindoux | 1 | REAL-269 |
| sambal | 1 | REAL-258 |
| sauce_sucrée_salée | 1 | REAL-217 |
| sauce_yakisoba | 1 | REAL-224 |
| sauge | 1 | REAL-094 |
| sel | 1 | REAL-107 |
| serrano | 1 | REAL-265 |
| sichuan | 1 | REAL-197 |
| sucre | 1 | REAL-231 |
| tahini | 1 | REAL-139 |
| tandoor | 1 | REAL-170 |
| tempeh | 1 | REAL-256 |
| terasi | 1 | REAL-254 |
| tofu | 1 | REAL-234 |
| tomate_crue | 1 | REAL-114 |
| tomate_fraîche | 1 | REAL-198 |
| tomate_réduite | 1 | REAL-152 |
| verdure_amère | 1 | REAL-104 |
| viande_grillée | 1 | REAL-270 |
| viandes_grillées | 1 | REAL-121 |
| viandes_rôties | 1 | REAL-110 |
| vin_rouge | 1 | REAL-086 |
| vinaigre_malt | 1 | REAL-302 |
| vinaigre_xérès | 1 | REAL-114 |
| worcestershire | 1 | REAL-301 |
| xérès | 1 | REAL-116 |
| yaourt_ail | 1 | REAL-132 |
| échalote_frite | 1 | REAL-208 |

## 10. Règles de planification sensorielle

Le planificateur doit pénaliser :

- la répétition d’un même profil dominant sur deux repas consécutifs ;
- plus de deux sauces crémeuses, tomates, coco ou soja-fermenté sur trois jours ;
- trois textures majoritairement molles consécutives ;
- deux plats de richesse 5/5 dans la même journée ;
- la répétition de la même technique principale ;
- l’absence de fraîcheur ou d’acidité compensatrice après un plat riche ;
- les substitutions dont l’impact d’identité ou de texture n’est pas documenté.

Il doit favoriser une alternance entre mijoté, grillé, cru ou mariné, vapeur, sauté, soupe, pâte ou riz, croustillant et frais.

## 11. Résumé machine

```json
{
  "corpus_version": "v3-300-real-dishes",
  "recipe_count": 302,
  "v1_enriched": 72,
  "new_named_dishes": 230,
  "food_form_count": 727,
  "technique_count": 351,
  "aroma_count": 328,
  "content_sha256": "8ece896d112d80006f493fe8718beee581d9aa9a2de7a4471652e80a8b185954",
  "status": "candidate",
  "minimum_confidence": "B",
  "invalidates": "MYKO_RECIPE_CORPUS_SCRAPED_V2_500.md"
}
```

## 12. Critère de sortie pour l’intégration

Le corpus est intégré lorsque les 302 familles sont candidates dans `culinary`, que chaque forme alimentaire est résolue exactement ou liée à une tâche de revue, que les profils sensoriels et garde-fous sont stockés, et que le planificateur ne peut sélectionner une substitution qui viole l’identité ou la texture du plat.