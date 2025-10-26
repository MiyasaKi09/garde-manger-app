#!/usr/bin/env python3
"""
Script pour importer les ingrédients des recettes depuis RECETTES_PROPRES.csv
vers la base de données PostgreSQL Supabase.

Les recettes existent déjà (878 recettes), mais elles n'ont pas d'ingrédients (0).
Ce script va:
1. Parser le CSV RECETTES_PROPRES.csv
2. Matcher chaque ingrédient avec canonical_foods, cultivars ou archetypes
3. Générer les INSERT pour recipe_ingredients
"""

import csv
import json
import re
import os

def parse_ingredient_line(ingredient_str):
    """
    Parse une ligne d'ingrédient au format: "quantité|unité|nom"
    Ex: "60|g|flocon d'avoine" -> (60, 'g', "flocon d'avoine")
    """
    parts = ingredient_str.split('|')
    if len(parts) != 3:
        return None
    
    quantity_str, unit, name = parts
    
    # Convertir la quantité en nombre
    try:
        quantity = float(quantity_str.strip())
    except ValueError:
        quantity = 1.0  # Default si échec de parsing
    
    return {
        'quantity': quantity,
        'unit': unit.strip(),
        'name': name.strip().lower()
    }

def parse_ingredients_column(ingredients_str):
    """
    Parse la colonne Ingrédients qui contient une liste JSON-like d'ingrédients
    Ex: "60|g|flocon d'avoine","15|g|graine de chia"
    """
    if not ingredients_str or ingredients_str.strip() == '':
        return []
    
    # Extraire les ingrédients entre guillemets
    # Pattern pour capturer le contenu entre guillemets (en gérant les apostrophes à l'intérieur)
    pattern = r'"([^"]+)"'
    matches = re.findall(pattern, ingredients_str)
    
    ingredients = []
    for match in matches:
        ingredient = parse_ingredient_line(match)
        if ingredient:
            ingredients.append(ingredient)
    
    return ingredients

def normalize_ingredient_name(name):
    """
    Normalise le nom d'un ingrédient pour le matching
    """
    # Supprimer les accents courants
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ô': 'o', 'ö': 'o',
        'û': 'u', 'ù': 'u', 'ü': 'u',
        'î': 'i', 'ï': 'i',
        'ç': 'c'
    }
    
    normalized = name.lower().strip()
    for old, new in replacements.items():
        normalized = normalized.replace(old, new)
    
    return normalized

def main():
    csv_path = '/workspaces/garde-manger-app/tools/RECETTES_PROPRES.csv'
    output_sql_path = '/workspaces/garde-manger-app/tools/INSERT_INGREDIENTS_RECETTES.sql'
    
    print("🔍 Parsing RECETTES_PROPRES.csv...")
    
    recipes_data = []
    
    # Ouvrir avec newline='' pour gérer correctement les retours à la ligne
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                recipe_id = int(row['ID'].strip())
                recipe_name = row['Nom'].strip()
                portions_str = row['Portions'].strip()
                portions = int(portions_str) if portions_str and portions_str.isdigit() else 1
                ingredients_str = row['Ingrédients'].strip()
                
                ingredients = parse_ingredients_column(ingredients_str)
                
                recipes_data.append({
                    'id': recipe_id,
                    'name': recipe_name,
                    'portions': portions,
                    'ingredients': ingredients
                })
            except (ValueError, KeyError) as e:
                print(f"⚠️  Erreur parsing ligne (ID={row.get('ID', '?')}): {e}")
                continue
    
    print(f"✅ {len(recipes_data)} recettes parsées")
    
    # Compter le total d'ingrédients
    total_ingredients = sum(len(r['ingredients']) for r in recipes_data)
    print(f"📊 {total_ingredients} ingrédients au total")
    
    # Générer le SQL
    print("\n📝 Génération du SQL...")
    
    sql_lines = []
    sql_lines.append("-- Import des ingrédients pour les recettes")
    sql_lines.append("-- Généré automatiquement depuis RECETTES_PROPRES.csv")
    sql_lines.append("-- Total: {} recettes, {} ingrédients\n".format(len(recipes_data), total_ingredients))
    sql_lines.append("BEGIN;\n")
    
    # Créer une table temporaire pour le mapping
    sql_lines.append("""-- Table temporaire pour mapper les ingrédients aux IDs
CREATE TEMP TABLE temp_ingredient_mapping (
    ingredient_name TEXT PRIMARY KEY,
    canonical_food_id BIGINT,
    cultivar_id BIGINT,
    archetype_id BIGINT
);
""")
    
    # Collecter tous les noms d'ingrédients uniques
    all_ingredient_names = set()
    for recipe in recipes_data:
        for ing in recipe['ingredients']:
            all_ingredient_names.add(ing['name'])
    
    print(f"🔢 {len(all_ingredient_names)} ingrédients uniques trouvés")
    
    # Générer les INSERT pour recipe_ingredients
    sql_lines.append("\n-- Insertion des ingrédients par recette\n")
    
    for recipe in recipes_data:
        if not recipe['ingredients']:
            continue
        
        sql_lines.append(f"-- Recette #{recipe['id']}: {recipe['name']} ({len(recipe['ingredients'])} ingrédients)")
        
        for ing in recipe['ingredients']:
            # Échapper les apostrophes pour SQL
            ing_name_escaped = ing['name'].replace("'", "''")
            unit_escaped = ing['unit'].replace("'", "''")
            
            # Pour l'instant, on va essayer de matcher sur canonical_foods
            # Le matching plus sophistiqué sera fait dans le SQL
            sql_lines.append(f"""
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, archetype_id, quantity, unit)
SELECT 
    {recipe['id']},
    (SELECT id FROM canonical_foods WHERE LOWER(canonical_name) = '{ing_name_escaped}' LIMIT 1),
    (SELECT id FROM archetypes WHERE LOWER(name) = '{ing_name_escaped}' LIMIT 1),
    {ing['quantity']},
    '{unit_escaped}'
WHERE 
    (SELECT id FROM canonical_foods WHERE LOWER(canonical_name) = '{ing_name_escaped}') IS NOT NULL
    OR (SELECT id FROM archetypes WHERE LOWER(name) = '{ing_name_escaped}') IS NOT NULL;
""")
    
    sql_lines.append("\n-- Rapport final")
    sql_lines.append("""
DO $$
DECLARE
    total_inserted INT;
    total_expected INT := {};
BEGIN
    SELECT COUNT(*) INTO total_inserted FROM recipe_ingredients;
    
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ IMPORT INGRÉDIENTS TERMINÉ';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Total ingrédients insérés : %', total_inserted;
    RAISE NOTICE 'Total attendu             : %', total_expected;
    RAISE NOTICE 'Taux de matching          : %%%', ROUND(100.0 * total_inserted / total_expected, 1);
    RAISE NOTICE '========================================================';
END $$;
""".format(total_ingredients))
    
    sql_lines.append("\nCOMMIT;")
    
    # Écrire le fichier SQL
    with open(output_sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ SQL généré: {output_sql_path}")
    print(f"📊 Statistiques:")
    print(f"   - {len(recipes_data)} recettes")
    print(f"   - {total_ingredients} ingrédients")
    print(f"   - {len(all_ingredient_names)} ingrédients uniques")

if __name__ == '__main__':
    main()
