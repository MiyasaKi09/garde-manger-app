#!/usr/bin/env python3
"""
Script pour extraire les recettes restantes (batch 3+)
qui ne sont pas dans batch 1 ou batch 2
"""

import csv

def load_recipe_ids(filename):
    """Charge les IDs des recettes d'un fichier CSV"""
    ids = set()
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ids.add(int(row['id']))
    return ids

def main():
    # Charger les IDs des batches déjà traités
    print("📖 Chargement des batches existants...")
    batch1_ids = load_recipe_ids('recipes_300.csv')
    batch2_ids = load_recipe_ids('recipes_300_batch2.csv')
    processed_ids = batch1_ids | batch2_ids
    
    print(f"   Batch 1: {len(batch1_ids)} recettes")
    print(f"   Batch 2: {len(batch2_ids)} recettes")
    print(f"   Total traité: {len(processed_ids)} recettes")
    
    # Charger toutes les recettes
    print("\n📂 Chargement de toutes les recettes...")
    all_recipes = []
    with open('../supabase/exports/latest/csv/recipes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            recipe_id = int(row['id'])
            if recipe_id not in processed_ids:
                all_recipes.append({
                    'id': recipe_id,
                    'name': row['name'],
                    'role': row['role']
                })
    
    print(f"   Recettes restantes: {len(all_recipes)}")
    
    # Trier par ID
    all_recipes.sort(key=lambda x: x['id'])
    
    # Écrire le fichier batch 3
    output_file = 'recipes_batch3_remaining.csv'
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name', 'role'])
        writer.writeheader()
        writer.writerows(all_recipes)
    
    print(f"\n✅ Fichier créé: {output_file}")
    print(f"📊 {len(all_recipes)} recettes à enrichir")
    
    # Afficher quelques exemples
    print("\n🔍 Premiers exemples:")
    for recipe in all_recipes[:5]:
        print(f"   - [{recipe['id']}] {recipe['name']} ({recipe['role']})")
    
    print("\n🔍 Derniers exemples:")
    for recipe in all_recipes[-5:]:
        print(f"   - [{recipe['id']}] {recipe['name']} ({recipe['role']})")

if __name__ == '__main__':
    main()
