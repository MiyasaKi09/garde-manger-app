#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyse tous les ingrédients des recettes et génère le SQL
pour créer les canonical_foods et archetypes manquants
"""

import csv
import re
from collections import defaultdict

def normalize_ingredient_name(name):
    """Normalise le nom d'un ingrédient"""
    name = name.lower().strip()
    # Retirer les adjectifs/états courants mais garder l'info pour archetype
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def extract_process_from_name(name):
    """
    Extrait le processus de transformation du nom de l'ingrédient
    Retourne (base_name, process, is_archetype)
    """
    name_lower = name.lower()
    
    # Patterns pour les archétypes (transformations)
    archetype_patterns = {
        r'\bfrais\b': ('frais', False),  # Pas vraiment un processus
        r'\bfraîche?\b': ('frais', False),
        r'\bcuit\b': ('cuisson', True),
        r'\bcuite?\b': ('cuisson', True),
        r'\bmoulu\b': ('broyage', True),
        r'\bmoulue?\b': ('broyage', True),
        r'\brâpé\b': ('râpage', True),
        r'\brâpée?\b': ('râpage', True),
        r'\bhaché\b': ('hachage', True),
        r'\bhachée?\b': ('hachage', True),
        r'\bpelé\b': ('épluchage', True),
        r'\bpelée?\b': ('épluchage', True),
        r'\bdénoyauté\b': ('dénoyautage', True),
        r'\bdénoyautée?\b': ('dénoyautage', True),
        r'\bséché\b': ('séchage', True),
        r'\bséchée?\b': ('séchage', True),
        r'\bcongelé\b': ('congélation', True),
        r'\bcongelée?\b': ('congélation', True),
        r'\bfumé\b': ('fumage', True),
        r'\bfumée?\b': ('fumage', True),
        r'\bgrillé\b': ('grillage', True),
        r'\bgrillée?\b': ('grillage', True),
        r'\bmariné\b': ('marinade', True),
        r'\bmarinée?\b': ('marinade', True),
        r'\bfermenté\b': ('fermentation', True),
        r'\bfermentée?\b': ('fermentation', True),
        r'\ben poudre\b': ('séchage et broyage', True),
        r'\ben tranches?\b': ('tranchage', True),
        r'\ben dés\b': ('découpe', True),
        r'\ben morceaux\b': ('découpe', True),
        r'\bau sirop\b': ('mise en sirop', True),
        r'\bau naturel\b': ('nature', False),
        r'\bsous vide\b': ('mise sous vide', True),
        r'\ben bocal\b': ('mise en bocal', True),
        r'\ben conserve\b': ('mise en conserve', True),
        r'\ben boîte\b': ('mise en conserve', True),
    }
    
    process_found = None
    is_archetype = False
    
    for pattern, (process, is_arch) in archetype_patterns.items():
        if re.search(pattern, name_lower):
            process_found = process
            is_archetype = is_arch
            break
    
    # Retirer les processus du nom de base
    base_name = name
    for pattern in archetype_patterns.keys():
        base_name = re.sub(pattern, '', base_name, flags=re.IGNORECASE)
    
    base_name = re.sub(r'\s+', ' ', base_name).strip()
    
    return (base_name, process_found, is_archetype)

def categorize_ingredient(ingredient_name):
    """
    Catégorise un ingrédient et détermine s'il doit être
    canonical_food ou archetype
    """
    name_lower = ingredient_name.lower()
    
    # Ingrédients composés ou préparés -> archetypes
    if any(word in name_lower for word in [
        'bouillon', 'fond', 'sauce', 'pâte', 'crème', 'fromage',
        'huile de', "huile d'", 'vinaigre de', 'jus de',
        'sirop de', 'purée de', 'coulis de', 'compote de',
        'confiture de', 'gelée de', 'conserve de'
    ]):
        return 'archetype'
    
    # Déterminer par le processus
    base_name, process, is_archetype = extract_process_from_name(ingredient_name)
    
    if is_archetype:
        return 'archetype'
    
    return 'canonical_food'

def guess_category_id(ingredient_name):
    """Devine la catégorie d'un ingrédient"""
    name_lower = ingredient_name.lower()
    
    # Fruits (category 1)
    if any(word in name_lower for word in [
        'pomme', 'poire', 'banane', 'fraise', 'framboise', 'myrtille',
        'citron', 'orange', 'mandarine', 'pamplemousse', 'fruit'
    ]):
        return 1
    
    # Légumes (category 2)
    if any(word in name_lower for word in [
        'carotte', 'tomate', 'oignon', 'ail', 'poivron', 'courgette',
        'aubergine', 'concombre', 'salade', 'épinard', 'chou', 'légume'
    ]):
        return 2
    
    # Viandes/Poissons (category 9)
    if any(word in name_lower for word in [
        'poulet', 'boeuf', 'porc', 'veau', 'agneau', 'viande',
        'saumon', 'thon', 'cabillaud', 'poisson', 'crevette', 'moule'
    ]):
        return 9
    
    # Produits laitiers (category 7)
    if any(word in name_lower for word in [
        'lait', 'yaourt', 'fromage', 'crème', 'beurre', 'mozzarella'
    ]):
        return 7
    
    # Céréales/Féculents (category 5)
    if any(word in name_lower for word in [
        'farine', 'pain', 'riz', 'pâtes', 'nouilles', 'avoine', 'blé'
    ]):
        return 5
    
    # Herbes/Épices (category 10)
    if any(word in name_lower for word in [
        'basilic', 'persil', 'coriandre', 'thym', 'romarin', 'menthe',
        'poivre', 'sel', 'paprika', 'cumin', 'curry'
    ]):
        return 10
    
    # Par défaut: À classer
    return 14  # category "Autres"

def main():
    print("🔍 Chargement des données existantes...")
    
    # Charger canonical_foods existants
    existing_canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['canonical_name'].lower().strip()
            existing_canonical[name] = row['id']
    
    print(f"✅ {len(existing_canonical)} canonical_foods existants")
    
    # Charger archetypes existants
    existing_archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].lower().strip()
            existing_archetypes[name] = row['id']
    
    print(f"✅ {len(existing_archetypes)} archetypes existants")
    
    # Extraire tous les ingrédients uniques
    print("\n🔍 Extraction des ingrédients des recettes...")
    
    all_ingredients = defaultdict(int)  # ingredient -> count
    
    with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if not row or len(row) < 4:
                continue
            
            # Parser les ingrédients (colonnes 3+)
            for i in range(3, len(row)):
                ingredient_raw = row[i].strip()
                if not ingredient_raw:
                    continue
                
                fields = ingredient_raw.split('|')
                if len(fields) >= 3:
                    ingredient_name = fields[2].strip()
                    all_ingredients[ingredient_name] += 1
    
    print(f"✅ {len(all_ingredients)} ingrédients uniques trouvés")
    
    # Analyser les ingrédients manquants
    print("\n📊 Analyse des ingrédients manquants...")
    
    missing_canonical = {}
    missing_archetypes = {}
    
    for ingredient, count in all_ingredients.items():
        normalized = normalize_ingredient_name(ingredient)
        
        # Vérifier si existe déjà
        if normalized in existing_canonical or normalized in existing_archetypes:
            continue
        
        # Déterminer le type
        ingredient_type = categorize_ingredient(ingredient)
        base_name, process, is_archetype = extract_process_from_name(ingredient)
        
        if ingredient_type == 'archetype' or is_archetype:
            missing_archetypes[ingredient] = {
                'base_name': base_name,
                'process': process,
                'count': count,
                'category_id': guess_category_id(base_name)
            }
        else:
            missing_canonical[ingredient] = {
                'count': count,
                'category_id': guess_category_id(ingredient)
            }
    
    print(f"⚠️  {len(missing_canonical)} canonical_foods à créer")
    print(f"⚠️  {len(missing_archetypes)} archetypes à créer")
    
    # Générer le SQL
    print("\n📝 Génération du SQL...")
    
    sql_file = 'insert_missing_ingredients.sql'
    report_file = 'missing_ingredients_report.txt'
    
    with open(sql_file, 'w', encoding='utf-8') as sql_f, \
         open(report_file, 'w', encoding='utf-8') as report_f:
        
        sql_f.write("-- Insertion des ingrédients manquants\n")
        sql_f.write("-- Généré automatiquement\n")
        sql_f.write("-- " + "=" * 70 + "\n\n")
        sql_f.write("BEGIN;\n\n")
        
        report_f.write("RAPPORT DES INGRÉDIENTS MANQUANTS\n")
        report_f.write("=" * 80 + "\n\n")
        
        # 1. Canonical foods
        if missing_canonical:
            sql_f.write("-- =====================================================\n")
            sql_f.write("-- CANONICAL FOODS\n")
            sql_f.write("-- =====================================================\n\n")
            
            report_f.write("CANONICAL FOODS À CRÉER\n")
            report_f.write("-" * 80 + "\n\n")
            
            for ingredient in sorted(missing_canonical.keys(), key=lambda x: missing_canonical[x]['count'], reverse=True):
                info = missing_canonical[ingredient]
                
                report_f.write(f"• {ingredient}\n")
                report_f.write(f"  Catégorie estimée: {info['category_id']}\n")
                report_f.write(f"  Occurrences: {info['count']}\n\n")
                
                sql_f.write(f"-- {ingredient} (utilisé {info['count']}x)\n")
                sql_f.write(f"INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)\n")
                sql_f.write(f"VALUES ('{ingredient.replace("'", "''")}', {info['category_id']}, NOW(), NOW())\n")
                sql_f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # 2. Archetypes
        if missing_archetypes:
            sql_f.write("\n-- =====================================================\n")
            sql_f.write("-- ARCHETYPES\n")
            sql_f.write("-- =====================================================\n\n")
            
            report_f.write("\n" + "=" * 80 + "\n")
            report_f.write("ARCHETYPES À CRÉER\n")
            report_f.write("-" * 80 + "\n\n")
            
            for ingredient in sorted(missing_archetypes.keys(), key=lambda x: missing_archetypes[x]['count'], reverse=True):
                info = missing_archetypes[ingredient]
                
                report_f.write(f"• {ingredient}\n")
                report_f.write(f"  Nom de base: {info['base_name']}\n")
                report_f.write(f"  Processus: {info['process'] or 'N/A'}\n")
                report_f.write(f"  Catégorie estimée: {info['category_id']}\n")
                report_f.write(f"  Occurrences: {info['count']}\n\n")
                
                sql_f.write(f"-- {ingredient} (utilisé {info['count']}x)\n")
                sql_f.write(f"-- TODO: Vérifier canonical_food_id pour '{info['base_name']}'\n")
                sql_f.write(f"INSERT INTO archetypes (name, process, created_at, updated_at, notes)\n")
                
                process_value = f"'{info['process'].replace(chr(39), chr(39)*2)}'" if info['process'] else "NULL"
                ingredient_escaped = ingredient.replace("'", "''")
                base_name_escaped = info['base_name'].replace("'", "''")
                
                sql_f.write(f"VALUES (\n")
                sql_f.write(f"  '{ingredient_escaped}',\n")
                sql_f.write(f"  {process_value},\n")
                sql_f.write(f"  NOW(),\n")
                sql_f.write(f"  NOW(),\n")
                sql_f.write(f"  'Auto-généré - base: {base_name_escaped}')\n")
                sql_f.write(f"ON CONFLICT DO NOTHING;\n\n")
        
        sql_f.write("\nCOMMIT;\n")
        sql_f.write(f"\n-- Total: {len(missing_canonical)} canonical_foods + {len(missing_archetypes)} archetypes\n")
        
        # Statistiques
        report_f.write("\n" + "=" * 80 + "\n")
        report_f.write("STATISTIQUES\n")
        report_f.write("=" * 80 + "\n\n")
        report_f.write(f"Total ingrédients uniques: {len(all_ingredients)}\n")
        report_f.write(f"Déjà existants: {len(all_ingredients) - len(missing_canonical) - len(missing_archetypes)}\n")
        report_f.write(f"À créer:\n")
        report_f.write(f"  - Canonical foods: {len(missing_canonical)}\n")
        report_f.write(f"  - Archetypes: {len(missing_archetypes)}\n")
    
    print(f"\n✅ Fichiers générés:")
    print(f"   📄 {sql_file}")
    print(f"   📄 {report_file}")
    print(f"\n📊 Résumé:")
    print(f"   Total ingrédients: {len(all_ingredients)}")
    print(f"   Déjà existants: {len(all_ingredients) - len(missing_canonical) - len(missing_archetypes)}")
    print(f"   📝 Canonical foods à créer: {len(missing_canonical)}")
    print(f"   📝 Archetypes à créer: {len(missing_archetypes)}")
    
    print(f"\n⚠️  ATTENTION:")
    print(f"   Le SQL généré contient des TODO pour les archetypes.")
    print(f"   Il faut vérifier les canonical_food_id manuellement.")
    
    print(f"\n🚀 Pour insérer les données:")
    print(f"   1. Réviser le SQL et compléter les canonical_food_id")
    print(f"   2. PGPASSWORD='...' psql \"$DATABASE_URL_TX\" -f {sql_file}")

if __name__ == '__main__':
    main()
