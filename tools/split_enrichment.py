#!/usr/bin/env python3
"""
Divise le gros fichier SQL d'enrichissement en batches de 100 recettes
"""

def split_sql_file():
    input_file = "/workspaces/garde-manger-app/tools/enrich_all_recipes.sql"
    output_prefix = "/workspaces/garde-manger-app/tools/enrich_batch_"
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extraire l'en-tête
    header = []
    content_start = 0
    for i, line in enumerate(lines):
        if line.strip() == "BEGIN;":
            header = lines[:i+1]
            content_start = i + 1
            break
    
    # Extraire le footer
    footer = ["", "COMMIT;", ""]
    
    # Diviser le contenu en batches
    content_lines = lines[content_start:]
    batch_size = 500  # Lignes par batch
    batch_num = 1
    current_batch = []
    
    for line in content_lines:
        if "COMMIT;" in line:
            continue  # Ignorer le COMMIT original
        
        current_batch.append(line)
        
        # Si on a atteint la taille du batch
        if len(current_batch) >= batch_size:
            # Écrire le batch
            output_file = f"{output_prefix}{batch_num:02d}.sql"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.writelines(header)
                f.write("\n")
                f.write(f"-- Batch {batch_num}\n")
                f.writelines(current_batch)
                f.writelines(footer)
            
            print(f"✅ Batch {batch_num} créé : {len(current_batch)} lignes")
            batch_num += 1
            current_batch = []
    
    # Écrire le dernier batch s'il reste des lignes
    if current_batch:
        output_file = f"{output_prefix}{batch_num:02d}.sql"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.writelines(header)
            f.write("\n")
            f.write(f"-- Batch {batch_num}\n")
            f.writelines(current_batch)
            f.writelines(footer)
        
        print(f"✅ Batch {batch_num} créé : {len(current_batch)} lignes")
    
    print(f"\n🎉 Total : {batch_num} batches créés")


if __name__ == "__main__":
    split_sql_file()
