#!/usr/bin/env python3
"""
Script FINAL ultra-simplifié : 
Crée le SQL d'enrichissement en important les données directement ici
"""

import re

# TOUTES LES 1058 RECETTES (id, name, role) - À REMPLIR
RECIPES = [
    (2, 'Overnight porridge aux graines de chia et fruits rouges', 'ENTREE'),
    (3, 'Porridge salé aux épinards, feta et œuf mollet', 'PLAT_PRINCIPAL'),
    (6, 'Pudding de chia au lait de coco et coulis de mangue', 'DESSERT'),
    (7, 'Granola maison aux noix de pécan et sirop d\'érable', 'ENTREE'),
    (8, 'Muesli Bircher aux pommes râpées et noisettes', 'ENTREE'),
    (9, 'Pancakes américains fluffy au sirop d\'érable', 'DESSERT'),
    # ... PLUS DE RECETTES À AJOUTER
]

# BASE DE CONNAISSANCE SIMPLIFIÉE
PATTERNS = {
    'overnight porridge': (10, 480, 2, 'Sans cuisson', True, False, 'Trempage 8h'),
    'porridge salé': (10, 15, 2, 'Mijotage', True, False, 'Version salée'),
    'porridge': (5, 10, 2, 'Mijotage', True, False, 'Porridge'),
    'pudding de chia': (10, 240, 4, 'Sans cuisson', True, False, 'Trempage 4h'),
    'granola': (10, 30, 8, 'Cuisson au four', True, False, 'Four'),
    'muesli': (10, 480, 4, 'Sans cuisson', True, False, 'Trempage'),
    'pancakes': (10, 15, 4, 'Poêle', True, False, 'Poêle'),
    # Steaks
    r'\bsteak\b|\bentrecôte\b': (5, 10, 4, 'Poêle', False, True, 'Viande'),
    # Desserts
    'gâteau|cake': (20, 35, 8, 'Cuisson au four', False, None, 'Gâteau'),
    'tarte': (25, 35, 8, 'Cuisson au four', False, None, 'Tarte'),
}

def enrich(recipe_id, name, role):
    """Retourne le SQL pour une recette"""
    name_lower = name.lower()
    
    # Chercher pattern
    for pattern, (prep, cook, servings, method, complete, needs_side, reason) in PATTERNS.items():
        if re.search(pattern, name_lower, re.I):
            # Adapter selon rôle
            if role in ['ENTREE', 'DESSERT', 'SAUCE', 'ACCOMPAGNEMENT']:
                complete = False
                needs_side = None
            
            complete_str = 'TRUE' if complete else 'FALSE'
            needs_side_str = 'TRUE' if needs_side is True else ('FALSE' if needs_side is False else 'NULL')
            
            return f"""-- {name[:60]} ({reason})
UPDATE recipes SET 
  prep_time_minutes = {prep}, 
  cook_time_minutes = {cook}, 
  servings = {servings}, 
  cooking_method = '{method}', 
  is_complete_meal = {complete_str}, 
  needs_side_dish = {needs_side_str} 
WHERE id = {recipe_id};
"""
    
    # Générique selon rôle
    if role == 'DESSERT':
        return f"""-- {name[:60]} (Dessert générique)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 6, cooking_method = 'Préparation simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
    elif role == 'ENTREE':
        return f"""-- {name[:60]} (Entrée générique)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Préparation simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
    elif role == 'SAUCE':
        return f"""-- {name[:60]} (Sauce)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
    elif role == 'ACCOMPAGNEMENT':
        return f"""-- {name[:60]} (Accompagnement)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
    else:  # PLAT_PRINCIPAL
        return f"""-- {name[:60]} (Plat principal générique)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""

# Générer le SQL
print("-- " + "=" * 76)
print("-- ENRICHISSEMENT INTELLIGENT DE TOUTES LES RECETTES")
print("-- Date: 2025-10-20")
print(f"-- Total: {len(RECIPES)} recettes")
print("-- " + "=" * 76)
print("\nBEGIN;\n")

for recipe_id, name, role in RECIPES:
    print(enrich(recipe_id, name, role))

print("COMMIT;")
print("\n-- ✅ ENRICHISSEMENT TERMINÉ")
