#!/usr/bin/env python3
"""
Script Python simple pour restaurer canonical_foods et recipe_ingredients
depuis les CSV exports
"""
import csv
import os
import psycopg2
from psycopg2.extras import execute_values

# Connexion - utiliser DATABASE_URL au lieu de DATABASE_URL_TX (sans pooler)
db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("❌ DATABASE_URL non trouvée")
    exit(1)

# Remplacer pooler par connexion directe
db_url = db_url.replace('pooler.supabase.com:6543', 'supabase.co:5432')
db_url = db_url.replace('pooler.supabase.com:6544', 'supabase.co:5432')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("🔄 Restauration canonical_foods...")

# Lire le CSV
rows = []
with open('supabase/exports/latest/csv/canonical_foods.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Gérer les valeurs NULL
        def parse_val(val):
            if val in ('', 'NULL'):
                return None
            return val
        
        # Gérer le keywords array
        keywords_str = parse_val(row['keywords'])
        if keywords_str and keywords_str.startswith('{'):
            # Garder tel quel pour PostgreSQL
            keywords = keywords_str
        else:
            keywords = None
        
        rows.append((
            int(row['id']),
            parse_val(row['canonical_name']),
            int(row['category_id']) if parse_val(row['category_id']) else None,
            keywords,
            parse_val(row['primary_unit']),
            float(row['unit_weight_grams']) if parse_val(row['unit_weight_grams']) else None,
            float(row['density_g_per_ml']) if parse_val(row['density_g_per_ml']) else None,
            int(row['shelf_life_days_pantry']) if parse_val(row['shelf_life_days_pantry']) else None,
            int(row['shelf_life_days_fridge']) if parse_val(row['shelf_life_days_fridge']) else None,
            int(row['shelf_life_days_freezer']) if parse_val(row['shelf_life_days_freezer']) else None,
            parse_val(row['created_at']),
            parse_val(row['updated_at']),
            int(row['subcategory_id']) if parse_val(row['subcategory_id']) else None,
            int(row['nutrition_id']) if parse_val(row['nutrition_id']) else None
        ))

# Insérer
execute_values(
    cursor,
    """
    INSERT INTO canonical_foods 
    (id, canonical_name, category_id, keywords, primary_unit, unit_weight_grams, 
     density_g_per_ml, shelf_life_days_pantry, shelf_life_days_fridge, 
     shelf_life_days_freezer, created_at, updated_at, subcategory_id, nutrition_id)
    VALUES %s
    """,
    rows
)

print(f"✅ {len(rows)} canonical_foods importés")

# recipe_ingredients
print("🔄 Restauration recipe_ingredients...")

rows = []
with open('supabase/exports/latest/csv/recipe_ingredients.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        def parse_val(val):
            if val in ('', 'NULL'):
                return None
            return val
        
        rows.append((
            int(row['id']),
            int(row['recipe_id']) if parse_val(row['recipe_id']) else None,
            int(row['archetype_id']) if parse_val(row['archetype_id']) else None,
            int(row['canonical_food_id']) if parse_val(row['canonical_food_id']) else None,
            float(row['quantity']) if parse_val(row['quantity']) else None,
            parse_val(row['unit']),
            parse_val(row['notes']),
            int(row['sub_recipe_id']) if parse_val(row['sub_recipe_id']) else None
        ))

execute_values(
    cursor,
    """
    INSERT INTO recipe_ingredients 
    (id, recipe_id, archetype_id, canonical_food_id, quantity, unit, notes, sub_recipe_id)
    VALUES %s
    """,
    rows
)

print(f"✅ {len(rows)} recipe_ingredients importés")

conn.commit()
cursor.close()
conn.close()

print("\n📊 Vérification:")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM canonical_foods")
print(f"  canonical_foods: {cursor.fetchone()[0]} lignes")
cursor.execute("SELECT COUNT(*) FROM recipe_ingredients")
print(f"  recipe_ingredients: {cursor.fetchone()[0]} lignes")
cursor.close()
conn.close()

print("\n✅ Restauration terminée !")
