# Modèle de données — noyau « boucle fermée »

Réf. plan directeur PR 1. Ce document décrit le noyau officiel et la stratégie de
compatibilité pendant la migration. Source de vérité par domaine : cf. plan §4.1.

## Noyau fermé (tables officielles)

| Table | Rôle |
|---|---|
| `household_members` | identités du foyer (remplace les chaînes « Julien »/« Zoé ») |
| `household_member_legacy_names` | mapping nom historique normalisé → membre |
| `nutrition_target_versions` | objectifs nutritionnels datés (un seul **actif** par membre) |
| `meal_plan_versions` / `meal_plan_slots` | version immuable du plan + créneaux |
| `meal_plan_validation_issues` | erreurs de validation d'une version |
| `inventory_reservations` | stock prévu (empêche le double emploi) |
| `recipe_nutrition_snapshots` | nutrition figée d'une recette |
| `prep_task_dependencies` | graphe de tâches |
| `meal_feedback` | apprentissage |
| `data_quality_issues` | anomalies |
| `decision_audit_log` | explicabilité |

## Personnes : `person_name` → membre

1. `household_members` contient un membre par personne (backfillé : Julien, Zoé).
2. `household_member_legacy_names` associe chaque `person_name` normalisé
   (`lower(btrim(unaccent(name)))`) à un `household_member_id`.
3. Les tables historiques reçoivent une colonne **`household_member_id`** (nullable,
   `ON DELETE SET NULL`), backfillée par nom : `meal_log`, `weight_entries`,
   `user_health_goals`, `nutrition_plan_meals`, `nutrition_plan_daily_totals`.
4. **`person_name` est conservé** (projection de compatibilité) — non supprimé en PR 1.

Côté code : `lib/domain/household/memberMapping.js` (`normalizeName`,
`buildMemberIndex`, `resolveMemberId`) — la normalisation JS est alignée sur le SQL.

## Objectifs nutritionnels

- Source officielle : `nutrition_target_versions` (active = `effective_to IS NULL`).
  Contrainte : index unique partiel `uq_nutrition_targets_member_active`
  (un seul actif par membre).
- Repli : `user_health_goals` via `household_member_id`.
- Service : `lib/domain/household/getActiveNutritionTargets.js` → `Map<member_id, cible>`.
  Mise en forme pure : `lib/domain/nutrition/targets.js`.

## Vue « Aujourd'hui »

- `GET /api/today?date=` renvoie le contrat stable (`lib/contracts/today.js`),
  assemblé par `lib/db/queries/today.js` et construit purement par
  `lib/domain/today/todayViewModel.js`. Agrège encore des tables historiques mais
  expose la forme finale (membres, statut nutritionnel par membre, restes, courses).

## Compatibilité (transition)

- Le nouveau modèle est écrit en premier ; les anciennes tables restent alimentées
  comme projection.
- Les accès serveur passent par `lib/db/queries/*` et `lib/domain/*` (jamais de
  logique métier dans un Client Component).
- Repositories serveur : ne pas importer depuis un composant client.
