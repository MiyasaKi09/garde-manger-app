# Contrat de données du référentiel de prix

> Ce document fait autorité. Le référentiel, les scripts d'import, la couche de
> calcul et l'interface sont construits **contre lui**. Quand le code et ce
> document divergent, c'est le code qui est en tort.

Version du contrat : **1.0.0** — elle doit être recopiée dans
`schema_version` de tout jeu de prix, et le contrôleur refuse un jeu qui
déclare autre chose.

---

## 0. La règle qui prime sur toutes les autres

**Un prix qu'on n'a pas su sourcer est ABSENT.**

Il n'est jamais deviné, jamais interpolé depuis un aliment voisin, jamais
« estimé raisonnablement », jamais complété par vraisemblance. Une couverture de
60 % honnête vaut infiniment mieux qu'une couverture de 100 % dont 40 % est de
la fiction, parce qu'un nombre plausible mais inventé est indétectable ensuite :
il a la même tête qu'un nombre vrai, il traverse tous les contrôles de forme, et
le relecteur suivant n'a aucun moyen de le distinguer.

Le contrôleur `scripts/data/prices/check-price-provenance.mjs` ne sait pas
détecter un chiffre inventé — aucun programme ne le sait. Il vérifie seulement
que chaque chiffre **porte une source, une date et une citation vérifiables**.
C'est cette obligation de citation qui rend l'invention coûteuse : inventer un
prix oblige à inventer aussi la ligne de cotation qui le porte, et cette
ligne-là, un humain peut aller la relire.

En cas d'hésitation, l'absence est la bonne réponse.

---

## 1. L'unité de référence

### 1.1 Le pivot : l'euro par kilogramme net acheté

Toute la couche de calcul ne lit qu'un seul nombre : **`per_kg`, en euros par
kilogramme de produit tel qu'acheté**, poids net du contenant, emballage exclu.

Pourquoi le kilo et pas autre chose : toute la chaîne de la demande atterrit en
grammes. `materializeRecipe` convertit chaque ligne en `grams` via `toGramsV2` ;
`finalDemands` agrège en grammes (`requiredGrams`, `shortageGrams`) et ne
bascule en litres ou en pièces que pour l'affichage. Prendre le litre ou la
pièce comme pivot obligerait à reconvertir au moment du calcul, donc à
reconvertir dans chaque appelant — et une conversion faite tard est une
conversion faite à cinq endroits, qui finissent par diverger.

### 1.2 Les trois bases d'observation, et comment on les ramène au pivot

Un prix se lit rarement au kilo. On garde donc **deux blocs distincts** :

- `observed` — ce qui a été **lu**, dans sa base native, sans transformation.
  `observed.basis` vaut `kg`, `l` ou `piece`.
- `per_kg` — la valeur **pivot**, matérialisée dans le fichier, accompagnée du
  facteur qui l'a produite (`per_kg.conversion`).

| base | conversion | formule |
|------|-----------|---------|
| `kg` | `identity` | `per_kg = observed` |
| `l` | `density` | `per_kg = observed ÷ density_g_per_ml` (1 L pèse `density` kg) |
| `piece` | `grams_per_piece` | `per_kg = observed ÷ (grams_per_piece / 1000)` |

Trois décisions qui empêchent le calcul de devenir faux au passage :

1. **La conversion est matérialisée, pas recalculée.** `per_kg` est écrit dans
   le fichier et le contrôleur **refait l'arithmétique** à chaque passage. Si un
   jour la densité du catalogue change, le contrôle échoue et quelqu'un doit
   trancher — au lieu que les deux valeurs dérivent en silence.

2. **Le facteur de conversion n'est jamais ressaisi : il est recopié du
   catalogue des formes**, avec sa clé (`per_kg.conversion.from`). Le catalogue
   porte déjà `conversion.density_g_per_ml` (0,92 pour l'huile d'olive vierge
   extra) et `conversion.grams_per_unit` (50 pour l'œuf cru, 120 pour le citron
   jaune). Ressaisir une densité dans le prix créerait une seconde vérité, et
   deux vérités sur le même nombre finissent toujours par se contredire. Le
   contrôleur vérifie l'égalité stricte avec le catalogue.

3. **Pas de facteur, pas de prix.** Une observation au litre sur une forme dont
   le catalogue ignore la densité ne donne **aucun** `per_kg` : l'entrée est
   refusée, et la forme reste non couverte. On n'écrit jamais `density = 1` par
   défaut. L'eau vaut 1,00, l'huile d'olive 0,92, le miel 1,42 : supposer 1,00
   sur une huile sous-estime de 8 %, et personne ne le verrait. C'est exactement
   la règle que `toGramsV2` applique déjà côté nutrition, qui renvoie
   `missing_density` plutôt qu'un repli — la couche prix hérite du même refus.

### 1.3 Ce qu'on garde de la base native

`observed` reste dans le fichier même quand il fait doublon avec `per_kg` (base
`kg`). Il sert à deux choses : reconstituer la lecture d'origine face à la
source, et afficher un prix dans la forme où l'utilisateur le reconnaît — « une
boîte de 6 œufs » se comprend mieux que « 5,83 €/kg ». L'affichage peut lire
`observed` ; **le calcul ne lit que `per_kg`**.

---

## 2. Le rendement comestible

### 2.1 Le problème

Les recettes expriment leurs quantités dans l'état du catalogue, qui est l'état
**comestible** (Ciqual mesure la partie comestible : « Oignon, cru » est
l'oignon épluché). Ce qu'on achète, lui, porte sa peau, ses fanes, son os.
Multiplier les grammes de la recette par le prix au kilo **sous-estime** donc le
coût, d'autant plus que la part jetée est grande.

### 2.2 Où il vit

**Dans le catalogue des formes, pas dans l'entrée de prix.** Le rendement est
une propriété de l'aliment, pas de son prix : il ne change pas quand le prix
change. Le loger dans le prix obligerait à le recopier dans chaque relevé
successif de la même forme, et deux relevés finiraient par ne plus dire la même
chose sur le même oignon.

Tant que le catalogue ne porte pas ce champ, l'entrée de prix porte un bloc
`edible_yield` qui **déclare son ignorance**, et le champ migrera vers le
catalogue sans changer la formule. Le bloc a la même forme dans les deux cas :

```json
"edible_yield": { "value": 1, "known": false, "note": "…" }
```

Un rendement **connu** est une donnée sourcée comme une autre : il porte son
propre bloc `provenance` (table de parts comestibles Ciqual, FAO, INRAE), et le
contrôleur refuse un `value` différent de 1 sans cette provenance — sans quoi le
rendement deviendrait la porte de service par laquelle les nombres inventés
rentrent.

Une seule exception, étroite : le registre porte une entrée `myko_reasoning`,
qui n'est pas une source — rien n'y est relevé. Elle n'admet qu'un rendement de
**1,00 par nature du produit** : une huile, un sel, un sucre n'ont pas de partie
non comestible, et c'est une définition, pas une mesure. Elle ne peut jamais
porter un rendement inférieur à 1 (« un oignon perd à peu près 10 % à
l'épluchage » est exactement le nombre plausible et invérifiable que le §0
proscrit), ni le moindre prix. Le contrôleur applique les deux interdits.

### 2.3 Le défaut : 1,00, déclaré

Quand le rendement est inconnu, il vaut **1,00** et `known` vaut `false`.

Pourquoi 1,00 plutôt qu'un « 0,85 typique » : parce que 0,85 est un nombre
inventé qui gonflerait silencieusement toutes les estimations, invérifiable et
intraçable — précisément ce que le §0 interdit. 1,00 est aussi une erreur, mais
c'est une erreur **déclarée et de sens connu** : sans correction de parage,
l'estimation est nécessairement un **minorant**. On sait dans quel sens on se
trompe, on le dit à l'interface (« hors pertes de parage »), et le jour où le
rendement est sourcé l'estimation ne peut que monter.

Un biais dont on connaît le sens est honnête ; une correction inventée est de la
fiction.

### 2.4 La formule

Le rendement s'applique **une seule fois**, au moment où l'on passe des grammes
de la forme à la masse achetée :

```
masse_achetée_g = grammes_de_la_forme / edible_yield.value
coût            = (masse_achetée_g / 1000) × per_kg.central
```

Les deux chemins — coût d'une recette et coût d'une liste de courses — passent
par le même helper. Appliquer le rendement dans l'un et pas dans l'autre ferait
deux montants différents pour le même oignon.

---

## 3. La fourchette

### 3.1 Ce que valent les bornes

`low` et `high` représentent **la dispersion des prix observés pour le même
aliment sur la période de référence** : les 1ᵉʳ et 9ᵉ déciles des observations
retenues. Peu importe la cause de la dispersion — géographie, enseigne, gamme,
saison à l'intérieur de la période : c'est un constat, pas une décomposition.

Trois lectures ont été **écartées** :

- *entrée / milieu de gamme* — il faudrait une segmentation par gamme qu'aucune
  des sources autorisées ne publie. On la fabriquerait, donc on l'inventerait.
- *incertitude de la source* — le RNM et l'INSEE ne publient pas d'intervalle de
  confiance sur leurs cotations. Écrire une incertitude serait écrire un chiffre
  qu'aucune source ne porte.
- *min / max* — deux valeurs extrêmes sont dominées par les aberrations d'une
  seule observation, et elles ne se composent pas (§3.2). D1/D9 est mesurable
  dès qu'on a une poignée d'observations et reste stable.

`central` est la **médiane** des observations retenues. C'est le nombre qui
s'affiche.

Quand la source ne publie qu'une fourchette de cotation sans déciles,
`observed.dispersion` vaut `quoted_range` et l'entrée plafonne en confiance B :
on ne fait pas passer une plage de cotation pour une distribution.

### 3.2 La règle de composition — on n'additionne pas les bornes

Additionner vingt bornes basses donne le prix d'un panier où **les vingt
ingrédients seraient simultanément dans leur décile le moins cher**. Ce panier
n'existe pas : sa probabilité est de l'ordre de 0,1²⁰. La borne obtenue est
absurde au sens propre — elle est plus basse que tout panier réel. La somme des
bornes hautes est absurde de la même façon.

**La règle :**

```
central_panier = Σ centralᵢ
dᵢ             = (highᵢ − lowᵢ) / 2                 (demi-étendue de la ligne i)
demi_panier    = √( Σ dᵢ² )                         (composition en quadrature)
bas_panier     = max(0, central_panier − demi_panier)
haut_panier    = central_panier + demi_panier
```

Trois raisons :

1. **La valeur centrale s'additionne exactement.** L'espérance d'une somme est
   la somme des espérances, quelles que soient les dépendances entre les termes.
   `Σ centralᵢ` est donc le seul point du panier qui ne demande aucune
   hypothèse.

2. **Les écarts se compensent.** Si la dispersion d'un aliment à l'autre n'est
   pas systématiquement alignée, les écarts d'un panier de vingt lignes se
   compensent partiellement, et la quadrature est la composition qui décrit
   cette compensation. Elle a la bonne propriété de bord : `√(Σdᵢ²) ≥ max dᵢ`,
   donc le panier n'est jamais annoncé plus serré que sa ligne la plus
   incertaine, et `√(Σdᵢ²) ≤ Σdᵢ`, donc il est toujours plus serré que la somme
   naïve.

3. **Le mouvement d'ensemble est traité ailleurs, et une fois.** L'objection
   sérieuse à la quadrature est qu'un niveau général de prix — l'inflation, la
   région, l'enseigne — déplace toutes les lignes dans le même sens, et que la
   quadrature sous-estime alors la largeur. C'est vrai, et c'est exactement ce
   dont s'occupe le §5 (réindexation INSEE, péremption). Ces deux mécanismes
   sont donc **orthogonaux par construction** : la fourchette ne porte que la
   dispersion entre points de vente à une date donnée, le vieillissement porte
   le mouvement d'ensemble. Les mélanger reviendrait à compter deux fois la même
   incertitude.

**Interdit :** `bas_panier = Σ lowᵢ` et `haut_panier = Σ highᵢ`. Aucun code du
dépôt ne doit contenir cette somme.

### 3.3 Composition et couverture

La composition ne porte **que sur les lignes chiffrées**. Une ligne non chiffrée
n'entre ni dans `central`, ni dans la quadrature — elle entre dans la couverture
(§6), et c'est elle qui fait basculer l'affichage de « environ » à « au moins ».

---

## 4. Les niveaux de confiance

Calqués sur ceux du catalogue alimentaire, où `confidence === 'C'` est un
bloqueur dans `materializeRecipe`. Ici, **C équivaut à l'absence**.

| Niveau | Ce qu'il faut pour l'obtenir | Ce qu'il autorise |
|--------|------------------------------|-------------------|
| **A** | Source publique officielle qui accorde A (`grants_confidence: "A"` au registre) · agrégat déclaré (`monthly_mean` ou `annual_mean`, jamais un point) · observation à moins de 12 mois de la date de référence · dispersion déclarée avec ses bornes · clé d'enregistrement source non vide | Affichable, compte dans la couverture, aucune mention particulière |
| **B** | Source active du registre · citation présente · observation à moins de 24 mois · **et au moins une adaptation déclarée** : forme approchée (même aliment, état ou variété voisine), agrégat de contributions (Open Prices, ≥ 5 observations, médiane), plage de cotation sans déciles, ou réindexation au-delà de 12 mois | Affichable, compte dans la couverture, l'adaptation est mentionnée dans le détail |
| **C** | Tout le reste : observation unique, forme rapprochée de loin, source hors registre, prix périmé, gabarit non relevé | **Ne s'affiche pas, ne compte pas dans la couverture.** L'entrée reste dans le fichier pour la traçabilité et la file de revue |

`confidence_reason` est **obligatoire** sur toute entrée : un code court qui dit
ce qui a valu ce niveau. Une confiance sans justification est refusée
(`confidence_reason_missing`) — le niveau doit être un constat, pas une opinion.

Un niveau ne peut pas dépasser ce que la source accorde
(`confidence_above_source_grant`). Open Prices est plafonné à B : ses
contributions sont volontaires, donc l'échantillon n'est représentatif de rien
en particulier, si soigneuses que soient les contributions individuelles.

**Cas particulier saisonnier.** Pour les catégories `legumes`, `fruits` et
`herbes_aromates`, un relevé ponctuel (`aggregation: "point"`) est
automatiquement C : une courgette de juillet n'est pas une courgette de janvier,
et afficher l'une pour l'autre serait faux sans être détectable. Ces catégories
exigent une moyenne, de préférence annuelle.

---

## 5. Le vieillissement

Un prix relevé en juillet 2026 ne vaut pas tel quel en janvier 2027.

### 5.1 Les deux dates

- `observed_on` — la date de **l'observation** : la semaine de cotation, le mois
  de l'indice, la date du relevé. C'est elle qui vieillit.
- `retrieved_on` — la date à laquelle **on a lu** la source. Elle sert à
  retrouver l'état de la page consultée, pas à dater le prix.

Les confondre est la faute classique : un relevé de 2024 lu aujourd'hui est un
prix de 2024. Le contrôleur refuse `observed_on > retrieved_on`.

### 5.2 Réindexation, et ses limites

Entre 12 et 24 mois, l'entrée **doit** porter un bloc `reindexation` :
l'indice des prix à la consommation de l'INSEE, **par poste COICOP** (01.1.x,
produits alimentaires), pris entre le mois de l'observation et le mois de
référence du jeu de prix. Le bloc porte la série, les deux valeurs d'indice et
le facteur — le contrôleur refait la division.

L'INSEE ne fournit **jamais un prix** : il fournit un rapport. Le registre le
dit explicitement (`grants_confidence: null`). Fabriquer un niveau de prix à
partir d'un indice serait inventer le niveau et lui donner l'apparence d'une
source publique.

### 5.3 Péremption

**Au-delà de 24 mois, le prix est périmé : il n'est plus affiché, ne compte plus
dans la couverture, et le contrôleur le refuse en A comme en B.**

Pourquoi 24 mois : un indice national par poste est un agrégat. Il porte
correctement une dérive d'ensemble sur un ou deux ans, il ne porte pas un choc
propre à un produit — l'huile de tournesol a pris plus de 60 % en 2022 quand
l'indice alimentaire d'ensemble bougeait de quelques points, les œufs ont fait
de même en 2023. Composer un agrégat sur deux ans, c'est déjà accepter que la
structure relative des prix a bougé sous l'indice. Au-delà, la réindexation
produit un nombre plausible et faux : le cas exact que le §0 proscrit. On
préfère l'absence.

Récapitulatif, en écart entre `observed_on` et `reference_date` :

| âge | traitement |
|-----|-----------|
| ≤ 12 mois | A possible, réindexation facultative |
| 12–24 mois | réindexation **obligatoire**, confiance plafonnée à **B** |
| > 24 mois | **périmé** — l'entrée passe en C, n'est pas affichée, ne compte pas |

### 5.4 Péremption du jeu entier

Le jeu de prix porte `reference_date`. Si la date d'affichage dépasse cette date
de plus de **24 mois**, la fonctionnalité s'éteint entièrement : aucun montant,
un message qui dit que le référentiel est trop ancien. Un référentiel abandonné
ne doit pas continuer à afficher des chiffres avec assurance.

---

## 6. La couverture

Décalque strict de `nutritionCoverage` (`lib/domain/nutrition/calculator.js`),
avec les mêmes conventions d'arrondi et le même `null` quand rien n'est
quantifié :

```js
priceCoverage: {
  pct: 84,            // priced / quantified × 100, arrondi à l'entier — null si quantified === 0
  quantified: 19,     // lignes à grammes > 0, exactement comme la nutrition
  priced: 16,         // lignes portant un prix retenu (A ou B, non périmé)
  unpriced: ['Safran en pistils', 'Ras el-hanout', 'Fleur de sel'],
  pctByMass: 97,      // part de la masse quantifiée qui est chiffrée
  yieldKnownPct: 41,  // part des lignes chiffrées dont le rendement est sourcé
}
```

`priced` est à la couverture prix ce que `withData` est à la couverture
nutritionnelle ; le nom change parce que « data » serait ambigu ici (une entrée
en C est une donnée, et n'est pas un prix retenu).

**Deux mesures, parce qu'une seule ment.** Le nombre de lignes traite le poivre
(2 g) et le bœuf (1,2 kg) à égalité : une recette où seul le bœuf manque
afficherait 92 % de couverture et un montant absurde. La masse corrige cela.

**Pourquoi pas une pondération par la valeur** — l'idée naturelle serait de
pondérer par le coût de chaque ligne. Elle est **circulaire** : on ne peut pas
pondérer par le coût des lignes dont on ignore justement le coût. Toute
pondération par la valeur suppose résolu le problème qu'elle prétend mesurer. On
pondère donc par ce qu'on connaît de façon certaine : le nombre de lignes et la
masse.

### 6.1 Ce que la couverture prix ne fait PAS

`materializeRecipe` pose un **bloqueur** quand `nutritionCoverage.pct !== 100`.
La couche prix **ne fait pas cela**, et c'est une divergence délibérée : une
recette dont on ignore le prix reste parfaitement cuisinable. Le décalque
s'arrête ici.

Concrètement : ne pas toucher à `materializeRecipe`, ne pas ajouter de code
d'issue prix, ne pas faire varier `eligible`. Le prix se calcule dans une couche
séparée (`lib/domain/prices/`), à partir de la recette déjà matérialisée. Une
recette sans prix est une recette, pas une erreur.

### 6.2 Achat et consommation, deux montants différents

`finalDemands` distingue déjà `exact_required_qty` (le besoin) de `purchase_qty`
(l'achat physique, arrondi au contenant via `USUAL_PACKAGES`), et publie
`projected_surplus_qty`. La couche prix garde la même distinction, avec deux
noms :

- **`coutConsomme`** — ce que le plat consomme. Assis sur les grammes exacts.
  C'est le coût par portion d'une recette.
- **`coutAchat`** — ce qu'on paie en caisse. Assis sur `purchase_qty`, donc sur
  des contenants entiers. C'est le total d'une liste de courses.

Ils ne sont pas égaux, et la différence n'est pas une erreur : c'est le surplus
qui rejoint le garde-manger. L'interface ne doit jamais présenter l'un comme
l'autre. Une liste de courses affiche `coutAchat` ; une fiche recette affiche
`coutConsomme`.

---

## 7. Le vocabulaire imposé à l'interface

### 7.1 Les mots

| Interdit | Obligatoire |
|----------|-------------|
| « Prix », « Prix total », « Coût » sec | « **Estimation** », « **Coût estimé** » |
| « 4,30 € » quand la couverture < 100 % | « **au moins** 4,30 € » |
| un montant sans date | « Référentiel prix France · **août 2026** » |
| « gratuit », « 0 € » | rien : on n'affiche pas |
| « exact », « réel », « vous paierez » | « environ », « de l'ordre de » |

La date du référentiel (`reference_date`, au mois) est **toujours visible à côté
du montant** — pas dans un repli, pas dans une infobulle seule. Un montant sans
date est une affirmation intemporelle, et un prix n'en est jamais une.

### 7.2 Les arrondis

La précision affichée ne doit jamais dépasser la précision de l'estimation. Un
panier annoncé à ± 15 % et affiché « 43,27 € » revendique une exactitude de
caisse enregistreuse qu'il n'a pas.

| montant | arrondi |
|---------|---------|
| coût par portion | 0,05 € |
| < 10 € | 0,10 € |
| 10 € – 100 € | 0,50 € |
| ≥ 100 € | 1 € |

### 7.3 Les phrases de couverture

Toujours à côté du montant, jamais dans un repli :

- couverture complète : « Estimation ≈ **7,50 €** (6,80 – 8,20 €) · 19 ingrédients sur 19 · référentiel août 2026 »
- couverture partielle : « **Au moins 6,10 €** · estimation portant sur 16 des 19 ingrédients (97 % de la masse) · non chiffrés : safran, ras el-hanout, fleur de sel »
- rendement inconnu sur au moins une ligne : ajouter « hors pertes de parage »
- confiance B présente : « estimation appuyée sur des relevés adaptés » avec le détail par ligne accessible

Le mot **« au moins »** n'est pas une précaution de style : une somme partielle
est mathématiquement un **minorant**, puisque les lignes manquantes ne peuvent
qu'ajouter. Le dire est exact, et c'est la seule formulation qui ne trompe pas.

---

## 8. Ce qu'on refuse d'afficher

1. **Aucun montant si `pct < 70` ou si `pctByMass < 90`.** À la place : « Estimation
   indisponible — N ingrédients sur M sans prix sourcé », suivi de la liste. Les
   deux seuils sont nécessaires : le seuil de masse est ce qui empêche
   d'afficher un total quand c'est la viande qui manque (elle pèse la moitié du
   plat et 1 ligne sur 12) ; le seuil de lignes est ce qui empêche d'assembler
   un total à partir d'une poignée d'ingrédients.

2. **Aucun montant issu d'une entrée en C.** Une entrée en C n'est pas une ligne
   « peu fiable » : c'est une ligne **non chiffrée**, comptée comme telle.

3. **Aucun montant si le jeu de prix a plus de 24 mois** (§5.4).

4. **Aucun classement, tri ou comparaison de recettes par prix tant que toutes
   les couvertures comparées ne sont pas à 100 %.** Une recette paraît moins
   chère quand elle est moins couverte : trier par prix des couvertures
   inégales, c'est trier par ignorance. Le tri est autorisé à l'intérieur du
   sous-ensemble à 100 %, et l'interface doit dire que le tri porte sur ce
   sous-ensemble.

5. **Aucun montant sans le nombre de lignes non chiffrées** à côté, même à 100 %
   (« 19 sur 19 » est une information, pas du bruit).

6. **Aucun prix par forme affiché isolément avec plus de 2 décimales**, et jamais
   un `per_kg` brut présenté comme « le prix du marché ».

---

## 9. Emplacement et lecture

```
data/prices/CONTRAT.md        ce document
data/prices/schema.json       schéma strict d'une entrée et du jeu de prix
data/prices/sources.json      registre des sources autorisées (esprit ops.source_datasets)
data/prices/reference-fr.json le référentiel lui-même (produit par les imports)
data/prices/exemple-gabarit.json  les deux exemples du §10, inertes par construction
scripts/data/prices/check-price-provenance.mjs   le contrôleur, appelable en CI
tests/pricing/priceContract.test.js              les tests qui verrouillent le contrôleur
```

Le référentiel est importé **au build**, comme le catalogue des formes dans
`lib/domain/recipes/canonicalCatalog.js` : un `import` statique, un index
`Map` construit une fois, figé. La couche de lecture
(`lib/domain/prices/priceCatalog.js`) ne rend **que** les entrées A et B non
périmées — le filtrage se fait à l'entrée, une fois, pas dans chaque appelant.

En CI :

```bash
node scripts/data/prices/check-price-provenance.mjs            # référentiel par défaut
node scripts/data/prices/check-price-provenance.mjs <fichier>  # un lot avant fusion
npx vitest run tests/pricing
```

Le contrôleur **refuse** (sortie non nulle), il ne signale pas. C'est une
différence assumée avec `check-arbitration-arithmetic.mjs`, qui ne fait que
signaler : un arbitrage douteux est de la prose qu'un relecteur relira, tandis
qu'un prix douteux est un nombre multiplié par toutes les recettes qui emploient
la forme, et que plus personne ne relira.

---

## 10. La structure d'une entrée, champ par champ

Le schéma qui fait foi est `data/prices/schema.json` (strict :
`additionalProperties: false` partout). Ci-dessous, la lecture commentée.

### 10.1 Le jeu de prix

| champ | oblig. | valeur |
|-------|--------|--------|
| `schema_version` | oui | `"1.0.0"` — doit égaler la version du contrat |
| `price_set_version` | oui | ex. `"2026.08"` |
| `country` | oui | `"FR"` |
| `currency` | oui | `"EUR"` |
| `reference_date` | oui | `YYYY-MM-DD` — la date à laquelle tous les prix sont ramenés |
| `derived_license` | oui | licence du référentiel produit. Si une source ODbL y entre, ODbL contamine le résultat : `"odbl-1.0"` |
| `catalog_version` | oui | version du catalogue de formes joint (`corpus_version`) |
| `built_at` | oui | date de production du fichier |
| `entries` | oui | tableau d'entrées, une par forme, sans doublon |

### 10.2 Une entrée

| champ | oblig. | valeur |
|-------|--------|--------|
| `form` | oui | le libellé **exact** du catalogue (`canonical_name`) |
| `form_normalized` | oui | la clé de jointure (`canonical_name_normalized`, via `normalizeFoodForm`) |
| `category` | oui | la catégorie du catalogue, ou `null` |
| `observed.basis` | oui | `kg` \| `l` \| `piece` |
| `observed.low/central/high` | oui | nombres > 0, `low ≤ central ≤ high` |
| `observed.unit` | oui | `EUR/kg` \| `EUR/l` \| `EUR/piece`, cohérent avec `basis` |
| `observed.dispersion` | oui | `d1_d9` \| `quoted_range` \| `min_max` |
| `observed.aggregation` | oui | `point` \| `monthly_mean` \| `annual_mean` |
| `observed.n_observations` | oui | entier ≥ 1 |
| `observed.period_start/end` | oui | bornes de la période agrégée |
| `per_kg.low/central/high` | oui | le pivot, nombres > 0, mêmes contraintes d'ordre |
| `per_kg.conversion.kind` | oui | `identity` \| `density` \| `grams_per_piece` |
| `per_kg.conversion.factor` | selon | la densité (g/ml) ou la masse d'une pièce (g) ; absent si `identity` |
| `per_kg.conversion.from` | selon | d'où vient le facteur : `catalog:<form_normalized>` |
| `edible_yield.value` | oui | dans `]0, 1]` |
| `edible_yield.known` | oui | booléen ; `false` ⇒ `value` doit valoir 1 |
| `edible_yield.provenance` | si `known` | même bloc de provenance qu'un prix |
| `confidence` | oui | `A` \| `B` \| `C` |
| `confidence_reason` | oui | code court, non vide |
| `provenance.source_code` | oui | code présent, actif et à licence vérifiée dans `sources.json` |
| `provenance.source_url` | oui | l'URL **de la page lue**, pas la racine du site |
| `provenance.license_code` / `license_url` | oui | recopiés du registre, égalité vérifiée |
| `provenance.allowed_uses` | oui | recopiés du registre |
| `provenance.retrieved_on` | oui | `YYYY-MM-DD` |
| `provenance.observed_on` | oui | `YYYY-MM-DD`, ≤ `retrieved_on` et ≤ `reference_date` |
| `provenance.citation` | oui | **le chiffre lu, dans sa phrase** — doit contenir la valeur de `observed.central` |
| `provenance.source_record_key` | oui pour A | identifiant de la ligne dans la source |
| `reindexation` | si 12–24 mois | `{ coicop, index_source, index_series, from_period, from_value, to_period, to_value, factor }` |
| `notes` | non | texte libre |

**La citation n'est pas décorative.** Elle doit porter le chiffre tel qu'il a été
lu et le libellé sous lequel la source le publie — c'est elle qui permet à un
humain de retourner à la source et de trancher. Le contrôleur vérifie que la
valeur centrale y figure littéralement (`citation_omits_figure`).

### 10.3 Exemple — « Oignon jaune cru » (base kg, conversion identité)

```json
{
  "form": "Oignon jaune cru",
  "form_normalized": "oignon jaune cru",
  "category": "legumes",
  "observed": {
    "basis": "kg",
    "low": 1.11, "central": 2.22, "high": 3.33,
    "unit": "EUR/kg",
    "dispersion": "d1_d9",
    "aggregation": "annual_mean",
    "n_observations": 52,
    "period_start": "2025-08-01",
    "period_end": "2026-07-31"
  },
  "per_kg": {
    "low": 1.11, "central": 2.22, "high": 3.33,
    "conversion": { "kind": "identity" }
  },
  "edible_yield": {
    "value": 1,
    "known": false,
    "note": "Part comestible de l'oignon non sourcée. Défaut 1,00 : l'estimation est un minorant déclaré, jamais une correction inventée."
  },
  "confidence": "C",
  "confidence_reason": "exemple_non_releve",
  "provenance": {
    "source_code": "rnm_franceagrimer",
    "source_url": "https://rnm.franceagrimer.fr/prix?<page-de-cotation-effectivement-lue>",
    "license_code": "etalab-2.0",
    "license_url": "https://www.etalab.gouv.fr/licence-ouverte-open-licence",
    "allowed_uses": { "store_raw": true, "redistribute": true, "modify": true, "attribution_required": true },
    "retrieved_on": "2026-08-24",
    "observed_on": "2026-07-31",
    "source_record_key": "GABARIT",
    "citation": "GABARIT NON RELEVÉ — chiffres synthétiques, à remplacer par la lecture réelle. Forme de la citation attendue : « Oignon jaune France cat. I, sac 5 kg — moyenne 12 mois 2,22 €/kg (D1 1,11 ; D9 3,33) »."
  },
  "reindexation": null,
  "notes": "Gabarit du contrat. Les montants 1,11 / 2,22 / 3,33 sont synthétiques et reconnaissables comme tels ; l'entrée est en C et sa citation est marquée GABARIT, donc le contrôleur la refuse et l'affichage l'ignore. Pour la passer en A : relever une moyenne 12 mois sur une page RNM datée, écrire la citation avec le chiffre lu, renseigner source_record_key, et justifier confidence_reason."
}
```

### 10.4 Exemple — « Huile d'olive vierge extra » (base litre, conversion par densité)

```json
{
  "form": "Huile d'olive vierge extra",
  "form_normalized": "huile d olive vierge extra",
  "category": "matieres_grasses",
  "observed": {
    "basis": "l",
    "low": 4.44, "central": 5.55, "high": 6.66,
    "unit": "EUR/l",
    "dispersion": "d1_d9",
    "aggregation": "monthly_mean",
    "n_observations": 18,
    "period_start": "2026-07-01",
    "period_end": "2026-07-31"
  },
  "per_kg": {
    "low": 4.83, "central": 6.03, "high": 7.24,
    "conversion": {
      "kind": "density",
      "factor": 0.92,
      "from": "catalog:huile d olive vierge extra"
    }
  },
  "edible_yield": {
    "value": 1,
    "known": true,
    "note": "Une huile n'a pas de partie non comestible : le rendement vaut 1 par nature, et non par ignorance.",
    "provenance": {
      "source_code": "myko_reasoning",
      "source_url": "data/prices/CONTRAT.md",
      "license_code": "n/a",
      "license_url": null,
      "allowed_uses": { "store_raw": false, "redistribute": true, "modify": true, "attribution_required": false },
      "retrieved_on": "2026-08-24",
      "observed_on": "2026-08-24",
      "citation": "Rendement 1,00 par nature du produit : une huile est intégralement le produit acheté."
    }
  },
  "confidence": "C",
  "confidence_reason": "exemple_non_releve",
  "provenance": {
    "source_code": "open_prices",
    "source_url": "https://prices.openfoodfacts.org/<requete-effectivement-lue>",
    "license_code": "odbl-1.0",
    "license_url": "https://opendatacommons.org/licenses/odbl/1-0/",
    "allowed_uses": { "store_raw": true, "redistribute": true, "modify": true, "attribution_required": true, "share_alike": true },
    "retrieved_on": "2026-08-24",
    "observed_on": "2026-07-31",
    "source_record_key": "GABARIT",
    "citation": "GABARIT NON RELEVÉ — chiffres synthétiques. Forme attendue : « Huile d'olive vierge extra, 18 relevés juillet 2026, médiane 5,55 €/l (D1 4,44 ; D9 6,66) »."
  },
  "reindexation": null,
  "notes": "Gabarit du contrat, base litre. Il montre la seule arithmétique délicate du référentiel : 5,55 €/l ÷ 0,92 g/ml = 6,03 €/kg. Le facteur 0,92 n'est PAS ressaisi ici, il est recopié de conversion.density_g_per_ml de la forme du catalogue, et le contrôleur vérifie l'égalité. Sans densité au catalogue, l'entrée serait refusée : on n'écrit jamais 1,00 par défaut. Source ODbL : elle impose sa licence au référentiel produit (derived_license)."
}
```

---

## 11. Questions volontairement laissées ouvertes

Elles sont écrites ici pour qu'on ne les tranche pas par accident.

- **Les tickets de caisse du foyer.** Ce serait l'observation la plus pertinente
  pour une application personnelle, et c'est aussi une donnée d'un seul magasin,
  d'un seul jour, qu'aucun tiers ne peut re-vérifier. Le registre ne la porte
  pas encore ; elle mériterait un niveau de confiance à part (« observé chez
  vous »), distinct de A/B/C, et un affichage qui le dit.
- **La distinction bio / conventionnel**, et plus généralement la gamme. Aucune
  des sources retenues ne la publie de façon exploitable pour les 329 formes.
  Tant que ce n'est pas le cas, la dispersion l'absorbe (§3.1) et l'interface ne
  prétend pas la distinguer.
- **Le rendement comestible au catalogue.** Le champ est spécifié (§2) mais le
  catalogue ne le porte pas encore. Tant qu'il n'existe pas, toutes les
  estimations sont des minorants, et l'interface le dit.
