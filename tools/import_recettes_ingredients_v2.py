#!/usr/bin/env python3
"""
Version optimisée pour importer les ingrédients des recettes.
Utilise une approche par batch avec un seul INSERT massif.
"""

import csv
import json
import re

def parse_ingredient_line(ingredient_str):
    """Parse une ligne d'ingrédient au format: "quantité|unité|nom"""
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
    """Parse la colonne Ingrédients"""
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
    """Échapper les apostrophes pour SQL"""
    return text.replace("'", "''")

def main():
    csv_path = '/workspaces/garde-manger-app/tools/RECETTES_PROPRES.csv'
    output_sql_path = '/workspaces/garde-manger-app/tools/INSERT_INGREDIENTS_RECETTES_V2.sql'
    
    print("🔍 Parsing RECETTES_PROPRES.csv...")
    
    # Utiliser un dictionnaire pour regrouper les doublons
    # Clé: (recipe_id, ingredient_name, unit)
    ingredients_dict = {}
    recipes_count = 0
    total_raw_ingredients = 0
    
    with open(csv_path, 'r', encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                recipe_id = int(row['ID'].strip())
                ingredients_str = row['Ingrédients'].strip()
                
                ingredients = parse_ingredients_column(ingredients_str)
                
                for ing in ingredients:
                    total_raw_ingredients += 1
                    # Créer une clé unique pour regrouper les doublons
                    key = (recipe_id, ing['name'], ing['unit'])
                    
                    if key in ingredients_dict:
                        # Additionner les quantités si l'ingrédient existe déjà
                        ingredients_dict[key]['quantity'] += ing['quantity']
                    else:
                        # Ajouter le nouvel ingrédient
                        ingredients_dict[key] = {
                            'recipe_id': recipe_id,
                            'name': ing['name'],
                            'quantity': ing['quantity'],
                            'unit': ing['unit']
                        }
                
                recipes_count += 1
                
            except (ValueError, KeyError) as e:
                print(f"⚠️  Erreur parsing ligne (ID={row.get('ID', '?')}): {e}")
                continue
    
    # Convertir le dictionnaire en liste
    all_ingredients_data = list(ingredients_dict.values())
    
    print(f"✅ {recipes_count} recettes parsées")
    print(f"📊 {total_raw_ingredients} ingrédients bruts")
    print(f"📊 {len(all_ingredients_data)} ingrédients après fusion des doublons ({total_raw_ingredients - len(all_ingredients_data)} doublons éliminés)")
    
    # Collecter les noms uniques
    unique_names = set(ing['name'] for ing in all_ingredients_data)
    print(f"🔢 {len(unique_names)} ingrédients uniques")
    
    # Générer le SQL optimisé
    print("\n📝 Génération du SQL optimisé...")
    
    sql_lines = []
    sql_lines.append("-- Import optimisé des ingrédients pour les recettes")
    sql_lines.append(f"-- Total: {recipes_count} recettes, {len(all_ingredients_data)} ingrédients")
    sql_lines.append(f"-- Ingrédients uniques: {len(unique_names)}\n")
    sql_lines.append("BEGIN;\n")
    
    # Créer une temp table avec tous les ingrédients
    sql_lines.append("""-- Table temporaire avec tous les ingrédients à insérer
CREATE TEMP TABLE temp_recipe_ingredients (
    recipe_id INT NOT NULL,
    ingredient_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL
);
""")
    
    # Insérer en batch de 500 pour éviter les requêtes SQL trop longues
    batch_size = 500
    for i in range(0, len(all_ingredients_data), batch_size):
        batch = all_ingredients_data[i:i+batch_size]
        
        sql_lines.append(f"\n-- Batch {i//batch_size + 1} ({len(batch)} ingrédients)")
        sql_lines.append("INSERT INTO temp_recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES")
        
        values = []
        for ing in batch:
            values.append(f"    ({ing['recipe_id']}, '{escape_sql(ing['name'])}', {ing['quantity']}, '{escape_sql(ing['unit'])}')")
        
        sql_lines.append(',\n'.join(values) + ';')
    
    # Maintenant faire le mapping et l'insertion finale
    sql_lines.append("""
-- Insertion finale avec mapping vers canonical_foods ou archetypes
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, archetype_id, quantity, unit)
SELECT 
    tri.recipe_id,
    cf.id AS canonical_food_id,
    a.id AS archetype_id,
    tri.quantity,
    tri.unit
FROM 
    temp_recipe_ingredients tri
    LEFT JOIN canonical_foods cf ON LOWER(cf.canonical_name) = LOWER(tri.ingredient_name)
    LEFT JOIN archetypes a ON LOWER(a.name) = LOWER(tri.ingredient_name)
WHERE 
    cf.id IS NOT NULL OR a.id IS NOT NULL;
""")
    
    # Rapport détaillé
    sql_lines.append("""
-- Rapport final détaillé
DO $$
DECLARE
    total_inserted INT;
    total_expected INT;
    matched_canonical INT;
    matched_archetype INT;
    unmatched INT;
    unique_unmatched INT;
BEGIN
    -- Compter les insertions réussies
    SELECT COUNT(*) INTO total_inserted FROM recipe_ingredients;
    SELECT COUNT(*) INTO total_expected FROM temp_recipe_ingredients;
    
    -- Compter par type de matching
    SELECT COUNT(*) INTO matched_canonical 
    FROM recipe_ingredients 
    WHERE canonical_food_id IS NOT NULL;
    
    SELECT COUNT(*) INTO matched_archetype 
    FROM recipe_ingredients 
    WHERE archetype_id IS NOT NULL;
    
    -- Compter les non-matchés
    SELECT COUNT(*) INTO unmatched
    FROM temp_recipe_ingredients tri
    WHERE NOT EXISTS (
        SELECT 1 FROM canonical_foods cf WHERE LOWER(cf.canonical_name) = LOWER(tri.ingredient_name)
    ) AND NOT EXISTS (
        SELECT 1 FROM archetypes a WHERE LOWER(a.name) = LOWER(tri.ingredient_name)
    );
    
    -- Compter les noms uniques non-matchés
    SELECT COUNT(DISTINCT tri.ingredient_name) INTO unique_unmatched
    FROM temp_recipe_ingredients tri
    WHERE NOT EXISTS (
        SELECT 1 FROM canonical_foods cf WHERE LOWER(cf.canonical_name) = LOWER(tri.ingredient_name)
    ) AND NOT EXISTS (
        SELECT 1 FROM archetypes a WHERE LOWER(a.name) = LOWER(tri.ingredient_name)
    );
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ IMPORT INGRÉDIENTS RECETTES TERMINÉ';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Résultats:';
    RAISE NOTICE '  • Total ingrédients insérés  : %', total_inserted;
    RAISE NOTICE '  • Total attendu              : %', total_expected;
    RAISE NOTICE '  • Taux de matching           : %%%', ROUND(100.0 * total_inserted / NULLIF(total_expected, 0), 1);
    RAISE NOTICE '';
    RAISE NOTICE 'Détails matching:';
    RAISE NOTICE '  • Matchés via canonical_foods: %', matched_canonical;
    RAISE NOTICE '  • Matchés via archetypes     : %', matched_archetype;
    RAISE NOTICE '  • Non matchés (total)        : %', unmatched;
    RAISE NOTICE '  • Non matchés (uniques)      : %', unique_unmatched;
    RAISE NOTICE '================================================================';
    
    -- Afficher les 20 premiers ingrédients non-matchés
    IF unique_unmatched > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Top 20 ingrédients non-matchés (à ajouter dans la base):';
        RAISE NOTICE '--------------------------------------------------------';
        
        FOR i IN (
            SELECT 
                tri.ingredient_name,
                COUNT(*) AS occurrences
            FROM temp_recipe_ingredients tri
            WHERE NOT EXISTS (
                SELECT 1 FROM canonical_foods cf WHERE LOWER(cf.canonical_name) = LOWER(tri.ingredient_name)
            ) AND NOT EXISTS (
                SELECT 1 FROM archetypes a WHERE LOWER(a.name) = LOWER(tri.ingredient_name)
            )
            GROUP BY tri.ingredient_name
            ORDER BY COUNT(*) DESC
            LIMIT 20
        )
        LOOP
            RAISE NOTICE '  • % (% fois)', i.ingredient_name, i.occurrences;
        END LOOP;
    END IF;
END $$;

-- Nettoyer
DROP TABLE IF EXISTS temp_recipe_ingredients;

COMMIT;
""")
    
    # Écrire le fichier SQL
    with open(output_sql_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ SQL généré: {output_sql_path}")
    print(f"📏 {len(sql_lines)} lignes SQL")

if __name__ == '__main__':
    main()
