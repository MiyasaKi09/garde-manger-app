#!/bin/bash
# Script pour importer les données Ciqual dans PostgreSQL
set -e

cd /workspaces/garde-manger-app

# Charger les variables
source .env.local

echo "📂 Préparation du fichier CSV pour PostgreSQL..."

# Créer un CSV simplifié avec seulement les colonnes nécessaires
python3 << 'EOF'
import csv

input_file = 'data/mapping_canonical_ciqual.csv'
output_file = 'data/ciqual_nutrition_import.csv'

print(f"  Lecture de {input_file}...")

with open(input_file, 'r', encoding='iso-8859-1') as f_in, \
     open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    
    reader = csv.DictReader(f_in, delimiter=';')
    writer = csv.writer(f_out, delimiter=',')
    
    # En-tête étendu avec micronutriments
    writer.writerow([
        'source_id', 'calories_kcal', 'proteines_g', 'glucides_g', 'lipides_g',
        'fibres_g', 'sucres_g',
        'ag_satures_g', 'ag_monoinsatures_g', 'ag_polyinsatures_g', 'cholesterol_mg',
        'calcium_mg', 'fer_mg', 'magnesium_mg', 'phosphore_mg', 'potassium_mg', 
        'sodium_mg', 'zinc_mg', 'cuivre_mg', 'selenium_ug', 'iode_ug',
        'vitamine_a_ug', 'beta_carotene_ug', 'vitamine_d_ug', 'vitamine_e_mg', 'vitamine_k_ug',
        'vitamine_c_mg', 'vitamine_b1_mg', 'vitamine_b2_mg', 'vitamine_b3_mg', 
        'vitamine_b5_mg', 'vitamine_b6_mg', 'vitamine_b9_ug', 'vitamine_b12_ug'
    ])
    
    rows_written = 0
    skipped = 0
    
    for i, row in enumerate(reader, start=1):
        if i % 500 == 0:
            print(f"    Traitement ligne {i}...")
        
        alim_code = row.get('alim_code', '').strip()
        if not alim_code:
            skipped += 1
            continue
        
        # Récupérer les valeurs (gérer l'encoding)
        cols = list(row.keys())
        
        # Fonction de parsing robuste
        def parse_float(val):
            if not val:
                return ''
            val = val.strip()
            if val in ('', '-', 'traces'):
                return ''
            val = val.replace(',', '.')
            if val.startswith('<'):
                val = val[1:].strip()
            try:
                float(val)
                return val
            except ValueError:
                return ''
        
        # Trouver les colonnes par pattern (robuste à l'encoding)
        def find_col(patterns):
            for pattern in patterns:
                col = next((c for c in cols if pattern.lower() in c.lower()), None)
                if col:
                    return col
            return None
        
        # Macronutriments
        calories = parse_float(row.get(find_col(['(kcal/100 g)', 'energie', 'kcal']), ''))
        proteines = parse_float(row.get(find_col(['proteine', 'prot']), ''))
        glucides = parse_float(row.get(find_col(['glucides (g']), ''))
        lipides = parse_float(row.get(find_col(['lipides (g']), ''))
        
        # Fibres et sucres
        fibres = parse_float(row.get(find_col(['fibres alimentaires']), ''))
        sucres = parse_float(row.get(find_col(['sucres (g']), ''))
        
        # Acides gras
        ag_sat = parse_float(row.get(find_col(['ag satur']), ''))
        ag_mono = parse_float(row.get(find_col(['ag monoinsatur']), ''))
        ag_poly = parse_float(row.get(find_col(['ag polyinsatur']), ''))
        cholesterol = parse_float(row.get(find_col(['cholesterol']), ''))
        
        # Minéraux
        calcium = parse_float(row.get(find_col(['calcium (mg']), ''))
        fer = parse_float(row.get(find_col(['fer (mg']), ''))
        magnesium = parse_float(row.get(find_col(['magnesium (mg', 'magn']), ''))
        phosphore = parse_float(row.get(find_col(['phosphore']), ''))
        potassium = parse_float(row.get(find_col(['potassium']), ''))
        sodium = parse_float(row.get(find_col(['sodium (mg']), ''))
        zinc = parse_float(row.get(find_col(['zinc']), ''))
        cuivre = parse_float(row.get(find_col(['cuivre']), ''))
        selenium = parse_float(row.get(find_col(['selenium', 'l nium']), ''))
        iode = parse_float(row.get(find_col(['iode']), ''))
        
        # Vitamines
        vit_a = parse_float(row.get(find_col(['retinol', 'tinol']), ''))
        beta_carotene = parse_float(row.get(find_col(['beta-carot', 'carot']), ''))
        vit_d = parse_float(row.get(find_col(['vitamine d']), ''))
        vit_e = parse_float(row.get(find_col(['vitamine e']), ''))
        vit_k = parse_float(row.get(find_col(['vitamine k1']), ''))
        vit_c = parse_float(row.get(find_col(['vitamine c']), ''))
        vit_b1 = parse_float(row.get(find_col(['vitamine b1', 'thiamine']), ''))
        vit_b2 = parse_float(row.get(find_col(['vitamine b2', 'riboflavine']), ''))
        vit_b3 = parse_float(row.get(find_col(['vitamine b3', 'niacine']), ''))
        vit_b5 = parse_float(row.get(find_col(['vitamine b5', 'pantoth']), ''))
        vit_b6 = parse_float(row.get(find_col(['vitamine b6']), ''))
        vit_b9 = parse_float(row.get(find_col(['vitamine b9', 'folates']), ''))
        vit_b12 = parse_float(row.get(find_col(['vitamine b12']), ''))
        
        # Au moins une valeur doit être présente
        if not any([calories, proteines, glucides, lipides]):
            skipped += 1
            continue
        
        writer.writerow([
            alim_code,
            calories, proteines, glucides, lipides,
            fibres, sucres,
            ag_sat, ag_mono, ag_poly, cholesterol,
            calcium, fer, magnesium, phosphore, potassium, sodium, zinc, cuivre, selenium, iode,
            vit_a, beta_carotene, vit_d, vit_e, vit_k,
            vit_c, vit_b1, vit_b2, vit_b3, vit_b5, vit_b6, vit_b9, vit_b12
        ])
        rows_written += 1

print(f"\n✅ CSV préparé: {output_file}")
print(f"   Lignes écrites: {rows_written}")
print(f"   Lignes ignorées: {skipped}")
EOF

echo ""
echo "💾 Import dans PostgreSQL..."
psql "$DATABASE_URL_TX" << 'SQL'
-- Import avec COPY (33 colonnes complètes)
\COPY nutritional_data(source_id, calories_kcal, proteines_g, glucides_g, lipides_g, fibres_g, sucres_g, ag_satures_g, ag_monoinsatures_g, ag_polyinsatures_g, cholesterol_mg, calcium_mg, fer_mg, magnesium_mg, phosphore_mg, potassium_mg, sodium_mg, zinc_mg, cuivre_mg, selenium_ug, iode_ug, vitamine_a_ug, beta_carotene_ug, vitamine_d_ug, vitamine_e_mg, vitamine_k_ug, vitamine_c_mg, vitamine_b1_mg, vitamine_b2_mg, vitamine_b3_mg, vitamine_b5_mg, vitamine_b6_mg, vitamine_b9_ug, vitamine_b12_ug) FROM 'data/ciqual_nutrition_import.csv' WITH CSV HEADER DELIMITER ',' NULL '';

-- Statistiques
SELECT COUNT(*) AS total_rows FROM nutritional_data;
SELECT 
  COUNT(*) FILTER (WHERE calories_kcal IS NOT NULL) AS with_calories,
  COUNT(*) FILTER (WHERE proteines_g IS NOT NULL) AS with_proteines,
  COUNT(*) FILTER (WHERE glucides_g IS NOT NULL) AS with_glucides,
  COUNT(*) FILTER (WHERE lipides_g IS NOT NULL) AS with_lipides,
  COUNT(*) FILTER (WHERE vitamine_c_mg IS NOT NULL) AS with_vit_c,
  COUNT(*) FILTER (WHERE calcium_mg IS NOT NULL) AS with_calcium
FROM nutritional_data;
SQL

echo ""
echo "✅ Import terminé !"
