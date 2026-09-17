# Contrat des chiffres affichés

> Ce document fait autorité sur tout nombre que Myko montre à quelqu'un. Le code,
> les API et les écrans sont construits **contre lui**. Quand le code et ce
> document divergent, c'est le code qui est en tort.
>
> Il est écrit le **17 septembre 2026**, au livrable 3.6 de
> `docs/PLAN_FINIR_MYKO.md`, et il ÉTEND à trois familles de nombres la règle que
> `data/prices/CONTRAT.md:15` tient déjà pour les prix. Il ne remplace pas le
> contrat des prix : celui-ci reste la référence de tout ce qui porte un euro, et
> ce document-ci reprend sa doctrine mot pour mot là où elle s'applique.

Version du contrat : **1.0.0**.

---

## 0. La règle qui prime sur toutes les autres

**Un chiffre qu'on n'a pas su calculer est ABSENT.**

C'est la phrase du contrat des prix — « un prix qu'on n'a pas su sourcer est
ABSENT » — appliquée au **temps de cuisine**, aux **quantités** et aux **macros
nutritionnels**. Un chiffre absent n'est jamais arrondi à zéro, jamais estimé
« raisonnablement », jamais complété par vraisemblance, et jamais tu.

Il n'est pas tu non plus : c'est la seule chose que ce contrat ajoute à celui des
prix. Une case vide et un chiffre absent se ressemblent à l'écran, et le lecteur
ne peut pas distinguer « cette recette n'a pas de repères nutritionnels » de
« cet écran a oublié de les afficher ». **Un chiffre absent porte donc un code de
refus**, exactement comme `verdictAffichage` rend `couverture_masse_insuffisante`
plutôt qu'un booléen nu (`lib/domain/pricing/priceMath.js`).

Et la raison est la même que pour les prix, elle mérite d'être répétée : un
nombre plausible mais fabriqué est **indétectable ensuite**. Il a la même tête
qu'un nombre vrai, il traverse tous les contrôles de forme, et le relecteur
suivant n'a aucun moyen de le distinguer. Un `|| 0` est la manière la plus rapide
d'en fabriquer un.

En cas d'hésitation, l'absence est la bonne réponse.

---

## 1. Ce que ce contrat couvre, et ce qu'il ne couvre pas

| Famille | Module qui fait autorité | Verdict rendu |
|---|---|---|
| **Prix, coûts, budget** | `lib/domain/pricing/priceMath.js` | `verdictAffichage` → `couverture_masse_insuffisante`, `couverture_lignes_insuffisante`, `aucune_ligne_chiffree`, `rien_de_quantifie`, `referentiel_perime` |
| **Macros par portion** | `lib/domain/recipes/macrosParPortion.js` | `verdictMacros` → `nutrition_absente`, `macro_non_calculable`, `couverture_nutritionnelle_insuffisante`, `portions_inconnues` |
| **Temps de cuisine** | `lib/domain/planning/cookingTime.js` | une somme `null` + `manquants` nommés, sous trois définitions nommées |
| **Quantités** | `lib/domain/planning/humanQuantities.js` | `{ display, exact }` — l'arrondi est déclaré, jamais silencieux |

**Ce qu'il ne couvre pas.** Les chiffres qui ne sont pas montrés à une personne :
scores internes du solveur, poids de notation, empreintes. Ils n'ont pas besoin
d'être absents quand ils sont incertains — ils ont besoin d'être déterministes.

---

## 2. Les macros nutritionnels

### 2.1 Une recette rend les mêmes macros par portion sur tous les écrans

C'est la première clause de **P18**. Trois écrans affichent les macros d'une
recette du planning :

| # | Écran | Ce qu'il lit |
|---|---|---|
| 1 | `app/recipes/canonical/[code]/page.js` — la fiche recette | `macrosParPortion(recipe)` |
| 2 | `components/CookMode.jsx` — le mode cuisine, ouvert depuis le planning | `nutrition_per_serving` de `/api/recipes/canonical/[code]`, qui vient de `blocNutritionPubliee`, et `macrosParPortionDeLAssiette` pour la colonne par personne |
| 3 | `app/planning/components/WeekGrid.jsx` — le détail d'un repas dans la grille de la semaine | `macrosParPortionDeLAssiette` sur l'assiette publiée (`legacy_meals`) |

**LA PORTION ET L'ASSIETTE SONT DEUX GRANDEURS, ET ELLES SE DISENT.** Les écrans
1 et 2 montrent la macro **par portion** de la recette ; les colonnes « par
personne » des écrans 2 et 3 montrent l'**assiette servie**. Ce n'est pas la
même chose, et il faut dire pourquoi : `canonicalMeal`
(`lib/domain/planning/personalizedMeals.js`) écrit
`kcal = nutritionPerServing × multiplier` **plus la nutrition des
accompagnements**, qui n'appartiennent pas à la recette. Rediviser l'assiette
par son multiplicateur ne rendrait donc PAS la portion de la recette, et
présenter un total sous l'étiquette « par portion » serait exactement le
mensonge que ce contrat interdit. Les deux écrans d'assiette passent par la même
fonction, à la même échelle (`planned_servings: 1`), et
`macrosParPortionDeLAssiette` refuse (`portions_inconnues`) plutôt que de
diviser par un quand le nombre de portions n'est pas connu.

**Un seul module calcule, trois écrans lisent.** `lib/domain/recipes/macrosParPortion.js`
porte la règle, l'arrondi et le verdict. Aucun écran n'a le droit de recomposer
une macro : deux arrondis écrits séparément produisent tôt ou tard 41 g d'un côté
et 41,4 g de l'autre, et P18 se casse sur une décimale aussi sûrement que sur un
zéro fabriqué.

**CE QUI EST MESURÉ, ET CE QUI EST TENU PAR CONSTRUCTION** — la distinction
compte, parce qu'annoncer « éprouvé sur le corpus » ce qui ne l'est pas serait
déjà un chiffre de trop. Ce dépôt n'a pas de rendu DOM en test (ni
`@testing-library`, ni `jsdom`) : on n'y compare pas des pixels, on y compare
des fonctions.

1. **Mesuré, recette par recette sur les 568 publiables** : le chemin de
   l'écran 1 (`macrosParPortion`) et celui que la route sert à l'écran 2
   (`blocNutritionPubliee`) rendent les mêmes cinq nombres, ou refusent
   ensemble. C'est l'égalité qui pouvait vraiment casser, puisque l'un rend du
   `camelCase` et l'autre du `snake_case`.
2. **Mesuré sur gabarit** : l'arithmétique de l'assiette — la division, l'arrondi
   commun, le refus par colonne.
3. **Tenu par construction, et relu à la source** : les quatre fichiers — trois
   écrans plus la route — importent `macrosParPortion` et aucun n'applique
   `Math.round` ni `toFixed` à une macro. `tests/data/contratChiffres.test.js`
   relit les quatre fichiers ligne à ligne pour l'établir.

### 2.1 bis Le tiret est par colonne, pas par bloc

Le refus du chemin **recette** est global, et c'est la couverture qui le
justifie : quand un ingrédient sur dix n'a pas de table nutritionnelle, aucune
des cinq valeurs n'est fiable (§2.3).

Une **assiette** ne porte aucune couverture. Chacune de ses cinq colonnes est
déclarée ou ne l'est pas, indépendamment des quatre autres, et **refuser les
cinq parce que l'une manque effacerait quatre mesures** — ce serait le §0
retourné contre lui-même. `macrosParPortionDeLAssiette` rend donc `null` par
colonne, nomme les colonnes vides dans `manquants`, et ne refuse le bloc entier
que lorsqu'il n'y a **rien** à montrer.

Le cas est réel et non théorique : sur les quatre écritures d'un repas publié,
`canonicalMeal` et `supportMeal` posent les cinq macros ensemble, le
petit-déjeuner conservé sans détail n'en pose aucune, mais `lib/xlsxParser.js`
écrit `fiber_g: null` à côté de quatre macros chiffrées — sur le créneau du
petit-déjeuner, c'est-à-dire exactement celui dont la grille de la semaine ouvre
le détail.

### 2.2 L'arrondi est déclaré

`CLAUDE.md` le fixe et ce contrat le reprend : **1 décimale pour les macros, 0
pour les kilocalories**, 2 pour les micronutriments. L'arrondi se fait **une
fois**, dans `arrondirMacro`, et jamais à l'affichage.

### 2.3 Le seuil de couverture est l'exhaustivité

Une macro n'est affichée que si **tous** les ingrédients quantifiés portent une
table nutritionnelle (`nutritionCoverage.pct === 100`).

C'est plus sévère que le seuil des prix (60 % de la masse, §8 du contrat des
prix), et la différence est assumée : un prix partiel reste un **minorant**
utilisable — « au moins 4,30 € » est vrai —, tandis qu'une macro partielle n'est
le minorant de rien d'utile. Un plat dont un ingrédient sur dix n'a pas de table
peut manquer de dix calories comme de six cents, et personne ne peut le dire
depuis l'écran.

Ce seuil ne durcit d'ailleurs rien : `materializeRecipe` traite déjà
`nutrition_coverage_incomplete` comme un **bloqueur** d'éligibilité. Ce contrat
rend visible à l'écran une décision que le moteur prenait en silence.

### 2.4 Ce qui est interdit, nommément

- `Number(x) || 0` sur une macro. C'était la rédaction de
  `app/api/recipes/canonical/[code]/route.js` avant ce livrable : une valeur
  absente y devenait **0 kcal**, affiché avec le même aplomb qu'une mesure.
- `Math.round(x || 0)` à l'affichage. C'était la rédaction de la colonne « par
  personne » de `components/CookMode.jsx`, alors que la colonne « par portion »
  du même fichier, deux lignes plus bas, appliquait la bonne règle.
- Masquer le bloc sans dire pourquoi. C'était la rédaction de
  `app/recipes/canonical/[code]/page.js` : pas de faux chiffre, mais pas de
  verdict non plus.
- Effacer un chiffre mesuré parce qu'un autre manque. C'était la rédaction de
  **ce livrable lui-même** à sa première écriture : le verdict d'assiette
  refusait les cinq colonnes dès qu'une manquait. Corrigé au §2.1 bis ; la faute
  est écrite ici parce qu'un contrat qui ne consigne que les fautes des autres
  est un contrat qu'on cesse de relire.

### 2.5 Le vocabulaire des refus

`REFUS_MACROS` et `PHRASE_REFUS_MACROS`, dans le module. La phrase vit dans le
domaine pour la même raison que `phraseEstimation` y vit du côté des prix :
laisser chaque écran rédiger, c'est accepter que le troisième écrive « 0 kcal ».

---

## 3. Le temps de cuisine

### 3.1 Un temps affiché est une somme de temps déclarés

`lib/domain/planning/cookingTime.js` (livrable 2.4) porte la règle : « mesuré »
veut dire **déclaré** par la recette (`prepMinutes`, `cookMinutes`) ou par le
modèle de session (portionnage, congélation). Jamais une valeur dérivée d'un nom
de plat, jamais un arrondi à la demi-heure.

**Quand une seule déclaration manque, la somme vaut `null` et les manquants sont
nommés.** C'est la même règle qu'au §0 : on ne montre pas un total amputé comme
s'il était complet.

### 3.2 Un chiffre de temps ne s'affiche jamais sans sa définition

Trois définitions coexistent pour la même semaine — préparation active engagée,
préparation active si tout est frais, préparation + cuisson — et elles diffèrent
d'un facteur quatre. Le §8 du plan tranche : **le critère P10 est la préparation
active engagée, cible ≤ 300 minutes**, et **les trois chiffres s'affichent avec
leur définition**.

« Un seul chiffre affiché sans sa définition est un chiffre faux », et les
chiffres mesurés le montrent. Sur les trois semaines du rapport de qualité
(`scripts/data/out/rapport-qualite-semaine.txt`, ligne P10) :

| Définition | semaine 1 | semaine 2 | semaine 3 |
|---|---|---|---|
| préparation active **engagée** (P10) | 310 | 320 | 295 |
| préparation active **si tout est frais** | 400 | 400 | 360 |
| préparation **+ cuisson**, tout frais | 1 160 | 1 305 | 1 480 |

Trois nombres, une seule semaine, un facteur presque cinq entre le premier et le
dernier : celui qui lit ne peut pas deviner lequel on lui montre.
`DEFINITIONS_TEMPS` porte les trois libellés ; l'écran les lit par identifiant
et ne peut donc pas servir un nombre sans le texte qui dit ce qu'il compte.

*Les chiffres de ce tableau sont ceux du rapport au 17 septembre 2026 ; ils sont
recalculés à chaque exécution de `tests/planning/rapportQualiteSemaine.test.js`
et ne sont recopiés ici que pour l'ordre de grandeur.*

### 3.3 L'annoncé et le constaté ne se confondent pas

Le temps **constaté** ne se calcule pas : il se déclare
(`public.cooking_session_times`). L'écart entre annoncé et constaté est une
soustraction, pas une correction : on ne réécrit jamais l'annonce a posteriori.

---

## 4. Les quantités

### 4.1 L'arrondi d'affichage ne détruit jamais l'exact

`lib/domain/planning/humanQuantities.js` rend systématiquement
`{ display, exact }`. Le premier est lisible dans une cuisine, le second est ce
sur quoi le stock est débité et la liste de courses construite. **Aucun calcul ne
part du `display`.**

Le barème d'arrondi est écrit, déterministe et borné : 5 g sous 100 g, 10 g sous
1 000 g, 50 g au-delà, exprimé en kg. Un arrondi déclaré n'est pas un chiffre
fabriqué ; un arrondi silencieux en est un.

### 4.2 Une quantité qu'on ne sait pas convertir n'est pas convertie

`materializeRecipe` bloque la ligne plutôt que de supposer une densité ou un
poids à la pièce, et le motif est celui que `toGramsV2` rend :
`missing_density`, `missing_unit_weight`, `spoon_needs_food_grams`,
`unknown_unit` — auxquels s'ajoutent `food_form_unresolved`,
`food_form_low_confidence` et `nutrition_incomplete` du côté du catalogue. La
recette perd alors son éligibilité, et le motif est porté par `issues` et par
`blockedBy` sur la ligne. C'est la même doctrine que le contrat des prix
(§1.1 : « sans densité au catalogue, l'entrée serait refusée : on n'écrit jamais
1,00 par défaut »).

### 4.3 Une option facultative qu'on retire se dit

Douze recettes publiables classées végétariennes portent un ingrédient carné
**facultatif** — lardons, jambon de Bayonne, thon (§2.4 du plan). Quand un
mangeur du créneau a déclaré manger moins de viande, cet ingrédient est retiré
de la fiche et il n'entre pas dans la liste de courses.

**Retiré, il reste affiché**, avec son nom et le motif du retrait
(`lib/domain/recipes/optionCarnee.js`, `phraseOptionCarnee`). Un ingrédient qui
disparaît sans un mot est une quantité modifiée en silence, et le lecteur suivant
ne peut plus savoir si la recette n'en a jamais porté ou si quelqu'un l'a retiré.

---

## 5. Le référentiel contrôlé est celui qui est servi

`npm run prices:check` cherchait `data/prices/reference-fr.json`, **un fichier qui
n'existe pas**, et répondait « rien à contrôler » en sortant en zéro — une porte
verte sur un fichier absent, pendant que les **259 relevés** que le dépôt portait
alors (`data/prices/tranches/`, onze fichiers) n'étaient vérifiés par personne. C'est la
réserve (b) du livrable 3.6, et le §2.2 du plan la nomme. Le contrôle tourne en
CI à chaque poussée (`.github/workflows/ci.yml:44`) : la porte était verte là où
on la regardait.

Mesuré avant et après, la commande elle-même :

| | avant | après |
|---|---|---|
| `npm run prices:check` | `Aucun référentiel à …/reference-fr.json — rien à contrôler.`, **sortie 0** | `11 tranche(s), 254 entrée(s), 222 affichable(s) (A ou B), 0 violation(s)`, sortie 0 |
| même contrôle sur le `surgeles.json` d'avant | — | **5 violations `form_unknown`, sortie 1** |

Deux règles en découlent, et elles valent pour tout contrôle de données de ce
dépôt :

1. **On contrôle ce qu'on sert.** Le contrôle lit le dossier des tranches, celui
   que `lib/domain/pricing/tranches.js` importe au build.
2. **Un contrôle qui ne trouve rien à contrôler ÉCHOUE.** Il ne dit pas que tout
   va bien : il dit qu'il ne sait pas. Sortie 2, message explicite.

Ce que la correction a fait remonter, dès sa première exécution : cinq entrées de
`data/prices/tranches/surgeles.json` cotaient des formes absentes du catalogue des
formes — donc raccordées à rien, donc jamais lues. **Ce n'est pas une
découverte** : la section « ORDRE D'EXÉCUTION » des notes de cette tranche
prévoyait le refus `form_unknown` et en donnait la cause exacte. Elle annonçait
même **sept** refus là où il y en a cinq, deux des sept formes ayant depuis
rejoint le catalogue — la note était pessimiste, pas fausse. Ce qui manquait
était la VÉRIFICATION : rien, dans le dépôt, ne pouvait constater l'état réel,
puisque le contrôle sortait en vert sans rien lire. C'est la démonstration de la
règle 2 ci-dessus, faite sur ce dépôt et pas en général : une prose qui annonce
un problème n'est pas un contrôle, et elle vieillit sans que personne le sache.

Les cinq entrées sont déplacées dans `entrees_hors_catalogue` du même fichier,
**sans être détruites**, avec leur provenance et leur citation, et le bloc écrit
le chemin de retour. La raison du déplacement est écrite aussi, parce qu'elle est
un arbitrage et non une évidence : ce contrôle tourne à chaque PR, la levée du
refus demande qu'une recette emploie ces formes — un lot d'usine à recettes,
c'est-à-dire une autre phase —, et une porte qui doit rester rouge jusque-là est
une porte qui finira désactivée.

**Ce que le déplacement coûte, mesuré des deux côtés**, parce que « la couverture
ne bouge pas » se vérifie et ne se promet pas
(`node scripts/data/prices/report-price-coverage.mjs`, avant et après) :

| | avant | après |
|---|---|---|
| relevés au référentiel | 259 | **254** |
| formes **du catalogue** chiffrées | 249 | **249** |
| lignes d'ingrédients chiffrées du corpus servi | 5 702 / 6 136 = 92,9 % | **inchangé** |
| calories chiffrées | 89,9 % | **inchangé** |

Le seul nombre qui bouge est le total du référentiel, et il bouge de cinq
relevés qui n'étaient **raccordés à rien**. Aucune ligne de recette ne perd son
prix : c'est ce que dit la deuxième ligne du tableau, et c'est celle qui compte.

---

## 6. Comment on vérifie

| Contrôle | Fichier | Ce qu'il tient |
|---|---|---|
| P18, égalité des trois écrans | `tests/data/contratChiffres.test.js` | les macros par portion d'une recette sont identiques sur les trois chemins, recette par recette sur tout le corpus |
| P18, aucun nombre non calculable | `tests/data/contratChiffres.test.js` | un verdict de refus rend `null` et jamais 0 ; les quatre lecteurs n'écrivent ni `\|\| 0` ni `Math.round`/`toFixed` sur une macro |
| P18, le tiret par colonne | `tests/data/contratChiffres.test.js` | une assiette à quatre macros sur cinq montre ses quatre mesures et nomme la cinquième ; une assiette sans aucune macro refuse le bloc entier |
| Option carnée facultative | `tests/data/contratChiffres.test.js` | les douze recettes végétariennes à option carnée sont exactement celles que `optionalNonVegetarian` désigne, l'option est retirée dès qu'un mangeur a déclaré, et elle n'entre jamais dans la liste de courses |
| Référentiel de prix servi | `tests/pricing/controleDesPrixServis.test.js`, `npm run prices:check` | le contrôle lit les tranches, et échoue sur un dossier absent |
| Temps de cuisine | `tests/planning/tempsSession.test.js`, `tests/planning/rapportQualiteSemaine.test.js` | l'écran et le rapport de qualité rendent le MÊME chiffre sous les mêmes trois définitions |

---

## 7. Ce que ce contrat ne sait pas faire

La même réserve que le contrat des prix, et il faut l'écrire ici aussi : **aucun
de ces contrôles ne sait détecter un chiffre inventé.** « 41,4 g » a exactement
la même tête que la mesure et que l'invention. Ce que ce contrat impose, c'est
qu'un chiffre affiché soit le résultat d'un calcul dont chaque terme est déclaré
quelque part dans le dépôt — et qu'un calcul impossible rende un refus nommé
plutôt qu'un nombre.

Le contrat déplace le mensonge d'un endroit invérifiable vers un endroit
vérifiable ; il ne le supprime pas.

### 7.1 Trois limites mesurées, écrites plutôt que tues

**(a) Aucun refus n'est exercé par une recette réelle.** Mesuré le 17 septembre
2026 : les **754** recettes du corpus — **568** publiables comprises — portent
leurs cinq macros et une couverture de 100 %. Les quatre codes de refus ne sont
donc déclenchés aujourd'hui que par les gabarits du test. Le garde-fou est posé
**avant** la donnée qui l'appellera, ce qui est le bon ordre, mais écrire « les
refus sont éprouvés sur le corpus » serait faux. Le test compte ces deux nombres
à chaque exécution : le jour où une recette sans nutrition entrera, il changera,
et ce sera une mesure nouvelle, pas une régression.

**(b) `prep_min` et `cook_min` échappent encore à ce contrat.** Les écrans de
recettes *legacy* (`app/recipes/page.js`, `app/recipes/[id]/page.js`,
`app/recipes/generated/[id]/page.js`) et la route de fiche canonique écrivent
encore `Number(recipe.prepMinutes) || 0`. Mesuré : **zéro** recette du corpus
manque de `prepMinutes` ou de `cookMinutes`, et 32 déclarent honnêtement une
cuisson nulle — la coercition ne fabrique donc aucun chiffre aujourd'hui. Elle
reste une porte ouverte, et le §3 de ce contrat ne la ferme pas : il faudrait
reprendre cinq écrans *legacy*, ce qui n'est pas le périmètre du livrable 3.6.

**(c) Le séparateur décimal n'est pas le même sur les trois écrans.** La fiche
recette passe par `Intl.NumberFormat('fr-FR')` et affiche « 41,4 g » ; le mode
cuisine et la grille rendent le nombre tel quel, « 41.4 g ». **Le nombre est le
même** — P18 porte sur la valeur, et elle est identique —, mais la mise en forme
ne l'est pas. C'est une faute d'édition, pas un chiffre faux ; elle est écrite
ici pour ne pas être découverte comme une divergence.
