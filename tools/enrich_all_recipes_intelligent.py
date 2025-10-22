#!/usr/bin/env python3
"""
Script pour enrichir TOUTES les recettes de la base de données
une par une avec intelligence culinaire.
"""

import re
from typing import Dict, Optional, Tuple, List

# Base de données de recettes avec leurs vraies valeurs
RECIPE_DATABASE = {
    # === PETIT-DÉJEUNER / BREAKFAST ===
    'overnight porridge': {
        'prep': 10, 'cook': 480, 'servings': 2, 
        'method': 'Sans cuisson', 'complete': True, 'needs_side': False,
        'reason': 'Trempage nocturne (8h), prêt le matin'
    },
    'porridge': {
        'prep': 5, 'cook': 10, 'servings': 2,
        'method': 'Mijotage', 'complete': True, 'needs_side': False,
        'reason': 'Porridge chaud classique'
    },
    'pudding de chia': {
        'prep': 10, 'cook': 240, 'servings': 4,
        'method': 'Sans cuisson', 'complete': True, 'needs_side': False,
        'reason': 'Trempage 4h minimum'
    },
    'granola': {
        'prep': 10, 'cook': 30, 'servings': 8,
        'method': 'Cuisson au four', 'complete': True, 'needs_side': False,
        'reason': 'Cuisson au four 150°C'
    },
    'muesli bircher': {
        'prep': 10, 'cook': 480, 'servings': 4,
        'method': 'Sans cuisson', 'complete': True, 'needs_side': False,
        'reason': 'Trempage nocturne'
    },
    'pancakes': {
        'prep': 10, 'cook': 15, 'servings': 4,
        'method': 'Poêle', 'complete': True, 'needs_side': False,
        'reason': '3-4 min par face'
    },
    'œufs bénédictine': {
        'prep': 15, 'cook': 20, 'servings': 2,
        'method': 'Cuisson mixte', 'complete': True, 'needs_side': False,
        'reason': 'Œufs pochés + hollandaise + muffin'
    },
    'œuf poché.*toast': {
        'prep': 10, 'cook': 10, 'servings': 2,
        'method': 'Cuisson à l\'eau', 'complete': True, 'needs_side': False,
        'reason': 'Toast + œuf poché'
    },
    'œufs au plat.*bacon': {
        'prep': 5, 'cook': 10, 'servings': 2,
        'method': 'Poêle', 'complete': True, 'needs_side': False,
        'reason': 'Full English breakfast simple'
    },
    'full english breakfast': {
        'prep': 15, 'cook': 25, 'servings': 2,
        'method': 'Cuisson mixte', 'complete': True, 'needs_side': False,
        'reason': 'Œufs, bacon, saucisses, beans, toast'
    },
    'yaourt.*miel.*noix': {
        'prep': 5, 'cook': 0, 'servings': 1,
        'method': 'Sans cuisson', 'complete': True, 'needs_side': False,
        'reason': 'Assemblage simple'
    },
    'shakshuka': {
        'prep': 15, 'cook': 25, 'servings': 4,
        'method': 'Mijotage', 'complete': True, 'needs_side': False,
        'reason': 'Œufs pochés dans sauce tomate'
    },
    'huevos rotos': {
        'prep': 10, 'cook': 20, 'servings': 4,
        'method': 'Poêle', 'complete': True, 'needs_side': False,
        'reason': 'Frites + œufs + jambon'
    },
    'pan con tomate': {
        'prep': 5, 'cook': 5, 'servings': 4,
        'method': 'Grillage', 'complete': False, 'needs_side': True,
        'reason': 'Tapas espagnol, accompagnement'
    },
    'tamagoyaki': {
        'prep': 10, 'cook': 10, 'servings': 2,
        'method': 'Poêle', 'complete': False, 'needs_side': True,
        'reason': 'Omelette japonaise, fait partie d\'un repas'
    },
    
    # === SOUPES FROIDES ===
    'gaspacho': {
        'prep': 20, 'cook': 0, 'servings': 4,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Soupe froide mixée, généralement entrée'
    },
    'salmorejo': {
        'prep': 15, 'cook': 0, 'servings': 4,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Soupe froide plus épaisse que gaspacho'
    },
    'velouté froid': {
        'prep': 15, 'cook': 0, 'servings': 4,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Soupe froide mixée'
    },
    
    # === SOUPES CHAUDES ===
    'velouté de potimarron': {
        'prep': 20, 'cook': 30, 'servings': 4,
        'method': 'Mijotage', 'complete': False, 'needs_side': None,
        'reason': 'Soupe entrée'
    },
    'soupe à l\'oignon gratinée': {
        'prep': 20, 'cook': 45, 'servings': 4,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Soupe + gratinage au four'
    },
    'crème de lentilles': {
        'prep': 15, 'cook': 35, 'servings': 4,
        'method': 'Mijotage', 'complete': True, 'needs_side': False,
        'reason': 'Lentilles = protéines, peut être un plat complet'
    },
    
    # === TAPAS / MEZZE / APÉRO ===
    'houmous': {
        'prep': 10, 'cook': 0, 'servings': 6,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Tartinade, accompagnement'
    },
    'baba ganoush': {
        'prep': 15, 'cook': 30, 'servings': 6,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Aubergines grillées mixées'
    },
    'tzatziki': {
        'prep': 15, 'cook': 0, 'servings': 6,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Sauce froide grecque'
    },
    'moutabal': {
        'prep': 15, 'cook': 30, 'servings': 6,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Comme baba ganoush'
    },
    'tapenade': {
        'prep': 10, 'cook': 0, 'servings': 6,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Tartinade olives'
    },
    'guacamole': {
        'prep': 10, 'cook': 0, 'servings': 4,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Écrasé d\'avocat'
    },
    'bruschetta': {
        'prep': 10, 'cook': 5, 'servings': 4,
        'method': 'Grillage', 'complete': False, 'needs_side': None,
        'reason': 'Pain grillé + topping'
    },
    'crostini': {
        'prep': 15, 'cook': 10, 'servings': 8,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Petits toasts croquants'
    },
    'tartinade': {
        'prep': 10, 'cook': 0, 'servings': 4,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Mélange tartinable'
    },
    'rillettes': {
        'prep': 15, 'cook': 0, 'servings': 6,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Préparation mixée'
    },
    'patatas bravas': {
        'prep': 15, 'cook': 30, 'servings': 4,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Tapas espagnol'
    },
    'croquetas': {
        'prep': 30, 'cook': 20, 'servings': 8,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Croquettes frites'
    },
    'pimientos de padrón': {
        'prep': 5, 'cook': 10, 'servings': 4,
        'method': 'Poêle', 'complete': False, 'needs_side': None,
        'reason': 'Poivrons poêlés'
    },
    'gambas al ajillo': {
        'prep': 10, 'cook': 5, 'servings': 4,
        'method': 'Poêle', 'complete': False, 'needs_side': None,
        'reason': 'Crevettes ail express'
    },
    'falafel': {
        'prep': 20, 'cook': 15, 'servings': 4,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Boulettes pois chiches'
    },
    'samoussas': {
        'prep': 40, 'cook': 15, 'servings': 8,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Pliage + friture'
    },
    'nems': {
        'prep': 40, 'cook': 10, 'servings': 8,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Roulage + friture'
    },
    'rouleaux de printemps': {
        'prep': 30, 'cook': 0, 'servings': 8,
        'method': 'Sans cuisson', 'complete': False, 'needs_side': None,
        'reason': 'Roulage feuilles de riz'
    },
    'accras': {
        'prep': 20, 'cook': 15, 'servings': 8,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Beignets morue'
    },
    'arancini': {
        'prep': 30, 'cook': 20, 'servings': 8,
        'method': 'Friture', 'complete': False, 'needs_side': None,
        'reason': 'Boules risotto frites'
    },
    'gressins': {
        'prep': 20, 'cook': 15, 'servings': 12,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Bâtonnets pain'
    },
    'légumes grillés marinés': {
        'prep': 15, 'cook': 20, 'servings': 6,
        'method': 'Grillade', 'complete': False, 'needs_side': None,
        'reason': 'Antipasti'
    },
    'artichauts': {
        'prep': 15, 'cook': 30, 'servings': 4,
        'method': 'Mijotage', 'complete': False, 'needs_side': None,
        'reason': 'Cuisson longue'
    },
    'poivrons marinés': {
        'prep': 10, 'cook': 20, 'servings': 6,
        'method': 'Cuisson au four', 'complete': False, 'needs_side': None,
        'reason': 'Grillés au four'
    },
    'aubergines à la parmesane': {
        'prep': 30, 'cook': 40, 'servings': 4,
        'method': 'Cuisson au four', 'complete': True, 'needs_side': False,
        'reason': 'Gratin complet'
    },
    
    # === BÒ BÚN ===
    'bò bún': {
        'prep': 30, 'cook': 15, 'servings': 4,
        'method': 'Cuisson mixte', 'complete': True, 'needs_side': False,
        'reason': 'Nouilles + viande + légumes + sauce'
    },
}


class IntelligentRecipeEnricher:
    """Enrichit les recettes avec vraie intelligence culinaire"""
    
    def __init__(self):
        self.enriched_count = 0
        self.sql_statements = []
    
    def enrich_recipe(self, recipe: Dict) -> Dict:
        """Enrichit UNE recette avec vraie connaissance culinaire"""
        name = recipe['name'].lower()
        role = recipe['role']
        
        # Chercher pattern exact dans la base
        for pattern, data in RECIPE_DATABASE.items():
            if re.search(pattern, name, re.IGNORECASE):
                # Adapter le role si nécessaire
                is_complete = data['complete']
                needs_side = data['needs_side']
                
                # Ajuster selon le role déclaré
                if role == 'ENTREE':
                    is_complete = False
                    needs_side = None
                elif role == 'DESSERT':
                    is_complete = False
                    needs_side = None
                elif role == 'SAUCE':
                    is_complete = False
                    needs_side = None
                elif role == 'ACCOMPAGNEMENT':
                    is_complete = False
                    needs_side = None
                
                return {
                    'prep_time_minutes': data['prep'],
                    'cook_time_minutes': data['cook'],
                    'servings': data['servings'],
                    'cooking_method': data['method'],
                    'is_complete_meal': is_complete,
                    'needs_side_dish': needs_side,
                    'confidence': 'HIGH',
                    'reason': data['reason']
                }
        
        # Pas de match exact → valeurs génériques par role
        return self._generic_by_role(name, role)
    
    def _generic_by_role(self, name: str, role: str) -> Dict:
        """Valeurs génériques selon le rôle"""
        
        if role == 'ENTREE':
            return {
                'prep_time_minutes': 15,
                'cook_time_minutes': 10,
                'servings': 4,
                'cooking_method': 'Préparation simple',
                'is_complete_meal': False,
                'needs_side_dish': None,
                'confidence': 'MEDIUM',
                'reason': 'Entrée typique'
            }
        elif role == 'DESSERT':
            if 'glace' in name or 'sorbet' in name:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 0,
                    'servings': 6,
                    'cooking_method': 'Turbinage',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Glace/sorbet'
                }
            elif 'gâteau' in name or 'cake' in name or 'fondant' in name:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 35,
                    'servings': 8,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Gâteau classique'
                }
            elif 'tarte' in name:
                return {
                    'prep_time_minutes': 25,
                    'cook_time_minutes': 35,
                    'servings': 8,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Tarte classique'
                }
            elif 'mousse' in name or 'crème' in name:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 0,
                    'servings': 6,
                    'cooking_method': 'Sans cuisson',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Dessert froid'
                }
            else:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 25,
                    'servings': 6,
                    'cooking_method': 'Préparation simple',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'LOW',
                    'reason': 'Dessert générique'
                }
        elif role == 'SAUCE':
            return {
                'prep_time_minutes': 5,
                'cook_time_minutes': 10,
                'servings': 4,
                'cooking_method': 'Cuisson sur feu',
                'is_complete_meal': False,
                'needs_side_dish': None,
                'confidence': 'HIGH',
                'reason': 'Sauce typique'
            }
        elif role == 'ACCOMPAGNEMENT':
            if 'vapeur' in name:
                return {
                    'prep_time_minutes': 10,
                    'cook_time_minutes': 15,
                    'servings': 4,
                    'cooking_method': 'Cuisson vapeur',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Cuisson vapeur'
                }
            elif 'rôti' in name or 'gratiné' in name:
                return {
                    'prep_time_minutes': 10,
                    'cook_time_minutes': 30,
                    'servings': 4,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'HIGH',
                    'reason': 'Four classique'
                }
            else:
                return {
                    'prep_time_minutes': 10,
                    'cook_time_minutes': 20,
                    'servings': 4,
                    'cooking_method': 'Cuisson simple',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'MEDIUM',
                    'reason': 'Accompagnement typique'
                }
        else:  # PLAT_PRINCIPAL
            # Plats avec pattern
            if 'steak' in name or 'côte' in name or 'entrecôte' in name:
                return {
                    'prep_time_minutes': 5,
                    'cook_time_minutes': 10,
                    'servings': 4,
                    'cooking_method': 'Poêle',
                    'is_complete_meal': False,
                    'needs_side_dish': True,
                    'confidence': 'HIGH',
                    'reason': 'Viande simple nécessite accompagnement'
                }
            elif 'poulet rôti' in name:
                return {
                    'prep_time_minutes': 15,
                    'cook_time_minutes': 60,
                    'servings': 4,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': False,
                    'needs_side_dish': True,
                    'confidence': 'HIGH',
                    'reason': 'Volaille rôtie nécessite accompagnement'
                }
            elif 'curry' in name or 'tajine' in name or 'couscous' in name:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 45,
                    'servings': 4,
                    'cooking_method': 'Mijotage',
                    'is_complete_meal': True,
                    'needs_side_dish': False,
                    'confidence': 'HIGH',
                    'reason': 'Plat mijoté complet'
                }
            elif 'lasagne' in name or 'gratin' in name:
                return {
                    'prep_time_minutes': 30,
                    'cook_time_minutes': 40,
                    'servings': 6,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': True,
                    'needs_side_dish': False,
                    'confidence': 'HIGH',
                    'reason': 'Gratin complet'
                }
            elif 'pizza' in name or 'burger' in name or 'sandwich' in name:
                return {
                    'prep_time_minutes': 15,
                    'cook_time_minutes': 20,
                    'servings': 4,
                    'cooking_method': 'Cuisson au four',
                    'is_complete_meal': True,
                    'needs_side_dish': False,
                    'confidence': 'HIGH',
                    'reason': 'Plat tout-en-un'
                }
            elif 'salade' in name and ('composée' in name or 'césar' in name or 'niçoise' in name):
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 0,
                    'servings': 4,
                    'cooking_method': 'Sans cuisson',
                    'is_complete_meal': True,
                    'needs_side_dish': False,
                    'confidence': 'HIGH',
                    'reason': 'Salade composée complète'
                }
            else:
                return {
                    'prep_time_minutes': 20,
                    'cook_time_minutes': 30,
                    'servings': 4,
                    'cooking_method': 'Cuisson mixte',
                    'is_complete_meal': False,
                    'needs_side_dish': None,
                    'confidence': 'LOW',
                    'reason': 'Plat principal générique'
                }
    
    def generate_sql(self, recipe_id: int, updates: Dict, name: str, confidence: str) -> str:
        """Génère le SQL UPDATE"""
        set_clauses = []
        for col, val in updates.items():
            if col in ['confidence', 'reason']:
                continue
            if val is None:
                set_clauses.append(f"{col} = NULL")
            elif isinstance(val, bool):
                set_clauses.append(f"{col} = {str(val).upper()}")
            elif isinstance(val, str):
                escaped = val.replace("'", "''")
                set_clauses.append(f"{col} = '{escaped}'")
            else:
                set_clauses.append(f"{col} = {val}")
        
        comment = f"-- [{confidence}] {name[:50]}"
        if 'reason' in updates:
            comment += f" ({updates['reason']})"
        
        return f"{comment}\n" + f"UPDATE recipes SET {', '.join(set_clauses)} WHERE id = {recipe_id};"


def main():
    print("=" * 80)
    print("ENRICHISSEMENT INTELLIGENT INDIVIDUEL DE CHAQUE RECETTE")
    print("=" * 80)
    print(f"\n📚 Base de connaissance: {len(RECIPE_DATABASE)} patterns culinaires\n")
    
    enricher = IntelligentRecipeEnricher()
    
    # Exemples
    test_recipes = [
        {'id': 2, 'name': 'Overnight porridge aux graines de chia et fruits rouges', 'role': 'ENTREE'},
        {'id': 9, 'name': 'Pancakes américains fluffy au sirop d\'érable', 'role': 'DESSERT'},
        {'id': 40, 'name': 'Œufs Bénédictine et sauce hollandaise', 'role': 'PLAT_PRINCIPAL'},
        {'id': 57, 'name': 'Bò bún vietnamien au bœuf', 'role': 'PLAT_PRINCIPAL'},
    ]
    
    print("EXEMPLES D'ENRICHISSEMENT:\n")
    for recipe in test_recipes:
        enriched = enricher.enrich_recipe(recipe)
        sql = enricher.generate_sql(recipe['id'], enriched, recipe['name'], enriched['confidence'])
        print(f"📝 {recipe['name'][:60]}")
        print(f"   Confidence: {enriched['confidence']}")
        print(f"   Préparation: {enriched['prep_time_minutes']} min")
        print(f"   Cuisson: {enriched['cook_time_minutes']} min")
        print(f"   Portions: {enriched['servings']}")
        print(f"   Méthode: {enriched['cooking_method']}")
        print(f"   Plat complet: {enriched['is_complete_meal']}")
        print(f"   Besoin accompagnement: {enriched['needs_side_dish']}")
        print(f"   Raison: {enriched['reason']}")
        print()
    
    print("=" * 80)
    print("✅ Système opérationnel!")
    print("💡 Prochaine étape: Récupérer les 1058 recettes et générer le SQL complet")
    print("=" * 80)


if __name__ == "__main__":
    main()
