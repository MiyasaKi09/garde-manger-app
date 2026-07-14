# Modèle de données V2 — fondation « tabula rasa »

> Document normatif de référence : **`MYKO_DATA_FOUNDATION_V2.md`** (fourni par le
> directeur). Il **prévaut** sur toute mention résiduelle de migration/backfill de
> données legacy. Ce fichier documente la **PR 1 `data-v2/foundation`** telle
> qu'implémentée dans le dépôt.

## Décision

L'ancien schéma `public` (V1) devient une **archive** : il continue de faire tourner
l'application actuelle, mais **n'alimente plus aucune vérité**. Le catalogue
aliments/recettes est reconstruit à partir de **sources identifiées** (Ciqual, USDA,
Open Food Facts, sources sanitaires) via une **fabrique de données** contrôlée.

> Une machine peut importer, proposer, rapprocher, calculer et détecter. Elle ne
> peut pas déclarer seule qu'une donnée culinaire ou sanitaire est vraie.

La logique métier (unités, calcul nutritionnel déterministe) **ne change pas** ; seule
la **gestion Supabase** change : nouveaux schémas isolés, sécurité repensée. La
fondation est posée **dans le même projet Supabase**, de façon **additive** — le
`public` legacy n'est pas touché. La suppression des tables legacy interviendra à la
**bascule** (plan de bascule, Phase 6), une fois V2 fonctionnel.

## Schémas (zones de confiance & domaines)

| Schéma | Rôle | Zone |
|---|---|---|
| `source_raw` | copies brutes immuables des sources | Zone 0 |
| `staging` | enregistrements parsés, non fiables | Zone 1 |
| `catalog` | aliments, formes, nutrition, conservation, conversions | Zone 3 |
| `culinary` | familles, versions, variantes, étapes | Zone 3 |
| `inventory` | stock réel (lots, mouvements, réservations) — *à venir* | — |
| `planning` | plans, repas, courses, tâches, snapshots — *à venir* | — |
| `private` | foyer, profils, objectifs, feedback — *à venir* | — |
| `quality` | anomalies, revues, scores, décisions | — |
| `ops` | sources, runs d'import, provenance, releases | — |

## Niveaux de confiance (par ligne)

`D` importée · `C` structurée · `B` source vérifiée · `A` validée métier ·
`A+` testée en cuisine. Le planificateur ne consomme que du **publié** suffisamment
fiable (aliments ≥ B, règles sanitaires A, recettes A/A+ ; B en découverte explicite).

## Modèle alimentaire (`catalog`)

```
food_concepts (identité générale : poulet, pomme de terre…)
  └── food_forms (objet concret stockable/cuisinable : cuisse crue avec os, purée préparée…)
        ├── food_aliases (synonymes contextuels, avec confiance)
        ├── food_nutrition_profiles → food_nutrient_values (base 100 g, value_status)
        ├── food_storage_profiles (conservation résolue par combinaison, jamais générique)
        ├── food_unit_conversions (par forme, éventuellement en plage min/max)
        ├── food_transformations → food_transformation_outputs (rendements)
        └── commercial_products (code-barres, marque — ne remplace jamais la forme)
food_categories (taxonomie limitée & stable, seedée — rangement, pas vérité culinaire)
```

La nutrition, la conservation, le poids unitaire et la densité sont portés par la
**forme**, jamais par le concept.

## Modèle culinaire (`culinary`)

```
recipe_families (identité du plat)
  └── recipe_versions (recette complète sourcée ; publiée = IMMUABLE, content_hash unique)
        ├── recipe_components (viande, sauce, purée… ; sous-recettes possibles)
        ├── recipe_ingredient_requirements (exact_form | validated_options | functional
        │     | sub_recipe | seasoning_to_taste)
        │     └── recipe_requirement_options (formes acceptées, préférence, impact qualité)
        ├── recipe_instruction_branches → recipe_steps (branches conditionnelles)
        └── recipe_executions (config figée + snapshots, content_hash unique ;
              le planning référence recipe_execution_id, pas une recette mutable)
recipe_variation_axes → recipe_variation_options (morceau, sauce, purée…)
recipe_configuration_rules (required|recommended|allowed|discouraged|forbidden)
```

## Fabrique de données (`ops` / `quality` / `source_raw`)

- `ops.source_datasets` — registre juridique/technique des sources (licence, usages
  autorisés). **Aucun import** sans licence connue et usages compatibles.
- `source_raw.import_blobs` — fichiers originaux (Storage), immuables + `sha256`.
- `ops.import_runs` — exécutions idempotentes, traçables.
- `ops.field_provenance` — origine **par champ** d'une donnée fusionnée.
- `ops.catalog_releases` — publication **atomique** par release + rollback par pointeur.
- `quality.review_tasks` — revue humaine **ciblée** par risque (allergènes,
  conservation, sécurité, formes animales, recettes du prochain planning…).

## Sécurité (Supabase V2 — §9)

- **`anon`** : aucun accès (pas d'`USAGE` sur les schémas V2 ; RLS activée partout).
- **`authenticated`** : lecture des données **publiées** du catalogue uniquement
  (policies `status='published'` / `published_at IS NOT NULL`, sinon via l'entité
  parente) ; **aucune écriture** ; aucun accès à `ops`/`source_raw`/`staging`/`quality`.
- **`service_role`** + rôles techniques (`data_reader`, `data_importer`,
  `data_reviewer`, `data_publisher`, `app_server`) : import et publication. **Aucun
  job d'import ne possède les droits de publication** — un import compromis ne peut pas
  contaminer le catalogue actif.

### Avertissements advisor attendus (par conception)

- `rls_enabled_no_policy` (INFO) sur `ops.*` / `quality.review_tasks` /
  `source_raw.import_blobs` : intentionnel — tables verrouillées à `service_role` et
  aux rôles techniques (aucune policy pour `authenticated`/`anon`).
- `pg_graphql_authenticated_table_exposed` (WARN) sur `catalog.*` / `culinary.*` :
  attendu — lecture du **catalogue publié** par `authenticated`, filtrée ligne à ligne
  par RLS. Ces schémas ne sont pas dans la liste des schémas exposés par l'API, donc
  pas de chemin anon. Le durcissement vers des **vues/RPC contrôlées** (§9.1) se fera à
  l'intégration applicative.
- Les avertissements sur `public.*` sont l'**héritage V1** (archive), hors périmètre de
  cette fondation.

## Migrations & test

| Fichier | Contenu |
|---|---|
| `supabase/migrations/20260714200001_v2_0001_schemas_and_roles.sql` | schémas + rôles techniques |
| `supabase/migrations/20260714200002_v2_0002_ops_provenance.sql` | sources, blobs, runs, provenance, releases, revue |
| `supabase/migrations/20260714200003_v2_0003_catalog_food_model.sql` | modèle alimentaire + taxonomie seedée |
| `supabase/migrations/20260714200004_v2_0004_culinary_model.sql` | modèle culinaire |
| `supabase/migrations/20260714200005_v2_0005_rls_and_grants.sql` | RLS + policies + grants |
| `supabase/tests/v2_foundation_schema.test.sql` | assertions structure/sécurité |

**Aucun import réel** dans cette PR (uniquement la structure + la taxonomie de
catégories). Les données arrivent via la fabrique (`data-v2/food-factory`,
`data-v2/recipe-factory`).
