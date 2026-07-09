# Routines Claude — Myko

Myko délègue la génération de plans à des **Routines Claude** (claude.ai/code),
exécutées sur l'abonnement Claude Pro. **Aucun appel à l'API Anthropic facturée**
pour la planification. Le site `my-ko.fr` ne fait que **déclencher** les
routines via leurs webhooks, puis lit le résultat dans Supabase.

> Mise à jour juillet 2026 (refonte v5) : le **batch cooking n'est plus une
> routine** — il est généré **in-app** par `POST /api/planning/batch/generate`
> (déterministe + classifieur, instantané). L'ancien relais
> `/api/routine/generate-batch` a été **supprimé**. Voir
> `docs/ROUTINE_BATCH_DEJEUNERS.md` (obsolète, conservé pour l'historique).

## Les routines actives

| # | Nom | Déclencheur | Connecteur | Écrit dans |
|---|-----|-------------|------------|-----------|
| 1 | `Myko - Planning hebdo` | Planification (dim. 18h) **+ Appel via API** | Supabase MCP | `nutrition_plan_imports`, `nutrition_plan_meals`, `nutrition_plan_shopping_items`, `generated_recipes`, `plan_regen_requests` |
| 2 | `Myko - Modifier un repas` | Appel via API (webhook) | Supabase MCP | `nutrition_plan_meals` (Julien + Zoé) |
| 3 | `Myko - Régénérer une recette` | Appel via API (webhook) | Supabase MCP | `generated_recipes` — **dépréciée** (voir plus bas) |

Le prompt complet de la routine 1 (version v5, paramétrée) est dans
`docs/ROUTINE_PLANNING_V5.md`. Points clés du schéma :

- `nutrition_plan_meals.meal_type` ∈ `pdj`, `dejeuner`, `diner`, `collation`
  (**jamais** `dej`/`din`). `person_name` ∈ `Julien`, `Zoé` (accentué).
- La typologie du jour est dans `nutrition_plan_meals.day_type`
  (`gourmand` / `standard` / `léger`).
- Colonnes v5 de `nutrition_plan_meals` : `generated_recipe_id` (FK vers la
  fiche), `is_leftover` (repas « Restes »), `cooked_dish_id`.
- `generated_recipes` : `title`, `name_normalized`, `description`, `servings`,
  `prep_min`, `cook_min`, `ingredients` (jsonb), `steps` (jsonb), `chef_tips`,
  `nutrition_per_serving` (jsonb, **par portion**, pas par 100 g).
- `nutrition_plan_batch_recipes.ingredients_json` (jsonb `[{name, quantity,
  unit}]`) est la forme structurée ; le texte `·`-séparé reste en repli.

## Contrat request_id (cycle de vie des régénérations)

Chaque déclenchement de régénération suit ce cycle :

1. **L'app insère une ligne `plan_regen_requests`** (`status='pending'`,
   cibles `target_start`/`target_end`, éventuels `target_days`/`target_meals`,
   `user_instructions`) — fait par `POST /api/routine/generate-plan` (mode
   régénération) et `POST /api/routine/replan-week`.
2. **Le payload webhook transmet `request_id`** (l'id de la ligne insérée),
   avec `user_id`, `context` (contexte enrichi `lib/aiContextBuilder`) et
   `output_requirements`. La routine traite **cette requête précise** — plus
   de `ORDER BY created_at LIMIT 1` qui pouvait ramasser une vieille requête
   orpheline. Repli routine : plus ancienne `pending` du `user_id` si
   `request_id` est absent (compat v4.1).
3. **Heartbeat** : la routine rafraîchit `updated_at` à chaque checkpoint et
   passe `status='processing'` dès la prise en charge.
4. **Write-back d'erreur** : en cas d'échec ou d'incohérence, la routine écrit
   `status='error'` **et** `error_message` (explicite). Elle ne pose
   `status='done'` qu'après sa vérification finale par comptage.

### Suivi côté app (poller honnête, `app/planning/page.js`)

Le poller lit la dernière `plan_regen_requests` de l'utilisateur toutes les
8 s (max 6 min) :

- `done` → invalide le cache, recharge les imports, puis appelle la
  **validation post-génération** (voir ci-dessous) ;
- `error` → affiche `error_message` (toast + modal), état `error` ;
- délai dépassé → état **`stalled`** : « La génération prend plus de temps que
  prévu — elle continue en arrière-plan », avec « Vérifier » (re-check
  ponctuel) et « Relancer ». **Plus jamais de faux « done » simulé.**
- **Reprise au montage** : si une requête `pending`/`processing` de moins de
  15 min existe, la page ré-affiche automatiquement la progression (onglet
  fermé/rouvert pendant la génération).

### Validation post-génération

`GET /api/planning/imports/[importId]/validate` (auth + propriété de
l'import) retourne un rapport déterministe :

```json
{
  "meals_count": 49,
  "expected_count": 49,
  "missing_slots":        [{ "date": "…", "type": "…", "person": "…" }],
  "invalid_macros":       [{ "date": "…", "type": "…", "person": "…" }],
  "dej_diner_sans_fiche": [{ "date": "…", "type": "…" }],
  "shopping_count": 42,
  "ok": true
}
```

- Grille attendue : 7 lignes/jour sur la plage de l'import (Julien
  pdj/déjeuner/dîner/collation + Zoé déjeuner/dîner/collation).
- `invalid_macros` : `kcal` null ou 0 sur un repas non-restes.
- `dej_diner_sans_fiche` : déjeuner/dîner non-restes avec
  `generated_recipe_id` NULL (vide tant que la migration v5 n'est pas posée).
- `ok` = aucune anomalie **et** liste de courses non vide.

Si `!ok`, la page planning affiche une bannière récapitulative avec un bouton
**« Compléter »** qui pré-remplit le modal de régénération en mode
`target_meals` avec les créneaux manquants.

### Totaux journaliers calculés côté app

La routine n'écrit pas `nutrition_plan_daily_totals`. Quand la table est vide
pour un import, `lib/nutritionPlanService.getImport` **calcule** les totaux
jour/personne par agrégation des repas (`aggregateDailyTotals`, testée dans
`tests/dailyTotalsAggregation.test.js`) — flag `validated` (« dans la
cible ») dérivé de `user_health_goals.target_calories` ±10 % quand
l'objectif existe. Les imports xlsx gardent leur chemin actuel (table remplie
au parse).

## Batch cooking : in-app, pas de routine

`POST /api/planning/batch/generate` (payant côté app, décision assumée) :
regroupe les déjeuners de la semaine en préparations
(`nutrition_plan_batch_recipes` avec `cook_date`, `portions_total`,
`ingredients_json`…), relie les repas (`batch_recipe_id`) et écrit la
check-list (`nutrition_plan_prep_tasks`). Déclenché par le bouton
« Planifier le batch » de `/planning`.

## Variables d'environnement (Vercel — serveur uniquement)

À définir dans Vercel → Project Settings → Environment Variables.
**Jamais** de préfixe `NEXT_PUBLIC_` : ces secrets restent côté serveur.

| Variable | Valeur |
|----------|--------|
| `CLAUDE_ROUTINE_GENERATE_PLAN_URL`  | URL webhook de la routine 1 (trigger API) |
| `CLAUDE_ROUTINE_GENERATE_PLAN_TOKEN`| Token de la routine 1 (trigger API) |
| `CLAUDE_ROUTINE_MODIFY_MEAL_URL`   | URL webhook de la routine 2 |
| `CLAUDE_ROUTINE_MODIFY_MEAL_TOKEN` | Token de la routine 2 |
| `CLAUDE_ROUTINE_REGEN_RECIPE_URL`  | URL webhook de la routine 3 (dépréciée) |
| `CLAUDE_ROUTINE_REGEN_RECIPE_TOKEN`| Token de la routine 3 (dépréciée) |

URL + token sont fournis par claude.ai/code lors de la création d'une routine
à déclencheur « Appel via API ». Si une variable manque, l'endpoint répond
`503 Routine non configurée` (le site ne plante pas).

## Endpoints de déclenchement (Next.js, App Router)

- `POST /api/routine/generate-plan`
  Sans body : génération de la semaine suivante. Avec
  `{ importId, targetStart, targetEnd, days?, meals?, instructions? }` :
  insère la requête `plan_regen_requests` puis déclenche la routine 1 avec
  `request_id` dans le payload. **Fire-and-forget** (`202`) — le suivi se fait
  par le poller de `/planning`.
- `POST /api/routine/replan-week`
  Body : `{ import_id, pinned?, reason? }`. Compose une requête de
  re-planning (fenêtre aujourd'hui → fin du plan, créneaux validés
  intouchables, budget nutritionnel restant) et déclenche la routine 1 avec
  `request_id`.
- `POST /api/routine/modify-meal`
  Body : `{ import_id, meal_date, meal_type, person_name, direction? }`.
  Relaie au webhook routine 2 (`maxDuration = 60`, timeout interne 55 s).
- `POST /api/routine/regenerate-recipe` — **déprécié**. Encore appelé par le
  bouton « Changer le plat » de `components/CookMode.jsx` ; à supprimer une
  fois ce bouton migré vers `modify-meal`/replan. Ne pas câbler de nouveau
  code dessus.

Supprimé : `POST /api/routine/generate-batch` (le batch est in-app, voir
ci-dessus).

generate-plan / replan-week : timeout de déclenchement 20 s ; un timeout est
traité comme « routine acceptée, tourne en asynchrone » (`202 pending`).

## Câblage UI

- **Modifier un repas** : `app/planning/components/TodayMeals.jsx` →
  `/api/routine/modify-meal`.
- **Régénérer / compléter le planning** : modal « Modifier » de
  `app/planning/page.js` (semaine entière / jours / repas + instructions
  libres) → `/api/routine/generate-plan` → poller honnête → validation.
- **Fiches recettes** : les repas v5 portent `generated_recipe_id` →
  `GET /api/recipes/generated?id=…` (fetch exact), repli fuzzy
  `?q=<description>` pour l'existant
  (`app/planning/components/openMealRecipe.js`).
- **Batch** : bouton « Planifier le batch » de `/planning` →
  `/api/planning/batch/generate` (in-app).

## Ajouter une nouvelle routine

1. claude.ai/code → Routines → Nouvelle routine, déclencheur « Appel via API ».
2. Connecteur Supabase, dépôt `MiyasaKi09/garde-manger-app`.
3. Coller des instructions **alignées sur le schéma réel** (vérifier les noms
   de colonnes via Supabase avant).
4. Récupérer URL + token → 2 variables d'env Vercel `CLAUDE_ROUTINE_*`.
5. Créer `app/api/routine/<nom>/route.js` sur le modèle des existants
   (auth + vérif propriété + insertion `plan_regen_requests` si suivi requis +
   relais webhook avec `request_id` + timeout).
