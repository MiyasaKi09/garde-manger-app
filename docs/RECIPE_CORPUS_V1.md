# RECIPE_CORPUS_V1 — Contrat §8 et runbook

Corpus recettes scraped V1 : 72 recettes candidates importées par
`scripts/data/recipes/build-corpus-v1.mjs` → `scripts/data/out/corpus-v1-load.sql`.

---

## §8 Contrat de mapping

### §8.1 Familles (`culinary.recipe_families`)

| Champ                    | Source                                         |
|--------------------------|------------------------------------------------|
| `canonical_name`         | `recipe.family`                                |
| `canonical_name_normalized` | `normalizeName(recipe.family)`              |
| `status`                 | `'candidate'` (jamais publié à ce stade)       |
| `confidence_level`       | `recipe.confidence` (B pour ce corpus)         |
| `meal_role`              | Déduit de `recipe.category` via mapping (null si non mappé) |
| `dish_structure`         | `recipe.category` (valeur brute)               |

**Mapping category → meal_role** (best-effort) :

| Catégories                                          | meal_role         |
|-----------------------------------------------------|-------------------|
| plat mijoté, plat en sauce, plat complet, plat bouilli, rôti, viande en sauce, poisson, boulettes, boulettes végétales, curry végétarien, légumineuses, légumes mijotés, céréales et légumes, pâtes, pâtes en sauce, pâtes au four, riz crémeux, tarte salée, pizza, gratin complet, gratin de légumes | `diner` |
| soupe, soupe complète, salade, salade complète, entrée, œufs, œufs et tomate, cake salé, pâte à choux salée, sandwich chaud | `dejeuner` |
| petit-déjeuner, dessert et petit-déjeuner           | `petit-dejeuner`  |
| accompagnement, dessert, dessert froid, tarte sucrée, gâteau, petit gâteau, pâtisserie, tartinade, sauce de base | `null` |

---

### §8.2 Versions (`culinary.recipe_versions`)

| Champ                | Valeur                                                 |
|----------------------|--------------------------------------------------------|
| `version_number`     | `1`                                                    |
| `publication_status` | `'draft'`                                              |
| `quality_level`      | `recipe.confidence`                                    |
| `source_dataset_id`  | Source `'myko_editorial_scraped_v1'`                   |
| `source_record_key`  | `'scraped-v1:<code>'`                                  |
| `author_name`        | `'Myko'`                                               |
| `source_license`     | `'editorial'`                                          |
| `content_hash`       | `md5(canonicalRecipeV1(recipe))` — voir §8.2.1 ci-dessous |

#### §8.2.1 Représentation canonique (base du hash)

```json
{
  "family":     "<normalizeName(family)>",
  "category":   "<normalizeName(category)>",
  "servings":   <number>,
  "prep":       <number|null>,
  "cook":       <number|null>,
  "difficulty": "<string|null>",
  "ings": [{ "pos": 1, "form": "<normalizeName>", "qty": <n>, "unit": "<u>", "role": "<normalizeName>", "opt": <bool> }],
  "steps": [{ "n": <n>, "i": "<instruction>" }],
  "techniques": ["<normalizeName>", ...],
  "variants":   ["<normalizeName>", ...],
  "allergens":  ["<normalizeName>", ...]
}
```

- `ings` : ordonnés par position (ordre de la liste source).
- `steps` : ordonnés par numéro de step.
- `techniques`, `variants`, `allergens` : **triés** (order-independent).

**ON CONFLICT** : `(recipe_family_id, version_number)` → UPDATE des champs de contenu + `content_hash`.

---

### §8.3 Composants (`culinary.recipe_components`)

Un seul composant par recette : `name='plat'`, `component_role='main'`, `position=1`.

- Ingrédients **non-assaisonnements** → `component_id = v_comp`
- Ingrédients **assaisonnements** (optional=true ET forme pure épice/sel/poivre) → `component_id = NULL`

---

### §8.4 Exigences d'ingrédients (`culinary.recipe_ingredient_requirements`)

| Règle                                    | requirement_type      | strictness   |
|------------------------------------------|-----------------------|--------------|
| `optional=false`                         | `'exact_form'`        | `'required'` |
| `optional=true` + forme non-assaisonnement | `'exact_form'`      | `'optional'` |
| `optional=true` + forme assaisonnement   | `'seasoning_to_taste'`| `'optional'` |

**Détection assaisonnement** (`isSeasoning(formNorm)`) : forme normalisée contient l'un de
`sel`, `poivre`, `piment`, `muscade`, `curcuma`, `paprika`, `cannelle`, `cumin`, `cardamome`,
`girofle`, `safran`, `curry`, `ras el hanout`, `cinq epice`, `epice`, `herbes de provence`.

**Résolution de forme** : sous-requête SQL sur `catalog.food_forms.canonical_name_normalized`
(statut `<> 'rejected'`). Si absente → `NULL` (→ review_task `missing_food_form`).

**Champs** : `quantity`, `unit`, `position` (1-based), `culinary_role` = `normalizeName(role)`.

---

### §8.5 Provenance (`ops.field_provenance`)

À chaque rechargement, pour chaque version :
1. **DELETE** de la provenance existante (`field_name='content'`).
2. **INSERT** avec le hash courant + `import_run_id` courant.

Garantit qu'aucun hash périmé ne subsiste après une mise à jour de contenu.

---

### §8.6 Tâches de révision (`quality.review_tasks`)

Trois types de tâches, toutes avec `status='open'` :

| task_type                        | entity_type                   | priority | Condition                                      |
|----------------------------------|-------------------------------|----------|------------------------------------------------|
| `missing_food_form`              | `recipe_ingredient_requirement` | 2 (required) / 3 (optional) | Forme non résolue dans `catalog.food_forms` |
| `unresolved_required_ingredient` | `recipe_version`              | 1        | ≥ 1 exigence required sans forme résolue       |
| `variants_need_branch_modeling`  | `recipe_version`              | 5        | `variants[]` non vide                          |

**Idempotence** : en début de DO block (après avoir le `v_ver`), DELETE des tâches existantes
pour cette version (`entity_id = v_ver`) ET pour ses exigences (JOIN sur requirements encore présents).
Puis suppression des requirements, steps, components. Puis réinsertion.

---

## Résolution et tâches de révision (chiffres à l'intégration)

| Forme résolue (F0)        | Forme manquante (exemple)     |
|---------------------------|-------------------------------|
| Ail cru                   | Paleron de bœuf cru, paré     |
| Beurre doux               | Lardon fumé cru               |
| Carotte crue              | Vin rouge sec                 |
| Comté                     | Champignon de Paris frais     |
| Huile d'olive vierge extra| Farine de blé T55             |
| Oignon jaune cru          | Bouquet garni frais           |
| Sel fin                   | … (137 formes nouvelles)      |
| Poivre noir moulu         |                               |
| *23 formes résolues*      | *137 formes manquantes*       |

Les 137 formes manquantes constituent le backlog de review_tasks `missing_food_form`.
Les 72 recettes (toutes avec `variants[]` non vides dans corpus-v1.json) génèrent
72 tâches `variants_need_branch_modeling`.

---

## Post-merge runbook

### 1. Appliquer les migrations V2 (si pas encore fait)

```bash
DATABASE_URL=postgres://... bash scripts/db/apply-migrations.sh apply
```

### 2. Charger le corpus alimentaire F0

```bash
node scripts/data/foods/build-f0-corpus.mjs
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/data/out/f0-corpus-load.sql
```

### 3. Générer et charger le corpus-v1

```bash
node scripts/data/recipes/build-corpus-v1.mjs
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/data/out/corpus-v1-load.sql
```

### 4. Vérifier le chargement

```sql
-- Familles candidates (0 publiées)
SELECT count(*) FROM culinary.recipe_families WHERE status = 'candidate';
SELECT count(*) FROM culinary.recipe_families WHERE status = 'published'; -- doit être 0

-- Versions draft (0 publiées)
SELECT count(*) FROM culinary.recipe_versions WHERE publication_status = 'draft';
SELECT count(*) FROM culinary.recipe_versions WHERE publication_status = 'published'; -- doit être 0

-- Tâches de révision ouvertes par type
SELECT task_type, count(*) FROM quality.review_tasks
WHERE status = 'open'
GROUP BY task_type ORDER BY task_type;
```

### 5. Idempotence : recharger sans erreur

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/data/out/corpus-v1-load.sql
# Les comptes doivent rester identiques.
```

### 6. NE PAS PUBLIER

Le corpus est CANDIDAT. La publication est bloquée par :
- `quality.review_tasks` ouvertes (`unresolved_required_ingredient`).
- `ops.publish_catalog_release` qui rejette si des formes required manquent.

Les formes alimentaires manquantes et les branches de variantes sont les **PR de suivi**.

---

## Développement et CI

- Tests unitaires : `npx vitest run tests/data/corpusV1.test.js`
- CI scenario A : voir `.github/workflows/ci.yml` section `[A] Corpus-v1`
- Fixture de développement : `data/recipes/corpus-v1.sample.json` (2 recettes)
