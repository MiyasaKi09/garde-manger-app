#!/usr/bin/env python3
"""
Script pour générer des batches massifs avec TOUTES les recettes restantes
Objectif : Passer de 1042 à ~6000 recettes
"""

import re
from pathlib import Path
from typing import List, Dict

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
        if clean_name and len(clean_name) > 3:
            recipes.append(clean_name)
    
    return recipes

def determine_role(bloc_name: str) -> str:
    """Détermine le rôle en fonction du nom du bloc"""
    bloc_lower = bloc_name.lower()
    
    if 'entree' in bloc_lower or 'salade' in bloc_lower or 'soupe' in bloc_lower:
        return 'ENTREE'
    elif 'dessert' in bloc_lower or 'patisserie' in bloc_lower:
        return 'DESSERT'
    elif 'accompagnement' in bloc_lower or 'garniture' in bloc_lower:
        return 'ACCOMPAGNEMENT'
    else:
        return 'PLAT_PRINCIPAL'

def generate_batch_sql(recipes: List[str], batch_number: int, role: str, source: str) -> str:
    """Génère le SQL pour un batch de recettes"""
    
    role_descriptions = {
        'ENTREE': 'Entrée - À compléter',
        'PLAT_PRINCIPAL': 'Plat principal - À compléter',
        'DESSERT': 'Dessert - À compléter',
        'ACCOMPAGNEMENT': 'Accompagnement - À compléter',
    }
    
    description = role_descriptions.get(role, 'Recette - À compléter')
    
    sql = f"""-- ========================================================================
-- BATCH {batch_number} : {len(recipes)} recettes ({role})
-- Source : {source}
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
  COUNT(*) as total_recettes
FROM recipes;
"""
    
    return sql

def main():
    supabase_dir = Path(__file__).parent.parent / 'supabase'
    tools_dir = Path(__file__).parent
    
    print("🚀 IMPORT MASSIF : TOUTES LES RECETTES RESTANTES")
    print("=" * 80)
    
    # Trouver tous les fichiers bloc
    all_blocs = sorted(supabase_dir.glob('bloc*.txt'))
    
    print(f"📂 {len(all_blocs)} fichiers blocs trouvés\n")
    
    # Déjà utilisés (partiellement ou totalement)
    used_blocs = {
        'bloc1_entrees.txt': 150,  # 150/160 utilisées
    }
    
    batch_number = 10  # On commence à 10 (après batches 1-9)
    total_recipes = 0
    batches_created = []
    
    for bloc_path in all_blocs:
        bloc_name = bloc_path.name
        
        # Extraire toutes les recettes
        all_recipes = extract_all_recipes_from_bloc(bloc_path)
        
        # Vérifier si déjà utilisé
        if bloc_name in used_blocs:
            skip_count = used_blocs[bloc_name]
            recipes = all_recipes[skip_count:]  # Prendre ce qui reste
            status = f"({skip_count} déjà utilisées, {len(recipes)} restantes)"
        else:
            recipes = all_recipes
            status = f"(toutes disponibles)"
        
        if len(recipes) == 0:
            print(f"⏭️  {bloc_name}: Aucune recette restante")
            continue
        
        # Déterminer le rôle
        role = determine_role(bloc_name)
        
        print(f"📝 {bloc_name}: {len(recipes)} recettes {status}")
        print(f"   Rôle: {role}")
        
        # Créer des batches de 100 recettes
        for i in range(0, len(recipes), 100):
            batch_recipes = recipes[i:i+100]
            
            if len(batch_recipes) > 0:
                sql = generate_batch_sql(batch_recipes, batch_number, role, bloc_name)
                output_path = tools_dir / f'add_recipes_batch{batch_number}.sql'
                
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(sql)
                
                batches_created.append({
                    'number': batch_number,
                    'file': output_path.name,
                    'count': len(batch_recipes),
                    'role': role,
                    'source': bloc_name
                })
                
                total_recipes += len(batch_recipes)
                batch_number += 1
        
        print()
    
    print("=" * 80)
    print(f"\n🎉 GÉNÉRATION TERMINÉE")
    print(f"   Batches créés : {len(batches_created)}")
    print(f"   Recettes totales : {total_recipes}")
    print(f"   Total attendu après import : ~{1042 + total_recipes}")
    
    print(f"\n📋 LISTE DES BATCHES CRÉÉS:\n")
    for batch in batches_created[:10]:  # Afficher les 10 premiers
        print(f"   Batch {batch['number']:3d}: {batch['count']:3d} recettes ({batch['role']:15s}) - {batch['source']}")
    
    if len(batches_created) > 10:
        print(f"   ... et {len(batches_created) - 10} autres batches")
    
    # Créer un fichier consolidé par tranche de 500 recettes
    print(f"\n📦 CRÉATION DE FICHIERS CONSOLIDÉS (par 500 recettes)...\n")
    
    consolidated_count = 0
    current_consolidated = []
    current_recipes_count = 0
    
    for batch in batches_created:
        batch_path = tools_dir / batch['file']
        with open(batch_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        current_consolidated.append(content)
        current_recipes_count += batch['count']
        
        # Créer un fichier consolidé tous les 500 recettes
        if current_recipes_count >= 500:
            consolidated_count += 1
            consolidated_path = tools_dir / f'add_recipes_MEGA_{consolidated_count}.sql'
            
            with open(consolidated_path, 'w', encoding='utf-8') as f:
                f.write('\n\n'.join(current_consolidated))
            
            print(f"   ✅ MEGA_{consolidated_count}.sql : ~{current_recipes_count} recettes")
            
            current_consolidated = []
            current_recipes_count = 0
    
    # Dernier fichier avec le reste
    if current_consolidated:
        consolidated_count += 1
        consolidated_path = tools_dir / f'add_recipes_MEGA_{consolidated_count}.sql'
        
        with open(consolidated_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(current_consolidated))
        
        print(f"   ✅ MEGA_{consolidated_count}.sql : ~{current_recipes_count} recettes")
    
    print("\n" + "=" * 80)
    print(f"\n🎯 PROCHAINE ÉTAPE:")
    print(f"   Exécuter les fichiers MEGA_1.sql à MEGA_{consolidated_count}.sql dans Supabase")
    print(f"   (1 fichier à la fois, ~30 secondes chacun)")
    print(f"\n   Résultat attendu : {1042} → ~{1042 + total_recipes} recettes")

if __name__ == '__main__':
    main()
