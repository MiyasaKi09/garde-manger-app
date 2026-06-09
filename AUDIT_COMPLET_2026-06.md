# Audit complet Myko — Juin 2026

Audit technique, design, base de données et fonctionnel réalisé le 2026-06-09.
Méthode : analyse statique du code, vérification live du schéma Supabase, build de production, `npm audit`.

---

## Résumé exécutif

L'application est fonctionnelle (le build passe, ~50 pages et ~40 routes API), avec un vrai design system et un domaine métier riche. Mais l'audit révèle **des failles de sécurité critiques** (routes API sans authentification, données personnelles de santé publiées dans le dépôt git), **des écarts importants entre les règles métier documentées et le code** (DLC, scaling, nutrition par portion), et **une dette technique significative** (zéro test, zéro lint, ~50 fichiers parasites, deux systèmes de migrations non coordonnés).

| Domaine | Critiques | Élevés | Moyens |
|---|---|---|---|
| Sécurité | 6 | 6 | 2 |
| Base de données | 2 | 5 | 8 |
| Métier / fonctionnel | 4 | 8 | 5 |
| Frontend / UX / design | 0 | 6 | 10 |
| Outillage / dépendances | 1 | 2 | 2 |

---

## 1. SÉCURITÉ — à traiter en priorité absolue

### 1.1 Routes API sans authentification (Critique)

- `app/api/admin/add-salade-nicoise-steps/route.js`, `app/api/admin/fix-durations/route.js`, `app/api/admin/fix-salade-nicoise/route.js` : aucune vérification d'auth, mutent `recipes` et `recipe_steps`. Accessibles par n'importe qui.
- `app/api/recipes/[id]/nutrition/calculate/route.js:4-8` : utilise `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS total) **sans aucune authentification**.
- `app/api/restes/analyze/route.js:12` et `app/api/restes/action/route.js:13` : acceptent un `userId` arbitraire dans le body sans vérifier la session. N'importe qui peut lire/modifier le garde-manger d'un autre utilisateur en devinant son UUID. De plus ces routes importent `lib/supabaseClient.js` (client navigateur) au lieu de `supabaseServer.js`.
- `app/api/recipes/suggestions/route.js:18` : sans auth (impact faible mais contraire à la convention).

**Action** : appliquer `authenticateRequest` (lib/apiAuth.js) systématiquement ; ne jamais accepter `userId` depuis le body ; réserver la service role key aux routes authentifiées.

### 1.2 Pages debug/admin publiques (Élevé)

`app/debug-auth/`, `app/debug-db/` (bouton d'insertion en base !), `app/test-search/` (écrit en base ligne 203), `app/admin/*` (3 pages), `app/recipes/demo/`. À supprimer ou protéger par un rôle admin.

### 1.3 Middleware qui ne protège rien (Élevé)

`middleware.js:25` rafraîchit le cookie mais ne redirige jamais vers `/login`. Chaque page fait sa garde en `useEffect` côté client (flash de contenu non authentifié). **Action** : redirection dans le middleware pour `/pantry`, `/planning`, `/courses`, `/nutrition`, `/recipes`, `/garden`, `/restes`, `/produits`, `/add`, `/settings`.

### 1.4 Données personnelles de santé versionnées dans git (Critique)

Le workflow CI `export-supabase.yml` committe sur `main` des CSV de production : `weight_entries.csv` (poids corporels datés), `user_health_goals.csv` (poids, taille, âge, sexe, TDEE/BMR), `meal_log.csv`, `nutrition_plan_meals.csv` (1 415 repas), `inventory_lots.csv`, `generated_recipes.csv` — tous corrélables via le même `user_id`. S'ajoutent `plan mars 2026.xlsx` et `plan repas avril 2026.xlsx` à la racine.

**Action** : restreindre l'export aux tables de référence (archetypes, canonical_foods, recettes publiques) ; purger l'historique git des fichiers personnels (`git filter-repo`).

### 1.5 Clé API commitée (Élevé)

`.env.production` est tracké dans git et contient une vraie clé Pexels. `.gitignore` ne couvre que `.env` et `.env.local`. **Action** : révoquer/régénérer la clé, retirer le fichier du suivi, compléter `.gitignore`.

### 1.6 Next.js 14.2.4 : vulnérabilités critiques connues (Critique)

`npm audit` : 27 advisories sur Next.js dont **CVE-2025-29927 (contournement d'autorisation du middleware)** — particulièrement grave si le middleware devient le point de protection (cf. 1.3). Aussi : cache poisoning, SSRF, XSS, DoS. **Action** : monter au minimum vers `next@14.2.35` (correctif sans breaking change). Également : `xlsx` (2 advisories high, **aucun correctif disponible** — envisager `exceljs`), `@anthropic-ai/sdk` obsolète (0.82, advisory modéré), `undici`/`ws` (fix via `npm audit fix`).

### 1.7 Divers sécurité

- **Prompt injection** (Moyen) : `/api/ai/chat` accepte `contextOverride` concaténé sans limite dans le system prompt ; `/api/ai/plan/generate:639` injecte le nom de plat sans validation.
- **Pas de rate limiting** (Élevé) : les routes IA peuvent être appelées en boucle → coûts Anthropic illimités.
- **Whitelist d'emails en dur** dans les policies RLS de `locations` (`julenglet@gmail.com`…) : remplacer par un rôle/`is_admin`.

---

## 2. BASE DE DONNÉES

### 2.1 Migrations : deux systèmes parallèles non tracés (Critique)

- `supabase/migrations/` (001→013 + dates) et `migrations/` racine (001→024) coexistent. Seules 18 migrations sont réellement tracées dans `supabase_migrations.schema_migrations` ; les 30+ autres ont été appliquées à la main sans suivi.
- Fichiers dangereux : `APPLY_ALL.sql`, `APPLY_ALL_NEW.sql`, `APPLY_ME.sql` (agrégats ré-exécutables qui échoueraient), doublons `002-…` / `002-…-fixed.sql` et `009`/`009-FIXED`, SQL ad-hoc à la racine (`INSERT_INGREDIENTS.sql`, `fix-*.sql`).
- 6 migrations anciennes ont des `CREATE INDEX` non idempotents (002, 007, 008, 009).

**Action** : tout basculer sur Supabase CLI (`supabase db push`), archiver les anciens fichiers comme "appliqués manuellement", supprimer les APPLY_*.

### 2.2 Tables legacy sans isolation utilisateur (Critique)

`pantry_items`, `meal_plans`, `planned_meals`, `user_recipe_interactions` : `user_id` de type **INTEGER** → `legacy_users`, donc impossibles à protéger par `auth.uid()`. Leurs policies sont `USING (true)` : tout utilisateur authentifié voit tout. **Action** : migrer vers UUID/`auth.users` ou supprimer ces tables si obsolètes.

### 2.3 Intégrité du schéma (Élevé)

- **FK dupliquées avec comportements contradictoires** sur `inventory_lots` (6 doublons, `ON DELETE RESTRICT` vs `SET NULL` sur les mêmes colonnes !), `products`, `generated_recipe_ingredients`. À nettoyer.
- 9 policies `FOR ALL` sans `WITH CHECK` explicite (`meal_log`, `weight_entries`, `nutrition_plan_*`, `generated_recipes`).
- `_backup_views` : RLS activé, zéro policy, non documenté.
- `inventory_lots.opened_at` en `TIMESTAMP` sans timezone (piège #4 du CLAUDE.md) ; `cooked_dishes.batch_recipe_id` sans contrainte FK.
- Trigger auto `user_id` présent uniquement sur `inventory_lots`.

### 2.4 Patterns d'accès (Élevé)

- **Mutations directes depuis des composants client** (violation de la convention) : `SmartAddForm.js:638`, `OcrReviewList.jsx:85`, `NewProductForm.jsx:64-74`, `pantry/[locationId]/page.js:248-288`, `recipes/edit/[id]/page.js:466-468`, `add/page.js:21`.
- N+1 : `lib/pairingService.js:104-113` (1 requête `recipe_tags` par recette → jointure) ; `lib/recipePreciseNutrition.js:292` (2-4 requêtes séquentielles par ingrédient).
- `select('*')` sur tables larges : `lib/nutritionPlanService.js:101-106`, `recipes/edit/[id]/page.js:170-193` (archetypes ~25 colonnes).

---

## 3. MÉTIER / FONCTIONNEL — écarts avec les règles documentées

### 3.1 Règles DLC/DDM (Critique + Élevé)

- **Seuil J-3 non respecté** : `app/pantry/components/EnhancedLotCard.js:26` déclenche `critical` à `daysLeft <= 2` (J-2 au lieu de J-3).
- **Aucune distinction DLC vs DDM** dans les lots : un seul champ date, mêmes seuils pour les deux. Les tokens CSS documentent J-3/J-7 mais aucun code ne l'implémente.
- **DLC des plats cuisinés ignore les lots utilisés** (Critique) : `lib/shelfLifeRules.js:305-321` applique toujours +3j frigo / +90j congélateur sans regarder la DLC du lot le plus court utilisé (règle métier explicite).
- **`daysUntil` dupliqué** : `lib/dates.js` (UTC, correct) vs `app/pantry/components/pantryUtils.js:431` (heure locale → décalage ±1 jour). `LifespanBadge.jsx` importe la mauvaise version.
- **FEFO fragile** : `lib/utils.js:4` trie sur un champ `dlc` qui n'existe pas dans les lots (`expiration_date` en base) → tri silencieusement inopérant. Le FEFO côté API (`available-ingredients/route.js:104`) est correct.

### 3.2 Nutrition (Élevé)

- **Micronutriments affichés "par portion" mais calculés pour la recette entière** : `app/recipes/[id]/page.js:670-708` n'a pas de division par `servings` → valeurs 4× trop élevées pour une recette 4 personnes.
- **Arrondis non conformes** : `lib/recipePreciseNutrition.js:372-376` arrondit les macros à 0 décimale (spec : 1 décimale macros, 2 micros).
- **Nutrition silencieusement sous-estimée** : si un ingrédient n'a pas de données nutritionnelles, aucun avertissement utilisateur (`page.js:703-705`).
- `lib/nutritionCalculator.js` calcule en réalité BMR/TDEE — nom trompeur.

### 3.3 Scaling et cuisson (Critique + Élevé)

- **Temps de cuisson scalés linéairement** (ou pas du tout) : aucune fonction de scaling non-linéaire dans le projet, contrairement à la règle (piège #6).
- **Déduction des lots non atomique** : `app/api/cook/[id]/route.js:213-230` boucle d'updates sans transaction → stock partiellement décrémenté possible. Faire une RPC SQL transactionnelle.
- **Deux flux "cuisiner" parallèles non unifiés** (`/api/cook/[id]` vs `/api/recipes/[id]/cook`) avec des logiques FEFO différentes.
- **Règle de faisabilité à 15% absente** : `cuisinable` exige zéro manquant strict.

### 3.4 Unités et conversions (Élevé)

- **Bug `convertWithMeta`** : `lib/units.js:25` enchaîne deux conversions avec `&&` → retour incorrect pour vol→count.
- **Casse incohérente** : `quickConversions.js` retourne `'L'/'cL'/'mL'` alors que tout le reste utilise les minuscules → fallbacks silencieux sans conversion.
- **Données de test en prod** : `lib/possibleUnits.js:5-13` (`testData` banane 120g, etc.) peut écraser les vraies métadonnées.

### 3.5 Anti-gaspillage (Élevé)

- Score d'urgence basé sur des seuils de jours absolus, jamais relatif à la durée de vie totale (`wastePreventionService.js:16-118`) : un yaourt et un miel à J-3 ont le même score.
- `suggestRecipesForWaste` matche par **nom de recette** et non par `recipe_ingredients` (`wastePreventionService.js:300-312`) → quasi aucune suggestion pertinente.

### 3.6 Pages mortes / doublons

- Route `/shopping` cassée : `app/shopping/pages.js` (mauvais nom de fichier, placeholder) doublonne `/courses` qui est complet. Supprimer le dossier.
- `app/api/cook/[id]/route.js` est en réalité **une page React (`'use client'`) placée dans `app/api/`** → 405 garanti. À déplacer.
- `app/api/cook/undo/route.js` : retourne toujours 501. `lib/mockData.js` : importé nulle part.

---

## 4. FRONTEND / DESIGN / UX

### 4.1 Architecture (Élevé)

- **Toutes les pages principales sont `'use client'`** (accueil, pantry 797 l., planning 865 l., recipes/[id] 1 588 l., courses 712 l., …) : SSR/streaming annulés, bundle maximisé, gardes d'auth en `useEffect`. Refactorer en Server Component racine (fetch via `supabaseServer`) + sous-composant client.
- **Composants > 500 lignes à découper** : `recipes/[id]/page.js` (1 588), `recipes/edit/[id]/page.js` (1 338), `MatisseWallpaperRandom.jsx` (946), `LotsView.js` (865), `pantryUtils.js` (833, JSX mêlé aux utilitaires), `SmartQuantityDisplay.js` (782), `SmartAddForm.js` (779), `TodayMeals.jsx` (694 dont 262 lignes de CSS-in-JS), `CookMode.jsx` (699), `lib/aiSystemPrompts.js` (1 035).
- **~13 composants morts** à supprimer : `Header.jsx` (514 l., remplacé par `MinimalistHeader`), `MatisseCutoutsBGRandom`, `ReadableScrim`, `NavLink`, `HeaderAuth`, `SignOutButton`, `SmartProductCreation`, `SmartQuantityDisplay`, `IngredientProductLinker`, `PairingSuggestions(.examples)`, `RecipeCard`, `RecipeListCard`, `app/components/RecipeSuggestions.js`, `app/recipes/[id]/page-demo.js`.

### 4.2 UX (Élevé)

- **`alert()`/`confirm()` natifs partout** alors que `ConfirmDialog` et `Toast` existent : ~15 occurrences dans planning (logique d'erreur dupliquée 3× dans `WeekGrid`, `WeeklyPlanView`, `TodayMeals`), `recipes/edit` (8 cas), `recipes/[id]:383`.
- **Toast quasi inutilisé** : seul `SmartAddForm` l'importe ; les autres mutations n'ont aucun feedback.
- Un seul `loading.js` / `error.jsx` globaux ; états de chargement réimplémentés différemment dans chaque page.
- États vides sans CTA (« Aucune recette pour le moment. » sans bouton "Créer ma première recette").
- `window.location.reload()` au lieu de `router.refresh()` (`recipes/[id]/page.js:379`).

### 4.3 Design system (Élevé → Moyen)

- **527 `style={{}}` inline** (361 dans `app/`, 166 dans `components/`) malgré la convention CSS colocalisé. Pire cas : `TodayMeals.jsx` (objet `S` de 262 lignes, aucun .css).
- `MEAL_BAR` (hex hardcodés) dupliqué 3× alors que les tokens `--m-pdj`/`--m-dej`/`--m-din`/`--m-col` existent dans `globals.css` et ne sont jamais utilisés.
- `globals.css:207` référence `var(--terracotta)` définie dans `tokens.css` chargé après — fragile.
- Legacy glassmorphism (`ui/glass.js`, `GlassCard`) encore utilisé par `OcrReviewList` (non migré V21).
- Responsive incomplet : `garden.css`, `ConfirmDialog.css`, `nutrition.css` sans media queries — pour une app utilisée en cuisine sur mobile.
- `app/recipes/recipes.css.backup` commité.

### 4.4 Accessibilité (Moyen)

- Pas de focus trap dans les modals (`ConfirmDialog`, `CookMode`, bottom sheets planning sans `role="dialog"`).
- Inputs sans labels (`recipes/edit` lignes 705-730, `TodayMeals.jsx:364`) ; `outline: none` sans remplacement focus-visible (SmartAddForm, InlineEditQuantity, EditLotForm).
- `next/image` jamais utilisé (pas de lazy loading, WebP, srcset) — ajouter le domaine Supabase Storage dans `next.config.js`.

### 4.5 Performance (Moyen)

- Listes pantry/courses sans virtualisation (200+ produits = 200+ nœuds DOM d'un coup).
- ~90 `console.log/error` dont ~35 dans des composants client (convention : zéro en prod).
- `PartySizeControl` importé dans une route API (`app/api/cook/[id]/route.js:6`).

---

## 5. OUTILLAGE & HYGIÈNE DU DÉPÔT

| Domaine | État |
|---|---|
| Tests (Vitest/Playwright) | **Aucun** — 0 fichier de test |
| ESLint / Prettier | **Absents** |
| CI | 1 seul workflow (export DB) — pas de lint/build/test |
| TypeScript | Absent (choix assumé du projet) |

- **~50 fichiers parasites à la racine** : 33 scripts one-shot (`analyze-*`, `check-*`, `fix-*`, `verify-*`…), JSON d'audit (dont `AUDIT_COLONNES_ARCHETYPES.json` 2,1 Mo, `DB_FULL_EXPORT.json` 504 Ko), SQL ad-hoc, `data-csv.zip`, xlsx personnels, dossier `backups/` (3 Mo). Déplacer dans `scripts/` + `.gitignore`, ou supprimer.
- **Appels Anthropic** : `max_tokens` partout ✅, modèle à jour ✅, mais **prompt caching uniquement sur `/api/ai/chat`** — l'ajouter à `/api/ai/recipe` et `generateMissingRecipes` (~30-40% d'économie de tokens d'entrée).
- Tests prioritaires à créer : `shelfLifeRules.js`, `units.js`/`scale.js`, `jsonPlanParser.js`, `nutritionCalculator.js`, `apiAuth.js`.

---

## Plan d'action priorisé

### P0 — Immédiat (sécurité)
1. Auth sur les 3 routes `app/api/admin/*` + `nutrition/calculate` (service role) + `restes/analyze|action` (userId du body).
2. Mettre à jour Next.js → 14.2.35 (CVE middleware) + `npm audit fix` (undici, ws).
3. Révoquer la clé Pexels, retirer `.env.production` de git, compléter `.gitignore`.
4. Exclure les tables personnelles de l'export CI ; purger l'historique des CSV/xlsx personnels.
5. Redirection auth dans `middleware.js` ; supprimer/protéger les pages debug/admin/test.

### P1 — Court terme (correctifs métier et bugs)
6. Corriger seuils DLC J-3/DDM J-7 + distinction des deux types de dates.
7. DLC des plats cuisinés = min(DLC lots utilisés, règle stockage).
8. Diviser les micronutriments par `servings` ; arrondis conformes (1 déc. macros / 2 micros).
9. Bug `convertWithMeta` (units.js:25), casse des unités volume, retirer `testData` de `possibleUnits.js`.
10. Unifier `daysUntil` sur la version UTC de `lib/dates.js` ; corriger `sortLotsFEFO`.
11. RPC transactionnelle pour la déduction des lots ; unifier les deux flux "cuisiner" ; déplacer la page React hors de `app/api/`.
12. Migrer les tables legacy (`user_id` INTEGER) ou les supprimer ; nettoyer les FK dupliquées.

### P2 — Moyen terme (qualité et UX)
13. ESLint (`next/core-web-vitals`, `no-console`) + Vitest sur les libs métier + CI build/lint/test.
14. Consolider les migrations sur Supabase CLI ; supprimer APPLY_*, doublons et SQL racine.
15. Remplacer `alert()/confirm()` par `ConfirmDialog`/`Toast` ; états vides avec CTA.
16. Supprimer les ~13 composants morts, la route `/shopping`, les ~50 fichiers parasites.
17. Migrer les mutations client directes vers des routes API ; corriger les N+1.
18. Prompt caching sur toutes les routes IA + rate limiting ; limite de taille sur `contextOverride`.

### P3 — Fond (architecture)
19. Pages en Server Components avec sous-composants client ; `loading.js`/`error.jsx` par route.
20. Découper les 10 fichiers > 700 lignes ; migrer le CSS-in-JS vers des .css colocalisés ; utiliser les tokens (`--m-*`).
21. `next/image`, virtualisation des listes longues, focus trap des modals, responsive garden/nutrition/dialogs.
