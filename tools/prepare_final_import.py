#!/usr/bin/env python3
"""
Script FINAL - Import complet canonical_foods + recipe_ingredients
Utilise des INSERT individuels via SQL statements
"""

import csv
import os
import sys

# Charger données canonical_foods
csv_canon = 'supabase/exports/latest/csv/canonical_foods.csv'
csv_recipe_ing = 'supabase/exports/latest/csv/recipe_ingredients.csv'

print("🔄 Préparation import final...\n")

# ==============================================================================
# CANONICAL_FOODS - Générer SQL pour batches 3-6
# ==============================================================================

with open(csv_canon, 'r') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

total = len(rows)
already_done = 90
remaining = rows[already_done:]

print(f"📊 canonical_foods:")
print(f"   Total CSV: {total} lignes")
print(f"   Déjà importé: {already_done} lignes")
print(f"   Reste: {len(remaining)} lignes\n")

# Sauver un fichier SQL unique avec tous les restants
output_file = '/tmp/finish_canonical_import.sql'

with open(output_file, 'w') as out:
    out.write("-- =================================================================\n")
    out.write("-- FINALISATION IMPORT canonical_foods\n")
    out.write(f"-- Lignes {already_done+1}-{total} ({len(remaining)} lignes)\n")
    out.write("-- =================================================================\n\n")
    
    # Diviser en batches de 20 lignes pour rendre gérable
    BATCH_SIZE = 20
    
    for batch_idx in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[batch_idx:batch_idx+BATCH_SIZE]
        
        out.write(f"\n-- Batch {batch_idx//BATCH_SIZE + 1}: lignes {already_done + batch_idx + 1}-{already_done + batch_idx + len(batch)}\n")
        out.write("INSERT INTO canonical_foods (id, canonical_name, category_id, keywords, primary_unit,\n")
        out.write("  unit_weight_grams, density_g_per_ml, shelf_life_days_pantry, shelf_life_days_fridge,\n")
        out.write("  shelf_life_days_freezer, created_at, updated_at, subcategory_id, nutrition_id)\n")
        out.write("VALUES\n")
        
        values_lines = []
        for row in batch:
            def fmt(val):
                if val in ('', 'NULL'):
                    return 'NULL'
                return "'" + val.replace("'", "''") + "'"
            
            def fmtn(val):
                return 'NULL' if val in ('', 'NULL') else val
            
            kw = row['keywords']
            if kw and kw.startswith('{'):
                items = [item.strip() for item in kw[1:-1].split(',')]
                keywords_sql = "ARRAY[" + ",".join(f"'{it}'" for it in items) + "]"
            else:
                keywords_sql = 'NULL'
            
            values_lines.append(
                f"  ({row['id']}, {fmt(row['canonical_name'])}, {fmtn(row['category_id'])}, {keywords_sql}, "
                f"{fmt(row['primary_unit'])}, {fmtn(row['unit_weight_grams'])}, {fmtn(row['density_g_per_ml'])}, "
                f"{fmtn(row['shelf_life_days_pantry'])}, {fmtn(row['shelf_life_days_fridge'])}, "
                f"{fmtn(row['shelf_life_days_freezer'])}, {fmt(row['created_at'])}, {fmt(row['updated_at'])}, "
                f"{fmtn(row['subcategory_id'])}, {fmtn(row['nutrition_id'])})"
            )
        
        out.write(',\n'.join(values_lines) + ';\n')

print(f"✅ Fichier SQL généré: {output_file}")
print(f"   {len(remaining)} lignes réparties en {(len(remaining) + BATCH_SIZE - 1) // BATCH_SIZE} batches de ~{BATCH_SIZE} lignes\n")

# ==============================================================================
# RECIPE_INGREDIENTS - Générer SQL
# ==============================================================================

with open(csv_recipe_ing, 'r') as f:
    reader = csv.DictReader(f)
    recipe_rows = list(reader)

print(f"📊 recipe_ingredients:")
print(f"   Total CSV: {len(recipe_rows)} lignes\n")

output_file_recipe = '/tmp/import_recipe_ingredients.sql'

with open(output_file_recipe, 'w') as out:
    out.write("-- =================================================================\n")
    out.write("-- IMPORT recipe_ingredients\n")
    out.write(f"-- Total: {len(recipe_rows)} lignes\n")
    out.write("-- =================================================================\n\n")
    
    # Batches de 50 lignes
    BATCH_SIZE = 50
    
    for batch_idx in range(0, len(recipe_rows), BATCH_SIZE):
        batch = recipe_rows[batch_idx:batch_idx+BATCH_SIZE]
        
        out.write(f"\n-- Batch {batch_idx//BATCH_SIZE + 1}: lignes {batch_idx + 1}-{batch_idx + len(batch)}\n")
        out.write("INSERT INTO recipe_ingredients (id, recipe_id, archetype_id, canonical_food_id,\n")
        out.write("  quantity, unit, notes, sub_recipe_id)\n")
        out.write("VALUES\n")
        
        values_lines = []
        for row in batch:
            def fmt(val):
                if val in ('', 'NULL'):
                    return 'NULL'
                return "'" + val.replace("'", "''") + "'"
            
            def fmtn(val):
                return 'NULL' if val in ('', 'NULL') else val
            
            values_lines.append(
                f"  ({row['id']}, {fmtn(row['recipe_id'])}, {fmtn(row['archetype_id'])}, "
                f"{fmtn(row['canonical_food_id'])}, {fmtn(row['quantity'])}, {fmt(row['unit'])}, "
                f"{fmt(row['notes'])}, {fmtn(row['sub_recipe_id'])})"
            )
        
        out.write(',\n'.join(values_lines) + ';\n')

print(f"✅ Fichier SQL généré: {output_file_recipe}")
print(f"   {len(recipe_rows)} lignes réparties en {(len(recipe_rows) + BATCH_SIZE - 1) // BATCH_SIZE} batches de ~{BATCH_SIZE} lignes\n")

print("="*70)
print("\n🎯 PROCHAINES ÉTAPES:")
print("\n1. Import canonical_foods (137 lignes restantes):")
print(f"   - Exécuter /tmp/finish_canonical_import.sql via pgsql_modify")
print(f"   - {(len(remaining) + 20 - 1) // 20} batches de ~20 lignes chacun")
print("\n2. Import recipe_ingredients (3487 lignes):")
print(f"   - Exécuter /tmp/import_recipe_ingredients.sql via pgsql_modify")  
print(f"   - {(len(recipe_rows) + 50 - 1) // 50} batches de ~50 lignes chacun")
print("\n3. Ensuite:")
print("   - Réimporter données Ciqual (tools/reimport_ciqual_secure.sh)")
print("   - Lier 16 légumes (tools/link_canonical_to_ciqual.sql)")
print("   - Tester get_recipe_micronutrients()")
print("\n" + "="*70)
