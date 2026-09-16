# Plan — finir Myko

> Ce document est le plan d'exécution. Il dit dans quel ordre travailler,
> pourquoi cet ordre, ce qu'on livre exactement, à quel chiffre on saura que
> c'est fait, et ce qu'on décide de ne pas faire. Il est écrit le
> **16 septembre 2026**.
>
> Deux règles de lecture, valables partout :
> — toute affirmation sur Myko porte son **chemin de fichier** et a été
>   revérifiée pendant la rédaction, jamais déduite d'un nom de fichier ni
>   recopiée d'un document antérieur ;
> — toute affirmation sur Jowzi, Jow ou un concurrent porte son **URL**, et dit
>   quand le chiffre vient de l'éditeur. Ce qui n'a pas pu être lu est dit non
>   lu, pas complété par vraisemblance.

## Ce que ce document est, et ce qu'il n'est pas

`docs/PLAN_PLANNING_PARFAIT.md` (3 septembre 2026) reste la **référence de
qualité** : ses quatorze critères P1–P16 et ses sept chantiers C0–C7 ne sont ni
remplacés ni renumérotés. Ce plan-ci le **prolonge** sur trois points :

1. **Il dit ce qui est fait.** C1 est terminé et vérifié ; 48 jumeaux
   végétariens sont versés ; le corpus est à 754 recettes dont 568 publiables.
2. **Il ajoute une cause racine que le plan de septembre ne pouvait pas voir**,
   parce qu'elle n'est pas dans le moteur mais dans le **tuyau entre la base et
   le moteur** (§0.3). Cette découverte réordonne les chantiers : elle rend C4.1
   et une moitié de C2.2 littéralement inexécutables tant qu'elle n'est pas
   traitée.
3. **Il répond à la demande du foyer** — « atteindre le niveau de Jowzi, et
   aller beaucoup plus loin » — en disant précisément où est le niveau de
   Jowzi, ce qui s'égale, ce qui ne s'égale pas, et où « beaucoup plus loin »
   est un fait de structure et non un slogan.

Ce qu'il ajoute en propre : deux critères, **P17** (la liste de courses sort de
l'application) et **P18** (un chiffre affiché est calculé ou absent), déclarés
comme des ajouts. Les quatorze critères du §1 du plan de septembre restent la
référence contractuelle ; P17 et P18 s'y ajoutent, ils n'en remplacent aucun.

---

## §0 — Trois corrections à faire avant de commencer

Un plan bâti sur une prémisse fausse se replanifie. Trois éléments ne résistent
pas à la vérification, et il vaut mieux le dire maintenant.

### 0.1 — Jowzi n'a pas été « lancée le 16 juin 2026 »

Trois dates coexistent et il faut les distinguer :

| Date | Ce qui s'est passé | Source |
|---|---|---|
| 16 juin 2026 | **Keynote d'annonce.** La page datée sur jowzi.ai ne contient aucun texte : un titre, une vidéo intégrée, la navigation. | [jowzi.ai/fr/fr/keynote](https://jowzi.ai/fr/fr/keynote) |
| 16 juillet 2026 | **Première publication iOS.** | [API Apple](https://itunes.apple.com/lookup?id=6759919620&country=fr) |
| 8 septembre 2026 | **Lancement officiel grand public**, titre du communiqué sur ses cinq pages. | [Communiqué Jow](https://static.jow.fr/jowzi/pdf/27_08_CP_Jowzi_B2C.pdf) |

Au 16 septembre 2026, Jowzi a donc **deux mois d'existence publique sur l'App
Store et huit jours de lancement grand public** — 23 notes sur l'App Store
France (4,17/5), « 5 k+ » téléchargements Android et **aucune note affichée** sur
Google Play. Ce n'est pas un géant à rattraper : c'est un pari très bien financé
qui vient de sortir. Et il n'existe **aucune feuille de route publique** — pas
une enseigne nouvelle annoncée, pas une date américaine, pas une enseigne
américaine nommée nulle part. Il ne faut donc rien en deviner.

### 0.2 — La contrainte « robots.txt interdit /panier et /commande » est fausse

Elle circulait comme « déjà mesurée dans ce dépôt ». Elle ne l'est pas :
`grep -rli "robots.txt"` sur les `.md` du dépôt ne renvoie rien. Et la mesure
directe la contredit :

- `carrefour.fr/robots.txt`, lu intégralement le 16 septembre 2026, n'interdit
  **ni `/panier`, ni `/commande`, ni `/courses`, ni `/drive`**. Pour
  `User-agent: *` il ne contient que `/set-store`, `/get-store`, `/webview`,
  `/g`, `/b`. ([carrefour.fr/robots.txt](https://www.carrefour.fr/robots.txt))
- `intermarche.com/robots.txt` n'interdit **aucun chemin de panier**, mais
  interdit `/api/*`, `/recherche/*`, `/rechercheproduits/*`, `/catalog/*` et
  `/accueil/drive-catalogue/*` — c'est-à-dire exactement le **catalogue** dont
  dépendrait une fonction de prix ou de disponibilité.
  ([intermarche.com/robots.txt](https://www.intermarche.com/robots.txt))

**La conclusion ne change pas — la voie panier reste fermée — mais la vraie
barrière est ailleurs et elle est plus solide qu'un fichier robots.** Elle est
contractuelle, et le §3.3 la détaille. Il fallait le corriger avant de s'appuyer
dessus, parce qu'une barrière mal nommée est une barrière qu'on croit pouvoir
contourner.

### 0.3 — La cause racine n'est pas dans le moteur : elle est dans le tuyau

C'est le constat neuf de ce plan, et le plus lourd.

Le planificateur de production lit la base par une RPC,
`get_operational_recipe_catalog_v3`. Cette RPC **ne publie pas quatre champs
dont le moteur a besoin pour décider**. Vérifié ligne à ligne dans
`supabase/migrations/20260715190000_v3_operational_recipe_api.sql` :

| Champ | Publié par la RPC opérationnelle ? | Conséquence en production |
|---|---|---|
| `origin` (origine biologique de la forme) | **Non** — le seul « origin » du fichier est `cuisine_origin`, le pays | Rustiné depuis le JSON (ci-dessous) |
| `conservationProfile` | **Non** — et le mot n'existe dans **aucune** migration du dépôt | Rustiné depuis le JSON |
| `ingredient.component` | **Non** (0 occurrence) — seules les RPC **éditoriales** le publient (`20260715214547:192`, `20260729140000:255`) | **Rien ne le rustine.** `sharedBases.js` est aveugle en production |
| `derivedFrom` (la lignée) | **Non** (0 occurrence de `derived`, `lineage` ou `parent`) | **Rien ne le rustine.** Toute recette est sa propre lignée |

Deux de ces quatre champs sont rattrapés par un raccord que le code documente
lui-même, `lib/domain/recipes/operationalCatalog.js` : l'origine ligne 13
(« sans ce raccord, chaque ingrédient servi par l'API serait 'inconnu' et
**plus aucun plat ne serait végétarien en production** ») et la conservation
ligne 25. Ces deux raccords lisent `data/recipes/corpus-v3.json`, **importé au
build**. Autrement dit : C1 est fait dans le dépôt, mais il ne tient en
production qu'à un fichier de 6,7 Mio embarqué dans le bundle — et « servir le
corpus hors bundle », que le plan de septembre pose comme prérequis avant le
millième de recette, **casserait aujourd'hui le végétarien**.

Les deux autres ne sont rattrapés par rien, et c'est ce qui rend deux chantiers
inexécutables en l'état :

- **`component` manquant ⇒ C4.1 est mort-né.** On peut poser 120
  `ingredient.component.code` au corpus : `lib/domain/planning/sharedBases.js`
  (509 lignes, testé, câblé dans le solveur) n'en verra aucun sur le chemin de
  production. Le fichier le dit lui-même dans son en-tête (`sharedBases.js:29`) : c'est
  `get_editorial_recipe_catalog_v3` qui publie `ingredient.component`. Le
  planificateur, lui, appelle l'opérationnelle.
- **`derivedFrom` manquant ⇒ P7 est inatteignable en production.**
  `recipeLineage()` (`closedLoopPlanner.js:777-779`) lit
  `recipe.derivedFrom || recipe.derived_from || recipe.code` : faute des deux
  premiers, **toute recette est sa propre lignée**. Mesuré : sur le chemin JSON,
  **275 des 568 recettes** portent une lignée distincte de leur code, et
  **48 jumeaux sur 48** ; sur le chemin base, **zéro**. La règle
  `recipe_lineage_repeat`, le `variant_kind: *_lineage` et le refus de
  substitution hors lignée sont donc, en production, du code qui ne peut pas
  s'exécuter.

À quoi s'ajoute le plafond déjà connu : `LIMIT greatest(1, least(coalesce(
p_limit, 100), 100))` (ligne 108) est **doublement dur**, et les **deux** sites
d'appel passent sans limite ni pagination — `app/api/planning/generate-v3/route.js:464`
et `app/api/planning/alternatives/route.js:106`. Mesuré en base le
16 septembre : **324 recettes qualifient, 100 sont rendues**, triées
`ORDER BY code`, et parmi ces cent il y a **0 code `JUM-`, 0 `SRC-`, 0 `VAR-`**
(préfixes servis : DESS, EGG, FR, IND, IT, LEV, MED, MX, PROT, REAL).

**C'est pourquoi ce plan commence par le contrat opérationnel et non par une
fonctionnalité.** Tout ce qu'on ajouterait avant travaillerait sur 92 plats,
sans lignée et sans bases partagées.

---

## §1 — Jowzi en une page

### Ce que c'est

Un agent de courses en langage naturel, édité par Jow SAS (17 rue de Lancry,
75010 Paris), gratuit au téléchargement, disponible chez **Carrefour,
Intermarché et Chronodrive** — « +10 000 magasins » *selon Jow*, un chiffre que
l'éditeur ne porte pas au même périmètre selon la source : la fiche App Store
écrit « Disponible partout en France dans +10 000 magasins Carrefour, Intermarché
et Chronodrive », le communiqué « près de 10 000 supermarchés **en France et aux
États-Unis** ». On ne le retient donc pas pour la France seule. Aucune autre
enseigne française n'est nommée, et **aucune enseigne américaine nulle part** :
ni dans le communiqué, ni sur `jowzi.ai/us/en`, ni sur la fiche App Store
américaine, qui sert la description **française** non localisée et n'a
**aucune note**. ([API Apple](https://itunes.apple.com/lookup?id=6759919620&country=fr))

### Ce qu'il fait

C'est la fiche store qui le décrit, faute de mieux : `jowzi.ai` est une
application à page unique quasi vide, sans description fonctionnelle publique.

| Fonction | Ce qu'elle fait, selon l'éditeur |
|---|---|
| **Prompt** | Écrit **ou** note vocale. Jowzi « crée votre menu de la semaine et votre panier prêt à être commandé dans votre supermarché habituel en drive ou en livraison ». |
| **Mémo** | On ajoute des produits au fil de la semaine ; Jowzi « recommande les meilleures options disponibles ». |
| **Mode collaboratif WhatsApp** | Chacun envoie ses besoins, ajout automatique au Mémo. Bouton « Ping la famille ». |
| **Super-Recherche** | On dicte, écrit ou colle toute sa liste ; découpage en mots-clés, recherches en parallèle. |
| **Liste Magique** — « Magic list » chez [Linéaires](https://www.lineaires.com/la-distribution/jow-lance-son-agent-de-courses-ia-jowzi), « les listes magiques » dans le communiqué | Rangement des achats fréquents et des produits préférés, pour « les produits du quotidien peu impliquants ou le non-alimentaire ». L'organisation « par pièce de la maison (cuisine, salle de bains, chambre), par moment de la journée […], par membre du foyer » est la description du journaliste, **pas** une citation de Jow ; J.-E. Sabatier, PDG, y est cité pour « on crée littéralement vos placards personnalisés ». Ce n'est **pas** un inventaire du foyer. |
| **Questionnaire d'entrée** | « composition du foyer : nombre de personnes, régimes alimentaires, goûts, équipements de cuisine » ([communiqué](https://static.jow.fr/jowzi/pdf/27_08_CP_Jowzi_B2C.pdf)). |

Promesses chiffrées, **toutes de l'éditeur, aucune vérifiée par un tiers dans
les sources lues** : courses « en moins de 5 minutes, contre plus de 2 heures en
magasin » ; « 80 % des achats pouvant être réalisés automatiquement » ; « plus
de 5 000 recettes » ; « 10 % d'économies en moyenne » ; « plus aucun gaspillage
grâce aux quantités ajustées à votre foyer ». À noter, sur le nombre
d'utilisateurs de Jow : la fiche Jowzi dit 10 millions, la page d'accueil de
jow.fr lue le 16 septembre dit **8 millions**, Wikipédia dit ~9 millions. Trois
chiffres de l'éditeur, aucun vérifiable. On n'en cite aucun sans dire lequel.

### Avec quel modèle — et c'est là le vrai sujet

Trois briques, **aucune accessible à un développeur seul**.

1. **Juridique.** Article 9 des CGU : « conformément aux […] articles 1984 à
   1997 du code civil et la loi du 29 janvier 1993, l'Utilisateur donne
   **Mandat** à JOW afin qu'il procède, en son nom et pour son compte, à la
   connexion sur le site de vente en ligne du Marchand **en utilisant les
   Identifiants Marchand de l'Utilisateur** ». S'y ajoute un mandat de
   **portabilité RGPD article 20** pour aspirer chez le marchand l'historique
   d'achats qui alimente la personnalisation.
2. **Technique.** Le PDG écrit lui-même que « since grocers lacked the necessary
   APIs, Jow built day one an extensive, normalized integration layer across
   multiple retailers ». Pas d'API publique : des connecteurs négociés.
3. **Économique.** L'utilisateur paie **0,99 € TTC par commande**, affichés
   **fondus** avec les frais du marchand dans une seule ligne « Frais de
   préparation / de service » (CGU art. 8). Et **le choix des produits est
   vendu** : l'eVP Partenariats de Jow explique que Jowzi permet aux enseignes
   « de prioriser certains produits » et aux marques « la mise au panier
   automatique de leurs produits. Jowzi c'est l'app qui pilote la demande »
   ([Linéaires](https://www.lineaires.com/la-distribution/jow-lance-son-agent-de-courses-ia-jowzi)).

### Ses limites, écrites par ses propres CGU

- « JOW est soumis à une obligation générale de moyens et n'est tenu
  d'**aucune obligation de résultat** ».
- Les systèmes d'IA « peuvent comporter des limites intrinsèques, parmi
  lesquelles : hallucinations (génération d'informations inexactes ou fictives),
  biais, erreurs de classification, omissions, **mauvaise interprétation d'un
  Prompt**, propositions inadaptées au contexte ou aux préférences réelles ».
- Avant validation, « l'Utilisateur s'engage à **vérifier** le contenu de son
  panier et la nature des Produits proposés (quantités, conditionnement, prix,
  ingrédients, allergènes) ».
- Et la clause décisive : « **Les suggestions de Recettes ou de Produits
  générées par l'Agent ne constituent en aucun cas un avis médical, diététique
  ou nutritionnel.** » Jow « décline toute responsabilité à raison d'une
  réaction allergique, intolérance, atteinte sanitaire ou conséquence
  diététique ».
- L'application est « déployée sous la forme d'une **version exploratoire**
  auprès d'un panel exclusif d'utilisateurs », et ni la gratuité ni la
  commission à 0,99 € ne sont garanties après le pilote.

*Réserve d'honnêteté sur cette source.* Ce texte a été lu intégralement
(~150 000 caractères) à l'adresse
[jow.fr/lp/misc/cgu-v8-20260518](https://jow.fr/lp/misc/cgu-v8-20260518), il
nomme lui-même « l'Application JOWZI » et « les Systèmes d'IA de JOWZI », et
c'est l'adresse vers laquelle jowzi.ai renvoie. Mais **aucune page de CGU
hébergée sur jowzi.ai n'a pu être ouverte** (`/terms` redirige — 307 — vers
`/us/en/terms`, qui renvoie 404 ; le lien « CGU » du site pointe lui-même vers
jow.fr), et le
document est daté du 18 mai 2026, donc antérieur au lancement du 8 septembre.
Il est possible qu'une version plus récente existe et n'ait pas été lue.

### Le silence qui définit notre terrain

Recherche plein texte dans ces CGU intégrales : **« stock » 0, « garde-manger »
0, « frigo » 0, « réfrigérateur » 0, « péremption » 0, « DLC » 0, « batch » 0,
« protéine » 0, « calorie » 0**. « Nutri » apparaît une fois — dans la clause
qui refuse l'avis nutritionnel. Le seul « batch cooking » du corpus lu est une
**étiquette de recette**, à côté de « airfryer » et « sans gluten ». Les
quantités sont « ajustées à votre foyer », **jamais à la personne**.

Ce n'est pas un oubli de version 1. C'est une position cohérente avec le
modèle, et c'est ce qui rend l'avantage de Myko structurel plutôt que
temporaire : **le revenu de Jowzi est une commission sur le panier plus la mise
au panier vendue aux marques. Proposer de cuisiner ce qu'on a déjà fait baisser
ses deux sources de revenu.** Un concurrent mieux financé peut copier une
fonctionnalité ; il ne copie pas une fonctionnalité qui réduit son chiffre
d'affaires.

### Ce qu'en disent ses utilisateurs

Neuf avis textuels au total : trop peu pour une statistique, assez pour lire ce
qu'on attendait. Le plus utile est l'avis **3 étoiles du 1er septembre 2026**,
signé « Aurel-Minet », parce qu'il écrit sans le savoir le cahier des charges de
Myko ([flux RSS officiel Apple](https://itunes.apple.com/fr/rss/customerreviews/id=6759919620/sortBy=mostRecent/json)) :

> « nous sommes deux. Nous mangeons le même repas, mais avec des portions
> différentes selon nos besoins. Je fais beaucoup de sport et j'ai un objectif
> physique précis, alors que ma compagne est beaucoup moins sportive » ·
> « Certains jours nous ne mangeons pas à la maison, donc il faut
> automatiquement retirer ces repas du panier » · « Si plusieurs recettes
> utilisent du poulet, des tortillas, du fromage ou des légumes similaires,
> JOWZI devrait volontairement sélectionner les recettes afin de mutualiser les
> ingrédients et **finir les paquets plutôt que d'accumuler des restes** ».

Son verdict d'usage : « J'ai essayé plusieurs formulations très simples […]
**Dans les deux cas, JOWZI ne m'a proposé aucune recette.** »

Les deux autres critiques : « il s'agit juste de la même app remise à la sauce
AI » (1★, 14 août) et un parcours d'entrée bloqué — « dernière page: les
enseignes. Plus rien à valider, impossible d'avancer » (1★, 28 août). Les avis
positifs ne citent spontanément que trois choses : le gain de temps,
l'apprentissage des préférences, et « la fonctionnalité WhatsApp avec le Mémo ».

**Ce qu'il faut en retenir pour le niveau d'ambition.** La barre à atteindre sur
le terrain de Jowzi n'est pas l'automatisation des courses : c'est la **qualité
du parcours d'entrée**, la **latence ressentie**, la **saisie qui transforme une
phrase en résultat** et le **partage du besoin dans le foyer**. Ce sont des
fonctions d'interface, pas de moteur. Elles sont à la portée de ce dépôt.

---

## §2 — Où en est Myko

### 2.1 Les trois écarts qui séparent le dépôt de la production

C'est le premier fait à connaître, parce qu'il relativise tous les autres.
Mesuré le 16 septembre 2026 en base et sur l'API de déploiement :

| Écart | Mesure | Conséquence |
|---|---|---|
| **La RPC est plafonnée** | 324 recettes qualifient, **100 sont rendues**, 0 `JUM-`, 0 `SRC-`, 0 `VAR-` parmi elles | Le planificateur servi choisit parmi ~92 plats (8 des 100 sont des desserts, écartés ensuite) |
| **La base est au 31 juillet** | `culinary.recipe_versions` : **590 lignes, 405 `planning_eligible`, dernière créée le 2026-07-31** — contre 754 / 568 au dépôt (corpus du 4 septembre) | Les 48 jumeaux, les 42 variantes `VAR-` et les 268 reprises `SRC-` **ne sont pas en base** |
| **La production est au 3 septembre** | Dernier déploiement `production` du projet : **3 septembre 2026, 16:20 UTC**, commit `8ead58d2`, PR #161. Treize jours. | Rien du travail de septembre n'est servi |

Et il y a **une porte fermée de l'intérieur** : `.github/workflows/release-production.yml`
lance `npm test` (= `vitest run`, la suite entière) dans le job `validate`
(ligne 31), et le job `migrate-and-deploy` porte `needs: validate` (ligne 37).
Or `npx vitest run tests/data/dishDescriptions.test.js` **échoue** — rejoué :
*« 48 recette(s) publiable(s) sans description dans DESCRIPTIONS : JUM-001,
JUM-002… »*. **Aucun déploiement ne peut partir de `main` aujourd'hui.** C'est un
verrou, pas de l'hygiène : c'est la première ligne du plan.

### 2.2 Ce qui existe, surface par surface

Barème : **fonctionnel** (bout en bout) · **partiel** · **construit, non
branché** (le code existe, rien ne l'appelle) · **absent**.

| Surface | État | Preuve |
|---|---|---|
| Garde-manger, DLC/DDM, FEFO, conteneurs, scan, OCR | **fonctionnel** — la surface la plus mature | `app/pantry/page.js` (737 l.) + 17 modules dans `app/pantry/components/`, dont 16 composants ; `tests/fefo.test.js` ; mesuré : **44 lots, dernier créé le 16 juillet 2026** |
| Moteur de planning déterministe | **fonctionnel** | `lib/domain/planning/closedLoopPlanner.js` (1906 l.), faisceau 48, 17 termes, trois passes en cascade ; `planExplanation.js` (284 l.) |
| Publication atomique | **fonctionnel** | `canonicalPlanPayload.js` (1029 l.) ; liste de courses construite dans la même transaction (`finalDemands.js:848`) |
| Repas personnalisés par membre | **fonctionnel** | `personalizedMeals.js` (1471 l.), `optimizeCoupledDailyPortions` (l. 790), plancher protéique (l. 672) |
| Prix sourcés | **fonctionnel, couverture 46 %** | `data/prices/CONTRAT.md:15` ; couverture recomptée le 16 septembre : **254 formes chiffrées** (`data/prices/tranches/`, 11 fichiers, 259 relevés) sur **549 formes** au catalogue (`scripts/data/out/recipe-food-catalog.json`) = 46,3 %. Réserve : `npm run prices:check` (`ci.yml:44`) cherche `data/prices/reference-fr.json`, **qui n'existe pas**, et répond « rien à contrôler » — c'est une porte verte sur un fichier absent, corrigée en 3.6 |
| Restes et anti-gaspillage | **fonctionnel côté moteur** | `lib/wastePreventionService.js` (618 l.) ; mesuré : `cooked_dishes` = **2**, dernier le 17 juin |
| Sessions de cuisine | **construit, jamais utilisé** | `/api/cooking-sessions`, `CookingSessionSheet.jsx` ; mesuré : `cooking_sessions` = **0 depuis toujours** |
| Questionnaire de goûts | **branché, et vide** | `app/settings/tastes/page.jsx` (566 l.) → `member_food_preferences` ; mesuré : **0 ligne** |
| Retour de goût par repas | **construit, aucun appelant** | `app/api/meals/feedback/route.js` (92 l.) ; `grep -rn "api/meals/feedback" app components lib` : **rien** ; `meal_taste_feedback` = 0 |
| Moteur d'alternatives | **construit, aucun appelant** | `app/api/planning/alternatives/route.js` (185 l.) ; seul « appel » trouvé : son propre commentaire ligne 41 |
| Épinglage d'un repas | **lu, jamais écrit** | `slotProtection.js:39` lit `slot.locked` ; aucune route ne l'écrit, aucun écran non plus |
| Bases partagées | **construit, câblé, inerte** | `sharedBases.js` (509 l.) ; mesuré : **0 des 754 recettes** ne porte `ingredient.component.code` |
| Export de la liste de courses | **absent** | `navigator.clipboard`, `navigator.share`, `writeText` : **0 occurrence** dans `app/`, `components/`, `lib/`. Le seul code presse-papiers est un écouteur `paste` d'image (`components/ui/ImageCapture.jsx:26`) |
| Inscription, ajout d'un membre | **absent** | `signUp` : 0 occurrence. Le POST `app/api/household/members/route.js` n'a aucun appelant |
| Application installable (PWA) | **absent** | pas de dossier `public/`, pas de manifeste, pas de service worker |
| Potager | **absent** | `app/garden/page.jsx:19` lit `garden_plant_product_map` **depuis le navigateur** — table inexistante, et violation du piège n°1 du `CLAUDE.md` |
| Décision de modifier un repas | **détournée** | Trois boutons partent vers une Routine LLM qui écrit en base **hors moteur, hors règles, hors invariants**, en 30-60 s : `TodayMeals.jsx:189`, `TodayMeals.jsx:349`, `CookMode.jsx:78` |
| Tests | **127 fichiers, 1 498 tests, 1 rouge** (126 fichiers et 1 497 tests verts) | l'unique rouge est la table de descriptions en retard sur le versement des jumeaux |

### 2.3 Les mesures P1–P16, à jour

Trois semaines consécutives (21 et 28 septembre, 5 octobre 2026), historique
cumulé, foyer réel, **corpus complet du dépôt (568 publiables)**.

> **Écart de protocole, à lire avant le tableau.** Ces chiffres décrivent **le
> moteur avec le corpus du dépôt**, pas ce que l'application sert. La production
> passe par la RPC plafonnée (~92 plats), sans lignée et sans `component`.
> Certaines lignes ci-dessous sont donc **meilleures** que la réalité servie, et
> deux d'entre elles (P7, P12) ne peuvent pas du tout être atteintes en
> production aujourd'hui. C'est exactement ce que la phase 0 corrige.

| # | Critère | Au diagnostic (3 sept.) | **Mesuré aujourd'hui** | Cible | Verdict |
|---|---|---|---|---|---|
| P1 | Plats distincts / 14 | 12 | **12, 12, 12** | ≥ 12 | tenu |
| P1bis | Reprises sur 3 semaines | 0 | **5 plats repris, 35 distincts / 42** | 0 | à revoir (historique non comparable — voir note) |
| P2 | Part des pâtes | 27 % | **8/42 = 19,0 %** (28,6 / 21,4 / 7,1) | ≤ 15 % | non tenu |
| P2bis | Féculent dominant | — | semaine 2 : **pomme de terre 6/14 = 43 %** | aucun > 25 % | non tenu |
| P3 | Laitiers + œufs en protéine principale | 32 % | **11/42 = 26,2 %** | ≤ 20 % | non tenu — et ces familles sont **exemptées** du plafond (`weeklyBalance.js:51`) |
| P4 | Julien, jours ≥ 85 % de sa cible | 2/7 (66 %) | **3/7, 0/7, 1/7** ; `protein_gate_relaxed` **4, 7 et 6 jours sur 7** | ≥ 6/7 | non tenu — le plus en retard |
| P5 | Ratio de portion de Julien | 1,6 à 2,0 | max **1,86 / 2,00 / 2,00**, moyenne 1,34 à 1,43 | ≤ 1,3 | non tenu, moins mordant |
| P6 | Repas carnés de Zoé | 6/14, = Julien | **0/14** les trois semaines | sa cible déclarée | atteint **par accident** : `meatMax: 4` (`weeklyBalance.js:30`) plafonne le foyer et les 4 swaps de Zoé l'absorbent |
| P7 | Substitutions hors lignée | 4/4 | **1/4, 1/3, 4/4** — 6 sur 11 | 0 quand un jumeau existe | progrès sur le chemin JSON ; **impossible en production** (§0.3) |
| P8 | Faux végétariens servis | 2/4 | **0** sur les 3 semaines et **0 sur tout le corpus** — par ingrédient **requis** ; 0 origine `inconnu` | 0 | **atteint sur l'ingrédient requis — C1.1 est fait** ; réserve sur l'ingrédient facultatif (§2.4) |
| P9 | Plats distincts à cuisiner | 14 à 16 | **15, 14, 16** | ≤ 12 | non tenu |
| P10 | Minutes de cuisine / semaine | 1 065 (tout frais) | **325 / 340 / 320** en préparation active réellement engagée ; **1 140 à 1 465** en préparation + cuisson | ≤ 600 | **non tenu sous la définition d'origine** : les 1 065 du 3 septembre étaient un « tout frais », dont le comparable d'aujourd'hui est 1 140–1 465 — le chiffre a monté. La définition se tranche au §8, et la cible se refixe avec elle |
| P11 | Productions contredites par leur conservation | pan bagnat 24 h sur 3 j | **0** | 0 | **atteint — C1.2 est fait** |
| P12 | Plats liés à une base partagée | 0/520 | **0/568**, et 0 créneau sur 42 | ≥ 120 | inchangé ; **impossible en production** (§0.3) |
| P13 | Cuisines distinctes | 17 libellés, France 9+7 | 17 libellés ; **France 21/42 = 50 %** en comptant les libellés composites | ≥ 8, aucune > 40 % | non tenu |
| P14 | Retour de goût atteignable | non | **non** — 0 appelant, 0 ligne | oui | inchangé |
| P15 | Recettes ayant passé toutes les portes | 470 servables | **515 servables** au dépôt (568 publiables — les 470 de septembre étaient déjà un décompte de servables), **324** qualifiées en base, **100** servies | 3 000 | §0.3 |
| P16 | Temps de résolution | ≈ 7 s / 520 | **5,3 à 7,5 s pour 568** (≈ 11,7 ms/recette) | ≤ 10 s à 3 000 | tenu aujourd'hui ; ≈ 35 s à 3 000 sans élagage |

**Note sur P1bis.** L'historique de cette mesure ne contient que les semaines
qui viennent d'être générées, là où le diagnostic du 3 septembre utilisait un
historique de production de 56 jours. La comparaison n'est pas à armes égales et
**on ne conclut pas à une régression du moteur**. Ce qui est solide : deux des
quatre reprises de *Moussaka végétarienne* viennent de la **stratégie de
production** (un créneau producteur et un consommateur la même semaine) — la
production multi-portions crée mécaniquement des reprises que les règles de
répétition exemptent.

### 2.4 Ce qui a réellement bougé depuis le 3 septembre

- **C1 est fait et vérifié** : P8 = 0 sur tout le corpus, P11 = 0 sur trois
  semaines, **0 origine inconnue**, conservation déclarée pour 490 recettes
  (1 j → 49, 3 j → 245, 4 j → 58…), **431 refus de congélation explicites**,
  **0 profil non déclaré**. La constante de 3 jours a disparu.
- **Une réserve sur P8, et elle n'est pas de détail.** Le zéro porte sur les
  ingrédients **requis**. `classifyRecipe`
  (`lib/domain/planning/closedLoopPlanner.js:728-734`) range à part les
  ingrédients **facultatifs** d'origine non végétarienne, et le
  commentaire du fichier chiffre lui-même le cas : **douze recettes** classées
  végétariennes en portent un — lardons de la salade de chèvre chaud, jambon de
  Bayonne de la piperade, thon des œufs mimosa. Le moteur les expose par
  `optionalNonVegetarian` ; **aucun écran ne lit ce champ** (`grep -rn
  "optionalNonVegetarian" app components` ne renvoie rien). Servir l'un de ces
  plats à qui veut moins de viande n'est juste que si la fiche et la liste de
  courses omettent l'option — et rien ne le vérifie aujourd'hui. Livrable ajouté
  en 3.6.
- **Les 48 jumeaux ont porté la couverture végétarienne des lignées carnées à
  52 %** : 125 lignées carnées (viande), 65 ont un jumeau de même lignée. Le
  « 6 % » du 3 septembre valait 11 sur **181** lignées comptées autrement : les
  deux dénominateurs ne se comparent pas directement, et le progrès se lit sur le
  numérateur — 11 jumeaux de lignée, puis 65. Les 48 portent tous leur
  `derived_from` (vérifié : 48/48).
- **Les dépendances de tâches existent enfin en production** :
  `prep_task_dependencies` = 11 (0 à l'audit de juillet).
- **P2, P3, P4, P9, P10, P13 n'ont pas bougé**, et P7 reste irrégulier.

---

## §3 — Le terrain : ce qu'on a, ce qu'on égale, ce qu'on n'égalera pas

### 3.1 Ce que Myko a déjà que Jowzi n'a pas

Classé par honnêteté du verdict, pas par séduction. **Rappel qui vaut pour tout
le tableau** : ces capacités vivent dans le dépôt ; rien de tout cela n'est
servi aujourd'hui à un utilisateur (§2.1).

| Ce que Myko a | Verdict honnête | Avantage réel ou potentiel ? |
|---|---|---|
| **Un stock réel, pas une liste** — quantité restante, ouverture, conteneurs fractionnables, réservations distinctes du possédé | fonctionnel, **mais l'inventaire n'est plus tenu** (44 lots, dernier le 16 juillet) | **Réel et structurel.** Jowzi ne peut pas l'avoir sans renoncer à la commission sur le panier |
| **DLC / DDM par forme, date ajustée à l'ouverture, FEFO** | fonctionnel et testé | **Réel.** Un utilisateur de Jow le réclame nommément et ne l'obtient pas |
| **Optimisation couplée des portions de deux personnes sur le même plat** | fonctionnel | **Réel — c'est le cœur du cahier des charges écrit par l'avis 3★ de Jowzi**, et les CGU de Jow l'interdisent à Jowzi |
| **Des prix sourcés un par un, et un refus d'afficher plutôt qu'une estimation** | fonctionnel, couverture **46 %** des formes | **Réel**, mais 46 % c'est un avantage de principe avant d'être un avantage d'usage |
| **Une origine déclarée pour chaque forme** | fonctionnel et vérifié sur tout le corpus : 0 inconnue, 0 faux végétarien | **Réel.** C'est le motif de désinstallation le mieux documenté du marché — « j'ai bien précisé mon régime […] ça m'a proposé 3 plats à partir d'animaux… je désinstalle » |
| **Des profils de conservation structurés, avec provenance de chaque champ** | fonctionnel — 490 durées déclarées, 431 refus de congélation | **Réel.** Le marché entier récite « 3 à 4 jours » ; Myko a la donnée par recette |
| **Un moteur déterministe et explicable** | fonctionnel | **Réel**, mais il ne devient un argument que quand l'explication est **montrée** |
| **Publication atomique** — plan, créneaux, repas, réservations, tâches, productions, courses en une transaction | fonctionnel | **Réel, invisible.** C'est ce qui fait qu'on ne perd pas le panier — le reproche récurrent de Jow |
| **Une chaîne éditoriale qui refuse la mémoire** — 2 sources sur 2 sites, prose jamais recopiée, quantités arbitrées, arithmétique revérifiée | fonctionnel — 309 dossiers de sources versionnés | **Réel et rare.** Aucune source lue ne décrit comment les 5 000 recettes de Jow sont produites, et aucune évaluation indépendante de leur qualité n'existe |
| **48 jumeaux végétariens de même lignée** (52 % des lignées carnées) | versé au dépôt, **invisible en production** | **Potentiel** tant que le plafond et la lignée ne sont pas réglés |
| **Des bases partagées modélisées** | construit, câblé, **inerte** | **Potentiel**, et bloqué par le tuyau (§0.3) |
| **La boucle de goût et le moteur d'alternatives** | construits, **débranchés** | **Potentiel.** Trois boucles complètes manquent d'un bouton |
| **Le potager** | **absent, pas partiel** — la table n'existe pas | **Ni réel ni potentiel.** À dire tel quel |

### 3.2 Ce qu'il manque pour égaler Jowzi

Quatre choses, toutes des fonctions d'interface, **aucune ne demandant de
partenaire** :

1. **La saisie du besoin en une phrase.** `app/planning/assistant/page.js`
   (221 lignes) **n'a aucun champ de saisie** : c'est un bouton qui poste
   `{ window_start }`. `app/api/ai/chat/route.js` existe avec un contexte foyer
   complet et n'a aucun appelant. Le seul vocabulaire d'intention est cinq
   boutons.
2. **La correction en un geste.** Chez Jowzi on change un repas en parlant ;
   chez Myko « Remplacer » part vers une Routine à 30-60 s, quand le moteur
   déterministe d'alternatives répondrait en millisecondes et sous règles.
3. **Le mémo du foyer.** C'est la seule fonction que les avis positifs de Jowzi
   citent spontanément. Myko n'a **aucune brique de temps réel** :
   `supabase.channel`, `postgres_changes`, `broadcast` — 0 occurrence.
4. **Le parcours d'entrée.** Myko ne sait créer aucun compte ni ajouter personne
   au foyer. C'est plus grave que ça n'en a l'air : c'est ce qui prouve que rien
   n'est codé en dur pour « Julien ET Zoé » — les Routines, elles, le sont.

Ajoutons la **sortie des courses** (P17), qui n'est pas une fonction de Jowzi
mais une demande explicite de ses utilisateurs : « Un moyen d'export de la liste
de courses depuis Jow serait un plus » (App Store 4★, 23 août 2026).

### 3.3 Ce qu'on n'égalera pas — sans euphémisme

**Commander et payer chez 10 000 magasins. Ce n'est pas un chantier difficile :
c'est un chantier fermé.** Trois verrous, aucun ouvert à un développeur seul :
un **mandat civil** sur les identifiants marchand, dont on peut rédiger le texte
mais pas assumer la responsabilité ; des **connecteurs négociés**, le PDG de Jow
écrivant lui-même que les distributeurs manquaient des API nécessaires ; une
**commission d'enseigne**. Aucune API panier grand public n'existe chez
Carrefour ou Intermarché : « l'API Carrefour France » documentée est celle de la
marketplace Mirakl, destinée aux **vendeurs**. Relevé le 16 septembre :
`developers.carrefour.com`, `developer.carrefour.com` et `api.carrefour.fr` ne
répondent pas ; `developers.intermarche.com` répond (HTTP 200) mais ne rend aucun
texte sans exécution de script — **il n'a donc pas été lu**, et rien n'est affirmé
de son contenu. Une rédaction antérieure parlait ici d'un « portail développeurs
italien » : cette affirmation n'avait aucune source et elle est retirée.

Et l'état du marché dit que ce n'est pas un retard, c'est un mur : au
8 septembre 2026, en France, **aucun assistant IA ne finalise un achat de bout
en bout** — 26 % des acteurs du Top 100 de l'e-commerce français ont un assistant,
« à peine plus du tiers d'entre eux » autorisent l'ajout au panier (ce sont les
mots de l'étude, qui ne donne pas de pourcentage sur ce point), et **aucun** ne
laisse payer : « l'autonomie transactionnelle reste au point mort ». Chez
Carrefour, les deux chemins ouverts ne disent pas la même chose, et il faut le
dire aussi : dans ChatGPT (26 mars 2026), le client compose son panier puis se
rend « sur Carrefour.fr » « avant de finaliser et régler la commande » — c'est la
phrase de l'article ; avec l'UCP de Google (annoncé le 13 janvier 2026),
l'annonce promet au contraire l'achat **depuis les outils de Google**, sans
passer par le site de l'enseigne. Une promesse de protocole d'un côté, une mesure
de marché de l'autre : au 8 septembre, le baromètre ne relève toujours **aucun**
parcours de paiement mené à son terme par un assistant en France. Le droit a
bougé — le 9e Circuit a annulé le 4 août 2026 l'injonction d'Amazon contre
Perplexity, jugeant qu'un agent est
« un outil, pas une personne » — mais la cour précise que **les recours
contractuels pour violation des CGU restent ouverts**. Le risque a changé de
nature, pas d'existence.

**Les prix et la disponibilité en temps réel par magasin.** C'est ici que les
`robots.txt` mordent réellement (§0.2) : Intermarché interdit `/api/*`,
`/recherche/*`, `/catalog/*` — exactement le catalogue. Conséquence assumée :
Myko affiche des prix **sourcés, datés, vérifiables** ou **rien**. C'est moins
pratique qu'un prix « au centime près », et plus honnête qu'un prix inventé — à
noter que même chez Jow le prix affiché et le ticket divergent (« drive 96 €,
JOW 108 € »).

**5 000 recettes achetables maintenues par une équipe.** Une recette Jow est
achetable parce que ses ingrédients sont reliés à des références produits
maintenues à la main par une « équipe Food ». Myko n'aura jamais cette équipe.
La compensation honnête : 3 000 recettes avec **sept portes obligatoires**, là
où aucune source lue ne décrit comment les 5 000 de Jow sont produites ni
relues.

**Une personnalisation nourrie par des millions d'utilisateurs.** Jowzi apprend
d'un historique d'achats aspiré chez le marchand par mandat RGPD. Myko a deux
membres et **0 ligne** de préférences. Sa personnalisation repose sur la
**déclaration** et le **retour direct** : moins puissant statistiquement, plus
juste individuellement — mais qui tourne à vide tant que le pari 5 n'est pas
tenu.

**Le mémo WhatsApp, une application native, et un modèle économique
d'abonnement.** Le premier demande une API business, une entreprise vérifiée et
un numéro dédié, pour un foyer de deux personnes. Le deuxième n'apporte rien
qu'une PWA n'apporte. Le troisième est à fuir : le passage au payant est la
**cause n°1 de départ chez Jow** — 153 des 500 avis les plus récents en parlent,
dont 117 notés 1 étoile, et la colère porte sur la manière, pas sur le prix.
(Recompté le 16 septembre sur les mêmes 500 avis : 149 à 153 selon le motif de
recherche retenu, **117 à une étoile dans les deux décomptes** ; la répartition
d'ensemble est de 202 avis à une étoile sur 500.)
Myko n'a ni commission d'enseigne ni besoin d'en avoir.

---

## §4 — Au-delà de Jowzi : les paris

Chaque pari dit ce qu'il demande, ce qu'il rend, et **à quel chiffre on saura
qu'il est tenu**. Un pari qu'on ne peut pas mesurer n'en est pas un et n'entre
pas dans cette liste. Ils sont ordonnés par ce qu'ils déplacent rapporté à leur
coût.

**Pari 0 — Rendre visible ce qui est déjà fait.** Ce n'est pas un pari, c'est la
condition des huit autres : le contrat opérationnel (§0.3) et le corpus en base.
*On saura* : `generateClosedLoopPlan` reçoit ≥ 500 recettes en production, et la
RPC rend `origin`, `conservationProfile`, `component` et `derivedFrom`.

**Pari 1 — Le même plat, deux assiettes, deux cibles.** Quota de viande par
personne, cible protéique calculée depuis le **poids cible**, refus de
substitution hors lignée. C'est mot pour mot la demande de l'avis 3★ de Jowzi,
et ce que les CGU de Jow interdisent à Jowzi de promettre. *On saura* : P6
(quota de chacun ± 1), P7 = 0, P4 ≥ 6 jours sur 7.

**Pari 2 — Cuisiner ce qu'on a, et le voir.** Rien de nouveau dans le moteur :
FEFO, réservations et couverture stock existent et sont testés. Ce qui manque
est en amont (le garde-manger n'est plus alimenté) et en aval (la raison du
choix n'est pas montrée). C'est la seule promesse qu'un concurrent financé par
une commission sur le panier **ne peut pas** faire. *On saura* : sur une semaine
générée avec ≥ 30 lots réels, ≥ 4 créneaux sur 14 consomment un lot dont la DLC
effective tombe dans les 7 jours, la valeur en euros du gaspillage évité est
affichée, et chaque plat concerné porte sa raison en une ligne.

**Pari 3 — Les absences, et la semaine réelle.** Une présence par personne et
par créneau. *On saura* : deux dîners hors domicile déclarés pour une personne →
**12 assiettes au lieu de 14** pour elle, les quantités de courses baissent
d'autant, et le total nutritionnel de la semaine **n'inclut pas** les repas
absents — testé sur la transaction de publication.

**Pari 4 — La liste sort de l'application.** *On saura* : trois sorties
(presse-papiers, partage natif, PDF), chacune respectant les six rayons et leur
ordre (`canonicalPlanPayload.js:40-60`), et un test comparant le texte exporté
aux lignes de `nutrition_plan_shopping_items`.

**Pari 5 — Brancher les trois boucles qui existent.** Trois branchements, pas
trois développements. *On saura* : P14 = oui, et un créneau épinglé survit à
trois régénérations consécutives.

**Pari 6 — La phrase entre, le moteur décide.** Le modèle ne fait que traduire
la phrase en **contraintes** ; le solveur décide. Avec un avantage que Jowzi ne
peut pas avoir : quand la phrase est mal comprise, c'est une contrainte qui est
fausse **et qu'on voit**, pas un plat qui apparaît sans raison — les CGU de Jow
concèdent explicitement la « mauvaise interprétation d'un Prompt ». *On saura* :
zéro écriture dans les tables de planning hors publication atomique, et une
modification d'un repas rendue en moins de 3 secondes.

**Pari 7 — Un chiffre affiché est vrai, ou il est absent.** Étendre au temps de
cuisine, aux quantités et aux macros la règle que le contrat des prix tient déjà.
C'est la défense contre la famille de défauts qui vide les applications
concurrentes le plus vite : « 2h annoncées, j'ai chronométré, 5h36 » ; « 5
oignons dans chaque recette » ; « 49g de protéines et ensuite 13g » — trois
désinstallations pour trois chiffres faux. *On saura* : P18.

**Pari 8 — Les bases partagées.** Aucune ligne de moteur à écrire *une fois le
tuyau ouvert* : `sharedBases.js` est déjà câblé. *On saura* : P12 ≥ 120 plats
liés **et** ≥ 4 repas par semaine qui en tirent parti, mesuré **sur le chemin
base**, pas sur le chemin JSON.

---

## §5 — Le plan

Ordonné par ce que chaque livrable déplace **rapporté à ce qu'il débloque en
aval**. Les estimations sont en **jours-agent** et supposent la vérification
faite, pas seulement le code écrit.

---

### Phase 0a — Remettre le circuit sous tension (5 j-agent)

**Pourquoi d'abord.** Rien ne peut partir en production tant que la suite de
tests est rouge (§2.1), et tant que le plafond tient, le planificateur choisit
parmi 92 plats. Cette phase à elle seule fait passer la production **de 92 à
plusieurs centaines de plats servis** : c'est le meilleur rapport
effort/résultat du plan entier, et il ne faut pas l'attendre.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 0a.1 | Les 48 descriptions manquantes dans `scripts/data/recipes/assign-dish-descriptions.mjs` (table `DESCRIPTIONS`, ligne 54) | `npx vitest run` : **1 498/1 498** (1 497 verts sur 1 498 aujourd'hui), et `release-production.yml` peut à nouveau franchir `validate` | 0,5 |
| 0a.2 | Migration de corpus : le corpus du 4 septembre versé en base, **par tranches** (`scripts/data/out/corpus-v3-chunks`, 708 fichiers, 14 Mo — le fichier d'un seul tenant fait 12,9 Mo et expire côté psql), inscrite au `scripts/db/migration-manifest.json` | `culinary.recipe_versions` ≥ 754 dont ≥ 48 codes `JUM-` ; `planning_eligible` ≥ 560 (aujourd'hui 405) ; **un second `apply` ne rejoue aucune migration** (idempotence) | 1,5 |
| 0a.3 | Pagination aux **deux** sites d'appel : `app/api/planning/generate-v3/route.js:464` **et** `app/api/planning/alternatives/route.js:106`, via une boucle dans `lib/db/operationalRecipeCatalog.js` (la RPC accepte déjà un `OFFSET` jusqu'à 10 000, ligne 109 — aucune migration n'est nécessaire pour cette étape) | Une génération de production journalise `recipes_received ≥ 500` (0a.2 est passée avant ; sans elle le plancher serait de 324, le nombre qui qualifie aujourd'hui) ; **au moins un code `JUM-` apparaît dans une semaine servie** | 1 |
| 0a.4 | Élagage calibré : `maxCandidates` passé explicitement aux deux appels de `selectPlanningRecipePool` (`generate-v3/route.js:501` et `:553`), rejoué à 96 / 200 / 400 / 800 | Table P1–P4 × P16 consignée **pour chaque valeur** ; la valeur retenue tient **P16 ≤ 10 s** sans dégrader P1–P3. On ne garde pas 96 par principe : 96 a été choisi quand la RPC n'en rendait que 100, ce n'est pas une décision, c'est un reste | 0,5 |
| 0a.5 | **Le rapport de qualité, rendu durable** : `tests/planning/rapportQualiteSemaine.test.js` rejoue P1 à P18 sur trois semaines consécutives et **imprime les dix-huit lignes**. Le harnais qui a produit les chiffres du §2.3 était un test jetable, créé puis supprimé : c'est pour cela qu'on ne peut aujourd'hui ni les contester ni les rejouer | Le rapport imprime les dix-huit lignes — P17 et P18 portant « sans objet » tant que leurs livrables n'existent pas, jamais un chiffre — et **échoue** si P8 ≠ 0 ou P11 ≠ 0 — les deux seuls critères déjà tenus, donc les deux seules régressions qu'on peut interdire dès maintenant. Exécuté en CI | 1 |
| 0a.6 | Déploiement de production jusqu'au canary | Un déploiement `production` daté de la semaine existe (le dernier remonte au 3 septembre) | 0,5 |

**Dépendances** : 0a.1 avant tout le reste (c'est le verrou du pipeline) ; 0a.2
avant 0a.3 ; tout avant 0a.6.
**Risques.** *(a)* Recharger peut orpheliner un `recipe_version_id` référencé par
un plan publié → charger **en ajout**, ne jamais supprimer une version
référencée, et vérifier `planned_productions` / `planned_consumptions` avant et
après. *(b)* Lever le plafond peut dégrader P1–P3 → 0a.4 est dans la même phase,
pas après, et en cas de dégradation on revient à un élagage plus serré, **jamais
au plafond de 100**. *(c)* Les deux raccords JSON de `operationalCatalog.js`
restent en place pendant toute la phase 0a : on ne les touche qu'en 0b, sous
porte de test.

---

### Phase 0a bis — L'export presse-papiers (1 j-agent, dans le sillage)

Une journée, indépendante de tout, et c'est le premier bénéfice tangible pour le
foyer. On la fait maintenant plutôt qu'en semaine 11 parce qu'elle sert de
carburant d'usage : une liste qu'on peut emporter est une liste qu'on utilise, et
un garde-manger qu'on alimente.

| Livrable | Critère d'acceptation | j |
|---|---|---|
| `lib/domain/courses/exportListe.js` + un bouton « Copier la liste » dans `app/courses/page.js` | Le texte copié contient **exactement** les lignes de `nutrition_plan_shopping_items` de la semaine, dans l'ordre des six rayons (`canonicalPlanPayload.js:40-60`), avec les quantités de `humanQuantities.js` — 0 ligne perdue, 0 ajoutée (test de bout en bout) | 1 |

Le partage natif et le PDF viennent en phase 3 : l'ordre est celui de l'usage
réel, pas celui de la complétude.

---

### Phase 0b — Le contrat opérationnel (7 j-agent)

**Pourquoi maintenant.** C'est la phase qui rend la base capable de porter ce que
C1 a produit, et le tuyau capable de le transmettre (§0.3). Sans elle, la phase
2 est impossible et P7 restera vert sur le chemin de test et zéro en production.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 0b.1 | Migration `..._contrat_operationnel.sql` : `conservation_profile jsonb` sur `culinary.recipe_versions`, origine biologique exposée sur la forme, et projection de **`component`** et **`derivedFrom`** dans `get_operational_recipe_catalog_v3` (`derived_from_version_id` existe déjà en base depuis `20260729140000`, ligne 30 — il n'est simplement pas publié) | Sur 10 codes tirés au hasard, la RPC rend un `origin` du vocabulaire fermé de `lib/domain/foods/origins.js`, un `conservationProfile` non nul, un `component` non nul pour toute recette qui en porte un, et un `derivedFrom` pour les 48 jumeaux | 2,5 |
| 0b.2 | Émission des quatre champs par la chaîne de publication (`scripts/data/publish/emit-publish.mjs` — aujourd'hui 0 occurrence de `conservation`, `origin`, `component`) et régénération du chargeur | La base porte les quatre champs pour 754 recettes ; l'écart §2.1 entre base et dépôt est nul | 2 |
| 0b.3 | **Porte de test avant retrait des rustines** : `tests/planning/contratOperationnel.test.js` rejoue, **sur le chemin base seul**, 0 origine `inconnu`, un profil de conservation résolu pour **chaque** recette servie, et une lignée distincte du code pour les 48 jumeaux | Le test passe **avant** que la ligne suivante ne soit écrite | 0,5 |
| 0b.4 | Retrait des deux raccords JSON (`lib/domain/recipes/operationalCatalog.js`, lignes 13 et 25) | Le fichier n'importe plus `corpus-v3.json` ni `recipe-food-catalog.json` ; le test P8 rejoué sur le chemin base rend **0 faux végétarien** | 1 |
| 0b.5 | Contrôle durable `check-corpus-parity` : échoue si l'empreinte du corpus en base diffère de celle du dépôt. **Placé dans le job `migrate-and-deploy` de `release-production.yml`**, qui porte `SUPABASE_DB_PASSWORD` — et **pas** dans `ci.yml`, dont le job principal tourne sur des valeurs factices (`NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co`, lignes 18-19) et ne peut pas lire la base | Le contrôle échoue sur l'écart d'aujourd'hui et passe après 0a.2 | 1 |

**Dépendances** : phase 0a.
**Risques.** *(a)* Retirer une rustine avant que l'émission soit complète casse
le végétarien en production — c'est écrit noir sur blanc dans le fichier. La
parade est 0b.3 : **la porte de test précède le retrait**, et si elle ne passe
pas, les rustines restent et on le dit. *(b)* La migration touche une RPC dont
dépendent deux routes → la signature ne change pas, seule la projection
s'enrichit ; les champs ajoutés sont facultatifs côté lecture.

---

### Phase 1 — La personne devient une unité de calcul (10 j-agent)

C2.1 et C3.3, les deux décisions du §7 du plan de septembre qui **ne sont pas
commencées** : `grep -rn "meat_meals_per_week"` sur tout le dépôt ne renvoie que
le plan lui-même.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 1.1 | `meat_meals_per_week` **par membre**, en remplacement du nombre de swaps : `lib/domain/settings/planningSettings.js`, `memberPlanningRules.js`, écran `app/settings/planning/page.jsx` ; le `meatMax` du foyer (`weeklyBalance.js:30`) devient **la somme des quotas déclarés** au lieu d'une constante à 4 | **P6** : sur trois semaines, les repas carnés de chacun égalent son quota déclaré ± 1. Aujourd'hui Zoé est à 0/14 **sans l'avoir demandé** | 3 |
| 1.2 | Refus de substitution hors lignée quand un jumeau de même lignée existe (`chooseVegetarianAlternative`, `personalizedMeals.js:540`) | **P7 = 0** hors lignée quand un jumeau existe, **mesuré sur le chemin base** (6 sur 11 aujourd'hui, et impossible en production avant la phase 0b) | 1,5 |
| 1.3 | Cible protéique depuis le **poids cible**, coefficient g/kg réglable par personne : `lib/nutritionCalculator.js:60-63` (aujourd'hui `weight_kg × 1,4/1,6/1,8`) et son appelant **ligne 95**, où `calculateMacros(targetCalories, w, rate)` passe `w`, le **poids actuel** — `tw`, le poids cible, ne servant qu'à l'estimation de durée | La cible recalculée est versionnée dans `nutrition_target_versions` **avec sa règle** ; **P4 ≥ 6 jours sur 7 à ≥ 85 %**, sans abaisser la borne du test de densité | 2,5 |
| 1.4 | Plancher de densité protéique par membre comme **contrainte de sélection** et non comme correction de portion | **P5 ≤ 1,3** de ratio de portion (max 1,86 à 2,00 aujourd'hui) ; `protein_gate_relaxed` ≤ 1 jour par semaine (4 à 7 aujourd'hui) | 1,5 |
| 1.5 | Présence par personne et par créneau : table `meal_presence`, lue par `buildWeekSlots` et par `finalDemands.js:848` | Deux dîners hors domicile pour une personne → **12 assiettes au lieu de 14** pour elle, quantités de courses baissées d'autant, **et total nutritionnel de la semaine excluant les repas absents**. Test sur la transaction de publication | 1,5 |

**Dépendances** : phase 0b pour 1.2 (sans `derivedFrom`, il n'y a pas de lignée à
comparer).
**Risques.** Durcir P6 et P4 ensemble peut rendre la semaine infaisable et
multiplier les `review_required`. *Parade* : la cascade `STRICT → CORE → OFF`
existe déjà (`closedLoopPlanner.js:1860-1898`). On mesure le taux de
`review_required` sur trois semaines ; **au-delà de 2 créneaux sur 42, on
revient au réglage précédent et on consigne pourquoi** — on ne publie pas une
semaine dégradée en silence, et on n'abaisse pas la cible pour la faire passer.

---

### Phase 2 — Les bases partagées et la capacité (12 j-agent)

C4.1 et C4.2. `sharedBases.js` (509 l.) est complet, câblé, testé — et inerte :
**0 des 754 recettes** ne porte `ingredient.component.code`.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 2.1 | `scripts/data/recipes/link-shared-bases.mjs` + arbitrage relu `data/recipes/arbitrations/bases-partagees.json` (même forme que `conservation-manuelle.json`) | **P12 ≥ 120** plats liés **et ≥ 4 repas par semaine** qui en tirent parti, mesuré **sur le chemin base**. Cible prioritaire : les plats mijotés et les gratins, que le solveur retient le plus | 4 |
| 2.2 | Capacité de cuisine lue par le moteur : `cookingDays` / `quickDays` sont construits par `memberPlanningRules.js:27-28` et **n'ont aucun consommateur** ; `MAX_PRODUCTION_CONSUMERS = 3` et `MAX_PLAN_PRODUCTIONS = 2` sont en dur (`closedLoopPlanner.js:429-430`) et deviennent une **conséquence** de la capacité déclarée | Un soir déclaré « rapide » ne porte **aucune** production ; une session déclarée porte 2-3 productions + 2 bases | 3 |
| 2.3 | **Fiche de cuisine fusionnée** : quand Julien mange la version carnée et Zoé son jumeau de même lignée, la fiche fusionne les étapes communes et ne sépare qu'au point de divergence — la protéine. Le point de divergence se calcule depuis les deux listes d'étapes et le `derived_from` du jumeau ; il est **déclaré dans le fichier d'arbitrage du jumeau**, jamais deviné. Écrans : `app/planning/components/CookSession.jsx`, `components/CookingSessionSheet.jsx` | **P9 ≤ 12** plats distincts à cuisiner (15, 14, 16 aujourd'hui) : deux assiettes, une seule préparation | 3 |
| 2.4 | Temps de session affiché = **somme des temps mesurés**, jamais une estimation ronde | **P10** : le chiffre affiché est la somme, et l'écart entre annoncé et constaté est consigné après chaque session réelle. C'est la plainte n°1 des utilisateurs de Basta : « 2h annoncées, j'ai chronométré, 5h36 » | 2 |

**Dépendances** : **phase 0b obligatoire** pour 2.1 et 2.3. Sans la projection de
`component` et de `derivedFrom`, 120 liens posés au corpus et une fiche fusionnée
parfaitement écrite resteraient invisibles au planificateur de production. C'est
le point que ce plan corrige et qu'aucun des plans concurrents n'avait vu.
**Risques.** L'appariement produit des faux positifs (une « sauce tomate » qui
n'est pas la même). *Parade* : arbitrage relu ligne à ligne ; **une base non
arbitrée n'est pas posée**, et un lot n'est fusionné que si P9 baisse sans que
P1–P3 se dégradent.

---

### Phase 3 — Les plafonds, les boucles, et la sortie (9 j-agent)

C5.1, C5.2, et les deux critères ajoutés.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 3.1 | Plafonds de féculent et de protéine principale dans `weeklyBalance.js` — où `laitiers` et `oeufs` sont aujourd'hui **exemptés** (`UNCAPPED_PROTEIN_FAMILIES`, ligne 51) | **P2 ≤ 15 %** de pâtes et aucun féculent > 25 % ; **P3 ≤ 20 %** ; **P13 ≥ 8 cuisines, aucune > 40 %**. Les libellés composites (« Italie / cuisine domestique française ») sont **normalisés en un seul libellé par un fichier d'arbitrage relu**, `data/recipes/arbitrations/cuisines.json`, et comptés une fois — sans quoi le critère n'est pas vérifiable mécaniquement | 2 |
| 3.2 | « Remplacer ce repas » branché sur le moteur : `TodayMeals.jsx:349` → `/api/planning/alternatives` (185 lignes, aucun appelant) | **Réponse < 3 s au 95e centile sur vingt appels**, mesurée après la phase 0a avec le vivier élargi et consignée dans le rapport de qualité. Au-delà de 3 s, on ne débranche pas la Routine et on écrit le chiffre obtenu — la référence de départ est le 30-60 s de la Routine | 1,5 |
| 3.3 | Retour de goût en un geste sur chaque repas → `/api/meals/feedback` (92 lignes, aucun appelant) | **P14 = oui** : lignes non nulles dans `meal_taste_feedback` **et** `member_food_preferences` (0 et 0 aujourd'hui) ; une génération postérieure à un avis négatif ne ressert pas le plat | 1,5 |
| 3.4 | Épinglage : une route qui **écrit** `locked` (aujourd'hui `slotProtection.js:39` le lit, `generate-v3/route.js` le respecte, et **rien ne l'écrit**) + bouton dans `app/planning/components/WeekGrid.jsx` | Un créneau épinglé survit à **3 régénérations consécutives** | 1 |
| 3.5 | Export complet : partage natif puis impression/PDF, s'ajoutant au presse-papiers de la phase 0a bis | **P17** : trois sorties, chacune respectant les six rayons et leur ordre, testées contre `nutrition_plan_shopping_items` | 1 |
| 3.6 | Contrat des chiffres : `docs/CONTRAT_CHIFFRES.md` étendant la règle de `data/prices/CONTRAT.md:15` au temps de cuisine, aux quantités et aux macros, + test de corpus | **P18** : une recette rend les **mêmes** macros par portion sur les trois écrans qui l'affichent ; aucun chiffre non calculable n'est rendu sous forme de nombre — même verdict explicite que `couverture_masse_insuffisante`. Deux réserves mesurées entrent dans le même livrable : *(a)* les **douze** recettes à ingrédient carné facultatif (§2.4) affichent cette option et l'**excluent** de la fiche et de la liste de courses dès qu'un mangeur du créneau a déclaré manger moins de viande, sous test de corpus sur `optionalNonVegetarian` ; *(b)* `npm run prices:check` contrôle le référentiel réellement employé (`data/prices/tranches/`) et **échoue** si le fichier qu'il cherche est absent, au lieu de répondre « rien à contrôler » | 1,5 |
| 3.7 | PWA : `public/manifest.webmanifest`, icônes, `viewport` / `themeColor` / `appleWebApp` dans `app/layout.js`, service worker *network-first* versionné par identifiant de plan | L'application s'installe sur les deux téléphones ; `/pantry` et la semaine publiée restent **lisibles hors réseau**. C'est debout devant le frigo qu'on tient un garde-manger, pas au bureau | 0,5 |

**Dépendances** : phase 0a (P13 suppose un vivier > 100).
**Risques.** *(a)* Les plafonds P2/P3 sur un vivier à 71,5 % France peuvent
rendre la semaine infaisable. *Parade* : ils n'entrent en vigueur **comme refus**
qu'au jalon C6 où la France passe sous 50 % du vivier ; d'ici là ce sont des
**avertissements mesurés**, affichés, jamais des blocages silencieux. *(b)* Un
service worker qui sert une semaine périmée → cache *network-first* ; en cas de
doute on livre le manifeste sans service worker.

---

### Phase 4 — La phrase entre, le moteur décide (6 j-agent)

C7. Trois boutons écrivent aujourd'hui en base hors moteur, hors règles de
répétition, hors invariants.

| # | Livrable | Critère d'acceptation mesurable | j |
|---|---|---|---|
| 4.1 | Traducteur `lib/domain/planning/intentFromPhrase.js` + champ de saisie dans `app/planning/assistant/page.js` (221 lignes, **aucun champ** aujourd'hui) | Le modèle rend `{ presence, starchCap, meatQuota, maxMinutes, intent }` **et rien d'autre** ; validation par schéma ; **0 écriture Supabase depuis ce chemin** (test qui échoue sinon) | 2 |
| 4.2 | **Écran de confirmation des contraintes déduites**, modifiables à la main **avant** génération | Les contraintes s'affichent avant le plan ; une contrainte mal déduite se corrige **sans retaper la phrase**. C'est la réponse structurelle à Jowzi : ses CGU concèdent la « mauvaise interprétation d'un Prompt », et un agent qui décide sans montrer ne peut pas offrir cela | 1,5 |
| 4.3 | Budget de latence et repli déclaré : les cinq boutons d'intention (`app/planning/page.js:15`) **restent** le chemin rapide ; au-delà de 5 s l'appel retombe sur `intent: 'balanced'` **et le dit à l'écran** | Aucune génération n'attend plus de 5 s sur la traduction ; le repli est visible, jamais silencieux | 0,5 |
| 4.4 | Retrait des trois appels Routine du chemin de décision (`TodayMeals.jsx:189`, `:349`, `CookMode.jsx:78`) ; la Routine ne reste que pour la **rédaction** d'une fiche | `tests/planning/aucuneEcritureRoutine.test.js` : **aucun fichier de `app/` ou `components/` n'appelle `/api/routine/*`** sur un chemin de décision, et aucune table de planning n'est écrite hors `publish_canonical_closed_loop_plan` | 1,5 |
| 4.5 | Convergence du chemin legacy `/api/courses/rebuild`, qui **a un appelant vivant** (`app/courses/page.js:400`) et reconstruit la liste depuis `generated_recipe_ingredients` au lieu de la demande canonique | La liste de courses a **une seule** source de vérité. On ne supprime pas la route : on la fait converger, puis on retire le bouton quand la demande canonique le couvre | 0,5 |

**Dépendances** : phase 3 (les alternatives déterministes doivent exister avant
qu'on débranche la Routine, sinon on retire une fonction sans rien rendre).
**Risques.** Perte de fonction perçue pendant la bascule → la Routine reste
disponible pour la rédaction, et le statut `review_required` du solveur devient
la seule issue de secours, **visible à l'écran**.

---

### Phase 5 — L'usine à recettes (en continu dès la semaine 3, ≈ 1,5 j/semaine)

C6 inchangé : **sept portes obligatoires**, un lot de 100 à 150 par semaine,
et **un lot qui ne déplace aucune ligne du §1 n'est pas fusionné**. Deux ajouts
imposés par la mesure :

- **Le corpus doit sortir du bundle avant le millième.** Il pèse 6,7 Mio pour
  754 recettes ; à 3 000 il pèserait ≈ 27 Mio par déploiement. **La phase 0b est
  ce qui rend cette sortie possible** : tant que `operationalCatalog.js` rustine
  l'origine et la conservation depuis le JSON, retirer le JSON du bundle
  casserait le végétarien. Sans la phase 0b, le jalon J1 est un mur.
- **Un lot doit se voir.** La cause lente de départ chez les concurrents est le
  catalogue qui cesse de bouger — « toujours pour les même recettes, il y a
  jamais de nouveautés » (Kuri), « you just pick from the same recipes each
  time » (Mealime). Livrable : un écran **« Nouveautés de la semaine »**
  (`app/recipes/page.js`, filtre sur la date de versement), ≥ 30 recettes datées
  visibles depuis l'accueil chaque semaine. Un lot par semaine qui se voit vaut
  mieux qu'un palier de 3 000 atteint en silence.

Ordre des lots conservé : jumeaux végétariens restants (60 lignées carnées sur
125 n'en ont pas) → plats complets ≥ 0,10 g/kcal (P4) → plats ≤ 30 min (P10) →
cuisines sous-représentées (P13, France à 50 % des créneaux) → batch à
conservation déclarée (P12) → petits-déjeuners et collations, aujourd'hui des
rotations codées en dur (`personalizedMeals.js:285`).

---

## §6 — Calendrier sur douze semaines

| Sem. | Travail | Ce qui doit être vrai à la fin |
|---|---|---|
| **S1** | Phase 0a entière + export presse-papiers | CI verte ; base à 754 ; pagination aux deux sites ; élagage calibré ; **rapport de qualité durable en CI** ; **production déployée** ; la liste sort de l'application |
| **S2** | Phase 0b.1 et 0b.2 : migration du contrat, émission des quatre champs | La RPC rend `origin`, `conservationProfile`, `component`, `derivedFrom` |
| **S3** | Phase 0b.3 à 0b.5 : porte de test, retrait des rustines, parité en CI · **lot 1** (jumeaux) | `operationalCatalog.js` n'importe plus le JSON ; l'écart base/dépôt ne peut plus revenir |
| **S4** | Phase 1.1 : quota de viande par personne · **lot 2** | P6 mesuré sur trois semaines |
| **S5** | Phase 1.2 et 1.3 : refus hors lignée, cible depuis le poids cible · **lot 3** | P7 et P4 mesurés ; défauts de coefficient arrêtés |
| **S6** | Phase 1.4 et 1.5 : plancher de densité, présence par personne · **lot 4** | P5 mesuré ; les absences retirent assiettes et quantités |
| **S7** | Phase 2.1 : liaison aux bases + arbitrage relu · **lot 5** | ≥ 60 plats liés, mesurés sur le chemin base |
| **S8** | Phase 2.2 et 2.3 : capacité lue, fiche de cuisine fusionnée · **lot 6** | P12 ≥ 120 ; P9 ≤ 12 |
| **S9** | **Semaine d'usage — aucun nouveau chantier.** Une semaine complète vécue, corrections seulement. Phase 2.4 (temps = somme) en marge · **lot 7** | ≥ 90 % des 14 créneaux avec une issue enregistrée ; les écarts entre temps annoncé et constaté consignés |
| **S10** | Phase 3.1 à 3.4 : plafonds en avertissement, alternatives, goût, épinglage · **lot 8** | P14 = oui ; P2, P3, P13 mesurés |
| **S11** | Phase 3.5 à 3.7 : export complet, contrat des chiffres, PWA · **lot 9** | P17 et P18 ; l'application s'installe |
| **S12** | Phase 4 entière : la phrase, l'écran de contraintes, retrait des Routines · **lot 10** · **rejeu complet des dix-huit chiffres** | 0 écriture hors publication atomique ; verdict « fini » ou liste nommée de ce qui manque |

**Charge et honnêteté de l'estimation.** 50 jours-agent de chantier (5 + 1 + 7
+ 10 + 12 + 9 + 6), plus dix lots d'usine à ≈ 1,5 jour, soit **≈ 65 jours-agent
sur douze semaines** — environ 5,3 jours par semaine. C'est tendu. La semaine
S9 est la marge, et l'ordre de sacrifice est déclaré d'avance : **si une semaine
déborde, c'est le lot d'usine qui cède, jamais une porte de qualité et jamais un
critère d'acceptation.**

*La moyenne cache où ça casse.* Semaine par semaine, la charge va de 3,5 à
7,5 jours-agent, et **trois semaines sont à 7,5 : S8** (capacité + fiche
fusionnée), **S10** (plafonds, alternatives, goût, épinglage) et **S12** (phase 4
entière + rejeu des dix-huit chiffres). Ce sont elles qui déborderont d'abord ;
c'est là que l'ordre de sacrifice s'appliquera.

*Ce que vaut un jour-agent, mesuré sur ce dépôt.* L'unité n'est pas une
abstraction : `git log --date=short` montre que C1 entier, les **48 jumeaux en
douze lots** et leurs **douze relectures adverses** tiennent entre le
**3 et le 4 septembre 2026** (`9d94988` → `65d5c05`), et que la PR #161 avait
livré **115 recettes** en un lot. La cadence d'usine de 100 par semaine et les
estimations ci-dessus sont donc sous le record observé, pas au-dessus — le
risque de ce calendrier est du côté de la vérification, qui reste le goulot
accepté, pas du côté du volume.

**Où en est le vivier en semaine 12, calcul posé.** 568 publiables aujourd'hui,
plus dix lots de 100 à 150 = **1 568 à 2 068**. On annonce le bas de la
fourchette, parce qu'un lot qui ne déplace aucune ligne du §1 n'est pas fusionné.
Le jalon J3 (3 000) reste à **cinq à six mois**, comme le plan de septembre le
dit déjà.

---

## §7 — Ce qu'on ne fait pas, et pourquoi

1. **Le panier et la commande chez un drive.** Pas un chantier difficile : un
   chantier **fermé** (§3.3). Mandat civil sur les identifiants marchand,
   connecteurs négociés, commission d'enseigne — et en France, au 8 septembre
   2026, aucun assistant IA ne finalise un achat. Ce qu'on livre à la place —
   export, prix sourcés ou absents, panier vérifié à la main — est **ce que les
   CGU de Jowzi imposent de toute façon à leurs propres utilisateurs**. C'est un
   choix assumé, pas un échec.
2. **Les liens profonds vers les enseignes.** Aucune URL d'enseigne n'a été
   ouverte et vérifiée dans ce travail. Promettre un lien qu'on n'a pas testé
   serait exactement la faute que ce plan s'interdit. À reprendre après lecture
   réelle, pas avant.
3. **La voix.** Aucun `SpeechRecognition` ni `MediaRecorder` dans le dépôt ; le
   seul `getUserMedia` est la caméra du scanner de code-barres
   (`app/pantry/components/BarcodeScanner.jsx:42`). Et c'est du décor sans la
   phase 4 : chez Jowzi la dictée existe, et un utilisateur constate que « dans
   les deux cas, JOWZI ne m'a proposé aucune recette ». À reconsidérer après S12.
4. **Le mémo WhatsApp et le mode collaboratif.** API business, entreprise
   vérifiée, numéro dédié, conformité — pour un foyer de deux personnes. Le
   sous-ensemble qui compte (l'ajout de l'un se voit chez l'autre) passe par le
   temps réel Supabase, qui coûte deux jours au lieu de vingt ; il est **hors de
   ces douze semaines**, pas hors du produit.
5. **L'inscription et l'ajout d'un membre.** `signUp` : 0 occurrence ; le POST
   des membres n'a aucun appelant. Les deux comptes existent. Cela ne débloque
   aucune ligne de P1–P18 et n'est pas sur le chemin de l'usage hebdomadaire —
   mais c'est le premier candidat pour la semaine 13, parce que c'est ce qui
   prouve que rien n'est codé en dur pour « Julien ET Zoé ».
6. **Le potager.** `app/garden/page.jsx:19` lit une table qui n'existe pas,
   **depuis le navigateur** — page en erreur *et* violation du piège n°1 du
   `CLAUDE.md`. On **retire l'entrée du menu** (dix minutes) plutôt que de servir
   une page en erreur ; le chantier lui-même ne déplace aucune ligne du §1. À
   noter : aucune application trouvée sur ce marché ne relie une récolte à un
   menu — l'idée reste bonne, ce n'est simplement pas le moment.
7. **L'encyclopédie.** 282 livres planifiés, **1 rédigé, 0 validé**,
   `ready_for_integration: false`. C'est un plan éditorial, pas un contenu.
   Gelée.
8. **Les 186 recettes bloquées.** 40 formes corrigées n'en libèrent que 61 ; le
   même effort en jumeaux déplace P6 à P9. L'arbitrage du plan de septembre
   tient, et la comparaison avec Jowzi ne le change pas.
9. **Réécrire le solveur.** 17 termes, faisceau 48, 0 reprise intra-semaine
   mesurée. **Il lui manque des yeux, pas un cerveau** — et c'est précisément ce
   que la phase 0 lui rend.
10. **Les images sur les recettes canoniques.** `image_url: null` est écrit en
    dur. C'est du décor tant que P1 à P13 ne sont pas tenus.
11. **Un abonnement.** Le passage au payant est la cause n°1 de départ chez Jow
    (153 avis sur 500, dont 117 à une étoile). Myko n'a ni commission d'enseigne
    ni besoin d'en avoir.

---

## §8 — Décisions qui reviennent à Julien et Zoé

| Décision | Recommandation |
|---|---|
| **Coefficient protéique (g/kg de poids cible)** | 1,6 en perte, 1,4 en maintien, réglable par personne. **Mesurer P4 à 1,4 / 1,6 / 1,7 avant de figer.** Les 216 g d'aujourd'hui sont 1,8 g/kg du poids **actuel** : la cible n'est pas ambitieuse, elle est inatteignable par le corpus. Ne pas viser 1,8 tant que le vivier dense n'existe pas |
| **`meat_meals_per_week` de chacun** | Julien 4, Zoé 1 ou 2 pour commencer, puis ajuster en S9. Aujourd'hui Zoé est à 0/14 **par accident** du plafond foyer, pas par choix |
| **Définition de P10 à retenir** | Le critère dit « minutes de cuisine par semaine ». Trois chiffres coexistent : préparation active engagée (**320-340**), préparation active si tout est frais (**405-415**), préparation + cuisson (**1140-1465**). Recommandation : retenir la **préparation active engagée** comme critère (c'est le temps qu'on passe debout), et **afficher les trois** à l'utilisateur. Un seul chiffre affiché sans sa définition est un chiffre faux. **Et une garde** : la cible ≤ 600 a été fixée le 3 septembre contre la définition « tout frais » (1 065 minutes). Changer de définition sans refixer la cible ferait gagner P10 par un changement de règle, ce que ce plan s'interdit ailleurs. Si la préparation active engagée est retenue, la cible se refixe avec elle — ≤ 300 minutes est la proposition, et elle est tenue dès aujourd'hui, ce qui doit être dit plutôt que masqué |
| **Sortie principale de la liste** | Presse-papiers d'abord (une journée, S1), **partage natif ensuite** (l'usage est au téléphone), PDF en dernier. On colle dans Notes ; on ne sort pas une imprimante le samedi |
| **La saisie en langage naturel plus tôt ?** | Elle est en S12 parce qu'elle dépend de la phase 3 pour le retrait des Routines. **Mais le traducteur et l'écran de contraintes (4.1 à 4.3, 4 jours) peuvent passer en S6** si vous le voulez : ils ne dépendent que de la phase 0. Le retrait des Routines, lui, ne peut pas bouger. Dites-le maintenant si c'est ce que vous voulez voir en premier |
| **La Routine LLM** | La garder **pour la rédaction seulement** (régénérer le texte d'une fiche), jamais pour la décision. Si elle n'a pas servi en un mois, la retirer : une porte ouverte hors règles finit par servir |
| **Rythme de la semaine** | Génération le samedi matin, courses le samedi, session de cuisine le dimanche. La capacité déclarée de la phase 2 en dépend, et S9 la met à l'épreuve |
| **Cadence de l'usine** | 100 par semaine plutôt que 150. La vérification des sources est le goulot **accepté** — c'est elle qui fait la qualité |
| **Petits-déjeuners et collations** | Garder les rotations codées en dur pendant ces douze semaines. Les faire entrer au corpus est un lot d'usine, pas un chantier |
| **Troisième membre du foyer** | Construire l'ajout de membre même à deux, en S13 : c'est ce qui prouve que rien n'est codé en dur pour deux personnes |

---

## §9 — Comment on saura que c'est fini

« Fini » n'est ni une liste d'écrans ni une liste de chiffres seuls. **Trois
familles, toutes vérifiables en base ou en CI** — la première par
`tests/planning/rapportQualiteSemaine.test.js`, livré en phase 0a précisément
pour que chacun puisse rejouer les chiffres et en contester un. La troisième est nouvelle, et
elle compte autant que les deux autres : un plan qui ne vérifie jamais l'usage
risque de perfectionner une chose que personne n'ouvre — et aujourd'hui
`cooking_sessions` vaut **0 depuis toujours**, le dernier lot du garde-manger
date du **16 juillet** et le dernier plat cuisiné du **17 juin**.

### 9.1 Qualité — dix-huit chiffres, trois semaines de suite, sur le chemin de production

P1 ≥ 12 distincts **et** P1bis 0 reprise sur 3 semaines · P2 pâtes ≤ 15 %, aucun
féculent > 25 % · P3 ≤ 20 % · **P4 ≥ 6 jours sur 7** à ≥ 85 % de la cible
**calculée depuis le poids cible** · P5 ≤ 1,3 · P6 quota de chacun ± 1 · P7 = 0
hors lignée quand un jumeau existe · **P8 = 0** *(déjà tenu)* · P9 ≤ 12 · P10
sous la définition retenue au §8 · **P11 = 0** *(déjà tenu)* · P12 ≥ 120 plats
liés **et** ≥ 4 repas par semaine qui en profitent · P13 ≥ 8 cuisines, aucune au
dessus de 40 %, libellés composites normalisés · P14 retour de goût atteignable
**et lu par la génération suivante** · P15 3 000 recettes ayant passé les sept portes,
**0 porte assouplie** · P16 ≤ 10 s à 3 000 · **P17** trois sorties testées contre
`nutrition_plan_shopping_items` · **P18** un chiffre affiché est calculé ou
absent, sur les trois écrans.

### 9.2 Usage — quatre semaines consécutives, mesurées en base

4 plans publiés depuis l'application · **≥ 90 %** des 14 créneaux avec une issue
enregistrée (cuisiné, consommé, sauté) · **≥ 1 `cooking_sessions` par semaine**
(0 depuis toujours) · **≥ 30 lots actifs** au garde-manger · **≥ 20 lignes** de
`meal_taste_feedback` (0 aujourd'hui) · la liste exportée au moins une fois par
semaine.

Et un critère humain, qui vaut autant que les dix-huit autres : **pendant quatre
semaines, aucun autre outil n'a servi à décider d'un repas.** Si cette phrase est
fausse, le plan n'est pas fini, quels que soient les chiffres.

### 9.3 Vérité — quatre interdits, pas des critères

- **Zéro écriture** dans les tables de planning hors publication atomique.
- **Zéro champ du contrat opérationnel rustiné depuis le JSON** : le jour où
  `lib/domain/recipes/operationalCatalog.js` n'importe plus `corpus-v3.json`,
  Myko sert enfin en production ce qu'il a déjà écrit.
- **Zéro chiffre affiché non calculé**, et zéro prix deviné.
- **Zéro déploiement de production de plus de sept jours**, et
  `check-corpus-parity` verte — l'écart base/dépôt ne doit pas pouvoir revenir.

C'est ce jour-là, et pas avant, que Myko fait ce que Jowzi promet sur la saisie,
et ce que les CGU de Jowzi lui interdisent de promettre sur l'assiette.

---

## §10 — Sources

**Convention de lecture.** *Lu intégralement* = le texte brut complet a été
obtenu, citations verbatim. *Restitution d'outil* = la page a bien été chargée,
mais l'outil en rend une réponse ciblée, pas le texte mot à mot. *Extrait
seulement* = connu par un extrait de moteur de recherche ou une page
partiellement rendue ; jamais compté comme un fait ferme.

### Jowzi

| Source | Lecture | Ce qu'elle établit ici |
|---|---|---|
| [static.jow.fr/jowzi/pdf/27_08_CP_Jowzi_B2C.pdf](https://static.jow.fr/jowzi/pdf/27_08_CP_Jowzi_B2C.pdf) | Lu intégralement (5 pages) | Lancement officiel le 8 septembre 2026 ; questionnaire d'entrée ; prix unitaire et prix au kilo affichés ; « quantités ajustées à votre foyer » |
| [itunes.apple.com/lookup?id=6759919620&country=fr](https://itunes.apple.com/lookup?id=6759919620&country=fr) | Données structurées (API Apple) | Première publication iOS le 16 juillet 2026 ; 4,17/5 sur 23 notes ; fiche US en français, 0 note ; enseignes ; description fonctionnelle complète ; toutes les promesses chiffrées |
| [itunes.apple.com — flux RSS des avis Jowzi](https://itunes.apple.com/fr/rss/customerreviews/id=6759919620/sortBy=mostRecent/json) | Lu intégralement (9 avis) | L'avis 3★ « Aurel-Minet » du 1er sept. ; l'onboarding bloqué ; « la même app remise à la sauce AI » |
| [jow.fr/lp/misc/cgu-v8-20260518](https://jow.fr/lp/misc/cgu-v8-20260518) | Lu intégralement (~150 000 car.) | Mandat civil art. 9 ; commission 0,99 € art. 8 ; obligation de moyens ; hallucinations reconnues ; **« aucun avis médical, diététique ou nutritionnel »** ; version exploratoire ; et les zéros de « stock / DLC / protéine / calorie ». **Réserve** : page hébergée sur jow.fr, datée du 18 mai 2026 ; aucune page de CGU sur jowzi.ai n'a pu être ouverte |
| [lineaires.com — Jow lance Jowzi](https://www.lineaires.com/la-distribution/jow-lance-son-agent-de-courses-ia-jowzi) | Restitution d'outil | Liste Magique (citations Sabatier) ; « Ping la famille » ; **la mise au panier vendue aux marques** (citation Bommel) ; « 10 000 supermarchés », « 80 % », *selon Jow* |
| [play.google.com — Jowzi](https://play.google.com/store/apps/details?id=com.wishop.dev.jowzi&hl=fr) | HTML téléchargé et fouillé | « 5 k+ » téléchargements ; **aucune note ni section d'avis** |
| [jowzi.ai/fr/fr/keynote](https://jowzi.ai/fr/fr/keynote) · [jowzi.ai/fr/fr](https://jowzi.ai/fr/fr) · [jowzi.ai/us/en](https://jowzi.ai/us/en) | Restitution d'outil | Keynote du 16 juin : aucun texte, une vidéo. Site quasi vide, aucune description fonctionnelle publique |
| [ecranmobile.fr](https://www.ecranmobile.fr/Jow-lance-Jowzi-ai-un-agent-IA-capable-d-automatiser-les-courses-du-supermarche_a79051.html) · [supermarche.tv](https://supermarche.tv/news-1350-jowzi-agent-ia-courses.htm) · [olivierdauvers.fr](https://www.olivierdauvers.fr/2026/06/16/le-recipes-shopping-passe-a-lia-avec-jowzi/) | Extraits seulement | Corroboration de la date du 8 septembre et des trois enseignes ; « de la connexion au paiement final » |

### Jow

| Source | Lecture | Ce qu'elle établit ici |
|---|---|---|
| [jow.fr](https://jow.fr/) | Restitution d'outil | « 8 millions d'utilisateurs comblés » ; +5 000 recettes ; l'enseigne demandée **en première étape** du parcours |
| [jow.fr — CGU](https://jow.fr/pages/misc/conditions-generales-dutilisation) | Restitution d'outil | Mandat art. 9 ; commission art. 8 ; abonnement payant art. 25, sans prix |
| [jow.fr/pages/lp/recipe-upload](https://jow.fr/pages/lp/recipe-upload) | Restitution d'outil | Références produits maintenues par une « équipe Food » |
| [jow.fr/blog — une semaine de batch cooking](https://jow.fr/blog/posts/une-semaine-batchcooking-avec-jow) | Restitution d'outil | Une seule durée de conservation chiffrée, aucune consigne de congélation |
| [itunes.apple.com — flux RSS des avis Jow](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=1301257625/sortby=mostrecent/json) | 500 avis téléchargés et analysés | Le passage au payant (153/500, dont 117 à 1★) ; les bugs (82/500) ; le végétarien ignoré ; la demande de dates de péremption ; la demande d'export de liste ; la demande de protéines en grammes |
| [itunes.apple.com/lookup?id=1301257625&country=fr](https://itunes.apple.com/lookup?id=1301257625&country=fr) | Données structurées | 4,81/5 sur 46 369 notes — une moyenne qui agrège huit ans |
| [trustpilot.com/review/jow.fr](https://www.trustpilot.com/review/jow.fr) · [avis 1-2★](https://fr-be.trustpilot.com/review/jow.fr?stars=1&stars=2) | Restitution d'outil | 4,2/5 sur 371 avis ; « les recettes deviennent similaires » ; **« de plus en plus de recettes sont avec des produits de sponsors ultra transformé »** |
| [blog corporate de Jow — Sabatier](https://jow.com/corporate-blog/blog-entries/supermarkets-or-super-platforms-grocers-must-stop-wasting-resources-on-ai-assistant-pocs-and-focus-on-platformizing-their-it-for-ai-agents) | **Page lue le 16 septembre** (HTTP 200, citation relevée mot pour mot) | « Since grocers lacked the necessary APIs, Jow built day one an extensive, normalized integration layer across multiple retailers—effectively becoming a supermarket API hub ». La citation était employée comme un fait ferme alors que la source était classée « extrait seulement » : la contradiction est levée par la lecture |
| [wydden.com](https://wydden.com/jow-startup-course-food-levee-de-fonds/) · [mntd.fr](https://www.mntd.fr/jow-un-nouvel-acteur-du-retail-media-qui-ne-manque-pas-d-appetit-755661/) | Restitution d'outil | Commission d'enseigne ; « entre 20 et 30 % de nos revenus proviennent de la publicité » |
| [fr.wikipedia.org/wiki/Jow.fr](https://fr.wikipedia.org/wiki/Jow.fr) · [bb-joh.fr](https://www.bb-joh.fr/2022/05/29/test-avis-code-promo-jow/) · [valxor.com](https://valxor.com/application-jow-avis-budget/) | Restitution d'outil | Historique et levées ; perte du panier au changement d'enseigne ; comparaison de prix entre marques |

### Marché et concurrents

| Source | Lecture | Ce qu'elle établit ici |
|---|---|---|
| [carrefour.fr/robots.txt](https://www.carrefour.fr/robots.txt) · [intermarche.com/robots.txt](https://www.intermarche.com/robots.txt) | **Lus intégralement** | La correction du §0.2 : ni `/panier` ni `/commande` interdits chez Carrefour ; le **catalogue** interdit chez Intermarché |
| [Baromètre Converteo 2026, via academy.visiplus.com](https://academy.visiplus.com/blog/web-et-e-business/e-commerce-web-et-e-business/commerce-agentique-ou-en-est-le-commerce-francais-2026-09-08) | Page lue intégralement le 16 septembre | **Aucun assistant IA ne finalise un achat en France** (« l'autonomie transactionnelle reste au point mort ») ; 26 % du Top 100 ont un assistant, 22 % en élargissant ; « à peine plus du tiers » autorisent l'ajout au panier — **l'étude ne donne pas de pourcentage sur ce point**, et le « 35 % » d'une rédaction antérieure a été retiré |
| [lineaires.com — Carrefour et l'UCP de Google](https://www.lineaires.com/la-distribution/agents-ia-de-courses-carrefour-monte-dans-le-train-google) · [Carrefour dans ChatGPT](https://www.lineaires.com/la-distribution/carrefour-les-clients-peuvent-faire-leurs-courses-sur-chatgpt) | Restitution d'outil, les deux relues le 16 septembre | ChatGPT (26 mars 2026) : « avant de finaliser et régler la commande sur Carrefour.fr ». UCP (13 janvier 2026) : l'annonce promet l'achat **depuis les outils de Google**, sans aller sur le site de l'enseigne — **les deux articles ne disent donc pas la même chose**, et une rédaction antérieure les avait résumés dans le seul sens de Carrefour.fr |
| [ballardspahr.com — 9e Circuit, 4 août 2026](https://www.ballardspahr.com/insights/alerts-and-articles/2026/08/ninth-circuit-opines-on-agentic-ai-in-e-commerce) | Restitution d'outil | L'agent est « un outil, pas une personne » — **mais les recours contractuels restent ouverts** |
| [helpcenter.channable.com — « API Carrefour France »](https://helpcenter.channable.com/list-advertise/list-and-advertise-fr/vendre-sur-les-marketplaces/marketplaces-mirakl/configurer-une-api-carrefour-france) | Extrait seulement | L'« API Carrefour France » est la marketplace Mirakl, destinée aux **vendeurs** |
| [Avis Basta Batchcooking](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=6752601333/sortby=mostrecent/json) | Flux RSS téléchargé | « 2h annoncées, j'ai chronométré, 5h36 » ; « 5 oignons dans chaque recette » ; « 49g de protéines et ensuite 13g » ; la demande de bases partagées |
| [Avis Kuri](https://itunes.apple.com/fr/rss/customerreviews/page=1/id=1510387870/sortby=mostrecent/json) · [Avis Mealime](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1079999103/sortby=mostrecent/json) · [mealime.com](https://www.mealime.com/) | Flux RSS / restitution | Le catalogue qui cesse de bouger ; la fermeture de Mealime au 21 octobre 2026 |

### Ce qui n'a pas pu être lu, et qui n'est donc pas utilisé

- **Le contenu de la keynote du 16 juin 2026** : la page n'héberge qu'une vidéo,
  non regardée. Tout ce qui y a été dit est inconnu.
- **La feuille de route de Jowzi** : aucune source publique n'annonce une
  enseigne nouvelle, une date américaine ou une évolution fonctionnelle. **Il n'y
  a rien à en dire, et rien à en deviner.**
- **Les enseignes américaines de Jowzi** : aucune n'est nommée nulle part.
- **Le prix de l'abonnement de Jow** : les CGU prouvent qu'il existe (art. 25)
  sans le donner ; l'App Store annonce 2,99 € à 49,99 €, un site d'affiliation
  9,99/19,99/29,99 €, des utilisateurs en colère 10 à 12 €/mois. **Les trois se
  contredisent : aucun prix de Jow n'est écrit dans ce plan.**
- **Le ou les fournisseurs de modèles d'IA de Jowzi** : jamais nommés, ni dans
  les CGU, ni dans la politique de confidentialité, ni dans la presse.
- **Comment le mandat s'exécute techniquement** : les CGU évoquent une connexion
  avec les identifiants, le blog évoque des connecteurs normalisés. Aucune source
  lue ne tranche.
- **La vérification indépendante des chiffres de Jow** (10 000 magasins, 80 %
  d'automatisation, moins de 5 minutes, 8/9/10 millions d'utilisateurs, 400
  millions de repas) : **aucune**. Tous viennent de l'éditeur.
- **L'article de LSA conso** sur le lancement de Jowzi : HTTP 403, jamais lu.
- **Le déploiement de production du 3 septembre** est une mesure d'API, pas une
  lecture de code : elle est reprise de l'inventaire du 16 septembre et rejouée
  à la rédaction, mais elle n'a pas de chemin de fichier à l'appui comme le
  reste des constats sur Myko.

---

*Écrit le 16 septembre 2026. Aucune opération git n'a été effectuée. Le plan de
septembre (`docs/PLAN_PLANNING_PARFAIT.md`) reste la référence de qualité ; ce
document dit dans quel ordre l'exécuter maintenant que C1 est fait et que le
tuyau est mesuré.*
