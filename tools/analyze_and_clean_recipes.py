#!/usr/bin/env python3
"""
Analyse les recettes pour détecter les anomalies et génère le SQL de nettoyage
- Doublons exacts
- Variations quasi-identiques excessives
- Recettes farfelues/improbables
- Recettes trop génériques
"""

import re
from collections import defaultdict
from difflib import SequenceMatcher

# Récupérer toutes les recettes depuis le CSV exporté
def parse_recipes(csv_content):
    """Parse le CSV des recettes"""
    recipes = []
    lines = csv_content.strip().split('\n')
    
    for line in lines[1:]:  # Skip header
        parts = line.split(',', 3)
        if len(parts) >= 3:
            recipe_id = parts[0]
            name = parts[1]
            role = parts[2]
            recipes.append({
                'id': recipe_id,
                'name': name,
                'role': role
            })
    
    return recipes

# Patterns de recettes problématiques
WEIRD_INGREDIENTS = [
    'kiwi', 'café', 'chocolat', 'thé fumé', 'fleurs comestibles',
    'curry banane', 'curry cacao', 'lait d\'amande'
]

WEIRD_MEAT_COMBOS = [
    r'poulet au (kiwi|café|chocolat|thé)',
    r'bœuf au (kiwi|café|chocolat|thé)',
    r'agneau au (kiwi|café|chocolat|thé)',
    r'veau au (kiwi|café|chocolat|thé)',
    r'porc au (kiwi|café|chocolat|thé)'
]

# Patterns de variations excessives
VARIATION_PATTERNS = [
    r'^(Poulet|Agneau|Bœuf|Veau|Porc) grillé',
    r'^(Poulet|Agneau|Bœuf|Veau|Porc) au curry',
    r'^(Poulet|Agneau|Bœuf|Veau|Porc) aux? (champignons|légumes|herbes)',
    r'^Soupe (de|au|aux)',
    r'^Velouté de',
    r'^Tarte (au|aux|à la)',
    r'^Tourte (au|aux|à la)',
    r'^Feuilleté (de|au|aux)',
    r'^Burger (de|au|aux)',
    r'^Wrap (au|aux)',
    r'^Tacos (au|aux)',
    r'^Beignets de',
    r'^Brochettes (de|au)',
    r'^Cake (au|aux)',
    r'^Tartare de',
    r'^\w+ (glacé|grillé|rôti|poêlé|vapeur|farci)e?s?$',
    r'^\w+ sauce',
]

# Patterns trop génériques
TOO_GENERIC = [
    r'^(Poulet|Poisson|Viande|Légumes?)$',
    r'festif$',
    r'express$',
    r'fusion$',
    r'hybride',
    r'surprise',
    r'créatif',
    r'expérimental',
    r'original',
    r'innovant',
    r'revisité',
]

def similarity_ratio(a, b):
    """Calcule la similarité entre deux noms de recettes"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def is_weird_recipe(name):
    """Détecte les recettes farfelues"""
    name_lower = name.lower()
    
    # Ingrédients bizarres dans la viande
    for pattern in WEIRD_MEAT_COMBOS:
        if re.search(pattern, name_lower, re.IGNORECASE):
            return True, "Combinaison viande-ingrédient bizarre"
    
    # Recettes avec des ingrédients improbables
    for ingredient in WEIRD_INGREDIENTS:
        if ingredient in name_lower and any(meat in name_lower for meat in ['poulet', 'bœuf', 'agneau', 'veau', 'porc']):
            return True, f"Ingrédient improbable: {ingredient}"
    
    return False, None

def is_too_generic(name):
    """Détecte les recettes trop génériques"""
    for pattern in TOO_GENERIC:
        if re.search(pattern, name, re.IGNORECASE):
            return True, f"Trop générique: {pattern}"
    return False, None

def analyze_recipes(recipes):
    """Analyse toutes les recettes et détecte les problèmes"""
    
    issues = {
        'exact_duplicates': [],
        'near_duplicates': [],
        'excessive_variations': defaultdict(list),
        'weird_recipes': [],
        'too_generic': [],
        'incomplete': []
    }
    
    seen_names = {}
    
    for recipe in recipes:
        name = recipe['name']
        recipe_id = recipe['id']
        
        # 1. Doublons exacts
        if name in seen_names:
            issues['exact_duplicates'].append({
                'id': recipe_id,
                'name': name,
                'duplicate_of': seen_names[name]
            })
        else:
            seen_names[name] = recipe_id
        
        # 2. Recettes incomplètes (description vide)
        if 'À compléter' in recipe.get('description', ''):
            issues['incomplete'].append({
                'id': recipe_id,
                'name': name
            })
        
        # 3. Recettes farfelues
        is_weird, reason = is_weird_recipe(name)
        if is_weird:
            issues['weird_recipes'].append({
                'id': recipe_id,
                'name': name,
                'reason': reason
            })
        
        # 4. Recettes trop génériques
        is_generic, reason = is_too_generic(name)
        if is_generic:
            issues['too_generic'].append({
                'id': recipe_id,
                'name': name,
                'reason': reason
            })
        
        # 5. Grouper par patterns pour détecter variations excessives
        for pattern in VARIATION_PATTERNS:
            match = re.match(pattern, name, re.IGNORECASE)
            if match:
                base = match.group(0)
                issues['excessive_variations'][base].append({
                    'id': recipe_id,
                    'name': name
                })
    
    # 6. Détecter les near-duplicates (similarité > 85%)
    recipe_list = list(seen_names.keys())
    for i, name1 in enumerate(recipe_list):
        for name2 in recipe_list[i+1:]:
            sim = similarity_ratio(name1, name2)
            if sim > 0.85 and sim < 1.0:
                issues['near_duplicates'].append({
                    'id1': seen_names[name1],
                    'name1': name1,
                    'id2': seen_names[name2],
                    'name2': name2,
                    'similarity': sim
                })
    
    return issues

def generate_cleanup_sql(issues, recipes):
    """Génère le SQL de nettoyage"""
    
    to_delete = set()
    reasons = {}
    
    # 1. Supprimer les doublons exacts (garder le premier)
    for dup in issues['exact_duplicates']:
        to_delete.add(dup['id'])
        reasons[dup['id']] = f"Doublon exact de #{dup['duplicate_of']}"
    
    # 2. Supprimer les recettes farfelues
    for weird in issues['weird_recipes']:
        to_delete.add(weird['id'])
        reasons[weird['id']] = f"Recette farfelue: {weird['reason']}"
    
    # 3. Supprimer les recettes trop génériques
    for generic in issues['too_generic']:
        to_delete.add(generic['id'])
        reasons[generic['id']] = f"Recette générique: {generic['reason']}"
    
    # 4. Limiter les variations excessives (garder max 3 par pattern)
    for base_pattern, variations in issues['excessive_variations'].items():
        if len(variations) > 3:
            # Trier par ID et garder les 3 premiers
            variations_sorted = sorted(variations, key=lambda x: int(x['id']))
            for variation in variations_sorted[3:]:
                to_delete.add(variation['id'])
                reasons[variation['id']] = f"Variation excessive de '{base_pattern}' (gardé 3/{len(variations)})"
    
    # 5. Générer le SQL
    sql_lines = [
        "-- ========================================================================",
        "-- NETTOYAGE DES RECETTES PROBLÉMATIQUES",
        f"-- Total recettes à supprimer: {len(to_delete)}",
        "-- ========================================================================",
        "",
        "BEGIN;",
        ""
    ]
    
    # Grouper par raison
    by_reason = defaultdict(list)
    for recipe_id in to_delete:
        reason = reasons.get(recipe_id, "Raison inconnue")
        by_reason[reason].append(recipe_id)
    
    # Générer les DELETE par groupe
    for reason, ids in sorted(by_reason.items()):
        sql_lines.append(f"-- {reason} ({len(ids)} recettes)")
        
        # Par batches de 50 IDs
        for i in range(0, len(ids), 50):
            batch = ids[i:i+50]
            id_list = ', '.join(batch)
            sql_lines.append(f"DELETE FROM recipes WHERE id IN ({id_list});")
        
        sql_lines.append("")
    
    sql_lines.extend([
        "COMMIT;",
        "",
        "-- Vérification",
        "SELECT ",
        "  COUNT(*) as recettes_restantes,",
        "  COUNT(DISTINCT name) as noms_uniques",
        "FROM recipes;",
        "",
        f"-- Avant nettoyage: {len(recipes)} recettes",
        f"-- Supprimées: {len(to_delete)} recettes",
        f"-- Après nettoyage: ~{len(recipes) - len(to_delete)} recettes"
    ])
    
    return '\n'.join(sql_lines), to_delete, reasons

def generate_report(issues, to_delete, reasons):
    """Génère un rapport détaillé"""
    
    report_lines = [
        "=" * 80,
        "RAPPORT D'ANALYSE DES RECETTES",
        "=" * 80,
        "",
        f"Total recettes à supprimer: {len(to_delete)}",
        "",
        "RÉSUMÉ PAR CATÉGORIE:",
        "-" * 80,
    ]
    
    # Statistiques par raison
    by_reason = defaultdict(int)
    for recipe_id in to_delete:
        reason = reasons.get(recipe_id, "Raison inconnue")
        # Extraire la catégorie principale
        if "Doublon" in reason:
            by_reason["Doublons exacts"] += 1
        elif "farfelue" in reason:
            by_reason["Recettes farfelues"] += 1
        elif "générique" in reason:
            by_reason["Recettes génériques"] += 1
        elif "Variation excessive" in reason:
            by_reason["Variations excessives"] += 1
        else:
            by_reason["Autres"] += 1
    
    for category, count in sorted(by_reason.items(), key=lambda x: -x[1]):
        report_lines.append(f"  {category}: {count}")
    
    report_lines.extend([
        "",
        "DÉTAILS:",
        "-" * 80,
    ])
    
    # Exemples de recettes farfelues
    if issues['weird_recipes']:
        report_lines.append("\nRecettes farfelues (exemples):")
        for weird in issues['weird_recipes'][:10]:
            report_lines.append(f"  - {weird['name']} (#{weird['id']}): {weird['reason']}")
    
    # Variations excessives
    excessive = [(k, v) for k, v in issues['excessive_variations'].items() if len(v) > 3]
    if excessive:
        report_lines.append("\nVariations excessives:")
        for base, variations in sorted(excessive, key=lambda x: -len(x[1]))[:10]:
            report_lines.append(f"  - '{base}': {len(variations)} variations (gardé 3)")
    
    # Doublons exacts
    if issues['exact_duplicates']:
        report_lines.append(f"\nDoublons exacts: {len(issues['exact_duplicates'])} (tous supprimés)")
    
    report_lines.append("\n" + "=" * 80)
    
    return '\n'.join(report_lines)

# Script principal
if __name__ == "__main__":
    print("Chargement des recettes depuis la base de données...")
    
    # Note: Ce script sera exécuté avec les données réelles
    # Pour l'instant, on crée un placeholder
    print("\nCe script doit être exécuté avec les données de la base.")
    print("Utilisez la commande SQL pour exporter d'abord:")
    print("  psql \"$DATABASE_URL\" -c \"COPY recipes TO STDOUT WITH CSV HEADER\" > recipes.csv")
