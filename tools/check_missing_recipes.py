#!/usr/bin/env python3
"""
Vérifier quelles recettes du CSV n'existent pas dans la base
et générer un script pour les créer
"""

import csv
import re

def parse_ingredients_column(ingredients_str):
    if not ingredients_str or ingredients_str.strip() == '':
        return []
    
    pattern = r'"([^"]+)"'
    matches = re.findall(pattern, ingredients_str)
    return len(matches)

def escape_sql(text):
    return text.replace("'", "''")

def main():
    csv_path = '/workspaces/garde-manger-app/tools/RECETTES_PROPRES.csv'
    output_sql_path = '/workspaces/garde-manger-app/tools/CREATE_MISSING_RECIPES.sql'
    
    print("🔍 Parsing RECETTES_PROPRES.csv...")
    
    recipes_data = []
    
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                recipe_id = int(row['ID'].strip())
                recipe_name = row['Nom'].strip()
                portions_str = row['Portions'].strip()
                portions = int(portions_str) if portions_str and portions_str.isdigit() else 4
                ingredients_str = row['Ingrédients'].strip()
                ingredient_count = parse_ingredients_column(ingredients_str)
                
                recipes_data.append({
                    'id': recipe_id,
                    'name': recipe_name,
                    'portions': portions,
                    'ingredient_count': ingredient_count
                })
                
            except (ValueError, KeyError) as e:
                continue
    
    print(f"✅ {len(recipes_data)} recettes dans le CSV")
    
    # Générer le SQL pour créer les recettes manquantes
    sql_lines = []
    sql_lines.append("-- Vérifier et créer les recettes manquantes")
    sql_lines.append(f"-- Total recettes dans CSV: {len(recipes_data)}\n")
    sql_lines.append("BEGIN;\n")
    
    # Créer une table temporaire avec les IDs du CSV
    sql_lines.append("""-- Table temporaire avec les IDs de recettes du CSV
CREATE TEMP TABLE csv_recipe_ids (recipe_id INT PRIMARY KEY);
""")
    
    sql_lines.append("\nINSERT INTO csv_recipe_ids (recipe_id) VALUES")
    recipe_id_values = [f"    ({r['id']})" for r in recipes_data]
    sql_lines.append(',\n'.join(recipe_id_values) + ';')
    
    # Trouver les recettes manquantes
    sql_lines.append("""
-- Rapport: Recettes manquantes
DO $$
DECLARE
    missing_count INT;
    existing_count INT;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM csv_recipe_ids csv
    WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id = csv.recipe_id);
    
    SELECT COUNT(*) INTO existing_count
    FROM csv_recipe_ids csv
    WHERE EXISTS (SELECT 1 FROM recipes r WHERE r.id = csv.recipe_id);
    
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Rapport: Recettes CSV vs Base de données';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Recettes dans CSV        : %', (SELECT COUNT(*) FROM csv_recipe_ids);
    RAISE NOTICE 'Recettes existantes      : %', existing_count;
    RAISE NOTICE 'Recettes manquantes      : %', missing_count;
    RAISE NOTICE '========================================================';
    
    IF missing_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'IDs des recettes manquantes (20 premiers):';
        FOR i IN (
            SELECT csv.recipe_id
            FROM csv_recipe_ids csv
            WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id = csv.recipe_id)
            ORDER BY csv.recipe_id
            LIMIT 20
        )
        LOOP
            RAISE NOTICE '  • Recette ID: %', i.recipe_id;
        END LOOP;
    END IF;
END $$;

DROP TABLE csv_recipe_ids;

COMMIT;
""")
    
    # Écrire le fichier
    with open(output_sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ SQL généré: {output_sql_path}")
    print(f"   Ce script va identifier les recettes manquantes")

if __name__ == '__main__':
    main()
