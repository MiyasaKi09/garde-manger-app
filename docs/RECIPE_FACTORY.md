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
- **25 exigences d'ingrédients**, **21 rattachées** à une `food_form` existante ; les
  non rattachées (crème, sel…) = aliments que **F0 doit encore fournir**.
- **Liste fonctionnelle F0 dérivée : 21 aliments** (`r0-functional-foods.json`) :
  ail, cabillaud, carotte, citron, comté, crème, haricot vert, haut de cuisse de poulet,
  lentille verte, moutarde, œuf, oignon jaune, oignon rouge, persil, pois chiche,
  poivron rouge, pomme de terre, quinoa, riz blanc, sel, tomate.

## Première release F0 fonctionnelle publiée (F0.1)

`scripts/data/publish/publish-f0-functional.sql` — construit et **publie
ATOMIQUEMENT** (via `ops.publish_catalog_release()`) les formes requises par R0 qui ont
une nutrition Ciqual :

- release active = **`F0.1-functional-r0`** (`ops.active_catalog_release`) ;
- **18 formes publiées** + 18 profils nutritionnels (Ciqual, confiance B) ;
  identité relevée à B (validée par usage dans une recette) ;
- **20 exigences d'ingrédients** des recettes pointent désormais sur des formes
  **publiées** ; **12 produits commerciaux** se résolvent à une forme publiée (le scan
  code-barres renvoie produit → forme → nutrition).

Boucle fermée démontrée : `recettes → liste fonctionnelle → F0 validé publié
atomiquement → recettes & scan résolus`. Petit mais **correct** (pas 300 arbitraires).

## Suite

1. **Étendre R0 → 30-50 recettes** (même format éditorial rights-clean) → élargit F0.
2. **Structurer finement** les aliments manquants (crème, sel, découpes poulet) comme
   `golden-foods.json` (concept unique + formes avec états + rendements) et compléter F0.
3. **Nutrition des recettes** : calcul déterministe (`lib/domain/nutrition/calculator`
   + `toGramsV2` strict) sur les formes publiées → `recipe_executions` (snapshots figés).
4. Revue → passage des recettes de `draft` à `published` (immuables).
