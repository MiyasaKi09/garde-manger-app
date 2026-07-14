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

## État & discipline (suite à l'audit directeur)

Une première tentative de publication `F0.1-functional-r0` (18 formes) a été **rétractée** :
le rattachement automatique « nom le plus court » choisissait de mauvaises formes
(lentille/haricot déjà cuits, œuf dur au lieu de cru, pomme de terre nouvelle
arbitraire) et la publication était prématurée + appliquée depuis une branche non
fusionnée. Supabase a été **remis à l'état de `main`** (F0 candidate, culinary vide).

**Règle adoptée** : plus aucune écriture Supabase depuis cette branche non fusionnée.
Les corrections sont **code d'abord** ; l'application en base ne se fait qu'après merge.

## Corrections en cours (réf. verdict)

1. Chargeur idempotent + `content_hash` calculé sur le **contenu complet** (pas le nom).
2. Rattachement d'ingrédient à une forme **explicite et correcte en état** (cru/sec/cuit/
   pelé…) — suppression du matching « nom le plus court ».
3. Recettes **complètes** (matière grasse, liquide de déglaçage, sel chiffré, T° à cœur,
   huile/vinaigre de la salade…). Chaque ingrédient cité dans une étape existe.
4. `recipe_requirement_options` réellement peuplées ; variantes reliées aux formes/
   exigences/branches.
5. Garde-fous sur `publish_catalog_release` (confiance ≥ B, états ≥ B, pas de tâche de
   revue ouverte, nutrition présente, checksums) + immuabilité étendue aux tables enfants.
6. Produit commercial composé : nutrition d'**étiquette**, jamais celle d'une forme
   générique simple.
7. Provenance recette (import_run, auteur, licence) + tests culinaires (ingrédient cité,
   cohérence cru/cuit, matière grasse de cuisson, options non vides).

## Suite (après corrections)

Reconstruire F0 depuis les **formes correctes en état** requises par les recettes,
structurées comme `golden-foods.json`, puis publier atomiquement (avec garde-fous).
Nutrition des recettes via le calculateur déterministe + `toGramsV2` → `recipe_executions`.
