#!/usr/bin/env python3
"""
Script FINAL: Récupère TOUTES les 1058 recettes de la DB
et génère le fichier SQL complet d'enrichissement intelligent.
"""

import os
import psycopg2
from urllib.parse import urlparse
import re
from typing import Dict, Optional, Tuple, List
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv('.env.local')

# === BASE DE CONNAISSANCE CULINAIRE COMPLÈTE ===
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
}


class IntelligentRecipeEnricher:
    """Enrichit TOUTES les recettes avec vraie intelligence culinaire"""
    
    def __init__(self):
        self.enriched_count = 0
        self.confidence_stats = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    
    def enrich_recipe(self, recipe: Dict) -> Dict:
        """Enrichit UNE recette avec vraie connaissance culinaire"""
        name = recipe['name'].lower()
        role = recipe['role']
        
        # Chercher pattern exact dans la base
        for pattern, data in RECIPE_DATABASE.items():
            if re.search(pattern, name, re.IGNORECASE):
                # Adapter selon le role déclaré
                is_complete = data['complete']
                needs_side = data['needs_side']
                
                if role in ['ENTREE', 'DESSERT', 'SAUCE', 'ACCOMPAGNEMENT']:
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
        """Valeurs génériques intelligentes selon le rôle et le nom"""
        
        if role == 'ENTREE':
            return {
                'prep_time_minutes': 15,
                'cook_time_minutes': 10,
                'servings': 4,
                'cooking_method': 'Préparation simple',
                'is_complete_meal': False,
                'needs_side_dish': None,
                'confidence': 'MEDIUM',
                'reason': 'Entrée standard'
            }
        
        elif role == 'DESSERT':
            if 'glace' in name or 'sorbet' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6,
                    'cooking_method': 'Turbinage', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Glace/sorbet'
                }
            elif 'gâteau' in name or 'cake' in name or 'fondant' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 35, 'servings': 8,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Gâteau classique'
                }
            elif 'tarte' in name:
                return {
                    'prep_time_minutes': 25, 'cook_time_minutes': 35, 'servings': 8,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Tarte'
                }
            elif 'mousse' in name or 'tiramisu' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 6,
                    'cooking_method': 'Sans cuisson', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Dessert froid'
                }
            elif 'crème brûlée' in name or 'flan' in name or 'crème caramel' in name:
                return {
                    'prep_time_minutes': 15, 'cook_time_minutes': 40, 'servings': 6,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Crème cuite'
                }
            else:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 25, 'servings': 6,
                    'cooking_method': 'Préparation simple', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'LOW', 'reason': 'Dessert générique'
                }
        
        elif role == 'SAUCE':
            if 'bouillon' in name or 'fond' in name or 'fumet' in name:
                return {
                    'prep_time_minutes': 15, 'cook_time_minutes': 120, 'servings': 8,
                    'cooking_method': 'Mijotage', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Bouillon long'
                }
            else:
                return {
                    'prep_time_minutes': 5, 'cook_time_minutes': 10, 'servings': 4,
                    'cooking_method': 'Cuisson sur feu', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Sauce rapide'
                }
        
        elif role == 'ACCOMPAGNEMENT':
            if 'vapeur' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 15, 'servings': 4,
                    'cooking_method': 'Cuisson vapeur', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Vapeur'
                }
            elif 'rôti' in name or 'gratiné' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 30, 'servings': 4,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Four'
                }
            elif 'purée' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4,
                    'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'HIGH', 'reason': 'Purée standard'
                }
            else:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4,
                    'cooking_method': 'Cuisson simple', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'MEDIUM', 'reason': 'Accompagnement typique'
                }
        
        else:  # PLAT_PRINCIPAL
            # Viandes simples
            if re.search(r'\bsteak\b|\bcôte\b|\bentrecôte\b|\bbavette\b', name):
                return {
                    'prep_time_minutes': 5, 'cook_time_minutes': 10, 'servings': 4,
                    'cooking_method': 'Poêle', 'is_complete_meal': False, 'needs_side_dish': True,
                    'confidence': 'HIGH', 'reason': 'Viande simple → accompagnement'
                }
            elif 'poulet rôti' in name:
                return {
                    'prep_time_minutes': 15, 'cook_time_minutes': 60, 'servings': 4,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': True,
                    'confidence': 'HIGH', 'reason': 'Volaille rôtie → accompagnement'
                }
            elif 'poulet grillé' in name or 'poulet poêlé' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 20, 'servings': 4,
                    'cooking_method': 'Poêle', 'is_complete_meal': False, 'needs_side_dish': True,
                    'confidence': 'HIGH', 'reason': 'Volaille simple → accompagnement'
                }
            elif 'poisson au four' in name or 'poisson grillé' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 25, 'servings': 4,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': False, 'needs_side_dish': True,
                    'confidence': 'HIGH', 'reason': 'Poisson simple → accompagnement'
                }
            
            # Plats complets
            elif 'curry' in name or 'tajine' in name or 'couscous' in name or 'blanquette' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 45, 'servings': 4,
                    'cooking_method': 'Mijotage', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Plat mijoté complet'
                }
            elif 'lasagne' in name or 'gratin' in name or 'moussaka' in name:
                return {
                    'prep_time_minutes': 30, 'cook_time_minutes': 40, 'servings': 6,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Gratin complet'
                }
            elif 'pizza' in name or 'burger' in name or 'sandwich' in name or 'wrap' in name:
                return {
                    'prep_time_minutes': 15, 'cook_time_minutes': 20, 'servings': 4,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Plat tout-en-un'
                }
            elif 'pâtes' in name or 'spaghetti' in name or 'penne' in name or 'linguine' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 15, 'servings': 4,
                    'cooking_method': 'Cuisson à l\'eau', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Pâtes complètes'
                }
            elif 'risotto' in name:
                return {
                    'prep_time_minutes': 10, 'cook_time_minutes': 30, 'servings': 4,
                    'cooking_method': 'Mijotage', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Risotto complet'
                }
            elif 'paella' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 40, 'servings': 6,
                    'cooking_method': 'Mijotage', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Paella complète'
                }
            elif re.search(r'salade.*(composée|césar|niçoise)', name):
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 0, 'servings': 4,
                    'cooking_method': 'Sans cuisson', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Salade composée complète'
                }
            elif 'quiche' in name or 'tarte salée' in name:
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 35, 'servings': 6,
                    'cooking_method': 'Cuisson au four', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Quiche/tarte complète'
                }
            elif 'pot-au-feu' in name or 'potée' in name or 'cassoulet' in name:
                return {
                    'prep_time_minutes': 30, 'cook_time_minutes': 120, 'servings': 6,
                    'cooking_method': 'Mijotage', 'is_complete_meal': True, 'needs_side_dish': False,
                    'confidence': 'HIGH', 'reason': 'Plat mijoté traditionnel'
                }
            else:
                # Plat principal générique
                return {
                    'prep_time_minutes': 20, 'cook_time_minutes': 30, 'servings': 4,
                    'cooking_method': 'Cuisson mixte', 'is_complete_meal': False, 'needs_side_dish': None,
                    'confidence': 'LOW', 'reason': 'Plat principal générique'
                }
    
    def generate_sql(self, recipe_id: int, updates: Dict, name: str) -> str:
        """Génère le SQL UPDATE avec commentaire"""
        confidence = updates.get('confidence', 'LOW')
        reason = updates.get('reason', '')
        
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
        
        comment = f"-- [{confidence}] {name[:60]}"
        if reason:
            comment += f" ({reason})"
        
        return f"{comment}\n" + f"UPDATE recipes SET {', '.join(set_clauses)} WHERE id = {recipe_id};\n"


def fetch_all_recipes():
    """Récupère TOUTES les recettes de la DB"""
    database_url = os.getenv('DATABASE_URL_TX')
    if not database_url:
        raise ValueError("DATABASE_URL_TX not found in .env.local")
    
    # Extraire le mot de passe de l'URL
    parsed = urlparse(database_url)
    password = parsed.password
    
    # Construire une URL propre pour psycopg2
    clean_url = database_url.replace(f':{password}@', f':PASSWORD@')
    
    print(f"📡 Connexion à la base de données...")
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, name, role
        FROM recipes
        ORDER BY id
    """)
    
    recipes = cur.fetchall()
    cur.close()
    conn.close()
    
    print(f"✅ {len(recipes)} recettes récupérées\n")
    
    return [{'id': r[0], 'name': r[1], 'role': r[2]} for r in recipes]


def main():
    print("=" * 80)
    print("ENRICHISSEMENT INTELLIGENT COMPLET DE TOUTES LES RECETTES")
    print("=" * 80)
    print()
    
    # Récupérer toutes les recettes
    recipes = fetch_all_recipes()
    
    # Enrichir chaque recette
    enricher = IntelligentRecipeEnricher()
    sql_statements = []
    
    print("🔥 Enrichissement en cours...\n")
    
    for i, recipe in enumerate(recipes, 1):
        enriched = enricher.enrich_recipe(recipe)
        sql = enricher.generate_sql(recipe['id'], enriched, recipe['name'])
        sql_statements.append(sql)
        
        # Stats
        conf = enriched['confidence']
        enricher.confidence_stats[conf] += 1
        
        if i % 100 == 0:
            print(f"   Traité: {i}/{len(recipes)} recettes...")
    
    print(f"\n✅ {len(recipes)} recettes enrichies!")
    print(f"\n📊 STATISTIQUES DE CONFIANCE:")
    print(f"   🟢 HIGH: {enricher.confidence_stats['HIGH']} recettes")
    print(f"   🟡 MEDIUM: {enricher.confidence_stats['MEDIUM']} recettes")
    print(f"   🔴 LOW: {enricher.confidence_stats['LOW']} recettes")
    
    # Écrire le fichier SQL
    output_file = '/workspaces/garde-manger-app/tools/enrich_all_recipes_FINAL.sql'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- ============================================================================\n")
        f.write("-- ENRICHISSEMENT INTELLIGENT DE TOUTES LES RECETTES\n")
        f.write(f"-- Généré automatiquement avec intelligence culinaire\n")
        f.write(f"-- Total: {len(recipes)} recettes\n")
        f.write(f"-- HIGH confidence: {enricher.confidence_stats['HIGH']}\n")
        f.write(f"-- MEDIUM confidence: {enricher.confidence_stats['MEDIUM']}\n")
        f.write(f"-- LOW confidence: {enricher.confidence_stats['LOW']}\n")
        f.write("-- ============================================================================\n\n")
        f.write("BEGIN;\n\n")
        
        for sql in sql_statements:
            f.write(sql)
        
        f.write("\nCOMMIT;\n")
        f.write("\n-- ✅ ENRICHISSEMENT TERMINÉ!\n")
    
    print(f"\n📝 Fichier SQL généré: {output_file}")
    print(f"💾 Taille: {len(''.join(sql_statements)) // 1024} Ko")
    print("\n" + "=" * 80)
    print("🎉 PRÊT À EXÉCUTER!")
    print("=" * 80)


if __name__ == "__main__":
    main()
