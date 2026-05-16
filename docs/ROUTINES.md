# Routines Claude — Myko

Myko délègue toute la génération IA à des **Routines Claude** (claude.ai/code),
exécutées sur l'abonnement Claude Pro. **Aucun appel à l'API Anthropic facturée.**
Le site `my-ko.fr` ne fait que **déclencher** les routines via leurs webhooks.

## Les 3 routines

| # | Nom | Déclencheur | Connecteur | Écrit dans |
|---|-----|-------------|------------|-----------|
| 1 | `Myko - Planning hebdo` | Planification (dim. 18h) | Supabase MCP | `nutrition_plan_imports`, `nutrition_plan_meals` |
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

Les deux : `maxDuration = 60`, timeout interne 55 s (→ `504` propre si la
routine traîne), `502` si le webhook renvoie une erreur.

## Câblage UI

- **Modifier un repas** : `app/planning/components/TodayMeals.jsx`. Le bouton
  « Changer ce plat » ouvre un champ « direction » libre et appelle
  `/api/routine/modify-meal`. L'ancien chemin facturé `/api/ai/plan/swap` a été
  **supprimé**.
- **Régénérer une recette** : `components/CookMode.jsx` (écran d'accueil de la
  cuisine — seul endroit où une `generated_recipes` est affichée aujourd'hui).

## Hypothèses & limites connues (à valider en test bout-en-bout)

1. **Sémantique du webhook supposée synchrone** : l'endpoint `await` la réponse
   du webhook (~30-60 s) puis le client recharge les données. Si le webhook
   répond immédiatement (202) et que la routine continue en arrière-plan, le
   rechargement arrivera **trop tôt** et l'UI montrera l'ancien repas un moment.
   À confirmer lors du 1er test réel ; si async, ajouter un polling Supabase
   côté client.
2. **Régénération recette** : pas de re-fetch live de la recette dans CookMode
   (il n'existe pas d'endpoint GET pour une `generated_recipes` unique). Après
   succès, l'utilisateur doit fermer/rouvrir la cuisine pour voir la nouvelle
   version. Un endpoint de relecture est un chantier séparé.
3. **`person_name` = ancre** : l'UI envoie toujours `Julien` ; la routine 2 met
   à jour Julien **et** Zoé (même plat, portions différentes).
4. **Plan Vercel** : `maxDuration = 60` suppose un plan autorisant 60 s. Sur
   Hobby, 60 s est le max ; si la routine dépasse, augmenter le plan ou rendre
   l'appel asynchrone (cf. point 1).

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
