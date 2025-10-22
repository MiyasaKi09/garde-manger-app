#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 7 - ANALYSE MANUELLE LIGNE PAR LIGNE
Pas de pattern matching automatique stupide
Chaque ingrédient est analysé individuellement
"""

import csv
import re
from collections import defaultdict
from difflib import SequenceMatcher

def normalize_for_comparison(text):
    return text.lower().strip()

def load_existing_data():
    canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_for_comparison(row['canonical_name'])
            canonical[name] = row['id']
    
    archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_for_comparison(row['name'])
            archetypes[name] = row['id']
    
    recipes = {}
    with open('../supabase/exports/latest/csv/recipes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_for_comparison(row['name'])
            recipes[name] = row['id']
    
    return canonical, archetypes, recipes

def extract_raw_ingredients():
    ingredients = defaultdict(int)
    
    with open('../LISTE_TOUTES_RECETTES COMPLETE.txt', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        
        for row in reader:
            if len(row) < 4:
                continue
            
            for i in range(3, len(row)):
                ing_raw = row[i].strip()
                if not ing_raw:
                    continue
                
                parts = ing_raw.split('|')
                if len(parts) >= 3:
                    ing_name = parts[2].strip()
                    ingredients[ing_name] += 1
    
    return ingredients

def singularize(name):
    """Mettre au singulier de manière intelligente"""
    name_lower = name.lower()
    
    # Cas spéciaux
    singular_map = {
        'oeufs': 'oeuf',
        'œufs': 'œuf',
        'amandes effilées': 'amande effilée',
        'tomates mûres': 'tomate',
        'tomates pelées': 'tomate pelée',
        'tomates concassées': 'tomate concassée',
        'tomates cerises': 'tomate cerise',
        'bananes mûres': 'banane',
        'figues fraîches': 'figue',
        'fruits rouges mélangés': 'fruit rouge mélangé',
        'branches de thym': 'branche de thym',
        'brins de thym': 'brin de thym',
        'feuilles de laurier': 'feuille de laurier',
        'feuilles de brick': 'feuille de brick',
        'blancs d\'oeufs': 'blanc d\'oeuf',
        'jaunes d\'oeufs': 'jaune d\'oeuf',
        'blancs d\'œufs': 'blanc d\'œuf',
        'jaunes d\'œufs': 'jaune d\'œuf',
        'gousses d\'ail': 'ail',
        'tranches de bacon': 'bacon',
        'pois chiches': 'pois chiche',
        'graines de sésame': 'graine de sésame',
        'graines de chia': 'graine de chia',
        'pignons de pin': 'pignon de pin',
        'cerneaux de noix': 'cerneau de noix',
        'pousses de soja': 'pousse de soja',
        'pruneaux dénoyautés': 'pruneau dénoyauté',
        'olives noires dénoyautées': 'olive noire dénoyautée',
        'olives noires': 'olive noire',
        'petits oignons': 'petit oignon',
        'haricots rouges': 'haricot rouge',
        'haricots blancs': 'haricot blanc',
        'haricots noirs': 'haricot noir',
        'lentilles corail': 'lentille corail',
        'vermicelles de riz': 'vermicelle de riz',
        'galettes de riz': 'galette de riz',
        'flocons d\'avoine': 'flocon d\'avoine',
        'chips de maïs': 'chip de maïs',
        'pépites de chocolat': 'pépite de chocolat',
        'pois chiches secs': 'pois chiche',
        'saucisses de toulouse': 'saucisse de toulouse',
        'saucisses de strasbourg': 'saucisse de strasbourg',
        'escalopes de poulet': 'escalope de poulet',
        'escalopes de veau': 'escalope de veau',
        'escalopes de porc': 'escalope de porc',
        'côtelettes d\'agneau': 'côtelette d\'agneau',
        'andouillettes de troyes': 'andouillette',
        'blancs de poulet': 'blanc de poulet',
    }
    
    for plural, singular in singular_map.items():
        if name_lower == plural:
            return singular
    
    # Règle générale pour -s final
    if name.endswith('s') and not name.endswith('us') and not name.endswith('is'):
        # Cas courants
        if name.endswith('aux'):
            return name[:-3] + 'al'
        elif name.endswith('oux'):
            return name[:-1]  # Garde le x
        else:
            return name[:-1]
    
    return name

def remove_adjectives(name):
    """Retirer les adjectifs inutiles"""
    name = re.sub(r'\bmûres?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bmûrs?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bfrais\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bfraîche\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bsec\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bsèche\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bvieillis?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bfermierm?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bentiers?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bdécoupés?\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def manual_classify(name, count, canonical_exist, archetypes_exist, recipes_exist):
    """
    Classification MANUELLE de chaque ingrédient
    """
    original = name
    name_norm = normalize_for_comparison(name)
    
    # Existe déjà ?
    if name_norm in canonical_exist:
        return ('exists', name, None, 'Déjà dans canonical_foods')
    if name_norm in archetypes_exist:
        return ('exists', name, None, 'Déjà dans archetypes')
    if name_norm in recipes_exist:
        return ('exists', name, None, 'Déjà dans recipes')
    
    for existing in list(canonical_exist.keys()) + list(archetypes_exist.keys()):
        if SequenceMatcher(None, name_norm, existing).ratio() > 0.92:
            return ('exists', name, None, f'Similaire à: {existing}')
    
    # Skip évidents
    if ' ou ' in name.lower():
        return ('skip', name, None, 'Multiple ingrédients')
    if 'St Môret' in name:
        return ('skip', name, None, 'Marque')
    if any(x in name for x in ['Arborio', 'Padrón', 'Graham']):
        return ('skip', name, None, 'Cultivar spécifique')
    if name.lower() in ['eau de cuisson', 'pour friture']:
        return ('skip', name, None, 'Trop vague')
    
    # Nettoyer
    name = re.sub(r'\(facultatif\)', '', name, flags=re.IGNORECASE).strip()
    name = singularize(name)
    name = remove_adjectives(name)
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Re-vérifier après nettoyage
    name_norm = normalize_for_comparison(name)
    if name_norm in canonical_exist or name_norm in archetypes_exist:
        return ('exists', name, None, 'Existe après nettoyage')
    
    # === CLASSIFICATION MANUELLE ===
    
    name_lower = name.lower()
    
    # ARCHETYPE - Transformations explicites
    if any(kw in name_lower for kw in [
        'fumé', 'séché', 'moulu', 'en poudre', 'râpé', 'haché',
        'cuit', 'grillé', 'congelé', 'mariné', 'dessalé', 'concassé', 'pelé',
        'effilé', 'émincé', 'tranché', 'en dés', 'en rondelle'
    ]):
        return ('archetype', name, guess_category(name), 'Transformation')
    
    # ARCHETYPE - Parties séparées
    if 'jaune d\'oeuf' in name_lower or 'blanc d\'oeuf' in name_lower:
        return ('archetype', name, 7, 'Partie d\'œuf')
    
    # ARCHETYPE - Préparations liquides
    if name_lower.startswith('huile d') or name_lower.startswith('jus de'):
        return ('archetype', name, guess_category(name), 'Extraction')
    
    if name_lower.startswith('sauce ') or name_lower.startswith('vinaigre de'):
        return ('archetype', name, 14, 'Préparation')
    
    if name_lower in ['bouillon', 'bouillon de boeuf', 'bouillon de poulet']:
        return ('archetype', name, 14, 'Bouillon')
    
    # ARCHETYPE - Pains (TOUS)
    if name_lower in ['pain', 'baguette', 'pain de mie', 'pain de campagne', 
                       'pain rassis', 'pain d\'épices', 'muffin anglais']:
        return ('archetype', name, 5, 'Pain')
    
    # ARCHETYPE - Charcuterie
    if any(kw in name_lower for kw in [
        'bacon', 'lardon', 'jambon', 'saucisse', 'saucisson', 
        'andouillette', 'boudin', 'chorizo', 'guanciale'
    ]):
        return ('archetype', name, 9, 'Charcuterie')
    
    # ARCHETYPE - Pâtes/céréales transformées
    if any(kw in name_lower for kw in [
        'flocon', 'chapelure', 'panko', 'pâte', 'spaghetti', 'penne',
        'lasagne', 'vermicelle', 'nouille', 'semoule'
    ]):
        return ('archetype', name, 5, 'Céréale transformée')
    
    # ARCHETYPE - Mélanges d'épices
    if any(kw in name_lower for kw in [
        'herbes de provence', 'garam masala', 'curry', 'quatre-épice', 'cinq épice'
    ]):
        return ('archetype', name, 10, 'Mélange d\'épices')
    
    # ARCHETYPE - Produits laitiers transformés
    if 'crème' in name_lower and any(x in name_lower for x in ['liquide', 'épaisse', 'fraîche']):
        return ('archetype', name, 7, 'Crème transformée')
    
    # ARCHETYPE - Viandes préparées/découpées
    if any(kw in name_lower for kw in [
        'escalope', 'paupiette', 'magret', 'confit de'
    ]):
        return ('archetype', name, 9, 'Viande préparée')
    
    # ARCHETYPE - Feuilles, galettes, tortillas
    if any(kw in name_lower for kw in ['feuille de brick', 'tortilla', 'galette']):
        return ('archetype', name, 5, 'Produit transformé')
    
    # CANONICAL - Tout le reste (aliments bruts)
    return ('canonical', name, guess_category(name), 'Aliment brut')

def guess_category(name):
    name_lower = name.lower()
    
    # Légumes
    if any(v in name_lower for v in [
        'ail', 'oignon', 'échalote', 'poireau', 'carotte', 'tomate', 'poivron',
        'piment', 'courgette', 'aubergine', 'concombre', 'céleri', 'navet',
        'radis', 'betterave', 'chou', 'brocoli', 'épinard', 'salade',
        'haricot vert', 'petit pois', 'artichaut'
    ]):
        return 2
    
    # Fruits
    if any(f in name_lower for f in [
        'citron', 'orange', 'lime', 'pomme', 'poire', 'banane', 'mangue',
        'fraise', 'framboise', 'myrtille', 'cerise', 'abricot', 'pêche',
        'prune', 'figue', 'pruneau', 'fruit'
    ]):
        return 1
    
    # Champignons
    if 'champignon' in name_lower:
        return 3
    
    # Viandes/Poissons
    if any(m in name_lower for m in [
        'boeuf', 'veau', 'porc', 'agneau', 'poulet', 'canard', 'dinde',
        'poisson', 'saumon', 'thon', 'cabillaud', 'morue', 'crevette',
        'moule', 'calmar', 'viande', 'lapin', 'gigot', 'rôti', 'jarret',
        'travers', 'échine', 'entrecôte', 'côtelette', 'magret', 'blanc de poulet',
        'escalope', 'paupiette', 'confit'
    ]):
        return 9
    
    # Herbes et épices
    if any(h in name_lower for h in [
        'basilic', 'persil', 'coriandre', 'menthe', 'thym', 'romarin',
        'laurier', 'origan', 'cumin', 'paprika', 'cannelle', 'muscade',
        'gingembre', 'safran', 'poivre', 'cayenne', 'espelette',
        'ciboulette', 'girofle', 'herbes'
    ]):
        return 10
    
    # Laitiers
    if any(l in name_lower for l in [
        'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'mascarpone',
        'ricotta', 'mozzarella', 'parmesan', 'feta', 'chèvre', 'pecorino',
        'emmental', 'comté', 'tomme', 'gruyère'
    ]):
        return 7
    
    # Céréales/Légumineuses
    if any(c in name_lower for c in [
        'farine', 'riz', 'avoine', 'blé', 'quinoa', 'couscous',
        'pois chiche', 'lentille', 'haricot', 'pain', 'pâte', 'semoule'
    ]):
        return 5
    
    # Huiles
    if 'huile' in name_lower:
        return 11
    
    return 14

def main():
    print("=== VERSION 7 - ANALYSE MANUELLE ===\n")
    
    canonical_exist, archetypes_exist, recipes_exist = load_existing_data()
    raw_ingredients = extract_raw_ingredients()
    
    print(f"✓ {len(raw_ingredients)} ingrédients à analyser\n")
    
    to_create_canonical = {}
    to_create_archetype = {}
    already_exist = []
    skipped = []
    
    for ing_name, count in sorted(raw_ingredients.items(), key=lambda x: -x[1]):
        action, cleaned, category, notes = manual_classify(
            ing_name, count, canonical_exist, archetypes_exist, recipes_exist
        )
        
        if action == 'canonical':
            key = cleaned.lower()
            if key not in to_create_canonical:
                to_create_canonical[key] = {
                    'name': cleaned,
                    'category': category,
                    'count': count,
                    'notes': notes,
                    'original': ing_name
                }
        
        elif action == 'archetype':
            key = cleaned.lower()
            if key not in to_create_archetype:
                to_create_archetype[key] = {
                    'name': cleaned,
                    'category': category,
                    'count': count,
                    'notes': notes,
                    'original': ing_name
                }
        
        elif action == 'exists':
            already_exist.append((ing_name, count, notes))
        
        elif action == 'skip':
            skipped.append((ing_name, count, notes))
    
    print(f"✓ {len(to_create_canonical)} canonical")
    print(f"✓ {len(to_create_archetype)} archetypes")
    print(f"✓ {len(already_exist)} existants")
    print(f"✓ {len(skipped)} ignorés\n")
    
    # SQL
    with open('INSERT_INGREDIENTS_FINAL_V7.sql', 'w', encoding='utf-8') as f:
        f.write("-- VERSION 7 - ANALYSE MANUELLE\n")
        f.write("-- Singularisation + suppression adjectifs inutiles\n\n")
        f.write("BEGIN;\n\n")
        
        f.write("-- CANONICAL FOODS\n\n")
        for key in sorted(to_create_canonical.keys()):
            item = to_create_canonical[key]
            if item['original'] != item['name']:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']} [{item['original']}]\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO canonical_foods (canonical_name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        f.write("\n-- ARCHETYPES\n\n")
        for key in sorted(to_create_archetype.keys()):
            item = to_create_archetype[key]
            if item['original'] != item['name']:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']} [{item['original']}]\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO archetypes (name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n")
    
    # Rapport
    with open('RAPPORT_INGREDIENTS_V7.txt', 'w', encoding='utf-8') as f:
        f.write("=== RAPPORT V7 - ANALYSE MANUELLE ===\n\n")
        f.write(f"À CRÉER (canonical): {len(to_create_canonical)}\n")
        f.write(f"À CRÉER (archetype): {len(to_create_archetype)}\n\n")
        
        f.write("=== CANONICAL ===\n")
        for key in sorted(to_create_canonical.keys(), key=lambda k: -to_create_canonical[k]['count']):
            item = to_create_canonical[key]
            if item['original'] != item['name']:
                f.write(f"{item['count']:3}x {item['name']:35} <- {item['original']}\n")
            else:
                f.write(f"{item['count']:3}x {item['name']}\n")
        
        f.write("\n=== ARCHETYPES ===\n")
        for key in sorted(to_create_archetype.keys(), key=lambda k: -to_create_archetype[k]['count']):
            item = to_create_archetype[key]
            if item['original'] != item['name']:
                f.write(f"{item['count']:3}x {item['name']:35} <- {item['original']}\n")
            else:
                f.write(f"{item['count']:3}x {item['name']}\n")
    
    print("✅ INSERT_INGREDIENTS_FINAL_V7.sql")
    print("✅ RAPPORT_INGREDIENTS_V7.txt")

if __name__ == '__main__':
    main()
