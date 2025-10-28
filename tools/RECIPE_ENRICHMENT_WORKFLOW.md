# Workflow d'Enrichissement des Recettes

## Statut Actuel

- **Fichier existant**: 469 recettes avec ingrédients
- **Base de données**: 878 recettes totales
- **Recettes à enrichir**: ~423 recettes (approximativement)
- **Problème**: Connexion réseau à Supabase instable depuis l'environnement

## Stratégie Proposée

### Phase 1: Extraction des Données (SQL Direct)

Exécuter dans Supabase SQL Editor:

```sql
-- Liste des recettes SANS ingrédients
SELECT
    r.id,
    r.name,
    COALESCE(r.servings, 4) as servings
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id, r.name, r.servings
HAVING COUNT(ri.id) = 0
ORDER BY r.id;
```

Exporter le résultat en CSV.

### Phase 2: Enrichissement par Batch avec WebSearch

Pour chaque recette:

1. **Recherche WebSearch** (2-3 sources)
   ```
   "recette [NOM] traditionnel ingrédients quantités [PORTIONS] personnes"
   ```

2. **Formalisation au format requis**:
   ```
   ID,Nom,Portions,"quantité1|unité1|nom1","quantité2|unité2|nom2",...
   ```

3. **Exemples de normalisation**:
   - Quantités: nombres décimaux avec point (0.5, 1.5, etc.)
   - Unités normalisées: g, kg, ml, L, pièce, cuillère à soupe, cuillère à café, gousse, pincée, tranche, bouquet
   - Noms d'ingrédients: utiliser les noms de la base canonical_foods quand possible

### Phase 3: Scripts d'Aide

#### Script 1: Générateur de Requêtes WebSearch

```python
#!/usr/bin/env python3
"""Génère les requêtes WebSearch pour un batch de recettes."""

recipes = [
    {"id": 9400, "name": "Fumet de poisson", "servings": 8},
    {"id": 9401, "name": "Blanquette de veau", "servings": 6},
    # ... etc
]

for recipe in recipes:
    query = f'recette {recipe["name"]} traditionnelle ingrédients quantités {recipe["servings"]} personnes'
    print(f"# ID {recipe['id']}: {recipe['name']}")
    print(f"WebSearch: {query}")
    print()
```

#### Script 2: Validateur de Format

```python
#!/usr/bin/env python3
"""Valide le format des lignes de recettes enrichies."""

import re

def validate_recipe_line(line):
    """Valide une ligne de recette."""
    # Format: ID,Nom,Portions,"ing1","ing2",...
    parts = line.split(',', 3)

    if len(parts) < 4:
        return False, "Pas assez de colonnes"

    try:
        recipe_id = int(parts[0])
    except ValueError:
        return False, "ID invalide"

    try:
        portions = int(parts[2])
    except ValueError:
        return False, "Portions invalides"

    # Vérifier format des ingrédients: "quantité|unité|nom"
    ingredients = re.findall(r'"([^"]+)"', parts[3])

    for ing in ingredients:
        if ing.count('|') != 2:
            return False, f"Format ingrédient invalide: {ing}"

    return True, f"OK - {len(ingredients)} ingrédients"

# Test
test_line = '9400,Fumet de poisson,8,"1000|g|arêtes de poisson","2|pièce|oignon"'
valid, msg = validate_recipe_line(test_line)
print(f"{valid}: {msg}")
```

### Phase 4: Consolidation Finale

Une fois toutes les recettes enrichies:

```python
#!/usr/bin/env python3
"""Fusionne le fichier existant avec les nouvelles recettes."""

import csv

existing = {}  # Charger LISTE_TOUTES_RECETTES_NORMALISEE (2).txt
enriched = {}  # Charger les nouvelles recettes

# Fusionner et trier par ID
all_recipes = {**existing, **enriched}

with open('LISTE_TOUTES_RECETTES_COMPLETE.txt', 'w', encoding='utf-8') as f:
    f.write('ID,Nom,Portions,Ingrédients\\n')
    for recipe_id in sorted(all_recipes.keys()):
        f.write(all_recipes[recipe_id])
```

## Format de Référence

### Exemple 1: Fumet de poisson (ID 9400, 8 portions)

Recherches effectuées:
- Source 1: Philippe Etchebest
- Source 2: Papilles et Pupilles
- Source 3: La Toque d'Or

Ligne formatée:
```
9400,Fumet de poisson,8,"1000|g|arêtes de poisson","2|pièce|oignon","1|pièce|carotte","2|pièce|poireau","100|ml|vin blanc","2|L|eau","1|bouquet|bouquet garni","10|pièce|grain de poivre","40|g|beurre"
```

### Exemple 2: Blanquette de veau (ID ?, 6 portions)

Recherches effectuées:
- Source 1: Julie Andrieu
- Source 2: 750g.com
- Source 3: Meilleur du Chef

Ligne formatée:
```
?,Blanquette de veau,6,"1600|g|veau","6|pièce|carotte","2|pièce|oignon","4|pièce|poireau","750|g|champignon de Paris","2.5|L|bouillon de volaille","60|g|beurre","60|g|farine","200|ml|crème fraîche","2|pièce|jaune d'œuf","2|cuillère à soupe|jus de citron","3|bouquet|bouquet garni","1|pincée|sel","1|pincée|poivre"
```

## Unités Normalisées

| Type | Unité Normalisée | Variantes Acceptées |
|------|------------------|---------------------|
| Masse | g | gramme, grammes, gr |
| Masse | kg | kilo, kilogramme |
| Volume | ml | millilitre, millilitres |
| Volume | L | litre, litres, l |
| Volume | cl | centilitre, centilitres |
| Volume | cuillère à soupe | c. à soupe, càs, cs |
| Volume | cuillère à café | c. à café, càc, cc |
| Quantité | pièce | pièces, pc, unité, unités |
| Quantité | tranche | tranches |
| Quantité | gousse | gousses |
| Quantité | bouquet | - |
| Quantité | pincée | pincées |

## Noms d'Ingrédients à Utiliser

Consulter la table `canonical_foods` pour les noms standardisés.

Exemples courants:
- "farine de blé" (pas juste "farine")
- "huile d'olive" (pas juste "huile")
- "poivre noir" (préciser le type)
- "sel fin" ou "sel de mer"
- "œuf de poule" (préciser)
- "lait de vache" ou "lait végétal" (préciser)
- "tomate fraîche" vs "tomate pelée en conserve"

## Procédure de Travail Recommandée

### Batch de 10 recettes:

1. Copier 10 recettes dans un fichier temporaire
2. Pour chaque recette:
   - Faire 2-3 WebSearch
   - Noter les ingrédients et quantités
   - Formater la ligne selon le template
   - Valider avec le script validateur
3. Ajouter au fichier de sortie
4. Passer au batch suivant

### Organisation par Catégorie:

Traiter par type de recettes pour plus d'efficacité:
- Soupes et veloutés (quantités liquides)
- Viandes et poissons (portions de protéines)
- Pâtisseries (précision des quantités)
- Sauces et condiments (petites quantités)
- Plats mijotés (légumes + viande)

## Problèmes Courants et Solutions

### Problème 1: Recette introuvable
**Solution**: Chercher une recette similaire ou équivalente dans la même cuisine

### Problème 2: Quantités imprécises ("une pincée", "au goût")
**Solution**: Utiliser des valeurs standards:
- Pincée = 0.5 g ou "1|pincée|sel"
- Au goût = quantité minimale standard

### Problème 3: Portions différentes
**Solution**: Ajuster proportionnellement les quantités

### Problème 4: Ingrédient inconnu dans canonical_foods
**Solution**: Utiliser le nom le plus proche ou descriptif

## Fichiers de Sortie

1. **LISTE_TOUTES_RECETTES_COMPLETE.txt** - Fichier final avec 878 recettes
2. **RAPPORT_ENRICHISSEMENT.md** - Rapport détaillé
3. **RECETTES_PROBLEMATIQUES.txt** - Recettes non trouvées ou problématiques

## Métriques de Qualité

- [ ] Toutes les recettes ont au moins 3 ingrédients
- [ ] Les portions sont cohérentes (1-12 généralement)
- [ ] Les quantités sont réalistes
- [ ] Les unités sont normalisées
- [ ] Format validé par le script
- [ ] Pas de guillemets manquants
- [ ] Pas de virgules dans les ingrédients
