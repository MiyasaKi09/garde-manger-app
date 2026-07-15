# F0 Food Corpus — Format, Chargeur et Couverture

Réf. MYKO_DATA_FOUNDATION_V2 §3, §5, §7 · PR 106

---

## Vue d'ensemble

Le corpus F0 est la base fondamentale du catalogue alimentaire Myko V2.
Il contient les **27 concepts** et **31 formes** qui couvrent à 100 % la liste
fonctionnelle des recettes R0 (formes requises pour la planification des repas).

Tous les objets chargés ont le statut `candidate` et `published_at = NULL`.
La publication vers `published` se fait via `ops.publish_catalog_release()`
après validation humaine (guardrail de confiance ≥ B sur identité/catégorie/état).

---

## Fichier source

| Fichier | Usage |
|---------|-------|
| `data/foods/f0-corpus.json` | Corpus réel (27 concepts, 31 formes, nutrition CIQUAL 2020 + override) |
| `data/foods/f0-corpus.sample.json` | Echantillon pour CI/tests sans dépendance CSV |

Le corpus réel est préféré si présent ; le sample sert de fallback automatique.

---

## Format du corpus

```jsonc
{
  "source": {
    "code": "myko_f0_curated",
    "license": "cc0-1.0",
    "nutrition_source": "ciqual_2020"
  },
  "concepts": [
    {
      "canonical_name": "Ail",
      "category": "herbes_aromates",       // code de catalog.food_categories
      "identity_confidence": "A",           // D | C | B | A | A+
      "category_confidence": "A",
      "transformations": [],                // optionnel, au niveau concept
      "forms": [
        {
          "canonical_name": "Ail cru",
          "physical_state": "solid",        // solid | liquid | powder | puree | gas | null
          "cooking_state": "raw",           // raw | cooked | null
          "preservation_state": "fresh",    // fresh | frozen | dried | canned | null
          "cut_name": null,
          "bone_state": null,               // bone_in | boneless | null
          "skin_state": "skinless",         // with_skin | skinless | null
          "preparation_state": null,        // grated | peeled | sliced | null
          "fat_level": null,                // lean | semi-fat | fat | null
          "default_quantity_unit": "g",     // g | ml | u | ...
          "edible_yield_ratio": 0.85,       // 0 < ratio <= 1
          "state_confidence": "A",          // confiance sur les états culinaires
          "ciqual_alim_code": "11000",      // null si absent du CSV CIQUAL
          "nutrition_confidence": "B",
          "safety_core_temp_c": null,       // requis pour viandes/volailles/poissons/oeufs
          "conversions": [                  // tableau vide si aucune conversion
            {
              "from_unit": "u",
              "to_unit": "g",
              "factor": 5,
              "context": "gousse moyenne",  // null si sans contexte
              "min_factor": 3,
              "max_factor": 8,
              "confidence": "B"
            }
          ],
          "storage": [                      // >= 1 profil obligatoire
            {
              "storage_method": "ambient",  // ambient | refrigerator | freezer | cellar
              "packaging_state": "loose",   // sealed | opened | loose | null
              "opened_state": "unopened",   // opened | unopened | null
              "min_temperature_c": 15,
              "max_temperature_c": 25,
              "shelf_life_min_hours": 720,
              "shelf_life_max_hours": 4320,
              "recommended_hours": 2160,
              "safety_level": "low",        // low | medium | high
              "confidence": "A"
            }
          ]
        }
      ]
    }
  ]
}
```

### Cas spécial : nutrition_override

Quand `ciqual_alim_code` est `null` et que la forme a des données nutritionnelles
connues (hors CIQUAL), utiliser `nutrition_override` :

```jsonc
{
  "ciqual_alim_code": null,
  "nutrition_override": {
    "values": {
      "energy_kcal": 0,
      "protein_g": 0,
      "carbohydrate_g": 0,
      "fat_g": 0,
      "fiber_g": 0,
      "sugars_g": 0,
      "saturated_fat_g": 0,
      "sodium_mg": 39340,
      "salt_g": 100
    },
    "value_status": "measured"  // measured | estimated | calculated
  }
}
```

**Règle critique** : un zéro avec `value_status: "measured"` est une valeur réelle,
pas `not_available`. Le chargeur l'insère en `food_nutrient_values` avec `value_status='measured'`.

Exemple : Sel fin (NaCl pur, absent du fichier nutrition CIQUAL).

### Macros essentiels manquants → zéro *estimé*

CIQUAL laisse parfois vide un macro réellement nul (glucides d'une viande / poisson /
fromage / huile ; lipides d'un vin / vinaigre). Comme les 4 macros essentiels
(énergie, protéines, glucides, lipides) sont **exigés par le garde-fou de publication**,
le chargeur remplit une case essentielle vide par `0` en `value_status='estimated'`
(zéro **inféré**, jamais fabriqué pour un macro dominant). Chaque cas est listé dans
`f0-corpus-report.json → estimated_zero_macros` pour revue. La CI vérifie que **toutes**
les formes portent les 4 macros non nuls.

---

## Chargeur SQL

### Utilisation

```bash
# Génère f0-corpus-load.sql + f0-corpus-report.json
node scripts/data/foods/build-f0-corpus.mjs

# Application en base (après migrations V2)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/data/out/f0-corpus-load.sql
```

### Fichiers émis

| Fichier | Contenu |
|---------|---------|
| `scripts/data/out/f0-corpus-load.sql` | SQL idempotent (~ 240 Ko, 5 700 lignes) |
| `scripts/data/out/f0-corpus-report.json` | Rapport de couverture + avertissements |

### Garanties d'idempotence

| Table | Stratégie |
|-------|-----------|
| `ops.source_datasets` | `ON CONFLICT (code) DO UPDATE SET last_checked_at` |
| `ops.import_runs` | `INSERT … WHERE NOT EXISTS (configuration_hash)` |
| `catalog.food_concepts` | `ON CONFLICT (canonical_name_normalized) DO UPDATE` |
| `catalog.food_forms` | `ON CONFLICT (food_concept_id, canonical_name_normalized) DO UPDATE` |
| `catalog.food_nutrition_profiles` | `ON CONFLICT (source_dataset_id, source_record_key, data_version) DO UPDATE` |
| `catalog.food_nutrient_values` | `DELETE + reinsert` (cascade FK) |
| `catalog.food_storage_profiles` | `ON CONFLICT (COALESCE-index) DO NOTHING` |
| `catalog.food_unit_conversions` | `ON CONFLICT (COALESCE-index) DO UPDATE factor/confidence` |
| `catalog.food_transformations` | Insertion simple (pas de contrainte unique ; pas de doublon si la forme source est unique) |
| `ops.field_provenance` | `DELETE + INSERT` par entité (pas de données périmées) |

### Source record keys

| Type | Format | Exemple |
|------|--------|---------|
| CIQUAL | `ciqual:<code>` | `ciqual:11000` |
| Override | `override:<normalized>` | `override:sel-fin` |
| Forme (provenance) | `f0:<normalized>` | `f0:ail-cru` |

---

## Couverture R0

Le corpus F0 couvre 100 % des 31 formes de la liste fonctionnelle R0 :

| Catégorie | Formes |
|-----------|--------|
| herbes_aromates | Ail cru, Persil frais |
| matieres_grasses | Beurre doux, Huile d'olive vierge extra |
| poissons_fruits_de_mer | Cabillaud cru |
| legumes | Carotte crue, Haricot vert cru, Oignon jaune cru, Oignon rouge cru, Poivron rouge cru, Pomme de terre crue épluchée, Tomate crue |
| fruits | Citron jaune |
| produits_laitiers | Comté, Crème fraîche épaisse, Gruyère râpé, Lait demi-écrémé |
| legumineuses | Lentille verte sèche crue, Pois chiche cuit égoutté |
| condiments_sauces | Moutarde de Dijon, Sel fin, Vinaigre de vin rouge, Vin blanc sec |
| oeufs | Œuf cru |
| cereales_feculents | Quinoa cru, Riz blanc cru, Riz complet cru |
| epices | Poivre noir moulu |
| volailles | Blanc de poulet cru sans peau, Cuisse de poulet crue avec os avec peau, Haut de cuisse de poulet cru désossé sans peau |

---

## Rapport de couverture

```json
{
  "corpus_hash": "50343360792c40f5a187745aee447ca7",
  "concepts_total": 27,
  "forms_total": 31,
  "forms_with_ciqual": 30,
  "forms_with_override": 1,
  "forms_missing_nutrition": 0,
  "r0_coverage": "31/31",
  "r0_missing": [],
  "missing_nutrition": []
}
```

---

## Runbook post-merge

1. **Appliquer les migrations V2** si ce n'est pas déjà fait :
   ```bash
   DATABASE_URL=... bash scripts/db/apply-migrations.sh apply
   ```

2. **Charger le corpus R0** (recettes — prérequis pour les food_forms référencées) :
   ```bash
   node scripts/data/recipes/build-r0.mjs
   psql "$DATABASE_URL" -f scripts/data/out/r0-load.sql
   ```

3. **Charger le corpus F0** (catalogue alimentaire candidat) :
   ```bash
   node scripts/data/foods/build-f0-corpus.mjs
   psql "$DATABASE_URL" -f scripts/data/out/f0-corpus-load.sql
   ```

4. **Vérifier la couverture** :
   ```bash
   cat scripts/data/out/f0-corpus-report.json
   ```

5. **Validation humaine** avant publication :
   - Vérifier que toutes les formes ont confiance ≥ B sur identité/catégorie/état.
   - Vérifier les profils nutritionnels via les données CIQUAL.
   - Créer une `ops.catalog_releases` et appeler `ops.publish_catalog_release(release_id)`.

---

## Guardrails de publication

La fonction `ops.publish_catalog_release(release_id)` refuse si :

- Une forme a `identity_confidence`, `category_confidence` ou `state_confidence` < B.
- Un profil nutritionnel primaire est absent pour une forme non-saisonnière.
- Des `quality.review_tasks` sont ouvertes sur les entités de la release.

Les 31 formes F0 sont toutes à confiance ≥ B (identité/catégorie/état = A ou B).
Le guardrail doit donc passer sans erreur après validation du profil nutritionnel.
