#!/usr/bin/env python3
"""
Script pour générer le batch 2 : 50 entrées supplémentaires du bloc1
"""

import re
from pathlib import Path

def extract_recipes_from_bloc(file_path, offset=0, limit=50):
    """Extrait les recettes d'un fichier bloc"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern pour trouver les recettes (ligne commençant par "- ")
    pattern = r'^- (.+)$'
    matches = re.findall(pattern, content, re.MULTILINE)
    
    # Nettoyer les noms (enlever numéros si présents)
    recipes = []
    for match in matches:
        # Enlever les numéros au début (ex: "595. Shawarma" → "Shawarma")
        clean_name = re.sub(r'^\d+\.\s*', '', match.strip())
        if clean_name:
            recipes.append(clean_name)
    
    # Retourner le slice demandé
    return recipes[offset:offset + limit]

def generate_batch_sql(recipes, batch_number):
    """Génère le SQL pour un batch de recettes"""
    sql = f"""-- ========================================================================
-- BATCH {batch_number} : Ajout de {len(recipes)} Entrées (Bloc 1 - Suite)
-- ========================================================================

BEGIN;

"""
    
    for i, recipe_name in enumerate(recipes, 1):
        # Échapper les apostrophes
        escaped_name = recipe_name.replace("'", "''")
        
        sql += f"""-- {i}. {recipe_name}
INSERT INTO recipes (name, role, description)
VALUES (
  '{escaped_name}',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

"""
    
    sql += """COMMIT;

-- Vérification
SELECT 
  'Batch 2 terminé' as message,
  COUNT(*) as nouvelles_recettes
FROM recipes
WHERE description = 'Entrée classique - À compléter';
"""
    
    return sql

def main():
    # Fichier source
    bloc1_path = Path(__file__).parent.parent / 'supabase' / 'bloc1_entrees.txt'
    
    # Extraire les recettes 51-100 (offset=50, limit=50)
    print("📖 Lecture du bloc1_entrees.txt...")
    recipes = extract_recipes_from_bloc(bloc1_path, offset=50, limit=50)
    
    print(f"✅ {len(recipes)} recettes extraites pour le batch 2")
    
    # Générer le SQL
    sql_content = generate_batch_sql(recipes, batch_number=2)
    
    # Sauvegarder
    output_path = Path(__file__).parent / 'add_recipes_batch2.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print(f"✅ Fichier SQL créé: {output_path.name}")
    print(f"📊 {len(recipes)} recettes prêtes à être insérées\n")
    
    # Afficher les 5 premières
    print("🔍 Exemples:")
    for i, recipe in enumerate(recipes[:5], 1):
        print(f"   {i}. {recipe}")
    
    if len(recipes) > 5:
        print(f"   ... ({len(recipes) - 5} autres)")

if __name__ == '__main__':
    main()
