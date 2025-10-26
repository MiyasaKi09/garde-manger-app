#!/usr/bin/env python3
"""
Version 3 - ULTRA optimisée avec un seul INSERT massif
Génère un SQL de ~500 lignes au lieu de 4500
"""

import csv
import re

def parse_ingredient_line(ingredient_str):
    parts = ingredient_str.split('|')
    if len(parts) != 3:
        return None
    
    quantity_str, unit, name = parts
    
    try:
        quantity = float(quantity_str.strip())
    except ValueError:
        quantity = 1.0
    
    return {
        'quantity': quantity,
        'unit': unit.strip(),
        'name': name.strip().lower()
    }

def parse_ingredients_column(ingredients_str):
    if not ingredients_str or ingredients_str.strip() == '':
        return []
    
    pattern = r'"([^"]+)"'
    matches = re.findall(pattern, ingredients_str)
    
    ingredients = []
    for match in matches:
        ingredient = parse_ingredient_line(match)
        if ingredient:
            ingredients.append(ingredient)
    
    return ingredients

def escape_sql(text):
    return text.replace("'", "''")

def main():
    csv_path = '/workspaces/garde-manger-app/tools/RECETTES_PROPRES.csv'
    output_sql_path = '/workspaces/garde-manger-app/tools/INSERT_INGREDIENTS_RECETTES_V3.sql'
    
    print("🔍 Parsing RECETTES_PROPRES.csv...")
    
    # Regrouper les doublons
    ingredients_dict = {}
    recipes_count = 0
    total_raw = 0
    
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                recipe_id = int(row['ID'].strip())
                ingredients_str = row['Ingrédients'].strip()
                
                ingredients = parse_ingredients_column(ingredients_str)
                
                for ing in ingredients:
                    total_raw += 1
                    key = (recipe_id, ing['name'], ing['unit'])
                    
                    if key in ingredients_dict:
                        ingredients_dict[key]['quantity'] += ing['quantity']
                    else:
                        ingredients_dict[key] = {
                            'recipe_id': recipe_id,
                            'name': ing['name'],
                            'quantity': ing['quantity'],
                            'unit': ing['unit']
                        }
                
                recipes_count += 1
                
            except (ValueError, KeyError) as e:
                continue
    
    all_ingredients_data = list(ingredients_dict.values())
    
    print(f"✅ {recipes_count} recettes")
    print(f"📊 {len(all_ingredients_data)} ingrédients uniques (fusion: {total_raw - len(all_ingredients_data)} doublons)")
    
    # Générer SQL ULTRA compact
    sql_lines = []
    sql_lines.append("-- Import ingrédients recettes (version compacte)")
    sql_lines.append(f"-- {recipes_count} recettes, {len(all_ingredients_data)} ingrédients\n")
    sql_lines.append("BEGIN;\n")
    
    # Un seul gros INSERT avec CTE
    sql_lines.append("""-- Insertion directe avec mapping en une seule requête
WITH ingredients_data (recipe_id, ingredient_name, quantity, unit) AS (
    VALUES""")
    
    # Générer toutes les lignes VALUES
    values_lines = []
    for ing in all_ingredients_data:
        values_lines.append(
            f"        ({ing['recipe_id']}, '{escape_sql(ing['name'])}', {ing['quantity']}, '{escape_sql(ing['unit'])}')"
        )
    
    sql_lines.append(',\n'.join(values_lines))
    sql_lines.append(")")
    
    # Faire l'INSERT final avec le matching
    sql_lines.append("""
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, archetype_id, quantity, unit)
SELECT 
    id.recipe_id,
    cf.id AS canonical_food_id,
    a.id AS archetype_id,
    id.quantity,
    id.unit
FROM 
    ingredients_data id
    INNER JOIN recipes r ON r.id = id.recipe_id  -- S'assurer que la recette existe
    LEFT JOIN canonical_foods cf ON LOWER(cf.canonical_name) = LOWER(id.ingredient_name)
    LEFT JOIN archetypes a ON LOWER(a.name) = LOWER(id.ingredient_name)
WHERE 
    (cf.id IS NOT NULL OR a.id IS NOT NULL);  -- S'assurer que l'ingrédient est matché
""")
    
    # Rapport
    sql_lines.append("""
-- Rapport
DO $$
DECLARE
    v_inserted INT;
BEGIN
    SELECT COUNT(*) INTO v_inserted FROM recipe_ingredients;
    RAISE NOTICE '✅ % ingrédients insérés', v_inserted;
END $$;

COMMIT;
""")
    
    # Écrire
    with open(output_sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ SQL généré: {output_sql_path}")
    
    # Compter les lignes
    line_count = len(sql_lines) + len(all_ingredients_data)
    print(f"📏 ~{line_count} lignes (vs 4635 précédemment)")

if __name__ == '__main__':
    main()
