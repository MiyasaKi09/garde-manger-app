#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 6 - ANALYSE INTELLIGENTE INGREDIENT PAR INGREDIENT
Règles strictes:
- CANONICAL = aliment brut, non transformé (pomme, carotte, farine, sucre, lait, beurre)
- ARCHETYPE = tout ce qui est préparé, transformé, ou type spécifique

Exemples:
- Pain → ARCHETYPE (produit cuit/transformé)
- Baguette → ARCHETYPE (type de pain)
- Andouillette → ARCHETYPE (charcuterie préparée)
- Bacon, jambon → ARCHETYPE (viande transformée)
- Huile d'olive → ARCHETYPE (extraction/préparation)
- Jus de citron → ARCHETYPE (extraction)
"""

import csv
import re
from collections import defaultdict
from difflib import SequenceMatcher

def normalize_for_comparison(text):
    """Normalise pour comparaison avec la base existante"""
    return text.lower().strip()

def load_existing_data():
    """Charge toutes les données existantes"""
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
    """Extrait tous les ingrédients bruts du fichier"""
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

def intelligent_classify(ing_name, canonical_exist, archetypes_exist, recipes_exist):
    """
    Classification INTELLIGENTE ingrédient par ingrédient
    Retourne: (action, cleaned_name, category, notes)
    """
    
    original = ing_name
    name = ing_name.strip()
    
    # === EXCLUSIONS ===
    if ' ou ' in name.lower():
        return ('skip', name, None, f"Multiple ingrédients")
    
    if name.lower() in ['eau de cuisson', 'pour friture', 'pour cuisson', 'au goût']:
        return ('skip', name, None, f"Trop vague")
    
    if '(facultatif)' in name.lower():
        name = re.sub(r'\s*\(facultatif\)', '', name, flags=re.IGNORECASE).strip()
    
    # Nettoyage basique
    if not name.lower().startswith('fromage'):
        name = re.sub(r'\b(frais|fraîche)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bsec\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name).strip()
    
    # === EXISTE DÉJÀ ? ===
    name_norm = normalize_for_comparison(name)
    
    if name_norm in canonical_exist:
        return ('exists', name, None, 'Déjà dans canonical_foods')
    
    if name_norm in archetypes_exist:
        return ('exists', name, None, 'Déjà dans archetypes')
    
    if name_norm in recipes_exist:
        return ('exists', name, None, 'Déjà dans recipes')
    
    for existing_name in list(canonical_exist.keys()) + list(archetypes_exist.keys()):
        ratio = SequenceMatcher(None, name_norm, existing_name).ratio()
        if ratio > 0.92:
            return ('exists', name, None, f'Très similaire à: {existing_name}')
    
    # === CORRECTIONS MANUELLES ===
    corrections = {
        # Unités → retirer
        "gousse d'ail": ('ail', 'canonical', 2, 'Unité retirée'),
        "gousses d'ail": ('ail', 'canonical', 2, 'Unité retirée'),
        
        # Parties d'œuf
        "jaune d'oeuf": ('jaune d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        "jaunes d'oeuf": ('jaune d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        "jaune d'œuf": ('jaune d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        "jaunes d'œuf": ('jaune d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        "blanc d'oeuf": ('blanc d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        "blancs d'oeuf": ('blanc d\'oeuf', 'archetype', 7, 'Partie d\'œuf séparée'),
        
        # Orthographe
        'nuoc-mâm': ('nuoc mam', 'canonical', 14, 'Correction orthographe'),
        'sherry': ('xérès', 'canonical', 14, 'Traduction'),
        'poireal': ('poireau', 'canonical', 2, 'Correction orthographe'),
        'cive': ('ciboulette', 'canonical', 10, 'Synonyme'),
    }
    
    name_lower = name.lower()
    if name_lower in corrections:
        corrected_name, type_ing, cat, reason = corrections[name_lower]
        return (type_ing, corrected_name, cat, reason)
    
    # === ANALYSE INTELLIGENTE ===
    
    # 1. TRANSFORMATIONS EXPLICITES → ARCHETYPE
    if any(kw in name_lower for kw in [
        'fumé', 'fumée', 'séché', 'séchée', 'moulu', 'moulue', 'en poudre',
        'râpé', 'râpée', 'haché', 'hachée', 'cuit', 'cuite', 'grillé', 'grillée',
        'congelé', 'congelée', 'mariné', 'marinée', 'dessalé', 'dessalée',
        'concentré', 'concassé'
    ]):
        return ('archetype', name, guess_category(name), 'Transformation explicite')
    
    # 2. PRÉPARATIONS COMPOSÉES → ARCHETYPE
    if any(kw in name_lower for kw in [
        'huile d\'', 'huile de', 'jus de', 'sauce ', 'vinaigre de',
        'sirop de', 'purée de', 'crème de', 'farine de',
        'bouillon', 'fond de', 'fumet'
    ]):
        return ('archetype', name, guess_category(name), 'Préparation composée')
    
    # 3. MÉLANGES D'ÉPICES → ARCHETYPE
    if any(mel in name_lower for mel in [
        'quatre-épice', 'quatre épice', 'cinq épice',
        'herbes de provence', 'garam masala', 'ras el hanout',
        'curry', 'herbes italiennes'
    ]):
        return ('archetype', name, 10, 'Mélange d\'épices')
    
    # 4. CHARCUTERIE / VIANDES TRANSFORMÉES → ARCHETYPE
    if any(kw in name_lower for kw in [
        'bacon', 'lardons', 'jambon', 'saucisse', 'saucisson',
        'andouillette', 'boudin', 'chorizo', 'guanciale',
        'confit de', 'paupiette', 'escalope'
    ]):
        return ('archetype', name, 9, 'Charcuterie/viande préparée')
    
    # 5. PAINS (TOUS) → ARCHETYPE
    if any(kw in name_lower for kw in [
        'pain ', "pain d'", 'baguette', 'brioche', 'muffin'
    ]) or name_lower == 'pain':
        return ('archetype', name, 5, 'Pain (produit cuit)')
    
    # 6. PRODUITS LAITIERS TRANSFORMÉS → ARCHETYPE
    if any(kw in name_lower for kw in [
        'crème fraîche', 'crème liquide', 'crème épaisse',
        'fromage râpé', 'parmesan râpé', 'gruyère râpé', 'comté râpé'
    ]):
        return ('archetype', name, 7, 'Produit laitier transformé')
    
    # 7. PÂTES / CÉRÉALES TRANSFORMÉES → ARCHETYPE
    if any(kw in name_lower for kw in [
        'chapelure', 'panko', 'flocons', 'semoule',
        'pâtes', 'spaghetti', 'penne', 'lasagne', 'vermicelle', 'nouilles',
        'feuille de brick', 'tortilla', 'galette'
    ]):
        return ('archetype', name, 5, 'Céréale/pâte transformée')
    
    # 8. PÂTISSERIE / PRÉPARATIONS → ARCHETYPE
    if any(kw in name_lower for kw in [
        'pâte feuilletée', 'pâte brisée', 'pâte à pizza', 'pâte ',
        'chapelure', 'biscuit', 'cookie'
    ]):
        return ('archetype', name, 14, 'Préparation pâtissière')
    
    # 9. CULTIVARS → SKIP
    if any(cult in name for cult in ['Arborio', 'Padrón', 'Graham']):
        return ('skip', name, None, 'Cultivar spécifique')
    
    # 10. MARQUES → SKIP
    if 'St Môret' in name or 'st moret' in name_lower:
        return ('skip', name, None, 'Marque commerciale')
    
    # === PAR DÉFAUT : CANONICAL (aliments bruts) ===
    # Ici arrivent : légumes, fruits, viandes brutes, épices de base, etc.
    return ('canonical', name, guess_category(name), 'Aliment brut')

def guess_category(name):
    """Devine la catégorie"""
    name_lower = name.lower()
    
    # Légumes
    if any(v in name_lower for v in [
        'ail', 'oignon', 'échalote', 'poireau', 'carotte', 'tomate', 'poivron',
        'piment', 'courgette', 'aubergine', 'concombre', 'céleri', 'navet',
        'radis', 'betterave', 'chou', 'brocoli', 'épinard', 'salade',
        'haricot vert', 'petit pois'
    ]):
        return 2
    
    # Fruits
    if any(f in name_lower for f in [
        'citron', 'orange', 'lime', 'pamplemousse', 'pomme', 'poire', 'banane',
        'mangue', 'fraise', 'framboise', 'myrtille', 'cerise', 'abricot',
        'pêche', 'prune', 'figue', 'pruneau'
    ]):
        return 1
    
    # Champignons
    if 'champignon' in name_lower or 'cèpe' in name_lower or 'morille' in name_lower:
        return 3
    
    # Viandes/Poissons
    if any(m in name_lower for m in [
        'boeuf', 'veau', 'porc', 'agneau', 'poulet', 'canard', 'dinde',
        'poisson', 'saumon', 'thon', 'cabillaud', 'truite', 'morue',
        'crevette', 'moule', 'calmar', 'viande', 'lapin', 'magret',
        'rôti', 'jarret', 'gigot', 'travers', 'échine', 'entrecôte', 'côtelette'
    ]):
        return 9
    
    # Herbes et épices
    if any(h in name_lower for h in [
        'basilic', 'persil', 'coriandre', 'menthe', 'thym', 'romarin',
        'laurier', 'origan', 'cumin', 'paprika', 'cannelle', 'muscade',
        'gingembre', 'safran', 'poivre', 'cayenne', 'espelette',
        'ciboulette', 'girofle'
    ]):
        return 10
    
    # Laitiers
    if any(l in name_lower for l in [
        'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'yogurt',
        'mascarpone', 'ricotta', 'mozzarella', 'parmesan', 'feta',
        'chèvre', 'pecorino', 'emmental', 'comté', 'tomme'
    ]):
        return 7
    
    # Céréales/Légumineuses
    if any(c in name_lower for c in [
        'farine', 'riz', 'avoine', 'orge', 'blé', 'quinoa', 'couscous',
        'pois chiche', 'lentille', 'haricot', 'galette de riz'
    ]):
        return 5
    
    # Huiles
    if 'huile' in name_lower:
        return 11
    
    # Par défaut
    return 14

def main():
    print("=== CLASSIFICATION INTELLIGENTE V6 ===\n")
    
    canonical_exist, archetypes_exist, recipes_exist = load_existing_data()
    print(f"✓ {len(canonical_exist)} canonical_foods existants")
    print(f"✓ {len(archetypes_exist)} archetypes existants\n")
    
    raw_ingredients = extract_raw_ingredients()
    print(f"✓ {len(raw_ingredients)} ingrédients uniques extraits\n")
    
    to_create_canonical = {}
    to_create_archetype = {}
    already_exist = []
    skipped = []
    
    for ing_name, count in sorted(raw_ingredients.items(), key=lambda x: -x[1]):
        action, cleaned, category, notes = intelligent_classify(
            ing_name, canonical_exist, archetypes_exist, recipes_exist
        )
        
        if action == 'canonical':
            key = cleaned.lower()
            if key not in to_create_canonical:
                to_create_canonical[key] = {
                    'name': cleaned,
                    'category': category,
                    'count': count,
                    'notes': notes
                }
        
        elif action == 'archetype':
            key = cleaned.lower()
            if key not in to_create_archetype:
                to_create_archetype[key] = {
                    'name': cleaned,
                    'category': category,
                    'count': count,
                    'notes': notes
                }
        
        elif action == 'exists':
            already_exist.append((ing_name, count, notes))
        
        elif action == 'skip':
            skipped.append((ing_name, count, notes))
    
    print(f"✓ {len(to_create_canonical)} canonical_foods à créer")
    print(f"✓ {len(to_create_archetype)} archetypes à créer")
    print(f"✓ {len(already_exist)} déjà existants")
    print(f"✓ {len(skipped)} ignorés\n")
    
    # Générer SQL
    with open('INSERT_INGREDIENTS_FINAL_V6.sql', 'w', encoding='utf-8') as f:
        f.write("-- ======================================================\n")
        f.write("-- INSERTION INGRÉDIENTS - VERSION 6 INTELLIGENTE\n")
        f.write("-- ======================================================\n")
        f.write("-- CANONICAL = aliments BRUTS non transformés\n")
        f.write("-- ARCHETYPE = tout ce qui est préparé/transformé\n")
        f.write("-- ======================================================\n\n")
        
        f.write("BEGIN;\n\n")
        
        # CANONICAL FOODS
        f.write("-- ======================================================\n")
        f.write("-- CANONICAL FOODS (aliments bruts)\n")
        f.write("-- ======================================================\n\n")
        
        for key in sorted(to_create_canonical.keys()):
            item = to_create_canonical[key]
            f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO canonical_foods (canonical_name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # ARCHETYPES
        f.write("\n-- ======================================================\n")
        f.write("-- ARCHETYPES (produits transformés/préparés)\n")
        f.write("-- ======================================================\n\n")
        
        for key in sorted(to_create_archetype.keys()):
            item = to_create_archetype[key]
            f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO archetypes (name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n")
    
    # Rapport
    with open('RAPPORT_INGREDIENTS_V6.txt', 'w', encoding='utf-8') as f:
        f.write("=== RAPPORT CLASSIFICATION INTELLIGENTE V6 ===\n\n")
        
        f.write(f"TOTAL: {len(raw_ingredients)} ingrédients uniques\n")
        f.write(f"À CRÉER (canonical): {len(to_create_canonical)}\n")
        f.write(f"À CRÉER (archetype): {len(to_create_archetype)}\n")
        f.write(f"DÉJÀ EXISTANTS: {len(already_exist)}\n")
        f.write(f"IGNORÉS: {len(skipped)}\n\n")
        
        f.write("=== CANONICAL (aliments bruts) ===\n")
        for key in sorted(to_create_canonical.keys(), key=lambda k: -to_create_canonical[k]['count']):
            item = to_create_canonical[key]
            f.write(f"{item['count']:3}x {item['name']:40} cat={item['category']} -> {item['notes']}\n")
        
        f.write("\n=== ARCHETYPES (transformés/préparés) ===\n")
        for key in sorted(to_create_archetype.keys(), key=lambda k: -to_create_archetype[k]['count']):
            item = to_create_archetype[key]
            f.write(f"{item['count']:3}x {item['name']:40} cat={item['category']} -> {item['notes']}\n")
        
        f.write("\n=== IGNORÉS ===\n")
        for ing, count, reason in sorted(skipped, key=lambda x: -x[1]):
            f.write(f"{count:3}x {ing:40} -> {reason}\n")
    
    print("✅ Fichiers générés:")
    print("   - INSERT_INGREDIENTS_FINAL_V6.sql")
    print("   - RAPPORT_INGREDIENTS_V6.txt")

if __name__ == '__main__':
    main()
