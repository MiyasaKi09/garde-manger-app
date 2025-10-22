#!/usr/bin/env python3
"""
Script FINAL : Génère le SQL complet d'enrichissement intelligent 
pour TOUTES les 1058 recettes.
"""

import csv
import re
from typing import Dict

# === BASE DE CONNAISSANCE CULINAIRE COMPLÈTE ===
RECIPE_DATABASE = {
    # PETIT-DÉJEUNER
    'overnight porridge': {'prep': 10, 'cook': 480, 'servings': 2, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Trempage nocturne (8h)'},
    'porridge(?! salé)': {'prep': 5, 'cook': 10, 'servings': 2, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Porridge chaud'},
    'porridge salé': {'prep': 10, 'cook': 15, 'servings': 2, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Version salée'},
    'pudding de chia': {'prep': 10, 'cook': 240, 'servings': 4, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Trempage 4h'},
    'granola': {'prep': 10, 'cook': 30, 'servings': 8, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Four 150°C 30min'},
    'muesli bircher': {'prep': 10, 'cook': 480, 'servings': 4, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Trempage nocturne'},
    'pancakes': {'prep': 10, 'cook': 15, 'servings': 4, 'method': 'Poêle', 'complete': True, 'needs_side': False, 'reason': '3-4min/face'},
    'œufs bénédictine': {'prep': 15, 'cook': 20, 'servings': 2, 'method': 'Cuisson mixte', 'complete': True, 'needs_side': False, 'reason': 'Œufs pochés + hollandaise'},
    'œuf poché.*toast': {'prep': 10, 'cook': 10, 'servings': 2, 'method': 'Cuisson à l\'eau', 'complete': True, 'needs_side': False, 'reason': 'Toast + œuf'},
    'œufs au plat.*bacon': {'prep': 5, 'cook': 10, 'servings': 2, 'method': 'Poêle', 'complete': True, 'needs_side': False, 'reason': 'English breakfast'},
    'full english breakfast': {'prep': 15, 'cook': 25, 'servings': 2, 'method': 'Cuisson mixte', 'complete': True, 'needs_side': False, 'reason': 'Complet anglais'},
    'yaourt.*miel.*noix': {'prep': 5, 'cook': 0, 'servings': 1, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Assemblage'},
    'shakshuka': {'prep': 15, 'cook': 25, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Œufs en sauce'},
    'huevos rotos': {'prep': 10, 'cook': 20, 'servings': 4, 'method': 'Poêle', 'complete': True, 'needs_side': False, 'reason': 'Frites + œufs + jambon'},
    'pan con tomate': {'prep': 5, 'cook': 5, 'servings': 4, 'method': 'Grillage', 'complete': False, 'needs_side': None, 'reason': 'Tapas'},
    'tamagoyaki': {'prep': 10, 'cook': 10, 'servings': 2, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Omelette japonaise'},
    
    # SOUPES
    'gaspacho': {'prep': 20, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Soupe froide'},
    'salmorejo': {'prep': 15, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Soupe froide épaisse'},
    'velouté|crème de|potage': {'prep': 15, 'cook': 25, 'servings': 4, 'method': 'Mijotage', 'complete': False, 'needs_side': None, 'reason': 'Soupe entrée'},
    'soupe à l\'oignon gratinée': {'prep': 20, 'cook': 45, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Soupe + gratinage'},
    'minestrone|harira|chorba': {'prep': 20, 'cook': 40, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Soupe-repas'},
    
    # TAPAS/MEZZE
    'houmous': {'prep': 10, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Tartinade'},
    'baba ganoush|moutabal': {'prep': 15, 'cook': 30, 'servings': 6, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Aubergines grillées'},
    'tzatziki': {'prep': 15, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Sauce grecque'},
    'tapenade|tartinade|rillettes': {'prep': 10, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Tartinable'},
    'guacamole': {'prep': 10, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Écrasé avocat'},
    'bruschetta': {'prep': 10, 'cook': 5, 'servings': 4, 'method': 'Grillage', 'complete': False, 'needs_side': None, 'reason': 'Pain grillé'},
    'crostini': {'prep': 15, 'cook': 10, 'servings': 8, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Toasts'},
    'patatas bravas': {'prep': 15, 'cook': 30, 'servings': 4, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Tapas'},
    'croquetas': {'prep': 30, 'cook': 20, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Croquettes'},
    'pimientos de padrón': {'prep': 5, 'cook': 10, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Poivrons poêlés'},
    'gambas al ajillo': {'prep': 10, 'cook': 5, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Crevettes ail'},
    'falafel': {'prep': 20, 'cook': 15, 'servings': 4, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Boulettes'},
    'samoussas|nems': {'prep': 40, 'cook': 12, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Friture'},
    'rouleaux de printemps': {'prep': 30, 'cook': 0, 'servings': 8, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Roulage froid'},
    'accras|arancini': {'prep': 25, 'cook': 18, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Beignets'},
    'artichauts': {'prep': 15, 'cook': 30, 'servings': 4, 'method': 'Mijotage', 'complete': False, 'needs_side': None, 'reason': 'Cuisson longue'},
    
    # ASIATIQUE
    'bò bún|pad thaï|pho': {'prep': 30, 'cook': 15, 'servings': 4, 'method': 'Cuisson mixte', 'complete': True, 'needs_side': False, 'reason': 'Nouilles complètes'},
    'ramen': {'prep': 30, 'cook': 120, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Bouillon long + nouilles'},
    'bibimbap|oyakodon|katsudon|gyudon': {'prep': 20, 'cook': 15, 'servings': 4, 'method': 'Cuisson mixte', 'complete': True, 'needs_side': False, 'reason': 'Bowl complet'},
    'bulgogi|teriyaki': {'prep': 15, 'cook': 12, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Viande marinée'},
    'riz cantonais|nasi goreng': {'prep': 15, 'cook': 10, 'servings': 4, 'method': 'Sauté au wok', 'complete': True, 'needs_side': False, 'reason': 'Riz sauté complet'},
    
    # VIANDES SIMPLES
    r'\bsteak\b|\bcôte\b|\bentrecôte\b|\bbavette\b|\bonglet\b|\bhampe\b|\bfilet de bœuf\b|\brumsteck\b|\bfaux-filet\b': {'prep': 5, 'cook': 10, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Viande simple'},
    'poulet rôti|poulet du dimanche': {'prep': 15, 'cook': 60, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': True, 'reason': 'Volaille rôtie'},
    'poulet grillé|poulet poêlé|escalope.*poulet': {'prep': 10, 'cook': 20, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Volaille simple'},
    'magret de canard': {'prep': 10, 'cook': 15, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Magret poêlé'},
    'côtelettes.*agneau|gigot': {'prep': 10, 'cook': 25, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': True, 'reason': 'Agneau rôti'},
    'rôti de|filet mignon': {'prep': 15, 'cook': 45, 'servings': 6, 'method': 'Cuisson au four', 'complete': False, 'needs_side': True, 'reason': 'Rôti'},
    'escalope|piccata|saltimbocca': {'prep': 10, 'cook': 12, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Escalope'},
    
    # PLATS MIJOTÉS COMPLETS
    'curry|tajine|couscous': {'prep': 20, 'cook': 45, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Plat mijoté complet'},
    'blanquette|bourguignon|carbonnade|daube|navarin': {'prep': 25, 'cook': 120, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Mijoté traditionnel'},
    'pot-au-feu|poule au pot|potée|cassoulet': {'prep': 30, 'cook': 150, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Plat traditionnel long'},
    'chili con carne|chili sin carne': {'prep': 20, 'cook': 45, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Chili complet'},
    'goulash|stroganoff': {'prep': 20, 'cook': 90, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Mijoté en sauce'},
    
    # GRATINS/FOUR
    'lasagne': {'prep': 30, 'cook': 40, 'servings': 6, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Lasagnes'},
    'gratin|moussaka|parmentier': {'prep': 30, 'cook': 40, 'servings': 6, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Gratin complet'},
    'aubergines à la parmesane': {'prep': 30, 'cook': 40, 'servings': 4, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Gratin complet'},
    
    # TOUT-EN-UN
    'pizza': {'prep': 20, 'cook': 15, 'servings': 4, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Pizza'},
    'burger': {'prep': 15, 'cook': 15, 'servings': 4, 'method': 'Poêle', 'complete': True, 'needs_side': False, 'reason': 'Burger'},
    'sandwich|wrap|croque|kebab|gyros|bagel': {'prep': 10, 'cook': 10, 'servings': 4, 'method': 'Préparation rapide', 'complete': True, 'needs_side': False, 'reason': 'Tout-en-un'},
    'quiche|tarte salée': {'prep': 20, 'cook': 35, 'servings': 6, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Quiche'},
    
    # PÂTES & RIZ
    'pâtes|spaghetti|penne|linguine|tagliatelle|fusilli|macaroni': {'prep': 10, 'cook': 15, 'servings': 4, 'method': 'Cuisson à l\'eau', 'complete': True, 'needs_side': False, 'reason': 'Pâtes'},
    'risotto': {'prep': 10, 'cook': 30, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Risotto'},
    'paella': {'prep': 20, 'cook': 40, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Paella'},
    'gnocchi': {'prep': 15, 'cook': 10, 'servings': 4, 'method': 'Cuisson à l\'eau', 'complete': True, 'needs_side': False, 'reason': 'Gnocchis'},
    
    # SALADES COMPOSÉES
    r'salade.*(composée|césar|niçoise|bowl|buddha)': {'prep': 20, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Salade complète'},
    
    # POISSONS
    'saumon|cabillaud|dorade|sole|thon': {'prep': 10, 'cook': 20, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': True, 'reason': 'Poisson'},
    'moules|paella': {'prep': 20, 'cook': 25, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Fruits de mer'},
    'bouillabaisse|marmitako|zarzuela': {'prep': 30, 'cook': 40, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Soupe de poisson'},
}


class RecipeEnricher:
    """Enrichit intelligemment les recettes"""
    
    def __init__(self):
        self.stats = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    
    def enrich(self, recipe_id: int, name: str, role: str) -> str:
        """Enrichit une recette et retourne le SQL"""
        name_lower = name.lower()
        
        # Chercher match dans RECIPE_DATABASE
        for pattern, data in RECIPE_DATABASE.items():
            if re.search(pattern, name_lower, re.IGNORECASE):
                is_complete = data['complete']
                needs_side = data['needs_side']
                
                # Ajuster selon rôle
                if role in ['ENTREE', 'DESSERT', 'SAUCE', 'ACCOMPAGNEMENT']:
                    is_complete = False
                    needs_side = None
                
                updates = {
                    'prep_time_minutes': data['prep'],
                    'cook_time_minutes': data['cook'],
                    'servings': data['servings'],
                    'cooking_method': data['method'],
                    'is_complete_meal': is_complete,
                    'needs_side_dish': needs_side
                }
                
                self.stats['HIGH'] += 1
                return self._generate_sql(recipe_id, updates, name, 'HIGH', data['reason'])
        
        # Pas de match → générique
        updates = self._generic_by_role(name_lower, role)
        confidence = updates.pop('confidence')
        reason = updates.pop('reason')
        self.stats[confidence] += 1
        return self._generate_sql(recipe_id, updates, name, confidence, reason)
    
    def _generic_by_role(self, name: str, role: str) -> Dict:
        """Valeurs génériques par rôle"""
        
        if role == 'ENTREE':
            if 'soupe' in name or 'velouté' in name or 'potage' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 25, 'servings': 4, 'cooking_method': 'Mijotage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Soupe'}
            return {'prep_time_minutes': 15, 'cook_time_minutes': 10, 'servings': 4, 'cooking_method': 'Préparation simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'MEDIUM', 'reason': 'Entrée'}
        
        elif role == 'DESSERT':
            if 'glace' in name or 'sorbet' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6, 'cooking_method': 'Turbinage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Glace'}
            elif 'gâteau' in name or 'cake' in name or 'fondant' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 35, 'servings': 8, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Gâteau'}
            elif 'tarte' in name:
                return {'prep_time_minutes': 25, 'cook_time_minutes': 35, 'servings': 8, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Tarte'}
            elif 'mousse' in name or 'tiramisu' in name or 'panna cotta' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6, 'cooking_method': 'Sans cuisson', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Dessert froid'}
            elif 'crème brûlée' in name or 'flan' in name or 'crème caramel' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 40, 'servings': 6, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Crème cuite'}
            elif 'cookie' in name or 'brownie' in name or 'muffin' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 25, 'servings': 12, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Petits gâteaux'}
            elif 'clafoutis' in name or 'crumble' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 35, 'servings': 6, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Dessert aux fruits'}
            elif 'compote' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4, 'cooking_method': 'Mijotage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Compote'}
            else:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 25, 'servings': 6, 'cooking_method': 'Préparation simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'LOW', 'reason': 'Dessert'}
        
        elif role == 'SAUCE':
            if 'bouillon' in name or 'fond' in name or 'fumet' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 120, 'servings': 8, 'cooking_method': 'Mijotage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Bouillon'}
            else:
                return {'prep_time_minutes': 5, 'cook_time_minutes': 10, 'servings': 4, 'cooking_method': 'Cuisson sur feu', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Sauce'}
        
        elif role == 'ACCOMPAGNEMENT':
            if 'vapeur' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 15, 'servings': 4, 'cooking_method': 'Cuisson vapeur', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Vapeur'}
            elif 'rôti' in name or 'gratiné' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 30, 'servings': 4, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Four'}
            elif 'purée' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4, 'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Purée'}
            elif 'riz' in name or 'pâtes' in name or 'spaghetti' in name or 'penne' in name:
                return {'prep_time_minutes': 5, 'cook_time_minutes': 15, 'servings': 4, 'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Féculents'}
            elif 'frites' in name or 'pommes' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 25, 'servings': 4, 'cooking_method': 'Friture', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Frites/pommes'}
            elif 'sauté' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 10, 'servings': 4, 'cooking_method': 'Sauté au wok', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Sauté'}
            else:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4, 'cooking_method': 'Cuisson simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'MEDIUM', 'reason': 'Accompagnement'}
        
        else:  # PLAT_PRINCIPAL
            return {'prep_time_minutes': 20, 'cook_time_minutes': 30, 'servings': 4, 'cooking_method': 'Cuisson mixte', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'LOW', 'reason': 'Plat principal'}
    
    def _generate_sql(self, recipe_id: int, updates: Dict, name: str, confidence: str, reason: str) -> str:
        """Génère le SQL UPDATE"""
        set_clauses = []
        for col, val in updates.items():
            if val is None:
                set_clauses.append(f"{col} = NULL")
            elif isinstance(val, bool):
                set_clauses.append(f"{col} = {str(val).upper()}")
            elif isinstance(val, str):
                escaped = val.replace("'", "''")
                set_clauses.append(f"{col} = '{escaped}'")
            else:
                set_clauses.append(f"{col} = {val}")
        
        comment = f"-- [{confidence}] {name[:60]}"
        if reason:
            comment += f" ({reason})"
        
        return f"{comment}\nUPDATE recipes SET {', '.join(set_clauses)} WHERE id = {recipe_id};\n"


def main():
    """Point d'entrée - lit le CSV et génère le SQL"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 final_sql_generator.py recipes_data.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    output_file = '/workspaces/garde-manger-app/tools/ENRICH_ALL_1058_RECIPES.sql'
    
    print("=" * 80)
    print("GÉNÉRATION SQL FINAL - ENRICHISSEMENT DE TOUTES LES RECETTES")
    print("=" * 80)
    print()
    
    enricher = RecipeEnricher()
    sql_statements = []
    
    # Lire le CSV
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        recipes = list(reader)
    
    print(f"📖 {len(recipes)} recettes chargées")
    print("🔥 Enrichissement en cours...\n")
    
    for i, recipe in enumerate(recipes, 1):
        recipe_id = int(recipe['id'])
        name = recipe['name']
        role = recipe['role']
        
        sql = enricher.enrich(recipe_id, name, role)
        sql_statements.append(sql)
        
        if i % 100 == 0:
            print(f"   ✓ {i}/{len(recipes)} recettes traitées...")
    
    print(f"\n✅ {len(recipes)} recettes enrichies!\n")
    print(f"📊 STATISTIQUES DE CONFIANCE:")
    print(f"   🟢 HIGH: {enricher.stats['HIGH']} recettes ({enricher.stats['HIGH']*100//len(recipes)}%)")
    print(f"   🟡 MEDIUM: {enricher.stats['MEDIUM']} recettes ({enricher.stats['MEDIUM']*100//len(recipes)}%)")
    print(f"   🔴 LOW: {enricher.stats['LOW']} recettes ({enricher.stats['LOW']*100//len(recipes)}%)")
    
    # Écrire le fichier SQL
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- " + "=" * 76 + "\n")
        f.write("-- ENRICHISSEMENT INTELLIGENT DE TOUTES LES RECETTES\n")
        f.write(f"-- Généré automatiquement avec intelligence culinaire\n")
        f.write(f"-- Date: 2025-10-20\n")
        f.write(f"-- Total: {len(recipes)} recettes\n")
        f.write(f"-- HIGH confidence: {enricher.stats['HIGH']} ({enricher.stats['HIGH']*100//len(recipes)}%)\n")
        f.write(f"-- MEDIUM confidence: {enricher.stats['MEDIUM']} ({enricher.stats['MEDIUM']*100//len(recipes)}%)\n")
        f.write(f"-- LOW confidence: {enricher.stats['LOW']} ({enricher.stats['LOW']*100//len(recipes)}%)\n")
        f.write("-- " + "=" * 76 + "\n\n")
        f.write("BEGIN;\n\n")
        
        for sql in sql_statements:
            f.write(sql)
        
        f.write("\nCOMMIT;\n")
        f.write("\n-- ✅ ENRICHISSEMENT TERMINÉ - Recettes enrichies avec intelligence culinaire\n")
    
    print(f"\n📝 Fichier SQL généré: {output_file}")
    file_size = sum(len(s.encode('utf-8')) for s in sql_statements) // 1024
    print(f"💾 Taille: {file_size} Ko")
    print(f"📄 Lignes: {len(sql_statements) * 2}")  # 2 lignes par recette (commentaire + UPDATE)
    print("\n" + "=" * 80)
    print("🎉 PRÊT À EXÉCUTER!")
    print("=" * 80)


if __name__ == "__main__":
    main()
