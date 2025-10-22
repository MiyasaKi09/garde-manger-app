#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VERSION 8 - MAPPING MANUEL COMPLET
Basé sur l'analyse individuelle de chaque ingrédient
"""

import csv
from collections import defaultdict
from difflib import SequenceMatcher

# MAPPING MANUEL - chaque ingrédient analysé individuellement
MANUAL_MAPPING = {
    # Beurres - PRODUIT LAITIER TRANSFORMÉ (barattage) → ARCHETYPE
    'beurre': ('beurre', 'archetype', 7, 'Produit laitier transformé (barattage)'),
    'beurre fondu': ('beurre', 'archetype', 7, 'État temporaire → beurre'),
    'beurre mou': ('beurre', 'archetype', 7, 'État temporaire → beurre'),
    'beurre de tourage': ('beurre', 'archetype', 7, 'Trop spécifique → beurre'),
    'beurre salé': ('beurre salé', 'archetype', 7, 'Beurre avec sel ajouté'),
    'beurre noisette': ('beurre noisette', 'archetype', 7, 'Beurre cuit'),
    
    # Farines - GRAIN MOULU → ARCHETYPE
    'farine': ('farine', 'archetype', 5, 'Céréale moulue'),
    'farine T45': ('farine', 'archetype', 5, 'Type trop précis'),
    'farine T65': ('farine', 'archetype', 5, 'Type trop précis'),
    'farine de sarrasin': ('farine de sarrasin', 'archetype', 5, 'Sarrasin moulu'),
    
    # Sucres
    'sucre': ('sucre', 'canonical', 14, 'Base'),
    'sucre blanc': ('sucre', 'canonical', 14, 'Couleur inutile'),
    'sucre glace': ('sucre glace', 'canonical', 14, 'Forme différente'),
    'sucre semoule': ('sucre', 'canonical', 14, 'Granulation'),
    'cassonade': ('cassonade', 'canonical', 14, 'Type différent'),
    'sucre brun': ('cassonade', 'canonical', 14, 'Synonyme'),
    
    # Œufs
    'oeufs': ('oeuf', 'canonical', 7, 'Singulariser'),
    'oeuf': ('oeuf', 'canonical', 7, 'Base'),
    'œuf': ('oeuf', 'canonical', 7, 'Normaliser'),
    'œufs': ('oeuf', 'canonical', 7, 'Singulariser'),
    'oeufs (4 gros)': ('oeuf', 'canonical', 7, 'Retirer quantité'),
    'oeufs entiers': ('oeuf', 'canonical', 7, 'Adjectif inutile'),
    'jaunes d\'oeufs': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaune d\'oeuf': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaunes d\'œufs': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'jaune d\'œuf': ('jaune d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'blancs d\'oeufs': ('blanc d\'oeuf', 'archetype', 7, 'Partie séparée'),
    'blanc d\'oeuf': ('blanc d\'oeuf', 'archetype', 7, 'Partie séparée'),
    
    # Ail
    'ail': ('ail', 'canonical', 2, 'Base'),
    'gousses d\'ail': ('ail', 'canonical', 2, 'Retirer unité'),
    'gousse d\'ail': ('ail', 'canonical', 2, 'Retirer unité'),
    'ail en poudre': ('ail en poudre', 'archetype', 2, 'Transformation'),
    
    # Légumes - retirer adjectifs inutiles, singulariser
    'oignon': ('oignon', 'canonical', 2, 'Base'),
    'oignons': ('oignon', 'canonical', 2, 'Singulariser'),
    'carotte': ('carotte', 'canonical', 2, 'Base'),
    'carottes': ('carotte', 'canonical', 2, 'Singulariser'),
    'tomate': ('tomate', 'canonical', 2, 'Base'),
    'tomates': ('tomate', 'canonical', 2, 'Singulariser'),
    'tomates mûres': ('tomate', 'canonical', 2, 'Retirer adjectif'),
    'tomates pelées': ('tomate pelée', 'archetype', 2, 'Transformation'),
    'tomates concassées': ('tomate concassée', 'archetype', 2, 'Transformation'),
    'tomates cerises': ('tomate cerise', 'canonical', 2, 'Variété'),
    'pommes de terre': ('pomme de terre', 'canonical', 2, 'Base'),
    'pomme de terre': ('pomme de terre', 'canonical', 2, 'Base'),
    'poireau': ('poireau', 'canonical', 2, 'Base'),
    'poireaux': ('poireau', 'canonical', 2, 'Singulariser'),
    'céleri': ('céleri', 'canonical', 2, 'Base'),
    'branche de céleri': ('céleri', 'canonical', 2, 'Retirer unité'),
    'poivron rouge': ('poivron rouge', 'canonical', 2, 'Couleur importante'),
    'poivron': ('poivron', 'canonical', 2, 'Base'),
    'poivrons': ('poivron', 'canonical', 2, 'Singulariser'),
    'courgette': ('courgette', 'canonical', 2, 'Base'),
    'courgettes': ('courgette', 'canonical', 2, 'Singulariser'),
    'concombre': ('concombre', 'canonical', 2, 'Base'),
    'piment': ('piment', 'canonical', 2, 'Base'),
    'piment d\'Espelette': ('piment d\'Espelette', 'canonical', 2, 'Variété'),
    'aubergine': ('aubergine', 'canonical', 2, 'Base'),
    'aubergines': ('aubergine', 'canonical', 2, 'Singulariser'),
    'épinard': ('épinard', 'canonical', 2, 'Base'),
    'épinards': ('épinard', 'canonical', 2, 'Singulariser'),
    'épinards frais': ('épinard', 'canonical', 2, 'Retirer adjectif'),
    'échalote': ('échalote', 'canonical', 2, 'Base'),
    'échalotes': ('échalote', 'canonical', 2, 'Singulariser'),
    'artichaut': ('artichaut', 'canonical', 2, 'Base'),
    'artichauts violets moyens': ('artichaut violet', 'canonical', 2, 'Retirer taille'),
    
    # Champignons
    'champignon': ('champignon', 'canonical', 3, 'Base'),
    'champignons': ('champignon', 'canonical', 3, 'Singulariser'),
    'champignons de Paris': ('champignon de Paris', 'canonical', 3, 'Variété'),
    'champignons noirs': ('champignon', 'canonical', 3, 'Couleur inutile → champignon'),
    
    # Herbes - retirer "frais"
    'basilic': ('basilic', 'canonical', 10, 'Base'),
    'basilic frais': ('basilic', 'canonical', 10, 'Retirer adjectif'),
    'persil': ('persil', 'canonical', 10, 'Base'),
    'persil frais': ('persil', 'canonical', 10, 'Retirer adjectif'),
    'persil haché': ('persil haché', 'archetype', 10, 'Transformation'),
    'coriandre': ('coriandre', 'canonical', 10, 'Base'),
    'coriandre fraîche': ('coriandre', 'canonical', 10, 'Retirer adjectif'),
    'coriandre moulue': ('coriandre moulue', 'archetype', 10, 'Transformation'),
    'aneth frais': ('aneth', 'canonical', 10, 'Retirer adjectif'),
    'thym': ('thym', 'canonical', 10, 'Base'),
    'branches de thym': ('thym', 'canonical', 10, 'Retirer unité'),
    'branche de thym': ('thym', 'canonical', 10, 'Retirer unité'),
    'laurier': ('laurier', 'canonical', 10, 'Base'),
    'feuille de laurier': ('laurier', 'canonical', 10, 'Retirer unité'),
    'feuilles de laurier': ('laurier', 'canonical', 10, 'Retirer unité'),
    
    # Épices - RÉFLEXION:
    # Cumin = graine brute → CANONICAL
    # Cannelle = écorce séchée → déjà transformation → ARCHETYPE
    # Paprika = piment séché et moulu → ARCHETYPE
    # Muscade = noix brute → CANONICAL (entière), moulue → ARCHETYPE
    # Curcuma = rhizome séché et moulu → ARCHETYPE
    # Origan = herbe séchée → ARCHETYPE
    # Gingembre = rhizome frais → CANONICAL (si frais), en poudre → ARCHETYPE
    
    'cumin': ('cumin', 'canonical', 10, 'Graine brute'),
    'cumin moulu': ('cumin moulu', 'archetype', 10, 'Graine moulue'),
    'cannelle': ('cannelle', 'archetype', 10, 'Écorce séchée'),
    'paprika': ('paprika', 'archetype', 10, 'Piment séché et moulu'),
    'paprika fumé': ('paprika fumé', 'archetype', 10, 'Piment séché, moulu et fumé'),
    'muscade': ('muscade', 'canonical', 10, 'Noix entière'),
    'noix de muscade': ('muscade', 'canonical', 10, 'Noix entière'),
    'curcuma': ('curcuma', 'archetype', 10, 'Rhizome séché et moulu'),
    'origan': ('origan', 'archetype', 10, 'Herbe séchée'),
    'gingembre': ('gingembre', 'canonical', 10, 'Rhizome frais'),
    
    # Mélanges d'épices
    'herbes de Provence': ('herbes de Provence', 'archetype', 10, 'Mélange'),
    'curry': ('curry', 'archetype', 10, 'Mélange'),
    'garam masala': ('garam masala', 'archetype', 10, 'Mélange'),
    
    # Huiles - EXTRACTION/PRESSAGE → ARCHETYPE
    'huile': ('huile', 'archetype', 11, 'Extraction (générique)'),
    'huile d\'olive': ('huile d\'olive', 'archetype', 11, 'Extraction olive'),
    'huile de friture': ('huile de friture', 'archetype', 11, 'Huile pour usage spécifique'),
    'huile végétale': ('huile végétale', 'archetype', 11, 'Extraction végétale'),
    'huile de sésame': ('huile de sésame', 'archetype', 11, 'Extraction sésame'),
    
    # Jus - EXTRACTION → ARCHETYPE
    'jus de citron': ('jus de citron', 'archetype', 1, 'Extraction citron'),
    
    # Crèmes (produits laitiers transformés = archetype)
    'crème': ('crème', 'archetype', 7, 'Produit laitier transformé'),
    'crème fraîche': ('crème fraîche', 'archetype', 7, 'Produit laitier transformé'),
    'crème liquide': ('crème liquide', 'archetype', 7, 'Produit laitier transformé'),
    
    # Fromages
    'parmesan': ('parmesan', 'canonical', 7, 'Fromage brut'),
    'parmesan râpé': ('parmesan râpé', 'archetype', 7, 'Transformation'),
    'fromage râpé': ('fromage râpé', 'archetype', 7, 'Transformation'),
    'gruyère râpé': ('gruyère râpé', 'archetype', 7, 'Transformation'),
    
    # Sauces et bouillons (préparations = archetype)
    'sauce soja': ('sauce soja', 'archetype', 14, 'Préparation'),
    'bouillon': ('bouillon', 'archetype', 14, 'Préparation'),
    'bouillon de boeuf': ('bouillon de boeuf', 'archetype', 9, 'Préparation'),
    'concentré de tomate': ('concentré de tomate', 'archetype', 2, 'Concentration'),
    'concentré de tomates': ('concentré de tomate', 'archetype', 2, 'Concentration'),
    'sauce béchamel': ('sauce béchamel', 'archetype', 7, 'Préparation'),
    'fond de veau': ('fond de veau', 'archetype', 9, 'Préparation'),
    
    # Céréales transformées
    'flocons d\'avoine': ('flocon d\'avoine', 'archetype', 5, 'Transformation'),
    'flocon d\'avoine': ('flocon d\'avoine', 'archetype', 5, 'Transformation'),
    'chapelure': ('chapelure', 'archetype', 5, 'Transformation'),
    'vermicelles de riz': ('vermicelle de riz', 'archetype', 5, 'Pâtes'),
    
    # Pains (tous archetype - cuisson)
    'pain': ('pain', 'archetype', 5, 'Pain cuit'),
    'pain de mie': ('pain de mie', 'archetype', 5, 'Pain cuit'),
    'pain de campagne': ('pain de campagne', 'archetype', 5, 'Pain cuit'),
    'baguette': ('baguette', 'archetype', 5, 'Pain cuit'),
    
    # Viandes transformées
    'boeuf': ('boeuf', 'canonical', 9, 'Viande brute'),
    'boeuf haché': ('boeuf haché', 'archetype', 9, 'Transformation'),
    
    # Charcuterie
    'bacon': ('bacon', 'archetype', 9, 'Charcuterie'),
    'saumon fumé': ('saumon fumé', 'archetype', 9, 'Fumage'),
    'andouillettes de Troyes': ('andouillette', 'archetype', 9, 'Charcuterie'),
    
    # Pâte
    'pâte feuilletée': ('pâte feuilletée', 'archetype', 14, 'Préparation'),
    
    # Autres
    'miel': ('miel', 'canonical', 14, 'Produit naturel'),
    'sirop d\'érable': ('sirop d\'érable', 'canonical', 14, 'Extraction naturelle'),
    'bicarbonate': ('bicarbonate', 'canonical', 14, 'Produit brut'),
    'levure': ('levure', 'canonical', 14, 'Produit brut'),
    'levure chimique': ('levure chimique', 'canonical', 14, 'Produit brut'),
    'eau': ('eau', 'canonical', 14, 'Liquide brut'),
    'lait': ('lait', 'canonical', 7, 'Produit brut'),
    'lait de coco': ('lait de coco', 'archetype', 7, 'Extraction'),
    'moutarde': ('moutarde', 'canonical', 14, 'Condiment brut'),
    'bouquet garni': ('bouquet garni', 'canonical', 10, 'Assemblage standard'),
    'moules': ('moule', 'canonical', 9, 'Singulariser'),
    'pommes': ('pomme', 'canonical', 1, 'Singulariser'),
    'pomme': ('pomme', 'canonical', 1, 'Fruit'),
    'citron': ('citron', 'canonical', 1, 'Fruit'),
    'citrons': ('citron', 'canonical', 1, 'Singulariser'),
    'yaourt grec': ('yaourt grec', 'canonical', 7, 'Produit laitier'),
    'yaourt nature': ('yaourt', 'canonical', 7, 'Produit laitier'),
    'salade': ('salade', 'canonical', 2, 'Légume'),
    'riz': ('riz', 'canonical', 5, 'Céréale'),
    'vin blanc': ('vin blanc', 'canonical', 14, 'Produit'),
    'vin blanc sec': ('vin blanc', 'canonical', 14, 'Retirer adjectif'),
}

def load_existing_data():
    canonical = {}
    with open('../supabase/exports/latest/csv/canonical_foods.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            canonical[row['canonical_name'].lower().strip()] = row['id']
    
    archetypes = {}
    with open('../supabase/exports/latest/csv/archetypes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            archetypes[row['name'].lower().strip()] = row['id']
    
    return canonical, archetypes

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

def main():
    print("=== VERSION 8 - MAPPING MANUEL ===\n")
    
    canonical_exist, archetypes_exist = load_existing_data()
    raw_ingredients = extract_raw_ingredients()
    
    to_create_canonical = {}
    to_create_archetype = {}
    already_exist = []
    not_mapped = []
    
    for ing_name, count in sorted(raw_ingredients.items(), key=lambda x: -x[1]):
        ing_lower = ing_name.lower()
        
        # Existe déjà ?
        if ing_lower in canonical_exist or ing_lower in archetypes_exist:
            already_exist.append((ing_name, count))
            continue
        
        # Mapping manuel
        if ing_lower in MANUAL_MAPPING:
            final_name, type_ing, category, notes = MANUAL_MAPPING[ing_lower]
            
            # Re-vérifier après mapping
            if final_name.lower() in canonical_exist or final_name.lower() in archetypes_exist:
                already_exist.append((ing_name, count))
                continue
            
            if type_ing == 'canonical':
                key = final_name.lower()
                if key not in to_create_canonical:
                    to_create_canonical[key] = {
                        'name': final_name,
                        'category': category,
                        'count': count,
                        'notes': notes,
                        'original': ing_name
                    }
            else:
                key = final_name.lower()
                if key not in to_create_archetype:
                    to_create_archetype[key] = {
                        'name': final_name,
                        'category': category,
                        'count': count,
                        'notes': notes,
                        'original': ing_name
                    }
        else:
            not_mapped.append((ing_name, count))
    
    print(f"✓ {len(to_create_canonical)} canonical")
    print(f"✓ {len(to_create_archetype)} archetypes")
    print(f"✓ {len(already_exist)} existants")
    print(f"✗ {len(not_mapped)} NON MAPPÉS (à traiter manuellement)\n")
    
    # Afficher non mappés
    if not_mapped:
        print("⚠️  INGRÉDIENTS NON MAPPÉS:")
        for ing, count in sorted(not_mapped, key=lambda x: -x[1])[:30]:
            print(f"  {count:3}x {ing}")
        print()
    
    # SQL
    with open('INSERT_INGREDIENTS_FINAL_V8.sql', 'w', encoding='utf-8') as f:
        f.write("-- VERSION 8 - MAPPING MANUEL COMPLET\n\n")
        f.write("BEGIN;\n\n")
        
        f.write("-- CANONICAL FOODS\n\n")
        for key in sorted(to_create_canonical.keys()):
            item = to_create_canonical[key]
            if item['original'].lower() != item['name'].lower():
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']} [de: {item['original']}]\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO canonical_foods (canonical_name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        f.write("\n-- ARCHETYPES\n\n")
        for key in sorted(to_create_archetype.keys()):
            item = to_create_archetype[key]
            if item['original'].lower() != item['name'].lower():
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']} [de: {item['original']}]\n")
            else:
                f.write(f"-- {item['name']} ({item['count']}x) - {item['notes']}\n")
            f.write(f"INSERT INTO archetypes (name, category_id)\n")
            f.write(f"VALUES ('{item['name']}', {item['category']})\n")
            f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        f.write("COMMIT;\n")
    
    print("✅ INSERT_INGREDIENTS_FINAL_V8.sql généré")

if __name__ == '__main__':
    main()
