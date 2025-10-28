#!/usr/bin/env python3
"""
Analyse le fichier existant pour comprendre sa structure
et préparer l'enrichissement
"""

import csv
import re
from collections import defaultdict

EXISTING_FILE = '/workspaces/garde-manger-app/LISTE_TOUTES_RECETTES_NORMALISEE (2).txt'

def analyze_file():
    """Analyse le fichier existant."""
    print("=" * 80)
    print("📊 ANALYSE DU FICHIER EXISTANT")
    print("=" * 80)

    recipes = []
    ingredient_stats = defaultdict(int)

    with open(EXISTING_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            recipe_id = int(row['ID'])
            name = row['Nom']
            portions = int(row['Portions']) if row['Portions'] else 4
            ingredients_str = row['Ingrédients']

            # Compter les ingrédients
            pattern = r'"([^"]+)"'
            ingredients = re.findall(pattern, ingredients_str)
            ingredient_count = len(ingredients)

            recipes.append({
                'id': recipe_id,
                'name': name,
                'portions': portions,
                'ingredient_count': ingredient_count
            })

            ingredient_stats[ingredient_count] += 1

    print(f"\n✅ Total recettes analysées: {len(recipes)}")
    print(f"\n📈 Statistiques d'ingrédients:")

    for count in sorted(ingredient_stats.keys()):
        print(f"   {count:2d} ingrédients: {ingredient_stats[count]:3d} recettes")

    print(f"\n🔍 Recettes avec le plus d'ingrédients:")
    top_recipes = sorted(recipes, key=lambda x: x['ingredient_count'], reverse=True)[:10]

    for r in top_recipes:
        print(f"   ID {r['id']:5d} | {r['ingredient_count']:2d} ingr. | {r['name']}")

    print(f"\n📋 Plage d'IDs:")
    ids = [r['id'] for r in recipes]
    print(f"   Min ID: {min(ids)}")
    print(f"   Max ID: {max(ids)}")
    print(f"   Total: {len(ids)} recettes")

    # Identifier les gaps
    all_ids = set(range(min(ids), max(ids) + 1))
    existing_ids = set(ids)
    missing_ids = sorted(all_ids - existing_ids)

    if missing_ids:
        print(f"\n⚠️  IDs manquants dans le fichier: {len(missing_ids)}")
        if len(missing_ids) <= 50:
            print(f"   {missing_ids}")
        else:
            print(f"   Premiers: {missing_ids[:20]}")
            print(f"   Derniers: {missing_ids[-20:]}")

    # Exemples de format
    print(f"\n📝 Exemples de format d'ingrédients:")
    for i, r in enumerate(recipes[:5], 1):
        print(f"\n   {i}. {r['name']} ({r['portions']} portions, {r['ingredient_count']} ingrédients)")

    return recipes

if __name__ == '__main__':
    analyze_file()
