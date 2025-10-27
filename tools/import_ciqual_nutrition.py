#!/usr/bin/env python3
"""
Script d'import des données nutritionnelles Ciqual
Lit mapping_canonical_ciqual.csv et insère dans nutritional_data
"""
import csv
import os
from supabase import create_client

def main():
    # Connexion Supabase
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Variables d'environnement manquantes")
        print("Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    csv_path = '/workspaces/garde-manger-app/data/mapping_canonical_ciqual.csv'
    
    print(f"📂 Lecture de {csv_path}...")
    
    rows_to_insert = []
    skipped = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        # Détecter le délimiteur (semble être `;`)
        reader = csv.DictReader(f, delimiter=';')
        
        for i, row in enumerate(reader, start=1):
            if i % 100 == 0:
                print(f"  Traitement ligne {i}...")
            
            alim_code = row.get('alim_code', '').strip()
            if not alim_code:
                skipped += 1
                continue
            
            # Récupérer les valeurs nutritionnelles
            # Attention : les noms de colonnes peuvent avoir des caractères spéciaux
            calories_str = row.get("Energie, Règlement UE N° 1169/2011 (kcal/100 g)", 
                                   row.get("Energie, R\u00e8glement UE N\u00b0 1169/2011 (kcal/100 g)", ""))
            proteines_str = row.get("Protéines, N x facteur de Jones (g/100 g)",
                                     row.get("Prot\u00e9ines, N x facteur de Jones (g/100 g)", ""))
            glucides_str = row.get("Glucides (g/100 g)", "")
            lipides_str = row.get("Lipides (g/100 g)", "")
            
            # Convertir en float (gérer '-' et valeurs vides)
            def parse_float(val):
                val = val.strip()
                if val in ('', '-', '< 0,1', 'traces'):
                    return None
                # Remplacer virgule par point
                val = val.replace(',', '.')
                # Gérer les < valeur
                if val.startswith('<'):
                    val = val[1:].strip()
                try:
                    return float(val)
                except ValueError:
                    return None
            
            calories = parse_float(calories_str)
            proteines = parse_float(proteines_str)
            glucides = parse_float(glucides_str)
            lipides = parse_float(lipides_str)
            
            # Au moins une valeur doit être présente
            if all(v is None for v in [calories, proteines, glucides, lipides]):
                skipped += 1
                continue
            
            rows_to_insert.append({
                'source': 'ciqual',
                'source_id': alim_code,
                'calories_kcal': calories,
                'proteines_g': proteines,
                'glucides_g': glucides,
                'lipides_g': lipides
            })
            
            # Insérer par batch de 500 pour éviter les timeouts
            if len(rows_to_insert) >= 500:
                print(f"  💾 Insertion de {len(rows_to_insert)} lignes...")
                result = supabase.table('nutritional_data').upsert(
                    rows_to_insert,
                    on_conflict='source,source_id'
                ).execute()
                print(f"  ✅ {len(rows_to_insert)} lignes insérées")
                rows_to_insert = []
    
    # Insérer les dernières lignes
    if rows_to_insert:
        print(f"  💾 Insertion finale de {len(rows_to_insert)} lignes...")
        result = supabase.table('nutritional_data').upsert(
            rows_to_insert,
            on_conflict='source,source_id'
        ).execute()
        print(f"  ✅ {len(rows_to_insert)} lignes insérées")
    
    print(f"\n✅ Import terminé")
    print(f"  Lignes ignorées (sans données): {skipped}")

if __name__ == '__main__':
    main()
