# Audit complet Myko — Juillet 2026

> Audit des fonctionnements : planning, création de plat, nutrition, garde-manger, courses, anti-gaspillage, modèle ingrédients — suivi d'un plan d'amélioration page par page et fonction par fonction.

**Méthode** : exploration exhaustive du code (surface UI complète, domaine garde-manger + nutrition + schéma DB, planning + recettes + routes API/IA, modèle ingrédients en profondeur) + vérification des migrations RLS. Chaque constat cite `fichier:ligne`. Ce document succède à `AUDIT_COMPLET_2026-06.md`, dont plusieurs findings sont toujours ouverts (notamment §C5).

**Légende priorités** : 🔴 critique (sécurité/intégrité/cassé) · 🟠 majeur (bug fonctionnel ou dette structurante) · 🟡 mineur (qualité, UX, hygiène).

---

## 1. Synthèse exécutive

L'application est fonctionnellement riche et plusieurs fondations sont saines (scaling non linéaire des temps, règles DLC/DDM, formule CIQUAL, batch cooking, page `/courses` exemplaire). Mais trois refontes successives du schéma ont laissé des strates incohérentes, et la vision « ingrédient canonique → dérivés par modifications → nutriments calculés » a été **construite puis abandonnée en cours de route**.

Les 6 constats les plus importants :

1. **RLS introuvable dans le repo pour `inventory_lots`** et les tables de profil utilisateur — aucune migration ne l'active (§C1).
2. **La déduction de stock n'est jamais atomique** alors que la RPC transactionnelle `consume_lots_fefo` existe ; l'annulation d'un repas ne restaure jamais le stock (§C3).
3. **Le calcul de nutrition « précise » retourne toujours null** — mismatch entre le JS et la signature de la fonction SQL (§C4).
4. **L'anti-gaspillage est cassé** : il requête des tables/colonnes qui n'existent plus (§C5).
5. **4 pages legacy plantent à l'exécution** sur l'ancien schéma, dont une route en 404 avec lien cassé (§C6).
6. **La dérivation nutritionnelle a été remplacée par 175 copies pointées à la main** qui court-circuitent le moteur de modificateurs, et les recettes IA injectent des estimations LLM dans les tables de référence (§I1-I4).

Le plan d'amélioration (§4) est découpé en : Phase 0 sécurité/intégrité (1-2 j), Phase 1 réparer le cassé (2-3 j), Phase 2 dette architecturale (~1 sem), Chantier « Ingrédients & nutrition dérivée » (~1-2 sem, découpable), Phase 3 backlog produit.

---

## 2. Ce qui est conforme / bien fait ✅

| Domaine | Constat |
|---|---|
| Scaling recettes | `lib/scale.js` : temps de cuisson **non linéaires** (`cook × ratio^0.6`, `prep × ratio^0.8`, `lib/scale.js:31-58`), masse des ingrédients linéaire — conforme au piège n°6 de CLAUDE.md. Testé (`tests/scale.test.js`), utilisé par `/cook/[id]` (`app/cook/[id]/page.js:99-107`). Aucune multiplication linéaire des temps trouvée. |
| DLC/DDM | Règle J-3 (DLC) / J-7 (DDM) correctement codée dans `app/pantry/components/pantryUtils.js:468-506` via `archetypes.expiry_kind` ; propagée à `LifespanBadge.jsx:7-9` et `LotsView.js:318`. |
| Timezone | `lib/dates.js:10-22` (`daysUntil`) tronque et compare en **UTC** — conforme au piège n°4. |
| Nutrition | Formule `(quantité_g / 100) × valeur_100g` correcte (`tools/create_nutrition_function_v2.sql:100-126`), arrondi macros 1 décimale (`:191-214`). Macros calculées au **niveau canonique** avec override archétype (`COALESCE(ano.nutrition_id, cf.nutrition_id)`). |
| IA | `max_tokens` explicite sur **tous** les appels Anthropic (ocr 2048, recipe 4096, chat 4096/8192, plan 4096, batch 2000…). Prompt caching (`cache_control: ephemeral`) sur `ai/chat` (`route.js:63`), `ai/recipe` (`:100-103`), `ai/plan/generate` (`:628-631`). Garde-fous : `contextOverride` cappé à 4000 chars, sanitization anti prompt-injection (`ai/plan/generate/route.js:619-623`). |
| Auth API | Toutes les routes API s'authentifient (`lib/apiAuth.js` ou `getUser()`) **sauf une** (§C2). Pas de risque d'injection SQL (client paramétré partout). Clé service role jamais exposée côté client. |
| Courses | `/courses` (`app/courses/page.js`) : **page de référence** — 100 % des mutations via API routes, optimiste + revert soigné, toasts. |
| Planning/stock | Liste de courses = besoins réels − stock (`rebuildShoppingList`, `app/api/ai/plan/generate/route.js:302-531`) ; couverture stock par plan (`lib/stockCoverage.js`) ; batch cooking abouti avec fallback déterministe (`DISH_PROFILES`, `app/api/planning/batch/generate/route.js:66-173`). |
| DB | RPC transactionnelle `consume_lots_fefo` existante (`supabase/migrations/20260609_consume_lots_fefo_rpc.sql`, FOR UPDATE, all-or-nothing). Indexation bonne (index FEFO/expiry/user, index partiels, index unique dedup `recipe_ingredients`). |

---

## 3. Constats détaillés

### 3.1 Critiques 🔴

| # | Problème | Localisation |
|---|----------|--------------|
| C1 | **RLS introuvable sur `inventory_lots`** ainsi que `recipes`, `recipe_ingredients`, `recipe_steps`, `user_profiles`, `user_health_goals`, `user_allergies`, `user_diets`, `weight_entries` (policies existantes seulement dans 6 migrations : cooked_dishes, nutrition_plan_*, meal_log, generated_recipes, ciqual). `20260609_db_hardening.sql` ne fait qu'`ALTER` des policies d'autres tables. CLAUDE.md affirme « RLS activé sur toutes les tables » — non prouvé pour la table la plus sensible. Peut avoir été activé via le dashboard : **à vérifier en priorité absolue, puis versionner.** | `supabase/migrations/` |
| C2 | **Endpoint debug sans aucune auth** — retourne la recette complète pour tout `id`. | `app/api/debug/recipe/[id]/route.js:5-34` |
| C3 | **Déduction de stock non atomique** : read-modify-write de `qty_remaining` → deux cuissons concurrentes peuvent doubler la dépense. La RPC `consume_lots_fefo` n'est utilisée **nulle part** (TODOs explicites dans le code). `meals/cook` non transactionnel (logs écrits même si la déduction échoue) ; **l'annulation d'un repas ne restaure jamais le stock** (documenté dans le DELETE lui-même). | `lib/deductNeeds.js:66-90`, `lib/cookedDishesService.js:106-120`, `app/api/recipes/[id]/cook/route.js:112-131`, `app/api/recipes/generated/[id]/cook/route.js:76-88`, `app/cook/[id]/page.js:239`, `app/api/meals/cook/route.js:131-287` |
| C4 | **Nutrition « précise » silencieusement cassée** : le JS lit `row.nutrient_name`/`row.value_per_serving`, mais `calculate_and_cache_nutrition` retourne des **colonnes larges** (`calories_per_serving`, …) → la boucle de parse ne matche jamais → `nutrition.kcal` undefined → `return null` systématique (et la recette fantôme déjà insérée reste orpheline). 5 variantes SQL concurrentes dans `tools/`, la version déployée est inconnue. | `lib/recipePreciseNutrition.js:358-381` vs `tools/create_cache_function.sql:7-18` |
| C5 | **Anti-gaspillage cassé contre le schéma actuel** : requêtes sur `dlc`, `effective_expiration`, `products_catalog`, `waste_prevention_log` qui n'existent pas → `/api/restes/analyze` non fonctionnel. Suggestions de recettes matchées sur nom/description au lieu de `recipe_ingredients`. Déjà signalé dans l'audit de juin — toujours ouvert. | `lib/wastePreventionService.js:139-162,302-311,357,395` |
| C6 | **Pages legacy mortes sur l'ancien schéma** (`products_catalog`, `qty`, `dlc`, `product_id`, `location_id`) → erreurs à l'exécution : `/pantry/[locationId]`, `/produits`, `/produits/[productId]`, partie de `/cook/[id]`, `/settings/data`. Ce dernier est un fichier **`pages.js` mal nommé** (au lieu de `page.js`) → route 404 + **lien cassé** depuis `/settings`. | `app/pantry/[locationId]/page.js:155-289`, `app/produits/page.js:14`, `app/produits/[productId]/page.js:40`, `app/cook/[id]/page.js:62`, `app/settings/data/pages.js` |

### 3.2 Majeurs 🟠

| # | Problème | Localisation |
|---|----------|--------------|
| M1 | **Violation massive de la convention « mutations via API routes »** : ~15 fichiers clients font insert/update/delete Supabase directs + 4 services lib importés côté client qui mutent. Contourne la validation centralisée ; combiné à C1, risque réel. | `app/recipes/edit/[id]/page.js:448-524`, `app/recipes/[id]/page.js:314-372`, `app/pantry/page.js:389,428,469`, `app/pantry/[locationId]/page.js:249-289`, `app/cook/[id]/page.js:239`, `app/pantry/components/{OcrReviewList.jsx:87,SmartAddForm.js:640,NewProductForm.jsx:65}`, `lib/{lotManagementService,wastePreventionService,cookedDishesService,categoryService}.js` |
| M2 | **Catalogue `recipes` global modifiable/supprimable par tout utilisateur authentifié** (aucun scoping `user_id` dans les éditeurs ; policies RLS write à vérifier/verrouiller). `generated_recipes` est correctement scopé, lui (`recipes/generated/[id]/cook/route.js:38-39`). | éditeurs recettes + RLS |
| M3 | **Logique métier dupliquée et divergente** : `getExpirationStatus` ×2 avec retours différents (`pantryUtils.js:468` vs `app/pantry/page.js:316-324`) ; `getEffectiveExpiration` ×3 (`lotManagementService.js:255`, `pantryUtils.js:4`, `utils.js:6`) ; `daysUntil` ×4 dont **3 en heure locale** → off-by-one selon fuseau (`wastePreventionService.js:72-80`, `lotManagementService.js:112,270-277`, `pantryUtils.validateExpiryDate:573-576`) ; conversions d'unités ×5 (`units.js` canonique, `recipePreciseNutrition.js:221-249` avec densité 1.0 en dur, `quickConversions.js`, `parseQuantity.js`, `possibleUnits.js`) + 2 tables DB + 1 vue. | `lib/`, `app/pantry/` |
| M4 | **`calculate_recipe_nutrition` suppose `quantity` en grammes** — ne lit jamais `unit` (colonne varchar libre) → macros silencieusement fausses pour toute recette saisie en ml/cl/u. La fonction avale toutes les erreurs (`EXCEPTION WHEN OTHERS … RETURN`) → données fausses indétectables. | `tools/create_nutrition_function_v2.sql:100-126,217-221` |
| M5 | **Badge produit ignore DLC/DDM** : `ProductCard.jsx:31` appelle `getExpirationStatus(daysLeft)` sans `expiryKind` → seuils DLC (J-3) appliqués aux produits DDM, incohérent avec le badge lot du même produit (l.103). `wastePreventionService` ignore aussi la distinction (seuils en dur, `:16-23,130`). | `app/pantry/components/ProductCard.jsx` |
| M6 | **Mismatch spec/code FIFO vs FEFO** : CLAUDE.md dit FIFO (lot le plus ancien), le code fait FEFO + lots-ouverts-d'abord (`stockAllocator.js:56-68`, RPC idem) — c'est mieux, mais à trancher et documenter. L'allocateur **ignore silencieusement** les lots dont l'unité n'est pas convertible (`:42-55`) → shortfall sans consommation ni alerte. | `lib/stockAllocator.js` |
| M7 | **Deux éditeurs de recettes concurrents** (`/recipes/[id]` mode édition intégré + `/recipes/edit/[id]`) : lit `prep_time_minutes`/`cook_time_minutes` mais écrit `prep_min`/`cook_min` (risque de non-persistance) ; mixe steps texte libre (`recipes.steps`) et structurés (`recipe_steps`) ; delete `recipe_ingredients` en lisant la vue `recipe_ingredients_detailed` ; liaison produit non implémentée (commentaire TODO `edit/[id]/page.js:481`). | `app/recipes/[id]/page.js`, `app/recipes/edit/[id]/page.js` |
| M8 | **Micronutriments jamais calculés pour les recettes** : `nutritional_data` a ~30 colonnes micros mais la fonction SQL et `recipe_nutrition_cache` ne traitent que 4 macros — la règle « micros arrondis 2 déc. » de CLAUDE.md est du code mort (`recipePreciseNutrition.js:377`). | fonction SQL + cache |
| M9 | **Service role sans check de propriété** : `recipes/[id]/nutrition/calculate` crée un client service-role et déclenche la RPC pour n'importe quel `recipeId` (`route.js:5-32`) ; update de lot sans filtre `user_id` dans `recipes/[id]/cook/route.js:128-131` (repose uniquement sur RLS… cf. C1). | routes API |

### 3.3 Modèle ingrédients — écart avec la vision « canonique + modifications → nutriments calculés » 🔴

La structure voulue **existe** : hiérarchie `canonical_foods` → `cultivars` → `archetypes` (avec `process`, `parent_archetype_id`) → `products`, plus les tables de dérivation `process_nutrition_modifiers` (facteurs séchage ×8, concentration ×2-2.5, fermentation, affinage…) et `cooking_nutrition_factors`. Mais **la dérivation par calcul a été abandonnée en pratique** :

| # | Constat | Localisation |
|---|---------|--------------|
| I1 | **La nutrition des dérivés est une COPIE pointée à la main, pas un calcul** : `archetype_nutrition_overrides` relie 175 archétypes transformés à une *autre* ligne CIQUAL (beurre→16400, crème fraîche→19410, mozzarella→19590…). Le commentaire d'en-tête de la migration documente lui-même l'abandon des modificateurs (« héritaient des nutriments BRUTS… faute de modificateur applicable »). Canonique et override ne sont jamais synchronisés → divergence possible. | `supabase/migrations/20260610_archetype_nutrition_overrides.sql:1-6` |
| I2 | **L'override court-circuite le moteur de modificateurs** : `COALESCE(ano.nutrition_id, cf.nutrition_id)` → un archétype avec override n'a JAMAIS son facteur de process appliqué. Les deux mécanismes se combattent ; la copie gagne toujours. | `tools/fix_function_v2.sql:37,45-55`, `tools/create_nutrition_function_v2.sql:65-68,79-126` |
| I3 | **Le moteur de dérivation ne sert qu'aux 4 macros du chemin `recipes` legacy** — fibres et ~30 micros jamais dérivés. **3 versions concurrentes** de la fonction (`create_nutrition_function.sql` v1 *sans* modificateurs, `_v2.sql`, `fix_function_v2.sql`), aucune installée par migration versionnée → version déployée invérifiable depuis le repo. | `tools/create_nutrition_function*.sql`, `tools/create_cache_function.sql:36-54` |
| I4 | **Les recettes IA contaminent les tables de référence** : `createMissingFoodEntries` crée `nutritional_data`/`canonical_foods`/`archetypes` depuis les estimations `per100g` du LLM (`source_id: 'ai_…'`) — des devinettes deviennent des données « CIQUAL » de base. Et si le calcul précis échoue, l'estimation LLM reste dans `generated_recipes.nutrition_per_serving` (`nutrition_source='estimate'`). | `lib/recipePreciseNutrition.js:140-216`, `app/api/ai/recipe/route.js:181,205-215` |
| I5 | **Deux chemins de lecture divergents pour une même recette** : macros via la fonction SQL (override-aware), mais les micros sont lus en direct via `canonical_foods.nutritional_data` en **ignorant l'override** → macros du beurre depuis CIQUAL 16400, micros depuis la ligne « lait ». Incohérence interne sur une même fiche. | `app/recipes/[id]/page.js:568-635` |
| I6 | **~7 stockages parallèles de nutrition** qui divergent : base canonique ; overrides ; `recipe_nutrition_cache` (invalidation par trigger définie seulement pour l'autre wrapper, jamais appelé) ; `generated_recipes.nutrition_per_serving` (figé) ; **recettes fantômes** dans `recipes` créées en side-effect par `recipePreciseNutrition.js:266-346` ; macros dénormalisées dans `nutrition_plan_meals`/`_daily_totals`/`batch_recipes.macros_per_100g`/`meal_log`/`cooked_dishes.*_per_portion` (snapshots jamais recalculés) ; + colonnes mortes `products.nutrition_override` (jsonb jamais lu) et `archetypes.nutrition_modifier_id` (référencé nulle part). | schéma + lib |
| I7 | **L'identité ingrédient est « texte d'abord » aux frontières IA** : `generated_recipe_ingredients.raw_name` (avec `match_status='unmatched'` par défaut), `nutrition_plan_shopping_items.product_name`, `cooked_dish_ingredients.product_name`… **Deux résolveurs fuzzy indépendants** (`lib/ingredientResolver.js` — tokens/synonymes/tiers, et `recipePreciseNutrition.findFoodMatch` — ilike 5 niveaux) qui **créent tous deux des lignes canoniques automatiquement** (`maybeCreateCanonical:384-410`, `createMissingFoodEntries:140-216`). À l'inverse, `recipe_ingredients` et `inventory_lots` sont correctement liés par ID (contraintes exactly-one-of `recipe_ing_oneof_exactly_one`, `inventory_lots_one_of`). | `lib/ingredientResolver.js:284-410`, `lib/recipePreciseNutrition.js:47-216` |
| I8 | **Cultivars sans nutrition** : la table n'a aucune colonne/override nutritionnel → impossible d'exprimer « lait de chèvre ≠ lait de vache » au bon niveau ; forcé en overrides par archétype. | `supabase/exports/latest/schema.md:217-226` |
| I9 | **Durées de conservation triplées** : `canonical_foods.shelf_life_days_*`, `archetypes` (ancien `shelf_life_days` + nouveaux `*_pantry/fridge/freezer` + open_*), `products.shelf_life_days` — réconciliées par la vue `archetypes_shelf_life` à coups de COALESCE et d'une heuristique `shelf_life_days × 10` pour le congélateur. Même anti-pattern « stocker à plusieurs niveaux au lieu de dériver ». | vue `archetypes_shelf_life` (schema.md:1040-1052) |
| I10 | Deux seeds d'overrides incompatibles (`tools/populate_archetype_overrides.sql` par id codé en dur avec TRUNCATE CASCADE vs migration par nom) ; deux couches de cache concurrentes (`calculate_and_cache_nutrition` appelée par l'app vs `get_recipe_nutrition` + triggers jamais appelée). L'historique `migrations/014-018` (canoniques rétrogradés en archétypes, re-parentages « le vin n'est PAS du raisin ») montre une taxonomie retaillée à la main à plusieurs reprises. | `tools/`, `migrations/014-018` |

### 3.4 Mineurs 🟡

- **Code mort** : `app/recipes/[id]/page-demo.js` (non routable, recettes démo en dur) ; ~200 lignes mortes dans `recipes/[id]/page.js` (`LotRow`, `Section`, états `plan`/`lotsByProduct`, `autoFillForProduct`, `cook()` jamais appelés) ; composants jamais importés : `AiChat` (+`ChatBubble`/`ChatInput`/`StreamingText` morts en cascade), `AuthGate`, `ProtectedShell` (encore cité en commentaire trompeur dans `planning/import/page.js:16`), `MealCookSheet`, `ui/Button`, `ui/Card` ; tables legacy `pantry_items`/`meal_plans`/`planned_meals`/`legacy_users` (user_id integer) ; import `useEffect` inutilisé (`planning/import/page.js:3`) ; checkboxes non persistées (`BaseRow` de `/planning`, courses de `/planning/[importId]`).
- **`console.*` en prod** (~30 occurrences : `pantry` ×9, `recipes/[id]` ×9, `cook/[id]` ×2, `auth/callback` ×2, `recipes/edit` ×2, `planning` ×2, `onboarding` ×1, `global-error` ×1) — violation de CLAUDE.md.
- **`error` Supabase non vérifié** : `produits/[productId]/page.js:40-47` (jamais), `pantry/[locationId]` `refresh()` (`:150-166`) ; erreurs avalées en `catch {}` silencieux (accueil, nutrition, recipes) sans feedback utilisateur.
- **Valeurs en dur** : « Julien »/« Zoé » (`planning/[importId]/persons`, onboarding, home, `PersonSelector`), cibles caloriques 2050/1350 (`planning/[importId]/page.js:353`), `PDJ_J` (`:8`), conversions approximatives dans `pantry`.
- **100 % des pages en Client Components** (seuls `app/layout.js` et `/settings` sont serveur) malgré la convention « Server Components par défaut ».
- **UX/perf** : `window.confirm()` natif dans `pantry/[locationId]:288` au lieu de `ConfirmDialog` ; toast inline avec couleurs hex en dur dans `/cook/[id]` ; `<img>` natifs (courses, recipes, generated) au lieu de `next/image` ; `error.jsx` affiche le message d'erreur brut dans un `<pre>`.
- **Divers** : dualité `dej`/`din` (format JSON IA) vs `dejeuner`/`diner` (DB) — piège documenté dans `routine/modify-meal/route.js:17` ; prompt caching manquant sur `planning/batch/generate` (SYSTEM_PROMPT volumineux réutilisé, `route.js:150`) ; JSON IA persisté sans validation de schéma (`ai/recipe/route.js:158-167`, `ai/ocr/route.js:82-93`) ; ~90 docs markdown à la racine divergeant du code ; 2 dossiers migrations parallèles (`migrations/` legacy seed + `supabase/migrations/` schéma) ; vérification JWT locale HS256 = session révoquée valide jusqu'à `exp` (tradeoff documenté, `lib/apiAuth.js:16-34`).

---

## 4. Plan d'amélioration par phases

### Phase 0 — Sécurité & intégrité des données (urgent, ~1-2 j)

1. **RLS** *(C1, M2)* : vérifier l'état réel (dashboard / `get_advisors`), puis migration idempotente : RLS + policies `auth.uid() = user_id` (SELECT/INSERT/UPDATE/DELETE) sur `inventory_lots`, `user_profiles`, `user_health_goals`, `user_allergies`, `user_diets`, `weight_entries` ; lecture publique / écriture restreinte sur le catalogue partagé (`recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_utensils`, référentiels).
2. **Supprimer `app/api/debug/recipe/[id]/route.js`** *(C2)* (ou gate admin + env).
3. **Basculer toute déduction de stock sur la RPC `consume_lots_fefo`** *(C3)* : `lib/deductNeeds.js`, `lib/cookedDishesService.js`, `api/recipes/[id]/cook`, `api/recipes/generated/[id]/cook`, `/cook/[id]` (via API route). Restaurer le stock à l'annulation d'un repas (`DELETE api/meals/cook`) ou l'assumer explicitement dans l'UI.
4. **Ownership** *(M9)* : check de propriété avant la RPC dans `recipes/[id]/nutrition/calculate` ; filtre `user_id` sur l'update de `recipes/[id]/cook`.

### Phase 1 — Réparer le cassé (~2-3 j)

5. **Nutrition précise** *(C4, M4)* : aligner `recipePreciseNutrition.js` sur la vraie signature de `calculate_and_cache_nutrition` ; consolider les 5 SQL de `tools/` en **une** migration versionnée ; remonter les erreurs au lieu de `WHEN OTHERS RETURN` ; convertir `quantity`+`unit` en grammes dans la fonction (ou normaliser à l'insert).
6. **Anti-gaspillage** *(C5)* : réécrire les requêtes de `wastePreventionService.js` sur le schéma actuel (`inventory_lots_with_effective_dlc`, `products`) ; créer `waste_prevention_log` (migration) ou retirer le logging ; matcher les suggestions via `recipe_ingredients` ; intégrer `expiry_kind` dans le scoring d'urgence.
7. **Pages legacy** *(C6)* : supprimer `/produits`, `/produits/[productId]`, `/pantry/[locationId]` (fusionner ce qui manque dans `/pantry`) ; renommer `app/settings/data/pages.js` → `page.js` et le migrer sur le schéma actuel (ou supprimer + retirer le lien) ; purger la partie legacy de `/cook/[id]`.
8. **DLC/DDM** *(M5)* : passer `expiryKind` à `ProductCard` ; supprimer le doublon `getExpirationStatus` de `app/pantry/page.js`.
9. **Timezone** *(M3 partiel)* : tout faire passer par `lib/dates.daysUntil` (UTC) — corriger `wastePreventionService`, `lotManagementService`, `validateExpiryDate`, `shelfLifeRules`/`computeOpenedExpiration`.

### Phase 2 — Dette architecturale (~1 sem, incrémental)

10. **Mutations client → API routes** *(M1)* : créer/compléter les routes (lots : consume/update/delete — étendre `api/lots/manage` ; recettes : CRUD complet), migrer les ~15 fichiers en violation, retirer les mutations des services lib clients. Modèle : `/courses`.
11. **Unifier les éditeurs de recettes** *(M7)* : garder `/recipes/edit/[id]`, réduire `/recipes/[id]` à la consultation + purger le code mort (~200 l.) ; trancher les colonnes temps (`prep_min`/`cook_min`) et le modèle de steps (structuré) ; implémenter la liaison ingrédients→canonique (réutiliser `api/recipes/link-ingredients`).
12. **Dédupliquer les helpers** *(M3)* : un seul `getExpirationStatus`, `getEffectiveExpiration`, `daysUntil` (dans `lib/`), conversions consolidées sur `lib/units.js` (+ tables DB) — supprimer les 4 autres implémentations.
13. **Purge code mort + hygiène** : fichiers/composants/tables listés en §3.4 ; `console.*` derrière un logger ou supprimés ; normaliser `dej/din` vs `dejeuner/diner` (constantes partagées + mapping unique).
14. **Trancher FIFO vs FEFO** *(M6)* : recommandation = **garder FEFO** (meilleure pratique anti-gaspi), mettre à jour CLAUDE.md ; alerter sur les lots à unité non convertible au lieu de les ignorer.

### Chantier transversal — Refonte « Ingrédients & nutrition dérivée » (~1-2 sem, découpable)

Objectif : revenir à la vision d'origine — **une seule source de vérité nutritionnelle par ingrédient canonique, des dérivés obtenus par calcul**, avec provenance tracée.

- **R1. Un résolveur de nutrition unique** *(I1, I2, I3, I5)* : fonction SQL versionnée `resolve_nutrition(entity)` utilisée par TOUS les chemins (macros ET micros, recettes classiques ET générées), avec précédence explicite et champ de **provenance** : `ciqual_direct` (override vers une entrée CIQUAL exacte — légitime car plus précis qu'un facteur, on le garde mais on le trace) > `derived_factor` (`process_nutrition_modifiers` × base canonique) > `inherited` (canonique brut) > `llm_estimate` (toléré, jamais promu en référence). Étendre le calcul aux fibres + micros (les facteurs `RETENTION` sont déjà en seed) et faire porter les overrides aussi sur le chemin micros.
- **R2. Décontaminer la base** *(I4)* : stopper l'écriture LLM dans `canonical_foods`/`nutritional_data` (`createMissingFoodEntries`) — création en statut `pending_review` (colonnes `source`/`verified`) ; script d'audit des lignes `source_id LIKE 'ai_%'` existantes pour revue/purge.
- **R3. Un seul résolveur d'identité ingrédient** *(I7)* : fusionner `ingredientResolver.js` et `recipePreciseNutrition.findFoodMatch` ; `api/ingredients/search` et toutes les frontières IA passent par lui ; job de rattrapage des `raw_name`/`product_name` non matchés vers des IDs (`match_status`).
- **R4. Consolider le SQL** *(I3, I6, I10)* : une migration qui installe LA fonction nutrition (retirer v1/v2/fix de `tools/`) ; un seul cache avec invalidation par trigger + `ingredients_hash` vérifié ; supprimer le wrapper mort `get_recipe_nutrition` ; calculer la nutrition des `generated_recipes` **sans** créer de recette fantôme dans `recipes`.
- **R5. Nutrition au niveau cultivar** *(I8)* : autoriser `cultivars.nutrition_id` (ou table d'override cultivar) pour exprimer chèvre/brebis au bon niveau ; nettoyer les colonnes mortes (`products.nutrition_override`, `archetypes.nutrition_modifier_id`) ou les brancher.
- **R6. Conservation : une règle unique** *(I9)* : « l'archétype porte la conservation, fallback canonique » ; migrer les colonnes ancien format ; supprimer la vue à COALESCE + `×10` magique.
- **R7. Recalcul plutôt que snapshots** *(I6)* : recalculer `nutrition_per_serving` des recettes générées après liaison des ingrédients ; garder les snapshots historiques (`meal_log`) mais avec `nutrition_source` tracé.

### Phase 3 — Améliorations produit (backlog)

15. Micronutriments dans le calcul recette + cache *(M8 — largement couvert par R1)* ; affichage nutrition par portion sur les pages détail.
16. Multi-utilisateur propre : sortir « Julien »/« Zoé » et les cibles caloriques du code → `user_profiles`/`user_health_goals`.
17. Scaling des temps affiché sur les pages détail quand on change les portions (réutiliser `lib/scale.js`).
18. Prompt caching sur `planning/batch/generate` ; validation de schéma des JSON IA avant persistance.
19. UX : `ConfirmDialog` partout, `next/image`, message générique dans `error.jsx`, persistance des checkboxes planning, migration progressive vers Server Components (commencer par les pages lecture seule).
20. Hygiène repo : archiver les ~90 md racine dans `docs/archive/`, un seul dossier migrations, regénérer l'export schéma.

---

## 5. Détail page par page

Format : **Rôle** · **État** · **Problèmes** (fichier:ligne) · **Actions** (→ phase).

### 5.1 Accueil & auth

**`/` — `app/page.js` (416 l., client)**
Tableau de bord : stats stock, repas du jour, courses, nutrition (macros + poids), registre garde-manger, ajout rapide + OCR. Data mixte : `authFetch` + lectures Supabase directes (OK), écriture poids via API (conforme).
- Problèmes : erreurs avalées en `catch {}` silencieux (loadStock/loadNutrition…) — aucun feedback en cas d'échec.
- Actions : surfacer les erreurs (toast/état) ; sortir « Julien/Zoé » du `PersonSelector` (→ P3.16).

**`/login`, `/auth/callback`, `/auth/reset`**
Auth propre (`role="alert"`, validations). Problèmes : 2× `console.error` dans callback (`:25,37`). Actions : purge console (→ P2.13).

**`app/error.jsx` / `app/global-error.jsx`**
Problèmes : message d'erreur brut affiché dans `<pre>` (fuite d'info) ; `console.error` (`global-error.jsx:5`). Actions : message générique + log structuré (→ P3.19).

### 5.2 Garde-manger

**`/pantry` — `app/pantry/page.js` (795 l., client)** ⚠️
Inventaire complet : filtres, recherche, onglets Inventaire/Restes/Stats, consommation, édition, suppression, OCR, ajout.
- Problèmes : mutations directes `inventory_lots` (update `:389`, update `:428`, delete `:469`) + RPC `split_containerized_lot` côté client (`:345`) — M1 ; doublon local `getExpirationStatus` (`:316-324`) — M3 ; 9× `console.error` ; conversions approximatives en dur (`getQuantityInGrams`).
- Actions : mutations → API routes (étendre `api/lots/manage`) (→ P0.3/P2.10) ; supprimer le doublon (→ P1.8) ; conversions via `lib/units.js` (→ P2.12).

**`/pantry/[locationId]` — (432 l., client)** ⚠️ LEGACY
Détail d'un emplacement, ajout de lot avec autocomplete.
- Problèmes : requête l'ancien schéma (`products_catalog`, `qty`, `dlc`, `location_id`, `product_id` — `:155,160,249,257,266`) → **casse à l'exécution** (C6) ; mutations directes client ; `refresh()` sans vérification d'`error` (`:150-166`) ; `window.confirm()` natif (`:288`).
- Actions : **supprimer la page**, fusionner l'autocomplete/estimation DLC utile dans `/pantry` (→ P1.7).

**Composants pantry (`app/pantry/components/`)**
- `ProductCard.jsx:31` : `getExpirationStatus` sans `expiryKind` → badge produit faux pour les DDM (M5). Action : passer `expiryKind` (→ P1.8).
- `pantryUtils.js` : la bonne implémentation DLC/DDM (`:468-506`) ; mais `validateExpiryDate:573-576` en heure locale (→ P1.9) et `getEffectiveExpiration` dupliqué (→ P2.12).
- `OcrReviewList.jsx:87`, `SmartAddForm.js:640`, `NewProductForm.jsx:65,75` : inserts directs client (→ P2.10).
- `CookedDishesManager.jsx`/`CookedDishCard.jsx` : dépendent de `cookedDishesService` qui mute côté client (→ P2.10).

### 5.3 Produits

**`/produits` (79 l.) et `/produits/[productId]` (97 l.)** — LEGACY
- Problèmes : ancien schéma (`products_catalog` — C6) ; `[productId]` ne vérifie **jamais** `error` (`:40-47`) ; badges J-3 sans distinction DDM.
- Actions : **supprimer les deux pages** (le catalogue agrégé existe dans `/pantry`) ou les refondre sur `inventory_lots_resolved` (→ P1.7).

### 5.4 Recettes

**`/recipes` — `app/recipes/page.js` (463 l., client)**
Catalogue « que cuisiner ? » avec disponibilité stock (anti-gaspi / cuisinable / manque 1-2).
- Problèmes : `<img>` natif ; `catch {}` silencieux dans `checkInventoryAvailability`.
- Actions : `next/image`, surfacer les erreurs (→ P3.19).

**`/recipes/[id]` — (1544 l., client)** ⚠️
Détail + nutrition/micros + **éditeur intégré** + modes cuisine.
- Problèmes : mutations directes dans `saveRecipe()` (update `recipes:314`, delete/insert ingrédients `:322/342`, steps `:350/372`) — M1 ; lit `prep_time_minutes` mais écrit `prep_min` (M7) ; **micros lus en ignorant l'override archétype** (`:568-635`) — I5 ; ~200 lignes mortes (`LotRow`, autofill, `cook()`) ; fallback qui relance la même requête (`:403-414`) ; 9× `console.error`.
- Actions : réduire à la consultation, édition déléguée à `/recipes/edit/[id]` (→ P2.11) ; micros via le résolveur unique (→ R1) ; purge code mort (→ P2.13).

**`/recipes/edit/[id]` — (1339 l., client)** ⚠️
Éditeur complet (infos, ingrédients, steps, ustensiles, macros/micros).
- Problèmes : mutations directes (`insert/update recipes:448/457`, delete/insert `recipe_ingredients`/`recipe_steps`/`recipe_utensils:467-524`) — M1 ; liaison produit non implémentée (TODO `:481`) ; delete `recipe_ingredients` en lisant la vue `recipe_ingredients_detailed` ; mixe steps texte/structurés ; pas de scoping user (M2).
- Actions : CRUD via API route avec validation + ownership (→ P2.10/P2.11) ; liaison via `api/recipes/link-ingredients` (→ P2.11).

**`/recipes/new` (20 l.)** — redirection propre. RAS.

**`/recipes/generated/[id]` (212 l.)**
Détail recette IA, liaison stock, `CookWizard`. Vérifie `error`. Problème mineur : `<img>` natif. Action : recalculer `nutrition_per_serving` après liaison des ingrédients (→ R7).

**`app/recipes/[id]/page-demo.js` (279 l.)** — 🗑️ fichier non routable, données démo en dur. Action : supprimer (→ P2.13).

### 5.5 Cuisine

**`/cook/[id]` — `app/cook/[id]/page.js` (352 l., client)** ⚠️
Dry-run de déduction (scaling portions — utilise correctement `lib/scale.js` — allocation FEFO) puis cuisson.
- Problèmes : requête legacy `products_catalog` (`:62`) — C6 ; décrément des lots en boucle côté client (`:239`) — C3/M1 ; TODO RPC FEFO (`:223`) ; toast inline en dur ; 2× `console.error`.
- Actions : cuisson via une API route qui appelle `consume_lots_fefo` (→ P0.3) ; purge legacy (→ P1.7).

### 5.6 Planning

**`/planning` — `app/planning/page.js` (885 l., client)**
Cockpit hebdo : rail sessions batch + `WeekGrid`, régénération IA ciblée (semaine/jours/repas), polling `plan_regen_requests`.
- Problèmes : checkbox `BaseRow` non persistée (interaction morte) ; ~400 l. de CSS inline ; 2× `console.error`.
- Actions : persister ou retirer la checkbox (→ P3.19) ; extraire le CSS (→ P2.13).

**`/planning/[importId]` (613 l.)**
Vue jour-par-jour (repas J/Z, macros, courses).
- Problèmes : `PDJ_J` (petit-déj en dur, `:8`) et cibles caloriques 2050/1350 en dur (`:353`) ; état `checked` des courses non persisté (contrairement à `/courses`).
- Actions : cibles depuis `user_health_goals` (→ P3.16) ; persistance des cases (→ P3.19).

**`/planning/[importId]/batch` (420 l.)** — jour de cuisine, checklist persistée, optimiste+revert. RAS majeur.
**`/planning/[importId]/persons` (207 l.)** — noms « Julien »/« Zoé » en dur (→ P3.16).
**`/planning/[importId]/shopping` (195 l.)** — RAS.
**`/planning/import` (249 l.)** — import `useEffect` inutilisé (`:3`) ; commentaire trompeur « ProtectedShell » (`:16`) (→ P2.13).
**`/planning/assistant` (254 l.)** — bonne gestion abort/cleanup. RAS.

### 5.7 Courses

**`/courses` — `app/courses/page.js` (808 l., client)** ✅
Page de référence : tout passe par API routes, optimiste + revert, toasts. Problème mineur : `<img>` natifs. À utiliser comme modèle pour P2.10.

### 5.8 Nutrition

**`/nutrition` (391 l.)**
Suivi journalier (anneaux macros, micros %AJR, courbe de poids). Data via `authFetch` (conforme).
- Problèmes : erreurs avalées en silence ; objectif fibres 30 g en dur.
- Actions : surfacer les erreurs ; objectif depuis `user_health_goals` (→ P3.16).

**`/nutrition/onboarding` (317 l.)**
Wizard d'objectifs. Problèmes : profils Julien/Zoé en dur ; 1× `console.error` (`:104`) ; commentaire stale dans `nutritionCalculator` (« 1.6-2.2g/kg » vs code 1.4/1.6/1.8). Actions : → P3.16, P2.13.

### 5.9 Autres

**`/restes` (36 l.)** — simple redirection vers `/pantry?tab=waste`. RAS (mais la cible dépend de C5).
**`/garden` (77 l.)** — RPC `add_harvest_lot` mutante côté client (limite convention). Action : API route (→ P2.10).
**`/settings` (33 l., server)** — **lien cassé** vers `/settings/data` (C6). Action : corriger avec P1.7.
**`/settings/data/pages.js`** — 🗑️ fichier mal nommé → route 404 ; requête l'ancien schéma (`:16,22,57`). Action : renommer + migrer, ou supprimer (→ P1.7).
**`/settings/security` (110 l.)** — RAS.

### 5.10 Composants partagés (`components/`)

Utilisés et sains : `Toast`, `ConfirmDialog`, `CookMode`, `CookWizard`, `RestesManager` (dépend du service cassé C5), `PartySizeControl`, `MinimalistHeader`, `MatisseWallpaperRandom`, `CacheWarmer`, `ui/{GlassCard,Modal,IconButton,ImageCapture,NutritionBar,PersonSelector}`.
**Morts (jamais importés)** : `AiChat` (+ `ui/ChatBubble`, `ui/ChatInput`, `ui/StreamingText` en cascade), `AuthGate`, `ProtectedShell`, `MealCookSheet`, `ui/Button`, `ui/Card` → supprimer ou brancher (→ P2.13).

---

## 6. Détail fonction par fonction

### 6.1 Services `lib/`

| Fichier | Rôle | État / problèmes | Actions |
|---|---|---|---|
| `scale.js` | Scaling portions/temps | ✅ conforme, testé | — |
| `dates.js` | `daysUntil` UTC | ✅ la référence | Standard unique (→ P1.9) |
| `units.js` | Conversions mass/vol/count via densités | ✅ canonique | Source unique, absorber les 4 doublons (→ P2.12) |
| `stockAllocator.js` | Allocation FEFO + lots ouverts d'abord | ⚠️ FEFO vs règle FIFO (M6) ; lots à unité inconvertible ignorés en silence (`:42-55`) | Documenter FEFO, alerter sur inconvertibles (→ P2.14) |
| `deductNeeds.js` | Déduction stock (plans/batch) | 🔴 boucle select/update non atomique (`:66-90`), N+1 (re-fetch car la vue omet `is_opened`) | RPC `consume_lots_fefo` (→ P0.3) |
| `cookedDishesService.js` | Plats cuisinés | 🔴 mutations client (`:66-296`), déduction manuelle avec TODO (`:106-120`) | API routes + RPC (→ P0.3/P2.10) |
| `lotManagementService.js` | Ouverture/gestion lots | ⚠️ mutations client ; jours restants calculés sur timestamps bruts (`:112,270-277`) et `computeOpenedExpiration` en heure locale (`:28-31`) | API routes (→ P2.10), dates UTC (→ P1.9) |
| `wastePreventionService.js` | Anti-gaspillage | 🔴 requêtes sur schéma inexistant (`:139-162`), matching nom/description (`:302-311`), `daysUntilExpiration` locale (`:72-80`), pas de distinction DLC/DDM (`:16-23`) | Réécriture complète (→ P1.6) |
| `recipePreciseNutrition.js` | Nutrition CIQUAL des recettes IA | 🔴 parse RPC cassé (`:358-381`, C4) ; crée des données LLM en base de référence (`:140-216`, I4) ; conversions dupliquées avec densité 1.0 (`:221-249`) ; risque de violation du CHECK exactly-one-of (`:316-324`) ; recettes fantômes (`:266-346`) | → P1.5, R2, R3, R4 |
| `ingredientResolver.js` | Résolution fuzzy ingrédient→ID | ⚠️ bon design (tiers, synonymes, `match_status`) mais **deuxième** résolveur concurrent, et auto-création de canoniques (`:384-410`) | Fusion en résolveur unique, création en `pending_review` (→ R2/R3) |
| `nutritionCalculator.js` | BMR/TDEE/objectifs | ✅ sauf commentaire stale (`:60-77`) | → P2.13 |
| `shelfLifeRules.js` | Durées après ouverture | ⚠️ dates construites en heure locale (`:199-200`) | → P1.9 |
| `apiAuth.js` | Auth des routes API | ✅ solide ; tradeoff JWT local documenté | — |
| `stockCoverage.js`, `shoppingListBuilder.js`, `jsonPlanParser.js`, `nutritionPlanService.js` | Planning | ✅ RAS majeur | — |

### 6.2 Routes API (`app/api/`)

| Groupe | État / problèmes | Actions |
|---|---|---|
| `debug/recipe/[id]` | 🔴 **aucune auth** (C2) | Supprimer (→ P0.2) |
| `recipes/[id]/cook`, `recipes/generated/[id]/cook`, `meals/cook` | 🔴 déduction non atomique, TODO RPC, pas de restore à l'annulation (C3) ; update sans filtre `user_id` (`recipes/[id]/cook:128-131`) | → P0.3, P0.4 |
| `recipes/[id]/nutrition/calculate` | 🟠 service-role sans check de propriété (M9) | → P0.4 |
| `ai/recipe`, `ai/chat`, `ai/ocr`, `ai/plan/generate` | ✅ auth, max_tokens, caching ; ⚠️ JSON LLM persisté sans validation de schéma (`ai/recipe:158-167`, `ai/ocr:82-93`) | Validation de schéma (→ P3.18) |
| `planning/batch/generate` | ✅ fallback déterministe ; ⚠️ pas de prompt caching (`:150`) | → P3.18 |
| `planning/*` (imports, stock-coverage, prep-tasks, batch/cook) | ✅ auth + validation correctes ; batch/cook déduit via `deductNeeds` (hérite de C3) | → P0.3 |
| `routine/*` (5 webhooks externes) | ✅ timeouts + AbortController, tokens serveur | — |
| `courses/*` | ✅ propre | — |
| `restes/analyze`, `restes/action` | 🔴 reposent sur `wastePreventionService` cassé (C5) | → P1.6 |
| `nutrition/{log,goals,weight}`, `ingredients/search`, `cooked-dishes/*`, `lots/manage` | ✅ auth OK ; `ingredients/search` classe par longueur de chaîne (`:65`) | Brancher sur le résolveur unique (→ R3) |

### 6.3 Fonctions SQL & schéma

| Objet | État / problèmes | Actions |
|---|---|---|
| `calculate_recipe_nutrition` (3 versions dans `tools/`) | 🔴 versions divergentes non migrées (I3) ; suppose grammes (M4) ; avale les erreurs ; 4 macros seulement (M8) ; override court-circuite les modificateurs (I2) | → P1.5, R1, R4 |
| `calculate_and_cache_nutrition` | 🔴 signature incompatible avec le JS appelant (C4) ; cache sans invalidation garantie | → P1.5, R4 |
| `get_recipe_nutrition` + triggers (`create_nutrition_cache.sql`) | 🗑️ deuxième couche de cache jamais appelée (I10) | Supprimer (→ R4) |
| `consume_lots_fefo` (RPC) | ✅ correcte… et inutilisée (C3) | Brancher partout (→ P0.3) |
| `process_nutrition_modifiers` / `cooking_nutrition_factors` | ⚠️ moteur de dérivation sain mais neutralisé par les overrides et limité aux macros | Cœur de R1 |
| `archetype_nutrition_overrides` | ⚠️ 175 copies à la main (I1), 2 seeds incompatibles (I10) | Tracer en `ciqual_direct` (→ R1), un seul seed |
| Hiérarchie (`canonical_foods`/`cultivars`/`archetypes`/`products`) | ✅ structure OK ; cultivar sans nutrition (I8) ; colonnes mortes (`nutrition_modifier_id`, `products.nutrition_override`) ; conservation triplée (I9) | → R5, R6 |
| RLS | 🔴 C1 | → P0.1 |
| Tables legacy (`pantry_items`, `meal_plans`, `planned_meals`, `legacy_users`) | 🗑️ user_id integer, remplacées | Archiver/drop avec rollback (→ P2.13) |
| Dossiers `migrations/` vs `supabase/migrations/` | ⚠️ deux systèmes parallèles | Unifier (→ P3.20) |

---

## 7. Ordre d'exécution recommandé

1. **P0** (sécurité) — indépendant, à faire immédiatement. Commencer par vérifier le RLS réel en dashboard.
2. **P1.5 + R4** (nutrition SQL) ensemble — même zone de code, une seule migration consolidée.
3. **P1.6-1.9** (anti-gaspi, legacy, DLC/DDM, timezone) — indépendants, parallélisables.
4. **P2.10** (mutations → API) — progressif, page par page, en commençant par le garde-manger (le plus sensible).
5. **Chantier R** — R1/R2/R3 d'abord (résolveurs), R5/R6/R7 ensuite.
6. **P2 restant puis P3** — au fil de l'eau.

Chaque étape doit passer `npm run build` + les tests vitest existants (`tests/`), et toute migration SQL doit être idempotente avec rollback (piège n°3 de CLAUDE.md).
