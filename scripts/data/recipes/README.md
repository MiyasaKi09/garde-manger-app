# Écrire une recette qui tienne

Ce dossier contient la chaîne qui mène d'un nom de plat à une recette publiable.
Elle existe parce qu'une première tentative a échoué : quarante-sept recettes
avaient été écrites de mémoire, et il a fallu les retirer. Une recette de
mémoire est plausible, ce qui est exactement le problème — « Moules marinières »
était passée avec échalote, vin blanc, beurre et persil, et aucune moule.

La règle qui en découle tient en une phrase : **le dossier de sources fait
autorité, la mémoire n'en a aucune.**

## La chaîne

```
find-recipe-urls.mjs        trouver les pages qui existent vraiment
        ↓
scrape-recipe-sources.mjs   relever les faits, garder la prose hors dépôt
        ↓
audit-recipe-sources.mjs    refuser un dossier qui ne tient pas debout
        ↓
synthesize-source-quantities.mjs   ramener à la portion, prendre la médiane
        ↓
        (rédaction)
        ↓
validate-recipe-batch.mjs   vocabulaire fermé, vraisemblance, identité
check-no-copied-prose.mjs   confronter les étapes au texte source
        ↓
merge-recipe-batch.mjs      verser au corpus et reconstruire les graphes
```

### 1. Trouver les URL

```bash
node scripts/data/recipes/find-recipe-urls.mjs --plan plan.json "Veau Marengo" "Riz cantonais"
```

Deviner une adresse ne marche pas : on tombe sur un 404, ou pire sur une page
qui existe et parle d'autre chose. Le script interroge les moteurs internes de
marmiton, chefsimon et 750g — les trois sites testés qui acceptent la lecture
automatique **et** publient un balisage `schema.org/Recipe`. Les autres ont été
essayés et écartés : cuisineaz, odelices, academiedugout et lesfoodies ne
publient aucun balisage exploitable.

Il ne retient que les liens dont le slug porte tous les mots du plat. Ce filtre
protège d'un manque, pas d'un excès : chercher « gratin de poireaux » ramène
aussi un gratin de panais et un gratin au saumon. C'est l'audit qui les écarte.

### 2. Relever les sources

```bash
node scripts/data/recipes/scrape-recipe-sources.mjs plan.json --travail /chemin/hors-depot.json
```

**Le dépôt est public.** Les listes d'ingrédients et les quantités sont des
faits : une daube porte du bœuf, du vin et des olives, et personne ne possède ce
constat. Le texte des étapes est une œuvre. Le dossier versionné n'en garde donc
que l'empreinte — nombre d'étapes, longueur, condensat — qui atteste la lecture
sans la reproduire. Le texte intégral part dans le fichier `--travail`, qui ne
doit jamais entrer dans le dépôt.

Compter une attrition : selon les sites, entre un tiers et la moitié des pages
refusent la lecture ou ne portent aucun balisage.

### 3. Auditer le dossier

```bash
node scripts/data/recipes/audit-recipe-sources.mjs [slug…]
```

Trois exigences, et la raison de chacune :

- **deux sources solides sur deux sites distincts.** Une seule version publiée
  n'est pas un fait vérifié, c'est le choix d'un auteur ; deux versions du même
  site non plus, c'est la même rédaction.
- **le titre porte les mots du plat, et pas ceux d'un autre.** « Pâtes au thon et
  à la tomate » a ramené un gratin, une salade et des mini-quiches : trois plats
  différents contenant tous des pâtes, du thon et de la tomate. Les synonymes
  légitimes — « spaghetti » pour pâtes, « bœuf mode » pour bœuf-carottes — se
  déclarent dans `ALIAS`, ils ne se devinent pas.
- **des quantités chiffrées**, sans quoi aucune médiane n'est possible.

Une source faible n'invalide pas le dossier : elle est écartée du calcul, et il
faut qu'il en reste assez derrière.

### 4. Synthétiser les quantités

```bash
node scripts/data/recipes/synthesize-source-quantities.mjs --tous --json synthese.json
```

Sept sites donnent sept versions : 1,2 kg de veau pour six ici, 800 g pour
quatre là. Aucune n'est « la » recette. On ramène chaque source à la portion et
on prend la **médiane** — pas la moyenne : une source qui compte en pièces ce que
les autres pèsent en grammes ne doit pas déplacer le résultat.

Le script **propose** un rapprochement vers le catalogue, il ne tranche pas. Un
arbitrage silencieux est une erreur qu'on ne retrouve jamais, alors les lignes
sans forme connue ressortent au lieu de disparaître.

Le rapprochement d'un texte libre vers une forme canonique est la partie fragile.
Les erreurs déjà commises sont consignées et rejouées :

```bash
node scripts/data/recipes/check-source-reading.mjs
```

Elles valent d'être connues, parce qu'aucune ne se voit dans un chiffre : des
pommes devenues des pommes de terre dans le seul plat où la pomme est la
signature ; des flageolets devenus des spaghettis, seul mot commun « secs » ; un
gigot rôti rattaché à de l'agneau haché ; du cidre lu comme du vinaigre de cidre,
soit 30 cl de vinaigre dans une cocotte.

Quand une ligne ne trouve rien, deux issues seulement — jamais l'invention :

- **un écart de vocabulaire** (« maïzena » pour la fécule de maïs, « nuoc mam »
  pour la sauce poisson) se règle par un synonyme de lecture. Créer une forme
  dupliquerait le concept, et les graphes de diversité du planificateur ne
  rapprochent pas deux synonymes ;
- **une absence réelle** part en arbitrage dans `data/foods/arbitrations/`, avec
  une note qui dit pourquoi cette entrée Ciqual et pas une autre.

### 5. Écrire

La spécification que suit un rédacteur — humain ou agent — décrit le schéma
exact, le vocabulaire fermé et les rôles d'assiette. Quantités issues des
médianes, méthode **reformulée**.

### 6. Valider avant de verser

```bash
node scripts/data/recipes/validate-recipe-batch.mjs lot.json
node scripts/data/recipes/check-no-copied-prose.mjs /chemin/vers/sources-integrales
```

Le validateur vérifie le schéma, le vocabulaire fermé, la vraisemblance
nutritionnelle et l'identité du plat. Deux contrôles méritent d'être expliqués :

- **l'ingrédient principal.** Si le premier mot du nom désigne un aliment, cet
  aliment doit être dans la liste. C'est le contrôle né des moules sans moules.
- **la pesée incomplète.** Un ingrédient tout juste arbitré n'a pas encore de
  masse au catalogue. On ne totalise pas sans lui : la poule au pot ressortait à
  215 kcal la part, sa poule non comptée, et passait les bornes grâce à ses
  légumes. Le contrôle est différé et le chiffre n'est pas affiché.

Le second script confronte les étapes publiées au texte source et signale toute
suite de huit mots identiques. En dessous de huit, la langue de cuisine produit
des collisions inévitables ; au-delà, la coïncidence n'explique plus rien. Il a
pris en défaut deux des six premières recettes écrites à la main.

### 7. Verser au corpus

```bash
node scripts/data/recipes/merge-recipe-batch.mjs lot.json
node scripts/data/foods/build-recipe-food-corpus.mjs
node scripts/data/recipes/export-authoring-vocabulary.mjs
```

L'ordre compte. Le catalogue ne porte que les formes qu'une recette emploie
déjà : un ingrédient arbitré n'y apparaît qu'après fusion et reconstruction.
C'est pourquoi une recette qui en emploie un passe d'abord « valide avec
réserve », et doit être revalidée après.

## Deux erreurs à ne pas refaire

**Une clé d'arbitrage doit se déduire du nom de la forme.** Le registre est
interrogé par le nom normalisé qu'emploie une recette. « Poule crue » déclarée
sous la clé « poule viande crue » produit une entrée que personne n'ira
chercher : l'arbitrage semble appliqué, l'ingrédient reste introuvable.
`apply-recipe-food-mappings.mjs` refuse désormais ce cas.

**Un poids de boucherie n'est pas un poids comestible.** Les sources annoncent un
gigot de 1,8 kg, os compris, quand la référence nutritionnelle porte sur la
chair. Déclaré tel quel, le plat montait de 634 à 736 kcal la part. La quantité
déclarée est le rendement en viande ; l'instruction d'achat reste 1,8 kg.

## Écrire une variante

Une variante annoncée n'était qu'une phrase : « Version aux poireaux dominants ».
On ne pouvait pas cliquer dessus, pas la planifier, et surtout pas la peser — le
corpus ne savait pas ce qu'elle changeait. Elle devient une recette à part
entière, obtenue en appliquant à sa base un **delta structuré**.

```bash
node scripts/data/recipes/derive-variant-recipes.mjs data/recipes/derivations/lot1.json --lot lot.json
node scripts/data/recipes/validate-recipe-batch.mjs lot.json
node scripts/data/recipes/merge-recipe-batch.mjs lot.json
```

La dérivée passe ensuite par la même validation que n'importe quelle recette :
vocabulaire fermé, vraisemblance nutritionnelle, ingrédient principal.

### Le delta

```json
{
  "code": "SRC-008-D3", "base": "SRC-008",
  "family": "Blanquette de dinde sans crème",
  "variant_label": "Version allégée sans crème : …",
  "rationale": "Sans crème la sauce perd son velouté…",
  "operations": [
    { "op": "remove", "form": "Crème fraîche liquide entière" },
    { "op": "set", "form": "Bouillon de volaille", "quantity": 400 }
  ],
  "steps": [{ "op": "replace", "n": 7, "instruction": "…" }]
}
```

Cinq opérations sur les ingrédients — `remove`, `add`, `substitute`, `scale`,
`set` — et trois sur les étapes — `replace`, `insert`, `remove`. Tout ce que le
delta ne dit pas est hérité : si la base corrige ses quantités, ses variantes
suivent.

### Ce que le moteur refuse, et pourquoi

- **une étiquette que la base n'annonce pas.** Une variante inventée serait une
  recette de mémoire entrée par la porte de derrière.
- **une opération qui vise un ingrédient absent.** Elle ne ferait rien : la
  « variante » serait la copie exacte de sa base sous un autre nom.
- **un delta qui ne change rien** — facteur d'échelle 1, quantité identique.
- **un retrait dont les étapes parlent encore.** C'est le contrôle qui compte :
  retirer les lardons en gardant « faire rissoler les lardons » donne une
  recette dont la nutrition est juste, le vocabulaire propre, et le plat
  infaisable. Quand le mot désigne réellement autre chose — le jaune d'œuf *cru*
  d'une mayonnaise et les jaunes *durs* qu'on tamise — il faut le déclarer dans
  `homonymes`, avec sa raison.
- **un ajout qu'aucune étape n'emploie.** Il pèserait sur la nutrition sans
  jamais arriver dans l'assiette.
- **une forme dupliquée dans la base.** Deux lignes de thym frais rendent la
  cible ambiguë : c'est la base qu'il faut corriger.
- **une dérivation en cascade.** Une dérivée ne dérive pas d'une dérivée, sinon
  la lignée devient un arbre et « ces deux plats sont-ils le même ? » n'a plus
  de réponse locale.

### La lignée, au planificateur

Une dérivée porte son propre code : tous les compteurs par recette la voient
comme un plat sans rapport avec sa base. La **lignée** — `derived_from` ou, à
défaut, le code lui-même — corrige cela. Deux recettes de même lignée ne
peuvent pas figurer dans la même semaine, et le délai de retour d'un plat se
compte sur sa lignée entière. Pour une recette non dérivée, lignée et code sont
confondus : la règle ne change rien au reste du corpus.

### Ce qui reste une phrase

Toutes les variantes annoncées ne deviennent pas des recettes, et c'est voulu.
Trois motifs d'écart, chacun légitime :

- **la suggestion de service.** « Servie sur de fines tuiles de pain grillé »
  ne change ni ingrédient ni méthode : elle décrit ce sur quoi on pose le plat.
- **la préférence de cuisson.** « Prolonger la cuisson de l'œuf de deux minutes »
  règle un point de cuisson, pas une recette.
- **l'ingrédient absent du catalogue.** Une variante qui réclame une noisette,
  un pied de veau ou un jambonneau ne s'écrit pas tant que la forme n'est pas
  arbitrée : la remplacer par un voisin fausserait la nutrition en silence, et
  l'écrire sans elle donnerait une recette qui ne correspond plus à son
  étiquette.

Le troisième motif est le seul qui se résorbe : il attend un arbitrage, pas une
décision éditoriale. Les formes qui bloquent aujourd'hui sont consignées dans
les champs `note` des lots de dérivations.

### Confronter le delta à ce qu'il promet

```bash
node scripts/data/recipes/check-derivation-matches-label.mjs --tous
```

Le moteur vérifie qu'un delta est cohérent ; il ne vérifie pas qu'il fait ce
qu'il ANNONCE. Une variante étiquetée « doubler le poireau et réduire la carotte
de moitié » dont le delta ne touche que la carotte passe tous les contrôles :
elle est cohérente, elle est simplement fausse. Ce script lit l'étiquette comme
une consigne et cherche l'opération en face.

Il **signale**, il ne refuse pas — une étiquette est de la prose, et le delta
peut la tenir avec d'autres mots. Ses heuristiques ont d'ailleurs dû être
corrigées plusieurs fois avant d'être lisibles : le pain d'épices était compté
comme une épice, le piment doux d'Anglet comme un condiment, un œuf pour quatre
parts comme une quantité dérisoire, et « ajouter aux oignons des tomates » comme
un ajout d'oignons. Un contrôle qui crie à chaque ligne ne se lit plus ; les cas
corrigés sont verrouillés dans `tests/data/checkDerivationLabel.test.js`.

## Reprendre une recette du corpus historique

Les 309 recettes d'origine ont été écrites sans dossier de sources : aucune n'en
a, 281 n'ont pas d'arbitrage canonique, et la médiane est de **quatre étapes**
dont la moitié font moins de soixante signes. Les reprendre au propre, c'est leur
faire passer la même chaîne que les recettes sourcées — mais le résultat REMPLACE
la recette au lieu de s'ajouter à elle.

```bash
node scripts/data/recipes/find-recipe-urls.mjs --plan plan.json "Soupe à l'oignon gratinée"
node scripts/data/recipes/scrape-recipe-sources.mjs plan.json --travail /hors-depot.json
node scripts/data/recipes/audit-recipe-sources.mjs
node scripts/data/recipes/synthesize-source-quantities.mjs --tous --json synthese.json
        (rédaction, avec « remplace »)
node scripts/data/recipes/validate-recipe-batch.mjs lot.json
node scripts/data/recipes/check-arbitration-arithmetic.mjs lot.json
node scripts/data/recipes/merge-recipe-batch.mjs lot.json
```

### Relire l'arbitrage, et pourquoi il fallait un contrôle

```bash
node scripts/data/recipes/check-arbitration-arithmetic.mjs data/recipes/batches/*.json
node scripts/data/recipes/check-arbitration-arithmetic.mjs --corpus
```

L'arbitrage canonique est le cœur du travail éditorial : il dit ce que le dossier
montre, où les sources divergent, et ce qu'on a tranché. **Rien ne le relisait.**
Le validateur regarde la forme, le contrôle de prose regarde la recopie, la
synthèse propose des quantités — aucun ne relit l'arbitrage. Et un arbitrage faux
coûte plus cher qu'une quantité fausse, parce que c'est lui qui sert de preuve au
relecteur suivant.

Le batch 3 a montré la famille de fautes. Deux réfuteurs indépendants, sur des
lots différents, ont trouvé les mêmes deux choses :

- **des arbitrages qui se contredisent en arithmétique.** « médiane 72 g par
  personne, soit 400 g » pour six parts : 72 × 6 fait 432. Le relecteur qui refait
  le calcul ne sait plus si c'est la médiane ou le total qui est faux.
- **des décomptes de sources recopiés du tableau de synthèse** au lieu d'être relus
  sur le dossier. Le script rapproche parfois à faux — le piment de Cayenne rangé
  sous « poivre noir moulu », « 4 filets de poulet » sous « filet mignon de porc »,
  « 1 sachet de gruyère râpé 200 g » lu comme un sachet de huit grammes — donc le
  nombre de sources qu'il rattache à une ligne n'est pas celui du dossier. Le
  dénominateur, lui, est vérifiable exactement.

Il **signale**, il ne refuse pas : un arbitrage est de la prose, et un écart peut
être une décision assumée ailleurs dans le paragraphe. Trois tournures justes ont
dû lui être apprises avant qu'il ne soit lisible — « médiane 2 cuillerées, soit
30 g » (l'unité de comptage n'est pas une masse par personne), « la médiane est 45.
On descend à 40 g, soit 160 g » (un écart énoncé est une décision, et 40 × 4 fait
bien 160), et « six pages sur trois sites » (une répartition, pas une fraction).
Elles sont verrouillées dans `tests/data/checkArbitrationArithmetic.test.js`.

Une réserve à connaître : sur les 295 arbitrages du corpus, seuls trois emploient
la tournure arithmétique contrôlée. Les recettes des batchs 1 et 2 écrivent des
arbitrages plus courts, qui ne montrent pas leur calcul — le contrôle n'a donc
presque aucune prise sur elles, et leur silence n'est pas un quitus. Les quinze
fractions « N sources sur M » qu'elles portent, en revanche, sont toutes justes.

### Ce que « remplace » exige

Une recette reprise porte `"remplace": "<son propre code>"`. Trois règles, et la
raison de chacune :

- **elle garde le code de la recette qu'elle remplace.** Le planning et
  l'historique des repas s'y réfèrent ; lui donner un code neuf orphelinerait ce
  qui a déjà été cuisiné.
- **la cible doit exister.** Un remplacement qui se trompe de code est un
  remplacement qui n'a pas regardé — même règle que pour les arbitrages
  d'ingrédients.
- **renommer est permis, pas usurper.** « Soupe à l'oignon » peut devenir « Soupe
  à l'oignon gratinée », mais pas prendre le nom qu'une autre recette porte déjà.

Les trois maillons de la chaîne appliquent la même règle : le moteur de
dérivation (drapeau `--reprendre`), le validateur, et le versement. Ils ont dû
être alignés un par un — le versement savait reprendre quand les deux autres
refusaient encore pour doublon de code, ce qui rendait la reprise impraticable.

### La limite de la chaîne, à connaître avant de choisir un lot

Le sourçage interroge les moteurs internes de marmiton, chefsimon et 750g. Ce
sont des sites français : ils couvrent largement la cuisine française et les
classiques internationaux, beaucoup moins un *cong you bing* ou un *kenyan beef
wet fry*. Un lot se compose donc en soumettant plus de plats que nécessaire et en
gardant ceux qui rendent assez de sources — deux solides sur deux sites
distincts. Les plats que ces trois sites ne couvrent pas ne se reprennent pas par
cette chaîne, et le dire est plus honnête que d'écrire de mémoire.

## Retirer une recette du corpus

```bash
node scripts/data/recipes/merge-recipe-batch.mjs --retirer FR-007 --motif "…"
```

C'est la seule opération du versement qui soustrait, et elle ne s'emploie que
pour un doublon ou une fiche qu'aucun dossier ne soutient. **Elle n'efface rien
en base.** Le chargeur remplace ce qu'il porte et laisse le reste : une recette
sortie du dépôt garderait sa ligne, toujours offerte au catalogue et au
planificateur. Le retrait la **marque** — `quality_level = 'D'`, qui la sort du
catalogue éditorial (A et B seulement), et `planning_eligible = false`, qui la
sort du planificateur — et écrit le motif dans `eligibility_issues`, là où
l'application lit déjà les raisons de non-éligibilité.

Marquer plutôt qu'effacer, c'est le point. Des repas déjà planifiés référencent
la recette, et chacun garde son **instantané d'exécution** — ingrédients, étapes
et nutrition figés au moment de la planification — qui le rend lisible sans elle.
La supprimer orphelinerait ce qui a déjà été cuisiné.

Le registre `data/recipes/retraits.json` survit au corpus, qui ne garde que ce
qu'il porte : c'est lui que le chargeur relit à chaque génération pour réémettre
la marque. Le retrait est donc rejouable et idempotent.

Trois refus, chacun contre un corpus incohérent plutôt que contre un caprice :

- **un code absent du corpus** — se tromper de code, c'est retirer sans regarder.
- **un retrait sans motif** — six mois plus tard on saurait qu'un plat a disparu,
  pas pourquoi, donc on ne pourrait ni le défendre ni le refaire.
- **une base dont des variantes dérivent** — les laisser sans parent, c'est les
  priver de ce qui les calcule. Les retirer d'abord, ou renoncer.

Retirer une recette n'est pas une décision technique : le mécanisme s'arrête là,
l'arbitrage revient à l'utilisateur.
