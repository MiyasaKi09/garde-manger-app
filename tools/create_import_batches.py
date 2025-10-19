#!/usr/bin/env python3
"""
Script pour exécuter l'import des recettes par batch via l'API PostgreSQL
"""

import re

def split_sql_into_batches(sql_file_path, batch_size=100):
    """Split le fichier SQL en batches gérables."""
    
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraire les VALUES
    match = re.search(r'INSERT INTO recipes.*?VALUES\s+(.*?)RETURNING', content, re.DOTALL)
    if not match:
        print("❌ Impossible de trouver les VALUES")
        return []
    
    values_section = match.group(1)
    
    # Split par les lignes individuelles
    lines = values_section.split('\n')
    recipe_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('--')]
    
    # Créer des batches
    batches = []
    for i in range(0, len(recipe_lines), batch_size):
        batch = recipe_lines[i:i+batch_size]
        # Nettoyer la dernière ligne du batch (retirer la virgule si nécessaire)
        if batch:
            batch[-1] = batch[-1].rstrip(',')
        
        batch_sql = "INSERT INTO recipes (name, description, prep_time_minutes, cook_time_minutes, servings, cooking_method, role, is_scalable_to_main)\nVALUES\n"
        batch_sql += ",\n".join(batch)
        batch_sql += ";"
        
        batches.append(batch_sql)
    
    return batches

def main():
    sql_file = "/workspaces/garde-manger-app/tools/import_recipes.sql"
    
    print("🔧 Préparation des batches d'import...")
    batches = split_sql_into_batches(sql_file, batch_size=100)
    
    print(f"\n📊 {len(batches)} batches créés")
    
    # Sauvegarder les batches
    for idx, batch in enumerate(batches, 1):
        output_file = f"/workspaces/garde-manger-app/tools/import_recipes_batch_{idx}.sql"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(batch)
        print(f"   ✅ Batch {idx} sauvegardé ({len(batch.split('\n'))} lignes)")
    
    print("\n✨ Batches prêts à être exécutés!")

if __name__ == "__main__":
    main()
