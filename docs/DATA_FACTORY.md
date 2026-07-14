# Fabrique de données V2 — `data-v2/food-factory`

> Réf. `MYKO_DATA_FOUNDATION_V2.md` §5, §7. PR 2 de la séquence data-v2.

Chaîne d'import **contrôlée, reproductible et auditable** : une machine peut importer,
proposer, rapprocher, calculer et détecter — elle ne déclare pas seule qu'une donnée
est vraie. La première release F0 (300 formes) est construite depuis **Ciqual 2020**.

## Pipeline (§5.4)

```
Download → Verify checksum → Store raw → Parse → Normalize (texte + unités)
→ Resolve (concept / forme / catégorie) → Detect anomalies → Build candidate release → Publish
```

| Étape | Fichier | Rôle |
|---|---|---|
| Download | `scripts/data/download/ciqual.mjs` | télécharge le XLS, calcule le `sha256`, imprime la fiche blob |
| Parse | `scripts/data/parse/ciqual.mjs` | XLS (SheetJS) → enregistrements homogènes ; colonnes nutriments repérées par motif |
| Normalize | `scripts/data/lib/normalize.mjs` | minuscules/accents, virgule décimale FR, `traces`/`-`/`< x`, extraction d'états |
| Nutriments | `scripts/data/lib/ciqual-nutrients.mjs` | 33 colonnes Ciqual → `nutrient_code` contrôlé + unité |
| Catégories | `scripts/data/lib/categories.mjs` | groupe Ciqual → taxonomie Myko (17 catégories, word-boundaries) |
| Anomalies | `scripts/data/lib/anomalies.mjs` | §5.7 : négatifs, somme macros > 100 g, 4-4-9, énergie aberrante, sel/sodium |
| Orchestrateur | `scripts/data/run-f0.mjs` | sélection équilibrée de 300 formes → artefact candidat déterministe |
| Publish | `scripts/data/publish/emit-publish.mjs` | génère le SQL idempotent (concepts/formes/profils/valeurs + release) |

Le fichier source brut vit dans `.data-cache/` (gitignoré). L'artefact candidat
(`scripts/data/out/f0-release.json`) et le SQL de publication
(`scripts/data/out/f0-publish/`) sont committés (reproductibles).

## Sources & licences (§5.2)

`data/sources/registry.yaml` → `ops.source_datasets`. F0 :

| Source | Licence | Usage |
|---|---|---|
| Ciqual 2020 (ANSES) | Licence Ouverte / Etalab 2.0 | base nutritionnelle française principale |
| USDA FoodData Central | CC0 | complément, découpes, contrôle croisé (F1+) |
| Open Food Facts | ODbL | produits commerciaux uniquement (PR 3) |

`source_raw.import_blobs` conserve le `sha256` + version du fichier source (traçabilité).

## Release F0 — 300 formes (§5.9)

- **281 concepts**, **300 formes** (`confidence_level = B` — source vérifiée), publiées.
- **300 profils nutritionnels** primaires (base 100 g), **~6 000 valeurs** de nutriments
  (22 nutriments publiés couvrant le minimum §10.16 : fibres, Ca, Fe, Mg, K, Na, Zn, I,
  vit A, D, C, B9, B12 + macros).
- **17 catégories** couvertes (quotas équilibrés : légumes 45, fruits 35, viandes 30,
  poissons 25, laitiers 30, féculents 30, volailles 20, légumineuses 15…).
- `value_status` distingue `measured` / `estimated` (seuils `< x`) / `trace` — un zéro
  mesuré n'est jamais confondu avec une valeur absente.
- **8 tâches de revue** (`quality.review_tasks`) pour anomalies non bloquantes
  (sel/sodium sur légumes ; incohérence 4-4-9 sur boissons alcoolisées — l'alcool
  n'entre pas dans le calcul 4-4-9).
- Publication tracée dans `ops.catalog_releases` (`version = F0-2020.07.07`, manifeste +
  checksums + rapport qualité).

Rejets à l'import : sans catégorie (84), sans énergie (881), anomalie bloquante (13).

## Rejouer

```bash
node scripts/data/download/ciqual.mjs      # (ou télécharger le XLS dans .data-cache/)
node scripts/data/run-f0.mjs               # → scripts/data/out/f0-release.json + rapport
node scripts/data/publish/emit-publish.mjs # → scripts/data/out/f0-publish/*.sql
# puis appliquer 00-setup, 10a/10b/10c-forms, 90-finalize (idempotents, ON CONFLICT DO NOTHING)
```

## Suite

- **F1 (1 500 formes)** : couverture semaine, USDA en complément, contrôle croisé.
- **PR 3 `data-v2/commercial-products`** : Open Food Facts → `catalog.commercial_products`.
- **PR 4 `data-v2/recipe-factory`** : la nutrition-engine réutilise `lib/domain/units` +
  `lib/domain/nutrition/calculator` (logique déterministe inchangée).
