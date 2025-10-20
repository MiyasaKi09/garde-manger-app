#!/usr/bin/env python3
"""
Script pour générer 8 batches de 50 recettes (400 total)
Batch 2-9 : depuis bloc1 (entrées restantes) + autres blocs
"""

import re
from pathlib import Path
from typing import List, Tuple

def extract_all_recipes_from_bloc(file_path) -> List[str]:
    """Extrait toutes les recettes d'un fichier bloc"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern pour trouver les recettes (ligne commençant par "- ")
    pattern = r'^[ \t]*- (.+)$'
    matches = re.findall(pattern, content, re.MULTILINE)
    
    # Nettoyer les noms
    recipes = []
    for match in matches:
        # Enlever les numéros au début
        clean_name = re.sub(r'^\d+\.\s*', '', match.strip())
        if clean_name and len(clean_name) > 3:  # Éviter les lignes vides ou trop courtes
            recipes.append(clean_name)
    
    return recipes

def generate_batch_sql(recipes: List[str], batch_number: int, role: str = 'ENTREE') -> str:
    """Génère le SQL pour un batch de recettes"""
    
    role_descriptions = {
        'ENTREE': 'Entrée classique - À compléter',
        'PLAT_PRINCIPAL': 'Plat principal - À compléter',
        'DESSERT': 'Dessert - À compléter',
        'ACCOMPAGNEMENT': 'Accompagnement - À compléter',
        'PLAT_COMPLET': 'Plat complet - À compléter'
    }
    
    description = role_descriptions.get(role, 'Recette - À compléter')
    
    sql = f"""-- ========================================================================
-- BATCH {batch_number} : Ajout de {len(recipes)} recettes ({role})
-- ========================================================================

BEGIN;

"""
    
    for i, recipe_name in enumerate(recipes, 1):
        # Échapper les apostrophes
        escaped_name = recipe_name.replace("'", "''")
        
        sql += f"""-- {i}. {recipe_name}
INSERT INTO recipes (name, role, description)
VALUES ('{escaped_name}', '{role}', '{description}')
ON CONFLICT (name) DO NOTHING;

"""
    
    sql += f"""COMMIT;

-- Vérification
SELECT 
  'Batch {batch_number} terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = '{role}') as recettes_{role.lower()}
FROM recipes;
"""
    
    return sql

def main():
    supabase_dir = Path(__file__).parent.parent / 'supabase'
    tools_dir = Path(__file__).parent
    
    print("🚀 Génération de 8 batches (400 recettes)")
    print("=" * 70)
    
    # Lire tous les blocs disponibles
    blocs_info = [
        ('bloc1_entrees.txt', 'ENTREE'),
        ('bloc2_plats_traditionnels_complet.txt', 'PLAT_PRINCIPAL'),
        ('bloc3_plats_europeens_complet.txt', 'PLAT_PRINCIPAL'),
        ('bloc8_poissons_fruits_de_mer_complet.txt', 'PLAT_PRINCIPAL'),
        ('bloc9_volailles_complet.txt', 'PLAT_PRINCIPAL'),
        ('bloc10_viandes_rouges_complet.txt', 'PLAT_PRINCIPAL'),
        ('bloc20_desserts_complet.txt', 'DESSERT'),
    ]
    
    # Collecter toutes les recettes disponibles
    all_recipes = {}
    for bloc_file, role in blocs_info:
        bloc_path = supabase_dir / bloc_file
        if bloc_path.exists():
            recipes = extract_all_recipes_from_bloc(bloc_path)
            all_recipes[bloc_file] = {'recipes': recipes, 'role': role}
            print(f"✅ {bloc_file}: {len(recipes)} recettes ({role})")
        else:
            print(f"⚠️  {bloc_file}: fichier introuvable")
    
    print("\n" + "=" * 70)
    
    # Batch 2 : Entrées restantes du bloc1 (50-100)
    if 'bloc1_entrees.txt' in all_recipes:
        bloc1_recipes = all_recipes['bloc1_entrees.txt']['recipes']
        batch2_recipes = bloc1_recipes[50:100]  # Recettes 51-100
        
        sql = generate_batch_sql(batch2_recipes, 2, 'ENTREE')
        output_path = tools_dir / 'add_recipes_batch2.sql'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f"✅ Batch 2: {len(batch2_recipes)} entrées (bloc1) → {output_path.name}")
    
    # Batch 3 : Entrées restantes du bloc1 (100-150)
    if 'bloc1_entrees.txt' in all_recipes:
        batch3_recipes = bloc1_recipes[100:150]  # Recettes 101-150
        
        sql = generate_batch_sql(batch3_recipes, 3, 'ENTREE')
        output_path = tools_dir / 'add_recipes_batch3.sql'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f"✅ Batch 3: {len(batch3_recipes)} entrées (bloc1) → {output_path.name}")
    
    # Batch 4-7 : Plats principaux
    current_batch = 4
    for bloc_file in ['bloc2_plats_traditionnels_complet.txt', 'bloc3_plats_europeens_complet.txt', 
                       'bloc8_poissons_fruits_de_mer_complet.txt', 'bloc9_volailles_complet.txt',
                       'bloc10_viandes_rouges_complet.txt']:
        if bloc_file in all_recipes and current_batch <= 7:
            plats = all_recipes[bloc_file]['recipes']
            role = all_recipes[bloc_file]['role']
            
            # Un batch de 50 recettes par bloc
            batch_recipes = plats[:50]
            if len(batch_recipes) > 0:
                sql = generate_batch_sql(batch_recipes, current_batch, role)
                output_path = tools_dir / f'add_recipes_batch{current_batch}.sql'
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(sql)
                print(f"✅ Batch {current_batch}: {len(batch_recipes)} plats ({bloc_file}) → {output_path.name}")
                current_batch += 1
    
    # Batch 8-9 : Desserts
    if 'bloc20_desserts_complet.txt' in all_recipes and current_batch <= 9:
        desserts = all_recipes['bloc20_desserts_complet.txt']['recipes']
        
        # Batch 8: 50 premiers desserts
        if current_batch <= 9:
            batch_recipes = desserts[:50]
            if len(batch_recipes) > 0:
                sql = generate_batch_sql(batch_recipes, current_batch, 'DESSERT')
                output_path = tools_dir / f'add_recipes_batch{current_batch}.sql'
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(sql)
                print(f"✅ Batch {current_batch}: {len(batch_recipes)} desserts → {output_path.name}")
                current_batch += 1
        
        # Batch 9: 50 desserts suivants
        if current_batch <= 9 and len(desserts) > 50:
            batch_recipes = desserts[50:100]
            if len(batch_recipes) > 0:
                sql = generate_batch_sql(batch_recipes, current_batch, 'DESSERT')
                output_path = tools_dir / f'add_recipes_batch{current_batch}.sql'
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(sql)
                print(f"✅ Batch {current_batch}: {len(batch_recipes)} desserts → {output_path.name}")
    
    print("\n" + "=" * 70)
    print("🎯 RÉSUMÉ")
    print(f"   Batch 1: ✅ Déjà importé (49 entrées)")
    print(f"   Batch 2-9: 🆕 8 fichiers SQL créés (~400 recettes)")
    print(f"   Total attendu: ~1050 recettes")
    print("\n📋 PROCHAINE ÉTAPE")
    print(f"   Exécuter batch2.sql à batch9.sql dans Supabase SQL Editor")

if __name__ == '__main__':
    main()
