#!/usr/bin/env python3
"""
Script final pour importer les recettes - version nettoyée
"""

import re

# Lire le fichier batch pour recette.txt
filepath = "/workspaces/garde-manger-app/supabase/batch pour recette.txt"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Extraire uniquement les vraies recettes
lines = content.split('\n')
recipes = []

for line in lines:
    line = line.strip()
    
    # Ignorer les lignes vides, titres, notes
    if not line or line.startswith('---') or line.startswith('Liste de') or 'objectif' in line.lower() or 'note:' in line.lower():
        continue
    
    # Retirer les numéros
    recipe_name = re.sub(r'^\d+\.\s*', '', line)
    
    if recipe_name and len(recipe_name) > 3 and '...' not in recipe_name:
        recipes.append(recipe_name)

print(f"📊 Nombre de vraies recettes trouvées : {len(recipes)}")
print("\n✨ Voici les 10 dernières :")
for recipe in recipes[-10:]:
    print(f"   - {recipe}")

# Compter par lot
for i in range(0, min(len(recipes), 100), 20):
    batch = recipes[i:i+20]
    print(f"\n--- Lot {i//20 + 1} (recettes {i+1} à {i+len(batch)}) ---")
    for r in batch[:5]:
        print(f"   {r}")
    if len(batch) > 5:
        print(f"   ... et {len(batch) - 5} autres")
