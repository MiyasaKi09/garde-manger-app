#!/usr/bin/env python3
"""
Génère le SQL d'enrichissement COMPLET à partir des données brutes de la query.
Applique l'intelligence culinaire recette par recette.
"""

import re
from typing import Dict, Optional

# Copier RECIPE_DATABASE de generate_enrichment_sql.py
RECIPE_DATABASE = {
    # === PETIT-DÉJEUNER / BREAKFAST ===
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
    'pan con tomate': {'prep': 5, 'cook': 5, 'servings': 4, 'method': 'Grillage', 'complete': False, 'needs_side': None, 'reason': 'Tapas espagnol'},
    'tamagoyaki': {'prep': 10, 'cook': 10, 'servings': 2, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Omelette japonaise'},
    
    # === SOUPES FROIDES ===
    'gaspacho': {'prep': 20, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Soupe froide mixée'},
    'salmorejo': {'prep': 15, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Soupe froide épaisse'},
    'velouté froid': {'prep': 15, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Soupe froide'},
    
    # === SOUPES CHAUDES ===
    'velouté de potimarron': {'prep': 20, 'cook': 30, 'servings': 4, 'method': 'Mijotage', 'complete': False, 'needs_side': None, 'reason': 'Soupe entrée'},
    'soupe à l\'oignon gratinée': {'prep': 20, 'cook': 45, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Soupe + gratinage'},
    'crème de lentilles': {'prep': 15, 'cook': 35, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Lentilles = protéines'},
    
    # === TAPAS / MEZZE / APÉRO ===
    'houmous': {'prep': 10, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Tartinade'},
    'baba ganoush': {'prep': 15, 'cook': 30, 'servings': 6, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Aubergines grillées'},
    'tzatziki': {'prep': 15, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Sauce froide grecque'},
    'moutabal': {'prep': 15, 'cook': 30, 'servings': 6, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Comme baba ganoush'},
    'tapenade': {'prep': 10, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Tartinade olives'},
    'guacamole': {'prep': 10, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Écrasé avocat'},
    'bruschetta': {'prep': 10, 'cook': 5, 'servings': 4, 'method': 'Grillage', 'complete': False, 'needs_side': None, 'reason': 'Pain grillé'},
    'crostini': {'prep': 15, 'cook': 10, 'servings': 8, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Toasts croquants'},
    'tartinade': {'prep': 10, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Tartinable'},
    'rillettes': {'prep': 15, 'cook': 0, 'servings': 6, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Préparation mixée'},
    'patatas bravas': {'prep': 15, 'cook': 30, 'servings': 4, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Tapas espagnol'},
    'croquetas': {'prep': 30, 'cook': 20, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Croquettes'},
    'pimientos de padrón': {'prep': 5, 'cook': 10, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Poivrons poêlés'},
    'gambas al ajillo': {'prep': 10, 'cook': 5, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': None, 'reason': 'Crevettes ail'},
    'falafel': {'prep': 20, 'cook': 15, 'servings': 4, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Boulettes pois chiches'},
    'samoussas': {'prep': 40, 'cook': 15, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Pliage + friture'},
    'nems': {'prep': 40, 'cook': 10, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Roulage + friture'},
    'rouleaux de printemps': {'prep': 30, 'cook': 0, 'servings': 8, 'method': 'Sans cuisson', 'complete': False, 'needs_side': None, 'reason': 'Roulage froid'},
    'accras': {'prep': 20, 'cook': 15, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Beignets morue'},
    'arancini': {'prep': 30, 'cook': 20, 'servings': 8, 'method': 'Friture', 'complete': False, 'needs_side': None, 'reason': 'Boules risotto'},
    'gressins': {'prep': 20, 'cook': 15, 'servings': 12, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Bâtonnets pain'},
    'légumes grillés marinés': {'prep': 15, 'cook': 20, 'servings': 6, 'method': 'Grillade', 'complete': False, 'needs_side': None, 'reason': 'Antipasti'},
    'artichauts': {'prep': 15, 'cook': 30, 'servings': 4, 'method': 'Mijotage', 'complete': False, 'needs_side': None, 'reason': 'Cuisson longue'},
    'poivrons marinés': {'prep': 10, 'cook': 20, 'servings': 6, 'method': 'Cuisson au four', 'complete': False, 'needs_side': None, 'reason': 'Grillés au four'},
    'aubergines à la parmesane': {'prep': 30, 'cook': 40, 'servings': 4, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Gratin complet'},
    
    # === ASIATIQUE ===
    'bò bún': {'prep': 30, 'cook': 15, 'servings': 4, 'method': 'Cuisson mixte', 'complete': True, 'needs_side': False, 'reason': 'Nouilles + viande + légumes'},
    
    # === VIANDES ===
    r'\bsteak\b|\bcôte\b|\bentrecôte\b|\bbavette\b|\bonglet\b|\bhampe\b|\bfilet de bœuf\b': {'prep': 5, 'cook': 10, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Viande simple'},
    'poulet rôti': {'prep': 15, 'cook': 60, 'servings': 4, 'method': 'Cuisson au four', 'complete': False, 'needs_side': True, 'reason': 'Volaille rôtie'},
    'poulet grillé|poulet poêlé': {'prep': 10, 'cook': 20, 'servings': 4, 'method': 'Poêle', 'complete': False, 'needs_side': True, 'reason': 'Volaille simple'},
    
    # === PLATS COMPLETS ===
    'curry|tajine|couscous|blanquette|pot-au-feu|cassoulet': {'prep': 20, 'cook': 45, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Plat mijoté complet'},
    'lasagne|gratin|moussaka': {'prep': 30, 'cook': 40, 'servings': 6, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Gratin complet'},
    'pizza|burger|sandwich|wrap': {'prep': 15, 'cook': 20, 'servings': 4, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Plat tout-en-un'},
    'pâtes|spaghetti|penne|linguine|tagliatelle|fusilli': {'prep': 10, 'cook': 15, 'servings': 4, 'method': 'Cuisson à l\'eau', 'complete': True, 'needs_side': False, 'reason': 'Pâtes complètes'},
    'risotto': {'prep': 10, 'cook': 30, 'servings': 4, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Risotto complet'},
    'paella': {'prep': 20, 'cook': 40, 'servings': 6, 'method': 'Mijotage', 'complete': True, 'needs_side': False, 'reason': 'Paella complète'},
    'quiche|tarte salée': {'prep': 20, 'cook': 35, 'servings': 6, 'method': 'Cuisson au four', 'complete': True, 'needs_side': False, 'reason': 'Quiche/tarte complète'},
    r'salade.*(composée|césar|niçoise)': {'prep': 20, 'cook': 0, 'servings': 4, 'method': 'Sans cuisson', 'complete': True, 'needs_side': False, 'reason': 'Salade composée complète'},
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
            return {'prep_time_minutes': 15, 'cook_time_minutes': 10, 'servings': 4, 'cooking_method': 'Préparation simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'MEDIUM', 'reason': 'Entrée standard'}
        
        elif role == 'DESSERT':
            if 'glace' in name or 'sorbet' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6, 'cooking_method': 'Turbinage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Glace/sorbet'}
            elif 'gâteau' in name or 'cake' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 35, 'servings': 8, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Gâteau'}
            elif 'tarte' in name:
                return {'prep_time_minutes': 25, 'cook_time_minutes': 35, 'servings': 8, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Tarte'}
            elif 'mousse' in name or 'tiramisu' in name:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6, 'cooking_method': 'Sans cuisson', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Dessert froid'}
            else:
                return {'prep_time_minutes': 20, 'cook_time_minutes': 25, 'servings': 6, 'cooking_method': 'Préparation simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'LOW', 'reason': 'Dessert générique'}
        
        elif role == 'SAUCE':
            if 'bouillon' in name or 'fond' in name or 'fumet' in name:
                return {'prep_time_minutes': 15, 'cook_time_minutes': 120, 'servings': 8, 'cooking_method': 'Mijotage', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Bouillon long'}
            else:
                return {'prep_time_minutes': 5, 'cook_time_minutes': 10, 'servings': 4, 'cooking_method': 'Cuisson sur feu', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Sauce rapide'}
        
        elif role == 'ACCOMPAGNEMENT':
            if 'vapeur' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 15, 'servings': 4, 'cooking_method': 'Cuisson vapeur', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Vapeur'}
            elif 'rôti' in name or 'gratiné' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 30, 'servings': 4, 'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Four'}
            elif 'purée' in name:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4, 'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Purée'}
            elif 'riz' in name or 'pâtes' in name:
                return {'prep_time_minutes': 5, 'cook_time_minutes': 15, 'servings': 4, 'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'HIGH', 'reason': 'Féculents'}
            else:
                return {'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4, 'cooking_method': 'Cuisson simple', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'MEDIUM', 'reason': 'Accompagnement'}
        
        else:  # PLAT_PRINCIPAL
            # Valeur par défaut générique
            return {'prep_time_minutes': 20, 'cook_time_minutes': 30, 'servings': 4, 'cooking_method': 'Cuisson mixte', 'is_complete_meal': False, 'needs_side_dish': None, 'confidence': 'LOW', 'reason': 'Plat principal générique'}
    
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


# Je vais décomposer les données recettes ici
# En attendant, générer un exemple
def main():
    enricher = RecipeEnricher()
    
    print("=" * 80)
    print("GÉNÉRATION SQL D'ENRICHISSEMENT INTELLIGENT")
    print("=" * 80)
    print()
    
    # Test avec quelques exemples
    examples = [
        (2, 'Overnight porridge aux graines de chia et fruits rouges', 'ENTREE'),
        (9, 'Pancakes américains fluffy au sirop d\'érable', 'DESSERT'),
        (40, 'Œufs Bénédictine et sauce hollandaise', 'PLAT_PRINCIPAL'),
        (8775, 'Steak grillé', 'PLAT_PRINCIPAL'),
        (8776, 'Gâteau au yaourt', 'DESSERT'),
    ]
    
    print("EXEMPLES:\n")
    for recipe_id, name, role in examples:
        sql = enricher.enrich(recipe_id, name, role)
        print(sql)
    
    print(f"\n📊 STATISTIQUES:")
    print(f"   🟢 HIGH: {enricher.stats['HIGH']}")
    print(f"   🟡 MEDIUM: {enricher.stats['MEDIUM']}")
    print(f"   🔴 LOW: {enricher.stats['LOW']}")
    print("\n" + "=" * 80)
    print("✅ Système fonctionnel !")
    print("💡 Maintenant, copier les données des 1058 recettes pour générer le SQL complet")
    print("=" * 80)


if __name__ == "__main__":
    main()
