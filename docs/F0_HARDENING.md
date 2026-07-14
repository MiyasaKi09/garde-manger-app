# Durcissement F0 — réponse à l'audit directeur

> PR `fix(data-v2): harden F0 validation, provenance and atomic releases`.
> Ciqual garantit ses **valeurs nutritionnelles**, pas notre **découpage automatique**
> en concepts/formes/catégories/états. F0 n'est plus traité comme un catalogue publié.

## Traité dans cette PR

| # | Point de l'audit | État |
|---|---|---|
| 1 | Repasser concepts/formes F0 en `candidate` | ✅ rétractés (0 forme publiée) |
| 2 | Conserver les profils nutritionnels Ciqual en confiance **B** | ✅ 300 profils restent B |
| 3 | Confiance distincte identité / catégorie / états | ✅ colonnes `identity/category/state_confidence` (F0 → C/C/D) |
| 4 | Enregistrer un `import_run` réel | ✅ 1 run (`ops.import_runs`) |
| 5 | Remplir la provenance par champ | ✅ 6 288 lignes (`ops.field_provenance`) : valeurs + identités |
| 6 | Conserver réellement le fichier source brut | ✅ `data/sources/raw/*.xls.gz` (sha256 == `import_blobs`) |
| 7 | `release_items` + `active_release` | ✅ `ops.catalog_release_items` (581) + `ops.active_catalog_release` |
| 8 | Publication en transaction unique | ✅ `ops.publish_catalog_release()` (promotion atomique + pointeur) |
| 9 | Tester une interruption au milieu de la publication | ✅ test SQL : rien de publié hors release publiée |
| 11 | Exclure/séparer les plats préparés | ✅ 9 plats (omelettes, sandwich, gnocchi…) → `rejected` |
| 12 | Corpus de validation manuelle | ✅ `data/fixtures/golden-foods.json` (poulet + découpes + rendements + transformation) |
| 13 | Conversions V2 strictes | ✅ `toGramsV2` (aucun repli inventé) |
| 14 | Trigger empêchant la modif d'une recette publiée | ✅ triggers `recipe_versions` + `recipe_executions` |
| 15 | Risques sécurité V1 actifs | ⚠️ **partiel** — voir ci-dessous |

## Point 15 — sécurité V1 : fait vs à décider

**Fait (sans risque pour l'app) :**
- Écriture des tables de **référence pures** (`nutritional_data`, `canonical_foods`,
  `archetypes`, `processes`, `cooking_nutrition_factors`, `process_nutrition_modifiers`,
  `countries`, `cultivars`, `diets`, `reference_categories`, `reference_subcategories`,
  `seasonality`, `canonical_food_origins`, `canonical_food_processes`,
  `archetype_nutrition_overrides`) **verrouillée** : plus de policy `FOR ALL USING(true)`
  pour `authenticated` ; lecture conservée ; écriture réservée à `service_role`.
  → corrige « n'importe quel authentifié peut corrompre le catalogue » pour ces tables.

**À décider (produit) — non modifié pour ne pas casser l'app en production :**
- **Données du foyer** (`pantry_items`, `meal_plans`, `planned_meals`,
  `user_recipe_interactions`) : policy `FOR ALL TO authenticated USING(true)`. Pour un
  garde-manger **partagé à deux**, l'accès inter-membres est peut-être **voulu**.
  Décision : (a) partage au niveau **foyer** (via `household_members`), ou (b) strict
  `user_id = auth.uid()`. À trancher avant de resserrer.
- **Fonctions `SECURITY DEFINER`** appelables par `authenticated` : `add_harvest_lot`,
  `split_containerized_lot` (V1). À faire passer par des routes serveur (`service_role`)
  et révoquer `authenticated` — nécessite de confirmer que l'app ne les appelle pas
  directement côté client.
- Tables métier potentiellement écrites par l'app (`recipes`, `recipe_*`, `products`) :
  laissées en l'état ici (édition utilisateur probable) — à qualifier au cas par cas.

## Point 10 — reconstruction fonctionnelle de F0 : cadre posé, liste à fournir

L'ancienne sélection (quotas arbitraires + score de généricité + ordre code Ciqual)
est **abandonnée**. La reconstruction doit partir d'une **liste fonctionnelle** :
aliments fréquents du foyer, ingrédients des 30–50 premières recettes, stock probable.
Le **corpus golden** (`data/fixtures/golden-foods.json`) fixe la structure cible
correcte (concept unique + formes avec états + rendements + transformation, ex. poulet).

➡️ La liste fonctionnelle précise dépend du foyer : à fournir pour finaliser la
re-publication (via `ops.publish_catalog_release()`), formes validées à confiance A
(identité/états) tout en gardant la nutrition Ciqual à B.

## Publier / annuler une release (nouveau flux atomique)

```sql
-- charger les candidats (status='candidate'), les inscrire dans catalog_release_items,
-- puis, en UNE transaction :
select ops.publish_catalog_release('<release_uuid>');   -- promotion atomique + pointeur actif
select ops.rollback_catalog_release('food');            -- rollback par pointeur (sans suppression)
```
