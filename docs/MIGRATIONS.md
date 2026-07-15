# Mécanisme de migrations — Myko V2

## Problème de divergence

Le ledger Supabase (`supabase_migrations.schema_migrations`) enregistre les migrations sous des timestamps générés au moment de l'application. Les fichiers GitHub ont des timestamps différents (renommés a posteriori lors de la restructuration du dépôt). Résultat : si on exécute `apply-migrations.sh` directement sur prod, il ne reconnaît pas les migrations déjà appliquées et tente de les rejouer — y compris des migrations non idempotentes (opérations de rétractation, sécurité).

Il y a trois catégories d'écart :

| Catégorie | Description | Baseline |
|-----------|-------------|---------|
| `ledger_match` | Appliquée, enregistrée sous un timestamp historique différent | Vérifier historical_version → enregistrer github_version |
| `verify_objects` | Appliquée via `execute_sql` ad-hoc, absente du ledger | Vérifier objets marqueurs → enregistrer github_version |
| `trust` | Migrations pré-V2, appliquées historiquement (tables legacy) | Enregistrer directement sans vérification |
| `new` | Genuinement nouvelles, non appliquées en prod | `apply-migrations.sh` seul |

## Le manifest (`scripts/db/migration-manifest.json`)

Fichier JSON ordonné avec une entrée par fichier `.sql` du répertoire `supabase/migrations/`. Générateur reproductible : `scripts/db/build-manifest.mjs`.

Structure d'une entrée :

```json
{
  "file": "20260714200001_v2_0001_schemas_and_roles.sql",
  "github_version": "20260714200001",
  "name": "v2_0001_schemas_and_roles",
  "sha256": "c30ab0f13c4d...",
  "role": "apply",
  "baseline": "ledger_match",
  "historical_version": "20260714133658",
  "expected_objects": []
}
```

Champs :
- `role` : `"apply"` ou `"rollback"`. Les rollbacks ne sont jamais auto-appliqués.
- `baseline` : catégorie de gestion (`ledger_match`, `verify_objects`, `trust`, `new`, ou `null` pour rollbacks).
- `historical_version` : version dans le ledger prod (pour `ledger_match`), `null` sinon.
- `expected_objects` : objets marqueurs à vérifier (pour `verify_objects` et `new`).

Pour régénérer le manifest après ajout de fichiers :

```bash
node scripts/db/build-manifest.mjs
```

## `apply-migrations.sh` — Applicateur sécurisé

### Algorithme

Pour chaque fichier `.sql` non-rollback dans l'ordre LC_ALL=C :

1. **Pré-check** : lire `schema_migrations` et `schema_migration_checksums` hors transaction.
2. **Drift** : si un sha256 est enregistré et diffère du sha256 courant → **ERREUR, arrêt immédiat** (exit 2). Le fichier a été modifié après application.
3. **Skip** : si la version est dans `schema_migrations` → ignorer.
4. **Apply** : écrire un fichier wrapper SQL temporaire et l'exécuter avec `psql --single-transaction`. Le wrapper :
   - Prend `pg_advisory_xact_lock(hashtext('myko_schema_migrations'))` (verrou transaction-scoped).
   - Re-vérifie l'état (protection contre les races entre instances parallèles).
   - Ré-exécute le check drift.
   - Inclut le fichier migration avec `\i`.
   - Insère dans `supabase_migrations.schema_migrations` ET `ops.schema_migration_checksums`.
   - Tout en une seule transaction : un crash ne peut pas laisser le schéma modifié sans trace.

### Tables de suivi

```sql
-- Compatible CLI Supabase (ne jamais modifier sa structure).
supabase_migrations.schema_migrations(version text PK, name text, applied_at timestamptz)

-- Propriété de l'applicateur.
ops.schema_migration_checksums(version text PK, name text, sha256 text, applied_at timestamptz)
```

### Usage

```bash
# Appliquer les migrations manquantes (défaut)
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh

# Voir ce qui serait appliqué (dry-run, sans modification)
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh status

# Même chose avec le flag long
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh --dry-run

# Sur un répertoire spécifique (ex: CI V2 uniquement)
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh apply /tmp/v2mig
```

### Codes de sortie

| Code | Signification |
|------|---------------|
| 0 | Succès (apply ou status) |
| 1 | Erreur inattendue (psql, fichier absent, etc.) |
| 2 | Drift de checksum détecté |

## `reconcile-ledger.sh` — Réconciliation du ledger

### Algorithme

Pour chaque entrée `apply` du manifest (sauf `new`) dont le `github_version` n'est pas encore dans `schema_migrations` :

- **`ledger_match`** : vérifie que `historical_version` est dans `schema_migrations`. Si absent → erreur (investigation manuelle). Si présent → enregistre `github_version` + sha256 sans réapplication.
- **`verify_objects`** : vérifie l'existence de chaque objet listé dans `expected_objects`. Si tous présents → enregistre. Si un manque → avertissement, laissé pour apply réel.
- **`trust`** : enregistre directement (migrations pré-V2, aucune vérification).

Chaque enregistrement se fait dans une transaction unique avec `pg_advisory_xact_lock` : `schema_migrations` + `schema_migration_checksums` ensemble, ou rien.

### Usage

```bash
# Voir le plan sans rien modifier
DATABASE_URL=postgres://... bash scripts/db/reconcile-ledger.sh --dry-run

# Réconciliation réelle
DATABASE_URL=postgres://... bash scripts/db/reconcile-ledger.sh
```

### Codes de sortie

| Code | Signification |
|------|---------------|
| 0 | Succès |
| 4 | Au moins une entrée en erreur (ex: historical_version absente) |

## Scénarios CI (`.github/workflows/ci.yml`)

### Prérequis

Service Postgres **17** (image `postgres:17`) dans le job `db-tests`.

### Scénario A — Fresh

```
base vierge myko_ci_a
  → bootstrap (00_bootstrap_ci.sql)
  → apply-migrations.sh sur les migrations V2 uniquement (/tmp/v2mig_a)
  → assertions SQL (supabase/tests/ci/*.sql)
  → 2e apply → "0 appliquées"
```

Valide que les migrations V2 (auto-portantes, créant leurs propres schémas) s'appliquent correctement sur un Postgres vierge et sont idempotentes.

### Scénario B — Prod divergente

```
base vierge myko_ci_b
  → bootstrap
  → simulation prod : appliquer 200001→220008 sous VERSIONS HISTORIQUES
                       appliquer 220006, 230001-230003 SANS enregistrement ledger
  → reconcile-ledger.sh --dry-run (vérification du plan)
  → reconcile-ledger.sh (apply)
  → apply-migrations.sh --dry-run → exactement 4 à appliquer (090001-090004)
  → apply-migrations.sh → "4 appliquées"
  → assertions objets (090001-090004 installés)
  → 2e apply → "0 appliquées"
  → [drift] corrompre sha256 → apply échoue (exit 2)
  → assertions SQL complètes
```

Valide la réconciliation en conditions réelles et le refus de drift.

## Runbook prod (opérateur)

Pré-requis : `DATABASE_URL` pointe sur la base de production. Sauvegarder avant tout.

### Étape 1 — Dry-run reconcile

```bash
DATABASE_URL=postgres://... bash scripts/db/reconcile-ledger.sh --dry-run
```

Vérifier la sortie : les `would_record [ledger_match]` doivent correspondre exactement à la carte de correspondance documentée. Aucune ligne `ERREUR`.

### Étape 2 — Reconcile réel

```bash
DATABASE_URL=postgres://... bash scripts/db/reconcile-ledger.sh
```

Vérifier la sortie finale : `N enregistrées, M ignorées, 0 avertissements`. Toute ligne `ERREUR` nécessite une investigation avant de continuer.

### Étape 3 — Dry-run apply

```bash
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh status
```

Doit rapporter **exactement 4 à appliquer** : `20260715090001`, `20260715090002`, `20260715090003`, `20260715090004`. Si d'autres migrations apparaissent, STOP — investigation manuelle.

### Étape 4 — Apply réel

```bash
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh
```

Sortie attendue : `migrations : 4 appliquées, N déjà présentes.`

### Étape 5 — Vérification finale

```bash
# 2e apply doit donner 0
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh
# → migrations : 0 appliquées, N déjà présentes.
```

## Critères de succès (exit criteria)

Après un cycle complet reconcile + apply :

1. **GitHub = ledger** : pour chaque fichier non-rollback dans `supabase/migrations/`, son `github_version` est présent dans `schema_migrations`.
2. **Objets installés** : les objets créés par les nouvelles migrations (090001-090004) existent en base.
3. **Idempotence** : un second `apply-migrations.sh` rapporte `0 appliquées`.
4. **Drift refusé** : si un fichier de migration est modifié après application, `apply-migrations.sh` sort avec le code 2.

## Fichiers de rollback

Les fichiers `*_rollback.sql` sont **exclus** de l'application automatique. Ils doivent être exécutés manuellement en cas de besoin, après vérification. L'applicateur les ignore complètement (`grep -v '_rollback\.sql$'`).

## Correspondance historique (référence)

| Fichier GitHub | Version historique dans le ledger |
|---|---|
| `20260714200001_v2_0001_schemas_and_roles.sql` | `20260714133658` |
| `20260714200002_v2_0002_ops_provenance.sql` | `20260714133728` |
| `20260714200003_v2_0003_catalog_food_model.sql` | `20260714133812` |
| `20260714200004_v2_0004_culinary_model.sql` | `20260714133854` |
| `20260714200005_v2_0005_rls_and_grants.sql` | `20260714133939` |
| `20260714210001_v2_commercial_scan_rpc.sql` | `20260714145929` |
| `20260714220001_v2_release_integrity_and_confidence.sql` | `20260714151219` |
| `20260714220002_v2_atomic_release_functions.sql` | `20260714151408` |
| `20260714220003_v2_retract_premature_f0.sql` | `20260714152756` |
| `20260714220004_v2_f0_provenance.sql` | `20260714153652` |
| `20260714220005_v1_lock_reference_writes.sql` | `20260714153956` |
| `20260714220008_v1_revert_reference_writes.sql` | `20260714155027` |

| Fichier GitHub | Statut prod | Objets marqueurs |
|---|---|---|
| `20260714220006_v2_exclude_prepared_dishes.sql` | Ad-hoc (absent ledger) | `catalog.food_forms` (table) |
| `20260714230001_v2_publish_guardrails.sql` | Ad-hoc (absent ledger) | `ops.confidence_rank`, `ops.publish_catalog_release` |
| `20260714230002_v2_recipe_child_immutability.sql` | Ad-hoc (absent ledger) | `culinary.trg_recipe_steps_immutable`, `trg_recipe_components_immutable` |
| `20260714230003_v2_commercial_label_nutrition.sql` | Ad-hoc (absent ledger) | `catalog.commercial_products.is_composite` (colonne) |
