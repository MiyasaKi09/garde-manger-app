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
