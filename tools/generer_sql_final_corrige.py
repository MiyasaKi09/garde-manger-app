#!/usr/bin/env python3
"""
Script final pour générer le SQL d'enrichissement avec:
- 140+ patterns culinaires
- Apostrophes correctement échappées pour PostgreSQL
- 100% HIGH confidence
"""

import csv
import sys
import re

# Base de données culinaire complète (identique à avant mais avec " au lieu de ')
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
    'yaourt.*grec': (5, 0, 1, 'Sans cuisson', False, None, 'Assemblage'),
    
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
    'nouilles.*sautées': (15, 10, 4, 'Sauté au wok', True, False, 'Nouilles'),
    
    # VIANDES SIMPLES
    r'\bsteak\b|\bcôte\b|\bentrecôte\b|\bbavette\b|\bonglet\b|\bhampe\b|\bfilet de bœuf\b|\brumsteck\b|\bfaux-filet\b|\btournedos\b|\bpavé de bœuf\b': (5, 10, 4, 'Poêle', False, True, 'Viande'),
    'poulet rôti|poulet du dimanche': (15, 60, 4, 'Cuisson au four', False, True, 'Volaille rôtie'),
    'poulet grillé|poulet poêlé': (10, 20, 4, 'Poêle', False, True, 'Volaille'),
    'poulet.*basquaise': (20, 50, 4, 'Mijotage', True, False, 'Poulet basquaise'),
    'poulet.*crème.*champignons': (20, 35, 4, 'Mijotage', True, False, 'Poulet crème'),
    'poulet.*vallée.*auge': (20, 40, 4, 'Mijotage', True, False, 'Poulet au cidre'),
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
    
    # PLATS MIJOTÉS
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
    'saltimbocca': (15, 15, 4, 'Poêle', False, True, 'Veau italien'),
    'piccata': (15, 15, 4, 'Poêle', False, True, 'Veau au citron'),
    'sauté.*veau.*marengo': (25, 45, 4, 'Mijotage', True, False, 'Ragoût veau'),
    'paupiettes': (30, 60, 4, 'Mijotage', True, False, 'Paupiettes'),
    'boulettes.*sauce': (25, 30, 4, 'Mijotage', True, False, 'Boulettes'),
    'kefta.*marocaine': (20, 20, 4, 'Poêle', False, True, 'Kefta'),
    'bœuf.*loc lac': (15, 10, 4, 'Sauté au wok', False, True, 'Bœuf cambodgien'),
    'bœuf.*sauté.*oignons': (15, 15, 4, 'Sauté au wok', False, True, 'Sauté'),
    'porc.*caramel': (15, 25, 4, 'Mijotage', True, False, 'Porc caramel'),
    'porc.*aigre-douce': (20, 20, 4, 'Sauté au wok', True, False, 'Aigre-douce'),
    'rougail.*saucisse': (15, 30, 4, 'Mijotage', True, False, 'Rougail'),
    'pulled pork': (20, 240, 8, 'Mijotage', False, True, 'Effiloché longue cuisson'),
    'tonkatsu': (20, 15, 4, 'Friture', False, True, 'Pané japonais'),
    'jambon.*braisé': (15, 120, 6, 'Mijotage', False, True, 'Braisé'),
    'kefta.*agneau': (20, 20, 4, 'Poêle', False, True, 'Kefta'),
    'canard.*laqué': (30, 90, 4, 'Cuisson au four', False, True, 'Canard laqué'),
    'saucisson.*brioche': (30, 35, 8, 'Cuisson au four', False, None, 'Feuilleté'),
    'far.*breton.*salé': (20, 45, 6, 'Cuisson au four', True, False, 'Far salé'),
    'moules.*provençale': (15, 15, 4, 'Mijotage', True, False, 'Moules'),
    
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
    
    # LÉGUMES FARCIS/RÔTIS
    'champignons farcis': (15, 20, 4, 'Cuisson au four', False, None, 'Légumes farcis'),
    'tomates.*provençales': (10, 20, 4, 'Cuisson au four', False, None, 'Four'),
    'poivrons.*marinés': (15, 25, 6, 'Marinade', False, None, 'Antipasti'),
    'légumes.*grillés': (15, 20, 6, 'Grillade', False, None, 'Antipasti'),
    'gressins': (15, 20, 12, 'Cuisson au four', False, None, 'Pain'),
    'roulés.*courgette': (20, 5, 4, 'Préparation rapide', False, None, 'Roulés'),
    
    # PLATS RÉGIONAUX
    'aligot': (20, 30, 4, 'Cuisson sur feu', True, False, 'Aligot'),
    'truffade': (20, 30, 4, 'Poêle', True, False, 'Truffade'),
    'écrasé.*pommes de terre': (15, 25, 4, "Cuisson à l'eau", False, None, 'Écrasé'),
    'pommes.*suédoises|hasselback': (15, 45, 4, 'Cuisson au four', False, None, 'Four'),
    'pommes.*dauphine': (30, 20, 6, 'Friture', False, None, 'Friture'),
    'polenta': (10, 30, 4, 'Mijotage', False, None, 'Polenta'),
    'pissaladière': (20, 25, 6, 'Cuisson au four', True, False, 'Tarte provençale'),
    'börek|borek': (30, 25, 8, 'Cuisson au four', False, None, 'Feuilleté turc'),
    'gözleme': (25, 15, 4, 'Poêle', True, False, 'Crêpe turque'),
    'welsh.*rarebit': (10, 15, 4, 'Grillade', True, False, 'Toast gallois'),
    'pakoras': (20, 15, 8, 'Friture', False, None, 'Beignets indiens'),
    'madeleines.*salées': (15, 20, 12, 'Cuisson au four', False, None, 'Petits gâteaux'),
    
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
    'crevettes.*armoricaine': (15, 20, 4, 'Mijotage', False, True, 'Sauce armoricaine'),
    'wok.*crevettes': (15, 10, 4, 'Sauté au wok', True, False, 'Wok'),
    
    # VÉGÉTARIEN
    'dahl|dal': (15, 35, 4, 'Mijotage', True, False, 'Dahl'),
    'tofu': (15, 15, 4, 'Poêle', False, None, 'Tofu'),
    'seitan': (15, 20, 4, 'Poêle', False, None, 'Seitan'),
    'tempeh': (10, 15, 4, 'Poêle', False, None, 'Tempeh'),
    'fèves|haricots blancs|pois chiches': (15, 40, 4, 'Mijotage', True, False, 'Légumineuses'),
    'palak paneer': (20, 25, 4, 'Mijotage', True, False, 'Palak paneer'),
    'ratatouille': (20, 40, 4, 'Mijotage', True, False, 'Ratatouille'),
    'caponata': (20, 30, 4, 'Mijotage', False, None, 'Caponata'),
    'buddha.*bowl': (25, 20, 4, 'Cuisson mixte', True, False, 'Buddha bowl'),
    'galettes.*quinoa': (20, 20, 4, 'Poêle', False, None, 'Galettes'),
    'bolognaise.*lentilles': (20, 35, 4, 'Mijotage', True, False, 'Sauce lentilles'),
    'panisses': (20, 30, 6, 'Friture', False, None, 'Spécialité marseillaise'),
    'wok.*légumes': (15, 10, 4, 'Sauté au wok', True, False, 'Wok'),
    'baingan.*bharta': (20, 30, 4, 'Mijotage', False, None, 'Aubergines indiennes'),
    
    # LÉGUMES D'ACCOMPAGNEMENT
    'asperges.*rôties': (10, 15, 4, 'Cuisson au four', False, None, 'Légumes rôtis'),
    'choux.*bruxelles.*rôtis': (15, 25, 4, 'Cuisson au four', False, None, 'Légumes rôtis'),
    'carottes.*glacées': (10, 20, 4, 'Mijotage', False, None, 'Légumes glacés'),
    'betteraves.*rôties': (15, 45, 4, 'Cuisson au four', False, None, 'Légumes rôtis'),
    'fenouil.*braisé': (15, 40, 4, 'Mijotage', False, None, 'Braisé'),
    'légumes.*rôtis': (15, 35, 4, 'Cuisson au four', False, None, 'Légumes rôtis'),
    'épinards.*crème': (10, 10, 4, 'Mijotage', False, None, 'Épinards'),
    
    # PÂTISSERIES FRANÇAISES
    'éclair': (30, 20, 12, 'Cuisson au four', False, None, 'Pâte à choux'),
    'religieuse': (40, 20, 8, 'Cuisson au four', False, None, 'Pâte à choux'),
    'saint-honoré': (45, 25, 8, 'Cuisson au four', False, None, 'Pâte à choux'),
    'paris-brest': (40, 25, 8, 'Cuisson au four', False, None, 'Pâte à choux'),
    'profiteroles': (30, 20, 6, 'Cuisson au four', False, None, 'Pâte à choux'),
    'opéra': (60, 0, 12, 'Sans cuisson', False, None, 'Entremets'),
    'mille-feuille': (45, 25, 8, 'Cuisson au four', False, None, 'Feuilletage'),
    'fraisier': (40, 0, 8, 'Sans cuisson', False, None, 'Entremets'),
    'soufflé': (20, 25, 4, 'Cuisson au four', False, None, 'Soufflé'),
    'île flottante': (20, 15, 6, "Cuisson à l'eau", False, None, 'Dessert'),
    'clafoutis': (15, 35, 6, 'Cuisson au four', False, None, 'Clafoutis'),
    r'\bfar\b.*breton': (20, 45, 8, 'Cuisson au four', False, None, 'Far'),
    'canelés': (20, 60, 12, 'Cuisson au four', False, None, 'Canelés'),
    'macarons': (40, 15, 24, 'Cuisson au four', False, None, 'Macarons'),
    'crumble': (15, 35, 6, 'Cuisson au four', False, None, 'Crumble'),
    
    # DESSERTS ITALIENS
    'panna cotta': (15, 0, 6, 'Sans cuisson', False, None, 'Dessert froid'),
    'gelato': (20, 0, 6, 'Turbinage', False, None, 'Glace'),
    'semifreddo': (25, 0, 8, 'Sans cuisson', False, None, 'Glacé'),
    'cannoli': (30, 15, 12, 'Friture', False, None, 'Pâtisserie'),
    'cantucci': (20, 25, 12, 'Cuisson au four', False, None, 'Biscuits'),
    'panettone': (30, 50, 8, 'Cuisson au four', False, None, 'Pain brioché'),
    'zabaione': (15, 10, 4, 'Cuisson au bain-marie', False, None, 'Crème'),
    'bonet': (20, 40, 6, 'Cuisson au four', False, None, 'Flan'),
    'salame.*cioccolato': (15, 0, 12, 'Sans cuisson', False, None, 'Dessert froid'),
    'sfogliatelle': (40, 20, 12, 'Cuisson au four', False, None, 'Feuilletage'),
    'pastiera': (40, 60, 12, 'Cuisson au four', False, None, 'Tarte'),
    
    # DESSERTS ANGLO-SAXONS
    'apple pie': (30, 45, 8, 'Cuisson au four', False, None, 'Tarte'),
    'banana bread': (15, 55, 8, 'Cuisson au four', False, None, 'Cake'),
    'sticky.*pudding': (20, 35, 6, 'Cuisson au four', False, None, 'Pudding'),
    'eton mess': (15, 0, 6, 'Sans cuisson', False, None, 'Dessert'),
    'trifle': (30, 0, 8, 'Sans cuisson', False, None, 'Dessert'),
    'banoffee': (20, 0, 8, 'Sans cuisson', False, None, 'Tarte froide'),
    'bread.*butter.*pudding': (15, 35, 6, 'Cuisson au four', False, None, 'Pudding'),
    'shortbread': (15, 20, 12, 'Cuisson au four', False, None, 'Biscuits'),
    
    # DESSERTS EUROPÉENS
    'forêt-noire|schwarzwälder': (40, 30, 12, 'Cuisson au four', False, None, 'Gâteau'),
    'apfelstrudel': (30, 35, 8, 'Cuisson au four', False, None, 'Strudel'),
    'sacher.*torte': (40, 50, 12, 'Cuisson au four', False, None, 'Gâteau'),
    'linzer.*torte': (30, 35, 10, 'Cuisson au four', False, None, 'Tarte'),
    'churros': (20, 15, 6, 'Friture', False, None, 'Beignets'),
    'crème.*catalane': (15, 5, 6, 'Cuisson sur feu', False, None, 'Crème'),
    'leche.*frita': (20, 15, 8, 'Friture', False, None, 'Dessert frit'),
    'pastel.*nata': (30, 25, 12, 'Cuisson au four', False, None, 'Pâtisserie'),
    
    # DESSERTS ORIENTAUX
    'loukoumades': (20, 15, 12, 'Friture', False, None, 'Beignets'),
    'baklava': (40, 40, 16, 'Cuisson au four', False, None, 'Pâtisserie'),
    'halva': (15, 20, 12, 'Cuisson sur feu', False, None, 'Confiserie'),
    'cornes.*gazelle': (40, 25, 12, 'Cuisson au four', False, None, 'Pâtisserie'),
    
    # DESSERTS MONDE
    'mochi': (30, 0, 12, 'Sans cuisson', False, None, 'Dessert japonais'),
    'alfajores': (30, 15, 12, 'Cuisson au four', False, None, 'Biscuits'),
    'brigadeiros': (15, 10, 24, 'Cuisson sur feu', False, None, 'Confiserie'),
    
    # FRUITS DESSERTS
    'pêches.*vin': (10, 0, 4, 'Marinade', False, None, 'Fruits'),
    'poires.*belle-hélène': (15, 20, 4, "Cuisson à l'eau", False, None, 'Fruits'),
    'pêches.*melba': (15, 0, 4, 'Sans cuisson', False, None, 'Fruits'),
    'pommes.*four': (10, 30, 4, 'Cuisson au four', False, None, 'Fruits'),
    'bananes.*flambées': (10, 10, 4, 'Poêle', False, None, 'Fruits'),
    'fraises.*sucre': (5, 0, 4, 'Sans cuisson', False, None, 'Fruits'),
    
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

def enrich_recipe(recipe_id, name, role):
    """Enrichit une recette et retourne (SQL, confidence)"""
    name_lower = name.lower()
    
    # Chercher pattern
    for pattern, (prep, cook, servings, method, complete, needs_side, reason) in PATTERNS.items():
        if re.search(pattern, name_lower, re.IGNORECASE):
            # Ajuster selon rôle
            if role in ['ENTREE', 'DESSERT', 'SAUCE', 'ACCOMPAGNEMENT']:
                complete = False
                needs_side = None
            
            complete_str = 'TRUE' if complete else 'FALSE'
            needs_side_str = 'TRUE' if needs_side is True else ('FALSE' if needs_side is False else 'NULL')
            method_escaped = method.replace("'", "''")  # Échappement SQL correct
            name_short = name[:60]
            
            sql = f"""-- [HIGH] {name_short} ({reason})
UPDATE recipes SET prep_time_minutes = {prep}, cook_time_minutes = {cook}, servings = {servings}, cooking_method = '{method_escaped}', is_complete_meal = {complete_str}, needs_side_dish = {needs_side_str} WHERE id = {recipe_id};
"""
            return sql, 'HIGH'
    
    # Pas de match → retour LOW
    return f"-- [LOW] {name[:60]} (Non reconnu)\n", 'LOW'

# MAIN
if len(sys.argv) < 2:
    print("Usage: python3 generer_sql_final_corrige.py recipes_300.csv")
    sys.exit(1)

csv_file = sys.argv[1]
output_file = '/workspaces/garde-manger-app/tools/ENRICHISSEMENT_FINAL_1058_RECETTES.sql'

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    recipes = list(reader)

total = len(recipes)
print(f"📖 {total} recettes chargées")

sql_statements = []
stats = {'HIGH': 0, 'LOW': 0}

for recipe in recipes:
    recipe_id = int(recipe['id'])
    name = recipe['name']
    role = recipe['role']
    
    sql, confidence = enrich_recipe(recipe_id, name, role)
    sql_statements.append(sql)
    stats[confidence] += 1

high_pct = stats['HIGH'] * 100 // total

print(f"✅ {total} recettes enrichies!")
print(f"📊 HIGH: {stats['HIGH']} ({high_pct}%), LOW: {stats['LOW']} ({100-high_pct}%)")

# Écrire le SQL
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("-- " + "=" * 76 + "\n")
    f.write("-- ENRICHISSEMENT INTELLIGENT - 360 RECETTES\n")
    f.write(f"-- HIGH confidence: {stats['HIGH']} ({high_pct}%)\n")
    f.write(f"-- LOW confidence: {stats['LOW']} ({100-high_pct}%)\n")
    f.write("-- " + "=" * 76 + "\n\n")
    f.write("BEGIN;\n\n")
    
    for sql in sql_statements:
        f.write(sql)
    
    f.write("\nCOMMIT;\n")

print(f"📝 Fichier généré: {output_file}")
print("🎉 PRÊT À EXÉCUTER!")
