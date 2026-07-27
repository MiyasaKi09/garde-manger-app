# MYKO — Encyclopédie culinaire

Cette bibliothèque transforme la Bible et le Plan directeur Myko en **48 volumes** et **282 livres** exploitables par le site. Elle ne copie ni les ingrédients ni les recettes : elle les organise par vues éditoriales versionnées.

## Contrat d’édition

- Édition : `MYKO-ENC-1`
- Contrat : `myko-encyclopedia-v1`
- Volumes : 48
- Livres : 282
- Recettes canoniques indexées : 309
- Appartenances éditoriales : 1543
- Techniques extraites : 363
- Concepts alimentaires du snapshot F0 : 27
- Formes alimentaires du snapshot F0 : 31

Les mesures du site fusionnent ce snapshot versionné avec les agrégats live de Supabase. Les objets culinaires restent dans `catalog.*` et `culinary.*`.

## Volumes

| Code | Volume | Phase | Livres | Snapshot | Cible |
|---|---|---:|---:|---:|---:|
| [V00](volumes/V00.md) | Vision du projet | fondations | 6 | 6 | 6 |
| [V01](volumes/V01.md) | Bible des ingrédients | fondations | 17 | 27 | 4500 |
| [V02](volumes/V02.md) | Bible des techniques | fondations | 10 | 363 | 250 |
| [V03](volumes/V03.md) | Préparations intermédiaires | fondations | 8 | 116 | 250 |
| [V04](volumes/V04.md) | Sauces | fondations | 10 | 164 | 300 |
| [V05](volumes/V05.md) | Accompagnements | fondations | 10 | 122 | 300 |
| [V06](volumes/V06.md) | Desserts | fondations | 8 | 25 | 350 |
| [V07](volumes/V07.md) | Petit-déjeuners | fondations | 7 | 2 | 120 |
| [V08](volumes/V08.md) | Collations | fondations | 6 | 0 | 120 |
| [V09](volumes/V09.md) | Boissons | fondations | 6 | 8 | 150 |
| [V10](volumes/V10.md) | Catalogue maître des recettes | fondations | 5 | 309 | 2000 |
| [V11](volumes/V11.md) | Salades et crudités | rédaction | 5 | 11 | 90 |
| [V12](volumes/V12.md) | Soupes, veloutés et bouillons-repas | rédaction | 5 | 73 | 90 |
| [V13](volumes/V13.md) | Bœuf, veau et agneau | rédaction | 5 | 68 | 85 |
| [V14](volumes/V14.md) | Porc et charcuteries cuisinées | rédaction | 5 | 74 | 75 |
| [V15](volumes/V15.md) | Volaille et lapin | rédaction | 5 | 62 | 95 |
| [V16](volumes/V16.md) | Poissons | rédaction | 5 | 47 | 90 |
| [V17](volumes/V17.md) | Fruits de mer et coquillages | rédaction | 5 | 22 | 70 |
| [V18](volumes/V18.md) | Cuisine italienne | rédaction | 5 | 15 | 100 |
| [V19](volumes/V19.md) | Cuisines ibériques | rédaction | 5 | 17 | 75 |
| [V20](volumes/V20.md) | Cuisines grecque et levantine | rédaction | 5 | 18 | 85 |
| [V21](volumes/V21.md) | Cuisines du Maghreb | rédaction | 5 | 7 | 80 |
| [V22](volumes/V22.md) | Cuisines indienne et sud-asiatiques | rédaction | 5 | 23 | 105 |
| [V23](volumes/V23.md) | Cuisines d’Asie de l’Est et du Sud-Est | rédaction | 5 | 67 | 150 |
| [V24](volumes/V24.md) | Cuisines mexicaine et latino-américaines | rédaction | 5 | 24 | 100 |
| [V25](volumes/V25.md) | Cuisine végétarienne et légumineuses | rédaction | 5 | 103 | 150 |
| [V26](volumes/V26.md) | Sandwichs, tartines et wraps | rédaction | 5 | 5 | 80 |
| [V27](volumes/V27.md) | Pizzas, quiches et tartes salées | rédaction | 5 | 6 | 90 |
| [V28](volumes/V28.md) | Pâtes, nouilles et raviolis | rédaction | 5 | 77 | 120 |
| [V29](volumes/V29.md) | Riz, céréales et semoules | rédaction | 5 | 79 | 110 |
| [V30](volumes/V30.md) | Desserts français | rédaction | 5 | 18 | 120 |
| [V31](volumes/V31.md) | Desserts du monde | rédaction | 5 | 7 | 130 |
| [V32](volumes/V32.md) | Œufs et brunch salé | rédaction | 5 | 89 | 80 |
| [V33](volumes/V33.md) | Mijotés, braisés et plats en sauce | rédaction | 5 | 58 | 130 |
| [V34](volumes/V34.md) | Grillades, rôtis et cuissons au four | rédaction | 5 | 76 | 110 |
| [V35](volumes/V35.md) | Plats complets du quotidien | rédaction | 5 | 156 | 180 |
| [V36](volumes/V36.md) | Cuisine végétalienne | rédaction | 5 | 43 | 100 |
| [V37](volumes/V37.md) | Fermentations et conserves maison | rédaction | 5 | 48 | 60 |
| [V38](volumes/V38.md) | Cuisine économique et anti-gaspillage | rédaction | 5 | 4 | 120 |
| [V39](volumes/V39.md) | Cuisine festive et invités | rédaction | 5 | 126 | 100 |
| [V40](volumes/V40.md) | Assemblages et assiettes canoniques | rédaction | 5 | 120 | 150 |
| [V41](volumes/V41.md) | Menus | moteur | 7 | — | 72 |
| [V42](volumes/V42.md) | Planning | moteur | 7 | — | 40 |
| [V43](volumes/V43.md) | Données nutritionnelles | moteur | 5 | — | 60 |
| [V44](volumes/V44.md) | Stock | moteur | 5 | — | 25 |
| [V45](volumes/V45.md) | Courses | moteur | 5 | — | 25 |
| [V46](volumes/V46.md) | IA culinaire | moteur | 5 | — | 30 |
| [V47](volumes/V47.md) | Assurance qualité | moteur | 5 | — | 100 |

## Régénération

```bash
npm run encyclopedia:build
npm run encyclopedia:check
```

Le second appel échoue si le manifeste, l’index ou les livres générés ne correspondent plus aux sources.
