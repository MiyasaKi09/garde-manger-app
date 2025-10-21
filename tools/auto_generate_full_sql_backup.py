#!/usr/bin/env python3
"""
SCRIPT AUTOMATIQUE COMPLET
Récupère les 1058 recettes de la DB et génère le SQL d'enrichissement final
Prêt à exécuter !
"""

import re
from typing import Dict, Tuple

# === BASE DE CONNAISSANCE CULINAIRE COMPLÈTE ===
PATTERNS = {
    # PETIT-DÉJEUNER
    'overnight porridge': (10, 480, 2, 'Sans cuisson', True, False, 'Trempage 8h'),
    'porridge salé': (10, 15, 2, 'Mijotage', True, False, 'Version salée'),
    'porridge': (5, 10, 2, 'Mijotage', True, False, 'Porridge'),
    'pudding de chia': (10, 240, 4, 'Sans cuisson', True, False, 'Trempage 4h'),
    'granola': (10, 30, 8, 'Cuisson au four', True, False, 'Four'),
    'muesli': (10, 480, 4, 'Sans cuisson', True, False, 'Trempage'),
    'pancakes': (10, 15, 4, 'Poêle', True, False, 'Poêle'),
    'œufs bénédictine': (15, 20, 2, 'Cuisson mixte', True, False, 'Œufs pochés + hollandaise'),
    'œuf poché.*toast': (10, 10, 2, "Cuisson à l'eau", True, False, 'Toast + œuf'),
    'œufs au plat.*bacon': (5, 10, 2, 'Poêle', True, False, 'English breakfast'),
    'full english breakfast': (15, 25, 2, 'Cuisson mixte', True, False, 'Complet anglais'),
    'yaourt.*miel.*noix': (5, 0, 1, 'Sans cuisson', True, False, 'Assemblage'),
    'shakshuka': (15, 25, 4, 'Mijotage', True, False, 'Œufs en sauce'),
    'huevos rotos': (10, 20, 4, 'Poêle', True, False, 'Frites + œufs'),
    'pan con tomate': (5, 5, 4, 'Grillage', False, None, 'Tapas'),
    'tamagoyaki': (10, 10, 2, 'Poêle', False, None, 'Omelette'),
    
    # SOUPES
    'gaspacho|gazpacho': (20, 0, 4, 'Sans cuisson', False, None, 'Soupe froide'),
    'salmorejo': (15, 0, 4, 'Sans cuisson', False, None, 'Soupe froide'),
    'velouté|crème de|potage': (15, 25, 4, 'Mijotage', False, None, 'Soupe'),
    'soupe à l\'oignon': (20, 45, 4, 'Cuisson au four', False, None, 'Soupe gratinée'),
    'minestrone|harira|chorba': (20, 40, 6, 'Mijotage', True, False, 'Soupe-repas'),
    'bisque': (30, 40, 4, 'Mijotage', False, None, 'Bisque'),
    'bouillabaisse|bourride': (30, 40, 6, 'Mijotage', True, False, 'Soupe poisson'),
    
    # TAPAS/MEZZE
    'houmous|hummus': (10, 0, 6, 'Sans cuisson', False, None, 'Tartinade'),
    'baba ganoush|moutabal': (15, 30, 6, 'Cuisson au four', False, None, 'Aubergines'),
    'tzatziki': (15, 0, 6, 'Sans cuisson', False, None, 'Sauce grecque'),
    'tapenade|tartinade|rillettes': (10, 0, 6, 'Sans cuisson', False, None, 'Tartinable'),
    'guacamole': (10, 0, 4, 'Sans cuisson', False, None, 'Avocat'),
    'bruschetta': (10, 5, 4, 'Grillage', False, None, 'Pain grillé'),
    'crostini': (15, 10, 8, 'Cuisson au four', False, None, 'Toasts'),
    'patatas bravas': (15, 30, 4, 'Friture', False, None, 'Tapas'),
    'croquetas': (30, 20, 8, 'Friture', False, None, 'Croquettes'),
    'pimientos de padrón': (5, 10, 4, 'Poêle', False, None, 'Poivrons'),
    'gambas al ajillo': (10, 5, 4, 'Poêle', False, None, 'Crevettes'),
    'falafel': (20, 15, 4, 'Friture', False, None, 'Boulettes'),
    'samoussas|samosas': (40, 12, 8, 'Friture', False, None, 'Friture'),
    'nems': (40, 12, 8, 'Friture', False, None, 'Friture'),
    'rouleaux de printemps': (30, 0, 8, 'Sans cuisson', False, None, 'Roulage'),
    'accras|arancini': (25, 18, 8, 'Friture', False, None, 'Beignets'),
    'artichauts': (15, 30, 4, 'Mijotage', False, None, 'Cuisson longue'),
    'blinis': (15, 15, 12, 'Poêle', False, None, 'Blinis'),
    'feuilletés': (20, 25, 8, 'Cuisson au four', False, None, 'Feuilletés'),
    'gougères': (20, 25, 12, 'Cuisson au four', False, None, 'Gougères'),
    'cake salé|muffins salés': (15, 35, 8, 'Cuisson au four', False, None, 'Cake'),
    
    # ASIATIQUE
    'bò bún|bo bun': (30, 15, 4, 'Cuisson mixte', True, False, 'Nouilles'),
    'pad thaï|pad thai': (30, 15, 4, 'Sauté au wok', True, False, 'Nouilles'),
    'pho': (30, 120, 4, 'Mijotage', True, False, 'Soupe vietnamienne'),
    'ramen': (30, 120, 4, 'Mijotage', True, False, 'Bouillon + nouilles'),
    'bibimbap|oyakodon|katsudon|gyudon': (20, 15, 4, 'Cuisson mixte', True, False, 'Bowl'),
    'bulgogi|teriyaki': (15, 12, 4, 'Poêle', False, True, 'Viande marinée'),
    'riz cantonais': (15, 10, 4, 'Sauté au wok', True, False, 'Riz sauté'),
    'nasi goreng': (15, 10, 4, 'Sauté au wok', True, False, 'Riz sauté'),
    'yaki soba|yakisoba': (15, 10, 4, 'Sauté au wok', True, False, 'Nouilles sautées'),
    'udon': (10, 15, 4, "Cuisson à l'eau", True, False, 'Nouilles'),
    'soba': (10, 8, 4, "Cuisson à l'eau", True, False, 'Nouilles'),
    'japchae': (25, 15, 4, 'Sauté au wok', True, False, 'Nouilles'),
    'laksa': (25, 30, 4, 'Mijotage', True, False, 'Soupe épicée'),
    'kimchi jjigae|tteokbokki': (15, 20, 4, 'Mijotage', True, False, 'Ragoût coréen'),
    'onigiri': (15, 0, 4, 'Sans cuisson', False, None, 'Boules riz'),
    'congee': (10, 45, 4, 'Mijotage', True, False, 'Porridge riz'),
    'dan dan': (20, 15, 4, 'Cuisson mixte', True, False, 'Nouilles'),
    
    # VIANDES SIMPLES
    r'\bsteak\b|\bcôte\b|\bentrecôte\b|\bbavette\b|\bonglet\b|\bhampe\b|\bfilet de bœuf\b|\brumsteck\b|\bfaux-filet\b|\btournedos\b|\bpavé de bœuf\b': (5, 10, 4, 'Poêle', False, True, 'Viande'),
    'poulet rôti|poulet du dimanche': (15, 60, 4, 'Cuisson au four', False, True, 'Volaille rôtie'),
    'poulet grillé|poulet poêlé': (10, 20, 4, 'Poêle', False, True, 'Volaille'),
    'escalope.*poulet|escalope.*veau': (10, 12, 4, 'Poêle', False, True, 'Escalope'),
    'magret de canard': (10, 15, 4, 'Poêle', False, True, 'Magret'),
    'côtelettes.*agneau': (10, 15, 4, 'Poêle', False, True, 'Agneau'),
    'gigot': (15, 90, 6, 'Cuisson au four', False, True, 'Rôti'),
    'carré d\'agneau': (10, 25, 4, 'Cuisson au four', False, True, 'Agneau'),
    'rôti de|filet mignon': (15, 45, 6, 'Cuisson au four', False, True, 'Rôti'),
    'côtes de porc': (10, 20, 4, 'Poêle', False, True, 'Porc'),
    'travers de porc|ribs': (15, 90, 4, 'Cuisson au four', False, True, 'Travers'),
    'saucisses.*purée': (10, 20, 4, 'Poêle', True, False, 'Plat complet'),
    'andouillette|boudin': (5, 15, 4, 'Poêle', False, True, 'Charcuterie'),
    
    # PLATS MIJOTÉS COMPLETS
    'curry|tikka masala|korma': (20, 45, 4, 'Mijotage', True, False, 'Curry'),
    'tajine|tagine': (20, 60, 4, 'Mijotage', True, False, 'Tajine'),
    'couscous': (30, 60, 6, 'Mijotage', True, False, 'Couscous'),
    'blanquette': (25, 120, 6, 'Mijotage', True, False, 'Blanquette'),
    'bourguignon': (30, 150, 6, 'Mijotage', True, False, 'Bourguignon'),
    'carbonnade': (25, 120, 6, 'Mijotage', True, False, 'Carbonnade'),
    'daube': (30, 180, 6, 'Mijotage', True, False, 'Daube'),
    'navarin': (25, 90, 6, 'Mijotage', True, False, 'Navarin'),
    'pot-au-feu|poule au pot': (30, 180, 6, 'Mijotage', True, False, 'Plat traditionnel'),
    'potée': (30, 150, 6, 'Mijotage', True, False, 'Potée'),
    'cassoulet': (40, 180, 8, 'Cuisson au four', True, False, 'Cassoulet'),
    'chili con carne|chili sin carne': (20, 45, 6, 'Mijotage', True, False, 'Chili'),
    'goulash|goulasch': (20, 90, 4, 'Mijotage', True, False, 'Goulash'),
    'stroganoff': (20, 30, 4, 'Mijotage', True, False, 'Stroganoff'),
    'osso buco|osso-buco': (25, 120, 4, 'Mijotage', True, False, 'Osso buco'),
    'coq au vin': (30, 120, 4, 'Mijotage', True, False, 'Coq au vin'),
    'waterzooi': (25, 40, 4, 'Mijotage', True, False, 'Waterzooi'),
    'marmitako': (25, 40, 4, 'Mijotage', True, False, 'Marmitako'),
    'zarzuela': (30, 40, 6, 'Mijotage', True, False, 'Zarzuela'),
    'civet': (30, 150, 6, 'Mijotage', True, False, 'Civet'),
    'lapin à la moutarde|lapin chasseur': (20, 60, 4, 'Mijotage', True, False, 'Lapin'),
    'bœuf carottes': (25, 120, 6, 'Mijotage', True, False, 'Bœuf carottes'),
    
    # GRATINS/FOUR
    'lasagne': (30, 40, 6, 'Cuisson au four', True, False, 'Lasagnes'),
    'gratin|moussaka': (30, 40, 6, 'Cuisson au four', True, False, 'Gratin'),
    'parmentier': (30, 40, 6, 'Cuisson au four', True, False, 'Parmentier'),
    'aubergines à la parmesane': (30, 40, 4, 'Cuisson au four', True, False, 'Gratin'),
    'cannellonis': (30, 35, 4, 'Cuisson au four', True, False, 'Cannellonis'),
    'endives.*jambon': (20, 35, 4, 'Cuisson au four', True, False, 'Endives jambon'),
    
    # TOUT-EN-UN
    'pizza': (20, 15, 4, 'Cuisson au four', True, False, 'Pizza'),
    'calzone': (20, 20, 4, 'Cuisson au four', True, False, 'Calzone'),
    'flammenkueche|tarte flambée': (15, 15, 4, 'Cuisson au four', True, False, 'Tarte flambée'),
    'burger': (15, 15, 4, 'Poêle', True, False, 'Burger'),
    'hot-dog|hot dog': (10, 10, 4, 'Poêle', True, False, 'Hot-dog'),
    'sandwich|wrap': (10, 5, 4, 'Préparation rapide', True, False, 'Sandwich'),
    'croque-monsieur|croque-madame': (10, 15, 4, 'Cuisson au four', True, False, 'Croque'),
    'kebab|gyros|shawarma': (15, 15, 4, 'Préparation rapide', True, False, 'Kebab'),
    'bagel': (10, 5, 2, 'Préparation rapide', True, False, 'Bagel'),
    'quiche|tarte salée': (20, 35, 6, 'Cuisson au four', True, False, 'Quiche'),
    'empanadas|arepas': (30, 25, 6, 'Cuisson au four', True, False, 'Empanadas'),
    'galettes.*sarrasin': (15, 20, 4, 'Poêle', True, False, 'Galettes'),
    
    # PÂTES & RIZ
    'pâtes|spaghetti|penne|linguine|tagliatelle|fusilli|macaroni': (10, 12, 4, "Cuisson à l'eau", True, False, 'Pâtes'),
    'risotto': (10, 30, 4, 'Mijotage', True, False, 'Risotto'),
    'paella': (20, 40, 6, 'Mijotage', True, False, 'Paella'),
    'fideuà': (20, 35, 4, 'Mijotage', True, False, 'Fideuà'),
    'gnocchi': (15, 10, 4, "Cuisson à l'eau", True, False, 'Gnocchis'),
    'ravioli': (15, 10, 4, "Cuisson à l'eau", True, False, 'Raviolis'),
    'one pot pasta': (10, 15, 4, 'Mijotage', True, False, 'One pot'),
    
    # SALADES COMPOSÉES
    r'salade.*(composée|césar|niçoise|bowl|buddha)': (20, 0, 4, 'Sans cuisson', True, False, 'Salade complète'),
    'coleslaw': (15, 0, 6, 'Sans cuisson', False, None, 'Salade chou'),
    'fattoush|taboulé|tabbouleh': (20, 0, 4, 'Sans cuisson', True, False, 'Salade orientale'),
    
    # POISSONS
    'saumon.*unilatérale|saumon.*plancha': (10, 12, 4, 'Poêle', False, True, 'Poisson'),
    'saumon.*papillote|saumon au four': (15, 20, 4, 'Cuisson au four', False, True, 'Poisson'),
    'saumon teriyaki': (10, 15, 4, 'Poêle', False, True, 'Poisson'),
    'gravlax': (15, 0, 6, 'Marinade', False, None, 'Saumon mariné'),
    'cabillaud|dorade|sole|thon.*cuit|filet.*poisson': (10, 20, 4, 'Cuisson au four', False, True, 'Poisson'),
    'fish and chips': (20, 20, 4, 'Friture', True, False, 'Fish & chips'),
    'sardines|maquereaux': (10, 15, 4, 'Grillade', False, True, 'Poisson'),
    'moules marinières|moules.*crème': (15, 15, 4, 'Mijotage', True, False, 'Moules'),
    'saint-jacques': (10, 5, 4, 'Poêle', False, True, 'Coquilles'),
    'crevettes sautées|crevettes.*ail': (10, 8, 4, 'Poêle', False, True, 'Crevettes'),
    'calamars|encornets|seiches|poulpe': (15, 20, 4, 'Poêle', False, True, 'Fruits de mer'),
    'brandade': (20, 30, 4, 'Cuisson au four', True, False, 'Brandade'),
    'aïoli provençal': (30, 30, 6, "Cuisson à l'eau", True, False, 'Aïoli'),
    'lotte|raie': (15, 25, 4, 'Cuisson au four', False, True, 'Poisson'),
    
    # VÉGÉTARIEN
    'dahl|dal': (15, 35, 4, 'Mijotage', True, False, 'Dahl'),
    'tofu': (15, 15, 4, 'Poêle', False, None, 'Tofu'),
    'seitan': (15, 20, 4, 'Poêle', False, None, 'Seitan'),
    'tempeh': (10, 15, 4, 'Poêle', False, None, 'Tempeh'),
    'fèves|haricots blancs|pois chiches': (15, 40, 4, 'Mijotage', True, False, 'Légumineuses'),
    'palak paneer': (20, 25, 4, 'Mijotage', True, False, 'Palak paneer'),
    'ratatouille': (20, 40, 4, 'Mijotage', True, False, 'Ratatouille'),
    'caponata': (20, 30, 4, 'Mijotage', False, None, 'Caponata'),
    
    # PLATS DIVERS
    'ceviche': (20, 0, 4, 'Marinade', False, None, 'Ceviche'),
    'carpaccio': (15, 0, 4, 'Sans cuisson', False, None, 'Carpaccio'),
    'tartare': (15, 0, 4, 'Sans cuisson', False, None, 'Tartare'),
    'pastilla': (40, 45, 6, 'Cuisson au four', True, False, 'Pastilla'),
    'feijoada': (30, 120, 6, 'Mijotage', True, False, 'Feijoada'),
    'mafé': (25, 45, 4, 'Mijotage', True, False, 'Mafé'),
    'yassa': (20, 40, 4, 'Mijotage', True, False, 'Yassa'),
    'doro wat': (25, 60, 4, 'Mijotage', True, False, 'Doro wat'),
    'injera': (15, 0, 8, 'Fermentation', False, None, 'Injera'),
    'koshari': (20, 25, 4, 'Cuisson mixte', True, False, 'Koshari'),
}

def enrich_recipe(recipe_id: int, name: str, role: str) -> Tuple[str, str]:
    """
    Enrichit une recette et retourne (SQL, confidence)
    """
    name_lower = name.lower()
    
    # Chercher pattern dans la base
    for pattern, (prep, cook, servings, method, complete, needs_side, reason) in PATTERNS.items():
        if re.search(pattern, name_lower, re.IGNORECASE):
            # Ajuster selon rôle
            if role in ['ENTREE', 'DESSERT', 'SAUCE', 'ACCOMPAGNEMENT']:
                complete = False
                needs_side = None
            
            complete_str = 'TRUE' if complete else 'FALSE'
            needs_side_str = 'TRUE' if needs_side is True else ('FALSE' if needs_side is False else 'NULL')
            method_escaped = method.replace("'", "''")
            name_short = name[:60]
            
            sql = f"""-- [HIGH] {name_short} ({reason})
UPDATE recipes SET prep_time_minutes = {prep}, cook_time_minutes = {cook}, servings = {servings}, cooking_method = '{method_escaped}', is_complete_meal = {complete_str}, needs_side_dish = {needs_side_str} WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
    
    # Pas de match → générique selon rôle
    return generate_generic(recipe_id, name, name_lower, role)

def generate_generic(recipe_id: int, name: str, name_lower: str, role: str) -> Tuple[str, str]:
    """Génère valeurs génériques selon le rôle"""
    name_short = name[:60]
    
    if role == 'ENTREE':
        if 'soupe' in name_lower or 'velouté' in name_lower or 'potage' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        sql = f"""-- [MEDIUM] {name_short} (Entrée)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Préparation simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
        return sql, 'MEDIUM'
    
    elif role == 'DESSERT':
        if 'glace' in name_lower or 'sorbet' in name_lower or 'gelato' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Glace)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Turbinage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'gâteau' in name_lower or 'cake' in name_lower or 'fondant' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Gâteau)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'tarte' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Tarte)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'mousse' in name_lower or 'tiramisu' in name_lower or 'panna cotta' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Dessert froid)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'crème brûlée' in name_lower or 'flan' in name_lower or 'crème caramel' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Crème cuite)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'cookie' in name_lower or 'brownie' in name_lower or 'muffin' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Petits gâteaux)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'clafoutis' in name_lower or 'crumble' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Dessert fruits)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'compote' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Compote)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'macaron' in name_lower or 'éclair' in name_lower or 'profiterole' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Pâtisserie)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'pain' in name_lower or 'brioche' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Pain/brioche)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        else:
            sql = f"""-- [LOW] {name_short} (Dessert)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 6, cooking_method = 'Préparation simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'LOW'
    
    elif role == 'SAUCE':
        if 'bouillon' in name_lower or 'fond' in name_lower or 'fumet' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Bouillon)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 120, servings = 8, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        else:
            sql = f"""-- [HIGH] {name_short} (Sauce)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
    
    elif role == 'ACCOMPAGNEMENT':
        if 'vapeur' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Vapeur)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'rôti' in name_lower or 'gratiné' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Four)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'purée' in name_lower or 'écrasé' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Purée)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l\\'eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'riz' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Riz)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson à l\\'eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'pâtes' in name_lower or 'spaghetti' in name_lower or 'penne' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Pâtes)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l\\'eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'frites' in name_lower or 'pommes' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Pommes de terre)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        elif 'sauté' in name_lower:
            sql = f"""-- [HIGH] {name_short} (Sauté)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
        else:
            sql = f"""-- [MEDIUM] {name_short} (Accompagnement)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson simple', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
            return sql, 'MEDIUM'
    
    else:  # PLAT_PRINCIPAL
        sql = f"""-- [LOW] {name_short} (Plat principal)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = {recipe_id};
"""
        return sql, 'LOW'


print("=" * 80)
print("🚀 GÉNÉRATION AUTOMATIQUE DU SQL D'ENRICHISSEMENT COMPLET")
print("=" * 80)
print()
print("📡 Lecture du CSV des recettes...")

# Lire le CSV (à créer manuellement ou via script)
import sys
import csv

if len(sys.argv) < 2:
    print("❌ Usage: python3 auto_generate_full_sql.py <recipes.csv>")
    print()
    print("💡 Pour créer le CSV, utilisez:")
    print("   psql \"$DATABASE_URL_TX\" -c \"\\COPY (SELECT id, name, role FROM recipes ORDER BY id) TO 'recipes_all.csv' CSV HEADER\"")
    print()
    print("   OU copiez les résultats de pgsql_query dans un fichier CSV")
    sys.exit(1)

csv_file = sys.argv[1]
output_file = '/workspaces/garde-manger-app/tools/ENRICHISSEMENT_FINAL_1058_RECETTES.sql'

try:
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        recipes = list(reader)
except FileNotFoundError:
    print(f"❌ Fichier introuvable: {csv_file}")
    sys.exit(1)

total = len(recipes)
print(f"✅ {total} recettes chargées")
print()
print("🔥 Enrichissement intelligent en cours...")
print()

sql_statements = []
stats = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}

for i, recipe in enumerate(recipes, 1):
    recipe_id = int(recipe['id'])
    name = recipe['name']
    role = recipe['role']
    
    sql, confidence = enrich_recipe(recipe_id, name, role)
    sql_statements.append(sql)
    stats[confidence] += 1
    
    if i % 100 == 0:
        print(f"   ✓ {i}/{total} recettes enrichies...")

print()
print(f"✅ {total} recettes enrichies avec succès!")
print()
print("📊 STATISTIQUES DE CONFIANCE:")
high_pct = stats['HIGH'] * 100 // total
medium_pct = stats['MEDIUM'] * 100 // total
low_pct = stats['LOW'] * 100 // total
print(f"   🟢 HIGH: {stats['HIGH']} recettes ({high_pct}%)")
print(f"   🟡 MEDIUM: {stats['MEDIUM']} recettes ({medium_pct}%)")
print(f"   🔴 LOW: {stats['LOW']} recettes ({low_pct}%)")
print()

# Écrire le fichier SQL
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("-- " + "=" * 76 + "\n")
    f.write("-- ENRICHISSEMENT INTELLIGENT COMPLET DE TOUTES LES RECETTES\n")
    f.write("-- Généré automatiquement avec intelligence culinaire avancée\n")
    f.write("-- Date: 2025-10-20\n")
    f.write(f"-- Total: {total} recettes\n")
    f.write(f"-- HIGH confidence: {stats['HIGH']} ({high_pct}%)\n")
    f.write(f"-- MEDIUM confidence: {stats['MEDIUM']} ({medium_pct}%)\n")
    f.write(f"-- LOW confidence: {stats['LOW']} ({low_pct}%)\n")
    f.write("-- " + "=" * 76 + "\n\n")
    f.write("BEGIN;\n\n")
    
    for sql in sql_statements:
        f.write(sql)
    
    f.write("\nCOMMIT;\n\n")
    f.write("-- " + "=" * 76 + "\n")
    f.write("-- ✅ ENRICHISSEMENT TERMINÉ\n")
    f.write("-- Toutes les recettes ont été enrichies avec des valeurs réalistes\n")
    f.write("-- Prêt à exécuter dans votre base de données!\n")
    f.write("-- " + "=" * 76 + "\n")

file_size_kb = sum(len(s.encode('utf-8')) for s in sql_statements) // 1024

print(f"📝 Fichier SQL généré: {output_file}")
print(f"💾 Taille: {file_size_kb} Ko")
print(f"📄 Lignes SQL: {len(sql_statements) * 2}")
print()
print("=" * 80)
print("🎉 SUCCÈS! FICHIER SQL PRÊT À EXÉCUTER!")
print("=" * 80)
print()
print("📌 Prochaine étape:")
print("   1. Ouvrez le fichier SQL dans VS Code")
print("   2. Sélectionnez tout (Ctrl+A)")
print("   3. Exécutez avec F5 ou via pgsql_modify")
print()
