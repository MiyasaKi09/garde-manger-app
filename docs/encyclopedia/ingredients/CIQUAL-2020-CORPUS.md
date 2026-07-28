# Corpus industriel des ingrédients — CIQUAL 2020

> **Archive historique.** Ce snapshot a été remplacé par le
> [corpus Ciqual 2025](CIQUAL-2025-CORPUS.md). Ses chiffres sont conservés pour
> documenter le point de départ de la réconciliation.

Ce lot matérialise **3 185 références alimentaires réelles** issues de la Table Ciqual 2020. Il remplace la rédaction manuelle fiche par fiche pour les domaines que Ciqual couvre effectivement : identité de la référence, taxonomie source et nutrition par 100 g.

## Résultat

| Mesure | Nombre |
|---|---:|
| Références de formes alimentaires | 3 185 |
| Profils nutritionnels présents | 3 178 |
| Entrées acceptées par les contrôles techniques | 2 701 |
| Entrées à revoir | 483 |
| Entrées en quarantaine | 1 |
| Candidats de concepts canoniques | 2 081 |
| Groupes candidats avec plusieurs formes | 453 |

Une référence CIQUAL décrit une **forme alimentaire**. Elle ne devient pas automatiquement un ingrédient canonique Myko. Par exemple, les lignes crues, cuites, surgelées ou détaillées par découpe restent des formes sources ; l’index `canonical-candidates.json` propose leurs regroupements sans les publier.

## Organisation

- `manifest.json` : contrat, provenance, licence, volumes et règles de publication.
- `shards/part-0001.json` à `part-0008.json` : 3 185 entrées, une seule fois chacune.
- `canonical-candidates.json` et `candidates/part-*.json` : 2 081 propositions de frontières conceptuelles.
- `scripts/data/foods/validate-ciqual-reference-corpus.mjs` : contrôle reproductible.

Chaque entrée possède un identifiant `CIQ-xxxxx`, le code source, le nom français, sa clé normalisée, la taxonomie Ciqual, les descripteurs de forme détectés, son profil nutritionnel et un état qualité.

## Qualité

| État | Règle | Nombre |
|---|---|---:|
| `accepted` | Taxonomie présente, nutrition présente, énergie/protéines/glucides/lipides renseignés et valeurs dans les bornes | 2 701 |
| `review` | Au moins un champ requis manque ; la référence reste consultable mais non publiable automatiquement | 483 |
| `quarantined` | Valeur hors bornes physiques ; aucune utilisation en calcul ou publication | 1 |

Anomalies mesurées :

| Anomalie | Nombre |
|---|---:|
| Énergie manquante | 107 |
| Glucides manquants | 410 |
| Protéines manquantes | 24 |
| Lipides manquants | 30 |
| Profil nutritionnel absent | 7 |
| Taxonomie absente | 45 |
| Énergie hors borne | 1 |

La ligne `CIQ-42501` (« Poudre cacaotée pour bébé ») porte 1 680 kcal/100 g dans la base héritée et reste explicitement en quarantaine.

## Limites assumées

Ciqual ne fournit pas conservation, saisonnalité, allergènes réglementaires, compatibilités, substitutions, unités ménagères ni relations aux produits commerciaux. Ces champs ne sont donc pas inventés. Ils seront enrichis par lots depuis les sources appropriées après validation des frontières concept/forme.

Le snapshot est le millésime **2020-07-07** déjà présent dans Myko. Sa
réconciliation avec **Ciqual 2025** (DOI `10.57745/RDMHWY`) est désormais
matérialisée dans le corpus actif.

## Contrôle

```bash
npm run ingredients:check
npm test
```

L’intégration produit reste bloquée : ce corpus augmente massivement l’inventaire source, pas le nombre d’ingrédients validés.
