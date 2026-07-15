# Tests pgTAP — Fondation de données Myko V2

Ce dossier contient les tests SQL exécutables via `pg_prove` (pgTAP) ou directement via `psql`.
Tous les tests s'exécutent dans une transaction `ROLLBACK` : aucune donnée de test ne persiste.

---

## Prérequis

### 1. pgTAP installé dans la base de données cible

```sql
-- À exécuter une seule fois sur la base de test (nécessite un superuser) :
CREATE EXTENSION IF NOT EXISTS pgtap;
```

Pour une instance locale Supabase :

```bash
supabase start
psql "$(supabase db url)" -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
```

### 2. Toutes les migrations V2 appliquées

Les migrations doivent être jouées dans l'ordre avant d'exécuter les tests :

```bash
supabase db reset   # reset + replay de toutes les migrations
# ou
psql "$(supabase db url)" -f supabase/migrations/20260714200001_v2_0001_schemas_and_roles.sql
# ... et toutes les migrations suivantes dans l'ordre chronologique
```

### 3. `pg_prove` (optionnel, meilleur rendu)

```bash
cpan TAP::Parser::SourceHandler::pgTAP
# ou sur Ubuntu/Debian :
sudo apt-get install libtap-parser-sourcehandler-pgtap-perl
```

---

## Exécution

### Avec pg_prove (recommandé)

```bash
# Tous les tests du dossier :
pg_prove --dbname myko_dev --username postgres supabase/tests/

# Un fichier spécifique :
pg_prove --dbname myko_dev --username postgres supabase/tests/v2_audit_hardening.test.sql

# Avec sortie verbeuse (détail de chaque assertion) :
pg_prove -v --dbname myko_dev --username postgres supabase/tests/
```

### Avec psql directement

```bash
# Résultat en format TAP brut :
psql -U postgres -d myko_dev -f supabase/tests/v2_audit_hardening.test.sql

# Avec l'URL Supabase locale :
psql "$(supabase db url)" -f supabase/tests/v2_audit_hardening.test.sql
```

---

## Fichiers de tests

| Fichier | Migrations couvertes | Assertions |
|---------|---------------------|------------|
| `v2_foundation_schema.test.sql` | 0001–0005 | Schémas, tables, RLS, rôles, catégories |
| `v2_release_integrity.test.sql` | 220001–220002 | Immuabilité versions/snapshots, atomicité release |
| `v2_audit_hardening.test.sql`   | 090001–090004 | Immuabilité INSERT, variation, is_in_active_release, label OFF |

---

## Couverture du fichier `v2_audit_hardening.test.sql`

### Bloc 1 — Immuabilité INSERT sur enfants (migration 090001)
- INSERT d'une `recipe_step` sur une version **publiée** → exception P0001
- INSERT d'une `recipe_step` sur une version **brouillon** → succès
- UPDATE du contenu d'une `recipe_version` publiée → exception P0001 (régression)

### Bloc 2 — Immuabilité des tables de variation (migration 090001)
- INSERT d'un `recipe_variation_axis` quand la famille a une version publiée → exception
- INSERT d'un `recipe_variation_axis` quand la famille n'a aucune version publiée → succès
- INSERT d'une `recipe_configuration_rule` sur famille publiée → exception

### Bloc 3 — is_in_active_release (migration 090003)
- `catalog.is_in_active_release(form_id)` = false pour une forme hors release active
- `catalog.is_in_active_release(form_id)` = true pour une forme dans la release active
- Après bascule de pointeur actif, forme exclue → false

### Bloc 4 — Qualité étiquette OFF (migrations 090003 + 090004)
- Composé sans `label_nutrition_complete` → `nutrition_source` NULL dans scan
- Composé sans `label_nutrition_complete` → `nutrition_per_100g` null dans scan
- Produit simple sans étiquette → `nutrition_source = 'generic_form'`
- Produit avec `label_nutrition_complete = true` → `nutrition_source = 'label'`
- `label_nutrition_complete = false` quand `label_nutriments = '{}'`

---

## Tests non automatisés (trop coûteux en setup)

Ces scénarios sont validés manuellement ou via les tests d'intégration :

- **Rejet de `publish_catalog_release` par manque de macros essentiels** : nécessite un run d'import complet avec des données manquantes ciblées.
- **Rejet par absence de provenance** : requiert un insert dans `ops.catalog_release_items` pour des formes sans aucune entrée dans `ops.field_provenance`.
- **Activation exclusive complète** : appel réel de `ops.publish_catalog_release()` sur une release B après A active, vérification que les formes absentes de B sont ramenées à `candidate`.

Pour ces tests, utiliser une branche Supabase dédiée :

```bash
supabase branches create test-publish-guardrails
# Appliquer les migrations, insérer les données de test, appeler la RPC
supabase branches delete test-publish-guardrails
```

---

## Variables d'environnement

```bash
# Base locale Supabase :
export PGDATABASE=postgres
export PGUSER=postgres
export PGPASSWORD=postgres
export PGHOST=localhost
export PGPORT=54322   # port local Supabase par défaut

pg_prove supabase/tests/
```
