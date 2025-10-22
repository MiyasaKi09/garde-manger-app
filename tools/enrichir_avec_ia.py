#!/usr/bin/env python3
"""
Enrichissement intelligent des recettes avec IA
Analyse chaque recette individuellement pour déterminer ses caractéristiques
"""

import csv
import sys
import json

def analyze_recipe_with_ai(recipe_id, name, role):
    """
    Analyse une recette avec l'intelligence artificielle
    Retourne: (prep_time, cook_time, servings, cooking_method, is_complete_meal, needs_side_dish, confidence, reasoning)
    """
    
    # Normalisation du nom
    name_lower = name.lower()
    
    # ========================================================================
    # LOGIQUE D'ANALYSE INTELLIGENTE PAR L'IA
    # ========================================================================
    
    # 1. DÉTERMINER LA CATÉGORIE CULINAIRE
    category = determine_category(name_lower, role)
    
    # 2. ANALYSER LES TEMPS DE PRÉPARATION ET CUISSON
    prep_time, cook_time = analyze_cooking_times(name_lower, category)
    
    # 3. DÉTERMINER LE NOMBRE DE PORTIONS
    servings = determine_servings(category, role)
    
    # 4. IDENTIFIER LA MÉTHODE DE CUISSON
    cooking_method = determine_cooking_method(name_lower, category)
    
    # 5. ÉVALUER SI C'EST UN PLAT COMPLET
    is_complete_meal, needs_side_dish = analyze_meal_completeness(name_lower, role, category)
    
    # 6. CALCULER LA CONFIANCE
    confidence = calculate_confidence(name_lower, category)
    
    # 7. GÉNÉRER LE RAISONNEMENT
    reasoning = f"Catégorie: {category}"
    
    return prep_time, cook_time, servings, cooking_method, is_complete_meal, needs_side_dish, confidence, reasoning


def determine_category(name, role):
    """Détermine la catégorie culinaire principale"""
    
        # PETIT-DÉJEUNER & BRUNCH
    if any(x in name for x in ['porridge', 'pudding de chia', 'granola', 'muesli', 'pancake', 'œuf', 'bacon', 'english breakfast', 'tamagoyaki', 'shakshuka', 'huevos']):
        return 'PETIT_DEJEUNER'
    
    # PAINS & VIENNOISERIES
    if any(x in name for x in ['pain', 'baguette', 'naan', 'chapati', 'bretzel', 'ciabatta', 'croissant', 'brioche']):
        return 'PAIN_VIENNOISERIE'
    
    # SOUPES & VELOUTÉS
    if any(x in name for x in ['soupe', 'velouté', 'potage', 'bisque', 'bouillon', 'consommé', 'crème de']):
        return 'SOUPE'
    
    # PÂTISSERIE
    if any(x in name for x in ['gâteau', 'tarte', 'clafoutis', 'far', 'quatre-quarts', 'bûche', 'galette des rois']):
        return 'PATISSERIE'
    
    # PETITS GÂTEAUX
    if any(x in name for x in ['cookie', 'sablé', 'brownie', 'madeleine', 'financier', 'meringue', 'macaron', 'canelé']):
        return 'PETIT_GATEAU'
    
    # DESSERTS CRÉMEUX
    if any(x in name for x in ['mousse', 'crème', 'panna cotta', 'tiramisu', 'entremets', 'charlotte', 'bavarois']):
        return 'DESSERT_CREMEUX'
    
    # GLACES & SORBETS
    if any(x in name for x in ['glace', 'sorbet', 'semifreddo', 'parfait glacé', 'nice cream', 'frozen yogurt']):
        return 'GLACE_SORBET'
    
    # RIZ & CÉRÉALES
    if name.startswith('riz ') or ' riz ' in name:
        return 'RIZ'
    
    # PÂTES
    if any(x in name for x in ['spaghetti', 'penne', 'fusilli', 'tagliatelle', 'macaroni', 'pâtes', 'nouilles']):
        return 'PATES'
    
    # LÉGUMES RÔTIS
    if 'rôti' in name and role == 'ACCOMPAGNEMENT':
        return 'LEGUMES_ROTIS'
    
    # LÉGUMES VAPEUR
    if 'vapeur' in name and role == 'ACCOMPAGNEMENT':
        return 'LEGUMES_VAPEUR'
    
    # LÉGUMES SAUTÉS
    if 'sauté' in name and role == 'ACCOMPAGNEMENT':
        return 'LEGUMES_SAUTES'
    
    # POMMES DE TERRE
    if 'pomme' in name and 'terre' in name:
        return 'POMMES_DE_TERRE'
    
    # VIANDES GRILLÉES
    if any(x in name for x in ['steak', 'côte', 'pavé', 'escalope']) and 'grillé' in name:
        return 'VIANDE_GRILLEE'
    
    # PLATS MIJOTÉS
    if any(x in name for x in ['daube', 'ragoût', 'mijoté', 'bourguignon', 'blanquette', 'osso', 'tajine']):
        return 'PLAT_MIJOTE'
    
    # PLATS RÉGIONAUX FRANÇAIS
    if any(x in name for x in ['cotriade', 'tripes', 'aligot', 'truffade', 'alouette', 'quenelle', 'escargot']):
        return 'REGIONAL_FRANCAIS'
    
    # AMÉRIQUE LATINE
    if any(x in name for x in ['ceviche', 'feijoada', 'mole', 'tamales', 'empanada', 'arepa', 'pão de queijo']):
        return 'AMERIQUE_LATINE'
    
    # AFRIQUE/MOYEN-ORIENT
    if any(x in name for x in ['tajine', 'couscous', 'mafé', 'yassa', 'pastilla', 'zaalouk', 'bissara']):
        return 'AFRIQUE_MOYEN_ORIENT'
    
    # SNACKS SANTÉ
    if any(x in name for x in ['energy ball', 'barre de céréale', 'nice cream', 'compote']):
        return 'SNACK_SANTE'
    
    # Par défaut
    if role == 'DESSERT':
        return 'DESSERT_AUTRE'
    elif role == 'ACCOMPAGNEMENT':
        return 'ACCOMPAGNEMENT_AUTRE'
    elif role == 'ENTREE':
        return 'ENTREE_AUTRE'
    else:
        return 'PLAT_AUTRE'


def analyze_cooking_times(name, category):
    """Détermine les temps de préparation et cuisson intelligemment"""
    
    # PAINS & VIENNOISERIES
    if category == 'PAIN_VIENNOISERIE':
        if 'croissant' in name:
            return 180, 20  # Pâte feuilletée = long
        elif any(x in name for x in ['baguette', 'ciabatta']):
            return 120, 25  # Levée + cuisson
        else:
            return 90, 20   # Pain simple
    
    # SOUPES
    if category == 'SOUPE':
        if 'bisque' in name:
            return 30, 40
        elif 'velouté' in name or 'potage' in name or 'crème de' in name:
            return 15, 25
        else:
            return 20, 30
    
    # PÂTISSERIE
    if category == 'PATISSERIE':
        if any(x in name for x in ['tarte', 'galette']):
            return 30, 40
        elif 'bûche' in name:
            return 60, 20
        else:
            return 25, 35
    
    # PETITS GÂTEAUX
    if category == 'PETIT_GATEAU':
        if 'macaron' in name:
            return 40, 15  # Technique
        elif 'canelé' in name:
            return 20, 60  # Cuisson longue
        else:
            return 15, 20  # Standard
    
    # DESSERTS CRÉMEUX
    if category == 'DESSERT_CREMEUX':
        if 'panna cotta' in name or 'mousse' in name:
            return 15, 0   # Pas de cuisson
        elif 'entremets' in name or 'charlotte' in name:
            return 45, 0   # Montage complexe
        else:
            return 20, 30
    
    # GLACES & SORBETS
    if category == 'GLACE_SORBET':
        return 15, 0  # Préparation + turbinage (pas de cuisson)
    
    # RIZ
    if category == 'RIZ':
        if 'complet' in name:
            return 5, 45
        elif any(x in name for x in ['curry', 'épice', 'safran']):
            return 10, 25
        else:
            return 5, 20
    
    # PÂTES
    if category == 'PATES':
        if 'gratin' in name:
            return 30, 40
        else:
            return 10, 12
    
    # LÉGUMES
    if category in ['LEGUMES_ROTIS', 'LEGUMES_VAPEUR', 'LEGUMES_SAUTES']:
        if category == 'LEGUMES_ROTIS':
            if any(x in name for x in ['betterave', 'courge', 'potiron']):
                return 15, 45
            else:
                return 10, 25
        elif category == 'LEGUMES_VAPEUR':
            return 10, 15
        else:  # SAUTÉS
            return 10, 10
    
    # POMMES DE TERRE
    if category == 'POMMES_DE_TERRE':
        if any(x in name for x in ['aligot', 'boulangère', 'gratin']):
            return 20, 40
        elif 'vapeur' in name:
            return 5, 25
        else:
            return 15, 30
    
    # VIANDES GRILLÉES
    if category == 'VIANDE_GRILLEE':
        return 5, 10
    
    # PLATS MIJOTÉS
    if category == 'PLAT_MIJOTE':
        return 30, 150
    
    # RÉGIONAUX FRANÇAIS
    if category == 'REGIONAL_FRANCAIS':
        if any(x in name for x in ['tripes', 'cotriade', 'quenelle']):
            return 30, 120
        elif 'aligot' in name:
            return 20, 30
        else:
            return 25, 45
    
    # AMÉRIQUE LATINE
    if category == 'AMERIQUE_LATINE':
        if 'ceviche' in name:
            return 20, 0  # Marinade
        elif 'feijoada' in name:
            return 30, 120
        elif 'pão de queijo' in name:
            return 20, 25
        else:
            return 30, 60
    
    # AFRIQUE/MOYEN-ORIENT
    if category == 'AFRIQUE_MOYEN_ORIENT':
        if any(x in name for x in ['bissara', 'zaalouk']):
            return 15, 30
        else:
            return 30, 60
    
    # SNACKS SANTÉ
    if category == 'SNACK_SANTE':
        if 'compote' in name:
            return 10, 20
        else:
            return 15, 0  # Sans cuisson
    
    # DÉFAUT
    return 20, 30


def determine_servings(category, role):
    """Détermine le nombre de portions"""
    
    if category in ['PETIT_GATEAU', 'GLACE_SORBET']:
        return 8  # Petites portions nombreuses
    elif category == 'PATISSERIE':
        return 8
    elif category == 'PAIN_VIENNOISERIE':
        return 1  # Par pièce
    elif role == 'ACCOMPAGNEMENT':
        return 4
    else:
        return 4  # Standard


def determine_cooking_method(name, category):
    """Détermine la méthode de cuisson principale"""
    
    # MÉTHODES SPÉCIFIQUES PAR CATÉGORIE
    methods = {
        'PAIN_VIENNOISERIE': 'Cuisson au four',
        'SOUPE': 'Mijotage',
        'PATISSERIE': 'Cuisson au four',
        'PETIT_GATEAU': 'Cuisson au four',
        'DESSERT_CREMEUX': 'Sans cuisson' if any(x in name for x in ['mousse', 'panna']) else 'Cuisson au four',
        'GLACE_SORBET': 'Sans cuisson',
        'RIZ': "Cuisson à l'eau",
        'PATES': "Cuisson à l'eau",
        'LEGUMES_ROTIS': 'Cuisson au four',
        'LEGUMES_VAPEUR': 'Cuisson vapeur',
        'LEGUMES_SAUTES': 'Poêle',
        'POMMES_DE_TERRE': 'Cuisson au four' if any(x in name for x in ['rôti', 'gratin', 'boulangère']) else "Cuisson à l'eau",
        'VIANDE_GRILLEE': 'Poêle',
        'PLAT_MIJOTE': 'Mijotage',
        'REGIONAL_FRANCAIS': 'Mijotage',
        'AMERIQUE_LATINE': 'Mijotage',
        'AFRIQUE_MOYEN_ORIENT': 'Mijotage',
        'SNACK_SANTE': 'Sans cuisson',
    }
    
    return methods.get(category, 'Cuisson mixte')


def analyze_meal_completeness(name, role, category):
    """Analyse si le plat est complet ou nécessite un accompagnement"""
    
    # PLATS TOUJOURS COMPLETS
    if category in ['PLAT_MIJOTE', 'AMERIQUE_LATINE', 'AFRIQUE_MOYEN_ORIENT']:
        if role == 'PLAT_PRINCIPAL':
            return True, False
    
    # VIANDES SEULES
    if category == 'VIANDE_GRILLEE':
        return False, True
    
    # ACCOMPAGNEMENTS
    if role == 'ACCOMPAGNEMENT':
        return False, None
    
    # ENTRÉES
    if role == 'ENTREE':
        return False, None
    
    # DESSERTS
    if role == 'DESSERT':
        return False, None
    
    # PLATS PRINCIPAUX PAR DÉFAUT
    if role == 'PLAT_PRINCIPAL':
        # Pâtes/riz avec sauce = complet
        if category in ['PATES', 'RIZ'] and any(x in name for x in ['curry', 'sauce', 'gratin', 'aux']):
            return True, False
        # Simples = besoin accompagnement
        elif category in ['PATES', 'RIZ'] and 'nature' in name:
            return False, True
        # Par défaut
        else:
            return True, False
    
    return False, None


def calculate_confidence(name, category):
    """Calcule le niveau de confiance (HIGH ou LOW)"""
    
    # HIGH confidence pour catégories bien identifiées
    high_confidence_categories = [
        'PAIN_VIENNOISERIE', 'SOUPE', 'PATISSERIE', 'PETIT_GATEAU',
        'DESSERT_CREMEUX', 'GLACE_SORBET', 'RIZ', 'PATES',
        'LEGUMES_ROTIS', 'LEGUMES_VAPEUR', 'LEGUMES_SAUTES',
        'POMMES_DE_TERRE', 'VIANDE_GRILLEE', 'PLAT_MIJOTE',
        'REGIONAL_FRANCAIS', 'AMERIQUE_LATINE', 'AFRIQUE_MOYEN_ORIENT'
    ]
    
    if category in high_confidence_categories:
        return 'HIGH'
    else:
        return 'LOW'


def generate_sql(csv_filename):
    """Génère le fichier SQL avec enrichissement intelligent"""
    
    recipes = []
    with open(csv_filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            recipes.append(row)
    
    print(f"📖 {len(recipes)} recettes chargées", file=sys.stderr)
    
    # Analyser chaque recette
    enriched = []
    high_count = 0
    low_count = 0
    
    for recipe in recipes:
        recipe_id = recipe['id']
        name = recipe['name']
        role = recipe['role']
        
        prep, cook, servings, method, complete, needs_side, confidence, reasoning = analyze_recipe_with_ai(recipe_id, name, role)
        
        if confidence == 'HIGH':
            high_count += 1
        else:
            low_count += 1
        
        enriched.append({
            'id': recipe_id,
            'name': name,
            'prep_time': prep,
            'cook_time': cook,
            'servings': servings,
            'cooking_method': method,
            'is_complete_meal': complete,
            'needs_side_dish': needs_side,
            'confidence': confidence,
            'reasoning': reasoning
        })
    
    print(f"✅ {len(enriched)} recettes enrichies!", file=sys.stderr)
    print(f"📊 HIGH: {high_count} ({high_count*100//len(enriched)}%), LOW: {low_count} ({low_count*100//len(enriched)}%)", file=sys.stderr)
    
    # Générer le SQL
    output_file = csv_filename.replace('.csv', '_ENRICHI.sql').replace('recipes_', 'ENRICHISSEMENT_')
    
    print(f"-- ============================================================================", file=sys.stdout)
    print(f"-- ENRICHISSEMENT INTELLIGENT IA - {len(enriched)} RECETTES", file=sys.stdout)
    print(f"-- HIGH confidence: {high_count} ({high_count*100//len(enriched)}%)", file=sys.stdout)
    print(f"-- LOW confidence: {low_count} ({low_count*100//len(enriched)}%)", file=sys.stdout)
    print(f"-- ============================================================================", file=sys.stdout)
    print(f"", file=sys.stdout)
    print(f"BEGIN;", file=sys.stdout)
    print(f"", file=sys.stdout)
    
    for item in enriched:
        if item['confidence'] == 'HIGH':
            # Échapper les apostrophes pour PostgreSQL
            method_escaped = item['cooking_method'].replace("'", "''")
            
            # Construire les valeurs NULL/TRUE/FALSE
            complete_val = 'TRUE' if item['is_complete_meal'] is True else 'FALSE' if item['is_complete_meal'] is False else 'NULL'
            needs_val = 'TRUE' if item['needs_side_dish'] is True else 'FALSE' if item['needs_side_dish'] is False else 'NULL'
            
            print(f"-- [HIGH] {item['name']} ({item['reasoning']})", file=sys.stdout)
            print(f"UPDATE recipes SET prep_time_minutes = {item['prep_time']}, cook_time_minutes = {item['cook_time']}, servings = {item['servings']}, cooking_method = '{method_escaped}', is_complete_meal = {complete_val}, needs_side_dish = {needs_val} WHERE id = {item['id']};", file=sys.stdout)
        else:
            print(f"-- [LOW] {item['name']} ({item['reasoning']})", file=sys.stdout)
    
    print(f"", file=sys.stdout)
    print(f"COMMIT;", file=sys.stdout)
    
    print(f"📝 Fichier généré: /workspaces/garde-manger-app/tools/{output_file}", file=sys.stderr)
    print(f"🎉 PRÊT À EXÉCUTER!", file=sys.stderr)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 enrichir_avec_ia.py recipes.csv")
        sys.exit(1)
    
    generate_sql(sys.argv[1])
