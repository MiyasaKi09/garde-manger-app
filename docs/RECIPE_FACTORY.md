# Fabrique de recettes V2 — `data-v2/recipe-factory` (R0)

> Réf. `MYKO_DATA_FOUNDATION_V2.md` §6, §11. Séquencement validé par le directeur :
> **on part des recettes, la liste fonctionnelle F0 se déduit de leurs ingrédients.**

## Principe

- Recettes **réelles, rights-clean** : contenu éditorial propre Myko (CC0) — pas de
  scraping de recettes tierces (droits à valider par corpus, §6.1-6.2).
- Chargées comme **CANDIDATES** (`publication_status='draft'`, confiance `C`) : une
  recette ne devient une vérité publiée **qu'après revue** — on ne refait pas l'erreur
  « publier d'abord, contrôler ensuite » de F0.
- **La liste fonctionnelle F0 = union des ingrédients des recettes.** Ce que les
  recettes utilisent réellement définit les aliments à structurer/valider (pas une
  liste arbitraire par quotas).

## Fichiers

| Élément | Fichier |
|---|---|
| Corpus R0 (contenu éditorial) | `data/recipes/r0.json` |
| Chargeur (→ SQL candidat + liste fonctionnelle) | `scripts/data/recipes/build-r0.mjs` |
| Sorties | `scripts/data/out/r0-load.sql`, `scripts/data/out/r0-functional-foods.json` |
| Tests | `tests/data/recipeCorpus.test.js` |

## Structure d'une recette (schéma `culinary`)

```
recipe_families           (identité du plat, candidate)
  └── recipe_versions      (version 1, draft, source myko_editorial, content_hash)
        ├── recipe_components            (poulet / sauce moutarde / purée…)
        ├── recipe_ingredient_requirements (exact_form | validated_options |
        │     functional_requirement | seasoning_to_taste ; rattachées au mieux à une
        │     food_form via preferred_food_form_id, sinon NULL = forme F0 à créer)
        ├── recipe_steps                 (étapes numérotées, minutes actives/passives, T°)
        └── recipe_variation_axes/options (ex. « morceau » : haut de cuisse / cuisse / blanc)
```

La recette canonique **« Poulet à la moutarde et purée »** (§11 du plan) est implémentée
complètement (3 composants, axe de variation « morceau ») comme référence.

## R0 — état actuel

- **8 recettes** candidates (poulet moutarde purée, lentilles mijotées, omelette,
  gratin, haricots verts, salade de pois chiches, quinoa aux légumes, cabillaud + riz).
- **Liste fonctionnelle F0 dérivée : 31 formes** (`r0-functional-foods.json`) — l'**union**
  des formes préférées **et de toutes les alternatives** (options validées, options d'axe,
  formes de branche) : inclut désormais cuisse de poulet avec os, blanc de poulet, gruyère
  râpé, riz complet, ainsi que les assaisonnements (sel fin, poivre noir moulu).

## Variantes RÉELLEMENT exécutables (verdict directeur #2)

Une option validée qui **change la cuisson** n'est plus un simple libellé : elle porte une
`recipe_instruction_branch` propre, ses **étapes distinctes** (`recipe_steps.branch_id`), un
`quantity_factor` (rendement, ex. **désossage** des cuisses avec os = ×1,45) et un
`quality_impact`. L'axe de variation relie ses options aux branches par
`selection_condition` (`{axis, option}`) — relation **déterministe**.

- **Poulet** : 3 morceaux ⇒ 3 branches avec saisie + mijotage **distincts** (haut de cuisse
  20 min, cuisse entière avec os 30 min, blanc 12 min), rendement de désossage sur la cuisse.
- **Cabillaud** : riz blanc (12 min) vs riz complet (18 min, plus d'eau) = 2 branches.

Les **assaisonnements** chiffrés portent leur **forme réelle** (Sel fin, Poivre noir moulu)
avec une **quantité de référence** (comptée dans le sodium) tout en restant
`seasoning_to_taste` + optionnels (**ajustables au goût**) — plus de `preferred_food_form_id`
NULL qui excluait le sel du calcul nutritionnel.

## Reproductibilité : hash & provenance (verdict directeur)

- `content_hash` = md5 du **contenu canonique complet** : famille, `meal_role`,
  `dish_structure`, titre, portions, temps prépa/cuisson, difficulté, composants (+rôle),
  association ingrédient↔composant, `strictness`, `culinary_role`, `preparation_note`,
  options (forme, `quantity_factor`, `quality_impact`, branche), étapes (+branche, T°),
  branches, axes (+`selection_mode`). Toute modification de contenu change le hash.
- Le **run d'import** est identifié par le **hash du corpus** (union des hash de recettes) :
  un corpus modifié crée un nouveau run. La **provenance** est réécrite (delete+insert) à
  chaque contenu → jamais de hash périmé.

## Mécanisme de migration & tests SQL en CI (verdict directeur #6, #7)

- `scripts/db/apply-migrations.sh` : applicateur **ordonné, idempotent, tracé** dans
  `supabase_migrations.schema_migrations` (réexécutable). Utilisé en CI **et** pour
  réconcilier le registre avec les fichiers versionnés.
- Job CI **`db-tests`** : Postgres éphémère → `00_bootstrap_ci.sql` (rôles/`auth` stub) →
  `apply-migrations.sh` (×2, prouve l'idempotence) → assertions SQL `supabase/tests/ci/*.sql`
  (immuabilité, garde-fous de publication, release exclusive, nutrition OFF). Une suite
  pgTAP plus riche (`supabase/tests/*_test.sql`) est disponible en local (`pg_prove`).

## Discipline d'application (rappel)

Aucune écriture Supabase depuis une branche non fusionnée. Ordre imposé par le directeur :
1) durcir (cette PR) → 2) merger → 3) appliquer les migrations **via le mécanisme** →
4) charger les 8 recettes candidates (`r0-load.sql`). La publication F0 vient **plus tard**,
après extension du corpus vers 30-50 recettes et revue.
Nutrition des recettes via le calculateur déterministe + `toGramsV2` → `recipe_executions`.
