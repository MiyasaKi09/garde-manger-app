#!/usr/bin/env python3
"""
Script pour enrichir intelligemment TOUTES les recettes une par une.
Utilise la connaissance culinaire pour compléter chaque recette de manière réaliste.
"""

import re
from typing import Dict, Optional, Tuple

class RecipeEnricher:
    """Enrichit les recettes avec des données réalistes basées sur la connaissance culinaire"""
    
    def __init__(self):
        # Base de connaissance culinaire
        self.cooking_times = {
            # Viandes
            r'poulet rôti': (15, 60, 'Cuisson au four'),
            r'poulet grillé': (10, 20, 'Grillade'),
            r'steak|entrecôte|bavette': (5, 10, 'Poêle'),
            r'rôti de (bœuf|veau|porc)': (20, 90, 'Cuisson au four'),
            
            # Poissons
            r'saumon (grillé|poêlé)': (5, 15, 'Poêle'),
            r'poisson au four': (10, 25, 'Cuisson au four'),
            
            # Pâtes & Riz
            r'spaghetti|penne|pâtes': (5, 12, 'Cuisson à l\'eau'),
            r'risotto': (10, 30, 'Mijotage'),
            r'riz': (5, 20, 'Cuisson à l\'eau'),
            
            # Soupes
            r'soupe|velouté': (15, 30, 'Mijotage'),
            
            # Desserts
            r'gâteau|cake': (15, 40, 'Cuisson au four'),
            r'tarte': (20, 35, 'Cuisson au four'),
            r'mousse|crème': (20, 0, 'Sans cuisson'),
            
            # Sauces
            r'sauce|vinaigrette': (5, 10, 'Sans cuisson'),
            r'béchamel|hollandaise': (5, 10, 'Cuisson sur feu'),
        }
        
        # Tailles de portions par type
        self.default_servings = {
            'PLAT_PRINCIPAL': 4,
            'ENTREE': 4,
            'DESSERT': 6,
            'ACCOMPAGNEMENT': 4,
            'SAUCE': 4,
        }
        
    def analyze_recipe(self, recipe: Dict) -> Dict:
        """Analyse une recette et retourne les valeurs enrichies"""
        name = recipe['name'].lower()
        role = recipe['role']
        
        # Déterminer les temps de cuisson
        prep_time, cook_time, cooking_method = self._determine_cooking_times(name, role)
        
        # Déterminer les portions
        servings = self._determine_servings(name, role)
        
        # Déterminer si c'est un plat complet
        is_complete_meal, needs_side_dish = self._determine_meal_completeness(name, role)
        
        return {
            'prep_time_minutes': prep_time,
            'cook_time_minutes': cook_time,
            'servings': servings,
            'cooking_method': cooking_method,
            'is_complete_meal': is_complete_meal,
            'needs_side_dish': needs_side_dish,
        }
    
    def _determine_cooking_times(self, name: str, role: str) -> Tuple[int, int, str]:
        """Détermine les temps de préparation, cuisson et méthode"""
        
        # Chercher dans la base de connaissance
        for pattern, (prep, cook, method) in self.cooking_times.items():
            if re.search(pattern, name, re.IGNORECASE):
                return prep, cook, method
        
        # Valeurs par défaut selon le rôle
        if role == 'SAUCE':
            return 5, 10, 'Cuisson sur feu'
        elif role == 'DESSERT':
            if 'glace' in name or 'sorbet' in name:
                return 15, 0, 'Sans cuisson'
            return 20, 35, 'Cuisson au four'
        elif role == 'ENTREE':
            if 'salade' in name:
                return 15, 0, 'Sans cuisson'
            return 10, 15, 'Cuisson simple'
        elif role == 'ACCOMPAGNEMENT':
            if 'vapeur' in name:
                return 10, 15, 'Cuisson vapeur'
            elif 'rôti' in name or 'gratiné' in name:
                return 10, 30, 'Cuisson au four'
            return 10, 20, 'Cuisson simple'
        else:  # PLAT_PRINCIPAL
            return 20, 30, 'Cuisson mixte'
    
    def _determine_servings(self, name: str, role: str) -> int:
        """Détermine le nombre de portions"""
        
        # Sauces et accompagnements généreux
        if role in ['SAUCE', 'ACCOMPAGNEMENT']:
            if 'bouillon' in name or 'fond' in name:
                return 8
            return 4
        
        # Desserts pour plus de monde
        if role == 'DESSERT':
            if 'gâteau' in name or 'tarte' in name:
                return 8
            return 6
        
        # Entrées et plats
        return self.default_servings.get(role, 4)
    
    def _determine_meal_completeness(self, name: str, role: str) -> Tuple[bool, Optional[bool]]:
        """Détermine si c'est un plat complet et s'il nécessite un accompagnement"""
        
        if role != 'PLAT_PRINCIPAL':
            return False, None
        
        # Plats complets (ne nécessitent PAS d'accompagnement)
        complete_patterns = [
            r'paella|couscous|pot-au-feu|blanquette|cassoulet|choucroute',
            r'tajine|curry|risotto',
            r'pasta|spaghetti|penne|lasagne|pâtes',
            r'pizza|burger|sandwich|wrap',
            r'bowl|poke',
            r'salade (composée|niçoise|césar)',
            r'quiche|tarte salée',
            r'ramen|pho|soupe-repas',
        ]
        
        for pattern in complete_patterns:
            if re.search(pattern, name, re.IGNORECASE):
                return True, False
        
        # Plats nécessitant accompagnement
        needs_side_patterns = [
            r'^steak|^côte|^entrecôte|^bavette|^onglet|^hampe',
            r'^poulet grillé|^poulet rôti(?! complet)',
            r'^poisson (grillé|poêlé|au four)',
            r'^escalope|^filet de',
            r'^rôti de',
        ]
        
        for pattern in needs_side_patterns:
            if re.search(pattern, name, re.IGNORECASE):
                return False, True
        
        # Par défaut: plat simple qui peut bénéficier d'un accompagnement
        return False, None
    
    def generate_update_sql(self, recipe_id: int, updates: Dict) -> str:
        """Génère le SQL UPDATE pour une recette"""
        
        set_clauses = []
        for column, value in updates.items():
            if value is None:
                set_clauses.append(f"{column} = NULL")
            elif isinstance(value, bool):
                set_clauses.append(f"{column} = {str(value).upper()}")
            elif isinstance(value, str):
                # Échapper les apostrophes
                escaped_value = value.replace("'", "''")
                set_clauses.append(f"{column} = '{escaped_value}'")
            else:
                set_clauses.append(f"{column} = {value}")
        
        return f"UPDATE recipes SET {', '.join(set_clauses)} WHERE id = {recipe_id};"


def main():
    """Point d'entrée - génère le SQL pour enrichir toutes les recettes"""
    
    print("=" * 80)
    print("ENRICHISSEMENT INTELLIGENT DE TOUTES LES RECETTES")
    print("=" * 80)
    print("\nCe script va générer le SQL pour enrichir chaque recette individuellement")
    print("avec des valeurs réalistes basées sur la connaissance culinaire.\n")
    
    enricher = RecipeEnricher()
    
    # Exemple de recettes à traiter
    example_recipes = [
        {'id': 2, 'name': 'Overnight porridge aux graines de chia et fruits rouges', 'role': 'ENTREE'},
        {'id': 3, 'name': 'Porridge salé aux épinards, feta et œuf mollet', 'role': 'PLAT_PRINCIPAL'},
        {'id': 11, 'name': 'Pancakes salés au saumon fumé et aneth', 'role': 'PLAT_PRINCIPAL'},
    ]
    
    print("EXEMPLES D'ENRICHISSEMENT:\n")
    for recipe in example_recipes:
        updates = enricher.analyze_recipe(recipe)
        print(f"📝 {recipe['name']}")
        print(f"   → Préparation: {updates['prep_time_minutes']} min")
        print(f"   → Cuisson: {updates['cook_time_minutes']} min")
        print(f"   → Portions: {updates['servings']}")
        print(f"   → Méthode: {updates['cooking_method']}")
        print(f"   → Plat complet: {updates['is_complete_meal']}")
        print(f"   → Besoin accompagnement: {updates['needs_side_dish']}")
        print()
    
    print("\n" + "=" * 80)
    print("✅ Système prêt!")
    print("💡 Prochaine étape: Récupérer TOUTES les recettes de la DB et les enrichir")
    print("=" * 80)


if __name__ == "__main__":
    main()
