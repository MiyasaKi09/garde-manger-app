#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyse tous les ingrédients des recettes et génère le SQL
pour créer les canonical_foods et archetypes manquants
VERSION 2 - Corrigée selon les remarques
"""

import csv
import re
from collections import defaultdict

def singularize(word):
    """Convertit un mot au singulier (règles simples français)"""
    word = word.strip()
    
    # Cas spéciaux
    special_cases = {
        'oeufs': 'oeuf',
        'œufs': 'œuf',
        'yeux': 'oeil',
        'noix': 'noix',
        'pois': 'pois',
        'épinards': 'épinard',
    }
    
    if word.lower() in special_cases:
        return special_cases[word.lower()]
    
    # Règles générales
    if word.endswith('aux'):
        return word[:-3] + 'al'
    elif word.endswith('oux'):
        return word[:-3] + 'ou'
    elif word.endswith('eux'):
        return word[:-3] + 'eu'
    elif word.endswith('s') and not word.endswith('us') and not word.endswith('is'):
        return word[:-1]
    
    return word

def clean_ingredient_name(name):
    """
    Nettoie le nom d'ingrédient en retirant les adjectifs trop précis
    et en mettant au singulier
    """
    name = name.strip()
    
    # Retirer les adjectifs de qualité/état qui sont trop précis
    name = re.sub(r'\s+(mûr|mûre|mûres|mûrs)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(jeune|jeunes)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(tendre|tendres)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(nouveau|nouvelle|nouvelles|nouveaux)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(bio|biologique)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(gros|grosse|grosses)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(petit|petite|petites|petits)\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(entier|entière|entières|entiers)\b', '', name, flags=re.IGNORECASE)
    
    # Nettoyer les espaces multiples
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Mettre au singulier
    words = name.split()
    # Le dernier mot est généralement le nom principal
    if words:
        words[-1] = singularize(words[-1])
        # Pour les composés comme "pommes de terre"
        if len(words) > 1 and words[0] not in ['de', 'du', 'd', 'à', 'au']:
            words[0] = singularize(words[0])
    
    return ' '.join(words)

def is_spice_or_herb(name):
    """Détermine si c'est une épice ou herbe (archetype sauf exceptions)"""
    name_lower = name.lower()
    
    # Exceptions : formes non transformées -> canonical
    if any(x in name_lower for x in ['poivre en grain', 'sel en grain', 'gros sel']):
        return False
    
    # Liste des épices et herbes (archetypes)
    spices_herbs = [
        'cannelle', 'cumin', 'curry', 'paprika', 'safran', 'curcuma',
        'gingembre moulu', 'gingembre en poudre', 'noix de muscade',
        'clou de girofle', 'cardamome', 'coriandre moulu', 'coriandre en poudre',
        'piment', 'cayenne', 'espelette', 'quatre-épices', 'herbes de provence',
        'herbes italien', 'origan séché', 'thym séché', 'romarin séché',
        'basilic séché', 'persil séché', 'menthe séché', 'estragon séché',
        'aneth séché', 'ciboulette séché', 'laurier',
        'garam masala', 'ras el hanout', 'zaatar', 'sumac',
        'poivre moulu', 'poivre noir', 'poivre blanc', 'sel fin', 'sel'
    ]
    
    return any(spice in name_lower for spice in spices_herbs)

def is_prepared_ingredient(name):
    """
    Détermine si c'est un ingrédient préparé/transformé (archetype)
    """
    name_lower = name.lower()
    
    # Huiles aromatisées
    if re.search(r"huile d[e']", name_lower):
        return True
    
    # Vinaigres aromatisés
    if re.search(r"vinaigre de", name_lower) and 'vin' not in name_lower:
        return True
    
    # Produits laitiers transformés (sauf lait nature)
    if any(x in name_lower for x in [
        'crème fraîche', 'crème liquide', 'crème épaisse',
        'fromage râpé', 'parmesan râpé', 'gruyère râpé',
        'beurre fondu', 'beurre mou', 'beurre salé', 'beurre doux'
    ]):
        return True
    
    # Conserves et produits transformés
    if any(x in name_lower for x in [
        'en conserve', 'en boîte', 'en bocal', 'au sirop',
        'au naturel', 'pelé', 'concassé', 'concentré'
    ]):
        return True
    
    return False

def extract_process_from_name(name):
    """
    Extrait le processus de transformation du nom de l'ingrédient
    Retourne (base_name, process, is_archetype)
    """
    name_lower = name.lower()
    
    # Patterns pour les archétypes (transformations)
    archetype_patterns = [
        (r'\bfrais\b', 'frais', False),  # État naturel
        (r'\bfraîche?\b', 'frais', False),
        (r'\bcuit\b', 'cuisson', True),
        (r'\bcuite?\b', 'cuisson', True),
        (r'\bmoulu\b', 'broyage', True),
        (r'\bmoulue?\b', 'broyage', True),
        (r'\ben poudre\b', 'séchage et broyage', True),
        (r'\brâpé\b', 'râpage', True),
        (r'\brâpée?\b', 'râpage', True),
        (r'\bhaché\b', 'hachage', True),
        (r'\bhachée?\b', 'hachage', True),
        (r'\bpelé\b', 'épluchage', True),
        (r'\bpelée?\b', 'épluchage', True),
        (r'\bdénoyauté\b', 'dénoyautage', True),
        (r'\bdénoyautée?\b', 'dénoyautage', True),
        (r'\bséché\b', 'séchage', True),
        (r'\bséchée?\b', 'séchage', True),
        (r'\bcongelé\b', 'congélation', True),
        (r'\bcongelée?\b', 'congélation', True),
        (r'\bfumé\b', 'fumage', True),
        (r'\bfumée?\b', 'fumage', True),
        (r'\bgrillé\b', 'grillage', True),
        (r'\bgrillée?\b', 'grillage', True),
        (r'\bmariné\b', 'marinade', True),
        (r'\bmarinée?\b', 'marinade', True),
        (r'\bfermenté\b', 'fermentation', True),
        (r'\bfermentée?\b', 'fermentation', True),
        (r'\ben tranches?\b', 'tranchage', True),
        (r'\ben dés\b', 'découpe', True),
        (r'\ben morceaux\b', 'découpe', True),
        (r'\bau sirop\b', 'mise en sirop', True),
        (r'\bau naturel\b', 'nature', False),
        (r'\ben conserve\b', 'mise en conserve', True),
        (r'\ben boîte\b', 'mise en conserve', True),
        (r'\ben bocal\b', 'mise en bocal', True),
        (r'\bsous vide\b', 'mise sous vide', True),
        (r'\bconcentré\b', 'concentration', True),
        (r'\bconcassé\b', 'concassage', True),
    ]
    
    process_found = None
    is_archetype = False
    base_name = name
    
    for pattern, process, is_arch in archetype_patterns:
        if re.search(pattern, name_lower):
            process_found = process
            is_archetype = is_arch
            # Retirer le processus du nom de base
            base_name = re.sub(pattern, '', base_name, flags=re.IGNORECASE)
            break
    
    base_name = re.sub(r'\s+', ' ', base_name).strip()
    
    return (base_name, process_found, is_archetype)

def is_sub_recipe(name):
    """
    Détermine si cet ingrédient est en fait une recette
    (à gérer avec sub_recipe_id plutôt que canonical_food_id ou archetype_id)
    """
    name_lower = name.lower()
    
    # Sauces qui sont des recettes
    recipe_keywords = [
        'sauce béchamel', 'béchamel', 'sauce hollandaise',
        'sauce tomate', 'sauce bolognaise', 'pesto',
        'bouillon de', 'fond de', 'fumet de',
        'pâte à', 'pâte brisée', 'pâte feuilletée', 'pâte sablée',
        'mayonnaise', 'aïoli', 'rouille',
        'ganache', 'caramel', 'crème anglaise', 'crème pâtissière',
        'confit de', 'compote de', 'coulis de',
        'duxelles', 'farce', 'marinade'
    ]
    
    return any(keyword in name_lower for keyword in recipe_keywords)

def categorize_ingredient(ingredient_name):
    """
    Catégorise un ingrédient et détermine s'il doit être
    canonical_food, archetype, ou sub_recipe
    """
    # D'abord vérifier si c'est une recette
    if is_sub_recipe(ingredient_name):
        return 'sub_recipe'
    
    # Épices et herbes -> archetypes
    if is_spice_or_herb(ingredient_name):
        return 'archetype'
    
    # Ingrédients préparés -> archetypes
    if is_prepared_ingredient(ingredient_name):
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
        'citron', 'orange', 'mandarine', 'pamplemousse', 'fruit',
        'abricot', 'pêche', 'prune', 'cerise', 'raisin'
    ]):
        return 1
    
    # Légumes (category 2)
    if any(word in name_lower for word in [
        'carotte', 'tomate', 'oignon', 'ail', 'poivron', 'courgette',
        'aubergine', 'concombre', 'salade', 'épinard', 'chou', 'légume',
        'poireau', 'céleri', 'navet', 'radis', 'betterave'
    ]):
        return 2
    
    # Champignons (category 3)
    if 'champignon' in name_lower or 'cèpe' in name_lower or 'morille' in name_lower:
        return 3
    
    # Viandes (category 9)
    if any(word in name_lower for word in [
        'poulet', 'bœuf', 'boeuf', 'porc', 'veau', 'agneau', 'viande',
        'canard', 'dinde', 'lapin', 'jambon', 'lard', 'bacon',
        'saucisse', 'chorizo', 'merguez'
    ]):
        return 9
    
    # Poissons/fruits de mer (category 9)
    if any(word in name_lower for word in [
        'saumon', 'thon', 'cabillaud', 'morue', 'poisson',
        'crevette', 'moule', 'huître', 'calmar', 'seiche'
    ]):
        return 9
    
    # Produits laitiers (category 7)
    if any(word in name_lower for word in [
        'lait', 'yaourt', 'fromage', 'crème', 'beurre',
        'mozzarella', 'parmesan', 'gruyère', 'comté', 'chèvre'
    ]):
        return 7
    
    # Céréales/Féculents (category 5)
    if any(word in name_lower for word in [
        'farine', 'pain', 'riz', 'pâtes', 'nouilles', 'avoine',
        'blé', 'semoule', 'polenta', 'quinoa', 'boulgour'
    ]):
        return 5
    
    # Herbes/Épices (category 10)
    if any(word in name_lower for word in [
        'basilic', 'persil', 'coriandre', 'thym', 'romarin', 'menthe',
        'poivre', 'sel', 'paprika', 'cumin', 'curry', 'cannelle',
        'muscade', 'safran', 'gingembre'
    ]):
        return 10
    
    # Huiles et graisses (category 11)
    if 'huile' in name_lower or 'graisse' in name_lower:
        return 11
    
    # Sucres et édulcorants (category 14)
    if any(word in name_lower for word in [
        'sucre', 'miel', 'sirop', 'cassonade', 'vergeoise'
    ]):
        return 14
    
    # Par défaut: Autres
    return 14

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
    
    # Charger les recettes existantes (pour sub_recipe_id)
    existing_recipes = {}
    with open('../supabase/exports/latest/csv/recipes.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].lower().strip()
            existing_recipes[name] = row['id']
    
    print(f"✅ {len(existing_recipes)} recettes existantes")
    
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
                    # Nettoyer et singulariser
                    ingredient_clean = clean_ingredient_name(ingredient_name)
                    all_ingredients[ingredient_clean] += 1
    
    print(f"✅ {len(all_ingredients)} ingrédients uniques trouvés (après nettoyage)")
    
    # Analyser les ingrédients manquants
    print("\n📊 Analyse des ingrédients manquants...")
    
    missing_canonical = {}
    missing_archetypes = {}
    sub_recipes_needed = {}
    
    for ingredient, count in all_ingredients.items():
        normalized = ingredient.lower().strip()
        
        # Vérifier si existe déjà
        if normalized in existing_canonical or normalized in existing_archetypes or normalized in existing_recipes:
            continue
        
        # Déterminer le type
        ingredient_type = categorize_ingredient(ingredient)
        base_name, process, _ = extract_process_from_name(ingredient)
        
        if ingredient_type == 'sub_recipe':
            sub_recipes_needed[ingredient] = {
                'count': count
            }
        elif ingredient_type == 'archetype':
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
    print(f"⚠️  {len(sub_recipes_needed)} sous-recettes nécessaires")
    
    # Générer le SQL
    print("\n📝 Génération du SQL...")
    
    sql_file = 'insert_missing_ingredients_v2.sql'
    report_file = 'missing_ingredients_report_v2.txt'
    
    with open(sql_file, 'w', encoding='utf-8') as sql_f, \
         open(report_file, 'w', encoding='utf-8') as report_f:
        
        sql_f.write("-- Insertion des ingrédients manquants V2\n")
        sql_f.write("-- Généré automatiquement (version corrigée)\n")
        sql_f.write("-- " + "=" * 70 + "\n\n")
        sql_f.write("BEGIN;\n\n")
        
        report_f.write("RAPPORT DES INGRÉDIENTS MANQUANTS V2\n")
        report_f.write("=" * 80 + "\n\n")
        
        # 1. Canonical foods
        if missing_canonical:
            sql_f.write("-- =====================================================\n")
            sql_f.write("-- CANONICAL FOODS (aliments de base)\n")
            sql_f.write("-- =====================================================\n\n")
            
            report_f.write("CANONICAL FOODS À CRÉER\n")
            report_f.write("-" * 80 + "\n\n")
            
            for ingredient in sorted(missing_canonical.keys(), key=lambda x: missing_canonical[x]['count'], reverse=True):
                info = missing_canonical[ingredient]
                
                report_f.write(f"• {ingredient}\n")
                report_f.write(f"  Catégorie: {info['category_id']}\n")
                report_f.write(f"  Occurrences: {info['count']}\n\n")
                
                ingredient_escaped = ingredient.replace("'", "''")
                
                sql_f.write(f"-- {ingredient} (utilisé {info['count']}x)\n")
                sql_f.write(f"INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)\n")
                sql_f.write(f"VALUES ('{ingredient_escaped}', {info['category_id']}, NOW(), NOW())\n")
                sql_f.write(f"ON CONFLICT (canonical_name) DO NOTHING;\n\n")
        
        # 2. Archetypes
        if missing_archetypes:
            sql_f.write("\n-- =====================================================\n")
            sql_f.write("-- ARCHETYPES (transformations, préparations)\n")
            sql_f.write("-- =====================================================\n\n")
            
            report_f.write("\n" + "=" * 80 + "\n")
            report_f.write("ARCHETYPES À CRÉER\n")
            report_f.write("-" * 80 + "\n\n")
            
            for ingredient in sorted(missing_archetypes.keys(), key=lambda x: missing_archetypes[x]['count'], reverse=True):
                info = missing_archetypes[ingredient]
                
                report_f.write(f"• {ingredient}\n")
                report_f.write(f"  Base: {info['base_name']}\n")
                report_f.write(f"  Processus: {info['process'] or 'N/A'}\n")
                report_f.write(f"  Catégorie: {info['category_id']}\n")
                report_f.write(f"  Occurrences: {info['count']}\n\n")
                
                ingredient_escaped = ingredient.replace("'", "''")
                base_name_escaped = info['base_name'].replace("'", "''")
                process_escaped = info['process'].replace("'", "''") if info['process'] else None
                
                sql_f.write(f"-- {ingredient} (utilisé {info['count']}x)\n")
                sql_f.write(f"-- TODO: Lier à canonical_food_id pour '{info['base_name']}'\n")
                sql_f.write(f"INSERT INTO archetypes (name, process, created_at, updated_at, notes)\n")
                
                process_value = f"'{process_escaped}'" if process_escaped else 'NULL'
                
                sql_f.write(f"VALUES (\n")
                sql_f.write(f"  '{ingredient_escaped}',\n")
                sql_f.write(f"  {process_value},\n")
                sql_f.write(f"  NOW(),\n")
                sql_f.write(f"  NOW(),\n")
                sql_f.write(f"  'Auto-généré - base: {base_name_escaped}'\n")
                sql_f.write(f")\n")
                sql_f.write(f"ON CONFLICT (name) DO NOTHING;\n\n")
        
        # 3. Sous-recettes
        if sub_recipes_needed:
            sql_f.write("\n-- =====================================================\n")
            sql_f.write("-- SOUS-RECETTES (recettes utilisées comme ingrédients)\n")
            sql_f.write("-- =====================================================\n")
            sql_f.write("-- Ces ingrédients doivent être créés comme recettes\n")
            sql_f.write("-- et liés via sub_recipe_id dans recipe_ingredients\n\n")
            
            report_f.write("\n" + "=" * 80 + "\n")
            report_f.write("SOUS-RECETTES NÉCESSAIRES\n")
            report_f.write("-" * 80 + "\n\n")
            report_f.write("Ces ingrédients sont en fait des recettes.\n")
            report_f.write("Ils doivent être créés dans la table 'recipes' et\n")
            report_f.write("liés via sub_recipe_id (pas canonical_food_id).\n\n")
            
            for ingredient in sorted(sub_recipes_needed.keys(), key=lambda x: sub_recipes_needed[x]['count'], reverse=True):
                info = sub_recipes_needed[ingredient]
                
                report_f.write(f"• {ingredient}\n")
                report_f.write(f"  Occurrences: {info['count']}\n\n")
                
                ingredient_escaped = ingredient.replace("'", "''")
                sql_f.write(f"-- TODO MANUEL: Créer la recette '{ingredient}' (utilisé {info['count']}x)\n")
                sql_f.write(f"-- INSERT INTO recipes (name, ...) VALUES ('{ingredient_escaped}', ...);\n\n")
        
        sql_f.write("\nCOMMIT;\n")
        sql_f.write(f"\n-- Total: {len(missing_canonical)} canonical_foods + {len(missing_archetypes)} archetypes\n")
        sql_f.write(f"-- + {len(sub_recipes_needed)} sous-recettes à créer manuellement\n")
        
        # Statistiques
        report_f.write("\n" + "=" * 80 + "\n")
        report_f.write("STATISTIQUES\n")
        report_f.write("=" * 80 + "\n\n")
        report_f.write(f"Total ingrédients uniques: {len(all_ingredients)}\n")
        report_f.write(f"Déjà existants: {len(all_ingredients) - len(missing_canonical) - len(missing_archetypes) - len(sub_recipes_needed)}\n")
        report_f.write(f"À créer:\n")
        report_f.write(f"  - Canonical foods: {len(missing_canonical)}\n")
        report_f.write(f"  - Archetypes: {len(missing_archetypes)}\n")
        report_f.write(f"  - Sous-recettes: {len(sub_recipes_needed)}\n")
    
    print(f"\n✅ Fichiers générés:")
    print(f"   📄 {sql_file}")
    print(f"   📄 {report_file}")
    print(f"\n📊 Résumé:")
    print(f"   Total ingrédients: {len(all_ingredients)}")
    print(f"   Déjà existants: {len(all_ingredients) - len(missing_canonical) - len(missing_archetypes) - len(sub_recipes_needed)}")
    print(f"   📝 Canonical foods: {len(missing_canonical)}")
    print(f"   📝 Archetypes: {len(missing_archetypes)}")
    print(f"   📝 Sous-recettes: {len(sub_recipes_needed)}")
    
    print(f"\n🚀 Pour insérer les données:")
    print(f"   PGPASSWORD='...' psql \"$DATABASE_URL_TX\" -f {sql_file}")

if __name__ == '__main__':
    main()
