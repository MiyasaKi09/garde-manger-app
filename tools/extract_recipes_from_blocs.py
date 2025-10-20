#!/usr/bin/env python3
"""
Extraction et dé-duplication des recettes des 20 blocs
Génère des fichiers SQL par batch de 50 recettes
"""

import os
import re
from collections import defaultdict
from difflib import SequenceMatcher

# Configuration
BLOC_DIR = 'supabase'
OUTPUT_DIR = 'tools/recipe_batches'
BATCH_SIZE = 50

def normalize_name(name):
    """Normalise un nom pour comparaison"""
    # Enlever les accents, mettre en minuscules, enlever ponctuations
    name = name.lower().strip()
    name = re.sub(r'[àâä]', 'a', name)
    name = re.sub(r'[éèêë]', 'e', name)
    name = re.sub(r'[îï]', 'i', name)
    name = re.sub(r'[ôö]', 'o', name)
    name = re.sub(r'[ùûü]', 'u', name)
    name = re.sub(r'[ç]', 'c', name)
    name = re.sub(r'[^a-z0-9\s]', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name

def similarity(a, b):
    """Calcule la similarité entre 2 chaînes (0-1)"""
    return SequenceMatcher(None, normalize_name(a), normalize_name(b)).ratio()

def extract_recipes_from_bloc(filepath):
    """Extrait les recettes d'un fichier bloc"""
    recipes = []
    current_category = None
    current_subcategory = None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip()
            
            # Catégorie principale (ex: "Bloc 1 : Entrées")
            if line.startswith('Bloc '):
                current_category = line.split(':', 1)[1].strip() if ':' in line else None
            
            # Sous-catégorie (ex: "  1.1 Salades classiques françaises")
            elif re.match(r'^\s+\d+\.\d+', line):
                current_subcategory = re.sub(r'^\s+\d+\.\d+\s+', '', line).strip()
            
            # Recette (ex: "    - Salade niçoise")
            elif line.strip().startswith('-'):
                recipe_name = line.strip()[1:].strip()
                if recipe_name:
                    recipes.append({
                        'name': recipe_name,
                        'category': current_category,
                        'subcategory': current_subcategory,
                        'source_file': os.path.basename(filepath)
                    })
    
    return recipes

def detect_role(recipe_name, category, subcategory):
    """Détermine le rôle d'une recette"""
    name_lower = recipe_name.lower()
    cat_lower = (category or '').lower()
    subcat_lower = (subcategory or '').lower()
    
    # Entrées
    if any(word in cat_lower or word in subcat_lower for word in ['entrée', 'salade', 'soupe', 'velouté', 'tarte salée', 'quiche', 'antipasti', 'tapas']):
        return 'ENTREE'
    
    # Desserts
    if any(word in cat_lower or word in subcat_lower or word in name_lower 
           for word in ['dessert', 'gâteau', 'tarte sucrée', 'crème', 'mousse', 'glace', 'sorbet', 'pâtisserie', 'biscuit']):
        return 'DESSERT'
    
    # Accompagnements
    if any(word in cat_lower or word in subcat_lower or word in name_lower
           for word in ['accompagnement', 'garniture', 'purée', 'gratin', 'légume', 'frite', 'pain', 'sauce']):
        return 'ACCOMPAGNEMENT'
    
    # Par défaut : plat principal
    return 'PLAT_PRINCIPAL'

print("📚 Extraction des recettes des 20 blocs...")

# Extraction
all_recipes = []
bloc_files = sorted([f for f in os.listdir(BLOC_DIR) if f.startswith('bloc') and f.endswith('.txt')])

for bloc_file in bloc_files:
    filepath = os.path.join(BLOC_DIR, bloc_file)
    recipes = extract_recipes_from_bloc(filepath)
    all_recipes.extend(recipes)
    print(f"  ✅ {bloc_file}: {len(recipes)} recettes")

print(f"\n📊 Total extrait: {len(all_recipes)} recettes")

# Dé-duplication interne
print("\n🔍 Détection des doublons internes...")
unique_recipes = []
seen_normalized = {}
duplicates = []

for recipe in all_recipes:
    normalized = normalize_name(recipe['name'])
    
    # Vérifier si déjà vu (exact match)
    if normalized in seen_normalized:
        duplicates.append({
            'name': recipe['name'],
            'duplicate_of': seen_normalized[normalized]['name'],
            'source1': seen_normalized[normalized]['source_file'],
            'source2': recipe['source_file']
        })
        continue
    
    # Vérifier similarité élevée avec les recettes existantes
    is_similar = False
    for existing in unique_recipes[-100:]:  # Vérifier les 100 dernières seulement pour performance
        if similarity(recipe['name'], existing['name']) > 0.85:
            duplicates.append({
                'name': recipe['name'],
                'similar_to': existing['name'],
                'similarity': similarity(recipe['name'], existing['name']),
                'source1': existing['source_file'],
                'source2': recipe['source_file']
            })
            is_similar = True
            break
    
    if not is_similar:
        unique_recipes.append(recipe)
        seen_normalized[normalized] = recipe

print(f"  ✅ Recettes uniques: {len(unique_recipes)}")
print(f"  ⚠️  Doublons détectés: {len(duplicates)}")

# Sauvegarder la liste des doublons
if duplicates:
    with open('tools/doublons_detectes.txt', 'w', encoding='utf-8') as f:
        f.write("# Doublons détectés entre les blocs\n\n")
        for dup in duplicates[:50]:  # Montrer les 50 premiers
            f.write(f"- {dup['name']}")
            if 'duplicate_of' in dup:
                f.write(f" = {dup['duplicate_of']}")
            elif 'similar_to' in dup:
                f.write(f" ≈ {dup['similar_to']} ({dup['similarity']:.0%})")
            f.write(f" ({dup['source1']} / {dup['source2']})\n")
    print(f"\n📝 Liste des doublons sauvegardée: tools/doublons_detectes.txt")

# Sauvegarder la liste complète des recettes uniques
with open('tools/recettes_uniques_extraites.txt', 'w', encoding='utf-8') as f:
    f.write(f"# {len(unique_recipes)} recettes uniques extraites des 20 blocs\n\n")
    for recipe in unique_recipes:
        role = detect_role(recipe['name'], recipe['category'], recipe['subcategory'])
        f.write(f"{recipe['name']} | {role} | {recipe['subcategory'] or recipe['category']}\n")

print(f"✅ Liste complète sauvegardée: tools/recettes_uniques_extraites.txt")
print(f"\n🎯 Prêt à générer les SQL batches pour {len(unique_recipes)} recettes uniques")
