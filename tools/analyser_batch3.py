#!/usr/bin/env python3
"""
Analyse les recettes LOW du batch 3 pour identifier les catégories
"""

import re
from collections import defaultdict

# Lire les recettes LOW
with open('/tmp/batch3_temp.sql', 'r', encoding='utf-8') as f:
    content = f.read()

low_recipes = []
for line in content.split('\n'):
    if line.startswith('-- [LOW]'):
        # Extraire le nom de la recette
        match = re.search(r'\[LOW\] (.+?) - NON_RECONNU', line)
        if match:
            low_recipes.append(match.group(1))

print(f"📊 Total recettes LOW: {len(low_recipes)}\n")

# Catégorisation
categories = defaultdict(list)

for recipe in low_recipes:
    recipe_lower = recipe.lower()
    
    # Pièces de bœuf
    if any(word in recipe_lower for word in ['faux-filet', 'rumsteck', 'bavette', 'aloyau', 'onglet', 'hampe', 'tournedos', 'araignée', 'poire', 'merlan', 'pavé de bœuf', 'côte de bœuf', 'filet de bœuf']):
        categories['Pièces de bœuf'].append(recipe)
    # Bœuf mijoté/sauté
    elif 'bœuf' in recipe_lower or 'boeuf' in recipe_lower:
        if 'pot-au-feu' in recipe_lower:
            categories['Classiques bœuf'].append(recipe)
        else:
            categories['Bœuf mijoté/sauces'].append(recipe)
    
    # Veau
    elif any(word in recipe_lower for word in ['veau', 'escalope', 'côte de veau', 'grenadin']):
        if 'escalope' in recipe_lower or 'côte' in recipe_lower or 'grenadin' in recipe_lower or 'filet de veau' in recipe_lower:
            categories['Pièces de veau'].append(recipe)
        else:
            categories['Veau mijoté'].append(recipe)
    
    # Agneau
    elif 'agneau' in recipe_lower:
        if 'carré' in recipe_lower or 'épaule' in recipe_lower or 'gigot' in recipe_lower:
            categories['Pièces d\'agneau'].append(recipe)
        elif 'tourte' in recipe_lower:
            categories['Tourtes'].append(recipe)
        else:
            categories['Agneau mijoté'].append(recipe)
    
    # Porc
    elif 'porc' in recipe_lower:
        if any(word in recipe_lower for word in ['côte', 'filet', 'travers', 'jarret', 'palette', 'rôti']):
            categories['Pièces de porc'].append(recipe)
        elif 'tourte' in recipe_lower:
            categories['Tourtes'].append(recipe)
        else:
            categories['Porc mijoté'].append(recipe)
    
    # Volaille
    elif any(word in recipe_lower for word in ['poulet', 'dinde', 'canard']):
        if 'tourte' in recipe_lower:
            categories['Tourtes'].append(recipe)
        else:
            categories['Volaille'].append(recipe)
    
    # Poissons
    elif any(word in recipe_lower for word in ['poisson', 'saumon', 'thon', 'truite', 'dorade', 'bar', 'cabillaud', 'lieu', 'merlu', 'colin']):
        if 'tourte' in recipe_lower:
            categories['Tourtes'].append(recipe)
        else:
            categories['Poissons'].append(recipe)
    
    # Légumes
    elif any(word in recipe_lower for word in ['légumes', 'tomates', 'courgettes', 'aubergines', 'champignons', 'haricots', 'lentilles', 'pois', 'chou']):
        if 'tourte' in recipe_lower:
            categories['Tourtes'].append(recipe)
        else:
            categories['Légumes/Végétarien'].append(recipe)
    
    # Potages
    elif 'potage' in recipe_lower:
        categories['Potages'].append(recipe)
    
    # Vinaigrettes et sauces
    elif 'vinaigrette' in recipe_lower or 'sauce' in recipe_lower or 'bouillon' in recipe_lower or 'fond' in recipe_lower or 'fumet' in recipe_lower:
        categories['Sauces/Vinaigrettes/Bouillons'].append(recipe)
    
    # Autres
    else:
        categories['Autres'].append(recipe)

# Afficher les catégories
for cat, recipes in sorted(categories.items()):
    print(f"\n{'='*60}")
    print(f"📁 {cat} ({len(recipes)} recettes)")
    print('='*60)
    for recipe in sorted(recipes)[:10]:  # Afficher max 10 exemples
        print(f"  • {recipe}")
    if len(recipes) > 10:
        print(f"  ... et {len(recipes) - 10} autres")

print(f"\n{'='*60}")
print(f"📊 RÉSUMÉ")
print('='*60)
for cat, recipes in sorted(categories.items(), key=lambda x: -len(x[1])):
    print(f"{len(recipes):3d} - {cat}")
