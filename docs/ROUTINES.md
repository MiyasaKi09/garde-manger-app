# Routines Claude — Myko

Myko délègue toute la génération IA à des **Routines Claude** (claude.ai/code),
exécutées sur l'abonnement Claude Pro. **Aucun appel à l'API Anthropic facturée.**
Le site `my-ko.fr` ne fait que **déclencher** les routines via leurs webhooks.

## Les 3 routines

| # | Nom | Déclencheur | Connecteur | Écrit dans |
|---|-----|-------------|------------|-----------|
| 1 | `Myko - Planning hebdo` | Planification (dim. 18h) **+ Appel via API** | Supabase MCP | `nutrition_plan_imports`, `nutrition_plan_meals` |
| 2 | `Myko - Modifier un repas` | Appel via API (webhook) | Supabase MCP | `nutrition_plan_meals` (Julien + Zoé) |
| 3 | `Myko - Régénérer une recette` | Appel via API (webhook) | Supabase MCP | `generated_recipes` |

Les instructions exactes à coller dans le champ « Instructions » de chaque
routine (versions **corrigées** contre le schéma réel de la base) sont fournies
hors-dépôt (voir le message de mise en place / la PR). Points clés :

- `nutrition_plan_meals.meal_type` ∈ `pdj`, `dejeuner`, `diner`, `collation`
  (**jamais** `dej`/`din`). `person_name` ∈ `Julien`, `Zoé` (accentué).
- La typologie du jour est dans la colonne `nutrition_plan_meals.day_type`
  (`gourmand` / `standard` / `léger`) — pas besoin de parser `raw_json`.
- `generated_recipes` n'a **pas** de `name`, `macros_per_100g`, `total_time_min`,
  `portions_julien/zoe`, `updated_at`. Colonnes réelles : `title`,
  `name_normalized`, `description`, `servings`, `prep_min`, `cook_min`,
  `ingredients` (jsonb), `steps` (jsonb), `chef_tips`, `nutrition_per_serving`
  (jsonb, **par portion**, pas par 100 g).

## Variables d'environnement (Vercel — serveur uniquement)

À définir dans Vercel → Project Settings → Environment Variables.
**Jamais** de préfixe `NEXT_PUBLIC_` : ces secrets restent côté serveur.

| Variable | Valeur |
|----------|--------|
| `CLAUDE_ROUTINE_GENERATE_PLAN_URL`  | URL webhook de la routine 1 (trigger API) |
| `CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN`| Token de la routine 1 (trigger API) |
| `CLAUDE_ROUTINE_MODIFY_MEAL_URL`   | URL webhook de la routine 2 |
| `CLAUDE_ROUTINE_MODIFY_MEAL_TOKEN` | Token de la routine 2 |
| `CLAUDE_ROUTINE_REGEN_RECIPE_URL`  | URL webhook de la routine 3 |
| `CLAUDE_ROUTINE_REGEN_RECIPE_TOKEN`| Token de la routine 3 |

URL + token sont fournis par claude.ai/code lors de la création d'une routine
à déclencheur « Appel via API ». Si une variable manque, l'endpoint répond
`503 Routine non configurée` (le site ne plante pas).

## Endpoints de déclenchement (Next.js, App Router)

- `POST /api/routine/modify-meal`
  Body : `{ import_id, meal_date, meal_type, person_name, direction? }`
  Auth via `lib/apiAuth` (Bearer Supabase ou cookie). Vérifie que le planning
  appartient à l'utilisateur, puis relaie au webhook routine 2.
- `POST /api/routine/regenerate-recipe`
  Body : `{ recipe_id?, recipe_name?, direction? }` (au moins un id).
  Vérifie que la recette appartient à l'utilisateur, puis relaie au webhook
  routine 3.
- `POST /api/routine/generate-plan`
  Body optionnel : `{ days?: string[], from?, to? }`. Auth seule (pas de
  ressource à vérifier). **Fire-and-forget** : déclenche la routine 1 et rend
  la main (`202`) — n'attend PAS la génération (trop longue). Le client poll
  ensuite `GET /api/planning/imports` jusqu'à voir un nouvel import.

modify-meal / regenerate-recipe : `maxDuration = 60`, timeout interne 55 s
(→ `504` propre), `502` si le webhook renvoie une erreur.
generate-plan : timeout déclenchement 20 s ; un timeout est traité comme
« routine acceptée, tourne en asynchrone » (`202 pending`).

## Câblage UI

- **Modifier un repas** : `app/planning/components/TodayMeals.jsx`. Le bouton
  « Changer ce plat » ouvre un champ « direction » libre et appelle
  `/api/routine/modify-meal`. L'ancien chemin facturé `/api/ai/plan/swap` a été
  **supprimé**.
- **Régénérer une recette** : `components/CookMode.jsx` (écran d'accueil de la
  cuisine — seul endroit où une `generated_recipes` est affichée aujourd'hui).
- **Générer le planning** : `app/planning/assistant/page.js`. Plus aucun appel
  facturé : on déclenche `/api/routine/generate-plan` puis on poll
  `/api/planning/imports` (12 s, max 6 min) avant de rediriger vers `/planning`.
  Les anciens appels facturés `/api/ai/chat` (intent planning) et
  `/api/ai/plan/generate` ont été **retirés de ce flux**.

### ⚠️ Régressions connues à résoudre (générer le planning)

L'ancien `/api/ai/plan/generate` faisait, après la sauvegarde du plan, deux
choses que **la routine 1 ne fait pas (encore)** :

1. **Reconstruction de la liste de courses** (`nutrition_plan_shopping_items`
   recalculée depuis les ingrédients réels − stock). Tant que la routine 1
   n'écrit pas cette table, la liste de courses sera **vide** après un planning
   généré par routine. → Étendre les instructions de la routine 1 pour produire
   `nutrition_plan_shopping_items`, OU prévoir un post-traitement non facturé.
2. **Génération des fiches recettes manquantes** (`generated_recipes` avec
   `steps`). Sans ça, « Cuisiner » devra générer la fiche à la volée (toujours
   facturé via `/api/ai/recipe`, hors scope). → idéalement la routine 1 peuple
   aussi `generated_recipes`.

Le fichier `app/api/ai/plan/generate/route.js` n'est **plus appelé par l'UI**
mais conservé (il contient cette logique courses/recettes encore utile). À
supprimer une fois la routine 1 autonome sur ces deux points.

## Hypothèses & limites connues (à valider en test bout-en-bout)

0. **Header `anthropic-version` OBLIGATOIRE** : le endpoint de fire
   (`api.anthropic.com/v1/claude_code/routines/<trig>/fire`) refuse l'appel
   (`400 anthropic-version: header is required`) sans ce header. Les 3 routes
   l'envoient désormais (`anthropic-version: 2023-06-01`). Vérifié en test réel.
1. **Webhook ASYNCHRONE — confirmé en test réel** : le fire répond en ~1,5 s
   avec `{claude_code_session_id, claude_code_session_url, type:"routine_fire"}`
   puis la routine tourne en arrière-plan (écrit en Supabase ~1-2 min après).
   Donc : `generate-plan`, `modify-meal` et `regenerate-recipe` déclenchent puis
   le **client poll** le résultat (pas d'attente synchrone). Modify-meal poll la
   description du repas (max 4 min) ; generate-plan poll un nouvel import
   (max 6 min).
2. **Régénération recette** : pas de re-fetch live dans CookMode (pas d'endpoint
   GET pour une `generated_recipes` unique). Message « lancée », l'utilisateur
   ferme/rouvre la cuisine ~1-2 min après. Endpoint de relecture = chantier
   séparé.
3. **`person_name` = ancre** : l'UI envoie toujours `Julien` ; la routine 2 met
   à jour Julien **et** Zoé (même plat, portions différentes).
4. **Plan Vercel** : `maxDuration = 60` suppose un plan autorisant 60 s. Sur
   Hobby, 60 s est le max ; si la routine dépasse, augmenter le plan ou rendre
   l'appel asynchrone (cf. point 1).
5. **generate-plan TRÈS LONG (~15-20 min observé)** : la Routine 1 (prompt
   v2.6.2 ~1018 lignes, semaine complète + validation, sur Opus « Très élevé »)
   prend ~15-20 min en test réel — bien plus que les 1-3 min estimés. L'UI poll
   jusqu'à **25 min** (toutes les 20 s) ; au-delà, message calme « apparaîtra
   d'ici quelques minutes » et redirection vers `/planning` — **pas d'état
   d'erreur ni de bouton retry** (un retry relancerait un 2e run de 20 min).
   Si l'utilisateur ferme l'onglet, le planning s'écrit quand même (async) et
   apparaîtra dans `/planning`. **Levier produit** : si 20 min est trop long,
   baisser l'effort de raisonnement / le modèle de la Routine 1, ou alléger le
   prompt — décision côté Julien (qualité vs latence).
   **Contrat de complétude** : avec le pipeline checkpointé v3, l'import est
   créé tôt (CP1) puis rempli jour par jour. Le polling ne considère le
   planning prêt que lorsque `nutrition_plan_meals` atteint **49 lignes**
   (7 j × 7) pour cet import — sinon il afficherait un planning partiel.
   Feedback UI : « Génération en cours… N/49 repas ».
6. **Sélection de jours non honorée** : la page assistant envoie `days/from/to`,
   mais la routine 1 (instructions actuelles = « semaine type ») les ignore tant
   qu'on ne l'a pas étendue pour lire ce body. Génère la semaine standard.

## Chantier futur (hors scope de cette PR)

Unifier le catalogue : déprécier les ~611 recettes statiques (`recipes`) et
faire des recettes Myko (`generated_recipes`) le nouveau catalogue. Implique
migration de données, refonte des pages `app/recipes/**`, redirections. À
traiter dans une initiative dédiée.

## Ajouter une nouvelle routine

1. claude.ai/code → Routines → Nouvelle routine, déclencheur « Appel via API ».
2. Connecteur Supabase, dépôt `MiyasaKi09/garde-manger-app`.
3. Coller des instructions **alignées sur le schéma réel** (vérifier les noms de
   colonnes via Supabase avant — cf. bugs corrigés ci-dessus).
4. Récupérer URL + token → 2 variables d'env Vercel `CLAUDE_ROUTINE_*`.
5. Créer `app/api/routine/<nom>/route.js` sur le modèle des deux existants
   (auth + vérif propriété + relais webhook + timeout).
