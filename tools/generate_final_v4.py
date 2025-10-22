#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION FINALE - ULTRA PRÉCISE
Correction de TOUS les problèmes identifiés
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
    
    corrections = {
        "gousse d'ail": ('ail', 'canonical', 2),
        "gousses d'ail": ('ail', 'canonical', 2),
        "jaune d'oeuf": ('oeuf', 'archetype', 7),
        "jaunes d'oeuf": ('oeuf', 'archetype', 7),
        "jaune d'œuf": ('oeuf', 'archetype', 7),
        "jaunes d'œuf": ('oeuf', 'archetype', 7),
        "blanc d'oeuf": ('oeuf', 'archetype', 7),
        "blancs d'oeuf": ('oeuf', 'archetype', 7),
        'basilic frais': ('basilic', 'canonical', 10),
        'persil frais': ('persil', 'canonical', 10),
        'coriandre fraîche': ('coriandre', 'canonical', 10),
        "flocon d'avoine": ('avoine', 'archetype', 5),
        "flocons d'avoine": ('avoine', 'archetype', 5),
        'pain de mie': ('pain', 'archetype', 5),
        'pois chiches sec': ('pois chiche', 'canonical', 5),
        'pois chiche sec': ('pois chiche', 'canonical', 5),
        'nuoc-mâm': ('nuoc mam', 'canonical', 14),
        'chip de maï': ('maïs', 'archetype', 5),
        'chips de maïs': ('maïs', 'archetype', 5),
        'fécule de maï': ('maïs', 'archetype', 5),
        'sherry': ('xérès', 'canonical', 14),
        'ail (facultatif)': ('ail', 'canonical', 2),
        'poireau': ('poireau', 'canonical', 2),
        'poireal': ('poireau', 'canonical', 2),
        'cive': ('ciboulette', 'canonical', 10),
        'saumon frais': ('saumon', 'canonical', 9),
        'figue fraîche': ('figue', 'canonical', 1),
    }
    
    name_lower = name.lower()
    if name_lower in corrections:
        corrected_name, type_ing, cat = corrections[name_lower]
        return (type_ing, corrected_name, cat, f'Correction: {original} → {corrected_name}')
    
    # === RÈGLES DE CLASSIFICATION ===
    
    # 1. ARCHETYPES - Transformations explicites
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
            # Retirer le mot de transformation pour trouver la base
            base = re.sub(rf'\b{keyword}\b', '', name, flags=re.IGNORECASE).strip()
            base = re.sub(r'\s+', ' ', base)
            return ('archetype', name, guess_category(base), f'Transformation ({process}): {base}')
    
    # 2. ARCHETYPES - Préparations
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
    
    # 3. ARCHETYPES - Épices (sauf grains)
    if 'grain' not in name_lower and any(spice in name_lower for spice in [
        'cumin', 'paprika', 'curry', 'cannelle', 'muscade',
        'safran', 'curcuma', 'gingembre', 'cardamome',
        'poivre noir', 'poivre blanc', 'poivre moulu',
        'cayenne', 'espelette', 'piment',
        'quatre-épice', 'cinq épice', 'herbes de provence',
        'garam masala', 'ras el hanout'
    ]):
        return ('archetype', name, 10, 'Épice/mélange')
    
    # 4. ARCHETYPES - Produits laitiers transformés
    if any(kw in name_lower for kw in ['crème fraîche', 'crème liquide', 'crème épaisse']):
        return ('archetype', name, 7, 'Produit laitier transformé')
    
    # 5. ARCHETYPES - Types spécifiques (fromages transformés, pains spéciaux)
    if any(kw in name_lower for kw in [
        'fromage râpé', 'parmesan râpé', 'gruyère râpé',
        'pain de', 'pain d\'',
        'feuille de brick', 'feuilles de brick',
        'chapelure', 'panko'
    ]):
        return ('archetype', name, guess_category(name), 'Forme/préparation spécifique')
    
    # 6. ARCHETYPES - Viandes préparées
    if any(kw in name_lower for kw in ['bacon', 'lardons', 'jambon']):
        return ('archetype', name, 9, 'Viande préparée')
    
    # 7. Skip - Cultivars spécifiques (à gérer séparément)
    if any(cult in name for cult in ['Arborio', 'Padrón', 'pimiento de Padrón']):
        return ('skip', name, None, f'Cultivar spécifique à créer manuellement: {original}')
    
    # 8. Skip - Marques
    if 'St Môret' in name or 'st moret' in name_lower:
        return ('skip', name, None, 'Marque commerciale')
    
    # === SINON: CANONICAL ===
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
                                      'légume']):
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
    if any(m in name_lower for m in ['boeuf', 'bœuf', 'veau', 'porc', 'agneau',
                                      'poulet', 'canard', 'dinde',
                                      'saumon', 'thon', 'cabillaud', 'morue',
                                      'crevette', 'calmar', 'moule',
                                      'viande', 'poisson']):
        return 9
    
    # Laitiers
    if any(d in name_lower for d in ['lait', 'crème', 'beurre', 'yaourt',
                                      'fromage', 'mozzarella', 'parmesan',
                                      'gruyère', 'comté', 'chèvre', 'feta']):
        return 7
    
    # Céréales/Féculents
    if any(c in name_lower for c in ['farine', 'pain', 'riz', 'pâtes', 'nouilles',
                                      'avoine', 'blé', 'semoule', 'quinoa',
                                      'boulgour', 'maïs', 'polenta']):
        return 5
    
    # Herbes/Épices
    if any(h in name_lower for h in ['basilic', 'persil', 'coriandre', 'menthe',
                                      'thym', 'romarin', 'laurier', 'aneth',
                                      'ciboulette', 'estragon', 'origan',
                                      'cumin', 'paprika', 'curry', 'safran',
                                      'cannelle', 'muscade', 'poivre', 'sel',
                                      'piment', 'gingembre']):
        return 10
    
    # Huiles
    if 'huile' in name_lower:
        return 11
    
    # Légumineuses
    if any(l in name_lower for l in ['pois chiche', 'lentille', 'haricot']):
        return 5
    
    return 14  # Autres

def main():
    print("=" * 80)
    print("GÉNÉRATION SQL FINALE - VERSION ULTRA PRÉCISE")
    print("=" * 80)
    print()
    
    # Charger données existantes
    print("📂 Chargement des données existantes...")
    canonical_exist, archetypes_exist, recipes_exist = load_existing_data()
    print(f"   ✓ {len(canonical_exist)} canonical_foods")
    print(f"   ✓ {len(archetypes_exist)} archetypes")
    print(f"   ✓ {len(recipes_exist)} recipes")
    print()
    
    # Extraire ingrédients
    print("📝 Extraction des ingrédients...")
    raw_ingredients = extract_raw_ingredients()
    print(f"   ✓ {len(raw_ingredients)} ingrédients bruts")
    print()
    
    # Classifier
    print("🔍 Classification et nettoyage...")
    
    to_add_canonical = {}
    to_add_archetypes = {}
    skipped = []
    exists = []
    
    for ing_name, count in raw_ingredients.items():
        action, cleaned, category, notes = clean_and_classify(
            ing_name, canonical_exist, archetypes_exist, recipes_exist
        )
        
        if action == 'skip':
            skipped.append({'original': ing_name, 'reason': notes, 'count': count})
        
        elif action == 'exists':
            exists.append({'name': ing_name, 'count': count})
        
        elif action == 'canonical':
            if cleaned not in to_add_canonical:
                to_add_canonical[cleaned] = {
                    'originals': [],
                    'category': category,
                    'count': 0
                }
            to_add_canonical[cleaned]['originals'].append(ing_name)
            to_add_canonical[cleaned]['count'] += count
        
        elif action == 'archetype':
            if cleaned not in to_add_archetypes:
                to_add_archetypes[cleaned] = {
                    'originals': [],
                    'category': category,
                    'count': 0,
                    'notes': notes
                }
            to_add_archetypes[cleaned]['originals'].append(ing_name)
            to_add_archetypes[cleaned]['count'] += count
    
    print(f"   ✓ {len(to_add_canonical)} canonical_foods à créer")
    print(f"   ✓ {len(to_add_archetypes)} archetypes à créer")
    print(f"   ✓ {len(exists)} déjà existants")
    print(f"   ✓ {len(skipped)} ignorés")
    print()
    
    # Générer SQL
    print("💾 Génération du fichier SQL...")
    
    with open('INSERT_INGREDIENTS_FINAL_V4.sql', 'w', encoding='utf-8') as f:
        f.write("-- ========================================\n")
        f.write("-- INSERTION INGRÉDIENTS MANQUANTS - V4 FINALE\n")
        f.write("-- Classification précise et vérifiée\n")
        f.write("-- ========================================\n\n")
        f.write("BEGIN;\n\n")
        
        # Canonical foods
        if to_add_canonical:
            f.write("-- ========================================\n")
            f.write("-- CANONICAL FOODS (Aliments de base)\n")
            f.write(f"-- {len(to_add_canonical)} ingrédients\n")
            f.write("-- ========================================\n\n")
            
            for name in sorted(to_add_canonical.keys(), 
                             key=lambda x: to_add_canonical[x]['count'], 
                             reverse=True):
                info = to_add_canonical[name]
                name_esc = name.replace("'", "''")
                
                f.write(f"-- {name} (utilisé {info['count']}x)\n")
                if len(info['originals']) > 1:
                    f.write(f"-- Variantes: {', '.join(set(info['originals']))}\n")
                f.write(f"INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)\n")
                f.write(f"VALUES ('{name_esc}', {info['category']}, NOW(), NOW())\n")
                f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # Archetypes
        if to_add_archetypes:
            f.write("\n-- ========================================\n")
            f.write("-- ARCHETYPES (Transformations/Préparations)\n")
            f.write(f"-- {len(to_add_archetypes)} ingrédients\n")
            f.write("-- ========================================\n\n")
            
            for name in sorted(to_add_archetypes.keys(),
                             key=lambda x: to_add_archetypes[x]['count'],
                             reverse=True):
                info = to_add_archetypes[name]
                name_esc = name.replace("'", "''")
                
                f.write(f"-- {name} (utilisé {info['count']}x)\n")
                f.write(f"-- Type: {info['notes']}\n")
                if len(info['originals']) > 1:
                    f.write(f"-- Variantes: {', '.join(set(info['originals']))}\n")
                f.write(f"INSERT INTO archetypes (name, created_at, updated_at)\n")
                f.write(f"VALUES ('{name_esc}', NOW(), NOW())\n")
                f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n\n")
        f.write(f"-- Total: {len(to_add_canonical)} canonical + {len(to_add_archetypes)} archetypes\n")
    
    # Rapport
    with open('RAPPORT_INGREDIENTS_V4.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("RAPPORT FINAL - CLASSIFICATION DES INGRÉDIENTS V4\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Total ingrédients bruts: {len(raw_ingredients)}\n")
        f.write(f"Canonical à créer: {len(to_add_canonical)}\n")
        f.write(f"Archetypes à créer: {len(to_add_archetypes)}\n")
        f.write(f"Déjà existants: {len(exists)}\n")
        f.write(f"Ignorés: {len(skipped)}\n\n")
        
        if skipped:
            f.write("\n" + "=" * 80 + "\n")
            f.write("INGRÉDIENTS IGNORÉS\n")
            f.write("=" * 80 + "\n\n")
            for item in sorted(skipped, key=lambda x: x['count'], reverse=True):
                f.write(f"• {item['original']} ({item['count']}x)\n")
                f.write(f"  → {item['reason']}\n\n")
    
    print(f"✅ Fichiers créés:")
    print(f"   📄 INSERT_INGREDIENTS_FINAL_V4.sql")
    print(f"   📄 RAPPORT_INGREDIENTS_V4.txt")
    print()
    print("🚀 Pour exécuter:")
    print("   psql \"$DATABASE_URL_TX\" -f INSERT_INGREDIENTS_FINAL_V4.sql")

if __name__ == '__main__':
    main()
