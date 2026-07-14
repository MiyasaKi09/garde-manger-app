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

## Point 15 — sécurité V1 : audité, mais durcissement reporté (pour ne pas casser l'app)

L'audit V1 a été fait (policies `USING(true)`, objets anon, fonctions SECURITY DEFINER).
**Deux tentatives de durcissement ont été annulées après avoir découvert des contraintes
réelles** — mieux vaut reporter proprement que casser l'app en production :

- **Verrouillage des écritures « catalogue »** (220005) → **reverté** (220008).
  L'app écrit certaines de ces tables comme `authenticated` : la revue des ingrédients
  (`POST /api/ingredients/review`) fait `canonical_foods.verified = true` (catalogue
  canonique explicitement « vérifiable par tout membre du foyer »), et le pipeline
  nutrition insère dans `nutritional_data`. Le lockdown cassait ces flux (e2e
  recipe-repair). ➡️ Le durcissement nécessite une analyse **par table** des chemins
  d'écriture réels (séparer référence figée vs tables éditées par l'utilisateur).
- **RLS des données foyer** (`pantry_items`, `meal_plans`, `planned_meals`,
  `user_recipe_interactions`) → **non appliqué**. Décision produit = **partage au niveau
  foyer**. Mais ces tables V1 utilisent un `user_id` **entier** (modèle utilisateur
  legacy), pas l'`uuid` `auth.uid()` ; il manque le pont legacy↔auth pour écrire une
  policy correcte. Le partage foyer arrivera proprement avec les tables V2
  (`household_id`/`user_id` uuid) à la bascule. Tables actuellement **vides** → risque nul
  dans l'immédiat.
- **Fonctions `SECURITY DEFINER`** appelables par `authenticated` (`add_harvest_lot`,
  `split_containerized_lot`) : à faire passer par des routes serveur (`service_role`) et
  révoquer `authenticated`, après confirmation que l'app ne les appelle pas côté client.

**Conclusion honnête** : le durcissement V1 demande une connaissance fine des chemins
d'écriture de l'app + le pont legacy↔auth. Il est mieux traité **à la bascule V2** (qui
remplace ces tables par un modèle propre) qu'en modifiant à l'aveugle une app en prod.

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
