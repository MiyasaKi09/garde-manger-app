#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 3 - COMPLÈTEMENT REFAIT
Analyse INTELLIGENTE des ingrédients pour une classification correcte
"""

import csv
import re
from collections import defaultdict
from difflib import SequenceMatcher

# ============================================================================
# RÈGLES DE CLASSIFICATION
# ============================================================================

# Mots qui indiquent une UNITÉ, pas un aliment
UNITS = ['gousse', 'tranche', 'filet', 'feuille', 'branche', 'brin', 'bouquet',
         'pincée', 'cuillère', 'tasse', 'verre', 'morceau', 'cube']

# Adjectifs à retirer TOUJOURS
ADJECTIVES_TO_REMOVE = [
    'frais', 'fraîche', 'fraîches',
    'sec', 'sèche', 'sèches',
    'bio', 'biologique',
    'mûr', 'mûre', 'mûres',
    'jeune', 'jeunes',
    'tendre', 'tendres',
    'nouveau', 'nouvelle', 'nouvelles',
    'gros', 'grosse', 'grosses',
    'petit', 'petite', 'petites',
    'entier', 'entière', 'entières',
    'facultatif', 'facultative'
]

# Transformations → ARCHETYPE
TRANSFORMATION_KEYWORDS = [
    'moulu', 'moulue', 'en poudre', 'râpé', 'râpée', 'haché', 'hachée',
    'cuit', 'cuite', 'grillé', 'grillée', 'fumé', 'fumée',
    'séché', 'séchée', 'congelé', 'congelée',
    'mariné', 'marinée', 'fermenté', 'fermentée',
    'dessalé', 'dessalée', 'pelé', 'pelée',
    'en conserve', 'en boîte', 'en bocal', 'au sirop'
]

# Préparations composées → ARCHETYPE
PREPARED_INGREDIENTS = [
    'sauce', 'bouillon', 'fond', 'fumet', 'jus de',
    'huile de', "huile d'", 'vinaigre de',
    'pâte à', 'pâte de', 'purée de', 'crème de',
    'farine de', 'pain de', 'flocons de', 'flocon de'
]

# Noms de marques/types spécifiques → considérer comme cultivar ou archetype
BRAND_SPECIFIC = ['St Môret', 'Arborio', 'Padrón', 'Espelette']

def clean_ingredient_name(name):
    """Nettoie le nom et retire les adjectifs inutiles"""
    name = name.strip()
    
    # Retirer les parenthèses avec "facultatif"
    name = re.sub(r'\s*\(facultatif\)', '', name, flags=re.IGNORECASE)
    
    # Retirer les adjectifs inutiles
    for adj in ADJECTIVES_TO_REMOVE:
        name = re.sub(rf'\b{adj}\b', '', name, flags=re.IGNORECASE)
    
    # Nettoyer espaces multiples
    name = re.sub(r'\s+', ' ', name).strip()
    
    return name

def singularize_smart(name):
    """Singularise intelligemment en gardant les expressions figées"""
    # Ne pas singulariser certaines expressions
    keep_plural = ['pois chiches', 'haricots', 'champignons de Paris', 
                   'herbes', 'épices', 'fruits']
    
    for expr in keep_plural:
        if expr in name.lower():
            return name
    
    # Singulariser le dernier mot principal
    words = name.split()
    if not words:
        return name
    
    # Cas spéciaux
    special = {
        'oeufs': 'oeuf', 'œufs': 'œuf',
        'noix': 'noix', 'pois': 'pois',
        'riz': 'riz', 'maïs': 'maïs'
    }
    
    last_word = words[-1].lower()
    if last_word in special:
        words[-1] = special[last_word]
    elif last_word.endswith('s') and len(last_word) > 3:
        words[-1] = words[-1][:-1]
    
    return ' '.join(words)

def remove_unit_prefix(name):
    """Retire les préfixes d'unité (gousse d'ail → ail)"""
    for unit in UNITS:
        # Pattern: "gousse d'ail" ou "gousse de ail"
        pattern = rf'^{unit}\s+d[e\']?\s+'
        name = re.sub(pattern, '', name, flags=re.IGNORECASE)
    
    return name.strip()

def is_transformation(name):
    """Vérifie si le nom contient une transformation"""
    name_lower = name.lower()
    return any(kw in name_lower for kw in TRANSFORMATION_KEYWORDS)

def is_prepared(name):
    """Vérifie si c'est une préparation composée"""
    name_lower = name.lower()
    return any(kw in name_lower for kw in PREPARED_INGREDIENTS)

def is_spice_powder(name):
    """Vérifie si c'est une épice (poudre/moulu)"""
    name_lower = name.lower()
    spices = ['cumin', 'paprika', 'curry', 'cannelle', 'muscade',
              'gingembre', 'safran', 'curcuma', 'coriandre',
              'poivre', 'cayenne', 'piment', 'cardamome']
    
    # Exception: poivre en grains = canonical
    if 'poivre' in name_lower and 'grain' in name_lower:
        return False
    if 'sel' in name_lower and 'grain' in name_lower:
        return False
    
    # Si c'est une épice avec transformation → archetype
    has_spice = any(spice in name_lower for spice in spices)
    has_transform = any(t in name_lower for t in ['moulu', 'poudre', 'séché'])
    
    return has_spice and (has_transform or 'poivre' not in name_lower)

def find_in_existing(name, existing_dict):
    """Cherche si l'ingrédient existe déjà dans la base"""
    name_lower = name.lower().strip()
    
    # Exact match
    if name_lower in existing_dict:
        return existing_dict[name_lower]
    
    # Fuzzy match
    best_ratio = 0
    best_match = None
    for existing_name in existing_dict.keys():
        ratio = SequenceMatcher(None, name_lower, existing_name).ratio()
        if ratio > best_ratio and ratio > 0.90:  # 90% similarité
            best_ratio = ratio
            best_match = existing_name
    
    return existing_dict.get(best_match) if best_match else None

def categorize_ingredient(name):
    """
    Retourne: ('canonical', base_name) ou ('archetype', base_name, process) ou ('skip', reason)
    """
    original_name = name
    
    # 1. Nettoyer
    name = clean_ingredient_name(name)
    name = singularize_smart(name)
    
    # 2. Cas spéciaux à ignorer
    if ' ou ' in name or '/' in name:
        return ('skip', f"Multiple ingrédients: {original_name}")
    
    if len(name) < 2:
        return ('skip', f"Nom trop court: {original_name}")
    
    # Noms trop vagues
    if name.lower() in ['eau de cuisson', 'pour friture', 'pour cuisson']:
        return ('skip', f"Trop vague: {original_name}")
    
    # 3. Retirer les unités
    name_no_unit = remove_unit_prefix(name)
    if name_no_unit != name:
        # "gousse d'ail" → "ail"
        name = name_no_unit
    
    # 4. Classification
    
    # Transformation → ARCHETYPE
    if is_transformation(name):
        # Extraire le nom de base
        base = name
        for kw in TRANSFORMATION_KEYWORDS:
            base = re.sub(rf'\b{kw}\b', '', base, flags=re.IGNORECASE)
        base = re.sub(r'\s+', ' ', base).strip()
        
        process = None
        if 'moulu' in name.lower() or 'poudre' in name.lower():
            process = 'broyage'
        elif 'râpé' in name.lower():
            process = 'râpage'
        elif 'fumé' in name.lower():
            process = 'fumage'
        # etc.
        
        return ('archetype', base, process)
    
    # Épice poudre → ARCHETYPE
    if is_spice_powder(name):
        return ('archetype', name, 'broyage')
    
    # Préparation → ARCHETYPE
    if is_prepared(name):
        # Ex: "jus de citron" → base="citron"
        base = name
        for kw in PREPARED_INGREDIENTS:
            base = re.sub(rf'{kw}\s*', '', base, flags=re.IGNORECASE)
        base = re.sub(r'\s+', ' ', base).strip()
        
        return ('archetype', base or name, None)
    
    # Sinon → CANONICAL
    return ('canonical', name, None)

def guess_category(name):
    """Devine la catégorie"""
    name_lower = name.lower()
    
    # Légumes
    if any(v in name_lower for v in ['carotte', 'tomate', 'oignon', 'ail', 
                                      'poivron', 'courgette', 'aubergine',
                                      'poireau', 'céleri', 'navet']):
        return 2
    
    # Fruits
    if any(f in name_lower for f in ['citron', 'orange', 'pomme', 'poire',
                                      'banane', 'fraise', 'mangue']):
        return 1
    
    # Champignons
    if 'champignon' in name_lower:
        return 3
    
    # Viandes/Poissons
    if any(m in name_lower for m in ['boeuf', 'porc', 'poulet', 'veau',
                                      'saumon', 'thon', 'morue', 'bacon']):
        return 9
    
    # Laitiers
    if any(d in name_lower for d in ['lait', 'crème', 'beurre', 'yaourt', 
                                      'fromage', 'parmesan']):
        return 7
    
    # Céréales
    if any(c in name_lower for c in ['farine', 'pain', 'riz', 'pâtes',
                                      'avoine', 'semoule']):
        return 5
    
    # Herbes/Épices
    if any(h in name_lower for h in ['basilic', 'persil', 'thym', 'laurier',
                                      'cumin', 'paprika', 'poivre', 'sel']):
        return 10
    
    # Huiles
    if 'huile' in name_lower:
        return 11
    
    return 14  # Autres

def main():
    print("🔍 CHARGEMENT DES DONNÉES EXISTANTES\n")
    
    # Charger existants
    existing_canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_canonical[row['canonical_name'].lower().strip()] = row['id']
    
    existing_archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_archetypes[row['name'].lower().strip()] = row['id']
    
    print(f"✅ {len(existing_canonical)} canonical_foods existants")
    print(f"✅ {len(existing_archetypes)} archetypes existants")
    
    # Extraire ingrédients du fichier
    print("\n🔍 EXTRACTION DES INGRÉDIENTS\n")
    
    raw_ingredients = defaultdict(int)
    with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # header
        
        for row in reader:
            if len(row) < 4:
                continue
            for i in range(3, len(row)):
                ing = row[i].strip()
                if not ing:
                    continue
                fields = ing.split('|')
                if len(fields) >= 3:
                    raw_ingredients[fields[2].strip()] += 1
    
    print(f"✅ {len(raw_ingredients)} ingrédients bruts extraits")
    
    # Classifier
    print("\n📊 CLASSIFICATION DES INGRÉDIENTS\n")
    
    to_add_canonical = {}
    to_add_archetypes = {}
    skipped = {}
    already_exists = []
    
    for ing_name, count in raw_ingredients.items():
        result = categorize_ingredient(ing_name)
        
        if result[0] == 'skip':
            skipped[ing_name] = {'reason': result[1], 'count': count}
            continue
        
        elif result[0] == 'canonical':
            clean_name = result[1]
            
            # Vérifier si existe
            if find_in_existing(clean_name, existing_canonical):
                already_exists.append(ing_name)
                continue
            
            to_add_canonical[clean_name] = {
                'original': ing_name,
                'count': count,
                'category': guess_category(clean_name)
            }
        
        elif result[0] == 'archetype':
            clean_name = ing_name  # Garder le nom complet pour archetype
            base_name = result[1]
            process = result[2] if len(result) > 2 else None
            
            # Vérifier si existe
            if find_in_existing(clean_name, existing_archetypes):
                already_exists.append(ing_name)
                continue
            
            to_add_archetypes[clean_name] = {
                'original': ing_name,
                'base': base_name,
                'process': process,
                'count': count,
                'category': guess_category(base_name)
            }
    
    print(f"✅ Canonical à créer: {len(to_add_canonical)}")
    print(f"✅ Archetypes à créer: {len(to_add_archetypes)}")
    print(f"⏭️  Ignorés: {len(skipped)}")
    print(f"✓  Déjà existants: {len(already_exists)}")
    
    # Générer SQL
    print("\n📝 GÉNÉRATION DU SQL\n")
    
    with open('insert_missing_ingredients_V3.sql', 'w', encoding='utf-8') as f:
        f.write("-- INSERTION DES INGRÉDIENTS MANQUANTS V3\n")
        f.write("-- Classification intelligente et vérification des doublons\n")
        f.write("-- " + "=" * 70 + "\n\n")
        f.write("BEGIN;\n\n")
        
        # Canonical foods
        if to_add_canonical:
            f.write("-- " + "=" * 70 + "\n")
            f.write("-- CANONICAL FOODS\n")
            f.write("-- " + "=" * 70 + "\n\n")
            
            for name in sorted(to_add_canonical.keys(), key=lambda x: to_add_canonical[x]['count'], reverse=True):
                info = to_add_canonical[name]
                name_esc = name.replace("'", "''")
                
                f.write(f"-- {info['original']} (utilisé {info['count']}x)\n")
                f.write(f"INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)\n")
                f.write(f"VALUES ('{name_esc}', {info['category']}, NOW(), NOW())\n")
                f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # Archetypes
        if to_add_archetypes:
            f.write("\n-- " + "=" * 70 + "\n")
            f.write("-- ARCHETYPES\n")
            f.write("-- " + "=" * 70 + "\n\n")
            
            for name in sorted(to_add_archetypes.keys(), key=lambda x: to_add_archetypes[x]['count'], reverse=True):
                info = to_add_archetypes[name]
                name_esc = name.replace("'", "''")
                base_esc = info['base'].replace("'", "''")
                proc = f"'{info['process']}'" if info['process'] else 'NULL'
                
                f.write(f"-- {info['original']} (utilisé {info['count']}x)\n")
                f.write(f"-- Base: {info['base']}\n")
                f.write(f"INSERT INTO archetypes (name, process, created_at, updated_at, notes)\n")
                f.write(f"VALUES ('{name_esc}', {proc}, NOW(), NOW(), 'Base: {base_esc}')\n")
                f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n\n")
        f.write(f"-- Total: {len(to_add_canonical)} canonical + {len(to_add_archetypes)} archetypes\n")
    
    # Rapport
    with open('ingredients_report_V3.txt', 'w', encoding='utf-8') as f:
        f.write("RAPPORT D'ANALYSE DES INGRÉDIENTS V3\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Total ingrédients bruts: {len(raw_ingredients)}\n")
        f.write(f"Canonical à créer: {len(to_add_canonical)}\n")
        f.write(f"Archetypes à créer: {len(to_add_archetypes)}\n")
        f.write(f"Déjà existants: {len(already_exists)}\n")
        f.write(f"Ignorés: {len(skipped)}\n\n")
        
        if skipped:
            f.write("\n" + "=" * 80 + "\n")
            f.write("INGRÉDIENTS IGNORÉS\n")
            f.write("=" * 80 + "\n\n")
            for name, info in sorted(skipped.items(), key=lambda x: x[1]['count'], reverse=True):
                f.write(f"• {name} ({info['count']}x)\n")
                f.write(f"  Raison: {info['reason']}\n\n")
    
    print(f"✅ Fichiers générés:")
    print(f"   📄 insert_missing_ingredients_V3.sql")
    print(f"   📄 ingredients_report_V3.txt")

if __name__ == '__main__':
    main()
