# Corpus industriel des ingrédients — Ciqual 2025

Ce lot matérialise les **3 484 références alimentaires** et les **74 constituants**
de la Table Ciqual 2025 v1.0. Il remplace Ciqual 2020 comme corpus nutritionnel de
référence de l’encyclopédie, sans publier automatiquement d’ingrédient canonique.

## Provenance

| Champ | Valeur |
|---|---|
| Producteur | ANSES |
| Jeu de données | [Table Ciqual 2025](https://doi.org/10.57745/RDMHWY) |
| Fichier source | [Classeur Excel v1.0](https://doi.org/10.57745/RPWYZD) |
| Publication | 19 novembre 2025 |
| Licence | Licence Ouverte / Etalab 2.0 |
| MD5 officiel | `0d9758ce23f3f13dd63a005bc1bb4f2c` |
| SHA-256 vérifié | `5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0` |

La source compressée et versionnée est conservée dans
`data/sources/raw/ciqual_2025_FR_v1.0.xlsx.gz`. Le générateur refuse de produire
le corpus si son empreinte ne correspond pas au fichier officiel.

## Résultat

| Mesure | Nombre |
|---|---:|
| Références de formes alimentaires | 3 484 |
| Constituants par référence | 74 |
| Cellules nutritionnelles contrôlées | 257 816 |
| Valeurs mesurées | 151 981 |
| Bornes supérieures `< x` | 20 075 |
| Traces non quantifiées | 2 514 |
| Valeurs absentes | 83 246 |
| Entrées acceptées techniquement | 2 991 |
| Entrées à revoir | 493 |
| Entrées en quarantaine | 0 |
| Candidats de concepts canoniques | 2 212 |
| Groupes candidats avec plusieurs formes | 527 |

Les quatre états nutritionnels forment une partition exhaustive :
`151 981 + 20 075 + 2 514 + 83 246 = 3 484 × 74`.

## Sémantique nutritionnelle

- Une cellule vide ou `-` reste `not_available`.
- `traces` reste `trace`, sans valeur numérique.
- `< x` reste `less_than` avec `upper_bound = x`, jamais une estimation ponctuelle.
- Seule une valeur chiffrée source devient `measured`.
- Un zéro mesuré reste distinct d’une absence.

La source contient 40 bornes écrites `< 0`, réparties sur 14 références. Elles
sont conservées fidèlement, signalées par `nonpositive_upper_bound:*` et placent
la référence concernée en revue obligatoire.

## Réconciliation 2020→2025

Le journal `reconciliation-2020.json` rapproche d’abord les millésimes par code
aliment source. Il contient 3 666 décisions :

| Changement d’identité | Nombre |
|---|---:|
| Inchangé | 1 162 |
| Renommé | 665 |
| Taxonomie modifiée | 854 |
| Nom et taxonomie modifiés | 322 |
| Ajouté en 2025 | 481 |
| Retiré depuis 2020 | 182 |

| Comparaison des quatre macros | Nombre |
|---|---:|
| Inchangées | 935 |
| Modifiées | 2 068 |
| Non comparables (ajouts/retraits) | 663 |

Un retrait de Ciqual ne supprime jamais automatiquement un ingrédient Myko. Un
ajout reste une référence source candidate. Toute modification nutritionnelle
impose une nouvelle sélection de provenance avant publication.

## Grain et limites

Une référence Ciqual décrit une **forme alimentaire source**. Les lignes crues,
cuites, surgelées, les découpes et les aliments moyens restent donc distincts.
L’index `canonical-candidates.json` propose 2 212 frontières à réviser, sans les
transformer en ingrédients validés.

Ciqual ne fournit pas la conservation domestique, la saisonnalité, les allergènes
réglementaires par ingrédient, les substitutions culinaires, les unités ménagères
ni les relations aux produits commerciaux. Ces champs restent explicitement à
enrichir depuis leurs sources appropriées.

## Organisation et contrôle

- `manifest.json` : provenance, compteurs et règles de publication.
- `constituent-registry.json` : correspondance des 74 constituants source.
- `shards/part-0001.json` à `part-0009.json` : 3 484 références.
- `canonical-candidates.json` et `candidates/part-*.json` : propositions de frontières.
- `reconciliation-2020.json` et `reconciliation/part-*.json` : journal de migration.
- `build-ciqual-reference-corpus.mjs` : génération déterministe.
- `validate-ciqual-reference-corpus.mjs` : validation bloquante.

```bash
npm run ingredients:build
npm run ingredients:check
```

L’intégration dans Supabase reste bloquée tant que les frontières canoniques et
les champs métier manquants ne sont pas validés.
