#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 5 - CORRECTIONS MAJEURES
- Pain de mie ≠ pain (deux archétypes différents)
- Flocons d'avoine = archetype, avoine = canonical
- Épices de BASE = canonical (cumin, cannelle, paprika)
- Épices TRANSFORMÉES = archetype (cumin moulu, cannelle en poudre)
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
    # Canonical foods
    canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_for_comparison(row['canonical_name'])
            canonical[name] = row['id']
    
    # Archetypes
    archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = normalize_for_comparison(row['name'])
            archetypes[name] = row['id']
    
    # Recipes
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
        next(reader)  # skip header
        
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

def clean_and_classify(ing_name, canonical_exist, archetypes_exist, recipes_exist):
    """
    Nettoie et classifie un ingrédient
    Retourne: (action, cleaned_name, category, notes)
    action: 'skip', 'canonical', 'archetype', 'exists'
    """
    
    original = ing_name
    name = ing_name.strip()
    
    # === RÈGLES D'EXCLUSION ===
    
    # 1. Ingrédients multiples avec "ou"
    if ' ou ' in name.lower():
        return ('skip', name, None, f"Multiple ingrédients: {original}")
    
    # 2. Trop vague
    if name.lower() in ['eau de cuisson', 'pour friture', 'pour cuisson', 'au goût']:
        return ('skip', name, None, f"Trop vague: {original}")
    
    # 3. Avec "(facultatif)"
    if '(facultatif)' in name.lower():
        name = re.sub(r'\s*\(facultatif\)', '', name, flags=re.IGNORECASE).strip()
    
    # === NETTOYAGE GÉNÉRAL ===
    
    # Retirer "frais/fraîche" (sauf si c'est substantiel)
    if not name.lower().startswith('fromage'):  # Garder "fromage frais"
        name = re.sub(r'\b(frais|fraîche)\b', '', name, flags=re.IGNORECASE)
    
    # Retirer "sec/sèche" pour vins
    name = re.sub(r'\bsec\b', '', name, flags=re.IGNORECASE)
    
    # Nettoyer espaces
    name = re.sub(r'\s+', ' ', name).strip()
    
    # === DÉTECTION DE CE QUI EXISTE DÉJÀ ===
    
    name_norm = normalize_for_comparison(name)
    
    # Chercher dans canonical
    if name_norm in canonical_exist:
        return ('exists', name, None, 'Déjà dans canonical_foods')
    
    # Chercher dans archetypes
    if name_norm in archetypes_exist:
        return ('exists', name, None, 'Déjà dans archetypes')
    
    # Chercher dans recipes
    if name_norm in recipes_exist:
        return ('exists', name, None, 'Déjà dans recipes')
    
    # Recherche fuzzy
    for existing_name in list(canonical_exist.keys()) + list(archetypes_exist.keys()):
        ratio = SequenceMatcher(None, name_norm, existing_name).ratio()
        if ratio > 0.92:
            return ('exists', name, None, f'Très similaire à: {existing_name}')
    
    # === CORRECTIONS SPÉCIFIQUES ===
    # NE CORRIGER QUE les unités et orthographe, PAS fusionner des ingrédients différents!
    
    corrections = {
        # Unités à retirer
        "gousse d'ail": ('ail', 'canonical', 2),
        "gousses d'ail": ('ail', 'canonical', 2),
        
        # Parties d'œuf = archetype
        "jaune d'oeuf": ('jaune d\'oeuf', 'archetype', 7),
        "jaunes d'oeuf": ('jaune d\'oeuf', 'archetype', 7),
        "jaune d'œuf": ('jaune d\'oeuf', 'archetype', 7),
        "jaunes d'œuf": ('jaune d\'oeuf', 'archetype', 7),
        "blanc d'oeuf": ('blanc d\'oeuf', 'archetype', 7),
        "blancs d'oeuf": ('blanc d\'oeuf', 'archetype', 7),
        
        # Herbes fraîches -> canonical base
        'basilic frais': ('basilic', 'canonical', 10),
        'persil frais': ('persil', 'canonical', 10),
        'coriandre fraîche': ('coriandre', 'canonical', 10),
        
        # Flocons = archetype, mais ne PAS créer "avoine" ici
        "flocon d'avoine": ('flocons d\'avoine', 'archetype', 5),
        "flocons d'avoine": ('flocons d\'avoine', 'archetype', 5),
        
        # Orthographe
        'pois chiches sec': ('pois chiche', 'canonical', 5),
        'pois chiche sec': ('pois chiche', 'canonical', 5),
        'nuoc-mâm': ('nuoc mam', 'canonical', 14),
        'chip de maï': ('chips de maïs', 'archetype', 5),
        'chips de maïs': ('chips de maïs', 'archetype', 5),
        'fécule de maï': ('fécule de maïs', 'archetype', 5),
        'sherry': ('xérès', 'canonical', 14),
        'ail (facultatif)': ('ail', 'canonical', 2),
        'poireal': ('poireau', 'canonical', 2),
        'cive': ('ciboulette', 'canonical', 10),
    }
    
    name_lower = name.lower()
    if name_lower in corrections:
        corrected_name, type_ing, cat = corrections[name_lower]
        return (type_ing, corrected_name, cat, f'Correction: {original} → {corrected_name}')
    
    # === RÈGLES DE CLASSIFICATION ===
    
    # 1. ARCHETYPES - Transformations EXPLICITES
    transformations = {
        'fumé': 'fumage',
        'fumée': 'fumage',
        'séché': 'séchage',
        'séchée': 'séchage',
        'moulu': 'broyage',
        'moulue': 'broyage',
        'en poudre': 'broyage',
        'râpé': 'râpage',
        'râpée': 'râpage',
        'haché': 'hachage',
        'hachée': 'hachage',
        'cuit': 'cuisson',
        'cuite': 'cuisson',
        'grillé': 'grillage',
        'grillée': 'grillage',
        'congelé': 'congélation',
        'congelée': 'congélation',
        'mariné': 'marinade',
        'marinée': 'marinade',
        'dessalé': 'dessalage',
        'dessalée': 'dessalage',
        'concentré': 'concentration',
        'concassé': 'concassage',
    }
    
    for keyword, process in transformations.items():
        if keyword in name_lower:
            # C'est un archetype avec transformation
            return ('archetype', name, guess_category(name), f'Transformation ({process})')
    
    # 2. ARCHETYPES - Préparations composées
    if any(kw in name_lower for kw in [
        'huile d\'', 'huile de',
        'jus de',
        'sauce ', 
        'vinaigre de',
        'sirop de',
        'purée de',
        'crème de',
        'farine de',
        'bouillon',
        'fond de',
        'fumet'
    ]):
        return ('archetype', name, guess_category(name), 'Préparation composée')
    
    # 3. ÉPICES - ATTENTION ICI!
    # Épice de BASE (grain, entière) = CANONICAL
    # Épice TRANSFORMÉE (moulu, poudre) = ARCHETYPE (déjà pris en charge ci-dessus)
    # Mélange d'épices = ARCHETYPE
    
    melange_epices = ['quatre-épice', 'quatre épice', 'cinq épice', 
                      'herbes de provence', 'garam masala', 'ras el hanout',
                      'curry', 'mélange']
    
    if any(mel in name_lower for mel in melange_epices):
        return ('archetype', name, 10, 'Mélange d\'épices')
    
    # Sinon, épices = CANONICAL (cumin entier, cannelle bâton, paprika, etc.)
    # On ne fait RIEN ici, ça tombera dans "aliment de base" plus bas
    
    # 4. ARCHETYPES - Produits laitiers transformés
    if any(kw in name_lower for kw in ['crème fraîche', 'crème liquide', 'crème épaisse']):
        return ('archetype', name, 7, 'Produit laitier transformé')
    
    # 5. ARCHETYPES - Fromages râpés
    if 'râpé' in name_lower and 'fromage' in name_lower:
        return ('archetype', name, 7, 'Fromage transformé (râpé)')
    
    # 6. ARCHETYPES - Pains spéciaux (pain de mie, pain complet, etc.)
    if name_lower.startswith('pain ') or name_lower.startswith('pain d\''):
        return ('archetype', name, 5, 'Type de pain spécifique')
    
    # 7. ARCHETYPES - Autres préparations
    if any(kw in name_lower for kw in [
        'feuille de brick', 'feuilles de brick',
        'chapelure', 'panko',
        'bacon', 'lardons', 'jambon'
    ]):
        return ('archetype', name, guess_category(name), 'Produit préparé')
    
    # 8. Skip - Cultivars spécifiques
    if any(cult in name for cult in ['Arborio', 'Padrón', 'pimiento de Padrón']):
        return ('skip', name, None, f'Cultivar spécifique à créer manuellement: {original}')
    
    # 9. Skip - Marques
    if 'St Môret' in name or 'st moret' in name_lower:
        return ('skip', name, None, 'Marque commerciale')
    
    # === SINON: CANONICAL (aliment de base) ===
    return ('canonical', name, guess_category(name), 'Aliment de base')

def guess_category(name):
    """Devine la catégorie"""
    name_lower = name.lower()
    
    # Légumes
    if any(v in name_lower for v in ['ail', 'oignon', 'échalote', 'poireau',
                                      'carotte', 'tomate', 'poivron', 'piment',
                                      'courgette', 'aubergine', 'concombre',
                                      'céleri', 'navet', 'radis', 'betterave',
                                      'chou', 'brocoli', 'épinard', 'salade',
                                      'légume', 'haricot vert', 'petit pois']):
        return 2
    
    # Fruits
    if any(f in name_lower for f in ['citron', 'orange', 'lime', 'pamplemousse',
                                      'pomme', 'poire', 'banane', 'mangue',
                                      'fraise', 'framboise', 'myrtille', 'cerise',
                                      'abricot', 'pêche', 'prune', 'figue',
                                      'fruit']):
        return 1
    
    # Champignons
    if 'champignon' in name_lower or 'cèpe' in name_lower or 'morille' in name_lower:
        return 3
    
    # Viandes/Poissons
    if any(m in name_lower for m in ['boeuf', 'veau', 'porc', 'agneau', 'poulet',
                                      'canard', 'dinde', 'jambon', 'bacon', 'lardons',
                                      'poisson', 'saumon', 'thon', 'cabillaud', 'truite',
                                      'crevette', 'moule', 'calmar', 'viande']):
        return 9
    
    # Herbes et épices
    if any(h in name_lower for h in ['basilic', 'persil', 'coriandre', 'menthe',
                                      'thym', 'romarin', 'laurier', 'origan',
                                      'cumin', 'paprika', 'cannelle', 'muscade',
                                      'gingembre', 'safran', 'curry', 'poivre',
                                      'herbe', 'épice']):
        return 10
    
    # Laitiers
    if any(l in name_lower for l in ['lait', 'crème', 'beurre', 'fromage', 'yaourt',
                                      'mascarpone', 'ricotta', 'mozzarella', 'parmesan']):
        return 7
    
    # Céréales
    if any(c in name_lower for c in ['farine', 'pain', 'riz', 'pâtes', 'blé',
                                      'avoine', 'orge', 'semoule', 'quinoa',
                                      'couscous', 'pois chiche', 'lentille']):
        return 5
    
    # Huiles
    if 'huile' in name_lower:
        return 11
    
    # Par défaut: Autres
    return 14

def main():
    print("=== EXTRACTION ET CLASSIFICATION V5 ===\n")
    
    # Charger données existantes
    canonical_exist, archetypes_exist, recipes_exist = load_existing_data()
    print(f"✓ {len(canonical_exist)} canonical_foods existants")
    print(f"✓ {len(archetypes_exist)} archetypes existants")
    print(f"✓ {len(recipes_exist)} recipes existantes\n")
    
    # Extraire ingrédients bruts
    raw_ingredients = extract_raw_ingredients()
    print(f"✓ {len(raw_ingredients)} ingrédients uniques extraits\n")
    
    # Classifier
    to_create_canonical = {}
    to_create_archetype = {}
    already_exist = []
    skipped = []
    
    for ing_name, count in sorted(raw_ingredients.items(), key=lambda x: -x[1]):
        action, cleaned, category, notes = clean_and_classify(
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
    with open('INSERT_INGREDIENTS_FINAL_V5.sql', 'w', encoding='utf-8') as f:
        f.write("-- ======================================================\n")
        f.write("-- INSERTION DES INGRÉDIENTS MANQUANTS - VERSION 5\n")
        f.write("-- ======================================================\n")
        f.write("-- CORRECTIONS MAJEURES:\n")
        f.write("-- • Pain de mie ≠ pain (archétypes séparés)\n")
        f.write("-- • Épices de base = canonical (cumin, cannelle, paprika)\n")
        f.write("-- • Épices transformées = archetype (cumin moulu)\n")
        f.write("-- • Flocons d'avoine = archetype\n")
        f.write("-- ======================================================\n\n")
        
        f.write("BEGIN;\n\n")
        
        # CANONICAL FOODS
        f.write("-- ======================================================\n")
        f.write("-- CANONICAL FOODS\n")
        f.write("-- ======================================================\n\n")
        
        for key in sorted(to_create_canonical.keys()):
            item = to_create_canonical[key]
            f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO canonical_foods (canonical_name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # ARCHETYPES
        f.write("\n-- ======================================================\n")
        f.write("-- ARCHETYPES\n")
        f.write("-- ======================================================\n\n")
        
        for key in sorted(to_create_archetype.keys()):
            item = to_create_archetype[key]
            f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO archetypes (name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n")
    
    # Rapport
    with open('RAPPORT_INGREDIENTS_V5.txt', 'w', encoding='utf-8') as f:
        f.write("=== RAPPORT CLASSIFICATION V5 ===\n\n")
        
        f.write(f"TOTAL: {len(raw_ingredients)} ingrédients uniques\n")
        f.write(f"À CRÉER (canonical): {len(to_create_canonical)}\n")
        f.write(f"À CRÉER (archetype): {len(to_create_archetype)}\n")
        f.write(f"DÉJÀ EXISTANTS: {len(already_exist)}\n")
        f.write(f"IGNORÉS: {len(skipped)}\n\n")
        
        f.write("=== IGNORÉS ===\n")
        for ing, count, reason in sorted(skipped, key=lambda x: -x[1]):
            f.write(f"{count:3}x {ing:40} -> {reason}\n")
        
        f.write("\n=== CANONICAL À CRÉER ===\n")
        for key in sorted(to_create_canonical.keys(), key=lambda k: -to_create_canonical[k]['count']):
            item = to_create_canonical[key]
            f.write(f"{item['count']:3}x {item['name']:40} cat={item['category']} -> {item['notes']}\n")
        
        f.write("\n=== ARCHETYPES À CRÉER ===\n")
        for key in sorted(to_create_archetype.keys(), key=lambda k: -to_create_archetype[k]['count']):
            item = to_create_archetype[key]
            f.write(f"{item['count']:3}x {item['name']:40} cat={item['category']} -> {item['notes']}\n")
    
    print("✅ Fichiers générés:")
    print("   - INSERT_INGREDIENTS_FINAL_V5.sql")
    print("   - RAPPORT_INGREDIENTS_V5.txt")

if __name__ == '__main__':
    main()
